import React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Layout from '../../../src/components/layout/Layout'

const ChatPage = dynamic(() => import('../../../src/pages/ChatPage'), {
  ssr: false
})

export default function CommunityChat() {
  const router = useRouter()
  const { groupId } = router.query

  return (
    <Layout>
      <ChatPage />
    </Layout>
  )
}