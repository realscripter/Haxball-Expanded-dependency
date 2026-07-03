# ⚽ Haxball Expanded Dependency

To use this library, players must install the Chrome Extension:
👉 **[Haxball Expanded Extension](https://github.com/realscripter/Haxball-expanded-extension)**

---

## What is this?

This library is a clean, zero-configuration headless server wrapper for Haxball. It handles player verification and live title changes out of the box. Anyone joining the room must have the Chrome Extension installed, or they will be kicked instantly. 

For developers of custom room systems, you do not need to write complex verification logic, handle invisible signatures, or modify core game files. Simply import this dependency into your server project.

---

## Enhanced Capabilities

This package unlocks features that are **not possible** with the standard Haxball Headless API.

### 🌟 Server Features (Stand-alone)
*   **Master Server Player Capping (29 limit)**: Haxball's public lobby list automatically filters out or hides rooms that have 30 or more players. This package implements a WebSocket packet interceptor to cap the reported count at 29 when player counts reach 29+. This keeps your room visible in the public lobby at all times, even when 50 players are actively connected and playing.

### 🔌 Extension-Exclusive Features (Only active when players use the Chrome Extension)
*   **Real-Time Room Title Updates**: The standard headless API restricts room names to be fixed permanently at creation time. With this package and the Chrome Extension, calling `room.setTitle("New Title")` dynamically updates the listing in the lobby room list and active player headers instantly for extension users.
*   **Automated Client-Server Authentication**: Standard headless rooms cannot restrict players based on browser extensions. This package uses invisible zero-width signatures to verify clients instantly on connection, kicking unverified players automatically before they can disrupt gameplay.
*   **In-Game Control Settings View**: Extension users get a native Haxball-styled control button in the top right. Clicking it displays server stats, live response ping, and extension validation details.

---

## Quick Start

### 1. Installation

Download this package and install the dependencies:

```bash
npm install
```

### 2. Setup (start_server.js)

Here is all you need to start a secure room:

```javascript
const { ExpandedRoom } = require('./src');

const room = new ExpandedRoom({
  roomName: "Secure Haxball Server",
  playerName: "Host Bot",
  maxPlayers: 10,
  public: true,
  token: "YOUR_HAXBALL_TOKEN",
  apiPort: 3001 // Port queried by the Chrome Extension for live updates
});

room.on('onRoomLink', (link) => {
  console.log(`Server is running! Join here: ${link}`);
});

room.on('onPlayerJoin', (player) => {
  console.log(`${player.name} connected.`);
});

// Start the server
room.start();
```

---

## API Reference

### Methods available on `ExpandedRoom`

Since `ExpandedRoom` wraps the native Haxball Headless API asynchronously, you can call the following methods on your room instance:

*   **`async start()`**: Launches the browser instance and initializes the Haxball headless room.
*   **`async close()`**: Safely closes the browser instance and stops the local HTTP API.
*   **`async setTitle(newTitle)`**: Programmatically updates the room title. Updates the lobby list and in-room header for extension players instantly.
*   **`getTitle()`**: Returns the clean, signature-free room title.
*   **`async sendChat(message, playerId)`**: Sends a chat message. If `playerId` is omitted, it broadcasts to all players.
*   **`async kickPlayer(playerId, reason, ban = false)`**: Kicks or bans a player from the room.
*   **`async setPlayerTeam(playerId, team)`**: Moves a player to a team (`0` = Spectators, `1` = Red, `2` = Blue).
*   **`async setPlayerAdmin(playerId, admin)`**: Toggles admin status (`true` / `false`) for a player.
*   **`async getPlayerList()`**: Returns an array of all active players in the room.
*   **`async getPlayer(playerId)`**: Gets details of a specific player by ID.
*   **`async startGame()`**: Starts the match.
*   **`async stopGame()`**: Stops the match.
*   **`async pauseGame(pause)`**: Pauses (`true`) or unpauses (`false`) the match.
*   **`async setScoreLimit(limit)`**: Sets the score limit to win.
*   **`async setTimeLimit(limit)`**: Sets the time limit (in minutes) for the match.
*   **`async setTeamsLock(locked)`**: Locks (`true`) or unlocks (`false`) team balance.
*   **`async setCustomStadium(stadiumFileContents)`**: Loads a custom map using its raw text file contents.
*   **`async setDefaultStadium(stadiumName)`**: Sets the stadium back to a default map (e.g. `"Classic"`).

---

## Event Handlers

You can listen to all Haxball events via standard EventListeners:

```javascript
room.on('eventName', (...args) => {
  // Handle event
});
```

Supported events:
*   **`'onPlayerJoin'`** `(player)`
*   **`'onPlayerLeave'`** `(player)`
*   **`'onTeamChange'`** `(player, byPlayer)`
*   **`'onPlayerActivity'`** `(player)`
*   **`'onPlayerChat'`** `(player, message)`
*   **`'onPlayerKicked'`** `(player, reason, ban, byPlayer)`
*   **`'onGameStart'`** `(byPlayer)`
*   **`'onGameStop'`** `(byPlayer)`
*   **`'onGamePause'`** `(byPlayer)`
*   **`'onGameUnpause'`** `(byPlayer)`
*   **`'onPlayerAdminChange'`** `(player, byPlayer)`
*   **`'onStadiumAssociation'`** `(stadiumName, byPlayer)`
*   **`'onMatchWin'`** `(scores)`
*   **`'onPositionsReset'`** `()`
*   **`'onPlayerBallKick'`** `(player)`
*   **`'onRoomLink'`** `(link)`
