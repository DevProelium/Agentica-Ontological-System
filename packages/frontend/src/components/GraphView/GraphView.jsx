/**
 * GraphView.jsx – Visualización del Grafo Ontológico
 *
 * Renderiza el grafo de conocimiento del agente en forma de red visual.
 * Los "Deseos" brillan en color dorado con fuerza de atracción hacia
 * los "Proyectos", determinando la prioridad de las tareas sugeridas.
 *
 * En producción: integrar con D3.js o react-force-graph para física real.
 * Para el metaverso: los parámetros físicos se envían a Ammo.js vía WS.
 */

import { useMemo } from 'react';
import { calcularFuerzaAtraccion } from '../../core/inferenceEngine.js';
import useOntologyStore from '../../store/ontologyStore.js';

// Paleta de colores por tipo de nodo (lenguaje humano, no técnico)
const COLORES_NODO = {
  Axioma: '#818cf8',      // Índigo: principios irrefutables
  Deseo: '#fbbf24',       // Dorado: aspiraciones que brillan
  Proyecto: '#34d399',    // Verde: lo que se construye
  Capacidad: '#60a5fa',   // Azul: habilidades del agente
  Tarea: '#a78bfa',       // Violeta: acciones concretas
  Recuerdo: '#f9a8d4',    // Rosa: memorias compartidas
  Bloque: '#94a3b8',      // Gris: bloques de contenido
  Nodo: '#e2e8f0',        // Blanco roto: nodos genéricos
};

export default function GraphView({ nodos = [], relaciones = [] }) {
  const { aspiraciones } = useOntologyStore();

  // Calcular la fuerza de atracción de cada Deseo hacia los Proyectos
  const proyectos = useMemo(() => nodos.filter(n => n.label === 'Proyecto'), [nodos]);

  const nodosConFuerza = useMemo(() =>
    nodos.map(nodo => ({
      ...nodo,
      fuerza_atraccion: nodo.label === 'Deseo'
        ? calcularFuerzaAtraccion(nodo, proyectos)
        : null,
    })),
    [nodos, proyectos]
  );

  if (!nodos.length) {
    return (
      <div className="graph-view graph-view--vacio">
        <p className="graph-vacio-mensaje">
          Aún no hay Principios en el grafo.
          <br />
          Crea tu primer Principio en el editor para verlo aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="graph-view">
      <div className="graph-leyenda">
        {Object.entries(COLORES_NODO).slice(0, 5).map(([tipo, color]) => (
          <span key={tipo} className="leyenda-item">
            <span className="leyenda-punto" style={{ backgroundColor: color }} />
            {tipo === 'Axioma' ? 'Principio' :
             tipo === 'Deseo' ? 'Aspiración' :
             tipo === 'Proyecto' ? 'Proyecto' :
             tipo === 'Capacidad' ? 'Capacidad' : 'Tarea'}
          </span>
        ))}
      </div>

      {/* Visualización de nodos como red (versión simplificada sin física) */}
      <div className="graph-canvas" role="img" aria-label="Grafo ontológico del agente">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 500"
          className="graph-svg"
        >
          {/* Relaciones */}
          {relaciones.map((rel, i) => (
            <RelacionSVG key={`rel-${i}`} relacion={rel} nodos={nodosConFuerza} />
          ))}

          {/* Nodos */}
          {nodosConFuerza.map((nodo, i) => (
            <NodoSVG
              key={nodo.id}
              nodo={nodo}
              posicion={calcularPosicion(i, nodosConFuerza.length)}
              color={COLORES_NODO[nodo.label] ?? COLORES_NODO.Nodo}
            />
          ))}
        </svg>
      </div>

      {/* Panel de Aspiraciones con fuerza de atracción */}
      {nodosConFuerza.some(n => n.label === 'Deseo') && (
        <div className="grafo-aspiraciones">
          <h4 className="aspiraciones-titulo">Aspiraciones y su Prioridad</h4>
          <ul className="aspiraciones-lista">
            {nodosConFuerza
              .filter(n => n.label === 'Deseo')
              .sort((a, b) => (b.fuerza_atraccion ?? 0) - (a.fuerza_atraccion ?? 0))
              .map(deseo => (
                <li key={deseo.id} className="aspiracion-item">
                  <span className="aspiracion-nombre">{deseo.nombre}</span>
                  <div className="aspiracion-fuerza-barra">
                    <div
                      className="aspiracion-fuerza-relleno"
                      style={{ width: `${(deseo.fuerza_atraccion ?? 0) * 100}%` }}
                    />
                  </div>
                  <span className="aspiracion-porcentaje">
                    {((deseo.fuerza_atraccion ?? 0) * 100).toFixed(0)}%
                  </span>
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componentes SVG ───────────────────────────────────

function NodoSVG({ nodo, posicion, color }) {
  const radio = nodo.label === 'Axioma' ? 28 : nodo.label === 'Deseo' ? 24 : 18;
  const brilla = nodo.label === 'Deseo';

  return (
    <g transform={`translate(${posicion.x}, ${posicion.y})`} className="nodo-svg">
      {brilla && (
        <circle
          r={radio + 8}
          fill={color}
          opacity={0.2 + (nodo.fuerza_atraccion ?? 0) * 0.3}
          className="nodo-halo"
        />
      )}
      <circle r={radio} fill={color} stroke="#1e293b" strokeWidth={2} />
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={nodo.label === 'Axioma' ? 8 : 7}
        fill="#0f172a"
        fontWeight="600"
      >
        {truncar(nodo.nombre, 12)}
      </text>
    </g>
  );
}

function RelacionSVG({ relacion, nodos }) {
  const origen = nodos.findIndex(n => n.id === relacion.desde);
  const destino = nodos.findIndex(n => n.id === relacion.hasta);
  if (origen === -1 || destino === -1) return null;

  const pos1 = calcularPosicion(origen, nodos.length);
  const pos2 = calcularPosicion(destino, nodos.length);

  return (
    <line
      x1={pos1.x} y1={pos1.y}
      x2={pos2.x} y2={pos2.y}
      stroke="#334155"
      strokeWidth={1.5}
      strokeDasharray={relacion.tipo === 'VINCULA' ? '4,4' : undefined}
      opacity={0.6}
    />
  );
}

// ─── Helpers ────────────────────────────────────────────────

/** Distribuye los nodos en espiral para visualización inicial */
function calcularPosicion(index, total) {
  if (total === 0) return { x: 400, y: 250 };
  const angulo = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radio = Math.min(180 + index * 5, 220);
  return {
    x: 400 + radio * Math.cos(angulo),
    y: 250 + radio * Math.sin(angulo),
  };
}

function truncar(texto, max) {
  return texto?.length > max ? texto.slice(0, max) + '…' : texto;
}
