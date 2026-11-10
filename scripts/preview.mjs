import http from 'node:http';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../dist/server/index.js',import.meta.url));
const {default:worker} = await import('data:text/javascript;base64,' + source.toString('base64'));
const server = http.createServer(async (incoming,outgoing) => {
  try {
    const response = await worker.fetch(new Request(new URL(incoming.url,'https://127.0.0.1:4173'),{method:incoming.method,headers:incoming.headers}));
    const headers = Object.fromEntries(response.headers);
    // Loopback preview is HTTP; live deployment retains HTTPS upgrade and HSTS.
    headers['content-security-policy'] = headers['content-security-policy'].replace('; upgrade-insecure-requests','');
    delete headers['strict-transport-security'];
    outgoing.writeHead(response.status,headers);
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch { outgoing.writeHead(500,{'Content-Type':'text/plain'}); outgoing.end('Preview error'); }
});
server.listen(4173,'127.0.0.1',() => console.log('Local: http://127.0.0.1:4173'));
