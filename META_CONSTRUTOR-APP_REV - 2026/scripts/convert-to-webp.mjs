/**
 * Converte imagens em /public/marketing/ para WebP em lote.
 * Mantém os originais intactos.
 * Uso: node scripts/convert-to-webp.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const dirs = [
  'public/marketing',
  'public/marketing/obras-reais',
];

let converted = 0;
let skipped = 0;
let errors = 0;

async function convertDir(dir) {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) {
    console.log(`⚠️  Diretório não encontrado: ${dir}`);
    return;
  }

  const files = fs.readdirSync(fullDir).filter(f => /\.(jpe?g|png)$/i.test(f));
  
  for (const file of files) {
    const src = path.join(fullDir, file);
    const baseName = path.basename(file, path.extname(file));
    const dest = path.join(fullDir, `${baseName}.webp`);

    // Pula se já existe
    if (fs.existsSync(dest)) {
      skipped++;
      continue;
    }

    try {
      const img = sharp(src);
      const metadata = await img.metadata();
      
      // Qualidade adaptativa: fotos grandes (>= 300KB) quality 75, menores quality 80
      const quality = metadata.size && metadata.size >= 300000 ? 75 : 80;
      
      await img
        .webp({ quality, effort: 4 })
        .toFile(dest);

      const srcSize = fs.statSync(src).size;
      const destSize = fs.statSync(dest).size;
      const savings = ((1 - destSize / srcSize) * 100).toFixed(1);
      
      console.log(`✅ ${file} → ${baseName}.webp (${formatBytes(srcSize)} → ${formatBytes(destSize)}, economia ${savings}%)`);
      converted++;
    } catch (err) {
      console.error(`❌ Erro em ${file}: ${err.message}`);
      errors++;
    }
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function main() {
  console.log('🖼️  Conversão para WebP - Meta Construtor\n');
  
  for (const dir of dirs) {
    await convertDir(dir);
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   Convertidos: ${converted}`);
  console.log(`   Pulados (já existem): ${skipped}`);
  console.log(`   Erros: ${errors}`);
  console.log(`   Total: ${converted + skipped + errors}`);
}

main().catch(console.error);
