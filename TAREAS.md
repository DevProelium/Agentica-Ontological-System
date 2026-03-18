# 🗺️ Roadmap de Evolución: De PWA a IA Autónoma (Aegis)

Este documento sirve como faro orientador para transformar la PWA "Aegis" en un agente autónomo capaz de igualar las capacidades operativas de OpenClaw, manteniendo una interfaz minimalista ("Calm Technology").

## Fase 1: Cimientos y Estética (Completado) 🟢
- [x] Diseñar UI/UX Minimalista Orgánico (The Artisan's Desk).
- [x] Adaptar paleta de colores y componentes (eliminación de bordes duros, fuentes serif/sans-serif).
- [x] Configurar Docker Compose KISS (Node.js App + Neo4j).
- [x] Escalar arquitectura Docker para incluir la suite cognitiva (Postgres/pgvector, Redis, MinIO) evitando colisiones de puertos.

## Fase 2: Conexión Neuronal (El Puente de Datos) (Completado) 🟢
- [x] Instalar dependencias en el Bridge (PostgreSQL, Redis, MinIO, Ollama SDK).
- [x] Crear el módulo de conexión en Node.js que hable con Neo4j, Postgres, Redis y MinIO al iniciar el servidor.
- [x] Configurar variables de entorno (.env) dinámicas en el Bridge.

## Fase 3: La Memoria Cuántica (Vectorización) (Completado) 🟢
- [x] Crear un "Ingestion Pipeline": un script que lea la carpeta /logseq_knowledge mapeada en Docker.
- [x] Usar Ollama (local) para convertir los archivos .md en vectores (Embeddings).
- [x] Guardar los vectores en PostgreSQL (pgvector) vinculados a sus metadatos lógicos en Neo4j.

## Fase 4: Ojos y Oídos (Herramientas MCP Autónomas) (Completado) 🟢
- [x] Extender el docker-compose.yml para incluir Browserless (Navegación), SearXNG (Búsqueda) y Tika (Lectura de documentos).
- [x] Añadir funciones en bridge/src/mcpBridge.js que se comuniquen con estas herramientas.
- [x] Orquestar el flujo desde la UI y desde Crisálida (Telepatía Inversa).

## Fase 5: El "Latido" Autónomo (Agentic Loop) (Completado) 🟢 
- [x] Construir la lógica central del LLM (Qwen/Ollama) donde él decide *cuándo* usar una herramienta (uscar_informacion, leer_pagina, extraer_texto) ante el input de la UI o de Redis.
- [x] Integrar un histórico conversacional fluido en Redis (Telepatía con el Metaverso - Pub/Sub y Estado Mental).
- [x] Ejecutar el "Agentic Loop" en el servidor y retornar la cadena de pensamientos por WS/Redis.

---
*Última actualización: 13 Marzo 2026. Aegis en constante evolución.*