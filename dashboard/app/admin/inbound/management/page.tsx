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
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatDateTime } from "../../utils/date"

const API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface InboundEvent {
  id: string
  event_type: 'call_received' | 'call_answered' | 'call_ended' | 'call_failed' | 'voicemail' | 'transfer'
  caller_phone: string
  caller_name?: string
  call_sid: string
  status: string
  duration?: number
  transcript?: string
  recording_url?: string
  created_at: string
  metadata: any
}

interface InboundCall {
  id: number
  caller_phone: string
  caller_name?: string
  purpose: string
  status: string
  duration: number
  transcript?: string
  notes: string[]
  created_at: string
  answered_at?: string
  ended_at?: string
  disposition?: string
  recording_url?: string
}

export default function InboundManagementPage() {
  const [events, setEvents] = useState<InboundEvent[]>([])
  const [calls, setCalls] = useState<InboundCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterEvent, setFilterEvent] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCall, setSelectedCall] = useState<InboundCall | null>(null)
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    fetchInboundData()
    const interval = setInterval(fetchInboundData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchInboundData = async () => {
    try {
      setLoading(true)
      
      // Fetch inbound events
      const eventsResponse = await fetch(`${API}/inbound/webhook`, {
        method: 'GET'
      })
      
      // Fetch inbound events from the API
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)
      } else {
        // If no events endpoint, create empty array
        setEvents([])
      }

      // Fetch inbound calls from the API
      const callsResponse = await fetch(`${API}/calls`)
      
      if (callsResponse.ok) {
        const callsData = await callsResponse.json()
        // Filter for inbound calls (you might need to adjust this based on your API structure)
        const inboundCalls = callsData.filter((call: any) => call.direction === 'inbound' || call.type === 'inbound')
        setCalls(inboundCalls)
      } else {
        setCalls([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInboundEvent = async (eventData: any) => {
    try {
      const response = await fetch(`${API}/inbound/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error('Failed to process inbound event')
      }

      const result = await response.json()
      console.log('Inbound event processed:', result)
      fetchInboundData() // Refresh data
    } catch (err) {
      console.error('Failed to process inbound event:', err)
    }
  }

  const addNote = async (callId: number) => {
    if (!newNote.trim()) return

    try {
      // This would call an API to add a note
      console.log('Adding note to call:', callId, newNote)
      setNewNote('')
      fetchInboundData() // Refresh data
    } catch (err) {
      console.error('Failed to add note:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'badge-success',
      missed: 'badge-danger',
      in_progress: 'badge-warning',
      ringing: 'badge-info',
      failed: 'badge-danger'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'missed':
        return <XCircleIcon className="h-4 w-4" />
      case 'in_progress':
        return <PhoneIcon className="h-4 w-4" />
      case 'ringing':
        return <PhoneIcon className="h-4 w-4" />
      default:
        return <PhoneIcon className="h-4 w-4" />
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'call_received':
        return <PhoneIcon className="h-4 w-4 text-blue-600" />
      case 'call_answered':
        return <PlayIcon className="h-4 w-4 text-green-600" />
      case 'call_ended':
        return <StopIcon className="h-4 w-4 text-gray-600" />
      case 'call_failed':
        return <XCircleIcon className="h-4 w-4 text-red-600" />
      case 'voicemail':
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-yellow-600" />
      case 'transfer':
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

  const filteredCalls = calls.filter(call => {
    const matchesStatus = filterStatus === 'all' || call.status === filterStatus
    const matchesSearch = !searchTerm || 
      call.caller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.caller_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const filteredEvents = events.filter(event => {
    const matchesEvent = filterEvent === 'all' || event.event_type === filterEvent
    return matchesEvent
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading inbound data...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Inbound Call Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage incoming calls and events
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
                placeholder="Search calls..."
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
              <option value="missed">Missed</option>
              <option value="in_progress">In Progress</option>
              <option value="ringing">Ringing</option>
            </select>
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Events</option>
              <option value="call_received">Call Received</option>
              <option value="call_answered">Call Answered</option>
              <option value="call_ended">Call Ended</option>
              <option value="call_failed">Call Failed</option>
              <option value="voicemail">Voicemail</option>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Calls</dt>
                    <dd className="text-lg font-medium text-gray-900">{calls.length}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {calls.filter(c => c.status === 'completed').length}
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Missed</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {calls.filter(c => c.status === 'missed').length}
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
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <PhoneIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {calls.filter(c => c.status === 'in_progress').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Events */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Events</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {filteredEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        {getEventIcon(event.event_type)}
                        <span className="ml-2 text-md font-medium text-gray-900">
                          {event.event_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(event.created_at), 'HH:mm:ss')}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>Caller: {event.caller_name || 'Unknown'} ({event.caller_phone})</div>
                      {event.duration && (
                        <div>Duration: {formatDuration(event.duration)}</div>
                      )}
                      {event.transcript && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          {event.transcript.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredEvents.length === 0 && (
                  <div className="text-center py-8">
                    <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
                    <p className="mt-1 text-sm text-gray-500">Inbound events will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inbound Calls */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Inbound Calls</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {filteredCalls.slice(0, 5).map((call) => (
                  <div key={call.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">
                          {call.caller_name || 'Unknown Caller'}
                        </h4>
                        <p className="text-sm text-gray-600">{call.caller_phone}</p>
                        <p className="text-sm text-gray-500">{call.purpose}</p>
                      </div>
                      <span className={getStatusBadge(call.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(call.status)}
                          <span className="ml-1">{call.status}</span>
                        </span>
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{formatDate(call.created_at), 'MMM dd, HH:mm')}</span>
                        {call.duration > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{formatDuration(call.duration)}</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedCall(call)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
                {filteredCalls.length === 0 && (
                  <div className="text-center py-8">
                    <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No calls found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search criteria.'
                        : 'Incoming calls will appear here.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Call Details Modal */}
        {selectedCall && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Call Details</h3>
                  <button
                    onClick={() => setSelectedCall(null)}
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
                    <label className="block text-sm font-medium text-gray-700">Caller</label>
                    <p className="text-sm text-gray-900">{selectedCall.caller_name || 'Unknown'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedCall.caller_phone}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={getStatusBadge(selectedCall.status)}>
                      <span className="flex items-center">
                        {getStatusIcon(selectedCall.status)}
                        <span className="ml-1">{selectedCall.status}</span>
                      </span>
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <p className="text-sm text-gray-900">{selectedCall.purpose}</p>
                  </div>
                  
                  {selectedCall.duration > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <p className="text-sm text-gray-900">{formatDuration(selectedCall.duration)}</p>
                    </div>
                  )}
                  
                  {selectedCall.transcript && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transcript</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-900">{selectedCall.transcript}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Add Note</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add a note about this call..."
                      />
                      <button
                        onClick={() => addNote(selectedCall.id)}
                        className="btn-primary"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes ({selectedCall.notes.length})</label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {selectedCall.notes.map((note, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-900">{note}</p>
                        </div>
                      ))}
                      {selectedCall.notes.length === 0 && (
                        <p className="text-sm text-gray-500">No notes available</p>
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
