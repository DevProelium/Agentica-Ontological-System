# Plan de Acción y Tareas: Proyecto Aegis 🌱

Este documento rastrea la evolución de Aegis de un script ontológico a un Producto Digital Integral (PWA / SaaS), enfocado en la usabilidad, la inmersión y la democratización del acceso a agentes autónomos sin fricciones técnicas (zero-docker setup para el de a pie).

## FASE 1: El Portal y el Onboarding Mágico 🌌
- [x] **Login Futurista:** Implementar un botón/flujo de "Autenticación Biométrica" basado en WebAuthn (Passkeys / FaceID / Windows Hello) para conectar al usuario con su agente (Simulación UI completada).
- [x] **Intro Cinematográfica:** Crear una pantalla de carga/bienvenida inmersiva (posiblemente usando CSS avanzado o Three.js en el futuro) que transmite la idea de "despertar a un aliado" en vez de configurar software.
- [x] **Selección de Arquetipos:** Actualizar "WizardFlow.jsx" para permitir al usuario elegir plantillas .md pre-hechas (Ej: *Aegis Defensor*, *Tutor Académico*, *Apoyo Humanista*) o empezar desde cero.

## FASE 2: Identidad Dinámica y "Máscaras" 🎭
- [x] **Núcleo de Identidad (Base):** Asegurar que los principios básicos del Agente (lealtad, protección cognitiva) queden en un archivo .md inmutable y arraigado en el state/Zustand.
- [x] **Sistema de Context Swapping (Máscaras):** Crear la lógica para que el agente pueda "equiparse" un .md secundario como máscara temporal (Ej. "Actúa como mi personaje favorito por 2 horas").
- [x] **UI de Inventario de Máscaras:** Diseñar en el Dashboard o Editor una sección donde el usuario pueda prender o apagar estas personalidades/libretos (apuntando al futuro metaverso/tienda de prompts).

## FASE 3: El "Milagro del Navegador" (Arquitectura PWA Cero Instalación) 🌐
*El objetivo aquí es dar autonomía al agente corriendo todo lo posible nativamente en el navegador sin Docker.*
- [ ] **Ejecución de Código Local (Sandbox):** Integrar WebContainers (para JS) o Pyodide (para Python) directo en la PWA para que el agente pueda programar y analizar datos en el cliente.
- [ ] **Memoria Autónoma en el Cliente:** Probar/Añadir IndexedDB, PGLite o la librería Orama para búsquedas vectoriales semánticas rápidas directamente en la memoria del navegador.
- [ ] **Gestor de Conexiones LLM:** Interfaz en la PWA para que el usuario ponga sus llaves (Groq, Gemini) de forma segura en local, o use modelos ultra-ligeros vía WebGPU directamente.

## FASE 4: "Desatar la Bestia" (Power Users) 🚀
- [ ] **Detección Automática de Hardware:** Hacer que la PWA escanee silenciosamente los puertos locales (ej. http://localhost:11434) para ofrecer conectarse a Ollama automáticamente si el usuario ya lo tiene.
- [ ] **Habilidades vía MCP (Model Context Protocol):** Definir el formato estándar para que el agente reciba "herramientas" (Búsqueda web, Tika para PDFs) simuladas o conectadas como microservicios PWA en vez de pesados containers de Docker.
- [ ] **Concepto Aegis Desktop (Para el futuro):** Planear la versión instalable (Tauri/Electron) de 1-click que incluya el backend pesado para usuarios que sí quieran levantar bases de datos sin hacer YAMLs.
