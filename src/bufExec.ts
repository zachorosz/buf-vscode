import * as vscode from 'vscode';
import { execFile, ChildProcess } from 'child_process';
import { BufConfiguration } from './configuration';

export default function bufExec(
  configuration: BufConfiguration,
  args: string[],
  cwd: string,
  command?: string,
  subcommand?: string,
  token?: vscode.CancellationToken
): Promise<string[]> {
  let bufBin = configuration.executablePath;

  let buf: ChildProcess;
  if (token) {
    token.onCancellationRequested(() => {
      if (buf && !buf.killed) {
        buf.kill('SIGINT');
      }
    });
  }

  console.info(`Running buf cwd='${cwd}' path='${bufBin}'`);

  const argv: string[] = [];
  if (command) {
    argv.push(command);
  }
  if (subcommand) {
    argv.push(subcommand);
  }
  argv.push(...args);

  return new Promise<string[]>((resolve, reject) => {
    buf = execFile(bufBin, argv, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      cwd: cwd,
    }, (err, stdout, stderr) => {
      try {
        if (err && (<any>err).code === 'ENOENT') {
          console.error(`cannot find executable ${bufBin}`);
          return resolve([]);
        }
        // need to check if stderr since check returns a non-zero error 
        // code if there are linting/breaking errors.
        if (err && stderr) {
          console.error(`error running ${bufBin}: ${err}`);
          resolve([]);
        }

        // split output into lines; slice -1 to remove '' at end.
        let lines = stdout.split(/\r?\n/);
        if (lines.length && lines[lines.length-1] === '') {
          lines = lines.slice(0, -1);
        }

        resolve(lines);
      } catch (err) {
        reject(err);
      }
    });
  });
}

