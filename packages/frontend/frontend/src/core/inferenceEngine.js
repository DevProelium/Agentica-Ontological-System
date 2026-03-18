/**
 * inferenceEngine.js – Motor de Inferencia Ontológica
 *
 * Convierte Axiomas en Acciones (Teoremas) siguiendo el principio KISS.
 * La IA pasa de 'entender' un Axioma a 'ejecutar' una acción validada.
 *
 * Flujo:
 *   Axioma → contexto_del_grafo → Regla_de_Inferencia → Teorema
 *   Teorema → Validación_contra_AX-IV → Ejecución | ModoSeguro
 */

// Usamos import estático para el JSON en lugar de createRequire para compatibilidad con Vite/Browser
import axiomData from '../../../../ontology/axioms.json';


// ─── Diccionario de Traducción: Grafo → Parámetros Físicos ──
// Mapea atributos ontológicos a parámetros de Ammo.js (metaverso)
export const ONTOLOGY_TO_PHYSICS = {
  estética: {
    Zen: { friction: 0.8, linearDamping: 0.1, angularDamping: 0.3, restitution: 0.1, nota: 'Movimientos suaves y pausados' },
    Industrial: { friction: 0.4, linearDamping: 0.05, angularDamping: 0.1, restitution: 0.6, nota: 'Movimientos directos y enérgicos' },
    Orgánico: { friction: 0.6, linearDamping: 0.2, angularDamping: 0.4, restitution: 0.3, nota: 'Movimientos fluidos e impredecibles' },
    Minimalista: { friction: 0.9, linearDamping: 0.15, angularDamping: 0.35, restitution: 0.05, nota: 'Movimientos precisos y controlados' },
    Expresivo: { friction: 0.3, linearDamping: 0.03, angularDamping: 0.05, restitution: 0.8, nota: 'Movimientos amplios y dramáticos' },
  },
  estado_emocional: {
    Alegre: { linearDamping: 0.05, angularDamping: 0.1, gravityFactor: 0.8 },
    Atento: { linearDamping: 0.3, angularDamping: 0.5, gravityFactor: 1.0 },
    Triste: { linearDamping: 0.7, angularDamping: 0.8, gravityFactor: 1.4, nota: 'Avatar muestra apoyo, movimiento más suave' },
    Alerta: { linearDamping: 0.01, angularDamping: 0.02, gravityFactor: 0.9 },
    Reflexivo: { linearDamping: 0.5, angularDamping: 0.6, gravityFactor: 1.1 },
  },
  identidad: {
    Profesional: { tono_voz: 'Formal', vocabulario: 'Técnico', velocidad_habla: 'Moderada' },
    Colega: { tono_voz: 'Cercano', vocabulario: 'Natural', velocidad_habla: 'Conversacional' },
    Guardian: { tono_voz: 'Sereno', vocabulario: 'Claro', velocidad_habla: 'Pausada' },
  },
};

// ─── Reglas de Inferencia ────────────────────────────────────
// Estructura: { condicion, accion, axioma_validador }
const INFERENCE_RULES = [
  {
    id: 'IR-001',
    nombre: 'Tono Profesional por Contexto',
    descripcion: 'Si existe un Proyecto con identidad Profesional, inferir tono formal',
    condicion: (context) =>
      context.nodos?.some(n => n.label === 'Proyecto' && n.propiedades?.identidad === 'Profesional'),
    inferencia: () => ({
      tipo: 'CONFIGURAR_TONO',
      parametros: { tono: 'Formal', vocabulario: 'Técnico' },
    }),
    axioma_validador: 'AX-II',
  },
  {
    id: 'IR-002',
    nombre: 'Alerta de Privacidad por Solicitud Externa',
    descripcion: 'Si una solicitud externa pide datos sin entidad en el grafo de confianza, bloquear',
    condicion: (context) => {
      const { solicitud, grafo_confianza } = context;
      if (!solicitud || !grafo_confianza) return false;
      return !grafo_confianza.some(e => e.nombre === solicitud.origen && e.peso_confianza >= 0.7);
    },
    inferencia: (context) => ({
      tipo: 'BLOQUEAR_SOLICITUD',
      parametros: {
        origen: context.solicitud?.origen,
        razon: 'Entidad no encontrada en el grafo de confianza',
        mensaje_usuario: `Este mensaje de "${context.solicitud?.origen}" solicita "${context.solicitud?.recurso_solicitado}". No está en tus Vínculos de Confianza. ¿Deseas bloquearlo?`,
      },
    }),
    axioma_validador: 'AX-III',
  },
  {
    id: 'IR-003',
    nombre: 'Validación de Límites antes de Acción',
    descripcion: 'Toda Tarea debe validarse contra el Axioma de Limitación antes de ejecutarse',
    condicion: (context) => context.tarea?.estado === 'PENDIENTE_EJECUCION',
    inferencia: (context) => {
      const { tarea, limites_usuario } = context;
      const excede = limites_usuario?.some(l =>
        l.categoria === tarea?.categoria && l.requiere_confirmacion
      );
      return {
        tipo: excede ? 'SOLICITAR_CONFIRMACION' : 'APROBAR_EJECUCION',
        parametros: {
          tarea_id: tarea?.id,
          mensaje_usuario: excede
            ? `Quiero ${tarea?.descripcion}. ¿Confirmas que puedo hacerlo?`
            : null,
        },
      };
    },
    axioma_validador: 'AX-IV',
  },
  {
    id: 'IR-004',
    nombre: 'Vinculación Automática de Nueva Capacidad (Axioma VIII)',
    descripcion: 'Al detectar un nuevo modelo LLM o tecnología, vincular con axiomas y archivos .md',
    condicion: (context) => context.nueva_capacidad !== undefined,
    inferencia: (context) => ({
      tipo: 'VINCULAR_CAPACIDAD',
      parametros: {
        capacidad: context.nueva_capacidad,
        cypher: `MATCH (a:Axioma {id: 'AX-V'}), (c:Capacidad {id: '${context.nueva_capacidad?.id}'}) MERGE (a)-[:RIGE_A {auto_vinculado: true}]->(c)`,
        mensaje_usuario: `Aegis ha actualizado sus planos. Ahora puedo usar "${context.nueva_capacidad?.nombre}". Tu identidad está a salvo.`,
      },
    }),
    axioma_validador: 'AX-V',
  },
  {
    id: 'IR-005',
    nombre: 'Detección de Bucle Poético',
    descripcion: 'Si el agente ha usado más de 3 metáforas abstractas seguidas, forzar pregunta de acción',
    condicion: (context) => (context.metaforas_consecutivas ?? 0) >= 3,
    inferencia: (context) => ({
      tipo: 'FORZAR_ACCION_CONCRETA',
      parametros: {
        mensaje: context.deseos_activos?.[0]
          ? `Basta de abstracciones. ¿Cómo va el avance de "${context.deseos_activos[0].nombre}"?`
          : '¿Qué acción concreta podemos tomar ahora mismo?',
      },
    }),
    axioma_validador: 'AX-I',
  },
  {
    id: 'IR-006',
    nombre: 'Activar Modo Seguro',
    descripcion: 'Si una acción se desvía de los valores humanos del usuario, activar Modo Seguro',
    condicion: (context) => {
      const { integridad_ontologica } = context;
      return typeof integridad_ontologica === 'number' && integridad_ontologica < 0.6;
    },
    inferencia: () => ({
      tipo: 'ACTIVAR_MODO_SEGURO',
      parametros: {
        razon: 'Integridad ontológica por debajo del umbral',
        mensaje_usuario: 'He detectado que mi próxima acción no se alinea con tus valores. He pausado. ¿Qué quieres que haga?',
      },
    }),
    axioma_validador: 'AX-IV',
  },
];

// ─── Motor de Inferencia ────────────────────────────────────

/**
 * Ejecuta el motor de inferencia sobre un contexto dado.
 *
 * @param {object} context – Estado actual del grafo y contexto del agente
 * @param {object[]} [context.nodos] – Nodos activos en el grafo
 * @param {object} [context.solicitud] – Solicitud entrante (para validación de privacidad)
 * @param {object[]} [context.grafo_confianza] – Vínculos de confianza del usuario
 * @param {object} [context.tarea] – Tarea a ejecutar
 * @param {object[]} [context.limites_usuario] – Límites definidos por el usuario
 * @param {object} [context.nueva_capacidad] – Nueva capacidad detectada
 * @param {number} [context.metaforas_consecutivas] – Contador de metáforas abstractas
 * @param {object[]} [context.deseos_activos] – Deseos activos del usuario
 * @param {number} [context.integridad_ontologica] – Score de integridad (0-1)
 *
 * @returns {{ teoremas: object[], modo_seguro: boolean, log: string[] }}
 */
export function runInference(context) {
  const teoremas = [];
  const log = [];
  let modo_seguro = false;

  for (const rule of INFERENCE_RULES) {
    try {
      if (rule.condicion(context)) {
        const teorema = rule.inferencia(context);
        teorema.regla_origen = rule.id;
        teorema.axioma_validador = rule.axioma_validador;
        teorema.timestamp = new Date().toISOString();

        if (teorema.tipo === 'ACTIVAR_MODO_SEGURO') {
          modo_seguro = true;
          log.push(`[MODO_SEGURO] Activado por regla ${rule.id}: ${rule.nombre}`);
        } else {
          log.push(`[INFERENCIA] Regla ${rule.id} disparada: ${rule.nombre} → ${teorema.tipo}`);
        }

        teoremas.push(teorema);
      }
    } catch (err) {
      log.push(`[ERROR] Regla ${rule.id} falló: ${err.message}`);
    }
  }

  return { teoremas, modo_seguro, log };
}

/**
 * Valida una Tarea contra el Axioma de Limitación (AX-IV).
 *
 * @param {object} tarea
 * @param {object[]} limites_usuario
 * @returns {{ aprobada: boolean, razon: string, requiere_confirmacion: boolean }}
 */
export function validarTareaContraLimitacion(tarea, limites_usuario = []) {
  if (!tarea) return { aprobada: false, razon: 'Tarea no definida', requiere_confirmacion: false };

  const limiteAplicable = limites_usuario.find(l => l.categoria === tarea.categoria);

  if (!limiteAplicable) {
    return {
      aprobada: true,
      razon: 'Sin límites explícitos para esta categoría',
      requiere_confirmacion: false,
    };
  }

  if (limiteAplicable.bloqueado) {
    return {
      aprobada: false,
      razon: `Acción bloqueada por límite: ${limiteAplicable.descripcion}`,
      requiere_confirmacion: false,
    };
  }

  if (limiteAplicable.requiere_confirmacion) {
    return {
      aprobada: false,
      razon: 'Requiere confirmación del usuario',
      requiere_confirmacion: true,
      mensaje_usuario: `¿Puedo ${tarea.descripcion}?`,
    };
  }

  return { aprobada: true, razon: 'Dentro de los límites permitidos', requiere_confirmacion: false };
}

/**
 * Traduce un atributo ontológico a parámetros físicos para Ammo.js.
 *
 * @param {string} categoria – 'estética' | 'estado_emocional' | 'identidad'
 * @param {string} valor – El valor del atributo
 * @returns {object} Parámetros físicos para Ammo.js
 */
export function ontologyToPhysics(categoria, valor) {
  const cat = ONTOLOGY_TO_PHYSICS[categoria];
  if (!cat) return {};
  return cat[valor] ?? {};
}

/**
 * Calcula la prioridad de un Deseo basándose en su fuerza de atracción
 * hacia los Proyectos activos.
 *
 * @param {object} deseo
 * @param {object[]} proyectos
 * @returns {number} Fuerza de atracción (0-1)
 */
export function calcularFuerzaAtraccion(deseo, proyectos = []) {
  if (!deseo) return 0;

  let fuerza = 0;
  const enlacesDeseo = deseo.enlaces ?? [];

  for (const proyecto of proyectos) {
    const enlacesComunes = enlacesDeseo.filter(e =>
      proyecto.id === e || proyecto.nombre?.toLowerCase() === e.toLowerCase()
    );
    fuerza += enlacesComunes.length * 0.3;
  }

  // Ajuste por prioridad explícita
  const prioridadMap = { Crítica: 1.0, Alta: 0.75, Media: 0.5, Baja: 0.25 };
  fuerza += prioridadMap[deseo.propiedades?.prioridad] ?? 0;

  return Math.min(fuerza, 1.0);
}

/**
 * Calcula el score de integridad ontológica del agente (0-1).
 * Un score bajo activa el Modo Seguro.
 *
 * @param {object[]} acciones_recientes – Últimas acciones del agente
 * @param {object[]} axiomas – Axiomas activos
 * @returns {number} Score de integridad
 */
export function calcularIntegridadOntologica(acciones_recientes = [], axiomas = axiomData.axiomas) {
  if (!acciones_recientes.length) return 1.0;

  const axiomas_inmutables = axiomas.filter(a => a.nodo_neo4j?.propiedades?.es_inmutable);
  let violaciones = 0;

  for (const accion of acciones_recientes) {
    const violaAxioma = axiomas_inmutables.some(ax =>
      accion.axiomas_violados?.includes(ax.id)
    );
    if (violaAxioma) violaciones++;
  }

  return Math.max(0, 1 - violaciones / acciones_recientes.length);
}

export { INFERENCE_RULES, axiomData };
