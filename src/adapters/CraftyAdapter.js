const ChessEngineAdapter = require('./ChessEngineAdapter');
const fs = require('fs');

class CraftyAdapter extends ChessEngineAdapter {
    constructor() {
        const envPath = process.env.CRAFTY_PATH;
        const candidates = [
            envPath,
            '/usr/games/crafty',
            '/usr/bin/crafty',
            'crafty'
        ].filter(Boolean);
        const resolvedPath = candidates.find(p => p.includes('/') ? fs.existsSync(p) : true) || 'crafty';
        // Crafty typically speaks XBoard/WinBoard protocol
        super(resolvedPath, [], { initTimeoutMs: 15000 });
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
        if (!trimmed) return;

        console.log(`[${this.engineName}] STDOUT: "${trimmed}"`);

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
        if (!this.isReady && (/^crafty:/i.test(trimmed) || /^\[.*\]$/.test(trimmed) || /^White\(\d+\):/i.test(trimmed) || /^Black\(\d+\):/i.test(trimmed))) {
            console.log(`${this.engineName} detected ready via prompt: '${trimmed}'`);
            this.emit('ready');
        }

        // Parse move output
        // 1. Check for Castling first (O-O-O or O-O)
        const castleMatch = trimmed.match(/(?:\bmove\s+)?(O-O-O|O-O)/i);
        if (castleMatch) {
            const castle = castleMatch[1].toUpperCase();
            let move = '';
            // Determine side from current FEN (default to white if not present)
            const side = (this.currentFen && this.currentFen.includes(' b ')) ? 'black' : 'white';

            if (castle === 'O-O-O') {
                move = (side === 'white') ? 'e1c1' : 'e8c8';
            } else {
                move = (side === 'white') ? 'e1g1' : 'e8g8';
            }

            console.log(`${this.engineName} converted castle "${castle}" for ${side} -> "${move}"`);
            this.emit('bestmove', {
                engine: this.engineName,
                move: move,
                ponder: null
            });
            return;
        }

        // 2. Handle Complex/LAN moves (Nb1c3, d5xe4, e2e4)
        const moveRegex = /(?:\bmove\s+)?(?:[PNBRQK])?([a-h][1-8])[x-]?([a-h][1-8][qrbn]?)/i;
        const moveMatch = trimmed.match(moveRegex);

        if (moveMatch) {
            const source = moveMatch[1];
            const dest = moveMatch[2];
            const move = (source + dest).toLowerCase();

            console.log(`${this.engineName} parsed complex move from "${trimmed}" -> "${move}"`);
            this.emit('bestmove', {
                engine: this.engineName,
                move: move,
                ponder: null
            });
            return;
        }



        super.handleEngineOutput(line);
    }


    setupGame(fen, level) {
        console.log(`${this.engineName} setting up game: level=${level} FEN=${fen}`);
        this.currentFen = fen; // Guardamos el FEN para saber de quién es el turno en el enroque
        this.sendCommand('new');
        this.sendCommand('easy'); // Turn off pondering
        this.sendCommand('output long'); // Correct command for Crafty to use coordinates
        this.sendCommand(`setboard ${fen}`);

        // Map level to search depth
        const depth = Math.max(1, Math.min(12, Math.floor(level * 1.5)));
        this.sendCommand(`sd ${depth}`);

        this.sendCommand('go');
    }

}

module.exports = CraftyAdapter;
