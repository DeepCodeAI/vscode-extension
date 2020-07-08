import * as vscode from "vscode";
import * as open from "open";

import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import http from "../../http/requests";
import { deepCodeMessages } from "../../messages/deepCodeMessages";
import ReportModule from "./ReportModule";

const sleep = (duration: number) => new Promise(resolve => setTimeout(resolve, duration));

class LoginModule extends ReportModule implements DeepCode.LoginModuleInterface {
  private pendingLogin: boolean = false;

  public async initiateLogin(): Promise<void> {
    if (this.pendingLogin) {
      return
    }
    this.pendingLogin = true;

    try {
      const { login } = deepCodeMessages;
      let pressedButton: string | undefined;

      pressedButton = await vscode.window.showInformationMessage(login.msg, login.button);
      if (pressedButton === login.button) {
        const result = await http.login(this.baseURL, this.source);

        let { sessionToken, loginURL } = result;
        if (!sessionToken || !loginURL) {
          throw new Error();
        }
        await open(loginURL);
        await this.setToken(sessionToken);
        await this.waitLoginConfirmation();
      }
    } finally {
      this.pendingLogin = false;
    }
  }

  public checkSession(): Promise<boolean> {
    if (!this.token) return Promise.resolve(false);
    return http.checkSession(this.baseURL, this.token);
  }

  private async waitLoginConfirmation(): Promise<void> {
    if (!this.token) return;
    // 20 attempts to wait for user's login & consent
    for (let i = 0; i < 20; i++) {
      await sleep(1000);

      const confirmed = await this.checkSession();
      if (confirmed) {
        return
      }
    }
  }

}

export default LoginModule;
