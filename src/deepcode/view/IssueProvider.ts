import { Uri, Range, Diagnostic } from 'vscode';
import { NodeProvider } from './NodeProvider';
import { Node, INodeIcon, NODE_ICONS } from './Node';
import { getDeepCodeSeverity } from "../utils/analysisUtils";
import { DEEPCODE_SEVERITIES } from "../constants/analysis";

interface ISeverityCounts {
  [severity: number]: number;
}

export class IssueProvider extends NodeProvider {
  compareNodes(n1: Node, n2: Node): number {
    if (n2.internal.severity - n1.internal.severity) return n2.internal.severity - n1.internal.severity;
    if (n2.internal.nIssues - n1.internal.nIssues) return n2.internal.nIssues - n1.internal.nIssues;
    if (n1.label && n2.label) {
      if (n1.label < n2.label) return -1;
      if (n1.label > n2.label) return 1;
    }
    if (n1.description && n2.description) {
      if (n1.description < n2.description) return -1;
      if (n1.description > n2.description) return 1;
    }
    return 0;
  }
  
  processProgress(progress: number): string {
    return `${Math.round(100*progress)}%`;
  }

  getSeverityIcon(severity: number): INodeIcon {
    return {
      [DEEPCODE_SEVERITIES.error]: NODE_ICONS.critical,
      [DEEPCODE_SEVERITIES.warning]: NODE_ICONS.warning,
      [DEEPCODE_SEVERITIES.information]: NODE_ICONS.info,
    }[severity] || NODE_ICONS.info;
  }

  getFileSeverity(counts: ISeverityCounts): number {
    for (const s of [
      DEEPCODE_SEVERITIES.error,
      DEEPCODE_SEVERITIES.warning,
      DEEPCODE_SEVERITIES.information,
    ]) {
      if (counts[s]) return s;
    }
    return DEEPCODE_SEVERITIES.information;
  }

  getRootChildren(): Node[] {
    const review: Node[] = [];
    let nIssues = 0;
    if (!this.extension.analyzer.deepcodeReview) return review;
    this.extension.analyzer.deepcodeReview.forEach(
      (uri: Uri, diagnostics: readonly Diagnostic[]): void => {
        const counts: ISeverityCounts = {
          [DEEPCODE_SEVERITIES.information]: 0,
          [DEEPCODE_SEVERITIES.warning]: 0,
          [DEEPCODE_SEVERITIES.error]: 0,
        };
        const filePath = uri.path.split('/');
        const filename = filePath.pop() || uri.path;
        const dir = filePath.pop();
        const issues: Node[] = diagnostics.map((d) => {
          const severity = getDeepCodeSeverity(d.severity);
          ++counts[severity];
          ++nIssues;
          const params: {
            text: string, icon: INodeIcon, issue: { uri: Uri, range?: Range }, children?: Node[]
          } = {
            text: d.message,
            icon: this.getSeverityIcon(severity),
            issue: {
              uri,
              range: d.range
            }
          };
          if (d.relatedInformation && d.relatedInformation.length) {
            params.children = d.relatedInformation.map((h) =>
              new Node({
                text: h.message,
                issue: {
                  uri: h.location.uri,
                  range: h.location.range,
                }
              })
            );
          }
          return new Node(params);
        });
        const fileSeverity = this.getFileSeverity(counts);
        const file = new Node({
          text: filename,
          description: `${dir} - ${diagnostics.length} issue${diagnostics.length === 1 ? '' : 's'}`,
          icon: this.getSeverityIcon(fileSeverity),
          issue: { uri },
          children: issues,
          internal: {
            nIssues: diagnostics.length,
            severity: fileSeverity,
          }
        });
        review.push(file);
      }
    );
    review.sort(this.compareNodes);
    if (this.extension.runningAnalysis) {
      review.unshift(new Node({
        text: this.extension.analysisStatus,
        description: this.processProgress(this.extension.analysisProgress),
      }));
    } else {
      review.unshift(new Node({
        text: `DeepCode found ${nIssues} issue${nIssues === 1 ? '' : 's'}`,
      }));
    }
    return review;
  }
}