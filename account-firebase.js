// ==========================================================================
// ACCOUNT PAGE FIREBASE LOGIC (account-firebase.js)
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

// Same Config Credentials
const firebaseConfig = {
  apiKey: "AIzaSyCxP405IU4nljGIF9LzA4WeVLVk2kb8OEU",
  authDomain: "mypghub-68a0f.firebaseapp.com",
  projectId: "mypghub-68a0f",
  storageBucket: "mypghub-68a0f.firebasestorage.app",
  messagingSenderId: "128487472086",
  appId: "1:128487472086:web:6e4daabb527b0f2abb4277",
  measurementId: "G-EV19LWYTZ3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Page load hote hi check karo user login hai ya nahi
onAuthStateChanged(auth, (user) => {
  const userPhoneDisplay = document.getElementById("userPhoneDisplay");
  const loginStatus = document.getElementById("loginStatus");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    // 1. Agar User Logged In hai: Uska poora phone number dikhao
    if (userPhoneDisplay) userPhoneDisplay.innerText = user.phoneNumber; // Jaise: +917033403227
    if (loginStatus) loginStatus.innerText = "Verified User";
    if (logoutBtn) logoutBtn.style.display = "block"; // Logout button dikhao
  } else {
    // 2. Agar koi login nahi hai (Guest): Wapas home page par bhej do
    if (userPhoneDisplay) userPhoneDisplay.innerText = "Guest User";
    if (loginStatus) loginStatus.innerText = "Not Logged In";
    if (logoutBtn) logoutBtn.style.display = "none"; // Logout button chhupao
    
    // Security Guard Check: Bina login ke koi is page par ruk nahi sakta
    alert("Please login first to view this page.");
    window.location.href = "index.html";
  }
});

// LOGOUT BUTTON ACTION
window.handleLogout = () => {
  signOut(auth)
    .then(() => {
      alert("Logged out successfully!");
      window.location.href = "index.html"; // Wapas home page par bhej do
    })
    .catch((error) => {
      console.error("Error during logout:", error);
      alert("Error logging out: " + error.message);
    });
};