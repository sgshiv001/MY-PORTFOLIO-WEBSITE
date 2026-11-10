import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {securityHeaders} from '../security-headers.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compiled = await readFile(join(root, 'dist/server/index.js'));
const {default:worker} = await import('data:text/javascript;base64,' + compiled.toString('base64'));
const request = (path, options) => worker.fetch(new Request('https://shivanshuguptaportfolio.me' + path, options));
const verifyHeaders = response => {
  for (const [name,value] of Object.entries(securityHeaders)) assert.equal(response.headers.get(name),value,name);
};
let count = 0;
async function checkAssets(directory, prefix = '') {
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    if (entry.name.startsWith('.') || entry.name === '_headers') continue;
    const name = prefix + entry.name;
    if (entry.isDirectory()) { await checkAssets(join(directory,entry.name),name + '/'); continue; }
    const response = await request('/' + name);
    assert.equal(response.status,200,name); verifyHeaders(response);
    const bytes = Buffer.from(await response.arrayBuffer()), original = await readFile(join(directory,entry.name));
    assert.deepEqual(bytes,original,'Public bytes must be unchanged: ' + name);
    const head = await request('/' + name,{method:'HEAD'});
    assert.equal(head.status,200); assert.equal((await head.arrayBuffer()).byteLength,0); assert.equal(head.headers.get('Content-Length'),String(original.length));
    const cached = await request('/' + name,{headers:{'If-None-Match':response.headers.get('ETag')}});
    assert.equal(cached.status,304); verifyHeaders(cached);
    count++;
  }
}
await checkAssets(join(root,'public-site'));
const home = await request('/');
assert.equal(home.status,200); assert.match(await home.text(),/Shivanshu/);
for (const path of ['/.env','/.git/config','/.openai/hosting.json','/src/app.js','/server/index.js','/security-headers.mjs','/build.mjs','/_headers','/site.min.js.map','/missing','/%2eenv','/%5c.env']) {
  const response = await request(path); assert.equal(response.status,404,path); verifyHeaders(response);
}
const malformed = await request('/%zz'); assert.equal(malformed.status,400); verifyHeaders(malformed);
for (const method of ['POST','PUT','DELETE','OPTIONS']) {
  const response = await request('/',{method}); assert.equal(response.status,405); assert.equal(response.headers.get('Allow'),'GET, HEAD'); verifyHeaders(response);
}
const redirect = await worker.fetch(new Request('http://shivanshuguptaportfolio.me/?a=1'));
assert.equal(redirect.status,308); assert.equal(redirect.headers.get('Location'),'https://shivanshuguptaportfolio.me/?a=1'); verifyHeaders(redirect);
const resume = '/assets/Shivanshu_Gupta_ATS_Resume.pdf', original = await readFile(join(root,'public-site',resume));
const partial = await request(resume,{headers:{Range:'bytes=0-31'}});
assert.equal(partial.status,206); assert.deepEqual(Buffer.from(await partial.arrayBuffer()),original.subarray(0,32)); verifyHeaders(partial);
const suffix = await request(resume,{headers:{Range:'bytes=-10'}});
assert.equal(suffix.status,206); assert.deepEqual(Buffer.from(await suffix.arrayBuffer()),original.subarray(-10));
assert.equal((await request(resume,{headers:{Range:'bytes=99999999-'}})).status,416);
assert.equal((await request(resume,{headers:{Range:'bytes=0-3,6-9'}})).status,416);
assert.equal((await request(resume,{headers:{Range:'bytes=0-31','If-Range':'"changed"'}})).status,200);
assert.match(securityHeaders['Content-Security-Policy'],/frame-ancestors 'none'/);
assert.doesNotMatch(securityHeaders['Content-Security-Policy'],/script-src[^;]*unsafe-/);
const manifest = JSON.parse(await readFile(join(root,'dist/.openai/hosting.json'),'utf8'));
assert.equal(manifest.project_id,'appgprj_6abec151e4688191b7fb85442e9842b9'); assert.equal(manifest.static,undefined);
console.log(`Passed: all ${count} public assets byte-for-byte, GET/HEAD/cache, HTTPS redirects, security headers, private-file isolation, method restrictions and resume byte ranges.`);
