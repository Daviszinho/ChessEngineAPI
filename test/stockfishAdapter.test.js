const StockfishAdapter = require('../src/adapters/StockfishAdapter');

describe('StockfishAdapter', () => {
    test('applies level-dependent strength options before searching', () => {
        const adapter = new StockfishAdapter();
        const commands = [];
        adapter.sendCommand = (command) => commands.push(command);

        adapter.setupGame('fen-test', 1);

        expect(commands).toEqual([
            'ucinewgame',
            'setoption name Ponder value false',
            'setoption name Skill Level value 1',
            'setoption name UCI_LimitStrength value true',
            'setoption name UCI_Elo value 1350',
            'position fen fen-test',
            'go movetime 120'
        ]);
    });

    test('uses full strength at level 20', () => {
        const adapter = new StockfishAdapter();
        const commands = [];
        adapter.sendCommand = (command) => commands.push(command);

        adapter.setupGame('fen-test', 20);

        expect(commands).toContain('setoption name UCI_LimitStrength value false');
        expect(commands).not.toContain(expect.stringContaining('setoption name UCI_Elo value'));
        expect(commands).toContain('go movetime 2500');
    });
});
