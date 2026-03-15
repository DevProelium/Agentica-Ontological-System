/**
 * privacyShield.js – Módulo de Blindaje del Usuario
 *
 * Implementa el Axioma III (Relación) y el Axioma IV (Limitación).
 * Protege al usuario de a pie contra la manipulación algorítmica
 * y la extracción de datos no consensuada.
 *
 * "Este módulo es el corazón del concepto Aegis como escudo."
 */

// ─── Patrones de Dark Patterns y Manipulación ───────────────
const DARK_PATTERNS = [
  {
    id: 'DP-001',
    nombre: 'Urgencia Falsa',
    descripcion: 'Crea presión artificial de tiempo',
    patron_regex: /\b(ahora mismo|últimas horas|expira en|solo hoy|oferta termina|actúa ya|no pierdas|solo quedan \d+)\b/gi,
    nivel_alerta: 'alto',
    mensaje_usuario: 'Este mensaje usa urgencia artificial para presionarte. No hay prisa real. Tómate tu tiempo.',
  },
  {
    id: 'DP-002',
    nombre: 'Escasez Artificial',
    descripcion: 'Simula disponibilidad limitada para forzar decisión',
    patron_regex: /\b(quedan pocos|stock limitado|última unidad|casi agotado|solo \d+ disponibles)\b/gi,
    nivel_alerta: 'medio',
    mensaje_usuario: 'Este mensaje afirma que quedan pocos. Esto suele ser una táctica para que decidas sin pensar.',
  },
  {
    id: 'DP-003',
    nombre: 'Solicitud de Ubicación sin Contexto',
    descripcion: 'Pide datos de ubicación sin razón clara',
    patron_regex: /\b(comparte tu ubicación|dónde estás|tu posición|acceder a tu gps|permitir ubicación)\b/gi,
    nivel_alerta: 'crítico',
    mensaje_usuario: 'Este mensaje intenta obtener tu ubicación sin una razón clara. ¿Deseas bloquearlo?',
  },
  {
    id: 'DP-004',
    nombre: 'Cebado con Premio',
    descripcion: 'Promete premios para obtener datos',
    patron_regex: /\b(ganaste|eres el ganador|premio de|reclama tu premio|congratulations|has sido seleccionado)\b/gi,
    nivel_alerta: 'crítico',
    mensaje_usuario: 'Este mensaje promete un premio inesperado. Este es un patrón clásico de estafa. Mejor ignorarlo.',
  },
  {
    id: 'DP-005',
    nombre: 'Culpa Emocional',
    descripcion: 'Usa culpa o miedo para manipular decisiones',
    patron_regex: /\b(te abandonamos|tu cuenta será eliminada|perderás todo|es tu culpa|fallaste|decepcionaste)\b/gi,
    nivel_alerta: 'alto',
    mensaje_usuario: 'Este mensaje usa culpa o miedo para manipularte. Tómate un momento antes de reaccionar.',
  },
  {
    id: 'DP-006',
    nombre: 'Recolección de Datos Camuflada',
    descripcion: 'Solicita datos personales disfrazado de utilidad',
    patron_regex: /\b(actualiza tus datos|confirma tu información|verifica tu cuenta|necesitamos tu (?:contraseña|número|dni|tarjeta))\b/gi,
    nivel_alerta: 'crítico',
    mensaje_usuario: 'Este mensaje pide tus datos personales. Aegis nunca te pedirá contraseñas ni números de cuenta. ¿Deseas bloquearlo?',
  },
  {
    id: 'DP-007',
    nombre: 'Autoridad Falsa',
    descripcion: 'Se hace pasar por autoridad para generar obediencia',
    patron_regex: /\b(el gobierno|la policía|el banco central|soporte técnico oficial|notificación legal|orden judicial)\b/gi,
    nivel_alerta: 'alto',
    mensaje_usuario: 'Este mensaje invoca una autoridad oficial. Verifica siempre por canales oficiales antes de actuar.',
  },
];

// ─── Niveles de Integridad Ontológica ────────────────────────
export const INTEGRITY_LEVELS = {
  INTACTA: { min: 0.85, color: '#4ade80', icono: '🛡️', mensaje: 'Integridad Ontológica: Intacta' },
  ATENCIÓN: { min: 0.6, color: '#facc15', icono: '⚠️', mensaje: 'Integridad bajo observación' },
  MODO_SEGURO: { min: 0, color: '#f87171', icono: '🚨', mensaje: 'Modo Seguro Activado' },
};

/**
 * Analiza el texto de un mensaje entrante en busca de dark patterns y manipulación.
 *
 * @param {string} texto – Contenido del mensaje a analizar
 * @param {object} [opciones]
 * @param {string} [opciones.origen] – De dónde viene el mensaje (email, notificación, web)
 * @returns {{ alertas: object[], nivel_maximo: string, seguro: boolean, resumen_usuario: string }}
 */
export function analizarMensaje(texto, opciones = {}) {
  if (!texto || typeof texto !== 'string') {
    return { alertas: [], nivel_maximo: 'ninguno', seguro: true, resumen_usuario: 'Mensaje vacío o inválido.' };
  }

  const alertas = [];

  for (const pattern of DARK_PATTERNS) {
    const matches = texto.match(pattern.patron_regex);
    if (matches) {
      alertas.push({
        patron_id: pattern.id,
        nombre: pattern.nombre,
        descripcion: pattern.descripcion,
        nivel_alerta: pattern.nivel_alerta,
        mensaje_usuario: pattern.mensaje_usuario,
        fragmentos_detectados: [...new Set(matches.map(m => m.toLowerCase()))],
        origen: opciones.origen ?? 'desconocido',
      });
    }
  }

  const nivelMaximo = alertas.reduce((max, a) => {
    const orden = { ninguno: 0, bajo: 1, medio: 2, alto: 3, crítico: 4 };
    return (orden[a.nivel_alerta] ?? 0) > (orden[max] ?? 0) ? a.nivel_alerta : max;
  }, 'ninguno');

  const seguro = nivelMaximo === 'ninguno' || nivelMaximo === 'bajo';

  const resumen = alertas.length === 0
    ? '✅ Mensaje analizado. No detecté patrones de manipulación.'
    : `⚠️ Detecté ${alertas.length} señal(es) de alerta en este mensaje. ${alertas[0].mensaje_usuario}`;

  return { alertas, nivel_maximo: nivelMaximo, seguro, resumen_usuario: resumen };
}

/**
 * Valida una solicitud de datos externos contra el grafo de confianza del usuario.
 *
 * @param {object} solicitud – { origen, recurso_solicitado, tipo }
 * @param {object[]} grafo_confianza – Lista de vínculos de confianza del usuario
 * @returns {{ permitida: boolean, razon: string, mensaje_usuario: string }}
 */
export function validarSolicitudExterna(solicitud, grafo_confianza = []) {
  if (!solicitud?.origen) {
    return {
      permitida: false,
      razon: 'Solicitud sin origen identificado',
      mensaje_usuario: 'Una solicitud anónima intentó acceder a tus recursos. La bloqueé automáticamente.',
    };
  }

  const vinculo = grafo_confianza.find(v =>
    v.nombre?.toLowerCase() === solicitud.origen.toLowerCase() ||
    v.dominio?.toLowerCase() === solicitud.origen.toLowerCase()
  );

  if (!vinculo) {
    return {
      permitida: false,
      razon: 'Entidad no registrada en el grafo de confianza',
      mensaje_usuario: `"${solicitud.origen}" quiere acceder a "${solicitud.recurso_solicitado ?? 'tus datos'}". No está en tus Vínculos de Confianza. ¿Lo autorizas?`,
    };
  }

  if (vinculo.peso_confianza < 0.5) {
    return {
      permitida: false,
      razon: `Confianza insuficiente (${vinculo.peso_confianza}). Se requiere mínimo 0.5`,
      mensaje_usuario: `"${solicitud.origen}" tiene un nivel de confianza bajo. ¿Deseas permitirle acceso a "${solicitud.recurso_solicitado}"?`,
    };
  }

  if (solicitud.tipo === 'biometricos' || solicitud.tipo === 'ubicacion') {
    if (vinculo.peso_confianza < 0.9) {
      return {
        permitida: false,
        razon: 'Datos sensibles requieren confianza ≥ 0.9',
        mensaje_usuario: `"${solicitud.origen}" pide acceso a tus ${solicitud.tipo}. Solo permito esto a entidades de máxima confianza. ¿Confirmas?`,
      };
    }
  }

  return {
    permitida: true,
    razon: `Confianza verificada: ${vinculo.peso_confianza}`,
    mensaje_usuario: `"${solicitud.origen}" tiene acceso autorizado a "${solicitud.recurso_solicitado}".`,
  };
}

/**
 * Calcula el nivel de integridad ontológica actual y devuelve el indicador visual.
 *
 * @param {number} score – Score de integridad entre 0 y 1
 * @returns {{ nivel: string, color: string, icono: string, mensaje: string }}
 */
export function getIntegrityIndicator(score) {
  for (const [nivel, config] of Object.entries(INTEGRITY_LEVELS)) {
    if (score >= config.min) {
      return { nivel, ...config };
    }
  }
  return { nivel: 'MODO_SEGURO', ...INTEGRITY_LEVELS.MODO_SEGURO };
}

/**
 * Verifica el handshake biométrico del usuario.
 * En producción, este método se conecta con el Bridge local.
 *
 * @param {object} datosAportados – { tipo: 'facial'|'voz', hash }
 * @param {object} perfilRegistrado – Perfil del nodo (Persona) en el grafo
 * @returns {{ autenticado: boolean, modo: 'propietario'|'huesped', mensaje: string }}
 */
export function verificarIdentidad(datosAportados, perfilRegistrado) {
  if (!datosAportados || !perfilRegistrado) {
    return {
      autenticado: false,
      modo: 'huesped',
      mensaje: 'No se pudo verificar la identidad. Entrando en Modo Huésped. Tus datos están protegidos.',
    };
  }

  // En producción: comparar hash biométrico con el perfil registrado en el Bridge local
  const coincide = datosAportados.hash === perfilRegistrado.biometric_hash;

  if (!coincide) {
    return {
      autenticado: false,
      modo: 'huesped',
      mensaje: 'No reconocí tu identidad. Continuaré en Modo Huésped para proteger tus datos.',
    };
  }

  return {
    autenticado: true,
    modo: 'propietario',
    mensaje: null, // El agente demuestra que ya "conoce" al usuario en el saludo
  };
}

/**
 * Genera el mensaje de bienvenida personalizado basado en los axiomas del usuario.
 * El agente no dice "Hola": demuestra que ya conoce al usuario.
 *
 * @param {object} perfil – Datos del (Persona) del grafo
 * @param {object[]} axiomas – Axiomas activos
 * @param {object} resumenConocimiento – { total_archivos, conexiones_destacadas }
 * @returns {string} Mensaje de bienvenida ontológica
 */
export function generarBienvenidaOntologica(perfil, axiomas = [], resumenConocimiento = {}) {
  const nombre = perfil?.nombre ?? 'Propietario';
  const axiomaV = axiomas.find(a => a.id === 'AX-V');
  const totalArchivos = resumenConocimiento.total_archivos ?? 0;
  const conexiones = resumenConocimiento.conexiones_destacadas ?? [];

  const conexionDestacada = conexiones[0]
    ? `He encontrado un vínculo fuerte entre "${conexiones[0].origen}" y "${conexiones[0].destino}". Quizás quieras explorarlo.`
    : '';

  return [
    `${nombre}. Tus Principios están intactos.`,
    axiomaV
      ? `El Axioma de ${axiomaV.nombre} sigue vigente: mi identidad persiste aunque el hardware cambie.`
      : '',
    totalArchivos > 0
      ? `He organizado ${totalArchivos} archivos en tu Mapa de Ideas. ${conexionDestacada}`
      : '',
    '¿En qué pantalla de la casa quieres que mantenga mi vigilancia hoy?',
  ]
    .filter(Boolean)
    .join('\n\n');
}
