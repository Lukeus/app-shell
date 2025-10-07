/**
 * Error handling utilities for Monaco Editor integration
 * Following enterprise standards for comprehensive error management
 */

export interface EditorError extends Error {
  code: string;
  filePath?: string;
  details?: unknown;
  timestamp: number;
}

export class EditorErrorHandler {
  private static instance: EditorErrorHandler;
  private errorLog: EditorError[] = [];

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): EditorErrorHandler {
    if (!EditorErrorHandler.instance) {
      EditorErrorHandler.instance = new EditorErrorHandler();
    }
    return EditorErrorHandler.instance;
  }

  /**
   * Creates a standardized editor error
   */
  public createError(
    code: string,
    message: string,
    filePath?: string,
    details?: unknown
  ): EditorError {
    const error = new Error(message) as EditorError;
    error.code = code;
    error.filePath = filePath;
    error.details = details;
    error.timestamp = Date.now();

    return error;
  }

  /**
   * Logs and handles file operation errors
   */
  public handleFileError(operation: string, filePath: string, error: Error): EditorError {
    const editorError = this.createError(
      `FILE_${operation.toUpperCase()}_ERROR`,
      `Failed to ${operation} file: ${error.message}`,
      filePath,
      error
    );

    this.logError(editorError);
    return editorError;
  }

  /**
   * Handles Monaco Editor initialization errors
   */
  public handleEditorInitError(error: Error, filePath?: string): EditorError {
    const editorError = this.createError(
      'EDITOR_INIT_ERROR',
      `Monaco Editor initialization failed: ${error.message}`,
      filePath,
      error
    );

    this.logError(editorError);
    return editorError;
  }

  /**
   * Shows user-friendly error notification
   */
  public showUserError(error: EditorError): void {
    const userMessage = this.getUserFriendlyMessage(error);
    console.warn('User Error:', userMessage);
  }

  /**
   * Logs error to console and internal log
   */
  private logError(error: EditorError): void {
    this.errorLog.push(error);
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    console.error('Editor Error:', {
      code: error.code,
      message: error.message,
      filePath: error.filePath,
      timestamp: new Date(error.timestamp).toISOString(),
      details: error.details,
    });
  }

  /**
   * Converts technical errors to user-friendly messages
   */
  private getUserFriendlyMessage(error: EditorError): string {
    switch (error.code) {
      case 'FILE_READ_ERROR':
        return `Cannot open file. Please check if the file exists and you have permission to read it.`;

      case 'FILE_WRITE_ERROR':
        return `Cannot save file. Please check if you have write permissions.`;

      case 'EDITOR_INIT_ERROR':
        return `Editor failed to load. Please try refreshing the application.`;

      default:
        return `An unexpected error occurred: ${error.message}`;
    }
  }
}
