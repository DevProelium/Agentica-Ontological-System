import fs from 'fs/promises';
import path from 'path';
import { extractTextFromDocx, extractTextFromPdf } from './tools/externalTools.js';
import { recordar } from './vectorStore.js';

export async function ingerirDirectorio(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) return;
  } catch (e) {
    console.warn(`[Aegis Ingestión] No encuentro la carpeta: ${dirPath}. Saltando...`);
    return;
  }

  const files = await fs.readdir(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const ext = path.extname(file).toLowerCase();
    
    // Leer el buffer
    const buffer = await fs.readFile(fullPath);
    const base64Str = buffer.toString('base64');

    let content = "";
    
    try {
      if (ext === '.pdf') {
         content = await extractTextFromPdf(base64Str);
      } else if (ext === '.docx' || ext === '.doc') {
         content = await extractTextFromDocx(base64Str);
      } else if (ext === '.txt' || ext === '.md') {
         content = buffer.toString('utf-8');
      }

      if (content) {
         console.log(`[Aegis Ingestión] Procesado: ${file}`);
         await recordar('IngestionLocal', content, { filename: file, filepath: fullPath });
      }
    } catch (err) {
      console.error(`[Aegis Ingestión] Error procesando ${file}:`, err.message);
    }
  }
}
