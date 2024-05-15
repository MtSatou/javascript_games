import common from "./common.js";
import { error_constant, game_state, time_change } from "./constant.js";

/**
 * @name MtSatou https://github.com/MtSatou
 * @param {Element} el 容器元素
 * @param {Object} options 配置
 * @param {Number|Object} options.size 尺寸：如果传递一个number则生成正方形，如果传递对象则需传递size.x与size.y生成矩形
 * @param {Number} options.size.x x方向个数
 * @param {Number} options.size.y y方向个数
 * @param {Number} options.sweepingNumber 雷的个数
 * @param {Function} options.createdHandler 开始的回调
 * @param {Function} options.timeChangeHandler 时间变化的回调（秒）
 * @param {Function} options.clickHandler 点击的回调
 * @param {Function} options.dblclickHandler 双击的回调
 * @param {Function} options.contextmenuHandler 右键的回调
 * @param {Function} options.overHandler 结束的回调
 * @param {Function} options.revealMine 是否显示雷
 * @param {Function} options.revealNumber 是否显示数字
 */
class mineSweeping {
  #event = {
    createdHandler: undefined,
    timeChangeHandler: undefined,
    clickHandler: undefined,
    dblclickHandler: undefined,
    contextmenuHandler: undefined,
    overHandler: undefined,
  };
  #initConfig = {
    el: null,
    gameEl: null,
    revealMine: false,
    revealNumber: false,
    size: {
      x: 10,
      y: 10,
    },
    // 雷的个数
    sweepingNumber: 10,
    // 初始化雷时重试次数（冲突次数）
    createMineRetryNumber: 0,
    gameStatus: game_state.prepare,
    gameData: [],
    time: {
      create: 0,
      change: [],
      over: 0,
    },
  };
  // 用于雷自身绑定的点击、双击、右键事件、时间变化
  #handler = {
    click: undefined,
    dblclick: undefined,
    contextmenu: undefined,
    timeChange: undefined,
  };
  constructor(el, options) {
    this.#initConfig.el = common.isStringForDocumentElement(el);
    this.#initConfig.revealMine = options.revealMine ?? this.#initConfig.revealMine;
    this.#initConfig.revealNumber =  options.revealNumber ?? this.#initConfig.revealNumber;
    this.#initConfig.sweepingNumber = options.sweepingNumber ?? this.#initConfig.sweepingNumber;
    this.#event.createdHandler = options.createdHandler;
    this.#event.timeChangeHandler = options.timeChangeHandler;
    this.#event.clickHandler = options.clickHandler;
    this.#event.dblclickHandler = options.dblclickHandler;
    this.#event.contextmenuHandler = options.contextmenuHandler;
    this.#event.overHandler = options.overHandler;
    this.#init(options);
  }

  #init(options) {
    this.#initSize(options);
    this.#initGame();
  }

  #initSize(options) {
    if (!options.size) {
      return false;
      // throw new Error(`${error_constant.Not_Config} "options.size"`);
    }
    if (typeof options.size === "number") {
      this.#initConfig.size = {
        x: options.size,
        y: options.size,
      };
      return true;
    }
    if (
      typeof options.size === "object" &&
      typeof options.size.x === "number" &&
      typeof options.size.y === "number"
    ) {
      this.#initConfig.size = {
        x: options.size.x,
        y: options.size.y,
      };
      return true;
    }
  }

  #initGame() {
    const mineDoubleArray = this.#initMine();
    this.#event.createdHandler && this.#event.createdHandler(mineDoubleArray);
    this.#initView(mineDoubleArray);
    this.#initClick();
    this.#initDblclick();
    this.#initContextmenu();
    this.#initConfig.time.create = Date.now();
    this.#initConfig.gameStatus = game_state.running;
  }

  #initMine() {
    this.#initConfig.gameStatus = game_state.init;
    if (
      this.#initConfig.sweepingNumber >
      this.#initConfig.size.x * this.#initConfig.size.y
    ) {
      throw new Error(
        `${
          error_constant.Exceeded_MaximumMine
        } "options.sweepingNumber" 雷数量最大为 ${
          this.#initConfig.size.x * this.#initConfig.size.y
        }，而你提供了 ${this.#initConfig.sweepingNumber}`
      );
    }

    // 创建一个x长y高的二维数组
    const initArr = [];
    for (let i = 0; i < this.#initConfig.size.y; i++) {
      initArr[i] = [];
      for (let j = 0; j < this.#initConfig.size.x; j++) {
        initArr[i][j] = {
          // 周围数量
          surroundingCount: 0,
          // 是否被查看
          look: false,
          // 是否被标记
          flag: false,
          // 是否是雷
          mine: false,
          x: j,
          y: i,
        };
      }
    }

    // 给雷周围的所有数+1
    const plus = (array, x, y) => {
      const { x: initX, y: initY } = this.#initConfig.size;
      if (x >= 0 && x < initX && y >= 0 && y < initY) {
        if (!array[y][x].mine) {
          array[y][x].surroundingCount += 1;
        }
      }
    };

    // 随机生成雷，替换原来的0
    const createdSweeping = (array, count) => {
      let x = Math.floor(Math.random() * this.#initConfig.size.x);
      let y = Math.floor(Math.random() * this.#initConfig.size.y);
      // 如果与后续生成的重复了，则重新生成 (可优化)
      if (!array[y][x].mine) {
        count -= 1;
        array[y][x].mine = true;
        array[y][x].surroundingCount = 9;
        // 上下 6 个
        for (let i = -1; i < 2; i++) {
          plus(array, x - 1, y + i);
          plus(array, x + 1, y + i);
        }
        // 左右 2 个
        plus(array, x, y + 1);
        plus(array, x, y - 1);
      } else {
        this.#initConfig.createMineRetryNumber += 1;
      }

      if (count > 0) {
        createdSweeping(array, count);
      }
    };

    createdSweeping(initArr, this.#initConfig.sweepingNumber);
    const pa = new Proxy(initArr, {
      set() {},
    });

    Object.defineProperty(this.#initConfig, "gameData", {
      enumerable: false,
      get() {
        return initArr;
        // const d = window.prompt("确定要查看吗");
        // if (d !== null) {
        //   return pa;
        // }
      },
    });
    return initArr;
  }

  #initView(array) {
    // 创建行
    const createRow = () => {
      const RowEl = document.createElement("div");
      RowEl.classList.add("mine-row");
      return RowEl;
    };
    // 创建小方块
    const createItem = () => {
      const ItemEl = document.createElement("div");
      ItemEl.classList.add("mine-item");
      return ItemEl;
    };

    // 创建父容器
    const rootEl = document.createElement("div");
    rootEl.classList.add("mine-root");
    for (let i = 0; i < array.length; i++) {
      const row = array[i];
      const rowEl = createRow();
      for (let j = 0; j < row.length; j++) {
        const item = row[j];
        const itemEl = (item.el = createItem());
        if (this.#initConfig.revealNumber) {
          itemEl.innerText = item.surroundingCount;
        }
        if (this.#initConfig.revealMine && item.mine) {
          itemEl.setAttribute("data-icon-mine", true);
        }
        itemEl.mineGame = {
          x: j,
          y: i,
        };
        rowEl.appendChild(itemEl);
      }
      rootEl.appendChild(rowEl);
    }
    this.#initConfig.gameEl = rootEl;
    this.#initConfig.el.innerHTML = "";
    this.#initConfig.el.appendChild(rootEl);
  }

  #makeWhite(evt) {
    if (evt) {
      const { x, y, surroundingCount, look, flag, el } = evt;
      // 边界处理
      if (
        x <= this.#initConfig.size.x - 1 &&
        y <= this.#initConfig.size.y - 1 &&
        x >= 0 &&
        y >= 0
      ) {
        requestIdleCallback(() => {
          // 只有沒有被查看的、单元格未被右键标记的、数组该位标识是0的（周围没有雷）、才能进行连续消除
          if (!look && !flag && surroundingCount === 0) {
            evt.look = true;
            el.setAttribute("data-state", surroundingCount);
            return this.#showNoMine(evt);
          }

          // 往外一层显示 (<9的所有方块)
          if (!look && surroundingCount < 9) {
            evt.look = true;
            el.innerText = surroundingCount;
            el.setAttribute("data-state", surroundingCount);
          }
        });
      }
    }
  }

  #getItem(x, y) {
    if (
      x <= this.#initConfig.size.x - 1 &&
      y <= this.#initConfig.size.y - 1 &&
      x >= 0 &&
      y >= 0
    ) {
      return this.#initConfig.gameData[y][x];
    }
    return null;
  }

  // 扫描单元格周围的8个单元格进行消除白色
  #showNoMine(evt) {
    const { x, y } = evt;
    this.#makeWhite(this.#getItem(x + 1, y));
    this.#makeWhite(this.#getItem(x - 1, y));
    this.#makeWhite(this.#getItem(x, y + 1));
    this.#makeWhite(this.#getItem(x, y - 1));
    // this.#makeWhite(this.#getItem(x - 1, y + 1));
    // this.#makeWhite(this.#getItem(x - 1, y - 1));
    // this.#makeWhite(this.#getItem(x + 1, y + 1));
    // this.#makeWhite(this.#getItem(x + 1, y - 1));
  }

  #initClick() {
    const mineClickHandler = (e) => {
      e.stopPropagation();
      if (e.target.classList.contains("mine-item")) {
        const { x, y } = e.target.mineGame;
        const currentItemMineData = this.#getItem(x, y);
        // 被标记了、被查看了不可再点
        if (currentItemMineData.flag || currentItemMineData.look) {
          return;
        }

        this.#event.clickHandler && this.#event.clickHandler(currentItemMineData);
        this.#initConfig.time.change.push({
          time: Date.now(),
          type: time_change.click,
          event: {
            ...currentItemMineData,
          },
        });

        // 触发雷, 失败结束
        if (currentItemMineData.mine) {
          this.overGame();
          this.#initConfig.gameStatus = game_state.fail;
          return;
        }

        // 空地， 清空所有连着的空地
        if (currentItemMineData.surroundingCount === 0) {
          this.#makeWhite(currentItemMineData);
          return;
        }

        // 非雷非空地
        if (
          !currentItemMineData.mine &&
          currentItemMineData.surroundingCount !== 0
        ) {
          currentItemMineData.look = true;
          currentItemMineData.el.innerText = currentItemMineData.surroundingCount;
          currentItemMineData.el.setAttribute("data-state", currentItemMineData.surroundingCount);
        }
      }
    };
    this.#handler.click = mineClickHandler;
    this.#initConfig.gameEl.addEventListener("click", mineClickHandler);
  }

  #initDblclick() {
    const mineDblclickHandler = (e) => {
      e.stopPropagation();
      if (e.target.classList.contains("mine-item")) {
        const { x, y } = e.target.mineGame;
        const currentItemMineData = this.#getItem(x, y);
        // 被标记了 不可再点
        if (currentItemMineData.flag) {
          return;
        }

        this.#event.dblclickHandler && this.#event.dblclickHandler(currentItemMineData);
        this.#initConfig.time.change.push({
          time: Date.now(),
          type: time_change.dblclick,
          event: {
            ...currentItemMineData,
          },
        });

        let excludeMine = true;
        // 检测周围8格是否雷被标记或没有雷
        const side1 = this.#getItem(x + 1, y);
        const side2 = this.#getItem(x - 1, y);
        const side3 = this.#getItem(x, y + 1);
        const side4 = this.#getItem(x, y - 1);
        const side5 = this.#getItem(x - 1, y + 1);
        const side6 = this.#getItem(x - 1, y - 1);
        const side7 = this.#getItem(x + 1, y + 1);
        const side8 = this.#getItem(x + 1, y - 1);
        if (
          (side1?.mine && !side1?.flag) ||
          (side2?.mine && !side2?.flag) ||
          (side3?.mine && !side3?.flag) ||
          (side4?.mine && !side4?.flag) ||
          (side5?.mine && !side5?.flag) ||
          (side6?.mine && !side6?.flag) ||
          (side7?.mine && !side7?.flag) ||
          (side8?.mine && !side8?.flag)
        ) {
          excludeMine = false;
        }
        // 排雷
        if (excludeMine) {
          side1?.el.click();
          side2?.el.click();
          side3?.el.click();
          side4?.el.click();
          side5?.el.click();
          side6?.el.click();
          side7?.el.click();
          side8?.el.click();
          this.#initConfig.time.change.push({
            time: Date.now(),
            type: time_change.eliminateAllDirections,
            event: {
              ...currentItemMineData,
            },
          });
        }
      }
    };
    this.#handler.dblclick = mineDblclickHandler;
    this.#initConfig.gameEl.addEventListener("dblclick", mineDblclickHandler);
  }

  #initContextmenu() {
    // 已使用标记个数
    let flagUsedNumber = 0;
    // 标记正确的个数
    let flagCorrectNumber = 0;
    const mineContextmenuHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.classList.contains("mine-item")) {
        const { x, y } = e.target.mineGame;
        const currentItemMineData = this.#getItem(x, y);
        this.#initConfig.time.change.push({
          time: Date.now(),
          type: time_change.contextmenu,
          event: {
            ...currentItemMineData,
          },
        });

        // 被查看了的项不可点
        if (currentItemMineData.look) {
          return;
        }
        // 切换标记
        if (currentItemMineData.flag) {
          flagUsedNumber--;
          currentItemMineData.flag = false;
          currentItemMineData.el.style.color = ``;
          currentItemMineData.el.removeAttribute("data-icon-flag");
        } else {
          flagUsedNumber++;
          currentItemMineData.flag = true;
          currentItemMineData.el.style.color = `#${common.generateWideRangeHex()}`;
          currentItemMineData.el.setAttribute("data-icon-flag", true);
        }

        // 统计正确标记数量
        if (currentItemMineData.mine && currentItemMineData.flag) {
          flagCorrectNumber++;
        }
        if (currentItemMineData.mine && !currentItemMineData.flag) {
          flagCorrectNumber--;
        }
        
        this.#event.contextmenuHandler &&
          this.#event.contextmenuHandler({
            ...currentItemMineData,
            flagNumber: this.#initConfig.sweepingNumber,
            flagUsedNumber
          });

        // 全部标记，成功结束
        if (flagCorrectNumber === this.#initConfig.sweepingNumber) {
          this.overGame();
          this.#initConfig.gameStatus = game_state.finish;
        }
      }
    };
    this.#handler.contextmenu = mineContextmenuHandler;
    this.#initConfig.gameEl.addEventListener("contextmenu", mineContextmenuHandler);
  }

  // 结束，清除事件。可从实例直接调用结束（实例直接调用一定是失败结束）
  overGame() {
    this.#initConfig.time.over = Date.now();
    this.#initConfig.gameEl.removeEventListener("click", this.#handler.click);
    this.#initConfig.gameEl.removeEventListener("dblclick", this.#handler.dblclick);
    this.#initConfig.gameEl.removeEventListener("contextmenu", this.#handler.contextmenu);

    // 默认直接调用是失败状态, 防止有人从实例调用得到成功状态。
    this.#initConfig.gameStatus = game_state.fail;
    Promise.resolve().then(
      () => this.#event.overHandler && this.#event.overHandler(this.#initConfig)
    );
  }
}

export default mineSweeping;
