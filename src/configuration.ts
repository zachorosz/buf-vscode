import * as vscode from 'vscode';
import { LintOnSaveScope } from './bufcheck/checkLint';

export interface BufConfiguration {
  executablePath: string,
  lintOnSave: LintOnSaveScope,
}

export function getConfiguration(scope?: vscode.Uri): BufConfiguration {
  if (!scope) {
    if (vscode.window.activeTextEditor) {
      scope = vscode.window.activeTextEditor.document.uri;
    }
  }
  const configuration = vscode.workspace.getConfiguration('buf', scope);
  const convertible = {
    executablePath: configuration.get('executablePath'),
    lintOnSave: configuration.get('lintOnSave'),
  };
  return <BufConfiguration>convertible;
}