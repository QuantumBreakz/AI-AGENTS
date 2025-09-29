'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  PhoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  CodeBracketIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatDateTime } from '../../../utils/date'

const API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface CallWebhookPayload {
  call_sid: string
  status: string
  from: string
  to: string
  direction: 'inbound' | 'outbound'
  duration?: number
  recording_url?: string
  transcript?: string
  digits?: string
  speech_result?: string
  timestamp: string
  metadata: any
}

interface WebhookEvent {
  id: string
  event_type: string
  payload: CallWebhookPayload
  received_at: string
  processed: boolean
  error_message?: string
}

export default function CallWebhookPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterEvent, setFilterEvent] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)
  const [showRawPayload, setShowRawPayload] = useState(false)

  useEffect(() => {
    fetchWebhookEvents()
    const interval = setInterval(fetchWebhookEvents, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchWebhookEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch webhook events from the API
      const eventsResponse = await fetch(`${API}/calls/webhook`, {
        method: 'GET'
      })
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)
      } else {
        // If no events endpoint, create empty array
        setEvents([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleWebhookEvent = async (eventData: CallWebhookPayload) => {
    try {
      const response = await fetch(`${API}/calls/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error('Failed to process webhook')
      }

      const result = await response.json()
      console.log('Webhook processed:', result)
      fetchWebhookEvents() // Refresh data
    } catch (err) {
      console.error('Failed to process webhook:', err)
    }
  }

  const retryWebhook = async (eventId: string) => {
    try {
      // This would typically retry a failed webhook
      console.log('Retrying webhook:', eventId)
      fetchWebhookEvents() // Refresh data
    } catch (err) {
      console.error('Failed to retry webhook:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'badge-success',
      answered: 'badge-success',
      failed: 'badge-danger',
      busy: 'badge-danger',
      'no-answer': 'badge-danger',
      ringing: 'badge-warning',
      initiated: 'badge-info'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'answered':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'failed':
      case 'busy':
      case 'no-answer':
        return <XCircleIcon className="h-4 w-4" />
      case 'ringing':
        return <PhoneIcon className="h-4 w-4" />
      case 'initiated':
        return <ClockIcon className="h-4 w-4" />
      default:
        return <PhoneIcon className="h-4 w-4" />
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'call_status':
        return <PhoneIcon className="h-4 w-4 text-blue-600" />
      case 'call_answered':
        return <PlayIcon className="h-4 w-4 text-green-600" />
      case 'call_failed':
        return <XCircleIcon className="h-4 w-4 text-red-600" />
      case 'call_gather':
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-yellow-600" />
      case 'call_transfer':
        return <ArrowPathIcon className="h-4 w-4 text-purple-600" />
      default:
        return <PhoneIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const filteredEvents = events.filter(event => {
    const matchesStatus = filterStatus === 'all' || event.payload.status === filterStatus
    const matchesEvent = filterEvent === 'all' || event.event_type === filterEvent
    const matchesSearch = !searchTerm || 
      event.payload.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.payload.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.payload.call_sid.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesEvent && matchesSearch
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading webhook events...</div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error: {error}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Webhooks</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage call webhook events
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Auto-refreshing every 5 seconds
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search webhook events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="answered">Answered</option>
              <option value="failed">Failed</option>
              <option value="busy">Busy</option>
              <option value="no-answer">No Answer</option>
              <option value="ringing">Ringing</option>
            </select>
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Events</option>
              <option value="call_status">Call Status</option>
              <option value="call_answered">Call Answered</option>
              <option value="call_failed">Call Failed</option>
              <option value="call_gather">Call Gather</option>
              <option value="call_transfer">Call Transfer</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                    <dd className="text-lg font-medium text-gray-900">{events.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Processed</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {events.filter(e => e.processed).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {events.filter(e => !e.processed).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {events.length > 0 
                        ? Math.round((events.filter(e => e.processed).length / events.length) * 100)
                        : 0
                      }%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Events */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Webhook Events</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      {getEventIcon(event.event_type)}
                      <span className="ml-2 text-md font-medium text-gray-900">
                        {event.event_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`ml-3 badge ${event.processed ? 'badge-success' : 'badge-danger'}`}>
                        {event.processed ? 'Processed' : 'Failed'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(event.received_at), 'MMM dd, HH:mm:ss')}
                      </span>
                      {!event.processed && (
                        <button
                          onClick={() => retryWebhook(event.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="text-sm text-gray-500">Call SID</div>
                      <div className="text-sm font-medium text-gray-900">{event.payload.call_sid}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">From</div>
                      <div className="text-sm font-medium text-gray-900">{event.payload.from}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">To</div>
                      <div className="text-sm font-medium text-gray-900">{event.payload.to}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <span className={getStatusBadge(event.payload.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(event.payload.status)}
                          <span className="ml-1">{event.payload.status}</span>
                        </span>
                      </span>
                    </div>
                  </div>

                  {event.payload.duration && (
                    <div className="mt-3 text-sm text-gray-600">
                      Duration: {formatDuration(event.payload.duration)}
                    </div>
                  )}

                  {event.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {event.error_message}
                    </div>
                  )}
                </div>
              ))}
              
              {filteredEvents.length === 0 && (
                <div className="text-center py-8">
                  <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No webhook events</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filterStatus !== 'all' || filterEvent !== 'all'
                      ? 'Try adjusting your search criteria.'
                      : 'Webhook events will appear here.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Webhook Event Details</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Event Type</label>
                    <p className="text-sm text-gray-900">{selectedEvent.event_type}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Call SID</label>
                    <p className="text-sm text-gray-900">{selectedEvent.payload.call_sid}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={getStatusBadge(selectedEvent.payload.status)}>
                      <span className="flex items-center">
                        {getStatusIcon(selectedEvent.payload.status)}
                        <span className="ml-1">{selectedEvent.payload.status}</span>
                      </span>
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Direction</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedEvent.payload.direction}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From</label>
                    <p className="text-sm text-gray-900">{selectedEvent.payload.from}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To</label>
                    <p className="text-sm text-gray-900">{selectedEvent.payload.to}</p>
                  </div>
                  
                  {selectedEvent.payload.duration && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <p className="text-sm text-gray-900">{formatDuration(selectedEvent.payload.duration)}</p>
                    </div>
                  )}
                  
                  {selectedEvent.payload.transcript && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transcript</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-900">{selectedEvent.payload.transcript}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Received At</label>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedEvent.received_at), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Processed</label>
                    <span className={`badge ${selectedEvent.processed ? 'badge-success' : 'badge-danger'}`}>
                      {selectedEvent.processed ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {selectedEvent.error_message && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Error Message</label>
                      <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">{selectedEvent.error_message}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Raw Payload</label>
                    <div className="mt-1">
                      <button
                        onClick={() => setShowRawPayload(!showRawPayload)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                      >
                        {showRawPayload ? <EyeSlashIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
                        {showRawPayload ? 'Hide' : 'Show'} Raw Payload
                      </button>
                      {showRawPayload && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <pre className="text-xs text-gray-900 overflow-x-auto">
                            {JSON.stringify(selectedEvent.payload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
