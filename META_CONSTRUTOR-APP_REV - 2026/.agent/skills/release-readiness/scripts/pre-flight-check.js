#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';

const execPromise = util.promisify(exec);

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

const CHECKS = [
  {
    name: 'TypeScript Check',
    command: 'npx tsc --noEmit',
    critical: true
  },
  {
    name: 'Lint',
    command: 'npx eslint src --ext .ts,.tsx --max-warnings=0',
    critical: false
  },
  {
    name: 'Build',
    command: 'npm run build',
    critical: true
  }
];

const SKILLS_TO_RUN = [
  {
    name: 'Code Standards',
    command: 'node .agent/skills/code-standards/scripts/check-file-naming.js',
    critical: false
  },
  {
    name: 'Security Audit',
    command: 'node .agent/skills/security-audit/scripts/audit-rls.js',
    critical: true
  },
  {
    name: 'Data Analyzer',
    command: 'node .agent/skills/data-analyzer/scripts/check-orphan-records.js',
    critical: false
  },
  {
    name: 'Migration Manager',
    command: 'node .agent/skills/migration-manager/scripts/test-migrations.js',
    critical: true
  }
];

async function runCheck(check) {
  console.log(`\n${colors.cyan}🔍 Executando: ${check.name}${colors.reset}`);
  
  try {
    const { stdout, stderr } = await execPromise(check.command);
    
    if (stderr && !stderr.includes('warning')) {
      console.log(`${colors.red}❌ Falhou:${colors.reset}`);
      console.log(stderr.substring(0, 500));
      return { ...check, passed: false, output: stderr };
    }
    
    console.log(`${colors.green}✅ Passou${colors.reset}`);
    return { ...check, passed: true, output: stdout };
  } catch (error) {
    console.log(`${colors.red}❌ Falhou:${colors.reset}`);
    console.log(error.message.substring(0, 500));
    return { ...check, passed: false, output: error.message };
  }
}

async function main() {
  console.log(`${colors.cyan}🛫 INICIANDO PRÉ-VOO PARA RELEASE${colors.reset}`);
  console.log('========================================\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    checks: [],
    skills: [],
    blockers: [],
    warnings: []
  };
  
  // Executar verificações básicas
  console.log(`${colors.blue}📋 VERIFICAÇÕES BÁSICAS${colors.reset}`);
  
  for (const check of CHECKS) {
    const result = await runCheck(check);
    results.checks.push(result);
    
    if (!result.passed && check.critical) {
      results.blockers.push(`${check.name} falhou`);
    } else if (!result.passed) {
      results.warnings.push(`${check.name} falhou (não crítico)`);
    }
  }
  
  // Executar skills
  console.log(`\n${colors.blue}📋 EXECUTANDO SKILLS DE VERIFICAÇÃO${colors.reset}`);
  
  for (const skill of SKILLS_TO_RUN) {
    // Verificar se o script existe
    const scriptPath = skill.command.split(' ')[1];
    if (!fs.existsSync(scriptPath)) {
      console.log(`\n${colors.yellow}⚠️ Skill não encontrada: ${skill.name}${colors.reset}`);
      results.warnings.push(`Skill ${skill.name} não encontrada`);
      continue;
    }
    
    const result = await runCheck(skill);
    results.skills.push(result);
    
    if (!result.passed && skill.critical) {
      results.blockers.push(`${skill.name} falhou`);
    } else if (!result.passed) {
      results.warnings.push(`${skill.name} falhou (não crítico)`);
    }
  }
  
  // Verificar migrations pendentes
  try {
    console.log(`\n${colors.cyan}🔍 Verificando migrations pendentes...${colors.reset}`);
    const { stdout } = await execPromise('npx supabase migration list');
    
    if (stdout.includes('Local')) {
      const pendingMatch = stdout.match(/Local\s+\|\s+(\d+)/);
      const remoteMatch = stdout.match(/Remote\s+\|\s+(\d+)/);
      
      if (pendingMatch && remoteMatch) {
        const local = parseInt(pendingMatch[1]);
        const remote = parseInt(remoteMatch[1]);
        
        if (local > remote) {
          console.log(`${colors.yellow}⚠️  ${local - remote} migrations pendentes no banco remoto${colors.reset}`);
          results.warnings.push(`${local - remote} migrations pendentes`);
        } else {
          console.log(`${colors.green}✅ Banco sincronizado${colors.reset}`);
        }
      }
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Não foi possível verificar migrations: ${error.message}${colors.reset}`);
  }
  
  // Gerar relatório
  const reportPath = path.join(process.cwd(), 'release-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // Resumo final
  console.log(`\n${colors.blue}=== RELATÓRIO FINAL ===${colors.reset}`);
  console.log(`📊 Checks básicos: ${results.checks.filter(c => c.passed).length}/${results.checks.length}`);
  console.log(`📊 Skills executadas: ${results.skills.filter(s => s.passed).length}/${results.skills.length}`);
  
  if (results.blockers.length > 0) {
    console.log(`\n${colors.red}❌ BLOQUEADORES ENCONTRADOS:${colors.reset}`);
    results.blockers.forEach(b => console.log(`   - ${b}`));
  }
  
  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  AVISOS:${colors.reset}`);
    results.warnings.slice(0, 5).forEach(w => console.log(`   - ${w}`));
    if (results.warnings.length > 5) {
      console.log(`   ... e mais ${results.warnings.length - 5} avisos`);
    }
  }
  
  if (results.blockers.length === 0) {
    console.log(`\n${colors.green}✅ PRONTO PARA RELEASE!${colors.reset}`);
    console.log(`📁 Relatório salvo em: ${reportPath}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ RELEASE BLOQUEADA. Corrija os bloqueadores antes de continuar.${colors.reset}`);
    process.exit(1);
  }
}

main().catch(console.error);