import React from 'react'
import dynamic from 'next/dynamic'

const SearchPage = dynamic(() => import('../src/pages/SearchPage'), {
  ssr: false
})

export default function Search() {
  return <SearchPage />
}