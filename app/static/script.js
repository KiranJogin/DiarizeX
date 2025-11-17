// app/static/script.js
const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const loading = document.getElementById("loading");
const output = document.getElementById("output");
const scriptOutput = document.getElementById("script-output");

const globalPlayer = document.getElementById("global-player");
const globalPlay = document.getElementById("global-play");
const globalPause = document.getElementById("global-pause");
const globalProgress = document.getElementById("global-progress");

let fullAudioList = [];
let currentGlobalIndex = 0;
let globalAudio = null;
let totalDuration = 0;
let isGlobalPlaying = false;

// Hide global player by default
globalPlayer.classList.add("hidden");

const speakerColorMap = {};
const palette = ["c1","c2","c3","c4","c5","c6"];

function colorForSpeaker(name) {
  if (!speakerColorMap[name]) {
    speakerColorMap[name] = palette[Object.keys(speakerColorMap).length % palette.length];
  }
  return speakerColorMap[name];
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) return alert("Please select an audio file.");

  // Disable form during processing
  fileInput.disabled = true;
  const submitBtn = form.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.style.opacity = 0.6;
  submitBtn.style.cursor = "not-allowed";

  loading.classList.remove("hidden");
  output.classList.add("hidden");
  globalPlayer.classList.add("hidden");
  scriptOutput.innerHTML = "";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/transcribe", { method: "POST", body: formData });
    const data = await res.json();

    if (data.error || data.detail) {
      alert("Error: " + (data.error || data.detail));
      return;
    }

    fullAudioList = data.transcription || [];
    renderTranscription(fullAudioList);

    if (fullAudioList.length > 0) {
      output.classList.remove("hidden");
      globalPlayer.classList.remove("hidden");
      setTimeout(() => globalPlayer.classList.add("show"), 100);
      form.style.display = "none";
    } else {
      alert("No transcription data found. Please check the audio file.");
    }
  } catch (err) {
    alert("Failed: " + err.message);
  } finally {
    loading.classList.add("hidden");
    // keep disabled post-processing
    fileInput.disabled = true;
    submitBtn.disabled = true;
  }
});

function renderTranscription(turns) {
  scriptOutput.innerHTML = "";
  totalDuration = 0;

  turns.forEach((turn, idx) => {
    const colorClass = colorForSpeaker(turn.speaker);
    const method = turn.method || "Diarization";

    const div = document.createElement("div");
    div.classList.add("turn", colorClass);
    div.innerHTML = `
      <div class="turn-header">
        <div class="turn-title">
          <span class="speaker-pill">${turn.speaker}</span>
          <span class="method-badge ${method === "Separated" ? "sep" : "dia"}">${method}</span>
        </div>
        <div class="controls">
          <button id="play-${idx}">▶</button>
          <button id="pause-${idx}" class="hidden">⏸</button>
        </div>
      </div>
      <div class="turn-text">${turn.text || ""}</div>
      <input type="range" id="progress-${idx}" class="progress" value="0" min="0" max="100" step="0.5">
    `;
    scriptOutput.appendChild(div);

    const audio = new Audio(turn.audio_path);
    turn.audio = audio;

    const playBtn = div.querySelector(`#play-${idx}`);
    const pauseBtn = div.querySelector(`#pause-${idx}`);
    const progress = div.querySelector(`#progress-${idx}`);

    playBtn.addEventListener("click", () => {
      audio.play();
      playBtn.classList.add("hidden");
      pauseBtn.classList.remove("hidden");
    });

    pauseBtn.addEventListener("click", () => {
      audio.pause();
      playBtn.classList.remove("hidden");
      pauseBtn.classList.add("hidden");
    });

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) progress.value = (audio.currentTime / audio.duration) * 100;
    });

    progress.addEventListener("input", () => {
      if (audio.duration) {
        audio.currentTime = (progress.value / 100) * audio.duration;
      }
    });

    audio.addEventListener("ended", () => {
      playBtn.classList.remove("hidden");
      pauseBtn.classList.add("hidden");
      progress.value = 100;
    });

    audio.addEventListener("loadedmetadata", () => {
      totalDuration += audio.duration || 0;
    });
  });
}

// ---------- GLOBAL PLAYER ----------
globalPlay.addEventListener("click", () => {
  if (!fullAudioList.length) return;
  isGlobalPlaying = true;
  playGlobalAudio(currentGlobalIndex);
});

globalPause.addEventListener("click", () => {
  if (globalAudio) globalAudio.pause();
  isGlobalPlaying = false;
  globalPlay.classList.remove("hidden");
  globalPause.classList.add("hidden");
});

function playGlobalAudio(index) {
  if (index >= fullAudioList.length) {
    currentGlobalIndex = 0;
    isGlobalPlaying = false;
    globalPlay.classList.remove("hidden");
    globalPause.classList.add("hidden");
    globalProgress.value = 100;
    return;
  }
  currentGlobalIndex = index;
  const turn = fullAudioList[index];

  if (globalAudio) globalAudio.pause();
  globalAudio = new Audio(turn.audio_path);
  globalAudio.play();

  globalPlay.classList.add("hidden");
  globalPause.classList.remove("hidden");

  highlightActiveTurn(index);

  globalAudio.addEventListener("timeupdate", updateGlobalProgress);
  globalAudio.addEventListener("ended", () => {
    if (isGlobalPlaying) {
      currentGlobalIndex++;
      playGlobalAudio(currentGlobalIndex);
    }
  });
}

function highlightActiveTurn(index) {
  document.querySelectorAll(".turn").forEach((el, i) => {
    el.classList.toggle("active-turn", i === index);
  });
  document.querySelectorAll(".turn")[index].scrollIntoView({ behavior: "smooth", block: "center" });
}

function updateGlobalProgress() {
  if (!totalDuration) return;
  let elapsed = 0;
  for (let i = 0; i < currentGlobalIndex; i++) {
    elapsed += fullAudioList[i].audio?.duration || 0;
  }
  elapsed += globalAudio.currentTime;
  globalProgress.value = (elapsed / totalDuration) * 100;
}

globalProgress.addEventListener("input", () => {
  if (!totalDuration || !fullAudioList.length) return;

  const targetTime = (globalProgress.value / 100) * totalDuration;

  let accumulated = 0;
  let targetIndex = 0;
  for (let i = 0; i < fullAudioList.length; i++) {
    const segDuration = fullAudioList[i].audio?.duration || 0;
    if (targetTime < accumulated + segDuration) {
      targetIndex = i;
      break;
    }
    accumulated += segDuration;
  }

  const clipOffset = targetTime - accumulated;

  if (globalAudio) globalAudio.pause();

  currentGlobalIndex = targetIndex;
  globalAudio = new Audio(fullAudioList[targetIndex].audio_path);
  globalAudio.currentTime = clipOffset;

  if (isGlobalPlaying) {
    globalAudio.play();
  }

  globalPlay.classList.toggle("hidden", isGlobalPlaying);
  globalPause.classList.toggle("hidden", !isGlobalPlaying);

  highlightActiveTurn(targetIndex);
  globalAudio.addEventListener("timeupdate", updateGlobalProgress);
  globalAudio.addEventListener("ended", () => {
    if (isGlobalPlaying) {
      currentGlobalIndex++;
      playGlobalAudio(currentGlobalIndex);
    }
  });
});
