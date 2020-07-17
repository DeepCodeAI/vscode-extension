import * as vscode from "vscode";
import http from "../../http/requests";
import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import { IQueueAnalysisCheckResult } from "@deepcode/tsc";
import { window, ProgressLocation, Progress } from "vscode";
import { deepCodeMessages } from "../../messages/deepCodeMessages";
import { createDCIgnore } from "../../utils/filesUtils";
import { checkIfBundleIsEmpty } from "../../utils/bundlesUtils";
import { startFilesUpload } from "../../utils/packageUtils";
import { BUNDLE_EVENTS } from "../../constants/events";
import { errorsLogs } from "../../messages/errorsServerLogMessages";
import LoginModule from "../../lib/modules/LoginModule";

class BundlesModule extends LoginModule
  implements DeepCode.BundlesModuleInterface {
  private rootPath = "";

  files: string[] = [];
  serviceAI = http.getServiceAI();

  constructor() {
    super();

    this.onBuildBundleProgress = this.onBuildBundleProgress.bind(this);
    this.onBuildBundleFinish = this.onBuildBundleFinish.bind(this);
    this.onUploadBundleProgress = this.onUploadBundleProgress.bind(this);
    this.onUploadBundleFinish = this.onUploadBundleFinish.bind(this);
    this.onAnalyseProgress = this.onAnalyseProgress.bind(this);
    this.onAnalyseFinish = this.onAnalyseFinish.bind(this);
    this.onError = this.onError.bind(this);

    this.serviceAI.on(BUNDLE_EVENTS.error, this.onError);  }

  onBuildBundleProgress(processed: number, total: number) {
    console.log(`BUILD BUNDLE PROGRESS - ${processed}/${total}`);
  }

  onBuildBundleFinish() {
    console.log("BUILD BUNDLE FINISH");
  }

  onUploadBundleProgress(processed: number, total: number) {
    console.log(`UPLOAD BUNDLE PROGRESS - ${processed}/${total}`);
  }

  onUploadBundleFinish() {
    console.log("UPLOAD BUNDLE FINISH");
  }

  onAnalyseProgress(analysisResults: IQueueAnalysisCheckResult) {
    console.log("on Analyse Progress");
  }

  onAnalyseFinish(analysisResults: IQueueAnalysisCheckResult) {
    type ResultFiles = {
      [filePath: string]: DeepCode.AnalysisResultsFileResultsInterface;
    };
    const resultFiles = (
      analysisResults.analysisResults.files as unknown as ResultFiles
    );
    const result = ({
      files: { ...resultFiles },
      suggestions: analysisResults.analysisResults
        .suggestions as DeepCode.AnalysisSuggestionsInterface,
      success: true
    } as unknown) as DeepCode.AnalysisResultsCollectionInterface;
    console.log("Analysis Result is ready with results --> ", analysisResults);

    const analysedFiles: ResultFiles = {};

    for (let filePath in result.files) {
      const path = filePath.replace(this.rootPath, '');
      // @ts-ignore
      analysedFiles[path] = result.files[filePath];
    }

    result.files = analysedFiles as unknown as DeepCode.AnalysisResultsInterface;
    this.analyzer.updateAnalysisResultsCollection(result, this.rootPath);

    return Promise.resolve();
  }

  onError(error: Error) {
    this.errorHandler.processError(this, error);
    throw error;
  }

  public async askUploadApproval(): Promise<void> {
    const { uploadApproval } = deepCodeMessages;
    let pressedButton: string | undefined;
    
    pressedButton = await vscode.window.showInformationMessage(uploadApproval.msg(this.termsConditionsUrl), uploadApproval.workspace, uploadApproval.global);
    if (pressedButton) {
      await this.approveUpload(pressedButton === uploadApproval.global);
    }
  }

  public async askDCIgnore(path: string): Promise<void> {
    if (this.shouldHideDCIgnore) return;
    const { dcignoreNotFound } = deepCodeMessages;
    let pressedButton: string | undefined;
    pressedButton = await vscode.window.showInformationMessage(dcignoreNotFound.msg, dcignoreNotFound.default, dcignoreNotFound.custom, dcignoreNotFound.ignore);
    
    if (pressedButton && pressedButton !== dcignoreNotFound.ignore) {
      await createDCIgnore(path, pressedButton === dcignoreNotFound.custom);
    } else {
      await this.hideDCIgnore();
    }
  }

  // processing workspaces
  public updateCurrentWorkspacePath(newWorkspacePath: string): void {
    this.currentWorkspacePath = newWorkspacePath;
  }

  public createWorkspacesList(workspaces: readonly vscode.WorkspaceFolder[]): void {
    for (const folder of workspaces) {
      this.workspacesPaths.push(folder.uri.fsPath);
    }
  }

  public changeWorkspaceList(
    workspacePath: string,
    deleteFlag: boolean = false
  ): void {
    // by default paths are added
    if (deleteFlag) {
      this.workspacesPaths = this.workspacesPaths.filter(
        path => path !== workspacePath
      );
      return;
    }
    this.workspacesPaths.push(workspacePath);
  }

  // procesing filter list of files, acceptable for server
  public async createFilesFilterList(): Promise<void> {
    this.serverFilesFilterList = await http.getFilters(this.baseURL, this.token);
  }

  public async performBundlesActions(path: string): Promise<void> {
    if (!Object.keys(this.serverFilesFilterList).length) {
      await this.createFilesFilterList();
      this.filesWatcher.activate(this);

      if (!Object.keys(this.serverFilesFilterList).length) {
        return;
      }
    }

    if (!this.token) {
      return
    }
    const { bundle, foundIgnoreFile } = await startFilesUpload(path, this.serverFilesFilterList);
    const removedFiles = (this.files || []).filter(
      f => !bundle.includes(f)
    );
    this.files = bundle;

    const progressOptions = {
      location: ProgressLocation.Notification,
      title: deepCodeMessages.analysisProgress.msg,
      cancellable: false
    };

    const countStep = (processed: number, total: number): number => {
      const lastPhaseProgress = 33;
      const currentProgress = (processed / total * 33) + lastPhaseProgress;
      return currentProgress;
    };

    window.withProgress(progressOptions, async progress => {
      this.serviceAI.on(BUNDLE_EVENTS.buildBundleProgress, (processed: number, total: number) => {
        this.onBuildBundleProgress(processed, total);
      });

      this.serviceAI.on(BUNDLE_EVENTS.buildBundleFinish, () => {
        progress.report({ increment: 33 });
        this.onBuildBundleFinish();
      });

      this.serviceAI.on(BUNDLE_EVENTS.uploadBundleProgress, (processed: number, total: number) => {
        const currentProgress = countStep(processed, total);
        this.onUploadBundleProgress(processed, total);
        progress.report({ increment: currentProgress });
      });

      this.serviceAI.on(BUNDLE_EVENTS.uploadFilesFinish, () => {
        this.onUploadBundleFinish();
        progress.report({ increment: 80 });
      });

      this.serviceAI.on(BUNDLE_EVENTS.analyseProgress, (analysisResults: IQueueAnalysisCheckResult) => {
        progress.report({ increment: 90 });
        this.onAnalyseProgress(analysisResults);
      });

      this.serviceAI.on(
        BUNDLE_EVENTS.analyseFinish,
        (analysisResults: IQueueAnalysisCheckResult) => {
          progress.report({ increment: 100 });
          this.onAnalyseFinish(analysisResults);        
          this.serviceAI.removeListeners();
        }
      );

      this.serviceAI.on(BUNDLE_EVENTS.error, (error: Error) => {
        progress.report({ increment: 100 });
        this.onError(error);
        this.serviceAI.removeListeners();
      });

      await http.analyse(this.baseURL, this.token, path, this.files, removedFiles).catch(err => {});
    });

    if (!foundIgnoreFile) {
      await this.askDCIgnore(path);
    }
  }

  private async createSingleHashBundle(
    path: string
  ): Promise<DeepCode.BundlesInterface> {
    this.rootPath = path;

    // convert string[] to BundleInterface
    const filesBundle: { [key: string]: string } = {};
    let resultBundle: { [key: string]: string } = this.files.reduce(
      (resultBundle, filePath) => {
        resultBundle[filePath] = filePath;
        return resultBundle;
      },
      filesBundle
    );
    return resultBundle;
  }

  public async updateHashesBundles(
    workspacePath: string = "",
    deleteFlag: boolean = false
  ): Promise<void> {
    if (!workspacePath) {
      for await (const path of this.workspacesPaths) {
        this.hashesBundles[path] = await this.createSingleHashBundle(path);
      }
      return;
    }
    if (deleteFlag) {
      delete this.hashesBundles[workspacePath];
      return;
    }
    this.hashesBundles[workspacePath] = await this.createSingleHashBundle(
      workspacePath
    );
  }

  public checkIfHashesBundlesIsEmpty(bundlePath?: string): boolean {
    return checkIfBundleIsEmpty(this.hashesBundles, bundlePath);
  }

  public checkIfRemoteBundlesIsEmpty(bundlePath?: string): boolean {
    return checkIfBundleIsEmpty(this.remoteBundles, bundlePath);
  }

  // processing remote server bundles
  public async updateExtensionRemoteBundles(
    workspacePath: string,
    bundle: DeepCode.RemoteBundleInterface | null = null
  ): Promise<void> {
    if (bundle) {
      this.remoteBundles[workspacePath] = { ...bundle };
      return;
    }
    delete this.remoteBundles[workspacePath];
  }
}

export default BundlesModule;
