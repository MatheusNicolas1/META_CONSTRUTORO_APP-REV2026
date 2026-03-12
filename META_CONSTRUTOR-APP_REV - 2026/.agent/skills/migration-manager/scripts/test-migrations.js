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

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

function validateMigrationFilename(filename) {
  // Padrão esperado: 20260208210000_add_missing_user_tables.sql
  const pattern = /^(\d{14})_([a-z0-9_]+)\.sql$/;
  const match = filename.match(pattern);
  
  if (!match) {
    return { valid: false, reason: 'Formato inválido. Use: YYYYMMDDHHMMSS_descricao.sql' };
  }
  
  const timestamp = match[1];
  const description = match[2];
  
  // Verificar se timestamp é uma data válida
  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  const hour = timestamp.substring(8, 10);
  const minute = timestamp.substring(10, 12);
  const second = timestamp.substring(12, 14);
  
  if (parseInt(month) < 1 || parseInt(month) > 12) {
    return { valid: false, reason: 'Mês inválido no timestamp' };
  }
  
  if (parseInt(day) < 1 || parseInt(day) > 31) {
    return { valid: false, reason: 'Dia inválido no timestamp' };
  }
  
  if (parseInt(hour) < 0 || parseInt(hour) > 23) {
    return { valid: false, reason: 'Hora inválida no timestamp' };
  }
  
  if (parseInt(minute) < 0 || parseInt(minute) > 59) {
    return { valid: false, reason: 'Minuto inválido no timestamp' };
  }
  
  if (parseInt(second) < 0 || parseInt(second) > 59) {
    return { valid: false, reason: 'Segundo inválido no timestamp' };
  }
  
  return { valid: true, timestamp, description };
}

async function main() {
  console.log(`${colors.cyan}🔍 Verificando migrations...${colors.reset}\n`);
  
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log(`${colors.red}❌ Pasta supabase/migrations/ não encontrada!${colors.reset}`);
    console.log('Caminho procurado:', MIGRATIONS_DIR);
    process.exit(1);
  }
  
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  if (files.length === 0) {
    console.log(`${colors.yellow}⚠️  Nenhum arquivo .sql encontrado na pasta migrations.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`📊 Total de migrations encontradas: ${files.length}\n`);
  
  const validMigrations = [];
  const invalidMigrations = [];
  
  // Validar cada migration
  for (const file of files) {
    const result = validateMigrationFilename(file);
    
    if (result.valid) {
      validMigrations.push({ file, ...result });
    } else {
      invalidMigrations.push({ file, reason: result.reason });
    }
  }
  
  // Verificar ordem cronológica
  let outOfOrder = [];
  
  for (let i = 0; i < files.length - 1; i++) {
    const currentTimestamp = files[i].split('_')[0];
    const nextTimestamp = files[i + 1].split('_')[0];
    
    // Verificar se ambos têm timestamps válidos antes de comparar
    if (currentTimestamp.length === 14 && nextTimestamp.length === 14) {
      if (currentTimestamp > nextTimestamp) {
        outOfOrder.push({
          position: i + 1,
          file: files[i],
          nextFile: files[i + 1],
          reason: `Timestamp ${currentTimestamp} maior que ${nextTimestamp}`
        });
      }
    }
  }
  
  // Resultados
  if (invalidMigrations.length > 0) {
    console.log(`${colors.red}❌ Migrations com nome inválido:${colors.reset}`);
    invalidMigrations.forEach(m => {
      console.log(`   - ${m.file}: ${m.reason}`);
    });
    console.log('');
  }
  
  if (outOfOrder.length > 0) {
    console.log(`${colors.yellow}⚠️  Migrations fora de ordem cronológica:${colors.reset}`);
    outOfOrder.forEach(m => {
      console.log(`   - Posição ${m.position}: ${m.file}`);
      console.log(`     Vem depois de ${m.nextFile} mas deveria vir antes`);
      console.log(`     Motivo: ${m.reason}`);
    });
    console.log('');
  }
  
  if (invalidMigrations.length === 0 && outOfOrder.length === 0) {
    console.log(`${colors.green}✅ Todas as migrations estão válidas e em ordem!${colors.reset}`);
  }
  
  // Verificar idempotência básica (procurar IF EXISTS/NOT EXISTS)
  console.log(`\n${colors.blue}🔍 Verificando idempotência...${colors.reset}`);
  
  let nonIdempotent = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const upperContent = content.toUpperCase();
      
      // Procurar comandos perigosos sem IF EXISTS/NOT EXISTS
      if (upperContent.includes('CREATE TABLE') && !upperContent.includes('IF NOT EXISTS')) {
        nonIdempotent.push({ file, reason: 'CREATE TABLE sem IF NOT EXISTS' });
      }
      
      if (upperContent.includes('ALTER TABLE') && upperContent.includes('ADD COLUMN') && !upperContent.includes('IF NOT EXISTS')) {
        nonIdempotent.push({ file, reason: 'ADD COLUMN sem IF NOT EXISTS' });
      }
      
      if (upperContent.includes('DROP TABLE') && !upperContent.includes('IF EXISTS')) {
        nonIdempotent.push({ file, reason: 'DROP TABLE sem IF EXISTS' });
      }
      
      if (upperContent.includes('DROP COLUMN') && !upperContent.includes('IF EXISTS')) {
        nonIdempotent.push({ file, reason: 'DROP COLUMN sem IF EXISTS' });
      }
    } catch (e) {
      console.log(`${colors.yellow}⚠️  Não foi possível ler ${file}: ${e.message}${colors.reset}`);
    }
  }
  
  if (nonIdempotent.length > 0) {
    console.log(`${colors.yellow}⚠️  Migrations podem não ser idempotentes:${colors.reset}`);
    nonIdempotent.slice(0, 5).forEach(m => {
      console.log(`   - ${m.file}: ${m.reason}`);
    });
    if (nonIdempotent.length > 5) {
      console.log(`   ... e mais ${nonIdempotent.length - 5} problemas`);
    }
  } else {
    console.log(`${colors.green}✅ Migrations parecem idempotentes!${colors.reset}`);
  }
  
  // Resumo
  console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
  console.log(`✅ Migrations válidas: ${validMigrations.length}`);
  console.log(`❌ Migrations inválidas: ${invalidMigrations.length}`);
  console.log(`⚠️  Fora de ordem: ${outOfOrder.length}`);
  console.log(`⚠️  Possível não idempotentes: ${nonIdempotent.length}`);
  
  process.exit(invalidMigrations.length > 0 ? 1 : 0);
}

main().catch(console.error);