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
  setDoc,
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/* FIREBASE */

const firebaseConfig = {
  apiKey: "AIzaSyBBc_Ihgyl0-P7u_K6p0GKXkVpT2v5674Q",
  authDomain: "minitube-9317a.firebaseapp.com",
  projectId: "minitube-9317a",
  storageBucket: "minitube-9317a.firebasestorage.app",
  messagingSenderId: "176876768704",
  appId: "1:176876768704:web:051bd6a6ba27325e22cc25"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();


/* MODALS */

window.openLogin = function () {
  document.getElementById("signupModal").style.display = "none";
  document.getElementById("loginModal").style.display = "flex";
};

window.openSignup = function () {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("signupModal").style.display = "flex";
};

window.closeModals = function () {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("signupModal").style.display = "none";
};

window.switchToSignup = function () {
  openSignup();
};

window.switchToLogin = function () {
  openLogin();
};


/* SEARCH */

window.searchVideos = function () {

  const search =
    document.getElementById("searchInput")
      .value
      .toLowerCase()
      .trim();

  document.querySelectorAll(".video-card")
    .forEach(video => {

      const title =
        (video.dataset.title || "")
          .toLowerCase();

      video.style.display =
        title.includes(search) ? "" : "none";

    });
};


/* SIGNUP */

document
  .getElementById("signupBtn")
  .addEventListener("click", async () => {

    const name =
      document.getElementById("signupName")
        .value.trim();

    const username =
      document.getElementById("signupUsername")
        .value.trim();

    const email =
      document.getElementById("signupEmail")
        .value.trim();

    const password =
      document.getElementById("signupPassword")
        .value;

    if (!name || !username || !email || !password) {

      alert("Please fill all fields.");

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

      const user = result.user;

      await updateProfile(user, {
        displayName: name
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          name,
          username,
          email,
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

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  });


/* LOGIN */

document
  .getElementById("loginBtn")
  .addEventListener("click", async () => {

    const email =
      document.getElementById("loginEmail")
        .value.trim();

    const password =
      document.getElementById("loginPassword")
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

      alert("Login successful! 👋");

      closeModals();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  });


/* GOOGLE */

async function googleLogin() {

  try {

    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );

    const user = result.user;

    await setDoc(
      doc(db, "users", user.uid),
      {
        name:
          user.displayName || "",

        username: "",

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

  } catch (error) {

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


/* PROFILE */

function showProfile(user) {

  document.getElementById("headerButtons")
    .style.display = "none";

  document.getElementById("profileArea")
    .style.display = "block";

  document.getElementById("profileName")
    .textContent =
    user.displayName ||
    "MiniTube User";

  document.getElementById("profileEmail")
    .textContent =
    user.email || "";

  const photo =
    document.getElementById("profilePhoto");

  photo.src =
    user.photoURL ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(
      user.displayName || "User"
    );
}

function hideProfile() {

  document.getElementById("headerButtons")
    .style.display = "flex";

  document.getElementById("profileArea")
    .style.display = "none";
}


/* PROFILE MENU */

document
  .getElementById("profilePhoto")
  .addEventListener("click", () => {

    document
      .getElementById("profileMenu")
      .classList.toggle("show");

  });


/* LOGOUT */

window.logoutUser = async function () {

  try {

    await signOut(auth);

    alert(
      "Logged out successfully! 👋"
    );

  } catch (error) {

    console.error(error);

    alert(error.message);

  }

};


/* CHANNEL */

window.openChannel = function () {

  const user = auth.currentUser;

  if (!user) {

    alert("Please login first.");

    return;
  }

  document.getElementById("homePage")
    .style.display = "none";

  document.getElementById("uploadPage")
    .style.display = "none";

  document.getElementById("videoPage")
    .style.display = "none";

  document.getElementById("channelPage")
    .style.display = "block";

  document.getElementById("profileMenu")
    .classList.remove("show");

  document.getElementById("channelName")
    .textContent =
    user.displayName ||
    "MiniTube User";

  document.getElementById("channelEmail")
    .textContent =
    user.email || "";

  document.getElementById("channelPhoto")
    .src =
    user.photoURL ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(
      user.displayName || "User"
    );
};

window.closeChannel = function () {

  document.getElementById("channelPage")
    .style.display = "none";

  document.getElementById("homePage")
    .style.display = "block";
};


/* UPLOAD PAGE */

window.openUpload = function () {

  const user = auth.currentUser;

  if (!user) {

    alert("Please login first.");

    return;
  }

  document.getElementById("homePage")
    .style.display = "none";

  document.getElementById("channelPage")
    .style.display = "none";

  document.getElementById("videoPage")
    .style.display = "none";

  document.getElementById("uploadPage")
    .style.display = "block";

  document.getElementById("profileMenu")
    .classList.remove("show");
};

window.closeUpload = function () {

  document.getElementById("uploadPage")
    .style.display = "none";

  document.getElementById("homePage")
    .style.display = "block";
};


/* VIDEO PREVIEW */

const videoFile =
  document.getElementById("videoFile");

const videoPreview =
  document.getElementById("videoPreview");

videoFile.addEventListener(
  "change",
  () => {

    const file =
      videoFile.files[0];

    if (!file) {

      videoPreview.style.display =
        "none";

      return;
    }

    videoPreview.src =
      URL.createObjectURL(file);

    videoPreview.style.display =
      "block";
  }
);


/* CLOUDINARY UPLOAD */

window.previewUpload = async function () {

  const user = auth.currentUser;

  if (!user) {

    alert("Please login first.");

    return;
  }

  const file =
    videoFile.files[0];

  const title =
    document.getElementById("videoTitle")
      .value.trim();

  const description =
    document.getElementById("videoDescription")
      .value.trim();

  if (!file) {

    alert(
      "Please select a video first."
    );

    return;
  }

  if (!title) {

    alert(
      "Please enter a video title."
    );

    return;
  }

  const button =
    document.querySelector(".upload-btn");

  button.disabled = true;

  button.textContent =
    "Uploading... ⏳";

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

    formData.append(
      "asset_folder",
      "MiniTube"
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

    const videoURL =
      data.secure_url;


    /* FIRESTORE */

    await addDoc(
      collection(db, "videos"),
      {

        title,

        description,

        videoURL,

        creatorName:
          user.displayName ||
          "MiniTube User",

        creatorEmail:
          user.email || "",

        creatorUID:
          user.uid,

        creatorPhoto:
          user.photoURL || "",

        views: 0,

        likes: 0,

        createdAt:
          new Date().toISOString()

      }
    );


    button.textContent =
      "✅ Uploaded Successfully";

    alert(
      "Video uploaded and saved to MiniTube! 🎉"
    );

    document.getElementById("videoTitle")
      .value = "";

    document.getElementById(
      "videoDescription"
    ).value = "";

    videoFile.value = "";

    videoPreview.src = "";

    videoPreview.style.display =
      "none";

    await loadVideos();

    closeUpload();

  } catch (error) {

    console.error(error);

    alert(
      "Upload failed: " +
      error.message
    );

    button.disabled = false;

    button.textContent =
      "🎬 Upload Video";
  }
};


/* LOAD VIDEOS */

async function loadVideos() {

  const videoGrid =
    document.getElementById("videoGrid");

  try {

    const videosQuery =
      query(
        collection(db, "videos"),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const snapshot =
      await getDocs(videosQuery);


    snapshot.forEach(videoDoc => {

      const video =
        videoDoc.data();

      const card =
        document.createElement("div");

      card.className =
        "video-card";

      card.dataset.title =
        video.title || "";

      card.innerHTML = `

        <div class="thumbnail">

          <video
            src="${video.videoURL}"
            muted
            preload="metadata"
          ></video>

        </div>

        <div class="video-info">

          <div class="channel-avatar">

            ${
              video.creatorName
                ? escapeHTML(
                    video.creatorName
                      .charAt(0)
                      .toUpperCase()
                  )
                : "M"
            }

          </div>

          <div>

            <h3>
              ${escapeHTML(
                video.title ||
                "Untitled Video"
              )}
            </h3>

            <p>
              ${escapeHTML(
                video.creatorName ||
                "MiniTube Creator"
              )}
            </p>

            <p>
              👁️ ${
                Number(video.views || 0)
              } views
            </p>

          </div>

        </div>
      `;


      card.addEventListener(
        "click",
        () => {

          openVideoPage(
            videoDoc.id,
            video
          );

        }
      );

      videoGrid.prepend(card);

    });

  } catch (error) {

    console.error(
      "Could not load videos:",
      error
    );
  }
}


/* VIDEO PAGE */

let currentVideoId = null;

let currentVideoData = null;

window.openVideoPage =
async function (
  videoId,
  video
) {

  currentVideoId =
    videoId;

  currentVideoData =
    video;


  document.getElementById("homePage")
    .style.display = "none";

  document.getElementById("channelPage")
    .style.display = "none";

  document.getElementById("uploadPage")
    .style.display = "none";

  document.getElementById("videoPage")
    .style.display = "block";


  document.getElementById("mainVideo")
    .src =
    video.videoURL;


  document.getElementById("videoPageTitle")
    .textContent =
    video.title ||
    "Untitled Video";


  document.getElementById("videoCreator")
    .textContent =
    video.creatorName ||
    "MiniTube Creator";


  document.getElementById("videoViews")
    .textContent =
    "👁️ " +
    Number(video.views || 0) +
    " views";


  document.getElementById(
    "videoPageDescription"
  ).textContent =
    video.description ||
    "No description.";


  document.getElementById(
    "videoCreatorAvatar"
  ).textContent =
    video.creatorName
      ? video.creatorName
          .charAt(0)
          .toUpperCase()
      : "M";


  document.getElementById(
    "likeCount"
  ).textContent =
    Number(video.likes || 0);


  document.getElementById(
    "downloadBtn"
  ).href =
    video.videoURL;


  await increaseView(
    videoId,
    video
  );


  loadComments(videoId);

};


/* VIEWS */

async function increaseView(
  videoId,
  video
) {

  try {

    const videoRef =
      doc(
        db,
        "videos",
        videoId
      );

    await updateDoc(
      videoRef,
      {
        views:
          increment(1)
      }
    );

    const newViews =
      Number(video.views || 0) + 1;

    document.getElementById(
      "videoViews"
    ).textContent =
      "👁️ " +
      newViews +
      " views";

  } catch (error) {

    console.error(
      "View update failed:",
      error
    );
  }
}


/* LIKE */

document
  .getElementById("likeBtn")
  .addEventListener(
    "click",
    async () => {

      if (!currentVideoId) {
        return;
      }

      try {

        await updateDoc(
          doc(
            db,
            "videos",
            currentVideoId
          ),
          {
            likes:
              increment(1)
          }
        );

        const count =
          Number(
            document.getElementById(
              "likeCount"
            ).textContent
          ) + 1;

        document.getElementById(
          "likeCount"
        ).textContent =
          count;

      } catch (error) {

        console.error(error);

        alert(
          "Could not like video."
        );
      }
    }
  );


/* SHARE */

window.shareCurrentVideo =
async function () {

  const url =
    window.location.href;

  try {

    if (
      navigator.share
    ) {

      await navigator.share({
        title:
          currentVideoData?.title ||
          "MiniTube Video",

        url: url
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

    console.error(error);

  }
};


/* COMMENTS */

window.addComment =
async function () {

  const user =
    auth.currentUser;

  if (!user) {

    alert(
      "Please login to comment."
    );

    return;
  }

  if (!currentVideoId) {
    return;
  }

  const input =
    document.getElementById(
      "commentInput"
    );

  const text =
    input.value.trim();

  if (!text) {

    alert(
      "Write a comment first."
    );

    return;
  }

  try {

    await addDoc(
      collection(
        db,
        "videos",
        currentVideoId,
        "comments"
      ),
      {

        text,

        userName:
          user.displayName ||
          "MiniTube User",

        userUID:
          user.uid,

        createdAt:
          new Date().toISOString()

      }
    );

    input.value = "";

    await loadComments(
      currentVideoId
    );

  } catch (error) {

    console.error(error);

    alert(
      "Could not add comment."
    );
  }
};


/* LOAD COMMENTS */

async function loadComments(
  videoId
) {

  const list =
    document.getElementById(
      "commentsList"
    );

  list.innerHTML =
    "<p>Loading comments...</p>";

  try {

    const commentsQuery =
      query(
        collection(
          db,
          "videos",
          videoId,
          "comments"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const snapshot =
      await getDocs(
        commentsQuery
      );

    list.innerHTML = "";

    if (snapshot.empty) {

      list.innerHTML =
        "<p>No comments yet.</p>";

      return;
    }

    snapshot.forEach(
      commentDoc => {

        const comment =
          commentDoc.data();

        const div =
          document.createElement(
            "div"
          );

        div.className =
          "comment-item";

        div.innerHTML = `

          <div class="comment-author">
            ${escapeHTML(
              comment.userName ||
              "User"
            )}
          </div>

          <div class="comment-text">
            ${escapeHTML(
              comment.text ||
              ""
            )}
          </div>

        `;

        list.appendChild(div);

      }
    );

  } catch (error) {

    console.error(
      "Comments error:",
      error
    );

    list.innerHTML =
      "<p>Comments could not be loaded.</p>";
  }
}


/* CLOSE VIDEO */

window.closeVideoPage =
function () {

  const video =
    document.getElementById(
      "mainVideo"
    );

  video.pause();

  video.src = "";

  document.getElementById(
    "videoPage"
  ).style.display =
    "none";

  document.getElementById(
    "homePage"
  ).style.display =
    "block";
};


/* SECURITY */

function escapeHTML(text) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    text;

  return div.innerHTML;
}


/* AUTH STATE */

onAuthStateChanged(
  auth,
  user => {

    if (user) {

      showProfile(user);

    } else {

      hideProfile();

    }

  }
);


/* LOAD */

loadVideos();
