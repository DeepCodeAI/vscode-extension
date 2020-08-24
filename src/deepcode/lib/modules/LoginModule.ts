import ReportModule from "./ReportModule";
import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import http from "../../http/requests";
import { setContext, viewInBrowser } from "../../utils/vscodeCommandsUtils";
import { DEEPCODE_CONTEXT } from "../../constants/views";
import { TELEMETRY_EVENTS } from "../../constants/telemetry";
import { errorsLogs } from "../../messages/errorsServerLogMessages";

const sleep = (duration: number) => new Promise(resolve => setTimeout(resolve, duration));

abstract class LoginModule extends ReportModule implements DeepCode.LoginModuleInterface {
  private pendingLogin: boolean = false;

  async initiateLogin(): Promise<void> {
    if (this.pendingLogin) {
      return;
    }

    this.pendingLogin = true;
    try {
      await setContext(DEEPCODE_CONTEXT.LOGGEDIN, false);
      const result = await http.login(this.baseURL, this.source);
      const { sessionToken, loginURL } = result;
      if (!sessionToken || !loginURL) {
        throw new Error(errorsLogs.login);
      }
      await this.setToken(sessionToken);
      await viewInBrowser(loginURL);
      await this.waitLoginConfirmation();
    } catch (err) {
      await this.processError(err, {
        message: errorsLogs.login
      });
    } finally {
      this.pendingLogin = false;
    }
  }

  async checkSession(): Promise<boolean> {
    let validSession = false;
    if (this.token) {
      try {
        validSession = !!(await http.checkSession(this.baseURL, this.token));
      } catch (err) {
        this.processError(err, {
          message: errorsLogs.loginStatus
        });
      }
    }
    await setContext(DEEPCODE_CONTEXT.LOGGEDIN, validSession);
    return validSession;
  }

  private async waitLoginConfirmation(): Promise<void> {
    if (!this.token) return;
    // 20 attempts to wait for user's login & consent
    for (let i = 0; i < 20; i++) {
      await sleep(1000);

      const confirmed = await this.checkSession();
      if (confirmed) {
        return;
      }
    }
  }

  async checkApproval(): Promise<boolean> {
    const approved = this.uploadApproved;
    await setContext(DEEPCODE_CONTEXT.APPROVED, approved);
    return approved;
  }

  async approveUpload(): Promise<void> {
    await this.setUploadApproved(true);
    await this.sendEvent(TELEMETRY_EVENTS.viewDashboard, {});
    await this.startExtension();
  }

}

export default LoginModule;
