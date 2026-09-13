const ChessEngineAdapter = require('./ChessEngineAdapter');

class Toga2Adapter extends ChessEngineAdapter {
    constructor() {
        super('/usr/games/toga2');
        this.engineName = 'Toga2';
    }

    handleEngineOutput(line) {
        if (line.startsWith('bestmove')) {
            const parts = line.split(' ');
            const move = parts[1] || null;
            this.emit('bestmove', {
                engine: this.engineName,
                move: move,
                ponder: parts[3] || null
            });
        } else {
            super.handleEngineOutput(line);
        }
    }

    normalizeLevel(level) {
        const numericLevel = Number(level);
        if (!Number.isFinite(numericLevel)) {
            return 1;
        }
        return Math.max(1, Math.min(20, Math.floor(numericLevel)));
    }

    levelToDepth(level) {
        // Toga2 is a Fruit fork; depth is the most reliable strength control.
        // Range: depth 2 (level 1) to depth 16 (level 20)
        return Math.round(2 + ((level - 1) * 14 / 19));
    }

    levelToMoveTimeMs(level) {
        const minMs = 100;
        const maxMs = 2200;
        return Math.round(minMs + ((level - 1) * (maxMs - minMs) / 19));
    }

    setupGame(fen, level) {
        const normalizedLevel = this.normalizeLevel(level);
        // Toga2 (a Fruit 2.1 port) does NOT support the Skill Level UCI option.
        // Strength is controlled via search depth and move time.
        this.sendCommand('ucinewgame');
        this.sendCommand('setoption name Ponder value false');
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go depth ${this.levelToDepth(normalizedLevel)} movetime ${this.levelToMoveTimeMs(normalizedLevel)}`);
    }
}

module.exports = Toga2Adapter;
