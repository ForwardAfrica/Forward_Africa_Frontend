import React from 'react'
import dynamic from 'next/dynamic'

const AdminLoginPage = dynamic(() => import('../../src/pages/AdminLoginPage'), {
  ssr: false
})

export default function AdminLogin() {
  return <AdminLoginPage />
}