'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  BellIcon,
  ArrowPathIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { formatDateTime } from '../../utils/date'

const API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface InboundEvent {
  id: number
  type: string
  source: string
  data: any
  timestamp: string
  status: string
}

interface InboundCall {
  id: number
  phone: string
  caller_name: string
  duration: number
  status: string
  transcript: string
  created_at: string
}

export default function InboundPage() {
  const [events, setEvents] = useState<InboundEvent[]>([])
  const [calls, setCalls] = useState<InboundCall[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchInboundData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchInboundData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchInboundData = async () => {
    try {
      setLoading(true)
      
      // Fetch inbound events
      const eventsRes = await fetch(`${API}/inbound/webhook`, {
        method: 'GET'
      })
      
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData)
      } else {
        // Mock data for demo
        const mockEvents: InboundEvent[] = [
          {
            id: 1,
            type: 'call_received',
            source: 'twilio',
            data: { phone: '+1234567890', caller_name: 'John Doe' },
            timestamp: new Date().toISOString(),
            status: 'processed'
          },
          {
            id: 2,
            type: 'email_received',
            source: 'gmail',
            data: { from: 'prospect@company.com', subject: 'Interested in your services' },
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'processed'
          },
          {
            id: 3,
            type: 'voicemail',
            source: 'twilio',
            data: { phone: '+1987654321', duration: 45 },
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            status: 'pending'
          }
        ]
        setEvents(mockEvents)
      }

      // Fetch inbound calls
      const callsRes = await fetch(`${API}/calls`)
      
      if (callsRes.ok) {
        const callsData = await callsRes.json()
        const inboundCalls = callsData.filter((call: any) => call.direction === 'inbound' || call.type === 'inbound')
        setCalls(inboundCalls)
      } else {
        // Mock data for demo
        const mockCalls: InboundCall[] = [
          {
            id: 1,
            phone: '+1234567890',
            caller_name: 'John Doe',
            duration: 180,
            status: 'completed',
            transcript: 'Hello, I\'m interested in learning more about your services...',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            phone: '+1987654321',
            caller_name: 'Jane Smith',
            duration: 0,
            status: 'missed',
            transcript: '',
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ]
        setCalls(mockCalls)
      }
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching inbound data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'call_received':
      case 'voicemail':
        return PhoneIcon
      case 'email_received':
        return EnvelopeIcon
      default:
        return BellIcon
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'call_received':
        return 'text-green-600 bg-green-100'
      case 'email_received':
        return 'text-blue-600 bg-blue-100'
      case 'voicemail':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'missed':
        return 'text-red-600 bg-red-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inbound Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage incoming calls and communications
              {lastUpdated && (
                <span className="ml-2 text-xs text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-refresh
              </label>
            </div>
            <button
              onClick={fetchInboundData}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BellIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : events.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <PhoneIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Inbound Calls</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : calls.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : calls.filter(call => call.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Missed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : calls.filter(call => call.status === 'missed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h2>
          <div className="card">
            <div className="card-body">
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => {
                    const IconComponent = getEventIcon(event.type)
                    return (
                      <div key={event.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getEventColor(event.type)}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 capitalize">
                              {event.type.replace('_', ' ')}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.status === 'processed' ? 'bg-green-100 text-green-800' :
                              event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Source: {event.source} • {formatDateTime(event.timestamp)}
                          </p>
                          {event.data && (
                            <div className="mt-1 text-xs text-gray-600">
                              {event.type === 'call_received' && (
                                <span>Phone: {event.data.phone} • Caller: {event.data.caller_name}</span>
                              )}
                              {event.type === 'email_received' && (
                                <span>From: {event.data.from} • Subject: {event.data.subject}</span>
                              )}
                              {event.type === 'voicemail' && (
                                <span>Phone: {event.data.phone} • Duration: {event.data.duration}s</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No events yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Inbound events will appear here when they occur.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inbound Calls */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Inbound Calls</h2>
          <div className="card">
            <div className="card-body">
              {calls.length > 0 ? (
                <div className="space-y-4">
                  {calls.map((call) => (
                    <div key={call.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <PhoneIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {call.caller_name || 'Unknown Caller'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {call.phone} • Duration: {call.duration}s • {formatDateTime(call.created_at)}
                        </p>
                        {call.transcript && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Transcript:</strong> {call.transcript}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No inbound calls</h3>
                  <p className="mt-1 text-sm text-gray-500">Inbound calls will appear here when they occur.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}