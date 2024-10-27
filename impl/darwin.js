import execa from 'execa' // Use import instead of require

async function osascript(cmd) {
	return (await execa('osascript', ['-e', cmd])).stdout
}

export async function getVolume() {
	return parseInt(await osascript('output volume of (get volume settings)'), 10)
}

export async function setVolume(val) {
	await osascript('set volume output volume ' + val)
}

export async function getMuted() {
	return (await osascript('output muted of (get volume settings)')) === 'true'
}

export async function setMuted(val) {
	await osascript('set volume ' + (val ? 'with' : 'without') + ' output muted')
}

// Export functions
export default {
	getVolume,
	setVolume,
	getMuted,
	setMuted,
}
