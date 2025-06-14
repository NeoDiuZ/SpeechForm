'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Calendar, User, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function FormResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [form, setForm] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  const loadFormAndResponses = useCallback(async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      
      setUser(session.user)

      // Load form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', session.user.id)
        .single()

      if (formError || !formData) {
        console.error('Error loading form:', formError)
        toast.error('Form not found')
        router.push('/dashboard')
        return
      }

      setForm(formData)

      // Load responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select('*')
        .eq('form_id', params.id)
        .order('submitted_at', { ascending: false })

      if (responsesError) {
        console.error('Error loading responses:', responsesError)
        toast.error('Failed to load responses')
      } else {
        setResponses(responsesData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [params.id, supabase, router])

  useEffect(() => {
    loadFormAndResponses()
  }, [loadFormAndResponses])

  const exportToCSV = () => {
    if (!responses.length) {
      toast.error('No responses to export')
      return
    }

    // Get all field IDs from the form
    const fieldIds = form.fields.map(field => field.id)
    const fieldLabels = form.fields.map(field => field.label)
    
    // Create CSV header
    const headers = ['Submitted At', ...fieldLabels]
    
    // Create CSV rows
    const rows = responses.map(response => {
      const row = [new Date(response.submitted_at).toLocaleString()]
      
      fieldIds.forEach(fieldId => {
        const value = response.response_data[fieldId] || ''
        // Escape commas and quotes in CSV
        const escapedValue = typeof value === 'string' 
          ? `"${value.replace(/"/g, '""')}"` 
          : value
        row.push(escapedValue)
      })
      
      return row
    })
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Responses exported successfully!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Form not found</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{form.title}</h1>
                <p className="text-sm text-gray-600">Form Responses</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {responses.length} response{responses.length !== 1 ? 's' : ''}
              </div>
              {responses.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {responses.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-600 mb-6">Share your form to start collecting responses</p>
            <div className="flex justify-center space-x-4">
              <Link
                href={`/form/${form.id}`}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Preview Form
              </Link>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/form/${form.id}`
                  navigator.clipboard.writeText(link)
                  toast.success('Form link copied to clipboard!')
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Copy Form Link
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response, index) => (
              <div key={response.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Response #{responses.length - index}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(response.submitted_at).toLocaleString()}
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {form.fields.map((field) => {
                    const value = response.response_data[field.id] || 'No response'
                    return (
                      <div key={field.id} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                        </label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {field.type === 'textarea' ? (
                            <div className="whitespace-pre-wrap">{value}</div>
                          ) : (
                            <div>{value}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {response.ip_address && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      IP: {response.ip_address} • User Agent: {response.user_agent?.substring(0, 50)}...
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}