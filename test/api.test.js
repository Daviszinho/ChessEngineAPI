const { spawn } = require('child_process');

function testAPI() {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    const testCases = [
        { engine: 'stockfish', level: 1 },
        { engine: 'stockfish', level: 10 },
        { engine: 'fruit', level: 2 },
        { engine: 'fruit', level: 15 },
        { engine: 'gnuchess', level: 3 },
        { engine: 'gnuchess', level: 8 },
        { engine: 'toga2', level: 5 },
        { engine: 'sjeng', level: 5 }
    ];

    async function runTest(testCase) {
        return new Promise((resolve) => {
            const curl = spawn('curl', [
                '-X', 'POST',
                '-H', 'Content-Type: application/json',
                '-d', JSON.stringify({
                    fen: testFen,
                    engine: testCase.engine,
                    level: testCase.level
                }),
                'http://localhost:3000/api/move'
            ]);

            let output = '';
            curl.stdout.on('data', (data) => {
                output += data.toString();
            });

            curl.on('close', (code) => {
                console.log(`\n=== Test: ${testCase.engine} (level ${testCase.level}) ===`);
                console.log(`Exit code: ${code}`);
                console.log(`Response: ${output}`);
                resolve();
            });
        });
    }

    async function runAllTests() {
        console.log('Testing Chess Engine API...\n');
        
        for (const testCase of testCases) {
            await runTest(testCase);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n=== Testing engines endpoint ===');
        const curlEngines = spawn('curl', ['http://localhost:3000/api/engines']);
        
        curlEngines.stdout.on('data', (data) => {
            console.log(data.toString());
        });
    }

    runAllTests();
}

if (require.main === module) {
    testAPI();
}

module.exports = { testAPI };