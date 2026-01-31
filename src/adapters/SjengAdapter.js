const ChessEngineAdapter = require('./ChessEngineAdapter');

class SjengAdapter extends ChessEngineAdapter {
    constructor() {
        // Try UCI mode first
        super('/usr/games/sjeng', ['-uci']);
        this.engineName = 'Sjeng';
        this.usingXBoard = false;
    }

    async initialize() {
        try {
            await super.initialize();
            // If UCI handshake succeeded, keep using UCI
            this.usingXBoard = false;
        } catch (err) {
            console.warn(`Sjeng UCI handshake failed: ${err.message}. Trying XBoard fallback.`);
            // Try fallback to XBoard mode (no -uci arg)
            this.engineArgs = [];
            // Ensure previous process cleared
            try {
                await super.initialize();
                this.usingXBoard = true;
            } catch (err2) {
                // If fallback also fails, rethrow original error for context
                throw new Error(`Sjeng initialization failed (UCI then XBoard). UCI error: ${err.message}; XBoard error: ${err2.message}`);
            }
        }
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
