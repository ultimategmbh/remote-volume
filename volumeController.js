import os from 'os'
import { getDevices, getHostAPIs } from '@capaj/naudiodon'
let impl = null

switch (os.type()) {
	case 'Darwin':
		impl = await import('./impl/darwin.js')
		break
	case 'Linux':
		impl = await import('./impl/linux.js')
		break
	case 'Windows_NT':
		impl = await import('./impl/windows/index.js')
		break
	default:
		throw new Error('Your OS is currently not supported by node-loudness.')
}

export async function getAudioDevice() {
	const devices = getDevices()
	const hostAPIs = getHostAPIs()
	const defaultHostAPI = hostAPIs.defaultHostAPI
	const defaultOutput = hostAPIs.HostAPIs[hostAPIs.defaultHostAPI].defaultOutput
	const outputName = devices[defaultOutput].name
	return outputName
}

export async function setVolume(value) {
	return impl.setVolume(value)
}

export async function getVolume() {
	return impl.getVolume()
}

export async function mute() {
	return impl.setMuted(true)
}

export async function unmute() {
	return impl.setMuted(false)
}

export async function toggleMute() {
	const currentlyMuted = await impl.getMuted()
	return impl.setMuted(!currentlyMuted)
}

export async function isMuted() {
	return impl.getMuted()
}

export async function increaseVolume(amount) {
	const currentVolume = await impl.getVolume()
	const newVolume = Math.min(currentVolume + amount, 100)
	return impl.setVolume(newVolume)
}

export async function decreaseVolume(amount) {
	const currentVolume = await impl.getVolume()
	const newVolume = Math.max(currentVolume - amount, 0)
	return impl.setVolume(newVolume)
}
