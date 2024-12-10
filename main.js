const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    jidDecode,
    proto,
    Browsers,
    PHONENUMBER_MCC
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const chalk = require('chalk');
const NodeCache = require('node-cache');
const readline = require('readline');
const PhoneNumber = require('awesome-phonenumber');

const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const msgRetryCounterCache = new NodeCache();

    const usePairingCode = true;
    const phoneNumber = await question(chalk.bold.green('Enter your WhatsApp phone number (with country code, e.g., +2349159895444): '));
    const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');

    if (!Object.keys(PHONENUMBER_MCC).some(v => cleanedNumber.startsWith(v))) {
        console.log(chalk.red('Invalid phone number format. Must start with country code.'));
        rl.close();
        return;
    }

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !usePairingCode,
        browser: Browsers.macOS('Chrome'),
        auth: {
            creds: state.creds,
            keys: state.keys
        },
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache
    });

    store.bind(sock.ev);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, pairingCode } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.yellow('Connection closed. Reconnecting...'));
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log(chalk.green('Connected successfully!'));
            console.log(chalk.cyan('Bot is now active and ready to receive messages.'));
        }

        if (usePairingCode && !sock.authState.creds.registered) {
            if (pairingCode) {
                console.log(chalk.bold.yellow('============================================='));
                console.log(chalk.green('PAIRING CODE GENERATED'));
                console.log(chalk.bold.yellow('============================================='));
                console.log(chalk.cyan('1. Open WhatsApp on your phone'));
                console.log(chalk.cyan('2. Tap "Linked Devices"'));
                console.log(chalk.cyan('3. Tap "Link a device"'));
                console.log(chalk.cyan('4. Select "Paired from computer"'));
                console.log(chalk.bold.yellow('============================================='));
                console.log(chalk.red('PAIRING CODE: ') + chalk.bold.white(pairingCode));
                console.log(chalk.bold.yellow('============================================='));
            }
        }

        if (qr) {
            console.log(chalk.red('QR Code generated. Please scan with WhatsApp.'));
        }
    });

    if (usePairingCode) {
        try {
            const code = await sock.requestPairingCode(cleanedNumber);
        } catch (error) {
            console.error(chalk.red('Error requesting pairing code:'), error);
            rl.close();
            return;
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message) return;

            const messageType = Object.keys(msg.message)[0];
            
            if (messageType === 'conversation') {
                const text = msg.message.conversation;
                const from = msg.key.remoteJid;

                if (text.startsWith('!ping')) {
                    await sock.sendMessage(from, { text: 'Pong!' });
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    return sock;
}

startBot().catch(console.error);

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});