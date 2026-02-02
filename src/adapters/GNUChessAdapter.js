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

        // GNUChess outputs moves in various formats. Check a few additional common patterns (e.g. "My move is : b1c3", "1. ... b1c3")
        let moveMatch = cleanLine.match(/^(?:White|Black)\s*mov(?:es?)\s*:?\s*([a-h][1-8][a-h][1-8][qrbn]?|[KQRBN][a-h][1-8]|[KQRBN]x[a-h][1-8]|[a-h]x[a-h][1-8]|[a-h][1-8]=[KQRBN]|[a-h][1-8]\+|[a-h][1-8]#|[O-O-O]|[O-O])$/i);
        if (!moveMatch) moveMatch = cleanLine.match(/^move\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (!moveMatch) moveMatch = cleanLine.match(/My move is\s*:\s*([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (!moveMatch) moveMatch = cleanLine.match(/^[0-9]+\.\s*\.\.\.\s*([a-h][1-8][a-h][1-8][qrbn]?)/i);
        // fallback: a bare coordinate on the line
        if (!moveMatch) moveMatch = cleanLine.match(/(^|\s)([a-h][1-8][a-h][1-8][qrbn]?)(\s|$)/i);

        if (moveMatch) {
            const mv = (Array.isArray(moveMatch) ? (moveMatch[1] || moveMatch[2]) : moveMatch);
            const move = (mv || '').trim();
            if (move) {
                if (this.logPath) { const fs = require('fs'); fs.appendFileSync(this.logPath, `BESTMOVE: ${move}\n`); }
                console.log(`${this.engineName} parsed move: ${move}`);
                this.emit('bestmove', {
                    engine: this.engineName,
                    move: move,
                    ponder: null
                });
            }
        }
    }

    async getBestMove(fen, level = 1) {
        console.log('GNUCHESS GET BEST MOVE CALLED!');
        if (!this.isReady) {
            console.log('GNUCHESS: Not ready, calling initialize');
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(async () => {
                this.removeAllListeners('bestmove');
                this._currentMoveReject = null;
                console.warn(`Move calculation timeout for ${this.engineName}. Shutting down engine.`);
                await this.shutdown().catch(() => { });
                reject(new Error('Move calculation timeout'));
            }, 30000); // 30 second timeout

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
                    try { fs.appendFileSync(this.logPath, `ERROR: ${err.message}\n`); } catch (e) { }
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
        this.sendCommand('memory 64'); // Limit memory/hash to 64MB
        this.sendCommand(`setboard ${fen}`);
        const depth = Math.max(1, Math.min(6, Math.floor(level)));
        this.sendCommand(`depth ${depth}`); // Set search depth (1..6)
        this.sendCommand('go');
        if (this.logPath) { const fs = require('fs'); fs.appendFileSync(this.logPath, `SETUP: depth=${depth} memory=64 fen=${fen}\n`); }
    }

    sendCommand(command) {
        if (!this.process) {
            throw new Error('Engine process not started');
        }
        this.process.stdin.write(command + '\n');
    }
}

module.exports = GNUChessAdapter;