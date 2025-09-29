'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import { 
  PhoneIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface CallTarget {
  email: string
  phone: string
  lead_id?: number
  context?: { [key: string]: any }
}

interface CallFormData {
  targets: CallTarget[]
  campaign_offer: string
  purpose: string
}

export default function NewCallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CallFormData>({
    targets: [
      {
        email: '',
        phone: '',
        lead_id: undefined,
        context: {}
      }
    ],
    campaign_offer: '',
    purpose: 'sales'
  })

  const handleTargetChange = (index: number, field: keyof CallTarget, value: string | number | { [key: string]: any }) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.map((target, i) => 
        i === index ? { ...target, [field]: value } : target
      )
    }))
  }

  const addTarget = () => {
    setFormData(prev => ({
      ...prev,
      targets: [
        ...prev.targets,
        {
          email: '',
          phone: '',
          lead_id: undefined,
          context: {}
        }
      ]
    }))
  }

  const removeTarget = (index: number) => {
    if (formData.targets.length > 1) {
      setFormData(prev => ({
        ...prev,
        targets: prev.targets.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API}/calls/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to start calls')
      }

      const result = await response.json()
      console.log('Calls started:', result)
      router.push('/admin/calls')
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
            <h1 className="text-2xl font-bold text-gray-900">Start New Calls</h1>
            <p className="mt-1 text-sm text-gray-500">
              Initiate AI calling campaigns to your prospects
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Campaign Settings */}
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Campaign Settings</h3>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Offer/Message
                </label>
                <textarea
                  value={formData.campaign_offer}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaign_offer: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what you're offering or the message you want to convey..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Purpose
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="sales">Sales Call</option>
                  <option value="job_application">Job Application</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="appointment">Appointment Setting</option>
                </select>
              </div>
            </div>
          </div>

          {/* Call Targets */}
          <div className="card mb-8">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Call Targets</h3>
                <button
                  type="button"
                  onClick={addTarget}
                  className="btn-primary text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Target
                </button>
              </div>
            </div>
            <div className="card-body space-y-6">
              {formData.targets.map((target, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Target {index + 1}
                    </h4>
                    {formData.targets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTarget(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={target.email}
                          onChange={(e) => handleTargetChange(index, 'email', e.target.value)}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={target.phone}
                          onChange={(e) => handleTargetChange(index, 'phone', e.target.value)}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Context (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(target.context, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          handleTargetChange(index, 'context', parsed)
                        } catch {
                          // Invalid JSON, ignore for now
                        }
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder='{"name": "John Doe", "company": "Acme Corp", "role": "CEO"}'
                    />
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
              {loading ? 'Starting Calls...' : 'Start Calls'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
