# Arquitectura de Persistencia y Motor de Aegis ("El Stack Espejo")

Para lograr el objetivo de **democratizar el acceso** a agentes autónomos (PWA sin instalación) sin sacrificar la **potencia extrema** que demandan los Power Users (Escritorio nativo), Aegis utiliza un patrón de diseño conocido como **Arquitectura Hexagonal basado en Adaptadores**.

Esto significa que el "cerebro" del Agente interactúa con interfaces estándar (Ej: `GraphService`, `MemoryService`), y el sistema inyecta el motor adecuado según el entorno donde se esté ejecutando: la web o la versión de escritorio.

## Matriz de Equivalencias (Stack PWA vs Desktop)

| Capa Tecnológica | Aegis PWA (Web / Móvil Automática) | Aegis Desktop (Instalada / Pro) |
| :--- | :--- | :--- |
| **Relacional / Reglas** | `PGLite` (WASM local 100% en el navegador) | `PostgreSQL` (Motor de BD nativo) |
| **Búsqueda Vectorial (RAG)** | `pgvector` (dentro de PGLite) / `Orama` | `pgvector` (nativo) / `Milvus` |
| **Caché / Sesión temporal** | `IndexedDB` (Usando Dexie.js o idb-keyval)| `Redis` (Servicio local) |
| **Motor de Grafos (Ontología)**| **`Cytoscape.js`** (Motor en memoria + Respaldo IDB) | **`Neo4j`** (Motor de grafos enterprise) |
| **Cerebro LLM / Inferencia** | Qwen WebGPU / WebLLM (Inferencia en navegador)| Ollama / vLLM (Manejo de GPU nativa local)|

---

## ¿Por qué Cytoscape.js para la PWA?

Obligar al usuario de a pie a instalar Neo4j o conectarse a un clúster en la nube destruiría la privacidad y la fricción cero de la PWA. 
**Cytoscape.js** resuelve esto mágicamente porque:
1. **Doble Propósito:** Tiene un motor de teoría de grafos completísimo capaz de hacer A*, Búsquedas por vecindario, BFS, DFS (igual que las consultas complejas de Cypher).
2. **Serialización Mágica:** Podemos hacer `cy.json()` al cerrar la app y guardarlo en **IndexedDB**, y recuperar todo el grafo en milisegundos al abrir la PWA.
3. **Cero Fricción:** 100% JavaScript, sin backend.

### Ejemplo conceptual de la Interfaz Adaptable:

```javascript
// GraphService.js
class GraphService {
  constructor(environment) {
    if (environment === 'pwa') {
      this.adapter = new CytoscapeAdapter();
    } else {
      this.adapter = new Neo4jAdapter();
    }
  }

  // El núcleo del agente siempre llama a este mismo método
  async buscarRutaOntologica(nodoA, nodoB) {
    return await this.adapter.findPath(nodoA, nodoB);
  }
}
```

Esta arquitectura garantiza que la aplicación web funcione en modo supervivencia/nómada eternamente sin costo para el desarrollador ni el usuario, pero pueda escalar a un monstruo enterprise con un solo clic si el usuario decide instalar los motores backend en su máquina.
