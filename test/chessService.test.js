const fs = require('fs');
const child = require('child_process');
const { chessFacade, initializeEngines } = require('../src/chessService');

describe('chessService initializeEngines', () => {
  beforeEach(() => {
    // clear registered adapters
    chessFacade.adapters.clear();
    vi.restoreAllMocks();
    delete process.env.ENABLE_GNUCHESS;
    delete process.env.ENABLE_SJENG;
    delete process.env.ENABLE_ETHEREAL;
  });

  test('registers engines when binaries are available', async () => {
    // simulate "which" finds binaries
    vi.spyOn(child, 'spawnSync').mockReturnValue({ status: 0 });
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);

    process.env.ENABLE_GNUCHESS = 'true';
    process.env.ENABLE_SJENG = 'true';
    process.env.ENABLE_ETHEREAL = 'true';

    await initializeEngines();

    const engines = chessFacade.getAvailableEngines();
    expect(engines.length).toBeGreaterThan(0);
    expect(engines).toContain('stockfish');
    expect(engines).toContain('reckless');
    expect(engines).toContain('torch-2');
  });

  test('skips engines when binaries not found', async () => {
    vi.spyOn(child, 'spawnSync').mockReturnValue({ status: 1 });
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    await initializeEngines();

    const engines = chessFacade.getAvailableEngines();
    // stockfish uses a path and should be skipped when binaries unavailable
    expect(engines).not.toContain('stockfish');
  });
});
