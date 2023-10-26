//@ts-check

/**
 * HTML의 canvas의 2d contex를 사용하기 위한 함수.
 * 
 * 참고로 클래스 내부에 있는 context를 이용한 접근은 하지 말아주세요.
 * graphicSystem에 있는 함수를 사용하는게 좋습니다. (그래야 유지보수 및 관리가 편합니다.)
 */
export class GraphicSystem {
  /** 그래픽 시스템에서 사용하는 폰트의 기본값 */
  static DEFAULT_FONT = '20px arial'

  /**
   * 그래픽을 출력할 수 있는 캔버스를 만듭니다.
   * 
   * 캔버스를 만든 후에는 graphicSystem이 가지고 있는 함수들을 이용하여 그래픽을 출력할 수 있습니다.
   * 
   * 주의: 이 캔버스는 아직 브라우저에 출력되지 않습니다. 만약 브라우저에 출력하는것을 원한다면
   * document.body.appendChild 함수를 사용해서, this.canvas를 직접 추가해주세요.
   * 쉽게말해서, 브라우저에 아무 영역에다가 canvas를 집어넣어야 합니다.
   * 
   * @param {number} canvasWidth 캔버스 너비
   * @param {number} canvasHeight 캔버스 높이
   * @param {string} resourceSrc 탐사엔진이 있는 외부 리소스의 경로 HTML 파일에 따라 상대경로가 변경되므로, 
   * 이 값을 제대로 입력해야 내장 이미지를 제대로 출력할 수 있습니다.
   */
  constructor (canvasWidth = 400, canvasHeight = 300, resourceSrc = '') {
    /** 
     * 이미지 캐시 저장 용도 (src로 이미지를 출력할 때 여기서 가져옵니다.)
     * @type {Map<string, HTMLImageElement>}
     */
    this.cacheImage = new Map()

    /** 캔버스 (캔버스 엘리먼트) */ this.canvas = document.createElement('canvas')
    this.canvas.width = canvasWidth
    this.canvas.height = canvasHeight
    
    /** @constant 캔버스의 너비 */ this.CANVAS_WIDTH = canvasWidth
    /** @constant 캔버스의 높이 */ this.CANVAS_HEIGHT = canvasHeight

    /** @constant 캔버스의 길이의 절반, 또는 캔버스 길이의 중간지점 (정수로 취급) */
    this.CANVAS_WIDTH_HALF = Math.floor(this.CANVAS_WIDTH / 2)

    /** @constant 캔버스의 높이의 절반, 또는 캔버스 높이의 중간지점 (정수로 취급) */
    this.CANVAS_HEIGHT_HALF = Math.floor(this.CANVAS_HEIGHT / 2)

    /** 
     * 캔버스의 2d 그래픽 콘텍스트
     */
    this.context = this.canvas.getContext('2d')
    if (this.context == null) {
      console.warn('잘못된 콘텍스트 형식')
      return
    }

    // 그래픽 초기화
    // 텍스트 베이스라인을 top으로 수정(기본이 alphabet이며 alphabet은 y축 위치가 이상함)
    this.context.textBaseline = 'top'

    // 캔버스 폰트 출력에 대한 기본값 설정 (다만 폰트가 없을경우, 다른 폰트가 사용될 수 있음.)
    // 이 폰트는 윈도우만 가지고 있음.
    // 폰트의 pixel은 20px로 정의됩니다.
    this.context.font = GraphicSystem.DEFAULT_FONT

    /** 폰트의 기본 사이즈 (이 값을 변경하지 마세요.)
     * 이 값은 현재는 사용하지 않습니다.
     * 
     * @type {number}
     * @deprecated
     */
    this.FONT_SIZE = 20

    // 캔버스의 초기 상태를 저장.
    this.context.save()

    /** 
     * 이미지 뒤집기: 0. 없음, 1. 가로, 2. 세로, 3. 가로 + 세로, 그 외의 숫자는 무시
     * 
     * 캔버스에 전역적 적용. 다만 일부 함수는 이 값을 직접 지정할 수 있어서 캔버스의 수정은 비추천
     */ 
    this.flip = 0

    /** 
     * 이미지 회전 각도 (0 ~ 360)
     * 
     * 캔버스에 전역적 젹용, 다만 일부 함수는 이 값을 직접 지정할 수 있어서 캔버스의 수정은 비추천
     */ 
    this.rotateDegree = 0

    this.baseImageAutoSet(resourceSrc)
  }

  /** 
   * 특정 이미지 경로에 있는 이미지 객체를 생성합니다. 
   * 
   * 만약 이 함수로 미리 생성하지 않고, 이미지를 불러오게 되면, 임의로 해당 경로를 기준으로 이미지 객체를 추가하게 됩니다.
   * 
   * @param {string} imageSrc 이미지 파일의 경로
   */
  createImage (imageSrc) {
    if (this.cacheImage.has(imageSrc)) return
    
    let image = new Image()
    image.src = imageSrc
    this.cacheImage.set(imageSrc, image)
  }

  /** 
   * 특정 이미지 경로에 있는 이미지 객체를 가져옵니다.
   * 
   * 없을 경우 가져오지 않음.
   * @param {string} imageSrc 이미지 파일의 경로
   * @returns {HTMLImageElement | undefined}
   */
  getImage (imageSrc) {
    return this.cacheImage.get(imageSrc)
  }

  /** 
   * 캐시된 이미지 객체를 가져옵니다.
   * 
   * 만약 이미지가 캐시되지 않은 경우, 해당 이미지를 새로 캐시에 등록합니다.
   * 
   * (이것은 graphicSystem 전용 함수이지만, 일단 public 함수로 정의함.)
   * @param {string} imageSrc 이미지 파일의 경로
   */
  getCacheImage (imageSrc) {
    if (!imageSrc) return

    if (this.cacheImage.has(imageSrc)) {
      return this.cacheImage.get(imageSrc)
    } else {
      let image = new Image()
      image.src = imageSrc
      this.cacheImage.set(imageSrc, image)

      return this.cacheImage.get(imageSrc)
    }
  }

  /** 
   * 이미지가 완전히 로드되었는지를 확인합니다.
   * 로드가 완료된 총 개수를 리턴합니다.
   * 
   * @param {string[]} [src=[]] 이미지의 경로
   */
  getImageCompleteCount (src = []) {
    let totalCount = 0
    for (let i = 0; i < src.length; i++) {
      let image = this.getCacheImage(src[i])
      if (image.complete) {
        totalCount++
      }
    }

    return totalCount
  }

  /**
   * 그래픽 시스템에서 static 변수에 사용되는 이미지를 지정하기 위한 함수 (tamsaEngine 전용)
   * 
   * 이 함수는 이 js파일을 불러오는 즉시 실행됩니다.
   * 
   * 경고: 이 함수가 초기에 실행되지 않으면 bitmapFont는 그려지지 않습니다. (이미지가 없으므로)
   * 
   * @param {string} resourceSrc 리소스의 기준 경로 (HTML 파일에 따라 달라지므로 지정 필요)
   */
  baseImageAutoSet (resourceSrc) {
    /** graphicSystem 내부적으로 사용하는 비트맵 (영어, 숫자, 일부 기호만 지원) */
    this.bitmapFont = {
      image: new Image(),
      baseWidth: 8,
      baseHeight: 11
    }
    this.bitmapFont.image.src = resourceSrc + 'bitmapFont.png'
  }

  /**
   * 시스템에서 사용하는 에러메세지입니다.
   */
  static errorMessage = {
    IMAGE_DISPLAY_ARGUMENT_ERROR: 
`imageDisplay의 함수는 필요한 인자 개수가 3, 5, 9, 10~12개입니다.
imageDisplay function need to arguments only 3, 5, 9, 10 ~ 12.`
  }

  /**
   * 이후 출력되는 모든 이미지를 뒤집습니다. (캔버스 전역적으로 적용)
   * 
   * 매개변수가 없으면 기본값 설정
   * @param {number} flip 0. 없음, 1. 가로 방향, 2. 세로 방향, 3. 가로 + 세로, 그 외 무시
   */
  setFlip (flip = 0) {
    if (flip >= 0 && flip <= 3) {
      this.flip = flip
    }
  }

  /**
   * 이후 출력되는 모든 이미지를 회전합니다. 중심축은 이미지의 중심입니다. (캔버스의 원점이 아님.) (캔버스 전역적으로 적용)
   * 
   * 매개변수가 없으면 기본값 설정
   * @param {number} degree 각도 범위: 0 ~ 360, 이 수치에서 벗어나면 360으로 나눈 나머지로 계산
   */
  setDegree (degree = 0) {
    if (degree >= 0 && degree <= 360) {
      this.rotateDegree = degree
    } else {
      this.rotateDegree = degree % 360
    }
  }

  /**
   * 투명도 조절 (캔버스 전역적으로 적용)
   * 다른 변수들과 달리, 이 값은 context의 globalAlpha값을 직접 변경합니다.
   * 매개변수가 없으면 기본값 설정 (기본값은 1)
   * 
   * @param {number} value 0 ~ 1 사이의 값 (0: 투명, 1: 불투명), 이 이외는 무시
   */
  setAlpha (value = 1) {
    if (this.context != null && value >= 0 && value <= 1) {
      this.context.globalAlpha = value
    }
  }

  /**
   * Flip(뒤집기), Degree(각도), alpha(투명도) 를 한번에 설정하는 함수입니다.
   * 각 값들의 자세한 사항은 개별 조정 함수 (setFlip등등...) 을 살펴보세요.
   * 
   * 아무것도 입력하지 않으면 기본 설정이 적용됩니다.
   * @param {number} flip 
   * @param {number} degree 
   * @param {number} alpha 
   */
  setFlipDegreeAlpha (flip = 0, degree = 0, alpha = 1) {
    this.setFlip(flip)
    this.setDegree(degree)
    this.setAlpha(alpha)
  }

  /**
   * 여러 옵션들을 한꺼번에 설정합니다.
   * 
   * 이 함수의 사용을 권장하지 않습니다. 이것의 역할이 불분명하기 때문입니다.
   * 아니면 setFlipDegreeAlpha 함수를 대신 사용해주세요.
   * 
   * @param {number} flip
   * @param {number} degree
   * @param {number} alpha
   * @deprecated
   */
  setOption (flip = 0, degree = 0, alpha = 1) {
    this.setFlip(flip)
    this.setDegree(degree)
    this.setAlpha(alpha)
  }

  /**
   * (flip, rotate 가 진행되어서) 캔버스의 변형이 필요한지를 알아봅니다.
   * 이 값이 true라면, displayTransform이 실행됩니다.
   */
  checkTransform () {
    if (this.flip || this.rotateDegree) {
      return true
    } else {
      return false
    }
  }

  /**
   * 회전 및 전환 설정값에 따라 캔버스를 변형한 후, 그 다음에 출력해야 하는 좌표를 리턴합니다.
   * 출력이 끝난 후에는, restoreTransForm을 사용해주세요.
   * 
   * 리턴된 output 좌표 및 크기값을 무시하고 x, y좌표 및 크기를 그대로 사용하게 되면, 예상하지 못한 출력을 할 수 있습니다.
   * 
   * 이 함수에서는 캔버스 변형 설정값을 조절할 수 없습니다. 해당 값을 변경하려면 setFlip, setRotate, setAlpha를 사용해주세요.
   * 
   * graphicSystem 내부에서 사용하는 함수이므로, 직접적으로 이 함수를 호출하면 안됩니다.
   * @param {number} x
   * @param {number} y 
   * @param {number} width
   * @param {number} height
   */
  canvasTransform (x, y, width, height) {
    this.context.save() // 나중에 캔버스의 상태를 복원하기 위해 현재 상태를 저장합니다.

    let outputX = x
    let outputY = y
    let outputWidth = width
    let outputHeight = height

    if (this.rotateDegree) {
      const centerX = x + (width / 2)
      const centerY = y + (height / 2)
      const radian = Math.PI / 180 * this.rotateDegree
      this.context.translate(centerX, centerY) // 회전할 객체의 중심 위치로 캔버스의 중심 좌표를 변경
      this.context.rotate(radian) // 라디안 값만큼 회전(참고: 각도 값을 라디안으로 변환해야 함)

      if (this.flip === 1) {
        this.context.scale(-1, 1) // x축의 크기를 반대로
      } else if (this.flip === 2) {
        this.context.scale(1, -1) // y축의 크기를 반대로
      } else if (this.flip === 3) {
        this.context.scale(-1, -1) // x축 y축 다 반대로
      }

      // 회전이 중심축에서 이루어지고, translate로 캔버스의 원점이 객체의 중심으로 이동했기 때문에
      // 그에 맞게 좌표를 수정해야 합니다. 좌표는 (-halfWidth, -halfHeight, width, height) 입니다.
      outputX = -(width / 2)
      outputY = -(height / 2)
      outputWidth = width
      outputHeight = height
    } else {
      if (this.flip === 1) { // flip 값이 vertical일경우
        this.context.scale(-1, 1) // x축의 크기를 반대로
        outputWidth = -width // x축을 반전시킨탓에, 실제 출력할때도 반대로 값을 넣어서 출력해야합니다. (양수와 음수가 서로 바뀌듯이)
        outputX = -x // 출력 위치도 -x로 변환됩니다.
      } else if (this.flip === 2) { // 이하 방향빼고 나머지 동일
        this.context.scale(1, -1) // y축의 크기를 반대로
        outputHeight = -height
        outputY = -y
      } else if (this.flip === 3) {
        this.context.scale(-1, -1) // x축 y축 다 반대로
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
   * 
   * 이 함수를 실행하면, flip과 rotateDegree의 값은 0으로 변경됩니다. (이후에 실행되는 회전 및 변형을 방지하기 위해서)
   */
  restoreTransform () {
    if (this.context == null) return

    this.context.restore()
    this.setFlipDegreeAlpha()
  }

  /**
   * 내장되어있는 비트맵 font (bitmapFont.png) 파일을 이용해서 글자를 출력합니다.
   * 
   * 아스키 코드만 지원(한글 사용불가능), 대소문자는 구분됩니다.
   * @param {number | string} inputText 출력할 텍스트
   * @param {number} x x좌표
   * @param {number} y y좌표
   * @param {number} wordWidth 글자길이 (기본값 8px, 권장값 16px), 8의 배수로 확대 권장
   * @param {number} wordHeight 글자높이 (기본값 11px, 권장값 22px), 11의 배수로 확대 권장
   */
  bitmapFontDisplay (inputText, x = 0, y = 0, wordWidth = this.bitmapFont.baseWidth, wordHeight = this.bitmapFont.baseHeight) {
    if (inputText == null) return

    // 숫자가 들어올경우, string 형태로 변경 (그래야 조작하기 쉬움)
    if (typeof inputText === 'number') inputText = inputText + ''

    const image = this.bitmapFont.image
    const BITMAP_WIDTH = this.bitmapFont.baseWidth
    const BITMAP_HEIGHT = this.bitmapFont.baseHeight

    // 변형이 확인된경우, 캔버스를 변형하고 출력좌표를 변경합니다.
    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, wordWidth, wordHeight)
      x = output.x
      y = output.y
      wordWidth = output.width
      wordHeight = output.height
    }

    const firstWordPosition = ' '.charCodeAt()
    const lineMaxXPostition = Math.floor(image.width / this.bitmapFont.baseWidth)  // 비트맵에는 한줄당 최대 32개 글자 데이터가 있습니다.

    // 첫번째 글자부터 마지막글자까지 하나씩 출력합니다.
    for (let i = 0; i < inputText.length; i++) {
      const word = inputText.charAt(i)
      let wordPosition = -1 // 0 ~ 32
      let wordLine = 0 // 0 ~ 3

      wordPosition = word.charCodeAt(0) - firstWordPosition

      // 워드포지션이 32를 넘어가면, 다른 줄로 변경해서 출력할 글자를 찾습니다.
      if (wordPosition >= lineMaxXPostition) {
        wordLine = Math.floor(wordPosition / lineMaxXPostition)
        wordPosition = wordPosition % 32
      }

      if (wordPosition >= 0) {
        this.context.drawImage(
          image, 
          BITMAP_WIDTH * wordPosition, 
          BITMAP_HEIGHT * wordLine, 
          BITMAP_WIDTH - 1, // 1을 빼는 이유는 확대/축소 했을 때 안티에일러싱 효과로 인해 잘못된 선이 출력되는걸 막기 위함
          BITMAP_HEIGHT - 1, 
          x + (i * wordWidth), 
          y, 
          wordWidth - Math.floor(wordWidth / BITMAP_WIDTH), // 일부 길이 값을 빼는것은 확대/축소 했을 때 정확한 출력을 보정하기 위함
          wordHeight - Math.floor(wordWidth / BITMAP_HEIGHT)
        )
      }
    }

    // 출력이 끝났고, 캔버스가 변형되었다면 변형을 취소합니다.
    if (this.checkTransform()) {
      this.restoreTransform()
    }
  }

  /** 
   * 아스키 코드를 기반으로 한 비트맵 폰트를 출력합니다.
   * 여기서 얻어온 객체를 이용해 bitmapDisplay를 쓰는것과 동일한 느낌으로 사용할 수 있습니다.
   * 
   * 주의: 아스키 코드의 위치를 기반으로 가로 세로를 계산합니다.
   * 
   * 따라서, 숫자만 사용할거면, CustomNumber를, 문자까지 추가하려면 이 함수를 사용하세요.
   * 
   * @param {string} imageSrc 이미지 파일의 경로
   * @param {number} baseWordWidth 이미지의 가로너비
   * @param {number} baseWordHeight 이미지의 세로높이
   * @returns bitmapDisplay를 해줄 수 있는 함수(전용 함수 리턴)
   */
  createCustomBitmapDisplay (imageSrc, baseWordWidth, baseWordHeight) {
    /**
     * 아스키 코드를 기반으로 한 비트맵 폰트를 출력합니다.
     * 아스키 코드만 지원(한글 사용불가능), 대소문자는 구분됩니다.
     * 
     * 경고2: 크기를 늘릴 경우, 안티에일리싱 효과로 글자주위에 선이 칠해지는 경우가 있음.
     * 
     * (bitmapDisplay 함수를 상속받았다 카더라)
     * @param {number | string} inputText 출력할 텍스트
     * @param {number} x x좌표
     * @param {number} y y좌표
     * @param {number} wordWidth 글자길이
     * @param {number} wordHeight 글자높이
     */
    return (inputText, x, y, wordWidth = baseWordWidth, wordHeight = baseWordHeight) => {
      if (inputText == null) return

      // 숫자가 들어올경우, string 형태로 변경 (그래야 조작하기 쉬움)
      if (typeof inputText === 'number') inputText = inputText + ''
  
      const image = this.getCacheImage(imageSrc)
      if (image == null) return

      const BITMAP_WIDTH = baseWordWidth
      const BITMAP_HEIGHT = baseWordHeight
  
      // 변형이 확인된경우, 캔버스를 변형하고 출력좌표를 변경합니다.
      if (this.checkTransform()) {
        const output = this.canvasTransform(x, y, wordWidth, wordHeight)
        x = output.x
        y = output.y
        wordWidth = output.width
        wordHeight = output.height
      }
  
      const firstWordPosition = ' '.charCodeAt()
      const lineMaxXPostition = Math.floor(image.width / baseWordWidth) // 비트맵에는 한줄당 최대 32개 글자 데이터가 있습니다.
  
      // 첫번째 글자부터 마지막글자까지 하나씩 출력합니다.
      for (let i = 0; i < inputText.length; i++) {
        const word = inputText.charAt(i)
        let wordPosition = -1 // 0 ~ 32
        let wordLine = 0 // 0 ~ 3
  
        wordPosition = word.charCodeAt(0) - firstWordPosition
  
        // 워드포지션이 32를 넘어가면, 다른 줄로 변경해서 출력할 글자를 찾습니다.
        if (wordPosition >= lineMaxXPostition) {
          wordLine = Math.floor(wordPosition / lineMaxXPostition)
          wordPosition = wordPosition % 32
        }
  
        if (wordPosition >= 0) {
          this.context.drawImage(
            image, 
            BITMAP_WIDTH * wordPosition, 
            BITMAP_HEIGHT * wordLine, 
            BITMAP_WIDTH - 1, // 1을 빼는 이유는 확대/축소 했을 때 안티에일러싱 효과로 인해 잘못된 선이 출력되는걸 막기 위함
            BITMAP_HEIGHT - 1, 
            x + (i * wordWidth), 
            y, 
            wordWidth - Math.floor(wordWidth / BITMAP_WIDTH), // 일부 길이 값을 빼는것은 확대/축소 했을 때 정확한 출력을 보정하기 위함
            wordHeight - Math.floor(wordWidth / BITMAP_HEIGHT)
          )
        }
      }
  
      // 출력이 끝났고, 캔버스가 변형되었다면 변형을 취소합니다.
      if (this.checkTransform()) {
        this.restoreTransform()
      }
    }
  }

  /**
   * 이미지로 된 숫자를 출력할 수 있게 해주는 함수입니다.
   * 
   * 이 함수를 이용하여 이미지를 출력해주는 함수를 리턴받을 수 있습니다.
   * 
   * 참고: 이미지의 글자 순서는 0123456789 입니다.
   * @param {string} imageSrc 이미지 파일의 경로
   * @param {number} baseWordWidth 이미지의 가로너비
   * @param {number} baseWordHeight 이미지의 세로높이
   * @returns numberDisplay를 해줄 수 있는 함수(전용 함수 리턴)
   */
  createCustomNumberDisplay (imageSrc, baseWordWidth, baseWordHeight) {
    /**
     * 이미지로 된 숫자를 출력하는 함수
     * 
     * (bitmapDisplay 함수를 상속받았다 카더라)
     * @param {number | string} inputNumber 출력할 숫자
     * @param {number} x x좌표
     * @param {number} y y좌표
     * @param {number} wordWidth 글자길이
     * @param {number} wordHeight 글자높이
     */
    return (inputNumber, x, y, wordWidth = baseWordWidth, wordHeight = baseWordHeight) => {
      if (inputNumber == null) return

      // 숫자가 들어올경우, string 형태로 변경 (그래야 조작하기 쉬움)
      if (typeof inputNumber === 'number') inputNumber = inputNumber + ''
  
      const image = this.getCacheImage(imageSrc)
      if (image == null) return

      const BITMAP_WIDTH = baseWordWidth
      const BITMAP_HEIGHT = baseWordHeight
  
      // 변형이 확인된경우, 캔버스를 변형하고 출력좌표를 변경합니다.
      if (this.checkTransform()) {
        const output = this.canvasTransform(x, y, wordWidth, wordHeight)
        x = output.x
        y = output.y
        wordWidth = output.width
        wordHeight = output.height
      }
  
      // 첫번째 글자부터 마지막글자까지 하나씩 출력합니다.
      for (let i = 0; i < inputNumber.length; i++) {
        const word = Number(inputNumber.charAt(i))
        this.context.drawImage(
          image,
          BITMAP_WIDTH * word, 
          0, 
          BITMAP_WIDTH - 1, // 1을 빼는 이유는 확대/축소 했을 때 안티에일러싱 효과로 인해 잘못된 선이 출력되는걸 막기 위함 (보류됨)
          BITMAP_HEIGHT, // - 1, 
          x + (i * wordWidth), 
          y, 
          wordWidth - Math.floor(wordWidth / BITMAP_WIDTH), // 일부 길이 값을 빼는것은 확대/축소 했을 때 정확한 출력을 보정하기 위함
          wordHeight - Math.floor(wordWidth / BITMAP_HEIGHT)
        )
      }
  
      // 출력이 끝났고, 캔버스가 변형되었다면 변형을 취소합니다.
      if (this.checkTransform()) {
        this.restoreTransform()
      }
    }

  }

  /**
   * 이미지 출력 (imageDisplay보다 더 단순한 구성입니다.)
   * 
   * 만약 이미지의 일부를 잘라서 스프라이트처럼 사용하려면 imageDisplay 함수를 사용해주세요.
   * 
   * 자바스크립트는 오버로딩이 되지 않기 때문에, 9 ~ 12개의 인수를 기준으로 한 imageDisplay를 구분하기 위해 만들어졌습니다.
   * (다만 내부적으로는 imageDisplay는 3, 5개의 인수도 처리할 수 있습니다. 왜냐하면 drawImage 함수가 그만큼의 인수를 지원하기 때문)
   * 
   * @param {string | HTMLImageElement} image 이미지의 경로 또는 이미지 객체
   * @param {number} x  x좌표
   * @param {number} y  y좌표
   * @param {number | null | undefined} width 이미지의 너비 (없을경우 해당 이미지의 기본 너비)
   * @param {number | null | undefined} height 이미지의 높이 (없을경우 해당 이미지의 기본 높이)
   * @param {number[]} options 기타 옵션 (flip, rotate, alpha) 참고: 이값을 설정했다면, imageDisplay 함수를 사용합니다.
   */
  imageView (image, x, y, width = undefined, height = undefined, ...options) {
    if (typeof image === 'string') {
      image = this.getCacheImage(image)
    }
    
    if (image == null) return

    // width, height 채우기 (함수 인수로 넣을 수도 있으나, image가 null일경우 에러가 발생하므로, 이렇게 처리함)
    if (width == null) width = image.width
    if (height == null) height = image.height

    if (options.length !== 0) {
      this._imageExpandDisplay(image, 0, 0, image.width, image.height, x, y, width, height, ...options)
    } else {
      if (this.checkTransform()) {
        const output = this.canvasTransform(arguments[1], arguments[2], width, height)
        this.context.drawImage(image, Math.floor(output.x), Math.floor(output.y), Math.floor(output.width), Math.floor(output.height))
        this.restoreTransform()
      } else {
        this.context.drawImage(image, x, y, width, height)
      }
    }
  }

  /**
   * 이미지를 출력합니다. context.drawImage 함수랑 동일합니다.
   * 
   * 인수를 3개 또는 5개만 넣으면, imageView 함수의 기능과 동일합니다.
   * 
   * 함수의 표시된 인수 목록은 9개 기준이며 최대 12개까지 지정 가능합니다.
   * 인수가 10개 ~ 12개 사이일경우, 플립, 회전, 알파값을 추가로 수정할 수 있습니다. 옵션이 설정될경우, 캔버스의 설정값은 무시됩니다.
   * (해당 이미지에만 적용)
   * @param {string | HTMLImageElement} image 이미지의 경로 또는 이미지 객체
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
  imageDisplay (image, sliceX = 0, sliceY = 0, sliceWidth, sliceHeight, x = 0, y = 0, width = 1, height = 1, ...option) {
    if (typeof image === 'string') {
      image = this.getCacheImage(image)
    }

    // 참고: 이미지의 크기가 0이면 이미지가 정상적으로 로드된게 아니므로, 이미지 출력을 무시합니다.
    if (image == null || image.width === 0) return

    if (arguments.length === 3 || arguments.length === 5) {
      this.imageView(image, sliceX, sliceY, sliceWidth, sliceHeight)
    } else if (arguments.length === 9) {
      if (this.checkTransform()) {
        const output = this.canvasTransform(x, y, width, height)
        this.context.drawImage(image, Math.floor(sliceX), Math.floor(sliceY), Math.floor(sliceWidth), Math.floor(sliceHeight), Math.floor(output.x), Math.floor(output.y), Math.floor(output.width), Math.floor(output.height))
        this.restoreTransform()
      } else {
        this.context.drawImage(image, Math.floor(sliceX), Math.floor(sliceY), Math.floor(sliceWidth), Math.floor(sliceHeight), Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height))
      }
    } else if (arguments.length >= 10 && arguments.length <= 12) {
      // 함수의 내용이 길어 따로 분리
      this._imageExpandDisplay(image, sliceX, sliceY, sliceWidth, sliceHeight, x, y, width, height, ...option)
    } else {
      throw new Error(GraphicSystem.errorMessage.IMAGE_DISPLAY_ARGUMENT_ERROR)
    }
  }

  /**
   * 이 함수는 비공개 함수입니다. imageDisplay의 확장 기능을 수행하기 위해 만들어졌습니다. (플립, 회전, 알파값 수정 가능)
   * 
   * 참고: scale은 width, height를 수정해서 처리하세요.
   * 
   * imageDisplay랑 받는 인수가 같으므로, 가급적이면 imageDisplay의 함수를 사용해주세요.
   */
  _imageExpandDisplay (image, sliceX, sliceY, sliceWidth, sliceHeight, x, y, width, height, ...option) {
    // 현재 캔버스의 상태를 저장. 이렇게 하는 이유는, 캔버스의 설정을 너무 많이 바꿔 현재 상태를 저장하지 않으면 원래대로 되돌리기 어렵기 때문
    this.context.save()
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
    } else {
      flip = this.flip
    }

    // rotate
    if (option.length >= 2) {
      rotate = option[1]
      if (rotate >= 360 || rotate < -360) {
        rotate = rotate % 360
      }
    } else {
      rotate = this.rotateDegree
    }

    // alpha (없을 경우 글로벌 알파값 적용)
    if (option.length >= 3 && option[2] >= 0 && option[2] <= 1) {
      alpha = option[2]
    } else {
      alpha = this.context.globalAlpha
    }

    if (rotate !== 0) {
      const centerX = x + (width / 2)
      const centerY = y + (height / 2)
      const radian = Math.PI / 180 * rotate
      this.context.translate(centerX, centerY) // 회전할 객체의 중심 위치로 캔버스의 중심 좌표를 변경
      this.context.rotate(radian) // 라디안 값만큼 회전(참고: 각도 값을 라디안으로 변환해야 함)

      if (flip === 1) {
        this.context.scale(-1, 1) // x축의 크기를 반대로
      } else if (flip === 2) {
        this.context.scale(1, -1) // y축의 크기를 반대로
      } else if (flip === 3) {
        this.context.scale(-1, -1) // x축 y축 다 반대로
      }

      // 회전이 중심축에서 이루어지고, translate로 캔버스의 원점이 객체의 중심으로 이동했기 때문에
      // 그에 맞게 좌표를 수정해야 합니다. 좌표는 (-halfWidth, -halfHeight, width, height) 입니다.
      outputX = -(width / 2)
      outputY = -(height / 2)
      outputWidth = width
      outputHeight = height
    } else {
      if (flip === 1) { // flip 값이 vertical일경우
        this.context.scale(-1, 1) // x축의 크기를 반대로
        outputWidth = -width // x축을 반전시킨탓에, 실제 출력할때도 반대로 값을 넣어서 출력해야합니다. (양수와 음수가 서로 바뀌듯이)
        outputX = -x // 출력 위치도 -x로 변환됩니다.
      } else if (flip === 2) { // 이하 방향빼고 나머지 동일
        this.context.scale(1, -1) // y축의 크기를 반대로
        outputHeight = -height
        outputY = -y
      } else if (flip === 3) {
        this.context.scale(-1, -1) // x축 y축 다 반대로
        outputWidth = -width
        outputX = -x
        outputHeight = -height
        outputY = -y
      }
    }

    this.context.globalAlpha = alpha // 알파값 수정
    this.context.drawImage(image, Math.floor(sliceX), Math.floor(sliceY), Math.floor(sliceWidth), Math.floor(sliceHeight), Math.floor(outputX), Math.floor(outputY), Math.floor(outputWidth), Math.floor(outputHeight))
    this.context.restore() // 캔버스를 이전 상태로 복원
  }

  /**
   * 해당 함수는 다른 함수로 변경할 예정입니다.
   * 
   * 그라디언트를 그리는 함수, 다만 createLinearGradient를 사용하는것과 비교해 옵션이 제한되어있습니다.
   * @param {number} x 그라디언트 시작점의 x좌표
   * @param {number} y 그라디언트 시작점의 y좌표
   * @param {number} width 그라디언트 길이
   * @param {number} height 그라디언트 높이
   * @param {string} startColor 그라디언트 시작 색깔의 css값
   * @param {string} endColor 그라디언트 끝 색깔의 css값 (anotherColor가 추가되어도 끝 색깔은 끝부분에 적용됩니다.)
   * @param {anotherColor} anotherColor 또다른 컬러들... (그라디언트를 여러개의 색상으로 만들 때 사용, 단 이 값은 중간에 들어가는 색입니다.)
   * 
   * @deprecated
   */
  gradientDisplay (x, y, width, height, startColor = 'black', endColor = startColor, ...anotherColor) {
    // 그라디언트 backGround
    let gradient
    try {
      gradient = this.context.createLinearGradient(x, y, x + width, y + height)

      gradient.addColorStop(0, startColor)
      gradient.addColorStop(1, endColor)

      // 또다른 컬러도 있다면 추가
      for (let i = 0; i < anotherColor.length; i++) {
        let totalColorCount = 2 + anotherColor.length
        let position = (1 / totalColorCount) * (i + 1)
        gradient.addColorStop(position, anotherColor[i])
      }

      // 그라디언트 그리기
      this.context.fillStyle = gradient
      if (this.checkTransform()) {
        const output = this.canvasTransform(x, y, width, height)
        this.context.fillRect(output.x, output.y, output.width, output.height)
        this.restoreTransform()
      } else {
        this.context.fillRect(x, y, width, height)
      }
    } catch (e) {
      alert(e)
    }

    
  }

  /**
   * 그라디언트 형태의 사각형을 출력합니다.
   * 
   * 좀 더 상세한 linearGradient 형태를 사용하고 싶다면 이 함수를 사용하세요.
   * 
   * 경고: 값이 제대로 작성되지 않으면, 오류가 날 수 있습니다. 값을 작성하기 귀찮다면 gradientRect의 기본 함수를 사용하세요.
   * 
   * @param {number} x 출력할 사각형의 x좌표
   * @param {number} y 출력할 사각형의 y좌표
   * @param {number} width 출력할 사각형의 너비
   * @param {number} height 출력할 사각형의 높이
   * @param {number} gX1 그라디언트 기준 1번째 x좌표
   * @param {number} gY1 그라디언트 기준 1번째 y좌표
   * @param {number} gX2 그라디언트 기준 2번째 x좌표
   * @param {number} gY2 그라디언트 기준 2번째 y좌표
   * @param {string[]} color 그라디언트이 색깔(배열로 작성), 2개 이상 작성해야합니다. (1개만 작성하면 그라디언트 효과가 없음.)
   * @param {number[]} position 그라디언트 각 색깔의 위치(배열로 작성, 0 ~ 1범위) 엉뚱한 값을 작성하면 오류가 날 수 있음.
   */
  gradientRectEdit (x, y, width, height, gX1, gY1, gX2, gY2, color, position) {
    const gradient = this.context.createLinearGradient(gX1, gY1, gX2, gY2)
    
    // color, position이 배열인지를 각각 확인하고, 배열이 아니면 배열로 설정함
    // 타입 검사는 하지 않습니다. 주의하세요.
    if (!Array.isArray(color)) color = [color]
    if (!Array.isArray(position)) position = [position]

    // color 또는 position의 배열 최대길이까지 각 위치에 맞게 색깔을 추가합니다.
    for (let i = 0; i < color.length || i < position.length; i++) {
      gradient.addColorStop(position[i], color[i])
    }

    // 그라디언트 그리기
    this.context.fillStyle = gradient
    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, width, height)
      this.context.fillRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.context.fillRect(x, y, width, height)
    }
  }

  /**
   * 그라디언트 사각형을 출력합니다.
   * 
   * 간단한 그라디언트 사각형을 만들어 추가할 수 있습니다. 만약 더 복잡한 구성을 하고 싶다면 gradientRectEdit 함수를 사용해주세요.
   * 
   * @param {number} x 사각형의 x좌표
   * @param {number} y 사각형의 y좌표
   * @param {number} width 사각형의 너비
   * @param {number} height 사각형의 높이
   * @param {string[]} color 색깔(배열로 정의), 2개 이상 필요. 1개만 있을경우 그라디언트를 출력하는 의미가 없음.
   * @param {boolean} isVertical 정렬방향. true(기본값): 왼쪽에서 오른쪽으로, false: 위에서 아래로, 다른 방향은 없음
   */
  gradientRect (x, y, width, height, color, isVertical = true) {
    // 좌표값은 사각형 기준. isVertical에 따라 방향 결정.
    // true면 왼쪽에서 오른쪽이고 X1은 맨 왼쪽, X2는 맨 오른쪽, Y축은 y + Math.floor(height / 2)
    // false면 위쪽에서 아래쪽이고 X축은 x + Math.floor(width / 2), Y1은 맨 위쪽, Y2는 맨 아래쪽
    let gPosition = {gX1: 0, gX2: 0, gY1: 0, gY2: 0}
    if (isVertical) {
      gPosition.gX1 = x
      gPosition.gX2 = x + width
      gPosition.gY1 = y + Math.floor(height / 2)
      gPosition.gY2 = y + Math.floor(height / 2)
    } else {
      gPosition.gX1 = x + Math.floor(width / 2)
      gPosition.gX2 = x + Math.floor(width / 2)
      gPosition.gY1 = y
      gPosition.gY2 = y + height
    }

    const gradient = this.context.createLinearGradient(gPosition.gX1, gPosition.gY1, gPosition.gX2, gPosition.gY2)
    for (let i = 0; i < color.length; i++) {
      let position = 0
      if (i === 0) {
        position = 0 // 첫번째 색상은 맨 처음위치로
      } else if (i === color.length - 1) {
        position = 1 // 마지막 색상은 맨 마지막위치로
      } else {
        // 중간 색상은 색상의 개수를 1개 제거한 후, 1로 나눠서 평균을 곱합
        // 총 5개의 색상이 있다면 중간 색상을 4개로 간주하고, 1을 4로 나눈 후 각각 곱합
        // 그러면 0, 0.25, 0.5, 0.75, 1과 같이 배치될것임.
        position = (1 / (color.length - 1)) * i
      }

      gradient.addColorStop(position, color[i])
    }

    // 그라디언트 그리기
    this.context.fillStyle = gradient
    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, width, height)
      this.context.fillRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.context.fillRect(x, y, width, height)
    }
  }

  /**
   * 미터 형태로(전체 값중 일부만큼 비율에 맞춰서 출력) 그라디언트 그리기
   * 그려지는 크기는 현재 값 / 최대 값 을 계산한 비율입니다. 즉 10%비율이면, 총 크기의 10%만 그려집니다.
   * 
   * 이 함수는 제거될 예정입니다.
   * 
   * 이 함수는 내부적으로 gradientDisplay 함수를 사용합니다.
   * @deprecated
   * @param {number} x x좌표
   * @param {number} y y좌표
   * @param {number} width 너비 (최대 값 기준)
   * @param {number} height 높이 (최대 값 기준)
   * @param {number} value 현재 값
   * @param {number} maxValue 최대 값
   * @param {string | number} meterType 미터 타입 (수직: 0 or 'vertical', 수평: 1 or 'horizontal)
   * @param {string} startColor 시작 색깔
   * @param {string} endColor 끝 색깔 (경고: 이 색은 여러개의 색깔이 더 추가되어도, 가장 마지막 색으로 지정됨.)
   * @param  {string[]} anotherColor 추가 색깔 (경고: 이 색은 마지막 색이 될 수 없음.)
   */
  meterGradient (x, y, width, height, value, maxValue, meterType, startColor, endColor, ...anotherColor) {
    let percent = value / maxValue

    // 받아온 미터 타입이 숫자라면, 문자열로 변경
    if (typeof meterType === 'number') {
      let setType = ['vertical', 'horizontal']
      meterType = setType[meterType]
    }

    switch (meterType) {
      case 'vertical': this.gradientDisplay(x, y, width, Math.floor(height * percent), startColor, endColor, ...anotherColor); break
      case 'horizontal': this.gradientDisplay(x, y, Math.floor(width * percent), height, startColor, endColor, ...anotherColor); break
      default: console.log('잘못된 값 입력!, meterType은 vertical 또는 horizontal입니다. 그라디언트 출력은 무시됩니다.'); break
    }
  }

  /**
   * 미터 형태로 사각형을 그립니다. 전체 값의 일정 비율만큼만 사각형을 그릴 수 있습니다.
   * 그리고 색깔을 배열형태로 여러개 설정할 경우 그라디언트 형태로 출력할 수 있습니다.
   * 
   * 참고로 여러개의 인수를 입력하는 과정이 복잡하다고 느껴지면 대신 meterRectObject 함수를 사용해서
   * 오브젝트를 전달할 수 있습니다.
   * 
   * @param {number} x 출력할 사각형의 x좌표
   * @param {number} y 출력할 사각형의 y좌표
   * @param {number} width 출력할 사각형의 최대너비
   * @param {number} height 출력할 사각형의 최대높이
   * @param {string | string[]} color 색상 (배열로 2개 이상의 값을 전달하면 그라디언트 효과 적용)
   * @param {number} value 기준이 되는 현재 값
   * @param {number} maxValue 기준이 되는 최대 값
   * @param {boolean} isVertical 방향설정: 기본값은 수평, true일경우 수평, false일경우 수직
   * @param {string | string[]} borderColor 배경색(배열로 2개 이상의 값을 전달하면 그라디언트 효과 적용), 값이 비어있으면 무시, 배열로 전달하면 값이 있는것으로 간주함. 
   * @param {number} borderLength 배경색의 테두리 길이(단 사각형의 너비와 높이를 초과하지 않음), 테두리가 길어지면 배경이 차지하는 영역이 넓어짐
   */
  meterRect (x, y, width, height, color = 'black', value, maxValue = value, isVertical = true, borderColor = '', borderLength = 0) {
    // 비율 값 계산. 최대값이 0이면, 0으로 나누기 문제가 발생하므로, 0퍼센트로 처리함.
    // 그리고, 퍼센트 결과가 0과 1사이가 되도록 조정(0%미만 100%를 초과할 수 없습니다.)
    let percent = maxValue === 0 ? 0 : value / maxValue
    if (percent < 0) percent = 0
    if (percent > 1) percent = 1

    // 수평방향이냐 수직방향이냐의 따라서 출력 width, height 조정
    // 수평방향일경우 width가 percent만큼 영향을 받고, 수직이면 height가 percent만큼 영향을 받음
    let outputWidth = isVertical ? width * percent : width
    let outputHeight = isVertical ? height : height * percent
    
    // boarderLength만큼 출력 길이 제거(배경색과 영역을 구분하기 위함)
    outputWidth -= borderLength
    outputHeight -= borderLength

    // 배경색 출력(배열로 지정되거나, 값이 정해진 경우), 배경은 전체가 칠해집니다.
    if (Array.isArray(borderColor)) {
      this.gradientRect(x, y, width, height, borderColor, isVertical)
    } else if (borderColor !== '') {
      this.fillRect(x, y, width, height, borderColor)
    }

    // 해당 값이 0인경우, 미터는 출력하지 않습니다.
    if (percent <= 0) return

    // 일반 영역 출력 (참고: 배경색이 없어도 border가 계산되니 주의하세요.)
    if (Array.isArray(color)) {
      // 그라디언트가 완전히 출력되게 하기 위해 직접 position을 설정하고 전달합니다.
      let position = []
      for (let i = 0; i < color.length; i++) {
        if (i === 0) {
          position.push(0) // 첫번째 색상은 맨 처음위치로
        } else if (i === color.length - 1) {
          position.push(1) // 마지막 색상은 맨 마지막위치로
        } else {
          // 중간 색상은 색상의 개수를 1개 제거한 후, 1로 나눠서 평균을 곱합
          // 총 5개의 색상이 있다면 중간 색상을 4개로 간주하고, 1을 4로 나눈 후 각각 곱합
          // 그러면 0, 0.25, 0.5, 0.75, 1과 같이 배치될것임.
          position.push((1 / (color.length - 1)) * i)
        }
      }

      // 포지션이 결정되면 수평, 수직 방향을 결정합니다.
      if (isVertical) {
        this.gradientRectEdit(x + borderLength, y + borderLength, outputWidth - borderLength, outputHeight - borderLength, x, y + Math.floor(height / 2), x + width, y + Math.floor(height / 2), color, position)
      } else {
        this.gradientRectEdit(x + borderLength, y + borderLength, outputWidth - borderLength, outputHeight - borderLength, x + Math.floor(width / 2), y, x + Math.floor(width / 2), y + height, color, position)
      }
      // this.gradientRect(x, y, outputWidth, outputHeight, color, isVertical)
    } else {
      this.fillRect(x + borderLength, y + borderLength, outputWidth - borderLength, outputHeight - borderLength, color)
    }
  }

  /**
   * 이 함수는 객체 형태로 인수를 받습니다.
   * 
   * 미터 형태로 사각형을 그립니다. 전체 값의 일정 비율만큼만 사각형을 그릴 수 있습니다.
   * 그리고 색깔을 배열형태로 여러개 설정할 경우 그라디언트 형태로 출력할 수 있습니다.
   * 
   * 내부적으로는 meterRect의 함수를 사용합니다.
   * 
   * 이 함수의 사용은 권장하지 않습니다. 대신 meterRect 함수를 사용해주세요.
   * 
   * @deprecated
   * @param {{x: number, y: number, width: number, height: number}} rect 사각형
   * @param {{color: string | string[], value: number, maxValue: number, 
   * isVertical: boolean, backgroundColor: string | string[], boarderLength: number}} option 
   * 옵션(각 옵션에 대한 내용은 meterRect 함수 참고)
   */
  meterRectObject (
    rect = { x: 0, y: 0, width: 0, height: 0}, 
    option = { color: '', value: 0, maxValue: 100, isVertical: true, 
    backgroundColor: '', boarderLength: 0}) {
      this.meterRect(
        rect.x, rect.y, rect.width, rect.height, 
        option.color, option.value, option.maxValue, option.isVertical, 
        option.backgroundColor, option.boarderLength
      )
  }


  /** 미터 타입: 수직 @deprecated */ static METER_VERTICAL = 'vertical'
  /** 미터 타입: 수평 @deprecated */ static METER_HORIZONTAL = 'horizontal'

  /**
   * context.fillRect랑 동일, 사각형 그리기
   * @param {number} x 그리는 기준점의 x좌표
   * @param {number} y 그리는 기준점의 y좌표
   * @param {number} width 길이
   * @param {number} height 높이
   * @param {string | null} color HTML CSS 색깔, 지정하지 않으면 이 함수를 사용하는 시점의 context.fillStyle 값을 사용
   * @param {number | null} alpha 알파값, 최대 1(불투명), 최소 0(투명), 값이 null이 아닐경우 캔버스의 설정값 우선
   */
  fillRect (x, y, width, height, color = null, alpha = null) {
    // 색깔이 있는경우
    if (color != null) {
      this.context.fillStyle = color
    }

    // 알파값이 있는 경우
    const prevAlpha = this.context.globalAlpha
    if (alpha != null) {
      this.context.globalAlpha = alpha
    }

    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, width, height)
      this.context.fillRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.context.fillRect(x, y, width, height)
    }

    // 알파값을 원래대로 되돌립니다. (일회성 사용)
    // 만약, 알파값을 원래대로 돌리지 않는다면, 다른 함수에서도 해당 alpha값을 참조하게됩니다.
    if (alpha != null) {
      this.context.globalAlpha = prevAlpha
    }
  }

  /**
   * context.clearRect랑 동일, 사각형으로 지우기
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  clearRect (x, y, width, height) {
    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, width, height)
      this.context.clearRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.context.clearRect(x, y, width, height)
    }
  }

  /**
   * 캔버스 전체를 지웁니다.
   */
  clearCanvas () {
    if (this.checkTransform()) {
      const output = this.canvasTransform(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
      this.context.clearRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.context.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
    }
  }

  /**
   * canvas의 font를 수정합니다.
   * 참고: font의 값은 이런 형태입니다. -> font = '24px 바탕체' -> 24px 바탕체
   * 아무것도 설정하지 않는다면 그래픽 시스템에 지정된 기본값을 사용합니다.
   * @param {string} fontText
   */
  setCanvasFont (fontText = GraphicSystem.DEFAULT_FONT) {
    this.context.font = fontText
  }

  /**
   * context.fillText랑 동일: 텍스트를 출력합니다.
   * @param {string} text 텍스트
   * @param {number} x 출력할 x좌표
   * @param {number} y 출력할 y좌표
   * @param {string} color 색깔: 없으면 검정색이 기본값
   * @param {number | null} maxWidth 해당 텍스트 출력의 최대길이(옵션), null일경우 사용하지 않음.
   */
  fillText (text = '', x, y, color = 'black', maxWidth = null) {
    this.setCanvasFont(GraphicSystem.DEFAULT_FONT)
    // this.context.font = '16px NaNum'
    this.context.fillStyle = color

    if (this.checkTransform()) {
      const textWidth = this.context.measureText(text)
      const output = this.canvasTransform(x, y, textWidth, parseInt(this.context.font))
      if (maxWidth != null) {
        this.context.fillText(text, output.x, output.y, maxWidth)
      } else {
        this.context.fillText(text, output.x, output.y)
      }
      this.restoreTransform()
    } else {
      if (maxWidth != null) {
        this.context.fillText(text, x, y, maxWidth)
      } else {
        this.context.fillText(text, x, y)
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
  strokeRect (x, y, width, height, color = 'black') {
    this.context.strokeStyle = color
    if (this.checkTransform()) {
      const output = this.canvasTransform(x, y, width, height)
      this.context.strokeRect(output.x, output.y, output.width, output.height)
      this.restoreTransform()
    } else {
      this.context.strokeRect(x, y, width, height)
    }
  }

  /**
   * 선을 그립니다.
   * 
   * 선은 캔버스의 변형에 영향을 받지 않습니다. 따라서 회전을 해야 한다면, 대신 fillRect를 사용해주세요.
   * 
   * @param {number} x1 첫번째 지점의 x좌표
   * @param {number} y1 첫번째 지점의 y좌표
   * @param {number} x2 두번째 지점의 x좌표
   * @param {number} y2 두번째 지점의 y좌표
   * @param {string} color 선의 색깔, 기본값 black(검정)
   */
  fillLine (x1, y1, x2, y2, color = 'black') {
    this.context.strokeStyle = color
    this.context.beginPath()
    this.context.lineWidth = 2
    this.context.moveTo(x1, y1)
    this.context.lineTo(x2, y2)
    this.context.stroke()
    
    this.context.lineWidth = 1 // lineWidth 초기화
  }

  /**
   * 참고: 이 함수는 fillRect처럼 출력합니다. (따라서, x, y좌표는 원의 중심좌표가 아니라 원의 출력 좌표입니다.)
   * @param {number} x 
   * @param {number} y 
   * @param {number} width 
   * @param {number} height 
   * @param {number} rotate 
   * @param {string} color 
   */
  fillEllipse (x, y, width, height, rotate = 0, color = 'black') {
    // 원을 그리기 위해서는 beginPath로 선을 그릴 준비를 한 후에 그려야합니다.
    // 원 도형을 직접 그리는 방법은 없습니다.

    if (typeof rotate !== 'number') {
      console.warn('경고: rotate값에 string을 사용할 수 없습니다. 착각하신건가요?')
    }

    this.context.fillStyle = color
    this.context.beginPath()
    this.context.ellipse(x + (width / 2), y + (height / 2), width / 2, height / 2, rotate, 0, Math.PI * 2)
    this.context.fill()
    this.context.closePath()
  }

  /**
   * 여기서 사용하는 캔버스를 body 영역에 추가합니다.
   * 
   * 그리고, 여백과 페딩도 전부 제거합니다.
   * 
   * isAutoResize 옵션을 true로 설정하면 캔버스의 사이즈는 브라우저에 맞춰지도록 변경합니다. 
   * 
   * 만약 body가 아니라, 다른 곳에 추가하고 싶다면
   * 특정 엘리먼트의 appendChild 함수에다가 this.canvas 변수를 넣어주세요.
   * 
   * 참고로 GraphicSystem.canvas 는 canvas태그랑 동일합니다.
   * 
   * @param {boolean} isAutoResize 브라우저의 크기가 조절되면 자동으로 사이즈가 조절됩니다.
   */
  bodyInsert (isAutoResize = true) {
    document.body.appendChild(this.canvas)
    document.body.style.padding = '0'
    document.body.style.margin = '0'
    document.body.style.border = '0'
    document.body.style.overflowX = 'hidden' // 크기에 따른 스크롤바 표시를 막기 위함
    document.body.style.overflowY = 'hidden' // 크기에 따른 스크롤바 표시를 막기 위함
    this._resizeFunction = this._resizeFunction.bind(this) // 이벤트 등록을 한 후 this를 graphicSystem으로 고정시키기 위한 함수
    this.setAutoResize(isAutoResize)
  }

  /** 그래픽 캔버스의 크기를 자동으로 설정할지 말지를 결정합니다. */
  setAutoResize (isAutoReSize = true) {
    // 이벤트 제거를 위하여 함수를 다시 만듬
    if (isAutoReSize) {
      document.body.style.textAlign = 'center' // 중앙 정렬
      addEventListener('resize', this._resizeFunction)
      this._resizeFunction()
    } else {
      this.canvas.style.width = this.canvas.width + 'px'
      this.canvas.style.height = this.canvas.height + 'px'
      removeEventListener('resize', this._resizeFunction)
      document.body.style.textAlign = '' // 중앙 정렬 취소
    }
  }

  /** body 태그의 배경색을 변경합니다. */
  setBodyColor (color = '') {
    document.body.style.backgroundColor = color
  }

  /**
   * 브라우저 사이즈가 변경될경우 호출합니다.
   * 
   * 이 함수는 graphicSystem 전용 함수입니다. (외부에서 사용하는것을 권장하지 않음.)
   */
  _resizeFunction () {
    // 브라우저 사이즈가 변경될경우, canvas사이즈의 재조정(풀스크린 지원 안함)
    // 브라우저 사이즈가 가장 짧은쪽을 선택, 다만, 가로 세로 비율이 4:3 이기 때문에 이를 고려해야 함
    let width = innerWidth / 4
    let height = innerHeight / 3
    
    if (width > height) {
      this.canvas.style.width = Math.floor(innerHeight / 3 * 4 / innerWidth * 100) + '%'
      // this.canvas.style.width = (innerHeight / 3 * 4) + 'px'
      // this.canvas.style.height = (innerHeight) + 'px'
    } else {
      this.canvas.style.width = '100%'
      this.canvas.style.height = '100%'
    }
  }

  /** backgroundDisplay에서 사용하는 옵션 목록 */
  optionBG = {
    /** 이미지 크기와의 상관없이 이미지를 캔버스 사이즈로 채운 후 출력합니다. */ FILL: 'fill',
    /** 이미지가 크기가 작은경우, 타일 형태로 출력합니다. 이미지 크기가 큰 경우 그대로 출력합니다.  */ TILE: 'tile',
    /** 이미지 크기가 작은경우 이미지를 늘립니다. 이미지 크기가 큰 경우 그대로 출력합니다. */ NORMAL: 'normal'
  }

  /**
   * 이미지를 배경으로 출력합니다. 스크롤 형태의 출력을 지원합니다.
   * 
   * (다만, 스크롤 배경을 사용하기 위해서는 imageStartX, imageStartY를 지속적으로 변경해야 합니다.)
   * 
   * @param {string | HTMLImageElement | OffscreenCanvas | ImageBitmap} imageSrc 이미지의 경로
   * @param {number} imageStartX 이미지 파일 내부의 시작 x좌표 (해당 좌표부터 출력하여 계속 스크롤됨)
   * @param {number} imageStartY 이미지 파일 내부의 시작 y좌표 (해당 좌표부터 출력하여 계속 스크롤됨)
   * @param {string} option 이미지 출력 옵션: 자세한것은 GraphicSystem.optionBG 내부의 값을 참조
   */
  backgroundDisplay (imageSrc = '', imageStartX = 0, imageStartY = 0, option = this.optionBG.NORMAL) {
    // 이미지가 문자열일경우, 캐시된 이미지를 가져옵니다. 아닐경우 해당 이미지를 그대로 대입합니다.
    const image = typeof imageSrc === 'string' ? this.getCacheImage(imageSrc) : imageSrc
    if (image == null || image.width === 0) return

    let imageWidth = image.width
    let imageHeight = image.height
    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height

    /** 이미지가 캔버스보다 작으면 이미지를 채워야하므로 이미지를 확대하기 위한 배율을 계산해야함
     * 그러나 이미지가 캔버스보다 큰 경우 확대를 할 필요가 없으므로 배율은 1
     */
    const multipleWidth = imageWidth < canvasWidth ? canvasWidth / imageWidth : 1
    const multipleHeight = imageWidth < canvasWidth ? canvasHeight / imageHeight : 1

    /**  
     * 결과 이미지
     * 
     * 이미지를 채움으로 표현하거나, 크기가 캔버스보다 작을경우, 이미지를 캔버스사이즈에 맞춰서 다시 생성합니다.
     */
    let resultImage
    if (option === this.optionBG.FILL || imageWidth < canvasWidth || imageHeight < canvasHeight) {
      let offCanvas = new OffscreenCanvas(canvasWidth, canvasHeight).getContext('2d')
      offCanvas.drawImage(image, 0, 0, canvasWidth, canvasHeight)
      resultImage = offCanvas.canvas
      imageWidth = canvasWidth
      imageHeight = canvasHeight
    } else {
      resultImage = image
    }

    // 이미지의 시작점이 이미지의 너비 초과 또는 음수일경우, 이미지 X 좌표 변경
    if (imageStartX > imageWidth) {
      imageStartX = imageStartX % imageWidth
    } else if (imageStartX < 0) {
      imageStartX = imageWidth - Math.abs(imageStartX % imageWidth)
    }

    // 이미지의 시작점이 이미지의 높이 초과 또는 음수인경우, 이미지 Y 좌표 변경
    if (imageStartY > imageHeight) {
      imageStartY = imageStartY % imageHeight
    } else if (imageStartY < 0) {
      imageStartY = imageHeight - Math.abs(imageStartY % imageHeight)
    }

    if (imageStartX === 0 && imageStartY === 0) {
      // 백그라운드의 좌표가 (0, 0) 일 때
      // 참고: 이미지 크기를 전부 출력하는것이 아닌, 캔버스의 크기로만 출력됩니다.
      // 캔버스보다 이미지가 작다면 나머지 부분은 그려지지 않습니다.
      this.imageDisplay(resultImage, 0, 0, canvasWidth, canvasHeight, imageStartX, imageStartY, canvasWidth, canvasHeight)
    } else if (imageStartX !== 0 && imageStartY === 0) {
      // x축 좌표가 0이 아니고 y축 좌표가 0일 때 (수평 스크롤)
      // 만약 x축과 출력길이가 이미지 길이를 초과하면 배경을 2번에 나누어 출력됩니다.
      if (imageStartX + canvasWidth >= imageWidth) {
        const screenAStart = multipleWidth !== 1 ? Math.round(imageStartX * multipleWidth) : imageStartX
        const screenAWidth = multipleWidth !== 1 ? canvasWidth - screenAStart : imageWidth - screenAStart
        const screenBWidth = canvasWidth - screenAWidth
        this.imageDisplay(resultImage, screenAStart, 0, screenAWidth, canvasHeight, 0, 0, screenAWidth, canvasHeight)
        this.imageDisplay(resultImage, 0, 0, screenBWidth, canvasHeight, screenAWidth, 0, screenBWidth, canvasHeight)
      } else {
        // 출력길이가 초과하지 않는다면, 좌표에 맞게 그대로 출력
        this.imageDisplay(resultImage, imageStartX, imageStartY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)
      }
    } else if (imageStartX === 0 && imageStartY !== 0) {
      // y축 좌표가 0이 아니고 x축 좌표는 0일 때 (수직 스크롤 포함)
      // 스크롤 원리는 x축과 동일하다.
      if (imageStartY + canvasHeight >= imageHeight) {
        const screenAStart = multipleHeight !== 1 ? Math.floor(imageStartY * multipleHeight) : imageStartY
        const screenAHeight = multipleHeight !== 1 ? canvasHeight - screenAStart : imageHeight - screenAStart
        const screenBHeight = canvasHeight - screenAHeight
        this.imageDisplay(resultImage, 0, screenAStart, canvasWidth, screenAHeight, 0, 0, canvasWidth, screenAHeight)
        this.imageDisplay(resultImage, 0, 0, canvasWidth, screenBHeight, 0, screenAHeight, canvasWidth, screenBHeight)
      } else {
        // 출력길이가 초과하지 않는다면, 좌표에 맞게 그대로 출력
        this.imageDisplay(resultImage, imageStartX, imageStartY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)
      }
    } else {
      // x축과 y축이 모두 0이 아닌경우, (수직 + 수평 스크롤)
      // 만약 어느 축도 이미지의 길이를 초과하지 않았다면, 그대로 이미지를 출력합니다.
      if (imageStartX + canvasWidth <= imageWidth && imageStartY + canvasHeight <= imageHeight) {
        this.imageDisplay(resultImage, imageStartX, imageStartY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)
      } else {
        // 어느 쪽도 초과라면 4번에 나누어져 출력
        const screenBaseStartX = multipleWidth !== 1 ? Math.floor(imageStartX * multipleWidth) : imageStartX
        const screenBaseStartY = multipleHeight !== 1 ? Math.floor(imageStartY * multipleHeight) : imageStartY
        const screenBaseWidth = multipleWidth !== 1 ? canvasWidth - screenBaseStartX : imageWidth - screenBaseStartX
        const screenBaseHeight = multipleWidth !== 1 ? canvasHeight - screenBaseStartY : imageHeight - screenBaseStartY
        const screenExtendWidth = multipleWidth !== 1 ? canvasWidth - screenBaseWidth : imageWidth - screenBaseWidth
        const screenExtendHeight = multipleWidth !== 1 ? canvasHeight - screenBaseHeight : imageHeight - screenBaseHeight

        // 오류 방지를 위해 이미지를 자르는 사이즈가 0이 되지 않도록 조건을 정한 후 출력
        // 첫번째 기본 이미지
        if (screenBaseWidth !== 0 || screenBaseHeight !== 0) {
          this.imageDisplay(resultImage, screenBaseStartX, screenBaseStartY, screenBaseWidth, screenBaseHeight, 0, 0, screenBaseWidth, screenBaseHeight)
        }

        // 두번째 x축 이미지 (첫번째 이미지를 기준으로 X축의 다른 위치[이미지가 스크롤 하면서 잘린 지점])
        if (imageStartX + canvasWidth >= imageWidth && screenBaseWidth !== 0) {
          this.imageDisplay(resultImage, 0, screenBaseStartY, screenExtendWidth, screenBaseHeight, screenBaseWidth, 0, screenExtendWidth, screenBaseHeight)
        } else if (screenBaseWidth === 0) {
          this.imageDisplay(resultImage, 0, screenBaseStartY, screenExtendWidth, screenBaseHeight, 0, 0, screenExtendWidth, screenBaseHeight)
        }

        // 세번째 y축 이미지 (첫번째 이미지를 기준으로 Y축 다른 위치[이미지가 스크롤 하면서 잘린 지점])
        if (imageStartY + canvasHeight >= imageHeight && screenBaseHeight !== 0) {
          this.imageDisplay(resultImage, screenBaseStartX, 0, screenBaseWidth, screenExtendHeight, 0, screenBaseHeight, screenBaseWidth, screenExtendHeight)
        } else if (screenBaseHeight === 0) { // 만약 baseHeight가 0이라면, x, 0 위치에 출력합니다.
          this.imageDisplay(resultImage, screenBaseStartX, 0, screenBaseWidth, screenExtendHeight, 0, 0, screenBaseWidth, screenExtendHeight )
        }

        // 네번째 x, y축 이미지 (첫번째 이미지를 기준으로 대각선에 위치)
        if (screenBaseWidth !== 0 && screenBaseHeight !== 0) {
          this.imageDisplay(resultImage, 0, 0, screenExtendWidth, screenExtendHeight, screenBaseWidth, screenBaseHeight, screenExtendWidth, screenExtendHeight)
        } else if (screenBaseWidth === 0 && screenBaseHeight !== 0) { // width(가로축)만 0인 경우
          this.imageDisplay(resultImage, 0, 0, screenExtendWidth, screenExtendHeight, 0, screenBaseHeight, screenExtendWidth, screenExtendHeight)
        } else if (screenBaseWidth !== 0 && screenBaseHeight === 0) { // height(세로축)만 0인 경우
          this.imageDisplay(resultImage, 0, 0, screenExtendWidth, screenExtendHeight, screenBaseWidth, 0, screenExtendWidth, screenExtendHeight)
        } else if (screenBaseWidth === 0 && screenBaseHeight === 0) { // 둘 다 0인 경우
          this.imageDisplay(resultImage, 0, 0, screenExtendWidth, screenExtendHeight, 0, 0, screenExtendWidth, screenExtendHeight)
        }
      }
    }
  }

  backgroundDisplayTile () {}
  backgroundDisplayFill () {}
}