const path = require('path')

const gateKeeper = require('gate-keeper')
const keyMaster = require('key-master')

const nodeify = require('then-nodeify')
const denodeify = require('then-denodeify')

const tmpDir = require('os-tmpdir')

const sizes = [
	{ identifier: '1', width: 320, height: 240 },
	{ identifier: '2', width: 640, height: 480 },
]

const createImageDownloader = require('./download-and-resize')

const imageDownloader = createImageDownloader({
	urlPrefix: 'https://www.shutupandsitdown.com/wp-content/uploads/',
	sizes
})

const imageDownloaderCallback = nodeify(imageDownloader)

module.exports = function makeDownloadingPathGetter(downloadQueue) {
	const imagePaths = keyMaster(susdImagePath => {
		const promise = downloadQueue.add(() => imageDownloader(susdImagePath))

		promise.catch(() => imagePaths.delete(susdImagePath))

		return promise
	})

	return function getImageBuffers(susdImagePath) {
		return imagePaths.get(susdImagePath)
	}
}
