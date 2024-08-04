#[cfg(desktop)]
mod desktop;
#[cfg(not(desktop))]
mod android;

mod mdns;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn search_network_sync_services() -> String {
    mdns::discover_service().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // broadcasts and discover mdns services in the network
    //mdns::discover_service();
    mdns::broadcast_service();


    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            #[cfg(desktop)]
            desktop::setup_system_tray_icon(app);

            #[cfg(not(desktop))]
            android::setup_system_tray_icon(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, search_network_sync_services])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}