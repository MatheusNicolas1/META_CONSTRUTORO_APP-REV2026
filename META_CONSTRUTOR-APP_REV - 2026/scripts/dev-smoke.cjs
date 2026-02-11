const { spawn } = require('child_process');
const http = require('http');

const PORT = 5173;
const URL = `http://localhost:${PORT}/`;
const TIMEOUT_MS = 60000; // 60s timeout

console.log(`Starting dev server smoke test on ${URL}...`);

// Start npm run dev
const devServer = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
});

let serverReady = false;

// Pipe output to console for debugging
devServer.stdout.on('data', (data) => {
    const msg = data.toString();
    // console.log('[DEV]', msg.trim()); // Optional: uncomment if needed
    if (msg.includes('Local:') && msg.includes(`${PORT}`)) {
        console.log('Vite detected open port...');
        serverReady = true;
    }
});

devServer.stderr.on('data', (data) => {
    console.error('[DEV ERROR]', data.toString());
});

// Polling function
function checkServer() {
    const req = http.get(URL, (res) => {
        console.log(`Response Status: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200 && data.includes('<div id="root">')) {
                console.log('PASS: Server returned 200 and includes <div id="root">');
                cleanup(0);
            } else {
                if (res.statusCode !== 200) {
                    console.error(`FAIL: Status code ${res.statusCode}`);
                } else {
                    console.error('FAIL: Content does not contain <div id="root">');
                }
                cleanup(1);
            }
        });
    });

    req.on('error', (err) => {
        // Connection refused is expected while starting
        if (err.code !== 'ECONNREFUSED') {
            console.log(`Waiting for server... (${err.message})`);
        }
    });
}

// Loop checker
const interval = setInterval(checkServer, 2000);

// Timeout
const timeout = setTimeout(() => {
    console.error('TIMEOUT: Server did not respond in time.');
    cleanup(1);
}, TIMEOUT_MS);

function cleanup(code) {
    clearInterval(interval);
    clearTimeout(timeout);
    console.log(`Exiting with code ${code}`);

    // Kill process tree
    if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', devServer.pid, '/f', '/t']);
    } else {
        devServer.kill('SIGTERM');
    }

    process.exit(code);
}
