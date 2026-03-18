/**
 * useCast.js – Hook para integración con Google Cast (Presentation API)
 *
 * Permite que el agente "habite" las pantallas del hogar del usuario.
 * Si el usuario cambia de habitación, el agente migra automáticamente.
 */

import { useCallback, useEffect, useRef } from 'react';
import useOntologyStore from '../store/ontologyStore.js';

/**
 * Hook para gestionar la presencia del agente en dispositivos Google Cast.
 * Usa la Presentation API nativa del navegador.
 */
export function useCast() {
  const presentationRef = useRef(null);
  const { setDispositivoActivo, agregarDispositivoCast, agente } = useOntologyStore();

  const isCastAvailable = typeof window !== 'undefined' && 'presentation' in navigator;

  /**
   * Proyecta el estado emocional o investigación actual del agente
   * en una pantalla Cast disponible.
   *
   * @param {string} contenidoUrl – URL de la vista a proyectar
   * @param {string} nombreDispositivo – Nombre amigable del dispositivo
   */
  const proyectarEnPantalla = useCallback(async (contenidoUrl, nombreDispositivo = 'Sala Principal') => {
    if (!isCastAvailable) {
      console.warn('[Aegis] Presentation API no disponible en este navegador.');
      return { exito: false, razon: 'API no disponible' };
    }

    try {
      const request = new PresentationRequest([contenidoUrl]);
      const conexion = await request.start();

      presentationRef.current = conexion;
      agregarDispositivoCast({ id: conexion.id, nombre: nombreDispositivo, tipo: 'cast', activo: true });
      setDispositivoActivo(nombreDispositivo);

      conexion.addEventListener('terminate', () => {
        setDispositivoActivo('PC');
      });

      return { exito: true, conexion_id: conexion.id };
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.error('[Aegis] Error al conectar con Cast:', err.message);
      }
      return { exito: false, razon: err.message };
    }
  }, [isCastAvailable, agregarDispositivoCast, setDispositivoActivo]);

  /**
   * Envía el estado actual del agente a la pantalla Cast conectada.
   * @param {object} estado – { tipo, contenido, estado_animo }
   */
  const enviarEstadoACast = useCallback((estado) => {
    if (!presentationRef.current) return;
    try {
      const mensaje = JSON.stringify({
        tipo: 'estado_agente',
        agente: agente.nombre,
        estado_animo: agente.estado_animo,
        integridad: agente.integridad_ontologica,
        ...estado,
        timestamp: new Date().toISOString(),
      });
      presentationRef.current.send?.(mensaje);
    } catch (err) {
      console.error('[Aegis] Error al enviar estado a Cast:', err.message);
    }
  }, [agente]);

  /**
   * Cierra la sesión de presentación activa.
   */
  const cerrarCast = useCallback(() => {
    presentationRef.current?.terminate?.();
    presentationRef.current = null;
    setDispositivoActivo('PC');
  }, [setDispositivoActivo]);

  // Registrar como receptor de Presentation API si estamos en una pantalla Cast
  useEffect(() => {
    if (!isCastAvailable) return;
    const connection = navigator.presentation?.receiver?.connectionList;
    if (connection) {
      connection.then((list) => {
        list.connections.forEach((conn) => {
          conn.addEventListener('message', (e) => {
            try {
              const data = JSON.parse(e.data);
              // El receptor procesa el estado del agente y lo renderiza
              document.dispatchEvent(new CustomEvent('aegis:cast-message', { detail: data }));
            } catch {
              // No es JSON, ignorar
            }
          });
        });
      });
    }
  }, [isCastAvailable]);

  return {
    proyectarEnPantalla,
    enviarEstadoACast,
    cerrarCast,
    isCastAvailable,
  };
}
