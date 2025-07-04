use serde::{Deserialize, Serialize};

#[derive(Default, Deserialize, Debug)]
pub struct Task {
    pub title: String,
}

#[derive(Default, Deserialize)]
pub struct TasksDuingNow {
    pub tasks: Vec<Task>,
}

#[derive(Default, Deserialize)]
pub struct TasksDuingToday {
    pub tasks: Vec<Task>,
}

#[derive(Default, Deserialize)]
pub struct Settings {
    // time of day to notify today tasks [hours, minutes]
    pub time_to_notify_today_tasks: [u32; 2],
    pub send_notifications: bool,
    pub send_today_notifications: bool,
    pub notification_title: String,
    pub notification_body: String,
    pub autostart: bool,
}

#[derive(Default)]
pub struct AppData {
    pub tasks_duing_now: TasksDuingNow,
    pub tasks_duing_today: TasksDuingToday,
    pub settings: Settings,
    //pub thread_handle: Option<std::thread::JoinHandle<()>>,
    pub thread_handle: Option<tauri::async_runtime::JoinHandle<()>>,
}

#[derive(Deserialize, Serialize)]
pub enum FileType {
    Png,
    Jpg,
    Pdf
}

#[derive(Deserialize, Serialize)]
pub struct FileData {
    pub name: String,
    pub blob: String,
    pub file_type: FileType,
}
