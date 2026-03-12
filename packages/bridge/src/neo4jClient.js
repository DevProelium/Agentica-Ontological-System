/**
 * neo4jClient.js – Cliente de Neo4j para el Bridge Local
 *
 * Gestiona la conexión con la base de datos de grafos y proporciona
 * métodos para ejecutar queries Cypher de forma segura.
 *
 * Principio KISS: conexión única, queries como strings, resultados como objetos.
 */

import neo4j from 'neo4j-driver';

let driver = null;

const NEO4J_CONFIG = {
  uri: process.env.NEO4J_URI ?? 'bolt://localhost:7687',
  user: process.env.NEO4J_USER ?? 'neo4j',
  // Require password to be set via environment variable; no insecure default
  password: process.env.NEO4J_PASSWORD,
};

/**
 * Inicializa el driver de Neo4j.
 * Llamar una vez al iniciar el servidor.
 */
export function iniciarNeo4j() {
  if (driver) return driver;

  driver = neo4j.driver(
    NEO4J_CONFIG.uri,
    neo4j.auth.basic(NEO4J_CONFIG.user, NEO4J_CONFIG.password ?? ''),
    {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 horas
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutos
    }
  );

  driver.verifyConnectivity()
    .then(() => console.log('[Aegis Neo4j] Conexión establecida con el Grafo de Conocimiento'))
    .catch((err) => {
      console.warn(`[Aegis Neo4j] No se pudo conectar: ${err.message}`);
      console.warn('[Aegis Neo4j] Operando en modo sin persistencia. Los datos se guardan en memoria.');
    });

  return driver;
}

/**
 * Ejecuta una query Cypher y devuelve los resultados.
 *
 * @param {string} cypher – Query Cypher a ejecutar
 * @param {object} [params] – Parámetros de la query
 * @returns {Promise<object[]>} Registros como objetos planos
 */
export async function ejecutarCypher(cypher, params = {}) {
  if (!driver) {
    throw new Error('Neo4j no inicializado. Llamar iniciarNeo4j() primero.');
  }

  const session = driver.session({ database: 'neo4j' });
  try {
    const resultado = await session.run(cypher, params);
    return resultado.records.map((record) => {
      const obj = {};
      for (const key of record.keys) {
        const valor = record.get(key);
        obj[key] = valor?.properties ?? valor;
      }
      return obj;
    });
  } finally {
    await session.close();
  }
}

/**
 * Ejecuta un script Cypher multi-statement (separado por ;).
 * Útil para cargar el schema inicial o datos en batch.
 *
 * @param {string} script – Script Cypher con múltiples statements
 */
export async function ejecutarScript(script) {
  const statements = script
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('//'));

  const resultados = [];
  for (const statement of statements) {
    try {
      const resultado = await ejecutarCypher(statement);
      resultados.push({ statement: statement.slice(0, 50) + '…', ok: true, resultado });
    } catch (err) {
      resultados.push({ statement: statement.slice(0, 50) + '…', ok: false, error: err.message });
    }
  }
  return resultados;
}

/**
 * Cierra el driver al apagar el servidor.
 */
export async function cerrarNeo4j() {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('[Aegis Neo4j] Conexión cerrada.');
  }
}
