const WebSocket = require('ws');

// Configuration
const SERVER_URL = 'ws://localhost:3000';
const ROOM_CODE = 'TEST1234'; // Change this to your paired code

function connect() {
    console.log(`[Receiver] Connecting to ${SERVER_URL}...`);
    const ws = new WebSocket(SERVER_URL);

    ws.on('open', () => {
        console.log('[Receiver] Connected to server.');
        ws.send(JSON.stringify({
            type: 'join',
            room: ROOM_CODE,
            clientType: 'receiver'
        }));
    });

    ws.on('message', (data) => {
        const message = JSON.parse(data);

        switch (message.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
            case 'joined':
                console.log(`[Receiver] Successfully joined room: ${ROOM_CODE}`);
                break;
            case 'control':
                const { action, ...payload } = message.payload;
                console.log(`[Action] ${action}`, payload);
                // Here you would integrate with 'robotjs' or similar tools
                // handleInput(action, payload);
                break;
        }
    });

    ws.on('close', () => {
        console.log('[Receiver] Disconnected. Reconnecting in 3 seconds...');
        setTimeout(connect, 3000);
    });

    ws.on('error', (err) => {
        console.error('[Receiver] Error:', err.message);
    });
}

connect();
