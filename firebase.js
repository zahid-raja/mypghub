// ==========================================================================
// UNIVERSAL COMPATIBLE FIREBASE SETUP FOR LAPTOP (POPUP) & MOBILE (REDIRECT)
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
googleProvider.setCustomParameters({ prompt: 'select_account' });

let confirmationResult = null;

function setupRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => { console.log("reCAPTCHA verified!"); }
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
      console.error("Error sending OTP:", error);
      alert("Error: " + error.message);
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
      alert("Invalid OTP! Please try again.");
    });
};

// 3. GOOGLE LOGIN FUNCTION
window.loginWithGoogle = () => {
  if (window.innerWidth < 768) {
    console.log("Mobile redirect standard processing initiated...");
    // Redirect karne se pehle lock laga dete hain taaki modal galti se na khule
    sessionStorage.setItem("isAuthProcessing", "true");
    signInWithRedirect(auth, googleProvider);
  } else {
    console.log("Desktop popup initiated...");
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        alert("Logged in successfully!");
        if (window.closeLoginModal) window.closeLoginModal();
      })
      .catch((error) => {
        console.error("Popup Error:", error);
      });
  }
};

// 🔥 HANDLE MOBILE REDIRECT RESULT
getRedirectResult(auth)
  .then((result) => {
    sessionStorage.removeItem("isAuthProcessing"); // Lock hatao
    if (result && result.user) {
      console.log("Mobile login success!", result.user);
      if (window.closeLoginModal) window.closeLoginModal();
    }
  })
  .catch((error) => {
    sessionStorage.removeItem("isAuthProcessing");
    console.error("Redirect handler error:", error);
  });

// ==========================================================================
// 🚀 SMART STATE MONITOR (LOOP BREAK LOGIC)
// ==========================================================================
onAuthStateChanged(auth, (user) => {
  const loginText = document.getElementById("loginText");
  const userNumberDisplay = document.getElementById("userNumberDisplay");
  const loginModal = document.getElementById("loginModal");

  const skeleton = document.getElementById("youtubeSkeleton");
  const realContent = document.getElementById("realContent");
  
  if (skeleton) skeleton.remove(); 
  if (realContent) realContent.classList.remove("hidden-content"); 

  if (user) {
    // User login ho chuka hai
    sessionStorage.removeItem("isAuthProcessing");
    if (loginModal) loginModal.style.display = "none"; 
    if (loginText) loginText.style.display = "none";

    if (userNumberDisplay) {
      let shortName = user.displayName ? user.displayName.split(" ")[0] : "User";
      userNumberDisplay.innerText = user.phoneNumber ? user.phoneNumber.replace("+91", "").substring(0, 4) + "..." : shortName;
      userNumberDisplay.style.display = "inline-block";
    }
  } else {
    // User logged out hai
    if (loginText) {
      loginText.style.display = "inline-block";
      loginText.innerText = "Login";
    }
    if (userNumberDisplay) {
      userNumberDisplay.style.display = "none";
    }

    // 🔥 LOOP LOCK CHECK: Agar background me redirect ka kaam chal raha hai, toh modal ko hide rakho
    const isProcessing = sessionStorage.getItem("isAuthProcessing");
    if (isProcessing === "true") {
      if (loginModal) loginModal.style.display = "none";
    } else {
      if (loginModal) loginModal.style.display = "flex"; 
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
