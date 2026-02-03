import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

window.sendMessage = function () {
    const user = document.getElementById("username").value;
    const msg = document.getElementById("message").value;

    if (!user || !msg) return;

    push(chatRef, {
        user: user,
        message: msg,
        time: Date.now()
    });

    document.getElementById("message").value = "";
};

const chatBox = document.getElementById("chatBox");

onValue(chatRef, (snapshot) => {
    chatBox.innerHTML = "";
    snapshot.forEach(child => {
        const data = child.val();
        chatBox.innerHTML += `
            <div class="message">
                <span class="user">${data.user}:</span>
                <span>${data.message}</span>
            </div>
        `;
    });
    chatBox.scrollTop = chatBox.scrollHeight;
});
