const os = require('os');
const path = require('path');
const fs = require('fs');
const ChessEngineAdapter = require('./ChessEngineAdapter');

class EtherealAdapter extends ChessEngineAdapter {
    constructor() {
        // Allow override via env var, packaged path, or assume 'ethereal-chess' is in PATH
        const envPath = process.env.ETHEREAL_PATH;
        const packaged = '/usr/games/ethereal-chess';
        const resolvedPath = envPath || (fs.existsSync(packaged) ? packaged : 'ethereal-chess');
        super(resolvedPath);
        this.engineName = 'Ethereal';
        // predefine a logPath so failures during init are easier to find
        this.logPath = `/tmp/ethereal-${Date.now()}.log`;
    }

    handleEngineOutput(line) {
        if (!line) return;
        // UCI-style bestmove
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
        const maxMs = 2600;
        return Math.round(minMs + ((level - 1) * (maxMs - minMs) / 19));
    }

    setupGame(fen, level) {
        const normalizedLevel = this.normalizeLevel(level);
        // Use conservative defaults to avoid crashes on some builds
        this.sendCommand('ucinewgame');
        this.sendCommand('setoption name Ponder value false');
        this.sendCommand(`setoption name Threads value ${normalizedLevel >= 16 ? 2 : 1}`);
        this.sendCommand(`setoption name Hash value ${normalizedLevel >= 16 ? 32 : 16}`);
        this.sendCommand(`setoption name Skill Level value ${normalizedLevel}`);
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go movetime ${this.levelToMoveTimeMs(normalizedLevel)}`);
    }
}

module.exports = EtherealAdapter;
