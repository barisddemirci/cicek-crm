import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error)
        supabase.auth.signOut()
        setLoading(false)
        return
      }
      
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
          setTenant(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*, tenants(*)')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        await supabase.auth.signOut()
        setUser(null)
        setUserProfile(null)
        setTenant(null)
        setLoading(false)
        return
      }

      setUserProfile(profile)
      setTenant(profile.tenants)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      await supabase.auth.signOut()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
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
    }
    return { error }
  }

  const value = {
    user,
    userProfile,
    tenant,
    loading,
    signIn,
    signOut,
    isAdmin: userProfile?.role === 'admin',
    isOwner: userProfile?.role === 'owner',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
