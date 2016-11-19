require('loud-rejection/register')

require(`babel-polyfill`)
require(`babel-register`)({
	plugins: [
		`transform-async-to-generator`,
	]
})

require('./index').listen(process.env.PORT || 8889)
