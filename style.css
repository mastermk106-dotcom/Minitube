let currentVideoId = null;
let currentVideoData = null;

/* ---------- MODALS ---------- */

function openLogin() {
  closeModals();
  document.getElementById("loginModal").style.display = "flex";
}

function openSignup() {
  closeModals();
  document.getElementById("signupModal").style.display = "flex";
}

function openUpload() {
  closeModals();

  if (!window.currentUser) {
    openLogin();
    return;
  }

  document.getElementById("uploadModal").style.display = "flex";
}

function closeModals() {
  document.querySelectorAll(".modal").forEach(m => {
    m.style.display = "none";
  });
}

function switchToSignup() {
  closeModals();
  openSignup();
}

function switchToLogin() {
  closeModals();
  openLogin();
}

/* ---------- PROFILE ---------- */

function toggleProfileMenu() {
  document.getElementById("profileMenu").classList.toggle("show");
}

function openChannel() {

  document.getElementById("profileMenu").classList.remove("show");

  const user = window.currentUser;

  if (!user) return;

  document.getElementById("channelPage").style.display = "block";

  document.getElementById("channelName").textContent =
    user.displayName || "MiniTube User";

  document.getElementById("channelEmail").textContent =
    user.email || "";

  document.getElementById("channelPhoto").src =
    user.photoURL ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(user.displayName || "M");

  window.scrollTo(0, 0);
}

function closeChannel() {
  document.getElementById("channelPage").style.display = "none";
}

/* ---------- SIGNUP ---------- */

async function signup() {

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!name || !email || !password) {
    alert("Please fill all fields.");
    return;
  }

  try {

    const result =
      await window.firebaseFunctions.createUserWithEmailAndPassword(
        window.firebaseAuth,
        email,
        password
      );

    await window.firebaseFunctions.updateProfile(result.user, {
      displayName: name
    });

    alert("Account successfully created! 🎉");

    closeModals();

  } catch (error) {

    alert(error.message);

  }
}

/* ---------- LOGIN ---------- */

async function login() {

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {

    await window.firebaseFunctions.signInWithEmailAndPassword(
      window.firebaseAuth,
      email,
      password
    );

    alert("Login successful! ✅");

    closeModals();

  } catch (error) {

    alert(error.message);

  }
}

/* ---------- GOOGLE LOGIN ---------- */

async function googleLogin() {

  try {

    await window.firebaseFunctions.signInWithPopup(
      window.firebaseAuth,
      window.googleProvider
    );

    alert("Google login successful! 🎉");

    closeModals();

  } catch (error) {

    alert(error.message);

  }
}

/* ---------- LOGOUT ---------- */

async function logout() {

  try {

    await window.firebaseFunctions.signOut(
      window.firebaseAuth
    );

    alert("Logged out successfully.");

    document
      .getElementById("profileMenu")
      .classList.remove("show");

  } catch (error) {

    alert(error.message);

  }
}

/* ---------- UPLOAD TO CLOUDINARY ---------- */

async function uploadVideo() {

  const user = window.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  const file =
    document.getElementById("videoFile").files[0];

  const title =
    document.getElementById("videoTitle").value.trim();

  const description =
    document.getElementById("videoDescription").value.trim();

  const status =
    document.getElementById("uploadStatus");

  if (!file || !title) {
    alert("Please select a video and enter a title.");
    return;
  }

  status.textContent = "Uploading video... ⏳";

  try {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", "minituber");
    formData.append("asset_folder", "MiniTube");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dvvsxjid/video/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Upload failed");
    }

    await window.firebaseFunctions.addDoc(
      window.firebaseFunctions.collection(window.db, "videos"),
      {
        title: title,
        description: description,
        videoURL: data.secure_url,
        creator: user.displayName || "MiniTube User",
        creatorUID: user.uid,
        views: 0,
        likes: 0,
        createdAt:
          window.firebaseFunctions.serverTimestamp()
      }
    );

    status.textContent =
      "Video successfully uploaded! 🎉";

    document.getElementById("videoFile").value = "";
    document.getElementById("videoTitle").value = "";
    document.getElementById("videoDescription").value = "";

    setTimeout(() => {
      closeModals();
      loadVideos();
    }, 1200);

  } catch (error) {

    status.textContent = "Upload failed ❌";
    alert(error.message);

  }
}

/* ---------- LOAD VIDEOS ---------- */

async function loadVideos() {

  const grid =
    document.getElementById("videoGrid");

  if (!grid) return;

  grid.innerHTML = "Loading videos...";

  try {

    const q =
      window.firebaseFunctions.query(
        window.firebaseFunctions.collection(
          window.db,
          "videos"
        ),
        window.firebaseFunctions.orderBy(
          "createdAt",
          "desc"
        )
      );

    const snapshot =
      await window.firebaseFunctions.getDocs(q);

    grid.innerHTML = "";

    if (snapshot.empty) {

      grid.innerHTML =
        "<p>No videos uploaded yet.</p>";

      return;
    }

    snapshot.forEach(videoDoc => {

      const video = videoDoc.data();

      const card =
        document.createElement("div");

      card.className = "video-card";

      card.innerHTML = `
        <div class="thumbnail">
          <span>▶</span>
        </div>

        <div class="video-info">

          <div class="channel-avatar">
            ${(video.creator || "M").charAt(0).toUpperCase()}
          </div>

          <div>
            <h3>${escapeHTML(video.title || "Untitled Video")}</h3>
            <p>${escapeHTML(video.creator || "MiniTube User")}</p>
            <p>${video.views || 0} views</p>
          </div>

        </div>
      `;

      card.onclick = () =>
        openVideo(videoDoc.id, video);

      grid.appendChild(card);

    });

  } catch (error) {

    console.error(error);

    grid.innerHTML =
      "<p>Could not load videos.</p>";

  }
}

/* ---------- OPEN VIDEO ---------- */

async function openVideo(id, video) {

  currentVideoId = id;
  currentVideoData = video;

  document.querySelector(".hero").style.display = "none";
  document.querySelector(".video-section").style.display = "none";

  document.getElementById("videoPage").style.display = "block";

  const player =
    document.getElementById("mainVideo");

  player.src = video.videoURL;

  document.getElementById("mainVideoTitle").textContent =
    video.title || "Untitled Video";

  document.getElementById("mainVideoCreator").textContent =
    "By " + (video.creator || "MiniTube User");

  document.getElementById("likeCount").textContent =
    video.likes || 0;

  document.getElementById("downloadBtn").onclick = () => {

    const link = document.createElement("a");

    link.href = video.videoURL;
    link.download = (video.title || "MiniTube Video") + ".mp4";

    document.body.appendChild(link);
    link.click();
    link.remove();

  };

  try {

    await window.firebaseFunctions.updateDoc(
      window.firebaseFunctions.doc(
        window.db,
        "videos",
        id
      ),
      {
        views:
          window.firebaseFunctions.increment(1)
      }
    );

  } catch (error) {
    console.log(error);
  }

  loadComments();

  window.scrollTo(0, 0);
}

/* ---------- CLOSE VIDEO ---------- */

function closeVideo() {

  document.getElementById("videoPage").style.display = "none";

  document.querySelector(".hero").style.display = "block";
  document.querySelector(".video-section").style.display = "block";

  const player =
    document.getElementById("mainVideo");

  player.pause();
  player.src = "";

  currentVideoId = null;
  currentVideoData = null;
}

/* ---------- LIKE ---------- */

async function likeVideo() {

  if (!currentVideoId) return;

  try {

    await window.firebaseFunctions.updateDoc(
      window.firebaseFunctions.doc(
        window.db,
        "videos",
        currentVideoId
      ),
      {
        likes:
          window.firebaseFunctions.increment(1)
      }
    );

    const count =
      Number(
        document.getElementById("likeCount").textContent
      );

    document.getElementById("likeCount").textContent =
      count + 1;

  } catch (error) {

    alert(error.message);

  }
}

/* ---------- SHARE ---------- */

async function shareVideo() {

  const url = window.location.href;

  try {

    await navigator.clipboard.writeText(url);

    alert("Video link copied! 🔗");

  } catch {

    alert("Share link: " + url);

  }
}

/* ---------- COMMENTS ---------- */

async function addComment() {

  const user = window.currentUser;

  if (!user) {
    alert("Please login to comment.");
    openLogin();
    return;
  }

  if (!currentVideoId) return;

  const input =
    document.getElementById("commentInput");

  const text = input.value.trim();

  if (!text) {
    alert("Please write a comment.");
    return;
  }

  try {

    await window.firebaseFunctions.addDoc(

      window.firebaseFunctions.collection(
        window.db,
        "videos",
        currentVideoId,
        "comments"
      ),

      {
        text: text,
        userName:
          user.displayName || "MiniTube User",
        userUID: user.uid,
        userPhoto:
          user.photoURL || "",
        createdAt:
          window.firebaseFunctions.serverTimestamp()
      }

    );

    input.value = "";

    loadComments();

  } catch (error) {

    alert(error.message);

  }
}

/* ---------- LOAD COMMENTS ---------- */

async function loadComments() {

  const list =
    document.getElementById("commentsList");

  if (!list || !currentVideoId) return;

  list.innerHTML =
    "<p>Loading comments...</p>";

  try {

    const q =
      window.firebaseFunctions.query(

        window.firebaseFunctions.collection(
          window.db,
          "videos",
          currentVideoId,
          "comments"
        ),

        window.firebaseFunctions.orderBy(
          "createdAt",
          "desc"
        )

      );

    const snapshot =
      await window.firebaseFunctions.getDocs(q);

    list.innerHTML = "";

    if (snapshot.empty) {

      list.innerHTML =
        "<p>No comments yet. Be the first! 💬</p>";

      return;
    }

    snapshot.forEach(commentDoc => {

      const comment =
        commentDoc.data();

      const div =
        document.createElement("div");

      div.className = "comment";

      const avatar =
        comment.userPhoto ||
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          comment.userName || "U"
        );

      div.innerHTML = `

        <img
          class="comment-avatar"
          src="${avatar}"
        >

        <div class="comment-content">

          <strong>
            ${escapeHTML(
              comment.userName || "MiniTube User"
            )}
          </strong>

          <p>
            ${escapeHTML(comment.text || "")}
          </p>

        </div>

      `;

      list.appendChild(div);

    });

  } catch (error) {

    console.error(error);

    list.innerHTML =
      "<p>Comments could not be loaded.</p>";

  }
}

/* ---------- SEARCH ---------- */

function searchVideos() {

  const search =
    document
      .getElementById("searchInput")
      .value
      .toLowerCase()
      .trim();

  document
    .querySelectorAll(".video-card")
    .forEach(card => {

      const text =
        card.textContent.toLowerCase();

      card.style.display =
        !search || text.includes(search)
          ? ""
          : "none";

    });
}

/* ---------- SECURITY ---------- */

function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}

/* ---------- START ---------- */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadVideos();

    const input =
      document.getElementById("searchInput");

    if (input) {

      input.addEventListener(
        "keypress",
        event => {

          if (event.key === "Enter") {
            searchVideos();
          }

        }
      );

    }

  }
);
