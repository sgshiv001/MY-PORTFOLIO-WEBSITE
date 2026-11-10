import {readFile, writeFile, readdir, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root = dirname(fileURLToPath(import.meta.url)), publicRoot = join(root, 'public-site');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.txt':'text/plain; charset=utf-8','.cu':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'};
const assets = Object.create(null);
async function collect(directory, prefix = '') {
  for (const entry of (await readdir(directory, {withFileTypes:true})).sort((a,b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.') || entry.name === '_headers') continue;
    const name = prefix + entry.name, filename = join(directory, entry.name);
    if (entry.isDirectory()) { await collect(filename, name + '/'); continue; }
    if (!entry.isFile()) throw new Error('Public assets must be regular files');
    const ext = name.slice(name.lastIndexOf('.'));
    if (!types[ext] || name.endsWith('.map') || (ext === '.js' && !/^(site|theme)\.[a-f0-9]{12}\.min\.js$/.test(name))) throw new Error('Unexpected public asset: ' + name);
    const bytes = await readFile(filename);
    assets['/' + name] = {type:types[ext], etag:'"' + createHash('sha256').update(bytes).digest('hex') + '"', size:bytes.length, base64:bytes.toString('base64')};
  }
}
await collect(publicRoot);
const source = (await readFile(join(root,'worker/index.js'),'utf8')).replace('/* __PORTFOLIO_ASSETS__ */ {}', JSON.stringify(assets));
await mkdir(join(root,'dist/server'), {recursive:true});
await mkdir(join(root,'dist/.openai'), {recursive:true});
await build({stdin:{contents:source,resolveDir:join(root,'worker'),sourcefile:'index.js'},bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,sourcemap:false,legalComments:'none',outfile:join(root,'dist/server/index.js')});
const manifest = JSON.parse(await readFile(join(root,'.openai/hosting.json'),'utf8'));
if (manifest.static) throw new Error('Worker builds must omit static configuration');
await writeFile(join(root,'dist/.openai/hosting.json'), JSON.stringify(manifest) + '\n');
console.log('Built security-header Worker with ' + Object.keys(assets).length + ' allowlisted public files.');
