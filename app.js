// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
// import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// // Firebase config
// const firebaseConfig = { 
//   apiKey: "AIzaSyCbdkDgRpRiof4c-9JjeuZEEfmpxV9eM2g",
//   authDomain: "chat-948ed.firebaseapp.com",
//   projectId: "chat-948ed",
//   storageBucket: "chat-948ed.firebasestorage.app",
//   messagingSenderId: "892172240411",
//   appId: "1:892172240411:web:92d9c62834db6929479abe",
//   measurementId: "G-4ML1K78PBZ"
// };


// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);
// const storage = getStorage(app);
// const chatRef = ref(db, "messages");
// let currentUser = localStorage.getItem("chatUser");
// if (currentUser) document.getElementById("registerScreen").style.display = "none";

// window.registerUser = function () {
//     const name = document.getElementById("regName").value.trim();
//     if (!name) return;
//     localStorage.setItem("chatUser", name);
//     location.reload();
// };

// // ---------------- Send Text ----------------
// window.sendMessage = function () {
//     const msgInput = document.getElementById("message");
//     const msg = msgInput.value.trim();
//     if (!msg) return;
//     push(chatRef, {
//         user: currentUser,
//         message: msg,
//         time: Date.now(),
//         seen: [currentUser]
//     });
//     msgInput.value = "";
// };

// // ---------------- Voice Message ----------------
// let mediaRecorder;
// let audioChunks = [];
// let stream;
// const recordBtn = document.getElementById("recordBtn");
// let recording = false;

// recordBtn.addEventListener("click", async () => {
//     try {
//         if (!recording) {
//             stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//             mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
//             audioChunks = [];
//             mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
//             mediaRecorder.onstop = async () => {
//                 const blob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
//                 const filename = `voice_${Date.now()}.webm`;
//                 const voiceRef = storageRef(storage, `voice/${filename}`);
//                 await uploadBytes(voiceRef, blob);
//                 const url = await getDownloadURL(voiceRef);
//                 push(chatRef, {
//                     user: currentUser,
//                     voiceUrl: url,
//                     time: Date.now(),
//                     seen: [currentUser]
//                 });
//             };
//             mediaRecorder.start();
//             recording = true;
//             recordBtn.innerHTML = `<i class="fa fa-stop"></i>`;
//             recordBtn.classList.add("recording");
//         } else {
//             if (mediaRecorder && mediaRecorder.state === "recording") {
//                 mediaRecorder.stop();
//             }
//             if (stream) {
//                 stream.getTracks().forEach(track => track.stop());
//             }
//             recording = false;
//             recordBtn.innerHTML = `<i class="fa fa-microphone"></i>`;
//             recordBtn.classList.remove("recording");
//         }
//     } catch (err) {
//         console.error(err);
//         alert("Microphone access denied or not available");
//         recording = false;
//         recordBtn.innerHTML = `<i class="fa fa-microphone"></i>`;
//         recordBtn.classList.remove("recording");
//     }
// });

// // ---------------- Seen Update Logic ----------------
// function updateSeen(snapshot) {
//     const updates = {};
//     snapshot.forEach(childSnapshot => {
//         const data = childSnapshot.val();
//         const key = childSnapshot.key;
//         if (!data.seen?.includes(currentUser)) {
//             updates[`messages/${key}/seen`] = [...(data.seen || []), currentUser];
//         }
//     });
//     if (Object.keys(updates).length > 0) {
//         update(ref(db), updates);
//     }
// }

// // Call when tab becomes visible (marks any pending unseen messages as seen)
// document.addEventListener("visibilitychange", () => {
//     if (!document.hidden) {
//         get(chatRef).then(snapshot => updateSeen(snapshot));
//     }
// });

// // ---------------- Chat Render ----------------
// const chatBox = document.getElementById("chatBox");
// const notifiedMessages = new Set();

// onValue(chatRef, snapshot => {
//     chatBox.innerHTML = "";
//     snapshot.forEach(childSnapshot => {
//         const data = childSnapshot.val();
//         const key = childSnapshot.key;

//         const div = document.createElement("div");
//         div.classList.add("message");
//         div.classList.add(data.user === currentUser ? "right" : "left");

//         // Text
//         if (data.message) {
//             const textSpan = document.createElement("span");
//             textSpan.innerText = data.message;
//             div.appendChild(textSpan);
//         }

//         // Voice Message - Custom playful player
//         if (data.voiceUrl) {
//             const voiceContainer = document.createElement("div");
//             voiceContainer.className = "voice-message";

//             const playBtn = document.createElement("button");
//             playBtn.className = "play-btn";

//             const audio = document.createElement("audio");
//             audio.src = data.voiceUrl;
//             audio.preload = "metadata";
//             audio.controls = false; // Hidden - we use custom controls

//             const waveform = document.createElement("div");
//             waveform.className = "waveform";
//             for (let i = 0; i < 5; i++) {
//                 const bar = document.createElement("div");
//                 bar.className = "bar";
//                 waveform.appendChild(bar);
//             }

//             const timeSpan = document.createElement("span");
//             timeSpan.className = "voice-time";
//             timeSpan.innerText = "0:00";

//             audio.onloadedmetadata = () => {
//                 const dur = audio.duration || 0;
//                 const mins = Math.floor(dur / 60);
//                 const secs = Math.floor(dur % 60).toString().padStart(2, "0");
//                 timeSpan.innerText = mins > 0 ? `${mins}:${secs}` : `0:${secs}`;
//             };

//             const updatePlayState = () => {
//                 if (audio.paused) {
//                     playBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
//                     voiceContainer.classList.remove("playing");
//                 } else {
//                     playBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
//                     voiceContainer.classList.add("playing");
//                 }
//             };

//             playBtn.onclick = () => {
//                 if (audio.paused) audio.play();
//                 else audio.pause();
//                 updatePlayState();
//             };

//             audio.onplay = () => updatePlayState();
//             audio.onpause = audio.onended = () => updatePlayState();

//             updatePlayState(); // initial

//             voiceContainer.appendChild(playBtn);
//             voiceContainer.appendChild(waveform);
//             voiceContainer.appendChild(timeSpan);
//             voiceContainer.appendChild(audio); // hidden
//             div.appendChild(voiceContainer);
//         }

//         // Timestamp
//         if (data.time) {
//             const date = new Date(data.time);
//             const hours = date.getHours().toString().padStart(2, "0");
//             const minutes = date.getMinutes().toString().padStart(2, "0");
//             const timeSpan = document.createElement("div");
//             timeSpan.innerText = `${hours}:${minutes}`;
//             timeSpan.style.fontSize = "10px";
//             timeSpan.style.marginTop = "4px";
//             timeSpan.style.opacity = "0.6";
//             div.appendChild(timeSpan);
//         }

//         // Delete button
//         if (data.user === currentUser) {
//             const del = document.createElement("button");
//             del.className = "delete-btn";
//             del.innerHTML = `<i class="fa-solid fa-trash"></i>`;
//             del.onclick = () => remove(ref(db, "messages/" + key));
//             div.appendChild(del);
//         }

//         // Read receipt
//         if (data.user === currentUser) {
//             const receipt = document.createElement("span");
//             receipt.style.fontSize = "10px";
//             receipt.style.marginLeft = "5px";
//             receipt.style.opacity = "0.6";
//             receipt.innerText = data.seen && data.seen.length > 1 ? "✓ Seen" : "✓ Sent";
//             div.appendChild(receipt);
//         }

//         chatBox.appendChild(div);

//         // ---------------- Notification (only when tab is hidden) ----------------
//         if (data.user !== currentUser && !notifiedMessages.has(key) && document.hidden) {
//             if ("Notification" in window && Notification.permission === "granted") {
//                 new Notification(`${data.user} sent a message`, {
//                     body: data.message || "Voice Message",
//                     icon: "https://cdn-icons-png.flaticon.com/512/2462/2462719.png"
//                 });
//             }
//             notifiedMessages.add(key);
//         }
//     });

//     // Mark messages as seen ONLY when tab is visible
//     if (!document.hidden) {
//         updateSeen(snapshot);
//     }

//     chatBox.scrollTop = chatBox.scrollHeight;
// });

// // ---------------- Notification permission ----------------
// if ("Notification" in window) Notification.requestPermission();

// // ---------------- Send on Enter ----------------
// document.getElementById("message").addEventListener("keypress", e => {
//     if (e.key === "Enter") {
//         e.preventDefault();
//         sendMessage();
//     }
// });


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ---------- Firebase Config ----------
// const firebaseConfig = { 
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

// ---------- Current User ----------
let currentUser = localStorage.getItem("chatUser");
if (currentUser) document.getElementById("registerScreen").style.display = "none";

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
const notifiedMessages = new Set();

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

// ---------- Voice Message ----------
let mediaRecorder;
let audioChunks = [];
let stream;
let recording = false;
const recordBtn = document.getElementById("recordBtn");

recordBtn.addEventListener("click", async () => {
    try {
        if (!recording) {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            audioChunks = [];

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

            mediaRecorder.onstop = async () => {
                if (audioChunks.length === 0) return;
                const blob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
                const filename = `voice_${Date.now()}.webm`;
                const voiceRef = sRef(storage, `voice/${filename}`);
                await uploadBytes(voiceRef, blob);
                const url = await getDownloadURL(voiceRef);

                // Push to Firebase
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
            recordBtn.classList.add("recording");

        } else {
            if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
            if (stream) stream.getTracks().forEach(track => track.stop());

            recording = false;
            recordBtn.innerHTML = `<i class="fa fa-microphone"></i>`;
            recordBtn.classList.remove("recording");
        }
    } catch (err) {
        console.error(err);
        alert("Microphone access denied or unavailable");
        recording = false;
        recordBtn.innerHTML = `<i class="fa fa-microphone"></i>`;
        recordBtn.classList.remove("recording");
    }
});

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
onValue(chatRef, snapshot => {
    chatBox.innerHTML = "";

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

        // Voice Message
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

        // ---------- Play simple notification sound ----------
        if (data.user !== currentUser && !notifiedMessages.has(key) && document.hidden) {
            notifSound.play().catch(e => console.log("Sound play blocked:", e));
            notifiedMessages.add(key);
        }
    });

    // Update seen for visible tab
    if (!document.hidden) updateSeen(snapshot);

    chatBox.scrollTop = chatBox.scrollHeight;
});

// ---------- Send on Enter ----------
msgInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});
