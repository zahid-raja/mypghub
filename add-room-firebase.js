import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// ☁️ Firebase Storage module
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ⚙️ Firebase Configuration
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
const db = getFirestore(app);
const storage = getStorage(app); 

let isLiveLocationCaptured = false;
let savedLatitude = "";
let savedLongitude = "";
let currentStep = 1;

// 🧠 1. Smart Back Button Logic
window.handleSmartBack = () => {
  if (currentStep === 2) {
    document.getElementById('part2-roomDetails').style.display = 'none';
    document.getElementById('part1-verification').style.display = 'block';
    currentStep = 1;
    window.scrollTo(0, 0);
  } else {
    window.history.back();
  }
};

// 🛰️ 2. Live GPS Location Lock (HIGH ACCURACY SATELLITE MODE ENABLED)
window.fetchLiveLocation = () => {
  const box = document.getElementById('locationConfirmationBox');
  const statusText = document.getElementById('locationStatusText');
  
  if (navigator.geolocation) {
    statusText.innerText = "⏳ Status: Satellites se direct connection bana rhe hain...";
    
    navigator.geolocation.getCurrentPosition((position) => {
      savedLatitude = position.coords.latitude;
      savedLongitude = position.coords.longitude;
      isLiveLocationCaptured = true;
      
      box.className = "location-box location-success";
      statusText.innerHTML = `✅ GPS Location Locked!<br><span style="font-size:11px; color:#7f8c8d;">(Lat ${savedLatitude.toFixed(4)}, Lon ${savedLongitude.toFixed(4)})</span>`;
    }, () => {
      statusText.innerText = "❌ Location Failed! Phone GPS ON karke firse try karein.";
      isLiveLocationCaptured = false;
    }, 
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }); // Pinpoint accurate settings
  } else {
    statusText.innerText = "❌ Browser GPS support nahi karta.";
  }
};

// 🍽️ 3. Mess Toggle
window.toggleMessOptions = (value) => {
  const panel = document.getElementById('messOptionsPanel');
  panel.style.display = (value === 'Yes') ? 'block' : 'none';
};

// 📸 4. Aadhaar Validation Filter
window.validateAadhaarPhoto = (input) => {
  const file = input.files[0];
  const statusText = document.getElementById('aadhaarStatusText');
  const previewImg = document.getElementById('aadhaarPreviewImg');

  if (file) {
    const sizeKB = file.size / 1024;
    if (sizeKB < 100) {
      alert("❌ Photo rejected! Quality bohot kharab hai (100KB se kam hai). Clear photo kheechein.");
      input.value = "";
      previewImg.style.display = 'none';
      return;
    }
    statusText.innerText = `Approved! Size: ${sizeKB.toFixed(1)} KB ✅`;
    statusText.style.color = "green";
    
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      previewImg.style.display = 'block';
    }
    reader.readAsDataURL(file);
  }
};

// 📱 5. OTP Simulation Send
window.simulateOTPSend = () => {
  const name = document.getElementById('ownerName').value.trim();
  const house = document.getElementById('houseName').value.trim();
  const phone = document.getElementById('ownerPhone').value.trim();

  if (!name || !house || phone.length !== 10) {
    alert("❌ Please fill all details & enter 10 digit phone number!");
    return;
  }
  if (!isLiveLocationCaptured) {
    alert("❌ Live GPS Location lock karna zaroori hai!");
    return;
  }

  document.getElementById('otpInputBox').style.display = 'block';
  alert(`Test OTP sent! Use code: 123456`);
};

// 🔑 6. Verify OTP
window.verifyOTPAndProceed = () => {
  const code = document.getElementById('otpCode').value;
  if (code === "123456") {
    alert("✅ Mobile Verified!");
    document.getElementById('part1-verification').style.display = 'none';
    document.getElementById('part2-roomDetails').style.display = 'block';
    currentStep = 2;
    window.scrollTo(0, 0);
  } else {
    alert("❌ Invalid OTP!");
  }
};

// ⚡ IMAGE COMPRESSION HELPER FUNCTION (Background Canvas Engine)
function compressMainImageEngine(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Auto Resize Dimensions (Max 800px width/height)
        const max_size = 800;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 0.7 means 70% high quality but extremely low size string
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
    reader.onerror = (error) => reject(error);
  });
}

// 🚀 7. Firestore Submit (COMPRESSED & CORS-FREE ENGINE)
window.finalSubmitForm = async () => {
  const pgType = document.getElementById('pgType').value;
  const sharingType = document.getElementById('sharingType').value;
  const foodService = document.getElementById('foodService').value;
  const price = document.getElementById('roomPrice').value;
  const desc = document.getElementById('description').value.trim();
  
  const mainPhotoFile = document.getElementById('mainPhotoInput').files[0];

  if (!pgType || !sharingType || !foodService || !price || !desc) {
    alert("❌ Please fill all mandatory fields!");
    return;
  }
  if (!mainPhotoFile) {
    alert("❌ Main Building Photo upload karna mandatory hai!");
    return;
  }

  try {
    alert("⏳ Photo ko background me compress aur compress karke register kar rhe hain... Kripya thoda wait karein.");

    // 🔥 DYNAMIC EXTRA COMPRESSION: Badi string ko small base64 me badla
    const compressedBase64PhotoUrl = await compressMainImageEngine(mainPhotoFile);
    console.log("✅ Heavy photo optimized and compressed successfully!");

    // 🚀 Data direct Firestore ke usi purane dabbe 'pghub_properties' me save ho raha hai
    const propertyData = {
      ownerName: document.getElementById('ownerName').value.trim(),
      houseName: document.getElementById('houseName').value.trim(),
      ownerEmail: document.getElementById('ownerEmail').value.trim(),
      manualAddress: document.getElementById('manualAddress').value.trim(),
      pincodeCity: document.getElementById('pincodeCity').value.trim(),
      ownerPhone: document.getElementById('ownerPhone').value.trim(),
      location: { latitude: Number(savedLatitude), longitude: Number(savedLongitude) },
      pgType: pgType,
      sharingType: sharingType,
      roomPrice: Number(price),
      description: desc,
      specifications: {
        attachedBathroom: document.getElementById('roomAttachedBathroom').checked,
        balconyAvailable: document.getElementById('roomBalcony').checked,
        fullyFurnished: document.getElementById('roomFullyFurnished').checked
      },
      amenities: {
        wifi: document.getElementById('facWiFi').checked,
        cooler: document.getElementById('facCooler').checked,
        ac: document.getElementById('facAC').checked,
        bed: document.getElementById('facBed').checked,
        parking: document.getElementById('facParking').checked
      },
      messDetails: {
        provided: foodService,
        breakfast: document.getElementById('messBreakfast').checked,
        lunch: document.getElementById('messLunch').checked,
        dinner: document.getElementById('messDinner').checked,
        category: document.getElementById('foodCategory').value
      },
      rules: {
        gateClosingTime: document.getElementById('gateTime').value,
        noSmoking: document.getElementById('ruleNoSmoking').checked,
        noMusic: document.getElementById('ruleNoMusic').checked,
        noCooking: document.getElementById('ruleNoCooking').checked
      },
      mainPhotoUrl: compressedBase64PhotoUrl, // 👈 Compressed super light text format string
      createdAt: new Date()
    };

    await addDoc(collection(db, "pghub_properties"), propertyData);
    alert("🎉 Mubarak ho! Aapka PG asli photo ke sath live ho gaya hai.");
    window.location.href = "index.html";

  } catch (error) {
    console.error("Upload error:", error);
    alert("❌ Error: Data save nahi ho paya. Console check karein.");
  }
};
