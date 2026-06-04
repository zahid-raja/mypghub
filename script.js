let container = document.getElementById("roomList");

if (container) {
  for (let i = 1; i <= 10; i++) {
    let distance = (Math.random() * 5 + 0.5).toFixed(1);

    container.innerHTML += `
    <div class="card" onclick="window.handleRoomClick('${i}')" style="cursor: pointer;">
      <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?random=${i}">
      <div class="card-content">
        <div class="price">₹${3000 + i * 200}/month</div>
        <div class="pg-type">Boys PG • Double Sharing</div>
        <div class="distance">${distance} km from Rungta College</div>
      </div>
    </div>
    `;
  }
}

// Global scope me function call taaki back button smoothly chale
window.goBack = function() {
  document.getElementById("detailPage").style.display = "none";
  document.getElementById("homePage").style.display = "block";
}

window.toggleDetails = function() {
  let more = document.getElementById("moreDetails");
  if (more) {
    if (more.style.display === "block") {
      more.style.display = "none";
    } else {
      more.style.display = "block";
    }
  }
}
