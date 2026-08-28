import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const auth = getAuth(app);

let currentStep = 1;
let currentUser = null;

// Firebase Auth State Monitor
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    if (!document.getElementById('ownerEmail').value && user.email) {
      document.getElementById('ownerEmail').value = user.email;
    }
    if (!document.getElementById('ownerPhone').value && user.phoneNumber) {
      document.getElementById('ownerPhone').value = user.phoneNumber.replace("+91", "");
    }
  } else {
    alert("Please log in from the Account Page before registering properties.");
    window.location.href = "account.html";
  }
});

// Back navigation workflows
document.getElementById('backBtn').addEventListener('click', () => {
  if (currentStep === 2) {
    document.getElementById('part2-form').classList.remove('active');
    document.getElementById('part1-form').classList.add('active');
    currentStep = 1;
    window.scrollTo(0, 0);
  } else {
    window.history.back();
  }
});

// Structural UI panel toggles
document.getElementById('chkFlat').addEventListener('change', (e) => { document.getElementById('flatPanel').style.display = e.target.checked ? 'block' : 'none'; });
document.getElementById('chkRoom').addEventListener('change', (e) => { document.getElementById('roomPanel').style.display = e.target.checked ? 'block' : 'none'; });

const setupSubToggle = (checkId, fieldsId) => {
  document.getElementById(checkId).addEventListener('change', (e) => { document.getElementById(fieldsId).style.display = e.target.checked ? 'block' : 'none'; });
};
setupSubToggle('chk1BHK', 'fields1BHK'); 
setupSubToggle('chk2BHK', 'fields2BHK'); 
setupSubToggle('chk3BHK', 'fields3BHK'); 
setupSubToggle('chkSingle', 'fieldsSingle'); 
setupSubToggle('chkDouble', 'fieldsDouble'); 
setupSubToggle('chktriple', 'fieldsTriple'); 

// AUTOMATIC MIRRORING MECHANISM
document.getElementById('applyBothMaster').addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  const rowElements = document.querySelectorAll('.amenities-group-body tr');
  rowElements.forEach(row => {
    const flatBox = row.querySelector('.flat-amenity');
    const roomBox = row.querySelector('.room-amenity');
    if (isChecked) roomBox.checked = flatBox.checked;
  });
});

document.querySelectorAll('.amenities-group-body').forEach(body => {
  body.addEventListener('change', (e) => {
    const isMasterChecked = document.getElementById('applyBothMaster').checked;
    if (!isMasterChecked) return;
    if (e.target.classList.contains('flat-amenity')) {
      e.target.closest('tr').querySelector('.room-amenity').checked = e.target.checked;
    } else if (e.target.classList.contains('room-amenity')) {
      e.target.closest('tr').querySelector('.flat-amenity').checked = e.target.checked;
    }
  });
});

// Live server pincode mapping detection
document.getElementById('pincode').addEventListener('input', async (e) => {
  const pinInput = e.target.value.trim();
  const cityStateField = document.getElementById('cityState');
  if (pinInput.length === 6) {
    cityStateField.value = "Fetching details... ⏳";
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pinInput}`);
      const data = await response.json();
      if (data[0].Status === "Success") {
        cityStateField.value = `${data[0].PostOffice[0].District}, ${data[0].PostOffice[0].State}`;
      } else {
        cityStateField.value = "";
        alert("Invalid Pincode! Please input an authenticated 6-digit postal code.");
      }
    } catch (error) {
      console.error(error);
      cityStateField.value = "";
    }
  } else {
    cityStateField.value = "";
  }
});

function compressPhotoBlob(file) {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas'); let width = img.width, height = img.height, max_dimension = 700;
        if (width > height ? (width > max_dimension && (height *= max_dimension / width, width = max_dimension)) : (height > max_dimension && (width *= max_dimension / height, height = max_dimension)));
        canvas.width = width; canvas.height = height; canvas.getContext('2d').drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
    };
  });
}

// STEP 1: ONBOARDING JUMP & BACKGROUND OWNER SYNC
document.getElementById('nextBtn').addEventListener('click', async () => {
  if (!currentUser) {
    alert("Authentication state missing. Please refresh or login again.");
    return;
  }

  const name = document.getElementById('ownerName').value.trim();
  const phone = document.getElementById('ownerPhone').value.trim();
  const email = document.getElementById('ownerEmail').value.trim();
  const tcCheck = document.getElementById('tcCheckbox').checked;

  if (!name || phone.length !== 10 || !email) { 
    alert("Please complete all owner profile attributes accurately."); 
    return; 
  }
  if (!tcCheck) { 
    alert("Acceptance of Terms & Conditions is required to advance to the next step."); 
    return; 
  }

  document.getElementById('nextBtn').innerText = "Processing Profile... ⏳";
  document.getElementById('nextBtn').disabled = true;

  try {
    await setDoc(doc(db, "owners", currentUser.uid), {
      name: name,
      phone: phone,
      email: email,
      isOwner: true,
      registeredAt: new Date()
    }, { merge: true });

    localStorage.setItem("isOwner", "true");

    document.getElementById('part1-form').classList.remove('active'); 
    document.getElementById('part2-form').classList.add('active'); 
    currentStep = 2; 
    window.scrollTo(0, 0);

  } catch (error) {
    console.error("Owner Registration Error:", error);
    alert("Profile setup failed: " + error.message);
  } finally {
    document.getElementById('nextBtn').innerText = "Next Step ➡️";
    document.getElementById('nextBtn').disabled = false;
  }
});

// STEP 2: PROPERTY REGISTRATION SUBMIT SYSTEM
document.getElementById('submitBtn').addEventListener('click', async () => {
  if (!currentUser) return;

  const hName = document.getElementById('houseName').value.trim(), pgType = document.getElementById('pgType').value, pin = document.getElementById('pincode').value.trim(), cState = document.getElementById('cityState').value.trim(), address = document.getElementById('exactAddress').value.trim(), college = document.getElementById('famousCollege').value.trim(), mainPhotoFile = document.getElementById('mainBuildingImg').files[0];
  if (!hName || !pgType || !pin || !cState || cState.includes("Fetching") || !address || !college || !mainPhotoFile) { alert("Please fill all required mandatory inputs and verify your location database records."); return; }

  const checkInventory = (chkId, totId, vacId, label) => {
    if (document.getElementById(chkId).checked) {
      if ((Number(document.getElementById(vacId).value) || 0) > (Number(document.getElementById(totId).value) || 0)) { alert(`Error validation match: Vacant space count in ${label} cannot exceed defined absolute totals.`); return false; }
    }
    return true;
  };
  if (document.getElementById('chkFlat').checked ? (!checkInventory('chk1BHK', 'tot1BHK', 'vac1BHK', '1 BHK Flat') || !checkInventory('chk2BHK', 'tot2BHK', 'vac2BHK', '2 BHK Flat') || !checkInventory('chk3BHK', 'tot3BHK', 'vac3BHK', '3 BHK Flat')) : false) return;
  if (document.getElementById('chkRoom').checked ? (!checkInventory('chkSingle', 'totSingle', 'vacSingle', 'Single Room') || !checkInventory('chkDouble', 'totDouble', 'vacDouble', 'Double Room') || !checkInventory('chktriple', 'totTriple', 'vacTriple', 'Triple Room')) : false) return;

  try {
    document.getElementById('submitBtn').innerText = "Uploading Assets... ⏳";
    document.getElementById('submitBtn').disabled = true;

    const compressedMainPhoto = await compressPhotoBlob(mainPhotoFile);
    let masterPhotosListArray = [compressedMainPhoto];
    let flatsCollectionData = null, roomsCollectionData = null;

    // Upgraded Helper to process arrays from window.propertyImagesStorage
    const getCompressedImagesArray = async (imgId) => {
      const compressedList = [];
      const filesArray = (window.propertyImagesStorage && window.propertyImagesStorage[imgId]) ? window.propertyImagesStorage[imgId] : [];
      for (let file of filesArray) {
        const comp = await compressPhotoBlob(file);
        if (comp) {
          compressedList.push(comp);
          masterPhotosListArray.push(comp); // Backup master array pool
        }
      }
      return compressedList;
    };

    if (document.getElementById('chkFlat').checked) {
      flatsCollectionData = {};
      const packFlat = async (chk, imgId, totId, vacId, rentId, key) => {
        if (document.getElementById(chk).checked) {
          const imagesArray = await getCompressedImagesArray(imgId);
          flatsCollectionData[key] = { 
            total: Number(document.getElementById(totId).value)||0, 
            vacant: Number(document.getElementById(vacId).value)||0, 
            rent: Number(document.getElementById(rentId).value)||0, 
            images: imagesArray,
            active: true 
          };
        }
      };
      await packFlat('chk1BHK', 'img1BHK', 'tot1BHK', 'vac1BHK', 'rent1BHK', 'bhk1'); 
      await packFlat('chk2BHK', 'img2BHK', 'tot2BHK', 'vac2BHK', 'rent2BHK', 'bhk2'); 
      await packFlat('chk3BHK', 'img3BHK', 'tot3BHK', 'vac3BHK', 'rent3BHK', 'bhk3');
    }

    if (document.getElementById('chkRoom').checked) {
      roomsCollectionData = {};
      const packRoom = async (chk, imgId, totId, vacId, rentId, key) => {
        if (document.getElementById(chk).checked) {
          const imagesArray = await getCompressedImagesArray(imgId);
          roomsCollectionData[key] = { 
            total: Number(document.getElementById(totId).value)||0, 
            vacant: Number(document.getElementById(vacId).value)||0, 
            rent: Number(document.getElementById(rentId).value)||0, 
            images: imagesArray,
            active: true 
          };
        }
      };
      await packRoom('chkSingle', 'imgSingle', 'totSingle', 'vacSingle', 'rentSingle', 'single'); 
      await packRoom('chkDouble', 'imgDouble', 'totDouble', 'vacDouble', 'rentDouble', 'double');
      await packRoom('chktriple', 'imgTriple', 'totTriple', 'vacTriple', 'rentTriple', 'triple');
    }

    let flatFacilitiesList = [];
    let roomFacilitiesList = [];
    const allRows = document.querySelectorAll('.amenities-group-body tr');
    allRows.forEach(row => {
      const amenityKey = row.getAttribute('data-amenity');
      if (row.querySelector('.flat-amenity').checked) flatFacilitiesList.push(amenityKey);
      if (row.querySelector('.room-amenity').checked) roomFacilitiesList.push(amenityKey);
    });

    const locationObj = { latitude: 25.5941, longitude: 85.1376 };
    const rulesObj = {
      gateClosingTime: document.getElementById('gateClosingTime').value,
      noSmoking: flatFacilitiesList.includes("No Smoking") || roomFacilitiesList.includes("No Smoking")
    };

    let foodMealsArr = [];
    if (document.getElementById('foodAvailable').checked) {
      if (document.getElementById('chkBreakfast').checked) foodMealsArr.push("Breakfast");
      if (document.getElementById('chkLunch').checked) foodMealsArr.push("Lunch");
      if (document.getElementById('chkDinner').checked) foodMealsArr.push("Dinner");
    }

    const finalDocumentData = {
      ownerUid: currentUser.uid, 
      ownerName: document.getElementById('ownerName').value.trim(), 
      ownerPhone: document.getElementById('ownerPhone').value.trim(), 
      ownerEmail: document.getElementById('ownerEmail').value.trim(),
      houseName: hName, 
      pgType: pgType, 
      pincode: pin, 
      cityStateInfo: cState, 
      exactAddress: address, 
      famousCollege: college, 
      status: "Active",
      inventory: { flats: flatsCollectionData, rooms: roomsCollectionData },
      facilitiesMatrix: { flatAmenities: flatFacilitiesList, roomAmenities: roomFacilitiesList },
      foodFacility: {
        available: document.getElementById('foodAvailable').checked,
        meals: foodMealsArr
      },
      location: locationObj,
      rules: rulesObj,
      buildingDescription: document.getElementById('buildingDescription').value.trim(),
      mainPhotoUrl: compressedMainPhoto, 
      allPhotos: masterPhotosListArray, 
      timestamp: new Date()
    };
    
    await addDoc(collection(db, "pghub_properties"), finalDocumentData);
    alert("Property listing successfully registered and launched live!"); 
    window.location.href = "buildings-list.html";
  } catch (error) { 
    console.error(error); 
    alert("Database insertion failed: " + error.message); 
  } finally {
    document.getElementById('submitBtn').innerText = "🎉 Save & Complete Verification";
    document.getElementById('submitBtn').disabled = false;
  }
});

// Food availability toggle logic
const handleFoodChange = (isAvailable) => {
  document.getElementById('mealsSelectionBox').style.display = isAvailable ? 'block' : 'none';
  if (!isAvailable) {
    document.getElementById('chkBreakfast').checked = false;
    document.getElementById('chkLunch').checked = false;
    document.getElementById('chkDinner').checked = false;
  }
};

document.getElementById('foodAvailable').addEventListener('change', () => handleFoodChange(true));
document.getElementById('foodNotAvailable').addEventListener('change', () => handleFoodChange(false));
