'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PlayIcon,
  PauseIcon,
  StopIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/date'
import { apiFetch } from '../../utils/api'

const API = ''

interface CampaignEmail {
  id: number
  sequence_order: number
  subject_template: string | null
  body_template: string | null
  send_delay_hours: number
  is_follow_up: boolean
}

interface Campaign {
  id: number
  name: string
  offer: string | null
  status: string
  created_at: string
  updated_at: string
  emails: CampaignEmail[]
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    status: 'draft'
  })
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [recipients, setRecipients] = useState<any[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null)
  const [recipientEvents, setRecipientEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [previewEmail, setPreviewEmail] = useState<CampaignEmail | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/campaigns/', {}, 2)
      setCampaigns(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const openRecipientTimeline = async (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setSelectedRecipient(null)
    setRecipientEvents([])
    try {
      setRecipientsLoading(true)
      const recs = await apiFetch(`/campaigns/${campaign.id}/recipients`, {}, 2)
      setRecipients(recs)
    } catch (e) {
      setRecipients([])
    } finally {
      setRecipientsLoading(false)
    }
  }

  const loadRecipientEvents = async (recipient: any) => {
    setSelectedRecipient(recipient)
    try {
      setEventsLoading(true)
      const evs = await apiFetch(`/campaigns/${selectedCampaign?.id}/recipients/${recipient.id}/events`, {}, 2)
      setRecipientEvents(evs)
    } catch (e) {
      setRecipientEvents([])
    } finally {
      setEventsLoading(false)
    }
  }

  const createCampaign = async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/campaigns/', {
        method: 'POST',
        body: JSON.stringify({
          name: newCampaign.name,
          offer: newCampaign.content,
          status: newCampaign.status,
          emails: [
            { subject_template: newCampaign.subject, body_template: newCampaign.content, send_delay_hours: 0, is_follow_up: false }
          ]
        })
      }, 2)
      if (res) {
        setNewCampaign({ name: '', subject: '', content: '', status: 'draft' })
        setShowCreateForm(false)
        fetchCampaigns()
        alert('Campaign created successfully!')
      } else {
        alert('Failed to create campaign. Please try again.')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Error creating campaign. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startCampaign = async (campaignId: number) => {
    try {
      setLoading(true)
      const res = await apiFetch(`/campaigns/${campaignId}/recipients`, { method: 'GET' }, 2)
      const leadIds = (res || []).map((r: any) => r.lead_id)
      await apiFetch(`/campaigns/${campaignId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ lead_ids: leadIds, send_now: true })
      }, 2)
      if (true) {
        fetchCampaigns()
        alert('Campaign started successfully!')
      } else {
        alert('Failed to start campaign. Please try again.')
      }
    } catch (error) {
      console.error('Error starting campaign:', error)
      alert('Error starting campaign. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.offer?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'badge-info',
      active: 'badge-success',
      paused: 'badge-warning',
      completed: 'badge-danger'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayIcon className="h-4 w-4" />
      case 'paused':
        return <PauseIcon className="h-4 w-4" />
      case 'completed':
        return <StopIcon className="h-4 w-4" />
      default:
        return <EnvelopeIcon className="h-4 w-4" />
    }
  }


  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading campaigns...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage your email marketing campaigns
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchCampaigns}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Campaign
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
                placeholder="Search campaigns..."
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
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Campaigns</dt>
                    <dd className="text-lg font-medium text-gray-900">{campaigns.length}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {campaigns.filter(c => c.status === 'active').length}
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
                    <PauseIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Paused</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {campaigns.filter(c => c.status === 'paused').length}
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
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <ChartBarIcon className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {campaigns.filter(c => c.status === 'draft').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {campaign.offer || 'No offer description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={getStatusBadge(campaign.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1">{campaign.status}</span>
                        </span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(campaign.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {campaign.emails.length} emails
                    </span>
                    <span className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      0 recipients
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 btn-secondary text-sm" onClick={() => openRecipientTimeline(campaign)}>
                    Recipients
                  </button>
                  <button className="flex-1 btn-primary text-sm" onClick={() => setPreviewEmail(campaign.emails[0] || null)}>
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="mt-8 text-center">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new campaign.
            </p>
            <div className="mt-6">
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Campaign
              </button>
            </div>
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Campaign</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  createCampaign()
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                      <input
                        type="text"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subject Line</label>
                      <input
                        type="text"
                        value={newCampaign.subject}
                        onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Content</label>
                      <textarea
                        value={newCampaign.content}
                        onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                        required
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={newCampaign.status}
                        onChange={(e) => setNewCampaign({...newCampaign, status: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Creating...' : 'Create Campaign'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Recipient Timeline Drawer */}
        {selectedCampaign && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-30 z-40" onClick={() => setSelectedCampaign(null)}>
            <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recipients • {selectedCampaign.name}</h3>
                <button onClick={() => setSelectedCampaign(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              {recipientsLoading ? (
                <p className="text-sm text-gray-500">Loading recipients...</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-3 max-h-[70vh] overflow-y-auto">
                    <h4 className="text-sm font-medium mb-2">Recipients</h4>
                    <div className="space-y-2">
                      {recipients.map((r) => (
                        <button key={r.id} className={`w-full text-left p-2 rounded ${selectedRecipient?.id === r.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`} onClick={() => loadRecipientEvents(r)}>
                          <div className="text-sm text-gray-900">{r.email}</div>
                          <div className="text-xs text-gray-500">Step {r.current_step} {r.paused ? '• paused' : ''}</div>
                        </button>
                      ))}
                      {recipients.length === 0 && <p className="text-sm text-gray-500">No recipients.</p>}
                    </div>
                  </div>
                  <div className="border rounded p-3 max-h-[70vh] overflow-y-auto">
                    <h4 className="text-sm font-medium mb-2">Timeline</h4>
                    {eventsLoading && <p className="text-sm text-gray-500">Loading timeline...</p>}
                    {!eventsLoading && selectedRecipient && (
                      <div className="space-y-2">
                        {recipientEvents.map((e) => (
                          <div key={e.id} className="bg-gray-50 p-2 rounded">
                            <div className="text-sm text-gray-900 capitalize">{e.event_type}</div>
                            <div className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                        {recipientEvents.length === 0 && <p className="text-sm text-gray-500">No events.</p>}
                      </div>
                    )}
                    {!eventsLoading && !selectedRecipient && <p className="text-sm text-gray-500">Select a recipient to view timeline.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Template Preview Modal */}
        {previewEmail && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Email Preview</h3>
                <button onClick={() => setPreviewEmail(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-sm text-gray-900">{previewEmail.subject_template || '(no subject)'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Body</label>
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">{previewEmail.body_template || '(no body)'}</pre>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setPreviewEmail(null)} className="btn-secondary">Close</button>
                <button disabled className="btn-primary opacity-60 cursor-not-allowed" title="Test send not implemented yet">Test Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
