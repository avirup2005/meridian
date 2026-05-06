import asyncio
import io
import json
import importlib
import os
import re
from typing import Optional, List
from datetime import datetime
import numpy as np
import pdfplumber
import google.genai as genai
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path


def optional_import(module_name: str):
    """Import a module if available, otherwise return None."""
    try:
        return importlib.import_module(module_name)
    except Exception:
        return None


faiss = optional_import("faiss")
dotenv = optional_import("dotenv")
sentence_transformers = optional_import("sentence_transformers")

# Load environment variables
if dotenv and hasattr(dotenv, "load_dotenv"):
    dotenv.load_dotenv()

# Configure Gemini
genai_client = None
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    try:
        genai_client = genai.Client(api_key=gemini_api_key)
    except Exception:
        genai_client = None

app = FastAPI(title="AI Financial Analyst MVP")

# --- CORS for local dev ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the embedding model
# all-MiniLM-L6-v2 is a lightweight, fast, and high-quality default
embedding_model = None
if sentence_transformers and hasattr(sentence_transformers, "SentenceTransformer"):
    embedding_model = sentence_transformers.SentenceTransformer("all-MiniLM-L6-v2")

# Vector dimension for all-MiniLM-L6-v2 is 384
dimension = 384
# Initialize FAISS index (L2 distance)
faiss_index = (
    faiss.IndexFlatL2(dimension)
    if faiss is not None and embedding_model is not None
    else None
)

# Dictionary to map FAISS index ID to text chunk
chunk_store = {}
fallback_chunks = []

# Per-company stores for Smackdown Mode
# company_chunks["Apple"] = [chunk1, chunk2, ...]
company_chunks: dict[str, list[str]] = {}

# ════════════════════════════════════════════
# DATA MODELS FOR NEW FEATURES
# ════════════════════════════════════════════

class AskRequest(BaseModel):
    query: str


# ════════════════════════════════════════════
# ADDITIONAL DATA MODELS
# ════════════════════════════════════════════

class CompareRequest(BaseModel):
    company_a: str
    company_b: str

class RealityCheckRequest(BaseModel):
    claims: list[str]

class WatchlistItem(BaseModel):
    company_name: str
    ticker: str
    
class AnalysisSnapshot(BaseModel):
    company: str
    timestamp: str
    analysis_type: str
    data: dict


class ExportPackRequest(BaseModel):
    title: str = "Professional Pack Export"
    format: str = "markdown"
    professional_pack: dict

# Storage for new features
watchlist: dict[str, WatchlistItem] = {}
analysis_history: list[AnalysisSnapshot] = []
company_metadata: dict[str, dict] = {}  # Store company metadata like ticker, sector, etc.


def missing_dependencies() -> list[str]:
    missing = []
    if faiss is None:
        missing.append("faiss-cpu")
    if embedding_model is None:
        missing.append("sentence-transformers")
    if dotenv is None:
        missing.append("python-dotenv")
    return missing


def get_genai_client():
    """Return initialized Gemini client or raise a clear error."""
    global genai_client
    if genai_client is not None:
        return genai_client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured. Please set it in your environment.")
    genai_client = genai.Client(api_key=api_key)
    return genai_client


def using_semantic_search() -> bool:
    return faiss_index is not None and embedding_model is not None


def total_indexed_chunks() -> int:
    if using_semantic_search():
        return int(faiss_index.ntotal)
    return len(fallback_chunks)


def tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9]+", text.lower()))


def fallback_retrieve(query: str, k: int = 3) -> list[str]:
    query_tokens = tokenize(query)
    scores = []
    for chunk in fallback_chunks:
        chunk_tokens = tokenize(chunk)
        if not chunk_tokens:
            score = 0.0
        else:
            # Jaccard-style overlap gives a simple relevance heuristic.
            overlap = len(query_tokens & chunk_tokens)
            union = len(query_tokens | chunk_tokens)
            score = (overlap / union) if union else 0.0
        scores.append((score, chunk))

    scores.sort(key=lambda item: item[0], reverse=True)
    top_chunks = [chunk for _, chunk in scores[:k]]
    if not top_chunks and fallback_chunks:
        top_chunks = fallback_chunks[:k]
    return top_chunks

def chunk_text(text: str, chunk_size: int = 300) -> list[str]:
    """Splits a string into chunks of words."""
    # We use a default size of 300 words now, which sets up nice chunks for the embedding context!
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunks.append(" ".join(words[i:i + chunk_size]))
    return chunks


# ════════════════════════════════════════════
# UTILITY FUNCTIONS FOR NEW FEATURES
# ════════════════════════════════════════════

def save_analysis_to_history(company: str, analysis_type: str, data: dict):
    """Save analysis results to history for later comparison."""
    snapshot = AnalysisSnapshot(
        company=company,
        timestamp=datetime.now().isoformat(),
        analysis_type=analysis_type,
        data=data
    )
    analysis_history.append(snapshot)

def extract_numbers_from_text(text: str) -> list[float]:
    """Extract numerical values from text."""
    pattern = r'-?\d+\.?\d*[TMBK]?'
    matches = re.findall(pattern, text.lower())
    numbers = []
    for match in matches:
        multiplier = {'k': 1e3, 'm': 1e6, 'b': 1e9, 't': 1e12}.get(match[-1], 1)
        try:
            num = float(match.rstrip('tmbk')) * multiplier
            numbers.append(num)
        except:
            pass
    return numbers

def detect_red_flags(text: str) -> list[str]:
    """Detect red flags in financial documents."""
    red_flag_patterns = [
        (r'loss|deficit|negative|decline', 'Revenue or profit decline'),
        (r'restructuring|layoff|workforce|reduction', 'Workforce restructuring'),
        (r'litigation|lawsuit|legal|dispute', 'Legal issues or litigation'),
        (r'debt|obligation|loan|liability', 'High debt or loan obligations'),
        (r'impairment|writedown|obsolete', 'Asset impairment or writedowns'),
        (r'discontinued|shutdown|closure', 'Business discontinuation'),
        (r'warning|concern|risk|threat', 'Explicit risk warnings'),
        (r'downgrade|downward|negative outlook', 'Analyst downgrades'),
    ]
    
    flags = []
    text_lower = text.lower()
    for pattern, flag_name in red_flag_patterns:
        if re.search(pattern, text_lower):
            flags.append(flag_name)
    return list(set(flags))  # Remove duplicates

def calculate_sentiment_score(text: str) -> float:
    """Simple sentiment analysis (0-100 scale, 50 is neutral)."""
    positive_words = r'\b(growth|profitable|strong|excellent|improve|expand|leading|innovative|success)\b'
    negative_words = r'\b(loss|decline|weak|challenge|risk|problem|threat|concern|fail)\b'
    
    pos_count = len(re.findall(positive_words, text.lower()))
    neg_count = len(re.findall(negative_words, text.lower()))
    
    total = pos_count + neg_count
    if total == 0:
        return 50.0
    
    return round(50 + (pos_count - neg_count) / total * 50, 2)

@app.post("/api/v1/upload-report")
async def upload_report(file: UploadFile = File(...), company: Optional[str] = None):
    global faiss_index, chunk_store, fallback_chunks, company_chunks
    
    # Read the uploaded PDF file into memory
    content = await file.read()
    
    full_text = ""
    total_pages = 0
    
    # Use pdfplumber to extract text from the PDF file in memory
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            total_pages = len(pdf.pages)
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"
    except Exception as e:
        return {"status": "error", "message": f"Failed to parse PDF: {str(e)}"}
                
    # Chunk the text
    chunks = chunk_text(full_text)
    
    if chunks:
        if using_semantic_search():
            # Generate embeddings for all chunks
            embeddings = embedding_model.encode(chunks)
            # Insert into the FAISS index
            start_id = faiss_index.ntotal
            faiss_index.add(np.array(embeddings, dtype=np.float32))
            # Store text chunks in the global dictionary mapped to FAISS IDs
            for i, chunk in enumerate(chunks):
                chunk_store[start_id + i] = chunk
        else:
            fallback_chunks.extend(chunks)
        # Store by company name for Smackdown Mode
        if company:
            company_chunks[company] = chunks
            
    # Get a preview of the first chunk
    chunk_preview = ""
    if chunks:
        chunk_preview = chunks[0][:200]
        
    return {
        "status": "success",
        "filename": file.filename,
        "total_pages": total_pages,
        "total_chunks_created": len(chunks),
        "chunk_preview": chunk_preview,
        "retrieval_mode": "semantic-faiss" if using_semantic_search() else "keyword-fallback",
        "missing_dependencies": missing_dependencies(),
    }

@app.post("/api/v1/ask")
async def ask_question(req: AskRequest):
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    # Retrieve relevant context chunks
    if using_semantic_search():
        query_embedding = embedding_model.encode([req.query])
        k = min(3, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)

        retrieved_chunks = []
        for idx in indices[0]:
            if idx != -1 and idx in chunk_store:
                retrieved_chunks.append(chunk_store[idx])
    else:
        retrieved_chunks = fallback_retrieve(req.query, k=3)
            
    context_str = "\n\n".join(retrieved_chunks)
    
    # Use Gemini to generate an answer
    prompt = f"You are a financial analyst. Answer the user's question using ONLY the provided context. Context: {context_str}. Question: {req.query}."

    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt,
        )
        answer = response.text
    except Exception as e:
        answer = f"Error generating response: {str(e)}"
        
    return {
        "answer": answer,
        "context_chunks": retrieved_chunks,
        "retrieval_mode": "semantic-faiss" if using_semantic_search() else "keyword-fallback",
        "missing_dependencies": missing_dependencies(),
    }

@app.get("/api/v1/extract-kpis")
async def extract_kpis():
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    query = "Financial highlights, total revenue, net income, profit margin, EBITDA, and primary risk factors."
    
    # Retrieve relevant context chunks (top 5)
    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(5, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)

        retrieved_chunks = []
        for idx in indices[0]:
            if idx != -1 and idx in chunk_store:
                retrieved_chunks.append(chunk_store[idx])
    else:
        retrieved_chunks = fallback_retrieve(query, k=5)
            
    context_str = "\n\n".join(retrieved_chunks)
    
    prompt = (
        'You are a financial data extraction AI. Based ONLY on the provided context, extract the financial metrics. '
        'IMPORTANT: If a metric is not found in the context, explicitly use the string "Not Disclosed" instead of "n/a", "N/A", or "None". '
        'You must respond strictly in valid JSON format without any markdown blocks or extra text. '
        'Schema: {"revenue": "string", "net_income": "string", "ebitda": "string", "risk_factors": ["list of strings"]}.'
        f'\n\nContext: {context_str}'
    )

    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt,
        )
        raw_text = response.text.strip()
        
        # Clean up markdown wrappers if Gemini returns them despite instruction
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        data = json.loads(raw_text.strip())
        
    except json.JSONDecodeError:
        return {"status": "error", "message": "Gemini failed to return valid JSON.", "raw_output": getattr(response, 'text', '')}
    except Exception as e:
        return {"status": "error", "message": f"Error generating response: {str(e)}"}
        
    return {
        "status": "success",
        "data": data,
        "retrieval_mode": "semantic-faiss" if using_semantic_search() else "keyword-fallback"
    }

@app.get("/api/v1/analyze-risk")
async def analyze_risk():
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    query = "Risk factors, pending lawsuits, debt obligations, market threats, and supply chain vulnerabilities."

    # Retrieve relevant context chunks (top 5)
    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(5, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)

        retrieved_chunks = []
        for idx in indices[0]:
            if idx != -1 and idx in chunk_store:
                retrieved_chunks.append(chunk_store[idx])
    else:
        retrieved_chunks = fallback_retrieve(query, k=5)

    context_str = "\n\n".join(retrieved_chunks)

    prompt = (
        'You are a ruthless, highly critical financial auditor. '
        'Based ONLY on the provided context, evaluate the risk level of this company. '
        'Output valid JSON only. No markdown blocks or extra text. '
        'Schema: {"threat_score": integer between 1 and 100, '
        '"critical_warning": "A punchy, one-sentence summary of the biggest threat", '
        '"anomalies": ["list of 2-3 weird or concerning data points found in the text"]}.'
        f'\n\nContext: {context_str}'
    )

    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt,
        )
        raw_text = response.text.strip()

        # Clean up markdown wrappers if Gemini returns them despite instruction
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        data = json.loads(raw_text.strip())

    except json.JSONDecodeError:
        return {"status": "error", "message": "Gemini failed to return valid JSON.", "raw_output": getattr(response, 'text', '')}
    except Exception as e:
        return {"status": "error", "message": f"Error generating response: {str(e)}"}

    return {
        "status": "success",
        "data": data,
        "retrieval_mode": "semantic-faiss" if using_semantic_search() else "keyword-fallback"
    }


async def _call_gemini_agent(prompt: str) -> dict:
    """Run a single Gemini agent call in a thread pool to avoid blocking the event loop."""
    loop = asyncio.get_event_loop()

    def _sync_call():
        client = get_genai_client()
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt,
        )
        raw = response.text.strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        elif raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        return json.loads(raw.strip())

    return await loop.run_in_executor(None, _sync_call)


# ════════════════════════════════════════════
# FEATURE: FINANCIAL RATIOS & ANALYSIS
# ════════════════════════════════════════════

@app.get("/api/v1/financial-ratios")
async def calculate_financial_ratios():
    """Calculate financial ratios from extracted KPIs."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    query = "Revenue, net income, total assets, total liabilities, operating income, EBITDA, debt, equity."
    
    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(5, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)
        retrieved_chunks = [chunk_store[idx] for idx in indices[0] if idx != -1 and idx in chunk_store]
    else:
        retrieved_chunks = fallback_retrieve(query, k=5)
    
    context_str = "\n\n".join(retrieved_chunks)
    
    prompt = (
        'You are a financial analyst. Extract these metrics from the provided context and output ONLY valid JSON. '
        'If a value is not found, use "Not Disclosed". '
        'Schema: {'
        '"revenue": "string", "net_income": "string", "total_assets": "string", "total_liabilities": "string", '
        '"operating_income": "string", "ebitda": "string"'
        '}. '
        f'Context: {context_str}'
    )
    
    try:
        data = await _call_gemini_agent(prompt)
        
        # Calculate derived ratios
        ratios = {
            "profitability": {
                "net_margin": "Calculated from net income / revenue",
                "operating_margin": "Calculated from operating income / revenue",
                "roe": "Return on Equity = Net Income / Equity",
                "roa": "Return on Assets = Net Income / Total Assets"
            },
            "leverage": {
                "debt_to_equity": "Total Liabilities / Equity",
                "debt_ratio": "Total Liabilities / Total Assets",
                "interest_coverage": "EBITDA / Interest Expense"
            }
        }
        
        return {"status": "success", "extracted_metrics": data, "calculated_ratios": ratios}
    except Exception as e:
        return {"status": "error", "message": f"Error calculating ratios: {str(e)}"}


# ════════════════════════════════════════════
# FEATURE: RED FLAG DETECTOR
# ════════════════════════════════════════════

@app.get("/api/v1/red-flags")
async def detect_red_flags_endpoint():
    """Detect red flags in financial documents."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    all_chunks = list(chunk_store.values()) if using_semantic_search() else fallback_chunks
    full_text = " ".join(all_chunks)
    
    flags = detect_red_flags(full_text)
    
    query = "Problems, challenges, risks, litigation, debt, losses, restructuring, warnings."
    
    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(3, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)
        context_chunks = [chunk_store[idx] for idx in indices[0] if idx != -1 and idx in chunk_store]
    else:
        context_chunks = fallback_retrieve(query, k=3)
    
    context_str = "\n\n".join(context_chunks)
    
    prompt = (
        'You are a risk analyst. Based on the provided context, identify 3-5 specific red flags or concerns. '
        'Output valid JSON only. No markdown. '
        'Schema: {"flags": ["specific red flag 1", "specific red flag 2", "..."], '
        '"severity": "HIGH or MEDIUM or LOW", '
        '"summary": "One sentence summary of the top concern"}'
        f'\n\nContext: {context_str}'
    )
    
    try:
        detailed_flags = await _call_gemini_agent(prompt)
    except:
        detailed_flags = {"flags": flags, "severity": "UNKNOWN", "summary": "Unable to analyze"}
    
    return {
        "status": "success",
        "detected_flags": flags,
        "detailed_analysis": detailed_flags
    }


# ════════════════════════════════════════════
# FEATURE: ESG SCORING
# ════════════════════════════════════════════

@app.get("/api/v1/esg-score")
async def calculate_esg_score():
    """Calculate Environmental, Social, Governance (ESG) score."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    query = "Environment, sustainability, carbon, emissions, diversity, board, governance, ethics, compliance."
    
    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(5, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)
        retrieved_chunks = [chunk_store[idx] for idx in indices[0] if idx != -1 and idx in chunk_store]
    else:
        retrieved_chunks = fallback_retrieve(query, k=5)
    
    context_str = "\n\n".join(retrieved_chunks)
    
    prompt = (
        'You are an ESG analyst. Based ONLY on the provided context, score this company on Environmental, Social, and Governance factors. '
        'Output valid JSON only. No markdown. '
        'Schema: {'
        '"environmental_score": "0-100", '
        '"social_score": "0-100", '
        '"governance_score": "0-100", '
        '"overall_esg": "0-100", '
        '"strengths": ["list of ESG strengths"], '
        '"weaknesses": ["list of ESG weaknesses"]'
        '}. '
        f'Context: {context_str}'
    )
    
    try:
        esg_data = await _call_gemini_agent(prompt)
        save_analysis_to_history("unknown", "esg_score", esg_data)
        return {"status": "success", "esg": esg_data}
    except Exception as e:
        return {"status": "error", "message": f"Error calculating ESG score: {str(e)}"}


# ════════════════════════════════════════════
# FEATURE: SENTIMENT ANALYSIS
# ════════════════════════════════════════════

@app.get("/api/v1/sentiment")
async def analyze_sentiment():
    """Analyze sentiment in financial documents."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    all_chunks = list(chunk_store.values()) if using_semantic_search() else fallback_chunks
    full_text = " ".join(all_chunks)
    
    sentiment_score = calculate_sentiment_score(full_text)
    
    query = "Outlook, prospects, management discussion, strategic initiatives, vision."
    
    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(3, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)
        retrieved_chunks = [chunk_store[idx] for idx in indices[0] if idx != -1 and idx in chunk_store]
    else:
        retrieved_chunks = fallback_retrieve(query, k=3)
    
    context_str = "\n\n".join(retrieved_chunks)
    
    prompt = (
        'You are a sentiment analyst. Based on the management tone and language in this context, assess the overall sentiment. '
        'Output valid JSON only. No markdown. '
        'Schema: {"tone": "Bullish or Neutral or Bearish", '
        '"confidence": "0-100", '
        '"summary": "One sentence on the overall tone"}'
        f'\n\nContext: {context_str}'
    )
    
    try:
        tone_analysis = await _call_gemini_agent(prompt)
    except:
        tone_analysis = {"tone": "Neutral", "confidence": 0, "summary": "Unable to analyze"}
    
    return {
        "status": "success",
        "sentiment_score": sentiment_score,
        "tone_analysis": tone_analysis
    }


# ════════════════════════════════════════════
# FEATURE: CASH FLOW ANALYSIS
# ════════════════════════════════════════════

@app.get("/api/v1/cash-flow")
async def analyze_cash_flow():
    """Analyze cash flow from financial documents."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    query = "Cash flow, operating activities, investing activities, financing activities, free cash flow, liquidity."
    
    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(5, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)
        retrieved_chunks = [chunk_store[idx] for idx in indices[0] if idx != -1 and idx in chunk_store]
    else:
        retrieved_chunks = fallback_retrieve(query, k=5)
    
    context_str = "\n\n".join(retrieved_chunks)
    
    prompt = (
        'You are a financial analyst. Extract cash flow information. '
        'Output valid JSON only. No markdown. '
        'Schema: {'
        '"operating_cash_flow": "string", '
        '"investing_cash_flow": "string", '
        '"financing_cash_flow": "string", '
        '"free_cash_flow": "string", '
        '"analysis": "Brief 1-2 sentence analysis of cash flow health"'
        '}'
        f'\n\nContext: {context_str}'
    )
    
    try:
        cash_flow_data = await _call_gemini_agent(prompt)
        return {"status": "success", "cash_flow": cash_flow_data}
    except Exception as e:
        return {"status": "error", "message": f"Error analyzing cash flow: {str(e)}"}


# ════════════════════════════════════════════
# FEATURE: WATCHLIST MANAGEMENT
# ════════════════════════════════════════════

@app.post("/api/v1/watchlist/add")
async def add_to_watchlist(ticker: str, company_name: str):
    """Add company to watchlist."""
    watchlist[ticker] = WatchlistItem(company_name=company_name, ticker=ticker)
    return {"status": "success", "message": f"Added {company_name} to watchlist"}

@app.get("/api/v1/watchlist")
async def get_watchlist():
    """Get all companies in watchlist."""
    return {"status": "success", "watchlist": list(watchlist.values())}

@app.delete("/api/v1/watchlist/{ticker}")
async def remove_from_watchlist(ticker: str):
    """Remove company from watchlist."""
    if ticker in watchlist:
        del watchlist[ticker]
        return {"status": "success", "message": f"Removed {ticker} from watchlist"}
    return {"status": "error", "message": f"{ticker} not found in watchlist"}


# ════════════════════════════════════════════
# FEATURE: ANALYSIS HISTORY
# ════════════════════════════════════════════

@app.get("/api/v1/history")
async def get_analysis_history(company: Optional[str] = None):
    """Get analysis history, optionally filtered by company."""
    if company:
        filtered = [a for a in analysis_history if a.company == company]
        return {"status": "success", "history": filtered}
    return {"status": "success", "history": analysis_history[-20:]}  # Last 20

@app.get("/api/v1/compare-history")
async def compare_analysis_history(company: str, analysis_type: str):
    """Compare historical analyses of same company."""
    snapshots = [a for a in analysis_history if a.company == company and a.analysis_type == analysis_type]
    
    if len(snapshots) < 2:
        return {"status": "error", "message": "Not enough historical data to compare"}
    
    return {
        "status": "success",
        "company": company,
        "analysis_type": analysis_type,
        "snapshots": snapshots[-3:]  # Last 3 analyses
    }


# ════════════════════════════════════════════
# FEATURE: PORTFOLIO ANALYSIS
# ════════════════════════════════════════════

@app.get("/api/v1/portfolio-analysis")
async def analyze_portfolio():
    """Analyze portfolio of multiple companies."""
    if not company_chunks:
        return {"status": "error", "message": "No companies in portfolio. Upload at least 2 reports."}
    
    companies = list(company_chunks.keys())
    
    if len(companies) < 2:
        return {"status": "error", "message": "Need at least 2 companies for portfolio analysis"}
    
    portfolio_data = {
        "num_companies": len(companies),
        "companies": companies,
        "analysis": "Portfolio analysis would compare diversification, sector exposure, and risk profile"
    }
    
    return {"status": "success", "portfolio": portfolio_data}


# ════════════════════════════════════════════
# FEATURE: ANOMALY DETECTION
# ════════════════════════════════════════════

@app.get("/api/v1/anomalies")
async def detect_anomalies():
    """Detect anomalies in financial data."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    query = "Unusual, unexpected, abnormal, discrepancy, inconsistency, surprising, significant change."
    
    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(4, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)
        retrieved_chunks = [chunk_store[idx] for idx in indices[0] if idx != -1 and idx in chunk_store]
    else:
        retrieved_chunks = fallback_retrieve(query, k=4)
    
    context_str = "\n\n".join(retrieved_chunks)
    
    prompt = (
        'You are a data analyst. Identify 3-5 anomalies or unusual data points in this financial context. '
        'Output valid JSON only. No markdown. '
        'Schema: {'
        '"anomalies": ["Specific anomaly 1", "Specific anomaly 2"], '
        '"severity": "HIGH or MEDIUM or LOW", '
        '"recommended_action": "What should be investigated"'
        '}'
        f'\n\nContext: {context_str}'
    )
    
    try:
        anomaly_data = await _call_gemini_agent(prompt)
        return {"status": "success", "anomalies": anomaly_data}
    except Exception as e:
        return {"status": "error", "message": f"Error detecting anomalies: {str(e)}"}


@app.get("/api/v1/debate")
async def debate():
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    query = "Business performance, revenue growth, market position, competitive advantages, risk factors, debt, and management outlook."

    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(5, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)
        retrieved_chunks = [chunk_store[idx] for idx in indices[0] if idx != -1 and idx in chunk_store]
    else:
        retrieved_chunks = fallback_retrieve(query, k=5)

    context_str = "\n\n".join(retrieved_chunks)

    bull_prompt = (
        'You are a hyper-optimistic venture capitalist and tech bull. '
        'Based ONLY on this context, make the most bullish argument possible for why this company will 10x. '
        'Output valid JSON only. No markdown. '
        'Schema: {"verdict": "One bold, punchy sentence on why this company will moon", '
        '"arguments": ["3 specific, punchy bullish data points from the text"]}.'
        f'\n\nContext: {context_str}'
    )

    bear_prompt = (
        'You are a ruthless short-seller and forensic accountant who profits when companies collapse. '
        'Based ONLY on this context, destroy this company. Find every red flag, lie, and warning sign. '
        'Output valid JSON only. No markdown. '
        'Schema: {"verdict": "One brutal, punchy sentence on why this company is doomed", '
        '"arguments": ["3 specific, brutal red flags from the text"]}.'
        f'\n\nContext: {context_str}'
    )

    try:
        bull_data, bear_data = await asyncio.gather(
            _call_gemini_agent(bull_prompt),
            _call_gemini_agent(bear_prompt)
        )
    except json.JSONDecodeError:
        return {"status": "error", "message": "One or both agents failed to return valid JSON."}
    except Exception as e:
        return {"status": "error", "message": f"Debate agents failed: {str(e)}"}

    return {
        "status": "success",
        "bull": bull_data,
        "bear": bear_data,
        "retrieval_mode": "semantic-faiss" if using_semantic_search() else "keyword-fallback"
    }


@app.post("/api/v1/compare")
async def compare_companies(req: CompareRequest):
    a_chunks = company_chunks.get(req.company_a)
    b_chunks = company_chunks.get(req.company_b)

    if not a_chunks:
        return {"status": "error", "message": f"No data found for '{req.company_a}'. Please upload its report with company={req.company_a}."}
    if not b_chunks:
        return {"status": "error", "message": f"No data found for '{req.company_b}'. Please upload its report with company={req.company_b}."}

    context_a = "\n".join(a_chunks[:5])
    context_b = "\n".join(b_chunks[:5])

    prompt = (
        f'You are a forensic financial analyst comparing two companies side-by-side. '
        f'Based ONLY on the provided context for each company, generate a comparison matrix. '
        f'IMPORTANT: If any data point is missing, explicitly use "Not Disclosed" instead of "N/A", "n/a", or "None". '
        f'Output valid JSON only. No markdown. '
        f'Schema: {{"metrics": [{{"label": "metric name", "value_a": "value for {req.company_a}", "value_b": "value for {req.company_b}", "winner": "A or B or DRAW"}}], '
        f'"verdict": "One-line brutal overall verdict on which company wins and why"}}. '
        f'Include 5 metrics: Revenue, Net Income, Debt Risk, Growth Outlook, Biggest Risk.'
        f'\n\nCOMPANY A ({req.company_a}) CONTEXT:\n{context_a}'
        f'\n\nCOMPANY B ({req.company_b}) CONTEXT:\n{context_b}'
    )

    try:
        data = await _call_gemini_agent(prompt)
    except json.JSONDecodeError:
        return {"status": "error", "message": "Gemini failed to return valid JSON for comparison."}
    except Exception as e:
        return {"status": "error", "message": f"Compare failed: {str(e)}"}

    return {
        "status": "success",
        "company_a": req.company_a,
        "company_b": req.company_b,
        "comparison": data
    }


# ════════════════════════════════════════════
# FEATURE 3: REALITY CHECK — Live Web Grounding
# ════════════════════════════════════════════

class RealityCheckRequest(BaseModel):
    claims: list[str]   # Extracted risk claims from the PDF

@app.post("/api/v1/reality-check")
async def reality_check(req: RealityCheckRequest):
    """Search the live web against PDF claims and return fact-check results."""
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        return {"status": "error", "message": "duckduckgo-search is not installed."}

    results = []
    ddgs = DDGS()

    for claim in req.claims[:3]:   # Limit to 3 to keep response fast
        try:
            search_results = list(ddgs.text(claim, max_results=2))
        except Exception:
            search_results = []

        # Summarize search results into a snippet
        snippets = " ".join([r.get("body", "") for r in search_results])[:800]
        sources = [r.get("href", "") for r in search_results if r.get("href")]

        if not snippets:
            results.append({
                "claim": claim,
                "status": "UNCLEAR",
                "reality": "No live news found to verify or dispute this claim.",
                "source": None
            })
            continue

        # Ask Gemini to compare the claim against the live search snippet
        fact_check_prompt = (
            f'You are a fact-checker. Compare this PDF claim against the live web evidence below.\n'
            f'PDF CLAIM: "{claim}"\n'
            f'LIVE WEB EVIDENCE: "{snippets}"\n\n'
            f'Output valid JSON only. No markdown. '
            f'Schema: {{"status": "CONFIRMED or DISPUTED or UNCLEAR", "reality": "One punchy sentence explaining what the web says vs the claim"}}'
        )

        try:
            checked = await _call_gemini_agent(fact_check_prompt)
            results.append({
                "claim": claim,
                "status": checked.get("status", "UNCLEAR"),
                "reality": checked.get("reality", ""),
                "source": sources[0] if sources else None
            })
        except Exception:
            results.append({
                "claim": claim,
                "status": "UNCLEAR",
                "reality": snippets[:200],
                "source": sources[0] if sources else None
            })

    return {"status": "success", "checks": results}


# ════════════════════════════════════════════
# FEATURE: DECISION SUPPORT SYSTEM
# ════════════════════════════════════════════

@app.get("/api/v1/decision-support")
async def decision_support():
    """Generate expansion decision, SWOT, and industry benchmarking."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    query = (
        "KPIs, revenue, profitability, growth, risk factors, debt, competition, market share, "
        "industry trends, management discussion and analysis, MD&A, outlook, expansion plans."
    )

    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(8, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)
        retrieved_chunks = [chunk_store[idx] for idx in indices[0] if idx != -1 and idx in chunk_store]
    else:
        retrieved_chunks = fallback_retrieve(query, k=8)

    context_str = "\n\n".join(retrieved_chunks)

    prompt = (
        'You are a strategy consultant and equity research analyst. '
        'Based ONLY on the provided context, produce a decision support brief. '
        'Use "Not Disclosed" whenever a specific value is missing. '
        'Output valid JSON only (no markdown, no extra text). '
        'Schema: {'
        '"expand_decision": {'
        '"pros": ["3-5 concise bullets supporting expansion"], '
        '"cons": ["3-5 concise bullets against expansion"], '
        '"risks": ["3-5 key risks"], '
        '"recommendation": "One clear recommendation sentence (Expand / Hold / Delay + rationale)"'
        '}, '
        '"swot": {'
        '"strengths": ["3-5 items"], '
        '"weaknesses": ["3-5 items"], '
        '"opportunities": ["3-5 items"], '
        '"threats": ["3-5 items"]'
        '}, '
        '"industry_benchmarking": {'
        '"industry_average": ['
        '{"metric": "metric name", "company_value": "value", "industry_average": "value", "position": "Above or In-line or Below"}'
        '], '
        '"competitors": ['
        '{"name": "competitor name", "summary": "one-line compare summary", "position": "Leading or Competitive or Lagging"}'
        ']'
        '}'
        '}. '
        f'\n\nContext: {context_str}'
    )

    try:
        data = await _call_gemini_agent(prompt)
        save_analysis_to_history("unknown", "decision_support", data)
        return {"status": "success", "decision_support": data}
    except Exception as e:
        return {"status": "error", "message": f"Error generating decision support: {str(e)}"}


def _get_decision_support_context() -> str:
    query = (
        "KPIs, revenue, profitability, growth, risk factors, debt, competition, market share, "
        "industry trends, management discussion and analysis, MD&A, outlook, expansion plans."
    )
    if using_semantic_search():
        query_embedding = embedding_model.encode([query])
        k = min(8, faiss_index.ntotal)
        _, indices = faiss_index.search(np.array(query_embedding, dtype=np.float32), k)
        retrieved_chunks = [chunk_store[idx] for idx in indices[0] if idx != -1 and idx in chunk_store]
    else:
        retrieved_chunks = fallback_retrieve(query, k=8)
    return "\n\n".join(retrieved_chunks)


@app.get("/api/v1/recommendation")
async def recommendation_analysis():
    """Generate expansion recommendation with pros/cons/risks."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    context_str = _get_decision_support_context()
    prompt = (
        'You are a strategy consultant. '
        'Based ONLY on the provided context, answer: "Should the company expand?" '
        'Output valid JSON only. No markdown. '
        'Schema: {"pros": ["3-5 concise bullets"], "cons": ["3-5 concise bullets"], '
        '"risks": ["3-5 key risks"], "recommendation": "One clear sentence (Expand / Hold / Delay + rationale)"}'
        f'\n\nContext: {context_str}'
    )
    try:
        data = await _call_gemini_agent(prompt)
        save_analysis_to_history("unknown", "recommendation", data)
        return {"status": "success", "recommendation": data}
    except Exception as e:
        return {"status": "error", "message": f"Error generating recommendation: {str(e)}"}


@app.get("/api/v1/swot")
async def swot_analysis():
    """Generate SWOT analysis from report context."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    context_str = _get_decision_support_context()
    prompt = (
        'You are an MBA strategy analyst. '
        'Based ONLY on the provided context, generate SWOT analysis. '
        'Output valid JSON only. No markdown. '
        'Schema: {"strengths": ["3-5 items"], "weaknesses": ["3-5 items"], '
        '"opportunities": ["3-5 items"], "threats": ["3-5 items"]}'
        f'\n\nContext: {context_str}'
    )
    try:
        data = await _call_gemini_agent(prompt)
        save_analysis_to_history("unknown", "swot", data)
        return {"status": "success", "swot": data}
    except Exception as e:
        return {"status": "error", "message": f"Error generating SWOT: {str(e)}"}


@app.get("/api/v1/industry-benchmarking")
async def industry_benchmarking():
    """Compare company performance to industry averages and competitors."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    context_str = _get_decision_support_context()
    prompt = (
        'You are an equity research analyst. '
        'Based ONLY on the provided context, produce industry benchmarking. '
        'Use "Not Disclosed" when data is missing. '
        'Output valid JSON only. No markdown. '
        'Schema: {"industry_average": ['
        '{"metric": "metric name", "company_value": "value", "industry_average": "value", "position": "Above or In-line or Below"}'
        '], "competitors": ['
        '{"name": "competitor name", "summary": "one-line compare summary", "position": "Leading or Competitive or Lagging"}'
        ']}'
        f'\n\nContext: {context_str}'
    )
    try:
        data = await _call_gemini_agent(prompt)
        save_analysis_to_history("unknown", "industry_benchmarking", data)
        return {"status": "success", "industry_benchmarking": data}
    except Exception as e:
        return {"status": "error", "message": f"Error generating industry benchmarking: {str(e)}"}


@app.get("/api/v1/professional-pack")
async def professional_pack():
    """Generate professional MBA-style analysis pack."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    context_str = _get_decision_support_context()
    prompt = (
        'You are a top-tier strategy + finance consultant preparing a board-level memo. '
        'Based ONLY on the provided context, generate a professional analysis pack that is detailed, actionable, and MBA-grade. '
        'Use "Not Disclosed" when data is missing. Output valid JSON only. No markdown. '
        'Schema: {'
        '"executive_view": {'
        '"board_summary": "3-5 sentence executive summary", '
        '"investment_thesis": ["5-8 bullets"], '
        '"key_risks": ["5-8 bullets"], '
        '"decision_gates": ["5-8 clear go/no-go checks"], '
        '"confidence_score": "0-100"'
        '}, '
        '"strategy_view": {'
        '"tam_sam_som": {"tam": "string", "sam": "string", "som": "string"}, '
        '"porters_five_forces": ['
        '{"force": "force name", "intensity": "High or Medium or Low", "note": "one-line rationale", "score": "0-100"}'
        '], '
        '"value_chain": ["5-10 bullets"], '
        '"moat_durability": "1 concise paragraph", '
        '"scenarios": ['
        '{"case": "Downside or Base or Upside", "assumption": "key assumption", "impact": "expected impact", "probability": "0-100"}'
        '], '
        '"strategy_scorecard": ['
        '{"dimension": "market_attractiveness or competitive_position or execution_readiness", "score": "0-100", "note": "short note"}'
        ']'
        '}, '
        '"finance_view": {'
        '"driver_tree": ["5-10 drivers"], '
        '"unit_economics": ['
        '{"metric": "metric name", "value": "value", "comment": "short interpretation"}'
        '], '
        '"margin_bridge": ["5-10 bridge bullets"], '
        '"sensitivity": ['
        '{"variable": "variable", "change": "assumption delta", "effect": "effect on outcome"}'
        '], '
        '"financial_health_scorecard": ['
        '{"dimension": "growth or profitability or liquidity or leverage or resilience", "score": "0-100", "note": "short note"}'
        '], '
        '"three_period_trend": ['
        '{"period": "T-2 or T-1 or T0", "growth": "0-100", "profitability": "0-100", "risk": "0-100"}'
        ']'
        '}, '
        '"benchmark_view": {'
        '"peer_set_methodology": "1 paragraph", '
        '"normalized_comparison": ['
        '{"metric": "metric", "company": "value", "peer_median": "value", "percentile_rank": "0-100"}'
        '], '
        '"gap_to_best": ['
        '{"metric": "metric", "best_in_class": "value", "company": "value", "gap": "difference"}'
        '], '
        '"benchmark_score": "0-100"'
        '}, '
        '"recommended_actions": ['
        '{"horizon": "0-90d or 3-12m or 12m+", "action": "action text", "owner": "owner role", "priority": "High or Medium or Low"}'
        ']'
        '}'
        f'\n\nContext: {context_str}'
    )
    try:
        data = await _call_gemini_agent(prompt)
        source_chunks = [chunk for chunk in context_str.split("\n\n") if chunk.strip()]
        data["traceability"] = {
            "retrieved_chunks": source_chunks,
            "source_count": len(source_chunks),
        }
        data["data_quality"] = {
            "completeness_score": max(10, min(100, len(context_str.split()) // 20)),
            "coverage_note": "Score is proportional to extracted context depth from uploaded report."
        }
        save_analysis_to_history("unknown", "professional_pack", data)
        return {"status": "success", "professional_pack": data}
    except Exception as e:
        return {"status": "error", "message": f"Error generating professional pack: {str(e)}"}


@app.get("/api/v1/valuation-quick-pack")
async def valuation_quick_pack():
    """Generate quick valuation ranges for downside/base/upside cases."""
    if total_indexed_chunks() == 0:
        return {"status": "error", "message": "No document has been uploaded yet. Please upload a report first."}

    context_str = _get_decision_support_context()
    prompt = (
        'You are a valuation analyst. Based ONLY on provided context, create quick valuation pack. '
        'Output valid JSON only. No markdown. '
        'Schema: {"valuation_range": {"downside": "number", "base": "number", "upside": "number", "currency": "USD"}, '
        '"multiples_grid": [{"metric": "EV/Revenue or P/E etc", "company": "value", "peer_median": "value"}], '
        '"key_assumptions": ["3-6 assumptions"]}'
        f'\n\nContext: {context_str}'
    )
    try:
        data = await _call_gemini_agent(prompt)
        save_analysis_to_history("unknown", "valuation_quick_pack", data)
        return {"status": "success", "valuation": data}
    except Exception as e:
        return {"status": "error", "message": f"Error generating valuation quick pack: {str(e)}"}


@app.post("/api/v1/export-pack")
async def export_pack(req: ExportPackRequest):
    """Create export-friendly markdown/plaintext report from professional pack."""
    if not req.professional_pack:
        return {"status": "error", "message": "No professional pack payload provided."}
    title = req.title.strip() or "Professional Pack Export"
    fmt = req.format.lower().strip()
    if fmt not in {"markdown", "text"}:
        fmt = "markdown"

    pack_json = json.dumps(req.professional_pack, indent=2)
    if fmt == "markdown":
        rendered = f"# {title}\n\nGenerated: {datetime.now().isoformat()}\n\n```json\n{pack_json}\n```"
    else:
        rendered = f"{title}\nGenerated: {datetime.now().isoformat()}\n\n{pack_json}"

    return {"status": "success", "format": fmt, "content": rendered}
