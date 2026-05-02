import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../api'

export default function Register() {
    const [form, setForm] = useState({
        name:'', username:'', password:'', phone:'',
        vehicle_number:'', vehicle_type:'four_wheeler'
    })
    const [error,   setError]   = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    function update(field, val) { setForm(f => ({ ...f, [field]: val })) }

    async function handleRegister(e) {
        e.preventDefault(); setLoading(true); setError('')
        try {
            await API.post('/auth/register', form)
            navigate('/')
        } catch(err) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally { setLoading(false) }
    }

    const inp = { background:'#0f1117', border:'1px solid #2d3348', color:'#e2e8f0',
                  borderRadius:8, padding:'10px 14px', fontSize:13, width:'100%', outline:'none' }
    const lb  = { fontSize:11, color:'#64748b', marginBottom:4, display:'block' }

    return (
        <div className="min-h-screen flex items-center justify-center py-8"
             style={{ background:'linear-gradient(135deg,#0f1117,#161b27)' }}>
            <div className="w-full max-w-sm p-8 rounded-2xl"
                 style={{ background:'#161b27', border:'1px solid #2d3348' }}>
                <div className="text-center mb-6">
                    <div className="text-3xl mb-2" style={{ color:'#6ee7b7' }}>⬡</div>
                    <h1 style={{ fontFamily:'monospace', fontSize:16, letterSpacing:3, color:'#e2e8f0' }}>REGISTER</h1>
                    <p className="text-xs mt-1" style={{ color:'#64748b' }}>Create your parking account</p>
                </div>
                <form onSubmit={handleRegister} className="flex flex-col gap-3">
                    <div><label style={lb}>FULL NAME</label>
                         <input value={form.name} onChange={e=>update('name',e.target.value)} style={inp} placeholder="Rajesh Kumar" required /></div>
                    <div><label style={lb}>USERNAME</label>
                         <input value={form.username} onChange={e=>update('username',e.target.value)} style={inp} placeholder="rajesh123" required /></div>
                    <div><label style={lb}>PASSWORD</label>
                         <input type="password" value={form.password} onChange={e=>update('password',e.target.value)} style={inp} placeholder="••••••••" required /></div>
                    <div><label style={lb}>PHONE</label>
                         <input value={form.phone} onChange={e=>update('phone',e.target.value)} style={inp} placeholder="9876543210" required /></div>
                    <div style={{ borderTop:'1px solid #2d3348', paddingTop:12, marginTop:4 }}>
                        <p className="text-xs mb-3" style={{ color:'#64748b' }}>VEHICLE DETAILS</p>
                        <div className="flex flex-col gap-3">
                            <div><label style={lb}>VEHICLE NUMBER</label>
                                 <input value={form.vehicle_number} onChange={e=>update('vehicle_number',e.target.value)}
                                        style={inp} placeholder="PB08AB1234" required /></div>
                            <div><label style={lb}>VEHICLE TYPE</label>
                                 <select value={form.vehicle_type} onChange={e=>update('vehicle_type',e.target.value)} style={inp}>
                                     <option value="two_wheeler">Two Wheeler</option>
                                     <option value="four_wheeler">Four Wheeler</option>
                                     <option value="heavy">Heavy Vehicle</option>
                                 </select></div>
                        </div>
                    </div>
                    {error && <p className="text-sm text-center py-2 rounded-lg"
                                 style={{ background:'#2a1a1a', color:'#f87171' }}>{error}</p>}
                    <button type="submit" disabled={loading}
                        className="w-full py-3 rounded-lg font-medium text-sm mt-2"
                        style={{ background:'#6ee7b7', color:'#0f1117' }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <p className="text-center text-sm mt-4" style={{ color:'#64748b' }}>
                    Already registered?{' '}
                    <Link to="/" style={{ color:'#6ee7b7' }}>Sign in</Link>
                </p>
            </div>
        </div>
    )
}
