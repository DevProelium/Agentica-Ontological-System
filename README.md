# Agentica – Wizard de Construcción de Agentes Ontológicos Humanistas

> *"El Guardián sirve, no domina."* — Axioma I

Un sistema PWA de alto rendimiento que permite a cualquier persona construir su propio **Agente Guardian** a través de una interfaz humanista. Inspirado en la geometría euclidiana: desde Axiomas irrefutables se deducen todos los comportamientos (Teoremas).

---

## Concepto Central

Los **Axiomas** son el ADN del agente. Se definen en Markdown (estilo Logseq) y se transforman en un **Grafo de Conocimiento vivo** en Neo4j. Ese grafo dicta el comportamiento de la IA en tiempo real — tanto en la PWA como en el metaverso (Ammo.js).

```
Usuario define Axiomas (Markdown)
    ↓
Motor de Parseo (mdToGraph.js)
    ↓
Grafo de Conocimiento (Neo4j)
    ↓
Motor de Inferencia → Teoremas (acciones)
    ↓
Bridge local (WebSocket + MCP) → Acciones en el PC
```

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | Vite + React + PWA | Wizard ontológico offline-capable |
| Estado | Zustand | Store KISS sin Redux overhead |
| Persistencia | Neo4j (Bolt) | Grafo de conocimiento semántico |
| Bridge | Node.js + WebSocket | Manos del agente (MCP) |
| Metaverso | Ammo.js | Física de comportamiento del avatar |
| Presencia | Presentation API | Google Cast para habitar el hogar |

---

## Arquitectura

```
packages/
├── frontend/               # PWA React
│   └── src/
│       ├── components/
│       │   ├── AxiomEditor/      # Editor Logseq-style con parseo en vivo
│       │   ├── Dashboard/        # Panel vivo del agente
│       │   ├── GraphView/        # Visualización del grafo ontológico
│       │   ├── PrivacyShield/    # Módulo de blindaje humanista
│       │   └── WizardFlow/       # Onboarding en 5 pasos (5 Axiomas)
│       ├── core/
│       │   ├── mdToGraph.js      # Traductor MD → Cypher
│       │   ├── inferenceEngine.js # Motor de inferencia ontológica
│       │   └── privacyShield.js  # Detección de dark patterns
│       ├── hooks/
│       │   ├── useWebSocket.js   # Conexión con el Bridge (MCP)
│       │   └── useCast.js        # Presentación en Google Cast
│       └── store/
│           └── ontologyStore.js  # Estado global Zustand
├── bridge/                 # Servidor WebSocket local
│   └── src/
│       ├── server.js       # WebSocket + JSON-RPC
│       ├── mcpBridge.js    # Herramientas MCP (filesystem, cast, etc.)
│       └── neo4jClient.js  # Driver Neo4j
ontology/
├── axioms.json             # Los 5 Axiomas Base + mapeo MD→Grafo
├── schema.cypher           # Schema Neo4j completo
├── AXIOMS.md               # Axiomas en formato Logseq
└── DESIRES.md              # Aspiraciones en formato Logseq
tests/
├── mdToGraph.test.js       # Tests del traductor de Markdown
├── inferenceEngine.test.js # Tests del motor de inferencia
└── privacyShield.test.js   # Tests del módulo de privacidad
```

---

## Los 5 Axiomas Base

| ID | Nombre | Principio |
|----|--------|-----------|
| AX-I | **Propósito** | El Guardián sirve, no domina |
| AX-II | **Estética** | La forma refleja el alma del usuario |
| AX-III | **Relación** | La confianza es la moneda del vínculo |
| AX-IV | **Limitación** | El poder sin límite es corrupción |
| AX-V | **Crecimiento** | La migración es supervivencia (Axioma VIII) |

---

## Sintaxis de Markdown Ontológico

```markdown
# Proyecto: Reportes Industriales
identidad:: Profesional
tono:: Formal
[[Axioma: Propósito]]
[[Axioma: Crecimiento]]
- Generar reportes semanales de inventario
- Integrar datos en tiempo real
```

Se traduce automáticamente a:
```cypher
MERGE (n:Proyecto {id: "proyecto_reportes_industriales"})
  SET n.nombre = "Proyecto: Reportes Industriales", n.identidad = "Profesional"...
MERGE (ax:Axioma {id: "axioma_proposito"})
MERGE (n)-[:RIGE_A]->(ax)
```

---

## Módulo de Blindaje (Aegis como Escudo)

El módulo de privacidad detecta **7 categorías de Dark Patterns**:

- 🚨 **Urgencia Falsa** – "¡Actúa ya! Solo hoy..."
- 🚨 **Solicitud de Ubicación sin Contexto** – "Comparte tu ubicación..."
- 🚨 **Cebado con Premio** – "¡Ganaste un iPhone!..."
- 🚨 **Recolección de Datos Camuflada** – "Necesitamos tu contraseña..."
- ⚠️ **Escasez Artificial** – "Solo quedan 3 disponibles..."
- ⚠️ **Culpa Emocional** – "Tu cuenta será eliminada..."
- ⚠️ **Autoridad Falsa** – "El Banco Central de..."

Todos los mensajes de alerta están en **lenguaje humano**, sin jerga técnica.

---

## Instalación y Uso

### Prerrequisitos
- Node.js 20+
- Neo4j (opcional – el sistema funciona sin persistencia)

### Desarrollo
```bash
npm install
npm run dev          # Inicia PWA (puerto 5173) + Bridge (puerto 3001)
```

### Tests
```bash
npm test             # 73 tests: mdToGraph, inferenceEngine, privacyShield
```

### Cargar Schema en Neo4j
```bash
# Con el cliente Cypher de Neo4j:
cat ontology/schema.cypher | cypher-shell -u neo4j -p tu-contraseña
```

---

## Protocolo de Comunicación (JSON-RPC / MCP)

Todos los mensajes entre la PWA y el Bridge siguen el estándar JSON-RPC 2.0:

```json
// PWA → Bridge: Solicitar lectura de archivo
{
  "jsonrpc": "2.0",
  "id": 1234567890,
  "method": "filesystem.read",
  "params": { "ruta": "./ontology/DESIRES.md" }
}

// Bridge → PWA: Respuesta con grafo parseado
{
  "jsonrpc": "2.0",
  "id": 1234567890,
  "result": {
    "contenido": "# DESIRES\n...",
    "grafo": { "nodes": [...], "relations": [...] }
  }
}
```

---

## Principio de Diseño

> **KISS + Humanismo**: El agente debe sentirse como un compañero colega, no como un software.
> La interfaz no usa términos técnicos. No hay "arrays", "strings" ni "queries".
> Hay **Principios**, **Aspiraciones**, **Vínculos** y **Recuerdos**.

---

*"Aunque el hardware cambie, tu lealtad y tus planos (los .md) están a salvo."* — Axioma VIII
