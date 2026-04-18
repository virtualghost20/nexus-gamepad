const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const logger = require('./utils/logger');
const SocketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const socketService = new SocketService(wss, logger);

wss.on('connection', (ws) => {
    socketService.handleConnection(ws);
});

// Heartbeat
setInterval(() => {
    socketService.clients.forEach((info, ws) => {
        if (info.isAlive === false) return ws.terminate();
        info.isAlive = false;
        ws.send(JSON.stringify({ type: 'ping' }));
    });
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
});
