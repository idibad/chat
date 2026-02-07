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
const imageInput = document.getElementById("imageInput");
const imageBtn = document.getElementById("imageBtn");
const voiceBtn = document.getElementById("voiceBtn");
const recordingIndicator = document.getElementById("recordingIndicator");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const recordTimer = document.getElementById("recordTimer");

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
// ---------- Logout ----------
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('chatUser');
                location.reload();
            }
        });
    }
});
// ---------- Voice Recording ----------
let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let recordingInterval;

voiceBtn.addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64Audio = reader.result;
                const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
                
                push(chatRef, {
                    user: currentUser,
                    type: 'voice',
                    voiceData: base64Audio,
                    duration: duration,
                    time: Date.now(),
                    status: 'sent',
                    seen: [currentUser],
                    delivered: [currentUser]
                });
            };

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        recordingStartTime = Date.now();
        recordingIndicator.style.display = "flex";

        // Update timer
        let seconds = 0;
        recordingInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            recordTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }, 1000);

    } catch (err) {
        alert("Microphone access denied. Please enable microphone permissions.");
        console.error(err);
    }
});

stopRecordBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        recordingIndicator.style.display = "none";
        clearInterval(recordingInterval);
        recordTimer.textContent = "0:00";
    }
});

// ---------- Image Upload ----------
imageBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        push(chatRef, {
            user: currentUser,
            type: 'image',
            imageData: reader.result,
            time: Date.now(),
            status: 'sent',
            seen: [currentUser],
            delivered: [currentUser]
        });
    };

    // Clear the input
    imageInput.value = '';
});

// ---------- Send Message ----------
window.sendMessage = function () {
    const msg = msgInput.value.trim();
    if (!msg) return;

    push(chatRef, {
        user: currentUser,
        type: 'text',
        message: msg,
        time: Date.now(),
        status: 'sent',
        seen: [currentUser],
        delivered: [currentUser]
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
    hours = hours ? hours : 12;
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

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ---------- Voice Player ----------
const activeAudios = new Map();
const notifiedMessages = new Set(); // Track which messages we've already notified for

function createVoicePlayer(voiceData, duration, messageId) {
    const playerDiv = document.createElement("div");
    playerDiv.className = "voice-player";

    const playBtn = document.createElement("button");
    playBtn.innerHTML = '<i class="fa fa-play"></i>';
    
    const waveform = document.createElement("div");
    waveform.className = "voice-waveform";
    for (let i = 0; i < 5; i++) {
        const bar = document.createElement("span");
        waveform.appendChild(bar);
    }

    const durationSpan = document.createElement("span");
    durationSpan.className = "voice-duration";
    durationSpan.textContent = formatDuration(duration);

    let audio = activeAudios.get(messageId);
    if (!audio) {
        audio = new Audio(voiceData);
        activeAudios.set(messageId, audio);
    }

    let isPlaying = false;

    playBtn.addEventListener("click", () => {
        if (isPlaying) {
            audio.pause();
            playBtn.innerHTML = '<i class="fa fa-play"></i>';
            isPlaying = false;
        } else {
            // Pause all other audios
            activeAudios.forEach((otherAudio, otherId) => {
                if (otherId !== messageId) {
                    otherAudio.pause();
                    otherAudio.currentTime = 0;
                }
            });

            audio.play();
            playBtn.innerHTML = '<i class="fa fa-pause"></i>';
            isPlaying = true;
        }
    });

    audio.addEventListener("ended", () => {
        playBtn.innerHTML = '<i class="fa fa-play"></i>';
        isPlaying = false;
        audio.currentTime = 0;
    });

    audio.addEventListener("timeupdate", () => {
        const remaining = duration - Math.floor(audio.currentTime);
        durationSpan.textContent = formatDuration(remaining);
    });

    playerDiv.appendChild(playBtn);
    playerDiv.appendChild(waveform);
    playerDiv.appendChild(durationSpan);

    return playerDiv;
}

// ---------- Render Message ----------
function addMessage(key, data) {
    // Remove if already exists (for updates)
    const existing = document.getElementById(key);
    if (existing) {
        existing.remove();
    }

    const div = document.createElement("div");
    div.classList.add("message");
    div.id = key;

    // Color per user
    div.style.background = getUserColor(data.user);
    div.style.alignSelf = data.user === currentUser ? "flex-end" : "flex-start";

    // Username
    const userSpan = document.createElement("strong");
    userSpan.style.textTransform = "capitalize";
    userSpan.textContent = data.user;
    div.appendChild(userSpan);
    div.appendChild(document.createElement("br"));

    // Content based on type
    if (data.type === 'text') {
        const textNode = document.createTextNode(data.message);
        div.appendChild(textNode);
    } else if (data.type === 'image') {
        const img = document.createElement("img");
        img.src = data.imageData;
        img.className = "message-image";
        img.onclick = () => window.open(data.imageData, '_blank');
        div.appendChild(img);
    } else if (data.type === 'voice') {
        const voicePlayer = createVoicePlayer(data.voiceData, data.duration, key);
        div.appendChild(voicePlayer);
    }

    // Time
    const time = document.createElement("div");
    time.style.fontSize = "10px";
    time.style.opacity = "0.6";
    time.style.marginTop = "4px";
    time.textContent = formatTime(data.time);
    div.appendChild(time);

    // Status for own messages
    if (data.user === currentUser) {
        // Delete button
        const del = document.createElement("button");
        del.className = "delete-btn";
        del.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        del.onclick = () => remove(ref(db, "messages/" + key));
        div.appendChild(del);

        // Status indicator
        const statusDiv = document.createElement("div");
        statusDiv.className = "message-status";
        
        let statusIcon = "";
        let statusText = "";
        let statusClass = "";

        if (data.seen && data.seen.length > 1) {
            statusIcon = "✓✓";
            statusText = "Seen";
            statusClass = "status-seen";
        } else if (data.delivered && data.delivered.length > 1) {
            statusIcon = "✓✓";
            statusText = "Delivered";
            statusClass = "status-delivered";
        } else {
            statusIcon = "✓";
            statusText = "Sent";
            statusClass = "status-sent";
        }

        statusDiv.innerHTML = `<span class="status-icon ${statusClass}">${statusIcon}</span> <span>${statusText}</span>`;
        div.appendChild(statusDiv);
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Mark as delivered if not from current user
    if (data.user !== currentUser) {
        if (!data.delivered || !data.delivered.includes(currentUser)) {
            update(ref(db, "messages/" + key), {
                delivered: [...(data.delivered || []), currentUser]
            });
        }
    }

    // Mark as seen when message is visible
    if (data.user !== currentUser) {
        if (!data.seen || !data.seen.includes(currentUser)) {
            setTimeout(() => {
                update(ref(db, "messages/" + key), {
                    seen: [...(data.seen || []), currentUser]
                });
            }, 500);
        }
    }

    // Notification sound for messages from others (only once per message)
    if (data.user !== currentUser && !notifiedMessages.has(key)) {
        notifiedMessages.add(key);
        notifSound.play().catch(() => {});
        
        // Browser notification if tab is not visible
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
            const notifText = data.type === 'text' ? data.message : 
                             data.type === 'image' ? '📷 Image' : 
                             '🎤 Voice message';
            new Notification(`${data.user}`, {
                body: notifText,
                icon: 'https://cdn-icons-png.freepik.com/512/309/309666.png'
            });
        }
    }
}

// ---------- Firebase Listeners ----------
onChildAdded(chatRef, snap => {
    addMessage(snap.key, snap.val());
});

onChildRemoved(chatRef, snap => {
    const el = document.getElementById(snap.key);
    if (el) el.remove();
    
    // Clean up audio
    const audio = activeAudios.get(snap.key);
    if (audio) {
        audio.pause();
        activeAudios.delete(snap.key);
    }
    
    // Clean up notification tracking
    notifiedMessages.delete(snap.key);
});

onChildChanged(chatRef, snap => {
    addMessage(snap.key, snap.val());
});

// ---------- Request Notification Permission ----------
if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
}

// ---------- Page Visibility for Status Updates ----------
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        // Mark all messages as seen when user returns to tab
        const messages = chatBox.querySelectorAll(".message");
        messages.forEach(msg => {
            const messageId = msg.id;
            if (messageId) {
                // This will be handled by the existing listeners
            }
        });
    }
});
