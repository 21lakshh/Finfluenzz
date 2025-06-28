import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface FormData {
  username: string
  password: string
  email: string
  age: string
  mainPurpose: string
  currentlyEarn: string
  employmentType: string
  financeKnowledge: string
}

export default function Signup() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    email: '',
    age: '',
    mainPurpose: '',
    currentlyEarn: '',
    employmentType: '',
    financeKnowledge: ''
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (!formData.username.trim()) newErrors.username = 'Username is required'
    if (!formData.password.trim()) newErrors.password = 'Password is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.age.trim()) newErrors.age = 'Age is required'
    if (!formData.mainPurpose) newErrors.mainPurpose = 'Main purpose is required'
    if (!formData.currentlyEarn) newErrors.currentlyEarn = 'Please select if you currently earn'
    if (!formData.employmentType) newErrors.employmentType = 'Employment type is required'
    if (!formData.financeKnowledge) newErrors.financeKnowledge = 'Finance knowledge level is required'

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    // Age validation  
    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) < 18 || Number(formData.age) > 100)) {
      newErrors.age = 'Please enter a valid age (18-100)'
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
      // Transform frontend data to match backend schema
      const signupData = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        age: parseInt(formData.age), // Convert to number
        goal: formData.mainPurpose, // Map mainPurpose to goal
        employmentType: formData.employmentType,
        financeKnowledge: formData.financeKnowledge,
        earn: formData.currentlyEarn === 'yes' // Convert "yes"/"no" to boolean
      }

      console.log('Sending signup data:', signupData)

      const response = await axios.post("https://finfluenzz.lakshyapaliwal200.workers.dev/api/signup", signupData)
      
      if (response.status === 200) {
        localStorage.setItem('Authorization', response.data.token)
        
        // Refresh user data in auth context
        await refreshUser()
        
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Signup error:', error)
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data
        console.error('Error details:', errorData)
        
        // Handle specific errors
        if (error.response.status === 409) {
          setErrors({ email: 'Email or username already exists' })
        } else if (error.response.status === 400) {
          setErrors({ email: errorData.error || 'Invalid data provided' })
        } else {
          setErrors({ email: errorData.error || 'Signup failed. Please try again.' })
        }
      } else {
        setErrors({ email: 'Network error. Please check your connection.' })
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
            SIGN UP
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-[#001F3F] text-sm font-bold mb-2 tracking-wide">
              USERNAME
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono"
              style={{ borderRadius: '0px' }}
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
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
              className="w-full px-3 py-2 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono"
              style={{ borderRadius: '0px' }}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

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
              className="w-full px-3 py-2 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono"
              style={{ borderRadius: '0px' }}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Age */}
          <div>
            <label className="block text-[#001F3F] text-sm font-bold mb-2 tracking-wide">
              AGE
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="18"
              max="100"
              className="w-full px-3 py-2 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono"
              style={{ borderRadius: '0px' }}
            />
            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
          </div>

          {/* Main Purpose */}
          <div>
            <label className="block text-[#001F3F] text-sm font-bold mb-2 tracking-wide">
              MAIN PURPOSE
            </label>
            <select
              name="mainPurpose"
              value={formData.mainPurpose}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono"
              style={{ borderRadius: '0px' }}
            >
              <option value="">Select Purpose</option>
              <option value="saving">Saving</option>
              <option value="investing">Investing</option>
              <option value="budgeting">Budgeting</option>
            </select>
            {errors.mainPurpose && <p className="text-red-500 text-xs mt-1">{errors.mainPurpose}</p>}
          </div>

          {/* Currently Earn */}
          <div>
            <label className="block text-[#001F3F] text-sm font-bold mb-2 tracking-wide">
              DO YOU CURRENTLY EARN?
            </label>
            <select
              name="currentlyEarn"
              value={formData.currentlyEarn}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono"
              style={{ borderRadius: '0px' }}
            >
              <option value="">Select Option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            {errors.currentlyEarn && <p className="text-red-500 text-xs mt-1">{errors.currentlyEarn}</p>}
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-[#001F3F] text-sm font-bold mb-2 tracking-wide">
              EMPLOYMENT TYPE
            </label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono"
              style={{ borderRadius: '0px' }}
            >
              <option value="">Select Type</option>
              <option value="student">Student</option>
              <option value="freelancer">Freelancer</option>
              <option value="intern">Intern</option>
              <option value="fulltime">Full Time</option>
            </select>
            {errors.employmentType && <p className="text-red-500 text-xs mt-1">{errors.employmentType}</p>}
          </div>

          {/* Finance Knowledge */}
          <div>
            <label className="block text-[#001F3F] text-sm font-bold mb-2 tracking-wide">
              FINANCE KNOWLEDGE LEVEL
            </label>
            <select
              name="financeKnowledge"
              value={formData.financeKnowledge}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none transition-colors font-mono"
              style={{ borderRadius: '0px' }}
            >
              <option value="">Select Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            {errors.financeKnowledge && <p className="text-red-500 text-xs mt-1">{errors.financeKnowledge}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#007FFF] to-[#001F3F] text-white font-bold py-3 px-4 border-2 border-[#001F3F] hover:from-[#001F3F] hover:to-[#007FFF] hover:border-[#007FFF] transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6 tracking-wider"
            style={{ borderRadius: '0px' }}
          >
            {isLoading ? '[CREATING ACCOUNT...]' : '[SIGN UP]'}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-[#001F3F] text-sm opacity-80">
            Already have an account?{' '}
            <button
              onClick={async () => {
                navigate('/signin')
              }}
              className="text-[#007FFF] hover:text-[#001F3F] transition-colors font-bold"
            >
              [SIGN IN]
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}