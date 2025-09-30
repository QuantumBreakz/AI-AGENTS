'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from './components/Layout'
import { 
  UserGroupIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  ChartBarIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  
  
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { apiFetch } from './utils/api'

const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_PATH || 'admin'

interface DashboardStats {
  totalLeads: number
  activeCampaigns: number
  callsToday: number
  conversionRate: number
  newLeadsToday: number
  emailsSentToday: number
  callsCompleted: number
  responseRate: number
}

interface RecentActivity {
  id: string
  type: 'lead' | 'campaign' | 'call' | 'email'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export default function Page() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeCampaigns: 0,
    callsToday: 0,
    conversionRate: 0,
    newLeadsToday: 0,
    emailsSentToday: 0,
    callsCompleted: 0,
    responseRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchDashboardData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch data from both agents in parallel (real endpoints via apiFetch)
      const [analytics, leads, campaigns, calls] = await Promise.all([
        apiFetch('/analytics/overall', {}, 2),
        apiFetch('/leads/', {}, 2),
        apiFetch('/campaigns/', {}, 2),
        apiFetch('/calls', {}, 3)
      ])

      // Calculate today's calls
      const today = new Date().toDateString()
      const callsToday = calls.filter((call: any) => 
        new Date(call.created_at).toDateString() === today
      ).length

      // Conversion rate from analytics if available, else compute from calls
      const completedCalls = calls.filter((call: any) => call.status === 'completed').length
      const conversionRate = analytics?.summary?.overall_reply_rate ?? (calls.length > 0 ? Math.round((completedCalls / calls.length) * 100) : 0)

      // Calculate additional metrics
      const newLeadsToday = leads.filter((lead: any) => 
        new Date(lead.created_at).toDateString() === today
      ).length
      
      const emailsSentToday = analytics?.summary?.total_emails_sent ?? 0
      
      const callsCompleted = calls.filter((call: any) => call.status === 'completed').length
      const responseRate = typeof analytics?.summary?.overall_reply_rate === 'number' ? analytics.summary.overall_reply_rate : 0

      setStats({
        totalLeads: leads.length,
        activeCampaigns: campaigns.filter((c: any) => c.status === 'active').length,
        callsToday,
        conversionRate,
        newLeadsToday,
        emailsSentToday,
        callsCompleted,
        responseRate
      })
      
      // Generate recent activity
      const activities: RecentActivity[] = []
      
      // Add recent leads
      leads.slice(0, 3).forEach((lead: any) => {
        activities.push({
          id: `lead-${lead.id}`,
          type: 'lead',
          title: `New Lead: ${lead.name || 'Unknown'}`,
          description: `Added from ${lead.source || 'Unknown source'}`,
          timestamp: lead.created_at,
          status: 'success'
        })
      })
      
      // Add recent campaigns
      campaigns.slice(0, 2).forEach((campaign: any) => {
        activities.push({
          id: `campaign-${campaign.id}`,
          type: 'campaign',
          title: `Campaign: ${campaign.name}`,
          description: `Status: ${campaign.status}`,
          timestamp: campaign.created_at,
          status: campaign.status === 'active' ? 'success' : 'info'
        })
      })
      
      // Add recent calls
      calls.slice(0, 2).forEach((call: any) => {
        activities.push({
          id: `call-${call.id}`,
          type: 'call',
          title: `Call to ${call.phone || 'Unknown'}`,
          description: `Status: ${call.status}`,
          timestamp: call.created_at,
          status: call.status === 'completed' ? 'success' : call.status === 'failed' ? 'error' : 'warning'
        })
      })
      
      // Sort by timestamp and take latest 5
      setRecentActivity(activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
      )
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startQuickAction = async (action: string) => {
    try {
      setLoading(true)
      
      switch (action) {
        case 'scrape_leads':
          const resultScrape = await apiFetch(`/leads/scrape?company_size=10-50&role=CEO&industry=Technology&limit=50`, { method: 'POST' }, 2)
          alert(`Lead scraping completed! Found ${resultScrape.length} new leads.`)
          fetchDashboardData()
          break
          
        case 'start_campaign':
          const resultCamp = await apiFetch(`/campaigns/`, {
            method: 'POST',
            body: JSON.stringify({
              name: 'Quick Campaign',
              offer: 'Quick Outreach',
              status: 'active',
              emails: [
                { subject_template: 'Quick Outreach', body_template: 'Hello! I wanted to reach out...', send_delay_hours: 0, is_follow_up: false }
              ]
            })
          }, 2)
          alert(`Quick campaign created! Campaign ID: ${resultCamp.id}`)
          fetchDashboardData()
          break
          
        case 'start_calls':
          await apiFetch(`/calls/start`, {
            method: 'POST',
            body: JSON.stringify({
              targets: [{ phone: '+1234567890' }],
              campaign_offer: 'general'
            })
          }, 3)
          alert('AI calls started! Check the calls page for progress.')
          fetchDashboardData()
          break
          
        case 'orchestrate':
          const resultOrch = await apiFetch(`/orchestrate/one-click`, {
            method: 'POST',
            body: JSON.stringify({
              limit: 25,
              offer: 'AI-Powered Business Solutions',
              campaign_name: 'Quick Outreach Campaign',
              steps: 3,
              send_now: true,
              company_size: '10-50',
              role: 'CEO',
              industry: 'Technology'
            })
          }, 2)
          alert(`Full orchestration completed! Created ${resultOrch.leads?.length || 0} leads and ${resultOrch.recipients?.length || 0} campaign recipients.`)
          fetchDashboardData()
          break
      }
    } catch (error) {
      console.error('Error starting action:', error)
      alert('Failed to start action. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor your lead generation and calling campaigns
              {lastUpdated && (
                <span className="ml-2 text-xs text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-refresh
              </label>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Leads */}
          <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats.totalLeads.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 font-medium">+{stats.newLeadsToday} today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <EnvelopeIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats.activeCampaigns}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 font-medium">{stats.emailsSentToday} sent</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calls Today */}
          <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <PhoneIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Calls Today</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats.callsToday}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-600 font-medium">{stats.callsCompleted} completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : `${stats.conversionRate}%`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-orange-600 font-medium">{stats.responseRate}% response</p>
                </div>
              </div>
            </div>
          </div>
        </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={() => startQuickAction('scrape_leads')}
                  disabled={loading}
                  className="card hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <UserGroupIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Scrape Leads</h3>
                        <p className="text-sm text-gray-500">Start automated lead generation</p>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => startQuickAction('start_campaign')}
                  disabled={loading}
                  className="card hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <EnvelopeIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Quick Campaign</h3>
                        <p className="text-sm text-gray-500">Create and start email campaign</p>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => startQuickAction('start_calls')}
                  disabled={loading}
                  className="card hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <PhoneIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Start AI Calls</h3>
                        <p className="text-sm text-gray-500">Begin automated calling sequence</p>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => startQuickAction('orchestrate')}
                  disabled={loading}
                  className="card hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <SparklesIcon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Full Orchestration</h3>
                        <p className="text-sm text-gray-500">Run complete automation</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>


        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="card">
            <div className="card-body">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'success' ? 'bg-green-100' :
                        activity.status === 'warning' ? 'bg-yellow-100' :
                        activity.status === 'error' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}>
                        {activity.type === 'lead' && <UserGroupIcon className={`h-4 w-4 ${
                          activity.status === 'success' ? 'text-green-600' :
                          activity.status === 'warning' ? 'text-yellow-600' :
                          activity.status === 'error' ? 'text-red-600' :
                          'text-blue-600'
                        }`} />}
                        {activity.type === 'campaign' && <EnvelopeIcon className={`h-4 w-4 ${
                          activity.status === 'success' ? 'text-green-600' :
                          activity.status === 'warning' ? 'text-yellow-600' :
                          activity.status === 'error' ? 'text-red-600' :
                          'text-blue-600'
                        }`} />}
                        {activity.type === 'call' && <PhoneIcon className={`h-4 w-4 ${
                          activity.status === 'success' ? 'text-green-600' :
                          activity.status === 'warning' ? 'text-yellow-600' :
                          activity.status === 'error' ? 'text-red-600' :
                          'text-blue-600'
                        }`} />}
                        {activity.type === 'email' && <EnvelopeIcon className={`h-4 w-4 ${
                          activity.status === 'success' ? 'text-green-600' :
                          activity.status === 'warning' ? 'text-yellow-600' :
                          activity.status === 'error' ? 'text-red-600' :
                          'text-blue-600'
                        }`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">Activity will appear here as you use the system.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
