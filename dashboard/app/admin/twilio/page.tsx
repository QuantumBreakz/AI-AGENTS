'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  CogIcon,
  ArrowPathIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BellIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { formatDateTime } from '../../utils/date'

const API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface TwilioEvent {
  id: number
  event_type: string
  call_sid: string
  status: string
  data: any
  timestamp: string
}

interface TwilioCall {
  id: number
  call_sid: string
  phone: string
  status: string
  duration: number
  direction: string
  created_at: string
}

export default function TwilioPage() {
  const [events, setEvents] = useState<TwilioEvent[]>([])
  const [calls, setCalls] = useState<TwilioCall[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [twilioStatus, setTwilioStatus] = useState({
    account_sid: false,
    auth_token: false,
    from_number: false,
    base_url: false
  })

  useEffect(() => {
    fetchTwilioData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchTwilioData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchTwilioData = async () => {
    try {
      setLoading(true)
      
      // Fetch Twilio events
      const eventsRes = await fetch(`${API}/twilio/voice/status`, {
        method: 'GET'
      })
      
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData)
      } else {
        // If no events endpoint, create empty array
        setEvents([])
      }

      // Fetch Twilio calls
      const callsRes = await fetch(`${API}/calls`)
      
      if (callsRes.ok) {
        const callsData = await callsRes.json()
        const twilioCalls = callsData.filter((call: any) => call.provider === 'twilio' || call.call_sid)
        setCalls(twilioCalls)
      } else {
        // If no calls endpoint, create empty array
        setCalls([])
      }
      
      // Check Twilio configuration status
      setTwilioStatus({
        account_sid: false,
        auth_token: false,
        from_number: false,
        base_url: false
      })
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching Twilio data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'call_initiated':
      case 'call_answered':
      case 'call_completed':
        return PhoneIcon
      case 'call_failed':
        return ExclamationTriangleIcon
      default:
        return BellIcon
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'call_initiated':
        return 'text-blue-600 bg-blue-100'
      case 'call_answered':
        return 'text-green-600 bg-green-100'
      case 'call_completed':
        return 'text-purple-600 bg-purple-100'
      case 'call_failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'no-answer':
        return 'text-yellow-600 bg-yellow-100'
      case 'busy':
        return 'text-red-600 bg-red-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Twilio Integration</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor Twilio voice calls and webhook events
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
              onClick={fetchTwilioData}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Twilio Configuration Status */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration Status</h2>
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${twilioStatus.account_sid ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Account SID</div>
                    <div className="text-xs text-gray-500">
                      {twilioStatus.account_sid ? 'Configured' : 'Missing'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${twilioStatus.auth_token ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Auth Token</div>
                    <div className="text-xs text-gray-500">
                      {twilioStatus.auth_token ? 'Configured' : 'Missing'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${twilioStatus.from_number ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">From Number</div>
                    <div className="text-xs text-gray-500">
                      {twilioStatus.from_number ? 'Configured' : 'Missing'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${twilioStatus.base_url ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Base URL</div>
                    <div className="text-xs text-gray-500">
                      {twilioStatus.base_url ? 'Configured' : 'Missing'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  <p className="text-sm font-medium text-gray-500">Total Calls</p>
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
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : Math.round(calls.reduce((acc, call) => acc + call.duration, 0) / calls.length) || 0}s
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Twilio Events */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h2>
          <div className="card">
            <div className="card-body">
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => {
                    const IconComponent = getEventIcon(event.event_type)
                    return (
                      <div key={event.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getEventColor(event.event_type)}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 capitalize">
                              {event.event_type.replace('_', ' ')}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.status === 'success' ? 'bg-green-100 text-green-800' :
                              event.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Call SID: {event.call_sid} • {formatDateTime(event.timestamp)}
                          </p>
                          {event.data && (
                            <div className="mt-1 text-xs text-gray-600">
                              {event.data.phone && <span>Phone: {event.data.phone} • </span>}
                              {event.data.duration && <span>Duration: {event.data.duration}s • </span>}
                              {event.data.direction && <span>Direction: {event.data.direction}</span>}
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
                  <p className="mt-1 text-sm text-gray-500">Twilio events will appear here when calls are made.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Twilio Calls */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Call History</h2>
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
                            {call.phone}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {call.direction}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          SID: {call.call_sid} • Duration: {call.duration}s • {formatDateTime(call.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No calls yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Call history will appear here when calls are made through Twilio.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}