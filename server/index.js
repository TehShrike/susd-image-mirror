const Koa = require('koa')
const send = require('koa-send')
const conditionalGet = require('koa-conditional-get')
const router = require('koa-router')()

const PQueue = require('p-queue')

const makeDownloadingPathGetter = require('./download-on-demand')
// const preloadImages = require('./preload-images')

const downloadQueue = new PQueue({ concurrency: 5 })

const getImagePath = makeDownloadingPathGetter(downloadQueue)

const app = new Koa()

const serverStart = new Date()
const etagValue = serverStart.valueOf()
const lastModifiedValue = serverStart.toUTCString()

// const preloadStatus = preloadImages({
// 	queue: downloadQueue,
// 	getImage: getImagePath,
// })

// router.get('/status', async function(context) {
// 	context.body = preloadStatus()
// })

app.use(conditionalGet())

router.get('/:sizeIdentifier(1|2)/:imageUrl(.*)', async function(context, next) {
	context.status = 200
	context.set('ETag', etagValue)

	const { sizeIdentifier, imageUrl } = context.params

	if (context.stale) {
		const images = await getImagePath(imageUrl)
		const pathOnDisk = images[sizeIdentifier]
		await send(context, pathOnDisk, { root: '/', setHeaders })
	}
})

function setHeaders(response) {
	response.setHeader('Cache-Control', 'public')
	response.setHeader('Last-Modified', lastModifiedValue)
}

app.use(router.routes())

module.exports = app

