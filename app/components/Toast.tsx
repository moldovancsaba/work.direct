'use client'

import { useState, useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ 
  message, 
  type = 'info', 
  isVisible, 
  onClose, 
  duration = 4000 
}: ToastProps) {
  const [isShowing, setIsShowing] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true)
      const timer = setTimeout(() => {
        setIsShowing(false)
        setTimeout(() => onClose(), 300) // Wait for fade out animation
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible && !isShowing) return null

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full shadow-lg rounded-lg p-4 transition-all duration-300 transform"
    
    const typeStyles = {
      success: "bg-green-500 text-white border-green-600",
      error: "bg-red-500 text-white border-red-600", 
      warning: "bg-yellow-500 text-white border-yellow-600",
      info: "bg-blue-500 text-white border-blue-600"
    }

    const animationStyles = isShowing 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0"

    return `${baseStyles} ${typeStyles[type]} ${animationStyles}`
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 text-xl">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-5">
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsShowing(false)
            setTimeout(() => onClose(), 300)
          }}
          className="ml-2 flex-shrink-0 text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}
