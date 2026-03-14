const fs = require('fs');
const path = require('path');
const ChessEngineAdapter = require('./ChessEngineAdapter');

function splitArgs(value) {
    if (!value) return [];
    const trimmed = value.trim();
    if (!trimmed) return [];
    return trimmed.split(/\s+/);
}

class Lc0Adapter extends ChessEngineAdapter {
    constructor() {
        const envPath = process.env.LC0_PATH;
        const candidates = [
            envPath,
            path.join(__dirname, '../../engines/lc0'),
            '/usr/games/lc0',
            'lc0'
        ].filter(Boolean);
        const resolvedPath = candidates.find(p => p.includes('/') ? fs.existsSync(p) : true) || 'lc0';

        const weightsEnv = process.env.LC0_WEIGHTS || process.env.LC0_NET;
        const defaultWeights = path.join(__dirname, '../../engines/lc0-weights.pb.gz');
        const weightsPath = weightsEnv || defaultWeights;
        const weightsAvailable = fs.existsSync(weightsPath);

        const engineArgs = [];
        if (weightsAvailable) {
            engineArgs.push(`--weights=${weightsPath}`);
        }
        engineArgs.push(...splitArgs(process.env.LC0_ARGS));

        super(resolvedPath, engineArgs, { initTimeoutMs: 15000 });
        this.engineName = 'LC0';
        this.weightsPath = weightsPath;
        this.weightsAvailable = weightsAvailable;
    }

    async initialize() {
        if (!this.weightsAvailable) {
            throw new Error(`LC0 weights not found at '${this.weightsPath}'. Set LC0_WEIGHTS or LC0_NET to a valid weights file.`);
        }
        return super.initialize();
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
        const minMs = 200;
        const maxMs = 3000;
        return Math.round(minMs + ((level - 1) * (maxMs - minMs) / 19));
    }

    setupGame(fen, level) {
        const normalizedLevel = this.normalizeLevel(level);

        this.sendCommand('ucinewgame');
        this.sendCommand('setoption name Ponder value false');
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go movetime ${this.levelToMoveTimeMs(normalizedLevel)}`);
    }
}

module.exports = Lc0Adapter;
