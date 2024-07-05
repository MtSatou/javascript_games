export default class sudoku {
  #cell;
  #size;
  #containerEl;
  #fontColor = "#000";
  #borderColor = "#000";
  #backgroundColor = "#fff";
  // 空格占比
  #vacancyPercentage = 0.2;
  // 游戏数据（位置, 值, 元素）
  #gameData = [];
  // 游戏数据（值）
  #sudokuData = [];
  // 正确个数
  #correctNumber = 0;
  // 游戏状态: 0未开始, 1初始化, 2开始, 3结束
  #gameState = 0;
  // 事件回调
  #event = {
    // 棋盘创建后执行
    createdHandler: undefined,
    // 棋盘创建后每秒执行
    timeChangeHandler: undefined,
    // 某个空白单元格输入值后执行
    inputHandler: undefined,
    // 游戏结束执行
    overHandler: undefined,
  };
  // 定时器id
  #timeId = 0;
  // 游戏时时间戳
  #time = {
    // 创建的时间
    create: 0,
    // 时间走过的步数（秒）
    step: 0,
    // 结束的时间
    over: 0,
  };
  // 玩家操作记录
  #change = [];

  constructor(
    el,
    {
      inputRows,
      fontColor,
      borderColor,
      backgroundColor,
      vacancyPercentage,
      createdHandler,
      timeChangeHandler,
      inputHandler,
      overHandler,
    }
  ) {
    if (inputRows === void 0) {
      return;
    }
    this.#cell = Math.round(Math.sqrt(inputRows));
    this.#size = this.#cell * this.#cell;
    this.#containerEl = el;
    this.#vacancyPercentage = vacancyPercentage;
    this.#fontColor = fontColor || this.fontColor;
    this.#borderColor = borderColor || this.borderColor;
    this.#backgroundColor = backgroundColor || this.backgroundColor;
    this.#event.createdHandler = createdHandler || this.#event.createdHandler;
    this.#event.timeChangeHandler = timeChangeHandler || this.#event.timeChangeHandler;
    this.#event.inputHandler = inputHandler || this.#event.inputHandler;
    this.#event.overHandler = overHandler || this.#event.overHandler;
    this.#init();
  }

  #init() {
    this.#gameState = 1;
    // 初始化源数据
    this.#sudokuData = this.#initData();
    // 初始化元素、坐标
    this.#gameData = this.#sudokuData.map((item, i) => {
      return item.map((jtem, j) => {
        return {
          // 元素
          el: null,
          // 值
          value: jtem,
          // 位置
          coordinates: { x: j, y: i },
          // 是否标记正确
          isCorrect: false,
        };
      });
    });
    // 创建完整棋盘
    this.#createElementMap();
    // 设置缺省元素
    this.#setVacancyElement();
    this.#event.createdHandler && this.#event.createdHandler();
    if (this.#event.timeChangeHandler) {
      this.#timeId = setInterval(() => {
        this.#event.timeChangeHandler(++this.#time.step);
      }, 1000);
    }
    this.#gameState = 2;
    this.#time.create = Date.now();
  }
  #initData() {
    const size = this.#size;
    const blockSize = this.#cell;
    const board = Array.from({ length: size }, () => Array(size).fill(0));

    // 辅助函数，检查数字是否可以放置在指定位置
    function canPlaceNumber(board, row, col, num) {
      for (let i = 0; i < size; i++) {
        if (board[row][i] === num || board[i][col] === num) return false;
      }
      const startRow = Math.floor(row / blockSize) * blockSize;
      const startCol = Math.floor(col / blockSize) * blockSize;
      for (let i = 0; i < blockSize; i++) {
        for (let j = 0; j < blockSize; j++) {
          if (board[startRow + i][startCol + j] === num) return false;
        }
      }
      return true;
    }

    // 辅助函数，生成数独棋盘
    function fillBoard(board) {
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (board[row][col] === 0) {
            const numbers = Array.from({ length: size }, (_, i) => i + 1);
            // 随机打乱数组
            for (let i = numbers.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }
            for (let num of numbers) {
              if (canPlaceNumber(board, row, col, num)) {
                board[row][col] = num;
                if (fillBoard(board)) return true;
                board[row][col] = 0; // 回溯递归
              }
            }
            // 若无数字可填，返回false
            return false;
          }
        }
      }
      // 所有位置填满
      return true;
    }

    fillBoard(board);
    return board;
  }
  #createElementMap() {
    // 创建容器
    const container = document.createElement("div");
    container.classList.add("sudoku-container");
    Object.assign(container.style, {
      display: "flex",
      flexWrap: "wrap",
      userSelect: "none",
      color: this.#fontColor,
      backgroundColor: this.#backgroundColor,
      // 大容器上、左侧边框阴影
      boxShadow: `-1px 0px ${this.#borderColor}, 0px -1px ${this.#borderColor}`,
    });

    // 子项占比
    const proportion = 1 / this.#size;
    // 子项实际宽高，确保最终出现正方形，取小值
    const elLengthPx =
      Math.min(this.#containerEl.clientWidth, this.#containerEl.clientHeight) *
      proportion;

    for (const cell of this.#gameData) {
      const cellElement = document.createElement("div");
      cellElement.classList.add("sudoku-cell");
      // 设置样式
      Object.assign(cellElement.style, {
        display: "flex",
        flexWrap: "wrap",
        // 设置宽高
        width: "100%",
        height: elLengthPx + "px",
      });

      for (const item of cell) {
        const itemElement = document.createElement("div");
        itemElement.classList.add("sudoku-item");
        itemElement.textContent = item.value;
        // 设置样式
        Object.assign(itemElement.style, {
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          // 单元格右、下侧边框阴影
          boxShadow: `1px 0px ${this.#borderColor}, 0px 1px ${
            this.#borderColor
          }`,
          // 设置宽高
          width: elLengthPx + "px",
          height: elLengthPx + "px",
          lineHeight: elLengthPx + "px",
          textAlign: "center",
        });
        item.el = itemElement;
        cellElement.appendChild(itemElement);
      }
      container.appendChild(cellElement);
    }

    this.#containerEl.appendChild(container);
  }
  #setVacancyElement() {
    const size = this.#size;
    const vacancyPercentage = this.#vacancyPercentage;
    const difficulty = Math.floor(size * size * vacancyPercentage);
    let count = 0;
    while (count < difficulty) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const item = this.#gameData[row][col];
      if (item.value !== 0) {
        item.value = 0;
        item.el.textContent = "";
        item.el.setAttribute("contentEditable", true);
        item.el.style.backgroundColor = "#0000000a";
        item.el.oninput = (evt) => {
          const value = this.#sudokuData[row][col];
          const inputValue = +evt.target.textContent.trim();
          if (!item.isCorrect && inputValue === value) {
            item.isCorrect = true;
            this.#correctNumber++;
          }
          if (item.isCorrect && inputValue !== value) {
            item.isCorrect = false;
            this.#correctNumber--;
          }
          this.#change.push({
            type: "input",
            event: {
              // 正确值
              value,
              // 用户填写的值
              inputvalue: inputValue,
              // 坐标
              coordinates: { x: row, y: col },
            },
          });
          if (this.#correctNumber === difficulty) {
            this.#over();
            this.#change.push({
              type: "over",
              event: {
                // 正确值
                value,
                // 用户填写的值
                inputvalue: inputValue,
                // 坐标
                coordinates: { x: row, y: col },
              },
            });
          }
          this.#event.inputHandler && this.#event.inputHandler(evt.target.textContent);
        };
        count++;
      }
    }
  }
  #over() {
    this.#gameState = 3;
    this.#time.over = Date.now();
    this.#event.overHandler &&
      this.#event.overHandler({
        time: this.#time,
        change: this.#change
      });

    // 消除事件，结束游戏
    clearInterval(this.#timeId);
    this.#event.createdHandler = undefined;
    this.#event.timeChangeHandler = undefined;
    this.#event.inputHandler = undefined;
    this.#event.overHandler = undefined;

    // 关闭编辑
    for (const item of this.#gameData.flat(2)) {
      item.el.removeAttribute("contentEditable");
      item.el.oninput = undefined;
    }
  }
}
