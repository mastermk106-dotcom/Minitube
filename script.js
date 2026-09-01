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

  const saved = JSON.parse(
    localStorage.getItem(
      "minitubeVideos"
    ) || "[]"
  );


  videos = saved.filter(video => {

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
    Math.floor(
      seconds / 3600
    );


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


  $("videoCreatorAvatar").textContent =
    (
      video.creator ||
      "M"
    )
      .charAt(0)
      .toUpperCase();


  const player =
    $("mainVideo");


  player.pause();

  player.removeAttribute(
    "src"
  );

  player.load();


  player.src =
    video.url;


  player.load();


  player.onerror = () => {

    console.error(
      "Video playback error:",
      player.error
    );

  };


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
    "loadeddata",
    () => {

      thumbnail.innerHTML =
        "";

      thumbnail.appendChild(
        videoElement
      );

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
        "div"
      );


    avatar.className =
      "channel-avatar";


    avatar.textContent =
      (
        video.creator ||
        "M"
      )
        .charAt(0)
        .toUpperCase();


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


    details.appendChild(
      title
    );

    details.appendChild(
      creator
    );

    details.appendChild(
      views
    );

    details.appendChild(
      category
    );


    info.appendChild(
      avatar
    );

    info.appendChild(
      details
    );


    card.appendChild(
      thumbnail
    );

    card.appendChild(
      info
    );


    card.addEventListener(
      "click",
      () => openVideo(video)
    );


    grid.appendChild(
      card
    );

  });

}


/* =========================
   CATEGORY FILTER
========================= */

function filterCategory(
  category
) {

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


/* =========================
   SEARCH + CATEGORY
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


/* =========================
   CATEGORY BUTTONS
========================= */

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


        $("signupName").value =
          "";

        $("signupEmail").value =
          "";

        $("signupPassword").value =
          "";


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


        $("loginEmail").value =
          "";

        $("loginPassword").value =
          "";


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
    () => {

      if (!window.currentUser) {

        openLogin();

        return;

      }


      $("homePage").style.display =
        "none";

      $("videoPage").style.display =
        "none";

      $("uploadPage").style.display =
        "none";

      $("channelPage").style.display =
        "block";


      const user =
        window.currentUser;


      $("channelName").textContent =
        user.displayName ||
        "MiniTube User";


      $("channelEmail").textContent =
        user.email ||
        "";


      $("channelPhoto").src =
        user.photoURL ||
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          user.displayName ||
          "MiniTube User"
        );


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


        const newVideo = {

          id:
            Date.now().toString(),

          title:
            title,

          creator:
            window.currentUser
              .displayName ||
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


        $("uploadStatus")
          .textContent =
          "Video successfully uploaded! 🎉";


        alert(
          "Video successfully uploaded! 🎉"
        );


        $("videoTitle").value =
          "";

        $("videoDescription").value =
          "";

        $("videoCategory").value =
          "Gaming";

        $("videoFile").value =
          "";

        $("videoPreview").src =
          "";

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
   BACK FROM VIDEO
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


      content.appendChild(
        author
      );

      content.appendChild(
        text
      );


      item.appendChild(
        avatar
      );

      item.appendChild(
        content
      );


      list.appendChild(
        item
      );

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
      window.currentUser
        .displayName ||
      "MiniTube User",

    text:
      text,

    photo:
      window.currentUser
        .photoURL ||
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(
        window.currentUser
          .displayName ||
        "User"
      )

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

  }
);


/* =========================
   START
========================= */

prepareVideos();

renderVideos();

showHome();
