import { FileType } from '../../types';

export interface FileIconInfo {
  icon: string;
  color: string;
  className?: string;
}

/**
 * Gets the appropriate icon and color for a file or directory
 */
export function getFileIcon(fileName: string, fileType: FileType): FileIconInfo {
  // Directory icons
  if (fileType === FileType.Directory) {
    return getDirectoryIcon(fileName);
  }

  // File icons based on extension
  const extension = getFileExtension(fileName).toLowerCase();
  return getFileIconByExtension(extension, fileName);
}

/**
 * Gets directory-specific icons
 */
function getDirectoryIcon(dirName: string): FileIconInfo {
  const name = dirName.toLowerCase();

  // Special directory icons
  const specialDirs: Record<string, FileIconInfo> = {
    '.git': { icon: '📁', color: '#f97583', className: 'git-folder' },
    '.vscode': { icon: '📁', color: '#007acc', className: 'vscode-folder' },
    node_modules: { icon: '📁', color: '#3c873a', className: 'node-folder' },
    src: { icon: '📁', color: '#007acc', className: 'src-folder' },
    dist: { icon: '📁', color: '#ffab00', className: 'dist-folder' },
    build: { icon: '📁', color: '#ffab00', className: 'build-folder' },
    public: { icon: '📁', color: '#28a745', className: 'public-folder' },
    assets: { icon: '📁', color: '#28a745', className: 'assets-folder' },
    images: { icon: '🖼️', color: '#28a745', className: 'images-folder' },
    docs: { icon: '📚', color: '#17a2b8', className: 'docs-folder' },
    test: { icon: '🧪', color: '#ffc107', className: 'test-folder' },
    tests: { icon: '🧪', color: '#ffc107', className: 'test-folder' },
    __tests__: { icon: '🧪', color: '#ffc107', className: 'test-folder' },
    spec: { icon: '🧪', color: '#ffc107', className: 'spec-folder' },
    components: { icon: '🧩', color: '#6f42c1', className: 'components-folder' },
    utils: { icon: '🔧', color: '#6c757d', className: 'utils-folder' },
    lib: { icon: '📚', color: '#6c757d', className: 'lib-folder' },
    config: { icon: '⚙️', color: '#fd7e14', className: 'config-folder' },
    styles: { icon: '🎨', color: '#e83e8c', className: 'styles-folder' },
    css: { icon: '🎨', color: '#e83e8c', className: 'css-folder' },
    scss: { icon: '🎨', color: '#e83e8c', className: 'scss-folder' },
    sass: { icon: '🎨', color: '#e83e8c', className: 'sass-folder' },
  };

  return specialDirs[name] || { icon: '📁', color: '#90a4ae', className: 'default-folder' };
}

/**
 * Gets file icons based on extension
 */
function getFileIconByExtension(extension: string, fileName: string): FileIconInfo {
  const name = fileName.toLowerCase();

  // Special file names (full matches)
  const specialFiles: Record<string, FileIconInfo> = {
    'package.json': { icon: '📦', color: '#cb3837', className: 'package-json' },
    'tsconfig.json': { icon: '🔷', color: '#007acc', className: 'tsconfig' },
    'webpack.config.js': { icon: '📦', color: '#1c78c0', className: 'webpack' },
    dockerfile: { icon: '🐳', color: '#0db7ed', className: 'docker' },
    'docker-compose.yml': { icon: '🐳', color: '#0db7ed', className: 'docker' },
    'readme.md': { icon: '📖', color: '#17a2b8', className: 'readme' },
    '.gitignore': { icon: '📝', color: '#f97583', className: 'gitignore' },
    '.env': { icon: '🔐', color: '#ffc107', className: 'env' },
    '.env.local': { icon: '🔐', color: '#ffc107', className: 'env' },
    '.env.production': { icon: '🔐', color: '#dc3545', className: 'env' },
    '.env.development': { icon: '🔐', color: '#28a745', className: 'env' },
    'yarn.lock': { icon: '🧶', color: '#2188b6', className: 'yarn' },
    'package-lock.json': { icon: '🔒', color: '#cb3837', className: 'lock' },
    'pnpm-lock.yaml': { icon: '🔒', color: '#f69220', className: 'pnpm' },
    license: { icon: '⚖️', color: '#28a745', className: 'license' },
    mit: { icon: '⚖️', color: '#28a745', className: 'license' },
  };

  if (specialFiles[name]) {
    return specialFiles[name];
  }

  // Extension-based icons
  const extensionIcons: Record<string, FileIconInfo> = {
    // JavaScript/TypeScript
    js: { icon: '🟨', color: '#f7df1e', className: 'javascript' },
    jsx: { icon: '⚛️', color: '#61dafb', className: 'react' },
    ts: { icon: '🔷', color: '#007acc', className: 'typescript' },
    tsx: { icon: '⚛️', color: '#61dafb', className: 'react-ts' },
    mjs: { icon: '🟨', color: '#f7df1e', className: 'javascript' },

    // Web technologies
    html: { icon: '🌐', color: '#e34c26', className: 'html' },
    htm: { icon: '🌐', color: '#e34c26', className: 'html' },
    css: { icon: '🎨', color: '#1572b6', className: 'css' },
    scss: { icon: '🎨', color: '#cc6699', className: 'scss' },
    sass: { icon: '🎨', color: '#cc6699', className: 'sass' },
    less: { icon: '🎨', color: '#1d365d', className: 'less' },

    // Data formats
    json: { icon: '🗂️', color: '#ffc107', className: 'json' },
    xml: { icon: '🏷️', color: '#ff6600', className: 'xml' },
    yaml: { icon: '📄', color: '#cb171e', className: 'yaml' },
    yml: { icon: '📄', color: '#cb171e', className: 'yaml' },
    toml: { icon: '📄', color: '#6c757d', className: 'toml' },
    ini: { icon: '⚙️', color: '#6c757d', className: 'config' },
    conf: { icon: '⚙️', color: '#6c757d', className: 'config' },
    config: { icon: '⚙️', color: '#6c757d', className: 'config' },

    // Programming languages
    py: { icon: '🐍', color: '#3776ab', className: 'python' },
    java: { icon: '☕', color: '#ed8b00', className: 'java' },
    c: { icon: '©️', color: '#00599c', className: 'c' },
    cpp: { icon: '©️', color: '#00599c', className: 'cpp' },
    cc: { icon: '©️', color: '#00599c', className: 'cpp' },
    cxx: { icon: '©️', color: '#00599c', className: 'cpp' },
    h: { icon: '📎', color: '#00599c', className: 'header' },
    hpp: { icon: '📎', color: '#00599c', className: 'header' },
    cs: { icon: '🔷', color: '#239120', className: 'csharp' },
    php: { icon: '🐘', color: '#777bb4', className: 'php' },
    rb: { icon: '💎', color: '#cc342d', className: 'ruby' },
    go: { icon: '🐹', color: '#00add8', className: 'go' },
    rs: { icon: '🦀', color: '#ce422b', className: 'rust' },
    swift: { icon: '🐦', color: '#fa7343', className: 'swift' },
    kt: { icon: '🏗️', color: '#7f52ff', className: 'kotlin' },
    r: { icon: '📊', color: '#276dc3', className: 'r' },
    matlab: { icon: '📊', color: '#ff6600', className: 'matlab' },
    m: { icon: '📊', color: '#ff6600', className: 'matlab' },

    // Shell scripts
    sh: { icon: '🐚', color: '#89e051', className: 'shell' },
    bash: { icon: '🐚', color: '#89e051', className: 'bash' },
    zsh: { icon: '🐚', color: '#89e051', className: 'zsh' },
    fish: { icon: '🐠', color: '#89e051', className: 'fish' },
    ps1: { icon: '🔵', color: '#012456', className: 'powershell' },
    bat: { icon: '🦇', color: '#6c757d', className: 'batch' },
    cmd: { icon: '⚫', color: '#6c757d', className: 'cmd' },

    // Documents
    md: { icon: '📝', color: '#17a2b8', className: 'markdown' },
    markdown: { icon: '📝', color: '#17a2b8', className: 'markdown' },
    txt: { icon: '📄', color: '#6c757d', className: 'text' },
    doc: { icon: '📘', color: '#185abd', className: 'word' },
    docx: { icon: '📘', color: '#185abd', className: 'word' },
    pdf: { icon: '📕', color: '#dc3545', className: 'pdf' },
    rtf: { icon: '📄', color: '#6c757d', className: 'rtf' },

    // Images
    png: { icon: '🖼️', color: '#28a745', className: 'image' },
    jpg: { icon: '🖼️', color: '#28a745', className: 'image' },
    jpeg: { icon: '🖼️', color: '#28a745', className: 'image' },
    gif: { icon: '🖼️', color: '#28a745', className: 'image' },
    svg: { icon: '🎨', color: '#ff9800', className: 'svg' },
    ico: { icon: '🖼️', color: '#28a745', className: 'icon' },
    bmp: { icon: '🖼️', color: '#28a745', className: 'image' },
    webp: { icon: '🖼️', color: '#28a745', className: 'image' },

    // Audio/Video
    mp3: { icon: '🎵', color: '#9c27b0', className: 'audio' },
    wav: { icon: '🎵', color: '#9c27b0', className: 'audio' },
    mp4: { icon: '🎬', color: '#f44336', className: 'video' },
    avi: { icon: '🎬', color: '#f44336', className: 'video' },
    mov: { icon: '🎬', color: '#f44336', className: 'video' },
    mkv: { icon: '🎬', color: '#f44336', className: 'video' },

    // Archives
    zip: { icon: '📦', color: '#ffc107', className: 'archive' },
    rar: { icon: '📦', color: '#ffc107', className: 'archive' },
    '7z': { icon: '📦', color: '#ffc107', className: 'archive' },
    tar: { icon: '📦', color: '#ffc107', className: 'archive' },
    gz: { icon: '📦', color: '#ffc107', className: 'archive' },

    // Binary/Executable
    exe: { icon: '⚙️', color: '#6c757d', className: 'executable' },
    app: { icon: '📱', color: '#007acc', className: 'app' },
    deb: { icon: '📦', color: '#d70751', className: 'debian' },
    rpm: { icon: '📦', color: '#ee0000', className: 'redhat' },
    dmg: { icon: '💽', color: '#6c757d', className: 'disk-image' },

    // Database
    sql: { icon: '🗃️', color: '#336791', className: 'sql' },
    db: { icon: '🗃️', color: '#6c757d', className: 'database' },
    sqlite: { icon: '🗃️', color: '#003b57', className: 'sqlite' },

    // Fonts
    ttf: { icon: '🔤', color: '#6c757d', className: 'font' },
    otf: { icon: '🔤', color: '#6c757d', className: 'font' },
    woff: { icon: '🔤', color: '#6c757d', className: 'font' },
    woff2: { icon: '🔤', color: '#6c757d', className: 'font' },

    // Logs
    log: { icon: '📋', color: '#6c757d', className: 'log' },
    logs: { icon: '📋', color: '#6c757d', className: 'log' },
  };

  return extensionIcons[extension] || { icon: '📄', color: '#6c757d', className: 'default-file' };
}

/**
 * Extracts file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

/**
 * Checks if a file is hidden (starts with .)
 */
export function isHiddenFile(filename: string): boolean {
  return filename.startsWith('.') && filename !== '.' && filename !== '..';
}

/**
 * Gets a human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Formats a date for display
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    return 'Today';
  } else if (diffDays < 2) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}
