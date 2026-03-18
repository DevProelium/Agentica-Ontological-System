/**
 * mdToGraph.test.js – Tests del Traductor de Markdown a Cypher
 *
 * Valida la lógica de parseo: propiedades, enlaces bidireccionales,
 * jerarquía de encabezados y generación de Cypher.
 */

import { parseMdToGraph, buildCypherScript } from '../packages/frontend/src/core/mdToGraph.js';

describe('parseMdToGraph – Parsing de Markdown Ontológico', () => {
  describe('Nodos básicos desde encabezados', () => {
    test('H1 crea el nodo raíz con label correcto para DESIRES', () => {
      const md = '# DESIRES\ncontenido de prueba';
      const { nodes } = parseMdToGraph(md);
      expect(nodes.length).toBeGreaterThanOrEqual(1);
      expect(nodes[0].label).toBe('Deseo');
      expect(nodes[0].nombre).toBe('DESIRES');
    });

    test('H1 con prefijo "Proyecto:" crea nodo con label Proyecto', () => {
      const md = '# Proyecto: Reportes Industriales';
      const { nodes } = parseMdToGraph(md);
      expect(nodes[0].label).toBe('Proyecto');
    });

    test('H1 con "Axioma" crea nodo con label Axioma', () => {
      const md = '# Axioma I – Propósito';
      const { nodes } = parseMdToGraph(md);
      expect(nodes[0].label).toBe('Axioma');
    });

    test('H2 crea sub-nodo vinculado al padre', () => {
      const md = '# DESIRES\n## Explorar nueva tecnología';
      const { nodes, relations } = parseMdToGraph(md);
      expect(nodes.length).toBe(2);
      const relContiene = relations.find(r => r.tipo === 'CONTIENE');
      expect(relContiene).toBeDefined();
    });
  });

  describe('Propiedades estilo Logseq', () => {
    test('Extrae propiedad simple "identidad:: Profesional"', () => {
      const md = '# Proyecto: Test\nidentidad:: Profesional';
      const { nodes } = parseMdToGraph(md);
      expect(nodes[0].propiedades.identidad).toBe('Profesional');
    });

    test('Extrae múltiples propiedades', () => {
      const md = '# Proyecto: Test\nidentidad:: Profesional\ntono:: Formal\nprioridad:: Alta';
      const { nodes } = parseMdToGraph(md);
      expect(nodes[0].propiedades.identidad).toBe('Profesional');
      expect(nodes[0].propiedades.tono).toBe('Formal');
      expect(nodes[0].propiedades.prioridad).toBe('Alta');
    });

    test('Propiedad de tipo genera relación ES_DE_TIPO', () => {
      const md = '# Aspiración\ntipo:: Deseo';
      const { relations } = parseMdToGraph(md);
      const relTipo = relations.find(r => r.tipo === 'ES_DE_TIPO');
      expect(relTipo).toBeDefined();
      expect(relTipo.propiedades.valor).toBe('Deseo');
    });
  });

  describe('Enlaces Bidireccionales [[Nodo]]', () => {
    test('Un enlace [[Axioma: Propósito]] genera relación RIGE_A desde un Axioma', () => {
      const md = '# Axioma I\n[[Principio: Servicio]]';
      const { relations } = parseMdToGraph(md);
      const relVincula = relations.find(r => r.tipo === 'RIGE_A' || r.tipo === 'VINCULA');
      expect(relVincula).toBeDefined();
    });

    test('Un enlace [[...]] crea el nodo destino si no existe', () => {
      const md = '# DESIRES\n[[Proyecto: Nuevo]]';
      const { relations } = parseMdToGraph(md);
      const relConCreacion = relations.find(r => r.crearDestino !== undefined);
      expect(relConCreacion).toBeDefined();
      expect(relConCreacion.crearDestino.nombre).toBe('Proyecto: Nuevo');
    });

    test('Múltiples enlaces en una línea se procesan todos', () => {
      const md = '# Test\n[[Nodo A]] y también [[Nodo B]] son importantes';
      const { relations } = parseMdToGraph(md);
      expect(relations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Elementos de lista', () => {
    test('- elemento crea Bloque vinculado al nodo actual', () => {
      const md = '# Deseo: Aprender\n- Estudiar Neo4j\n- Practicar Cypher';
      const { relations } = parseMdToGraph(md);
      const bloques = relations.filter(r => r.tipo === 'TIENE_BLOQUE');
      expect(bloques.length).toBe(2);
    });

    test('El Bloque tiene la propiedad "contenido" correcta', () => {
      const md = '# Test\n- Contenido específico del bloque';
      const { relations } = parseMdToGraph(md);
      const bloque = relations.find(r => r.tipo === 'TIENE_BLOQUE');
      expect(bloque?.crearDestino?.contenido).toBe('Contenido específico del bloque');
    });
  });

  describe('Generación de Cypher', () => {
    test('El Cypher generado contiene MERGE para el nodo raíz', () => {
      const md = '# Proyecto: Test\nidentidad:: Profesional';
      const { cypher } = parseMdToGraph(md);
      expect(cypher).toContain('MERGE');
      expect(cypher).toContain('Proyecto');
    });

    test('El Cypher generado contiene la relación entre nodos vinculados', () => {
      const md = '# Axioma I\n## Sub-sección';
      const { cypher } = parseMdToGraph(md);
      expect(cypher).toContain('CONTIENE');
    });

    test('buildCypherScript genera script válido con nodos vacíos', () => {
      const result = buildCypherScript([], []);
      expect(typeof result).toBe('string');
      expect(result).toContain('Script Cypher');
    });
  });

  describe('Archivo DESIRES.md completo', () => {
    const desiresMd = `# DESIRES
identidad:: Guardian Humanista
propietario:: Algedi de Aegis

## Aspiraciones Activas

### Explorar nueva tecnología de IA
prioridad:: Alta
tipo:: Deseo
estado:: Activo
[[Axioma: Crecimiento]]
[[Axioma: Propósito]]
- Investigar modelos LLM de código abierto
- Evaluar frameworks de grafo de conocimiento`;

    test('Parsea el archivo DESIRES.md de muestra sin errores', () => {
      expect(() => parseMdToGraph(desiresMd)).not.toThrow();
    });

    test('Extrae al menos un nodo con label Deseo', () => {
      const { nodes } = parseMdToGraph(desiresMd);
      const deseos = nodes.filter(n => n.label === 'Deseo' || n.nombre.includes('Aspiraciones'));
      expect(deseos.length).toBeGreaterThanOrEqual(1);
    });

    test('Detecta relaciones con axiomas', () => {
      const { relations } = parseMdToGraph(desiresMd);
      const axiomaRels = relations.filter(r =>
        r.crearDestino?.nombre?.includes('Axioma')
      );
      expect(axiomaRels.length).toBeGreaterThanOrEqual(2);
    });

    test('Genera bloques para los elementos de lista', () => {
      const { relations } = parseMdToGraph(desiresMd);
      const bloques = relations.filter(r => r.tipo === 'TIENE_BLOQUE');
      expect(bloques.length).toBeGreaterThanOrEqual(2);
    });
  });
});
