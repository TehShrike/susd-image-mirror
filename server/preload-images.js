const download = require(`download`)
const flatten = require(`just-flatten`)
const pageParser = require(`susd-page-parser`)

async function downloadImagePathsFromSusdPage(url) {
	try {
		const html = await download(url)

		return pageParser(html).map(({ imageUrl }) => imageUrl)
	} catch (err) {
		console.error(`Error downloading ${ url }`)
		throw err
	}
}

module.exports = function preload({ queue, getImage }) {
	let total = `unknown`
	let leftToCheck = `unknown`

	Promise.all([
		downloadImagePathsFromSusdPage(`https://www.shutupandsitdown.com/videos-page/`),
		downloadImagePathsFromSusdPage(`https://www.shutupandsitdown.com/games-page/`),
	]).then(flatten).then(images => {
		total = images.length
		leftToCheck = images.length

		function downloadAnother() {
			if (images.length > 0) {
				const nextImage = images.shift()
				leftToCheck = images.length
				getImage(stripPrefox(nextImage))
			}
		}

		function downloadMore() {
			times(4, downloadAnother)

			if (images.length > 0) {
				queue.onEmpty().then(downloadMore)
			}
		}

		downloadMore()
	})

	return function getStatusString() {
		return `Queued ${ total - leftToCheck } of ${ total } image checks`
	}
}

function times(number, fn) {
	for (let i = 0; i < number; ++i) {
		fn()
	}
}

function stripPrefox(url) {
	return url.substring(`https://www.shutupandsitdown.com/wp-content/uploads/`.length)
}
