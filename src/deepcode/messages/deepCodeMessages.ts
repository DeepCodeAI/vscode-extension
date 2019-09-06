export const deepCodeMessages = {
  configureBackend: {
    msg: `If you want to use the cloud backend (https://www.deepcode.ai) press "Cloud". 
    If you want to use the extension with an on-premise installation of DeepCode please enter the URL of the on-premise backend in the settings by clicking "On-Premise".`,
    cloudBtn: "Cloud",
    onPremiseBtn: "On-Premise"
  },
  confirmUploadFilesToServer: {
    msg: (termsConditionsUrl: string, folderPath: string): string =>
      `You have not yet given your consent to upload folder ${folderPath} to DeepCode. Please give your consent by clicking ‘Confirm’.
      The Deepcode extension will transfer your code to the Deepcode server to perform its AI analysis. Your code is protected and used only for the purpose of informing you about issues in your code. [Terms & Conditions](${termsConditionsUrl})`,
    button: "Confirm"
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
    msg: (name: string): string =>
      `Whoops! DeepCode encountered a problem ${
        name ? `with "${name}" workspace` : ""
      }. This is an issue on our side and it will be looked into as soon as possible. You can manually retry the analysis by clicking "Retry" or we will retry after you edit and save a file.`,
    button: "Try again"
  },
  analysisProgress: {
    msg: "DeepCode analysis is running..."
  },
  configureAccountType: {
    msg: (termsConditionsUrl: string): string =>
      `The DeepCode extension works only with private DeepCode accounts at the moment. Please click on the "Configure" button to change your account type. [Terms & Conditions](${termsConditionsUrl})`,
    button: "Configure"
  },
  provideFeedback: {
    msg: "Would you like to provide feedback on the DeepCode extension?",
    button: "Provide feedback"
  }
};
