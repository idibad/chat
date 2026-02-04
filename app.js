import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onChildRemoved,
  onChildChanged,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ---------- Firebase Config ----------
const firebaseConfig = { 
  apiKey: "AIzaSyCbdkDgRpRiof4c-9JjeuZEEfmpxV9eM2g",
  authDomain: "chat-948ed.firebaseapp.com",
  projectId: "chat-948ed",
  storageBucket: "chat-948ed.firebasestorage.app",
  messagingSenderId: "892172240411",
  appId: "1:892172240411:web:92d9c62834db6929479abe"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const chatRef = ref(db, "messages");

// ---------- Elements ----------
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("message");
const notifSound = document.getElementById("notifSound");
const registerScreen = document.getElementById("registerScreen");
const chatContainer = document.querySelector(".chat-container");

// ---------- Current User ----------
let currentUser = localStorage.getItem("chatUser");

if (currentUser) {
    registerScreen.style.display = "none";
    chatContainer.style.display = "flex";
    document.getElementById("currentUserDisplay").textContent = currentUser;
} else {
    chatContainer.style.display = "none";
}

// ---------- Register ----------
window.registerUser = function () {
    const name = document.getElementById("regName").value.trim();
    if (!name) return;
    localStorage.setItem("chatUser", name);
    location.reload();
};

// ---------- Send Message ----------
window.sendMessage = function () {
    const msg = msgInput.value.trim();
    if (!msg) return;

    push(chatRef, {
        user: currentUser,
        message: msg,
        time: Date.now(),
        seen: [currentUser]
    });

    msgInput.value = "";
};

msgInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

// ---------- Helpers ----------
function formatTime(ts) {
    const d = new Date(ts);

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12

    return `${hours}:${minutes} ${ampm}`;
}


function getUserColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue},70%,85%)`;
}

// ---------- Render Message ----------
function addMessage(key, data) {
    if (!data.message) return;

    const div = document.createElement("div");
    div.classList.add("message");
    div.id = key;

    // Color per user
    div.style.background = getUserColor(data.user);
    div.style.alignSelf = data.user === currentUser ? "flex-end" : "flex-start";

    // Username + message
    const text = document.createElement("div");
    text.innerHTML = `<strong style="text-transform: capitalize;">${data.user}</strong><br> ${data.message}`;
    div.appendChild(text);

    // Time
    const time = document.createElement("div");
    time.style.fontSize = "10px";
    time.style.opacity = "0.6";
    time.style.marginTop = "4px";
    time.textContent = formatTime(data.time);
    div.appendChild(time);

    // Delete + receipt for own message
    if (data.user === currentUser) {
        const del = document.createElement("button");
        del.className = "delete-btn";
        del.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        del.onclick = () => remove(ref(db, "messages/" + key));
        div.appendChild(del);

        const receipt = document.createElement("span");
        receipt.className = "receipt";
        receipt.style.fontSize = "10px";
        receipt.style.marginLeft = "6px";
        receipt.style.opacity = "0.7";
        receipt.innerText = data.seen.length > 1 ? "✓ Seen" : "✓ Sent";
        div.appendChild(receipt);
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Mark seen instantly
    if (!data.seen.includes(currentUser)) {
        update(ref(db, "messages/" + key), {
            seen: [...data.seen, currentUser]
        });
    }

    // Notification sound
    if (data.user !== currentUser && document.hidden) {
        notifSound.play().catch(() => {});
    }
}

// ---------- Firebase Listeners ----------
onChildAdded(chatRef, snap => addMessage(snap.key, snap.val()));

onChildRemoved(chatRef, snap => {
    const el = document.getElementById(snap.key);
    if (el) el.remove();
});

onChildChanged(chatRef, snap => {
    const el = document.getElementById(snap.key);
    if (!el) return;

    const receipt = el.querySelector(".receipt");
    if (receipt) {
        const data = snap.val();
        receipt.innerText = data.seen.length > 1 ? "✓ Seen" : "✓ Sent";
    }
});
