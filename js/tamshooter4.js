"use strict"

import { buttonSystem, mouseSystem } from "./control.js"
import { soundFile, soundSystem } from "./sound.js"
import { imageFile } from "./image.js"
import { fieldSystem } from "./field.js"
import { graphicSystem } from "./graphic.js"


/** 프레임카운트 */ 
let frameCount = 0

/** 현재 프레임 */ 
let currentFps = 0

/** 프레임 카운트 1초마다 리셋, 해당 함수는 setInterval(fpsCheck, 1000) 에 의해 실행됨 */
function fpsCheck () {
  currentFps = frameCount
  frameCount = 0
}
setInterval(fpsCheck, 1000)


class BoxObject {
  /**
   * 클릭 가능한 BoxObject입니다. 사실상 tamshooter4의 오브젝트 본체
   * @param {number} x Box의 x좌표 
   * @param {number} y Box의 y좌표
   * @param {number} width Box의 길이
   * @param {number} height Box의 높이
   * @param {string} text Box에 입력할 텍스트
   * @param {string} color Box의 색깔 (endColor를 사용할경우 그라디언트의 시작 색상)
   * @param {string} endColor Box의 그라디언트의 끝색깔, endColor가 null일경우 그라디언트 없음. 기본값 null
   */
  constructor (x, y, width, height, text = '', color = 'silver', endColor = null, focusColor = 'blue') {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.text = text
    this.clicked = false
    /** Box의 색깔 (endColor를 사용할경우 그라디언트의 시작 색상) */ this.color = color
    /** Box의 그라디언트의 끝색깔, endColor가 null일경우 그라디언트 없음. 기본값 null */ this.endColor = endColor
    this.borderWidth = 1
    this.borderColor = 'black'

    // focus display
    this.focus = false
    this.focusColor = focusColor
  }

  /**
   * 박스가 마우스 위에 있는지 충돌 여부를 검사
   * @param {*} mouseX 
   * @param {*} mouseY 
   * @returns 
   */
  collision (mouseX, mouseY) {
    if ( (this.x <= mouseX && this.x + this.width >= mouseX) 
    && (this.y <= mouseY && this.y + this.height >= mouseY) ) {
      return true
    } else {
      return false
    }
  }


  displayBackGround () {
    graphicSystem.fillRect(this.x, this.y, this.width, this.height, this.borderColor)
    if (this.endColor != null) {
      graphicSystem.gradientDisplay(this.x + this.borderWidth, this.y + this.borderWidth, this.width - (this.borderWidth * 2), this.height - (this.borderWidth * 2), this.color, this.endColor)
    } else {
      graphicSystem.fillRect(this.x + this.borderWidth, this.y + this.borderWidth, this.width - (this.borderWidth * 2), this.height - (this.borderWidth * 2), this.color)
    }
  }

  displayFocus () {
    if (this.focus) {
      graphicSystem.fillRect(this.x, this.y, this.width, this.height, this.focusColor, 0.5)
    }
  }

  displayText () {
    // 텍스트
    if (this.text) {
      graphicSystem.fillText(this.text, this.x + this.borderWidth + 2, this.y + this.borderWidth)
    }
  }

  /**
   * 박스를 출력하는 함수
   */
  display () {
    this.displayBackGround()
    this.displayFocus()
    this.displayText()
  }

  /**
   * 박스를 클릭한 경우 (참고: 마우스 좌표값을 넣지 않으면 박스 입장에서 박스를 클릭했는지 알 수 없습니다.)
   * @param {*} mouseX 클릭한 마우스의 x좌표
   * @param {*} mouseY 클릭한 마우스의 y좌표
   */
  click (mouseX, mouseY) {
    if (this.collision(mouseX, mouseY)) {
      this.clicked = true
    } else {
      this.clicked = false
    }
  }

}

/**
 * 메뉴 시스템 인터페이스 (아마도 모든 메뉴는 이 클래스르 상속받아서 구현해야합니다.)
 * 함수의 기능은 상속받는쪽에서 구현해주세요. 부모 함수는 아무런 기능이 없습니다.
 */
 class MenuSystem {
  /** 커서가 가ㅣ키는 박스 번호의 값 */ cursorPosition = 0
  /** 메뉴 선택 여부(ENTER키나 결정버튼(A버튼) 사용) */ selected = false
  /** 취소 선택 여부(ESC키나 취소버튼(B버튼) 사용) */ canceled = false
  
  /** 메뉴에 표시되는 리스트 (박스오브젝트) 
   * @type {BoxObject[]}  
   */
  menuList = []

  
  /** 
   * 로직 처리 함수 (화면 출력을 여기에 출력하면 안됩니다.)  
   * 특별한 일이 없는 경우 process() 함수를 재정의할 필요는 없습니다.
   */ 
  process () {
    this.processButton()
    this.processMouse()
    this.processFocus()
    this.processSelect()
    this.processCancel()
  }

  /** 
   * 로직 처리 - 버튼 입력을 받았을 때 로직을 짜는 함수입니다.  
   * 주의 해야 할 점은, 결정버튼을 눌렀을 때의 처리 결과는 processSelect에서 처리해야 하고,
   * 뤼소버튼을 눌렀을 때의 로직 처리 결과는 processCancel에서 처리해야 합니다.  
   * menuSystem의 processButton 에는 select 버튼과 cancel 버튼을 눌렀을 때 
   * 각각 selected 와 canceled 변수의 값을 true로 만듭니다.
   * 만약 이 함수를 상속받는다면 super.processButton()를 호출하고 그 밑에 로직을 구현해주세요.
   */
  processButton () {
    if (buttonSystem.getButtonInput(buttonSystem.BUTTON_MENU_SELECT)) {
      this.selected = true
    } else if (buttonSystem.getButtonInput(buttonSystem.BUTTON_MENU_CANCEL)) {
      this.canceled = true
    }
  }

  /** 
   * 로직 처리 - 마우스 입력  
   * 만약 이 함수를 상속받는다면 super.processMouse()를 호출하고 그 밑에 로직을 구현해주세요.
   * 부모 함수의 역할은 menuList에 박스가 눌려졌는지를 확인합니다.
   */ 
  processMouse () {
    if (!mouseSystem.getMouseDown()) return

    const mouseX = mouseSystem.getMousePosition().x
    const mouseY = mouseSystem.getMousePosition().y

    for (let i = 0; i < this.menuList.length; i++) {
      let currentBox = this.menuList[i]
      if (currentBox.collision(mouseX, mouseY)) {
        this.cursorPosition = i
        this.selected = true
      }
    }
  }

  /**
   * 로직 처리 - 박스오브젝트의 포커스 처리
   */
  processFocus () {
    for (let i = 0; i < this.menuList.length; i++) {
      if (this.cursorPosition == i) {
        this.menuList[i].focus = true
      } else {
        this.menuList[i].focus = false
      }
    }
  }

  /**
   * 로직 처리 - 메뉴 선택  
   * 이 함수를 재작성할경우, 맨 처음에 if (!this.selectedCheck()) return 문을 넣어주세요.
   * 왜냐하면 중복선택을 방지하기 위함입니다. 부모 함수의 원본에 구현된 로직 코드를 참고해주세요.
   */ 
  processSelect () {
    // 이와 같은 로직을 사용하면, selected가 false일때 이 함수는 실행되지 않습니다.
    if (!this.selectedCheck()) return

    // 이 방법도 있지만 들여쓰기가 필요하고 로직이 복잡할 수 있으므로 사용하진 마세요.
    if (this.selectedCheck()) {
      // 로직...
    }

    // 그러나 이 함수를 호출할 때 절대 이 방식을 사용하지마세요. 비직관적입니다.
    // 구조상 재귀호출 될 염려는 없으므로, 일단은 냅두겠습니다.
    if(this.selectedCheck()) this.processSelect()
  }

  /**
   * selected가 되었는지 확인합니다. 그리고 중복선택을 방지하기 위해 해당 함수를 호출할경우
   * this.selected는 false가 됩니다.
   */
  selectedCheck () {
    if (this.selected) {
      this.selected = false
      return true
    } else {
      return false
    }
  }

  /**
   * 로직 처리 - 취소 선택(B버튼 또는 ESC버튼을 누른 경우)  
   * 이 함수를 재작성할경우, 맨 처음에 if (!this.canceledCheck()) return 문을 넣어주세요.
   * 왜냐하면 중복취소을 방지하기 위함입니다. 그 외의 나머지는 processSelected랑 구조가 동일하므로 
   * processSelected 함수를 살펴보세요.
   */
  processCancel () {
    if (!this.canceledCheck()) return
  }

  /**
   * canceled가 되었는지 확인합니다. 그리고 중복취소를 방지하기 위해 해당 함수를 호출한경우
   * this.selected는 false가 됩니다.
   */
  canceledCheck () {
    if (this.canceled) {
      this.canceled = false
      return true
    } else {
      return false
    }
  }

  /** 화면 출력 함수 (로직을 여기에 처리하면 안됩니다.) */ display () {}
}


class MainSystem extends MenuSystem {
  /** 메뉴: 라운드 선택 */ MENU_ROUND_SELECT = 0
  /** 메뉴: 옵션 */ MENU_OPTION = 1
  /** 메뉴: 데이터 셋팅 @deprecated */ MENU_DATA_SETTING = 2

  constructor () {
    super()
    this.menuList[this.MENU_ROUND_SELECT] = new BoxObject(0, 120, 400, 40, 'round select')
    this.menuList[this.MENU_OPTION] = new BoxObject(0, 160, 400, 40, 'option')
    this.menuList[this.MENU_DATA_SETTING] = new BoxObject(0, 200, 400, 40, 'dataSetting')
  }

  processButton () {
    super.processButton()

    // 버튼 눌렀는지 확인하는 변수, true or false
    const buttonInputUp = buttonSystem.getButtonInput(buttonSystem.BUTTON_UP)
    const buttonInputDown = buttonSystem.getButtonInput(buttonSystem.BUTTON_DOWN)

    if (buttonInputUp && this.cursorPosition > 0) {
      soundSystem.play(soundFile.systemCursor)
      this.cursorPosition--
    } else if (buttonInputDown && this.cursorPosition < this.menuList.length - 1) {
      soundSystem.play(soundFile.systemCursor)
      this.cursorPosition++
    } 
  }

  processSelect () {
    if (!this.selectedCheck()) return

    switch (this.cursorPosition) {
      case this.MENU_OPTION: gameSystem.statusId = gameSystem.STATUS_OPTION; break
      case this.MENU_ROUND_SELECT: gameSystem.statusId = gameSystem.STATUS_ROUNDSELECT; break
    }

    // 사운드 출력
    soundSystem.play(soundFile.systemSelect)
  }
  
  process () {
    this.processMouse()
    this.processButton()
    this.processFocus()
    this.processSelect()
  }

  display () {
    graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, '#78b3f2', '#d2dff6')
    graphicSystem.imageDisplay(imageFile.tamshooter4Title, 0, 0)
    
    for (let i = 0; i < this.menuList.length; i++) {
      this.menuList[i].display()
    }

    graphicSystem.fillText('cursorPosition: ' + this.cursorPosition, 0, 400)
  }
}


class OptionSystem extends MenuSystem {
  MENU_BACK = 0
  MENU_MUSIC = 1
  MENU_SOUND = 2
  MENU_SHOW_ENEMY_HP = 3
  MENU_RESULT_AUTO_SKIP = 4

  optionValue = [null, true, true, true, true]
  
  constructor () {
    super()
    const MENU_X = 400
    const MENU_Y = 0
    const MENU_HEIGHT = 38
    const MENU_LINE_Y = 40
    const MENU_WIDTH = 390
    const boxText = ['<- back', 'music', 'sound', 'show enemy hp(적 체력 보여주기)', 'result auto skip(결과 자동 스킵)']
    const startColor = '#FCCF31'
    const endColor = '#F55555'
    const focusColor = '#763E14'
    
    for (let i = 0; i < boxText.length; i++) {
      this.menuList[i] = new BoxObject(MENU_X, MENU_Y + (MENU_LINE_Y * i), MENU_WIDTH, MENU_HEIGHT, boxText[i], startColor, endColor, focusColor)
    }
  }

  processButton () {
    super.processButton()

    const buttonInputUp = buttonSystem.getButtonInput(buttonSystem.BUTTON_UP)
    const buttonInputDown = buttonSystem.getButtonInput(buttonSystem.BUTTON_DOWN)

    if (buttonInputUp && this.cursorPosition > 0) {
      soundSystem.play(soundFile.systemCursor)
      this.cursorPosition--
    } else if (buttonInputDown && this.cursorPosition < this.menuList.length - 1) {
      soundSystem.play(soundFile.systemCursor)
      this.cursorPosition++
    }
  }

  process () {
    super.process()
  }

  processSelect () {
    if (!this.selectedCheck()) return

    switch (this.cursorPosition) {
      case this.MENU_BACK: this.canceled = true; break
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return

    soundSystem.play(soundFile.systemBack)
    gameSystem.statusId = gameSystem.STATUS_MAIN
  }

  display () {
    graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, '#78b3f2', '#d2dff6')
    
    for (let i = 0; i < this.menuList.length; i++) {
      this.menuList[i].display()
    }
  }
}

/**
 * 메뉴: 라운드 시스템
 */
class RoundSelectSystem extends MenuSystem {

  /** 커서 라운드 */ cursorRound = 1
  /** 최소 라운드: 게임은 1라운드부터 시작 */ MIN_ROUND = 1
  /** 최대 라운드: 8 */ MAX_ROUND = 8

  constructor () {
    super()
    this.menuList.push(new BoxObject(10, 0, 60, 60, '<<', 'orange', 'yellow'))
    for (let i = 1; i <= 9; i++) {
      this.menuList.push(new BoxObject(10 + (i * 80), 0, 60, 60, i + '', 'orange', 'gold'))
    }
    for (let i = 1; i <= 10; i++) {
      this.menuList.push(new BoxObject(10 + ((i - 1) * 80), 80, 60, 60, '1-' + i, 'skyblue', 'white'))
    }
    for (let i = 0; i <= 5; i++) {
      this.menuList.push(new BoxObject(10 + ((i - 1) * 80), 160, 60, 60, '1-A' + i, 'skyblue', 'white'))
    }
  }

  processButton () {
    /* 
    cursorPosition의 범위
    0 ~ 9: 메인 라운드 선택 (어떤 포지션에 있든 상관없음.)
    10 ~ 19: 서브 라운드 선택
    20 ~ 29: 시크릿 라운드 선택 (없을 경우 선택 안됨)
    커서가 이동할 수 없는 지점엔 이동할 수 없음.
    */
    super.processButton()

    // 이 변수들은 버튼 입력 조건문을 간편하게 작성하기 위한 변수입니다.
    const buttonUp = buttonSystem.getButtonInput(buttonSystem.BUTTON_UP)
    const buttonDown = buttonSystem.getButtonInput(buttonSystem.BUTTON_DOWN)
    const buttonLeft = buttonSystem.getButtonInput(buttonSystem.BUTTON_LEFT)
    const buttonRight = buttonSystem.getButtonInput(buttonSystem.BUTTON_RIGHT)

    if (this.cursorPosition >= 0 && this.cursorPosition <= 9) {
      if (buttonDown) {
        this.cursorPosition += 10
        soundSystem.play(soundFile.systemCursor)
      } else if (buttonLeft && this.cursorRound > this.MIN_ROUND) {
        this.cursorRound--
        soundSystem.play(soundFile.systemCursor)
      } else if (buttonRight && this.cursorRound < this.MAX_ROUND) {
        this.cursorRound++
        soundSystem.play(soundFile.systemCursor)
      }
    } else if (this.cursorPosition >= 10 && this.cursorPosition <= 19) {
      if (buttonLeft && this.cursorPosition > 10) {
        this.cursorPosition--
        soundSystem.play(soundFile.systemCursor)
      } else if (buttonRight && this.cursorPosition < 19) {
        this.cursorPosition++
        soundSystem.play(soundFile.systemCursor)
      } else if (buttonUp) {
        this.cursorPosition -= 10
        soundSystem.play(soundFile.systemCursor)
      }
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return

    gameSystem.statusId = gameSystem.STATUS_MAIN
    soundSystem.play(soundFile.systemBack)
  }

  processSelect () {
    if (!this.selectedCheck()) return

    gameSystem.statusId = gameSystem.STATUS_FIELD
  }

  display () {
    this.displayTitle()
    this.displayRound()
    this.displayWorld()
    this.displayInfo()
  }

  displayTitle () {
    for (let i = 0; i < 10; i++) {
      this.menuList[i].display()
    }
  }

  displayRound () {
    for (let i = 10; i <= 25; i++) {
      this.menuList[i].display()
    }
  }

  displayWorld () {
    graphicSystem.strokeRect(0, 240, 800, 300, 'green')
  }

  displayInfo () {
    graphicSystem.strokeRect(400, 160, 400, 80,'pink')
    graphicSystem.fillText('ROUND: ' + this.menuList[this.cursorPosition].text, 400, 160, 400)
  }
}


/**
 * 유저 정보 (static 클래스)
 */
export class userSystem {
  /** 레벨, 직접적인 변경 금지 */ static lv = 1
  /** 경험치: 경험치 값은 addExp, setExp등을 통해 수정해주세요. */ static exp = 0
  /** 쉴드: 데미지 함수를 통해서만 변경해주세요. */ static shield = 200
  /** 쉴드 최대치 */ static shieldMax = 200
  /** 체력 (100% 값처럼 취급됨.) 데미지 함수를 통해서만 변경해주세요. */ static hp = 100
  /** 체력 최대치 */ static hpMax = 100
  /** 공격력(초당) */ static attack = 10000

  /**
   * 경험치 테이블
   */
  static expTable = [  0, // lv 0
    181100, 181200, 181300, 181400, 181500, 181600, 181700, 181800, 181900, 182000, // lv 1 ~ 10
    255500, 256000, 256500, 257000, 257500, 258000, 258500, 259000, 259500, 260000, // lv 11 ~ 20
  ]

  /** 총 플레이 타임 에 관한 정보 */ 
  static playTime = {
    FPS: 60,
    frame: 0,
    second: 0,
    minute: 0,
    hour: 0,
    getTimeString: function () {
      const secondText = this.second <= 9 ? '0' + this.second : '' + this.second
      const minuteText = this.minute <= 9 ? '0' + this.minute : '' + this.minute
      const hourText = this.hour <= 9 ? '0' + this.hour : '' + this.hour

      return hourText + ':' + minuteText + ':' + secondText
    },
    process: function () {
      this.frame++
      if(this.frame >= this.FPS){
        this.frame -= 60
        this.second++
      }
      if(this.second >= 60){
        this.second -= 60
        this.minute++
      }
      if(this.minute >= 60){
        this.minute -= 60
        this.hour++
      }
    },
    /**
     * playTime을 수정하는 함수.
     */
    setData: function (hour, minute, second) {
      this.second = second
      this.minute = minute
      this.hour = hour
    }
  }

  static startDate = {
    year: 0,
    month: 0,
    day: 0,
    hour: 0,
    minute: 0,
    second: 0,
    setCurrentDate: function () {
      const currentDate = new Date()
      this.year = currentDate.getFullYear()
      this.month = currentDate.getMonth() + 1
      this.day = currentDate.getDate()
      this.hour = currentDate.getHours()
      this.minute = currentDate.getMinutes()
      this.second = currentDate.getSeconds()
    },
    setData: function (year, month, day, hour, minute, second) {
      this.year = year
      this.month = month
      this.day = day
      this.hour = hour
      this.minute = minute
      this.second = second
    }
  }

  /**
   * 유저의 playTime을 수정하는 함수.
   * user.playTime.setData() 랑 동일하지만, user에서 직접 수정하는게 더 직관적이라고 생각합니다.
   */
  static setPlayTime (hour, minute, second) {
    this.playTime.setData(hour, minute, second)
  }

  /**
   * 유저의 startDate를 수정하는 함수  
   * 아무 인수도 없으면 현재 날짜로 설정됩니다.
   * @param {number} year 해당 년도, 만약 이 값이 없다면 현재 날짜로 startDate를 자동 설정합니다.
   */
  static setStartDate (year, month, day, hour, minute, second) {
    if (arguments.length === 0) {
      this.startDate.setCurrentDate()
    } else {
      this.startDate.setData(year, month, day, hour, minute, second)
    }
  }

  /**
   * 현재 레벨에 모아야 하는 경험치를 리턴합니다.
   */
  static getExpMax () {
    return this.expTable[this.lv]
  }

  static skill = [
    {coolTime:0},
    {coolTime:0},
    {coolTime:0},
    {coolTime:0}
  ]

  /**
   * 경험치 추가 함수
   * exp 값을 직접 조정하지 마세요.
   * @param {number} value 경험치 값 
   */
  static plusExp (value) {
    this.exp += value
    const maxLevel = this.expTable.length - 1 // 최대 배열길이 - 1이 최대 레벨
    
    // 레벨업 체크
    if (this.lv < maxLevel) {
      let levelUpSound = false
      while (this.exp >= this.expTable[this.lv] && this.lv < maxLevel) {
        this.exp -= this.expTable[this.lv]
        this.lv++
        levelUpSound = true
      }
    }
  }

  static process () {
    this.playTime.process()
  }

  static display () {
    this.displayUserStat()
    // this.displayPlayTime() // 이것은 gameSystem에서만 사용합니다.
  }

  static displayPlayTime () {
    const X = 0
    const Y = 510
    graphicSystem.digitalFontDisplay('PLAY TIME: ' + this.playTime.getTimeString(), X, Y)
  }

  /**
   * 유저의 정보를 출력합니다. [출력 영역은 정해져있음.]
   */
  static displayUserStat () {
    // 레이어 구성은 x: 0, y: 540, w: 800, h:60 을 기준으로 상하좌우 4등분 되어있습니다.
    // 한 레이어당 공간은 400, 30 을 차지합니다. 따라서 총 레이어는 2개입니다.
    // 검은색 선으로 각 레이어를 구분하였습니다.
    const LEFT_X = 0
    const RIGHT_X = graphicSystem.CANVAS_WIDTH_HALF
    const LAYER1_Y = 540
    const LAYER1_DIGITAL_Y = LAYER1_Y + 5
    const LAYER2_Y = 570
    const LAYER2_DIGITAL_Y = LAYER2_Y + 5
    const LAYER_HEIGHT = 30
    const LAYER_WIDTH = graphicSystem.CANVAS_WIDTH_HALF

    // 레이어 색칠하기
    graphicSystem.fillRect(LEFT_X, LAYER1_Y, graphicSystem.CANVAS_WIDTH_HALF, LAYER_HEIGHT , 'lightgrey')
    graphicSystem.fillRect(RIGHT_X, LAYER1_Y, graphicSystem.CANVAS_WIDTH_HALF, LAYER_HEIGHT, 'lightgrey')
    graphicSystem.fillRect(LEFT_X, LAYER2_Y, graphicSystem.CANVAS_WIDTH_HALF, LAYER_HEIGHT, 'lightgrey')

    // x축 레이어 구분선
    graphicSystem.fillLine(LEFT_X, LAYER2_Y, graphicSystem.CANVAS_WIDTH, LAYER2_Y)

    // y축 레이어 구분선
    graphicSystem.fillLine(graphicSystem.CANVAS_WIDTH_HALF, LAYER1_Y, graphicSystem.CANVAS_WIDTH_HALF, graphicSystem.CANVAS_HEIGHT)

    // 체력 게이지 그라디언트 [하늘색]
    const hpPercent = this.hp / this.hpMax
    const HP_WIDTH = Math.floor(LAYER_WIDTH / 2) * hpPercent
    graphicSystem.gradientDisplay(0, LAYER1_Y, HP_WIDTH, LAYER_HEIGHT, '#A99DB7', '#8155C6')

    // 쉴드 게이지 그라디언트 [파란색]
    const shieldPercent = this.shield / this.shieldMax
    const SHIELD_WIDTH = Math.floor(LAYER_WIDTH / 2) * shieldPercent
    graphicSystem.gradientDisplay(0 + HP_WIDTH, LAYER1_Y, SHIELD_WIDTH, LAYER_HEIGHT, '#4B8AFC', '#A7C6FF')

    // 경험치 게이지 그라디언트
    const expPercent = this.exp / this.getExpMax()
    graphicSystem.gradientDisplay(0, LAYER2_Y, LAYER_WIDTH * expPercent, LAYER_HEIGHT, '#FDC830', '#F37335')

    // 인터페이스에 출력할 텍스트 입력
    const hpText = ' ' + this.hp + ' + ' + this.shield + '/' + this.shieldMax
    const shieldText = ''
    const skillCoolTimeText = this.skill[0].coolTime + '. '
    const lvText = 'lv.' + this.lv + ': ' + this.exp + '/' + this.expTable[this.lv]
    const statusText = ''

    graphicSystem.digitalFontDisplay(hpText, LEFT_X, LAYER1_Y) // 유저의 체력 정보
    graphicSystem.digitalFontDisplay(shieldText, HP_WIDTH, LAYER1_Y)
    graphicSystem.digitalFontDisplay(skillCoolTimeText, RIGHT_X, LAYER1_DIGITAL_Y, 12, 20) // 스킬 남은 시간 표시
    graphicSystem.digitalFontDisplay(lvText, LEFT_X, LAYER2_DIGITAL_Y, 12, 20) // 유저의 레벨과 경험치
    graphicSystem.digitalFontDisplay(statusText, RIGHT_X, LAYER2_DIGITAL_Y, 12, 20) // 현재 라운드 정보
  }

  static getPlayerObjectData () {
    return {
      attack: this.attack,
      hp: this.hpMax,
      hpMax: this.hpMax,
      shield: this.shieldMax,
      shieldMax: this.shieldMax
    }
  }
}




/**
 * 게임 시스템 (거의 모든 로직을 처리), 경고: new 키워드로 인스턴스를 생성하지 마세요.
 * 이건 단일 클래스입니다.
 */
export class gameSystem{
  /** 게임 상태 ID */ static statusId = 0
  /** 상태: 메인 */ static STATUS_MAIN = 0
  /** 상태: 게임 옵션 */ static STATUS_OPTION = 1
  /** 상태: 라운드선택 */ static STATUS_ROUNDSELECT = 11
  /** 상태: 필드(게임 진행중) */ static STATUS_FIELD = 12
  /** 게임 첫 실행시 로드를 하기 위한 초기화 확인 변수 */ static isLoad = false
  /** 게임에서 저장된 데이터가 있는지 확인하는 localStorage 키 이름 */ static SAVE_FLAG = 'saveFlag'

  // 일부 시스템은 static을 사용하기 때문에 new를 이용해 인스턴스를 생성하지 않습니다.
  /** 유저 시스템 */ static userSystem = userSystem
  /** 필드 시스템 */ static fieldSystem = fieldSystem
  /** 메인 시스템 */ static mainSystem = new MainSystem()
  /** 옵션 시스템 */ static optionSystem = new OptionSystem()
  /** 라운드 선택 시스템 */ static roundSelectSystem = new RoundSelectSystem()

  /** 
   * 저장하거나 불러올 때 localStorage 에서 사용하는 키 이름 (임의로 변경 금지)  
   * 각 키 별로, 저장 데이터 형식과 저장 목적에 대해 자세히 설명되어있습니다.  
   * 대부분의 저장 형식에서 구분자를 ,(쉼표) 로 사용합니다.
   */
  static saveKey = {
    /** 
     * 게임에서 저장된 데이터가 있는지 확인  
     * 주의: localStoarge를 통해서 받아오는 값은 string입니다. 그래서 'false'값을 저장해도 Boolean('false')를 해서
     * 값을 불러와봐야 어차피 true값이 됩니다.(자바스크립트는 문자열에 값이 있으면 true입니다.)  
     * 이때문에 saveFlag의 값은 'true'로 저장하고, 만약 저장된 데이터가 없으면 null입니다.
     */
    saveFlag: 'saveFlag',

    /** 
     * 플레이 시간  
     * 저장 형식: hour,minute,second,frame 의 문자열 (구분자: ,(쉼표))  
     * 예시: 14,23,7,56 -> 14:23:7 56frame
     */ 
    playTime: 'playTime',

    /**
     * (게임 첫 시작)시작 날짜 및 시간 
     * 저장 형식: year,month,date,hour,minute,second 의 문자열 (구분자: ,(쉼표))  
     * 예시: 2022,03,11,16,26,33 -> 2022/03/11 16:26:33
     */
    startDate: 'startDate',

    /**
     * 저장 시점의 날짜 및 시간  
     * 저장 형식은 startDate랑 동일  
     * 저장 형식: year,month,date,hour,minute,second 의 문자열 (구분자: ,(쉼표))  
     * 예시: 2022,03,11,16,26,33 -> 2022/03/11 16:26:33
     */
    saveDate: 'saveDate'
  }
  /** 저장 지연 시간을 카운트 하는 변수 */ static saveDelayCount = 0
  /** 
   * 게임 실행시 불러오기는 단 한번만 합니다.
   * 기본값: false, 한번 로드했다면 true.  
   * 참고로 새로고침을 한다면 게임을 재실행하기 때문에 불러오기도 합니다.
   */ 
  static initLoad = false

  /**
   * 저장 기능은, 1초에 한번씩 진행됩니다. 달래아 - 지연(시간)  
   * 이 게임 내에서는, 지연 시간을 딜레이란 단어로 표기합니다.
   */
  static processSave () {
    /** 저장 딜레이 시간 */ const SAVE_DELAY = 60

    // 세이브 지연시간보다 세이브 지연 시간을 카운트 한 값이 낮으면 함수는 실행되지 않습니다.
    // 즉, 60frame을 채울때까지 저장 기능은 미루어집니다. 쉽게말하면 1초에 1번씩 저장합니다.
    this.saveDelayCount++ // 세이브 딜레이에 카운트 증가
    if (this.saveDelayCount < SAVE_DELAY) return

    // 세이브 딜레이 초기화
    this.saveDelayCount = 0

    // 한번이라도 저장을 할 경우, saveFlag의 값이 true가 됩니다.
    localStorage.setItem(this.saveKey.saveFlag, 'true')

    // 저장 시간
    const saveDate = new Date()
    const saveDateString = saveDate.getFullYear() + ',' + saveDate.getMonth() + ',' + saveDate.getDay() + ',' + saveDate.getHours() + ',' + saveDate.getMinutes() + ',' + saveDate.getSeconds()
    localStorage.setItem(this.saveKey.saveDate, saveDateString)

    // 유저의 첫 시작 시간
    const startDate = this.userSystem.startDate
    const startDateString = startDate.year + ',' + startDate.month + ',' + startDate.day + ',' + startDate.hour + ',' + startDate.minute + ',' + startDate.second
    localStorage.setItem(this.saveKey.startDate, startDateString)

    // 플레이 타임 저장
    const playTime = this.userSystem.playTime
    const playTimeString = playTime.hour + ',' + playTime.minute + ',' + playTime.second
    localStorage.setItem(this.saveKey.playTime, playTimeString)

    
  }

  /**
   * 불러오기 기능: 게임을 실행할 때 한번만 실행. 만약, 또 불러오기를 하려면 게임을 재시작해주세요.
   */
  static processLoad () {
    // 이미 불러왔다면 함수는 실행되지 않습니다.
    if (this.initLoad) return

    // 초기 불러오기 완료 설정
    this.initLoad = true

    // saveFlag의 값을 불러오고, 만약 아무것도 없다면 불러오기 함수를 사용하지 않습니다.
    const saveFlag = localStorage.getItem(this.saveKey.saveFlag)
    if (!saveFlag) return

    // 플레이 타임 불러오기: 저장 규칙을 모르겠으면, saveKey 객체 내에 있는 변수들의 설명을 참고
    const playTime = localStorage.getItem(this.saveKey.playTime).split(',')
    this.userSystem.setPlayTime(playTime[0], playTime[1], playTime[2])

    // 시작 날짜 및 시간 불러오기
    const startDate = localStorage.getItem(this.saveKey.startDate).split(',')
    this.userSystem.setStartDate(startDate[0], startDate[1], startDate[2], startDate[3], startDate[4], startDate[5])
  }

  static isDataReset = false
  static dataReset () {
    localStorage.clear()
  }

  static displayTodayTime () {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    graphicSystem.digitalFontDisplay(year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second, 0, 480)
  }
  
  /**
   * 게임에 관한 모든 처리는 여기서 진행합니다.  
   * [process 함수 내에서 출력과 관련됨 모든 함수 사용금지]
   */
  static process () {
    frameCount++
    this.userSystem.process()

    switch (this.statusId) {
      case this.STATUS_MAIN: this.mainSystem.process(); break
      case this.STATUS_OPTION: this.optionSystem.process(); break
      case this.STATUS_ROUNDSELECT: this.roundSelectSystem.process(); break
      case this.STATUS_FIELD: this.fieldSystem.process(); break
    }

    this.processSave()
    this.processLoad()
  }

  /**
   * 게임에 관한 모든 출력은 여기서 진행합니다.  
   * [display 함수 내에세 게임에 관한 모든 처리 금지, 출력 함수만 사용하세요.]
   */
  static display () {
    // 화면 지우기
    graphicSystem.clearCanvas()

    // 화면 출력
    switch (this.statusId) {
      case this.STATUS_MAIN: this.mainSystem.display(); break
      case this.STATUS_OPTION: this.optionSystem.display(); break
      case this.STATUS_ROUNDSELECT: this.roundSelectSystem.display(); break
      case this.STATUS_FIELD: this.fieldSystem.display(); break
    }
    
    // 메인 화면 또는 옵션 화면일때만, 시간 표시
    if (this.statusId === this.STATUS_MAIN || this.statusId === this.STATUS_OPTION) {
      graphicSystem.digitalFontDisplay('FPS: ' + currentFps, 0, 240, 40, 60)
      this.userSystem.displayPlayTime()
    }

    this.userSystem.display()

  }

}


// 게임에 관한 출력과 로직 처리는 animation함수에서 진행합니다.
// 그러나 실제로는 gameSystem.process() 와 gameSystem.display()만 사용합니다.

/** animation함수에서 사용하는 다음 시간 확인 용도  */ 
let thenAnimationTime = 0

/** 브라우저의 requsetAnimation을 사용하기 위해 만든 에니메이션 함수입니다. */
function animation (timestamp) {
  /* 
  * 에니메이션의 출력 프레임을 60fps로 고정시키기 위해 다음과 같은 알고리즘을 적용하였습니다.
  * 사실 원리는 모르겠지만, 이전 시간을 기준으로 다음 프레임을 계산할 때
  * then = timestamp - (elapsed % fpsInterval) 계산을 공통적으로 하는것 같습니다.
  * 어쨋든, 이 게임은 모니터 환경에 상관없이 초당 60fps로만 실행됩니다.
  * 이 설정을 바꾸는 것은 게임 규칙 위반입니다. 임의로 수정하지 마세요.
  */
  let fpsInterval = 16.6 // 1seconds 60fps limit, do not exceed 60fps!

  // 진행시간 = 타임스탬프 - 그 다음 시간
  const elapsed = timestamp - thenAnimationTime
  if (elapsed >= fpsInterval) { // 진행시간이 fps간격 이상일 때
    // 그 다음시간 = 타임스탬프값에서 (진행시간값의 fps간격의 나머지)을 뺀다.
    thenAnimationTime = timestamp - (elapsed % fpsInterval)

    // 해당 에니메이션 로직 실행
    gameSystem.process() // 게임 처리 함수
    gameSystem.display() // 게임 출력 함수 (...)
    
    // 사실 이렇게 된건 firefox의 setInterval이 느리게 작동하기 때문이다. 
    // 어쩔수 없이 requsetAnimationFrame을 사용해야 한다.
  }

  requestAnimationFrame(animation)
}
requestAnimationFrame(animation)


// 마우스와 키보드 이벤트 처리
canvas.addEventListener('mousedown', (e) => {
  // 왼쪽 클릭만 게임에 적용됨. preventDefault는 사용 안합니다.
  if (e.button === 0) {
    mouseSystem.mouseDown(e.offsetX, e.offsetY)
  }
})
canvas.addEventListener('mousemove', (e) => {
  mouseSystem.mouseMove(e.offsetX, e.offsetY)
})
canvas.addEventListener('mouseup', () => {
  mouseSystem.mouseUp()
})
addEventListener('keydown', (e) => {
  buttonSystem.keyInput(e.key)
  buttonSystem.keyDown(e.key)
  
  // 새로고침 기능, 개발자 도구 이외의 다른 기능은 막습니다.
  if (e.key !== 'F5' && e.key !== 'F12') {
    e.preventDefault()
  }
})
addEventListener('keyup', (e) => {
  buttonSystem.keyUp(e.key)
})