import axios from 'axios';
import * as cheerio from 'cheerio';
import FormData from 'form-data';
import { updateAgentState } from '../redisState.js';

// --- CONFIGURACIÓN DE ENDPOINTS (Vía Docker) ---
const SEARXNG_URL = process.env.SEARXNG_URL || 'http://host.docker.internal:8086';
const BROWSERLESS_URL = process.env.BROWSERLESS_URL || 'http://host.docker.internal:3006';
const TIKA_URL = process.env.TIKA_URL || 'http://host.docker.internal:9999';

// 1. web.buscar_informacion (SearXNG)
export async function searchWeb(query) {
  try {
    await updateAgentState({
      estado: 'curioso',
      actividad_actual: `Buscando en web: "${query}"`
    });

    const response = await axios.get(`${SEARXNG_URL}/search`, {
      params: { q: query, format: 'json', language: 'es' }
    });

    const results = response.data.results.slice(0, 5).map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content
    }));

    return results;
  } catch (error) {
    console.error('[Herramientas] Error en SearXNG:', error.message);
    return { error: 'No se pudo realizar la búsqueda.' };
  }
}

// 2. doc.extraer_texto PDF (Apache Tika)
export async function extractTextFromPdf(base64Data) {
  try {
    await updateAgentState({
      estado: 'concentrado',
      actividad_actual: `Extrayendo texto de PDF`
    });

    const buffer = Buffer.from(base64Data, 'base64');
    
    const response = await axios.put(`${TIKA_URL}/tika`, buffer, {
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/pdf'
      }
    });

    return response.data;
  } catch (error) {
    console.error('[Herramientas] Error en Tika PDF:', error.message);
    return { error: 'Error extrayendo texto del PDF.' };
  }
}

// 3. doc.extraer_texto Word (Apache Tika)
export async function extractTextFromDocx(base64Data) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const response = await axios.put(`${TIKA_URL}/tika`, buffer, {
      headers: {
        'Accept': 'text/plain'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[Herramientas] Error en Tika DOCX:', error.message);
    return { error: 'Error extrayendo texto del documento Word.' };
  }
}

// 4. web.leer_pagina (Opcional - Browserless)
export async function scrapeWebpage(url) {
  try {
    await updateAgentState({
      estado: 'procesando_conocimiento',
      actividad_actual: `Leyendo URL: ${url}`
    });

    const response = await axios.post(`${BROWSERLESS_URL}/content`, {
      url: url,
      gotoOptions: { waitUntil: 'networkidle2' }
    });

    const $ = cheerio.load(response.data);
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    return text.substring(0, 5000); // Truncar para evitar sobrecarga de contexto
  } catch (error) {
    console.error('[Herramientas] Error en Browserless:', error.message);
    return { error: 'No se pudo leer la página web.' };
  }
}
