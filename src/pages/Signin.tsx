import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface FormData {
  email: string
  password: string
}

export default function Signin() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password.trim()) newErrors.password = 'Password is required'

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    // Password validation
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
        const response = await axios.post("https://finfluenzz.lakshyapaliwal200.workers.dev/api/signin", formData)
        if (response.status === 200) {
          localStorage.setItem('Authorization', response.data.token)
          
          // Refresh user data in auth context
          await refreshUser()
          
          navigate('/dashboard')
        }
    } catch (error) {
        console.error('Signin error:', error)
        if (axios.isAxiosError(error) && error.response) {
          const errorData = error.response.data
          setErrors({ email: errorData.error || 'Invalid credentials' })
        } else {
          setErrors({ email: 'Network error. Please try again.' })
        }
      } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F8FF] to-white flex items-center justify-center p-4 font-pixel-retroui relative overflow-hidden">
      {/* Overlay to blend background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F0F8FF]/80 to-white/80"></div>
      
      {/* Retro Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#007FFF_1px,transparent_1px),linear-gradient(to_bottom,#007FFF_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Floating Pixels */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-8 h-8 bg-[#007FFF] opacity-20 rounded-sm animate-pulse"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-[#001F3F] opacity-30 rounded-sm animate-bounce"></div>
        <div className="absolute bottom-32 left-16 w-10 h-10 bg-[#007FFF] opacity-15 rounded-sm animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-[#001F3F] opacity-25 rounded-sm animate-bounce delay-500"></div>
      </div>

      <div className="relative bg-blue-50/95 border-4 border-[#007FFF] rounded-none shadow-2xl w-full max-w-md p-8 backdrop-blur-sm z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 text-[#007FFF] hover:text-[#001F3F] transition-colors text-xs font-bold tracking-wide flex items-center justify-center mx-auto space-x-1"
          >
            <span>←</span>
            <span>[BACK TO HOME]</span>
          </button>
          <h1 className="text-3xl font-bold text-[#001F3F] mb-2 tracking-wider">
            SIGN IN
          </h1>
          <p className="text-[#001F3F] opacity-70 text-sm tracking-wide">
            Welcome back, player! 🎮
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-[#001F3F] text-sm font-bold mb-2 tracking-wide">
              EMAIL
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-3 py-3 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono disabled:opacity-50"
              style={{ borderRadius: '0px' }}
              placeholder="Enter your email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 font-mono">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-[#001F3F] text-sm font-bold mb-2 tracking-wide">
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-3 py-3 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono disabled:opacity-50"
              style={{ borderRadius: '0px' }}
              placeholder="Enter your password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1 font-mono">{errors.password}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#007FFF] to-[#001F3F] text-white font-bold py-3 px-4 border-2 border-[#001F3F] hover:from-[#001F3F] hover:to-[#007FFF] hover:border-[#007FFF] transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6 tracking-wider"
            style={{ borderRadius: '0px' }}
          >
            {isLoading ? '[LOADING...]' : '[SIGN IN]'}
          </button>
        </form>

        {/* Additional Options */}
        <div className="mt-6 space-y-4">
          {/* Forgot Password */}
          <div className="text-center">
            <button
              type="button"
              className="text-[#007FFF] hover:text-[#001F3F] transition-colors text-sm font-bold tracking-wide"
            >
              [FORGOT PASSWORD?]
            </button>
          </div>

          {/* Signup Link */}
          <div className="text-center">
            <p className="text-[#001F3F] text-sm opacity-80">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-[#007FFF] hover:text-[#001F3F] transition-colors font-bold"
              >
                [SIGN UP]
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}