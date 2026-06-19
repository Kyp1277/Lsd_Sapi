const API_URL = "https://kypli-lsd-sapi-api.hf.space";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const elements = {
  apiState: document.querySelector("#api-state"),
  apiStateText: document.querySelector("#api-state-text"),
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  previewWrap: document.querySelector("#preview-wrap"),
  previewImage: document.querySelector("#preview-image"),
  fileName: document.querySelector("#file-name"),
  fileSize: document.querySelector("#file-size"),
  resetButton: document.querySelector("#reset-button"),
  confidenceRange: document.querySelector("#confidence-range"),
  confidenceValue: document.querySelector("#confidence-value"),
  analyzeButton: document.querySelector("#analyze-button"),
  errorMessage: document.querySelector("#error-message"),
  emptyResult: document.querySelector("#empty-result"),
  loadingResult: document.querySelector("#loading-result"),
  resultContent: document.querySelector("#result-content"),
  resultStatus: document.querySelector("#result-status"),
  resultImage: document.querySelector("#result-image"),
  detectionCount: document.querySelector("#detection-count"),
  highestConfidence: document.querySelector("#highest-confidence"),
  detectionList: document.querySelector("#detection-list"),
};

let selectedFile = null;
let previewUrl = null;

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.remove("is-hidden");
}

function clearError() {
  elements.errorMessage.textContent = "";
  elements.errorMessage.classList.add("is-hidden");
}

function setResultStatus(text, variant = "neutral") {
  elements.resultStatus.textContent = text;
  elements.resultStatus.className = `result-status status-${variant}`;
}

function validateFile(file) {
  if (!file) {
    return "Pilih gambar terlebih dahulu.";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Format gambar harus JPG, PNG, atau WebP.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran gambar maksimal 10 MB.";
  }
  return null;
}

function setSelectedFile(file) {
  const validationMessage = validateFile(file);
  if (validationMessage) {
    showError(validationMessage);
    return;
  }

  clearError();
  selectedFile = file;
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
  previewUrl = URL.createObjectURL(file);
  elements.previewImage.src = previewUrl;
  elements.fileName.textContent = file.name;
  elements.fileSize.textContent = formatFileSize(file.size);
  elements.dropZone.classList.add("is-hidden");
  elements.previewWrap.classList.remove("is-hidden");
  elements.resetButton.classList.remove("is-hidden");
  elements.analyzeButton.disabled = false;
}

function resetDetector() {
  selectedFile = null;
  elements.fileInput.value = "";
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  elements.previewImage.removeAttribute("src");
  elements.previewWrap.classList.add("is-hidden");
  elements.previewWrap.classList.remove("is-scanning");
  elements.dropZone.classList.remove("is-hidden");
  elements.resetButton.classList.add("is-hidden");
  elements.analyzeButton.disabled = true;
  elements.resultContent.classList.add("is-hidden");
  elements.loadingResult.classList.add("is-hidden");
  elements.emptyResult.classList.remove("is-hidden");
  setResultStatus("Menunggu foto");
  clearError();
}

function renderDetections(data) {
  const detections = Array.isArray(data.detections) ? data.detections : [];
  const hasLsd = detections.some((item) => String(item.label).toLowerCase().includes("lsd"));
  const highest = detections.reduce(
    (current, item) => Math.max(current, Number(item.confidence) || 0),
    0,
  );

  elements.resultImage.src = `data:${data.annotated_image_mime || "image/jpeg"};base64,${data.annotated_image}`;
  elements.detectionCount.textContent = String(data.detection_count ?? detections.length);
  elements.highestConfidence.textContent = `${Math.round(highest * 100)}%`;
  elements.detectionList.replaceChildren();

  if (hasLsd) {
    setResultStatus("Indikasi LSD terdeteksi", "alert");
  } else if (detections.length > 0) {
    setResultStatus("Tidak ada indikasi LSD", "safe");
  } else {
    setResultStatus("Objek tidak dikenali", "neutral");
  }

  if (detections.length === 0) {
    const empty = document.createElement("p");
    empty.className = "error-message";
    empty.textContent = "Model belum menemukan objek sapi pada gambar ini. Coba foto yang lebih jelas.";
    elements.detectionList.append(empty);
  } else {
    detections.forEach((item) => {
      const row = document.createElement("div");
      const isLsd = String(item.label).toLowerCase().includes("lsd");
      row.className = `detection-item${isLsd ? " is-lsd" : ""}`;

      const swatch = document.createElement("span");
      swatch.className = "class-swatch";

      const label = document.createElement("strong");
      label.textContent = item.label || `Kelas ${item.class_id}`;

      const confidence = document.createElement("span");
      confidence.textContent = `${Math.round((Number(item.confidence) || 0) * 100)}%`;

      row.append(swatch, label, confidence);
      elements.detectionList.append(row);
    });
  }

  elements.loadingResult.classList.add("is-hidden");
  elements.resultContent.classList.remove("is-hidden");
  refreshIcons();
}

async function analyzeImage() {
  const validationMessage = validateFile(selectedFile);
  if (validationMessage) {
    showError(validationMessage);
    return;
  }

  clearError();
  elements.analyzeButton.disabled = true;
  elements.emptyResult.classList.add("is-hidden");
  elements.resultContent.classList.add("is-hidden");
  elements.loadingResult.classList.remove("is-hidden");
  elements.previewWrap.classList.add("is-scanning");
  setResultStatus("Menganalisis");

  const formData = new FormData();
  formData.append("file", selectedFile);
  const threshold = Number(elements.confidenceRange.value) / 100;

  try {
    const response = await fetch(
      `${API_URL}/predict?confidence=${threshold}&include_image=true`,
      { method: "POST", body: formData },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || `Server mengembalikan status ${response.status}.`);
    }
    if (!data.annotated_image) {
      throw new Error("Server tidak mengirim gambar hasil deteksi.");
    }

    renderDetections(data);
  } catch (error) {
    elements.loadingResult.classList.add("is-hidden");
    elements.emptyResult.classList.remove("is-hidden");
    setResultStatus("Analisis gagal", "alert");
    showError(
      `${error.message || "Tidak dapat menghubungi server."} Coba lagi setelah beberapa saat.`,
    );
  } finally {
    elements.previewWrap.classList.remove("is-scanning");
    elements.analyzeButton.disabled = !selectedFile;
  }
}

async function checkApiHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error("API tidak siap");
    }
    elements.apiState.classList.add("is-online");
    elements.apiState.classList.remove("is-offline");
    elements.apiStateText.textContent = "Model siap";
  } catch {
    elements.apiState.classList.add("is-offline");
    elements.apiState.classList.remove("is-online");
    elements.apiStateText.textContent = "Model sedang bangun";
  }
}

elements.dropZone.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", (event) => setSelectedFile(event.target.files[0]));
elements.resetButton.addEventListener("click", resetDetector);
elements.analyzeButton.addEventListener("click", analyzeImage);

elements.confidenceRange.addEventListener("input", () => {
  elements.confidenceValue.textContent = `${elements.confidenceRange.value}%`;
});

["dragenter", "dragover"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("is-dragging");
  });
});

elements.dropZone.addEventListener("drop", (event) => {
  setSelectedFile(event.dataTransfer.files[0]);
});

window.addEventListener("DOMContentLoaded", () => {
  refreshIcons();
  checkApiHealth();
});
