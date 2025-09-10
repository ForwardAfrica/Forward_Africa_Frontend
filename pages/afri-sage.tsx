import React from 'react'
import dynamic from 'next/dynamic'

const AfrisagePage = dynamic(() => import('../src/pages/AfrisagePage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading AI Assistant...</p>
      </div>
    </div>
  )
})

export default function AfriSage() {
  return (
    <div>
      <AfrisagePage />
    </div>
  )
}