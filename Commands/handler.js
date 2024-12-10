
const fs = require('fs');
const path = require('path');

class CommandHandler {
    constructor(sock) {
        this.sock = sock;
        this.commands = new Map();
        this.loadCommands();
    }

    loadCommands() {
        const commandFolders = ['general', 'utility', 'admin'];

        commandFolders.forEach(folder => {
            const commandPath = path.join(__dirname, folder);
            const commandFiles = fs.readdirSync(commandPath)
                .filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(path.join(commandPath, file));
                this.commands.set(command.name, command);
            }
        });
    }

    async executeCommand(commandName, context) {
        const command = this.commands.get(commandName);
        
        if (!command) {
            
            return;
        }

        try {
            await command.execute(context);
        } catch (error) {
            console.error(`Error executing ${commandName}:`, error);
            await this.sock.sendMessage(context.msg.key.remoteJid, {
                text: `❌ An error occurred while executing the ${commandName} command`
            });
        }
    }
}

module.exports = CommandHandler;
