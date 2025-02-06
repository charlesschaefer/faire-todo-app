# Faire Todo App

Faire is an offline-first OpenSource multiplatform todo app, created with Tauri and Angular. It stores the data using the IndexedDb of your platform's embeded web browser. You can synchronize the tasks between your devices using P2P-like "synchronization" (you move all the tasks from one device to other, overwriting the receiver data - they need to be on the same network to work). Alternativelly you can sign in using Google OAuth, and the data will be synchronized between signed in devices using Supabase's servers.

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
- [x] Google OAuth sign in option
- [x] Devices synchronization using Supabase's servers for signed in users
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

# Supabase and Google OAuth Authentication
In order to be able to make OAuth authentication to work on Android Devices, we needed to implement two Tauri plugins in the project:
- [shell](https://v2.tauri.app/plugin/shell/): Allows us to open an URL outside the app (opens in the user's default browser)
- [deep-linking](https://v2.tauri.app/plugin/deep-linking/): Allows us to associate the App as the one that will be used to open some kind of URLs.

By using shell plugin, we can ask the Android system to open supabase's authentication URL in a new browser window, allowing the user to reuse their current Google's session, instead of needing to login inside the App's webview. Our supabase authentication server was configured to redirect the user to an external URL (in this case, https://charlesschaefer.net/faire-todo-app/* prefixed URLs). 

Then, when the authentication is finished, Google redirects the user to something like **$URL/redirect.html#auth_token=....&refresh_token=....**. As Faire is registered as the app that opens this prefixed URLs, the user is automatically redirected to the app, that will receive the URL (including the needed tokens). We can then finish the signin process.

Check the file `src/app/services/auth.service.ts` (methods `signInWithGoogle` and `handleAuthCallback`).


# Download

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/faire-todo-app)


## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) + [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template).

