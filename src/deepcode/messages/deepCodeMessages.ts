export const deepCodeMessages = {
  confirmUploadFilesToServer: {
    msg:
      "The Deepcode extension will transfer your code to the Deepcode server to perform its AI analysis. Your code is protected and used only for the purpose of informing you about issues in your code.",
    button: "Confirm"
  },
  notConfirmedFileUpload: {
    msg:
      "To use DeepCode extension, please confirm transfering your code to DeepCode server for inspection.",
    button: "Confirm now"
  },
  login: {
    msg: "Use your GitHub or Bitbucket account to authenticate with DeepCode.",
    button: "Login"
  },
  unauthorized: {
    msg: "To use DeepCode extension you should login.",
    button: "Try login again"
  },
  error: {
    msg: "DeepCode encountered a problem.",
    button: "Restart"
  },
  codeReviewFailed: {
    msg: (name: string) =>
      `Whoops! DeepCode encountered a problem ${
        name ? `with "${name}" workspace` : ""
      }. This is an issue on our side and it will be looked into as soon as possible. You can manually retry the analysis by clicking "Retry" or we will retry after you edit and save a file.`,
    button: "Try again"
  },
  analysisProgress: {
    msg: "DeepCode analysis is running..."
  },
  configureAccountType: {
    msg:
      'The DeepCode extension works only with private DeepCode accounts at the moment. Please click on the "Configure" button to change your account type.',
    button: "Configure"
  },
  provideFeedback: {
    msg: "Would you like to provide feedback on the DeepCode extension?",
    button: "Provide feedback"
  }
};
