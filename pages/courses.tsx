import React from 'react'
import dynamic from 'next/dynamic'

const CoursesPage = dynamic(() => import('../src/pages/CoursesPage'), {
  ssr: false
})

export default function Courses() {
  return <CoursesPage />
}