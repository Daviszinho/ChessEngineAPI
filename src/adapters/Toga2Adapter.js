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

    setupGame(fen, level) {
        super.setupGame(fen, level);
        this.sendCommand(`setoption name Skill Level value ${Math.max(0, Math.min(20, level))}`);
    }
}

module.exports = Toga2Adapter;