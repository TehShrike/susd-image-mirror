const path = require('path')

const keyMaster = require('key-master')

const tmpDir = require('os-tmpdir')

const sizes = [
	{ identifier: '1', width: 320, height: 240 },
	{ identifier: '2', width: 640, height: 480 },
]

const createImageDownloader = require('./download-and-resize')

const imagePath = path.join(tmpDir(), 'susd-images')
console.log('Downloading to', imagePath)

const imageDownloader = createImageDownloader({
	outputDirectory: imagePath,
	urlPrefix: 'https://www.shutupandsitdown.com/wp-content/uploads/',
	sizes,
})

module.exports = function makeDownloadingPathGetter(downloadQueue) {
	const imagePaths = keyMaster(susdImagePath => {
		const promise = downloadQueue.add(() => imageDownloader(susdImagePath))

		promise.catch(() => imagePaths.delete(susdImagePath))

		return promise
	})

	return function getImagePath(susdImagePath) {
		return imagePaths.get(susdImagePath)
	}
}
