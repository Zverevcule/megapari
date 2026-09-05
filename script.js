const player = document.getElementById("player");
const controls = document.getElementById("controls");
const addBtn = document.getElementById("addBtn");
const deleteBtn = document.getElementById("deleteBtn");
const fileInput = document.getElementById("fileInput");

let hideTimer = null;
let currentBlobURL = null;
let hideControlsTimeout = null;

// ---------- Performance optimizations ----------
// استخدام requestAnimationFrame لتجنب الهنج
let isHideScheduled = false;

function scheduleHideControls() {
  if (isHideScheduled) return;
  
  isHideScheduled = true;
  requestAnimationFrame(() => {
    isHideScheduled = false;
    hideAddButton();
  });
}

// ---------- UI logic ----------
function playBlob(blob) {
  // تنظيف الـ URL القديم
  if (currentBlobURL) {
    URL.revokeObjectURL(currentBlobURL);
  }
  
  // إنشاء URL جديد
  currentBlobURL = URL.createObjectURL(blob);
  player.src = currentBlobURL;
  player.classList.add("active");
  player.loop = true;
  
  // معالجة الأخطاء
  player.onerror = () => {
    console.error("Error loading video");
    showAddButton();
  };
  
  // استماع لحدث عند جاهزية الفيديو
  const onCanPlay = () => {
    player.removeEventListener("canplay", onCanPlay);
  };
  
  player.addEventListener("canplay", onCanPlay, { once: true });
  
  // شغل الفيديو
  player.play().catch((error) => {
    console.log("Playback error:", error);
  });
  
  hideAddButton();
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

// ---------- Event listeners ----------
addBtn.addEventListener("click", () => {
  fileInput.click();
});

deleteBtn.addEventListener("click", () => {
  player.pause();
  if (currentBlobURL) {
    URL.revokeObjectURL(currentBlobURL);
    currentBlobURL = null;
  }
  player.removeAttribute("src");
  player.load();
  player.classList.remove("active");
  clearTimeout(hideTimer);
  showAddButton();
});

// تحميل الملف بدون تأخير
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  playBlob(file);
  fileInput.value = "";
});

// التحكم في ظهور الأزرار عند النقر على الفيديو
player.addEventListener("click", () => {
  if (controls.classList.contains("hidden")) {
    showAddButton();
  } else {
    hideAddButton();
  }
});

// إظهار الأزرار عند اللمس - استخدام passive listener للأداء
player.addEventListener("touchstart", showAddButton, { passive: true });

// إظهار الأزرار عند تحريك الماوس - لكن بدون تكرار مستمر
let lastMouseMoveTime = 0;
player.addEventListener("mousemove", (e) => {
  const now = Date.now();
  if (now - lastMouseMoveTime > 300) { // كل 300ms فقط
    lastMouseMoveTime = now;
    showAddButton();
  }
}, { passive: true });

// عند فتح الصفحة للمرة الأولى
showAddButton();

// ---------- Performance monitoring ----------
// منع الهنج بسبب العمليات الثقيلة
if ("requestIdleCallback" in window) {
  requestIdleCallback(() => {
    // تسجيل service worker بدون حجب الـ UI
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  });
} else {
  // fallback للمتصفحات القديمة
  window.addEventListener("load", () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  });
}
