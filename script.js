// ==========================================
// 📍 1. RISU GPS ENGINE & DISTANCE CALCULATOR
// ==========================================
const RISU_LAT = 21.3142, RISU_LON = 81.365;

function calculateRealDistance(e, t) {
  if (!e || !t) return "N/A";
  const a = 6371, n = (t - RISU_LON) * Math.PI / 180, 
        i = Math.sin((e - RISU_LAT) * Math.PI / 180 / 2) * Math.sin((e - RISU_LAT) * Math.PI / 180 / 2) + Math.cos(RISU_LAT * Math.PI / 180) * Math.cos(e * Math.PI / 180) * Math.sin(n / 2) * Math.sin(n / 2);
  return (a * (2 * Math.atan2(Math.sqrt(i), Math.sqrt(1 - i)))).toFixed(1);
}

window.allFetchedRooms = {};
window.activeSelectedCategory = null; 
window.activeSearchQuery = "";        
window.activeSearchTags = [];         

window.handleRoomClick = (e => { window.loadRoomDetailPage(e); });

// ==========================================
// 🏷️ 2. CATEGORY BUTTON CLICK SYSTEM
// ==========================================
window.filterCategory = function(buttonElem) {
  if (window.isShowingFavoritesOnly) {
    window.isShowingFavoritesOnly = false;
    const favHeader = document.getElementById("favViewHeader");
    if (favHeader) favHeader.remove();
  }

  const selectedCategory = buttonElem.getAttribute("data-category");
  const allButtons = document.querySelectorAll(".cat-btn");

  if (buttonElem.classList.contains("active")) {
    buttonElem.classList.remove("active");
    window.activeSelectedCategory = null;
  } else {
    allButtons.forEach(btn => btn.classList.remove("active"));
    buttonElem.classList.add("active");
    window.activeSelectedCategory = selectedCategory;
  }

  executeGlobalFilter();
};

function applyCategoryFilter(roomsList, selectedCat) {
  if (!selectedCat) return roomsList;
  const target = selectedCat.toLowerCase().trim();

  return roomsList.filter(room => {
    const pgType = (room.pgType || "").toLowerCase();
    const houseName = (room.houseName || "").toLowerCase();
    const inventory = room.inventory || {};
    const roomType = (room.roomType || "").toLowerCase();

    if (target.includes("boys") && pgType.includes("boy")) return true;
    if (target.includes("girls") && pgType.includes("girl")) return true;
    if (target.includes("living") && (pgType.includes("living") || pgType.includes("coliving"))) return true;

    if (target.includes("single") && (inventory.rooms?.single || roomType.includes("single"))) return true;
    if (target.includes("double") && (inventory.rooms?.double || roomType.includes("double"))) return true;

    if (target.includes("1bhk") && (inventory.flats?.bhk1 || houseName.includes("1bhk") || roomType.includes("1bhk"))) return true;
    if (target.includes("2bhk") && (inventory.flats?.bhk2 || houseName.includes("2bhk") || roomType.includes("2bhk"))) return true;
    if (target.includes("3bhk") && (inventory.flats?.bhk3 || houseName.includes("3bhk") || roomType.includes("3bhk"))) return true;

    return pgType.includes(target) || houseName.includes(target) || roomType.includes(target);
  });
}

// ==========================================
// 🔍 3. ADVANCED SEARCH, CHIPS & SUGGESTION SYSTEM
// ==========================================
window.handleSearchInput = function(event) {
  const query = event.target.value.trim().toLowerCase();
  window.activeSearchQuery = query;

  // Handle Enter key to create a chip
  if (event.key === "Enter" && query !== "") {
    event.preventDefault();
    window.addSearchTag(query);
    return;
  }

  window.showSuggestions(query);
  window.updateClearButtonState();
  executeGlobalFilter();
};

// Render Live Suggestions Dropdown
window.showSuggestions = function(query) {
  const box = document.getElementById("suggestionsDropdown");
  if (!box) return;

  if (!query || query.length < 1) {
    box.style.display = "none";
    return;
  }

  const suggestionsMap = new Map();
  const rooms = Object.values(window.allFetchedRooms);

  rooms.forEach(room => {
    const name = room.houseName || "";
    const addr = room.exactAddress || room.manualAddress || "";
    const pin = room.pincode ? String(room.pincode) : "";
    const pg = room.pgType || "";

    if (name.toLowerCase().includes(query) && !suggestionsMap.has(name.toLowerCase())) {
      suggestionsMap.set(name.toLowerCase(), { label: name, type: "House Name" });
    }
    if (addr.toLowerCase().includes(query) && !suggestionsMap.has(addr.toLowerCase())) {
      suggestionsMap.set(addr.toLowerCase(), { label: addr, type: "Address" });
    }
    if (pin.includes(query) && !suggestionsMap.has(pin)) {
      suggestionsMap.set(pin, { label: pin, type: "Pincode" });
    }
    if (pg.toLowerCase().includes(query) && !suggestionsMap.has(pg.toLowerCase())) {
      suggestionsMap.set(pg.toLowerCase(), { label: pg, type: "Property Type" });
    }
  });

  const uniqueList = Array.from(suggestionsMap.values()).slice(0, 7);

  if (uniqueList.length === 0) {
    box.style.display = "none";
    return;
  }

  let html = "";
  uniqueList.forEach(item => {
    html += `
      <div class="suggestion-item" onclick="window.selectSuggestion('${item.label.replace(/'/g, "\\'")}')">
        <span>🔍 ${item.label}</span>
        <small class="suggestion-tag-type">${item.type}</small>
      </div>
    `;
  });

  box.innerHTML = html;
  box.style.display = "block";
};

// Select suggestion item
window.selectSuggestion = function(text) {
  window.addSearchTag(text);
  const box = document.getElementById("suggestionsDropdown");
  if (box) box.style.display = "none";
};

// Add Tag Chip
window.addSearchTag = function(tagText) {
  const cleanTag = tagText.trim();
  if (!cleanTag) return;

  if (!window.activeSearchTags.includes(cleanTag)) {
    window.activeSearchTags.push(cleanTag);
    window.renderSearchChips();
  }

  const input = document.getElementById("searchInput");
  if (input) input.value = "";
  window.activeSearchQuery = "";
  
  const box = document.getElementById("suggestionsDropdown");
  if (box) box.style.display = "none";

  window.updateClearButtonState();
  executeGlobalFilter();
};

// Remove Tag Chip
window.removeSearchTag = function(index) {
  window.activeSearchTags.splice(index, 1);
  window.renderSearchChips();
  window.updateClearButtonState();
  executeGlobalFilter();
};

// Render Tag Chips
window.renderSearchChips = function() {
  const container = document.getElementById("searchChipsContainer");
  if (!container) return;

  container.innerHTML = "";
  window.activeSearchTags.forEach((tag, idx) => {
    const chip = document.createElement("div");
    chip.className = "search-chip";
    chip.innerHTML = `
      <span>${tag}</span>
      <span class="chip-remove" onclick="window.removeSearchTag(${idx})">✕</span>
    `;
    container.appendChild(chip);
  });
};

// Text + Multi-Tag Search Filter Logic
function applyTextSearchFilter(roomsList, query, tags) {
  let filtered = roomsList;

  if (tags && tags.length > 0) {
    filtered = filtered.filter(room => {
      const houseName = (room.houseName || "").toLowerCase();
      const pgType = (room.pgType || "").toLowerCase();
      const address = (room.exactAddress || room.manualAddress || "").toLowerCase();
      const landmark = (room.landmark || "").toLowerCase();
      const pincode = room.pincode ? String(room.pincode).toLowerCase() : "";

      return tags.every(tag => {
        const t = tag.toLowerCase();
        return houseName.includes(t) || pgType.includes(t) || address.includes(t) || landmark.includes(t) || pincode.includes(t);
      });
    });
  }

  if (query) {
    filtered = filtered.filter(room => {
      const houseName = (room.houseName || "").toLowerCase();
      const pgType = (room.pgType || "").toLowerCase();
      const address = (room.exactAddress || room.manualAddress || "").toLowerCase();
      const landmark = (room.landmark || "").toLowerCase();
      const pincode = room.pincode ? String(room.pincode).toLowerCase() : "";

      return houseName.includes(query) || pgType.includes(query) || address.includes(query) || landmark.includes(query) || pincode.includes(query);
    });
  }

  return filtered;
}

// Clear Search Input & Chips
window.clearSearchInput = function() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";
  window.activeSearchQuery = "";
  window.activeSearchTags = [];
  window.renderSearchChips();
  
  const box = document.getElementById("suggestionsDropdown");
  if (box) box.style.display = "none";

  window.updateClearButtonState();
  executeGlobalFilter();
};

// Clear Button Dynamic Visibility
window.updateClearButtonState = function() {
  const clearBtn = document.getElementById("clearSearchBtn");
  if (clearBtn) {
    if (window.activeSearchQuery.length > 0 || window.activeSearchTags.length > 0) {
      clearBtn.style.display = "block";
    } else {
      clearBtn.style.display = "none";
    }
  }
};

// Hide Suggestions when clicking outside
document.addEventListener("click", function(e) {
  const box = document.getElementById("suggestionsDropdown");
  const input = document.getElementById("searchInput");
  if (box && input && !box.contains(e.target) && !input.contains(e.target)) {
    box.style.display = "none";
  }
});

// ==========================================
// 🔀 4. UNIFIED GLOBAL FILTER ENGINE
// ==========================================
function executeGlobalFilter() {
  let filteredRooms = Object.values(window.allFetchedRooms);

  if (window.activeSelectedCategory) {
    filteredRooms = applyCategoryFilter(filteredRooms, window.activeSelectedCategory);
  }

  if (window.activeSearchQuery || window.activeSearchTags.length > 0) {
    filteredRooms = applyTextSearchFilter(filteredRooms, window.activeSearchQuery, window.activeSearchTags);
  }

  if (window.isShowingFavoritesOnly) {
    filteredRooms = filteredRooms.filter(room => window.favoriteRoomIds.has(room.id));
  }

  window.renderRoomsOnDOM(filteredRooms);
}

// ==========================================
// 💛 5. FAVORITE SYSTEM ENGINE & STORAGE
// ==========================================
window.isShowingFavoritesOnly = false;
const savedFavorites = JSON.parse(localStorage.getItem("userFavorites") || "[]");
window.favoriteRoomIds = new Set(savedFavorites);

window.updateFavBadgeCount = function() {
  const countBadge = document.getElementById("favCount");
  if (countBadge) {
    countBadge.innerText = `(${window.favoriteRoomIds.size})`;
  }
};

window.toggleFavIcon = function(btnElement, roomId, event) {
  if (event) event.stopPropagation();

  if (window.favoriteRoomIds.has(roomId)) {
    window.favoriteRoomIds.delete(roomId);
  } else {
    window.favoriteRoomIds.add(roomId);
  }

  localStorage.setItem("userFavorites", JSON.stringify(Array.from(window.favoriteRoomIds)));

  const matchingButtons = document.querySelectorAll(`.fav-btn-${roomId}`);
  matchingButtons.forEach(btn => {
    btn.innerText = window.favoriteRoomIds.has(roomId) ? "❤️" : "💛";
  });

  window.updateFavBadgeCount();

  if (window.isShowingFavoritesOnly) {
    window.showFavoriteRooms();
  }
};

window.showFavoriteRooms = function() {
  window.isShowingFavoritesOnly = true;
  executeGlobalFilter();

  const container = document.getElementById("roomList");
  if (container) {
    let existingHeader = document.getElementById("favViewHeader");
    if (!existingHeader) {
      existingHeader = document.createElement("div");
      existingHeader.id = "favViewHeader";
      existingHeader.style.cssText = "grid-column: 1/-1; display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 12px 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;";
      container.parentNode.insertBefore(existingHeader, container);
    }
    
    const count = Object.values(window.allFetchedRooms).filter(room => window.favoriteRoomIds.has(room.id)).length;
    existingHeader.innerHTML = `
      <div style="font-weight: 600; color: #2d3748; font-size: 16px; display: flex; align-items: center; gap: 8px;">
        ❤️ Your Favorite Properties (${count})
      </div>
      <button onclick="window.resetFavoritesView()" style="background: #3182ce; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 14px; transition: background 0.2s;">
        ⬅️ Back to All Rooms
      </button>
    `;
  }
};

window.resetFavoritesView = function() {
  window.isShowingFavoritesOnly = false;
  const favHeader = document.getElementById("favViewHeader");
  if (favHeader) favHeader.remove();
  executeGlobalFilter();
};

// ==========================================
// 📺 6. HOME PAGE GRID RENDERER
// ==========================================
window.renderRoomsOnDOM = (e => {
  let t = document.getElementById("roomList");
  if (!t) return; 
  t.innerHTML = "";
  
  if (!e || e.length === 0) {
    t.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #7f8c8d; padding: 30px; font-size: 15px;">⚠️ Koi matching property nahi mili ya favorites khali hain.</p>';
    return;
  }

  let htmlContent = "";
  e.forEach((item => {
    window.allFetchedRooms[item.id] = item;
    let dist = "0.5"; 
    if (item.location && item.location.latitude) {
      dist = calculateRealDistance(item.location.latitude, item.location.longitude);
    }
    
    let price = item.roomPrice || "N/A";
    if (!item.roomPrice && item.inventory) {
      price = item.inventory.rooms?.single?.rent || item.inventory.rooms?.double?.rent || item.inventory.rooms?.triple?.rent || item.inventory.flats?.bhk1?.rent || item.inventory.flats?.bhk2?.rent || item.inventory.flats?.bhk3?.rent || "N/A";
    }

    const currentFavIcon = window.favoriteRoomIds.has(item.id) ? "❤️" : "💛";

    htmlContent += `
    <div class="card" onclick="window.handleRoomClick('${item.id}')" style="cursor: pointer; position: relative;">
      <button class="card-fav-btn fav-btn-${item.id}" 
              onclick="window.toggleFavIcon(this, '${item.id}', event)" 
              style="position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 18px; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
        ${currentFavIcon}
      </button>
      <img src="${item.mainPhotoUrl || "https://via.placeholder.com/400x300?text=Property+Photo"}" alt="${item.houseName || 'Property'}">
      <div class="card-content">
        <div class="price">₹${price}/month</div>
        <div class="pg-type">${item.pgType || "Standard"} PG • ${item.houseName || "Hub"}</div>
        <div class="distance">📍 ${dist} km from RISU</div>
      </div>
    </div>`;
  }));

  t.innerHTML = htmlContent;
  window.updateFavBadgeCount();
});

// ==========================================
// 🏢 7. ROOM DETAIL PAGE LOAD & SLIDER
// ==========================================
window.loadRoomDetailPage = (e => {
  const t = window.allFetchedRooms[e];
  if (!t) return;
  
  let dist = "0.5"; 
  if (t.location && t.location.latitude) {
    dist = calculateRealDistance(t.location.latitude, t.location.longitude);
  }
  
  let imageList = [];
  let currentSlideIndex = 0;
  const sliderTrack = document.getElementById("sliderTrack");
  const dotsContainer = document.getElementById("sliderDotsContainer");
  const sliderContainer = document.getElementById("propertySlider");

  if (sliderContainer) {
    let existingDetailFavBtn = sliderContainer.querySelector(".detail-fav-btn");
    if (!existingDetailFavBtn) {
      existingDetailFavBtn = document.createElement("button");
      existingDetailFavBtn.style.cssText = "position: absolute; top: 15px; right: 15px; background: rgba(255, 255, 255, 0.9); border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);";
      sliderContainer.appendChild(existingDetailFavBtn);
    }
    existingDetailFavBtn.className = `detail-fav-btn fav-btn-${t.id}`;
    existingDetailFavBtn.setAttribute("onclick", `window.toggleFavIcon(this, '${t.id}', event)`);
    existingDetailFavBtn.innerText = window.favoriteRoomIds.has(t.id) ? "❤️" : "💛";
  }

  function buildSlider() {
    if (!sliderTrack || !dotsContainer) return;
    sliderTrack.innerHTML = "";
    dotsContainer.innerHTML = "";
    
    imageList.forEach((imgUrl, idx) => {
      const img = document.createElement("img");
      img.src = imgUrl;
      img.className = `slide ${idx === 0 ? 'active' : ''}`;
      img.alt = `Room Image ${idx + 1}`;
      sliderTrack.appendChild(img);

      const dot = document.createElement("span");
      dot.className = `dot ${idx === 0 ? 'active' : ''}`;
      dot.addEventListener("click", () => goToSlide(idx));
      dotsContainer.appendChild(dot);
    });
  }

  function goToSlide(idx) {
    if (!sliderTrack || !dotsContainer) return;
    const slides = sliderTrack.getElementsByClassName("slide");
    const dots = dotsContainer.getElementsByClassName("dot");
    if (slides.length === 0) return;
    
    if (idx >= slides.length) currentSlideIndex = 0;
    else if (idx < 0) currentSlideIndex = slides.length - 1;
    else currentSlideIndex = idx;

    for (let i = 0; i < slides.length; i++) {
      slides[i].classList.remove("active");
      if(dots[i]) dots[i].classList.remove("active");
    }
    if (slides[currentSlideIndex]) slides[currentSlideIndex].classList.add("active");
    if (dots[currentSlideIndex]) dots[currentSlideIndex].classList.add("active");
  }

  function updateSliderPhotos(tabName, inventoryData) {
    let specificImages = [];

    if (inventoryData) {
      if (inventoryData.images && Array.isArray(inventoryData.images) && inventoryData.images.length > 0) {
        specificImages = inventoryData.images;
      } else if (inventoryData.single?.images && Array.isArray(inventoryData.single.images)) {
        specificImages = inventoryData.single.images;
      } else if (inventoryData.double?.images && Array.isArray(inventoryData.double.images)) {
        specificImages = inventoryData.double.images;
      } else if (inventoryData.triple?.images && Array.isArray(inventoryData.triple.images)) {
        specificImages = inventoryData.triple.images;
      } else if (inventoryData.roomPhotosUrl && Array.isArray(inventoryData.roomPhotosUrl)) {
        specificImages = inventoryData.roomPhotosUrl;
      }
    }

    if (specificImages.length === 0) {
      if (t.allPhotos && Array.isArray(t.allPhotos) && t.allPhotos.length > 0) {
        specificImages = t.allPhotos;
      } else {
        if (t.mainPhotoUrl) specificImages.push(t.mainPhotoUrl);
        if (t.roomPhotosUrl && Array.isArray(t.roomPhotosUrl)) specificImages = specificImages.concat(t.roomPhotosUrl);
        if (t.additionalPhotos && Array.isArray(t.additionalPhotos)) specificImages = specificImages.concat(t.additionalPhotos);
      }
    }

    if (specificImages.length === 0) {
      specificImages.push("https://via.placeholder.com/400x300?text=Property+Photo");
    }

    imageList = specificImages;
    currentSlideIndex = 0;
    buildSlider();
  }

  const prevBtn = document.getElementById("sliderPrevBtn");
  const nextBtn = document.getElementById("sliderNextBtn");
  if (prevBtn) prevBtn.onclick = (ev) => { ev.stopPropagation(); goToSlide(currentSlideIndex - 1); };
  if (nextBtn) nextBtn.onclick = (ev) => { ev.stopPropagation(); goToSlide(currentSlideIndex + 1); };

  let touchStartX = 0, touchEndX = 0;
  if (sliderContainer) {
    sliderContainer.ontouchstart = (ev) => { touchStartX = ev.changedTouches[0].screenX; };
    sliderContainer.ontouchend = (ev) => {
      touchEndX = ev.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) goToSlide(currentSlideIndex + 1);
      else if (touchEndX - touchStartX > 50) goToSlide(currentSlideIndex - 1);
    };
  }

  const setSafeText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
  const setSafeHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  setSafeText("detDescription", t.buildingDescription || t.description || "No description provided.");
  setSafeHTML("detAddress", `📍 Address: ${t.exactAddress || t.manualAddress || "Not Provided"}`);
  setSafeHTML("detOwnerName", `👤 Owner: ${t.ownerName || "Not Disclosed"}`);
  setSafeHTML("detOwnerPhone", `📞 Phone: ${t.ownerPhone || "N/A"}`);
  
  let foodText = "Not Provided";
  if (typeof t.foodDetails === "object" && t.foodDetails !== null) {
    foodText = t.foodDetails.isAvailable ? "Available" : "Not Available";
    if (t.foodDetails.type) foodText += ` (${t.foodDetails.type})`;
  } else if (t.foodDetails) {
    foodText = String(t.foodDetails);
  }
  setSafeHTML("detFoodFacility", `🍱 Food Facility: ${foodText}`);

  const gateTime = t.gateClosingTime || t.rules?.gateClosingTime || "11:00 PM";
  setSafeText("displayGateTime", gateTime);
  setSafeHTML("detGateTime", `⏰ Gate Closing Time: ${gateTime}`);
  
  let specsHTML = "", flatAmenities = t.facilitiesMatrix?.flatAmenities || [], roomAmenities = t.facilitiesMatrix?.roomAmenities || [], allAmenities = [...flatAmenities, ...roomAmenities];
  if (t.specifications?.attachedBathroom || allAmenities.includes("Bathroom") || allAmenities.includes("Attached Washroom") || allAmenities.includes("Attached Bathroom")) specsHTML += "<p>✔ Attached Bathroom</p>";
  if (t.specifications?.balconyAvailable || allAmenities.includes("Private Balcony") || allAmenities.includes("Balcony")) specsHTML += "<p>✔ Balcony Available</p>";
  if (t.specifications?.fullyFurnished || allAmenities.includes("Furnished") || allAmenities.includes("Fully Furnished")) specsHTML += "<p>✔ Fully Furnished</p>";
  setSafeHTML("detRoomSpecs", specsHTML || "<p>✔ Standard Property Layout Structure</p>");
  
  const desktopRow = document.getElementById("desktop-boxes-row");
  const mobileRow = document.getElementById("mobile-boxes-row");
  if (desktopRow) desktopRow.innerHTML = ""; 
  if (mobileRow) mobileRow.innerHTML = "";
  
  const inv = t.inventory || {}; 
  let defaultActiveTab = null;

  function addTab(tabTitle, tabData, typeKey) {
    if (!tabData) return;
    const deskBox = document.createElement("div"); deskBox.className = "summary-box"; deskBox.innerText = tabTitle;
    const mobBox = document.createElement("div"); mobBox.className = "summary-box"; mobBox.innerText = tabTitle;
    
    const onClick = () => {
      document.querySelectorAll(".summary-box").forEach((el => el.classList.remove("active")));
      deskBox.classList.add("active"); 
      mobBox.classList.add("active"); 
      updatePricingUI(tabTitle, tabData); 
      renderHighlights(typeKey);
      updateSliderPhotos(tabTitle, tabData);
    };

    deskBox.addEventListener("click", onClick); 
    mobBox.addEventListener("click", onClick);
    
    if (desktopRow) desktopRow.appendChild(deskBox); 
    if (mobileRow) mobileRow.appendChild(mobBox);
    
    if (!defaultActiveTab) defaultActiveTab = { deskEl: deskBox, mobEl: mobBox, data: tabData, name: tabTitle, typeKey: typeKey };
  }

  function renderHighlights(typeKey) {
    let html = "";
    if (t.amenities && typeof t.amenities === "object") {
      const map = { 
        wifi: "📶 WiFi", ac: "❄️ Air Conditioner (AC)", cooler: "🌀 Air Cooler", 
        bed: "🛏️ Wooden Bed", mattress: "💤 Mattress", parking: "🚗 Parking Space", 
        washroom: "🧼 Attached Washroom", balcony: "🌅 Private Balcony", water_cooler: "🚰 Water Cooler"
      };

      Object.keys(t.amenities).forEach((k) => {
        const val = t.amenities[k];
        if (val === true || val === "true" || (typeof val === "string" && val.trim() !== "" && !k.endsWith("_label"))) {
          const label = map[k] || t.amenities[k + "_label"] || k;
          html += `<div class="highlight-box">${label}</div>`;
        }
      });
    }

    let amenityList = "room" === typeKey ? t.facilitiesMatrix?.roomAmenities || [] : t.facilitiesMatrix?.flatAmenities || [];
    if (Array.isArray(amenityList)) {
      amenityList.forEach((e) => {
        if (typeof e === 'string' && e.trim() !== "" && !html.includes(e)) {
          html += `<div class="highlight-box">${e}</div>`;
        }
      });
    }

    if (gateTime) html += `<div class="highlight-box" style="border-color: #f39c12; color: #d35400;">⏰ Gate Closes: ${gateTime}</div>`;
    
    const rawDataStr = JSON.stringify(t.amenities || {}) + JSON.stringify(amenityList);
    if (t.rules?.noSmoking || rawDataStr.toLowerCase().includes("smoke")) {
      html += '<div class="highlight-box" style="border-color: #e74c3c; color: #c0392b;">🚭 No Smoking</div>';
    }
    if (rawDataStr.toLowerCase().includes("music")) {
      html += '<div class="highlight-box" style="border-color: #95a5a6; color: #7f8c8d;">🎵 No Loud Music</div>';
    }

    let isFood = false;
    if (typeof t.foodDetails === 'object' && t.foodDetails !== null) {
      isFood = t.foodDetails.isAvailable === true || t.foodDetails.isAvailable === "true" || t.foodDetails.isAvailable === "Yes";
    } else if (typeof t.foodDetails === 'string') {
      isFood = t.foodDetails.toLowerCase() !== "no" && t.foodDetails.trim() !== "";
    }

    if (isFood || rawDataStr.toLowerCase().includes("mess") || rawDataStr.toLowerCase().includes("food")) {
      html += '<div class="highlight-box" style="background: #e8f8f5; border-color: #2ecc71;">🍲 Mess Facility</div>';
    }

    setSafeHTML("detHighlights", html || "<p style='color:#7f8c8d; font-size:14px;'>Standard basic facilities included.</p>");
    setSafeHTML("detDynamicAmenities", html || "<span style='color:#888;font-size:13px;'>No amenities listed.</span>");
  }

  function updatePricingUI(tabTitle, tabData) {
    const pEl = document.getElementById("detPrice");
    const topEl = document.getElementById("detTopInfo");
    const shEl = document.getElementById("detSharing");
    if (!pEl || !topEl || !shEl) return;

    if (tabData.single || tabData.double || tabData.triple) {
      let priceTxt = "", topTxt = "", shareArr = [];
      if (tabData.single && tabData.single.total > 0) { priceTxt += `₹${tabData.single.rent}`; topTxt += `Single Room: ${tabData.single.vacant} Left (Total: ${tabData.single.total}) • `; shareArr.push("Single"); }
      if (tabData.double && tabData.double.total > 0) { if (priceTxt) priceTxt += " / "; priceTxt += `₹${tabData.double.rent}`; topTxt += `Double Room: ${tabData.double.vacant} Left (Total: ${tabData.double.total}) • `; shareArr.push("Double"); }
      if (tabData.triple && tabData.triple.total > 0) { if (priceTxt) priceTxt += " / "; priceTxt += `₹${tabData.triple.rent}`; topTxt += `Triple Room: ${tabData.triple.vacant} Left (Total: ${tabData.triple.total}) • `; shareArr.push("Triple"); }
      
      pEl.innerText = priceTxt ? `${priceTxt}/month` : "N/A"; 
      topEl.innerText = `${topTxt}${dist} km from RISU`; 
      shEl.innerHTML = `👥 Sharing Type: ${shareArr.join(" & ") || "Standard"} Sharing`;
    } else {
      pEl.innerText = `₹${tabData.rent || "N/A"}/month`; 
      topEl.innerText = `${tabTitle} • ${tabData.vacant || 0} Vacant (Total: ${tabData.total || 0}) • ${dist} km from RISU`; 
      shEl.innerHTML = `👥 Type: Full Private ${tabTitle}`;
    }
  }

  if (inv.rooms) {
    if (inv.rooms.single && inv.rooms.single.total > 0) addTab("SINGLE ROOM", { single: inv.rooms.single }, "room");
    if (inv.rooms.double && inv.rooms.double.total > 0) addTab("DOUBLE ROOM", { double: inv.rooms.double }, "room");
    if (inv.rooms.triple && inv.rooms.triple.total > 0) addTab("TRIPLE ROOM", { triple: inv.rooms.triple }, "room");
  }
  if (!inv.rooms && t.roomPrice) addTab("ROOM/PG", { rent: t.roomPrice, vacant: 1, total: 1 }, "room");
  if (inv.flats) {
    if (inv.flats.bhk1) addTab("1 BHK FLAT", inv.flats.bhk1, "flat");
    if (inv.flats.bhk2) addTab("2 BHK FLAT", inv.flats.bhk2, "flat");
    if (inv.flats.bhk3) addTab("3 BHK FLAT", inv.flats.bhk3, "flat");
  }
  
  if (defaultActiveTab) { 
    defaultActiveTab.deskEl.classList.add("active"); 
    defaultActiveTab.mobEl.classList.add("active"); 
    updatePricingUI(defaultActiveTab.name, defaultActiveTab.data); 
    renderHighlights(defaultActiveTab.typeKey); 
    updateSliderPhotos(defaultActiveTab.name, defaultActiveTab.data); 
  } else {
    updateSliderPhotos("DEFAULT", t);
  }
  
  const dynContainer = document.getElementById("detDynamicDetailsContainer");
  if (dynContainer) {
    dynContainer.innerHTML = "";
    if (t.customDetailsList && Array.isArray(t.customDetailsList)) {
      t.customDetailsList.forEach((e => {
        let safeValue = (e && e.value !== undefined && e.value !== null) ? String(e.value).trim() : "";
        if (safeValue !== "") {
          dynContainer.innerHTML += `<p class="dynamic-row-item"><strong>${e.label || "Detail"}:</strong> ${safeValue}</p>`;
        }
      }));
    } else {
      dynContainer.innerHTML = `<p class="dynamic-row-item"><strong>📍 Landmark:</strong> ${t.exactAddress || t.manualAddress || "N/A"}</p>`;
    }
  }

  const callBtn = document.getElementById("detCallBtn");
  if (callBtn) callBtn.onclick = (() => { if (t.ownerPhone) window.location.href = `tel:${t.ownerPhone}`; });

  const mapBtn = document.getElementById("detMapBtn");
  if (mapBtn) mapBtn.onclick = (() => {
    if (t.location && t.location.latitude) window.open(`https://www.google.com/maps/search/?api=1&query=${t.location.latitude},${t.location.longitude}`);
    else alert("📍 Location coordinates missing.");
  });
  
  const home = document.getElementById("homePage");
  const detail = document.getElementById("detailPage");
  if (home) home.style.display = "none";
  if (detail) detail.style.display = "block";
  window.scrollTo(0, 0);
});

// Navigation Controls
window.goBack = function() {
  const home = document.getElementById("homePage");
  const detail = document.getElementById("detailPage");
  if (detail) detail.style.display = "none";
  if (home) home.style.display = "block";
};

window.toggleDetails = function() {
  let e = document.getElementById("moreDetails");
  if (e) e.style.display = "block" === e.style.display ? "none" : "block";
};

// Global DOM Ready Initialization
document.addEventListener("DOMContentLoaded", () => {
  window.updateFavBadgeCount();
});
