import * as vscode from "vscode";
import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import DeepCodeConfig from "../../../config/DeepCodeConfig";
import DeepCodeStore from "../../../config/DeepCodeStore";
import DeepCodeAnalyzer from "../analyzer/DeepCodeAnalyzer";
import DeepCodeStatusBarItem from "../statusBarItem/DeepCodeStatusBarItem";
import DeepCodeFilesWatcher from "../watchers/DeepCodeFilesWatcher";
import DeepCodeWorkspaceFoldersWatcher from "../watchers/WorkspaceFoldersWatcher";
import DeepCodeEditorsWatcher from "../watchers/EditorsWatcher";
import DeepCodeSettingsWatcher from "../watchers/DeepCodeSettingsWatcher";
import DeepCodeErrorhandler from "../errorHandler/DeepCodeErrorHandler";
import DeepCodeFeedbackReminder from "../feedbackReminder/DeepCodeFeedbackReminder";

export default class BaseDeepCodeModule {
  public config: DeepCode.DeepCodeConfig;
  public store: DeepCode.ExtensionStoreInterface;
  public currentWorkspacePath: string;
  public workspacesPaths: Array<string>;
  public hashesBundles: DeepCode.HashesBundlesInterface;
  public serverFilesFilterList: DeepCode.AllowedServerFilterListInterface;
  public remoteBundles: DeepCode.RemoteBundlesCollectionInterface;
  public token: string;
  public analyzer: DeepCode.AnalyzerInterface;
  public statusBarItem: DeepCode.StatusBarItemInterface;
  public filesWatcher: DeepCode.DeepCodeWatcherInterface;
  public workspacesWatcher: DeepCode.DeepCodeWatcherInterface;
  public editorsWatcher: DeepCode.DeepCodeWatcherInterface;
  public settingsWatcher: DeepCode.DeepCodeWatcherInterface;
  public errorHandler: DeepCode.ErrorHandlerInterface;
  public feedbackReminder: DeepCode.DeepCodeWatcherInterface;

  constructor() {
    this.config = new DeepCodeConfig().deepcode;
    this.store = new DeepCodeStore();
    this.currentWorkspacePath = "";
    this.workspacesPaths = [];
    this.hashesBundles = {};
    this.serverFilesFilterList = {};
    this.remoteBundles = {};
    this.token = "";
    this.analyzer = new DeepCodeAnalyzer();
    this.statusBarItem = new DeepCodeStatusBarItem();
    this.filesWatcher = new DeepCodeFilesWatcher();
    this.workspacesWatcher = new DeepCodeWorkspaceFoldersWatcher();
    this.editorsWatcher = new DeepCodeEditorsWatcher();
    this.settingsWatcher = new DeepCodeSettingsWatcher();
    this.errorHandler = new DeepCodeErrorhandler();
    this.feedbackReminder = new DeepCodeFeedbackReminder();
  }
}
