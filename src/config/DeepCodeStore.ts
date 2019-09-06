import * as vscode from "vscode";
import * as nodeFs from "fs";
import * as path from "path";
import DeepCode from "../interfaces/DeepCodeInterfaces";
import { ExtensionContext, Memento } from "vscode";
import { stateNames } from "../deepcode/constants/stateNames";
import {
  INSTALL_STATUS,
  STATUSFILE_NAME,
  DEEPCODE_NAME
} from "../deepcode/constants/general";
import { defaultFeedbackData } from "../deepcode/lib/feedbackReminder/feedbackHelpers";

class DeepCodeStore implements DeepCode.ExtensionStoreInterface {
  private globalState: Memento | any = {};
  private workspaceState: Memento | any = {};
  public selectors: DeepCode.StateSelectorsInterface = {};
  public actions: DeepCode.StateSelectorsInterface = {};

  private createSelectors(): DeepCode.StateSelectorsInterface {
    return {
      getLoggedInStatus: (): string | undefined =>
        this.globalState.get(stateNames.isLoggedIn),

      getAccountType: (): string | undefined =>
        this.globalState.get(stateNames.accountType),

      getConfirmUploadStatus: (
        folderPath: ""
      ): string | undefined | { [key: string]: boolean } => {
        const workspaceConfirms = this.workspaceState.get(
          stateNames.confirmedDownload
        );
        if (!folderPath) {
          return workspaceConfirms;
        }
        return workspaceConfirms[folderPath];
      },
      getSessionToken: (): string | undefined =>
<<<<<<< HEAD
        this.globalState.get(stateNames.sessionToken),
      getBackendConfigStatus: (): string | undefined =>
        this.globalState.get(stateNames.isBackendConfigured)
=======
        this.state.get(stateNames.sessionToken),
      getIstallTimeStamp: (): string | undefined =>
        this.state.get(stateNames.installTimeStamp),
      getFeedbackData: (): { [key: string]: any } | undefined =>
        this.state.get(stateNames.feedbackData)
>>>>>>> feedback-implementaion
    };
  }

  private createStateActions(): DeepCode.StateSelectorsInterface {
    return {
      setLoggedInStatus: (status: boolean): Thenable<void> =>
        this.globalState.update(stateNames.isLoggedIn, status),
      setAccountType: (type: string): Thenable<void> =>
        this.globalState.update(stateNames.accountType, type),
      setConfirmUploadStatus: (
        folderPath: string,
        status: boolean
      ): Thenable<void> => {
        if (!folderPath && !status) {
          return this.workspaceState.update(stateNames.confirmedDownload, {});
        }
        const workspaceConfirms = this.selectors.getConfirmUploadStatus();
        return this.workspaceState.update(stateNames.confirmedDownload, {
          ...workspaceConfirms,
          [folderPath]: status
        });
      },
      setSessionToken: (token: string): Thenable<void> =>
        this.globalState.update(stateNames.sessionToken, token),
      setBackendConfigStatus: (status: boolean = true): Thenable<void> =>
        this.globalState.update(stateNames.isBackendConfigured, status),
      setInstallTimeStamp: (timestamp: string): Thenable<void> =>
        this.globalState.update(stateNames.installTimeStamp, timestamp),
      setFeedbackData: (updatedData: { [key: string]: any }): Thenable<void> =>
        this.globalState.update(stateNames.feedbackData, updatedData)
    };
  }

  public cleanStore(): void {
    this.actions.setLoggedInStatus(false);
    this.actions.setSessionToken("");
    this.actions.setConfirmUploadStatus();
    this.actions.setAccountType("");
    this.actions.setBackendConfigStatus(false);
    this.actions.setInstallTimeStamp("");
    this.actions.setFeedbackData({});
  }

  public async createStore(context: ExtensionContext): Promise<void> {
    this.globalState = context.globalState;
    this.workspaceState = context.workspaceState;
    this.selectors = { ...this.createSelectors() };
    this.actions = { ...this.createStateActions() };
    if (!this.selectors.getConfirmUploadStatus()) {
      this.actions.setConfirmUploadStatus();
    }
  }
}

export default DeepCodeStore;
