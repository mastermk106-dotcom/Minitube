const $ = (id) => document.getElementById(id);

let videos = [];
let currentVideo = null;
let likedVideos = JSON.parse(localStorage.getItem("minitubeLikes") || "{}");


/* =========================
   FIRESTORE HELPERS
========================= */

async function loadVideosFromFirebase() {
  try {
    const snapshot = await firebaseFunctions.getDocs(
      firebaseFunctions.collection(firebaseFunctions.db, "videos")
    );

    videos = [];

    snapshot.forEach((docSnap) => {
      videos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    if (videos.length === 0) {
      videos = [
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

    renderVideos();

  } catch (error) {
    console.error("Videos load error:", error);
    alert("Could not load videos.");
  }
}


/* =========================
   HOME
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

  $("mainVideoTitle").textContent = video.title;

  $("mainVideoCreator").textContent =
    video.creator || "MiniTube User";

  $("mainVideoViews").textContent =
    formatViews(video.views || 0) + " views";

  $("mainVideoDescription").textContent =
    video.description || "No description available.";

  $("mainVideo").src = video.url || "";

  $("downloadButton").href = video.url || "#";

  $("videoCreatorAvatar").textContent =
    (video.creator || "M").charAt(0).toUpperCase();

  $("likeCount").textContent = video.likes || 0;

  loadComments(video.id);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   RENDER VIDEOS
========================= */

function renderVideos(list = videos) {

  const grid = $("videoGrid");

  grid.innerHTML = "";

  list.forEach(video => {

    const card = document.createElement("div");
    card.className = "video-card";

    const thumbnail = document.createElement("div");
    thumbnail.className = "thumbnail";

    if (video.url) {

      const videoElement = document.createElement("video");

      videoElement.src = video.url;
      videoElement.muted = true;
      videoElement.preload = "metadata";

      thumbnail.appendChild(videoElement);

    } else {

      thumbnail.innerHTML = "▶";
    }

    const info = document.createElement("div");
    info.className = "video-info";

    const avatar = document.createElement("div");
    avatar.className = "channel-avatar";

    avatar.textContent =
      (video.creator || "M").charAt(0).toUpperCase();

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = video.title;

    const creator = document.createElement("p");
    creator.textContent =
      video.creator || "MiniTube User";

    const views = document.createElement("p");
    views.textContent =
      formatViews(video.views || 0) + " views";

    details.appendChild(title);
    details.appendChild(creator);
    details.appendChild(views);

    info.appendChild(avatar);
    info.appendChild(details);

    card.appendChild(thumbnail);
    card.appendChild(info);

    card.addEventListener("click", () => openVideo(video));

    grid.appendChild(card);
  });
}


/* =========================
   FORMAT VIEWS
========================= */

function formatViews(number) {

  if (number >= 1000000) {
    return (number / 1000000)
      .toFixed(1)
      .replace(".0", "") + "M";
  }

  if (number >= 1000) {
    return (number / 1000)
      .toFixed(1)
      .replace(".0", "") + "K";
  }

  return String(number);
}


/* =========================
   SEARCH
========================= */

function searchVideos() {

  const search =
    $("searchInput").value.toLowerCase().trim();

  if (!search) {
    renderVideos(videos);
    return;
  }

  const results = videos.filter(video =>
    video.title.toLowerCase().includes(search) ||
    (video.creator || "").toLowerCase().includes(search)
  );

  renderVideos(results);
}

$("searchButton").addEventListener("click", searchVideos);

$("searchInput").addEventListener("keydown", event => {
  if (event.key === "Enter") searchVideos();
});


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
}

$("loginButton").addEventListener("click", openLogin);
$("signupButton").addEventListener("click", openSignup);
$("getStartedButton").addEventListener("click", openSignup);

$("closeLoginButton").addEventListener("click", closeModals);
$("closeSignupButton").addEventListener("click", closeModals);

$("goToSignup").addEventListener("click", () => {
  closeModals();
  openSignup();
});

$("goToLogin").addEventListener("click", () => {
  closeModals();
  openLogin();
});


/* =========================
   EMAIL SIGNUP
========================= */

$("emailSignupButton").addEventListener("click", async () => {

  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim();
  const password = $("signupPassword").value;

  if (!name || !email || !password) {
    alert("Please fill all fields.");
    return;
  }

  try {

    const userCredential =
      await firebaseFunctions.createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

    await firebaseFunctions.updateProfile(
      userCredential.user,
      {
        displayName: name
      }
    );

    alert("Account successfully created! 🎉");

    closeModals();

    $("signupName").value = "";
    $("signupEmail").value = "";
    $("signupPassword").value = "";

  } catch (error) {

    alert("Signup failed: " + error.message);
  }
});


/* =========================
   EMAIL LOGIN
========================= */

$("emailLoginButton").addEventListener("click", async () => {

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {

    await firebaseFunctions.signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );

    alert("Login successful! 👋");

    closeModals();

    $("loginEmail").value = "";
    $("loginPassword").value = "";

  } catch (error) {

    alert("Login failed: " + error.message);
  }
});


/* =========================
   GOOGLE LOGIN
========================= */

async function googleLogin() {

  try {

    await firebaseFunctions.signInWithPopup(
      firebaseAuth,
      googleProvider
    );

    closeModals();

  } catch (error) {

    alert("Google login failed: " + error.message);
  }
}

$("googleLoginButton").addEventListener("click", googleLogin);
$("googleSignupButton").addEventListener("click", googleLogin);


/* =========================
   PROFILE
========================= */

$("profilePhoto").addEventListener("click", event => {

  event.stopPropagation();

  $("profileMenu").classList.toggle("show");
});

document.addEventListener("click", event => {

  if (!event.target.closest("#profileArea")) {
    $("profileMenu").classList.remove("show");
  }
});


/* =========================
   LOGOUT
========================= */

$("logoutButton").addEventListener("click", async () => {

  try {

    await firebaseFunctions.signOut(firebaseAuth);

    $("profileMenu").classList.remove("show");

    showHome();

    alert("You have been logged out.");

  } catch (error) {

    alert("Logout failed: " + error.message);
  }
});


/* =========================
   CHANNEL
========================= */

$("myChannelButton").addEventListener("click", () => {

  if (!window.currentUser) {
    openLogin();
    return;
  }

  $("homePage").style.display = "none";
  $("videoPage").style.display = "none";
  $("uploadPage").style.display = "none";
  $("channelPage").style.display = "block";

  const user = window.currentUser;

  $("channelName").textContent =
    user.displayName || "MiniTube User";

  $("channelEmail").textContent =
    user.email || "";

  $("channelPhoto").src =
    user.photoURL ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(user.displayName || "MiniTube User");

  $("profileMenu").classList.remove("show");
});

$("backFromChannelButton").addEventListener("click", showHome);


/* =========================
   UPLOAD PAGE
========================= */

$("uploadButton").addEventListener("click", () => {

  if (!window.currentUser) {
    openLogin();
    return;
  }

  $("homePage").style.display = "none";
  $("videoPage").style.display = "none";
  $("channelPage").style.display = "none";
  $("uploadPage").style.display = "block";

  $("profileMenu").classList.remove("show");
});

$("backFromUploadButton").addEventListener("click", showHome);


/* =========================
   VIDEO PREVIEW
========================= */

$("videoFile").addEventListener("change", () => {

  const file = $("videoFile").files[0];

  if (!file) {
    $("videoPreview").style.display = "none";
    return;
  }

  const url = URL.createObjectURL(file);

  $("videoPreview").src = url;
  $("videoPreview").style.display = "block";
});


/* =========================
   CLOUDINARY UPLOAD
========================= */

$("uploadVideoButton").addEventListener("click", async () => {

  const file = $("videoFile").files[0];
  const title = $("videoTitle").value.trim();
  const description = $("videoDescription").value.trim();

  if (!file) {
    alert("Please select a video.");
    return;
  }

  if (!title) {
    alert("Please enter a video title.");
    return;
  }

  $("uploadStatus").textContent =
    "Uploading video... ⏳";

  try {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", "minituber");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dvvsxjid/video/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Upload failed."
      );
    }


    /* SAVE VIDEO TO FIRESTORE */

    await firebaseFunctions.addDoc(
      firebaseFunctions.collection(
        firebaseFunctions.db,
        "videos"
      ),
      {
        title: title,
        creator:
          window.currentUser?.displayName ||
          "MiniTube User",
        creatorId:
          window.currentUser?.uid || "",
        description: description,
        url: data.secure_url,
        views: 0,
        likes: 0,
        createdAt:
          firebaseFunctions.serverTimestamp()
      }
    );


    $("uploadStatus").textContent =
      "Video successfully uploaded! 🎉";

    alert("Video successfully uploaded! 🎉");

    $("videoTitle").value = "";
    $("videoDescription").value = "";
    $("videoFile").value = "";
    $("videoPreview").src = "";
    $("videoPreview").style.display = "none";

    await loadVideosFromFirebase();

    setTimeout(showHome, 500);

  } catch (error) {

    console.error(error);

    $("uploadStatus").textContent =
      "Upload failed: " + error.message;

    alert("Upload failed: " + error.message);
  }
});


/* =========================
   BACK FROM VIDEO
========================= */

$("backFromVideoButton").addEventListener("click", () => {

  $("mainVideo").pause();
  $("mainVideo").src = "";

  showHome();
});


/* =========================
   LIKE
========================= */

$("likeButton").addEventListener("click", async () => {

  if (!currentVideo) return;

  if (likedVideos[currentVideo.id]) {
    alert("You already liked this video.");
    return;
  }

  currentVideo.likes =
    (currentVideo.likes || 0) + 1;

  likedVideos[currentVideo.id] = true;

  localStorage.setItem(
    "minitubeLikes",
    JSON.stringify(likedVideos)
  );

  if (!currentVideo.id.startsWith("demo")) {

    try {

      await firebaseFunctions.updateDoc(
        firebaseFunctions.doc(
          firebaseFunctions.db,
          "videos",
          currentVideo.id
        ),
        {
          likes: firebaseFunctions.increment(1)
        }
      );

    } catch (error) {
      console.error("Like update failed:", error);
    }
  }

  $("likeCount").textContent =
    currentVideo.likes;
});


/* =========================
   SHARE
========================= */

$("shareButton").addEventListener("click", async () => {

  if (!currentVideo) return;

  try {

    if (navigator.share) {

      await navigator.share({
        title: currentVideo.title,
        text: "Watch this video on MiniTube 🎬",
        url: window.location.href
      });

    } else {

      await navigator.clipboard.writeText(
        window.location.href
      );

      alert("Video link copied! 🔗");
    }

  } catch (error) {
    console.log("Share cancelled.");
  }
});


/* =========================
   FIRESTORE COMMENTS
========================= */

async function loadComments(videoId) {

  const list = $("commentsList");

  list.innerHTML =
    "<p>Loading comments... ⏳</p>";

  try {

    const commentsQuery =
      firebaseFunctions.query(
        firebaseFunctions.collection(
          firebaseFunctions.db,
          "videos",
          videoId,
          "comments"
        ),
        firebaseFunctions.orderBy(
          "createdAt",
          "asc"
        )
      );

    const snapshot =
      await firebaseFunctions.getDocs(
        commentsQuery
      );

    list.innerHTML = "";

    if (snapshot.empty) {

      list.innerHTML =
        "<p class='no-comments'>No comments yet. Be the first! 💬</p>";

      return;
    }

    snapshot.forEach(docSnap => {

      const comment = docSnap.data();

      const item =
        document.createElement("div");

      item.className = "comment";

      const avatar =
        document.createElement("img");

      avatar.className = "comment-avatar";

      avatar.src =
        comment.photo ||
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          comment.name || "User"
        );

      const content =
        document.createElement("div");

      content.className = "comment-content";

      const author =
        document.createElement("strong");

      author.textContent =
        comment.name || "MiniTube User";

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

  } catch (error) {

    console.error("Comments error:", error);

    list.innerHTML =
      "<p>Comments could not be loaded.</p>";
  }
}


/* =========================
   ADD COMMENT
========================= */

$("commentButton").addEventListener(
  "click",
  addComment
);

$("commentInput").addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      addComment();
    }
  }
);


async function addComment() {

  if (!currentVideo) return;

  if (!window.currentUser) {

    alert("Please login to comment.");

    openLogin();

    return;
  }

  const input = $("commentInput");

  const text = input.value.trim();

  if (!text) {

    alert("Please write a comment.");

    return;
  }

  try {

    await firebaseFunctions.addDoc(
      firebaseFunctions.collection(
        firebaseFunctions.db,
        "videos",
        currentVideo.id,
        "comments"
      ),
      {
        name:
          window.currentUser.displayName ||
          "MiniTube User",

        uid:
          window.currentUser.uid,

        photo:
          window.currentUser.photoURL ||
          "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(
            window.currentUser.displayName ||
            "User"
          ),

        text: text,

        createdAt:
          firebaseFunctions.serverTimestamp()
      }
    );

    input.value = "";

    await loadComments(currentVideo.id);

  } catch (error) {

    console.error(error);

    alert(
      "Comment failed: " +
      error.message
    );
  }
}


/* =========================
   OUTSIDE CLICK
========================= */

window.addEventListener("click", event => {

  if (event.target === $("loginModal")) {
    closeModals();
  }

  if (event.target === $("signupModal")) {
    closeModals();
  }
});


/* =========================
   START
========================= */

window.addEventListener("load", async () => {

  showHome();

  await loadVideosFromFirebase();

});
