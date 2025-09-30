'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  PhoneIcon, 
  MagnifyingGlassIcon, 
  PlayIcon,
  PauseIcon,
  StopIcon,
  UserIcon,
  EnvelopeIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatDateTime } from '../../utils/date'
import { apiFetch } from '../../utils/api'

interface CallNote {
  id: number
  content: string
  created_at: string
}

interface Call {
  id: number
  email: string | null
  phone: string
  status: string
  purpose: string | null
  context: string | null
  created_at: string
  notes: CallNote[]
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/calls', {}, 3)
      setCalls(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async (callId: number) => {
    try {
      setEventsLoading(true)
      const evts = await apiFetch(`/calls/${callId}/events`, {}, 3)
      setEvents(evts)
    } catch (e) {
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }

  const filteredCalls = calls.filter(call => {
    const matchesSearch = !searchTerm || 
      call.phone.includes(searchTerm) ||
      call.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || call.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      initiated: 'badge-info',
      ringing: 'badge-warning',
      in_progress: 'badge-success',
      completed: 'badge-success',
      failed: 'badge-danger',
      cancelled: 'badge-danger'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <PlayIcon className="h-4 w-4" />
      case 'ringing':
        return <PhoneIcon className="h-4 w-4" />
      case 'completed':
        return <StopIcon className="h-4 w-4" />
      case 'failed':
      case 'cancelled':
        return <StopIcon className="h-4 w-4" />
      default:
        return <PhoneIcon className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading calls...</div>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Sessions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage your AI calling campaigns
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchCalls}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="btn-primary">
              <PhoneIcon className="h-5 w-5 mr-2" />
              Start New Call
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
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
              <option value="initiated">Initiated</option>
              <option value="ringing">Ringing</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
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
                    <PlayIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {calls.filter(c => c.status === 'in_progress').length}
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
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <StopIcon className="h-5 w-5 text-green-600" />
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
                    <StopIcon className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {calls.filter(c => c.status === 'failed').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calls Table */}
        <div className="mt-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Call Sessions ({filteredCalls.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="table td">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {call.email || 'Unknown Contact'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {call.purpose || 'No purpose specified'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table td">
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {call.phone}
                        </span>
                      </div>
                    </td>
                    <td className="table td">
                      <span className="text-sm text-gray-900">
                        {call.purpose || 'Unknown'}
                      </span>
                    </td>
                    <td className="table td">
                      <span className={getStatusBadge(call.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(call.status)}
                          <span className="ml-1">{call.status}</span>
                        </span>
                      </span>
                    </td>
                    <td className="table td">
                      <div className="flex items-center">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {call.notes.length} notes
                        </span>
                      </div>
                    </td>
                    <td className="table td">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDateTime(call.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="table td">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => { setSelectedCall(call); fetchEvents(call.id) }}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900 text-sm">
                          Call
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedCall.phone}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedCall.email || 'N/A'}</p>
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
                    <p className="text-sm text-gray-900">{selectedCall.purpose || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes ({selectedCall.notes.length})</label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {selectedCall.notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-900">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(note.created_at)}
                          </p>
                        </div>
                      ))}
                      {selectedCall.notes.length === 0 && (
                        <p className="text-sm text-gray-500">No notes available</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Events</label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {eventsLoading && <p className="text-sm text-gray-500">Loading events...</p>}
                      {!eventsLoading && events.map((e) => (
                        <div key={e.id} className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-900 capitalize">{e.event_type}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(e.created_at)}</p>
                        </div>
                      ))}
                      {!eventsLoading && events.length === 0 && (
                        <p className="text-sm text-gray-500">No events</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredCalls.length === 0 && (
          <div className="mt-8 text-center">
            <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No calls</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by initiating a new call.
            </p>
            <div className="mt-6">
              <button className="btn-primary">
                <PhoneIcon className="h-5 w-5 mr-2" />
                Start New Call
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
