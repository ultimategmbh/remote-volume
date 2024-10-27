const execa = require("execa");

async function osascript(cmd) {
  return (await execa("osascript", ["-e", cmd])).stdout;
}

async function getVolume() {
  return parseInt(
    await osascript("output volume of (get volume settings)"),
    10
  );
}

async function setVolume(val) {
  await osascript("set volume output volume " + val);
}

async function getMuted() {
  return (await osascript("output muted of (get volume settings)")) === "true";
}

async function setMuted(val) {
  await osascript("set volume " + (val ? "with" : "without") + " output muted");
}

// Export the functions
module.exports = {
  getVolume,
  setVolume,
  getMuted,
  setMuted,
};
