const { request } = require(`https`)

async function generic(method, url, options, data) {
	options = options || {}
	options.method = method

	return new Promise(resolve => {
		const req = request(url, options, resp => {
			const response = {
				body: ``,
				status: resp.statusCode,
				headers: resp.headers
			}

			resp.on(`data`, c => response.body += c)
			resp.on(`end`, () => resolve(response))
		})

		if (data != undefined) req.write(data)
		req.end()
	})
}

module.exports = {
	get: (url, options) => generic(`GET`, url, options),
	post: (url, options, data) => generic(`POST`, url, options, data)
}