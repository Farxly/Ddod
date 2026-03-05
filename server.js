const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Store active attacks
const activeAttacks = new Map();

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        attacks: activeAttacks.size,
        system: os.platform(),
        uptime: os.uptime()
    });
});

app.post('/api/attack/start', (req, res) => {
    const { target, port, method, threads, duration, packetSize } = req.body;
    
    if (!target || !port) {
        return res.status(400).json({ error: 'Target and port required' });
    }
    
    const attackId = Date.now().toString();
    
    // Simulate attack start
    activeAttacks.set(attackId, {
        target,
        port,
        method,
        threads,
        duration,
        packetSize,
        startTime: Date.now(),
        packetsSent: 0
    });
    
    // In real implementation, this would spawn actual attack processes
    // For educational purposes, we simulate
    
    res.json({
        success: true,
        attackId,
        message: `Attack started on ${target}:${port}`
    });
});

app.post('/api/attack/stop/:id', (req, res) => {
    const { id } = req.params;
    
    if (activeAttacks.has(id)) {
        activeAttacks.delete(id);
        res.json({ success: true, message: 'Attack stopped' });
    } else {
        res.status(404).json({ error: 'Attack not found' });
    }
});

// WebSocket for real-time stats
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('start-attack', (data) => {
        console.log('Attack requested:', data);
        
        // Simulate real-time stats
        const interval = setInterval(() => {
            socket.emit('stats', {
                packetsSent: Math.floor(Math.random() * 1000000),
                bandwidth: Math.random() * 100,
                connections: Math.floor(Math.random() * 1000),
                timestamp: Date.now()
            });
        }, 1000);
        
        socket.on('disconnect', () => {
            clearInterval(interval);
        });
    });
    
    socket.on('stop-attack', () => {
        console.log('Attack stopped by client');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ╔══════════════════════════════════╗
    ║   RIANMODSS Server Running       ║
    ║   Port: ${PORT}                         ║
    ║   Access: http://localhost:${PORT}      ║
    ╚══════════════════════════════════╝
    `);
});
