export default class Food {
  constructor(game) {
    this.game = game
    this.pos = { x: 0, y: 0 }
    this.createTime = Date.now()
    
    // 随机生成食物类型
    this.type = this.generateFoodType()
    
    // 根据类型设置属性
    switch(this.type) {
      case 'normal':  // 金币
        this.color = '#FFD700'  // 金色
        this.lifetime = 10000  // 10秒
        this.basePoints = 2
        this.symbol = '💰'
        break
      case 'special':  // 钻石
        this.color = '#00FFFF'  // 青色
        this.lifetime = 7000   // 7秒
        this.basePoints = 5
        this.symbol = '💎'
        break
      case 'rare':    // 皇冠
        this.color = '#FF69B4'  // 粉色
        this.lifetime = 5000   // 5秒
        this.basePoints = 10
        this.symbol = '👑'
        break
    }
  }

  generateFoodType() {
    const rand = Math.random()
    if (rand < 0.5) return 'normal'      // 50%几率
    if (rand < 0.8) return 'special'     // 30%几率
    return 'rare'                        // 20%几率
  }

  getRemainingTime() {
    return Math.max(0, (this.lifetime - (Date.now() - this.createTime)) / 1000)
  }

  getPoints() {
    return this.basePoints
  }

  shouldShowTimer() {
    return this.getRemainingTime() <= 5
  }

  draw(ctx, cellSize, offsetX, offsetY) {
    const x = this.pos.x * cellSize + offsetX
    const y = this.pos.y * cellSize + offsetY

    // 绘制食物符号
    ctx.fillStyle = this.color
    ctx.font = `${Math.floor(cellSize * 0.8)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      this.symbol,
      x + cellSize/2,
      y + cellSize/2
    )

    // 显示倒计时
    if (this.shouldShowTimer()) {
      ctx.fillStyle = 'white'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        this.getRemainingTime().toFixed(1),
        x + cellSize/2,
        y - 5
      )
    }
  }
}
