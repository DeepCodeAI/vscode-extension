export const deepCodeMessages = {
  login: {
    msg: "Login to your account to obtain your API key and start analysing the code with DeepCode.",
    button: "Proceed"
  },
  uploadApproval: {
    msg: (termsConditionsUrl: string): string =>	
    `You are almost set 🤗. Let's confirm and start the remote analysis of this workspace ([DeepCode's Terms & Conditions](${termsConditionsUrl}))`,
    workspace: "Yes",
    global: "Always yes"
  },
  dcignoreNotFound: {
    msg: "No .dcignore was found in this repository, so all the files has been uploaded. Do you want to add a .dcignore file?",
    ignore: "Ignore",
    default: "Add default",
    custom: "Add custom"
  },
  error: {
    msg: "DeepCode encountered a problem.",
    button: "Restart"
  },
  codeReviewFailed: {
    msg: (name: string): string =>
      `Whoops! DeepCode encountered a problem ${
        name ? `with "${name}" workspace` : ""
      }. This is an issue on our side and it will be looked into as soon as possible. You can manually retry the analysis by clicking "Retry" or we will retry after you edit and save a file.`,
    button: "Try again"
  },
  fileLoadingProgress: {
    msg: "DeepCode is loading files" // no "..." due to composite title
  },
  analysisProgress: {
    msg: "DeepCode analysis is running..."
  },
  noConnection: {
    msg: "No connection to Deepcode server. Retrying..."
  }
};
