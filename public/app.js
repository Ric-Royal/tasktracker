// Task Tracker App JavaScript
class TaskTracker {
    constructor() {
        this.tasks = [];
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTasks();
        this.setDefaultDateTime();
    }

    bindEvents() {
        // Modal events
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openAddTaskModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Filter and sort events
        document.getElementById('statusFilter').addEventListener('change', () => this.filterAndDisplayTasks());
        document.getElementById('priorityFilter').addEventListener('change', () => this.filterAndDisplayTasks());
        document.getElementById('sortBy').addEventListener('change', () => this.filterAndDisplayTasks());
        
        // Manual check button
        document.getElementById('manualCheckBtn').addEventListener('click', () => this.runManualCheck());
        
        // Close modal on outside click
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.closeModal();
            }
        });
    }

    setDefaultDateTime() {
        const now = new Date();
        now.setHours(now.getHours() + 1); // Default to 1 hour from now
        const isoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById('taskDueDate').value = isoString;
    }

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error('Failed to load tasks');
            
            this.tasks = await response.json();
            this.updateStats();
            this.filterAndDisplayTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showNotification('Failed to load tasks', 'error');
        }
    }

    updateStats() {
        const stats = {
            total: this.tasks.length,
            pending: this.tasks.filter(t => t.status === 'pending').length,
            inProgress: this.tasks.filter(t => t.status === 'in_progress').length,
            completed: this.tasks.filter(t => t.status === 'completed').length
        };

        document.getElementById('totalTasks').textContent = stats.total;
        document.getElementById('pendingTasks').textContent = stats.pending;
        document.getElementById('inProgressTasks').textContent = stats.inProgress;
        document.getElementById('completedTasks').textContent = stats.completed;
    }

    filterAndDisplayTasks() {
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        let filteredTasks = this.tasks.filter(task => {
            const statusMatch = !statusFilter || task.status === statusFilter;
            const priorityMatch = !priorityFilter || task.priority === priorityFilter;
            return statusMatch && priorityMatch;
        });

        // Sort tasks
        filteredTasks.sort((a, b) => {
            switch (sortBy) {
                case 'due_date':
                    return new Date(a.due_date) - new Date(b.due_date);
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'created_at':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        this.displayTasks(filteredTasks);
    }

    displayTasks(tasks) {
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');

        if (tasks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');
    }

    createTaskCard(task) {
        const dueDate = new Date(task.due_date);
        const now = new Date();
        const isOverdue = dueDate < now && task.status !== 'completed';
        const isDueSoon = dueDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000) && !isOverdue && task.status !== 'completed';

        const statusIcons = {
            pending: 'fas fa-clock text-orange-500',
            in_progress: 'fas fa-play text-blue-500',
            completed: 'fas fa-check text-green-500'
        };

        const priorityColors = {
            high: 'text-red-600 bg-red-100',
            medium: 'text-yellow-600 bg-yellow-100',
            low: 'text-green-600 bg-green-100'
        };

        const cardClasses = `task-card bg-white rounded-xl shadow-sm border priority-${task.priority} ${isOverdue ? 'overdue' : ''} ${isDueSoon ? 'due-soon' : ''}`;

        return `
            <div class="${cardClasses}">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-1">${this.escapeHtml(task.title)}</h3>
                            ${task.description ? `<p class="text-gray-600 text-sm mb-2">${this.escapeHtml(task.description)}</p>` : ''}
                        </div>
                        <div class="flex items-center space-x-2 ml-4">
                            <button onclick="taskTracker.editTask(${task.id})" class="text-gray-400 hover:text-blue-600 transition-colors">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="taskTracker.deleteTask(${task.id})" class="text-gray-400 hover:text-red-600 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-1">
                                <i class="${statusIcons[task.status]}"></i>
                                <span class="text-gray-700 capitalize">${task.status.replace('_', ' ')}</span>
                            </div>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}">
                                ${task.priority.toUpperCase()}
                            </span>
                        </div>
                        <div class="text-right">
                            <div class="flex items-center space-x-2 text-gray-600">
                                <i class="fas fa-calendar"></i>
                                <span>${this.formatDate(dueDate)}</span>
                            </div>
                            ${isOverdue ? '<div class="text-red-600 text-xs font-medium mt-1">OVERDUE</div>' : ''}
                            ${isDueSoon && !isOverdue ? '<div class="text-orange-600 text-xs font-medium mt-1">DUE SOON</div>' : ''}
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div class="flex items-center space-x-2 text-gray-500 text-sm">
                            <i class="fas fa-mobile-alt"></i>
                            <span>${this.formatPhoneNumber(task.phone_number)}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${task.reminder_sent ? 
                                '<span class="text-xs text-gray-500"><i class="fas fa-bell"></i> Reminder sent</span>' :
                                '<span class="text-xs text-gray-400"><i class="fas fa-bell-slash"></i> No reminder yet</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    openAddTaskModal() {
        this.currentEditingId = null;
        document.getElementById('modalTitle').textContent = 'Add New Task';
        document.getElementById('taskForm').reset();
        this.setDefaultDateTime();
        document.getElementById('taskModal').classList.remove('hidden');
    }

    async editTask(id) {
        try {
            const response = await fetch(`/api/tasks/${id}`);
            if (!response.ok) throw new Error('Failed to load task');
            
            const task = await response.json();
            this.currentEditingId = id;
            
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskPhone').value = task.phone_number;
            
            // Format datetime for input
            const dueDate = new Date(task.due_date);
            const isoString = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('taskDueDate').value = isoString;
            
            document.getElementById('taskModal').classList.remove('hidden');
        } catch (error) {
            console.error('Error loading task for edit:', error);
            this.showNotification('Failed to load task for editing', 'error');
        }
    }

    closeModal() {
        document.getElementById('taskModal').classList.add('hidden');
        this.currentEditingId = null;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim(),
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            due_date: document.getElementById('taskDueDate').value,
            phone_number: document.getElementById('taskPhone').value.trim()
        };

        try {
            const url = this.currentEditingId ? `/api/tasks/${this.currentEditingId}` : '/api/tasks';
            const method = this.currentEditingId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save task');
            }

            this.closeModal();
            this.loadTasks();
            this.showNotification(
                this.currentEditingId ? 'Task updated successfully' : 'Task created successfully',
                'success'
            );
        } catch (error) {
            console.error('Error saving task:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete task');

            this.loadTasks();
            this.showNotification('Task deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showNotification('Failed to delete task', 'error');
        }
    }

    async runManualCheck() {
        const button = document.getElementById('manualCheckBtn');
        const originalContent = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Checking...';
        button.disabled = true;

        try {
            const response = await fetch('/api/scheduler/check', {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to run manual check');

            this.showNotification('Manual check completed', 'success');
            this.loadTasks(); // Refresh tasks to show updated reminder status
        } catch (error) {
            console.error('Error running manual check:', error);
            this.showNotification('Failed to run manual check', 'error');
        } finally {
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
        }
        return phone;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(full)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize the app
const taskTracker = new TaskTracker();
