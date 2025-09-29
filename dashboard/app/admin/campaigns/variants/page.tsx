'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  EnvelopeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface EmailVariant {
  id: number
  email_id: number
  subject_line: string
  body_content: string
  sender_name: string
  send_time: string
  is_active: boolean
  performance: {
    sent: number
    opened: number
    clicked: number
    replied: number
    open_rate: number
    click_rate: number
    reply_rate: number
  }
  created_at: string
}

interface Email {
  id: number
  campaign_id: number
  sequence_order: number
  subject_template: string
  body_template: string
  send_delay_hours: number
  variants: EmailVariant[]
  created_at: string
}

interface Campaign {
  id: number
  name: string
  offer: string
  status: string
  emails: Email[]
  created_at: string
}

export default function EmailVariantsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null)
  const [variants, setVariants] = useState<EmailVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [newVariant, setNewVariant] = useState<Partial<EmailVariant>>({
    subject_line: '',
    body_content: '',
    sender_name: '',
    send_time: '',
    is_active: true
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (selectedEmail) {
      fetchVariants(selectedEmail)
    }
  }, [selectedEmail])

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

  const fetchVariants = async (emailId: number) => {
    try {
      // This would typically fetch from a variants API
      // For now, we'll use mock data
      const mockVariants: EmailVariant[] = [
        {
          id: 1,
          email_id: emailId,
          subject_line: 'Quick question about your business',
          body_content: 'Hi {{name}},\n\nI hope this email finds you well...',
          sender_name: 'John Smith',
          send_time: '10:00 AM',
          is_active: true,
          performance: {
            sent: 100,
            opened: 45,
            clicked: 12,
            replied: 3,
            open_rate: 45,
            click_rate: 12,
            reply_rate: 3
          },
          created_at: '2024-01-20T10:30:00Z'
        },
        {
          id: 2,
          email_id: emailId,
          subject_line: 'Following up on our conversation',
          body_content: 'Hi {{name}},\n\nI wanted to follow up on our previous discussion...',
          sender_name: 'Jane Doe',
          send_time: '2:00 PM',
          is_active: false,
          performance: {
            sent: 50,
            opened: 20,
            clicked: 5,
            replied: 1,
            open_rate: 40,
            click_rate: 10,
            reply_rate: 2
          },
          created_at: '2024-01-20T11:15:00Z'
        }
      ]
      setVariants(mockVariants)
    } catch (err) {
      console.error('Failed to fetch variants:', err)
    }
  }

  const createVariant = async () => {
    if (!selectedEmail || !newVariant.subject_line || !newVariant.body_content) return

    try {
      const response = await fetch(`${API}/campaigns/emails/${selectedEmail}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVariant),
      })

      if (!response.ok) {
        throw new Error('Failed to create variant')
      }

      const result = await response.json()
      console.log('Variant created:', result)
      fetchVariants(selectedEmail) // Refresh variants
      setShowVariantForm(false)
      setNewVariant({
        subject_line: '',
        body_content: '',
        sender_name: '',
        send_time: '',
        is_active: true
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const generateSequence = async (campaignId: number) => {
    try {
      const response = await fetch(`${API}/campaigns/${campaignId}/generate-sequence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer: campaigns.find(c => c.id === campaignId)?.offer || '',
          sequence_length: 3
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate sequence')
      }

      const result = await response.json()
      console.log('Sequence generated:', result)
      fetchCampaigns() // Refresh campaigns
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 50) return 'text-green-600'
    if (rate >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 50) return 'badge-success'
    if (rate >= 30) return 'badge-warning'
    return 'badge-danger'
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Variants</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and test different email variants for A/B testing
            </p>
          </div>
          {selectedCampaign && (
            <button
              onClick={() => generateSequence(selectedCampaign)}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Generate Sequence
            </button>
          )}
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

        {/* Email Selection */}
        {selectedCampaign && (
          <div className="mb-8 card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Select Email</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.find(c => c.id === selectedCampaign)?.emails.map((email) => (
                  <div
                    key={email.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedEmail === email.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEmail(email.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-medium text-gray-900">Email {email.sequence_order}</h4>
                      <span className="text-sm text-gray-500">{email.variants.length} variants</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{email.subject_template}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Delay: {email.send_delay_hours}h • Created {new Date(email.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Variants Management */}
        {selectedEmail && (
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Email Variants</h3>
                <button
                  onClick={() => setShowVariantForm(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Variant
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {variants.map((variant) => (
                  <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-md font-medium text-gray-900">{variant.subject_line}</h4>
                        <p className="text-sm text-gray-600 mt-1">From: {variant.sender_name}</p>
                        <p className="text-sm text-gray-500 mt-1">Send time: {variant.send_time}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`badge ${variant.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {variant.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-3">
                        {variant.body_content}
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{variant.performance.sent}</div>
                        <div className="text-sm text-gray-500">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getPerformanceColor(variant.performance.open_rate)}`}>
                          {variant.performance.open_rate}%
                        </div>
                        <div className="text-sm text-gray-500">Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getPerformanceColor(variant.performance.click_rate)}`}>
                          {variant.performance.click_rate}%
                        </div>
                        <div className="text-sm text-gray-500">Click Rate</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getPerformanceColor(variant.performance.reply_rate)}`}>
                          {variant.performance.reply_rate}%
                        </div>
                        <div className="text-sm text-gray-500">Reply Rate</div>
                      </div>
                    </div>
                  </div>
                ))}

                {variants.length === 0 && (
                  <div className="text-center py-8">
                    <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No variants</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create your first email variant to start A/B testing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Variant Creation Modal */}
        {showVariantForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create Email Variant</h3>
                  <button
                    onClick={() => setShowVariantForm(false)}
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
                  createVariant()
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject Line</label>
                    <input
                      type="text"
                      value={newVariant.subject_line || ''}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, subject_line: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Body Content</label>
                    <textarea
                      value={newVariant.body_content || ''}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, body_content: e.target.value }))}
                      rows={6}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sender Name</label>
                      <input
                        type="text"
                        value={newVariant.sender_name || ''}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, sender_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Send Time</label>
                      <input
                        type="time"
                        value={newVariant.send_time || ''}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, send_time: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newVariant.is_active || false}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowVariantForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create Variant
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {!selectedCampaign && (
          <div className="text-center py-8">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Select a campaign</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose a campaign above to manage email variants.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
