'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  LightBulbIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface AISuggestion {
  id: string
  type: 'email_template' | 'subject_line' | 'follow_up' | 'personalization' | 'campaign_optimization'
  title: string
  description: string
  content: string
  confidence: number
  created_at: string
  applied: boolean
  feedback: 'positive' | 'negative' | null
}

interface SuggestRequest {
  context: string
  type: string
  data: any
}

export default function AIPage() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [selectedType, setSelectedType] = useState('email_template')
  const [context, setContext] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      // This would typically fetch from an AI suggestions API endpoint
      // For now, we'll use mock data
      const mockSuggestions: AISuggestion[] = [
        {
          id: 'sug_1',
          type: 'email_template',
          title: 'Follow-up Email Template',
          description: 'Personalized follow-up email for leads who haven\'t responded',
          content: 'Hi {{name}},\n\nI wanted to follow up on my previous email about {{offer}}. I understand you\'re busy, but I believe this could be valuable for {{company}}.\n\nWould you be available for a brief 15-minute call this week?\n\nBest regards,\n{{sender_name}}',
          confidence: 85,
          created_at: '2024-01-20T10:30:00Z',
          applied: false,
          feedback: null
        },
        {
          id: 'sug_2',
          type: 'subject_line',
          title: 'High-Converting Subject Line',
          description: 'Subject line optimized for open rates based on your industry',
          content: 'Quick question about {{company}}\'s {{pain_point}}',
          confidence: 92,
          created_at: '2024-01-20T11:15:00Z',
          applied: true,
          feedback: 'positive'
        },
        {
          id: 'sug_3',
          type: 'personalization',
          title: 'Lead Personalization',
          description: 'Personalized approach based on lead\'s LinkedIn activity',
          content: 'I noticed you recently posted about {{topic}} on LinkedIn. Our solution could help with {{related_benefit}}.',
          confidence: 78,
          created_at: '2024-01-20T12:00:00Z',
          applied: false,
          feedback: null
        },
        {
          id: 'sug_4',
          type: 'campaign_optimization',
          title: 'Campaign Timing Optimization',
          description: 'Optimal send times for your target audience',
          content: 'Based on your audience data, sending emails on Tuesday-Thursday between 10-11 AM and 2-3 PM will increase open rates by 23%.',
          confidence: 88,
          created_at: '2024-01-20T13:45:00Z',
          applied: false,
          feedback: null
        }
      ]
      setSuggestions(mockSuggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateSuggestion = async () => {
    if (!context.trim()) return

    try {
      setSuggesting(true)
      const request: SuggestRequest = {
        context,
        type: selectedType,
        data: {}
      }

      const response = await fetch(`${API}/ai/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to generate suggestion')
      }

      const result = await response.json()
      console.log('AI suggestion generated:', result)
      setContext('')
      fetchSuggestions() // Refresh suggestions
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSuggesting(false)
    }
  }

  const applySuggestion = async (suggestionId: string) => {
    try {
      // This would call an API to apply the suggestion
      console.log('Applying suggestion:', suggestionId)
      setSuggestions(prev => prev.map(s => 
        s.id === suggestionId ? { ...s, applied: true } : s
      ))
    } catch (err) {
      console.error('Failed to apply suggestion:', err)
    }
  }

  const provideFeedback = async (suggestionId: string, feedback: 'positive' | 'negative') => {
    try {
      // This would call an API to provide feedback
      console.log('Providing feedback:', suggestionId, feedback)
      setSuggestions(prev => prev.map(s => 
        s.id === suggestionId ? { ...s, feedback } : s
      ))
    } catch (err) {
      console.error('Failed to provide feedback:', err)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email_template':
        return <EnvelopeIcon className="h-5 w-5" />
      case 'subject_line':
        return <DocumentTextIcon className="h-5 w-5" />
      case 'follow_up':
        return <ChatBubbleLeftRightIcon className="h-5 w-5" />
      case 'personalization':
        return <UserGroupIcon className="h-5 w-5" />
      case 'campaign_optimization':
        return <SparklesIcon className="h-5 w-5" />
      default:
        return <LightBulbIcon className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email_template':
        return 'text-blue-600'
      case 'subject_line':
        return 'text-green-600'
      case 'follow_up':
        return 'text-purple-600'
      case 'personalization':
        return 'text-orange-600'
      case 'campaign_optimization':
        return 'text-pink-600'
      default:
        return 'text-gray-600'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesType = filterType === 'all' || suggestion.type === filterType
    const matchesSearch = !searchTerm || 
      suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesSearch
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading AI suggestions...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">AI Suggestions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Get AI-powered recommendations to improve your campaigns
            </p>
          </div>
        </div>

        {/* Generate New Suggestion */}
        <div className="mb-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Generate AI Suggestion</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestion Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="email_template">Email Template</option>
                  <option value="subject_line">Subject Line</option>
                  <option value="follow_up">Follow-up Strategy</option>
                  <option value="personalization">Personalization</option>
                  <option value="campaign_optimization">Campaign Optimization</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what you need help with... (e.g., 'I need a follow-up email for leads who didn't respond to my initial outreach')"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={generateSuggestion}
                  disabled={suggesting || !context.trim()}
                  className="btn-primary"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  {suggesting ? 'Generating...' : 'Generate Suggestion'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search suggestions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="email_template">Email Template</option>
              <option value="subject_line">Subject Line</option>
              <option value="follow_up">Follow-up</option>
              <option value="personalization">Personalization</option>
              <option value="campaign_optimization">Campaign Optimization</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <LightBulbIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Suggestions</dt>
                    <dd className="text-lg font-medium text-gray-900">{suggestions.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Applied</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {suggestions.filter(s => s.applied).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">High Confidence</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {suggestions.filter(s => s.confidence >= 80).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">With Feedback</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {suggestions.filter(s => s.feedback).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 mr-3 ${getTypeColor(suggestion.type)}`}>
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{suggestion.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      <div className="flex items-center mt-2">
                        <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}% confidence
                        </span>
                        {suggestion.applied && (
                          <span className="ml-3 badge-success">Applied</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{suggestion.content}</pre>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {!suggestion.applied && (
                      <button
                        onClick={() => applySuggestion(suggestion.id)}
                        className="btn-primary text-sm"
                      >
                        Apply Suggestion
                      </button>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Was this helpful?</span>
                      <button
                        onClick={() => provideFeedback(suggestion.id, 'positive')}
                        className={`p-1 rounded ${suggestion.feedback === 'positive' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => provideFeedback(suggestion.id, 'negative')}
                        className={`p-1 rounded ${suggestion.feedback === 'negative' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSuggestions.length === 0 && (
          <div className="mt-8 text-center">
            <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suggestions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search criteria.'
                : 'Generate your first AI suggestion to get started.'
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
