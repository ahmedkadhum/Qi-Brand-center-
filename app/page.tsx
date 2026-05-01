import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Qi Brand Center — The single source of truth for the Qi brand',
  description: 'A living system for designers, marketers, and partners. Identity, voice, color, type, iconography, layout, and downloadable assets.',
}

const QiLogoSvg = () => (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <g fill="currentColor" transform="translate(0 -2) scale(.20887)">
      <path d="M238.07,394.25c22.74,0.17,44.36-4.61,63.88-13.26l61.71,62.67c-36.77,22.41-80.01,35.24-126.24,34.87C105.26,477.52-1.02,369.55,0.01,237.41C1.04,105.25,108.99-1.03,241.14,0.01c132.14,1.02,238.43,108.97,237.41,241.13c-0.35,44.42-12.82,85.87-34.2,121.37l-62.21-63.18c7.63-18.11,11.94-37.97,12.1-58.84c0.66-85.6-68.19-155.5-153.76-156.17c-85.61-0.68-155.52,68.16-156.19,153.76C83.64,323.66,152.47,393.58,238.07,394.25 M193.2,239.27c0,25.46,20.62,46.08,46.07,46.08c25.46,0,46.09-20.62,46.09-46.08c0-25.44-20.63-46.07-46.09-46.07C213.82,193.21,193.2,213.83,193.2,239.27 M466.94,410.26L342.8,286.12c-15.76-15.76-41.3-15.76-57.06,0c-15.75,15.76-15.75,41.31,0,57.07l124.12,124.14c15.77,15.75,41.31,15.75,57.07,0C482.71,451.55,482.71,426.02,466.94,410.26" />
    </g>
  </svg>
)

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="hero container">
        <div className="mesh"></div>

        <div className="row reveal" style={{ marginBottom: '28px' }}>
          <span className="tag"><span className="dot"></span> Brand Guidelines · v0.2 just shipped</span>
          <span className="muted" style={{ fontSize: '.84rem' }}>14 sections · 60+ approved assets</span>
        </div>

        <h1 className="h-display reveal">
          The single source<br />of truth for <span style={{ background: 'var(--qi-yellow)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>everything Qi</span>.
        </h1>
        <p className="lead reveal" style={{ marginTop: '24px', maxWidth: '64ch' }}>
          A living system for designers, marketers, and partners. Identity, voice, color, type, iconography, layout, and downloadable assets — built around protection, simplicity, and a fresh outlook.
        </p>
        <div className="row reveal" style={{ marginTop: '28px', gap: '10px' }}>
          <Link className="btn btn-yellow" href="/identity">
            Explore the system
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </Link>
          <Link className="btn btn-ghost" href="/downloads">Download brand kit</Link>
        </div>
      </section>

      {/* HERO BENTO */}
      <section className="container reveal" style={{ marginTop: '48px' }}>
        <div className="bento cols-12">
          {/* Live brandmark stage */}
          <div className="b-cell flush b-6 r-2" style={{ minHeight: '380px' }}>
            <div className="mark-stage">
              <QiLogoSvg />
            </div>
          </div>

          {/* Stat: colors */}
          <div className="b-cell b-3">
            <div className="stat-card">
              <div className="label">Primary</div>
              <div>
                <div className="k">4</div>
                <div className="v">Brand colors</div>
              </div>
            </div>
          </div>

          {/* Stat: secondary */}
          <div className="b-cell b-3 yellow">
            <div className="stat-card">
              <div className="label">Secondary</div>
              <div>
                <div className="k">+4</div>
                <div className="v">Audience palettes</div>
              </div>
            </div>
          </div>

          {/* Color wheel */}
          <div className="b-cell flush b-3">
            <div className="wheel" aria-hidden="true">
              <span className="core">Qi</span>
            </div>
          </div>

          {/* Type sample */}
          <div className="b-cell b-3 dark">
            <div className="type-card">
              <div className="label">Typography</div>
              <p className="type-sample" style={{ color: '#fff' }}>Aa<br /><span className="accent">آب</span></p>
              <div className="muted" style={{ color: 'rgba(255,255,255,.55)', fontSize: '.78rem' }}>FF Mark · 29LT Bukra</div>
            </div>
          </div>

          {/* Big quote */}
          <div className="b-cell b-9" style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
            <div className="label">Brand foundation</div>
            <p style={{ fontFamily: '"Inter Tight",sans-serif', fontWeight: 600, fontSize: 'clamp(1.4rem,2.2vw,2rem)', lineHeight: 1.15, letterSpacing: '-.025em', margin: '18px 0 0', color: 'var(--ink)' }}>
              Protection, made effortless. Every visual and verbal choice in the Qi brand starts from one idea — being a reliable, modern partner that makes financial life simpler for everyone.
            </p>
            <div className="row" style={{ marginTop: '18px' }}>
              <Link href="/identity" className="btn btn-sm btn-ghost">Read the foundation →</Link>
            </div>
          </div>

          {/* Icon mosaic */}
          <div className="b-cell b-3" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div className="label">Iconography</div>
              <div className="muted mono" style={{ fontSize: '.7rem' }}>14</div>
            </div>
            <div className="icon-mosaic">
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5c0-1 .8-1.8 2.5-1.8s2.5.8 2.5 1.8-1 1.6-2.5 2-2.5 1-2.5 2 .8 1.8 2.5 1.8 2.5-.8 2.5-1.8M12 6v1.7M12 16.3V18" /></svg></div>
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12a7 7 0 0 1 14 0v4a3 3 0 0 1-3 3h-1v-7h4M5 12v4a3 3 0 0 0 3 3h1v-7H5" /></svg></div>
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 8h13l-3-3M20 16H7l3 3" /></svg></div>
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10l9-6 9 6M5 10v9h14v-9" /></svg></div>
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 12h2M11 12h2M15 12h2" /></svg></div>
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="3" width="16" height="18" rx="2" /><rect x="7" y="6" width="10" height="5" /><path d="M8 15h8M8 18h8" /></svg></div>
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7z" /></svg></div>
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 9a7 7 0 0 1 14 0v3M5 12v1a7 7 0 0 0 5 6.7" /></svg></div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="container" style={{ marginTop: '80px' }}>
        <div className="marquee">
          <div className="marquee-track">
            <span>Protection</span><span className="star"></span>
            <span>Simplicity</span><span className="star"></span>
            <span>Fresh outlook</span><span className="star"></span>
            <span>Confident</span><span className="star"></span>
            <span>Human</span><span className="star"></span>
            <span>Modern</span><span className="star"></span>
            <span>Geometric</span><span className="star"></span>
            <span>Yellow + Black</span><span className="star"></span>
            <span>Protection</span><span className="star"></span>
            <span>Simplicity</span><span className="star"></span>
            <span>Fresh outlook</span><span className="star"></span>
            <span>Confident</span><span className="star"></span>
            <span>Human</span><span className="star"></span>
            <span>Modern</span><span className="star"></span>
            <span>Geometric</span><span className="star"></span>
            <span>Yellow + Black</span><span className="star"></span>
          </div>
        </div>
      </section>

      {/* COLOR SPOTLIGHT */}
      <section className="section container">
        <div className="section-head reveal">
          <div>
            <span className="eyebrow">02 — Color</span>
            <h2 className="h-1" style={{ marginTop: '14px' }}>Four primaries.<br />Six Spectrum accents.</h2>
          </div>
          <p className="right">Yellow and Black are the heart of Qi. Bright Teal adds freshness. The Spectrum extends the system into customer cohorts.</p>
        </div>

        <div className="bento cols-12 reveal">
          <div className="b-cell b-3" style={{ background: '#F2CD00', color: '#000', borderColor: 'transparent' }}>
            <div className="stat-card">
              <div style={{ fontSize: '.7rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(0,0,0,.6)', fontWeight: 500 }}>Primary 01</div>
              <div>
                <div className="k">Yellow</div>
                <div className="mono" style={{ marginTop: '6px', color: 'rgba(0,0,0,.7)' }}>#F2CD00</div>
              </div>
            </div>
          </div>
          <div className="b-cell b-3" style={{ background: '#000', color: '#fff', borderColor: '#1c1c1c' }}>
            <div className="stat-card">
              <div style={{ fontSize: '.7rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', fontWeight: 500 }}>Primary 02</div>
              <div>
                <div className="k">Black</div>
                <div className="mono" style={{ marginTop: '6px', color: 'rgba(255,255,255,.6)' }}>#000000</div>
              </div>
            </div>
          </div>
          <div className="b-cell b-3 teal">
            <div className="stat-card">
              <div style={{ fontSize: '.7rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>Primary 03</div>
              <div>
                <div className="k">Teal</div>
                <div className="mono" style={{ marginTop: '6px', color: 'rgba(255,255,255,.7)' }}>#00BFB3</div>
              </div>
            </div>
          </div>
          <div className="b-cell b-3" style={{ border: '1px dashed var(--line-2)' }}>
            <div className="stat-card">
              <div className="label">Primary 04</div>
              <div>
                <div className="k">White</div>
                <div className="mono" style={{ marginTop: '6px', color: 'var(--ink-3)' }}>#FFFFFF</div>
              </div>
            </div>
          </div>
          <div className="b-cell b-12" style={{ padding: '24px' }}>
            <div className="between" style={{ marginBottom: '18px' }}>
              <div>
                <div className="label">Spectrum</div>
                <div className="h-3" style={{ marginTop: '8px' }}>Six life-stage accents</div>
              </div>
              <Link className="btn btn-sm btn-ghost" href="/color#spectrum">See the system →</Link>
            </div>
            <div className="swatch-row">
              <button style={{ background: '#F87171', color: '#fff' }}>Spark<br /><span style={{ opacity: .85 }}>15–22</span></button>
              <button style={{ background: '#0891B2', color: '#fff' }}>Pulse<br /><span style={{ opacity: .85 }}>23–32</span></button>
              <button style={{ background: '#4338CA', color: '#fff' }}>Path<br /><span style={{ opacity: .85 }}>33–44</span></button>
              <button style={{ background: '#C2410C', color: '#fff' }}>Hearth<br /><span style={{ opacity: .85 }}>45–59</span></button>
              <button style={{ background: '#047857', color: '#fff' }}>Grace<br /><span style={{ opacity: .85 }}>60–74</span></button>
              <button style={{ background: '#B45309', color: '#fff' }}>Legacy<br /><span style={{ opacity: .85 }}>75+</span></button>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORE TILES */}
      <section className="section container">
        <div className="section-head reveal">
          <div>
            <span className="eyebrow">Explore</span>
            <h2 className="h-1" style={{ marginTop: '14px' }}>Pick a chapter.</h2>
          </div>
          <p className="right">Built for designers, marketers, partners, and anyone telling the Qi story — internally or externally.</p>
        </div>

        <div className="grid grid-3 reveal">
          <Link className="tile bg-ink" href="/identity">
            <div className="arrow">↗</div>
            <div className="label">01 — Identity</div>
            <h3>Brandmark &amp; logo</h3>
            <p>The Qi icon, wordmark, clearspace, sizing, and color variations.</p>
          </Link>
          <Link className="tile bg-yellow" href="/color">
            <div className="arrow">↗</div>
            <div className="label">02 — Color</div>
            <h3>Yellow, Black, Teal &amp; Spectrum</h3>
            <p>The primary palette plus six life-stage accents.</p>
          </Link>
          <Link className="tile bg-gray" href="/typography">
            <div className="arrow">↗</div>
            <div className="label">03 — Typography</div>
            <h3>FF Mark Pro &amp; 29LT Bukra</h3>
            <p>The voices of Qi in Latin and Arabic, plus digital safe fonts.</p>
          </Link>
          <Link className="tile bg-teal" href="/iconography">
            <div className="arrow">↗</div>
            <div className="label">04 — Iconography</div>
            <h3>14 named icons</h3>
            <p>The full Qi service map — from Loan to Biometrics — on a 10×10 grid.</p>
          </Link>
          <Link className="tile bg-soft" href="/imagery">
            <div className="arrow">↗</div>
            <div className="label">05 — Imagery</div>
            <h3>Image style</h3>
            <p>Lifestyle and still life, on-brand color, easy and care-free.</p>
          </Link>
          <Link className="tile bg-pulse" href="/grids-layout">
            <div className="arrow">↗</div>
            <div className="label">06 — Layout</div>
            <h3>Grids &amp; layouts</h3>
            <p>Vertical and horizontal modular grids that scale to any format.</p>
          </Link>
        </div>
      </section>

      {/* SECONDARY PALETTE */}
      <section className="section container">
        <div className="section-head reveal">
          <div>
            <span className="eyebrow">Secondary color</span>
            <h2 className="h-1" style={{ marginTop: '14px' }}>A palette for every audience.</h2>
          </div>
          <p className="right">Four audience-led palettes — Male, Female, Kids, Youth. Use them when a campaign or product is built for a specific cohort.</p>
        </div>
        <div className="grid grid-2 reveal">
          <Link className="tile bg-male" href="/color#secondary"><div className="arrow">↗</div><div className="label">Audience 01</div><h3>Male</h3><p>#1E3A5F — confident, dependable, mature. Banking &amp; payroll.</p></Link>
          <Link className="tile bg-female" href="/color#secondary"><div className="arrow">↗</div><div className="label">Audience 02</div><h3>Female</h3><p>#B5365A — warm, considered, sophisticated. Lifestyle &amp; savings.</p></Link>
          <Link className="tile bg-kids" href="/color#secondary"><div className="arrow">↗</div><div className="label">Audience 03</div><h3>Kids</h3><p>#FF6B35 — playful, bright, full of energy. Junior accounts.</p></Link>
          <Link className="tile bg-youth" href="/color#secondary"><div className="arrow">↗</div><div className="label">Audience 04</div><h3>Youth</h3><p>#6C5CE7 — bold, electric, future-leaning. Student &amp; first cards.</p></Link>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="section container">
        <div className="section-head reveal">
          <div>
            <span className="eyebrow">Principles</span>
            <h2 className="h-1" style={{ marginTop: '14px' }}>Three rules we never break.</h2>
          </div>
        </div>
        <div className="grid grid-3 reveal">
          <div className="card">
            <div className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12Z" /></svg></div>
            <span className="eyebrow">01</span>
            <h3 className="h-3" style={{ marginTop: '10px' }}>Be clear, not clever.</h3>
            <p>Simple word choices and clean structures beat jargon every time. If a sentence has to be re-read, it isn&apos;t done.</p>
          </div>
          <div className="card">
            <div className="icon" style={{ background: 'color-mix(in oklab,var(--qi-teal) 22%, var(--bg))' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009B8F" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg></div>
            <span className="eyebrow">02</span>
            <h3 className="h-3" style={{ marginTop: '10px' }}>Keep it human.</h3>
            <p>Talk to people the way they talk. Confident, warm, and never patronising.</p>
          </div>
          <div className="card">
            <div className="icon" style={{ background: 'color-mix(in oklab,#000 10%, var(--bg))' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg></div>
            <span className="eyebrow">03</span>
            <h3 className="h-3" style={{ marginTop: '10px' }}>Protect the system.</h3>
            <p>Stick to the palette, type, grid, and graphic device. Consistency is what builds trust.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section container">
        <div className="cta-banner reveal">
          <div>
            <span className="eyebrow" style={{ color: 'var(--qi-yellow)' }}>Ready to ship</span>
            <h2 style={{ marginTop: '12px' }}>Get the full Qi brand kit.</h2>
            <p>Logos, fonts, color tokens, icon library, and layout templates — packaged in one zip, ready to drop into Figma, Notion, or your codebase.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Link className="btn btn-yellow" href="/downloads">
              Download brand kit
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3v14M5 12l7 7 7-7" /></svg>
            </Link>
            <div className="muted" style={{ fontSize: '.78rem', marginTop: '10px', color: 'rgba(255,255,255,.6)' }}>~84 MB · Updated Apr 2026</div>
          </div>
        </div>
      </section>
    </>
  )
}
