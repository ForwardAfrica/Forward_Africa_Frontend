import React from 'react'
import dynamic from 'next/dynamic'

const FinancialManagementPage = dynamic(() => import('../../src/pages/FinancialManagementPage'), {
  ssr: false
})

export default function FinancialManagement() {
  return <FinancialManagementPage />
}