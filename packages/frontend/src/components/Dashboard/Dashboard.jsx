/**
 * Dashboard.jsx – Panel de Control Principal de Aegis
 *
 * El "Dashboard Vivo" que respira al ritmo del usuario.
 * Integra: estado del agente, aspiraciones, tareas, presencia y alertas.
 * Lenguaje humanista: sin "arrays", "strings" o jerga técnica.
 */

import { useEffect, useState } from 'react';
import { getIntegrityIndicator, generarBienvenidaOntologica } from '../../core/privacyShield.js';
import { runInference } from '../../core/inferenceEngine.js';
import { ontologyToPhysics } from '../../core/inferenceEngine.js';
import useOntologyStore from '../../store/ontologyStore.js';
import { useCast } from '../../hooks/useCast.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';

export default function Dashboard() {
  const {
    agente, axiomas, aspiraciones, tareas, recuerdos, presencia,
    alertas, teoremasPendientes, actualizarEstadoAnimo, agregarRecuerdo,
  } = useOntologyStore();

  const { isCastAvailable, proyectarEnPantalla } = useCast();
  const { enviarMensaje } = useWebSocket();
  const [bienvenida, setBienvenida] = useState('');
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true);

  const indicador = getIntegrityIndicator(agente.integridad_ontologica);

  // Generar mensaje de bienvenida ontológica al montar
  useEffect(() => {
    const msg = generarBienvenidaOntologica(
      { nombre: 'Propietario' },
      axiomas,
      { total_archivos: 0 }
    );
    setBienvenida(msg);
  }, [axiomas]);

  // Heartbeat: ejecutar el motor de inferencia periódicamente
  useEffect(() => {
    const heartbeat = setInterval(() => {
      const context = {
        nodos: aspiraciones,
        deseos_activos: aspiraciones.filter(a => a.propiedades?.estado === 'Activo'),
        integridad_ontologica: agente.integridad_ontologica,
        metaforas_consecutivas: 0,
      };
      const { teoremas } = runInference(context);
      // Los teoremas se procesan en el store (a través del WebSocket o directamente)
    }, 60_000); // Cada minuto

    return () => clearInterval(heartbeat);
  }, [aspiraciones, agente.integridad_ontologica]);

  const handleProyectarEnCast = async () => {
    const url = `${window.location.origin}/cast-view`;
    await proyectarEnPantalla(url, 'Sala Principal');
  };

  const handleHeartbeatManual = () => {
    const pregunta = '¿Cómo va ese proyecto en el que estabas trabajando?';
    agregarRecuerdo({ tipo: 'heartbeat', contenido: pregunta });
  };

  return (
    <div className={`dashboard dashboard--${agente.modo}`}>
      {/* ─── Header del Agente ──────────────────────── */}
      <header className="dashboard-header">
        <div className="agente-identidad">
          <div
            className="agente-avatar"
            style={{ '--color-estado': indicador.color }}
            aria-label={`Estado: ${agente.estado_animo}`}
          >
            <span className="agente-icono">⬡</span>
            <span className="agente-pulso" />
          </div>
          <div className="agente-info">
            <h1 className="agente-nombre">{agente.nombre}</h1>
            <span className="agente-estado">{agente.estado_animo} · {indicador.icono} {indicador.nivel}</span>
          </div>
        </div>

        <div className="dashboard-acciones">
          {isCastAvailable && (
            <button
              className="btn-cast"
              onClick={handleProyectarEnCast}
              title="Proyectar en pantalla de la sala"
            >
              📺 Proyectar en {presencia.dispositivo_activo === 'PC' ? 'la sala' : presencia.dispositivo_activo}
            </button>
          )}
          {alertas.length > 0 && (
            <span className="badge-alertas" role="status" aria-live="polite">
              🛡️ {alertas.length} alerta{alertas.length > 1 ? 's' : ''}
            </span>
          )}
          {agente.modo === 'huesped' && (
            <span className="badge-huesped" role="status">Modo Huésped</span>
          )}
          {agente.modo === 'seguro' && (
            <span className="badge-seguro" role="alert">🚨 Modo Seguro</span>
          )}
        </div>
      </header>

      {/* ─── Bienvenida Ontológica (primer encuentro) ─ */}
      {mostrarBienvenida && bienvenida && (
        <div className="bienvenida-card">
          <pre className="bienvenida-texto">{bienvenida}</pre>
          <button
            className="bienvenida-cerrar"
            onClick={() => setMostrarBienvenida(false)}
            aria-label="Cerrar bienvenida"
          >
            Comenzar
          </button>
        </div>
      )}

      {/* ─── Contenido Principal ───────────────────── */}
      <main className="dashboard-main">
        {/* Resumen de Axiomas */}
        <section className="dashboard-seccion" aria-labelledby="principios-titulo">
          <h2 id="principios-titulo" className="seccion-titulo">
            Mis Principios
          </h2>
          {axiomas.length === 0 ? (
            <p className="seccion-vacia">
              Aún no has definido tus Principios. Ve al Editor para comenzar.
            </p>
          ) : (
            <ul className="principios-lista">
              {axiomas.slice(0, 5).map(ax => (
                <li key={ax.id} className="principio-item">
                  <span className="principio-tipo">{ax.tipo}</span>
                  <span className="principio-titulo">{ax.titulo}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Aspiraciones Activas */}
        <section className="dashboard-seccion" aria-labelledby="aspiraciones-titulo">
          <h2 id="aspiraciones-titulo" className="seccion-titulo">
            Mis Aspiraciones
          </h2>
          {aspiraciones.length === 0 ? (
            <p className="seccion-vacia">
              Sin aspiraciones registradas. Añade tus Deseos en el Editor.
            </p>
          ) : (
            <ul className="aspiraciones-dashboard-lista">
              {aspiraciones.slice(0, 5).map((a, i) => (
                <li key={a.id ?? i} className="aspiracion-dashboard-item">
                  <span className="aspiracion-nombre">{a.nombre}</span>
                  {a.propiedades?.prioridad && (
                    <span className={`aspiracion-prioridad prioridad--${a.propiedades.prioridad.toLowerCase()}`}>
                      {a.propiedades.prioridad}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Teoremas Pendientes (Acciones sugeridas) */}
        {teoremasPendientes.length > 0 && (
          <section className="dashboard-seccion dashboard-seccion--alerta" aria-labelledby="acciones-titulo">
            <h2 id="acciones-titulo" className="seccion-titulo">
              Acciones Sugeridas por Aegis
            </h2>
            <ul className="teoremas-lista">
              {teoremasPendientes.slice(0, 3).map((t) => (
                <li key={t.id} className="teorema-item">
                  <p className="teorema-mensaje">{t.parametros?.mensaje_usuario ?? t.tipo}</p>
                  <div className="teorema-acciones">
                    <button className="btn-aprobar" onClick={() => enviarMensaje({ method: 'teorema.ejecutar', params: t })}>
                      Aprobar
                    </button>
                    <button className="btn-rechazar">Rechazar</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Recuerdos Compartidos */}
        {recuerdos.length > 0 && (
          <section className="dashboard-seccion" aria-labelledby="recuerdos-titulo">
            <h2 id="recuerdos-titulo" className="seccion-titulo">
              Recuerdos Compartidos
            </h2>
            <ul className="recuerdos-lista">
              {recuerdos.slice(0, 3).map((r, i) => (
                <li key={i} className="recuerdo-item">
                  <span className="recuerdo-contenido">{r.contenido}</span>
                  <time className="recuerdo-tiempo" dateTime={r.timestamp}>
                    {new Date(r.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </time>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* ─── Footer: Estado de Conexión ────────────── */}
      <footer className="dashboard-footer">
        <span className="footer-presencia">
          📍 {presencia.dispositivo_activo}
          {presencia.dispositivos_cast.length > 0 && ` · Cast: ${presencia.dispositivos_cast.length}`}
        </span>
        <button className="btn-heartbeat" onClick={handleHeartbeatManual} title="Activar Heartbeat manual">
          💓 Heartbeat
        </button>
      </footer>
    </div>
  );
}
