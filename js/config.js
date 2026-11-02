/* =====================================================================
   بيان — الإعدادات. هذا الملف الوحيد الذي تعدّله عند الربط بـ Firebase.
   اتركه null للوضع التجريبي (البيانات في المتصفح فقط).
   ===================================================================== */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAlXHsOwjK0RlWSALOBYoFZvWRtH9ULWzY",
  authDomain: "bayan-4e7fb.firebaseapp.com",
  projectId: "bayan-4e7fb",
  storageBucket: "bayan-4e7fb.firebasestorage.app",
  messagingSenderId: "597234145719",
  appId: "1:597234145719:web:0a3a60f3fb0e461303b032",
  measurementId: "G-N9NNTFRKPD"
};
/* مثال:
const FIREBASE_CONFIG = {
  apiKey: "....",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "....",
  appId: "...."
};
*/
const EMAIL_DOMAIN = 'bayan-students.app'; // يُضاف لاسم المستخدم داخلياً في Firebase
