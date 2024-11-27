// 微信小游戏适配器
export default class WeappAdapter {
  constructor() {
    if (!GameGlobal.window) {
      GameGlobal.window = GameGlobal
    }
    if (!GameGlobal.document) {
      GameGlobal.document = {}
    }
  }
}

// 初始化适配器
new WeappAdapter()
