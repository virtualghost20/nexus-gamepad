const WebSocket = require('ws');
const robot = require('robotjs'); // Note: robotjs requires native build, might not work in all environments without setup

/**
 * Nexus Remote Receiver
 * Connects to the server, joins a room, and executes system commands.
 */

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:3000';
const ROOM_CODE = process.env.ROOM_CODE || '123456';

console.log(`[RECEIVER] Connecting to ${SERVER_URL}...`);

const ws = new WebSocket(SERVER_URL);

ws.on('open', () => {
    console.log('[RECEIVER] Connected to server.');
    ws.send(JSON.stringify({
        type: 'join',
        room: ROOM_CODE,
        clientType: 'receiver'
    }));
});

ws.on('message', (data) => {
    try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
        }

        if (msg.type === 'control') {
            const payload = msg.payload || {};
            const action = payload.action || msg.action;

            console.log(`[ACTION] ${action}`, payload);

            // Handle actions (Simulated for this script)
            switch (action) {
                case 'MOVE':
                case 'L_STICK':
                case 'R_STICK': {
                    const { x, y } = payload;
                    console.log(`[MOUSE] Moving to offset: ${x}, ${y}`);
                    // Example with robotjs:
                    // const mouse = robot.getMousePos();
                    // robot.moveMouse(mouse.x + x * 20, mouse.y + y * 20);
                    break;
                }
                case 'BTN_A':
                case 'BUTTON_A':
                    console.log('[KEY] Triggering Action A');
                    // robot.keyTap('enter');
                    break;
                case 'DPAD_UP':
                    console.log('[KEY] Arrow Up');
                    // robot.keyTap('up');
                    break;
                default:
                    console.log(`[LOG] Unhandled action: ${action}`);
            }
        }
    } catch (err) {
        console.error('[ERROR] Failed to process message', err);
    }
});

ws.on('close', () => {
    console.log('[RECEIVER] Disconnected. Reconnecting in 3s...');
    setTimeout(() => {
        // Simple reconnect logic
        process.exit(1); 
    }, 3000);
});

ws.on('error', (err) => {
    console.error('[WS ERROR]', err.message);
});
