import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Graphic Device — Qi Brand Center',
  description: 'The Qi graphic device: the arc, its derivations, and layout applications.',
}

export default function GraphicDevicePage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">System</div>
          <h1>Graphic Device</h1>
          <p className="lead">
            The Qi graphic device is a direct derivation of the brandmark. The arc —
            extracted from the letter&nbsp;<em>Q</em> — becomes a flexible layout tool:
            a crop, a frame, a divider, and a motion path.
          </p>
        </div>
      </section>

      <section className="section" id="the-arc">
        <div className="container">
          <h2>The Arc</h2>
          <p>
            The primary device is the 270&nbsp;° open arc — the exact stroke that forms the
            outer boundary of the Qi mark, extracted and scaled independently. At large sizes
            it anchors hero layouts; at small sizes it functions as a decorative rule or
            section divider.
          </p>
          <div
            className="reveal"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 2rem',
              background: 'var(--bg-2)',
              borderRadius: 'var(--r-xl)',
              marginTop: '2rem',
            }}
          >
            <svg viewBox="0 0 200 200" width="160" height="160">
              <path
                d="M 100 10 A 90 90 0 1 1 172 172"
                fill="none"
                stroke="var(--qi-yellow)"
                strokeWidth="12"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </section>

      <section className="section" id="derivations">
        <div className="container">
          <h2>Derivations</h2>
          <div className="grid grid-3" style={{ gap: '1.25rem', marginTop: '1.5rem' }}>
            {[
              ['Arc crop', 'Photography masked inside the arc silhouette. Used for hero and feature imagery.'],
              ['Arc divider', 'A single quarter-circle used as a section transition between content areas.'],
              ['Arc halo', 'A full 360 ° ring (no descender) used as a container or emphasis ring around key data.'],
              ['Arc motion', 'In digital media, the arc animates as a progress or loading indicator, rotating on its own centre.'],
              ['Arc texture', 'At very large scale (> 800 px diameter) the arc renders at low opacity (8–12 %) as a background texture.'],
              ['Descender slash', 'The diagonal stroke of the Q used independently as an energetic graphic accent.'],
            ].map(([title, body]) => (
              <div key={title as string} className="card reveal">
                <h4>{title}</h4>
                <p style={{ margin: 0, fontSize: '.875rem' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="rules">
        <div className="container">
          <h2>Usage Rules</h2>
          <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
            {[
              ['Color', 'The arc device is always rendered in a single brand color — yellow, black, teal, or white. Gradients are never applied to the arc.'],
              ['Proportion', 'The arc must be drawn from the exact proportions of the brandmark. Do not flatten, elongate, or compress the ellipse.'],
              ['Placement', 'Anchor the arc to a layout edge. A floating arc with no connection to the grid reads as unintentional.'],
              ['Quantity', 'One arc device per layout. Two or more competing arcs creates visual confusion.'],
            ].map(([title, body]) => (
              <div key={title as string} className="card reveal" style={{ borderLeft: '3px solid var(--qi-yellow)' }}>
                <h4>{title}</h4>
                <p style={{ margin: 0, fontSize: '.875rem' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
