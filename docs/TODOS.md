# TODOS

## Git Extension Workspace Integration - Remaining Tasks

| Title                                              | Description                                                                                      | Priority | Status | Date Created |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- | ------ | ------------ |
| Improve repository detection logic                 | Handle edge cases like Git submodules, nested repositories, and symlinks in repository detection | medium   | open   | 2025-10-01   |
| Enhance repository status indicators               | Add clean/dirty status and sync indicators to the branch badge in explorer header                | medium   | open   | 2025-10-01   |
| Support multiple workspace folders with Git status | Handle multiple workspace folders and show Git status for each repository separately             | medium   | open   | 2025-10-01   |
| Respect .gitignore when showing files              | Add option to hide files that are ignored by Git from the file tree                              | medium   | open   | 2025-10-01   |
| Add Git history timeline to file explorer          | Show file modification history and Git commit timeline as an additional view                     | low      | open   | 2025-10-01   |
| Support Git Large File Storage indicators          | Show special indicators for Git LFS tracked files                                                | low      | open   | 2025-10-01   |

## ✅ Completed Tasks

All high-priority atomic implementation tasks have been completed! See `completed-todos.md` for details.

| Title                                | Description                                                                              | Priority | Status    | Date Completed |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | -------- | --------- | -------------- |
| Create Git Decoration Service Bridge | Connect FileDecorationProvider with ExplorerView via event system                        | high     | completed | 2025-10-01     |
| Update FileTreeItem Component        | Enhanced badge rendering with colors, shadows, and proper decoration prop forwarding     | high     | completed | 2025-10-01     |
| Real-time Updates                    | Implemented event-driven Git status updates through electronAPI                          | high     | completed | 2025-10-01     |
| Repository Context Detection         | Verified context menu properly shows/hides Git actions based on repository detection     | high     | completed | 2025-10-01     |
| Add Git status decorations           | FileTreeItem now displays color-coded badges for all Git status types (M, A, D, R, U, ?) | high     | completed | 2025-10-01     |
| Detect Git repository in workspace   | ExplorerView detects .git directory and sets gitRepoDetected state                       | high     | completed | 2025-10-01     |
| Add Git branch info to header        | Explorer header shows branch name, ahead/behind counts, and repository icon              | medium   | completed | 2025-10-01     |
