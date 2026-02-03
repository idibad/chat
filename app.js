
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCbdkDgRpRiof4c-9JjeuZEEfmpxV9eM2g",
    authDomain: "chat-948ed.firebaseapp.com",
    projectId: "chat-948ed",
    storageBucket: "chat-948ed.firebasestorage.app",
    messagingSenderId: "892172240411",
    appId: "1:892172240411:web:92d9c62834db6929479abe",
    measurementId: "G-4ML1K78PBZ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const chatRef = ref(db, "messages");

let currentUser = localStorage.getItem("chatUser");

window.registerUser = function () {
    const name = document.getElementById("regName").value.trim();
    if (!name) return;
    localStorage.setItem("chatUser", name);
    location.reload();
};

if (currentUser) {
    document.getElementById("registerScreen").style.display = "none";
}

// ---------------- Send Text Message ----------------
window.sendMessage = function () {
    const msgInput = document.getElementById("message");
    const msg = msgInput.value.trim();
    if (!msg) return;

    push(chatRef, {
        user: currentUser,
        message: msg,
        time: Date.now()
    });

    msgInput.value = "";
};

// ---------------- Voice Message ----------------
let mediaRecorder;
let audioChunks = [];

const recordBtn = document.createElement("button");
recordBtn.id = "recordBtn";
recordBtn.innerHTML = `<i class="fa fa-microphone"></i>`;
recordBtn.style.marginLeft = "5px";
document.querySelector(".chat-input").appendChild(recordBtn);

recordBtn.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

        mediaRecorder.onstop = async () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const filename = `voice_${Date.now()}.webm`;
            const storageRef = sRef(storage, `voice/${filename}`);
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);

            // Save voice message in DB
            push(chatRef, {
                user: currentUser,
                voiceUrl: url,
                time: Date.now()
            });
        };

        mediaRecorder.start();
        recordBtn.innerHTML = `<i class="fa fa-stop"></i>`;
    } else {
        // Stop recording
        mediaRecorder.stop();
        recordBtn.innerHTML = `<i class="fa fa-microphone"></i>`;
    }
});

// ---------------- Chat Display & Notifications ----------------
const chatBox = document.getElementById("chatBox");

onValue(chatRef, (snapshot) => {
    chatBox.innerHTML = ""; // clear old messages

    if (!snapshot.exists()) return; // nothing to show yet

    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const key = childSnapshot.key;

        const div = document.createElement("div");
        div.classList.add("message");
        div.classList.add(data.user === currentUser ? "right" : "left");

        // Text message
        if (data.message) {
            const textSpan = document.createElement("span");
            textSpan.innerText = data.message;
            div.appendChild(textSpan);
        }

        // Voice message
        if (data.voiceUrl) {
            const audio = document.createElement("audio");
            audio.src = data.voiceUrl;
            audio.controls = true;
            audio.style.marginTop = "5px";
            audio.style.borderRadius = "10px";
            div.appendChild(audio);
        }

        // Timestamp
        if (data.time) {
            const timeSpan = document.createElement("div");
            const date = new Date(data.time);
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            timeSpan.innerText = `${hours}:${minutes}`;
            timeSpan.style.fontSize = "10px";
            timeSpan.style.marginTop = "4px";
            timeSpan.style.opacity = "0.6";
            div.appendChild(timeSpan);
        }

        // Delete button for your messages
        if (data.user === currentUser) {
            const del = document.createElement("button");
            del.className = "delete-btn";
            del.innerHTML = `<i class="fa-solid fa-trash"></i>`;
            del.onclick = () => remove(ref(db, "messages/" + key));
            div.appendChild(del);
        }

        chatBox.appendChild(div);

        // Browser notification for other users
        if (data.user !== currentUser && Notification.permission === "granted") {
            new Notification(`${data.user} sent a message`, {
                body: data.message || "Voice Message",
                icon: "https://cdn-icons-png.flaticon.com/512/2462/2462719.png"
            });
        }
    });

    chatBox.scrollTop = chatBox.scrollHeight;
});

// ---------------- Notifications Permission ----------------
if ("Notification" in window) Notification.requestPermission();

// ---------------- Send on Enter ----------------
document.getElementById("message").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});


// // Firebase imports
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
// import { 
//     getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
//     signOut, onAuthStateChanged 
// } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// // TODO: Replace with your Firebase config
//   const firebaseConfig = {
//     apiKey: "AIzaSyCbdkDgRpRiof4c-9JjeuZEEfmpxV9eM2g",
//     authDomain: "chat-948ed.firebaseapp.com",
//     projectId: "chat-948ed",
//     storageBucket: "chat-948ed.firebasestorage.app",
//     messagingSenderId: "892172240411",
//     appId: "1:892172240411:web:92d9c62834db6929479abe",
//     measurementId: "G-4ML1K78PBZ"
//   };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);
// const auth = getAuth(app);
// const chatRef = ref(db, "messages");

// const chatBox = document.getElementById("chatBox");
// let currentUser = null;
// let isLogin = true;

// // ---------------- Auth functions ----------------

// window.toggleAuth = function() {
//     isLogin = !isLogin;
//     document.getElementById("authTitle").innerText = isLogin ? "Login" : "Register";
//     document.getElementById("authBtn").innerText = isLogin ? "Login" : "Register";
//     document.getElementById("toggleAuth").innerHTML = isLogin
//         ? `Don't have an account? <span onclick="toggleAuth()">Register</span>`
//         : `Already have an account? <span onclick="toggleAuth()">Login</span>`;
// };

// window.loginUser = function() {
//     const email = document.getElementById("email").value.trim();
//     const password = document.getElementById("password").value.trim();
//     if (!email || !password) return alert("Fill all fields!");

//     if (isLogin) {
//         signInWithEmailAndPassword(auth, email, password)
//             .catch(err => alert(err.message));
//     } else {
//         createUserWithEmailAndPassword(auth, email, password)
//             .catch(err => alert(err.message));
//     }
// };

// window.logoutUser = function() {
//     signOut(auth);
// };

// // ---------------- Auth State ----------------

// onAuthStateChanged(auth, (user) => {
//     if (user) {
//         currentUser = user.email.split("@")[0]; // simple display name
//         document.getElementById("authScreen").style.display = "none";
//         document.getElementById("chatScreen").style.display = "flex";
//     } else {
//         currentUser = null;
//         document.getElementById("authScreen").style.display = "flex";
//         document.getElementById("chatScreen").style.display = "none";
//     }
// });

// // ---------------- Send Message ----------------

// window.sendMessage = function() {
//     const msgInput = document.getElementById("message");
//     const msg = msgInput.value.trim();
//     if (!msg || !currentUser) return;

//     push(chatRef, {
//         user: currentUser,
//         message: msg,
//         time: Date.now()
//     });

//     msgInput.value = "";
// };

// // ---------------- Listen for Messages ----------------

// onValue(chatRef, (snapshot) => {
//     chatBox.innerHTML = "";
//     if (!snapshot.exists()) return;

//     snapshot.forEach((childSnapshot) => {
//         const data = childSnapshot.val();
//         const key = childSnapshot.key;

//         const div = document.createElement("div");
//         div.classList.add("message");
//         div.classList.add(data.user === currentUser ? "right" : "left");

//         // Message text
//         const textSpan = document.createElement("span");
//         textSpan.innerText = data.message;
//         div.appendChild(textSpan);

//         // Timestamp
//         if (data.time) {
//             const timeSpan = document.createElement("div");
//             const date = new Date(data.time);
//             const hours = date.getHours().toString().padStart(2,"0");
//             const minutes = date.getMinutes().toString().padStart(2,"0");
//             timeSpan.innerText = `${hours}:${minutes}`;
//             timeSpan.style.fontSize = "10px";
//             timeSpan.style.marginTop = "4px";
//             timeSpan.style.opacity = "0.6";
//             div.appendChild(timeSpan);
//         }

//         // Delete button for your messages
//         if (data.user === currentUser) {
//             const del = document.createElement("button");
//             del.className = "delete-btn";
//             del.innerHTML = `<i class="fa-solid fa-trash"></i>`;
//             del.onclick = () => remove(ref(db, "messages/" + key));
//             div.appendChild(del);
//         }

//         chatBox.appendChild(div);
//     });

//     chatBox.scrollTop = chatBox.scrollHeight;
// });

// // ---------------- Send on Enter ----------------

// document.getElementById("message").addEventListener("keypress", function(e) {
//     if (e.key === "Enter") {
//         e.preventDefault();
//         sendMessage();
//     }
// });
