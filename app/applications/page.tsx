import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Applications — Qi Brand Center',
  description: 'Qi brand in use: digital, print, and environmental application examples.',
}

const DIGITAL = [
  ['Mobile app', 'The primary product surface. Brand expression is restrained — system colors and spacing take precedence. The arc device appears in loading states and empty screens.'],
  ['Web / PWA', 'Full brand palette is available. Yellow CTAs, black surfaces for depth, white for reading clarity. Dark mode is a first-class concern.'],
  ['Push notifications', 'Logo only — no wordmark. Body text follows voice guidelines strictly. No emojis without explicit brand approval.'],
  ['Email', 'HTML email uses the full nav-less template. Yellow header bar, white content body, black footer. System fonts as fallback.'],
  ['Social media', 'Profile mark: yellow on black square canvas. Cover images use the arc device at large scale. Campaign assets follow the bento grid.'],
]

const PRINT = [
  ['Business cards', 'Black card, yellow mark, white wordmark. Contact details in Inter Regular 8 pt / 12 pt leading. No bleed on short edge.'],
  ['Letterhead', 'White A4 / US Letter. Mark in top-left, 20 mm from trim. Footer bar in black (12 mm height) with legal micro-copy in white.'],
  ['Brochure', 'Two-column grid. Yellow accent band on cover. Photography bleeds to trim on inner spreads.'],
  ['Signage', 'White mark on yellow for exterior. Black mark on white for interior. Minimum mark size: 60 mm across.'],
]

export default function ApplicationsPage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">Resources</div>
          <h1>Applications</h1>
          <p className="lead">
            The Qi brand adapts across every surface without losing its identity. These
            application guidelines define how the system behaves in the real world.
          </p>
        </div>
      </section>

      <section className="section" id="digital">
        <div className="container">
          <h2>Digital</h2>
          <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
            {DIGITAL.map(([title, body]) => (
              <div key={title} className="card reveal">
                <h4>{title}</h4>
                <p style={{ margin: 0, fontSize: '.875rem' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="print">
        <div className="container">
          <h2>Print</h2>
          <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
            {PRINT.map(([title, body]) => (
              <div key={title} className="card reveal">
                <h4>{title}</h4>
                <p style={{ margin: 0, fontSize: '.875rem' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="environmental">
        <div className="container">
          <h2>Environmental</h2>
          <p>
            Branch interiors, ATM fascias, and event installations follow the full brand
            system. The bento grid scales to architectural proportions. The arc device at
            building scale is always rendered in brand-yellow vinyl or paint — never
            approximated. Contact the brand team for specification sheets for environmental
            applications.
          </p>
        </div>
      </section>

      <section className="section" id="compliance-note">
        <div className="container">
          <div className="card" style={{ background: 'var(--qi-black)', color: '#fff', borderRadius: 'var(--r-xl)' }}>
            <h3 style={{ color: 'var(--qi-yellow)', marginTop: 0 }}>Before you ship</h3>
            <p style={{ opacity: .85 }}>
              All design assets should pass through the{' '}
              <a href="/compliance" style={{ color: 'var(--qi-yellow)', fontWeight: 600 }}>Compliance Agent</a>{' '}
              before going live. Upload your design file or screenshot to receive a scored
              audit against all active brand rules.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
