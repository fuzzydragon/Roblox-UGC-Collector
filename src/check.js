const fs = require(`fs/promises`)

const https = require(`./modules/https/index.js`)
const roblox = require(`./modules/roblox/index.js`)
const cli = require(`./modules/cli/index.js`)

const flags = cli.flags()

const pack = o => JSON.stringify(o, null, `\t`)
const unpack = d => JSON.parse(d)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const assets = require(`./assets.json`)

async function check() {
	const userId = parseInt(flags[`--id`])//30190178
	const its = parseInt(flags[`--speed`])

	while (assets.length > 0) {
		const reqs = []

		for (let i = 0; i < Math.min(assets.length, its); i++) {
			const r = new Promise(async res => {
				const {id, name} = assets.shift()

				const url = `https://inventory.roblox.com/v1/users/${userId}/items/Asset/${id}`
				const req = await https.get(url)
				
				const body = unpack(req.body)
				const owns = body.data.length > 0

				if (owns) {
					console.log(id, name, owns)
				}

				res()
			})

			reqs.push(r)
		}

		await Promise.all(reqs)
		process.title = assets.length
	}
}

fs.readdir(`./logs/`)
	.catch(() => fs.mkdir(`./logs/`))
	.then(() => check())
	.then(() => console.log(`done!`))