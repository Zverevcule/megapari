const DB_NAME = "videoAppDB";
const STORE_NAME = "videos";
const VIDEO_KEY = "currentVideo";

const player = document.getElementById("player");
const controls = document.getElementById("controls");
const addBtn = document.getElementById("addBtn");
const deleteBtn = document.getElementById("deleteBtn");
const fileInput = document.getElementById("fileInput");
let hideTimer = null;

// ---------- IndexedDB helpers ----------
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveVideo(blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, VIDEO_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function deleteVideoFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(VIDEO_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadVideo() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(VIDEO_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(tx.error);
  });
}

// ---------- UI logic ----------
async function playBlob(blob) {
  // إذا كان هناك فيديو قديم، احذف الـ URL للتحرر من الذاكرة
  if (player.src) {
    URL.revokeObjectURL(player.src);
  }
  
  const url = URL.createObjectURL(blob);
  player.src = url;
  player.classList.add("active");
  player.loop = true;
  
  // انتظر حتى يكون الفيديو جاهزاً قبل التشغيل لتجنب التأخير
  return new Promise((resolve) => {
    const onCanPlay = () => {
      player.removeEventListener("canplay", onCanPlay);
      player.play().catch(() => {
        // autoplay قد يكون محجوب من المتصفح
      });
      console.log("فيديو جاهز للتشغيل");
      resolve();
    };
    
    // إذا كان الفيديو جاهزاً بالفعل (readyState >= 2 = HAVE_CURRENT_DATA)
    if (player.readyState >= 2) {
      onCanPlay();
    } else {
      player.addEventListener("canplay", onCanPlay, { once: true });
    }
  });
}

function showAddButton() {
  controls.classList.remove("hidden");
  clearTimeout(hideTimer);
  if (player.classList.contains("active")) {
    hideTimer = setTimeout(hideAddButton, 3000);
  }
}

function hideAddButton() {
  controls.classList.add("hidden");
}

addBtn.addEventListener("click", () => {
  fileInput.click();
});

deleteBtn.addEventListener("click", async () => {
  await deleteVideoFromDB();
  player.pause();
  if (player.src) {
    URL.revokeObjectURL(player.src);
  }
  player.removeAttribute("src");
  player.load();
  player.classList.remove("active");
  clearTimeout(hideTimer);
  showAddButton();
});

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await saveVideo(file);
  
  await playBlob(file);
  fileInput.value = "";
});

// tap on the video briefly reveals the add button so the user
// can swap the video later without the app looking like a player
player.addEventListener("click", () => {
  if (controls.classList.contains("hidden")) {
    showAddButton();
  } else {
    hideAddButton();
  }
});

// ---------- init ----------
(async () => {
  try {
    const existing = await loadVideo();
    if (existing) {
      await playBlob(existing);
    } else {
      showAddButton();
    }
  } catch (err) {
    showAddButton();
  }
})();

// register service worker for offline / installability
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
