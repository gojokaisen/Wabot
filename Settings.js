module.exports = {
  OWNER_NUMBER: '265993702468', // Replace with your WhatsApp number
  BOT_NAME: 'WhatsApp Bot',
  PREFIX: '!',
  ADMIN_GROUP_ONLY: false,
  LANGUAGE: 'en',
  
  // API Keys (if needed)
  OPENAI_API_KEY: '',
  
  // Limit settings
  COMMANDS_LIMIT: 10,
  SPAM_WARN_COUNT: 3,
  
  // Feature Toggles
  WELCOME_MESSAGE: true,
  AUTO_READ: true,
  AUTO_TYPING: true,
  
  // Database (placeholder for future implementation)
  DATABASE: {
    type: 'local', // or 'mongodb', 'mysql' etc.
    path: './database'
  },
  
  // Logging
  LOG_LEVEL: 'info',
  
  // Experimental Features
  EXPERIMENTAL_FEATURES: false
};
