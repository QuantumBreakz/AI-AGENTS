'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  LinkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatDateTime } from "../../utils/date"

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface WebhookEvent {
  id: string
  type: string
  payload: any
  status: 'success' | 'failed' | 'pending'
  attempts: number
  created_at: string
  processed_at: string | null
  error_message: string | null
}

interface WebhookEndpoint {
  id: number
  name: string
  url: string
  events: string[]
  is_active: boolean
  secret: string
  created_at: string
  last_triggered: string | null
  success_count: number
  failure_count: number
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEndpointForm, setShowEndpointForm] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterEvent, setFilterEvent] = useState('all')

  useEffect(() => {
    fetchWebhookData()
  }, [])

  const fetchWebhookData = async () => {
    try {
      setLoading(true)
      // This would typically fetch from webhook API endpoints
      // For now, we'll use mock data
      const mockEndpoints: WebhookEndpoint[] = [
        {
          id: 1,
          name: 'CRM Integration',
          url: 'https://crm.example.com/webhooks/leads',
          events: ['lead_created', 'lead_updated', 'lead_qualified'],
          is_active: true,
          secret: 'whsec_1234567890abcdef',
          created_at: '2024-01-15T10:30:00Z',
          last_triggered: '2024-01-20T14:30:00Z',
          success_count: 45,
          failure_count: 2
        },
        {
          id: 2,
          name: 'Email Marketing',
          url: 'https://email.example.com/webhooks/campaigns',
          events: ['campaign_sent', 'email_opened', 'email_clicked'],
          is_active: false,
          secret: 'whsec_abcdef1234567890',
          created_at: '2024-01-16T09:15:00Z',
          last_triggered: '2024-01-19T11:20:00Z',
          success_count: 23,
          failure_count: 1
        }
      ]

      const mockEvents: WebhookEvent[] = [
        {
          id: 'evt_1',
          type: 'lead_created',
          payload: { lead_id: 123, name: 'John Doe', email: 'john@example.com' },
          status: 'success',
          attempts: 1,
          created_at: '2024-01-20T14:30:00Z',
          processed_at: '2024-01-20T14:30:05Z',
          error_message: null
        },
        {
          id: 'evt_2',
          type: 'campaign_sent',
          payload: { campaign_id: 456, emails_sent: 100 },
          status: 'failed',
          attempts: 3,
          created_at: '2024-01-20T13:15:00Z',
          processed_at: null,
          error_message: 'Connection timeout'
        },
        {
          id: 'evt_3',
          type: 'email_opened',
          payload: { email_id: 789, recipient: 'jane@example.com' },
          status: 'pending',
          attempts: 0,
          created_at: '2024-01-20T15:45:00Z',
          processed_at: null,
          error_message: null
        }
      ]

      setEndpoints(mockEndpoints)
      setEvents(mockEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createEndpoint = async (endpointData: Partial<WebhookEndpoint>) => {
    try {
      // This would call the webhook API to create an endpoint
      console.log('Creating endpoint:', endpointData)
      fetchWebhookData() // Refresh data
      setShowEndpointForm(false)
    } catch (err) {
      console.error('Failed to create endpoint:', err)
    }
  }

  const toggleEndpoint = async (endpointId: number, isActive: boolean) => {
    try {
      // This would call the webhook API to toggle endpoint status
      console.log('Toggling endpoint:', endpointId, isActive)
      fetchWebhookData() // Refresh data
    } catch (err) {
      console.error('Failed to toggle endpoint:', err)
    }
  }

  const deleteEndpoint = async (endpointId: number) => {
    try {
      // This would call the webhook API to delete an endpoint
      console.log('Deleting endpoint:', endpointId)
      fetchWebhookData() // Refresh data
    } catch (err) {
      console.error('Failed to delete endpoint:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'badge-success',
      failed: 'badge-danger',
      pending: 'badge-warning'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'failed':
        return <XCircleIcon className="h-4 w-4" />
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus
    const matchesEvent = filterEvent === 'all' || event.type === filterEvent
    return matchesStatus && matchesEvent
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading webhooks...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Webhook Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage webhook endpoints and monitor event delivery
            </p>
          </div>
          <button
            onClick={() => setShowEndpointForm(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Endpoint
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <LinkIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Endpoints</dt>
                    <dd className="text-lg font-medium text-gray-900">{endpoints.length}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {endpoints.filter(e => e.is_active).length}
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
                    <ClockIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Events</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {events.filter(e => e.status === 'pending').length}
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Failed Events</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {events.filter(e => e.status === 'failed').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Webhook Endpoints */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Webhook Endpoints</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-md font-medium text-gray-900">{endpoint.name}</h4>
                        <p className="text-sm text-gray-600 break-all">{endpoint.url}</p>
                        <div className="flex items-center mt-2">
                          <span className={`badge ${endpoint.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {endpoint.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {endpoint.events.length} events
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedEndpoint(endpoint)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleEndpoint(endpoint.id, !endpoint.is_active)}
                          className={endpoint.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}
                        >
                          {endpoint.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteEndpoint(endpoint.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Success:</span>
                        <span className="ml-1 font-medium text-green-600">{endpoint.success_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Failures:</span>
                        <span className="ml-1 font-medium text-red-600">{endpoint.failure_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {endpoints.length === 0 && (
                  <div className="text-center py-8">
                    <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No webhook endpoints</h3>
                    <p className="mt-1 text-sm text-gray-500">Create your first webhook endpoint to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Events</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-md font-medium text-gray-900">{event.type}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(event.created_at), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                      <span className={getStatusBadge(event.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(event.status)}
                          <span className="ml-1">{event.status}</span>
                        </span>
                      </span>
                    </div>
                    
                    {event.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {event.error_message}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <span>Attempts: {event.attempts}</span>
                      {event.processed_at && (
                        <span>Processed: {formatDate(event.processed_at), 'HH:mm:ss')}</span>
                      )}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-8">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
                    <p className="mt-1 text-sm text-gray-500">Webhook events will appear here when they occur.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event History */}
        <div className="mt-8 card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Event History</h3>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Events</option>
                  <option value="lead_created">Lead Created</option>
                  <option value="campaign_sent">Campaign Sent</option>
                  <option value="email_opened">Email Opened</option>
                  <option value="email_clicked">Email Clicked</option>
                </select>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.type}</div>
                        <div className="text-sm text-gray-500">ID: {event.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(event.status)}>
                          <span className="flex items-center">
                            {getStatusIcon(event.status)}
                            <span className="ml-1">{event.status}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.attempts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(event.created_at), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.processed_at ? formatDate(event.processed_at), 'MMM dd, HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Endpoint Creation Modal */}
        {showEndpointForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create Webhook Endpoint</h3>
                  <button
                    onClick={() => setShowEndpointForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  createEndpoint({
                    name: formData.get('name') as string,
                    url: formData.get('url') as string,
                    events: (formData.get('events') as string).split(',').map(e => e.trim()),
                    is_active: true,
                    secret: 'whsec_' + Math.random().toString(36).substring(2, 15)
                  })
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Endpoint Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                    <input
                      type="url"
                      name="url"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://your-app.com/webhooks"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Events (comma-separated)</label>
                    <input
                      type="text"
                      name="events"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="lead_created, campaign_sent, email_opened"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEndpointForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create Endpoint
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
