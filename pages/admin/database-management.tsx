import React from 'react'
import dynamic from 'next/dynamic'

const DatabaseManagementPage = dynamic(() => import('../../src/pages/DatabaseManagementPage'), {
  ssr: false
})

export default function DatabaseManagement() {
  return <DatabaseManagementPage />
}