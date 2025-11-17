# 🎙️ SpeakerSplit
### AI-Powered Multi-Speaker Diarization, Voice Separation & Transcription System

SpeakerSplit is an advanced AI-based voice processing application designed for **speaker diarization**, **audio separation**, and **speech transcription**. It takes a single mixed-audio file containing multiple speakers and produces **clean, isolated audio tracks for each speaker** along with **speaker-labeled transcription text**.

This tool is helpful for:
- Meeting recordings
- Interviews & podcasts
- Call center analytics
- Lecture & discussion processing
- Forensics & research

---

## ✨ Key Features

- 🔊 **Speaker Diarization** – Automatically detects and separates speakers
- 🎧 **Voice Separation** – Generates individual audio files for each speaker
- 📝 **Speech-to-Text Transcription** – Produces text labeled per speaker
- 📦 **Downloadable Results** – Export audio & transcript files
- 🌐 **Streamlit UI** – Simple, clean and interactive web interface
- 🎙 **Supports Multiple Audio Formats** – WAV, MP3, FLAC, M4A, etc.

---

## 🧠 How It Works

1. Upload a mixed-audio file
2. Speaker embeddings are extracted from the audio
3. Clustering algorithm groups segments based on speaker identity
4. Speech-To-Text engine converts audio to textual transcript
5. System outputs:
   - Separated audio files (`speaker_1.wav`, `speaker_2.wav`, ...)
   - Formatted transcript with speaker tags

---

## 🛠 Tech Stack

| Category | Tools / Libraries |
|---------|-------------------|
| Frontend | Streamlit |
| ML / Audio Processing | Pyannote-Audio, Librosa, SpeechBrain, SciPy |
| STT Engine | OpenAI Whisper / VOSK / Google Speech-to-Text |
| Models | Speaker Embedding Models + Clustering |
| Other | NumPy, Panda,s scikit-learn, Matplotlib/Plotly |

---
