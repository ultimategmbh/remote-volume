import { notarize } from 'electron-notarize'

export default async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context
	if (electronPlatformName !== 'darwin') {
		return
	}

	const appName = context.packager.appInfo.productFilename

	return await notarize({
		appBundleId: 'uts.remotevolume.app',
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLEID,
		appleIdPassword: process.env.APPLEIDPASS,
	})
}
