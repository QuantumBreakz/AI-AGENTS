'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  PhoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  UserIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatDateTime } from "../../utils/date"

const API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface CallNote {
  id: number
  content: string
  created_at: string
}

interface ActiveCall {
  id: number
  email: string | null
  phone: string
  status: string
  purpose: string | null
  context: string | null
  created_at: string
  notes: CallNote[]
  duration?: number
  last_activity?: string
}

export default function ActiveCallsPage() {
  const [calls, setCalls] = useState<ActiveCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null)
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    fetchActiveCalls()
    const interval = setInterval(fetchActiveCalls, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchActiveCalls = async () => {
    try {
      const res = await fetch(`${API}/calls`)
      if (!res.ok) throw new Error('Failed to load calls')
      const data = await res.json()
      
      // Filter for active calls (in_progress, ringing, initiated)
      const activeCalls = data.filter((call: any) => 
        ['in_progress', 'ringing', 'initiated'].includes(call.status)
      )
      setCalls(activeCalls)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCallAction = async (callId: number, action: string) => {
    try {
      const response = await fetch(`${API}/calls/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_id: callId,
          stage: action === 'pause' ? 'paused' : action === 'resume' ? 'in_progress' : undefined,
          disposition: action === 'complete' ? 'completed' : undefined
        }),
      })

      if (!response.ok) throw new Error('Failed to update call')
      
      fetchActiveCalls() // Refresh the list
    } catch (err) {
      console.error('Failed to update call:', err)
    }
  }

  const addNote = async (callId: number) => {
    if (!newNote.trim()) return

    try {
      const response = await fetch(`${API}/calls/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_id: callId,
          note: newNote
        }),
      })

      if (!response.ok) throw new Error('Failed to add note')
      
      setNewNote('')
      fetchActiveCalls() // Refresh the list
    } catch (err) {
      console.error('Failed to add note:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      initiated: 'badge-info',
      ringing: 'badge-warning',
      in_progress: 'badge-success',
      paused: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-danger'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <PlayIcon className="h-4 w-4" />
      case 'ringing':
        return <PhoneIcon className="h-4 w-4" />
      case 'paused':
        return <PauseIcon className="h-4 w-4" />
      case 'completed':
        return <StopIcon className="h-4 w-4" />
      default:
        return <PhoneIcon className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading active calls...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Active Calls</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage your ongoing call sessions
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Auto-refreshing every 5 seconds
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Active</dt>
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
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <PhoneIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Ringing</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {calls.filter(c => c.status === 'ringing').length}
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
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <PauseIcon className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Paused</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {calls.filter(c => c.status === 'paused').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Calls List */}
        <div className="mt-8 space-y-4">
          {calls.map((call) => (
            <div key={call.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        Call to {call.email || 'Unknown Contact'}
                      </h3>
                      <span className={getStatusBadge(call.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(call.status)}
                          <span className="ml-1">{call.status}</span>
                        </span>
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      <span className="mr-4">{call.phone}</span>
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>Started {formatDate(call.created_at), 'MMM dd, HH:mm')}</span>
                    </div>

                    {call.purpose && (
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>Purpose:</strong> {call.purpose}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                        <span>{call.notes.length} notes</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedCall(call)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details
                        </button>
                        {call.status === 'in_progress' && (
                          <button
                            onClick={() => handleCallAction(call.id, 'pause')}
                            className="btn-secondary text-sm"
                          >
                            <PauseIcon className="h-4 w-4 mr-1" />
                            Pause
                          </button>
                        )}
                        {call.status === 'paused' && (
                          <button
                            onClick={() => handleCallAction(call.id, 'resume')}
                            className="btn-success text-sm"
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => handleCallAction(call.id, 'complete')}
                          className="btn-primary text-sm"
                        >
                          <StopIcon className="h-4 w-4 mr-1" />
                          Complete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                      {selectedCall.notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-900">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(note.created_at), 'MMM dd, HH:mm')}
                          </p>
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

        {calls.length === 0 && (
          <div className="mt-8 text-center">
            <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No active calls</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start a new calling campaign to see active calls here.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
