
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const EVIDENCE_DIR = path.join(PROJECT_ROOT, 'docs', 'evidence', 'generated');

function scanDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            scanDir(filePath, fileList);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const files = scanDir(SRC_DIR);
const report = {
    fixedWidths: [],
    overflows: [],
    potentialIssues: []
};

const FIXED_WIDTH_REGEX = /w-\[\d+px\]/g;
const FIXED_HEIGHT_REGEX = /h-\[\d+px\]/g;
const OVERFLOW_HIDDEN_REGEX = /overflow-hidden/g;
const OVERFLOW_AUTO_REGEX = /overflow-auto/g;
const OVERFLOW_SCROLL_REGEX = /overflow-scroll/g;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(PROJECT_ROOT, file);

    const fixedWidths = content.match(FIXED_WIDTH_REGEX);
    if (fixedWidths) {
        report.fixedWidths.push({ file: relativePath, matches: fixedWidths });
    }

    // Check for potentially problematic overflows (or lack thereof)
    // This is a naive check.
    if (relativePath.includes('layout') || relativePath.includes('App') || relativePath.includes('index')) {
        if (!content.includes('overflow-x-hidden')) {
            report.potentialIssues.push({ file: relativePath, issue: 'Possible missing overflow-x-hidden restriction' });
        }
    }
});

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
const outputPath = path.join(EVIDENCE_DIR, 'RESPONSIVENESS_RAW.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(`Report saved to ${outputPath}`);
