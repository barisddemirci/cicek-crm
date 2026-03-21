import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let isMounted = true
    
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          await supabase.auth.signOut()
          if (isMounted) {
            setLoading(false)
          }
          return
        }
        
        if (session?.user) {
          if (isMounted) {
            setUser(session.user)
          }
          await fetchUserProfile(session.user.id, isMounted)
        } else {
          if (isMounted) {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (isMounted) {
          setAuthError(error.message)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (!isMounted) return
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          setTenant(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id, isMounted)
        } else {
          setUser(null)
          setUserProfile(null)
          setTenant(null)
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId, isMounted = true) => {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      })

      const fetchPromise = supabase
        .from('users')
        .select('*, tenants(*)')
        .eq('id', userId)
        .single()

      const { data: profile, error: profileError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ])

      if (!isMounted) return

      if (profileError) {
        console.error('Profile error:', profileError)
        
        if (profileError.code === 'PGRST116') {
          console.log('User profile not found, signing out...')
          await supabase.auth.signOut()
          setUser(null)
          setUserProfile(null)
          setTenant(null)
        }
        setLoading(false)
        return
      }

      if (profile.tenants && !profile.tenants.license_active && profile.role !== 'admin') {
        setAuthError('Hesabınız pasif durumda. Lütfen yöneticinizle iletişime geçin.')
        await supabase.auth.signOut()
        setUser(null)
        setUserProfile(null)
        setTenant(null)
        setLoading(false)
        return
      }

      setUserProfile(profile)
      setTenant(profile.tenants)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      
      if (!isMounted) return
      
      if (error.message === 'Profile fetch timeout') {
        setAuthError('Bağlantı zaman aşımına uğradı. Sayfayı yenileyin.')
      } else {
        setAuthError('Bir hata oluştu. Lütfen tekrar deneyin.')
      }
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    setAuthError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setUserProfile(null)
      setTenant(null)
      setAuthError(null)
    }
    return { error }
  }

  const retryAuth = async () => {
    setLoading(true)
    setAuthError(null)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await fetchUserProfile(session.user.id)
    } else {
      setLoading(false)
    }
  }

  const value = {
    user,
    userProfile,
    tenant,
    loading,
    authError,
    signIn,
    signOut,
    retryAuth,
    isAdmin: userProfile?.role === 'admin',
    isOwner: userProfile?.role === 'owner',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
