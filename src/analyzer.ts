import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";

function getWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  return folders[0].uri.fsPath;
}

function resolveOutputFile(workspaceRoot: string): string {
  const config = vscode.workspace.getConfiguration("pviz");
  const outputFile = config.get<string>("outputFile", ".pviz/artifacts/bundle.json").trim()
    || ".pviz/artifacts/bundle.json";

  if (path.isAbsolute(outputFile)) {
    return outputFile;
  }

  return path.join(workspaceRoot, outputFile);
}

function isWithinOrSame(childPath: string, parentPath: string): boolean {
  const child = path.resolve(childPath);
  const parent = path.resolve(parentPath);
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function buildArgs(workspaceRoot: string, outputFile: string): string[] {
  const config = vscode.workspace.getConfiguration("pviz");

  const mode = config.get<string>("mode", "zones");
  const maxBytes = config.get<number>("maxBytes", 100_000_000);
  const storeRoot = config.get<string>("storeRoot", "").trim();
  const clean = config.get<boolean>("clean", true);
  const additionalArgs = config.get<string[]>("additionalArgs", []);

  const args: string[] = [
    workspaceRoot,
    "-o",
    outputFile,
    "--mode",
    mode,
    "--max-bytes",
    String(maxBytes),
  ];

  if (storeRoot) {
    args.push("--store-root", storeRoot);
  }

  if (clean) {
    args.push("--clean");
  }

  if (isWithinOrSame(outputFile, workspaceRoot)) {
    args.push("--allow-output-in-repo");
  }

  args.push(...additionalArgs);

  return args;
}

function ensureOutputDir(outputFile: string): void {
  const dir = path.dirname(outputFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function runAnalysis(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();

  if (!workspaceRoot) {
    vscode.window.showErrorMessage(
      "PViz: No workspace folder is open. Open a folder and try again."
    );
    return;
  }

  const outputFile = resolveOutputFile(workspaceRoot);

  try {
    ensureOutputDir(outputFile);
  } catch (err) {
    vscode.window.showErrorMessage(
      `PViz: Could not create output directory for "${outputFile}". Check your pviz.outputFile setting.`
    );
    return;
  }

  const config = vscode.workspace.getConfiguration("pviz");
  const cliPath = config.get<string>("cliPath", "pviz").trim() || "pviz";
  const args = buildArgs(workspaceRoot, outputFile);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "PViz",
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: "Analyzing workspace..." });

      return new Promise<void>((resolve) => {
        const proc = cp.spawn(cliPath, args, { cwd: workspaceRoot });

        let stderr = "";
        proc.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        proc.on("close", (code) => {
          if (code !== 0) {
            const detail = stderr.trim() || `CLI exited with code ${code}`;
            vscode.window.showErrorMessage(`PViz: Analysis failed. ${detail}`);
            resolve();
            return;
          }

          vscode.window
            .showInformationMessage(
              `PViz: Bundle ready — ${path.relative(workspaceRoot, outputFile)}`,
              "Open File",
              "Open Folder"
            )
            .then((selection) => {
              if (selection === "Open File") {
                vscode.workspace
                  .openTextDocument(outputFile)
                  .then((doc) => vscode.window.showTextDocument(doc));
              } else if (selection === "Open Folder") {
                vscode.commands.executeCommand(
                  "revealFileInOS",
                  vscode.Uri.file(path.dirname(outputFile))
                );
              }
            });

          resolve();
        });

        proc.on("error", (err) => {
          vscode.window.showErrorMessage(
            `PViz: Could not launch CLI "${cliPath}". Is PViz installed and on your PATH? (${err.message})`
          );
          resolve();
        });
      });
    }
  );
}
