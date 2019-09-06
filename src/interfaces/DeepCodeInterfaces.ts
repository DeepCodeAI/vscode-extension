import {
  ExtensionContext,
  Memento,
  DiagnosticCollection,
  StatusBarItem,
  Uri,
  WorkspaceFolder,
  Range,
  TextDocument
} from "vscode";
import { StatusCodeError } from "request-promise/errors";

namespace DeepCode {
  export type userStateItemType = string | number | boolean | undefined;

  export type configType = string | Function;

  export type errorType = StatusCodeError | Error | any;

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
    [suggestionIndex: number]: {
      id: string;
      message: string;
      severity: number;
    };
  };

  export interface PayloadMissingFileInterface {
    fileHash: string;
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

  export interface RemoteBundlesCollectionInterface {
    [key: string]: RemoteBundleInterface;
  }

  export interface AllowedServerFilterListInterface {
    extensions?: Array<string>;
    configFiles?: Array<string>;
  }

  export interface AnalysisResultsFileResultsInterface {
    [suggestionIndex: number]: Array<{
      cols: Array<number>;
      rows: Array<number>;
    }>;
  }

  export interface AnalysisResultsFilesInterface {
    files: {
      [filePath: string]: AnalysisResultsFileResultsInterface;
    };
  }

  export interface AnalysisServerResultsInterface
    extends AnalysisResultsFilesInterface {
    suggestions: analysisSuggestionsType;
  }

  export interface AnalysisResultsInterface
    extends AnalysisServerResultsInterface {
    success: boolean;
  }

  export interface AnalysisResultsCollectionInterface {
    [key: string]: AnalysisResultsInterface;
  }

  export interface DeepCodeConfig {
    deepcodeUrl: string;
    baseApiUrl: string;
    loginUrl: string;
    checkSessionUrl: string;
    filtersUrl: string;
    createBundleUrl: string;
    getUploadFilesUrl: Function;
    getbundleIdUrl: Function;
    getAnalysisUrl: Function;
    getDifAnalysisUrl: Function;
    errorUrl: string;
    configureAccountUrl: string;
    termsConditionsUrl: string;
    changeDeepCodeUrl: Function;
    getMarketplaceExtensionFeedbackUrl: Function;
  }
  export interface ExtensionConfigInterface {
    deepcode: DeepCodeConfig;
  }

  export interface ExtensionStoreInterface {
    selectors: StateSelectorsInterface;
    actions: StateSelectorsInterface;
    createStore(context: ExtensionContext): Promise<void>;
    cleanStore(): void;
  }

  export interface AnalyzerInterface {
    deepcodeReview: DiagnosticCollection | undefined;
    analysisResultsCollection: AnalysisResultsCollectionInterface;
    reviewCode(
      extension: DeepCode.ExtensionInterface | any,
      workspacePath?: string
    ): Promise<void>;
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
    ): void;
    sendErrorToServer(
      extension: DeepCode.ExtensionInterface,
      error: DeepCode.errorType,
      options: { [key: string]: any }
    ): Promise<void>;
  }

  export interface ExtensionInterface {
    config: DeepCode.DeepCodeConfig;
    store: DeepCode.ExtensionStoreInterface;
    currentWorkspacePath: string;
    workspacesPaths: Array<string>;
    hashesBundles: HashesBundlesInterface;
    serverFilesFilterList: AllowedServerFilterListInterface;
    remoteBundles: RemoteBundlesCollectionInterface;
    token: string;
    analyzer: DeepCode.AnalyzerInterface;
    statusBarItem: StatusBarItemInterface;
    filesWatcher: DeepCodeWatcherInterface;
    workspacesWatcher: DeepCodeWatcherInterface;
    settingsWatcher: DeepCodeWatcherInterface;
    errorHandler: ErrorHandlerInterface;
    feedbackReminder: DeepCodeWatcherInterface;
    activate?(context: ExtensionContext): void;
    preActivateActions(): Promise<void>;
    activateActions(): Promise<void>;
    configureExtension(): Promise<void>;
    startExtension?(): any;
    manageExtensionStatus(): string;
    cancelFirstSaveFlag(): void;
    login(): Promise<boolean>;
    checkUploadConfirm(folderPath: string): boolean;
    showConfirmMsg(
      extension: DeepCode.ExtensionInterface | any,
      folderPath: string
    ): Promise<boolean>;
    firstSaveCheck(
      extension: ExtensionInterface,
      folderPath: string
    ): Promise<boolean>;
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
    uploadMissingFilesToServerBundle(
      workspacePath: string,
      chunkedPayload?: Array<PayloadMissingFileInterface>
    ): Promise<void>;
    checkBundleOnServer(
      workspacePath: string,
      attempts?: number
    ): Promise<void>;
    extendWorkspaceHashesBundle(
      updatedFiles: Array<{
        [key: string]: string;
      }>,
      workspacePath: string
    ): Promise<void>;
    extendBundleOnServer(
      updatedFiles: Array<{
        [key: string]: string;
      }>,
      workspacePath: string
    ): Promise<void>;
    activateWatchers?(): Promise<void>;
    activateExtensionStartActions?(): Promise<void>;
  }
}

export default DeepCode;
