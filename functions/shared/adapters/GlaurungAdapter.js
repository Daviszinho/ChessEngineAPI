const os = require('os');
const ChessEngineAdapter = require('./ChessEngineAdapter');

class GlaurungAdapter extends ChessEngineAdapter {
    constructor() {
        // default glaurung binary on Debian-derived systems
        super('/usr/games/glaurung');
        this.engineName = 'Glaurung';
    }

    handleEngineOutput(line) {
        if (!line) return;
        // Glaurung speaks UCI; expect "bestmove <move> [ponder <move>]"
        if (line.startsWith('bestmove')) {
            const parts = line.split(' ');
            const move = parts[1] || null;
            const ponderIndex = parts.indexOf('ponder');
            const ponder = (ponderIndex !== -1 && parts[ponderIndex + 1]) ? parts[ponderIndex + 1] : null;
            this.emit('bestmove', {
                engine: this.engineName,
                move: move,
                ponder: ponder
            });
        } else {
            super.handleEngineOutput(line);
        }
    }

    setupGame(fen, level) {
        super.setupGame(fen, level);
        // Glaurung supports "Threads" UCI option (up to 4). Use available CPUs but cap at 4.
        try {
            const cpus = Math.max(1, os.cpus().length || 1);
            const threads = Math.min(4, cpus);
            this.sendCommand(`setoption name Threads value ${threads}`);
        } catch (e) {
            // best-effort; ignore if os.cpus() isn't available
        }
        // Map level roughly to skill setting if available
        this.sendCommand(`setoption name Skill Level value ${Math.max(0, Math.min(20, level))}`);
    }
}

module.exports = GlaurungAdapter;
