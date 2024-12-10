const axios = require('axios');
const fs = require('fs');
const path = require('path');

class BotUtils {
  static async downloadMedia(message) {
    try {
      const buffer = await message.download();
      return buffer;
    } catch (error) {
      console.error('Media download error:', error);
      return null;
    }
  }

  static async fetchJson(url, options = {}) {
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error) {
      console.error('Fetch JSON error:', error);
      return null;
    }
  }

  static generateRandomString(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  static async saveFile(buffer, filename) {
    const dirPath = path.join(__dirname, '..', 'downloads');
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, filename);
    
    try {
      fs.writeFileSync(filePath, buffer);
      return filePath;
    } catch (error) {
      console.error('File save error:', error);
      return null;
    }
  }

  static parseCommandArgs(message, prefix) {
    const args = message.body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    return { command, args };
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

module.exports = BotUtils;
