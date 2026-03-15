import { WebContainer } from '@webcontainer/api';

let webcontainerInstance;

/**
 * Arranca (o recupera) la instancia del WebContainer (El Milagro del Navegador).
 * Solo se puede instanciar UNA vez por página debido a limitaciones de seguridad (SharedArrayBuffer).
 */
export async function bootWebContainer() {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  // Comprobar soporte de Cross-Origin Isolation
  if (!window.crossOriginIsolated) {
    console.warn("⚠️ Advertencia: Cross-Origin Isolation no está activado. Los WebContainers de StackBlitz requerirán headers específicos COOP y COEP en el servidor.");
  }

  try {
    console.log("🚀 [Aegis] Booting entorno Sandbox nativo (WebContainer)...");
    webcontainerInstance = await WebContainer.boot();
    console.log("✅ [Aegis] Micro-Sistema Operativo montado en el navegador.");
    return webcontainerInstance;
  } catch (error) {
    console.error("❌ [Aegis] Error crítico iniciando WebContainer:", error);
    throw error;
  }
}

/**
 * Monta archivos en la memoria virtual del contenedor.
 * @param {import('@webcontainer/api').FileSystemTree} files - Estructura de archivos simulada
 */
export async function montarSistemaArchivos(files) {
  const wc = await bootWebContainer();
  await wc.mount(files);
  console.log("📁 [Aegis] Archivos inyectados en la Sandbox.");
}

/**
 * Ejecuta un comando en el pseudo-terminal del navegador
 * @param {string} cmd Comando principal (ej. 'npm', 'node')
 * @param {string[]} args Argumentos del comando (ej. ['install'], ['index.js'])
 * @returns {Promise<number>} Código de salida del proceso
 */
export async function ejecutarComando(cmd, args, onOutput) {
  const wc = await bootWebContainer();
  
  const process = await wc.spawn(cmd, args);

  // Escuchar la salida (stdout) paso a paso
  process.output.pipeTo(new WritableStream({
    write(data) {
      if (onOutput) onOutput(data);
      else console.log(`[Sandbox]: ${data}`);
    }
  }));

  return process.exit;
}