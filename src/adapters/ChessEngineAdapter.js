const { spawn } = require('child_process');
const EventEmitter = require('events');

class ChessEngineAdapter extends EventEmitter {
    constructor(enginePath, engineArgs = []) {
        super();
        this.enginePath = enginePath;
        this.engineArgs = engineArgs;
        this.process = null;
        this.isReady = false;
        this.gameId = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.process = spawn(this.enginePath, this.engineArgs || []);
            this.lastStderr = '';

            this.process.on('error', (error) => {
                clearTimeout(initTimeout);
                reject(new Error(`Failed to start engine '${this.enginePath}': ${error.message}`));
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
                const msg = data.toString();
                this.lastStderr += msg;
                // Keep a recent window of stderr
                if (this.lastStderr.length > 2000) {
                    this.lastStderr = this.lastStderr.slice(-2000);
                }
                console.error(`Engine stderr (${this.enginePath}): ${msg}`);
            });

            let initTimeout = setTimeout(() => {
                if (!this.isReady) {
                    const stderrPreview = this.lastStderr ? ` Stderr (last lines): ${this.lastStderr.split('\n').slice(-5).join(' | ')}` : '';
                    reject(new Error(`Engine initialization timeout for '${this.enginePath}'.${stderrPreview}`));
                }
            }, 10000);

            this.once('ready', () => {
                clearTimeout(initTimeout);
                this.isReady = true;
                resolve();
            });

            this.once('error', (err) => {
                clearTimeout(initTimeout);
                reject(err);
            });

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