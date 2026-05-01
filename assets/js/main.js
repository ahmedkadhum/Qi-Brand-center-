// Qi Brand Center — interactions
(function(){
  // Theme toggle
  const root = document.documentElement;
  const stored = localStorage.getItem('qi-theme');
  if(stored) root.setAttribute('data-theme', stored);
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-theme-toggle]');
    if(!t) return;
    const cur = root.getAttribute('data-theme') === 'dark' ? '' : 'dark';
    if(cur) root.setAttribute('data-theme', cur); else root.removeAttribute('data-theme');
    localStorage.setItem('qi-theme', cur);
  });

  // Mobile menu
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-menu-toggle]');
    if(!t) return;
    document.querySelector('.nav-links')?.classList.toggle('open');
  });

  // Reveal on scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Copy hex on click
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-copy]');
    if(!c) return;
    const txt = c.getAttribute('data-copy');
    navigator.clipboard.writeText(txt).then(() => showToast('Copied ' + txt));
  });

  function showToast(msg){
    let t = document.querySelector('.copy-toast');
    if(!t){ t = document.createElement('div'); t.className = 'copy-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(showToast._t); showToast._t = setTimeout(()=>t.classList.remove('show'), 1400);
  }

  // TOC active link tracking
  const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if(tocLinks.length){
    const map = new Map();
    tocLinks.forEach(a => { const id = a.getAttribute('href').slice(1); const sec = document.getElementById(id); if(sec) map.set(sec, a); });
    const tIo = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const a = map.get(en.target);
        if(!a) return;
        if(en.isIntersecting){ tocLinks.forEach(l => l.classList.remove('active')); a.classList.add('active'); }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    map.forEach((_, sec) => tIo.observe(sec));
  }

  // Search overlay
  const overlay = document.querySelector('.search-overlay');
  function openSearch(){ overlay?.classList.add('open'); overlay?.querySelector('input')?.focus(); }
  function closeSearch(){ overlay?.classList.remove('open'); }
  document.addEventListener('keydown', e => {
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); openSearch(); }
    if(e.key === 'Escape') closeSearch();
  });
  document.addEventListener('click', e => {
    if(e.target.closest('[data-search-open]')) openSearch();
    if(e.target === overlay) closeSearch();
  });

  // Search filter
  const searchInput = overlay?.querySelector('input');
  const results = overlay?.querySelector('.results');
  if(searchInput && results){
    const items = Array.from(results.querySelectorAll('a'));
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      items.forEach(a => {
        const match = !q || a.textContent.toLowerCase().includes(q);
        a.style.display = match ? '' : 'none';
      });
    });
  }
})();
