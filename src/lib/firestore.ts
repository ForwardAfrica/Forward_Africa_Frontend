import { db } from './firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Example function from your documentation to get courses by category
export const getCoursesByCategory = async (category: string) => {
  const q = query(
    collection(db, 'courses'),
    where('category', '==', category),
    where('comingSoon', '==', false),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};