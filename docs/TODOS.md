# TODOS

## Git Extension Workspace Integration

| Title                                              | Description                                                                                                                      | Priority | Status | Date Created |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------------ |
| Add Git status decorations to file tree items      | Integrate GitFileDecorationProvider with ExplorerView to show file status badges, colors, and tooltips on files in the file tree | high     | open   | 2025-10-01   |
| Detect Git repository in current workspace         | Update ExplorerView to detect when current directory is a Git repository and show appropriate indicators                         | high     | open   | 2025-10-01   |
| Add Git branch and status info to explorer header  | Show current Git branch, ahead/behind count, and repository status in the explorer header area                                   | medium   | open   | 2025-10-01   |
| Support multiple workspace folders with Git status | Handle multiple workspace folders and show Git status for each repository separately                                             | medium   | open   | 2025-10-01   |
| Respect .gitignore when showing files              | Add option to hide files that are ignored by Git from the file tree                                                              | medium   | open   | 2025-10-01   |
| Add Git history timeline to file explorer          | Show file modification history and Git commit timeline as an additional view                                                     | low      | open   | 2025-10-01   |
| Quick branch switching from explorer header        | Add branch dropdown in explorer header for quick branch switching                                                                | low      | open   | 2025-10-01   |
| Support Git Large File Storage indicators          | Show special indicators for Git LFS tracked files                                                                                | low      | open   | 2025-10-01   |

## Atomic Implementation Tasks

| Title                                | Description                                                                                    | Priority | Status | Date Created |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- | -------- | ------ | ------------ |
| Create Git Decoration Service Bridge | Connect FileDecorationProvider with ExplorerView and pass decoration data through React props  | high     | open   | 2025-10-01   |
| Update FileTreeItem Component        | Add decoration rendering (badges, colors) and update CSS for Git status indicators             | high     | open   | 2025-10-01   |
| Real-time Updates                    | Subscribe to Git status changes in ExplorerView and update decorations when Git status changes | high     | open   | 2025-10-01   |
| Repository Context Detection         | Detect if selected file is in a Git repository and show/hide Git options based on context      | high     | open   | 2025-10-01   |
| Repository Detection Logic           | Check for .git directory in workspace and update explorer state when repository status changes | high     | open   | 2025-10-01   |
| Visual Repository Indicators         | Add repository icon/badge to explorer header and show when not in a repository                 | medium   | open   | 2025-10-01   |
