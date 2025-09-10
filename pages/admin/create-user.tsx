import React from 'react'
import dynamic from 'next/dynamic'

const CreateAdminUserPage = dynamic(() => import('../../src/pages/CreateAdminUserPage'), {
  ssr: false
})

export default function CreateUser() {
  return <CreateAdminUserPage />
}