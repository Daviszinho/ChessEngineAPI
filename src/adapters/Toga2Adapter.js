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

    levelToMoveTimeMs(level) {
        const minMs = 100;
        const maxMs = 2200;
        return Math.round(minMs + ((level - 1) * (maxMs - minMs) / 19));
    }

    setupGame(fen, level) {
        const normalizedLevel = this.normalizeLevel(level);
        this.sendCommand('ucinewgame');
        this.sendCommand('setoption name Ponder value false');
        this.sendCommand(`setoption name Skill Level value ${normalizedLevel}`);
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go movetime ${this.levelToMoveTimeMs(normalizedLevel)}`);
    }
}

module.exports = Toga2Adapter;
