import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { 
  Plus, 
  Search, 
  User, 
  Mail, 
  Phone, 
  X,
  Calendar,
  Upload,
  Trash2,
  Edit,
  Flower2,
  Image
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function Customers() {
  const { tenant } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    event_type: '',
    event_date: '',
    notes: ''
  })
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const eventTypes = [
    'Doğum günü',
    'Evlilik yıldönümü',
    'Sevgililer günü',
    'Anneler günü',
    'Babalar günü',
    'Mezuniyet',
    'Diğer'
  ]

  useEffect(() => {
    if (tenant) {
      fetchCustomers()
    }
  }, [tenant])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          events (
            id,
            event_type,
            event_date,
            status,
            photos (id, photo_url)
          )
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    const uploadedPhotos = []

    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenant.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

      const { error } = await supabase.storage
        .from('photos')
        .upload(fileName, file)

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName)
        
        uploadedPhotos.push(publicUrl)
      }
    }

    setPhotos([...photos, ...uploadedPhotos])
    setUploading(false)
  }

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Create or update customer
      let customerId = editingCustomer?.id

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            notes: formData.notes
          })
          .eq('id', editingCustomer.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            tenant_id: tenant.id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            notes: formData.notes
          })
          .select()
          .single()

        if (error) throw error
        customerId = data.id
      }

      // Create event if event data exists
      if (formData.event_type && formData.event_date) {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .insert({
            tenant_id: tenant.id,
            customer_id: customerId,
            event_type: formData.event_type,
            event_date: formData.event_date,
            reminder_days: 365
          })
          .select()
          .single()

        if (eventError) throw eventError

        // Add photos to event
        if (photos.length > 0) {
          const photoInserts = photos.map(url => ({
            event_id: eventData.id,
            photo_url: url
          }))

          await supabase.from('photos').insert(photoInserts)
        }
      }

      // Reset and refresh
      setShowModal(false)
      setEditingCustomer(null)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        event_type: '',
        event_date: '',
        notes: ''
      })
      setPhotos([])
      fetchCustomers()
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Bir hata oluştu: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      event_type: '',
      event_date: '',
      notes: customer.notes || ''
    })
    setPhotos([])
    setShowModal(true)
  }

  const deleteCustomer = async (id) => {
    if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  const filteredCustomers = customers.filter(c => {
    const searchLower = searchQuery.toLowerCase()
    return (
      c.first_name?.toLowerCase().includes(searchLower) ||
      c.last_name?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.includes(searchQuery)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Flower2 className="w-8 h-8 text-primary-500 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Müşteriler</h1>
          <p className="text-stone-500 mt-1">{customers.length} müşteri</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null)
            setFormData({
              first_name: '',
              last_name: '',
              email: '',
              phone: '',
              event_type: '',
              event_date: '',
              notes: ''
            })
            setPhotos([])
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Yeni Müşteri
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Müşteri ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl"
        />
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
          <User className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-800 mb-2">
            {searchQuery ? 'Müşteri bulunamadı' : 'Henüz müşteri yok'}
          </h3>
          <p className="text-stone-500 mb-6">
            {searchQuery ? 'Farklı bir arama deneyin' : 'İlk müşterinizi ekleyin'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Yeni Müşteri Ekle
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 stagger-children">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id}
              className="bg-white rounded-xl p-4 border border-stone-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-medium">
                    {customer.first_name?.[0]}{customer.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-800">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-stone-500 mt-1">
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {customer.events?.length > 0 && (
                    <div className="flex items-center gap-2 mr-4">
                      <span className="text-xs bg-sage-100 text-sage-700 px-2 py-1 rounded-full">
                        {customer.events.length} etkinlik
                      </span>
                      {customer.events.reduce((acc, e) => acc + (e.photos?.length || 0), 0) > 0 && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1">
                          <Image className="w-3 h-3" />
                          {customer.events.reduce((acc, e) => acc + (e.photos?.length || 0), 0)}
                        </span>
                      )}
                    </div>
                  )}
                  <button 
                    onClick={() => openEditModal(customer)}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-stone-500" />
                  </button>
                  <button 
                    onClick={() => deleteCustomer(customer.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-stone-800">
                {editingCustomer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Ad *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl"
                    placeholder="Ad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Soyad</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl"
                    placeholder="Soyad"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">E-posta *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl"
                  placeholder="ornek@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl"
                  placeholder="0532 XXX XX XX"
                />
              </div>

              <hr className="border-stone-200" />

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Etkinlik Türü</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl"
                >
                  <option value="">Seçin (opsiyonel)</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Etkinlik Tarihi</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Fotoğraflar</label>
                <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className={`w-8 h-8 mb-2 ${uploading ? 'text-stone-300 animate-pulse' : 'text-stone-400'}`} />
                    <span className="text-sm text-stone-500">
                      {uploading ? 'Yükleniyor...' : 'Fotoğraf yüklemek için tıklayın'}
                    </span>
                  </label>
                </div>

                {/* Photo Preview */}
                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {photos.map((url, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <img 
                          src={url} 
                          alt="" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl resize-none"
                  rows={3}
                  placeholder="Ek notlar..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn btn-primary"
                >
                  {saving ? 'Kaydediliyor...' : (editingCustomer ? 'Güncelle' : 'Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
