const { exec } = require('child_process');
// Use PowerShell to get folder size

function checkNeo4jSize() {
    return new Promise((resolve, reject) => {
        const NEO4J_DATA_PATH = process.env.DB_PATH;
        const MAX_SIZE_BYTES = process.env.DB_SIZE;

        const cmd = `powershell -Command "(Get-ChildItem -Recurse -Force '${NEO4J_DATA_PATH}' | Measure-Object -Property Length -Sum).Sum"`;

        require('child_process').exec(cmd, (err, stdout) => {
            if (err) return reject(err);
            const size = parseInt(stdout.trim(), 10);
            console.log(size)
            if (isNaN(size)) return reject(new Error('Invalid size'));

            console.log(`DB size: ${(size / 1024 ** 3).toFixed(2)} GB`);
            if (size > MAX_SIZE_BYTES) {
                console.warn('Exceeded 200 GB. Exiting...');
                process.kill(process.pid, 'SIGINT');
            } else {
                resolve();
            }
        });
    });
}

module.exports = { checkNeo4jSize }
