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
        const engines = chessFacade.getAvailableEngines();
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
        
        const result = await chessFacade.getBestMove(fen, engine, level);

        // Try to compute SAN from engine move when possible
        let san = null;
        try {
            if (result && result.move && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(result.move)) {
                const chess = new Chess(fen);
                const from = result.move.slice(0,2);
                const to = result.move.slice(2,4);
                const promotion = result.move.length > 4 ? result.move[4] : undefined;
                const mv = chess.move({ from, to, promotion });
                if (mv) san = mv.san;
            }
        } catch (e) {
            console.warn('Failed to compute SAN for engine move:', e.message);
        }

        const responsePayload = Object.assign({}, result, { san });
        
        res.json({
            success: true,
            request: { fen, engine, level },
            response: responsePayload,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Move calculation error:', error);
        res.status(500).json({ 
            error: error.message,
            success: false
        });
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