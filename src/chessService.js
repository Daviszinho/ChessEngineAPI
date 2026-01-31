const ChessEngineFacade = require('./facade/ChessEngineFacade');
const StockfishAdapter = require('./adapters/StockfishAdapter');
const GNUChessAdapter = require('./adapters/GNUChessAdapter');
const FruitAdapter = require('./adapters/FruitAdapter');
const Toga2Adapter = require('./adapters/Toga2Adapter');

const chessFacade = new ChessEngineFacade();

async function initializeEngines() {
    try {
        chessFacade.registerEngine('stockfish', new StockfishAdapter());
        chessFacade.registerEngine('gnuchess', new GNUChessAdapter());
        chessFacade.registerEngine('fruit', new FruitAdapter());
        chessFacade.registerEngine('toga2', new Toga2Adapter());
        
        console.log('Available engines:', chessFacade.getAvailableEngines());
    } catch (error) {
        console.error('Failed to initialize engines:', error.message);
        process.exit(1);
    }
}

module.exports = { chessFacade, initializeEngines };