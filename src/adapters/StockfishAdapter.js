const ChessEngineAdapter = require('./ChessEngineAdapter');

class StockfishAdapter extends ChessEngineAdapter {
    constructor() {
        super('/usr/games/stockfish');
        this.engineName = 'Stockfish';
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

    levelToElo(level) {
        // Practical range for limited Stockfish strength in most distributions.
        const minElo = 1350;
        const maxElo = 2850;
        return Math.round(minElo + ((level - 1) * (maxElo - minElo) / 19));
    }

    levelToMoveTimeMs(level) {
        const minMs = 120;
        const maxMs = 2500;
        return Math.round(minMs + ((level - 1) * (maxMs - minMs) / 19));
    }

    setupGame(fen, level) {
        const normalizedLevel = this.normalizeLevel(level);
        const useLimitedStrength = normalizedLevel < 20;

        this.sendCommand('ucinewgame');
        this.sendCommand('setoption name Ponder value false');
        this.sendCommand(`setoption name Skill Level value ${normalizedLevel}`);
        this.sendCommand(`setoption name UCI_LimitStrength value ${useLimitedStrength ? 'true' : 'false'}`);

        if (useLimitedStrength) {
            this.sendCommand(`setoption name UCI_Elo value ${this.levelToElo(normalizedLevel)}`);
        }

        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go movetime ${this.levelToMoveTimeMs(normalizedLevel)}`);
    }
}

module.exports = StockfishAdapter;
