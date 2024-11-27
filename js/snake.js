import { GRID_SIZE } from './constants'

export default class Snake {
  constructor() {
    this.reset()
  }

  reset() {
    this.body = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ]
    this.direction = { x: 1, y: 0 }
    this.growing = false
  }

  move() {
    const head = { ...this.body[0] }
    head.x += this.direction.x
    head.y += this.direction.y

    if (this.growing) {
      this.growing = false
    } else {
      this.body.pop()
    }

    this.body.unshift(head)
  }

  grow() {
    this.growing = true
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
    this.body.forEach((segment, index) => {
      const x = segment.x * cellSize + offsetX
      const y = segment.y * cellSize + offsetY

      ctx.fillStyle = index === 0 ? '#4CAF50' : '#388E3C'
      this.drawRoundRect(ctx, x, y, cellSize, cellSize, 4)
      ctx.fill()
    })
  }

  // 检查是否与某个点碰撞
  checkCollision(point) {
    return this.body.some(segment => 
      segment.x === point.x && segment.y === point.y
    )
  }
}
