import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDemo-Key-Replace-With-Real",
  authDomain: "poker-settler-demo.firebaseapp.com",
  databaseURL: "https://poker-settler-demo-default-rtdb.firebaseio.com/",
  projectId: "poker-settler-demo",
  storageBucket: "poker-settler-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);