const Koa = require('koa')
const send = require('koa-send')
const conditionalGet = require('koa-conditional-get')
const router = require('koa-router')()

const nodeify = require('then-nodeify')
const denodeify = require('then-denodeify')

const PQueue = require('p-queue')

const makeDownloadingPathGetter = require('./download-on-demand')
const preloadImages = require('./preload-images')

const downloadQueue = new PQueue({ concurrency: 5 })

const getImageBuffers = makeDownloadingPathGetter(downloadQueue)

const app = new Koa()

const serverStart = new Date()
const etagValue = serverStart.valueOf()
const lastModifiedValue = serverStart.toUTCString()

const preloadStatus = preloadImages({
	queue: downloadQueue,
	getImage: getImageBuffers
})

router.get('/status', async function(context) {
	context.body = preloadStatus()
})

app.use(conditionalGet())

router.get('/:sizeIdentifier(1|2)/:imageUrl(.*)', async function(context, next) {
	context.status = 200
	context.set('ETag', etagValue)

	const { sizeIdentifier, imageUrl } = context.params

	await next()

	if (context.stale) {
		const images = await getImageBuffers(imageUrl)
		context.body = images[sizeIdentifier]
		context.set('Cache-Control', 'public')
		context.set('Last-Modified', lastModifiedValue)
		context.set('Content-Type', 'image/jpeg')
	}
})

app.use(router.routes())

module.exports = app

