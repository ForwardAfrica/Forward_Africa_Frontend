import React from 'react'
import dynamic from 'next/dynamic'

const AddFacilitatorPage = dynamic(() => import('../../src/pages/AddFacilitatorPage'), {
  ssr: false
})

export default function AddInstructor() {
  return <AddFacilitatorPage />
}