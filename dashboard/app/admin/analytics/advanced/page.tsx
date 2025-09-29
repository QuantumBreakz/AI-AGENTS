'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface CampaignPerformance {
  campaign_id: number
  name: string
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  open_rate: number
  click_rate: number
  conversion_rate: number
  revenue: number
}

interface OverallAnalytics {
  total_leads: number
  total_campaigns: number
  total_emails_sent: number
  total_revenue: number
  conversion_rate: number
  lead_growth_rate: number
  campaign_performance: CampaignPerformance[]
}

interface LeadPerformance {
  lead_id: number
  name: string
  email: string
  company: string
  source: string
  score: number
  qualified: boolean
  last_activity: string
  engagement_score: number
}

export default function AdvancedAnalyticsPage() {
  const [overallData, setOverallData] = useState<OverallAnalytics | null>(null)
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([])
  const [leadPerformance, setLeadPerformance] = useState<LeadPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30')
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange, selectedCampaign])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      const [overallRes, campaignsRes, leadsRes] = await Promise.all([
        fetch(`${API}/analytics/overall`),
        fetch(`${API}/analytics/campaigns/overview`),
        fetch(`${API}/analytics/leads/performance`)
      ])

      const [overall, campaigns, leads] = await Promise.all([
        overallRes.ok ? overallRes.json() : null,
        campaignsRes.ok ? campaignsRes.json() : [],
        leadsRes.ok ? leadsRes.json() : []
      ])

      setOverallData(overall)
      setCampaignPerformance(campaigns)
      setLeadPerformance(leads)

      // If a specific campaign is selected, fetch its detailed performance
      if (selectedCampaign) {
        const campaignRes = await fetch(`${API}/analytics/campaigns/${selectedCampaign}/performance`)
        if (campaignRes.ok) {
          const campaignData = await campaignRes.json()
          setCampaignPerformance([campaignData])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600'
    if (rate >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 20) return 'badge-success'
    if (rate >= 10) return 'badge-warning'
    return 'badge-danger'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading analytics...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Detailed performance metrics and insights
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overall Metrics */}
        {overallData && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                      <dd className="text-lg font-medium text-gray-900">{overallData.total_leads}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Emails Sent</dt>
                      <dd className="text-lg font-medium text-gray-900">{overallData.total_emails_sent}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUpIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                      <dd className="text-lg font-medium text-gray-900">{overallData.conversion_rate}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">${overallData.total_revenue}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Campaign Performance */}
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
                <select
                  value={selectedCampaign || ''}
                  onChange={(e) => setSelectedCampaign(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Campaigns</option>
                  {campaignPerformance.map((campaign) => (
                    <option key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {campaignPerformance.map((campaign) => (
                  <div key={campaign.campaign_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-md font-medium text-gray-900">{campaign.name}</h4>
                      <span className={`badge ${getPerformanceBadge(campaign.conversion_rate)}`}>
                        {campaign.conversion_rate}% conversion
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-500">Emails Sent</div>
                        <div className="text-lg font-semibold">{campaign.emails_sent}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Open Rate</div>
                        <div className={`text-lg font-semibold ${getPerformanceColor(campaign.open_rate)}`}>
                          {campaign.open_rate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Click Rate</div>
                        <div className={`text-lg font-semibold ${getPerformanceColor(campaign.click_rate)}`}>
                          {campaign.click_rate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Revenue</div>
                        <div className="text-lg font-semibold">${campaign.revenue}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {campaignPerformance.length === 0 && (
                  <div className="text-center py-8">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No campaign data</h3>
                    <p className="mt-1 text-sm text-gray-500">Campaign performance data will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lead Performance */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Lead Performance</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {leadPerformance.slice(0, 5).map((lead) => (
                  <div key={lead.lead_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">{lead.name}</h4>
                        <p className="text-sm text-gray-600">{lead.email}</p>
                        <p className="text-sm text-gray-500">{lead.company}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getPerformanceColor(lead.score)}`}>
                          {lead.score}
                        </div>
                        <div className="text-sm text-gray-500">Score</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Source: {lead.source}</span>
                        <span className={`badge ${lead.qualified ? 'badge-success' : 'badge-warning'}`}>
                          {lead.qualified ? 'Qualified' : 'Unqualified'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Engagement: {lead.engagement_score}%
                      </div>
                    </div>
                  </div>
                ))}
                {leadPerformance.length === 0 && (
                  <div className="text-center py-8">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No lead data</h3>
                    <p className="mt-1 text-sm text-gray-500">Lead performance data will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Lead Performance Table */}
        <div className="mt-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">All Lead Performance</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leadPerformance.map((lead) => (
                    <tr key={lead.lead_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-bold ${getPerformanceColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${lead.engagement_score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{lead.engagement_score}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${lead.qualified ? 'badge-success' : 'badge-warning'}`}>
                          {lead.qualified ? 'Qualified' : 'Unqualified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.last_activity), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
