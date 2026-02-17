const { spawn } = require('child_process');
const EventEmitter = require('events');
const fs = require('fs');

class ChessEngineAdapter extends EventEmitter {
    constructor(enginePath, engineArgs = [], options = {}) {
        super();
        this.enginePath = enginePath;
        this.engineArgs = engineArgs;
        this.process = null;
        this.isReady = false;
        this.gameId = null;
        this.initTimeoutMs = options.initTimeoutMs || 10000; // default 10s, can be overridden by adapters

        // Crash tracking / health gating
        this.crashCount = 0;
        this.lastCrashAt = null;
        this.unhealthyUntil = null;
        this.unhealthyThreshold = options.unhealthyThreshold || 3;
        this.unhealthyCooldownMs = options.unhealthyCooldownMs || 60 * 1000; // 1 minute default

        // Logging
        this.logPath = options.logPath || null; // adapters may set this before initialize
        this._logStream = null;
        this.idleTimeoutMs = options.idleTimeoutMs || 60000; // default 60s
        this._idleTimer = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            // Fail early if this engine is currently unhealthy due to repeated crashes
            if (this.unhealthyUntil && Date.now() < this.unhealthyUntil) {
                return reject(new Error(`Engine '${this.enginePath}' is temporarily disabled due to recent crashes; see logs: ${this.logPath || 'n/a'}`));
            }

            this.process = spawn(this.enginePath, this.engineArgs || []);
            this.lastStderr = '';
            this._currentMoveReject = null;

            // Create per-process log file if not set
            if (!this.logPath) {
                const name = (this.engineName || this.constructor.name || 'engine').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
                this.logPath = `/tmp/${name}-${Date.now()}.log`;
            }

            try {
                this._logStream = fs.createWriteStream(this.logPath, { flags: 'a' });
            } catch (e) {
                // if we can't create a log, continue without it
                this._logStream = null;
            }

            this.process.on('error', (error) => {
                clearTimeout(initTimeout);
                if (this._logStream) this._logStream.write(`engine error: ${error.message}\n`);
                reject(new Error(`Failed to start engine '${this.enginePath}': ${error.message}`));
            });

            this.process.on('close', (code, signal) => {
                this.isReady = false;
                this.lastCrashAt = Date.now();
                this.crashCount = (this.crashCount || 0) + 1;

                // if crashes exceed threshold, mark unhealthy for cooldown window
                if (this.crashCount >= this.unhealthyThreshold) {
                    this.unhealthyUntil = Date.now() + this.unhealthyCooldownMs;
                    console.warn(`Engine ${this.enginePath} marked unhealthy until ${new Date(this.unhealthyUntil).toISOString()} after ${this.crashCount} crashes`);
                }

                console.warn(`Engine process exited with code ${code}, signal ${signal}`);
                if (this._logStream) this._logStream.write(`engine exited with code=${code} signal=${signal}\n`);

                // If we were waiting for a move, reject it immediately
                if (this._currentMoveReject) {
                    const err = new Error(`Engine process exited unexpectedly (code=${code} signal=${signal})`);
                    this._currentMoveReject(err);
                    this._currentMoveReject = null;
                }
                // Also emit an error for global visibility and crash event
                this.emit('engine-exit', { code, signal });
                this.emit('crash', { code, signal });

                if (this._logStream) {
                    this._logStream.end();
                    this._logStream = null;
                }
            });

            let buffer = '';
            this.process.stdout.on('data', (data) => {
                const s = data.toString();
                if (this._logStream) this._logStream.write(s);

                buffer += s;
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
                if (this._logStream) this._logStream.write(`stderr: ${msg}`);
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
                // successful init -> reset crash counter
                this.crashCount = 0;
                this.unhealthyUntil = null;
                resolve();
            });

            this.once('error', (err) => {
                clearTimeout(initTimeout);
                this.shutdown().catch(() => { }); // Try to clean up on error
                reject(err);
            });

            // Reset idle timer whenever we initialize
            this.resetIdleTimer();

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
            const timeout = setTimeout(async () => {
                this.removeAllListeners('bestmove');
                this._currentMoveReject = null;
                console.warn(`Move calculation timeout for ${this.enginePath}. Shutting down engine.`);
                await this.shutdown().catch(() => { });
                reject(new Error('Move calculation timeout'));
            }, 30000);

            this.once('bestmove', (move) => {
                clearTimeout(timeout);
                this._currentMoveReject = null;
                this.resetIdleTimer();
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
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
            this._idleTimer = null;
        }
        if (this.process) {
            console.log(`Shutting down engine: ${this.enginePath}`);
            // Try graceful quit
            try {
                this.sendCommand('quit');
            } catch (e) { }

            await new Promise(resolve => {
                const termTimeout = setTimeout(() => {
                    if (this.process) {
                        console.warn(`Engine ${this.enginePath} did not exit gracefully, killing it.`);
                        this.process.kill('SIGKILL');
                    }
                    resolve();
                }, 2000);

                this.process.once('close', () => {
                    clearTimeout(termTimeout);
                    resolve();
                });
            });
            this.process = null;
            this.isReady = false;
            this._currentMoveReject = null;
        }
    }

    resetIdleTimer() {
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
        }
        this._idleTimer = setTimeout(() => {
            console.log(`Engine ${this.enginePath} idle for ${this.idleTimeoutMs}ms, shutting down to save memory.`);
            this.shutdown().catch(err => console.error(`Error during idle shutdown of ${this.enginePath}:`, err));
        }, this.idleTimeoutMs);
    }
}

module.exports = ChessEngineAdapter;