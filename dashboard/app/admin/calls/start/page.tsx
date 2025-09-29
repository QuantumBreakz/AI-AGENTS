'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import { 
  PhoneIcon,
  PlayIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface CallTarget {
  email: string
  phone: string
  lead_id?: number
  context?: { [key: string]: any }
}

interface StartCallsRequest {
  targets: CallTarget[]
  campaign_offer: string
  purpose: string
  max_concurrent_calls: number
  call_timeout: number
}

interface StartSalesCallsRequest {
  targets: CallTarget[]
  sales_script: string
  product_info: string
  pricing: string
  objections: string[]
  follow_up_actions: string[]
}

interface StartJobCallsRequest {
  targets: CallTarget[]
  job_title: string
  company: string
  requirements: string[]
  benefits: string[]
  application_process: string
}

export default function StartCallsPage() {
  const router = useRouter()
  const [callType, setCallType] = useState<'general' | 'sales' | 'jobs'>('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [targets, setTargets] = useState<CallTarget[]>([
    {
      email: '',
      phone: '',
      lead_id: undefined,
      context: {}
    }
  ])

  // General call settings
  const [generalSettings, setGeneralSettings] = useState({
    campaign_offer: '',
    purpose: 'sales',
    max_concurrent_calls: 5,
    call_timeout: 300
  })

  // Sales call settings
  const [salesSettings, setSalesSettings] = useState({
    sales_script: '',
    product_info: '',
    pricing: '',
    objections: ['Not interested', 'Too expensive', 'Need to think about it'],
    follow_up_actions: ['Send email', 'Schedule meeting', 'Send proposal']
  })

  // Job call settings
  const [jobSettings, setJobSettings] = useState({
    job_title: '',
    company: '',
    requirements: ['5+ years experience', 'Python/JavaScript', 'AWS'],
    benefits: ['Health insurance', '401k', 'Remote work'],
    application_process: 'Submit resume and cover letter'
  })

  const handleTargetChange = (index: number, field: keyof CallTarget, value: string | number | { [key: string]: any }) => {
    setTargets(prev => prev.map((target, i) => 
      i === index ? { ...target, [field]: value } : target
    ))
  }

  const addTarget = () => {
    setTargets(prev => [
      ...prev,
      {
        email: '',
        phone: '',
        lead_id: undefined,
        context: {}
      }
    ])
  }

  const removeTarget = (index: number) => {
    if (targets.length > 1) {
      setTargets(prev => prev.filter((_, i) => i !== index))
    }
  }

  const startGeneralCalls = async () => {
    try {
      setLoading(true)
      setError(null)

      const request: StartCallsRequest = {
        targets,
        campaign_offer: generalSettings.campaign_offer,
        purpose: generalSettings.purpose,
        max_concurrent_calls: generalSettings.max_concurrent_calls,
        call_timeout: generalSettings.call_timeout
      }

      const response = await fetch(`${API}/calls/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
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

  const startSalesCalls = async () => {
    try {
      setLoading(true)
      setError(null)

      const request: StartSalesCallsRequest = {
        targets,
        sales_script: salesSettings.sales_script,
        product_info: salesSettings.product_info,
        pricing: salesSettings.pricing,
        objections: salesSettings.objections,
        follow_up_actions: salesSettings.follow_up_actions
      }

      const response = await fetch(`${API}/calls/start-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to start sales calls')
      }

      const result = await response.json()
      console.log('Sales calls started:', result)
      router.push('/admin/calls')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const startJobCalls = async () => {
    try {
      setLoading(true)
      setError(null)

      const request: StartJobCallsRequest = {
        targets,
        job_title: jobSettings.job_title,
        company: jobSettings.company,
        requirements: jobSettings.requirements,
        benefits: jobSettings.benefits,
        application_process: jobSettings.application_process
      }

      const response = await fetch(`${API}/calls/start-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to start job calls')
      }

      const result = await response.json()
      console.log('Job calls started:', result)
      router.push('/admin/calls')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (callType === 'general') {
      startGeneralCalls()
    } else if (callType === 'sales') {
      startSalesCalls()
    } else if (callType === 'jobs') {
      startJobCalls()
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
            <h1 className="text-2xl font-bold text-gray-900">Start AI Calls</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure and start AI-powered calling campaigns
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Call Type Selection */}
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Call Type</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    callType === 'general'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCallType('general')}
                >
                  <div className="flex items-center">
                    <PhoneIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h4 className="text-md font-medium text-gray-900">General Calls</h4>
                      <p className="text-sm text-gray-600">General purpose calling campaigns</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    callType === 'sales'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCallType('sales')}
                >
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <h4 className="text-md font-medium text-gray-900">Sales Calls</h4>
                      <p className="text-sm text-gray-600">Sales-focused calling campaigns</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    callType === 'jobs'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCallType('jobs')}
                >
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <h4 className="text-md font-medium text-gray-900">Job Calls</h4>
                      <p className="text-sm text-gray-600">Job application calling campaigns</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General Call Settings */}
          {callType === 'general' && (
            <div className="card mb-8">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">General Call Settings</h3>
              </div>
              <div className="card-body space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Offer/Message
                  </label>
                  <textarea
                    value={generalSettings.campaign_offer}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, campaign_offer: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what you're offering or the message you want to convey..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Call Purpose
                    </label>
                    <select
                      value={generalSettings.purpose}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, purpose: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="sales">Sales Call</option>
                      <option value="follow_up">Follow-up</option>
                      <option value="appointment">Appointment Setting</option>
                      <option value="survey">Survey</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Concurrent Calls
                    </label>
                    <input
                      type="number"
                      value={generalSettings.max_concurrent_calls}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, max_concurrent_calls: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={generalSettings.call_timeout}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, call_timeout: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="60"
                    max="1800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sales Call Settings */}
          {callType === 'sales' && (
            <div className="card mb-8">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Sales Call Settings</h3>
              </div>
              <div className="card-body space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sales Script
                  </label>
                  <textarea
                    value={salesSettings.sales_script}
                    onChange={(e) => setSalesSettings(prev => ({ ...prev, sales_script: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your sales script..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Information
                    </label>
                    <textarea
                      value={salesSettings.product_info}
                      onChange={(e) => setSalesSettings(prev => ({ ...prev, product_info: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your product/service..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pricing Information
                    </label>
                    <textarea
                      value={salesSettings.pricing}
                      onChange={(e) => setSalesSettings(prev => ({ ...prev, pricing: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Pricing details..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Common Objections
                  </label>
                  <div className="space-y-2">
                    {salesSettings.objections.map((objection, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={objection}
                          onChange={(e) => {
                            const newObjections = [...salesSettings.objections]
                            newObjections[index] = e.target.value
                            setSalesSettings(prev => ({ ...prev, objections: newObjections }))
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newObjections = salesSettings.objections.filter((_, i) => i !== index)
                            setSalesSettings(prev => ({ ...prev, objections: newObjections }))
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSalesSettings(prev => ({ ...prev, objections: [...prev.objections, ''] }))}
                      className="btn-secondary text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Objection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Job Call Settings */}
          {callType === 'jobs' && (
            <div className="card mb-8">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Job Call Settings</h3>
              </div>
              <div className="card-body space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={jobSettings.job_title}
                      onChange={(e) => setJobSettings(prev => ({ ...prev, job_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Software Engineer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={jobSettings.company}
                      onChange={(e) => setJobSettings(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="TechCorp"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements
                  </label>
                  <div className="space-y-2">
                    {jobSettings.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={requirement}
                          onChange={(e) => {
                            const newRequirements = [...jobSettings.requirements]
                            newRequirements[index] = e.target.value
                            setJobSettings(prev => ({ ...prev, requirements: newRequirements }))
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newRequirements = jobSettings.requirements.filter((_, i) => i !== index)
                            setJobSettings(prev => ({ ...prev, requirements: newRequirements }))
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setJobSettings(prev => ({ ...prev, requirements: [...prev.requirements, ''] }))}
                      className="btn-secondary text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Requirement
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benefits
                  </label>
                  <div className="space-y-2">
                    {jobSettings.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => {
                            const newBenefits = [...jobSettings.benefits]
                            newBenefits[index] = e.target.value
                            setJobSettings(prev => ({ ...prev, benefits: newBenefits }))
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newBenefits = jobSettings.benefits.filter((_, i) => i !== index)
                            setJobSettings(prev => ({ ...prev, benefits: newBenefits }))
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setJobSettings(prev => ({ ...prev, benefits: [...prev.benefits, ''] }))}
                      className="btn-secondary text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Benefit
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Process
                  </label>
                  <textarea
                    value={jobSettings.application_process}
                    onChange={(e) => setJobSettings(prev => ({ ...prev, application_process: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the application process..."
                  />
                </div>
              </div>
            </div>
          )}

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
              {targets.map((target, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Target {index + 1}
                    </h4>
                    {targets.length > 1 && (
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
              <PlayIcon className="h-5 w-5 mr-2" />
              {loading ? 'Starting Calls...' : 'Start Calls'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
