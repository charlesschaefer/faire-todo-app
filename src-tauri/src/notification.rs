use chrono::{Local, Timelike};
//use std::sync::Mutex;
use tokio::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::data;

const NOTIFICATION_DAEMON_SLEEP_TIME: u64 = 60;

pub fn notify(app_handle: tauri::AppHandle, title: String, body: String, channel: Option<String>) {
    let channel = channel.unwrap_or("general".to_string());
    println!(
        "Notifying with channel: {}, title: {}, body: {}",
        channel, title, body
    );

    let results = app_handle
        .notification()
        .builder()
        .channel_id(channel)
        .title(title)
        .large_body(body)
        .show();

    match results {
        Ok(_) => {
            println!("Notification shown successfully");
        }
        Err(err) => {
            println!("Error sending notification: {:?}", err);
        }
    }
}

#[tauri::command]
pub fn add_notification(app_handle: tauri::AppHandle, title: String, body: String) {
    notify(app_handle, title, body, None);
}

#[tauri::command]
pub async fn set_due_tasks(app_handle: tauri::AppHandle, due_tasks: data::TasksDuingNow) {
    let app_data = app_handle.state::<Mutex<data::AppData>>();
    let mut app_data = app_data.lock().await;
    app_data.tasks_duing_now = due_tasks;
}

#[tauri::command]
pub async fn set_today_tasks(app_handle: tauri::AppHandle, today_tasks: data::TasksDuingToday) {
    let app_data = app_handle.state::<Mutex<data::AppData>>();
    let mut app_data = app_data.lock().await;
    app_data.tasks_duing_today = today_tasks;
}

#[tauri::command]
pub async fn set_time_to_notify_today_tasks(
    app_handle: tauri::AppHandle,
    time_to_notify_today_tasks: [u32; 2],
) {
    let app_data = app_handle.state::<Mutex<data::AppData>>();
    let mut app_data = app_data.lock().await;
    app_data.settings.time_to_notify_today_tasks = time_to_notify_today_tasks;
}

#[tauri::command]
pub async fn start_notification_daemon(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<data::AppData>>,
    settings: data::Settings,
) -> Result<(), ()> {
    let mut app_data = state.lock().await;
    app_data.settings = settings;
    let create_thread = true;

    #[cfg(desktop)]
    {
        crate::desktop::setup_autostart(&app, app_data.settings.autostart);
    }

    if !app_data.settings.send_notifications {
        println!("Not sending notifications");
        drop(app_data);
        return Ok(());
    }

    // Check if there's already a thread running
    if app_data.thread_handle.is_some() {
        println!(
            "Notification daemon already running {}",
            app_data.thread_handle.is_some()
        );
        drop(app_data);
        return Ok(());
    }

    println!("Sending notifications");

    // create notification channels for android
    #[cfg(target_os = "android")]
    {
        use tauri_plugin_notification::{Channel, Importance};
        // Create notification channels
        let general_channel = Channel::builder("general", "General")
            .description("General notifications from the app")
            .importance(Importance::Default)
            .build();

        let tasks_channel = Channel::builder("tasks", "Tasks")
            .description("Task due notifications")
            .importance(Importance::High)
            .build();

        let daily_tasks_channel = Channel::builder("daily-tasks", "Daily Tasks")
            .description("Daily task summary notifications")
            .importance(Importance::High)
            .build();

        app.notification().create_channel(general_channel).unwrap();
        app.notification().create_channel(tasks_channel).unwrap();
        app.notification()
            .create_channel(daily_tasks_channel)
            .unwrap();
    }

    if !create_thread {
        return Ok(());
    }

    // Spawn background thread only if none exists
    //app_data.thread_handle = Some(std::thread::spawn(move || {
    let thread_handle = tauri::async_runtime::spawn(async move {

        println!("Starting notification daemon");
        loop {
            let app_data = app.state::<Mutex<data::AppData>>();
            let app_data = app_data.lock().await;

            println!("Checking for due tasks");
            // send to frontend the event to check for due tasks
            app.emit("get-due-tasks", "").unwrap();
            app.emit("get-today-tasks", "").unwrap();

            // get the due tasks and notify the user
            println!("Due tasks: {:?}", app_data.tasks_duing_now.tasks);
            if !app_data.tasks_duing_now.tasks.is_empty() {
                app_data.tasks_duing_now.tasks.iter().for_each(|task| {
                    let local_app = app.clone();
                    let body = app_data
                        .settings
                        .notification_body
                        .replace("{title}", &task.title);
                    notify(
                        local_app,
                        app_data.settings.notification_title.clone(),
                        body,
                        Some("tasks".to_string()),
                    );
                });
            }
            println!(
                "Checking for today tasks {:?}, Notify today: {} at{:?}",
                app_data.tasks_duing_today.tasks,
                app_data.settings.send_today_notifications,
                app_data.settings.time_to_notify_today_tasks
            );
            if !app_data.tasks_duing_today.tasks.is_empty()
                && app_data.settings.send_today_notifications
            {
                let current_hour = Local::now().hour();
                let current_minute = Local::now().minute();
                println!(
                    "Hora atual: {}:{} - Hora para notificar: {:?}",
                    current_hour, current_minute, app_data.settings.time_to_notify_today_tasks
                );

                if current_hour == app_data.settings.time_to_notify_today_tasks[0]
                    && current_minute == app_data.settings.time_to_notify_today_tasks[1]
                {
                    println!("Due today tasks: {:?}", app_data.tasks_duing_today.tasks);

                    let total = app_data.tasks_duing_today.tasks.len();
                    let title = "Tasks duing today".to_string();
                    let body = format!("You have {} task(s) duing today.", total);

                    let local_app = app.clone();

                    #[cfg(not(desktop))]
                    let channel = Some("daily-tasks".to_string());

                    #[cfg(desktop)]
                    let channel = None;

                    notify(local_app, title, body, channel);
                }
            }
            drop(app_data);
            println!("Waiting {} second", NOTIFICATION_DAEMON_SLEEP_TIME);
            //std::thread::sleep(std::time::Duration::from_secs(
            let sleep = tokio::time::sleep(std::time::Duration::from_secs(
                NOTIFICATION_DAEMON_SLEEP_TIME,
            ));
            sleep.await;
        }

    });

    app_data.thread_handle = Some(thread_handle);
    return Ok(());
}

#[tauri::command]
pub async fn set_autostart(
    app_handle: tauri::AppHandle, 
    state: tauri::State<'_, Mutex<data::AppData>>,
    enable: Option<bool>) -> Result<(), ()> {
    #[cfg(desktop)]
    { 
        let mut app_data = state.lock().await;
        app_data.settings.autostart = enable.unwrap_or(false);
        crate::desktop::setup_autostart(&app_handle, app_data.settings.autostart);

        Ok(())
    }

}
