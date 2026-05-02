import { Routes, Route, Navigate } from 'react-router-dom'
import Login     from './pages/Login'
import Register  from './pages/Register'
import UserPanel from './pages/UserPanel'
import SlotMap   from './pages/SlotMap'
import AdminDash from './pages/AdminDash'
import Navbar    from './components/Navbar'

function Guard({ children }) {
    return localStorage.getItem('token') ? children : <Navigate to="/" />
}

export default function App() {
    const role = localStorage.getItem('role')
    return (
        <Routes>
            <Route path="/"         element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/park"     element={<Guard><Navbar /><UserPanel /></Guard>} />
            <Route path="/slots"    element={<Guard><Navbar /><SlotMap /></Guard>} />
            <Route path="/admin"    element={<Guard><Navbar /><AdminDash /></Guard>} />
        </Routes>
    )
}
