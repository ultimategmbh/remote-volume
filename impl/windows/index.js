import { execFile } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const executablePath = join(__dirname, 'adjust_get_current_system_volume_vista_plus.exe')
const execFilePromisified = promisify(execFile)

async function runProgram(...args) {
	const { stdout } = await execFilePromisified(executablePath, args)
	return stdout
}

async function getVolumeInfo() {
	const data = await runProgram()
	const args = data.split(' ')

	return { volume: parseInt(args[0], 10), muted: Boolean(parseInt(args[1], 10)) }
}

export async function getVolume() {
	return (await getVolumeInfo()).volume
}

export async function setVolume(val) {
	await runProgram(String(val))
}

export async function getMuted() {
	return (await getVolumeInfo()).muted
}

export async function setMuted(val) {
	await runProgram(val ? 'mute' : 'unmute')
}
