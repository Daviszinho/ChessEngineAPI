const ChessEngineAdapter = require('./ChessEngineAdapter');
const path = require('path');
const fs = require('fs');

class FruitAdapter extends ChessEngineAdapter {
    constructor() {
        // Allow override via env var, container-packaged binary, distro paths, or PATH.
        const envPath = process.env.FRUIT_PATH;
        const candidates = [
            envPath,
            path.join(__dirname, '../../engines/fruit'),
            '/usr/games/fruit_21_static',
            '/usr/games/fruit',
            'fruit_21_static',
            'fruit'
        ].filter(Boolean);
        const resolvedPath = candidates.find(p => p.includes('/') ? fs.existsSync(p) : true) || 'fruit';
        super(resolvedPath);
        this.engineName = 'Fruit';
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
        } else if (line.startsWith('info')) {
            // Handle Fruit-specific info output
            this.emit('info', line);
        } else if (line.includes('error') || line.includes('Error')) {
            // Handle Fruit-specific errors
            this.emit('error', new Error(`Fruit engine error: ${line}`));
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
        return Math.round(2 + ((level - 1) * 14 / 19));
    }

    levelToMoveTimeMs(level) {
        const minMs = 120;
        const maxMs = 2200;
        return Math.round(minMs + ((level - 1) * (maxMs - minMs) / 19));
    }

    setupGame(fen, level) {
        const strength = this.normalizeLevel(level);
        const normalizedStrength = strength / 20;
        const knowledgeWeight = Math.round(20 + ((strength - 1) * 80 / 19));
        const depth = this.levelToDepth(strength);
        const moveTimeMs = this.levelToMoveTimeMs(strength);

        this.sendCommand('ucinewgame');

        // Fruit-specific configuration
        this.sendCommand('setoption name Ponder value false');
        this.sendCommand('setoption name OwnBook value true');

        // Adjust search parameters based on strength
        if (strength < 10) {
            // Weaker play: reduce search depth and enable more pruning
            this.sendCommand('setoption name NullMove Pruning value Always');
            this.sendCommand('setoption name History Pruning value true');
            this.sendCommand('setoption name Futility Pruning value true');
            this.sendCommand('setoption name Delta Pruning value true');
            
            // Reduce knowledge weights for weaker play
            this.sendCommand(`setoption name Material value ${knowledgeWeight}`);
            this.sendCommand(`setoption name Piece Activity value ${knowledgeWeight}`);
            this.sendCommand(`setoption name King Safety value ${knowledgeWeight}`);
            this.sendCommand(`setoption name Pawn Structure value ${knowledgeWeight}`);
            this.sendCommand(`setoption name Passed Pawns value ${knowledgeWeight}`);
        } else {
            // Stronger play: more conservative pruning, full knowledge
            this.sendCommand('setoption name NullMove Pruning value Fail High');
            this.sendCommand('setoption name History Pruning value true');
            this.sendCommand('setoption name Futility Pruning value false');
            this.sendCommand('setoption name Delta Pruning value false');
            
            // Full knowledge weights
            this.sendCommand('setoption name Material value 100');
            this.sendCommand('setoption name Piece Activity value 100');
            this.sendCommand('setoption name King Safety value 100');
            this.sendCommand('setoption name Pawn Structure value 100');
            this.sendCommand('setoption name Passed Pawns value 100');
        }

        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go depth ${depth} movetime ${moveTimeMs}`);
    }
}

module.exports = FruitAdapter;
