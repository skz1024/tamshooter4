import { ControlSystem } from "./control.js";
import { GraphicSystem } from "./graphic.js";
// import { soundSystem } from "./sound.js";

/**
 * 탐슈터 4를 만들기 위한 탐사엔진입니다.
 * 탐사엔진의 이름은 tam + 4(sa) + engine 의 조합입니다.
 * 
 * 게임을 만들기 위해서, init 함수를 사용해주십시요.
 * init 함수를 사용하면 게임 캔버스를 그립니다.
 * 
 * 항상 생각했지만, 복잡한 게임을 만들기 위해서는 구조를 잘 짜야 합니다.
 * 탐슈터 4는 구조적으로 복잡한 게임이 될 수밖에 없기 때문에 단순한 구현 위주로 동작했던
 * 기존 방식으로 게임을 만드는것은 너무 어렵습니다.
 * 
 * 그래서, 아예 기존에 분할되었던 기능을 한 엔진에 전부 합칠 예정입니다.
 * 
 * 각 모듈에 대한 설명은 내부 변수 참고
 */
class TamsaEngine {
  /** 디바이스 구분용 문자열 */
  static device = {
    pc: 'pc',
    mobile: 'mobile'
  }

  /**
   * 새로운 게임을 만듭니다. 이 클래스에 내장되어있는 함수들을 이용해 게임을 제작할 수 있습니다.
   * @param {string} gameTitle 게임 타이틀: 브라우저 타이틀에 표시됩니다.
   * @param {number} gameWidth 게임 너비
   * @param {number} gameHeight 게임 높이
   * @param {number} gameFps 초당 게임 프레임 (기본값: 고정 60), 가변방식 사용 불가
   * @param {boolean} isAutoBodyInsertCanvas 캔버스를 body 태그에 자동으로 삽입합니다. (false일경우 사용자가 graphicSystem을 직접 호출해서 캔버스의 출력 지점을 지정해야합니다.)
   */
  constructor (gameTitle, gameWidth, gameHeight, gameFps = 60, isAutoBodyInsertCanvas = true) {
    /** 브라우저 타이틀에 표시할 게임 타이틀 */ this.gameTitle = gameTitle
    /** 게임의 너비 (캔버스의 너비) */ this.gameWidth = gameWidth
    /** 게임의 높이 (캔버스의 높이) */ this.gameHeight = gameHeight
    /** 초당 게임 프레임 */ this.gameFps = gameFps

    /** 현재 프레임 */ this.currentFps = 0

    // 기본 초기화 작업 (재수행 될 수 없음.)
    // 캔버스 등록 및 브라우저 화면에 표시(이 위치를 수정해야 겠다면, 수동으로 캔버스를 지정해주세요.)
    this.graphicSystem = new GraphicSystem(gameWidth, gameHeight)
    
    this.controlSystem = new ControlSystem()
    this.controlSystem.addEventMouseTouch(this.graphicSystem.canvas)

    document.body.style.backgroundColor = '#1F1F1F'

    // canvas를 바로 body 영역에 삽입
    if (isAutoBodyInsertCanvas) {
      this.graphicSystem.bodyInsert()
    }

    /** 해당 게임의 기준 프레임 (고정 프레임 간격) */
    this.FPS = gameFps

    /** 현재 프레임 */
    this.fps = 0

    /** 프레임 호출횟수 */
    this.frameCount = 0

    // 참고: 모든 setInterval, requestAnimation은 함수를 bind (화살표 함수를 이용해) 해서 사용합니다.
    // 그래야만 tamsaEngine의 클래스 내부 변수를 this로 접근할 수 있습니다.
    /** 프레임 확인하는 interval 함수 id, 매 1초마다 실행 */
    this.frameCheckId = setInterval(() => this.framePerSecondsCheck(), 1000)

    /** animationFrame의 id 저장용 */
    this.animationId = requestAnimationFrame(() => this.animation())

    /** 현재 바이오스 모드인지 확인 */
    this.isBiosMode = false

    /** 
     * 엔진이 가동된 시점(시간값이 아닌 정수값입니다.)
     * 
     * 참고: 단위는 ms이므로 초단위로 계산하려면 1000으로 나눠서 계산해야합니다.
     */
    this.startRunningTime = performance.now()

    /** 현재 디바이스(모바일, PC 구분용) */
    this.currentDevice = ''
    this.touchPad = null
    // 모바일과 PC 구분 (최대 터치 포인트가 없으면 터치를 지원하지 않는 PC로 간주)
    // navigator.userAgent는 사용하지 않습니다.
    if (navigator.maxTouchPoints === 0) {
      this.currentDevice = TamsaEngine.device.pc
      // 다른 추가작업은 없음
    } else {
      this.currentDevice = TamsaEngine.device.mobile
      // 조이패드를 추가
      this.controlSystem.createTouchButton()
    }

    addEventListener('resize', () => {
      // if (matchMedia('(orientation: landscape)').matches) {
      //   this.controlSystem.touchButton.elementFirst.style.position = 'fixed'
      //   this.controlSystem.touchButton.elementFirst.style.top = '0%'
      //   this.controlSystem.touchButton.elementSecond.style.position = 'fixed'
      //   this.controlSystem.touchButton.elementSecond.style.top = '50%'
      // }
    })
  }

  /** 1초마다 몇 프레임이 카운트 되었는지를 확인하고, 이를 fps에 반영합니다. */
  framePerSecondsCheck () {
    this.fps = this.frameCount
    this.frameCount = 0
  }

  /** animation함수에서 사용하는 다음 시간 확인 용도  */
  thenAnimationTime = 0

  /** animation의 시간 간격을 확인하기 위해 만들어진 변수 */
  timestamp = 0

  /** 브라우저에 출력할 에니메이션 함수 (참고: 게임 로직도 여기서 같이 실행됨) */
  animation () {
    /*
    * 에니메이션의 출력 프레임을 60fps로 고정시키기 위해 다음과 같은 알고리즘을 적용하였습니다.
    * 사실 원리는 모르겠지만, 이전 시간을 기준으로 다음 프레임을 계산할 때
    * then = timestamp - (elapsed % fpsInterval) 계산을 공통적으로 하는것 같습니다.
    * 어쨋든, 이 게임은 모니터 환경에 상관없이 초당 60fps로만 실행됩니다.
    * 이 설정을 바꾸는 것은 게임 규칙 위반입니다. 임의로 수정하지 마세요.
    * 기본값: 16.6 = 60fps
    */
    const fpsInterval = 1000 / this.FPS // 1seconds 60fps limit, do not exceed 60fps!
    this.timestamp = performance.now() // 현재 timestamp를 performance.now를 이용해 가져옵니다.
    // 원래는 animation 함수에서 timestamp란 인자값을 받아와야 하나, bind 때문인지 timestamp를 가져오지 못해
    // 이 방식을 대신 사용하였습니다.

    // 진행시간 = 타임스탬프 - 그 다음 시간
    const elapsed = this.timestamp - this.thenAnimationTime
    if (elapsed >= fpsInterval) { // 진행시간이 fps간격 이상일 때
      // 그 다음시간 = 타임스탬프값에서 (진행시간값의 fps간격의 나머지)을 뺀다.
      this.thenAnimationTime = this.timestamp - (elapsed % fpsInterval)
      this.frameCount++

      if (this.isBiosMode) {
        this.bios()
      } else {
        this.process()
        this.display()
      }

      // 사실 이렇게 된건 firefox의 setInterval이 느리게 작동하기 때문이다.
      // 어쩔수 없이 requsetAnimationFrame을 사용해야 한다.
    }

    requestAnimationFrame(() => this.animation())
  }

  /** 게임에서의 로직: 이 함수의 내용을 변경해주세요. */
  process () {
    // 아무것도 없음
    // 아무 로직도 없으면 바이오스를 실행시킴
    this.isBiosMode = true
  }

  /** 게임에서의 출력: 이 함수의 내용을 변경해주세요. */
  display () {
    // 아무것도 없음
  }

  /** 엔진에서의 부팅 과정 (파일 로드를 포함합니다.) */
  botting () {
    // 아무것도 없음
  }


  biosMenuNumber = 0
  biosMenuCursor = 1
  
  /** 
   * 엔진의 바이오스 메뉴: 이것이 실행되면 게임 로직은 동작하지 않습니다. 
   * 
   * 바이오스 입장 방법:
   * 
   * 키보드: del 또는 F2키를 부팅 5초 이내에 누름(게임이 켜지는것과 상관없이)
   * 
   * 모바일 패드: select키 5회를 부팅 5초 이내에 누름 (패드를 표시하지 않으면 불가능 할 수 있음.)
   * 
   * 게임이 없는 경우(process와 display를 사용자가 직접 만들어야만 합니다.)
   */
  bios () {
    // 검은색 화면 출력
    this.graphicSystem.fillRect(0, 0, this.graphicSystem.CANVAS_WIDTH, this.graphicSystem.CANVAS_HEIGHT, '#282828')

    switch (this.biosMenuNumber) {
      case 0: this.biosMainMenu(); break
      case 1: this.biosInputTest(); break
    }
  }

  biosMainMenu () {  
    // 텍스트 출력
    this.biosTextOutput('TAMSAENGINE MENU', 0)
    this.biosTextOutput('created by skz1024 - 2023/03/26', 1)
    this.biosTextOutput('device: ' + this.currentDevice, 2)

    this.biosTextOutput('menu select', 4)
    this.biosTextOutput('  1. INPUT TEST (KEYBOARD, BUTTON, MOUSE, TOUCH)', 5)
    this.biosTextOutput('  2. SOUND TEST', 6)
    this.biosTextOutput('  3. GRAPHIC TEST', 7)
    this.biosTextOutput('  4. EXIT', 8)

    this.biosTextOutput('->', 5 + this.biosMenuCursor - 1)

    const buttonDown = this.controlSystem.getButtonInput(this.controlSystem.buttonIndex.DOWN)
    const buttonUp = this.controlSystem.getButtonInput(this.controlSystem.buttonIndex.UP)
    const buttonStart = this.controlSystem.getButtonInput(this.controlSystem.buttonIndex.START)
    const buttonA = this.controlSystem.getButtonInput(this.controlSystem.buttonIndex.A)

    if (buttonDown && this.biosMenuCursor < 4) {
      this.biosMenuCursor++
    } else if (buttonUp && this.biosMenuCursor > 1) {
      this.biosMenuCursor--
    } else if ((buttonStart || buttonA)) {
      this.biosMenuNumber = this.biosMenuCursor
    }
  }

  /**
   * 바이오스의 inputTestMenu
   */
  biosInputTest () {
    const mouseX = this.controlSystem.getMouseX()
    const mouseY = this.controlSystem.getMouseY()
    const isMouseDown = this.controlSystem.getMouseDown()

    // 변수명 줄여쓰기...
    const index = this.controlSystem.buttonIndex
    const push = this.controlSystem.isButtonDown
    const key = this.controlSystem.getKeyBindMap()

    // 버튼이 눌려있으면 true를 표시하고 아닐경우 아무것도 표시하지 않습니다.
    const buttonLeft = push[index.LEFT] ? true : ''
    const buttonRight = push[index.RIGHT] ? true : ''
    const buttonUp = push[index.UP] ? true : ''
    const buttonDown = push[index.DOWN] ? true : ''
    const buttonA = push[index.A] ? true : ''
    const buttonB = push[index.B] ? true : ''
    const buttonX = push[index.X] ? true : ''
    const buttonY = push[index.Y] ? true : ''
    const buttonL1 = push[index.L1] ? true : ''
    const buttonL2 = push[index.L2] ? true : ''
    const buttonR1 = push[index.R1] ? true : ''
    const buttonR2 = push[index.R2] ? true : ''
    const buttonStart = push[index.START] ? true : ''
    const buttonSelect = push[index.SELECT] ? true : ''

    // keyboard only
    const keyESC = push[index.ESC] ? true : ''
    const keyF2 = push[index.F2] ? true : ''

    // 텍스트 입력
    const text = [
      'MOUSE: ' + isMouseDown + ' (' + mouseX + ', ' + mouseY + ')',
      'BUTTON-KEYBOARD  -TEST',
      'LEFT  -'+ key[index.LEFT].padEnd(10, ' ') + '-' + buttonLeft,
      'RIGHT -'+ key[index.RIGHT].padEnd(10, ' ') + '-' + buttonRight,
      'UP    -'+ key[index.UP].padEnd(10, ' ') + '-' + buttonUp,
      'DOWN  -'+ key[index.DOWN].padEnd(10, ' ') + '-' + buttonDown,
      'A     -'+ key[index.A].padEnd(10, ' ') + '-' + buttonA,
      'B     -'+ key[index.B].padEnd(10, ' ') + '-' + buttonB,
      'X     -'+ key[index.X].padEnd(10, ' ') + '-' + buttonX,
      'Y     -'+ key[index.Y].padEnd(10, ' ') + '-' + buttonY,
      'L1    -'+ key[index.L1].padEnd(10, ' ') + '-' + buttonL1,
      'L2    -'+ key[index.L2].padEnd(10, ' ') + '-' + buttonL2,
      'R1    -'+ key[index.R1].padEnd(10, ' ') + '-' + buttonR1,
      'R2    -'+ key[index.R2].padEnd(10, ' ') + '-' + buttonR2,
      'START -'+ key[index.START].padEnd(10, ' ') + '-' + buttonStart,
      'SELECT-'+ key[index.SELECT].padEnd(10, ' ') + '-' + buttonSelect,
      ' ',
      'KEYBOARD ONLY-TEST',
      'ESC(CANCLE)-' + key[index.ESC].padEnd(6, ' ') + '-' + keyESC,
      'F2(BIOS)   -' + key[index.F2].padEnd(6, ' ') + '-' + keyF2,
      ' ',
      'L1 + L2 BUTTON TO EXIT'
    ]

    for (let i = 0; i < text.length; i++) {
      this.biosTextOutput(text[i], i)
    }

    // L1 + L2 BUTTON TO EXIT
    if (buttonL1 && buttonL2) {
      this.biosMenuNumber = 0
    }
  }

  /**
   * 바이오스에 출력할 글자를 위치와 함께 지정합니다. (고정폭 폰트)
   * 
   * 줄 구분을 위하여 y축은 2픽셀만큼 공백을 추가합니다.
   * @param {string} text 입력할 텍스트
   * @param {number} yLine 출력할 시작 지점 텍스트의 y축 줄번호
   */
  biosTextOutput (text = '', yLine = 0) {
    const wordWidth = GraphicSystem.bitmapFont.width * 2
    const wordHeight = GraphicSystem.bitmapFont.height * 2
    const marginWidth = 8
    const marginHeight = 8
    const lineSpace = 4

    let xMaxWord = Math.floor(this.graphicSystem.CANVAS_WIDTH / wordWidth) - 1
    let y = yLine * (wordHeight + lineSpace)

    let exceedWords = ''
    let outputWords = text
    if (text.length >= xMaxWord) {
      exceedWords = text.slice(xMaxWord)
      outputWords = text.slice(0, xMaxWord)
    }

    // 각 x와 y에 4의 값이 추가된건 여백 설정을 위한 것
    this.graphicSystem.bitmapFontDisplay(outputWords, marginWidth, y + marginHeight, wordWidth, wordHeight)
    
    if (exceedWords.length >= 1) {
      this.biosTextOutput(exceedWords, yLine + 1)
    }
  }
}

let tamshooter4 = new TamsaEngine('tamshooter4', 800, 600)
// tamshooter4.graphicSystem

export {
  tamshooter4,
  GraphicSystem,
}