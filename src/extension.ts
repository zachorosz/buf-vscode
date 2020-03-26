import * as vscode from 'vscode';
import * as fs from 'fs';
import checkLint, { LintOnSaveScope } from './bufcheck/checkLint';
import runChecks, { CheckResult, CheckCommandResults } from './bufcheck/runChecks';
import { getConfiguration, BufConfiguration } from './configuration';

export let lintDiagnosticCollection: vscode.DiagnosticCollection;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(ctx: vscode.ExtensionContext) {

  lintDiagnosticCollection = vscode.languages.createDiagnosticCollection('lint');
  ctx.subscriptions.push(lintDiagnosticCollection);

  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(
      (e: vscode.ConfigurationChangeEvent) => {
        if (!e.affectsConfiguration('buf')) {
          return;
        }

        const updatedConfig = getConfiguration();

        if (e.affectsConfiguration('buf.executablePath')) {
          checkExecutable(updatedConfig.executablePath);
        }
      }
    )
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'buf.lint.file',
      () => lint(LintOnSaveScope.file)
    )
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'buf.lint.workspace',
      () => lint(LintOnSaveScope.workspace)
    )
  );

  addOnDidSaveTextDocumentListeners(ctx);
}

// this method is called when your extension is deactivated
export function deactivate() { }

async function lint(scope?: LintOnSaveScope) {
  const editor = vscode.window.activeTextEditor;
  if (!editor && scope !== LintOnSaveScope.workspace) {
    vscode.window.showInformationMessage('No editor is active');
    return;
  }

  if (editor?.document.languageId !== 'proto'
    && scope !== LintOnSaveScope.workspace) {
    vscode.window.showInformationMessage(
      'File in active editor is not a proto file.');
    return;
  }

  const documentUri = editor ? editor.document.uri : undefined;
  const configuration = getConfiguration(documentUri);

  try {
    const checkResults = await checkLint(configuration, documentUri!, scope);
    handleDiagnostics(checkResults, lintDiagnosticCollection, editor ? editor.document : undefined);
  } catch (err) {
    vscode.window.showInformationMessage(`Error: ${err}`);
  }
}

async function runBuilds(
  textDocument: vscode.TextDocument,
  configuration: BufConfiguration
) {
  if (textDocument.languageId !== 'proto') {
    return;
  }

  lintDiagnosticCollection.clear();

  try {
    const checkResults: CheckCommandResults[] = await runChecks(
      configuration, textDocument.uri, configuration.lintOnSave);

    checkResults.forEach(check => handleDiagnostics(
      check.checkResults, check.diagnosticCollection, textDocument));
  } catch (err) {
    throw err;
  }
}

function addOnDidSaveTextDocumentListeners(ctx: vscode.ExtensionContext) {
  vscode.workspace.onDidSaveTextDocument(
    (textDocument: vscode.TextDocument) => {
      if (textDocument.languageId !== 'proto') {
        return;
      }

      // only run builds if the saved document is in a visible editor.
      const savedIsOpen = vscode.window.visibleTextEditors.some(e =>
        e.document.fileName === textDocument.fileName);

      if (savedIsOpen) {
        runBuilds(textDocument, getConfiguration(textDocument.uri));
      }
    }
  );
}

function handleDiagnostics(
  checkResults: CheckResult[],
  diagnosticCollection: vscode.DiagnosticCollection,
  textDocument?: vscode.TextDocument,
) {
  const diagnosticsMap = new Map<string, vscode.Diagnostic[]>();

  for (const check of checkResults) {

    const start = new vscode.Position(check.startLine - 1, check.startColumn - 1);
    const end = new vscode.Position(check.endLine - 1, check.endColumn - 1);

    const diagnostic: vscode.Diagnostic = {
      range: new vscode.Range(start, end),
      message: check.message,
      severity: vscode.DiagnosticSeverity.Error,
      code: check.type,
      source: diagnosticCollection.name,
    };

    const diagnostics = diagnosticsMap.get(check.path) ?? [];
    diagnostics.push(diagnostic);
    diagnosticsMap.set(check.path, diagnostics);
  }

  for (const [path, diagnostics] of diagnosticsMap) {
    const uri = vscode.Uri.file(path);
    diagnosticCollection.set(uri, diagnostics);
  }
}

function checkExecutable(executablePath: string) {
  const executableExists = (): boolean => {
    let exists = true;
    try {
      exists = fs.statSync(executablePath).isFile();
      if (exists) {
        fs.accessSync(executablePath, fs.constants.F_OK | fs.constants.X_OK);
      }
    } catch (e) {
      console.error(`User doesn't have permissions to access ${executablePath}`);
      exists = false;
    }
    return exists;
  };

  if (!executableExists()) {
    vscode.window.showErrorMessage(
      `Configured buf executable '${executablePath}' is not available.`);
  }
}