import { notarize } from 'electron-notarize'

export default async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context
	if (electronPlatformName !== 'darwin') {
		return
	}

	const appName = context.packager.appInfo.productFilename

	return await notarize({
		tool: 'notarytool',
		appBundleId: 'uts.remotevolume.app',
		teamId: process.env.APPLE_TEAM_ID,
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLEID,
		appleIdPassword: process.env.APPLEIDPASS,
	})
}
