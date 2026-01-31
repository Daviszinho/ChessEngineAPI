const ChessEngineAdapter = require('../adapters/ChessEngineAdapter');

class ChessEngineFacade {
    constructor() {
        this.adapters = new Map();
        this.defaultEngine = 'stockfish';
    }

    registerEngine(name, adapter) {
        this.adapters.set(name.toLowerCase(), adapter);
    }

    async getBestMove(fen, engine, level = 1) {
        const engineName = engine?.toLowerCase() || this.defaultEngine;
        const adapter = this.adapters.get(engineName);
        
        if (!adapter) {
            throw new Error(`Engine '${engine}' not available. Available engines: ${Array.from(this.adapters.keys()).join(', ')}`);
        }

        return await adapter.getBestMove(fen, level);
    }

    getAvailableEngines() {
        return Array.from(this.adapters.keys());
    }
}

module.exports = ChessEngineFacade;