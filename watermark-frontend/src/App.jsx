import { useState, useEffect } from 'react'
import api from './api'
import Dashboard from './Dashboard'
import Verify from './Verify'
import Settings from './Settings'
import History from './History'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [view, setView] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState(null)
  
  // 建議分開處理，確保欄位清晰
  const [formData, setFormData] = useState({ username: '', email: '', password: '' })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      fetchMe()
    }
    const savedColor = localStorage.getItem('primaryColor') || '#f97316'
    document.documentElement.style.setProperty('--primary-color', savedColor)
    document.documentElement.classList.remove('dark')
  }, [])

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me')
      setCurrentUser(res.data.username)
    } catch (err) { handleLogout() }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    
    // 除錯用：按下去時在 F12 Console 會看到傳什麼
    console.log(isRegistering ? "正在註冊..." : "正在登入...", formData);

    try {
      if (isRegistering) {
        // 註冊時發送三個欄位
        await api.post('/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
        alert('註冊成功！請重新登入')
        setIsRegistering(false)
      } else {
        // 登入時發送兩個欄位
        const res = await api.post('/auth/login', { 
          username: formData.username, 
          password: formData.password 
        })
        localStorage.setItem('token', res.data.access_token)
        setIsLoggedIn(true)
        fetchMe()
      }
    } catch (err) { 
      // 這裡會顯示後端回傳的具體錯誤原因
      const errorMsg = err.response?.data?.detail || '認證失敗'
      alert(`錯誤: ${errorMsg}`) 
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false); setCurrentUser(null); setView('dashboard')
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-12">
            <h1 className="text-7xl font-black text-primary italic tracking-tighter leading-none">ORI</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-3">Origin Retrieval Integrity</p>
            <div className="h-1.5 w-16 bg-primary/20 mx-auto mt-8 rounded-full" />
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="text" 
              placeholder="Username" 
              required 
              className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition" 
              onChange={e => setFormData({...formData, username: e.target.value})} 
            />
            
            {/* 這裡確保 Email 只有在註冊時出現，且正確寫入資料 */}
            {isRegistering && (
              <input 
                type="email" 
                placeholder="Email" 
                required 
                className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition" 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            )}
            
            <input 
              type="password" 
              placeholder="Password" 
              required 
              className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition" 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            
            <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:brightness-110 transition active:scale-95 transform">
              {isRegistering ? 'REGISTER' : 'LOGIN'}
            </button>
          </form>
          
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setFormData({ username: '', email: '', password: '' }); // 切換時清空資料
            }} 
            className="w-full mt-8 text-xs font-bold text-gray-400 hover:text-primary transition uppercase tracking-widest"
          >
            {isRegistering ? 'Back to Login' : 'Create Account'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex gap-10 items-center">
          <div className="flex flex-col leading-none cursor-pointer group" onClick={() => setView('dashboard')}>
            <span className="text-4xl font-black text-primary italic tracking-tighter group-hover:opacity-80 transition">ORI</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Origin Retrieval Integrity</span>
          </div>
          <div className="hidden md:flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            {['dashboard', 'verify', 'history', 'settings'].map((item) => (
              <button 
                key={item} 
                onClick={() => setView(item)} 
                className={`px-8 py-2 rounded-xl text-xs font-black transition duration-300 ${view === item ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Operator</p>
            <p className="text-sm font-black text-gray-800">@{currentUser || '...'}</p>
          </div>
          <div className="h-8 w-px bg-gray-200 mx-2" />
          <button onClick={handleLogout} className="text-xs font-black text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition border border-red-50">LOGOUT</button>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-10">
        {view === 'dashboard' && <Dashboard />}
        {view === 'verify' && <Verify />}
        {view === 'history' && <History />}
        {view === 'settings' && <Settings />}
      </main>
    </div>
  )
}

export default App