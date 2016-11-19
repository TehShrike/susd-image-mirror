require('loud-rejection/register')

const path = require('path')

const Koa = require('koa')
const send = require('koa-send')
const router = require('koa-router')()
const mount = require('koa-mount')

const level = require('level-mem')
const createCache = require('levelup-cache')

const nodeify = require('then-nodeify')
const denodeify = require('then-denodeify')

const tmpDir = require('os-tmpdir')()

const createImageDownloader = require('./image-downloader')

const imagePath = path.join(tmpDir, 'susd-images')

const imageDownloader = createImageDownloader({
	outputDirectory: imagePath,
	urlPrefix: 'https://www.shutupandsitdown.com/wp-content/uploads/'
})

const db = level('susd-images', { valueEncoding: 'json' })
const cache = createCache(db, nodeify(imageDownloader))
const getFromCache = denodeify(cache.get)

/*
use levelup-cache storing paths to files on-disk in the cache

const pathToImageOnDisk = await denodeify(cache.get)(remote image url)
send(ctx, pathToImageOnDisk)

on startup get the current list of images and use p-queue to hit the cache
for all of them one or two at a time

*/

const app = new Koa()

router.get('/:sizeIdentifier(1|2)/:imageUrl(.*)', async function(context, next) {
	const { sizeIdentifier, imageUrl } = context.params

	console.log('hitting cache with', imageUrl)
	const images = await getFromCache(imageUrl)
	console.log('got back images', images)
	const pathOnDisk = images[sizeIdentifier]

	console.log('trying to serve up', pathOnDisk)

	await send(context, pathOnDisk, { root: '/' })
})

app.use(router.routes())

module.exports = app
