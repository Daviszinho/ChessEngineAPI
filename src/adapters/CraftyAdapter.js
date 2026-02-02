const ChessEngineAdapter = require('./ChessEngineAdapter');

class CraftyAdapter extends ChessEngineAdapter {
    constructor() {
        // Crafty typically speaks XBoard/WinBoard protocol
        super('/usr/games/crafty', [], { initTimeoutMs: 15000 });
        this.engineName = 'Crafty';
        this.usingXBoard = false;
        this.awaitingFeature = false;
    }

    async initialize() {
        const attempts = [
            [], // Bare binary (starts with standard CLI, we'll send 'xboard')
        ];

        let lastError = null;

        for (const args of attempts) {
            this.engineArgs = args;
            try {
                console.log(`Crafty: attempting initialize with args: ${args.join(' ') || '<none>'}`);
                await super.initialize();
                this.usingXBoard = true;
                console.log(`Crafty initialized in XBoard mode with args: ${args.join(' ') || '<none>'}`);
                return;
            } catch (err) {
                lastError = err;
                console.warn(`Crafty init with args [${args.join(' ')}] failed: ${err.message}`);
                try {
                    await this.shutdown();
                } catch (e) {
                    // ignore shutdown errors
                }
            }
        }

        throw new Error(`Crafty initialization failed after attempts. Last error: ${lastError && lastError.message ? lastError.message : 'unknown'}`);
    }

    handshake() {
        this.awaitingFeature = true;

        // Start XBoard protocol
        this.sendCommand('xboard');
        this.sendCommand('protover 2');
    }

    handleEngineOutput(line) {
        const trimmed = (line || '').replace(/[^\S\r\n]+/g, ' ').trim();

        // XBoard feature negotiation
        if (this.awaitingFeature && /^feature\b/i.test(trimmed)) {
            console.log(`${this.engineName} feature: ${trimmed}`);
            if (/\bdone=1\b/i.test(trimmed)) {
                this.awaitingFeature = false;
                if (!this.isReady) {
                    this.emit('ready');
                }
            }
            return;
        }

        // Ready detection via prompt
        if (!this.isReady && (/^crafty:/i.test(trimmed) || /^\[.*\]$/.test(trimmed))) {
            console.log(`${this.engineName} detected ready via prompt: '${trimmed}'`);
            this.emit('ready');
        }

        if (trimmed) {
            console.log(`[${this.engineName}] stdout: ${trimmed}`);
        }

        // Parse move output
        // Crafty's move output often looks like: "move e2e4" or "White (or Black) moves: e2e4"
        let moveMatch = trimmed.match(/^move\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (!moveMatch) moveMatch = trimmed.match(/^(?:White|Black).*mov(?:es?)\s*:?.*([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (!moveMatch) moveMatch = trimmed.match(/^([a-h][1-8][a-h][1-8][qrbn]?)$/i); // Naked move

        if (moveMatch) {
            const move = moveMatch[1] || moveMatch[0];
            if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move.trim())) {
                console.log(`${this.engineName} parsed move: ${move.trim()}`);
                this.emit('bestmove', {
                    engine: this.engineName,
                    move: move.trim(),
                    ponder: null
                });
                return;
            }
        }

        super.handleEngineOutput(line);
    }

    setupGame(fen, level) {
        console.log(`${this.engineName} setting up game: level=${level} FEN=${fen}`);
        this.sendCommand('new');
        this.sendCommand('easy'); // Turn off pondering
        this.sendCommand('san 0'); // Force coordinate notation (e2e4 instead of e4)
        this.sendCommand(`setboard ${fen}`);

        // Map level to search depth
        const depth = Math.max(1, Math.min(12, Math.floor(level * 1.5)));
        this.sendCommand(`sd ${depth}`);

        this.sendCommand('go');
    }

}

module.exports = CraftyAdapter;

