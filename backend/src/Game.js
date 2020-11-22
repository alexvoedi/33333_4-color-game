import Cell from './Cell'
import Player from './Player'

export default class Game {
	constructor(io) {
		this.io = io

		this.width = 50
		this.height = 25

		this.init()

		io.on('connection', (client) => this.onConnection(client))
	}

	init() {
		this.players = []

		this.initColors()
		this.initCells()
	}

	initColors() {
		this.colors = [
			'red',
			'green',
			'blue',
			'yellow',
			'orange',
			'brown',
			'purple'
		]
	}

	initCells() {
		this.cells = []
		for (let y = 0; y < this.height; y++) {
			this.cells[y] = []

			for (let x = 0; x < this.width; x++) {
				let color = this.colors[Math.floor(Math.random() * this.colors.length)]

				this.cells[y][x] = new Cell(x + this.width * y, x, y, color)
			}
		}
	}

	onConnection(client) {
		if (this.players.length < 2) {
			let startCell = this.players.length === 0 ? this.cells[0][0] : this.cells[this.height - 1][this.width - 1]
			let borderColor = this.players.length === 0 ? 'white' : 'black'

			let player = new Player(client, startCell, borderColor)

			client.on('color', (color) => this.onColor(client, color))

			this.players.push(player)

			if (this.players.length === 2) this.start()
		}
	}


	onColor(client, color) {
		if (client.id !== this.currentPlayerId) return

		let player = this.players.find((player) => player.client.id === client.id)

		player.cells.forEach((cell) => cell.color = color)

		let adjacentCells = this.getPlayerAdjacentCells(player)

		let cluster = []
		adjacentCells.forEach((adjacentCell) => {
			cluster.push(...this.getColorCluster(adjacentCell, [adjacentCell]))
		})

		cluster.forEach((cell) => {
			if (cell.color === color) {
				cell.playerId = client.id

				if (player.cells.find((c) => c.id !== cell.id)) player.cells.push(cell)
			}
		})

		player.lastColor = color

		this.sendState()

		this.nextPlayer()
	}

	getPlayerAdjacentCells(player) {
		let adjacentCells = []

		player.cells.forEach((cell) => {
			let neighbours = this.getNeighbours(cell).filter((cell) => {
				return !cell.playerId && !adjacentCells.find((c) => c.id === cell.id)
			})

			adjacentCells.push(...neighbours)
		})

		return adjacentCells
	}

	getNeighbours(cell) {
		let { x, y } = cell

		let neighbours = []

		if (x > 0) neighbours.push(this.cells[y][x - 1])
		if (x < this.width - 1) neighbours.push(this.cells[y][x + 1])
		if (y > 0) neighbours.push(this.cells[y - 1][x])
		if (y < this.height - 1) neighbours.push(this.cells[y + 1][x])

		return neighbours.filter((cell) => !cell.playerId)
	}

	getNeighboursWithColor(cell, color) {
		return this.getNeighbours(cell).filter((cell) => cell.color == color)
	}

	getColorCluster(cell, cluster) {
		let neighbours = this.getNeighboursWithColor(cell, cell.color).filter((cell) => {
			return !cell.playerId && !cluster.find((c) => c.id === cell.id)
		})

		cluster.push(...neighbours)

		neighbours.forEach((neighbour) => this.getColorCluster(neighbour, cluster))

		return cluster
	}

	nextPlayer() {
		if (this.currentPlayerIndex === undefined) this.currentPlayerIndex = Math.floor(Math.random() * 2)
		else this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 2

		this.currentPlayerId = this.players[this.currentPlayerIndex].client.id
	}

	start() {
		this.nextPlayer()

		this.sendState()
	}

	sendState() {
		this.io.emit('cells', this.cells)

		this.io.emit('state', {
			players: [
				...this.players.map((player) => ({
					score: player.cells.length,
					borderColor: player.borderColor
				}))
			]
		})

		this.players.forEach((player) => {
			player.client.emit('colors', this.colors.filter((color) => color !== player.lastColor))
		})
	}
}
