export const DEEPCODE_VIEW_SUPPORT = "deepcode.views.support";
export const DEEPCODE_VIEW_ANALYSIS = "deepcode.views.analysis";

// Having multiple boolean contexts instead of a single context 
// with multiple values helps us to avoid flickering UI.
export const DEEPCODE_CONTEXT = {
  LOGGEDIN: "loggedIn",
  APPROVED: "uploadApproved",
  ANALYZING: "workspaceFound",
  ERROR: "error",
  MODE: "mode",
};

export const DEEPCODE_ERROR_CODES = {
  TRANSIENT: "transient",
  BLOCKING: "blocking",
};

export const DEEPCODE_MODE_CODES = {
  AUTO: 'auto',
  MANUAL: 'manual',
  PAUSED: 'paused',
  THROTTLED: 'throttled',
};

export const DEEPCODE_ANALYSIS_STATUS = {
  COLLECTING: "Collecting files",
  HASHING: "Hashing files",
  UPLOADING: "Uploading files",
  ANALYZING: "Analyzing files",
};