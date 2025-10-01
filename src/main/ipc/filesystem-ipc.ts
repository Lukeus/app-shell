import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import { PathSecurity } from './path-security';
import {
  FileReadFileSchema,
  FileReadFileTextSchema,
  FileWriteFileSchema,
  FileWriteFileTextSchema,
  FileCreateDirectorySchema,
  FileDeleteFileSchema,
  FileDeleteDirectorySchema,
  FileExistsSchema,
  FileStatSchema,
  FileReadDirectorySchema,
  FileGetFileTreeSchema,
  FileRenameSchema,
  FileCopyFileSchema,
  FileJoinPathSchema,
  FileResolvePathSchema,
  FileRelativePathSchema,
  EmptyPayloadSchema,
  ShowOpenDialogSchema,
  ShowSaveDialogSchema,
} from './schemas';
import { FileSystemManager } from '../file-system-manager';
import { dialog } from 'electron';

export function registerFilesystemIPC(
  ipc: IPCManager,
  logger: Logger,
  fileSystemManager: FileSystemManager,
  pathSecurity: PathSecurity
): void {
  // Read operations
  registerValidated(ipc, logger, {
    channel: 'filesystem:readFile',
    schema: FileReadFileSchema,
    capability: 'fs.read',
    pathValidation: {
      pathFields: ['path'],
      operation: 'read',
      pathSecurity,
    },
    handler: async input => fileSystemManager.readFile(input.path),
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:readFileText',
    schema: FileReadFileTextSchema,
    capability: 'fs.read',
    pathValidation: {
      pathFields: ['path'],
      operation: 'read',
      pathSecurity,
    },
    handler: async input =>
      fileSystemManager.readFileText(input.path, input.encoding as BufferEncoding | undefined),
  });

  // Write operations
  registerValidated(ipc, logger, {
    channel: 'filesystem:writeFile',
    schema: FileWriteFileSchema,
    capability: 'fs.write',
    pathValidation: {
      pathFields: ['path'],
      operation: 'write',
      pathSecurity,
    },
    handler: async input => {
      await fileSystemManager.writeFile(input.path, input.data);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:writeFileText',
    schema: FileWriteFileTextSchema,
    capability: 'fs.write',
    pathValidation: {
      pathFields: ['path'],
      operation: 'write',
      pathSecurity,
    },
    handler: async input => {
      await fileSystemManager.writeFileText(
        input.path,
        input.content,
        input.encoding as BufferEncoding | undefined
      );
      return { success: true };
    },
  });

  // Directory operations
  registerValidated(ipc, logger, {
    channel: 'filesystem:createDirectory',
    schema: FileCreateDirectorySchema,
    capability: 'fs.write',
    pathValidation: {
      pathFields: ['path'],
      operation: 'write',
      pathSecurity,
    },
    handler: async input => {
      await fileSystemManager.createDirectory(input.path);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:deleteFile',
    schema: FileDeleteFileSchema,
    capability: 'fs.delete',
    pathValidation: {
      pathFields: ['path'],
      operation: 'delete',
      pathSecurity,
    },
    handler: async input => {
      await fileSystemManager.deleteFile(input.path);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:deleteDirectory',
    schema: FileDeleteDirectorySchema,
    capability: 'fs.delete',
    pathValidation: {
      pathFields: ['path'],
      operation: 'delete',
      pathSecurity,
    },
    handler: async input => {
      await fileSystemManager.deleteDirectory(input.path);
      return { success: true };
    },
  });

  // Utility operations
  registerValidated(ipc, logger, {
    channel: 'filesystem:exists',
    schema: FileExistsSchema,
    capability: 'fs.read',
    pathValidation: {
      pathFields: ['path'],
      operation: 'read',
      pathSecurity,
    },
    handler: async input => fileSystemManager.exists(input.path),
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:stat',
    schema: FileStatSchema,
    capability: 'fs.read',
    pathValidation: {
      pathFields: ['path'],
      operation: 'read',
      pathSecurity,
    },
    handler: async input => fileSystemManager.stat(input.path),
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:readDirectory',
    schema: FileReadDirectorySchema,
    capability: 'fs.read',
    pathValidation: {
      pathFields: ['path'],
      operation: 'read',
      pathSecurity,
    },
    handler: async input => fileSystemManager.readDirectory(input.path),
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:getFileTree',
    schema: FileGetFileTreeSchema,
    capability: 'fs.read',
    pathValidation: {
      pathFields: ['rootPath'],
      operation: 'read',
      pathSecurity,
    },
    handler: async input => fileSystemManager.getFileTree(input.rootPath, input.depth),
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:rename',
    schema: FileRenameSchema,
    capability: 'fs.write',
    pathValidation: {
      pathFields: ['oldPath', 'newPath'],
      operation: 'write',
      pathSecurity,
    },
    handler: async input => {
      await fileSystemManager.rename(input.oldPath, input.newPath);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:copyFile',
    schema: FileCopyFileSchema,
    capability: 'fs.write',
    pathValidation: {
      pathFields: ['sourcePath', 'targetPath'],
      operation: 'write',
      pathSecurity,
    },
    handler: async input => {
      await fileSystemManager.copyFile(input.sourcePath, input.targetPath);
      return { success: true };
    },
  });

  // Path utility operations (no path validation needed as they don't access files)
  registerValidated(ipc, logger, {
    channel: 'filesystem:getHomeDirectory',
    schema: EmptyPayloadSchema,
    capability: 'fs.info',
    handler: async () => fileSystemManager.getHomeDirectory(),
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:getPathSeparator',
    schema: EmptyPayloadSchema,
    capability: 'fs.info',
    handler: async () => fileSystemManager.getPathSeparator(),
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:joinPath',
    schema: FileJoinPathSchema,
    capability: 'fs.info',
    handler: async input => fileSystemManager.joinPath(...input.segments),
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:resolvePath',
    schema: FileResolvePathSchema,
    capability: 'fs.info',
    handler: async input => fileSystemManager.resolvePath(input.path),
  });

  registerValidated(ipc, logger, {
    channel: 'filesystem:relativePath',
    schema: FileRelativePathSchema,
    capability: 'fs.info',
    handler: async input => fileSystemManager.relativePath(input.from, input.to),
  });

  // Dialog operations
  registerValidated(ipc, logger, {
    channel: 'fs:showOpenDialog',
    schema: ShowOpenDialogSchema,
    capability: 'ui.dialog',
    handler: async input => dialog.showOpenDialog(input.options),
  });

  registerValidated(ipc, logger, {
    channel: 'fs:showSaveDialog',
    schema: ShowSaveDialogSchema,
    capability: 'ui.dialog',
    handler: async input => dialog.showSaveDialog(input.options),
  });
}
