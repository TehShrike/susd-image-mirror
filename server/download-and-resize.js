const sanitizeFilename = require('sanitize-filename')
const denodeify = require('then-denodeify')
const download = require('download')
const mkdirp = denodeify(require('mkdirp'))
const pMap = require('p-map')
const pFilter = require('p-filter')
const Jimp = require('jimp')

const http = require('http')
const stat = denodeify(require('fs').stat)
const path = require('path')
const resolve = require('url').resolve


const cropNorth = Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_TOP

module.exports = function makeDownloader({ outputDirectory, urlPrefix, skipIfExists = true, sizes }) {
	// sizes: { identifier, width, height }

	return async function downloadFile(susdPath) {
		const url = resolve(urlPrefix, susdPath)
		console.log(new Date().toString(), 'downloading', url)

		const data = await download(url)

		const resizedImages = await pMap(sizes, async ({ identifier, width, height }) => {
			const imageBuffer = await resize({ data, width, height })

			return {
				identifier,
				imageBuffer
			}
		})

		return resizedImages.reduce((memo, { imageBuffer, identifier }) => {
			memo[identifier] = imageBuffer
			return memo
		}, {})
	}
}

function resize({ data, width, height }) {
	return Jimp.read(data).then(image => {
		const jimpResizedImage = image.cover(width, height, cropNorth)
		const getBuffer = denodeify(jimpResizedImage.getBuffer.bind(jimpResizedImage))

		return getBuffer(Jimp.MIME_JPEG)
	})
}
