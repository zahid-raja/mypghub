// ==========================================================================
// FINAL BULLETPROOF FIREBASE SETUP (LAPTOP UNTOUCHED + MOBILE POPUP FIX)
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup
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
// Google screen har baar account choose karne ka option degi
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

// 3. GOOGLE LOGIN FUNCTION (💻 Laptop jaisa chal raha tha waisa hi rahega, 📱 Mobile me Redirect band karke Popup lagaya)
window.loginWithGoogle = () => {
  if (window.innerWidth < 768) {
    console.log("Mobile detected: Using Safe Popup Method to break the redirect loop...");
  } else {
    console.log("Laptop detected: Using original Popup Method (No change)...");
  }

  // Universal Popup login - Yeh GitHub pages par redirect loop ko jad se khatam kar dega
  signInWithPopup(auth, googleProvider)
    .then((result) => {
      console.log("Google Login Successful:", result.user);
      alert("Logged in successfully with Google!");
      if (window.closeLoginModal) window.closeLoginModal();
    })
    .catch((error) => {
      console.error("Google Auth Error:", error);
      if (error.code === "auth/popup-blocked") {
        alert("Please allow popups for this site in your browser settings or try again!");
      } else {
        alert("Google Login Failed: " + error.message);
      }
    });
};

// ==========================================================================
// 🚀 CLEAN & LAG-FREE STATE MONITOR (FIXED: ACCOUNT BUTTON WORKING)
// ==========================================================================
onAuthStateChanged(auth, (user) => {
  const loginText = document.getElementById("loginText");
  const userNumberDisplay = document.getElementById("userNumberDisplay");
  const loginModal = document.getElementById("loginModal");

  // 🎬 SKELETON REMOVER
  const skeleton = document.getElementById("youtubeSkeleton");
  const realContent = document.getElementById("realContent");
  
  if (skeleton) { skeleton.remove(); }
  if (realContent) { realContent.classList.remove("hidden-content"); }

  // Initial State: Jab tak check ho raha hai, jhatke se bachne ke liye modal flex mat karo
  if (loginModal) {
    loginModal.style.display = "none";
  }

  if (user) {
    // 1. User Login Hai -> Modal Hatao aur Details Dikhao
    console.log("User active session found:", user.uid);
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
    // 2. User Logged Out Hai -> Default Guest Mode
    console.log("No active user session.");
    if (loginText) {
      loginText.style.display = "inline-block";
      loginText.innerText = "Login";
    }
    if (userNumberDisplay) {
      userNumberDisplay.style.display = "none";
      userNumberDisplay.innerText = "";
    }

    // Agar confirm ho gaya ki koi user nahi hai, tabhi modal ko 'flex' karo
    if (loginModal) {
      loginModal.style.display = "flex"; 
    }
  }
});

// ROUTING CONTROLS (Yeh ab ekdum sahi chalenge)
window.handleLoginClick = () => {
  if (!auth.currentUser) {
    if (window.openLoginModal) window.openLoginModal();
  }
};

window.handleAccountClick = () => {
  window.location.href = "account.html";
};
