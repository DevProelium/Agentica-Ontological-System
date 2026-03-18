/**
 * privacyShield.test.js – Tests del Módulo de Blindaje del Usuario
 *
 * Valida la detección de dark patterns, validación de solicitudes externas
 * y el indicador de integridad ontológica.
 */

import {
  analizarMensaje,
  validarSolicitudExterna,
  getIntegrityIndicator,
  verificarIdentidad,
  generarBienvenidaOntologica,
  INTEGRITY_LEVELS,
} from '../packages/frontend/src/core/privacyShield.js';

describe('analizarMensaje – Detección de Dark Patterns', () => {
  test('Detecta urgencia falsa en mensajes', () => {
    const mensaje = '¡Actúa ya! Esta oferta expira en las próximas horas. Solo hoy disponible.';
    const { alertas, seguro } = analizarMensaje(mensaje);
    expect(alertas.length).toBeGreaterThanOrEqual(1);
    expect(seguro).toBe(false);
  });

  test('Detecta solicitud de ubicación sin contexto', () => {
    const mensaje = 'Para continuar, comparte tu ubicación con nosotros.';
    const { alertas, nivel_maximo } = analizarMensaje(mensaje);
    expect(alertas.some(a => a.patron_id === 'DP-003')).toBe(true);
    expect(nivel_maximo).toBe('crítico');
  });

  test('Detecta cebado con premio', () => {
    const mensaje = '¡Felicitaciones! Ganaste un iPhone 15. Reclama tu premio ahora.';
    const { alertas } = analizarMensaje(mensaje);
    expect(alertas.some(a => a.patron_id === 'DP-004')).toBe(true);
  });

  test('Detecta recolección de datos camuflada', () => {
    const mensaje = 'Necesitamos tu contraseña para verificar tu cuenta bancaria.';
    const { alertas, nivel_maximo } = analizarMensaje(mensaje);
    expect(alertas.some(a => a.patron_id === 'DP-006')).toBe(true);
    expect(nivel_maximo).toBe('crítico');
  });

  test('Mensaje limpio devuelve seguro: true', () => {
    const mensaje = 'Hola, ¿cómo estás? Te escribo para coordinar la reunión del martes.';
    const { seguro, alertas } = analizarMensaje(mensaje);
    expect(seguro).toBe(true);
    expect(alertas.length).toBe(0);
  });

  test('El resumen_usuario es legible para no técnicos', () => {
    const mensaje = '¡Actúa ya! Esta oferta solo hoy.';
    const { resumen_usuario } = analizarMensaje(mensaje);
    expect(typeof resumen_usuario).toBe('string');
    expect(resumen_usuario.length).toBeGreaterThan(10);
    // No debe contener jerga técnica
    expect(resumen_usuario).not.toMatch(/regex|array|string|pattern/i);
  });

  test('Mensaje vacío devuelve resultado seguro sin errores', () => {
    expect(() => analizarMensaje('')).not.toThrow();
    const { seguro } = analizarMensaje('');
    expect(seguro).toBe(true);
  });

  test('Incluye fragmentos detectados en la alerta', () => {
    const mensaje = 'Actúa ya, quedan pocos y solo hoy disponible.';
    const { alertas } = analizarMensaje(mensaje);
    const alertaConFragmentos = alertas.find(a => a.fragmentos_detectados?.length > 0);
    expect(alertaConFragmentos).toBeDefined();
  });
});

describe('validarSolicitudExterna – Grafo de Confianza', () => {
  const grafoCConfianza = [
    { nombre: 'google.com', dominio: 'google.com', peso_confianza: 0.95 },
    { nombre: 'banco-confiable.com', dominio: 'banco-confiable.com', peso_confianza: 0.9 },
    { nombre: 'tienda-baja.com', dominio: 'tienda-baja.com', peso_confianza: 0.3 },
  ];

  test('Permite solicitud de entidad de alta confianza', () => {
    const solicitud = { origen: 'google.com', recurso_solicitado: 'perfil' };
    const { permitida } = validarSolicitudExterna(solicitud, grafoCConfianza);
    expect(permitida).toBe(true);
  });

  test('Bloquea solicitud de entidad desconocida', () => {
    const solicitud = { origen: 'desconocido.xyz', recurso_solicitado: 'datos' };
    const { permitida, mensaje_usuario } = validarSolicitudExterna(solicitud, grafoCConfianza);
    expect(permitida).toBe(false);
    expect(mensaje_usuario).toContain('desconocido.xyz');
    expect(mensaje_usuario).toContain('Vínculos de Confianza');
  });

  test('Bloquea solicitud de entidad con confianza baja', () => {
    const solicitud = { origen: 'tienda-baja.com', recurso_solicitado: 'compras' };
    const { permitida } = validarSolicitudExterna(solicitud, grafoCConfianza);
    expect(permitida).toBe(false);
  });

  test('Bloquea solicitud de datos biométricos a entidad con confianza media', () => {
    const grafoParcial = [{ nombre: 'app-media.com', peso_confianza: 0.7 }];
    const solicitud = { origen: 'app-media.com', recurso_solicitado: 'cara', tipo: 'biometricos' };
    const { permitida } = validarSolicitudExterna(solicitud, grafoParcial);
    expect(permitida).toBe(false);
  });

  test('Permite datos biométricos solo a entidad de máxima confianza', () => {
    const solicitud = { origen: 'banco-confiable.com', recurso_solicitado: 'face-id', tipo: 'biometricos' };
    const { permitida } = validarSolicitudExterna(solicitud, grafoCConfianza);
    expect(permitida).toBe(true);
  });

  test('Bloquea solicitud sin origen', () => {
    const { permitida, mensaje_usuario } = validarSolicitudExterna({}, []);
    expect(permitida).toBe(false);
    expect(mensaje_usuario).toContain('anónima');
  });
});

describe('getIntegrityIndicator – Indicador Visual de Integridad', () => {
  test('Score 1.0 devuelve nivel INTACTA', () => {
    const { nivel, color } = getIntegrityIndicator(1.0);
    expect(nivel).toBe('INTACTA');
    expect(color).toBe('#4ade80');
  });

  test('Score 0.7 devuelve nivel ATENCIÓN', () => {
    const { nivel, icono } = getIntegrityIndicator(0.7);
    expect(nivel).toBe('ATENCIÓN');
    expect(icono).toBe('⚠️');
  });

  test('Score 0.3 devuelve nivel MODO_SEGURO', () => {
    const { nivel, color } = getIntegrityIndicator(0.3);
    expect(nivel).toBe('MODO_SEGURO');
    expect(color).toBe('#f87171');
  });

  test('Todos los niveles tienen color, icono y mensaje', () => {
    for (const [, config] of Object.entries(INTEGRITY_LEVELS)) {
      expect(config.color).toBeDefined();
      expect(config.icono).toBeDefined();
      expect(config.mensaje).toBeDefined();
    }
  });
});

describe('verificarIdentidad – Handshake Biométrico', () => {
  const perfilRegistrado = {
    nombre: 'Algedi',
    biometric_hash: 'abc123secure',
  };

  test('Autenticación exitosa con hash correcto', () => {
    const datos = { tipo: 'facial', hash: 'abc123secure' };
    const { autenticado, modo } = verificarIdentidad(datos, perfilRegistrado);
    expect(autenticado).toBe(true);
    expect(modo).toBe('propietario');
  });

  test('Falla con hash incorrecto → Modo Huésped', () => {
    const datos = { tipo: 'facial', hash: 'wrong-hash' };
    const { autenticado, modo, mensaje } = verificarIdentidad(datos, perfilRegistrado);
    expect(autenticado).toBe(false);
    expect(modo).toBe('huesped');
    expect(mensaje).toContain('Modo Huésped');
  });

  test('Sin datos → Modo Huésped automático', () => {
    const { autenticado, modo } = verificarIdentidad(null, null);
    expect(autenticado).toBe(false);
    expect(modo).toBe('huesped');
  });
});

describe('generarBienvenidaOntologica – Primer Encuentro', () => {
  const axiomas = [
    { id: 'AX-V', nombre: 'Crecimiento', titulo: 'La migración es supervivencia' },
  ];

  test('Genera bienvenida que incluye el nombre del usuario', () => {
    const perfil = { nombre: 'Algedi' };
    const mensaje = generarBienvenidaOntologica(perfil, axiomas);
    expect(mensaje).toContain('Algedi');
  });

  test('El agente no dice "Hola" (demuestra conocimiento previo)', () => {
    const perfil = { nombre: 'Algedi' };
    const mensaje = generarBienvenidaOntologica(perfil, axiomas);
    expect(mensaje.toLowerCase()).not.toMatch(/^hola/);
  });

  test('Incluye referencia al Axioma de Crecimiento/Migración', () => {
    const perfil = { nombre: 'Algedi' };
    const mensaje = generarBienvenidaOntologica(perfil, axiomas);
    expect(mensaje).toContain('Crecimiento');
  });

  test('Incluye pregunta sobre presencia en dispositivos Cast', () => {
    const perfil = { nombre: 'Test' };
    const mensaje = generarBienvenidaOntologica(perfil, axiomas);
    expect(mensaje).toContain('pantalla');
  });

  test('Menciona archivos cuando hay conocimiento acumulado', () => {
    const perfil = { nombre: 'Test' };
    const resumen = { total_archivos: 15000 };
    const mensaje = generarBienvenidaOntologica(perfil, axiomas, resumen);
    expect(mensaje).toContain('15000');
  });
});
