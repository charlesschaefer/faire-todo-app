use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::{
    menu::{MenuBuilder, MenuItem},
    App, Manager, WindowEvent,
};

#[cfg(desktop)]
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
    window.on_window_event(move |event| if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        window_hider.hide().unwrap();
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
            } => match button {
                MouseButton::Left => {
                    dbg!("system tray received a left click");
                    let window = tray_icon.app_handle().get_webview_window("main").unwrap();
                    window.show().unwrap();
                }
                _ => {
                    dbg!("system tray received a middle or right click");
                }
            },
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
