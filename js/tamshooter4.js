//@ts-check

import { imageSrc, imageDataInfo, ImageDataObject } from "./imageSrc.js";
import { dataExportStatItem, dataExportStatPlayerSkill, dataExportStatPlayerWeapon, dataExportStatRound, StatItem, StatRound } from "./dataStat.js";
import { soundSrc } from "./soundSrc.js";
import { ID } from "./dataId.js";
import { gameVar, userSystem } from "./game.js";
import { fieldSystem } from "./field.js";
import { game, gameFunction } from "./game.js";
import { stringText, systemText } from "./text.js";
import { dataExportPlayerWeapon } from "./dataPlayer.js";

const versionText = 'created by skz1024 | ver 0.50 | 2024/05'
let digitalDisplay = gameFunction.digitalDisplay
let loadComplete = false

/** 시스템에서 가장 먼저 로드될 이미지 목록 */
let systemImageList = []
for (let target in imageSrc.system) {
  let src = imageSrc.system[target]
  systemImageList.push(src)
}
systemImageList.push(imageSrc.weapon.weapon) // 무기 이미지
systemImageList.push(imageSrc.system.roundIcon) // 라운드 아이콘 이미지

// 이미지 생성 시작
for (let i = 0; i < systemImageList.length; i++) {
  game.graphic.createImage(systemImageList[i])
}

// 사운드 생성 시작
let systemSoundList = []
for (let target in soundSrc.system) {
  let src = soundSrc.system[target]
  systemSoundList.push(src)
}
for (let target in soundSrc.skill) {
  let src = soundSrc.skill[target]
  systemSoundList.push(src)
}

for (let i = 0; i < systemSoundList.length; i++) {
  game.sound.createAudio(systemSoundList[i])
}

game.process = () => {
  gameSystem.process()
}
game.graphicFps = 60
game.display = () => {
  if (loadComplete) {
    gameSystem.display()
  } else {
    let imageLoadCount = game.graphic.getImageCompleteCount(systemImageList)
    let soundLoadCount = game.sound.getAudioLoadCompleteCount(systemSoundList)
    game.graphic.fillRect(0, 0, game.graphic.CANVAS_WIDTH, 80, 'grey')
    digitalDisplay('tamshooter 4 loading system', 0, 0)
    digitalDisplay('image load: ' + imageLoadCount + '/' + systemImageList.length, 0, 20)
    digitalDisplay('sound load: ' + soundLoadCount + '/' + systemSoundList.length, 0, 40)
    if (imageLoadCount === systemImageList.length) {
      // 사운드는 유저 제스처를 사용하기 전까지 로드 할 수 없으므로, 이미지 로드 여부만 파악합니다.
      loadComplete = true
    }
  }
}


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
  constructor (x, y, width, height, text = '', color = 'silver', endColor = '', focusColor = 'blue') {
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

    /** 숨김 옵션. 이 옵션이 켜져있을경우, 출력, 포커스, 클릭이 전부 무효가 됨 */ this.hidden = false
  }

  /**
   * 박스가 마우스 위에 있는지 충돌 여부를 검사
   * @param {number} mouseX
   * @param {number} mouseY
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
      game.graphic.strokeRect(this.x, this.y, this.width, this.height, this.borderColor)
    }

    if (this.color === '') return
    
    if (this.endColor != '') {
      game.graphic.gradientRect(this.x + this.borderWidth, this.y + this.borderWidth, this.width - (this.borderWidth * 2), this.height - (this.borderWidth * 2), [this.color, this.endColor])
    } else {
      game.graphic.fillRect(this.x + this.borderWidth, this.y + this.borderWidth, this.width - (this.borderWidth * 2), this.height - (this.borderWidth * 2), this.color)
    }
  }

  displayFocus () {
    if (this.focus) {
      game.graphic.fillRect(this.x, this.y, this.width, this.height, this.focusColor, 0.5)
    }
  }

  displayText () {
    // 텍스트
    if (this.text) {
      game.graphic.fillText(this.text, this.x + this.borderWidth + 2, this.y + this.borderWidth)
    }
  }

  /**
   * 박스를 출력하는 함수
   */
  display () {
    if (this.hidden) return

    this.displayBackGround()
    this.displayFocus()
    this.displayText()
  }

  /**
   * 박스를 클릭한 경우 (참고: 마우스 좌표값을 넣지 않으면 박스 입장에서 박스를 클릭했는지 알 수 없습니다.)
   * @param {number} mouseX 클릭한 마우스의 x좌표
   * @param {number} mouseY 클릭한 마우스의 y좌표
   */
  click (mouseX, mouseY) {
    if (this.hidden) return

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
  /**
   * 새로운 박스 이미지 생성
   * @param {string} imageSrc 이미지의 경로
   * @param {ImageDataObject} imageData 이미지데이터
   */
  constructor (x = 0, y = 0, width = 0, height = 0, text = '', imageSrc = '', imageData) {
    super(x, y, width, height, text)
    this.imageSrc = imageSrc

    /** @type {ImageDataObject} */ this.imageData = imageData

    if (width === 0) this.width = imageData.width
    if (height === 0) this.height = imageData.height 
  }

  displayBackGround () {
    super.displayBackGround()

    if (this.imageSrc == null || this.imageData == null) return
    game.graphic.imageDisplay(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
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

  /** 어떤 버튼이 눌렸는지를 오브젝트로 확인합니다. 버튼이 눌린것은 boolean값으로 확인해야합니다. */
  getButtonObject () {
    const buttonUp = game.control.getButtonInput(game.control.buttonIndex.UP)
    const buttonDown = game.control.getButtonInput(game.control.buttonIndex.DOWN)
    const buttonLeft = game.control.getButtonInput(game.control.buttonIndex.LEFT)
    const buttonRight = game.control.getButtonInput(game.control.buttonIndex.RIGHT)
    const buttonSkill0 = game.control.getButtonInput(game.control.buttonIndex.L1)
    const buttonSkill1 = game.control.getButtonInput(game.control.buttonIndex.L2)
    const buttonSkill2 = game.control.getButtonInput(game.control.buttonIndex.R1)
    const buttonSkill3 = game.control.getButtonInput(game.control.buttonIndex.R2)
    return  {
      buttonUp, buttonDown, buttonLeft, buttonRight, buttonSkill0, buttonSkill1, buttonSkill2, buttonSkill3
    }
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
    let buttonStart = game.control.getButtonInput(game.control.buttonIndex.START)
    let buttonA = game.control.getButtonInput(game.control.buttonIndex.A)
    let buttonSelect = game.control.getButtonInput(game.control.buttonIndex.SELECT)
    let buttonB = game.control.getButtonInput(game.control.buttonIndex.B)

    if (buttonStart || buttonA) {
      this.selected = true
    } else if (buttonSelect|| buttonB) {
      this.canceled = true
    }
  }

  /**
   * 로직 처리 - 마우스 입력
   * 이 함수는 상속받지 마시고, 대신 추가로 구현해야 하는 기능이 있다면 processMouseExtends 함수에 내용을 추가해주세요.
   * 
   * 클릭 조건을 확인하기 위해서 if (!game.control.getMouseDown()) return 를 사용해주세요.
   * 안그러면 마우스가 닿기만 해도 반응할 수 있습니다.
   */
  processMouse () {
    this.processMouseClick()
  }

  processMouseClick () {
    if (!game.control.getMouseClick()) return

    this.mouseLogicMenuList()
    this.processMouseClickExtend()
  }

  /**
   * 마우스 처리 확장 함수.
   * 이것은 processMouse의 조건 처리때문에 super.processMouse를 사용한 다음, 
   * 마우스 클릭을 못처리하는 상태를 막기 위해 만든 함수입니다.
   */
  processMouseClickExtend () {

  }

  /**
   * 마우스의 포지션을 기준으로 어느 메뉴가 눌렸는지를 확인합니다.
   * 
   * 겹쳐진경우, 가장 마지막에 만들어진것이 선택됨
   */
  mouseLogicMenuList () {
    const mouseX = game.control.getMousePosition().x
    const mouseY = game.control.getMousePosition().y

    // 마지막에 만들어진것부터 조사합니다. (이렇게하면 겹쳤을 때 나중에 만들어진게 우선됨)
    for (let i = this.menuList.length - 1; i >= 0; i--) {
      if (this.menuList[i] == null) continue
      if (this.menuList[i].hidden) continue

      const currentBox = this.menuList[i]
      if (currentBox.collision(mouseX, mouseY)) {
        this.cursorPosition = i
        this.selected = true
        break
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
    // if (!this.selectedCheck()) return

    // 이 방법도 있지만 들여쓰기가 필요하고 로직이 복잡할 수 있으므로 사용하진 마세요.
    // if (this.selectedCheck()) {
      // 로직...
    // }

    // 그러나 이 함수를 호출할 때 절대 이 방식을 사용하지마세요. 비직관적입니다.
    // 구조상 재귀호출 될 염려는 없으므로, 일단은 냅두겠습니다.
    // if (this.selectedCheck()) this.processSelect()
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
    game.graphic.gradientRect(0, 0, game.graphic.CANVAS_WIDTH, game.graphic.CANVAS_HEIGHT, this.backgroundColor)
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
  /** 메뉴: 인벤토리 */ MENU_INVENTORY = 4
  /** 메뉴: 스토리 */ MENU_STORY = 5
  /** 메뉴: 옵션 */ MENU_OPTION = 6
  /** 메뉴: 데이터 셋팅 */ MENU_DATA_SETTING = 7
  /** 메뉴: 기타 */ MENU_ETC = 8
  /** 메뉴: 풀스크린 */ MENU_FULLSCREEN = 9

  menuImageSrc = imageSrc.system.menuList
  imgDList = [
    imageDataInfo.menuList.roundSelect,
    imageDataInfo.menuList.weaponSelect,
    imageDataInfo.menuList.skillSelect,
    imageDataInfo.menuList.upgrade,
    imageDataInfo.menuList.inventory,
    imageDataInfo.menuList.story,
    imageDataInfo.menuList.option,
    imageDataInfo.menuList.data,
    imageDataInfo.menuList.etc,
  ]

  constructor () {
    super()
    const MENU_WIDTH = this.imgDList[0].width
    const MENU_HEIGHT = this.imgDList[0].height
    const START_Y = 100

    for (let i = 0; i < this.imgDList.length; i++) {
      this.menuList[i] = new BoxImageObject(0, START_Y + (i * MENU_HEIGHT), MENU_WIDTH, MENU_HEIGHT, '', this.menuImageSrc, this.imgDList[i])
    }
    this.backgroundColor = ['#78b3f2', '#d2dff6']
  }

  processButton () {
    super.processButton()

    // 버튼 눌렀는지 확인하는 변수, true or false
    const buttonInputUp = game.control.getButtonInput(game.control.buttonIndex.UP)
    const buttonInputDown = game.control.getButtonInput(game.control.buttonIndex.DOWN)

    if (buttonInputUp && this.cursorPosition > 0) {
      game.sound.play(soundSrc.system.systemCursor)
      this.cursorPosition--
    } else if (buttonInputDown && this.cursorPosition < this.menuList.length - 1) {
      game.sound.play(soundSrc.system.systemCursor)
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
      case this.MENU_INVENTORY: gameSystem.stateId = gameSystem.STATE_INVENTORY; break
      case this.MENU_STORY: gameSystem.stateId = gameSystem.STATE_STORY; break
      case this.MENU_FULLSCREEN: this.requestFullScreen(); break
    }

    // 사운드 출력
    game.sound.play(soundSrc.system.systemSelect)
  }

  /**
   * 풀스크린을 요청합니다.
   * [일부 브라우저는 기능을 지원하지 않을 수 있음.]
   * 
   * pc에서는 F11을 통해 풀스크린 전환이 가능하므로, 게임 내에선 제거됨
   * 
   * @deprecated
   */
  requestFullScreen () {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      try {
        if (game.currentDevice === game.device.PC) {
          game.graphic.canvas.requestFullscreen()
        } else {
          // gameSystem.setStatLineText(1, 'MOBILE NOT USING THIS')
        }
      } catch {
        // gameSystem.setStatLineText(1, 'NOT SUPPORTED FULL SCREEN')
      }
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
    game.graphic.imageView(imageSrc.system.tamshooter4Title, 0, 10)
    digitalDisplay(versionText, 10, 70)
  }
}

class OptionSystem extends MenuSystem {
  MENU_BACK = 0
  MENU_SOUND = 1
  MENU_SOUND_VOLUME = 2
  MENU_MUSIC = 3
  MENU_MUSIC_VOLUME = 4
  MENU_RESULT_AUTO_SKIP = 5
  MENU_SHOW_ENEMY_HP = 6
  MENU_SHOW_DAMAGE = 7

  boxText = ['<- back', 
    'sound (효과음)',
    'sound volume (사운드 볼륨)',
    'music (음악)',
    'music volume (음악 볼륨)',
    'result auto skip (결과 자동 건너뛰기)',
    'show enemy hp (적 체력 보여주기)',
    'show damage (데미지 보여주기)']

  optionValue = {
    soundOn: true,
    musicOn: true,
    soundVolume: 100,
    musicVolume: 100,
    resultAutoSkip: true,
    showEnemyHp: true,
    showDamage: true
  }

  constructor () {
    super()
    const MENU_X = 0
    const MENU_Y = 0
    const MENU_HEIGHT = 28
    const MENU_LINE_Y = 30
    const MENU_WIDTH = 390
    const startColor = '#ffcd75'
    const endColor = '#ffcd75'
    const focusColor = '#432e0a'

    for (let i = 0; i < this.boxText.length; i++) {
      this.menuList[i] = new BoxObject(MENU_X, MENU_Y + (MENU_LINE_Y * i), MENU_WIDTH, MENU_HEIGHT, this.boxText[i], startColor, endColor, focusColor)
    }

    this.backgroundColor = ['#ffc494', '#ffd2a8']
  }

  getSaveData () {
    return this.optionValue
  }

  /** 
   * 옵션의 값을 설정하거나 해제합니다. (미완성된 함수) 
   * @deprecated
   * */
  setOption (optionIndex = 0) {
    let option = this.optionValue

    switch (optionIndex) {
      case this.MENU_SOUND:
        option.soundOn = !option.soundOn
        break
      case this.MENU_SOUND_VOLUME:
        // 현재 사운드 볼륨을 가져오고 10을 증가시킵니다.
        let currentSoundVolume = option.soundVolume
        currentSoundVolume += 10
        if (currentSoundVolume > 100) currentSoundVolume = 0

        // 사운드 볼륨 값을 저장한 후, 실제 엔진의 게인을 조정하여 사운드 볼륨을 조정합니다.
        option.soundVolume = currentSoundVolume
        game.sound.setGain(currentSoundVolume / 100)
        break
      case this.MENU_MUSIC:
        option.musicOn = !option.musicOn
        break
      case this.MENU_MUSIC_VOLUME:
        // 현재 음악 볼륨을 가져오고 10을 증가시킵니다.
        let currentMusicVolume = option.musicVolume
        currentMusicVolume += 10
        if (currentMusicVolume > 100) currentMusicVolume = 0

        // 음악 볼륨 값을 저장한 훟, 실제 엔진의 게인을 조정하여 음악 볼륨을 조정합니다.
        option.musicVolume = currentMusicVolume
        game.sound.setMusicGain(currentMusicVolume / 100)
        break
      case this.MENU_RESULT_AUTO_SKIP:
        // 이 옵션은 6초 후 자동으로 메인화면으로 이동하게 해주는 기능
        // 사용자는 추가적인 작업을 할 필요가 없다.
        // 이 기능을 끄면 여러분이 직접 ENTER를 눌러야 나갈 수 있습니다.
        option.resultAutoSkip = !option.resultAutoSkip
        break
      case this.MENU_SHOW_ENEMY_HP:
        option.showEnemyHp = !option.showEnemyHp
        break
      case this.MENU_SHOW_DAMAGE:
        option.showDamage = !option.showDamage
        break
    }

    this.optionEnable() // 설정된 옵션값을 적용
  }

  /** 옵션의 값을 실제 게임에 적용하는 함수 */
  optionEnable () {
    // 필드에게 옵션 값 전달
    fieldSystem.option.resultAutoSkip = this.optionValue.resultAutoSkip
    fieldSystem.option.showEnemyHp = this.optionValue.showEnemyHp
    fieldSystem.option.showDamage = this.optionValue.showDamage
    fieldSystem.option.musicOn = this.optionValue.musicOn
    fieldSystem.option.soundOn = this.optionValue.soundOn

    // 사운드가 켜져있으면, 현재 볼륨값으로 설정하고 아닐경우 0으로 설정
    // 주의: 사운드 게인은 0 ~ 1 사이의 범위입니다.
    let soundValue = this.optionValue.soundOn ? this.optionValue.soundVolume / 100 : 0
    game.sound.setGain(soundValue)
    game.sound.soundOn = this.optionValue.soundOn

    let musicValue = this.optionValue.musicOn ? this.optionValue.musicVolume / 100 : 0
    game.sound.setMusicGain(musicValue)
    game.sound.musicOn = this.optionValue.musicOn
  }
  
  process () {
    super.process()
  }

  processButton () {
    super.processButton()

    const buttonInputUp = game.control.getButtonInput(game.control.buttonIndex.UP)
    const buttonInputDown = game.control.getButtonInput(game.control.buttonIndex.DOWN)
    const buttonInputLeft = game.control.getButtonInput(game.control.buttonIndex.LEFT)
    const buttonInputRight = game.control.getButtonInput(game.control.buttonIndex.RIGHT)

    if (buttonInputUp && this.cursorPosition > 0) {
      game.sound.play(soundSrc.system.systemCursor)
      this.cursorPosition--
    } else if (buttonInputDown && this.cursorPosition < this.menuList.length - 1) {
      game.sound.play(soundSrc.system.systemCursor)
      this.cursorPosition++
    }

    // if (buttonInputLeft || buttonInputRight) {
    //   switch (this.cursorPosition) {
    //     case this.MENU_SOUND_VOLUME:
    //       game.sound.setOption(this.MENU_SOUND_VOLUME)
    //       break
    //     case this.MENU_MUSIC_VOLUME:
    //       game.sound.setOption(this.MENU_MUSIC_VOLUME)
    //       break
    //     case this.MENU_MASTER_VOLUME:
    //       game.sound.setOption(this.MENU_MASTER_VOLUME)
    //       break
    //     case this.MENU_BACK:
    //       break
    //     default:
    //       this.selected = true
    //       break
    //   }
    // }

    // if (buttonInputRight) {
    //   switch (this.cursorPosition) {
    //     case this.MENU_SOUND_VOLUME:
    //       game.sound.setOption(game.sound.TYPE_SOUND_VOLUME, game.sound.getOption().soundVolume + 10)
    //       break
    //     case this.MENU_MUSIC_VOLUME:
    //       game.sound.setOption(game.sound.TYPE_MUSIC_VOLUME, game.sound.getOption().musicVolume + 10)
    //       break
    //     case this.MENU_MASTER_VOLUME:
    //       game.sound.setOption(game.sound.TYPE_MASTER_VOLUME, game.sound.getOption().masterVolume + 10)
    //       break
    //     case this.MENU_BACK:
    //       break
    //     default:
    //       this.selected = true
    //       break
    //   }
    // }

    // 사운드 출력
    if (buttonInputLeft || buttonInputRight) {
      switch (this.cursorPosition) {
        case this.MENU_SOUND_VOLUME:
          game.sound.play(soundSrc.system.systemCursor)
          break
      }
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return

    if (this.cursorPosition === this.MENU_BACK) {
      this.canceled = true
    } else {
      this.setOption(this.cursorPosition)
    }

    // 사운드 출력
    switch (this.cursorPosition) {
      case this.MENU_SOUND_VOLUME:
        game.sound.play(soundSrc.system.systemCursor)
        break
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return

    game.sound.play(soundSrc.system.systemBack)
    gameSystem.stateId = gameSystem.STATE_MAIN
  }

  displayMenu () {
    let optionArray = [
      null,
      this.optionValue.soundOn,
      this.optionValue.soundVolume,
      this.optionValue.musicOn,
      this.optionValue.musicVolume,
      this.optionValue.resultAutoSkip,
      this.optionValue.showEnemyHp,
      this.optionValue.showDamage,
    ]

    const imageOptionCheckHeight = 64
    const imageOptionCheckWidth = 30

    for (let i = 0; i < this.menuList.length; i++) {
      this.menuList[i].display()
      let optionImageSrc = imageSrc.system.mainSystem
      let imageOptionCheckedData = imageDataInfo.mainSystem.optionChecked
      let imageOptionUnCheckedData = imageDataInfo.mainSystem.optionUnChecked

      // 두번째(1번) 메뉴부터 옵션 결과값이 쉽게 보여지도록 하얀색 박스 배경을 만듬.
      if (i !== 0) {
        game.graphic.fillRect(this.menuList[i].x + this.menuList[i].width, this.menuList[i].y, 100, this.menuList[i].height, 'white')
      }

      if (i >= 1) { // 첫번째 줄부터 옵션 값이 있으므로 여기서부터 옵션 값 출력
        // 옵션 값 종류에 따라 결과값 표시
        switch (typeof optionArray[i]) {
          case 'boolean':
            if (optionArray[i] === true) {
              gameFunction.imageObjectDisplay(optionImageSrc, imageOptionCheckedData, this.menuList[i].x + this.menuList[i].width, this.menuList[i].y)
            } else {
              gameFunction.imageObjectDisplay(optionImageSrc, imageOptionUnCheckedData, this.menuList[i].x + this.menuList[i].width, this.menuList[i].y)
            }
            break
          case 'number':
            digitalDisplay(optionArray[i] + '', this.menuList[i].x + this.menuList[i].width, this.menuList[i].y)
            break
        }
      }

    }
  }

  /**
   * 사용불가능
   * @deprecated
   */
  getOptionObject () {
    return {
      sound: this.optionValue[this.MENU_SOUND],
      music: this.optionValue[this.MENU_MUSIC],
      resultAutoSkip: this.optionValue[this.MENU_RESULT_AUTO_SKIP],
      showEnemyHp: this.optionValue[this.MENU_SHOW_DAMAGE],
      showDamage: this.optionValue[this.MENU_SHOW_DAMAGE]
    }
  }

  /** 사용불가능 @deprecated */
  setOptionMusicSound (music, sound) {
    // this.optionValue[this.MENU_MUSIC] = music
    // this.optionValue[this.MENU_SOUND] = sound
  }
}

/**
 * 메뉴: 라운드 시스템
 */
class RoundSelectSystem extends MenuSystem {
  /** 커서모드: 메인라운드 선택 (커서포지션 범위: 10 ~ 19) */ CURSORMODE_MAIN = 1
  /** 커서모드: 서브라운드 선택 (예를들어, 1-4면, 1이 메인, 4가 서브라운드임, 커서포지션 범위: 20 ~ 39) */ CURSORMODE_SUB = 2

  CURSOR_POSITION_START_BACK = 0
  /** 커서포지션을 계산할 때 main모드일경우 어느 지점부터 시작하는지에 대한 상수 값 */ CURSOR_POSITION_START_MAIN = 0
  /** 커서포지션을 계산할 때 sub모드일경우 어느 지점부터 시작하는지에 대한 상수 값 */ CURSOR_POSITION_START_SUB = 10

  /** 커서 라운드 */ cursorRound = 0
  /** 커서 서브 라운드 */ cursorSubRound = 0
  /** 커서가 마우스를 클릭한 포지션 */ cursorMouseClickPosition = 0
  /** 커서 모드 */ cursorMode = this.CURSORMODE_MAIN
  /** 최소 라운드: 게임은 1라운드부터 시작 */ MIN_ROUND = 1
  /** 최대 라운드: 8 */ MAX_ROUND = 8
  roundIconSrc = imageSrc.system.roundIcon
  roundIconSize = { width: 59, height: 59 }


  constructor () {
    super()

    let r = ID.round
    const unused = ID.round.UNUSED

    /** @type {object} */
    this.roundIdTable = {
      r1: [r.round1_1, r.round1_2, r.round1_3, r.round1_4, r.round1_5, r.round1_6, unused, unused, r.round1_test, unused],
      r2: [r.round2_1, r.round2_2, r.round2_3, r.round2_4, r.round2_5, r.round2_6, unused, unused, r.round2_test, r.round3_test],
      r3: [r.round3_1, r.round3_2, r.round3_3, r.round3_4, r.round3_5, r.round3_6, r.round3_7, r.round3_8, r.round3_9, r.round3_10],
    }

    this.roundWorldIconNumber = StatRound.world.iconList
    this.roundWorld = StatRound.world

    const layerX = 10
    const layer1Y = 10
    const layerWidth = 60
    const layerHeight = 60
    const layerYSection = 80

    // 0: back
    this.menuList.push(new BoxObject(layerX, layer1Y, layerWidth, layerHeight, '<<', 'orange', 'yellow'))

    // 1 ~ 9: mainRound
    const layer2Y = layer1Y + layerYSection + 10
    const layerSection = 80
    for (let i = 1; i <= 9; i++) {
      this.menuList[i] = new BoxObject(layerX + (i * layerSection), layer1Y, layerWidth, layerHeight, '', 'orange', 'gold')
    }

    // 10 ~ 19: subRound
    for (let i = 10; i <= 19; i++) {
      // 맨 끝번부터 추가되기 때문에 push나, this.menuList[i + 20] 이나 똑같이 동작함.
      let XPosition = layerX + ((i - 10) * layerSection)
      this.menuList[i] = new BoxObject(XPosition, layer2Y, layerWidth, layerHeight, '', 'skyblue', 'white')
      this.menuList[i].hidden = true 
    }

    this.backgroundColor = ['#757F9A', '#D7DDE8']
  }

  processButton () {
    super.processButton()

    // 이 변수들은 버튼 입력 조건문을 간편하게 작성하기 위한 변수입니다.
    const buttonUp = game.control.getButtonInput(game.control.buttonIndex.UP)
    const buttonDown = game.control.getButtonInput(game.control.buttonIndex.DOWN)
    const buttonLeft = game.control.getButtonInput(game.control.buttonIndex.LEFT)
    const buttonRight = game.control.getButtonInput(game.control.buttonIndex.RIGHT)
    const leftEnd = 0
    const rightEnd = 9

    if (this.cursorMode === this.CURSORMODE_MAIN) {
      if (buttonDown) {
        this.selected = true
      } else if (buttonLeft && this.cursorRound > leftEnd) {
        this.cursorRound--
        game.sound.play(soundSrc.system.systemCursor)
      } else if (buttonRight && this.cursorRound < rightEnd) {
        this.cursorRound++
        game.sound.play(soundSrc.system.systemCursor)
      }
    } else if (this.cursorMode === this.CURSORMODE_SUB) {
      if (buttonUp) {
        this.canceled = true
      } else if (buttonLeft && this.cursorSubRound % 10 > leftEnd) {
        this.cursorSubRound--
        game.sound.play(soundSrc.system.systemCursor)
      } else if (buttonRight && this.cursorSubRound % 10 < rightEnd) {
        this.cursorSubRound++
        game.sound.play(soundSrc.system.systemCursor)
      }
    }

    // 버튼 조작이 끝날때마다 커서 위치를 변경합니다.
    this.cursorPositionCalcuration()
  }

  processMouse () {
    super.processMouse()
    this.cursorRoundCalcuration()
  }

  processMouseClickExtend () {
    // 마우스 클릭 1번으로는 라운드 선택이 안되게 변경합니다.
    // 마우스를 클릭하면, 마우스클릭 포지션이 변경되고, 이 값이 커서포지션과 같다면
    // 마우스를 두번 연속 같은곳을 눌렀다는 뜻이므로, 해당 기능을 실행합니다.
    if (this.cursorPosition === this.cursorMouseClickPosition) {
      // 다른 곳이 클릭되어도 기능이 실행되는 문제가 있어, 해당 메뉴가 클릭했는지도 확인함
      if (this.menuList[this.cursorPosition].clicked) {
        this.selected = true
      }
    } else {
      this.selected = false
      this.cursorMouseClickPosition = this.cursorPosition
    }

    // 취소를 눌렀을때는 취소 메뉴가 바로 작동
    if (this.cursorPosition === 0) {
      if (this.cursorMode === this.CURSORMODE_SUB) {
        this.cursorMode = this.CURSORMODE_MAIN
        this.selected = false
      } else {
        this.selected = true
      }
    }
  }

  process () {
    super.process()
    this.processMenuHidden()
  }

  processMenuHidden () {
    if (this.cursorMode === this.CURSORMODE_MAIN) {
      // main show
      for (let i = 1; i <= this.CURSOR_POSITION_START_SUB - 1; i++) {
        this.menuList[i].hidden = false
      }
      // sub hidden
      for (let i = this.CURSOR_POSITION_START_SUB; i <= this.CURSOR_POSITION_START_SUB + 9; i++) {
        this.menuList[i].hidden = true
      }
    } else if (this.cursorMode === this.CURSORMODE_SUB) {
      // main hidden
      for (let i = 1; i <= this.CURSOR_POSITION_START_SUB - 1; i++) {
        this.menuList[i].hidden = true
      }
      // sub show
      for (let i = this.CURSOR_POSITION_START_SUB; i <= this.CURSOR_POSITION_START_SUB + 9; i++) {
        this.menuList[i].hidden = false
      }
    }
  }

  /**
   * (키보드 조작용)
   * 
   * 현재 커서 라운드와 모드와 서브라운드를 기준으로 커서포지션을 계산합니다.
   */
  cursorPositionCalcuration () {
    if (this.cursorMode === this.CURSORMODE_MAIN) {
      // 위치: 0 ~ 9
      this.cursorPosition = this.cursorRound + 0
    } else if (this.cursorMode === this.CURSORMODE_SUB) {
      // 위치: 10 ~ 19
      this.cursorPosition = this.cursorSubRound + 10
    }
  }

  /**
   * (마우스 조작용)
   * 
   * 현재 커서포지션을 기준으로 커서의 라운드와 서브라운드와 모드를 계산합니다.
   */
  cursorRoundCalcuration () {
    if (this.cursorPosition >= 0 && this.cursorPosition <= 9) {
      this.cursorMode = this.CURSORMODE_MAIN
      this.cursorRound = this.cursorPosition
    } else if (this.cursorPosition >= 10 && this.cursorPosition <= 19) {
      this.cursorMode = this.CURSORMODE_SUB
      this.cursorSubRound = this.cursorPosition - this.CURSOR_POSITION_START_SUB
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return

    if (this.cursorMode === this.CURSORMODE_MAIN) {
      gameSystem.stateId = gameSystem.STATE_MAIN
      game.sound.play(soundSrc.system.systemBack)
    } else if (this.cursorMode === this.CURSORMODE_SUB) {
      this.cursorMode = this.CURSORMODE_MAIN
      game.sound.play(soundSrc.system.systemBack)
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return

    if (this.cursorMode === this.CURSORMODE_MAIN) {
      if (this.cursorRound === 0) {
        this.canceled = true // 취소버튼을 누른것으로 처리
      } else {
        this.cursorMode = this.CURSORMODE_SUB
        game.sound.play(soundSrc.system.systemSelect)
      }
    } else if (this.cursorMode === this.CURSORMODE_SUB) {
      let roundId = this.getRoundId()
      fieldSystem.roundStart(roundId)

      if (fieldSystem.message === fieldSystem.messageList.STATE_FIELD) {
        game.sound.play(soundSrc.system.systemEnter)
        gameSystem.stateId = gameSystem.STATE_FIELD
      }
    }
  }

  display () {
    super.display()
    this.displayRound()
    this.displaySubRound()
    this.displayWorld()
    this.displayWorldInfo()
    this.displaySubRoundInfo()
  }

  displayRound () {
    if (this.cursorMode === this.CURSORMODE_SUB) return

    // 10 ~ 19
    for (let i = this.CURSOR_POSITION_START_MAIN; i <= this.CURSOR_POSITION_START_MAIN + 9; i++) {
      if (this.menuList[i] == null) continue
      if (i === 0) continue

      // 참고: 선택된 라운드를 명확하게 표기하기 위하여, 현재 라운드가 선택되었다면(커서라운드가 서브모드)
      // 선택된 현재라운드와 서브라운드를 모두 표시하게 합니다.
      if (this.cursorMode === this.CURSORMODE_SUB) {
        if (i === this.cursorRound + this.CURSOR_POSITION_START_MAIN) {
          this.menuList[i].focus = true
          this.menuList[i].focusColor = 'red'
        } else {
          this.menuList[i].focus = false
          this.menuList[i].focusColor = 'blue'
        }
      } else if (this.cursorMode === this.CURSORMODE_MAIN && this.menuList[i].focusColor === 'red') {
        this.menuList[i].focusColor = 'blue'
      }

      // 라운드 아이콘 월드 출력
      let position = -1
      let number = i - this.CURSOR_POSITION_START_MAIN
      if (number < this.roundWorldIconNumber.length && i >= 1) {
        position = this.roundWorldIconNumber[number]
      }

      this.menuList[i].display() // 박스 다시 재출력 (포커스 갱신한 후 출력해야 하기 때문)

      if (position !== -1) {
        const imageSize = 60 - 1 // 이미지의 크기
        const imageSection = 60 // 이미지의 공간 (60x60의 공간중 59x59가 이미지 (나머지 공간은 확대/축소할 때 안티에일러싱 방지용))
        const positionX = position % 10
        const positionY = Math.floor(position / 10) 
        game.graphic.imageDisplay(imageSrc.system.roundIcon, positionX * imageSection, positionY * imageSection, imageSize, imageSize, this.menuList[i].x, this.menuList[i].y, imageSize, imageSize)
      }

      // 이미지에 가려져서 무엇이 선택되었는지 알기 어려우므로, 따로 사격형을 먼저 칠합니다.
      const rectPlusSize = 5
      if (number === this.cursorRound) {
        game.graphic.fillRect(
          this.menuList[i].x - rectPlusSize, 
          this.menuList[i].y - rectPlusSize,
          this.menuList[i].width + (rectPlusSize * 2),
          this.menuList[i].height + (rectPlusSize * 2), 
          'darkblue',
          0.3
        )
      }

      // 라운드 값 출력
      let currentRound = i
      digitalDisplay('R: ' + currentRound, this.menuList[i].x, this.menuList[i].y + this.menuList[i].height)
    }
  }

  getRoundIdTable () {
    switch (this.cursorRound) {
      case 0: return undefined
      case 1: return this.roundIdTable.r1
      case 2: return this.roundIdTable.r2
      case 3: return this.roundIdTable.r3
      default: return undefined
    }
  }

  getRoundId () {
    let idTable = this.getRoundIdTable()
    if (idTable == null) return 0

    if (this.cursorSubRound < idTable.length) {
      return idTable[this.cursorSubRound]
    } else {
      return 0
    }
  }

  displaySubRound () {
    if (this.cursorMode === this.CURSORMODE_MAIN) return

    for (let i = this.CURSOR_POSITION_START_SUB; i < this.CURSOR_POSITION_START_SUB + 19; i++) {
      // 라운드 id테이블을 가져와서 현재 라운드의 id가 무엇인지를 확인
      let roundIdTable = this.getRoundIdTable()
      if (roundIdTable == null) return

      let number = i - this.CURSOR_POSITION_START_SUB
      let roundId = roundIdTable[number]
      if (roundId === 0) continue

      // 해당 라운드의 id에 따른 데이터를 가져옴
      let stat = dataExportStatRound.get(roundId)
      if (stat == null) continue
      
      let iconNumber = stat.iconNumber
      if (iconNumber !== -1) {
        const imageSize = 60 - 1 // 이미지의 크기
        const imageSection = 60 // 이미지의 공간 (60x60의 공간중 59x59가 이미지 (나머지 공간은 확대/축소할 때 안티에일러싱 방지용))
        const positionX = iconNumber % 10
        const positionY = Math.floor(iconNumber / 10) 
        game.graphic.imageDisplay(imageSrc.system.roundIcon, positionX * imageSection, positionY * imageSection, imageSize, imageSize, this.menuList[i].x, this.menuList[i].y, imageSize, imageSize)
      }

      // 이미지에 가려져서 무엇이 선택되었는지 알기 어려우므로, 따로 사격형을 먼저 칠합니다.
      const rectPlusSize = 5
      if (this.cursorMode === this.CURSORMODE_SUB && number === this.cursorSubRound) {
        game.graphic.fillRect(
          this.menuList[i].x - rectPlusSize, 
          this.menuList[i].y - rectPlusSize,
          this.menuList[i].width + (rectPlusSize * 2),
          this.menuList[i].height + (rectPlusSize * 2), 
          'blue',
          0.4
        )
      }

      // 라운드의 텍스트 표시
      digitalDisplay(stat.roundText, this.menuList[i].x, this.menuList[i].y + this.menuList[i].height)
    }
  }

  displayWorldInfo () {
    if (this.cursorMode !== this.CURSORMODE_MAIN) return
    if (this.cursorPosition === 0) return
    if (this.cursorPosition >= this.roundWorld.TitleList.length) return

    const levelmin = this.roundWorld.requireLevelMinList
    const levelmax = this.roundWorld.requireLevelMaxList
    const number = this.cursorPosition
    const attackMin = this.roundWorld.requireAttackMinList
    const attackMax = this.roundWorld.requireAttackMaxList

    const levelRangeText = levelmin[number] + ' ~ ' + levelmax[number]
    const attackRangeText = attackMin[number] + ' ~ ' + attackMax[number]
    let titleText = [
      'ROUND WORLD : ',
      'INFO TEXT   : ',
      '     ',
      'LEVEL RANGE : ' + levelRangeText,
      'ATTACK RANGE: ' + attackRangeText,
    ]
    let textList = [
      this.roundWorld.TitleList[this.cursorPosition] + '',
      this.roundWorld.roundWorldInfoText1List[this.cursorPosition] + '',
      this.roundWorld.roundWorldInfoText2List[this.cursorPosition] + '',
    ]

    const XLINE1 = 10
    const XLINE2 = 180
    const YLINE = 95
    const YSECTION = 20
    for (let i = 0; i < titleText.length; i++) {
      digitalDisplay(titleText[i], XLINE1, YLINE + (i * YSECTION))
    }

    for (let i = 0; i < textList.length; i++) {
      game.graphic.fillText(textList[i], XLINE2, YLINE + (i * YSECTION))
    }
  }

  displayWorld () {
    let arrayIndex = this.cursorRound - 1
    if (arrayIndex < 0) return

    let srcList = [
      imageSrc.worldmap.round1map,
      imageSrc.worldmap.round2map,
      imageSrc.worldmap.round3map,
    ]

    let pathSrcList = [
      imageSrc.worldmap.round1mapPath,
      imageSrc.worldmap.round2mapPath,
      imageSrc.worldmap.round3mapPath,
    ]

    const START_Y = 200
    game.graphic.imageView(srcList[arrayIndex], 0, START_Y)
    game.graphic.imageView(pathSrcList[arrayIndex], 0, START_Y)
  }

  displaySubRoundInfo () {
    if (this.cursorMode !== this.CURSORMODE_SUB) return

    // 현재 라운드 얻기
    let roundIdTable = this.getRoundIdTable()
    if (roundIdTable == null) return

    let roundId = 0
    if (this.cursorSubRound < roundIdTable.length) {
      roundId = roundIdTable[this.cursorSubRound]
    }

    if (roundId === 0) return

    let stat = dataExportStatRound.get(roundId)
    if (stat == null) return

    const layer1X = 120
    const layer1Y = 10
    const text1 = 'ROUND|FINISH|REQUIRE'
    const text2 = '     |TIME  |LEVEL|ATTACK'
    const roundText = stat.roundText.padEnd(5, ' ') + '|'
    const finishTimeText = ('' + stat.finishTime).padEnd(6, ' ') + '|'
    const requireLevelText = ('' + stat.requireLevel).padEnd(5, ' ') + '|'
    const requireAttackText = ('' + stat.requireAttack).padEnd(6, ' ')
    const tilteText = 'TITLE: ' // 타이틀은 다른 폰트로 표현함 (한글때문에)
    const textList = [
      text1,
      text2,
      roundText + finishTimeText + requireLevelText + requireAttackText,
      tilteText
    ]

    for (let i = 0; i < textList.length; i++) {
      digitalDisplay(textList[i], layer1X, layer1Y + (i * 20))

      // 마지막은 일반 폰트로 출력
      if (i === textList.length - 1) {
        game.graphic.fillText(stat.roundName, layer1X + 70, layer1Y + (i * 20))
      }
    }
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
    const LAYER_HEIGHT = 30

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

    this.backgroundColor = ['#7d8d7c', '#6e8771']
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

    game.sound.play(soundSrc.system.systemBack)
    if (this.isQuestionResetWindow) {
      this.isQuestionResetWindow = false
      this.questionReset = false
    } else {
      gameSystem.stateId = gameSystem.STATE_MAIN
    }
  }

  processButton () {
    super.processButton()
    const buttonUp = game.control.getButtonInput(game.control.buttonIndex.UP)
    const buttonDown = game.control.getButtonInput(game.control.buttonIndex.DOWN)

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
        game.sound.play(soundSrc.system.systemCursor)
      } else if (buttonDown && this.cursorPosition < this.menuList.length - 1) {
        this.cursorPosition++
        game.sound.play(soundSrc.system.systemCursor)
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
        game.sound.play(soundSrc.system.systemPlayerDie)
        setTimeout(() => { location.reload() }, 2000)
      } else {
        // 취소 명령
        this.canceled = true
      }
    } else {
      if (this.cursorPosition >= 1) {
        game.sound.play(soundSrc.system.systemSelect)
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

  processMouseClickExtend () {
    const mouseX =  game.control.getMousePosition().x
    const mouseY =  game.control.getMousePosition().y
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
    /** 커서가 가리키는 메뉴 번호 (0 ~ max 9) */ this.cursorMenu = 0
    /** 커서가 가리키는 아이콘 번호 (0 ~ 49) */ this.cursorIcon = 0
    /** 커서가 가리키는 리스트 번호 (무기: 0 ~ 3, 스킬: 0 ~ 7) */ this.cursorList = 0
    /** 커서의 페이지 (아직은 미사용) */ this.cursorPage = 0
    /** 커서의 슬롯 (아직 미사용) */ this.cursorSlot = 0

    /** 선택 변경 예정인 리스트의 위치(cursorList는 현재 커서위치) */ this.listPosition = 0

    /** 해당 목록에서 사용할 타겟(무기 또는 스킬)의 id List */
    this.targetIdList = Array.from(dataExportStatPlayerWeapon.keys())

    this.backgroundColor = ['#B993D6', '#8CA6DB']
    /** 스킬의 번호 시작값 (스킬 버호는 0 ~ 49, 총 50개) */ this.NUM_START_SKILLICON = 0
    /** 스킬의 번호 끝값 (스킬 버호는 0 ~ 49, 총 50개)  */ this.NUM_END_SKILLICON = 49
    /** 리스트의 번호 시작값 (참고: 리스트번호는 50 ~ 53, 총 4개) */ this.NUM_START_LIST = 50
    /** 리스트의 번호 끝값 (참고: 리스트번호는 50 ~ 53, 총 4개) */ this.NUM_END_LIST = 50 + 3
    /** 메뉴의 번호 시작값 (메뉴 개수만큼) */ this.NUM_START_MENU = 54
    /** 메뉴의 번호 끝값 (메뉴 개수만큼) */ this.NUM_END_MENU = 54 + 7

    this.outputY1_LIST = 40
    this.outputY2MenuList = 120
    this.outputY3IconList = 160
    this.outputY4CursorTargetInfo = 180

    // weapon list
    for (let i = 0; i < 50; i++) {
      // 만약 나중에 무기 개수가 50종류를 초과하여 index변수를 업데이트 해야 할 일이 있다면
      // 코드를 수정해야 할 수도 있음.
      const index = i
      const src = imageSrc.system.weaponIcon
      const boxWidth = 80
      const boxHeight = 40
      let imgD = {x: (index % 10) * 40, y: Math.floor(index / 10) * 20, width: 40, height: 20, frame: 1}
      const x = (index % 10) * boxWidth
      const y = Math.floor(index / 10) * boxHeight + boxHeight + this.outputY3IconList
      this.menuList[i] = new BoxImageObject(x, y, boxWidth, boxHeight, '', src, imgD)
    }

    // current weapon
    for (let i = 0; i < 4; i++) {
      const index = i + 50
      this.menuList[index] = new BoxObject(0, (i * 20) + this.outputY1_LIST, 800, 20, '', 'whitesmoke', '', 'grey')
    }

    // menuList
    let menuTextList = ['<< back', 'preset0', 'preset1', 'preset2', 'preset3', 'preset4', 'help', 'test']
    for (let i = 0; i < menuTextList.length; i++) {
      const index = i + 54
      this.menuList[index] = new BoxObject(0 + (80 * i), this.outputY2MenuList, 80, 40, menuTextList[i], '#fcffd6', '', '#ff7e00')
    }

    this.STATE_MENU = 'menu'
    this.STATE_ICON = 'icon'
    this.STATE_LIST = 'list'
    this.STATE_HELP = 'help'
    this.state = this.STATE_MENU

    /** 리스트 포지션의 최대 */ this.LIST_POSITION_MAX = 4
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
      this.cursorPosition = this.NUM_START_MENU + this.cursorMenu
    } else if (this.state === this.STATE_ICON) {
      this.cursorPosition = this.NUM_START_SKILLICON + this.cursorIcon
    } else if (this.state === this.STATE_LIST) {
      this.cursorPosition = this.NUM_START_LIST + this.cursorList
    }
  }

  /** 마우스를 클릭했을 때 커서 포지션의 값을 계산해서 메뉴 상태를 변경합니다. */
  processMouseCursorCalculation () {
    if (this.state === this.STATE_HELP) {
      this.selected = false // 다른 메뉴박스를 눌렀을 때, 이 값이 true가 되기 때문에 강제로 해제함
      this.canceled = true
      return
    }

    // 커서 포지션이 특정 범위라면, 현재 상태를 임의로 변경합니다.
    if (this.cursorPosition >= this.NUM_START_MENU && this.cursorPosition <= this.NUM_END_MENU) {
      this.state = this.STATE_MENU
      this.cursorMenu = this.cursorPosition - this.NUM_START_MENU
    } else if (this.cursorPosition >= this.NUM_START_SKILLICON && this.cursorPosition <= this.NUM_END_SKILLICON) {
      this.state = this.STATE_ICON
      this.cursorIcon = this.cursorPosition - this.NUM_START_SKILLICON
    } else if (this.cursorPosition >= this.NUM_START_LIST && this.cursorPosition <= this.NUM_END_LIST) {
      this.state = this.STATE_LIST
      this.cursorList = this.cursorPosition - this.NUM_START_LIST
    }
  }

  processMouseClickExtend () {
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
    const maxMenuCount = this.NUM_END_MENU - this.NUM_START_MENU

    if (button.buttonLeft && this.cursorMenu > 0) {
      this.cursorMenu--
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonRight && this.cursorMenu < maxMenuCount) {
      this.cursorMenu++
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonDown) {
      this.state = this.STATE_ICON
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonUp) {
      this.state = this.STATE_LIST
      this.cursorList = this.LIST_POSITION_MAX - 1
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  processButtonIcon () {
    let button = this.getButtonObject()
    let cursorX = this.cursorIcon % 10
    let cursorY = Math.floor(this.cursorIcon / 10)

    // 간단히 말해, 좌우 루프형태
    if (button.buttonLeft) {
      // 커서아이콘이 X축 0의 위치에 있다면, 맨 오른쪽으로 이동시킴 그게 아닐경우 왼쪽으로 한칸 이동
      cursorX === 0 ? this.cursorIcon += 9 : this.cursorIcon--
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonRight) {
      // 커서아이콘이 X축 9의 위치에 있다면, 커서를 맨 왼쪽으로 이동시킴 그게 아닐경우 오른쪽으로 한칸 이동
      cursorX === 9 ? this.cursorIcon -= 9 : this.cursorIcon++
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonDown && cursorY !== 4) {
      // 맨 마지막줄이 아니면 아래쪽으로 한줄 이동
      this.cursorIcon += 10
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonUp) {
      // 맨 처음 줄일경우 상태를 변경하고 아닐경우 위쪽으로 한줄 이동
      cursorY === 0 ? this.state = this.STATE_MENU : this.cursorIcon -= 10
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  processButtonList () {
    let button = this.getButtonObject()
    if (button.buttonDown) {
      const lastCursorList = this.NUM_END_LIST - this.NUM_START_LIST
      if (this.cursorList >= lastCursorList) {
        this.state = this.STATE_MENU
      } else {
        this.cursorList++
      }
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonUp && this.cursorList > 0) {
      this.cursorList--
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  /** 유저의 무기를 설정합니다. (id가 0인경우 지울 수 있지만, 내부적으로 1개의 무기가 있어야함.) */
  setWeapon (weaponId = 0) {
    if (weaponId == null) return
    if (weaponId === ID.playerWeapon.subMultyshot) return
    if (this.cursorIcon >= dataExportPlayerWeapon.size) return

    // 무기 교체
    let success = userSystem.setWeapon(this.listPosition, weaponId)
    if (success) {
      // 다음 리스트로 이동
      this.listPosition++
      if (this.listPosition > 3) this.listPosition = 0
      game.sound.play(soundSrc.system.systemSkillSelect)
    } else {
      game.sound.play(soundSrc.system.systemBuzzer)
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return

    if (this.state === this.STATE_MENU) {
      switch (this.cursorMenu) {
        case 0: this.canceled = true; break
        case 1: userSystem.changePresetWeapon(0); break
        case 2: userSystem.changePresetWeapon(1); break
        case 3: userSystem.changePresetWeapon(2); break
        case 4: userSystem.changePresetWeapon(3); break
        case 5: userSystem.changePresetWeapon(4); break
        case 6: this.state = this.STATE_HELP; break
      }
      if (this.cursorMenu >= 1) {
        game.sound.play(soundSrc.system.systemSelect)
      }
    } else if (this.state === this.STATE_ICON) {
      this.setWeapon(this.targetIdList[this.cursorIcon])
    } else if (this.state === this.STATE_LIST) {
      this.listPosition = this.cursorList
      this.state = this.STATE_ICON
      game.sound.play(soundSrc.system.systemSelect)
    } else if (this.state === this.STATE_HELP) {
      this.canceled = true
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
    } else if (this.state === this.STATE_HELP) {
      this.state = this.STATE_MENU
    }
    game.sound.play(soundSrc.system.systemBack)
  }

  displayUserWeapon () {
    let outputY1 = 0
    let outputY2 = 40
    digitalDisplay('current user weapon ' + '(preset: ' + userSystem.weaponPresetNumber + ')', 0, outputY1)
    digitalDisplay('icon/name           |delay|shot|repeat|multiple|value|attack', 0, outputY1 + 20)

    let userWeapon = userSystem.getWeaponList()
    let weaponIcon = imageSrc.system.weaponIcon
    let iconWidth = imageDataInfo.system.weaponIcon.width
    let iconHeight = imageDataInfo.system.weaponIcon.height
    const lineHeight = 20
    for (let i = 0; i < userWeapon.length; i++) {
      let getString = this.getIconString(userWeapon[i])
      digitalDisplay(getString, 0, outputY1 + iconHeight + lineHeight + (i * iconHeight))
      
      let weaponNumber = userWeapon[i] - ID.playerWeapon.weaponNumberStart
      let weaponX = weaponNumber % 10
      let weaponY = Math.floor(weaponNumber / 10)
      game.graphic.imageDisplay(weaponIcon, (weaponX * iconWidth), weaponY * iconHeight, iconWidth, iconHeight, 0, outputY1 + lineHeight + iconHeight + (i * iconHeight), iconWidth, iconHeight)
    }

    // 하이라이트 표시
    game.graphic.fillRect(0, outputY2 + (this.listPosition * iconHeight), game.graphic.CANVAS_WIDTH, iconHeight, 'yellow', 0.5)
  }

  /** 해당 아이콘 위치에 있는 무기 또는 스킬의 정보를 얻어옵니다. */
  getIconString (weaponId = 0) {
    let getData = dataExportPlayerWeapon.get(weaponId)
    if (getData == null) return ''
    if (getData.weapon == null) return ''

    let icon = '    ' // 공백 4칸
    let name = '' + getData.weapon.mainType.padEnd(16, ' ').slice(0, 16) + '|'
    let delay = ('' + getData.delay).padEnd(5, ' ') + '|'
    let shotCount = ('' + getData.shotCount).padEnd(4, ' ') + '|'
    let repeatCount = ('' + getData.weapon.repeatCount).padEnd(6, ' ') + '|'
    let attackMultiple = ('' + getData.attackMultiple).padEnd(8, ' ') + '|'
    let valueAttack = ('' + getData.getShotAttack(10000)).padEnd(5, ' ') + '|'
    let currentAttack = ('' + getData.getShotAttack(userSystem.getAttackWeaponValue())).padEnd(8, ' ') + ' '

    // 'icon/name           /delay/shot/repeat/multiple/attack/damage'
    return icon + name + delay + shotCount + repeatCount + attackMultiple + valueAttack + currentAttack
  }

  /** 커서가 가리키는 무기의 정보 출력 */
  displayCursorWeapon () {
    let weaponId = this.cursorIcon + ID.playerWeapon.weaponNumberStart
    if (weaponId < ID.playerWeapon.weaponNumberStart) return

    const infoString = this.getIconString(weaponId)
    const weaponIconSrc = imageSrc.system.weaponIcon
    const weaponNumber = this.cursorIcon
    const iconWidth = imageDataInfo.system.weaponIcon.width
    const iconHeight = imageDataInfo.system.weaponIcon.height
    const weaponX = weaponNumber % 10
    const weaponY = Math.floor(weaponNumber / 10)
    const outputY3 = this.outputY3IconList

    game.graphic.fillRect(0, outputY3, game.graphic.CANVAS_WIDTH, iconHeight * 2, 'white')
    digitalDisplay('icon/name           |delay|shot|repeat|multiple|value|attack', 0, outputY3)
    digitalDisplay(infoString, 0, this.outputY4CursorTargetInfo)
    game.graphic.imageDisplay(weaponIconSrc, weaponX * iconWidth, weaponY * iconHeight, iconWidth, iconHeight, 0, outputY3 + 20, iconWidth, iconHeight)

  }

  /** 무기 선택 도움말 */
  displayHelp () {
    let textList = [
      '무기 선택 도움말',
      '밑에 있는 무기 아이콘들을 선택하면 해당 무기를 사용합니다.',
      '무기는 최대 4종류까지 사용할 수 있습니다. (중복 선택 불가)',
      '리스트에 있는 무기를 누르면 해당 무기와 다른 무기를 빠르게 교체할 수 있습니다.',
      '',
      '무기의 스탯 설명',
      'delay: 다음 발사까지 대기시간 (1초 = 60프레임 -> 딜레이 60 = 1초)',
      'shot : 한번 발사할 때 발사되는 개체 수',
      'repeat: 발사된 개체가 적을 공격하는 횟수',
      'multiple: 무기의 공격력 배율 (높을수록 데미지가 높아짐)',
      'value: 무기 공격력 10000을 기준으로 해당 무기가 가지는 데미지',
      'attack: 유저의 무기 공격력(공격력의 28%)을 기준으로 해당 무기가 가지는 데미지',
      '',
      'test 메뉴를 사용하면 무기를 테스트 할 수 있는 라운드를 플레이합니다.',
      '',
      'preset은 5종류가 있습니다.',
      'NULL 무기를 선택하면 해당 슬롯의 무기를 지울 수 있습니다.',
      '그러나, 한개의 프리셋당 최소 1개의 무기가 있어야 합니다.',
      '',
    ]

    // 화면 전체 영역중 10만큼의 영역을 제외하고 전부 칠함
    const borderSize = 10
    const WIDTH = game.graphic.CANVAS_WIDTH - (borderSize * 2)
    const HEIGHT = game.graphic.CANVAS_HEIGHT - (borderSize * 2)
    game.graphic.fillRect(borderSize, borderSize, WIDTH, HEIGHT, 'white', 0.9)

    const textSize = 20
    for (let i = 0; i < textList.length; i++) {
      game.graphic.fillText(textList[i], textSize, textSize + (i * textSize), 'black')
    }
  }

  display () {
    super.display()
    this.displayUserWeapon()
    
    // 커서가 가리키는 웨폰 표시
    if (this.state === this.STATE_ICON) this.displayCursorWeapon()

    // 도움말 표시
    if (this.state === this.STATE_HELP) this.displayHelp()
  }
}

class SkillSelectSystem extends MenuSystem {
  constructor () {
    super()
    this.backgroundColor = ['#6190E8', '#A7BFE8']
    /** 모든 스킬의 슬롯 리스트 */ this.targetIdList = Array.from(dataExportStatPlayerSkill.keys())
    this.NUM_START_SKILLICON = 0
    this.NUM_END_SKILLICON = 49
    this.NUM_START_LIST = 50
    this.NUM_END_LIST = 57
    this.NUM_START_MENU = 58
    this.NUM_END_MENU = 65
    /** 리스트 포지션의 최대 */ this.LIST_POSITION_MAX = 8

    this.outputY1List = 20
    this.outputY1ListLine1Start = 40
    this.outputY1ListLine2Start = 140
    this.outputY2MenuList = 40 + 180
    this.outputY3IconInfoView = 300
    this.outputY3IconListStart = 280

    this.cursorMenu = 0
    this.cursorIcon = 0
    this.cursorList = 0
    this.listPosition = 0

    // skillIcon
    let iconWidth = imageDataInfo.system.weaponIcon.width
    let iconHeight = imageDataInfo.system.weaponIcon.height
    let iconOutputWidth = imageDataInfo.system.weaponIconDoubleSize.width
    let iconOutputHeight = imageDataInfo.system.weaponIconDoubleSize.height
    let iconTitleHeight = imageDataInfo.system.skillInfoYellowTitle.height + imageDataInfo.system.skillInfoYellow.height 
    for (let i = 0; i < 50; i++) {
      const xNumber = i % 10
      const yNumber = Math.floor(i / 10)
      const imageData = {x: xNumber * iconWidth, y: yNumber * iconHeight, width: iconWidth, height: iconHeight, frame: 1}
      const x = xNumber * iconOutputWidth
      const y = yNumber * iconWidth + this.outputY3IconListStart + iconTitleHeight
      this.menuList[i] = new BoxImageObject(x, y, iconOutputWidth, iconOutputHeight, '', imageSrc.system.skillIcon, imageData)
      this.menuList[i].borderColor = 'black'
      this.menuList[i].color = ''
    }

    // user skill list
    let image = imageSrc.system.skillInfo
    let slotBNumber = this.NUM_START_LIST + (this.LIST_POSITION_MAX / 2)
    let slotALayerY = this.outputY1ListLine1Start + 0
    let slotBLayerY = this.outputY1ListLine1Start + 100
    for (let i = 0; i < this.LIST_POSITION_MAX; i++) {
      let index = i + this.NUM_START_LIST
      let yLine = i % 4
      let imageData = index < slotBNumber ? imageDataInfo.system.skillInfoSkyBlue : imageDataInfo.system.skillInfoPurpleBlue
      let positionY = index < slotBNumber ? slotALayerY + (yLine * iconHeight) : slotBLayerY + (yLine * iconHeight)
      this.menuList[index] = new BoxImageObject(0, positionY, game.graphic.CANVAS_WIDTH, iconHeight, '', image, imageData)
      this.menuList[index].focusColor = '#333333'
    }

    // menu
    let menuText = ['<< back', 'preset0', 'preset1', 'preset2', 'preset3', 'preset4', 'help', 'test']
    for (let i = 0; i < menuText.length; i++) {
      let index = this.NUM_START_MENU + i
      this.menuList[index] = new BoxObject(iconOutputWidth * i, this.outputY2MenuList, iconOutputWidth, iconOutputHeight, menuText[i], '#fcffd6', '', '#ff7e00')
    }

    this.STATE_MENU = 'menu'
    this.STATE_ICON = 'icon'
    this.STATE_LIST = 'list'
    this.STATE_HELP = 'help'
    this.STATE_PREVIEW = 'preview'
    this.state = this.STATE_MENU
  }

  processButtonMenu () {
    let button = this.getButtonObject()
    const menuCount = this.NUM_END_MENU - this.NUM_START_MENU
    // 메뉴 모드 (아직 완성 안됨)
    // 좌우 방향키로 이동, 아래 방향키를 누를경우, 스킬을 고를 수 있음.
    // 스킬셋을 바꾸면 현재 스킬셋이 다른걸로 교체됨
    // 도움말 메뉴를 누르면 도움말 창이 표시됨.
    // 참고: 프리뷰 기능은 어떻게 구현해야 할지 고민중... (필드를 새로 만들어야 하나...)
    if (button.buttonLeft && this.cursorMenu > 0) {
      game.sound.play(soundSrc.system.systemCursor)
      this.cursorMenu--
    } else if (button.buttonRight && this.cursorMenu < menuCount) {
      game.sound.play(soundSrc.system.systemCursor)
      this.cursorMenu++
    } else if (button.buttonDown) {
      this.state = this.STATE_ICON
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonUp) {
      this.cursorList = this.LIST_POSITION_MAX - 1
      this.state = this.STATE_LIST
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  processButtonIcon () {
    let button = this.getButtonObject()
    let cursorX = this.cursorIcon % 10
    let cursorY = Math.floor(this.cursorIcon / 10)

    if (button.buttonLeft) {
      // 커서X값이 0이면, 반대방향으로 이동시킴, 아닐경우 왼쪽으로 이동
      cursorX === 0 ? this.cursorIcon += 9 : this.cursorIcon--
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonRight) {
      // 커서X값이 9이면, 반대방향으로 이동시킴, 아닐경우 오른쪽으로 이동
      cursorX === 9 ? this.cursorIcon -= 9 : this.cursorIcon++
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonUp) {
      // 커서 Y축이 맨 위에 있다면, 메뉴 상태로 변경합니다. 아닐경우, 한 줄 위로 올라갑니다.
      cursorY === 0 ? this.state = this.STATE_MENU : this.cursorIcon -= 10
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonDown) {
      // 커서 Y축이 마지막 줄이 아니라면 한 줄 아래로 내려갑니다.
      cursorY === 4 ? 0 : this.cursorIcon += 10
      game.sound.play(soundSrc.system.systemCursor)
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
    // 없는 스킬은 등록 불가능 (unused는 해당 스킬을 제거함)
    let getSkill = dataExportStatPlayerSkill.get(skillId)
    if (getSkill == null) return
    
    // 스킬을 변경하고 스킬을 변경하는데 성공하면, 사운드 출력 후 다음 리스트로 이동
    let success = userSystem.setSkill(slotNumber, skillId)
    if (success) {
      game.sound.play(soundSrc.system.systemSkillSelect)
      this.listPosition++
      if (this.listPosition >= this.LIST_POSITION_MAX) {
        this.listPosition = 0
      }
    } else {
      game.sound.play(soundSrc.system.systemBuzzer)
    }
  }

  processButtonList () {
    let button = this.getButtonObject()
    if (button.buttonUp && this.cursorList > 0) {
      this.cursorList--
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonDown) {
      if (this.cursorList < this.LIST_POSITION_MAX - 1) {
        this.cursorList++
      } else {
        this.state = this.STATE_MENU
      }
      game.sound.play(soundSrc.system.systemCursor)
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
        case 1: userSystem.changePresetSkill(0); break
        case 2: userSystem.changePresetSkill(1); break
        case 3: userSystem.changePresetSkill(2); break
        case 4: userSystem.changePresetSkill(3); break
        case 5: userSystem.changePresetSkill(4); break
        case 6: this.state = this.STATE_HELP; break
        case 7: ; break
      }

      if (this.cursorMenu > 0) game.sound.play(soundSrc.system.systemSelect)
    } else if (this.state === this.STATE_ICON) {
      // 스킬을 설정함 (스킬을 설정하면 자동으로 다음 리스트로 이동함)
      this.setSkill(this.listPosition, this.targetIdList[this.cursorIcon])
    } else if (this.state === this.STATE_LIST) {
      // 커서 위치를 그대로 두고, 스킬 선택으로 이동
      this.state = this.STATE_ICON
      this.listPosition = this.cursorList
      game.sound.play(soundSrc.system.systemCursor)
    } else if (this.state === this.STATE_HELP) {
      this.state = this.STATE_MENU
      game.sound.play(soundSrc.system.systemCursor)
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
    } else if (this.state === this.STATE_HELP) {
      this.state = this.STATE_MENU
    }
    
    game.sound.play(soundSrc.system.systemBack)
  }


  /** 스킬에 대한 정보 이미지를 표시(정보는 이 함수 말고 다른곳에서 출력됨) */
  displayTitle () {
    const image = imageSrc.system.skillInfo
    const SKILL_LIST_LAYER1 = this.outputY1List
    const SKILL_LIST_LAYER2 = this.outputY1ListLine2Start - 20
    const SKILL_CURSOR_INFO_LAYER = this.outputY3IconListStart
    const HEIGHT = 20
    const WIDTH = 800

    digitalDisplay('CURRENT SKILL LIST (PRESET: ' + userSystem.skillPresetNumber + ')', 0, 0)
    let yellowTitle = imageDataInfo.system.skillInfoYellowTitle
    game.graphic.imageDisplay(image, yellowTitle.x, yellowTitle.y, yellowTitle.width, yellowTitle.height, 0, SKILL_CURSOR_INFO_LAYER, WIDTH, HEIGHT)
    let yellowData = imageDataInfo.system.skillInfoYellow
    game.graphic.imageDisplay(image, yellowData.x, yellowData.y, yellowData.width, yellowData.height, 0, SKILL_CURSOR_INFO_LAYER + HEIGHT, WIDTH, HEIGHT)

    let blueTitle = imageDataInfo.system.skillInfoSkyBlueTitle
    game.graphic.imageDisplay(image, blueTitle.x, blueTitle.y, blueTitle.width, blueTitle.height, 0, SKILL_LIST_LAYER1, WIDTH, HEIGHT)
    let purpleTitle = imageDataInfo.system.skillInfoPurpleBlueTitle
    game.graphic.imageDisplay(image, purpleTitle.x, purpleTitle.y, purpleTitle.width, purpleTitle.height, 0, SKILL_LIST_LAYER2, WIDTH, HEIGHT)
  }

  display () {
    // super.display()
    this.displayBackground()
    this.displayMenu() // 메뉴가 다른 이미지에 가려지는걸 막기 위해서, 이 함수를 임의로 호출함.
    this.displayTitle()
    this.displaySkillSelectData()
    this.displaySkillList()
    this.displaySkillHighlight()

    if (this.state === this.STATE_HELP) this.displayHelp()
  }

  displaySkillHighlight () {
    if (this.state === this.STATE_LIST) return

    const LINEHEIGHT = 20
    let lineY = this.listPosition < 4 ? this.outputY1ListLine1Start : this.outputY1ListLine2Start
    lineY += (this.listPosition % 4) * LINEHEIGHT
    game.graphic.fillRect(0, lineY, game.graphic.CANVAS_WIDTH, LINEHEIGHT, 'orange', 0.4)
  }

  displaySkillList () {
    let userSkillList = userSystem.getSkillList()
    const skillCount = this.LIST_POSITION_MAX / 2
    const MARGIN = 3

    for (let i = 0; i < skillCount; i++) {
      let outputText1 = this.getSkillInfoString(userSkillList[i])
      let outputText2 = this.getSkillInfoString(userSkillList[i + 4])
      let outputY1 = this.outputY1List + 0
      let outputY2 = this.outputY1List + 100
      let skillNum1 = userSkillList[i] - ID.playerSkill.skillNumberStart
      let skillNum2 = userSkillList[i + 4] - ID.playerSkill.skillNumberStart

      digitalDisplay(outputText1, MARGIN, (i + 1) * 20 + outputY1)
      digitalDisplay(outputText2, MARGIN, (i + 1) * 20 + outputY2)
      game.graphic.imageDisplay(imageSrc.system.skillIcon, (skillNum1 % 10) * 40, Math.floor(skillNum1 / 10) * 20, 40, 20, 0, (i + 1) * 20 + outputY1, 40, 20)
      game.graphic.imageDisplay(imageSrc.system.skillIcon, (skillNum2 % 10) * 40, Math.floor(skillNum2 / 10) * 20, 40, 20, 0, (i + 1) * 20 + outputY2, 40, 20)
    }
  }

  displaySkillSelectData () {
    if (this.cursorPosition >= this.NUM_START_SKILLICON && this.cursorPosition < this.NUM_END_SKILLICON) {
      let position = this.cursorPosition - this.NUM_START_SKILLICON
      let inputString = this.getSkillInfoString(this.targetIdList[position])
      const MARGIN = 3
      const Y = this.outputY3IconInfoView
      game.graphic.imageDisplay(imageSrc.system.skillIcon, (position % 10) * 40, Math.floor(position / 10) * 20, 40, 20, 0, Y, 40, 20)
      digitalDisplay(inputString, MARGIN, Y)
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
    let currentAttack = ('' + getData.getCurrentAttack(userSystem.getAttackSkillValue())).padEnd(9, ' ')

    let finalString = icon + name + coolTime + attackMultiple + shotCount + repeatCount + delay + attackCount + weaponAttack + currentAttack
    return finalString
  }

  displayHelp () {
    let textList = [
      '스킬 선택 도움말',
      '밑에 있는 스킬 아이콘을 선택하면 해당 스킬을 장착합니다.',
      '스킬은 2개의 슬롯으로 나뉘며 각각 4종류의 스킬을 사용할 수 있습니다.',
      '스킬은 중복할 수 없습니다. (다른 프리셋은 상관없음)',
      'L1, R1, L2, R2 또는 스킬 사용 버튼을 누르면, 빠르게 스킬을 교체할 수 있습니다.',
      '',
      '스킬의 스탯 설명',
      'cooltime: 스킬 재사용 대기시간, 초 단위(20 = 20초)',
      'multiple: 스킬 자체의 공격력 배율',
      'shot: 스킬을 사용할 때, 한번에 발사되는 개체 수',
      'repeat: 스킬을 사용할 때, 해당 스킬의 발사를 반복하는 횟수',
      'delay: 해당 스킬의 발사가 여러번일 때 대기하는 시간(프레임)',
      'hit: 해당 스킬의 발사된 개체가 적을 타격하는 횟수',
      'value: 스킬 공격력 10000을 기준으로, 스킬 발사 개체에 대한 데미지',
      'attack: 스킬 공격력(공격력의 18%)을 기준으로, 스킬 발사 개체에 대한 데미지',
      '',
      'preset은 5종류가 있습니다.',
      'NULL를 선택하면 B 슬롯의 스킬을 지울 수 있습니다.',
      '스킬은 반드시 4개 이상이여야 하기 때문에',
      'A슬롯의 스킬은 지울 수 없습니다.',
      'A슬롯과 B슬롯의 쿨타임은 서로 공유합니다.',
      '',
      '이 게임은 스킬 4종류를 사용하여 게임을 플레이해야합니다.',
    ]

    // 화면 전체 영역중 10만큼의 영역을 제외하고 전부 칠함
    const borderSize = 10
    const WIDTH = game.graphic.CANVAS_WIDTH - (borderSize * 2)
    const HEIGHT = game.graphic.CANVAS_HEIGHT - (borderSize * 2)
    game.graphic.fillRect(borderSize, borderSize, WIDTH, HEIGHT, 'white', 0.9)

    const textSize = 20
    for (let i = 0; i < textList.length; i++) {
      game.graphic.fillText(textList[i], textSize, textSize + (i * textSize), 'black')
    }
  }

  /** 
   * 커서 포지션을 현재 설정값에 맞게 강제 이동  (이 함수는 키보드 기준)
   * 
   * 마우스로 이동하는 경우, 기존에 있는 상태를 무시하고 커서를 이동시킴
   */
  processCursorPosition () {
    if (this.state === this.STATE_MENU) {
      this.cursorPosition = this.NUM_START_MENU + this.cursorMenu
    } else if (this.state === this.STATE_ICON) {
      this.cursorPosition = this.NUM_START_SKILLICON + this.cursorIcon
    } else if (this.state === this.STATE_LIST) {
      this.cursorPosition = this.NUM_START_LIST + this.cursorList
    }
  }

  /** 마우스를 클릭했을 때 커서 포지션의 값을 계산해서 메뉴 상태를 변경합니다. */
  processMouseCursorCalculation () {
    if (this.state === this.STATE_HELP) {
      this.selected = false // 다른 메뉴박스를 눌렀을 때, 이 값이 true가 되기 때문에 강제로 해제함
      this.canceled = true
      return
    }

    // 커서 포지션이 특정 범위라면, 현재 상태를 임의로 변경합니다.
    if (this.cursorPosition >= this.NUM_START_MENU && this.cursorPosition <= this.NUM_END_MENU) {
      this.state = this.STATE_MENU
      this.cursorMenu = this.cursorPosition - this.NUM_START_MENU
    } else if (this.cursorPosition >= this.NUM_START_SKILLICON && this.cursorPosition <= this.NUM_END_SKILLICON) {
      this.state = this.STATE_ICON
      this.cursorIcon = this.cursorPosition - this.NUM_START_SKILLICON
    } else if (this.cursorPosition >= this.NUM_START_LIST && this.cursorPosition <= this.NUM_END_LIST) {
      this.state = this.STATE_LIST
      this.cursorList = this.cursorPosition - this.NUM_START_LIST
    }
  }

  processMouseClickExtend () {
    // 마우스가 눌려진 후에 기능을 수행하기 위해, processMouseExtend 함수를 사용했습니다.
    this.processMouseCursorCalculation()
  }

  process () {
    super.process()
    this.processCursorPosition()
  }
}

class StatUpgradeSystem extends MenuSystem {
  constructor () {
    super()
    this.backgroundColor = ['#b7ffad', '#d9ffd6']

    /** 각 줄의 간격 크기 */ this.SIZEY = 20
    this.outputY1Attack = 40
    this.outputY2HpShield = this.outputY1Attack + 180
    this.outputY3Level = this.outputY2HpShield + 100
    this.outputY4Equipment = this.outputY3Level + 60
    this.outputY5Slot = this.outputY4Equipment + 100
    this.outputY6Menu = 500

    this.MENU_BACK = 0
    this.MENU_EQUIPMENT_UPGRADE = 1
    this.MENU_HELP = 2

    this.upgradeEnimationFrame = 0

    this.isHelp = false

    let imgD = [
      imageDataInfo.mainSystem.statBack,
      imageDataInfo.mainSystem.statEquipmentUpgrade,
      imageDataInfo.mainSystem.statHelp,
    ]
    const imgDWidth = imageDataInfo.mainSystem.statBack.width
    for (let i = 0; i < 3; i++) {
      this.menuList[i] = new BoxImageObject(imgDWidth * i, 0, 0, 0, '', imageSrc.system.mainSystem, imgD[i])
    }
  }

  processButton () {
    super.processButton()
    this.processButtonMenu()

    if (this.upgradeEnimationFrame > 0) {
      this.upgradeEnimationFrame--
    }
  }

  processButtonMenu () {
    let button = this.getButtonObject()
    if (button.buttonLeft && this.cursorPosition > 0) {
      this.cursorPosition--
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonRight && this.cursorPosition < this.menuList.length - 1) {
      this.cursorPosition++
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return
    if (this.isHelp) {
      this.canceled = true
      return
    }

    if (this.cursorPosition === 0) {
      this.canceled = true
    } else if (this.cursorPosition === 1) {
      if (userSystem.equipment.id === ID.equipment.unused) return
      let success = userSystem.inventoryItemUpgrade(userSystem.equipment.itemIndex)
      if (success) {
        game.sound.play(soundSrc.system.systemEquipmentUpgrade)
        this.upgradeEnimationFrame = 90
      }
    } else if (this.cursorPosition === 2) {
      this.isHelp = true
      game.sound.play(soundSrc.system.systemSelect)
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return
    if (this.isHelp) this.isHelp = false
    else gameSystem.stateId = gameSystem.STATE_MAIN

    game.sound.play(soundSrc.system.systemBack)
  }

  processMouseClickExtend () {
    // 도움말 상태에서는, 다른 메뉴 선택을 무효화하고, 취소명령을 사용
    if (this.isHelp) {
      this.selected = false
      this.canceled = true
    }
  }

  displayUserAttack () {
    // 한글이 왜 조금 더 위에 출력되는지 모르겠음. 이건 어쩔 수 없이 강제로 Y좌표를 2 추가함
    game.graphic.fillText('공격력     = 베이스  + 레벨  + 장비  + 슬롯', 0, this.outputY1Attack + (this.SIZEY * 0) + 2)

    digitalDisplay('ATTACK  = BASE  + LEVEL + EQUIPMENT + SLOT    ', 0, this.outputY1Attack + (this.SIZEY * 1))
    const userAttack = userSystem.attack
    const userAttackValue = userSystem.getAttackValue()
    const attack = ('' + userAttack).padEnd(8, ' ') + '= '
    const base = ('' + userAttackValue.base).padEnd(6, ' ') + '+ '
    const level = ('' + userAttackValue.level).padEnd(6, ' ') + '+ '
    const equipment = ('' + userAttackValue.equipment).padEnd(10, ' ') + '+ '
    const slot = ('' + userAttackValue.slot).padEnd(8, ' ')
    digitalDisplay(attack + base + level + equipment + slot, 0, this.outputY1Attack + (this.SIZEY * 2))

    const userWeaponAttack = userSystem.getAttackWeaponValue()
    const userSkillAttack = userSystem.getAttackSkillValue()
    game.graphic.fillText('무기 공격력(28% 공격력), 스킬 공격력(18% 공격력)', 0, this.outputY1Attack + (this.SIZEY * 4))
    game.graphic.fillText('28%p + (14%p x 4) = 100%p', 0, this.outputY1Attack + (this.SIZEY * 5))
    digitalDisplay('WEAPON ATTACK (28% ATTACK): ' + userWeaponAttack, 0, this.outputY1Attack + (this.SIZEY * 6))
    digitalDisplay('SKILL  ATTACK (18% ATTACK): ' + userSkillAttack, 0, this.outputY1Attack + (this.SIZEY * 7))
  }

  displayUserStat () {
    game.graphic.fillText('체력, 쉴드, 쉴드 회복, 골드', 0, this.outputY2HpShield + (this.SIZEY * 0))
    let hpText = 'HP + SHIELD: ' + userSystem.hp + ' + ' + userSystem.shield
    let recoveryText = 'SHIELD RECOVERY: ' + userSystem.shieldRecovery + '/' + userSystem.SHIELD_RECOVERY_BASE_VALUE
    digitalDisplay(hpText, 0, this.outputY2HpShield + (this.SIZEY * 1))
    digitalDisplay(recoveryText, 0, this.outputY2HpShield + (this.SIZEY * 2))
    digitalDisplay('GOLD: ' + userSystem.gold, 0, this.outputY2HpShield + (this.SIZEY * 3))
  }

  displayUserLevel () {
    game.graphic.fillText(`레벨, 경험치, max level(최대 레벨): ${userSystem.expTable.length - 1})`, 0, this.outputY3Level + (this.SIZEY * 0))
    let percent = userSystem.exp / userSystem.getExpMax() * 100
    digitalDisplay('LV. ' + userSystem.lv + ', EXP: ' + userSystem.exp + '/' + userSystem.getExpMax() + '(' + percent.toFixed(2) + '%)',  0, this.outputY3Level + (this.SIZEY * 1))
  }

  displayUserEquipment () {
    digitalDisplay('EQUIPMENT ', 0, this.outputY4Equipment + (this.SIZEY * 0))
    game.graphic.fillText('(장비)', 122, this.outputY4Equipment + (this.SIZEY * 0))

    const equipment = userSystem.equipment
    const equipmentData = userSystem.getEquipmentItemInfo()
    const equipmentInventory = userSystem.getInventoryEquipmentStatus(equipment.itemIndex)
    if (equipmentData == null || equipmentInventory == null) return
    
    digitalDisplay('ITEM INDEX: ' + equipment.itemIndex, 200, this.outputY4Equipment + (this.SIZEY * 0))
    const src = imageSrc.system.itemIcon
    const iconSectionWidth = imageDataInfo.system.itemIconSection.width
    const sliceX = (equipmentData.iconNumber % 10) * imageDataInfo.system.itemIconSection.width
    const sliceY = Math.floor(equipmentData.iconNumber / 10) * imageDataInfo.system.itemIconSection.height
    const iconWidth = imageDataInfo.system.itemIcon.width
    const iconHeight = imageDataInfo.system.itemIcon.height
    const TEXT_X = 64
    game.graphic.fillRect(0, this.outputY4Equipment + (this.SIZEY * 1), iconSectionWidth, iconSectionWidth, '#CCCCCC', 0.8)
    game.graphic.imageDisplay(src, sliceX, sliceY, iconWidth, iconHeight, 0 + 5, this.outputY4Equipment + (this.SIZEY * 1) + 5, iconWidth, iconHeight)

    // 업그레이드 성공하면 글자가 깜빡이는것 처리 (밑에있는 글자가 출력이 안되어서 깜빡여짐)
    if (this.upgradeEnimationFrame % 3 === 2) return

    game.graphic.fillText('' + equipmentData.name + ' +' + equipment.upgradeLevel, TEXT_X, this.outputY4Equipment + (this.SIZEY * 1))
    digitalDisplay('ATTACK: ' + equipment.attack, TEXT_X, this.outputY4Equipment + (this.SIZEY * 2))

    // 업그레이드 레벨 초과시 업그레이드에 관한 정보는 표시되지 않음.
    if (equipment.upgradeLevel >= userSystem.UPGRADE_LEVEL_MAX) return

    const TEXT_RIGHTX = 400
    const upgradeText = `       upgrade +${equipment.upgradeLevel} -> upgrade +${equipment.upgradeLevel + 1}`
    const attackDiff = equipmentInventory.nextLevelAttack - equipmentInventory.attack
    digitalDisplay(upgradeText, TEXT_RIGHTX, this.outputY4Equipment + (this.SIZEY * 1))
    digitalDisplay('ATTACK: ' + equipment.attack + ' -> ' + equipmentInventory.nextLevelAttack + ' (+' + attackDiff + ')', TEXT_RIGHTX, this.outputY4Equipment + (this.SIZEY * 2))
    digitalDisplay('cost: ' + equipment.upgradeCost, TEXT_RIGHTX, this.outputY4Equipment + (this.SIZEY * 3))
  }

  displaySlot () {
    digitalDisplay('SLOT', 0, this.outputY5Slot)
    game.graphic.fillText('(슬롯)', 60, this.outputY5Slot)
    for (let i = 0; i < 4; i++) {
      game.graphic.fillRect(0+ (i * 200), this.outputY5Slot + (this.SIZEY * 1), 60, 60, '#FFFFFF', 0.9)
    }

  }

  displayHelp () {
    let textList = [
      '스탯 도움말',
      '현재 스탯에 관한 정보를 표시합니다.',
      '장비가 장착된 경우, 골드가 있다면 장비를 업그레이드 할 수 있습니다.',
      '',
      '업데이트로 새로운 기능이 추가될 수 있습니다.',
      '',
    ]

    // 화면 전체 영역중 10만큼의 영역을 제외하고 전부 칠함
    const borderSize = 10
    const WIDTH = game.graphic.CANVAS_WIDTH - (borderSize * 2)
    const HEIGHT = game.graphic.CANVAS_HEIGHT - (borderSize * 2)
    game.graphic.fillRect(borderSize, borderSize, WIDTH, HEIGHT, '#f7fff1', 0.9)

    const textSize = 20
    for (let i = 0; i < textList.length; i++) {
      game.graphic.fillText(textList[i], textSize, textSize + (i * textSize), '#121e00')
    }
  }
  
  display () {
    super.display()
    this.displayUserAttack()
    this.displayUserStat()
    this.displayUserEquipment()
    this.displayUserLevel()
    this.displaySlot()

    // userSystem.inventory.add(ID.item.standardPlusC1Blue)

    if (this.isHelp) this.displayHelp()
  }
}

class InventorySystem extends MenuSystem {
  constructor () {
    super()
    this.backgroundColor = ['#93b4b3', '#b6ece6']

    this.NUM_START_ICON = 0
    this.NUM_END_ICON = 49
    this.NUM_START_MENU = 50
    this.NUM_END_MENU = 54

    this.outputX3Icon = 100
    this.outputY1Menu = 180
    this.outputY2Info = 20
    this.outputY3Icon = 240

    this.ICON_COUNT = 50

    this.STATE_MENU = 'menu'
    this.STATE_ICON = 'icon'
    this.STATE_HELP = 'help'
    this.STATE_DELETE = 'delete'
    this.state = this.STATE_MENU
    this.cursorIcon = 0
    this.cursorMenu = 0
    this.cursorPage = 0
    this.cursorDelete = false

    this.upgradeTextEnimationFrame = 0

    const iconX = this.outputX3Icon
    const slotSize = imageDataInfo.system.itemIconSection.width
    for (let i = 0; i < 50; i++) {
      this.menuList[i] = new BoxObject(iconX + ((i % 10) * slotSize), this.outputY3Icon + (slotSize * Math.floor(i / 10)), slotSize, slotSize, '', '#989898', '#989898', 'cyan')
    }

    const src = imageSrc.system.mainSystem
    const imgDList = [
      imageDataInfo.mainSystem.inventoryBack, 
      imageDataInfo.mainSystem.inventoryEquip,
      imageDataInfo.mainSystem.inventoryUpgrade,
      imageDataInfo.mainSystem.inventoryHelp, 
      imageDataInfo.mainSystem.inventoryDelete,
    ]
    const menuWidth = imageDataInfo.mainSystem.inventoryBack.width
    const menuHeight = imageDataInfo.mainSystem.inventoryBack.height
    for (let i = 0; i < imgDList.length; i++) {
      let index = this.NUM_START_MENU + i
      this.menuList[index] = new BoxImageObject(iconX + (i * menuWidth), this.outputY1Menu, menuWidth, menuHeight, '', src, imgDList[i])
    }

    this.NUM_PREVPAGE_INDEX = 58
    this.NUM_NEXTPAGE_INDEX = 59
    this.menuList[this.NUM_PREVPAGE_INDEX] = new BoxImageObject(this.outputX3Icon - menuWidth, this.outputY3Icon, menuWidth, menuHeight, '', src, imageDataInfo.mainSystem.inventoryPrevPage)
    this.menuList[this.NUM_NEXTPAGE_INDEX] = new BoxImageObject(this.outputX3Icon + (slotSize * 10), this.outputY3Icon, menuWidth, menuHeight, '', src, imageDataInfo.mainSystem.inventoryNextPage)

    this.NUM_DELETE_YES_INDEX = 60
    this.NUM_DELETE_NO_INDEX = 61
    const MENU_ENDX = 700
    this.menuList[this.NUM_DELETE_YES_INDEX] = new BoxObject(MENU_ENDX - 240, this.outputY2Info + 100, 120, 40, 'YES(예)', '#feffbe', '#feffbe', 'blue') 
    this.menuList[this.NUM_DELETE_NO_INDEX] = new BoxObject(MENU_ENDX - 120, this.outputY2Info + 100, 120, 40, 'NO(아니오)', '#feffbe', '#feffbe', 'blue')
    this.menuList[this.NUM_DELETE_YES_INDEX].hidden = true
    this.menuList[this.NUM_DELETE_NO_INDEX].hidden = true

  }

  process () {
    super.process()
    this.processCursorPosition()
    this.processAdvanceMenu()
    this.processUpgradeTextEnimationFrame()
  }
  
  processAdvanceMenu () {
    this.menuList[this.cursorIcon].focus = true // 강제 포커스 조정
    if (this.state === this.STATE_DELETE) { // 삭제 메뉴 표시 및 제거
      this.menuList[this.NUM_DELETE_YES_INDEX].hidden = false
      this.menuList[this.NUM_DELETE_NO_INDEX].hidden = false
      if (this.cursorDelete) {
        this.menuList[this.NUM_DELETE_YES_INDEX].focus = true
      } else {
        this.menuList[this.NUM_DELETE_NO_INDEX].focus = true
      }
    } else {
      this.menuList[this.NUM_DELETE_YES_INDEX].hidden = true
      this.menuList[this.NUM_DELETE_NO_INDEX].hidden = true
    }
  }

  processButton () {
    super.processButton()
    if (this.state === this.STATE_ICON) {
      this.processButtonIcon()
    } else if (this.state === this.STATE_MENU) {
      this.processButtonMenu()
    } else if (this.state === this.STATE_DELETE) {
      this.processButtonDelete()
    }
  }

  processButtonDelete () {
    let button = this.getButtonObject()
    if (button.buttonLeft) {
      this.cursorDelete = true
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonRight) {
      this.cursorDelete = false
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  processCursorPosition () {
    if (this.state === this.STATE_MENU) {
      this.cursorPosition = this.NUM_START_MENU + this.cursorMenu
    } else if (this.state === this.STATE_ICON) {
      this.cursorPosition = this.NUM_START_ICON + this.cursorIcon
    }
  }

  processMouseCursorCalcuration () {
    if (this.state === this.STATE_HELP) {
      this.selected = false
      this.canceled = true
      return
    }

    if (this.cursorPosition >= this.NUM_START_MENU && this.cursorPosition <= this.NUM_END_MENU) {
      this.state = this.STATE_MENU
      this.cursorMenu = this.cursorPosition - this.NUM_START_MENU
    } else if (this.cursorPosition >= this.NUM_START_ICON && this.cursorPosition <= this.NUM_END_ICON) {
      this.state = this.STATE_ICON
      this.cursorIcon = this.cursorPosition - this.NUM_START_ICON
    }

    if (this.cursorPosition === this.NUM_PREVPAGE_INDEX) {
      if (this.cursorPage > 0) {
        this.cursorPage--
        game.sound.play(soundSrc.system.systemCursor)
      }
      this.selected = false // (다른) 메뉴가 추가 선택되는걸 막음
    } else if (this.cursorPosition === this.NUM_NEXTPAGE_INDEX) {
      if (this.cursorPage < this.getCursorPageMax()) {
        this.cursorPage++
        game.sound.play(soundSrc.system.systemCursor)
      }
      this.selected = false // (다른) 메뉴가 추가 선택되는걸 막음
    }
  }

  getCursorPageMax () {
    return Math.floor(userSystem.inventory.itemList.length / this.ICON_COUNT)
  }

  processButtonIcon () {
    let button = this.getButtonObject()
    const cursorX = this.cursorIcon % 10
    const cursorY = Math.floor(this.cursorIcon / 10)
    const cursorMaxPage = Math.floor(userSystem.inventory.itemList.length / this.ICON_COUNT)

    if (button.buttonLeft) {
      if (cursorX === 0 && this.cursorPage > 0) {
        this.cursorPage--
        this.cursorIcon += 9
        game.sound.play(soundSrc.system.systemCursor)
      } else if (cursorX > 0) {
        this.cursorIcon--
        game.sound.play(soundSrc.system.systemCursor)
      }
    } else if (button.buttonRight) {
      if (cursorX === 9 && this.cursorPage < this.getCursorPageMax()) {
        if (this.cursorPage < cursorMaxPage) {
          this.cursorPage++
          this.cursorIcon -= 9
          game.sound.play(soundSrc.system.systemCursor)
        }
      } else if (cursorX < 9) {
        this.cursorIcon++
        game.sound.play(soundSrc.system.systemCursor)
      }
    } else if (button.buttonDown && cursorY < 4) {
      this.cursorIcon += 10
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonUp) {
      cursorY === 0 ? this.state = this.STATE_MENU : this.cursorIcon -= 10
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  processButtonMenu () {
    let button = this.getButtonObject()
    const menuCount = this.NUM_END_MENU - this.NUM_START_MENU
    if (button.buttonLeft && this.cursorMenu > 0) {
      this.cursorMenu--
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonRight && this.cursorMenu < menuCount) {
      this.cursorMenu++
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonDown) {
      this.state = this.STATE_ICON
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return
    
    if (this.state === this.STATE_MENU) {
      this.processSelectMenu()
    } else if (this.state === this.STATE_DELETE) {
      if (this.cursorDelete) {
        userSystem.inventoryItemDelete(this.getCursorItemIndex())
        this.processCursorPosition()
        this.state = this.STATE_MENU
        game.sound.play(soundSrc.system.systemItemDelete)
      } else {
        this.state = this.STATE_MENU
        game.sound.play(soundSrc.system.systemBack)
      }
    } else if (this.state === this.STATE_ICON) {
      this.state = this.STATE_MENU
      game.sound.play(soundSrc.system.systemCursor)
    } else if (this.state === this.STATE_HELP) {
      this.canceled = true
    }
  }

  processSelectMenu () {
    if (this.cursorMenu === 0) {
      this.canceled = true
    } else if (this.cursorMenu === 1) {
      // equip
      let success = userSystem.setEquipment(this.getCursorItemIndex())
      if (success)  game.sound.play(soundSrc.system.systemEquip)
    } else if (this.cursorMenu === 2) {
      // upgarde
      let success = userSystem.inventoryItemUpgrade(this.getCursorItemIndex())
      if (success) {
        game.sound.play(soundSrc.system.systemEquipmentUpgrade)
        this.upgradeTextEnimationFrame = 66
      }
    } else if (this.cursorMenu === 3) {
      // help
      this.state = this.STATE_HELP
      game.sound.play(soundSrc.system.systemSelect)
    } else if (this.cursorMenu === 4) {
      // delete
      let cursorItem = userSystem.inventory.get(this.getCursorItemIndex())
      if (cursorItem != null && cursorItem.id !== 0) {
        this.state = this.STATE_DELETE
        this.cursorDelete = false
        game.sound.play(soundSrc.system.systemSelect)
      }
    }
  }

  processCancel () {
    if (!this.canceledCheck()) return

    if (this.state === this.STATE_ICON || this.state === this.STATE_MENU) {
      gameSystem.stateId = gameSystem.STATE_MAIN
    } else if (this.state === this.STATE_DELETE || this.state === this.STATE_HELP) {
      this.state = this.STATE_MENU
    }
    game.sound.play(soundSrc.system.systemBack)
  }

  processMouseClickExtend () {
    this.processMouseCursorCalcuration()
    this.processMouseCursorDeleteCheck()
  }

  processMouseCursorDeleteCheck () {
    if (this.state === this.STATE_DELETE) {
      if (this.cursorPosition === this.NUM_DELETE_YES_INDEX) {
        this.cursorDelete = true
      } else if (this.cursorPosition === this.NUM_DELETE_NO_INDEX) {
        this.cursorDelete = false
      }
    }
  }

  processUpgradeTextEnimationFrame () {
    if (this.upgradeTextEnimationFrame > 0) {
      this.upgradeTextEnimationFrame--
    }
  }

  displayIcon () {
    for (let i = 0; i < 50; i++) {
      let index = i + (this.cursorPage * this.ICON_COUNT)
      let inven = userSystem.inventory.get(index)
      if (inven == null) continue

      let itemData = dataExportStatItem.get(inven.id)
      if (itemData == null) continue
      if (itemData.iconNumber === -1) continue

      const src = imageSrc.system.itemIcon
      const iconSize = imageDataInfo.system.itemIcon.width
      const iconSectionSize = imageDataInfo.system.itemIconSection.width
      const border = (iconSectionSize - iconSize) / 2
      const sliceX = iconSectionSize * (itemData.iconNumber % 10)
      const sliceY = iconSectionSize * Math.floor(itemData.iconNumber / 10)
      const outputX = iconSectionSize * (i % 10) + this.outputX3Icon + border
      const outputY = iconSectionSize * Math.floor(i / 10) + this.outputY3Icon + border
      game.graphic.imageDisplay(src, sliceX, sliceY, iconSize, iconSize, outputX, outputY, iconSize, iconSize)

      if (itemData.type === userSystem.inventory.itemType.ITEM) {
        const itemCount = inven.count < 999 ? inven.count : 999
        digitalDisplay('X' + itemCount, outputX, outputY + iconSize - 20)
      }
    }
  }

  displayInfo () {
    let index = this.getCursorItemIndex()
    let item = userSystem.inventory.get(index)
    if (item == null) return

    let data = dataExportStatItem.get(item.id)
    if (data == null) return

    // info display
    let typeText = data.type === userSystem.inventory.itemType.EQUIPMENT ? 'EQUIPMENT' : 'ITEM'
    let firstLineText = data.type === userSystem.inventory.itemType.ITEM ? ', count:' + item.count : ', require Level: ' + data.equipmentRequireLevel

    digitalDisplay('INDEX: ' + this.getCursorItemIndex() + ', type: ' + typeText + firstLineText, this.outputX3Icon, this.outputY2Info + 0)
    digitalDisplay('NAME: ', this.outputX3Icon, this.outputY2Info + 20)
    game.graphic.fillText(data.name, this.outputX3Icon + 60, this.outputY2Info + 20)
    game.graphic.fillText(data.info, this.outputX3Icon + 20, this.outputY2Info + 40)

    if (data.type === userSystem.inventory.itemType.EQUIPMENT) {
      let statusData = userSystem.getInventoryEquipmentStatus(index)
      if (statusData == null) return
      let upgradeText = `       upgrade +${item.upgradeLevel} -> upgrade +${item.upgradeLevel + 1}`
      let attackDiff = statusData.nextLevelAttack - statusData.attack
      let attackText = 'attack: ' + statusData.attack + ' -> ' + statusData.nextLevelAttack + ' (+' + attackDiff + ')'
      let costText = 'cost: ' + statusData.cost + '  [user gold: ' + userSystem.gold + ']'
      if (item.upgradeLevel === userSystem.UPGRADE_LEVEL_MAX) {
        upgradeText = 'upgrade +' + userSystem.UPGRADE_LEVEL_MAX
        attackText = 'attack: ' + statusData.attack
        costText = 'cost: ' + statusData.cost
      }

      if (this.upgradeTextEnimationFrame % 3 !== 2) {
        digitalDisplay(upgradeText, this.outputX3Icon, this.outputY2Info + 100)
        digitalDisplay(attackText, this.outputX3Icon, this.outputY2Info + 120)
        digitalDisplay(costText, this.outputX3Icon, this.outputY2Info + 140)
      }

      // digitalDisplay('UPGRADE COST: ' + statusData.cost, this.outputX3Icon, this.outputY2Info + 100)
      // digitalDisplay('USER GOLD: ' + userSystem.gold, this.outputX3Icon, this.outputY2Info + 120)
    }
  }

  displayItemDeleteWarning () {
    let textList = [
      '이 아이템을 삭제하시겠습니까?',
      '삭제된 아이템은 복구할 수 없습니다.',
      'Are you sure you want to delete the item?',
      'Deleted items cannot be recovered.',
    ]

    const borderY = this.outputY2Info
    const borderX = 100
    const WIDTH = game.graphic.CANVAS_WIDTH - (borderX * 2)
    const HEIGHT = 100
    
    game.graphic.fillRect(borderX, borderY, WIDTH, HEIGHT, 'white')
    for (let i = 0; i < textList.length; i++) {
      game.graphic.fillText(textList[i], borderX + 10, borderY + 10 + (i * 20))
    }
  }

  display () {
    super.display()
    if (this.state === this.STATE_DELETE) {
      this.displayItemDeleteWarning()
    } else {
      this.displayInfo()
    }
    
    this.displayUpgradeBlock()
    this.displayIcon()
    this.displayPage()
    this.displayPlayerEquip()

    if (this.state === this.STATE_HELP) this.displayHelp()
  }

  displayHelp () {
    let textList = [
      '인벤토리 도움말',
      '아이템을 선택하면, 메뉴를 선택하여 해당 아이템을 처리할 수 있습니다.',
      '아이템은, 아이템과 장비 2종류가 있습니다.',
      '장비 아이템은 장착, 강화가 가능합니다.',
      '아이템들은 사용할 수 없습니다. 특정한 상황에서 자동으로 사용됩니다.',
      'index: 색인(인벤토리 번호)',
      'page: 페이지(아이템의 개수가 50개를 초과해야 이동 가능)',
      '',
      '장비 아이템 관련 정보',
      'require level: 해당 장비를 장착하기 위한 최소레벨',
      'upgarde +x: 현재 업그레이드 레벨 및, 다음 업그레이드 레벨 표시',
      'attack: 현재 장비의 공격력, 다음 업그레이드 레벨의 장비 공격력 표시',
      'cost: 업그레이드 비용',
      'user gold: 현재 유저가 가지고 있는 골드',
      '',
      'delete 메뉴는 해당 아이템을 삭제합니다.',
      '삭제된 아이템은 되돌릴 수 없으며, 남은 개수에 상관없이 전부 삭제됩니다.',
    ]

    // 화면 전체 영역중 10만큼의 영역을 제외하고 전부 칠함
    const borderSize = 10
    const WIDTH = game.graphic.CANVAS_WIDTH - (borderSize * 2)
    const HEIGHT = game.graphic.CANVAS_HEIGHT - (borderSize * 2)
    game.graphic.fillRect(borderSize, borderSize, WIDTH, HEIGHT, '#ddfffb', 0.9)

    const textSize = 20
    for (let i = 0; i < textList.length; i++) {
      game.graphic.fillText(textList[i], textSize, textSize + (i * textSize), '#011916')
    }
  }

  displayPlayerEquip () {
    if (userSystem.equipment.id === 0) return
    const INDEX = userSystem.equipment.itemIndex
    if (INDEX < 0) return
    const targetPage = Math.floor(INDEX / this.ICON_COUNT)
    if (this.cursorPage !== targetPage) return

    const slotSize = imageDataInfo.system.itemIconSection.width
    const X = this.outputX3Icon + (slotSize * (INDEX % 10))
    const Y = this.outputY3Icon + (slotSize * Math.floor(INDEX / 10))
    gameFunction.imageObjectDisplay(imageSrc.system.mainSystem, imageDataInfo.mainSystem.inventoryUserEquipIcon, X, Y)
  }

  displayPage () {
    digitalDisplay('-INDEX-', 0, this.outputY1Menu)
    digitalDisplay((this.getCursorItemIndex() + '/' + userSystem.inventory.itemList.length).padStart(8, ' '), 0, this.outputY1Menu + 20)
    digitalDisplay('PAGE:' + this.cursorPage + '/' + this.getCursorPageMax(), 0, this.outputY1Menu + 40)
  }

  displayUpgradeBlock () {
    let item = userSystem.inventory.get(this.getCursorItemIndex())
    if (item == null || item.itemType !== userSystem.inventory.itemType.EQUIPMENT) {
      let target = this.menuList[this.NUM_START_MENU + 1]
      game.graphic.fillRect(target.x, target.y, target.width, target.height, 'black', 0.7)
      game.graphic.fillRect(target.x + target.width, target.y, target.width, target.height, 'black', 0.7)
    }
  }

  getCursorItemIndex () {
    return this.cursorIcon + (this.cursorPage * this.ICON_COUNT)
  }
}

class StorySystem extends MenuSystem {
  constructor () {
    super()
    this.backgroundColor = ['#ffccef', '#ffdbe4']
  }

  processSelect () {
    if (!this.selectedCheck()) return

    this.canceled = true
  }

  processMouseClickExtend () {
    this.canceled = true
  }

  display () {
    super.display()
    game.graphic.fillText('해당 기능은 나중에 구현될 예정', 0, 40)
  }
}

class EtcSystem extends MenuSystem {
  constructor () {
    super()
    this.backgroundColor = ['#bbb695', '#cbcd7a']

    const MENUWIDTH = 600
    const MENUHEIGHT = 30
    let textList = [
      '<< back(뒤로)', 
      'enemy test (적 테스트)', 
      'background test (배경 테스트)', 
      'down tower test (다운 타워 테스트), LV 20',
      'sound test (사운드 테스트)',
      'statView.html file open (statView.html 파일 열기)',
      'BIOS menu (바이오스 메뉴)']

    for (let i = 0; i < textList.length; i++) {
      this.menuList[i] = new BoxObject(0, 0 + (MENUHEIGHT * i), MENUWIDTH, MENUHEIGHT, textList[i], '#e9d7be', '#e9d7be', '#4e4841')
    }
  }

  processButton () {
    super.processButton()

    let button = this.getButtonObject()
    if (button.buttonUp && this.cursorPosition > 0) {
      this.cursorPosition--
      game.sound.play(soundSrc.system.systemCursor)
    } else if (button.buttonDown && this.cursorPosition < this.menuList.length - 1) {
      this.cursorPosition++
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  processSelect () {
    if (!this.selectedCheck()) return

    if (this.cursorPosition === 0) {
      this.canceled = true
    } else if (this.cursorPosition === 1) {
      this.roundStart(ID.round.test1Enemy)
    } else if (this.cursorPosition === 2) {
      this.roundStart(ID.round.test2Background)
    } else if (this.cursorPosition === 3) {
      let roundData = dataExportStatRound.get(ID.round.test3Round3DownTower)
      if (roundData != null && userSystem.lv >= roundData.requireLevel) {
        this.roundStart(ID.round.test3Round3DownTower)
      } else {
        game.sound.play(soundSrc.system.systemBuzzer)
      }
    } else if (this.cursorPosition === 4) {
      this.roundStart(ID.round.test4Sound)
    } else if (this.cursorPosition === 5) {
      let a = document.createElement('a')
      a.href = './statView.html'
      a.click() // 다른 html 파일로 이동
    } else if (this.cursorPosition === 6) {
      game.runBiosMode()

      // 바이오스를 빠져나가면 메인화면으로 이동
      gameSystem.stateId = gameSystem.STATE_MAIN 
    }
  }

  /**
   * 라운드를 시작시킴
   * @param {number} roundId
   */
  roundStart (roundId) {
    fieldSystem.roundStart(roundId)

    if (fieldSystem.message === fieldSystem.messageList.STATE_FIELD) {
      gameSystem.stateId = gameSystem.STATE_FIELD
    }
  }

  processMouseClickExtend () {
    
  }

  display () {
    super.display()
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
     * @type {{text: string, backgroundColor: string, colorA: string, colorB: string, multiple: number}[]}
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
      game.graphic.fillRect(LAYERX, OUTPUT_Y, LAYER_WIDTH, LAYER_HEIGHT, this.lineData[i].backgroundColor)
      game.graphic.meterRect(LAYERX, OUTPUT_Y, LAYER_WIDTH, LAYER_HEIGHT, [this.lineData[i].colorA, this.lineData[i].colorB], this.lineData[i].multiple, 1)
      digitalDisplay(this.lineData[i].text, LAYERX + 1, OUTPUT_Y + 1)

      // 테두리도 추가로 그려야 함.
      game.graphic.strokeRect(LAYERX, OUTPUT_Y, LAYER_WIDTH, LAYER_HEIGHT, 'black')
    }
  }
}

class ErrorSystem extends MenuSystem {
  constructor () {
    super()
    /** 오류 메세지 텍스트 */ this.message = ''
    /** 버튼을 누른 횟수 */ this.buttonPressHit = 0
    /** 에러의 종류 (errorTypeList 참고), 공백인경우 기본오류로 간주함 */ this.errorType = ''
    this.errorStack = ''

    this.errorTypeList = {
      LOADERROR: 'loadError',
      FIELDERROR: 'FieldError',
      NORMALERROR: '',
    }
  }

  /** 
   * 에러를 처리하고, 강제로 오류 화면을 생성함 (게임 시스템의 상태도 같이 변경됩니다.) 
   * 
   * @param {Error | null | undefined} error 에러 객체
   * @param {string} errorType 에러의 종류 (errorTypeList 참고)
   * @param {string} message 출력할 메세지 (1번째 문장)
   */
  setErrorCatch (error, errorType, message = '') {
    // 에러 객체가 존재하고 stack이 있으면 이를 출력할 수 있게 하기 위해 값을 추가
    if (error != null && error.stack != null) this.errorStack = error.stack

    this.errorType = errorType
    this.message = message
    gameSystem.stateId = gameSystem.STATE_ERROR
    game.sound.musicStop() // 음악 정지
  }

  process () {
    if (this.errorType === this.errorTypeList.LOADERROR) this.processLoadError()
    else if (this.errorType === this.errorTypeList.FIELDERROR) this.processFieldError()
    else this.processNormalError()
  }

  processLoadError () {
    if (game.control.getButtonInput(game.control.buttonIndex.START)) {
      this.buttonPressHit++
    }

    if (this.buttonPressHit >= 10) {
      gameSystem.dataReset()
      setTimeout(() => { location.reload() }, 1000)
    }
  }

  processFieldError () {
    if (game.control.getButtonInput(game.control.buttonIndex.START)) {
      gameSystem.stateId = gameSystem.STATE_MAIN
    }
  }

  processNormalError () {
    if (game.control.getButtonInput(game.control.buttonIndex.START)) {
      gameSystem.stateId = gameSystem.STATE_MAIN
    }
  }

  displayLoadError () {
    digitalDisplay('TAMSHOOTER4 SYSTEM ERROR', 0, 0)
    digitalDisplay('LOAD DATA ERROR', 0, 20)
    game.graphic.fillText(this.message, 0, 40, '#C2BD90')

    let textList = [
      systemText.gameError.LOAD_ERROR_MESSAGE1,
      systemText.gameError.LOAD_ERROR_MESSAGE2,
      systemText.gameError.LOAD_ERROR_MESSAGE3,
      systemText.gameError.LOAD_ERROR_MESSAGE4,
      systemText.gameError.LOAD_ERROR_MESSAGE5,
      systemText.gameError.LOAD_ERROR_MESSAGE6,
      systemText.gameError.LOAD_ERROR_MESSAGE7,
      systemText.gameError.LOAD_ERROR_MESSAGE8
    ]

    for (let i = 0; i < textList.length; i++) {
      game.graphic.fillText(textList[i], 0, 100 + (25 * i), '#B8B8B8')
    }

    if (this.buttonPressHit >= 10) {
      game.graphic.fillText(systemText.gameError.LOAD_ERROR_DATA_DELETE_COMPLETE1, 0, 350, '#B8B8B8')
      game.graphic.fillText(systemText.gameError.LOAD_ERROR_DATA_DELETE_COMPLETE2, 0, 375, '#B8B8B8')
    }
  }

  displayFieldError () {
    digitalDisplay('TAMSHOOTER4 SYSTEM ERROR', 0, 0)
    digitalDisplay('FILED ERROR', 0, 20)
    game.graphic.fillText(this.message, 0, 40, '#C28D90')

    let textList = [
      systemText.gameError.FIELD_ERROR1,
      systemText.gameError.FIELD_ERROR2,
      systemText.gameError.FIELD_ERROR3,
      systemText.gameError.FIELD_ERROR4,
    ]

    for (let i = 0; i < textList.length; i++) {
      game.graphic.fillText(textList[i], 0, 100 + (25 * i), '#B8B8B8')
    }

    let stackTraceText = this.errorStack.split('\n')
    for (let i = 0; i < stackTraceText.length; i++) {
      game.graphic.fillText(stackTraceText[i], 0, 220 + (25 * i), '#0c2782')
    }
  }

  displayErrorNormal () {
    digitalDisplay('TAMSHOOTER4 SYSTEM ERROR', 0, 0)
    digitalDisplay('NORMAL ERROR', 0, 20)
    game.graphic.fillText(this.message, 0, 40, '#C28D90')

    let stackTraceText = this.errorStack.split('\n')
    for (let i = 0; i < stackTraceText.length; i++) {
      game.graphic.fillText(stackTraceText[i], 0, 100 + (25 * i), '#0c2782')
    } 
  }

  display () {
    game.graphic.fillRect(0, 0, game.graphic.CANVAS_WIDTH, game.graphic.CANVAS_HEIGHT, '#4F4F4F')
    switch (this.errorType) {
      case this.errorTypeList.LOADERROR: this.displayLoadError(); break
      case this.errorTypeList.FIELDERROR: this.displayFieldError(); break
      default: this.displayErrorNormal(); break
    }
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
  /** 상태: 인벤토리 */ static STATE_INVENTORY = 8
  /** 상태: 스토리 */ static STATE_STORY = 9
  /** 상태: 필드(게임 진행중) */ static STATE_FIELD = 12
  /** 상태: 오류 발생 */ static STATE_ERROR = 13
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
  /** 업그레이드 시스템 */ static upgradeSystem = new StatUpgradeSystem()
  /** 인벤토리 시스템 */ static inventorySystem = new InventorySystem()
  /** 스토리 시스템 */ static storySystem = new StorySystem()
  /** etc... 시스템 */ static etcSystem = new EtcSystem()
  /** error 시스템 */ static errorSystem = new ErrorSystem()


  /** 현재 게임의 옵션 데이터를 가져옵니다. */
  static getGameOption () {
    return this.optionSystem.optionValue
  }

  /** 
   * 임시 함수 (현재는 사용할지 잘 모르겠음)
   * 
   * 게임 메인 화면에서는 에코를 사용하지 않습니다.
   * 라운드에서는 에코 효과를 사용할 수 있지만 해제하지 않으므로, 메인 화면에서 해제합니다.
   * 
   * @deprecated
   */
  static echoCancle () {
    game.sound.setEchoDisable()
    game.sound.setMusicEchoDisable()
  }

  /**
   * 세이브 데이터의 규칙이 변경됨 (0.43.0) - 하위호환을 위해 이 값들은 유지됩니다. (다만 이후엔 삭제할 가능성이 높음)
   * 
   * 저장하거나 불러올 때 localStorage 에서 사용하는 키 이름 (임의로 변경 금지)
   * 각 키 별로, 저장 데이터 형식과 저장 목적에 대해 자세히 설명되어있습니다.
   * 대부분의 저장 형식에서 구분자를 ,(쉼표) 로 사용합니다.
   * 
   * @deprecated
   */
  static saveKey = {
    /**
     * 게임에서 저장된 데이터가 있는지 확인
     * 주의: localStoarge를 통해서 받아오는 값은 string입니다. 그래서 'false'값을 저장해도 Boolean('false')를 해서
     * 값을 불러와봐야 어차피 true값이 됩니다.(자바스크립트는 문자열에 값이 있으면 true입니다.)
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
    fieldData: 'tamshooter4FieldData',

    /** 무기의 리스트 */
    weaponList: 'weaponList',

    /** 스킬의 리스트 (0 ~ 3번 A슬롯, 4 ~ 7번 B슬롯) */
    skillList: 'skillList'
  }

  /** 
   * 이 값 대신 getCurrentSaveKey를 사용해주세요. 왜냐하면 숫자키도 같이 사용해야합니다.
   * 
   * 다만 이 키 값은 내부 상수로 사용되야 하므로 이 코드를 삭제하지 마세요.
   * 
   * tamshooter4에서 사용하는 lcoalStoarge save key 
   * @deprecated
   */
  static saveKeyTamshooter4Data = 'tamshooter4SaveData'

  /** 
   * 이 값 대신 getCurrentSaveKey를 사용해주세요. 왜냐하면 숫자키도 같이 사용해야합니다.
   * 
   * 다만 이 키 값은 내부 상수로 사용되야 하므로 이 코드를 삭제하지 마세요.
   * 
   * tamshooter4에서 사용하는 saveKey에 추가적으로 붙는 번호 (다만 이 게임에서 다중 세이브를 사용할 생각이 없음) 
   * @deprecated
   */
  static saveKeyTamshooter4DataNumber = 0

  static saveFlagList = {
    v0a36: 'v0a36',
    level1V0a43: 'level1 v0a43',
  }

  /** tamshooter4에서 사용하는 실제 세이브 키 (참고: 세이브 키 + 세이브 번호의 조합으로 키를 구성하기 때문에 이 함수를 사용해야 합니다.) */
  static getCurrentSaveKey () {
    return this.saveKeyTamshooter4Data + this.saveKeyTamshooter4DataNumber
  }

  /** tamshooter4에서 사용하는 백업용 세이브 키 (오류가 났을 때 복구하는 용도) */
  static getCurrentSaveKeyBackup () {
    return this.saveKeyTamshooter4Data + this.saveKeyTamshooter4DataNumber + 'backup'
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
   * 저장 기능은, 1초에 한번씩 진행됩니다. 달래아 - 지연(프레임)
   * 이 게임 내에서는, 지연 시간을 딜레이란 단어로 표기합니다.
   * 
   * @param {boolean} [forceSave=false] 강제 세이브 여부 (딜레이를 무시함) 특정 상황에서만 이 변수의 값을 true로 설정해주세요.
   */
  static processSave (forceSave = false) {
    // 세이브 데이터를 저장하는 조건이 맞아야만 저장됩니다. 자세한 내용은 함수 내부를 살펴보세요.
    if (!this.processSaveConditionCheck(forceSave)) return

    // 저장 시간 (참고: getMonth는 0부터 시작하기 때문에 +1을 해야합니다.)
    const saveDate = new Date()
    const saveDateString = saveDate.getFullYear() + ',' + (saveDate.getMonth() + 1) + ',' + saveDate.getDate() + ',' + saveDate.getHours() + ',' + saveDate.getMinutes() + ',' + saveDate.getSeconds()

    // 유저의 첫 시작 시간
    const startDate = this.userSystem.startDate
    const startDateString = startDate.year + ',' + startDate.month + ',' + startDate.day + ',' + startDate.hour + ',' + startDate.minute + ',' + startDate.second

    // 플레이 타임 저장
    const playTime = this.userSystem.playTime
    const playTimeString = playTime.hour + ',' + playTime.minute + ',' + playTime.second

    // 모든 옵션 값들 저장
    const optionValue = this.optionSystem.optionValue

    // 유저의 데이터
    const userData = this.userSystem.getSaveData()

    // sramData (조작 방지를 위한 추가 정보)
    let sramData = [
      this.saveNumberEncode(userData.lv, userData.exp, userData.gold),
      this.saveNumberEncode(userData.inventoryIdList),
      this.saveNumberEncode(userData.inventoryCountList)
    ]

    let saveData = {
      saveFlag: this.saveFlagList.level1V0a43,
      saveDate: saveDateString,
      startDate: startDateString,
      playTime: playTimeString,
      option: optionValue,
      userData: userData,
      sramData: sramData
    }

    let jsonString = JSON.stringify(saveData)
    localStorage.setItem(this.getCurrentSaveKey(), jsonString)
    localStorage.setItem(this.getCurrentSaveKeyBackup(), jsonString)

    // 필드 저장 데이터는, 필드 상태에서, 게임이 진행 중일 때에만 저장됩니다. 클리어, 게임오버, 탈출상태가 되면 저장하지 않습니다.
    if (this.stateId === this.STATE_FIELD && (fieldSystem.stateId === fieldSystem.STATE_NORMAL || fieldSystem.stateId === fieldSystem.STATE_PAUSE) ) {
      const fieldSaveData = fieldSystem.fieldSystemSaveData()
      localStorage.setItem(this.saveKey.fieldData, JSON.stringify(fieldSaveData))
    } else {
      // 필드 상태가 아니면, 필드 저장 데이터는 삭제
      localStorage.removeItem(this.saveKey.fieldData)
    }
  }

  /**
   * 세이브가 진행되어야 하는지 확인합니다.
   * @param {boolean} forceSave 
   * @returns {boolean}
   */
  static processSaveConditionCheck (forceSave) {
    // 데이터 리셋이 되었다면, 게임을 자동 새로고침하므로 저장 함수를 실행하지 않음.
    if (this.isDataReset) return false

    /** 저장 딜레이 시간 */ const SAVE_DELAY = this.SAVE_DELAY

    // 세이브 지연시간보다 세이브 지연 시간을 카운트 한 값이 낮으면 함수는 실행되지 않습니다.
    // 즉, 60frame을 채울때까지 저장 기능은 미루어집니다. 따라서 1초에 1번씩 저장합니다.
    this.saveDelayCount++ // 세이브 딜레이에 카운트 증가
    // 강제세이브의 경우, 저장딜레이를 무시하고 강제로 저장함
    if (!forceSave && this.saveDelayCount < SAVE_DELAY) return false

    // 세이브 딜레이 초기화
    this.saveDelayCount = 0

    return true
  }

  /**
   * 이 함수는 더이상 사용되지 않습니다. (하위호환을 위한 참고용으로 남겨두었으며 이 함수를 실행하면 오류가 발생될 수 있습니다.)
   * 
   * 저장 기능은, 1초에 한번씩 진행됩니다. 달래아 - 지연(프레임)
   * 이 게임 내에서는, 지연 시간을 딜레이란 단어로 표기합니다.
   * 
   * @deprecated
   * 
   * @param {boolean} [forceSave=false] 강제 세이브 여부 (딜레이를 무시함) 특정 상황에서만 이 변수의 값을 true로 설정해주세요.
   */
  static processSaveOldV0a36 (forceSave = false) {
    // 데이터 리셋이 되었다면, 게임을 자동 새로고침하므로 저장 함수를 실행하지 않음.
    if (this.isDataReset) return

    /** 저장 딜레이 시간 */ const SAVE_DELAY = this.SAVE_DELAY

    // 세이브 지연시간보다 세이브 지연 시간을 카운트 한 값이 낮으면 함수는 실행되지 않습니다.
    // 즉, 60frame을 채울때까지 저장 기능은 미루어집니다. 따라서 1초에 1번씩 저장합니다.
    this.saveDelayCount++ // 세이브 딜레이에 카운트 증가
    // 강제세이브의 경우, 저장딜레이를 무시하고 강제로 저장함
    if (!forceSave && this.saveDelayCount < SAVE_DELAY) return

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
    const optionValue = JSON.stringify(this.optionSystem.optionValue)
    localStorage.setItem(this.saveKey.optionValue, optionValue)

    const userData = this.userSystem.getSaveData0a36()
    localStorage.setItem(this.saveKey.userData, userData)

    // 필드 저장 데이터는, 필드 상태에서, 게임이 진행 중일 때에만 저장됩니다. 클리어, 게임오버, 탈출상태가 되면 저장하지 않습니다.
    if (this.stateId === this.STATE_FIELD && (fieldSystem.stateId === fieldSystem.STATE_NORMAL || fieldSystem.stateId === fieldSystem.STATE_PAUSE) ) {
      const fieldSaveData = fieldSystem.fieldSystemSaveData()
      localStorage.setItem(this.saveKey.fieldData, JSON.stringify(fieldSaveData))
    } else {
      // 필드 상태가 아니면, 필드 저장 데이터는 삭제
      localStorage.removeItem(this.saveKey.fieldData)
    }
  }

  /**
   * 특정 숫자를 임의의 코드로 암호화합니다. (소수점은 암호화 불가능, 강제로 정수로 변환됩니다.)
   * @param  {...string[] | number[] | string | number} saveNumber 
   * @returns {string} JSON문자열
   */
  static saveNumberEncode (...saveNumber) {
    /** 인코드 결과 문자열 */ let result = ''

    // 형식 변환
    /** @type {string[]} */ let saveString = []
    for (let str of saveNumber) {
      saveString.push('' + str)
    }

    // saveString의 배열을 한 문장으로 합침
    for (let i = 0; i < saveString.length; i++) {
      let len = saveString[i].length // 문자열의 길이
      let digit = 1 // 문자열의 길이에 대한 자리수 (1 ~ 9: 1, 10 ~ 99: 2, 100 ~ 999: 3, 1000 ~ 9999: 4, 그 이상은 처리 불가능)

      if (len >= 10 && len <= 99) digit = 2
      else if (len >= 100 && len <= 999) digit = 3
      else if (len >= 1000) digit = 4

      // saveString 정보에 따라 해당 정보를 결과 문장에 합침
      let str = '' + digit + len + saveString[i]
      result += str
    }

    // 암호의 키는 8자리 숫자로 만들기 위해 10000000 ~ 99999999 범위를 가짐
    let getKeyOdd = Math.floor(Math.random() * 89999999) + 10000000
    let getKeyEven = Math.floor(Math.random() * 89999999) + 10000000

    // 총 2개의 키를 저장하며, 홀수키는 앞에, 짝수키는 뒤에 배치한다.
    // getKeyOdd가 홀수인경우 getKeyOdd를 사용하고, 아닌경우 getKeyEven을 사용한다.
    let getKeyTarget = getKeyOdd % 2 === 1 ? getKeyOdd : getKeyEven

    // 각 문자열을 8자리 숫자로 분해
    // 한번 반복문을 거칠때마다 8의 배수 단위로 문자열을 잘라서 배열에 넣습니다.
    /** @type {number[]} */ let arrayNumber = []
    for (let i = 0; i < Math.ceil(result.length / 8); i++) {
      // 8자리 단위로 입력해야 되기 때문에 만약 빈 공간이 있을경우, '0'을 집어넣습니다.
      let digit8 = Number(result.slice(i * 8, i * 8 + 8).padEnd(8, '0'))
      arrayNumber[i] = digit8 ^ getKeyTarget
    }

    // 암호화된 키를 양쪽에 추가 (나중에 해독에 필요함)
    arrayNumber.unshift(getKeyOdd)
    arrayNumber.push(getKeyEven)

    // 최종 결과를 JSON으로 형식화해서 다시 문자열로 리턴함
    return JSON.stringify(arrayNumber)
  }

  /**
   * encode로 변환하였던 문자열을 다시 원래의 숫자 배열로 변환시킵니다.
   * @param {string} JSONParse JSON으로 인코딩된 문자열 (일반 문자열은 해독 불가능)
   */
  static saveNumberDecode (JSONParse) {
    /** @type {number[]} */ let arrayNumber = []
    // 첫번째 예외처리: JSON 변환
    try {
      arrayNumber = JSON.parse(JSONParse)
    } catch {
      console.error('saveSystemError: 잘못된 형식의 JSON 데이터. 이 데이터를 사용할 수 없습니다.')
      return
    }
    
    // 두번째 예외처리: 숫자 확인
    for (let i = 0; i < arrayNumber.length; i++) {
      if (typeof arrayNumber[i] !== "number") {
        return
      }
    }

    // 키 찾기
    let getKeyFirst = arrayNumber[0]
    let getKeyLast = arrayNumber[arrayNumber.length - 1]
    let getKeyTarget = getKeyFirst % 2 === 1 ? getKeyFirst : getKeyLast

    /** @type {string} 결과 문자열 */ let result = ''
    /** @type {number[]} 키값의 암호화 해제한 디코드 배열 */ let decodeArray = []

    // 디코드 진행
    for (let i = 0; i < arrayNumber.length; i++) {
      // 첫번째와 마지막 키는 기준 키이므로 이를 디코드 하지 않습니다.
      if (i === 0 || i === arrayNumber.length - 1) continue
      decodeArray.push(arrayNumber[i] ^ getKeyTarget)
    }

    // 디코드 된 배열을 하나로 합침
    result = decodeArray.join('')

    // 각 디코드 된 숫자들을 인코드 형식에 맞게 디코딩
    /** @type {number} 문자열의 시작 위치 */ let position = 0
    /** @type {number[]} 나누어진 문자열을 해석하여 만들어진 원래의 숫자 배열 */ let divArray = []
    /** 자리수 표현 글자 수 */ const DIGITLEN = 1
    while (position < result.length) {
      // 형식에 맞게, digit(글자의 길이 자리수), len(글자의 길이), text(실제 텍스트)
      let digit = Number(result.slice(position, position + DIGITLEN))
      let len = Number(result.slice(position + DIGITLEN, position + DIGITLEN + digit))
      let text = Number(result.slice(position + DIGITLEN + digit, position + DIGITLEN + digit + len))

      // 마지막 글자이면서 디지트가 0인경우 리턴
      if (position === result.length - 1 && digit === 0) {
        position++
        continue
      }

      divArray.push(text) // 결과를 새 배열에 추가
      position += DIGITLEN + digit + len // 다음 문자를 읽을 위치를 변경
    }

    return divArray
  }

  /**
   * 해당 키로 데이터 로드 작업을 진행합니다.
   * 
   * @param {string} key 불러올 데이터의 키 값
   * @returns {boolean} 성공 여부
   */
  static processLoadStorageKey (key) {
    let loadData
    let tamshooter4LoadData = localStorage.getItem(key)
    if (tamshooter4LoadData == null) {
      return false
    }

    try {
      loadData = JSON.parse(tamshooter4LoadData)
    } catch (e) {
      this.errorSystem.setErrorCatch(e, this.errorSystem.errorTypeList.LOADERROR, systemText.gameError.LOAD_JSON_ERROR)
      console.error(systemText.gameError.LOAD_JSON_ERROR)
      return false
    }

    // 불러오기 작업 진행
    if (loadData.saveFlag) {
      // 현재(v0.44) 에서는 처리해야 할 내용은 없습니다.
      // 다만 이후 버전에서 처리해야 할 내용이 있을 수 있으므로, 이 코드는 공백으로 남겨둡니다.
    }

    if (loadData.playTime) {
      const playTime = loadData.playTime.split(',')
      this.userSystem.setPlayTime(playTime[0], playTime[1], playTime[2])
    }

    if (loadData.startDate) {
      const startDate = loadData.startDate.split(',')
      this.userSystem.setStartDate(Number(startDate[0]), startDate[1], startDate[2], startDate[3], startDate[4], startDate[5])
    }

    if (loadData.option) {
      this.optionSystem.optionValue = loadData.option
      this.optionSystem.optionEnable() // 불러온 옵션값을 적용
    }

    if (loadData.userData) {
      // sram으로 처리
      let sram1, sram2, sram3
      let userLvExp
      if (loadData.sramData) {
        sram1 = loadData.sramData[0]
        userLvExp = this.saveNumberDecode(sram1)

        sram2 = loadData.sramData[1]
        sram3 = loadData.sramData[2]
      }

      if (sram1 == null || userLvExp == null) {
        this.errorSystem.setErrorCatch(null, this.errorSystem.errorTypeList.LOADERROR, systemText.gameError.USER_SRAM_ERROR)
        return false
      } else {
        loadData.userData.lv = userLvExp[0]
        loadData.userData.exp = userLvExp[1]
        loadData.userData.gold = userLvExp[2]
      }

      if (sram2 != null || sram3 != null) {
        loadData.userData.inventoryId = this.saveNumberDecode(sram2)
        loadData.userData.inventoryCount = this.saveNumberDecode(sram3)
      }

      let isSuccessUserData = this.userSystem.setLoadData(loadData.userData)
      if (!isSuccessUserData) {
        return false
      }
    }

    // 정상적으로 불러온경우 true 리턴
    return true
  }

  /** 불러오기 기능: 게임을 실행할 때 한번만 실행. 만약, 또 불러오기를 하려면 게임을 재시작해주세요. */
  static processLoad () {
    // 이미 불러왔다면 함수는 실행되지 않습니다.
    if (this.initLoad) return

    // 초기 불러오기 완료 설정
    this.initLoad = true

    // 유저의 스킬을 강제로 표시하기 위해 해당 함수를 사용
    userSystem.setSkillDisplayStatDefaultFunction()

    // 불러오기 작업 진행
    // 0.36.0 ~ 0.42.6 까지의 세이브 파일은 자동으로 0.43.0으로 변환됩니다.
    // 단, 이미 0.43.0 이후의 데이터가 존재한다면, 0.36.0 ~ 0.42.6 데이터가 있어도 그 데이터는 유지되고 반영되지 않습니다.
    let tamshooter4LoadData = localStorage.getItem(this.getCurrentSaveKey())
    let tamshooter4BackupData = localStorage.getItem(this.getCurrentSaveKeyBackup())
    if (tamshooter4LoadData == null && tamshooter4BackupData == null) {
      this.processLoadOldV0a36() // 참고: 이 버전에서조차 불러온 데이터가 없다면 저장된 데이터는 없는것으로 처리합니다.
      if (localStorage.getItem(this.saveKey.saveFlag) == null) {
        userSystem.setStartDateReset()
      }
      return
    }

    // 데이터를 불러오고 성공했는지 여부를 판단
    let isSuccess = this.processLoadStorageKey(this.getCurrentSaveKey())
    if (!isSuccess) {
      // 만약 실패했다면, 백업데이터를 통해 다시 시도
      let isBackupSuccess = this.processLoadStorageKey(this.getCurrentSaveKeyBackup())
      if (!isBackupSuccess) {
        // 이것도 실패했다면, 오류 발생시키고, 다른 메뉴로 이동시킴 (저장 기능은 사용 불가가됨)
        this.stateId = this.STATE_ERROR
        // localStorage.removeItem(this.getCurrentSaveKey())
        // localStorage.removeItem(this.getCurrentSaveKeyBackup())
        localStorage.removeItem(this.saveKey.fieldData)
        return
      }
    }
    
    // 모든 데이터를 불러온 후 필드 데이터가 있으면 필드 데이터를 불러옴
    try {
      const fieldSaveData = localStorage.getItem(this.saveKey.fieldData)
      if (fieldSaveData != null) {
        // 경고: localStoarge 특성상 string값으로 비교해야 합니다.
        // 필드 저장 데이터가 있다면, state를 필드 데이터로 이동
        // 참고로 필드 데이터는 JSON으로 저장되므로, 이걸 JSON.parse 해야합니다.
        this.stateId = this.STATE_FIELD
        fieldSystem.fieldSystemLoadData(JSON.parse(fieldSaveData))
        game.setBiosDisplayPossible(false)
      }
    } catch (e) {
      alert(systemText.gameError.FILED_LOAD_ERROR)
      localStorage.removeItem(this.saveKey.fieldData)
      this.stateId = this.STATE_MAIN
      game.setBiosDisplayPossible(true)
    }
  }

  /**
   * 과거 버전을 불러오는 함수 (이 함수는 하위호환을 위해 남겨놓았습니다.)
   * @deprecated
   */
  static processLoadOldV0a36 () {
    // saveFlag의 값을 불러오고, 만약 아무것도 없다면 이 버전의 데이터를 불러오지 않습니다.
    const saveFlag = localStorage.getItem(this.saveKey.saveFlag)
    if (!saveFlag) {
      // 첫번째로 게임이 실행되었을 때 추가적인 실행 코드 (초기화)
      userSystem.setSkillDisplayStatDefaultFunction()
      return
    }
    
    // 플레이 타임 불러오기: 저장 규칙을 모르겠으면, saveKey 객체 내에 있는 변수들의 설명을 참고
    const playTimeArray = localStorage.getItem(this.saveKey.playTime)
    if (playTimeArray != null) {
      const playTime = playTimeArray.split(',')
      this.userSystem.setPlayTime(playTime[0], playTime[1], playTime[2])
    }
    
    // 시작 날짜 및 시간 불러오기
    const startDateArray = localStorage.getItem(this.saveKey.startDate)
    if (startDateArray != null) {
      const startDate = startDateArray.split(',')
      this.userSystem.setStartDate(Number(startDate[0]), startDate[1], startDate[2], startDate[3], startDate[4], startDate[5])
    }
    
    // 옵션 값 불러오기
    const optionValue = localStorage.getItem(this.saveKey.optionValue)
    if (optionValue != null) {
      this.optionSystem.optionValue = JSON.parse(optionValue)
      this.optionSystem.optionEnable() // 불러온 옵션값을 적용
    }
    
    const userData = localStorage.getItem(this.saveKey.userData)
    if (userData != null) {
      this.userSystem.setLoadData0a36(userData)
    }
  }

  static isDataReset = false

  /**
   * 모든 데이터를 삭제합니다.
   * 삭제 기능이 동작한 후, 2초 후 자동으로 새로고침 되기 때문에, 저장기능이 일시적으로 정지도비니다.
   */
  static dataReset () {
    // localStorage.clear() // 이제 tamshooter4와 관련한 데이터만 삭제됩니다.
    // 다른 데이터를 엉뚱하게 삭제할 가능성이 있으므로, localStorage.clear는 사용하지 않습니다.
    localStorage.removeItem(this.getCurrentSaveKey())
    localStorage.removeItem(this.getCurrentSaveKeyBackup())
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

    digitalDisplay(year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second, 0, 480)
  }

  /**
   * 게임에 관한 모든 처리는 여기서 진행합니다.
   * [process 함수 내에서 출력과 관련됨 모든 함수 사용금지]
   */
  static process () {
    if (this.stateId === this.STATE_ERROR) {
      this.errorSystem.process()
      return
    }
    
    this.userSystem.process()
    if (this.stateId === this.STATE_MAIN) this.userSystem.showUserStat()

    switch (this.stateId) {
      case this.STATE_MAIN: this.mainSystem.process(); break
      case this.STATE_OPTION: this.optionSystem.process(); break
      case this.STATE_ROUND_SELECT: this.roundSelectSystem.process(); break
      case this.STATE_DATA_SETTING: this.dataSettingSystem.process(); break
      case this.STATE_WEAPON_SELECT: this.weaponSelectSystem.process(); break
      case this.STATE_SKILL_SELECT: this.skillSelectSystem.process(); break
      case this.STATE_UPGRADE: this.upgradeSystem.process(); break
      case this.STATE_ETC: this.etcSystem.process(); break
      case this.STATE_INVENTORY: this.inventorySystem.process(); break
      case this.STATE_STORY: this.storySystem.process(); break
      case this.STATE_FIELD: this.fieldProcess(); break
    }

    this.processStatLine()
    this.processSave()
    this.processLoad()
  }

  static fieldProcess () {
    try {
      this.fieldSystem.process()
    } catch (e) {
      this.errorSystem.setErrorCatch(e, this.errorSystem.errorTypeList.FIELDERROR, systemText.gameError.FIELD_ERROR1)
      console.error(e)
    }

    const messageList = this.fieldSystem.messageList
    switch (this.fieldSystem.message) {
      case messageList.CHANGE_MUSICON:
        this.optionSystem.setOption(this.optionSystem.MENU_MUSIC)
        break
      case messageList.CHANGE_SOUNDON:
        this.optionSystem.setOption(this.optionSystem.MENU_SOUND)
        break
      case messageList.STATE_MAIN:
        this.stateId = this.STATE_MAIN
        break
      case messageList.STATE_FIELD:
        this.stateId = this.STATE_FIELD
        break
      case messageList.REQUEST_SAVE:
        this.processSave(true)
        break
    }

    // 메세지는 처리된 후 지워져야 합니다.
    this.fieldSystem.message = ''

    // 사운드 음악 옵션을 필드에게 전달
    fieldSystem.option.musicOn = this.optionSystem.optionValue.musicOn
    fieldSystem.option.soundOn = this.optionSystem.optionValue.soundOn
  }

  static processStatLine () {
    switch (this.stateId) {
      case this.STATE_MAIN:
      case this.STATE_OPTION:
        gameVar.statLineText1.setStatLineText('fps: ' + game.currentFps)
        gameVar.statLineText2.setStatLineText(this.userSystem.getPlayTimeText())
        this.userSystem.setSkillDisplayCooltimeZero()
        break
      case this.STATE_FIELD:
        // 필드에서는 필드 객체가 대신 이 값을 수정합니다.
        if (gameVar.statLineText1.text === '') {
          gameVar.statLineText1.setStatLineText('fps: ' + game.currentFps)
        }
        break
      default:
        // 스탯라인 텍스트 지우기
        gameVar.statLineText1.setStatLineText()
        gameVar.statLineText2.setStatLineText()
    }
  }

  /**
   * 게임에 관한 모든 출력은 여기서 진행합니다.
   * [display 함수 내에세 게임에 관한 모든 처리 금지, 출력 함수만 사용하세요.]
   */
  static display () {
    // 화면 지우기
    game.graphic.clearCanvas()

    if (this.stateId === this.STATE_ERROR) {
      this.errorSystem.display()
      return
    }

    // 화면 출력
    switch (this.stateId) {
      case this.STATE_MAIN: this.mainSystem.display(); break
      case this.STATE_OPTION: this.optionSystem.display(); break
      case this.STATE_ROUND_SELECT: this.roundSelectSystem.display(); break
      case this.STATE_DATA_SETTING: this.dataSettingSystem.display(); break
      case this.STATE_WEAPON_SELECT: this.weaponSelectSystem.display(); break
      case this.STATE_SKILL_SELECT: this.skillSelectSystem.display(); break
      case this.STATE_UPGRADE: this.upgradeSystem.display(); break
      case this.STATE_INVENTORY: this.inventorySystem.display(); break
      case this.STATE_STORY: this.storySystem.display(); break
      case this.STATE_ETC: this.etcSystem.display(); break
    }

    if (this.stateId === this.STATE_FIELD) {
      try {
        this.fieldSystem.display()
      } catch (e) {
        this.errorSystem.setErrorCatch(e, this.errorSystem.errorTypeList.FIELDERROR, e.message)
        console.error(e)
      }
    }

    if (this.stateId === this.STATE_MAIN || this.stateId === this.STATE_FIELD) {
      this.userSystem.display()
      this.displayStatLine()
    }
    
  }

  static displayStatLine () {
    let line1 = gameVar.statLineText1
    this.statSystem.setLineText(0, line1.text, line1.value, line1.valueMax, line1.colorA, line1.colorB)

    let line2 = gameVar.statLineText2
    this.statSystem.setLineText(1, line2.text, line2.value, line2.valueMax, line2.colorA, line2.colorB)
    this.statSystem.display()
  }

  /**
   * stat 시스템에 출력할 정보를 입력합니다. (StatSystem클래스의 setLineText 함수랑 동일합니다.)
   * @param {number} lineIndex 라인의 번호(현재는 0 ~ 1번까지만 지원)
   * @param {string} text 표시할 텍스트
   * @param {number} value 그라디언트 진행도를 표시할 기준값. 없으면 0 또는 null
   * @param {number} valueMax 그라디언트 진행도를 표시할 최대값, 없으면 0 또는 null
   * @param {string} colorA 색깔 A
   * @param {string} colorB 색깔 B(이것을 넣으면 그라디언트 효과 적용)
   */
  static setStatLineText(lineIndex, text = '', value = 0, valueMax = 0, colorA = '', colorB = colorA) {
    this.statSystem.setLineText(lineIndex, text, value, valueMax, colorA, colorB)
  }
}