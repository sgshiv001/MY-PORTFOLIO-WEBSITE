'use strict';
// Side navigation follows ordinary page scroll without intercepting the mouse wheel.
const chapterLinks = [...document.querySelectorAll('.section-nav-link')];
const chapters = [...document.querySelectorAll('[data-chapter]')];
const chapterMenuButton = document.querySelector('.section-menu-toggle');
const chapterMenuScrim = document.querySelector('.section-menu-scrim');
const chapterNavigation = document.getElementById('section-navigation');
const chapterSidebar = document.querySelector('.section-sidebar');
const chapterPage = document.querySelector('.page-shell');
const mobileChapterMenu = window.matchMedia('(max-width:700px)');
let chapterFramePending = false;

function setChapterMenu(open, restoreFocus = false) {
  document.body.classList.toggle('section-menu-open', open);
  chapterMenuButton.setAttribute('aria-expanded', String(open));
  chapterMenuButton.setAttribute('aria-label', open ? 'Close sections' : 'Open sections');
  chapterMenuButton.querySelector('[aria-hidden]').textContent = open ? '×' : '☰';
  chapterMenuScrim.hidden = !open;
  chapterNavigation.inert = mobileChapterMenu.matches && !open;
  chapterSidebar.inert = mobileChapterMenu.matches && !open;
  chapterPage.inert = mobileChapterMenu.matches && open;
  if (open) chapterNavigation.querySelector('.is-active')?.focus();
  else if (restoreFocus) chapterMenuButton.focus({preventScroll:true});
}
chapterMenuButton.addEventListener('click', () => setChapterMenu(chapterMenuButton.getAttribute('aria-expanded') !== 'true', true));
chapterMenuScrim.addEventListener('click', () => setChapterMenu(false, true));
chapterLinks.forEach(link => link.addEventListener('click', () => { if (mobileChapterMenu.matches) setChapterMenu(false, true); }));
document.querySelector('.sidebar-brand').addEventListener('click', () => { if (mobileChapterMenu.matches) setChapterMenu(false, true); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && chapterMenuButton.getAttribute('aria-expanded') === 'true') setChapterMenu(false, true);
  if (event.key === 'Tab' && mobileChapterMenu.matches && chapterMenuButton.getAttribute('aria-expanded') === 'true') {
    const targets = [chapterSidebar.querySelector('.sidebar-brand'), ...chapterLinks, chapterMenuButton];
    const index = targets.indexOf(document.activeElement);
    event.preventDefault();
    targets[(index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length].focus();
  }
});
mobileChapterMenu.addEventListener('change', () => setChapterMenu(false));
setChapterMenu(false);

function updateChapters() {
  const paused = document.documentElement.classList.contains('motion-paused');
  const screen = Math.max(window.innerHeight, 1);
  const focusLine = screen * .38;
  let active = chapters[0]?.id;
  chapters.forEach(chapter => {
    const box = chapter.getBoundingClientRect();
    if (box.top <= focusLine) active = chapter.id;
    if (box.bottom >= 0 && box.top <= screen) {
      const progress = Math.min(1, Math.max(0, (screen - box.top) / (screen + box.height)));
      chapter.style.setProperty('--chapter-progress', progress.toFixed(3));
      chapter.style.setProperty('--scene-shift', `${paused ? 0 : (progress - .5) * 85}px`);
    }
  });
  if (window.scrollY + screen >= document.documentElement.scrollHeight - 6) active = chapters.at(-1)?.id;
  chapterLinks.forEach(link => {
    const current = link.hash === `#${active}`;
    link.classList.toggle('is-active', current);
    if (current) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
  });
  const distance = document.documentElement.scrollHeight - screen;
  document.documentElement.style.setProperty('--page-progress', distance > 0 ? Math.min(1,Math.max(0,window.scrollY / distance)).toFixed(3) : '0');
  chapterFramePending = false;
}
window.addEventListener('scroll', () => { if (!chapterFramePending) { chapterFramePending = true; requestAnimationFrame(updateChapters); } }, {passive:true});
window.addEventListener('resize', updateChapters, {passive:true});
updateChapters();
