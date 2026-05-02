import { useState, useEffect } from 'react'
import API from '../api'

export default function SlotMap() {
    const [slots,  setSlots]  = useState([])
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        load()
        const t = setInterval(load, 10000)
        return () => clearInterval(t)
    }, [])

    async function load() {
        const res = await API.get('/slots')
        setSlots(res.data)
    }

    const filtered = filter === 'all' ? slots : slots.filter(s =>
        filter === 'occupied' ? s.Status === 'occupied' : s.Status === 'available'
    )
    const avail = slots.filter(s => s.Status === 'available').length
    const occ   = slots.filter(s => s.Status === 'occupied').length

    return (
        <div className="p-8" style={{ maxWidth:1000, margin:'0 auto' }}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold" style={{ color:'#e2e8f0' }}>Slot Map</h2>
                <span className="text-xs" style={{ color:'#334155' }}>Auto-refreshes every 10s</span>
            </div>

            <div className="grid gap-4 mb-6" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
                {[
                    { l:'Total',    v:slots.length, c:'#94a3b8' },
                    { l:'Available',v:avail,        c:'#6ee7b7' },
                    { l:'Occupied', v:occ,          c:'#f87171' },
                ].map(s => (
                    <div key={s.l} className="p-5 rounded-xl text-center"
                         style={{ background:'#161b27', border:'1px solid #2d3348' }}>
                        <div className="text-3xl font-semibold mb-1" style={{ color:s.c }}>{s.v}</div>
                        <div className="text-xs" style={{ color:'#64748b' }}>{s.l}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-6">
                {['all','available','occupied'].map(f => (
                    <button key={f} onClick={()=>setFilter(f)}
                        className="px-4 py-2 rounded-lg text-sm capitalize"
                        style={{ background: filter===f?'#6ee7b7':'#161b27',
                                 color:      filter===f?'#0f1117':'#64748b',
                                 border:'1px solid #2d3348' }}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))' }}>
                {filtered.map(slot => (
                    <div key={slot.Slot_ID} className="p-4 rounded-xl flex flex-col items-center gap-2"
                         style={{ background: slot.Status==='occupied'?'#2a1010':'#0f2a1f',
                                  border:`1px solid ${slot.Status==='occupied'?'#4a1a1a':'#1a4a35'}` }}>
                        <div className="text-lg">
                            {slot.Slot_Type==='two_wheeler'?'🛵':slot.Slot_Type==='four_wheeler'?'🚗':'🚛'}
                        </div>
                        <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:500,
                                      color: slot.Status==='occupied'?'#f87171':'#6ee7b7' }}>
                            {slot.Slot_Number}
                        </div>
                        <div className="text-xs" style={{ color:'#64748b' }}>{slot.Floor}</div>
                        <div className="text-xs px-2 py-0.5 rounded-full"
                             style={{ background: slot.Status==='occupied'?'#4a1a1a':'#1a4a35',
                                      color:      slot.Status==='occupied'?'#f87171':'#6ee7b7' }}>
                            {slot.Status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
