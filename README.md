# Task Tracker with SMS Reminders

A modern task management application that sends SMS notifications when tasks are due. Built with Node.js, Express, SQLite, and Twilio.

## Features

- ✅ Create, edit, and delete tasks with due dates
- 📱 SMS notifications when tasks are due (via Twilio)
- 🎯 Priority levels (High, Medium, Low)
- 📊 Task status tracking (Pending, In Progress, Completed)
- ⏰ Automatic checking every 15 minutes for due tasks
- 🌐 Modern web interface with responsive design
- 📝 Task filtering and sorting
- 📱 Phone number validation and formatting

## Screenshots

The app includes a beautiful, modern UI with:
- Dashboard with task statistics
- Task cards with priority indicators
- Modal forms for creating/editing tasks
- Real-time notifications
- Responsive design for mobile and desktop

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Twilio account (for SMS functionality)

## Installation

1. **Clone or download the project:**
   ```bash
   # If you have the files, ensure you're in the project directory
   cd tasktracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your actual values
   ```

4. **Configure your `.env` file:**
   ```env
   # Twilio Configuration for SMS
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database
   DB_PATH=./database/tasks.db
   ```

5. **Initialize the database:**
   ```bash
   npm run migrate
   ```

6. **Start the application:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev

   # Production mode
   npm start
   ```

7. **Access the application:**
   Open your browser and go to: `http://localhost:3000`

## Twilio Setup

To enable SMS notifications, you'll need a Twilio account:

1. **Sign up for Twilio:**
   - Go to [twilio.com](https://www.twilio.com)
   - Create a free account

2. **Get your credentials:**
   - Account SID: Found in your Twilio Console dashboard
   - Auth Token: Found in your Twilio Console dashboard
   - Phone Number: Purchase a phone number from Twilio

3. **Configure phone numbers:**
   - Phone numbers must include country code (e.g., +1234567890)
   - For US numbers, use +1 prefix
   - For other countries, use the appropriate country code

## Usage

### Creating Tasks

1. Click "Add Task" button
2. Fill in the form:
   - **Title**: Brief description of the task
   - **Description**: Optional detailed description
   - **Priority**: High, Medium, or Low
   - **Status**: Pending, In Progress, or Completed
   - **Due Date**: When the task should be completed
   - **Phone Number**: Where to send SMS reminders (include country code)

### SMS Notifications

- The system checks for due tasks every 15 minutes
- SMS reminders are sent for tasks due within 1 hour
- Only one reminder is sent per task
- Reminders include task details and urgency information

### Manual Check

Use the "Check Now" button to manually trigger a check for due tasks.

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Scheduler
- `GET /api/scheduler/status` - Get scheduler status
- `POST /api/scheduler/check` - Run manual check for due tasks

### Health Check
- `GET /api/health` - Application health status

## Database Schema

### Tasks Table
- `id` - Auto-incrementing primary key
- `title` - Task title (required)
- `description` - Optional task description
- `due_date` - When the task is due (required)
- `priority` - low/medium/high (default: medium)
- `status` - pending/in_progress/completed (default: pending)
- `phone_number` - SMS recipient (required)
- `reminder_sent` - Boolean flag for SMS status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Notification Log Table
- `id` - Auto-incrementing primary key
- `task_id` - Foreign key to tasks table
- `phone_number` - SMS recipient
- `message` - SMS content
- `status` - pending/sent/failed
- `sent_at` - When SMS was sent
- `error_message` - Error details if failed
- `created_at` - Log entry timestamp

## Development Mode

When Twilio credentials are not configured, the app runs in simulation mode:
- SMS messages are logged to console instead of being sent
- All other functionality works normally
- Perfect for development and testing

## Production Deployment

1. **Set environment to production:**
   ```env
   NODE_ENV=production
   ```

2. **Use a process manager:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "task-tracker"
   ```

3. **Set up reverse proxy (nginx example):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Troubleshooting

### Common Issues

1. **Database file not found:**
   ```bash
   npm run migrate
   ```

2. **SMS not sending:**
   - Check Twilio credentials in `.env`
   - Verify phone number format includes country code
   - Check Twilio account balance

3. **Port already in use:**
   - Change PORT in `.env` file
   - Or kill the process using the port

4. **Dependencies not installing:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Logs

- Application logs: Check console output
- SMS delivery: Check notification_log table in database
- Twilio logs: Available in Twilio Console

## Security Considerations

- Keep your `.env` file secure and never commit it to version control
- Use strong Twilio credentials
- Consider rate limiting for production use
- Validate and sanitize all user inputs
- Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Check Twilio documentation for SMS issues
