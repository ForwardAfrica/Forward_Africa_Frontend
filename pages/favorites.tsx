import React from 'react';
import dynamic from 'next/dynamic';

const FavoritesPage = dynamic(() => import('../src/pages/FavoritesPage'), {
  ssr: false
});

export default function Favorites() {
  return <FavoritesPage />;
}