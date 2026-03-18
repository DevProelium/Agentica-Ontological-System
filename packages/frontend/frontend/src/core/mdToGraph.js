/**
 * mdToGraph.js – Traductor de Markdown (estilo Logseq) a Cypher (Neo4j)
 *
 * Convierte bloques de Markdown con sintaxis de propiedades (propiedad:: valor)
 * y enlaces bidireccionales ([[Nodo]]) en queries Cypher para Neo4j.
 *
 * Principio KISS: Una función principal, salidas predecibles, sin magia oculta.
 */

// ─── Mapeo de títulos de sección a labels de Neo4j ──────────
const SECTION_LABEL_MAP = {
  desires: 'Deseo',
  aspiraciones: 'Deseo',
  axioma: 'Axioma',
  axioms: 'Axioma',
  proyecto: 'Proyecto',
  project: 'Proyecto',
  capacidad: 'Capacidad',
  locus: 'Locus',
  persona: 'Persona',
  tarea: 'Tarea',
  recuerdo: 'Recuerdo',
  sentimiento: 'Sentimiento',
  vinculo: 'Vinculo_Confianza',
};

// ─── Patrones de reconocimiento ─────────────────────────────
const PATTERNS = {
  /** Encabezado principal: # Título */
  h1: /^#\s+(.+)$/,
  /** Encabezado secundario: ## Sub-sección */
  h2: /^##\s+(.+)$/,
  /** Encabezado terciario: ### Elemento */
  h3: /^###\s+(.+)$/,
  /** Propiedad estilo Logseq: clave:: valor */
  property: /^([\w_\s]+)::\s*(.+)$/,
  /** Enlace bidireccional: [[Nodo]] o [[Categoría: Nombre]] */
  wikiLink: /\[\[([^\]]+)\]\]/g,
  /** Elemento de lista: - contenido */
  listItem: /^-\s+(.+)$/,
};

/**
 * inferLabel – Infiere el label de Neo4j a partir del texto del encabezado.
 * @param {string} heading – Texto del encabezado
 * @returns {string} Label de Neo4j
 */
function inferLabel(heading) {
  const normalized = heading.toLowerCase();
  // Primero buscar match exacto con prefijo "Categoría: Nombre"
  const colonPart = normalized.split(':')[0].trim();
  if (SECTION_LABEL_MAP[colonPart]) return SECTION_LABEL_MAP[colonPart];

  // Luego buscar si el encabezado empieza con alguna clave conocida
  for (const [key, label] of Object.entries(SECTION_LABEL_MAP)) {
    if (normalized.startsWith(key)) return label;
  }
  return 'Nodo';
}

/**
 * Genera un ID seguro a partir de un texto (snake_case).
 * @param {string} text
 * @returns {string}
 */
function toNodeId(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .slice(0, 64);
}

/**
 * Extrae todos los enlaces [[...]] de un texto.
 * @param {string} text
 * @returns {string[]} Lista de nombres de nodos enlazados
 */
function extractWikiLinks(text) {
  const links = [];
  let match;
  const regex = new RegExp(PATTERNS.wikiLink.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

/**
 * Parsea un bloque de Markdown y extrae las entidades y relaciones.
 *
 * @param {string} markdown – Contenido del archivo Markdown
 * @returns {{ nodes: object[], relations: object[], cypher: string }}
 */
export function parseMdToGraph(markdown) {
  const lines = markdown.split('\n');
  const nodes = [];
  const relations = [];

  let currentNode = null;
  let parentNode = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith('//')) continue;

    // ── Encabezado H1: crea el nodo raíz del archivo ──────
    const h1Match = line.match(PATTERNS.h1);
    if (h1Match) {
      const title = h1Match[1].trim();
      const label = inferLabel(title);
      currentNode = {
        id: toNodeId(title),
        label,
        nombre: title,
        propiedades: {},
        enlaces: [],
        bloques: [],
      };
      parentNode = null;
      nodes.push(currentNode);
      continue;
    }

    // ── Encabezado H2: crea sub-nodo y vincula al padre ───
    const h2Match = line.match(PATTERNS.h2);
    if (h2Match && currentNode) {
      const title = h2Match[1].trim();
      const label = inferLabel(title);
      const subNode = {
        id: toNodeId(title),
        label,
        nombre: title,
        propiedades: {},
        enlaces: [],
        bloques: [],
      };
      nodes.push(subNode);
      relations.push({
        desde: currentNode.id,
        hasta: subNode.id,
        tipo: 'CONTIENE',
        propiedades: {},
      });
      parentNode = currentNode;
      currentNode = subNode;
      continue;
    }

    // ── Encabezado H3: crea sub-sub-nodo ─────────────────
    const h3Match = line.match(PATTERNS.h3);
    if (h3Match && currentNode) {
      const title = h3Match[1].trim();
      const subLabel = inferLabel(title);
      const subNode = {
        id: toNodeId(title),
        label: subLabel,
        nombre: title,
        propiedades: {},
        enlaces: [],
        bloques: [],
      };
      nodes.push(subNode);
      relations.push({
        desde: currentNode.id,
        hasta: subNode.id,
        tipo: 'CONTIENE',
        propiedades: {},
      });
      const savedParent = currentNode;
      currentNode = subNode;
      // Registrar el nodo anterior como padre para posibles restauraciones
      subNode._parentId = savedParent.id;
      continue;
    }

    // ── Propiedad Logseq: clave:: valor ───────────────────
    const propMatch = line.match(PATTERNS.property);
    if (propMatch && currentNode) {
      const key = propMatch[1].trim().replace(/\s+/g, '_').toLowerCase();
      const value = propMatch[2].trim();
      currentNode.propiedades[key] = value;

      // Tipos especiales de propiedades que generan relaciones
      if (key === 'tipo') {
        relations.push({
          desde: currentNode.id,
          hasta: toNodeId(`Tipo_${value}`),
          tipo: 'ES_DE_TIPO',
          propiedades: { valor: value },
          crearDestino: { label: 'TipoNodo', nombre: `Tipo_${value}` },
        });
      }
      continue;
    }

    // ── Enlace bidireccional: [[Nodo]] ────────────────────
    const links = extractWikiLinks(line);
    if (links.length > 0 && currentNode) {
      for (const link of links) {
        const linkId = toNodeId(link);
        const targetLabel = inferLabel(link);
        currentNode.enlaces.push(linkId);

        // El tipo de relación depende del label del nodo origen
        let relType = 'VINCULA';
        if (currentNode.label === 'Axioma') relType = 'RIGE_A';
        if (currentNode.label === 'Deseo') relType = 'REQUIERE';
        if (currentNode.label === 'Tarea') relType = 'VALIDADA_POR';

        relations.push({
          desde: currentNode.id,
          hasta: linkId,
          tipo: relType,
          propiedades: { fuerza: 1.0 },
          crearDestino: { label: targetLabel, nombre: link },
        });
      }
      continue;
    }

    // ── Elemento de lista: - contenido ───────────────────
    const listMatch = line.match(PATTERNS.listItem);
    if (listMatch && currentNode) {
      const contenido = listMatch[1].trim();
      const bloqueId = toNodeId(`bloque_${currentNode.id}_${currentNode.bloques.length}`);
      currentNode.bloques.push({ id: bloqueId, contenido });
      relations.push({
        desde: currentNode.id,
        hasta: bloqueId,
        tipo: 'TIENE_BLOQUE',
        propiedades: { orden: currentNode.bloques.length - 1 },
        crearDestino: { label: 'Bloque', contenido },
      });
    }
  }

  return {
    nodes,
    relations,
    cypher: buildCypherScript(nodes, relations),
  };
}

/**
 * Construye el script Cypher completo a partir de nodos y relaciones.
 * @param {object[]} nodes
 * @param {object[]} relations
 * @returns {string}
 */
export function buildCypherScript(nodes, relations) {
  const lines = ['// Script Cypher generado automáticamente por mdToGraph.js', '// Sistema: Agentica Ontological System', ''];

  // MERGE de todos los nodos
  for (const node of nodes) {
    const propsStr = buildPropsString({ nombre: node.nombre, ...node.propiedades });
    if (node.label === 'Bloque') continue; // Los bloques se crean inline
    lines.push(`MERGE (${sanitizeVar(node.id)}:${node.label} {id: ${quote(node.id)}})`);
    lines.push(`  SET ${sanitizeVar(node.id)}.nombre = ${quote(node.nombre)}${propsStr ? ', ' + propsStr : ''};`);
    lines.push('');
  }

  // MERGE de relaciones y nodos destino implícitos
  const processedDestinations = new Set();
  for (const rel of relations) {
    if (rel.crearDestino && !processedDestinations.has(rel.hasta)) {
      processedDestinations.add(rel.hasta);
      const dest = rel.crearDestino;
      if (dest.label === 'Bloque') {
        lines.push(`MERGE (${sanitizeVar(rel.hasta)}:Bloque {id: ${quote(rel.hasta)}})`);
        lines.push(`  SET ${sanitizeVar(rel.hasta)}.contenido = ${quote(dest.contenido || dest.nombre)};`);
        lines.push('');
      } else {
        lines.push(`MERGE (${sanitizeVar(rel.hasta)}:${dest.label} {id: ${quote(rel.hasta)}})`);
        lines.push(`  SET ${sanitizeVar(rel.hasta)}.nombre = ${quote(dest.nombre)};`);
        lines.push('');
      }
    }

    const relProps = Object.keys(rel.propiedades).length > 0
      ? ' ' + JSON.stringify(rel.propiedades)
      : '';
    lines.push(`MATCH (src {id: ${quote(rel.desde)}}), (dst {id: ${quote(rel.hasta)}})`);
    lines.push(`MERGE (src)-[:${rel.tipo}${relProps}]->(dst);`);
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Helpers internos ────────────────────────────────────────

function sanitizeVar(id) {
  return 'n_' + id.replace(/[^a-z0-9]/gi, '_').slice(0, 30);
}

function quote(str) {
  // Escape backslashes first, then double quotes, to produce valid Cypher string literals
  return `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildPropsString(props) {
  return Object.entries(props)
    .filter(([k]) => k !== 'nombre')
    .map(([k, v]) => `n.${k} = ${quote(v)}`)
    .join(', ');
}
