#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// Dados simulados para teste
const mockRDOData = {
  numero: 'TESTE-001',
  data: new Date().toLocaleDateString('pt-BR'),
  obra: {
    nome: 'Obra Teste',
    endereco: 'Rua Exemplo, 123 - Centro'
  },
  clima: {
    manha: '☀️ Claro',
    tarde: '🌧️ Chuvoso'
  },
  atividades: [
    { descricao: 'Limpeza do canteiro', status: 'Em Andamento' },
    { descricao: 'Fundações', status: 'Finalizada' },
    { descricao: 'Estrutura metálica', status: 'Não Iniciada' }
  ],
  equipamentos: [
    { nome: 'Caminhão Basculante', quantidade: 3 },
    { nome: 'Betoneira', quantidade: 2 },
    { nome: 'Andaime', quantidade: 5 }
  ],
  ocorrencias: [
    'Chuva forte durante a manhã',
    'Visita do fiscal da prefeitura'
  ],
  comentarios: [
    { autor: 'Engenheiro Responsável', texto: 'Serviços ocorrendo conforme planejado' }
  ]
};

function generateTestPDF() {
  console.log(`${colors.cyan}📄 Gerando PDF de teste...${colors.reset}\n`);
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const margin = 15;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Cabeçalho
  doc.setFillColor(50, 50, 50);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DIÁRIO DE OBRA (TESTE)', margin, 13);
  
  doc.setFontSize(10);
  doc.text(`Nº: ${mockRDOData.numero}`, pageWidth - margin - 20, 13);
  
  doc.setTextColor(0, 0, 0);
  y = 30;
  
  // Dados da obra
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados da Obra', margin, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Obra: ${mockRDOData.obra.nome}`, margin, y);
  doc.text(`Endereço: ${mockRDOData.obra.endereco}`, margin + 80, y);
  y += 6;
  doc.text(`Data: ${mockRDOData.data}`, margin, y);
  y += 10;
  
  // Clima
  doc.setFont('helvetica', 'bold');
  doc.text('Condição Climática', margin, y);
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Manhã: ${mockRDOData.clima.manha}`, margin, y);
  doc.text(`Tarde: ${mockRDOData.clima.tarde}`, margin + 60, y);
  y += 10;
  
  // Atividades
  doc.setFont('helvetica', 'bold');
  doc.text('Atividades', margin, y);
  y += 6;
  
  const atividadesBody = mockRDOData.atividades.map(a => [a.descricao, a.status]);
  
  autoTable(doc, {
    startY: y,
    head: [['Atividade', 'Status']],
    body: atividadesBody,
    theme: 'grid',
    headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
    margin: { left: margin, right: margin }
  });
  
  y = doc.lastAutoTable.finalY + 10;
  
  // Equipamentos
  if (y > 250) {
    doc.addPage();
    y = margin;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Equipamentos', margin, y);
  y += 6;
  
  const equipBody = mockRDOData.equipamentos.map(e => [e.nome, e.quantidade.toString()]);
  
  autoTable(doc, {
    startY: y,
    head: [['Equipamento', 'Quantidade']],
    body: equipBody,
    theme: 'grid',
    headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
    margin: { left: margin, right: margin }
  });
  
  y = doc.lastAutoTable.finalY + 10;
  
  // Ocorrências
  if (y > 250) {
    doc.addPage();
    y = margin;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Ocorrências', margin, y);
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  mockRDOData.ocorrencias.forEach((occ, i) => {
    doc.text(`${i + 1}. ${occ}`, margin, y);
    y += 6;
  });
  
  y += 4;
  
  // Comentários
  if (y > 250) {
    doc.addPage();
    y = margin;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Comentários', margin, y);
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  mockRDOData.comentarios.forEach(com => {
    doc.setFont('helvetica', 'bold');
    doc.text(com.autor, margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    
    const splitText = doc.splitTextToSize(com.texto, pageWidth - (margin * 2));
    doc.text(splitText, margin, y);
    y += (splitText.length * 5) + 5;
  });
  
  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `PDF de teste gerado em ${new Date().toLocaleString()} - Página ${i} de ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Salvar PDF
  const outputPath = path.join(process.cwd(), 'test-rdo.pdf');
  doc.save(outputPath);
  
  console.log(`${colors.green}✅ PDF de teste gerado com sucesso!${colors.reset}`);
  console.log(`📁 Arquivo salvo em: ${outputPath}`);
  
  // Verificações básicas
  console.log(`\n${colors.blue}=== VERIFICAÇÕES ===${colors.reset}`);
  console.log(`📄 Páginas geradas: ${pageCount}`);
  console.log(`📊 Atividades: ${mockRDOData.atividades.length}`);
  console.log(`🔧 Equipamentos: ${mockRDOData.equipamentos.length}`);
  console.log(`📝 Ocorrências: ${mockRDOData.ocorrencias.length}`);
  
  if (pageCount > 0) {
    console.log(`${colors.green}✅ Layout parece OK!${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Problema na geração do PDF${colors.reset}`);
  }
}

// Verificar se jsPDF está instalado
try {
  import('jspdf').then(() => {
    generateTestPDF();
  }).catch(() => {
    console.log(`${colors.yellow}⚠️  jsPDF não encontrado. Instale com:${colors.reset}`);
    console.log('npm install jspdf jspdf-autotable');
    process.exit(1);
  });
} catch (e) {
  console.log(`${colors.red}❌ Erro: jsPDF não está instalado${colors.reset}`);
  console.log('Execute: npm install jspdf jspdf-autotable');
  process.exit(1);
}