import { imageFile } from "./image.js"
import { systemText } from "./text.js"

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
  /** 캔버스 태그 */ static canvas = document.getElementById('canvas')
  /** 캔버스에서 사용할 2D 그리기 객체 */ static context = canvas.getContext('2d')

  /** @constant 캔버스의 길이 */ 
  static CANVAS_WIDTH = canvas.clientWidth

  /** @constant 캔버스의 높이 */ 
  static CANVAS_HEIGHT = canvas.clientHeight

  /** @constant 캔버스의 길이의 절반, 또는 캔버스 길이의 중간지점 */ 
  static CANVAS_WIDTH_HALF = Math.floor(this.CANVAS_WIDTH / 2)

  /** @constant 캔버스의 높이의 절반, 또는 캔버스 높이의 중간지점 */ 
  static CANVAS_HEIGHT_HALF = Math.floor(this.CANVAS_HEIGHT / 2)

  /**
   * 그래픽 시스템 초기 설정 함수
   */
   static init () {
    // 텍스트 베이스라인을 top으로 수정(기본이 alphabet이며 alphabet은 y축 위치가 이상함)
    this.context.textBaseline = 'top'

    // 캔버스 폰트 출력에 대한 기본값 설정
    this.context.font = '20px 바탕체'
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
    // null 또는 비어있는 값 넣지 마라
    if (!inputText) return

    // 원할한 출력을 위해 string 형태로 변경
    if (typeof inputText === 'number') inputText = inputText + ''
    
    /** @constant 디지털 이미지파일의 기본 글자길이 */
    const DIGITAL_TEXT_WIDTH = 20 

    /** @constant 디지털 이미지파일의 기본 글자높이 */
    const DIGITAL_TEXT_HEIGHT = 30

    // 첫번째 글자부터 마지막글자까지 하나씩 출력합니다.
    for (let i = 0; i < inputText.length; i++) {
      let word = inputText.charAt(i)
      let wordPosition = -1
      let imageTarget = imageFile.digitalNumber

      if (word >= '0' && word <= '9') {
        // 0 ~ 9 사이일경우
        wordPosition = Number(word)
        imageTarget = imageFile.digitalNumber
      } else if (word >= 'a' && word <= 'z') {
        // alphabet 소문자
        wordPosition = word.charCodeAt() - 'a'.charCodeAt()
        imageTarget = imageFile.digitalAlphabet
      } else if (word >= 'A' && word <= 'Z') {
        // alphabet 대문자
        wordPosition = word.charCodeAt() - 'A'.charCodeAt()
        imageTarget = imageFile.digitalAlphabet
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
        imageTarget = imageFile.digitalNumber
      }

      if (wordPosition >= 0) {
        // 참고사항
        // sliceWidth, sliceHeight는 1씩 빼줍니다. 그 이유는, 확대했을때 블러 처리에 의해 숫자에 선이 그려져 출력되어 그 문제를 해결하기 위해서입니다.
        this.context.drawImage(
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
  }
  
  /**
   * 이미지 출력용: 사실 context.drawImage함수랑 동일하지만 가능하다면 imageDisplay 함수를 사용하세요.
   * 이것은 유지보수를 간편하게 하고, 다른 코드로 이식할 때 간편하게 하기 위한 함수입니다.  
   * 함수에 표시된 인수 목록은 9개 기준이며 인수가 3개일때(image, x, y) 5개일때(image, x, y, width, height) 입니다.
   * @param {Image} image 이미지(HTML element 또는 new Image()의 이미지 객체)
   * @param {number} sliceX 이미지를 자르기 위한 이미지 내부의 x좌표
   * @param {number} sliceY 이미지를 자르기 위한 이미지 내부의 y좌표
   * @param {number} sliceWidth 이미지를 자르는 길이
   * @param {number} sliceHeight 이미지를 자르는 높이
   * @param {number} x 출력할 x좌표
   * @param {number} y 출력할 y좌표
   * @param {number} width 출력할 길이
   * @param {number} height 출력할 높이
   */
  static imageDisplay (image, sliceX, sliceY, sliceWidth, sliceHeight, x, y, width, height) {
    if (arguments.length === 3) {

      this.context.drawImage(image, Math.floor(arguments[1]), Math.floor(arguments[2]))
    } else if (arguments.length === 5) {
      this.context.drawImage(image, Math.floor(arguments[1]), Math.floor(arguments[2]), Math.floor(arguments[3]), Math.floor(arguments[4]))
    } else if (arguments.length === 9) {
      this.context.drawImage(image, Math.floor(sliceX), Math.floor(sliceY), Math.floor(sliceWidth), Math.floor(sliceHeight), Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height))
    } else {
      throw new Error(systemText.graphicError.IMAGE_DISPLAY_ERROR)
    }
  }
  
  /**
   * 그라디언트를 그리는 함수, 다만 createLinearGradient를 사용하는것과 비교해 옵션이 제한되어있습니다.
   * @param {number} x 그라디언트 시작점의 x좌표
   * @param {number} y 그라디언트 시작점의 y좌표
   * @param {number} width 그라디언트 길이
   * @param {number} height 그라디언트 높이
   * @param {string} startColor 시작 색깔의 css값
   * @param {string} endColor 끝 색깔의 css값
   */
  static gradientDisplay (x, y, width, height, startColor, endColor) {
    // 그라디언트 backGround
    const gradient = this.context.createLinearGradient(x, y, x + width, y + height)
    gradient.addColorStop(0, startColor)
    gradient.addColorStop(1, endColor)
  
    // 그라디언트 그리기
    this.context.fillStyle = gradient
    this.context.fillRect(x, y, width, height)
  }
  
  /**
   * context.fillRect랑 동일, 사각형 그리기
   * @param {number} x 그리는 기준점의 x좌표
   * @param {number} y 그리는 기준점의 y좌표
   * @param {number} width 길이
   * @param {number} height 높이
   * @param {string} color HTML CSS 색깔, 지정하지 않으면 이 함수를 사용하는 시점의 context.fillStyle 값을 사용
   * @param {number} alpha 알파값, 최대 1(불투명), 최소 0(투명)
   */
  static fillRect (x, y, width, height, color = null, alpha = null) {
    // 색깔이 있는경우
    if (color != null) {
      this.context.fillStyle = color
    }
  
    // 알파값이 있는 경우
    if (alpha != null) {
      this.context.globalAlpha = alpha
    }
    
    this.context.fillRect(x, y, width, height)
  
    // 알파값을 원래대로 되돌립니다. (일회성 사용)
    // 만약, 알파값을 원래대로 돌리지 않는다면, 다른 함수에서도 해당 alpha값을 참조하게됩니다.
    if (alpha != null) {
      this.context.globalAlpha = 1
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
    this.context.clearRect(x, y, width, height)
  }

  /**
   * 캔버스 전체를 지웁니다.
   */
  static clearCanvas () {
    this.context.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
  }
  
  /**
   * canvas의 font를 수정합니다.  
   * 참고: font의 값은 이런 형태입니다. -> font = '24px 바탕체' -> 24px 바탕체  
   * 아무것도 설정하지 않는다면 기본값은 20px 바탕체입니다.
   * @param {string} fontText 
   */
  static setCanvasFont (fontText = '20px 바탕체') {
    this.context.font = fontText
  }
  
  /**
   * context.fillText랑 동일: 텍스트를 출력합니다.
   * @param {string} text 텍스트
   * @param {number} x 출력할 x좌표
   * @param {number} y 출력할 y좌표
   * @param {string} color 색깔: 없으면 검정색이 기본값
   * @param {number} maxWidth 해당 텍스트 출력의 최대길이(옵션), null일경우 사용하지 않음.
   */
  static fillText (text, x, y, color = 'black', maxWidth = null) {
    this.context.fillStyle = color
    if (maxWidth != null) {
      this.context.fillText(text, x, y, maxWidth)
    } else {
      this.context.fillText(text, x, y)
    }
  }
  
  /**
   * context.strokeRect랑 동일: 외각선을 그립니다.
   * @param {number} x 출력할 x좌표
   * @param {number} y 출력할 y좌표
   * @param {number} width 길이
   * @param {number} height 높이
   * @param {string} color 색깔: 없으면 검정색이 기본값
   */
  static strokeRect (x, y, width, height, color = 'black') {
    this.context.strokeStyle = color
    this.context.strokeRect(x, y, width, height)
  }
  
  /**
   * 선을 그립니다. (안타깝게도... 곡선은 내가 어떻게 그리는지 모름...)
   * @param {number} x1 첫번째 지점의 x좌표
   * @param {number} y1 첫번째 지점의 y좌표
   * @param {number} x2 두번째 지점의 x좌표
   * @param {number} y2 두번째 지점의 y좌표
   * @param {string} color 선의 색깔, 기본값 black(검정)
   */
  static fillLine (x1, y1, x2, y2, color = 'black') {
    this.context.strokeStyle = color
    this.context.beginPath()
    this.context.lineWidth = 2
    this.context.moveTo(x1, y1)
    this.context.lineTo(x2, y2)
    this.context.stroke()
  }

  /**
   * 투명도 조절
   * @param {number} value 0 ~ 1 사이의 값 (0: 투명, 1: 불투명)
   */
  static setAlpha (value) {
    if (value >= 0 && value <= 1) {
      this.context.globalAlpha = value
    }
  }

}
graphicSystem.init()