import { pgPool } from './db.js';
import { Ollama } from 'ollama';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const THINK_MODEL = process.env.OLLAMA_THINK_MODEL || 'qwen3-coder:480b-cloud';

const ollama = new Ollama({ host: OLLAMA_HOST });

export async function initVectorStore() {
  console.log('[Aegis VectorStore] Preparando Hipocampo...');

  await pgPool.query('CREATE EXTENSION IF NOT EXISTS vector;');

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS memorias_cuanticas (
      id SERIAL PRIMARY KEY,
      origen VARCHAR(255),          
      contenido TEXT NOT NULL,      
      metadata JSONB,               
      embedding vector(768),        
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pgPool.query(createTableQuery);
  console.log('[Aegis VectorStore] Estructura de memoria cuantica lista.');     
}

export async function generarEmbedding(texto) {
  try {
    const response = await ollama.embeddings({
      model: EMBED_MODEL,
      prompt: texto,
    });
    return response.embedding;
  } catch (err) {
    console.error('[Aegis VectorStore] Error convirtiendo texto a vector usando ' + EMBED_MODEL + ':', err.message);
    throw err;
  }
}

export async function recordar(origen, contenido, metadata = {}) {
  const vector = await generarEmbedding(contenido);
  const vectorStr = JSON.stringify(vector);

  const query = `
    INSERT INTO memorias_cuanticas (origen, contenido, metadata, embedding)     
    VALUES ($1, $2, $3, $4)
  `;

  await pgPool.query(query, [origen, contenido, metadata, vectorStr]);
}

export async function buscarSimilitud(pregunta, limite = 5) {
  const queryVector = await generarEmbedding(pregunta);
  const vectorStr = JSON.stringify(queryVector);

  const query = `
    SELECT origen, contenido, metadata, 1 - (embedding <=> $1) as similitud       
    FROM memorias_cuanticas
    ORDER BY embedding <=> $1
    LIMIT $2;
  `;
  
  const res = await pgPool.query(query, [vectorStr, limite]);
  return res.rows;
}
