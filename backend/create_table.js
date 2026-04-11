const pool = require('./config/db');

async function create() {
  try {
    const sql = `
    CREATE TABLE IF NOT EXISTS scheduled_notifications (
      sched_notif_id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'system',
      target_type ENUM('all', 'role', 'user_ids') NOT NULL,
      target_value VARCHAR(255),
      scheduled_at DATETIME NOT NULL,
      status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
      created_by INT UNSIGNED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(user_id),
      INDEX idx_scheduled_at (scheduled_at),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await pool.query(sql);
    console.log('✅ scheduled_notifications table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

create();
