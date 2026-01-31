const { spawn } = require('child_process');
const EventEmitter = require('events');

class ChessEngineAdapter extends EventEmitter {
    constructor(enginePath) {
        super();
        this.enginePath = enginePath;
        this.process = null;
        this.isReady = false;
        this.gameId = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.process = spawn(this.enginePath);
            
            this.process.on('error', (error) => {
                reject(new Error(`Failed to start engine: ${error.message}`));
            });

            this.process.on('close', (code) => {
                this.isReady = false;
                if (code !== 0) {
                    console.warn(`Engine process exited with code ${code}`);
                }
            });

            let buffer = '';
            this.process.stdout.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();
                
                lines.forEach(line => {
                    this.emit('engine-output', line.trim());
                    this.handleEngineOutput(line.trim());
                });
            });

            this.process.stderr.on('data', (data) => {
                console.error(`Engine stderr: ${data}`);
            });

            this.once('ready', () => {
                this.isReady = true;
                resolve();
            });

            this.once('error', reject);

            setTimeout(() => {
                if (!this.isReady) {
                    reject(new Error('Engine initialization timeout'));
                }
            }, 10000);

            this.sendCommand('uci');
        });
    }

    handleEngineOutput(line) {
        if (line === 'uciok') {
            this.sendCommand('isready');
        } else if (line === 'readyok') {
            this.emit('ready');
        }
    }

    sendCommand(command) {
        if (!this.process) {
            throw new Error('Engine process not started');
        }
        this.process.stdin.write(command + '\n');
    }

    async getBestMove(fen, level = 1) {
        console.log(`Base getBestMove called on ${this.constructor.name} with enginePath: ${this.enginePath}`);
        if (!this.isReady) {
            await this.initialize();
        }

        this.gameId = Date.now().toString();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.removeAllListeners('bestmove');
                reject(new Error('Move calculation timeout'));
            }, 30000);

            this.once('bestmove', (move) => {
                clearTimeout(timeout);
                resolve(move);
            });

            this.setupGame(fen, level);
        });
    }

    setupGame(fen, level) {
        this.sendCommand('ucinewgame');
        this.sendCommand(`setoption name Skill Level value ${level}`);
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand('go movetime 1000');
    }

    async shutdown() {
        if (this.process) {
            this.sendCommand('quit');
            await new Promise(resolve => {
                this.process.once('close', resolve);
                setTimeout(resolve, 5000);
            });
            this.process = null;
            this.isReady = false;
        }
    }
}

module.exports = ChessEngineAdapter;