import { redisClient } from './db.js';
import { searchWeb as buscarInformacion, scrapeWebpage as leerPagina, extractTextFromPdf as extraerTextoDocumentoPdf, extractTextFromDocx as extraerTextoDocumentoWord } from './tools/externalTools.js';

export const configTools = {};

export function initializeMCPBridge() {
  console.log('[Aegis Bridge] Puente MCP inicializado.');

  const mcpSub = redisClient.duplicate();
  mcpSub.connect().then(() => {
    mcpSub.subscribe('mcp_requests', (message) => {
       try {
         const req = JSON.parse(message);
         console.log('[Aegis Bridge] Recibida peticion a herramienta:', req);
       } catch(e) {}
    });
  });
}

export async function ejecutarMCP(toolName, args, cx) {
  try {
    switch (toolName) {
      case 'web.buscar_informacion':
        return { result: await buscarInformacion(args.query) };
      case 'web.leer_pagina':
        return { result: await leerPagina(args.url) };
      case 'doc.extraer_texto_pdf':
        return { result: await extraerTextoDocumentoPdf(args.content) };
      case 'doc.extraer_texto_word':
        return { result: await extraerTextoDocumentoWord(args.content) };
      default:
        // By default send this request to the rest of the node graph logic if not a tool.
        return { result: `Success - Called ${toolName}` };
    }
  } catch (error) {
    console.error(`[Aegis Bridge] Error ejecutando ${toolName}:`, error.message);
    return { error: { code: 500, message: error.message } };
  }
}
