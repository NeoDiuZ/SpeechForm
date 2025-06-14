'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Mic, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import VoiceInput from '../../components/VoiceInput'

export default function FormFillPage() {
  const params = useParams()
  const router = useRouter()
  const [form, setForm] = useState(null)
  const [responses, setResponses] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const loadForm = useCallback(async () => {
    try {
      // Load form from API
      const response = await fetch(`/api/forms/${params.id}`)
      const result = await response.json()
      
      if (!response.ok) {
        console.error('Error loading form:', result.error)
        toast.error('Form not found')
        router.push('/')
        return
      }

      const form = result.form
      setForm(form)
      // Initialize responses object
      const initialResponses = {}
      form.fields.forEach(field => {
        initialResponses[field.id] = ''
      })
      setResponses(initialResponses)
    } catch (error) {
      console.error('Error loading form:', error)
      toast.error('Error loading form')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    loadForm()
  }, [loadForm])

  const handleInputChange = (fieldId, value) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleVoiceTranscription = (fieldId, text) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: text
    }))
  }

  const validateForm = () => {
    const requiredFields = form.fields.filter(field => field.required)
    const missingFields = requiredFields.filter(field => !responses[field.id]?.trim())
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`)
      return false
    }
    
    return true
  }

  const submitForm = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    
    try {
      // Submit response to API
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          responses: responses
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit form')
      }
      
      setSubmitted(true)
      toast.success('Form submitted successfully!')
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(error.message || 'Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field) => {
    const value = responses[field.id] || ''

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              />
              <div className="bg-gray-50 p-3 rounded-lg">
                <VoiceInput
                  onTranscription={(text) => handleVoiceTranscription(field.id, text)}
                  placeholder={`Speak your ${field.label.toLowerCase()}`}
                />
              </div>
            </div>
          </div>
        )

      case 'email':
        return (
          <div key={field.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              <input
                type="email"
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              />
              <div className="bg-gray-50 p-3 rounded-lg">
                <VoiceInput
                  onTranscription={(text) => {
                    // Convert spoken email format to proper email
                    let emailText = text.toLowerCase()
                      .replace(/\s+at\s+/g, '@')
                      .replace(/\s+dot\s+/g, '.')
                      .replace(/\s+/g, '') // Remove all spaces
                    handleVoiceTranscription(field.id, emailText)
                  }}
                  placeholder="Speak your email (e.g., 'john dot smith at gmail dot com')"
                />
              </div>
              <div className="text-xs text-gray-500">
                💡 Say &quot;john dot smith at gmail dot com&quot; for john.smith@gmail.com
              </div>
            </div>
          </div>
        )

      case 'phone':
        return (
          <div key={field.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              <input
                type="tel"
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              />
              <div className="bg-gray-50 p-3 rounded-lg">
                <VoiceInput
                  onTranscription={(text) => {
                    // Extract only numbers and format phone number
                    let phoneText = text.replace(/\D/g, '') // Remove all non-digits
                    
                    // Format US phone number (adjust for your region)
                    if (phoneText.length === 10) {
                      phoneText = `(${phoneText.slice(0,3)}) ${phoneText.slice(3,6)}-${phoneText.slice(6)}`
                    } else if (phoneText.length === 11 && phoneText.startsWith('1')) {
                      phoneText = `+1 (${phoneText.slice(1,4)}) ${phoneText.slice(4,7)}-${phoneText.slice(7)}`
                    }
                    
                    handleVoiceTranscription(field.id, phoneText)
                  }}
                  placeholder="Speak your phone number (e.g., 'five five five one two three four five six seven')"
                />
              </div>
              <div className="text-xs text-gray-500">
                💡 Speak each digit clearly: &quot;five five five one two three four five six seven&quot;
              </div>
            </div>
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              <textarea
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              />
              <div className="bg-gray-50 p-3 rounded-lg">
                <VoiceInput
                  onTranscription={(text) => handleVoiceTranscription(field.id, text)}
                  placeholder={`Speak your ${field.label.toLowerCase()}`}
                />
              </div>
            </div>
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
              <div className="bg-gray-50 p-3 rounded-lg">
                <VoiceInput
                  onTranscription={(text) => {
                    const dateString = text.toLowerCase().trim()
                    let finalDate = ''
                    
                    console.log('Processing date input:', dateString) // Debug log
                    
                    // Handle common date expressions
                    if (dateString.includes('today')) {
                      finalDate = new Date().toISOString().split('T')[0]
                    } else if (dateString.includes('tomorrow')) {
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      finalDate = tomorrow.toISOString().split('T')[0]
                    } else if (dateString.includes('yesterday')) {
                      const yesterday = new Date()
                      yesterday.setDate(yesterday.getDate() - 1)
                      finalDate = yesterday.toISOString().split('T')[0]
                    } else {
                      // Enhanced date parsing
                      const monthNames = {
                        'january': '01', 'jan': '01', 'february': '02', 'feb': '02', 
                        'march': '03', 'mar': '03', 'april': '04', 'apr': '04',
                        'may': '05', 'june': '06', 'jun': '06', 'july': '07', 'jul': '07',
                        'august': '08', 'aug': '08', 'september': '09', 'sep': '09', 'sept': '09',
                        'october': '10', 'oct': '10', 'november': '11', 'nov': '11', 
                        'december': '12', 'dec': '12'
                      }
                      
                      // Clean up the text - remove ordinals and extra words
                      let cleanedText = dateString
                        .replace(/(\d+)(st|nd|rd|th)/g, '$1') // Remove ordinals
                        .replace(/\s+/g, ' ') // Normalize spaces
                        .trim()
                      
                      console.log('Cleaned text:', cleanedText) // Debug log
                      
                      // Try multiple date formats
                      const patterns = [
                        // "January 15 2024" or "January 15, 2024"
                        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
                        // "15 January 2024"
                        /(\d{1,2})\s+(\w+)\s+(\d{4})/,
                        // "1/15/2024" or "01/15/2024"
                        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
                        // "2024-01-15"
                        /(\d{4})-(\d{1,2})-(\d{1,2})/,
                        // "15-01-2024"
                        /(\d{1,2})-(\d{1,2})-(\d{4})/
                      ]
                      
                      for (const pattern of patterns) {
                        const match = cleanedText.match(pattern)
                        if (match) {
                          console.log('Pattern matched:', pattern, match) // Debug log
                          
                          if (pattern === patterns[0]) { // "January 15 2024"
                            const month = monthNames[match[1].toLowerCase()]
                            const day = match[2].padStart(2, '0')
                            const year = match[3]
                            if (month) {
                              finalDate = `${year}-${month}-${day}`
                            }
                          } else if (pattern === patterns[1]) { // "15 January 2024"
                            const day = match[1].padStart(2, '0')
                            const month = monthNames[match[2].toLowerCase()]
                            const year = match[3]
                            if (month) {
                              finalDate = `${year}-${month}-${day}`
                            }
                          } else if (pattern === patterns[2]) { // "1/15/2024"
                            const month = match[1].padStart(2, '0')
                            const day = match[2].padStart(2, '0')
                            const year = match[3]
                            finalDate = `${year}-${month}-${day}`
                          } else if (pattern === patterns[3]) { // "2024-01-15"
                            finalDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
                          } else if (pattern === patterns[4]) { // "15-01-2024"
                            const day = match[1].padStart(2, '0')
                            const month = match[2].padStart(2, '0')
                            const year = match[3]
                            finalDate = `${year}-${month}-${day}`
                          }
                          break
                        }
                      }
                      
                      // If no pattern matched, try JavaScript's Date constructor as fallback
                      if (!finalDate) {
                        try {
                          const parsedDate = new Date(cleanedText)
                          if (!isNaN(parsedDate.getTime())) {
                            finalDate = parsedDate.toISOString().split('T')[0]
                          }
                        } catch (e) {
                          console.error('Date parsing error:', e)
                        }
                      }
                    }
                    
                    console.log('Final date:', finalDate) // Debug log
                    
                    if (finalDate) {
                      handleVoiceTranscription(field.id, finalDate)
                      toast.success(`Date set to: ${finalDate}`)
                    } else {
                      handleVoiceTranscription(field.id, text)
                      toast.error(`Could not parse "${text}" as a date. Try saying "January 15, 2024" or "today"`)
                    }
                  }}
                  placeholder="Say 'today', 'tomorrow', 'January 15, 2024', or '15th of January 2024'"
                />
              </div>
              <div className="text-xs text-gray-500">
                💡 Try: &quot;today&quot;, &quot;tomorrow&quot;, &quot;January 15, 2024&quot;, &quot;15th of January&quot;, &quot;1/15/2024&quot;, or &quot;2024-01-15&quot;
              </div>
            </div>
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              <select
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Select an option</option>
                {field.options.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
              <div className="bg-gray-50 p-3 rounded-lg">
                <VoiceInput
                  onTranscription={(text) => {
                    const spokenText = text.toLowerCase().trim()
                    let matchedOption = null
                    
                    // Try exact match first
                    matchedOption = field.options.find(option =>
                      option.toLowerCase() === spokenText
                    )
                    
                    // Try partial match
                    if (!matchedOption) {
                      matchedOption = field.options.find(option =>
                        option.toLowerCase().includes(spokenText) ||
                        spokenText.includes(option.toLowerCase())
                      )
                    }
                    
                    // Try fuzzy matching for common words
                    if (!matchedOption) {
                      const fuzzyMap = {
                        'good': ['good', 'great', 'nice', 'positive'],
                        'bad': ['bad', 'poor', 'negative', 'terrible'],
                        'excellent': ['excellent', 'amazing', 'outstanding', 'perfect'],
                        'average': ['average', 'okay', 'medium', 'middle'],
                        'yes': ['yes', 'yeah', 'yep', 'sure', 'correct', 'true'],
                        'no': ['no', 'nope', 'false', 'incorrect', 'wrong']
                      }
                      
                      for (const option of field.options) {
                        const optionLower = option.toLowerCase()
                        if (fuzzyMap[optionLower]) {
                          if (fuzzyMap[optionLower].some(word => spokenText.includes(word))) {
                            matchedOption = option
                            break
                          }
                        }
                      }
                    }
                    
                    if (matchedOption) {
                      handleVoiceTranscription(field.id, matchedOption)
                    } else {
                      // Show what was heard and available options
                      handleVoiceTranscription(field.id, text)
                      setTimeout(() => {
                        alert(`I heard "${text}" but couldn't match it to any option. Available options are: ${field.options.join(', ')}`)
                      }, 500)
                    }
                  }}
                  placeholder={`Say one of: ${field.options.join(', ')}`}
                />
              </div>
              <div className="text-sm text-gray-500">
                <strong>Available options:</strong> {field.options.join(', ')}
              </div>
              {value && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  ✅ Selected: <strong>{value}</strong>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h1>
          <p className="text-gray-600 mb-6">Your response has been submitted successfully.</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-2">
              <Mic className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">SpeechForms</span>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600 text-lg">{form.description}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <Mic className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Voice-Enabled Form</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You can type your responses or use the microphone buttons to speak your answers. 
                  Your speech will be automatically converted to text.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="space-y-8">
            {form.fields.map(field => renderField(field))}

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Response
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
} 