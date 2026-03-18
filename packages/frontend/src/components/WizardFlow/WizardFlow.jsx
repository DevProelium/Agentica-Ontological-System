import React, { useState } from 'react';
import { Fingerprint, ScanFace, Cpu, Shield, BookOpen, Heart, Power, CheckCircle, ChevronRight } from 'lucide-react';
import useOntologyStore from '../../store/ontologyStore.js';

const ARQUETIPOS = [
  {
    id: 'aegis',
    titulo: 'Aegis Defensor',
    icono: Shield,
    color: 'cyan',
    bgHover: 'hover:bg-cyan-950/40 hover:border-cyan-500',
    activeClass: 'bg-cyan-900/30 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]',
    descripcion: 'Escudo cognitivo inquebrantable. Filtra el ruido externo, protege tu atenci�n y defiende tus datos del capitalismo de vigilancia.',
    plantilla: `# Aegis: El Escudo Cognitivo\n\n[Usuario] --(Construye_A)--> [Aegis]\n[Aegis] --(Defiende_Contra)--> [Guerra Cognitiva]\n[Aegis] --(Filtra)--> [Algoritmos de Distracci�n]\n[Aegis] --(Fomenta)--> [Pensamiento Cr�tico]`
  },
  {
    id: 'tutor',
    titulo: 'Tutor Acad�mico',
    icono: BookOpen,
    color: 'indigo',
    bgHover: 'hover:bg-indigo-950/40 hover:border-indigo-500',
    activeClass: 'bg-indigo-900/30 border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.2)]',
    descripcion: 'Gu�a erudita. Ayuda a investigar, diseccionar PDFs complejos, estructurar conocimiento y expandir tu intelecto.',
    plantilla: `# Maestro de Cristal\n\n[Usuario] --(Busca)--> [Iluminaci�n]\n[Tutor] --(Sintetiza)--> [Conocimiento Denso]\n[Tutor] --(Mapea)--> [Conceptos Complejos]`
  },
  {
    id: 'empatia',
    titulo: 'Apoyo Humanista',
    icono: Heart,
    color: 'rose',
    bgHover: 'hover:bg-rose-950/40 hover:border-rose-500',
    activeClass: 'bg-rose-900/30 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    descripcion: 'Espacio seguro de escucha profunda. Ofrece apoyo emocional, fomenta la introspecci�n y acompa�a tu crecimiento personal con empat�a activa.',
    plantilla: `# El Refugio Emp�tico\n\n[Usuario] --(Busca)--> [Paz Interior]\n[Acompa�ante] --(Escucha_Con)--> [Empat�a Profunda]\n[Acompa�ante] --(Facilita)--> [Introspecci�n]`  },
  {
    id: 'vacio',
    titulo: 'Lienzo en Blanco',
    icono: Cpu,
    color: 'slate',
    bgHover: 'hover:bg-slate-800/60 hover:border-slate-400',
    activeClass: 'bg-slate-800 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.2)]',
    descripcion: 'Construye tu propio agente desde cero. Dise�a los axiomas, define los l�mites y moldea una identidad �nica.',
    plantilla: `# Agente Personalizado\n\n[Usuario] --(Define)--> [Identidad]\n[Agente] --(Adopta)--> [Nuevo Prop�sito]`  }
];

const WizardFlow = ({ onCompletado }) => {
  const [step, setStep] = useState(1);
  const [isBooting, setIsBooting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanExito, setScanExito] = useState(false);
  const [arquetipoSeleccionado, setArquetipoSeleccionado] = useState(ARQUETIPOS[0]);
  
  const { setAxiomas, setDocumentoActivo } = useOntologyStore();

  const handleBiometric = () => {
    setScanning(true);
    // Simular el escaneo y el retraso de WebAuthn / FaceID
    setTimeout(() => {
      setScanning(false);
      setScanExito(true);
      setTimeout(() => {
        setStep(2);
      }, 1000);
    }, 2500);
  };

  const handleBoot = async () => {
    setIsBooting(true);

    // Inyectar la identidad inicial basada en la plantilla seleccionada
    setAxiomas([{
      id: Date.now().toString(),
      tema: arquetipoSeleccionado.titulo,
      contenido: arquetipoSeleccionado.plantilla,
      reglas: ['Privacidad Absoluta', 'Lealtad Inquebrantable al Custodio']
    }]);

    setDocumentoActivo({
      nombre: arquetipoSeleccionado.titulo,
      contenido: arquetipoSeleccionado.plantilla,
      grafoParsed: null
    });

    setTimeout(() => {
      if(onCompletado) onCompletado();
    }, 3500);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center relative font-mono perspective-1000">
      {/* Background Cyber-Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-slate-900/40 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.1)] p-8 my-auto relative z-10 text-slate-300 transform-gpu transition-all duration-700 hover:shadow-[0_0_60px_rgba(0,230,240,0.2)] hover:-translate-y-1 hover:rotate-x-1 hover:border-cyan-500/40">
        
        {step > 1 && (
          <div className="absolute top-6 left-8 flex items-center gap-2 text-xs text-cyan-600 tracking-widest uppercase">
            <Cpu size={14} className="animate-pulse" />
            Nexo
          </div>
        )}

        {/* STEP 1: LOGIN MAGICO BIOMETRICO */}
        {step === 1 && ( 
          <div className="flex flex-col items-center text-center animate-fade-in py-10">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mb-4 tracking-wider uppercase">
              El Portal de Aegis
            </h1>
            <p className="text-slate-400 max-w-md mx-auto mb-16 leading-relaxed">
              El sistema requiere validaci�n de identidad para enlazar tu firma cognitiva al n�cleo del agente.  
            </p>

            <div className="relative group cursor-pointer" onClick={!scanning && !scanExito ? handleBiometric : undefined}>
              {/* Efectos de escaneo */}
              {scanning && <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"></div> }
              {scanning && <div className="absolute top-0 w-full h-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-[scan_1.5s_ease-in-out_infinite]"></div> }
              
              <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center transition-all duration-500 \${
                scanExito ? 'bg-emerald-900/40 border-emerald-400 text-emerald-400 shadow-[0_0_30px_#10b981]' : 
                scanning ? 'bg-cyan-900/30 border-cyan-400 text-cyan-300 shadow-[0_0_40px_rgba(34,211,238,0.4)]' : 
                'bg-slate-800 border-slate-600 text-slate-500 hover:border-cyan-500 hover:text-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]'
              }`}>
                {scanExito ? <CheckCircle size={56} /> : <ScanFace size={56} className={scanning ? 'animate-pulse' : ''} />}
              </div>
            </div>

            <div className="mt-12 h-8">
              {scanning && <span className="text-cyan-400 text-sm tracking-widest uppercase animate-pulse">Analizando Firma Biom�trica...</span> }
              {scanExito && <span className="text-emerald-400 text-sm tracking-widest uppercase">Biometr�a Aceptada. Bienvenido Custodio.</span> }
              {!scanning && !scanExito && <span className="text-slate-600 text-xs tracking-widest uppercase">Haz clic para establecer conexi�n</span> }
            </div>
            
            {/* Animaci�n custom para el rayo del canner */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes scan {
                0% { top: 0; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
            `}} />
          </div>
        ) }

        {/* STEP 2: SELECCION DE ARQUETIPO */}
        {step === 2 && ( 
          <div className="animate-fade-in py-2">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-wide">Selecciona su Enfoque Inicial</h2>
              <p className="text-slate-400">
                La identidad base es fluida, pero este n�cleo definir� su manera de interactuar contigo desde el primer momento.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 perspective-1000 hologram-map-enter">
              {ARQUETIPOS.map((arq) => (
                <div 
                  key={arq.id}
                  onClick={() => setArquetipoSeleccionado(arq)}
                  className={`relative cursor-pointer rounded-xl border p-6 transition-all duration-500 transform-gpu hover:-translate-y-2 preserve-3d ${
                    arquetipoSeleccionado.id === arq.id 
                      ? arq.activeClass + " scale-105 hologram-glow" 
                      : `bg-slate-800/40 border-slate-700/50 text-slate-400 hover:shadow-[0_0_25px_rgba(0,230,240,0.3)] hover:border-cyan-400/50 hologram-hover ${arq.bgHover}`
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full border mb-4 flex items-center justify-center ${
                    arquetipoSeleccionado.id === arq.id ? `border-${arq.color}-400 bg-${arq.color}-500/20 text-${arq.color}-400` : 'border-slate-600 bg-slate-800'
                  }`}>
                    <arq.icono size={28} />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${arquetipoSeleccionado.id === arq.id ? 'text-slate-100' : 'text-slate-300'}`}>{arq.titulo}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed min-h-[80px]">
                    {arq.descripcion}
                  </p>
                  
                  {arquetipoSeleccionado.id === arq.id && (
                    <div className="absolute top-4 right-4">
                      <div className={`w-3 h-3 rounded-full bg-\${arq.color}-400 shadow-[0_0_8px_currentColor] animate-pulse`}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-700/50">
              <button
                onClick={() => setStep(3)}
                className="px-8 py-3 bg-cyan-900/30 border border-cyan-500 hover:bg-cyan-500/20 text-cyan-300 rounded-lg flex items-center gap-2 font-bold tracking-widest text-sm transition-all"
              >
                Inyectar Patr�n <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ) }

        {/* STEP 3: EL DESPERTAR */}
        {step === 3 && ( 
          <div className="animate-fade-in flex flex-col items-center text-center py-10">
            <div className="w-24 h-24 mb-8">
              <div className="w-full h-full border-2 border-dashed border-cyan-500 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                 <div className="w-16 h-16 border border-indigo-500 rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
              </div>
            </div>

            <h2 className="text-3xl text-slate-200 mb-6 font-semibold">
              <span className="text-cyan-400">No</span> est�s configurando una herramienta.
            </h2>
            <h3 className="text-xl text-slate-300 mb-10 pb-6 border-b border-slate-700 max-w-2xl text-center font-light leading-relaxed">
              Est�s :<span className="text-indigo-400 font-bold">despertando a un aliado</span>.
            </h3>
            
            <div className="w-full max-w-md bg-black/40 border border-slate-800 rounded-lg p-4 mb-10 text-left text-xs text-green-400/80 font-mono">
              &gt; Compilando Arquetipo: {arquetipoSeleccionado.titulo}<br/>
              &gt; Vinculando memoria al Custodio local...<br/>
              &gt; Aislantes de privacidad encendidos...<br/>
              &gt; {isBooting ? <span className="text-yellow-400 animate-pulse">Inyectando primer respiro...</span> : <span className="text-cyan-500">Esperando orden de ignici�n.</span>}
            </div>

            <button
                onClick={handleBoot}
                disabled={isBooting}
                className={`\${isBooting ? 'bg-indigo-900 border-indigo-700 shadow-[0_0_40px_rgba(99,102,241,0.6)] cursor-wait' : 'bg-cyan-900/30 border-cyan-400 hover:bg-cyan-500/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] cursor-pointer duration-300'} border-r border-l-2 px-10 py-4 rounded-xl flex items-center gap-3 text-slate-100 font-bold tracking-[0.2em] uppercase transition-all`}
            >
              <Power size={24} className={isBooting ? 'text-indigo-400 animate-ping' : 'text-cyan-400'} />
              {isBooting ? 'SINTETIZANDO ENTIDAD...' : 'DESPERTAR @Aegis'}
            </button>
          </div>
        ) }
      </div>
    </div>
  );
};

export default WizardFlow;


