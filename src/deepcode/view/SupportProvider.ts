import { TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { NodeProvider } from './NodeProvider';
import { Node } from './Node';
import { DEEPCODE_DCIGNORE_COMMAND } from "../constants/commands";

export class SupportProvider extends NodeProvider {
  getRootChildren(): Node[] {
    return [
      new Node({
        text: "Send us feedback or report a bug",
        // description: "Send us a feedback or ask for support",
        icon: new ThemeIcon('mail'),
        link: "https://www.deepcode.ai/feedback?select=2?utm_source=vsc"
      }),
      new Node({
        text: "Top 3 FAQ",
        collapsed: TreeItemCollapsibleState.Expanded,
        children: [
          new Node({
            text: "1. How to get the most out of DeepCode’s extension?",
            icon: new ThemeIcon('play'),
            link: "https://www.youtube.com/watch?v=NIDeVYLWkMI"
          }),
          new Node({
            text: "2. How to ignore issues within the code?",
            icon: new ThemeIcon('play'),
            link: "https://www.youtube.com/watch?v=sjDuDqUy7pw"
          }),
          new Node({
            text: "3. How to ignore files and directories?",
            icon: new ThemeIcon('file-text'),
            link: "https://deepcode.freshdesk.com/support/solutions/articles/60000531055-how-can-i-ignore-files-or-directories-",  
            collapsed: TreeItemCollapsibleState.Expanded,
            children: [
              new Node({
                text: "Add default .dcignore file to your workspace",
                icon: new ThemeIcon('new-file'),
                command: {
                  command: DEEPCODE_DCIGNORE_COMMAND,
                  title: '',
                  arguments: [],
                }
              }),
              new Node({
                text: "Add a custom .dcignore file to your workspace",
                icon: new ThemeIcon('new-file'),
                command: {
                  command: DEEPCODE_DCIGNORE_COMMAND,
                  title: '',
                  arguments: [true],
                }
              }),
            ]
          }),
        ]
      }),
      new Node({
        text: "Documentation",
        // description: "Check our documentation online",
        icon: new ThemeIcon('book'),
        link: "https://deepcode.freshdesk.com/support/home"
      }),
      new Node({
        text: "Interested in our on-premise solution?",
        icon: new ThemeIcon('desktop-download'),
        link: "https://www.deepcode.ai/on-premises?utm_source=vsc"
      }),
    ];
  }
}