const ChessEngineAdapter = require('../adapters/ChessEngineAdapter');

class ChessEngineFacade {
    constructor() {
        this.adapters = new Map();
        this.defaultEngine = 'stockfish';
    }

    registerEngine(name, adapter) {
        this.adapters.set(name.toLowerCase(), adapter);
    }

    getAdapter(name) {
        return this.adapters.get(name?.toLowerCase());
    }

    async getBestMove(fen, engine, level = 1) {
        const engineName = engine?.toLowerCase() || this.defaultEngine;
        const adapter = this.adapters.get(engineName);
        
        if (!adapter) {
            throw new Error(`Engine '${engine}' not available. Available engines: ${Array.from(this.adapters.keys()).join(', ')}`);
        }

        // Clamp and sanitize level before passing to the adapter
        const numericLevel = Number(level);
        const safeLevel = Number.isFinite(numericLevel)
            ? Math.max(1, Math.min(20, Math.floor(numericLevel)))
            : 1;

        return await adapter.getBestMove(fen, safeLevel);
    }

    getAvailableEngines() {
        return Array.from(this.adapters.keys());
    }
}

module.exports = ChessEngineFacade;