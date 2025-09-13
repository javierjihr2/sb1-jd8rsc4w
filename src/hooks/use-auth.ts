import { useEffect, useState } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useUserStore } from '@/store'

export function useAuth() {
  const [loading, setLoading] = useState(true)
  const { user, setUser } = useUserStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return unsubscribe
  }, [setUser])

  return {
    user,
    loading,
    isAuthenticated: !!user
  }
}

export default useAuth