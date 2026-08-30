/* =========================================================
   MINITUBE - MAIN JAVASCRIPT
========================================================= */

const $ = (id) => document.getElementById(id);

let videos = [];
let currentVideo = null;

let likedVideos = JSON.parse(
  localStorage.getItem("minitubeLikes") || "{}"
);


/* =========================================================
   WAIT FOR FIREBASE
========================================================= */

function waitForFirebase() {
  return new Promise((resolve) => {

    const check = () => {

      if (
        window.firebaseFunctions &&
        window.firebaseAuth &&
        window.db
      ) {
        resolve();
      } else {
        setTimeout(check, 100);
      }

    };

    check();

  });
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function saveLocalVideos() {

  localStorage.setItem(
    "minitubeVideos",
    JSON.stringify(videos)
  );

}


function getLocalVideos() {

  try {

    return JSON.parse(
      localStorage.getItem("minitubeVideos") || "[]"
    );

  } catch {

    return [];

  }

}


/* =========================================================
   DEFAULT VIDEOS
========================================================= */

function getDefaultVideos() {

  return [

    {
      id: "demo1",
      title: "Amazing Gaming Video 🎮",
      creator: "Mini Gamer",
      description: "Amazing gaming video on MiniTube.",
      url: "",
      views: 12000,
      likes: 1
    },

    {
      id: "demo2",
      title: "Beautiful Islamic Reminder 🕌",
      creator: "Islamic Channel",
      description: "A beautiful Islamic reminder.",
      url: "",
      views: 25000,
      likes: 1
    },

    {
      id: "demo3",
      title: "Learn Something New 📚",
      creator: "Knowledge Hub",
      description: "Learn something new today.",
      url: "",
      views: 8000,
      likes: 1
    },

    {
      id: "demo4",
      title: "Best Football Moments ⚽",
      creator: "Sports World",
      description: "Best football moments.",
      url: "",
      views: 45000,
      likes: 1
    }

  ];

}


/* =========================================================
   FIREBASE VIDEO LOADING
========================================================= */

async function loadVideosFromFirebase() {

  await waitForFirebase();

  try {

    const {
      collection,
      getDocs
    } = window.firebaseFunctions;

    const snapshot = await getDocs(
      collection(window.db, "videos")
    );

    const firebaseVideos = [];

    snapshot.forEach((doc) => {

      const data = doc.data();

      firebaseVideos.push({

        id: doc.id,

        title:
          data.title || "Untitled Video",

        creator:
          data.creator || "MiniTube User",

        description:
          data.description || "",

        url:
          data.url || "",

        views:
          data.views || 0,

        likes:
          data.likes || 0,

        createdAt:
          data.createdAt || null

      });

    });


    if (firebaseVideos.length > 0) {

      videos = firebaseVideos;

      saveLocalVideos();

      console.log(
        "Videos loaded from Firebase:",
        videos.length
      );

    } else {

      const localVideos = getLocalVideos();

      if (localVideos.length > 0) {

        videos = localVideos;

      } else {

        videos = getDefaultVideos();

        saveLocalVideos();

      }

    }


    renderVideos();

  } catch (error) {

    console.error(
      "Firebase video loading error:",
      error
    );


    const localVideos = getLocalVideos();

    if (localVideos.length > 0) {

      videos = localVideos;

    } else {

      videos = getDefaultVideos();

      saveLocalVideos();

    }


    renderVideos();


    console.log(
      "Couldn't load videos from Firebase. Local videos loaded instead."
    );

  }

}


/* =========================================================
   SHOW HOME
========================================================= */

function showHome() {

  $("homePage").style.display = "block";
  $("videoPage").style.display = "none";
  $("channelPage").style.display = "none";
  $("uploadPage").style.display = "none";

}


/* =========================================================
   SHOW VIDEO
========================================================= */

function openVideo(video) {

  currentVideo = video;

  $("homePage").style.display = "none";
  $("videoPage").style.display = "block";
  $("channelPage").style.display = "none";
  $("uploadPage").style.display = "none";


  $("mainVideoTitle").textContent =
    video.title || "Untitled Video";


  $("mainVideoCreator").textContent =
    video.creator || "MiniTube User";


  $("mainVideoViews").textContent =
    formatViews(video.views || 0) + " views";


  $("mainVideoDescription").textContent =
    video.description ||
    "No description available.";


  const mainVideo = $("mainVideo");


  mainVideo.pause();

  mainVideo.removeAttribute("src");

  mainVideo.load();


  if (video.url) {

    mainVideo.src = video.url;

    mainVideo.load();

  }


  $("downloadButton").href =
    video.url || "#";


  $("downloadButton").download =
    "";


  $("videoCreatorAvatar").textContent =
    (video.creator || "M")
      .charAt(0)
      .toUpperCase();


  $("likeCount").textContent =
    video.likes || 0;


  loadComments(video.id);


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   RENDER VIDEOS
========================================================= */

function renderVideos(list = videos) {

  const grid = $("videoGrid");

  if (!grid) return;

  grid.innerHTML = "";


  if (!list || list.length === 0) {

    grid.innerHTML =
      "<p>No videos available.</p>";

    return;

  }


  list.forEach((video) => {

    const card =
      document.createElement("div");

    card.className = "video-card";


    const thumbnail =
      document.createElement("div");

    thumbnail.className = "thumbnail";


    if (video.url) {

      const videoElement =
        document.createElement("video");

      videoElement.src = video.url;

      videoElement.muted = true;

      videoElement.playsInline = true;

      videoElement.preload = "metadata";

      videoElement.setAttribute(
        "aria-label",
        video.title || "Video"
      );


      thumbnail.appendChild(
        videoElement
      );

    } else {

      thumbnail.innerHTML = "▶";

    }


    const info =
      document.createElement("div");

    info.className = "video-info";


    const avatar =
      document.createElement("div");

    avatar.className =
      "channel-avatar";

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
      video.creator ||
      "MiniTube User";


    const views =
      document.createElement("p");

    views.textContent =
      formatViews(video.views || 0) +
      " views";


    details.appendChild(title);
    details.appendChild(creator);
    details.appendChild(views);


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


/* =========================================================
   FORMAT VIEWS
========================================================= */

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


/* =========================================================
   SEARCH
========================================================= */

function searchVideos() {

  const input = $("searchInput");

  if (!input) return;


  const search =
    input.value
      .toLowerCase()
      .trim();


  if (!search) {

    renderVideos(videos);

    return;

  }


  const results =
    videos.filter((video) => {

      const title =
        (video.title || "")
          .toLowerCase();

      const creator =
        (video.creator || "")
          .toLowerCase();

      const description =
        (video.description || "")
          .toLowerCase();


      return (
        title.includes(search) ||
        creator.includes(search) ||
        description.includes(search)
      );

    });


  renderVideos(results);

}


/* =========================================================
   LOGIN / SIGNUP
========================================================= */

function openLogin() {

  $("loginModal").style.display =
    "flex";

}


function openSignup() {

  $("signupModal").style.display =
    "flex";

}


function closeModals() {

  $("loginModal").style.display =
    "none";

  $("signupModal").style.display =
    "none";

}


/* =========================================================
   EMAIL SIGNUP
========================================================= */

async function emailSignup() {

  const name =
    $("signupName").value.trim();

  const email =
    $("signupEmail").value.trim();

  const password =
    $("signupPassword").value;


  if (!name || !email || !password) {

    alert(
      "Please fill all fields."
    );

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


/* =========================================================
   EMAIL LOGIN
========================================================= */

async function emailLogin() {

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;


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


/* =========================================================
   GOOGLE LOGIN
========================================================= */

async function googleLogin() {

  try {

    await firebaseFunctions
      .signInWithPopup(
        firebaseAuth,
        googleProvider
      );


    closeModals();

  } catch (error) {

    alert(
      "Google login failed: " +
      error.message
    );

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    await firebaseFunctions
      .signOut(firebaseAuth);

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


/* =========================================================
   CHANNEL
========================================================= */

function openChannel() {

  if (!window.currentUser) {

    openLogin();

    return;

  }


  $("homePage").style.display = "none";
  $("videoPage").style.display = "none";
  $("uploadPage").style.display = "none";
  $("channelPage").style.display = "block";


  const user =
    window.currentUser;


  $("channelName").textContent =
    user.displayName ||
    "MiniTube User";


  $("channelEmail").textContent =
    user.email || "";


  $("channelPhoto").src =
    user.photoURL ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(
      user.displayName ||
      "MiniTube User"
    );


  $("profileMenu")
    .classList.remove("show");

}


/* =========================================================
   UPLOAD PAGE
========================================================= */

function openUploadPage() {

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


/* =========================================================
   VIDEO PREVIEW
========================================================= */

function previewVideo() {

  const file =
    $("videoFile").files[0];


  if (!file) {

    $("videoPreview").style.display =
      "none";

    $("videoPreview").src = "";

    return;

  }


  const url =
    URL.createObjectURL(file);


  $("videoPreview").src = url;

  $("videoPreview").style.display =
    "block";

}


/* =========================================================
   UPLOAD VIDEO TO CLOUDINARY + FIREBASE
========================================================= */

async function uploadVideo() {

  const file =
    $("videoFile").files[0];

  const title =
    $("videoTitle").value.trim();

  const description =
    $("videoDescription")
      .value
      .trim();


  if (!window.currentUser) {

    alert(
      "Please login first."
    );

    openLogin();

    return;

  }


  if (!file) {

    alert(
      "Please select a video."
    );

    return;

  }


  if (!title) {

    alert(
      "Please enter a video title."
    );

    return;

  }


  $("uploadStatus")
    .textContent =
      "Uploading video... ⏳";


  try {

    /* CLOUDINARY */

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
        "Cloudinary upload failed."
      );

    }


    const newVideo = {

      title:
        title,

      creator:
        window.currentUser.displayName ||
        "MiniTube User",

      description:
        description,

      url:
        data.secure_url,

      views:
        0,

      likes:
        0,

      userId:
        window.currentUser.uid,

      createdAt:
        new Date().toISOString()

    };


    /* FIREBASE */

    const {
      collection,
      addDoc
    } = window.firebaseFunctions;


    const docRef =
      await addDoc(
        collection(window.db, "videos"),
        newVideo
      );


    const savedVideo = {

      id:
        docRef.id,

      ...newVideo

    };


    videos.unshift(
      savedVideo
    );


    saveLocalVideos();


    $("uploadStatus")
      .textContent =
        "Video successfully uploaded! 🎉";


    alert(
      "Video successfully uploaded! 🎉"
    );


    $("videoTitle").value = "";
    $("videoDescription").value = "";
    $("videoFile").value = "";

    $("videoPreview").src = "";

    $("videoPreview")
      .style.display = "none";


    renderVideos();


    setTimeout(
      showHome,
      500
    );


  } catch (error) {

    console.error(
      "Upload error:",
      error
    );


    $("uploadStatus")
      .textContent =
        "Upload failed: " +
        error.message;


    alert(
      "Upload failed: " +
      error.message
    );

  }

}


/* =========================================================
   BACK FROM VIDEO
========================================================= */

function backFromVideo() {

  $("mainVideo").pause();

  $("mainVideo").removeAttribute("src");

  $("mainVideo").load();

  showHome();

}


/* =========================================================
   LIKE
========================================================= */

async function likeVideo() {

  if (!currentVideo) return;


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


  $("likeCount").textContent =
    currentVideo.likes;


  try {

    if (
      currentVideo.id &&
      !String(currentVideo.id)
        .startsWith("demo")
    ) {

      const {
        doc,
        updateDoc,
        increment
      } = window.firebaseFunctions;


      await updateDoc(
        doc(
          window.db,
          "videos",
          currentVideo.id
        ),
        {
          likes: increment(1)
        }
      );

    }

  } catch (error) {

    console.error(
      "Like update failed:",
      error
    );

  }


  saveLocalVideos();

}


/* =========================================================
   SHARE
========================================================= */

async function shareVideo() {

  if (!currentVideo) return;


  const shareData = {

    title:
      currentVideo.title,

    text:
      "Watch this video on MiniTube 🎬",

    url:
      window.location.href

  };


  try {

    if (
      navigator.share
    ) {

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

  } catch {

    console.log(
      "Share cancelled."
    );

  }

}


/* =========================================================
   COMMENTS
========================================================= */

function getComments() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "minitubeComments"
      ) || "{}"
    );

  } catch {

    return {};

  }

}


function saveComments(comments) {

  localStorage.setItem(
    "minitubeComments",
    JSON.stringify(comments)
  );

}


function loadComments(videoId) {

  const allComments =
    getComments();


  const comments =
    allComments[videoId] || [];


  const list =
    $("commentsList");


  if (!list) return;


  list.innerHTML = "";


  if (comments.length === 0) {

    list.innerHTML =
      "<p class='no-comments'>No comments yet. Be the first! 💬</p>";

    return;

  }


  comments.forEach((comment) => {

    const item =
      document.createElement("div");

    item.className =
      "comment";


    const avatar =
      document.createElement("img");

    avatar.className =
      "comment-avatar";

    avatar.src =
      comment.photo ||
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(
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


function addComment() {

  if (!currentVideo) return;


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

    allComments[currentVideo.id] =
      [];

  }


  allComments[currentVideo.id]
    .push({

      name:
        window.currentUser.displayName ||
        "MiniTube User",

      text:
        text,

      photo:
        window.currentUser.photoURL ||
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          window.currentUser.displayName ||
          "User"
        )

    });


  saveComments(
    allComments
  );


  input.value = "";


  loadComments(
    currentVideo.id
  );

}


/* =========================================================
   PROFILE MENU
========================================================= */

function toggleProfile(event) {

  event.stopPropagation();

  $("profileMenu")
    .classList.toggle("show");

}


/* =========================================================
   FIREBASE AUTH STATE
========================================================= */

async function setupAuth() {

  await waitForFirebase();


  firebaseFunctions.onAuthStateChanged(
    firebaseAuth,
    (user) => {

      window.currentUser =
        user;


      if (user) {

        $("authButtons")
          .style.display =
            "none";


        $("profileArea")
          .style.display =
            "block";


        $("profileName")
          .textContent =
            user.displayName ||
            "MiniTube User";


        $("profileEmail")
          .textContent =
            user.email || "";


        const photo =
          user.photoURL ||
          "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(
            user.displayName ||
            "M"
          );


        $("profilePhoto")
          .src = photo;


      } else {

        $("authButtons")
          .style.display =
            "flex";


        $("profileArea")
          .style.display =
            "none";

      }

    }
  );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

async function startMiniTube() {

  await waitForFirebase();


  /* SEARCH */

  $("searchButton")
    .addEventListener(
      "click",
      searchVideos
    );


  $("searchInput")
    .addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Enter") {

          searchVideos();

        }

      }
    );


  /* LOGIN */

  $("loginButton")
    .addEventListener(
      "click",
      openLogin
    );


  $("signupButton")
    .addEventListener(
      "click",
      openSignup
    );


  $("getStartedButton")
    .addEventListener(
      "click",
      openSignup
    );


  $("closeLoginButton")
    .addEventListener(
      "click",
      closeModals
    );


  $("closeSignupButton")
    .addEventListener(
      "click",
      closeModals
    );


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


  /* AUTH */

  $("emailSignupButton")
    .addEventListener(
      "click",
      emailSignup
    );


  $("emailLoginButton")
    .addEventListener(
      "click",
      emailLogin
    );


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


  /* PROFILE */

  $("profilePhoto")
    .addEventListener(
      "click",
      toggleProfile
    );


  $("logoutButton")
    .addEventListener(
      "click",
      logout
    );


  $("myChannelButton")
    .addEventListener(
      "click",
      openChannel
    );


  $("uploadButton")
    .addEventListener(
      "click",
      openUploadPage
    );


  /* CHANNEL */

  $("backFromChannelButton")
    .addEventListener(
      "click",
      showHome
    );


  /* UPLOAD */

  $("backFromUploadButton")
    .addEventListener(
      "click",
      showHome
    );


  $("videoFile")
    .addEventListener(
      "change",
      previewVideo
    );


  $("uploadVideoButton")
    .addEventListener(
      "click",
      uploadVideo
    );


  /* VIDEO */

  $("backFromVideoButton")
    .addEventListener(
      "click",
      backFromVideo
    );


  $("likeButton")
    .addEventListener(
      "click",
      likeVideo
    );


  $("shareButton")
    .addEventListener(
      "click",
      shareVideo
    );


  /* COMMENTS */

  $("commentButton")
    .addEventListener(
      "click",
      addComment
    );


  $("commentInput")
    .addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Enter") {

          addComment();

        }

      }
    );


  /* OUTSIDE CLICK */

  document.addEventListener(
    "click",
    (event) => {

      if (
        !event.target.closest(
          "#profileArea"
        )
      ) {

        $("profileMenu")
          .classList.remove("show");

      }

    }
  );


  /* MODAL OUTSIDE CLICK */

  window.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        $("loginModal")
      ) {

        closeModals();

      }


      if (
        event.target ===
        $("signupModal")
      ) {

        closeModals();

      }

    }
  );


  /* AUTH */

  setupAuth();


  /* VIDEOS */

  await loadVideosFromFirebase();


  showHome();

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  startMiniTube
);
