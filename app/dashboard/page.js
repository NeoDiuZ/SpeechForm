'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, FileText, Eye, Edit, Trash2, Copy, BarChart3, LogOut, User } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userStats, setUserStats] = useState({ apiCalls: 0, limit: 50, tier: 'free' })
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Load user and forms from Supabase
  const loadUserAndForms = useCallback(async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      
      setUser(session.user)

      // Load user stats
      const { data: userData } = await supabase
        .from('subscriptions')
        .select('plan_type, api_calls_used, api_calls_limit')
        .eq('user_id', session.user.id)
        .single()

      if (userData) {
        setUserStats({
          apiCalls: userData.api_calls_used || 0,
          limit: userData.api_calls_limit || 50,
          tier: userData.plan_type || 'free'
        })
      }

      // Load forms
      const { data: formsData, error } = await supabase
        .from('forms')
        .select(`
          *,
          responses:responses(count)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading forms:', error)
        toast.error('Failed to load forms')
      } else {
        // Transform data to match expected format
        const transformedForms = formsData.map(form => ({
          ...form,
          fields: form.fields || [],
          responses: form.responses || []
        }))
        setForms(transformedForms)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    loadUserAndForms()
  }, [loadUserAndForms])

  const deleteForm = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) return

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)
        .eq('user_id', user.id)

      if (error) throw error

      setForms(forms.filter(form => form.id !== formId))
      toast.success('Form deleted successfully')
    } catch (error) {
      console.error('Error deleting form:', error)
      toast.error('Failed to delete form')
    }
  }

  const duplicateForm = async (form) => {
    try {
      const newForm = {
        title: `${form.title} (Copy)`,
        description: form.description,
        fields: form.fields,
        user_id: user.id,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('forms')
        .insert(newForm)
        .select()
        .single()

      if (error) throw error

      setForms([{ ...data, responses: [] }, ...forms])
      toast.success('Form duplicated successfully')
    } catch (error) {
      console.error('Error duplicating form:', error)
      toast.error('Failed to duplicate form')
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to log out')
    }
  }

  const copyFormLink = (formId) => {
    const link = `${window.location.origin}/form/${formId}`
    navigator.clipboard.writeText(link)
    toast.success('Form link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SpeechForms</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {/* Usage Stats */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span className="capitalize">{userStats.tier} Plan</span>
                <span>•</span>
                <span>{userStats.apiCalls}/{userStats.limit} API calls</span>
              </div>
              
              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              
              <Link 
                href="/dashboard/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Form
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Forms</h1>
          <p className="text-gray-600">Create and manage your voice-enabled forms</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first voice-enabled form</p>
            <Link 
              href="/dashboard/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Your First Form
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <div key={form.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{form.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{form.fields?.length || 0} fields</span>
                        <span className="mx-2">•</span>
                        <span>{form.responses?.[0]?.count || 0} responses</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyFormLink(form.id)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Copy form link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/form/${form.id}`}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Preview form"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/responses/${form.id}`}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View responses"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Link>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/edit/${form.id}`}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit form"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => duplicateForm(form)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Duplicate form"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteForm(form.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete form"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 