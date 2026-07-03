// ==UserScript==
// @name         Haxball Server Extension Handshake
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically sends a handshake packet to Haxball servers running the Expanded library
// @author       Antigravity
// @match        https://www.haxball.com/play*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  console.log("[Haxball Extension] Extension active. Waiting to join game...");

  // Send handshake message automatically
  function sendHandshake() {
    // Try different selectors for Haxball chat input
    const chatInput = document.querySelector('[data-hook="input"]') ||
                      document.querySelector('.chat-input-container input') ||
                      document.querySelector('input[type="text"]');

    if (chatInput) {
      console.log("[Haxball Extension] Chat input found. Sending handshake...");
      
      // Set the message
      chatInput.value = "_ext_handshake_";
      
      // Trigger change/input events for framework listeners
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      chatInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Simulate pressing Enter key
      const enterDown = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13 });
      const enterUp = new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13 });
      
      chatInput.dispatchEvent(enterDown);
      chatInput.dispatchEvent(enterUp);
      return true;
    }
    return false;
  }

  // Poll for the chat input element periodically when inside a room
  const interval = setInterval(() => {
    // Look for game layout element indicating we are inside the room lobby/game
    const inGame = document.querySelector('.game-view') || document.querySelector('.room-view') || document.querySelector('[data-hook="game-wrapper"]');
    if (inGame) {
      const success = sendHandshake();
      if (success) {
        clearInterval(interval);
        console.log("[Haxball Extension] Handshake sent!");
      }
    }
  }, 1000);
})();
