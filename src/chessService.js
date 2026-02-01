const ChessEngineFacade = require('./facade/ChessEngineFacade');
const StockfishAdapter = require('./adapters/StockfishAdapter');
const GNUChessAdapter = require('./adapters/GNUChessAdapter');
const FruitAdapter = require('./adapters/FruitAdapter');
const Toga2Adapter = require('./adapters/Toga2Adapter');
const PhalanxAdapter = require('./adapters/PhalanxAdapter');
const SjengAdapter = require('./adapters/SjengAdapter');
const CraftyAdapter = require('./adapters/CraftyAdapter');
const GlaurungAdapter = require('./adapters/GlaurungAdapter');
const EtherealAdapter = require('./adapters/EtherealAdapter');

const chessFacade = new ChessEngineFacade();

async function initializeEngines() {
    try {
        chessFacade.registerEngine('stockfish', new StockfishAdapter());
        chessFacade.registerEngine('gnuchess', new GNUChessAdapter());
        // Expose getBestMoveWithRetry for engines that may die and need a retry
        // (no change to facade API; adapters handle retries internally)
        chessFacade.registerEngine('fruit', new FruitAdapter());
        chessFacade.registerEngine('toga2', new Toga2Adapter());
        chessFacade.registerEngine('phalanx', new PhalanxAdapter());
        chessFacade.registerEngine('sjeng', new SjengAdapter());
        chessFacade.registerEngine('crafty', new CraftyAdapter());
        chessFacade.registerEngine('glaurung', new GlaurungAdapter());
        chessFacade.registerEngine('ethereal', new EtherealAdapter());
        
        console.log('Available engines:', chessFacade.getAvailableEngines());
    } catch (error) {
        console.error('Failed to initialize engines:', error.message);
        process.exit(1);
    }
}

module.exports = { chessFacade, initializeEngines };