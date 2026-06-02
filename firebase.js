// ==========================================================================
// COMPLETE & FINAL FIREBASE SETUP WITH INTEGRATED NAVIGATION LOGIC
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

// Updated Connection Credentials
const firebaseConfig = {
  apiKey: "AIzaSyCxP405IU4nljGIF9LzA4WeVLVk2kb8OEU",
  authDomain: "mypghub-68a0f.firebaseapp.com",
  projectId: "mypghub-68a0f",
  storageBucket: "mypghub-68a0f.firebasestorage.app",
  messagingSenderId: "128487472086",
  appId: "1:128487472086:web:6e4daabb527b0f2abb4277",
  measurementId: "G-EV19LWYTZ3"
};

// Initialize Core App & Auth
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
window.auth = auth; // Script.js aur HTML ke globally usage ke liye

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

// 1. "Send OTP" Button Logic (Stage A)
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
      // UI Change: Phone hide karo, OTP show karo
      document.getElementById("phoneStage").style.display = "none";
      document.getElementById("otpStage").style.display = "block";
      alert("OTP sent successfully!");
    })
    .catch((error) => {
      console.error("Error during sendOTP:", error);
      alert("Error sending OTP: " + error.message);
    });
};

// 2. "Verify & Login" Button Logic (Stage B)
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

// ==========================================================================
// UPDATED STATE MONITOR: HIDE LOGIN BUTTON & SHOW 4 DIGITS
// ==========================================================================
onAuthStateChanged(auth, (user) => {
  const loginText = document.getElementById("loginText");
  const userNumberDisplay = document.getElementById("userNumberDisplay");

  if (user) {
    // 1. Agar user logged in hai:
    let rawNumber = user.phoneNumber ? user.phoneNumber.replace("+91", "") : "";
    let firstFourDigits = rawNumber.substring(0, 4);

    // Login text ko chhupao (Hide)
    if (loginText) {
      loginText.style.display = "none";
    }

    // Number wale element me "7033..." daalo aur use dikhao (Show)
    if (userNumberDisplay && firstFourDigits) {
      userNumberDisplay.innerText = firstFourDigits + "...";
      userNumberDisplay.style.display = "inline-block"; 
    }
    console.log("User logged in. Hiding 'Login' button, showing digits.");

  } else {
    // 2. Agar user logged out hai (Guest Mode):
    // Login button ko wapas dikhao (Show)
    if (loginText) {
      loginText.style.display = "inline-block";
      loginText.innerText = "Login";
    }

    // Number wale box ko chhupao (Hide)
    if (userNumberDisplay) {
      userNumberDisplay.style.display = "none";
      userNumberDisplay.innerText = "";
    }
    console.log("No user active. Showing 'Login' button.");
  }
});

// ==========================================================================
// CLICKS AND ROUTING CONTROLS FOR INDEX.HTML ELEMENTS
// ==========================================================================

// Login text par click karne se popup tabhi khulega jab user guest ho
window.handleLoginClick = () => {
  if (!auth.currentUser) {
    if (window.openLoginModal) window.openLoginModal();
  }
};

// Account text par click hote hi direct account.html open ho jayega
window.handleAccountClick = () => {
  window.location.href = "account.html";
};