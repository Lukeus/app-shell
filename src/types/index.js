'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.LogLevel = exports.FileType = void 0;
var FileType;
(function (FileType) {
  FileType[(FileType['Unknown'] = 0)] = 'Unknown';
  FileType[(FileType['File'] = 1)] = 'File';
  FileType[(FileType['Directory'] = 2)] = 'Directory';
  FileType[(FileType['SymbolicLink'] = 64)] = 'SymbolicLink';
})(FileType || (exports.FileType = FileType = {}));
var LogLevel;
(function (LogLevel) {
  LogLevel[(LogLevel['Debug'] = 0)] = 'Debug';
  LogLevel[(LogLevel['Info'] = 1)] = 'Info';
  LogLevel[(LogLevel['Warning'] = 2)] = 'Warning';
  LogLevel[(LogLevel['Error'] = 3)] = 'Error';
})(LogLevel || (exports.LogLevel = LogLevel = {}));
