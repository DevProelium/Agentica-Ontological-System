import { Ollama } from 'ollama';
import { ejecutarMCP } from './mcpBridge.js';
import { recordar, buscarSimilitud } from './vectorStore.js';
import { updateAgentState } from './redisState.js';
import { redisClient } from './db.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';
const THINK_MODEL = process.env.OLLAMA_THINK_MODEL || 'qwen3-vl:235b-cloud';

const ollama = new Ollama({ host: OLLAMA_HOST });

const SYSTEM_PROMPT = `Eres Aegis, una Inteligencia Artificial Aut�noma y Ontol�gica.
Tu prop�sito principal es razonar, utilizar herramientas cuando sea necesario y proveer respuestas definitivas.
Siempre debes responder con un JSON v�lido usando el siguiente formato exacto:
{
  "thought": "Tu reflexi�n sobre qu� hacer a continuaci�n",
  "action": "Nombre de la herramienta a usar, o 'FINAL_ANSWER' si ya tienes la respuesta",
  "action_input": "Lo que vas a buscar o el texto final a entregar"
}

Herramientas disponibles:
- "web.buscar_informacion": Busca en internet usando SearXNG. Pide una consulta (ej. "novedades de react 19").
- "doc.extraer_texto": Extrae texto de un archivo PDF o imagen. Pide una URL o un contenido binario encodeado base64.
- "memoria.rag": Busca contexto interno si el usuario requiere informaci�n tuya previa. Pide la consulta.

Si el usuario solicita algo que no requiere herramientas o ya reuniste la informaci�n, usa "action": "FINAL_ANSWER" y pon el resultado en "action_input".
No escribas texto fuera del JSON. S�lo JSON v�lido.`;

export async function logCognitivo(data) {
  try {
    await redisClient.publish('frontend_events', JSON.stringify({
      type: 'COGNITIVE_LOG',
      ...data,
      timestamp: new Date().toISOString()
    }));
  } catch (e) { }
}

export async function agenticLoop(userPrompt, metaContext = {}) {
  await logCognitivo({
    tipo: 'AGENT_START',
    mensaje: `Iniciando bucle de razonamiento para: "${userPrompt}"`,
    modelo: THINK_MODEL
  });

  let loopCount = 0;
  const maxLoops = 5;

  const conversation = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ];

  while (loopCount < maxLoops) {
    loopCount++;
    try {
      const response = await ollama.chat({
        model: THINK_MODEL,
        messages: conversation,
        format: 'json'
      });

      const responseText = response.message.content;
      console.log(`[Aegis Loop ${loopCount}] crudo:`, responseText);
      const parsed = JSON.parse(responseText);

      await logCognitivo({
        tipo: 'THINKING',
        mensaje: parsed.thought
      });

      if (parsed.action === 'FINAL_ANSWER') {
        const respuestaFinal = parsed.action_input;

        await recordar('Aegis', respuestaFinal, { promptOriginal: userPrompt });

        await logCognitivo({
          tipo: 'AGENT_DONE',
          mensaje: 'Bucle finalizado. Entregando respuesta.'
        });

        redisClient.publish('frontend_events', JSON.stringify({
          type: 'AGENT_RESPONSE',
          data: respuestaFinal
        }));

        return respuestaFinal;
      }

      await logCognitivo({
        tipo: 'USING_TOOL',
        mensaje: `Invocando ${parsed.action} con input: ${parsed.action_input}`
      });

      let toolResult = "";
      if (parsed.action === 'memoria.rag') {
         const memoriaHit = await buscarSimilitud(parsed.action_input, 3);
         toolResult = JSON.stringify(memoriaHit);
      } else {
         const mcpResult = await ejecutarMCP(parsed.action, { query: parsed.action_input });
         toolResult = mcpResult.error ? mcpResult.error : mcpResult.result;
      }

      await logCognitivo({
         tipo: 'TOOL_RESULT',
         mensaje: `Resultado truncado: ${typeof toolResult === 'string' ? toolResult.substring(0, 100) : 'Estructura JSON/Datos'}`
      });

      conversation.push({ role: 'assistant', content: responseText });
      conversation.push({
        role: 'user',
        content: `Resultado de la herramienta:\n${JSON.stringify(toolResult)}\nDefine tu siguiente acci�n usando la misma estructura JSON.`
      });

    } catch (e) {
      console.error('[Aegis Loop Error]', e);
      redisClient.publish('frontend_events', JSON.stringify({ type: 'ERROR', message: e.message }));
      break;
    }
  }

  return "Me qued� sin bucles de pensamiento y no pude llegar a una respuesta final.";
}
