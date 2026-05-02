import { useState, useEffect } from 'react'
import API from '../api'

export default function UserPanel() {
    const [booking,      setBooking]      = useState(null)
    const [vehicle,      setVehicle]      = useState(null)
    const [slots,        setSlots]        = useState([])
    const [history,      setHistory]      = useState([])
    const [selectedSlot, setSelectedSlot] = useState('')
    const [hours,        setHours]        = useState(1)
    const [payMode,      setPayMode]      = useState('upi')
    const [extHours,     setExtHours]     = useState(1)
    const [message,      setMessage]      = useState(null)
    const [loading,      setLoading]      = useState(false)
    const [tab,          setTab]          = useState('book')

    useEffect(() => { loadAll() }, [])

    async function loadAll() {
        try {
            const [b, v, h] = await Promise.all([
                API.get('/booking/my'),
                API.get('/booking/my-vehicle'),
                API.get('/booking/history')
            ])
            setBooking(b.data)
            setVehicle(v.data)
            setHistory(h.data)

            if (!b.data && v.data) {
                const s = await API.get(`/slots/available?type=${v.data.Vehicle_Type}`)
                setSlots(s.data)
            }
        } catch {}
    }

    function flash(msg, ok=true) {
        setMessage({ text:msg, ok })
        setTimeout(() => setMessage(null), 5000)
    }

    async function handleBook(e) {
        e.preventDefault(); setLoading(true)
        try {
            const res = await API.post('/booking/book', {
                slot_id: selectedSlot, hours, payment_mode: payMode
            })
            flash(`Booked! Slot ${res.data.data.Slot_ID} until ${new Date(res.data.data.Booking_End).toLocaleTimeString()}`)
            loadAll()
        } catch(err) { flash(err.response?.data?.message || 'Booking failed', false) }
        finally { setLoading(false) }
    }

    async function handleExtend(e) {
        e.preventDefault(); setLoading(true)
        try {
            await API.post('/booking/extend', {
                record_id: booking.Record_ID, extra_hours: extHours, payment_mode: payMode
            })
            flash(`Extended by ${extHours} hour(s)!`)
            loadAll()
        } catch(err) { flash(err.response?.data?.message || 'Extension failed', false) }
        finally { setLoading(false) }
    }

    async function handleCheckout() {
        if (!window.confirm('Confirm checkout?')) return
        setLoading(true)
        try {
            await API.post('/booking/checkout', { record_id: booking.Record_ID })
            flash('Checked out successfully!')
            loadAll()
        } catch(err) { flash(err.response?.data?.message || 'Checkout failed', false) }
        finally { setLoading(false) }
    }

    const inp = { background:'#0f1117', border:'1px solid #2d3348', color:'#e2e8f0',
                  borderRadius:8, padding:'10px 14px', fontSize:13, width:'100%', outline:'none' }
    const lb  = { fontSize:11, color:'#64748b', marginBottom:4, display:'block' }

    const minRemaining = booking ? Math.max(0, Math.round(
        (new Date(booking.Booking_End) - new Date()) / 60000
    )) : 0

    return (
        <div className="p-8" style={{ maxWidth:900, margin:'0 auto' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color:'#e2e8f0' }}>My Parking</h2>
            {vehicle && <p className="text-sm mb-6" style={{ color:'#64748b' }}>
                Vehicle: <span style={{ color:'#6ee7b7', fontFamily:'monospace' }}>{vehicle.Vehicle_Number}</span>
                {' '}· {vehicle.Vehicle_Type.replace('_',' ')}
            </p>}

            {message && <div className="mb-6 px-4 py-3 rounded-lg text-sm"
                style={{ background: message.ok ? '#0f2a1f':'#2a1010',
                         color:      message.ok ? '#6ee7b7':'#f87171',
                         border:`1px solid ${message.ok?'#1a4a35':'#4a1a1a'}` }}>
                {message.text}
            </div>}

            {/* ACTIVE BOOKING */}
            {booking && (
                <div className="p-6 rounded-xl mb-6"
                     style={{ background:'#161b27', border:'1px solid #2d3348' }}>
                    <h3 className="font-medium mb-4" style={{ color:'#fbbf24' }}>Active Booking</h3>
                    <div className="grid gap-3 mb-5" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
                        {[
                            { l:'Slot',     v: booking.Slot_Number },
                            { l:'Floor',    v: booking.Floor },
                            { l:'Time Left',v: `${minRemaining} min`, hi: minRemaining < 15 },
                            { l:'Entry',    v: new Date(booking.Entry_Time).toLocaleTimeString() },
                            { l:'Paid Until',v:new Date(booking.Booking_End).toLocaleTimeString() },
                            { l:'Amount',   v: `₹${booking.Amount}` },
                        ].map(c => (
                            <div key={c.l} className="p-3 rounded-lg" style={{ background:'#0f1117' }}>
                                <div className="text-xs mb-1" style={{ color:'#64748b' }}>{c.l}</div>
                                <div className="font-medium" style={{ color: c.hi?'#f87171':'#e2e8f0', fontFamily:'monospace', fontSize:13 }}>{c.v}</div>
                            </div>
                        ))}
                    </div>

                    {/* tab buttons */}
                    <div className="flex gap-2 mb-4">
                        {['extend','checkout'].map(t => (
                            <button key={t} onClick={()=>setTab(t)}
                                className="px-4 py-2 rounded-lg text-sm capitalize"
                                style={{ background: tab===t?'#6ee7b7':'#1e2433',
                                         color:      tab===t?'#0f1117':'#94a3b8',
                                         border:'1px solid #2d3348' }}>
                                {t === 'extend' ? 'Extend Time' : 'Checkout'}
                            </button>
                        ))}
                    </div>

                    {tab === 'extend' && (
                        <form onSubmit={handleExtend} className="flex gap-3 items-end flex-wrap">
                            <div style={{ flex:1, minWidth:120 }}>
                                <label style={lb}>EXTRA HOURS</label>
                                <input type="number" min={1} max={12} value={extHours}
                                       onChange={e=>setExtHours(e.target.value)} style={inp} />
                            </div>
                            <div style={{ flex:1, minWidth:120 }}>
                                <label style={lb}>PAYMENT MODE</label>
                                <select value={payMode} onChange={e=>setPayMode(e.target.value)} style={inp}>
                                    <option value="upi">UPI</option>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                </select>
                            </div>
                            <div style={{ flex:1, minWidth:120 }}>
                                <div className="text-xs mb-1" style={{ color:'#64748b' }}>EXTRA CHARGE</div>
                                <div className="py-2 px-3 rounded-lg text-sm font-medium"
                                     style={{ background:'#0f1117', color:'#6ee7b7', border:'1px solid #2d3348' }}>
                                    ₹{extHours * (vehicle?.Vehicle_Type === 'two_wheeler' ? 10 : vehicle?.Vehicle_Type === 'heavy' ? 40 : 20)}
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="px-6 py-2 rounded-lg text-sm font-medium"
                                style={{ background:'#6ee7b7', color:'#0f1117', whiteSpace:'nowrap' }}>
                                {loading ? '...' : 'Pay & Extend'}
                            </button>
                        </form>
                    )}

                    {tab === 'checkout' && (
                        <div>
                            <p className="text-sm mb-4" style={{ color:'#94a3b8' }}>
                                You will be checking out your vehicle from Slot {booking.Slot_Number}.
                                The slot will become available immediately.
                            </p>
                            <button onClick={handleCheckout} disabled={loading}
                                className="px-8 py-3 rounded-lg font-medium text-sm"
                                style={{ background:'#f87171', color:'#fff' }}>
                                {loading ? 'Processing...' : 'Confirm Checkout'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* BOOK A SLOT */}
            {!booking && vehicle && (
                <div className="p-6 rounded-xl mb-6"
                     style={{ background:'#161b27', border:'1px solid #2d3348' }}>
                    <h3 className="font-medium mb-4" style={{ color:'#6ee7b7' }}>Book a Slot</h3>
                    {slots.length === 0 ? (
                        <p style={{ color:'#64748b', fontSize:13 }}>No available slots for your vehicle type right now.</p>
                    ) : (
                        <form onSubmit={handleBook} className="flex flex-col gap-4">
                            <div>
                                <label style={lb}>SELECT SLOT</label>
                                <select value={selectedSlot} onChange={e=>setSelectedSlot(e.target.value)} style={inp} required>
                                    <option value="">-- choose a slot --</option>
                                    {slots.map(s => (
                                        <option key={s.Slot_ID} value={s.Slot_ID}>
                                            Slot {s.Slot_Number} — {s.Floor} Floor
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <div style={{ flex:1, minWidth:120 }}>
                                    <label style={lb}>HOURS</label>
                                    <input type="number" min={1} max={24} value={hours}
                                           onChange={e=>setHours(e.target.value)} style={inp} />
                                </div>
                                <div style={{ flex:1, minWidth:120 }}>
                                    <label style={lb}>PAYMENT MODE</label>
                                    <select value={payMode} onChange={e=>setPayMode(e.target.value)} style={inp}>
                                        <option value="upi">UPI</option>
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                    </select>
                                </div>
                                <div style={{ flex:1, minWidth:120 }}>
                                    <div className="text-xs mb-1" style={{ color:'#64748b' }}>TOTAL CHARGE</div>
                                    <div className="py-2 px-3 rounded-lg text-sm font-medium"
                                         style={{ background:'#0f1117', color:'#6ee7b7', border:'1px solid #2d3348' }}>
                                        ₹{hours * (vehicle?.Vehicle_Type === 'two_wheeler' ? 10 : vehicle?.Vehicle_Type === 'heavy' ? 40 : 20)}
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="py-3 rounded-lg font-medium text-sm"
                                style={{ background:'#6ee7b7', color:'#0f1117' }}>
                                {loading ? 'Booking...' : 'Pay & Book Slot'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* HISTORY */}
            <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #2d3348' }}>
                <div className="px-6 py-4" style={{ background:'#161b27', borderBottom:'1px solid #2d3348' }}>
                    <h3 className="font-medium" style={{ color:'#e2e8f0' }}>My Booking History</h3>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background:'#0f1117' }}>
                            {['Slot','Entry','Booked Until','Exit','Amount'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs"
                                    style={{ color:'#64748b', fontWeight:500 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center"
                                    style={{ color:'#334155' }}>No bookings yet</td></tr>
                        ) : history.map((h,i) => (
                            <tr key={h.Record_ID}
                                style={{ borderTop:'1px solid #1e2433',
                                         background: i%2===0?'#0f1117':'#161b27' }}>
                                <td className="px-4 py-3" style={{ color:'#fbbf24', fontFamily:'monospace', fontSize:12 }}>{h.Slot_Number}</td>
                                <td className="px-4 py-3 text-xs" style={{ color:'#64748b' }}>{new Date(h.Entry_Time).toLocaleString()}</td>
                                <td className="px-4 py-3 text-xs" style={{ color:'#64748b' }}>{new Date(h.Booking_End).toLocaleString()}</td>
                                <td className="px-4 py-3 text-xs" style={{ color:'#64748b' }}>{h.Exit_Time ? new Date(h.Exit_Time).toLocaleString() : '—'}</td>
                                <td className="px-4 py-3 font-medium" style={{ color:'#6ee7b7' }}>₹{h.Amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
