import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../api'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error,    setError]    = useState('')
    const [loading,  setLoading]  = useState(false)
    const navigate = useNavigate()

    async function handleLogin(e) {
        e.preventDefault(); setLoading(true); setError('')
        try {
            const res = await API.post('/auth/login', { username, password })
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('role',  res.data.role)
            localStorage.setItem('name',  res.data.name)
            localStorage.setItem('id',    res.data.id)
            navigate(res.data.role === 'admin' ? '/admin' : '/park')
        } catch { setError('Invalid username or password') }
        finally  { setLoading(false) }
    }

    const inp = { background:'#0f1117', border:'1px solid #2d3348', color:'#e2e8f0',
                  borderRadius:8, padding:'10px 14px', fontSize:13, width:'100%', outline:'none' }

    return (
        <div className="min-h-screen flex items-center justify-center"
             style={{ background:'linear-gradient(135deg,#0f1117,#161b27)' }}>
            <div className="w-full max-w-sm p-8 rounded-2xl"
                 style={{ background:'#161b27', border:'1px solid #2d3348' }}>
                <div className="text-center mb-8">
                    <div className="text-4xl mb-3" style={{ color:'#6ee7b7' }}>⬡</div>
                    <h1 style={{ fontFamily:'monospace', fontSize:18, letterSpacing:3, color:'#e2e8f0' }}>PARKSYS</h1>
                    <p className="text-sm mt-1" style={{ color:'#64748b' }}>Parking Management System</p>
                </div>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs mb-1 block" style={{ color:'#64748b' }}>USERNAME</label>
                        <input value={username} onChange={e=>setUsername(e.target.value)}
                               placeholder="your username" style={inp} required />
                    </div>
                    <div>
                        <label className="text-xs mb-1 block" style={{ color:'#64748b' }}>PASSWORD</label>
                        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                               placeholder="••••••••" style={inp} required />
                    </div>
                    {error && <p className="text-sm text-center py-2 rounded-lg"
                                 style={{ background:'#2a1a1a', color:'#f87171' }}>{error}</p>}
                    <button type="submit" disabled={loading}
                        className="w-full py-3 rounded-lg font-medium text-sm mt-2"
                        style={{ background:'#6ee7b7', color:'#0f1117' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p className="text-center text-sm mt-4" style={{ color:'#64748b' }}>
                    No account?{' '}
                    <Link to="/register" style={{ color:'#6ee7b7' }}>Register here</Link>
                </p>
                <p className="text-center text-xs mt-4" style={{ color:'#334155' }}>
                    admin / admin123
                </p>
            </div>
        </div>
    )
}
