import * as vscode from "vscode";
import * as _ from "lodash";
import http from "../../http/requests";
import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import { IQueueAnalysisCheckResult } from "@deepcode/tsc";
import { checkIfBundleIsEmpty } from "../../utils/bundlesUtils";
import { createListOfDirFiles } from "../../utils/packageUtils";
import { BUNDLE_EVENTS } from "../../constants/events";
import LoginModule from "../../lib/modules/LoginModule";
import { setContext } from "../../utils/vscodeCommandsUtils";
import { DEEPCODE_ANALYSIS_STATUS, DEEPCODE_CONTEXT } from "../../constants/views";
import { errorsLogs } from "../../messages/errorsServerLogMessages";

abstract class BundlesModule extends LoginModule
  implements DeepCode.BundlesModuleInterface {
  private rootPath = "";

  runningAnalysis = false;

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

    this.serviceAI.on(BUNDLE_EVENTS.error, this.onError);
  }

  updateStatus(status: string, progress?: number) {
    this.analysisStatus = status;
    if (progress) this.analysisProgress = progress;
    this.refreshViews();
  }

  
  onCollectBundleProgress(value: number) {
    this.updateStatus(DEEPCODE_ANALYSIS_STATUS.COLLECTING, value);
  }

  onBuildBundleProgress(processed: number, total: number) {
    console.log(`BUILD BUNDLE PROGRESS - ${processed}/${total}`);
    this.updateStatus(DEEPCODE_ANALYSIS_STATUS.HASHING, processed/total);
  }

  onBuildBundleFinish() {
    console.log("BUILD BUNDLE FINISH");
    this.updateStatus(DEEPCODE_ANALYSIS_STATUS.HASHING, 1);
  }

  onUploadBundleProgress(processed: number, total: number) {
    console.log(`UPLOAD BUNDLE PROGRESS - ${processed}/${total}`);
    this.updateStatus(DEEPCODE_ANALYSIS_STATUS.UPLOADING, processed/total);
  }

  onUploadBundleFinish() {
    console.log("UPLOAD BUNDLE FINISH");
    this.updateStatus(DEEPCODE_ANALYSIS_STATUS.UPLOADING, 1);
  }

  onAnalyseProgress(analysisResults: IQueueAnalysisCheckResult) {
    console.log("ANALYSE PROGRESS");
    this.updateStatus(DEEPCODE_ANALYSIS_STATUS.ANALYZING, analysisResults.progress);
  }

  onAnalyseFinish(analysisResults: IQueueAnalysisCheckResult) {
    this.updateStatus(DEEPCODE_ANALYSIS_STATUS.ANALYZING, 1);
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
    this.terminateAnalysis();
    this.refreshViews();
  }

  onError(error: Error) {
    this.terminateAnalysis();
    this.processError(error, {
      message: errorsLogs.failedServiceAI,
    });
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
    try {
      this.serverFilesFilterList = await http.getFilters(this.baseURL, this.token);
    } catch (err) {
      this.processError(err, {
        message: errorsLogs.filtersFiles
      })
    }
  }

  private terminateAnalysis(): void {
    this.serviceAI.removeListeners();
    this.runningAnalysis = false;
  }

  public async performBundlesActions(path: string): Promise<void> {
    if (this.runningAnalysis) return;
    this.runningAnalysis = true;

    if (!Object.keys(this.serverFilesFilterList).length) {
      await this.createFilesFilterList();
      if (!Object.keys(this.serverFilesFilterList).length) {
        this.processError(new Error(errorsLogs.filtersFiles), {
          message: errorsLogs.filtersFiles,
          data: {
            filters: this.serverFilesFilterList
          }
        });
        return;
      }
      this.filesWatcher.activate(this);
    }

    if (!this.token || !this.uploadApproved) {
      await this.checkSession();
      await this.checkApproval();
      return;
    }

    const bundle = await this.startCollectingFiles(path, this.serverFilesFilterList);
    const removedFiles = (this.files || []).filter(f => !bundle.includes(f));
    this.files = bundle;
    
    this.serviceAI.on(BUNDLE_EVENTS.buildBundleProgress, (processed: number, total: number) => {
      this.onBuildBundleProgress(processed, total);
    });
    this.serviceAI.on(BUNDLE_EVENTS.buildBundleFinish, () => {
      this.onBuildBundleFinish();
    });
    this.serviceAI.on(BUNDLE_EVENTS.uploadBundleProgress, (processed: number, total: number) => {
      this.onUploadBundleProgress(processed, total);
    });
    this.serviceAI.on(BUNDLE_EVENTS.uploadFilesFinish, () => {
      this.onUploadBundleFinish();
    });
    this.serviceAI.on(BUNDLE_EVENTS.analyseProgress, (analysisResults: IQueueAnalysisCheckResult) => {
      this.onAnalyseProgress(analysisResults);
    });
    this.serviceAI.on(
      BUNDLE_EVENTS.analyseFinish,
      (analysisResults: IQueueAnalysisCheckResult) => {
        this.onAnalyseFinish(analysisResults);
      }
    );
    this.serviceAI.on(BUNDLE_EVENTS.error, (error: Error) => {
      this.onError(error);
    });

    http.analyse(this.baseURL, this.token, path, this.files, removedFiles).catch(
      (error) => this.processError(error, {
        message: errorsLogs.analyse
      })
    );
  }

  private async startCollectingFiles(
    folderPath: string,
    serverFilesFilterList: DeepCode.AllowedServerFilterListInterface
  ): Promise<string[]> {
    this.updateStatus(DEEPCODE_ANALYSIS_STATUS.COLLECTING, 0);
    console.log("COLLECTING");
    const bundle = await createListOfDirFiles({
      serverFilesFilterList,
      path: folderPath,
      progress: {
        onProgress: this.onCollectBundleProgress.bind(this),
      }
    });
    console.warn(`Processed ${bundle.length} files`);
    this.updateStatus(DEEPCODE_ANALYSIS_STATUS.COLLECTING, 1);
    return bundle;
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

  public async startAnalysis(): Promise<void> {
    try {
      const workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || !workspaceFolders.length) {
        await setContext(DEEPCODE_CONTEXT.ANALYZING, false);
        return;
      }

      this.createWorkspacesList(workspaceFolders);

      if (this.workspacesPaths.length) {
        await setContext(DEEPCODE_CONTEXT.ANALYZING, true);
        this.updateCurrentWorkspacePath(this.workspacesPaths[0]);

        await this.updateHashesBundles();
        for await (const path of this.workspacesPaths) {
          await this.performBundlesActions(path);
        }
      } else {
        await setContext(DEEPCODE_CONTEXT.ANALYZING, false);
      }
    } catch(err) {
      await this.processError(err, {
        message: errorsLogs.failedAnalysis,
      });
    }
  }
}

export default BundlesModule;
