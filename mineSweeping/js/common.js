import { error_constant } from "./constant.js";
/**
 * 判断一个对象是否是DOM元素
 * @param {*} object
 */
export const isElement = (object) => {
  return object instanceof HTMLElement;
};

/**
 * 判断一个元素是否存在于Document上
 * @param {object|string} object
 * @returns
 */
export const isStringForDocumentElement = (object) => {
  if (object && typeof object === "string") {
    const el = document.querySelector(object);
    if (!el) {
      throw new Error(`${error_constant.Not_Find_Element} "${object}"`);
    }
    return el;
  }
  if (!isElement(object)) {
    throw new Error(`${error_constant.Not_Element} "${object}"`);
  }
  return el;
};

/**
 * 种子转十六进制
 * @param {*} seed
 * @returns
 */
export const generateConsistentHex = (seed) => {
  const base64String = window.btoa(seed);
  const base64ToHex = function (base64) {
    let hex = "";
    for (let i = 0; i < base64.length; i++) {
      const charCode = base64.charCodeAt(i);
      const hexValue = charCode.toString(16);
      hex += (hexValue.length === 1 ? "0" : "") + hexValue;
    }
    return hex;
  };

  // 返回转换后的十六进制字符串
  return base64ToHex(base64String);
};

/**
 * 生成随机十六进制
 */
export const generateWideRangeHex = () => {
  const randomInt = Math.floor(Math.random() * 0xffffff);
  const hexString = randomInt.toString(16).toUpperCase().padStart(6, "0");
  return hexString;
};

export default {
  isElement,
  isStringForDocumentElement,
  generateConsistentHex,
  generateWideRangeHex
};
