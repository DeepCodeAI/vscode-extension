import * as vscode from "vscode";
import * as open from "open";

import DeepCode from "../interfaces/DeepCodeInterfaces";
import DeepCodeLib from "./lib/modules/DeepCodeLib";

import {
  DEEPCODE_START_COMMAND,
  DEEPCODE_SETMODE_COMMAND,
  DEEPCODE_SETTINGS_COMMAND,
  DEEPCODE_DCIGNORE_COMMAND,
  DEEPCODE_LOGIN,
  DEEPCODE_APPROVE,
  DEEPCODE_OPEN_BROWSER,
  DEEPCODE_OPEN_LOCAL,
} from "./constants/commands";
import { openDeepcodeSettingsCommand, createDCIgnoreCommand } from "./utils/vscodeCommandsUtils";
import { errorsLogs } from "./messages/errorsServerLogMessages";

import {
  DEEPCODE_VIEW_SUPPORT,
  DEEPCODE_VIEW_ANALYSIS,
} from "./constants/views";
import { SupportProvider } from "./view/SupportProvider";
import { IssueProvider } from "./view/IssueProvider";

class DeepCodeExtension extends DeepCodeLib implements DeepCode.ExtensionInterface {
  private async executeCommand(
    name: string,
    fn: (...args: any[]) => Promise<any>,
    ...args: any[]
  ): Promise<any> {
    try {
      await fn(...args);
    } catch (error) {
      this.processError(error, {
        message: errorsLogs.command(name),
      });
    }
  }
  
  public activate(context: vscode.ExtensionContext): void {
    this.statusBarItem.show();

    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_OPEN_BROWSER,
        this.executeCommand.bind(
          this,
          DEEPCODE_OPEN_BROWSER,
          (url: string) => open(url)
        )
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_OPEN_LOCAL,
        (path: vscode.Uri, range?: vscode.Range) => {
          vscode.window.showTextDocument(path, { selection: range }).then(
            () => {}, (err) => this.processError(err, {
              message: errorsLogs.command(DEEPCODE_OPEN_LOCAL),
            })
          );
        }
      )
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_LOGIN,
        this.executeCommand.bind(
          this,
          DEEPCODE_LOGIN,
          this.initiateLogin.bind(this)
        )
      )
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_APPROVE,
        this.executeCommand.bind(
          this,
          DEEPCODE_APPROVE,
          this.approveUpload.bind(this)
        )
      )
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_START_COMMAND,
        this.executeCommand.bind(
          this,
          DEEPCODE_START_COMMAND,
          this.startExtension.bind(this)
        )
      )
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_SETMODE_COMMAND,
        this.setMode.bind(this)
      )
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_SETTINGS_COMMAND,
        this.executeCommand.bind(
          this,
          DEEPCODE_SETTINGS_COMMAND,
          openDeepcodeSettingsCommand
        )
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        DEEPCODE_DCIGNORE_COMMAND,
        createDCIgnoreCommand
      )
    );

    vscode.window.registerTreeDataProvider(
      DEEPCODE_VIEW_SUPPORT, 
      new SupportProvider(this)
    );

    vscode.window.registerTreeDataProvider(
      DEEPCODE_VIEW_ANALYSIS, 
      new IssueProvider(this)
    );

    this.activateAll();
    this.startExtension().catch((err) => this.processError(err, {
      message: errorsLogs.failedExecution,
    }));
  }

}

export default DeepCodeExtension;
