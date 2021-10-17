
function flags() {
	const args = process.argv
	const opts = {}

	for (let i = 2; i < args.length; i += 2) {
		opts[args[i]] = args[i + 1]
	}

	return opts
}

module.exports = { flags }