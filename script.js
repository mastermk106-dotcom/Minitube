import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBBc_Ihgyl0-P7u_K6p0GKXkVpT2v5674Q",
  authDomain: "minitube-9317a.firebaseapp.com",
  projectId: "minitube-9317a",
  storageBucket: "minitube-9317a.firebasestorage.app",
  messagingSenderId: "176876768704",
  appId: "1:176876768704:web:051bd6a6ba27325e22cc25"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();


// ===============================
// MODALS
// ===============================

window.openLogin = function () {
  document.getElementById("signupModal").style.display = "none";
  document.getElementById("loginModal").style.display = "flex";
};

window.openSignup = function () {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("signupModal").style.display = "flex";
};

window.closeModals = function () {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("signupModal").style.display = "none";
};

window.switchToSignup = function () {
  openSignup();
};

window.switchToLogin = function () {
  openLogin();
};


// ===============================
// SEARCH
// ===============================

window.searchVideos = function () {

  const search = document
    .getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();

  document.querySelectorAll(".video-card")
    .forEach(video => {

      const title =
        video.dataset.title.toLowerCase();

      video.style.display =
        title.includes(search) ? "" : "none";
    });
};


// ===============================
// SIGN UP
// ===============================

document
  .getElementById("signupBtn")
  .addEventListener("click", async () => {

    const name =
      document.getElementById("signupName").value.trim();

    const username =
      document.getElementById("signupUsername").value.trim();

    const email =
      document.getElementById("signupEmail").value.trim();

    const password =
      document.getElementById("signupPassword").value;

    if (!name || !username || !email || !password) {
      alert("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = result.user;

      await updateProfile(user, {
        displayName: name
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: name,
          username: username,
          email: email,
          uid: user.uid,
          photoURL: "",
          createdAt: new Date().toISOString()
        }
      );

      alert("Account created successfully! 🎉");

      closeModals();

    } catch (error) {

      console.error(error);
      alert(error.message);

    }

  });


// ===============================
// LOGIN
// ===============================

document
  .getElementById("loginBtn")
  .addEventListener("click", async () => {

    const email =
      document.getElementById("loginEmail").value.trim();

    const password =
      document.getElementById("loginPassword").value;

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Login successful! 👋");
      closeModals();

    } catch (error) {

      console.error(error);
      alert(error.message);

    }

  });


// ===============================
// GOOGLE LOGIN
// ===============================

async function googleLogin() {

  try {

    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );

    const user = result.user;

    await setDoc(
      doc(db, "users", user.uid),
      {
        name: user.displayName || "",
        username: "",
        email: user.email || "",
        uid: user.uid,
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString()
      },
      { merge: true }
    );

    alert("Google Sign-In successful! 🔵");
    closeModals();

  } catch (error) {

    console.error(error);
    alert(error.message);

  }

}

document
  .getElementById("googleLoginBtn")
  .addEventListener("click", googleLogin);

document
  .getElementById("googleSignupBtn")
  .addEventListener("click", googleLogin);


// ===============================
// PROFILE
// ===============================

function showProfile(user) {

  document.getElementById("headerButtons")
    .style.display = "none";

  document.getElementById("profileArea")
    .style.display = "block";

  document.getElementById("profileName")
    .textContent =
    user.displayName || "MiniTube User";

  document.getElementById("profileEmail")
    .textContent =
    user.email || "";

  const photo =
    document.getElementById("profilePhoto");

  if (user.photoURL) {

    photo.src = user.photoURL;

  } else {

    photo.src =
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(
        user.displayName || "User"
      );

  }

}

function hideProfile() {

  document.getElementById("headerButtons")
    .style.display = "flex";

  document.getElementById("profileArea")
    .style.display = "none";
}


// ===============================
// PROFILE MENU
// ===============================

document
  .getElementById("profilePhoto")
  .addEventListener("click", () => {

    document
      .getElementById("profileMenu")
      .classList.toggle("show");

  });


// ===============================
// LOGOUT
// ===============================

window.logoutUser = async function () {

  try {

    await signOut(auth);

    alert("Logged out successfully! 👋");

  } catch (error) {

    console.error(error);
    alert(error.message);

  }

};


// ===============================
// CHANNEL
// ===============================

window.openChannel = function () {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  document.getElementById("homePage").style.display = "none";
  document.getElementById("uploadPage").style.display = "none";
  document.getElementById("channelPage").style.display = "block";

  document.getElementById("profileMenu")
    .classList.remove("show");

  document.getElementById("channelName")
    .textContent =
    user.displayName || "MiniTube User";

  document.getElementById("channelEmail")
    .textContent =
    user.email || "";

  const photo =
    document.getElementById("channelPhoto");

  photo.src =
    user.photoURL ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(
      user.displayName || "User"
    );
};

window.closeChannel = function () {

  document.getElementById("channelPage")
    .style.display = "none";

  document.getElementById("homePage")
    .style.display = "block";
};


// ===============================
// UPLOAD PAGE
// ===============================

window.openUpload = function () {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  document.getElementById("homePage")
    .style.display = "none";

  document.getElementById("channelPage")
    .style.display = "none";

  document.getElementById("uploadPage")
    .style.display = "block";

  document.getElementById("profileMenu")
    .classList.remove("show");
};

window.closeUpload = function () {

  document.getElementById("uploadPage")
    .style.display = "none";

  document.getElementById("homePage")
    .style.display = "block";
};


// ===============================
// VIDEO PREVIEW
// ===============================

const videoFile =
  document.getElementById("videoFile");

const videoPreview =
  document.getElementById("videoPreview");

videoFile.addEventListener("change", () => {

  const file = videoFile.files[0];

  if (!file) {
    videoPreview.style.display = "none";
    return;
  }

  videoPreview.src =
    URL.createObjectURL(file);

  videoPreview.style.display = "block";

});


// ===============================
// CLOUDINARY UPLOAD
// ===============================

window.previewUpload = async function () {

  const file =
    videoFile.files[0];

  const title =
    document.getElementById("videoTitle")
      .value
      .trim();

  const description =
    document.getElementById("videoDescription")
      .value
      .trim();

  if (!file) {
    alert("Please select a video first.");
    return;
  }

  if (!title) {
    alert("Please enter a video title.");
    return;
  }

  const button =
    document.querySelector(".upload-btn");

  button.disabled = true;
  button.textContent = "Uploading... ⏳";


  try {

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "upload_preset",
      "minituber"
    );

    formData.append(
      "asset_folder",
      "MiniTube"
    );

    formData.append(
      "context",
      `title=${title}|description=${description}`
    );


    const response =
      await fetch(
        "https://api.cloudinary.com/v1_1/dvvsxjid/video/upload",
        {
          method: "POST",
          body: formData
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(data);

      throw new Error(
        data.error?.message ||
        "Upload failed."
      );

    }


    console.log(
      "Cloudinary upload:",
      data
    );


    button.textContent =
      "✅ Uploaded Successfully";


    alert(
      "Video successfully uploaded to Cloudinary! 🎉"
    );


    console.log(
      "Video URL:",
      data.secure_url
    );


  } catch (error) {

    console.error(error);

    alert(
      "Upload failed: " +
      error.message
    );

    button.disabled = false;

    button.textContent =
      "🎬 Upload Video";

  }

};


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(
  auth,
  user => {

    if (user) {

      showProfile(user);

    } else {

      hideProfile();

      document.getElementById("channelPage")
        .style.display = "none";

      document.getElementById("uploadPage")
        .style.display = "none";

      document.getElementById("homePage")
        .style.display = "block";
    }

  }
);
