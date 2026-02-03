

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const chatBox = document.getElementById("chatBox");

onValue(chatRef, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach(child => {
        const data = child.val();
        const key = child.key;

        const div = document.createElement("div");
        div.classList.add("message");
        div.classList.add(data.user === currentUser ? "right" : "left");

        div.innerText = data.user + ": " + data.message;

        // Delete button for own messages
        if (data.user === currentUser) {
            const del = document.createElement("button");
            del.className = "delete-btn";
            del.innerHTML = `<i class="fa-solid fa-trash"></i>`;

            del.onclick = () => {
                remove(ref(db, "messages/" + key));
            };
            div.appendChild(del);
        }

        chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
});


document.getElementById("message").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

