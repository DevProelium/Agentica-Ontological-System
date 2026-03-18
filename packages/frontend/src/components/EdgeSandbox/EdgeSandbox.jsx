import { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { getWebContainer } from '../../core/browserSandbox.js';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function EdgeSandbox() {
  const [listo, setListo] = useState(false);
  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const shellProcess = useRef(null);

  useEffect(() => {
    // 1. Inicializar Xterm.js
    const fitAddon = new FitAddon();
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0f172a',
        foreground: '#10b981',
        cursor: '#10b981',
      }
    });

    term.loadAddon(fitAddon);
    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.fit();
    }
    terminalInstance.current = term;

    term.writeln('\x1b[1;36m[Aegis]\x1b[0m Iniciando Sandbox Engine (Edge V8) \x1b[5m...\x1b[0m');

    let isMounted = true;
    async function init() {
      try {
        const wc = await getWebContainer();
        if (!isMounted) return;

        setListo(true);
        term.write('\x1b[2J\x1b[0;0H'); 
        term.writeln('\x1b[1;32m[Aegis] WebContainer listo.\x1b[0m Eres root temporal del entorno.');

        // 3. Crear proceso 'jsh'
        const process = await wc.spawn('jsh', {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });
        shellProcess.current = process;

        // 4. Conectar output
        process.output.pipeTo(new WritableStream({
          write(data) {
            term.write(data);
          }
        }));

        // 5. Conectar input
        const processInput = process.input.getWriter();
        term.onData((data) => {
          processInput.write(data);
        });

      } catch (err) {
        if (isMounted) term.writeln(`\r\n\x1b[1;31mError al iniciar:\x1b[0m ${err.message}`);
      }
    }

    init();

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (shellProcess.current) {
         shellProcess.current.kill();
      }
      term.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 border border-aegis-700 rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-aegis-700">
        <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wide">
          <TerminalIcon size={16} className="text-aegis-accent" /> Aegis Edge xTerm
        </h2>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={listo ? "text-green-400" : "text-yellow-400"}>
            { listo ? "CONECTADO" : "SINCRONIZANDO..." }
          </span>
          <div className={`h-2 w-2 rounded-full ${listo ? "bg-green-500 shadow-[0_0_8px_#10b981]" : "bg-yellow-500 animate-pulse"}`}></div>
        </div>
      </div>
      <div className="flex-1 w-full relative bg-[#0f172a]" style={{ minHeight: '400px' }}>
         <div ref={terminalRef} className="absolute inset-0 pl-2 pt-2 h-full w-full overflow-hidden" />
      </div>
    </div>
  );
}

