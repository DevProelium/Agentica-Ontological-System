import * as dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;
import { createClient } from 'redis';
import { Client as MinioClient } from 'minio';

// POSTGRES (Memoria Vectorial - pgvector) 
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://agentica_admin:aegis_pg_pass@localhost:5438/agentica_knowledge',
});

pgPool.on('error', (err) => {
  console.error('[Base de Datos: Postgres] Error inesperado:', err);
});

// REDIS (Memoria a Corto Plazo / Contexto) 
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6380',
});

redisClient.on('error', (err) => console.error('[Base de Datos: Redis] Error:', err));

// MINIO (Almacen de Artefactos / S3 Local)
const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const minioUrl = new URL(minioEndpoint.startsWith('http') ? minioEndpoint : 'http://' + minioEndpoint + ':9000');
const minioClient = new MinioClient({
  endPoint: minioUrl.hostname,
  port: parseInt(minioUrl.port) || 9005,
  useSSL: minioUrl.protocol === 'https:',
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
});

export async function iniciarSistemasCognitivos() {
  console.log('[Aegis Cognicion] Despertando bases de datos...');

  try {
    await redisClient.connect();
    console.log('[Redis] Memoria a corto plazo lista.');

    const res = await pgPool.query('SELECT NOW() as db_time');
    console.log('[Postgres] Memoria vectorial activa (Hora BD: ' + res.rows[0].db_time + ').');

    await pgPool.query('CREATE EXTENSION IF NOT EXISTS vector;');

    const bucketName = 'aegis-artifacts';
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
      console.log('[MinIO] Creado nuevo bucket de bodega: ' + bucketName);
    } else {
      console.log('[MinIO] Bodega de artefactos conectada.');
    }

    console.log('[Aegis Cognicion] Todos los sistemas neuronales en linea.');   
  } catch (error) {
    console.error('[Aegis Cognicion] Fallo critico al despertar sistemas:', error);
  }
}

export async function cerrarSistemasCognitivos() {
  console.log('[Aegis Cognicion] Apagando sistemas para descanso...');
  await redisClient.disconnect();
  await pgPool.end();
}

export { pgPool, redisClient, minioClient };

