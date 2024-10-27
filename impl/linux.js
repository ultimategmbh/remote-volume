import execa from 'execa'

async function amixer(...args) {
	return (await execa('amixer', args)).stdout
}

let defaultDeviceCache = null
const reDefaultDevice = /Simple mixer control '([a-z0-9 -]+)',[0-9]+/i

function parseDefaultDevice(data) {
	const result = reDefaultDevice.exec(data)

	if (result === null) {
		throw new Error('Alsa Mixer Error: failed to parse output')
	}

	return result[1]
}

async function getDefaultDevice() {
	if (defaultDeviceCache) return defaultDeviceCache

	return (defaultDeviceCache = parseDefaultDevice(await amixer()))
}

const reInfo = /[a-z][a-z ]*: Playback [0-9-]+ \[([0-9]+)%\] (?:[[0-9.-]+dB\] )?\[(on|off)\]/i

function parseInfo(data) {
	const result = reInfo.exec(data)

	if (result === null) {
		throw new Error('Alsa Mixer Error: failed to parse output')
	}

	return { volume: parseInt(result[1], 10), muted: result[2] === 'off' }
}

async function getInfo() {
	return parseInfo(await amixer('get', await getDefaultDevice()))
}

export const getVolume = async () => {
	return (await getInfo()).volume
}

export const setVolume = async (val) => {
	await amixer('set', await getDefaultDevice(), val + '%')
}

export const getMuted = async () => {
	return (await getInfo()).muted
}

export const setMuted = async (val) => {
	await amixer('set', await getDefaultDevice(), val ? 'mute' : 'unmute')
}
