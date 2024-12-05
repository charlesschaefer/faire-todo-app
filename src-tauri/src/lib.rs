use std::sync::Mutex;


#[cfg(desktop)]
mod desktop;

mod http;
mod mdns;
mod notification;
mod data;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // broadcasts and discover mdns services in the network
    //mdns::discover_service();
    //mdns::broadcast_service();

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .manage(Mutex::new(data::AppData::default()))
        .setup(|_app| {
            #[cfg(desktop)]
            desktop::setup_system_tray_icon(_app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            mdns::search_network_sync_services,
            mdns::broadcast_network_sync_services,
            http::start_http_server,
            http::stop_http_server,
            notification::set_due_tasks,
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

