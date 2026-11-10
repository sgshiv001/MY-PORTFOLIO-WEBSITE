import { readFile, writeFile, readdir, unlink, mkdir, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { transform } from 'esbuild';
import { securityHeaders } from './security-headers.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const source = join(root, 'src');
const output = join(root, 'public-site');
await mkdir(output, {recursive:true});
await cp(join(source, 'assets'), join(output, 'assets'), {recursive:true});
for (const file of ['robots.txt', 'sitemap.xml']) await cp(join(source, file), join(output, file));
const scripts = ['profile.js', 'project-data.js', 'app.js', 'showcase.js', 'sections.js', 'project-rail.js', 'theme.js'];
const styles = ['style.css', 'cinematic.css', 'sections.css', 'showcase.css', 'project-rail.css', 'responsive.css', 'themes.css', 'certificates.css', 'work.css'];
const read = (name) => readFile(join(source, name), 'utf8');
const javascript = "document.documentElement.classList.add('js');\n" + (await Promise.all(scripts.map(read))).join('\n;\n');
const fonts = (await Promise.all(['assets/fonts.css', 'assets/typefaces.css'].map(read)))
  .join('\n').replace(/url\(([^)]+)\)/g, 'url(assets/$1)');
const css = fonts + '\n' + (await Promise.all(styles.map(read))).join('\n');
const compiledJs = await transform(javascript, {loader:'js', minify:true, format:'iife', target:['es2020'], legalComments:'none', charset:'utf8', sourcemap:false});
const compiledCss = await transform(css, {loader:'css', minify:true, target:['chrome100', 'safari15'], legalComments:'none', charset:'utf8', sourcemap:false});
const compiledInit = await transform(await read('theme-init.js'), {loader:'js', minify:true, target:['es2020'], legalComments:'none', sourcemap:false});
const hash = (code) => createHash('sha256').update(code).digest('hex').slice(0,12);
const integrity = (code) => 'sha384-' + createHash('sha384').update(code).digest('base64');
const jsName = `site.${hash(compiledJs.code)}.min.js`;
const cssName = `site.${hash(compiledCss.code)}.min.css`;
const initName = `theme.${hash(compiledInit.code)}.min.js`;
let html = await read('index.html');
html = html.replace(/\s*<link rel="stylesheet"[^>]+>/g, '')
  .replace(/\s*<script>document.documentElement.classList.add\('js'\);<\/script>/, '')
  .replace(/\s*<script src="[^\"]+" defer><\/script>/g, '')
  .replace('</head>', `  <script src="${initName}" integrity="${integrity(compiledInit.code)}" crossorigin="anonymous"></script>\n  <link rel="stylesheet" href="${cssName}" integrity="${integrity(compiledCss.code)}" crossorigin="anonymous">\n  <script src="${jsName}" integrity="${integrity(compiledJs.code)}" crossorigin="anonymous" defer></script>\n</head>`)
  .replace(/<!--[\s\S]*?-->/g, '').replace(/^[ \t]+/gm, '').replace(/\r\n/g, '\n');
await writeFile(join(output, jsName), compiledJs.code);
await writeFile(join(output, cssName), compiledCss.code);
await writeFile(join(output, initName), compiledInit.code);
await writeFile(join(output, 'index.html'), html);
await writeFile(join(output, '_headers'), '/*\n' + Object.entries(securityHeaders).map(([name, value]) => `  ${name}: ${value}`).join('\n') + '\n');
// Only generated browser bundles are public. Editable source stays outside dist.
const retired = new Set([...scripts, ...styles, 'app.min.js', 'site.min.css']);
for (const file of await readdir(output)) {
  if (retired.has(file) || (/^(site|theme)\.[a-f0-9]{12}\.min\.(css|js)$/.test(file) && ![jsName, cssName, initName].includes(file))) {
    const target = resolve(output, file);
    if (dirname(target) !== resolve(output)) throw new Error('Invalid build output path');
    await unlink(target);
  }
}
for (const file of ['fonts.css','typefaces.css']) await unlink(join(output,'assets',file)).catch(error=>{if(error.code !== 'ENOENT') throw error;});
console.log(JSON.stringify({javascript:jsName, stylesheet:cssName, sourceBytes:Buffer.byteLength(javascript)+Buffer.byteLength(css), publishedBytes:Buffer.byteLength(compiledJs.code)+Buffer.byteLength(compiledCss.code), sourcemaps:false}));
await import('./build-server.mjs');
