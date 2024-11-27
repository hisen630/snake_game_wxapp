import './js/libs/weapp-adapter'
import './js/libs/symbol'

import Main from './js/main'

// 等待游戏加载完成
wx.onShow(() => {
  console.log('Game Show')
})

wx.onHide(() => {
  console.log('Game Hide')
})

// 创建主游戏实例
const game = new Main()

// 导出游戏实例供调试使用
export default game
