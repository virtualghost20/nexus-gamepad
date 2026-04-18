import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ClientInfo {
  id: string;
  room: string;
  type: "controller" | "receiver";
  ws: WebSocket;
  isAlive: boolean;
}

const rooms = new Map<string, Set<ClientInfo>>();
const clients = new Map<WebSocket, ClientInfo>();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = createServer(app);

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    // Disable socket timeout as requested
    // @ts-ignore - _socket is internal but accessible
    if (ws._socket) ws._socket.setTimeout(0);

    let clientInfo: ClientInfo | null = null;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "join": {
            const { room, clientType } = message;
            if (!room || !clientType) return;

            // Cleanup old room if re-joining
            if (clientInfo) {
              const oldRoom = rooms.get(clientInfo.room);
              oldRoom?.delete(clientInfo);
            }

            clientInfo = {
              id: Math.random().toString(36).substring(7),
              room,
              type: clientType,
              ws,
              isAlive: true
            };

            clients.set(ws, clientInfo);

            if (!rooms.has(room)) {
              rooms.set(room, new Set());
            }
            rooms.get(room)!.add(clientInfo);

            console.log(`[WS] Client joined room: ${room} as ${clientType}`);
            ws.send(JSON.stringify({ type: "joined", id: clientInfo.id }));
            break;
          }

          case "control": {
            if (!clientInfo) return;
            // Route control messages from controllers to receivers in the same room
            const roomClients = rooms.get(clientInfo.room);
            if (roomClients) {
              roomClients.forEach((client) => {
                if (client.type === "receiver" && client.ws.readyState === WebSocket.OPEN) {
                  client.ws.send(JSON.stringify({
                    type: "control",
                    payload: message.payload,
                    from: clientInfo?.id
                  }));
                }
              });
            }
            break;
          }

          case "pong": {
            if (clientInfo) clientInfo.isAlive = true;
            break;
          }
        }
      } catch (err) {
        console.error("[WS] Failed to parse message", err);
      }
    });

    ws.on("close", () => {
      if (clientInfo) {
        console.log(`[WS] Client disconnected: ${clientInfo.id}`);
        const roomClients = rooms.get(clientInfo.room);
        roomClients?.delete(clientInfo);
        if (roomClients?.size === 0) {
          rooms.delete(clientInfo.room);
        }
        clients.delete(ws);
      }
    });

    ws.on("error", console.error);
  });

  // Heartbeat system (30s)
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = clients.get(ws);
      if (client) {
        if (client.isAlive === false) {
          console.log(`[WS] Terminating inactive client: ${client.id}`);
          return ws.terminate();
        }
        client.isAlive = false;
        ws.send(JSON.stringify({ type: "ping" }));
      }
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus Remote Server running on http://localhost:${PORT}`);
  });
}

startServer();
