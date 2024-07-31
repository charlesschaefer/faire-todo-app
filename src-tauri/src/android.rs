

#[cfg(not(desktop))]
pub fn setup_system_tray_icon(_app: &mut tauri::App) {
    dbg!("Mobile environment, no system tray icon support available.");
}