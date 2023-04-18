import { buttonSystem, mouseSystem } from './control.js'
import { soundFile, soundSystem } from './sound.js'
import { imageDataInfo, ImageDataObject, imageFile } from './imageSrc.js'
import { fieldSystem } from './field.js'
import { graphicSystem } from './graphic.js'
import { ID } from './dataId.js'
import { dataExportStatPlayerSkill, dataExportStatPlayerWeapon } from './dataStat.js'

/** HTML 캔버스 */
const canvas = document.getElementById('canvas')

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
    if ((this.x <= mouseX && this.x + this.width >= mouseX) &&
    (this.y <= mouseY && this.y + this.height >= mouseY)) {
      return true
    } else {
      return false
    }
  }

  displayBackGround () {
    if (this.borderColor !== '') {
      graphicSystem.strokeRect(this.x, this.y, this.width, this.height, this.borderColor)
    }

    if (this.color === '') return
    
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
 * 클릭 가능한 BoxObject지만, 이미지를 사용합니다.
 */
class BoxImageObject extends BoxObject {
  constructor (x, y, width, height, text, image, imageData) {
    super(x, y, width, height, text)
    this.image = image

    /** @type {ImageDataObject} */ this.imageData = imageData
  }

  displayBackGround () {
    super.displayBackGround()

    if (this.image == null || this.imageData == null) return
    graphicSystem.imageDisplay(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
  }
}

/**
 * 메뉴 시스템 인터페이스 (아마도 모든 메뉴는 이 클래스르 상속받아서 구현해야합니다.)
 * 함수의 기능은 상속받는쪽에서 구현해주세요. 부모 함수는 아무런 기능이 없습니다.
 */
class MenuSystem {
  constructor () {
    /** 커서가 가리키는 박스 번호의 값 */ this.cursorPosition = 0
    /** 메뉴 선택 여부(ENTER키나 결정버튼(A버튼) 사용) */ this.selected = false
    /** 취소 선택 여부(ESC키나 취소버튼(B버튼) 사용) */ this.canceled = false

    /** 메뉴에 표시되는 리스트 (박스오브젝트)
     * 
     * 경고: 중간이 비어있을 수도 있음. 따라서 반드시 null 확인을 해야 합니다.
     * @type {BoxObject[]}
     */
    this.menuList = []

    /** 
     * 배경 컬러 지정 
     * 
     * (한개의 색만 지정되면, 그라디언트를 적용하지 않고, 단색으로 배경을 칠합니다.)
     * 
     * (두개 이상의 색을 지정하면 그라디언트 효과를 적용합니다.)
     * 
     * 해당 값이 비어있다면, 아무 배경도 그리지 않습니다
     * @type {string[]} 
     */
    this.backgroundColor = []
  }

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
   * 이 함수는 상속받지 마시고, 대신 추가로 구현해야 하는 기능이 있다면 processMouseExtends 함수에 내용을 추가해주세요.
   * 
   * 클릭 조건을 확인하기 위해서 if (!mouseSystem.getMouseDown()) return 를 사용해주세요.
   * 안그러면 마우스가 닿기만 해도 반응할 수 있습니다.
   */
  processMouse () {
    if (!mouseSystem.getMouseDown()) return
    
    this.mouseLogicMenuList()
    this.processMouseExtend()
  }

  /**
   * 마우스 처리 확장 함수.
   * 이것은 processMouse의 조건 처리때문에 super.processMouse를 사용한 다음, 
   * 마우스 클릭을 못처리하는 상태를 막기 위해 만든 함수입니다.
   */
  processMouseExtend () {

  }

  mouseLogicMenuList () {
    const mouseX = mouseSystem.getMousePosition().x
    const mouseY = mouseSystem.getMousePosition().y

    for (let i = 0; i < this.menuList.length; i++) {
      if (this.menuList[i] == null) continue

      const currentBox = this.menuList[i]
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
      if (this.menuList[i] == null) continue

      if (this.cursorPosition === i) {
        this.menuList[i].focus = true
      } else {
        this.menuList[i].focus = false
      }
    }
  }

  /**
   * 로직 처리 - 메뉴 선택
   * 
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
    if (this.selectedCheck()) this.processSelect()
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

    gameSystem.stateId = gameSystem.STATE_MAIN
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

  /** 화면 출력 함수 (로직을 여기에 처리하면 안됩니다.) */
  display () {
    this.displayBackground()
    this.displayMenu()
  }

  /** menuList를 전부 출력합니다. 조건에 따라 출력하고 싶다면, 이 함수를 재정의해주세요. */
  displayMenu () {
    for (let menu of this.menuList) {
      if (menu == null) continue

      menu.display()
    }
  }

  displayBackground () {
    if (this.backgroundColor.length === 1) {
      graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, this.backgroundColor[0])
    } else if (this.backgroundColor.length >= 2) {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, this.backgroundColor[0], this.backgroundColor[this.backgroundColor.length - 1], ...this.backgroundColor.slice(2))
    }
  }

}

/**
 * 메인 화면 시스템
 * 
 * 메인 메뉴 및 설정은 여기서 관리합니다.
 */
class MainSystem extends MenuSystem {
  /** 메뉴: 라운드 선택 */ MENU_ROUND_SELECT = 0
  /** 메뉴: 무기 선택 */ MENU_WEAPON_SELECT = 1
  /** 메뉴: 스킬 선택 */ MENU_SKILL_SELECT = 2
  /** 메뉴: 강화 */ MENU_UPGRADE = 3
  /** 메뉴: 옵션 */ MENU_OPTION = 4
  /** 메뉴: 데이터 셋팅 */ MENU_DATA_SETTING = 5
  /** 메뉴: 기타 */ MENU_ETC = 6
  /** 메뉴: 풀스크린 */ MENU_FULLSCREEN = 7

  constructor () {
    super()
    this.menuList[this.MENU_ROUND_SELECT] = new BoxImageObject(0, 100, 400, 50, '', imageFile.system.menuList, imageDataInfo.menuList.roundSelect)
    this.menuList[this.MENU_WEAPON_SELECT] = new BoxImageObject(0, 150, 400, 50, '', imageFile.system.menuList, imageDataInfo.menuList.weaponSelect)
    this.menuList[this.MENU_SKILL_SELECT] = new BoxImageObject(0, 200, 400, 50, '', imageFile.system.menuList, imageDataInfo.menuList.skillSelect)
    this.menuList[this.MENU_UPGRADE] = new BoxImageObject(0, 250, 400, 50, '', imageFile.system.menuList, imageDataInfo.menuList.upgrade)
    this.menuList[this.MENU_OPTION] = new BoxImageObject(0, 300, 400, 50, '', imageFile.system.menuList, imageDataInfo.menuList.option)
    this.menuList[this.MENU_DATA_SETTING] = new BoxImageObject(0, 350, 400, 50, '', imageFile.system.menuList, imageDataInfo.menuList.data)
    this.menuList[this.MENU_ETC] = new BoxImageObject(0, 400, 400, 50, '', imageFile.system.menuList, imageDataInfo.menuList.etc)
    this.menuList[this.MENU_FULLSCREEN] = new BoxObject(0, 450, 400, 50, 'full screen', 'grey')

    this.backgroundColor = ['#78b3f2', '#d2dff6']
  }

  processButton () {
    super.processButton()

    // 버튼 눌렀는지 확인하는 변수, true or false
    const buttonInputUp = buttonSystem.getButtonInput(buttonSystem.BUTTON_UP)
    const buttonInputDown = buttonSystem.getButtonInput(buttonSystem.BUTTON_DOWN)

    if (buttonInputUp && this.cursorPosition > 0) {
      soundSystem.play(soundFile.system.systemCursor)
      this.cursorPosition--
    } else if (buttonInputDown && this.cursorPosition < this.menuList.length - 1) {
      soundSystem.play(soundFile.system.systemCursor)
      this.cursorPosition++
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return

    switch (this.cursorPosition) {
      case this.MENU_ROUND_SELECT: gameSystem.stateId = gameSystem.STATE_ROUND_SELECT; break
      case this.MENU_WEAPON_SELECT: gameSystem.stateId = gameSystem.STATE_WEAPON_SELECT; break
      case this.MENU_SKILL_SELECT: gameSystem.stateId = gameSystem.STATE_SKILL_SELECT; break
      case this.MENU_UPGRADE: gameSystem.stateId = gameSystem.STATE_UPGRADE; break
      case this.MENU_OPTION: gameSystem.stateId = gameSystem.STATE_OPTION; break
      case this.MENU_DATA_SETTING: gameSystem.stateId = gameSystem.STATE_DATA_SETTING; break
      case this.MENU_ETC: gameSystem.stateId = gameSystem.STATE_ETC; break
      case this.MENU_FULLSCREEN: this.requestFullScreen(); break
      // case this.MENU_FULLSIZE: this.requestCanvasSize(); break
    }

    // 사운드 출력
    soundSystem.play(soundFile.system.systemSelect)
  }

  /**
   * 풀스크린을 요청합니다.
   * [일부 브라우저는 기능을 지원하지 않을 수 있음.]
   */
  requestFullScreen () {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      let canvas = document.getElementById('canvas')
      canvas.requestFullscreen()
    }
  }

  process () {
    this.processMouse()
    this.processButton()
    this.processFocus()
    this.processSelect()
  }

  display () {
    super.display()
    graphicSystem.imageDisplay(imageFile.tamshooter4Title, 0, 0)
  }
}

class OptionSystem extends MenuSystem {
  MENU_BACK = 0
  MENU_MASTER_VOLUME = 1
  MENU_SOUND = 2
  MENU_SOUND_VOLUME = 3
  MENU_MUSIC = 4
  MENU_MUSIC_VOLUME = 5
  MENU_SHOW_ENEMY_HP = 6
  MENU_RESULT_AUTO_SKIP = 7
  MENU_SHOW_DAMAGE = 8

  optionDefaultValue = [null, 100, true, 100, true, 100, true, true, true]
  optionValue = this.optionDefaultValue
  boxText = ['<- back', 
    'master volume (마스터 볼륨)',
    'sound (효과음)',
    'sound volume (사운드 볼륨)',
    'music (음악)',
    'music volume (음악 볼륨)',
    'show enemy hp (적 체력 보여주기)',
    'result auto skip (결과 자동 건너뛰기)',
    'show damage (데미지 보여주기)']

  constructor () {
    super()
    const MENU_X = 0
    const MENU_Y = 0
    const MENU_HEIGHT = 38
    const MENU_LINE_Y = 40
    const MENU_WIDTH = 390
    const startColor = '#FCCF31'
    const endColor = '#F55555'
    const focusColor = '#763E14'

    for (let i = 0; i < this.boxText.length; i++) {
      this.menuList[i] = new BoxObject(MENU_X, MENU_Y + (MENU_LINE_Y * i), MENU_WIDTH, MENU_HEIGHT, this.boxText[i], startColor, endColor, focusColor)
    }

    this.backgroundColor = ['#f9d423', '#ff4e50']
  }

  processButton () {
    super.processButton()

    const buttonInputUp = buttonSystem.getButtonInput(buttonSystem.BUTTON_UP)
    const buttonInputDown = buttonSystem.getButtonInput(buttonSystem.BUTTON_DOWN)
    const buttonInputLeft = buttonSystem.getButtonInput(buttonSystem.BUTTON_LEFT)
    const buttonInputRight = buttonSystem.getButtonInput(buttonSystem.BUTTON_RIGHT)

    if (buttonInputUp && this.cursorPosition > 0) {
      soundSystem.play(soundFile.system.systemCursor)
      this.cursorPosition--
    } else if (buttonInputDown && this.cursorPosition < this.menuList.length - 1) {
      soundSystem.play(soundFile.system.systemCursor)
      this.cursorPosition++
    }

    if (buttonInputLeft) {
      switch (this.cursorPosition) {
        case this.MENU_SOUND_VOLUME:
          soundSystem.setOption(soundSystem.TYPE_SOUND_VOLUME, soundSystem.getOption().soundVolume - 10)
          break
        case this.MENU_MUSIC_VOLUME:
          soundSystem.setOption(soundSystem.TYPE_MUSIC_VOLUME, soundSystem.getOption().musicVolume - 10)
          break
        case this.MENU_MASTER_VOLUME:
          soundSystem.setOption(soundSystem.TYPE_MASTER_VOLUME, soundSystem.getOption().masterVolume - 10)
          break
        case this.MENU_BACK:
          break
        default:
          this.selected = true
          break
      }
    }

    if (buttonInputRight) {
      switch (this.cursorPosition) {
        case this.MENU_SOUND_VOLUME:
          soundSystem.setOption(soundSystem.TYPE_SOUND_VOLUME, soundSystem.getOption().soundVolume + 10)
          break
        case this.MENU_MUSIC_VOLUME:
          soundSystem.setOption(soundSystem.TYPE_MUSIC_VOLUME, soundSystem.getOption().musicVolume + 10)
          break
        case this.MENU_MASTER_VOLUME:
          soundSystem.setOption(soundSystem.TYPE_MASTER_VOLUME, soundSystem.getOption().masterVolume + 10)
          break
        case this.MENU_BACK:
          break
        default:
          this.selected = true
          break
      }
    }

    // 사운드 출력
    if (buttonInputLeft || buttonInputRight) {
      switch (this.cursorPosition) {
        case this.MENU_MASTER_VOLUME:
        case this.MENU_SOUND_VOLUME:
          soundSystem.play(soundFile.system.systemCursor)
          break
      }
    }
  }

  process () {
    super.process()
    this.processGetOption()
  }

  /**
   * 옵션을 불러온 후 다른 객체에게 옵션값을 전달하고 반영할 때 사용하는 함수
   */
  loadOption (sendOptionValue) {
    // 옵션 값을 정상적으로 반영하기 위해 형변환을 합니다.
    for (let i = 0; i < sendOptionValue.length; i++) {
      switch (i) {
        case this.MENU_BACK:
          // 뒤로 가기 옵션은 null값으로 처리함.
          this.optionValue[i] = null
          break
        case this.MENU_SOUND:
        case this.MENU_MUSIC:
        case this.MENU_RESULT_AUTO_SKIP:
        case this.MENU_SHOW_ENEMY_HP:
        case this.MENU_SHOW_DAMAGE:
          // boolean값으로 변환 (경고: Boolean 생성자로는 boolean값을 판단할 수 없음.)
          if (sendOptionValue[i] === 'true') {
            this.optionValue[i] = true
          } else {
            this.optionValue[i] = false
          }
          break
        default:
          // 그외 나머지는 전부 number로 가정
          this.optionValue[i] = Number(sendOptionValue[i])
      }
    }

    soundSystem.setOption(soundSystem.TYPE_MASTER_VOLUME, this.optionValue[this.MENU_MASTER_VOLUME])
    soundSystem.setOption(soundSystem.TYPE_SOUND_ON, this.optionValue[this.MENU_SOUND])
    soundSystem.setOption(soundSystem.TYPE_SOUND_VOLUME, this.optionValue[this.MENU_SOUND_VOLUME])
    soundSystem.setOption(soundSystem.TYPE_MUSIC_ON, this.optionValue[this.MENU_MUSIC])
    soundSystem.setOption(soundSystem.TYPE_MUSIC_VOLUME, this.optionValue[this.MENU_MUSIC_VOLUME])
  }
  
  processGetOption () {
    let soundOption = soundSystem.getOption()
    this.optionValue[this.MENU_MASTER_VOLUME] = soundOption.masterVolume
    this.optionValue[this.MENU_SOUND] = soundOption.soundOn
    this.optionValue[this.MENU_SOUND_VOLUME] = soundOption.soundVolume
    this.optionValue[this.MENU_MUSIC] = soundOption.musicOn
    this.optionValue[this.MENU_MUSIC_VOLUME] = soundOption.musicVolume
  }

  processSelect () {
    if (!this.selectedCheck()) return

    switch (this.cursorPosition) {
      case this.MENU_BACK: this.canceled = true; break
      case this.MENU_MASTER_VOLUME: soundSystem.setOption(soundSystem.TYPE_MASTER_VOLUME); break
      case this.MENU_SOUND: soundSystem.setOption(soundSystem.TYPE_SOUND_ON); break
      case this.MENU_SOUND_VOLUME: soundSystem.setOption(soundSystem.TYPE_SOUND_VOLUME); break
      case this.MENU_MUSIC: soundSystem.setOption(soundSystem.TYPE_MUSIC_ON); break
      case this.MENU_MUSIC_VOLUME: soundSystem.setOption(soundSystem.TYPE_MUSIC_VOLUME); break
      case this.MENU_SHOW_ENEMY_HP: this.optionValue[this.MENU_SHOW_ENEMY_HP] = !this.optionValue[this.MENU_SHOW_ENEMY_HP]; break
      case this.MENU_RESULT_AUTO_SKIP: this.optionValue[this.MENU_RESULT_AUTO_SKIP] = !this.optionValue[this.MENU_RESULT_AUTO_SKIP]; break
      case this.MENU_SHOW_DAMAGE: this.optionValue[this.MENU_SHOW_DAMAGE] = !this.optionValue[this.MENU_SHOW_DAMAGE]; break
    }

    // 사운드 출력
    switch (this.cursorPosition) {
      case this.MENU_MASTER_VOLUME:
      case this.MENU_SOUND_VOLUME:
        soundSystem.play(soundFile.system.systemCursor)
        break
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return

    soundSystem.play(soundFile.system.systemBack)
    gameSystem.stateId = gameSystem.STATE_MAIN
  }

  displayMenu () {
    for (let i = 0; i < this.menuList.length; i++) {
      this.menuList[i].display()
      let imageOptionCheck = imageFile.system.optionCheck

      // 두번째(1번) 메뉴부터 옵션 결과값이 쉽게 보여지도록 하얀색 박스 배경을 만듬.
      if (i !== 0) {
        graphicSystem.fillRect(this.menuList[i].x + this.menuList[i].width, this.menuList[i].y, 100, this.menuList[i].height, 'white')
      }

      // 옵션 값 종류에 따라 결과값 표시
      switch (typeof this.optionValue[i]) {
        case 'boolean':
          if (this.optionValue[i] === true) {
            graphicSystem.imageDisplay(imageOptionCheck, 0, imageOptionCheck.height / 2, imageOptionCheck.width, imageOptionCheck.height / 2, this.menuList[i].x + this.menuList[i].width, this.menuList[i].y, imageOptionCheck.width, imageOptionCheck.height / 2)
          } else {
            graphicSystem.imageDisplay(imageOptionCheck, 0, 0, imageOptionCheck.width, imageOptionCheck.height / 2, this.menuList[i].x + this.menuList[i].width, this.menuList[i].y, imageOptionCheck.width, imageOptionCheck.height / 2)
          }
          break
        case 'number':
          graphicSystem.digitalFontDisplay(this.optionValue[i], this.menuList[i].x + this.menuList[i].width, this.menuList[i].y)
          break
      }
    }
  }

  getOptionObject () {
    return {
      sound: this.optionValue[this.MENU_SOUND],
      music: this.optionValue[this.MENU_MUSIC],
      resultAutoSkip: this.optionValue[this.MENU_RESULT_AUTO_SKIP],
      showEnemyHp: this.optionValue[this.MENU_SHOW_DAMAGE],
      showDamage: this.optionValue[this.MENU_SHOW_DAMAGE]
    }
  }

  setOptionMusicSound (music, sound) {
    this.optionValue[this.MENU_MUSIC] = music
    this.optionValue[this.MENU_SOUND] = sound
  }
}

/**
 * 메뉴: 라운드 시스템
 */
class RoundSelectSystem extends MenuSystem {
  CURSORMODE_MAIN = 1
  CURSORMODE_SUB = 2

  /** 커서 라운드 */ cursorRound = 1
  /** 커서 서브 라운드 */ cursorSubRound = 1
  /** 커서 모드 */ cursorMode = this.CURSORMODE_MAIN
  /** 최소 라운드: 게임은 1라운드부터 시작 */ MIN_ROUND = 1
  /** 최대 라운드: 8 */ MAX_ROUND = 8
  roundIcon = imageFile.roundIcon
  roundIconData = { width: 60, height: 60 }


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

    this.backgroundColor = ['#757F9A', '#D7DDE8']
  }

  processButton () {
    super.processButton()

    // 이 변수들은 버튼 입력 조건문을 간편하게 작성하기 위한 변수입니다.
    const buttonUp = buttonSystem.getButtonInput(buttonSystem.BUTTON_UP)
    const buttonDown = buttonSystem.getButtonInput(buttonSystem.BUTTON_DOWN)
    const buttonLeft = buttonSystem.getButtonInput(buttonSystem.BUTTON_LEFT)
    const buttonRight = buttonSystem.getButtonInput(buttonSystem.BUTTON_RIGHT)

    if (this.cursorMode === this.CURSORMODE_MAIN) {
      if (buttonDown) {
        this.selected = true
      } else if (buttonLeft && this.cursorRound > 0) {
        this.cursorRound--
        soundSystem.play(soundFile.system.systemCursor)
      } else if (buttonRight && this.cursorRound < this.MAX_ROUND) {
        this.cursorRound++
        soundSystem.play(soundFile.system.systemCursor)
      }
    } else if (this.cursorMode === this.CURSORMODE_SUB) {
      if (buttonLeft && this.cursorSubRound > 0) {
        this.cursorSubRound--
        soundSystem.play(soundFile.system.systemCursor)
      } else if (buttonRight && this.cursorSubRound < 9) {
        this.cursorSubRound++
        soundSystem.play(soundFile.system.systemCursor)
      } else if (buttonUp) {
        this.canceled = true
        soundSystem.play(soundFile.system.systemCursor)
      }
    }

    // 버튼 조작이 끝날때마다 커서 위치를 변경합니다.
    this.cursorPositionCalcuration()
  }

  processMouse () {
    super.processMouse()
    this.cursorRoundCalcuration()
  }

  process () {
    super.process()
  }

  /**
   * 현재 커서 라운드와 모드와 서브라운드를 기준으로 커서포지션을 계산합니다.
   */
  cursorPositionCalcuration () {
    if (this.cursorMode === this.CURSORMODE_MAIN) {
      this.cursorPosition = this.cursorRound
    } else if (this.cursorMode === this.CURSORMODE_SUB) {
      this.cursorPosition = this.cursorSubRound + 10
    }
  }

  /**
   * 현재 커서포지션을 기준으로 커서의 라운드와 서브라운드와 모드를 계산합니다.
   */
  cursorRoundCalcuration () {
    if (this.cursorPosition <= 9) {
      this.cursorMode = this.CURSORMODE_MAIN
      this.cursorRound = this.cursorPosition
    } else if (this.cursorPosition >= 10) {
      this.cursorMode = this.CURSORMODE_SUB
      this.cursorSubRound = this.cursorPosition - 10
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return

    if (this.cursorMode === this.CURSORMODE_MAIN) {
      gameSystem.stateId = gameSystem.STATE_MAIN
      soundSystem.play(soundFile.system.systemBack)
    } else if (this.cursorMode === this.CURSORMODE_SUB) {
      this.cursorMode = this.CURSORMODE_MAIN
      soundSystem.play(soundFile.system.systemBack)
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return

    // 임시로 라운드 테이블은 여기서 구현합니다.
    // 나중에 data.js쪽에 옮겨질 예정
    const roundTableId = [
      ID.round.round1_1,
      ID.round.round1_2,
      ID.round.round1_3,
      ID.round.round1_4,
      ID.round.round1_5,
      ID.round.round1_6,
      null,
      null,
      ID.round.round1_test
    ]

    if (this.cursorMode === this.CURSORMODE_MAIN) {
      if (this.cursorRound === 0) {
        // 커서라운드가 0에 있으면 메인 메뉴로 되돌아갑니다.
        this.canceled = true
      } else {
        this.cursorMode = this.CURSORMODE_SUB
        soundSystem.play(soundFile.system.systemSelect)
      }
    } else if (this.cursorMode === this.CURSORMODE_SUB) {
      fieldSystem.roundStart(roundTableId[this.cursorSubRound])
      soundSystem.play(soundFile.system.systemEnter)
    }
  }

  display () {
    super.display()
    this.displayRound()
    this.displaySubRound()
    this.displayWorld()
    this.displayInfo()
  }

  displayMenu () {
    // nohing
    // 다른 display 함수에서 menuList[].display를 호출하기 때문에 중복으로 호출할 필요가 없음.
  }

  displayRound () {
    for (let i = 0; i < 10; i++) {
      // 참고: 선택된 라운드를 명확하게 표기하기 위하여, 현재 라운드가 선택되었다면(커서라운드가 서브모드)
      // 선택된 현재라운드와 서브라운드를 모두 표시하게 합니다.
      if (this.cursorMode === this.CURSORMODE_SUB) {
        if (i === this.cursorRound) {
          this.menuList[i].focus = true
          this.menuList[i].focusColor = 'red'
        } else {
          this.menuList[i].focus = false
          this.menuList[i].focusColor = 'blue'
        }
      } else if (this.cursorMode === this.CURSORMODE_MAIN && this.menuList[i].focusColor === 'red') {
        this.menuList[i].focusColor = 'blue'
      }

      this.menuList[i].display()
    }
  }

  displaySubRound () {
    for (let i = 10, n = 0; i <= 25; i++, n++) {
      this.menuList[i].display()
      const iconNumberX = i - 10
      const rectPlusSize = 5
      const fontWidth = 12
      const fontHeight = 20

      if (i < 9 || i > 19) continue
      // 각 라운드 아이콘의 이미지 출력
      graphicSystem.imageDisplay(
        this.roundIcon, 
        iconNumberX * this.roundIconData.width, 
        1 * this.roundIconData.height, 
        this.roundIconData.width, 
        this.roundIconData.height, 
        this.menuList[i].x, 
        this.menuList[i].y,
        this.menuList[i].width,
        this.menuList[i].height 
      )

      // 이미지에 가려져서 무엇이 선택되었는지 알기 어려우므로, 따로 사격형을 먼저 칠합니다.
      if (this.cursorMode === this.CURSORMODE_SUB && this.cursorSubRound === n) {
        graphicSystem.fillRect(
          this.menuList[i].x - rectPlusSize, 
          this.menuList[i].y - rectPlusSize,
          this.menuList[i].width + (rectPlusSize * 2),
          this.menuList[i].height + (rectPlusSize * 2), 
          'blue',
          0.4
        )
      }

      // 글자를 표시할 사각형 출력 후, 글자 출력
      graphicSystem.fillRect(this.menuList[i].x, this.menuList[i].y + (this.menuList[i].height - fontHeight), fontWidth * 3, fontHeight, 'white', 0.5)
      graphicSystem.digitalFontDisplay('1-' + (iconNumberX + 1), this.menuList[i].x, this.menuList[i].y + (this.menuList[i].height - fontHeight))
    }
  }

  displayWorld () {
    graphicSystem.strokeRect(0, 240, 800, 300, 'green')
  }

  displayInfo () {
    graphicSystem.strokeRect(400, 160, 400, 80, 'pink')
    graphicSystem.fillText('ROUND: ' + this.menuList[this.cursorPosition].text, 400, 160, 400)
  }
}

class DataSettingSystem extends MenuSystem {
  MENU_BACK = 0
  MENU_LEVEL_RESET = 1
  MENU_ALL_DATA_DELETE = 2

  constructor () {
    super()
    const LAYER_X = 0
    const LAYER_Y = 0
    const LAYER_WIDTH = 400
    const LAYER_HEIGHT = 50

    // 그라디언트 컬러
    const color1 = '#E0AC00'
    const color2 = '#B2F641'
    const focusColor = 'black'

    let menuText = ['<- back', 'level reset (레벨 리셋)', 'all data delete (모든 데이터 삭제)']
    this.menuList.push(new BoxObject(LAYER_X, LAYER_Y + (LAYER_HEIGHT * 0), LAYER_WIDTH, LAYER_HEIGHT, menuText[0], color1, color2, focusColor))
    this.menuList.push(new BoxObject(LAYER_X, LAYER_Y + (LAYER_HEIGHT * 1), LAYER_WIDTH, LAYER_HEIGHT, menuText[1], color1, color2, focusColor))
    this.menuList.push(new BoxObject(LAYER_X, LAYER_Y + (LAYER_HEIGHT * 2), LAYER_WIDTH, LAYER_HEIGHT, menuText[2], color1, color2, focusColor))

    /**
     * 진짜 삭제할건지 질문하는 창이 뜨는지 여부
     */
    this.isQuestionResetWindow = false

    /**
     * 사용자가 진짜 삭제할 건지를 결정하는 변수, true일경우 모든 데이터 삭제, false일경우 취소, 기본값 false
     */
    this.questionReset = false
    
    /**
     * 사용자가 리셋을 완전히 결정한 경우, 자동으로 새로고침이 되도록 리셋완료 표시를 해야합니다.
     */
    this.isResetComplete = false

    this.questionResetBox = new BoxObject(200, 100, 400, 200, '정말 모든 데이터를 삭제하겠어요?(you want to data reset?)', 'white')
    this.questionResetNo = new BoxObject(200, 300, 200, 50, '아니오 (NO)', 'white', 'white', 'blue')
    this.questionResetYes = new BoxObject(200, 400, 200, 50, '예 (YES)', 'white', 'white', 'blue')

    this.backgroundColor = ['#52c234', '#061700']
  }

  process () {
    // 사용자가 리셋을 완료하지 않은 경우에만 기능 동작.
    // 리셋했다면, 몇 초 후 자동 새로고침 되고, 더이상의 기능을 멈춤
    if (!this.isResetComplete) {
      super.process()
    }
    this.processQuestionWindow()
  }

  processQuestionWindow () {
    if (this.isResetComplete) {
      this.questionResetBox.text = '데이터 삭제 완료. 2초 후 자동 새로고침 합니다.'
    } else if (this.questionReset) {
      this.questionResetYes.focus = true
      this.questionResetNo.focus = false
    } else {
      this.questionResetYes.focus = false
      this.questionResetNo.focus = true
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return

    soundSystem.play(soundFile.system.systemBack)
    if (this.isQuestionResetWindow) {
      this.isQuestionResetWindow = false
      this.questionReset = false
    } else {
      gameSystem.stateId = gameSystem.STATE_MAIN
    }
  }

  processButton () {
    super.processButton()
    const buttonUp = buttonSystem.getButtonInput(buttonSystem.BUTTON_UP)
    const buttonDown = buttonSystem.getButtonInput(buttonSystem.BUTTON_DOWN)

    if (this.isQuestionResetWindow) {
      // 리셋버튼은 위쪽에 아니오, 밑쪽에 예가 있습니다.
      // 따라서, 위 버튼을 누르면 아니오로 이동되고, 아래 버튼을 누르면 예로 이동됩니다.
      if (buttonUp && this.questionReset) {
        this.questionReset = false
      } else if (buttonDown && !this.questionReset) {
        this.questionReset = true
      }
    } else {
      if (buttonUp && this.cursorPosition > 0) {
        this.cursorPosition--
        soundSystem.play(soundFile.system.systemCursor)
      } else if (buttonDown && this.cursorPosition < this.menuList.length - 1) {
        this.cursorPosition++
        soundSystem.play(soundFile.system.systemCursor)
      }
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return

    if (this.isQuestionResetWindow) {
      if (this.questionReset) {
        gameSystem.dataReset()
        this.isResetComplete = true
        
        // 2초 후 자동 새로고침
        soundSystem.play(soundFile.system.systemPlayerDie)
        setTimeout(() => { location.reload() }, 2000)
      } else {
        // 취소 명령
        this.canceled = true
      }
    } else {
      if (this.cursorPosition >= 1) {
        soundSystem.play(soundFile.system.systemSelect)
      }
      switch (this.cursorPosition) {
        case this.MENU_BACK: this.canceled = true; break
        case this.MENU_ALL_DATA_DELETE: this.isQuestionResetWindow = true; break
        case this.MENU_LEVEL_RESET: 
          userSystem.levelReset(); 
          gameSystem.stateId = gameSystem.STATE_MAIN
          break
      }
    }
  }

  processMouseExtend () {
    const mouseX = mouseSystem.getMousePosition().x
    const mouseY = mouseSystem.getMousePosition().y
    if (this.isQuestionResetWindow) {
      if (this.questionResetYes.collision(mouseX, mouseY)) {
        this.questionReset = true
        this.questionResetYes.focus = true
        this.questionResetNo.focus = false
        this.selected = true
      } else if (this.questionResetNo.collision(mouseX, mouseY)) {
        this.questionReset = false
        this.canceled = true
      }
    }
  }
  display () {
    super.display()

    if (this.isQuestionResetWindow) {
      this.questionResetBox.display()
      this.questionResetYes.display()
      this.questionResetNo.display()
    }
  }

  displayMenu () {
    if (!this.isQuestionResetWindow) {
      super.displayMenu()
    }
  }
}

class WeaponSelectSystem extends MenuSystem {
  constructor () {
    super()
    /** 커서페이지 */ this.cursorPage = 0
    /** 커서가 가리키는 메뉴 번호 (0 ~ max 9) */ this.cursorMenu = 0
    /** 커서가 가리키는 아이콘 번호 (0 ~ 49) */ this.cursorIcon = 0
    /** 커서가 가리키는 리스트 번호 (무기: 0 ~ 3, 스킬: 0 ~ 7) */ this.cursorList = 0
    /** 커서의 페이지 (아직은 미사용) */ this.cursorPage = 0
    /** 커서의 슬롯 (아직 미사용) */ this.cursorSlot = 0

    /** 선택 변경 예정인 리스트의 위치(cursorList는 현재 커서위치) */ this.listPosition = 0

    /** 해당 목록에서 사용할 타겟(무기 또는 스킬)의 id List */
    this.targetIdList = Array.from(dataExportStatPlayerWeapon.keys())
    
    this.targetIdList = Array.from(dataExportStatPlayerWeapon.keys())
    this.weaponMax = this.targetIdList.length - 1 // 최대 무기 개수: 참고로 서브 웨폰은 맨 마지막에 배치, 서브웨폰은 메인무기로 사용 불가능

    this.backgroundColor = ['#B993D6', '#8CA6DB']

    this.menuList[0] = new BoxObject(0, 0, 80, 40, '< back', 'yellow')
    this.menuList[1] = new BoxObject(80, 0, 80, 40, 'help', 'yellow')

    /** 메뉴의 번호 시작값 (메뉴 개수만큼(최대 9번까지 허용)) */ this.NUM_START_MENU = 0
    /** 메뉴의 번호 끝값 (메뉴 개수만큼(최대 9번까지 허용)) */ this.NUM_END_MENU = this.menuList.length
    /** 스킬의 번호 시작값 (스킬 버호는 10 ~ 59, 총 50개) */ this.NUM_START_ICON = 10
    /** 스킬의 번호 끝값 (스킬 버호는 10 ~ 59, 총 50개)  */ this.NUM_END_ICON = 59
    /** 리스트의 번호 시작값 (참고: 리스트번호는 60 ~ 67, 총 8개) */ this.NUM_START_LIST = 60
    /** 리스트의 번호 끝값 (참고: 리스트번호는 60 ~ 67, 총 8개) */ this.NUM_END_LIST = 67

    this.STATE_MENU = 'menu'
    this.STATE_ICON = 'icon'
    this.STATE_LIST = 'list'
    this.STATE_HELP = 'help'
    this.state = this.STATE_MENU

    /** 리스트 포지션의 최대 */ this.LIST_POSITION_MAX = 4

    for (let i = 10, index = 0; index < 50; i++, index++) {
      this.menuList[i] = new BoxImageObject((index % 10) * 80, Math.floor(index / 10) * 40 + 40, 80, 40, '', imageFile.system.weaponIcon, {x: (index % 10) * 40, y: Math.floor(index / 10) * 20, width: 40, height: 20})
    }

    for (let i = 60, index = 0; index < 4; i++, index++) {
      let outputY = 420 + (index * 20)
      this.menuList[i] = new BoxObject(0, outputY, 800, 20, '', 'whitesmoke')
    }
  }

  /** 어떤 버튼이 눌렸는지를 오브젝트로 확인합니다. 버튼이 눌린것은 boolean값으로 확인해야합니다. */
  getButtonObject () {
    const buttonUp = buttonSystem.getButtonInput(buttonSystem.BUTTON_UP)
    const buttonDown = buttonSystem.getButtonInput(buttonSystem.BUTTON_DOWN)
    const buttonLeft = buttonSystem.getButtonInput(buttonSystem.BUTTON_LEFT)
    const buttonRight = buttonSystem.getButtonInput(buttonSystem.BUTTON_RIGHT)
    const buttonSkill0 = buttonSystem.getButtonInput(buttonSystem.BUTTON_SKILL0)
    const buttonSkill1 = buttonSystem.getButtonInput(buttonSystem.BUTTON_SKILL1)
    const buttonSkill2 = buttonSystem.getButtonInput(buttonSystem.BUTTON_SKILL2)
    const buttonSkill3 = buttonSystem.getButtonInput(buttonSystem.BUTTON_SKILL3)
    return  {
      buttonUp,
      buttonDown,
      buttonLeft,
      buttonRight,
      buttonSkill0,
      buttonSkill1,
      buttonSkill2,
      buttonSkill3
    }
  }

  process () {
    super.process()
    this.processCursorPosition()
  }

  /** 
   * 커서 포지션을 현재 설정값에 맞게 강제 이동  (이 함수는 키보드 기준)
   * 
   * 마우스로 이동하는 경우, 기존에 있는 상태를 무시하고 커서를 이동시킴
   */
  processCursorPosition () {
    if (this.state === this.STATE_MENU) {
      this.cursorPosition = this.cursorMenu
    } else if (this.state === this.STATE_ICON) {
      this.cursorPosition = this.NUM_START_ICON + this.cursorIcon
    } else if (this.state === this.STATE_LIST) {
      this.cursorPosition = this.NUM_START_LIST + this.cursorList
    }
  }

  /** 마우스를 클릭했을 때 커서 포지션의 값을 계산해서 메뉴 상태를 변경합니다. */
  processMouseCursorCalculation () {
    // 커서 포지션이 특정 범위라면, 현재 상태를 임의로 변경합니다.
    if (this.cursorPosition >= this.NUM_START_MENU && this.cursorPosition <= this.NUM_END_MENU) {
      this.state = this.STATE_MENU
      this.cursorMenu = this.cursorPosition
    } else if (this.cursorPosition >= this.NUM_START_ICON && this.cursorPosition <= this.NUM_END_ICON) {
      this.state = this.STATE_ICON
      this.cursorIcon = this.cursorPosition - this.NUM_START_ICON
    } else if (this.cursorPosition >= this.NUM_START_LIST && this.cursorPosition <= this.NUM_END_LIST) {
      this.state = this.STATE_LIST
      this.cursorList = this.cursorPosition - this.NUM_START_LIST
    }
  }

  processMouseExtend () {
    // 마우스가 눌려진 후에 기능을 수행하기 위해, processMouseExtend 함수를 사용했습니다.
    this.processMouseCursorCalculation()
  }


  processButton () {
    super.processButton()
    if (this.state === this.STATE_MENU) {
      this.processButtonMenu()
    } else if (this.state === this.STATE_ICON) {
      this.processButtonIcon()
    } else if (this.state === this.STATE_LIST) {
      this.processButtonList()
    }
  }

  processButtonMenu () {
    let button = this.getButtonObject()
    if (button.buttonLeft && this.cursorMenu >= 0) {
      this.cursorMenu--
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonRight && this.cursorMenu < 1) {
      this.cursorMenu++
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonDown) {
      this.state = this.STATE_ICON
      soundSystem.play(soundFile.system.systemCursor)
    }
  }

  processButtonIcon () {
    let button = this.getButtonObject()
    let cursorX = this.cursorIcon % 10
    let cursorY = Math.floor(this.cursorIcon / 10)

    // 간단히 말해, 좌우 루프형태 (현재는 아이콘 개수가 50개를 초과하지 않아 페이지 이동 기능은 없음)
    if (button.buttonLeft) {
      // 커서아이콘이 X축 0의 위치에 있다면, 맨 오른쪽으로 이동시킴 그게 아닐경우 왼쪽으로 한칸 이동
      cursorX === 0 ? this.cursorIcon += 9 : this.cursorIcon--
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonRight) {
      // 커서아이콘이 X축 9의 위치에 있다면, 커서를 맨 왼쪽으로 이동시킴 그게 아닐경우 오른쪽으로 한칸 이동
      cursorX === 9 ? this.cursorIcon -= 9 : this.cursorIcon++
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonDown) {
      // 맨 마지막줄일경우 상태를 변경하고 아닐경우 아래쪽으로 한줄 이동
      cursorY === 4 ? this.state = this.STATE_LIST : this.cursorIcon += 10
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonUp) {
      // 맨 처음 줄일경우 상태를 변경하고 아닐경우 위쪽으로 한줄 이동
      cursorY === 0 ? this.state = this.STATE_MENU : this.cursorIcon -= 10
      soundSystem.play(soundFile.system.systemCursor)
    }
  }

  processButtonList () {
    let button = this.getButtonObject()
    if (button.buttonDown && this.cursorList < 3) {
      this.cursorList++
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonUp) {
      this.cursorList === 0 ? this.state = this.STATE_ICON : this.cursorList--
      soundSystem.play(soundFile.system.systemCursor)
    }
  }

  setWeapon (weaponId) {
    if (weaponId == null || weaponId === ID.playerWeapon.unused) return

    let playerWeapon = userSystem.getWeaponList()
    playerWeapon[this.listPosition] = weaponId
    userSystem.setWeaponList(playerWeapon)

    this.listPosition++
    if (this.listPosition > 3) this.listPosition = 0

    soundSystem.play(soundFile.system.systemSkillSelect)
  }

  processSelect () {
    if (!this.selectedCheck()) return

    if (this.state === this.STATE_MENU) {
      switch (this.cursorMenu) {
        case 0: this.canceled = true
      }
    } else if (this.state === this.STATE_ICON) {
      this.setWeapon(this.targetIdList[this.cursorIcon])
    } else if (this.state === this.STATE_LIST) {
      this.listPosition = this.cursorList
      this.state = this.STATE_ICON
      soundSystem.play(soundFile.system.systemSelect)
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return
    
    if (this.state === this.STATE_MENU) {
      gameSystem.stateId = gameSystem.STATE_MAIN
    } else if (this.state === this.STATE_ICON) {
      this.state = this.STATE_MENU
    } else if (this.state === this.STATE_LIST) {
      this.state = this.STATE_ICON
    }
    soundSystem.play(soundFile.system.systemBack)
  }

  displayUserWeapon () {
    let outputY = 400
    graphicSystem.digitalFontDisplay('icon/name           /delay/shot/hit/multiple/attack/damage', 0, 400)

    let userWeapon = userSystem.getWeaponList()
    let weaponIcon = imageFile.system.weaponIcon
    let iconWidth = 40
    let iconHeight = 20
    for (let i = 0; i < userWeapon.length; i++) {
      let getString = this.getIconString(userWeapon[i])
      graphicSystem.digitalFontDisplay(getString, 0, outputY + iconHeight + (i * iconHeight))
      
      let weaponNumber = userWeapon[i] - ID.playerWeapon.weaponNumberStart
      let weaponX = weaponNumber % 10
      let weaponY = Math.floor(weaponNumber / 10)
      graphicSystem.imageDisplay(weaponIcon, (weaponX * iconWidth), weaponY * iconHeight, iconWidth, iconHeight, 0, outputY + iconHeight + (i * iconHeight), iconWidth, iconHeight)
    }

    // 하이라이트 표시
    graphicSystem.fillRect(0, outputY + iconHeight + (this.listPosition  * iconHeight), graphicSystem.CANVAS_WIDTH, iconHeight, 'orange', 0.5)
  }

  /** 해당 아이콘 위치에 있는 무기 또는 스킬의 정보를 얻어옵니다. */
  getIconString (weaponId) {
    let getData = dataExportStatPlayerWeapon.get(weaponId)
    if (getData == null) return ''

    let icon = '    ' // 공백 4칸
    let name = getData.name.padEnd(16, ' ').slice(0, 16) + ' '
    let delay = ('' + getData.delay).padEnd(5, ' ') + ' '
    let shotCount = ('' + getData.shotCount).padEnd(4, ' ') + ' '
    let attackCount = ('' + getData.attackCount).padEnd(3, ' ') + ' '
    let attackMultiple = ('' + getData.attackMultiple).padEnd(8, ' ') + ' '
    let weaponAttack = ('' + getData.weaponAttack).padEnd(6, ' ') + ' '
    let currentAttack = ('' + getData.getCurrentAttack(userSystem.getPlayerObjectData().attack)).padEnd(8, ' ') + ' '

    // 'icon/name           /delay/shot/hit/multiple/attack/damage'
    return icon + name + delay + shotCount + attackCount + attackMultiple + weaponAttack + currentAttack
  }

  display () {
    super.display()
    // graphicSystem.digitalFontDisplay('icon/name           /delay/shot/hit/multiple/attack/damage', 0, 0)
    this.displayUserWeapon()
  }
}

class SkillSelectSystem extends WeaponSelectSystem {
  constructor () {
    super()
    this.backgroundColor = ['#6190E8', '#A7BFE8']
    
    /** 모든 스킬의 슬롯 리스트 */ this.targetIdList = Array.from(dataExportStatPlayerSkill.keys())
    let menuText = ['<- back', 'prevPage', 'nextPage', 'help', 'slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'preview']
    for (let i = 0; i < menuText.length; i++) {
      this.menuList[i] = new BoxObject(80 * i, 0, 80, 40, menuText[i], 'yellow', null, 'darkblue')
    }

    /** 메뉴의 번호 끝값 (메뉴 개수만큼(최대 9번까지 허용)) */ this.NUM_END_MENU = menuText.length - 1

    this.STATE_PREVIEW = 'preview'
    this.state = this.STATE_MENU

    /** 리스트 포지션의 최대 */ this.LIST_POSITION_MAX = 8

    // menuList 10 ~ 59 스킬 선택 메뉴:
    let iconWidth = 40
    let iconHeight = 20
    let iconOutputWidth = 80
    let sectionArea = 100
    for (let i = 10, index = 0; index < 50; i++, index++) {
      let xNumber = index % 10
      let yNumber = Math.floor(index / 10)
      let imageData = {x: xNumber * iconWidth, y: yNumber * iconHeight, width: iconWidth, height: iconHeight}
      this.menuList[i] = new BoxImageObject(xNumber * iconOutputWidth, yNumber * iconWidth + sectionArea, iconOutputWidth, iconWidth, '', imageFile.system.skillIcon, imageData)
      this.menuList[i].borderColor = 'black'
      this.menuList[i].color = ''
    }

    // menuList 60 ~ 67 스킬 장착 메뉴
    let image = imageFile.system.skillInfo
    let slotBNumber = 64
    let slotALayerY = 320
    let slotBLayerY = 420
    for (let i = 60, index = 0; index < this.LIST_POSITION_MAX; i++, index++) {
      let yLine = index % 4
      // 60 ~ 63이 A슬롯, 64 ~ 67이 B슬롯입니다.
      let imageData = i < slotBNumber ? imageDataInfo.system.skillInfoSkyBlue : imageDataInfo.system.skillInfoPurpleBlue
      let positionY = i < slotBNumber ? slotALayerY + (yLine * iconHeight) : slotBLayerY + (yLine * iconHeight)
      this.menuList[i] = new BoxImageObject(0, positionY, graphicSystem.CANVAS_WIDTH, iconHeight, '', image, imageData)
    }
  }

  processButtonMenu () {
    let button = this.getButtonObject()
    // 메뉴 모드 (아직 완성 안됨)
    // 좌우 방향키로 이동, 아래 방향키를 누를경우, 스킬을 고를 수 있음.
    // 스킬셋을 바꾸면 현재 스킬셋이 다른걸로 교체됨
    // 도움말 메뉴를 누르면 도움말 창이 표시됨.
    // 참고: 프리뷰 기능은 어떻게 구현해야 할지 고민중... (필드를 새로 만들어야 하나...)
    if (button.buttonLeft && this.cursorMenu > 0) {
      soundSystem.play(soundFile.system.systemCursor)
      this.cursorMenu--
    } else if (button.buttonRight && this.cursorMenu < this.NUM_END_MENU - 1) {
      soundSystem.play(soundFile.system.systemCursor)
      this.cursorMenu++
    } else if (button.buttonDown) {
      this.state = this.STATE_ICON
    }
  }

  processButtonIcon () {
    let button = this.getButtonObject()
    let cursorX = this.cursorIcon % 10
    let cursorY = Math.floor(this.cursorIcon / 10)

    if (button.buttonLeft) {
      // 커서X값이 0이면, 반대방향으로 이동시킴, 아닐경우 왼쪽으로 이동
      cursorX === 0 ? this.cursorIcon += 9 : this.cursorIcon--
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonRight) {
      // 커서X값이 9이면, 반대방향으로 이동시킴, 아닐경우 오른쪽으로 이동
      cursorX === 9 ? this.cursorIcon -= 9 : this.cursorIcon++
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonUp) {
      // 커서 Y축이 맨 위에 있다면, 메뉴 상태로 변경합니다. 아닐경우, 한 줄 위로 올라갑니다.
      cursorY === 0 ? this.state = this.STATE_MENU : this.cursorIcon -= 10
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonDown) {
      // 커서 Y축이 맨 아래에 있다면, 리스트 상태로 변경합니다. 아닐경우, 한 줄 아래로 내려갑니다.
      cursorY === 4 ? this.state = this.STATE_LIST : this.cursorIcon += 10
      soundSystem.play(soundFile.system.systemCursor)
    }

    // 스킬 단축키로 스킬 바로 설정 가능 (슬롯 A만 단축키로 설정 가능, B슬롯은 직접 넣어야 합니다.)
    if (button.buttonSkill0) this.setSkill(0, this.targetIdList[this.cursorIcon])
    if (button.buttonSkill1) this.setSkill(1, this.targetIdList[this.cursorIcon])
    if (button.buttonSkill2) this.setSkill(2, this.targetIdList[this.cursorIcon])
    if (button.buttonSkill3) this.setSkill(3, this.targetIdList[this.cursorIcon])

  }

  /**
   * 스킬 설정 함수: 유저에게 스킬을 등록
   * @param {number} slotNumber 0 ~ 7 (Aslot 0 ~ 3, Bslot 4 ~ 7) 스킬 슬롯 번호
   * @param {number} skillId 스킬의 id
   */
  setSkill (slotNumber, skillId) {
    // 없는 스킬은 등록 불가능 (unused 스킬도 마찬가지)
    let getSkill = dataExportStatPlayerSkill.get(skillId)
    if (getSkill == null || skillId === ID.playerSkill.unused) return

    let getUserSkill = userSystem.getPlayerObjectData().skillList
    getUserSkill[slotNumber] = skillId
    userSystem.setSkillList(getUserSkill)
    soundSystem.play(soundFile.system.systemSkillSelect)
  }

  processButtonList () {
    let button = this.getButtonObject()

    if (button.buttonUp) {
      // 리스트번호가 0인 상태라면, 상태를 스킬로 변경하고, 아니면 리스트번호를 1감소합니다.
      this.cursorList === 0 ? this.state = this.STATE_ICON : this.cursorList--
      soundSystem.play(soundFile.system.systemCursor)
    } else if (button.buttonDown && this.cursorList < 7) {
      this.cursorList++
      soundSystem.play(soundFile.system.systemCursor)
    }
  }

  processButton () {
    super.processButton()
    if (this.state === this.STATE_MENU) {
      this.processButtonMenu()
    } else if (this.state === this.STATE_ICON) {
      this.processButtonIcon()
    } else if (this.state === this.STATE_LIST) {
      this.processButtonList()
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return

    if (this.state === this.STATE_MENU) {
      switch (this.cursorMenu) {
        case 0: this.canceled = true; break
      }
    } else if (this.state === this.STATE_ICON) {
      // 스킬을 설정하고 다음 리스트로 이동
      this.setSkill(this.listPosition, this.targetIdList[this.cursorIcon])
      this.listPosition++

      if (this.listPosition >= 8) {
        this.listPosition = 0
      }
    } else if (this.state === this.STATE_LIST) {
      // 커서 위치를 그대로 두고, 스킬 선택으로 이동
      this.state = this.STATE_ICON
      this.listPosition = this.cursorList
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return

    if (this.state === this.STATE_MENU) {
      // 메인 화면으로 이동
      gameSystem.stateId = gameSystem.STATE_MAIN
    } else if (this.state === this.STATE_ICON) {
      this.state = this.STATE_MENU
    } else if (this.state === this.STATE_LIST) {
      this.state = this.STATE_ICON
    }
    
    soundSystem.play(soundFile.system.systemBack)
  }


  /** 스킬에 대한 정보 이미지를 표시(정보는 이 함수 말고 다른곳에서 출력됨) */
  displayTitle () {
    const image = imageFile.system.skillInfo
    const MENU_LAYER = 40
    const SKILL_LAYER1 = 300
    const SKILL_LAYER2 = 400
    const HEIGHT = 20
    const WIDTH = 800

    let yellowTitle = imageDataInfo.system.skillInfoYellowTitle
    graphicSystem.imageDisplay(image, yellowTitle.x, yellowTitle.y, yellowTitle.width, yellowTitle.height, 0, MENU_LAYER, WIDTH, HEIGHT)
    let yellowData = imageDataInfo.system.skillInfoYellow
    graphicSystem.imageDisplay(image, yellowData.x, yellowData.y, yellowData.width, yellowData.height, 0, MENU_LAYER + HEIGHT, WIDTH, HEIGHT)

    let blueTitle = imageDataInfo.system.skillInfoSkyBlueTitle
    graphicSystem.imageDisplay(image, blueTitle.x, blueTitle.y, blueTitle.width, blueTitle.height, 0, SKILL_LAYER1, WIDTH, HEIGHT)
    let blueData = imageDataInfo.system.skillInfoSkyBlue
    graphicSystem.imageDisplay(image, blueData.x, blueData.y, blueData.width, blueData.height, 0, SKILL_LAYER1 + HEIGHT, WIDTH, HEIGHT)

    let purpleTitle = imageDataInfo.system.skillInfoPurpleBlueTitle
    graphicSystem.imageDisplay(image, purpleTitle.x, purpleTitle.y, purpleTitle.width, purpleTitle.height, 0, SKILL_LAYER2, WIDTH, HEIGHT)
    let purpleData =imageDataInfo.system.skillInfoPurpleBlue
    graphicSystem.imageDisplay(image, purpleData.x, purpleData.y, purpleData.width, purpleData.height, 0, SKILL_LAYER2 + HEIGHT, WIDTH, HEIGHT)
  }

  display () {
    // super.display()
    this.displayBackground()
    this.displayTitle()
    this.displayMenu() // 메뉴가 다른 이미지에 가려지는걸 막기 위해서, 이 함수를 임의로 호출함.
    this.displaySkillSelectData()
    this.displaySKillList()
    this.displaySkillHighlight()
  }

  displaySkillHighlight () {
    if (this.state === this.STATE_LIST) return

    let lineY = this.listPosition < 4 ? 320 : 420
    lineY += (this.listPosition % 4) * 20
    graphicSystem.fillRect(0, lineY, 800, 20, 'orange', 0.4)
  }

  displaySKillList () {
    let userSkillList = userSystem.getSkillList()
    for (let i = 0; i < 4; i++) {
      let outputText1 = this.getSkillInfoString(userSkillList[i])
      let outputText2 = this.getSkillInfoString(userSkillList[i + 4])
      let outputY1 = 300
      let outputY2 = 400
      let skillNum1 = userSkillList[i] - ID.playerSkill.skillNumberStart
      let skillNum2 = userSkillList[i + 4] - ID.playerSkill.skillNumberStart

      graphicSystem.digitalFontDisplay(outputText1, 3, (i + 1) * 20 + outputY1)
      graphicSystem.digitalFontDisplay(outputText2, 3, (i + 1) * 20 + outputY2)
      graphicSystem.imageDisplay(imageFile.system.skillIcon, (skillNum1 % 10) * 40, Math.floor(skillNum1 / 10) * 20, 40, 20, 0, (i + 1) * 20 + outputY1, 40, 20)
      graphicSystem.imageDisplay(imageFile.system.skillIcon, (skillNum2 % 10) * 40, Math.floor(skillNum2 / 10) * 20, 40, 20, 0, (i + 1) * 20 + outputY2, 40, 20)
    }
  }

  displaySkillSelectData () {
    if (this.cursorPosition >= 10 && this.cursorPosition < 60) {
      let position = this.cursorPosition - 10
      let inputString = this.getSkillInfoString(this.targetIdList[position])
      graphicSystem.imageDisplay(imageFile.system.skillIcon, (position % 10) * 40, Math.floor(position / 10) * 20, 40, 20, 0, 60, 40, 20)
      graphicSystem.digitalFontDisplay(inputString, 3, 60)
    }
  }

  /**
   * 스킬의 정보를 string으로 얻어옵니다. 얻어오는 형식은 고정되어있습니다.
   * (공백을 고려하여 글자수가 설정되어있음.)
   * 
   * icon 4, name 16, cooltime 3, multiple: 5, shot 3, repeat 4, delay 4, hit 4, weapon 6, current 10
   * 
   * @param {number} skillId 스킬의 id
   * @returns {string}
   */
  getSkillInfoString (skillId) {
    let getData = dataExportStatPlayerSkill.get(skillId)

    // 아무 데이터도 없으면 공백을 리턴
    if (getData == null) return ''

    let icon = '    ' // 4글자 공백(아이콘 표시 용도)
    let name = getData.name.padEnd(16, ' ').slice(0, 16) 
    let coolTime = ('' + getData.coolTime).padEnd(3, ' ')
    let attackMultiple = ('' + getData.multiple).padEnd(5, ' ')
    let shotCount = ('' + getData.shot).padEnd(3, ' ')
    let repeatCount = ('' + getData.repeat).padEnd(4, ' ')
    let delay = ('' + getData.delay).padEnd(4, ' ')
    let attackCount = ('' + getData.hit).padEnd(4, ' ')
    let weaponAttack = ('' + getData.weaponAttack).padEnd(6, ' ')
    let currentAttack = ('' + getData.getCurrentAttack(userSystem.getPlayerObjectData().attack)).padEnd(9, ' ')

    let finalString = icon + name + coolTime + attackMultiple + shotCount + repeatCount + delay + attackCount + weaponAttack + currentAttack
    return finalString
  }
}

/**
 * 유저 정보 (static 클래스)
 */
export class userSystem {
  /** 레벨, 직접적인 변경 금지 */ static lv = 1
  /** 경험치: 경험치 값은 addExp, setExp등을 통해 수정해주세요. */ static exp = 0
  /** 쉴드 */ static shield = 200
  /** 쉴드 최대치 */ static shieldMax = 200
  /** 체력 (100% 값처럼 취급됨.) */ static hp = 100
  /** 체력 최대치 */ static hpMax = 100
  /** 데미지 경고 프레임 */ static damageWarningFrame = 0
  /** 레벨업 이펙트 프레임 */ static levelUpEffectFrame = 0
  
  /** 스킬 리스트 (총 8개, 이중 0 ~ 3번은 A슬롯, 4 ~ 7번은 B슬롯) */ 
  static skillList = [
    ID.playerSkill.multyshot, ID.playerSkill.missile, ID.playerSkill.arrow, ID.playerSkill.blaster,
    ID.playerSkill.hyperBall, ID.playerSkill.santansu, ID.playerSkill.parapo, ID.playerSkill.critcalChaser
  ]

  /** 무기 리스트, 0 ~ 3번까지만 있음. 4번은 무기를 사용하기 싫을 때 사용 따라서 무기가 지정되지 않음. */
  static weaponList = [
    ID.playerWeapon.multyshot, ID.playerWeapon.missile, ID.playerWeapon.arrow, ID.playerWeapon.laser
  ]
  
  /** 공격력(초당), 참고: 이 값은 processStat함수를 실행하지 않으면 값이 갱신되지 않습니다. */ 
  static attack = 10000

  /** 유저 스탯 숨기기 */ static isHideUserStat = false
  /** 숨기기를 사용할 때, 적용되는 알파값, 완전히 숨겨지면 0.2로 취급 */ static hideUserStatAlpha = 1

  /**
   * 경험치 테이블
   */
  static expTable = [0, // lv 0
    30000, 33000, 36000, 39000, 42000, 45000, 48000, 51000, 54000, 57000, // lv 1 ~ 10
    255500, 256000, 256500, 257000, 257500, 258000, 258500, 259000, 259500, 260000, // lv 11 ~ 20
    333300, 346600, 359900, 373300, 386600, 399900, 413300, 426600, 439900, 450000, // lv 21 ~ 30
  ]

  /**
   * 공격력 보너스 테이블
   */
  static attackBonusTable = [0, // lv 0
    0, 250, 500, 750, 1000, 1200, 1400, 1600, 1800, 2000, // lv 1 ~ 10
    2400, 2800, 3200, 3600, 4000, 4300, 4500, 4700, 5000, // lv 11 ~ 20
    5130, 5240, 5330, 5410, 5500, 5600, 5700, 5800, 6000, // lv 21 ~ 30
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
      if (this.frame >= this.FPS) {
        this.frame -= 60
        this.second++
      }
      if (this.second >= 60) {
        this.second -= 60
        this.minute++
      }
      if (this.minute >= 60) {
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

  static levelReset () {
    this.lv = 1
    this.exp = 0
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

  /** 유저에게 보여지는 스킬의 현재 상태 (참고: A슬롯과 B슬롯의 개념을 사용하지 않습니다.) */
  static skillDisplayStat = [
    { coolTime: 0, id: 0 },
    { coolTime: 0, id: 0 },
    { coolTime: 0, id: 0 },
    { coolTime: 0, id: 0 }
  ]

  /** 유저에게 보여지는 스킬을 설정하는 함수 */
  static setSkillDisplayStat (slotNumber, coolTime, id) {
    this.skillDisplayStat[slotNumber].coolTime = coolTime
    this.skillDisplayStat[slotNumber].id = id
  }

  static setSkillDisplayCooltimeZero () {
    for (let data of this.skillDisplayStat) {
      data.coolTime = 0
    }
  }

  /**
   * 스킬 리스트를 재설정합니다. 스킬 리스트는 반드시 배열로 저장해야하고 길이가 8이여야 합니다.
   * 그 외 길이는 오류를 발생.
   * @param {number[]} skillListId 
   */
  static setSkillList (skillListId) {
    if (skillListId.length !== 8) {
      throw new Error('스킬의 개수는 정확히 8개여야 합니다. 다른 개수를 입력하지 마세요.')
    } else {
      this.skillList = skillListId

      // 스킬 설정과 동시에 유저에게 보여지는 스킬도 같이 변경
      for (let i = 0; i < 4; i++) {
        this.setSkillDisplayStat(i, 0, skillListId[i])
      }
    }
  }

  static getSkillList () {
    return this.skillList
  }

  static getWeaponList () {
    return this.weaponList
  }

  static setWeaponList (weaponList) {
    this.weaponList = weaponList
  }

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
        this.levelUpEffectFrame = 120
      }

      if (levelUpSound) {
        soundSystem.play(soundFile.system.systemLevelUp)
      }
    }
  }

  /**
   * 데미지를 받으면 정해진 시간 동안 체력과 쉴드 색깔이 깜빡거립니다.
   * @param {number} frameCount 
   */
  static setDamageWarningFrame (frameCount = 30) {
    this.damageWarningFrame = frameCount
  }

  static process () {
    this.playTime.process()
    if (this.damageWarningFrame > 0) this.damageWarningFrame--
    if (this.levelUpEffectFrame > 0) this.levelUpEffectFrame--
  }

  static hideUserStat () {
    this.isHideUserStat = true
  }

  static showUserStat () {
    this.isHideUserStat = false
  }

  static display () {
    if (this.isHideUserStat && this.hideUserStatAlpha > 0.2) {
      this.hideUserStatAlpha -= 0.05
    } else if (this.hideUserStatAlpha < 1) {
      this.hideUserStatAlpha += 0.05
    }

    if (this.hideUserStatAlpha < 0.1) {
      this.hideUserStatAlpha = 0.2
    } else if (this.hideUserStatAlpha > 1) {
      this.hideUserStatAlpha = 1
    }

    if (this.hideUserStatAlpha != 1) {
      graphicSystem.setAlpha(this.hideUserStatAlpha)
      this.displayUserStatVer2()
      graphicSystem.setAlpha(1)
    } else {
      this.displayUserStatVer2()
    }

  }

  static getPlayTimeText () {
    return 'PLAY TIME: ' + this.playTime.getTimeString() 
  }

  static displayUserStatVer2 () {
    const statImage = imageFile.system.playerStat
    const statImageX = 20
    const statImageY = 500

    const LAYER_WIDTH = 300
    const LAYER_HEIGHT = 20
    const LAYERX = statImageX + 20
    const LAYERY1 = statImageY + 10
    const LAYERY2 = LAYERY1 + LAYER_HEIGHT
    const LAYERY3 = LAYERY2 + LAYER_HEIGHT

    // S(쉴드), H(체력) 컬러는 첫번째 색깔이 기존색이고, 두번째 ~ 네번째 색깔은 데미지 색깔입니다.
    const S_COLORA = ['#A99DB7', '#ee9ca7', '#FFB75E', '#4B8AFC']
    const S_COLORB = ['#8155C6', '#ffdde1', '#ED8F03', '#A7C6FF']
    const H_COLORA = ['#4B8AFC', '#93291E', '#f5af19', '#A99DB7']
    const H_COLORB = ['#A7C6FF', '#ED213A', '#f12711', '#8155C6']
    const EXP_COLORA = ['#A770EF', '#8E2DE2', '#ad5389']
    const EXP_COLORB = ['#CF8BF3', '#4A00E0', '#3c1053']

    // stat image
    graphicSystem.imageDisplay(statImage, statImageX, statImageY)


    // skill display
    for (let i = 0; i < this.skillDisplayStat.length; i++) {
      const skillNumberImage = imageFile.system.skillNumber
      const skillIconImage = imageFile.system.skillIcon
      const NUMBER_SLICE_WIDTH = 20
      const NUMBER_SLICE_HEIGHT = 20
      // NUMBER_SLICEX는 1번부터 4번까지 차례대로 출력하므로, i값을 이용해 위치를 조절
      const NUMBER_SLICEX = NUMBER_SLICE_WIDTH * i
      // NUMBER_SLICEY는 스킬 쿨타임이 있을 때 흐린 이미지를 처리해야 하는데, 이 이미지가 0, 20위치에서 시작딤.
      const NUMBER_SLICEY = this.skillDisplayStat[i].coolTime <= 0 ? 0 : NUMBER_SLICE_HEIGHT
      const AREA_WIDTH = 75 // 300 / 4 = 75
      const NUMBER_X = LAYERX
      const SKILL_X = LAYERX + NUMBER_SLICE_WIDTH
      const SKILL_WIDTH = 40
      const SKILL_HEIGHT = 20
      
      const OUTPUT_NUMBER_X = NUMBER_X + (i * AREA_WIDTH)
      const OUTPUT_SKILL_X = SKILL_X + (i * AREA_WIDTH)
      const OUTPUT_TIME_X = OUTPUT_SKILL_X
      const OUTPUT_TIME_Y = LAYERY1 + 2

      graphicSystem.imageDisplay(skillNumberImage, NUMBER_SLICEX, NUMBER_SLICEY, NUMBER_SLICE_WIDTH, NUMBER_SLICE_HEIGHT, OUTPUT_NUMBER_X, LAYERY1, NUMBER_SLICE_WIDTH, NUMBER_SLICE_HEIGHT)
      
      // 스킬 쿨타임이 남아있다면, 남은 시간이 숫자로 표시됩니다.
      // 스킬 쿨타임이 없다면, 스킬을 사용할 수 있으며, 스킬 아이콘이 표시됩니다.
      // 해당하는 스킬이 없다면, 스킬은 표시되지 않습니다.
      if (this.skillDisplayStat[i].coolTime >= 1) {
        if (this.skillDisplayStat[i].id !== 0) {
          const skillNumber = this.skillDisplayStat[i].id - 15000 // 스킬의 ID는 15001부터 시작이라, 15000을 빼면, 스킬 번호값을 얻을 수 있음.
          const skillXLine = skillNumber % 10
          const skillYLine = Math.floor(skillNumber / 10)
          graphicSystem.imageDisplay(skillIconImage, skillXLine * SKILL_WIDTH, skillYLine * SKILL_HEIGHT, SKILL_WIDTH, SKILL_HEIGHT, OUTPUT_SKILL_X, LAYERY1, SKILL_WIDTH, SKILL_HEIGHT, 0, 0, 0.5)
        }
        graphicSystem.digitalFontDisplay(this.skillDisplayStat[i].coolTime, OUTPUT_TIME_X, OUTPUT_TIME_Y) // 스킬 쿨타임 시간
      } else {
        if (this.skillDisplayStat[i].id !== 0) {
          const skillNumber = this.skillDisplayStat[i].id - 15000 // 스킬의 ID는 15001부터 시작이라, 15000을 빼면, 스킬 번호값을 얻을 수 있음.
          const skillXLine = skillNumber % 10
          const skillYLine = Math.floor(skillNumber / 10)
          graphicSystem.imageDisplay(skillIconImage, skillXLine * SKILL_WIDTH, skillYLine * SKILL_HEIGHT, SKILL_WIDTH, SKILL_HEIGHT, OUTPUT_SKILL_X, LAYERY1, SKILL_WIDTH, SKILL_HEIGHT)
        }
      }
    }

    // hp + shield display
    const hpPercent = this.hp / this.hpMax
    const HP_WIDTH = Math.floor(LAYER_WIDTH / 2) * hpPercent
    const shieldPercent = this.shield / this.shieldMax
    const SHIELD_WIDTH = Math.floor(LAYER_WIDTH / 2) * shieldPercent

    if (this.damageWarningFrame > 0) {
      let targetFrame = this.damageWarningFrame % H_COLORA.length

      // 체력 게이지 그라디언트
      graphicSystem.gradientDisplay(LAYERX, LAYERY2, HP_WIDTH, LAYER_HEIGHT, H_COLORA[targetFrame], H_COLORB[targetFrame])

      // 쉴드 게이지 그라디언트
      graphicSystem.gradientDisplay(LAYERX + HP_WIDTH, LAYERY2, SHIELD_WIDTH, LAYER_HEIGHT, S_COLORA[targetFrame], S_COLORB[targetFrame])
    } else {
      // 체력 게이지 그라디언트 [파란색]
      graphicSystem.gradientDisplay(LAYERX, LAYERY2, HP_WIDTH, LAYER_HEIGHT, H_COLORA[0], H_COLORB[0])

      // 쉴드 게이지 그라디언트 [하늘색]
      graphicSystem.gradientDisplay(LAYERX + HP_WIDTH, LAYERY2, SHIELD_WIDTH, LAYER_HEIGHT, S_COLORA[0], S_COLORB[0])
    }

    const hpText = this.hp + ' + ' + this.shield + '/' + this.shieldMax
    graphicSystem.digitalFontDisplay(hpText, LAYERX, LAYERY2)


    // lv + exp display
    let expPercent = this.exp / this.expTable[this.lv]
    if (expPercent > 1) expPercent = 1 // 경험치 바가 바깥을 벗어나지 않도록 합니다.

    if (this.levelUpEffectFrame > 0) {
      let targetFrame = this.levelUpEffectFrame % EXP_COLORA.length
      graphicSystem.gradientDisplay(LAYERX, LAYERY3, LAYER_WIDTH, LAYER_HEIGHT, EXP_COLORA[targetFrame], EXP_COLORB[targetFrame])
    } else {
      graphicSystem.gradientDisplay(LAYERX, LAYERY3, LAYER_WIDTH * expPercent, LAYER_HEIGHT, EXP_COLORA[0], EXP_COLORB[0])
    }

    const lvText = 'Lv.' + this.lv + ' ' + this.exp + '/' + this.expTable[this.lv]
    graphicSystem.digitalFontDisplay(lvText, LAYERX, LAYERY3)
  }

  /**
   * 플레이어의 공격력 스탯 재측정
   * 
   * 해당 함수를 사용하지 않으면, 공격력이 변경되어도 해당 공격력이 적용되지 않습니다.
   */
  static processStat () {
    this.attack = 10000 + this.attackBonusTable[this.lv]
  }

  /** 플레이어의 스탯을 재측정하고, 해당 플레이어 정보를 리턴합니다. */
  static getPlayerObjectData () {
    this.processStat()
    return {
      attack: this.attack,
      hp: this.hpMax,
      hpMax: this.hpMax,
      shield: this.shieldMax,
      shieldMax: this.shieldMax,
      lv: this.lv,
      skillList: this.skillList
    }
  }

  /**
   * 저장 형식 (버전에 따라 변경될 수 있음.)
   * 
   * lv,exp,weaponlist x 4,skilllist x 8...
   * 
   * @retruns 세이브데이터의 문자열
   */
  static getSaveData () {
    let inputData = [
      this.lv, this.exp,
      this.weaponList[0], this.weaponList[1], this.weaponList[2], this.weaponList[3],
      this.skillList[0], this.skillList[1], this.skillList[2], this.skillList[3],
      this.skillList[4], this.skillList[5], this.skillList[6], this.skillList[7] 
    ]

    // 배열에 있는 모든 값을 문자열로 연결한다. 참고로 함수를 그대로 쓰면 각 값마다 쉼표가 추가된다.
    return inputData.join()
  }

  /**
   * 
   * @param {string} saveData 
   */
  static setLoadData (saveData) {
    if (saveData == null) return

    let getData = saveData.split(',')
    this.lv = Number(getData[0])
    this.exp = Number(getData[1])

    for (let i = 2, index = 0; i < 6; i++, index++) {
      this.weaponList[index] = Number(getData[i])
    }

    for (let i = 6, index = 0; index < 8; i++, index++) {
      this.skillList[index] = Number(getData[i])
    }

    // 보여지는 부분 설정을 하기 위해 현재 스킬값을 다시 재설정
    this.setSkillList(this.getSkillList())
  }
}

/**
 * 유저 스탯과는 별도로, 게임 정보 또는 필드 정보를 표시하는 역할을 합니다.
 * 참고로, field.js에서 이 클래스를 통해 간접적으로 출력할 정보(텍스트)를 전달합니다.
 */
class StatSystem {
  constructor () {
    /**
     * 해당 라인에 출력할 정보들입니다. 아무 정보가 없어도 배경색은 출력됩니다.
     * @type {{text: number, backgroundColor: string, colorA: string, colorB: string, multiple: number}[]}
     */
    this.lineData = []

    for (let i = 0; i < 2; i++) {
      this.lineData.push({
        text: '',
        backgroundColor: 'lightgrey',
        colorA: '#884488',
        colorB: '#448844',
        multiple: 0,
      })
    }
  }

  /**
   * stat 시스템에 출력할 정보를 입력합니다.
   * @param {number} lineIndex 라인의 번호(현재는 2번까지만 지원)
   * @param {string} text 표시할 텍스트
   * @param {number} value 그라디언트 진행도를 표시할 기준값. 없으면 0 또는 null
   * @param {number} valueMax 그라디언트 진행도를 표시할 최대값, 없으면 0 또는 null
   * @param {string} colorA 색깔 A
   * @param {string} colorB 색깔 B(이것을 넣으면 그라디언트 효과 적용)
   */
  setLineText (lineIndex, text = '', value = 0, valueMax = 0, colorA = '', colorB = colorA) {
    let line = this.lineData[lineIndex]
    line.text = text

    // 기존값과 최대값을 계산하여, 진행도만큼 배율을 표시합니다. (1이 최대, 0이 최소)
    line.multiple = (value !== 0 && valueMax !== 0) ? value / valueMax : 0
    line.colorA = (colorA === '' || colorA == null) ? '#223322' : colorA
    
    // colorB값이 없다면, colorA값으로 지정
    if (line.colorB === '') line.colorB = line.colorA
  }

  display () {
    const LAYER_WIDTH = 360
    const LAYER_HEIGHT = 20
    const LAYERX = 420
    const LAYERY = 520

    for (let i = 0; i < this.lineData.length; i++) {
      const OUTPUT_Y = LAYERY + (LAYER_HEIGHT * i)
      graphicSystem.fillRect(LAYERX, OUTPUT_Y, LAYER_WIDTH, LAYER_HEIGHT, this.lineData[i].backgroundColor)
      graphicSystem.gradientDisplay(LAYERX, OUTPUT_Y, LAYER_WIDTH * this.lineData[i].multiple, LAYER_HEIGHT, this.lineData[i].colorA, this.lineData[i].colorB)
      graphicSystem.digitalFontDisplay(this.lineData[i].text, LAYERX, OUTPUT_Y)

      // 테두리도 추가로 그려야 함.
      graphicSystem.strokeRect(LAYERX, OUTPUT_Y, LAYER_WIDTH, LAYER_HEIGHT, 'black')
    }
  }
}

class UpgradeSystem extends MenuSystem {
  constructor () {
    super()
  }

  processSelect () {
    if (!this.selectedCheck()) return

    this.canceled = true
  }

  processMouseExtend () {
    this.canceled = true
  }

  display () {
    graphicSystem.fillText('해당 기능은 나중에 구현될 예정', 0, 40)
  }
}

class EtcSystem extends MenuSystem {
  constructor () {
    super()
  }

  processSelect () {
    if (!this.selectedCheck()) return

    this.canceled = true
  }

  processMouseExtend () {
    this.canceled = true
  }

  display () {
    graphicSystem.fillText('해당 기능은 나중에 구현될 예정', 0, 40)
  }
}

/**
 * 게임 시스템 (거의 모든 로직을 처리), 경고: new 키워드로 인스턴스를 생성하지 마세요.
 * 이건 단일 클래스입니다.
 * 
 * 참고: 메인 메뉴에 관해서 설정을 하고 싶다면, mainSystem을 수정해주세요.
 * 그리고, 새로운 메뉴가 추가되었다면, 여기서 process, display함수를 사용할 수 있도록 한 뒤에
 * 메인 메뉴에서 이동할 수 있도록 mainSystem도 같이 수정해야 합니다.
 */
export class gameSystem {
  /** 게임 상태 ID */ static stateId = 0
  /** 상태: 메인 */ static STATE_MAIN = 0
  /** 상태: 라운드선택 */ static STATE_ROUND_SELECT = 1
  /** 상태: 무기 선택 */ static STATE_WEAPON_SELECT = 2
  /** 상태: 스킬 선택 */ static STATE_SKILL_SELECT = 3
  /** 상태: 강화 */ static STATE_UPGRADE = 4
  /** 상태: 게임 옵션 */ static STATE_OPTION = 5
  /** 상태: 데이터 설정 */ static STATE_DATA_SETTING = 6
  /** 상태: 기타... */ static STATE_ETC = 7
  /** 상태: 필드(게임 진행중) */ static STATE_FIELD = 12
  /** 게임 첫 실행시 로드를 하기 위한 초기화 확인 변수 */ static isLoad = false
  /** 게임에서 저장된 데이터가 있는지 확인하는 localStorage 키 이름 */ static SAVE_FLAG = 'saveFlag'

  // 일부 시스템은 static을 사용하기 때문에 new를 이용해 인스턴스를 생성하지 않습니다.
  /** 유저 시스템 */ static userSystem = userSystem
  /** 필드 시스템 */ static fieldSystem = fieldSystem
  /** 메인 시스템 */ static mainSystem = new MainSystem()
  /** 옵션 시스템 */ static optionSystem = new OptionSystem()
  /** 라운드 선택 시스템 */ static roundSelectSystem = new RoundSelectSystem()
  /** 데이터 설정 시스템 */ static dataSettingSystem = new DataSettingSystem()
  /** 스텟(게임, 필드 스탯) 표시 시스템 */ static statSystem = new StatSystem()
  /** 무기 선택 시스템 */ static weaponSelectSystem = new WeaponSelectSystem()
  /** 스킬 선택 시스템 */ static skillSelectSystem = new SkillSelectSystem()
  /** 업그레이드 시스템 */ static upgradeSystem = new UpgradeSystem()
  /** etc... 시스템 */ static etcSystem = new EtcSystem()

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
    saveDate: 'saveDate',

    /** 모든 옵션 값들을 저장합니다. */
    optionValue: 'optionValue',

    /** 유저가 가지고 있는 정보 (레벨, 경험치 등...) */
    userData: 'userData',

    /** 필드 데이터 (필드 상태가 아닐경우 이 데이터는 없음) */
    fieldData: 'fieldData',

    /** 무기의 리스트 */
    weaponList: 'weaponList',

    /** 스킬의 리스트 (0 ~ 3번 A슬롯, 4 ~ 7번 B슬롯) */
    skillList: 'skillList'
  }

  /** 저장 지연 시간을 카운트 하는 변수 */ static saveDelayCount = 0
  /**
   * 게임 실행시 불러오기는 단 한번만 합니다.
   * 기본값: false, 한번 로드했다면 true.
   * 참고로 새로고침을 한다면 게임을 재실행하기 때문에 불러오기도 합니다.
   */
  static initLoad = false

  /** 저장 딜레이 프레임 간격 */
  static SAVE_DELAY = 60

  /**
   * 저장 기능은, 1초에 한번씩 진행됩니다. 달래아 - 지연(시간)
   * 이 게임 내에서는, 지연 시간을 딜레이란 단어로 표기합니다.
   */
  static processSave () {
    // 데이터 리셋이 되었다면, 게임을 자동 새로고침하므로 저장 함수를 실행하지 않음.
    if (this.isDataReset) return

    /** 저장 딜레이 시간 */ const SAVE_DELAY = this.SAVE_DELAY

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

    // 모든 옵션 값들 저장
    const optionValue = this.optionSystem.optionValue
    localStorage.setItem(this.saveKey.optionValue, optionValue)

    const userData = this.userSystem.getSaveData()
    localStorage.setItem(this.saveKey.userData, userData)

    // 필드 저장 데이터는, 필드 상태일때만 저장됩니다.
    if (this.stateId === this.STATE_FIELD) {
      const fieldSaveData = fieldSystem.getSaveData()
      localStorage.setItem(this.saveKey.fieldData, JSON.stringify(fieldSaveData))
    } else {
      // 필드 상태가 아니면, 필드 저장 데이터는 삭제
      localStorage.removeItem(this.saveKey.fieldData)
    }
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

    // 옵션 값 불러오기
    const optionValue = localStorage.getItem(this.saveKey.optionValue).split(',')
    this.optionSystem.loadOption(optionValue)

    const userData = localStorage.getItem(this.saveKey.userData)
    this.userSystem.setLoadData(userData)

    const fieldSaveData = localStorage.getItem(this.saveKey.fieldData)
    if (fieldSaveData != null) {
      // 경고: localStoarge 특성상 string값으로 비교해야 합니다.
      // 필드 저장 데이터가 있다면, state를 필드 데이터로 이동
      // 참고로 필드 데이터는 JSON으로 저장되므로, 이걸 JSON.parse 해야합니다.
      this.stateId = this.STATE_FIELD
      fieldSystem.setLoadData(JSON.parse(fieldSaveData))
    }
  }

  static isDataReset = false

  /**
   * 모든 데이터를 삭제합니다.
   * 삭제 기능이 동작한 후, 2초 후 자동으로 새로고침 되기 때문에, 저장기능이 일시적으로 정지도비니다.
   */
  static dataReset () {
    localStorage.clear()
    this.isDataReset = true
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

    switch (this.stateId) {
      case this.STATE_MAIN: this.mainSystem.process(); break
      case this.STATE_OPTION: this.optionSystem.process(); break
      case this.STATE_ROUND_SELECT: this.roundSelectSystem.process(); break
      case this.STATE_FIELD: this.fieldSystem.process(); break
      case this.STATE_DATA_SETTING: this.dataSettingSystem.process(); break
      case this.STATE_WEAPON_SELECT: this.weaponSelectSystem.process(); break
      case this.STATE_SKILL_SELECT: this.skillSelectSystem.process(); break
      case this.STATE_UPGRADE: this.upgradeSystem.process(); break
      case this.STATE_ETC: this.etcSystem.process(); break
    }

    this.processSave()
    this.processLoad()

    // 메인 화면 또는 옵션 화면일때만, 시간 표시
    if (this.stateId === this.STATE_MAIN || this.stateId === this.STATE_OPTION) {
      this.setStatLineText(0, 'fps: ' + currentFps)
      this.setStatLineText(1, this.userSystem.getPlayTimeText())
      this.userSystem.setSkillDisplayCooltimeZero()
    } else if (this.stateId === this.STATE_FIELD) {

    } else {
      this.setStatLineText(0, '')
      this.setStatLineText(1, '')
    }
  }

  /**
   * 게임에 관한 모든 출력은 여기서 진행합니다.
   * [display 함수 내에세 게임에 관한 모든 처리 금지, 출력 함수만 사용하세요.]
   */
  static display () {
    // 화면 지우기
    graphicSystem.clearCanvas()

    // 화면 출력
    switch (this.stateId) {
      case this.STATE_MAIN: this.mainSystem.display(); break
      case this.STATE_OPTION: this.optionSystem.display(); break
      case this.STATE_ROUND_SELECT: this.roundSelectSystem.display(); break
      case this.STATE_FIELD: this.fieldSystem.display(); break
      case this.STATE_DATA_SETTING: this.dataSettingSystem.display(); break
      case this.STATE_WEAPON_SELECT: this.weaponSelectSystem.display(); break
      case this.STATE_SKILL_SELECT: this.skillSelectSystem.display(); break
      case this.STATE_UPGRADE: this.upgradeSystem.display(); break
      case this.STATE_ETC: this.etcSystem.display(); break
    }

    this.userSystem.display()
    this.statSystem.display()
  }

  /**
   * stat 시스템에 출력할 정보를 입력합니다. (StatSystem클래스의 setLineText 함수랑 동일합니다.)
   * @param {number} lineIndex 라인의 번호(현재는 2번까지만 지원)
   * @param {string} text 표시할 텍스트
   * @param {number} value 그라디언트 진행도를 표시할 기준값. 없으면 0 또는 null
   * @param {number} valueMax 그라디언트 진행도를 표시할 최대값, 없으면 0 또는 null
   * @param {string} colorA 색깔 A
   * @param {string} colorB 색깔 B(이것을 넣으면 그라디언트 효과 적용)
   */
  static setStatLineText(lineIndex, text, value, valueMax, colorA, colorB) {
    this.statSystem.setLineText(lineIndex, text, value, valueMax, colorA, colorB)
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
  * 기본값: 16.6 = 60fps
  */
  const fpsInterval = 16.6 // 1seconds 60fps limit, do not exceed 60fps!

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
    // 캔버스가 풀스크린인 경우
    // 게임 기본 해상도는 800x600 입니다.
    const gameWidth = 800
    const gameHeight = 600

    if (document.fullscreenElement === canvas) {
      // 풀스크린일 때, 캔버스는 중앙에 위치하고, 화면은 채울 수 있는 부분까지 확대됩니다.
      // y축은 전부 채워지지만, x축은 전부 채워지지 않으므로, y축을 이용해 배율 계산을 합니다.
      const canvasZoom = canvas.offsetHeight / gameHeight // 1.28 (768 / 600)

      // 그렇게되면, 양 옆쪽이 비게되는데, 이 사이즈를 계산해야 합니다.
      const borderSize = (canvas.offsetWidth - (gameWidth * canvasZoom)) / 2 // (1366 - 1024) / 2 = 171

      // 그렇게 해서, X축은 boarderSize값을 빼고 1.28로 나눈 값으로 계산하고,
      // Y축은 1.28로 나눈 값을 마우스 좌표값으로 정의합니다.
      // 마우스 좌표값은 소수점 버림
      let mouseX = (e.offsetX - borderSize) / canvasZoom
      let mouseY = e.offsetY / canvasZoom
      mouseSystem.mouseDown(Math.floor(mouseX), Math.floor(mouseY))
    } else if (canvas.offsetWidth === gameWidth && canvas.offsetHeight === gameHeight) {
      // 캔버스의 크기가 게임 기본 크기인경우 다른 처리를 할 필요없이 offsetX, offsetY를 사용합니다.
      mouseSystem.mouseDown(e.offsetX, e.offsetY)
    } else {
      // 캔버스 사이즈가 달라진 경우, 달라진 사이즈에 맞춰서 배율을 곱해서 처리함.
      // 캔버스의 크기는 한쪽만 변경해도 다른 한쪽의 비율이 맞춰져서 자동으로 변경되기 때문에
      // 너비 또는 높이 중 하나만 정확하게 계산하면 배율을 구할 수 있습니다.
      const canvasZoom = canvas.offsetWidth / gameWidth

      let mouseX = e.offsetX / canvasZoom
      let mouseY = e.offsetY / canvasZoom
      mouseSystem.mouseDown(Math.floor(mouseX), Math.floor(mouseY))
    }
  }
})
canvas.addEventListener('mousemove', () => {
  // mouseSystem.mouseMove(e.offsetX, e.offsetY)
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
