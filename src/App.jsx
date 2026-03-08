import { useState } from 'react'
import './App.css'

const BASE_URL = 'http://127.0.0.1:8000'
const DEFAULT_KEY = '00112233445566778899aabbccddeeff'

function parseError(err) {
  const detail = err?.detail
  if (!detail) return 'Request failed'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
  return JSON.stringify(detail)
}

/* ─────────────────────────────────────────────
   ENCRYPT CARD
───────────────────────────────────────────── */
function EncryptCard({ state, setState }) {
  const { plaintext, result, loading, error } = state
  const set = (patch) => setState((s) => ({ ...s, ...patch }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    set({ result: null, error: null, loading: true })
    try {
      const res = await fetch(`${BASE_URL}/crypto/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plaintext, secret_key: DEFAULT_KEY }),
      })
      if (!res.ok) throw new Error(parseError(await res.json()))
      set({ result: await res.json() })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  }

  return (
    <form className="crypto-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label>Plaintext</label>
        <textarea rows={4} value={plaintext}
          onChange={(e) => set({ plaintext: e.target.value })}
          placeholder="Enter text to encrypt…" required />
      </div>
      <div className="button-row">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? 'Encrypting…' : '🔒 Encrypt'}
        </button>
      </div>
      {error && <div className="result-box error"><span className="result-label">⚠ Error</span><p>{error}</p></div>}
      {result && !error && (
        <div className="result-box success">
          <span className="result-label">Encrypted Output</span>
          <div className="result-fields">
            <ResultRow label="Ciphertext" value={result.ciphertext} copyable />
            <ResultRow label="IV" value={result.iv} copyable />
            <ResultRow label="Message" value={result.message} />
          </div>
        </div>
      )}
    </form>
  )
}

/* ─────────────────────────────────────────────
   DECRYPT CARD
───────────────────────────────────────────── */
function DecryptCard({ state, setState }) {
  const { ciphertext, iv, result, loading, error } = state
  const set = (patch) => setState((s) => ({ ...s, ...patch }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    set({ result: null, error: null, loading: true })
    try {
      const res = await fetch(`${BASE_URL}/crypto/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciphertext, iv, secret_key: DEFAULT_KEY }),
      })
      if (!res.ok) throw new Error(parseError(await res.json()))
      set({ result: await res.json() })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  }

  return (
    <form className="crypto-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label>Ciphertext</label>
        <textarea rows={3} value={ciphertext}
          onChange={(e) => set({ ciphertext: e.target.value })}
          placeholder="Paste ciphertext here…" required />
      </div>
      <div className="field-group">
        <label>IV (Initialization Vector)</label>
        <input type="text" value={iv}
          onChange={(e) => set({ iv: e.target.value })}
          placeholder="Paste IV here…" required />
      </div>
      <div className="button-row">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? 'Decrypting…' : '🔓 Decrypt'}
        </button>
      </div>
      {error && <div className="result-box error"><span className="result-label">⚠ Error</span><p>{error}</p></div>}
      {result && !error && (
        <div className="result-box success">
          <span className="result-label">Decrypted Output</span>
          <div className="result-fields">
            <ResultRow label="Plaintext" value={result.plaintext ?? result.decrypted_text ?? ''} copyable />
          </div>
        </div>
      )}
    </form>
  )
}

/* ─────────────────────────────────────────────
   ANALYSIS SECTION
───────────────────────────────────────────── */
const ANALYSES = [
  { id: 'aes-comparison', label: '⚖️ AES Comparison', desc: 'Standard vs Dynamic AES ciphertext & IV' },
  { id: 'avalanche', label: '🌊 Avalanche Effect', desc: 'Bit-flip impact on ciphertext (≈50% ideal)' },
  { id: 'entropy', label: '📊 Entropy', desc: 'Shannon entropy of each ciphertext (max 8.0 bits/byte)' },
  { id: 'performance', label: '⏱ Performance', desc: 'Encrypt/decrypt timing for both AES variants' },
  { id: 'full-report', label: '📋 Full Report', desc: 'All analyses combined in one request' },
]

function AnalysisSection({ plaintext }) {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  const [expanded, setExpanded] = useState({})

  const run = async (id) => {
    if (!plaintext.trim()) {
      setErrors((e) => ({ ...e, [id]: 'Please enter plaintext in the Encrypt tab first.' }))
      return
    }
    setLoading((l) => ({ ...l, [id]: true }))
    setErrors((e) => ({ ...e, [id]: null }))
    setResults((r) => ({ ...r, [id]: null }))

    try {
      const res = await fetch(`${BASE_URL}/analysis/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plaintext, secret_key: DEFAULT_KEY }),
      })
      if (!res.ok) throw new Error(parseError(await res.json()))
      const data = await res.json()
      setResults((r) => ({ ...r, [id]: data }))
      setExpanded((x) => ({ ...x, [id]: true }))
    } catch (err) {
      setErrors((e) => ({ ...e, [id]: err.message }))
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
    }
  }

  const toggle = (id) => setExpanded((x) => ({ ...x, [id]: !x[id] }))

  return (
    <div className="analysis-section">
      <div className="analysis-header">
        <h2>🔬 Cryptographic Analysis</h2>
        <p className="analysis-subtitle">
          Runs against the plaintext entered above using the default AES-128 key
        </p>
      </div>

      <div className="analysis-list">
        {ANALYSES.map(({ id, label, desc }) => (
          <div key={id} className="analysis-card">
            <div className="analysis-card-top">
              <div className="analysis-meta">
                <span className="analysis-label">{label}</span>
                <span className="analysis-desc">{desc}</span>
              </div>
              <div className="analysis-actions">
                <button
                  className="btn-run"
                  onClick={() => run(id)}
                  disabled={loading[id]}
                >
                  {loading[id] ? <span className="spinner spinner-sm" /> : null}
                  {loading[id] ? 'Running…' : 'Run'}
                </button>
                {results[id] && (
                  <button className="btn-toggle" onClick={() => toggle(id)}>
                    {expanded[id] ? '▲ Hide' : '▼ Show'}
                  </button>
                )}
              </div>
            </div>

            {errors[id] && (
              <div className="analysis-error">⚠ {errors[id]}</div>
            )}

            {results[id] && expanded[id] && (
              <AnalysisResult id={id} data={results[id]} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ANALYSIS RESULT RENDERER
───────────────────────────────────────────── */
function AnalysisResult({ id, data }) {
  switch (id) {
    case 'aes-comparison':
      return (
        <div className="ar-grid">
          <StatBlock label="Standard Ciphertext" value={data.standard_ciphertext} mono />
          <StatBlock label="Standard IV" value={data.standard_iv} mono />
          <StatBlock label="Dynamic Ciphertext" value={data.dynamic_ciphertext} mono />
          <StatBlock label="Dynamic IV" value={data.dynamic_iv} mono />
        </div>
      )

    case 'avalanche':
      return (
        <div className="ar-grid">
          <StatBlock label="Standard Avalanche" value={`${data.standard_avalanche.toFixed(2)}%`} highlight={avalancheColor(data.standard_avalanche)} />
          <StatBlock label="Dynamic Avalanche" value={`${data.dynamic_avalanche.toFixed(2)}%`} highlight={avalancheColor(data.dynamic_avalanche)} />
          <div className="ar-full">
            <span className="stat-label">Changed Bits (first 64)</span>
            <BitGrid bits={data.visualization.changed_bits.slice(0, 64)} />
          </div>
        </div>
      )

    case 'entropy':
      return (
        <div className="ar-grid">
          <StatBlock label="Standard Entropy" value={`${data.standard_entropy.toFixed(4)} bits/byte`} highlight={entropyColor(data.standard_entropy)} />
          <StatBlock label="Dynamic Entropy" value={`${data.dynamic_entropy.toFixed(4)} bits/byte`} highlight={entropyColor(data.dynamic_entropy)} />
          <div className="ar-full">
            <span className="stat-label">Byte Frequency (top 20 bytes)</span>
            <FreqBars items={data.visualization.byte_frequency.slice(0, 20)} />
          </div>
        </div>
      )

    case 'performance':
      return (
        <div className="ar-grid">
          <StatBlock label="Std Encrypt Time" value={`${(data.standard_encrypt_time * 1000).toFixed(4)} ms`} />
          <StatBlock label="Dyn Encrypt Time" value={`${(data.dynamic_encrypt_time * 1000).toFixed(4)} ms`} />
          <StatBlock label="Std Decrypt Time" value={`${(data.standard_decrypt_time * 1000).toFixed(4)} ms`} />
          <StatBlock label="Dyn Decrypt Time" value={`${(data.dynamic_decrypt_time * 1000).toFixed(4)} ms`} />
          <div className="ar-full">
            <PerfBars labels={data.visualization.labels} values={data.visualization.values} />
          </div>
        </div>
      )

    case 'full-report':
      return (
        <div className="ar-grid">
          <StatBlock label="Standard Ciphertext" value={data.standard_ciphertext} mono />
          <StatBlock label="Dynamic Ciphertext" value={data.dynamic_ciphertext} mono />
          <StatBlock label="Std Avalanche" value={`${data.avalanche.standard.toFixed(2)}%`} highlight={avalancheColor(data.avalanche.standard)} />
          <StatBlock label="Dyn Avalanche" value={`${data.avalanche.dynamic.toFixed(2)}%`} highlight={avalancheColor(data.avalanche.dynamic)} />
          <StatBlock label="Std Entropy" value={`${data.entropy.standard.toFixed(4)} bits/byte`} highlight={entropyColor(data.entropy.standard)} />
          <StatBlock label="Dyn Entropy" value={`${data.entropy.dynamic.toFixed(4)} bits/byte`} highlight={entropyColor(data.entropy.dynamic)} />
          <StatBlock label="Std Enc Time" value={`${(data.performance.standard_encrypt * 1000).toFixed(4)} ms`} />
          <StatBlock label="Dyn Enc Time" value={`${(data.performance.dynamic_encrypt * 1000).toFixed(4)} ms`} />
          <StatBlock label="Std Dec Time" value={`${(data.performance.standard_decrypt * 1000).toFixed(4)} ms`} />
          <StatBlock label="Dyn Dec Time" value={`${(data.performance.dynamic_decrypt * 1000).toFixed(4)} ms`} />
          <div className="ar-full">
            <span className="stat-label">Round Keys</span>
            <div className="round-keys">
              {data.round_keys.map((k, i) => (
                <div key={i} className="round-key-row">
                  <span className="round-key-label">R{i}</span>
                  <code className="round-key-val">{k}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    default:
      return <pre className="ar-raw">{JSON.stringify(data, null, 2)}</pre>
  }
}

/* ─────────────────────────────────────────────
   SMALL DISPLAY COMPONENTS
───────────────────────────────────────────── */
function StatBlock({ label, value, mono, highlight }) {
  return (
    <div className="stat-block" style={highlight ? { borderLeftColor: highlight } : {}}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  )
}

function BitGrid({ bits }) {
  return (
    <div className="bit-grid">
      {bits.map((b, i) => (
        <div key={i} className={`bit-cell ${b ? 'changed' : 'same'}`} title={`Bit ${i}: ${b ? 'changed' : 'same'}`} />
      ))}
    </div>
  )
}

function FreqBars({ items }) {
  const max = Math.max(...items.map((x) => x.count), 1)
  return (
    <div className="freq-bars">
      {items.map(({ byte, count }) => (
        <div key={byte} className="freq-bar-wrap" title={`Byte 0x${byte.toString(16).padStart(2, '0')}: ${count}`}>
          <div className="freq-bar" style={{ height: `${(count / max) * 56}px` }} />
          <span className="freq-label">{byte.toString(16).padStart(2, '0')}</span>
        </div>
      ))}
    </div>
  )
}

function PerfBars({ labels, values }) {
  const max = Math.max(...values, 0.000001)
  return (
    <div className="perf-bars">
      {labels.map((lbl, i) => (
        <div key={i} className="perf-bar-wrap">
          <span className="perf-time">{(values[i] * 1000).toFixed(4)}ms</span>
          <div className="perf-bar" style={{ width: `${(values[i] / max) * 100}%` }} />
          <span className="perf-label">{lbl}</span>
        </div>
      ))}
    </div>
  )
}

function avalancheColor(v) {
  if (v >= 45 && v <= 55) return '#16a34a'
  if (v >= 35 && v <= 65) return '#ca8a04'
  return '#dc2626'
}

function entropyColor(v) {
  if (v >= 7.5) return '#16a34a'
  if (v >= 6.0) return '#ca8a04'
  return '#dc2626'
}

/* ─────────────────────────────────────────────
   SHARED RESULT ROW
───────────────────────────────────────────── */
function ResultRow({ label, value, copyable }) {
  return (
    <div className="result-row">
      <div className="result-row-header">
        <span className="result-row-label">{label}</span>
        {copyable && (
          <button type="button" className="copy-btn"
            onClick={() => navigator.clipboard.writeText(value)}>Copy</button>
        )}
      </div>
      <code className="result-row-value">{value}</code>
    </div>
  )
}

/* ─────────────────────────────────────────────
   INITIAL STATE
───────────────────────────────────────────── */
const initEncrypt = () => ({ plaintext: '', result: null, loading: false, error: null })
const initDecrypt = () => ({ ciphertext: '', iv: '', result: null, loading: false, error: null })

/* ─────────────────────────────────────────────
   APP
───────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState('encrypt')
  const [encState, setEncState] = useState(initEncrypt)
  const [decState, setDecState] = useState(initDecrypt)

  const handleRefresh = () => {
    setEncState(initEncrypt())
    setDecState(initDecrypt())
  }

  return (
    <div className="page">
      <header className="app-header">
        <div className="header-icon">🛡️</div>
        <h1>AES Encryption Tool</h1>
        <p className="subtitle">Dynamic AES-128 with LFSR-based Key Evolution</p>
      </header>

      {/* Two-column layout */}
      <div className="main-layout">
        {/* Left — Crypto Card */}
        <div className="card">
          <div className="tabs">
            <button className={`tab ${tab === 'encrypt' ? 'active' : ''}`} onClick={() => setTab('encrypt')}>
              🔒 Encrypt
            </button>
            <button className={`tab ${tab === 'decrypt' ? 'active' : ''}`} onClick={() => setTab('decrypt')}>
              🔓 Decrypt
            </button>
            <button type="button" className="tab tab-refresh" onClick={handleRefresh} title="Reset everything">
              ↺ Reset
            </button>
          </div>
          {tab === 'encrypt'
            ? <EncryptCard state={encState} setState={setEncState} />
            : <DecryptCard state={decState} setState={setDecState} />}
        </div>

        {/* Right — Analysis */}
        <AnalysisSection plaintext={encState.plaintext} />
      </div>

      <footer className="app-footer">
        AES-128 · CBC Mode · PKCS7 Padding · LFSR Key Evolution
      </footer>
    </div>
  )
}