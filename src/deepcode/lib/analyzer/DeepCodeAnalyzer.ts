import * as vscode from "vscode";
import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import {
  updateFileReviewResultsPositions,
  createIssueCorrectRange,
  createIssuesMarkersDecorationOptions,
  createIssueRelatedInformation,
  createDeepCodeSeveritiesMap,
  getDeepCodeSeverity,
  extractSuggestionIdFromSuggestionsMap
} from "../../utils/analysisUtils";
import { DEEPCODE_NAME } from "../../constants/general";
import { TELEMETRY_EVENTS } from "../../constants/telemetry";
import { ISSUES_MARKERS_DECORATION_TYPE } from "../../constants/analysis";
import { errorsLogs } from "../../messages/errorsServerLogMessages";

import { DisposableCodeActionsProvider } from "../deepCodeProviders/codeActionsProvider/DeepCodeIssuesActionsProvider";
import { DisposableHoverProvider } from "../deepCodeProviders/hoverProvider/DeepCodeHoverProvider";

class DeepCodeAnalyzer implements DeepCode.AnalyzerInterface {
  private SEVERITIES: {
    [key: number]: { name: vscode.DiagnosticSeverity; show: boolean };
  };
  private extension: DeepCode.ExtensionInterface | undefined;
  private issueHoverProvider: vscode.Disposable | undefined;
  private ignoreActionsProvider: vscode.Disposable | undefined;
  private issuesMarkersdecorationType:
    | vscode.TextEditorDecorationType
    | undefined;
  public deepcodeReview: vscode.DiagnosticCollection | undefined;
  public analysisResultsCollection: DeepCode.AnalysisResultsCollectionInterface;
  
  public constructor() {
    this.SEVERITIES = createDeepCodeSeveritiesMap();
    this.deepcodeReview = vscode.languages.createDiagnosticCollection(DEEPCODE_NAME);

    this.analysisResultsCollection = {};
    this.ignoreActionsProvider = new DisposableCodeActionsProvider(
      this.deepcodeReview,
      {
        findSuggestionId: extractSuggestionIdFromSuggestionsMap(
          this.analysisResultsCollection
        ),
        trackIgnoreSuggestion: this.trackIgnoreSuggestion.bind(this)
      }
    );
    this.issueHoverProvider = new DisposableHoverProvider(this.deepcodeReview);
  }

  public activate(extension: DeepCode.ExtensionInterface) {
    this.extension = extension;
  }

  public trackIgnoreSuggestion(vscodeSeverity: number, options: {[key: string]: any}): void {
    if (!this.extension) return;
    options.data = {
      severity: getDeepCodeSeverity(vscodeSeverity),
      ...options.data
    };
    this.extension.sendEvent(
      TELEMETRY_EVENTS.ignoreSuggestion,
      options
    );
  }

  public updateAnalysisResultsCollection(results: DeepCode.AnalysisResultsCollectionInterface, rootPath: string): void {
    this.analysisResultsCollection[rootPath] = {...results} as unknown as DeepCode.AnalysisResultsInterface;
    this.createReviewResults();
  }

  private createIssueDiagnosticInfo({
    issue,
    issuePositions,
    suggestions,
    fileUri
  }: {
    issue: number;
    issuePositions: DeepCode.IssuePositionsInterface;
    suggestions: DeepCode.AnalysisSuggestionsInterface;
    fileUri: vscode.Uri;
  }): vscode.Diagnostic {
    const message: string = suggestions[issue].message;
    return {
      code: "",
      message,
      range: createIssueCorrectRange(issuePositions),
      severity: this.SEVERITIES[suggestions[issue].severity].name,
      source: DEEPCODE_NAME,
      //issues markers can be in issuesPositions as prop 'markers',
      ...(issuePositions.markers && {
        relatedInformation: createIssueRelatedInformation({
          markersList: issuePositions.markers,
          fileUri,
          message
        })
      })
    };
  }

  private createIssuesList(
    options: DeepCode.IssuesListOptionsInterface
  ): vscode.Diagnostic[] {
    const issuesList: vscode.Diagnostic[] = [];
    const { fileIssuesList, suggestions, fileUri } = options;

    for (const issue in fileIssuesList) {
      if (!this.SEVERITIES[suggestions[issue].severity].show) {
        continue;
      }
      for (const issuePositions of fileIssuesList[issue]) {
        issuesList.push(
          this.createIssueDiagnosticInfo({
            issue: +issue,
            issuePositions,
            suggestions,
            fileUri
          })
        );
      }
    }
    return issuesList;
  }

  private clearPrevIssuesMarkersDecoration() {
    if (this.issuesMarkersdecorationType) {
      this.issuesMarkersdecorationType.dispose();
    }
  }

  public setIssuesMarkersDecoration(
    editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor
  ): void {
    if (
      editor &&
      this.deepcodeReview &&
      this.deepcodeReview.has(editor.document.uri)
    ) {
      this.clearPrevIssuesMarkersDecoration();
      this.issuesMarkersdecorationType = vscode.window.createTextEditorDecorationType(
        ISSUES_MARKERS_DECORATION_TYPE
      );
      const issuesMarkersDecorationsOptions = createIssuesMarkersDecorationOptions(
        this.deepcodeReview.get(editor.document.uri)
      );
      editor.setDecorations(
        this.issuesMarkersdecorationType,
        issuesMarkersDecorationsOptions
      );
    }
  }

  public async createReviewResults(): Promise<void> {
    if (!this.deepcodeReview) {
      return;
    }
    this.deepcodeReview.clear();

    for (const analysisResultPath in this.analysisResultsCollection) {
      const { files, suggestions } = this.analysisResultsCollection[
        analysisResultPath
      ];
      for (const filePath in files) {
        const fileUri = vscode.Uri.file(`${analysisResultPath}${filePath}`);
        if (!fileUri) {
          return;
        }
        const fileIssuesList = files[filePath];
        const issues = this.createIssuesList({
          fileIssuesList,
          suggestions,
          fileUri
        });
        this.deepcodeReview.set(fileUri, [...issues]);
      }
    }
    this.setIssuesMarkersDecoration();
  }

  public async configureIssuesDisplayBySeverity(
    severity: number,
    hide: boolean
  ): Promise<void> {
    this.SEVERITIES[severity].show = !hide;
    if (Object.keys(this.analysisResultsCollection).length) {
      await this.createReviewResults();
    }
  }

  public async updateReviewResultsPositions(
    extension: DeepCode.ExtensionInterface,
    updatedFile: DeepCode.openedTextEditorType
  ): Promise<void> {
    try {
      if (
        !this.deepcodeReview ||
        !this.deepcodeReview.has(updatedFile.document.uri) ||
        !updatedFile.contentChanges.length ||
        !updatedFile.contentChanges[0].range
      ) {
        return;
      }
      const fileIssuesList: DeepCode.AnalysisResultsFileResultsInterface = await updateFileReviewResultsPositions(
        this.analysisResultsCollection,
        updatedFile
      );
      // Opening a project directory instead of a workspace leads to empty updatedFile.workspace field
      const workspace = updatedFile.workspace || Object.keys(this.analysisResultsCollection)[0];
      const filepath = updatedFile.filePathInWorkspace || updatedFile.fullPath.replace(workspace, "");
      this.analysisResultsCollection[workspace].files[filepath] = { ...fileIssuesList };
      if (this.deepcodeReview) {
        const issues = this.createIssuesList({
          fileIssuesList,
          suggestions: this.analysisResultsCollection[workspace].suggestions,
          fileUri: vscode.Uri.file(updatedFile.fullPath)
        });
        this.deepcodeReview.set(vscode.Uri.file(updatedFile.fullPath), [
          ...issues
        ]);
        this.setIssuesMarkersDecoration();
      }
    } catch (err) {
      extension.processError(err, {
        message: errorsLogs.updateReviewPositions,
        bundleId: (extension.remoteBundles[updatedFile.workspace] || {}).bundleId,
        data: {
          [updatedFile.filePathInWorkspace]: updatedFile.contentChanges
        }
      });
    }
  }

  public async removeReviewResults(workspacePath: string): Promise<void> {
    await delete this.analysisResultsCollection[workspacePath];
    await this.createReviewResults();
  }
}

export default DeepCodeAnalyzer;
