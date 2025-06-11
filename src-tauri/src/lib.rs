use base64::{engine::general_purpose, Engine};
use data::FileType;
use std::io::Read;
use tauri::{webview, AppHandle, Manager, Url};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::{FsExt, OpenOptions};

#[cfg(desktop)]
mod desktop;

mod data;
mod http;
mod mdns;
mod notification;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // broadcasts and discover mdns services in the network
    //mdns::discover_service();
    //mdns::broadcast_service();

    let mut builder = tauri::Builder::default();
        
    #[cfg(desktop)]
    {
        use tauri_plugin_autostart::MacosLauncher;
        //if !cfg!(dev) {
            builder = builder
                .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                    // ...
                    let webview = app.get_webview_window("main").expect("no main window");
                    webview.set_focus().expect("Can't focus the main window");
                    dbg!("Single instance plugin activated, focusing the main window.");
                    dbg!("Args: {:?}", &_args);
                    dbg!("CWD: {:?}", _cwd);

                    let new_url: Url;
                    if _args.is_empty() || _args.len() <= 1 {
                        // If no arguments are passed, navigate to the default URL.
                        new_url = Url::parse("tauri://localhost/today").expect("Invalid URL");
                    } else {
                        // If arguments are passed, use the first argument as the URL.
                        new_url = Url::parse(&_args[1]).expect("Invalid URL");
                    }
                    // new_url.set_scheme(current_url.scheme()).expect("Couldn't set scheme for the new URL");
                    // new_url.set_host(Some(current_url.as_str())).expect("Couldn't set host for the new URL");
                    // dbg!("Navigating to: {}", &new_url);
                    // webview.navigate(new_url).expect("Couldn't navigate to the new URL");
                    redirect_webview(webview, &new_url, new_url.fragment().unwrap_or(""));
                }));
        //}

        builder = builder
            .plugin(tauri_plugin_autostart::init(
                MacosLauncher::LaunchAgent,
                Some(vec![]),
            ))
            .plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sharetarget::init())
        .manage(tokio::sync::Mutex::new(data::AppData::default()))
        .setup(|app| {
            #[cfg(desktop)]
            {
                desktop::setup_system_tray_icon(app);
            }

            #[cfg(all(desktop))]
            app.deep_link().register("fairetodoapp")?;

            handle_deep_links(app.handle());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            encode_file_to_base64,
            decode_base64_to_binary,
            mdns::search_network_sync_services,
            mdns::broadcast_network_sync_services,
            http::start_http_server,
            http::stop_http_server,
            notification::set_due_tasks,
            notification::set_today_tasks,
            notification::add_notification,
            notification::start_notification_daemon,
            notification::set_time_to_notify_today_tasks,
            #[cfg(desktop)]
            notification::set_autostart,
            close_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn handle_deep_links(app: &AppHandle) {
    let app2 = app.clone();
    app.deep_link().on_open_url(move |event| {
        let urls = event.urls();
        dbg!("Received deep link: {:?}", &urls);
        let url = &urls[0];
        if url.path() != "/auth/callback/" {
            return;
        }
        if let Some(fragment) = url.fragment() {
            let webview = app2.get_webview_window("main").expect("no main window");
            redirect_webview(webview, url, fragment);
            
        }
    });
}

fn redirect_webview(webview: tauri::WebviewWindow, url: &Url, fragment: &str) {
    let mut base_url = webview.url().expect("Coudln't get the URL");
        base_url.set_path(url.path());
        base_url.set_fragment(Some(fragment));

    dbg!("Redirecting webview to: {}", &base_url);
    webview
        .navigate(base_url)
        .expect("Couldn't navigate to the new URL");
}

#[tauri::command]
fn close_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
fn encode_file_to_base64(app_handle: tauri::AppHandle) -> Result<data::FileData, String> {
    let file_path_opt = app_handle.dialog().file().blocking_pick_file();
    // Opens a dialog to the user choose a file
    if file_path_opt.is_none() {
        return Err("No file selected".to_string());
    }
    let file_path = file_path_opt.unwrap();

    // Read the file
    let mut open_options = OpenOptions::default();
    open_options.read(true);
    let mut file = app_handle
        .fs()
        .open(file_path.clone(), open_options)
        .unwrap();

    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

    // Gets the file name
    let fpath_str = file_path.clone().to_string();
    let fname = app_handle.path().file_name(&fpath_str.as_str()).unwrap();
    // let fname = Path::new(fpath_str.as_str())
    //     .file_name()
    //     .unwrap()
    //     .to_str()
    //     .unwrap();

    // Encode the file to Base64
    let base64_data = general_purpose::STANDARD.encode(&buffer);
    let extension = fname.split(".").last().unwrap();
    let file_type = match extension.to_lowercase().clone().as_str() {
        "png" => FileType::PNG,
        "jpg" => FileType::JPG,
        "jpeg" => FileType::JPG,
        "pdf" => FileType::PDF,
        _ => FileType::PNG,
    };

    let ret = data::FileData {
        name: fname,
        blob: base64_data,
        file_type,
    };

    Ok(ret)
}

#[tauri::command]
fn decode_base64_to_binary(blob: String) -> Result<Vec<u8>, String> {
    let data = general_purpose::STANDARD.decode(blob);

    Ok(data.unwrap())
}
