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

  // Helper function to request permissions on mobile with better error handling
  const requestMobilePermissions = async () => {
    try {
      // Test if we can get basic audio stream first
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      testStream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Mobile permission test failed:', error)
      
      if (error.name === 'NotAllowedError') {
        toast.error('🎤 Please enable microphone access in your browser settings and refresh the page.')
      } else if (error.name === 'NotFoundError') {
        toast.error('🎤 No microphone found. Please ensure your device has a working microphone.')
      } else {
        toast.error('🎤 Unable to access microphone. Please check your browser permissions.')
      }
      return false
    }
  }

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
    console.log('User Agent:', navigator.userAgent) // Debug for mobile
    console.log('Is mobile:', /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    
    // Check if browser supports the required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Your browser does not support audio recording. Please use Chrome, Firefox, or Safari.')
      return
    }

    if (!window.MediaRecorder) {
      toast.error('MediaRecorder is not supported in your browser.')
      return
    }

    // Additional mobile-specific checks
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Safari on iOS requires user interaction and has stricter requirements
      console.log('iOS device detected - using Safari-optimized settings')
    }
    
    if (/Android/i.test(navigator.userAgent)) {
      console.log('Android device detected - using Android-optimized settings')
    }

    // Pre-flight permission check for mobile devices
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      const hasPermission = await requestMobilePermissions()
      if (!hasPermission) {
        return
      }
    }

    try {
      console.log('Requesting microphone access...') // Debug log
      
      // Enhanced audio constraints for mobile compatibility
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Use more conservative settings for mobile
          sampleRate: { ideal: 16000, min: 8000, max: 48000 },
          channelCount: { ideal: 1 }, // Mono for smaller file size
          // Mobile-specific constraints
          ...(navigator.userAgent.match(/iPhone|iPad|iPod|Android/i) && {
            sampleSize: 16,
            latency: 0
          })
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints)
      
      console.log('Microphone access granted') // Debug log
      streamRef.current = stream

      // Try different MIME types for better browser compatibility
      // Priority order optimized for mobile compatibility
      const mimeTypes = [
        'audio/webm;codecs=opus',  // Chrome/Edge desktop
        'audio/webm',              // Chrome/Edge fallback
        'audio/mp4;codecs=mp4a.40.2', // Safari/iOS
        'audio/mp4',               // Safari fallback
        'audio/ogg;codecs=opus',   // Firefox
        'audio/wav',               // Universal fallback
        'audio/mpeg',              // Older browsers
        ''                         // Let browser choose as last resort
      ]
      
      let mimeType = ''
      for (const type of mimeTypes) {
        if (type === '' || MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          break
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
      
      // Validate MediaRecorder is ready before starting
      if (mediaRecorder.state === 'inactive') {
        // Use different timeslice for mobile to handle potential connectivity issues
        const timeslice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 500 : 1000
        mediaRecorder.start(timeslice)
        setIsRecording(true)
        toast.success('Recording started - speak now!')
      } else {
        console.error('MediaRecorder not in inactive state:', mediaRecorder.state)
        toast.error('Unable to start recording. Please try again.')
      }
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
      
      // Determine file extension based on blob type
      let fileName = 'audio.webm'
      if (audioBlob.type.includes('mp4')) {
        fileName = 'audio.mp4'
      } else if (audioBlob.type.includes('wav')) {
        fileName = 'audio.wav'
      } else if (audioBlob.type.includes('ogg')) {
        fileName = 'audio.ogg'
      } else if (audioBlob.type.includes('mpeg')) {
        fileName = 'audio.mp3'
      }
      
      console.log('Sending audio file:', fileName, 'Size:', audioBlob.size, 'Type:', audioBlob.type)
      formData.append('audio', audioBlob, fileName)

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