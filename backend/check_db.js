const pool = require('./config/db');

async function check() {
  try {
    // Check all tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('📋 All Tables:');
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log('  -', tableName);
    });
    
    // Check notifications table structure
    try {
      const [notifCols] = await pool.query('DESCRIBE notifications');
      console.log('\n📌 notifications columns:');
      notifCols.forEach(col => console.log('  -', col.Field));
    } catch (e) {
      console.log('\n❌ notifications table not found');
    }
    
    // Check wallet_transactions
    try {
      const [walletCols] = await pool.query('DESCRIBE wallet_transactions');
      console.log('\n💰 wallet_transactions columns:');
      walletCols.forEach(col => console.log('  -', col.Field));
    } catch (e) {
      console.log('\n❌ wallet_transactions table not found');
    }
    
    // Check scheduled_notifications
    try {
      const [schedCols] = await pool.query('DESCRIBE scheduled_notifications');
      console.log('\n⏰ scheduled_notifications columns:');
      schedCols.forEach(col => console.log('  -', col.Field));
    } catch (e) {
      console.log('\n❌ scheduled_notifications table not found - NEED TO CREATE');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
