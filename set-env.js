// ==========================================================
// Genera src/environments/environment*.ts a partir del .env
// (Angular NO lee .env en runtime: hay que inyectar la URL en build).
// Prioridad de la URL: process.env.API_URL  >  .env (API_URL)  >  fallback.
// Se ejecuta automaticamente via "prestart" y "prebuild" (package.json).
// ==========================================================
const fs = require('fs');
const path = require('path');

const FALLBACK = 'http://localhost:8000/api';

/** Parser .env minimo (sin dependencias). */
function parseDotEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const dotenv = parseDotEnv(path.join(__dirname, '.env'));
// process.env (ej: variable seteada en el panel de Vercel) tiene prioridad.
const apiUrl = process.env.API_URL || dotenv.API_URL || FALLBACK;

const header =
  '// ARCHIVO AUTO-GENERADO por set-env.js. NO editar a mano.\n' +
  '// Cambia la URL en el archivo .env (variable API_URL).\n';

const files = {
  'src/environments/environment.ts': true, // produccion
  'src/environments/environment.development.ts': false, // desarrollo
};

for (const [rel, production] of Object.entries(files)) {
  const content =
    header +
    `export const environment = {\n` +
    `  production: ${production},\n` +
    `  apiUrl: '${apiUrl}',\n` +
    `};\n`;
  fs.writeFileSync(path.join(__dirname, rel), content, 'utf8');
}

console.log(`[set-env] apiUrl = ${apiUrl}`);
