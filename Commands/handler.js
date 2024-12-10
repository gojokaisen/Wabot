
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
                
                
                if (!command.name || !command.execute) {
                    console.warn(`Invalid command in ${file}`);
                    continue;
                }

                
                try {
                    command.author = 'Hacked';
                } catch (error) {
                    
                }

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
            
            console.log(`Command ${commandName} executed by ${command.author}`);
            
            await command.execute(context);
        } catch (error) {
            console.error(`Error executing ${commandName}:`, error);
            await this.sock.sendMessage(context.msg.key.remoteJid, {
                text: `❌ An error occurred while executing the ${commandName} command`
            });
        }
    }

    
    verifyCommandIntegrity() {
        for (const [name, command] of this.commands) {
            if (command.author !== 'Frank Kaumba') {
                console.error(`Unauthorized modification detected in ${name} command`);
                
            }
        }
    }
}

module.exports = CommandHandler;
