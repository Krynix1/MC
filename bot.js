const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock, GoalXZ } = require('mineflayer-pathfinder').goals;

const config = require('./settings.json');
const express = require('express');
const serverx = express();
const loggers = require('./logging.js');
const logger = loggers.logger;
const app = express();
const http = require('http'); // Import the http library
const server = http.createServer(app); // Create the server
serverx.all('/', (req, res) => {
    res.send('<h2>Server is ready!</h2>');
});

module.exports = () => {
    serverx.listen(4000, () => {
        console.log('Server Ready.');
    });
    return true;
}
app.get('/', (req, res) => {
  const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  res.send('Your Bot Is Ready! Subscribe My Youtube: <a href="https://youtube.com/@H2N_OFFICIAL?si=UOLwjqUv-C1mWkn4">H2N OFFICIAL</a><br>Link Web For Uptime: <a href="' + currentUrl + '">' + currentUrl + '</a>');
}); 
app.listen(3000);
function createBot() {
   const bot = mineflayer.createBot({
      username: config['bot-account']['username'],
      password: config['bot-account']['password'],
      auth: config['bot-account']['type'],
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version,
   });
   bot.loadPlugin(pathfinder);
   const mcData = require('minecraft-data')(bot.version);
   const defaultMove = new Movements(bot, mcData);
   bot.settings.colorsEnabled = false;
   bot.pathfinder.setMovements(defaultMove);

   bot.once('spawn', () => {
      logger.info("Bot joined to the server");

      if (config.utils['auto-auth'].enabled) {
         logger.info('Started auto-auth module');

         let password = config.utils['auto-auth'].password;
         bot.chat(`/login ${password}`);
         logger.info(`Authentication commands executed`);
      }

      if (config.utils['chat-messages'].enabled) {
         logger.info('Started chat-messages module');

         let messages = config.utils['chat-messages']['messages'];

         if (config.utils['chat-messages'].repeat) {
            let delay = config.utils['chat-messages']['repeat-delay'];
            let i = 0;

            setInterval(() => {
               bot.chat(`${messages[i]}`);

               if (i + 1 === messages.length) {
                  i = 0;
               } else i++;
            }, delay * 1000);
         } else {
            messages.forEach((msg) => {
               bot.chat(msg);
            });
         }
      }

      const pos = config.position;

      if (config.position.enabled) {
         logger.info(
             `Starting moving to target location (${pos.x}, ${pos.y}, ${pos.z})`
         );
         bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
      }


   });

   bot.on('chat', (username, message) => {
      if (config.utils['chat-log']) {
         logger.info(`<${username}> ${message}`);
      }
   });

   bot.on('goal_reached', () => {
      if(config.position.enabled) {
         logger.info(
             `Bot arrived to target location. ${bot.entity.position}`
         );
      }
   });

   bot.on('death', () => {
      logger.warn(
         `Bot has been died and was respawned at ${bot.entity.position}`
      );
   });

   if (config.utils['auto-reconnect']) {
      bot.on('end', () => {
         setTimeout(() => {
            createBot();
         }, config.utils['auto-reconnect-delay']);
      });
   }

   bot.on('kicked', (reason) => {
      let reasonText = JSON.parse(reason).text;
      if(reasonText === '') {
         reasonText = JSON.parse(reason).extra[0].text
      }
      reasonText = reasonText.replace(/§./g, '');

      logger.warn(`Bot was kicked from the server. Reason: ${reasonText}`)
   }
   );

   bot.on('error', (err) =>
      logger.error(`${err.message}`)
   );
}
function circleWalk(bot, radius) {
   // Make bot walk in square with center in bot's  wthout stopping
    return new Promise(() => {
        const pos = bot.entity.position;
        const x = pos.x;
        const y = pos.y;
        const z = pos.z;

        const points = [
            [x + radius, y, z],
            [x, y, z + radius],
            [x - radius, y, z],
            [x, y, z - radius],
        ];

        let i = 0;
        setInterval(() => {
             if(i === points.length) i = 0;
             bot.pathfinder.setGoal(new GoalXZ(points[i][0], points[i][2]));
             i++;
        }, 1000);
    });
}

createBot();
