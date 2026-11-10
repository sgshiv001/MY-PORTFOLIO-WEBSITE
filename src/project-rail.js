/* Horizontal gallery with mouse dragging, native touch swipe and keyboard controls. */
(() => {
  'use strict';
  const track = document.getElementById('project-track');
  if (!track) return;
  const cards = [...track.querySelectorAll('.project-card')];
  const previous = document.getElementById('project-previous');
  const next = document.getElementById('project-next');
  const position = document.getElementById('project-position');
  const pagination = [...document.querySelectorAll('[data-project-index]')];
  let selected = 0, scheduled = false;
  const paused = () => document.documentElement.classList.contains('motion-paused') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  function update() {
    const frame = track.getBoundingClientRect();
    const center = frame.left + frame.width / 2;
    let nearest = Infinity;
    cards.forEach((card,index) => {
      const box = card.getBoundingClientRect();
      const distance = Math.abs(box.left + box.width / 2 - center);
      if (distance < nearest) { nearest = distance; selected = index; }
    });
    previous.disabled = track.scrollLeft <= 3;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 3;
    position.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    pagination.forEach((button,index) => {
      if (selected === index) button.setAttribute('aria-current','true'); else button.removeAttribute('aria-current');
    });
    scheduled = false;
  }
  function go(index) {
    const target = Math.min(cards.length - 1, Math.max(0,index));
    const frame = track.getBoundingClientRect(), card = cards[target].getBoundingClientRect();
    const left = Math.max(0, Math.min(track.scrollWidth - track.clientWidth, track.scrollLeft + card.left - frame.left));
    track.scrollTo({left, behavior:paused() ? 'instant' : 'smooth'});
  }
  let drag = null, suppressClick = false;
  track.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    suppressClick = false;
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, left:track.scrollLeft, moved:false};
  });
  track.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved) {
      if (Math.abs(dx) < 7) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      drag.moved = true;
      track.setPointerCapture?.(event.pointerId);
      track.classList.add('is-dragging');
    }
    event.preventDefault();
    track.scrollLeft = Math.max(0,Math.min(track.scrollWidth - track.clientWidth,drag.left - dx));
    update();
  });
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const finished = drag; drag = null;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture?.(finished.id)) track.releasePointerCapture(finished.id);
    if (finished.moved) {
      suppressClick = event.type === 'pointerup';
      const frame = track.getBoundingClientRect();
      let nearest = 0, distance = Infinity;
      cards.forEach((card,index) => {
        const destination = Math.max(0,Math.min(track.scrollWidth - track.clientWidth,track.scrollLeft + card.getBoundingClientRect().left - frame.left));
        const offset = Math.abs(destination - track.scrollLeft);
        if (offset < distance) { distance = offset; nearest = index; }
      });
      go(nearest);
    }
  }
  track.addEventListener('pointerup',finishDrag);
  track.addEventListener('pointercancel',finishDrag);
  track.addEventListener('lostpointercapture',finishDrag);
  track.addEventListener('pointerleave', event => { if (drag && !drag.moved) drag = null; });
  track.addEventListener('click',event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  },true);
  track.addEventListener('dragstart',event => event.preventDefault());
  previous.addEventListener('click', () => go(selected - 1));
  next.addEventListener('click', () => go(selected + 1));
  pagination.forEach(button => button.addEventListener('click', () => go(Number(button.dataset.projectIndex))));
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    go(event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : selected + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, {passive:true});
  window.addEventListener('resize',update,{passive:true});
  track.addEventListener('scrollend',update);
  update();
})();
