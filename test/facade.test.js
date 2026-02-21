const ChessEngineFacade = require('../src/facade/ChessEngineFacade');

describe('ChessEngineFacade', () => {
    test('registers and retrieves adapter', () => {
        const facade = new ChessEngineFacade();
        const adapter = { getBestMove: vi.fn().mockResolvedValue('e2e4') };
        facade.registerEngine('Stockfish', adapter);
        expect(facade.getAdapter('stockfish')).toBe(adapter);
        expect(facade.getAvailableEngines()).toContain('stockfish');
    });

    test('getBestMove uses adapter and returns move', async () => {
        const facade = new ChessEngineFacade();
        const adapter = { getBestMove: vi.fn().mockResolvedValue('e2e4') };
        facade.registerEngine('stockfish', adapter);
        const move = await facade.getBestMove('somefen', 'stockfish', 5);
        expect(adapter.getBestMove).toHaveBeenCalledWith('somefen', 5);
        expect(move).toBe('e2e4');
    });

    test('getAdapter handles undefined name and getBestMove uses default engine', async () => {
        const facade = new ChessEngineFacade();
        const adapter = { getBestMove: vi.fn().mockResolvedValue('d2d4') };
        facade.registerEngine('stockfish', adapter);

        // getAdapter with undefined should return undefined
        expect(facade.getAdapter()).toBeUndefined();

        // Calling getBestMove without engine should use defaultEngine ('stockfish')
        const move = await facade.getBestMove('somefen');
        expect(adapter.getBestMove).toHaveBeenCalledWith('somefen', 1);
        expect(move).toBe('d2d4');
    });

    test('getBestMove throws if engine not available', async () => {
        const facade = new ChessEngineFacade();
        await expect(facade.getBestMove('fen', 'unknown')).rejects.toThrow(/not available/i);
    });
});

