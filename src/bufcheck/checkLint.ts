import * as vscode from 'vscode';
import { dirname, join } from 'path';
import bufExec from '../bufExec';
import { getWorkspaceFolderPath } from '../workspace';
import { BufConfiguration } from '../configuration';
import { CheckResult } from './runChecks';

export enum LintOnSaveScope {
  file = 'file',
  workspace = 'workspace',
  off = 'off',
}

export default async function checkLint(
  configuration: BufConfiguration,
  uri: vscode.Uri,
  scope?: LintOnSaveScope
): Promise<CheckResult[]> {
  if (tokenSource) {
    if (running) {
      tokenSource.cancel();
    }
    tokenSource.dispose();
  }
  tokenSource = new vscode.CancellationTokenSource();

  const currentWorkspace = getWorkspaceFolderPath(uri);
  // const cwd = scope === LintOnSaveScope.workspace && currentWorkspace
  //   ? currentWorkspace
  //   : dirname(uri.fsPath);

  const cwd = currentWorkspace;
  const args: string[] = ['--error-format=json'];

  if (uri && scope === LintOnSaveScope.file) {
    args.push(`--file=${uri.fsPath}`);
  }

  const outputLines = await bufExec(
    configuration, args, cwd, 'check', 'lint', tokenSource.token);

  running = false;

  return outputLines
    .map(line => JSON.parse(line))
    .map(line => ({
      path: join(currentWorkspace, line.path),
      startLine: line.start_line,
      startColumn: line.start_column,
      endLine: line.end_line,
      endColumn: line.end_column,
      type: line.type,
      message: line.message,
    }));
}

let tokenSource: vscode.CancellationTokenSource;
let running = false;
