/**
 * useWebSocket.js – Hook para la conexión WebSocket con el Bridge local
 *
 * Mantiene la conexión con el servidor Node.js local (Bridge) que tiene
 * acceso al sistema de archivos, cámara y otros recursos de la PC.
 * Los mensajes siguen el estándar JSON-RPC de MCP.
 */

import { useEffect, useRef, useCallback } from 'react';
import useOntologyStore from '../store/ontologyStore.js';

/**
 * @param {object} [opciones]
 * @param {string} [opciones.url] – URL del WebSocket (default: ws://localhost:3030)
 * @param {Function} [opciones.onMensaje] – Callback al recibir un mensaje
 * @param {boolean} [opciones.reconectar] – Si debe intentar reconexión automática
 */
const getWsUrl = (urlDefault) => {
  if (typeof window === 'undefined') return urlDefault;
  
  // Extraemos datos de la URL actual donde se carga Aegis
  const { protocol, host, hostname } = window.location;
  
  // Si estamos en entorno local, apuntamos directo al Bridge en localhost:3030
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return urlDefault;
  }
  
  // Si el frontend se carga desde Cloudflare Tunnel (https://aegis.agentica-metaverse.com),
  // utilizamos webSockets seguros (wss://) apuntando al mismo dominio bajo la ruta /ws
  // ya que Vite (o tu servidor de producción) expone o proxifica /ws hacia el puerto 3030.
  return `${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}/ws`;
};

export function useWebSocket({ url = 'ws://localhost:3030', onMensaje, reconectar = true } = {}) {
  const wsUrl = getWsUrl(url);
  const ws = useRef(null);
  const reconectarTimer = useRef(null);
  const { setBridgeConectado, agregarAlerta, agregarTeorema } = useOntologyStore();

  const conectar = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setBridgeConectado(true);
        // Handshake inicial: presentar la versión del protocolo
        enviarMensaje({ method: 'handshake', params: { protocolo: 'MCP-1.0', cliente: 'Agentica-PWA' } });
      };

      ws.current.onmessage = (event) => {
        try {
          const mensaje = JSON.parse(event.data);
          procesarMensajeBridge(mensaje, { agregarAlerta, agregarTeorema });
          onMensaje?.(mensaje);
        } catch (error) {
          console.error('[Aegis] Error al parsear mensaje del Bridge:', error.message);
        }
      };

      ws.current.onclose = () => {
        setBridgeConectado(false);
        if (reconectar) {
          reconectarTimer.current = setTimeout(conectar, 3000);
        }
      };

      ws.current.onerror = () => {
        setBridgeConectado(false);
      };
    } catch {
      if (reconectar) {
        reconectarTimer.current = setTimeout(conectar, 3000);
      }
    }
  }, [wsUrl, onMensaje, reconectar, setBridgeConectado, agregarAlerta, agregarTeorema]);

  const enviarMensaje = useCallback((payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const mensaje = {
        jsonrpc: '2.0',
        id: Date.now(),
        ...payload,
      };
      ws.current.send(JSON.stringify(mensaje));
    }
  }, []);

  const sincronizarGrafo = useCallback((cambiosMD) => {
    enviarMensaje({
      method: 'graph.sync',
      params: {
        tipo: 'actualizacion_md',
        datos: cambiosMD,
        timestamp: new Date().toISOString(),
      },
    });
  }, [enviarMensaje]);

  const proyectarEnCast = useCallback((dispositivoId, contenido) => {
    enviarMensaje({
      method: 'cast.project',
      params: { dispositivo_id: dispositivoId, contenido },
    });
  }, [enviarMensaje]);

  useEffect(() => {
    conectar();
    return () => {
      clearTimeout(reconectarTimer.current);
      ws.current?.close();
    };
  }, [conectar]);

  return { enviarMensaje, sincronizarGrafo, proyectarEnCast };
}

/**
 * Procesa los mensajes entrantes del Bridge y actualiza el estado global.
 */
function procesarMensajeBridge(mensaje, { agregarAlerta, agregarTeorema }) {
  if (!mensaje?.method) return;

  switch (mensaje.method) {
    case 'privacy.alert':
      agregarAlerta({
        id: `alerta-${Date.now()}`,
        tipo: 'privacidad',
        nivel: mensaje.params?.nivel ?? 'medio',
        mensaje_usuario: mensaje.params?.mensaje_usuario ?? 'Se detectó una solicitud sospechosa.',
        origen: mensaje.params?.origen,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'inference.teorema':
      agregarTeorema({
        id: `teorema-${Date.now()}`,
        ...mensaje.params,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'agent.heartbeat':
      // El Bridge envía heartbeats periódicos con el estado del sistema
      break;

    default:
      break;
  }
}


