import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { 
  Users, 
  Calendar, 
  Send, 
  Clock, 
  ChevronRight,
  Flower2
} from 'lucide-react'
import { format, addDays, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function Dashboard() {
  const { tenant } = useAuth()
  const [stats, setStats] = useState({
    totalCustomers: 0,
    sentThisMonth: 0,
    pending: 0,
    upcoming: 0
  })
  const [upcomingReminders, setUpcomingReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tenant) {
      fetchDashboardData()
    }
  }, [tenant])

  const fetchDashboardData = async () => {
    try {
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      const { count: sentCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'sent')
        .gte('created_at', monthStart.toISOString())

      const { count: pendingCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')

      const { data: upcomingEvents } = await supabase
        .from('events')
        .select(`
          *,
          customers (first_name, last_name, email, phone),
          photos (id, photo_url)
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .order('event_date', { ascending: true })
        .limit(10)

      const remindersToShow = upcomingEvents?.filter(event => {
        const eventDate = new Date(event.event_date)
        const reminderDate = addDays(eventDate, event.reminder_days || 365)
        const daysUntil = differenceInDays(reminderDate, today)
        return daysUntil >= -7 && daysUntil <= 30
      }).slice(0, 5) || []

      setStats({
        totalCustomers: customerCount || 0,
        sentThisMonth: sentCount || 0,
        pending: pendingCount || 0,
        upcoming: remindersToShow.length
      })
      setUpcomingReminders(remindersToShow)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReminderInfo = (event) => {
    const eventDate = new Date(event.event_date)
    const reminderDate = addDays(eventDate, event.reminder_days || 365)
    const today = new Date()
    const daysUntil = differenceInDays(reminderDate, today)
    
    if (daysUntil < 0) return { text: `${Math.abs(daysUntil)} gün geçti`, urgent: true }
    if (daysUntil === 0) return { text: 'Bugün', urgent: true }
    if (daysUntil === 1) return { text: 'Yarın', urgent: true }
    if (daysUntil <= 7) return { text: `${daysUntil} gün`, urgent: true }
    return { text: format(reminderDate, 'd MMMM', { locale: tr }), urgent: false }
  }

  const statCards = [
    { label: 'Toplam Müşteri', value: stats.totalCustomers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Bu Ay Gönderilen', value: stats.sentThisMonth, icon: Send, color: 'bg-green-50 text-green-600' },
    { label: 'Bekleyen', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Yaklaşan (30 gün)', value: stats.upcoming, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Flower2 className="w-8 h-8 text-primary-500 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          Merhaba, {tenant?.business_name || 'Hoş geldiniz'} 👋
        </h1>
        <p className="text-stone-500 mt-1">
          İşte bugünkü özet
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {statCards.map((stat) => (
          <div 
            key={stat.label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-stone-500">{stat.label}</p>
            <p className="text-2xl font-semibold text-stone-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Reminders */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800">Yaklaşan Hatırlatmalar</h2>
          <Link 
            to="/reminders" 
            className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            Tümünü gör
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingReminders.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">Yaklaşan hatırlatma yok</p>
            <Link to="/customers" className="text-primary-500 text-sm hover:underline mt-2 inline-block">
              Yeni müşteri ekle
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 stagger-children">
            {upcomingReminders.map((event) => {
              const reminderInfo = getReminderInfo(event)
              return (
                <div key={event.id} className="p-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
                        {event.customers?.first_name?.[0]}{event.customers?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-stone-800">
                          {event.customers?.first_name} {event.customers?.last_name}
                        </p>
                        <p className="text-sm text-stone-500">{event.event_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        reminderInfo.urgent 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {reminderInfo.text}
                      </span>
                      <p className="text-xs text-stone-400 mt-1">
                        {event.photos?.length || 0} fotoğraf
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
