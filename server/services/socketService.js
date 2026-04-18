const { WebSocket } = require('ws');

class SocketService {
  constructor(wss, logger) {
    this.wss = wss;
    this.logger = logger;
    this.rooms = new Map();
    this.clients = new Map();
  }

  handleConnection(ws) {
    this.logger.ws('New connection established');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.processMessage(ws, message);
      } catch (e) {
        this.logger.error('Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });
  }

  processMessage(ws, message) {
    switch (message.type) {
      case 'join':
        this.handleJoin(ws, message);
        break;
      case 'control':
        this.broadcastToRoom(ws, message);
        break;
      case 'pong':
        this.clients.get(ws).isAlive = true;
        break;
    }
  }

  handleJoin(ws, { room, clientType }) {
    const clientInfo = { room, clientType, ws, isAlive: true };
    this.clients.set(ws, clientInfo);
    
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room).add(clientInfo);
    
    this.logger.ws(`Client joined ${room} as ${clientType}`);
    ws.send(JSON.stringify({ type: 'joined', room }));
  }

  handleDisconnect(ws) {
    const info = this.clients.get(ws);
    if (info) {
      this.rooms.get(info.room)?.delete(info);
      this.clients.delete(ws);
      this.logger.ws('Client disconnected');
    }
  }

  broadcastToRoom(ws, message) {
    const info = this.clients.get(ws);
    if (!info) return;

    const room = this.rooms.get(info.room);
    if (room) {
      room.forEach(client => {
        if (client.clientType === 'receiver' && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'control',
            payload: message.payload
          }));
        }
      });
    }
  }
}

module.exports = SocketService;
