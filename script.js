// ==========================================================================
// 📍 RISU (RUNGTA INTERNATIONAL SKILLS UNIVERSITY) FIXED GPS (Point A)
// ==========================================================================
const RISU_LAT = 21.3142;  // RISU ka asli Latitude
const RISU_LON = 81.3650;  // RISU ka asli Longitude

// ==========================================================================
// 📐 AIR DISTANCE CALCULATION ENGINE (Haversine Formula)
// ==========================================================================
function calculateRealDistance(roomLat, roomLon) {
  if (!roomLat || !roomLon) return "N/A";

  const R = 6371; // Earth ki radius Kilometers me
  const dLat = (roomLat - RISU_LAT) * Math.PI / 180;
  const dLon = (roomLon - RISU_LON) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(RISU_LAT * Math.PI / 180) * Math.cos(roomLat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Doori KM me nikal gayi

  return distance.toFixed(1); // 1.2 km ya 2.5 km jaisa clean roundoff
}

// ==========================================================================
// 🏠 GLOBAL ROOMS REPOSITORY
// ==========================================================================
window.allFetchedRooms = {}; 

// ==========================================================================
// 📺 DISPLAY ROOM CARDS ON HOME PAGE (With Real Distance from RISU)
// ==========================================================================
window.renderRoomsOnDOM = (roomsArray) => {
  let container = document.getElementById("roomList");
  if (!container) return;

  container.innerHTML = ""; 

  if (roomsArray.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #7f8c8d; padding: 20px;">⚠️ Abhi tak koi room add nahi kiya gaya hai.</p>`;
    return;
  }

  roomsArray.forEach((room) => {
    window.allFetchedRooms[room.id] = room;

    // 🔥 DATABASE SE LAT/LON UTRA AUR RISU SE LIVE DISTANCE CALCULATE HUA
    let finalDistance = "0.5"; 
    if (room.location && room.location.latitude) {
      finalDistance = calculateRealDistance(room.location.latitude, room.location.longitude);
    }

    // Card render karo - Ab dikhega "X.X km from RISU"
    container.innerHTML += `
    <div class="card" onclick="window.handleRoomClick('${room.id}')" style="cursor: pointer;">
      <img src="${room.mainPhotoUrl || 'https://via.placeholder.com/400x300?text=Property+Photo'}" alt="${room.houseName}">
      <div class="card-content">
        <div class="price">₹${room.roomPrice}/month</div>
        <div class="pg-type">${room.pgType} PG • ${room.sharingType} Sharing</div>
        <div class="distance">📍 ${finalDistance} km from RISU</div>
      </div>
    </div>
    `;
  });
};

// ==========================================================================
// 🏢 LOAD SPECIFIC ROOM DETAILS ON CLICK
// ==========================================================================
window.loadRoomDetailPage = (roomId) => {
  const room = window.allFetchedRooms[roomId];
  if (!room) return;

  let finalDistance = "0.5";
  if (room.location && room.location.latitude) {
    finalDistance = calculateRealDistance(room.location.latitude, room.location.longitude);
  }

  document.getElementById("detMainImage").src = room.mainPhotoUrl || 'https://via.placeholder.com/400x300?text=Property+Photo';
  document.getElementById("detPrice").innerText = `₹${room.roomPrice}/month`;
  document.getElementById("detTopInfo").innerText = `${room.pgType} PG • ${room.sharingType} Sharing • ${finalDistance} km from RISU`;
  document.getElementById("detDescription").innerText = room.description || "No description provided.";
  document.getElementById("detAddress").innerHTML = `📍 Address: ${room.manualAddress}`;
  document.getElementById("detSharing").innerHTML = `👥 Sharing Type: ${room.sharingType} Sharing`;
  document.getElementById("detOwnerName").innerHTML = `👤 Owner: ${room.ownerName}`;
  document.getElementById("detOwnerPhone").innerHTML = `📞 Phone: ${room.ownerPhone}`;
  document.getElementById("detGateTime").innerHTML = `⏰ Gate Closing Time: ${room.rules?.gateClosingTime || '11 PM'}`;

  let specsHtml = "";
  if (room.specifications?.attachedBathroom) specsHtml += `<p>✔ Attached Bathroom</p>`;
  if (room.specifications?.balconyAvailable) specsHtml += `<p>✔ Balcony Available</p>`;
  if (room.specifications?.fullyFurnished) specsHtml += `<p>✔ Fully Furnished</p>`;
  document.getElementById("detRoomSpecs").innerHTML = specsHtml || "<p>Standard Room Structure</p>";

  let highlightsHtml = "";
  if (room.amenities?.wifi) highlightsHtml += `<div class="highlight-box">📶 WiFi</div>`;
  if (room.amenities?.ac) highlightsHtml += `<div class="highlight-box">⚡ AC</div>`;
  if (room.amenities?.cooler) highlightsHtml += `<div class="highlight-box">❄️ Cooler</div>`;
  if (room.amenities?.bed) highlightsHtml += `<div class="highlight-box">🛏️ Bed</div>`;
  if (room.amenities?.parking) highlightsHtml += `<div class="highlight-box">🅿️ Parking</div>`;
  if (room.messDetails?.provided === "Yes") highlightsHtml += `<div class="highlight-box">🍴 Mess</div>`;
  document.getElementById("detHighlights").innerHTML = highlightsHtml;

  const messStatus = document.getElementById("detMessStatus");
  const messMeals = document.getElementById("detMessMeals");
  if (room.messDetails?.provided === "Yes") {
    messStatus.innerHTML = `🍴 Food Facility: <b>Available (${room.messDetails.category || 'Veg'})</b>`;
    let meals = [];
    if (room.messDetails.breakfast) meals.push("Breakfast");
    if (room.messDetails.lunch) meals.push("Lunch");
    if (room.messDetails.dinner) meals.push("Dinner");
    messMeals.innerText = `🥗 Meals: ${meals.join(", ") || "Not Specified"}`;
    messMeals.style.display = "block";
  } else {
    messStatus.innerHTML = `🍴 Food Facility: <b>Not Included</b>`;
    messMeals.style.display = "none";
  }

  let rulesHtml = "";
  if (room.rules?.noSmoking) rulesHtml += `<p>🚫 No Smoking Allowed</p>`;
  if (room.rules?.noMusic) rulesHtml += `<p>🔇 No Loud Music After 10 PM</p>`;
  if (room.rules?.noCooking) rulesHtml += `<p>🍳 Cooking Inside Room Not Allowed</p>`;
  document.getElementById("detRulesList").innerHTML = rulesHtml;

  document.getElementById("detCallBtn").onclick = () => {
    window.location.href = `tel:${room.ownerPhone}`;
  };
  
  document.getElementById("detMapBtn").onclick = () => {
    if (room.location && room.location.latitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${room.location.latitude},${room.location.longitude}`);
    } else {
      alert("📍 Location coordinates missing.");
    }
  };

  document.getElementById("homePage").style.display = "none";
  document.getElementById("detailPage").style.display = "block";
  window.scrollTo(0, 0);
};

// ==========================================================================
// 🧭 BASIC UI NAVIGATION CONTROLS
// ==========================================================================
window.goBack = function() {
  document.getElementById("detailPage").style.display = "none";
  document.getElementById("homePage").style.display = "block";
};

window.toggleDetails = function() {
  let more = document.getElementById("moreDetails");
  if (more) {
    more.style.display = (more.style.display === "block") ? "none" : "block";
  }
};
