import * as vscode from "vscode";
import * as open from "open";
import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import { DEEPCODE_NAME } from "../../constants/general";
import { deepCodeMessages } from "../../messages/deepCodeMessages";
import {
  WARNINGS_ISSUES_CHECK_LIMIT,
  FEEDBACK_REFUSE_COUNT_LIMIT,
  MONTH_LIMIT
} from "./feedbackHelpers";

class DeepCodeFeedbackReminder implements DeepCode.DeepCodeWatcherInterface {
  private feedbackUrl: string = "";

  private createFeedbackUrl(extension: DeepCode.ExtensionInterface): void {
    const deepcodeExtension = vscode.extensions.all.find(
      el => el.packageJSON.displayName === DEEPCODE_NAME
    );
    if (deepcodeExtension) {
      this.feedbackUrl = extension.config.getMarketplaceExtensionFeedbackUrl(
        deepcodeExtension.id
      );
    }
  }

  private checkIfFeedbackDataExists(
    feedbackData: DeepCode.StateIitemsInterface
  ): boolean {
    return !!feedbackData && !!Object.keys(feedbackData).length;
  }

  private updateFeedbackData(
    extension: DeepCode.ExtensionInterface,
    updatedData: { [key: string]: string | number | boolean }
  ): void {
    const feedbackData = extension.store.selectors.getFeedbackData();
    extension.store.actions.setFeedbackData({
      ...feedbackData,
      ...updatedData
    });
  }

  private watchIssuesSelectionsBeforeFeedback(
    extension: DeepCode.ExtensionInterface
  ): void {
    const listener = vscode.window.onDidChangeTextEditorSelection(
      async (event: vscode.TextEditorSelectionChangeEvent): Promise<void> => {
        const feedbackData = extension.store.selectors.getFeedbackData();
        if (!this.checkIfFeedbackDataExists(feedbackData)) {
          return;
        }

        if (feedbackData.warningsChecked >= WARNINGS_ISSUES_CHECK_LIMIT) {
          this.showFeedbackMessage(extension);
          listener.dispose();
          return;
        }
        const { kind, selections, textEditor } = event;

        if (!kind || kind === vscode.TextEditorSelectionChangeKind.Command) {
          const editorDiagnostic = vscode.languages.getDiagnostics(
            textEditor.document.uri
          );
          if (editorDiagnostic) {
            const selectedIssue = editorDiagnostic.find(
              element =>
                selections[0].isEqual(element.range) ||
                element.range.contains(selections[0])
            );
            if (
              selectedIssue &&
              selectedIssue.severity === vscode.DiagnosticSeverity.Warning &&
              selectedIssue.source === DEEPCODE_NAME
            ) {
              await this.updateFeedbackData(extension, {
                warningsChecked: feedbackData.warningsChecked + 1
              });
            }
          }
        }
      }
    );
  }

  private async showFeedbackMessage(
    extension: DeepCode.ExtensionInterface
  ): Promise<void> {
    const { msg, button: feedbackButton } = deepCodeMessages.provideFeedback;
    const userResponse = await vscode.window.showInformationMessage(
      msg,
      feedbackButton
    );
    if (userResponse === feedbackButton) {
      open(this.feedbackUrl);
      this.updateFeedbackData(extension, {
        isFeedbackPageOpened: true
      });
    } else {
      const feedbackData = extension.store.selectors.getFeedbackData();
      this.updateFeedbackData(extension, {
        refusedCount: +feedbackData.refusedCount + 1,
        timeLimit: MONTH_LIMIT
      });
    }
  }

  public async activate(extension: DeepCode.ExtensionInterface): Promise<void> {
    const feedbackData = extension.store.selectors.getFeedbackData();

    if (this.checkIfFeedbackDataExists(feedbackData)) {
      const { isFeedbackPageOpened, refusedCount, timeLimit } = feedbackData;
      if (
        isFeedbackPageOpened ||
        +refusedCount >= FEEDBACK_REFUSE_COUNT_LIMIT
      ) {
        return;
      }

      this.watchIssuesSelectionsBeforeFeedback(extension);

      this.createFeedbackUrl(extension);
      const installTimestamp = extension.store.selectors.getIstallTimeStamp();
      if (installTimestamp && Date.now() >= +installTimestamp + timeLimit) {
        await this.showFeedbackMessage(extension);
      }
    }
  }
}

export default DeepCodeFeedbackReminder;
