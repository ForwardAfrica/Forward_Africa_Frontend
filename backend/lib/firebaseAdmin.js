const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseAdmin = null;

const initializeFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    try {
      // Check if we have service account key
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccountKey) {
        // Parse the service account key from environment variable
        const serviceAccount = JSON.parse(serviceAccountKey);

        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || 'fowardafrica-8cf73',
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'fowardafrica-8cf73.appspot.com'
        });
      } else {
        // Use default credentials (for local development with Firebase emulator)
        firebaseAdmin = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'fowardafrica-8cf73',
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'fowardafrica-8cf73.appspot.com'
        });
      }

      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  return firebaseAdmin;
};

// Get Firebase Admin instance
const getFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    return initializeFirebaseAdmin();
  }
  return firebaseAdmin;
};

// Get Firestore instance
const getFirestore = () => {
  const admin = getFirebaseAdmin();
  return admin.firestore();
};

// Get Auth instance
const getAuth = () => {
  const admin = getFirebaseAdmin();
  return admin.auth();
};

// Get Storage instance
const getStorage = () => {
  const admin = getFirebaseAdmin();
  return admin.storage();
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error);
    throw error;
  }
};

// Create custom token
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    const auth = getAuth();
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('❌ Failed to create custom token:', error);
    throw error;
  }
};

// Get user by UID
const getUser = async (uid) => {
  try {
    const auth = getAuth();
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('❌ Failed to get user:', error);
    throw error;
  }
};

// Create user
const createUser = async (userData) => {
  try {
    const auth = getAuth();
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.full_name,
      emailVerified: false
    });
    return userRecord;
  } catch (error) {
    console.error('❌ Failed to create user:', error);
    throw error;
  }
};

// Update user
const updateUser = async (uid, userData) => {
  try {
    const auth = getAuth();
    const userRecord = await auth.updateUser(uid, userData);
    return userRecord;
  } catch (error) {
    console.error('❌ Failed to update user:', error);
    throw error;
  }
};

// Delete user
const deleteUser = async (uid) => {
  try {
    const auth = getAuth();
    await auth.deleteUser(uid);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete user:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebaseAdmin,
  getFirebaseAdmin,
  getFirestore,
  getAuth,
  getStorage,
  verifyIdToken,
  createCustomToken,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
