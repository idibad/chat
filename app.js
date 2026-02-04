import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push,
  onChildAdded, onChildRemoved, onChildChanged,
  update, remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase
const app = initializeApp({
  apiKey: "AIzaSyCbdkDgRpRiof4c-9JjeuZEEfmpxV9eM2g",
  authDomain: "chat-948ed.firebaseapp.com",
  projectId: "chat-948ed",
  storageBucket: "chat-948ed.appspot.com",
  messagingSenderId: "892172240411",
  appId: "1:892172240411:web:92d9c62834db6929479abe",
});

const db = getDatabase(app);
const chatRef = ref(db, "messages");

// User
let currentUser = localStorage.getItem("chatUser");
if (currentUser) {
  document.getElementById("registerScreen").style.display = "none";
  document.getElementById("currentUserDisplay").textContent = currentUser;
}

window.registerUser = () => {
  const name = regName.value.trim();
  if (!name) return;
  localStorage.setItem("chatUser", name);
  location.reload();
};

// Elements
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("message");
const notifSound = document.getElementById("notifSound");

// Send text
window.sendMessage = () => {
  const msg = msgInput.value.trim();
  if (!msg) return;

  push(chatRef, {
    user: currentUser,
    type: "text",
    content: msg,
    time: Date.now(),
    seen: [currentUser]
  });

  msgInput.value = "";
};

// Create message DOM once
function createMessage(key, data) {
  const div = document.createElement("div");
  div.className = `message ${data.user === currentUser ? "right" : "left"}`;
  div.id = key;

  if (data.type === "text") {
    div.innerHTML += `<span>${data.content}</span>`;
  }

  if (data.type === "voice") {
    div.innerHTML += `<audio controls src="${data.content}"></audio>`;
  }

  const time = new Date(data.time);
  div.innerHTML += `<div style="font-size:10px;opacity:.6;margin-top:4px">
      ${time.getHours().toString().padStart(2,"0")}:${time.getMinutes().toString().padStart(2,"0")}
    </div>`;

  if (data.user === currentUser) {
    const del = document.createElement("button");
    del.className = "delete-btn";
    del.innerHTML = `<i class="fa-solid fa-trash"></i>`;
    del.onclick = () => remove(ref(db, "messages/" + key));
    div.appendChild(del);

    const receipt = document.createElement("span");
    receipt.className = "receipt";
    receipt.style.fontSize = "10px";
    receipt.style.opacity = "0.6";
    receipt.innerText = data.seen.length > 1 ? "✓ Seen" : "✓ Sent";
    div.appendChild(receipt);
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Seen update instantly
  if (!data.seen.includes(currentUser)) {
    update(ref(db, "messages/" + key), {
      seen: [...data.seen, currentUser]
    });
  }

  // Notification only for other user's new message
  if (data.user !== currentUser && document.hidden) {
    notifSound.play().catch(()=>{});
  }
}

// Real-time events
onChildAdded(chatRef, snap => createMessage(snap.key, snap.val()));

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

// Enter key
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});
