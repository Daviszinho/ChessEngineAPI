const { spawn } = require('child_process');
const ChessEngineAdapter = require('./ChessEngineAdapter');

class GNUChessAdapter extends ChessEngineAdapter {
    constructor() {
        super('/usr/games/gnuchess');
        this.engineName = 'GNUChess';
        console.log('GNUChessAdapter constructor called');
    }



    handleEngineOutput(line) {
        // Clean up the line by removing control characters
        const cleanLine = line.replace(/[\x00-\x1F\x7F]/g, '');
        
        // GNUChess outputs moves in various formats
        const moveMatch = cleanLine.match(/^(?:White|Black)\s*mov(?:es?)\s*:?\s*([a-h][1-8][a-h][1-8][qrbn]?|[KQRBN][a-h][1-8]|[KQRBN]x[a-h][1-8]|[a-h]x[a-h][1-8]|[a-h][1-8]=[KQRBN]|[a-h][1-8]\+|[a-h][1-8]#|[O-O-O]|[O-O])$/i);
        if (moveMatch) {
            this.emit('bestmove', {
                engine: this.engineName,
                move: moveMatch[1],
                ponder: null
            });
        }
    }

    async getBestMove(fen, level = 1) {
        console.log('GNUCHESS GET BEST MOVE CALLED!');
        if (!this.isReady) {
            console.log('GNUCHESS: Not ready, calling initialize');
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.removeAllListeners('bestmove');
                reject(new Error('Move calculation timeout'));
            }, 10000); // 10 second timeout

            this.once('bestmove', (move) => {
                clearTimeout(timeout);
                resolve(move);
            });

            // Use setupGame from this adapter instead of base class
            this.setupGame(fen, level);
        });
    }

    setupGame(fen, level) {
        console.log('GNUCHESS SETUP GAME CALLED!');
        // GNUChess protocol commands
        this.sendCommand('new'); // Start new game
        this.sendCommand(`setboard ${fen}`);
        this.sendCommand(`depth ${Math.max(1, Math.min(5, level))}`); // Set search depth
        this.sendCommand('go');
    }

    sendCommand(command) {
        if (!this.process) {
            throw new Error('Engine process not started');
        }
        this.process.stdin.write(command + '\n');
    }
}

module.exports = GNUChessAdapter;