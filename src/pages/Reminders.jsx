import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { sendReminderEmail } from '../services/emailService'
import { 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle, 
  Image,
  Flower2,
  Mail,
  AlertCircle
} from 'lucide-react'
import { format, addDays, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function Reminders() {
  const { tenant } = useAuth()
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(null)

  useEffect(() => {
    if (tenant) {
      fetchEvents()
    }
  }, [tenant])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          customers (first_name, last_name, email, phone),
          photos (id, photo_url)
        `)
        .eq('tenant_id', tenant.id)
        .order('event_date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReminderInfo = (event) => {
    const eventDate = new Date(event.event_date)
    const reminderDate = addDays(eventDate, event.reminder_days || 365)
    const today = new Date()
    const daysUntil = differenceInDays(reminderDate, today)
    
    return { 
      date: reminderDate,
      daysUntil,
      text: daysUntil < 0 
        ? `${Math.abs(daysUntil)} gün geçti` 
        : daysUntil === 0 
          ? 'Bugün' 
          : daysUntil === 1 
            ? 'Yarın' 
            : `${daysUntil} gün`,
      urgent: daysUntil <= 7 && daysUntil >= 0,
      overdue: daysUntil < 0
    }
  }

  const filteredEvents = events.filter(event => {
    const info = getReminderInfo(event)
    
    switch (filter) {
      case 'week':
        return event.status === 'active' && info.daysUntil >= 0 && info.daysUntil <= 7
      case 'month':
        return event.status === 'active' && info.daysUntil >= 0 && info.daysUntil <= 30
      case 'sent':
        return event.status === 'sent'
      case 'overdue':
        return event.status === 'active' && info.daysUntil < 0
      default:
        return event.status === 'active'
    }
  }).sort((a, b) => {
    const infoA = getReminderInfo(a)
    const infoB = getReminderInfo(b)
    return infoA.daysUntil - infoB.daysUntil
  })

  const handleSendReminder = async (event) => {
    if (!event.customers?.email) {
      alert('Bu müşterinin e-posta adresi yok!')
      return
    }

    if (!confirm(`${event.customers.first_name} ${event.customers.last_name} adresine hatırlatma e-postası göndermek istiyor musunuz?`)) {
      return
    }

    setSending(event.id)

    try {
      // Gerçek email gönder
      await sendReminderEmail(event, tenant)
      
      // Event'i sent olarak işaretle
      const { error } = await supabase
        .from('events')
        .update({ status: 'sent' })
        .eq('id', event.id)

      if (error) throw error

      // Log the message
      await supabase.from('message_history').insert({
        event_id: event.id,
        channel: 'email',
        status: 'sent'
      })

      alert('✅ Hatırlatma e-postası başarıyla gönderildi!')
      fetchEvents()
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert('❌ Email gönderilemedi: ' + error.message)
    } finally {
      setSending(null)
    }
  }

  const filters = [
    { key: 'all', label: 'Tümü' },
    { key: 'week', label: 'Bu Hafta' },
    { key: 'month', label: 'Bu Ay' },
    { key: 'overdue', label: 'Gecikmiş' },
    { key: 'sent', label: 'Gönderilmiş' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Flower2 className="w-8 h-8 text-primary-500 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Hatırlatmalar</h1>
        <p className="text-stone-500 mt-1">Yaklaşan ve gönderilmiş hatırlatmalar</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
          <Calendar className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-800 mb-2">
            Bu kategoride hatırlatma yok
          </h3>
          <p className="text-stone-500">
            Farklı bir filtre deneyin
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {filteredEvents.map((event) => {
            const info = getReminderInfo(event)
            const isSent = event.status === 'sent'
            
            return (
              <div 
                key={event.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  info.overdue && !isSent
                    ? 'border-red-200 bg-red-50/50'
                    : info.urgent && !isSent
                      ? 'border-amber-200 bg-amber-50/50'
                      : isSent
                        ? 'border-green-200 bg-green-50/30'
                        : 'border-stone-100'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-800">
                        {event.customers?.first_name} {event.customers?.last_name}
                      </h3>
                      {isSent && (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Gönderildi
                        </span>
                      )}
                    </div>
                    <p className="text-stone-500 text-sm mt-1">{event.event_type}</p>
                    <p className="text-stone-400 text-xs mt-1">
                      Orijinal tarih: {format(new Date(event.event_date), 'd MMMM yyyy', { locale: tr })}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                      isSent
                        ? 'bg-green-100 text-green-700'
                        : info.overdue
                          ? 'bg-red-100 text-red-700'
                          : info.urgent
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-stone-100 text-stone-600'
                    }`}>
                      {info.overdue && !isSent && <AlertCircle className="w-4 h-4" />}
                      {info.urgent && !info.overdue && !isSent && <Clock className="w-4 h-4" />}
                      {isSent ? 'Gönderildi' : info.text}
                    </span>
                    {!isSent && (
                      <p className="text-xs text-stone-400 mt-1">
                        {format(info.date, 'd MMM yyyy', { locale: tr })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Photos Preview */}
                {event.photos && event.photos.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {event.photos.slice(0, 4).map((photo, idx) => (
                      <div 
                        key={photo.id}
                        className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100"
                      >
                        <img 
                          src={photo.photo_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {event.photos.length > 4 && (
                      <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center">
                        <span className="text-sm text-stone-500">+{event.photos.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Contact */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-4 text-sm text-stone-500">
                    {event.customers?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {event.customers.email}
                      </span>
                    )}
                  </div>

                  {!isSent && (
                    <button
                      onClick={() => handleSendReminder(event)}
                      disabled={sending === event.id}
                      className={`btn ${
                        info.overdue || info.urgent
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`}
                    >
                      {sending === event.id ? (
                        <>
                          <Flower2 className="w-4 h-4 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Şimdi Gönder
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
