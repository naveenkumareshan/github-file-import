
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';


const firebaseConfig = {
  // These will be set from environment variables or user input
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (error) {
  console.log('Firebase not configured:', error);
}

export const firebaseNotificationService = {
  // Initialize Firebase and request permission
  async initializeFirebase() {
    if (!messaging) return null;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  // Listen for foreground messages
  onMessageListener() {
    if (!messaging) return () => {};
    
    return onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      
      // Show notification
      if (payload.notification) {
        new Notification(payload.notification.title || 'New Notification', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/favicon.ico'
        });
      }
    });
  },

  // Get current FCM token
  async getCurrentToken() {
    if (!messaging) return null;
    
    try {
      const token = await getToken(messaging);
      return token;
    } catch (error) {
      console.error('Error getting current token:', error);
      return null;
    }
  }
};
