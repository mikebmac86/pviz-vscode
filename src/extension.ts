import * as vscode from "vscode";
import { runAnalysis } from "./analyzer";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("pviz.analyze", async () => {
    await runAnalysis();
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
