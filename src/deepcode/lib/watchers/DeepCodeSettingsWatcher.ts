import * as vscode from "vscode";
import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import { errorsLogs } from "../../messages/errorsServerLogMessages";

class DeepCodeSettingsWatcher implements DeepCode.DeepCodeWatcherInterface {
  
  private async onChangeConfiguration(extension: DeepCode.ExtensionInterface, key: string): Promise<void> {
    const extensionConfig = vscode.workspace.getConfiguration('deepcode');
    // @ts-ignore */}
    const url: string = extensionConfig.get('url');
    
    const cleaned = url.replace(/\/$/, '');
    if (cleaned !== url) {
      extensionConfig.update('url', cleaned, true);
    } else {
      await extension.startExtension();
    }
  }

  public activate(extension: DeepCode.ExtensionInterface): void {
    vscode.workspace.onDidChangeConfiguration(
      async (event: vscode.ConfigurationChangeEvent): Promise<void> => {
        const change = [
          'deepcode.url', 'deepcode.token', 'deepcode.uploadApproved'
        ].find(config => event.affectsConfiguration(config));
        if (change) {
          try {
            await this.onChangeConfiguration(extension, change);
          } catch (error) {
            await extension.processError(error, {
              message: errorsLogs.configWatcher,
              data: {
                configurationKey: change,
              }
            })
          }
        }
      }
    );
  }
}

export default DeepCodeSettingsWatcher;
