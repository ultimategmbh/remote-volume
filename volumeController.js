const os = require("os");
let impl = null;

switch (os.type()) {
  case "Darwin":
    impl = require("./impl/darwin");
    break;
  case "Linux":
    impl = require("./impl/linux");
    break;
  case "Windows_NT":
    impl = require("./impl/windows");
    break;
  default:
    throw new Error("Your OS is currently not supported by node-loudness.");
}

async function setVolume(value) {
  return impl.setVolume(value);
}

async function getVolume() {
  return impl.getVolume();
}

async function mute() {
  return impl.setMuted(true);
}

async function unmute() {
  return impl.setMuted(false);
}

async function toggleMute() {
  // Logic to toggle mute based on the current state.
  return impl.setMuted(false);
}

async function isMuted() {
  return impl.getMuted();
}

module.exports = { setVolume, getVolume, mute, unmute, toggleMute, isMuted };
