const { chessFacade, initializeEngines } = require('../shared/chessService');
const { moveRequestSchema } = require('../shared/middleware/validation');
const { Chess } = require('chess.js');

// Global initialization flag
let isInitialized = false;

module.exports = async function (context, req) {
    context.log('Processing ChessMove request');

    // 1. Initialization
    if (!isInitialized) {
        try {
            await initializeEngines();
            isInitialized = true;
            context.log('Chess engines initialized successfully');
        } catch (error) {
            context.log.error('Failed to initialize engines:', error);
            context.res = {
                status: 500,
                body: { error: 'Failed to initialize chess engines', details: error.message }
            };
            return; // Exit
        }
    }

    // 2. Validation
    const { error, value } = moveRequestSchema.validate(req.body);
    if (error) {
        context.res = {
            status: 400,
            body: {
                error: 'Validation failed',
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            }
        };
        return;
    }

    const { fen, engine, level } = value;
    context.log(`Request: FEN=${fen}, Engine=${engine}, Level=${level}`);

    try {
        // 3. Get Best Move
        let result = await chessFacade.getBestMove(fen, engine, level);

        // 4. Enrich and Validate (same logic as src/server.js)
        async function enrichAndValidateMove(moveObj) {
            const payload = Object.assign({}, moveObj);
            if (!moveObj || !moveObj.move) return { payload, valid: false, reason: 'No move returned by engine' };

            const move = moveObj.move;
            // long-algebraic like e2e4
            const isLong = /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move);
            if (isLong) {
                const from = move.slice(0, 2);
                const to = move.slice(2, 4);
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
                return { payload, valid: true };
            }
        }

        let { payload, valid, reason } = await enrichAndValidateMove(result);

        if (!valid) {
            context.log.warn(`Engine move invalid: ${reason}. Attempting reinit+retry...`);
            // Attempt recovery
            try {
                const adapter = chessFacade.getAdapter(engine);
                if (adapter) {
                    await adapter.shutdown();
                    // small pause
                    await new Promise(r => setTimeout(r, 200));
                    await adapter.initialize();
                    const retryResult = await adapter.getBestMove(fen, level);
                    const enriched = await enrichAndValidateMove(retryResult);
                    if (enriched.valid) {
                        payload = enriched.payload;
                        valid = true;
                        result = retryResult;
                    } else {
                        const logPath = adapter.logPath || null;
                        const errMsg = `Engine returned invalid move after retry: ${enriched.reason}` + (logPath ? `; log: ${logPath}` : '');
                        throw new Error(errMsg);
                    }
                } else {
                    throw new Error('Adapter not found for recovery');
                }
            } catch (err) {
                context.log.error('Recovery attempt failed:', err.message);
                context.res = {
                    status: 500,
                    body: { error: err.message, success: false }
                };
                return;
            }
        }

        const responsePayload = Object.assign({}, result, payload);

        context.res = {
            status: 200,
            body: {
                success: true,
                request: { fen, engine, level },
                response: responsePayload,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        context.log.error('Move calculation error:', error);
        const adapter = chessFacade.getAdapter(engine);
        const logPath = adapter?.logPath || null;
        const payload = { error: error.message, success: false };
        if (logPath) payload.log = logPath;

        context.res = {
            status: 500,
            body: payload
        };
    }
};