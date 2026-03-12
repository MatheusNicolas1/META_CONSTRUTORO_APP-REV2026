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

const MUTATION_REPORT_PATH = path.join(process.cwd(), 'security-monitor-report.json');

function estimateEffort(severity) {
  switch(severity) {
    case 'CRÍTICO': return '2-4 horas';
    case 'ALTO': return '1-2 horas';
    case 'MÉDIO': return '30-60 minutos';
    default: return 'Desconhecido';
  }
}

function generateMarkdownReport(data) {
  const date = new Date(data.timestamp).toLocaleString('pt-BR');
  
  let markdown = `# Relatório de Risco - Mutações Diretas no Frontend\n\n`;
  markdown += `**Gerado em:** ${date}\n\n`;
  markdown += `## Resumo Executivo\n\n`;
  markdown += `- Total de arquivos verificados: ${data.totalFiles}\n`;
  markdown += `- Problemas críticos: ${data.summary.critical}\n`;
  markdown += `- Problemas altos: ${data.summary.high}\n`;
  markdown += `- Problemas médios: ${data.summary.medium}\n`;
  markdown += `- **Total de problemas: ${data.summary.total}**\n\n`;
  
  markdown += `## O Problema\n\n`;
  markdown += `Mutações diretas no frontend (.insert(), .update(), .delete()) representam um risco de segurança, pois:\n\n`;
  markdown += `- Usuários podem manipular queries via console do navegador\n`;
  markdown += `- RLS pode ser contornado se mal configurado\n`;
  markdown += `- Validações de negócio podem ser puladas\n`;
  markdown += `- Rate limiting não se aplica\n\n`;
  
  markdown += `## Recomendação\n\n`;
  markdown += `Migrar todas as mutações para Edge Functions, mantendo apenas SELECTs no frontend.\n\n`;
  
  if (data.summary.critical > 0) {
    markdown += `## ⚠️ Problemas Críticos (Prioridade Máxima)\n\n`;
    markdown += `| Arquivo | Linha | Descrição | Esforço Estimado |\n`;
    markdown += `|---------|-------|-----------|------------------|\n`;
    
    data.findings
      .filter(f => f.severity === 'CRÍTICO')
      .forEach(f => {
        markdown += `| ${f.file} | ${f.line} | ${f.description} | ${estimateEffort(f.severity)} |\n`;
      });
    
    markdown += `\n`;
  }
  
  if (data.summary.high > 0) {
    markdown += `## 🟠 Problemas Altos\n\n`;
    markdown += `| Arquivo | Linha | Descrição | Esforço Estimado |\n`;
    markdown += `|---------|-------|-----------|------------------|\n`;
    
    data.findings
      .filter(f => f.severity === 'ALTO')
      .forEach(f => {
        markdown += `| ${f.file} | ${f.line} | ${f.description} | ${estimateEffort(f.severity)} |\n`;
      });
    
    markdown += `\n`;
  }
  
  if (data.summary.medium > 0) {
    markdown += `## 🟡 Problemas Médios\n\n`;
    markdown += `| Arquivo | Linha | Descrição | Esforço Estimado |\n`;
    markdown += `|---------|-------|-----------|------------------|\n`;
    
    data.findings
      .filter(f => f.severity === 'MÉDIO')
      .forEach(f => {
        markdown += `| ${f.file} | ${f.line} | ${f.description} | ${estimateEffort(f.severity)} |\n`;
      });
    
    markdown += `\n`;
  }
  
  markdown += `## Plano de Migração Sugerido\n\n`;
  markdown += `1. **FASE 1**: Criar Edge Functions para operações DELETE (${data.summary.critical} itens)\n`;
  markdown += `2. **FASE 2**: Migrar operações UPDATE (${data.summary.high} itens)\n`;
  markdown += `3. **FASE 3**: Migrar operações INSERT (${data.summary.medium} itens)\n`;
  markdown += `4. **FASE 4**: Validar e testar todas as novas Edge Functions\n\n`;
  
  markdown += `## Estimativa de Esforço Total\n\n`;
  
  const totalHours = 
    data.summary.critical * 3 + 
    data.summary.high * 1.5 + 
    data.summary.medium * 0.75;
  
  markdown += `- Horas estimadas: ~${Math.ceil(totalHours)} horas\n`;
  markdown += `- Dias de trabalho (8h/dia): ~${Math.ceil(totalHours / 8)} dias\n\n`;
  
  return markdown;
}

async function main() {
  console.log(`${colors.cyan}📊 Gerando relatório de risco de segurança...${colors.reset}\n`);
  
  if (!fs.existsSync(MUTATION_REPORT_PATH)) {
    console.log(`${colors.red}❌ Relatório de mutações não encontrado!${colors.reset}`);
    console.log('Execute primeiro: detect-direct-mutations.js');
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(MUTATION_REPORT_PATH, 'utf8');
  const data = JSON.parse(rawData);
  
  // Gerar relatório Markdown
  const markdownReport = generateMarkdownReport(data);
  const markdownPath = path.join(process.cwd(), 'RISK_REPORT.md');
  fs.writeFileSync(markdownPath, markdownReport);
  
  // Gerar relatório JSON aprimorado
  const enhancedReport = {
    ...data,
    recommendations: {
      immediate: data.findings.filter(f => f.severity === 'CRÍTICO').map(f => ({
        file: f.file,
        line: f.line,
        action: `Migrar ${f.type} para Edge Function`
      })),
      shortTerm: data.findings.filter(f => f.severity === 'ALTO').map(f => ({
        file: f.file,
        action: `Refatorar ${f.type} com validação`
      })),
      longTerm: data.findings.filter(f => f.severity === 'MÉDIO').map(f => ({
        file: f.file,
        action: `Planejar migração de ${f.type}`
      }))
    },
    effort: {
      critical: data.summary.critical * 3,
      high: data.summary.high * 1.5,
      medium: data.summary.medium * 0.75,
      totalHours: data.summary.critical * 3 + data.summary.high * 1.5 + data.summary.medium * 0.75
    }
  };
  
  const enhancedPath = path.join(process.cwd(), 'security-risk-report.json');
  fs.writeFileSync(enhancedPath, JSON.stringify(enhancedReport, null, 2));
  
  console.log(`${colors.green}✅ Relatórios gerados com sucesso!${colors.reset}`);
  console.log(`📁 Markdown: ${markdownPath}`);
  console.log(`📁 JSON: ${enhancedPath}`);
  
  // Resumo
  console.log(`\n${colors.blue}=== RESUMO DO RISCO ===${colors.reset}`);
  console.log(`🔴 Críticos: ${data.summary.critical}`);
  console.log(`🟠 Altos: ${data.summary.high}`);
  console.log(`🟡 Médios: ${data.summary.medium}`);
  console.log(`📊 Total: ${data.summary.total}`);
  console.log(`⏱️  Esforço estimado: ${Math.ceil(enhancedReport.effort.totalHours)} horas`);
  
  if (data.summary.critical > 0) {
    console.log(`\n${colors.red}❌ RISCOS CRÍTICOS IDENTIFICADOS. Inicie migração imediatamente.${colors.reset}`);
    process.exit(1);
  }
  
  if (data.summary.total > 0) {
    console.log(`\n${colors.yellow}⚠️  Riscos identificados. Planeje migração para Edge Functions.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`\n${colors.green}✅ Nenhum risco identificado!${colors.reset}`);
  process.exit(0);
}

main().catch(console.error);