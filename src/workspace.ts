import * as vscode from 'vscode';

export function getWorkspaceFolderPath(uri?: vscode.Uri): string {
  if (uri) {
    const ws = vscode.workspace.getWorkspaceFolder(uri);
    if (ws) {
      return ws.uri.fsPath;
    }
  }
  // fallback to workspace root
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length) {
    return folders[0].uri.fsPath;
  }
  // no folder is open
  return '';
}