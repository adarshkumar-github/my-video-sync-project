const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

let pin = null;
let hostSocket = null;
let videoLink = null;

app.use(express.static('public'));
app.use(bodyParser.json());

app.post('/generate-pin', (req, res) => {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
    res.json({ pin: pin });
});

app.post('/verify-pin', (req, res) => {
    const enteredPin = req.body.enteredPin;
    if (enteredPin === pin) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (data) => {
        if (data.role === 'host') {
            hostSocket = socket;
            videoLink = data.link;
            socket.join(data.pin);
        } else if (data.role === 'viewer') {
            socket.join(data.pin);
            socket.emit('video link', videoLink);
        }
        if (data.userName) {
            socket.userName = data.userName;
        }
    });

    socket.on('chat message', (msg) => {
        io.to(pin).emit('chat message', { userName: socket.userName, message: msg.message });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});