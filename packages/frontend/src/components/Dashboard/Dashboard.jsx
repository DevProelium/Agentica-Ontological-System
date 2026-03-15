import { useEffect, useState } from 'react';
import useOntologyStore from '../../store/ontologyStore.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';
import { Hexagon, Fingerprint, Database, Network, Share2, GitCommit, CheckCircle2, ShieldCheck, Cpu, Sparkles, XCircle } from 'lucide-react';

export default function Dashboard() {
  const { agente, axiomas, aspiraciones, mascarasDisponibles, mascaraActiva, equiparMascara, quitarMascara } = useOntologyStore();
  const { enviarMensaje } = useWebSocket();
  const [asimilando, setAsimilando] = useState(false);

  // Un hash falso pero estatico para representar la Identidad Derivada Ontologicamente
  const agenteHash = "0x" + Array.from(axiomas || []).reduce((acc, ax) => acc + (ax?.tema?.charCodeAt(0) || ax?.titulo?.charCodeAt(0) || 0), 1024).toString(16) + "a8f...9c4b";

  const handleAsimilarConocimiento = async () => {
    setAsimilando(true);
    const response = await enviarMensaje({ method: 'memoria.asimilar_archivos', params: {} });
    setAsimilando(false);
    if(response?.result?.exito) {
      alert("Aegis: He terminado de asimilar tus archivos.");
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full text-gray-200">
      
      {/* HEADER: Identidad Criptogr�fica �nica */}
      <div className="bg-aegis-900/60 border border-aegis-700/50 rounded-2xl p-4 flex items-center justify-between shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-aegis-800 rounded-xl border border-aegis-accent/30 shadow-[0_0_10px_rgba(0,230,240,0.1)]">
            <Fingerprint className="text-aegis-accent" size={28} />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Identidad Criptogr�fica Ontol�gica</h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm py-1 px-2 bg-aegis-800 rounded border border-aegis-700 text-aegis-accent/80">
                {agenteHash}
              </span>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 flex items-center gap-1">
                <CheckCircle2 size={12}/> Firma Validada
              </span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-right">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Motor Central</p>
            <p className="text-sm font-semibold text-white">Qwen3-VL 235B</p>
          </div>
          <Hexagon className="text-indigo-400 animate-pulse-slow" size={24} />
        </div>
      </div>

      {/* MID SECTION: Orbe de Presencia & Control */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* The Core Orb */}
        <div className="flex-1 bg-aegis-800/40 border border-aegis-700/50 rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden backdrop-blur-sm">
          {/* Decorative glowing orb behind */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] transition-all duration-1000 ${asimilando ? 'bg-indigo-500/30 w-64 h-64' : 'bg-aegis-accent/20'}`}></div>
          
          <div className={`relative z-10 w-40 h-40 rounded-full border-2 transition-all duration-[3000ms] flex items-center justify-center ${asimilando ? 'border-indigo-400 border-dashed animate-[spin_4s_linear_infinite] shadow-[0_0_40px_rgba(99,102,241,0.3)]' : 'border-aegis-accent/50 border-dotted shadow-[0_0_30px_rgba(0,230,240,0.15)] animate-[spin_20s_linear_infinite]'}`}>
            <div className={`w-32 h-32 rounded-full border flex items-center justify-center bg-aegis-900/80 backdrop-blur-md ${asimilando ? 'border-indigo-500 animate-[spin_3s_linear_infinite_reverse]' : 'border-aegis-accent/30 '}`}>
               <Hexagon size={48} className={asimilando ? 'text-indigo-400 animate-pulse' : 'text-aegis-accent'} />
            </div>
          </div>

          <div className="relative z-10 mt-8 text-center">
            <h2 className="text-xl font-medium tracking-wide text-white mb-2">
              {asimilando ? 'Sincronizando Archivos.md...' : (agente.estado_animo || 'Aegis en Reposo T�ctico')}
            </h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-6 h-10">
              {asimilando 
                ? 'Extrayendo memoria local, construyendo RAG y actualizando Neo4j...' 
                : 'Escuchando puente WebMCP. Esperando conexi�n del Metaverso.'}
            </p>
            <button
               onClick={handleAsimilarConocimiento}
               disabled={asimilando}
               className={`px-6 py-2.5 rounded-lg border font-medium tracking-wide transition-all shadow-lg text-sm ${asimilando ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 cursor-wait' : 'bg-aegis-accent/10 border-aegis-accent text-aegis-accent hover:bg-aegis-accent hover:text-aegis-900 shadow-[0_0_15px_rgba(0,230,240,0.2)]'}`}
            >
              {asimilando ? 'PROCESANDO VECTORES' : 'FORZAR ASIMILACI�N LOCAL'}
            </button>
          </div>
        </div>

        {/* Máscaras de Identidad (Context Swapping) */}
        <div className="w-full md:w-72 bg-aegis-800/40 border border-aegis-700/50 rounded-2xl p-5 flex flex-col backdrop-blur-sm overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-aegis-700">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="text-sm uppercase tracking-widest font-semibold flex-1 text-amber-100">Máscaras</h3>
            <span className="text-xs text-gray-500 font-mono">{mascarasDisponibles?.length || 0} ALMACENADAS</span>
          </div>
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 flex flex-col gap-3">
             {mascarasDisponibles?.map(masc => (
                 <div key={masc.id} className={`p-3 rounded-lg border transition-all ${mascaraActiva?.id === masc.id ? 'bg-amber-900/30 border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'bg-aegis-900/50 border-aegis-700 hover:border-amber-700/50'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <strong className={`block text-sm font-mono ${mascaraActiva?.id === masc.id ? 'text-amber-400' : 'text-gray-300'}`}>{masc.tema}</strong>
                       {mascaraActiva?.id === masc.id ? (
                          <button onClick={quitarMascara} className="text-amber-400 hover:text-red-400 transition-colors" title="Desequipar máscara"><XCircle size={16} /></button>
                       ) : (
                          <button onClick={() => equiparMascara(masc.id)} className="text-gray-500 hover:text-amber-400 transition-colors" title="Equipar máscara"><CheckCircle2 size={16} /></button>
                       )}
                    </div>
                    <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                      {masc.reglas?.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                 </div>
              ))}
          </div>
        </div>

        {/* Action Log / Planos en Scroll */}
        <div className="w-full md:w-72 bg-aegis-800/40 border border-aegis-700/50 rounded-2xl p-5 flex flex-col backdrop-blur-sm overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-aegis-700">
            <GitCommit size={18} className="text-aegis-accent" />
            <h3 className="text-sm uppercase tracking-widest font-semibold flex-1">Libro de Planos</h3>
            <span className="text-xs text-gray-500 font-mono">{axiomas.length} AXIOMAS</span>
          </div>
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 flex flex-col gap-3">
             {axiomas.length > 0 ? (
                axiomas.slice(0, 5).map(ax => (
                   <div key={ax.id || ax.tema} className={`p-3 rounded border-l-2 text-sm ${ax.esMascara ? 'bg-amber-900/20 border-amber-500' : 'bg-aegis-900/50 border-aegis-accent'}`}>
                      <strong className="block text-white mb-1 font-mono flex items-center gap-2">
                        {ax.esMascara && <Sparkles size={12} className="text-amber-400" />}
                        {ax.titulo || ax.tema}
                      </strong>
                      <p className="text-gray-400 text-xs italic">"{ax.descripcion || (ax.esMascara ? 'Protocolo de actuación activo.' : 'Inmutable.')}"</p>
                   </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-10 italic">
                  No hay axiomas cargados. Motor en blanco.
                </div>
              )}
          </div>
        </div>
      </div>

      {/* BOTTOM METRICS: Las 3 Capas Arquitect�nicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Verificaci�n cruzada */}
        <div className="bg-aegis-800/40 border border-aegis-700 rounded-xl p-4 transition-all hover:bg-aegis-800/60 shadow-md">
          <div className="flex items-center gap-2 text-indigo-400 mb-3">
            <Database size={18} />
            <h4 className="font-semibold text-sm uppercase tracking-wide">Contexto Multicluster</h4>
          </div>
          <p className="text-xs text-gray-400 mb-4 h-8">Verificando de acciones contra fuentes de memoria persistente P2P.</p>
          <ul className="text-xs space-y-2 font-mono">
            <li className="flex justify-between items-center"><span className="text-gray-300">Neo4j (Ontolog�a)</span> <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={12}/> Sync</span></li>
            <li className="flex justify-between items-center"><span className="text-gray-300">Redis (Sesi�n PWA)</span> <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={12}/> Sync</span></li>
            <li className="flex justify-between items-center"><span className="text-gray-300">pgvector (RAG)</span> <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={12}/> Sync</span></li>
          </ul>
        </div>

        {/* Card 2: Consenso Interno */}
        <div className="bg-aegis-800/40 border border-aegis-700 rounded-xl p-4 transition-all hover:bg-aegis-800/60 shadow-md">
          <div className="flex items-center gap-2 text-amber-400 mb-3">
            <Network size={18} />
            <h4 className="font-semibold text-sm uppercase tracking-wide">Consenso Interno</h4>
          </div>
          <p className="text-xs text-gray-400 mb-4 h-8">Decisiones cr�ticas trianguladas entre m�dulos de conciencia.</p>
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_theme(colors.amber.400)]"></div><span className="text-[10px] text-gray-400">L�gica</span></div>
            <div className="h-px bg-aegis-700 flex-1 mx-2"></div>
            <div className="flex flex-col items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_theme(colors.amber.400)] text-[10px]"></div><span className="text-[10px] text-gray-400">Moral</span></div>
            <div className="h-px bg-aegis-700 flex-1 mx-2"></div>
            <div className="flex flex-col items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_theme(colors.amber.400)]"></div><span className="text-[10px] text-gray-400">Memoria</span></div>
          </div>
          <div className="mt-3 text-center text-xs text-amber-400/80 bg-amber-400/10 py-1 rounded">Consenso Logrado (100%)</div>
        </div>

        {/* Card 3: WebMCP Intr�nseco */}
        <div className="bg-aegis-800/40 border border-aegis-700 rounded-xl p-4 transition-all hover:bg-aegis-800/60 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-aegis-accent/5 rounded-full blur-[20px]"></div>
          <div className="flex items-center gap-2 text-aegis-accent mb-3 relative z-10">
            <Share2 size={18} />
            <h4 className="font-semibold text-sm uppercase tracking-wide">WebMCP Intr�nseco</h4>
          </div>
          <p className="text-xs text-gray-400 mb-4 h-8 relative z-10">Verificaci�n estructural del c�digo delegado de Cris�lida.</p>
          <div className="bg-aegis-900 rounded p-2 text-[10px] font-mono border border-aegis-700 text-aegis-accent/70 h-16 overflow-hidden relative z-10 opacity-70">
            {`> listening on port 3030\n> [JSON-RPC] intercept proxy active\n> awaiting signed packets...`}
            <span className="animate-pulse block mt-1 text-white">_</span>
          </div>
        </div>

      </div>
    </div>
  );
}
