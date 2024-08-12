# Faire Todo App

Faire is an offline OpenSource multiplatform todo app, created with Tauri and Angular. It stores the data using the IndexedDb of your platform's embeded web browser.

Fair is the infinitive verb in french equivalent to "to do".

# Features

- [x] Tasks (of course)
- [x] Works 100% offline.
- [x] Projects, where you can group tasks by project or themes.
- [x] An inbox area, where you can register all tasks before moving to projects or prioritizing
- [x] Due date and Due time for the tasks
- [x] View of tasks for today
- [x] View of upcoming tasks
- [x] Search tasks
- [x] View all tasks
- [x] Allow undoing when deleting a task or marking it as complete.
- [x] Manual task ordering, for prioritization
- [ ] Tags for tasks
- [x] Notifications of tasks reaching their due time (Windows and Linux only)
- [ ] Subtasks
- [ ] Recurring tasks
- [x] Synchronization of data between devices connected in the same network



# Building

```
npm install
npm run tauri build # for windows, linux and macOS
# or run the following for android:
npm run tauri android init
npm run tauri android build
```

Check [Tauri Dependencies](https://v2.tauri.app/start/prerequisites/) for know what to install before building.

# Developing 

```
npm install
npm run tauri dev
# or to test on android emulator or device:
npm run tauri android dev
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) + [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template).
