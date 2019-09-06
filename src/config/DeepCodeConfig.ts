import DeepCode from "../interfaces/DeepCodeInterfaces";

class DeepCodeConfig implements DeepCode.ExtensionConfigInterface {
  public deepcode: DeepCode.DeepCodeConfig;
  constructor() {
    this.deepcode = this.createExtensionConfig();
  }

  private createExtensionConfig() {
    const extensionConfig = {
      deepcodeUrl: "",
      vscodeMarketplaceUrl: "https://marketplace.visualstudio.com",
      get baseApiUrl() {
        return `${this.deepcodeUrl}publicapi`;
      },
      get loginUrl(): string {
        return `${this.baseApiUrl}/login`;
      },
      get checkSessionUrl(): string {
        return `${this.baseApiUrl}/session`;
      },
      get filtersUrl(): string {
        return `${this.baseApiUrl}/filters`;
      },
      get createBundleUrl(): string {
        return `${this.baseApiUrl}/bundle`;
      },
      getUploadFilesUrl(bundleId: string): string {
        return `${this.baseApiUrl}/file/${bundleId}`;
      },
      getbundleIdUrl(bundleId: string): string {
        return `${this.baseApiUrl}/bundle/${bundleId}`;
      },
      getAnalysisUrl(bundleId: string): string {
        return `${this.baseApiUrl}/analysis/${bundleId}`;
      },
      getDifAnalysisUrl(bundleIdOne: string, bundleIdTwo: string): string {
        return `${this.baseApiUrl}/analysis/${bundleIdOne}/${bundleIdTwo}`;
      },
      get errorUrl(): string {
        return `${this.baseApiUrl}/error`;
      },
      get configureAccountUrl(): string {
        return `${this.deepcodeUrl}cloud-login?redirectURL=%2Fapp%2F~platform/account`;
      },
      get termsConditionsUrl(): string {
        return `${this.deepcodeUrl}tc`;
      },
      changeDeepCodeUrl: (url: string): void => {
        this.deepcode.deepcodeUrl = url;
      },
      getMarketplaceExtensionFeedbackUrl(extensionId: string): string {
        return `${this.vscodeMarketplaceUrl}/items?itemName=${extensionId}&ssr=false#review-details`;
      }
    };
    return extensionConfig;
  }
}

export default DeepCodeConfig;
