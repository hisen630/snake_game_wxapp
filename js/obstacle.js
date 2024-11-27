export default class Obstacle {
  constructor(pos, length = 2, orientation = 'horizontal') {
    this.pos = pos
    this.length = length
    this.orientation = orientation
    this.cells = this.generateCells()
  }

  generateCells() {
    const cells = []
    for (let i = 0; i < this.length; i++) {
      cells.push({
        x: this.orientation === 'horizontal' ? this.pos.x + i : this.pos.x,
        y: this.orientation === 'vertical' ? this.pos.y + i : this.pos.y
      })
    }
    return cells
  }

  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.arcTo(x + width, y, x + width, y + radius, radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
    ctx.lineTo(x + radius, y + height)
    ctx.arcTo(x, y + height, x, y + height - radius, radius)
    ctx.lineTo(x, y + radius)
    ctx.arcTo(x, y, x + radius, y, radius)
    ctx.closePath()
  }

  draw(ctx, cellSize, offsetX, offsetY) {
    ctx.fillStyle = '#ff6464'
    
    this.cells.forEach(cell => {
      const x = cell.x * cellSize + offsetX
      const y = cell.y * cellSize + offsetY
      
      this.drawRoundRect(ctx, x, y, cellSize, cellSize, 5)
      ctx.fill()
    })
  }
}
