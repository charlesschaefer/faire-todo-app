# Faire Todo App

Faire is an offline OpenSource multiplatform todo app, created with Tauri and Angular. It stores the data using the IndexedDb of your platform's embeded web browser.

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
