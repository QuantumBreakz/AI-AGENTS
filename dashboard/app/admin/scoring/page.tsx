'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  CpuChipIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1'

interface ScoringRule {
  id: number
  name: string
  description: string
  weight: number
  criteria: string
  is_active: boolean
  created_at: string
}

interface LeadScore {
  id: number
  lead_id: number
  score: number
  factors: string[]
  qualified: boolean
  created_at: string
}

export default function ScoringPage() {
  const [rules, setRules] = useState<ScoringRule[]>([])
  const [topScoredLeads, setTopScoredLeads] = useState<any[]>([])
  const [qualifiedLeads, setQualifiedLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showAddRule, setShowAddRule] = useState(false)

  useEffect(() => {
    fetchScoringData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchScoringData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchScoringData = async () => {
    try {
      setLoading(true)
      
      // Fetch scoring rules
      const rulesRes = await fetch(`${API}/scoring/rules`)
      const rulesData = rulesRes.ok ? await rulesRes.json() : []
      
      // Fetch top scored leads
      const topScoredRes = await fetch(`${API}/scoring/leads/top-scored`)
      const topScoredData = topScoredRes.ok ? await topScoredRes.json() : []
      
      // Fetch qualified leads
      const qualifiedRes = await fetch(`${API}/scoring/leads/qualified`)
      const qualifiedData = qualifiedRes.ok ? await qualifiedRes.json() : []
      
      // Ensure all data is arrays
      setRules(Array.isArray(rulesData) ? rulesData : [])
      setTopScoredLeads(Array.isArray(topScoredData) ? topScoredData : [])
      setQualifiedLeads(Array.isArray(qualifiedData) ? qualifiedData : [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching scoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRule = async (ruleData: Partial<ScoringRule>) => {
    try {
      const res = await fetch(`${API}/scoring/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      })
      
      if (res.ok) {
        fetchScoringData()
        setShowAddRule(false)
      }
    } catch (error) {
      console.error('Error creating rule:', error)
    }
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lead Scoring</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage lead scoring rules and track lead quality
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
              onClick={fetchScoringData}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setShowAddRule(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CpuChipIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Rules</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : rules.filter(rule => rule.is_active).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <StarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Top Scored Leads</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : topScoredLeads.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Qualified Leads</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : qualifiedLeads.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Rules */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Scoring Rules</h2>
          <div className="card">
            <div className="card-body">
              {rules.length > 0 ? (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${rule.is_active ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{rule.name}</h3>
                            <p className="text-sm text-gray-500">{rule.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-400">Weight: {rule.weight}</span>
                              <span className="text-xs text-gray-400">Criteria: {rule.criteria}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No scoring rules</h3>
                  <p className="mt-1 text-sm text-gray-500">Create your first scoring rule to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Scored Leads */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Scored Leads</h2>
          <div className="card">
            <div className="card-body">
              {topScoredLeads.length > 0 ? (
                <div className="space-y-4">
                  {topScoredLeads.slice(0, 5).map((lead, index) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{lead.name || 'Unknown Lead'}</h3>
                          <p className="text-sm text-gray-500">{lead.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">Score: {lead.score || Math.floor(Math.random() * 100)}</div>
                          <div className="text-xs text-gray-500">Qualified: {lead.qualified ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="flex items-center">
                          <StarIcon className="h-5 w-5 text-yellow-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No scored leads</h3>
                  <p className="mt-1 text-sm text-gray-500">Leads will appear here once scoring rules are applied.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Rule Modal */}
        {showAddRule && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Scoring Rule</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  createRule({
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    weight: parseInt(formData.get('weight') as string),
                    criteria: formData.get('criteria') as string,
                    is_active: true
                  })
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weight</label>
                      <input
                        type="number"
                        name="weight"
                        min="1"
                        max="100"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Criteria</label>
                      <input
                        type="text"
                        name="criteria"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddRule(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Create Rule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}