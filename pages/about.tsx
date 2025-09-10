import React from 'react'
import dynamic from 'next/dynamic'

const AboutPage = dynamic(() => import('../src/pages/AboutPage'), {
  ssr: false
})

export default function About() {
  return <AboutPage />
}