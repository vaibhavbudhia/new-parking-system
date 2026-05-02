import { useState, useEffect } from 'react'
import API from '../api'

export default function AdminDash() {
    const [summary,  setSummary]  = useState(null)
    const [users,    setUsers]    = useState([])
    const [bookings, setBookings] = useState([])
    const [revenue,  setRevenue]  = useState([])
    const [tab,      setTab]      = useState('overview')

    useEffect(() => { loadAll() }, [])

    async function loadAll() {
        const [s, u, b, r] = await Promise.all([
            API.get('/admin/summary'),
            API.get('/admin/users'),
            API.get('/admin/all-bookings'),
            API.get('/reports/revenue')
        ])
        setSummary(s.data)
        setUsers(u.data)
        setBookings(b.data)
        setRevenue(r.data)
    }

    const tabs = ['overview','users','bookings','revenue']

    return (
        <div className="p-8" style={{ maxWidth:1100, margin:'0 auto' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color:'#e2e8f0' }}>Admin Dashboard</h2>

            {/* summary cards */}
            {summary && (
                <div className="grid gap-4 mb-6" style={{ gridTemplateColumns:'repeat(5,1fr)' }}>
                    {[
                        { l:'Available Slots', v:summary.available_slots, c:'#6ee7b7' },
                        { l:'Occupied Slots',  v:summary.occupied_slots,  c:'#f87171' },
                        { l:'Active Bookings', v:summary.active_bookings, c:'#fbbf24' },
                        { l:'Total Users',     v:summary.total_users,     c:'#818cf8' },
                        { l:"Today's Revenue", v:`₹${summary.today_revenue}`, c:'#34d399' },
                    ].map(c => (
                        <div key={c.l} className="p-4 rounded-xl"
                             style={{ background:'#161b27', border:'1px solid #2d3348' }}>
                            <div className="text-xl font-semibold mb-1" style={{ color:c.c }}>{c.v}</div>
                            <div className="text-xs" style={{ color:'#64748b' }}>{c.l}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* tabs */}
            <div className="flex gap-2 mb-6">
                {tabs.map(t => (
                    <button key={t} onClick={()=>setTab(t)}
                        className="px-4 py-2 rounded-lg text-sm capitalize"
                        style={{ background: tab===t?'#6ee7b7':'#161b27',
                                 color:      tab===t?'#0f1117':'#64748b',
                                 border:'1px solid #2d3348' }}>
                        {t}
                    </button>
                ))}
            </div>

            {/* USERS */}
            {tab === 'users' && (
                <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #2d3348' }}>
                    <div className="px-6 py-4" style={{ background:'#161b27', borderBottom:'1px solid #2d3348' }}>
                        <h3 className="font-medium" style={{ color:'#e2e8f0' }}>All Users ({users.filter(u=>u.Role==='user').length})</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr style={{ background:'#0f1117' }}>
                            {['Name','Username','Phone','Vehicle','Type','Bookings'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs"
                                    style={{ color:'#64748b', fontWeight:500 }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {users.filter(u=>u.Role==='user').map((u,i) => (
                                <tr key={u.Admin_ID}
                                    style={{ borderTop:'1px solid #1e2433', background:i%2===0?'#0f1117':'#161b27' }}>
                                    <td className="px-4 py-3" style={{ color:'#e2e8f0' }}>{u.Name}</td>
                                    <td className="px-4 py-3" style={{ color:'#94a3b8', fontFamily:'monospace', fontSize:12 }}>{u.Username}</td>
                                    <td className="px-4 py-3" style={{ color:'#64748b' }}>{u.Phone}</td>
                                    <td className="px-4 py-3" style={{ color:'#6ee7b7', fontFamily:'monospace', fontSize:12 }}>{u.Vehicle_Number || '—'}</td>
                                    <td className="px-4 py-3" style={{ color:'#94a3b8' }}>{u.Vehicle_Type?.replace('_',' ') || '—'}</td>
                                    <td className="px-4 py-3" style={{ color:'#fbbf24' }}>{u.Total_Bookings}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* BOOKINGS */}
            {tab === 'bookings' && (
                <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #2d3348' }}>
                    <div className="px-6 py-4" style={{ background:'#161b27', borderBottom:'1px solid #2d3348' }}>
                        <h3 className="font-medium" style={{ color:'#e2e8f0' }}>All Bookings</h3>
                    </div>
                    <div style={{ overflowX:'auto' }}>
                        <table className="w-full text-sm">
                            <thead><tr style={{ background:'#0f1117' }}>
                                {['#','Vehicle','Owner','Phone','Slot','Entry','Booked Until','Exit','Amount'].map(h => (
                                    <th key={h} className="px-3 py-3 text-left text-xs"
                                        style={{ color:'#64748b', fontWeight:500 }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {bookings.map((b,i) => (
                                    <tr key={b.Record_ID}
                                        style={{ borderTop:'1px solid #1e2433', background:i%2===0?'#0f1117':'#161b27' }}>
                                        <td className="px-3 py-3 text-xs" style={{ color:'#334155', fontFamily:'monospace' }}>#{b.Record_ID}</td>
                                        <td className="px-3 py-3" style={{ color:'#6ee7b7', fontFamily:'monospace', fontSize:12 }}>{b.Vehicle_Number}</td>
                                        <td className="px-3 py-3" style={{ color:'#e2e8f0' }}>{b.Owner_Name}</td>
                                        <td className="px-3 py-3" style={{ color:'#64748b' }}>{b.Phone}</td>
                                        <td className="px-3 py-3" style={{ color:'#fbbf24', fontFamily:'monospace', fontSize:12 }}>{b.Slot_Number}</td>
                                        <td className="px-3 py-3 text-xs" style={{ color:'#64748b' }}>{new Date(b.Entry_Time).toLocaleString()}</td>
                                        <td className="px-3 py-3 text-xs" style={{ color:'#64748b' }}>{b.Booking_End?new Date(b.Booking_End).toLocaleString():'—'}</td>
                                        <td className="px-3 py-3 text-xs" style={{ color:'#64748b' }}>{b.Exit_Time?new Date(b.Exit_Time).toLocaleString():'Active'}</td>
                                        <td className="px-3 py-3 font-medium" style={{ color:'#6ee7b7' }}>₹{b.Amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* REVENUE */}
            {tab === 'revenue' && (
                <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #2d3348' }}>
                    <div className="px-6 py-4" style={{ background:'#161b27', borderBottom:'1px solid #2d3348' }}>
                        <h3 className="font-medium" style={{ color:'#e2e8f0' }}>Daily Revenue</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr style={{ background:'#0f1117' }}>
                            {['Date','Transactions','Total Revenue'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs"
                                    style={{ color:'#64748b', fontWeight:500 }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {revenue.length===0 ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center"
                                        style={{ color:'#334155' }}>No revenue yet</td></tr>
                            ) : revenue.map((r,i) => (
                                <tr key={i} style={{ borderTop:'1px solid #1e2433', background:i%2===0?'#0f1117':'#161b27' }}>
                                    <td className="px-6 py-3" style={{ color:'#e2e8f0', fontFamily:'monospace', fontSize:12 }}>
                                        {new Date(r.Payment_Date).toLocaleDateString()}</td>
                                    <td className="px-6 py-3" style={{ color:'#94a3b8' }}>{r.Total_Transactions}</td>
                                    <td className="px-6 py-3 font-medium" style={{ color:'#6ee7b7' }}>₹{r.Total_Revenue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* OVERVIEW */}
            {tab === 'overview' && (
                <div className="p-6 rounded-xl" style={{ background:'#161b27', border:'1px solid #2d3348' }}>
                    <p className="text-sm mb-4" style={{ color:'#94a3b8' }}>
                        Use the tabs above to monitor users, bookings and revenue.
                        The summary cards update in real time.
                    </p>
                    <button onClick={loadAll}
                        className="px-6 py-2 rounded-lg text-sm"
                        style={{ background:'#6ee7b7', color:'#0f1117' }}>
                        Refresh Data
                    </button>
                </div>
            )}
        </div>
    )
}
