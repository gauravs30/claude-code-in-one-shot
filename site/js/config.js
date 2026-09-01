/* ==========================================================================
   Runtime config — THE PHASE SEAM.
   Phase 1 (static): API_BASE is "", data comes from a build-time JSON file,
   all backend features are off.
   Phase 2+: point API_BASE at "/api", set DATA_URL to `${API_BASE}/projects`,
   and flip the feature flags. Nothing else in the frontend needs to change.
   ========================================================================== */
window.PORTFOLIO_CONFIG = {
  API_BASE: "",
  DATA_URL: "/data/projects.json",
  features: {
    contactApi: false, // Phase 2: POST /api/contact form
    analytics: false,  // Phase 2: POST /api/events page-view beacon
  },
};
