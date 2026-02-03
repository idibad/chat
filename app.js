import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
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
let mediaRecorder;
let audioChunks = [];
const recordBtn = document.getElementById("recordBtn");
let recording = false;

recordBtn.addEventListener("click", async () => {
    try {
        if (!recording) {
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
        } else {
            if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
            }
            recording = false;
            recordBtn.innerHTML = `<i class="fa fa-microphone"></i>`;
        }
    } catch (err) {
        alert("Microphone access denied or not available");
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

        // Voice
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

        // Delete button
        if (data.user === currentUser) {
            const del = document.createElement("button");
            del.className = "delete-btn";
            del.innerHTML = `<i class="fa-solid fa-trash"></i>`;
            del.onclick = () => remove(ref(db, "messages/" + key));
            div.appendChild(del);
        }

        // Read receipt
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
        // if (data.user !== currentUser && !notifiedMessages.has(key)) {
        //     if ("Notification" in window && Notification.permission === "granted") {
        //         new Notification(`${data.user} sent a message`, {
        //             body: data.message || "Voice Message",
        //             icon: "https://cdn-icons-png.flaticon.com/512/2462/2462719.png"
        //         });
        //     }
        //     notifiedMessages.add(key);
        // }
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
