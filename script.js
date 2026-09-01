const $ = (id) => document.getElementById(id);


/* =========================
   DATA
========================= */

let videos = JSON.parse(
  localStorage.getItem("minitubeVideos") || "[]"
);

let currentVideo = null;

let currentCategory = "All";

let likedVideos = JSON.parse(
  localStorage.getItem("minitubeLikes") || "{}"
);

let currentProfile = null;


/* =========================
   DEFAULT PROFILE
========================= */

function defaultProfile() {

  const user = window.currentUser;

  return {

    username:
      (user?.displayName || "user")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 30) ||
      "user",

    channelName:
      user?.displayName ||
      "MiniTube User",

    bio:
      "",

    link:
      "",

    photoURL:
      user?.photoURL ||
      ""

  };

}


/* =========================
   LOAD PROFILE
========================= */

async function loadUserProfile() {

  if (!window.currentUser) {
    return;
  }


  try {

    const user = window.currentUser;

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


    if (profileSnap.exists()) {

      currentProfile =
        profileSnap.data();

    } else {

      currentProfile =
        defaultProfile();


      await firebaseFunctions.setDoc(
        profileRef,
        {
          ...currentProfile,
          email:
            user.email || "",
          createdAt:
            firebaseFunctions.serverTimestamp()
        }
      );

    }


    updateProfileUI();

  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );

    currentProfile =
      defaultProfile();

    updateProfileUI();

  }

}


/* =========================
   UPDATE PROFILE UI
========================= */

function updateProfileUI() {

  const user =
    window.currentUser;

  if (!user) {
    return;
  }


  const profile =
    currentProfile ||
    defaultProfile();


  const name =
    profile.channelName ||
    user.displayName ||
    "MiniTube User";


  const username =
    profile.username ||
    "username";


  const photo =
    profile.photoURL ||
    user.photoURL ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(name);


  $("profileName").textContent =
    name;


  $("profileUsername").textContent =
    "@" + username;


  $("profileEmail").textContent =
    user.email || "";


  $("profilePhoto").src =
    photo;


  $("channelName").textContent =
    name;


  $("channelUsername").textContent =
    "@" + username;


  $("channelEmail").textContent =
    user.email || "";


  $("channelBio").textContent =
    profile.bio ||
    "No bio added yet.";


  $("channelPhoto").src =
    photo;


  const link =
    $("channelLink");


  if (profile.link) {

    link.href =
      normalizeLink(profile.link);

    link.textContent =
      "🔗 " + profile.link;

    link.style.display =
      "inline-block";

  } else {

    link.style.display =
      "none";

  }

}


/* =========================
   LINK NORMALIZER
========================= */

function normalizeLink(link) {

  link =
    String(link || "")
      .trim();

  if (!link) {
    return "";
  }


  if (
    !link.startsWith("http://") &&
    !link.startsWith("https://")
  ) {

    return "https://" + link;

  }


  return link;

}


/* =========================
   SAVE PROFILE
========================= */

async function saveUserProfile() {

  if (!window.currentUser) {

    alert(
      "Please login first."
    );

    return;

  }


  const username =
    $("editUsername")
      .value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");


  const channelName =
    $("editChannelName")
      .value
      .trim();


  const bio =
    $("editBio")
      .value
      .trim();


  const link =
    $("editLink")
      .value
      .trim();


  if (!username) {

    alert(
      "Please enter a username."
    );

    return;

  }


  if (!channelName) {

    alert(
      "Please enter a channel name."
    );

    return;

  }


  if (!/^[a-z0-9_.-]+$/i.test(username)) {

    alert(
      "Username can only contain letters, numbers, _ , . and -"
    );

    return;

  }


  const user =
    window.currentUser;


  let photoURL =
    currentProfile?.photoURL ||
    user.photoURL ||
    "";


  const imageFile =
    $("profileImageFile")
      .files[0];


  try {

    $("saveProfileButton")
      .disabled = true;


    $("profileSaveStatus")
      .textContent =
      "Saving profile... ⏳";


    /* =========================
       UPLOAD PROFILE IMAGE
    ========================= */

    if (imageFile) {

      $("profileSaveStatus")
        .textContent =
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
          "https://api.cloudinary.com/v1_1/dvvsxjid/image/upload",
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


    /* =========================
       FIREBASE AUTH PROFILE
    ========================= */

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


    /* =========================
       FIRESTORE PROFILE
    ========================= */

    const profileData = {

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

      uid:
        user.uid,

      updatedAt:
        firebaseFunctions.serverTimestamp()

    };


    const profileRef =
      firebaseFunctions.doc(
        firebaseFunctions.db,
        "profiles",
        user.uid
      );


    await firebaseFunctions
      .setDoc(
        profileRef,
        profileData,
        {
          merge: true
        }
      );


    currentProfile = {

      username:
        username,

      channelName:
        channelName,

      bio:
        bio,

      link:
        link,

      photoURL:
        photoURL

    };


    updateProfileUI();


    $("profileSaveStatus")
      .textContent =
      "Profile saved successfully! 🎉";


    setTimeout(
      () => {

        closeEditProfile();

      },
      800
    );


  } catch (error) {

    console.error(error);


    $("profileSaveStatus")
      .textContent =
      "Error: " +
      error.message;


    alert(
      "Profile update failed: " +
      error.message
    );

  } finally {

    $("saveProfileButton")
      .disabled = false;

  }

}


/* =========================
   OPEN EDIT PROFILE
========================= */

function openEditProfile() {

  if (!window.currentUser) {

    openLogin();

    return;

  }


  const profile =
    currentProfile ||
    defaultProfile();


  $("editUsername").value =
    profile.username || "";


  $("editChannelName").value =
    profile.channelName ||
    window.currentUser.displayName ||
    "";


  $("editBio").value =
    profile.bio || "";


  $("editLink").value =
    profile.link || "";


  $("editProfilePreview").src =
    profile.photoURL ||
    window.currentUser.photoURL ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(
      profile.channelName ||
      "MiniTube User"
    );


  $("profileImageFile").value =
    "";


  $("profileSaveStatus")
    .textContent = "";


  $("editProfileModal")
    .style.display =
    "flex";


  $("profileMenu")
    .classList.remove(
      "show"
    );

}


/* =========================
   CLOSE EDIT PROFILE
========================= */

function closeEditProfile() {

  $("editProfileModal")
    .style.display =
    "none";

}


/* =========================
   PROFILE IMAGE PREVIEW
========================= */

$("profileImageFile")
  .addEventListener(
    "change",
    () => {

      const file =
        $("profileImageFile")
          .files[0];


      if (!file) {
        return;
      }


      if (!file.type.startsWith("image/")) {

        alert(
          "Please select an image."
        );

        $("profileImageFile").value =
          "";

        return;

      }


      const reader =
        new FileReader();


      reader.onload =
        event => {

          $("editProfilePreview")
            .src =
            event.target.result;

        };


      reader.readAsDataURL(
        file
      );

    }
  );


/* =========================
   PROFILE BUTTON
========================= */

$("editProfileButton")
  .addEventListener(
    "click",
    openEditProfile
  );


$("closeEditProfileButton")
  .addEventListener(
    "click",
    closeEditProfile
  );


$("saveProfileButton")
  .addEventListener(
    "click",
    saveUserProfile
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
    localStorage.getItem(
      "minitubeComments"
    ) || "{}"
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

  const saved =
    JSON.parse(
      localStorage.getItem(
        "minitubeVideos"
      ) || "[]"
    );


  videos =
    saved.filter(video => {

      if (!video || !video.id) {
        return false;
      }

      return !String(
        video.id
      ).startsWith("demo");

    });


  saveVideos();

}


/* =========================
   VIEWS
========================= */

function formatViews(number) {

  number =
    Number(number) || 0;


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


  seconds =
    Math.floor(seconds);


  const hours =
    Math.floor(seconds / 3600);


  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );


  const secs =
    seconds % 60;


  if (hours > 0) {

    return (
      hours +
      ":" +
      String(minutes)
        .padStart(2, "0") +
      ":" +
      String(secs)
        .padStart(2, "0")
    );

  }


  return (
    minutes +
    ":" +
    String(secs)
      .padStart(2, "0")
  );

}


/* =========================
   HOME
========================= */

function showHome() {

  $("homePage").style.display =
    "block";

  $("videoPage").style.display =
    "none";

  $("channelPage").style.display =
    "none";

  $("uploadPage").style.display =
    "none";

}


/* =========================
   OPEN VIDEO
========================= */

function openVideo(video) {

  if (!video || !video.url) {

    alert(
      "This video has no playable file."
    );

    return;

  }


  currentVideo =
    video;


  $("homePage").style.display =
    "none";

  $("videoPage").style.display =
    "block";

  $("channelPage").style.display =
    "none";

  $("uploadPage").style.display =
    "none";


  $("mainVideoTitle").textContent =
    video.title ||
    "Video";


  $("mainVideoCreator").textContent =
    video.creator ||
    "MiniTube User";


  $("mainVideoViews").textContent =
    formatViews(
      video.views || 0
    ) +
    " views";


  $("mainVideoDescription").textContent =
    video.description ||
    "No description available.";


  $("likeCount").textContent =
    video.likes || 0;


  const creatorPhoto =
    video.creatorPhoto ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(
      video.creator ||
      "M"
    );


  $("videoCreatorPhoto").src =
    creatorPhoto;


  const player =
    $("mainVideo");


  player.pause();

  player.removeAttribute("src");

  player.load();

  player.src =
    video.url;

  player.load();


  $("downloadButton").href =
    video.url;


  loadComments(
    video.id
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================
   THUMBNAIL
========================= */

function createThumbnail(
  video,
  thumbnail
) {

  thumbnail.innerHTML = "";


  if (!video.url) {

    thumbnail.innerHTML =
      "▶";

    return;

  }


  const videoElement =
    document.createElement(
      "video"
    );


  videoElement.src =
    video.url;

  videoElement.muted =
    true;

  videoElement.preload =
    "metadata";

  videoElement.playsInline =
    true;


  videoElement.addEventListener(
    "loadedmetadata",
    () => {

      const duration =
        formatDuration(
          videoElement.duration
        );


      if (duration) {

        thumbnail.dataset.duration =
          duration;

      }

    }
  );


  videoElement.addEventListener(
    "error",
    () => {

      thumbnail.innerHTML =
        "▶";

    }
  );


  thumbnail.appendChild(
    videoElement
  );

}


/* =========================
   RENDER VIDEOS
========================= */

function renderVideos(
  list = videos
) {

  const grid =
    $("videoGrid");


  if (!grid) {
    return;
  }


  grid.innerHTML =
    "";


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
      document.createElement(
        "div"
      );


    card.className =
      "video-card";


    const thumbnail =
      document.createElement(
        "div"
      );


    thumbnail.className =
      "thumbnail";


    createThumbnail(
      video,
      thumbnail
    );


    const info =
      document.createElement(
        "div"
      );


    info.className =
      "video-info";


    const avatar =
      document.createElement(
        "img"
      );


    avatar.className =
      "channel-avatar-img";


    avatar.src =
      video.creatorPhoto ||
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(
        video.creator ||
        "M"
      );


    const details =
      document.createElement(
        "div"
      );


    const title =
      document.createElement(
        "h3"
      );


    title.textContent =
      video.title ||
      "Untitled Video";


    const creator =
      document.createElement(
        "p"
      );


    creator.textContent =
      video.creator ||
      "MiniTube User";


    const views =
      document.createElement(
        "p"
      );


    views.textContent =
      formatViews(
        video.views || 0
      ) +
      " views";


    const category =
      document.createElement(
        "p"
      );


    category.textContent =
      video.category ||
      "Uncategorized";


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
   CATEGORY
========================= */

function filterCategory(category) {

  currentCategory =
    category;


  document
    .querySelectorAll(
      ".categories button"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category ===
        category
      );

    });


  applyFilters();

}


document
  .querySelectorAll(
    ".categories button"
  )
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


  let filtered =
    [...videos];


  if (
    currentCategory !==
    "All"
  ) {

    filtered =
      filtered.filter(video =>

        (
          video.category ||
          ""
        )
          .toLowerCase() ===
        currentCategory
          .toLowerCase()

      );

  }


  if (search) {

    filtered =
      filtered.filter(video =>

        (
          video.title ||
          ""
        )
          .toLowerCase()
          .includes(search)

        ||

        (
          video.creator ||
          ""
        )
          .toLowerCase()
          .includes(search)

      );

  }


  renderVideos(
    filtered
  );

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

      if (
        event.key ===
        "Enter"
      ) {

        applyFilters();

      }

    }
  );


/* =========================
   LOGIN / SIGNUP
========================= */

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


      if (
        !name ||
        !email ||
        !password
      ) {

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
              displayName:
                name
            }
          );


        alert(
          "Account successfully created! 🎉"
        );


        closeModals();


        await loadUserProfile();


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


      if (
        !email ||
        !password
      ) {

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
        .classList.toggle(
          "show"
        );

    }
  );


document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest(
        "#profileArea"
      )
    ) {

      $("profileMenu")
        .classList.remove(
          "show"
        );

    }

  }
);


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
          .classList.remove(
            "show"
          );


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
   CHANNEL
========================= */

$("myChannelButton")
  .addEventListener(
    "click",
    async () => {

      if (!window.currentUser) {

        openLogin();

        return;

      }


      await loadUserProfile();


      $("homePage").style.display =
        "none";

      $("videoPage").style.display =
        "none";

      $("uploadPage").style.display =
        "none";

      $("channelPage").style.display =
        "block";


      updateProfileUI();


      $("profileMenu")
        .classList.remove(
          "show"
        );

    }
  );


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


      $("homePage").style.display =
        "none";

      $("videoPage").style.display =
        "none";

      $("channelPage").style.display =
        "none";

      $("uploadPage").style.display =
        "block";


      $("profileMenu")
        .classList.remove(
          "show"
        );

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
        $("videoFile")
          .files[0];


      if (!file) {

        $("videoPreview")
          .style.display =
          "none";

        return;

      }


      const url =
        URL.createObjectURL(
          file
        );


      $("videoPreview").src =
        url;


      $("videoPreview")
        .style.display =
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
        $("videoFile")
          .files[0];


      const title =
        $("videoTitle")
          .value
          .trim();


      const description =
        $("videoDescription")
          .value
          .trim();


      const category =
        $("videoCategory")
          .value;


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


      if (!window.currentUser) {

        alert(
          "Please login before uploading."
        );

        openLogin();

        return;

      }


      $("uploadStatus")
        .textContent =
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
          currentProfile ||
          defaultProfile();


        const newVideo = {

          id:
            Date.now().toString(),

          title:
            title,

          creator:
            profile.channelName ||
            window.currentUser
              .displayName ||
            "MiniTube User",

          creatorUsername:
            profile.username ||
            "username",

          creatorPhoto:
            profile.photoURL ||
            window.currentUser
              .photoURL ||
            "",

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


        $("uploadStatus")
          .textContent =
          "Video successfully uploaded! 🎉";


        alert(
          "Video successfully uploaded! 🎉"
        );


        $("videoTitle").value = "";
        $("videoDescription").value = "";
        $("videoCategory").value = "Gaming";
        $("videoFile").value = "";

        $("videoPreview").src = "";

        $("videoPreview")
          .style.display =
          "none";


        currentCategory =
          "All";


        document
          .querySelectorAll(
            ".categories button"
          )
          .forEach(button => {

            button.classList.toggle(
              "active",
              button.dataset.category ===
              "All"
            );

          });


        renderVideos();


        setTimeout(
          showHome,
          500
        );


      } catch (error) {

        console.error(error);


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
  );


/* =========================
   BACK VIDEO
========================= */

$("backFromVideoButton")
  .addEventListener(
    "click",
    () => {

      $("mainVideo").pause();

      $("mainVideo")
        .removeAttribute(
          "src"
        );

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
        (currentVideo.likes || 0) +
        1;


      likedVideos[id] =
        true;


      localStorage.setItem(
        "minitubeLikes",
        JSON.stringify(
          likedVideos
        )
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
    allComments[videoId] ||
    [];


  const list =
    $("commentsList");


  list.innerHTML =
    "";


  if (!comments.length) {

    list.innerHTML =
      "<p class='no-comments'>No comments yet. Be the first! 💬</p>";

    return;

  }


  comments.forEach(
    comment => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "comment-item";


      const avatar =
        document.createElement(
          "img"
        );


      avatar.className =
        "comment-avatar";


      avatar.src =
        comment.photo ||
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          comment.name ||
          "User"
        );


      const content =
        document.createElement(
          "div"
        );


      content.className =
        "comment-content";


      const author =
        document.createElement(
          "strong"
        );


      author.textContent =
        comment.name ||
        "MiniTube User";


      const text =
        document.createElement(
          "p"
        );


      text.textContent =
        comment.text;


      content.appendChild(author);
      content.appendChild(text);


      item.appendChild(avatar);
      item.appendChild(content);


      list.appendChild(item);

    }
  );

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

      if (
        event.key ===
        "Enter"
      ) {

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


  if (
    !allComments[
      currentVideo.id
    ]
  ) {

    allComments[
      currentVideo.id
    ] = [];

  }


  allComments[
    currentVideo.id
  ].push({

    name:
      currentProfile?.channelName ||
      window.currentUser
        .displayName ||
      "MiniTube User",

    text:
      text,

    photo:
      currentProfile?.photoURL ||
      window.currentUser
        .photoURL ||
      ""

  });


  saveComments(
    allComments
  );


  input.value =
    "";


  loadComments(
    currentVideo.id
  );

}


/* =========================
   CLOSE MODALS
========================= */

window.addEventListener(
  "click",
  event => {

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


    if (
      event.target ===
      $("editProfileModal")
    ) {

      closeEditProfile();

    }

  }
);


/* =========================
   START
========================= */

prepareVideos();

renderVideos();

showHome();
