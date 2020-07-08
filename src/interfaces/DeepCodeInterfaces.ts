import {
  ExtensionContext,
  DiagnosticCollection,
  StatusBarItem,
  WorkspaceFolder,
  TextDocument,
  TextEditor
} from "vscode";
import * as vscode from "vscode";

namespace DeepCode {
  export type userStateItemType = string | number | boolean | undefined;

  export type configType = string | Function;

  export type errorType = Error | any;

  export type filesForSaveListType = Array<string>;

  export type openedTextEditorType = {
    fullPath: string;
    workspace: string;
    filePathInWorkspace: string;
    lineCount: {
      current: number;
      prevOffset: number;
    };
    contentChanges: Array<any>;
    document: TextDocument;
  };

  export type analysisSuggestionsType = {
    id: string;
    message: string;
    severity: number;
  };

  export interface PayloadMissingFileInterface {
    fileHash: string;
    filePath: string;
    fileContent: string;
  }

  export interface StateIitemsInterface {
    [key: string]: string;
  }

  export interface BundlesInterface {
    [key: string]: string;
  }

  export interface HashesBundlesInterface {
    [key: string]: BundlesInterface;
  }

  export interface StateSelectorsInterface {
    [key: string]: Function;
  }

  export interface RemoteBundleInterface {
    bundleId?: string;
    missingFiles?: Array<string>;
    uploadURL?: string;
  }

  export interface RemoteExtendBundleInterface {
    files?: { [key: string]: string };
    removedFiles?: Array<string>;
  }

  export interface RemoteBundlesCollectionInterface {
    [key: string]: RemoteBundleInterface;
  }

  export interface AllowedServerFilterListInterface {
    extensions?: Array<string>;
    configFiles?: Array<string>;
  }

  export interface SingleIssuePositionInterface {
    cols: Array<number>;
    rows: Array<number>;
  }

  export interface IssuePositionsInterface
    extends SingleIssuePositionInterface {
    markers?: Array<IssueMarkersInterface>;
  }

  export interface IssueMarkersInterface {
    msg: Array<number>;
    pos: Array<SingleIssuePositionInterface>;
  }

  export interface AnalysisResultsFileResultsInterface {
    [suggestionIndex: string]: Array<IssuePositionsInterface>;
  }

  export interface AnalysisResultsFilesInterface {
    files: {
      [filePath: string]: AnalysisResultsFileResultsInterface;
    };
  }

  export interface AnalysisSuggestionsInterface {
    [suggestionIndex: number]: analysisSuggestionsType;
  }

  export interface AnalysisServerResultsInterface
    extends AnalysisResultsFilesInterface {
    suggestions: AnalysisSuggestionsInterface;
  }

  export interface AnalysisResultsInterface
    extends AnalysisServerResultsInterface {
    success: boolean;
  }

  export interface AnalysisServerResponseInterface {
    status: string;
    progress: number;
    analysisURL: string;
    analysisResults?: AnalysisServerResultsInterface;
  }

  export interface AnalysisResultsCollectionInterface {
    [key: string]: AnalysisResultsInterface;
  }

  export interface IssuesListInterface {
    [suggestionIndex: number]: Array<DeepCode.IssuePositionsInterface>;
  }
  export interface IssuesListOptionsInterface {
    fileIssuesList: IssuesListInterface;
    suggestions: AnalysisSuggestionsInterface;
    fileUri: vscode.Uri;
  }

  export interface ExtensionStoreInterface {
    selectors: StateSelectorsInterface;
    actions: StateSelectorsInterface;
    createStore(context: ExtensionContext): Promise<void>;
    cleanStore(): void;
  }

  export interface AnalyzerInterface {
    activate(extension: ExtensionInterface | any): void;
    deepcodeReview: DiagnosticCollection | undefined;
    analysisResultsCollection: AnalysisResultsCollectionInterface;
    removeReviewResults(workspacePath: string): Promise<void>;
    createReviewResults(): Promise<void>;
    updateReviewResultsPositions(
      extension: DeepCode.ExtensionInterface,
      updatedFile: openedTextEditorType
    ): Promise<void>;
    configureIssuesDisplayBySeverity(
      severity: number,
      hide: boolean
    ): Promise<void>;
    setIssuesMarkersDecoration(editor: TextEditor | undefined): void;
    updateAnalysisResultsCollection(results: AnalysisResultsCollectionInterface, rootPath: string): void;
  }

  export interface StatusBarItemInterface {
    deepcodeStatusBarItem: StatusBarItem;
    show(): void;
  }

  export interface DeepCodeWatcherInterface {
    activate(extension: ExtensionInterface | any): void;
  }

  export interface ErrorHandlerInterface {
    processError(
      extension: ExtensionInterface | any,
      error: errorType,
      options?: { [key: string]: any }
    ): Promise<void>;
  }

  export interface BaseDeepCodeModuleInterface {
    store: DeepCode.ExtensionStoreInterface;
    currentWorkspacePath: string;
    workspacesPaths: Array<string>;
    hashesBundles: HashesBundlesInterface;
    serverFilesFilterList: AllowedServerFilterListInterface;
    remoteBundles: RemoteBundlesCollectionInterface;
    source: string;
    staticToken: string;
    defaultBaseURL: string;
    staticBaseURL: string;
    baseURL: string;
    termsConditionsUrl: string;
    token: string;
    setToken(token: string): Promise<void>;
    uploadApproved: boolean;
    shouldReportErrors: boolean;
    shouldReportEvents: boolean;
    approveUpload(isGlobal: boolean): Promise<void>;
    analyzer: DeepCode.AnalyzerInterface;
    statusBarItem: StatusBarItemInterface;
    filesWatcher: DeepCodeWatcherInterface;
    workspacesWatcher: DeepCodeWatcherInterface;
    settingsWatcher: DeepCodeWatcherInterface;
    errorHandler: ErrorHandlerInterface;
  }

  export interface ReportModuleInterface {
    sendError(options: {[key: string]: any}): Promise<void> | void;
    sendEvent(event: string, options: {[key: string]: any}): Promise<void> | void;
  }

  export interface LoginModuleInterface {
    initiateLogin(): Promise<void>;
    checkSession(): Promise<boolean>;
  }

  export interface BundlesModuleInterface {
    askUploadApproval(): Promise<void>;
    createFilesFilterList(): Promise<void>;
    createWorkspacesList(workspaces: WorkspaceFolder[]): void;
    changeWorkspaceList(workspacePath: string, deleteAddFlag?: boolean): void;
    updateCurrentWorkspacePath(newWorkspacePath: string): void;
    updateHashesBundles(
      workspacePath?: string,
      deleteAddFlag?: boolean
    ): Promise<void>;
    performBundlesActions(path: string): Promise<void>;
    updateExtensionRemoteBundles(
      workspacePath: string,
      bundle?: DeepCode.RemoteBundleInterface
    ): Promise<void>;
    checkIfHashesBundlesIsEmpty(bundlePath?: string): boolean;
    checkIfRemoteBundlesIsEmpty(bundlePath?: string): boolean;
  }

  export interface DeepCodeLibInterface {
    activateAll(): void;
    activateExtensionAnalyzeActions(): Promise<void>;
  }

  export interface ExtensionInterface
    extends BaseDeepCodeModuleInterface,
      ReportModuleInterface,
      LoginModuleInterface,
      BundlesModuleInterface,
      DeepCodeLibInterface {
    activate(context: ExtensionContext): void;
    startExtension(): any;
  }
}

export default DeepCode;
