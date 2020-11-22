export default class Player {
	constructor(client, startCell, borderColor) {
		this.client = client
		this.cells = [startCell]
		this.lastColor = startCell.color
		this.borderColor = borderColor
	}
}
