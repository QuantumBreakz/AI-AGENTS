'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  CogIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  GlobeAltIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const AGENT2_API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'
const AGENT3_API = (process.env.NEXT_PUBLIC_AGENT3_API_URL as string) || 'http://localhost:8002/api/v1'

interface SettingsData {
  business: {
    company_name: string
    industry: string
    company_phone: string
    services_offered: string
    greeting_script: string
  }
  email: {
    smtp_host: string
    smtp_port: number
    smtp_username: string
    smtp_password: string
    from_email: string
    from_name: string
  }
  calling: {
    twilio_account_sid: string
    twilio_auth_token: string
    twilio_from_number: string
    public_base_url: string
    max_concurrent_calls: number
    call_timeout: number
  }
  notifications: {
    email_notifications: boolean
    sms_notifications: boolean
    webhook_url: string
    notification_events: string[]
  }
  integrations: {
    crm_integration: string
    crm_api_key: string
    calendar_integration: string
    calendar_api_key: string
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    business: {
      company_name: '',
      industry: '',
      company_phone: '',
      services_offered: '',
      greeting_script: ''
    },
    email: {
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      from_email: '',
      from_name: ''
    },
    calling: {
      twilio_account_sid: '',
      twilio_auth_token: '',
      twilio_from_number: '',
      public_base_url: '',
      max_concurrent_calls: 5,
      call_timeout: 300
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      webhook_url: '',
      notification_events: ['call_completed', 'lead_created', 'campaign_sent']
    },
    integrations: {
      crm_integration: '',
      crm_api_key: '',
      calendar_integration: '',
      calendar_api_key: ''
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('business')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // Fetch business profile from Agent-3
      const businessRes = await fetch(`${AGENT3_API}/business/profile`)
      if (businessRes.ok) {
        const businessData = await businessRes.json()
        setSettings(prev => ({
          ...prev,
          business: {
            company_name: businessData.company_name || '',
            industry: businessData.industry || '',
            company_phone: businessData.company_phone || '',
            services_offered: businessData.services_offered || '',
            greeting_script: businessData.greeting_script || ''
          }
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Save business profile
      const businessRes = await fetch(`${AGENT3_API}/business/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings.business),
      })

      if (!businessRes.ok) {
        throw new Error('Failed to save business settings')
      }

      setSuccess('Settings saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (section: keyof SettingsData, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const tabs = [
    { id: 'business', name: 'Business', icon: UserGroupIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'calling', name: 'Calling', icon: PhoneIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'integrations', name: 'Integrations', icon: GlobeAltIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading settings...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure your system settings and integrations
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
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
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left`}
                >
                  <tab.icon
                    className={`${
                      activeTab === tab.id ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-5 w-5`}
                  />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {activeTab === 'business' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
                </div>
                <div className="card-body space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={settings.business.company_name}
                      onChange={(e) => handleInputChange('business', 'company_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={settings.business.industry}
                      onChange={(e) => handleInputChange('business', 'industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Phone
                    </label>
                    <input
                      type="tel"
                      value={settings.business.company_phone}
                      onChange={(e) => handleInputChange('business', 'company_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Services Offered
                    </label>
                    <textarea
                      value={settings.business.services_offered}
                      onChange={(e) => handleInputChange('business', 'services_offered', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Greeting Script
                    </label>
                    <textarea
                      value={settings.business.greeting_script}
                      onChange={(e) => handleInputChange('business', 'greeting_script', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter the greeting script for AI calls..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
                </div>
                <div className="card-body space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={settings.email.smtp_host}
                        onChange={(e) => handleInputChange('email', 'smtp_host', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={settings.email.smtp_port}
                        onChange={(e) => handleInputChange('email', 'smtp_port', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Username
                      </label>
                      <input
                        type="text"
                        value={settings.email.smtp_username}
                        onChange={(e) => handleInputChange('email', 'smtp_username', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Password
                      </label>
                      <input
                        type="password"
                        value={settings.email.smtp_password}
                        onChange={(e) => handleInputChange('email', 'smtp_password', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Email
                      </label>
                      <input
                        type="email"
                        value={settings.email.from_email}
                        onChange={(e) => handleInputChange('email', 'from_email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Name
                      </label>
                      <input
                        type="text"
                        value={settings.email.from_name}
                        onChange={(e) => handleInputChange('email', 'from_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calling' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Calling Settings</h3>
                </div>
                <div className="card-body space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twilio Account SID
                      </label>
                      <input
                        type="text"
                        value={settings.calling.twilio_account_sid}
                        onChange={(e) => handleInputChange('calling', 'twilio_account_sid', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twilio Auth Token
                      </label>
                      <input
                        type="password"
                        value={settings.calling.twilio_auth_token}
                        onChange={(e) => handleInputChange('calling', 'twilio_auth_token', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twilio From Number
                      </label>
                      <input
                        type="tel"
                        value={settings.calling.twilio_from_number}
                        onChange={(e) => handleInputChange('calling', 'twilio_from_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Public Base URL
                      </label>
                      <input
                        type="url"
                        value={settings.calling.public_base_url}
                        onChange={(e) => handleInputChange('calling', 'public_base_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Concurrent Calls
                      </label>
                      <input
                        type="number"
                        value={settings.calling.max_concurrent_calls}
                        onChange={(e) => handleInputChange('calling', 'max_concurrent_calls', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Call Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        value={settings.calling.call_timeout}
                        onChange={(e) => handleInputChange('calling', 'call_timeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add other tabs as needed */}
            {activeTab === 'notifications' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-500">Notification settings coming soon...</p>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Integration Settings</h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-500">Integration settings coming soon...</p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-500">Security settings coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
