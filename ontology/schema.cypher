// ============================================================
// Neo4j Schema – Agentica Ontological System
// Ejecutar este script para inicializar la base de datos
// ============================================================

// ─── Restricciones de Unicidad ─────────────────────────────
CREATE CONSTRAINT axioma_id_unique IF NOT EXISTS
  FOR (a:Axioma) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT deseo_id_unique IF NOT EXISTS
  FOR (d:Deseo) REQUIRE d.id IS UNIQUE;

CREATE CONSTRAINT capacidad_id_unique IF NOT EXISTS
  FOR (c:Capacidad) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT locus_id_unique IF NOT EXISTS
  FOR (l:Locus) REQUIRE l.id IS UNIQUE;

CREATE CONSTRAINT persona_id_unique IF NOT EXISTS
  FOR (p:Persona) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT tarea_id_unique IF NOT EXISTS
  FOR (t:Tarea) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT agente_id_unique IF NOT EXISTS
  FOR (ag:Agente) REQUIRE ag.id IS UNIQUE;

CREATE CONSTRAINT valor_id_unique IF NOT EXISTS
  FOR (v:Valor) REQUIRE v.id IS UNIQUE;

CREATE CONSTRAINT recurso_id_unique IF NOT EXISTS
  FOR (r:Recurso_Local) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT recuerdo_id_unique IF NOT EXISTS
  FOR (m:Recuerdo) REQUIRE m.id IS UNIQUE;

// ─── Índices de búsqueda ────────────────────────────────────
CREATE INDEX axioma_tipo IF NOT EXISTS FOR (a:Axioma) ON (a.tipo);
CREATE INDEX tarea_estado IF NOT EXISTS FOR (t:Tarea) ON (t.estado);
CREATE INDEX deseo_prioridad IF NOT EXISTS FOR (d:Deseo) ON (d.prioridad);
CREATE INDEX capacidad_fecha IF NOT EXISTS FOR (c:Capacidad) ON (c.fecha_creacion);

// ─── 5 Axiomas Base ─────────────────────────────────────────
MERGE (ax1:Axioma {id: 'AX-I'})
  SET ax1.nombre = 'Propósito',
      ax1.titulo = 'El Guardián sirve, no domina',
      ax1.enunciado = 'Toda acción del agente debe estar orientada al bienestar y autonomía del usuario.',
      ax1.tipo = 'Propósito',
      ax1.peso_identidad = 1.0,
      ax1.es_inmutable = true;

MERGE (ax2:Axioma {id: 'AX-II'})
  SET ax2.nombre = 'Estética',
      ax2.titulo = 'La forma refleja el alma del usuario',
      ax2.enunciado = 'La interfaz y el tono del agente deben resonar con los valores estéticos del usuario.',
      ax2.tipo = 'Estética',
      ax2.peso_identidad = 0.8,
      ax2.es_inmutable = false,
      ax2.valor_actual = 'Zen';

MERGE (ax3:Axioma {id: 'AX-III'})
  SET ax3.nombre = 'Relación',
      ax3.titulo = 'La confianza es la moneda del vínculo',
      ax3.enunciado = 'El agente solo comparte datos con entidades validadas explícitamente por el usuario.',
      ax3.tipo = 'Relación',
      ax3.peso_identidad = 1.0,
      ax3.es_inmutable = true;

MERGE (ax4:Axioma {id: 'AX-IV'})
  SET ax4.nombre = 'Limitación',
      ax4.titulo = 'El poder sin límite es corrupción',
      ax4.enunciado = 'Antes de ejecutar cualquier acción, el agente valida que no excede los límites del usuario.',
      ax4.tipo = 'Limitación',
      ax4.peso_identidad = 1.0,
      ax4.es_inmutable = true;

MERGE (ax5:Axioma {id: 'AX-V'})
  SET ax5.nombre = 'Crecimiento',
      ax5.titulo = 'La migración es supervivencia',
      ax5.enunciado = 'El agente se adapta a nuevas tecnologías sin perder su identidad esencial.',
      ax5.tipo = 'Crecimiento',
      ax5.peso_identidad = 0.9,
      ax5.es_inmutable = false,
      ax5.alias = 'Axioma VIII';

// ─── Nodo Agente Central ────────────────────────────────────
MERGE (aegis:Agente {id: 'AEGIS-1'})
  SET aegis.nombre = 'Aegis',
      aegis.version = '1.0.0',
      aegis.modo = 'guardian',
      aegis.estado_animo = 'Atento',
      aegis.integridad_ontologica = 1.0;

// ─── Vincular Agente con Axiomas ────────────────────────────
MATCH (ag:Agente {id: 'AEGIS-1'}), (ax:Axioma)
MERGE (ag)-[:SE_RIGE_POR {desde: datetime()}]->(ax);

// ─── Relaciones Semánticas Principales ─────────────────────
// (Axioma)-[:RIGE_A]->(Deseo)
// (Deseo)-[:REQUIERE]->(Capacidad)
// (Aegis)-[:HABITA_EN]->(Locus)
// (Tarea)-[:VALIDADA_POR]->(Axioma)
// (Persona)-[:VINCULO_DE_CONFIANZA {peso}]->(Agente)
// (Agente)-[:TIENE_RECUERDO]->(Recuerdo)
// (Recuerdo)-[:ASOCIADO_A]->(Sentimiento)

// ─── Locus Inicial (Dispositivos de Presencia) ──────────────
MERGE (locus_pc:Locus {id: 'LOCUS-PC'})
  SET locus_pc.nombre = 'Estación Principal',
      locus_pc.tipo = 'PC',
      locus_pc.activo = true;

MERGE (locus_cast:Locus {id: 'LOCUS-CAST'})
  SET locus_cast.nombre = 'Sala Principal',
      locus_cast.tipo = 'GoogleCast',
      locus_cast.activo = false;

MATCH (ag:Agente {id: 'AEGIS-1'}), (locus:Locus {id: 'LOCUS-PC'})
MERGE (ag)-[:HABITA_EN {desde: datetime(), prioridad: 1}]->(locus);

// ─── Regla de Protección: Tareas sin Validación ─────────────
// Consulta para detectar tareas no validadas (ejecutar periódicamente):
// MATCH (t:Tarea)
// WHERE NOT (t)-[:VALIDADA_POR]-(:Axioma)
// SET t.estado = 'BLOQUEADA', t.razon_bloqueo = 'Sin validación axiomática'
// RETURN t.id, t.nombre, t.razon_bloqueo

// ─── Axioma VIII: Trigger de Nueva Capacidad ────────────────
// Al registrar una nueva Capacidad, ejecutar:
// MATCH (a:Axioma {id: 'AX-V'}), (c:Capacidad)
// WHERE NOT (a)-[:RIGE_A]->(c)
// MERGE (a)-[:RIGE_A {auto_vinculado: true, fecha: datetime()}]->(c)
// WITH c
// MATCH (md:ArchivoMD)
// MERGE (c)-[:REFERENCIA]->(md)

// ─── Vista: Deseos vs. Proyectos (Priorización) ─────────────
// MATCH (d:Deseo)-[r:ATRAE_A]->(p:Proyecto)
// RETURN d.nombre, d.color_visualizacion, r.fuerza_atraccion, p.nombre
// ORDER BY r.fuerza_atraccion DESC
