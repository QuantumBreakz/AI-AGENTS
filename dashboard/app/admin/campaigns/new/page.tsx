'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import { 
  EnvelopeIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface EmailTemplate {
  sequence_order: number
  subject_template: string
  body_template: string
  send_delay_hours: number
  is_follow_up: boolean
}

interface CampaignFormData {
  name: string
  offer: string
  status: string
  emails: EmailTemplate[]
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    offer: '',
    status: 'draft',
    emails: [
      {
        sequence_order: 1,
        subject_template: '',
        body_template: '',
        send_delay_hours: 0,
        is_follow_up: false
      }
    ]
  })

  const handleInputChange = (field: keyof CampaignFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEmailChange = (index: number, field: keyof EmailTemplate, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => 
        i === index ? { ...email, [field]: value } : email
      )
    }))
  }

  const addEmailTemplate = () => {
    setFormData(prev => ({
      ...prev,
      emails: [
        ...prev.emails,
        {
          sequence_order: prev.emails.length + 1,
          subject_template: '',
          body_template: '',
          send_delay_hours: 24,
          is_follow_up: true
        }
      ]
    }))
  }

  const removeEmailTemplate = (index: number) => {
    if (formData.emails.length > 1) {
      setFormData(prev => ({
        ...prev,
        emails: prev.emails.filter((_, i) => i !== index).map((email, i) => ({
          ...email,
          sequence_order: i + 1
        }))
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API}/campaigns/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create campaign')
      }

      router.push('/admin/campaigns')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
            <p className="mt-1 text-sm text-gray-500">
              Set up an email marketing campaign with multiple touchpoints
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Campaign Basic Info */}
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Campaign Information</h3>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Q4 Product Launch Campaign"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer/Value Proposition
                </label>
                <textarea
                  value={formData.offer}
                  onChange={(e) => handleInputChange('offer', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what you're offering to prospects..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email Sequence */}
          <div className="card mb-8">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Email Sequence</h3>
                <button
                  type="button"
                  onClick={addEmailTemplate}
                  className="btn-primary text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Email
                </button>
              </div>
            </div>
            <div className="card-body space-y-6">
              {formData.emails.map((email, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Email {email.sequence_order}
                      {email.is_follow_up && (
                        <span className="ml-2 text-sm text-gray-500">(Follow-up)</span>
                      )}
                    </h4>
                    {formData.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailTemplate(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={email.subject_template}
                        onChange={(e) => handleEmailChange(index, 'subject_template', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Re: Your recent inquiry about..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Send Delay (hours)
                      </label>
                      <div className="relative">
                        <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={email.send_delay_hours}
                          onChange={(e) => handleEmailChange(index, 'send_delay_hours', parseInt(e.target.value) || 0)}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Body
                    </label>
                    <textarea
                      value={email.body_template}
                      onChange={(e) => handleEmailChange(index, 'body_template', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Hi {{name}},\n\nI hope this email finds you well..."
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={email.is_follow_up}
                        onChange={(e) => handleEmailChange(index, 'is_follow_up', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">This is a follow-up email</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
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
    </Layout>
  )
}
