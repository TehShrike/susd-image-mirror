const download = require('download')
const flatten = require('just-flatten')
const pageParser = require('susd-page-parser')

async function downloadImagePathsFromSusdPage(url) {
	const html = await download(url)

	return pageParser(html).map(({ imageUrl }) => imageUrl)
}

module.exports = function preload({ queue, getImage }) {
	Promise.all([
		downloadImagePathsFromSusdPage('https://www.shutupandsitdown.com/videos-page/'),
		downloadImagePathsFromSusdPage('https://www.shutupandsitdown.com/games-page/'),
	]).then(flatten).then(images => {
		function downloadAnother() {
			const nextImage = images.shift()
			queue.add(() => getImage(nextImage))
			if (images.length > 0) {
				queue.onEmpty().then(downloadAnother)
			}
		}

		downloadAnother()
	})
}