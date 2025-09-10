import React from 'react'
import dynamic from 'next/dynamic'

const SecuritySettingsPage = dynamic(() => import('../../src/pages/SecuritySettingsPage'), {
  ssr: false
})

export default function SecuritySettings() {
  return <SecuritySettingsPage />
}