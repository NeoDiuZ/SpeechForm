'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, GripVertical, Type, List, Mail, Phone, Calendar, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

const FIELD_TYPES = {
  text: { icon: Type, label: 'Text Input', description: 'Single line text input' },
  textarea: { icon: FileText, label: 'Long Text', description: 'Multi-line text input' },
  email: { icon: Mail, label: 'Email', description: 'Email address input' },
  phone: { icon: Phone, label: 'Phone', description: 'Phone number input' },
  date: { icon: Calendar, label: 'Date', description: 'Date picker' },
  select: { icon: List, label: 'Multiple Choice', description: 'Dropdown or radio buttons' }
}

export default function CreateForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    fields: []
  })
  const [saving, setSaving] = useState(false)

  const addField = (type) => {
    const newField = {
      id: uuidv4(),
      type,
      label: '',
      placeholder: '',
      required: false,
      options: type === 'select' ? ['Option 1', 'Option 2'] : []
    }
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const updateField = (fieldId, updates) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }))
  }

  const removeField = (fieldId) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }))
  }

  const moveField = (fieldId, direction) => {
    const fieldIndex = form.fields.findIndex(field => field.id === fieldId)
    if (
      (direction === 'up' && fieldIndex === 0) ||
      (direction === 'down' && fieldIndex === form.fields.length - 1)
    ) {
      return
    }

    const newFields = [...form.fields]
    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1
    
    // Swap fields
    const temp = newFields[fieldIndex]
    newFields[fieldIndex] = newFields[newIndex]
    newFields[newIndex] = temp
    
    setForm(prev => ({ ...prev, fields: newFields }))
  }

  const addOption = (fieldId) => {
    const field = form.fields.find(f => f.id === fieldId)
    if (field) {
      updateField(fieldId, {
        options: [...field.options, `Option ${field.options.length + 1}`]
      })
    }
  }

  const updateOption = (fieldId, optionIndex, value) => {
    const field = form.fields.find(f => f.id === fieldId)
    if (field) {
      const newOptions = [...field.options]
      newOptions[optionIndex] = value
      updateField(fieldId, { options: newOptions })
    }
  }

  const removeOption = (fieldId, optionIndex) => {
    const field = form.fields.find(f => f.id === fieldId)
    if (field && field.options.length > 1) {
      const newOptions = field.options.filter((_, index) => index !== optionIndex)
      updateField(fieldId, { options: newOptions })
    }
  }

  const saveForm = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a form title')
      return
    }

    if (form.fields.length === 0) {
      toast.error('Please add at least one field')
      return
    }

    setSaving(true)
    
    try {
      // Save form to database via API
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          fields: form.fields
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save form')
      }

      toast.success('Form created successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving form:', error)
      toast.error(error.message || 'Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Create New Form</h1>
            </div>
            <button
              onClick={saveForm}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Builder */}
          <div className="lg:col-span-2">
            {/* Form Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter form title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this form is for"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Fields</h2>
              
              {form.fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No fields added yet. Start by adding a field from the sidebar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.fields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveField(field.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveField(field.id, 'down')}
                            disabled={index === form.fields.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            {FIELD_TYPES[field.type]?.icon && (
                              React.createElement(FIELD_TYPES[field.type].icon, {
                                className: "h-5 w-5 text-gray-500"
                              })
                            )}
                            <span className="text-sm font-medium text-gray-600">
                              {FIELD_TYPES[field.type]?.label}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Field Label *
                              </label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                placeholder="Enter field label"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Placeholder Text
                              </label>
                              <input
                                type="text"
                                value={field.placeholder}
                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                placeholder="Enter placeholder text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                              />
                            </div>

                            {field.type === 'select' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Options
                                </label>
                                <div className="space-y-2">
                                  {field.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                                      />
                                      <button
                                        onClick={() => removeOption(field.id, optionIndex)}
                                        className="p-2 text-red-500 hover:text-red-700"
                                        disabled={field.options.length === 1}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => addOption(field.id)}
                                    className="text-blue-600 text-sm hover:text-blue-700"
                                  >
                                    + Add Option
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`required-${field.id}`}
                                checked={field.required}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`required-${field.id}`} className="ml-2 text-sm text-gray-700">
                                Required field
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeField(field.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Field Types Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Fields</h3>
              <div className="space-y-2">
                {Object.entries(FIELD_TYPES).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <config.icon className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">{config.label}</div>
                        <div className="text-sm text-gray-500">{config.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Voice Optimization Tip</h4>
                <p className="text-sm text-blue-700">
                  Use clear, specific labels and avoid ambiguous options. This helps improve voice recognition accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 