import { createServer } from 'https';
import { parse } from 'url';
import next from 'next';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// Generate self-signed cert if missing
if (!existsSync('cert.pem') || !existsSync('key.pem')) {
  execSync(
    'openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "//CN=localhost"',
    { stdio: 'pipe' },
  );
  console.log('✓ Self-signed cert generated');
}

const dev = false;
const app = next({ dev, dir: '.', port: 3443 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const cert = readFileSync('cert.pem');
  const key = readFileSync('key.pem');
  createServer({ key, cert }, (req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(3443, '0.0.0.0', () => {
    console.log('✓ HTTPS on https://192.168.0.105:3443');
    console.log('  Phone → accept cert warning → test');
  });
});
