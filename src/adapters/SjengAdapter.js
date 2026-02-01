const ChessEngineAdapter = require('./ChessEngineAdapter');

class SjengAdapter extends ChessEngineAdapter {
    constructor() {
        // Prefer XBoard-style startup for Sjeng; fallback to UCI if needed
        super('/usr/games/sjeng', [], { initTimeoutMs: 20000 });
        this.engineName = 'Sjeng';
        this.usingXBoard = false;
    }

    async initialize() {
        // Only XBoard-style attempts (no UCI)
        const attempts = [
            [],            // bare binary (often XBoard)
            ['-x'],        // explicit xboard flag
            ['-xboard'],   // alternate xboard flag
            ['-x', '-o', '-'] // xboard with polling input off
        ];

        let lastError = null;

        for (const args of attempts) {
            this.engineArgs = args;
            try {
                console.log(`Sjeng: attempting initialize with args: ${args.join(' ') || '<none>'}`);
                await super.initialize();
                // Force XBoard mode for Sjeng
                this.usingXBoard = true;
                console.log(`Sjeng initialized in XBoard mode with args: ${args.join(' ') || '<none>'}`);
                return;
            } catch (err) {
                lastError = err;
                console.warn(`Sjeng init with args [${args.join(' ')}] failed: ${err.message}`);
                // Ensure we shut down any partially started process before next attempt
                try {
                    await this.shutdown();
                } catch (e) {
                    // ignore shutdown errors
                }
            }
        }

        // All attempts failed
        throw new Error(`Sjeng initialization failed after attempts. Last error: ${lastError && lastError.message ? lastError.message : 'unknown'}`);
    }

    // XBoard handshake - declare protocol support and wait for feature lines
    handshake() {
        this.awaitingFeature = true;

        // Prepare per-process log file for Sjeng
        try {
            const fs = require('fs');
            const p = `/tmp/sjeng-${Date.now()}.log`;
            this.logPath = p;
            fs.writeFileSync(p, `=== Sjeng log start: ${new Date().toISOString()} ===\n`);
            console.log(`${this.engineName} logging to ${p}`);
        } catch (e) {
            console.warn('Could not create log file for Sjeng:', e.message);
            this.logPath = null;
        }

        this.sendCommand('xboard');
        this.sendCommand('protover 2');
    }

    handleEngineOutput(line) {
        const trimmed = (line || '').replace(/[^\S\r\n]+/g, ' ').trim();

        // If we're awaiting feature lines, wait for 'feature ... done=1'
        if (this.awaitingFeature && /^feature\b/i.test(trimmed)) {
            console.log(`${this.engineName} received feature during handshake: '${trimmed}'`);
            if (this.logPath) { const fs = require('fs'); fs.appendFileSync(this.logPath, `STDOUT: ${trimmed}\n`); }
            if (/\bdone=1\b/i.test(trimmed)) {
                this.awaitingFeature = false;
                if (!this.isReady) {
                    console.log(`${this.engineName} marking ready after feature negotiation`);
                    this.emit('ready');
                }
            }
            return;
        }

        if (trimmed) {
            console.log(`[${this.engineName}] stdout: ${trimmed}`);
            if (this.logPath) { const fs = require('fs'); fs.appendFileSync(this.logPath, `STDOUT: ${trimmed}\n`); }
        }

        // Detect prompt or prompt-with-move like 'Sjeng: e2e4'
        if (!this.isReady && (/^\[.*\]$/.test(trimmed) || /^sjeng:\s*$/.test(trimmed) || /^sjeng:/i.test(trimmed))) {
            console.log(`${this.engineName} detected ready via prompt: '${trimmed}'`);
            this.emit('ready');
            // If prompt includes move like 'Sjeng: e2e4' try to parse it fall-through
        }

        // Parse various move output patterns
        let moveMatch = trimmed.match(/^sjeng:\s*([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (!moveMatch) moveMatch = trimmed.match(/My move is\s*:\s*([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (!moveMatch) moveMatch = trimmed.match(/^[0-9]+\.\s*\.\.\.\s*([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (!moveMatch) moveMatch = trimmed.match(/(^|\s)([a-h][1-8][a-h][1-8][qrbn]?)(\s|$)/i);

        if (moveMatch) {
            const mv = (Array.isArray(moveMatch) ? (moveMatch[1] || moveMatch[2]) : moveMatch);
            const move = (mv || '').trim();
            if (move) {
                if (this.logPath) { const fs = require('fs'); fs.appendFileSync(this.logPath, `BESTMOVE: ${move}\n`); }
                console.log(`${this.engineName} parsed move: ${move}`);
                this.emit('bestmove', {
                    engine: this.engineName,
                    move: move,
                    ponder: null
                });
                return;
            }
        }

        super.handleEngineOutput(line);
    }

    setupGame(fen, level) {
        if (this.usingXBoard) {
            // XBoard-style game setup for Sjeng (map level -> depth 1..6)
            this.sendCommand('new');
            this.sendCommand(`setboard ${fen}`);
            const depth = Math.max(1, Math.min(6, Math.floor(level)));
            this.sendCommand(`depth ${depth}`);
            this.sendCommand('go');
            if (this.logPath) { const fs = require('fs'); fs.appendFileSync(this.logPath, `SETUP: depth=${depth} fen=${fen}\n`); }
        } else {
            // UCI-style setup
            super.setupGame(fen, level);
        }
    }
}

module.exports = SjengAdapter;
