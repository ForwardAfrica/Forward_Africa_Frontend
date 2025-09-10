import React from 'react'
import dynamic from 'next/dynamic'

const LandingPage = dynamic(() => import('../src/pages/LandingPage'), {
  ssr: false
})

export default function Index() {
  return <LandingPage />
}