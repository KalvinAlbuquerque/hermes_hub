const prisma = require('../database/prisma');

class GlpiService {
    constructor() {
        // Configurações carregadas das variáveis de ambiente
        this.baseUrl = process.env.GLPI_URL;
        this.appToken = process.env.GLPI_APP_TOKEN;
        this.authorization = process.env.GLPI_AUTHORIZATION;
    }

    // Inicia uma sessão no GLPI e retorna o session_token
    async initSession() {
        if (!this.baseUrl) return null;
        try {
            const headers = {
                'Content-Type': 'application/json',
                'App-Token': this.appToken
            };

            if (this.authorization) {
                headers['Authorization'] = this.authorization;
            }

            const response = await fetch(`${this.baseUrl}/initSession`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[GLPI] Falha ao iniciar sessão: ${response.status} - ${errorText}`);
                return null;
            }

            const data = await response.json();
            return data.session_token;
        } catch (e) {
            console.error("[GLPI] Erro de conexão ao iniciar sessão:", e);
            return null;
        }
    }

    // Encerra a sessão
    async killSession(sessionToken) {
        if (!sessionToken) return;
        try {
            await fetch(`${this.baseUrl}/killSession`, {
                method: 'GET',
                headers: {
                    'Session-Token': sessionToken,
                    'App-Token': this.appToken
                }
            });
        } catch (ignore) { }
    }

    // Cria um chamado no GLPI baseado na notificação
    async createTicket(notification, extraData = {}) {
        if (!this.baseUrl) {
            console.warn("[GLPI] Integração ignorada: GLPI_URL não configurada.");
            return;
        }

        console.log(`[GLPI] Iniciando criação de chamado para notificação: ${notification.id}`);
        const sessionToken = await this.initSession();

        if (!sessionToken) {
            console.error("[GLPI] Não foi possível obter token de sessão. Abortando criação de chamado.");
            return;
        }

        try {
            const timestamp = new Date().toLocaleString('pt-BR');
            const protocol = notification.protocol || "PENDENTE";

            // Substitui [PROTOCOLO] no assunto e corpo
            const subject = notification.subject.replace(/\[PROTOCOLO\]/g, protocol);

            // Tratamento básico de HTML para Texto
            let cleanBody = notification.body.replace(/\[PROTOCOLO\]/g, protocol);
            cleanBody = cleanBody.replace(/<br\s*\/?>/gi, '\n'); // Troca <br> por quebra de linha
            cleanBody = cleanBody.replace(/<\/p>/gi, '\n\n');    // Troca fim de parágrafo por quebra dupla
            cleanBody = cleanBody.replace(/<[^>]*>?/gm, '');     // Remove outras tags HTML restantes

            // Monta o cabeçalho do chamado
            let header = `Evento detectado: ${subject}\n`;
            header += `Data e Hora: ${timestamp}\n`;

            if (extraData.templateName) {
                header += `Template Utilizado: ${extraData.templateName}\n`;
            }

            if (extraData.recipientList && extraData.recipientList.length > 0) {
                header += `Notificação enviada para: ${extraData.recipientList.join(', ')}\n`;
            }

            const content = `${header}\n------------------------------------------------------------\n\nConteúdo:\n${cleanBody}`;

            // Payload
            const input = {
                input: {
                    name: `Alerta: ${subject}`,
                    content: content,
                    priority: 4,
                    entities_id: 0,
                    requesttypes_id: 1,
                    type: 1,
                    status: 1,
                    itilcategories_id: 2155,
                    locations_id: 4
                }
            };

            const response = await fetch(`${this.baseUrl}/Ticket`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Session-Token': sessionToken,
                    'App-Token': this.appToken
                },
                body: JSON.stringify(input)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[GLPI] Falha ao criar ticket: ${response.status} - ${errorText}`);
            } else {
                const result = await response.json();
                console.log("[GLPI] Chamado criado com sucesso:", result);
            }

            await this.killSession(sessionToken);

        } catch (e) {
            console.error("[GLPI] Erro ao tentar criar chamado:", e);
            await this.killSession(sessionToken);
        }
    }
}

module.exports = new GlpiService();
