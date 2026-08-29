// ===============================
// MiniTube JavaScript
// ===============================

// LOGIN MODAL
function openLogin() {
  document.getElementById("loginModal").style.display = "flex";
}

// SIGNUP MODAL
function openSignup() {
  document.getElementById("signupModal").style.display = "flex";
}

// CLOSE MODALS
function closeModals() {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("signupModal").style.display = "none";
}

// SWITCH TO SIGNUP
function switchToSignup() {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("signupModal").style.display = "flex";
}

// SWITCH TO LOGIN
function switchToLogin() {
  document.getElementById("signupModal").style.display = "none";
  document.getElementById("loginModal").style.display = "flex";
}


// ===============================
// SEARCH
// ===============================

function searchVideos() {

  const searchText =
    document.getElementById("searchInput").value.toLowerCase().trim();

  const videos =
    document.querySelectorAll(".video-card");

  if (searchText === "") {
    videos.forEach(video => {
      video.style.display = "block";
    });
    return;
  }

  videos.forEach(video => {

    const title =
      video.getAttribute("data-title").toLowerCase();

    if (title.includes(searchText)) {
      video.style.display = "block";
    } else {
      video.style.display = "none";
    }

  });
}


// ===============================
// SEARCH WITH ENTER KEY
// ===============================

document
  .getElementById("searchInput")
  .addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
      searchVideos();
    }

  });


// ===============================
// CATEGORY BUTTONS
// ===============================

const categoryButtons =
  document.querySelectorAll(".categories button");

categoryButtons.forEach(button => {

  button.addEventListener("click", function() {

    categoryButtons.forEach(btn =>
      btn.classList.remove("active")
    );

    this.classList.add("active");

  });

});


// ===============================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ===============================

window.addEventListener("click", function(event) {

  const loginModal =
    document.getElementById("loginModal");

  const signupModal =
    document.getElementById("signupModal");

  if (event.target === loginModal ||
      event.target === signupModal) {

    closeModals();

  }

});
