const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { chessFacade, initializeEngines } = require('./chessService');
const { Chess } = require('chess.js');
const { validateMoveRequest } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/engines', (req, res) => {
    try {
        const engineNames = chessFacade.getAvailableEngines();
        const engines = engineNames.map(name => {
            const adapter = chessFacade.getAdapter(name);
            const unhealthy = adapter && adapter.unhealthyUntil && Date.now() < adapter.unhealthyUntil;
            return {
                name,
                healthy: !unhealthy,
                crashCount: adapter?.crashCount || 0,
                logPath: adapter?.logPath || null
            };
        });
        res.json({ 
            engines,
            default: 'stockfish',
            supportedLevels: { min: 1, max: 20 }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/move', validateMoveRequest, async (req, res) => {
    try {
        const { fen, engine, level } = req.body;
        
        console.log(`Request: FEN=${fen}, Engine=${engine}, Level=${level}`);
        
        let result = await chessFacade.getBestMove(fen, engine, level);

        // Validate move and enrich response (san, from, to). If move invalid, try one recovery attempt (reinit engine and retry).
        async function enrichAndValidateMove(moveObj) {
            const payload = Object.assign({}, moveObj);
            if (!moveObj || !moveObj.move) return { payload, valid: false, reason: 'No move returned by engine' };

            const move = moveObj.move;
            // long-algebraic like e2e4
            const isLong = /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move);
            if (isLong) {
                const from = move.slice(0,2);
                const to = move.slice(2,4);
                const promotion = move.length > 4 ? move[4] : undefined;
                try {
                    const chess = new Chess(fen);
                    const mv = chess.move({ from, to, promotion });
                    if (mv) {
                        payload.san = mv.san;
                        payload.from = from;
                        payload.to = to;
                        return { payload, valid: true };
                    } else {
                        return { payload, valid: false, reason: `Invalid move: ${JSON.stringify({ from, to })}` };
                    }
                } catch (e) {
                    return { payload, valid: false, reason: `Failed to compute SAN: ${e.message}` };
                }
            } else {
                // Not long algebraic: we leave as-is; clients can parse 'move' field.
                return { payload, valid: true };
            }
        }

        let { payload, valid, reason } = await enrichAndValidateMove(result);

        if (!valid) {
            console.warn(`Engine move invalid: ${reason}. Attempting reinit+retry...`);
            // Attempt recovery: reinit adapter and retry once
            try {
                const adapter = chessFacade.getAdapter(engine);
                if (adapter) {
                    await adapter.shutdown();
                    // small pause to ensure process is gone
                    await new Promise(r => setTimeout(r, 200));
                    await adapter.initialize();
                    const retryResult = await adapter.getBestMove(fen, level);
                    const enriched = await enrichAndValidateMove(retryResult);
                    if (enriched.valid) {
                        payload = enriched.payload;
                        valid = true;
                        result = retryResult;
                    } else {
                        // attach logs path if present
                        const logPath = adapter.logPath || null;
                        const errMsg = `Engine returned invalid move after retry: ${enriched.reason}` + (logPath ? `; log: ${logPath}` : '');
                        throw new Error(errMsg);
                    }
                } else {
                    throw new Error('Adapter not found for recovery');
                }
            } catch (err) {
                console.error('Recovery attempt failed:', err.message);
                return res.status(500).json({ error: err.message, success: false });
            }
        }

        // include engine move fields
        const responsePayload = Object.assign({}, result, payload);

        res.json({
            success: true,
            request: { fen, engine, level },
            response: responsePayload,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Move calculation error:', error);
        const adapter = chessFacade.getAdapter(req.body?.engine);
        const logPath = adapter?.logPath || null;
        const payload = { error: error.message, success: false };
        if (logPath) payload.log = logPath;
        res.status(500).json(payload);
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        engines: chessFacade.getAvailableEngines()
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
    try {
        await initializeEngines();
        
        app.listen(PORT, () => {
            console.log(`Chess Engine API running on port ${PORT}`);
            console.log(`Available endpoints:`);
            console.log(`  GET  /api/engines - List available engines`);
            console.log(`  POST /api/move    - Get best move from engine`);
            console.log(`  GET  /api/health  - Health check`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;