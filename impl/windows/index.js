import { execFile } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const executablePath = path.join(
	import.meta.url.split('/').slice(0, -1).join('/'),
	'adjust_get_current_system_volume_vista_plus.exe'
)

const execFileAsync = promisify(execFile)

async function runProgram(...args) {
	const { stdout } = await execFileAsync(executablePath, args)
	return stdout
}

async function getVolumeInfo() {
	const data = await runProgram()
	const args = data.split(' ')

	return {
		volume: parseInt(args[0], 10),
		muted: Boolean(parseInt(args[1], 10)),
	}
}

export const getVolume = async () => {
	return (await getVolumeInfo()).volume
}

export const setVolume = async (val) => {
	await runProgram(String(val))
}

export const getMuted = async () => {
	return (await getVolumeInfo()).muted
}

export const setMuted = async (val) => {
	await runProgram(val ? 'mute' : 'unmute')
}
