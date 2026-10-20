import { useEffect, useState } from 'react'
import { healthApi } from '@/api/client'
import { ModelRegistry } from '@/pages/ModelRegistry'

function App() {
  const [apiReady, setApiReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkApi = async () => {
      try {
        await healthApi.check()
        setApiReady(true)
      } catch {
        setApiReady(false)
      } finally {
        setChecking(false)
      }
    }
    checkApi()
    const interval = setInterval(checkApi, 30000)
    return () => clearInterval(interval)
  }, [])

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
          <p>Connecting to API...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{
        background: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px',
            }}>
              A
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700 }}>Axiom Workbench</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className={`badge ${apiReady ? 'badge-success' : 'badge-danger'}`}>
              {apiReady ? 'API Connected' : 'API Disconnected'}
            </span>
          </div>
        </div>
      </header>
      <main>
        <ModelRegistry />
      </main>
      <footer style={{
        background: 'var(--color-bg-secondary)',
        borderTop: '1px solid var(--color-border)',
        padding: '16px 24px',
        marginTop: 'auto',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          <span>Axiom Workbench v1.0.0 — Alan Vo | AI & Machine Learning</span>
          <a href="https://github.com/ALANDVO/axiom-workbench-alan-vo" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  )
}

export default App