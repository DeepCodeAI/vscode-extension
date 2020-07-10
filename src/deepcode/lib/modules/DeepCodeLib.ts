import * as vscode from "vscode";

import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import BundlesModule from "./BundlesModule";

export default class DeepCodeLib extends BundlesModule implements DeepCode.DeepCodeLibInterface {
  
  public activateAll(): void {
    // this.filesWatcher.activate(this);
    this.workspacesWatcher.activate(this);
    this.editorsWatcher.activate(this);
    this.settingsWatcher.activate(this);
    this.analyzer.activate(this);
  }


  public async activateExtensionAnalyzeActions(): Promise<void> {

    // First, check logged in or not
    let loggedIn = await this.checkSession();
    if (!loggedIn) {
      await this.initiateLogin();
      loggedIn = await this.checkSession();
      if (!loggedIn) {
        return;
      }
    }

    // Second, check user consent on sending files to server
    if (!this.uploadApproved) {
      await this.askUploadApproval();
      if (!this.uploadApproved) {
        return;
      }
    }

    const workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || !workspaceFolders.length) {
      return;
    }

    this.createWorkspacesList(workspaceFolders);

    if (this.workspacesPaths.length) {
      this.updateCurrentWorkspacePath(this.workspacesPaths[0]);

      await this.updateHashesBundles();

      // Third, initiate analysis
      try {
        // Main entry point to
        for await (const path of this.workspacesPaths) {
          await this.performBundlesActions(path);
        }
      } catch(err) {
        await this.errorHandler.processError(this, err);
      }
    }
  }
}
