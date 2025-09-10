import React from 'react'
import dynamic from 'next/dynamic'

const SecurityCenterPage = dynamic(() => import('../../src/pages/SecurityCenterPage'), {
  ssr: false
})

export default function SecurityCenter() {
  return <SecurityCenterPage />
}