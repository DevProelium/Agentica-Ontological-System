/**
 * server.js – Servidor Bridge Local de Aegis
 *
 * Servidor WebSocket (Node.js) que actúa como el "cuerpo" del agente.
 * Recibe comandos JSON-RPC de la PWA y los ejecuta localmente:
 * sistema de archivos, Neo4j, Cast, análisis de privacidad.
 *
 * Puerto: 3001 (configurable via PORT env)
 * Protocolo: WebSocket + JSON-RPC 2.0 (estándar MCP)
 */

import { WebSocketServer } from 'ws';
import { iniciarNeo4j, cerrarNeo4j } from './neo4jClient.js';
import { ejecutarMCP } from './mcpBridge.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HEARTBEAT_INTERVAL = 30_000; // 30 segundos

// ─── Estado del Bridge ────────────────────────────────────────
const estado = {
  clientes: new Map(), // id → { ws, contexto }
  neo4j_disponible: false,
};

// ─── Inicialización ───────────────────────────────────────────

console.log('[Aegis Bridge] Iniciando servidor local…');

// Inicializar Neo4j (no bloquea el inicio)
iniciarNeo4j();

const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`[Aegis Bridge] ⬡ Escuchando en ws://localhost:${PORT}`);
  console.log('[Aegis Bridge] El puente entre la PWA y el mundo local está activo.');
});

// ─── Gestión de Conexiones ────────────────────────────────────

wss.on('connection', (ws, req) => {
  const clienteId = `cliente-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ip = req.socket.remoteAddress ?? '';

  // Accept only localhost connections (IPv4, IPv6, and IPv4-mapped IPv6)
  const ALLOWED_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
  if (!ALLOWED_IPS.has(ip)) {
    console.warn(`[Aegis Bridge] Conexión rechazada desde IP: ${ip}`);
    ws.close(1008, 'Solo conexiones locales permitidas');
    return;
  }

  estado.clientes.set(clienteId, {
    ws,
    contexto: {
      usuario_autenticado: false,
      modo_agente: 'huesped',
      limites_usuario: [],
    },
  });

  console.log(`[Aegis Bridge] 🔗 Cliente conectado: ${clienteId}`);

  // Mensaje de bienvenida al cliente
  enviarAlCliente(ws, {
    method: 'bridge.ready',
    params: {
      version: '1.0.0',
      mensaje: 'Bridge local activo. Aegis está listo.',
      cliente_id: clienteId,
    },
  });

  // Configurar heartbeat
  ws._isAlive = true;
  ws.on('pong', () => { ws._isAlive = true; });

  // Gestionar mensajes entrantes
  ws.on('message', async (data) => {
    let mensaje;
    try {
      mensaje = JSON.parse(data.toString());
    } catch {
      enviarError(ws, null, -32700, 'El mensaje no es JSON válido');
      return;
    }

    await procesarMensaje(ws, clienteId, mensaje);
  });

  ws.on('close', () => {
    estado.clientes.delete(clienteId);
    console.log(`[Aegis Bridge] ✗ Cliente desconectado: ${clienteId}`);
  });

  ws.on('error', (err) => {
    console.error(`[Aegis Bridge] Error en cliente ${clienteId}:`, err.message);
  });
});

// ─── Procesamiento de Mensajes JSON-RPC ──────────────────────

async function procesarMensaje(ws, clienteId, mensaje) {
  const { jsonrpc, id, method, params } = mensaje;

  if (jsonrpc !== '2.0' || !method) {
    enviarError(ws, id, -32600, 'Mensaje JSON-RPC inválido');
    return;
  }

  const cliente = estado.clientes.get(clienteId);
  if (!cliente) return;

  // Método especial: handshake (actualiza el contexto del cliente)
  if (method === 'handshake') {
    cliente.contexto.protocolo = params?.protocolo;
    cliente.contexto.cliente_app = params?.cliente;
    enviarRespuesta(ws, id, { handshake: 'ok', bridge_version: '1.0.0' });
    return;
  }

  // Método especial: autenticación del usuario
  if (method === 'auth.verify') {
    const autenticado = params?.confirmado === true;
    cliente.contexto.usuario_autenticado = autenticado;
    cliente.contexto.modo_agente = autenticado ? 'guardian' : 'huesped';

    enviarRespuesta(ws, id, {
      autenticado,
      modo: cliente.contexto.modo_agente,
      mensaje: autenticado
        ? 'Identidad verificada. Aegis está a tu servicio.'
        : 'Modo Huésped activado. Funcionalidad limitada para proteger tus datos.',
    });
    return;
  }

  // Ejecutar método MCP
  const resultado = await ejecutarMCP(method, params ?? {}, cliente.contexto);

  if (resultado.error) {
    enviarError(ws, id, resultado.error.code, resultado.error.message, {
      mensaje_usuario: resultado.error.mensaje_usuario,
      modo_seguro: resultado.error.modo_seguro,
    });

    // Si se activó el Modo Seguro, notificar a todos los clientes
    if (resultado.error.modo_seguro) {
      broadcast({
        method: 'agent.modo_seguro',
        params: { activado: true, razon: resultado.error.message },
      });
    }
  } else {
    enviarRespuesta(ws, id, resultado.result);
  }
}

// ─── Helpers de respuesta JSON-RPC ───────────────────────────

function enviarRespuesta(ws, id, result) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ jsonrpc: '2.0', id, result }));
  }
}

function enviarError(ws, id, code, message, data = {}) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message, data } }));
  }
}

function enviarAlCliente(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ jsonrpc: '2.0', ...payload }));
  }
}

function broadcast(payload) {
  const mensaje = JSON.stringify({ jsonrpc: '2.0', ...payload });
  for (const { ws } of estado.clientes.values()) {
    if (ws.readyState === ws.OPEN) {
      ws.send(mensaje);
    }
  }
}

// ─── Heartbeat periódico ─────────────────────────────────────

const heartbeatTimer = setInterval(() => {
  for (const [id, { ws }] of estado.clientes.entries()) {
    if (!ws._isAlive) {
      ws.terminate();
      estado.clientes.delete(id);
      continue;
    }
    ws._isAlive = false;
    ws.ping();

    // Enviar heartbeat de estado del agente
    enviarAlCliente(ws, {
      method: 'agent.heartbeat',
      params: {
        timestamp: new Date().toISOString(),
        clientes_activos: estado.clientes.size,
        mensaje: '💓 Aegis operativo.',
      },
    });
  }
}, HEARTBEAT_INTERVAL);

// ─── Cierre limpio ───────────────────────────────────────────

async function cerrarServidor(signal) {
  console.log(`\n[Aegis Bridge] Apagando servidor (${signal})…`);
  clearInterval(heartbeatTimer);

  // Notificar a todos los clientes
  broadcast({
    method: 'bridge.shutdown',
    params: { mensaje: 'Aegis Bridge cerrando. Hasta pronto.' },
  });

  await cerrarNeo4j();
  wss.close(() => {
    console.log('[Aegis Bridge] Servidor cerrado limpiamente.');
    process.exit(0);
  });
}

process.on('SIGINT', () => cerrarServidor('SIGINT'));
process.on('SIGTERM', () => cerrarServidor('SIGTERM'));
