const fs = require('fs');
const path = require('path');

const FORBIDDEN_KEYWORDS = [
    'mock', 'fake', 'dummy', 'sample', 'fixture', 'defaultData',
    'Vista Verde'
];

const EXCLUSIONS = [
    'test', 'spec', 'verify_no_fake_data.js', 'verify_no_fake_data.cjs',
    'node_modules', '.git', 'dist', 'build', 'SCAN_FAKE_DATA.md'
];

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    let violations = [];

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!EXCLUSIONS.some(ex => fullPath.includes(ex))) {
                violations = violations.concat(scanDir(fullPath));
            }
        } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
            if (EXCLUSIONS.some(ex => file.includes(ex))) continue;

            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) return;

                // Keyword Check
                FORBIDDEN_KEYWORDS.forEach(keyword => {
                    // Avoid matching "Residencial" inside simple comments if we missed the start check, 
                    // or valid variable names if they just contain it but arent it.
                    // Strict word boundary for some, loose for others? 
                    // 'Residencial' might be in a string literals: "Residencial Something".

                    if (line.includes(keyword)) {
                        // refined check: if it's a string literal or variable name
                        violations.push({
                            file: fullPath,
                            line: index + 1,
                            code: trimmedLine.substring(0, 80),
                            type: 'KEYWORD',
                            details: keyword
                        });
                    }
                });

                // Heuristic Check: Hardcoded Financeiro/Atividades
                if (trimmedLine.includes('financeiro:') && trimmedLine.includes('{') && trimmedLine.includes('0')) {
                    violations.push({
                        file: fullPath,
                        line: index + 1,
                        code: trimmedLine.substring(0, 80),
                        type: 'HARDCODE',
                        details: 'Posivel objeto financeiro zerado'
                    });
                }

                if (trimmedLine.includes('atividades={0}') || trimmedLine.includes('atividades: 0')) {
                    violations.push({
                        file: fullPath,
                        line: index + 1,
                        code: trimmedLine.substring(0, 80),
                        type: 'HARDCODE',
                        details: 'Atividades zeradas hardcoded'
                    });
                }
            });
        }
    }
    return violations;
}

const srcDir = path.join(__dirname, '../src');
if (!fs.existsSync(srcDir)) {
    console.error('src directory not found');
    process.exit(1);
}

const allViolations = scanDir(srcDir);

// Output Markdown Table
const reportPath = path.join(__dirname, '../docs/SCAN_FAKE_DATA.md');
let output = '# SCAN REPORT - FAKE DATA & HARDCODING\n';
output += `Generated at: ${new Date().toISOString()}\n\n`;
output += '| Arquivo | Linha | Trecho | Classificação | Detalhes |\n';
output += '| :--- | :--- | :--- | :--- | :--- |\n';

if (allViolations.length === 0) {
    output += '| - | - | - | OK | Nenhum fake data encontrado |\n';
    console.log('No fake data found.');
} else {
    allViolations.forEach(v => {
        // Make path relative
        const relPath = path.relative(path.join(__dirname, '..'), v.file).replace(/\\/g, '/');
        // Escape pipes in code
        const code = v.code.replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        output += `| \`${relPath}\` | ${v.line} | \`${code}\` | ${v.type} | ${v.details} |\n`;
    });
    console.log(`Found ${allViolations.length} violations. Report written to ${reportPath}`);
}

fs.writeFileSync(reportPath, output, 'utf-8');

if (allViolations.length > 0) {
    process.exit(1);
} else {
    process.exit(0);
}

