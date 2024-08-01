const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use((req, res, next) => {
	const start = Date.now();
	
	const now = new Date();
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based, so we add 1
	const day = now.getDate().toString().padStart(2, '0');
	const hours = now.getHours().toString().padStart(2, '0');
	const minutes = now.getMinutes().toString().padStart(2, '0');
	const seconds = now.getSeconds().toString().padStart(2, '0');
	
	res.on('finish', () => {
		const duration = Date.now() - start;
		console.log(`${year}-${month}-${day} ${hours}:${minutes}:${seconds} Request to ${req.path} took ${duration}ms`);
	});
	next();
});

app.get('/', (req, res) => {
	res.status(200).send('Server is running');
});

app.get('/health', (req, res) => {
	res.status(200).send('Server is running');
});

wss.on('connection', (ws) => {
	console.log ('a new client connected with client id:', ws._socket.remoteAddress);
	
	clients.set (ws,{rooms: new Set()});
	
	// Handle client closing connection
	ws.on ('close', () => {
		console.log ('client disconected');
		clients.delete (ws);
	});
	
	// Handle incoming messages from clients if needed
	ws.on ('message', function incoming (message) {
		try {
			message        = message.toString ();
			handleIncomingMessage (ws,message);
		} catch (error) {
			console.error ('Error message:', error);
		}
	});
});

const clients = new Map ();

function handleIncomingMessage (ws,data) {
	try {
		const message = JSON.parse (data);
		console.log(message);
		if (message.type) {
			switch (message.type) {
                case 'joinRoom':
                    joinRoom(ws, message.room,message.user_id);
                    break;
                case 'leaveRoom':
                    leaveRoom(ws, message.room);
                    break;
                case 'broadcastMessage':
                    broadcastMessage(message.room, message);
                    break;
                default:
                    console.log('Unknown message type');
            }
		} else {
			console.log ('Unknown message');
		}
	} catch (error) {
		console.error ('Error parsing message:', error);
	}
}

function joinRoom(ws,room,user_id) {
	const clientData = clients.get(ws);
	if (clientData){
		clientData.rooms.add(room);
		broadcastMessage(room, {type: 'joinedRoom', room: room, user_id: user_id});
	}
}

function leaveRoom(ws,room) {
	const clientData = clients.get(ws);
	if (clientData){
		clientData.rooms.delete(room);
		console.log(`Client left room: ${room}`);
	}
}

function broadcastMessage (room,message) {
	clients.forEach((clientData, client) => {
		console.log("clientData.rooms",clientData.rooms);
        if (client.readyState === WebSocket.OPEN && clientData.rooms.has(room)) {
            client.send(JSON.stringify(message));
        }
    });
}

server.listen(80, () => {
	console.log('HTTP and WebSocket server is running on port 80');
});