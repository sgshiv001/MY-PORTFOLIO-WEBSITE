/* Public GitHub reads only. Repository content is rendered as text and safe links. */
(() => {
  'use strict';
  const details = window.portfolioProjectDetails || {};
  const snapshots = window.projectSnapshots || {};
  const dialog = document.getElementById('project-dialog');
  const byId = id => document.getElementById(id);
  const cache = new Map();
  let activeKey, opener, controller, requestNumber = 0, images = [], imageIndex = 0, previousOverflow = '';
  const create = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function safeLink(value, base) {
    try {
      const url = new URL(value, base);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }
  function externalLink(text, href) {
    const link = create('a', text);
    link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
    return link;
  }
  function inline(parent, value, base) {
    // No repository HTML is inserted into the page, including code and image captions.
    const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^\s)]+\))/g;
    let match, cursor = 0;
    while ((match = pattern.exec(value))) {
      parent.append(document.createTextNode(value.slice(cursor, match.index)));
      const token = match[0];
      if (token.startsWith('`')) parent.append(create('code', token.slice(1, -1)));
      else if (token.startsWith('**')) parent.append(create('strong', token.slice(2, -2)));
      else {
        const parts = token.match(/^\[([^\]]+)\]\((.+)\)$/);
        const href = safeLink(parts[2], base);
        parent.append(href ? externalLink(parts[1], href) : document.createTextNode(parts[1]));
      }
      cursor = pattern.lastIndex;
    }
    parent.append(document.createTextNode(value.slice(cursor)));
  }
  function renderReadme(data) {
    const target = byId('readme-content'); target.replaceChildren();
    const base = `${data.repository}/blob/${encodeURIComponent(data.branch || 'main')}/`;
    target.append(externalLink('Read the original on GitHub ↗', data.readmeUrl || `${data.repository}#readme`));
    const lines = String(data.readme || 'No README is currently published in this repository. Open the repository to see its current status.').split(/\r?\n/);
    let list = null, pre = null, fence = null, paragraph = [], table = null, comment = false;
    const flush = () => {
      if (paragraph.length) { const p = create('p'); inline(p, paragraph.join(' '), base); target.append(p); paragraph = []; }
      list = null; table = null;
    };
    for (let raw of lines) {
      if (pre) {
        const end = raw.match(/^\s*(`{3,}|~{3,})\s*$/);
        if (end && end[1][0] === fence[0] && end[1].length >= fence.length) { pre = null; fence = null; } else { pre.firstChild.append(document.createTextNode(`${raw}\n`)); }
        continue;
      }
      const start = raw.match(/^\s*(`{3,}|~{3,})/);
      if (start) { flush(); fence = start[1]; pre = create('pre'); pre.append(create('code')); target.append(pre); continue; }
      if (raw.includes('<!--')) comment = true;
      if (comment) { if (raw.includes('-->')) comment = false; continue; }
      // Raw HTML tags and inline images are omitted; the image gallery has accessible captions.
      const line = raw.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[\s*\]\([^)]*\)/g, '').replace(/<[^>]*>/g, '').trim();
      if (!line) { flush(); continue; }
      if (/^(?:\[!|\[?https?:\/\/.*shields\.io)/.test(line)) continue;
      const heading = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
      if (heading) { flush(); const h = create(`h${Math.min(heading[1].length + 1, 6)}`); inline(h, heading[2], base); target.append(h); continue; }
      if (/^[-*_]{3,}$/.test(line)) { flush(); target.append(create('hr')); continue; }
      if (/^\|.*\|$/.test(line)) {
        if (/^\|[\s:|\-]+\|$/.test(line)) continue;
        if (!table) { flush(); const frame = create('div', undefined, 'readme-table-wrap'); table = create('table'); frame.append(table); target.append(frame); }
        const row = create('tr');
        const first = table.childElementCount === 0;
        line.slice(1, -1).split('|').forEach(cell => { const td = create(first ? 'th' : 'td'); if (first) td.scope = 'col'; inline(td, cell.trim(), base); row.append(td); });
        table.append(row); continue;
      }
      const item = line.match(/^(?:[-*+]\s+|\d+\.\s+)(.*)/);
      if (item) {
        if (!list) { flush(); list = create(/^\d/.test(line) ? 'ol' : 'ul'); target.append(list); }
        const li = create('li'); inline(li, item[1], base); list.append(li); continue;
      }
      if (/^>\s?/.test(line)) { flush(); const quote = create('blockquote'); inline(quote, line.replace(/^>\s?/, ''), base); target.append(quote); continue; }
      if (list || table) flush();
      paragraph.push(line);
    }
    flush();
  }
  function imageFromReadme(path, title, data, saved) {
    // Only images belonging to this repository can become gallery images.
    let relative = path.replace(/^\.\//, '');
    if (/^https?:/i.test(relative)) {
      try {
        const url = new URL(relative);
        const prefix = `/sgshiv001/${data.repo}/${data.branch || 'main'}/`;
        if (url.hostname !== 'raw.githubusercontent.com' || !url.pathname.startsWith(prefix)) return null;
        relative = decodeURIComponent(url.pathname.slice(prefix.length));
      } catch { return null; }
    }
    if (!/\.(png|jpe?g|webp|svg)(?:\?.*)?$/i.test(relative) || relative.split('/').includes('..') || /badge|shield|logo|icon/i.test(relative)) return null;
    const original = `https://raw.githubusercontent.com/sgshiv001/${encodeURIComponent(data.repo)}/${encodeURIComponent(data.branch || 'main')}/${relative.split('/').map(encodeURIComponent).join('/')}`;
    const fallback = saved.find(item => item.path === relative);
    return {path: relative, title: title || relative.split('/').pop(), src: original, original, fallback: fallback?.src};
  }
  function repositoryImages(data, live) {
    const saved = snapshots[activeKey]?.images || [];
    if (!live) return saved;
    const found = [], pattern = /!\[([^\]]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g;
    let match;
    while ((match = pattern.exec(data.readme || ''))) {
      const item = imageFromReadme(match[2], match[1], data, saved);
      if (item && !found.some(existing => existing.path === item.path)) found.push(item);
      if (found.length >= 12) break;
    }
    return found.length ? found : saved;
  }
  function showImage(index) {
    if (!images.length) return;
    imageIndex = (index + images.length) % images.length;
    const item = images[imageIndex], img = byId('gallery-image');
    img.classList.add('is-changing');
    img.onerror = () => {
      if (item.fallback && !img.src.endsWith(item.fallback)) { img.src = item.fallback; return; }
      img.classList.remove('is-changing'); img.hidden = true; byId('gallery-image-error').hidden = false;
    };
    img.onload = () => img.classList.remove('is-changing');
    img.hidden = false; byId('gallery-image-error').hidden = true;
    img.alt = item.title; img.src = item.src;
    if (img.complete && img.naturalWidth) requestAnimationFrame(() => img.classList.remove('is-changing'));
    byId('gallery-original').href = item.original;
    byId('gallery-caption').textContent = item.title;
    byId('gallery-count').textContent = `${String(imageIndex + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
    byId('gallery-previous').disabled = byId('gallery-next').disabled = images.length < 2;
    byId('showcase-gallery').querySelector('.gallery-figure').scrollTop = 0;
    byId('gallery-thumbnails').querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === imageIndex)));
  }
  function renderImages(data, live) {
    const previousPath = images[imageIndex]?.path;
    images = repositoryImages(data, live);
    dialog.classList.toggle('has-no-gallery', !images.length);
    byId('showcase-gallery').hidden = !images.length;
    const thumbnails = byId('gallery-thumbnails'); thumbnails.replaceChildren();
    images.forEach((item, index) => {
      const button = create('button'); button.type = 'button'; button.setAttribute('aria-label', `Show image ${index + 1}: ${item.title}`);
      const img = create('img'); img.src = item.fallback || item.src; img.alt = ''; img.loading = 'lazy';
      button.append(img, create('span', String(index + 1).padStart(2, '0')));
      button.addEventListener('click', () => showImage(index)); thumbnails.append(button);
    });
    showImage(Math.max(0, images.findIndex(item => item.path === previousPath)));
  }
  function renderData(data, live) {
    byId('dialog-summary').textContent = data.description || details[activeKey].summary;
    const languages = byId('showcase-languages'); languages.replaceChildren();
    (data.languages || []).forEach(language => languages.append(create('span', language)));
    renderImages(data, live); renderReadme(data);
    byId('github-source-date').textContent = data.fetchedAt ? `GitHub data checked ${new Date(data.fetchedAt).toLocaleString(undefined, {dateStyle:'medium', timeStyle:'short'})}` : '';
  }
  function selectPanel(name, focus = false) {
    for (const item of ['overview', 'readme']) {
      const selected = name === item, tab = byId(item === 'overview' ? 'overview-tab' : 'readme-tab');
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      byId(`showcase-${item}`).hidden = !selected;
      if (selected && focus) tab.focus();
    }
  }
  async function refresh(force = false) {
    const key = activeKey, saved = snapshots[key];
    if (!saved) return;
    controller?.abort(); const number = ++requestNumber;
    const cached = cache.get(key);
    if (!force && cached && Date.now() - cached.time < 600000) {
      renderData(cached.data, true); byId('refresh-project').disabled = false; byId('github-source-status').textContent = 'Updated from GitHub · recent check'; return;
    }
    controller = new AbortController();
    const thisController = controller, timer = setTimeout(() => thisController.abort(), 8000);
    byId('github-source-status').textContent = 'Checking GitHub…'; byId('refresh-project').disabled = true;
    try {
      const api = `https://api.github.com/repos/sgshiv001/${encodeURIComponent(saved.repo)}`;
      const get = async (suffix, allowMissing = false) => {
        const response = await fetch(`${api}${suffix}`, {headers:{Accept:'application/vnd.github+json'}, signal:thisController.signal});
        if (allowMissing && [404,409].includes(response.status)) return null;
        if (!response.ok) throw new Error(`GitHub ${response.status}`);
        return response.json();
      };
      const [metadata, readme, languages] = await Promise.all([get(''), get('/readme', true), get('/languages', true)]);
      if (readme && (readme.encoding !== 'base64' || typeof readme.content !== 'string')) throw new Error('README format unavailable');
      const bytes = readme ? Uint8Array.from(atob(readme.content.replace(/\s/g, '')), character => character.charCodeAt(0)) : new Uint8Array();
      const data = {...saved, branch:metadata.default_branch || saved.branch, description:metadata.description || details[key].summary,
        readme:new TextDecoder().decode(bytes), readmeUrl:safeLink(readme?.html_url) || saved.readmeUrl,
        languages:Object.keys(languages || {}), fetchedAt:new Date().toISOString()};
      if (number !== requestNumber || activeKey !== key || !dialog.open) return;
      cache.set(key, {data, time:Date.now()}); renderData(data, true);
      byId('github-source-status').textContent = 'Updated from GitHub';
    } catch {
      if (number !== requestNumber || activeKey !== key || !dialog.open) return;
      byId('github-source-status').textContent = 'Saved GitHub copy · live update unavailable';
    } finally {
      clearTimeout(timer);
      if (number === requestNumber) byId('refresh-project').disabled = false;
    }
  }
  function openProject(key, trigger) {
    const item = details[key]; if (!item) return;
    controller?.abort(); requestNumber++; activeKey = key; opener = trigger; images = []; imageIndex = 0;
    const learning = !snapshots[key]; dialog.classList.toggle('is-learning', learning);
    dialog.classList.toggle('has-no-gallery', learning);
    byId('dialog-title').textContent = item.title; byId('dialog-status').textContent = item.status;
    byId('summary-source').textContent = learning ? 'PROJECT SUMMARY' : 'GITHUB REPOSITORY DESCRIPTION';
    dialog.querySelector('.gallery-source-note').textContent = key === 'inventory' ? 'SVG interface previews from the project’s GitHub repository.' : key === 'neet' ? 'Banner artwork from the project’s GitHub repository; not an application screenshot.' : 'Actual screenshots from the project’s GitHub repository.';
    const body = byId('dialog-body'); body.replaceChildren(create('h3', item.heading));
    const list = create('ul'); item.points.forEach(point => list.append(create('li', point))); body.append(list, create('p', item.note, 'dialog-note'));
    byId('showcase-repository').hidden = learning; byId('refresh-project').hidden = learning;
    byId('readme-tab').hidden = learning; byId('github-source-status').textContent = learning ? 'Portfolio case study' : 'Saved GitHub copy';
    byId('github-source-date').textContent = ''; selectPanel('overview');
    if (learning) {
      byId('dialog-summary').textContent = item.summary; byId('showcase-gallery').hidden = true; byId('showcase-languages').replaceChildren();
    } else {
      byId('showcase-repository').href = item.repository; renderData(snapshots[key], false);
    }
    if (!dialog.open) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; dialog.showModal(); }
    if (!learning) refresh();
  }
  document.querySelectorAll('[data-project]').forEach(trigger => trigger.addEventListener('click', () => openProject(trigger.dataset.project, trigger)));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    controller?.abort(); requestNumber++; document.body.style.overflow = previousOverflow;
    opener?.focus({preventScroll:true});
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); }
  });
  byId('refresh-project').addEventListener('click', () => refresh(true));
  byId('gallery-previous').addEventListener('click', () => showImage(imageIndex - 1));
  byId('gallery-next').addEventListener('click', () => showImage(imageIndex + 1));
  document.querySelectorAll('.showcase-tab').forEach(tab => {
    tab.addEventListener('click', () => selectPanel(tab.dataset.panel));
    tab.addEventListener('keydown', event => {
      if (byId('readme-tab').hidden || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault(); selectPanel(event.key === 'Home' ? 'overview' : event.key === 'End' ? 'readme' : tab.dataset.panel === 'overview' ? 'readme' : 'overview', true);
    });
  });
  dialog.addEventListener('keydown', event => {
    if (event.target.closest('button, a, input, textarea, select') || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault(); showImage(imageIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  // A small camera movement follows a fine pointer; one frame is scheduled per tile.
  if (matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.project-image-tile').forEach(tile => {
      let scheduled = false, x = 0, y = 0;
      tile.addEventListener('pointermove', event => {
        if (document.documentElement.classList.contains('motion-paused')) return;
        const box = tile.getBoundingClientRect(); x = (event.clientX - box.left) / box.width - .5; y = (event.clientY - box.top) / box.height - .5;
        if (!scheduled) { scheduled = true; requestAnimationFrame(() => { tile.style.setProperty('--camera-x', `${x * 10}px`); tile.style.setProperty('--camera-y', `${y * 8}px`); scheduled = false; }); }
      }, {passive:true});
      tile.addEventListener('pointerleave', () => { tile.style.setProperty('--camera-x', '0px'); tile.style.setProperty('--camera-y', '0px'); }, {passive:true});
    });
  }
})();
