import React from 'react'
import dynamic from 'next/dynamic'

const GlobalSettingsPage = dynamic(() => import('../../src/pages/SecuritySettingsPage'), {
  ssr: false
})

export default function GlobalSettings() {
  return <GlobalSettingsPage />
}