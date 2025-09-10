import React from 'react'
import dynamic from 'next/dynamic'

const UploadCoursePage = dynamic(() => import('../../src/pages/UploadCoursePage'), {
  ssr: false
})

export default function UploadCourse() {
  return <UploadCoursePage />
}