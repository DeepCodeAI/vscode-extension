import * as vscode from "vscode";
import DeepCode from "../../interfaces/DeepCodeInterfaces";
import { getSubstring } from "./tsUtils";
import {
  DEEPCODE_SEVERITIES,
  IGNORE_ISSUE_BASE_COMMENT_TEXT,
  FILE_IGNORE_ISSUE_BASE_COMMENT_TEXT,
  IGNORE_ISSUE_REASON_TIP,
  ISSUE_ID_SPLITTER
} from "../constants/analysis";

export const createDeepCodeSeveritiesMap = () => {
  const { information, error, warning } = DEEPCODE_SEVERITIES;
  return {
    [information]: {
      name: vscode.DiagnosticSeverity.Information,
      show: true
    },
    [warning]: { name: vscode.DiagnosticSeverity.Warning, show: true },
    [error]: { name: vscode.DiagnosticSeverity.Error, show: true }
  };
};

export const getDeepCodeSeverity = (vscodeSeverity: vscode.DiagnosticSeverity) => {
  const { information, error, warning } = DEEPCODE_SEVERITIES;
  return {
    [vscode.DiagnosticSeverity.Information]: information,
    [vscode.DiagnosticSeverity.Warning]: warning,
    [vscode.DiagnosticSeverity.Error]: error,
    [vscode.DiagnosticSeverity.Hint]: information,
  }[vscodeSeverity];
}

export const createDeepCodeProgress = (progress: number): number => {
  const progressOffset = 100;
  return Math.round(progress * progressOffset);
};

export const createCorrectIssuePlacement = (
  item: DeepCode.IssuePositionsInterface
): { [key: string]: { [key: string]: number } } => {
  const rowOffset = 1;
  const createPosition = (i: number): number =>
    i - rowOffset < 0 ? 0 : i - rowOffset;
  return {
    cols: {
      start: createPosition(item.cols[0]),
      end: item.cols[1]
    },
    rows: {
      start: createPosition(item.rows[0]),
      end: createPosition(item.rows[1])
    }
  };
};

export const createIssueRange = (position: {
  [key: string]: { [key: string]: number };
}) => {
  return new vscode.Range(
    new vscode.Position(position.rows.start, position.cols.start),
    new vscode.Position(position.rows.end, position.cols.end)
  );
};

export const createIssueCorrectRange = (
  issuePosition: DeepCode.IssuePositionsInterface
): vscode.Range => {
  return createIssueRange({
    ...createCorrectIssuePlacement(issuePosition)
  });
};

export const findIssueWithRange = (
  matchingRange: vscode.Range | vscode.Position,
  issuesList: readonly vscode.Diagnostic[] | undefined
): vscode.Diagnostic | undefined => {
  return (
    issuesList &&
    issuesList.find((issue: vscode.Diagnostic) => {
      return issue.range.contains(matchingRange);
    })
  );
};

export const updateFileReviewResultsPositions = (
  analysisResultsCollection: DeepCode.AnalysisResultsCollectionInterface,
  updatedFile: DeepCode.openedTextEditorType
): DeepCode.AnalysisResultsFileResultsInterface => {
  const changesRange = updatedFile.contentChanges[0].range;
  const changesText = updatedFile.contentChanges[0].text;
  const goToNewLine = "\n";
  const offsetedline = changesRange.start.line + 1;
  const charOffset = 1;

  // Opening a project directory instead of a workspace leads to empty updatedFile.workspace field
  const workspace = updatedFile.workspace || Object.keys(analysisResultsCollection)[0];
  const filepath = updatedFile.filePathInWorkspace || updatedFile.fullPath.replace(workspace, "");
  const fileIssuesList = {
    ...analysisResultsCollection[workspace].files[filepath]
  };
  for (const issue in fileIssuesList) {
    for (const [index, position] of fileIssuesList[issue].entries()) {
      const currentLineIsOnEdgeOfIssueRange =
        offsetedline === position.rows[0] || offsetedline === position.rows[1];

      for (const row in position.rows) {
        if (offsetedline < position.rows[row]) {
          position.rows[row] += updatedFile.lineCount.prevOffset;
        } else if (offsetedline === position.rows[row]) {
          if (changesRange.start.character < position.rows[row]) {
            position.rows[row] += updatedFile.lineCount.prevOffset;
          }
        }
      }

      if (
        currentLineIsOnEdgeOfIssueRange ||
        (offsetedline > position.rows[0] && offsetedline < position.rows[1])
      ) {
        // when chars are added
        if (
          changesText.length &&
          changesText !== goToNewLine &&
          currentLineIsOnEdgeOfIssueRange
        ) {
          if (
            changesRange.start.character < position.cols[0] &&
            !changesText.includes(goToNewLine)
          ) {
            for (const col in position.cols) {
              position.cols[col] += changesText.length;
            }
          }
          // if char is inside issue range
          if (
            changesRange.start.character >= position.cols[0] &&
            changesRange.start.character <= position.cols[1]
          ) {
            position.cols[1] += changesText.length;
          }
        }
        // when chars are deleted
        if (
          updatedFile.contentChanges[0].rangeLength &&
          currentLineIsOnEdgeOfIssueRange
        ) {
          if (updatedFile.lineCount.prevOffset < 0 && !changesText) {
            continue;
          }
          if (
            changesRange.start.character < position.cols[0] &&
            !changesText.includes(goToNewLine)
          ) {
            for (const char in position.cols) {
              position.cols[char] =
                position.cols[char] > 0
                  ? position.cols[char] -
                    updatedFile.contentChanges[0].rangeLength
                  : 0;
            }
          }
          // if char is in issue range
          if (
            changesRange.start.character >= position.cols[0] &&
            changesRange.start.character <= position.cols[1]
          ) {
            position.cols[1] =
              position.cols[1] > 0
                ? position.cols[1] - updatedFile.contentChanges[0].rangeLength
                : 0;
          }
        }
        // hide issue
        if (position.cols[0] - charOffset === position.cols[1]) {
          fileIssuesList[issue].splice(index, 1);
        }
        position.cols[0] = position.cols[0] > 0 ? position.cols[0] : 0;
        position.cols[1] = position.cols[1] > 0 ? position.cols[1] : 0;
      }
    }
  }
  return fileIssuesList;
};

export const createIssueMarkerMsg = (
  originalMsg: string,
  [markerStartIdx, markerEndIdx]: number[]
): string => getSubstring(originalMsg, [markerStartIdx, markerEndIdx + 1]);

export const createIssuesMarkersDecorationOptions = (
  currentFileReviewIssues: readonly vscode.Diagnostic[] | undefined
): vscode.DecorationOptions[] => {
  if (!currentFileReviewIssues) {
    return [];
  }
  const issueMarkersDecorationOptions = currentFileReviewIssues.reduce(
    (markersRanges, issue) => {
      if (issue.relatedInformation) {
        for (const markerInfo of issue.relatedInformation) {
          markersRanges.push({
            range: markerInfo.location.range,
            hoverMessage: markerInfo.message
          });
        }
      }
      return markersRanges;
    },
    Array()
  );
  return issueMarkersDecorationOptions;
};

export const createIssueRelatedInformation = ({
  markersList,
  fileUri,
  message
}: {
  markersList: Array<DeepCode.IssueMarkersInterface>;
  fileUri: vscode.Uri;
  message: string;
}) => {
  const relatedInformation: vscode.DiagnosticRelatedInformation[] = markersList.reduce(
    (relatedInfoList, marker) => {
      const { msg: markerMsgIdxs, pos: markerPositions } = marker;
      for (const position of markerPositions) {
        const relatedInfo = new vscode.DiagnosticRelatedInformation(
          new vscode.Location(fileUri, createIssueCorrectRange(position)),
          createIssueMarkerMsg(message, markerMsgIdxs)
        );
        relatedInfoList.push(relatedInfo);
      }
      return relatedInfoList;
    },
    Array()
  );
  return relatedInformation;
};

export const extractSuggestionIdFromSuggestionsMap = (
  analysisResultsCollection: DeepCode.AnalysisResultsCollectionInterface
): Function => (suggestionName: string, filePath: string): string => {
  const workspaceAnalysisPath: string | undefined = Object.keys(
    analysisResultsCollection
  ).find((path: string): boolean => filePath.includes(path));

  if (
    !workspaceAnalysisPath ||
    !analysisResultsCollection[workspaceAnalysisPath] ||
    !analysisResultsCollection[workspaceAnalysisPath].suggestions
  ) {
    return "";
  }
  const suggestion = Object.values(
    analysisResultsCollection[workspaceAnalysisPath].suggestions
  ).find(
    (suggestion: DeepCode.analysisSuggestionsType) =>
      suggestion.message === suggestionName
  );
  return suggestion ? suggestion.id : "";
};

export const extractIssueNameOutOfId = (issueId: string): string => {
  const strippedIssueIdList = issueId.split(ISSUE_ID_SPLITTER);
  return strippedIssueIdList[strippedIssueIdList.length - 1];
};

export const ignoreIssueCommentText = (
  issueId: string,
  isFileIgnore?: boolean
): string => {
  const deepcodeComment = isFileIgnore
    ? FILE_IGNORE_ISSUE_BASE_COMMENT_TEXT
    : IGNORE_ISSUE_BASE_COMMENT_TEXT;
  return `${deepcodeComment} ${issueId}: ${IGNORE_ISSUE_REASON_TIP}`;
};
