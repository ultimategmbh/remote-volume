import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron'
import { WebSocketServer } from 'ws'
import path from 'path'
import os from 'os'
import Store from 'electron-store'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import AutoLaunch from 'electron-auto-launch'
import log from 'electron-log'
import {
	setVolume,
	getVolume,
	mute,
	unmute,
	toggleMute,
	isMuted,
	increaseVolume,
	decreaseVolume,
} from './volumeController.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

log.transports.file.file = path.join(app.getPath('userData'), 'logs/main.log')

log.info('App is starting...')

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
	log.info('Another instance of the app is already running. Exiting.')
	app.quit()
} else {
	let wss
	const store = new Store()
	const currentVersion = '1.0.0'

	let config = store.get('settings') || {
		websocket: { port: 2501 },
		runOnStartup: false,
		polling: { enabled: false, interval: 1000 },
		version: currentVersion,
	}

	if (config.version !== currentVersion) {
		log.info(`Updating configuration version to ${currentVersion}`)
		config.version = currentVersion
		store.set('settings', config)
	}

	const appAutoLauncher = new AutoLaunch({
		name: 'RemoteVolume',
		path: app.getPath('exe'),
	})

	const setAutoLaunch = async (enabled) => {
		log.info(`Auto-start setting changed. Attempting to ${enabled ? 'enable' : 'disable'} auto-launch.`)

		try {
			if (process.platform === 'linux') {
				const appAutoLauncher = new AutoLaunch({
					name: 'RemoteVolume',
					path: app.getPath('exe'),
				})

				if (enabled) {
					await appAutoLauncher.enable()
					log.info('Auto-launch enabled on Linux.')
				} else {
					await appAutoLauncher.disable()
					log.info('Auto-launch disabled on Linux.')
				}
			} else {
				app.setLoginItemSettings({
					openAtLogin: enabled,
					openAsHidden: true,
				})
				log.info(`Auto-launch ${enabled ? 'enabled' : 'disabled'} on macOS.`)
			}
		} catch (error) {
			log.error('Failed to change auto-launch setting:', error)
		}
	}

	let mainWindow
	let tray

	function createWindow() {
		mainWindow = new BrowserWindow({
			width: 400,
			height: 520,
			resizable: false,
			webPreferences: {
				contextIsolation: true,
				enableRemoteModule: false,
				preload: path.join(__dirname, 'renderer.js'),
			},
			show: true,
			icon: path.join(__dirname, 'icon.ico'),
		})

		mainWindow.loadFile('index.html')

		mainWindow.setMenu(null)

		mainWindow.on('close', (event) => {
			if (!app.isQuiting) {
				event.preventDefault()
				mainWindow.hide()
			}
		})

		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				createWindow()
			} else {
				mainWindow.show()
			}
		})
	}

	app.on('ready', async () => {
		createWindow()
		if (os.platform() === 'darwin') {
			app.dock.hide()
		}
		mainWindow.webContents.on('did-finish-load', () => {
			mainWindow.webContents.send('load-config', config)
		})

		tray = new Tray(path.join(__dirname, 'menuicon.png'))
		const contextMenu = Menu.buildFromTemplate([
			{
				label: 'Show App',
				click: () => {
					mainWindow.show()
				},
			},
			{
				label: 'Quit',
				click: () => {
					app.isQuiting = true
					app.quit()
				},
			},
		])

		tray.setToolTip('Remote Volume')
		tray.setContextMenu(contextMenu)
		await setAutoLaunch(config.runOnStartup)
		startWebSocketServer()
		startMonitoring()

		ipcMain.on('save-config', async (event, newConfig) => {
			config = newConfig
			store.set('settings', config)
			mainWindow.webContents.send('load-config', config)
			event.reply('config-saved', 'Configuration saved successfully!')
			await setAutoLaunch(config.runOnStartup)

			if (wss) {
				log.info('Closing existing WebSocket server to apply new configuration.')
				wss.clients.forEach((client) => {
					client.close()
				})
				wss.close(() => {
					log.info('WebSocket server closed. Restarting...')
					startWebSocketServer()
				})
			} else {
				startWebSocketServer()
			}

			startMonitoring()
		})
	})

	let lastVolume = null
	let lastMuteState = null
	let pollingInterval = null

	function startMonitoring() {
		log.info('Starting volume/mute state monitoring.')
		if (pollingInterval) clearInterval(pollingInterval)

		if (config.polling.enabled) {
			pollingInterval = setInterval(async () => {
				try {
					const currentVolume = await getVolume()
					const currentMuteState = await isMuted()

					if (currentVolume !== lastVolume) {
						lastVolume = currentVolume
						broadcastState({ volume: currentVolume })
					}

					if (currentMuteState !== lastMuteState) {
						lastMuteState = currentMuteState
						broadcastState({ muted: currentMuteState })
					}
				} catch (error) {
					log.error('Error monitoring volume/mute state:', error)
				}
			}, config.polling.interval)
		}
	}

	function broadcastState(state) {
		if (wss && wss.clients) {
			wss.clients.forEach((client) => {
				if (client.readyState === client.OPEN) {
					client.send(JSON.stringify(state))
				}
			})
		}
	}

	function startWebSocketServer() {
		const port = config.websocket.port

		if (typeof port !== 'number' || port <= 0) {
			log.error('Invalid port specified in the configuration.')
			return
		}

		wss = new WebSocketServer({ port })
		log.info(`WebSocket server started on ws://localhost:${port}`)

		wss.on('connection', async (ws) => {
			const currentVolume = await getVolume()
			const currentMuteState = await isMuted()
			ws.send(JSON.stringify({ volume: currentVolume, muted: currentMuteState }))

			ws.on('message', async (message) => {
				try {
					const { action, value } = JSON.parse(message)
					let response

					const actions = {
						setVolume: async () => {
							if (typeof value !== 'number' || value < 0 || value > 100) {
								log.error('Invalid value for setVolume:', value)
								return { error: 'Invalid value for setVolume. Must be between 0 and 100.' }
							}
							return setVolume(value)
						},
						getState: async () => {
							const currentVolume = await getVolume()
							const currentMuteState = await isMuted()
							return { volume: currentVolume, muted: currentMuteState }
						},
						increaseVolume: async () => {
							if (typeof value !== 'number' || value < 1 || value > 99) {
								log.error('Invalid value for increaseVolume:', value)
								return { error: 'Invalid value for increaseVolume. Must be between 1 and 99.' }
							}
							return increaseVolume(value)
						},
						decreaseVolume: async () => {
							if (typeof value !== 'number' || value < 1 || value > 99) {
								log.error('Invalid value for decreaseVolume:', value)
								return { error: 'Invalid value for decreaseVolume. Must be between 1 and 99.' }
							}
							return decreaseVolume(value)
						},
						mute: () => mute(),
						unmute: () => unmute(),
						toggleMute: () => toggleMute(),
					}

					if (actions[action]) {
						response = await actions[action]()

						if (config.polling.enabled) {
							if (response?.error) {
								ws.send(JSON.stringify({ action, response }))
							}
						} else {
							if (action === 'getState') {
								ws.send(JSON.stringify(response))
							} else {
								const currentVolume = await getVolume()
								const currentMuteState = await isMuted()
								ws.send(JSON.stringify({ volume: currentVolume, muted: currentMuteState }))
							}
						}
					} else {
						response = { error: 'Invalid action' }
						ws.send(JSON.stringify({ action, response }))
						log.error('Invalid action received from client.')
					}
				} catch (error) {
					log.error('Error processing message from client:', error)
					ws.send(JSON.stringify({ error: 'Failed to process message' }))
				}
			})
		})

		startMonitoring()

		wss.on('error', (error) => {
			log.error('WebSocket server error:', error)
		})
	}

	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})
}
