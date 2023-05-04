//@ts-check

import { ControlSystem } from "./control.js";
import { GraphicSystem } from "./graphic.js";
import { SoundSystem } from "./sound.js";

/**
 * tamsaEngine에서 사용하는 메뉴 구성을 간단하게 만들기 위한 클래스
 */
class BiosMenu {
  /** 메뉴의 커서 번호 */ cursor = 0

  /** 
   * 헤더 필드(머릿말)
   * @type {string[]}
   */
  headerField = []

  /**
   * 메뉴 필드(메뉴의 목록을 표시)
   * @type {string[]}
   */
  menuField = []

  /** 
   * 푸터 필드(꼬릿말)
   * @type {string[]}
   */
  footerField = []

  /**
   * 바이오스 메뉴를 간단하게 만들기 위한 함수...
   * 
   * 메뉴는 위아래 아래로 내려가는 방식입니다.
   * 
   * 텍스트 수정은 textEdit로 해주세요.
   * @param {GraphicSystem} graphic 그래픽 출력기 (텍스트 출력 용도)
   * @param {ControlSystem} control 조작기 (키보드 및 조작 기능 인식 용도)
   */
  constructor(graphic, control) {
    if (!graphic && !control) {
      console.warn('please decide graphic and control')
      return
    }

    this.graphic = graphic
    this.control = control
  }

  /**
   * @param {string[]} headerField 머리말(배열로 한줄씩 표시)
   * @param {string[]} menuField 메뉴(배열로 한줄씩 표시) 참고: 이 필드는 자동으로 2칸 들여쓰기를 합니다.(화살표 표시를 위해서)
   * @param {string[]} footerField 꼬리말(배열로 한줄씩 표시)
   */
  textEdit (headerField = [], menuField = [], footerField = []) {
    this.headerField = headerField
    this.menuField = menuField
    this.footerField = footerField
  }

  /**
   * 선택한 메뉴가 몇번인지를 알아봅니다.
   * @returns {number} 메뉴 번호(0부터...) 아무것도 없다면 -1
   */
  getSelectMenu () {
    if (this.control == null) return -1
    if (this.menuField == null) return -1

    let buttonUp = this.control.getButtonInput(this.control.buttonIndex.UP)
    let buttonDown = this.control.getButtonInput(this.control.buttonIndex.DOWN)
    let buttonA = this.control.getButtonInput(this.control.buttonIndex.A)
    let buttonStart = this.control.getButtonInput(this.control.buttonIndex.START)

    let isEnter = buttonA || buttonStart

    if (buttonUp && this.cursor > 0) {
      this.cursor--
    } else if (buttonDown && this.cursor < this.menuField.length - 1) {
      this.cursor++
    }

    if (isEnter) {
      return this.cursor
    } else {
      return -1
    }
  }

  /** 글자 출력 함수 */
  display () {
    let line = 0
    for (let i = 0; i < this.headerField.length; i++) {
      this.textOutput(this.headerField[i], line)
      line++
    }
    for (let i = 0; i < this.menuField.length; i++) {
      this.textOutput('  ' + this.menuField[i], line)

      // 화살표 출력
      if (this.cursor === i) this.textOutput('->', line)

      line++
    }
    for (let i = 0; i < this.footerField.length; i++) {
      this.textOutput(this.footerField[i], line)
      line++
    }
  }

  /**
   * 바이오스에 출력할 글자를 위치와 함께 지정합니다. (고정폭 폰트)
   * 
   * 줄 구분을 위하여 y축은 2픽셀만큼 공백을 추가합니다.
   * @param {string} text 입력할 텍스트 (가능하다면 한줄당 50글자 미만으로 해주세요.)
   * @param {number} yLine 출력할 시작 지점 텍스트의 y축 줄번호
   */
  textOutput (text = '', yLine = 0) {
    if (this.graphic == null || this.graphic.bitmapFont == null) return

    const wordWidth = this.graphic.bitmapFont.baseWidth * 2
    const wordHeight = this.graphic.bitmapFont.baseHeight * 2
    const marginWidth = 8
    const marginHeight = 8
    const lineSpace = 4

    let xMaxWord = Math.floor(this.graphic.CANVAS_WIDTH / wordWidth) - 1
    let y = yLine * (wordHeight + lineSpace)

    let exceedWords = ''
    let outputWords = text
    if (text.length >= xMaxWord) {
      exceedWords = text.slice(xMaxWord)
      outputWords = text.slice(0, xMaxWord)
    }

    // 각 x와 y에 4의 값이 추가된건 여백 설정을 위한 것
    this.graphic.bitmapFontDisplay(outputWords, marginWidth, y + marginHeight, wordWidth, wordHeight)
    
    // 초과되는 글자가 있으면 강제로 다음줄로 넘김(그러나 글자가 넘치도록 작성하는 것은 권장하지 않습니다.)
    if (exceedWords.length >= 1) {
      this.textOutput(exceedWords, yLine + 1)
    }
  }
}

/** 로딩 최적화를 위하여 바이오스를 호출하기 전까지 바이오스 기능이 분리되었습니다. */
class BiosSystem {
  /**
   * tamshooter4에서 사용하는 바이오스 시스템, 이 시스템은 바이오스 호출 명령이 동작하기 전까지 할당되지 않습니다.
   * @param {string} gameTitle
   * @param {string} currentDevice
   * @param {GraphicSystem} graphic 
   * @param {ControlSystem} control 
   * @param {SoundSystem} sound 
   */
  constructor (gameTitle, currentDevice, graphic, control, sound) {
    if (graphic == null || control == null || sound == null) {
      console.error('please insert graphic, control, sound system.')
      return
    }

    /** @type {GraphicSystem} */ this.graphic = graphic
    /** @type {ControlSystem} */ this.control = control
    /** @type {SoundSystem} */ this.sound = sound

    this.bios = {
      /** @type {BiosMenu} */ mainMenu: new BiosMenu(this.graphic, this.control),
      /** @type {BiosMenu} */ inputTest: new BiosMenu(this.graphic, this.control),
      /** @type {BiosMenu} */ soundTest: new BiosMenu(this.graphic, this.control),
      /** @type {BiosMenu} */ graphicTest: new BiosMenu(this.graphic, this.control),
      /** 바이오스 메뉴 번호 */ menuNumber: 0,
      /** 테스트용 버퍼 */ testAudioBuffer: null,
      /** 그래픽 테스트 번호 */ graphicTestNumber: 0,
      /** 그래픽 테스트 서브번호 */ graphicTestSubNumber: 0,
      /** 그래픽 테스트 오브젝트 */ graphicTestObject: {x: 0, y: 0, width: 0, height: 0},
      /** 바이오스 입장 가능 시간 확인용도 */ elapsedFrame: 0,
      /** 현재 바이오스 모드인지 확인 */ isBiosMode: false,
      /** 바이오스에서 나갈 수 있는지에 대한 여부 */ isBiosPossibleExit: true,
      /** 오디오 파일 타입 */ audioFileType: 'mp3',
    }

    this.currentDevice = currentDevice
    this.gameTitle = gameTitle
    this.currentFps = 0
    this.refreshFps = 0
    this.FPS = 0
    this.graphicFps = 0

    /** 바이오스에서 나가달라는 리퀘스트 요청 */
    this.isRequestExit = false
  }

  /** 바이오스에서 나가기 명령에 대한 요청을 받습니다. */
  getExitRequest () {
    return this.isRequestExit
  }

  /**
   * 현재 프레임 상태를 바이오스 클래스에 전달하는 함수
   * @param {number} currentFps 현재 프레임
   * @param {number} refreshFps 갱신 프레임 (모니터 주파수)
   * @param {number} FPS (기준 프레임)
   * @param {number} graphicFps 그래픽 출력 갱신 프레임 (게임 로직과 별개)
   */
  insertFps (currentFps, refreshFps, FPS, graphicFps) {
    this.currentFps = currentFps
    this.refreshFps = refreshFps
    this.FPS = FPS
    this.graphicFps = graphicFps
  }

  /** 
   * 엔진의 바이오스 메뉴: 이것이 실행되면 게임 로직은 동작하지 않습니다. 
   * 
   * 바이오스 입장 방법: select + start버튼을 부팅 2초 이내에 누름
   * 
   * 또는 게임이 없는 경우(process와 display를 사용자가 직접 만들어야만 합니다.)
   */
  biosProcess () {
    if (this.bios == null) return

    // 검은색 화면 출력
    // this.graphicSystem.fillRect(0, 0, this.graphicSystem.CANVAS_WIDTH, this.graphicSystem.CANVAS_HEIGHT, 'darkred')
    this.graphic.fillRect(0, 0, this.graphic.CANVAS_WIDTH, this.graphic.CANVAS_HEIGHT, '#282828')
    
    // 바이오스를 빠져나갈 수 있는 상태가 아니면, 바이오스를 나갔을 때 강제로 0번 메뉴로 이동하도록 변경
    if (this.bios.menuNumber === 4 && !this.bios.isBiosPossibleExit) {
      this.bios.menuNumber = 0
    }

    switch (this.bios.menuNumber) {
      case 0: this.biosProcessMainMenu(); break
      case 1: this.biosProcessInputTest(); break
      case 2: this.biosSoundTest(); break
      case 3: this.biosGraphicTest(); break
      case 4:
        if (this.bios.isBiosPossibleExit) {
          this.isRequestExit = true
        }
        break
    }
  }

  biosProcessMainMenu () {
    if (this.bios == null) return

    this.bios.mainMenu.textEdit(
      ['TAMSAENGINE MENU',
      'created by skz1024 - 2023/04/15',
      'device: ' + this.currentDevice,
      'game name: ' + this.gameTitle,
      '',
      'menu select'],
      ['1. INPUT TEST (KEYBOARD, BUTTON, MOUSE, TOUCH)',
      '2. SOUND TEST',
      '3. GRAPHIC TEST',
      this.bios.isBiosPossibleExit ? '4. EXIT' : ''],
      ['',
      'FPS: ' + this.currentFps]
    )

    this.bios.mainMenu.display()

    let selectMenu = this.bios.mainMenu.getSelectMenu()
    if (selectMenu >= 0) {
      this.bios.menuNumber = selectMenu + 1
    }
  }

  /** 바이오스의 inputTestMenu */
  biosProcessInputTest () {
    if (this.bios == null) return
    const mouseX = this.control.getMouseX()
    const mouseY = this.control.getMouseY()
    const isMouseDown = this.control.getMouseDown()

    // 변수명 줄여쓰기...
    const index = this.control.buttonIndex
    const push = this.control.isButtonDown
    const key = this.control.getKeyBindMap()

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
    const keyF2 = push[index.DEL] ? true : ''
    
    this.bios.inputTest.textEdit(
      [],
      ['INPUT TEST',
      'EXIT'],
      ['',
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
      'ESC(CANCLE) KEYBOARD ONLY-' + key[index.ESC].padEnd(6, ' ') + '-' + keyESC,
      'F2(BIOS)    KEYBOARD ONLY-' + key[index.DEL].padEnd(6, ' ') + '-' + keyF2],
    )

    this.bios.inputTest.display()

    if (this.bios.inputTest.getSelectMenu() === 1) {
      this.bios.menuNumber = 0
    }
  }

  biosSoundTest () {
    if (this.bios == null) return
    this.sound.createBuffer(this.sound.testFileSrc.soundtest)
    this.sound.createBuffer(this.sound.testFileSrc.testMusicMp3)
    this.sound.createBuffer(this.sound.testFileSrc.testMusicOgg)
    this.sound.createAudio(this.sound.testFileSrc.soundtest)
    this.sound.createAudio(this.sound.testFileSrc.testMusicMp3)
    this.sound.createAudio(this.sound.testFileSrc.testMusicOgg)

    let echoValue = this.sound.getMusicEchoValue()
    let warning = this.sound.getIsAudioSuspended()
    let warningText = ''
    if (warning) warningText = 'you must be clicked or keyinput resume audio context'

    let supportText = ''
    if (this.bios.audioFileType === 'mp3') {
      let cache = this.sound.getCacheBuffer(this.sound.testFileSrc.testMusicMp3)
      if (cache == null) supportText = ', waring: not supported'
    } else {
      let cache = this.sound.getCacheBuffer(this.sound.testFileSrc.testMusicOgg)
      if (cache == null) supportText = ', waring: not supported'
    }

    this.bios.soundTest.textEdit(
      ['SOUND TEST',
      'WEB AUDIO API MODE: ' + this.sound.getWebAudioMode()],
      ['SOUND PLAY',
      'BUFFER SOUND PLAY',
      'MUSIC PLAY',
      'BUFFER MUSIC PLAY (NOT AVLIABLE)',
      'MUSIC STOP',
      'FILE TYPE(MUSIC):' + this.bios.audioFileType + supportText,
      'ECHO(MUSIC) VALUE: ' + echoValue.echo.toFixed(1),
      'FEEDBACK(MUSIC) VALUE: ' + echoValue.feedback.toFixed(1),
      'DELAY(MUSIC) VALUE: ' + echoValue.delay.toFixed(1),
      'FADE TEST',
      'EXIT'],
      ['',
      'if you don\'t use web audio, ',
      'echo effect not available.',
      'notice: sound echo, music echo is different',
      '',
      warningText]
    )

    switch (this.bios.soundTest.getSelectMenu()) {
      case 0: 
        this.sound.play(this.sound.testFileSrc.soundtest)
        break
      case 1:
        this.sound.playBuffer(this.sound.testFileSrc.soundtest)
        break
      case 2:
        if (this.bios.audioFileType === 'mp3') {
          this.sound.musicPlay(this.sound.testFileSrc.testMusicMp3)
        } else {
          this.sound.musicPlay(this.sound.testFileSrc.testMusicOgg)
        }
        break
      case 3:
        if (this.bios.audioFileType === 'mp3') {
          this.sound.musicBuffer(this.sound.testFileSrc.testMusicMp3)
        } else {
          this.sound.musicBuffer(this.sound.testFileSrc.testMusicOgg)
        }
        break
      case 4: this.sound.musicStop(); break
      case 5:
        if (this.bios.audioFileType === 'mp3') {
          this.bios.audioFileType = 'ogg'
        } else {
          this.bios.audioFileType = 'mp3'
        }
        break
      case 6:
        let currentEcho = echoValue.echo
        let setEcho = currentEcho + 0.1
        if (setEcho > 1) setEcho = 0
        this.sound.setMusicEcho(setEcho, -1, -1)
        break
      case 7:
        let currentFeedBack = echoValue.feedback
        let setFeedBack = currentFeedBack + 0.1
        if (setFeedBack > 1) setFeedBack = 0
        this.sound.setMusicEcho(-1, setFeedBack, -1)
        break
      case 8:
        let currentDelay = echoValue.delay
        let setDelay = currentDelay + 0.1
        if (setDelay > 1) setDelay = 0
        this.sound.setMusicEcho(-1, -1, setDelay)
        break
      case 9:
        this.sound.musicFadeNextAudio(null, 2)
        break
      case this.bios.soundTest.menuField.length - 1:
        // soundTest에서 나가기
        this.sound.musicStop()
        // 참고: 바이오스에서전 이전 설정을 기억하지 못합니다.
        // 따라서 게임 내에서 자동으로 재설정되지 않으면 에코 효과가 사라질 수 있습니다.
        this.sound.setMusicEcho(0, 0, 0)
        this.bios.soundTest.cursor = 0
        this.bios.menuNumber = 0
        break
    }

    // 에코 기능은 딜레이값이 있어야 의미가 있으므로, 딜레이가 없다면 강제로 특정값으로 설정됩니다.
    if (echoValue.echo !== 0 && echoValue.delay === 0) {
      this.sound.setMusicEcho(-1, -1, 0.1)
    }
    
    this.bios.soundTest.display()
  }

  biosGraphicTest () {
    if (this.bios == null) return
    let currentBios = this.bios
    this.bios.graphicTest.textEdit(
      ['GRAPHIC TEST',
      'FPS: ' + this.currentFps + '/' + this.FPS + ', GRAPHIC FPS: ' + this.graphicFps,
      'REFRESH RATE: ' + this.refreshFps + 'Hz',
      'DISPLAY: ' + this.graphic.canvas.clientWidth + 'x' + this.graphic.canvas.clientHeight,
      'CANVAS SIZE: ' + this.graphic.canvas.width + 'x' + this.graphic.canvas.height,
      'canvas display is auto sized',
      ''],
      ['1. fillRect',
      '2. MeterRect',
      '3. Gradient(Linear)',
      '4. alpha test',
      '5. image draw',
      '6. filp test',
      '7. rotate test',
      '8. rect object rotate',
      '9. exit']
    )
    let testObj = this.bios.graphicTestObject
    let color = ['darkred', 'darkblue', 'darkgreen', 'darkmagenta', 'darkorange']
    let randomPosition = () => {
      testObj.width = 100
      testObj.height = 100
      testObj.x = Math.random() * (this.graphic.canvas.width - testObj.width)
      testObj.y = Math.random() * (this.graphic.canvas.height - testObj.height)
    }
    let fillRectTest = () => {
      let currentColor = color[currentBios.graphicTestSubNumber % color.length]
      this.graphic.fillRect(testObj.x, testObj.y, testObj.width, testObj.height, currentColor)
    }
    let meterRectTest = () => {
      testObj.x = 0
      testObj.y = this.graphic.canvas.height - 100
      testObj.width = this.graphic.canvas.width
      testObj.height = 100
      currentBios.graphicTestSubNumber++
      let bgColor = 'black'
      let value = currentBios.graphicTestSubNumber
      const maxValue = 100
      this.graphic.meterRect(testObj.x, testObj.y, testObj.width, testObj.height, color[color.length - 1], value, maxValue, true, bgColor, 1)

      if (value > maxValue) {
        currentBios.graphicTestSubNumber = 0
      }
    }
    let gradientTest = () => {
      let isVertical = currentBios.graphicTestSubNumber % 2 === 0
      if (isVertical) {
        testObj.x = 0
        testObj.y = this.graphic.canvas.height - 100
        testObj.width = this.graphic.canvas.width
        testObj.height = 100
      } else {
        testObj.x = this.graphic.canvas.width - 100
        testObj.y = 0
        testObj.width = 100
        testObj.height = this.graphic.canvas.height
      }
      this.graphic.gradientRect(testObj.x, testObj.y, testObj.width, testObj.height, [color[0], color[1], color[2], color[3], color[4]], isVertical)
    }
    let alphaTest = () => {
      let alpha = [0.2, 0.4, 0.6, 0.8, 1.0]
      this.graphic.setAlpha(alpha[currentBios.graphicTestSubNumber % alpha.length])
      this.graphic.fillRect(200, 200, this.graphic.canvas.width, this.graphic.canvas.height, 'skyblue')
      this.graphic.setAlpha()
    }
    let imageDraw = () => {
      let image = new Image()
      image.src = 'controlButtonImageBackup.png'
      switch (currentBios.graphicTestSubNumber % 4) {
        case 0: this.graphic.imageView(image, 200, 200); break
        case 1: this.graphic.imageView(image, 200, 200, 400, 200); break
        case 2: this.graphic.imageDisplay(image, 0, 0, 100, 100, 200, 200, 400, 200); break
        case 3: this.graphic.imageDisplay(image, 0, 0, 100, 100, 200, 200, 400, 200, 0, 146, 0.7); break
      }
    }
    let flipTest = () => {
      let text = 'this text is flip!'
      let flip = (currentBios.graphicTestSubNumber + 1) % 4
      this.graphic.setFlip(flip)
      this.graphic.bitmapFontDisplay(text, 0, 400, 24, 33)
      this.graphic.setFlip()
    }
    let rotateTest = () => {
      let text = 'this text is rotate!'
      let rotate = ((currentBios.graphicTestSubNumber + 1) % 12) * 30
      this.graphic.setDegree(rotate)
      this.graphic.bitmapFontDisplay(text, 0, 400, 24, 33)
      this.graphic.setDegree()
    }
    let rectRotate = () => {
      currentBios.graphicTestSubNumber++
      let rotate = (currentBios.graphicTestSubNumber % 360)
      this.graphic.setDegree(rotate)
      this.graphic.fillRect(400, 400, 100, 100, color[2])
      this.graphic.setDegree()
    }

    let select = this.bios.graphicTest.getSelectMenu()
    if (select >= 0) {
      if (select + 1 === this.bios.graphicTestNumber) {
        this.bios.graphicTestSubNumber++
      } else {
        this.bios.graphicTestSubNumber = 0
      }

      switch(select + 1) {
        case 1: randomPosition(); break
      }

      this.bios.graphicTestNumber = select + 1
    }
    
    switch (this.bios.graphicTestNumber) {
      case 1: fillRectTest(); break
      case 2: meterRectTest(); break
      case 3: gradientTest(); break
      case 4: alphaTest(); break
      case 5: imageDraw(); break
      case 6: flipTest(); break
      case 7: rotateTest(); break
      case 8: rectRotate(); break
      case 9:
        this.bios.graphicTestNumber = 0
        this.bios.menuNumber = 0
        break
    }

    this.bios.graphicTest.display()
  }
}

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
export class TamsaEngine {
  /** 디바이스 구분용 문자열 */
  static device = {
    pc: 'pc',
    mobile: 'mobile'
  }

  /** 디바이스 구분용 문자열 */
  device = {
    PC: 'pc',
    MOBILE: 'mobile'
  }

  /**
   * 새로운 게임을 만듭니다. 이 클래스에 내장되어있는 함수들을 이용해 게임을 제작할 수 있습니다.
   * @param {string} gameTitle 게임 타이틀: 브라우저 타이틀에 표시됩니다.
   * @param {number} gameWidth 게임 너비
   * @param {number} gameHeight 게임 높이
   * @param {number} gameFps 초당 게임 프레임 (기본값: 고정 60), 가변방식 사용 불가
   * @param {boolean} isAutoBodyInsertCanvas 캔버스를 body 태그에 자동으로 삽입합니다. (false일경우 사용자가 graphicSystem을 직접 호출해서 캔버스의 출력 지점을 지정해야합니다.)
   * @param {string} resourceSrc 외부 리소스의 경로 (엔진 폴더가 어디에 있는지를 알려주는 경로) 
   */
  constructor (gameTitle, gameWidth, gameHeight, resourceSrc = 'tamsaEngine', gameFps = 60, isAutoBodyInsertCanvas = true) {
    /** 브라우저 타이틀에 표시할 게임 타이틀 */ this.gameTitle = gameTitle
    /** 게임의 너비 (캔버스의 너비) */ this.gameWidth = gameWidth
    /** 게임의 높이 (캔버스의 높이) */ this.gameHeight = gameHeight
    /** 초당 게임 프레임 */ this.gameFps = gameFps
    /** 해당 게임의 기준 프레임 (고정 프레임 간격) */ this.FPS = gameFps
    /** 프레임 호출횟수 */ this.frameCount = 0
    /** 에니메이션 프레임 호출횟수 */ this.refreshCount = 0
    /** 그래픽 fps (프로세스와 별개), 30 또는 60으로만 설정 가능 */ this.graphicFps = 60

    /** 현재 프레임 */ this.currentFps = 0
    /** 초당 리프레시 횟수(모니터 주사율) */ this.refreshFps = 0
    /** 게임에서 진행된 총 프레임 수 */ this.elaspedFrame = 0

    // 기본 초기화 작업 (재수행 될 수 없음.)
    // 캔버스 등록 및 브라우저 화면에 표시(이 위치를 수정해야 겠다면, 수동으로 캔버스를 지정해주세요.)
    /** 해당 엔진에서 사용하는 그래픽 시스템 */
    this.graphic = new GraphicSystem(gameWidth, gameHeight, resourceSrc)
    
    /** 해당 엔진에서 사용하는 컨트롤 시스템 */
    this.control = new ControlSystem(resourceSrc)
    this.control.addEventMouseTouch(this.graphic.canvas)

    /** 해당 엔진에서 사용하는 사운드 시스템 */
    this.sound = new SoundSystem(true, resourceSrc)

    document.body.style.backgroundColor = '#181818'

    // canvas를 바로 body 영역에 삽입
    if (isAutoBodyInsertCanvas) {
      this.graphic.bodyInsert()
    }

    // 제목 설정
    document.title = gameTitle

    // 참고: 모든 setInterval, requestAnimation은 함수를 bind (화살표 함수를 이용해) 해서 사용합니다.
    // 그래야만 tamsaEngine의 클래스 내부 변수를 this로 접근할 수 있습니다.
    /** 프레임 확인하는 interval 함수 id, 매 1초마다 실행 */
    this.frameCheckId = setInterval(() => this.framePerSecondsCheck(), 1000)

    /** animationFrame의 id 저장용 */
    this.animationId = requestAnimationFrame(() => this.animation())

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
      this.control.createTouchButton()
    }

    /** 바이오스 모드 사용 여부 (사용자가 실행하거나 게임이 없는 경우에 바이오스가 자동으로 실행됨) */
    this.isBiosMode = false

    /** 바이오스 */
    this.bios = null

    /** 바이오스에서 나갈 수 있는지에 대한 여부 */
    this.isBiosPossibleExit = true
  }

  /** 1초마다 몇 프레임이 카운트 되었는지를 확인하고, 이를 fps에 반영합니다. */
  framePerSecondsCheck () {
    this.currentFps = this.frameCount
    this.refreshFps = this.refreshCount
    this.frameCount = 0
    this.refreshCount = 0
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

    // 리프레시 카운트 증가(모니터 주파수 계산)
    this.refreshCount++

    // 진행시간 = 타임스탬프 - 그 다음 시간
    const elapsed = this.timestamp - this.thenAnimationTime
    if (elapsed >= fpsInterval) { // 진행시간이 fps간격 이상일 때
      // 그 다음시간 = 타임스탬프값에서 (진행시간값의 fps간격의 나머지)을 뺀다.
      this.thenAnimationTime = this.timestamp - (elapsed % fpsInterval)
      this.frameCount++

      if (this.elaspedFrame < 120) {
        this.elaspedFrame++
        let buttonStart = this.control.getButtonDown(this.control.buttonIndex.START)
        let buttonSelect = this.control.getButtonDown(this.control.buttonIndex.SELECT)
        let buttonDelete = this.control.getButtonInput(this.control.buttonIndex.DEL)

        if (buttonStart && buttonSelect) {
          this.isBiosMode = true
          this.control.setButtonUp(this.control.buttonIndex.START)
        } else if (buttonDelete) {
          this.isBiosMode = true
        }
      }

      if (this.isBiosMode) {
        if (this.bios === null) {
          this.bios = new BiosSystem(this.gameTitle, this.currentDevice, this.graphic, this.control, this.sound)
        } else {
          this.bios.biosProcess()
          this.bios.insertFps(this.currentFps, this.refreshFps, this.FPS, this.graphicFps)
          if (this.bios.bios != null) this.bios.bios.isBiosPossibleExit = this.isBiosPossibleExit
        }

        if (this.bios.getExitRequest()) {
          this.isBiosMode = false
        }
      } else {
        this.process() // 프로세스는 무조건 정해진 프레임으로만 실행(그래픽과는 별개)

        if (this.graphicFps === 60) {
          this.display() // 60프레임 매 출력
        } else if (this.graphicFps === 30) {
          if (this.elaspedFrame % 2 === 1) {
            this.display() // 30프레임 매 출력
          }
        }
      }

      // 사실 이렇게 된건 firefox의 setInterval이 느리게 작동하기 때문이다.
      // 어쩔수 없이 requsetAnimationFrame을 사용해야 한다.
    }

    requestAnimationFrame(() => this.animation())
  }

  /** 
   * 게임에서의 로직: 이 함수의 내용을 변경해주세요.  
   * 
   * 참고: 여기다가 출력 로직을 넣어도 게인 내부적으로는 상관이 없지만, 그래도 구분하는것을 추천합니다.
   */
  process () {
    // 아무것도 없음
    // 아무 로직도 없으면 바이오스를 실행시킴
    this.isBiosMode = true
    this.isBiosPossibleExit = false
  }

  /** 
   * 게임에서의 출력: 이 함수의 내용을 변경해주세요.  
   * 
   * 기본적으로 출력과 관련된 모든 함수를 여기서 사용합니다. 
   * 게임에 대한 로직 처리를 display 함수에서 하는건 권장하지 않습니다.
   */
  display () {
    // 아무것도 없음
  }

  /** 엔진에서의 부팅 과정 (파일 로드를 포함합니다.) */
  botting () {
    // 아무것도 없음
  }
}