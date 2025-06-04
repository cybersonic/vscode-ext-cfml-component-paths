import * as vscode from "vscode";

/**
 * Determines if the provided text is eligible for code completion to trigger.
 */
export function isTextEligibleForCodeCompletion(text: string): boolean {
  const patterns = [
    /new $/,
    /public $/,
    /private $/,
    /package $/,
    /required $/,
    /\t+, $/, // multi-line optional parameter
    /.+ function \w+ ?\($/, // begin function prototype optional parameter
    /.+ function \w+ ?\(.+, $/, // specifying optional function parameter
  ];

  return patterns.some((p) => text.match(p));
}

interface PathMapping {
				source: string;
				target: string;
			}

interface ExtensionConfiguration {
  pathMappings: PathMapping[];
}

/**
 * Applies path mappings to a given relative file path.
 *
 * This function retrieves path mappings from the VSCode configuration for "testbox"
 * and replaces the start of the relative file path with the corresponding target path
 * if a matching source path is found.
 *
 * @param {string} relativeFilePath - The relative file path to apply mappings to.
 * @returns {string} - The new file path after applying the mappings, or the original
 *                     relative file path if no mappings match.
 */
function applyPathMappings( relativeFilePath:string ): string {
  const mappings: PathMapping[] = vscode.workspace.getConfiguration( "cfml-component-paths" ).get( "pathMappings", [] ) as PathMapping[];
  
  for ( const mapping of mappings ) {
    

    if ( relativeFilePath.startsWith( mapping.source ) ) {
      // This might not be correct, just have to replace the start
      return mapping.target + relativeFilePath.slice( mapping.source.length );
    }
  }
  return relativeFilePath;
}


/**
 * Converts a CFML component file path into a native reference for CFML.
 *
 * Example:
 * 		/path/to/my/component/HereItIs.cfc => path.to.my.component.HereItIs
 */
export function componentPathToNativeReference(
  workspacePath: string,
  filePath: string
): string {

	
  let relativeFilePath = filePath.replace(workspacePath, "");
    relativeFilePath = applyPathMappings(relativeFilePath);

  return relativeFilePath
    .replace(/^[\/|\\]/, "") // remove prefixed forward/back slashes
    .replace(/[\/|\\]/g, ".") // replace forward/back slashes with period (.)
    .replace(/\.[A-Za-z]+$/, ""); // remove file extension
}

export function activate(context: vscode.ExtensionContext) {
  // Allow code completion on all CFML files
  const documentSelector: vscode.DocumentSelector = {
    pattern: "**/*.{cfc,cfm}",
    scheme: "file",
  };

  // Activate code completion
  vscode.languages.registerCompletionItemProvider(documentSelector, {
    async provideCompletionItems(document, position) {
      // Get all characters of target line before the current character
      const beforeText = document
        .lineAt(position.line)
        .text.substring(0, position.character)
        .slice(0, -1);

      // Get the file path of the current workspace
      const workspacePath = vscode.workspace.getWorkspaceFolder(document.uri)
        ?.uri.path;

      if (!isTextEligibleForCodeCompletion(beforeText)) {
        return;
      }
      if (!workspacePath) {
        return;
      }

      const cfmlComponentUris = await vscode.workspace.findFiles("**/*.cfc");

      return cfmlComponentUris.map((uri) => {
        const nativeReference = componentPathToNativeReference(
          workspacePath,
          uri.path
        );
        const completionItem = new vscode.CompletionItem(
          nativeReference,
          vscode.CompletionItemKind.Class
        );

        completionItem.detail = "(component)";

        return completionItem;
      });
    },
  });

  // Activate copy CF path command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cfml-component-paths.copyPath",
      (selectedFileUri: vscode.Uri) => {
        const workspace = vscode.workspace.getWorkspaceFolder(selectedFileUri);
        const workspacePath = workspace?.uri.path;

        if (!workspacePath) {
          return;
        }

        const nativeReference = componentPathToNativeReference(
          workspacePath,
          selectedFileUri.path
        );

        vscode.env.clipboard.writeText(nativeReference);
      }
    )
  );
}

export function deactivate() {}
