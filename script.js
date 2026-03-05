// RIANMODSS Stress Tester - Educational Network Tool
// WARNING: For authorized testing only!

class StressTester {
    constructor() {
        this.isRunning = false;
        this.packetsSent = 0;
        this.startTime = null;
        this.attackInterval = null;
        this.statsInterval = null;
        this.workers = [];
        
        this.console = document.getElementById('console');
        this.packetsSentEl = document.getElementById('packetsSent');
        this.bandwidthEl = document.getElementById('bandwidth');
        this.connectionsEl = document.getElementById('connections');
        this.targetStatusEl = document.getElementById('targetStatus');
        this.attackProgress = document.getElementById('attackProgress');
        
        this.initEventListeners();
        this.log('[SYSTEM] RIANMODSS initialized and ready');
    }
    
    initEventListeners() {
        document.getElementById('startAttack').addEventListener('click', () => this.startAttack());
        document.getElementById('stopAttack').addEventListener('click', () => this.stopAttack());
        document.getElementById('resetStats').addEventListener('click', () => this.resetStats());
        
        // Slider updates
        document.getElementById('threads').addEventListener('input', (e) => {
            document.getElementById('threadsValue').textContent = e.target.value;
        });
        
        document.getElementById('duration').addEventListener('input', (e) => {
            document.getElementById('durationValue').textContent = e.target.value;
        });
        
        document.getElementById('packetSize').addEventListener('input', (e) => {
            document.getElementById('packetSizeValue').textContent = e.target.value;
        });
        
        // Target list click
        document.querySelectorAll('.target-list li').forEach(item => {
            item.addEventListener('click', () => {
                const target = item.textContent.split(' ')[0];
                const [ip, port] = target.split(':');
                document.getElementById('targetIP').value = ip;
                document.getElementById('targetPort').value = port || '80';
                this.log(`[TARGET] Selected: ${target}`);
            });
        });
    }
    
    log(message) {
        const line = document.createElement('div');
        line.className = 'console-line';
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.console.appendChild(line);
        this.console.scrollTop = this.console.scrollHeight;
        
        // Keep last 50 lines
        if (this.console.children.length > 50) {
            this.console.removeChild(this.console.children[0]);
        }
    }
    
    async startAttack() {
        if (this.isRunning) return;
        
        const targetIP = document.getElementById('targetIP').value;
        const targetPort = document.getElementById('targetPort').value;
        const attackType = document.getElementById('attackType').value;
        const threads = parseInt(document.getElementById('threads').value);
        const duration = parseInt(document.getElementById('duration').value);
        const packetSize = parseInt(document.getElementById('packetSize').value);
        const randomIP = document.getElementById('randomIP').checked;
        const bypassFW = document.getElementById('bypassFW').checked;
        
        // Validation
        if (!targetIP) {
            this.log('[ERROR] Target IP required!');
            return;
        }
        
        this.isRunning = true;
        this.startTime = Date.now();
        this.packetsSent = 0;
        
        // Update UI
        document.getElementById('startAttack').disabled = true;
        document.getElementById('stopAttack').disabled = false;
        this.targetStatusEl.textContent = '🚀 ATTACKING';
        this.targetStatusEl.style.color = '#ff3333';
        
        this.log(`[INIT] Starting ${attackType} attack on ${targetIP}:${targetPort}`);
        this.log(`[CONFIG] Threads: ${threads}, Duration: ${duration}s, Packet Size: ${packetSize} bytes`);
        this.log(`[OPTIONS] Random IP: ${randomIP}, Bypass FW: ${bypassFW}`);
        
        // Simulate attack with Web Workers for realism
        for (let i = 0; i < Math.min(threads, 10); i++) { // Max 10 workers for browser
            try {
                const worker = new Worker(URL.createObjectURL(new Blob([`
                    let running = true;
                    let sent = 0;
                    
                    self.onmessage = function(e) {
                        if (e.data === 'stop') running = false;
                    };
                    
                    function attack() {
                        if (!running) return;
                        
                        // Simulate packet sending
                        sent += Math.floor(Math.random() * 100) + 50;
                        
                        // Calculate bandwidth based on packet size
                        const bytes = sent * ${packetSize};
                        
                        self.postMessage({
                            type: 'stats',
                            sent: sent,
                            bytes: bytes
                        });
                        
                        setTimeout(attack, ${Math.floor(1000 / Math.min(threads, 10))});
                    }
                    
                    attack();
                `], { type: 'application/javascript' })));
                
                worker.onmessage = (e) => {
                    if (e.data.type === 'stats') {
                        this.packetsSent += e.data.sent;
                        this.updateStats();
                    }
                };
                
                this.workers.push(worker);
            } catch (e) {
                this.log(`[ERROR] Worker ${i} failed: ${e.message}`);
            }
        }
        
        // Simulate additional connections
        this.attackInterval = setInterval(() => {
            if (!this.isRunning) return;
            
            // Simulate different attack patterns
            const multiplier = {
                'http': 1.5,
                'slowloris': 0.5,
                'udp': 2,
                'syn': 1.8,
                'ping': 1.2,
                'multi': 3
            }[attackType] || 1;
            
            this.packetsSent += Math.floor(Math.random() * 1000 * multiplier);
            this.updateStats();
            
        }, 100);
        
        // Stop after duration
        setTimeout(() => {
            if (this.isRunning) {
                this.stopAttack();
                this.log('[SYSTEM] Attack duration completed');
            }
        }, duration * 1000);
        
        // Progress bar animation
        let elapsed = 0;
        this.statsInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(this.statsInterval);
                return;
            }
            
            elapsed += 0.1;
            const progress = Math.min((elapsed / duration) * 100, 100);
            this.attackProgress.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(this.statsInterval);
            }
        }, 100);
    }
    
    stopAttack() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        // Stop all workers
        this.workers.forEach(worker => {
            try {
                worker.postMessage('stop');
                worker.terminate();
            } catch (e) {}
        });
        this.workers = [];
        
        if (this.attackInterval) {
            clearInterval(this.attackInterval);
            this.attackInterval = null;
        }
        
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
        
        // Update UI
        document.getElementById('startAttack').disabled = false;
        document.getElementById('stopAttack').disabled = true;
        this.targetStatusEl.textContent = '⏸️ STOPPED';
        this.targetStatusEl.style.color = '#00cc7a';
        
        const duration = (Date.now() - this.startTime) / 1000;
        this.log(`[STOP] Attack stopped after ${duration.toFixed(2)} seconds`);
        this.log(`[SUMMARY] Total packets sent: ${this.packetsSent.toLocaleString()}`);
    }
    
    resetStats() {
        this.packetsSent = 0;
        this.updateStats();
        this.attackProgress.style.width = '0%';
        this.log('[SYSTEM] Statistics reset');
        
        // Clear console but keep last message
        while (this.console.children.length > 1) {
            this.console.removeChild(this.console.children[0]);
        }
    }
    
    updateStats() {
        this.packetsSentEl.textContent = this.packetsSent.toLocaleString();
        
        if (this.startTime) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const bandwidth = (this.packetsSent * parseInt(document.getElementById('packetSize').value)) / (1024 * 1024) / (elapsed || 1);
            this.bandwidthEl.textContent = bandwidth.toFixed(2) + ' MB/s';
            
            // Simulate connections based on threads
            const connections = Math.floor(Math.random() * parseInt(document.getElementById('threads').value)) + 1;
            this.connectionsEl.textContent = connections.toLocaleString();
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.tester = new StressTester();
    
    // Add matrix rain effect
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    canvas.style.opacity = '0.1';
    
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const columns = canvas.width / 20;
    const drops = [];
    
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0f0';
        ctx.font = '15px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * 20, drops[i] * 20);
            
            if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            
            drops[i]++;
        }
    }
    
    setInterval(draw, 35);
    document.querySelector('.matrix-bg').appendChild(canvas);
});
