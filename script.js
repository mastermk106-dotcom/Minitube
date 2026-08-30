const $ = (id) => document.getElementById(id);

let videos = JSON.parse(
  localStorage.getItem("minitubeVideos") || "[]"
);

let currentVideo = null;

let likedVideos = JSON.parse(
  localStorage.getItem("minitubeLikes") || "{}"
);


/* =========================
   DEMO VIDEOS
========================= */

const DEMO_VIDEOS = [
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


/* =========================
   LOCAL STORAGE
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
   PREPARE VIDEOS
========================= */

function prepareVideos() {

  const saved = JSON.parse(
    localStorage.getItem("minitubeVideos") || "[]"
  );

  const realVideos = saved.filter(
    video =>
      video &&
      video.id &&
      !String(video.id).startsWith("demo")
  );

  videos = [
    ...realVideos,
    ...DEMO_VIDEOS
  ];

  saveVideos();
}


/* =========================
   FORMAT VIEWS
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
   FORMAT DURATION
========================= */

function formatDuration(seconds) {

  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  seconds = Math.floor(seconds);

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
   SHOW HOME
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
    formatViews(video.views || 0) +
    " views";


  $("mainVideoDescription").textContent =
    video.description ||
    "No description available.";


  $("likeCount").textContent =
    video.likes || 0;


  $("videoCreatorAvatar").textContent =
    (video.creator || "M")
      .charAt(0)
      .toUpperCase();


  const player =
    $("mainVideo");


  /* RESET PLAYER */

  player.pause();

  player.removeAttribute("src");

  while (player.firstChild) {
    player.removeChild(
      player.firstChild
    );
  }

  player.load();


  /* LOAD CLOUDINARY VIDEO */

  if (video.url) {

    const source =
      document.createElement("source");

    source.src = video.url;

    source.type = "video/mp4";

    player.appendChild(source);


    player.preload = "auto";

    player.controls = true;

    player.playsInline = true;


    player.addEventListener(
      "loadedmetadata",
      () => {

        console.log(
          "Video loaded:",
          video.url
        );

        console.log(
          "Duration:",
          formatDuration(
            player.duration
          )
        );

      },
      { once: true }
    );


    player.addEventListener(
      "error",
      () => {

        console.error(
          "MiniTube video error:",
          player.error,
          video.url
        );

      },
      { once: true }
    );


    player.load();

  }


  $("downloadButton").href =
    video.url || "#";


  loadComments(video.id);


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================
   CREATE THUMBNAIL
========================= */

function createThumbnail(
  video,
  thumbnail
) {

  thumbnail.innerHTML = "";


  /* DEMO VIDEO */

  if (!video.url) {

    const play =
      document.createElement("div");

    play.textContent = "▶";

    play.style.fontSize = "45px";

    thumbnail.appendChild(play);

    return;
  }


  /* VIDEO ELEMENT */

  const thumbVideo =
    document.createElement("video");


  thumbVideo.src =
    video.url;


  thumbVideo.preload =
    "metadata";


  thumbVideo.muted =
    true;


  thumbVideo.playsInline =
    true;


  thumbVideo.controls =
    false;


  thumbVideo.setAttribute(
    "webkit-playsinline",
    ""
  );


  thumbVideo.style.width =
    "100%";


  thumbVideo.style.height =
    "100%";


  thumbVideo.style.objectFit =
    "cover";


  /* DURATION BADGE */

  const durationBadge =
    document.createElement("span");


  durationBadge.style.position =
    "absolute";


  durationBadge.style.right =
    "8px";


  durationBadge.style.bottom =
    "8px";


  durationBadge.style.background =
    "rgba(0,0,0,0.8)";


  durationBadge.style.color =
    "white";


  durationBadge.style.padding =
    "3px 6px";


  durationBadge.style.borderRadius =
    "4px";


  durationBadge.style.fontSize =
    "12px";


  durationBadge.style.fontWeight =
    "bold";


  durationBadge.textContent =
    "0:00";


  thumbnail.style.position =
    "relative";


  thumbnail.appendChild(
    thumbVideo
  );


  thumbnail.appendChild(
    durationBadge
  );


  /* GET DURATION */

  thumbVideo.addEventListener(
    "loadedmetadata",
    () => {

      if (
        Number.isFinite(
          thumbVideo.duration
        )
      ) {

        durationBadge.textContent =
          formatDuration(
            thumbVideo.duration
          );


        /*
          Move slightly into the video
          so the browser renders a frame.
        */

        try {

          thumbVideo.currentTime =
            0.1;

        } catch (error) {

          console.log(
            "Thumbnail frame unavailable."
          );

        }

      }

    }
  );


  /* FRAME LOADED */

  thumbVideo.addEventListener(
    "loadeddata",
    () => {

      try {

        thumbVideo.currentTime = 0.1;

      } catch (error) {

        console.log(
          "Could not set thumbnail frame."
        );

      }

    }
  );


  /* ERROR */

  thumbVideo.addEventListener(
    "error",
    () => {

      durationBadge.textContent =
        "";

      console.error(
        "Thumbnail could not load:",
        video.url
      );

    }
  );


  thumbVideo.load();
}


/* =========================
   RENDER VIDEOS
========================= */

function renderVideos(
  list = videos
) {

  const grid =
    $("videoGrid");


  if (!grid) return;


  grid.innerHTML = "";


  list.forEach(video => {

    const card =
      document.createElement("div");


    card.className =
      "video-card";


    const thumbnail =
      document.createElement("div");


    thumbnail.className =
      "thumbnail";


    createThumbnail(
      video,
      thumbnail
    );


    const info =
      document.createElement("div");


    info.className =
      "video-info";


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
      video.title ||
      "Untitled Video";


    const creator =
      document.createElement("p");


    creator.textContent =
      video.creator ||
      "MiniTube User";


    const views =
      document.createElement("p");


    views.textContent =
      formatViews(
        video.views || 0
      ) +
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
      () => {

        openVideo(video);

      }
    );


    grid.appendChild(card);

  });

}


/* =========================
   SEARCH
========================= */

function searchVideos() {

  const search =
    $("searchInput")
      .value
      .toLowerCase()
      .trim();


  if (!search) {

    renderVideos(videos);

    return;

  }


  const results =
    videos.filter(video => {

      return (
        (video.title || "")
          .toLowerCase()
          .includes(search)
        ||
        (video.creator || "")
          .toLowerCase()
          .includes(search)
      );

    });


  renderVideos(results);
}


$("searchButton").addEventListener(
  "click",
  searchVideos
);


$("searchInput").addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      searchVideos();

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


$("loginButton").addEventListener(
  "click",
  openLogin
);


$("signupButton").addEventListener(
  "click",
  openSignup
);


$("getStartedButton").addEventListener(
  "click",
  openSignup
);


$("closeLoginButton").addEventListener(
  "click",
  closeModals
);


$("closeSignupButton").addEventListener(
  "click",
  closeModals
);


$("goToSignup").addEventListener(
  "click",
  () => {

    closeModals();

    openSignup();

  }
);


$("goToLogin").addEventListener(
  "click",
  () => {

    closeModals();

    openLogin();

  }
);


/* =========================
   EMAIL SIGNUP
========================= */

$("emailSignupButton").addEventListener(
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
            displayName: name
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

$("emailLoginButton").addEventListener(
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


$("googleLoginButton").addEventListener(
  "click",
  googleLogin
);


$("googleSignupButton").addEventListener(
  "click",
  googleLogin
);


/* =========================
   PROFILE MENU
========================= */

$("profilePhoto").addEventListener(
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
      !event.target.closest(
        "#profileArea"
      )
    ) {

      $("profileMenu")
        .classList.remove("show");

    }

  }
);


/* =========================
   LOGOUT
========================= */

$("logoutButton").addEventListener(
  "click",
  async () => {

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
);


/* =========================
   CHANNEL
========================= */

$("myChannelButton").addEventListener(
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
);


$("backFromChannelButton").addEventListener(
  "click",
  showHome
);


/* =========================
   UPLOAD PAGE
========================= */

$("uploadButton").addEventListener(
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
      .classList.remove("show");

  }
);


$("backFromUploadButton").addEventListener(
  "click",
  showHome
);


/* =========================
   LOCAL VIDEO PREVIEW
========================= */

let previewObjectURL = null;


$("videoFile").addEventListener(
  "change",
  () => {

    const file =
      $("videoFile").files[0];


    if (!file) {

      $("videoPreview")
        .style.display =
        "none";

      return;

    }


    if (previewObjectURL) {

      URL.revokeObjectURL(
        previewObjectURL
      );

    }


    previewObjectURL =
      URL.createObjectURL(file);


    $("videoPreview").src =
      previewObjectURL;


    $("videoPreview").style.display =
      "block";

  }
);


/* =========================
   UPLOAD VIDEO
========================= */

$("uploadVideoButton").addEventListener(
  "click",
  async () => {

    const file =
      $("videoFile").files[0];


    const title =
      $("videoTitle")
        .value
        .trim();


    const description =
      $("videoDescription")
        .value
        .trim();


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


      const newVideo = {

        id:
          Date.now().toString(),

        title:
          title,

        creator:
          window.currentUser?.displayName ||
          "MiniTube User",

        description:
          description,

        url:
          data.secure_url,

        views:
          0,

        likes:
          0

      };


      videos = [
        newVideo,
        ...videos.filter(
          video =>
            !String(video.id)
              .startsWith("demo")
        ),
        ...DEMO_VIDEOS
      ];


      saveVideos();


      $("uploadStatus").textContent =
        "Video successfully uploaded! 🎉";


      alert(
        "Video successfully uploaded! 🎉"
      );


      $("videoTitle").value =
        "";

      $("videoDescription").value =
        "";

      $("videoFile").value =
        "";

      $("videoPreview").src =
        "";

      $("videoPreview").style.display =
        "none";


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

$("backFromVideoButton").addEventListener(
  "click",
  () => {

    const player =
      $("mainVideo");


    player.pause();


    player.removeAttribute(
      "src"
    );


    while (player.firstChild) {

      player.removeChild(
        player.firstChild
      );

    }


    player.load();


    currentVideo =
      null;


    showHome();

  }
);


/* =========================
   LIKE
========================= */

$("likeButton").addEventListener(
  "click",
  () => {

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

$("shareButton").addEventListener(
  "click",
  async () => {

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

function loadComments(
  videoId
) {

  const allComments =
    getComments();


  const comments =
    allComments[videoId] || [];


  const list =
    $("commentsList");


  list.innerHTML =
    "";


  if (
    comments.length === 0
  ) {

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


$("commentButton").addEventListener(
  "click",
  addComment
);


$("commentInput").addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      addComment();

    }

  }
);


function addComment() {

  if (!currentVideo)
    return;


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
   START WEBSITE
========================= */

prepareVideos();

renderVideos();

showHome();


console.log(
  "MiniTube started successfully 🎬"
);
