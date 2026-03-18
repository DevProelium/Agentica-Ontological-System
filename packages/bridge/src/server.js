import { WebSocketServer } from 'ws';
import { iniciarNeo4j, cerrarNeo4j } from './neo4jClient.js';
import { iniciarSistemasCognitivos, cerrarSistemasCognitivos } from './db.js';
import { updateAgentState, addShortTermMemory, iniciarTelepatiaInversa } from './redisState.js';
import { ejecutarMCP } from './mcpBridge.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HEARTBEAT_INTERVAL = 30_000; 

const estado = {
  clientes: new Map(), 
  neo4j_disponible: false,
};

console.log('[Aegis Bridge] Iniciando servidor local...');

iniciarNeo4j();
iniciarSistemasCognitivos();
iniciarTelepatiaInversa();

const wss = new WebSocketServer({ port: PORT }, () => {
  console.log('[Aegis Bridge] Escuchando en ws://localhost:' + PORT);
  console.log('[Aegis Bridge] El puente entre la PWA y el mundo local esta activo.');
});

wss.on('connection', (ws, req) => {
  const clienteId = 'cliente-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const ip = req.socket.remoteAddress ?? '';

  const ALLOWED_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
  // Si usas Cloudflare Tunnel, la IP que llega puede ser diferente o venir en cabeceras.
  // Por ahora relajamos esta restricción para permitir que el túnel direccione tráfico.
  // En producción real, considera validar el header cf-access-token o similar.
  if (!ALLOWED_IPS.has(ip) && process.env.NODE_ENV !== 'production') {
    console.warn(`[Aegis Bridge] Conexión detectada desde IP: ${ip}. (Modo Cloudflare Tunnel)`);
    // ws.close(1008, 'Solo conexiones locales permitidas');
    // return;
  }

  estado.clientes.set(clienteId, {
    ws,
    contexto: {
      usuario_autenticado: false,
      modo_agente: 'huesped',
      limites_usuario: [],
    },
  });

  console.log('[Aegis Bridge] Cliente conectado: ' + clienteId);

  updateAgentState({
    estado: 'activo_en_computadora',
    emocion: 'atento',
    actividad_actual: 'Acompanando al usuario en Aegis Dashboard',
    cliente_conectado: clienteId
  });

  enviarAlCliente(ws, {
    method: 'bridge.ready',
    params: {
      version: '1.0.0',
      mensaje: 'Bridge local activo. Aegis esta listo.',
      cliente_id: clienteId,
    },
  });

  ws._isAlive = true;
  ws.on('pong', () => { ws._isAlive = true; });

  ws.on('message', async (data) => {
    let mensaje;
    try {
      mensaje = JSON.parse(data.toString());
    } catch {
      enviarError(ws, null, -32700, 'El mensaje no es JSON valido');
      return;
    }

    await procesarMensaje(ws, clienteId, mensaje);
  });

  ws.on('close', () => {
    estado.clientes.delete(clienteId);
    console.log('[Aegis Bridge] Cliente desconectado: ' + clienteId);

    if (estado.clientes.size === 0) {
      updateAgentState({
        estado: 'procesando_en_fondo',
        emocion: 'contemplativo',
        actividad_actual: 'Consolidando memorias a la espera de interacciones.',
        cliente_conectado: null
      });
    }
  });

  ws.on('error', (err) => {
    console.error('[Aegis Bridge] Error en cliente ' + clienteId + ':', err.message);
  });
});

async function procesarMensaje(ws, clienteId, mensaje) {
  const { jsonrpc, id, method, params } = mensaje;

  if (jsonrpc !== '2.0' || !method) {
    enviarError(ws, id, -32600, 'Mensaje JSON-RPC invalido');
    return;
  }

  const cliente = estado.clientes.get(clienteId);
  if (!cliente) return;

  if (method === 'handshake') {
    cliente.contexto.protocolo = params?.protocolo;
    cliente.contexto.cliente_app = params?.cliente;
    enviarRespuesta(ws, id, { handshake: 'ok', bridge_version: '1.0.0' });
    return;
  }

  if (method === 'auth.verify') {
    const autenticado = params?.confirmado === true;
    cliente.contexto.usuario_autenticado = autenticado;
    cliente.contexto.modo_agente = autenticado ? 'guardian' : 'huesped';

    enviarRespuesta(ws, id, {
      autenticado,
      modo: cliente.contexto.modo_agente,
      mensaje: autenticado
        ? 'Identidad verificada. Aegis esta a tu servicio.'
        : 'Modo Huesped activado. Funcionalidad limitada.',
    });
    return;
  }

  const resultado = await ejecutarMCP(method, params ?? {}, cliente.contexto);

  if (!resultado.error && method !== 'agent.heartbeat' && method !== 'auth.verify') {
      addShortTermMemory({
         tipo: 'accion_mcp',
         metodo: method,
         completado: true
      });
  }

  if (resultado.error) {
    enviarError(ws, id, resultado.error.code, resultado.error.message, {
      mensaje_usuario: resultado.error.mensaje_usuario,
      modo_seguro: resultado.error.modo_seguro,
    });

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

const heartbeatTimer = setInterval(() => {
  for (const [id, { ws }] of estado.clientes.entries()) {
    if (!ws._isAlive) {
      ws.terminate();
      estado.clientes.delete(id);
      continue;
    }
    ws._isAlive = false;
    ws.ping();

    enviarAlCliente(ws, {
      method: 'agent.heartbeat',
      params: {
        timestamp: new Date().toISOString(),
        clientes_activos: estado.clientes.size,
        mensaje: 'Aegis operativo.',
      },
    });
  }
}, HEARTBEAT_INTERVAL);

async function cerrarServidor(signal) {
  console.log('[Aegis Bridge] Apagando servidor (' + signal + ')...');
  clearInterval(heartbeatTimer);

  broadcast({
    method: 'bridge.shutdown',
    params: { mensaje: 'Aegis Bridge cerrando. Hasta pronto.' },
  });

  await cerrarNeo4j();
  await cerrarSistemasCognitivos();

  wss.close(() => {
    console.log('[Aegis Bridge] Servidor cerrado limpiamente.');
    process.exit(0);
  });
}

process.on('SIGINT', () => cerrarServidor('SIGINT'));
process.on('SIGTERM', () => cerrarServidor('SIGTERM'));
