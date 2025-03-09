import { Client, GatewayIntentBits, REST, Routes, TextChannel, ThreadChannel, ChannelType } from 'discord.js';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const MAPS_PATH = process.env.MAPS_PATH;
const SCREENSHOTS_PATH = process.env.SCREENSHOTS_PATH!;

const sessions = new Map();

if (!MAPS_PATH) {
  console.error('MAPS_PATH is not defined (ﾉಥ益ಥ)ﾉ');
  process.exit(1);
}

const maps = fs.readFileSync(MAPS_PATH, 'utf8')
.split('\n')
.filter(Boolean)
.map(map => map.trim());

if (maps.length === 0) {
  console.error('no maps found (ﾉಥ益ಥ)ﾉ');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const commands = [
  {
    name: 'surfdetective',
    description: 'start surf detective game'
  }
];

client.once('ready', () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
  
  (async () => {
    try {
      await rest.put(
        Routes.applicationCommands(client.user!.id),
        { body: commands }
      );
      console.log('cmds registered (•ω•)');
    } catch (err) {
      console.error(err);
    }
  })();
  
  console.log('bot ready ヽ(•ω•)ノ');
});

const gameLock = {
  isRunning: false,
  acquire: function() {
    if (this.isRunning) return false;
    this.isRunning = true;
    return true;
  },
  release: function() {
    this.isRunning = false;
  }
};

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== 'surfdetective') return;
    
    try {
      await interaction.deferReply().catch(e => console.error('defer err:', e));
      
      if (!gameLock.acquire()) {
        await interaction.editReply('another game running ಠ_ಠ').catch(e => console.error('edit err:', e));
        return;
      }
      
      const mapName = maps[Math.floor(Math.random() * maps.length)];
      const uniqueDir = `${Date.now()}_${interaction.channelId}`;
      const sessionDir = path.join(SCREENSHOTS_PATH!, uniqueDir);
      
      try {
        await runGame(mapName, uniqueDir);
        
        sessions.set(interaction.channelId, {
          channelId: interaction.channelId,
          mapName,
          clueCount: 0,
          timer: null,
          sessionDir,
          threadId: interaction.channel?.type === ChannelType.PublicThread ? interaction.channelId : null
        });
        
        await interaction.editReply({
          content: 'guess the map (・ω・)',
          files: [path.join(sessionDir, 'clue_1.jpg')]
        }).catch(e => console.error('edit err after game:', e));
        
        scheduleNextClue(interaction.channelId);
      } catch (err: any) {
        gameLock.release();
        await interaction.editReply(`error: ${err.message || 'unknown error'} (╯°□°）╯︵ ┻━┻`).catch(console.error);
      }
    } catch (err) {
      gameLock.release();
      console.error(err);
    }
  }
});

client.on('messageCreate', message => {
  if (message.author.bot) return;
  
  const session = sessions.get(message.channelId);
  if (!session) return;
  
  const guess = normalizeName(message.content);
  const mapName = normalizeName(session.mapName);
  
  if (guess === mapName) {
    message.channel.send(`${message.author} got it! map is ${session.mapName} (•̀ᴗ•́)و`);
    endSession(message.channelId);
  }
});

function normalizeName(name: string): string {
  return name.toLowerCase()
  .replace(/^(surf_|bhop_|de_)/, '')
  .replace(/_(njv|ksf|fix)$/, '');
}

function runGame(mapName: string, uniqueDir: string): Promise<void> {
  const fullDir = path.join(SCREENSHOTS_PATH!, uniqueDir);
  console.log('unique dir:', uniqueDir);
  console.log('full dir:', fullDir);
  
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    const cmd = `/usr/bin/docker exec css_container /game/scripts/screenshot_generator.sh ${mapName} /screenshots/${uniqueDir}`;
    console.log(`running: ${cmd}`);
    exec(cmd, (error, stdout, stderr) => {
      console.log('script output:', stdout);
      if (stderr) console.error('script error:', stderr);
      error ? reject(error) : resolve();
    });
  });
}

function scheduleNextClue(channelId: string): void {
  const session = sessions.get(channelId);
  if (!session) return;
  
  session.timer = setTimeout(async () => {
    session.clueCount++;
    
    if (session.clueCount >= 4) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
          if (channel.type === ChannelType.GuildText) {
            await (channel as TextChannel).send(`time's up! map was ${session.mapName} (´-ε-｀)`);
          } else if (channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread) {
            await (channel as ThreadChannel).send(`time's up! map was ${session.mapName} (´-ε-｀)`);
          }
        }
      } catch (err) {
        console.error('failed to send timeout msg:', err);
      }
      endSession(channelId);
      return;
    }
    
    const clueNumber = session.clueCount + 1;
    const screenshot = path.join(session.sessionDir, `clue_${clueNumber}.jpg`);
    
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel) {
        if (channel.type === ChannelType.GuildText) {
          await (channel as TextChannel).send({
            content: `clue ${clueNumber}/5:`,
            files: [screenshot]
          });
        } else if (channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread) {
          await (channel as ThreadChannel).send({
            content: `clue ${clueNumber}/5:`,
            files: [screenshot]
          });
        }
      }
    } catch (err) {
      console.error('failed to send clue:', err);
    }
    
    scheduleNextClue(channelId);
  }, 30000);
}

function endSession(channelId: string): void {
  const session = sessions.get(channelId);
  if (session?.timer) clearTimeout(session.timer);
  sessions.delete(channelId);
  gameLock.release();
}

client.login(process.env.DISCORD_TOKEN);