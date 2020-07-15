import * as vscode from "vscode";

import DeepCode from "../interfaces/DeepCodeInterfaces";
import DeepCodeLib from "./lib/modules/DeepCodeLib";

import { DEEPCODE_START_COMMAND, DEEPCODE_SETTINGS_COMMAND, DEEPCODE_DCIGNORE_COMMAND } from "./constants/commands";
import { openDeepcodeSettingsCommand, createDCIgnoreCommand } from "./utils/vscodeCommandsUtils";

class DeepCodeExtension extends DeepCodeLib implements DeepCode.ExtensionInterface {
  public activate(context: vscode.ExtensionContext): void {
    this.store.createStore(context);
    this.statusBarItem.show();
    this.context = context;

    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_START_COMMAND,
        this.activateExtensionAnalyzeActions.bind(this)
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_SETTINGS_COMMAND,
        openDeepcodeSettingsCommand
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_DCIGNORE_COMMAND,
        createDCIgnoreCommand
      )
    );

    context.subscriptions.push(
      { dispose: this.startExtension() },
    );

    this.runMigration();
  }

  private runMigration() {
    // TODO: remove it after 01.06.2020
    // Move 'deepcode.api.cloudBackend' to 'deepcode.url' configuration
    const config = vscode.workspace.getConfiguration('deepcode');
    const oldBaseURL = config.get('api.cloudBackend');
    if (!config.get('url') && oldBaseURL) {
      config.update('url', oldBaseURL, true);
    }
  }

  public startExtension(): any {
    this.activateAll();
    this.activateExtensionAnalyzeActions();
  }

}

export default DeepCodeExtension;
