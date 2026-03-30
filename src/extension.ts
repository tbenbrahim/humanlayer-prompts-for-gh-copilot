import * as vscode from 'vscode';

type BundleMapping = {
  source: string;
  target: string;
};

const bundleMappings: BundleMapping[] = [
  { source: 'bundle/prompts', target: '.github/prompts' },
  { source: 'bundle/agents', target: '.github/agents' },
  { source: 'bundle/skills', target: '.github/skills' }
];

export function activate(context: vscode.ExtensionContext): void {
  const installCommand = vscode.commands.registerCommand(
    'humanlater.installWorkspaceBundle',
    async () => {
      const workspaceFolder = await pickWorkspaceFolder();

      if (!workspaceFolder) {
        return;
      }

      await installBundle(context.extensionUri, workspaceFolder.uri);

      const openAction = 'Reveal .github';
      const selection = await vscode.window.showInformationMessage(
        `Installed the Humanlater Copilot bundle into ${workspaceFolder.name}.`,
        openAction
      );

      if (selection === openAction) {
        await vscode.commands.executeCommand(
          'revealInExplorer',
          vscode.Uri.joinPath(workspaceFolder.uri, '.github')
        );
      }
    }
  );

  context.subscriptions.push(installCommand);
}

export function deactivate(): void {}

async function pickWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    void vscode.window.showWarningMessage(
      'Open a workspace folder before installing the Humanlater Copilot bundle.'
    );
    return undefined;
  }

  if (workspaceFolders.length === 1) {
    return workspaceFolders[0];
  }

  return vscode.window.showWorkspaceFolderPick({
    placeHolder: 'Select the workspace folder that should receive the Humanlater Copilot bundle.'
  });
}

async function installBundle(extensionUri: vscode.Uri, workspaceUri: vscode.Uri): Promise<void> {
  for (const mapping of bundleMappings) {
    const sourceUri = vscode.Uri.joinPath(extensionUri, ...mapping.source.split('/'));
    const targetUri = vscode.Uri.joinPath(workspaceUri, ...mapping.target.split('/'));

    await vscode.workspace.fs.createDirectory(targetUri);
    await vscode.workspace.fs.copy(sourceUri, targetUri, { overwrite: true });
  }
}