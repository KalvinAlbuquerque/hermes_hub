const fs = require('fs');
const path = require('path');
const https = require('https');

// Carregar .env manualmente
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            let val = value.trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            process.env[key.trim()] = val;
        }
    });
}

const GLPI_URL = process.env.GLPI_URL;
const APP_TOKEN = process.env.GLPI_APP_TOKEN;
const AUTHORIZATION = process.env.GLPI_AUTHORIZATION;

async function fetchJson(url, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data); // Return text if not json
                    }
                } else {
                    reject(new Error(`Status: ${res.statusCode}, Body: ${data}`));
                }
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

// Simples wrapper fetch já que node < 18 pode não ter fetch global, mas este user tem v24, então fetch existe.
// Usando fetch nativo é mais fácil.

async function initSession() {
    if (!GLPI_URL) return null;
    try {
        const headers = {
            'Content-Type': 'application/json',
            'App-Token': APP_TOKEN
        };
        if (AUTHORIZATION) headers['Authorization'] = AUTHORIZATION;

        const response = await fetch(`${GLPI_URL}/initSession`, { method: 'GET', headers });
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
        return data.session_token;
    } catch (e) {
        console.error("Erro initSession:", e);
        return null;
    }
}

async function killSession(sessionToken) {
    if (!sessionToken) return;
    try {
        await fetch(`${GLPI_URL}/killSession`, {
            method: 'GET',
            headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN }
        });
    } catch (e) { }
}

async function searchGlpi() {
    console.log("Iniciando busca no GLPI (Standalone)...");

    if (!GLPI_URL) {
        console.error("GLPI_URL não definida no .env!");
        return;
    }

    const sessionToken = await initSession();
    if (!sessionToken) return;

    try {
        const headers = { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN };

        const search = async (endpoint, term) => {
            console.log(`\n--- Buscando ${endpoint} (${term}) ---`);
            const url = `${GLPI_URL}/${endpoint}?range=0-500&searchText=${encodeURIComponent(term)}`;
            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        console.log(`[${endpoint}] ID: ${item.id} | Name: ${item.name} | Complete: ${item.completename}`);
                    });
                } else {
                    console.log("Nenhum resultado ou formato inesperado.");
                }
            } else {
                console.error("Erro na busca:", await res.text());
            }
        };

        await search('ITILCategory', 'Incidentes');
        await search('Location', 'Segurança');
        await search('Location', 'GESEG');
        await search('Entity', 'GESEG'); // Caso seja entidade

    } catch (error) {
        console.error("Erro geral:", error);
    } finally {
        await killSession(sessionToken);
    }
}

searchGlpi();
