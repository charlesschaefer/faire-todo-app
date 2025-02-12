use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;

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
    builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // ...
            let _ = app.get_webview_window("main")
                       .expect("no main window")
                       .set_focus();
        }));
    
    builder = builder.plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sharetarget::init())
        .manage(Mutex::new(data::AppData::default()))
        .setup(|app| {
            #[cfg(desktop)]
            desktop::setup_system_tray_icon(app);

            #[cfg(all(desktop, dev))]
            app.deep_link().register("fairetodoapp")?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            mdns::search_network_sync_services,
            mdns::broadcast_network_sync_services,
            http::start_http_server,
            http::stop_http_server,
            notification::set_due_tasks,
            notification::set_today_tasks,
            notification::add_notification,
            notification::start_notification_daemon,
            notification::set_time_to_notify_today_tasks,
            close_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn close_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}
