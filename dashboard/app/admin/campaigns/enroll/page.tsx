'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  EnvelopeIcon,
  UserGroupIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface Campaign {
  id: number
  name: string
  offer: string
  status: string
  emails: any[]
  created_at: string
}

interface Recipient {
  id: number
  lead_id: number
  name: string
  email: string
  company: string
  status: 'enrolled' | 'paused' | 'completed' | 'failed'
  enrolled_at: string
  last_email_sent: string | null
  emails_sent: number
  emails_opened: number
  emails_clicked: number
}

interface EnrollRequest {
  campaign_id: number
  lead_ids: number[]
  start_immediately: boolean
  delay_hours: number
}

export default function EnrollCampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (selectedCampaign) {
      fetchRecipients(selectedCampaign)
    }
  }, [selectedCampaign])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API}/campaigns/`)
      if (!response.ok) throw new Error('Failed to load campaigns')
      const data = await response.json()
      setCampaigns(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipients = async (campaignId: number) => {
    try {
      // This would typically fetch from a recipients API
      // For now, we'll use mock data
      const mockRecipients: Recipient[] = [
        {
          id: 1,
          lead_id: 101,
          name: 'John Doe',
          email: 'john@techcorp.com',
          company: 'TechCorp',
          status: 'enrolled',
          enrolled_at: '2024-01-20T10:30:00Z',
          last_email_sent: '2024-01-20T14:30:00Z',
          emails_sent: 2,
          emails_opened: 1,
          emails_clicked: 0
        },
        {
          id: 2,
          lead_id: 102,
          name: 'Jane Smith',
          email: 'jane@startupxyz.com',
          company: 'StartupXYZ',
          status: 'paused',
          enrolled_at: '2024-01-20T10:30:00Z',
          last_email_sent: '2024-01-20T14:30:00Z',
          emails_sent: 1,
          emails_opened: 1,
          emails_clicked: 1
        }
      ]
      setRecipients(mockRecipients)
    } catch (err) {
      console.error('Failed to fetch recipients:', err)
    }
  }

  const enrollRecipients = async (campaignId: number, leadIds: number[]) => {
    try {
      setEnrolling(true)
      const request: EnrollRequest = {
        campaign_id: campaignId,
        lead_ids: leadIds,
        start_immediately: true,
        delay_hours: 0
      }

      const response = await fetch(`${API}/campaigns/${campaignId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to enroll recipients')
      }

      const result = await response.json()
      console.log('Recipients enrolled:', result)
      fetchRecipients(campaignId) // Refresh recipients
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setEnrolling(false)
    }
  }

  const pauseRecipient = async (campaignId: number, recipientId: number) => {
    try {
      const response = await fetch(`${API}/campaigns/${campaignId}/recipients/${recipientId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paused: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to pause recipient')
      }

      fetchRecipients(campaignId) // Refresh recipients
    } catch (err) {
      console.error('Failed to pause recipient:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      enrolled: 'badge-success',
      paused: 'badge-warning',
      completed: 'badge-info',
      failed: 'badge-danger'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <PlayIcon className="h-4 w-4" />
      case 'paused':
        return <PauseIcon className="h-4 w-4" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'failed':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const filteredRecipients = recipients.filter(recipient => {
    const matchesStatus = filterStatus === 'all' || recipient.status === filterStatus
    const matchesSearch = !searchTerm || 
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.company.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Enrollment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enroll leads in email campaigns and manage recipients
            </p>
          </div>
        </div>

        {/* Campaign Selection */}
        <div className="mb-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Select Campaign</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCampaign === campaign.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCampaign(campaign.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-medium text-gray-900">{campaign.name}</h4>
                    <span className={`badge ${
                      campaign.status === 'active' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{campaign.offer}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {campaign.emails.length} emails • Created {new Date(campaign.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recipients Management */}
        {selectedCampaign && (
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Campaign Recipients</h3>
                <button
                  onClick={() => enrollRecipients(selectedCampaign, [101, 102, 103])}
                  disabled={enrolling}
                  className="btn-primary"
                >
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  {enrolling ? 'Enrolling...' : 'Enroll New Recipients'}
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Filters */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search recipients..."
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
                    <option value="enrolled">Enrolled</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserGroupIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Recipients</dt>
                          <dd className="text-lg font-medium text-gray-900">{recipients.length}</dd>
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
                            {recipients.filter(r => r.status === 'enrolled').length}
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
                            {recipients.filter(r => r.status === 'paused').length}
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
                          <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {recipients.filter(r => r.status === 'completed').length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipients Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emails Sent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Open Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Click Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecipients.map((recipient) => (
                      <tr key={recipient.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{recipient.name}</div>
                            <div className="text-sm text-gray-500">{recipient.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recipient.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(recipient.status)}>
                            <span className="flex items-center">
                              {getStatusIcon(recipient.status)}
                              <span className="ml-1">{recipient.status}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recipient.emails_sent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recipient.emails_sent > 0 
                            ? Math.round((recipient.emails_opened / recipient.emails_sent) * 100)
                            : 0
                          }%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recipient.emails_sent > 0 
                            ? Math.round((recipient.emails_clicked / recipient.emails_sent) * 100)
                            : 0
                          }%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {recipient.status === 'enrolled' && (
                            <button
                              onClick={() => pauseRecipient(selectedCampaign, recipient.id)}
                              className="text-yellow-600 hover:text-yellow-900 mr-3"
                            >
                              Pause
                            </button>
                          )}
                          {recipient.status === 'paused' && (
                            <button className="text-green-600 hover:text-green-900 mr-3">
                              Resume
                            </button>
                          )}
                          <button className="text-blue-600 hover:text-blue-900">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRecipients.length === 0 && (
                <div className="text-center py-8">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recipients found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search criteria.'
                      : 'Enroll some leads to get started.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedCampaign && (
          <div className="text-center py-8">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Select a campaign</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose a campaign above to manage recipients.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
