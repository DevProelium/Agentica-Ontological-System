/**
 * GraphView.jsx – Visualización del Grafo Ontológico
 *
 * Renderiza el grafo de conocimiento del agente en forma de red visual.
 * Con estilo "Aegis": Cyber-glassmorphism.
 */

import { useMemo } from 'react';
import { calcularFuerzaAtraccion } from '../../core/inferenceEngine.js';
import useOntologyStore from '../../store/ontologyStore.js';

// Paleta de colores cyber/neon
const COLORES_NODO = {
  Aegis: '#22d3ee',      // Cyan
  Usuario: '#818cf8',    // Indigo
  Guerra_Cognitiva: '#f43f5e', // Rose/Red
  Concepto: '#10b981',   // Emerald
  default: '#94a3b8'     // Slate
};

export default function GraphView({ nodos = [], relaciones = [] }) {
  if (!nodos.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 text-slate-400 font-mono rounded-xl border border-dashed border-cyan-500/30 p-8 text-center ring-1 ring-inset ring-white/5">
        <div className="w-16 h-16 rounded-full border border-cyan-500/20 flex items-center justify-center mb-4">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-full animate-ping"></div>
        </div>
        <p className="max-w-md text-sm leading-relaxed">
          El plano ontológico está vacío.<br/>
          <span className="text-cyan-500">Inyecta axiomas en el editor para materializar la estructura cognitiva.</span>
        </p>
      </div>
    );
  }

  // Identificar el nodo central (Aegis) si existe para posicionarlo en el centro
  const nodoCentralId = nodos.find(n => n.nombre?.toLowerCase().includes('aegis'))?.id;

  return (
    <div className="relative h-full bg-slate-900 rounded-xl border border-cyan-500/20 shadow-2xl overflow-hidden font-mono flex flex-col">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-slate-800/80 border-b border-indigo-500/30 backdrop-blur z-10">
        <span className="text-indigo-400 font-bold tracking-wider uppercase text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Topología Cognitiva
        </span>
        <span className="text-xs text-slate-500">
          {nodos.length} Entidades / {relaciones.length} Vectores
        </span>
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 backdrop-blur text-xs">
        {Object.entries(COLORES_NODO).filter(([k]) => k !== 'default').map(([tipo, color]) => (
          <div key={tipo} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }}></span>
            <span className="text-slate-300 uppercase tracking-widest text-[10px]">{tipo.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Visor SVG */}
      <div className="flex-1 overflow-hidden relative z-0">
        <svg width="100%" height="100%" viewBox="0 0 800 600" className="w-full h-full cursor-move">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Enlaces */}
          {relaciones.map((rel, i) => {
            const origen = nodos.findIndex(n => n.id === rel.desde);
            const destino = nodos.findIndex(n => n.id === rel.hasta);
            if (origen === -1 || destino === -1) return null;

            const pos1 = calcularPosicion(origen, nodos.length, nodos[origen].id === nodoCentralId);
            const pos2 = calcularPosicion(destino, nodos.length, nodos[destino].id === nodoCentralId);
            
            const isHostile = rel.tipo?.toLowerCase().includes('defiende');

            return (
              <g key={el--\}>                <line
                  x1={pos1.x} y1={pos1.y}
                  x2={pos2.x} y2={pos2.y}
                  stroke={isHostile ? "#f43f5e" : "#3b82f6"}
                  strokeWidth={isHostile ? 2 : 1}
                  strokeOpacity={0.4}
                  strokeDasharray={isHostile ? "4,4" : "none"}
                />
                <text
                  x={(pos1.x + pos2.x) / 2}
                  y={(pos1.y + pos2.y) / 2 - 5}
                  fill={isHostile ? "#fb7185" : "#60a5fa"}
                  fontSize="8"
                  textAnchor="middle"
                  className="uppercase tracking-widest"
                >
                  {rel.tipo}
                </text>
              </g>
            );
          })}

          {/* Nodos */}
          {nodos.map((nodo, i) => {
            const isCenter = nodo.id === nodoCentralId;
            const pos = calcularPosicion(i, nodos.length, isCenter);
            const tipoLower = nodo.nombre?.toLowerCase() || '';
            let color = COLORES_NODO.default;
            
            if (tipoLower.includes('aegis')) color = COLORES_NODO.Aegis;
            else if (tipoLower.includes('usuario')) color = COLORES_NODO.Usuario;
            else if (tipoLower.includes('guerra') || tipoLower.includes('inyección') || tipoLower.includes('distracción')) color = COLORES_NODO.Guerra_Cognitiva;
            else color = COLORES_NODO.Concepto;

            return (
              <g key={nodo.id} transform={	ranslate(, )}>                <circle 
                  r={isCenter ? 35 : 25} 
                  fill="#0f172a" 
                  stroke={color} 
                  strokeWidth="2"
                  filter="url(#glow)"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isCenter ? "10" : "8"}
                  fill="#e2e8f0"
                  fontWeight="bold"
                  className="uppercase tracking-wider pointer-events-none select-none"
                >
                  {truncar(nodo.nombre, 10)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// Helpers
function calcularPosicion(index, total, isCenter) {
  if (isCenter) return { x: 400, y: 300 }; // Centro absoluto
  if (total <= 1) return { x: 400, y: 300 };
  
  // Distribuir el resto en un círculo
  const offsetIndex = index; 
  const angulo = (offsetIndex / total) * 2 * Math.PI - Math.PI / 2;
  const radio = 180 + Math.random() * 40; // Ligera variación
  return {
    x: 400 + radio * Math.cos(angulo),
    y: 300 + radio * Math.sin(angulo),
  };
}

function truncar(texto, max) {
  return texto?.length > max ? texto.slice(0, max) + '…' : texto;
}

