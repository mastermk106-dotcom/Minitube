/* =========================================================
   MINITUBE - COMPLETE FIXED SCRIPT
   VIDEO + FIREBASE + PROFILE + CHANNEL + UPLOAD
   3-DOT + AUTH + SEARCH + COMMENTS + LIKES
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
let currentUser = null;

let appStarted = false;
let firebaseVideosLoaded = false;
let firebaseLoading = null;


/* =========================================================
   FIREBASE
========================================================= */

function firebaseReady() {
  return !!window.firebaseFunctions;
}

function getFirebase() {
  return window.firebaseFunctions || null;
}


/* =========================================================
   LOCAL STORAGE
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
   PROFILE
========================================================= */

function defaultProfile() {
  const user = currentUser;

  return {
    uid: user?.uid || "",
    email: user?.email || "",

    username:
      user?.displayName
        ?.replace(/\s+/g, "")
        .toLowerCase() ||
      "user",

    channelName:
      user?.displayName ||
      "MiniTube User",

    bio: "",
    link: "",

    photo:
      user?.photoURL ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.displayName || "User"
      )}&background=random`
  };
}


async function loadUserProfile() {
  if (!currentUser || !firebaseReady()) {
    currentProfile = defaultProfile();
    updateProfileUI();
    return;
  }

  const fb = getFirebase();

  try {
    const profileRef = fb.doc(
      fb.db,
      "profiles",
      currentUser.uid
    );

    const snap = await fb.getDoc(profileRef);

    if (snap.exists()) {
      currentProfile = {
        ...defaultProfile(),
        ...snap.data()
      };
    } else {
      currentProfile = defaultProfile();

      await fb.setDoc(
        profileRef,
        currentProfile
      );
    }

    updateProfileUI();

  } catch (error) {
    console.error(
      "Profile load error:",
      error
    );

    currentProfile = defaultProfile();
    updateProfileUI();
  }
}


function updateProfileUI() {
  if (!currentProfile) return;

  const photo =
    currentProfile.photo ||
    defaultProfile().photo;

  if ($("headerProfilePhoto")) {
    $("headerProfilePhoto").src = photo;
  }

  if ($("channelPhoto")) {
    $("channelPhoto").src = photo;
  }

  if ($("editProfilePreview")) {
    $("editProfilePreview").src = photo;
  }
}


function normalizeLink(link) {
  if (!link) return "";

  link = link.trim();

  if (
    link.startsWith("http://") ||
    link.startsWith("https://")
  ) {
    return link;
  }

  return "https://" + link;
}


/* =========================================================
   SAVE PROFILE
========================================================= */

async function saveUserProfile() {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  const username =
    $("editUsername")?.value.trim() ||
    currentProfile?.username ||
    "user";

  const channelName =
    $("editChannelName")?.value.trim() ||
    currentProfile?.channelName ||
    "MiniTube User";

  const bio =
    $("editBio")?.value.trim() || "";

  const link =
    $("editLink")?.value.trim() || "";

  const status =
    $("profileSaveStatus");

  if (!channelName) {
    if (status) {
      status.textContent =
        "Channel name is required.";
    }
    return;
  }

  if (status) {
    status.textContent = "Saving...";
  }

  let photo =
    currentProfile?.photo ||
    defaultProfile().photo;

  const imageFile =
    $("profileImageFile")?.files?.[0];

  if (imageFile) {
    try {
      const formData = new FormData();

      formData.append(
        "file",
        imageFile
      );

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

      const result =
        await response.json();

      if (!result.secure_url) {
        throw new Error(
          result.error?.message ||
          "Image upload failed."
        );
      }

      photo =
        result.secure_url;

    } catch (error) {
      console.error(error);

      if (status) {
        status.textContent =
          "Profile image upload failed.";
      }

      return;
    }
  }

  currentProfile = {
    ...currentProfile,
    uid: currentUser.uid,
    email: currentUser.email || "",
    username,
    channelName,
    bio,
    link,
    photo
  };

  try {
    if (firebaseReady()) {
      const fb = getFirebase();

      await fb.setDoc(
        fb.doc(
          fb.db,
          "profiles",
          currentUser.uid
        ),
        currentProfile,
        {
          merge: true
        }
      );

      if (
        fb.updateProfile &&
        fb.auth?.currentUser
      ) {
        try {
          await fb.updateProfile(
            fb.auth.currentUser,
            {
              displayName: channelName,
              photoURL: photo
            }
          );
        } catch (profileError) {
          console.log(
            "Firebase auth profile update skipped:",
            profileError.message
          );
        }
      }
    }

    videos = videos.map(video => {
      if (
        video.ownerId ===
        currentUser.uid
      ) {
        return {
          ...video,
          creator: channelName,
          creatorUsername: username,
          creatorPhoto: photo
        };
      }

      return video;
    });

    saveVideos();

    updateProfileUI();

    if (status) {
      status.textContent =
        "Profile saved successfully! ✅";
    }

    renderVideos(
      filterByCategory(videos)
    );

    setTimeout(() => {
      closeEditProfile();
    }, 700);

  } catch (error) {
    console.error(error);

    if (status) {
      status.textContent =
        "Could not save profile.";
    }
  }
}


/* =========================================================
   EDIT PROFILE
========================================================= */

function openEditProfile() {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  closeProfileMenu();

  if (!currentProfile) {
    currentProfile =
      defaultProfile();
  }

  if ($("editUsername")) {
    $("editUsername").value =
      currentProfile.username || "";
  }

  if ($("editChannelName")) {
    $("editChannelName").value =
      currentProfile.channelName || "";
  }

  if ($("editBio")) {
    $("editBio").value =
      currentProfile.bio || "";
  }

  if ($("editLink")) {
    $("editLink").value =
      currentProfile.link || "";
  }

  if ($("editProfilePreview")) {
    $("editProfilePreview").src =
      currentProfile.photo ||
      defaultProfile().photo;
  }

  if ($("profileImageFile")) {
    $("profileImageFile").value = "";
  }

  if ($("profileSaveStatus")) {
    $("profileSaveStatus").textContent = "";
  }

  $("editProfileModal")
    ?.classList.add("show");
}


function closeEditProfile() {
  $("editProfileModal")
    ?.classList.remove("show");
}


/* =========================================================
   PAGE SYSTEM
========================================================= */

function hideAllPages() {
  [
    "homePage",
    "videoPage",
    "channelPage",
    "uploadPage"
  ].forEach(id => {
    const page = $(id);

    if (page) {
      page.style.display = "none";
    }
  });
}


function showHome() {
  hideAllPages();

  closeAllVideoMenus();
  closePageMenu();

  if ($("homePage")) {
    $("homePage").style.display =
      "block";
  }

  renderVideos(
    filterByCategory(videos)
  );
}


function showVideoPage() {
  hideAllPages();

  closeAllVideoMenus();

  if ($("videoPage")) {
    $("videoPage").style.display =
      "block";
  }
}


function showChannelPage() {
  hideAllPages();

  closeAllVideoMenus();

  if ($("channelPage")) {
    $("channelPage").style.display =
      "block";
  }
}


function showUploadPage() {
  hideAllPages();

  closeAllVideoMenus();

  if ($("uploadPage")) {
    $("uploadPage").style.display =
      "block";
  }

  if ($("uploadStatus")) {
    $("uploadStatus").textContent = "";
  }
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
  if (!seconds || isNaN(seconds)) {
    return "";
  }

  seconds = Math.floor(seconds);

  const mins =
    Math.floor(seconds / 60);

  const secs =
    seconds % 60;

  return (
    mins +
    ":" +
    String(secs).padStart(2, "0")
  );
}


/* =========================================================
   VIDEO HELPERS
========================================================= */

function isValidVideo(video) {
  return !!(
    video &&
    typeof video.url === "string" &&
    video.url.trim()
  );
}


function findVideo(id) {
  return videos.find(
    video =>
      String(video.id) ===
      String(id)
  );
}


function isVideoOwner(video) {
  if (!currentUser || !video) {
    return false;
  }

  if (
    video.ownerId &&
    video.ownerId ===
      currentUser.uid
  ) {
    return true;
  }

  if (
    currentProfile &&
    video.creator &&
    video.creator ===
      currentProfile.channelName
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   VIDEO MENUS - FIXED
========================================================= */

function closeAllVideoMenus() {
  document
    .querySelectorAll(".video-menu.show")
    .forEach(menu => {
      menu.classList.remove("show");
    });

  /*
    Safety:
    Remove old inline display values
    from card menus only.
  */

  document
    .querySelectorAll(
      ".thumbnail-wrapper .video-menu"
    )
    .forEach(menu => {
      menu.style.removeProperty("display");
    });
}


function toggleVideoMenu(event, id) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const menu =
    $("video-menu-" + id);

  if (!menu) return;

  const wasOpen =
    menu.classList.contains("show");

  closeAllVideoMenus();

  if (!wasOpen) {
    menu.classList.add("show");
  }
}


function videoMenuAction(
  event,
  action,
  id
) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  closeAllVideoMenus();

  const video =
    findVideo(id);

  if (!video) {
    alert("Video not found.");
    return;
  }

  if (action === "edit") {
    if (!isVideoOwner(video)) {
      alert(
        "You can only edit your own videos."
      );
      return;
    }

    openEditVideo(video);
  }

  if (action === "delete") {
    if (!isVideoOwner(video)) {
      alert(
        "You can only delete your own videos."
      );
      return;
    }

    deleteVideo(video);
  }

  if (action === "report") {
    openReport(video);
  }
}


/* =========================================================
   RENDER VIDEOS
========================================================= */

function renderVideos(list = videos) {
  const grid =
    $("videoGrid");

  if (!grid) return;

  closeAllVideoMenus();

  grid.innerHTML = "";

  const filtered =
    Array.isArray(list)
      ? list.filter(
          video =>
            video &&
            !video.deleted &&
            isValidVideo(video)
        )
      : [];

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-message">
        <h3>No videos found</h3>
        <p>Upload a video or try another search.</p>
      </div>
    `;

    return;
  }

  filtered.forEach(video => {
    const card =
      document.createElement("div");

    card.className =
      "video-card";

    const photo =
      video.creatorPhoto ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        video.creator || "User"
      )}&background=random`;

    const owner =
      isVideoOwner(video);

    let menuButtons = "";

    if (owner) {
      menuButtons += `
        <button
          type="button"
          onclick="videoMenuAction(event,'edit','${escapeAttribute(video.id)}')"
        >
          ✏️ Edit
        </button>

        <button
          type="button"
          class="danger"
          onclick="videoMenuAction(event,'delete','${escapeAttribute(video.id)}')"
        >
          🗑️ Delete
        </button>
      `;
    }

    menuButtons += `
      <button
        type="button"
        onclick="videoMenuAction(event,'report','${escapeAttribute(video.id)}')"
      >
        🚩 Report
      </button>
    `;

    card.innerHTML = `
      <div class="thumbnail-wrapper">

        <video
          src="${escapeHtml(video.url)}"
          preload="metadata"
          muted
          playsinline
        ></video>

        <button
          class="video-more-button"
          type="button"
          onclick="toggleVideoMenu(event,'${escapeAttribute(video.id)}')"
          aria-label="More options"
        >
          ⋮
        </button>

        <div
          class="video-menu"
          id="video-menu-${escapeAttribute(video.id)}"
        >
          ${menuButtons}
        </div>

      </div>

      <div class="video-info">

        <img
          class="video-avatar"
          src="${escapeHtml(photo)}"
          alt=""
        >

        <div class="video-text">

          <div class="video-title">
            ${escapeHtml(
              video.title ||
              "Untitled Video"
            )}
          </div>

          <div class="video-creator">
            ${escapeHtml(
              video.creator ||
              "Unknown"
            )}
          </div>

          <div class="video-meta">
            ${formatViews(video.views)} views
            •
            ${escapeHtml(
              video.category ||
              "All"
            )}
          </div>

        </div>

      </div>
    `;

    card.addEventListener(
      "click",
      event => {

        if (
          event.target.closest(
            ".video-more-button"
          ) ||
          event.target.closest(
            ".video-menu"
          )
        ) {
          return;
        }

        openVideo(video);
      }
    );

    grid.appendChild(card);
  });
}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}


/* =========================================================
   OPEN VIDEO
========================================================= */

async function openVideo(video) {

  if (!video) {
    alert("Video not found.");
    return;
  }

  if (!isValidVideo(video)) {
    alert(
      "This video does not have a valid video URL."
    );
    return;
  }

  currentVideo = video;

  /*
    Keep global currentVideo updated.
    This fixes the video-page menu.
  */

  window.currentVideo =
    currentVideo;

  closeAllVideoMenus();
  closeProfileMenu();
  closePageMenu();

  const mainVideo =
    $("mainVideo");

  if (!mainVideo) {
    alert("Video player not found.");
    return;
  }

  mainVideo.pause();
  mainVideo.removeAttribute("src");

  mainVideo.src =
    String(video.url);

  mainVideo.load();

  showVideoPage();

  if ($("videoPageTitle")) {
    $("videoPageTitle").textContent =
      video.title ||
      "Untitled Video";
  }

  if ($("videoDescription")) {
    $("videoDescription").textContent =
      video.description ||
      "No description.";
  }

  const creatorPhoto =
    video.creatorPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      video.creator || "User"
    )}&background=random`;

  if ($("creatorPhoto")) {
    $("creatorPhoto").src =
      creatorPhoto;
  }

  if ($("creatorName")) {
    $("creatorName").textContent =
      video.creator ||
      "Unknown";
  }

  if ($("creatorUsername")) {
    $("creatorUsername").textContent =
      video.creatorUsername
        ? "@" +
          video.creatorUsername
        : "";
  }

  if ($("downloadButton")) {
    $("downloadButton").href =
      video.url;
  }

  updateLikeUI(video);

  loadComments(video.id);

  /*
    VIEW COUNT
  */

  video.views =
    (Number(video.views) || 0) + 1;

  const index =
    videos.findIndex(
      v =>
        String(v.id) ===
        String(video.id)
    );

  if (index !== -1) {
    videos[index] = {
      ...videos[index],
      views: video.views
    };

    currentVideo =
      videos[index];

    window.currentVideo =
      currentVideo;
  }

  saveVideos();

  updateVideoMeta(
    currentVideo
  );

  syncVideoToFirebase(
    currentVideo,
    {
      views:
        currentVideo.views
    }
  );
}


function updateVideoMeta(video) {
  if (!video) return;

  if ($("videoPageMeta")) {
    $("videoPageMeta").textContent =
      `${formatViews(video.views)} views • ${
        video.category || "All"
      }`;
  }
}


/* =========================================================
   FIREBASE VIDEO SYNC
========================================================= */

async function syncVideoToFirebase(
  video,
  extra = {}
) {
  if (
    !firebaseReady() ||
    !video?.id
  ) {
    return;
  }

  try {
    const fb =
      getFirebase();

    await fb.updateDoc(
      fb.doc(
        fb.db,
        "videos",
        String(video.id)
      ),
      {
        ...extra
      }
    );

  } catch (error) {
    console.log(
      "Firebase video sync skipped:",
      error.message
    );
  }
}


/* =========================================================
   VIDEO PAGE 3-DOT - FIXED
========================================================= */

function createVideoPageMenu() {
  if (
    document.getElementById(
      "videoPageMenu"
    )
  ) {
    return;
  }

  const actions =
    document.querySelector(
      ".video-actions"
    );

  if (!actions) return;

  const button =
    document.createElement("button");

  button.type = "button";
  button.className =
    "video-more-page-button";

  button.id =
    "videoPageMoreButton";

  button.textContent = "⋮";

  actions.appendChild(button);

  const menu =
    document.createElement("div");

  menu.id =
    "videoPageMenu";

  menu.className =
    "video-menu";

  /*
    IMPORTANT:
    Do NOT use inline display here.
    CSS controls hidden/show state.
  */

  menu.style.position =
    "relative";

  menu.style.marginTop =
    "5px";

  menu.innerHTML = "";

  actions.appendChild(menu);

  button.addEventListener(
    "click",
    event => {
      event.preventDefault();
      event.stopPropagation();

      openPageVideoMenu();
    }
  );
}


function openPageVideoMenu() {
  const menu =
    $("videoPageMenu");

  if (!menu || !currentVideo) {
    return;
  }

  const wasOpen =
    menu.classList.contains("show");

  /*
    Close all other menus first.
  */

  closeAllVideoMenus();

  menu.classList.remove("show");

  if (wasOpen) {
    return;
  }

  const owner =
    isVideoOwner(
      currentVideo
    );

  menu.innerHTML = `
    ${
      owner
        ? `
          <button
            type="button"
            onclick="openEditVideo(window.currentVideo); closePageMenu();"
          >
            ✏️ Edit
          </button>

          <button
            type="button"
            class="danger"
            onclick="deleteVideo(window.currentVideo); closePageMenu();"
          >
            🗑️ Delete
          </button>
        `
        : ""
    }

    <button
      type="button"
      onclick="openReport(window.currentVideo); closePageMenu();"
    >
      🚩 Report
    </button>
  `;

  menu.classList.add("show");
}


function closePageMenu() {
  const menu =
    $("videoPageMenu");

  if (!menu) return;

  menu.classList.remove("show");
}


/* =========================================================
   EDIT VIDEO
========================================================= */

function openEditVideo(video) {
  if (!video) return;

  if (!isVideoOwner(video)) {
    alert(
      "You can only edit your own videos."
    );
    return;
  }

  closeAllVideoMenus();
  closePageMenu();

  let modal =
    $("editVideoModal");

  if (!modal) {
    modal =
      document.createElement("div");

    modal.id =
      "editVideoModal";

    modal.className =
      "modal";

    modal.innerHTML = `
      <div class="modal-box edit-video-box">

        <button
          class="close-modal"
          onclick="closeEditVideo()"
        >
          ×
        </button>

        <h2>Edit Video</h2>

        <label class="edit-video-label">
          Title
        </label>

        <input
          id="editVideoTitle"
          class="edit-video-input"
        >

        <label class="edit-video-label">
          Description
        </label>

        <textarea
          id="editVideoDescription"
          class="edit-video-textarea"
        ></textarea>

        <label class="edit-video-label">
          Category
        </label>

        <select
          id="editVideoCategory"
          class="edit-video-select"
        >
          <option>Gaming</option>
          <option>Islamic</option>
          <option>Education</option>
          <option>Entertainment</option>
          <option>Sports</option>
          <option>News</option>
          <option>Music</option>
        </select>

        <button
          class="edit-video-save"
          onclick="saveEditedVideo()"
        >
          Save Changes
        </button>

      </div>
    `;

    document.body.appendChild(
      modal
    );
  }

  modal.dataset.videoId =
    video.id;

  $("editVideoTitle").value =
    video.title || "";

  $("editVideoDescription").value =
    video.description || "";

  $("editVideoCategory").value =
    video.category || "Gaming";

  modal.classList.add("show");
}


function closeEditVideo() {
  $("editVideoModal")
    ?.classList.remove("show");
}


async function saveEditedVideo() {
  const modal =
    $("editVideoModal");

  const id =
    modal?.dataset.videoId;

  const video =
    findVideo(id);

  if (!video) {
    alert("Video not found.");
    return;
  }

  if (!isVideoOwner(video)) {
    alert(
      "You can only edit your own videos."
    );
    return;
  }

  video.title =
    $("editVideoTitle")
      .value.trim();

  video.description =
    $("editVideoDescription")
      .value.trim();

  video.category =
    $("editVideoCategory")
      .value;

  saveVideos();

  try {
    if (firebaseReady()) {
      const fb =
        getFirebase();

      await fb.updateDoc(
        fb.doc(
          fb.db,
          "videos",
          String(video.id)
        ),
        {
          title: video.title,
          description:
            video.description,
          category:
            video.category
        }
      );
    }
  } catch (error) {
    console.log(
      "Firebase edit sync:",
      error.message
    );
  }

  closeEditVideo();

  renderVideos(
    filterByCategory(videos)
  );

  if (
    currentVideo &&
    String(currentVideo.id) ===
      String(video.id)
  ) {
    currentVideo =
      video;

    window.currentVideo =
      currentVideo;

    updateVideoMeta(video);

    if ($("videoPageTitle")) {
      $("videoPageTitle").textContent =
        video.title;
    }

    if ($("videoDescription")) {
      $("videoDescription").textContent =
        video.description ||
        "No description.";
    }
  }
}


/* =========================================================
   DELETE VIDEO
========================================================= */

async function deleteVideo(video) {
  if (!video) return;

  if (!isVideoOwner(video)) {
    alert(
      "You can only delete your own videos."
    );
    return;
  }

  const confirmDelete =
    confirm(
      "Are you sure you want to delete this video?"
    );

  if (!confirmDelete) {
    return;
  }

  closeAllVideoMenus();
  closePageMenu();

  video.deleted = true;

  saveVideos();

  try {
    if (firebaseReady()) {
      const fb =
        getFirebase();

      await fb.updateDoc(
        fb.doc(
          fb.db,
          "videos",
          String(video.id)
        ),
        {
          deleted: true
        }
      );
    }
  } catch (error) {
    console.log(
      "Firebase delete sync:",
      error.message
    );
  }

  if (
    currentVideo &&
    String(currentVideo.id) ===
      String(video.id)
  ) {
    currentVideo = null;
    window.currentVideo = null;

    if ($("mainVideo")) {
      $("mainVideo").pause();
      $("mainVideo").removeAttribute("src");
      $("mainVideo").load();
    }

    showHome();

  } else {
    renderVideos(
      filterByCategory(videos)
    );
  }
}


/* =========================================================
   REPORT
========================================================= */

function openReport(video) {
  if (!video) return;

  closeAllVideoMenus();
  closePageMenu();

  let modal =
    $("reportModal");

  if (!modal) {
    modal =
      document.createElement("div");

    modal.id =
      "reportModal";

    modal.className =
      "modal";

    modal.innerHTML = `
      <div class="modal-box report-box">

        <button
          class="close-modal"
          onclick="closeReport()"
        >
          ×
        </button>

        <h2>Report Video</h2>

        <p style="margin-bottom:12px;">
          Why are you reporting this video?
        </p>

        <textarea
          id="reportReason"
          class="report-reason"
          placeholder="Write reason..."
        ></textarea>

        <button
          class="report-submit"
          onclick="submitReport()"
        >
          Submit Report
        </button>

      </div>
    `;

    document.body.appendChild(
      modal
    );
  }

  modal.dataset.videoId =
    video.id;

  $("reportReason").value = "";

  modal.classList.add("show");
}


function closeReport() {
  $("reportModal")
    ?.classList.remove("show");
}


async function submitReport() {
  const modal =
    $("reportModal");

  const id =
    modal?.dataset.videoId;

  const reason =
    $("reportReason")
      ?.value.trim();

  if (!reason) {
    alert(
      "Please write a reason."
    );
    return;
  }

  const video =
    findVideo(id);

  if (!video) {
    alert("Video not found.");
    return;
  }

  try {
    if (firebaseReady()) {
      const fb =
        getFirebase();

      await fb.addDoc(
        fb.collection(
          fb.db,
          "reports"
        ),
        {
          videoId:
            String(video.id),

          videoTitle:
            video.title || "",

          reason,

          reporterId:
            currentUser?.uid ||
            "guest",

          createdAt:
            fb.serverTimestamp()
        }
      );
    }

    alert(
      "Report submitted successfully. ✅"
    );

    closeReport();

  } catch (error) {
    console.error(error);

    alert(
      "Could not submit report."
    );
  }
}


/* =========================================================
   SEARCH
========================================================= */

function searchVideos() {
  const query =
    $("searchInput")
      ?.value.trim()
      .toLowerCase() || "";

  if (!query) {
    renderVideos(
      filterByCategory(videos)
    );
    return;
  }

  const result =
    videos.filter(video => {

      if (
        video.deleted ||
        !isValidVideo(video)
      ) {
        return false;
      }

      const text = [
        video.title,
        video.creator,
        video.description,
        video.category
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });

  renderVideos(result);
}


function filterByCategory(list) {
  if (
    currentCategory === "All"
  ) {
    return list;
  }

  return list.filter(
    video =>
      video.category ===
      currentCategory
  );
}


function selectCategory(category) {
  currentCategory =
    category || "All";

  document
    .querySelectorAll(".category-btn")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.category ===
          currentCategory
      );
    });

  renderVideos(
    filterByCategory(videos)
  );
}


/* =========================================================
   AUTH MODALS
========================================================= */

function openLogin() {
  $("loginModal")
    ?.classList.add("show");

  if ($("loginStatus")) {
    $("loginStatus").textContent =
      "";
  }
}


function closeLogin() {
  $("loginModal")
    ?.classList.remove("show");
}


function openSignup() {
  $("signupModal")
    ?.classList.add("show");

  if ($("signupStatus")) {
    $("signupStatus").textContent =
      "";
  }
}


function closeSignup() {
  $("signupModal")
    ?.classList.remove("show");
}


/* =========================================================
   EMAIL SIGNUP
========================================================= */

async function emailSignup() {
  if (!firebaseReady()) {
    $("signupStatus").textContent =
      "Firebase is not ready.";
    return;
  }

  const name =
    $("signupName")
      .value.trim();

  const email =
    $("signupEmail")
      .value.trim();

  const password =
    $("signupPassword")
      .value;

  const status =
    $("signupStatus");

  if (
    !name ||
    !email ||
    !password
  ) {
    status.textContent =
      "Please fill all fields.";
    return;
  }

  status.textContent =
    "Creating account...";

  try {
    const fb =
      getFirebase();

    const result =
      await fb.createUserWithEmailAndPassword(
        fb.auth,
        email,
        password
      );

    await fb.updateProfile(
      result.user,
      {
        displayName: name
      }
    );

    await fb.setDoc(
      fb.doc(
        fb.db,
        "profiles",
        result.user.uid
      ),
      {
        uid:
          result.user.uid,

        email,

        username:
          name
            .replace(/\s+/g, "")
            .toLowerCase(),

        channelName:
          name,

        bio: "",
        link: "",

        photo:
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name
          )}&background=random`
      }
    );

    status.textContent =
      "Account successfully created! 🎉";

    setTimeout(
      closeSignup,
      800
    );

  } catch (error) {
    console.error(error);

    status.textContent =
      error.message ||
      "Signup failed.";
  }
}


/* =========================================================
   EMAIL LOGIN
========================================================= */

async function emailLogin() {
  if (!firebaseReady()) {
    $("loginStatus").textContent =
      "Firebase is not ready.";
    return;
  }

  const email =
    $("loginEmail")
      .value.trim();

  const password =
    $("loginPassword")
      .value;

  const status =
    $("loginStatus");

  if (!email || !password) {
    status.textContent =
      "Please enter email and password.";
    return;
  }

  status.textContent =
    "Logging in...";

  try {
    const fb =
      getFirebase();

    await fb.signInWithEmailAndPassword(
      fb.auth,
      email,
      password
    );

    status.textContent =
      "Login successful! 👋";

    setTimeout(
      closeLogin,
      700
    );

  } catch (error) {
    console.error(error);

    status.textContent =
      error.message ||
      "Login failed.";
  }
}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

async function googleLogin() {
  if (!firebaseReady()) {
    alert(
      "Firebase is not ready."
    );
    return;
  }

  try {
    const fb =
      getFirebase();

    const provider =
      new fb.GoogleAuthProvider();

    const result =
      await fb.signInWithPopup(
        fb.auth,
        provider
      );

    const user =
      result.user;

    const profileRef =
      fb.doc(
        fb.db,
        "profiles",
        user.uid
      );

    const snap =
      await fb.getDoc(
        profileRef
      );

    if (!snap.exists()) {
      await fb.setDoc(
        profileRef,
        {
          uid:
            user.uid,

          email:
            user.email || "",

          username:
            (
              user.displayName ||
              "user"
            )
              .replace(/\s+/g, "")
              .toLowerCase(),

          channelName:
            user.displayName ||
            "MiniTube User",

          bio: "",
          link: "",

          photo:
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.displayName ||
                "User"
            )}&background=random`
        }
      );
    }

    closeLogin();
    closeSignup();

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "Google login failed."
    );
  }
}


/* =========================================================
   PROFILE MENU
========================================================= */

function toggleProfileMenu(event) {
  if (event) {
    event.stopPropagation();
  }

  $("profileMenu")
    ?.classList.toggle("show");
}


function closeProfileMenu() {
  $("profileMenu")
    ?.classList.remove("show");
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {
  try {
    if (
      firebaseReady() &&
      getFirebase().signOut
    ) {
      await getFirebase().signOut(
        getFirebase().auth
      );
    }
  } catch (error) {
    console.error(error);
  }

  currentUser = null;
  currentProfile = null;
  currentVideo = null;

  window.currentUser = null;
  window.currentVideo = null;

  closeProfileMenu();
  closePageMenu();

  if ($("authButtons")) {
    $("authButtons").style.display =
      "flex";
  }

  if ($("profileArea")) {
    $("profileArea").style.display =
      "none";
  }

  showHome();
}


/* =========================================================
   MY CHANNEL
========================================================= */

async function openMyChannel() {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  closeProfileMenu();

  if (!currentProfile) {
    await loadUserProfile();
  }

  showChannelPage();

  const profile =
    currentProfile ||
    defaultProfile();

  const photo =
    profile.photo ||
    defaultProfile().photo;

  if ($("channelPhoto")) {
    $("channelPhoto").src =
      photo;
  }

  if ($("channelName")) {
    $("channelName").textContent =
      profile.channelName ||
      "My Channel";
  }

  if ($("channelUsername")) {
    $("channelUsername").textContent =
      profile.username
        ? "@" +
          profile.username
        : "";
  }

  if ($("channelBio")) {
    $("channelBio").textContent =
      profile.bio || "";
  }

  const link =
    $("channelLink");

  if (link) {
    if (profile.link) {
      link.href =
        normalizeLink(
          profile.link
        );

      link.textContent =
        profile.link;

      link.style.display =
        "inline-block";
    } else {
      link.style.display =
        "none";
    }
  }

  const myVideos =
    videos.filter(video =>
      !video.deleted &&
      isValidVideo(video) &&
      (
        video.ownerId ===
          currentUser.uid ||
        (
          !video.ownerId &&
          isVideoOwner(video)
        )
      )
    );

  renderChannelVideos(
    myVideos
  );
}


function renderChannelVideos(list) {
  const grid =
    $("channelVideoGrid");

  if (!grid) return;

  grid.innerHTML = "";

  const validList =
    Array.isArray(list)
      ? list.filter(
          video =>
            !video.deleted &&
            isValidVideo(video)
        )
      : [];

  if (!validList.length) {
    grid.innerHTML = `
      <div class="empty-message">
        <h3>No videos yet</h3>
        <p>Upload your first video.</p>
      </div>
    `;

    return;
  }

  validList.forEach(video => {

    const card =
      document.createElement("div");

    card.className =
      "video-card";

    const photo =
      video.creatorPhoto ||
      currentProfile?.photo ||
      defaultProfile().photo;

    card.innerHTML = `
      <div class="thumbnail-wrapper">

        <video
          src="${escapeHtml(video.url)}"
          preload="metadata"
          muted
          playsinline
        ></video>

      </div>

      <div class="video-info">

        <img
          class="video-avatar"
          src="${escapeHtml(photo)}"
          alt=""
        >

        <div class="video-text">

          <div class="video-title">
            ${escapeHtml(
              video.title ||
              "Untitled"
            )}
          </div>

          <div class="video-creator">
            ${escapeHtml(
              video.creator ||
              currentProfile?.channelName ||
              "User"
            )}
          </div>

          <div class="video-meta">
            ${formatViews(
              video.views
            )} views
          </div>

        </div>

      </div>
    `;

    card.addEventListener(
      "click",
      () => openVideo(video)
    );

    grid.appendChild(card);
  });
}


/* =========================================================
   UPLOAD PAGE
========================================================= */

function openUpload() {
  if (!currentUser) {
    alert(
      "Please login first to upload a video."
    );
    return;
  }

  closeProfileMenu();

  showUploadPage();
}


/* =========================================================
   UPLOAD VIDEO
========================================================= */

async function uploadVideo() {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  const file =
    $("videoFile")
      ?.files?.[0];

  const title =
    $("videoTitle")
      ?.value.trim();

  const description =
    $("videoDescriptionInput")
      ?.value.trim();

  const category =
    $("videoCategory")
      ?.value ||
    "Gaming";

  const status =
    $("uploadStatus");

  if (!file) {
    status.textContent =
      "Please select a video.";
    return;
  }

  if (!title) {
    status.textContent =
      "Please enter video title.";
    return;
  }

  status.textContent =
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

    const result =
      await response.json();

    if (!result.secure_url) {
      throw new Error(
        result.error?.message ||
        "Cloudinary upload failed."
      );
    }

    const newVideo = {
      id:
        Date.now().toString(),

      ownerId:
        currentUser.uid,

      title,

      creator:
        currentProfile?.channelName ||
        currentUser.displayName ||
        "MiniTube User",

      creatorUsername:
        currentProfile?.username ||
        (
          currentUser.displayName ||
          "user"
        )
          .replace(/\s+/g, "")
          .toLowerCase(),

      creatorPhoto:
        currentProfile?.photo ||
        currentUser.photoURL ||
        defaultProfile().photo,

      description,

      category,

      url:
        result.secure_url,

      views: 0,

      likes: 0,

      deleted: false,

      createdAt:
        new Date().toISOString()
    };


    videos = [
      newVideo,
      ...videos
    ];

    saveVideos();


    if (firebaseReady()) {
      try {
        const fb =
          getFirebase();

        await fb.setDoc(
          fb.doc(
            fb.db,
            "videos",
            String(newVideo.id)
          ),
          newVideo
        );

      } catch (firebaseError) {
        console.error(
          "Firestore video save failed:",
          firebaseError
        );
      }
    }


    status.textContent =
      "Video uploaded successfully! 🎉";

    if ($("videoFile")) {
      $("videoFile").value = "";
    }

    if ($("videoTitle")) {
      $("videoTitle").value = "";
    }

    if ($("videoDescriptionInput")) {
      $("videoDescriptionInput").value =
        "";
    }

    setTimeout(() => {
      showHome();
    }, 900);

  } catch (error) {
    console.error(error);

    status.textContent =
      "Upload failed: " +
      (
        error.message ||
        "Unknown error"
      );
  }
}


/* =========================================================
   LIKES
========================================================= */

function updateLikeUI(video) {
  if (!video) return;

  const liked =
    !!likedVideos[
      String(video.id)
    ];

  if ($("likeButton")) {
    $("likeButton").textContent =
      liked
        ? "❤️ Liked"
        : "👍 Like";
  }

  if ($("likeCount")) {
    $("likeCount").textContent =
      formatViews(
        video.likes || 0
      );
  }
}


async function toggleLike() {
  if (!currentVideo) return;

  const id =
    String(currentVideo.id);

  if (likedVideos[id]) {

    delete likedVideos[id];

    currentVideo.likes =
      Math.max(
        0,
        (
          Number(
            currentVideo.likes
          ) || 0
        ) - 1
      );

  } else {

    likedVideos[id] = true;

    currentVideo.likes =
      (
        Number(
          currentVideo.likes
        ) || 0
      ) + 1;
  }

  const index =
    videos.findIndex(
      video =>
        String(video.id) ===
        id
    );

  if (index !== -1) {
    videos[index].likes =
      currentVideo.likes;
  }

  saveLikes();
  saveVideos();

  updateLikeUI(
    currentVideo
  );

  syncVideoToFirebase(
    currentVideo,
    {
      likes:
        currentVideo.likes
    }
  );
}


/* =========================================================
   SHARE
========================================================= */

async function shareVideo() {
  if (!currentVideo) return;

  const url =
    window.location.href;

  try {

    if (navigator.share) {
      await navigator.share({
        title:
          currentVideo.title,

        text:
          "Watch this video on MiniTube",

        url
      });

      return;
    }

    await navigator.clipboard.writeText(
      url
    );

    alert(
      "Video link copied! ✅"
    );

  } catch (error) {
    console.log(error);
  }
}


/* =========================================================
   COMMENTS
========================================================= */

function loadComments(videoId) {
  const list =
    $("commentsList");

  if (!list) return;

  const videoComments =
    comments[
      String(videoId)
    ] || [];

  list.innerHTML = "";

  if (!videoComments.length) {
    list.innerHTML = `
      <div class="empty-message">
        No comments yet.
      </div>
    `;

    return;
  }

  videoComments.forEach(comment => {

    const item =
      document.createElement("div");

    item.className =
      "comment";

    const photo =
      comment.photo ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        comment.name ||
        "User"
      )}&background=random`;

    item.innerHTML = `
      <img
        src="${escapeHtml(photo)}"
        alt=""
      >

      <div>

        <div class="comment-name">
          ${escapeHtml(
            comment.name ||
            "User"
          )}
        </div>

        <div class="comment-text">
          ${escapeHtml(
            comment.text || ""
          )}
        </div>

      </div>
    `;

    list.appendChild(item);
  });
}


function addComment() {
  if (!currentVideo) return;

  const input =
    $("commentInput");

  const text =
    input?.value.trim();

  if (!text) return;

  const videoId =
    String(currentVideo.id);

  if (!comments[videoId]) {
    comments[videoId] = [];
  }

  comments[videoId].push({
    name:
      currentProfile?.channelName ||
      currentUser?.displayName ||
      "Guest",

    photo:
      currentProfile?.photo ||
      currentUser?.photoURL ||
      defaultProfile().photo,

    text,

    createdAt:
      new Date().toISOString()
  });

  saveComments();

  input.value = "";

  loadComments(
    videoId
  );
}


/* =========================================================
   FIRESTORE LOAD
========================================================= */

async function loadVideosFromFirebase() {

  if (firebaseLoading) {
    return firebaseLoading;
  }

  if (
    !firebaseReady()
  ) {
    renderVideos(
      filterByCategory(videos)
    );

    return;
  }

  firebaseLoading =
    (async () => {

      try {

        const fb =
          getFirebase();

        const snapshot =
          await fb.getDocs(
            fb.collection(
              fb.db,
              "videos"
            )
          );

        const firestoreVideos =
          [];

        snapshot.forEach(
          docSnap => {

            const data =
              docSnap.data();

            firestoreVideos.push({
              id:
                docSnap.id,

              ...data
            });
          }
        );


        const localMap =
          new Map();

        videos.forEach(
          video => {

            if (!video?.id) {
              return;
            }

            localMap.set(
              String(video.id),
              video
            );
          }
        );


        firestoreVideos.forEach(
          firestoreVideo => {

            const id =
              String(
                firestoreVideo.id
              );

            const localVideo =
              localMap.get(id);

            if (
              localVideo &&
              isValidVideo(localVideo) &&
              !isValidVideo(
                firestoreVideo
              )
            ) {
              return;
            }

            if (
              localVideo &&
              isValidVideo(localVideo) &&
              isValidVideo(
                firestoreVideo
              )
            ) {

              localMap.set(
                id,
                {
                  ...localVideo,
                  ...firestoreVideo
                }
              );

            } else {

              localMap.set(
                id,
                firestoreVideo
              );
            }
          }
        );


        videos =
          Array.from(
            localMap.values()
          );

        saveVideos();

        firebaseVideosLoaded =
          true;

        renderVideos(
          filterByCategory(videos)
        );

      } catch (error) {

        console.error(
          "Could not load Firestore videos:",
          error
        );

        renderVideos(
          filterByCategory(videos)
        );

      } finally {

        firebaseLoading =
          null;
      }

    })();

  return firebaseLoading;
}


/* =========================================================
   MIGRATE LOCAL VIDEOS
========================================================= */

async function migrateLocalVideos() {
  if (
    !currentUser ||
    !firebaseReady()
  ) {
    return;
  }

  const fb =
    getFirebase();

  for (const video of videos) {

    if (
      video.deleted ||
      !isValidVideo(video) ||
      video.ownerId !==
        currentUser.uid
    ) {
      continue;
    }

    try {

      await fb.setDoc(
        fb.doc(
          fb.db,
          "videos",
          String(video.id)
        ),
        video,
        {
          merge: true
        }
      );

    } catch (error) {

      console.log(
        "Migration skipped:",
        error.message
      );
    }
  }
}


/* =========================================================
   AUTH STATE
========================================================= */

function startFirebaseAuth() {

  if (!firebaseReady()) {

    console.log(
      "Firebase not ready."
    );

    renderVideos(
      filterByCategory(videos)
    );

    return;
  }

  const fb =
    getFirebase();

  fb.onAuthStateChanged(
    fb.auth,
    async user => {

      currentUser =
        user || null;

      window.currentUser =
        currentUser;


      if (currentUser) {

        if ($("authButtons")) {
          $("authButtons").style.display =
            "none";
        }

        if ($("profileArea")) {
          $("profileArea").style.display =
            "block";
        }

        await loadUserProfile();

        await migrateLocalVideos();

      } else {

        currentProfile = null;

        if ($("authButtons")) {
          $("authButtons").style.display =
            "flex";
        }

        if ($("profileArea")) {
          $("profileArea").style.display =
            "none";
        }
      }


      await loadVideosFromFirebase();


      if (!appStarted) {
        appStarted = true;
        showHome();
      }

    }
  );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {

  /* LOGIN */

  $("loginButton")
    ?.addEventListener(
      "click",
      openLogin
    );

  $("emailLoginButton")
    ?.addEventListener(
      "click",
      emailLogin
    );

  $("googleLoginButton")
    ?.addEventListener(
      "click",
      googleLogin
    );


  /* SIGNUP */

  $("signupButton")
    ?.addEventListener(
      "click",
      openSignup
    );

  $("emailSignupButton")
    ?.addEventListener(
      "click",
      emailSignup
    );

  $("googleSignupButton")
    ?.addEventListener(
      "click",
      googleLogin
    );


  /* PROFILE */

  $("profileButton")
    ?.addEventListener(
      "click",
      toggleProfileMenu
    );

  $("editProfileButton")
    ?.addEventListener(
      "click",
      event => {
        event?.stopPropagation();
        openEditProfile();
      }
    );

  $("myChannelButton")
    ?.addEventListener(
      "click",
      event => {
        event?.stopPropagation();
        openMyChannel();
      }
    );

  $("uploadButton")
    ?.addEventListener(
      "click",
      event => {
        event?.stopPropagation();
        openUpload();
      }
    );

  $("logoutButton")
    ?.addEventListener(
      "click",
      event => {
        event?.stopPropagation();
        logout();
      }
    );


  /* SAVE PROFILE */

  $("saveProfileButton")
    ?.addEventListener(
      "click",
      saveUserProfile
    );


  /* PROFILE PHOTO */

  $("profileImageFile")
    ?.addEventListener(
      "change",
      event => {

        const file =
          event.target.files?.[0];

        if (!file) return;

        const url =
          URL.createObjectURL(file);

        if ($("editProfilePreview")) {
          $("editProfilePreview").src =
            url;
        }
      }
    );


  $("changePhotoButton")
    ?.addEventListener(
      "click",
      () => {
        $("profileImageFile")
          ?.click();
      }
    );


  /* UPLOAD */

  $("uploadVideoButton")
    ?.addEventListener(
      "click",
      uploadVideo
    );


  /* SEARCH */

  $("searchButton")
    ?.addEventListener(
      "click",
      searchVideos
    );

  $("searchInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {
          searchVideos();
        }

      }
    );


  /* CATEGORIES */

  document
    .querySelectorAll(".category-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectCategory(
            button.dataset.category
          );

        }
      );

    });


  /* VIDEO */

  $("likeButton")
    ?.addEventListener(
      "click",
      toggleLike
    );

  $("shareButton")
    ?.addEventListener(
      "click",
      shareVideo
    );

  $("commentButton")
    ?.addEventListener(
      "click",
      addComment
    );


  $("commentInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {
          addComment();
        }

      }
    );


  /* BACK BUTTONS */

  $("backHomeButton")
    ?.addEventListener(
      "click",
      () => {
        currentVideo = null;
        window.currentVideo = null;

        if ($("mainVideo")) {
          $("mainVideo").pause();
          $("mainVideo").removeAttribute("src");
          $("mainVideo").load();
        }

        showHome();
      }
    );

  $("channelBackButton")
    ?.addEventListener(
      "click",
      showHome
    );

  $("uploadBackButton")
    ?.addEventListener(
      "click",
      showHome
    );


  /* CLOSE LOGIN */

  document
    .querySelectorAll(
      "#loginModal .close-modal"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        closeLogin
      );

    });


  /* CLOSE SIGNUP */

  document
    .querySelectorAll(
      "#signupModal .close-modal"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        closeSignup
      );

    });


  /* CLOSE PROFILE */

  document
    .querySelectorAll(
      "#editProfileModal .close-modal"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        closeEditProfile
      );

    });


  /* MODALS */

  document
    .querySelectorAll(".modal")
    .forEach(modal => {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target === modal
          ) {
            modal.classList.remove(
              "show"
            );
          }

        }
      );

    });


  /* DOCUMENT CLICK */

  document.addEventListener(
    "click",
    event => {

      if (
        !event.target.closest(
          ".video-more-button"
        ) &&
        !event.target.closest(
          ".video-menu"
        )
      ) {
        closeAllVideoMenus();
      }

      if (
        !event.target.closest(
          "#videoPageMoreButton"
        ) &&
        !event.target.closest(
          "#videoPageMenu"
        )
      ) {
        closePageMenu();
      }

      if (
        !event.target.closest(
          "#profileArea"
        )
      ) {
        closeProfileMenu();
      }

    }
  );
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.toggleVideoMenu =
  toggleVideoMenu;

window.videoMenuAction =
  videoMenuAction;

window.openEditVideo =
  openEditVideo;

window.closeEditVideo =
  closeEditVideo;

window.saveEditedVideo =
  saveEditedVideo;

window.deleteVideo =
  deleteVideo;

window.openReport =
  openReport;

window.closeReport =
  closeReport;

window.submitReport =
  submitReport;

window.closePageMenu =
  closePageMenu;

/*
  IMPORTANT:
  Don't store currentVideo as a one-time snapshot.
  Keep it synchronized.
*/

window.currentVideo =
  null;


/* =========================================================
   START
========================================================= */

function initMiniTube() {

  setupEvents();

  createVideoPageMenu();

  renderVideos(
    filterByCategory(videos)
  );

  startFirebaseAuth();
}


/* =========================================================
   START APP
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initMiniTube
  );

} else {

  initMiniTube();

}
