import { notarize } from '@electron/notarize'

export default async function notarizing(context) {
	const appName = context.packager.appInfo.productFilename
	const { electronPlatformName, appOutDir } = context

	// We skip notarization if the process is not running on MacOS and
	// if the environment variable SKIP_NOTARIZE is set to `true`
	// This is useful for local testing where notarization is useless
	if (electronPlatformName !== 'darwin' || process.env.SKIP_NOTARIZE === 'true') {
		console.log(`  • Skipping notarization`)
		return
	}

	// THIS MUST BE THE SAME AS THE `appId` property
	// in your electron builder configuration
	const appId = 'com.utsgmbh.volumeremote'

	const appPath = `${appOutDir}/${appName}.app`
	const { APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID } = process.env
	console.log(`  • Notarizing ${appPath}`)

	return await notarize({
		tool: 'notarytool',
		appBundleId: appId,
		appPath,
		appleId: APPLE_ID,
		appleIdPassword: APPLE_ID_PASSWORD,
		teamId: APPLE_TEAM_ID,
	})
}
