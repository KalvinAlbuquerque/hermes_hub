// Arquivo: backend/src/services/SettingsService.js
const prisma = require('../database/prisma');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'a_default_32_character_key_!!__';
const IV_LENGTH = 16;

// --- NOVA TRAVA DE SEGURANÇA ---
// Este código irá verificar a chave assim que o servidor arrancar.
if (Buffer.from(ENCRYPTION_KEY).length !== 32) {
  console.error('\n\n--- ERRO CRÍTICO DE CONFIGURAÇÃO ---');
  console.error('A sua SETTINGS_ENCRYPTION_KEY é inválida.');
  console.error(`O comprimento da chave é ${Buffer.from(ENCRYPTION_KEY).length}, mas precisa de ser exatamente 32 caracteres.`);
  console.error('Verifique a sua variável de ambiente no ficheiro "docker-compose.yml".');
  console.error('--- O SERVIDOR SERÁ ENCERRADO ---\n\n');
  process.exit(1); // Encerra o processo com um código de erro.
}
// --- FIM DA TRAVA DE SEGURANÇA ---

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text || typeof text !== 'string' || !text.includes(':')) {
        console.error("Tentativa de decriptografar um valor inválido:", text);
        return ''; // Retorna uma string vazia para evitar que a aplicação quebre
    }
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// ... (o resto das funções, getSettings e updateSettings, permanecem iguais)
async function getSettings() {
    const settingsList = await prisma.systemSetting.findMany();
    const settings = {};
    for (const setting of settingsList) {
        if (setting.key === 'smtpPass' && setting.value) {
            settings[setting.key] = decrypt(setting.value);
        } else {
            settings[setting.key] = setting.value;
        }
    }
    return settings;
}

async function updateSettings(newSettings) {
    for (const key in newSettings) {
        let value = newSettings[key];
        if (key === 'smtpPass' && value) {
            value = encrypt(value);
        }
        await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
}

module.exports = { getSettings, updateSettings, encrypt, decrypt };