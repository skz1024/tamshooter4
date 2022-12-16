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
