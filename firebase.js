// ==========================================================================
// 📥 1. FIREBASE SDK IMPORTS
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  setPersistence,           // 🔒 Local memory me session save rakhne ke liye
  browserLocalPersistence   // 🔒 Refresh bug ko jad se khatam karne ke liye
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 🔥 FIRESTORE DATABASE MODULE IMPORTS
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================================================
// ⚙️ 2. FIREBASE CONFIGURATION (🔒 APNI ASLI PRODUCTION KEYS)
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCxP405IU4nljGIF9LzA4WeVLVk2kb8OEU",
  authDomain: "mypghub-68a0f.firebaseapp.com",
  projectId: "mypghub-68a0f",
  storageBucket: "mypghub-68a0f.firebasestorage.app",
  messagingSenderId: "128487472086",
  appId: "1:128487472086:web:6e4daabb527b0f2abb4277",
  measurementId: "G-EV19LWYTZ3"
};

// Initialize Firebase & Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Database instance register kiya

// 🛡️ SECURITY LOCK: Mobile aur Laptop me refresh karne par login yaad rakhne ke liye
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Persistence activated globally: LOCAL storage mode.");
  })
  .catch((error) => {
    console.error("Persistence Configuration Error:", error.message);
  });

let confirmationResultGlobal = null;

// ==========================================================================
// 🚀 3. AUTH STATE WATCHER (🔒 SMART SYNC: No Refresh & No Auto-Popup)
// ==========================================================================
onAuthStateChanged(auth, (user) => {
  const loginText = document.getElementById("loginText");
  const userNumberDisplay = document.getElementById("userNumberDisplay");
  const loginModal = document.getElementById("loginModal");
  
  const isAccountPage = window.location.pathname.includes("account.html");

  if (user) {
    console.log("Active Session Verified:", user.uid);
    window.currentUserInstance = user; // Script.js ke auth verification ke liye session data store kiya
    
    // User login hai toh login screens aur links ko smartly hide/show karo
    if (loginModal) loginModal.style.display = "none"; 
    if (loginText) loginText.style.display = "none";

    if (userNumberDisplay) {
      if (user.phoneNumber) {
        let rawNumber = user.phoneNumber.replace("+91", "");
        userNumberDisplay.innerText = rawNumber.substring(0, 4) + "...";
      } else if (user.displayName) {
        userNumberDisplay.innerText = user.displayName.split(" ")[0];
      } else {
        userNumberDisplay.innerText = "User";
      }
      userNumberDisplay.style.display = "inline-block";
    }
  } else {
    console.log("No Session Active.");
    window.currentUserInstance = null; // Session null kiya
    
    // Logged out state ya loading state me UI ko safe rakho (No Refresh logic)
    if (loginText) loginText.style.display = "inline-block";
    if (userNumberDisplay) userNumberDisplay.style.display = "none";
    if (loginModal) loginModal.style.display = "none"; // Refresh par automatic popup nahi khulega

    // Agar bina login ke koi account page me ghuse, toh home page par phenko
    if (isAccountPage) {
      console.log("Unauthorized access attempt. Redirecting to home...");
      window.location.href = "index.html"; 
    }
  }
});

// ==========================================================================
// 📥 4. DATABASE FETCH ENGINE (Firestore Se Asli Data Khinchne Wala Function)
// ==========================================================================
async function fetchPropertiesFromDatabase() {
  try {
    console.log("⏳ Connecting to Firestore...");
    // collection 'pghub_properties' se live documents load karo
    const querySnapshot = await getDocs(collection(db, "pghub_properties"));
    const roomsList = [];

    querySnapshot.forEach((doc) => {
      // Document ID aur data object ko merge kiya
      roomsList.push({ id: doc.id, ...doc.data() });
    });

    console.log("✅ Successfully Fetched Live Rooms:", roomsList.length);
    
    // Agar script.js ka card rendering function available hai toh data transfer karo
    if (typeof window.renderRoomsOnDOM === "function") {
      window.renderRoomsOnDOM(roomsList);
    }

  } catch (error) {
    console.error("❌ Database se data load karne me error: ", error);
  }
}

// Page initialize hote hi automatic data pipeline call karo
fetchPropertiesFromDatabase();

// ==========================================================================
// 🕹️ 5. ROOM CARD CLICK LOGIC (Dynamic Details Router System)
// ==========================================================================
window.handleRoomClick = (roomId) => {
  if (auth.currentUser) {
    // ✅ User logged in hai -> Script.js ke dynamic engine ko bolkar data display karo
    console.log("Access Granted! Loading Dynamic Room Data for ID:", roomId);
    if (typeof window.loadRoomDetailPage === "function") {
      window.loadRoomDetailPage(roomId);
    }
  } else {
    // 🔒 User login nahi hai -> Instant login modal throw karo
    console.log("Access Denied! Login Required for Room ID:", roomId);
    window.handleLoginClick(); 
  }
};

// ==========================================================================
// 🌐 6. GOOGLE SIGN IN LOGIC
// ==========================================================================
window.loginWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Google Auth Success:", result.user);
    })
    .catch((error) => {
      console.error("Google Auth Error:", error.message);
      alert("Google Login Failed: " + error.message);
    });
};

// ==========================================================================
// 📱 7. PHONE OTP SIGN IN LOGIC
// ==========================================================================
window.sendOTPCode = () => {
  const numField = document.getElementById("phoneNumber");
  if (!numField || !numField.value) {
    alert("Please enter a 10 digit mobile number!");
    return;
  }

  const fullNumber = "+91" + numField.value.trim();

  // Invisible reCAPTCHA - Best for Mobile Phones
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
  }

  signInWithPhoneNumber(auth, fullNumber, window.recaptchaVerifier)
    .then((confirmationResult) => {
      confirmationResultGlobal = confirmationResult;
      
      // UI toggle: Phone interface chhupao, OTP stage dikhao
      document.getElementById("phoneStage").style.display = "none";
      document.getElementById("otpStage").style.display = "block";
      console.log("OTP code dispatched successfully.");
    })
    .catch((error) => {
      console.error("SMS Dispatch Error:", error.message);
      alert("Error sending OTP: " + error.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    });
};

window.verifyOTP = () => {
  const otpField = document.getElementById("otpCode");
  if (!otpField || !otpField.value || !confirmationResultGlobal) {
    alert("Please enter the 6-digit OTP code!");
    return;
  }

  const code = otpField.value.trim();
  confirmationResultGlobal.confirm(code)
    .then((result) => {
      console.log("Phone Auth Success:", result.user);
    })
    .catch((error) => {
      console.error("OTP Validation Error:", error.message);
      alert("Invalid OTP code! Please double check.");
    });
};

// ==========================================================================
// 🎛️ 8. UI MODAL CONTROLS (MANUAL TOGGLES)
// ==========================================================================
window.handleLoginClick = () => {
  const loginModal = document.getElementById("loginModal");
  if (loginModal) {
    // Reset modal state to phone phase on every fresh open
    document.getElementById("phoneStage").style.display = "block";
    document.getElementById("otpStage").style.display = "none";
    loginModal.style.display = "flex"; 
  }
};

window.handleAccountClick = () => {
  if (auth.currentUser) {
    window.location.href = "account.html";
  } else {
    window.handleLoginClick();
  }
};

window.closeLoginModal = () => {
  console.log("Closing Login Modal Screen...");
  const loginModal = document.getElementById("loginModal");
  if (loginModal) {
    loginModal.style.display = "none";
  }
};
