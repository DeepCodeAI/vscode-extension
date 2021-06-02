export const DEEPCODE_VIEW_ANALYSIS = "deepcode.views.analysis";
export const DEEPCODE_VIEW_SUPPORT = "deepcode.views.support";
export const DEEPCODE_VIEW_ACTIONS = "deepcode.views.actions";
export const DEEPCODE_VIEW_SUGGESTION = "deepcode.views.suggestion";

// Having multiple boolean contexts instead of a single context
// with multiple values helps us to avoid flickering UI.
export const DEEPCODE_CONTEXT = {
  LOGGEDIN: 'loggedIn',
  APPROVED: 'uploadApproved',
  WORKSPACE_FOUND: 'workspaceFound',
  ERROR: 'error',
  MODE: 'mode',
  ADVANCED: 'advanced',
  DEPRECATED: 'deprecated',
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
  FILTERS: 'Supported extentions',
  COLLECTING: 'Collecting files',
  BUNDLING: 'Creating file bundles',
  UPLOADING: 'Uploading files',
};
