const { spawn } = require('child_process');
const ChessEngineAdapter = require('./ChessEngineAdapter');

class GNUChessAdapter extends ChessEngineAdapter {
    constructor() {
        // Use XBoard mode and allow more time for initialization
        super('/usr/games/gnuchess', [], { initTimeoutMs: 20000 });
        this.engineName = 'GNUChess';
        this.logPath = null; // path to per-process log file
        console.log('GNUChessAdapter constructor called');
    }



    // XBoard handshake - declare protocol support and wait for feature lines
    handshake() {
        this.awaitingFeature = true;

        // Create per-attempt log file
        try {
            const fs = require('fs');
            const p = `/tmp/gnuchess-${Date.now()}.log`;
            this.logPath = p;
            fs.writeFileSync(p, `=== GNUChess log start: ${new Date().toISOString()} ===\n`);
            console.log(`${this.engineName} logging to ${p}`);
        } catch (e) {
            console.warn('Could not create log file for GNUChess:', e.message);
            this.logPath = null;
        }

        this.sendCommand('xboard');
        this.sendCommand('protover 2');
    }

    handleEngineOutput(line) {
        // Clean up the line by removing control characters
        const cleanLine = line.replace(/[\x00-\x1F\x7F]/g, '').trim();

        // If we're awaiting feature lines from protover, wait until we see them
        if (this.awaitingFeature && /^feature\b/i.test(cleanLine)) {
            console.log(`${this.engineName} received feature line during handshake: '${cleanLine}'`);
            if (this.logPath) {
                const fs = require('fs'); fs.appendFileSync(this.logPath, `STDOUT: ${cleanLine}\n`);
            }
            if (/\bdone=1\b/i.test(cleanLine)) {
                this.awaitingFeature = false;
                if (!this.isReady) {
                    console.log(`${this.engineName} marking ready after feature negotiation`);
                    this.emit('ready');
                }
            }
            return;
        }

        // Log engine output to help diagnose why no move is produced
        if (cleanLine) {
            console.log(`[${this.engineName}] stdout: ${cleanLine}`);
            if (this.logPath) {
                const fs = require('fs'); fs.appendFileSync(this.logPath, `STDOUT: ${cleanLine}\n`);
            }
        }

        // GNUChess outputs moves in various formats
        const moveMatch = cleanLine.match(/^(?:White|Black)\s*mov(?:es?)\s*:?\s*([a-h][1-8][a-h][1-8][qrbn]?|[KQRBN][a-h][1-8]|[KQRBN]x[a-h][1-8]|[a-h]x[a-h][1-8]|[a-h][1-8]=[KQRBN]|[a-h][1-8]\+|[a-h][1-8]#|[O-O-O]|[O-O])$/i) || cleanLine.match(/^move\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (moveMatch) {
            if (this.logPath) { const fs = require('fs'); fs.appendFileSync(this.logPath, `BESTMOVE: ${moveMatch[1]}\n`); }
            this.emit('bestmove', {
                engine: this.engineName,
                move: moveMatch[1],
                ponder: null
            });
        }
    }

    async getBestMove(fen, level = 1) {
        console.log('GNUCHESS GET BEST MOVE CALLED!');
        if (!this.isReady) {
            console.log('GNUCHESS: Not ready, calling initialize');
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.removeAllListeners('bestmove');
                reject(new Error('Move calculation timeout'));
            }, 30000); // 30 second timeout

            this.once('bestmove', (move) => {
                clearTimeout(timeout);
                resolve(move);
            });

            // Try the operation up to two times if engine process dies
            this._attempts = this._attempts || 0;
            this._attempts += 1;

            this.setupGame(fen, level);
        });
    }

    async getBestMoveWithRetry(fen, level = 1, tries = 2) {
        let lastError = null;
        for (let attempt = 1; attempt <= tries; attempt++) {
            try {
                // reset attempts counter per higher-level call
                this._attempts = 0;
                const result = await this.getBestMove(fen, level);
                return result;
            } catch (err) {
                lastError = err;
                console.warn(`GNUChess attempt ${attempt} failed: ${err.message}`);

                // append stderr if available
                if (this.logPath) {
                    const fs = require('fs');
                    try { fs.appendFileSync(this.logPath, `ERROR: ${err.message}\n`); } catch (e) {}
                }

                try {
                    await this.shutdown();
                } catch (e) {
                    // ignore
                }

                if (attempt === tries) {
                    throw lastError;
                }

                console.log('GNUChess: retrying initialization and move calculation...');
            }
        }
    }

    setupGame(fen, level) {
        console.log('GNUCHESS SETUP GAME CALLED!');
        // GNUChess protocol commands
        this.sendCommand('new'); // Start new game
        this.sendCommand(`setboard ${fen}`);
        const depth = Math.max(1, Math.min(6, Math.floor(level)));
        this.sendCommand(`depth ${depth}`); // Set search depth (1..6)
        this.sendCommand('go');
        if (this.logPath) { const fs = require('fs'); fs.appendFileSync(this.logPath, `SETUP: depth=${depth} fen=${fen}\n`); }
    }

    sendCommand(command) {
        if (!this.process) {
            throw new Error('Engine process not started');
        }
        this.process.stdin.write(command + '\n');
    }
}

module.exports = GNUChessAdapter;