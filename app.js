document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const apiState = document.getElementById("api-state");
  const apiStateText = document.getElementById("api-state-text");
  
  const fileInput = document.getElementById("file-input");
  const dropZone = document.getElementById("drop-zone");
  const previewWrap = document.getElementById("preview-wrap");
  const previewImage = document.getElementById("preview-image");
  const fileNameDisplay = document.getElementById("file-name");
  const fileSizeDisplay = document.getElementById("file-size");
  const resetButton = document.getElementById("reset-button");
  const analyzeButton = document.getElementById("analyze-button");
  const errorMessage = document.getElementById("error-message");
  
  const resultStatus = document.getElementById("result-status");
  const emptyResult = document.getElementById("empty-result");
  const loadingResult = document.getElementById("loading-result");
  const resultContent = document.getElementById("result-content");
  
  const diagnosisCard = document.getElementById("diagnosis-card");
  const diagnosisTitle = document.getElementById("diagnosis-title");
  const diagnosisConfidence = document.getElementById("diagnosis-confidence");
  const diagnosisIcon = document.getElementById("diagnosis-icon");
  const diagnosisIconWrap = document.getElementById("diagnosis-icon-wrap");
  const probList = document.getElementById("prob-list");
  const recommendationCard = document.getElementById("recommendation-card");
  const recommendationText = document.getElementById("recommendation-text");

  let selectedFile = null;

  // Hardcoded Backend API URL
  const BACKEND_API_URL = "https://kypli-lsd-sapi-api.hf.space";

  // Ping Backend to check connection
  function checkBackendStatus() {
    apiState.className = "api-state";
    apiStateText.textContent = "Menghubungkan...";

    fetch(`${BACKEND_API_URL}/health`)
      .then(response => {
        if (!response.ok) throw new Error("HTTP error " + response.status);
        return response.json();
      })
      .then(data => {
        apiState.className = "api-state is-online";
        if (data.model_loaded) {
          apiStateText.textContent = "Model Siap";
        } else {
          apiStateText.textContent = "Model Belum Diunggah";
        }
        updateAnalyzeButtonState();
      })
      .catch(err => {
        console.warn("Health check error:", err);
        // Fallback check ke root URL
        fetch(BACKEND_API_URL)
          .then(res => {
            if (res.ok) {
              apiState.className = "api-state is-online";
              apiStateText.textContent = "Online (No Model)";
            } else {
              apiState.className = "api-state is-offline";
              apiStateText.textContent = "Offline (Error)";
            }
            updateAnalyzeButtonState();
          })
          .catch(() => {
            apiState.className = "api-state is-offline";
            apiStateText.textContent = "Offline";
            updateAnalyzeButtonState();
          });
      });
  }

  // Run initial status check
  checkBackendStatus();

  // Helper to enable/disable button
  function updateAnalyzeButtonState() {
    const isOnline = apiState.classList.contains("is-online");
    analyzeButton.disabled = !(selectedFile && isOnline);
  }

  // File Selection and Drag & Drop
  dropZone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--primary)";
    dropZone.style.background = "var(--surface-raised)";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "var(--line)";
    dropZone.style.background = "var(--canvas)";
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--line)";
    dropZone.style.background = "var(--canvas)";
    
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  function handleFile(file) {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showError("Format berkas harus JPEG, PNG, atau WebP.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError("Ukuran berkas melebihi batas 10 MB.");
      return;
    }

    selectedFile = file;
    errorMessage.classList.add("is-hidden");

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      fileNameDisplay.textContent = file.name;
      fileSizeDisplay.textContent = formatBytes(file.size);
      
      dropZone.classList.add("is-hidden");
      previewWrap.classList.remove("is-hidden");
      resetButton.classList.remove("is-hidden");
      
      updateAnalyzeButtonState();
    };
    reader.readAsDataURL(file);
  }

  // Format File Size
  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  // Reset/Clear Input
  resetButton.addEventListener("click", () => {
    selectedFile = null;
    fileInput.value = "";
    
    dropZone.classList.remove("is-hidden");
    previewWrap.classList.add("is-hidden");
    resetButton.classList.add("is-hidden");
    errorMessage.classList.add("is-hidden");
    
    // Reset results
    resultStatus.textContent = "Menunggu Input";
    resultStatus.className = "result-status status-neutral";
    emptyResult.classList.remove("is-hidden");
    loadingResult.classList.add("is-hidden");
    resultContent.classList.add("is-hidden");
    
    // Remove scanning effect
    previewWrap.classList.remove("scanning");
    
    updateAnalyzeButtonState();
  });

  // Show local UI error
  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove("is-hidden");
  }

  // Make prediction request
  analyzeButton.addEventListener("click", () => {
    if (!selectedFile) return;
    
    // UI state: Loading
    resultStatus.textContent = "Menganalisis";
    resultStatus.className = "result-status status-loading";
    emptyResult.classList.add("is-hidden");
    loadingResult.classList.remove("is-hidden");
    resultContent.classList.add("is-hidden");
    errorMessage.classList.add("is-hidden");
    
    // Add scanning effect to preview
    previewWrap.classList.add("scanning");
    analyzeButton.disabled = true;

    const formData = new FormData();
    formData.append("file", selectedFile);

    fetch(`${BACKEND_API_URL}/predict`, {
      method: "POST",
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.detail?.message || errData.detail || "Terjadi kesalahan server");
          }).catch(() => {
            throw new Error(`Kesalahan Server (${response.status})`);
          });
        }
        return response.json();
      })
      .then(data => {
        // UI state: Success
        resultStatus.textContent = "Selesai";
        resultStatus.className = "result-status status-success";
        loadingResult.classList.add("is-hidden");
        resultContent.classList.remove("is-hidden");
        
        displayResults(data);
      })
      .catch(err => {
        console.error("Prediction failed:", err);
        
        // Reset UI from loading to error
        resultStatus.textContent = "Gagal";
        resultStatus.className = "result-status status-neutral";
        loadingResult.classList.add("is-hidden");
        emptyResult.classList.remove("is-hidden");
        
        showError(err.message || "Gagal menghubungkan ke backend API. Pastikan CORS diizinkan dan backend aktif.");
      })
      .finally(() => {
        previewWrap.classList.remove("scanning");
        updateAnalyzeButtonState();
      });
  });

  // Render prediction to UI
  function displayResults(data) {
    const topPred = data.prediction;
    const classId = topPred.label; // 'healthy', 'lumpy_skin_disease', 'foot_and_mouth_disease'
    const confidencePct = (topPred.confidence * 100).toFixed(1);

    // 1. Setup Diagnosis Card
    diagnosisCard.className = "diagnosis-card"; // Reset
    diagnosisTitle.textContent = topPred.name;
    diagnosisConfidence.textContent = `Tingkat Kepercayaan: ${confidencePct}%`;

    // Dynamic icon and styles
    if (classId === "healthy") {
      diagnosisCard.classList.add("is-healthy");
      diagnosisIcon.setAttribute("data-lucide", "shield-check");
      diagnosisIconWrap.style.color = "var(--healthy)";
    } else if (classId === "lumpy_skin_disease") {
      diagnosisCard.classList.add("is-lsd");
      diagnosisIcon.setAttribute("data-lucide", "shapes");
      diagnosisIconWrap.style.color = "var(--lsd)";
    } else if (classId === "foot_and_mouth_disease") {
      diagnosisCard.classList.add("is-pmk");
      diagnosisIcon.setAttribute("data-lucide", "bomb");
      diagnosisIconWrap.style.color = "var(--pmk)";
    }
    
    // Re-render Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // 2. Render probabilities list
    probList.innerHTML = "";
    data.top_predictions.forEach(pred => {
      const predPct = (pred.confidence * 100).toFixed(1);
      const isHealthy = pred.label === "healthy";
      const isLsd = pred.label === "lumpy_skin_disease";
      const barClass = isHealthy ? "healthy" : (isLsd ? "lsd" : "pmk");

      const probItem = document.createElement("div");
      probItem.className = "prob-item";
      probItem.innerHTML = `
        <div class="prob-meta">
          <span class="prob-label">${pred.name}</span>
          <span class="prob-val">${predPct}%</span>
        </div>
        <div class="prob-track">
          <div class="prob-bar ${barClass}" style="width: ${predPct}%"></div>
        </div>
      `;
      probList.appendChild(probItem);
    });

    // 3. Setup Recommendation & Disclaimer
    recommendationCard.className = "recommendation-card"; // Reset
    
    if (classId === "healthy") {
      recommendationCard.classList.add("healthy");
      recommendationText.textContent = "Sapi Anda terindikasi Sehat. Pertahankan kebersihan sanitasi kandang, berikan pakan bernutrisi seimbang secara berkala, dan patuhi jadwal vaksinasi berkala untuk kekebalan kelompok.";
    } else if (classId === "lumpy_skin_disease") {
      recommendationCard.classList.add("lsd");
      recommendationText.textContent = "Gejala Lumpy Skin Disease (LSD) terdeteksi. Segera pisahkan (karantina) sapi yang terinfeksi untuk menghindari penularan, kendalikan populasi serangga (nyamuk/lalat) sebagai vektor virus di area peternakan, dan laporkan kepada dokter hewan setempat untuk obat simtomatik.";
    } else if (classId === "foot_and_mouth_disease") {
      recommendationCard.classList.add("pmk");
      recommendationText.textContent = "Gejala Penyakit Mulut dan Kuku (PMK) terdeteksi. Batasi ketat mobilitas manusia dan kendaraan masuk/keluar kandang (biosekuriti ketat), semprot sela-sela kuku sapi dan kandang dengan disinfektan asam/basa (seperti asam sitrat atau soda abu), serta segera hubungi pihak dinas peternakan setempat.";
    }
  }

  // Auto-initialize Lucide Icons on load
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
