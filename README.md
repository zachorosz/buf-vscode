# buf-vscode

[buf](https://github.com/bufbuild/buf) integration for Visual Studio Code.

Based mostly on [https://github.com/microsoft/vscode-go](https://github.com/microsoft/vscode-go)

## Extension Settings

This extension contributes the following settings:

* `buf.executablePath`: path to buf executable. by default, buf-vscode assumes it is in your `$PATH`.
* `buf.lintOnSave`: scope to lint when a file is saved (i.e 'file', 'workspace', 'off').