const $ = (id) => document.getElementById(id);

let videos = JSON.parse(
  localStorage.getItem("minitubeVideos") || "[]"
);

let currentVideo = null;
let currentCategory = "All";

let likedVideos = JSON.parse(
  localStorage.getItem("minitubeLikes") || "{}"
);


/* =========================
   STORAGE
========================= */

function saveVideos() {

  localStorage.setItem(
    "minitubeVideos",
    JSON.stringify(videos)
  );

}


function getComments() {

  return JSON.parse(
    localStorage.getItem("minitubeComments") || "{}"
  );

}


function saveComments(comments) {

  localStorage.setItem(
    "minitubeComments",
    JSON.stringify(comments)
  );

}


/* =========================
   REMOVE OLD DEMOS
========================= */

function prepareVideos() {

  const saved = JSON.parse(
    localStorage.getItem("minitubeVideos") || "[]"
  );

  videos = saved.filter(video => {

    if (!video || !video.id) {
      return false;
    }

    return !String(video.id).startsWith("demo");

  });

  saveVideos();

}


/* =========================
   VIEWS
========================= */

function formatViews(number) {

  number = Number(number) || 0;

  if (number >= 1000000) {

    return (
      (number / 1000000)
        .toFixed(1)
        .replace(".0", "") +
      "M"
    );

  }

  if (number >= 1000) {

    return (
      (number / 1000)
        .toFixed(1)
        .replace(".0", "") +
      "K"
    );

  }

  return String(number);

}


/* =========================
   DURATION
========================= */

function formatDuration(seconds) {

  if (!Number.isFinite(seconds)) {
    return "";
  }

  seconds = Math.floor(seconds);

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const secs = seconds % 60;

  if (hours > 0) {

    return (
      hours +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );

  }

  return (
    minutes +
    ":" +
    String(secs).padStart(2, "0")
  );

}


/* =========================
   PAGE CONTROL
========================= */

function showHome() {

  $("homePage").style.display = "block";
  $("videoPage").style.display = "none";
  $("channelPage").style.display = "none";
  $("uploadPage").style.display = "none";

}


/* =========================
   OPEN VIDEO
========================= */

function openVideo(video) {

  if (!video || !video.url) {

    alert("This video has no playable file.");

    return;

  }

  currentVideo = video;

  $("homePage").style.display = "none";
  $("videoPage").style.display = "block";
  $("channelPage").style.display = "none";
  $("uploadPage").style.display = "none";

  $("mainVideoTitle").textContent =
    video.title || "Video";

  $("mainVideoCreator").textContent =
    video.creator || "MiniTube User";

  $("mainVideoViews").textContent =
    formatViews(video.views || 0) + " views";

  $("mainVideoDescription").textContent =
    video.description || "No description available.";

  $("likeCount").textContent =
    video.likes || 0;

  $("videoCreatorAvatar").textContent =
    (video.creator || "M")
      .charAt(0)
      .toUpperCase();

  const player = $("mainVideo");

  player.pause();

  player.removeAttribute("src");

  player.load();

  player.src = video.url;

  player.load();

  $("downloadButton").href = video.url;

  loadComments(video.id);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================
   THUMBNAIL
========================= */

function createThumbnail(video, thumbnail) {

  thumbnail.innerHTML = "";

  if (!video.url) {

    thumbnail.innerHTML = "▶";

    return;

  }

  const videoElement =
    document.createElement("video");

  videoElement.src = video.url;
  videoElement.muted = true;
  videoElement.preload = "metadata";
  videoElement.playsInline = true;

  videoElement.addEventListener(
    "loadedmetadata",
    () => {

      const duration =
        formatDuration(videoElement.duration);

      if (duration) {
        thumbnail.dataset.duration = duration;
      }

    }
  );

  videoElement.addEventListener(
    "loadeddata",
    () => {

      thumbnail.innerHTML = "";

      thumbnail.appendChild(videoElement);

    }
  );

  videoElement.addEventListener(
    "error",
    () => {

      thumbnail.innerHTML = "▶";

    }
  );

  thumbnail.appendChild(videoElement);

}


/* =========================
   RENDER VIDEOS
========================= */

function renderVideos(list = videos) {

  const grid = $("videoGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  if (!list.length) {

    grid.innerHTML = `
      <p style="
        grid-column:1/-1;
        text-align:center;
        padding:40px;
        color:#777;
      ">
        No videos found.
      </p>
    `;

    return;

  }

  list.forEach(video => {

    const card =
      document.createElement("div");

    card.className = "video-card";

    const thumbnail =
      document.createElement("div");

    thumbnail.className = "thumbnail";

    createThumbnail(video, thumbnail);

    const info =
      document.createElement("div");

    info.className = "video-info";

    const avatar =
      document.createElement("div");

    avatar.className = "channel-avatar";

    avatar.textContent =
      (video.creator || "M")
        .charAt(0)
        .toUpperCase();

    const details =
      document.createElement("div");

    const title =
      document.createElement("h3");

    title.textContent =
      video.title || "Untitled Video";

    const creator =
      document.createElement("p");

    creator.textContent =
      video.creator || "MiniTube User";

    const views =
      document.createElement("p");

    views.textContent =
      formatViews(video.views || 0) + " views";

    const category =
      document.createElement("p");

    category.textContent =
      video.category || "Uncategorized";

    details.appendChild(title);
    details.appendChild(creator);
    details.appendChild(views);
    details.appendChild(category);

    info.appendChild(avatar);
    info.appendChild(details);

    card.appendChild(thumbnail);
    card.appendChild(info);

    card.addEventListener(
      "click",
      () => openVideo(video)
    );

    grid.appendChild(card);

  });

}


/* =========================
   CATEGORY FILTER
========================= */

function filterCategory(category) {

  currentCategory = category;

  document
    .querySelectorAll(".categories button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category === category
      );

    });

  applyFilters();

}


document
  .querySelectorAll(".categories button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {
        filterCategory(
          button.dataset.category
        );
      }
    );

  });


/* =========================
   SEARCH
========================= */

function applyFilters() {

  const search =
    $("searchInput")
      .value
      .toLowerCase()
      .trim();

  let filtered = [...videos];

  if (currentCategory !== "All") {

    filtered =
      filtered.filter(video =>
        (video.category || "")
          .toLowerCase() ===
        currentCategory.toLowerCase()
      );

  }

  if (search) {

    filtered =
      filtered.filter(video =>

        (video.title || "")
          .toLowerCase()
          .includes(search)

        ||

        (video.creator || "")
          .toLowerCase()
          .includes(search)

      );

  }

  renderVideos(filtered);

}


$("searchButton")
  .addEventListener(
    "click",
    applyFilters
  );


$("searchInput")
  .addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        applyFilters();
      }

    }
  );


/* =========================
   LOGIN / SIGNUP
========================= */

function openLogin() {

  $("loginModal").style.display = "flex";

}


function openSignup() {

  $("signupModal").style.display = "flex";

}


function closeModals() {

  $("loginModal").style.display = "none";
  $("signupModal").style.display = "none";
  $("profileModal").style.display = "none";

}


$("loginButton")
  .addEventListener("click", openLogin);


$("signupButton")
  .addEventListener("click", openSignup);


$("getStartedButton")
  .addEventListener("click", openSignup);


$("closeLoginButton")
  .addEventListener("click", closeModals);


$("closeSignupButton")
  .addEventListener("click", closeModals);


$("goToSignup")
  .addEventListener(
    "click",
    () => {

      closeModals();
      openSignup();

    }
  );


$("goToLogin")
  .addEventListener(
    "click",
    () => {

      closeModals();
      openLogin();

    }
  );


/* =========================
   EMAIL SIGNUP
========================= */

$("emailSignupButton")
  .addEventListener(
    "click",
    async () => {

      const name =
        $("signupName")
          .value
          .trim();

      const email =
        $("signupEmail")
          .value
          .trim();

      const password =
        $("signupPassword")
          .value;

      if (!name || !email || !password) {

        alert("Please fill all fields.");

        return;

      }

      try {

        const userCredential =
          await firebaseFunctions
            .createUserWithEmailAndPassword(
              firebaseAuth,
              email,
              password
            );

        await firebaseFunctions
          .updateProfile(
            userCredential.user,
            {
              displayName: name
            }
          );

        await createInitialProfile(
          userCredential.user,
          name
        );

        alert(
          "Account successfully created! 🎉"
        );

        closeModals();

        $("signupName").value = "";
        $("signupEmail").value = "";
        $("signupPassword").value = "";

      } catch (error) {

        alert(
          "Signup failed: " +
          error.message
        );

      }

    }
  );


/* =========================
   CREATE INITIAL PROFILE
========================= */

async function createInitialProfile(user, name) {

  const username =
    makeUsername(name);

  const profile = {

    uid: user.uid,

    username: username,

    channelName:
      name || "MiniTube User",

    bio: "",

    link: "",

    photoURL:
      user.photoURL || "",

    email:
      user.email || "",

    createdAt:
      firebaseFunctions.serverTimestamp()

  };

  await firebaseFunctions.setDoc(
    firebaseFunctions.doc(
      firebaseFunctions.db,
      "profiles",
      user.uid
    ),
    profile
  );

  window.currentProfile = profile;

}


function makeUsername(name) {

  let username =
    String(name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);

  if (!username) {
    username = "user";
  }

  return username;

}


/* =========================
   EMAIL LOGIN
========================= */

$("emailLoginButton")
  .addEventListener(
    "click",
    async () => {

      const email =
        $("loginEmail")
          .value
          .trim();

      const password =
        $("loginPassword")
          .value;

      if (!email || !password) {

        alert(
          "Please enter email and password."
        );

        return;

      }

      try {

        await firebaseFunctions
          .signInWithEmailAndPassword(
            firebaseAuth,
            email,
            password
          );

        alert(
          "Login successful! 👋"
        );

        closeModals();

        $("loginEmail").value = "";
        $("loginPassword").value = "";

      } catch (error) {

        alert(
          "Login failed: " +
          error.message
        );

      }

    }
  );


/* =========================
   GOOGLE LOGIN
========================= */

async function googleLogin() {

  try {

    const result =
      await firebaseFunctions
        .signInWithPopup(
          firebaseAuth,
          googleProvider
        );

    const user =
      result.user;

    await ensureGoogleProfile(user);

    closeModals();

  } catch (error) {

    alert(
      "Google login failed: " +
      error.message
    );

  }

}


async function ensureGoogleProfile(user) {

  const profileRef =
    firebaseFunctions.doc(
      firebaseFunctions.db,
      "profiles",
      user.uid
    );

  const profileSnap =
    await firebaseFunctions.getDoc(
      profileRef
    );

  if (!profileSnap.exists()) {

    const profile = {

      uid: user.uid,

      username:
        makeUsername(
          user.displayName ||
          user.email?.split("@")[0] ||
          "user"
        ),

      channelName:
        user.displayName ||
        "MiniTube User",

      bio: "",

      link: "",

      photoURL:
        user.photoURL || "",

      email:
        user.email || "",

      createdAt:
        firebaseFunctions.serverTimestamp()

    };

    await firebaseFunctions.setDoc(
      profileRef,
      profile
    );

  }

}


$("googleLoginButton")
  .addEventListener(
    "click",
    googleLogin
  );


$("googleSignupButton")
  .addEventListener(
    "click",
    googleLogin
  );


/* =========================
   PROFILE MENU
========================= */

$("profilePhoto")
  .addEventListener(
    "click",
    event => {

      event.stopPropagation();

      $("profileMenu")
        .classList.toggle("show");

    }
  );


document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest("#profileArea")
    ) {

      $("profileMenu")
        .classList.remove("show");

    }

  }
);


/* =========================
   EDIT PROFILE
========================= */

$("editProfileButton")
  .addEventListener(
    "click",
    openEditProfile
  );


async function openEditProfile() {

  if (!window.currentUser) {

    openLogin();

    return;

  }

  $("profileMenu")
    .classList.remove("show");

  const user =
    window.currentUser;

  let profile =
    window.currentProfile;

  if (!profile) {

    try {

      const snap =
        await firebaseFunctions.getDoc(
          firebaseFunctions.doc(
            firebaseFunctions.db,
            "profiles",
            user.uid
          )
        );

      if (snap.exists()) {
        profile = snap.data();
        window.currentProfile = profile;
      }

    } catch (error) {

      console.error(error);

    }

  }

  profile =
    profile || {};

  $("editProfilePhoto").src =
    profile.photoURL ||
    user.photoURL ||
    getAvatar(
      profile.channelName ||
      user.displayName ||
      "M"
    );

  $("profileUsernameInput").value =
    profile.username ||
    makeUsername(
      user.displayName ||
      "user"
    );

  $("channelNameInput").value =
    profile.channelName ||
    user.displayName ||
    "";

  $("bioInput").value =
    profile.bio ||
    "";

  $("profileLinkInput").value =
    profile.link ||
    "";

  $("profileFile").value = "";

  $("profileStatus").textContent = "";

  $("profileModal").style.display = "flex";

}


$("closeProfileButton")
  .addEventListener(
    "click",
    () => {

      $("profileModal").style.display =
        "none";

    }
  );


/* =========================
   PROFILE IMAGE PREVIEW
========================= */

$("profileFile")
  .addEventListener(
    "change",
    () => {

      const file =
        $("profileFile").files[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {

        alert("Please select an image.");

        $("profileFile").value = "";

        return;

      }

      const previewURL =
        URL.createObjectURL(file);

      $("editProfilePhoto").src =
        previewURL;

    }
  );


/* =========================
   SAVE PROFILE
========================= */

$("saveProfileButton")
  .addEventListener(
    "click",
    saveProfile
  );


async function saveProfile() {

  if (!window.currentUser) {

    alert("Please login first.");

    return;

  }

  const user =
    window.currentUser;

  let username =
    $("profileUsernameInput")
      .value
      .trim()
      .toLowerCase();

  const channelName =
    $("channelNameInput")
      .value
      .trim();

  const bio =
    $("bioInput")
      .value
      .trim();

  let link =
    $("profileLinkInput")
      .value
      .trim();

  if (!username) {

    alert("Please enter a username.");

    return;

  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {

    alert(
      "Username must be 3-30 characters and use only letters, numbers or _. "
    );

    return;

  }

  if (!channelName) {

    alert("Please enter a channel name.");

    return;

  }

  if (link && !/^https?:\/\//i.test(link)) {

    link = "https://" + link;

  }

  const status =
    $("profileStatus");

  status.textContent =
    "Saving profile... ⏳";

  try {

    /* USERNAME CHECK */

    const usernameQuery =
      firebaseFunctions.query(
        firebaseFunctions.collection(
          firebaseFunctions.db,
          "profiles"
        ),
        firebaseFunctions.where(
          "username",
          "==",
          username
        ),
        firebaseFunctions.limit(1)
      );

    const usernameResults =
      await firebaseFunctions.getDocs(
        usernameQuery
      );

    let usernameTaken = false;

    usernameResults.forEach(
      profileDoc => {

        if (profileDoc.id !== user.uid) {
          usernameTaken = true;
        }

      }
    );

    if (usernameTaken) {

      status.textContent =
        "❌ Username already taken.";

      return;

    }


    /* IMAGE UPLOAD */

    let photoURL =
      window.currentProfile?.photoURL ||
      user.photoURL ||
      "";

    const imageFile =
      $("profileFile").files[0];

    if (imageFile) {

      status.textContent =
        "Uploading profile picture... ⏳";

      const formData =
        new FormData();

      formData.append(
        "file",
        imageFile
      );

      formData.append(
        "upload_preset",
        "minituber"
      );

      const response =
        await fetch(
          "https://api.cloudinary.com/v1_1/dvvsxjid/auto/upload",
          {
            method: "POST",
            body: formData
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error?.message ||
          "Profile picture upload failed."
        );

      }

      photoURL =
        data.secure_url;

    }


    /* SAVE FIRESTORE */

    status.textContent =
      "Saving profile... ⏳";

    const profileData = {

      uid:
        user.uid,

      username:
        username,

      channelName:
        channelName,

      bio:
        bio,

      link:
        link,

      photoURL:
        photoURL,

      email:
        user.email || "",

      updatedAt:
        firebaseFunctions.serverTimestamp()

    };


    await firebaseFunctions.setDoc(
      firebaseFunctions.doc(
        firebaseFunctions.db,
        "profiles",
        user.uid
      ),
      profileData,
      {
        merge: true
      }
    );


    /* UPDATE FIREBASE AUTH PHOTO */

    try {

      await firebaseFunctions
        .updateProfile(
          user,
          {
            displayName:
              channelName,

            photoURL:
              photoURL || null

          }
        );

    } catch (authError) {

      console.log(
        "Auth profile update skipped:",
        authError
      );

    }


    window.currentProfile =
      profileData;


    updateProfileHeader(
      profileData
    );


    status.textContent =
      "Profile saved successfully! 🎉";


    setTimeout(
      () => {

        $("profileModal")
          .style.display =
          "none";

      },
      700
    );


  } catch (error) {

    console.error(error);

    status.textContent =
      "❌ " +
      error.message;

  }

}


function updateProfileHeader(profile) {

  $("profileName").textContent =
    profile.channelName ||
    "MiniTube User";

  $("profileUsername").textContent =
    profile.username
      ? "@" + profile.username
      : "@username";

  $("profileEmail").textContent =
    window.currentUser?.email || "";

  $("profilePhoto").src =
    profile.photoURL ||
    getAvatar(
      profile.channelName ||
      "M"
    );

}


/* =========================
   LOGOUT
========================= */

$("logoutButton")
  .addEventListener(
    "click",
    async () => {

      try {

        await firebaseFunctions
          .signOut(
            firebaseAuth
          );

        $("profileMenu")
          .classList.remove("show");

        showHome();

        alert(
          "You have been logged out."
        );

      } catch (error) {

        alert(
          "Logout failed: " +
          error.message
        );

      }

    }
  );


/* =========================
   MY CHANNEL
========================= */

$("myChannelButton")
  .addEventListener(
    "click",
    openMyChannel
  );


async function openMyChannel() {

  if (!window.currentUser) {

    openLogin();

    return;

  }

  $("profileMenu")
    .classList.remove("show");

  $("homePage").style.display = "none";
  $("videoPage").style.display = "none";
  $("uploadPage").style.display = "none";
  $("channelPage").style.display = "block";

  const user =
    window.currentUser;

  let profile =
    window.currentProfile;

  if (!profile) {

    try {

      const snap =
        await firebaseFunctions.getDoc(
          firebaseFunctions.doc(
            firebaseFunctions.db,
            "profiles",
            user.uid
          )
        );

      if (snap.exists()) {

        profile =
          snap.data();

        window.currentProfile =
          profile;

      }

    } catch (error) {

      console.error(error);

    }

  }

  profile =
    profile || {};

  $("channelName").textContent =
    profile.channelName ||
    user.displayName ||
    "MiniTube User";

  $("channelUsername").textContent =
    profile.username
      ? "@" + profile.username
      : "@username";

  $("channelEmail").textContent =
    user.email || "";

  $("channelBio").textContent =
    profile.bio ||
    "No bio yet.";

  const channelLink =
    $("channelLink");

  if (profile.link) {

    channelLink.href =
      profile.link;

    channelLink.textContent =
      "🔗 " + profile.link;

    channelLink.style.display =
      "inline-block";

  } else {

    channelLink.style.display =
      "none";

  }

  $("channelPhoto").src =
    profile.photoURL ||
    user.photoURL ||
    getAvatar(
      profile.channelName ||
      user.displayName ||
      "M"
    );

}


$("backFromChannelButton")
  .addEventListener(
    "click",
    showHome
  );


/* =========================
   UPLOAD PAGE
========================= */

$("uploadButton")
  .addEventListener(
    "click",
    () => {

      if (!window.currentUser) {

        openLogin();

        return;

      }

      $("homePage").style.display = "none";
      $("videoPage").style.display = "none";
      $("channelPage").style.display = "none";
      $("uploadPage").style.display = "block";

      $("profileMenu")
        .classList.remove("show");

    }
  );


$("backFromUploadButton")
  .addEventListener(
    "click",
    showHome
  );


/* =========================
   VIDEO PREVIEW
========================= */

$("videoFile")
  .addEventListener(
    "change",
    () => {

      const file =
        $("videoFile").files[0];

      if (!file) {

        $("videoPreview").style.display =
          "none";

        return;

      }

      const url =
        URL.createObjectURL(file);

      $("videoPreview").src = url;

      $("videoPreview").style.display =
        "block";

    }
  );


/* =========================
   UPLOAD VIDEO
========================= */

$("uploadVideoButton")
  .addEventListener(
    "click",
    async () => {

      const file =
        $("videoFile").files[0];

      const title =
        $("videoTitle").value.trim();

      const description =
        $("videoDescription").value.trim();

      const category =
        $("videoCategory").value;

      if (!file) {

        alert("Please select a video.");

        return;

      }

      if (!title) {

        alert("Please enter a video title.");

        return;

      }

      if (!window.currentUser) {

        alert(
          "Please login before uploading."
        );

        openLogin();

        return;

      }

      $("uploadStatus").textContent =
        "Uploading video... ⏳";

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

          throw new Error(
            data.error?.message ||
            "Upload failed."
          );

        }

        const profile =
          window.currentProfile || {};

        const newVideo = {

          id:
            Date.now().toString(),

          title:
            title,

          creator:
            profile.channelName ||
            window.currentUser.displayName ||
            "MiniTube User",

          description:
            description,

          category:
            category,

          url:
            data.secure_url,

          views:
            0,

          likes:
            0

        };

        videos = [
          newVideo,
          ...videos
        ];

        saveVideos();

        $("uploadStatus").textContent =
          "Video successfully uploaded! 🎉";

        alert(
          "Video successfully uploaded! 🎉"
        );

        $("videoTitle").value = "";
        $("videoDescription").value = "";
        $("videoCategory").value = "Gaming";
        $("videoFile").value = "";

        $("videoPreview").src = "";
        $("videoPreview").style.display = "none";

        currentCategory = "All";

        document
          .querySelectorAll(
            ".categories button"
          )
          .forEach(button => {

            button.classList.toggle(
              "active",
              button.dataset.category === "All"
            );

          });

        renderVideos();

        setTimeout(
          showHome,
          500
        );

      } catch (error) {

        console.error(error);

        $("uploadStatus").textContent =
          "Upload failed: " +
          error.message;

        alert(
          "Upload failed: " +
          error.message
        );

      }

    }
  );


/* =========================
   BACK FROM VIDEO
========================= */

$("backFromVideoButton")
  .addEventListener(
    "click",
    () => {

      $("mainVideo").pause();

      $("mainVideo")
        .removeAttribute("src");

      $("mainVideo").load();

      showHome();

    }
  );


/* =========================
   LIKE
========================= */

$("likeButton")
  .addEventListener(
    "click",
    () => {

      if (!currentVideo) {
        return;
      }

      const id =
        currentVideo.id;

      if (likedVideos[id]) {

        alert(
          "You already liked this video."
        );

        return;

      }

      currentVideo.likes =
        (currentVideo.likes || 0) + 1;

      likedVideos[id] = true;

      localStorage.setItem(
        "minitubeLikes",
        JSON.stringify(likedVideos)
      );

      saveVideos();

      $("likeCount").textContent =
        currentVideo.likes;

    }
  );


/* =========================
   SHARE
========================= */

$("shareButton")
  .addEventListener(
    "click",
    async () => {

      if (!currentVideo) {
        return;
      }

      const shareData = {

        title:
          currentVideo.title,

        text:
          "Watch this video on MiniTube 🎬",

        url:
          window.location.href

      };

      try {

        if (navigator.share) {

          await navigator.share(
            shareData
          );

        } else {

          await navigator.clipboard
            .writeText(
              window.location.href
            );

          alert(
            "Video link copied! 🔗"
          );

        }

      } catch (error) {

        console.log(
          "Share cancelled."
        );

      }

    }
  );


/* =========================
   COMMENTS
========================= */

function loadComments(videoId) {

  const allComments =
    getComments();

  const comments =
    allComments[videoId] || [];

  const list =
    $("commentsList");

  list.innerHTML = "";

  if (!comments.length) {

    list.innerHTML =
      "<p class='no-comments'>No comments yet. Be the first! 💬</p>";

    return;

  }

  comments.forEach(comment => {

    const item =
      document.createElement("div");

    item.className =
      "comment-item";

    const avatar =
      document.createElement("img");

    avatar.className =
      "comment-avatar";

    avatar.src =
      comment.photo ||
      getAvatar(
        comment.name || "User"
      );

    const content =
      document.createElement("div");

    content.className =
      "comment-content";

    const author =
      document.createElement("strong");

    author.textContent =
      comment.name ||
      "MiniTube User";

    const text =
      document.createElement("p");

    text.textContent =
      comment.text;

    content.appendChild(author);
    content.appendChild(text);

    item.appendChild(avatar);
    item.appendChild(content);

    list.appendChild(item);

  });

}


$("commentButton")
  .addEventListener(
    "click",
    addComment
  );


$("commentInput")
  .addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        addComment();
      }

    }
  );


function addComment() {

  if (!currentVideo) {
    return;
  }

  if (!window.currentUser) {

    alert(
      "Please login to comment."
    );

    openLogin();

    return;

  }

  const input =
    $("commentInput");

  const text =
    input.value.trim();

  if (!text) {

    alert(
      "Please write a comment."
    );

    return;

  }

  const allComments =
    getComments();

  if (!allComments[currentVideo.id]) {

    allComments[currentVideo.id] = [];

  }

  const profile =
    window.currentProfile || {};

  allComments[currentVideo.id].push({

    name:
      profile.channelName ||
      window.currentUser.displayName ||
      "MiniTube User",

    text:
      text,

    photo:
      profile.photoURL ||
      window.currentUser.photoURL ||
      getAvatar(
        profile.channelName ||
        "User"
      )

  });

  saveComments(allComments);

  input.value = "";

  loadComments(currentVideo.id);

}


/* =========================
   CLOSE MODALS BY BACKDROP
========================= */

window.addEventListener(
  "click",
  event => {

    if (
      event.target === $("loginModal") ||
      event.target === $("signupModal") ||
      event.target === $("profileModal")
    ) {

      closeModals();

    }

  }
);


/* =========================
   START
========================= */

prepareVideos();

renderVideos();

showHome();
