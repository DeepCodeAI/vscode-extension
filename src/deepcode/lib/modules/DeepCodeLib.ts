import * as vscode from "vscode";
import BundlesModule from "./BundlesModule";

export default class DeepCodeLib extends BundlesModule {
  public async activateActions(): Promise<void> {
    this.filesWatcher.activate(this);
    this.workspacesWatcher.activate(this);
    this.editorsWatcher.activate(this);
    this.settingsWatcher.activate(this);
    await this.activateExtensionStartActions();
    this.feedbackReminder.activate(this);
  }
  public async activateExtensionStartActions(): Promise<void> {
    // check if user is loggedIn and has confirmed uploading code
    const loggedInAndConfirmedUser =
      this.store.selectors.getLoggedInStatus() &&
      this.store.selectors.getConfirmUploadStatus();

    if (!loggedInAndConfirmedUser) {
      return;
    }
    const workspaceFolders: vscode.WorkspaceFolder[] | undefined =
      vscode.workspace.workspaceFolders;

    if (!workspaceFolders || !workspaceFolders.length) {
      return;
    }
    this.statusBarItem.show();
    this.createWorkspacesList(workspaceFolders);
    this.updateCurrentWorkspacePath(this.workspacesPaths[0]);
    await this.createFilesFilterList();
    await this.updateHashesBundles();
    for await (const path of this.workspacesPaths) {
      await this.performBundlesActions(path);
      if (!this.remoteBundles[path]) {
        break;
      }
    }
    await this.analyzer.reviewCode(this);
  }
}
