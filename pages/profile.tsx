import React from 'react'
import dynamic from 'next/dynamic'

const ProfilePage = dynamic(() => import('../src/pages/ProfilePage'), {
  ssr: false
})

export default function Profile() {
  return <ProfilePage />
}