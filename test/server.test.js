// Require and stub the real chessService before loading the server so the server
// picks up the stubbed functions.
const chessService = require('../src/chessService');
chessService.chessFacade.getAvailableEngines = vi.fn();
chessService.chessFacade.getAdapter = vi.fn();
chessService.chessFacade.getBestMove = vi.fn();
chessService.initializeEngines = vi.fn();

const request = require('supertest');
const { chessFacade } = chessService;
const app = require('../src/server');

describe('Server API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('GET /api/engines returns engines list', async () => {
        chessFacade.getAvailableEngines.mockReturnValue(['stockfish']);
        chessFacade.getAdapter.mockReturnValue({ unhealthyUntil: null, crashCount: 0, logPath: null });

        const res = await request(app).get('/api/engines');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('engines');
        expect(res.body.engines.length).toBe(1);
        expect(res.body.default).toBe('stockfish');
    });

    test('POST /api/move returns enriched move', async () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        chessFacade.getBestMove.mockResolvedValue({ engine: 'Stockfish', move: 'e2e4' });

        const res = await request(app)
            .post('/api/move')
            .send({ fen, engine: 'stockfish', level: 1 })
            .set('Content-Type', 'application/json');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('response');
        expect(res.body.response).toHaveProperty('move', 'e2e4');
        expect(res.body.response).toHaveProperty('from', 'e2');
        expect(res.body.response).toHaveProperty('to', 'e4');
        expect(res.body.success).toBe(true);
    });

    test('GET /api/health returns status and engines', async () => {
        chessFacade.getAvailableEngines.mockReturnValue([]);
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'healthy');
        expect(res.body).toHaveProperty('engines');
    });

    test('unknown route returns 404', async () => {
        const res = await request(app).get('/not-found');
        expect(res.status).toBe(404);
    });

    test('POST /api/move recovers when initial engine move invalid', async () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        // initial call returns no move
        chessFacade.getBestMove.mockResolvedValue({});

        const adapter = {
            shutdown: vi.fn().mockResolvedValue(),
            initialize: vi.fn().mockResolvedValue(),
            getBestMove: vi.fn().mockResolvedValue({ engine: 'Stockfish', move: 'e2e4' }),
            logPath: null
        };

        chessFacade.getAdapter.mockReturnValue(adapter);

        const res = await request(app)
            .post('/api/move')
            .send({ fen, engine: 'stockfish', level: 1 })
            .set('Content-Type', 'application/json');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.response.move).toBe('e2e4');
        expect(adapter.shutdown).toHaveBeenCalled();
        expect(adapter.initialize).toHaveBeenCalled();
    });

    test('POST /api/move returns 500 when engine errors', async () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        chessFacade.getBestMove.mockRejectedValue(new Error('boom'));
        chessFacade.getAdapter.mockReturnValue(null);

        const res = await request(app)
            .post('/api/move')
            .send({ fen, engine: 'stockfish', level: 1 })
            .set('Content-Type', 'application/json');

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });
});
