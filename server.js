// ===============================
// IMPORT PACKAGES
// ===============================

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");


// ===============================
// CREATE APP
// ===============================

const app = express();
const PORT = 3000;


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// ===============================
// MYSQL CONNECTION
// ===============================

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // Update with your MySQL password if configured
    database: "myproject_db"
});


// ===============================
// CONNECT TO MYSQL
// ===============================

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err);
        return;
    }

    console.log("Connected to MySQL database!");
});


// ===============================
// GET ALL TASKS
// ===============================

app.get("/api/tasks", (req, res) => {
    const sql = "SELECT * FROM tasks ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error getting tasks:", err);
            return res.status(500).json({
                error: "Failed to get tasks"
            });
        }

        res.json(results);
    });
});


// ===============================
// ADD TASK
// ===============================

app.post("/api/tasks", (req, res) => {
    const { title, due_date, priority, tag } = req.body;

    if (!title) {
        return res.status(400).json({
            error: "Task title is required"
        });
    }

    const sql = `
        INSERT INTO tasks (title, due_date, priority, tag)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            title,
            due_date || null,
            priority || "Medium",
            tag || ""
        ],
        (err, result) => {
            if (err) {
                console.error("Error adding task:", err);
                return res.status(500).json({
                    error: "Failed to add task"
                });
            }

            res.status(201).json({
                id: result.insertId,
                title: title,
                due_date: due_date || null,
                priority: priority || "Medium",
                tag: tag || "",
                completed: false
            });
        }
    );
});


// ===============================
// UPDATE TASK
// ===============================

app.put("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { title, due_date, priority, tag, completed } = req.body;

    // If completed status is provided alone, update only completion
    if (completed !== undefined && title === undefined) {
        const sql = "UPDATE tasks SET completed = ? WHERE id = ?";

        db.query(sql, [completed, id], (err, result) => {
            if (err) {
                console.error("Error updating completion:", err);
                return res.status(500).json({
                    error: "Failed to update task"
                });
            }

            return res.json({
                message: "Task completion updated"
            });
        });

        return;
    }

    // Update full task information
    const sql = `
        UPDATE tasks
        SET
            title = ?,
            due_date = ?,
            priority = ?,
            tag = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            title,
            due_date || null,
            priority,
            tag || "",
            id
        ],
        (err, result) => {
            if (err) {
                console.error("Error editing task:", err);
                return res.status(500).json({
                    error: "Failed to edit task"
                });
            }

            res.json({
                message: "Task updated successfully"
            });
        }
    );
});


// ===============================
// DELETE TASK
// ===============================

app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM tasks WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting task:", err);
            return res.status(500).json({
                error: "Failed to delete task"
            });
        }

        res.json({
            message: "Task deleted successfully"
        });
    });
});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});