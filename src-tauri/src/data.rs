

#[derive(Default)]
pub struct Task {
    title: String,
}

#[derive(Default)]
pub struct TaskDuingNow {
    tasks: Vec<Task>,
}

#[derive(Default)]
pub struct TaskDuingToday {
    tasks: Vec<Task>,
}

#[derive(Default)]
pub struct AppData {
    due_tasks: TaskDuingNow,
    due_today_tasks: TaskDuingToday,
}

