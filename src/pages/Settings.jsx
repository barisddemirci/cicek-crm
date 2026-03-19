import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { 
  Building2, 
  Mail, 
  Phone, 
  Save,
  Flower2,
  MessageSquare,
  CheckCircle
} from 'lucide-react'

export default function Settings() {
  const { tenant, userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    message_template: ''
  })

  useEffect(() => {
    if (tenant) {
      setFormData({
        business_name: tenant.business_name || '',
        owner_name: tenant.owner_name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        message_template: tenant.message_template || `Sevgili {müşteri_adı},

Tam 1 yıl önce bugün sizin için hazırladığımız özel çiçeklerimizi hatırladık. 🌸

O güzel anıyı sizinle paylaşmak istedik.

Sevgiyle,
{işletme_adı}`
      })
    }
  }, [tenant])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          business_name: formData.business_name,
          owner_name: formData.owner_name,
          email: formData.email,
          phone: formData.phone,
          message_template: formData.message_template
        })
        .eq('id', tenant.id)

      if (error) throw error
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Bir hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const templateVariables = [
    { key: '{müşteri_adı}', desc: 'Müşterinin adı' },
    { key: '{etkinlik_türü}', desc: 'Etkinlik türü (Doğum günü, vb.)' },
    { key: '{işletme_adı}', desc: 'İşletme adınız' }
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Ayarlar</h1>
        <p className="text-stone-500 mt-1">İşletme bilgilerini ve mesaj şablonunu düzenleyin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Info */}
        <div className="bg-white rounded-2xl p-6 border border-stone-100">
          <h2 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-500" />
            İşletme Bilgileri
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                İşletme Adı
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl"
                placeholder="Örn: Gül Çiçekçilik"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Yetkili Adı
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl"
                placeholder="Adınız Soyadınız"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-11 pr-4 py-2.5 border border-stone-200 rounded-xl"
                    placeholder="email@ornek.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-11 pr-4 py-2.5 border border-stone-200 rounded-xl"
                    placeholder="0532 XXX XX XX"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Template */}
        <div className="bg-white rounded-2xl p-6 border border-stone-100">
          <h2 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            Mesaj Şablonu
          </h2>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Hatırlatma Mesajı
            </label>
            <textarea
              value={formData.message_template}
              onChange={(e) => setFormData({...formData, message_template: e.target.value})}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none"
              rows={8}
              placeholder="Müşteriye gönderilecek mesaj..."
            />
          </div>

          <div className="mt-4 p-4 bg-stone-50 rounded-xl">
            <p className="text-sm font-medium text-stone-700 mb-2">Kullanılabilir Değişkenler:</p>
            <div className="space-y-1">
              {templateVariables.map(v => (
                <div key={v.key} className="flex items-center gap-2 text-sm">
                  <code className="bg-white px-2 py-0.5 rounded border border-stone-200 text-primary-600">
                    {v.key}
                  </code>
                  <span className="text-stone-500">→</span>
                  <span className="text-stone-600">{v.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <Flower2 className="w-5 h-5 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Kaydet
              </>
            )}
          </button>

          {saved && (
            <span className="flex items-center gap-2 text-green-600 animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              Kaydedildi!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
