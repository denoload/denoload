import * as bunyan from "bunyan"

export function getLogger(name: string) {
		return bunyan.createLogger({
			name,
			level: "info",
			stream: process.stderr
		})
	}


export default {
	getLogger
}
