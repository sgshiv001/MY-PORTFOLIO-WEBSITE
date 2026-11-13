'use strict';
const projectDetails = {
  orders: {
    status: 'COLLABORATIVE PROJECT / PUBLIC REPOSITORY', title: 'TradeVelocity',
    summary: 'A local stock order-matching application with a Python/FastAPI backend and React interface, available for Windows desktop and the browser.',
    heading: 'Repository highlights',
    points: ['Limit and market orders, partial fills, amendments and cancellations.', 'Order depth, execution history and persistent local sessions.', 'Market-history analysis and advisory execution monitoring.'],
    note: 'Created collaboratively with Aditya Verma, Sourabh Gupta and Harshit Sharma. The repository describes shared contributions; this portfolio does not claim sole ownership. It does not conduct real-money trading.',
    repository: 'https://github.com/sgshiv001/TRADE-VELOCITY'
  },
  gpu: {
    status: 'CUDA CORE PROJECT / IMPLEMENTATION & BENCHMARKS', title: 'CUDA & GPU Computing',
    summary: 'I build and measure CUDA C++ kernels for neural network inference and FP32 matrix multiplication.',
    heading: 'Implemented and tested',
    points: ['Direct and fused CUDA inference for a trained digit CNN. Both paths matched all 360 held-out PyTorch predictions.', 'Three FP32 matrix multiplication kernels benchmarked against cuBLAS. The register-tiled kernel was 3.86× as fast as the naive kernel at 2048 × 2048 × 2048.', 'CUDA-event timings for GPU-resident work and separate wall-clock timings for inference with transfers.'],
    note: 'Measurements were recorded on a GeForce RTX 5060 Laptop GPU with CUDA 13.4.'
  },
  verdyn: {
    status: 'CAMPUS SUSTAINABILITY / PUBLIC REPOSITORY', title: 'Verdyn',
    summary: 'A campus dashboard generated from uploaded energy and water CSV files, with consumption summaries, forecasts and unusual-usage checks.',
    heading: 'Repository highlights',
    points: ['Upload, preview, validate and save hourly energy or water readings.', 'Consumption totals, daily charts and comparisons across buildings.', 'Next-day forecasts and unusual-usage checks when enough history is available.'],
    note: 'The repository describes statistical median forecasting, rather than a trained deep-learning model. Hosted access is restricted to authorized users. No screenshot is currently published in its README.',
    repository: 'https://github.com/sgshiv001/Verdyn-AI-Campus-Digital-Twin'
  },
  inventory: {
    status: 'FEATURED PROJECT / LOCAL DESKTOP & WEB APP', title: 'InvenTrack',
    summary: 'A local inventory workspace for retailers, wholesalers and distributors, built with Electron, Node.js and SQLite.',
    heading: 'Repository highlights',
    points: ['Stock ledgers, purchase orders, partial receipts and shipment records.', 'CSV import/export, supplier management and barcode scanning.', 'Role-based local workspaces, a Windows desktop app and a recorded-coordinate delivery globe.'],
    note: 'A single-organization local application. It is not a finished multi-tenant subscription service; the delivery globe does not provide live carrier tracking. Repository SVGs are interface previews.',
    repository: 'https://github.com/sgshiv001/inventrack-inventory-management'
  },
  lapcont: {
    status: 'CROSS-DEVICE APPLICATION / TEST BUILD', title: 'LapCont',
    summary: 'An Android app connected to a Windows service and desktop companion for owner-approved remote PC controls.',
    heading: 'Repository highlights',
    points: ['QR pairing with individual Windows owner permissions.', 'Remote locking, Windows session events, camera/audio and push-to-talk controls.', 'Kotlin and Jetpack Compose on Android, C#/.NET on Windows, with an optional self-hosted Go relay.'],
    note: 'A test prerelease with selected checks documented in the repository. Full physical-device, proximity and internet-relay acceptance remains in progress. Request unlock requires normal Windows sign-in. The card uses conceptual device artwork.',
    repository: 'https://github.com/sgshiv001/LAPCONT'
  },
  neet: {
    status: 'EXAM PRACTICE & OPERATIONS / PROTOTYPE', title: 'NEET Fortress',
    summary: 'An exam practice and paper-assembly prototype with question-bank tools, browser-saved attempts and local audit demonstrations.',
    heading: 'Repository highlights',
    points: ['Timed practice, answer review, scoring and browser-saved attempts.', 'Question-bank search, JSON import/export and randomized paper candidates.', 'React/Vinext interface and a Cloudflare Worker, with local exam-operations demonstrations.'],
    note: 'An early-stage prototype. Generated sample questions require review before educational use. Local audit and access-signal demonstrations are not a production exam-security guarantee. The gallery shows repository banner artwork.',
    repository: 'https://github.com/sgshiv001/NEET-Fortress'
  }
};
window.portfolioProjectDetails = projectDetails;

const profile = window.portfolioProfile || {};
function safeWebUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
for (const key of ['github', 'linkedin']) {
  const link = document.querySelector(`[data-social="${key}"]`);
  const url = safeWebUrl(profile[`${key}Url`]);
  if (url) {
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.removeAttribute('aria-disabled'); link.classList.remove('pending-link');
    link.querySelector('.social-value').textContent = key === 'linkedin' ? 'Shivanshu Gupta' : new URL(url).pathname.replace(/^\/+|\/+$/g, '') || key;
  }
}
const destination = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contactEmail || '') ? profile.contactEmail : '';
if (destination) {
  const emailLink = document.querySelector('[data-contact-email]');
  emailLink.href = `mailto:${destination}`; emailLink.textContent = destination; emailLink.classList.remove('pending-link');
  document.getElementById('form-note').textContent = 'Opens your email app with a prepared message. Review it there and send it to me.';
  document.getElementById('form-submit-label').textContent = 'Open email draft';
}

// The form prepares a real email draft; it never reports an unsent message as delivered.
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const prepared = document.getElementById('prepared-message');
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const fields = new FormData(form);
  const name = String(fields.get('name')).trim();
  const message = String(fields.get('message')).trim();
  if (!name || message.length < 10) {
    status.textContent = 'Please add your name and a message of at least 10 characters.';
    (!name ? form.elements.name : form.elements.message).focus(); return;
  }
  const subject = `${fields.get('subject')} — ${name}`;
  const body = `Hello Shivanshu,\n\n${message}\n\nFrom: ${name}\nReply email: ${fields.get('email')}`;
  prepared.value = `Subject: ${subject}\n\n${body}`;
  document.getElementById('message-preview').hidden = false;
  if (destination) {
    window.location.href = `mailto:${destination}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Email draft prepared. Send it from your email app, or copy the message below.';
  } else {
    status.textContent = 'Your message is ready to copy. The contact email has not been added yet; nothing has been sent.';
  }
});
document.querySelector('.copy-message').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(prepared.value); status.textContent = 'Message copied.'; }
  catch { prepared.focus(); prepared.select(); status.textContent = 'Message selected. Use your device’s copy command to copy it.'; }
});

const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-toggle');
const motionIcon = motionButton.querySelector('[aria-hidden]');
const hero = document.querySelector('.hero');
let manualMotionPause = false;
let motionPaused;
try { manualMotionPause = localStorage.getItem('sg-motion') === 'paused'; } catch {}

function applyMotionPreference() {
  motionPaused = motionMedia.matches || manualMotionPause;
  document.documentElement.classList.toggle('motion-paused', motionPaused);
  const label = motionMedia.matches ? 'Motion reduced by device preference' : motionPaused ? 'Resume motion' : 'Pause motion';
  motionButton.disabled = motionMedia.matches;
  motionButton.setAttribute('aria-pressed', String(motionPaused));
  motionButton.setAttribute('aria-label', label);
  motionButton.title = label;
  motionIcon.textContent = motionPaused ? '▷' : 'Ⅱ';
  if (motionPaused) {
    document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
    document.documentElement.style.setProperty('--portrait-shift', '0px');
    hero.style.removeProperty('--scene-x');
    hero.style.removeProperty('--scene-y');
  }
}

motionButton.addEventListener('click', () => {
  manualMotionPause = !manualMotionPause;
  try { localStorage.setItem('sg-motion', manualMotionPause ? 'paused' : 'auto'); } catch {}
  applyMotionPreference();
});
window.addEventListener('storage', event => {
  if (event.key !== 'sg-motion') return;
  manualMotionPause = event.newValue === 'paused';
  applyMotionPreference();
});
applyMotionPreference();
motionMedia.addEventListener('change', applyMotionPreference);

const welcome = document.getElementById('welcome-dialog');
const replayIntro = document.querySelector('.replay-intro');
let introTimer;
function closeIntro() { if (welcome.open) welcome.close(); }
replayIntro.addEventListener('click', () => {
  if (welcome.open) return;
  welcome.showModal(); document.body.classList.add('intro-open');
  introTimer = setTimeout(closeIntro, 5500);
});
welcome.querySelector('.intro-skip').addEventListener('click', closeIntro);
welcome.querySelector('.enter-portfolio').addEventListener('click', closeIntro);
welcome.addEventListener('close', () => {
  clearTimeout(introTimer); document.body.classList.remove('intro-open');
  replayIntro.focus({preventScroll:true});
});
document.documentElement.classList.add('portfolio-entered');

const revealElements = document.querySelectorAll('.chapter-heading, .case-study, .project-card, .research-feature, .cuda-benchmark, .education-panel, .direction-panel, .goal-panel, .certificate-card, .linkedin-profile-card, .contact-heading, .contact-details');
if ('IntersectionObserver' in window && !motionPaused) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting && !motionPaused && !entry.target.contains(document.activeElement)) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, {threshold:0.03, rootMargin:'0px 0px 40px 0px'});
  revealElements.forEach(element => {
    element.classList.add('reveal');
    revealObserver.observe(element);
  });
}
document.addEventListener('focusin', event => event.target.closest('.reveal')?.classList.add('is-visible'));
let scheduled = false;
function updateScroll() {
  const shift = !motionPaused && window.innerWidth > 800 ? Math.min(window.scrollY * .045, 28) : 0;
  document.documentElement.style.setProperty('--portrait-shift', `${shift}px`);
  scheduled = false;
}
window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } }, {passive:true});
window.addEventListener('resize', updateScroll, {passive:true});
updateScroll();
if (window.matchMedia('(pointer:fine)').matches) {
  let sceneFrame;
  hero.addEventListener('pointermove', event => {
    if (motionPaused) return;
    cancelAnimationFrame(sceneFrame);
    sceneFrame = requestAnimationFrame(() => {
      if (motionPaused) return;
      const box = hero.getBoundingClientRect();
      hero.style.setProperty('--scene-x', `${((event.clientX - box.left) / box.width - .5) * 24}px`);
      hero.style.setProperty('--scene-y', `${((event.clientY - box.top) / box.height - .5) * 16}px`);
    });
  }, {passive:true});
  hero.addEventListener('pointerleave', () => {
    cancelAnimationFrame(sceneFrame);
    hero.style.removeProperty('--scene-x');
    hero.style.removeProperty('--scene-y');
  });
}
