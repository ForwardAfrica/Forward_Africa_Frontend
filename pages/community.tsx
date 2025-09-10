import React from 'react'
import dynamic from 'next/dynamic'
import CommunityLayout from '../src/components/layout/CommunityLayout'

const CommunityPage = dynamic(() => import('../src/pages/CommunityPage'), {
  ssr: false
})

export default function Community() {
  return (
    <CommunityLayout>
      <CommunityPage />
    </CommunityLayout>
  )
}