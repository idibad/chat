

// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

//   const firebaseConfig = {
//     apiKey: "AIzaSyCbdkDgRpRiof4c-9JjeuZEEfmpxV9eM2g",
//     authDomain: "chat-948ed.firebaseapp.com",
//     projectId: "chat-948ed",
//     storageBucket: "chat-948ed.firebasestorage.app",
//     messagingSenderId: "892172240411",
//     appId: "1:892172240411:web:92d9c62834db6929479abe",
//     measurementId: "G-4ML1K78PBZ"
//   };

// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);
// const chatRef = ref(db, "messages");

// let currentUser = localStorage.getItem("chatUser");

// window.registerUser = function () {
//     const name = document.getElementById("regName").value.trim();
//     if (!name) return;
//     localStorage.setItem("chatUser", name);
//     location.reload();
// };

// if (currentUser) {
//     document.getElementById("registerScreen").style.display = "none";
// }

// window.sendMessage = function () {
//     const msgInput = document.getElementById("message");
//     const msg = msgInput.value.trim();
//     if (!msg) return;

//     push(chatRef, {
//         user: currentUser,
//         message: msg,
//         time: Date.now()
//     });

//     msgInput.value = "";
// };
// const chatBox = document.getElementById("chatBox");

// onValue(chatRef, (snapshot) => {
//     chatBox.innerHTML = ""; // clear old messages

//     if (!snapshot.exists()) return; // nothing to show yet

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
//             const hours = date.getHours().toString().padStart(2, "0");
//             const minutes = date.getMinutes().toString().padStart(2, "0");
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

//     // Scroll to bottom
//     chatBox.scrollTop = chatBox.scrollHeight;
// });


// //==========


// document.getElementById("message").addEventListener("keypress", function (e) {
//     if (e.key === "Enter") {
//         e.preventDefault();
//         sendMessage();
//     }
// });

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TODO: Replace with your Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DB_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const chatRef = ref(db, "messages");

const chatBox = document.getElementById("chatBox");
let currentUser = null;
let isLogin = true;

// ---------------- Auth functions ----------------

window.toggleAuth = function() {
    isLogin = !isLogin;
    document.getElementById("authTitle").innerText = isLogin ? "Login" : "Register";
    document.getElementById("authBtn").innerText = isLogin ? "Login" : "Register";
    document.getElementById("toggleAuth").innerHTML = isLogin
        ? `Don't have an account? <span onclick="toggleAuth()">Register</span>`
        : `Already have an account? <span onclick="toggleAuth()">Login</span>`;
};

window.loginUser = function() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) return alert("Fill all fields!");

    if (isLogin) {
        signInWithEmailAndPassword(auth, email, password)
            .catch(err => alert(err.message));
    } else {
        createUserWithEmailAndPassword(auth, email, password)
            .catch(err => alert(err.message));
    }
};

window.logoutUser = function() {
    signOut(auth);
};

// ---------------- Auth State ----------------

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user.email.split("@")[0]; // simple display name
        document.getElementById("authScreen").style.display = "none";
        document.getElementById("chatScreen").style.display = "flex";
    } else {
        currentUser = null;
        document.getElementById("authScreen").style.display = "flex";
        document.getElementById("chatScreen").style.display = "none";
    }
});

// ---------------- Send Message ----------------

window.sendMessage = function() {
    const msgInput = document.getElementById("message");
    const msg = msgInput.value.trim();
    if (!msg || !currentUser) return;

    push(chatRef, {
        user: currentUser,
        message: msg,
        time: Date.now()
    });

    msgInput.value = "";
};

// ---------------- Listen for Messages ----------------

onValue(chatRef, (snapshot) => {
    chatBox.innerHTML = "";
    if (!snapshot.exists()) return;

    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const key = childSnapshot.key;

        const div = document.createElement("div");
        div.classList.add("message");
        div.classList.add(data.user === currentUser ? "right" : "left");

        // Message text
        const textSpan = document.createElement("span");
        textSpan.innerText = data.message;
        div.appendChild(textSpan);

        // Timestamp
        if (data.time) {
            const timeSpan = document.createElement("div");
            const date = new Date(data.time);
            const hours = date.getHours().toString().padStart(2,"0");
            const minutes = date.getMinutes().toString().padStart(2,"0");
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
    });

    chatBox.scrollTop = chatBox.scrollHeight;
});

// ---------------- Send on Enter ----------------

document.getElementById("message").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});
