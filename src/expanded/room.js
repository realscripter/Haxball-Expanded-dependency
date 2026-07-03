const VanillaRoom = require('../vanilla/room');
const path = require('path');
const http = require('http');
const { SIGNATURE, cleanTitle } = require('../title');

/**
 * ExpandedRoom — extends VanillaRoom with:
 *  - Chrome Extension verification (instant kick without extension)
 *  - Live room title management via setTitle()
 *  - HTTP API server so the Chrome extension can query the current title
 *    from the room list lobby without joining (GET http://localhost:{apiPort}/)
 *
 * Usage:
 *   const { ExpandedRoom } = require('./src');
 *   const room = new ExpandedRoom({ roomName, playerName, maxPlayers, public, token, apiPort });
 *   room.on('onPlayerJoin', player => ...);
 *   await room.start();
 *   await room.setTitle('New Title');
 *   console.log(room.getTitle()); // "New Title"
 *
 * HTTP API (queried by the Chrome extension):
 *   GET http://localhost:3001/  →  { title: "...", version: "0.12" }
 *   Default port: 3001. Override with config.apiPort.
 */
class ExpandedRoom extends VanillaRoom {
  constructor(config) {
    const baseConfig = { ...config };
    // Append invisible signature to room name so lobby shows "Extended: Yes"
    if (baseConfig.roomName && !baseConfig.roomName.includes(SIGNATURE)) {
      baseConfig.roomName += SIGNATURE;
    }

    super(baseConfig);

    this.currentTitle = cleanTitle(config.roomName || 'Haxball Room');
    this._apiPort = config.apiPort || 3001;
    this._apiServer = null;

    // Instant verification on join
    this.on('onPlayerJoin', async (player) => {
      if (!player.name.endsWith(SIGNATURE)) {
        console.log(`[ExpandedRoom] Unverified: "${player.name}" — kicking.`);
        try {
          await this.kickPlayer(player.id, 'Please install the Haxball Extended Chrome Extension to join!', false);
        } catch (err) {
          console.error('[ExpandedRoom] Kick error:', err);
        }
        return;
      }

      const cleanName = cleanTitle(player.name);
      console.log(`[ExpandedRoom] Verified: "${cleanName}"`);

      // Sync current title to new player after they load in
      setTimeout(async () => {
        try {
          await this.sendChat(`_ext_title_change_${this.currentTitle}`, player.id);
        } catch (err) {
          console.error('[ExpandedRoom] Title sync error:', err);
        }
      }, 1500);
    });
  }

  async start() {
    await super.start();
    await this._injectExtensionScript();
    this._startApiServer();
  }

  async _injectExtensionScript() {
    await this.page.addScriptTag({
      path: path.join(__dirname, '../extension/ext.js')
    });
  }

  /**
   * _startApiServer — starts a lightweight HTTP server that the Chrome extension
   * queries from the room list lobby to get the current room title in real time.
   *
   * Endpoint: GET http://localhost:{apiPort}/
   * Response: { title: "...", version: "0.12" }
   */
  _startApiServer() {
    this._apiServer = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);

      let playerCount = 0;
      try {
        const list = await this.getPlayerList();
        playerCount = list ? list.length : 0;
      } catch (err) {
        // Fallback
      }

      res.end(JSON.stringify({
        title: this.currentTitle,
        version: '0.13',
        players: playerCount,
        maxPlayers: this.config.maxPlayers || 50
      }));
    });

    this._apiServer.listen(this._apiPort, '127.0.0.1', () => {
      console.log(`[ExpandedRoom] HTTP API listening on http://localhost:${this._apiPort}/`);
      console.log(`[ExpandedRoom] Chrome extension will query this for live room titles.`);
    });

    this._apiServer.on('error', (err) => {
      console.error(`[ExpandedRoom] HTTP API error: ${err.message}`);
    });
  }

  /**
   * getTitle() — returns the current clean room title.
   */
  getTitle() {
    return this.currentTitle;
  }

  /**
   * setTitle(newTitle) — live title update:
   * 1. Updates this.currentTitle (HTTP API immediately returns the new title)
   * 2. Broadcasts _ext_title_change_ to all players in the room (in-room header + tab title)
   *
   * NOTE: Haxball's headless API does not support updating the public room list name
   * after creation. The extension instead queries the HTTP API directly from the lobby.
   */
  async setTitle(newTitle) {
    const clean = cleanTitle(newTitle);
    if (!clean) return;

    console.log(`[ExpandedRoom] Title: "${this.currentTitle}" → "${clean}"`);
    this.currentTitle = clean;

    // Broadcast live update to all players currently in the room
    await this.sendChat(`_ext_title_change_${clean}`);
  }

  async close() {
    if (this._apiServer) {
      this._apiServer.close();
      this._apiServer = null;
    }
    await super.close();
  }
}

module.exports = ExpandedRoom;
