import React from 'react'
import dynamic from 'next/dynamic'

const LoginPage = dynamic(() => import('../src/pages/LoginPage'), {
  ssr: false
})

export default function Login() {
  return <LoginPage />
}