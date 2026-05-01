import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Voice & Tone — Qi Brand Center',
  description: 'The Qi brand voice: principles, tone variations, and writing guidelines.',
}

const PRINCIPLES = [
  {
    name: 'Human first',
    desc: 'We write like people, not institutions. Contractions are fine. Sentences can start with "And" or "But." We speak to the reader as an equal.',
    icon: '◎',
  },
  {
    name: 'Clear over clever',
    desc: 'Plain language beats jargon every time. If a simpler word exists, use it. Financial products are complex enough — our words shouldn\'t add to that.',
    icon: '◇',
  },
  {
    name: 'Direct',
    desc: 'We say what we mean. We don\'t hedge with "solutions" or "leverage." Active voice. Short sentences. Get to the point.',
    icon: '→',
  },
  {
    name: 'Warm',
    desc: 'Warmth is not fluff. It means we acknowledge that money is personal, that decisions are stressful, and that the reader is a human being with a life outside of banking.',
    icon: '◉',
  },
  {
    name: 'Confident',
    desc: 'We don\'t apologise for existing. We know what we offer and we say it plainly. Confidence is not arrogance — it is clarity without qualification.',
    icon: '▲',
  },
]

const TONE_CONTEXTS = [
  ['Onboarding', 'Warm, encouraging, reassuring. Focus on what the reader gains, not what they must do.'],
  ['Error messages', 'Calm, specific, actionable. Tell them what happened and exactly what to do next. Never blame.'],
  ['Legal / compliance', 'Clear and complete. Plain language where possible, but never sacrifice accuracy for brevity.'],
  ['Marketing', 'Energetic, optimistic, human. Lead with the benefit. Let the product speak.'],
  ['Support', 'Empathetic, patient, expert. The reader is frustrated — meet them there first.'],
  ['Notifications', 'Brief, specific, relevant. Tell them the one thing they need to know. No filler.'],
]

export default function VoicePage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">System</div>
          <h1>Voice &amp; Tone</h1>
          <p className="lead">
            Voice is who we are. Tone is how we adapt to the moment. The Qi voice never
            changes; our tone shifts to meet the reader where they are.
          </p>
        </div>
      </section>

      <section className="section" id="principles">
        <div className="container">
          <h2>Voice Principles</h2>
          <div className="grid grid-2" style={{ gap: '1.25rem', marginTop: '1.5rem' }}>
            {PRINCIPLES.map((p) => (
              <div key={p.name} className="card reveal" style={{ display: 'flex', gap: '1.25rem' }}>
                <div style={{ fontSize: '1.5rem', flexShrink: 0, opacity: .5, marginTop: '.2rem' }}>{p.icon}</div>
                <div>
                  <h4 style={{ marginBottom: '.5rem' }}>{p.name}</h4>
                  <p style={{ margin: 0, fontSize: '.875rem' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="tone">
        <div className="container">
          <h2>Tone by Context</h2>
          <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem .75rem 0' }}>Context</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 0 .75rem 1rem' }}>Tone guidance</th>
                </tr>
              </thead>
              <tbody>
                {TONE_CONTEXTS.map(([ctx, guidance]) => (
                  <tr key={ctx} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '.65rem 1rem .65rem 0', fontWeight: 600, fontSize: '.9rem', whiteSpace: 'nowrap' }}>{ctx}</td>
                    <td style={{ padding: '.65rem 0 .65rem 1rem', fontSize: '.875rem' }}>{guidance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" id="writing-rules">
        <div className="container">
          <h2>Writing Rules</h2>
          <div className="grid grid-3" style={{ gap: '1rem', marginTop: '1.5rem' }}>
            {[
              ['Sentence case', 'Headlines, buttons, and labels use sentence case. Title Case is reserved for proper nouns only.'],
              ['Punctuation', 'Oxford comma always. Em dash — not en dash — for interruptions. Avoid exclamation marks outside marketing copy.'],
              ['Numbers', 'Spell out one to nine. Use numerals for 10 and above, all monetary figures, and all data tables.'],
              ['Qi', 'Always capital Q, lowercase i. Never "QI," "qi," or stylised variants in body copy.'],
              ['Product names', 'Qi Pay, Qi Card, Qi Savings — capital Q, capital first letter of product name. No abbreviations.'],
              ['Inclusive language', 'Avoid gendered defaults. Use "they" for third-person singular. No ableist idioms.'],
            ].map(([title, body]) => (
              <div key={title as string} className="card reveal">
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
