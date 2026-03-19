import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Flower2,
  ChevronRight,
  Shield
} from 'lucide-react'

export default function Layout() {
  const { tenant, userProfile, signOut, isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Panel' },
    { path: '/customers', icon: Users, label: 'Müşteriler' },
    { path: '/reminders', icon: Calendar, label: 'Hatırlatmalar' },
    { path: '/settings', icon: Settings, label: 'Ayarlar' },
  ]

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin' })
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 
        w-64 bg-white border-r border-stone-200 
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
                <Flower2 className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="font-semibold text-stone-800">Çiçek CRM</h1>
                <p className="text-xs text-stone-500 truncate max-w-[140px]">
                  {tenant?.business_name || 'Yükleniyor...'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-primary-50 text-primary-600 font-medium' 
                    : 'text-stone-600 hover:bg-stone-50'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-stone-100">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 font-medium text-sm">
                {userProfile?.full_name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">
                  {userProfile?.full_name || 'Kullanıcı'}
                </p>
                <p className="text-xs text-stone-500 capitalize">
                  {userProfile?.role === 'admin' ? 'Yönetici' : 
                   userProfile?.role === 'owner' ? 'İşletme Sahibi' : 'Personel'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-stone-600 hover:bg-stone-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-stone-100 rounded-lg"
          >
            <Menu className="w-6 h-6 text-stone-600" />
          </button>
          <div className="flex items-center gap-2">
            <Flower2 className="w-6 h-6 text-primary-500" />
            <span className="font-semibold text-stone-800">Çiçek CRM</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
