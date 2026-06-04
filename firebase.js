// ==========================================================================
// 📥 FIREBASE SDK IMPORTS
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ==========================================================================
// ⚙️ FIREBASE CONFIGURATION (🔒 FIXED WITH DEMO API KEYS FOR LIVE SERVER)
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let confirmationResultGlobal = null;

// ==========================================================================
// 🚀 1. AUTH STATE WATCHER (🔒 No Automatic Popup / Safe Refresh Mode)
// ==========================================================================
onAuthStateChanged(auth, (user) => {
  const loginText = document.getElementById("loginText");
  const userNumberDisplay = document.getElementById("userNumberDisplay");
  const loginModal = document.getElementById("loginModal");
  const isAccountPage = window.location.pathname.includes("account.html");

  if (user) {
    console.log("Active Session Verified:", user.uid);
    // User login hai toh modal hamesha band rakho
    if (loginModal) loginModal.style.display = "none"; 
    if (loginText) loginText.style.display = "none";

    // Header me login wale text ki jagah name ya number dikhao
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
    console.log("No Session Active (Logged Out State)");
    if (loginText) loginText.style.display = "inline-block";
    if (userNumberDisplay) userNumberDisplay.style.display = "none";
    
    // 🛡️ REFRESH FIX: Page load ya refresh hone par popup AUTOMATIC NAHI KHULEGA!
    if (loginModal) loginModal.style.display = "none"; 

    // Unauthorized log ko account page se home page par phenko
    if (isAccountPage) {
      window.location.href = "index.html"; 
    }
  }
});

// ==========================================================================
// 🕹️ 2. ROOM CARD CLICK LOGIC (Flipkart Style Instant Popup)
// ==========================================================================
window.handleRoomClick = (roomId) => {
  if (auth.currentUser) {
    // ✅ User logged in hai -> Seedha Detail page section kholo
    console.log("Access Granted! Opening Room ID:", roomId);
    
    const homePage = document.getElementById("homePage");
    const detailPage = document.getElementById("detailPage");
    
    if (homePage && detailPage) {
      homePage.style.display = "none";
      detailPage.style.display = "block";
      window.scrollTo(0, 0); // Upar scroll karne ke liye
    }
  } else {
    // 🔒 User login nahi hai -> Usi waqt popup screen par laao!
    console.log("Access Denied! Triggering Login Popup for Room ID:", roomId);
    window.handleLoginClick(); 
  }
};

// ==========================================================================
// 🌐 3. GOOGLE SIGN IN LOGIC
// ==========================================================================
window.loginWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Google Sign-In Successful:", result.user);
    })
    .catch((error) => {
      console.error("Google Sign-In Error:", error.message);
      alert("Google Login Failed: " + error.message);
    });
};

// ==========================================================================
// 📱 4. PHONE OTP SIGN IN LOGIC
// ==========================================================================
window.sendOTPCode = () => {
  const numField = document.getElementById("phoneNumber");
  if (!numField || !numField.value) {
    alert("Please enter a 10 digit mobile number!");
    return;
  }

  const fullNumber = "+91" + numField.value.trim();

  // Invisible reCAPTCHA setup
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
  }

  signInWithPhoneNumber(auth, fullNumber, window.recaptchaVerifier)
    .then((confirmationResult) => {
      confirmationResultGlobal = confirmationResult;
      
      // Phone block chhupao aur OTP block dikhao
      document.getElementById("phoneStage").style.display = "none";
      document.getElementById("otpStage").style.display = "block";
      console.log("OTP Sent Successfully!");
    })
    .catch((error) => {
      console.error("OTP Error:", error.message);
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
      console.log("Phone Auth Successful:", result.user);
    })
    .catch((error) => {
      console.error("OTP Verification Error:", error.message);
      alert("Invalid OTP code! Please try again.");
    });
};

// ==========================================================================
// 🎛️ 5. MODAL MANUAL INTERFACES CONTROLS (Toggles)
// ==========================================================================
window.handleLoginClick = () => {
  const loginModal = document.getElementById("loginModal");
  if (loginModal) {
    // Reset inputs whenever modal opens
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
  console.log("Closing Login Modal...");
  const loginModal = document.getElementById("loginModal");
  if (loginModal) {
    loginModal.style.display = "none";
  }
};
