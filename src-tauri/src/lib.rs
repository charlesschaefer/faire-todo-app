#[cfg(desktop)]
mod desktop;
#[cfg(not(desktop))]
mod android;

mod mdns;
mod http;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // broadcasts and discover mdns services in the network
    //mdns::discover_service();
    //mdns::broadcast_service();


    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            #[cfg(desktop)]
            desktop::setup_system_tray_icon(app);

            #[cfg(not(desktop))]
            android::setup_system_tray_icon(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet, 
            mdns::search_network_sync_services,
            mdns::broadcast_network_sync_services,
            http::start_http_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}