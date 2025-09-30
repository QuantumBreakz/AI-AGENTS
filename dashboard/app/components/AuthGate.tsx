"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [router])
  if (!ready) return null
  return <>{children}</>
}

