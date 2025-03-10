use std::sync::Mutex;
use tauri::{AppHandle, Manager};
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
    {
        use tauri_plugin_autostart::MacosLauncher;
        builder = builder
            .plugin(tauri_plugin_autostart::init(
                MacosLauncher::LaunchAgent,
                Some(vec![]),
            ))
            .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                // ...
                let webview = app.get_webview_window("main").expect("no main window");
                webview.set_focus().expect("Can't focus the main window");
            }))
            .plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sharetarget::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(Mutex::new(data::AppData::default()))
        .setup(|app| {
            #[cfg(desktop)]
            {
                desktop::setup_system_tray_icon(app);
            }

            #[cfg(all(desktop, dev))]
            app.deep_link().register("fairetodoapp")?;

            handle_deep_links(app.handle());

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
            notification::set_autostart,
            close_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn handle_deep_links(app: &AppHandle) {
    let app2 = app.clone();
    app.deep_link().on_open_url(move |event| {
        let url = &event.urls()[0];
        if url.path() != "/auth/callback/" {
            return;
        }
        if let Some(fragment) = url.fragment() {
            let mut webview = app2.get_webview_window("main").expect("no main window");

            let mut base_url = webview.url().expect("Coudln't get the URL");
            base_url.set_path(url.path());
            base_url.set_fragment(Some(fragment));

            webview
                .navigate(base_url)
                .expect("Couldn't navigate to the new URL");
        }
    });
}

#[tauri::command]
fn close_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}
