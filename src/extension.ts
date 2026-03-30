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

const onboardingStateKey = 'humanlayer.hasShownInstallHint';
const installCommandId = 'humanlayer.installWorkspaceBundle';
const uninstallCommandId = 'humanlayer.uninstallWorkspaceBundle';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const installCommand = vscode.commands.registerCommand(
    installCommandId,
    async () => {
      const workspaceFolder = await pickWorkspaceFolder();

      if (!workspaceFolder) {
        return;
      }

      await installBundle(context.extensionUri, workspaceFolder.uri);

      const openAction = 'Reveal .github';
      const selection = await vscode.window.showInformationMessage(
        `Installed the humanlayer Copilot bundle into ${workspaceFolder.name}.`,
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

  const uninstallCommand = vscode.commands.registerCommand(
    uninstallCommandId,
    async () => {
      const workspaceFolder = await pickWorkspaceFolder('uninstall');

      if (!workspaceFolder) {
        return;
      }

      const removedCount = await uninstallBundle(context.extensionUri, workspaceFolder.uri);

      const openAction = 'Reveal .github';
      const message =
        removedCount > 0
          ? `Removed the humanlayer Copilot bundle from ${workspaceFolder.name}.`
          : `No humanlayer Copilot bundle folders were found in ${workspaceFolder.name}.`;
      const selection = await vscode.window.showInformationMessage(message, openAction);

      if (selection === openAction) {
        await vscode.commands.executeCommand(
          'revealInExplorer',
          vscode.Uri.joinPath(workspaceFolder.uri, '.github')
        );
      }
    }
  );

  context.subscriptions.push(installCommand, uninstallCommand);

  await showInstallHint(context);
}

async function pickWorkspaceFolder(
  action: 'install' | 'uninstall' = 'install'
): Promise<vscode.WorkspaceFolder | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const actionLabel = action === 'install' ? 'installing' : 'removing';
  const placeHolderAction = action === 'install' ? 'receive' : 'remove';

  if (!workspaceFolders || workspaceFolders.length === 0) {
    void vscode.window.showWarningMessage(
      `Open a workspace folder before ${actionLabel} the humanlayer Copilot bundle.`
    );
    return undefined;
  }

  if (workspaceFolders.length === 1) {
    return workspaceFolders[0];
  }

  return vscode.window.showWorkspaceFolderPick({
    placeHolder: `Select the workspace folder that should ${placeHolderAction} the humanlayer Copilot bundle.`
  });
}

async function installBundle(extensionUri: vscode.Uri, workspaceUri: vscode.Uri): Promise<void> {
  for (const mapping of bundleMappings) {
    const sourceUri = vscode.Uri.joinPath(extensionUri, ...mapping.source.split('/'));
    const targetUri = vscode.Uri.joinPath(workspaceUri, ...mapping.target.split('/'));

    try {
      await vscode.workspace.fs.stat(sourceUri);
    } catch (error) {
      if (isFileNotFoundError(error)) {
        continue;
      }

      throw error;
    }

    const entries = await vscode.workspace.fs.readDirectory(sourceUri);

    if (entries.length === 0) {
      continue;
    }

    await copyBundleContents(sourceUri, targetUri);
  }
}

async function uninstallBundle(extensionUri: vscode.Uri, workspaceUri: vscode.Uri): Promise<number> {
  let removedCount = 0;

  for (const mapping of bundleMappings) {
    const sourceUri = vscode.Uri.joinPath(extensionUri, ...mapping.source.split('/'));
    const targetUri = vscode.Uri.joinPath(workspaceUri, ...mapping.target.split('/'));

    try {
      await removeBundleContents(sourceUri, targetUri);
      removedCount += 1;
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        throw error;
      }
    }
  }

  return removedCount;
}

async function copyBundleContents(sourceDir: vscode.Uri, targetDir: vscode.Uri): Promise<void> {
  await vscode.workspace.fs.createDirectory(targetDir);

  const entries = await vscode.workspace.fs.readDirectory(sourceDir);

  for (const [name, type] of entries) {
    const sourceEntry = vscode.Uri.joinPath(sourceDir, name);
    const targetEntry = vscode.Uri.joinPath(targetDir, name);

    if (type === vscode.FileType.Directory) {
      await copyBundleContents(sourceEntry, targetEntry);
      continue;
    }

    await vscode.workspace.fs.copy(sourceEntry, targetEntry, { overwrite: true });
  }
}

async function removeBundleContents(sourceDir: vscode.Uri, targetDir: vscode.Uri): Promise<void> {
  const entries = await vscode.workspace.fs.readDirectory(sourceDir);

  for (const [name, type] of entries) {
    const sourceEntry = vscode.Uri.joinPath(sourceDir, name);
    const targetEntry = vscode.Uri.joinPath(targetDir, name);

    if (type === vscode.FileType.Directory) {
      try {
        await removeBundleContents(sourceEntry, targetEntry);
        await deleteDirectoryIfEmpty(targetEntry);
      } catch (error) {
        if (!isFileNotFoundError(error)) {
          throw error;
        }
      }

      continue;
    }

    try {
      await vscode.workspace.fs.delete(targetEntry, { useTrash: false });
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        throw error;
      }
    }
  }

  await deleteDirectoryIfEmpty(targetDir);
}

async function deleteDirectoryIfEmpty(directoryUri: vscode.Uri): Promise<void> {
  try {
    const entries = await vscode.workspace.fs.readDirectory(directoryUri);

    if (entries.length === 0) {
      await vscode.workspace.fs.delete(directoryUri, { recursive: true, useTrash: false });
    }
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      throw error;
    }
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return error instanceof vscode.FileSystemError && error.code === 'FileNotFound';
}

async function showInstallHint(context: vscode.ExtensionContext): Promise<void> {
  const hasShownHint = context.globalState.get<boolean>(onboardingStateKey);

  if (hasShownHint) {
    return;
  }

  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    return;
  }

  const installAction = 'Run Install Command';
  const selection = await vscode.window.showInformationMessage(
    'Humanlayer Copilot Bundle is installed. Run "humanlayer: Install humanlayer Copilot Bundle" from the Command Palette in each repository where you want to copy the prompts and agents.',
    installAction
  );

  await context.globalState.update(onboardingStateKey, true);

  if (selection === installAction) {
    await vscode.commands.executeCommand('workbench.action.showCommands');
    await vscode.commands.executeCommand(installCommandId);
  }
}