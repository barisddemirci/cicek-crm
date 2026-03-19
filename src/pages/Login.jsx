import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Flower2, Mail, Lock, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      navigate('/')
    } catch (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'E-posta veya şifre hatalı' 
        : error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <Flower2 className="w-20 h-20 mb-6" strokeWidth={1.5} />
          <h1 className="font-display text-4xl font-bold mb-4 text-center">
            Çiçek CRM
          </h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Müşterilerinize değer verdiğinizi gösterin. Her özel anı hatırlayın.
          </p>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-stone-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Flower2 className="w-10 h-10 text-primary-500" strokeWidth={1.5} />
            <h1 className="font-display text-2xl font-bold text-stone-800">
              Çiçek CRM
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 p-8">
            <h2 className="text-2xl font-semibold text-stone-800 mb-2">
              Hoş Geldiniz
            </h2>
            <p className="text-stone-500 mb-8">
              Hesabınıza giriş yapın
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-stone-500 mt-6">
            Hesabınız yok mu? Yöneticinizle iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  )
}
