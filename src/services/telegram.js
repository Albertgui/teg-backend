import { Telegraf } from 'telegraf';
import { BOT_TOKEN, CHAT_ID } from '../config.js';

const bot = new Telegraf(BOT_TOKEN);

const fmt = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const convertidorFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const dateObj = new Date(fecha);
    return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const sendProjectNotification = async (datos, accion = "ACTUALIZACIÓN") => {
    const margenActual = Number(datos.porcentaje_margen || 0);
    const margenObjetivo = Number(datos.margen_objetivo || 0);
    const presupuestoUsado = Number(datos.presupuesto_usado || 0);
    const presupuestoPlanificado = Number(datos.presupuesto_planificado || 0);
    let alertas = [];
    let emojiHeader = '🚀';
    if (margenActual < 0) {
        emojiHeader = '💀';
        alertas.push(`🆘 *ALERTA DE PÉRDIDA:* ¡El proyecto está en números rojos! (${margenActual}%)`);
    } else if (margenActual < margenObjetivo) {
        emojiHeader = '🚨';
        alertas.push(`🛑 *ALERTA DE RENTABILIDAD:* Margen (${margenActual}%) inferior al objetivo (${margenObjetivo}%).`);
    }
    if (margenActual <= 10 && margenActual >= 0) {
        alertas.push(`⚠️ *ZONA DE RIESGO:* El margen de ganancia es crítico (≤ 10%).`);
    }
    if (presupuestoUsado > presupuestoPlanificado) {
        alertas.push(`💸 *EXCESO DE PRESUPUESTO:* Se ha superado el costo planificado.`);
    }
    const headers = {
        'NUEVO PROYECTO': `✨ ¡NUEVO PROYECTO CREADO!`,
        'EDICIÓN': `⚙️ PROYECTO MODIFICADO`,
        'ELIMINACIÓN': `🗑️ PROYECTO ELIMINADO`
    };
    const header = headers[accion] || `📊 ACTUALIZACIÓN DE ESTADO`;

    const mensaje = `
${emojiHeader} *${header}* ${emojiHeader}
🏗️ *Obra:* ${datos.nombre}
📉 *Estado:* ${datos.estado.toUpperCase()}

💰 *RESUMEN FINANCIERO:*
• Usado: \`${fmt(presupuestoUsado)}\` / \`${fmt(presupuestoPlanificado)}\`
• Ganancia: \`${fmt(datos.ganancia_actual)}\`
• Margen: \`${margenActual}%\` (Target: ${margenObjetivo}%)
${alertas.length > 0 ? alertas.join('\n') + '\n' : ''}
📊 *AVANCE FÍSICO:* \`${datos.porcentaje_avance}%\`
🕒 ${new Date().toLocaleString()}
    `;
    try {
        await bot.telegram.sendMessage(CHAT_ID, mensaje, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error en Telegram Project:', error);
    }
};

export const sendPartidaNotification = async (nombreProyecto, partida, accion = "CAMBIO") => {
    let emoji = '📝';
    let titulo = 'CAMBIO EN PARTIDA';
    if (partida.porcentaje_avance == 100) {
        emoji = '✅'; titulo = 'PARTIDA FINALIZADA';
    } else if (accion === 'CREACIÓN') {
        emoji = '➕'; titulo = 'NUEVA PARTIDA';
    }
    const mensaje = `
${emoji} *${titulo}*
🏗️ *Proyecto:* ${nombreProyecto}
🛠️ *Partida:* ${partida.nombre_partida}
💵 *Costo:* \`${fmt(partida.monto_total)}\`
📉 *Progreso:* \`${partida.porcentaje_avance}%\`
📅 *Finaliza:* ${convertidorFecha(partida.fecha_final_estimada)}
    `;
    try {
        await bot.telegram.sendMessage(CHAT_ID, mensaje, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error en Telegram Partida:', error);
    }
};