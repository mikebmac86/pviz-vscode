# PViz for VS Code

Thin VS Code wrapper around the [pviz-parser](https://pypi.org/project/pviz-parser/) CLI. Invokes `pviz` against the open workspace root, handles output path resolution, and surfaces the resulting bundle via native VS Code notifications. Configurable output path, analyzer mode, store root, and per-file size limits via VS Code settings. Full language coverage (Kotlin, Go, Rust) available via [PViz cloud](https://pvizgenerator.com).

## Requirements

Install the PViz CLI:

```bash
pip install pviz-parser
```

This installs the `pviz` command used by the extension.

## Usage

1. Open a workspace folder in VS Code
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Run **PViz: Analyze Workspace**
4. The bundle is saved to `.pviz/artifacts/bundle.json` in your workspace by default

## What the extension runs

```bash
pviz <workspace-root> -o <output-file> --mode zones --clean --allow-output-in-repo
```

`--allow-output-in-repo` is added automatically when the output file is inside the workspace. If you configure an external output path the flag is omitted. `--clean` ensures stale artifacts from previous runs on other repos are cleared.

## Settings

| Setting | Default | Description |
|---|---|---|
| `pviz.outputFile` | `.pviz/artifacts/bundle.json` | Output path for the bundle. Relative paths resolve from workspace root. |
| `pviz.cliPath` | `pviz` | Path to the CLI if not on your PATH. |
| `pviz.mode` | `zones` | Analyzer mode: `zones` or `classic`. |
| `pviz.maxBytes` | `100000000` | Maximum bytes per file. |
| `pviz.storeRoot` | _(empty)_ | Optional external store root. |
| `pviz.clean` | `true` | Clears sandbox artifacts before each run to prevent stale cross-repo reuse. |
| `pviz.additionalArgs` | `[]` | Extra arguments passed directly to the CLI. |

## Supported Languages

Python, JavaScript, TypeScript, and Java (partial resolution) are supported by the local `pviz-parser` package. Full language coverage including Kotlin, Go, and Rust is available via [PViz cloud](https://pvizgenerator.com).

## What is a PViz bundle?

A structured JSON file containing your repo's dependency graph with centrality scoring and architectural analysis — optimized for use as LLM context. Drop it into Claude, GPT, or any long-context model to get architecture-aware responses about your codebase.