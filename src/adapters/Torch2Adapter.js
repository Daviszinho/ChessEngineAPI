const path = require('path');
const fs = require('fs');
const ChessEngineAdapter = require('./ChessEngineAdapter');

class Torch2Adapter extends ChessEngineAdapter {
    constructor() {
        const envPath = process.env.TORCH2_PATH || process.env.TORCH_PATH;
        const candidates = [
            envPath,
            path.join(__dirname, '../../engines/torch-2'),
            '/usr/games/torch-2',
            'torch-2'
        ].filter(Boolean);
        const resolvedPath = candidates.find(p => p.includes('/') ? fs.existsSync(p) : true) || 'torch-2';

        // WASM-based startup can be slower than native engines.
        super(resolvedPath, [], { initTimeoutMs: 30000 });
        this.engineName = 'Torch 2';
    }

    handleEngineOutput(line) {
        if (line.startsWith('bestmove')) {
            const parts = line.split(' ');
            const move = parts[1] || null;
            const ponderIndex = parts.indexOf('ponder');
            const ponder = (ponderIndex !== -1 && parts[ponderIndex + 1]) ? parts[ponderIndex + 1] : null;
            this.emit('bestmove', {
                engine: this.engineName,
                move,
                ponder
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
        const maxMs = 2600;
        return Math.round(minMs + ((level - 1) * (maxMs - minMs) / 19));
    }

    setupGame(fen, level) {
        const normalizedLevel = this.normalizeLevel(level);

        this.sendCommand('ucinewgame');
        this.sendCommand('setoption name Ponder value false');
        this.sendCommand('setoption name Threads value 1');
        this.sendCommand(`setoption name Hash value ${normalizedLevel >= 12 ? 32 : 16}`);
        this.sendCommand(`setoption name Minimal value ${normalizedLevel <= 8 ? 'true' : 'false'}`);
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go movetime ${this.levelToMoveTimeMs(normalizedLevel)}`);
    }
}

module.exports = Torch2Adapter;
