//use tauri::{Manager, Emitter};

#[cfg(desktop)]
mod desktop;

mod http;
mod mdns;
mod data;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // broadcasts and discover mdns services in the network
    //mdns::discover_service();
    //mdns::broadcast_service();

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|_app| {
            #[cfg(desktop)]
            desktop::setup_system_tray_icon(_app);
            
            _app.manage(Mutex::new(data::AppData::default()));
            
            let app = _app.clone(); 
            // Spawn background thread 
            std::thread::spawn(|| {
                loop {
                    app.emit_to("main", "get-due-tasks", "").unwrap();
                    std::thread::sleep(std::time::Duration::from_secs(1));
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            mdns::search_network_sync_services,
            mdns::broadcast_network_sync_services,
            http::start_http_server,
            http::stop_http_server,
            set_due_tasks,
            add_notification,
            close_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn add_notification(app_handle: tauri::AppHandle, title: String, body: String) {
    use tauri_plugin_notification::NotificationExt;
    let results = app_handle
        .notification()
        .builder()
        .title(title)
        .large_body(body)
        .show();

    match results {
        Ok(_) => {
            println!("Notification shown successfully");
        },
        Err(err) => {
            println!("Error sending notification: {:?}", err);
        }
    }
}

#[tauri::command]
fn close_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
fn set_due_tasks(app_handle: tauri::AppHandle, due_tasks: data::TaskDuingNow) {
    let app_data = app_handle.state::<Mutex<data::AppData>>();
    let mut app_data = app_data.lock().unwrap();
    app_data.due_tasks = due_tasks;
}