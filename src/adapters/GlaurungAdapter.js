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

    normalizeLevel(level) {
        const numericLevel = Number(level);
        if (!Number.isFinite(numericLevel)) {
            return 1;
        }
        return Math.max(1, Math.min(20, Math.floor(numericLevel)));
    }

    levelToMoveTimeMs(level) {
        const minMs = 120;
        const maxMs = 2400;
        return Math.round(minMs + ((level - 1) * (maxMs - minMs) / 19));
    }

    setupGame(fen, level) {
        const normalizedLevel = this.normalizeLevel(level);
        this.sendCommand('ucinewgame');
        this.sendCommand('setoption name Ponder value false');
        // Glaurung predates Stockfish and does NOT support the Skill Level UCI option.
        // Strength is controlled via Threads and move time only.
        try {
            const cpus = Math.max(1, os.cpus().length || 1);
            const threads = Math.min(4, cpus);
            this.sendCommand(`setoption name Threads value ${threads}`);
        } catch (e) {
            // best-effort; ignore if os.cpus() isn't available
        }
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go movetime ${this.levelToMoveTimeMs(normalizedLevel)}`);
    }
}

module.exports = GlaurungAdapter;
