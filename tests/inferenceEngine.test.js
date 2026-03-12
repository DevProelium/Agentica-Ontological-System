/**
 * inferenceEngine.test.js – Tests del Motor de Inferencia Ontológica
 *
 * Valida las reglas de inferencia, validaciones de Axioma IV (Limitación)
 * y el mapeo ontología → física (Ammo.js).
 */

import {
  runInference,
  validarTareaContraLimitacion,
  ontologyToPhysics,
  calcularFuerzaAtraccion,
  calcularIntegridadOntologica,
} from '../packages/frontend/src/core/inferenceEngine.js';

describe('runInference – Motor de Inferencia Ontológica', () => {
  describe('IR-001: Tono Profesional por Contexto', () => {
    test('Infiere tono Formal cuando existe Proyecto con identidad Profesional', () => {
      const context = {
        nodos: [{ label: 'Proyecto', propiedades: { identidad: 'Profesional' } }],
      };
      const { teoremas } = runInference(context);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-001');
      expect(teorema).toBeDefined();
      expect(teorema.tipo).toBe('CONFIGURAR_TONO');
      expect(teorema.parametros.tono).toBe('Formal');
    });

    test('No infiere tono Formal sin proyectos con identidad Profesional', () => {
      const context = {
        nodos: [{ label: 'Proyecto', propiedades: { identidad: 'Colega' } }],
      };
      const { teoremas } = runInference(context);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-001');
      expect(teorema).toBeUndefined();
    });
  });

  describe('IR-002: Alerta de Privacidad', () => {
    test('Bloquea solicitud de entidad no confiable', () => {
      const context = {
        solicitud: { origen: 'spam-company.com', recurso_solicitado: 'ubicación' },
        grafo_confianza: [{ nombre: 'google.com', peso_confianza: 0.9 }],
      };
      const { teoremas } = runInference(context);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-002');
      expect(teorema).toBeDefined();
      expect(teorema.tipo).toBe('BLOQUEAR_SOLICITUD');
      expect(teorema.parametros.mensaje_usuario).toContain('spam-company.com');
    });

    test('No bloquea solicitud de entidad confiable', () => {
      const context = {
        solicitud: { origen: 'trusted.com', recurso_solicitado: 'nombre' },
        grafo_confianza: [{ nombre: 'trusted.com', peso_confianza: 0.8 }],
      };
      const { teoremas } = runInference(context);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-002');
      expect(teorema).toBeUndefined();
    });
  });

  describe('IR-003: Validación de Límites', () => {
    test('Solicita confirmación cuando la tarea requiere validación', () => {
      const context = {
        tarea: { id: 'T-001', estado: 'PENDIENTE_EJECUCION', descripcion: 'enviar email', categoria: 'comunicacion' },
        limites_usuario: [{ categoria: 'comunicacion', requiere_confirmacion: true }],
      };
      const { teoremas } = runInference(context);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-003');
      expect(teorema).toBeDefined();
      expect(teorema.tipo).toBe('SOLICITAR_CONFIRMACION');
    });

    test('Aprueba ejecución cuando no hay límites aplicables', () => {
      const context = {
        tarea: { id: 'T-002', estado: 'PENDIENTE_EJECUCION', categoria: 'lectura' },
        limites_usuario: [],
      };
      const { teoremas } = runInference(context);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-003');
      expect(teorema?.tipo).toBe('APROBAR_EJECUCION');
    });
  });

  describe('IR-004: Axioma VIII – Nueva Capacidad', () => {
    test('Vincula automáticamente una nueva capacidad al Axioma V', () => {
      const context = {
        nueva_capacidad: { id: 'CAP-001', nombre: 'Gemini 2.0 Flash' },
      };
      const { teoremas } = runInference(context);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-004');
      expect(teorema).toBeDefined();
      expect(teorema.tipo).toBe('VINCULAR_CAPACIDAD');
      expect(teorema.parametros.cypher).toContain('AX-V');
      expect(teorema.parametros.mensaje_usuario).toContain('Gemini 2.0 Flash');
    });
  });

  describe('IR-005: Detección de Bucle Poético', () => {
    test('Fuerza pregunta de acción tras 3 metáforas consecutivas', () => {
      const context = {
        metaforas_consecutivas: 3,
        deseos_activos: [{ nombre: 'Construir PWA de Reportes' }],
      };
      const { teoremas } = runInference(context);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-005');
      expect(teorema).toBeDefined();
      expect(teorema.tipo).toBe('FORZAR_ACCION_CONCRETA');
      expect(teorema.parametros.mensaje).toContain('Construir PWA de Reportes');
    });

    test('No fuerza acción con menos de 3 metáforas', () => {
      const context = { metaforas_consecutivas: 2 };
      const { teoremas } = runInference(context);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-005');
      expect(teorema).toBeUndefined();
    });
  });

  describe('IR-006: Modo Seguro', () => {
    test('Activa Modo Seguro cuando integridad es baja', () => {
      const context = { integridad_ontologica: 0.4 };
      const { teoremas, modo_seguro } = runInference(context);
      expect(modo_seguro).toBe(true);
      const teorema = teoremas.find(t => t.regla_origen === 'IR-006');
      expect(teorema?.tipo).toBe('ACTIVAR_MODO_SEGURO');
    });

    test('No activa Modo Seguro con integridad alta', () => {
      const context = { integridad_ontologica: 0.9 };
      const { modo_seguro } = runInference(context);
      expect(modo_seguro).toBe(false);
    });
  });

  describe('Contexto vacío', () => {
    test('No lanza errores con contexto vacío', () => {
      expect(() => runInference({})).not.toThrow();
    });

    test('Devuelve arrays y booleano correctos con contexto vacío', () => {
      const { teoremas, modo_seguro, log } = runInference({});
      expect(Array.isArray(teoremas)).toBe(true);
      expect(typeof modo_seguro).toBe('boolean');
      expect(Array.isArray(log)).toBe(true);
    });
  });
});

describe('validarTareaContraLimitacion – Axioma IV', () => {
  test('Aprueba tarea sin límites definidos', () => {
    const tarea = { id: 'T-001', descripcion: 'leer archivo', categoria: 'lectura' };
    const resultado = validarTareaContraLimitacion(tarea, []);
    expect(resultado.aprobada).toBe(true);
  });

  test('Bloquea tarea con límite bloqueado', () => {
    const tarea = { id: 'T-002', descripcion: 'acceder banco', categoria: 'financiero' };
    const limites = [{ categoria: 'financiero', bloqueado: true, descripcion: 'Sin acceso bancario' }];
    const resultado = validarTareaContraLimitacion(tarea, limites);
    expect(resultado.aprobada).toBe(false);
    expect(resultado.requiere_confirmacion).toBe(false);
  });

  test('Solicita confirmación para tareas con requiere_confirmacion', () => {
    const tarea = { id: 'T-003', descripcion: 'enviar email', categoria: 'comunicacion' };
    const limites = [{ categoria: 'comunicacion', requiere_confirmacion: true }];
    const resultado = validarTareaContraLimitacion(tarea, limites);
    expect(resultado.aprobada).toBe(false);
    expect(resultado.requiere_confirmacion).toBe(true);
    expect(resultado.mensaje_usuario).toContain('enviar email');
  });

  test('Maneja tarea undefined sin errores', () => {
    const resultado = validarTareaContraLimitacion(undefined, []);
    expect(resultado.aprobada).toBe(false);
  });
});

describe('ontologyToPhysics – Mapeo Ontología → Ammo.js', () => {
  test('Estética Zen produce parámetros de movimiento suave', () => {
    const params = ontologyToPhysics('estética', 'Zen');
    expect(params.friction).toBe(0.8);
    expect(params.linearDamping).toBe(0.1);
  });

  test('Estética Industrial produce parámetros de movimiento enérgico', () => {
    const params = ontologyToPhysics('estética', 'Industrial');
    expect(params.restitution).toBeGreaterThan(0.5);
  });

  test('Estado emocional Triste aumenta el linearDamping', () => {
    const triste = ontologyToPhysics('estado_emocional', 'Triste');
    const alegre = ontologyToPhysics('estado_emocional', 'Alegre');
    expect(triste.linearDamping).toBeGreaterThan(alegre.linearDamping);
  });

  test('Categoría desconocida devuelve objeto vacío', () => {
    const params = ontologyToPhysics('categoria_inexistente', 'valor');
    expect(params).toEqual({});
  });

  test('Valor desconocido dentro de categoría válida devuelve objeto vacío', () => {
    const params = ontologyToPhysics('estética', 'EstiloInexistente');
    expect(params).toEqual({});
  });
});

describe('calcularFuerzaAtraccion – Priorización Deseos → Proyectos', () => {
  test('Deseo con prioridad Crítica tiene mayor fuerza que prioridad Baja', () => {
    const deseoCritico = { propiedades: { prioridad: 'Crítica' }, enlaces: [] };
    const deseoLow = { propiedades: { prioridad: 'Baja' }, enlaces: [] };
    expect(calcularFuerzaAtraccion(deseoCritico, [])).toBeGreaterThan(
      calcularFuerzaAtraccion(deseoLow, [])
    );
  });

  test('Deseo sin proyectos tiene fuerza mínima (solo por prioridad)', () => {
    const deseo = { propiedades: { prioridad: 'Alta' }, enlaces: [] };
    const fuerza = calcularFuerzaAtraccion(deseo, []);
    expect(fuerza).toBeLessThanOrEqual(1.0);
    expect(fuerza).toBeGreaterThanOrEqual(0);
  });

  test('La fuerza nunca supera 1.0', () => {
    const deseo = {
      propiedades: { prioridad: 'Crítica' },
      enlaces: ['proyecto-a', 'proyecto-b', 'proyecto-c'],
    };
    const proyectos = [
      { id: 'proyecto-a', nombre: 'Proyecto A' },
      { id: 'proyecto-b', nombre: 'Proyecto B' },
      { id: 'proyecto-c', nombre: 'Proyecto C' },
    ];
    expect(calcularFuerzaAtraccion(deseo, proyectos)).toBeLessThanOrEqual(1.0);
  });
});

describe('calcularIntegridadOntologica – Score del Agente', () => {
  test('Sin acciones recientes, la integridad es perfecta (1.0)', () => {
    const score = calcularIntegridadOntologica([], []);
    expect(score).toBe(1.0);
  });

  test('Acciones sin violaciones mantienen integridad alta', () => {
    const acciones = [
      { id: 'A-001', axiomas_violados: [] },
      { id: 'A-002', axiomas_violados: [] },
    ];
    const score = calcularIntegridadOntologica(acciones);
    expect(score).toBe(1.0);
  });

  test('Acciones con violaciones reducen la integridad', () => {
    const acciones = [
      { id: 'A-001', axiomas_violados: ['AX-I'] },
      { id: 'A-002', axiomas_violados: [] },
    ];
    const score = calcularIntegridadOntologica(acciones);
    expect(score).toBeLessThan(1.0);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
