import * as vscode from "vscode";
import { DEEPCODE_EXTENSION_NAME } from "../constants/general";
import {
  VSCODE_VIEW_CONTAINER_PREFIX,
  VSCODE_GO_TO_SETTINGS_COMMAND,
  DEEPCODE_CONTEXT_PREFIX,
  DEEPCODE_OPEN_BROWSER_COMMAND,
} from "../constants/commands";
import { createDCIgnore } from "./ignoreFileUtils"

export const openDeepcodeSettingsCommand = async (): Promise<void> => {
  await vscode.commands.executeCommand(VSCODE_GO_TO_SETTINGS_COMMAND, DEEPCODE_EXTENSION_NAME);
};

export const openDeepcodeViewContainer = async (): Promise<void> => {
  await vscode.commands.executeCommand(`${VSCODE_VIEW_CONTAINER_PREFIX}${DEEPCODE_EXTENSION_NAME}`);
};

export const setContext = async (key: string, value: unknown): Promise<void> => {
  await vscode.commands.executeCommand('setContext', `${DEEPCODE_CONTEXT_PREFIX}${key}`, value);
};

export const viewInBrowser = async (url: string): Promise<void> => {
  await vscode.commands.executeCommand(DEEPCODE_OPEN_BROWSER_COMMAND, url);
};

export const createDCIgnoreCommand = async (custom = false, path?: string): Promise<void> => {
  if (!path) {
    const paths = (vscode.workspace.workspaceFolders || []).map(f => f.uri.fsPath);
    for (const p of paths) {
      await createDCIgnore(p, custom);
    }
  } else {
    await createDCIgnore(path, custom);
  }
};
