const ChessEngineAdapter = require('./ChessEngineAdapter');

class CraftyAdapter extends ChessEngineAdapter {
    constructor() {
        // Crafty typically speaks XBoard protocol; start with no extra args
        super('/usr/games/crafty', []);
        this.engineName = 'Crafty';
    }

    handleEngineOutput(line) {
        const trimmed = line.trim();

        // Mark ready on common startup prompt like Phalanx
        if (!this.isReady && /^\[.*\]$/.test(trimmed)) {
            this.emit('ready');
            return;
        }

        // Detect UCI-style bestmove just in case
        if (trimmed.startsWith('bestmove')) {
            const parts = trimmed.split(' ');
            const move = parts[1] || null;
            this.emit('bestmove', {
                engine: this.engineName,
                move: move,
                ponder: parts[3] || null
            });
            return;
        }

        // XBoard-style move detection (long algebraic, SAN not supported here)
        const moveMatch = trimmed.match(/^[a-h][1-8][a-h][1-8][qrbn]?$/i) || trimmed.match(/^(?:O-O-O|O-O)$/i) || trimmed.match(/^(?:White|Black).*mov(?:es?)\s*:?.*([a-h][1-8][a-h][1-8][qrbn]?)/i) || trimmed.match(/^move\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
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
        // XBoard-style setup: start new game, set board and give time
        this.sendCommand('new');
        this.sendCommand(`setboard ${fen}`);
        const seconds = Math.max(1, Math.min(60, Math.floor(level * 3)));
        this.sendCommand(`time ${seconds}`);
        this.sendCommand('go');
    }
}

module.exports = CraftyAdapter;
