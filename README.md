# Faire Todo App

Faire is an offline OpenSource multiplatform todo app, created with Tauri and Angular. It stores the data using the IndexedDb of your platform's embeded web browser.

Faire is the infinitive verb in french equivalent to "to do".

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
- [x] Subtasks
- [x] Recurring tasks
- [x] Synchronization of data between devices connected in the same network
- [x] Fill the due date and due time based on dates typed in the task title (i.e.: "Do this today" sets the due date for today automatically).
- [ ] A calendar view of the tasks
- [ ] A time tracker to track each task



# Building

```
npm install
npm run tauri build # for windows, linux and macOS
# or run the following for android:
npm run tauri android init
npm run tauri android build
```

Check [Tauri Dependencies](https://v2.tauri.app/start/prerequisites/) to know what to install before building. And check [Android Code Signing](https://v2.tauri.app/distribute/signing/android/) to know how to set up keys to sign your APK.


# Install android dependencies

```
mkdir ~/.android/sdk
cd ~/.android/sdk
wget https://dl.google.com/android/repository/commandlinetools-linux-12266719_latest.zip
unzip commandlinetools-linux-12266719_latest.zip
mkdir cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest
cd cmdline-tools/latest/
./bin/sdkmanager --licenses
./bin/sdkmanager tools
./bin/sdkmanager platform-tools
./bin/sdkmanager "ndk;27.0.11902837"

# Set environment variables

export ANDROID_HOME=$HOME/.android/sdk
export ANDROID_SDK_ROOT=$HOME/.android/sdk
export NDK_HOME=$HOME/.android/sdk/ndk/27.0.11902837

# Install Rust toolchains
rustup toolchain install stable --target aarch64-linux-android --target armv7-linux-androideabi --target i686-linux-android --target x86_64-linux-android --profile minimal
```

# Developing 

```
npm install
npm run tauri dev
# or to test on android emulator or device:
npm run tauri android dev
```

# Download

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/faire-todo-app)


## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) + [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template).
