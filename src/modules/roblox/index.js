const https = require(`../https/index.js`)

async function fetchIdForUsername(name) {
	return https.get(`https://api.roblox.com/users/get-by-username?username=${name}`)
		.then(response => JSON.parse(response.body).Id)
}

async function fetchFriendsForUserId(id) {
	return https.get(`https://friends.roblox.com/v1/users/${id}/friends`)
		.then(response => JSON.parse(response.body).data)
}

async function fetchUsernameForUserId(id) {
	return https.get(`https://users.roblox.com/v1/users/${id}`)
		.then(response => JSON.parse(response.body).name)
}

async function fetchMembersInGroup(id) {
	const members = []

	let cursor = ""
	while (cursor != null) {
		const response = await https.get(`https://groups.roblox.com/v1/groups/${id}/users?limit=100&cursor=${cursor}`)
		const { nextPageCursor, data } = JSON.parse(response.body)
		
		cursor = nextPageCursor
		Object.values(data).forEach(m => members.push(m))
	}
	
	return members
}

module.exports = { fetchIdForUsername, fetchFriendsForUserId, fetchUsernameForUserId, fetchMembersInGroup }