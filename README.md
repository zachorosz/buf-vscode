# buf-vscode

[buf](https://github.com/bufbuild/buf) integration for Visual Studio Code.

Based mostly on [https://github.com/microsoft/vscode-go](https://github.com/microsoft/vscode-go)

## Features

### Linting

* Lint a open file or workspace (buf file discovery)
* Lint a file or workspace on save

## Commands

* `Buf: Lint File` to lint the current `.proto` file in the active editor.
* `Buf: Lint Workspace` to let buf discover your `.proto` files and lint them.

## Extension Settings

This extension contributes the following settings:

* `buf.executablePath`: path to buf executable. by default, buf-vscode assumes it is in your `$PATH`.
* `buf.lintOnSave`: scope to lint when a file is saved (i.e 'file', 'workspace', 'off').