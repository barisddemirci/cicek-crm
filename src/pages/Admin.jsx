import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { 
  Plus, 
  Building2, 
  Users, 
  ToggleLeft, 
  ToggleRight,
  Trash2,
  Flower2,
  Key,
  Copy,
  Check,
  X,
  Mail
} from 'lucide-react'

export default function Admin() {
  const { isAdmin } = useAuth()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(null)
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    user_email: '',
    user_password: '',
    user_name: ''
  })

  useEffect(() => {
    if (isAdmin) {
      fetchTenants()
    }
  }, [isAdmin])

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          users (id, full_name, role),
          customers (id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTenants(data || [])
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // 1. Create tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          business_name: formData.business_name,
          owner_name: formData.owner_name,
          email: formData.email,
          phone: formData.phone
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      // 2. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.user_email,
        password: formData.user_password,
        email_confirm: true
      })

      if (authError) {
        // If auth fails, we need to handle this - for now just show the SQL approach
        alert(`Kullanıcı oluşturulamadı. Manuel olarak Supabase Auth'dan oluşturun.\n\nTenant ID: ${tenantData.id}\nE-posta: ${formData.user_email}`)
      } else {
        // 3. Create user profile linked to tenant
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            tenant_id: tenantData.id,
            full_name: formData.user_name,
            role: 'owner'
          })

        if (userError) throw userError
      }

      setShowModal(false)
      setFormData({
        business_name: '',
        owner_name: '',
        email: '',
        phone: '',
        user_email: '',
        user_password: '',
        user_name: ''
      })
      fetchTenants()
      
      alert('Çiçekçi başarıyla oluşturuldu!')
    } catch (error) {
      console.error('Error creating tenant:', error)
      alert('Bir hata oluştu: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleTenantStatus = async (tenant) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ license_active: !tenant.license_active })
        .eq('id', tenant.id)

      if (error) throw error
      fetchTenants()
    } catch (error) {
      console.error('Error toggling tenant:', error)
    }
  }

  const deleteTenant = async (id) => {
    if (!confirm('Bu çiçekçiyi ve tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchTenants()
    } catch (error) {
      console.error('Error deleting tenant:', error)
      alert('Silme hatası: ' + error.message)
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, user_password: password })
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-stone-500">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    )
  }

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
          <h1 className="text-2xl font-semibold text-stone-800">Admin Paneli</h1>
          <p className="text-stone-500 mt-1">Çiçekçileri yönetin</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Yeni Çiçekçi Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-sm text-stone-500">Toplam Çiçekçi</p>
          <p className="text-2xl font-semibold text-stone-800 mt-1">{tenants.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
            <ToggleRight className="w-5 h-5" />
          </div>
          <p className="text-sm text-stone-500">Aktif</p>
          <p className="text-2xl font-semibold text-stone-800 mt-1">
            {tenants.filter(t => t.license_active).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <ToggleLeft className="w-5 h-5" />
          </div>
          <p className="text-sm text-stone-500">Pasif</p>
          <p className="text-2xl font-semibold text-stone-800 mt-1">
            {tenants.filter(t => !t.license_active).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-sm text-stone-500">Toplam Müşteri</p>
          <p className="text-2xl font-semibold text-stone-800 mt-1">
            {tenants.reduce((acc, t) => acc + (t.customers?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Tenants List */}
      {tenants.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
          <Building2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-800 mb-2">Henüz çiçekçi yok</h3>
          <p className="text-stone-500 mb-6">İlk çiçekçinizi ekleyin</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Yeni Çiçekçi Ekle
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-stone-600">İşletme</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-stone-600">İletişim</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-stone-600">Müşteri</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-stone-600">Durum</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-stone-800">{tenant.business_name}</p>
                        <p className="text-sm text-stone-500">{tenant.owner_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-stone-600">{tenant.email}</p>
                        <p className="text-stone-500">{tenant.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600">
                        {tenant.customers?.length || 0} müşteri
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleTenantStatus(tenant)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          tenant.license_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {tenant.license_active ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Pasif
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => copyToClipboard(tenant.id, tenant.id)}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="ID Kopyala"
                      >
                        {copied === tenant.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-stone-400" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteTenant(tenant.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-stone-800">Yeni Çiçekçi Ekle</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-6 space-y-5">
              <div className="p-4 bg-sage-50 rounded-xl">
                <h3 className="font-medium text-sage-800 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  İşletme Bilgileri
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl bg-white"
                    placeholder="İşletme Adı *"
                  />
                  <input
                    type="text"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl bg-white"
                    placeholder="Yetkili Adı"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl bg-white"
                      placeholder="E-posta"
                    />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl bg-white"
                      placeholder="Telefon"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Giriş Bilgileri
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    value={formData.user_name}
                    onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl bg-white"
                    placeholder="Kullanıcı Adı Soyadı *"
                  />
                  <input
                    type="email"
                    required
                    value={formData.user_email}
                    onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl bg-white"
                    placeholder="Giriş E-postası *"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.user_password}
                      onChange={(e) => setFormData({...formData, user_password: e.target.value})}
                      className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl bg-white font-mono"
                      placeholder="Şifre *"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="btn btn-secondary text-sm"
                    >
                      Oluştur
                    </button>
                  </div>
                  <p className="text-xs text-blue-600">
                    Bu bilgileri çiçekçiye verin. Giriş yapabilmeleri için gerekli.
                  </p>
                </div>
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
                  {saving ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
