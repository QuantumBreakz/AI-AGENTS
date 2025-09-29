'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  BuildingOfficeIcon, 
  PhoneIcon,
  CogIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/date'

const API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface BusinessProfile {
  id: number
  industry: string
  company_name: string | null
  company_phone: string | null
  services_offered: string | null
  greeting_script: string | null
  created_at: string | null
  updated_at: string | null
}

export default function BusinessPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/business/profile`)
      if (!res.ok) throw new Error('Failed to load business profile')
      const data = await res.json()
      setProfile(data)
      setFormData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/business/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to save business profile')
      const data = await res.json()
      setProfile(data)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile || {})
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof BusinessProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading business profile...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure your business information for AI calling campaigns
            </p>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={fetchProfile}
                  disabled={loading}
                  className="btn-secondary"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Company Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.company_name || ''}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  value={formData.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Phone
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.company_phone || ''}
                    onChange={(e) => handleInputChange('company_phone', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services Offered
                </label>
                <textarea
                  value={formData.services_offered || ''}
                  onChange={(e) => handleInputChange('services_offered', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Describe the services your company offers..."
                />
              </div>
            </div>
          </div>

          {/* AI Scripts */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">AI Calling Scripts</h3>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Greeting Script
                </label>
                <textarea
                  value={formData.greeting_script || ''}
                  onChange={(e) => handleInputChange('greeting_script', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Hello, this is [Name] from [Company]. I'm calling to..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        {profile && (
          <div className="mt-8 card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(profile.created_at)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(profile.updated_at)}
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