const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
    constructor() {
        const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'tasks.db');
        this.db = new sqlite3.Database(dbPath);
    }

    // Task operations
    createTask(task) {
        return new Promise((resolve, reject) => {
            const { title, description, due_date, priority, phone_number } = task;
            const sql = `
                INSERT INTO tasks (title, description, due_date, priority, phone_number)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [title, description, due_date, priority || 'medium', phone_number], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...task });
                }
            });
        });
    }

    getAllTasks() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM tasks ORDER BY due_date ASC';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getTaskById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM tasks WHERE id = ?';
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    updateTask(id, updates) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(id);
            
            const sql = `UPDATE tasks SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            
            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    deleteTask(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM tasks WHERE id = ?';
            
            this.db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Get tasks that are due and haven't had reminders sent
    getTasksDueForReminder() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM tasks 
                WHERE due_date <= datetime('now', '+1 hour') 
                AND status != 'completed' 
                AND reminder_sent = FALSE
                ORDER BY due_date ASC
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    markReminderSent(taskId) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE tasks SET reminder_sent = TRUE WHERE id = ?';
            
            this.db.run(sql, [taskId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Notification log operations
    logNotification(notification) {
        return new Promise((resolve, reject) => {
            const { task_id, phone_number, message, status, error_message } = notification;
            const sql = `
                INSERT INTO notification_log (task_id, phone_number, message, status, sent_at, error_message)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const sent_at = status === 'sent' ? new Date().toISOString() : null;
            
            this.db.run(sql, [task_id, phone_number, message, status, sent_at, error_message], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = DatabaseService;
