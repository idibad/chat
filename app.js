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

// ---------- Current User ----------
let currentUser = localStorage.getItem("chatUser");

if (currentUser) {
    document.getElementById("registerScreen").style.display = "none";
    document.getElementById("currentUserDisplay").textContent = currentUser;
}

window.registerUser = function () {
    const name = document.getElementById("regName").value.trim();
    if (!name) return;
    localStorage.setItem("chatUser", name);
    location.reload();
};

// ---------- Elements ----------
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("message");
const notifSound = document.getElementById("notifSound");

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

// ---------- Helper ----------
function formatTime(ts) {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, "0") + ":" +
           d.getMinutes().toString().padStart(2, "0");
}

// ---------- Render Message ----------
function addMessage(key, data) {
    if (!data.message) return; // prevents undefined bug

    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(data.user === currentUser ? "right" : "left");
    div.id = key;

    // Message text
    // Username + Message
const text = document.createElement("div");
text.innerHTML = `<strong>${data.user}</strong>: ${data.message}`;
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
        receipt.innerText = data.seen.length > 1 ? "✓ Seen" : "- Sent";
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

    // Notification
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
