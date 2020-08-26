import * as vscode from "vscode";
import { DEEPCODE_EXTENSION_NAME } from "../constants/general";
import {
  VSCODE_GO_TO_SETTINGS_COMMAND,
  DEEPCODE_CONTEXT_PREFIX,
  DEEPCODE_OPEN_BROWSER,
} from "../constants/commands";
import { createDCIgnore } from "./filesUtils"

export const openDeepcodeSettingsCommand = async (): Promise<void> => {
  await vscode.commands.executeCommand(VSCODE_GO_TO_SETTINGS_COMMAND, DEEPCODE_EXTENSION_NAME);
};

export const setContext = async (key: string, value: unknown): Promise<void> => {
  console.log("DeepCode context", key, value);
  await vscode.commands.executeCommand('setContext', `${DEEPCODE_CONTEXT_PREFIX}${key}`, value);
};

export const viewInBrowser = async (url: string): Promise<void> => {
  await vscode.commands.executeCommand(DEEPCODE_OPEN_BROWSER, url);
};

export const createDCIgnoreCommand = (custom = false, path?: string): void => {
  path = path || vscode.workspace.rootPath;
  if (!path) return;
  createDCIgnore(path, custom).catch(console.error);
};
