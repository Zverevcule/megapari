const player = document.getElementById("player");
const controls = document.getElementById("controls");
const addBtn = document.getElementById("addBtn");
const deleteBtn = document.getElementById("deleteBtn");
const fileInput = document.getElementById("fileInput");
let hideTimer = null;
let currentBlobURL = null;

// ---------- UI logic ----------
function playBlob(blob) {
  // تنظيف الـ URL القديم
  if (currentBlobURL) {
    URL.revokeObjectURL(currentBlobURL);
  }
  
  currentBlobURL = URL.createObjectURL(blob);
  player.src = currentBlobURL;
  player.classList.add("active");
  player.loop = true;
  
  // شغل الفيديو مباشرة
  player.play().catch(() => {
    console.log("Autoplay blocked by browser");
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

// معالج تغيير الملف - بدون حفظ في IndexedDB
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  playBlob(file);
  fileInput.value = "";
});

// التحكم في ظهور الأزرار
player.addEventListener("click", () => {
  if (controls.classList.contains("hidden")) {
    showAddButton();
  } else {
    hideAddButton();
  }
});

// إظهار الأزرار عند اللمس
player.addEventListener("mousemove", showAddButton);
player.addEventListener("touchstart", showAddButton);

// عند فتح الصفحة للمرة الأولى
showAddButton();

// تسجيل service worker للتثبيت والعمل بلا إنترنت
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
