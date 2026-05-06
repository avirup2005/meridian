# MERIDIAN

**FINANCIAL INTELLIGENCE: DECODED.**

Meridian is a deterministic, multi-agent Retrieval-Augmented Generation (RAG) platform designed to tear apart 200-page SEC filings (10-Ks, 10-Qs) and extract verified, un-hallucinated financial intelligence.

This is **not** another "ChatPDF" wrapper. Generic LLM wrappers strip formatting, create text soup, and hallucinate numbers. Meridian forces the model to fetch data via strict L2 distance vector search and cite its sources down to the exact page and paragraph using spatial metadata.

---

## [ CORE PIPELINE ]

1. **Layout-Aware Parsing (`pdfplumber`)**: 
   We don't just extract text. We extract bounding boxes (X/Y coordinates) to ensure massive financial tables are mapped explicitly into markdown, preserving their structural integrity before embedding.
2. **Semantic Chunking**: 
   Context windows of 1000 tokens with 200 token overlap. We attach narrative metadata (e.g., `section == "RISK FACTORS"`) to chunks so the AI knows exactly what it's reading before doing vector math.
3. **CPU-Optimized Embeddings**: 
   SentenceTransformers explicitly compiled for CPU execution to run efficiently within ruthlessly small free-tier cloud RAM constraints.
4. **FAISS Vector DB**: 
   In-memory similarity search filtered by rigid metadata constraints (e.g., `company == "NVIDIA"`) to guarantee zero cross-contamination between documents.
5. **Multi-Agent Gemini 2.5 Engine**: 
   Strict prompt engineering wraps the final generation layer. The model does not hallucinate. It retrieves, verifies, and cites.

## [ FEATURES ]

- **Insight Engine:** Explicit extraction of raw variables from FAISS to calculate standard Wall Street KPIs (EBITDA, CAGR, Churn) using hardcoded logic, not LLM math.
- **Risk Radar:** An autonomous agent acting as a devil's advocate, scanning chunks specifically for anomalies, debt traps, and regulatory warnings.
- **Bull vs. Bear Debate:** Dual parallel agents analyzing the exact same PDF chunks—one acting as a ruthless short-seller, the other as an aggressively optimistic hedge fund manager.
- **Multi-Doc Smackdown:** Parallel RAG pipelines extracting isolated metrics from multiple competitors and injecting them into a final Judge agent.
- **Pro Pack (1-Click MBA):** Instant execution of institutional-grade SWOT analysis and ESG scoring.

## [ TECH STACK ]

**[CORE] BACKEND:**
- Python 3.10+
- FastAPI (Async routing, Pydantic validation)
- PyTorch (CPU-only index)
- FAISS (Vector DB)
- pdfplumber (Spatial parsing)
- Gemini 2.5 Flash

**[UI] FRONTEND:**
- React + Vite
- Axios (Production-ready cross-origin requests)
- Framer Motion (Hardware-accelerated pacing)
- Strict Neo-Brutalist Vanilla CSS

## [ RUNNING LOCALLY ]

### 1. The Engine Room (Backend)
```bash
cd financial_analyst
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*(Note: Requires a `.env` file with `GEMINI_API_KEY`)*

### 2. The Dashboard (Frontend)
```bash
cd frontend
npm install
npm run dev
```

---

*Built for absolute performance. No AI slop. GGEZ.*
