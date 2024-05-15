export const error_constant = {
  Not_Element: "传递的对象不是元素",
  Not_Find_Element: "初始化时未找到该元素",
  Not_Config: "找不到配置",
  Exceeded_MaximumMine: "超出最大数量"
};

export const game_state = {
  // 准备
  prepare: 0,
  // 初始化
  init: 1,
  // 进行中
  running: 2,
  // 结局状态 - 成功
  finish: 3,
  // 结局状态 - 失败
  fail: 4
}

export const time_change = {
  click: "click",
  dblclick: "dblclick",
  contextmenu: "contextmenu",
  // 双击时触发清空周围八个方块的事件名称
  eliminateAllDirections: "eliminateAllDirections"
}