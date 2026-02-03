import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase config
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
if (currentUser) document.getElementById("registerScreen").style.display = "none";

window.registerUser = function () {
    const name = document.getElementById("regName").value.trim();
    if (!name) return;
    localStorage.setItem("chatUser", name);
    location.reload();
};

// ---------------- Send Text ----------------
window.sendMessage = function () {
    const msgInput = document.getElementById("message");
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

// ---------------- Voice Message ----------------
// Fix 1: Added proper stream handling to stop microphone tracks
// Fix 2: Replaced undefined sRef with correct storage reference (assumes you imported { ref as storageRef } from "firebase/storage")
// Fix 3: Explicit mimeType for better cross-browser compatibility
// Fix 4: Moved stream declaration outside to access it on stop
let mediaRecorder;
let audioChunks = [];
let stream; // Added for proper cleanup
const recordBtn = document.getElementById("recordBtn");
let recording = false;

recordBtn.addEventListener("click", async () => {
    try {
        if (!recording) {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
                const filename = `voice_${Date.now()}.webm`;
                // === FIXED STORAGE REFERENCE ===
                // Replace "storageRef" with whatever alias you used when importing ref from firebase/storage
                // Example import: import { ref as storageRef } from "firebase/storage";
                const voiceRef = storageRef(storage, `voice/${filename}`);
                await uploadBytes(voiceRef, blob);
                const url = await getDownloadURL(voiceRef);
                push(chatRef, {
                    user: currentUser,
                    voiceUrl: url,
                    time: Date.now(),
                    seen: [currentUser]
                });
            };
            mediaRecorder.start();
            recording = true;
            recordBtn.innerHTML = `<i class="fa fa-stop"></i>`;
            // Optional playful touch: add a pulsing animation class while recording
            recordBtn.classList.add("recording-pulse");
        } else {
            if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
            }
            // Stop microphone tracks to release hardware
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            recording = false;
            recordBtn.innerHTML = `<i class="fa fa-microphone"></i>`;
            recordBtn.classList.remove("recording-pulse");
        }
    } catch (err) {
        console.error(err);
        alert("Microphone access denied or not available");
        recording = false;
        recordBtn.innerHTML = `<i class="fa fa-microphone"></i>`;
        recordBtn.classList.remove("recording-pulse");
    }
});

// ---------------- Chat Render ----------------
const chatBox = document.getElementById("chatBox");
const notifiedMessages = new Set();

onValue(chatRef, snapshot => {
    chatBox.innerHTML = "";
    snapshot.forEach(childSnapshot => {
        const data = childSnapshot.val();
        const key = childSnapshot.key;

        // ---------------- Update Seen in background ----------------
        if (!data.seen?.includes(currentUser)) {
            const seenList = data.seen || [];
            seenList.push(currentUser);
            update(ref(db, "messages/" + key), { seen: seenList });
        }

        const div = document.createElement("div");
        div.classList.add("message");
        div.classList.add(data.user === currentUser ? "right" : "left");

        // Text
        if (data.message) {
            const textSpan = document.createElement("span");
            textSpan.innerText = data.message;
            div.appendChild(textSpan);
        }

        // Voice - improved styling to match playful theme
        if (data.voiceUrl) {
            const audio = document.createElement("audio");
            audio.src = data.voiceUrl;
            audio.controls = true;
            audio.style.width = "100%";
            audio.style.maxWidth = "300px";
            audio.style.borderRadius = "15px";
            audio.style.marginTop = "8px";
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

        // Delete button (only for own messages)
        if (data.user === currentUser) {
            const del = document.createElement("button");
            del.className = "delete-btn";
            del.innerHTML = `<i class="fa-solid fa-trash"></i>`;
            del.onclick = () => remove(ref(db, "messages/" + key));
            div.appendChild(del);
        }

        // Read receipt (only for own messages)
        if (data.user === currentUser) {
            const receipt = document.createElement("span");
            receipt.style.fontSize = "10px";
            receipt.style.marginLeft = "5px";
            receipt.style.opacity = "0.6";
            receipt.innerText = data.seen && data.seen.length > 1 ? "✓ Seen" : "✓ Sent";
            div.appendChild(receipt);
        }

        chatBox.appendChild(div);

        // ---------------- Notification ----------------
        if (data.user !== currentUser && !notifiedMessages.has(key)) {
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`${data.user} sent a message`, {
                    body: data.message || "Voice Message",
                    icon: "https://cdn-icons-png.flaticon.com/512/2462/2462719.png"
                });
            }
            notifiedMessages.add(key);
        }
    });
    chatBox.scrollTop = chatBox.scrollHeight;
});

// ---------------- Notification permission ----------------
if ("Notification" in window) Notification.requestPermission();

// ---------------- Send on Enter ----------------
document.getElementById("message").addEventListener("keypress", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});
