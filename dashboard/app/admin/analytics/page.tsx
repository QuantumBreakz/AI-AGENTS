'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  ChartBarIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1'

interface AnalyticsData {
  totalLeads: number
  totalCampaigns: number
  totalCalls: number
  conversionRate: number
  openRate: number
  clickRate: number
  responseRate: number
  leadsGrowth: number
  campaignsGrowth: number
  callsGrowth: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalLeads: 0,
    totalCampaigns: 0,
    totalCalls: 0,
    conversionRate: 0,
    openRate: 0,
    clickRate: 0,
    responseRate: 0,
    leadsGrowth: 0,
    campaignsGrowth: 0,
    callsGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchAnalytics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchAnalytics()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch analytics data from Agent-2
      const [leadsRes, campaignsRes, analyticsRes] = await Promise.all([
        fetch(`${API}/leads/`),
        fetch(`${API}/campaigns/`),
        fetch(`${API}/analytics/overall`)
      ])
      
      const leads = leadsRes.ok ? await leadsRes.json() : []
      const campaigns = campaignsRes.ok ? await campaignsRes.json() : []
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : {}
      
      // Calculate metrics
      const totalLeads = leads.length
      const totalCampaigns = campaigns.length
      const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length
      
      // Mock some additional metrics for demo
      const conversionRate = Math.round(Math.random() * 30 + 10)
      const openRate = Math.round(Math.random() * 40 + 20)
      const clickRate = Math.round(Math.random() * 10 + 2)
      const responseRate = Math.round(Math.random() * 25 + 5)
      
      setAnalytics({
        totalLeads,
        totalCampaigns,
        totalCalls: Math.floor(totalLeads * 0.3), // Mock calls data
        conversionRate,
        openRate,
        clickRate,
        responseRate,
        leadsGrowth: Math.round(Math.random() * 20 - 5),
        campaignsGrowth: Math.round(Math.random() * 15 - 3),
        callsGrowth: Math.round(Math.random() * 25 - 8)
      })
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive analytics and performance metrics
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
              onClick={fetchAnalytics}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : analytics.totalLeads.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center text-sm ${analytics.leadsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.leadsGrowth >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(analytics.leadsGrowth)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <EnvelopeIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : analytics.totalCampaigns}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center text-sm ${analytics.campaignsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.campaignsGrowth >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(analytics.campaignsGrowth)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <PhoneIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Calls</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : analytics.totalCalls}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center text-sm ${analytics.callsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.callsGrowth >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(analytics.callsGrowth)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CursorArrowRaysIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : `${analytics.conversionRate}%`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-orange-600">
                    <EyeIcon className="h-4 w-4 inline mr-1" />
                    {analytics.openRate}% open
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Open Rate</span>
                  <span className="text-sm font-medium text-gray-900">{analytics.openRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Click Rate</span>
                  <span className="text-sm font-medium text-gray-900">{analytics.clickRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="text-sm font-medium text-gray-900">{analytics.responseRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Quality</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">High Quality</span>
                  <span className="text-sm font-medium text-gray-900">68%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Medium Quality</span>
                  <span className="text-sm font-medium text-gray-900">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Low Quality</span>
                  <span className="text-sm font-medium text-gray-900">7%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Health</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Campaigns</span>
                  <span className="text-sm font-medium text-gray-900">{Math.floor(analytics.totalCampaigns * 0.7)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paused Campaigns</span>
                  <span className="text-sm font-medium text-gray-900">{Math.floor(analytics.totalCampaigns * 0.2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-medium text-gray-900">{Math.floor(analytics.totalCampaigns * 0.1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}