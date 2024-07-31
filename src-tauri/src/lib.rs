use tauri::{menu::{MenuBuilder, MenuItem}, App, Manager, WindowEvent};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            setup_system_tray_icon(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn setup_system_tray_icon(app: &mut App) {
    // creates the tray icon menu
    let item_show = MenuItem::new(app, "Show/Hide", true, Some("S")).unwrap();
    let item_quit = MenuItem::new(app, "Quit", true, Some("Q")).unwrap();
    let menu = MenuBuilder::new(app)
        .item(&item_show)
        .item(&item_quit)
        .build()
        .unwrap();

    let window = app.get_webview_window("main").unwrap();
    let window_hider = window.clone();
    window.on_window_event(move |event| {
        match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                window_hider.hide().unwrap();
            },
            _ => {}
        }
    });

    // creates the tray icon
    let _ = TrayIconBuilder::new()
        .tooltip("Faire Todo App")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_tray_icon_event(|tray_icon, event| match event {
            TrayIconEvent::Click {
                id: _,
                position: _,
                rect: _,
                button,
                button_state: _,
            } => {
                match button {
                    MouseButton::Left => {
                        dbg!("system tray received a left click");
                        let window =
                            tray_icon.app_handle().get_webview_window("main").unwrap();
                        window.show().unwrap();
                    }
                    _ => {
                        dbg!("system tray received a middle or right click");
                    }
                }
            }
            _ => {
                dbg!("system tray received an unknow event");
            }
        })
        .on_menu_event(move |app, event| {
            let quit = item_quit.clone();
            let show = item_show.clone();
            if event.id() == quit.id() {
                app.exit(0);
            } else if event.id() == show.id() {
                let window = app.get_webview_window("main").unwrap();
                if window.is_visible().unwrap_or(false) {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                }
            }
        })
        .build(app);
}