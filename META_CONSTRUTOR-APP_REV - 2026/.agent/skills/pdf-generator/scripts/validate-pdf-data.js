#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log(`${colors.red}❌ Variáveis de ambiente não encontradas!${colors.reset}`);
  console.log('Crie um arquivo .env.local com:');
  console.log('VITE_SUPABASE_URL=sua-url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua-chave');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Campos obrigatórios para o PDF
const REQUIRED_FIELDS = [
  { field: 'numero', description: 'Número do RDO' },
  { field: 'data', description: 'Data do RDO' },
  { field: 'status', description: 'Status do RDO' }
];

async function getRDOData(rdoId) {
  try {
    const { data, error } = await supabase
      .from('rdos')
      .select(`
        *,
        obras (
          id,
          nome
        ),
        rdo_atividades (
          id,
          status,
          nome,
          categoria,
          quantidade,
          unidade_medida
        ),
        rdo_equipamentos (
          id,
          horas_uso,
          equipamentos (
            id,
            nome
          )
        ),
        documentos (
          id,
          nome,
          url,
          tipo
        )
      `)
      .eq('id', rdoId)
      .single();

    if (error) return { error };
    return { data };
  } catch (error) {
    return { error };
  }
}

async function validateImages(documentos) {
  const imageDocs = documentos?.filter(d => d.tipo && d.tipo.startsWith('image/')) || [];
  const issues = [];

  for (const doc of imageDocs.slice(0, 5)) {
    try {
      const { data: signedUrlData, error } = await supabase.storage
        .from('documentos')
        .createSignedUrl(doc.url, 60);

      if (error || !signedUrlData) {
        issues.push({
          doc: doc.nome || doc.url,
          issue: 'Não foi possível gerar signed URL'
        });
      }
    } catch (e) {
      issues.push({
        doc: doc.nome || doc.url,
        issue: `Erro: ${e.message}`
      });
    }
  }

  return issues;
}

async function main() {
  console.log(`${colors.cyan}🔍 Validando dados para PDF de RDO...${colors.reset}\n`);

  let testRDOId = null;

  // Verificar se foi passado um ID como argumento
  const args = process.argv.slice(2);
  const idIndex = args.indexOf('--id');
  if (idIndex !== -1 && args[idIndex + 1]) {
    testRDOId = args[idIndex + 1];
  }

  if (!testRDOId) {
    // Buscar um RDO recente para teste
    const { data: recentRDOs, error: listError } = await supabase
      .from('rdos')
      .select('id, numero')
      .order('created_at', { ascending: false })
      .limit(5);

    if (listError || !recentRDOs || recentRDOs.length === 0) {
      console.log(`${colors.yellow}⚠️  Nenhum RDO encontrado para teste.${colors.reset}`);
      console.log('Crie um RDO primeiro ou execute com ID específico:');
      console.log('node validate-pdf-data.js --id SEU_RDO_ID');
      process.exit(0);
    }

    console.log('📋 RDOs disponíveis para teste:');
    recentRDOs.forEach((r, i) => {
      console.log(`   ${i + 1}. ID: ${r.id} - Nº: ${r.numero || 'sem número'}`);
    });

    testRDOId = recentRDOs[0].id;
    console.log(`\n🔍 Testando com RDO: ${testRDOId}\n`);
  }

  const result = await getRDOData(testRDOId);

  if (result.error) {
    console.log(`${colors.red}❌ Erro ao buscar RDO:${colors.reset}`, result.error.message);
    process.exit(1);
  }

  const rdo = result.data;
  const issues = [];

  // Verificar campos obrigatórios
  console.log(`${colors.blue}📌 Verificando campos obrigatórios:${colors.reset}`);
  for (const req of REQUIRED_FIELDS) {
    if (rdo[req.field] === null || rdo[req.field] === undefined) {
      issues.push({
        type: 'Campo obrigatório',
        item: req.field,
        description: req.description
      });
      console.log(`   ${colors.red}❌ Faltando: ${req.field} (${req.description})${colors.reset}`);
    } else {
      console.log(`   ${colors.green}✅ OK: ${req.field}${colors.reset}`);
    }
  }

  // Verificar relacionamentos
  console.log(`\n${colors.blue}📌 Verificando relacionamentos:${colors.reset}`);

  if (!rdo.obras) {
    issues.push({
      type: 'Relacionamento',
      item: 'obras',
      description: 'Dados da obra não encontrados'
    });
    console.log(`   ${colors.red}❌ Obra não encontrada${colors.reset}`);
  } else {
    console.log(`   ${colors.green}✅ Obra: ${rdo.obras.nome || 'sem nome'}${colors.reset}`);
  }

  const atividades = rdo.rdo_atividades || [];
  if (atividades.length === 0) {
    console.log(`   ${colors.yellow}⚠️  Sem atividades vinculadas${colors.reset}`);
  } else {
    console.log(`   ${colors.green}✅ Atividades: ${atividades.length} encontradas${colors.reset}`);
  }

  const equipamentos = rdo.rdo_equipamentos || [];
  if (equipamentos.length === 0) {
    console.log(`   ${colors.yellow}⚠️  Sem equipamentos vinculados${colors.reset}`);
  } else {
    console.log(`   ${colors.green}✅ Equipamentos: ${equipamentos.length} encontrados${colors.reset}`);
  }

  // Verificar imagens
  console.log(`\n${colors.blue}📌 Verificando imagens:${colors.reset}`);
  const documentos = rdo.documentos || [];
  const imageDocs = documentos.filter(d => d.tipo && d.tipo.startsWith('image/'));

  if (imageDocs.length === 0) {
    console.log(`   ${colors.yellow}⚠️  Sem imagens anexadas${colors.reset}`);
  } else {
    console.log(`   ${colors.green}✅ Imagens: ${imageDocs.length} encontradas${colors.reset}`);
    const imageIssues = await validateImages(documentos);
    if (imageIssues.length > 0) {
      imageIssues.forEach(iss => {
        issues.push({
          type: 'Imagem',
          item: iss.doc,
          description: iss.issue
        });
        console.log(`   ${colors.red}❌ ${iss.doc}: ${iss.issue}${colors.reset}`);
      });
    }
  }

  // Resumo
  console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);

  if (issues.length === 0) {
    console.log(`${colors.green}✅ RDO pronto para gerar PDF!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠️  Encontrados ${issues.length} problemas:${colors.reset}`);
    issues.forEach((iss, i) => {
      console.log(`   ${i + 1}. ${iss.type}: ${iss.item} - ${iss.description}`);
    });
    process.exit(1);
  }
}

main().catch(console.error);