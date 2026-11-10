(() => {
 'use strict';
 const $ = s => document.querySelector(s);
 const slides = [...document.querySelectorAll('.slide')];
 const viewer = $('#viewer');
 const dialogs = [...document.querySelectorAll('dialog')];
 let current = 0, readingChosen = false, touch = null;
 const narrow = matchMedia('(max-width:680px)');
 const hasDialog = () => dialogs.some(d => d.open);
 const fromHash = () => {
  const match = location.hash.match(/^#slide-(\d+)$/);
  return match ? Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1)) : 0;
 };
 function show(index, writeHash = true) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((s, i) => { s.classList.toggle('is-active', i === current); s.setAttribute('aria-hidden', i !== current); });
  $('#page-number').textContent = `${String(current + 1).padStart(2, '0')} / ${slides.length}`;
  $('#page-title').textContent = slides[current].querySelector('h2').textContent;
  $('#previous').disabled = current === 0;
  $('#next').disabled = current === slides.length - 1;
  document.querySelectorAll('.contents-list a').forEach(a => {
   if (Number(a.dataset.page) === current + 1) a.setAttribute('aria-current', 'page');
   else a.removeAttribute('aria-current');
  });
  for (const i of [current, current + 1]) if (slides[i]) slides[i].querySelector('img').loading = 'eager';
  if (writeHash && location.hash !== `#slide-${current + 1}`) history.replaceState(null, '', `#slide-${current + 1}`);
  if (writeHash && viewer.classList.contains('reading-mode')) viewer.scrollIntoView({block:'start',behavior:'instant'});
 }
 function reading(on) {
  viewer.classList.toggle('reading-mode', on);
  $('#reading-button').setAttribute('aria-pressed', String(on));
 }
 function syncFullScreen() {
  const expanded = !!document.fullscreenElement || viewer.classList.contains('expanded');
  $('#fullscreen').setAttribute('aria-pressed', String(expanded));
  $('#fullscreen').textContent = expanded ? 'Exit full screen' : 'Full screen';
 }
 async function fullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen();
  else if (viewer.classList.contains('expanded')) viewer.classList.remove('expanded');
  else {
   try {
    if (!viewer.requestFullscreen) throw new Error('Use expanded view');
    await viewer.requestFullscreen();
   } catch (_) { viewer.classList.add('expanded'); }
  }
  syncFullScreen();
 }
 document.documentElement.classList.add('js');
 show(fromHash(), false); reading(narrow.matches);
 $('#previous').addEventListener('click', () => show(current - 1));
 $('#next').addEventListener('click', () => show(current + 1));
 $('#reading-button').addEventListener('click', () => { readingChosen = true; reading(!viewer.classList.contains('reading-mode')); });
 narrow.addEventListener('change', () => { if (!readingChosen) reading(narrow.matches); });
 $('#fullscreen').addEventListener('click', fullscreen);
 document.addEventListener('fullscreenchange', syncFullScreen);
 window.addEventListener('hashchange', () => show(fromHash(), false));
 $('#contents-button').addEventListener('click', () => $('#contents-dialog').showModal());
 $('#compare-button').addEventListener('click', () => $('#compare-dialog').showModal());
 document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.close).close()));
 document.querySelectorAll('[data-page]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); dialogs.forEach(d => { if (d.open) d.close(); }); show(Number(a.dataset.page) - 1); $('#presentation').focus({preventScroll:true});
 }));
 $('.brand').addEventListener('click', e => { e.preventDefault(); show(0); });
 dialogs.forEach(d => d.addEventListener('click', e => {
  if (e.target !== d) return;
  const b = d.getBoundingClientRect();
  if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) d.close();
 }));
 document.addEventListener('keydown', e => {
  if (hasDialog() || e.altKey || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'Escape' && viewer.classList.contains('expanded')) { viewer.classList.remove('expanded'); syncFullScreen(); }
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); show(current + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(current - 1); }
  if (e.key === 'Home') { e.preventDefault(); show(0); }
  if (e.key === 'End') { e.preventDefault(); show(slides.length - 1); }
  if (e.key.toLowerCase() === 'f') { e.preventDefault(); fullscreen(); }
 });
 $('#slides').addEventListener('touchstart', e => { if(e.touches.length === 1) touch = {x:e.touches[0].clientX,y:e.touches[0].clientY}; }, {passive:true});
 $('#slides').addEventListener('touchend', e => {
  if (!touch || e.changedTouches.length !== 1) return;
  const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
  if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.8 && !hasDialog()) show(current + (dx < 0 ? 1 : -1));
  touch = null;
 }, {passive:true});
 slides.forEach(s => s.querySelector('img').addEventListener('error', () => {
  $('#notice').textContent = 'A page image could not load. Reading view and the downloadable PDF remain available.';
  reading(true);
 }));
})();
