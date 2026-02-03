
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ---------- Firebase Config ----------
// // Firebase config
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

// ---------- Chat Elements ----------
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("message");
const notifSound = document.getElementById("notifSound");

// ---------- Send Text Message ----------
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

// ---------- Seen Update ----------
function updateSeen(snapshot) {
    const updates = {};
    snapshot.forEach(childSnapshot => {
        const data = childSnapshot.val();
        const key = childSnapshot.key;
        if (!data.seen?.includes(currentUser)) {
            updates[`messages/${key}/seen`] = [...(data.seen || []), currentUser];
        }
    });
    if (Object.keys(updates).length > 0) update(ref(db), updates);
}

// Mark unseen messages as seen when tab becomes visible
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        get(chatRef).then(snapshot => updateSeen(snapshot));
    }
});

// ---------- Render Chat ----------
let isInitialLoad = true;
let previousMessageCount = 0;

onValue(chatRef, snapshot => {
    chatBox.innerHTML = "";

    const currentCount = snapshot.numChildren();

    snapshot.forEach(childSnapshot => {
        const data = childSnapshot.val();
        const key = childSnapshot.key;

        const div = document.createElement("div");
        div.classList.add("message");
        div.classList.add(data.user === currentUser ? "right" : "left");

        // Text
        if (data.message) {
            const textSpan = document.createElement("span");
            textSpan.innerText = data.message;
            div.appendChild(textSpan);
        }

        // Fallback for any old voice messages (simple browser audio player)
        if (data.voiceUrl) {
            const audio = document.createElement("audio");
            audio.src = data.voiceUrl;
            audio.controls = true;
            audio.style.width = "100%";
            audio.style.maxWidth = "300px";
            audio.style.marginTop = "10px";
            audio.style.borderRadius = "15px";
            div.appendChild(audio);
        }

        // Timestamp
        if (data.time) {
            const date = new Date(data.time);
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const timeSpan = document.createElement("div");
            timeSpan.innerText = `${hours}:${minutes}`;
            timeSpan.style.fontSize = "10px";
            timeSpan.style.marginTop = "4px";
            timeSpan.style.opacity = "0.6";
            div.appendChild(timeSpan);
        }

        // Delete button (only own messages)
        if (data.user === currentUser) {
            const del = document.createElement("button");
            del.className = "delete-btn";
            del.innerHTML = `<i class="fa-solid fa-trash"></i>`;
            del.onclick = () => remove(ref(db, "messages/" + key));
            div.appendChild(del);
        }

        // Read receipt (only own messages)
        if (data.user === currentUser) {
            const receipt = document.createElement("span");
            receipt.style.fontSize = "10px";
            receipt.style.marginLeft = "5px";
            receipt.style.opacity = "0.6";
            receipt.innerText = data.seen && data.seen.length > 1 ? "✓ Seen" : "✓ Sent";
            div.appendChild(receipt);
        }

        chatBox.appendChild(div);
    });

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    // Update seen when tab is visible
    if (!document.hidden) updateSeen(snapshot);

    // Play notification sound only for real new messages (not on load/reconnect)
    if (!isInitialLoad && currentCount > previousMessageCount && document.hidden) {
        notifSound.play().catch(e => console.log("Sound play blocked:", e));
    }

    previousMessageCount = currentCount;
    if (isInitialLoad) isInitialLoad = false;
});

// ---------- Send on Enter ----------
msgInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});
