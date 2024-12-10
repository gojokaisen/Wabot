const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const chalk = require('chalk');
const NodeCache = require('node-cache');
const readline = require('readline');

// Import custom modules
const settings = require('./settings');
const BotUtils = require('./lib/functions');
const DatabaseManager = require('./lib/database');
const CommandHandler = require('./commands/handler');

class WhatsAppBot {
    constructor() {
        this.store = makeInMemoryStore({
            logger: pino().child({
                level: 'silent',
                stream: 'store'
            })
        });

        this.db = new DatabaseManager();
        this.utils = BotUtils;
        this.rl = readline.createInterface({ 
            input: process.stdin, 
            output: process.stdout 
        });
    }

    async initialize() {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const msgRetryCounterCache = new NodeCache();

        // Prompt for phone number
        const phoneNumber = await this.promptPhoneNumber();

        // Create socket connection
        this.sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            browser: Browsers.macOS('Chrome'),
            auth: {
                creds: state.creds,
                keys: state.keys
            },
            generateHighQualityLinkPreview: true,
            msgRetryCounterCache
        });

        // Bind store and setup event listeners
        this.store.bind(this.sock.ev);
        this.setupEventListeners(saveCreds);

        // Initialize command handler
        this.commandHandler = new CommandHandler(this.sock);

        return this.sock;
    }

    async promptPhoneNumber() {
        return new Promise((resolve) => {
            this.rl.question(chalk.bold.green('Enter your WhatsApp phone number (with country code): '), (number) => {
                resolve(number.replace(/[^0-9]/g, ''));
                this.rl.close();
            });
        });
    }

    setupEventListeners(saveCreds) {
        // Connection update listener
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection === 'close') {
                const shouldReconnect = 
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log(chalk.yellow('Connection closed. Reconnecting...'));
                
                if (shouldReconnect) {
                    this.initialize();
                }
            } else if (connection === 'open') {
                console.log(chalk.green('Connected successfully!'));
                console.log(chalk.cyan('Bot is now active and ready.'));
            }

            if (qr) {
                console.log(chalk.red('QR Code generated. Please scan with WhatsApp.'));
            }
        });

        // Credentials update listener
        this.sock.ev.on('creds.update', saveCreds);

        // Messages listener
        this.sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg.message) return;

                // Log user interaction
                const sender = msg.key.remoteJid;
                this.logUserInteraction(sender);

                // Handle commands
                await this.handleCommands(msg);
            } catch (error) {
                console.error('Message processing error:', error);
            }
        });
    }

    async handleCommands(msg) {
        const prefix = settings.PREFIX;
        const body = msg.message.conversation || '';

        if (body.startsWith(prefix)) {
            const { command, args } = this.utils.parseCommandArgs(
                { body }, 
                prefix
            );

            try {
                await this.commandHandler.executeCommand(
                    command, 
                    { 
                        sock: this.sock, 
                        msg, 
                        args, 
                        db: this.db 
                    }
                );
            } catch (error) {
                console.error(`Command execution error: ${error}`);
            }
        }
    }

    logUserInteraction(sender) {
        // Update user interaction in database
        const userData = this.db.getUser(sender) || 
            this.db.createUser(sender);
        
        this.db.updateUser(sender, {
            last_interaction: new Date().toISOString()
        });
    }

    async start() {
        try {
            await this.initialize();
        } catch (error) {
            console.error('Bot initialization error:', error);
        }
    }
}

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// Start the bot
const bot = new WhatsAppBot();
bot.start();
