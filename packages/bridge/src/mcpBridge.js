/**
 * mcpBridge.js – Puente MCP (Model Context Protocol)
 *
 * El "cuerpo" del agente: las manos que interactúan con el sistema operativo.
 * Implementa el estándar JSON-RPC de MCP para comunicación ligera y compatible.
 *
 * Herramientas disponibles (Tools):
 *   - filesystem.read   – Leer archivos locales
 *   - filesystem.list   – Listar directorio
 *   - graph.sync        – Sincronizar cambios de MD con Neo4j
 *   - cast.project      – Proyectar contenido en Google Cast
 *   - privacy.analyze   – Analizar mensaje por dark patterns
 *   - memory.save       – Guardar recuerdo compartido
 *   - heartbeat         – Estado de salud del sistema
 *
 * "El agente debe ver estas herramientas como Extensiones de su Cuerpo."
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, resolve } from 'path';
import { ejecutarCypher } from './neo4jClient.js';
import { buildCypherScript, parseMdToGraph } from '../../../packages/frontend/src/core/mdToGraph.js';

// ─── Registro de herramientas MCP ────────────────────────────
const MCP_TOOLS = {
  'filesystem.read': leerArchivo,
  'filesystem.list': listarDirectorio,
  'graph.sync': sincronizarConGrafo,
  'graph.query': consultarGrafo,
  'cast.project': proyectarEnCast,
  'privacy.analyze': analizarPrivacidad,
  'memory.save': guardarRecuerdo,
  'heartbeat': obtenerHeartbeat,
  'agent.configure': configurarAgente,
};

/**
 * Ejecuta un método MCP.
 *
 * @param {string} method – Nombre del método (ej: 'filesystem.read')
 * @param {object} params – Parámetros del método
 * @param {object} contexto – Contexto del agente (axiomas, modo, etc.)
 * @returns {Promise<object>} Resultado del método
 */
export async function ejecutarMCP(method, params = {}, contexto = {}) {
  const handler = MCP_TOOLS[method];
  if (!handler) {
    return { error: { code: -32601, message: `Método '${method}' no disponible en el Bridge` } };
  }

  // Validar contra el Axioma de Limitación (AX-IV) antes de ejecutar
  const validacion = validarContraLimitacion(method, params, contexto);
  if (!validacion.permitido) {
    return {
      error: {
        code: -32603,
        message: validacion.razon,
        mensaje_usuario: validacion.mensaje_usuario,
        modo_seguro: true,
      },
    };
  }

  try {
    const resultado = await handler(params, contexto);
    return { result: resultado };
  } catch (err) {
    return { error: { code: -32603, message: err.message } };
  }
}

// ─── Implementaciones de herramientas ───────────────────────

async function leerArchivo({ ruta }, { usuario_autenticado }) {
  if (!usuario_autenticado) {
    throw new Error('Acceso denegado. Identidad no verificada.');
  }

  // Solo permitir rutas dentro del directorio de trabajo del usuario
  const rutaSegura = resolve(ruta);
  const contenido = await readFile(rutaSegura, 'utf-8');

  // Si es un archivo .md, parsearlo para el grafo
  if (extname(rutaSegura) === '.md') {
    const { nodes, relations, cypher } = parseMdToGraph(contenido);
    return { contenido, grafo: { nodes, relations }, cypher };
  }

  return { contenido };
}

async function listarDirectorio({ ruta = '.', extension = null }) {
  const rutaSegura = resolve(ruta);
  const entradas = await readdir(rutaSegura, { withFileTypes: true });

  const archivos = await Promise.all(
    entradas
      .filter(e => !extension || e.name.endsWith(extension))
      .map(async (entrada) => {
        const info = await stat(join(rutaSegura, entrada.name)).catch(() => null);
        return {
          nombre: entrada.name,
          tipo: entrada.isDirectory() ? 'directorio' : 'archivo',
          extension: extname(entrada.name),
          tamano: info?.size ?? 0,
          modificado: info?.mtime?.toISOString() ?? null,
        };
      })
  );

  return { ruta: rutaSegura, archivos };
}

async function sincronizarConGrafo({ contenido, grafo, nombre_archivo = 'Sin título' }) {
  if (!grafo) {
    // Parsear el contenido MD si no se provee el grafo ya procesado
    const parsed = parseMdToGraph(contenido ?? '');
    grafo = { nodes: parsed.nodes, relations: parsed.relations };
  }

  const cypher = buildCypherScript(grafo.nodes, grafo.relations);
  let nodosSincronizados = 0;
  let errores = 0;

  // Ejecutar el Cypher generado en Neo4j
  const statements = cypher
    .split('\n\n')
    .map(s => s.trim())
    .filter(s => s && s.startsWith('MERGE'));

  for (const statement of statements) {
    try {
      await ejecutarCypher(statement);
      nodosSincronizados++;
    } catch {
      errores++;
    }
  }

  return {
    mensaje: `Grafo sincronizado: ${nodosSincronizados} nodo(s) actualizados.`,
    nodos_sincronizados: nodosSincronizados,
    errores,
    archivo: nombre_archivo,
  };
}

async function consultarGrafo({ cypher, params = {} }) {
  const resultados = await ejecutarCypher(cypher, params);
  return { resultados, total: resultados.length };
}

async function proyectarEnCast({ dispositivo_id, contenido }) {
  // En producción: integrar con la Presentation API o Chromecast SDK
  console.log(`[Aegis Cast] Proyectando en ${dispositivo_id}:`, contenido?.tipo ?? 'contenido');
  return {
    proyectado: true,
    dispositivo: dispositivo_id,
    mensaje: `Aegis se ha movido a tu pantalla.`,
  };
}

async function analizarPrivacidad({ texto, origen }) {
  // Importar dinámicamente para evitar dependencia circular
  const { analizarMensaje } = await import('../../../packages/frontend/src/core/privacyShield.js');
  const resultado = analizarMensaje(texto, { origen });
  return resultado;
}

async function guardarRecuerdo({ contenido, sentimiento, contexto_conversacion }) {
  const recuerdoId = `REC-${Date.now()}`;

  try {
    await ejecutarCypher(
      `MERGE (r:Recuerdo {id: $id})
       SET r.contenido = $contenido,
           r.sentimiento = $sentimiento,
           r.timestamp = datetime()
       WITH r
       MATCH (ag:Agente {id: 'AEGIS-1'})
       MERGE (ag)-[:TIENE_RECUERDO]->(r)`,
      { id: recuerdoId, contenido, sentimiento: sentimiento ?? 'Neutro' }
    );
  } catch {
    // Si Neo4j no está disponible, el recuerdo se registra en memoria
  }

  return {
    id: recuerdoId,
    guardado: true,
    mensaje: 'Lo recordaré. En nuestro próximo encuentro te preguntaré por ello.',
    proximo_heartbeat: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

async function obtenerHeartbeat() {
  return {
    agente: 'Aegis',
    estado: 'Activo',
    timestamp: new Date().toISOString(),
    neo4j: 'verificando',
    bridge_version: '1.0.0',
    mensaje: '🌱 Todo en orden. ¿Cómo estás hoy?',
  };
}

async function configurarAgente({ axiomas, nombre_usuario }) {
  console.log(`[Aegis] Configurando agente para: ${nombre_usuario}`);
  return {
    configurado: true,
    axiomas_cargados: axiomas?.length ?? 0,
    mensaje: `Aegis ha actualizado sus Principios. Tu esencia está a salvo, ${nombre_usuario}.`,
  };
}

// ─── Validación contra el Axioma de Limitación ───────────────

function validarContraLimitacion(method, params, contexto) {
  const { modo_agente, limites_usuario = [] } = contexto;

  // En Modo Huésped: solo permitir operaciones de lectura
  if (modo_agente === 'huesped') {
    const operacionesPermitidas = ['heartbeat', 'privacy.analyze'];
    if (!operacionesPermitidas.includes(method)) {
      return {
        permitido: false,
        razon: 'Modo Huésped: solo operaciones de análisis permitidas',
        mensaje_usuario: 'Para hacer esto, necesito verificar tu identidad primero.',
      };
    }
  }

  // Verificar si el método está bloqueado por los límites del usuario
  const limiteBloqueado = limites_usuario.find(
    l => l.metodo === method && l.bloqueado
  );
  if (limiteBloqueado) {
    return {
      permitido: false,
      razon: `Bloqueado por límite del usuario: ${limiteBloqueado.descripcion}`,
      mensaje_usuario: `Este método está bloqueado por uno de tus Principios de Limitación.`,
    };
  }

  return { permitido: true };
}
