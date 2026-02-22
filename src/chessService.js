const ChessEngineFacade = require('./facade/ChessEngineFacade');
const StockfishAdapter = require('./adapters/StockfishAdapter');
const RecklessAdapter = require('./adapters/RecklessAdapter');
const Torch2Adapter = require('./adapters/Torch2Adapter');
const GNUChessAdapter = require('./adapters/GNUChessAdapter');
const FruitAdapter = require('./adapters/FruitAdapter');
const Toga2Adapter = require('./adapters/Toga2Adapter');
const PhalanxAdapter = require('./adapters/PhalanxAdapter');
const SjengAdapter = require('./adapters/SjengAdapter');
const CraftyAdapter = require('./adapters/CraftyAdapter');
const GlaurungAdapter = require('./adapters/GlaurungAdapter');
const EtherealAdapter = require('./adapters/EtherealAdapter');
const fs = require('fs');
const { spawnSync } = require('child_process');

const chessFacade = new ChessEngineFacade();

function isEngineBinaryAvailable(enginePath) {
    if (!enginePath) return false;
    if (enginePath.includes('/')) return fs.existsSync(enginePath);
    const result = spawnSync('which', [enginePath], { encoding: 'utf8' });
    return result.status === 0;
}

function registerIfAvailable(name, adapter) {
    if (isEngineBinaryAvailable(adapter.enginePath)) {
        chessFacade.registerEngine(name, adapter);
    } else {
        console.warn(`Skipping '${name}': binary not found at '${adapter.enginePath}'`);
    }
}

async function initializeEngines() {
    try {
        registerIfAvailable('stockfish', new StockfishAdapter());
        registerIfAvailable('reckless', new RecklessAdapter());
        registerIfAvailable('torch-2', new Torch2Adapter());
        // GNUChess is disabled by default due to high resource consumption on small VMs.
        // Enable with: ENABLE_GNUCHESS=true
        if (process.env.ENABLE_GNUCHESS === 'true') {
            registerIfAvailable('gnuchess', new GNUChessAdapter());
        } else {
            console.warn('GNUChess engine is disabled by default. Set ENABLE_GNUCHESS=true to enable it.');
        }

        // Expose getBestMoveWithRetry for engines that may die and need a retry
        // (no change to facade API; adapters handle retries internally)
        registerIfAvailable('fruit', new FruitAdapter());
        registerIfAvailable('toga2', new Toga2Adapter());
        registerIfAvailable('phalanx', new PhalanxAdapter());
        // Sjeng is disabled by default.
        // Enable with: ENABLE_SJENG=true
        if (process.env.ENABLE_SJENG === 'true') {
            registerIfAvailable('sjeng', new SjengAdapter());
        } else {
            console.warn('Sjeng engine is disabled by default. Set ENABLE_SJENG=true to enable it.');
        }
        registerIfAvailable('crafty', new CraftyAdapter());
        registerIfAvailable('glaurung', new GlaurungAdapter());
        // Ethereal is supported but disabled by default due to stability concerns.
        // Enable with: ENABLE_ETHEREAL=true
        if (process.env.ENABLE_ETHEREAL === 'true') {
            registerIfAvailable('ethereal', new EtherealAdapter());
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
