const Koa = require('koa')
const send = require('koa-send')
const router = require('koa-router')()

const nodeify = require('then-nodeify')
const denodeify = require('then-denodeify')

const PQueue = require('p-queue')

const getImagePath = require('./download-on-demand')
const preloadImages = require('./preload-images')

const downloadQueue = new PQueue({ concurrency: 2 })

const app = new Koa()

router.get('/:sizeIdentifier(1|2)/:imageUrl(.*)', async function(context, next) {
	const { sizeIdentifier, imageUrl } = context.params

	const images = await downloadQueue.add(() => getImagePath(imageUrl))
	const pathOnDisk = images[sizeIdentifier]

	await send(context, pathOnDisk, { root: '/' })
})

app.use(router.routes())

module.exports = app

preloadImages({
	queue: downloadQueue,
	getImage: getImagePath
})
