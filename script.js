/* =========================================================
   MINITUBE COMPLETE SCRIPT
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   DATA
========================================================= */

let videos = JSON.parse(
  localStorage.getItem("minitubeVideos") || "[]"
);

let likedVideos = JSON.parse(
  localStorage.getItem("minitubeLikes") || "{}"
);

let comments = JSON.parse(
  localStorage.getItem("minitubeComments") || "{}"
);

let currentVideo = null;
let currentCategory = "All";
let currentProfile = null;


/* =========================================================
   FIREBASE HELPERS
========================================================= */

function firebaseReady() {
  return !!window.firebaseFunctions;
}

function currentUser() {
  return window.currentUser || null;
}


/* =========================================================
   PROFILE
========================================================= */

function defaultProfile() {

  const user = currentUser();

  return {

    username:
      user?.displayName?.toLowerCase().replace(/\s+/g, "") ||
      "username",

    channelName:
      user?.displayName ||
      "MiniTube User",

    bio:
      "Welcome to my MiniTube channel! 🎬",

    link: "",

    photoURL:
      user?.photoURL ||
      "https://ui-avatars.com/api/?name=MiniTube+User"

  };
}


async function loadUserProfile() {

  const user = currentUser();

  if (!user || !firebaseReady()) {
    currentProfile = defaultProfile();
    updateProfileUI();
    return currentProfile;
  }

  try {

    const {
      db,
      doc,
      getDoc,
      setDoc
    } = window.firebaseFunctions;

    const ref = doc(db, "profiles", user.uid);

    const snap = await getDoc(ref);

    if (snap.exists()) {

      currentProfile = {
        ...defaultProfile(),
        ...snap.data()
      };

    } else {

      currentProfile = defaultProfile();

      await setDoc(ref, currentProfile);

    }

    updateProfileUI();

    migrateOldVideos();

    return currentProfile;

  } catch (error) {

    console.error(error);

    currentProfile = defaultProfile();

    updateProfileUI();

    return currentProfile;
  }
}


function updateProfileUI() {

  const profile =
    currentProfile || defaultProfile();

  const photo =
    profile.photoURL ||
    "https://ui-avatars.com/api/?name=User";


  if ($("headerProfilePhoto")) {
    $("headerProfilePhoto").src = photo;
  }


  if ($("channelPhoto")) {
    $("channelPhoto").src = photo;
  }

  if ($("channelName")) {
    $("channelName").textContent =
      profile.channelName || "MiniTube User";
  }

  if ($("channelUsername")) {
    $("channelUsername").textContent =
      "@" + (profile.username || "username");
  }

  if ($("channelBio")) {
    $("channelBio").textContent =
      profile.bio || "";
  }


  if ($("channelLink")) {

    const link =
      normalizeLink(profile.link);

    if (link) {

      $("channelLink").href = link;
      $("channelLink").textContent = link;

    } else {

      $("channelLink").removeAttribute("href");
      $("channelLink").textContent = "";

    }
  }
}


function normalizeLink(link) {

  if (!link) return "";

  link = link.trim();

  if (
    !link.startsWith("http://") &&
    !link.startsWith("https://")
  ) {
    return "https://" + link;
  }

  return link;
}


async function saveUserProfile() {

  const user = currentUser();

  if (!user) {

    $("profileSaveStatus").textContent =
      "Please login first.";

    return;
  }


  const username =
    $("editUsername").value.trim().replace(/^@/, "");

  const channelName =
    $("editChannelName").value.trim();

  const bio =
    $("editBio").value.trim();

  const link =
    $("editLink").value.trim();


  if (!username) {

    $("profileSaveStatus").textContent =
      "Username is required.";

    return;
  }


  if (!channelName) {

    $("profileSaveStatus").textContent =
      "Channel name is required.";

    return;
  }


  $("profileSaveStatus").textContent =
    "Saving profile...";


  try {

    let photoURL =
      currentProfile?.photoURL ||
      user.photoURL ||
      "";


    const file =
      $("profileImageFile").files[0];


    /* Upload profile photo */

    if (file) {

      const formData = new FormData();

      formData.append("file", file);

      formData.append(
        "upload_preset",
        "minituber"
      );


      const response = await fetch(
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
          "Image upload failed"
        );
      }


      photoURL =
        data.secure_url;
    }


    const {
      updateProfile,
      db,
      doc,
      setDoc
    } = window.firebaseFunctions;


    await updateProfile(user, {

      displayName: channelName,

      photoURL: photoURL || null

    });


    const newProfile = {

      username,
      channelName,
      bio,
      link,
      photoURL

    };


    await setDoc(
      doc(db, "profiles", user.uid),
      newProfile,
      { merge: true }
    );


    currentProfile =
      newProfile;


    updateProfileUI();


    $("profileSaveStatus").textContent =
      "Profile saved successfully! 🎉";


    setTimeout(() => {

      closeEditProfile();

    }, 900);


  } catch (error) {

    console.error(error);

    $("profileSaveStatus").textContent =
      "Profile update failed: " +
      error.message;
  }
}


function openEditProfile() {

  const profile =
    currentProfile || defaultProfile();


  $("editUsername").value =
    profile.username || "";

  $("editChannelName").value =
    profile.channelName || "";

  $("editBio").value =
    profile.bio || "";

  $("editLink").value =
    profile.link || "";


  $("editProfilePreview").src =
    profile.photoURL ||
    "https://ui-avatars.com/api/?name=User";


  $("profileImageFile").value = "";

  $("profileSaveStatus").textContent = "";

  $("editProfileModal").classList.add("show");
}


function closeEditProfile() {

  $("editProfileModal")
    .classList.remove("show");
}


/* =========================================================
   STORAGE
========================================================= */

function saveVideos() {

  localStorage.setItem(
    "minitubeVideos",
    JSON.stringify(videos)
  );
}


function saveLikes() {

  localStorage.setItem(
    "minitubeLikes",
    JSON.stringify(likedVideos)
  );
}


function saveComments() {

  localStorage.setItem(
    "minitubeComments",
    JSON.stringify(comments)
  );
}


/* =========================================================
   OLD VIDEO MIGRATION
========================================================= */

function migrateOldVideos() {

  const user = currentUser();

  if (!user) return;

  let changed = false;


  videos.forEach(video => {

    if (!video.ownerId && isVideoOwner(video)) {

      video.ownerId = user.uid;

      changed = true;
    }

  });


  if (changed) {

    saveVideos();

    renderVideos();
  }
}


/* =========================================================
   DEMO CLEANUP
========================================================= */

function prepareVideos() {

  videos = videos.filter(
    video => !String(video.id).startsWith("demo")
  );

  saveVideos();
}


/* =========================================================
   FORMAT
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


  return number.toString();
}


function formatDuration(seconds) {

  seconds = Number(seconds) || 0;

  const mins =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

  return `${mins}:${secs}`;
}


/* =========================================================
   PAGES
========================================================= */

function hideAllPages() {

  $("homePage").style.display = "none";

  $("videoPage").style.display = "none";

  $("channelPage").style.display = "none";

  $("uploadPage").style.display = "none";
}


function showHome() {

  hideAllPages();

  $("homePage").style.display = "block";

  renderVideos();
}


function showVideoPage() {

  hideAllPages();

  $("videoPage").style.display = "block";
}


function showChannelPage() {

  hideAllPages();

  $("channelPage").style.display = "block";
}


function showUploadPage() {

  hideAllPages();

  $("uploadPage").style.display = "block";
}


/* =========================================================
   VIDEO OWNER CHECK
========================================================= */

function isVideoOwner(video) {

  const user = currentUser();

  if (!user || !video) return false;


  /* New secure owner ID */

  if (video.ownerId) {

    return video.ownerId === user.uid;
  }


  /* Old videos fallback */

  const profile =
    currentProfile || defaultProfile();

  const channelName =
    profile.channelName ||
    user.displayName ||
    "";


  return (
    video.creator &&
    video.creator === channelName
  );
}


/* =========================================================
   VIDEO MENU
========================================================= */

function closeAllVideoMenus() {

  document
    .querySelectorAll(".video-menu.show")
    .forEach(menu => {

      menu.classList.remove("show");

    });
}


function toggleVideoMenu(event, videoId) {

  event.stopPropagation();

  const menu =
    document.querySelector(
      `.video-menu[data-video-id="${videoId}"]`
    );


  if (!menu) return;


  const wasOpen =
    menu.classList.contains("show");


  closeAllVideoMenus();


  if (!wasOpen) {

    menu.classList.add("show");
  }
}


function handleVideoMenuAction(
  event,
  action,
  videoId
) {

  event.stopPropagation();

  closeAllVideoMenus();

  const video =
    videos.find(v =>
      String(v.id) === String(videoId)
    );


  if (!video) return;


  if (action === "edit") {

    if (!isVideoOwner(video)) {

      alert(
        "You can only edit your own videos."
      );

      return;
    }

    openEditVideo(video);

  }


  else if (action === "delete") {

    if (!isVideoOwner(video)) {

      alert(
        "You can only delete your own videos."
      );

      return;
    }

    deleteVideo(video);

  }


  else if (action === "report") {

    reportVideo(video);

  }
}


/* =========================================================
   RENDER VIDEOS
========================================================= */

function renderVideos(list = videos) {

  const grid =
    $("videoGrid");

  if (!grid) return;


  grid.innerHTML = "";


  if (!list.length) {

    grid.innerHTML = `
      <div class="empty-message">
        No videos found.
      </div>
    `;

    return;
  }


  list.forEach(video => {

    const card =
      document.createElement("div");

    card.className =
      "video-card";


    /* Thumbnail */

    const thumbnail =
      document.createElement("div");

    thumbnail.className =
      "thumbnail-wrapper";


    const videoElement =
      document.createElement("video");

    videoElement.src =
      video.url;

    videoElement.muted = true;

    videoElement.preload = "metadata";

    videoElement.playsInline = true;


    thumbnail.appendChild(
      videoElement
    );


    /* 3 DOT */

    const moreButton =
      document.createElement("button");

    moreButton.className =
      "video-more-button";

    moreButton.textContent =
      "⋮";

    moreButton.title =
      "More options";


    moreButton.addEventListener(
      "click",
      event => {

        toggleVideoMenu(
          event,
          video.id
        );

      }
    );


    thumbnail.appendChild(
      moreButton
    );


    /* MENU */

    const menu =
      document.createElement("div");

    menu.className =
      "video-menu";

    menu.dataset.videoId =
      video.id;


    if (isVideoOwner(video)) {

      menu.innerHTML = `
        <button
          data-action="edit"
          data-video-id="${video.id}">
          ✏️ Edit Video
        </button>

        <button
          class="danger"
          data-action="delete"
          data-video-id="${video.id}">
          🗑️ Delete Video
        </button>

        <button
          data-action="report"
          data-video-id="${video.id}">
          🚩 Report Video
        </button>
      `;

    } else {

      menu.innerHTML = `
        <button
          data-action="report"
          data-video-id="${video.id}">
          🚩 Report Video
        </button>
      `;
    }


    menu
      .querySelectorAll("button")
      .forEach(button => {

        button.addEventListener(
          "click",
          event => {

            handleVideoMenuAction(
              event,
              button.dataset.action,
              button.dataset.videoId
            );

          }
        );

      });


    thumbnail.appendChild(menu);


    /* INFO */

    const info =
      document.createElement("div");

    info.className =
      "video-info";


    const avatar =
      document.createElement("img");

    avatar.className =
      "video-avatar";

    avatar.src =
      video.creatorPhoto ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        video.creator || "User"
      )}`;


    const text =
      document.createElement("div");

    text.className =
      "video-text";


    const title =
      document.createElement("div");

    title.className =
      "video-title";

    title.textContent =
      video.title || "Untitled";


    const creator =
      document.createElement("div");

    creator.className =
      "video-creator";

    creator.textContent =
      video.creator || "MiniTube User";


    const meta =
      document.createElement("div");

    meta.className =
      "video-meta";

    meta.textContent =
      `${formatViews(video.views)} views • ${video.category || "Other"}`;


    text.appendChild(title);

    text.appendChild(creator);

    text.appendChild(meta);


    info.appendChild(avatar);

    info.appendChild(text);


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
   OPEN VIDEO
========================================================= */

function openVideo(video) {

  currentVideo =
    video;


  showVideoPage();


  $("videoPageTitle").textContent =
    video.title || "Untitled";


  $("videoPageMeta").textContent =
    `${formatViews(video.views)} views • ${
      video.category || "Other"
    }`;


  $("videoDescription").textContent =
    video.description || "No description.";


  $("creatorName").textContent =
    video.creator || "MiniTube User";


  $("creatorUsername").textContent =
    video.creatorUsername
      ? "@" + video.creatorUsername
      : "";


  $("creatorPhoto").src =
    video.creatorPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      video.creator || "User"
    )}`;


  const player =
    $("mainVideo");

  player.src =
    video.url;

  player.load();


  $("downloadButton").href =
    video.url;


  $("likeCount").textContent =
    formatViews(video.likes || 0);


  updateLikeButton();

  loadComments();


  /* Count view */

  video.views =
    (Number(video.views) || 0) + 1;

  saveVideos();

}


/* =========================================================
   VIDEO PAGE 3-DOT MENU
========================================================= */

function createVideoPageMenu() {

  const actions =
    document.querySelector(".video-actions");

  if (!actions) return;


  let button =
    $("videoPageMoreButton");


  if (!button) {

    button =
      document.createElement("button");

    button.id =
      "videoPageMoreButton";

    button.className =
      "video-more-page-button";

    button.textContent =
      "⋮ More";


    actions.appendChild(button);


    button.addEventListener(
      "click",
      event => {

        if (!currentVideo) return;

        openPageVideoMenu(
          event,
          currentVideo
        );

      }
    );
  }
}


function openPageVideoMenu(
  event,
  video
) {

  event.stopPropagation();


  let menu =
    $("videoPageMenu");


  if (!menu) {

    menu =
      document.createElement("div");

    menu.id =
      "videoPageMenu";

    menu.className =
      "video-menu";

    menu.style.position =
      "fixed";

    menu.style.right =
      "25px";

    menu.style.top =
      "120px";

    document.body.appendChild(menu);
  }


  menu.innerHTML = "";


  if (isVideoOwner(video)) {

    menu.innerHTML = `

      <button id="pageEditVideo">
        ✏️ Edit Video
      </button>

      <button
        id="pageDeleteVideo"
        class="danger">
        🗑️ Delete Video
      </button>

      <button id="pageReportVideo">
        🚩 Report Video
      </button>

    `;

  } else {

    menu.innerHTML = `

      <button id="pageReportVideo">
        🚩 Report Video
      </button>

    `;
  }


  menu.classList.add("show");


  if ($("pageEditVideo")) {

    $("pageEditVideo")
      .onclick = () => {

        menu.classList.remove("show");

        openEditVideo(video);
      };
  }


  if ($("pageDeleteVideo")) {

    $("pageDeleteVideo")
      .onclick = () => {

        menu.classList.remove("show");

        deleteVideo(video);
      };
  }


  $("pageReportVideo")
    .onclick = () => {

      menu.classList.remove("show");

      reportVideo(video);
    };
}


/* =========================================================
   EDIT VIDEO MODAL
========================================================= */

function createEditVideoModal() {

  if ($("editVideoModal")) return;


  const modal =
    document.createElement("div");

  modal.id =
    "editVideoModal";

  modal.className =
    "modal";


  modal.innerHTML = `

    <div class="modal-box edit-video-box">

      <button
        class="close-modal"
        id="closeEditVideo">
        ×
      </button>

      <h2>✏️ Edit Video</h2>

      <label class="edit-video-label">
        Title
      </label>

      <input
        id="editVideoTitle"
        class="edit-video-input"
        type="text"
        placeholder="Video title"
      >

      <label class="edit-video-label">
        Description
      </label>

      <textarea
        id="editVideoDescription"
        class="edit-video-textarea"
        placeholder="Video description"
      ></textarea>

      <label class="edit-video-label">
        Category
      </label>

      <select
        id="editVideoCategory"
        class="edit-video-select">

        <option value="Gaming">Gaming</option>
        <option value="Islamic">Islamic</option>
        <option value="Education">Education</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Sports">Sports</option>
        <option value="News">News</option>
        <option value="Music">Music</option>

      </select>

      <button
        id="saveEditedVideo"
        class="edit-video-save">
        Save Changes
      </button>

      <div id="editVideoStatus"></div>

    </div>

  `;


  document.body.appendChild(modal);


  $("closeEditVideo")
    .addEventListener(
      "click",
      closeEditVideo
    );


  modal.addEventListener(
    "click",
    event => {

      if (event.target === modal) {

        closeEditVideo();

      }

    }
  );


  $("saveEditedVideo")
    .addEventListener(
      "click",
      saveEditedVideo
    );
}


let editingVideoId = null;


function openEditVideo(video) {

  if (!isVideoOwner(video)) {

    alert(
      "You can only edit your own videos."
    );

    return;
  }


  createEditVideoModal();


  editingVideoId =
    video.id;


  $("editVideoTitle").value =
    video.title || "";


  $("editVideoDescription").value =
    video.description || "";


  $("editVideoCategory").value =
    video.category || "Gaming";


  $("editVideoStatus").textContent =
    "";


  $("editVideoModal")
    .classList.add("show");
}


function closeEditVideo() {

  const modal =
    $("editVideoModal");

  if (modal) {

    modal.classList.remove("show");
  }

  editingVideoId = null;
}


function saveEditedVideo() {

  if (!editingVideoId) return;


  const video =
    videos.find(v =>
      String(v.id) ===
      String(editingVideoId)
    );


  if (!video) return;


  if (!isVideoOwner(video)) {

    alert(
      "You can only edit your own videos."
    );

    closeEditVideo();

    return;
  }


  const title =
    $("editVideoTitle").value.trim();

  const description =
    $("editVideoDescription").value.trim();

  const category =
    $("editVideoCategory").value;


  if (!title) {

    $("editVideoStatus").textContent =
      "Title is required.";

    return;
  }


  video.title =
    title;

  video.description =
    description;

  video.category =
    category;


  saveVideos();


  renderVideos();


  if (
    currentVideo &&
    String(currentVideo.id) ===
    String(video.id)
  ) {

    currentVideo =
      video;

    openVideo(video);
  }


  $("editVideoStatus").textContent =
    "Video updated successfully! 🎉";


  setTimeout(
    closeEditVideo,
    700
  );
}


/* =========================================================
   DELETE VIDEO
========================================================= */

function deleteVideo(video) {

  if (!isVideoOwner(video)) {

    alert(
      "You can only delete your own videos."
    );

    return;
  }


  const confirmed =
    confirm(
      `Delete "${video.title}"?\n\nThis will remove the video from MiniTube.`
    );


  if (!confirmed) return;


  videos =
    videos.filter(v =>
      String(v.id) !==
      String(video.id)
    );


  saveVideos();


  if (
    currentVideo &&
    String(currentVideo.id) ===
    String(video.id)
  ) {

    currentVideo = null;

    $("mainVideo").pause();

    $("mainVideo").removeAttribute("src");

    showHome();

  } else {

    renderVideos();
  }


  alert(
    "Video deleted successfully. 🗑️"
  );
}


/* =========================================================
   REPORT VIDEO
========================================================= */

function createReportModal() {

  if ($("reportModal")) return;


  const modal =
    document.createElement("div");

  modal.id =
    "reportModal";

  modal.className =
    "modal";


  modal.innerHTML = `

    <div class="modal-box report-box">

      <button
        class="close-modal"
        id="closeReport">
        ×
      </button>

      <h2>🚩 Report Video</h2>

      <p>
        Tell us why you are reporting this video.
      </p>

      <br>

      <textarea
        id="reportReason"
        class="report-reason"
        placeholder="Write report reason..."
      ></textarea>

      <button
        id="submitReport"
        class="report-submit">
        Submit Report
      </button>

      <div id="reportStatus"></div>

    </div>

  `;


  document.body.appendChild(modal);


  $("closeReport")
    .addEventListener(
      "click",
      closeReport
    );


  modal.addEventListener(
    "click",
    event => {

      if (event.target === modal) {

        closeReport();

      }

    }
  );


  $("submitReport")
    .addEventListener(
      "click",
      submitReport
    );
}


let reportingVideo = null;


function reportVideo(video) {

  const user =
    currentUser();


  if (!user) {

    alert(
      "Please login to report a video."
    );

    $("loginModal")
      .classList.add("show");

    return;
  }


  reportingVideo =
    video;


  createReportModal();


  $("reportReason").value = "";

  $("reportStatus").textContent = "";


  $("reportModal")
    .classList.add("show");
}


function closeReport() {

  const modal =
    $("reportModal");

  if (modal) {

    modal.classList.remove("show");
  }

  reportingVideo = null;
}


async function submitReport() {

  const user =
    currentUser();


  if (!user) {

    $("reportStatus").textContent =
      "Please login first.";

    return;
  }


  if (!reportingVideo) return;


  const reason =
    $("reportReason")
      .value
      .trim();


  if (!reason) {

    $("reportStatus").textContent =
      "Please write a reason.";

    return;
  }


  $("reportStatus").textContent =
    "Sending report...";


  try {

    const {
      db,
      collection,
      addDoc,
      serverTimestamp
    } = window.firebaseFunctions;


    await addDoc(
      collection(db, "reports"),
      {

        videoId:
          String(reportingVideo.id),

        videoTitle:
          reportingVideo.title || "",

        videoUrl:
          reportingVideo.url || "",

        reason,

        reporterUid:
          user.uid,

        reporterEmail:
          user.email || "",

        createdAt:
          serverTimestamp()

      }
    );


    $("reportStatus").textContent =
      "Report submitted successfully. 🚩";


    setTimeout(
      closeReport,
      900
    );


  } catch (error) {

    console.error(error);

    $("reportStatus").textContent =
      "Report failed: " +
      error.message;
  }
}


/* =========================================================
   SEARCH
========================================================= */

function searchVideos() {

  const query =
    $("searchInput")
      .value
      .trim()
      .toLowerCase();


  let filtered =
    videos;


  if (currentCategory !== "All") {

    filtered =
      filtered.filter(video =>
        String(video.category)
          .toLowerCase() ===
        currentCategory.toLowerCase()
      );
  }


  if (query) {

    filtered =
      filtered.filter(video =>

        String(video.title || "")
          .toLowerCase()
          .includes(query)

        ||

        String(video.creator || "")
          .toLowerCase()
          .includes(query)

        ||

        String(video.description || "")
          .toLowerCase()
          .includes(query)

      );
  }


  renderVideos(filtered);
}


/* =========================================================
   CATEGORY
========================================================= */

function filterCategory(category) {

  currentCategory =
    category;


  document
    .querySelectorAll(".category-btn")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category ===
        category
      );

    });


  searchVideos();
}


/* =========================================================
   LOGIN / SIGNUP
========================================================= */

function openLogin() {

  $("loginModal")
    .classList.add("show");
}


function closeLogin() {

  $("loginModal")
    .classList.remove("show");
}


function openSignup() {

  $("signupModal")
    .classList.add("show");
}


function closeSignup() {

  $("signupModal")
    .classList.remove("show");
}


/* =========================================================
   EMAIL SIGNUP
========================================================= */

async function signupWithEmail() {

  const name =
    $("signupName").value.trim();

  const email =
    $("signupEmail").value.trim();

  const password =
    $("signupPassword").value;


  if (!name || !email || !password) {

    $("signupStatus").textContent =
      "Please fill all fields.";

    return;
  }


  $("signupStatus").textContent =
    "Creating account...";


  try {

    const {
      auth,
      createUserWithEmailAndPassword,
      updateProfile
    } = window.firebaseFunctions;


    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    await updateProfile(
      result.user,
      {
        displayName: name
      }
    );


    $("signupStatus").textContent =
      "Account successfully created! 🎉";


    $("signupName").value = "";

    $("signupEmail").value = "";

    $("signupPassword").value = "";


    setTimeout(
      closeSignup,
      800
    );


  } catch (error) {

    console.error(error);

    $("signupStatus").textContent =
      error.message;
  }
}


/* =========================================================
   EMAIL LOGIN
========================================================= */

async function loginWithEmail() {

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;


  if (!email || !password) {

    $("loginStatus").textContent =
      "Please enter email and password.";

    return;
  }


  $("loginStatus").textContent =
    "Logging in...";


  try {

    const {
      auth,
      signInWithEmailAndPassword
    } = window.firebaseFunctions;


    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


    $("loginStatus").textContent =
      "Login successful! 👋";


    $("loginEmail").value = "";

    $("loginPassword").value = "";


    setTimeout(
      closeLogin,
      700
    );


  } catch (error) {

    console.error(error);

    $("loginStatus").textContent =
      error.message;
  }
}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

async function googleLogin() {

  try {

    const {
      auth,
      googleProvider,
      signInWithPopup
    } = window.firebaseFunctions;


    await signInWithPopup(
      auth,
      googleProvider
    );


    closeLogin();

    closeSignup();


  } catch (error) {

    console.error(error);

    $("loginStatus").textContent =
      error.message;
  }
}


/* =========================================================
   PROFILE MENU
========================================================= */

function toggleProfileMenu() {

  $("profileMenu")
    .classList.toggle("show");
}


function closeProfileMenu() {

  $("profileMenu")
    .classList.remove("show");
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    const {
      auth,
      signOut
    } = window.firebaseFunctions;


    await signOut(auth);

    closeProfileMenu();

    showHome();


  } catch (error) {

    console.error(error);

    alert(
      "Logout failed: " +
      error.message
    );
  }
}


/* =========================================================
   CHANNEL
========================================================= */

async function openMyChannel() {

  const user =
    currentUser();


  if (!user) {

    openLogin();

    return;
  }


  await loadUserProfile();


  showChannelPage();


  updateProfileUI();


  const myVideos =
    videos.filter(video =>
      isVideoOwner(video)
    );


  const grid =
    $("channelVideoGrid");


  grid.innerHTML = "";


  if (!myVideos.length) {

    grid.innerHTML = `
      <div class="empty-message">
        You haven't uploaded any videos yet.
      </div>
    `;

    return;
  }


  renderChannelVideos(myVideos);
}


function renderChannelVideos(list) {

  const grid =
    $("channelVideoGrid");


  grid.innerHTML = "";


  list.forEach(video => {

    const card =
      document.createElement("div");

    card.className =
      "video-card";


    const thumbnail =
      document.createElement("div");

    thumbnail.className =
      "thumbnail-wrapper";


    const player =
      document.createElement("video");

    player.src =
      video.url;

    player.muted = true;

    player.preload = "metadata";

    player.playsInline = true;


    thumbnail.appendChild(player);


    const more =
      document.createElement("button");

    more.className =
      "video-more-button";

    more.textContent =
      "⋮";


    more.onclick =
      event =>
        toggleVideoMenu(
          event,
          video.id
        );


    thumbnail.appendChild(more);


    const menu =
      document.createElement("div");

    menu.className =
      "video-menu";

    menu.dataset.videoId =
      video.id;


    menu.innerHTML = `

      <button
        data-action="edit"
        data-video-id="${video.id}">
        ✏️ Edit Video
      </button>

      <button
        class="danger"
        data-action="delete"
        data-video-id="${video.id}">
        🗑️ Delete Video
      </button>

      <button
        data-action="report"
        data-video-id="${video.id}">
        🚩 Report Video
      </button>

    `;


    menu
      .querySelectorAll("button")
      .forEach(button => {

        button.onclick =
          event =>
            handleVideoMenuAction(
              event,
              button.dataset.action,
              button.dataset.videoId
            );

      });


    thumbnail.appendChild(menu);


    const info =
      document.createElement("div");

    info.className =
      "video-info";


    const avatar =
      document.createElement("img");

    avatar.className =
      "video-avatar";

    avatar.src =
      video.creatorPhoto ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        video.creator || "User"
      )}`;


    const text =
      document.createElement("div");

    text.className =
      "video-text";


    text.innerHTML = `
      <div class="video-title"></div>
      <div class="video-creator"></div>
      <div class="video-meta"></div>
    `;


    text.querySelector(
      ".video-title"
    ).textContent =
      video.title || "Untitled";


    text.querySelector(
      ".video-creator"
    ).textContent =
      video.creator || "MiniTube User";


    text.querySelector(
      ".video-meta"
    ).textContent =
      `${formatViews(video.views)} views • ${
        video.category || "Other"
      }`;


    info.appendChild(avatar);

    info.appendChild(text);


    card.appendChild(thumbnail);

    card.appendChild(info);


    card.onclick =
      () => openVideo(video);


    grid.appendChild(card);

  });
}


/* =========================================================
   UPLOAD
========================================================= */

function openUploadPage() {

  const user =
    currentUser();


  if (!user) {

    openLogin();

    return;
  }


  closeProfileMenu();

  showUploadPage();


  $("uploadStatus").textContent = "";
}


function clearUploadForm() {

  $("videoFile").value = "";

  $("videoTitle").value = "";

  $("videoDescriptionInput").value = "";

  $("videoCategory").value =
    "Gaming";

  $("uploadStatus").textContent =
    "";
}


async function uploadVideo() {

  const user =
    currentUser();


  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }


  const file =
    $("videoFile").files[0];

  const title =
    $("videoTitle").value.trim();

  const description =
    $("videoDescriptionInput")
      .value
      .trim();

  const category =
    $("videoCategory").value;


  if (!file) {

    $("uploadStatus").textContent =
      "Please select a video.";

    return;
  }


  if (!title) {

    $("uploadStatus").textContent =
      "Please enter video title.";

    return;
  }


  $("uploadStatus").textContent =
    "Uploading video... Please wait ⏳";


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
        "Upload failed"
      );
    }


    await loadUserProfile();


    const profile =
      currentProfile ||
      defaultProfile();


    const newVideo = {

      id:
        Date.now().toString(),

      ownerId:
        user.uid,

      title,

      creator:
        profile.channelName ||
        user.displayName ||
        "MiniTube User",

      creatorUsername:
        profile.username ||
        "username",

      creatorPhoto:
        profile.photoURL ||
        user.photoURL ||
        "",

      description,

      category,

      url:
        data.secure_url,

      views: 0,

      likes: 0

    };


    videos.unshift(
      newVideo
    );


    saveVideos();


    $("uploadStatus").textContent =
      "Video successfully uploaded! 🎉";


    clearUploadForm();


    setTimeout(
      showHome,
      1000
    );


  } catch (error) {

    console.error(error);

    $("uploadStatus").textContent =
      "Upload failed: " +
      error.message;
  }
}


/* =========================================================
   LIKE
========================================================= */

function updateLikeButton() {

  if (!currentVideo) return;


  const user =
    currentUser();


  const liked =
    likedVideos[currentVideo.id];


  $("likeButton").textContent =
    liked
      ? `❤️ Liked ${formatViews(currentVideo.likes || 0)}`
      : `👍 Like ${formatViews(currentVideo.likes || 0)}`;
}


function likeCurrentVideo() {

  if (!currentVideo) return;


  const id =
    currentVideo.id;


  if (likedVideos[id]) {

    likedVideos[id] =
      false;

    currentVideo.likes =
      Math.max(
        0,
        (Number(currentVideo.likes) || 0) - 1
      );

  } else {

    likedVideos[id] =
      true;

    currentVideo.likes =
      (Number(currentVideo.likes) || 0) + 1;
  }


  const index =
    videos.findIndex(
      video =>
        String(video.id) ===
        String(id)
    );


  if (index !== -1) {

    videos[index].likes =
      currentVideo.likes;
  }


  saveVideos();

  saveLikes();

  updateLikeButton();
}


/* =========================================================
   SHARE
========================================================= */

async function shareCurrentVideo() {

  if (!currentVideo) return;


  const url =
    currentVideo.url;


  try {

    if (
      navigator.share
    ) {

      await navigator.share({

        title:
          currentVideo.title,

        text:
          "Watch this video on MiniTube",

        url

      });

    } else {

      await navigator.clipboard.writeText(
        url
      );

      alert(
        "Video link copied! 🔗"
      );
    }

  } catch (error) {

    console.log(error);
  }
}


/* =========================================================
   COMMENTS
========================================================= */

function loadComments() {

  const list =
    $("commentsList");


  list.innerHTML = "";


  if (!currentVideo) return;


  const videoComments =
    comments[currentVideo.id] ||
    [];


  if (!videoComments.length) {

    list.innerHTML = `
      <p style="color:#777;">
        No comments yet.
      </p>
    `;

    return;
  }


  videoComments
    .slice()
    .reverse()
    .forEach(comment => {

      const item =
        document.createElement("div");

      item.className =
        "comment";


      const img =
        document.createElement("img");

      img.src =
        comment.photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          comment.name || "User"
        )}`;


      const content =
        document.createElement("div");


      const name =
        document.createElement("div");

      name.className =
        "comment-name";

      name.textContent =
        comment.name ||
        "User";


      const text =
        document.createElement("div");

      text.className =
        "comment-text";

      text.textContent =
        comment.text;


      content.appendChild(name);

      content.appendChild(text);


      item.appendChild(img);

      item.appendChild(content);


      list.appendChild(item);

    });
}


function addComment() {

  const user =
    currentUser();


  if (!user) {

    alert(
      "Please login to comment."
    );

    openLogin();

    return;
  }


  if (!currentVideo) return;


  const input =
    $("commentInput");


  const text =
    input.value.trim();


  if (!text) return;


  if (!comments[currentVideo.id]) {

    comments[currentVideo.id] =
      [];
  }


  const profile =
    currentProfile ||
    defaultProfile();


  comments[currentVideo.id]
    .push({

      name:
        profile.channelName ||
        user.displayName ||
        "User",

      text,

      photo:
        profile.photoURL ||
        user.photoURL ||
        ""

    });


  saveComments();


  input.value = "";

  loadComments();
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

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


$("closeLogin")
  .addEventListener(
    "click",
    closeLogin
  );


$("closeSignup")
  .addEventListener(
    "click",
    closeSignup
  );


$("emailLoginButton")
  .addEventListener(
    "click",
    loginWithEmail
  );


$("emailSignupButton")
  .addEventListener(
    "click",
    signupWithEmail
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


$("profileButton")
  .addEventListener(
    "click",
    event => {

      event.stopPropagation();

      toggleProfileMenu();

    }
  );


$("editProfileButton")
  .addEventListener(
    "click",
    () => {

      closeProfileMenu();

      openEditProfile();

    }
  );


$("myChannelButton")
  .addEventListener(
    "click",
    openMyChannel
  );


$("uploadButton")
  .addEventListener(
    "click",
    openUploadPage
  );


$("logoutButton")
  .addEventListener(
    "click",
    logout
  );


$("closeEditProfile")
  .addEventListener(
    "click",
    closeEditProfile
  );


$("changePhotoButton")
  .addEventListener(
    "click",
    () => {

      $("profileImageFile")
        .click();

    }
  );


$("profileImageFile")
  .addEventListener(
    "change",
    event => {

      const file =
        event.target.files[0];


      if (!file) return;


      const reader =
        new FileReader();


      reader.onload =
        e => {

          $("editProfilePreview").src =
            e.target.result;

        };


      reader.readAsDataURL(file);
    }
  );


$("saveProfileButton")
  .addEventListener(
    "click",
    saveUserProfile
  );


$("searchButton")
  .addEventListener(
    "click",
    searchVideos
  );


$("searchInput")
  .addEventListener(
    "input",
    searchVideos
  );


$("searchInput")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        searchVideos();

      }

    }
  );


document
  .querySelectorAll(".category-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () =>
        filterCategory(
          button.dataset.category
        )
    );

  });


$("backHomeButton")
  .addEventListener(
    "click",
    showHome
  );


$("channelBackButton")
  .addEventListener(
    "click",
    showHome
  );


$("uploadBackButton")
  .addEventListener(
    "click",
    showHome
  );


$("likeButton")
  .addEventListener(
    "click",
    likeCurrentVideo
  );


$("shareButton")
  .addEventListener(
    "click",
    shareCurrentVideo
  );


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
        event.key === "Enter"
      ) {

        addComment();

      }

    }
  );


$("uploadVideoButton")
  .addEventListener(
    "click",
    uploadVideo
  );


/* Close menus when clicking elsewhere */

document.addEventListener(
  "click",
  () => {

    closeAllVideoMenus();

    closeProfileMenu();

  }
);


/* Prevent profile menu from closing itself */

$("profileMenu")
  .addEventListener(
    "click",
    event =>
      event.stopPropagation()
  );


/* Modal background */

$("loginModal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("loginModal")
      ) {

        closeLogin();

      }

    }
  );


$("signupModal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("signupModal")
      ) {

        closeSignup();

      }

    }
  );


$("editProfileModal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("editProfileModal")
      ) {

        closeEditProfile();

      }

    }
  );


/* =========================================================
   FIREBASE AUTH STATE
========================================================= */

function startFirebaseAuth() {

  if (!firebaseReady()) {

    setTimeout(
      startFirebaseAuth,
      100
    );

    return;
  }


  const {
    auth,
    onAuthStateChanged
  } = window.firebaseFunctions;


  onAuthStateChanged(
    auth,
    async user => {

      window.currentUser =
        user || null;


      if (user) {

        $("authButtons")
          .style.display = "none";

        $("profileArea")
          .style.display = "block";


        await loadUserProfile();

      } else {

        $("authButtons")
          .style.display = "flex";

        $("profileArea")
          .style.display = "none";


        currentProfile = null;
      }


      renderVideos();

    }
  );
}


/* =========================================================
   START
========================================================= */

prepareVideos();

renderVideos();

showHome();

createVideoPageMenu();

startFirebaseAuth();
