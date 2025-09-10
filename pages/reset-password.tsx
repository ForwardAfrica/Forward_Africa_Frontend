import React from 'react'
import dynamic from 'next/dynamic'

const ResetPasswordPage = dynamic(() => import('../src/pages/ResetPasswordPage'), {
  ssr: false
})

export default function ResetPassword() {
  return <ResetPasswordPage />
}