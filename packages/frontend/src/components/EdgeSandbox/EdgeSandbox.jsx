import { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Square } from 'lucide-react';
import { bootWebContainer, ejecutarComando } from '../../core/browserSandbox.js';

export default function EdgeSandbox() {
  const [listo, setListo] = useState(false);
  const [comando, setComando] = useState('');
  const [output, setOutput] = useState([]);
  const [error, setError] = useState(null);
  const outputRef = useRef(null);

  useEffect(() => {
    async function iniciarSandbox() {
      try {
        await bootWebContainer();
        setListo(true);
        setOutput(prev => [...prev, '[Aegis] WebContainer listo. Entorno Node.js en el navegador iniciado.']);
      } catch (err) {
        setError(err.message || 'Error al iniciar el Sandbox');
      }
    }
    iniciarSandbox();
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleEnecutar = async (e) => {
    e.preventDefault();
    if (!comando.trim()) return;

    const cmd = comando.trim();
    setComando('');
    setOutput(prev => [...prev, `$ ${cmd}`]);

    if (cmd === 'clear') {
      setOutput([]);
      return;
    }

    try {
      const parts = cmd.split(' ');
      const baseCmd = parts[0];
      const args = parts.slice(1);

      const proceso = await ejecutarComando(baseCmd, args);
      
      proceso.output.pipeTo(new WritableStream({
        write(data) {
          setOutput(prev => [...prev, data]);
        }
      }));
      let exitCode = await proceso.exit;
      if(exitCode !== 0) { SetOutput(prev => [...prev, `Proceso terminado con código: ${exitCode}`]); }
    } catch (err) {
      setOutput(prev => [...prev, `Error: ${err.message}`]);
    }
  };

  return (
    <div className="flex flex-col h-full width-full bg-gray-900 text-green-400 font-mono p-4 rounded-lg shadow-inner">
      <div className="mb-4 flex items-center justify-between border-b border-gray-700 pb-2">
        <h2 className="text-lg flex items-center gap-2">
          <Terminal size={20} /> Aegis Edge Sandbox
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className={listo ? "text-green-500" : "text-yellow-500"}>
            { listo ? "Online" : "Iniciando..." }
          </span>
          <div className={`h-2 w-2 rounded-full ${listo ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}></div>
        </div>
      </div>

      <div 
        ref={outputRef} 
        className="flex-1 overflow-y-auto bg-black p-4 rounded mb-4 whitespace-pre-wrap"
        style={{ minHeight: '400px' }}
      >
        {error && <div className="text-red-500 mb-2">Error: {error}</div>}
        {output.map((line, i) => (
          <div key={i + 'line'} style={{ pointerEvents: 'none' }}>{line}</div>
        ))}
      </div>

      <form onSubmit={handleEjecutar} className="flex gap-2">
        <input
          type="text"
          value={comando}
          onChange={(e) => setComando(e.target.value)}
          placeholder={listo ? "ls l,  node -v, echo 'hola'" : "Esperando Sandbox..."}
          disabled={!listo}
          className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded focus:outline-none focus:border-green-500"
        />
        <button 
          type="submit" 
          disabled={!listo || !comando.trim()}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center gap-2 font-bold"
        >
          <Play size={18} /> Ejecutar
        </button>
      </form>
    </div>
  );
}

