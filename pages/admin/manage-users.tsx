import React from 'react'
import dynamic from 'next/dynamic'

const ManageUsersPage = dynamic(() => import('../../src/pages/ManageUsersPage'), {
  ssr: false
})

export default function ManageUsers() {
  return <ManageUsersPage />
}