// 📍 RISU GPS Engine & Distance Calculation
const RISU_LAT = 21.3142, RISU_LON = 81.365;

function calculateRealDistance(e, t) {
  if (!e || !t) return "N/A";
  const a = 6371, n = (t - RISU_LON) * Math.PI / 180, 
        i = Math.sin((e - RISU_LAT) * Math.PI / 180 / 2) * Math.sin((e - RISU_LAT) * Math.PI / 180 / 2) + Math.cos(RISU_LAT * Math.PI / 180) * Math.cos(e * Math.PI / 180) * Math.sin(n / 2) * Math.sin(n / 2);
  return (a * (2 * Math.atan2(Math.sqrt(i), Math.sqrt(1 - i)))).toFixed(1);
}

window.allFetchedRooms = {};
window.handleRoomClick = (e => { window.loadRoomDetailPage(e) });

// 📺 Home Page Grid Renderer
window.renderRoomsOnDOM = (e => {
  let t = document.getElementById("roomList");
  if (!t) return; t.innerHTML = "";
  if (0 === e.length) {
    t.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #7f8c8d; padding: 20px;">⚠️ Abhi tak koi room add nahi kiya gaya hai.</p>';
    return;
  }
  e.forEach((e => {
    window.allFetchedRooms[e.id] = e;
    let a = "0.5"; e.location && e.location.latitude && (a = calculateRealDistance(e.location.latitude, e.location.longitude));
    let n = e.roomPrice || "N/A";
    if (!e.roomPrice && e.inventory) {
      n = e.inventory.rooms?.single?.rent || e.inventory.rooms?.double?.rent || e.inventory.rooms?.triple?.rent || e.inventory.flats?.bhk1?.rent || e.inventory.flats?.bhk2?.rent || e.inventory.flats?.bhk3?.rent || "N/A";
    }
    t.innerHTML += `
    <div class="card" onclick="window.handleRoomClick('${e.id}')" style="cursor: pointer;">
      <img src="${e.mainPhotoUrl || "https://via.placeholder.com/400x300?text=Property+Photo"}" alt="${e.houseName}">
      <div class="card-content">
        <div class="price">₹${n}/month</div>
        <div class="pg-type">${e.pgType || "Standard"} PG • ${e.houseName || "Hub"}</div>
        <div class="distance">📍 ${a} km from RISU</div>
      </div>
    </div>`;
  }));
});

// 🏢 Load Specific Room Detail Page
window.loadRoomDetailPage = (e => {
  const t = window.allFetchedRooms[e];
  if (!t) return;
  let a = "0.5"; t.location && t.location.latitude && (a = calculateRealDistance(t.location.latitude, t.location.longitude));
  
  // Static Binder
  document.getElementById("detMainImage").src = t.mainPhotoUrl || "https://via.placeholder.com/400x300?text=Property+Photo";
  document.getElementById("detDescription").innerText = t.buildingDescription || t.description || "No description provided.";
  document.getElementById("detAddress").innerHTML = `📍 Address: ${t.exactAddress || t.manualAddress || "Not Provided"}`;
  document.getElementById("detOwnerName").innerHTML = `👤 Owner: ${t.ownerName || "Not Disclosed"}`;
  document.getElementById("detOwnerPhone").innerHTML = `📞 Phone: ${t.ownerPhone || "N/A"}`;
  
  const n = t.gateClosingTime || t.rules?.gateClosingTime || "11:00 PM", i = document.getElementById("displayGateTime");
  if (i) i.innerText = n;
  document.getElementById("detGateTime").innerHTML = `⏰ Gate Closing Time: ${n}`;
  
  let l = "", r = t.facilitiesMatrix?.flatAmenities || [], o = t.facilitiesMatrix?.roomAmenities || [], s = [...r, ...o];
  if (t.specifications?.attachedBathroom || s.includes("Bathroom") || s.includes("Attached Washroom") || s.includes("Attached Bathroom")) l += "<p>✔ Attached Bathroom</p>";
  if (t.specifications?.balconyAvailable || s.includes("Private Balcony") || s.includes("Balcony")) l += "<p>✔ Balcony Available</p>";
  if (t.specifications?.fullyFurnished || s.includes("Furnished") || s.includes("Fully Furnished")) l += "<p>✔ Fully Furnished</p>";
  document.getElementById("detRoomSpecs").innerHTML = l || "<p>Standard Property Layout Structure</p>";
  
  const d = document.getElementById("desktop-boxes-row"), c = document.getElementById("mobile-boxes-row");
  if (d) d.innerHTML = ""; if (c) c.innerHTML = "";
  
  const m = t.inventory || {}; let u = null;

  function g(e, a, n) {
    if (!a) return;
    const i = document.createElement("div"); i.className = "summary-box"; i.innerText = e;
    const l = document.createElement("div"); l.className = "summary-box"; l.innerText = e;
    const r = () => {
      document.querySelectorAll(".summary-box").forEach((e => e.classList.remove("active")));
      i.classList.add("active"); l.classList.add("active"); p(e, a); h(n);
    };
    i.addEventListener("click", r); l.addEventListener("click", r);
    if (d) d.appendChild(i); if (c) c.appendChild(l);
    if (!u) u = { deskEl: i, mobEl: l, data: a, name: e, typeKey: n };
  }

  // 🛠️ Dynamic Amenities Renderer (Chair Fix)
  function h(e) {
    let a = "", n = "room" === e ? t.facilitiesMatrix?.roomAmenities || [] : t.facilitiesMatrix?.flatAmenities || [];
    if (t.amenities) {
      const e = { wifi: "📶 WiFi", ac: "❄️ AC", cooler: "🌀 Cooler", bed: "🛏️ Bed", mattress: "💤 Mattress", parking: "🚗 Parking", washroom: "🧼 Washroom", balcony: "🌅 Balcony" };
      Object.keys(t.amenities).forEach((n => {
        if (!n.endsWith("_label") && (!0 === t.amenities[n] || "string" == typeof t.amenities[n])) {
          const i = e[n] || t.amenities[n + "_label"] || n;
          a += `<div class="highlight-box">${i}</div>`;
        }
      }));
    }
    if (!a && n.length > 0) { n.forEach((e => { a += `<div class="highlight-box">${e}</div>` })) }
    
    const i = t.gateClosingTime || t.rules?.gateClosingTime;
    if (i) a += `<div class="highlight-box" style="border-color: #f39c12; color: #d35400;">⏰ Gate Closes: ${i}</div>`;
    if (t.rules?.noSmoking || s.some((e => e.toLowerCase().includes("smoke")))) a += '<div class="highlight-box" style="border-color: #e74c3c; color: #c0392b;">🚭 No Smoking</div>';
    if (s.some((e => e.toLowerCase().includes("music")))) a += '<div class="highlight-box" style="border-color: #95a5a6; color: #7f8c8d;">🎵 No Loud Music</div>';
    
    const r = !0 === t.foodDetails?.isAvailable || "true" === t.foodDetails?.isAvailable || "Yes" === t.foodDetails?.isAvailable || s.some((e => e.toLowerCase().includes("mess") || e.toLowerCase().includes("food")));
    if (r) a += '<div class="highlight-box" style="background: #e8f8f5; border-color: #2ecc71;">🍲 Mess Facility</div>';
    
    document.getElementById("detHighlights").innerHTML = a || "<p style='color:#7f8c8d; font-size:14px;'>Standard basic facilities included.</p>";
    const o = document.getElementById("detDynamicAmenities");
    if (o) o.innerHTML = a || "<span style='color:#888;font-size:13px;'>No amenities listed.</span>";
    
    const d = document.getElementById("displayFood"), m = document.getElementById("mealsDisplaySection");
    if (d) {
      if (r) {
        d.innerText = "Available ✅";
        if (m) {
          m.style.display = "block";
          m.innerHTML = t.foodDetails && (t.foodDetails.hasBreakfast || t.foodDetails.hasLunch || t.foodDetails.hasDinner) ? `
            <span>${t.foodDetails.hasBreakfast ? "🍳 Breakfast: Yes" : "🍳 Breakfast: No ❌"}</span> | 
            <span>${t.foodDetails.hasLunch ? "🍛 Lunch: Yes" : "🍛 Lunch: No ❌"}</span> | 
            <span>${t.foodDetails.hasDinner ? "🍽️ Dinner: Yes" : "🍽️ Dinner: No ❌"}</span>` : "<span>Meals included (Timings managed by landlord)</span>";
        }
      } else { d.innerText = "Not Available ❌"; if (m) m.style.display = "none"; }
    }
  }

  function p(e, n) {
    const i = document.getElementById("detPrice"), l = document.getElementById("detTopInfo"), r = document.getElementById("detSharing");
    if (!i || !l || !r) return;
    if (n.single || n.double || n.triple) {
      let t = "", o = "", s = [];
      if (n.single && n.single.total > 0) { t += `₹${n.single.rent}`; o += `Single Room: ${n.single.vacant} Left (Total: ${n.single.total}) • `; s.push("Single"); }
      if (n.double && n.double.total > 0) { if (t) t += " / "; t += `₹${n.double.rent}`; o += `Double Room: ${n.double.vacant} Left (Total: ${n.double.total}) • `; s.push("Double"); }
      if (n.triple && n.triple.total > 0) { if (t) t += " / "; t += `₹${n.triple.rent}`; o += `Triple Room: ${n.triple.vacant} Left (Total: ${n.triple.total}) • `; s.push("Triple"); }
      i.innerText = t ? `${t}/month` : "N/A"; l.innerText = `${o}${a} km from RISU`; r.innerHTML = `👥 Sharing Type: ${s.join(" & ") || "Standard"} Sharing`;
    } else {
      i.innerText = `₹${n.rent}/month`; l.innerText = `${e} • ${n.vacant} Vacant (Total: ${n.total}) • ${a} km from RISU`; r.innerHTML = `👥 Type: Full Private ${e}`;
    }
  }

  // Inventory Box Allocators
  if (m.rooms) {
    if (m.rooms.single && m.rooms.single.total > 0) g("SINGLE ROOM", { single: m.rooms.single }, "room");
    if (m.rooms.double && m.rooms.double.total > 0) g("DOUBLE ROOM", { double: m.rooms.double }, "room");
    if (m.rooms.triple && m.rooms.triple.total > 0) g("TRIPLE ROOM", { triple: m.rooms.triple }, "room");
  }
  if (!m.rooms && t.roomPrice) g("ROOM/PG", { single: { rent: t.roomPrice, vacant: 1, total: 1 } }, "room");
  if (m.flats) {
    if (m.flats.bhk1) g("1 BHK FLAT", m.flats.bhk1, "flat");
    if (m.flats.bhk2) g("2 BHK FLAT", m.flats.bhk2, "flat");
    if (m.flats.bhk3) g("3 BHK FLAT", m.flats.bhk3, "flat");
  }
  if (u) { u.deskEl.classList.add("active"); u.mobEl.classList.add("active"); p(u.name, u.data); h(u.typeKey); }
  
  // Static Rules Fallback
  let b = ""; const f = t.rules?.noSmoking || s.some((e => e.toLowerCase().includes("smoking")));
  if (f) b += "<p>🚫 No Smoking Allowed</p>";
  if (t.rules?.noMusic || s.some((e => e.toLowerCase().includes("music")))) b += "<p>🔇 No Loud Music After 10 PM</p>";
  if (t.rules?.noCooking) b += "<p>🍳 Cooking Inside Room Not Allowed</p>";
  document.getElementById("detRulesList").innerHTML = b || "<p>Follow general housing code guidelines.</p>";
  
  const y = document.getElementById("displaySmokingRow");
  if (y) { if (f) { y.style.display = "block"; y.innerHTML = "🚫 No Smoking Allowed"; } else y.style.display = "none"; }
  
  // 📑 Dynamic Custom Row Renderer
  const v = document.getElementById("detDynamicDetailsContainer");
  if (v) {
    v.innerHTML = "";
    if (t.customDetailsList && Array.isArray(t.customDetailsList)) {
      t.customDetailsList.forEach((e => {
        if (e.value && e.value.trim() !== "") v.innerHTML += `<p class="dynamic-row-item"><strong>${e.label}:</strong> ${e.value}</p>`;
      }));
    } else {
      v.innerHTML = `<p class="dynamic-row-item"><strong>📍 Landmark:</strong> ${t.exactAddress || t.manualAddress || "N/A"}</p>`;
    }
  }

  // Buttons Configuration
  document.getElementById("detCallBtn").onclick = (() => { if (t.ownerPhone) window.location.href = `tel:${t.ownerPhone}` });
  document.getElementById("detMapBtn").onclick = (() => {
    if (t.location && t.location.latitude) window.open(`https://www.google.com/maps/search/?api=1&query=${t.location.latitude},${t.location.longitude}`);
    else alert("📍 Location coordinates missing.");
  });
  
  document.getElementById("homePage").style.display = "none";
  document.getElementById("detailPage").style.display = "block";
  window.scrollTo(0, 0);
});

// Navigation Controls
window.goBack = function() {
  document.getElementById("detailPage").style.display = "none";
  document.getElementById("homePage").style.display = "block";
};

window.toggleDetails = function() {
  let e = document.getElementById("moreDetails");
  if (e) e.style.display = "block" === e.style.display ? "none" : "block";
};