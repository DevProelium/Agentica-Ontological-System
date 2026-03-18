/**
 * WizardFlow.jsx – Asistente de Configuración del Agente Ontológico
 *
 * Guía al usuario a través del proceso de definición de sus 5 Axiomas Base
 * y el Handshake Biométrico inicial. Primera vez que el usuario y Aegis se encuentran.
 */

import { useState } from 'react';
import { verificarIdentidad, generarBienvenidaOntologica } from '../../core/privacyShield.js';
import useOntologyStore from '../../store/ontologyStore.js';

// Named constants for axiom identity weights
const IMMUTABLE_AXIOM_WEIGHT = 1.0;
const MUTABLE_AXIOM_WEIGHT = 0.85;

const PASOS = [
  { id: 1, titulo: 'Identidad', descripcion: 'Tu Propósito como ser humano', axioma: 'Propósito', tipo: 'AX-I' },
  { id: 2, titulo: 'Estética', descripcion: 'La forma en que quieres que el mundo te vea', axioma: 'Estética', tipo: 'AX-II' },
  { id: 3, titulo: 'Vínculos', descripcion: 'Con quién confías y cómo proteges esa confianza', axioma: 'Relación', tipo: 'AX-III' },
  { id: 4, titulo: 'Límites', descripcion: 'Lo que Aegis nunca debe hacer sin tu permiso', axioma: 'Limitación', tipo: 'AX-IV' },
  { id: 5, titulo: 'Crecimiento', descripcion: 'Cómo evolucionas sin perder tu esencia', axioma: 'Crecimiento', tipo: 'AX-V' },
];

const ESTILOS_ESTETICA = ['Zen', 'Industrial', 'Orgánico', 'Minimalista', 'Expresivo'];

export default function WizardFlow({ onCompletado }) {
  const [pasoActual, setPasoActual] = useState(0); // 0 = handshake, 1-5 = axiomas
  const [respuestas, setRespuestas] = useState({});
  const [autenticando, setAutenticando] = useState(false);
  const [error, setError] = useState(null);

  const { setAxiomas, autenticarUsuario } = useOntologyStore();

  // ─── Paso 0: Handshake Biométrico ───────────────────────
  const handleHandshake = async () => {
    setAutenticando(true);
    setError(null);

    try {
      // En producción: solicitar datos biométricos al Bridge local
      // Por ahora: simular con confirmación del usuario
      const resultado = verificarIdentidad(
        { tipo: 'confirmacion', hash: 'user-confirmed' },
        { biometric_hash: 'user-confirmed' }
      );

      autenticarUsuario(resultado.autenticado);
      setPasoActual(1);
    } catch {
      setError('No se pudo verificar la identidad. Intentando en Modo Huésped…');
      autenticarUsuario(false);
      setPasoActual(1);
    } finally {
      setAutenticando(false);
    }
  };

  // ─── Pasos 1-5: Definición de Axiomas ───────────────────
  const handleRespuesta = (campo, valor) => {
    setRespuestas(prev => ({ ...prev, [`paso${pasoActual}_${campo}`]: valor }));
  };

  const handleSiguiente = () => {
    if (pasoActual < PASOS.length) {
      setPasoActual(pasoActual + 1);
    } else {
      finalizarWizard();
    }
  };

  const finalizarWizard = () => {
    // Construir axiomas desde las respuestas del wizard
    const axiomas = PASOS.map((paso) => ({
      id: paso.tipo,
      nombre: paso.axioma,
      titulo: respuestas[`paso${paso.id}_titulo`] || paso.descripcion,
      enunciado: respuestas[`paso${paso.id}_enunciado`] || '',
      tipo: paso.axioma,
      peso_identidad: ['AX-I', 'AX-III', 'AX-IV'].includes(paso.tipo) ? IMMUTABLE_AXIOM_WEIGHT : MUTABLE_AXIOM_WEIGHT,
      es_inmutable: ['AX-I', 'AX-III', 'AX-IV'].includes(paso.tipo),
      nodo_neo4j: {
        label: 'Axioma',
        propiedades: { id: paso.tipo, tipo: paso.axioma, peso_identidad: 1.0 },
      },
    }));

    setAxiomas(axiomas);
    onCompletado?.(axiomas, respuestas);
  };

  const pasoDatos = PASOS[pasoActual - 1];
  const progreso = pasoActual === 0 ? 0 : (pasoActual / PASOS.length) * 100;

  // ─── Render: Handshake ─────────────────────────────────
  if (pasoActual === 0) {
    return (
      <div className="wizard-container wizard-handshake">
        <div className="wizard-card">
          <span className="wizard-icono" aria-hidden="true">⬡</span>
          <h1 className="wizard-titulo-principal">Aegis te reconoce.</h1>
          <p className="wizard-descripcion">
            Antes de comenzar, necesito confirmar que eres tú.
            Tus datos nunca salen de tu dispositivo.
          </p>

          {error && (
            <p className="wizard-error" role="alert">{error}</p>
          )}

          <button
            className="btn-handshake"
            onClick={handleHandshake}
            disabled={autenticando}
          >
            {autenticando ? 'Verificando…' : '🔐 Confirmar mi identidad'}
          </button>

          <p className="wizard-nota-privacidad">
            <small>
              La verificación biométrica ocurre localmente.
              Sin nube, sin servidores externos.
            </small>
          </p>
        </div>
      </div>
    );
  }

  // ─── Render: Axiomas ────────────────────────────────────
  return (
    <div className="wizard-container">
      {/* Barra de progreso */}
      <div className="wizard-progreso" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
        <div className="wizard-progreso-barra" style={{ width: `${progreso}%` }} />
      </div>

      <div className="wizard-steps">
        {PASOS.map((paso) => (
          <span
            key={paso.id}
            className={`wizard-step ${pasoActual > paso.id ? 'completado' : ''} ${pasoActual === paso.id ? 'activo' : ''}`}
          >
            {paso.id}
          </span>
        ))}
      </div>

      <div className="wizard-card">
        <span className="wizard-axioma-label">{pasoDatos.axioma}</span>
        <h2 className="wizard-titulo">{pasoDatos.titulo}</h2>
        <p className="wizard-descripcion">{pasoDatos.descripcion}</p>

        {/* Campo para el título del axioma */}
        <label className="wizard-label" htmlFor={`axioma-titulo-${pasoActual}`}>
          ¿Cómo lo resumirías en una frase?
        </label>
        <input
          id={`axioma-titulo-${pasoActual}`}
          type="text"
          className="wizard-input"
          placeholder={`Ej: "${pasoDatos.descripcion}"`}
          value={respuestas[`paso${pasoActual}_titulo`] ?? ''}
          onChange={(e) => handleRespuesta('titulo', e.target.value)}
        />

        {/* Selector de estética en el paso 2 */}
        {pasoActual === 2 && (
          <div className="wizard-estilos">
            <p className="wizard-label">¿Qué estilo te representa?</p>
            <div className="estilos-opciones">
              {ESTILOS_ESTETICA.map(estilo => (
                <button
                  key={estilo}
                  className={`estilo-opcion ${respuestas['paso2_estilo'] === estilo ? 'seleccionado' : ''}`}
                  onClick={() => handleRespuesta('estilo', estilo)}
                >
                  {estilo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Descripción ampliada */}
        <label className="wizard-label" htmlFor={`axioma-enunciado-${pasoActual}`}>
          Cuéntame más (opcional)
        </label>
        <textarea
          id={`axioma-enunciado-${pasoActual}`}
          className="wizard-textarea"
          rows={3}
          placeholder="Puedes ser tan específico o general como quieras…"
          value={respuestas[`paso${pasoActual}_enunciado`] ?? ''}
          onChange={(e) => handleRespuesta('enunciado', e.target.value)}
        />

        <div className="wizard-navegacion">
          {pasoActual > 1 && (
            <button
              className="btn-anterior"
              onClick={() => setPasoActual(p => p - 1)}
            >
              ← Anterior
            </button>
          )}
          <button
            className="btn-siguiente"
            onClick={handleSiguiente}
          >
            {pasoActual === PASOS.length ? '✓ Completar' : 'Siguiente →'}
          </button>
        </div>
      </div>

      <p className="wizard-paso-contador">
        Principio {pasoActual} de {PASOS.length}
      </p>
    </div>
  );
}
