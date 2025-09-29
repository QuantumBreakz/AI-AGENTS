'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  SaveIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface BusinessProfile {
  id: number
  company_name: string
  industry: string
  company_phone: string
  company_email: string
  website: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  services_offered: string
  target_market: string
  company_size: string
  founded_year: number
  description: string
  greeting_script: string
  call_script: string
  voicemail_script: string
  email_signature: string
  social_media: {
    linkedin: string
    twitter: string
    facebook: string
  }
  created_at: string
  updated_at: string
}

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API}/business/profile`)
      if (!response.ok) throw new Error('Failed to load profile')
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!profile) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`${API}/business/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      setSuccess('Profile updated successfully!')
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof BusinessProfile, value: string | number) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSocialMediaChange = (platform: keyof BusinessProfile['social_media'], value: string) => {
    setProfile(prev => prev ? {
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    } : null)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading profile...</div>
        </div>
      </Layout>
    )
  }

  if (error && !profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error: {error}</div>
        </div>
      </Layout>
    )
  }

  if (!profile) return null

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your business information for AI calling campaigns
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary"
                >
                  <SaveIcon className="h-5 w-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="btn-primary"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">{success}</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
                    value={profile.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    disabled={!editing}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={profile.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    value={profile.company_size}
                    onChange={(e) => handleInputChange('company_size', e.target.value)}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Founded Year
                </label>
                <input
                  type="number"
                  value={profile.founded_year}
                  onChange={(e) => handleInputChange('founded_year', parseInt(e.target.value))}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  min="1800"
                  max="2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={profile.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!editing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Brief description of your company..."
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Phone
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profile.company_phone}
                    onChange={(e) => handleInputChange('company_phone', e.target.value)}
                    disabled={!editing}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={profile.company_email}
                    onChange={(e) => handleInputChange('company_email', e.target.value)}
                    disabled={!editing}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <div className="relative">
                  <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!editing}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!editing}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={profile.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="mt-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Business Details</h3>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services Offered
                </label>
                <textarea
                  value={profile.services_offered}
                  onChange={(e) => handleInputChange('services_offered', e.target.value)}
                  disabled={!editing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Describe the services your company offers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Market
                </label>
                <textarea
                  value={profile.target_market}
                  onChange={(e) => handleInputChange('target_market', e.target.value)}
                  disabled={!editing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Describe your target market..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Scripts */}
        <div className="mt-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">AI Calling Scripts</h3>
          </div>
          <div className="card-body space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greeting Script
              </label>
              <textarea
                value={profile.greeting_script}
                onChange={(e) => handleInputChange('greeting_script', e.target.value)}
                disabled={!editing}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Hello, this is [Name] from [Company]. I'm calling to..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Call Script
              </label>
              <textarea
                value={profile.call_script}
                onChange={(e) => handleInputChange('call_script', e.target.value)}
                disabled={!editing}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                placeholder="The main script for your AI calls..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voicemail Script
              </label>
              <textarea
                value={profile.voicemail_script}
                onChange={(e) => handleInputChange('voicemail_script', e.target.value)}
                disabled={!editing}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Script for leaving voicemails..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Signature
              </label>
              <textarea
                value={profile.email_signature}
                onChange={(e) => handleInputChange('email_signature', e.target.value)}
                disabled={!editing}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Your email signature..."
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="mt-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Social Media</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={profile.social_media.linkedin}
                  onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  value={profile.social_media.twitter}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="https://twitter.com/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  value={profile.social_media.facebook}
                  onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="https://facebook.com/yourcompany"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
