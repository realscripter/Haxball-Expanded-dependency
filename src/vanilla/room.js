const puppeteer = require('puppeteer');
const EventEmitter = require('events');

/**
 * VanillaRoom — a thin Node.js wrapper around the Haxball Headless API.
 * Use this as a base class or standalone for a basic room with no extras.
 *
 * Usage:
 *   const { VanillaRoom } = require('haxball-server');
 *   const room = new VanillaRoom({ roomName, playerName, maxPlayers, public, token });
 *   room.on('onPlayerJoin', player => ...);
 *   await room.start();
 */
class VanillaRoom extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.browser = null;
    this.page = null;
  }

  async start() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();

    // Hook WebSocket before Haxball page loads
    await this.page.evaluateOnNewDocument(() => {
      const NativeWebSocket = window.WebSocket;
      window.WebSocket = class extends NativeWebSocket {
        constructor(url, protocols) {
          window.node_log("[WS Connected] " + url);
          super(url, protocols);
        }
        send(data) {
          if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
            const view = new Uint8Array(data.buffer || data);
            // Haxball room details update packet is always 256 bytes starting with type 7
            if (view.length === 256 && view[0] === 7) {
              const nameLen = view[3];
              const playerIdx = 4 + nameLen + 11;
              const realCount = view[playerIdx];
              
              // Cap reported player count at 29 to prevent room from being hidden in lobby lists
              if (realCount >= 29) {
                view[playerIdx] = 29;
              }
            }
          }
          super.send(data);
        }
      };
    });

    // Bridge all Haxball events to Node.js EventEmitter
    const EVENTS = [
      'onPlayerJoin', 'onPlayerLeave', 'onTeamChange', 'onPlayerActivity',
      'onPlayerChat', 'onPlayerKicked', 'onGameStart', 'onGameStop',
      'onGamePause', 'onGameUnpause', 'onPlayerAdminChange', 'onStadiumAssociation',
      'onMatchWin', 'onPositionsReset', 'onPlayerBallKick', 'onRoomLink'
    ];

    for (const event of EVENTS) {
      await this.page.exposeFunction(`node_${event}`, (...args) => this.emit(event, ...args));
    }
    await this.page.exposeFunction('node_log', (msg) => console.log(`[Haxball] ${msg}`));

    await this.page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle2' });

    await this.page.evaluate((config, events) => {
      function init() {
        if (typeof window.HBInit === 'undefined') { setTimeout(init, 100); return; }
        window.node_log('HBInit ready. Creating room...');
        const room = window.HBInit(config);
        window.room = room;

        events.forEach(event => {
          if (event === 'onPlayerChat') {
            room.onPlayerChat = (player, message) => {
              window.node_onPlayerChat(player, message);
              if (typeof window.suppressChat === 'function') {
                return window.suppressChat(message) ? false : undefined;
              }
            };
          } else {
            room[event] = (...args) => window[`node_${event}`](...args);
          }
        });
      }
      init();
    }, this.config, EVENTS);
  }

  // ─── API Methods ─────────────────────────────────────────────────────────────

  async sendChat(message, playerId) {
    await this.page.evaluate((msg, id) => window.room.sendChat(msg, id), message, playerId);
  }

  async setRoomName(name) {
    await this.page.evaluate((n) => {
      if (window.room && window.room.setRoomName) window.room.setRoomName(n);
    }, name);
  }

  async kickPlayer(playerId, reason, ban = false) {
    await this.page.evaluate((id, r, b) => window.room.kickPlayer(id, r, b), playerId, reason, ban);
  }

  async setPlayerTeam(playerId, team) {
    await this.page.evaluate((id, t) => window.room.setPlayerTeam(id, t), playerId, team);
  }

  async setPlayerAdmin(playerId, admin) {
    await this.page.evaluate((id, a) => window.room.setPlayerAdmin(id, a), playerId, admin);
  }

  async getPlayerList() {
    return this.page.evaluate(() => window.room.getPlayerList());
  }

  async getPlayer(playerId) {
    return this.page.evaluate((id) => window.room.getPlayer(id), playerId);
  }

  async startGame() {
    await this.page.evaluate(() => window.room.startGame());
  }

  async stopGame() {
    await this.page.evaluate(() => window.room.stopGame());
  }

  async pauseGame(pause) {
    await this.page.evaluate((p) => window.room.pauseGame(p), pause);
  }

  async setScoreLimit(limit) {
    await this.page.evaluate((l) => window.room.setScoreLimit(l), limit);
  }

  async setTimeLimit(limit) {
    await this.page.evaluate((l) => window.room.setTimeLimit(l), limit);
  }

  async setTeamsLock(locked) {
    await this.page.evaluate((l) => window.room.setTeamsLock(l), locked);
  }

  async setCustomStadium(stadium) {
    await this.page.evaluate((s) => window.room.setCustomStadium(s), stadium);
  }

  async setDefaultStadium(name) {
    await this.page.evaluate((n) => window.room.setDefaultStadium(n), name);
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}

module.exports = VanillaRoom;
