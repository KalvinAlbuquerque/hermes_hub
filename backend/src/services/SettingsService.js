// Arquivo: backend/src/services/SettingsService.js
const prisma = require('../database/prisma');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// IMPORTANTE: Esta chave DEVE ser mantida em segredo e ter 32 caracteres.
// Ela permanece nas variáveis de ambiente, pois é a "chave mestra" do cofre.
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'a_default_32_character_secret_key'; // Use uma chave segura em produção
const IV_LENGTH = 16; // Para AES, este é sempre 16

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Busca todas as configurações e desencripta a palavra-passe do SMTP se existir
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

// Guarda as configurações, encriptando a palavra-passe do SMTP
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