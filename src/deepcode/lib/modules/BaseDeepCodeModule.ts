import * as vscode from 'vscode';
import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import DeepCodeStore from "../../../config/DeepCodeStore";
import DeepCodeAnalyzer from "../analyzer/DeepCodeAnalyzer";
import DeepCodeStatusBarItem from "../statusBarItem/DeepCodeStatusBarItem";
import DeepCodeFilesWatcher from "../watchers/DeepCodeFilesWatcher";
import DeepCodeWorkspaceFoldersWatcher from "../watchers/WorkspaceFoldersWatcher";
import DeepCodeEditorsWatcher from "../watchers/EditorsWatcher";
import DeepCodeSettingsWatcher from "../watchers/DeepCodeSettingsWatcher";
import DeepCodeErrorhandler from "../errorHandler/DeepCodeErrorHandler";
import { IDE_NAME } from "../../constants/general";

export default class BaseDeepCodeModule implements DeepCode.BaseDeepCodeModuleInterface {
  public store: DeepCode.ExtensionStoreInterface;
  public context: vscode.ExtensionContext | undefined;
  public currentWorkspacePath: string;
  public workspacesPaths: Array<string>;
  public hashesBundles: DeepCode.HashesBundlesInterface;
  public serverFilesFilterList: DeepCode.AllowedServerFilterListInterface;
  public remoteBundles: DeepCode.RemoteBundlesCollectionInterface;
  public analyzer: DeepCode.AnalyzerInterface;
  public statusBarItem: DeepCode.StatusBarItemInterface;
  public filesWatcher: DeepCode.DeepCodeWatcherInterface;
  public workspacesWatcher: DeepCode.DeepCodeWatcherInterface;
  public editorsWatcher: DeepCode.DeepCodeWatcherInterface;
  public settingsWatcher: DeepCode.DeepCodeWatcherInterface;
  public errorHandler: DeepCode.ErrorHandlerInterface;

  // These attributes are used in tests
  public staticToken = '';
  public staticBaseURL = '';
  public defaultBaseURL = 'https://www.deepcode.ai';
  public staticUploadApproved = false;

  constructor() {
    this.store = new DeepCodeStore();
    this.currentWorkspacePath = "";
    this.workspacesPaths = [];
    this.hashesBundles = {};
    this.serverFilesFilterList = {};
    this.remoteBundles = {};
    this.analyzer = new DeepCodeAnalyzer();
    this.statusBarItem = new DeepCodeStatusBarItem();
    this.filesWatcher = new DeepCodeFilesWatcher();
    this.workspacesWatcher = new DeepCodeWorkspaceFoldersWatcher();
    this.editorsWatcher = new DeepCodeEditorsWatcher();
    this.settingsWatcher = new DeepCodeSettingsWatcher();
    this.errorHandler = new DeepCodeErrorhandler();
  }

  public get baseURL(): string {
    // @ts-ignore */}
    return this.staticBaseURL || vscode.workspace.getConfiguration('deepcode').get('url') || this.defaultBaseURL;
  }

  public get termsConditionsUrl(): string {
    return `${this.baseURL}/tc?utm_source=vsc`;
  }

  public get token(): string {
    // @ts-ignore */}
    return this.staticToken || vscode.workspace.getConfiguration('deepcode').get('token');
  }

  public async setToken(token: string): Promise<void>  {
    this.staticToken = '';
    await vscode.workspace.getConfiguration('deepcode').update('token', token, true);
  }

  public get source(): string {
    return process.env['GITPOD_WORKSPACE_ID'] ? 'gitpod' : IDE_NAME;
  }

  public get uploadApproved(): boolean {
    return this.staticUploadApproved || this.source !== IDE_NAME || !!(vscode.workspace.getConfiguration('deepcode').get('uploadApproved'));
  }

  public async approveUpload(isGlobal: boolean = false): Promise<void> {
    await vscode.workspace.getConfiguration('deepcode').update('uploadApproved', true, isGlobal);
  }

  public get shouldHideDCIgnore(): boolean {
    return !!(vscode.workspace.getConfiguration('deepcode').get('hideDCIgnore'));
  }

  public async hideDCIgnore(): Promise<void> {
    await vscode.workspace.getConfiguration('deepcode').update('hideDCIgnore', true, false);
  }

  public get shouldReportErrors(): boolean {
    return !!vscode.workspace.getConfiguration('deepcode').get('yesCrashReport');
  }

  public get shouldReportEvents(): boolean {
    return !!vscode.workspace.getConfiguration('deepcode').get('yesTelemetry');
  }
}
