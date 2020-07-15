import * as vscode from "vscode";
import { DEEPCODE_NAME } from "../constants/general";
import {
  DEEPCODE_START_COMMAND,
  VSCODE_GO_TO_SETTINGS_COMMAND
} from "../constants/commands";
import { createDCIgnore } from "./filesUtils"

export const getDeepcodeExtensionId = (): string => {
  const extension = vscode.extensions.all.find(
    extension => extension.packageJSON.displayName === DEEPCODE_NAME
  );
  return extension ? extension.packageJSON.id : "";
};

export const openDeepcodeSettingsCommand = (): void => {
  const deepcodeId = getDeepcodeExtensionId();
  vscode.commands.executeCommand(VSCODE_GO_TO_SETTINGS_COMMAND, deepcodeId);
};

export const createDCIgnoreCommand = (): void => {
  const path = vscode.workspace.rootPath;
  if (!path) return;
  createDCIgnore(path, false).catch(console.error);
};

export const startDeepCodeCommand = (): void => {
  vscode.commands.executeCommand(DEEPCODE_START_COMMAND);
};
