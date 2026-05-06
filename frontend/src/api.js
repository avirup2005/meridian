import axios from "axios"

/**
 * Upload a PDF file to the backend for parsing and vector indexing.
 * @param {File} file
 * @returns {Promise<object>} parsed upload response
 */
export async function uploadPDF(file, company) {
  const formData = new FormData()
  formData.append("file", file)
  const url = company ? `/api/v1/upload-report?company=${encodeURIComponent(company)}` : "/api/v1/upload-report"
  const response = await axios.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

/**
 * Fetch structured KPIs extracted by Gemini from the uploaded document.
 * @returns {Promise<object>} KPI data
 */
export async function fetchKPIs() {
  const response = await axios.get("/api/v1/extract-kpis")
  return response.data
}

/**
 * Ask a natural language question against the RAG pipeline.
 * @param {string} query
 * @returns {Promise<object>} answer data
 */
export async function askQuestion(query) {
  const response = await axios.post("/api/v1/ask", { query })
  return response.data
}

/**
 * Fetch AI-driven risk analysis with threat scoring.
 * @returns {Promise<object>} risk data with threat_score, critical_warning, anomalies
 */
export async function fetchRiskData() {
  const response = await axios.get("/api/v1/analyze-risk")
  return response.data
}

/**
 * Trigger the Bull vs. Bear multi-agent debate on the uploaded document.
 * @returns {Promise<object>} { bull: {...}, bear: {...} }
 */
export async function fetchDebate() {
  const response = await axios.get("/api/v1/debate")
  return response.data
}

/**
 * Compare two uploaded companies side-by-side.
 * @param {string} companyA
 * @param {string} companyB
 */
export async function compareCompanies(companyA, companyB) {
  const response = await axios.post("/api/v1/compare", {
    company_a: companyA,
    company_b: companyB,
  })
  return response.data
}

/**
 * Fact-check PDF claims against live DuckDuckGo search results.
 * @param {string[]} claims - list of risk claim strings from the PDF
 */
export async function fetchRealityCheck(claims) {
  const response = await axios.post("/api/v1/reality-check", { claims })
  return response.data
}

/**
 * Calculate financial ratios from extracted metrics.
 * @returns {Promise<object>} financial ratios data
 */
export async function fetchFinancialRatios() {
  const response = await axios.get("/api/v1/financial-ratios")
  return response.data
}

/**
 * Detect red flags in the financial document.
 * @returns {Promise<object>} red flags data
 */
export async function fetchRedFlags() {
  const response = await axios.get("/api/v1/red-flags")
  return response.data
}

/**
 * Calculate ESG (Environmental, Social, Governance) score.
 * @returns {Promise<object>} ESG score data
 */
export async function fetchESGScore() {
  const response = await axios.get("/api/v1/esg-score")
  return response.data
}

/**
 * Analyze sentiment in the financial document.
 * @returns {Promise<object>} sentiment analysis data
 */
export async function fetchSentiment() {
  const response = await axios.get("/api/v1/sentiment")
  return response.data
}

/**
 * Analyze cash flow from financial statements.
 * @returns {Promise<object>} cash flow analysis data
 */
export async function fetchCashFlow() {
  const response = await axios.get("/api/v1/cash-flow")
  return response.data
}

/**
 * Add a company to watchlist.
 * @param {string} ticker
 * @param {string} companyName
 */
export async function addToWatchlist(ticker, companyName) {
  const response = await axios.post("/api/v1/watchlist/add", null, {
    params: { ticker, company_name: companyName }
  })
  return response.data
}

/**
 * Get all companies in watchlist.
 * @returns {Promise<object>} watchlist data
 */
export async function fetchWatchlist() {
  const response = await axios.get("/api/v1/watchlist")
  return response.data
}

/**
 * Remove company from watchlist.
 * @param {string} ticker
 */
export async function removeFromWatchlist(ticker) {
  const response = await axios.delete(`/api/v1/watchlist/${ticker}`)
  return response.data
}

/**
 * Get analysis history.
 * @param {string} company - optional company filter
 */
export async function fetchAnalysisHistory(company = null) {
  const params = company ? { company } : {}
  const response = await axios.get("/api/v1/history", { params })
  return response.data
}

/**
 * Compare historical analyses of a company.
 * @param {string} company
 * @param {string} analysisType
 */
export async function compareAnalysisHistory(company, analysisType) {
  const response = await axios.get("/api/v1/compare-history", {
    params: { company, analysis_type: analysisType }
  })
  return response.data
}

/**
 * Analyze portfolio of multiple companies.
 * @returns {Promise<object>} portfolio analysis data
 */
export async function fetchPortfolioAnalysis() {
  const response = await axios.get("/api/v1/portfolio-analysis")
  return response.data
}

/**
 * Detect anomalies in financial data.
 * @returns {Promise<object>} anomalies data
 */
export async function fetchAnomalies() {
  const response = await axios.get("/api/v1/anomalies")
  return response.data
}

/**
 * Generate decision support (expand decision, SWOT, benchmarking).
 * @returns {Promise<object>} decision support analysis
 */
export async function fetchDecisionSupport() {
  const response = await axios.get("/api/v1/decision-support")
  return response.data
}

/**
 * Generate recommendation section only.
 * @returns {Promise<object>} recommendation payload
 */
export async function fetchRecommendation() {
  const response = await axios.get("/api/v1/recommendation")
  return response.data
}

/**
 * Generate SWOT section only.
 * @returns {Promise<object>} swot payload
 */
export async function fetchSWOT() {
  const response = await axios.get("/api/v1/swot")
  return response.data
}

/**
 * Generate industry benchmarking section only.
 * @returns {Promise<object>} benchmarking payload
 */
export async function fetchIndustryBenchmarking() {
  const response = await axios.get("/api/v1/industry-benchmarking")
  return response.data
}

/**
 * Generate full professional MBA analysis pack.
 * @returns {Promise<object>} professional pack payload
 */
export async function fetchProfessionalPack() {
  const response = await axios.get("/api/v1/professional-pack")
  return response.data
}

/**
 * Generate quick valuation pack (downside/base/upside + multiples).
 * @returns {Promise<object>}
 */
export async function fetchValuationQuickPack() {
  const response = await axios.get("/api/v1/valuation-quick-pack")
  return response.data
}

/**
 * Export professional pack to markdown/text.
 * @param {object} professionalPack
 * @param {"markdown"|"text"} format
 */
export async function exportProfessionalPack(professionalPack, format = "markdown") {
  const response = await axios.post("/api/v1/export-pack", {
    title: "Professional Pack Export",
    format,
    professional_pack: professionalPack,
  })
  return response.data
}
