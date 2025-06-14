'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, Volume2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function VoiceInput({ onTranscription, placeholder, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)

  // Cleanup function to stop recording and release resources
  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    setIsRecording(false)
    audioChunksRef.current = []
  }

  useEffect(() => {
    // Cleanup on component unmount
    return cleanup
  }, [])

  const startRecording = async () => {
    console.log('startRecording called') // Debug log
    
    // Check if browser supports the required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Your browser does not support audio recording. Please use Chrome, Firefox, or Safari.')
      return
    }

    if (!window.MediaRecorder) {
      toast.error('MediaRecorder is not supported in your browser.')
      return
    }

    try {
      console.log('Requesting microphone access...') // Debug log
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      })
      
      console.log('Microphone access granted') // Debug log
      streamRef.current = stream

      // Try different MIME types for better browser compatibility
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        } else {
          mimeType = '' // Let browser choose
        }
      }

      console.log('Using MIME type:', mimeType) // Debug log

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = mediaRecorder

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size) // Debug log
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', audioChunksRef.current.length) // Debug log
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
        setAudioBlob(audioBlob)
        transcribeAudio(audioBlob)
        
        // Stop all tracks to release the microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error)
        toast.error('Recording error: ' + event.error.message)
      }

      console.log('Starting recording...') // Debug log
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      toast.success('Recording started - speak now!')
    } catch (error) {
      console.error('Error starting recording:', error)
      
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please allow microphone access and try again.')
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.')
      } else if (error.name === 'NotSupportedError') {
        toast.error('Audio recording is not supported in your browser.')
      } else {
        toast.error('Could not access microphone: ' + error.message)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob) => {
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onTranscription(result.text)
        toast.success('Speech transcribed successfully!')
      } else {
        throw new Error(result.error || 'Transcription failed')
      }
    } catch (error) {
      console.error('Transcription error:', error)
      toast.error('Failed to transcribe speech. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const playRecording = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob))
      audio.play()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled || isProcessing}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors"
          title="Start voice recording"
        >
          {isProcessing ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          disabled={disabled}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors animate-pulse"
          title="Stop recording"
        >
          <Square className="w-4 h-4" />
        </button>
      )}

      {audioBlob && !isRecording && (
        <button
          type="button"
          onClick={playRecording}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
          title="Play recording"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1">
        {isRecording && (
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Recording... Click stop when done</span>
          </div>
        )}
        {isProcessing && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm">Transcribing speech...</span>
          </div>
        )}
        {!isRecording && !isProcessing && (
          <span className="text-sm text-gray-500">
            {placeholder || 'Click the microphone to record your response'}
          </span>
        )}
      </div>
    </div>
  )
} 