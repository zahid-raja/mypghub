let container = document.getElementById("roomList");

for(let i=1;i<=10;i++){

  let distance=(Math.random()*5+0.5).toFixed(1);

  container.innerHTML += `
  
  <div class="card" onclick="openDetails()">

    <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?random=${i}">

    <div class="card-content">

      <div class="price">
        ₹${3000+i*200}/month
      </div>

      <div class="pg-type">
        Boys PG • Double Sharing
      </div>

      <div class="distance">
        ${distance} km from Rungta College
      </div>

    </div>

  </div>

  `;
}

function openDetails(){

  document.getElementById("homePage").style.display="none";

  document.getElementById("detailPage").style.display="block";

  window.scrollTo(0,0);
}

function goBack(){

  document.getElementById("detailPage").style.display="none";

  document.getElementById("homePage").style.display="block";
}

function toggleDetails(){

  let more =
    document.getElementById(
      "moreDetails"
    );

  if(more.style.display === "block"){

    more.style.display = "none";

  }else{

    more.style.display = "block";

  }

}
// ==========================================
// STEP 3: POPUP OPEN & CLOSE LOGIC
// ==========================================

// Popup ko screen par dikhane ke liye function
window.openLoginModal = () => {
  const modal = document.getElementById("loginModal");
  const phoneStage = document.getElementById("phoneStage");
  const otpStage = document.getElementById("otpStage");

  if (modal) {
    modal.style.display = "flex"; // Hide se hata kar screen par layega
    phoneStage.style.display = "block"; // Pehla step (Phone) dikhayega
    otpStage.style.display = "none"; // Doosra step (OTP) chhupa ke rakhega
  }
};

// Popup ko band (Hide) karne ke liye function
window.closeLoginModal = () => {
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.style.display = "none"; // Wapas chhupa dega
  }
};

// Jab koi Header ya Bottom Nav ke Account/Login par click karega
window.handleAccount = () => {
  // Abhi hum bina check kiye seedhe popup khol rahe hain
  window.openLoginModal();
};
