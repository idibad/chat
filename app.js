

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
const storage = getStorage(app);
const chatRef = ref(db, "messages");

// ---------- Current User ----------
let currentUser = localStorage.getItem("chatUser");
if (currentUser) document.getElementById("registerScreen").style.display = "none";
let currentUser = localStorage.getItem("chatUser");
if (currentUser) {
    document.getElementById("registerScreen").style.display = "none";
    // ← Add this line below
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

        // Custom Playful Voice Message Player
        if (data.voiceUrl) {
            const voiceContainer = document.createElement("div");
            voiceContainer.className = "voice-message";

            const playBtn = document.createElement("button");
            playBtn.className = "play-btn";

            const audio = document.createElement("audio");
            audio.src = data.voiceUrl;
            audio.preload = "metadata";

            const waveform = document.createElement("div");
            waveform.className = "waveform";
            for (let i = 0; i < 5; i++) {
                const bar = document.createElement("div");
                bar.className = "bar";
                waveform.appendChild(bar);
            }

            const timeSpan = document.createElement("span");
            timeSpan.className = "voice-time";
            timeSpan.innerText = "0:00";

            audio.onloadedmetadata = () => {
                const dur = Math.floor(audio.duration || 0);
                const mins = Math.floor(dur / 60);
                const secs = String(dur % 60).padStart(2, "0");
                timeSpan.innerText = mins > 0 ? `${mins}:${secs}` : `0:${secs}`;
            };

            const updatePlayState = () => {
                if (audio.paused) {
                    playBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
                    voiceContainer.classList.remove("playing");
                } else {
                    playBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
                    voiceContainer.classList.add("playing");
                }
            };

            playBtn.onclick = () => {
                if (audio.paused) audio.play();
                else audio.pause();
                updatePlayState();
            };

            audio.onplay = () => updatePlayState();
            audio.onpause = audio.onended = () => updatePlayState();
            updatePlayState(); // initial state

            voiceContainer.appendChild(playBtn);
            voiceContainer.appendChild(waveform);
            voiceContainer.appendChild(timeSpan);
            voiceContainer.appendChild(audio); // hidden audio element
            div.appendChild(voiceContainer);
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
    });

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    // Update seen when tab is visible
    if (!document.hidden) updateSeen(snapshot);

    // Play notification sound ONLY for genuinely new messages (not on initial load)
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
