//@ts-check

import { DelayData, FieldData, EnimationData, collision, collisionClass } from "./dataField.js"
import { EffectData, CustomEffect, CustomEditEffect } from "./dataEffect.js"
import { ID } from "./dataId.js"
import { stringText } from "./text.js"
import { imageDataInfo, imageSrc } from "./imageSrc.js"
import { fieldState, fieldSystem } from "./field.js"
import { soundSrc } from "./soundSrc.js"
import { game, gameFunction } from "./game.js"
import { StatRound, dataExportStatRound } from "./dataStat.js"
import { CustomEnemyBullet, EnemyData, dataExportEnemy } from "./dataEnemy.js"
import { WeaponData } from "./dataWeapon.js"

let graphicSystem = game.graphic
let soundSystem = game.sound
let controlSystem = game.control
let digitalDisplay = gameFunction.digitalDisplay

/**
 * round 1 ~ round 2에 주로 사용되었던 배경을 표시하는 기존 코드들을 클래스화 한것입니다.
 * 
 * (예전 배경 처리 방식, 단일 배경에 최적화)
 */
class BgLegacy {
  constructor () {
    /** 배경을 표시할 기준점의 x좌표 @type {number} */ this.x = 0
    /** 배경을 표시할 기준점의 y좌표 @type {number} */ this.y = 0
    /** 해당 라운드의 기본 배경 이미지 (배경은 changeBackground를 통해 변경 가능) @type {string} */ this.imageSrc = ''
    /** 배경을 변경할 때, 화면을 부드럽게 전환하기 위한 변수(페이드 기준값) @type {number} */ this.backgroundFadeFrameMax = 120
    /** 배경을 변경할 때, 화면을 부드럽게 전환하기 위한 변수 @type {number} */ this.backgroundFadeFrame = 0
    /** 배경 이동 속도 x값 @type {number} */ this.backgroundSpeedX = 0.5
    /** 배경 이동 속도 y값 @type {number} */ this.backgroundSpeedY = 0
    /** 페이드 효과가 적용중일 때, 이전에 표시했었던 배경화면(다음 배경은 imageSrc에 등록됨) @type {string} */ this.prevBackgroundImageSrc = ''
    /** 배경색 @type {string | string[]} */ this.color = ''
    /** 현재 모드를 사용중인 경우 @type {boolean} */ this.isUsing = false
  }

  /**
   * 배경화면을 실시간으로 변경합니다. (주의: 페이드 시간이 겹쳐지면 이전 페이드 효과는 무시함.)
   * @param {string} imageSrc 변경할 배경 이미지
   * @param {number} fadeFrame 배경화면이 전환되는 시간(프레임)
   */
  changeImage (imageSrc, fadeFrame = 0) {
    this.prevBackgroundImageSrc = this.imageSrc
    this.imageSrc = imageSrc
    this.backgroundFadeFrameMax = fadeFrame
    this.backgroundFadeFrame = fadeFrame
  }

  process () {
    if (this.backgroundFadeFrame >= 1) {
      this.backgroundFadeFrame--
    }

    if (this.imageSrc == null) return
    let image = graphicSystem.getCacheImage(this.imageSrc)
    
    this.x += this.backgroundSpeedX
    this.y += this.backgroundSpeedY
    // 화면 전환 프레임이 동작중이라면, 배경화면의 길이를 초과해도 좌표가 자동으로 조절되지 않습니다.
    // 이것은 배경 사이즈가 다른 화면 전환을 부드럽게 하기 위해서입니다.
    if (this.backgroundFadeFrame > 0) return
    if (image == null) return

    if (this.x > image.width) {
      this.x -= image.width
    } else if (this.x < 0) {
      this.x += image.width
    }

    if (this.y > image.height) {
      this.y -= image.height
    } else if (this.y < 0) {
      this.y += image.height
    }
  }

  display () {
    if (this.imageSrc === '' && this.color === '') return

    if (typeof this.color === 'string' && this.color !== '') {
      graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, this.color)
    } else if (Array.isArray(this.color)) {
      graphicSystem.gradientRect(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, this.color)
    }

    if (this.backgroundFadeFrame >= 1) {
      let current = this.imageSrc
      let prev = this.prevBackgroundImageSrc
      let prevAlpha = (1 / this.backgroundFadeFrameMax) * this.backgroundFadeFrame
      let originalAlpha = 1 - prevAlpha
       
      // 투명도를 페이드 하는 방식으로, 배경 전환을 구현합니다. 
      graphicSystem.setAlpha(originalAlpha)
      this.displayBackground(current)
      graphicSystem.setAlpha(prevAlpha)
      this.displayBackground(prev)
      graphicSystem.setAlpha(1)

      if (this.backgroundFadeFrame === 0) {
        this.prevBackgroundImageSrc = ''
      }
    } else {
      this.displayBackground()
    }
  }

   /**
   * 배경 이미지를 출력합니다.
   * 
   * 참고: 이 함수는 원하는 위치에 배경에 출력되는게 아닌, background 변수값에 의해 배경이 처리되므로,
   * 다른 위치에 추가적인 배경을 출력하기 위해서는 garphicSystem의 imageDisplay 함수를 직접 사용해 이미지를 수동으로 출력해야 합니다.
   * 
   * @param {string} imageSrc 이미지 파일 (입력시 해당 배경 이미지를 사용, 이게 없으면 기본 이미지 배경 사용)
   */
  displayBackground (imageSrc = '') {
    let targetSrc = (imageSrc === '') ? this.imageSrc : imageSrc
    graphicSystem.backgroundDisplay(targetSrc, this.x, this.y)
  }

  /**
   * 배경 이미지를 출력합니다. (이 함수는 기존의 코드를 보존하기 위해 만들어졌지만, 나중에 삭제될 가능성이 높습니다.)
   * 
   * @deprecated
   * @param {string} imageSrc 이미지 파일 (입력시 해당 배경 이미지를 사용, 이게 없으면 기본 이미지 배경 사용)
   */
  displayBackgroundLegacy (imageSrc = '') {
    // 배경화면 이미지 출력 및 스크롤 효과, 배경이 없으면 아무것도 출력 안함.
    let targetSrc = (imageSrc === '') ? this.imageSrc : imageSrc
    let image = graphicSystem.getCacheImage(targetSrc)
    if (image == null) return

    let imageWidth = image.width
    let imageHeight = image.height
    let canvasWidth = graphicSystem.CANVAS_WIDTH
    let canvasHeight = graphicSystem.CANVAS_HEIGHT
    let imageX = this.x
    let imageY = this.y

    // 이미지의 길이 초과시, 이미지 X 좌표 변경
    if (imageX > imageWidth) {
      imageX = imageX % imageWidth
    } else if (imageX < 0) { // 만약 이미지가 음수좌표면 자연스러운 스크롤이 되기 위해 이미지 X좌표 변경
      imageX = imageWidth - Math.abs(imageX % imageWidth)
    }

    // 이미지의 너비 초과시, 이미지 Y 좌표 변경
    if (imageY > imageHeight) {
      imageY = imageY % imageHeight
    } else if (imageY < 0) { // 만약 이미지가 음수좌표면 자연스러운 스크롤이 되기 위해 이미지 Y좌표 변경
      imageY = imageHeight - Math.abs(imageY % imageHeight)
    }

    if (imageX === 0 && imageY === 0) {
      // 백그라운드의 좌표가 (0, 0) 일 때
      // 참고: 이미지 크기를 전부 출력하는것이 아닌, 캔버스의 크기로만 출력됩니다.
      // 캔버스보다 이미지가 작다면 나머지 부분은 그려지지 않습니다.
      graphicSystem.imageDisplay(image, 0, 0, canvasWidth, canvasHeight, imageX, imageY, canvasWidth, canvasHeight)
    } else if (imageX !== 0 && imageY === 0) {
      // x축 좌표가 0이 아니고 y축 좌표가 0일 때 (수평 스크롤 포함)
      // 만약 x축과 출력길이가 이미지 길이를 초과하면 배경을 2번에 나누어 출력됩니다.
      if (imageX + canvasWidth >= imageWidth) {
        let screenAWidth = imageWidth - imageX
        let screenBWidth = canvasWidth - screenAWidth
        graphicSystem.imageDisplay(image, imageX, 0, screenAWidth, canvasHeight, 0, 0, screenAWidth, canvasHeight)
        graphicSystem.imageDisplay(image, 0, 0, screenBWidth, canvasHeight, screenAWidth, 0, screenBWidth, canvasHeight)
      } else {
        // 출력길이가 초과하지 않는다면, 좌표에 맞게 그대로 출력
        graphicSystem.imageDisplay(image, imageX, imageY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)
      }
    } else if (imageX === 0 && imageY !== 0) {
      // y축 좌표가 0이 아니고 x축 좌표는 0일 때 (수직 스크롤 포함)
      // 스크롤 원리는 x축과 동일하다.
      if (imageY + canvasHeight >= imageHeight) {
        let screenAHeight = imageHeight - imageY
        let screenBHeight = canvasHeight - screenAHeight
        graphicSystem.imageDisplay(image, 0, imageY, canvasWidth, screenAHeight, 0, 0, canvasWidth, screenAHeight)
        graphicSystem.imageDisplay(image, 0, 0, canvasWidth, screenBHeight, 0, screenAHeight, canvasWidth, screenBHeight)
      } else {
        // 출력길이가 초과하지 않는다면, 좌표에 맞게 그대로 출력
        graphicSystem.imageDisplay(image, imageX, imageY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)
      }
    } else {
      // x축과 y축이 모두 0이 아닌경우, (수직 + 수평 스크롤)
      // 만약 어느 축도 이미지의 길이를 초과하지 않았다면, 그대로 이미지를 출력합니다.
      if (imageX + canvasWidth <= imageWidth && imageY + canvasHeight <= imageHeight) {
        graphicSystem.imageDisplay(image, imageX, imageY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)
      } else {
        // 어느 쪽도 초과라면 4번에 나누어져 출력
        let screenBaseWidth = imageWidth - imageX
        let screenBaseHeight = imageHeight - imageY
        let screenExtendWidth = canvasWidth - screenBaseWidth
        let screenExtendHeight = canvasHeight - screenBaseHeight

        // 오류 방지를 위해 이미지를 자르는 사이즈가 0이 되지 않도록 조건을 정한 후 출력
        // 첫번째 기본 이미지
        if (screenBaseWidth !== 0 || screenBaseHeight !== 0) {
          graphicSystem.imageDisplay(image, imageX, imageY, screenBaseWidth, screenBaseHeight, 0, 0, screenBaseWidth, screenBaseHeight)
        }

        // 두번째 x축 이미지 (첫번째 이미지를 기준으로 X축의 다른 위치[이미지가 스크롤 하면서 잘린 지점])
        if (imageX + canvasWidth >= imageWidth && screenBaseWidth !== 0) {
          graphicSystem.imageDisplay(image, 0, imageY, screenExtendWidth, screenBaseHeight, screenBaseWidth, 0, screenExtendWidth, screenBaseHeight)
        } else if (screenBaseWidth === 0) {
          graphicSystem.imageDisplay(image, 0, imageY, screenExtendWidth, screenBaseHeight, 0, 0, screenExtendWidth, screenBaseHeight)
        }

        // 세번째 y축 이미지 (첫번째 이미지를 기준으로 Y축 다른 위치[이미지가 스크롤 하면서 잘린 지점])
        if (imageY + canvasHeight >= imageHeight && screenBaseHeight !== 0) {
          graphicSystem.imageDisplay(image, imageX, 0, screenBaseWidth, screenExtendHeight, 0, screenBaseHeight, screenBaseWidth, screenExtendHeight)
        } else if (screenBaseHeight === 0) { // 만약 baseHeight가 0이라면, x, 0 위치에 출력합니다.
          graphicSystem.imageDisplay(image, imageX, 0, screenBaseWidth, screenExtendHeight, 0, 0, screenBaseWidth, screenExtendHeight )
        }

        // 네번째 x, y축 이미지 (첫번째 이미지를 기준으로 대각선에 위치)
        if (screenBaseWidth !== 0 && screenBaseHeight !== 0) {
          graphicSystem.imageDisplay(image, 0, 0, screenExtendWidth, screenExtendHeight, screenBaseWidth, screenBaseHeight, screenExtendWidth, screenExtendHeight)
        } else if (screenBaseWidth === 0 && screenBaseHeight !== 0) { // width(가로축)만 0인 경우
          graphicSystem.imageDisplay(image, 0, 0, screenExtendWidth, screenExtendHeight, 0, screenBaseHeight, screenExtendWidth, screenExtendHeight)
        } else if (screenBaseWidth !== 0 && screenBaseHeight === 0) { // height(세로축)만 0인 경우
          graphicSystem.imageDisplay(image, 0, 0, screenExtendWidth, screenExtendHeight, screenBaseWidth, 0, screenExtendWidth, screenExtendHeight)
        } else if (screenBaseWidth === 0 && screenBaseHeight === 0) { // 둘 다 0인 경우
          graphicSystem.imageDisplay(image, 0, 0, screenExtendWidth, screenExtendHeight, 0, 0, screenExtendWidth, screenExtendHeight)
        }
      }
    }
  }
}

/**
 * roundSystem에서 사용하는 background(배경)을 결정하기 위한 클래스
 * 
 * round 2가 완성된 이후 만들어졌으며, round 2중 일부는 이 코드로 교체되었습니다.
 */
class BgLayer {
  /**
   * BgLayer 클래스에서 사용하는 레이어 확장 클래스
   * 
   * 참고: BgLayer랑 BgLegacy랑 동시에 사용할 수는 없습니다. (내부적으로 bgLayer.isUsing이 true일경우 bgLayer로 배경을 그립니다.)
   */
  static _Layer = class {
    /**
     * 새 레이어를 생성합니다.
     * @param {string} imageSrc 이미지의 경로
     * @param {number} alpha 알파값 (자세한건 graphicSystem의 setAlpha 함수 참고)
     */
    constructor (imageSrc, alpha = 1) {
      /** 이미지의 경로 @type {string} */ this.imageSrc = imageSrc
      /** 이미지의 알파값 @type {number} */ this.alpha = alpha
      /** 알파값을 fade 하는데 지정된 딜레이 @type {number} */ this.alphaDelay = 0
      /** 알파값을 fade 하는데 딜레이 카운트를 세는 변수 @type {number} */ this.alphaDelayCount = 0
      /** 알파값 페이드의 시작지점 @type {number} */ this.alphaStart = 0
      /** 알파값 페이드의 끝지점 (참고: 이 데이터는 알파 최종값을 표시하기도 하기 때문에 저장되는 알파값의 기준으로 사용됩니다.) @type {number} */ this.alphaEnd = alpha
      /** 레이어 자체의 x좌표 (참고: isSynchroized가 false때만 제대로 동작합니다.) @type {number} */ this.x = 0
      /** 레이어 자체의 y좌표 (참고: isSynchroized가 false때만 제대로 동작합니다.) @type {number} */ this.y = 0
      /** 레이어 자체의 이동속도 x값 (참고: isSynchroized가 false때만 제대로 동작합니다.) @type {number} */ this.speedX = 0
      /** 레이어 자체의 이동속도 y값 (참고: isSynchroized가 false때만 제대로 동작합니다.) @type {number} */ this.speedY = 0
      /** 레이어 이미지의 너비 @type {number} */ this.width = 0
      /** 레이어 이미지의 높이 @type {number} */ this.height = 0
      /** 레이어의 배경 동기화 여부 @type {boolean} */ this.isSynchronized = true
    }

    /**
     * 해당 레이어를 페이드 시킵니다. (페이드 인 아웃은 구분하지 않으며 단지 알파값만을 변화시킵니다.)
     * @param {number} alpha 페이드 완료시점의 알파값
     * @param {number} delay 페이드 완료가 될 때까지 걸리는 지연 프레임
     */
    fadeAlpha (alpha = 0, delay = 60) {
      this.alphaStart = this.alpha
      this.alphaEnd = alpha
      this.alphaDelay = delay
      this.alphaDelayCount = 0
    }

    /** 
     * 해당 레이어의 알파값을 설정합니다. (페이드 효과를 사용하고 싶다면 fadeAlpha 함수 참고)
     * 
     * 버그 방지를 위해서 페이드 진행중인 경우에는 페이드를 무시하고 해당 알파값을 바로 적용합니다.
     */
    setAlpha (alpha = 1) {
      this.alpha = alpha
      this.alphaEnd = alpha
      this.alphaDelay = 0
      this.alphaDelayCount = 0
    }

    process () {
      // 동기화가 아닌 상태에서는 이 좌표가 내부적으로 변경되지 않습니다.
      if (!this.isSynchronized) {
        this.x += this.speedX
        this.y += this.speedY

        // 이미지 너비 또는 높이가 0이라면, 이미지를 가져와 크기를 다시 확인합니다.
        if (this.width === 0 || this.height === 0) {
          let image = graphicSystem.getCacheImage(this.imageSrc)
          if (image != null) {
            this.width = image.width
            this.height = image.height
          }
        }
  
        // 배경의 위치가 캔버스의 크기를 벗어나는 경우 배경의 위치를 재조정 합니다.
        if (this.x >= this.width) this.x -= this.width
        else if (this.x < 0) this.x += this.width
  
        if (this.y >= this.height) this.y -= this.height
        else if (this.y < 0) this.y += this.height
      }

      if (this.alphaDelay >= 1) {
        let changeAlpha = Math.abs(this.alphaEnd - this.alphaStart) * this.alphaDelayCount / this.alphaDelay
        if (this.alphaStart < this.alphaEnd) {
          this.alpha = this.alphaStart + changeAlpha
        } else {
          this.alpha = this.alphaStart - changeAlpha
        }

        // 알파딜레이 카운트 수 증가
        this.alphaDelayCount++

        // 알파딜레이가 기준값을 넘어갈경우 페이드 효과를 종료하고 알파 딜레이를 제거
        if (this.alphaDelayCount >= this.alphaDelay) {
          this.alpha = this.alphaEnd
          this.alphaDelay = 0
        }
      }
    }
  }

  /** 배경 화면 내부의 이미지 (로딩 확인을 위해 사용) */
  static _Background = class {
    /**
     * 배경 이미지 (참고로 배경은 로딩이 완료되어야 표시됩니다. (그렇지 않으면 그려지지 않음))
     * 
     * @param {string} imageSrc 이미지의 경로
     * @param {number} x x좌표
     * @param {number} y y좌표
     */
    constructor (imageSrc, x, y) {
      this.imageSrc = imageSrc
      this.x = x
      this.y = y
      this.width = 0
      this.height = 0
    }
  }

  /** 스크롤이 가능한 그라디언트 배경 (color랑 다른 개념) */
  static _BackGradient = class {
    /**
     * 스크롤이 가능한 그라디언트 배경을 생성합니다.
     * @param {string} startColor 시작 색
     * @param {string} endColor 끝 색
     * @param {number} x x좌표
     * @param {number} y y좌표
     * @param {number} width 너비
     * @param {number} height 높이
     * @param {boolean} isVertical 수평여부 (아닐경우 수직)
     */
    constructor (startColor, endColor, x, y, width, height, isVertical) {
      this.startColor = startColor
      this.endColor = endColor
      this.x = x
      this.y = y
      this.width = width
      this.height = height
      this.isVertical = isVertical
    }
  }

  constructor () {
    /** 배경을 표시할 기준점의 x좌표 @type {number} */ this._x = 0
    /** 배경을 표시할 기준점의 y좌표 @type {number} */ this._y = 0
    /** 배경을 움직이는 이동속도 @type {number} */ this._speedX = 0
    /** 배경을 움직이는 이동속도 @type {number} */ this._speedY = 0
    /** 배경의 현재 너비 @type {number} */ this._width = graphicSystem.CANVAS_WIDTH
    /** 배경의 현재 높이 @type {number} */ this._height = graphicSystem.CANVAS_HEIGHT
    /** 배경의 색 (제일 처음에 출력됨) @type {string | string[]} */ this._color = ''
    /** 배경의 오프스크린 캔버스 */ this._offCanvas = new OffscreenCanvas(this._width, this._height)
    /** 배경의 오프스크린 캔버스의 컨텍스트 */ this._offContext = this._offCanvas.getContext('2d')
    /** 배경의 이미지가 존재하는경우 @type {boolean} */ this._hasBackgroundImage = false
    /** 배경의 이미지가 렌더링 된 경우 @type {boolean} */ this._isRenderComplete = false
    /** 배경의 이미지가 렌더링 중인경우 @type {boolean} */ this._isRenderRunning = false
    
    /** 클래스의 typeDef(타입 정의, 코드 힌트용)... */ class BgLayerClass extends BgLayer._Layer {}
    /** 배경 레이어 각각의 데이터 @type {BgLayerClass[]} */ this._layer = []
    /** 배경의 typeDef(타입 정의, 코드 힌트용)... */ class Background extends BgLayer._Background {}
    /** 배경의 이미지 목록 @type {Background[]} */ this._background = []
    /** 배경용 그라디언트의 typeDef */ class BackGradient extends BgLayer._BackGradient {}
    /** 배경의 그라디언트 목록 @type {BackGradient[]} */ this._backGradient = []

    /** x축 스크롤 무한루프 @type {boolean} */ this._isScroolLoopX = true
    /** y축 스크롤 무한루프 @type {boolean} */ this._isScroolLoopY = true
  }

  /** bgLayer의 layer 정보들을 저장한 정보 (background는 다른 형식으로 이미 저장되어있습니다.) */
  getSaveLayerData () {
    let str = ''
    for (let i = 0; i < this._layer.length; i++) {
      let layer = this._layer[i]
      let splitWord = i === 0 ? '' : '|' // 각 레이어를 문자열로 구분하기 위해 설정한 값
      // 첫번째 레이어 앞에는 구분자가 와야 할 필요가 없으므로, 설정하지 않음
      // 알파값은 알파 최종값(alphaEnd)만 저장합니다. 이렇게 하는 이유는, 데이터를 최소한으로 저장하기 위해서입니다.

      str += splitWord + layer.x + ' ' + layer.y + ' ' + layer.speedX + ' ' + layer.speedY + ' ' + layer.alphaEnd
    }

    return str
  }

  /** 
   * 저장된 layer 정보들을 레이어에게 입력합니다.
   * @param {string} str 저장된 문자열
   */
  setLoadLayerData (str) {
    let strArray = str.split('|')
    for (let i = 0; i < this._layer.length; i++) {
      let value = strArray[i].split(' ')
      this._layer[i].x = Number(value[0])
      this._layer[i].y = Number(value[1])
      this._layer[i].speedX = Number(value[2])
      this._layer[i].speedY = Number(value[3])
      this._layer[i].setAlpha(Number(value[4]))
    }
  }

  /** 
   * 이 모드를 사용중인지에 대한 여부를 확인합니다. 
   * 
   * 해당 모드를 사용중이라면, bgLegacy는 동작하지 않습니다.
   * @returns {boolean} 
   * */
  getIsUsing () {
    // 색깔값이 ''가 아니거나, 배경이미지가 있거나, 레이어가 0이 아니면 true
    return (this._color !== '' || this._hasBackgroundImage || this._layer.length !== 0)
  }

  /** 
   * 이미지 레이어를 추가합니다.
   * 
   * 참고사항: 레이어 개수의 제한은 없지만 성능을 위해서 너무 많은 레이어를 사용하지 마세요.
   * 그리고, 1개의 레이어 당 1개의 이미지만 사용할 수 있습니다. 레이어도 좌표에 따른 스크롤이 적용됩니다.
   * 
   * @param {string} imageSrc 추가할 이미지의 경로
   * @param {number} alphaValue 알파값 (자세한것은 GraphicSystem의 setAlpha 참고) 이 값은 페이드 용도 또는 반투명 배경 출력 용도로 사용됩니다.
   */
  addLayerImage (imageSrc, alphaValue = 1) {
    this._layer.push(new BgLayer._Layer(imageSrc, alphaValue))
  }

  /**
   * 배경 이미지를 설정합니다.
   * 
   * 이 함수에서 배경이미지를 등록하면, render 함수를 호출해서 명시적으로 렌더링 해야합니다. 또는 display 함수를 호출해서 자동으로 렌더링이 진행됩니다.
   * 
   * 렌더링 과정은 시간이 걸릴 수 있으므로, 이 함수를 분산시켜서 사용하지 마세요. (배경은 한번에 만들어 완성해야 합니다.)
   * 
   * @param {string} imageSrc 이미지파일의 경로
   * @param {number} x (배경레이어) 배경이 위치할 x좌표
   * @param {number} y (배경레이어) 배경이 위치할 y좌표
   */
  setBackgroundImage (imageSrc, x = 0, y = 0) {
    // 내부적으로 배경 추가
    this._background.push(new BgLayer._Background(imageSrc, x, y))

    // 배경이 등록된경우 이 값을 변경하여, 배경이 있을때에만 배경을 출력합니다.
    this._hasBackgroundImage = true

    this.renderReset()
  }

  /** 
   * 배경화면 무한루프 여부 설정 (무한루프가 되지 않을경우, 더이상 스크롤되지 않고 멈춥니다.)
   * 
   * 참고: 동기화 되지 않는 레이어는 이 설정을 무시합니다.
   * @param {boolean} isScroolLoopX x축 스크롤 무한루프
   * @param {boolean} isScroolLoopY y축 스크롤 무한루프
   */
  setBackgroundScroolLoop (isScroolLoopX, isScroolLoopY) {
    this._isScroolLoopX = isScroolLoopX
    this._isScroolLoopY = isScroolLoopY
  }

  /** 렌더링 확인 변수 재조정 (참고: 배경을 수정할때만 렌더링을 다시 합니다.) */
  renderReset () {
    // 렌더링 완료여부를 다시 false로 변경 (다시 그려야 하므로)
    this._isRenderComplete = false
    this._isRenderRunning = false
  }

  /**
   * 배경과 레이어를 강제로 동기화합니다.
   * 
   * 참고: 동기화를 해제하려면 각 레이어의 속도를 조절하거나 또는 좌표를 변경하면 해당 레이어는 자동으로 동기화를 해제합니다.
   */
  setBackgroundSynchronize () {
    for (let i = 0; i < this._layer.length; i++) {
      this._layer[i].x = this._x
      this._layer[i].y = this._y
      this._layer[i].isSynchronized = false
    }
  }

  /**
   * 특정 레이어의 좌표값 및 속도를 변경합니다. (참고: 좌표가 이미지 범위보다 클 경우 좌표는 자동으로 조정됩니다.)
   * 
   * 이 함수를 실행하는 순간, 지정된 레이어는 동기화가 해제되고 독자적으로 좌표와 속도를 계산하게 됩니다.
   * 따라서, 속도 설정을 하지 않는다면, 해당 레이어는 이동하지 않습니다.
   * 
   * @param {number} layerNumber 레이어의 번호 (레이어를 생성한 순서대로 0번부터 시작합니다.)
   * @param {number} x 변경할 x좌표
   * @param {number} y 변경할 y좌표
   */
  setLayerPosition (layerNumber, x = this._x, y = this._y) {
    if (layerNumber >= this._layer.length) return

    this._layer[layerNumber].x = x
    this._layer[layerNumber].y = y
    this._layer[layerNumber].isSynchronized = false
  }

  /**
   * 특정 레이어의 이동속도를 설정합니다. 이것을 사용하면 레이어는 동기화가 해제되고, 독자적으로 움직입니다.
   * @param {number} layerNumber 레이어의 번호 (레이어를 생성한 순서대로 0번부터 시작합니다.)
   * @param {number} speedX x 좌표 이동속도
   * @param {number} speedY y 좌표 이동속도
   */
  setLayerSpeed (layerNumber, speedX, speedY) {
    this._layer[layerNumber].speedX = speedX
    this._layer[layerNumber].speedY = speedY
    this._layer[layerNumber].isSynchronized = false
  }

  /** 
   * 특정 레이어의 알파값을 설정합니다. (레이어의 동기화는 해제되지 않습니다.)
   * @param {number} layerNumber 레이어의 번호
   * @param {number} alpha 알파값
   */
  setLayerAlpha (layerNumber, alpha) {
    if (layerNumber >= this._layer.length) return
    this._layer[layerNumber].setAlpha(alpha)
  }

  /**
   * 특정 레이어에 알파값을 페이드 형태로 적용 (레이어의 동기화는 해제되지 않습니다.)
   * @param {number} layerNumber 레이어의 번호
   * @param {number} alphaEnd 알파값 (페이드가 종료된 시점의)
   * @param {number} fadeFrame 페이드 진행 프레임(60프레임 = 1초)
   */
  setLayerAlphaFade (layerNumber, alphaEnd, fadeFrame) {
    if (layerNumber >= this._layer.length) return
    this._layer[layerNumber].fadeAlpha(alphaEnd, fadeFrame)
  }

  /** 
   * 모든 레이어의 정보를 가져옵니다.
   * 
   * 이 정보를 이용하여 레이어의 알파값을 수정하거나 레이어의 좌표 또는 이미지를 변경할 수 있습니다.
   */
  getLayer () {
    return this._layer
  }

  /** 
   * 특정 레이어의 정보를 가져옵니다. (인수를 입력하지 않으면 0번 레이어를 가져옵니다.)
   * 
   * 이 정보를 이용하여 레이어의 알파값을 수정하거나 레이어의 좌표 또는 이미지를 변경할 수 있습니다.
   * @param {number} [layerNumber] 레이어의 번호: 기본값 0
   */
  getLayerNumber (layerNumber = 0) {
    return this._layer[layerNumber]
  }

  /**
   * 스크롤이 가능한 그라디언트 배경을 생성합니다. startColor와 endColor가 같다면 그라디언트 대신 단색 사각형을 출력합니다.
   * 
   * 참고로 이미지보다 먼저 출력됩니다.
   * 
   * 이 함수는 setBackgroundImage와 같은 원리로 동작합니다.
   * @param {string} startColor 시작 색
   * @param {string} endColor 끝 색
   * @param {number} x x좌표
   * @param {number} y y좌표
   * @param {number} width 너비
   * @param {number} height 높이
   * @param {boolean} isVertical 수평 여부 (아닐경우 수직방향)
   */
  setBackgroundGadient (startColor, endColor, x, y, width, height, isVertical) {
    this._backGradient.push(new BgLayer._BackGradient(startColor, endColor, x, y, width, height, isVertical))

    // 그라디언트도 배경으로 처리하기 때문에 배경이 등록된것으로 처리됩니다.
    this._hasBackgroundImage = true

    this.renderReset()
  }

  /**
   * 배경의 색을 설정합니다. (그라디언트 적용 가능)
   * 
   * 주의: setBackgadient랑 방식이 완전히 다르며, 이 색은 모든 배경 중 맨 먼저 출력되는 색입니다. (배경보다 더 이전 레이어임)
   * 
   * @param {string | string[]} color 
   */
  setColor (color) {
    this._color = color
  }

  /** 배경 로딩이 완료되었는지의 대한 여부 */
  backgroundLoadCheck () {
    let loadingComplete = true
    for (let i = 0; i < this._background.length; i++) {
      let image = graphicSystem.getCacheImage(this._background[i].imageSrc)
      if (image == null || !image.complete) {
        loadingComplete = false
        break
      } else if (image != null && image.width === 0) {
        throw new Error('round background error: incoreect image, because image size is 0')
      }
    }

    return loadingComplete
  }

  /**
   * 출력 함수(display)와는 다릅니다. (렌더링 하지만 출력하지 않습니다.)
   * 
   * 배경을 렌더링 합니다. 
   * (이 함수를 사용하지 않아도 display 함수를 사용하는 순간 배경은 자동으로 렌더링되지만 로딩을 하는 시점이 달라질 수 있습니다.)
   */
  BackgroundRender () {
    // 렌더링이 완료되거나 진행중인경우 렌더링을 다시 하지 않습니다. (무한 렌더링 방지)
    if (this._isRenderComplete) return
    if (this._isRenderRunning) return

    // 로딩이 완료되지 않으면 다시 한번 렌더함수를 호출합니다.
    // 재귀 호출하는 방식이지만, 함수를 호출 후 return문을 통해 로딩이 완료되었을 때 함수가 반복호출되지 않습니다.
    if (!this.backgroundLoadCheck()) {
      setTimeout(() => this.BackgroundRender(), 100)
      return
    }

    if (this._isRenderRunning) return // 만약 setTimeout이 여러번 호출되어 렌더링이 연속적으로 진행된다면 이후 렌더링은 무시됩니다.
    this._isRenderRunning = true // 렌더링을 진행 중으로 변경

    // 캔버스 크기 자동 측정 (캔버스의 크기가 변경될 때마다 캔버스가 리셋되므로, 다시 그려야 합니다.)
    for (let i = 0; i < this._backGradient.length; i++) {
      let bg = this._backGradient[i]
      if (bg.x + bg.width > this._width) this._width = bg.x + bg.width
      if (bg.y + bg.height > this._height) this._height = bg.y + bg.height
    }

    for (let i = 0; i < this._background.length; i++) {
      let image = graphicSystem.getCacheImage(this._background[i].imageSrc)
      if (image == null) continue
      let bg = this._background[i]
      this._background[i].width = image.width
      this._background[i].height = image.height
      
      if (bg.x + bg.width > this._width) this._width = bg.x + bg.width
      if (bg.y + bg.height > this._height) this._height = bg.y + bg.height
    }

    // 캔버스 크기 변경
    this._offCanvas.width = this._width
    this._offCanvas.height = this._height

    // 그라디언트 그리기 (그라디언트는 로딩과정이 필요 없습니다.)
    for (let i = 0; i < this._backGradient.length; i++) {
      if (this._offContext != null) {
        let bg = this._backGradient[i]
        if (bg.startColor !== bg.endColor) {
          // 수직, 수평에 따라 그라디언트 기준점 변경 (출력좌표는 동일)
          let startX = bg.isVertical ? bg.x : bg.x + Math.floor(bg.width / 2)
          let startY = bg.isVertical ? bg.y + Math.floor(bg.height / 2) : bg.y
          let endX = bg.isVertical ? bg.x + bg.width: bg.x + Math.floor(bg.width / 2)
          let endY = bg.isVertical ? bg.y + Math.floor(bg.height / 2) : bg.y + bg.height
          let gradient = this._offContext.createLinearGradient(startX, startY, endX, endY)
          gradient.addColorStop(0, bg.startColor)
          gradient.addColorStop(1, bg.endColor)
          this._offContext.fillStyle = gradient
        } else {
          this._offContext.fillStyle = bg.startColor          
        }

        this._offContext.fillRect(bg.x, bg.y, bg.width, bg.height)
      }
    }

    // 배경을 오프스크린에 그리고 캔버스의 크기를 다시 측정합니다.
    for (let i = 0; i < this._background.length; i++) {
      let image = graphicSystem.getCacheImage(this._background[i].imageSrc)
      if (image == null) continue

      // 배경을 오프스크린에 그립니다.
      if (this._offContext != null) {
        this._offContext.drawImage(image, this._background[i].x, this._background[i].y)
      }
    }

    // 렌더링 완료
    this._isRenderComplete = true
  }

  /**
   * 배경의 너비와 높이를 설정합니다. 기본값은 현재 캔버스 사이즈랑 동일합니다.
   * 
   * 캔버스의 크기 자체는 자동으로 설정되지만, 배경 위치를 세이브해야 하기 때문에, 
   * 라운드 데이터를 불러왔을 때는 이 함수로 캔버스의 크기를 강제로 설정해야 합니다.
   * 
   * (만약 스크롤을 허용하지 않으면, x, y축 위치를 불러왔을 때 캔버스의 크기를 초과하는 버그가 발생하기 때문에 로드할 때만 캔버스의 크기를 재설정해주세요.)
   * 
   * @param {number} width 
   * @param {number} height 
   */
  setBackgroundWidthHeight (width = graphicSystem.CANVAS_WIDTH, height = graphicSystem.CANVAS_HEIGHT) {
    this._width = width, this._height = height
    this._offCanvas.width = this._width
    this._offCanvas.height = this._height
  }

  /**
   * 배경의 x, y좌표를 설정합니다.
   * @param {number} x 
   * @param {number} y 
   */
  setBackgroundPosition (x, y) {
    this._x = x
    this._y = y
  }

  /** 배경의 현재 좌표를 얻어옵니다. */
  getBackgroundPosition () {
    return {x: this._x, y: this._y}
  }

  /** 배경의 현재 속도값을 얻어옵니다. */
  getBackgroundSpeed () {
    return {speedX: this._speedX, speedY: this._speedY}
  }

  getBackgroundWidthHeight () {
    return {width: this._width, height: this._height}
  }

  /**
   * 배경 이동속도를 설정합니다.
   * @param {number} speedX x좌표 이동속도
   * @param {number} speedY y좌표 이동속도
   */
  setBackgroundSpeed (speedX, speedY) {
    this._speedX = speedX
    this._speedY = speedY
  }

  /** 배경을 정해진 기준점에 맞게 출력합니다. */
  display () {
    // 아무 배경도 없으면 출력하지 않음
    if (this._color === '' && !this._hasBackgroundImage && this._layer.length === 0) return

    // 렌더링이 완료되지 않은경우 렌더 함수를 불러옵니다.
    if (!this._isRenderComplete) this.BackgroundRender()

    // 그라디언트 레이어 출력
    if (typeof this._color === 'string' && this._color !== '') {
      graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT)
    } else if (Array.isArray(this._color)) {
      graphicSystem.gradientRect(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, this._color)
    }

    // 캔버스의 크기가 커도 이미지는 잘려서 표현되므로 성능 걱정은 할 필요가 없습니다.
    if (this._hasBackgroundImage) {
      graphicSystem.backgroundDisplay(this._offCanvas, this._x, this._y)
    }

    // 레이어가 있을경우 레이어 이미지 출력 (레이어는 단일 이미지만 사용할 수 있습니다.)
    for (let i = 0; i < this._layer.length; i++) {
      if (this._layer[i].alpha === 0) continue
      if (this._layer[i].alpha !== 1) {
        graphicSystem.setAlpha(this._layer[i].alpha)
        graphicSystem.backgroundDisplay(this._layer[i].imageSrc, this._layer[i].x, this._layer[i].y)
        graphicSystem.setAlpha()
      } else {
        graphicSystem.backgroundDisplay(this._layer[i].imageSrc, this._layer[i].x, this._layer[i].y)
      }
    }
  }

  process () {
    this._x += this._speedX
    this._y += this._speedY

    // 배경의 위치가 캔버스의 크기를 벗어나는 경우 배경의 위치를 재조정 합니다.
    if (this._isScroolLoopX) {
      if (this._x >= this._width) this._x -= this._width
      else if (this._x < 0) this._x += this._width
    } else {
      // 스크롤이 무한루프되지 않으면, 마지막 지점에서 고정됨
      if (this._x < 0) this._x = 0
      if (this._x > this._width - graphicSystem.CANVAS_WIDTH) this._x = this._width - graphicSystem.CANVAS_WIDTH
    }

    if (this._isScroolLoopY) {
      if (this._y >= this._height) this._y -= this._height
      else if (this._y < 0) this._y += this._height
    } else {
      if (this._y < 0) this._y += this._width
      if (this._y > this._height - graphicSystem.CANVAS_HEIGHT) this._y = this._height - graphicSystem.CANVAS_HEIGHT
    }

    // 레이어 위치 재조정
    for (let i = 0; i < this._layer.length; i++) {
      this._layer[i].process()
      if (this._layer[i].isSynchronized) {
        this._layer[i].x = this._x
        this._layer[i].y = this._y
      }
    }
  }
}

/** soundSystem을 간편하게 사용하기 위한 함수 집합 */
class BaseSound {
  /** 음악의 오디오 경로 @type {string} */
  static musicSrc = ''

  /** 현재 음악의 오디오 경로 @type {string} */
  static currentMusicSrc = ''

  /** 불러오기 전용 변수 (음악 현재 시간) @type {number} */
  static loadCurrentMusicTime = 0

  /** 사운드를 재생합니다. */
  static play (soundSrc = '') {
    soundSystem.play(soundSrc)
  }

  /**
   * 음악을 재생합니다.
   * 
   * 참고: 저장된 게임 불러오기를 했을 때 이 함수를 사용하면, currentTime을 설정해도 무시함.
   */
  static musicPlay (start = -1) {
    // 음악이 없으면 재생하지 않음
    if (this.currentMusicSrc === '') {
      soundSystem.musicStop()
      return
    }

    if (this.loadCurrentMusicTime !== 0) {
      // 저장딘 게임 불러오기 전용 변수
      soundSystem.musicPlay(this.currentMusicSrc, this.loadCurrentMusicTime)
      
      // 현재 음악이 로딩되어있지 않아 현재 음악이 없다면, 로드된 시간 설정을 초기화하지 않습니다.
      if (soundSystem.currentMusic != null) {
        this.loadCurrentMusicTime = 0
      }
    } else if (soundSystem.getMusicPaused()) {
      if (start < 0) {
        soundSystem.musicPlay(this.currentMusicSrc)
      } else {
        soundSystem.musicPlay(this.currentMusicSrc)
      }
    }
  }

  /** 음악을 정지합니다. (재개 되기 전까지 재생 불가능) */
  static musicStop () {
    soundSystem.musicStop()
    this.currentMusicSrc = ''
  }

  /**
   * 현재 재생중인 음악을 변경합니다.
   * 
   * 만약 다음 재생 음악을 지정하지 않는다면, 음악은 정지될 수 있으므로, 음악을 다시 재생(musicPlay 사용 해야 합니다.
   * 
   * (라운드가 끝나기 전까지 재생중인 음악은 초기화되지 않습니다.)
   * @param {string} soundSrc 오디오 파일의 경로, 없을경우 현재 음악을 페이드
   * @param {number} fadeTime 페이드 시간 (초 단위)
   */
  static musicChange (soundSrc = '', fadeTime = 0) {
    this.currentMusicSrc = soundSrc
    if (fadeTime === 0) {
      soundSystem.musicPlay(soundSrc)
    } else {
      soundSystem.musicFadeNextAudio(soundSrc, fadeTime)
    }
  }

  /** 사운드를 재생합니다. */
  static soundPlay (soundSrc = '') {
    soundSystem.play(soundSrc)
  }

}

/** fieldSystem을 간편하게 사용하기 위한 함수 집합 (모든 함수는 static입니다.) */
class BaseField {
  /** 
   * 적이 아무것도 없는지 확인
   * @returns {boolean}
   */
  static enemyNothingCheck () {
    let enemy = fieldState.getEnemyObject()
    if (enemy.length <= 0) {
      return true
    } else {
      return false
    }
  }

  /** 
   * 현재 적의 수를 확인
   * @returns {number}
   */
  static getEnemyCount () {
    return fieldState.getEnemyObject().length
  }

  /**
   * 적 오브젝트를 Id 기준으로 한마리만 얻습니다. (다중 리턴은 지원되지 않음.)
   * @param {number} enemyId 적의 ID
   * @returns {EnemyData | null}
   */
  static getEnemyObjectById (enemyId) {
    let enemyObject = this.getEnemyObject()
    for (let i = 0; i < enemyObject.length; i++) {
      let enemy = enemyObject[i]
      if (enemy.id === enemyId) {
        return enemy
      }
    }

    return null
  }

  /** 적의 객체를 얻어옵니다. */
  static getEnemyObject () {
    return fieldState.getEnemyObject()
  }

  /** 플레이어를 얻어옵니다. */
  static getPlayerObject () {
    return fieldState.getPlayerObject()
  }

  /** 스프라이트를 얻어옵니다. */
  static getSpriteObject () {
    return fieldState.getSpriteObject()
  }

  /** 필드 시스템에 점수 추가를 요청합니다. */
  static addScore (score = 0) {
    fieldSystem.requestAddScore(score)
  }

  /**
   * 적을 생성합니다.
   * @param {number} enemyId 적의 ID
   * @param {number} x 
   * @param {number} y 
   */
  static createEnemy (enemyId = 0, x = graphicSystem.CANVAS_WIDTH + 50, y = Math.random() * graphicSystem.CANVAS_HEIGHT) {
    if (enemyId != 0) {
      fieldState.createEnemyObject(enemyId, x, y)
    }
  }

  /**
   * 이펙트를 생성합니다.
   * @param {CustomEffect} typeId 
   * CustomEffect 인스턴스(CustomEffect.getObject() 를 사용해주세요.)
   * 
   * 또는 CustomEditEffect 클래스 또는 생성된 인스턴스
   * @returns {EffectData | null | undefined} 리턴된 이펙트를 이용해서 일시적으로 객체를 조작할 수 있음.
   */
  static createEffect (typeId, x = 0, y = 0, repeatCount = 0, beforeDelay = 0,) {
    let effect = fieldState.createEffectObject(typeId, x, y, repeatCount, beforeDelay)
    return effect
  }
}


/** 
 * 라운드에서 사용하는 추가적인 로딩 (적과 관련해서 파일이 분산되어 이 클래스에서 대신 데이터를 불러오도록 처리함)
 * 
 * 배경은 용량이 크므로 제외, 배경음악도 제외 특정 라운드에 의존되어있는 파일도 제외 (대표적인 예: 2-3)
 * 다만, 그런 파일들은 파일 이름이 round로 시작함
 */
export class RoundPackLoad {
  /** 라운드 1에서 사용하는 적들의 공통 이미지 데이터 */
  static getRound1ShareImage () {
    return [
      // enemy
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemy.meteoriteEnemy,
      imageSrc.enemy.jemulEnemy,

      // common effect
      imageSrc.enemyDie.effectList,
    ]
  }

  /** 라운드 1에서 사용하는 적들의 사운드 데이터 */
  static getRound1ShareSound () {
    return [
      soundSrc.enemyDie.enemyDieSpaceCar,
      soundSrc.enemyDie.enemyDieSpaceComet,
      soundSrc.enemyDie.enemyDieSpaceEnergy,
      soundSrc.enemyDie.enemyDieSpaceGamjigi,
      soundSrc.enemyDie.enemyDieSpaceLight,
      soundSrc.enemyDie.enemyDieSpaceRocket,
      soundSrc.enemyDie.enemyDieSpaceSmall,
      soundSrc.enemyDie.enemyDieSpaceSquare,
      soundSrc.enemyDie.enemyDieSpaceSusong,

      soundSrc.enemyDie.enemyDieMeteorite1,
      soundSrc.enemyDie.enemyDieMeteorite2,
      soundSrc.enemyDie.enemyDieMeteorite3,
      soundSrc.enemyDie.enemyDieMeteorite4,
      soundSrc.enemyDie.enemyDieMeteorite5,
      soundSrc.enemyDie.enemyDieMeteoriteBomb,
      soundSrc.enemyDie.enemyDieMeteoriteRed,
      
      soundSrc.enemyDie.enemyDieJemulBoss,
      soundSrc.enemyDie.enemyDieJemulBossEye,
      soundSrc.enemyDie.enemyDieJemulDrill,
      soundSrc.enemyDie.enemyDieJemulEnergyBolt,
      soundSrc.enemyDie.enemyDieJemulHellAir,
      soundSrc.enemyDie.enemyDieJemulHellShip,
      soundSrc.enemyDie.enemyDieJemulRedAir,
      soundSrc.enemyDie.enemyDieJemulRedJewel,
      soundSrc.enemyDie.enemyDieJemulRocket,
      soundSrc.enemyDie.enemyDieJemulSpike,

      soundSrc.enemyDie.enemyDieDonggrami,

      soundSrc.enemyAttack.jemulBossAttack,
      soundSrc.enemyAttack.jemulBossAttack2,
      soundSrc.enemyAttack.jemulBossAttack3,
      soundSrc.enemyAttack.jemulEnergyBoltAttack,
      soundSrc.enemyAttack.jemulHellDrillAttack,
    ]
  }

  /** 라운드 2에서 사용하는 이미지 공통 데이터
   */
  static getRound2ShareImage () {
    return [
      imageSrc.enemy.donggramiEnemy,
      imageSrc.enemyDie.effectList,
      imageSrc.enemy.intruderEnemy,
    ]
  }

  static getRound2ShareSound () {
    return [
      soundSrc.donggrami.emoji,
      soundSrc.donggrami.throw,
      soundSrc.donggrami.exclamationMark,
      soundSrc.donggrami.questionMark,
      soundSrc.donggrami.juiceCola,
      soundSrc.donggrami.juiceThrow,
      soundSrc.donggrami.firecracker,
      soundSrc.donggrami.plate,
      
      soundSrc.enemyDie.enemyDieDonggrami,
      soundSrc.enemyDie.enemyDieDonggramiLeaf,
      soundSrc.enemyDie.enemyDieIntruderJemu,
      soundSrc.enemyDie.enemyDieIntruderSquare,
      soundSrc.enemyDie.enemyDieIntruderDaseok,
      soundSrc.enemyDie.enemyDieIntruderDiacore,
      soundSrc.enemyDie.enemyDieIntruderFlying1,
      soundSrc.enemyDie.enemyDieIntruderFlying2,
      soundSrc.enemyDie.enemyDieIntruderFlyingRocket,
      soundSrc.enemyDie.enemyDieIntruderGami,
      soundSrc.enemyDie.enemyDieIntruderHanoi,
      soundSrc.enemyDie.enemyDieIntruderLever,
      soundSrc.enemyDie.enemyDieIntruderMetal,
      soundSrc.enemyDie.enemyDieIntruderMomi,
      soundSrc.enemyDie.enemyDieIntruderRendown,

      soundSrc.enemyAttack.intruderJemuEnergy,
      soundSrc.enemyAttack.intruderJemuEnergyHigh,
      soundSrc.enemyAttack.intruderJemuEnergyLow,
      soundSrc.enemyAttack.intruderJemuEnergyPurple,
      soundSrc.enemyAttack.intruderJemuEnergyReflect,
      soundSrc.enemyAttack.intruderJemuThunderBig,
      soundSrc.enemyAttack.intruderJemuThunderNormal,
      soundSrc.enemyAttack.intruderDaseokLaserGreen,
      soundSrc.enemyAttack.intruderDaseokLaserYellow,
      soundSrc.enemyAttack.intruderHanoiAttack,
      soundSrc.enemyAttack.intruderHanoiReflect,
      soundSrc.enemyAttack.intruderLeverLaser,
      soundSrc.enemyAttack.intruderRendownMissile,
      soundSrc.enemyAttack.intruderRendownMissileCreate,
    ]
  }
}

/** 해당 라운드의 스탯을 정의한 클래스 */
class BaseStat extends StatRound {
  /**
   * 라운드의 스탯을 생성합니다. (라운드의 id에 맞춰 스탯을 처리)
   * @param {number} id  
   */
  constructor (id) {
    super()
    let stat = dataExportStatRound.get(id)
    if (stat == null) return

    /** 
     * 라운드 ID 이 값은 dataId를 참고해서 작성... 다만 RoundData에서 작성할 필요는 없음. 
     * 
     * 어차피 field를 생성할 때, roundId를 입력하므로, 그 값을 참고해 만듬. 여기서 사용되는 id는
     * 생성할때는 중요하지 않고 저장 및 불러오기 용도로 사용
     */
    this.id = id

    /** (해당 라운드를 플레이 하기 위한) 필요 레벨, 필요 레벨 미만은 입장 불가 */ this.roundName = stat.roundName
    /** (해당 라운드를 원할하게 플레이 할 수 있는) 권장 공격력, 입장은 상관 없음 */ this.roundText = stat.roundText
    /** 라운드 값을 텍스트로 표시 (예: 1-1), 영어와 숫자만 사용 가능 */ this.requireLevel = stat.requireLevel
    /** 라운드 이름, text.js에서 값을 가져와서 입력하세요. */ this.standardPower = stat.standardPower
    /** 라운드 종료 시간(이 시간이 되면 클리어), 단위: 초 */ this.finishTime = stat.finishTime
    /** 클리어 보너스 점수 */ this.clearBonus = stat.clearBonus
  }

  /**
   * 라운드 스탯을 설정합니다.
   * @param {number} roundId 해당 라운드의 id
   */
  setStat (roundId) {
    let stat = dataExportStatRound.get(roundId)
    if (stat == null) return

    this.id = roundId
    this.roundName = stat.roundName
    this.roundText = stat.roundText
    this.requireLevel = stat.requireLevel
    this.standardPower = stat.standardPower
    this.finishTime = stat.finishTime
    this.clearBonus = stat.clearBonus
  }
}

/** 해당 라운드의 시간을 처리하기 위한 클래스 */
class BaseTime {
  constructor () {
    /** 현재 시간의 프레임 */ this.currentTimeFrame = 0
    /** 총합 프레임 (적 출현을 일정시간으로 나눌 때 주로 사용) */ this.currentTimeTotalFrame = 0
    /** 현재 시간이 정지된 상태 (이 값은 set함수를 이용해 수정해주세요.) */ this.currentTimePaused = false
    /** 추가 시간, 현재 시간이 일시 정지된 시점에서 사용됨 */ this.plusTime = 0
    /** 추가 시간 프레임 */ this.plusTimeFrame = 0
    /** 전체 시간 프레임 (pause 상관없이 시간 프레임 증가) */ this.totalFrame = 0

    /** 현재 시간, 기본값은 반드시 0이어야 합니다. 
     * (currentTime의 전환 효과를 위해 가급적이면 set함수를 사용해주세요.), 유일한 예외는 저장데이터를 불러왔을 때 뿐입니다. */ 
    this._currentTime = 0

    /**
     * 시간이 정지된 경우 필드에 전송할 메세지, 값이 없으면 필드 시스템이 정한 기본값을 사용 
     * (이 값은 게임의 일관성을 위하여 아무렇게나 사용하면 안됩니다.)
     * 
     * 자세한것은 setCurrentTimePaused 함수 참고
     */ 
    this.currentTimePausedMessage = ''
  }

  /**
   * 현재 시간을 재설정 합니다. 참고로 현재 시간을 재설정하면 추가 시간값이 변경됩니다.  
   * 정수값만 사용할 수 있습니다.
   * @param {number} setTime 설정 시간 (초)
   */
  setCurrentTime (setTime) {
    // 해당 숫자가 정수인지 소수인지 판정
    if (!Number.isInteger(setTime)) {
      setTime = Math.floor(setTime)
    }

    // 남은 차이값만큼 plusTime 변환
    // 주의: 이 함수는 무조건 plusTime에 영향을 미치기 때문에
    // bossMode와 같은곳에는 이 함수가 사용되지 않습니다.
    let diffValue = this._currentTime - setTime
    this._currentTime = setTime
    this.plusTime += diffValue
  }

  get currentTime () { return this._currentTime }

  /** 
   * 현재 시간을 일시정지하는지에 대한 여부
   * 
   * 참고: message에 대해서
   * 
   * 이 게임은 기본적으로 보스전 또는 적이 남아있는 상황에서 모든 적을 죽일 때까지 더이상 진행되지 않습니다.
   * 그러나, 특정 상황에서는 강제로 시간을 멈출 수 있으며 이것을 안내하기 위한 메세지를 작성할 수 있습니다.
   * 
   * 게임의 일관성을 위하여 메세지는 특정 상황에서만 작성되어야 합니다.
   * 
   * 주의: 잘못 사용하면 시간이 영원히 멈출 수도 있습니다. 그렇게 되면 게임 진행이 불가능집니다.
   * @param {boolean} [boolValue=false] 시간을 멈추는 여부
   * @param {string} [message=''] 시간이 멈춘 상태에서 필드 시스템에 보여줄 메세지
   * 
   */
  setCurrentTimePause (boolValue = false, message = '') {
    this.currentTimePaused = boolValue
    this.currentTimePausedMessage = message
  }

  process () {
    // 종합 프레임은 조건에 상관없이 증가
    this.totalFrame++

    // 현재시간이 정지된 상태라면 기본 시간은 멈추고 추가 시간이 계산됩니다.
    if (this.currentTimePaused) {
      this.plusTimeFrame++
      if (this.plusTimeFrame >= 60) {
        this.plusTimeFrame -= 60
        this.plusTime++
      }
    } else {
      this.currentTimeFrame++
      this.currentTimeTotalFrame++
      if (this.currentTimeFrame >= 60) {
        this.currentTimeFrame -= 60
        this._currentTime++
      }
    }
  }
}

/** 라운드에서 phase를 간편하게 관리하기 위해 만든 클래스 
 * (참고: 라운드 내부 페이즈는 단순히 라운드를 작성할때 코드가 길어지기 때문에 코드를 분리하기 위해 만든것입니다.) */
class BasePhase {
  constructor () {
    /** 
     * 각 페이즈의 시간 
     * @type {{startTime: number, endTime: number}[]}
     */ 
    this.phaseTime = []

    /**
     * 라운드 페이즈를 정의하는 함수를 여기에 추가하세요.
     * @type {Function[]}
     */
    this.phaseRound = []

    /** 현재 페이즈의 시간을 판단하기 위해 만들어진 변수 */
    this.time = 0
  }
  
  /**
   * 라운드의 페이즈 추가.
   * 참고로 이 함수를 사용하면 마지막 라운드 페이즈가 마지막 페이즈가 종료되는 시점으로 자동으로 맞춰집니다.
   * @param {RoundData} targetRound (이 값은 this를 넣어주세요. - 왜냐하면 this가 라운드이므로) 그리고 라운드 외부에서는 사용할 수 없습니다.
   * @param {Function} inputFunction 페이즈의 내용이 구현되어있는 함수
   * @param {number} startTime 페이즈의 시작 시간
   * @param {number} endTime 페이즈의 종료 시간
   */
  addRoundPhase (targetRound, inputFunction, startTime, endTime = startTime) {
    if (!(targetRound instanceof RoundData)) {
      console.warn('라운드 데이터가 입력이 되지 않아서 페이즈 함수를 넣을 수 없습니다.')
      return
    }

    if (inputFunction == null) {
      console.warn('라운드 페이즈가 구현된 함수를 입력해 주세요. 데이터가 없으면 추가되지 않습니다.')
      return
    }

    // 참고, 라운드를 건네주었을 때, this값이 사라지기 때문에 이 라운드 함수를 사용할 수 있게끔 this를 이 클래스에 바인드 해야함.
    this.phaseRound.push(inputFunction.bind(targetRound))
    this.phaseTime.push({startTime: startTime, endTime: endTime})

    // 만약 페이즈 시간이랑 페이즈 종료 시간이 잘못 겹치면 해당 라운드에 영원히 갇힐 수 있음,
    // 페이즈 종료 시간은 마지막 페이즈 시간에서 1초를 추가
    this.phaseAllEndTime = endTime + 1
  }

  /**
   * 현재 페이즈 단계를 얻습니다.
   * 참고: 페이즈 계산은 페이즈 숫자를 바꾸는게 아니고, 
   * 모든 페이즈의 시간이 어떻게 되어있는지를 분석해서 현재 시간에 맞는 페이즈를 계산합니다.
   * 
   * 페이즈는 0부터 시작
   */
  getCurrentPhase () {
    for (let i = 0; i < this.phaseTime.length; i++) {
      if (this.time >= this.phaseTime[i].startTime && this.time <= this.phaseTime[i].endTime) {
        return i
      }
    }

    return 0
  }

  /** 
   * 라운드 진행에 관한 처리. 라운드 구성에 관해서는 roundPhase 부분을 참고
   * @param {number} currentTime 현재 시간값 (이 값이 있어야 페이즈를 관리할 수 있음!)
   */
  process (currentTime) {
    this.time = currentTime

    for (let i = 0; i < this.phaseRound.length; i++) {
      let currentPhase = this.phaseRound[i]
      if (this.time >= this.phaseTime[i].startTime && this.time <= this.phaseTime[i].endTime) {
        currentPhase()
      }
    }
  }
}

/** 라운드에서 meter를 간편하게 표시하기 위한 클래스 */
class BaseMeter {
  /**
   * 보스의 체력 표시 (기본스타일 적용), 주의: 단 1마리만 표기 가능 
   * @param {number} enemyId 표시할 적의 ID, 없을경우 현재 필드에 남아있는 (배열 기준) 첫번째 적
   */
  static bossHpDefaultStyle (enemyId = 0) {
    let enemy = enemyId === 0 ? BaseField.getEnemyObject()[0] : BaseField.getEnemyObjectById(enemyId)
    if (enemy == null) return

    const positionX = 10
    const positionY = 10
    const meterWidth = graphicSystem.CANVAS_WIDTH - 20
    const meterHeight = 25

    if (enemy.hp > enemy.hpMax * 0.2) {
      graphicSystem.meterRect(10, 10, meterWidth, meterHeight, ['#FF6C1E', '#FFB41E'], enemy.hp, enemy.hpMax, true, ['#C0C0C0'], 1)
    } else {
      graphicSystem.meterRect(10, 10, meterWidth, meterHeight, '#FF3B26', enemy.hp, enemy.hpMax, true, ['#C0C0C0'], 1)
    }

    digitalDisplay('BOSS HP: ' + enemy.hp + '/' + enemy.hpMax, positionX + 2, positionY + 2)
  }

  /**
   * 보스의 체력 표시 (유저 스타일 적용), 주의: 단 1마리만 표기 가능...
   * @param {number} enemyId 표시할 적의 ID, 없을경우 현재 필드에 남아있는 (배열 기준) 첫번째 적
   * @param {number} x 
   * @param {number} y 
   * @param {number} width 
   * @param {number} height 
   * @param {string | string[]} color 
   * @param {string | string[]} borderColor 테두리 색
   * @param {number} [borderLength=0] 테두리 너비
   * @returns 
   */
  static bossHpUserStyle (enemyId, x, y, width, height, color = '', borderColor = '', borderLength = 0) {
    let enemy = BaseField.getEnemyObjectById(enemyId)
    if (enemy == null) return

    graphicSystem.meterRect(x, y, width, height, color, enemy.hp, enemy.hpMax, true, borderColor, borderLength)
    digitalDisplay('BOSS HP: ' + enemy.hp + '/' + enemy.hpMax, x + 2, y + 2)
  }
}

class BaseLoad {
  constructor () {
    /** 
     * 이 라운드에서 사용해야 하는 이미지들의 리스트
     * 
     * 주의: 라운드에서는 round와 enemy도 같이 로드해야 합니다.
     * 
     * 이 변수를 직접 수정하기 보다는 addLoadingImageList 함수를 사용하는것을 권장합니다.
     * 
     * 반드시 클래스의 constructor(생성자)에서 작성해야 합니다.
     * 다른곳에서 작성할경우 해당 파일을 정상적으로 로드할 수 없습니다.
     * @type {string[]}
     */
    this.imageList = []

    /** 
     * 이 라운드에서 로드해야 하는 사운드들의 리스트
     * 
     * 주의: 라운드에서는 round와 enemy도 같이 로드해야 합니다.
     * 
     * 이 변수를 직접 수정하기 보다는 addLoadingSoundList 함수를 사용하는것을 권장합니다.
     * 
     * 반드시 클래스의 constructor(생성자)에서 작성해야 합니다.
     * 다른곳에서 작성할경우 해당 파일을 정상적으로 로드할 수 없습니다.
     * @type {string[]}
     */
    this.soundList = []
  }

  /**
   * loading image list를 설정하는 함수
   * 
   * 주의: 라운드에서는 round와 enemy도 같이 로드해야 합니다. 
   * packRoundLoad 클래스를 참고해 라운드에 필요한 데이터를 추가로 지정해 주세요.
   * 
   * 이 함수는 반드시 각 라운드의 constructor에서 실행해야 합니다.
   * 다른곳에서는 정상적으로 불러올 수 없습니다.
   * @param {string[]} src 
   */
  addImageList (src = ['']) {
    this.imageList = this.imageList.concat(src)
  }

  /**
   * loading sound list를 설정하는 함수
   * 
   * 주의: 라운드에서는 round와 enemy도 같이 로드해야 합니다.
   * packRoundLoad 클래스를 참고해 라운드에 필요한 데이터를 추가로 지정해 주세요.
   * 
   * 이 함수는 반드시 각 라운드의 constructor에서 실행해야 합니다.
   * 다른곳에서는 정상적으로 불러올 수 없습니다.
   * @param {string[]} src 
   */
  addSoundList (src = ['']) {
    this.soundList = this.soundList.concat(src)
  }

  /** 
   * 이미지와 사운드를 로딩합니다. (중복으로 로드하지 않음.)
   * 이 함수는 필드에서 라운드를 진행하기 전에 반드시 실행되어야 합니다.
   * 또는 불러오기를 했을 때에도 실행되어야 합니다.
   */
  loadStart () {
    for (let i = 0; i < this.imageList.length; i++) {
      graphicSystem.createImage(this.imageList[i])
    }
    for (let i = 0; i < this.soundList.length; i++) {
      soundSystem.createAudio(this.soundList[i])
    }
  }

  /** 
   * 라운드와 관련된 이미지, 사운드 파일이 전부 로딩되었는지를 확인
   * 단, 유저가 제스쳐 행위를 하지 않는다면, 사운드가 로딩되지 않으므로 사운드 로드 여부는 판단하지 않습니다. [표시만 될 뿐...]
   */
  check () {
    let imageLoadCount = graphicSystem.getImageCompleteCount(this.imageList)
    // let soundLoadCount = soundSystem.getAudioLoadCompleteCount(this.loadingSoundList)
    
    return imageLoadCount === this.imageList.length ? true : false
  }

  /**
   * 현재 로드된 상태를 출력하는 문자열 배열을 얻습니다.
   * @returns {string[]}
   */
  getStatus () {
    return [
      'image load: ' + graphicSystem.getImageCompleteCount(this.imageList) + '/' + this.imageList.length,
      'sound load: ' + soundSystem.getAudioLoadCompleteCount(this.soundList) + '/' + this.soundList.length,
      'Sounds are loaded when using user gestures.'
    ]
  }
}

export class RoundData {
  constructor () {
    /** 필드 객체들을 간편하게 사용하기 위한 함수 집합 */
    this.field = BaseField

    /** 현재 라운드의 스탯 (라운드에 대한 기본 정보가 있음) @type {BaseStat} */
    this.stat = new BaseStat(ID.round.UNUSED)

    /** 사운드 객체들을 간편하게 사용하기 위한 함수 집합 */
    this.sound = BaseSound
    this.sound.musicStop() // 미리 저장된 음악이 출력되는것을 막기 위해 음악을 정지시킴
    this.sound.musicSrc = '' // 음악의 기본값 설정 (다른 라운드가 이 값을 공유하기 때문에 라운드 시작시마다 갱신해야함)

    /** 라운드의 상태 (저장용도) @type {string} */ 
    this.state = ''

    /** 저장 용도로 사용하는 문자열 (어떤 형태로 저장되는지는 알 수 없지만, 반드시 문자열로 저장해야) @type {string} */
    this.saveString = ''

    /** 배경레이어 (roundData의 표준 배경 화면 출력 시스템) @type {BgLayer} */
    this.bgLayer = new BgLayer()

    /** 배경레이어 (round 1 ~ 2에 사용했었던 배경화면 출력 레거시 시스템) 하위호환 및 단일 배경출력에 최적화됨 @type {BgLegacy} */
    this.bgLegacy = new BgLegacy()

    /** 현재 라운드의 시간 (시간에 대한 처리 객체) @type {BaseTime} */
    this.time = new BaseTime()

    /** 라운드의 데이터들을 로드하는 객체 (이미지, 사운드) */
    this.load = new BaseLoad()

    /** 라운드의 페이즈를 관리하는 도구 */
    this.phase = new BasePhase()

    /** 라운드에서 meter를 간편하게 표시하기 위한 클래스 */
    this.meter = BaseMeter

    /** 
     * 현재 있는 보스 (더이상 이 값은 의미가 없습니다.) - 다른 형식으로 대체 가능하기 때문에 제거되었습니다.
     * @deprecated
     * @type {FieldData | null | any}
     */ 
    this.currentBoss = null

    /** 
     * 모든 페이즈가 끝나는 시간 (그리고 적 전부 죽었는지 확인) 
     * 참고로 이 시간은 addRoundPhase를 사용할 때마다 해당 라운드의 종료 시점으로 자동으로 맞춰집니다.
     * 
     * 페이즈 종료 시간은 마지막 페이즈 시간에서 1초를 추가
     * 
     * 이것은 이제 쓸모가 없어졌으며, 굳이 원한다면 함수를 사용해주세요.
     * @deprecated 
     */ 
    this.phaseAllEndTime = 0
  }

  /**
   * 해당 라운드가 클리어 되어있는지 확인.
   * (참고: 라운드를 클리어하는 기본적인 기준은, currentTime이 finishTime 이상이여야 합니다.)
   * 이것은, finishTime 시간만 넘어가면 적이 몇마리 있든 일단 클리어라는 뜻입니다.
   */
  clearCheck () {
    if (this.time._currentTime >= this.stat.finishTime) {
      return true
    } else {
      return false
    }
  }

  /**
   * 미완성 함수
   * 
   * 지금은 사용하지 마세요.
   * @deprecated
   */
  requestClear () {

  }

  /** 
   * 라운드 출력 함수 
   * 
   * 이 함수는 기본적인 배경 출력 기능만 있습니다. 상속받을 때 참고해주세요.
   * 
   * (다른 형태의 출력 함수는 존재하지 않습니다.)
   */
  display () {
    if (this.bgLayer.getIsUsing()) {
      this.bgLayer.display()
    } else {
      this.bgLegacy.display()
    }
  }

  process () {
    this.processPhase()
    this.processBackground()
    this.processDebug()
    this.time.process()
    this.processFirstMusicPlay()
    this.processSaveString()
  }

  /** 
   * 배경 출력시 사용하는 함수: 이 함수를 상속받으면 각 라운드별로 추가적인 배경작업을 할 수 있습니다. 
   * 
   * (당연히 super.processBackground도 같이 사용해야 함) 
   */
  processBackground () {
    // bgLayer를 사용중일 때에는 bgLayer를 사용하고 아니라면 bgLegacy를 사용합니다.
    this.bgLayer.getIsUsing() ? this.bgLayer.process() : this.bgLegacy.process()
  }

  /**
   * 라운드 진행에 관한 함수, 이 함수를 상속받으면 좀 더 세부적인 구현을 할 수 있습니다.
   * 
   * (이 함수를 상속받은 이후 super.processPhase를 사용하지 않으면 페이즈 진행이 불가능합니다.)
   */
  processPhase () {
    this.phase.process(this.time.currentTime)
  }

  /** 
   * 디버그할 때 임시로 사용하는 함수 (이 함수는 기본적으로 아무것도 하지 않습니다.)
   * 
   * 주로 특정 페이즈를 테스트 할 때 사용합니다.
   */
  processDebug () {}

  /**
   * 시간 간격 확인 함수, 프레임 단위 계산을 totalFrame으로 하기 때문에 시간이 멈추어도 함수는 작동합니다.
   * 
   * start이상 end이하일경우 true, 아닐경우 false
   * 
   * 참고: 만약, 시간 범위를 무제한 범위로 하고, intervalFrame 간격만 확인하고 싶다면
   * start를 0, end는 매우 큰 수(9999같은...)를 사용해주세요.
   */
  timeCheckInterval (start = 0, end = start, intervalFrame = 1) {
    // 이 조건 결과가 그대로 리턴값과 일치하므로, 해당 값을 바로 리턴합니다.
    return (this.time.currentTime >= start && this.time.currentTime <= end && this.time.totalFrame % intervalFrame === 0)
  }

  /**
   * 현재 시간이 지정된 시간인지 확인합니다.
   * 
   * 만약, time 60이고, frame 1이면, 60초 1프레임만 해당되고, 60초 2프레임같은건 해당되지 않습니다.
   * 
   * 경고: 시간 범위를 확인할거라면, timeInterval 사용을 추천합니다
   * @param {number} time 현재 시간(초)
   * @param {number} frame 해당 프레임(없을 경우 기본값 0)
   */
  timeCheckFrame (time, frame = 0) {
    // 이 조건 결과가 그대로 리턴값과 일치하므로, 해당 값을 바로 리턴합니다.
    return (this.time.currentTime === time && this.time.currentTimeFrame === frame)
  }

  /**
   * 남은 적의 수 조건에 따라 시간을 일시정지 시키고 싶을 때 사용하는 함수 (추가로 남은 적 수를 알려주는 메세지도 표시합니다.)
   * 
   * 주의: 이 함수를 사용하고 나서 적을 지속적으로 생성하면 안됩니다. 그러면 게임을 영원히 진행할 수 없습니다.
   * @param time 시간을 멈추는 기준 시간
   * @param minEnemyCount 최소 적의 수 (해당 적 수 초과일경우 시간이 멈춤)
   */
  timePauseWithEnemyCount (time = 0, minEnemyCount = 0) {
    if (this.timeCheckInterval(time)) {
      if (minEnemyCount < this.field.getEnemyCount()) {
        this.time.currentTimePaused = true
        // 최소 적이 0이면 남은 적 수만 표시하고, 아닐경우, 기준이 되는 적의 수도 표시합니다.
        const inputText = minEnemyCount === 0 ? 'enemy: ' + this.field.getEnemyCount() : 'enemy: ' + this.field.getEnemyCount() + '/' + minEnemyCount
        this.time.currentTimePausedMessage = inputText
      } else {
        this.time.currentTimePaused = false
      }
    }
  }

  getSaveData () {
    let isBgLayerUsing = this.bgLayer.getIsUsing()

    return {
      id: this.stat.id,
      state: this.state,
      
      // 배경화면
      backgroundImageSrc: isBgLayerUsing ? '' : this.bgLegacy.imageSrc,
      backgroundX: isBgLayerUsing ? this.bgLayer.getBackgroundPosition().x : this.bgLegacy.x,
      backgroundY: isBgLayerUsing ? this.bgLayer.getBackgroundPosition().y : this.bgLegacy.y,
      backgroundSpeedX: isBgLayerUsing ? this.bgLayer.getBackgroundSpeed().speedX : this.bgLegacy.backgroundSpeedX,
      backgroundSpeedY: isBgLayerUsing ? this.bgLayer.getBackgroundSpeed().speedY : this.bgLegacy.backgroundSpeedY,
      backgroundWidth: isBgLayerUsing ? this.bgLayer.getBackgroundWidthHeight().width : 0,
      backgroundHeight: isBgLayerUsing ? this.bgLayer.getBackgroundWidthHeight().height : 0,
      bgLayer: isBgLayerUsing ? this.bgLayer.getSaveLayerData() : '',

      // 현재시간
      currentTime: this.time.currentTime,
      currentTimeFrame: this.time.currentTimeFrame,
      currentTimeTotalFrame: this.time.currentTimeTotalFrame,
      currentTimePaused: this.time.currentTimePaused,
      plusTime: this.time.plusTime,
      plusTimeFrame: this.time.plusTimeFrame,

      // 음악 시간
      loadCurrentMusicTime: game.sound.getMusicCurrentTime(),
      currentMusicSrc: this.sound.currentMusicSrc,

      // 특수한 경우
      saveString: this.saveString
    }
  }

  /** 
   * saveString 문자열을 어떻게 저장할 것인지에 대한 함수
   * 
   * (saveString을 조작하는 방식이 복잡할 수 있으므로, 함수로 따로 분리하였습니다.)
   */
  processSaveString () {
    
  }

  /** 라운드 시작시에 대한 처리 */
  roundStart () {
    if (this.timeCheckFrame(0, 1)) { // 라운드 시작하자마자 음악 재생
      soundSystem.musicPlay(this.sound.currentMusicSrc)
    }
  }

  /** 
   * musicPlay는 한정적인 상황에서 호출되므로, 라운드를 시작했을 때 음악이 재생되지 않습니다.  
   * 따라서, 현재 음악을 재생할 수 있도록, 이 함수를 프로세스 합니다.
   */
  processFirstMusicPlay () {
    if (this.timeCheckFrame(0, 10)) {
      // 게임 시작 즉시 음악을 호출하는 것이 불가능하므로, 약간의 지연을 넣어서 처리했습니다.
      // 0초 10프레임 시점에서 음악이 재생됩니다.
      this.sound.currentMusicSrc = this.sound.musicSrc
      this.sound.musicPlay()
    }
  }

  /**
   * 불러온 데이터를 이용해 라운드 값을 설정합니다.
   * 
   * 경고: 이 함수를 상속받았다면, 반드시 saveData의 매개변수를 받아야 정상적으로 저장된걸 불러올 수 있습니다.
   * 
   * @param {*} saveData 이 데이터의 정보는 getSaveData 가 return 하는 오브젝트를 참고해주세요.
   */
  setLoadData (saveData) {
    // id 및 상태
    this.stat.id = saveData.id
    this.state = this.state
    
    // 배경화면
    let isBgLayerUsing = this.bgLayer.getIsUsing()
    if (isBgLayerUsing) {
      this.bgLayer.setBackgroundPosition(saveData.backgroundX, saveData.backgroundY)
      this.bgLayer.setBackgroundSpeed(saveData.backgroundSpeedX, saveData.backgroundSpeedY)
      this.bgLayer.setBackgroundWidthHeight(saveData.backgroundWidth, saveData.backgroundHeight)

      // 배경 레이어 (bgLayer 전용)
      this.bgLayer.setLoadLayerData(saveData.bgLayer)
    } else {
      this.bgLegacy.imageSrc = saveData.backgroundImageSrc
      this.bgLegacy.x = saveData.backgroundX
      this.bgLegacy.y = saveData.backgroundY
      this.bgLegacy.backgroundSpeedX = saveData.backgroundSpeedX
      this.bgLegacy.backgroundSpeedY = saveData.backgroundSpeedY
    }

    // 라운드 시간
    this.time._currentTime = saveData.currentTime
    this.time.currentTimeFrame = saveData.currentTimeFrame
    this.time.currentTimeTotalFrame = saveData.currentTimeTotalFrame
    this.time.currentTimePaused = saveData.currentTimePaused
    this.time.plusTime = saveData.plusTime
    this.time.plusTimeFrame = saveData.plusTimeFrame

    // 음악 시간
    this.sound.loadCurrentMusicTime = saveData.loadCurrentMusicTime
    this.sound.currentMusicSrc = saveData.currentMusicSrc

    // 세이브 스트링
    this.saveString = saveData.saveString
    this.loadDataSaveString()
  }

  /** 
   * 불러온 saveString 값을 이용해 추가적인 설정을 합니다.
   * 이 함수의 내부 구현은 라운드마다 다를 수 있음.
   * 기본적으로 아무것도 수행하지 않습니다.
   * 
   * 주의: setLoadData 함수에서 이 함수를 호출하므로, 다른곳에서 이 함수를 호출하지 마세요.
   */
  loadDataSaveString () {

  }
}

class Round1_1 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round1_1)
    this.bgLegacy.imageSrc = imageSrc.round.round1_1_space
    this.sound.musicSrc = soundSrc.music.music01_space_void

    this.phase.addRoundPhase(this, this.roundPhase00, 1, 10)
    this.phase.addRoundPhase(this, this.roundPhase01, 11, 30)
    this.phase.addRoundPhase(this, this.roundPhase02, 31, 60)
    this.phase.addRoundPhase(this, this.roundPhase03, 61, 90)
    this.phase.addRoundPhase(this, this.roundPhase04, 91, 120)
    this.phase.addRoundPhase(this, this.roundPhase05, 121, 150)

    // 로드해야 할 파일 리스트 작성
    this.load.addImageList([
      imageSrc.round.round1_1_space,
      imageSrc.round.round1_2_meteorite,
      imageSrc.enemy.spaceEnemy,
    ])
    this.load.addSoundList([
      soundSrc.music.music01_space_void,
      soundSrc.music.music06_round1_boss_thema
    ])

    this.load.addImageList(RoundPackLoad.getRound1ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound1ShareSound())
  }

  roundPhase00 () {
    if (this.timeCheckInterval(2, 10, 10)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
    }
  }

  roundPhase01 () {
    if (this.timeCheckInterval(11, 30, 30)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
    }

    if (this.timeCheckInterval(11, 15, 30)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.rocket)
    } else if (this.timeCheckInterval(16, 20, 30)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.car)
    } else if (this.timeCheckInterval(21, 25, 30)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.square)
    } else if (this.timeCheckInterval(26, 30, 30)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.attack)
    }
  }

  roundPhase02 () {
    if (this.timeCheckInterval(31, 60, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
    }

    if (this.timeCheckInterval(31, 35, 30)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.energy)
    }

    // 일정 시간 간격으로 적 번호를 정하여 적을 생성한다.
    if (this.timeCheckInterval(36, 50, 30) || this.timeCheckInterval(51, 60, 20)) {
      const ENEMY_TYPE = 5
      let targetNumber = Math.floor(Math.random() * ENEMY_TYPE)
      switch (targetNumber) {
        case 0: this.field.createEnemy(ID.enemy.spaceEnemy.rocket); break
        case 1: this.field.createEnemy(ID.enemy.spaceEnemy.car); break
        case 2: this.field.createEnemy(ID.enemy.spaceEnemy.square); break
        case 3: this.field.createEnemy(ID.enemy.spaceEnemy.attack); break
        case 4: this.field.createEnemy(ID.enemy.spaceEnemy.energy); break
      }
    }

  }

  roundPhase03 () {
    // 혜성도 대거 등장하고, 빛들이 많아짐
    if (this.timeCheckInterval(61, 74, 15) || this.timeCheckInterval(75, 90, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    // 그리고 곧이어 수송선도 등장
    if (this.timeCheckInterval(75, 90, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.susong)
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }
  }

  roundPhase04 () {
    // 수송선과 감지기가 메인이 되고, 빛의 비중이 줄어둠.
    if (this.timeCheckInterval(91, 120, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    if (this.timeCheckInterval(91, 120, 180)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.susong)
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(91, 120, 120)) {
      const ENEMY_TYPE = 5
      let targetNumber = Math.floor(Math.random() * ENEMY_TYPE)
      switch (targetNumber) {
        case 0: this.field.createEnemy(ID.enemy.spaceEnemy.rocket); break
        case 1: this.field.createEnemy(ID.enemy.spaceEnemy.car); break
        case 2: this.field.createEnemy(ID.enemy.spaceEnemy.square); break
        case 3: this.field.createEnemy(ID.enemy.spaceEnemy.attack); break
        case 4: this.field.createEnemy(ID.enemy.spaceEnemy.energy); break
      }
    }
  }


  roundPhase05 () {
    // 이제 수송선, 감지기, 운석만 등장...
    if (this.timeCheckInterval(121, 141, 240)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.susong)
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(121, 141, 90)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.meteorite)
    }

    // 보스 직전 타임 스탑 체크
    this.timePauseWithEnemyCount(144)

    // 보스 출현
    if (this.timeCheckFrame(147, 0)) {
      this.sound.musicChange(soundSrc.music.music06_round1_boss_thema)
      this.field.createEnemy(ID.enemy.spaceEnemy.boss, 0, 0)
    }

    // 보스 전 시간 정지 및, 보스가 죽은 이후 음악 정지
    this.timePauseWithEnemyCount(148)
    if (this.timeCheckInterval(148) && this.field.enemyNothingCheck()) {
      this.sound.musicStop()
    }
  }

  processBackground () {
    if (this.timeCheckInterval(0, 10)) {
      this.bgLegacy.backgroundSpeedX = 0.2
    } else if (this.timeCheckInterval(11, 30, 6)) {
      if (this.bgLegacy.backgroundSpeedX < 2) this.bgLegacy.backgroundSpeedX += 0.02
    } else if (this.timeCheckInterval(31, 60, 6)) {
      if (this.bgLegacy.backgroundSpeedX < 10) this.bgLegacy.backgroundSpeedX += 0.05
    } else if (this.timeCheckInterval(61, 136, 6)) {
      if (this.bgLegacy.backgroundSpeedX < 20) this.bgLegacy.backgroundSpeedX += 0.1
    } else if (this.timeCheckInterval(136, 150, 6)) {
      // 감속 구간
      if (this.bgLegacy.backgroundSpeedX > 1) this.bgLegacy.backgroundSpeedX -= 0.2
    }

    if (this.timeCheckInterval(0, 142, 180)) {
      let randomNumber = Math.random() * 99
      let moveSpeed = Math.random() * 0.3
      
      if (randomNumber <= 33) moveSpeed = -moveSpeed
      else if (randomNumber <= 66) moveSpeed = 0

      this.bgLegacy.backgroundSpeedY = moveSpeed
    }

    if (this.timeCheckInterval(143, this.stat.finishTime)) {
      this.bgLegacy.backgroundSpeedY = 0
    }

    // 운석지대로 화면 전환
    if (this.timeCheckFrame(140, 0)) {
      this.bgLegacy.changeImage(imageSrc.round.round1_2_meteorite, 300)
    }

    // 운석지대로 진입한 이후 저장 후 불러왔을 때 운석 지대 이미지로 변경
    if (this.timeCheckInterval(140, 150)) {
      this.bgLegacy.imageSrc = imageSrc.round.round1_2_meteorite
    }

    super.processBackground()
  }

  display () {
    super.display()
    if (this.timeCheckInterval(147, 148)) {
      this.meter.bossHpDefaultStyle(ID.enemy.spaceEnemy.boss)
    }
  }
}

class Round1_2 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round1_2)
    this.bgLegacy.imageSrc = imageSrc.round.round1_2_meteorite
    this.sound.musicSrc = soundSrc.music.music02_meteorite_zone_field
    this.meteoriteDeepImage = imageSrc.round.round1_3_meteoriteDeep

    this.phase.addRoundPhase(this, this.roundPhase00, 0, 15)
    this.phase.addRoundPhase(this, this.roundPhase01, 16, 30)
    this.phase.addRoundPhase(this, this.roundPhase02, 31, 45)
    this.phase.addRoundPhase(this, this.roundPhase03, 46, 60)
    this.phase.addRoundPhase(this, this.roundPhase04, 61, 90)
    this.phase.addRoundPhase(this, this.roundPhase05, 91, 120)
    this.phase.addRoundPhase(this, this.roundPhase06, 121, 150)
    this.phase.addRoundPhase(this, this.roundPhase07, 151, 180)

    // 로드해야 할 파일 리스트 작성
    this.load.addImageList([
      imageSrc.round.round1_2_meteorite,
      imageSrc.round.round1_3_meteoriteDeep,
      imageSrc.enemy.spaceEnemy,
    ])

    this.load.addSoundList([
      soundSrc.music.music02_meteorite_zone_field,
    ])

    this.load.addImageList(RoundPackLoad.getRound1ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound1ShareSound())
  }

  processBackground () {
    this.bgLegacy.backgroundSpeedX = 0.4

    // 마지막 페이즈에서 배경화면 변경
    let lastPhaseTime = this.phase.phaseTime[this.phase.phaseTime.length - 1].startTime
    if (this.timeCheckFrame(lastPhaseTime, 0)) {
      this.bgLegacy.changeImage(this.meteoriteDeepImage, 300)
    }

    // 배경화면 변경 적용 (페이드 효과 이후 시간에)
    if (this.timeCheckInterval(lastPhaseTime, this.stat.finishTime)) {
      this.bgLegacy.imageSrc = this.meteoriteDeepImage
    }

    if (this.timeCheckInterval(31, 150, 180)) {
      this.bgLegacy.backgroundSpeedY = 0.3
    } else if (this.timeCheckInterval(151, this.stat.finishTime)) {
      this.bgLegacy.backgroundSpeedY = 0
    }

    super.processBackground()
  }

  roundPhase00 () {
    // 운석의 등장
    if (this.timeCheckInterval(0, 15, 40)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class3)
    }
    if (this.timeCheckInterval(0, 15, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }
  
  roundPhase01 () {
    if (this.timeCheckInterval(16, 30, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
    }
    if (this.timeCheckInterval(16, 30, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase02 () {
    if (this.timeCheckInterval(31, 45, 120)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.stone)
    }
    if (this.timeCheckInterval(16, 30, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase03 () {
    if (this.timeCheckInterval(46, 60, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.bomb)
    }
    if (this.timeCheckInterval(46, 60, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase04 () {
    // space enemy: total 25%
    if (this.timeCheckInterval(61, 90, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(61, 90, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    if (this.timeCheckInterval(61, 90, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.square)
      this.field.createEnemy(ID.enemy.spaceEnemy.energy)
    }

    // meteoriteEnemy: total 53?%
    if (this.timeCheckInterval(61, 90, 120)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
    }

    if (this.timeCheckInterval(61, 90, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class1)
    }

    if (this.timeCheckInterval(61, 90, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class2)
    }

    if (this.timeCheckInterval(61, 90, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class3)
    }
  }

  roundPhase05 () {
    if (this.timeCheckInterval(91, 120, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(91, 120, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class4)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.bombBig)
    }

    if (this.timeCheckInterval(91, 120, 240)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.stone)
    }
  }

  roundPhase06 () {
    if (this.timeCheckInterval(121, 150, 30)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class3)
    }

    if (this.timeCheckInterval(121, 150, 20)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    if (this.timeCheckInterval(121, 150, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.stonePiece)
    }
  }

  roundPhase07 () {
    if (this.timeCheckInterval(151, 176, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class4)
    }

    if (this.timeCheckInterval(151, 176, 120)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
    }

    if (this.timeCheckInterval(151, 176, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.bomb)
    }

    this.timePauseWithEnemyCount(178)
    if (this.timeCheckInterval(178) && this.field.enemyNothingCheck()) {
      this.sound.musicChange('', 1)
    }
  }
}

class Round1_3 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round1_3)
    this.bgLegacy.imageSrc = imageSrc.round.round1_3_meteoriteDeep
    this.sound.musicSrc = soundSrc.music.music02_meteorite_zone_field

    // ---
    this.battleMusic = soundSrc.music.music03_meteorite_zone_battle
    this.redZone1 = imageSrc.round.round1_5_meteoriteRed
    this.redZone2 = imageSrc.round.round1_4_meteoriteDark

    this.phase.addRoundPhase(this, this.roundPhase00, 1, 10)
    this.phase.addRoundPhase(this, this.roundPhase01, 11, 30)
    this.phase.addRoundPhase(this, this.roundPhase02, 31, 70)
    this.phase.addRoundPhase(this, this.roundPhase03, 71, 90)
    this.phase.addRoundPhase(this, this.roundPhase04, 91, 140)
    this.phase.addRoundPhase(this, this.roundPhase05, 141, 160)
    this.phase.addRoundPhase(this, this.roundPhase06, 161, 180)
    this.phase.addRoundPhase(this, this.roundPhase07, 181, 200)
    this.phase.addRoundPhase(this, this.roundPhase08, 201, 210)

    // 로드해야 할 파일 리스트 작성
    this.load.addImageList([
      imageSrc.round.round1_3_meteoriteDeep,
      imageSrc.round.round1_4_meteoriteDark,
      imageSrc.round.round1_5_meteoriteRed,
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemy.jemulEnemy,
      imageSrc.enemy.meteoriteEnemy,
    ])

    this.load.addSoundList([
      soundSrc.music.music02_meteorite_zone_field,
      soundSrc.music.music03_meteorite_zone_battle,
    ])

    this.load.addImageList(RoundPackLoad.getRound1ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound1ShareSound())
  }

  processBackground () {
    this.bgLegacy.backgroundSpeedX = 0.4

    let phase6Start = this.phase.phaseTime[6].startTime
    let phase8Start = this.phase.phaseTime[8].startTime
    if (this.timeCheckFrame(phase6Start, 0)) {
      this.bgLegacy.changeImage(this.redZone1, 1200)
    } else if (this.timeCheckFrame(phase8Start, 0)) {
      this.bgLegacy.changeImage(this.redZone2, 300)
    }

    if (this.timeCheckInterval(phase6Start, phase8Start)) {
      this.bgLegacy.imageSrc = this.redZone1
    } else if (this.timeCheckInterval(phase8Start, this.stat.finishTime)) {
      this.bgLegacy.imageSrc = this.redZone2
    }

    if (this.timeCheckInterval(31, phase8Start, 180)) {
      this.bgLegacy.backgroundSpeedY = 0.3
    } else if (this.timeCheckInterval(phase8Start, this.stat.finishTime)) {
      this.bgLegacy.backgroundSpeedY = 0
    }

    super.processBackground()
  }

  /**
   * 제물보스의 체력을 출력합니다.
   * 
   * 1-3 라운드에서만 사용하는 특별한 함수.
   */
  displayJemulBossMeter () {
    this.meter.bossHpUserStyle(ID.enemy.jemulEnemy.boss, 10, 10, graphicSystem.CANVAS_WIDTH - 20, 25, ['#DDA7A7', '#FF4545'])
  }

  roundPhase00 () {
    // 운석이 쏟아지는(?) 페이즈
    if (this.timeCheckInterval(0, 9, 90)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class3)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class4)
    }

    this.timePauseWithEnemyCount(10, 6)
  }

  roundPhase01 () {
    // 보스 첫번째 등장 (같은보스가 이 라운드 내에서 여러번 등장합니다.)
    // 보스가 한번만 등장하도록, currentTimeFrame을 사용하여 추가로 시간 조건을 넣었습니다.
    if (this.timeCheckFrame(11, 0)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.boss, 900)
      this.sound.musicChange(this.battleMusic, 2)
    }

    // 보스가 죽었다면, 스킵 (이 구간은 건너뜀)
    if (this.timeCheckInterval(18, 29, 4) && this.field.enemyNothingCheck()) {
      this.time.setCurrentTime(30)
    }

    // 적이 있다면, 시간을 멈춥니다.
    this.timePauseWithEnemyCount(30)
  }

  roundPhase02 () {
    // 음악 변경
    if (this.timeCheckFrame(31, 1)) {
      this.sound.musicChange(this.sound.musicSrc, 2)
    }

    if (this.timeCheckInterval(31, 36, 20)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
    }
    if (this.timeCheckInterval(37, 42, 30)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.energyBolt)
    }
    if (this.timeCheckInterval(43, 48, 30)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellDrill)
    }
    if (this.timeCheckInterval(49, 54, 30)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellSpike)
    }
    if (this.timeCheckInterval(55, 68, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }

    // 배경음악 정지
    if (this.timeCheckFrame(67)) {
      this.sound.musicChange('', 1)
    }

    // 적의 수가 2 초과라면, 시간이 일시정지합니다.
    this.timePauseWithEnemyCount(69, 2)
  }

  roundPhase03 () {
    // 이 페이즈 이후 부터 해당 음악이 적용됩니다.
    if (this.timeCheckFrame(71, 1)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.boss, 900)
      this.sound.musicChange(this.battleMusic, 1)
      this.sound.musicPlay()

      // 라운드 내의 함수로 만들기에는 애매해서 어쩔 수 없이 직접 조정함.
      // 음악을 처음부터 재생하는것이 아닌 중간부터 재생함.
      soundSystem.setCurrentMusicCurrentTime(19.194)
    }

    // 보스가 죽었다면, 해당 구간 스킵 처리
    if (this.timeCheckInterval(75, 89, 30) && this.field.enemyNothingCheck()) {
      this.time.setCurrentTime(90)
    }

    // 적이 있다면, 시간을 멈춥니다.
    this.timePauseWithEnemyCount(90)
  }

  roundPhase04_1 () {
    // 감지기 + 제물에어 + 제물쉽 = 초당 60% 딜 필요
    if (this.timeCheckInterval(91, 100, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }
  }

  roundPhase04_2 () {
    if (this.timeCheckInterval(101, 110, 120)) {
      for (let i = 0; i < 6; i++) {
        this.field.createEnemy(ID.enemy.jemulEnemy.rotateRocket, graphicSystem.CANVAS_WIDTH, (i * 80))
      }
    }
  }

  roundPhase04_3 () {
    // 48%
    if (this.timeCheckInterval(111, 120, 60)) {
      for (let i = 0; i < 4; i++) {
        this.field.createEnemy(ID.enemy.jemulEnemy.energyBolt)
      }
    }

    // 60%
    if (this.timeCheckInterval(112, 113, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellDrill, graphicSystem.CANVAS_WIDTH_HALF + 40, 0)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellDrill, graphicSystem.CANVAS_WIDTH_HALF - 40, 0)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellDrill, graphicSystem.CANVAS_WIDTH_HALF + 40, graphicSystem.CANVAS_HEIGHT)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellDrill, graphicSystem.CANVAS_WIDTH_HALF - 40, graphicSystem.CANVAS_HEIGHT)
    }

    // 40%
    if (this.timeCheckInterval(116, 117, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellSpike, 0, 0)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellSpike, graphicSystem.CANVAS_WIDTH, 0)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellSpike, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellSpike, 0, graphicSystem.CANVAS_HEIGHT)
    }
  }

  roundPhase04_4 () {
    if (this.timeCheckInterval(121, 122, 30)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.bomb)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
    }

    if (this.timeCheckInterval(123, 127, 20)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(127, 130, 10)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
    }
  }

  roundPhase04_5 () {
    if (this.timeCheckInterval(131, 137, 30)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }
  }

  roundPhase04 () {
    this.roundPhase04_1()
    this.roundPhase04_2()
    this.roundPhase04_3()
    this.roundPhase04_4()
    this.roundPhase04_5()
    this.timePauseWithEnemyCount(139, 4)
  }

  roundPhase05 () {
    if (this.timeCheckInterval(141) && this.time.currentTimeFrame === 0) {
      this.field.createEnemy(ID.enemy.jemulEnemy.boss, 900)
    }

    // 보스가 죽었다면 지속적으로 적이 등장 (이 구간부터 스킵할 수 없음)
    if (this.timeCheckInterval(145, 158, 60) && this.field.enemyNothingCheck()) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }

    // 적이 있다면, 시간을 멈춥니다.
    this.timePauseWithEnemyCount(159, 0)
  }

  roundPhase06 () {
    if (this.timeCheckInterval(161) && this.time.currentTimeFrame === 0) {
      this.field.createEnemy(ID.enemy.jemulEnemy.boss, 900)
      for (let i = 0; i < 5; i++) {
        this.field.createEnemy(ID.enemy.jemulEnemy.hellShip)
      }
    }

    // 보스까지 있는데 로켓까지 나온다. 지옥이다.
    if (this.timeCheckInterval(166, 176, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.rotateRocket, graphicSystem.CANVAS_WIDTH, 0)
    }

    // 보스가 죽은경우 로켓이 쏟아짐
    if (this.timeCheckInterval(165, 178, 20) && this.field.enemyNothingCheck()) {
      this.field.createEnemy(ID.enemy.jemulEnemy.rotateRocket, graphicSystem.CANVAS_WIDTH, 0)
    }

    // 적이 있다면, 시간을 멈춥니다.
    this.timePauseWithEnemyCount(179, 0)
  }

  roundPhase07 () {
    // 한번 더?
    if (this.timeCheckInterval(181) && this.time.currentTimeFrame === 0) {
      this.field.createEnemy(ID.enemy.jemulEnemy.boss, 900)
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 감지기 출현
    if (this.timeCheckInterval(184, 191, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 비행기의 추가적인 공격
    if (this.timeCheckInterval(185, 185, 30)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellShip, graphicSystem.CANVAS_WIDTH, 0)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellShip, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT_HALF)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellShip, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT)
    }

    // 비행기의 추가적인 공격
    if (this.timeCheckInterval(189, 189, 30)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir, graphicSystem.CANVAS_WIDTH, 0)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT_HALF)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT)
    }

    // 감지기 또 출현...
    if (this.timeCheckInterval(195, 198, 20)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 적이 있다면, 시간을 멈춥니다.
    this.timePauseWithEnemyCount(199, 0)
  }

  roundPhase08 () {
    // 아직도 안끝났다! 마지막 페이즈
    if (this.timeCheckInterval(200, 206, 10)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellDrill)
    }

    // 적이 있다면, 시간을 멈춥니다.
    this.timePauseWithEnemyCount(208, 0)
  }

  process () {
    super.process()
  }

  loadDataSaveString () {

    // 꼼수긴 하지만 어쩔 수 없음
    // if (this.phase.getCurrentPhase() >= 4 && this.sound.currentMusicSrc != this.battleMusic) {
    //   this.sound.musicChange(this.battleMusic, 2)
    // }
  }

  display () {
    super.display()

    // 중간보스가 등장하는 페이즈에서는 보스의 체력을 표시하도록 처리
    if ([1, 3, 5, 6, 7].includes(this.phase.getCurrentPhase())) {
      this.displayJemulBossMeter()
    }
  }
}

class Round1_4 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round1_4)
    this.bgLegacy.imageSrc = imageSrc.round.round1_4_meteoriteDark
    this.sound.musicSrc = soundSrc.music.music03_meteorite_zone_battle
    this.waitTimeFrame = 0
    this.backgroundDegree = 0
    this.backgroundFilp = 0

    this.messageSound = {
      message1: soundSrc.round.r1_4_message1,
      message2: soundSrc.round.r1_4_message2,
      jemulstar: soundSrc.round.r1_4_jemulstar,
      jemulstart: soundSrc.round.r1_4_jemulstart,
      jemulrun: soundSrc.round.r1_4_jemulrun
    }

    this.specialImage = imageSrc.round.round1_4_redzone

    this.phase.addRoundPhase(this, this.roundPhase00, 1, 20)
    this.phase.addRoundPhase(this, this.roundPhase01, 21, 80)
    this.phase.addRoundPhase(this, this.roundPhase02, 81, 110)
    this.phase.addRoundPhase(this, this.roundPhase03, 111, 152)

    /** 제물스타 이펙트 */
    this.effectJemulstar = new CustomEffect(imageSrc.effect.jemulstar, imageDataInfo.effect.jemulstar, 500, 320, 3, 2)

    /** 제물 생성 이펙트 */
    this.EffectJemulCreate = class JemulCreateEffect extends CustomEditEffect {
      constructor () {
        super()
        this.autoSetEnimation(imageSrc.effect.jemulCreate, imageDataInfo.effect.jemulCreate, 200, 200, 4, 15)
      }
    
      process () {
        super.process()
    
        // 각도 회전
        if (this.enimation != null) {
          this.enimation.degree += 4
        }
      }
    }

    this.load.addImageList([
      imageSrc.round.round1_4_meteoriteDark,
      imageSrc.round.round1_4_redzone,
      imageSrc.enemy.jemulEnemy,
      imageSrc.effect.jemulstar,
      imageSrc.effect.jemulCreate,
    ])

    this.load.addSoundList([
      soundSrc.music.music03_meteorite_zone_battle,
      soundSrc.music.music06_round1_boss_thema,
      soundSrc.music.music08_round1_4_jemul,
      this.messageSound.message1,
      this.messageSound.message2,
      this.messageSound.jemulrun,
      this.messageSound.jemulstar,
      this.messageSound.jemulstart,
    ])

    this.load.addImageList(RoundPackLoad.getRound1ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound1ShareSound())
  }

  processBackground () {
    // 참고: 1-4는 여기에 배경을 조정하는 기능이 없고 각 roundPhase마다 적혀져있습니다.
    if (this.phase.getCurrentPhase() === 0 || this.phase.getCurrentPhase() === 1) {
      this.bgLegacy.backgroundSpeedX = 0.4
    } else if (this.phase.getCurrentPhase() === 2 || this.phase.getCurrentPhase() === 3) {
      // 자연스러운 배경 변화를 위해 x축 위치를 고정시킴
      // 다만, 다음 페이즈에서 배경을 흔드는 상황이 오기 때문에 이 처리는 페이즈 3에서만 적용
      // 주의: 초반에 시간을 너무 끌어버린 경우, 부자연스럽게 배경이 이동할 수 있음.
      // 이것은 버그로 취급하지 않음.
      this.bgLegacy.backgroundSpeedX = 0

      // 만약 배경 X축이 앞으로 이동되었다면, 강제로 0으로 오도록 변경
      if (this.bgLegacy.x > 4) {
        this.bgLegacy.x -= 4
      } else {
        this.bgLegacy.x = 0
      }
    }

    const phase3Time = this.phase.phaseTime[3].startTime
    const phase3End = this.phase.phaseTime[3].endTime

    if (this.timeCheckInterval(phase3Time, phase3Time + 10, 2)) {
      // 엄청나게 배경 흔들기
      this.bgLegacy.x = Math.random() * (phase3End - this.time.currentTime) * 4
      this.bgLegacy.y = Math.random() * (phase3End - this.time.currentTime) * 4
    } else if (this.timeCheckInterval(phase3Time + 10, phase3Time + 20, 3)) {
      // 위력 약화
      this.bgLegacy.x = Math.random() * (phase3End - this.time.currentTime) * 3
      this.bgLegacy.y = Math.random() * (phase3End - this.time.currentTime) * 3
    } else if (this.timeCheckInterval(phase3Time + 20, phase3End - 4, 4)) {
      this.bgLegacy.x = Math.random() * (phase3End - this.time.currentTime) * 2
      this.bgLegacy.y = Math.random() * (phase3End - this.time.currentTime) * 2
    }

    super.processBackground()
  }

  roundPhase00 () {
    // 시작하자마자 보스 등장 (0 ~ 10)
    if (this.timeCheckInterval(3) && this.time.currentTimeFrame === 0) {
      this.field.createEnemy(ID.enemy.jemulEnemy.boss)
      this.sound.musicChange(soundSrc.music.music06_round1_boss_thema)
    }

    // 보스가 일찍 죽으면 해당 페이즈 스킵
    if (this.timeCheckInterval(5, 14) && this.field.enemyNothingCheck()) {
      this.time.setCurrentTime(15)
    }

    this.timePauseWithEnemyCount(15)

    if (this.timeCheckInterval(15) && this.field.enemyNothingCheck()) {
      this.sound.musicChange('', 1)
    }
  }

  roundPhase01 () {
    // 진짜 보스 등장(...)
    if (this.timeCheckFrame(21)) {
      this.sound.musicChange(this.sound.musicSrc)
      this.sound.musicPlay()
      this.field.createEnemy(ID.enemy.jemulEnemy.bossEye, graphicSystem.CANVAS_WIDTH_HALF - 100, graphicSystem.CANVAS_HEIGHT_HALF - 100)
    }
    
    // 참고: 아직 이 코드는 미완성입니다. 라운드 3이 완성된 이후 새로운 루트를 만들때 다시 만들 예정입니다.
    // 원래 이 코드는 보스를 죽인 이후에 상황을 표현해야 하지만, 아직 업데이트 되지 않았습니다.
    // round 1-4에서는 시크릿 루트가 존재하지만 현재는 해당 시크릿 루트가 없습니다.
    if (this.timeCheckInterval(22, 79) && this.field.enemyNothingCheck()) {
      this.waitTimeFrame++

      if (this.waitTimeFrame >= 600) {
        // this.time._currentTime = 80
      }
    }
  }

  roundPhase02 () {
    const phase2Time = this.phase.phaseTime[2].startTime
    if (this.timeCheckFrame(phase2Time, 15)) this.sound.musicStop() // 음악 강제 정지

    // 특정 보스의 데이터 얻어오기
    let boss = this.field.getEnemyObjectById(ID.enemy.jemulEnemy.bossEye)
    if (boss != null) {
      if (this.timeCheckInterval(phase2Time)) {
        // 보스의 모든 행동을 강제로 멈춤
        boss.message = 'stop'
      }

      if (this.timeCheckInterval(phase2Time + 20, phase2Time + 23, 30)) {
        fieldState.createEffectObject(this.effectJemulstar, boss.x - 50, boss.y - 50, 20)
      }

      if (this.timeCheckFrame(phase2Time + 25)) {
        // 보스 죽이기 (점수도 얻음.)
        boss.message = 'die'
      }
    }

    if (this.timeCheckFrame(phase2Time + 5, 0)) {
      this.bgLegacy.changeImage(this.specialImage, 150)
    }
    if (this.timeCheckInterval(phase2Time + 5, phase2Time + 30)) {
      this.bgLegacy.imageSrc = this.specialImage
      this.bgLegacy.backgroundSpeedX = 0
      this.bgLegacy.backgroundSpeedY = 0
    }

    // 사운드 출력
    if (this.timeCheckFrame(phase2Time + 10, 0)) this.sound.play(this.messageSound.message1)
    if (this.timeCheckFrame(phase2Time + 15, 0)) this.sound.play(this.messageSound.message2)
    if (this.timeCheckFrame(phase2Time + 20, 0)) this.sound.play(this.messageSound.jemulstar)

    // 임시 주석처리: 나중에 활용할 수도 있음
    // if (this.timeCheckInterval(phase2Time + 20, phase2Time + 23, 30)) {
    //   if (boss != null) {
    //     fieldState.createEffectObject(this.effectJemulstar, boss.x - 50, boss.y - 50, 20)
    //   } else {
    //     fieldState.createEffectObject(this.effectJemulstar, 250, 150, 20)
    //   }
    // }
  }

  roundPhase03 () {
    const phase3Time = this.phase.phaseTime[3].startTime
    const phase3End = this.phase.phaseTime[3].endTime

    if (this.timeCheckFrame(phase3Time, 5)) {
      this.sound.musicChange(soundSrc.music.music08_round1_4_jemul)
    }

    this.bgLegacy.imageSrc = this.specialImage

    // 배경 흔들기는 processBackground에서 처리합니다.

    // 저주받은 운석들이 등장함. 파괴해도, 더 강한 운석이 등장할 뿐...
    if (this.timeCheckInterval(phase3Time, phase3Time + 30, 30)) {
      // 가운데에서 운석 소환 (정학한 가운데는 구현이 어려움)
      this.field.createEnemy(ID.enemy.jemulEnemy.redMeteorite, graphicSystem.CANVAS_WIDTH_HALF - 60, graphicSystem.CANVAS_HEIGHT_HALF - 20)
    }

    // 운석 최대 개수 = 1초에 1씩 증가하고 최대 25로 고정
    let meteoriteMaxCount = this.time.currentTime - phase3Time + 1
    if (meteoriteMaxCount > 25) meteoriteMaxCount = 25

    // 운석을 아무리 죽여봤자 의미 없을 뿐... 더 강한 운석이 나온다.
    if (this.timeCheckInterval(phase3Time, phase3End, 1) && this.field.getEnemyCount() < meteoriteMaxCount) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redMeteoriteImmortal, graphicSystem.CANVAS_WIDTH_HALF - 60, graphicSystem.CANVAS_HEIGHT_HALF - 20)
    }

    // 이펙트 표시
    if (this.timeCheckInterval(phase3Time, phase3End - 5, 60)) {
      fieldState.createEffectObject(new this.EffectJemulCreate(), graphicSystem.CANVAS_WIDTH_HALF - 100, graphicSystem.CANVAS_HEIGHT_HALF - 100)
    }

    // 사운드 출력
    if (this.timeCheckFrame(phase3Time, 0)) {
      this.sound.play(this.messageSound.jemulstart)
    } else if (this.timeCheckInterval(phase3Time + 4, phase3End - 4, 240)) {
      this.sound.play(this.messageSound.jemulrun)
    }
  }

  display () {
    super.display()
    if (this.phase.getCurrentPhase() >= 0 && this.phase.getCurrentPhase() <= 3 && this.time.currentTime <= 110) {
      this.meter.bossHpDefaultStyle()
    }
  }
}

class Round1_5 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round1_5)
    this.bgLegacy.imageSrc = imageSrc.round.round1_4_meteoriteDark
    this.redZoneImage = imageSrc.round.round1_5_meteoriteRed
    this.sound.musicSrc = soundSrc.music.music04_meteorite_zone_red

    this.phase.addRoundPhase(this, this.roundPhase00, 1, 30)
    this.phase.addRoundPhase(this, this.roundPhase01, 31, 60)
    this.phase.addRoundPhase(this, this.roundPhase02, 61, 90)
    this.phase.addRoundPhase(this, this.roundPhase03, 91, 107)
    this.phase.addRoundPhase(this, this.roundPhase04, 108, 120)
    this.phase.addRoundPhase(this, this.roundPhase05, 121, 150)
    this.phase.addRoundPhase(this, this.roundPhase06, 151, 180)
    this.phase.addRoundPhase(this, this.roundPhase07, 181, 200)
    this.phase.addRoundPhase(this, this.roundPhase08, 201, 210)

    this.load.addImageList([
      imageSrc.round.round1_4_meteoriteDark,
      imageSrc.round.round1_5_meteoriteRed,
      imageSrc.enemy.jemulEnemy,
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemy.meteoriteEnemy,
    ])

    this.load.addSoundList([
      soundSrc.music.music04_meteorite_zone_red,
      soundSrc.music.music02_meteorite_zone_field,
    ])

    this.load.addImageList(RoundPackLoad.getRound1ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound1ShareSound())
  }

  processBackground () {
    const imageA = imageSrc.round.round1_3_meteoriteDeep
    let phase7Start = this.phase.phaseTime[7].startTime
    let phase8Start = this.phase.phaseTime[8].startTime
    if (this.timeCheckFrame(phase7Start, 0)) {
      this.bgLegacy.changeImage(imageA, 600)
    } else if (this.timeCheckFrame(30, 0)) {
      this.bgLegacy.changeImage(this.redZoneImage, 600)
    }

    if (this.timeCheckInterval(0, phase7Start - 1)) {
      this.bgLegacy.backgroundSpeedX = 0.8
    } else if (this.timeCheckInterval(phase7Start, phase8Start)) {
      this.bgLegacy.backgroundSpeedX = 1.2
    } else if (this.timeCheckInterval(phase8Start, 210)) {
      this.bgLegacy.backgroundSpeedX = 1
    }

    if (this.timeCheckInterval(45, 150, 600)) {
      if (this.bgLegacy.backgroundSpeedY === 0 || this.bgLegacy.backgroundSpeedY === 0.1) {
        this.bgLegacy.backgroundSpeedY = -0.1
      } else {
        this.bgLegacy.backgroundSpeedY = 0.1
      }
    }

    super.processBackground()
  }

  roundPhase00 () {
    if (this.timeCheckInterval(1, 11, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.red)
    } else if (this.timeCheckInterval(12, 17, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redAir)
    } else if (this.timeCheckInterval(18, 23, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redShip)
    } else if (this.timeCheckInterval(24, 30, 20)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }
  }

  roundPhase01 () {
    // 요구되는 초당 dps 비중
    // 비행기: 70%, 쉽: 70%, 운석: 50%, 비행기 or 쉽 + 쥬얼 80%

    if (this.timeCheckInterval(31, 36, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir)
    } else if (this.timeCheckInterval(37, 42, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redShip)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }

    if (this.timeCheckInterval(43, 49, 120)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.red)
    }

    if (this.timeCheckInterval(50, 60, 60)) {
      let randomNumber = Math.random() * 100
      if (randomNumber < 50) {
        this.field.createEnemy(ID.enemy.jemulEnemy.redAir)
        this.field.createEnemy(ID.enemy.jemulEnemy.hellAir)
      } else {
        this.field.createEnemy(ID.enemy.jemulEnemy.redShip)
        this.field.createEnemy(ID.enemy.jemulEnemy.hellShip)
      }
    }

    if (this.timeCheckInterval(50, 60, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }
  }

  roundPhase02 () {
    // 운석: 초당 72%(70초까지) -> 초당 35%(90초까지)
    if (this.timeCheckInterval(61, 70, 15)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class3)
    } else if (this.timeCheckInterval(71, 90, 120)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class3)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.red)
    }

    // 로켓 초당 20%(5초동안)
    if (this.timeCheckInterval(61, 65, 60)) {
      for (let i = 0; i < 2; i++) {
        this.field.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
      }
    }

    // 감지기 초당 20%(5초동안)
    if (this.timeCheckInterval(66, 70, 60)) {
      for (let i = 0; i < 2; i++) {
        this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
      }
    }

    // 비행기 깜짝 출현 -> 초당 140%(2회 등장)
    if (this.timeCheckFrame(73, 0) || this.timeCheckFrame(81, 0)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.redShip)
      this.field.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }
  }

  roundPhase03 () {
    // 20%
    if (this.timeCheckInterval(90, 105, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 30%
    if (this.timeCheckInterval(90, 105, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class3)
      this.field.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }

    // 25%
    if (this.timeCheckInterval(90, 105, 150)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.redShip)
    }

    this.timePauseWithEnemyCount(107)
  }

  roundPhase04 () {
    // 보스전
    if (this.timeCheckFrame(108, 7)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.boss)
    }

    if (this.timeCheckInterval(110, 118) && this.field.enemyNothingCheck()) {
      this.time.setCurrentTime(120)
    }

    this.timePauseWithEnemyCount(119)
  }

  roundPhase05 () {
    // 50%
    if (this.timeCheckInterval(121, 135, 10)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }

    // 20%
    if (this.timeCheckInterval(124, 128, 30)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
    }

    // 20%
    if (this.timeCheckInterval(129, 135, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 80%
    if (this.timeCheckInterval(136, 150, 60)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.redShip)
    }
  }

  roundPhase06 () {
    // 80%
    if (this.timeCheckInterval(151, 171, 90)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.redShip)
    }

    // 75%
    if (this.timeCheckInterval(151, 171, 90)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.red)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.bomb)
    }

    // 30% + 60%
    if (this.timeCheckInterval(174, 178, 20)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
      this.field.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }

    // 적이 많다면, 시간 멈춤
    this.timePauseWithEnemyCount(179)
  }

  roundPhase07 () {
    // 운석지대
    if (this.timeCheckFrame(181, 11)) {
      this.sound.musicChange(soundSrc.music.music02_meteorite_zone_field)
    }

    // 40%
    if (this.timeCheckInterval(181, 200, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class3)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.class4)
    }

    // 53%
    if (this.timeCheckInterval(181, 200, 90)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.bomb)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
      this.field.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
    }
  }

  roundPhase08 () {
    // 50%
    if (this.timeCheckInterval(201, 207, 60)) {
      this.field.createEnemy(ID.enemy.meteoriteEnemy.stone)
    }

    this.timePauseWithEnemyCount(208)
  }

  display () {
    super.display()
    if (this.phase.getCurrentPhase() === 4) this.meter.bossHpDefaultStyle(ID.enemy.jemulEnemy.boss)
  }
}

class Round1_6 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round1_6)
    this.bgLegacy.imageSrc = imageSrc.round.round1_2_meteorite
    this.spaceImage = imageSrc.round.round1_6_space
    this.sound.musicSrc = soundSrc.music.music02_meteorite_zone_field
    this.musicTour = soundSrc.music.music05_space_tour
    this.musicPlanet = soundSrc.music.music07_paran_planet_entry

    this.phase.addRoundPhase(this, this.roundPhase00, 1, 30)
    this.phase.addRoundPhase(this, this.roundPhase01, 31, 60)
    this.phase.addRoundPhase(this, this.roundPhase02, 61, 90)
    this.phase.addRoundPhase(this, this.roundPhase03, 91, 120)
    this.phase.addRoundPhase(this, this.roundPhase04, 121, 152)

    /**
     * 이 라운드에서 행성을 보여주기 위한 오브젝트
     */
    this.planet = this.createPlanet()

    this.load.addImageList([
      imageSrc.round.round1_2_meteorite,
      imageSrc.round.round1_6_space,
      imageSrc.round.round1_6_paran_planet,
      imageSrc.enemy.jemulEnemy,
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemy.meteoriteEnemy,
    ])

    this.load.addSoundList([
      soundSrc.music.music02_meteorite_zone_field,
      soundSrc.music.music05_space_tour,
      soundSrc.music.music06_round1_boss_thema,
      soundSrc.music.music07_paran_planet_entry,
    ])

    this.load.addImageList(RoundPackLoad.getRound1ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound1ShareSound())
  }

  /**
   * 이 라운드에서 행성을 보여주기 위한 오브젝트를 만드는 함수
   */
   createPlanet () {
    return {
      image: imageSrc.round.round1_6_paran_planet,
      elapsedFrame: 0,
      baseSize: 60,
      size: 60,
      degree: 0,
      x: graphicSystem.CANVAS_WIDTH + 100,
      xBase: graphicSystem.CANVAS_WIDTH + 100,
      y: graphicSystem.CANVAS_HEIGHT_HALF,
      totalDisplayTime: 50,
      startTime: 100,
      process: function () {
        this.elapsedFrame++
        const sectionFrame = 300
        const moveSize = (this.xBase - graphicSystem.CANVAS_WIDTH_HALF) / 1200
        const upSize = [
          (100 - this.baseSize) / sectionFrame, // 40
          (180 - 100) / sectionFrame, // 80
          (300 - 180) / sectionFrame, // 120
          (600 - 300) / sectionFrame, // 300
          (1200 - 600) / sectionFrame, // 600
          (2000 - 1200) / sectionFrame // 800
        ]

        const sectionLevel = Math.floor(this.elapsedFrame / 300)
        if (sectionLevel <= 3) {
          this.x = (sectionFrame * 3) - (moveSize * this.elapsedFrame)
        } else if (sectionLevel <= 3 + upSize.length) {
          // sectionLevel 4부터 행성의 크기가 증가
          this.size += upSize[sectionLevel - 4]
          // this.x = 300 // 아마도 중간위치가 300인 것 같음.
        } else {
          this.size += 0
        }
      },
      display: function () {
        let outputX = this.x - (this.size / 2)
        let outputY = this.y - (this.size / 2)
        // 이미지를 가져옴, 없을경우 캐시시킴
        let getImage = graphicSystem.getCacheImage(this.image)
        if (getImage != null) {
          graphicSystem.imageDisplay(this.image, 0, 0, getImage.width,getImage.height, outputX, outputY, this.size, this.size, 0, this.degree)
        }
      }
    }
  }

  roundPhase00 () {
    // 20%
    if (this.timeCheckInterval(1, 24, 240)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.susong)
    }

    // 35%
    if (this.timeCheckInterval(1, 24, 120)) {
      this.field.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.field.createEnemy(ID.enemy.jemulEnemy.redAir)
    }

    // 20%
    if (this.timeCheckInterval(1, 24, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    this.timePauseWithEnemyCount(26)

    // 보스 출현: 중복 생성을 방지하기 위해 시간값을 강제로 변경했습니다.
    if (this.timeCheckFrame(27)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.boss)
      this.sound.musicChange(soundSrc.music.music06_round1_boss_thema)
      this.time.setCurrentTime(28)
    }

    this.timePauseWithEnemyCount(28)
    if (this.timeCheckInterval(28) && this.field.enemyNothingCheck()) {
      this.sound.musicStop()
    }
  }

  roundPhase01 () {
    // 빛 생성 여부 설정
    // 24%, 48%, 80%, 24%, 12%
    let isCreateLight = this.timeCheckInterval(31, 34, 10)
      || this.timeCheckInterval(35, 40, 5)
      || this.timeCheckInterval(41, 45, 3)
      || this.timeCheckInterval(46, 50, 10)
      || this.timeCheckInterval(51, 60, 20)
    
    if (isCreateLight) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
    }

    // 30%
    if (this.timeCheckInterval(46, 60, 10)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase02 () {
    // 20%
    if (this.timeCheckInterval(61, 90, 30)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    // 20%
    if (this.timeCheckInterval(61, 90, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 50%
    if (this.timeCheckInterval(61, 90, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.car)
      this.field.createEnemy(ID.enemy.spaceEnemy.attack)
      this.field.createEnemy(ID.enemy.spaceEnemy.energy)
      this.field.createEnemy(ID.enemy.spaceEnemy.square)
    }

    // 33% ~ 10%
    if (this.timeCheckInterval(75, 76, 30)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.donggrami)
    } else if (this.timeCheckInterval(77, 90, 150)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.donggrami)
    }
  }

  roundPhase03 () {
    // 30%, 15%, 7%
    let isCreateEnemy = this.timeCheckInterval(91, 100, 60)
      || this.timeCheckInterval(101, 110, 120)
      || this.timeCheckInterval(111, 120, 240)

    // 20%, 10%, 5%
    let isCreateLight = this.timeCheckInterval(91, 100, 30)
      || this.timeCheckInterval(101, 110, 60)
      || this.timeCheckInterval(111, 120, 120)

    // 15%
    if (this.timeCheckInterval(91, 120, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.donggrami)
    }

    // 10%
    if (this.timeCheckInterval(91, 112, 120)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (isCreateEnemy) {
      this.field.createEnemy(ID.enemy.spaceEnemy.car)
      this.field.createEnemy(ID.enemy.spaceEnemy.attack)
      this.field.createEnemy(ID.enemy.spaceEnemy.rocket)
    }

    if (isCreateLight) {
      this.field.createEnemy(ID.enemy.spaceEnemy.light)
      this.field.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase04 () {
    if (this.timeCheckInterval(126, 133, 40)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.donggrami, graphicSystem.CANVAS_WIDTH_HALF, graphicSystem.CANVAS_HEIGHT_HALF)
    } else if (this.timeCheckInterval(134, 148, 60)) {
      this.field.createEnemy(ID.enemy.spaceEnemy.donggrami, graphicSystem.CANVAS_WIDTH_HALF, graphicSystem.CANVAS_HEIGHT_HALF)
    }
  }

  processPhase () {
    super.processPhase()

    // 음악 재생 시간 관계상, 29초 지점부터 음악이 변경됨.
    if (this.timeCheckFrame(30, 4)) {
      this.sound.musicChange(this.musicTour, 0)
      this.bgLegacy.changeImage(this.spaceImage, 360)
    }

    // 참고: space tour 음악은 약 97초
    // 음악이 30초 + 97초 = 127초 지점에 종료됨.
    // 파란 행성 진입 음악은 약 128초 붜터 약 24초간 재생됨 (페이드 시간을 고려해서)
    const fadeTime = 1
    const planetMusicPlayTime = 128 - fadeTime
    if (this.timeCheckFrame(planetMusicPlayTime, 0)) {
      this.sound.musicChange(this.musicPlanet, fadeTime)
    }
  }
  processSaveString () {
    // 행성을 배경에 표시하기 위해 데이터의 일부를 저장
    if (this.time.currentTime >= this.stat.finishTime - this.planet.totalDisplayTime) {
      this.planet.process()
      this.saveString = this.planet.x + ',' + this.planet.size + ',' + this.planet.elapsedFrame
    }
  }

  processBackground () {
    super.processBackground()
    if (this.timeCheckInterval(31, this.stat.finishTime)) {
      this.bgLegacy.imageSrc = this.spaceImage
    }
  }

  display () {
    super.display()
    if (this.timeCheckInterval(28)) this.meter.bossHpDefaultStyle(ID.enemy.spaceEnemy.boss)
    if (this.time.currentTime >= this.stat.finishTime - this.planet.totalDisplayTime) {
      this.planet.display()
    }
  }

  loadDataSaveString () {
    let str = this.saveString.split(',')
    this.planet.x = Number(str[0])
    this.planet.size = Number(str[1])
    this.planet.elapsedFrame = Number(str[2])
  }
}

class Round1_test extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round1_test)
    this.bgLegacy.backgroundSpeedY = 0
    this.bgLegacy.backgroundSpeedX = 0
    this.bgLegacy.x = 0
    this.bgLegacy.imageSrc = imageSrc.round.round1_1_space
    this.phase.addRoundPhase(this, () => {
      if (this.timeCheckInterval(1, 999, 60) && this.field.getEnemyCount() === 0) {
        this.field.createEnemy(ID.enemy.towerG1.pentagon, 600)
      }
    }, 0, 999)
  }
}

class Round2_1 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round2_1)
    this.sound.musicSrc = soundSrc.music.music09_paran_planet
    this.maeulImage = imageSrc.round.round2_2_maeul_entrance

    this.phase.addRoundPhase(this, this.roundPhase01, 0, 30)
    this.phase.addRoundPhase(this, this.roundPhase02, 31, 60)
    this.phase.addRoundPhase(this, this.roundPhase03, 61, 90)
    this.phase.addRoundPhase(this, this.roundPhase04, 91, 120)
    this.phase.addRoundPhase(this, this.roundPhase05, 121, 150)

    this.load.addImageList([
      imageSrc.round.round2_1_cloud,
      imageSrc.round.round2_2_maeul_entrance,
    ])

    this.load.addSoundList([
      soundSrc.music.music09_paran_planet,
    ])

    this.load.addImageList(RoundPackLoad.getRound2ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound2ShareSound())

    this.setBgLayer()
  }

  /** bgLayer를 설정할게 많아서 따로 함수로 분리: 참고 setBgLayer라는 함수는 RoundData에는 없는 함수입니다. */
  setBgLayer () {
    const darkSky = '#001A33'
    const darklight = '#002E5B'
    const sky = '#00478D'
    const skylight = '#1D6FC0'
    const light = '#4995E1'
    const maeulsky = '#67B2FF'
    const gradientWidth = 800
    const gradientHeight = 1200 // 20 second * 60 frame
    const colorA = [darkSky, darklight, darkSky, sky, skylight, sky, light, maeulsky, light, light]
    const colorB = [darklight, darkSky, sky, skylight, sky, light, maeulsky, light, light, light]

    for (let i = 0; i < colorA.length; i++) {
      this.bgLayer.setBackgroundGadient(colorA[i], colorB[i], 0, gradientHeight * i, gradientWidth, gradientHeight, false)
    }

    // 구름 레이어 추가: 구름은 배경과 다르게 정지하지 않고 계속 스크롤됩니다. // 배경은 중간에 멈출 수 있음.
    this.bgLayer.addLayerImage(imageSrc.round.round2_1_cloud, 1)
    this.bgLayer.setLayerSpeed(0, 0, 1) // 구름은 배경과 다르게 지속적으로 이동하도록 변경
  }

  display () {
    super.display()

    // 마을 보여주기
    if (this.time.currentTime >= 125) {
      // 마을은 125초부터 140초까지 서서히 등장합니다.
      const leftTime = 140 - this.time.currentTime
      const baseElapsed = 1200
      let elapsed = baseElapsed - (60 * leftTime) + this.time.currentTimeFrame
      if (elapsed > baseElapsed) elapsed = baseElapsed

      let maeulWidth = Math.floor(game.graphic.CANVAS_WIDTH / baseElapsed * elapsed)
      let maeulHeight = Math.floor(game.graphic.CANVAS_HEIGHT / baseElapsed * elapsed)
      let maeulX = (game.graphic.CANVAS_WIDTH) - maeulWidth
      let maeulY = (game.graphic.CANVAS_HEIGHT) - maeulHeight
      game.graphic.setAlpha(1 / baseElapsed * elapsed)
      game.graphic.imageView(this.maeulImage, maeulX, maeulY, maeulWidth, maeulHeight)
      game.graphic.setAlpha(1)
    }

    // 보스 체력 보여주기 (동그라미가 등장했을 때)
    if (this.time.currentTime === 147) Round2_1.displayBossHp()
  }

  processBackground () {
    super.processBackground()
    this.bgLayer.setBackgroundPosition(0, this.time.currentTimeTotalFrame)
  }

  roundPhase01 () {
    // 참고: 일반 동그라미는 개체당 dps 10%
    // 특수 동그라미는 개체당 dps 20%

    // 파랑 동그라미가 먼저 등장 (dps 40%)
    if (this.timeCheckInterval(3, 9, 15)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniBlue)
    }
    
    // 초록 동그라미가 추가로 등장 (dps 60%)
    if (this.timeCheckInterval(10, 18, 60)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniGreen)
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniGreen)
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniBlue)
    }

    // 빨강, 보라가 추가로 등장 (dps 80%)
    if (this.timeCheckInterval(19, 27, 60)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniGreen)
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniBlue)
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniRed)
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniPurple)
    }
  }

  roundPhase02 () {
    // 남은 적들을 전부 죽이지 않으면 시간 일시 정지
    // 이것은, 다음 적들의 특징을 효과적으로 보여주기 위해 추가한 것
    this.timePauseWithEnemyCount(33)

    // 느낌표 동그라미 dps 60%
    if (this.timeCheckInterval(35, 40, 20)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.exclamationMark)
    }

    // 물음표 동그라미 dps 60%
    if (this.timeCheckInterval(43, 48, 20)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.questionMark)
    }

    // 이모지 동그라미 dps 60%
    if (this.timeCheckInterval(50, 55, 20)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.emoji)
    }
  }

  roundPhase03 () {
    // 일반 동그라미: 초당 dps 40% (60s ~ 70s)
    // 초당 dps 60% (71s ~ 80s)
    // 초당 dps 20% (81s ~ 87s)
    if (this.timeCheckInterval(60, 70, 15) || this.timeCheckInterval(71, 80, 10) || this.timeCheckInterval(81, 87, 30)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.mini)
    }

    // 특수 동그라미: 초당 dps 40% (60s ~ 70s)
    // 초당 dps 60% (71s ~ 80s)
    // 초당 dps 40% (81s ~ 87s)
    if (this.timeCheckInterval(60, 70, 30) || this.timeCheckInterval(71, 80, 20) || this.timeCheckInterval(81, 87, 30)) {
      let random = Math.floor(Math.random() * 3)
      switch (random) {
        case 0: this.field.createEnemy(ID.enemy.donggramiEnemy.exclamationMark); break
        case 1: this.field.createEnemy(ID.enemy.donggramiEnemy.questionMark); break
        case 2: this.field.createEnemy(ID.enemy.donggramiEnemy.emoji); break
      }
    }
  }

  roundPhase04 () {
    this.timePauseWithEnemyCount(93)

    // talk 동그라미, 초당 dps 60%
    if (this.timeCheckInterval(95, 100, 20)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.talk)
    }

    // speed 동그라미, 초당 dps 60%
    if (this.timeCheckInterval(103, 108, 20)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.speed)
    }

    // 일반 동그라미 (모든 색) - 초당 dps 100%!
    // 스플래시 없거나 전투력이 낮으면 동그라미에게 죽을 수 있음
    if (this.timeCheckInterval(110, 117, 6)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.mini)
    }
  }

  roundPhase05 () {
    // 121 ~ 141초 적 추가로 등장 (모든 종류 동시에 등장)
    // 초당 dps 120% // 최대 제한 40개
    if (this.timeCheckInterval(121, 140, 30) && this.field.getEnemyCount() < 40) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.mini)
    }

    if (this.timeCheckInterval(121, 140, 20) && this.field.getEnemyCount() < 40) {
      let random = Math.floor(Math.random() * 5)
      switch (random) {
        case 0: this.field.createEnemy(ID.enemy.donggramiEnemy.exclamationMark); break
        case 1: this.field.createEnemy(ID.enemy.donggramiEnemy.questionMark); break
        case 2: this.field.createEnemy(ID.enemy.donggramiEnemy.emoji); break
        case 3: this.field.createEnemy(ID.enemy.donggramiEnemy.talk); break
        case 4: this.field.createEnemy(ID.enemy.donggramiEnemy.speed); break
      }
    }

    this.timePauseWithEnemyCount(145)

    // 146초 보스전
    if (this.timeCheckFrame(146, 1)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.bossBig1)
      this.field.createEnemy(ID.enemy.donggramiEnemy.bossBig2)
      this.time.setCurrentTime(147)
    }
    this.timePauseWithEnemyCount(147)
  }

  /** 동그라미 보스 hp를 표시하는 전용 함수 ?! */
  static displayBossHp () {
    let enemy = BaseField.getEnemyObject()
    let src = imageSrc.round.round2_donggramiHp
    let cacheImage = game.graphic.getCacheImage(src)

    if (cacheImage != null && enemy.length > 0) {
      let x = game.graphic.CANVAS_WIDTH - cacheImage.width
      game.graphic.imageView(src, x, 0)
    }

    const meterLength = 200
    const meterX = graphicSystem.CANVAS_WIDTH - meterLength
    const layer1Y = 40
    const layer2Y = 80
    for (let i = 0; i < enemy.length; i++) {
      let e = enemy[i]
      let y = i === 0 ? layer1Y : layer2Y // y축 위치 결정 (적 배열 번호에 따라서...)

      if (e.id === ID.enemy.donggramiEnemy.bossBig1) {
        game.graphic.meterRect(meterX, y, meterLength, layer1Y, ['#2C52B0', '#6486D9'], e.hp, e.hpMax)
      } else if (e.id === ID.enemy.donggramiEnemy.bossBig2) {
        game.graphic.meterRect(meterX, y, meterLength, layer1Y, ['#9B442F', '#B87C6D'], e.hp, e.hpMax)
      }

      digitalDisplay(e.hp + '/' + e.hpMax, meterX, y)
    }
  }

  /** 동그라미 마을에서 사용하는 그라디언트 얻기 (round 2 전역적으로 사용함) */
  static getMaeulGradientColor () {
    return ['#4995E1', '#67B2FF']
  }
}

class Round2_2 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round2_2)
    this.sound.musicSrc = soundSrc.music.music10_donggrami_maeul

    // 시간이 배경에 맞추어서 진행되기 때문에, 배경이 변경되는 것을 기준으로 대략적인 시간 값이 설정되었습니다.
    // 1초에 60frame = 60px씩 이동
    // [실제 배경 기준 도착 시점]
    // [0 ~ 20, 21 ~ 60, 61 ~ 87, 88 ~ 114, 115 ~ 141, 142 ~ 169]
    // 168초 쯤에 배경 스크롤 중지됨
    // 실제 라운드 기준
    // [0 ~ 20, 21 ~ 60, 61 ~ 80, 81 ~ 110, 111 ~ 130, 131 ~ 160, 161 ~ 170]
    this.phase.addRoundPhase(this, this.roundPhase00, 0, 20) // 입구
    this.phase.addRoundPhase(this, this.roundPhase01, 21, 60) // 터널
    this.phase.addRoundPhase(this, this.roundPhase02, 61, 80) // 아파트 1단지
    this.phase.addRoundPhase(this, this.roundPhase03, 81, 110) // 공원
    this.phase.addRoundPhase(this, this.roundPhase04, 111, 130) // 아파트 2단지
    this.phase.addRoundPhase(this, this.roundPhase05, 131, 160) // 상가
    this.phase.addRoundPhase(this, this.roundPhase06, 161, 170) // 플래카드

    this.load.addImageList([
      imageSrc.round.round2_2_maeul_entrance,
      imageSrc.round.round2_2_apartment1,
      imageSrc.round.round2_2_apartment2,
      imageSrc.round.round2_2_park,
      imageSrc.round.round2_2_placard,
      imageSrc.round.round2_2_shopping_mall,
      imageSrc.round.round2_2_tunnel,
      imageSrc.round.round2_2_tunnel_outload,
    ])

    this.load.addSoundList([
      soundSrc.music.music10_donggrami_maeul,
    ])

    this.load.addImageList(RoundPackLoad.getRound2ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound2ShareSound())
    this.setBgLayer()
  }

  setBgLayer () {
    this.bgLayer.setColor(Round2_1.getMaeulGradientColor())

    const bgList = [
      imageSrc.round.round2_2_maeul_entrance,
      imageSrc.round.round2_2_tunnel,
      imageSrc.round.round2_2_tunnel_outload,
      imageSrc.round.round2_2_apartment1,
      imageSrc.round.round2_2_park,
      imageSrc.round.round2_2_apartment2,
      imageSrc.round.round2_2_shopping_mall,
      imageSrc.round.round2_2_placard
    ]
    const bgWidth = [800, 800, 800, 1600, 1600, 1600, 1600, 800]
    let totalX = 0

    for (let i = 0; i < bgList.length; i++) {
      this.bgLayer.setBackgroundImage(bgList[i], totalX, 0)
      totalX += bgWidth[i]
    }

    // 배경 스크롤은 무한루프되지 않습니다. (끝지점에 도착하면 화면 이동 끝)
    this.bgLayer.setBackgroundScroolLoop(false, false)
  }

  processBackground () {
    super.processBackground()
    if (this.time.currentTime <= 19) {
      this.bgLayer.setBackgroundSpeed(0, 0)
    } else if (this.time.currentTime >= 20) {
      this.bgLayer.setBackgroundSpeed(1, 0)
    }
  }

  roundPhase00 () {
    // 보스전: (2-1 보스전과 동일) ?!
    // 2 ~ 19초간 진행
    // 보스가 죽는다면 진행구간이 스킵됨

    if (this.timeCheckFrame(2)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.bossBig1)
      this.field.createEnemy(ID.enemy.donggramiEnemy.bossBig2)
      this.time.setCurrentTime(3)
    }

    if (this.timeCheckInterval(5, 18) && this.field.getEnemyCount() <= 0) {
      this.time.setCurrentTime(19)
    }

    this.timePauseWithEnemyCount(19)
  }

  roundPhase01 () {
    // 일반 동그라미만 등장 (색깔은 자유)
    // 총 dps: 40%
    // 시간: 20 ~ 60
    // 최대 마리수 제한: 40
    if (this.timeCheckInterval(20, 60, 15) && this.field.getEnemyCount() < 40) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.mini)
    }
  }

  roundPhase02 () {
    // 일반 동그라미만 등장 (색갈비중: 파란색 4, 초록색 4, 나머지 4)
    // 총 dps: 120%
    // 시간: 61 ~ 80
    // 최대 마리수 제한: 70 ~ 72(70마리 이하일때, 동시에 여러개 생성하기 때문에 이 수치를 초과할 수 있음)
    if (this.timeCheckInterval(62, 77, 15) && this.field.getEnemyCount() < 70) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniBlue)
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniGreen)
      this.field.createEnemy(ID.enemy.donggramiEnemy.mini)
    }
  }

  /**
   * 스페셜 동그라미를 만듭니다. (중복 코드 방지용 함수)
   * @param {number} rRange 코드 구분 기호용도(0: 전체, 1: talkShopping 제외)
   */
  createRandomSpecialDonggrami (rRange = 0) {
    let capR = 7
    if (rRange === 1) capR = 6 

    let random = Math.floor(Math.random() * capR)
    switch (random) {
      case 0: this.field.createEnemy(ID.enemy.donggramiEnemy.bounce); break
      case 1: this.field.createEnemy(ID.enemy.donggramiEnemy.speed); break
      case 2: this.field.createEnemy(ID.enemy.donggramiEnemy.exclamationMark); break
      case 3: this.field.createEnemy(ID.enemy.donggramiEnemy.questionMark); break
      case 4: this.field.createEnemy(ID.enemy.donggramiEnemy.emoji); break
      case 5: this.field.createEnemy(ID.enemy.donggramiEnemy.talk); break
      case 6: this.field.createEnemy(ID.enemy.donggramiEnemy.talkShopping); break
    }
  }

  roundPhase03 () {
    // 특수 동그라미만 등장 (초반엔 점프하는 동그라미만 등장)
    // 총 dps: 60%, 80%, 60%
    // 시간: 81 ~ 110

    if (this.timeCheckInterval(81, 85, 20)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.bounce)
    } else if (this.timeCheckInterval(86, 100, 15)) {
      this.createRandomSpecialDonggrami(1)
    } else if (this.timeCheckInterval(101, 107, 20)) {
      this.createRandomSpecialDonggrami(1)
    }
  }

  roundPhase04 () {
    // 일반 동그라미만 등장 (이 구간이 제일 적이 많음)
    // 총 dps: 120%, 150%, 120%
    // 시간: 110 ~ 130
    // 최대 마리수 제한: 100
    let isCreateEnemy = this.timeCheckInterval(112, 117, 10)
      || this.timeCheckInterval(118, 122, 8)
      || this.timeCheckInterval(123, 127, 10)

    if (isCreateEnemy && this.field.getEnemyCount() < 100) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniRed)
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniPurple)
      this.field.createEnemy(ID.enemy.donggramiEnemy.miniArchomatic)
      this.field.createEnemy(ID.enemy.donggramiEnemy.mini)
    }
  }

  roundPhase05 () {
    // 일반 + 특수 동그라미
    // 대화 동그라미의 비중 대폭 증가
    // 총 dps: 40%(131 ~ 140), 80%(141 ~ 150), 120%(150 ~ 160)
    // 시간: 130 ~ 160
    if (this.timeCheckInterval(131, 140, 60)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.talk)
      this.field.createEnemy(ID.enemy.donggramiEnemy.talkShopping)
    } else if (this.timeCheckInterval(141, 150, 15)) {
      this.createRandomSpecialDonggrami()
    } else if (this.timeCheckInterval(151, 160, 10)) {
      this.createRandomSpecialDonggrami()
    }
  }

  roundPhase06 () {
    // 점프하는 동그라미만 등장
    // 총 dps: 40%
    if (this.timeCheckInterval(161, 166, 30)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.bounce)
    }

    if (this.timeCheckFrame(167, 12)) {
      this.sound.musicChange('', 3)
    }

    // 적 남아있으면 시간 멈춤
    this.timePauseWithEnemyCount(168)
  }

  display () {
    super.display()

    // 동그라미 보스전 체력 표시용도
    if (this.phase.getCurrentPhase() === 0 && this.field.getEnemyCount() !== 0) Round2_1.displayBossHp()
  }
}

class Round2_3 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round2_3)
    this.bgLayer.setBackgroundSpeed(0, 0)
    this.bgLayer.addLayerImage(imageSrc.round.round2_3_maeul_space) // 0번 레이어: 스페이스 배경 표시
    this.bgLayer.addLayerImage(imageSrc.round.round2_2_placard) // 1번 레이어: 플래카드 2-2(동그라미 마을 끝 부분)
    this.bgLayer.addLayerImage(imageSrc.round.round2_3_placard) // 2번 레이어: 플래카드 2-3

    this.layerNumber = {
      SPACE: 0,
      PLACARD2_2: 1,
      PLACARD2_3: 2,
    }

    // 레이어들의 알파값 수정
    let getLayer = this.bgLayer.getLayer()
    getLayer[this.layerNumber.SPACE].setAlpha(0)
    getLayer[this.layerNumber.PLACARD2_2].setAlpha(1) // 2-2 플래카드만 표시
    getLayer[this.layerNumber.PLACARD2_3].setAlpha(0)

    this.phase.addRoundPhase(this, this.roundPhase00, 0, 9)
    this.phase.addRoundPhase(this, this.roundPhase01, 10, 69)
    this.phase.addRoundPhase(this, this.roundPhase02, 70, 129)
    this.phase.addRoundPhase(this, this.roundPhase03, 130, 187)

    /** 음악의 리스트 (복도 구간은 음악 없음) */
    this.musicList = {
      normal_road: '',
      a1_battle_room: soundSrc.music.music11A1_battle_room,
      a2_break_room: soundSrc.music.music11A2_break_room,
      a3_power_room: soundSrc.music.music11A3_power_room,
      b1_jump_room: soundSrc.music.music11B1_jump_room,
      b2_warp_room: soundSrc.music.music11B2_warp_room,
      b3_move_room: soundSrc.music.music11B3_move_room,
      c1_bullet_room: soundSrc.music.music11C1_bullet_room,
      c2_square_room: soundSrc.music.music11C2_square_room,
      c3_trap_room: soundSrc.music.music11C3_trap_room,
    }

    /** 배경 그라디언트의 색 리스트 (배열) */
    this.bgGradientColor = {
      normal_road: Round2_1.getMaeulGradientColor(),
      a1_battle_room: ['#9E5D3D', '#944C4A'],
      a2_break_room: ['#5D1C1C', '#644C29'],
      a3_power_room: ['#96705A', '#9A5C50'],
      b1_jump_room: ['#D7D068', '#DBE83B'],
      b2_warp_room: ['#D8E4AB', '#E2BC79'],
      b3_move_room: ['#D7C98F', '#9E8A67'],
      c1_bullet_room: ['#7EAC81', '#06921D'],
      c2_square_room: ['#3D5047', '#0B5531'],
      c3_trap_room: ['#218920', '#6DB9AB']
    }

    /** 결과값 목록 (areaStat.result 에 사용되는 상수값) */
    this.resultList = {
      WIN: 'win',
      LOSE: 'lose',
      START: 'start',
      READY: 'ready',
      FIGHT: 'fight',
      COMPLETE: 'complete',
      NOTHING: '',
      DRAW: 'draw'
    }

    /** 각 구역에 대한 현재 결과 (모든 구역에서 사용) */  
    this.result = ''

    /** 시간 기준 값 (60초구성의 구역만 적용) */
    this.checkTimeList = {
      /** 준비 출력 */ READY: 2,
      /** 시작 또는 파이트 출력 */ START: 4,
      /** 완료 */ COMPLETE: 50,
    }

    /** 모든 구역에 대한 종합 스탯 (다만 모든 스탯이 공통적으로 사용되는것은 아닙니다.) */
    this.areaStat = {
      // 공통 스탯
      /** 각 구역에 대한 남은시간 (모든 구역에서 사용) */ time: 45,
      /** 남은 플레이어의 체력(a1, a2 구역에서 사용) */ playerHp: 100,
      /** 남은 적의 체력 (a1, a2 구역에서 사용) */ enemyHp: 100,

      // 기준 스탯
      /** a2 구역에서 사용하는 HP의 기본 상수값 */ a2BaseHp: 800,

      // 플레이어 관련 이동 스탯
      /** 플레이어의 무적 프레임 */ playerInvincibleFrame: 0,
      /** 플레이어 체력에 대한 에니메이션 (현재값으로 서서히 감소하도록 에니메이션 처리) */ playerHpEnimation: 100,
      /** 플레이어 에니메이션 처리용 프레임 카운트 */ playerHpEnimationFrame: 0,
      /** b1 구역에서 플레이어가 점프하는 속도 */ playerBounceSpeed: 12,
      /** 플레이어가 튕겨지는 지연시간 */ playerBounceDelay: 120,
      /** 플레이어가 튕겨지는 지연시간을 계산하는 카운트 */ playerBounceDelayCount: 0,
      /** 플레이어가 위로 올라가는 상태인지에 대한 변수 */ isPlayerArrowUp: false,
      /** 플레이어 이동 불가 시간 */ playerMoveImpossibleFrameCount: 0,

      // 기타 스탯
      /** 적의 HP나 플레이어의 HP가 과도하게 빠르게 줄어들 수 없도록 지연시간이 추가됨 (a1 구역만 가능) */ hpLowMax: 100,
      /** 플레이어가 모은 파워 (a3 구역에서 사용) */ powerPlayer: 0,
      /** 적이 모은 파워 (a3 구역에서 사용) */ powerEnemy: 0,
      /** 총 워프 횟수 (b2 구역에서 사용) */ warpCount: 0,
      /** 총 받은 데미지 (c1 구역에서 사용) */ totalDamage: 0,
      /** 점수 (c2 구역에서 사용) */ score: 0,
      /** 사각형의 개수 (c2 구역에서 사용) */ squareBlack: 0,
      /** 한 화면에 나올 수 있는 사각형의 개수 (c2 구역에서 사용) */ squareBlackMax: 0,
      /** 시간 보너스 값 (c2 구역에서 사용) */ timeBonusValue: 0,
      /** 시간 보너스 가속 배율 (c2 구역에서 사용) */ timeBonusMultiple: 0,
      /** 골인 횟수 (c3 구역에서 사용) */ goal: 0,
      /** 현재 적의 수 (a2 구역에서 적을 죽인 수를 확인하기 위해 필요) */ createEnemyCount: 0,
      /** 데미지 사운드 딜레이 카운터용 */ damageSoundDelayCount: 0
    }

    /** 현재 적용된 그라디언트의 색상 */
    this.currentGradientColor = this.bgGradientColor.normal_road

    /**
     * 맵의 스트링 값
     * 
     * 맵의 종류 = a1 ~ a3, b1 ~ b3, c1 ~ c3, z1(1번째 공간) ~ z2(라운드 종료 후 표시되는 공간)
     */
    this.courseName = 'z1'

    /** 코스 선택시 현재 선택된 번호 */
    this.courseCursorNumber = 0

    /** 코스 선택 시간 */
    this.courseSelectTime = 6

    /** 선택 창에 관한 오브젝트 */
    this.boxMap = {
      x: 100,
      y: -300,
      width: 600,
      height: 200,
      isShow: false,
      image: imageSrc.round.round2_3_course,
    }

    /** 현재 코스 선택 모드에 있는지에 대한 여부 */
    this.isCourseSelectMode = false

    /** 각 result에 따라 표시되는 보이스 목록 */
    this.voiceList = {
      complete: soundSrc.round.r2_3_voiceComplete,
      draw: soundSrc.round.r2_3_voiceDraw,
      win: soundSrc.round.r2_3_voiceWin,
      lose: soundSrc.round.r2_3_voiceLose,
      start: soundSrc.round.r2_3_voiceStart,
      fight: soundSrc.round.r2_3_voiceFight,
      ready: soundSrc.round.r2_3_voiceReady
    }

    /** 코스 선택시 표시되는 반짝이는 상자 */
    class LightBox {
      constructor (x = 0, y = 0, width = 10, height = 10, color = 'white') {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.color = color
        this.alphaPercent = 100
        this.isAlphaValueUp = false
      }

      process () {
        // 알파값이 증가상태면 5%씩 상승, 아닐경우 5%씩 감소
        this.alphaPercent += this.isAlphaValueUp ? 5 : -5

        if (this.alphaPercent <= 0) {
          this.isAlphaValueUp = true
          this.alphaPercent = 0
        }

        if (this.alphaPercent === 60) {
          this.isAlphaValueUp = false
          this.alphaPercent = 60
        }
      }

      display () {
        // 알파값은 100배의 정수로 기록되었으므로, 값을 맞추기 위해 100으로 나눕니다.
        graphicSystem.fillRect(this.x, this.y, this.width, this.height, this.color, this.alphaPercent / 100)
      }
    }

    const lightX = 100
    this.lightBoxList = {
      a1: new LightBox(lightX + 0, 100, 200, 100, 'red'),
      a2: new LightBox(lightX + 200, 100, 200, 100, 'red'),
      a3: new LightBox(lightX + 400, 100, 200, 100, 'red'),
      b1: new LightBox(lightX + 0, 200, 200, 100, 'yellow'),
      b2: new LightBox(lightX + 200, 200, 200, 100, 'yellow'),
      b3: new LightBox(lightX + 400, 200, 200, 100, 'yellow'),
      c1: new LightBox(lightX + 0, 300, 200, 100, 'green'),
      c2: new LightBox(lightX + 200, 300, 200, 100, 'green'),
      c3: new LightBox(lightX + 400, 300, 200, 100, 'green'),
    }

    this.scoreList = {
      COMPLETE1: 19200,
      COMPLETE2: 19400,
      COMPLETE3: 19800,
      LOSE1: 19100,
      LOSE2: 19200,
      LOSE3: 19700
    }

    this.load.addImageList([
      imageSrc.round.round2_3_course,
      imageSrc.round.round2_3_effect,
      imageSrc.round.round2_3_maeul_space,
      imageSrc.round.round2_3_result,
      imageSrc.round.round2_3_course,
      imageSrc.round.round2_3_status,
      this.boxMap.image
    ])

    this.load.addSoundList([
      soundSrc.music.music11A1_battle_room,
      soundSrc.music.music11A2_break_room,
      soundSrc.music.music11A3_power_room,
      soundSrc.music.music11B1_jump_room,
      soundSrc.music.music11B2_warp_room,
      soundSrc.music.music11B3_move_room,
      soundSrc.music.music11C1_bullet_room,
      soundSrc.music.music11C2_square_room,
      soundSrc.music.music11C3_trap_room,
      this.voiceList.complete,
      this.voiceList.win,
      this.voiceList.lose,
      this.voiceList.draw,
      this.voiceList.ready,
      this.voiceList.start,
      this.voiceList.fight,
      soundSrc.round.r2_3_a1_boost,
      soundSrc.round.r2_3_a1_damage,
      soundSrc.round.r2_3_a1_earthquake,
      soundSrc.round.r2_3_a1_earthquakeDamage,
      soundSrc.round.r2_3_a1_toyHammer,
      soundSrc.round.r2_3_a2_bomb,
      soundSrc.round.r2_3_a2_break,
      soundSrc.round.r2_3_a3_power1,
      soundSrc.round.r2_3_a3_power2,
      soundSrc.round.r2_3_b2_warp,
      soundSrc.round.r2_3_b3_move,
      soundSrc.round.r2_3_c2_squareBlack,
      soundSrc.round.r2_3_c2_squareCyan,
      soundSrc.round.r2_3_c2_squareLime,
      soundSrc.round.r2_3_c2_squarePink,
      soundSrc.round.r2_3_c2_squareRed,
    ])

    this.load.addImageList(RoundPackLoad.getRound2ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound2ShareSound())
  }

  lightBoxProcess () {
    this.lightBoxList.a1.process()
    this.lightBoxList.a2.process()
    this.lightBoxList.a3.process()
    this.lightBoxList.b1.process()
    this.lightBoxList.b2.process()
    this.lightBoxList.b3.process()
    this.lightBoxList.c1.process()
    this.lightBoxList.c2.process()
    this.lightBoxList.c3.process()
  }

  setCourseGradientColor () {
    switch (this.courseName) {
      case 'z1': this.currentGradientColor = this.bgGradientColor.normal_road; break
      case 'a1': this.currentGradientColor = this.bgGradientColor.a1_battle_room; break
      case 'a2': this.currentGradientColor = this.bgGradientColor.a2_break_room; break
      case 'a3': this.currentGradientColor = this.bgGradientColor.a3_power_room; break
      case 'b1': this.currentGradientColor = this.bgGradientColor.b1_jump_room; break
      case 'b2': this.currentGradientColor = this.bgGradientColor.b2_warp_room; break
      case 'b3': this.currentGradientColor = this.bgGradientColor.b3_move_room; break
      case 'c1': this.currentGradientColor = this.bgGradientColor.c1_bullet_room; break
      case 'c2': this.currentGradientColor = this.bgGradientColor.c2_square_room; break
      case 'c3': this.currentGradientColor = this.bgGradientColor.c3_trap_room; break
      case 'z2': this.currentGradientColor = this.bgGradientColor.normal_road; break
    }
  }

  /** 
   * 코스 변경 (코스 공식과 사용자의 선택에 따라 자동으로 변경됨)
   * 
   * 코스를 선택한 순간 시간값도 동시에 변경됩니다.
   */
  changeCourse () {
    if (this.courseName === 'z1') {
      switch (this.courseCursorNumber) {
        case 0: this.courseName = 'a1'; break
        case 1: this.courseName = 'b1'; break
        case 2: this.courseName = 'c1'; break
      }
      // 다음 코스에 맞게 시간을 변경
      if (this.time.currentTime <= this.phase.phaseTime[0].endTime) {
        this.time.setCurrentTime(this.phase.phaseTime[1].startTime)
      }
    } else if (this.courseName === 'a1' || this.courseName === 'b1' || this.courseName === 'c1') {
      switch (this.courseCursorNumber) {
        case 0: this.courseName = 'a2'; break
        case 1: this.courseName = 'b2'; break
        case 2: this.courseName = 'c2'; break
      }
      if (this.time.currentTime <= this.phase.phaseTime[1].endTime) {
        this.time.setCurrentTime(this.phase.phaseTime[2].startTime)
      }
    } else if (this.courseName === 'a2' || this.courseName === 'b2' || this.courseName === 'c2') {
      switch (this.courseCursorNumber) {
        case 0: this.courseName = 'a3'; break
        case 1: this.courseName = 'b3'; break
        case 2: this.courseName = 'c3'; break
      }
      if (this.time.currentTime <= this.phase.phaseTime[2].endTime) {
        this.time.setCurrentTime(this.phase.phaseTime[3].startTime)
      }
    } else if (this.courseName === 'a3' || this.courseName === 'b3' || this.courseName === 'c3') {
      this.courseName = 'z2'
      this.time.setCurrentTime(this.phase.phaseTime[3].endTime + 1)
    }

    // 시간 멈춤 해제
    this.time.setCurrentTimePause(false)

    // 코스가 변경되면 그라디언트 배경색도 변경됨
    this.setCourseGradientColor()

    // 배경 변경 (배경 그라디언트 색은 별도의 함수(displayBackground)에서 출력함)
    if (this.courseName === 'z1') {
      // z1 구간의 페이드 배경 코드는 임시로 넣어둠
      this.bgLayer.setLayerAlphaFade(this.layerNumber.SPACE, 0, 60)
      this.bgLayer.setLayerAlphaFade(this.layerNumber.PLACARD2_2, 1, 60)
      this.bgLayer.setLayerAlpha(this.layerNumber.PLACARD2_3, 0)
      this.bgLayer.setLayerSpeed(this.layerNumber.SPACE, 0, 0)
    } else if (this.courseName === 'z2') {
      this.bgLayer.setLayerAlphaFade(this.layerNumber.SPACE, 0, 60)
      this.bgLayer.setLayerAlpha(this.layerNumber.PLACARD2_2, 0)
      this.bgLayer.setLayerAlphaFade(this.layerNumber.PLACARD2_3, 1, 60)
      this.bgLayer.setLayerSpeed(this.layerNumber.SPACE, 0, 0)
    } else {
      this.bgLayer.setLayerAlphaFade(this.layerNumber.SPACE, 1, 60)
      this.bgLayer.setLayerAlphaFade(this.layerNumber.PLACARD2_2, 0, 60)
      this.bgLayer.setLayerAlpha(this.layerNumber.PLACARD2_3, 0)
      this.bgLayer.setLayerSpeed(this.layerNumber.SPACE, 1, 0)
    }

    // 일반 모드로 전환
    this.setNormalMode()
    this.setResult(this.resultList.NOTHING) // 결과 화면 표시 제거
  }

  /** 코스 선택 모드로 변경 */
  setCourseSelectMode () {
    this.setResult(this.resultList.NOTHING) // 결과 화면 표시 제거
    this.isCourseSelectMode = true
    this.courseCursorNumber = 1 // 맨 위가 0번, 가운데가 1번, 맨 아래가 2번이고, 커서는 가운데에 놓여짐
    this.courseSelectTime = 7

    // 코스 오브젝트의 위치 기본값 설정
    this.boxMap.y = 0 - 200

    // 박스 보여지도록 허용
    this.boxMap.isShow = true

    // 플레이어 이동 막기
    this.playerMoveDisable()
  }

  /** 일반 모드로 변경 */
  setNormalMode () {
    this.isCourseSelectMode = false
    this.boxMap.isShow = false
    this.time.setCurrentTimePause(false)
    this.playerMoveEnable()

    fieldState.allEnemyDelete()
  }

  processCourse () {
    if (!this.isCourseSelectMode) return

    // 남은 코스 시간이 0일경우, 강제로 모드를 선택하고 일반모드로 재설정
    if (this.courseSelectTime <= 0) {
      this.changeCourse()
      return
    } else if (this.courseSelectTime >= 1 && this.time.totalFrame % 60 === 0) {
      this.courseSelectTime--
    }

    // 현재 페이즈 종료시까지 이 선택모드를 해제하지 않으면 시간은 진행되지 않습니다.
    if (this.time.currentTime >= this.phase.phaseTime[this.phase.getCurrentPhase()].endTime - 1 && this.isCourseSelectMode) {
      this.time.setCurrentTimePause(true)
    }

    // 아래, 위 버튼으로 코스 변경
    if (controlSystem.getButtonInput(controlSystem.buttonIndex.DOWN) && this.courseCursorNumber < 2) {
      this.courseCursorNumber++
    } else if (controlSystem.getButtonInput(controlSystem.buttonIndex.UP) && this.courseCursorNumber > 0) {
      this.courseCursorNumber--
    }
  
    // 박스 보여지도록 허용
    this.boxMap.isShow = true

    // 코스 선택 버튼을 누르면 코스 선택 종료 (해당 값을 선택한 것으로 처리)
    if (controlSystem.getButtonInput(controlSystem.buttonIndex.A)) {
      this.changeCourse()
    }

    // 박스 맵 좌표가 0이 아닐경우, 좌표값이 0이 되도록 조정
    this.boxMap.y += this.boxMap.y < 0 ? 20 : 0

    // 반짝이는 박스 처리
    this.lightBoxProcess()
  }

  /** 각 구역에 대한 시간 처리 */
  processAreaTime () {
    const startTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    
    // 각 페이즈 시작 시간의 5초, 55초 동안만 areaStat의 시간 감소가 적용됩니다.
    if (!this.timeCheckInterval(startTime + 5, startTime + 55)) return
    if (this.areaStat.time >= 1 && this.time.currentTimeTotalFrame % 60 === 59) {
      this.areaStat.time--
    }
  }

  process () {
    super.process()
    this.processCourse()
    this.processAreaTime()

    let layer = this.bgLayer.getLayer()
    console.log(layer[0].alpha, layer[1].alpha, layer[2].alpha)
  }

  /** 
   * 현재 구역의 시간이 구역 진행 시간 범위 내에 있는지 확인합니다.
   * 
   * 기본적으로 모든 구역들은 start ~ complete 시점까지 진행됩니다.
   * 
   * reday (2 ~ 3), start(4 ~ 50), complete(51 ~ 54), next(55 ~ 60)
   */
  areaRunningTimeCheck () {
    let startTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime + this.checkTimeList.START
    let completeTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime + this.checkTimeList.COMPLETE

    if (this.timeCheckInterval(startTime, completeTime)) {
      return true
    } else {
      return false
    }
  }

  /** 현재 구역의 시간이 결과 화면 또는 스탯 화면을 표시하는 시간 범위 이내인지 확인합니다. */
  areaShowResultTimeCheck () {
    let readyTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime + this.checkTimeList.READY
    let completeTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime + this.checkTimeList.COMPLETE + 4
    
    if (this.timeCheckInterval(readyTime, completeTime)) {
      return true
    } else {
      return false
    }
  }

  processSaveString () {
    // 저장 방식
    // 현재 맵, 선택모드, 현재 커서 값, 에리어 스탯, 결과값
    // 참고: JSON 파싱 버그를 막기 위해 구분자는 |(막대기?) 로 사용합니다.
    this.saveString = this.courseName 
      + '|' + this.isCourseSelectMode 
      + '|' + this.courseCursorNumber 
      + '|' + JSON.stringify(this.areaStat) 
      + '|' + this.result
      + '|' + this.currentGradientColor[0]
      + '|' + this.currentGradientColor[1]
  }

  loadDataSaveString () {
    let str = this.saveString.split('|')
    this.courseName = str[0]
    this.isCourseSelectMode = str[1] === 'true' ? true : false
    this.courseCursorNumber = Number(str[2])
    this.areaStat = JSON.parse(str[3])
    this.result = str[4]

    // 그라디언트 배경 불러오기 (b2 에서 그라디언트 값을 지속적으로 변경하기 때문에 해당 값도 따로 저장)
    this.currentGradientColor[0] = str[5]
    this.currentGradientColor[1] = str[6]
  }

  roundPhase00 () {
    // 바탕화면이 나오고, 3초 후 코스 선택 화면이 등장
    // 적은 등장하지 않음
    if (this.timeCheckFrame(3)) {
      this.setCourseSelectMode()
    }

    if (this.timeCheckInterval(19, 21) && this.isCourseSelectMode) {
      this.time.setCurrentTimePause(true)
    } else {
      this.time.setCurrentTimePause(false)
      this.sound.musicPlay()
    }
  }

  roundPhase01 () {
    switch (this.courseName) {
      case 'a1': this.coursePhaseA1(); break
      case 'b1': this.coursePhaseB1(); break
      case 'c1': this.coursePhaseC1(); break
    }

    if (this.timeCheckFrame(this.phase.phaseTime[1].endTime - 4)) {
      this.setCourseSelectMode()
    }
  }

  roundPhase02 () {
    switch (this.courseName) {
      case 'a2': this.coursePhaseA2(); break
      case 'b2': this.coursePhaseB2(); break
      case 'c2': this.coursePhaseC2(); break
    }

    if (this.timeCheckFrame(this.phase.phaseTime[2].endTime - 4)) {
      this.setCourseSelectMode()
    }
  }

  roundPhase03 () {
    switch (this.courseName) {
      case 'a3': this.coursePhaseA3(); break
      case 'b3': this.coursePhaseB3(); break
      case 'c3': this.coursePhaseC3(); break
    }

    // 결과값을 삭제한 뒤, 다시 원래 지역으로 되돌아갑니다.
    if (this.timeCheckFrame(this.phase.phaseTime[3].endTime - 3)) {
      this.setResult(this.resultList.NOTHING)
    } else if (this.timeCheckFrame(this.phase.phaseTime[3].endTime)) {
      this.changeCourse()
    }
  }

  display () {
    this.displayBackground() // 2-3 전용 그라디언트 배경 출력
    super.display() // 배경 출력
    this.displayResult()
    this.displayStatus()
    this.displayCourse()
    
    // 일부 구역은 추가적인 출력 함수가 있을 수도 있음
    switch (this.courseName) {
      case 'a1': this.displayCoursePhaseA1(); break
      case 'a2': this.displayCoursePhaseA2(); break
      case 'a3': this.displayCoursePhaseA3(); break
    }
  }

  displayBackground () {
    graphicSystem.gradientRect(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, this.currentGradientColor)
  }

  displayCourse () {
    // 선택 오브젝트 출력, 현재 선택할 예정인 코스 반짝이도록 처리
    if (this.boxMap.isShow) {
      graphicSystem.imageView(this.boxMap.image, this.boxMap.x, this.boxMap.y)
      this.donggramiNumberDisplay(this.courseSelectTime, 600, 40)

      switch (this.courseName) {
        case 'z1':
          if (this.courseCursorNumber === 0) this.lightBoxList.a1.display()
          if (this.courseCursorNumber === 1) this.lightBoxList.b1.display()
          if (this.courseCursorNumber === 2) this.lightBoxList.c1.display()
          break
        case 'a1':
        case 'b1':
        case 'c1':
          if (this.courseCursorNumber === 0) this.lightBoxList.a2.display()
          if (this.courseCursorNumber === 1) this.lightBoxList.b2.display()
          if (this.courseCursorNumber === 2) this.lightBoxList.c2.display()
          break
        case 'a2':
        case 'b2':
        case 'c2':
          if (this.courseCursorNumber === 0) this.lightBoxList.a3.display()
          if (this.courseCursorNumber === 1) this.lightBoxList.b3.display()
          if (this.courseCursorNumber === 2) this.lightBoxList.c3.display()
          break
      }
    }
  }

  /** 결과 값에 따른 이미지 출력 */
  displayResult () {
    if (this.result === this.resultList.NOTHING) return

    const imgD = imageDataInfo.round2_3_result // result 이미지 데이터 타겟을 위한 정보
    const imgSize = imageDataInfo.round2_3_result.complete // 모든 결과 이미지가 동일한 사이즈이므로, 해당 값을 참고
    const centerX = graphicSystem.CANVAS_WIDTH_HALF - (imgSize.width / 2)
    let showD
    switch (this.result) {
      case this.resultList.WIN: showD = imgD.win; break
      case this.resultList.LOSE: showD = imgD.lose; break
      case this.resultList.DRAW: showD = imgD.draw; break
      case this.resultList.COMPLETE: showD = imgD.complete; break
      case this.resultList.FIGHT: showD = imgD.fight; break
      case this.resultList.START: showD = imgD.start; break
      case this.resultList.READY: showD = imgD.ready; break
    }

    // 결과 화면 출력
    if (showD == null) return
    graphicSystem.imageDisplay(imageSrc.round.round2_3_result, showD.x, showD.y, showD.width, showD.height, centerX, 200, showD.width, showD.height)
  }

  /** 각 구역에 대한 스탯을 보여줍니다. */
  displayStatus () {
    // 이 스탯 화면은 정해진 시간에만 보여집니다.
    const currentPhaseTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    if (this.phase.getCurrentPhase() === 0) return
    if (!this.timeCheckInterval(currentPhaseTime + this.checkTimeList.READY, currentPhaseTime + this.checkTimeList.COMPLETE + 4)) return

    const img = imageSrc.round.round2_3_status
    const imgD = imageDataInfo.round2_3_status
    let showD
    const timeX = 350
    const numberY = 40
    const imgWidth = imageDataInfo.round2_3_status.time.width

    // 첫번째 공간
    switch (this.courseName) {
      case 'a1': showD = imgD.a1BattleRoom; break
      case 'a2': showD = imgD.a2BreakRoom; break
      case 'a3': showD = imgD.a3PowerRoom; break
      default: showD = imgD.time; break
    }

    if (showD === imgD.time) {
      // 총 영역 100x100 크기 (가운데에 표시)
      graphicSystem.imageDisplay(img, showD.x, showD.y, showD.width, showD.height, timeX, 0, showD.width, showD.height)
    } else {
      // 총 영역 800x100 크기
      graphicSystem.imageDisplay(img, showD.x, showD.y, showD.width, showD.height, 0, 0, showD.width, showD.height)
    }

    // 두번째 공간 (두가지 이상의 박스를 조합했을 때 사용합니다.)
    showD = null
    switch (this.courseName) {
      case 'b2': showD = imgD.b2Warp; break
      case 'c1': showD = imgD.c1TotalDamage; break
      case 'c2': showD = imgD.c2Score; break
      case 'c3': showD = imgD.c3Goal; break
    }
    if (showD != null) {
      graphicSystem.imageDisplay(img, showD.x, showD.y, showD.width, showD.height, timeX - showD.width, 0, showD.width, showD.height)
    }

    // 세번째 공간 (c2 구역만 사용)
    if (this.courseName === 'c2') {
      showD = imgD.c2Square
      graphicSystem.imageDisplay(img, showD.x, showD.y, showD.width, showD.height, timeX + showD.width, 0, showD.width, showD.height)
    }

    // 남은시간 표시
    this.donggramiNumberDisplay(this.areaStat.time, timeX + 25, numberY)

    // 그외 기타 스탯
    if (this.courseName === 'b2') {
      this.donggramiNumberDisplay(this.areaStat.warpCount, timeX - imgWidth + 10, numberY)
    } else if (this.courseName === 'c1') {
      this.donggramiNumberDisplay(this.areaStat.totalDamage, timeX - (imgWidth * 2) + 10, numberY)
    } else if (this.courseName === 'c2') {
      this.donggramiNumberDisplay(this.areaStat.score, timeX - (imgWidth * 2) + 10, numberY)
      this.donggramiNumberDisplay(this.areaStat.squareBlack, timeX + imgWidth + 10, numberY)
    } else if (this.courseName === 'c3') {
      this.donggramiNumberDisplay(this.areaStat.goal, timeX - imgWidth + 10, numberY)
    }
  }

  /**
   * 결과를 설정합니다. (해당 함수를 사용하면, 잠시동안 결과 화면이 출력되고, 보이스가 출력됩니다.)
   * 
   * 결과 목록은 여러개가 있으며, ready는 준비 상태, start 또는 fight는 시작 상태
   * win, lose, draw, complete는 결과 상태를 보여줍니다.
   * 
   * @param {string} resultValue resultList 값 중 하나
   */
  setResult (resultValue) {
    this.result = resultValue
    switch (resultValue) {
      case this.resultList.COMPLETE: this.sound.soundPlay(this.voiceList.complete); break
      case this.resultList.START: this.sound.soundPlay(this.voiceList.start); break
      case this.resultList.READY: this.sound.soundPlay(this.voiceList.ready); break
      case this.resultList.WIN: this.sound.soundPlay(this.voiceList.win); break
      case this.resultList.LOSE: this.sound.soundPlay(this.voiceList.lose); break
      case this.resultList.DRAW: this.sound.soundPlay(this.voiceList.draw); break
      case this.resultList.FIGHT: this.sound.soundPlay(this.voiceList.fight); break
    }

    // 완료 상태일때는 음악이 멈춥니다. (승리, 패배, 무승부 포함)
    if ([this.resultList.COMPLETE, this.resultList.WIN, this.resultList.DRAW, this.resultList.LOSE].indexOf(resultValue) !== -1) {
      this.sound.musicStop()
    }
  }

  /** 동그라미 숫자를 표현하는 함수 */
  donggramiNumberDisplay = game.graphic.createCustomNumberDisplay(imageSrc.number.round2_3_number, 30, 40)

  coursePhaseA1 () {
    const phase1Start = this.phase.phaseTime[1].startTime
    const cTime = this.checkTimeList

    // 준비 시간 (3초 후) 음악 재생 및 레디 표시 (레디 상황에서 초기값 설정)
    if (this.timeCheckFrame(phase1Start + cTime.READY)) {
      this.sound.musicChange(this.musicList.a1_battle_room)
      this.sound.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.enemyHp = 100
      this.areaStat.time = 45
      this.areaStat.playerHp = 100
      this.areaStat.playerHpEnimation = this.areaStat.playerHp
    } else if (this.timeCheckFrame(phase1Start + cTime.START)) {
      // 준비 시간이 끝나고, 전투 시작 (이 때 적이 생성됩니다.)
      this.setResult(this.resultList.FIGHT)
      this.field.createEnemy(ID.enemy.donggramiEnemy.a1_fighter)
    } else if (this.timeCheckFrame(phase1Start + cTime.START + 2)) {
      // 결과 출력 삭제
      this.setResult(this.resultList.NOTHING)
    }

    // HP 에니메이션은 areaRunning 여부와 관계없이 실행됨
    this.coursePhaseA1PlayerHpEnimation()

    // 전투에 관한 처리
    if (!this.areaRunningTimeCheck()) return

    this.coursePhaseA1PlayerDamage()
    this.coursePhaseA1EnemyDamage()
    // 시간 감소
    if (this.time.currentTimeTotalFrame % 60 === 0) {
      this.areaStat.battleLeftTime--
    }

    const result = this.coursePhaseA1Result()
    if (result !== '') { // 결과값이 있을경우 그에 대한 처리
      this.time.setCurrentTime(phase1Start + cTime.COMPLETE + 1) // 중복 처리 방지를 위한 시간 이동
      this.setResult(result)
      this.sound.musicStop()
      this.playerMoveEnable() // 플레이어 이동 가능하도록 강제로 처리
      if (this.result === this.resultList.LOSE) {
        this.field.addScore(this.scoreList.LOSE1)
      } else {
        this.field.addScore(this.scoreList.COMPLETE1)
      }

      // 적이 한마리 밖에 없으므로, 0번 적을 가져옴
      let enemy = this.field.getEnemyObject()[0]
      if (enemy != null) {
        enemy.state = 'end' // 적 상태 임의로 변경해서 전투 종료를 느껴지게끔 처리(적은 더이상 패턴을 사용하지 않음.)
      }
    }
  }

  coursePhaseA1Result () {
    if (this.areaStat.playerHp <= 0 && this.areaStat.enemyHp >= 1) {
      return this.resultList.LOSE
    } else if (this.areaStat.playerHp >= 1 && this.areaStat.enemyHp <= 0) {
      return this.resultList.WIN
    } else if (this.areaStat.playerHp === 0 && this.areaStat.enemyHp === 0) {
      return this.resultList.DRAW
    }

    if (this.areaStat.time === 0) {
      if (this.areaStat.playerHp > this.areaStat.enemyHp) {
        return this.resultList.WIN
      } else if (this.areaStat.playerHp < this.areaStat.enemyHp) {
        return this.resultList.LOSE
      } else if (this.areaStat.playerHp === this.areaStat.enemyHp) {
        return this.resultList.DRAW
      }
    }

    return ''
  }

  /** 플레이어를 이동 불가능하게 설정 */
  playerMoveDisable () {
    let playerP = fieldState.getPlayerObject()
    playerP.isMoveEnable = false
  }

  /** (만약) 플레이어를 이동 불가능하게 설정했다면 해당 함수로 되돌려주세요. */
  playerMoveEnable () {
    let playerP = fieldState.getPlayerObject()
    playerP.isMoveEnable = true
  }

  coursePhaseA1PlayerHpEnimation () {
    // 플레이어 데미지 요소를 부드럽게 그리고 반짝이게 하기 위한 에니메이션 처리
    if (this.areaStat.playerHp < this.areaStat.playerHpEnimation && this.time.currentTimeTotalFrame % 2 === 0) {
      this.areaStat.playerHpEnimation--
      this.areaStat.playerHpEnimationFrame += 3
    }

    if (this.areaStat.playerHpEnimationFrame > 0) {
      this.areaStat.playerHpEnimationFrame--
    }
  }

  /** 적 데미지를 처리하기 위한 함수 */
  coursePhaseA1EnemyDamage () {
    // 이 규칙에 따라, 41초가 지나야 적을 죽이는것이 가능
    // 플레이어는 무적시간이 긴 편이라서, 45초내에 죽는것은 어렵다.
    this.areaStat.hpLowMax = (this.areaStat.time * 2)

    let enemy = this.field.getEnemyObject()[0]

    // 적이 없거나 정해진 적이 아닐경우 함수 처리 무시
    if (enemy == null || enemy.id !== ID.enemy.donggramiEnemy.a1_fighter) return

    const baseValue = 300000 // 실제 체력: 3000000
    const someValue = baseValue / 10
    if (enemy.hpMax - enemy.hp >= someValue && this.areaStat.enemyHp >= this.areaStat.hpLowMax) {
      enemy.hp += someValue
      this.areaStat.enemyHp -= 1
    }
  }

  /**
   * 플레이어가 받는 데미지 판정방식
   * 
   * 적이 가지고 있는 좌표값에 임의의 값을 추가하여 비교한다. 그러나 적이 가진 상태에 따라, 판정을 다르게 해야 한다.
   */
  coursePhaseA1PlayerDamage () {
    let enemy = this.field.getEnemyObject()[0]
    let playerP = fieldState.getPlayerObject()

    // 적이 없거나 정해진 적이 아닐경우 함수 처리 무시
    if (enemy == null || enemy.id !== ID.enemy.donggramiEnemy.a1_fighter) return

    // 플레이어 무적 상태이면, 무시
    if (this.areaStat.invincibleFrame > 0) {
      this.areaStat.invincibleFrame--
      return
    }

    // 해당 적이 가지고 있는 4가지 상태
    const STATE_HAMMER = 'hammer'
    const STATE_EARTHQUAKE = 'earthquake'
    const STATE_NORMAL = 'normal'
    const STATE_BOOST = 'boost'

    // 각각의 판정범위를 가지는 오브젝트
    let enemyObject = {x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height}
    let earthQuakeObject = {x: 0, y: graphicSystem.CANVAS_HEIGHT - 320, width: graphicSystem.CANVAS_WIDTH, height: 320} // 밑 부분 영역
    let earthQuakeObject2 = {x: enemy.x, y: 0, width: enemy.width, height: graphicSystem.CANVAS_HEIGHT} // 상하 영역 전체
    let hammerObject = {x: enemy.centerX - (enemy.width / 2), y: enemy.y - (enemy.height) + 48, width: 180, height: 180}

    // 적의 상태에 따라 판정 범위가 달라지며, 충돌이 된경우 각 조건에 따라 데미지 추가
    let damage = 0
    if (enemy.state === STATE_NORMAL && collision(playerP, enemyObject)) {
      damage = 1
    } else if (enemy.state === STATE_BOOST && collision(playerP, enemyObject)) {
      damage = 2
    } else if (enemy.state === STATE_HAMMER && collision(playerP, hammerObject)) {
      damage = 4
    } else if (enemy.state === STATE_EARTHQUAKE) {
      if (collision(playerP, earthQuakeObject) || collision(playerP, earthQuakeObject2)) {
        damage = 10
      }
    }

    // 데미지를 받은 경우, 사운드 및 플레이어 강제 이동 처리
    if (damage >= 1) {
      this.sound.play(soundSrc.round.r2_3_a1_damage)
      this.areaStat.playerHp -= damage
      this.areaStat.invincibleFrame = damage < 10 ? 60 : 180 // 무적프레임: 10데미지 미만 30, 이상 90
      const autoMoveX = (Math.random() * 120 - 60) + playerP.x
      const autoMoveY = this.state === STATE_EARTHQUAKE ? (Math.random() * 120 - 60) + 120 : (Math.random() * 240 - 120) + playerP.y
      playerP.setAutoMove(autoMoveX, autoMoveY, 30)
    }
  }

  displayCoursePhaseA1 () {
    if (!this.areaShowResultTimeCheck()) return

    // 플레이어의 체력값과 적의 체력값 표시
    digitalDisplay('PLAYER HP: ' + this.areaStat.playerHp + '%', 0, 70)
    digitalDisplay('ENEMY HP: ' + this.areaStat.enemyHp + '%', 450, 70)

    // 플레이어의 체력은 왼쪽부터 오른쪽으로 이동하는 구조... 그리고 에니메이션 형태로 조작됨
    const percent = this.areaStat.playerHpEnimation / 100
    const divValue = 350 * percent
    const playerHpColor = this.areaStat.playerHpEnimationFrame % 3 === 0 ? 'green' : 'yellow' 
    graphicSystem.meterRect(350 - divValue, 30, divValue, 40, playerHpColor, 100, 100) // 엄밀히 따지면 meterRect를 사용하나 fillRect를 사용하나 같음

    // 적 체력 표시
    graphicSystem.meterRect(450, 30, 350, 40, 'red', this.areaStat.enemyHp, 100)
  }

  coursePhaseB1 () {
    const phase1Start = this.phase.phaseTime[1].startTime
    const cTime = this.checkTimeList
    if (this.timeCheckFrame(phase1Start + cTime.READY)) {
      this.sound.musicChange(this.musicList.b1_jump_room)
      this.sound.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.time = 45
    } else if (this.timeCheckFrame(phase1Start + cTime.START)) {
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase1Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 결과 처리
    if (this.areaStat.time === 0 && this.result !== this.resultList.COMPLETE && this.time.currentTime <= phase1Start + cTime.COMPLETE) {
      this.setResult(this.resultList.COMPLETE)
      this.playerMoveEnable()
      this.time.setCurrentTime(phase1Start + cTime.COMPLETE + 1)
      this.field.addScore(this.scoreList.COMPLETE1)
    }

    // 시간 범위에 해당하는 로직 처리 (아닐경우 리턴)
    if (!this.areaRunningTimeCheck()) return

    // 플레이어는 강제로 특정 형태로만 이동됨
    this.coursePhaseB1PlayerMove()

    // 적의 수가 10마리가 되도록 처리
    if (this.field.getEnemyCount() < 10) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.b1_bounce)
    }

    // 충돌 처리
    let enemyArray = this.field.getEnemyObject()
    let playerP = this.field.getPlayerObject()
    for (let i = 0; i < enemyArray.length; i++) {
      let enemyC = enemyArray[i]
      if (enemyC.state === '' && collision(playerP, enemyC)) {
        enemyC.state = 'collision'
        this.sound.play(soundSrc.round.r2_3_a1_damage)
        const autoMoveX = playerP.x + (Math.random() * 200) - 100
        const autoMoveY = playerP.y + (Math.random() * 200) - 100

        // 플레이어 강제 이동 처리
        playerP.setAutoMove(autoMoveX, autoMoveY, 60)
      }
    }
  }

  coursePhaseB1PlayerMove () {
    // 이 알고리즘은 donggramiBounce 알고리즘을 참조함
    let playerP = this.field.getPlayerObject()
    playerP.isMoveEnable = false // 플레이어 이동 불가상태 (다만, 좌우로 이동 가능한데, 이 코드는 밑에 적어두었음)

    // 플레이어가 강제 이동 상황인경우, 이 함수는 처리되지 않음.
    if (playerP.autoMoveFrame >= 1) {
      return
    }

    this.areaStat.playerBounceDelayCount++
    let count = (this.areaStat.playerBounceDelayCount / this.areaStat.playerBounceDelay) * 180
    let degree = Math.PI / 180 * count
    let sinValue = Math.sin(degree)

    // 절반의 딜레이 시간동안 추락하고, 절반의 딜레이 시간동안 올라갑니다.
    // 이렇게 한 이유는, sin 값이 0 ~ 1 ~ 0 식으로 변화하기 때문
    if (this.areaStat.playerBounceDelayCount < this.areaStat.playerBounceDelay / 2) {
      playerP.y += this.areaStat.playerBounceSpeed * sinValue

      if (playerP.y + playerP.height > game.graphic.CANVAS_HEIGHT) {
        // 화면 밑으로 이미 내려갔다면, 딜레이값을 조정해 강제로 위로 올라가도록 처리
        this.areaStat.playerBounceDelayCount = this.areaStat.playerBounceDelay / 2
      } else if (this.areaStat.playerBounceDelayCount >= (this.areaStat.playerBounceDelay / 2) - 2) {
        // 다만, 내려갈 때에는 하면 맨 밑에 닿지 않으면 계속 내려가도록 딜레이를 직접적으로 조정
        this.areaStat.playerBounceDelayCount--
      }
    } else {
      playerP.y -= this.areaStat.playerBounceSpeed * sinValue
    }

    // 카운트가 일정 값을 넘어가면 리셋 (이렇게 하지 않으면 잘못된 형태로 바운스됨)
    if (this.areaStat.playerBounceDelayCount >= this.areaStat.playerBounceDelay) {
      this.areaStat.playerBounceDelayCount -= this.areaStat.playerBounceDelay
    }

    // 좌우로만 이동 가능 (버튼 입력을 받아 간접적으로 처리합니다.)
    if (game.control.getButtonDown(game.control.buttonIndex.LEFT)) {
      playerP.x -= playerP.moveSpeedX
    }
    
    if (game.control.getButtonDown(game.control.buttonIndex.RIGHT)) {
      playerP.x += playerP.moveSpeedX
    }
  }

  coursePhaseC1 () {
    const phase1Start = this.phase.phaseTime[1].startTime
    const cTime = this.checkTimeList

    // customBullet
    let BulletBase = class extends CustomEnemyBullet {
      constructor () {
        super()
        this.x = 0
        this.moveSpeedX = 0
        this.moveSpeedY = 0
        this.width = 10
        this.height = 10
        this.attack = 1 // 공격력이 1인 이유는, 판정을 간접적으로 해야 처리할 수 있기 때문
        // 0데미지는 간접적으로 판정을 처리할 방법이 없음
        this.color = 'red'
      }

      // 무작위 위치 설정 및 속도 설정
      setPosition () {
        // x축 or y축
        const isLayerX = Math.random() < 0.5 ? true : false
        if (isLayerX) {
          // x축 양 끝 (맨 왼쪽 또는 맨 오른쪽)
          const isLeft = Math.random() < 0.5 ? true : false
          if (isLeft) {
            this.x = 0 - this.width
            this.moveSpeedX = Math.random() * 5 + 2
          } else {
            this.x = game.graphic.CANVAS_WIDTH + this.width
            this.moveSpeedX = -Math.random() * 5 - 2
          }
          this.y = Math.random () * graphicSystem.CANVAS_HEIGHT
          this.moveSpeedY = Math.random() * 10 - 5
        } else {
          const isUp = Math.random() < 0.5 ? true : false
          if (isUp) {
            this.y = 0 - this.height
            this.moveSpeedY = Math.random() * 5 + 2
          } else {
            this.y = graphicSystem.CANVAS_HEIGHT + this.height
            this.moveSpeedY = -Math.random() * 5 - 2
          }
          this.x = Math.random() * graphicSystem.CANVAS_WIDTH
          this.moveSpeedX = Math.random() * 10 - 5
        }
      }

      display () {
        graphicSystem.fillEllipse(this.x, this.y, this.width, this.height, 0, this.color)
      }
    }

    let BulletPlayer = class extends BulletBase {
      constructor () {
        super()
        this.color = 'blue'
      }

      setPosition () {
        super.setPosition()

        let playerP = fieldState.getPlayerObject()
        let distanceX = playerP.x - this.x
        let distanceY = playerP.y - this.y
        this.moveSpeedX = distanceX / 200
        this.moveSpeedY = distanceY / 200
      }
    }

    let BulletRain = class extends BulletBase {
      constructor () {
        super()
        this.color = 'cyan'
      }

      setPosition () {
        this.x = Math.random() * graphicSystem.CANVAS_WIDTH
        this.y = 0
        this.moveSpeedX = Math.random() * 1 - 2
        this.moveSpeedY = Math.random() * 2 + 8
      }
    }

    let BulletLeft = class extends BulletBase {
      constructor () {
        super()
        this.color = 'yellow'
      }

      setPosition () {
        this.x = graphicSystem.CANVAS_WIDTH
        this.y = Math.random() * graphicSystem.CANVAS_HEIGHT
        this.moveSpeedX = -Math.random() * 6 - 6
        this.moveSpeedY = 0
      }
    }

    // 준비 및 시작
    if (this.timeCheckFrame(phase1Start + cTime.READY)) {
      this.sound.musicChange(this.musicList.c1_bullet_room)
      this.sound.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.totalDamage = 0
      this.areaStat.time = 45
    } else if (this.timeCheckFrame(phase1Start + cTime.START)) {
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase1Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 결과 판정
    if (this.areaStat.time === 0 && this.result === this.resultList.NOTHING && this.time.currentTime <= phase1Start + cTime.COMPLETE) {
      if (this.areaStat.totalDamage >= 100) {
        this.setResult(this.resultList.LOSE)
      } else {
        this.setResult(this.resultList.COMPLETE)
      }

      if (this.result === this.resultList.LOSE) {
        this.field.addScore(this.scoreList.LOSE1)
      } else {
        this.field.addScore(this.scoreList.COMPLETE1)
      }

      // 중복 처리 방지를 위한 시간 변경
      this.time.setCurrentTime(phase1Start + cTime.COMPLETE + 1)
    }

    // 구역 진행 (정해진 시간 외의 로직을 처리하지 않습니다.)
    if (!this.areaRunningTimeCheck()) return

    // 각 시간마다 다른 종류의 총알 등장
    if (this.timeCheckInterval(phase1Start + 5, phase1Start + 11, 6)) {
      fieldState.createEnemyBulletObject(BulletBase)
    } else if (this.timeCheckInterval(phase1Start + 12, phase1Start + 17, 6)) {
      fieldState.createEnemyBulletObject(BulletPlayer)
    } else if (this.timeCheckInterval(phase1Start + 18, phase1Start + 23, 4)) {
      fieldState.createEnemyBulletObject(BulletRain)
    } else if (this.timeCheckInterval(phase1Start + 24, phase1Start + 29, 4)) {
      fieldState.createEnemyBulletObject(BulletLeft)
    } else if (this.timeCheckInterval(phase1Start + 30, phase1Start + 50, 3)) {
      let random = Math.floor(Math.random() * 4)
      switch (random) {
        case 0: fieldState.createEnemyBulletObject(BulletBase); break
        case 1: fieldState.createEnemyBulletObject(BulletPlayer); break
        case 2: fieldState.createEnemyBulletObject(BulletRain); break
        case 3: fieldState.createEnemyBulletObject(BulletLeft); break
      }
    }

    let playerP = this.field.getPlayerObject()
    if (playerP.shield < playerP.shieldMax) {
      playerP.shield += 1
      this.areaStat.totalDamage += 1
      this.sound.play(soundSrc.round.r2_3_a1_damage)
    }
  }

  coursePhaseA2 () {
    const phase2Time = this.phase.phaseTime[2].startTime
    const cTime = this.checkTimeList
    if (this.timeCheckFrame(phase2Time + cTime.READY)) {
      this.sound.musicChange(this.musicList.a2_break_room)
      this.sound.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.time = 45
      this.areaStat.playerHp = this.areaStat.a2BaseHp
      this.areaStat.playerHpEnimation = this.areaStat.playerHp
      this.areaStat.enemyHp = this.areaStat.a2BaseHp
      this.areaStat.createEnemyCount = 0
    } else if (this.timeCheckFrame(phase2Time + cTime.START)) {
      this.setResult(this.resultList.FIGHT)
      // 시작 명령이 내려지는 순간, 벽돌은 곧바로 출발하게 됩니다.
      let enemyObject = this.field.getEnemyObject()
      for (let i = 0; i < enemyObject.length; i++) {
        let enemy = enemyObject[i]
        if (enemy.moveDelay != null) {
          enemy.state = 'move'
          enemy.moveDelay.count = (-20 * i) + enemy.moveDelay.delay
        }
      }
    } else if (this.timeCheckFrame(phase2Time + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 결과값이 ready일 때 미리 벽돌 생성
    if (this.timeCheckInterval(phase2Time + cTime.READY + 1, phase2Time + cTime.READY + 2, 10) && this.field.getEnemyCount() < 5) {
      const positionX = graphicSystem.CANVAS_WIDTH - 100
      const positionY = 100 * ((this.field.getEnemyCount() % 5) + 1)
      this.field.createEnemy(ID.enemy.donggramiEnemy.a2_brick, positionX, positionY)
      this.areaStat.createEnemyCount++
      console.log(this.areaStat.createEnemyCount, this.field.getEnemyCount())
    }

    // 해당 구역이 시작되기 전까지, 벽돌은 움직이지 않는 상태입니다.
    if (this.timeCheckInterval(phase2Time + cTime.READY, phase2Time + cTime.READY + 1)) {
      let enemyObject = this.field.getEnemyObject()
      for (let i = 0; i < enemyObject.length; i++) {
        let enemy = enemyObject[i]
        enemy.state = 'stop'
      }
    }

    // 진행 시간 범위 확인 (아닐경우 로직을 처리하지 않음)
    if (!this.areaRunningTimeCheck()) return

    // 지속적인 벽돌 생성
    if (this.time.currentTimeTotalFrame % 20 === 0) {
      for (let i = 1; i < 6; i++) { // 맨 위의 벽돌은 생성시키지 않음
        // 2% 확률로 폭탄 벽돌 생성
        let bombRandom = Math.random() * 100 < 2 ? true : false
        const positionX = graphicSystem.CANVAS_WIDTH
        const positionY = 100 * (i % 6)
        if (bombRandom) {
          this.field.createEnemy(ID.enemy.donggramiEnemy.a2_bomb, positionX, positionY)
        } else {
          this.field.createEnemy(ID.enemy.donggramiEnemy.a2_brick, positionX, positionY)
        }

        this.areaStat.createEnemyCount++
      }
    }

    // 현재 벽돌의 개수와, 죽은 벽돌의 개수를 살펴봅니다.
    // 생성된 개수가 적의 수보다 많으면 벽돌을 죽인것으로 생각하고 해당 카운트를 감소시킵니다.
    if (this.areaStat.createEnemyCount > this.field.getEnemyCount()) {
      this.areaStat.createEnemyCount--
      this.areaStat.enemyHp -= 1
    }

    // 플레이어와 벽돌의 충돌 판정
    let playerP = this.field.getPlayerObject()
    let enemy = this.field.getEnemyObject()
    for (let i = 0; i < enemy.length; i++) {
      if (this.areaStat.damageSoundDelayCount <= 0 && collision(playerP, enemy[i])) {
        playerP.shield += 10
        this.areaStat.playerHp -= 4
        if (this.areaStat.damageSoundDelayCount <= 0) {
          this.sound.play(soundSrc.round.r2_3_a1_damage)
          this.areaStat.damageSoundDelayCount = 15
        }
        break
      }

      // 벽돌은 맨 왼쪽으로 이동하면 삭제됩니다.
      // 중복 처리 방지를 위하여, isDeleted 여부도 같이 살펴봅니다.
      if (enemy[i].x + enemy[i].width < 0 && !enemy[i].isDeleted) {
        enemy[i].isDeleted = true
        this.areaStat.createEnemyCount-- // 생성된 적 수도 제거
      }
    }

    // 사운드 출력용 딜레이
    if (this.areaStat.damageSoundDelayCount >= 1) {
      this.areaStat.damageSoundDelayCount--
    }

    // 플레이어는 맨 위로 이동할 수 없습니다.
    if (playerP.y < 100) {
      playerP.y = 100
    }

    // 플레이어 체력 에니메이션 처리 (a1이랑 다른점은 체력이 떨어지는속도가 더욱 빨라짐)
    this.coursePhaseA2PlayerHpEnimation()

    // 결과에 대한 처리
    const result = this.coursePhaseA1Result()
    if (result !== '') { // 결과값이 있을경우 그에 대한 처리
      this.time.setCurrentTime(phase2Time + cTime.COMPLETE + 1) // 중복 처리 방지를 위한 시간 이동
      this.setResult(result)
      this.sound.musicStop()
      this.playerMoveEnable() // 플레이어 이동 가능하도록 강제로 처리
      fieldState.allEnemyDie() // 모든 적 제거
      if (this.result === this.resultList.LOSE) {
        this.field.addScore(this.scoreList.LOSE2)
      } else {
        this.field.addScore(this.scoreList.COMPLETE2)
      }
    }
  }

  coursePhaseA2PlayerHpEnimation () {
    // 플레이어 데미지 요소를 부드럽게 그리고 반짝이게 하기 위한 에니메이션 처리
    // a1 구역에서 사용하는 함수와 데미지 변화 값이 서로 다릅니다.
    if (this.areaStat.playerHp < this.areaStat.playerHpEnimation && this.time.currentTimeTotalFrame % 2 === 0) {
      this.areaStat.playerHpEnimation--
      this.areaStat.playerHpEnimationFrame += 2
    }

    if (this.areaStat.playerHp < this.areaStat.playerHpEnimation - 5 && this.time.currentTimeTotalFrame % 2 === 0) {
      this.areaStat.playerHpEnimation -= 5
      this.areaStat.playerHpEnimationFrame += 2
    }

    if (this.areaStat.playerHpEnimationFrame > 0) {
      this.areaStat.playerHpEnimationFrame--
    }

    if (this.areaStat.playerHp <= 0) {
      this.areaStat.playerHp = 0
    }
    if (this.areaStat.enemyHp <= 0) {
      this.areaStat.enemyHp = 0
    }
  }

  displayCoursePhaseA2 () {
    if (!this.areaShowResultTimeCheck()) return

    // 플레이어의 체력값과 적의 체력값 표시
    digitalDisplay('PLAYER HP: ' + this.areaStat.playerHp, 0, 70)
    digitalDisplay('ENEMY HP: ' + this.areaStat.enemyHp, 450, 70)

    // 플레이어의 체력은 왼쪽부터 오른쪽으로 이동하는 구조... 그리고 에니메이션 형태로 조작됨
    const percent = this.areaStat.playerHpEnimation / this.areaStat.a2BaseHp
    const divValue = 350 * percent
    const playerHpColor = this.areaStat.playerHpEnimationFrame % 3 === 0 ? 'green' : 'yellow' 
    graphicSystem.meterRect(350 - divValue, 30, divValue, 40, playerHpColor, 100, 100) // 엄밀히 따지면 meterRect를 사용하나 fillRect를 사용하나 같음

    // 적 체력 표시
    graphicSystem.meterRect(450, 30, 350, 40, 'red', this.areaStat.enemyHp, this.areaStat.a2BaseHp)
  }
  
  coursePhaseA3 () {
    const phase3Start = this.phase.phaseTime[3].startTime
    const cTime = this.checkTimeList

    if (this.timeCheckFrame(phase3Start + cTime.READY)) {
      this.setResult(this.resultList.READY)
      this.areaStat.powerEnemy = 0
      this.areaStat.powerPlayer = 0
      this.areaStat.time = 45
      this.sound.musicChange(this.musicList.a3_power_room)
      this.sound.musicPlay()
    } else if (this.timeCheckFrame(phase3Start + cTime.START)) {
      this.setResult(this.resultList.START)
      this.field.createEnemy(ID.enemy.donggramiEnemy.a3_collector)
    } else if (this.timeCheckFrame(phase3Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    let PowerObject = class extends FieldData {
      constructor () {
        super()
        // 생성 확률
        // 50% 빨강 1점, 20% 파랑 2점, 20% 초록 2점, 10% 보라 3점
        let random = Math.random() * 100
        let colorNumber = 0
        this.message = 'red' // 메세지를 이용하여 외부에서 색깔을 구분하도록 함
        if (random >= 50 && random <= 70) {
          colorNumber = 1 // 20% 파랑
          this.message = 'blue'
        } else if (random >= 71 && random <= 90) {
          colorNumber = 2 // 20% 초록
          this.message = 'green'
        } else if (random >= 91) {
          colorNumber = 3 // 10% 보라
          this.message = 'purple'
        }
        
        let imageDataList = [
          imageDataInfo.round2_3_effect.powerRed,
          imageDataInfo.round2_3_effect.powerBlue,
          imageDataInfo.round2_3_effect.powerGreen,
          imageDataInfo.round2_3_effect.powerPurple,
        ]
        this.setAutoImageData(imageSrc.round.round2_3_effect, imageDataList[colorNumber], 3)
      }
    }

    // 정해진 시간 범위 내에서 구역 진행
    if (!this.areaRunningTimeCheck()) return
    
    let sprite = this.field.getSpriteObject()
    // 파워는 초당 10개씩 생성
    // 스프라이트가 24개 이하일때만 생성됨
    if (sprite.length < 24 && this.timeCheckInterval(0, 999, 6)) {
      let randomX = Math.random() * (graphicSystem.CANVAS_WIDTH - 50)
      let randomY = Math.random() * (graphicSystem.CANVAS_HEIGHT - 50)
      fieldState.createSpriteObject(PowerObject, randomX, randomY)
    }

    // 1 vs 1 승부이므로, 적은 한마리만 존재, 그래서 0번 배열에 있는 적 데이터를 직접 가져옴
    let enemy = this.field.getEnemyObject()[0]
    let player = this.field.getPlayerObject()

    // 스프라이트와 적과 플레이어의 충돌 판정
    // 적은 아직 만들어지지 않았음
    for (let i = 0; i < sprite.length; i++) {
      let currentSprite = sprite[i]

      // 색깔에 따른 파워 포인트 설정
      let powerPoint = 1
      if (currentSprite.message === 'blue' || currentSprite.message === 'green') {
        powerPoint = 2
      } else if (currentSprite.message === 'purple') {
        powerPoint = 3
      }

      // 파워 사운드 결정 ('red', 그리고 나머지는 획득했을 때 효과음이 서로 다릅니다.)
      // 사운드 번호는 powerPoint에 따라 지정됩니다.
      let soundNumber = 0

      if (collision(player, currentSprite)) {
        // 플레이어 파워 획득
        this.areaStat.powerPlayer += powerPoint
        currentSprite.isDeleted = true
        soundNumber = powerPoint === 1 ? 1 : 2
      } else if (enemy != null && collision(enemy, currentSprite)) {
        // 적 파워 획득
        this.areaStat.powerEnemy += powerPoint
        currentSprite.isDeleted = true
        soundNumber = powerPoint === 1 ? 1 : 2
      }

      if (soundNumber === 1) {
        this.sound.soundPlay(soundSrc.round.r2_3_a3_power1)
      } else if (soundNumber === 2) {
        this.sound.soundPlay(soundSrc.round.r2_3_a3_power2)
      }
    }

    if (this.areaStat.time === 0) {
      if (this.areaStat.powerPlayer > this.areaStat.powerEnemy) {
        this.setResult(this.resultList.WIN)
      } else if (this.areaStat.powerPlayer < this.areaStat.powerEnemy) {
        this.setResult(this.resultList.LOSE)
      } else {
        this.setResult(this.resultList.DRAW)
      }

      if (this.result === this.resultList.LOSE) {
        this.field.addScore(this.scoreList.LOSE3)
      } else {
        this.field.addScore(this.scoreList.COMPLETE3)
      }

      this.time.setCurrentTime(phase3Start + cTime.COMPLETE + 1)
      fieldState.allSpriteDelete()
    }
  }

  displayCoursePhaseA3 () {
    if (!this.areaShowResultTimeCheck()) return

    this.donggramiNumberDisplay(this.areaStat.powerPlayer, 210, 40)
    this.donggramiNumberDisplay(this.areaStat.powerEnemy, 460, 40)
  }

  coursePhaseB2 () {
    const phase2Start = this.phase.phaseTime[2].startTime
    const cTime = this.checkTimeList

    // ready start
    if (this.timeCheckFrame(phase2Start + cTime.READY)) {
      this.sound.musicChange(this.musicList.b2_warp_room)
      this.sound.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.time = 45
      this.areaStat.warpCount = 0
    } else if (this.timeCheckFrame(phase2Start + cTime.START)) {
      this.coursePhaseB2ChangeWarp() // 워프 생성 및 처리
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase2Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 세부 로직 처리 (시간 조건 확인)
    if (!this.areaRunningTimeCheck()) return

    // 플레이어와 적과의 충돌
    let playerP = this.field.getPlayerObject()
    let enemyObject = this.field.getEnemyObject()
    for (let i = 0; i < enemyObject.length; i++) {
      if (enemyObject[i].state === '' && collision(playerP, enemyObject[i])) {
        enemyObject[i].state = 'collision'
        playerP.setAutoMove(playerP.x + Math.random() * 200 - 100, playerP.y + Math.random() * 200 - 100, 20)
        this.sound.play(soundSrc.round.r2_3_a1_damage)
      }
    }

    // 무작위 적 생성 (1초마다, 적 수가 10마리가 될 때까지 생성)
    if (this.time.currentTimeTotalFrame % 60 === 0 && this.field.getEnemyCount() < 10) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.b2_mini)
    }

    // 플레이어와 적과의 워프 처리
    let sprite = this.field.getSpriteObject()
    for (let i = 0; i < sprite.length; i++) {
      if (collision(playerP, sprite[i])) {
        // 플레이어가 워프에 충돌하면, 플레이어를 랜덤한 위치로 보내고 워프처리
        this.sound.play(soundSrc.round.r2_3_b2_warp)
        playerP.x = graphicSystem.CANVAS_WIDTH_HALF
        playerP.y = graphicSystem.CANVAS_HEIGHT_HALF
        fieldState.allEnemyDelete()
        this.coursePhaseB2ChangeWarp()
        this.coursePhaseB2ChangeGradient()
        this.areaStat.warpCount++
      }

      for (let j = 0; j < enemyObject.length; j++) {
        if (collision(enemyObject[j], sprite[i])) {
          this.sound.play(soundSrc.round.r2_3_b2_warp)
          enemyObject[j].isDeleted = true
        }
      }
    }

    // 참고: 만약 불러오기를 해서, 스프라이트가 존재하지 않는다면, 스프라이트를 재생성합니다.
    if (sprite.length === 0) {
      this.coursePhaseB2ChangeWarp()
    }

    // 제한시간이 다 된경우 컴플리트
    if (this.areaStat.time === 0 && this.result === this.resultList.NOTHING) {
      this.setResult(this.resultList.COMPLETE)
      this.time.setCurrentTime(phase2Start + cTime.COMPLETE + 1)

      this.field.addScore(this.scoreList.COMPLETE2)

      // 워프 삭제
      for (let i = 0; i < sprite.length; i++) {
        sprite[i].isDeleted = true
      }
    }
  }

  coursePhaseB2ChangeGradient () {
    // 랜덤 그라디언트 셋팅... (10 ~ 99) // 왜냐하면 숫자로 2자리여야 하므로...
    let a = Math.floor(Math.random() * 89) + 10
    let b = Math.floor(Math.random() * 89) + 10
    let c = Math.floor(Math.random() * 89) + 10
    let d = Math.floor(Math.random() * 89) + 10
    let e = Math.floor(Math.random() * 89) + 10
    let f = Math.floor(Math.random() * 89) + 10
    this.currentGradientColor = ['#' + a + b + c, '#' + d + e + f]
  }

  coursePhaseB2ChangeWarp () {
    // 워프 스프라이트
    let WarpObject = class extends FieldData {
      constructor () {
        super()
        let imageDataList = [
          imageDataInfo.round2_3_effect.warpArchomatic,
          imageDataInfo.round2_3_effect.warpCyan,
          imageDataInfo.round2_3_effect.warpYellow,
          imageDataInfo.round2_3_effect.warpMint,
        ]
        let random = Math.floor(Math.random() * imageDataList.length)
        this.setAutoImageData(imageSrc.round.round2_3_effect, imageDataList[random], 3)
      }

      afterInit () {
        let isLeft = Math.random() < 0.5 ? true : false
        // 왼쪽이냐 오른쪽이냐에 따라 x좌표 결정 // 오른쪽에 배치될때는 화면 바깥을 벗어나지 않게 한다.
        this.x = isLeft ? Math.random() * 100 : (Math.random() * 100) + graphicSystem.CANVAS_WIDTH - 100 - this.width
        this.y = Math.random() * (graphicSystem.CANVAS_HEIGHT - this.height)
      }
    }
    
    // 기존에 있는 스프라이트 전부 삭제
    // 아직 스프라이트를 제거하는 함수륾 만들지는 않아서, 간접적으로 제거합니다.
    let sprite = this.field.getSpriteObject()
    for (let i = 0; i < sprite.length; i++) {
      sprite[i].isDeleted = true // 스프라이트 삭ㅈ[]
    }

    // 오브젝트를 다시 생성합니다. // 좌표는 자동으로 설정되므로 지정할 필요가 없음
    for (let i = 0; i < 2; i++) {
      fieldState.createSpriteObject(WarpObject)
    }
  }

  coursePhaseB3 () {
    const phase3Start = this.phase.phaseTime[3].startTime
    const cTime = this.checkTimeList

    let ArrowObject = class extends FieldData {
      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round2_3_effect, imageDataInfo.round2_3_effect.moveArrow)
        this.degree = Math.floor(Math.random() * 12) * 30

        // 에니메이션 개체는 enimation.degree를 사용해야 회전한 형태로 출력이 가능합니다.
        // 참고: 추후에 이와 관련한 로직을 수정할 예정
        if (this.enimation != null) {
          this.enimation.degree = this.degree
        }

        this.moveDelay = new DelayData(120)
      }

      process () {
        super.process()
        this.processCollision()

        if (this.moveDelay.check()) {
          this.x = Math.random() * (graphicSystem.CANVAS_WIDTH - this.width)
          this.y = Math.random() * (graphicSystem.CANVAS_HEIGHT - this.height)
        }

        if (this.exitAreaCheck()) {
          this.isDeleted = true
        }
      }

      display () {
        super.display()
      }

      processCollision () {
        let player = fieldState.getPlayerObject()
        let enemy = fieldState.getEnemyObject()
        let addPositionX = 0
        let addPositionY = 0

        // 각도에 따른 이동 값 결정...
        // 기준 최대치는 400픽셀, 참고: 어떻게 공식을 구상해야하는지 몰라서 일일히 수치를 지정해놓음
        switch (this.degree) {
          case 0: addPositionX = 0; addPositionY = -150; break
          case 30: addPositionX = 50; addPositionY = -100; break
          case 60: addPositionX = 100; addPositionY = -50; break
          case 90: addPositionX = 150; addPositionY = 0; break
          case 120: addPositionX = 100; addPositionY = 50; break
          case 150: addPositionX = 50; addPositionY = 100; break
          case 180: addPositionX = 0; addPositionY = 150; break
          case 210: addPositionX = -50; addPositionY = 100; break
          case 240: addPositionX = -100; addPositionY = 50; break
          case 270: addPositionX = -150; addPositionY = 0; break
          case 300: addPositionX = -100; addPositionY = -50; break
          case 330: addPositionX = -50; addPositionY = -100; break
        }

        if (collision(player, this)) {
          player.setAutoMove(player.x + addPositionX, player.y + addPositionY, 30)
          soundSystem.play(soundSrc.round.r2_3_b3_move)
        }

        // 참고사항: 이 state 변경 옵션은 특정 적에게만 적용됩니다. 다른 적에겐 아무 효과가 없습니다.
        // 그리고, 이동 변화값만 지정합니다. 적 내부에서 자기 자신을 기준으로 최종 위치가 결정되기 때문입니다.
        for (let i = 0; i < enemy.length; i++) {
          let currentEnemy = enemy[i]
          if (currentEnemy.state === '' && collision(currentEnemy, this)) {
            currentEnemy.state = 'automove' + ' ' + addPositionX + ' ' + addPositionY
            soundSystem.play(soundSrc.round.r2_3_b3_move)
          }
        }
      }
    }

    let CubeObject = class extends ArrowObject {
      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round2_3_effect, imageDataInfo.round2_3_effect.moveCube)
        if (this.enimation != null) {
          this.enimation.degree = 0
        }
      }

      processCollision () {
        let player = fieldState.getPlayerObject()
        let enemy = fieldState.getEnemyObject()
        let endPositionX = Math.random() * graphicSystem.CANVAS_WIDTH
        let endPositionY = Math.random() * graphicSystem.CANVAS_HEIGHT

        if (collision(player, this)) {
          player.setAutoMove(endPositionX, endPositionY)
          soundSystem.play(soundSrc.round.r2_3_b2_warp)
        }

        // 참고사항: 이 state 변경 옵션은 특정 적에게만 적용됩니다. 다른 적에겐 아무 효과가 없습니다.
        for (let i = 0; i < enemy.length; i++) {
          let currentEnemy = enemy[i]
          if (currentEnemy.state === '' && collision(currentEnemy, this)) {
            currentEnemy.state = 'automove' + ' ' + endPositionX + ' ' + endPositionY
            soundSystem.play(soundSrc.round.r2_3_b3_move)
          }
        }
      }
    }


    // 준비, 시작
    if (this.timeCheckFrame(phase3Start + cTime.READY)) {
      this.sound.musicChange(this.musicList.b3_move_room)
      this.sound.musicPlay()
      this.areaStat.time = 45
      this.setResult(this.resultList.READY)
    } else if (this.timeCheckFrame(phase3Start + cTime.START)) {
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase3Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 해당 구역 시간 범위 확인
    if (!this.areaRunningTimeCheck()) return

    let sprite = this.field.getSpriteObject()
    if (sprite.length === 0) {
      // 무작위 스프라이트 생성
      for (let i = 0; i < 16; i++) {
        fieldState.createSpriteObject(ArrowObject, Math.random() * graphicSystem.CANVAS_WIDTH, Math.random() * graphicSystem.CANVAS_HEIGHT)
      }
      for (let i = 0; i < 4; i++) {
        fieldState.createSpriteObject(CubeObject, Math.random() * graphicSystem.CANVAS_WIDTH, Math.random() * graphicSystem.CANVAS_HEIGHT)
      }
    }

    if (this.field.getEnemyCount() < 6) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.b3_mini)
    }

    let player = this.field.getPlayerObject()
    let enemy = this.field.getEnemyObject()
    for (let i = 0; i < enemy.length; i++) {
      let currentEnemy = enemy[i]
      if (currentEnemy.state === '' && collision(player, currentEnemy)) {
        // 알고리즘은 그 위의 스프라이트랑 거의 동일
        player.setAutoMove(player.x + (Math.random() * 200 - 100), player.y + (Math.random() * 200 - 100), 60)
        currentEnemy.state = 'automove' + ' ' + (Math.random() * 200 - 100) + ' ' + (Math.random() * 200 - 100)
        this.sound.soundPlay(soundSrc.round.r2_3_a1_damage)
      }
    }

    // 결과 처리
    if (this.areaStat.time === 0) {
      this.setResult(this.resultList.COMPLETE)
      this.time.setCurrentTime(phase3Start + cTime.COMPLETE + 1)
      fieldState.allSpriteDelete()
      this.field.addScore(this.scoreList.COMPLETE3)
    }
  }

  coursePhaseC2 () {
    // 스퀘어 모으기
    const phase2Start = this.phase.phaseTime[2].startTime
    const cTime = this.checkTimeList

    if (this.timeCheckFrame(phase2Start + cTime.READY)) {
      this.sound.musicChange(this.musicList.c2_square_room)
      this.sound.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.score = 0
      this.areaStat.time = 45
      this.areaStat.timeBonusMultiple = 1
      this.areaStat.timeBonusValue = 0
      this.areaStat.squareBlack = 0
      this.areaStat.squareBlackMax = 16
    } else if (this.timeCheckFrame(phase2Start + cTime.START)) {
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase2Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 진행 상태가 아니면 처리 취소
    if (!this.areaRunningTimeCheck()) return

    // 결과 처리
    if (this.areaStat.time === 0 && this.result === this.resultList.NOTHING) {
      if (this.areaStat.score >= 5000) {
        this.setResult(this.resultList.COMPLETE)
      } else {
        this.setResult(this.resultList.LOSE)
      }

      if (this.result === this.resultList.COMPLETE) {
        this.field.addScore(this.scoreList.COMPLETE3)
      } else {
        this.field.addScore(this.scoreList.LOSE3)
      }

      this.time.setCurrentTime(phase2Start + cTime.COMPLETE + 1)
    }

    let tMultiple = Math.floor((this.areaStat.squareBlack / 10)) + this.areaStat.timeBonusMultiple
    let tBonus = (100 + (this.areaStat.squareBlack * 5)) * tMultiple
    this.areaStat.timeBonusValue += tBonus
    if (this.areaStat.timeBonusValue >= 6000) {
      this.areaStat.timeBonusValue -= 6000
      this.areaStat.score += 1
    }
    
    if (this.areaStat.timeBonusValue >= 12000) {
      this.areaStat.timeBonusValue -= 12000
      this.areaStat.score += 2
    }

    // 스퀘어 생성
    this.coursePhaseC2CreateSquare()

    // 스퀘어 충돌은 라운드에서 처리해야 합니다.
    // 색상 구분을 통하여 어떤것을 얻었는지 정의합니다.
    // 참고: fieldObject이기 때문에, 따로 sprite에 대해 process, display 함수를 사용할 필요는 없습니다.
    let square = this.field.getSpriteObject()
    let player = this.field.getPlayerObject()
    for (let i = 0; i < square.length; i++) {
      if (player.autoMoveFrame >= 1) {
        break // 플레이어가, 빨간 사각형을 먹어 자동 이동 상태가 될경우, 사각형을 얻을 수 없음
      }

      let currentSquare = square[i]
      let squareScore = 100 + this.areaStat.squareBlack
      let randomBonus = Math.floor((Math.random() * squareScore) + (squareScore * 10))
      if (collision(player, currentSquare)) {
        switch (currentSquare.message) {
          case 'black':
            soundSystem.play(soundSrc.round.r2_3_c2_squareBlack)
            this.areaStat.score += squareScore
            this.areaStat.squareBlack++
            break
          case 'red':
            // 사각형을 2초동안 먹을 수 없으며, 움직일 수 없음
            soundSystem.play(soundSrc.round.r2_3_c2_squareRed)
            player.setAutoMove(player.x + Math.random() * 200 - 100, player.y + Math.random() * 200 - 100, 120)
            break
          case 'cyan':
            // 보너스 점수
            soundSystem.play(soundSrc.round.r2_3_c2_squareCyan)
            this.areaStat.score += squareScore + randomBonus
            break
          case 'lime':
            // 시간 가속배율 증가
            soundSystem.play(soundSrc.round.r2_3_c2_squareLime)
            this.areaStat.timeBonusMultiple += 2
            break
          case 'pink':
            soundSystem.play(soundSrc.round.r2_3_c2_squarePink)
            // 검은 사각형이 더 많이 나옴
            this.areaStat.squareBlackMax += 4
            break
        }
        currentSquare.isDeleted = true
      }
    }
  }

  coursePhaseC2CreateSquare () {
    const squareSpeed = this.areaStat.squareBlack < 60 ? this.areaStat.squareBlack * 0.1 : 6
    let Square = class extends FieldData {
      constructor () {
        super()
        this.speedMultiple = 3
        this.width = 20
        this.height = 20
        this.color = 'black'
        this.outAreaCount = 0
      }

      afterInit () {
        // 메세지 값 설정 (외부에서 사용하기 위해서?)
        this.message = this.color
        this.resetPosition()
      }

      resetPosition () {
        // 무작위 속도 설정 및, 벽쪽에서 안쪽으로 이동
        // 모든 사각형은 왼쪽, 오른쪽, 아래, 위 에서 랜덤 출현
        const layerLine = Math.floor(Math.random() * 4)
        const targetSpeed = Math.floor(Math.random() * 2) + this.speedMultiple + squareSpeed
        switch (layerLine) {
          case 0: // 위 방향 (아래쪽으로 이동)
            this.x = Math.random() * graphicSystem.CANVAS_WIDTH
            this.y = 0 - this.height
            this.setMoveSpeed(0, targetSpeed)
            break
          case 1: // 오른쪽 방향 (왼쪽으로 이동)
            this.x = graphicSystem.CANVAS_WIDTH + this.width
            this.y = Math.random() * graphicSystem.CANVAS_HEIGHT
            this.setMoveSpeed(-targetSpeed, 0)
            break
          case 2: // 아래 방향 (위쪽으로 이동)
            this.x = Math.random() * graphicSystem.CANVAS_WIDTH
            this.y = graphicSystem.CANVAS_HEIGHT + this.height
            this.setMoveSpeed(0, -targetSpeed)
            break
          case 3: // 왼쪽 방향 (오른쪽으로 이동)
            this.x = 0 - this.width
            this.y = Math.random() * graphicSystem.CANVAS_HEIGHT
            this.setMoveSpeed(targetSpeed, 0)
        }
      }

      processMove () {
        super.processMove()
        if (this.outAreaCheck()) {
          this.isDeleted = true
        }
      }

      display () {
        graphicSystem.fillRect(this.x, this.y, this.width, this.height, this.color)
      }
    }

    let BlackSquare = class extends Square {
      constructor () {
        super()
        this.color = 'black'
      }
    }
    let RedSquare = class extends Square {
      constructor () {
        super()
        this.color = 'red'
      }
    }
    let CyanSquare = class extends Square {
      constructor () {
        super()
        this.color = 'cyan'
      }
    }
    let LimeSquare = class extends Square {
      constructor () {
        super()
        this.color = 'lime'
      }
    }
    let PinkSquare = class extends Square {
      constructor () {
        super()
        this.color = 'pink'
      }
    }

    // 사각형 생성
    if (this.time.currentTimeTotalFrame % 4 === 0) {
      let squareBlackCount = 0
      let squareRedCount = 0
      let square = this.field.getSpriteObject()
      for (let i = 0; i < square.length; i++) {
        let current = square[i]
        if (current.message === 'red') {
          squareRedCount++
        } else if (current.message === 'black') {
          squareBlackCount++
        }
      }
  
      if (squareBlackCount < this.areaStat.squareBlackMax) {
        fieldState.createSpriteObject(BlackSquare)
      }
      if (squareRedCount < 4) {
        fieldState.createSpriteObject(RedSquare)
      }
    }

    // 특수 사각형 생성
    if (this.time.currentTimeTotalFrame % 180 === 0) {
      let random = Math.floor(Math.random() * 2)
      switch (random) {
        case 0: fieldState.createSpriteObject(CyanSquare); break
        case 1: fieldState.createSpriteObject(LimeSquare); break
      }
    }

    // 특수 사각형 생성
    if (this.time.currentTimeTotalFrame % 359 === 0) {
      fieldState.createSpriteObject(PinkSquare)
    }
  }

  coursePhaseC3 () {
    let phase3Start = this.phase.phaseTime[3].startTime
    let cTime = this.checkTimeList

    let player = this.field.getPlayerObject()
    if (this.timeCheckFrame(phase3Start + cTime.READY)) {
      this.areaStat.goal = 0
      this.areaStat.time = 45
      this.sound.musicChange(this.musicList.c3_trap_room)
      this.sound.musicPlay()
      this.setResult(this.resultList.READY)
      player.x = 0
      player.y = 0
      this.playerMoveDisable()
    } else if (this.timeCheckFrame(phase3Start + cTime.START)) {
      this.setResult(this.resultList.START)
      this.playerMoveEnable()
    } else if (this.timeCheckFrame(phase3Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    if (!this.areaRunningTimeCheck()) return

    // 스프라이트가 없을 때만 스프라이트 생성
    let sprite = this.field.getSpriteObject()
    if (sprite.length === 0) {
      this.coursePhaseC3TrapCreate()
    }
    
    // 플레이어가 goal 영역에 있는지를 확인합니다.
    for (let i = 0; i < sprite.length; i++) {
      if (sprite[i].message === 'green' && collision(player, sprite[i])) {
        this.sound.soundPlay(soundSrc.round.r2_3_b2_warp)
        player.x = 0 // 플레이어 위치 강제 이동
        player.y = 100
        this.areaStat.goal++ // 골 수 증가
        fieldState.allSpriteDelete() // 모든 스프라이트 삭제
      }
    }

    // 시간이 다 되었을 때 1개 이상의 골인경우는 컴플리트 처리, 5개를 클리어해도 마찬가지
    if (this.areaStat.goal >= 5 || this.areaStat.time === 0) {
      if (this.areaStat.goal >= 1) {
        this.setResult(this.resultList.COMPLETE)
      } else {
        this.setResult(this.resultList.LOSE)
      }

      // 점수 추가
      fieldState.allSpriteDelete()
      this.time.setCurrentTime(phase3Start + cTime.COMPLETE + 1)
    }
  }

  coursePhaseC3TrapClass () {
    /** 함정 스프라이트 */
    let Trap = class extends FieldData {
      constructor () {
        super()
        this.color = 'black'
      }

      display () {
        graphicSystem.fillRect(this.x, this.y, this.width, this.height, this.color, 0.7)
      }
    }

    /** 위쪽 영역의 벽 */
    let TrapWallUp = class extends Trap {
      afterInit () {
        this.x = 0
        this.y = 90
        this.width = graphicSystem.CANVAS_WIDTH
        this.height = 10
      }

      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        if (player.y < this.y) {
          player.y = this.y + this.height + 1 // 사각형에 닿지 않게끔 y좌표 변경
        }
      }
    }

    /** 아래쪽 영역의 벽 */
    let TrapWallDown = class extends Trap {
      afterInit () {
        this.x = 0
        this.y = graphicSystem.CANVAS_HEIGHT - 100
        this.width = graphicSystem.CANVAS_WIDTH
        this.height = 10
      }

      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        if (collision(player, this)) {
          player.y = this.y - player.height - 1 // 사각형에 닿지 않게끔 y좌표 변경
        }
      }
    }

    /** 닿으면 안되는 함정 */
    let TrapRed = class extends Trap {
      afterInit () {
        this.color = 'red'
        this.width = 50
        this.height = 50
      }

      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        // 플레이어랑 충돌한경우, 플레이어의 위치가 리셋됩니다.
        if (collision(player, this)) {
          soundSystem.play(soundSrc.round.r2_3_a1_damage)
          player.x = 0
          player.y = 0
        }
      }
    }

    /** 왼쪽, 오른쪽으로 움직이는 빨간 사각형 */
    let TrapRedLeftRight = class extends TrapRed {
      constructor () {
        super()
        this.moveDelay = new DelayData(60)
      }

      afterInit () {
        super.afterInit()
        this.setMoveSpeed(4, 0)
        this.state = 'right'
      }
      
      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        if (collision(player, this)) {
          soundSystem.play(soundSrc.round.r2_3_a1_damage)
          player.x = 0
          player.y = 0
        }

        if (this.moveDelay.check()) {
          if (this.state === 'left') {
            this.state = 'right'
            this.setMoveSpeed(4, 0)
          } else {
            this.state = 'left'
            this.setMoveSpeed(-4, 0)
          }
        }
      }
    }

    /** 아래, 위로 움직이는 사각형 */
    let TrapRedUpDown = class extends TrapRed {
      constructor () {
        super()
        this.moveDelay = new DelayData(60)
      }

      afterInit () {
        super.afterInit()
        this.setMoveSpeed(0, 4)
        this.state = 'down'
      }
      
      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        if (collision(player, this)) {
          soundSystem.play(soundSrc.round.r2_3_a1_damage)
          player.x = 0
          player.y = 0
        }

        if (this.moveDelay.check()) {
          if (this.state === 'down') {
            this.state = 'up'
            this.setMoveSpeed(0, -4)
          } else {
            this.state = 'down'
            this.setMoveSpeed(0, 4)
          }
        }
      }
    }

    /** 골인 지점 */
    let TrapGreen = class extends Trap {
      afterInit () {
        this.color = 'green'
        this.width = 100
        this.height = 100
        this.message = 'green'
      }
    }

    return {
      Trap,
      TrapWallDown,
      TrapWallUp,
      TrapRed,
      TrapRedLeftRight,
      TrapRedUpDown,
      TrapGreen
    }
  }

  coursePhaseC3TrapCreate () {
    let trap = this.coursePhaseC3TrapClass()
    let roomNumber = this.areaStat.goal % 4
    
    // 공통 길막용 벽
    fieldState.createSpriteObject(trap.TrapWallUp)
    fieldState.createSpriteObject(trap.TrapWallDown)
    switch (roomNumber) {
      case 0:
        // 참고사항: 좌표값이 뭔가 이상하지만 양해 부탁
        // 구성 (아마도 이런 형태입니다.)
        // P |     |     |G
        //   |  |  |  |  |
        //   |  |  |  |  |
        //      |     |
        fieldState.createSpriteObject(trap.TrapGreen, 700, 100)
        // 0번 룸, 빨간 색 사각형이 길을 막고만 있다.
        for (let i = 0; i < 7; i++) {
          for (let j = 0; j < 8; j++) {
            if (i % 2 === 1 && j >= 2) {
              fieldState.createSpriteObject(trap.TrapRed, (i * 140) + 100, 100 + j * 50)
            } else if (i % 2 === 0 && j <= 5) {
              fieldState.createSpriteObject(trap.TrapRed, (i * 140) + 100, 100 + j * 50)
            }
          }
        }
        break
      case 1:
        // 구성 (아마도 이런 형태)
        // P              |G
        // -------------- |
        //      R    R    |
        //  --------------|
        //
        fieldState.createSpriteObject(trap.TrapGreen, 700, 100)
        for (let i = 0; i < 11; i++) {
          fieldState.createSpriteObject(trap.TrapRed, (i * 50), 160)
          fieldState.createSpriteObject(trap.TrapRed, (i * 50) + 100, 280)
          fieldState.createSpriteObject(trap.TrapRed, (i * 50), 450)
        }
        for (let i = 0; i < 7; i++) {
          fieldState.createSpriteObject(trap.TrapRed, 650, i * 50 + 100)
        }
        for (let i = 0; i < 3; i++) {
          fieldState.createSpriteObject(trap.TrapRedUpDown, (i * 140) + 140, 100)
          fieldState.createSpriteObject(trap.TrapRedUpDown, (i * 140) + 140, 300)
        }
        break
      case 2:
        // 구성
        // P |            |G
        //   |  R  R  R   |
        //   |   
        //   |  R  R  R |
        //              |
        fieldState.createSpriteObject(trap.TrapGreen, 700, 100)
        for (let i = 0; i < 7; i++) {
          fieldState.createSpriteObject(trap.TrapRed, 150, i * 50 + 100)
          fieldState.createSpriteObject(trap.TrapRed, 650, i * 50 + 100)
        }
        for (let i = 0; i < 4; i++) {
          fieldState.createSpriteObject(trap.TrapRed, 450, i * 50 + 300)
        }
        for (let i = 0; i < 3; i++) {
          fieldState.createSpriteObject(trap.TrapRedUpDown, (i * 150) + 150, 100)
          fieldState.createSpriteObject(trap.TrapRedUpDown, (i * 150) + 150, 300)
          fieldState.createSpriteObject(trap.TrapRedLeftRight, (i * 150) + 150, 100)
          fieldState.createSpriteObject(trap.TrapRedLeftRight, (i * 150) + 150, 300)
        }
        break
      case 3:
        fieldState.createSpriteObject(trap.TrapGreen, 700, 100)
        // 구성 (아무렇게나 막 배치한것임. - 랜덤은 아님)
        // #1
        fieldState.createSpriteObject(trap.TrapRed, 100, 100)
        fieldState.createSpriteObject(trap.TrapRed, 20, 220)
        fieldState.createSpriteObject(trap.TrapRed, 80, 240)
        fieldState.createSpriteObject(trap.TrapRed, 140, 270)
        fieldState.createSpriteObject(trap.TrapRed, 160, 300)
        fieldState.createSpriteObject(trap.TrapRed, 160, 350)
        fieldState.createSpriteObject(trap.TrapRed, 210, 400)
        fieldState.createSpriteObject(trap.TrapRed, 220, 460)
        fieldState.createSpriteObject(trap.TrapRed, 280, 480)
        fieldState.createSpriteObject(trap.TrapRed, 330, 440)
        fieldState.createSpriteObject(trap.TrapRed, 390, 420)
        fieldState.createSpriteObject(trap.TrapRed, 450, 400)
        fieldState.createSpriteObject(trap.TrapRed, 500, 380)
        fieldState.createSpriteObject(trap.TrapRed, 550, 360)
        fieldState.createSpriteObject(trap.TrapRed, 600, 340)
        fieldState.createSpriteObject(trap.TrapRed, 620, 310)
        fieldState.createSpriteObject(trap.TrapRed, 690, 250)
        fieldState.createSpriteObject(trap.TrapRed, 720, 200)

        // #2
        fieldState.createSpriteObject(trap.TrapRed, 200, 130)
        fieldState.createSpriteObject(trap.TrapRed, 250, 150)
        fieldState.createSpriteObject(trap.TrapRed, 300, 190)
        fieldState.createSpriteObject(trap.TrapRed, 300, 260)
        fieldState.createSpriteObject(trap.TrapRed, 300, 260)
        fieldState.createSpriteObject(trap.TrapRed, 350, 290)
        fieldState.createSpriteObject(trap.TrapRed, 410, 270)
        fieldState.createSpriteObject(trap.TrapRed, 450, 230)
        fieldState.createSpriteObject(trap.TrapRed, 480, 210)
        fieldState.createSpriteObject(trap.TrapRed, 540, 160)
        fieldState.createSpriteObject(trap.TrapRed, 550, 110)
        break
    }
  }
}

class Round2_4 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round2_4)

    const bWidth = 800
    const bHeight = 600

    /** 배경 위치의 기준값 */
    this.bgXY = {
      /** backgroundWidth */ BG_WIDTH: bWidth,
      /** backgroundHeight */ BG_HEIGHT: bHeight,
      /** 1층 시작지점 X값 */ F1_START_X: bWidth * 1,
      /** 1층 시작지점 Y값 (변화하지 않음) */ F1_START_Y: bHeight * 2,
      /** 1층 왼쪽 X값 */ F1_LEFT_X: bWidth * 0,
      /** 1층 오른쪽 최대이동 X값 */ F1_RIGHT_X: bWidth * 2,
      /** 옥상 시작지점 X값 */ ROOFTOP_START_X: bWidth * 0,
      /** 옥상 시작지점 Y값 (변화하지 않음) */ ROOFTOP_START_Y: bHeight * 0,
      /** 옥상 체크포인트 지점 X값 (산 옥상에서 잠시 멈춥니다.) */ ROOFTOP_CHECKPOINT_X: bWidth * 6,
      /** 옥상 마지막지점 X값 */ ROOFTOP_END_X: bWidth * 9,
      /** 옥상 지하실 가는 구간 - x축방향 (y축방향 이동한 이후에 이동함) */ ROOFTOP_B1_X: bWidth * 8,
      /** 옥상 지하실 가는 구간 - y축방향 */ ROOFTOP_B1_Y: bHeight * 2,
      /** 4층 시작지점 X값 */ F4_START_X: bWidth * 1,
      /** 4층 시작지점 Y값 (변화하지 않음) */ F4_START_Y: bHeight * 1,
      /** 4층 끝지점 X값 */ F4_END_X: bWidth * 6,
      /** 3층 시작지점 X값 (여기서는 왼쪽이동) */ F3_START_X: bWidth * 6,
      /** 3층 시작지점 Y값 (변화하지 않음) */ F3_START_Y: bHeight * 2,
      /** 3층 끝지점 X값 */ F3_END_X: bWidth * 3,
      /** 지하실 X값 */ B1_X: bWidth * 7,
      /** 지하실 Y값 */ B1_Y: bHeight * 2,
    }

    this.phase.addRoundPhase(this, this.roundPhase00, 0, 1) // 초기
    this.phase.addRoundPhase(this, this.roundPhase01, 2, 19) // 복도 + 엘리베이터
    this.phase.addRoundPhase(this, this.roundPhase02, 20, 59) // 필드1
    this.phase.addRoundPhase(this, this.roundPhase03, 60, 99) // 필드2
    this.phase.addRoundPhase(this, this.roundPhase04, 100, 139) // 필드3
    this.phase.addRoundPhase(this, this.roundPhase05, 140, 179) // 보스전/필드4
    this.phase.addRoundPhase(this, this.roundPhase06, 180, 207) // 지하실 이동

    /** 각 코스의 이름 상수 */
    this.courseName = {
      INSIDE: 'inside',
      OUTSIDE: 'outside',
      /** 상점 내부 */ SHOP: 'shop',
      /** 1번째 구역에서만 사용함 */ FIRST: 'first'
    }

    /** 현재 코스의 이름: (총 3종류: inside, outside, shop, (first는 초기값용도로만 사용) ) */
    this.currentCourseName = this.courseName.FIRST

    this.load.addImageList([
      imageSrc.round.round2_4_corridor,
      imageSrc.round.round2_4_courseSelect,
      imageSrc.round.round2_4_elevator,
      imageSrc.round.round2_4_elevatorFloor1,
      imageSrc.round.round2_4_elevatorFloor3,
      imageSrc.round.round2_4_elevatorFloor4,
      imageSrc.round.round2_4_elevatorHall,
      imageSrc.round.round2_4_elevatorNumber,
      imageSrc.round.round2_4_elevatorOutside,
      imageSrc.round.round2_4_elevatorRooftop,
      imageSrc.round.round2_4_floorB1,
      imageSrc.round.round2_4_mountainDeep,
      imageSrc.round.round2_4_placard,
      imageSrc.round.round2_4_mountainPath,
      imageSrc.round.round2_4_mountainRooftop,
      imageSrc.round.round2_4_mountainWall,
      imageSrc.round.round2_4_rooftop,
      imageSrc.round.round2_4_rooftopWayout,
      imageSrc.round.round2_4_roomBlue,
      imageSrc.round.round2_4_roomParty,
      imageSrc.round.round2_4_roomSky,
      imageSrc.round.round2_4_roomYellow,
    ])
    
    this.load.addSoundList([
      soundSrc.round.r2_4_elevatorDoorClose,
      soundSrc.round.r2_4_elevatorDoorOpen,
      soundSrc.round.r2_4_elevatorFloor,
      soundSrc.round.r2_4_elevatorMove,
      soundSrc.round.r2_4_message1,
      soundSrc.music.music12_donggrami_hall_outside,
      soundSrc.music.music13_round2_4_jemu,
    ])

    this.load.addImageList(RoundPackLoad.getRound2ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound2ShareSound())
    this.spriteElevator = Round2_4.createSpriteElevator()

    this.setLayerBg()
  }

  /** 해당 라운드 전용 layerBg 수정 */
  setLayerBg () {
    // 배경색 설정
    this.bgLayer.setColor(Round2_1.getMaeulGradientColor())
    this.bgLayer.setBackgroundScroolLoop(false, false) // 스크롤 무한루프 불가능

    // 시작 지점 설정
    this.bgLayer.setBackgroundPosition(this.bgXY.F1_START_X, this.bgXY.F1_START_Y)

    const bWidth = 800
    const bHeight = 600
    // 아웃사이드 - 옥상 구간 (총 10장의 이미지)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_elevatorRooftop, bWidth * 0, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_rooftop, bWidth * 1, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_rooftop, bWidth * 2, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_rooftop, bWidth * 3, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_rooftopWayout, bWidth * 4, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_rooftopWayout, bWidth * 5, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_mountainRooftop, bWidth * 6, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_mountainDeep, bWidth * 7, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_mountainDeep, bWidth * 8, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_mountainPath, bWidth * 9, 0)

    // 아웃사이드 - 지하실 가는 길 (아래로 내려간 후 왼쪽으로 이동)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_mountainWall, bWidth * 9, bHeight * 1)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_placard, bWidth * 9, bHeight * 2)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_elevatorOutside, bWidth * 8, bHeight * 2)

    // 인사이드 - 4층 구간
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_elevatorFloor4, bWidth * 1, bHeight * 1)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_roomYellow, bWidth * 2, bHeight * 1)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_roomParty, bWidth * 3, bHeight * 1)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_roomParty, bWidth * 4, bHeight * 1)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_roomYellow, bWidth * 5, bHeight * 1)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_elevatorFloor4, bWidth * 6, bHeight * 1)

    // 인사이드 - 3층 구간 (이 구간에서는 지하실로 갈 때 3층 엘리베이터가 있는쪽으로 되돌아갑니다.)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_elevatorFloor3, bWidth * 6, bHeight * 2)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_roomBlue, bWidth * 5, bHeight * 2)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_roomBlue, bWidth * 4, bHeight * 2)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_roomSky, bWidth * 3, bHeight * 2)

    // 1층 복도 구간
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_elevatorFloor1, bWidth * 0, bHeight * 2)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_corridor, bWidth * 1, bHeight * 2)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_elevatorFloor1, bWidth * 2, bHeight * 2)

    // 지하실 (배경 공간을 아끼기 위해서 위치를 서로 사이에 넣었지만 뭐 상관없겠지...)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_floorB1, bWidth * 7, bHeight * 2)

    // 엘리베이터 레이어 (엘리베이터 탑승시에만 표시하는 용도)
    this.bgLayer.addLayerImage(imageSrc.round.round2_4_elevatorHall, 0)

    // 코스 선택 레이어 (코스 선택시에만 표시하는 용도)
    this.bgLayer.addLayerImage(imageSrc.round.round2_4_courseSelect, 1)
  }

  /** 
   * 엘리베이터 내부를 표시합니다. (참고: 엘리베이터 배경 전환시간은 1초입니다.)
   * @param {boolean} isElevator 엘리베이터 내부에 있는가?
   */
  changeElevatorDisplay (isElevator) {
    if (isElevator) {
      this.bgLayer.setLayerAlphaFade(0, 1, 60)
    } else {
      this.bgLayer.setLayerAlphaFade(0, 0, 60)
    }
  }

  processSaveString () {
    this.saveString = this.spriteElevator.state 
      + ',' + this.spriteElevator.stateDelay.count 
      + ',' + this.spriteElevator.floorDelay.count
      + ',' + this.spriteElevator.floor
      + ',' + this.spriteElevator.floorArrive
      + ',' + this.spriteElevator.isFloorMove
      + ',' + this.currentCourseName
      + ',' + this.spriteElevator.x
      + ',' + this.spriteElevator.y
  }

  loadDataSaveString () {
    let str = this.saveString.split(',')
    this.spriteElevator.state = str[0]
    this.spriteElevator.stateDelay.count = Number(str[1])
    this.spriteElevator.floorDelay.count = Number(str[2])
    this.spriteElevator.floor = Number(str[3])
    this.spriteElevator.floorArrive = Number(str[4])
    this.spriteElevator.isFloorMove = str[5] === 'true' ? true : false
    this.currentCourseName = str[6]
    this.spriteElevator.x = Number(str[7])
    this.spriteElevator.y = Number(str[8])
  }

  roundPhase00 () {
    // 선택을 위해서 플레이어 강제 이동
    if (this.timeCheckFrame(0, 2)) {
      let player = this.field.getPlayerObject()
      player.x = 400
      player.y = 500
    }

    // 코스 선택
    if (this.timeCheckInterval(1, 2)) {
      this.roundPhase00CourseSelect()
    }
    
    // 추가 작업 필요 (다만 나중에 할 예정)
    this.roundPhase00Shop()
  }

  roundPhase00CourseSelect () {
    let areaInside = { x: 600, y: 300, width: 200, height: 300 }
    let areaOutside = { x: 0, y: 300, width: 200, height: 300 }
    let areaShop = { x: 260, y: 140, width: 280, height: 270 }

    this.time.setCurrentTimePause(true, 'please select course')
    let player = this.field.getPlayerObject()

    // 코스를 선택했으면 해당하는 코스를 진행하고 다음 페이즈로 이동합니다.
    if (collision(player, areaInside)) {
      this.currentCourseName = this.courseName.INSIDE
      this.time.setCurrentTime(this.phase.phaseTime[1].startTime)
      this.bgLayer.setLayerAlpha(1, 0) // 첫번째 레이어(코스 선택) 배경을 제거
    } else if (collision(player, areaOutside)) {
      this.currentCourseName = this.courseName.OUTSIDE
      this.time.setCurrentTime(this.phase.phaseTime[1].startTime)
      this.bgLayer.setLayerAlpha(1, 0) // 첫번째 레이어(코스 선택) 배경을 제거
    } else if (collision(player, areaShop)) {
      // 상점에서는 현재 시간이 변경되지 않습니다.
      this.currentCourseName = this.courseName.SHOP
    }
  }

  roundPhase00Shop () {
    // 미정...
  }

  roundPhase01 () {
    // 시간 정지 해제
    this.time.setCurrentTimePause(false)
    this.spriteElevator.process()

    // 엘리베이터에 도착하고 엘리베이터에 탑승하여 다른 층으로 이동하는 과정
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    const ElevatorTime = pTime + 7
    if (this.timeCheckFrame(ElevatorTime + 0)) {
      this.spriteElevator.setDoorOpen(true) // 엘리베이터 열림
    } else if (this.timeCheckFrame(ElevatorTime + 1)) {
      this.changeElevatorDisplay(true) // 엘리베이터 배경 전환
    } else if (this.timeCheckFrame(ElevatorTime + 2)) {
      this.spriteElevator.setDoorOpen(false) // 엘리베이터 닫힘
    } else if (this.timeCheckFrame(ElevatorTime + 3)) {
      if (this.currentCourseName === this.courseName.INSIDE) {
        this.spriteElevator.setFloorMove(4) // 인사이드 코스에서는 4층으로 이동
        this.bgLayer.setBackgroundPosition(this.bgXY.F4_START_X, this.bgXY.F4_START_Y) // 배경좌표를 인사이드 코스에 맞게 변경
      } else {
        this.spriteElevator.setFloorMove(5) // 아웃사이드 코스에서는 5층으로 이동
        this.bgLayer.setBackgroundPosition(this.bgXY.ROOFTOP_START_X, this.bgXY.ROOFTOP_START_Y) // 배경좌표를 아웃사이드 코스에 맞게 변경
      }
    } else if (this.timeCheckFrame(ElevatorTime + 8)) {
      this.spriteElevator.setDoorOpen(true) // 엘리베이터 열림
    } else if (this.timeCheckFrame(ElevatorTime + 9)) {
      this.changeElevatorDisplay(false) // 엘리베이터 배경 전환 (이제 도착한 지점의 배경이 보일거임)
    } else if (this.timeCheckFrame(ElevatorTime + 10)) {
      this.spriteElevator.setDoorOpen(false) // 엘리베이터 닫힘
    } else if (this.timeCheckFrame(ElevatorTime + 11)) {
      this.time.setCurrentTime(this.phase.phaseTime[1].endTime) // 다음 페이즈로 변경
    }
  }

  roundPhase02 () {
    // 인사이드, 아웃사이드 페이즈 동일
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    if (this.timeCheckFrame(pTime + 0)) {
      // 음악 변경 및 재생
      this.sound.musicChange(soundSrc.music.music12_donggrami_hall_outside)
      this.sound.musicPlay()
    }

    // 적들 등장 (dps 60% ~ 90%)
    if (this.timeCheckInterval(pTime + 0, pTime + 8, 20)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.fruit)
    } else if (this.timeCheckInterval(pTime + 10, pTime + 18, 20)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.juice)
    } else if (this.timeCheckInterval(pTime + 20, pTime + 28, 20)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.party)
    } else if (this.timeCheckInterval(pTime + 30, pTime + 40, 50)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.fruit)
      this.field.createEnemy(ID.enemy.donggramiEnemy.juice)
      this.field.createEnemy(ID.enemy.donggramiEnemy.party)
      this.field.createEnemy(ID.enemy.donggramiEnemy.talkParty)
    }
  }

  roundPhase03 () {
    if (this.currentCourseName === this.courseName.OUTSIDE) {
      this.roundPhase03Outside()
    } else {
      this.roundPhase03Inside()
    }
  }

  roundPhase03Outside () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    
    // 평균 dps: 90% ~ 110%
    if (this.timeCheckInterval(pTime + 1, pTime + 8, 50)) {
      // 일반 동그라미, 특수 동그라미, 파티 동그라미가 혼합하여 등장
      this.field.createEnemy(ID.enemy.donggramiEnemy.normal)
      this.field.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.createEnemyPartyDonggrami()
      this.createEnemyPartyDonggrami()
      this.createEnemySpecialDonggrami()
    } else if (this.timeCheckInterval(pTime + 10, pTime + 18, 25)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.createEnemyPartyDonggrami()
    } else if (this.timeCheckInterval(pTime + 20, pTime + 28, 60)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.normal)
      this.createEnemySpecialDonggrami()
      this.createEnemySpecialDonggrami()
      this.createEnemySpecialDonggrami()
      this.createEnemyPartyDonggrami()
    } else if (this.timeCheckInterval(pTime + 30, pTime + 38, 50)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.party)
      this.field.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.field.createEnemy(ID.enemy.donggramiEnemy.normal)
      this.field.createEnemy(ID.enemy.donggramiEnemy.normal)
    }

    this.timePauseWithEnemyCount(pTime + 39, 5)
  }

  roundPhase03Inside () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    // 평균 dps: 90% ~ 110%
    if (this.timeCheckInterval(pTime + 1, pTime + 8, 50)) {
      // 일반 동그라미, 특수 동그라미, 파티 동그라미가 혼합하여 등장
      this.field.createEnemy(ID.enemy.donggramiEnemy.normal)
      this.field.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.createEnemyPartyDonggrami()
      this.createEnemyPartyDonggrami()
      this.createEnemySpecialDonggrami()
    } else if (this.timeCheckInterval(pTime + 10, pTime + 24, 25)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.createEnemyPartyDonggrami()
    }

    // 적이 남아있으면 시간 정지
    this.timePauseWithEnemyCount(pTime + 32)

    // 엘리베이터 탑승
    this.spriteElevator.process()
    if (this.timeCheckFrame(pTime + 33)) {
      this.spriteElevator.setDoorOpen(true)
    } else if (this.timeCheckFrame(pTime + 34)) {
      this.changeElevatorDisplay(true)
    } else if (this.timeCheckFrame(pTime + 35)) {
      this.spriteElevator.setDoorOpen(false)
    } else if (this.timeCheckFrame(pTime + 36)) {
      this.spriteElevator.setFloorMove(3)
      this.bgLayer.setBackgroundPosition(this.bgXY.F3_START_X, this.bgXY.F3_START_Y) // 배경 위치 변경
    } else if (this.timeCheckFrame(pTime + 37)) {
      this.spriteElevator.setDoorOpen(true)
    } else if (this.timeCheckFrame(pTime + 38)) {
      this.changeElevatorDisplay(false)
    } else if (this.timeCheckFrame(pTime + 39)) {
      this.spriteElevator.setDoorOpen(false)
    }
  }

  /** 해당 라운드에서 파티 동그라미 생성 */
  createEnemyPartyDonggrami () {
    let random = Math.floor(Math.random() * 3)
    switch (random) {
      case 0: this.field.createEnemy(ID.enemy.donggramiEnemy.party); break
      case 1: this.field.createEnemy(ID.enemy.donggramiEnemy.juice); break
      case 2: this.field.createEnemy(ID.enemy.donggramiEnemy.fruit); break
    }
  }

  /** 해당 라운드에서 특수 동그라미 생성 */
  createEnemySpecialDonggrami () {
    // 특수 동그라미
    let random = Math.floor(Math.random() * 5)
    switch (random) {
      case 0: this.field.createEnemy(ID.enemy.donggramiEnemy.emoji); break
      case 1: this.field.createEnemy(ID.enemy.donggramiEnemy.bounce); break
      case 2: this.field.createEnemy(ID.enemy.donggramiEnemy.exclamationMark); break
      case 3: this.field.createEnemy(ID.enemy.donggramiEnemy.questionMark); break
      case 4: this.field.createEnemy(ID.enemy.donggramiEnemy.speed); break
      default: this.field.createEnemy(ID.enemy.donggramiEnemy.talk); break
    }
  }

  roundPhase04 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    
    if (this.currentCourseName === this.courseName.INSIDE) {
      if (this.timeCheckInterval(pTime + 1, pTime + 10, 50)) {
        this.field.createEnemy(ID.enemy.donggramiEnemy.party)
        this.field.createEnemy(ID.enemy.donggramiEnemy.normal)
        this.field.createEnemy(ID.enemy.donggramiEnemy.bounce)
        this.field.createEnemy(ID.enemy.donggramiEnemy.speed)
      } else if (this.timeCheckInterval(pTime + 11, pTime + 15, 25)) {
        this.field.createEnemy(ID.enemy.donggramiEnemy.exclamationMark)
        this.field.createEnemy(ID.enemy.donggramiEnemy.questionMark)
        this.field.createEnemy(ID.enemy.donggramiEnemy.emoji)
      } else if (this.timeCheckInterval(pTime + 16, pTime + 25, 9)) {
        this.field.createEnemy(ID.enemy.donggramiEnemy.normal)
      }
    } else {
      // 아웃사이드 구간에는 끝 부분에 나무 적이 나옴 (인사이드는 동그라미만 나옴)
      if (this.timeCheckInterval(pTime + 1, pTime + 10, 120)) {
        this.field.createEnemy(ID.enemy.donggramiEnemy.party)
        this.field.createEnemy(ID.enemy.donggramiEnemy.tree)
      } else if (this.timeCheckInterval(pTime + 11, pTime + 15, 120)) {
        this.field.createEnemy(ID.enemy.donggramiEnemy.normal)
        this.field.createEnemy(ID.enemy.donggramiEnemy.tree)
      } else if (this.timeCheckInterval(pTime + 16, pTime + 25, 90)) {
        this.field.createEnemy(ID.enemy.donggramiEnemy.tree)
      }
    }

    // 공통 패턴
    // 일시적으로 도망쳐를 외치는 동그라미가 등장함
    if (this.timeCheckInterval(pTime + 31, pTime + 36, 40)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.talkRunawayR2_4, 900)
    }

    // 적 제거가 2번 발동되는 이유는, 나무가 죽으면서 또다른 적들을 소환하기 때문
    if (this.timeCheckFrame(pTime + 37) || this.timeCheckFrame(pTime + 38)) {
      let enemy = this.field.getEnemyObject()
      for (let i = 0; i < enemy.length; i++) {
        let e = enemy[i]
        if (e.id !== ID.enemy.donggramiEnemy.leaf && e.id !== ID.enemy.donggramiEnemy.tree) {
          e.setMoveSpeed(9, 0)
          e.setMoveDirection(FieldData.direction.LEFT, '')
          e.isPossibleExit = true
          e.isExitToReset = false
        } else {
          e.requestDie()
        }
      }
    }

    // 만약 적이 남아있다면 모든 적을 삭제함
    if (this.timeCheckFrame(pTime + 39)) {
      fieldState.allEnemyDelete()
    }

    // 음악 페이드 아웃 및 정지
    if (this.timeCheckFrame(pTime + 37)) {
      this.sound.musicChange('', 1)
    } else if (this.timeCheckFrame(pTime + 38)) {
      this.sound.musicStop()
    }
  }

  roundPhase05 () {
    if (this.currentCourseName === this.courseName.INSIDE) {
      this.roundPhase05Inside()
    } else {
      this.roundPhase05Outside()
    }
  }

  roundPhase05Inside () {
    // 필드 물량전 (아웃사이드와는 조금 다름)
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    if (this.timeCheckFrame(pTime + 1)) {
      this.sound.soundPlay(soundSrc.round.r2_4_message1)
      this.sound.musicChange(soundSrc.music.music13_round2_4_jemu)
      this.sound.musicPlay()
    } else if (this.timeCheckFrame(pTime + 38)) {
      this.sound.musicStop()
    }

    // 획득 경험치 비율을 조정하기 위해 적 수를 증가시킴
    if (this.timeCheckInterval(pTime + 1, pTime + 10, 12)) {
      this.field.createEnemy(ID.enemy.intruder.square)
    } else if (this.timeCheckInterval(pTime + 11, pTime + 36, 10)) {
      this.field.createEnemy(ID.enemy.intruder.square)
    }
    
    this.timePauseWithEnemyCount(pTime + 38)

    // outside코스와의 점수 차이를 보정하기 위해 일정 점수를 추가함
    if (this.timeCheckFrame(pTime + 39)) {
      fieldSystem.requestAddScore(4500)
    }
  }

  roundPhase05Outside () {
    // 보스전 진행
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    if (this.timeCheckFrame(pTime + 1)) {
      this.field.createEnemy(ID.enemy.intruder.jemuBoss)
      this.sound.soundPlay(soundSrc.round.r2_4_message1)
      this.sound.musicChange(soundSrc.music.music13_round2_4_jemu)
      this.sound.musicPlay()
    } else if (this.timeCheckFrame(pTime + 38)) {
      this.sound.musicStop()
    }

    this.timePauseWithEnemyCount(pTime + 39)

    if (this.timeCheckInterval(pTime + 25, pTime + 36) && this.field.getEnemyCount() <= 0) {
      this.time.setCurrentTime(pTime + 37)
    }
  }

  roundPhase06 () {
    this.spriteElevator.process()
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    if (this.currentCourseName === this.courseName.INSIDE) {
      if (this.timeCheckFrame(pTime + 5)) {
        this.spriteElevator.setFloorPosition(3)
      } else if (this.timeCheckFrame(pTime + 15)) {
        this.spriteElevator.setDoorOpen(true)
      } else if (this.timeCheckFrame(pTime + 16)) {
        this.changeElevatorDisplay(true)
      } else if (this.timeCheckFrame(pTime + 17)) {
        this.spriteElevator.setDoorOpen(false)
      } else if (this.timeCheckFrame(pTime + 18)) {
        this.spriteElevator.setFloorMove(-1)
        this.bgLayer.setBackgroundPosition(this.bgXY.B1_X, this.bgXY.B1_Y)
      } else if (this.timeCheckFrame(pTime + 22)) {
        this.spriteElevator.setDoorOpen(true)
      } else if (this.timeCheckFrame(pTime + 23)) {
        this.changeElevatorDisplay(false)
      } else if (this.timeCheckFrame(pTime + 24)) {
        this.spriteElevator.setDoorOpen(false)
      }
    } else {
      if (this.timeCheckFrame(pTime + 10)) {
        this.spriteElevator.setFloorPosition(1)
      } else if (this.timeCheckFrame(pTime + 17)) {
        this.spriteElevator.setDoorOpen(true)
      } else if (this.timeCheckFrame(pTime + 18)) {
        this.changeElevatorDisplay(true)
      } else if (this.timeCheckFrame(pTime + 19)) {
        this.spriteElevator.setDoorOpen(false)
      } else if (this.timeCheckFrame(pTime + 20)) {
        this.spriteElevator.setFloorMove(-1)
        this.bgLayer.setBackgroundPosition(this.bgXY.B1_X, this.bgXY.B1_Y)
      } else if (this.timeCheckFrame(pTime + 22)) {
        this.spriteElevator.setDoorOpen(true)
      } else if (this.timeCheckFrame(pTime + 23)) {
        this.changeElevatorDisplay(false)
      } else if (this.timeCheckFrame(pTime + 24)) {
        this.spriteElevator.setDoorOpen(false)
      }
    }
  }

  processBackground () {
    super.processBackground()
    let currentPhase = this.phase.getCurrentPhase()
    const x = this.bgLayer.getBackgroundPosition().x
    const y = this.bgLayer.getBackgroundPosition().y

    // 엘리베이터 y 좌표는 고정되어 있습니다.
    this.spriteElevator.y = this.spriteElevator.BASE_Y

    if (currentPhase !== 0) this.bgLayer.setLayerAlpha(1, 0)

    // 알고리즘 변경
    switch (currentPhase) {
      case 0:
        this.bgLayer.setBackgroundSpeed(0, 0) // 이동 없음
        break
      case 1:
        // 복도 이동 -> 엘리베이터 -> 특정 지점에 도착 (다만, 도착지점 좌표를 결정하는것은 roundPhase에서 진행함)
        // 엘리베이터 좌표는 배경 0, 0 기준으로 200, 100에 위치함
        // 1층에서만 이동하는걸 적용하기 위해, y축 조건도 추가하였음
        if (this.currentCourseName === this.courseName.OUTSIDE) {
          if (x > this.bgXY.F1_LEFT_X && y === this.bgXY.F1_START_Y) {
            this.bgLayer.setBackgroundSpeed(-2, 0)
          } else if (y === this.bgXY.F1_START_Y) {
            this.bgLayer.setBackgroundPosition(this.bgXY.F1_LEFT_X, y)
            this.bgLayer.setBackgroundSpeed(0, 0)
          }
          this.spriteElevator.x = 0 - x + this.spriteElevator.BASE_X
        } else {
          if (x < this.bgXY.F1_RIGHT_X && y === this.bgXY.F1_START_Y) {
            this.bgLayer.setBackgroundSpeed(2, 0)
          } else if (y === this.bgXY.F1_START_Y) {
            this.bgLayer.setBackgroundPosition(this.bgXY.F1_RIGHT_X, y)
            this.bgLayer.setBackgroundSpeed(0, 0)
          }
          this.spriteElevator.x = this.bgXY.F1_RIGHT_X - x + this.spriteElevator.BASE_X
        }

        // 깜빡거림 방지용 엘리베이터 위치 고정 (y축으로 몇층인지를 확인해서 x축의 값을 고정시킴)
        // 순간적으로 (inside구간) x좌표가 변경될 때 엘리베이터의 좌표가 일시적으로 다른값으로 변경되었다가 되돌아옵니다.
        // 그래서 깜빡거림이 발생하기 때문에 이를 따로 보정하는 코드를 넣었습니다.
        if (y !== this.bgXY.F1_START_Y) this.spriteElevator.x = this.spriteElevator.BASE_X
        break
      case 2:
        this.bgLayer.setBackgroundSpeed(1, 0)
        if (this.currentCourseName === this.courseName.OUTSIDE) {
          this.spriteElevator.x = 0 - x + this.spriteElevator.BASE_X
        } else {
          this.spriteElevator.x = -x + this.bgXY.F4_START_X + this.spriteElevator.BASE_X
        }
        break
      case 3:
        // 아웃사이드: 옥상 -> 체크포인트(산 옥상)
        // 인사이드: 4층 엘리베이터 -> 파티룸 -> 4층 엘리베이터 체크포인트
        if (this.currentCourseName === this.courseName.OUTSIDE) {
          if (x < this.bgXY.ROOFTOP_CHECKPOINT_X) {
            this.bgLayer.setBackgroundSpeed(1, 0)
          } else {
            this.bgLayer.setBackgroundPosition(this.bgXY.ROOFTOP_CHECKPOINT_X, this.bgXY.ROOFTOP_START_Y)
            this.bgLayer.setBackgroundSpeed(0, 0)
          }
          this.spriteElevator.x = -x + this.bgXY.ROOFTOP_START_X + this.spriteElevator.BASE_X
        } else {
          // 4층 구간에 있을때만 오른쪽으로 이동합니다.
          if (x < this.bgXY.F4_END_X && y === this.bgXY.F4_START_Y) {
            this.bgLayer.setBackgroundSpeed(1, 0)
          } else if (y === this.bgXY.F4_START_Y) {
            this.bgLayer.setBackgroundPosition(this.bgXY.F4_END_X, this.bgXY.F4_START_Y)
            this.bgLayer.setBackgroundSpeed(0, 0)
          }
          this.spriteElevator.x = -x + this.bgXY.F4_END_X + this.spriteElevator.BASE_X
        }
        break
      case 4:
        // 아웃사이드: 산 옥상 -> 산 깊은곳 -> 산길
        // 인사이드(왼쪽이동): 스카이룸 <- 블루 룸 <- 3층 엘리베이터(시작지점)
        if (this.currentCourseName === this.courseName.OUTSIDE) {
          if (x < this.bgXY.ROOFTOP_END_X) {
            this.bgLayer.setBackgroundSpeed(1, 0)
          } else {
            this.bgLayer.setBackgroundPosition(this.bgXY.ROOFTOP_END_X, this.bgXY.ROOFTOP_START_Y)
            this.bgLayer.setBackgroundSpeed(0, 0)
          }
        } else {
          // 이번엔 왼쪽으로 이동합니다.
          if (x > this.bgXY.F3_END_X) {
            this.bgLayer.setBackgroundSpeed(-1, 0)
          } else {
            this.bgLayer.setBackgroundPosition(this.bgXY.F3_END_X, this.bgXY.F3_START_Y)
            this.bgLayer.setBackgroundSpeed(0, 0)
          }
          this.spriteElevator.x = -x + this.bgXY.F3_START_X + this.spriteElevator.BASE_X
        }
        break
      case 5:
        this.bgLayer.setBackgroundSpeed(0, 0) // 이동 없음
        break
      case 6:
        // 아웃사이드: 산길 -> 내려감 -> 플래카드 2-4 -> 왼쪽 -> 엘리베이터 -> 지하실
        // 인사이드: 스카이룸 -> 블루룸 -> 3층 엘리베이터 -> 지하실
        // 기존속도보다 2배 빠르게 이동합니다.
        // 배경 이동이 멈추면 엘리베이터는 고정 위치에 출력되도록 변경됩니다. (왜냐하면 화면 좌표가 중간에 변경되기 때문)
        if (this.currentCourseName === this.courseName.OUTSIDE) {
          if (y < this.bgXY.ROOFTOP_B1_Y) {
            this.bgLayer.setBackgroundSpeed(0, 2)
            this.spriteElevator.x = -x + this.bgXY.ROOFTOP_B1_X + this.spriteElevator.BASE_X
          } else if (y === this.bgXY.ROOFTOP_B1_Y && x > this.bgXY.ROOFTOP_B1_X) {
            this.bgLayer.setBackgroundSpeed(-2, 0)
            this.spriteElevator.x = -x + this.bgXY.ROOFTOP_B1_X + this.spriteElevator.BASE_X
          } else {
            this.bgLayer.setBackgroundSpeed(0, 0)
            this.spriteElevator.x = this.spriteElevator.BASE_X
          }
        } else {
          // 다시 오른쪽으로 이동... (속도는 아주 빠름)
          if (x < this.bgXY.F3_START_X && y === this.bgXY.F3_START_Y) {
            this.bgLayer.setBackgroundSpeed(3, 0)
            this.spriteElevator.x = -x + this.bgXY.F3_START_X + this.spriteElevator.BASE_X
          } else {
            this.bgLayer.setBackgroundSpeed(0, 0)
            this.spriteElevator.x = this.spriteElevator.BASE_X
          }
        }
        break
    }
  }

  display () {
    super.display()
    let currentPhase = this.phase.getCurrentPhase()
    let elevatorShow = currentPhase === 1
      || currentPhase === 2
      || (currentPhase === 3 && this.currentCourseName === this.courseName.INSIDE)
      || (currentPhase === 4 && this.currentCourseName === this.courseName.INSIDE)
      || currentPhase === 6

    if (elevatorShow) this.spriteElevator.display()

    if (currentPhase === 5) {
      // 적이 존재하면 배경 그라디언트가 변경됨
      let targetColor = this.field.getEnemyCount() === 0 ? Round2_1.getMaeulGradientColor() : ['#1F1C2C', '#928DAB']
      this.bgLayer.setColor(targetColor)

      // 보스전 체력 표시
      if (this.currentCourseName === this.courseName.OUTSIDE) this.meter.bossHpDefaultStyle(ID.enemy.intruder.jemuBoss)
    }
  }

  static createSpriteElevator () {
    class ElevatorSprite extends FieldData {
      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round2_4_elevator, imageDataInfo.round2_4_elevator.elevatorClose)
        this.setWidthHeight(400, 400)
        this.openEnimation = EnimationData.createEnimation(imageSrc.round.round2_4_elevator, imageDataInfo.round2_4_elevator.elevatorOpening, 4, 1)
        this.openEnimation.outputWidth = this.width
        this.openEnimation.outputHeight = this.height
        this.closeEnimation = EnimationData.createEnimation(imageSrc.round.round2_4_elevator, imageDataInfo.round2_4_elevator.elevatorClosing, 4, 1)
        this.closeEnimation.outputWidth = this.width
        this.closeEnimation.outputHeight = this.height

        this.floorArrive = 1
        this.isFloorMove = false
        this.floor = 1

        this.arrowUpEnimation = EnimationData.createEnimation(imageSrc.round.round2_4_elevatorNumber, imageDataInfo.round2_4_elevator.numberUpRun, 7, -1)
        this.arrowDownEnimation = EnimationData.createEnimation(imageSrc.round.round2_4_elevatorNumber, imageDataInfo.round2_4_elevator.numberDownRun, 7, -1)
        this.floorDelay = new DelayData(60)

        this.STATE_CLOSE = 'close'
        this.STATE_CLOSEING = 'closing'
        this.STATE_OPEN = 'open'
        this.STATE_OPENING = 'opening'
        this.stateDelay = new DelayData(36) // 4 * 9 frame enimation
        this.state = this.STATE_CLOSE

        /** 엘리베이터의 기본 출력 좌표값 */ this.BASE_X = 200
        /** 엘리베이터의 기본 출력 좌표값 */ this.BASE_Y = 100
      }

      process () {
        super.process()
        this.processFloor()
        this.processDoor()
      }

      processEnimation () {
        if (this.isFloorMove) {
          this.arrowUpEnimation.process()
          this.arrowDownEnimation.process()
        } else {
          this.arrowUpEnimation.reset()
          this.arrowDownEnimation.reset()
        }

        // 이미지 출력을 확실하게 하기 위하여 에니메이션 프로세스는 강제로 재생됩니다.
        // 해당 프로세스를 사용하지 않으면 이미지 로딩 문제로 이미지가 제대로 출력되지 않는 버그가 있습니다.
        this.closeEnimation.process()
        this.openEnimation.process()
      }

      processDoor () {
        // 닫혀있거나 열려있는 상태에서는, 깅제로 에니메이션 프레임을 조절해서 스프라이트를 출력하도록 처리
        if (this.state === this.STATE_OPEN) {
          this.openEnimation.elapsedFrame = 0
        } else if (this.state === this.STATE_CLOSE) {
          this.closeEnimation.elapsedFrame = 0
        }

        // 일정 시간이 지난 후에는 문이 열려있거나 닫혀있는것을 유지시킵니다.
        if (this.state === this.STATE_OPENING && this.stateDelay.check()) {
          this.state = this.STATE_OPEN
        } else if (this.state === this.STATE_CLOSEING && this.stateDelay.check()) {
          this.state = this.STATE_CLOSE
        }
      }

      processFloor () {
        if (!this.isFloorMove) return

        if (this.floorDelay.count === 0) {
          soundSystem.play(soundSrc.round.r2_4_elevatorMove)
        }

        if (this.floorDelay.check()) {
          if (this.floor < this.floorArrive) {
            this.floor++
            if (this.floor === 0) this.floor = 1
          } else if (this.floor > this.floorArrive) {
            this.floor--
            if (this.floor === 0) this.floor = -1
          }

          if (this.floor === this.floorArrive) {
            this.isFloorMove = false
            soundSystem.play(soundSrc.round.r2_4_elevatorFloor)
          }
        }
      }

      /** 이동할 층을 설정합니다. -1 부터 5까지 가능, 0층은 무시됨, 단 엘리베이터가 닫혀있어야만 사용 가능 */
      setFloorMove (floorArrive = 1) {
        if (this.state !== this.STATE_CLOSE) return

        if (floorArrive !== 0 && floorArrive >= -1 && floorArrive <= 5) {
          this.isFloorMove = true
          this.floorArrive = floorArrive
        }
      }

      /** 엘리베이터의 층의 기본 위치를 설정합니다. -1 부터 5까지 가능, 0층은 무시됨, */
      setFloorPosition (floor = 1) {
        this.floor = floor
      }

      display () {
        this.displayNumber()
        this.displayDoor()
      }

      displayNumber () {
        const displayAreaX = this.x + 100
        const displayAreaY = this.y - 50
        const numberPositionXMinusB = displayAreaX + 50
        const numberPositionX = displayAreaX + 100
        const numberPositionY = displayAreaY + 5
        const numberPositionArrowX = displayAreaX + 150

        let imgDbase = imageDataInfo.round2_4_elevator
        let imgD = imgDbase.number1
        let imgBg = imgDbase.numberScreen
        // 전체 층수는 B1 ~ 5층까지 있으므로, 2 ~ 5사이만 숫자를 변경하고 나머지는 그대로 둠
        // number가 0인경우는 1층으로 가정함.
        switch (this.floor) {
          case 2: imgD = imgDbase.number2; break
          case 3: imgD = imgDbase.number3; break
          case 4: imgD = imgDbase.number4; break
          case 5: imgD = imgDbase.number5; break
        }

        // 배경 및 숫자 표시
        if (imgD == null) return
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevatorNumber, imgBg.x, imgBg.y, imgBg.width, imgBg.height, displayAreaX, displayAreaY, imgBg.width, imgBg.height)
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevatorNumber, imgD.x, imgD.y, imgD.width, imgD.height, numberPositionX, numberPositionY, imgD.width, imgD.height)
        if (this.floor < 0) { // B 출력
          imgD = imgDbase.numberB
          graphicSystem.imageDisplay(imageSrc.round.round2_4_elevatorNumber, imgD.x, imgD.y, imgD.width, imgD.height, numberPositionXMinusB, numberPositionY, imgD.width, imgD.height)
        }

        // 화살표 표시
        if (this.floor < this.floorArrive) {
          this.arrowUpEnimation.display(numberPositionArrowX, numberPositionY)
        } else if (this.floor > this.floorArrive) {
          this.arrowDownEnimation.display(numberPositionArrowX, numberPositionY)
        }
      }

      displayDoor () {
        // hall image 덧씌우기 (엘리베이터 내부 배경 출력)
        let imgD = imageDataInfo.round2_4_elevator.elevatorHall
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevator, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, this.width, this.height)

        switch (this.state) {
          case this.STATE_OPEN: this.displayDoorOpen(); break
          case this.STATE_OPENING: this.openEnimation.display(this.x, this.y); break
          case this.STATE_CLOSE: this.displayDoorClose(); break
          case this.STATE_CLOSEING: this.closeEnimation.display(this.x, this.y); break
        }
      }

      displayDoorOpen () {
        let imgD = imageDataInfo.round2_4_elevator.elevatorOpen
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevator, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, this.width, this.height)
      }

      displayDoorClose () {
        let imgD = imageDataInfo.round2_4_elevator.elevatorClose
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevator, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, this.width, this.height)
      }

      /**
       * 엘리베이터를 열거나 닫습니다.
       * 
       * 주의: 열리는 중이거나, 닫히는 중인경우에는 이 함수를 사용해도 동작하지 않습니다. 기다렸다가 다시 설정해 주세요.
       * @param {boolean} isOpen 이 값이 true면 open, false면 close
       */
      setDoorOpen (isOpen = true) {
        if (isOpen && this.state === this.STATE_CLOSE) {
          this.state = this.STATE_OPENING
          soundSystem.play(soundSrc.round.r2_4_elevatorDoorOpen)
          this.openEnimation.reset()
        } else if (!isOpen && this.state === this.STATE_OPEN){
          this.state = this.STATE_CLOSEING
          soundSystem.play(soundSrc.round.r2_4_elevatorDoorClose)
          this.closeEnimation.reset()
        }
      }
    }

    return new ElevatorSprite()
  }
}

class Round2_5 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round2_5)
    this.bgLegacy.imageSrc = imageSrc.round.round2_5_floorB1Light
    this.bgLegacy.backgroundSpeedX = 0
    this.bgLegacy.color = Round2_1.getMaeulGradientColor()

    // 타입 지정용 임시 클래스 (자동완성 목적)
    class SpriteDonggrami extends this.SpriteDonggrami {}
    class SpriteIntruder extends this.SpriteIntruder {}
    /** @type {SpriteDonggrami[]} */ this.spriteDonggrami = []
    /** @type {SpriteIntruder[]} */ this.spriteIntruder = []

    this.phase.addRoundPhase(this, this.roundPhase00, 0, 60)
    this.phase.addRoundPhase(this, this.roundPhase01, 61, 90)
    this.phase.addRoundPhase(this, this.roundPhase02, 91, 120)
    this.phase.addRoundPhase(this, this.roundPhase03, 121, 150)
    this.phase.addRoundPhase(this, this.roundPhase04, 151, 190)
    this.phase.addRoundPhase(this, this.roundPhase05, 191, 200)

    this.load.addImageList([
      imageSrc.round.round2_5_floorB1Light,
      imageSrc.round.round2_5_floorB1Dark,
      imageSrc.round.round2_5_floorB1Break,
    ])

    this.load.addSoundList([
      soundSrc.round.r2_5_start,
      soundSrc.round.r2_5_breakRoom,
      soundSrc.music.music14_intruder_battle,
      soundSrc.round.r2_4_message1,
      soundSrc.round.r2_3_a1_toyHammer
    ])

    this.load.addImageList(RoundPackLoad.getRound2ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound2ShareSound())

    this.customRoomBreakEffect = new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareRed, 400, 400, 2, 3)
  }

  SpriteDonggrami = class extends FieldData {
    constructor () {
      super()
      this.BASEDPS = 5000
      this.color = 'red'
      this.setRandomColor()
      this.setDonggramiColor()
      this.setRandomMoveSpeed(6, 6)
      this.moveDelay = new DelayData(60)
      this.attackDelay = new DelayData(30)
      this.hpMax = this.BASEDPS * 12
      this.hp = this.hpMax
      this.attack = this.BASEDPS
      this.dieAfterDelay = new DelayData(60)
      this.x = 0
      this.y = Math.random() * graphicSystem.CANVAS_HEIGHT

      this.getTargetAndSetSpeed()
    }

    getTargetAndSetSpeed () {
      let enemy = fieldState.getRandomEnemyObject()
      if (enemy != null) {
        let distanceX = enemy.x - this.x
        let distanceY = enemy.y - this.y

        this.setMoveSpeed(distanceX / 55, distanceY / 55)
      }
    }

    setRandomColor () {
      let random = Math.floor(Math.random() * 6)
      switch (random) {
        case 0: this.color = 'green'; break
        case 1: this.color = 'blue'; break
        case 2: this.color = 'orange'; break
        case 3: this.color = 'yellow'; break
        case 4: this.color = 'purple'; break
        default: this.color = 'red'; break
      }
    }

    /** 동그라미의 색에 따른 이미지 데이터 설정*/
    setDonggramiColor () {
      switch (this.color) {
        case 'red': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.red); break
        case 'blue': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.blue); break
        case 'green': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.green); break
        case 'orange': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.orange); break
        case 'purple': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.purple); break
        case 'yellow': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.yellow); break
      }
    }

    /** 동그라미의 스탯을 설정 (이것은 자동 저장된 데이터를 불러올때만 사용합니다.) */
    setLoadDonggramiStat (color = '', x = 0, y = 0, moveSpeedX = 0, moveSpeedY = 0, hp = 0) {
      this.color = color
      this.x = x
      this.y = y
      this.moveSpeedX = moveSpeedX
      this.moveSpeedY = moveSpeedY
      this.hp = hp
      this.setDonggramiColor()
    }

    /** 동그라미가 가지고 있는 스탯값을 저장 */
    getSaveDonggramiData () {
      return {x: this.x, y: this.y, color: this.color, hp: this.hp, moveSpeedX: this.moveSpeedX, moveSpeedY: this.moveSpeedY}
    }

    processState () {
      if (this.isDied) {
        this.y += 10
        if (this.dieAfterDelay.check()) {
          this.isDeleted = true
        }
      }
    }

    processMove () {
      if (this.isDied) return

      super.processMove()

      if (this.moveDelay.check()) {
        this.getTargetAndSetSpeed()
      }

      // 화면 바깥 이동 금지
      if (this.outAreaCheck(0)) {
        if (this.x + this.width <= 0) this.x = 1
        if (this.x >= graphicSystem.CANVAS_WIDTH) this.x = graphicSystem.CANVAS_WIDTH - 1
        if (this.y + this.height <= 0) this.y = 1
        if (this.y >= graphicSystem.CANVAS_HEIGHT) this.y = graphicSystem.CANVAS_HEIGHT - 1

        this.moveSpeedX *= -1
        this.moveSpeedY *= -1
      }

      // 충돌 처리 (딜레이카운트는 적에게 충돌했을때에만 0으로 리셋됩니다.)
      if (this.attackDelay.check(false, true)) {
        let enemyObject = fieldState.getEnemyObject()
        for (let i = 0; i < enemyObject.length; i++) {
          let enemy = enemyObject[i]
          if (!enemy.isDied && collision(this, enemy)) {
            enemy.hp -= this.attack
            this.hp -= this.attack
            this.attackDelay.count = 0
            this.moveSpeedX *= -1
            this.moveSpeedY *= -1
            this.moveDelay.count = this.moveDelay.delay / 2
            soundSystem.play(soundSrc.round.r2_3_a1_toyHammer)
            fieldState.createDamageObject(enemy.x, enemy.y, this.attack)
            break // 반복문 종료 (1회 공격에 1마리만 공격 가능)
          }
        }
      }

      // 적의 총알 대신 맞기 처리
      let enemyBulletObject = fieldState.getEnemyBulletObject()
      for (let i = 0; i < enemyBulletObject.length; i++) {
        let enemyBullet = enemyBulletObject[i]
        if (collision(this, enemyBullet)) {
          this.hp -= (this.attack / 10)
          enemyBullet.isDeleted = true
        }
      }

      // 죽음 처리
      if (this.hp <= 0) {
        soundSystem.play(soundSrc.enemyDie.enemyDieDonggrami)
        this.isDied = true
      }
    }

    display () {
      super.display()
      // 동그라미의 체력 표시
      graphicSystem.meterRect(this.x, this.y + this.height, this.width, 1, 'darkblue', this.hp, this.hpMax, true, 'skyblue')
    }
  }

  SpriteIntruder = class {
    constructor (id = 0, x = 200, y = 100, z = -120) {
      this.id = id
      this.x = x
      this.y = y
      this.z = z
      this.ZBASE = -120
      switch (this.id) {
        case ID.enemy.intruder.diacore: this.imageData = imageDataInfo.intruderEnemy.diacore; break
        case ID.enemy.intruder.rendown: this.imageData = imageDataInfo.intruderEnemy.rendownGreen; break
        case ID.enemy.intruder.lever: this.imageData = imageDataInfo.intruderEnemy.leverImage; break
        case ID.enemy.intruder.flying1: this.imageData = imageDataInfo.intruderEnemy.flying1; break
        case ID.enemy.intruder.flying2: this.imageData = imageDataInfo.intruderEnemy.flying2; break
        default: this.imageData = imageDataInfo.intruderEnemy.metal; break
      }
    }

    process () {
      if (this.z >= 0) return

      this.z++
      this.x -= (this.imageData.width / Math.abs(this.ZBASE) / 2)
      this.y -= (this.imageData.height / Math.abs(this.ZBASE) / 2)

      if (this.z === 0) {
        fieldState.createEnemyObject(this.id, this.x, this.y)
      }
    }

    getSaveIntruderData () {
      return {id: this.id, x: this.x, y: this.y, z: this.z}
    }
    
    display () {
      let imgSrc = imageSrc.enemy.intruderEnemy
      let imgD = this.imageData
      let outputMultiple = Math.abs((1 / this.ZBASE) * (this.z + Math.abs(this.ZBASE)))
      let outputWidth = imgD.width * outputMultiple
      let outputHeight= imgD.height * outputMultiple
      let alpha = outputMultiple
      graphicSystem.imageDisplay(imgSrc, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, outputWidth, outputHeight, 0, 0, alpha)
    }
  }

  process () {
    super.process()
    this.processSprite()
  }

  processSaveString () {
    let arrayDonggrami = []
    let arrayIntruder = []
    for (let i = 0; i < this.spriteDonggrami.length; i++) {
      arrayDonggrami.push(this.spriteDonggrami[i].getSaveDonggramiData())
    }
    for (let i = 0; i < this.spriteIntruder.length; i++) {
      arrayIntruder.push(this.spriteIntruder[i].getSaveIntruderData())
    }

    this.saveString = JSON.stringify(arrayDonggrami) + '|' + JSON.stringify(arrayIntruder)
  }

  loadDataSaveString () {
    let str = this.saveString.split('|')
    /** @type {Array} */ let arrayDonggrami = JSON.parse(str[0])
    /** @type {Array} */ let arrayIntruder = JSON.parse(str[1])

    for (let i = 0; i < arrayDonggrami.length; i++) {
      let donggrami = new this.SpriteDonggrami()
      let current = arrayDonggrami[i]
      donggrami.setLoadDonggramiStat(current.color, current.x, current.y, current.moveSpeedX, current.moveSpeedY, current.hp)
      this.spriteDonggrami.push(donggrami)
    }

    for (let i = 0; i < arrayIntruder.length; i++) {
      let current = arrayIntruder[i]
      let intruder = new this.SpriteIntruder(current.id, current.x, current.y, current.z)
      this.spriteIntruder.push(intruder)
    }
  }

  processSprite () {
    for (let i = 0; i < this.spriteIntruder.length; i++) {
      let sprite = this.spriteIntruder[i]
      sprite.process()
    }

    for (let i = 0; i < this.spriteIntruder.length; i++) {
      let sprite = this.spriteIntruder[i]
      if (sprite.z >= 0) {
        this.spriteIntruder.splice(i, 1)
        continue
      }
    }

    for (let i = 0; i < this.spriteDonggrami.length; i++) {
      let sprite = this.spriteDonggrami[i]
      sprite.process()
    }

    for (let i = 0; i < this.spriteDonggrami.length; i++) {
      let sprite = this.spriteDonggrami[i]
      if (sprite.isDeleted) {
        this.spriteDonggrami.splice(i, 1)
      }
    }
  }

  /** 
   * intruder 입장용 적을 생성합니다. (적을 들어오는 형태로 표현하려면 이 함수로 적을 생성해야 함) 
   * 
   * 각 값들은 정해진 기준값이 존재
   * @param {number} id 적의 id
   * @param {number} x 적의 x좌표 (범위: 200 ~ 600)
   * @param {number} y 적의 y좌표 (범위: 100 ~ 500)
   */
  createSpriteIntruder (id, x = 200, y = 100) {
    this.spriteIntruder.push(new this.SpriteIntruder(id, x, y))
  }

  /** 동그라미를 생성합니다. */
  createSpriteDonggrami () {
    this.spriteDonggrami.push(new this.SpriteDonggrami())
  }

  roundPhase00 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime

    // 초반 인트로
    if (this.timeCheckFrame(pTime + 1)) {
      this.sound.soundPlay(soundSrc.round.r2_5_start)
      this.bgLegacy.changeImage(imageSrc.round.round2_5_floorB1Dark, 120)
      this.bgLegacy.color = 'black'
    } else if (this.timeCheckFrame(pTime + 4)) {
      this.sound.soundPlay(soundSrc.round.r2_5_breakRoom)
      fieldState.createEffectObject(this.customRoomBreakEffect.getObject(), 200, 100)
      this.bgLegacy.changeImage(imageSrc.round.round2_5_floorB1Break, 60)
      this.bgLegacy.color = '#FF5C5C'
    } else if (this.timeCheckFrame(pTime + 5)) {
      this.bgLegacy.color = Round2_1.getMaeulGradientColor()
    } else if (this.timeCheckFrame(pTime + 6)) {
      this.sound.musicChange(soundSrc.music.music14_intruder_battle)
      this.sound.musicPlay()
    }

    // 각각의 적들이 차례대로 출현 (해당 페이즈에서만 진입하는 형태로 출연합니다.)
    if (this.timeCheckFrame(pTime + 7)) {
      for (let i = 0; i < 9; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.metal, 300 + ((i % 3) * 100), 200 + (Math.floor(i / 3) * 100))
      }
    } else if (this.timeCheckFrame(pTime + 12)) {
      for (let i = 0; i < 9; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.diacore, 300 + ((i % 3) * 100), 200 + (Math.floor(i / 3) * 100))
      }
    } else if (this.timeCheckFrame(pTime + 18)) {
      for (let i = 0; i < 4; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.rendown, 300 + ((i % 2) * 200), 200 + (Math.floor(i / 2) * 200))
      }
    } else if (this.timeCheckFrame(pTime + 24)) {
      for (let i = 0; i < 6; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.lever, 200 + ((i % 3) * 200), 200 + (Math.floor(i / 3) * 150))
      }
    } else if (this.timeCheckFrame(pTime + 30)) {
      for (let i = 0; i < 4; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.flying1, 250 + ((i % 2) * 300), 200 + (Math.floor(i / 2) * 200))
      }
      for (let i = 0; i < 2; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.flying2, 400, 200 + (Math.floor(i / 1) * 200))
      }
    } else if (this.timeCheckFrame(pTime + 38)) {
      for (let i = 0; i < 3; i++) {
        this.field.createEnemy(ID.enemy.intruder.gami, 700)
      }
      for (let i = 0; i < 3; i++) {
        this.field.createEnemy(ID.enemy.intruder.momi, 700)
      }
    }

    this.timePauseWithEnemyCount(pTime + 44)
    if (this.timeCheckInterval(pTime + 45, pTime + 57, 10)) {
      this.field.createEnemy(ID.enemy.intruder.flyingRocket)
    }
    this.timePauseWithEnemyCount(pTime + 59)
  }

  roundPhase01 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime

    // total phase dps: 240% (first 6 seconds 100%) (main dps 120%, donggrami dps: 120%)

    // group 1 (dps 60%), (first 6 seconds 100%)
    if (this.timeCheckInterval(pTime + 0, pTime + 6, 12) || this.timeCheckInterval(pTime + 7, pTime + 28, 20)) {
      let random = Math.floor(Math.random() * 3)
      switch (random) {
        case 0: this.field.createEnemy(ID.enemy.intruder.metal); break
        case 1: this.field.createEnemy(ID.enemy.intruder.diacore); break
        default: this.field.createEnemy(ID.enemy.intruder.square); break
      }
    }

    // group 2 (dps 100%)
    if (this.timeCheckInterval(pTime + 7, pTime + 28, 60)) {
      if (Math.floor(Math.random() * 2) === 0) {
        this.field.createEnemy(ID.enemy.intruder.rendown, 839, 100)
      } else {
        this.field.createEnemy(ID.enemy.intruder.lever, 839, 200)
        this.field.createEnemy(ID.enemy.intruder.lever, 839, 400)
      }
    }

    // group 3 (dps 80%)
    if (this.timeCheckInterval(pTime + 7, pTime + 28, 90)) {
      this.field.createEnemy(ID.enemy.intruder.flying1) // 40%
      this.field.createEnemy(ID.enemy.intruder.flying2) // 80%
    }

    if (this.timeCheckFrame(pTime + 7)) {
      for (let i = 0; i < 10; i++) {
        this.createSpriteDonggrami()
      }
    }

    if (this.timeCheckInterval(pTime + 10, pTime + 28, 60)) {
      this.createSpriteDonggrami()
    }

    this.timePauseWithEnemyCount(pTime + 29, 6)
  }

  roundPhase02 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime

    // tower
    if (this.timeCheckInterval(pTime + 0, pTime + 10, 180)) {
      this.field.createEnemy(ID.enemy.intruder.hanoi, Math.random() * 400, 400) 
      this.field.createEnemy(ID.enemy.intruder.hanoi, Math.random() * 400, 400) 
      this.createSpriteDonggrami()
    } else if (this.timeCheckFrame(pTime + 10)) {
      for (let i = 0; i < 5; i++) {
        this.field.createEnemy(ID.enemy.intruder.daseok, i * 160, 400)
      }
    }

    // donggrami
    if (this.timeCheckInterval(pTime + 12, pTime + 18, 120)) {
      for (let i = 0; i < 3; i++) {
        this.createSpriteDonggrami()
      }
    }

    this.timePauseWithEnemyCount(pTime + 19, 3)

    // monster + flying
    if (this.timeCheckInterval(pTime + 20, pTime + 28, 60)) {
      this.field.createEnemy(ID.enemy.intruder.flyingRocket)
      this.field.createEnemy(ID.enemy.intruder.flying1)
      this.field.createEnemy(ID.enemy.intruder.flying2)
      this.field.createEnemy(ID.enemy.intruder.gami)
      this.field.createEnemy(ID.enemy.intruder.momi)
    }

    // donggrami
    if (this.timeCheckInterval(pTime + 20, pTime + 28, 90)) {
      this.createSpriteDonggrami()
      this.createSpriteDonggrami()
    }

    this.timePauseWithEnemyCount(pTime + 29, 10)
  }

  roundPhase03 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    // phase dps: 360% (player 120%, donggrami 240%)
    // 참고: dps에 오차가 있을 수 있음

    // group 1 part 1 (dps ~150%) (+0 ~ +5)
    if (this.timeCheckInterval(pTime + 0, pTime + 15, 16)) {
      this.field.createEnemy(ID.enemy.intruder.metal)
      this.field.createEnemy(ID.enemy.intruder.diacore)
    }

    // group 2 part 1 (dps ~130% x 1.8)
    if (this.timeCheckInterval(pTime + 0, pTime + 15, 24)) {
      this.field.createEnemy(ID.enemy.intruder.flying1)
      this.field.createEnemy(ID.enemy.intruder.flying2)
      this.field.createEnemy(ID.enemy.intruder.flyingRocket)
    }

    // group 1 part 2 (dps ~240%)
    if (this.timeCheckInterval(pTime + 16, pTime + 28, 54)) {
      this.field.createEnemy(ID.enemy.intruder.lever)
      this.field.createEnemy(ID.enemy.intruder.lever)
      this.field.createEnemy(ID.enemy.intruder.rendown)
    }

    // group 2 part 2 (dps ~130%)
    if (this.timeCheckInterval(pTime + 16, pTime + 28, 60)) {
      this.field.createEnemy(ID.enemy.intruder.gami)
      this.field.createEnemy(ID.enemy.intruder.momi)
      this.field.createEnemy(ID.enemy.intruder.flyingRocket)
    }

    // group 3 (9 seconds 1 time // total 3)
    if (this.timeCheckFrame(pTime + 3) || this.timeCheckFrame(pTime + 13), this.timeCheckFrame(pTime + 23)) {
      this.field.createEnemy(ID.enemy.intruder.hanoi, Math.random() * 600)
      this.field.createEnemy(ID.enemy.intruder.daseok, Math.random() * 600)
    }

    // donggrami (1 second per 4)
    if (this.timeCheckInterval(pTime + 0, pTime + 28, 30)) {
      this.createSpriteDonggrami()
    } else if (this.timeCheckInterval(pTime + 29, pTime + 29, 60) && this.spriteDonggrami.length <= 2) {
      this.createSpriteDonggrami()
    }

    this.timePauseWithEnemyCount(pTime + 29, 10)
  }

  roundPhase04 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    // boss
    if (this.timeCheckFrame(pTime + 1)) {
      this.sound.soundPlay(soundSrc.round.r2_4_message1)
      this.field.createEnemy(ID.enemy.intruder.jemuBoss)
    }

    // avg dps 100%
    if (this.timeCheckInterval(pTime + 4, pTime + 10, 12)) {
      this.field.createEnemy(ID.enemy.intruder.square)
    } else if (this.timeCheckInterval(pTime + 11, pTime + 20, 12)) {
      this.field.createEnemy(ID.enemy.intruder.metal)
    } else if (this.timeCheckInterval(pTime + 21, pTime + 28, 12)) {
      this.field.createEnemy(ID.enemy.intruder.diacore)
    }

    if (this.spriteDonggrami.length <= 10 && this.timeCheckInterval(pTime + 5, pTime + 39, 60) && this.field.getEnemyCount() >= 3) {
      this.createSpriteDonggrami()
    }

    if (this.timeCheckInterval(pTime + 29, pTime + 38) && this.field.enemyNothingCheck()) {
      this.time.setCurrentTime(pTime + 39)
    }

    this.timePauseWithEnemyCount(pTime + 39)
  }

  roundPhase05 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    if (this.timeCheckInterval(pTime + 0, pTime + 6, 10)) {
      this.field.createEnemy(ID.enemy.intruder.flyingRocket)
    }
    if (this.timeCheckInterval(pTime + 0, pTime + 6, 60)) {
      this.field.createEnemy(ID.enemy.intruder.momi)
    }

    if (this.timeCheckFrame(pTime + 4)) {
      this.createSpriteDonggrami()
      this.createSpriteDonggrami()
    }

    if (this.timeCheckFrame(pTime + 4)) {
      this.sound.musicChange('', 3)
    } else if (this.timeCheckFrame(pTime + 7)) {
      this.sound.musicStop()
    }

    this.timePauseWithEnemyCount(pTime + 8)
  }

  display () {
    super.display()
    this.displaySprite()

    if (this.phase.getCurrentPhase() === 4) {
      this.meter.bossHpUserStyle(ID.enemy.intruder.jemuBoss, 10, 10, graphicSystem.CANVAS_WIDTH - 20, 25, ['#7D7D7D', '#7B84A4'])

      let enemyObject = this.field.getEnemyObject()
      for (let i = 0; i < enemyObject.length; i++) {
        let enemy = enemyObject[i]
        if (enemy.id === ID.enemy.intruder.jemuBoss) {
          graphicSystem.meterRect(0, 0, graphicSystem.CANVAS_WIDTH, 25, ['#7D7D7D', '#7B84A4'], enemy.hp, enemy.hpMax, true, '#B9D7FF', 2)
          digitalDisplay('BOSS HP: ' + enemy.hp + '/' + enemy.hpMax, 10, 3)
          break
        }
      }
    }
  }

  displaySprite () {
    for (let i = 0; i < this.spriteIntruder.length; i++) {
      this.spriteIntruder[i].display()
    }

    for (let i = 0; i < this.spriteDonggrami.length; i++) {
      this.spriteDonggrami[i].display()
    }
  }
}


class Round2_6 extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round2_6)

    /** 배경 기준값의 좌표 */
    this.bgXY = {
      /** 지하 1층 시작점 x좌표 */ B1_START_X: 0,
      /** 지하 1층 시작점 y좌표 (변화하지 않음) */ B1_START_Y: 800,
      /** 자하 1층 끝점 x좌표 */ B1_END_X: 800,
      /** 1층 시작지점 */ F1_START_X: 0,
      /** 1층 끝지점 */ F1_START_Y: 0,
    }

    this.phase.addRoundPhase(this, this.roundPhase00, 0, 29)
    this.phase.addRoundPhase(this, this.roundPhase01, 30, 59)
    this.phase.addRoundPhase(this, this.roundPhase02, 60, 89)
    this.phase.addRoundPhase(this, this.roundPhase03, 90, 119)
    this.phase.addRoundPhase(this, this.roundPhase04, 120, 150)

    this.load.addSoundList([
      soundSrc.round.r2_4_elevatorDoorClose,
      soundSrc.round.r2_4_elevatorDoorOpen,
      soundSrc.round.r2_4_elevatorFloor,
      soundSrc.round.r2_4_elevatorMove,
    ])

    this.load.addImageList([
      imageSrc.round.round2_4_elevator,
      imageSrc.round.round2_4_elevatorHall,
      imageSrc.round.round2_4_elevatorNumber,
      imageSrc.round.round2_4_floorB1,
      imageSrc.round.round2_5_floorB1Light,

      imageSrc.round.round2_6_original1,
      imageSrc.round.round2_6_original2,
      imageSrc.round.round2_6_ruin1,
      imageSrc.round.round2_6_ruin2,
      imageSrc.round.round2_6_quiteRoad,
      imageSrc.round.round2_6_downtowerEntrance,
    ])

    this.load.addImageList(RoundPackLoad.getRound2ShareImage())
    this.load.addSoundList(RoundPackLoad.getRound2ShareSound())

    this.spriteElevator = Round2_4.createSpriteElevator()
    this.setBgLayer()
  }

  setBgLayer () {
    // 배경색 설정
    this.bgLayer.setColor(Round2_1.getMaeulGradientColor())

    // 지하 1층
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_5_floorB1Light, 0, 800)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_floorB1, 800, 800)

    // 지상
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_elevatorOutside, 0, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_4_placard, 800, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_6_quiteRoad, 1600, 0)

    // 폐허 1 -> 다운타워까지 (참고: quiteLoad는 1800px 크기지만, 다른 배경과 완전히 겹치기 때문에, 폐허 1은 겹쳐서 출력됩니다.)
    // 위치를 1800px로 정의한것은 30second x 60frame = 1800px 때문
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_6_ruin1, 1800, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_6_ruin2, 3600, 0)
    this.bgLayer.setBackgroundImage(imageSrc.round.round2_6_downtowerEntrance, 5400, 0)

    // 엘리베이터 배경 레이어
    this.bgLayer.addLayerImage(imageSrc.round.round2_4_elevatorHall, 0)
    this.bgLayer.setLayerSpeed(0, 0, 0) // 레이어 이동 금지 및 고정

    // 스크롤 무한루프 불가능
    this.bgLayer.setBackgroundScroolLoop(false, false)

    // 기본 위치 지정
    this.bgLayer.setBackgroundWidthHeight(7200, 1600)
    this.bgLayer.setBackgroundPosition(0, 800)
  }

  /** 
   * 2-4 코드를 복사하였습니다.
   * 
   * 엘리베이터 내부를 표시합니다. (참고: 엘리베이터 배경 전환시간은 1초입니다.)
   * @param {boolean} isElevator 엘리베이터 내부에 있는가?
   */
  changeElevatorDisplay (isElevator) {
    if (isElevator) {
      this.bgLayer.setLayerAlphaFade(0, 1, 60)
    } else {
      this.bgLayer.setLayerAlphaFade(0, 0, 60)
    }
  }

  processSaveString () {
    // 2-4 코드와의 차이점은, course에 대한 정보가 없음
    this.saveString = this.spriteElevator.state
      + ',' + this.spriteElevator.stateDelay.count 
      + ',' + this.spriteElevator.floorDelay.count
      + ',' + this.spriteElevator.floor
      + ',' + this.spriteElevator.floorArrive
      + ',' + this.spriteElevator.isFloorMove
      + ',' + this.spriteElevator.x
      + ',' + this.spriteElevator.y
  }

  loadDataSaveString () {
    let str = this.saveString.split(',')
    this.spriteElevator.state = str[0]
    this.spriteElevator.stateDelay.count = Number(str[1])
    this.spriteElevator.floorDelay.count = Number(str[2])
    this.spriteElevator.floor = Number(str[3])
    this.spriteElevator.floorArrive = Number(str[4])
    this.spriteElevator.isFloorMove = str[5] === 'true' ? true : false
    this.spriteElevator.x = Number(str[6])
    this.spriteElevator.y = Number(str[7])
  }

  roundPhase00 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    if (this.timeCheckInterval(pTime + 2, pTime + 6, 60)) {
      this.field.createEnemy(ID.enemy.intruder.gami)
      this.field.createEnemy(ID.enemy.intruder.momi)
    } else if (this.timeCheckInterval(pTime + 8, pTime + 12, 30)) {
      this.field.createEnemy(ID.enemy.intruder.diacore)
      this.field.createEnemy(ID.enemy.intruder.metal)
      this.field.createEnemy(ID.enemy.intruder.square)
    }

    if (this.timeCheckFrame(pTime + 11)) {
      this.field.createEnemy(ID.enemy.intruder.daseok, 0)
      this.field.createEnemy(ID.enemy.intruder.daseok, graphicSystem.CANVAS_WIDTH - imageDataInfo.intruderEnemy.daseok.width)
    }

    if (this.timeCheckFrame(1)) {
      this.spriteElevator.setFloorPosition(1)
      this.bgLegacy.changeImage(imageSrc.round.round2_4_floorB1)
    }
    this.timePauseWithEnemyCount(18)

    this.spriteElevator.process()
    if (this.timeCheckFrame(pTime + 20)) {
      this.spriteElevator.setFloorMove(-1)
      // 이동 시간 1초 후 1초 대기
    } else if (this.timeCheckFrame(pTime + 22)) {
      this.spriteElevator.setDoorOpen(true)
    } else if (this.timeCheckFrame(pTime + 23)) {
      this.changeElevatorDisplay(true)
    } else if (this.timeCheckFrame(pTime + 24)) {
      this.spriteElevator.setDoorOpen(false)
    } else if (this.timeCheckFrame(pTime + 25)) {
      this.spriteElevator.setFloorMove(1)
      this.bgLayer.setBackgroundPosition(this.bgXY.F1_START_X, this.bgXY.F1_START_Y) // 배경 위치 변경(F1층으로)
    } else if (this.timeCheckFrame(pTime + 27)) {
      this.spriteElevator.setDoorOpen(true)
    } else if (this.timeCheckFrame(pTime + 28)) {
      this.changeElevatorDisplay(false)
    } else if (this.timeCheckFrame(pTime + 29)) {
      this.spriteElevator.setDoorOpen(false)
    }
  }

  roundPhase01 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    this.spriteElevator.process()

    // music
    if (this.timeCheckFrame(pTime + 0)) {
      this.sound.musicChange(soundSrc.music.music12_donggrami_hall_outside, 3)
      this.sound.musicPlay()
    } else if (this.timeCheckFrame(pTime + 26)) {
      this.sound.musicChange('', 3)
    } else if (this.timeCheckFrame(pTime + 29)) {
      this.sound.musicStop()
    }

    // donggramiParty (dps 120%)
    if (this.timeCheckInterval(pTime + 1, pTime + 17, 30)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.party)
      this.field.createEnemy(ID.enemy.donggramiEnemy.exclamationMark)
      this.field.createEnemy(ID.enemy.donggramiEnemy.questionMark)
    } else if (this.timeCheckInterval(pTime + 18, pTime + 25, 60)) {
      // donggrami (dps 50%)
      this.field.createEnemy(ID.enemy.donggramiEnemy.mini)
      this.field.createEnemy(ID.enemy.donggramiEnemy.bounce)
      this.field.createEnemy(ID.enemy.donggramiEnemy.speed)
    }
  }

  roundPhase02 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime

    if (this.timeCheckFrame(pTime + 0)) {
      this.sound.musicChange(soundSrc.music.music15_donggrami_ruin, 2)
      this.sound.musicPlay()
    }

    // dps 100%
    if (this.timeCheckInterval(pTime + 1, pTime + 24, 12)) {
      this.field.createEnemy(ID.enemy.donggramiEnemy.talkRuinR2_6)
    }
  }

  roundPhase03 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime

    if (this.timeCheckFrame(pTime + 26)) {
      this.sound.musicChange('', 3)
    } else if (this.timeCheckFrame(pTime + 29)) {
      this.sound.musicStop()
    }

    // dps 120%
    if (this.timeCheckInterval(pTime + 1, pTime + 15, 60)) {
      this.field.createEnemy(ID.enemy.intruder.flying1)
      this.field.createEnemy(ID.enemy.intruder.flying2)
    } else if (this.timeCheckInterval(pTime + 16, pTime + 28, 72)) {
      this.field.createEnemy(ID.enemy.intruder.lever)
      this.field.createEnemy(ID.enemy.intruder.rendown)
    }

    if (this.timeCheckFrame(pTime + 5) || this.timeCheckFrame(pTime + 10) || this.timeCheckFrame(pTime + 15)) {
      this.field.createEnemy(ID.enemy.intruder.hanoi)
    }
  }

  roundPhase04 () {
    const pTime = this.phase.phaseTime[this.phase.getCurrentPhase()].startTime
    if (this.timeCheckFrame(pTime + 18)) {
      this.field.createEnemy(ID.enemy.intruder.daseok, 600, 300)
      this.field.createEnemy(ID.enemy.intruder.daseok, 400, 300)
    }

    if (this.timeCheckInterval(pTime + 2, pTime + 15, 60)) {
      this.field.createEnemy(ID.enemy.intruder.flyingRocket)
      this.field.createEnemy(ID.enemy.intruder.metal)
      this.field.createEnemy(ID.enemy.intruder.square)
      this.field.createEnemy(ID.enemy.intruder.diacore)
      this.field.createEnemy(ID.enemy.intruder.lever)
    } else if (this.timeCheckInterval(pTime + 18, pTime + 27, 20)) {
      this.field.createEnemy(ID.enemy.intruder.nextEnemy)
    }

    this.timePauseWithEnemyCount(pTime + 28)
  }

  display () {
    super.display()
    if (this.phase.getCurrentPhase() === 0 || this.phase.getCurrentPhase() === 1) {
      this.spriteElevator.display()
    }
  }

  processBackground () {
    super.processBackground()

    /** 현재 페이즈 */ const cPhase = this.phase.getCurrentPhase()
    const x = this.bgLayer.getBackgroundPosition().x
    const y = this.bgLayer.getBackgroundPosition().y

    switch (cPhase) {
      case 0:
        if (x < this.bgXY.B1_END_X && y === this.bgXY.B1_START_Y) {
          this.bgLayer.setBackgroundSpeed(1, 0)
          this.spriteElevator.x = this.bgXY.B1_END_X - x + this.spriteElevator.BASE_X
        } else if (y === this.bgXY.B1_START_Y) {
          this.bgLayer.setBackgroundSpeed(0, 0)
          this.spriteElevator.x = this.bgXY.B1_END_X - x + this.spriteElevator.BASE_X
        } else {
          this.spriteElevator.x = this.spriteElevator.BASE_X
        }

        this.spriteElevator.y = this.spriteElevator.BASE_Y
        break
      default:
        this.bgLayer.setBackgroundSpeed(1, 0)
        this.spriteElevator.x = -x + this.spriteElevator.BASE_X
        break
    }
  }
}

class Round2_OS95 extends RoundData {
  // ?!
  // windows 95??
}

class Round2_test extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round2_test)
    this.bgLayer.addLayerImage(imageSrc.round.round1_1_space, 1)
    this.bgLayer.addLayerImage(imageSrc.round.round1_2_meteorite, 0)
    this.phase.addRoundPhase(this, this.roundPhase00, 0, 200)
  }

  processPhase () {
    this.phase.process(this.time.currentTime)
  }

  roundPhase00 () {
    if (this.timeCheckFrame(3)) {
      let getLayer = this.bgLayer.getLayer()
      getLayer[0].fadeAlpha(0, 300)
      getLayer[1].fadeAlpha(1, 300)
      console.log('!!!')
    }
  }

  display () {
    this.bgLayer.display()

    let layer = this.bgLayer.getLayer()
    graphicSystem.fillText(layer[0].alpha + ', ' + layer[0].alpha, 0, 20, 'yellow')
    graphicSystem.fillText(layer[0].alphaDelayCount + ', ' + layer[0].alphaDelayCount, 0, 0, 'white')
  }
}

class Round3_test extends RoundData {
  constructor () {
    super()
    this.stat.setStat(ID.round.round3_test)
    this.playerOption = new this.PlayerOption()
    this.playerOption.setColor(this.playerOption.colorList.purple)
    this.playerOption.setLevel(4)

    this.phase.addRoundPhase(this, () => {
      if (this.timeCheckInterval(0, 999, 30)) {
        this.field.createEnemy(ID.enemy.intruder.gami)
      }
    }, 0, 999)
  }

  process () {
    super.process()
    this.playerOption.process()
  }

  display () {
    super.display()
    this.playerOption.display()
  }

  PlayerOption = class PlayerOption extends FieldData {
    /** purple의 선 표시용도(서로의 위치를 기준으로 선을 4개 그립니다.) */ 
    static purpleLine = {x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, width2: 0, height2: 0, isTargetHit: false}

    constructor () {
      super()
      /** 플레이어 위치 기준 옵션의 상대 위치값 X좌표 @type {number} */ this.POSITION_X = 50
      /** 플레이어 위치 기준 옵션의 상대 위치값 첫번째 옵션의 Y좌표 @type {number} */ this.POSITION_Y = -10
      /** 옵션의 현재 색 @type {string} */ this.color = ''
      /** 현재 옵션의 레벨 (게임 도중에 리셋되지 않습니다.), 이 값을 수정하려면 setLevel을 사용해주세요. @type {number} */ this.level = 0
      /** 옵션의 최대 레벨 @type {number} */ this.LEVEL_MAX = 4
      /** 현재 레벨에 따른 dps퍼센트값 기준 @type {number[]} */ this.dpsPercentLevel = [40, 50, 60, 80, 100]
      this.imageSrc = imageSrc.round.round3_optionWeapon
      /** 옵션을 가지고 있는 여부 @type {boolean} */ this.hasOption = false
      /** 옵션의 무기 발사에 대한 지연시간 카운터 */ this.delayCount = 0
      

      /** 옵션이 가지고 있는 기본적인 공격력 (다운타워의 cp랑 관련되어있음. 다만 값은 수동으로 설정해야함) 
       * 만약 다운타워의 baseCp(기본전투력)가 수정되었을 때 이 값을 수정하지 않으면 밸런스적으로 문제가 발생할 수 있음. */ 
      this.BASE_ATTACK = 70000

      /** 초당 프레임 횟수: 게임 기본값 60, 이 값을 기준으로 각 무기들의 delay가 결정됩니다. */
      this.FRAME_PER_SECOND = 60

      /**
       * @typedef optionInfo 옵션에 대한 정보
       * @property {number[]} shotPerSecond 초당 발사 횟수
       * @property {number[]} shotPerCount 한번의 샷 당 동시에 발사하는 횟수
       */
      /** 
       * 옵션에 대한 확장 정보 
       */ 
      this.optionInfo = {
        /** @type {optionInfo} */ orange: {shotPerSecond: [2, 3, 4, 5, 6], shotPerCount: [4, 4, 4, 4, 4]},
        /** @type {optionInfo} */ green: {shotPerSecond: [5, 6, 10, 12, 15], shotPerCount: [4, 4, 4, 4, 4]},
        /** @type {optionInfo} */ skyblue: {shotPerSecond: [2, 2, 2, 2, 2], shotPerCount: [2, 2, 2, 3, 3]},
        /** @type {optionInfo} */ black: {shotPerSecond: [2, 2, 2, 2, 2], shotPerCount: [2, 2, 2, 2, 2]},
        /** @type {optionInfo} */ pink: {shotPerSecond: [1, 1, 1, 1, 1], shotPerCount: [2, 2, 2, 2, 2]},
        /** @type {optionInfo} */ purple: {shotPerSecond: [4, 6, 8, 10, 12], shotPerCount: [1, 1, 1, 1, 1]}
      }

      /** 옵션에서 사용하는 color의 리스트 */
      this.colorList = {
        orange: 'orange',
        skyblue: 'skyblue',
        green: 'green',
        black: 'black',
        pink: 'pink',
        purple: 'purple',
      }

      // 임시 이미지 설정
      this.setAutoImageData(this.imageSrc, imageDataInfo.round3_optionWeapon.orange, 3)

      
      /** 옵션에서 관리하는 무기의 오브젝트 @type {WeaponData[]} */
      this.weaponObject = []
    }

    /**
     * 옵션의 현재 색을 설정합니다.
     * @param {string} color 
     */
    setColor (color) {
      this.color = color
      switch (color) {
        case this.colorList.orange: this.setAutoImageData(this.imageSrc, imageDataInfo.round3_optionWeapon.orange, 3); break
        case this.colorList.skyblue: this.setAutoImageData(this.imageSrc, imageDataInfo.round3_optionWeapon.skyblue, 3); break
        case this.colorList.green: this.setAutoImageData(this.imageSrc, imageDataInfo.round3_optionWeapon.green, 3); break
        case this.colorList.black: this.setAutoImageData(this.imageSrc, imageDataInfo.round3_optionWeapon.black, 3); break
        case this.colorList.pink: this.setAutoImageData(this.imageSrc, imageDataInfo.round3_optionWeapon.pink, 3); break
        case this.colorList.purple: this.setAutoImageData(this.imageSrc, imageDataInfo.round3_optionWeapon.purple, 3); break
      }
    }

    /** 옵션의 정보를 저장하고 있는 문자열 데이터를 얻어옵니다. */
    getSaveString () {
      return '' + this.level + ' ' + this.color
    }

    /**
     * 옵션의 정보를 저장하고 있는 문자열을 사용하여 재설정하는 함수
     * 
     * 저장 형식은 getSaveString 함수 내부 참조
     * @param {string} str 
     */
    setLoadString (str) {
      let text = str.split(' ')
      this.level = Number(text[0])
      this.color = text[1]
    }

    /** 현재 옵션의 정보를 현재 레벨에 맞추어 가져옵니다. (현재 색에 따라 얻어오는 정보는 달라짐) */
    getCurrentOptionInfo () {
      let shotPerCount, shotPerSecond
      let currentInfo
      switch (this.color) {
        case this.colorList.green: currentInfo = this.optionInfo.green; break
        case this.colorList.orange: currentInfo = this.optionInfo.orange; break
        case this.colorList.skyblue: currentInfo = this.optionInfo.skyblue; break
        case this.colorList.black: currentInfo = this.optionInfo.black; break
        case this.colorList.pink: currentInfo = this.optionInfo.pink; break
        case this.colorList.purple: currentInfo = this.optionInfo.purple; break
        default: currentInfo = this.optionInfo.orange; break
      }

      shotPerCount = currentInfo.shotPerCount[this.level]
      shotPerSecond = currentInfo.shotPerSecond[this.level]

      return {
        shotPerCount,
        shotPerSecond
      }
    }

    /** 
     * 옵션의 레벨을 설정 (참고: 옵션의 최대 레벨을 넘길경우 오류가 발생할 수 있으므로 해당 함수를 사용하여 옵션의 레벨을 변경해주세요.) 
     * @param {number} level 설정할 레벨
     * */
    setLevel (level) {
      if (level >= 0 && level <= this.LEVEL_MAX) {
        this.level = level
      }
    }

    /** 현재 옵션의 공격력을 색의 정보와 레벨에 맞추어 얻어옵니다. (참고: 옵션의 기본 공격력은 BASE_ATTACK에 정의되어있습니다.) */
    getAttack () {
      let count = this.getCurrentOptionInfo().shotPerCount
      let perSecond = this.getCurrentOptionInfo().shotPerSecond
      let mul = 1
      if (this.color === this.colorList.green) mul = 1.5
      if (this.color === this.colorList.skyblue) mul = 0.8
      if (this.color === this.colorList.black) mul = 0.2 // 0.2 * 6 = 1.2 (black은 무기 공격횟수가 6입니다.)
      if (this.color === this.colorList.pink) mul = 0.45 // 0.45 * 2 = 0.9 (pink는 2회 스플래시 공격)

      // 공식: 기본 공격력 / 샷 카운트 수 / 초당 발사 횟수 * dps의 백뷴율 (최종 결과값에 소수점 버림) * 무기의 배율
      let attack = (this.BASE_ATTACK / count / perSecond) * (this.dpsPercentLevel[this.level] / 100) * mul
      return Math.floor(attack)
    }

    attackOrange () {
      let count = this.getCurrentOptionInfo().shotPerCount
      for (let i = 0; i < count; i++) {
        let weapon = new PlayerOption.WeaponOrange()
        weapon.x = this.x
        weapon.y = this.y + (i * 10)
        weapon.attack = this.getAttack()
        this.weaponObject.push(weapon)
      }
    }

    attackGreen () {
      let count = this.getCurrentOptionInfo().shotPerCount
      for (let i = 0; i < count; i++) {
        let weapon = new PlayerOption.WeaponGreen()
        weapon.x = this.x
        weapon.y = i === count - 1 ? this.y + 15 : this.y + (i * 15) // 1개의 샷은 backshot(뒤로 발사함) 입니다.
        weapon.moveSpeedX = i === count - 1 ? -30 : 30 // 1개의 샷은 backshot(뒤로 발사함) 입니다.
        weapon.attack = this.getAttack()
        this.weaponObject.push(weapon)
      }
    }

    attackSkyblue () {
      let count = this.getCurrentOptionInfo().shotPerCount
      for (let i = 0; i < count; i++) {
        let weapon = new PlayerOption.WeaponSkyblue()
        weapon.x = this.x
        weapon.y = this.y + (i * 40)
        weapon.attack = this.getAttack()
        this.weaponObject.push(weapon)
      }
    }

    attackBlack () {
      let count = this.getCurrentOptionInfo().shotPerCount
      let level = this.level
      let speedTable = [6, 9, 12, 15, 18]
      for (let i = 0; i < count; i++) {
        let weapon = new PlayerOption.WeaponBalck()
        weapon.x = this.x
        weapon.y = this.y
        weapon.attack = this.getAttack()

        if (i === 0) weapon.setMoveSpeed(10, -speedTable[level]) 
        if (i === 1) weapon.setMoveSpeed(10, speedTable[level]) // 한쪽 무기는 y축 이동방향이 반대입니다.

        this.weaponObject.push(weapon)
      }
    }

    attackPink () {
      let count = this.getCurrentOptionInfo().shotPerCount
      for (let i = 0; i < count; i++) {
        let weapon = new PlayerOption.WeaponPink()
        weapon.x = this.x
        weapon.y = this.y
        weapon.setStartChase() // 적 추적 좌표를 설정하기 위해서 사용
        weapon.attack = this.getAttack()
        this.weaponObject.push(weapon)
      }
    }

    attackPurple () {
      let count = this.getCurrentOptionInfo().shotPerCount
      for (let i = 0; i < count; i++) {
        let weapon = new PlayerOption.WeaponPurple()
        weapon.x = this.x
        weapon.y = this.y
        weapon.attack = this.getAttack()
        this.weaponObject.push(weapon)
      }
    }

    processAttack () {
      let delay = this.FRAME_PER_SECOND / this.getCurrentOptionInfo().shotPerSecond

      this.delayCount++
      if (this.delayCount > delay) {
        this.delayCount -= delay
        switch (this.color) {
          case this.colorList.orange: this.attackOrange(); break
          case this.colorList.green: this.attackGreen(); break
          case this.colorList.skyblue: this.attackSkyblue(); break
          case this.colorList.black: this.attackBlack(); break
          case this.colorList.pink: this.attackPink(); break
          case this.colorList.purple: this.attackPurple(); break
        }
      }
    }

    processWeapon () {
      for (let i = 0; i < this.weaponObject.length; i++) {
        this.weaponObject[i].process()

        if (this.weaponObject[i].message === 'purple') {
          let p = PlayerOption.purpleLine
          p.x2 = this.weaponObject[i].x
          p.y2 = this.weaponObject[i].y
          p.width2 = this.weaponObject[i].width
          p.height2 = this.weaponObject[i].height
        }
      }

      if (this.color === this.colorList.purple) {
        let p = PlayerOption.purpleLine
        p.x = this.x
        p.y = this.y
        p.width = this.width
        p.height = this.height
      }

      // weaponObject delete (버그 방지를 위해 삭제 코드를 처리 코드와 분리함)
      for (let i = 0; i < this.weaponObject.length; i++) {
        if (this.weaponObject[i].isDeleted) {
          this.weaponObject.splice(i, 1)
        }
      }
    }

    processMove () {
      let player = BaseField.getPlayerObject()
      this.x = player.x + this.POSITION_X
      this.y = player.y + this.POSITION_Y
    }

    process () {
      super.process()
      if (this.color === '') return

      // processMove는 super.process에서 처리하므로 따로 명시할 필요가 없습니다.
      this.processAttack()
      this.processWeapon()
    }

    display () {
      if (this.color !== '') {
        for (let i = 0; i < this.weaponObject.length; i++) {
          this.weaponObject[i].display()
        }

        this.displayPurpleLine()
        super.display()
      }
    }

    displayPurpleLine () {
      if (this.color === this.colorList.purple) {
        let p = PlayerOption.purpleLine
        graphicSystem.fillLine(p.x, p.y, p.x2, p.y2, 'purple') // 1번째 선 (대각선 위 왼쪽)
        graphicSystem.fillLine(p.x + p.width, p.y, p.x2 + p.width2, p.y2, 'purple') // 2번째 선 (대각선 위 오른쪽)
        graphicSystem.fillLine(p.x, p.y + p.height, p.x2, p.y2 + p.height2, 'purple') // 3번째 선 (대각선 아래 왼쪽)
        graphicSystem.fillLine(p.x + p.width, p.y + p.height, p.x2 + p.width2, p.y2 + p.height2, 'purple') // 4번째 선 (대각선 아래 오른쪽)
      }
    }

    /** 주황색 무기: 적을 추적하는 형태 */
    static WeaponOrange = class extends WeaponData {
      constructor () {
        super()
        this.isLineChase = true
        this.setAutoImageData(imageSrc.round.round3_optionWeapon, imageDataInfo.round3_optionWeapon.orangeShot)
      }
    }

    /** 하늘색 무기: 적에게 닿으면 스플래시 데미지 (자동 추적 기능) */
    static WeaponSkyblue = class WeaponSkyBlue extends WeaponData {
      static hitEffect = new CustomEffect(imageSrc.round.round3_optionWeapon, imageDataInfo.round3_optionWeapon.skyblueSplash, 120, 120, 1)

      constructor () {
        super()
        this.isChaseType = true
        this.setMultiTarget(10) // 다수 타겟 타격 설정 가능 -> 스플래시 데미지
        this.setAutoImageData(imageSrc.round.round3_optionWeapon, imageDataInfo.round3_optionWeapon.skyblueShot)
      }

      processAttack () {
        if (this.enemyHitedCheck()) {
          BaseField.createEffect(WeaponSkyBlue.hitEffect.getObject(), this.x, this.y)
          this.processHitObject({x: this.x - 60, y: this.y - 60, width: 120, height: 120})
          this.isDeleted = true
        }
      }
    }

    /** 초록색 무기: 정해진 방향(앞, 뒤, 혼합)으로만 발사됨 */
    static WeaponGreen = class extends WeaponData {
      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round3_optionWeapon, imageDataInfo.round3_optionWeapon.greenShot)
      }
    }

    /** 검정색 무기: 적에 닿으면 튕겨지고 적을 관통함 */
    static WeaponBalck = class extends WeaponData {
      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round3_optionWeapon, imageDataInfo.round3_optionWeapon.blackShot)
        this.repeatCount = 6 // 한개의 무기가 최대로 공격하는 횟수: 6
        /** 벽 튕기기 횟수 (이 숫자가 0이되면 무기는 사라짐) */ this.reflectCount = 10
        this.setMoveSpeed(5, 5)
      }

      process () {
        super.process()

        if (this.enemyHitedCheck()) {
          this.setMoveSpeed(this.moveSpeedX *= -1, this.moveSpeedY *= -1)
        }

        // 벽 튕기기: 벽은 화면 기준
        if (this.x + this.width < 0) {
          this.moveSpeedX = Math.abs(this.moveSpeedX)
          this.x = 0 - this.width + 1
          this.reflectCount--
        }
        if (this.y + this.height < 0) {
          this.moveSpeedY = Math.abs(this.moveSpeedY)
          this.y = 0 - this.height + 1
          this.reflectCount--
        }
        if (this.x > graphicSystem.CANVAS_WIDTH) {
          this.moveSpeedX = -Math.abs(this.moveSpeedX)
          this.x = graphicSystem.CANVAS_WIDTH - 1
          this.reflectCount--
        }
        if (this.y > graphicSystem.CANVAS_HEIGHT) {
          this.moveSpeedY = -Math.abs(this.moveSpeedY)
          this.y = graphicSystem.CANVAS_HEIGHT - 1
          this.reflectCount--
        }

        if (this.reflectCount <= 0) {
          this.isDeleted = true
        }
      }
    }

    static WeaponPink = class WeaponPink extends WeaponData {
      static hitEffect = new CustomEffect(imageSrc.round.round3_optionWeapon, imageDataInfo.round3_optionWeapon.pinkShot, undefined, undefined, 3)

      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round3_optionWeapon, imageDataInfo.round3_optionWeapon.pinkShot)
        this.repeatCount = 2
        this.effectDelay = new DelayData(5)
        this.attackDelay = new DelayData(10)
        this.setMultiTarget(6)
        this.setMoveSpeed(10, 0)
      }

      /** 적 추적 시작을 위한 함수 (참고: 생성자에서는 현재 좌표값이 0이라 현재위치에서 시작하지 않을 수 있음) */
      setStartChase () {
        let enemy = fieldState.getRandomEnemyObject()
        if (enemy != null) {
          this.setMoveSpeed((enemy.x - this.x) / 50, (enemy.y - this.y) / 50)
        }
      }

      processMove () {
        super.processMove()
        if (this.effectDelay.check()) {
          BaseField.createEffect(WeaponPink.hitEffect, this.x, this.y)
        }
      }

      processAttack () {
        if (this.attackDelay.check(false) && this.enemyHitedCheck()) {
          this.processHitObject()
          this.repeatCount--
          this.attackDelay.count = 0
        }
      }
    }

    static WeaponPurple = class WeaponPurple extends WeaponData {
      static hitEffect = new CustomEffect(imageSrc.round.round3_optionWeapon, imageDataInfo.round3_optionWeapon.purpleShot)

      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round3_optionWeapon, imageDataInfo.round3_optionWeapon.purpleShot)
        this.message = 'purple'
      }

      processMove () {
        // 일정시간 동안 무기가 적을 타겟하지 못하면 삭제함
        if (this.elapsedFrame >= 9) {
          this.isDeleted = true
        }

        let enemy = fieldState.getRandomEnemyObject()
        if (enemy == null) return

        let hitArea = {x: this.x - 300, y: this.y - 300, width: 600, height: 600}
        if (collision(hitArea, enemy)) {
          this.x = enemy.x
          this.y = enemy.y
          this.width = enemy.width
          this.height = enemy.height
          let effect = BaseField.createEffect(WeaponPurple.hitEffect, this.x, this.y)
          if (effect != null) {
            effect.setWidthHeight(enemy.width, enemy.height)
          }
        }
      }

    }

  }
}


/**
 * export 할 라운드 데이터의 변수, tam4변수에 대입하는 용도
 */
export const dataExportRound = new Map()
dataExportRound.set(ID.round.round1_1, Round1_1)
dataExportRound.set(ID.round.round1_2, Round1_2)
dataExportRound.set(ID.round.round1_3, Round1_3)
dataExportRound.set(ID.round.round1_4, Round1_4)
dataExportRound.set(ID.round.round1_5, Round1_5)
dataExportRound.set(ID.round.round1_6, Round1_6)
dataExportRound.set(ID.round.round1_test, Round1_test)
dataExportRound.set(ID.round.round2_1, Round2_1)
dataExportRound.set(ID.round.round2_2, Round2_2)
dataExportRound.set(ID.round.round2_3, Round2_3)
dataExportRound.set(ID.round.round2_4, Round2_4)
dataExportRound.set(ID.round.round2_5, Round2_5)
dataExportRound.set(ID.round.round2_6, Round2_6)
dataExportRound.set(ID.round.round2_test, Round2_test)
dataExportRound.set(ID.round.round3_test, Round3_test)

