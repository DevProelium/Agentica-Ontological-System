/**
 * AxiomEditor – Editor de Principios estilo Logseq
 *
 * Permite editar bloques de Markdown con sintaxis de propiedades (clave:: valor)
 * y enlaces bidireccionales ([[Nodo]]). Al guardar, actualiza el grafo en Neo4j
 * en tiempo real a través del WebSocket Bridge.
 */

import { useState, useCallback, useRef } from 'react';
import { parseMdToGraph } from '../../core/mdToGraph.js';
import useOntologyStore from '../../store/ontologyStore.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';

const PLACEHOLDER = `# Mi Principio
tipo:: Propósito
prioridad:: Alta
[[Axioma: Crecimiento]]
- Primera intención
- Segunda intención`;

export default function AxiomEditor({ documentoInicial = '' }) {
  const [contenido, setContenido] = useState(documentoInicial || PLACEHOLDER);
  const [grafoPreview, setGrafoPreview] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const debounceRef = useRef(null);

  const { setDocumentoActivo } = useOntologyStore();
  const { sincronizarGrafo } = useWebSocket();

  const procesarContenido = useCallback((texto) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const resultado = parseMdToGraph(texto);
        setGrafoPreview(resultado);
        setDocumentoActivo({ nombre: extraerTitulo(texto), contenido: texto, grafoParsed: resultado });
      } catch {
        // El parseo puede fallar con contenido incompleto; ignorar silenciosamente
      }
    }, 400);
  }, [setDocumentoActivo]);

  const handleCambio = (e) => {
    const texto = e.target.value;
    setContenido(texto);
    procesarContenido(texto);
  };

  const handleGuardar = async () => {
    if (!grafoPreview) return;
    setGuardando(true);
    try {
      sincronizarGrafo({ contenido, grafo: grafoPreview });
      setMensaje({ tipo: 'exito', texto: `✅ ${grafoPreview.nodes.length} nodo(s) sincronizados con el Grafo.` });
    } catch {
      setMensaje({ tipo: 'error', texto: '⚠️ No se pudo sincronizar. Revisa la conexión con el Bridge.' });
    } finally {
      setGuardando(false);
      setTimeout(() => setMensaje(null), 4000);
    }
  };

  // Atajos de teclado estilo Logseq
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleGuardar();
    }
    // Tab inserta 2 espacios (estilo bloque)
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const nuevoTexto = contenido.substring(0, start) + '  ' + contenido.substring(end);
      setContenido(nuevoTexto);
      setTimeout(() => {
        e.target.selectionStart = start + 2;
        e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="axiom-editor">
      <div className="editor-toolbar">
        <span className="editor-titulo">
          {grafoPreview?.nodes?.[0]?.nombre ?? 'Sin título'}
        </span>
        <div className="editor-acciones">
          {grafoPreview && (
            <span className="editor-stats">
              {grafoPreview.nodes.length} nodo(s) · {grafoPreview.relations.length} relación(es)
            </span>
          )}
          <button
            className={`btn-guardar ${guardando ? 'btn-cargando' : ''}`}
            onClick={handleGuardar}
            disabled={guardando || !grafoPreview}
            title="Guardar y sincronizar con el Grafo (Ctrl+S)"
          >
            {guardando ? 'Sincronizando…' : 'Sincronizar Grafo'}
          </button>
        </div>
      </div>

      <div className="editor-cuerpo">
        <textarea
          className="editor-textarea"
          value={contenido}
          onChange={handleCambio}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder={PLACEHOLDER}
          aria-label="Editor de Principios ontológicos"
        />

        {grafoPreview && (
          <div className="editor-preview">
            <h4 className="preview-titulo">Vista del Grafo</h4>
            <ul className="preview-nodos">
              {grafoPreview.nodes.slice(0, 8).map((n) => (
                <li key={n.id} className={`preview-nodo preview-nodo--${n.label.toLowerCase()}`}>
                  <span className="nodo-label">{n.label}</span>
                  <span className="nodo-nombre">{n.nombre}</span>
                </li>
              ))}
            </ul>
            {grafoPreview.nodes.length > 8 && (
              <p className="preview-mas">+{grafoPreview.nodes.length - 8} nodo(s) más…</p>
            )}
          </div>
        )}
      </div>

      {mensaje && (
        <div className={`editor-mensaje editor-mensaje--${mensaje.tipo}`} role="status">
          {mensaje.texto}
        </div>
      )}
    </div>
  );
}

function extraerTitulo(texto) {
  const linea = texto.split('\n').find(l => l.startsWith('# '));
  return linea ? linea.replace(/^#+\s*/, '') : 'Sin título';
}
