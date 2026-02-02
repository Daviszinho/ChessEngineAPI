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
        // GNUChess is disabled by default due to high resource consumption on small VMs.
        // Enable with: ENABLE_GNUCHESS=true
        if (process.env.ENABLE_GNUCHESS === 'true') {
            chessFacade.registerEngine('gnuchess', new GNUChessAdapter());
        } else {
            console.warn('GNUChess engine is disabled by default. Set ENABLE_GNUCHESS=true to enable it.');
        }

        // Expose getBestMoveWithRetry for engines that may die and need a retry
        // (no change to facade API; adapters handle retries internally)
        chessFacade.registerEngine('fruit', new FruitAdapter());
        chessFacade.registerEngine('toga2', new Toga2Adapter());
        chessFacade.registerEngine('phalanx', new PhalanxAdapter());
        // Sjeng is disabled by default.
        // Enable with: ENABLE_SJENG=true
        if (process.env.ENABLE_SJENG === 'true') {
            chessFacade.registerEngine('sjeng', new SjengAdapter());
        } else {
            console.warn('Sjeng engine is disabled by default. Set ENABLE_SJENG=true to enable it.');
        }
        chessFacade.registerEngine('crafty', new CraftyAdapter());
        chessFacade.registerEngine('glaurung', new GlaurungAdapter());
        // Ethereal is supported but disabled by default due to stability concerns.
        // Enable with: ENABLE_ETHEREAL=true
        if (process.env.ENABLE_ETHEREAL === 'true') {
            chessFacade.registerEngine('ethereal', new EtherealAdapter());
        } else {
            console.warn('Ethereal engine is disabled by default. Set ENABLE_ETHEREAL=true to enable it.');
        }

        console.log('Available engines:', chessFacade.getAvailableEngines());
    } catch (error) {
        console.error('Failed to initialize engines:', error.message);
        process.exit(1);
    }
}

module.exports = { chessFacade, initializeEngines };