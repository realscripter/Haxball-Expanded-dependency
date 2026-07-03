// This script contains helper functions and extensions injected into the Haxball room browser context.
window.haxballExtension = {
  log: function (msg) {
    if (window.node_log) {
      window.node_log(msg);
    } else {
      console.log(msg);
    }
  },

  // We can add client-side event modifiers or utility functions here
  ping: function() {
    this.log("Extension ping received.");
    return "pong";
  }
};
