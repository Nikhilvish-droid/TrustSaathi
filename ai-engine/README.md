# TrustSaathi AI Engine

FastAPI service that extracts donation data from images, PDFs, Excel files, and CSVs, then forwards the standardized payload to the backend.

## Environment Variables

Create a local `.env` file based on `.env.example` and set:

* `GEMINI_API_KEY` - Google Gemini API key
* `BACKEND_API_URL` - backend endpoint, usually `http://localhost:5000/api/ai/upload`
* `BACKEND_API_KEY` - shared secret that must match the backend `AI_SERVICE_API_KEY`

## Run

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Flow

1. Upload a file to `POST /extract`.
2. The engine standardizes the extracted entries.
3. The engine forwards the payload to the backend with `x-api-key`.
4. The backend stores the records after validating the shared key.