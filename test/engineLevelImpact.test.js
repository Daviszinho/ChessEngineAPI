const Toga2Adapter = require('../src/adapters/Toga2Adapter');
const FruitAdapter = require('../src/adapters/FruitAdapter');
const GlaurungAdapter = require('../src/adapters/GlaurungAdapter');
const EtherealAdapter = require('../src/adapters/EtherealAdapter');
const GNUChessAdapter = require('../src/adapters/GNUChessAdapter');
const CraftyAdapter = require('../src/adapters/CraftyAdapter');
const PhalanxAdapter = require('../src/adapters/PhalanxAdapter');
const SjengAdapter = require('../src/adapters/SjengAdapter');

function captureCommands(adapter) {
    const commands = [];
    adapter.sendCommand = (command) => commands.push(command);
    return commands;
}

describe('Engine level impact', () => {
    test('Toga2 changes movetime by level', () => {
        const adapter = new Toga2Adapter();
        const commands = captureCommands(adapter);
        adapter.setupGame('fen', 1);
        expect(commands).toContain('go movetime 100');

        commands.length = 0;
        adapter.setupGame('fen', 20);
        expect(commands).toContain('go movetime 2200');
    });

    test('Fruit changes depth and movetime by level', () => {
        const adapter = new FruitAdapter();
        const commands = captureCommands(adapter);
        adapter.setupGame('fen', 1);
        expect(commands).toContain('go depth 2 movetime 120');

        commands.length = 0;
        adapter.setupGame('fen', 20);
        expect(commands).toContain('go depth 16 movetime 2200');
    });

    test('Glaurung changes movetime by level', () => {
        const adapter = new GlaurungAdapter();
        const commands = captureCommands(adapter);
        adapter.setupGame('fen', 1);
        expect(commands).toContain('go movetime 120');

        commands.length = 0;
        adapter.setupGame('fen', 20);
        expect(commands).toContain('go movetime 2400');
    });

    test('Ethereal changes movetime and resources by level', () => {
        const adapter = new EtherealAdapter();
        const commands = captureCommands(adapter);
        adapter.setupGame('fen', 1);
        expect(commands).toContain('setoption name Threads value 1');
        expect(commands).toContain('setoption name Hash value 16');
        expect(commands).toContain('go movetime 120');

        commands.length = 0;
        adapter.setupGame('fen', 20);
        expect(commands).toContain('setoption name Threads value 2');
        expect(commands).toContain('setoption name Hash value 32');
        expect(commands).toContain('go movetime 2600');
    });

    test('GNUChess changes depth and st by level', () => {
        const adapter = new GNUChessAdapter();
        const commands = captureCommands(adapter);
        adapter.setupGame('fen', 1);
        expect(commands).toContain('depth 2');
        expect(commands).toContain('st 1');

        commands.length = 0;
        adapter.setupGame('fen', 20);
        expect(commands).toContain('depth 18');
        expect(commands).toContain('st 15');
    });

    test('Crafty changes depth and st by level', () => {
        const adapter = new CraftyAdapter();
        const commands = captureCommands(adapter);
        adapter.setupGame('fen', 1);
        expect(commands).toContain('sd 2');
        expect(commands).toContain('st 1');

        commands.length = 0;
        adapter.setupGame('fen', 20);
        expect(commands).toContain('sd 24');
        expect(commands).toContain('st 20');
    });

    test('Phalanx changes depth/time by level', () => {
        const adapter = new PhalanxAdapter();
        const commands = captureCommands(adapter);
        adapter.setupGame('fen', 1);
        expect(commands).toContain('depth 2');
        expect(commands).toContain('st 1');
        expect(commands).toContain('time 100');

        commands.length = 0;
        adapter.setupGame('fen', 20);
        expect(commands).toContain('depth 14');
        expect(commands).toContain('st 20');
        expect(commands).toContain('time 2000');
    });

    test('Sjeng changes xboard depth and st by level', () => {
        const adapter = new SjengAdapter();
        adapter.usingXBoard = true;
        const commands = captureCommands(adapter);
        adapter.setupGame('fen', 1);
        expect(commands).toContain('depth 2');
        expect(commands).toContain('st 1');

        commands.length = 0;
        adapter.setupGame('fen', 20);
        expect(commands).toContain('depth 18');
        expect(commands).toContain('st 15');
    });
});
