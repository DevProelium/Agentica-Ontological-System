import { redisClient } from './db.js';
import { buscarSimilitud } from './vectorStore.js';
import { agenticLoop } from './agenticLoop.js';

// Mapa exacto para el metaverso
const CRISALIDA_EMOTIONS = {
    atento: 'Idle',
    procesando_conocimiento: 'Thinking',
    contemplativo: 'Idle',
    curioso: 'Thinking',
    concentrado: 'Thinking',
    feliz: 'Happy',
    triste: 'Sad',
    hablando: 'Talking'
};

export async function updateAgentState(state) {
  try {
    const payload = JSON.stringify({
        ...state,
        updated_at: new Date().toISOString()
    });

    // Guardar el estado actual general
    await redisClient.set('aegis:state:current', payload);

    // TRADUCTOR HACIA MIKO (CRISÁLIDA 3D)
    const eventPayload = {
      type: 'STATE_CHANGED',
      userId: state.userId || 'default-user-uuid',
      agentId: state.agentId || 'aegis-core-agent-uuid',
      emotion: CRISALIDA_EMOTIONS[state.estado] || CRISALIDA_EMOTIONS[state.emocion] || 'Idle',
      task: state.actividad_actual || 'Esperando en el escritorio...'
    };

    await redisClient.publish('aegis-events', JSON.stringify(eventPayload));

    console.log('[Aegis Cognición] Estado replicado:', eventPayload.emotion, '-', eventPayload.task);
  } catch (error) {
    console.error('[Aegis Cognición] Error sincronizando estado a Redis:', error.message);
  }
}

export async function getAgentState() {
    try {
        const data = await redisClient.get('aegis:state:current');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
}

export async function addShortTermMemory(action) {
    try {
        const memoryKey = 'aegis:state:recent_actions';
        const payload = JSON.stringify({ action, timestamp: new Date().toISOString() });
        await redisClient.lPush(memoryKey, payload);
        await redisClient.lTrim(memoryKey, 0, 19);
        await redisClient.publish('aegis-events', JSON.stringify({ type: 'NEW_MEMORY', data: action }));
    } catch (error) {}
}

/**
 * Suscribirse a órdenes que vienen en voz/texto desde el Metaverso
 */
export async function iniciarTelepatiaInversa() {
    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    console.log('?? [Aegis] Oído telepático conectado al canal "metaverse-events".');

    await subscriber.subscribe('metaverse-events', async (message) => {
        try {
            const peticion = JSON.parse(message);
            console.log('[Aegis] ?? Voz desde Crisálida:', peticion);

            if (peticion.type === 'RAG_REQUEST') {
                // AHORA REDIRIGIMOS AL AGENTIC LOOP!
                // Aegis decidirá SI necesita RAG, si busca en Google (SearXNG), o ambas.
                const respuestaFinal = await agenticLoop(
                    peticion.query, 
                    peticion.userId || 'metaverse-user'
                );

                // Enviar la respuesta final narrada de vuelta al Metaverso para que el avatar hable
                await redisClient.publish('aegis-events', JSON.stringify({      
                    type: 'RAG_RESPONSE',
                    id_peticion: peticion.id || 'unknown',
                    data: { contexto: respuestaFinal }
                }));

                await updateAgentState({ 
                    userId: peticion.userId || 'metaverse-user',
                    estado: 'atento', 
                    actividad_actual: 'Ciclo autónomo completado.' 
                });
            }
        } catch (err) {
            console.error('[Aegis] No se entendió el mensaje:', err.message);
        }
    });
}
