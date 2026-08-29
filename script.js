// ==========================================
// FIREBASE IMPORTS
// ==========================================

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


// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyBBc_Ihgyl0-P7u_K6p0GKXkVpT2v5674Q",
  authDomain: "minitube-9317a.firebaseapp.com",
  projectId: "minitube-9317a",
  storageBucket: "minitube-9317a.firebasestorage.app",
  messagingSenderId: "176876768704",
  appId: "1:176876768704:web:051bd6a6ba27325e22cc25"
};


// ==========================================
// FIREBASE INITIALIZE
// ==========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const googleProvider =
  new GoogleAuthProvider();

console.log(
  "Firebase connected successfully! 🔥"
);


// ==========================================
// MODALS
// ==========================================

window.openLogin = function () {

  document
    .getElementById("signupModal")
    .style.display = "none";

  document
    .getElementById("loginModal")
    .style.display = "flex";

};


window.openSignup = function () {

  document
    .getElementById("loginModal")
    .style.display = "none";

  document
    .getElementById("signupModal")
    .style.display = "flex";

};


window.closeModals = function () {

  document
    .getElementById("loginModal")
    .style.display = "none";

  document
    .getElementById("signupModal")
    .style.display = "none";

};


window.switchToSignup = function () {

  openSignup();

};


window.switchToLogin = function () {

  openLogin();

};


// ==========================================
// SEARCH
// ==========================================

window.searchVideos = function () {

  const search =
    document
      .getElementById("searchInput")
      .value
      .toLowerCase()
      .trim();


  const videos =
    document.querySelectorAll(
      ".video-card"
    );


  videos.forEach(video => {

    const title =
      video.dataset.title
        .toLowerCase();


    if (title.includes(search)) {

      video.style.display = "";

    } else {

      video.style.display = "none";

    }

  });

};


// ==========================================
// EMAIL SIGNUP
// ==========================================

document
  .getElementById("signupBtn")
  .addEventListener(
    "click",
    async () => {

      const name =
        document
          .getElementById("signupName")
          .value
          .trim();


      const username =
        document
          .getElementById("signupUsername")
          .value
          .trim();


      const email =
        document
          .getElementById("signupEmail")
          .value
          .trim();


      const password =
        document
          .getElementById("signupPassword")
          .value;


      if (
        !name ||
        !username ||
        !email ||
        !password
      ) {

        alert(
          "Please fill all fields."
        );

        return;

      }


      if (password.length < 6) {

        alert(
          "Password must be at least 6 characters."
        );

        return;

      }


      try {

        const result =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );


        const user =
          result.user;


        await updateProfile(
          user,
          {
            displayName: name
          }
        );


        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {

            name: name,

            username: username,

            email: email,

            uid: user.uid,

            photoURL: "",

            createdAt:
              new Date().toISOString()

          }
        );


        alert(
          "Account created successfully! 🎉"
        );


        closeModals();

      }

      catch (error) {

        console.error(error);

        alert(error.message);

      }

    }
  );


// ==========================================
// EMAIL LOGIN
// ==========================================

document
  .getElementById("loginBtn")
  .addEventListener(
    "click",
    async () => {

      const email =
        document
          .getElementById("loginEmail")
          .value
          .trim();


      const password =
        document
          .getElementById("loginPassword")
          .value;


      if (!email || !password) {

        alert(
          "Please enter email and password."
        );

        return;

      }


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        alert(
          "Login successful! 👋"
        );


        closeModals();

      }

      catch (error) {

        console.error(error);

        alert(error.message);

      }

    }
  );


// ==========================================
// GOOGLE LOGIN
// ==========================================

async function googleLogin() {

  try {

    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );


    const user =
      result.user;


    await setDoc(
      doc(
        db,
        "users",
        user.uid
      ),
      {

        name:
          user.displayName || "",

        username:
          "",

        email:
          user.email || "",

        uid:
          user.uid,

        photoURL:
          user.photoURL || "",

        createdAt:
          new Date().toISOString()

      },

      {
        merge: true
      }

    );


    alert(
      "Google Sign-In successful! 🔵"
    );


    closeModals();

  }

  catch (error) {

    console.error(error);

    alert(error.message);

  }

}


document
  .getElementById("googleLoginBtn")
  .addEventListener(
    "click",
    googleLogin
  );


document
  .getElementById("googleSignupBtn")
  .addEventListener(
    "click",
    googleLogin
  );


// ==========================================
// PROFILE
// ==========================================

function showProfile(user) {

  const headerButtons =
    document.getElementById(
      "headerButtons"
    );


  const profileArea =
    document.getElementById(
      "profileArea"
    );


  const profilePhoto =
    document.getElementById(
      "profilePhoto"
    );


  const profileName =
    document.getElementById(
      "profileName"
    );


  const profileEmail =
    document.getElementById(
      "profileEmail"
    );


  headerButtons.style.display =
    "none";


  profileArea.style.display =
    "block";


  profileName.textContent =
    user.displayName ||
    "MiniTube User";


  profileEmail.textContent =
    user.email || "";


  if (user.photoURL) {

    profilePhoto.src =
      user.photoURL;

  }

  else {

    profilePhoto.src =
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(
        user.displayName ||
        "User"
      );

  }

}


// ==========================================
// HIDE PROFILE
// ==========================================

function hideProfile() {

  document
    .getElementById(
      "headerButtons"
    )
    .style.display = "flex";


  document
    .getElementById(
      "profileArea"
    )
    .style.display = "none";

}


// ==========================================
// PROFILE MENU
// ==========================================

document
  .getElementById("profilePhoto")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "profileMenu"
        )
        .classList.toggle(
          "show"
        );

    }
  );


// ==========================================
// LOGOUT
// ==========================================

window.logoutUser = async function () {

  try {

    await signOut(auth);


    document
      .getElementById(
        "profileMenu"
      )
      .classList.remove(
        "show"
      );


    alert(
      "Logged out successfully! 👋"
    );

  }

  catch (error) {

    console.error(error);

    alert(error.message);

  }

};


// ==========================================
// CHANNEL PAGE
// ==========================================

window.openChannel = function () {

  const user =
    auth.currentUser;


  if (!user) {

    alert(
      "Please login first."
    );

    return;

  }


  document
    .getElementById(
      "homePage"
    )
    .style.display = "none";


  document
    .getElementById(
      "channelPage"
    )
    .style.display = "block";


  document
    .getElementById(
      "profileMenu"
    )
    .classList.remove(
      "show"
    );


  document
    .getElementById(
      "channelName"
    )
    .textContent =
      user.displayName ||
      "MiniTube User";


  document
    .getElementById(
      "channelEmail"
    )
    .textContent =
      user.email || "";


  if (user.photoURL) {

    document
      .getElementById(
        "channelPhoto"
      )
      .src =
        user.photoURL;

  }

  else {

    document
      .getElementById(
        "channelPhoto"
      )
      .src =
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          user.displayName ||
          "User"
        );

  }

};


window.closeChannel = function () {

  document
    .getElementById(
      "channelPage"
    )
    .style.display = "none";


  document
    .getElementById(
      "homePage"
    )
    .style.display = "block";

};


// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(
  auth,
  (user) => {

    if (user) {

      console.log(
        "Logged in:",
        user.email
      );


      showProfile(user);

    }

    else {

      console.log(
        "No user logged in."
      );


      hideProfile();


      document
        .getElementById(
          "channelPage"
        )
        .style.display = "none";


      document
        .getElementById(
          "homePage"
        )
        .style.display = "block";

    }

  }
);
