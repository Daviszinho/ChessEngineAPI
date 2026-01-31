const ChessEngineAdapter = require('./ChessEngineAdapter');

class PhalanxAdapter extends ChessEngineAdapter {
    constructor() {
        // Turn off xboard mode (-x-) and disable polling input (-o -) so engine speaks UCI-style
        super('/usr/games/phalanx', ['-x-', '-o', '-']);
        this.engineName = 'Phalanx';
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
        // Phalanx doesn't support UCI Skill Level uniformly; clamp and send as best-effort
        this.sendCommand(`setoption name Skill Level value ${Math.max(0, Math.min(20, level))}`);
    }
}

module.exports = PhalanxAdapter;
