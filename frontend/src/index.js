import io from 'socket.io-client'

let client = io('ws://192.168.0.2:3000')

let canvas = document.querySelector('.canvas')
let buttons = document.querySelector('.buttons')
let score = document.querySelector('.score')
let ctx = canvas.getContext('2d')

client.on('cells', (cells) => {
	ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

	let cellSize = canvas.clientHeight / cells.length

	let lineWidth = 3

	for (let y = 0; y < cells.length; y++) {
		for (let x = 0; x < cells[y].length; x++) {
			let cell = cells[y][x]

			ctx.beginPath()
			ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize)
			ctx.fillStyle = cell.color
			ctx.fill()

			if (cell.playerId) {
				ctx.beginPath()
				ctx.strokeStyle = (cell.playerId === client.id ? 'black' : 'white')
				ctx.lineWidth = lineWidth
				ctx.rect(x * cellSize, y * cellSize, cellSize - lineWidth / 2, cellSize - lineWidth / 2)
				ctx.stroke();
			}
		}
	}
})

client.on('colors', (colors) => {
	buttons.innerHTML = ''

	colors.forEach((color) => {
		let button = document.createElement('input')
		button.type = 'button'
		button.style.backgroundColor = color
		button.onclick = () => selectColor(color)
		buttons.appendChild(button)
	})
})

client.on('state', (state) => {
	score.innerHTML = ''

	score.innerHTML = JSON.stringify(state)
})

function selectColor(color) {
	client.emit('color', color)
}
