from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.services.transcribe_service import transcribe_audio
import uvicorn
import os

# Initialize FastAPI app
app = FastAPI(title="🎧 Speaker Diarization + Transcription")

# === Mount static directories ===
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Create saved_sessions directory if it doesn’t exist
os.makedirs("saved_sessions", exist_ok=True)
app.mount("/sessions", StaticFiles(directory="saved_sessions"), name="sessions")

# === Set up templates ===
templates = Jinja2Templates(directory="app/templates")

# === Routes ===
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the main frontend page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/transcribe")
async def transcribe_endpoint(file: UploadFile = File(...)):
    """Receive an audio file, run transcription + diarization, and return structured output."""
    try:
        output = await transcribe_audio(file)
        return JSONResponse(content=output)
    except Exception as e:
        print(f"[ERROR] Transcription failed: {e}")
        return JSONResponse(
            content={"status": "error", "message": str(e)}, status_code=500
        )


# === Local run entrypoint ===
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
