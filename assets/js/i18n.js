// Qi Brand Center — bilingual (EN / AR) language toggle
// Reads `data-i18n="key"` attributes and swaps text content based on the
// active language. Persisted in localStorage as `qi-lang`. Sets <html lang>
// and <html dir> for proper RTL behaviour. Falls back gracefully when a key
// has no translation (the existing English text stays visible).

window.qiI18n = window.qiI18n || {};

(function(){
  const STORAGE_KEY = 'qi-lang';
  const DEFAULT_LANG = 'en';

  // ====== Translation dictionary ======
  // Add new keys here as needed. Keys missing from `ar` fall back to `en`.
  const dict = {
    // ---- Brand / chrome ----
    'brand.name':       { en: 'Qi Brand Center',          ar: 'مركز هوية كي' },
    'brand.sub':        { en: 'Identity · Voice · System', ar: 'الهوية · الصوت · النظام' },
    'brand.short':      { en: 'Qi Brand',                  ar: 'هوية كي' },

    // ---- Primary nav ----
    'nav.foundation':   { en: 'Foundation',                ar: 'الأساس' },
    'nav.identity':     { en: 'Identity',                  ar: 'الهوية' },
    'nav.voice':        { en: 'Voice',                     ar: 'الصوت' },
    'nav.applications': { en: 'Applications',              ar: 'التطبيقات' },
    'nav.apps':         { en: 'Apps',                      ar: 'التطبيقات' },
    'nav.pnpl':         { en: 'Buy Now Pay Later',         ar: 'قسّطها ويه كي' },
    'nav.compliance':   { en: 'Compliance',                ar: 'الامتثال' },
    'nav.admin':        { en: 'Brand Settings',            ar: 'إعدادات الهوية' },
    'nav.downloads':    { en: 'Downloads',                 ar: 'التحميلات' },
    'nav.home':         { en: 'Home',                      ar: 'الرئيسية' },

    // Identity dropdown
    'nav.id.brandmark':   { en: 'Brandmark',     ar: 'العلامة التجارية' },
    'nav.id.color':       { en: 'Color',         ar: 'الألوان' },
    'nav.id.typography':  { en: 'Typography',    ar: 'الطباعة' },
    'nav.id.iconography': { en: 'Iconography',   ar: 'الأيقونات' },
    'nav.id.imagery':     { en: 'Imagery',       ar: 'الصور' },
    'nav.id.device':      { en: 'Graphic Device', ar: 'العنصر البصري' },
    'nav.id.layout':      { en: 'Grids & Layout', ar: 'الشبكات والتخطيطات' },

    // ---- Buttons / CTAs ----
    'cta.get_assets':     { en: 'Get assets',          ar: 'احصل على الأصول' },
    'cta.download_kit':   { en: 'Download brand kit',  ar: 'حمّل ملفات الهوية' },
    'cta.explore':        { en: 'Explore the system',  ar: 'استكشف النظام' },
    'cta.search':         { en: 'Search',              ar: 'بحث' },
    'cta.theme':          { en: 'Toggle theme',        ar: 'تبديل المظهر' },
    'cta.menu':           { en: 'Menu',                ar: 'القائمة' },
    'cta.lang':           { en: 'العربية',             ar: 'English' }, // shows the OTHER language

    // ---- Page heroes ----
    'page.identity.eyebrow': { en: 'Section 01 — Brand Identity', ar: 'القسم 01 — هوية العلامة' },
    'page.identity.h1':      { en: 'Brandmark.',                  ar: 'العلامة التجارية.' },
    'page.color.eyebrow':    { en: 'Section 02 — Our Colors',     ar: 'القسم 02 — ألواننا' },
    'page.color.h1':         { en: 'Modern by pairing.',          ar: 'حداثة بالاقتران.' },
    'page.type.eyebrow':     { en: 'Section 03 — Our Typography', ar: 'القسم 03 — طباعتنا' },
    'page.type.h1':          { en: 'Keep type simple and easy to read.', ar: 'اجعل الطباعة بسيطة وسهلة القراءة.' },
    'page.icons.eyebrow':    { en: 'Section 04 — Our Iconography', ar: 'القسم 04 — أيقوناتنا' },
    'page.icons.h1':         { en: 'Built on a 10×10 grid.',       ar: 'مبنية على شبكة 10×10.' },
    'page.imagery.eyebrow':  { en: 'Section 05 — Our Image Style', ar: 'القسم 05 — أسلوب الصور' },
    'page.imagery.h1':       { en: 'Used in key moments.',         ar: 'تُستخدم في اللحظات الرئيسية.' },
    'page.device.eyebrow':   { en: 'Section 06 — Our Graphic Device', ar: 'القسم 06 — العنصر البصري' },
    'page.device.h1':        { en: 'The extended circle.',         ar: 'الدائرة الممتدة.' },
    'page.layout.eyebrow':   { en: 'Section 07 — Our Grids & Layouts', ar: 'القسم 07 — الشبكات والتخطيطات' },
    'page.layout.h1':        { en: 'Hierarchical messaging.',      ar: 'رسائل هرميّة.' },
    'page.apps.eyebrow':     { en: 'Section 09 — Applications',    ar: 'القسم 09 — التطبيقات' },
    'page.apps.h1':          { en: 'From card to building.',       ar: 'من البطاقة إلى المبنى.' },
    'page.voice.eyebrow':    { en: 'Voice & Tone',                 ar: 'الصوت والنبرة' },
    'page.pnpl.eyebrow':     { en: 'Sub-brand · قسّطها ويه كي',    ar: 'علامة فرعية · قسّطها ويه كي' },
    'page.pnpl.h1':          { en: 'Brand Guideline.',             ar: 'دليل الهوية.' },
    'page.home.h1':          { en: 'The single source of truth for everything Qi.', ar: 'المصدر الوحيد للحقيقة لكل ما يخص كي.' },
    'page.home.eyebrow':     { en: 'Brand Guidelines · v0.2 just shipped', ar: 'دليل الهوية · صدرت النسخة 0.2 للتو' },
    'page.compliance.h1':    { en: 'Compliance, enforced.',        ar: 'الامتثال، مُطبَّق.' },
    'page.compliance.eyebrow':{ en: 'Section 12 — Brand Guardian', ar: 'القسم 12 — حارس الهوية' },
    'page.admin.h1':         { en: 'Brand Settings.',              ar: 'إعدادات الهوية.' },
    'page.downloads.h1':     { en: 'Get the full Qi brand kit.',   ar: 'احصل على ملف الهوية الكامل.' },
    'page.contact.h1':       { en: 'Contact & trademarks.',        ar: 'التواصل والعلامات التجارية.' },

    // ---- Footer ----
    'footer.identity':  { en: 'Identity',           ar: 'الهوية' },
    'footer.system':    { en: 'System',             ar: 'النظام' },
    'footer.resources': { en: 'Resources',          ar: 'المصادر' },
    'footer.subbrand':  { en: 'Sub-brand & Resources', ar: 'العلامة الفرعية والمصادر' },
    'footer.contact':   { en: 'Contact & Trademarks', ar: 'التواصل والعلامات' },
    'footer.search_hint': { en: 'Press ⌘ K to search', ar: 'اضغط ⌘ K للبحث' },

    // ---- Generic ----
    'common.toc':       { en: 'On this page',  ar: 'في هذه الصفحة' },
    'common.placeholder.search': { en: 'Search the brand center…', ar: 'ابحث في مركز الهوية…' },
  };

  window.qiI18n.dict = dict;

  function getLang(){
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  }

  function setLangAttr(lang){
    document.documentElement.setAttribute('lang', lang === 'ar' ? 'ar' : 'en');
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }

  function applyTranslations(lang){
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const entry = dict[key];
      if (!entry) return;
      const text = entry[lang] || entry.en;
      // Preserve any nested elements at start/end (e.g. <span class="chev">)
      // by replacing only the first text node when present, otherwise
      // overwriting textContent.
      const firstText = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      if (firstText) firstText.textContent = text + ' ';
      else el.textContent = text;
    });
    // Translate placeholders separately
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const entry = dict[el.getAttribute('data-i18n-placeholder')];
      if (entry) el.setAttribute('placeholder', entry[lang] || entry.en);
    });
    // Translate aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const entry = dict[el.getAttribute('data-i18n-aria')];
      if (entry) el.setAttribute('aria-label', entry[lang] || entry.en);
    });
    // Update language-toggle label to show the OTHER language
    document.querySelectorAll('[data-lang-toggle]').forEach(el => {
      el.textContent = lang === 'ar' ? 'English' : 'العربية';
    });
  }

  function setLang(lang){
    localStorage.setItem(STORAGE_KEY, lang);
    setLangAttr(lang);
    applyTranslations(lang);
  }

  // ====== Init on load ======
  function init(){
    const initial = getLang();
    setLangAttr(initial);
    applyTranslations(initial);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // ====== Click handler for the toggle button ======
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-lang-toggle]');
    if (!t) return;
    e.preventDefault();
    const cur = getLang();
    setLang(cur === 'ar' ? 'en' : 'ar');
  });

  window.qiI18n.set = setLang;
  window.qiI18n.get = getLang;
})();
