/**
 * ontologyStore.js – Estado Global del Sistema Ontológico
 *
 * Gestiona el estado de axiomas, aspiraciones, tareas, presencia y
 * el indicador de integridad ontológica. Usa Zustand (KISS, sin Redux overhead).
 */

import { create } from 'zustand';

const useOntologyStore = create((set, get) => ({
  // ─── Estado del Agente ──────────────────────────────────
  agente: {
    nombre: 'Aegis',
    estado_animo: 'Atento',
    integridad_ontologica: 1.0,
    modo: 'guardian', // 'guardian' | 'huesped' | 'seguro'
    autenticado: false,
  },

  // ─── Axiomas (los 5 Principios Base) ───────────────────
  axiomas: [],
  setAxiomas: (axiomas) => set({ axiomas }),

  // ─── Aspiraciones (Deseos) ──────────────────────────────
  aspiraciones: [],
  setAspiraciones: (aspiraciones) => set({ aspiraciones }),
  agregarAspiracion: (aspiracion) =>
    set((state) => ({ aspiraciones: [...state.aspiraciones, aspiracion] })),

  // ─── Vínculos de Confianza ──────────────────────────────
  vinculos: [],
  setVinculos: (vinculos) => set({ vinculos }),
  agregarVinculo: (vinculo) =>
    set((state) => ({ vinculos: [...state.vinculos, vinculo] })),

  // ─── Tareas Activas ─────────────────────────────────────
  tareas: [],
  setTareas: (tareas) => set({ tareas }),
  actualizarTarea: (id, cambios) =>
    set((state) => ({
      tareas: state.tareas.map((t) => (t.id === id ? { ...t, ...cambios } : t)),
    })),

  // ─── Recuerdos Compartidos ──────────────────────────────
  recuerdos: [],
  agregarRecuerdo: (recuerdo) =>
    set((state) => ({
      recuerdos: [{ ...recuerdo, timestamp: new Date().toISOString() }, ...state.recuerdos].slice(0, 50),
    })),

  // ─── Presencia (Dispositivos) ───────────────────────────
  presencia: {
    dispositivo_activo: 'PC',
    dispositivos_cast: [],
  },
  setDispositivoActivo: (dispositivo) =>
    set((state) => ({ presencia: { ...state.presencia, dispositivo_activo: dispositivo } })),
  agregarDispositivoCast: (dispositivo) =>
    set((state) => ({
      presencia: {
        ...state.presencia,
        dispositivos_cast: [...state.presencia.dispositivos_cast, dispositivo],
      },
    })),

  // ─── Alertas de Privacidad ──────────────────────────────
  alertas: [],
  agregarAlerta: (alerta) =>
    set((state) => ({ alertas: [alerta, ...state.alertas].slice(0, 20) })),
  descartarAlerta: (id) =>
    set((state) => ({ alertas: state.alertas.filter((a) => a.id !== id) })),

  // ─── Teoremas Pendientes (Acciones inferidas) ───────────
  teoremasPendientes: [],
  agregarTeorema: (teorema) =>
    set((state) => ({ teoremasPendientes: [...state.teoremasPendientes, teorema] })),
  ejecutarTeorema: (id) =>
    set((state) => ({
      teoremasPendientes: state.teoremasPendientes.filter((t) => t.id !== id),
    })),

  // ─── Acciones de Estado del Agente ─────────────────────
  actualizarIntegridad: (score) =>
    set((state) => ({
      agente: {
        ...state.agente,
        integridad_ontologica: score,
        modo: score < 0.6 ? 'seguro' : state.agente.modo,
      },
    })),

  activarModoSeguro: () =>
    set((state) => ({ agente: { ...state.agente, modo: 'seguro' } })),

  autenticarUsuario: (exitoso) =>
    set((state) => ({
      agente: {
        ...state.agente,
        autenticado: exitoso,
        modo: exitoso ? 'guardian' : 'huesped',
      },
    })),

  actualizarEstadoAnimo: (estado) =>
    set((state) => ({ agente: { ...state.agente, estado_animo: estado } })),

  // ─── Documento MD activo en el editor ──────────────────
  documentoActivo: { nombre: '', contenido: '', grafoParsed: null },
  setDocumentoActivo: (doc) => set({ documentoActivo: doc }),

  // ─── Conexión WebSocket al Bridge ───────────────────────
  bridge: {
    conectado: false,
    url: 'ws://localhost:3001',
  },
  setBridgeConectado: (estado) =>
    set((state) => ({ bridge: { ...state.bridge, conectado: estado } })),
}));

export default useOntologyStore;
