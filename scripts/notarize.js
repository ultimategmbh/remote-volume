import { notarize } from '@electron/notarize'

export default async function notarizing(context) {
	const appName = context.packager.appInfo.productFilename
	const { electronPlatformName, appOutDir } = context

	if (electronPlatformName !== 'darwin') {
		console.log('Skipping notarization')
		return
	}

	const appId = 'com.utsgmbh.volumeremote'

	const appPath = `${appOutDir}/${appName}.app`
	const { APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID } = process.env
	console.log('Starting notarization!')

	return await notarize({
		tool: 'notarytool',
		appBundleId: appId,
		appPath,
		appleId: APPLE_ID,
		appleIdPassword: APPLE_ID_PASSWORD,
		teamId: APPLE_TEAM_ID,
	})
}
