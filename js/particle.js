export default class ParticleSystem {
  constructor() {
    this.particles = []
  }

  addParticle(x, y, color = '#64ff64', type = 'food') {
    const particleCount = type === 'food' ? 8 : 12
    const baseSpeed = type === 'food' ? 2 : 3
    const baseLife = type === 'food' ? 500 : 800

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = baseSpeed + Math.random()
      const life = baseLife + Math.random() * 300

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: 3,
        life,
        maxLife: life
      })
    }
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      
      p.x += p.vx
      p.y += p.vy
      p.life -= deltaTime
      p.alpha = p.life / p.maxLife
      p.size *= 0.99

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  draw(ctx) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
  }
}
