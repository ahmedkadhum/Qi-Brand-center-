import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Imagery — Qi Brand Center',
  description: 'Qi imagery guidelines: photography style, illustration, and usage rules.',
}

const DO_LIST = [
  'Real people in real situations — authentic moments, not posed stock',
  'Natural, diffused lighting — avoid harsh studio flash or heavy retouching',
  'Diverse representation across age, background, and lifestyle',
  'Colour-grade toward warmth — let brand yellow find its natural echo in scenes',
  'Leave breathing room — photography with open areas integrates with type and UI',
]

const DONT_LIST = [
  'Overposed, overly cheerful stock photography',
  'Heavy vignettes, lens-flare effects, or tilt-shift gimmicks',
  'Busy scenes that compete with text or the UI layer',
  'Monochromatic or heavily desaturated looks that conflict with brand vibrancy',
  'Watermarked, unlicensed, or AI-generated human faces without disclosure',
]

export default function ImageryPage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">System</div>
          <h1>Imagery</h1>
          <p className="lead">
            Photography and illustration carry the emotional weight of the Qi brand.
            They must feel warm, human, and real — never corporate or clichéd.
          </p>
        </div>
      </section>

      <section className="section" id="photography">
        <div className="container">
          <h2>Photography</h2>
          <div className="grid grid-2" style={{ gap: '2rem', marginTop: '1.5rem' }}>
            <div className="card reveal" style={{ borderTop: '3px solid var(--qi-teal)' }}>
              <h4 style={{ color: 'var(--qi-teal)' }}>Do</h4>
              <ul style={{ margin: 0, padding: '0 0 0 1.25rem' }}>
                {DO_LIST.map((item) => (
                  <li key={item} style={{ fontSize: '.875rem', marginBottom: '.5rem' }}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card reveal" style={{ borderTop: '3px solid #e05' }}>
              <h4 style={{ color: '#e05' }}>Don&apos;t</h4>
              <ul style={{ margin: 0, padding: '0 0 0 1.25rem' }}>
                {DONT_LIST.map((item) => (
                  <li key={item} style={{ fontSize: '.875rem', marginBottom: '.5rem' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="illustration">
        <div className="container">
          <h2>Illustration</h2>
          <p>
            Illustration is used sparingly — for empty states, onboarding, and conceptual
            explainers where photography cannot communicate abstract ideas. The illustration
            style is flat-geometric with a limited palette drawn from brand tokens. Stroke
            weight mirrors the icon system (2 px at 24 px scale).
          </p>
          <div className="grid grid-3" style={{ gap: '1rem', marginTop: '1.5rem' }}>
            {[
              ['Flat geometric', 'No gradients, no bevels, no drop shadows on illustration elements'],
              ['Brand palette only', 'Yellow, black, teal, and white. Audience colors are permitted in audience-specific illustrations'],
              ['Purposeful', 'Every illustration tells a single story. Multiple focal points are a misuse'],
            ].map(([title, body]) => (
              <div key={title as string} className="card reveal">
                <h4>{title}</h4>
                <p style={{ margin: 0, fontSize: '.875rem' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="integration">
        <div className="container">
          <h2>Integration with Layout</h2>
          <p>
            Images should never fight the layout grid. Bleed images to container edges on
            mobile. On desktop, full-bleed photography is reserved for hero zones only.
            Overlay text must always sit on a scrim or live in an area where contrast is
            verifiably sufficient — use the Compliance Agent to check.
          </p>
        </div>
      </section>
    </>
  )
}
