#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const SRC_DIR = path.join(process.cwd(), 'src');
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.agent', 'test', '__tests__'];

let totalFiles = 0;
let correctFiles = 0;
let incorrectFiles = [];

function isPascalCase(name) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

function isCamelCase(name) {
  return /^[a-z][a-zA-Z0-9]*$/.test(name);
}

function isKebabCase(name) {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

function getExpectedType(filePath, filename) {
  const relativePath = path.relative(SRC_DIR, filePath);
  const folders = relativePath.split(path.sep);
  const baseName = path.basename(filename, path.extname(filename));
  
  if (folders[0] === 'components' || folders[0] === 'pages') {
    return { 
      type: 'component', 
      pattern: 'PascalCase',
      valid: isPascalCase(baseName)
    };
  } else if (folders[0] === 'hooks') {
    return { 
      type: 'hook', 
      pattern: 'camelCase com prefixo use',
      valid: isCamelCase(baseName) && baseName.startsWith('use')
    };
  } else if (folders[0] === 'utils') {
    return { 
      type: 'utility', 
      pattern: 'kebab-case',
      valid: isKebabCase(baseName)
    };
  } else if (folders[0] === 'types') {
    return { 
      type: 'type', 
      pattern: 'PascalCase',
      valid: isPascalCase(baseName)
    };
  }
  
  return null;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkDir(filePath);
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || 
          file.endsWith('.jsx') || file.endsWith('.js') || 
          file.endsWith('.css')) {
        
        totalFiles++;
        const expected = getExpectedType(dir, file);
        
        if (expected) {
          if (expected.valid) {
            correctFiles++;
          } else {
            incorrectFiles.push({
              path: path.relative(process.cwd(), filePath),
              name: file,
              expectedType: expected.type,
              expectedPattern: expected.pattern
            });
          }
        }
      }
    }
  }
}

console.log(`${colors.cyan}🔍 Verificando nomenclatura de arquivos...${colors.reset}\n`);

if (!fs.existsSync(SRC_DIR)) {
  console.log(`${colors.red}❌ Pasta src/ não encontrada!${colors.reset}`);
  process.exit(1);
}

walkDir(SRC_DIR);

console.log(`📊 Total de arquivos verificados: ${totalFiles}`);

if (incorrectFiles.length === 0) {
  console.log(`${colors.green}✅ Todos os arquivos estão com nomenclatura correta!${colors.reset}`);
} else {
  console.log(`${colors.yellow}⚠️  Arquivos com nomenclatura incorreta: ${incorrectFiles.length}${colors.reset}\n`);
  
  incorrectFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${colors.red}${file.path}${colors.reset}`);
    console.log(`   Tipo esperado: ${file.expectedType} (${file.expectedPattern})`);
    console.log('');
  });
}

console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
console.log(`✅ Corretos: ${correctFiles}`);
console.log(`❌ Incorretos: ${incorrectFiles.length}`);
console.log(`📁 Total: ${totalFiles}`);

process.exit(incorrectFiles.length > 0 ? 1 : 0);