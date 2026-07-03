const VanillaRoom = require('./vanilla/room');
const ExpandedRoom = require('./expanded/room');
const { cleanTitle, changeRoomTitle, SIGNATURE } = require('./title');

module.exports = {
  VanillaRoom,
  ExpandedRoom,
  cleanTitle,
  changeRoomTitle,
  SIGNATURE
};

