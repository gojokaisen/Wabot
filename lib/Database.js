const fs = require('fs');
const path = require('path');

class DatabaseManager {
  constructor(dbPath = './database') {
    this.dbPath = dbPath;
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
  }

  getUserFilePath(userId) {
    return path.join(this.dbPath, `user_${userId}.json`);
  }

  createUser(userId, userData = {}) {
    const filePath = this.getUserFilePath(userId);
    const defaultData = {
      id: userId,
      registered: new Date().toISOString(),
      commands_used: 0,
      last_active: new Date().toISOString(),
      ...userData
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  getUser(userId) {
    const filePath = this.getUserFilePath(userId);
    
    try {
      if (fs.existsSync(filePath)) {
        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  updateUser(userId, updateData) {
    const userData = this.getUser(userId) || this.createUser(userId);
    
    if (!userData) return null;

    const updatedUserData = {
      ...userData,
      ...updateData,
      last_active: new Date().toISOString()
    };

    try {
      const filePath = this.getUserFilePath(userId);
      fs.writeFileSync(filePath, JSON.stringify(updatedUserData, null, 2));
      return updatedUserData;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  incrementCommandCount(userId) {
    const userData = this.getUser(userId);
    if (!userData) return null;

    return this.updateUser(userId, {
      commands_used: (userData.commands_used || 0) + 1
    });
  }

  deleteUser(userId) {
    const filePath = this.getUserFilePath(userId);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  listAllUsers() {
    try {
      const files = fs.readdirSync(this.dbPath)
        .filter(file => file.startsWith('user_') && file.endsWith('.json'));
      
      return files.map(file => {
        const filePath = path.join(this.dbPath, file);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      });
    } catch (error) {
      console.error('Error listing users:', error);
      return [];
    }
  }
}

module.exports = DatabaseManager;
