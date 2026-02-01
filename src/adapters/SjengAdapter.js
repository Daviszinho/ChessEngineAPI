const ChessEngineAdapter = require('./ChessEngineAdapter');

class SjengAdapter extends ChessEngineAdapter {
    constructor() {
        // Start with UCI candidate by default; we will attempt several argument sets when initializing
        super('/usr/games/sjeng', ['-uci'], { initTimeoutMs: 15000 });
        this.engineName = 'Sjeng';
        this.usingXBoard = false;
    }

    async initialize() {
        const attempts = [
            ['-uci'],      // prefer UCI
            [],            // bare binary (often XBoard)
            ['-x'],        // explicit xboard flag
            ['-xboard'],   // alternate xboard flag
            ['-x', '-o', '-'] // xboard with polling input off
        ];

        let lastError = null;

        for (const args of attempts) {
            this.engineArgs = args;
            try {
                console.log(`Sjeng: attempting initialize with args: ${args.join(' ') || '<none>'}`);
                await super.initialize();
                this.usingXBoard = !(args.includes('-uci'));
                console.log(`Sjeng initialized with args: ${args.join(' ') || '<none>'}`);
                return;
            } catch (err) {
                lastError = err;
                console.warn(`Sjeng init with args [${args.join(' ')}] failed: ${err.message}`);
                // Ensure we shut down any partially started process before next attempt
                try {
                    await this.shutdown();
                } catch (e) {
                    // ignore shutdown errors
                }
            }
        }

        // All attempts failed
        throw new Error(`Sjeng initialization failed after attempts. Last error: ${lastError && lastError.message ? lastError.message : 'unknown'}`);
    }

    handleEngineOutput(line) {
        // UCI-style bestmove
        if (line.startsWith('bestmove')) {
            const parts = line.split(' ');
            const move = parts[1] || null;
            this.emit('bestmove', {
                engine: this.engineName,
                move: move,
                ponder: parts[3] || null
            });
            return;
        }

        // XBoard-style: detect initial prompt or moves
        if (!this.isReady && /^\[.*\]$/.test(line.trim())) {
            this.emit('ready');
            return;
        }

        const moveMatch = line.match(/^[a-h][1-8][a-h][1-8][qrbn]?$/i) || line.match(/^(?:O-O-O|O-O)$/i) || line.match(/^(?:White|Black).*mov(?:es?)\s*:?.*([a-h][1-8][a-h][1-8][qrbn]?)/i) || line.match(/^move\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (moveMatch) {
            const m = Array.isArray(moveMatch) ? moveMatch[1] || moveMatch[0] : moveMatch;
            this.emit('bestmove', {
                engine: this.engineName,
                move: m,
                ponder: null
            });
            return;
        }

        super.handleEngineOutput(line);
    }

    setupGame(fen, level) {
        if (this.usingXBoard) {
            // XBoard-style game setup for Sjeng
            this.sendCommand('new');
            this.sendCommand(`setboard ${fen}`);
            const seconds = Math.max(1, Math.min(60, Math.floor(level * 3)));
            this.sendCommand(`time ${seconds}`);
            this.sendCommand('go');
        } else {
            // UCI-style setup
            super.setupGame(fen, level);
        }
    }
}

module.exports = SjengAdapter;
