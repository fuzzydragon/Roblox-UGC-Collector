const fs = require(`fs/promises`)

const https = require(`./modules/https/index.js`)
const roblox = require(`./modules/roblox/index.js`)

const pack = o => JSON.stringify(o, null, `\t`)
const unpack = d => JSON.parse(d)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const CATALOG_DETAILS_API = `https://catalog.roblox.com/v1/search/items/details?`
const API_FLOOD_TIMEOUT = 1000 * 30

async function collect(creator, subcategory) {
	console.log(creator, subcategory)
	const assets = []

	let cursor = ""
	while (cursor != null) {
		const params = `Limit=30&Category=13&CreatorTargetId=${creator.id}&Subcategory=${subcategory}&Cursor=${cursor}`
		const response = await https.get(CATALOG_DETAILS_API + params)

		const { nextPageCursor, data, errors} = JSON.parse(response.body)
		
		if (errors == null) { 
			console.log(data.length)
			cursor = nextPageCursor
			data.forEach(a => assets.push({ id: a.id, name: a.name, creator: { id: a.creatorTargetId, name: a.creatorName } }))
		} else {
			console.log(`ran into error: `, errors[0])
			await sleep(API_FLOOD_TIMEOUT)
		}
	}

	return assets
}

async function fetchCreators() {
	let creators = unpack(await fs.readFile(`./creators.json`))
	const lookup = {}

	creators.forEach(m => lookup[m.id] = true)

	const groups = [
		{ id: 8697232, name: `Roblox UGC Community` }
	]
	
	for (const { id, name } of groups) {
		const members = (await roblox.fetchMembersInGroup(id))
			.map(m => m.user)
			.map(u => new Object({ id: u.userId, name: u.username }))
			.filter(u => lookup[u.id] == null)

		members.forEach(m => creators.push(m))
		members.forEach(m => lookup[m.id] = true)
	}

	await fs.writeFile(`./logs/creators_old_${Date.now()}.json`, pack(creators))
	await fs.writeFile(`./creators.json`, pack(creators))

	return creators
}

async function scrape() {
	let assets = []

	let creators = await fetchCreators()
	const subcategories = {
		All: 40,
		HeadAccessories: 54,
		HairAccessories: 20,
		FaceAccessories: 21,
		NeckAccessories: 22,
		ShoulderAccessories: 23,
		FrontAccessories: 24,
		BackAccessories: 25,
		WaistAccessories: 26
	}

	const _creators = [...creators]
	_creators.push({ id: "", name: ""}) // look with "NO CREATOR" too

	for (const creator of _creators) {
		const reqs = []

		for (const subcategory of Object.values(subcategories)) {
			// const _assets = await collect(creator, subcategory)
			// _assets.forEach(a => assets.push(a))

			const req = collect(creator, subcategory)

			reqs.push(req)
		}

		const collections = await Promise.all(reqs)
		
		collections.forEach(collection => collection.forEach(asset => assets.push(asset)))
	}

	// autism
	assets = [...new Map(assets.map(asset => [asset.id, asset])).values()]
	assets.forEach(asset => creators.push(asset.creator))
	creators = [...new Map(creators.map(creator => [creator.id, creator])).values()]

	await fs.writeFile(`./logs/creators_old_${Date.now()}.json`, pack(creators))
	await fs.writeFile(`./creators.json`, pack(creators))

	const now = Date.now()
	fs.writeFile(`./logs/assets_${now}.json`, pack(assets))
		.then(() => console.log(`wrote ./logs/assets_${now}.json`))
		
}

fs.readdir(`./logs/`)
	.catch(() => fs.mkdir(`./logs/`))
	.then(() => scrape())