import React from 'react'
import dynamic from 'next/dynamic'

const ForgotPasswordPage = dynamic(() => import('../src/pages/ForgotPasswordPage'), {
  ssr: false
})

export default function ForgotPassword() {
  return <ForgotPasswordPage />
}