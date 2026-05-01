import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Downloads — Qi Brand Center',
  description: 'Download official Qi brand assets: logos, fonts, templates, and design files.',
}

const ASSET_PACKS = [
  {
    category: 'Logo',
    items: [
      { name: 'Qi Mark — SVG', desc: 'Primary mark, all variants (light, dark, yellow, mono)', size: '42 KB' },
      { name: 'Qi Wordmark — SVG', desc: 'Horizontal and stacked wordmark, all colour variants', size: '28 KB' },
      { name: 'Qi Logo Pack — PNG', desc: 'All marks at 1×, 2×, 3× on transparent background', size: '1.2 MB' },
      { name: 'Qi Logo Pack — PDF', desc: 'Print-ready EPS/PDF in CMYK and Pantone', size: '380 KB' },
    ],
  },
  {
    category: 'Color',
    items: [
      { name: 'Color Swatches — ASE', desc: 'Adobe Swatch Exchange for Illustrator and InDesign', size: '12 KB' },
      { name: 'Color Swatches — Sketch', desc: 'Sketch shared colour library', size: '8 KB' },
      { name: 'Color Swatches — Figma', desc: 'Figma colour styles JSON import', size: '6 KB' },
    ],
  },
  {
    category: 'Typography',
    items: [
      { name: 'Inter Tight — Variable', desc: 'Full variable font file (wght 100–900)', size: '680 KB' },
      { name: 'Inter — Variable', desc: 'Full variable font file (wght 100–900)', size: '810 KB' },
      { name: 'JetBrains Mono — Variable', desc: 'Full variable font file (wght 100–800)', size: '420 KB' },
    ],
  },
  {
    category: 'Templates',
    items: [
      { name: 'Presentation — Keynote', desc: 'Qi brand Keynote template, 16:9', size: '3.4 MB' },
      { name: 'Presentation — PowerPoint', desc: 'Qi brand PPTX template, 16:9', size: '2.8 MB' },
      { name: 'Document — Word', desc: 'Qi letterhead and report DOCX templates', size: '1.1 MB' },
      { name: 'Design kit — Figma', desc: 'Full Figma component library (community file)', size: 'Link' },
    ],
  },
]

export default function DownloadsPage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">Resources</div>
          <h1>Downloads</h1>
          <p className="lead">
            Official, approved assets for internal and agency use. All files are version-controlled
            — always download fresh rather than re-using old copies from email or shared drives.
          </p>
        </div>
      </section>

      {ASSET_PACKS.map((pack) => (
        <section key={pack.category} className="section" id={pack.category.toLowerCase()}>
          <div className="container">
            <h2>{pack.category}</h2>
            <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
              {pack.items.map((item) => (
                <div key={item.name} className="card reveal" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '.95rem' }}>{item.name}</strong>
                    <p style={{ margin: '.25rem 0 0', fontSize: '.8rem', opacity: .7 }}>{item.desc}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.4rem', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.75rem', opacity: .55 }}>{item.size}</span>
                    <a
                      href="#"
                      className="btn-ghost"
                      style={{ fontSize: '.8rem', padding: '.35rem .75rem' }}
                      aria-label={`Download ${item.name}`}
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="section">
        <div className="container">
          <div className="card" style={{ background: 'var(--bg-2)', borderRadius: 'var(--r-xl)' }}>
            <h3 style={{ marginTop: 0 }}>Need something not listed here?</h3>
            <p style={{ fontSize: '.9rem', opacity: .8 }}>
              Bespoke assets, high-resolution print files, and environmental specification
              sheets are available on request. Reach out via the{' '}
              <a href="/contact" style={{ fontWeight: 600 }}>contact page</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
