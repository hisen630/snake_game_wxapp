import Snake from './snake'
import Food from './food'
import Obstacle from './obstacle'
import ParticleSystem from './particle'
import {
  GRID_SIZE,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  LEVEL_SCORE,
  CRIT_INTERVAL,
  CRIT_FOOD_COUNT,
  CRIT_DURATION,
  CRIT_MULTIPLIER
} from './constants'

const levelTitles = [
  '白手起家', // 1级
  '小有积蓄',
  '邻里首富',
  '街道首富',
  '社区首富',
  '村首富',
  '镇首富',
  '乡首富',
  '区首富',
  '县首富', // 10级
  '地区首富',
  '市首富',
  '大城首富',
  '省会首富',
  '省级首富',
  '跨省首富',
  '区域首富',
  '国家新贵',
  '全国首富',
  '东亚首富', // 20级
  '亚洲首富',
  '欧亚首富',
  '世界新贵',
  '世界首富',
  '全球首富',
  '太阳系富豪',
  '银河富豪',
  '宇宙富豪',
  '超维富豪',
  '终极富豪'  // 30级
]

export default class Main {
  constructor() {
    this.canvas = wx.createCanvas()
    this.ctx = this.canvas.getContext('2d')

    // 获取屏幕信息
    const systemInfo = wx.getSystemInfoSync()
    this.screenWidth = systemInfo.windowWidth
    this.screenHeight = systemInfo.windowHeight

    // 计算游戏区域的偏移量，使其居中
    this.cellSize = Math.min(
      Math.floor(this.screenWidth / GRID_SIZE),
      Math.floor(this.screenHeight / GRID_SIZE)
    )

    // 计算游戏区域的偏移量，使其居中
    this.offsetX = (this.screenWidth - this.cellSize * GRID_SIZE) / 2
    this.offsetY = (this.screenHeight - this.cellSize * GRID_SIZE) / 2
    
    // 测试模式标志
    this.isTestMode = false
    
    // 文字动画相关
    this.textScale = 1
    this.textAlpha = 0
    this.scoreNumber = 0
    this.targetScore = 0
    this.lastUpdateTime = Date.now()

    // 等级动画相关
    this.levelAnimationStart = 0
    this.levelAnimationDuration = 1000
    
    // 添加食物统计相关的属性
    this.foodStats = {
      normal: { total: 0, crit: 0 },    // 普通食物 (+2)
      special: { total: 0, crit: 0 },   // 特殊食物 (+5)
      rare: { total: 0, crit: 0 }       // 稀有食物 (+10)
    }
    
    this.init()
    this.bindEvents()
    this.loop()
  }

  getLevelTitle() {
    return levelTitles[this.level - 1] || levelTitles[levelTitles.length - 1]
  }

  checkWinCondition() {
    if (this.level >= 30) {
      // 创建胜利烟花
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * this.canvas.width
        const y = Math.random() * this.canvas.height
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`
        const angle = Math.random() * Math.PI * 2
        const speed = 5 + Math.random() * 5
        
        // 创建烟花中心点
        this.particleSystem.addParticle(x, y, 0, 0, color, 4)
        
        // 创建烟花散射效果
        for (let j = 0; j < 20; j++) {
          const particleAngle = angle + (Math.PI * 2 / 20) * j + (Math.random() - 0.5) * 0.5
          const vx = Math.cos(particleAngle) * speed * (0.8 + Math.random() * 0.4)
          const vy = Math.sin(particleAngle) * speed * (0.8 + Math.random() * 0.4)
          this.particleSystem.addParticle(x, y, vx, vy, color, 2)
        }
      }
      
      // 延迟一帧设置游戏状态，确保烟花效果被创建
      requestAnimationFrame(() => {
        this.gameState = 'OVER'
      })
      return true
    }
    return false
  }

  init() {
    // 计算游戏区域的偏移量，使其居中
    this.offsetX = (this.screenWidth - this.cellSize * GRID_SIZE) / 2
    this.offsetY = (this.screenHeight - this.cellSize * GRID_SIZE) / 2
    
    // 初始化游戏状态
    this.gameState = 'READY'
    this.score = this.isTestMode ? 1000 : 0  // 测试模式下给予初始分数
    this.level = this.isTestMode ? 29 : 1    // 测试模式下从29级开始
    this.speed = INITIAL_SPEED
    this.lastUpdate = Date.now()
    this.lastFoodCheck = Date.now()

    this.snake = new Snake()
    this.foods = []
    this.obstacles = []
    this.particleSystem = new ParticleSystem()

    this.generateInitialObjects()

    // 初始化暴击时刻相关状态
    this.lastCritTime = Date.now()
    this.isCriticalTime = false
    this.criticalTimeEnd = 0
    this.critMessageScale = 1
    this.critMessageAlpha = 0
  }

  generateInitialObjects() {
    for (let i = 0; i < 4; i++) {
      this.generateFood()
    }
    for (let i = 0; i < 2; i++) {
      this.generateObstacle()
    }
  }

  bindEvents() {
    wx.onTouchStart(e => {
      const touch = e.touches[0]
      const x = touch.clientX
      const y = touch.clientY

      // 在开始界面时，检查是否点击了测试模式按钮
      if (this.gameState === 'READY') {
        // 测试模式按钮区域
        const testBtnX = this.canvas.width / 2
        const testBtnY = this.canvas.height / 2 + 80
        const btnWidth = 150
        const btnHeight = 40

        if (Math.abs(x - testBtnX) < btnWidth / 2 && 
            Math.abs(y - testBtnY) < btnHeight / 2) {
          this.isTestMode = true
          this.init()  // 重新初始化以应用测试模式的初始值
          this.gameState = 'PLAYING'
          return
        }

        // 普通开始游戏
        this.startGame()
        return
      }

      // 游戏结束状态
      if (this.gameState === 'OVER' || this.gameState === 'GAME_OVER') {
        this.restart()
        return
      }

      // 游戏进行中，处理移动方向
      if (this.gameState === 'PLAYING') {
        // 保存触摸起始位置
        this.touchStartX = x
        this.touchStartY = y
        this.touchStartTime = Date.now()
      }
    })

    // 处理触摸移动
    wx.onTouchMove(e => {
      if (this.gameState !== 'PLAYING') return
      if (!this.touchStartX || !this.touchStartY) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - this.touchStartX
      const deltaY = touch.clientY - this.touchStartY

      // 确保移动距离足够大，避免误触
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return

      // 判断移动方向
      const currentDir = this.snake.direction
      let newDir

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平移动
        newDir = { x: deltaX > 0 ? 1 : -1, y: 0 }
      } else {
        // 垂直移动
        newDir = { x: 0, y: deltaY > 0 ? 1 : -1 }
      }

      // 防止反向移动
      if (!(newDir.x === -currentDir.x && newDir.y === -currentDir.y)) {
        this.snake.direction = newDir
      }
    })

    // 处理触摸结束
    wx.onTouchEnd(() => {
      this.touchStartX = null
      this.touchStartY = null
      this.touchStartTime = null
    })
  }

  startGame() {
    if (this.gameState !== 'READY') return
    this.gameState = 'PLAYING'
  }

  restart() {
    if (this.gameState !== 'OVER' && this.gameState !== 'GAME_OVER') return
    this.isTestMode = false  // 重置测试模式
    this.init()
    this.gameState = 'PLAYING'
  }

  reset() {
    this.snake.reset()
    this.foods = []
    this.obstacles = []
    this.score = 0
    this.level = 1
    this.speed = INITIAL_SPEED
    this.gameState = 'PLAYING'
    
    // 重置暴击时刻相关状态
    this.lastCritTime = Date.now()
    this.isCriticalTime = false
    this.criticalTimeEnd = 0
    this.critMessageScale = 1
    this.critMessageAlpha = 0
    
    // 重置食物统计
    this.foodStats = {
      normal: { total: 0, crit: 0 },
      special: { total: 0, crit: 0 },
      rare: { total: 0, crit: 0 }
    }
    
    this.generateInitialObjects()
  }

  update() {
    if (this.gameState !== 'PLAYING') {
      // 即使在游戏结束状态也要更新粒子系统
      this.particleSystem.update()
      return
    }

    const now = Date.now()

    // 更新暴击时刻状态
    if (this.isCriticalTime && now >= this.criticalTimeEnd) {
      this.isCriticalTime = false
    }

    // 检查是否需要触发暴击时刻
    if (!this.isCriticalTime && now - this.lastCritTime >= CRIT_INTERVAL) {
      this.triggerCritMoment()
      this.lastCritTime = now
    }

    // 更新暴击消息动画
    if (this.isCriticalTime) {
      // 缩放动画
      this.critMessageScale = 1 + Math.sin(now / 200) * 0.1  // 产生0.9到1.1的缩放
      // 透明度动画
      const timeLeft = this.criticalTimeEnd - now
      if (timeLeft < 1000) {  // 最后一秒渐隐
        this.critMessageAlpha = timeLeft / 1000
      } else {
        this.critMessageAlpha = 1
      }
    }

    // 蛇的移动更新
    const deltaTime = now - this.lastUpdate

    // 更新粒子系统
    this.particleSystem.update(deltaTime)

    // 检查食物是否过期
    if (now - this.lastFoodCheck > 1000) {
      this.lastFoodCheck = now
      this.checkFoodExpiration()
    }

    if (deltaTime >= this.speed) {
      this.lastUpdate = now
      
      // 先移动蛇
      this.snake.move()
      
      // 检查是否死亡
      if (this.checkFail()) {
        this.gameOver()
        return
      }
      
      // 检查是否吃到食物
      this.checkCollision()
      
      // 检查是否达到胜利条件
      if (this.checkWinCondition()) {
        return
      }
    }
  }

  checkFoodExpiration() {
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const food = this.foods[i]
      if (food.getRemainingTime() <= 0) {
        const pos = {
          x: food.pos.x * this.cellSize + this.cellSize / 2 + this.offsetX,
          y: food.pos.y * this.cellSize + this.cellSize / 2 + this.offsetY
        }
        this.particleSystem.addParticle(pos.x, pos.y, '#ff0000', 'expire')
        this.foods.splice(i, 1)
        this.generateFood()
      }
    }
  }

  checkCollision() {
    const head = this.snake.body[0]

    // 检查是否吃到食物
    const foodIndex = this.foods.findIndex(food => 
      food.pos.x === head.x && food.pos.y === head.y
    )

    if (foodIndex !== -1) {
      const food = this.foods[foodIndex]
      const points = food.getPoints()
      // 在暴击时刻期间分数翻倍
      this.score += this.isCriticalTime ? points * CRIT_MULTIPLIER : points
      this.snake.grow()
      
      // 根据食物类型设置粒子效果颜色
      const pos = {
        x: head.x * this.cellSize + this.cellSize / 2 + this.offsetX,
        y: head.y * this.cellSize + this.cellSize / 2 + this.offsetY
      }
      this.particleSystem.addParticle(pos.x, pos.y, food.color)
      
      // 更新食物统计
      if (food.type === 'normal') {
        this.foodStats.normal.total++
        if (this.isCriticalTime) this.foodStats.normal.crit++
      } else if (food.type === 'special') {
        this.foodStats.special.total++
        if (this.isCriticalTime) this.foodStats.special.crit++
      } else if (food.type === 'rare') {
        this.foodStats.rare.total++
        if (this.isCriticalTime) this.foodStats.rare.crit++
      }
      
      this.foods.splice(foodIndex, 1)
      this.generateFood()

      // 检查升级
      if (this.score >= this.level * LEVEL_SCORE) {
        this.levelUp()
      }

      return true
    }
    return false
  }

  levelUp() {
    this.level++
    this.speed = Math.max(50, INITIAL_SPEED - (this.level - 1) * SPEED_INCREMENT)
    
    // 每升三级增加一个障碍物
    if (this.level % 3 === 0) {
      this.generateObstacle()
    }

    // 触发等级动画
    this.levelAnimationStart = Date.now()
  }

  checkFail() {
    const head = this.snake.body[0]

    // 检查是否撞到自己
    if (this.snake.body.slice(1).some(part => part.x === head.x && part.y === head.y)) {
      
      return true
    }

    // 检查是否撞到边界
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      
      return true
    }

    // 检查是否撞到障碍物
    if (this.obstacles.some(obs => 
      obs.cells.some(cell => cell.x === head.x && cell.y === head.y)
    )) {
      
      return true
    }

    return false
  }

  gameOver() {
    this.gameState = 'GAME_OVER'
    if (this.score > this.highScore) {
      this.highScore = this.score
      wx.setStorageSync('highScore', this.highScore)
    }
    // 重置动画状态
    this.textScale = 0.5
    this.textAlpha = 0
    this.scoreNumber = 0
    this.targetScore = this.score
  }

  render() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 绘制网格
    this.drawGrid()
    
    // 绘制食物
    this.foods.forEach(food => food.draw(this.ctx, this.cellSize, this.offsetX, this.offsetY))
    
    // 绘制蛇
    this.snake.draw(this.ctx, this.cellSize, this.offsetX, this.offsetY)
    
    // 绘制粒子
    this.particleSystem.draw(this.ctx)
    
    // 绘制UI
    this.drawUI()
    
    // 绘制统计信息（无论游戏状态如何都显示）
    this.drawStats()

    // 绘制开始界面
    if (this.gameState === 'READY') {
      // 绘制半透明背景
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      // 创建渐变色
      const gradient = this.ctx.createLinearGradient(
        this.canvas.width / 2 - 100,
        0,
        this.canvas.width / 2 + 100,
        0
      )
      gradient.addColorStop(0, '#ff6b6b')
      gradient.addColorStop(0.5, '#ffd93d')
      gradient.addColorStop(1, '#6c5ce7')

      this.ctx.fillStyle = gradient
      this.ctx.textAlign = 'center'

      // 标题
      this.ctx.font = 'bold 36px Arial'
      this.ctx.fillText('2025创富之路', this.canvas.width / 2, this.canvas.height / 2 - 60)

      // 副标题
      this.ctx.font = '24px Arial'
      this.ctx.fillText('从0到1，身价过亿！', this.canvas.width / 2, this.canvas.height / 2 - 20)

      // 操作说明
      this.ctx.fillStyle = 'white'
      this.ctx.font = '20px Arial'
      this.ctx.fillText('点击屏幕开始游戏', this.canvas.width / 2, this.canvas.height / 2 + 40)
      this.ctx.fillText('上下左右滑动控制方向', this.canvas.width / 2, this.canvas.height / 2 + 70)
    }
    
    // 绘制游戏结束界面
    if (this.gameState === 'GAME_OVER') {
      const now = Date.now()
      const deltaTime = now - this.lastUpdateTime
      this.lastUpdateTime = now
      
      // 更新动画状态
      if (this.textScale < 1) {
        this.textScale += deltaTime * 0.002
        if (this.textScale > 1) this.textScale = 1
      }
      if (this.textAlpha < 1) {
        this.textAlpha += deltaTime * 0.002
        if (this.textAlpha > 1) this.textAlpha = 1
      }
      if (this.scoreNumber < this.targetScore) {
        this.scoreNumber += deltaTime * 0.1
        if (this.scoreNumber > this.targetScore) this.scoreNumber = this.targetScore
      }

      // 绘制半透明背景
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      
      // 应用动画效果
      this.ctx.save()
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2)
      this.ctx.scale(this.textScale, this.textScale)
      this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2)
      
      this.ctx.globalAlpha = this.textAlpha
      
      // 创建渐变色
      const gradient = this.ctx.createLinearGradient(
        this.canvas.width / 2 - 100,
        0,
        this.canvas.width / 2 + 100,
        0
      )
      gradient.addColorStop(0, '#ff6b6b')
      gradient.addColorStop(0.5, '#ffd93d')
      gradient.addColorStop(1, '#6c5ce7')
      
      this.ctx.fillStyle = gradient
      this.ctx.font = '30px Arial'
      this.ctx.textAlign = 'center'
      
      this.ctx.fillText('2025年您将成为', this.canvas.width / 2, this.canvas.height / 2 - 40)
      this.ctx.font = 'bold 36px Arial'
      this.ctx.fillText(`${this.getLevelTitle()}`, this.canvas.width / 2, this.canvas.height / 2)
      this.ctx.font = '30px Arial'
      this.ctx.fillText(`身价：${Math.floor(this.scoreNumber)}亿`, this.canvas.width / 2, this.canvas.height / 2 + 40)
      
      this.ctx.fillStyle = 'white'
      this.ctx.fillText('点击屏幕重新开始', this.canvas.width / 2, this.canvas.height / 2 + 80)
      
      this.ctx.restore()
    }
  }

  drawGrid() {
    // 绘制游戏区域背景
    this.ctx.fillStyle = '#1a1a1a'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 绘制网格线
    this.ctx.strokeStyle = '#333333'
    this.ctx.lineWidth = 1
    
    // 计算网格区域
    const gridWidth = GRID_SIZE * this.cellSize
    const gridHeight = GRID_SIZE * this.cellSize
    
    // 绘制垂直线
    for (let x = 0; x <= GRID_SIZE; x++) {
      const xPos = this.offsetX + x * this.cellSize
      this.ctx.beginPath()
      this.ctx.moveTo(xPos, this.offsetY)
      this.ctx.lineTo(xPos, this.offsetY + gridHeight)
      this.ctx.stroke()
    }
    
    // 绘制水平线
    for (let y = 0; y <= GRID_SIZE; y++) {
      const yPos = this.offsetY + y * this.cellSize
      this.ctx.beginPath()
      this.ctx.moveTo(this.offsetX, yPos)
      this.ctx.lineTo(this.offsetX + gridWidth, yPos)
      this.ctx.stroke()
    }
    
    // 绘制障碍物
    this.obstacles.forEach(obstacle => obstacle.draw(this.ctx, this.cellSize, this.offsetX, this.offsetY))
  }

  drawUI() {
    // 调整UI位置以适应不同屏幕，距离网格顶部两个单元格
    const TOP_MARGIN = this.offsetY - this.cellSize * 2
    
    // 绘制分数和等级
    this.ctx.fillStyle = 'white'
    this.ctx.font = `${Math.max(16, Math.floor(this.cellSize * 0.8))}px Arial`
    this.ctx.textAlign = 'left'
    
    this.ctx.fillText(`财富: ${this.score}`, 20, TOP_MARGIN)

    // 绘制等级文字，带闪光动画效果
    const now = Date.now()
    const animationProgress = Math.min(1, (now - this.levelAnimationStart) / this.levelAnimationDuration)
    
    if (animationProgress < 1) {
      // 先绘制发光效果
      this.ctx.save()
      this.ctx.globalAlpha = 1 - animationProgress
      this.ctx.shadowColor = 'yellow'
      this.ctx.shadowBlur = this.cellSize / 2
      this.ctx.fillStyle = 'yellow'
      this.ctx.fillText(`等级: ${this.getLevelTitle()}`, 20, TOP_MARGIN + this.cellSize * 1.2)
      this.ctx.restore()
    }

    // 再绘制原始文字
    this.ctx.fillStyle = 'white'
    this.ctx.fillText(`等级: ${this.getLevelTitle()}`, 20, TOP_MARGIN + this.cellSize * 1.2)
    
    // 如果在暴击时刻，绘制提示
    if (this.isCriticalTime) {
      const centerX = this.canvas.width / 2
      const timeLeft = Math.ceil((this.criticalTimeEnd - Date.now()) / 1000)
      
      this.ctx.save()
      this.ctx.translate(centerX, TOP_MARGIN - 20)  // 将暴击提示放在其他文字上方
      this.ctx.scale(this.critMessageScale, this.critMessageScale)
      
      this.ctx.fillStyle = `rgba(255, 165, 0, ${this.critMessageAlpha})`
      this.ctx.font = 'bold 24px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`天降横财! ${timeLeft}秒 (分数×2)`, 0, 0)
      
      this.ctx.restore()
    }

    // 在测试模式下显示提示
    if (this.isTestMode) {
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)'
      this.ctx.font = '16px Arial'
      this.ctx.fillText('测试模式', 20, TOP_MARGIN + this.cellSize * 3)
    }

    // 绘制食物说明
    this.ctx.textAlign = 'right'
    this.ctx.font = '16px Arial'

    // 绘制不同类型食物的说明，与左侧文案保持相同的垂直位置
    this.ctx.fillStyle = '#FFD700'
    this.ctx.fillText('💰 +2', this.canvas.width - 20, TOP_MARGIN - this.cellSize*3)
    this.ctx.fillStyle = '#00FFFF'
    this.ctx.fillText('💎 +5', this.canvas.width - 20, TOP_MARGIN - this.cellSize * 1.8)
    this.ctx.fillStyle = '#FF69B4'
    this.ctx.fillText('👑 +10', this.canvas.width - 20, TOP_MARGIN - this.cellSize * 0.6)

    // 显示距离下次暴击时刻的倒计时
    const nextCritIn = Math.max(0, Math.ceil((CRIT_INTERVAL - (Date.now() - this.lastCritTime)) / 1000))
    this.ctx.fillStyle = '#FFA500'
    this.ctx.fillText(`下次横财: ${nextCritIn}秒`, this.canvas.width - 20, TOP_MARGIN + this.cellSize*1.2)
  }

  drawStats() {
    // 在底部添加食物统计信息
    const BOTTOM_MARGIN = 40
    const LINE_HEIGHT = Math.floor(this.cellSize * 0.7)
    this.ctx.textAlign = 'center'
    this.ctx.font = `${LINE_HEIGHT}px Arial`
    
    // 计算统计信息的位置，使用GRID_SIZE而不是this.gridSize
    const statsY = this.offsetY + GRID_SIZE * this.cellSize + BOTTOM_MARGIN
    const centerX = this.canvas.width / 2
    
    // 绘制食物统计信息，确保文字清晰可见
    this.ctx.textBaseline = 'top'  // 设置文字基线
    this.ctx.lineWidth = 2  // 设置描边宽度
    
    // 绘制普通食物统计
    this.ctx.fillStyle = '#FFD700'
    this.ctx.strokeStyle = '#000'  // 添加黑色描边
    const normalText = `💰 总数: ${this.foodStats.normal.total} (暴击: ${this.foodStats.normal.crit})`
    this.ctx.strokeText(normalText, centerX, statsY)
    this.ctx.fillText(normalText, centerX, statsY)
    
    // 绘制特殊食物统计
    this.ctx.fillStyle = '#00FFFF'
    const specialText = `💎 总数: ${this.foodStats.special.total} (暴击: ${this.foodStats.special.crit})`
    this.ctx.strokeText(specialText, centerX, statsY + LINE_HEIGHT)
    this.ctx.fillText(specialText, centerX, statsY + LINE_HEIGHT)
    
    // 绘制稀有食物统计
    this.ctx.fillStyle = '#FF69B4'
    const rareText = `👑 总数: ${this.foodStats.rare.total} (暴击: ${this.foodStats.rare.crit})`
    this.ctx.strokeText(rareText, centerX, statsY + LINE_HEIGHT * 2)
    this.ctx.fillText(rareText, centerX, statsY + LINE_HEIGHT * 2)
  }

  loop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.loop())
  }

  triggerCritMoment() {
    // 设置暴击时刻状态
    this.isCriticalTime = true
    this.criticalTimeEnd = Date.now() + CRIT_DURATION
    this.critMessageScale = 1
    this.critMessageAlpha = 1

    // 随机生成多个食物
    for (let i = 0; i < CRIT_FOOD_COUNT; i++) {
      const food = new Food(this)
      // 确保新食物不会出现在蛇身上或其他食物位置
      do {
        food.pos.x = Math.floor(Math.random() * GRID_SIZE)
        food.pos.y = Math.floor(Math.random() * GRID_SIZE)
      } while (
        this.snake.checkCollision(food.pos) ||
        this.foods.some(f => f.pos.x === food.pos.x && f.pos.y === food.pos.y)
      )
      this.foods.push(food)
    }
  }

  generateFood() {
    if (this.foods.length >= 10) return false

    const food = new Food(this)
    let attempts = 0
    const maxAttempts = 50

    while (attempts < maxAttempts) {
      const pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }

      if (!this.isPositionOccupied(pos)) {
        food.pos = pos
        this.foods.push(food)
        return true
      }

      attempts++
    }

    return false
  }

  generateObstacle() {
    if (this.obstacles.length >= 5) return false

    let attempts = 0
    const maxAttempts = 50

    while (attempts < maxAttempts) {
      // 避免在边缘生成障碍物
      const pos = {
        x: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
        y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2
      }

      const length = Math.floor(Math.random() * 2) + 2 // 2-3格长度
      const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical'
      
      // 检查障碍物是否会超出边界
      if (orientation === 'horizontal' && pos.x + length > GRID_SIZE - 2) continue
      if (orientation === 'vertical' && pos.y + length > GRID_SIZE - 2) continue

      const obstacle = new Obstacle(pos, length, orientation)

      // 检查是否与其他游戏元素重叠
      let isOverlapping = false
      for (const cell of obstacle.cells) {
        if (this.isPositionOccupied(cell)) {
          isOverlapping = true
          break
        }
      }

      if (!isOverlapping && !this.isObstacleBlockingPath(obstacle)) {
        this.obstacles.push(obstacle)
        return true
      }

      attempts++
    }

    return false
  }

  isPositionOccupied(pos) {
    // 检查是否与蛇重叠
    if (this.snake.body.some(part => part.x === pos.x && part.y === pos.y)) {
      return true
    }

    // 检查是否与食物重叠
    if (this.foods.some(food => food.pos.x === pos.x && food.pos.y === pos.y)) {
      return true
    }

    // 检查是否与障碍物重叠
    return this.obstacles.some(obs => 
      obs.cells.some(cell => cell.x === pos.x && cell.y === pos.y)
    )
  }

  isObstacleBlockingPath(newObstacle) {
    // 使用深度优先搜索检查是否会形成封闭区域
    const visited = new Set()
    const stack = [this.snake.body[0]] // 从蛇头开始搜索

    while (stack.length > 0) {
      const current = stack.pop()
      const key = `${current.x},${current.y}`
      
      if (visited.has(key)) continue
      visited.add(key)

      // 检查四个方向
      const directions = [
        { x: 1, y: 0 }, { x: -1, y: 0 },
        { x: 0, y: 1 }, { x: 0, y: -1 }
      ]

      for (const dir of directions) {
        const next = {
          x: current.x + dir.x,
          y: current.y + dir.y
        }

        // 检查是否在网格内
        if (next.x < 0 || next.x >= GRID_SIZE || 
            next.y < 0 || next.y >= GRID_SIZE) {
          continue
        }

        // 检查是否被障碍物或新障碍物阻挡
        if (this.obstacles.some(obs => 
          obs.cells.some(cell => cell.x === next.x && cell.y === next.y)
        ) ||
        newObstacle.cells.some(cell => cell.x === next.x && cell.y === next.y)) {
          continue
        }

        stack.push(next)
      }
    }

    // 如果可访问的格子数量太少，认为路径被阻塞
    const minAccessibleCells = GRID_SIZE * GRID_SIZE * 0.6
    return visited.size < minAccessibleCells
  }
}
