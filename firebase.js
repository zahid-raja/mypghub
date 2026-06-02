// ==========================================================================
// COMPLETE FIREBASE SETUP WITH MOBILE-FRIENDLY RE-DIRECT & SKELETON TRIGGER
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult 
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

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
export const auth = getAuth(app);
window.auth = auth;

const googleProvider = new GoogleAuthProvider();
let confirmationResult = null;

// Invisible reCAPTCHA setup
function setupRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        console.log("reCAPTCHA verified automatically!");
      }
    });
  }
}

// 1. PHONE OTP - Send OTP Code
window.sendOTPCode = () => {
  const phoneInput = document.getElementById("phoneNumber");
  const phone = phoneInput ? phoneInput.value.trim() : "";

  if (phone.length !== 10 || isNaN(phone)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  setupRecaptcha();
  const fullPhoneNumber = "+91" + phone;
  const appVerifier = window.recaptchaVerifier;

  signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier)
    .then((result) => {
      window.confirmationResult = result;
      document.getElementById("phoneStage").style.display = "none";
      document.getElementById("otpStage").style.display = "block";
      alert("OTP sent successfully!");
    })
    .catch((error) => {
      console.error("Error during sendOTP:", error);
      alert("Error sending OTP: " + error.message);
    });
};

// 2. PHONE OTP - Verify OTP Code
window.verifyOTP = () => {
  const otpInput = document.getElementById("otpCode");
  const code = otpInput ? otpInput.value.trim() : "";

  if (code.length !== 6 || isNaN(code)) {
    alert("Please enter a valid 6-digit OTP.");
    return;
  }

  const confirmationResult = window.confirmationResult;
  if (!confirmationResult) {
    alert("Session expired. Please click 'Send OTP' again.");
    return;
  }

  confirmationResult.confirm(code)
    .then((result) => {
      alert("Logged in successfully!");
      if (window.closeLoginModal) window.closeLoginModal();
    })
    .catch((error) => {
      console.error("Verification Error:", error);
      alert("Invalid OTP! Please try again.");
    });
};

// 3. GOOGLE LOGIN FUNCTION (💻 Laptop me Popup, 📱 Mobile me Redirect)
window.loginWithGoogle = () => {
  if (window.innerWidth < 768) {
    console.log("Mobile detected, using Redirect method...");
    signInWithRedirect(auth, googleProvider);
  } else {
    console.log("Desktop detected, using Popup method (No Change)...");
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        alert("Logged in successfully with Google!");
        if (window.closeLoginModal) window.closeLoginModal();
      })
      .catch((error) => {
        console.error("Google Auth Popup Error:", error);
        alert("Google Login Failed: " + error.message);
      });
  }
};

// 🔄 MOBILE REDIRECT HANDLING (Yeh variable login screen ko baar-baar aane se rokega)
let isRedirectChecking = true; 

getRedirectResult(auth)
  .then((result) => {
    isRedirectChecking = false; // Checking poori hui
    if (result && result.user) {
      console.log("Mobile redirect login successful!", result.user);
      alert("Logged in successfully with Google!");
      if (window.closeLoginModal) window.closeLoginModal();
    }
  })
  .catch((error) => {
    isRedirectChecking = false; // Error aaya toh bhi checking band
    console.error("Google Auth Redirect Error:", error);
    alert("Login Error: " + error.message);
  });

// ==========================================================================
// 🚀 LAG-FREE SMART STATE MONITOR (LAPTOP + MOBILE OPTIMIZED)
// ==========================================================================
onAuthStateChanged(auth, (user) => {
  const loginText = document.getElementById("loginText");
  const userNumberDisplay = document.getElementById("userNumberDisplay");
  const loginModal = document.getElementById("loginModal");

  // 🎬 SKELETON REMOVER: Skeleton ko delete marenge taaki mobile smooth chale
  const skeleton = document.getElementById("youtubeSkeleton");
  const realContent = document.getElementById("realContent");
  
  if (skeleton) {
    skeleton.remove(); 
  }
  if (realContent) {
    realContent.classList.remove("hidden-content"); 
  }

  if (user) {
    // 1. User Login Hai (Success Zone)
    console.log("User is already logged in:", user.uid);
    if (loginModal) loginModal.style.display = "none"; 
    if (loginText) loginText.style.display = "none";

    if (userNumberDisplay) {
      if (user.phoneNumber) {
        let rawNumber = user.phoneNumber.replace("+91", "");
        userNumberDisplay.innerText = rawNumber.substring(0, 4) + "...";
      } else if (user.displayName) {
        let shortName = user.displayName.split(" ")[0];
        userNumberDisplay.innerText = shortName;
      } else {
        userNumberDisplay.innerText = "User";
      }
      userNumberDisplay.style.display = "inline-block";
    }
  } else {
    // 2. User Logged Out Hai (Guest Mode)
    console.log("No active user session found.");
    if (loginText) {
      loginText.style.display = "inline-block";
      loginText.innerText = "Login";
    }
    if (userNumberDisplay) {
      userNumberDisplay.style.display = "none";
      userNumberDisplay.innerText = "";
    }

    // 🔥 FIX: Jab mobile me email select karke page wapas khulega, toh jab tak Firebase backend me 
    // user check kar raha hai, tab tak login screen (modal) nahi khulegi!
    if (!isRedirectChecking) {
      if (loginModal) {
        loginModal.style.display = "flex"; 
      }
    } else {
      if (loginModal) {
        loginModal.style.display = "none"; 
      }
    }
  }
});

// ROUTING CONTROLS
window.handleLoginClick = () => {
  if (!auth.currentUser) {
    if (window.openLoginModal) window.openLoginModal();
  }
};

window.handleAccountClick = () => {
  window.location.href = "account.html";
};
