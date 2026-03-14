const { validateMoveRequest } = require('../src/middleware/validation');

describe('validateMoveRequest middleware', () => {
    function mockRes() {
        const res = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    }

    test('passes valid body', () => {
        const req = { body: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', engine: 'stockfish', level: 3 } };
        const res = mockRes();
        const next = vi.fn();
        validateMoveRequest(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.body.engine).toBe('stockfish');
        expect(req.body.level).toBe(3);
    });

    test('accepts reckless as valid engine', () => {
        const req = { body: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', engine: 'reckless', level: 5 } };
        const res = mockRes();
        const next = vi.fn();
        validateMoveRequest(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.body.engine).toBe('reckless');
    });

    test('accepts torch-2 as valid engine', () => {
        const req = { body: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', engine: 'torch-2', level: 5 } };
        const res = mockRes();
        const next = vi.fn();
        validateMoveRequest(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.body.engine).toBe('torch-2');
    });

    test('accepts PlentyChess as valid engine', () => {
        const req = { body: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', engine: 'PlentyChess', level: 5 } };
        const res = mockRes();
        const next = vi.fn();
        validateMoveRequest(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.body.engine).toBe('PlentyChess');
    });

    test('accepts berserk as valid engine', () => {
        const req = { body: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', engine: 'berserk', level: 5 } };
        const res = mockRes();
        const next = vi.fn();
        validateMoveRequest(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.body.engine).toBe('berserk');
    });

    test('rejects invalid fen', () => {
        const req = { body: { fen: 'invalid fen', engine: 'stockfish', level: 1 } };
        const res = mockRes();
        const next = vi.fn();
        validateMoveRequest(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalled();
        const jsonArg = res.json.mock.calls[0][0];
        expect(jsonArg).toHaveProperty('error', 'Validation failed');
        expect(jsonArg.details.length).toBeGreaterThan(0);
    });

    test('rejects missing fen', () => {
        const req = { body: { engine: 'stockfish' } };
        const res = mockRes();
        const next = vi.fn();
        validateMoveRequest(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
