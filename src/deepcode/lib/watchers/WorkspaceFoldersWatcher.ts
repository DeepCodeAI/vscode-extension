import * as vscode from "vscode";
import DeepCode from "../../../interfaces/DeepCodeInterfaces";

class DeepCodeWorkspaceFoldersWatcher
  implements DeepCode.DeepCodeWatcherInterface {
  public activate(extension: DeepCode.ExtensionInterface): void {
    this.watchCurrentTextEditorWorkspace(extension);
    this.watchWorkspacesChanges(extension);
  }

  private watchCurrentTextEditorWorkspace(
    extension: DeepCode.ExtensionInterface
  ): void {
    vscode.window.onDidChangeActiveTextEditor(
      (textEditor: vscode.TextEditor | undefined) => {
        const currentWorkspaceFolder: vscode.WorkspaceFolder | undefined =
          textEditor &&
          vscode.workspace.getWorkspaceFolder(textEditor.document.uri);

        const currentWorkspacePath: string = currentWorkspaceFolder
          ? currentWorkspaceFolder.uri.fsPath
          : "";
        // if workspace changes, change extension workspacefolder
        if (
          currentWorkspacePath &&
          currentWorkspacePath !== extension.currentWorkspacePath
        ) {
          extension.updateCurrentWorkspacePath(currentWorkspacePath);
        }
      }
    );
  }

  private watchWorkspacesChanges(extension: DeepCode.ExtensionInterface): void {
    const proceedWithBundlesActions = async (p: string) => {
      // await extension.performBundlesActions(p);
      await extension.startExtension();
    };

    vscode.workspace.onDidChangeWorkspaceFolders(
      async (
        workspaceFolders: vscode.WorkspaceFoldersChangeEvent
      ): Promise<void> => {
        if (workspaceFolders.added.length) {
          for await (const workspace of workspaceFolders.added) {
            const path = workspace.uri.fsPath;
            extension.changeWorkspaceList(path);
            await extension.updateHashesBundles(path);

            proceedWithBundlesActions(path);
          }
        }

        if (workspaceFolders.removed.length) {
          const deleteFlag = true;
          for await (const workspace of workspaceFolders.removed) {
            const path = workspace.uri.fsPath;
            extension.changeWorkspaceList(path, deleteFlag);
            await extension.updateHashesBundles(path, deleteFlag);
            // remove server bundle from remote bundles
            await extension.updateExtensionRemoteBundles(path);
            // remove analysis
            await extension.analyzer.removeReviewResults(path);
          }
        }
      }
    );
  }
}

export default DeepCodeWorkspaceFoldersWatcher;
