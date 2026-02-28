const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const EXCLUSIONS = ['verify_query_keys.cjs', 'node_modules', '.git', 'dist', 'build', 'test', 'spec'];

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    let violations = 0;

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!EXCLUSIONS.some(ex => fullPath.includes(ex))) {
                violations += scanDir(fullPath);
            }
        } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
            // Only check hooks (files starting with 'use' or inside 'hooks' folder)
            // or components that might define queries inline.
            // Simplified: check all JS/TS files for useQuery usage.

            const content = fs.readFileSync(fullPath, 'utf-8');

            // Regex to find useQuery/useInfiniteQuery
            // Matches: useQuery({ queryKey: [ ... ]
            // We want to verify if 'orgId' is in the array.

            // This is a rough heuristic.
            const queryKeyRegex = /queryKey:\s*\[(.*?)\]/g;
            let match;

            while ((match = queryKeyRegex.exec(content)) !== null) {
                const keyContent = match[1];
                // Check if orgId is present in the key
                if (!keyContent.includes('orgId') && !keyContent.includes('org_id')) {
                    // Exclude 'user' query or 'session' query which might be global
                    if (!keyContent.includes("'user'") && !keyContent.includes('"user"') &&
                        !keyContent.includes("'session'") && !keyContent.includes('"session"')) {
                        console.warn(`[WARN] Suspicious QueryKey at ${file}: [${keyContent}]`);
                        console.warn(`       It does not seem to include 'orgId'. Check PRD3 compliance.`);
                        violations++;
                    }
                }
            }
        }
    }
    return violations;
}

console.log('--- Verifying Query Keys Compliance (PRD3) ---');
if (!fs.existsSync(srcDir)) {
    console.error('src directory not found');
    process.exit(1);
}

const count = scanDir(srcDir);

if (count > 0) {
    console.log(`\nFound ${count} potential query key violations.`);
    // Don't fail yet, just warn, as heuristics might be noisy
    process.exit(0);
} else {
    console.log('No obvious query key violations found.');
    process.exit(0);
}
