// ===============================
// API ENDPOINT
// ===============================

const API_URL = "/api/tasks";


// ===============================
// GET HTML ELEMENTS
// ===============================

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const dueDate = document.getElementById("dueDate");
const priority = document.getElementById("priority");
const tag = document.getElementById("tag");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const sortTasks = document.getElementById("sortTasks");
const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");
const progress = document.getElementById("progress");
const taskCount = document.getElementById("taskCount");


// ===============================
// TASK DATA STATE
// ===============================

let tasks = [];
let currentFilter = "All";


// ===============================
// EVENT LISTENERS
// ===============================

if (addTaskBtn) {
    addTaskBtn.addEventListener("click", addTask);
}

if (searchInput) {
    searchInput.addEventListener("input", displayTasks);
}

if (sortTasks) {
    sortTasks.addEventListener("change", displayTasks);
}

const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        currentFilter = button.textContent.trim();
        displayTasks();
    });
});


// ===============================
// ADD TASK
// ===============================

async function addTask() {
    const title = taskInput.value.trim();

    if (title === "") {
        alert("Please enter a task.");
        return;
    }

    const newTask = {
        title: title,
        due_date: dueDate.value || null,
        priority: priority.value,
        tag: tag.value.trim()
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newTask)
        });

        if (!response.ok) {
            throw new Error("Failed to add task");
        }

        clearForm();
        await loadTasks();

    } catch (error) {
        console.error("Error adding task:", error);
        alert("Could not add task.");
    }
}


// ===============================
// CLEAR FORM
// ===============================

function clearForm() {
    if (taskInput) taskInput.value = "";
    if (dueDate) dueDate.value = "";
    if (priority) priority.value = "Medium";
    if (tag) tag.value = "";
}


// ===============================
// LOAD TASKS FROM DATABASE
// ===============================

async function loadTasks() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load tasks");
        }

        const databaseTasks = await response.json();

        tasks = databaseTasks.map(task => ({
            id: task.id,
            title: task.title,
            dueDate: task.due_date,
            priority: task.priority,
            tag: task.tag || "",
            completed: Boolean(task.completed)
        }));

        displayTasks();

    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}


// ===============================
// DISPLAY TASKS
// ===============================

function displayTasks() {
    if (!taskList) return;

    taskList.innerHTML = "";

    let filteredTasks = [...tasks];

    // Filter
    if (currentFilter === "Active") {
        filteredTasks = filteredTasks.filter(task => task.completed === false);
    } else if (currentFilter === "Completed") {
        filteredTasks = filteredTasks.filter(task => task.completed === true);
    }

    // Search
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (searchText !== "") {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchText) ||
            task.tag.toLowerCase().includes(searchText)
        );
    }

    // Sort
    if (sortTasks && sortTasks.value === "newest") {
        filteredTasks.sort((a, b) => b.id - a.id);
    } else {
        filteredTasks.sort((a, b) => a.id - b.id);
    }

    // Empty state
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Add a task to get started.</p>
            </div>
        `;
        updateDashboard();
        return;
    }

    // Render task items
    filteredTasks.forEach(task => {
        const taskItem = document.createElement("div");
        taskItem.classList.add("task-item");

        taskItem.innerHTML = `
            <div class="task-info">
                <input
                    type="checkbox"
                    ${task.completed ? "checked" : ""}
                    onchange="toggleTask(${task.id})"
                >
                <div>
                    <div class="task-title ${task.completed ? "task-completed" : ""}">
                        ${task.title}
                    </div>
                    <small>
                        ${task.dueDate ? "Due: " + task.dueDate : "No due date"}
                        ${task.tag ? " • " + task.tag : ""}
                    </small>
                </div>
            </div>

            <div class="task-actions">
                <span class="priority priority-${task.priority.toLowerCase()}">
                    ${task.priority}
                </span>
                <button class="edit-btn" onclick="editTask(${task.id})">
                    Edit
                </button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">
                    Delete
                </button>
            </div>
        `;

        taskList.appendChild(taskItem);
    });

    updateDashboard();
}


// ===============================
// COMPLETE / UNCOMPLETE TASK
// ===============================

async function toggleTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    const newCompletedStatus = !task.completed;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                completed: newCompletedStatus ? 1 : 0
            })
        });

        if (!response.ok) {
            throw new Error("Failed to update task");
        }

        task.completed = newCompletedStatus;
        displayTasks();

    } catch (error) {
        console.error("Error updating task:", error);
        alert("Could not update task.");
    }
}


// ===============================
// EDIT TASK
// ===============================

async function editTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    const newTitle = prompt("Edit task:", task.title);
    if (newTitle === null) return;

    const updatedTitle = newTitle.trim();
    if (updatedTitle === "") {
        alert("Task cannot be empty.");
        return;
    }

    const newDueDate = prompt("Edit due date (YYYY-MM-DD):", task.dueDate || "");
    if (newDueDate === null) return;

    const newPriority = prompt("Edit priority (Low, Medium, High):", task.priority);
    if (newPriority === null) return;

    const formattedPriority = newPriority.trim().toLowerCase();
    let updatedPriority;

    if (formattedPriority === "high") {
        updatedPriority = "High";
    } else if (formattedPriority === "low") {
        updatedPriority = "Low";
    } else {
        updatedPriority = "Medium";
    }

    const newTag = prompt("Edit tag/category:", task.tag);
    if (newTag === null) return;

    const updatedTask = {
        title: updatedTitle,
        due_date: newDueDate || null,
        priority: updatedPriority,
        tag: newTag.trim()
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedTask)
        });

        if (!response.ok) {
            throw new Error("Failed to edit task");
        }

        await loadTasks();

    } catch (error) {
        console.error("Error editing task:", error);
        alert("Could not edit task.");
    }
}


// ===============================
// DELETE TASK
// ===============================

async function deleteTask(id) {
    const confirmDelete = confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete task");
        }

        await loadTasks();

    } catch (error) {
        console.error("Error deleting task:", error);
        alert("Could not delete task.");
    }
}


// ===============================
// DASHBOARD
// ===============================

function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    let percentage = 0;

    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }

    if (totalTasks) totalTasks.textContent = total;
    if (pendingTasks) pendingTasks.textContent = pending;
    if (completedTasks) completedTasks.textContent = completed;
    if (progress) progress.textContent = percentage + "%";

    const progressFill = document.querySelector(".progress-fill");
    if (progressFill) {
        progressFill.style.width = percentage + "%";
    }

    if (taskCount) {
        taskCount.textContent = total === 1 ? "1 task" : total + " tasks";
    }
}


// ===============================
// INITIALIZE APPLICATION
// ===============================

loadTasks();