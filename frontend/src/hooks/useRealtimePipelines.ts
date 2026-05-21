import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimePipelines() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const ws = useRef<WebSocket | null>(null)
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const connect = useCallback(() => {
    if (!token) return
    const apiBase = import.meta.env.VITE_API_URL ?? ''
    const wsBase = apiBase
      ? apiBase.replace(/^https/, 'wss').replace(/^http/, 'ws')
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
    const url = `${wsBase}/ws/live?token=${token}`
    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      pingInterval.current = setInterval(() => {
        ws.current?.readyState === WebSocket.OPEN && ws.current.send('ping')
      }, 30000)
    }

    ws.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'pipeline_update') {
          queryClient.invalidateQueries({ queryKey: ['pipelines'] })
          queryClient.invalidateQueries({ queryKey: ['stats'] })
        }
      } catch {}
    }

    ws.current.onclose = () => {
      if (pingInterval.current) clearInterval(pingInterval.current)
      setTimeout(connect, 3000)
    }
  }, [token, queryClient])

  useEffect(() => {
    connect()
    return () => {
      ws.current?.close()
      if (pingInterval.current) clearInterval(pingInterval.current)
    }
  }, [connect])
}
