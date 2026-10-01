import { readFileSync } from 'node:fs';

const envPath = '.env.production';

try {
  const env = readFileSync(envPath, 'utf8');
  const apiUrl = env
    .split(/\r?\n/)
    .find((line) => line.startsWith('VITE_API_URL='))
    ?.slice('VITE_API_URL='.length)
    .trim();

  if (!apiUrl || apiUrl.startsWith('/') || !apiUrl.startsWith('https://')) {
    throw new Error(`VITE_API_URL doit etre une URL HTTPS publique dans ${envPath}.`);
  }
} catch (error) {
  console.error(`Release impossible: ${error.message}`);
  process.exit(1);
}

console.log('Configuration API de production validee.');