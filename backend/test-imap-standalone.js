// Arquivo: backend/test-imap-standalone.js
const imaps = require('imap-simple');
const dns = require('dns');

// Força a preferência por IPv4, tal como na nossa aplicação
dns.setDefaultResultOrder('ipv4first');

// Pega as credenciais diretamente das variáveis de ambiente
const config = {
    imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD,
        host: process.env.IMAP_HOST,
        port: parseInt(process.env.IMAP_PORT || '993'),
        tls: process.env.IMAP_TLS === 'true',
        authTimeout: 15000 // Aumentamos o timeout para 15 segundos para ter a certeza
    }
};

console.log(`[TESTE] A tentar conectar a ${config.imap.host} com o utilizador ${config.imap.user}...`);

async function runTest() {
    if (!config.imap.user || !config.imap.password) {
        console.error('[ERRO] As variáveis de ambiente IMAP_USER e IMAP_PASSWORD não foram encontradas!');
        return;
    }

    try {
        const connection = await imaps.connect(config);
        console.log('*************************************');
        console.log('* SUCESSO! Conexão IMAP estabelecida. *');
        console.log('*************************************');
        await connection.close();
    } catch (error) {
        console.error('*****************************************');
        console.error('* FALHA! Não foi possível conectar.       *');
        console.error('*****************************************');
        console.error('Detalhes do Erro:', error);
    }
}

runTest();