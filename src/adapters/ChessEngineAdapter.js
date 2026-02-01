const { spawn } = require('child_process');
const EventEmitter = require('events');

class ChessEngineAdapter extends EventEmitter {
    constructor(enginePath, engineArgs = [], options = {}) {
        super();
        this.enginePath = enginePath;
        this.engineArgs = engineArgs;
        this.process = null;
        this.isReady = false;
        this.gameId = null;
        this.initTimeoutMs = options.initTimeoutMs || 10000; // default 10s, can be overridden by adapters
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.process = spawn(this.enginePath, this.engineArgs || []);
            this.lastStderr = '';
            this._currentMoveReject = null;

            this.process.on('error', (error) => {
                clearTimeout(initTimeout);
                reject(new Error(`Failed to start engine '${this.enginePath}': ${error.message}`));
            });

            this.process.on('close', (code, signal) => {
                this.isReady = false;
                console.warn(`Engine process exited with code ${code}, signal ${signal}`);
                // If we were waiting for a move, reject it immediately
                if (this._currentMoveReject) {
                    const err = new Error(`Engine process exited unexpectedly (code=${code} signal=${signal})`);
                    this._currentMoveReject(err);
                    this._currentMoveReject = null;
                }
                // Also emit an error for global visibility
                this.emit('engine-exit', { code, signal });
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
            }, this.initTimeoutMs);

            this.once('ready', () => {
                clearTimeout(initTimeout);
                this.isReady = true;
                resolve();
            });

            this.once('error', (err) => {
                clearTimeout(initTimeout);
                reject(err);
            });

            // Allow subclasses to implement their own handshake
            if (typeof this.handshake === 'function') {
                try {
                    this.handshake();
                } catch (e) {
                    // ignore handshake errors here; they'll be surfaced by timeout or error events
                }
            } else {
                // default to UCI handshake for backward compatibility
                this.sendCommand('uci');
            }
        });
    }

    // Default handshake (UCI). Subclasses can override.
    handshake() {
        this.sendCommand('uci');
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
                this._currentMoveReject = null;
                reject(new Error('Move calculation timeout'));
            }, 30000);

            this.once('bestmove', (move) => {
                clearTimeout(timeout);
                this._currentMoveReject = null;
                resolve(move);
            });

            // Keep reference to reject so we can fail fast if engine process dies
            this._currentMoveReject = reject;

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
            this._currentMoveReject = null;
        }
    }
}

module.exports = ChessEngineAdapter;