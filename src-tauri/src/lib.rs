use tauri::{Manager, Emitter};

#[cfg(desktop)]
mod desktop;

mod mdns;
mod http;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // broadcasts and discover mdns services in the network
    //mdns::discover_service();
    //mdns::broadcast_service();

    let mut builder = tauri::Builder::default();

    builder.plugin(tauri_plugin_notification::init())
        .setup(|app| {
            #[cfg(desktop)]
            desktop::setup_system_tray_icon(app);

            // #[cfg(not(desktop))]
            // android::setup_system_tray_icon(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            mdns::search_network_sync_services,
            mdns::broadcast_network_sync_services,
            http::start_http_server,
            add_notification,
            close_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn add_notification(app_handle: tauri::AppHandle, title: String, body: String) {
    use tauri_plugin_notification::NotificationExt;
    let _ = app_handle.emit("msg", "Building the notification").unwrap();
    let mut notification = app_handle.notification().builder();
    let _ = app_handle.emit("msg", "Let's add title").unwrap();
    notification = notification.title(title);
    let _ = app_handle.emit("msg", "Now let's add body").unwrap();
    notification = notification.body(body);
    let _ = app_handle.emit("msg", "Notification built. Lets show it").unwrap();
    let results = notification.show();
    let _ = app_handle.emit("msg", "Notification showed. Let's check its results").unwrap();
    results.unwrap();
    let _ = app_handle.emit("msg", "Everything ok with notifications").unwrap();
}


#[tauri::command]
fn close_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}
