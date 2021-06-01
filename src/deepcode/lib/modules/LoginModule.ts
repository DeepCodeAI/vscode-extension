import * as vscode from "vscode";
import ReportModule from "./ReportModule";
import { LoginModuleInterface } from "../../../interfaces/DeepCodeInterfaces";
import { viewInBrowser } from "../../utils/vscodeCommandsUtils";
import { DEEPCODE_CONTEXT } from "../../constants/views";
import { openDeepcodeViewContainer } from "../../utils/vscodeCommandsUtils";
import { errorsLogs } from "../../messages/errorsServerLogMessages";
import { deepCodeMessages } from "../../messages/deepCodeMessages";
import { TELEMETRY_EVENTS } from "../../constants/telemetry";

import { startSession, checkSession } from '@deepcode/tsc';

const sleep = (duration: number) => new Promise(resolve => setTimeout(resolve, duration));

abstract class LoginModule extends ReportModule implements LoginModuleInterface {
  private pendingLogin: boolean = false;
  private pendingToken = '';
  private readonly deprecationNoteKey = 'deepcode.deprecationNoteMonth';

  async initiateLogin(): Promise<void> {
    await this.setContext(DEEPCODE_CONTEXT.LOGGEDIN, false);

    if (this.pendingLogin) {
      return;
    }

    this.pendingLogin = true;
    try {
      const checkCurrentToken = await this.checkSession();
      if (checkCurrentToken) return;

      // In case we already created a draft token earlier, check if it's confirmed already
      if (this.pendingToken) {
        try {
          const confirmedPendingToken = await this.checkSession(this.pendingToken);
          if (confirmedPendingToken) {
            await this.setToken(this.pendingToken);
            return;
          }
        } finally {
          this.pendingToken = '';
        }
      }

      const response = await startSession({ baseURL: this.baseURL, source: this.source });
      if (response.type === 'error') {
        throw new Error(errorsLogs.login);
      }

      const { sessionToken, loginURL } = response.value;

      await viewInBrowser(loginURL);
      const confirmed = await this.waitLoginConfirmation(sessionToken);
      if (confirmed) {
        await this.setToken(sessionToken);
      } else {
        this.pendingToken = sessionToken;
      }
    } catch (err) {
      await this.processError(err, {
        message: errorsLogs.login,
      });
    } finally {
      this.pendingLogin = false;
    }
  }

  async checkSession(token = ''): Promise<boolean> {
    let validSession = false;
    if (token || this.token) {
      try {
        const sessionResponse = await checkSession({
          baseURL: this.baseURL,
          sessionToken: token || this.token,
        });
        if (sessionResponse.type === 'error') {
          validSession = false;
        } else {
          validSession = sessionResponse.value;
        }
      } catch (err) {
        await this.processError(err, {
          message: errorsLogs.loginStatus,
        });
      }
    }
    await this.setContext(DEEPCODE_CONTEXT.LOGGEDIN, validSession);
    if (!validSession) await this.setLoadingBadge(true);
    return validSession;
  }

  private async waitLoginConfirmation(token: string): Promise<boolean> {
    // 20 attempts to wait for user's login & consent
    for (let i = 0; i < 20; i++) {
      await sleep(1000);

      const confirmed = await this.checkSession(token);
      if (confirmed) {
        return true;
      }
    }
    return false;
  }

  async checkApproval(): Promise<boolean> {
    const approved = this.uploadApproved;
    await this.setContext(DEEPCODE_CONTEXT.APPROVED, approved);
    if (!approved) await this.setLoadingBadge(true);
    return approved;
  }

  async approveUpload(): Promise<void> {
    await this.setUploadApproved(true);
    await this.setLoadingBadge(false);
    await this.checkApproval();
  }

  async checkWelcomeNotification(): Promise<void> {
    if (this.shouldShowWelcomeNotification) {
      this.processEvent(TELEMETRY_EVENTS.viewWelcomeNotification);
      let pressedButton = await vscode.window.showInformationMessage(
        deepCodeMessages.welcome.msg,
        deepCodeMessages.welcome.button,
      );
      if (pressedButton === deepCodeMessages.welcome.button) {
        await openDeepcodeViewContainer();
      }
      await this.hideWelcomeNotification();
    }
  }

  async checkAdvancedMode(): Promise<void> {
    await this.setContext(DEEPCODE_CONTEXT.ADVANCED, this.shouldShowAdvancedView);
  }

  async checkDeprecationNote(context: vscode.ExtensionContext): Promise<void> {
    const currentMonth = new Date().getMonth();
    const lastMessageMonth: number | undefined = context.globalState.get(this.deprecationNoteKey);

    if (!lastMessageMonth || currentMonth != lastMessageMonth) {
      context.globalState.update(this.deprecationNoteKey, currentMonth);
      await vscode.window.showInformationMessage(deepCodeMessages.deprecation.msg);
    }
  }
}

export default LoginModule;
