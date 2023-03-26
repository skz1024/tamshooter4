export class TouchPadSystem {
  imageSrc = {
    buttonArrow: 'buttonArrow.png',
    buttonA: 'buttonA.png',
    buttonB: 'buttonB.png',
    buttonX: 'buttonX.png',
    buttonY: 'buttonY.png',
    buttonL1: 'buttonL1.png',
    buttonL2: 'buttonL2.png',
    buttonR1: 'buttonR1.png',
    buttonR2: 'buttonR2.png',
    buttonStart: 'buttonStart.png',
    buttonSelect: 'buttonSelect.png'
  }

  constructor () {
    /** 터치패드에서 사용하는 첫번째 영역 */
    this.elementFirst = document.createElement('div')
    this.elementFirst.style.display = 'flex'
    this.elementFirst.style.opacity = '80%'
    this.elementFirst.id = 'elementFirst'

    /** 첫번째 영역의 레이아웃 영역 */
    this.divAreaFirst = document.createElement('div')
    this.divAreaFirst.style.width = '100vw'
    this.divAreaFirst.style.height = '20vw'
    this.divAreaFirst.style.position = 'relative'
    this.elementFirst.appendChild(this.divAreaFirst)

    this.buttonL1 = this.createButton('15vw', '10vw', {left: '1%'}, this.imageSrc.buttonL1)
    this.buttonL2 = this.createButton('15vw', '10vw', {left: '20%'}, this.imageSrc.buttonL2)
    this.buttonR1 = this.createButton('15vw', '10vw', {right: '1%'}, this.imageSrc.buttonR1)
    this.buttonR2 = this.createButton('15vw', '10vw', {right: '20%'}, this.imageSrc.buttonR2)
    this.buttonStart = this.createButton('10vw', '6vw', {left: '38%', top: '5%'}, this.imageSrc.buttonStart)
    this.buttonSelect = this.createButton('10vw', '6vw', {left: '52%', top: '5%'}, this.imageSrc.buttonSelect)
    this.divAreaFirst.appendChild(this.buttonL1)
    this.divAreaFirst.appendChild(this.buttonL2)
    this.divAreaFirst.appendChild(this.buttonR1)
    this.divAreaFirst.appendChild(this.buttonR2)
    this.divAreaFirst.appendChild(this.buttonStart)
    this.divAreaFirst.appendChild(this.buttonSelect)

    /** 터치패드에서 사용하는 두번째 영역 */
    this.elementSecond = document.createElement('div')
    this.elementSecond.style.display = 'flex'
    this.elementSecond.style.opacity = '80%'

    /** 터치패드에서 사용하는 두번째 영역 */
    this.divAreaSecond = document.createElement('div')
    this.divAreaSecond.style.width = '40vw'
    this.divAreaSecond.style.height = '40vw'
    this.divAreaSecond.style.position = 'relative'
    this.buttonArrow = this.createButton('50%', '50%', {left: '25%', top: '25%'}, this.imageSrc.buttonArrow)
    this.divAreaSecond.style.backgroundColor = '#ADB2D4'
    this.elementSecond.appendChild(this.divAreaSecond)
    this.divAreaSecond.appendChild(this.buttonArrow)

    /** 터치패드에서 사용하는 세번째 영역(그러나, 비어있는 공간입니다.) */
    this.divAreaThird = document.createElement('div')
    this.divAreaThird.style.width = '20vw'
    this.divAreaThird.style.height = '40vw'
    this.elementSecond.appendChild(this.divAreaThird)

    /** 터치패드에서 사용하는 네번째 영역 */
    this.divAreaForth = document.createElement('div')
    this.divAreaForth.style.width = '40vw'
    this.divAreaForth.style.height = '40vw'
    this.divAreaForth.style.position = 'relative'
    this.elementSecond.appendChild(this.divAreaForth)

    this.buttonA = this.createButton('16vw', '16vw', {bottom: '0%', left: '30%'}, this.imageSrc.buttonA)
    this.buttonB = this.createButton('16vw', '16vw', {top: '30%', right: '0%'}, this.imageSrc.buttonB)
    this.buttonX = this.createButton('16vw', '16vw', {top: '30%', left: '0%'}, this.imageSrc.buttonX)
    this.buttonY = this.createButton('16vw', '16vw', {top: '0%', left: '30%'}, this.imageSrc.buttonY)
    this.divAreaForth.appendChild(this.buttonA)
    this.divAreaForth.appendChild(this.buttonB)
    this.divAreaForth.appendChild(this.buttonX)
    this.divAreaForth.appendChild(this.buttonY)
  }

  /**
   * 터치패드에서 새 버튼을 만들 때 사용하는 함수
   * 
   * 이 함수를 사용하면 내부에 이미지 태그까지 포함된 채로 div 태그를 만들어줍니다.
   * @param {string} width 너비, 반드시 문자열로 입력해야 합니다. css값을 넣어야 합니다.
   * @param {string} height 높이, 반드시 문자열로 입력해야 합니다. css값을 넣어야 합니다.
   * @param {{left: string, right: string, top: string, bottom: string}} arrowObject 각 포지션에 따른, 위치값(css 값) 
   * @param {string} imageSrc 이미지의 경로
   */
  createButton (width, height, arrowObject, imageSrc) {
    let element = document.createElement('div')
    element.style.width = width
    element.style.height = height
    element.style.position = 'absolute'
    
    // 해당 값이 있을 때만 값을 적용
    if (arrowObject.left != null) element.style.left = arrowObject.left
    if (arrowObject.right != null) element.style.right = arrowObject.right
    if (arrowObject.top != null) element.style.top = arrowObject.top
    if (arrowObject.bottom != null) element.style.bottom = arrowObject.bottom

    let imageElement = document.createElement('img')
    imageElement.src = imageSrc
    imageElement.style.width = '100%'
    imageElement.style.height = '100%'
    imageElement.style.pointerEvents = 'none'

    element.appendChild(imageElement)

    return element
  }

  bodyInsert () {
    if (document.getElementById('firstElement') == null) {
      document.body.appendChild(this.elementFirst)
      document.body.appendChild(this.elementSecond)
    }
  }
}

export class ControlSystem {
  constructor () {
    
  }

  /** 버튼의 목록 (어떤 버튼인지를 찾을 때 이 상수를 사용해주세요.) */
  buttonIndex = {
    START: 0, SELECT: 1, SYSTEM: 2,
    LEFT: 3, RIGHT: 4, UP: 5, DOWN: 6,
    A: 7, B: 8, X: 9, Y: 10, L1: 11, R1: 12, L2: 13, R2: 14,
    EX1: 15, EX2: 16, EX3: 17, EX4: 18,
  }

  /** 
   * 해당 버튼의 이름 값. 이 값은 일반적으로는 사용하지 않습니다. 
   * @deprecated
   */
  buttonText = {
    START: 'start', SELECT: 'select', SYSTEM: 'system',
    LEFT: 'left', RIGHT: 'right', UP: 'up', DOWN: 'down',
    A: 'A', B: 'B', X: 'X', Y: 'Y', L1: 'L1', R1: 'R1', L2: 'L2', R2: 'R2',
    EX1: 'EX1', EX2: 'EX2', EX3: 'EX3', EX4: 'EX4' 
  }

  /** 키바인드맵(keybindmap) 의 기본값 */
  DEFAULT_KEYBINDMAP = [
    'Enter', 'Space', 'Delete', 
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'z', 'x', 'a', 's', 'd', 'f',  'c', 'v',
    'Digit1', 'Digit2', 'Digit3', 'Digit4']

  ERROR_MESSAGE_BUTTON_OUT_OF_INDEX = 
    '잘못된 버튼의 인덱스가 입력되었습니다. 가능하면 buttonSystem 클래스 내부에 있는 상수 값을 인덱스로 사용하세요.'

  /** 현재 사용하고 있는 키 바인드 맵 */
  currentKeyBindMap = this.DEFAULT_KEYBINDMAP.slice()

  // 자바스크립트에서 새로운 배열을 for문 없이 초기화해서 생성하려면
  // new Array(배열 길이).fill(값) 의 형태를 사용해야 합니다.
  /** 버튼이 입력되었는지 확인하는 배열 (1회 누른것만 감지) */
  isButtonInput = new Array(this.DEFAULT_KEYBINDMAP.length).fill(false)

  /** 버튼이 눌려있는 상태인지 확인하는 배열 (누르는 동안만 true) */
  isButtonDown = new Array(this.DEFAULT_KEYBINDMAP.length).fill(false)

  /** 
   * 버튼이 눌려지기 시작한 후 얼마의 시간이 지났는지 확인하는 배열 
   * (경고: 단위가 초가 아닙니다. 게임 루프 속도에 따라 다를 수 있습니다.)
   */
  buttonPressTime = new Array(this.DEFAULT_KEYBINDMAP.length).fill(0)

  /**
   * 키 바인드 맵을 설정합니다.
   * 
   * 잘못된 버튼을 변경하려 시도한다면 해당 요청은 자동으로 무시됩니다.
   * 
   * 실수 방지를 위해 buttonList의 상수값을 사용해주세요.
   * @param {number | keyBindMap} buttonIndex 버튼의 인덱스 (buttonList의 상수 값 참고)
   * @param {Event.key} keyValue 키값, 자바스크립트 이벤트로 받을 때 e.key의 값, keyCode 사용금지
   */
  setKeyBindMap (buttonIndex, keyValue) {
    if (buttonIndex >= 0 && buttonIndex < this.DEFAULT_KEYBINDMAP.length) {
      this.currentKeyBindMap[buttonIndex] = keyValue
    }
  }

  /** 현재 사용하고 있는 키바인드맵을 가져옵니다. */
  getKeyBindMap () {
    return this.currentKeyBindMap()
  }
  
  /**
   * 특정 버튼을 누른것으로 처리합니다.
   * 
   * 다시 인식시키려면 한번 더 버튼을 다시 눌러야 합니다.
   * @param {number} buttonIndex 버튼의 index (해당 클래스의 buttonIndex 참고)
   */
  setButtonInput (buttonIndex) {
    this.isButtonInput[buttonIndex] = true
  }

  /**
   * 특정 버튼을 누른 상태인것으로 처리합니다. (해당 버튼을 떼기 전까지 지속)
   * 
   * 버튼을 누르고 있는 동안 press 값이 지속적으로 증가합니다. (버튼을 떼면 press 값 초기화)
   * @param {number} buttonIndex 버튼의 index (해당 클래스의 buttonIndex 참고)
   */
  setButtonDown (buttonIndex) {
    this.isButtonDown[buttonIndex] = true
  }

  /**
   * 특정 버튼을 뗀 것으로 처리합니다.
   * 
   * 따라서 버튼을 떼면 input, down상태가 무효가 되고, press값은 초기화됩니다.
   * @param {number} buttonIndex 버튼의 index (해당 클래스의 buttonIndex 참고)
   */
  setButtonUp (buttonIndex) {
    this.isButtonDown[buttonIndex] = false
    this.isButtonInput[buttonIndex] = false
    this.buttonPressTime[buttonIndex] = 0
  }

  /**
   * 현재 버튼이 입력된 상태인지 확인합니다.
   * 한번 확인한 후에는 해당 버튼의 입력상태를 해제합니다. (1회성 입력)
   * @param {number} buttonIndex 
   */
  getButtonInput (buttonIndex) {
    // 버튼이 눌려져있는 상태라면, 이 상태를 제거한 후 ture를 리턴합니다.
    // 왜냐하면 1번만 눌린 상태를 체크해야 하기 때문입니다.
    if (this.isButtonInput[buttonIndex]) {
      this.isButtonInput[buttonIndex] = false
      return true
    } else {
      return false
    }
  }

  /**
   * 현재 버튼이 눌려져 있는 상태인지 확인합니다.
   * @param {number} buttonIndex 
   */
  getButtonDown (buttonIndex) {
    return this.isButtonDown[buttonIndex]
  }

  /**
   * 현재 버튼이 얼마나 오래 눌려져 있었는지 확인합니다.
   * (참고: 단위는 프레임입니다. 시간 단위가 아닙니다.)
   * @param {number} buttonIndex 
   */
  getButtonPress (buttonIndex) {
    return this.buttonPressTime[buttonIndex]
  }

  /**
   * 현재 입력한 키를 기준으로 특정 버튼이 눌렸다는 작업을 처리합니다.
   * @param {string} key 자바스크립트 이벤트 객체의 key값 (event.key 값)
   */
  setButtonKeyDown (key) {
    const keyBindIndex = this.currentKeyBindMap.indexOf(key)
    if (keyBindIndex !== -1) {
      this.setButtonDown(keyBindIndex)
      this.setButtonInput(keyBindIndex)
    }
  }

  /**
   * 현재 입력한 키를 기준으로 특정 버튼을 뗀 작업을 처리합니다.
   * @param {string} key 자바스크립트 이벤트 객체의 key값 (event.key 값)
   */
  setButtonKeyUp (key) {
    const keyBindIndex = this.currentKeyBindMap.indexOf(key)
    if (keyBindIndex !== -1) {
      this.setButtonUp(keyBindIndex)
    }
  }

  /** 버튼 처리에 관한 프로세스 */
  processButton () {

  }


  /** 마우스 x좌표 */ mouseX = 0
  /** 마우스 y좌표 */ mouseY = 0
  /** 마우스 누른상태 확인 */ isMouseDown = false
  /** 마우스 이동 확인 이나 사용하지 않음 */ isMouseMove = false
  /** 마우스 클릭 확인 */ isClicked = false

  /**
   * 현재 마우스의 위치를 설정합니다.
   * 
   * (경고: 이것은 사용자의 마우스 커서 위치를 변경하지 않습니다.)
   * @param {number} offsetX 마우스의 X좌표 (event.offsetX)
   * @param {number} offsetY 마우스의 Y좌표 (event.offsetY)
   */
  setMousePosition (offsetX, offsetY) {
    this.mouseX = offsetX
    this.mouseY = offsetY
  }

  /**
   * 마우스를 누른 상태로 변경합니다.
   * 
   * 이 상태를 해제하려면 setMouseUp을 사용해주세요.
   */
  setMouseDown () {
    this.isMouseDown = true
  }

  /**
   * 마우스를 누른 상태를 해제합니다.
   * 
   * 마우스를 누른 상태로 만드려면 setMouseDown을 사용해주세요.
   */
  setMouseUp () {
    this.isButtonDown = false
  }

  /**
   * 마우스의 현재 좌표값을 가져옵니다.
   * @returns {{x: number, y: number}} x좌표와 y좌표의 값이 있는 객체
   */
  getMousePosition () {
    return {
      x: this.mouseX,
      y: this.mouseY
    }
  }

  /** 마우스의 x좌표를 가져옵니다. */
  getMouseX () {
    return this.mouseX
  }

  /** 마우스의 y좌표를 가져옵니다. */
  getMouseY () {
    return this.mouseY
  }

  /**
   * 마우스 클릭 여부
   * 
   * (마우스 down 여부는 검사하지 않습니다.)
   */
  getMouseClick () {
    if (this.isClicked) {
      this.isClicked = false
      return true
    } else {
      return false
    }
  }

  /**
   * x, y 위치에 클릭이 되었다고 설정합니다. (mouseDown과 별개)
   * @param {number} x x좌표
   * @param {number} y y좌표
   */
  setClick (x, y) {
    this.isClicked = true
    this.mouseX = x
    this.mouseY = y
  }
}



// addEventListener('click', (e) => {
//   if (e.button === 0) {
//     c.setMouseDown()
//     r.textContent = 'clicked: ' + c.getMouseX() + ', ' + c.getMouseY()
//   }
// })
// addEventListener('mousemove', (e) => {
//   c.setMousePosition(e.offsetX, e.offsetY)
//   p.textContent = '' + e.offsetX + ', ' + e.offsetY
// })

// addEventListener('touchstart', (e) => {
//   var rect = e.target.getBoundingClientRect();
//   var offsetX = e.targetTouches[0].pageX - rect.left;
//   var offsetY = e.targetTouches[0].pageY - rect.top;

//   c.setMousePosition(offsetX, offsetY)
//   p.textContent = '' + offsetX + ', ' + offsetY
  
// })



/**
  게임에서 사용하는 키 목록
  - 메뉴 화면(메뉴 선택)
  A: 결정, B: 취소, X: 사용안함, Y: 사용안함,
  arrowButton: 커서 이동,
  systemEnter: A버튼이랑 동일,
  systemEsc: B버튼이랑 동일,

  - 게임 화면(던전 진행)
  A: 샷 발사 on/off(기본 설정), B: 무기 변경,
  SKILL1 ~ 4: 스킬 사용(4개의 버튼, 기본값은 아마도 X, Y, L, R),
  systemEnter, systemEsc: 일시정지

  참고사항
  SYSTEM과 BUTTON은 서로 다른 개념의 버튼입니다. SYSTEM은 메뉴 선택에,
  변수를 직접 수정하지 말고, set함수를 활용하세요. 안그러면 유지보수가 어렵습니다.
  함수에 대한 설명은 각 함수의 주석 설명을 참고하세요.
*/
export class buttonSystem {
  /**
   * 시스템 키: 결정 버튼, BUTTON_ENTER 와 BUTTON_A 랑 같은 키 입니다.
   * 편의상 메뉴 선택에는 BUTTON_A 와 BUTTON_ENTER가 같은 역할을 수행합니다.
   */
  static BUTTON_MENU_SELECT = 19

  /**
   * 시스템 키: 취소 및 뒤로가기 버튼, BUTTON_ESC 와 BUTTON_B 랑 같은 키 입니다.
   * 편의상 메뉴 선택에는 BUTTON_A 와 BUTTON_ENTER가 같은 역할을 수행합니다.
   */
  static BUTTON_MENU_CANCEL = 20

  /** 메뉴에선 결정버튼, 게임 내에선 일시정지 */ static BUTTON_ENTER = 0
  /** 메뉴에선 취소버튼. 게임 내에선 일시정지 */ static BUTTON_ESC = 1
  /** 메뉴에선 결정버튼, A버튼, 게임 내에선 무기 on/off */ static BUTTON_A = 2
  /** 메뉴에선 취소버튼, B버튼, 게임 내에선 무기 변경 */ static BUTTON_B = 3
  /** 스킬1 버튼, X버튼 */ static BUTTON_SKILL0 = 4
  /** 스킬2 버튼, Y버튼 */ static BUTTON_SKILL1 = 5
  /** 스킬3 버튼, 아마도 L버튼 */ static BUTTON_SKILL2 = 6
  /** 스킬4 버튼, 아마도 R버튼 */ static BUTTON_SKILL3 = 7
  /** 화살표키 왼쪽, 왼쪽 버튼 */ static BUTTON_LEFT = 8
  /** 화살표키 오른쪽 , 오른쪽 버튼 */ static BUTTON_RIGHT = 9
  /** 화살표키 위쪽, 왼쪽 버튼 */ static BUTTON_UP = 10
  /** 화살표키 아래쪽, 아래쪽 버튼 */ static BUTTON_DOWN = 11
  /** 특수키1 */ static BUTTON_SPECIAL1 = 12
  /** 특수키2 */ static BUTTON_SPECIAL2 = 13

  /**
   * 키바인드맵(keybindmap) 의 기본값
   */
  static DEFAULT_KEYBINDMAP = ['Enter', 'Escape', 'z', 'x', 'a', 's', 'd', 'f', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'c', 'v']

  static ERROR_MESSAGE_BUTTON_OUT_OF_INDEX = '잘못된 버튼의 인덱스가 입력되었습니다. 가능하면 buttonSystem 클래스 내부에 있는 상수 값을 인덱스로 사용하세요.'

  /**
   * keyBindMap: 버튼에 인덱스에 대응되는 키 값의 배열
   */
  static #keyBindMap = this.DEFAULT_KEYBINDMAP.slice()

  // 자바스크립트에서 새로운 배열을 for문 없이 초기화해서 생성하려면
  // new Array(배열 길이).fill(값) 의 형태를 사용해야 합니다.
  static #isButtonInput = new Array(this.DEFAULT_KEYBINDMAP.length).fill(false)
  static #isButtonDown = new Array(this.DEFAULT_KEYBINDMAP.length).fill(false)
  static #isButtonDelay = new Array(this.DEFAULT_KEYBINDMAP.length).fill(0)
  static #isButtonDelayCount = new Array(this.DEFAULT_KEYBINDMAP.length).fill(0)

  /**
   * 키 바인드 맵을 설정합니다.
   * @param {number | keyBindMap} buttonIndex 버튼의 인덱스, 또는 keyBindMap의 오브젝트
   * @param {Event.key} key 키값, 자바스크립트 이벤트로 받을 때 e.key의 값, keyCode 사용금지
   */
  static setKeyBindMap (buttonIndex, key) {
    if (typeof buttonIndex === 'number') {
      this.#keyBindMap[buttonIndex] = key
    } else if (typeof buttonIndex === 'object') {
      this.#keyBindMap = buttonIndex
    } else {
      throw new Error('함수에 값이 필요합니다. button(버튼)의 index(인덱스) 또는 keyBindMap의 배열 객체를 지정하세요.')
    }
  }

  /**
   * 이 함수는 디버그용입니다...?
   * @returns 현재 keyBindMap의 객체
   */
  static getKeyBindMap () {
    return this.#keyBindMap
  }

  /**
   * 버튼이 입력되었는지를 확인합니다. buttonDown과는 다르게 버튼을 쭉 눌러도 한번만 인식합니다.
   * @param {number} buttonIndex
   */
  static setButtonInput (buttonIndex) {
    if (buttonIndex !== -1 && buttonIndex < this.#isButtonInput.length) {
      this.#isButtonInput[buttonIndex] = true
    } else {
      throw new Error(this.ERROR_MESSAGE_BUTTON_OUT_OF_INDEX)
    }
  }

  /**
   * 버튼이 입력중인지를 확인합니다. 버튼을 누르는동안 계속 인식합니다.
   * @param {number} buttonIndex
   */
  static setButtonDown (buttonIndex) {
    if (buttonIndex !== -1 && buttonIndex < this.#isButtonInput.length) {
      this.#isButtonDown[buttonIndex] = true
    } else {
      throw new Error(this.ERROR_MESSAGE_BUTTON_OUT_OF_INDEX)
    }
  }

  /**
   * 버튼이 떼어졌는지(눌렀다 뗀거)를 확인합니다. 버튼을 떼어있는동안 계속 인식합니다.
   * 버튼이 뗀 상태에서는 input도 인식하지 않습니다.
   * @param {*} buttonIndex
   */
  static setButtonUp (buttonIndex) {
    if (buttonIndex !== -1 && buttonIndex < this.#isButtonDown.length) {
      this.#isButtonDown[buttonIndex] = false
      this.#isButtonInput[buttonIndex] = false
    } else {
      throw new Error(this.ERROR_MESSAGE_BUTTON_OUT_OF_INDEX)
    }
  }

  /**
   * 현재 버튼이 한번 누른건지 확인합니다. input기 때문에 한번 true를 리턴하면
   * 그 다음에 또 버튼을 누르지 않는이상 false가 리턴됩니다. 즉, 한번만 누른걸 감지합니다.
   * BUTTON_MENU로 시작하는 index값을 넣으면 해당하는 기능과 연결된 버튼을 확인합니다.
   * @param {number} buttonIndex buttonSystem.상수값인덱스
   * @returns true or false (참 또는 거짓 값)
   */
  static getButtonInput (buttonIndex) {
    // 버튼이 눌린걸 초기화해야하므로 값을 리턴하기 전에 true값을 false값으로 바꾸는 과정이 필요합니다.

    if (buttonIndex === this.BUTTON_MENU_SELECT) {
      // 메뉴 선택 버튼은 A버튼 또는 ENTER버튼입니다.
      if (this.#isButtonInput[this.BUTTON_A] || this.#isButtonInput[this.BUTTON_ENTER]) {
        this.#isButtonInput[this.BUTTON_A] = false
        this.#isButtonInput[this.BUTTON_ENTER] = false
        return true
      } else {
        return false
      }
    } else if (buttonIndex === this.BUTTON_MENU_CANCEL) {
      // 메뉴 췻 버튼은 B버튼 또는 ESC버튼입니다.
      if (this.#isButtonInput[this.BUTTON_B] || this.#isButtonInput[this.BUTTON_ESC]) {
        this.#isButtonInput[this.BUTTON_B] = false
        this.#isButtonInput[this.BUTTON_ESC] = false
        return true
      } else {
        return false
      }
    } else if (buttonIndex < this.#keyBindMap.length) {
      // 키 바인드 인덱스에 해당하는 배열일경우
      const result = this.#isButtonInput[buttonIndex]
      if (result) {
        this.#isButtonInput[buttonIndex] = false
        return true
      } else {
        return false
      }
    } else {
      // 어떠한 키도 해당하지 않을경우
      return false
    }
  }

  /**
   * 현재 버튼이 눌려져 있는 중인지 확인합니다. 버튼이 계속 눌려져 있으면 true입니다.
   * 참고: 메뉴 키는 getButtonDown을 통해 확인할 수 없습니다. 이것은 메뉴 키가 여러번 눌리는것을 막기 위해서입니다.
   * @param {*} buttonIndex 메뉴 버튼을 제외한 값
   * @returns true or false (참 또는 거짓 값)
   */
  static getButtonDown (buttonIndex) {
    if (buttonIndex === this.BUTTON_MENU_SELECT || buttonIndex === this.BUTTON_MENU_CANCEL) {
      return false
    } else if (buttonIndex < this.#isButtonDown.length) {
      return this.#isButtonDown[buttonIndex]
    }
  }

  /**
   * 버튼 Input 초기화 함수
   */
  static clearButtonInput () {
    for (let i = 0; i < this.#isButtonInput.length; i++) {
      this.#isButtonInput[i] = false
    }
  }

  /**
   * keyDown 이므로, buttonDown이랑 같은 개념입니다.
   * 키를 누르는 중일때 해당하는 keyBindMap에 따라 버튼을 누르고 있는 상태가 됩니다.
   * 잘못된 키가 입력되어도 오류메세지는 없고 아무런 일도 수행되지 않습니다.
   * @param {Event.key} key 자바스크립트 이벤트 객체의 key값
   */
  static keyDown (key) {
    const keyBindIndex = this.#keyBindMap.indexOf(key)
    if (keyBindIndex !== -1) {
      this.setButtonDown(keyBindIndex)
    }
  }

  /**
   * keyInput 이므로 buttonInput랑 같은 개념입니다.
   * 키를 누르면 해당하는 keyBindMap에 따라 버튼을 누르게 됩니다.
   * 잘못된 키가 입력되어도 오류메세지는 없고 아무런 일도 수행되지 않습니다.
   * @param {*} key
   */
  static keyInput (key) {
    const keyBindIndex = this.#keyBindMap.indexOf(key)
    if (keyBindIndex !== -1) {
      this.setButtonInput(keyBindIndex)
    }
  }

  /**
   * keyUp 이므로 buttonUp랑 같은 개념입니다.
   * 키를 떼면 해당하는 keyBindMap에 따라 버튼을 뗀 상태가 됩니다.
   * 잘못된 키가 입력되어도 오류메세지는 없고 아무런 일도 수행되지 않습니다.
   */
  static keyUp (key) {
    const keyBindIndex = this.#keyBindMap.indexOf(key)
    if (keyBindIndex !== -1) {
      this.setButtonUp(keyBindIndex)
    }
  }
}

/**
 * 마우스 시스템, 아직 미완성
 */
export class mouseSystem {
  /** 마우스 x좌표 */ static offsetX = 0
  /** 마우스 y좌표 */ static offsetY = 0
  /** 마우스 클릭 확인 */ static isMouseDown = false
  /** 마우스 이동 확인 이나 사용하지 않음 */ static isMouseMove = false

  /** 미사용 변수 @deprecated */ static prevOffsetX = 0
  /** 미사용 변수 @deprecated */ static prevOffsetY = 0
  /** 미사용 변수 @deprecated */ static notMouseMoveFrame = 0

  /**
   * mouseDown 이벤트용, 마우스를 클릭한 좌표를 입력합니다.
   * 
   * 참고: 캔버스의 확대/축소, 풀스크린을 사용중이라면, event.offset값을 바로 넣지 말고
   * 추가적인 계산을 해서 값을 넣어야 합니다. 이 함수에서 마우스의 정확한 좌표 계산을 하는것은 불가능합니다.
   * @param {number} offsetX 마우스의 X좌표 (event.offsetX)
   * @param {number} offsetY 마우스의 Y좌표 (event.offsetY)
   */
  static mouseDown (offsetX, offsetY) {
    this.isMouseDown = true
    this.offsetX = offsetX
    this.offsetY = offsetY
  }

  /**
   * mouseMove 이벤트용, 마우스의 현재 좌표를 입력합니다.
   * 
   * 현재 이 함수는 게임에서 사용한 경우가 없습니다.
   * @deprecated 
   * @param {number} offsetX 마우스의 X좌표 (event.offsetX)
   * @param {number} offsetY 마우스의 Y좌표 (event.offsetY)
   */
  static mouseMove (offsetX, offsetY) {
    this.offsetX = offsetX
    this.offsetY = offsetY
  }

  /**
   * mouseUp 이벤트용, 마우스 Down상태를 해제합니다.
   */
  static mouseUp () {
    this.isMouseDown = false
  }

  /**
   * 마우스의 현재 좌표값을 가져옵니다.
   * @returns x좌표와 y좌표로 이루어진 객체
   */
  static getMousePosition () {
    return {
      x: this.offsetX,
      y: this.offsetY
    }
  }

  /** 마우스의 x좌표 */
  static get x () {
    return this.offsetX
  }

  /** 마우스의 y좌표 */
  static get y () {
    return this.offsetY
  }

  /** 마우스 다운(클릭) 여부 */
  static getMouseDown () {
    if (this.isMouseDown) {
      this.isMouseDown = false
      return true
    } else {
      return false
    }
  }

  /**
   * 마우스 이동 여부 (해당 함수는 사용 안함)
   * @deprecated
   */
  static getMouseMove () {
    return this.isMouseMove
  }
  
}
