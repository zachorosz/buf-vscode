import * as vscode from 'vscode';
import checkLint, { LintOnSaveScope } from './checkLint';
import { BufConfiguration } from '../configuration';
import { lintDiagnosticCollection } from '../extension';

export interface CheckResult {
  path: string,
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
  type: string,
  message: string,
}

export interface CheckCommandResults {
  diagnosticCollection: vscode.DiagnosticCollection,
  checkResults: CheckResult[],
}

export default function runChecks(
  configuration: BufConfiguration,
  uri: vscode.Uri,
  scope?: LintOnSaveScope
): Promise<CheckCommandResults[]> {

  const runningPromises: Promise<CheckCommandResults>[] = [];

  if (configuration.lintOnSave !== LintOnSaveScope.off) {
    runningPromises.push(
      checkLint(configuration, uri, scope).then(results => ({
        diagnosticCollection: lintDiagnosticCollection,
        checkResults: results,
      }))
    );
  }

  return Promise.all(runningPromises);
}