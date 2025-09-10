import React from 'react'
import dynamic from 'next/dynamic'

const CommunicationCenterPage = dynamic(() => import('../../src/pages/CommunicationCenterPage'), {
  ssr: false
})

export default function CommunicationCenter() {
  return <CommunicationCenterPage />
}