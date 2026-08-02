// Server-rendered SVG charts. Palette validated with the dataviz skill:
// pillar categorical slots (blue/orange/aqua) pass all-pairs CVD ΔE 9.2; aqua
// is sub-3:1 on white so every series is DIRECT-LABELED (the relief rule).
import type { CSSProperties } from 'react'

export const PILLAR_COLOR: Record<string, string> = {
  Physical: '#2a78d6',
  Technical: '#eb6834',
  Psychological: '#1baf7a',
}
const INK = '#141414'
const MUTE = '#898781'
const GRID = '#e7e6e2'

// ---------------------------------------------------------------------------
// Radar / spider — one series (a player) across many domains. Vertices and axis
// labels are tinted by pillar so the three groups read at a glance.
// ---------------------------------------------------------------------------
export function Radar({
  axes,
  size = 340,
  max = 100,
}: {
  axes: { label: string; value: number; color?: string }[]
  size?: number
  max?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - 52
  const n = axes.length
  const ang = (i: number) => ((-90 + (i * 360) / n) * Math.PI) / 180
  const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))]
  const rings = [0.25, 0.5, 0.75, 1]
  const poly = axes.map((a, i) => pt(i, (R * Math.min(max, a.value)) / max).join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, display: 'block', margin: '0 auto' }} role="img" aria-label="RAW DNA radar">
      {rings.map((r, k) => (
        <polygon key={k} points={axes.map((_, i) => pt(i, R * r).join(',')).join(' ')} fill={k === rings.length - 1 ? '#fbfbfa' : 'none'} stroke={GRID} strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, R)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={GRID} strokeWidth={1} />
      })}
      <polygon points={poly} fill="var(--fuse)" fillOpacity={0.16} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, (R * Math.min(max, a.value)) / max)
        return <circle key={i} cx={x} cy={y} r={3.5} fill={a.color ?? INK} stroke="#fff" strokeWidth={1.5} />
      })}
      {axes.map((a, i) => {
        const [x, y] = pt(i, R + 16)
        const c = Math.cos(ang(i))
        const anchor = Math.abs(c) < 0.3 ? 'middle' : c > 0 ? 'start' : 'end'
        return (
          <text key={i} x={x} y={y} fontSize={9.5} fontWeight={600} textAnchor={anchor} dominantBaseline="middle" fill={a.color ?? MUTE}>
            {a.label}
          </text>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Multi-line trend — pillar scores over evaluation dates. Direct-labeled at the
// right end (identity without a legend box), recessive grid, dot per point.
// ---------------------------------------------------------------------------
export function TrendChart({
  labels,
  series,
  w = 620,
  h = 240,
  max = 100,
  min = 30,
}: {
  labels: string[]
  series: { name: string; color: string; values: number[] }[]
  w?: number
  h?: number
  max?: number
  min?: number
}) {
  const padL = 30
  const padR = 116
  const padT = 14
  const padB = 26
  const iw = w - padL - padR
  const ih = h - padT - padB
  const n = labels.length
  const x = (i: number) => padL + (n <= 1 ? iw / 2 : (iw * i) / (n - 1))
  const y = (v: number) => padT + ih * (1 - (v - min) / (max - min))
  const ticks = [min, Math.round((min + max) / 2), max]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="RAW pillar trend">
      {ticks.map((t, k) => (
        <g key={k}>
          <line x1={padL} y1={y(t)} x2={padL + iw} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={padL - 6} y={y(t)} fontSize={9} textAnchor="end" dominantBaseline="middle" fill={MUTE} style={{ fontVariantNumeric: 'tabular-nums' }}>{t}</text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={h - 8} fontSize={9} textAnchor="middle" fill={MUTE}>{l}</text>
      ))}
      {series.map((s) => {
        const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
        return (
          <g key={s.name}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.color} stroke="#fff" strokeWidth={1.5} />
            ))}
          </g>
        )
      })}
      {/* End labels, spread vertically so near-equal series don't collide. */}
      {(() => {
        const last = labels.length - 1
        const lab = series
          .map((s) => ({ name: s.name, color: s.color, v: s.values[s.values.length - 1], y: y(s.values[s.values.length - 1]) }))
          .sort((a, b) => a.y - b.y)
        const gap = 14
        for (let i = 1; i < lab.length; i++) if (lab[i].y - lab[i - 1].y < gap) lab[i].y = lab[i - 1].y + gap
        return lab.map((l) => (
          <text key={l.name} x={x(last) + 9} y={l.y} fontSize={11} fontWeight={700} dominantBaseline="middle" fill={l.color}>
            {l.name} {l.v}
          </text>
        ))
      })()}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Horizontal bars — magnitude comparison across categories (revenue by source).
// Plain HTML; value direct-labeled at the end of each row.
// ---------------------------------------------------------------------------
export function HBars({ items, fmt }: { items: { label: string; value: number; color?: string }[]; fmt: (n: number) => string }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '116px 1fr 86px', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{it.label}</span>
          <div style={{ height: 14, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(2, (it.value / max) * 100)}%`, background: it.color ?? 'var(--fuse)', borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(it.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Area — cumulative magnitude over time (money raised). Single series: gradient
// fill under a 2px line, y-axis money-formatted.
// ---------------------------------------------------------------------------
export function AreaChart({
  labels,
  values,
  fmt,
  w = 620,
  h = 210,
  color = 'var(--fuse)',
}: {
  labels: string[]
  values: number[]
  fmt: (n: number) => string
  w?: number
  h?: number
  color?: string
}) {
  const padL = 46
  const padR = 14
  const padT = 12
  const padB = 24
  const iw = w - padL - padR
  const ih = h - padT - padB
  const n = values.length
  const max = Math.max(...values, 1)
  const x = (i: number) => padL + (n <= 1 ? iw : (iw * i) / (n - 1))
  const y = (v: number) => padT + ih * (1 - v / max)
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(n - 1).toFixed(1)},${padT + ih} L${x(0).toFixed(1)},${padT + ih} Z`
  const ticks = [0, max / 2, max]
  const gid = 'area-grad'

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Money raised over time">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {ticks.map((t, k) => (
        <g key={k}>
          <line x1={padL} y1={y(t)} x2={padL + iw} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={padL - 6} y={y(t)} fontSize={9} textAnchor="end" dominantBaseline="middle" fill={MUTE} style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(t)}</text>
        </g>
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={color} />
      ))}
      {labels.map((l, i) => (i % Math.ceil(n / 6) === 0 || i === n - 1 ? <text key={i} x={x(i)} y={h - 7} fontSize={9} textAnchor="middle" fill={MUTE}>{l}</text> : null))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Sparkline — one tiny trend, last point marked. For roster rows.
// ---------------------------------------------------------------------------
export function Sparkline({ values, color = 'var(--fuse)', w = 88, h = 26 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (values.length < 2) return <svg width={w} height={h} />
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const x = (i: number) => (w * i) / (values.length - 1)
  const y = (v: number) => h - 2 - (h - 4) * ((v - min) / span)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const lx = x(values.length - 1)
  const ly = y(values[values.length - 1])
  return (
    <svg width={w} height={h} style={{ display: 'block' } as CSSProperties}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={2.6} fill={color} />
    </svg>
  )
}
