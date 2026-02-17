const ChessEngineAdapter = require('./ChessEngineAdapter');

class PhalanxAdapter extends ChessEngineAdapter {
    constructor() {
        // Use default xboard mode (no -x-). Keep default polling input.
        super('/usr/games/phalanx', []);
        this.engineName = 'Phalanx';
    }

    // XBoard-style handshake: detect the engine prompt or startup text to mark ready
    handleEngineOutput(line) {
        // Detect initial prompt like: [ white, 1 ] or other startup lines
        if (!this.isReady && /^\[.*\]$/.test(line.trim())) {
            this.emit('ready');
            return;
        }

        // Phalanx may print moves in formats similar to GNUChess; attempt to parse SAN or long algebraic
        const moveMatch = line.match(/^[a-h][1-8][a-h][1-8][qrbn]?$/i) || line.match(/^(?:O-O-O|O-O)$/i) || line.match(/^(?:White|Black).*mov(?:es?)\s*:?.*([a-h][1-8][a-h][1-8][qrbn]?)/i) || line.match(/^move\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
        if (moveMatch) {
            const m = Array.isArray(moveMatch) ? moveMatch[1] || moveMatch[0] : moveMatch;
            this.emit('bestmove', {
                engine: this.engineName,
                move: m,
                ponder: null
            });
            return;
        }

        // Fall back to parent handler for other statuses
        super.handleEngineOutput(line);
    }

    // XBoard-style game setup
    setupGame(fen, level) {
        // Use xboard commands compatible with Phalanx
        this.sendCommand('new');
        this.sendCommand(`setboard ${fen}`);
        // Map level to a fixed search time in seconds for phalanx (approximation)
        const seconds = Math.max(1, Math.min(60, Math.floor(level * 3)));
        this.sendCommand(`time ${seconds}`); // if supported
        this.sendCommand('go');
    }
}

module.exports = PhalanxAdapter;
