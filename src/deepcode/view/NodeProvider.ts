import DeepCode from "../../interfaces/DeepCodeInterfaces";
import { TreeDataProvider, ProviderResult } from 'vscode';
import { Node } from './Node';

export abstract class NodeProvider implements TreeDataProvider<Node> {
  constructor(
    protected extension: DeepCode.ExtensionInterface
  ) {}

  abstract getRootChildren(): Node[];
  
  getChildren(element?: Node): ProviderResult<Node[]> {
    if (element) return element.getChildren();
    return this.getRootChildren();
  }

  getParent(element: Node): Node | undefined {
    return element.getParent();
  }

  getTreeItem(element: Node): Node {
    return element;
  }

  onDidChangeTreeData = this.extension.refreshViewEmitter.event;
}