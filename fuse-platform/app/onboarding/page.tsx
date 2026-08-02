import { createOrg } from '../actions'

export const dynamic = 'force-dynamic'

const MODULES = [
  { key: 'golf', label: 'Golf Outings' },
  { key: 'raffle', label: 'Raffles' },
  { key: 'auction', label: 'Auctions' },
  { key: 'store', label: 'Team Store' },
  { key: 'streaming', label: 'Streaming' },
  { key: 'fuse', label: 'Fuse (prediction game)' },
  { key: 'sponsorship', label: 'Sponsorship CRM' },
  { key: 'dashboard', label: 'Dashboard' },
]

const label = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mute)', margin: '14px 0 5px' } as const
const input = { width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 14, background: '#fff' } as const

export default function Onboarding() {
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <div className="crumb"><a href="/">Dashboard</a> · Onboarding</div>
      <h1>Create your organization</h1>
      <p className="sub">Everything a new club needs to start raising money — in one form.</p>

      <form action={createOrg}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 2 }}>1 · Identity</div>
          <label style={label}>Public name</label>
          <input style={input} name="public_name" placeholder="Riverside Little League" required />
          <label style={label}>Legal name</label>
          <input style={input} name="legal_name" placeholder="Riverside Little League Inc." />
          <div className="grid cols-3" style={{ marginTop: 4 }}>
            <div>
              <label style={label}>Entity type</label>
              <select style={input} name="entity_type" defaultValue="nonprofit_501c3">
                <option value="nonprofit_501c3">501(c)(3)</option>
                <option value="nonprofit_other">Other nonprofit</option>
                <option value="for_profit">For-profit</option>
                <option value="unincorporated">Unincorporated</option>
              </select>
            </div>
            <div>
              <label style={label}>Jurisdiction</label>
              <input style={input} name="jurisdiction" defaultValue="US-NJ" />
            </div>
            <div>
              <label style={label}>Annual goal ($)</label>
              <input style={input} name="goal" type="number" defaultValue="75000" />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>2 · Brand</div>
          <div className="grid cols-3">
            <div>
              <label style={label}>Primary</label>
              <input style={{ ...input, height: 42, padding: 4 }} name="brand_primary" type="color" defaultValue="#F6A93B" />
            </div>
            <div>
              <label style={label}>Accent</label>
              <input style={{ ...input, height: 42, padding: 4 }} name="brand_accent" type="color" defaultValue="#FF6A2B" />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>3 · Payments</div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
            <input type="checkbox" name="connect" defaultChecked />
            Connect payouts (Stripe Connect — simulated in dev, no account needed)
          </label>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>4 · Modules</div>
          <div className="grid cols-3">
            {MODULES.map((m) => (
              <label key={m.key} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
                <input type="checkbox" name="modules" value={m.key} defaultChecked={['golf', 'raffle', 'auction', 'dashboard'].includes(m.key)} />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <button className="btn spark" style={{ marginTop: 16, width: '100%', padding: 14 }}>
          Create organization →
        </button>
      </form>
    </div>
  )
}
