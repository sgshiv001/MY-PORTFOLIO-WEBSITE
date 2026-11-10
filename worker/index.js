import { securityHeaders } from '../security-headers.mjs';

// Only explicitly packaged public assets can be requested. No filesystem, secrets or upstream proxy.
const assets = /* __PORTFOLIO_ASSETS__ */ {};
const decoded = new Map();
const headers = (extra = {}) => new Headers({...securityHeaders, ...extra});
const error = (status, message, extra = {}, head = false) => new Response(head ? null : message, {
  status, headers: headers({'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store', ...extra}),
});

function bytesFor(path, file) {
  if (!decoded.has(path)) {
    const raw = atob(file.base64), bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    decoded.set(path, bytes);
  }
  return decoded.get(path);
}

export default {
  async fetch(request) {
    const url = new URL(request.url), head = request.method === 'HEAD';
    if (url.protocol === 'http:') {
      url.protocol = 'https:'; url.port = '';
      return new Response(null, {status:308, headers:headers({Location:url.href})});
    }
    if (!['GET', 'HEAD'].includes(request.method)) return error(405, 'Method not allowed', {Allow:'GET, HEAD'}, head);
    let path;
    try { path = decodeURIComponent(url.pathname); } catch { return error(400, 'Invalid request path', {}, head); }
    if (path.includes('\\') || path.includes('\0') || path.split('/').some(part => part.startsWith('.'))) return error(404, 'Not found', {}, head);
    if (path === '/') path = '/index.html';
    if (!Object.hasOwn(assets, path)) return error(404, 'Not found', {}, head);
    const file = assets[path];
    const responseHeaders = headers({
      'Content-Type':file.type,
      'Cache-Control':/\.[a-f0-9]{12}\.min\.(css|js)$/.test(path) ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
      ETag:file.etag,
      'Accept-Ranges':'bytes',
    });
    const noneMatch = request.headers.get('If-None-Match');
    if (noneMatch && noneMatch.split(',').some(value => value.trim().replace(/^W\//, '') === file.etag || value.trim() === '*')) {
      return new Response(null, {status:304, headers:responseHeaders});
    }
    const range = request.headers.get('Range'), ifRange = request.headers.get('If-Range');
    if (!head && range && (!ifRange || ifRange === file.etag)) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return error(416, 'Range not satisfiable', {'Content-Range':`bytes */${file.size}`});
      let start = match[1] ? Number(match[1]) : Math.max(0, file.size - Number(match[2]));
      let end = match[1] && match[2] ? Number(match[2]) : file.size - 1;
      end = Math.min(end, file.size - 1);
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= file.size) return error(416, 'Range not satisfiable', {'Content-Range':`bytes */${file.size}`});
      responseHeaders.set('Content-Range', `bytes ${start}-${end}/${file.size}`);
      responseHeaders.set('Content-Length', String(end - start + 1));
      return new Response(bytesFor(path, file).slice(start, end + 1), {status:206, headers:responseHeaders});
    }
    responseHeaders.set('Content-Length', String(file.size));
    return new Response(head ? null : bytesFor(path, file), {headers:responseHeaders});
  },
};
