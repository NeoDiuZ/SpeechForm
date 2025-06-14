'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mic, CheckCircle, Play } from 'lucide-react'
import VoiceInput from '../components/VoiceInput'

export default function DemoPage() {
  const [responses, setResponses] = useState({
    name: '',
    email: '',
    feedback: '',
    rating: ''
  })

  const handleVoiceTranscription = (fieldId, text) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: text
    }))
  }

  const handleInputChange = (fieldId, value) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-2">
              <Play className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Demo - Voice Form</span>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Feedback Survey</h1>
            <p className="text-gray-600 text-lg">
              Help us improve our products with your valuable feedback. Try using your voice to fill out this form!
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Mic className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">Try Voice Input!</h3>
                <p className="text-blue-700 mb-4">
                  This demo shows how SpeechForms works. You can either type your responses or click the microphone buttons to speak your answers. Your speech will be automatically converted to text using OpenAI's advanced speech recognition.
                </p>
                <div className="bg-blue-100 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">🎯 Tips for best results:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Speak clearly and at a normal pace</li>
                    <li>• Use a quiet environment if possible</li>
                    <li>• Say "period" or "comma" for punctuation</li>
                    <li>• Click stop when you're done speaking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Name Field */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={responses.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="bg-gray-50 p-3 rounded-lg">
                  <VoiceInput
                    onTranscription={(text) => handleVoiceTranscription('name', text)}
                    placeholder="Speak your name"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <input
                  type="email"
                  value={responses.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="bg-gray-50 p-3 rounded-lg">
                  <VoiceInput
                    onTranscription={(text) => handleVoiceTranscription('email', text)}
                    placeholder="Speak your email address (e.g., 'john dot smith at gmail dot com')"
                  />
                </div>
              </div>
            </div>

            {/* Rating Field */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Overall Rating
              </label>
              <div className="space-y-2">
                <select
                  value={responses.rating}
                  onChange={(e) => handleInputChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a rating</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <VoiceInput
                    onTranscription={(text) => {
                      const spokenText = text.toLowerCase()
                      const ratings = ['excellent', 'good', 'average', 'poor']
                      const matchedRating = ratings.find(rating => 
                        spokenText.includes(rating)
                      )
                      if (matchedRating) {
                        handleVoiceTranscription('rating', matchedRating.charAt(0).toUpperCase() + matchedRating.slice(1))
                      } else {
                        handleVoiceTranscription('rating', text)
                      }
                    }}
                    placeholder="Say: Excellent, Good, Average, or Poor"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  Available options: Excellent, Good, Average, Poor
                </div>
              </div>
            </div>

            {/* Feedback Field */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Additional Feedback
              </label>
              <div className="space-y-2">
                <textarea
                  value={responses.feedback}
                  onChange={(e) => handleInputChange('feedback', e.target.value)}
                  placeholder="Share your thoughts and suggestions..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="bg-gray-50 p-3 rounded-lg">
                  <VoiceInput
                    onTranscription={(text) => handleVoiceTranscription('feedback', text)}
                    placeholder="Speak your feedback and suggestions"
                  />
                </div>
              </div>
            </div>

            {/* Current Responses Display */}
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📝 Current Responses</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-600">{responses.name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-600">{responses.email || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Rating:</span>
                  <span className="ml-2 text-gray-600">{responses.rating || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Feedback:</span>
                  <span className="ml-2 text-gray-600">{responses.feedback || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => setResponses({ name: '', email: '', feedback: '', rating: '' })}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Form
              </button>
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Create Your Own Form
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 