// ==========================================
// 🏢 1. GLOBAL STATE INITIALIZATION
// ==========================================

window.allFetchedRooms = {};
window.activeSelectedCategory = null; 
window.activeSearchQuery = "";        
window.activeSearchTags = [];         
window.isNearMeActive = false;
window.userCurrentLocation = null;
window.activeManualLocation = null;
window.activeManualLocationType = null;
window.availableLocationChips = [];

window.handleRoomClick = (e => { window.loadRoomDetailPage(e); });

// ==========================================
// 📍 1.5 MANUAL LOCATION DATA EXTRACTOR & ENGINE
// ==========================================
// ==========================================
// 📍 1.5 MANUAL LOCATION DATA EXTRACTOR & ENGINE
// ==========================================

const KNOWN_AREAS_PATNA = [
  "Boring Road", "Boring Canal Road", "Kankarbagh", "Bailey Road", "Raja Bazar", 
  "Danapur", "Rajendra Nagar", "Anisabad", "Saguna More", "Patliputra",
  "Fraser Road", "Exhibition Road", "Ashok Rajpath", "Gola Road", "Kurji", 
  "Digha", "Gardanibagh", "Kumhrar", "Khagaul", "Phulwari Sharif", "Bihta",
  "Dak Bungalow", "Gandhi Maidan", "Kidwaipuri", "SK Puri", "Shastri Nagar",
  "Lodipur", "Mithapur", "Jakkanpur", "Chitragupta Nagar", "Hanuman Nagar",
  "Lohia Nagar", "Bhootnath Road", "Rukanpura", "Jagdeo Path", "Ashiana Nagar"
];

const KNOWN_CITIES = [
  "Patna", "Bihta", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", 
  "Purnia", "Arrah", "Begusarai", "Delhi", "Bengaluru", "Kolkata"
];

function normalizeLocationString(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/[,\.\-\/\\#()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Standardizes manual address fields from Firestore documents (building.area, building.city, building.address, building.landmark)
function getPropertyLocationData(item) {
  if (!item) {
    return {
      area: "",
      city: "",
      address: "",
      landmark: "",
      pincode: "",
      displayLocation: "Location not specified",
      searchableText: ""
    };
  }

  // Support both direct building object and root-level fields
  const b = (item.building && typeof item.building === "object") ? item.building : {};
  const locObj = (item.location && typeof item.location === "object") ? item.location : {};
  const bLocObj = (b.location && typeof b.location === "object") ? b.location : {};

  // 1. Area / Locality (building.area, item.area, item.locality, item.exactArea, etc.)
  let area = (
    item.area ||
    b.area ||
    item.locality ||
    b.locality ||
    item.exactArea ||
    b.exactArea ||
    item.buildingArea ||
    b.buildingArea ||
    locObj.area ||
    locObj.locality ||
    bLocObj.area ||
    bLocObj.locality ||
    ""
  ).toString().trim();

  // 2. City (building.city, item.city, item.cityStateInfo, etc.)
  let city = (
    item.city ||
    b.city ||
    item.buildingCity ||
    b.buildingCity ||
    locObj.city ||
    bLocObj.city ||
    ""
  ).toString().trim();

  const csi = (item.cityStateInfo || b.cityStateInfo || "").toString().trim();
  if (!city && csi) {
    city = csi.split(",")[0].trim();
  }

  // 3. Address (building.address, building.exactAddress, item.exactAddress, item.manualAddress, etc.)
  let address = (
    item.address ||
    b.address ||
    item.exactAddress ||
    b.exactAddress ||
    item.manualAddress ||
    b.manualAddress ||
    item.buildingAddress ||
    b.buildingAddress ||
    locObj.exactAddress ||
    locObj.address ||
    bLocObj.exactAddress ||
    bLocObj.address ||
    ""
  ).toString().trim();

  // 4. Landmark / College (building.landmark, item.famousCollege, item.landmark, etc.)
  let landmark = (
    item.landmark ||
    b.landmark ||
    item.famousCollege ||
    b.famousCollege ||
    item.college ||
    b.college ||
    item.buildingLandmark ||
    b.buildingLandmark ||
    locObj.famousCollege ||
    locObj.landmark ||
    bLocObj.famousCollege ||
    bLocObj.landmark ||
    ""
  ).toString().trim();

  // 5. Pincode
  let pincode = (
    item.pincode ||
    b.pincode ||
    item.pin ||
    b.pin ||
    item.postalCode ||
    b.postalCode ||
    locObj.pincode ||
    bLocObj.pincode ||
    ""
  ).toString().trim();

  // Smart fallback: If area is empty, try to detect known locality from address or landmark
  if (!area && (address || landmark)) {
    const combined = `${address} ${landmark}`.toLowerCase();
    for (const ka of KNOWN_AREAS_PATNA) {
      if (combined.includes(ka.toLowerCase())) {
        area = ka;
        break;
      }
    }
  }

  // Smart fallback: If city is empty, check known cities in address, landmark or csi
  if (!city) {
    const combined = `${address} ${landmark} ${csi}`.toLowerCase();
    for (const kc of KNOWN_CITIES) {
      if (combined.includes(kc.toLowerCase())) {
        city = kc;
        break;
      }
    }
  }

  // 6. Best human-readable display location for cards & details
  let displayLocation = "";
  if (area && city && !area.toLowerCase().includes(city.toLowerCase())) {
    displayLocation = `${area}, ${city}`;
  } else if (area) {
    displayLocation = area;
  } else if (landmark && city && !landmark.toLowerCase().includes(city.toLowerCase())) {
    displayLocation = `${landmark}, ${city}`;
  } else if (landmark) {
    displayLocation = landmark;
  } else if (address && city && !address.toLowerCase().includes(city.toLowerCase())) {
    displayLocation = `${address}, ${city}`;
  } else if (address) {
    displayLocation = address;
  } else if (city) {
    displayLocation = city;
  } else if (csi) {
    displayLocation = csi;
  } else {
    displayLocation = "Location not specified";
  }

  // 7. Combined searchable text for fast multi-keyword matching
  const houseName = item.houseName || b.houseName || item.name || b.name || item.buildingName || b.buildingName || "";
  const pgType = item.pgType || b.pgType || item.type || b.type || "";
  const desc = item.buildingDescription || b.buildingDescription || item.description || b.description || "";
  const searchableText = `${area} ${city} ${address} ${landmark} ${pincode} ${csi} ${houseName} ${pgType} ${desc}`.toLowerCase();

  return {
    area,
    city,
    address,
    landmark,
    pincode,
    displayLocation,
    searchableText
  };
}

function getPropertyCoordinates(item) {
  if (!item) return null;
  const b = (item.building && typeof item.building === "object") ? item.building : {};
  const loc = item.location || b.location;
  if (loc) {
    const lat = loc.latitude ?? loc.lat ?? loc._latitude;
    const lng = loc.longitude ?? loc.lng ?? loc._longitude;
    if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      return { lat: Number(lat), lng: Number(lng) };
    }
  }
  const lat = item.latitude ?? b.latitude ?? item.lat ?? item._latitude;
  const lng = item.longitude ?? b.longitude ?? item.lng ?? item._longitude;
  if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return { lat: Number(lat), lng: Number(lng) };
  }
  return null;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 📍 Location Modal Controllers
window.openLocationPicker = function() {
  const modal = document.getElementById("locationPickerModal");
  if (!modal) return;

  const searchInput = document.getElementById("locationSearchInput");
  if (searchInput) searchInput.value = "";

  window.buildLocationChips();
  modal.style.display = "flex";
  if (searchInput) searchInput.focus();
};

window.closeLocationPicker = function() {
  const modal = document.getElementById("locationPickerModal");
  if (modal) modal.style.display = "none";
};

window.buildLocationChips = function() {
  const container = document.getElementById("locationChipsContainer");
  if (!container) return;

  const rooms = Object.values(window.allFetchedRooms || {});
  const cityCounts = {};
  const areaCounts = {};
  const landmarkCounts = {};

  rooms.forEach(r => {
    const loc = getPropertyLocationData(r);
    if (loc.city) {
      const c = loc.city.trim();
      cityCounts[c] = (cityCounts[c] || 0) + 1;
    }
    if (loc.area) {
      const a = loc.area.trim();
      areaCounts[a] = (areaCounts[a] || 0) + 1;
    }
    if (loc.landmark) {
      const lm = loc.landmark.trim();
      landmarkCounts[lm] = (landmarkCounts[lm] || 0) + 1;
    }
  });

  // Curated popular locations for quick discovery even if database is small
  KNOWN_CITIES.slice(0, 4).forEach(c => { if (cityCounts[c] === undefined) cityCounts[c] = 0; });
  KNOWN_AREAS_PATNA.slice(0, 8).forEach(a => { if (areaCounts[a] === undefined) areaCounts[a] = 0; });
  const popularLandmarks = ["IIT Patna", "Patna Science College", "AIIMS Patna", "NIT Patna"];
  popularLandmarks.forEach(lm => { if (landmarkCounts[lm] === undefined) landmarkCounts[lm] = 0; });

  const chips = [];

  Object.keys(cityCounts).forEach(name => {
    chips.push({ name, type: "City", icon: "🏙️", count: cityCounts[name] });
  });

  Object.keys(areaCounts).forEach(name => {
    chips.push({ name, type: "Area", icon: "📍", count: areaCounts[name] });
  });

  Object.keys(landmarkCounts).forEach(name => {
    chips.push({ name, type: "Landmark", icon: "🎓", count: landmarkCounts[name] });
  });

  // Sort by count descending (those with active properties appear first!), then alphabetically
  chips.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  window.availableLocationChips = chips;
  window.renderLocationChips(chips);
};

window.renderLocationChips = function(chipsList, customQuery) {
  const container = document.getElementById("locationChipsContainer");
  if (!container) return;

  let html = "";

  if (window.activeManualLocation) {
    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 10px; padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; box-sizing: border-box;">
        <span style="font-size: 12.5px; color: #1e40af; font-weight: 600;">Active Filter: 📍 ${window.activeManualLocation}</span>
        <button type="button" onclick="window.resetNearMeFilter(); window.closeLocationPicker();" style="border: none; background: #ef4444; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; cursor: pointer; font-weight: 600;">Clear</button>
      </div>
    `;
  }

  if (customQuery && customQuery.trim().length > 0) {
    const safeQ = customQuery.trim().replace(/'/g, "\\'");
    html += `
      <div style="width: 100%; margin-bottom: 12px;">
        <button type="button" 
                onclick="window.selectManualLocation('${safeQ}', 'Manual Search')" 
                style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #2874f0; color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; box-shadow: 0 2px 6px rgba(40,116,240,0.25);">
          <span>🔎 Filter by: "${customQuery.trim()}"</span>
          <span style="font-size: 12px; opacity: 0.9;">Apply Filter ➔</span>
        </button>
      </div>
    `;
  }

  if (!chipsList || chipsList.length === 0) {
    if (!customQuery) {
      html += `<p style="width: 100%; color: #64748b; font-size: 13px; text-align: center; padding: 15px 0;">No matching locations found.</p>`;
    }
  } else {
    chipsList.forEach(chip => {
      const isActive = window.activeManualLocation && window.activeManualLocation.toLowerCase() === chip.name.toLowerCase();
      const badgeText = chip.count > 0 ? `${chip.count} PG${chip.count > 1 ? 's' : ''}` : chip.type;
      html += `
        <button type="button" 
                class="location-chip-btn ${isActive ? 'active' : ''}" 
                onclick="window.selectManualLocation('${chip.name.replace(/'/g, "\\'")}', '${chip.type}')">
          <span>${chip.icon} ${chip.name}</span>
          <small class="location-chip-tag">${badgeText}</small>
        </button>
      `;
    });
  }

  container.innerHTML = html;
};

window.filterLocationChips = function(query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) {
    window.renderLocationChips(window.availableLocationChips);
    return;
  }
  const filtered = (window.availableLocationChips || []).filter(c => {
    return c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
  });
  window.renderLocationChips(filtered, query);
};

window.submitLocationSearch = function(query) {
  const q = (query || "").trim();
  if (!q) return;
  window.selectManualLocation(q, "Manual Search");
};

window.selectManualLocation = function(locName, locType) {
  if (!locName || !locName.trim()) return;
  window.activeManualLocation = locName.trim();
  window.activeManualLocationType = locType || "Manual";
  window.isNearMeActive = true;
  window.userCurrentLocation = null;

  window.closeLocationPicker();
  updateNearMeButtonUI();
  executeGlobalFilter();
};

window.resetNearMeFilter = function() {
  window.activeManualLocation = null;
  window.activeManualLocationType = null;
  window.isNearMeActive = false;
  window.userCurrentLocation = null;

  Object.values(window.allFetchedRooms).forEach(r => {
    delete r._calculatedDistance;
    delete r._matchedLocationField;
  });

  updateNearMeButtonUI();
  updateNearMeStatusBanner(null);
  executeGlobalFilter();
};

window.toggleNearMeFilter = function() {
  window.openLocationPicker();
};

window.useDeviceGpsLocation = function() {
  const btn = document.getElementById("nearMeBtn");
  window.closeLocationPicker();

  if (!navigator.geolocation) {
    alert("📍 Geolocation is not supported by your browser. Please select an area or city from the list.");
    window.openLocationPicker();
    return;
  }

  if (btn) {
    btn.classList.add("loading");
    btn.innerHTML = `⏳ Locating...`;
  }

  navigator.geolocation.getCurrentPosition(
    async function(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      window.userCurrentLocation = { latitude: lat, longitude: lng };
      window.isNearMeActive = true;

      // 🔍 Reverse Geocode to detect actual City / Area / Locality name from coordinates
      // This allows filtering properties using manually entered address fields without relying purely on GPS distance
      let detectedAreaOrCity = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          detectedAreaOrCity = geoData.locality || geoData.city || geoData.principalSubdivision;
          if (detectedAreaOrCity) {
            console.log("📍 Detected Location from GPS:", detectedAreaOrCity);
          }
        }
      } catch (e) {
        console.warn("Reverse geocode fetch failed or timed out:", e);
      }

      if (detectedAreaOrCity) {
        window.activeManualLocation = detectedAreaOrCity;
        window.activeManualLocationType = "Detected GPS Area";
      } else {
        window.activeManualLocation = null;
      }

      updateNearMeButtonUI();
      executeGlobalFilter();
    },
    function(error) {
      if (btn) {
        btn.classList.remove("loading");
        updateNearMeButtonUI();
      }
      let errorMsg = "Unable to retrieve device GPS.";
      if (error.code === error.PERMISSION_DENIED) {
        errorMsg = "📍 Location access was denied. Please select your area or city manually from the list.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMsg = "📍 GPS is unavailable. Please select your area or city manually.";
      } else if (error.code === error.TIMEOUT) {
        errorMsg = "📍 GPS request timed out. Please select your area or city manually.";
      }
      alert(errorMsg);
      window.openLocationPicker();
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
};

function updateNearMeButtonUI() {
  const btn = document.getElementById("nearMeBtn");
  if (!btn) return;
  btn.classList.remove("loading");
  if (window.activeManualLocation) {
    btn.classList.add("active");
    btn.innerHTML = `<span>📍 ${window.activeManualLocation}</span> <span class="near-me-clear-x" onclick="event.stopPropagation(); window.resetNearMeFilter();" title="Clear location filter">✕</span>`;
    btn.title = `Filtered by: ${window.activeManualLocation} (Click to change, or click ✕ to clear)`;
  } else if (window.isNearMeActive && window.userCurrentLocation) {
    btn.classList.add("active");
    btn.innerHTML = `<span>📍 GPS Active ✓</span> <span class="near-me-clear-x" onclick="event.stopPropagation(); window.resetNearMeFilter();" title="Clear GPS filter">✕</span>`;
    btn.title = "GPS location active (Click to change or clear)";
  } else {
    btn.classList.remove("active");
    btn.innerHTML = `📍 Near Me`;
    btn.title = "Select location, area or city";
  }
}

function updateNearMeStatusBanner(text) {
  let banner = document.getElementById("nearMeStatusBanner");
  if (!banner) {
    const roomList = document.getElementById("roomList");
    if (roomList && roomList.parentNode) {
      banner = document.createElement("div");
      banner.id = "nearMeStatusBanner";
      banner.className = "near-me-status-banner";
      roomList.parentNode.insertBefore(banner, roomList);
    }
  }

  if (banner) {
    if ((window.isNearMeActive || window.activeManualLocation) && text) {
      banner.innerHTML = `
        <div class="near-me-banner-content">
          <span>${text}</span>
          <button type="button" class="near-me-banner-reset" onclick="window.resetNearMeFilter()">Reset</button>
        </div>
      `;
      banner.style.display = "block";
    } else {
      banner.style.display = "none";
    }
  }
}

// Filters properties using manually entered address fields saved in Firestore (building.area, building.city, building.address, building.landmark)
function applyManualLocationFilter(rooms, manualLoc) {
  if (!manualLoc || !rooms || rooms.length === 0) return rooms;

  const target = normalizeLocationString(manualLoc);
  const targetTokens = target.split(" ").filter(w => w.length > 0);

  const matched = [];

  rooms.forEach(room => {
    const loc = getPropertyLocationData(room);
    const normArea = normalizeLocationString(loc.area);
    const normCity = normalizeLocationString(loc.city);
    const normAddress = normalizeLocationString(loc.address);
    const normLandmark = normalizeLocationString(loc.landmark);
    const normPincode = (loc.pincode || "").trim();
    const houseName = normalizeLocationString(room.houseName || room.name || "");
    const normSearchable = `${houseName} ${normalizeLocationString(loc.searchableText)}`;

    let isMatch = false;
    let matchField = null;

    // 1. Check Area (building.area)
    if (normArea) {
      if (normArea.includes(target) || (target.length >= 3 && target.includes(normArea))) {
        isMatch = true;
        matchField = `Area: ${loc.area}`;
      } else if (targetTokens.length > 1 && targetTokens.every(t => normArea.includes(t))) {
        isMatch = true;
        matchField = `Area: ${loc.area}`;
      }
    }

    // 2. Check City (building.city)
    if (!isMatch && normCity) {
      if (normCity.includes(target) || target.includes(normCity)) {
        isMatch = true;
        matchField = `City: ${loc.city}`;
      } else if (targetTokens.length > 1 && targetTokens.every(t => normCity.includes(t))) {
        isMatch = true;
        matchField = `City: ${loc.city}`;
      }
    }

    // 3. Check Landmark (building.landmark)
    if (!isMatch && normLandmark) {
      if (normLandmark.includes(target) || (target.length >= 3 && target.includes(normLandmark))) {
        isMatch = true;
        matchField = `Near: ${loc.landmark}`;
      } else if (targetTokens.length > 1 && targetTokens.every(t => normLandmark.includes(t))) {
        isMatch = true;
        matchField = `Near: ${loc.landmark}`;
      }
    }

    // 4. Check Address (building.address)
    if (!isMatch && normAddress) {
      if (normAddress.includes(target)) {
        isMatch = true;
        matchField = `In: ${loc.area || loc.city || manualLoc}`;
      } else if (targetTokens.length > 1 && targetTokens.every(t => normAddress.includes(t))) {
        isMatch = true;
        matchField = `In: ${loc.area || loc.city || manualLoc}`;
      }
    }

    // 5. Check Pincode
    if (!isMatch && normPincode && (normPincode === target || target.includes(normPincode))) {
      isMatch = true;
      matchField = `Pin: ${loc.pincode}`;
    }

    // 6. Searchable text fallback
    if (!isMatch) {
      if (normSearchable.includes(target)) {
        isMatch = true;
        matchField = `Location: ${loc.displayLocation}`;
      } else if (targetTokens.length > 1 && targetTokens.every(t => normSearchable.includes(t))) {
        isMatch = true;
        matchField = `Location: ${loc.displayLocation}`;
      }
    }

    if (isMatch) {
      room._matchedLocationField = matchField;
      matched.push(room);
    } else {
      delete room._matchedLocationField;
    }
  });

  const bannerText = matched.length > 0
    ? `📍 Showing properties matching "${manualLoc}" (${matched.length} found)`
    : `📍 No properties found matching "${manualLoc}" in stored address records`;
  updateNearMeStatusBanner(bannerText);

  return matched;
}

// Distance fallback if GPS is explicitly active without dropping properties missing coordinates
function applyNearMeFilter(rooms, userLoc) {
  if (!userLoc || !rooms || rooms.length === 0) return rooms;

  rooms.forEach(room => {
    const coords = getPropertyCoordinates(room);
    if (coords) {
      room._calculatedDistance = calculateHaversineDistance(
        userLoc.latitude,
        userLoc.longitude,
        coords.lat,
        coords.lng
      );
    } else {
      room._calculatedDistance = Infinity;
    }
  });

  // Sort properties with coordinates first by proximity, then retain remaining properties
  const sortedRooms = [...rooms].sort((a, b) => {
    return (a._calculatedDistance ?? Infinity) - (b._calculatedDistance ?? Infinity);
  });

  const withCoords = sortedRooms.filter(r => r._calculatedDistance !== Infinity);
  const within15km = withCoords.filter(r => r._calculatedDistance <= 15);

  let statusBannerText = "";
  if (within15km.length > 0) {
    statusBannerText = `📍 Found ${within15km.length} propert${within15km.length === 1 ? 'y' : 'ies'} within 15 km of your GPS location`;
    updateNearMeStatusBanner(statusBannerText);
    return within15km;
  } else if (withCoords.length > 0) {
    statusBannerText = `📍 Nearest properties sorted by device distance`;
    updateNearMeStatusBanner(statusBannerText);
    return sortedRooms;
  } else {
    statusBannerText = `📍 GPS active. Showing all properties (select area/city for precise matching)`;
    updateNearMeStatusBanner(statusBannerText);
    return sortedRooms;
  }
}

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

  const normQuery = normalizeLocationString(query);
  const suggestionsMap = new Map();
  const rooms = Object.values(window.allFetchedRooms);

  rooms.forEach(room => {
    const loc = getPropertyLocationData(room);
    const name = room.houseName || room.name || "";
    const pg = room.pgType || room.type || "";

    if (name && normalizeLocationString(name).includes(normQuery) && !suggestionsMap.has("name:" + name.toLowerCase())) {
      suggestionsMap.set("name:" + name.toLowerCase(), { label: name, type: "House Name" });
    }
    if (loc.area && (normalizeLocationString(loc.area).includes(normQuery) || normQuery.includes(normalizeLocationString(loc.area))) && !suggestionsMap.has("area:" + loc.area.toLowerCase())) {
      suggestionsMap.set("area:" + loc.area.toLowerCase(), { label: loc.area, type: "Area" });
    }
    if (loc.city && (normalizeLocationString(loc.city).includes(normQuery) || normQuery.includes(normalizeLocationString(loc.city))) && !suggestionsMap.has("city:" + loc.city.toLowerCase())) {
      suggestionsMap.set("city:" + loc.city.toLowerCase(), { label: loc.city, type: "City" });
    }
    if (loc.landmark && normalizeLocationString(loc.landmark).includes(normQuery) && !suggestionsMap.has("landmark:" + loc.landmark.toLowerCase())) {
      suggestionsMap.set("landmark:" + loc.landmark.toLowerCase(), { label: loc.landmark, type: "Landmark" });
    }
    if (loc.address && normalizeLocationString(loc.address).includes(normQuery) && !suggestionsMap.has("addr:" + loc.address.toLowerCase())) {
      suggestionsMap.set("addr:" + loc.address.toLowerCase(), { label: loc.address, type: "Address" });
    }
    if (loc.pincode && loc.pincode.includes(query.trim()) && !suggestionsMap.has("pin:" + loc.pincode)) {
      suggestionsMap.set("pin:" + loc.pincode, { label: loc.pincode, type: "Pincode" });
    }
    if (pg && pg.toLowerCase().includes(query.toLowerCase()) && !suggestionsMap.has("pg:" + pg.toLowerCase())) {
      suggestionsMap.set("pg:" + pg.toLowerCase(), { label: pg, type: "Property Type" });
    }
  });

  const uniqueList = Array.from(suggestionsMap.values()).slice(0, 8);

  if (uniqueList.length === 0) {
    box.style.display = "none";
    return;
  }

  let html = "";
  uniqueList.forEach(item => {
    let icon = "🔍";
    if (item.type === "City") icon = "🏙️";
    else if (item.type === "Area") icon = "📍";
    else if (item.type === "Landmark") icon = "🎓";
    else if (item.type === "Address") icon = "🏠";
    else if (item.type === "Property Type") icon = "🏷️";
    else if (item.type === "Pincode") icon = "📮";

    html += `
      <div class="suggestion-item" onclick="window.selectSuggestion('${item.label.replace(/'/g, "\\'")}', '${item.type}')">
        <span>${icon} ${item.label}</span>
        <small class="suggestion-tag-type">${item.type}</small>
      </div>
    `;
  });

  box.innerHTML = html;
  box.style.display = "block";
};

// Select suggestion item (activates manual location filter if Area/City/Landmark clicked)
window.selectSuggestion = function(text, type) {
  if (type === "Area" || type === "City" || type === "Landmark") {
    window.selectManualLocation(text, type);
    const input = document.getElementById("searchInput");
    if (input) input.value = "";
    window.activeSearchQuery = "";
  } else {
    window.addSearchTag(text);
  }
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

// Text + Multi-Tag Search Filter Logic (Matches building name, type, and manual address fields: building.area, building.city, building.address, building.landmark, building.pincode)
function applyTextSearchFilter(roomsList, query, tags) {
  let filtered = roomsList;

  const matchFilterTerm = (room, term) => {
    if (!term) return true;
    const cleanTerm = normalizeLocationString(term);
    if (!cleanTerm) return true;
    const tokens = cleanTerm.split(" ").filter(w => w.length > 0);

    const loc = getPropertyLocationData(room);
    const houseName = normalizeLocationString(room.houseName || room.name || "");
    const pgType = normalizeLocationString(room.pgType || room.type || "");
    const normArea = normalizeLocationString(loc.area);
    const normCity = normalizeLocationString(loc.city);
    const normAddress = normalizeLocationString(loc.address);
    const normLandmark = normalizeLocationString(loc.landmark);
    const normPincode = (loc.pincode || "").trim();
    const searchable = `${houseName} ${pgType} ${normalizeLocationString(loc.searchableText)}`;

    // 1. Direct whole-string match in searchable text or specific manual address fields
    if (searchable.includes(cleanTerm)) return true;
    if (normArea && (normArea.includes(cleanTerm) || cleanTerm.includes(normArea))) return true;
    if (normCity && (normCity.includes(cleanTerm) || cleanTerm.includes(normCity))) return true;
    if (normLandmark && (normLandmark.includes(cleanTerm) || cleanTerm.includes(normLandmark))) return true;
    if (normAddress && normAddress.includes(cleanTerm)) return true;
    if (normPincode && (normPincode === term.trim() || normPincode.includes(term.trim()))) return true;

    // 2. All tokens match in searchable text
    if (tokens.length > 1 && tokens.every(t => searchable.includes(t))) return true;

    return false;
  };

  if (tags && tags.length > 0) {
    filtered = filtered.filter(room => {
      return tags.every(tag => matchFilterTerm(room, tag));
    });
  }

  if (query) {
    filtered = filtered.filter(room => {
      return matchFilterTerm(room, query);
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

  // Primary Location Filter: Manual Address fields from Firestore
  if (window.activeManualLocation) {
    filteredRooms = applyManualLocationFilter(filteredRooms, window.activeManualLocation);
  } else if (window.isNearMeActive && window.userCurrentLocation) {
    // Secondary fallback: Device GPS distance calculation
    filteredRooms = applyNearMeFilter(filteredRooms, window.userCurrentLocation);
  } else {
    updateNearMeStatusBanner(null);
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
// 🏢 5.5 DYNAMIC ROOM CONFIGURATION & LIVE VACANCY ENGINE
// ==========================================
function extractConfiguredConfigs(building) {
  if (!building) return [];
  const configuredConfigs = [];

  if (Array.isArray(building.configuredRoomTypes)) {
    building.configuredRoomTypes.forEach(c => {
      const count = Number(c.totalCount || c.total || c.units || 0);
      if (count > 0) {
        const typeName = c.type || c.roomType || c.name || "Unit";
        const isFlat = typeName.toUpperCase().includes("FLAT");
        configuredConfigs.push({
          type: isFlat ? "Flat" : "Room",
          category: typeName,
          totalCount: count,
          rent: Number(c.rent || c.price || 0),
          prefix: c.prefix || (isFlat ? "Flat-" : "SR-")
        });
      }
    });
  } else if (building.configuredRoomTypes && typeof building.configuredRoomTypes === 'object') {
    Object.keys(building.configuredRoomTypes).forEach(key => {
      const c = building.configuredRoomTypes[key];
      const count = Number(c.totalCount || c.total || c.units || 0);
      if (count > 0) {
        const typeName = c.type || c.roomType || key;
        const isFlat = typeName.toUpperCase().includes("FLAT");
        configuredConfigs.push({
          type: isFlat ? "Flat" : "Room",
          category: typeName,
          totalCount: count,
          rent: Number(c.rent || c.price || 0),
          prefix: c.prefix || (isFlat ? "Flat-" : "SR-")
        });
      }
    });
  }

  if (configuredConfigs.length === 0 && Array.isArray(building.roomTypes)) {
    building.roomTypes.forEach(c => {
      const count = Number(c.totalCount || c.total || c.units || 0);
      if (count > 0) {
        const typeName = c.name || c.roomType || c.type || "Unit";
        const isFlat = typeName.toUpperCase().includes("FLAT");
        configuredConfigs.push({
          type: isFlat ? "Flat" : "Room",
          category: typeName,
          totalCount: count,
          rent: Number(c.rent || c.price || 0),
          prefix: c.prefix || (isFlat ? "Flat-" : "SR-")
        });
      }
    });
  }

  if (configuredConfigs.length === 0 && building.inventory) {
    const inv = building.inventory;
    if (inv.flats) {
      if (inv.flats.bhk1 && Number(inv.flats.bhk1.total || inv.flats.bhk1.totalCount || 0) > 0) {
        configuredConfigs.push({
          type: "Flat",
          category: "1 BHK FLAT",
          totalCount: Number(inv.flats.bhk1.total || inv.flats.bhk1.totalCount),
          rent: Number(inv.flats.bhk1.rent || 0),
          prefix: "Flat-"
        });
      }
      if (inv.flats.bhk2 && Number(inv.flats.bhk2.total || inv.flats.bhk2.totalCount || 0) > 0) {
        configuredConfigs.push({
          type: "Flat",
          category: "2 BHK FLAT",
          totalCount: Number(inv.flats.bhk2.total || inv.flats.bhk2.totalCount),
          rent: Number(inv.flats.bhk2.rent || 0),
          prefix: "Flat-2-"
        });
      }
      if (inv.flats.bhk3 && Number(inv.flats.bhk3.total || inv.flats.bhk3.totalCount || 0) > 0) {
        configuredConfigs.push({
          type: "Flat",
          category: "3 BHK FLAT",
          totalCount: Number(inv.flats.bhk3.total || inv.flats.bhk3.totalCount),
          rent: Number(inv.flats.bhk3.rent || 0),
          prefix: "Flat-3-"
        });
      }
    }
    if (inv.rooms) {
      if (inv.rooms.single && Number(inv.rooms.single.total || inv.rooms.single.totalCount || 0) > 0) {
        configuredConfigs.push({
          type: "Room",
          category: "SINGLE ROOM",
          totalCount: Number(inv.rooms.single.total || inv.rooms.single.totalCount),
          rent: Number(inv.rooms.single.rent || 0),
          prefix: "SR-"
        });
      }
      if (inv.rooms.double && Number(inv.rooms.double.total || inv.rooms.double.totalCount || 0) > 0) {
        configuredConfigs.push({
          type: "Room",
          category: "DOUBLE ROOM",
          totalCount: Number(inv.rooms.double.total || inv.rooms.double.totalCount),
          rent: Number(inv.rooms.double.rent || 0),
          prefix: "DR-"
        });
      }
      if (inv.rooms.triple && Number(inv.rooms.triple.total || inv.rooms.triple.totalCount || 0) > 0) {
        configuredConfigs.push({
          type: "Room",
          category: "TRIPLE ROOM",
          totalCount: Number(inv.rooms.triple.total || inv.rooms.triple.totalCount),
          rent: Number(inv.rooms.triple.rent || 0),
          prefix: "TR-"
        });
      }
    }
  }

  if (configuredConfigs.length === 0) {
    const rootTotal = Number(building.totalCount || building.totalRooms || building.totalUnits || 0);
    if (rootTotal > 0) {
      const isFlat = String(building.pgType || building.type || '').toUpperCase().includes("FLAT");
      configuredConfigs.push({
        type: isFlat ? "Flat" : "Room",
        category: building.pgType || (isFlat ? "1 BHK FLAT" : "SINGLE ROOM"),
        totalCount: rootTotal,
        rent: Number(building.roomPrice || building.rent || 0),
        prefix: isFlat ? "Flat-" : "SR-"
      });
    }
  }

  return configuredConfigs;
}

function formatShortRoomType(category) {
  if (!category) return "Unit";
  let s = String(category).trim();
  const bhkMatch = s.match(/([1-9]\s*BHK)/i);
  if (bhkMatch) return bhkMatch[1].toUpperCase();
  if (/single/i.test(s)) return "Single Room";
  if (/double/i.test(s)) return "Double Room";
  if (/triple/i.test(s)) return "Triple Room";
  return s.replace(/\bFLAT\b/i, '').replace(/\bROOM\b/i, 'Room').trim() || s;
}

function computeBuildingVacancy(building, buildingBookings = []) {
  const configuredConfigs = extractConfiguredConfigs(building);
  const unitsList = [];
  configuredConfigs.forEach(cfg => {
    for (let i = 1; i <= cfg.totalCount; i++) {
      const padNum = String(i).padStart(2, '0');
      const unitNumber = `${cfg.prefix}${padNum}`;
      unitsList.push({
        number: unitNumber,
        rawNumber: padNum,
        rawIndex: i,
        type: cfg.type,
        category: cfg.category,
        rent: cfg.rent,
        isOccupied: false
      });
    }
  });

  const matchedBookingIds = new Set();
  unitsList.forEach(unit => {
    const normUnit = unit.number.toLowerCase().replace(/[\s\-_]/g, "");
    const normRaw = unit.rawNumber.toLowerCase();
    const rawIdx = String(unit.rawIndex);

    const match = buildingBookings.find(b => {
      if (matchedBookingIds.has(b.id)) return false;
      const st = (b.status || "Active").toLowerCase();
      const rStatus = (b.roomStatus || "").toLowerCase();
      if (st === "deleted" || st === "vacated" || st === "cancelled" || st === "inactive" || rStatus === "vacant" || b.isActive === false) return false;
      const bRoom = (b.roomDesignation || b.roomNumber || b.roomNo || "").toLowerCase().replace(/[\s\-_]/g, "");
      if (!bRoom) return false;

      if (bRoom === normUnit || bRoom === normRaw) return true;
      if (bRoom === "flat" + rawIdx || bRoom === "flat" + normRaw) return true;
      if (bRoom === "sr" + rawIdx || bRoom === "sr" + normRaw) return true;
      if (bRoom === "dr" + rawIdx || bRoom === "dr" + normRaw) return true;
      if (bRoom === "tr" + rawIdx || bRoom === "tr" + normRaw) return true;
      if (bRoom === rawIdx && (b.roomType || '').toLowerCase() === unit.type.toLowerCase()) return true;

      return false;
    });

    if (match) {
      matchedBookingIds.add(match.id);
      unit.isOccupied = true;
    }
  });

  const vacantByType = {};
  configuredConfigs.forEach(cfg => {
    const cat = cfg.category || cfg.type;
    vacantByType[cat] = 0;
  });

  unitsList.forEach(u => {
    if (!u.isOccupied) {
      const cat = u.category || u.type || "Unit";
      vacantByType[cat] = (vacantByType[cat] || 0) + 1;
    }
  });

  return { configuredConfigs, unitsList, vacantByType };
}

// ==========================================
// 📺 6. HOME PAGE GRID RENDERER
// ==========================================
window.renderRoomsOnDOM = (e => {
  let t = document.getElementById("roomList");
  if (!t) return; 
  t.innerHTML = "";
  
  if (!e || e.length === 0) {
    if (window.isShowingFavoritesOnly) {
      t.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: white; border-radius: 16px; border: 1px dashed #cbd5e1; margin: 15px 0;">
          <div style="font-size: 36px; margin-bottom: 8px;">❤️</div>
          <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 17px;">No Favorite Properties Yet</h3>
          <p style="margin: 0 0 16px; color: #64748b; font-size: 13.5px;">Click the heart icon on any property to save it to your favorites.</p>
          <button type="button" onclick="window.resetFavoritesView()" style="background: #2874f0; color: white; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">Browse All Properties</button>
        </div>
      `;
    } else if (window.activeManualLocation) {
      t.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: white; border-radius: 16px; border: 1px dashed #cbd5e1; margin: 15px 0;">
          <div style="font-size: 36px; margin-bottom: 8px;">📍</div>
          <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 17px;">No Properties Found in "${window.activeManualLocation}"</h3>
          <p style="margin: 0 0 16px; color: #64748b; font-size: 13.5px;">No properties matched this area, city, or landmark in our stored manual address records.</p>
          <button type="button" onclick="window.resetNearMeFilter()" style="background: #2874f0; color: white; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">View All Available Properties</button>
        </div>
      `;
    } else {
      t.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: white; border-radius: 16px; border: 1px dashed #cbd5e1; margin: 15px 0;">
          <div style="font-size: 36px; margin-bottom: 8px;">🔍</div>
          <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 17px;">No Matching Properties Found</h3>
          <p style="margin: 0 0 16px; color: #64748b; font-size: 13.5px;">Try searching by area (e.g. Boring Road), city (e.g. Patna), landmark, or resetting filters.</p>
          <button type="button" onclick="window.clearSearchInput(); window.resetNearMeFilter();" style="background: #2874f0; color: white; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">Reset All Filters</button>
        </div>
      `;
    }
    return;
  }

  let htmlContent = "";
  e.forEach((item => {
    window.allFetchedRooms[item.id] = item;
    
    let price = item.roomPrice || "N/A";
    if (!item.roomPrice && item.inventory) {
      price = item.inventory.rooms?.single?.rent || item.inventory.rooms?.double?.rent || item.inventory.rooms?.triple?.rent || item.inventory.flats?.bhk1?.rent || item.inventory.flats?.bhk2?.rent || item.inventory.flats?.bhk3?.rent || "N/A";
    }

    const currentFavIcon = window.favoriteRoomIds.has(item.id) ? "❤️" : "💛";

    // 🟢 DYNAMIC VACANCY BREAKDOWN: Compare building configuration against active bookings
    const itemBookings = (window.allActiveBookings || []).filter(bk => {
      if (bk.propertyId === item.id || bk.buildingId === item.id) {
        const st = (bk.status || "Active").toLowerCase();
        const rStatus = (bk.roomStatus || "").toLowerCase();
        return st !== "vacated" && st !== "cancelled" && st !== "inactive" && st !== "deleted" && rStatus !== "vacant" && bk.isActive !== false;
      }
      return false;
    });

    const { unitsList, vacantByType } = computeBuildingVacancy(item, itemBookings);

    const vacantItems = Object.keys(vacantByType)
      .filter(cat => vacantByType[cat] > 0)
      .map(cat => ({
        name: formatShortRoomType(cat),
        count: vacantByType[cat]
      }));

    // Sort descending by vacancy count (e.g. Single Room (20) | 2 BHK (2))
    vacantItems.sort((a, b) => b.count - a.count);

    let vacantTagHtml = '';
    if (vacantItems.length > 0) {
      const summaryStr = vacantItems.map(it => `${it.name} (${it.count})`).join(' <span class="b-vacant-sep">|</span> ');
      vacantTagHtml = `
        <div class="b-vacant-summary-tag">
          <span class="b-vacant-dot">🟢</span>
          <span class="b-vacant-tag-text">${summaryStr}</span>
        </div>
      `;
    } else if (unitsList.length > 0) {
      vacantTagHtml = `
        <div class="b-vacant-summary-tag is-empty">
          <span class="b-vacant-dot">⚪</span>
          <span class="b-vacant-tag-text">Fully Occupied (0 Vacant)</span>
        </div>
      `;
    } else {
      vacantTagHtml = `
        <div class="b-vacant-summary-tag is-empty">
          <span class="b-vacant-dot">⚪</span>
          <span class="b-vacant-tag-text">No Units Configured</span>
        </div>
      `;
    }

    const locData = getPropertyLocationData(item);

    let nearMeBadgeHtml = '';
    if (window.activeManualLocation) {
      const matchBadge = item._matchedLocationField || `In ${locData.area || locData.city || window.activeManualLocation}`;
      nearMeBadgeHtml = `
        <div class="near-me-distance-badge" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;">
          📍 ${matchBadge}
        </div>
      `;
    } else if (window.isNearMeActive && item._calculatedDistance !== undefined && item._calculatedDistance !== Infinity) {
      const distStr = item._calculatedDistance < 1 
        ? `${(item._calculatedDistance * 1000).toFixed(0)} m away`
        : `${item._calculatedDistance.toFixed(1)} km away`;
      nearMeBadgeHtml = `
        <div class="near-me-distance-badge">
          📍 ${distStr}
        </div>
      `;
    } else if (window.activeSearchQuery) {
      const normQ = normalizeLocationString(window.activeSearchQuery);
      if (locData.area && normalizeLocationString(locData.area).includes(normQ)) {
        nearMeBadgeHtml = `
          <div class="near-me-distance-badge" style="background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;">
            📍 Area: ${locData.area}
          </div>
        `;
      } else if (locData.city && normalizeLocationString(locData.city).includes(normQ)) {
        nearMeBadgeHtml = `
          <div class="near-me-distance-badge" style="background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;">
            📍 City: ${locData.city}
          </div>
        `;
      } else if (locData.landmark && normalizeLocationString(locData.landmark).includes(normQ)) {
        nearMeBadgeHtml = `
          <div class="near-me-distance-badge" style="background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;">
            📍 Near: ${locData.landmark}
          </div>
        `;
      }
    }

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
        <div class="card-location" title="${locData.displayLocation}${locData.landmark ? ' • Landmark: ' + locData.landmark : ''}${locData.address ? ' • ' + locData.address : ''}">📍 ${locData.displayLocation}</div>
        ${vacantTagHtml}
        ${nearMeBadgeHtml}
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

  const detLoc = getPropertyLocationData(t);
  setSafeText("detDescription", t.buildingDescription || t.description || "No description provided.");
  setSafeHTML("detAddress", `📍 Location: ${detLoc.displayLocation}${detLoc.address && !detLoc.displayLocation.includes(detLoc.address) ? ' • Address: ' + detLoc.address : ''}${detLoc.landmark ? ' • Landmark: ' + detLoc.landmark : ''}`);
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

    const nearMeDistanceText = (window.isNearMeActive && !window.activeManualLocation && t._calculatedDistance !== undefined && t._calculatedDistance !== Infinity)
      ? ` • 📍 ${t._calculatedDistance < 1 ? (t._calculatedDistance * 1000).toFixed(0) + ' m' : t._calculatedDistance.toFixed(1) + ' km'} away`
      : "";

    if (tabData.single || tabData.double || tabData.triple) {
      let priceTxt = "", topTxtArr = [], shareArr = [];
      if (tabData.single && tabData.single.total > 0) { priceTxt += `₹${tabData.single.rent}`; topTxtArr.push(`Single Room: ${tabData.single.vacant} Left (Total: ${tabData.single.total})`); shareArr.push("Single"); }
      if (tabData.double && tabData.double.total > 0) { if (priceTxt) priceTxt += " / "; priceTxt += `₹${tabData.double.rent}`; topTxtArr.push(`Double Room: ${tabData.double.vacant} Left (Total: ${tabData.double.total})`); shareArr.push("Double"); }
      if (tabData.triple && tabData.triple.total > 0) { if (priceTxt) priceTxt += " / "; priceTxt += `₹${tabData.triple.rent}`; topTxtArr.push(`Triple Room: ${tabData.triple.vacant} Left (Total: ${tabData.triple.total})`); shareArr.push("Triple"); }
      
      pEl.innerText = priceTxt ? `${priceTxt}/month` : "N/A"; 
      topEl.innerText = `${topTxtArr.join(" • ") || "Room Details Available"}${nearMeDistanceText}`; 
      shEl.innerHTML = `👥 Sharing Type: ${shareArr.join(" & ") || "Standard"} Sharing`;
    } else {
      pEl.innerText = `₹${tabData.rent || "N/A"}/month`; 
      topEl.innerText = `${tabTitle} • ${tabData.vacant || 0} Vacant (Total: ${tabData.total || 0})${nearMeDistanceText}`; 
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
      const loc = getPropertyLocationData(t);
      dynContainer.innerHTML = `
        <p class="dynamic-row-item"><strong>📍 Address:</strong> ${loc.address || 'N/A'}</p>
        <p class="dynamic-row-item"><strong>🏙️ City / Area:</strong> ${loc.area ? (loc.area + (loc.city ? ', ' + loc.city : '')) : (loc.city || 'N/A')}</p>
        <p class="dynamic-row-item"><strong>🎓 Landmark:</strong> ${loc.landmark || 'N/A'}</p>
      `;
    }
  }

  const callBtn = document.getElementById("detCallBtn");
  if (callBtn) callBtn.onclick = (() => { if (t.ownerPhone) window.location.href = `tel:${t.ownerPhone}`; });

  const mapBtn = document.getElementById("detMapBtn");
  if (mapBtn) mapBtn.onclick = (() => {
    if (t.location && t.location.latitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${t.location.latitude},${t.location.longitude}`);
    } else {
      const loc = getPropertyLocationData(t);
      const query = encodeURIComponent(`${loc.displayLocation}, ${t.houseName || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
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
