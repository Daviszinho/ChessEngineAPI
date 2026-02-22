# Chess Engine API

REST API facade that provides unified access to multiple chess engines (Stockfish, Fruit, Toga2) using the adapter pattern.

## Architecture

- **Facade Pattern**: `ChessEngineFacade` provides unified interface
- **Adapter Pattern**: Each engine has its own adapter
- **REST API**: Express.js server with validation

## Endpoints

### GET /api/engines
Returns available chess engines and supported levels.

Response now includes health and log information for each engine: `{ name, healthy, crashCount, logPath }`. Engines that have crashed repeatedly will be temporarily marked unhealthy; check `logPath` to inspect engine logs.

### POST /api/move
Request body:
```json
{
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "engine": "stockfish",  // optional, defaults to stockfish
    "level": 5              // optional, 1-20, defaults to 1
}
```

Response:
```json
{
    "success": true,
    "request": { "fen": "...", "engine": "...", "level": 5 },
    "response": {
        "engine": "Stockfish",
        "move": "e2e4",
        "ponder": null
    },
    "timestamp": "2024-01-30T..."
}
```

### GET /api/health
Health check endpoint.

## Installation & Running

### Basic Setup (HTTP only)
```bash
npm install
npm start
```
Server runs on http://localhost:3000

Important: this is an API service. `GET /` returns `404` by design. Use `/api/*` endpoints.

### Development mode
```bash
npm run dev
```

### Run with Docker
```bash
# Build image
docker build -t chess-engine-api .

# Run container
docker run --rm -p 3000:3000 --name chess-engine-api chess-engine-api
```

API will be available at `http://localhost:3000`.

### Run with Docker Compose
```bash
docker compose up --build
```

The compose service exposes:
- API at `http://localhost:3000`
- Environment toggles for optional engines (`ENABLE_GNUCHESS`, `ENABLE_SJENG`, `ENABLE_ETHEREAL`)
- OWASP ZAP scanner service via `security` profile

### CORS configuration
CORS is allowlist-based (no wildcard by default).

Use environment variable:
```bash
CORS_ALLOWED_ORIGINS=https://your-frontend.example.com,http://localhost:5173
```

If an Origin is not in this list, the API will not return `Access-Control-Allow-Origin` for that request.

## Testing

```bash
# Unit tests (Vitest + coverage)
npm test

# Single file
npm run test -- test/server.test.js
```

## Security Scanning (OWASP ZAP)

```bash
# Baseline (recommended)
npm run scan:security

# Full scan
npm run scan:security:full

# Quick scan helper
npm run scan:security:quick

# Verify latest report JSON
npm run scan:verify
```

Progress monitor:
```bash
./security/watch-zap-progress.sh 3 60
```

Useful scan env vars:
- `SCAN_TIMEOUT_SECONDS`
- `BASELINE_SPIDER_MINS`
- `BASELINE_PASSIVE_MAX_MINS`
- `ENABLE_ACTIVE_SCAN`
- `SCAN_TARGET_URL`
- `CORS_ALLOWED_ORIGINS`

The local scan script also performs a CORS safety pre-check and can force API rebuild before scanning.

## Publish Container Image (GHCR)

Script:
```bash
./push-ghcr.sh [version] [image_name]
```

Examples:
```bash
CR_PAT=ghp_xxx ./push-ghcr.sh 1.0.0 chess-engine-api
./push-ghcr.sh
```

## Available Engines

The API supports multiple engines. Below is a quick reference showing each engine's executable path and the protocol it speaks:

| Engine | Executable path | Protocol |
|--------|------------------|----------|
| **stockfish** | `/usr/games/stockfish` | UCI |
| **reckless** | `engines/reckless-linux-generic` or `RECKLESS_PATH` | UCI |
| **torch-2** | `engines/torch-2` or `TORCH2_PATH` | UCI |
| **PlentyChess** | `engines/PlentyChess-7.0.0-linux-generic` or `PLENTYCHESS_PATH` | UCI |
| **fruit** | `/usr/games/fruit_21_static` or `fruit_21_static` (in PATH) | UCI |

> Tip: If the engine binary is in a non-standard location, set the `FRUIT_PATH` environment variable to its full path.
| **toga2** | `/usr/games/toga2` | UCI |
| **phalanx** | `/usr/games/phalanx` | XBoard |
| **sjeng** (disabled) | `/usr/games/sjeng` | XBoard |
| **crafty** | `/usr/games/crafty` | XBoard |
| **gnuchess** | `/usr/games/gnuchess` | XBoard |
| **glaurung** | `/usr/games/glaurung` | UCI |
| **ethereal** | `/usr/games/ethereal-chess` or `ethereal-chess` (in PATH) | UCI |

> **Note:** Ethereal and Sjeng are supported but **disabled by default**. To enable them, set `ENABLE_ETHEREAL=true` or `ENABLE_SJENG=true` in the environment before starting the server. If enabled, the engine must be present. GNUChess is also disabled by default for resource reasons (enable with `ENABLE_GNUCHESS=true`).

> Note: XBoard engines are driven using an XBoard-style handshake (eg. `xboard`/`protover`) and may use `depth`/`time` commands instead of UCI options. Level mapping for XBoard engines is approximated (e.g., level -> depth 1..6); see adapters for details.

Response format note

- The API returns engine moves in the engine's typical notation (usually long algebraic coordinates like `e2e4` or `g1f3`).
- For convenience, the API also includes a `san` field when possible (e.g., `Nf3`) computed from the provided FEN, so clients that expect SAN can use it directly.

## AI Consumer Guide

### Production API Endpoint
**Base URI:** `https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io/api/move`

### How to Consume the API (for AI Systems)

#### 1. Making Move Requests
Send POST requests to obtain chess moves from any supported engine:

```javascript
// Example request using fetch
const response = await fetch('https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io/api/move', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        engine: "stockfish",  // optional: engines include stockfish, reckless, torch-2, PlentyChess, fruit, toga2 (UCI) and phalanx, crafty, gnuchess (XBoard)
        level: 5              // optional: 1-20 (strength level)
    })
});

const result = await response.json();
console.log(result.response.move); // Best move (e.g., "e2e4")
```

#### 2. Request Parameters
- **fen** (required): FEN string representing current board position
- **engine** (optional): Engine name, defaults to "stockfish"
- **level** (optional): Skill level 1-20, defaults to 1

#### 3. Response Structure
```json
{
    "success": true,
    "request": {
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "engine": "stockfish",
        "level": 5
    },
    "response": {
        "engine": "Stockfish",
        "move": "e2e4",
        "ponder": null
    },
    "timestamp": "2024-01-30T12:00:00.000Z"
}
```

#### 4. Error Handling
- HTTP 400: Invalid FEN format or missing parameters
- HTTP 500: Engine not available or internal error
- Always check `success` field in response

#### 5. Available Engines Discovery
GET `https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io/api/engines` to list all available engines and their supported levels.

#### 6. Integration Best Practices
- Use retry logic for network failures
- Cache engine responses for identical FEN positions (optional)
- Validate FEN strings before sending requests
- Handle rate limiting appropriately
- Use level 10+ for stronger analysis, lower levels for casual play

#### 7. Example Usage Patterns
```python
import requests

def get_best_move(fen, engine="stockfish", level=5):
    url = "https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io/api/move"
    payload = {"fen": fen, "engine": engine, "level": level}
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data['success']:
            return data['response']['move']
        else:
            return None
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        return None

        
```
