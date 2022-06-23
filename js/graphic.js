import { imageFile } from './image.js'
import { systemText } from './text.js'

/*
 * graphic.js
 * HTML의 canvas 태그의 그래픽을 사용하는 코드입니다.
 */

// 정상적으로 이 js파일을 로드한다면 noticeText 를 삭제합니다.
document.getElementById('noticeText').remove()

/**
 * HTML의 canvas의 2d contex를 사용하기 위한 함수.
 * 참고로 직접적인 context를 이용한 접근은 하지 말아주세요.
 * graphicSystem에 있는 함수를 사용하는게 좋습니다. (그래야 유지보수 및 관리가 편합니다.)
 */
export class graphicSystem {
  /** 캔버스 태그 */ static #canvas = document.getElementById('canvas')
  /** 캔버스에서 사용할 2D 그리기 객체 */ static #context = this.#canvas.getContext('2d')

  /** @constant 캔버스의 길이 */
  static CANVAS_WIDTH = this.#canvas.clientWidth

  /** @constant 캔버스의 높이 */
  static CANVAS_HEIGHT = this.#canvas.clientHeight

  /** @constant 캔버스의 길이의 절반, 또는 캔버스 길이의 중간지점 */
  static CANVAS_WIDTH_HALF = Math.floor(this.CANVAS_WIDTH / 2)

  /** @constant 캔버스의 높이의 절반, 또는 캔버스 높이의 중간지점 */
  static CANVAS_HEIGHT_HALF = Math.floor(this.CANVAS_HEIGHT / 2)

  /**
   * 그래픽 시스템 초기 설정 함수
   */
  static init () {
    // 텍스트 베이스라인을 top으로 수정(기본이 alphabet이며 alphabet은 y축 위치가 이상함)
    this.#context.textBaseline = 'top'

    // 캔버스 폰트 출력에 대한 기본값 설정
    this.#context.font = '20px 바탕체'

    // 캔버스의 초기 상태를 저장.
    this.#context.save()
  }

  /** 이미지 뒤집기: 0. 없음, 1. 가로, 2. 세로, 3. 가로 + 세로 */ static flip = 0
  /** 이미지 회전 각도 (0 ~ 360) */ static rotateDegree = 0

  /**
   * 이후 출력되는 모든 이미지를 뒤집습니다.
   * @param {number} flip 0. 없음, 1. 가로 방향, 2. 세로 방향, 3. 가로 + 세로, 그 외 무시
   */
  static setFlip (flip = 0) {
    if (flip >= 0 && flip <= 3) {
      this.flip = flip
    }
  }

  /**
   * 이후 출력되는 모든 이미지를 회전합니다. 중심축은 이미지의 중심입니다. (캔버스의 원점이 아님.)
   * @param {number} degree 각도 범위: 0 ~ 360, 이 수치에서 벗어나면 360으로 나눈 나머지로 계산
   */
  static setRotateDegree (degree = 0) {
    if (degree >= 0 && degree <= 360) {
      this.rotateDegree = degree
    } else {
      this.rotateDegree = degree % 360
    }
  }

  /**
   * 투명도 조절
   * @param {number} value 0 ~ 1 사이의 값 (0: 투명, 1: 불투명), 이 이외는 무시
   */
  static setAlpha (value = 1) {
    if (value >= 0 && value <= 1) {
      this.#context.globalAlpha = value
    }
  }

  /**
   * 여러 옵션들을 한꺼번에 설정합니다.
   * @param {number} flip
   * @param {number} degree
   * @param {number} alpha
   */
  static setOption (flip = 0, degree = 0, alpha = 1) {
    this.setFlip(flip)
    this.setRotateDegree(degree)
    this.setAlpha(alpha)
  }

  /**
   * (flip, rotate가 진행되어서) 변형이 필요한지를 알아봅니다.
   * 이 값이 true라면, displayTransform이 실행됩니다.
   */
  static checkTransform () {
    if (this.flip && this.rotateDegree) {
      return true
    } else {
      return false
    }
  }

  /**
   * 회전 및 전환 설정값에 따라 캔버스를 변형한 후, 그 다음에 출력해야 하는 좌표를 리턴합니다. 출력이 끝난 후에는, restoreTransForm을 사용해주세요.
   * 리턴된 output 좌표 및 크기값을 무시하고 x, y좌표 및 크기를 그대로 사용하게 되면, 예상하지 못한 출력을 할 수 있습니다.
   * 이 함수에서는 설정값을 조절할 수 없습니다. setFlip, setRotate, setAlpha를 사용해주세요.
   */
  static canvasTransform (x, y, width, height) {
    this.#context.save() // 나중에 캔버스의 상태를 복원하기 위해 현재 상태를 저장합니다.

    let outputX = x
    let outputY = y
    let outputWidth = width
    let outputHeight = height

    if (this.rotateDegree) {
      const centerX = x + (width / 2)
      const centerY = y + (height / 2)
      const radian = Math.PI / 180 * this.rotateDegree
      this.#context.translate(centerX, centerY) // 회전할 객체의 중심 위치로 캔버스의 중심 좌표를 변경
      this.#context.rotate(radian) // 라디안 값만큼 회전(참고: 각도 값을 라디안으로 변환해야 함)

      if (this.flip === 1) {
        this.#context.scale(-1, 1) // x축의 크기를 반대로
      } else if (this.flip === 2) {
        this.#context.scale(1, -1) // y축의 크기를 반대로
      } else if (this.flip === 3) {
        this.#context.scale(-1, -1) // x축 y축 다 반대로
      }

      // 회전이 중심축에서 이루어지고, translate로 캔버스의 원점이 객체의 중심으로 이동했기 때문에
      // 그에 맞게 좌표를 수정해야 합니다. 좌표는 (-halfWidth, -halfHeight, width, height) 입니다.
      outputX = -(width / 2)
      outputY = -(height / 2)
      outputWidth = width
      outputHeight = height
    } else {
      if (this.flip === 1) { // flip 값이 vertical일경우
        this.#context.scale(-1, 1) // x축의 크기를 반대로
        outputWidth = -width // x축을 반전시킨탓에, 실제 출력할때도 반대로 값을 넣어서 출력해야합니다. (양수와 음수가 서로 바뀌듯이)
        outputX = -x // 출력 위치도 -x로 변환됩니다.
      } else if (this.flip === 2) { // 이하 방향빼고 나머지 동일
        this.#context.scale(1, -1) // y축의 크기를 반대로
        outputHeight = -height
        outputY = -y
      } else if (this.flip === 3) {
        this.#context.scale(-1, -1) // x축 y축 다 반대로
        outputWidth = -width
        outputX = -x
        outputHeight = -height
        outputY = -y
      }
    }

    return {
      x: outputX,
      y: outputY,
      width: outputWidth,
      height: outputHeight
    }
  }

  /**
   * 캔버스를 변형한 후, 반드시 이 함수를 통해 캔버스의 설정을 복원해주세요. 안그러면 이후에 출력되는 모든 것들도 변형되어 출력됩니다.
   * 이 함수를 실행하면, flip과 rotateDegree의 값은 0으로 변경됩니다. (이후에 실행되는 회전 및 변형을 방지하기 위해서)
   */
  static restoreTransform () {
    this.#context.restore()
    this.flip = 0
    this.rotateDegree = 0
  }

  /**
   * 디지털 글자를 출력하는데 사용 (주로 인터페이스에 사용),
   * 경고: A ~ Z, 0 ~ 9, -, +, ., :, / 문자를 표현 가능. 대/소문자는 상관없지만 가능하면 소문자를 사용해주세요.
   * @param {number | string} inputText 출력할 텍스트
   * @param {number} x x좌표
   * @param {number} y y좌표
   * @param {number} wordWidth 글자길이
   * @param {number} wordHeight 글자높이
   */
  static digitalFontDisplay (inputText, x = 0, y = 0, wordWidth = 20, wordHeight = 30) {
    if (inputText == null) return

    // 원할한 출력을 위해 string 형태로 변경
    if (typeof inputText === 'number') inputText = inputText + ''

    /** @constant 디지털 이미지파일의 기본 글자길이 */
    const DIGITAL_TEXT_WIDTH = 20

    /** @constant 디지털 이미지파일의 기본 글자높이 */
    const DIGITAL_TEXT_HEIGHT = 30

    // 변형이 확인된경우, 캔버스를 변형하고 출력좌표를 변경합니다.
    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, wordWidth, wordHeight)
      x = output.outputX
      y = output.outputY
      wordWidth = output.outputWidth
      wordHeight = output.outputHeight
    }

    // 첫번째 글자부터 마지막글자까지 하나씩 출력합니다.
    for (let i = 0; i < inputText.length; i++) {
      const word = inputText.charAt(i)
      let wordPosition = -1
      let imageTarget = imageFile.system.digitalNumber

      if (word >= '0' && word <= '9') {
        // 0 ~ 9 사이일경우
        wordPosition = Number(word)
        imageTarget = imageFile.system.digitalNumber
      } else if (word >= 'a' && word <= 'z') {
        // alphabet 소문자
        wordPosition = word.charCodeAt() - 'a'.charCodeAt()
        imageTarget = imageFile.system.digitalAlphabet
      } else if (word >= 'A' && word <= 'Z') {
        // alphabet 대문자
        wordPosition = word.charCodeAt() - 'A'.charCodeAt()
        imageTarget = imageFile.system.digitalAlphabet
      } else {
        // 이외 특수기호: -, +, /, ., :
        switch (word) {
          case '/': wordPosition = 10; break
          case '.': wordPosition = 11; break
          case '+': wordPosition = 12; break
          case '-': wordPosition = 13; break
          case ':': wordPosition = 14; break
          default: continue // 참고: 아무런 단어도 해당되지 않으면 루프를 건너뜀
        }
        imageTarget = imageFile.system.digitalNumber
      }

      if (wordPosition >= 0) {
        // 참고사항
        // sliceWidth, sliceHeight는 1씩 빼줍니다. 그 이유는, 확대했을때 블러 처리에 의해 숫자에 선이 그려져 출력되어 그 문제를 해결하기 위해서입니다.
        this.#context.drawImage(
          imageTarget,
          DIGITAL_TEXT_WIDTH * wordPosition,
          0,
          DIGITAL_TEXT_WIDTH - 1,
          DIGITAL_TEXT_HEIGHT - 1,
          x + (i * wordWidth),
          y,
          wordWidth,
          wordHeight
        )
      }
    }

    // 출력이 끝났고, 캔버스가 변형되었다면 변형을 취소합니다.
    if (this.checkTransform()) {
      this.restoreTransform()
    }
  }

  /**
   * 이미지 출력용: 사실 context.drawImage함수랑 동일하지만 가능하다면 imageDisplay 함수를 사용하세요.
   * 이것은 유지보수를 간편하게 하고, 다른 코드로 이식할 때 간편하게 하기 위한 함수입니다.
   * 함수에 표시된 인수 목록은 9개 기준이며 인수가 3개일때(image, x, y) 5개일때(image, x, y, width, height) 입니다.
   * 인수가 10개 ~ 12개 사이일경우, 플립, 회전, 알파값을 추가로 수정할 수 있습니다. 옵션이 설정될경우, 캔버스의 설정값은 무시도비니다.
   * @param {Image} image 이미지(HTML element 또는 new Image()의 이미지 객체)
   * @param {number} sliceX 이미지를 자르기 위한 이미지 내부의 x좌표
   * @param {number} sliceY 이미지를 자르기 위한 이미지 내부의 y좌표
   * @param {number} sliceWidth 이미지를 자르는 길이
   * @param {number} sliceHeight 이미지를 자르는 높이
   * @param {number} x 출력할 x좌표
   * @param {number} y 출력할 y좌표
   * @param {number} width 출력할 길이
   * @param {number} height 출력할 높이
   * @param {number[]} option 추가 옵션: flip(0: none, 1: vertical, 2: horizontal, 3:all), rotate(0 ~ 360), alpha(0 ~ 1)
   */
  static imageDisplay (image, sliceX, sliceY, sliceWidth, sliceHeight, x, y, width, height, ...option) {
    if (image == null) return

    if (arguments.length === 3) {
      if (this.checkTransform()) {
        const output = this.canvasTransform(arguments[1], arguments[2], image.width, image.height)
        this.#context.drawImage(image, Math.floor(output.x), Math.floor(output.y), Math.floor(output.width), Math.floor(output.height))
        this.restoreTransform()
      } else {
        this.#context.drawImage(image, Math.floor(arguments[1]), Math.floor(arguments[2]))
      }
    } else if (arguments.length === 5) {
      if (this.checkTransform()) {
        const output = this.canvasTransform(arguments[1], arguments[2], arguments[3], arguments[4])
        this.#context.drawImage(image, Math.floor(output.x), Math.floor(output.y), Math.floor(output.width), Math.floor(output.height))
        this.restoreTransform()
      } else {
        this.#context.drawImage(image, Math.floor(arguments[1]), Math.floor(arguments[2]), Math.floor(arguments[3]), Math.floor(arguments[4]))
      }
    } else if (arguments.length === 9) {
      if (this.checkTransform()) {
        const output = this.canvasTransform(x, y, width, height)
        this.#context.drawImage(image, Math.floor(sliceX), Math.floor(sliceY), Math.floor(sliceWidth), Math.floor(sliceHeight), Math.floor(output.x), Math.floor(output.y), Math.floor(output.width), Math.floor(output.height))
        this.restoreTransform()
      } else {
        this.#context.drawImage(image, Math.floor(sliceX), Math.floor(sliceY), Math.floor(sliceWidth), Math.floor(sliceHeight), Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height))
      }
    } else if (arguments.length >= 10 && arguments.length <= 12) {
      // 함수의 내용이 길어 따로 분리
      this.#imageExpandDisplay(image, sliceX, sliceY, sliceWidth, sliceHeight, x, y, width, height, ...option)
    } else {
      throw new Error(systemText.graphicError.IMAGE_DISPLAY_ERROR)
    }
  }

  /**
   * 이 함수는 비공개 함수입니다. imageDisplay의 확장 기능을 수행하기 위해 만들어졌습니다. (플립, 회전, 알파값 수정 가능)
   * 참고: scale은 width, height를 수정해서 처리하세요.
   * imageDisplay랑 받는 인수가 같으므로, 가급적이면 imageDisplay의 함수를 사용해주세요.
   */
  static #imageExpandDisplay (image, sliceX, sliceY, sliceWidth, sliceHeight, x, y, width, height, ...option) {
    // 현재 캔버스의 상태를 저장. 이렇게 하는 이유는, 캔버스의 설정을 너무 많이 바꿔 현재 상태를 저장하지 않으면 원래대로 되돌리기 어렵기 때문
    this.#context.save()
    let flip = 0
    let rotate = 0
    let alpha = 1
    let outputX = x
    let outputY = y
    let outputWidth = width
    let outputHeight = height

    // 옵션에 값이 존재하는지를 확인합니다. 아무 값도 없다면 옵션의 길이는 없기 때문
    // 그리고 각 옵션이 정해진 범위를 가지는지를 확인합니다.
    if (option.length >= 1 && option[0] >= 0 && option[0] <= 3) {
      flip = option[0]
    }

    // rotate
    if (option.length >= 2) {
      rotate = option[1]
      if (rotate >= 360 || rotate < -360) {
        rotate = rotate % 360
      }
    }

    // alpha
    if (option.length >= 3 && option[2] >= 0 && option[2] <= 1) {
      alpha = option[2]
    }

    if (rotate !== 0) {
      const centerX = x + (width / 2)
      const centerY = y + (height / 2)
      const radian = Math.PI / 180 * rotate
      this.#context.translate(centerX, centerY) // 회전할 객체의 중심 위치로 캔버스의 중심 좌표를 변경
      this.#context.rotate(radian) // 라디안 값만큼 회전(참고: 각도 값을 라디안으로 변환해야 함)

      if (flip === 1) {
        this.#context.scale(-1, 1) // x축의 크기를 반대로
      } else if (flip === 2) {
        this.#context.scale(1, -1) // y축의 크기를 반대로
      } else if (flip === 3) {
        this.#context.scale(-1, -1) // x축 y축 다 반대로
      }

      // 회전이 중심축에서 이루어지고, translate로 캔버스의 원점이 객체의 중심으로 이동했기 때문에
      // 그에 맞게 좌표를 수정해야 합니다. 좌표는 (-halfWidth, -halfHeight, width, height) 입니다.
      outputX = -(width / 2)
      outputY = -(height / 2)
      outputWidth = width
      outputHeight = height
    } else {
      if (flip === 1) { // flip 값이 vertical일경우
        this.#context.scale(-1, 1) // x축의 크기를 반대로
        outputWidth = -width // x축을 반전시킨탓에, 실제 출력할때도 반대로 값을 넣어서 출력해야합니다. (양수와 음수가 서로 바뀌듯이)
        outputX = -x // 출력 위치도 -x로 변환됩니다.
      } else if (flip === 2) { // 이하 방향빼고 나머지 동일
        this.#context.scale(1, -1) // y축의 크기를 반대로
        outputHeight = -height
        outputY = -y
      } else if (flip === 3) {
        this.#context.scale(-1, -1) // x축 y축 다 반대로
        outputWidth = -width
        outputX = -x
        outputHeight = -height
        outputY = -y
      }
    }

    this.#context.globalAlpha = alpha // 알파값 수정
    this.#context.drawImage(image, Math.floor(sliceX), Math.floor(sliceY), Math.floor(sliceWidth), Math.floor(sliceHeight), Math.floor(outputX), Math.floor(outputY), Math.floor(outputWidth), Math.floor(outputHeight))
    this.#context.restore() // 캔버스를 이전 상태로 복원
  }

  /**
   * 그라디언트를 그리는 함수, 다만 createLinearGradient를 사용하는것과 비교해 옵션이 제한되어있습니다.
   * @param {number} x 그라디언트 시작점의 x좌표
   * @param {number} y 그라디언트 시작점의 y좌표
   * @param {number} width 그라디언트 길이
   * @param {number} height 그라디언트 높이
   * @param {string} startColor 시작 색깔의 css값
   * @param {string} endColor 끝 색깔의 css값
   * @param {anotherColor} anotherColor 또다른 컬러들... (그라디언트를 여러개의 색상으로 만들 때 사용)
   */
  static gradientDisplay (x, y, width, height, startColor, endColor, ...anotherColor) {
    // 그라디언트 backGround
    const gradient = this.#context.createLinearGradient(x, y, x + width, y + height)
    gradient.addColorStop(0, startColor)
    gradient.addColorStop(1, endColor)

    // 또다른 컬러도 있다면 추가
    for (let i = 0; i < anotherColor.length; i++) {
      gradient.addColorStop(i + 2, anotherColor[i])
    }

    // 그라디언트 그리기
    this.#context.fillStyle = gradient
    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, width, height)
      this.#context.fillRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.#context.fillRect(x, y, width, height)
    }
  }

  /**
   * context.fillRect랑 동일, 사각형 그리기
   * @param {number} x 그리는 기준점의 x좌표
   * @param {number} y 그리는 기준점의 y좌표
   * @param {number} width 길이
   * @param {number} height 높이
   * @param {string} color HTML CSS 색깔, 지정하지 않으면 이 함수를 사용하는 시점의 context.fillStyle 값을 사용
   * @param {number} alpha 알파값, 최대 1(불투명), 최소 0(투명), 값이 null이 아닐경우 캔버스의 설정값 우선
   */
  static fillRect (x, y, width, height, color = null, alpha = null) {
    // 색깔이 있는경우
    if (color != null) {
      this.#context.fillStyle = color
    }

    // 알파값이 있는 경우
    const prevAlpha = this.#context.globalAlpha
    if (alpha != null) {
      this.#context.globalAlpha = alpha
    }

    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, width, height)
      this.#context.fillRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.#context.fillRect(x, y, width, height)
    }

    // 알파값을 원래대로 되돌립니다. (일회성 사용)
    // 만약, 알파값을 원래대로 돌리지 않는다면, 다른 함수에서도 해당 alpha값을 참조하게됩니다.
    if (alpha != null) {
      this.#context.globalAlpha = prevAlpha
    }
  }

  /**
   * context.clearRect랑 동일, 사각형으로 지우기
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  static clearRect (x, y, width, height) {
    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, width, height)
      this.#context.clearRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.#context.clearRect(x, y, width, height)
    }
  }

  /**
   * 캔버스 전체를 지웁니다.
   */
  static clearCanvas () {
    if (this.checkTransform()) {
      const output = this.canvasTransform(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
      this.#context.clearRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.#context.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
    }
  }

  /**
   * canvas의 font를 수정합니다.
   * 참고: font의 값은 이런 형태입니다. -> font = '24px 바탕체' -> 24px 바탕체
   * 아무것도 설정하지 않는다면 기본값은 20px 바탕체입니다.
   * @param {string} fontText
   */
  static setCanvasFont (fontText = '20px 바탕체') {
    this.#context.font = fontText
  }

  /**
   * context.fillText랑 동일: 텍스트를 출력합니다.
   * @param {string} text 텍스트
   * @param {number} x 출력할 x좌표
   * @param {number} y 출력할 y좌표
   * @param {string} color 색깔: 없으면 검정색이 기본값
   * @param {number} maxWidth 해당 텍스트 출력의 최대길이(옵션), null일경우 사용하지 않음.
   */
  static fillText (text = '', x, y, color = 'black', maxWidth = null) {
    this.#context.fillStyle = color

    if (this.checkTransform()) {
      const textWidth = this.#context.measureText(text)
      const output = this.canvasTransform(x, y, textWidth, parseInt(this.#context.font))
      if (maxWidth != null) {
        this.#context.fillText(text, output.x, output.y, maxWidth)
      } else {
        this.#context.fillText(text, output.x, output.y)
      }
      this.restoreTransform()
    } else {
      if (maxWidth != null) {
        this.#context.fillText(text, x, y, maxWidth)
      } else {
        this.#context.fillText(text, x, y)
      }
    }
  }

  /**
   * context.strokeRect랑 동일: 사각형으로 선을 그립니다.
   * @param {number} x 출력할 x좌표
   * @param {number} y 출력할 y좌표
   * @param {number} width 길이
   * @param {number} height 높이
   * @param {string} color 색깔: 없으면 검정색이 기본값
   */
  static strokeRect (x, y, width, height, color = 'black') {
    this.#context.strokeStyle = color
    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, width, height)
      this.#context.strokeRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.#context.strokeRect(x, y, width, height)
    }
  }

  /**
   * 선을 그립니다. (안타깝게도... 곡선은 내가 어떻게 그리는지 모름...)
   * 선은 캔버스의 변형에 영향을 받지 않습니다.
   * @param {number} x1 첫번째 지점의 x좌표
   * @param {number} y1 첫번째 지점의 y좌표
   * @param {number} x2 두번째 지점의 x좌표
   * @param {number} y2 두번째 지점의 y좌표
   * @param {string} color 선의 색깔, 기본값 black(검정)
   */
  static fillLine (x1, y1, x2, y2, color = 'black') {
    this.#context.strokeStyle = color
    this.#context.beginPath()
    this.#context.lineWidth = 2
    this.#context.moveTo(x1, y1)
    this.#context.lineTo(x2, y2)
    this.#context.stroke()
  }
}
graphicSystem.init()
