const SIGNATURE = '\u200B\u200C\u200D';
const SIG_RE = /[\u200B\u200C\u200D]+/g;

/**
 * Clean zero-width signature characters from a string
 * @param {string} str 
 * @returns {string}
 */
function cleanTitle(str) {
  return (str || '').replace(SIG_RE, '').trim();
}

/**
 * Changes a room's name by appending the Extended signature so that
 * the Chrome extension knows it's an Extended server in the lobby list.
 * Works on any room instance wrapping Haxball's headless API (Vanilla or Expanded).
 * 
 * @param {object} room - The room instance (must implement setRoomName)
 * @param {string} newTitle - The new clean title
 * @returns {Promise<void>}
 */
async function changeRoomTitle(room, newTitle) {
  const clean = cleanTitle(newTitle);
  if (!clean) return;
  
  if (typeof room.setRoomName === 'function') {
    await room.setRoomName(clean + SIGNATURE);
  } else {
    throw new Error('Provided room does not support setRoomName');
  }
}

module.exports = {
  SIGNATURE,
  cleanTitle,
  changeRoomTitle
};
