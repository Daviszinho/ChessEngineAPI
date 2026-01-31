const ChessEngineAdapter = require('./ChessEngineAdapter');
const path = require('path');

class FruitAdapter extends ChessEngineAdapter {
    constructor() {
        super(path.join(__dirname, '../../fruit_21_linux/fruit_21_static'));
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

    setupGame(fen, level) {
        super.setupGame(fen, level);
        
        // Fruit-specific configuration
        this.sendCommand('setoption name Ponder value false');
        this.sendCommand('setoption name OwnBook value true');
        
        // Convert level (1-20) to Fruit's strength parameters
        // Fruit doesn't have Skill Level, so we use a combination of options
        const strength = Math.max(0, Math.min(20, level));
        const normalizedStrength = strength / 20; // 0-1 range
        
        // Adjust search parameters based on strength
        if (strength < 10) {
            // Weaker play: reduce search depth and enable more pruning
            this.sendCommand('setoption name NullMove Pruning value Always');
            this.sendCommand('setoption name History Pruning value true');
            this.sendCommand('setoption name Futility Pruning value true');
            this.sendCommand('setoption name Delta Pruning value true');
            
            // Reduce knowledge weights for weaker play
            const knowledgeWeight = Math.floor(100 * normalizedStrength);
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
    }
}

module.exports = FruitAdapter;