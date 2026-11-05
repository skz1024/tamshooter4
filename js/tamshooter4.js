//@ts-check
"use strict"

import { imageSrc, imageDataInfo, ImageDataObject } from "./imageSrc.js";
import { dataExportStatItem, dataExportStatPlayerSkill, dataExportStatPlayerWeapon, dataExportStatRound, StatItem, StatPlayerSkill, StatPlayerWeapon, StatRound, StatWeapon } from "./dataStat.js";
import { soundSrc } from "./soundSrc.js";
import { ID } from "./dataId.js";
import { gameVar, userSystem, userSystem as UserSystem } from "./game.js";
import { fieldSystem as FieldSystem } from "./field.js";
import { game, gameFunction } from "./game.js";
import { stringText, systemText } from "./text.js";
import { dataExportPlayerSkill, dataExportPlayerWeapon } from "./dataPlayer.js";

const versionText = 'created by skz1024 | ver 0.57 | 2026/09/23'
let digitalDisplay = gameFunction.digitalDisplay
let loadComplete = false

/** 시스템에서 가장 먼저 로드될 이미지 목록 @type {string[]} */ let systemImageList = []
/** 시스템에서 가장 먼저 로드될 사운드 목록 @type {string[]} */ let systemSoundList = []

/** 첫번째로 불러올 함수 사용 */
let firstLoadFunction = () => {
  
  // 시스템이 가진 변수명들을 모두 가져와 이미지 리스트 경로에 추가합니다.
  systemImageList.push(...Object.values(imageSrc.system))
  systemImageList.push(imageSrc.weapon.weapon) // 무기 이미지
  systemImageList.push(imageSrc.system.roundIcon) // 라운드 아이콘 이미지
  
  // 이미지 생성 시작
  for (let i = 0; i < systemImageList.length; i++) {
    game.graphic.createImage(systemImageList[i])
  }
  
  // 사운드 생성 시작
  systemSoundList.push(...Object.values(soundSrc.system))
  systemSoundList.push(...Object.values(soundSrc.skill))

  for (let i = 0; i < systemSoundList.length; i++) {
    game.sound.createAudio(systemSoundList[i])
  }
}
firstLoadFunction() // 해당 함수 바로 실행

game.process = () => {
  GameSystem.process()
}
game.graphicFps = 60
game.display = () => {
  if (loadComplete) {
    GameSystem.display()
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
  /** 기본으로 사용하는 강조 색 */ static DEFAULT_FOCUS_COLOR = 'blue'
  /** 기본으로 사용하는 강조 색이지만 조금 더 밝음 */ static DEFAULT_FOCUS_LIGHT_COLOR = 'lightblue'
  /** 커서가 다른 부분에 위치했을 때, 다른 상자를 강조할 때 사용하는 색 */ static FOCUS_COLOR_WAIT_CURSOR = 'orange'
  /** 상자의 기본 색 */ static DEFAULT_BOX_COLOR = 'silver'

  /**
   * 클릭 가능한 BoxObject입니다. 사실상 tamshooter4의 오브젝트 본체
   * @param {number} x Box의 x좌표
   * @param {number} y Box의 y좌표
   * @param {number} width Box의 길이
   * @param {number} height Box의 높이
   * @param {string} text Box에 입력할 텍스트
   * @param {string} color Box의 색깔 (endColor를 사용할경우 그라디언트의 시작 색상)
   * @param {string} endColor Box의 그라디언트의 끝색깔, endColor가 undefined 또는 '' (빈 문자열) 일 경우 그라디언트 없음.
   * @param {string} [focusColor=BoxObject.DEFAULT_FOCUS_COLOR] 포커스 상태일 때 기본 색상, 
   */
  constructor (x, y, width, height, text = '', color = BoxObject.DEFAULT_BOX_COLOR, endColor = '', focusColor = BoxObject.DEFAULT_FOCUS_COLOR) {
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

    /** 이미지 파일의 경로 */
    this.imageSrc = ''

    /** 이미지데이터 (imageDataInfo 클래스 참고) @type {ImageDataObject} */
    this.imageData = imageDataInfo.default.unused
  }

  /**
   * 이미지 데이터를 설정합니다.
   * @param {string} imageSrc 
   * @param {ImageDataObject} imageData 
   */
  setAutoImageData (imageSrc, imageData) {
    this.imageSrc = imageSrc
    this.imageData = imageData
  }

  /**
   * 박스가 마우스 위에 있는지 충돌 여부를 검사
   * @param {number} mouseX
   * @param {number} mouseY
   * @returns
   */
  collision (mouseX, mouseY) {
    if (this.hidden) return false

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

  displayImage () {
    if (this.imageSrc !== '') {
      game.graphic.imageDisplay(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
    }
  }

  displayFocus () {
    if (this.focus) {
      game.graphic.fillRect(this.x, this.y, this.width, this.height, this.focusColor, 0.5)
    }
  }

  displayText () {
    if (this.text) { // 텍스트
      game.graphic.fillText(this.text, this.x + this.borderWidth + 2, this.y + this.borderWidth)
    }
  }

  /** 박스를 출력하는 함수 */
  display () {
    if (this.hidden) return

    this.displayBackGround()
    this.displayImage()
    this.displayFocus()
    this.displayText()
  }

  /**
   * 박스를 클릭한 경우에 사용해주세요. (참고: 마우스 좌표값을 넣지 않으면 박스 입장에서 박스를 클릭했는지 알 수 없습니다.)
   * @param {number} mouseX 클릭한 마우스의 x좌표
   * @param {number} mouseY 클릭한 마우스의 y좌표
   */
  click (mouseX, mouseY) {
    if (this.hidden) return false

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
}

class UIIconDisplay {
  /**
   * 아이콘 이미지를 출력합니다.
   * @param {string} src 이미지 소스
   * @param {number} iconNumber 아이콘 번호
   * @param {number} iconWidth 아이콘 너비
   * @param {number} iconHeight 아이콘 높이
   * @param {number} outputWidth 출력 너비
   * @param {number} outputHeight 출력 높이
   * @param {number} x 출력 X 좌표
   * @param {number} y 출력 Y 좌표
   */
  static displayIconImage (src, iconNumber, x, y, iconWidth, iconHeight,
     outputWidth = iconWidth, outputHeight = iconHeight) {
    const sliceX = iconWidth * (iconNumber % 10)
    const sliceY = iconHeight * Math.floor(iconNumber / 10)

    game.graphic.imageDisplay(
      src,
      sliceX, sliceY, iconWidth, iconHeight,
      x, y, outputWidth, outputHeight
    )
  }

  /**
   * 아이콘 이미지를 여백이 포함된 패턴으로 출력합니다.  
   * 이 것은 item의 크기가 여백을 포함한 크기로 배치되었기 때문에 만든 함수입니다.
   * @param {string} src 이미지 소스
   * @param {number} iconNumber 아이콘 번호
   * @param {number} iconWidth 아이콘 너비
   * @param {number} iconHeight 아이콘 높이
   * @param {number} sectionWidth 해당 구역의 너비
   * @param {number} sectionHeight 해당 구역의 높이
   * @param {number} outputWidth 출력 너비
   * @param {number} outputHeight 출력 높이
   * @param {number} x 출력 X 좌표
   * @param {number} y 출력 Y 좌표
   */
  static displayIconImageWithSection (src, iconNumber, x, y, iconWidth, iconHeight,
    sectionWidth, sectionHeight, outputWidth = iconWidth, outputHeight = iconHeight) {
    const sliceX = sectionWidth * (iconNumber % 10)
    const sliceY = sectionHeight * Math.floor(iconNumber / 10)

    game.graphic.imageDisplay(
      src,
      sliceX, sliceY, iconWidth, iconHeight,
      x, y, outputWidth, outputHeight
    )
  }

  /**
   * 무기 아이콘을 출력합니다.
   * @param {number} iconNumber 무기의 아이콘 번호
   * @param {number} x 
   * @param {number} y 
   */
  static displayIconWeapon (iconNumber, x = 0, y = 0) {
    if (iconNumber < 0) return
    const src = imageSrc.system.weaponIcon
    const width = imageDataInfo.system.weaponSkillIcon.width
    const height = imageDataInfo.system.weaponSkillIcon.height
    this.displayIconImage(src, iconNumber, x, y, width, height)
  }

  /**
   * 스킬 아이콘을 출력합니다.
   * @param {number} iconNumber 스킬의 아이콘 번호
   * @param {number} x 
   * @param {number} y 
   */
  static displayIconSkill (iconNumber, x, y) {
    if (iconNumber < 0) return
    const src = imageSrc.system.skillIcon
    const width = imageDataInfo.system.weaponSkillIcon.width
    const height = imageDataInfo.system.weaponSkillIcon.height
    this.displayIconImage(src, iconNumber, x, y, width, height)
  }

  /**
   * 아이템 아이콘을 출력합니다.
   * @param {number} iconNumber 아이템의 아이콘 번호
   * @param {number} x 
   * @param {number} y 
   */
  static displayIconItem (iconNumber, x, y) {
    if (iconNumber < 0) return
    const src = imageSrc.system.itemIcon
    const width = imageDataInfo.system.itemIcon.width
    const height = imageDataInfo.system.itemIcon.height
    const sectionWidth = imageDataInfo.system.itemIconSection.width
    const sectionHeight = imageDataInfo.system.itemIconSection.height
    this.displayIconImageWithSection(src, iconNumber, x, y, width, height, sectionWidth, sectionHeight)
  }
}

class UIComponentObject {
  static BASE_X = 250
  static BASE_Y = 100
  static BASE_WIDTH = 500
  static BASE_HEIGHT = 350

  /** 수평, 가로 방향 */ static GRID_HORIZONTAL = 0
  /** 수직, 세로 방향 */ static GRID_VERTICAL = 1
  /** 2차원 그리드 */ static GRID_2D = 2
  /** 사용자 정의 (이 경우, 기본 함수의 지원을 받을 수 없음) */ static GRID_CUSTOM = 3

  /** 마우스 이동 입력 지연 프레임 */ static MOUSE_MOVE_THROTTLE_FRAME = 3

  /** 마우스 조작 시에, 일정 프레임동안 다시 판정하는 것을 막기 위한 타이머 */
  #throttleFrame = 0

  /**
   * throttle 조건에 도달하면 true로 설정합니다.
   * 모든 처리가 끝난 뒤 throttle 프레임을 0으로 초기화합니다.
   * 같은 프레임에 부모·하위 처리 모두 throttle 검사를 통과하도록
   * 즉시 초기화하지 않고 요청 상태로 기록합니다.
   *
   * process()는 오버라이드하지 말고, processContent() 등 확장용 함수를 사용하세요.
   */
  #throttleReset = false

  /** 최대 페이지 번호 (이 값은 특수한 함수로만 변경 가능하고, 일반적인 조작은 불가능) */
  #maxPage = 0

  /** 최대 페이지 번호를 얻는 함수 (?) */
  get maxPage () { return this.#maxPage }

  constructor () {
    /** 
     * 배경 그라디언트 색 목록
     * 
     * 아무것도 없으면 배경색 없음. 1종류면 단색 처리
     * @type {string[]}
     */ 
    this.backgroundColor = ['red', 'blue']

    this.TITLE_HEIGHT = imageDataInfo.mainSystem.uiClose.height
    this.titleBackground = ['grey']

    /** 레이어 레벨, 이 값이 0인 경우, 취소 버튼을 누를 때 화면이 닫힙니다. */
    this.layerLevel = 0

    /** 이 창이 열려있는가?, 창을 닫아야 할 때를 알아내기 위해 만든 변수 */
    this.isOpen = false

    this.x = UIComponentObject.BASE_X
    this.y = UIComponentObject.BASE_Y
    this.width = UIComponentObject.BASE_WIDTH
    this.height = UIComponentObject.BASE_HEIGHT

    this.titleImageSrc = imageSrc.system.menuList
    this.titleImageObject = imageDataInfo.menuList.roundSelect
    
    let uiWidth = imageDataInfo.mainSystem.uiClose.width
    this.uiCloseBox = new BoxImageObject(this.x + this.width - uiWidth, this.y, uiWidth, imageDataInfo.mainSystem.uiClose.height, '', imageSrc.system.mainSystem, imageDataInfo.mainSystem.uiClose)
    this.uiCloseBox.focusColor = BoxObject.DEFAULT_FOCUS_LIGHT_COLOR

    this.cursor = {
      /** 커서가 지정되어 있는 페이지 값. 커서의 페이지와 현재 페이지(this.page)가 다른지 확인하는 용도   
       * 페이지 변경은 this.page로 사용 해야 합니다. */ page: 0,
      /** boxList 인덱스 */ index: 0,
      /** 메인라운드 (roundSelect 전용) */ mainRound: 0,
      /** 서브라운드 (roundSelect 전용) */ subRound: 0,
      /** 프리셋 번호 */ preset: 0,
      /** 유저 선택 번호 (weaponSelect, skillSelect) */ userSelect: 0,
      /** 한 UI 내부를 기준으로 한 레이어 번호, 이름 혼동 가능성 있으므로 추후 이름 변경 예정 (weaponSelect, skillSelect, roundSelect) 
       * 레이어 번호, 0일 경우 메인 라운드, 1일 경우 서브 라운드
       * */ layerNumber: 0,
    }

    /** 아이템 박스 리스트 (기본형)  
     * 주의: 이 아이템은 단일 박스 리스트이므로, 여러 박스 종류를 사용할가면, 사용자가
     * 새로운 박스를 만들어야 합니다!
     * @type {BoxObject[]} */
    this.boxList = []

    /** 타이틀 박스 리스트 (타이틀 화면에 적용)  
     * 주의: 임의 생성 시 오류 위험. create 함수로 정의된 몇몇 함수로만 이것을 컨트롤하세요!
     * @type {BoxObject[]}
     */
    this.titleBoxList = []

    this.grid = {
      /** 가로 축 개수 */ xCount: 0,
      /** 세로 축 개수 */ yCount: 1,
      /** 그리드 타입 (주의: 커스텀 타입을 사용할 생각이라면, 
       * 이 타입 값을) UIComponentObject.GRID 라고 적힌 특정 상수를 사용해주세요. */ 
      type: UIComponentObject.GRID_HORIZONTAL
    }

    /** 현재 페이지 번호 */ this.page = 0
  }

  /**
   * 박스 오브젝트를 그리드 형태로 생성합니다.  
   * 경고: 여러 번 사용하게 되면, 기본 함수가 지원을 제대로 할 수 없음.  
   * 커스텀 그리드는 사용자가 grid.type값을 수동으로 지정시켜야 합니다.  
   * @param {number} xCount 행 (가로 방향)
   * @param {number} yCount 열 (세로 방향)
   * @param {number} x 
   * @param {number} y 
   * @param {number} width 
   * @param {number} height 
   * @param {number} marginX 각 공간마다의 여백
   * @param {number} marginY 각 공간마다의 여백
   */
  createGrid2DBox (xCount, yCount, x = 1, y = 1, width = 1, height = 1, marginX = 0, marginY = 0) {
    if (xCount <= 0 || yCount <= 0) return
    if (xCount > 50 || yCount > 50) {
      console.warn('너무 많은 요청 개수는 과도한 배열을 생성시킵니다.')
      return
    }
    
    for (let i = 0; i < xCount; i++) {
      for (let j = 0; j < yCount; j++) {
        const newBox = new BoxObject(x + (i * (width + marginX)), y + (j * (height + marginY)), width, height)

        // 0 1 2 3 4
        // 5 6 7 8 9
        // 형태의 인덱스에 맞추도록 배치시킴
        this.boxList[j * xCount + i] = newBox
      }
    }

    // 그리드 정보 설정
    this.grid.xCount = xCount
    this.grid.yCount = yCount

    // 그리드 크기에 따라 타입을 자동으로 결정
    if (this.grid.xCount === 1) {
      // X축 개수가 1개로 고정된 경우, Y축 으로만 숫자가 늘어나므로, 수직 방향입니다.
      this.grid.type = UIComponentObject.GRID_VERTICAL
    } else if (this.grid.yCount === 1) {
      // Y축 개수가 1개로 고정된 경우, X축 으로만 숫자가 늘어나므로, 수평 방향입니다.
      this.grid.type = UIComponentObject.GRID_HORIZONTAL
    } else {
      // X축 Y축 모두 2개 이상인 경우: 2차원 그리드
      this.grid.type = UIComponentObject.GRID_2D
    }
  }

  /** 수직 (세로) 방향의 박스를 생성합니다. 이 함수는 createGrid2DBox의 편의 함수입니다. */
  createGridVerticalBox (count = 0, x = 1, y = 1, width = 1, height = 1, marginX = 0, marginY = 0) {
    if (count <= 0) return
    this.createGrid2DBox(1, count, x, y, width, height, marginX, marginY)
  }

  /** 수평 (가로) 방향의 박스를 생성합니다. 이 함수는 createGrid2DBox의 편의 함수입니다. */
  createGridHorizontalBox (count = 0, x = 1, y = 1, width = 1, height = 1, marginX = 0, marginY = 0) {
    if (count <= 0) return
    this.createGrid2DBox(count, 1, x, y, width, height, marginX, marginY)
  }

  /**
   * 새로운 최대 페이지를 만듭니다. 페이지 버튼은 타이틀 영역에 추가합니다. (단, 마우스 전용)  
   * 키보드로는, 화살표키로 페이지를 오고갈 수 있습니다.
   * @param {number} maxPage 최대 페이지 번호, 0 이하 처리 무시 (의미가 없으므로)
   */
  createPage (maxPage = 1) {
    if (maxPage <= 0) return

    this.#maxPage = maxPage
    const x = this.x + this.titleImageObject.width
    const src = imageSrc.system.mainSystem
    const iconWidth = imageDataInfo.mainSystem.currentPage.width
    const imgD = imageDataInfo.mainSystem
    const imgDList = [imgD.prevPage, imgD.nextPage, imgD.currentPage]
    for (let i = 0; i < imgDList.length; i++) {
      const newBox = new BoxImageObject(x + (i * iconWidth), this.y, iconWidth, iconWidth, '', src, imgDList[i])
      this.titleBoxList.push(newBox)
    }
  }

  /** 
   * 최대 페이지를 재설정합니다. 그러나, createPage를 먼저 사용해야 이 함수가 제대로 적용합니다.
   * @param {number} maxPage 최대 페이지 번호, 단 최소 1이상 설정해야 함.
   */
  setMaxPage (maxPage = 1) {
    if (maxPage < 1) return
    if (this.#maxPage === 0) {
      console.warn('페이지가 없는데 왜 페이지를 설정하는거죠? 그러지 마세요.')
      return
    }

    this.#maxPage = maxPage
    if (this.page > maxPage) {
      this.page = maxPage
    }
  }

  /**
   * 현재 가지고 있는 모든 박스리스트에 대하여 색을 일괄적으로 변경합니다.
   * @param {string} color 
   * @param {string} endColor 
   * @param {string} focusColor 
   */
  setAllBoxColor (color = '', endColor = '', focusColor = '') {
    for (let i = 0; i < this.boxList.length; i++) {
      this.boxList[i].color = color
      this.boxList[i].endColor = endColor
      this.boxList[i].focusColor = focusColor
    }
  }


  /** 커서를 해당 위치로 변경합니다. */
  changeCursor (value = 0) {
    // 참고: 이 함수는 사운드 출력까지 담당하기 때문에
    // 중복된 선택을 한 경우 (마우스로 인하여) 에는 커서 변경을 취소합니다.
    // 페이지가 다른 경우에는, 페이지를 변경했으므로, 커서 변경이 일어나지 않아도 사운드는 출력됩니다.
    if (value === this.cursor.index && this.cursor.page === this.page) return

    // 유효 범위 검사
    if (value < 0 || value >= this.boxList.length) return

    this.cursor.page = this.page
    this.cursor.index = value
    game.sound.play(soundSrc.system.systemCursor)
    this.changeBoxFocus()
  }

  /** 박스 내에 있는 포커스를 다른 포커스로 변경합니다. */
  changeBoxFocus () {
    for (let i = 0; i < this.boxList.length; i++) {
      // focus의 값은 true or false이므로, 조건식을 바로 대입하여 결과가 나옴
      this.boxList[i].focus = i === this.cursor.index
    }
  }

  /** 현재 커서의 X축 번호값을 얻어옵니다. 단 CUSTOM의 경우 0을 돌려받습니다. */
  getCursorX (index = this.cursor.index) {
      // GRID_CUSTOM은 0의 값만 리턴합니다.
    if (this.grid.type === UIComponentObject.GRID_CUSTOM) return 0

    if (this.grid.type === UIComponentObject.GRID_VERTICAL) return 0
    if (this.grid.type === UIComponentObject.GRID_HORIZONTAL) return index
    if (this.grid.type === UIComponentObject.GRID_2D) {
      if (this.grid.xCount <= 0) return 0
      return index % this.grid.xCount
    }

    return 0
  }

  /** 현재 커서의 Y축 번호값을 얻어옵니다. 단 CUSTOM의 경우 0을 돌려받습니다. */
  getCursorY (index = this.cursor.index) {
    // GRID_CUSTOM은 0의 값만 리턴합니다.
    if (this.grid.type === UIComponentObject.GRID_CUSTOM) return 0

    if (this.grid.type === UIComponentObject.GRID_HORIZONTAL) return 0
    if (this.grid.type === UIComponentObject.GRID_VERTICAL) return index
    if (this.grid.type === UIComponentObject.GRID_2D) {
      if (this.grid.xCount <= 0) return 0
      return Math.floor(index / this.grid.xCount)
    }

    return 0
  }

  /** 페이지를 고려한 인덱스 값을 얻어옵니다. */
  getCurrentIndex () {
    return this.page * this.boxList.length + this.cursor.index
  }

  /** 현재 페이지를 고려한 시작 인덱스 값을 얻어옵니다. */
  getStartIndex () {
    return this.page * this.boxList.length
  }

  /** 어떤 버튼이 눌렸는지를 오브젝트로 확인합니다. 버튼이 눌린것은 boolean값으로 확인해야합니다. */
  getButtonObject () {
    const buttonA = game.control.getButtonInput(game.control.buttonIndex.A) || game.control.getButtonInput(game.control.buttonIndex.START)
    const buttonB = game.control.getButtonInput(game.control.buttonIndex.B) || game.control.getButtonInput(game.control.buttonIndex.ESC)
    const buttonX = game.control.getButtonInput(game.control.buttonIndex.X)
    const buttonY = game.control.getButtonInput(game.control.buttonIndex.Y)
    const buttonUp = game.control.getButtonInput(game.control.buttonIndex.UP)
    const buttonDown = game.control.getButtonInput(game.control.buttonIndex.DOWN)
    const buttonLeft = game.control.getButtonInput(game.control.buttonIndex.LEFT)
    const buttonRight = game.control.getButtonInput(game.control.buttonIndex.RIGHT)
    const buttonSkill0 = game.control.getButtonInput(game.control.buttonIndex.L1)
    const buttonSkill1 = game.control.getButtonInput(game.control.buttonIndex.L2)
    const buttonSkill2 = game.control.getButtonInput(game.control.buttonIndex.R1)
    const buttonSkill3 = game.control.getButtonInput(game.control.buttonIndex.R2)
    return  {
      buttonA, buttonB, buttonX, buttonY,
      buttonUp, buttonDown, buttonLeft, buttonRight, buttonSkill0, buttonSkill1, buttonSkill2, buttonSkill3
    }
  }

  /** 너비, 높이 설정 */
  setWidthHeight (width = 400, height = 100) {
    this.width = width
    this.height = height
    this.#autoPositionUiCloseBox()
  }

  /** 창의 위치 변경 */
  setPosition (x = 0, y = 0) {
    this.x = x
    this.y = y
    this.#autoPositionUiCloseBox()
  }

  #autoPositionUiCloseBox () {
    this.uiCloseBox.x = this.x + this.width - this.uiCloseBox.width
    this.uiCloseBox.y = this.y
  }

  /**
   * 마우스를 조작할 때, 일정 프레임이 지나기 전까지 다시 판정하지 않습니다.
   * 
   * 주의: 이 함수에 다른 인자 값을 넣지 마세요. 함수가 정상적으로 동작하지 않습니다.
   */
  throttleCheck () {
    if (this.#throttleFrame >= UIComponentObject.MOUSE_MOVE_THROTTLE_FRAME) {
      this.#throttleReset = true
      return true
    } else {
      return false
    }
  }

  /** 프로세스 전체 함수, 이 함수를 오버라이드 하지 말고, 대신 processContent를 사용하세요. */
  process () {
    // 창이 열려있지 않으면 아무 동작도 하지 않음.
    if (!this.isOpen) return

    this.processButton()
    this.processMouse()
    this.processContent()

    this.#throttleFrame++
    if (this.#throttleReset) {
      this.#throttleFrame = 0
      this.#throttleReset = false
    }

    if (!this.isOpen) {
      this.processClose()
    }
  }

  /** 프로세스 컨텐츠 영역 (이 함수를 오버라이드 하세요) */
  processContent () {

  }

  /** 창을 닫아야 하거나 닫았을 때 추가적인 처리 목적으로 실행합니다.
   * 창 닫히는 명령이 실행된다고, 창은 즉시 닫히지 않습니다. 모든 처리가 끝난 후 닫힙니다.*/
  processClose () {

  }

  /** 창을 엽니다. */
  open () {
    this.isOpen = true
    this.changeBoxFocus()
  }

  /** 창을 닫습니다. */
  close () {
    this.isOpen = false
  }

  /** 페이지를 변경합니다. 1페이지 단위로만 변경할 수 있습니다.
   * @param {number} relativeValue 음수, 양수, 0만 사용 가능
   */
  changePage (relativeValue) {
    const nextPage = this.page + relativeValue

    if (nextPage < 0 || nextPage > this.#maxPage) return

    this.page = nextPage
    this.changeCursor(this.cursor.index)
  }

  /** 버튼을 눌렀을 때 */
  processButton () {
    let button = this.getButtonObject()
    if (button.buttonB) {
      this.processButtonCancel()
    } else if (button.buttonA) {
      this.processButtonSelect()
    } else if (button.buttonSkill0 || button.buttonSkill1) {
      this.changePage(-1)
    } else if (button.buttonSkill2 || button.buttonSkill3) {
      this.changePage(1)
    }

    this.processButtonMoveCursor()
  }

  /** 화살표키를 눌렀을 때의 커서의 이동 처리 */
  processButtonMoveCursor () {
    let button = this.getButtonObject()
    if (this.grid.type === UIComponentObject.GRID_VERTICAL) {
      if (button.buttonUp) {
        this.changeCursor(this.cursor.index - 1)
      } else if (button.buttonDown) {
        this.changeCursor(this.cursor.index + 1)
      }

      // 페이지가 0만 있는 경우는 페이지를 변경할 필요가 없으므로, 페이지 변경이 없습니다.
      // 페이지가 변동할 경우, 사운드 출력을 위하여 changeCursor 함수를 사용합니다.
      if (button.buttonLeft && this.page > 0) {
        this.changePage(-1)
      } else if (button.buttonRight && this.page < this.#maxPage) {
        this.changePage(1)
      }
    } else if (this.grid.type === UIComponentObject.GRID_HORIZONTAL) {
      if (button.buttonLeft) {
        this.changeCursor(this.cursor.index - 1)
      } else if (button.buttonRight) {
        this.changeCursor(this.cursor.index + 1)
      }

      // 페이지가 0만 있는 경우는 페이지를 변경할 필요가 없으므로, 페이지 변경이 없습니다.
      if (button.buttonUp && this.page > 0) {
        this.changePage(-1)
      } else if (button.buttonDown && this.page < this.#maxPage) {
        this.changePage(1)
      }
    } else if (this.grid.type === UIComponentObject.GRID_2D) {
      const x = this.getCursorX()
      const y = this.getCursorY()
      const { xCount, yCount } = this.grid

      if (button.buttonLeft) {
        if (x > 0) {
          this.changeCursor(this.cursor.index - 1)
        } else if (x === 0 && this.page > 0) {
          // 페이지가 1 감소 후, X축 방향 끝에서 X축 반대 끝으로 이동하고
          // Y축은 변동하지 않습니다. 따라서 1을 감소하고 X축 전체값을 올립니다.
          this.page--
          this.changeCursor(this.cursor.index - 1 + xCount)
        }
      } else if (button.buttonRight) {
        if (x < xCount - 1) {
          this.changeCursor(this.cursor.index + 1)
        } else if (x === xCount - 1 && this.page < this.#maxPage) {
          this.page++
          this.changeCursor(this.cursor.index + 1 - xCount)
        }
      } else if (button.buttonUp) {
        if (y > 0) {
          this.changeCursor(this.cursor.index - xCount)
        }
      } else if (button.buttonDown) {
        if (y < yCount - 1) {
          this.changeCursor(this.cursor.index + xCount)
        }
      }
    }
  }

  /** 선택을 했을 때 (마우스 클릭, 또는 A버튼)
   * 만약, 시스템 선택 사운드를 끄고 싶다면, 이 super함수를 호출하지 마세요.
   */
  processButtonSelect () {
    game.sound.play(soundSrc.system.systemSelect)
  }

  /** 취소를 했을 때 (마우스 클릭 위치가 X표시 부분, 또는 B버튼) */
  processButtonCancel () {
    game.sound.play(soundSrc.system.systemBack)
    if (this.layerLevel <= 0) {
      this.close()
      this.layerLevel = 0
    } else {
      this.layerLevel--
    }
  }

  /** 마우스를 움직이거나 클릭했을 때 */
  processMouse () {
    const mouseX = game.control.getMouseX()
    const mouseY = game.control.getMouseY()

    if (game.control.getMouseClick()) {
      if (this.uiCloseBox.collision(game.control.mouseX, game.control.mouseY)) {
        this.processButtonCancel()
      }

      for (let i = 0; i < this.boxList.length; i++) {
        if (this.boxList[i].collision(mouseX, mouseY)) {
          this.changeCursor(i)
          this.processButtonSelect()
          break
        }
      }

      for (let i = 0; i < this.titleBoxList.length; i++) {
        if (this.titleBoxList[i].collision(mouseX, mouseY)) {
          if (this.titleBoxList[i].imageData === imageDataInfo.mainSystem.prevPage) {
            if (this.page > 0) {
              this.page--
              this.changeCursor(this.cursor.index)
            }
          } else if (this.titleBoxList[i].imageData === imageDataInfo.mainSystem.nextPage) {
            if (this.page < this.#maxPage) {
              this.page++
              this.changeCursor(this.cursor.index)
            }
          }
        }
      }
    }

    if (game.control.isMouseMove && this.throttleCheck()) {
      for (let i = 0; i < this.boxList.length; i++) {
        if (this.boxList[i].collision(mouseX, mouseY)) {
          this.changeCursor(i)
        }
      }

      for (let i = 0; i < this.titleBoxList.length; i++) {
        if (this.titleBoxList[i].imageData === imageDataInfo.mainSystem.currentPage) continue

        if (this.titleBoxList[i].collision(mouseX, mouseY)) {
          this.titleBoxList[i].focus = true
        } else {
          this.titleBoxList[i].focus = false
        }
      }

      if (this.uiCloseBox.collision(mouseX, mouseY)) {
        this.uiCloseBox.focus = true
      } else {
        this.uiCloseBox.focus = false
      }
    }
  }

  /** 출력 함수 
   * 이 함수는 맨 앞에서 display 조건 여부를 확인합니다.
   * 따라서, 이 함수를 오버라이드 하지 말고, 세부 구현을 displayContent 함수에 해주세요.
   */
  display () {
    // 창이 열려있지 않으면 아무 동작도 하지 않음.
    if (!this.isOpen) return

    this.#displayTopClass()
    this.displayBox()
    this.displayContent()
  }

  #displayTopClass () {
    this.displayBackground()
    gameFunction.imageObjectDisplay(this.titleImageSrc, this.titleImageObject, this.x, this.y)
    this.uiCloseBox.display()

    for (let i = 0; i < this.titleBoxList.length; i++) {
      this.titleBoxList[i].display()
      if (this.titleBoxList[i].imageData === imageDataInfo.mainSystem.currentPage) {
        // 한글자와 두글자의 X축 출력 위치를 다르게 해서 가운데에 출력되는 효과를 부여함
        if (this.page <= 9) {
          digitalDisplay(this.page, this.titleBoxList[i].x + 15, this.titleBoxList[i].y + 5)
        } else {
          digitalDisplay(this.page, this.titleBoxList[i].x + 9, this.titleBoxList[i].y + 5)
        }
      }
    }
  }

  /** 필요하다면, 이 함수를 오버라이드해서 구현해주세요. */
  displayContent () {
    
  }

  displayBox () {
    for (let i = 0; i < this.boxList.length; i++) {
      this.boxList[i].display()
    }
  }

  displayBackground () {
    game.graphic.gradientRect(this.x, this.y, this.width, this.height, this.backgroundColor)
    game.graphic.gradientRect(this.x, this.y, this.width, this.TITLE_HEIGHT, this.titleBackground)
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

    GameSystem.stateId = GameSystem.STATE_MAIN
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



class UIComponentEquipmentUpgrade extends UIComponentObject {
  constructor () {
    super()
    this.backgroundColor = ['#8db1a4', '#71a392']
    this.MENU_BOX_MAX = 2
    this.setPosition(UIComponentObject.BASE_X + 50, UIComponentObject.BASE_Y + 50)
    this.setWidthHeight(UIComponentObject.BASE_WIDTH - 100, UIComponentObject.BASE_HEIGHT - 100)
    this.titleImageObject = imageDataInfo.menuList.equipmentUpgarde

    this.enimationFrame = 0

    const src = imageSrc.system.mainSystem
    const imgD = imageDataInfo.mainSystem
    const width = imageDataInfo.mainSystem.equipmentBack.width
    const height = imageDataInfo.mainSystem.equipmentBack.height

    this.createGridHorizontalBox(4, this.x, this.y + this.height - 50, width, height)
    const list = [
      imgD.equipmentBack,
      imgD.equipmentEquip,
      imgD.equipmentUpgarde,
      imgD.equipmentDowngarde,
    ]

    for (let i = 0; i < this.boxList.length; i++) {
      this.boxList[i].imageSrc = src
      this.boxList[i].imageData = list[i]
    }

    /** 업그레이드 대상의 인벤토리 인덱스 */
    this.targetInventoryIndex = 4
  }

  processContent () {
    if (this.enimationFrame > 0) {
      this.enimationFrame--
    }
  }

  processButtonSelect () {
    switch (this.cursor.index) {
      case 0: break // back
      case 1: userSystem.setEquipment(this.targetInventoryIndex); break // equip/unequip
      case 2:
        const isSuccess = userSystem.inventoryItemEquipmentUpgrade(this.targetInventoryIndex)
        if (isSuccess) {
          game.sound.play(soundSrc.system.systemEquipmentUpgrade)
          this.enimationFrame = 60
          // 저장 요청
          SaveSystem.requestSave()
        }
        else game.sound.play(soundSrc.system.systemBuzzer)
        break
      case 3:
        const isSuccessDown = userSystem.inventoryItemEquipmentDowngrade(this.targetInventoryIndex)
        if (isSuccessDown) {
          game.sound.play(soundSrc.system.systemEquipmentDowngrade)
          this.enimationFrame = 60
          // 저장 요청
          SaveSystem.requestSave()
        }
        else game.sound.play(soundSrc.system.systemBuzzer)
        break
    }
  }

  displayContent () {
    // display equipment option
    // if equippend
    const equipment = userSystem.getInventoryEquipmentValues(this.targetInventoryIndex)
    if (equipment == null) return

    // icon display
    const itemData = dataExportStatItem.get(equipment.id)
    if (itemData == null) return

    const src = imageSrc.system.itemIcon
    const iconSize = imageDataInfo.system.itemIcon.width
    const iconSectionSize = imageDataInfo.system.itemIconSection.width
    const sliceX = iconSectionSize * (itemData.iconNumber % 10)
    const sliceY = iconSectionSize * Math.floor(itemData.iconNumber / 10)
    game.graphic.imageDisplay(src, sliceX, sliceY, iconSize, iconSize, this.x + this.width - 80, this.y + 50, iconSize, iconSize)

    if (this.targetInventoryIndex === userSystem.equipmentIndex) {
      const mainSrc = imageSrc.system.mainSystem
      const equipImgD = imageDataInfo.mainSystem.inventoryEquipment
      gameFunction.imageObjectDisplay(mainSrc, equipImgD, this.x + this.width - 80, this.y + 50, iconSize, iconSize)
    }

    // 이것은, 텍스트를 깜빡거리기 위한 효과를 위해 처리한 코드입니다.
    // 업그레이드, 다운 그레이드에 성공하면 3프레임에 1번씩 깜빡거립니다.
    if (this.enimationFrame % 6 === 5) return

    // text display
    const levelText = 'LEVEL: ' + equipment.upgradeLevel
    const attackText = 'ATTACK: ' + equipment.attack + ' -> ' + equipment.nextAttack
    const upgradeCostText = 'UPGRADE COST: ' + equipment.cost
    const downgradeRefundText = 'DOWNGRADE REFUND: ' + equipment.downRefund
    const goldText = 'GOLD: ' + userSystem.gold
    const textList = [
      levelText, attackText, '---', upgradeCostText, downgradeRefundText, goldText
    ]

    game.graphic.fillText('NAME: ' + equipment.name, this.x + 10, this.y + 50)
    for (let i = 0; i < textList.length; i++) {
      digitalDisplay(textList[i], this.x + 10, this.y + 50 + 20 + (i * 20))
    }
  }
}

class UIComponentItemCrafting extends UIComponentObject {
  constructor () {
    super()
    this.backgroundColor = ['#3c95da', '#6ebffd']
    this.MENU_BOX_MAX = 6
    this.setPosition(UIComponentObject.BASE_X + 50, UIComponentObject.BASE_Y + 40)
    this.setWidthHeight(UIComponentObject.BASE_WIDTH - 50, UIComponentObject.BASE_HEIGHT - 40)
    this.titleImageObject = imageDataInfo.menuList.itemCrafting

    this.createGridVerticalBox(5, this.x, this.y + 50, 400, 50)
    this.setAllBoxColor(BoxObject.DEFAULT_BOX_COLOR, '', '#aaf9ff')

    this.createPage(1)

    /** @type {number[][]} */
    this.INDEXSLIST = [
      [ID.playerWeapon.r3Helljeon, ID.item.hellgiComponent, 15],
      [ID.playerWeapon.r3TowerPink, ID.item.hellgiComponent, 20],
      [ID.playerWeapon.r3TowerPurple, ID.item.hellgiComponent, 20],
      [ID.playerSkill.r3Helljeon, ID.item.hellgiComponent, 40],
      [ID.playerSkill.r3Xkill, ID.item.hellgiComponent, 60],
      [ID.playerSkill.r3Xshot, ID.item.hellgiComponent, 60],
      [ID.playerSkill.r3Xboom, ID.item.hellgiComponent, 60],
      [ID.playerSkill.r3Xbeam, ID.item.hellgiComponent, 60],
    ]

    /** INDEXLIST 기준, 해당 요소가 lock인지 unlock인지를 캐시하는 데이터
     * 아이템을 만들거나 창을 열 때마다 unlockArray는 재갱신함
     * @type {boolean[]} */
    this.unlockArray = new Array(this.INDEXSLIST.length).fill(false)
  }

  /**
   * 자동으로 배열의 unlock 상태를 변경합니다.
   * 주의: userSystem의 세이브 데이터가 로드된 이후 실행해야 합니다.
   */
  #autoChangeUnlockArray () {
    for (let i = 0; i < this.INDEXSLIST.length; i++) {
      const currentId = this.INDEXSLIST[i][0]
      const type = ID.getType(currentId)
      if (type === ID.type.PLAYER_WEAPON) {
        this.unlockArray[i] = userSystem.getWeaponUnlock(currentId)
      } else if (type === ID.type.PLAYER_SKILL) {
        this.unlockArray[i] = userSystem.getSkillUnlock(currentId)
      }
    }
  }

  open () {
    super.open()
    this.#autoChangeUnlockArray()
  }

  /** 재료 확인 */
  meterialCheck () {
    const currentIndex = this.getCurrentIndex()
    if (currentIndex >= this.INDEXSLIST.length) return false

    const current = this.INDEXSLIST[currentIndex]

    for (let j = 1; j < current.length; j += 2) {
      const meterialId = current[j]
      const cost = current[j + 1]
      const itemCount = userSystem.inventory.getItemCountById(meterialId)

      // 재료가 1개라도 부족하다면, 재료 확인 실패로 처리
      if (itemCount < cost) return false
    }

    return true
  }

  processButtonSelect () {
    const currentIndex = this.getCurrentIndex()
    if (currentIndex >= this.INDEXSLIST.length) {
      game.sound.play(soundSrc.system.systemBuzzer)
      return 
    }

    if (!this.unlockArray[currentIndex]) {
      const currentId = this.INDEXSLIST[currentIndex][0]
      const type = ID.getType(currentId)

      // 조건을 살펴봄
      const isMeterial = this.meterialCheck()

      // 재료가 없으면 선택을 무효로 함
      if (!isMeterial) {
        game.sound.play(soundSrc.system.systemBuzzer)
        return 
      }

      if (type === ID.type.PLAYER_WEAPON) {
        userSystem.addWeaponUnlock(currentId)
      } else if (type === ID.type.PLAYER_SKILL) {
        userSystem.addSkillUnlock(currentId)
      }

      // 언락을 한 후, 다시 갱신
      this.#autoChangeUnlockArray()
      game.sound.play(soundSrc.system.systemItemCrafting)
    }
  }

  displayContent () {
    this.displayItemResult()
    this.displayItemMeterial()
  }

  displayItemResult () {
    const startIndex = this.getStartIndex()
    for (let i = 0; i < this.boxList.length; i++) {
      const currentIndex = i + startIndex
      if (currentIndex >= this.INDEXSLIST.length) continue

      const resultId = this.INDEXSLIST[currentIndex][0]
      const type = ID.getType(resultId)
      const isUnlock = this.unlockArray[currentIndex]
      let iconNumber = 0
      switch (type) {
        case ID.type.PLAYER_SKILL:
          iconNumber = StatPlayerWeapon.getSkillIconNumber(resultId)
          UIIconDisplay.displayIconSkill(iconNumber, this.boxList[i].x, this.boxList[i].y)
          break
        case ID.type.PLAYER_WEAPON:
          iconNumber = StatPlayerWeapon.getWeaponIconNumber(resultId)
          UIIconDisplay.displayIconWeapon(iconNumber, this.boxList[i].x, this.boxList[i].y)
          break
        case ID.type.ITEM:
          const targetItem = dataExportStatItem.get(resultId)
          if (targetItem == null) continue

          iconNumber = targetItem.iconNumber
          UIIconDisplay.displayIconItem(iconNumber, this.boxList[i].x, this.boxList[i].y)
          break
      }

      if (isUnlock) {
        gameFunction.imageObjectDisplay(imageSrc.system.mainSystem, imageDataInfo.mainSystem.craftingCheck, this.boxList[i].x, this.boxList[i].y)
      }
    }
  }

  displayItemMeterial () {
    const startIndex = this.getStartIndex()
    for (let i = 0; i < this.boxList.length; i++) {
      // 참고: 재료는 배열 1번부터 시작하여, 2칸씩 늘어나 조사하는 형태입니다.
      for (let j = 1; j < this.INDEXSLIST[i].length; j += 2) {
        const currentIndex = i + startIndex
        if (currentIndex >= this.INDEXSLIST.length) continue

        const targetId = this.INDEXSLIST[currentIndex][j + 0]
        const count = this.INDEXSLIST[currentIndex][j + 1]
        const subIndex = Math.floor((j - 1) / 2) + 1

        const targetItem = dataExportStatItem.get(targetId)
        if (targetItem == null) continue

        const positionX = this.boxList[i].x + 50 + (subIndex * 50)
        const positionY = this.boxList[i].y + this.boxList[i].height - 20
        UIIconDisplay.displayIconItem(targetItem.iconNumber, positionX, this.boxList[i].y)
        digitalDisplay(count, positionX + 20, positionY)
      }
    }
  }
}

class UIComponentBoseokGrowth extends UIComponentObject {
  constructor () {
    super()
    this.backgroundColor = ['#ceb0df', '#b179d1']
    this.MENU_BOX_MAX = 2
    this.setPosition(UIComponentObject.BASE_X + 50, UIComponentObject.BASE_Y + 50)
    this.setWidthHeight(UIComponentObject.BASE_WIDTH - 50, UIComponentObject.BASE_HEIGHT - 100)
    this.titleImageObject = imageDataInfo.menuList.boseokGrowth
  }
}



class UIComponentRoundSelect extends UIComponentObject {
  constructor () {
    super()
    this.backgroundColor = ['#757F9A', '#D7DDE8']
    /** 메인 라운드 박스의 최대 개수 */ this.MAIN_ROUND_BOX_MAX = 4
    /** 서브 라운드 박스의 최대 개수 */ this.SUB_ROUND_BOX_MAX = 20
    /** 서브 라운드가 1열에 들어갈 수 있는 개수 */ this.SUB_ROUND_COLUMN_COUNT = 5
    this.LAYER_NUMBER_MAIN = 0 
    this.LAYER_NUMBER_SUB = 1

    this.setPosition(UIComponentObject.BASE_X - 25, UIComponentObject.BASE_Y - 50)
    this.setWidthHeight(UIComponentObject.BASE_WIDTH + 25, UIComponentObject.BASE_HEIGHT + 100)

    this.titleImageObject = imageDataInfo.menuList.roundSelect

    this.selectMainRound = 0

    /** 라운드의 개수 */
    this.roundCount = [0, 6, 6, 12]

    let r = ID.round
    this.roundSelectGridTable = StatRound.world.roundSelectGridTable

    /** 메인 라운드의 박스 */
    this.mainRoundBox = []

    /** 서브 라운드의 박스 */
    this.subRoundBox = []

    const ICON_WIDTH = 60
    const LAYER_WIDTH_HEIGHT = 80
    const LAYER_MAIN_X = this.x + 10
    const LAYER_MAIN_Y = this.y + 50 + 10
    const LAYER_SUB_X = this.x + 110
    const LAYER_SUB_Y = this.y + 50 + 10

    for (let i = 0; i < this.MAIN_ROUND_BOX_MAX; i++) {
      let box = new BoxObject(LAYER_MAIN_X, LAYER_MAIN_Y + (LAYER_WIDTH_HEIGHT * i), LAYER_WIDTH_HEIGHT, LAYER_WIDTH_HEIGHT, ''+i)
      this.mainRoundBox.push(box)
    }

    for (let i = 0; i < this.SUB_ROUND_BOX_MAX; i++) {
      let x = LAYER_SUB_X + (LAYER_WIDTH_HEIGHT * (i % 5))
      let y = LAYER_SUB_Y + (LAYER_WIDTH_HEIGHT * Math.floor(i / 5))
      let box = new BoxObject(x, y, LAYER_WIDTH_HEIGHT, LAYER_WIDTH_HEIGHT)
      this.subRoundBox.push(box)
    }
  }

  processButton () {
    super.processButton()
    let button = this.getButtonObject()

    if (button.buttonLeft) {
      if (this.cursor.layerNumber === this.LAYER_NUMBER_SUB) {
        const positionX = this.cursor.subRound % this.SUB_ROUND_COLUMN_COUNT
        if (positionX === 0) {
          this.changeCursor(undefined, undefined, this.LAYER_NUMBER_MAIN)
        } else {
          this.changeCursor(undefined, this.cursor.subRound - 1, undefined)
        }
      }
    } else if (button.buttonRight) {
      if (this.cursor.layerNumber === this.LAYER_NUMBER_MAIN) {
        this.changeCursor(undefined, undefined, this.LAYER_NUMBER_SUB)
      } else if (this.cursor.layerNumber === this.LAYER_NUMBER_SUB) {
        this.changeCursor(undefined, this.cursor.subRound + 1, undefined)
      }
    } else if (button.buttonUp) {
      if (this.cursor.layerNumber === this.LAYER_NUMBER_MAIN) {
        this.changeCursor(this.cursor.mainRound - 1, undefined, undefined)
      } else if (this.cursor.layerNumber === this.LAYER_NUMBER_SUB) {
        this.changeCursor(undefined, this.cursor.subRound - this.SUB_ROUND_COLUMN_COUNT, undefined)
      }
    } else if (button.buttonDown) {
      if (this.cursor.layerNumber === this.LAYER_NUMBER_MAIN) {
        this.changeCursor(this.cursor.mainRound + 1, undefined, undefined)
      } else if (this.cursor.layerNumber === this.LAYER_NUMBER_SUB) {
        this.changeCursor(undefined, this.cursor.subRound + this.SUB_ROUND_COLUMN_COUNT, undefined)
      }
    }
  }

  processButtonSelect () {
    super.processButtonSelect()
    if (this.cursor.layerNumber === this.LAYER_NUMBER_MAIN) {
      this.selectMainRound = this.cursor.mainRound
    } else if (this.cursor.layerNumber === this.LAYER_NUMBER_SUB) {
      this.roundStart()
    }
  }

  processContent () {
    this.processMousePositionCalcurate()
  }

  /** 현재 커서가 있는 위치를 기준으로 라운드 시작을 합니다. */
  roundStart () {
    const roundId = this.getCurrentCursorRoundId()
    let roundData = dataExportStatRound.get(roundId) // 라운드 데이터를 가져옴

    if (roundData == null) return
    if (UserSystem.lv < roundData.requireLevel) {
      game.sound.play(soundSrc.system.systemBuzzer)
      return
    }

    FieldSystem.roundStart(roundId)
    if (FieldSystem.message === FieldSystem.messageList.STATE_FIELD) {
      game.sound.play(soundSrc.system.systemEnter)
      GameSystem.stateId = GameSystem.STATE_FIELD

      // START버튼이 필드에서도 연속으로 눌려지는 행위를 막기 위해 이 순간에는 버튼 입력을 리셋시킴
      game.control.resetButtonInput()
      this.close() // 라운드 선택이 시작되고 게임이 시작하면 창을 닫음
    }
  }


  /** 메뉴 선택 커서의 위치를 변경합니다. */
  changeCursor (mainRound = this.cursor.mainRound, subRound = this.cursor.subRound, layerNumber = this.cursor.layerNumber) {
    if (this.cursor.mainRound === mainRound && this.cursor.subRound === subRound && this.cursor.layerNumber === layerNumber) return

    // 전달받은 커서의 값이 잘못되면 취소함
    if (mainRound < 0) return
    if (mainRound > this.MAIN_ROUND_BOX_MAX - 1) return
    if (subRound < 0) return
    if (subRound > this.SUB_ROUND_BOX_MAX - 1) return

    // 커서가 변경되면 사운드 재생
    game.sound.play(soundSrc.system.systemCursor)
    this.cursor.mainRound = mainRound
    this.cursor.subRound = subRound
    this.cursor.layerNumber = layerNumber
  }

  processMouse () {
    super.processMouse()

    // 마우스 클릭 시 서브 라운드 커서 상태면 커서가 서브 라운드 내부에 있는지 확인하고, 맞게 있으면 라운드 시작
    // 이렇게 하는 이유는, 다른 공간을 클릭했는데 라운드를 시작하는 현상이 있었기 때문
    // 서브 박스 충돌을 기준으로 라운드가 시작되므로, 서브 박스 충돌 알고리즘을 작성해야 합니다.
    if (game.control.getMouseClick() && this.cursor.layerNumber === this.LAYER_NUMBER_SUB) {
      const mouseX = game.control.getMouseX()
      const mouseY = game.control.getMouseY()
      for (let i = 0; i < this.subRoundBox.length; i++) {
        if (this.subRoundBox[i].collision(mouseX, mouseY))
        this.roundStart()
      }
    }
  }

  /**
   * 마우스 위치에 따른 커서 값을 재수정
   */
  processMousePositionCalcurate () {
    if(!game.control.isMouseMove) return

    let mouseX = game.control.getMouseX()
    let mouseY = game.control.getMouseY()

    for (let i = 0; i < this.MAIN_ROUND_BOX_MAX; i++) {
      if (this.mainRoundBox[i].collision(mouseX, mouseY)) {
        this.changeCursor(i, undefined, this.LAYER_NUMBER_MAIN)
        break
      }
    }

    for (let i = 0; i < this.SUB_ROUND_BOX_MAX; i++) {
      if (this.subRoundBox[i].collision(mouseX, mouseY)) {
        this.changeCursor(undefined, i, this.LAYER_NUMBER_SUB)
        break
      }
    }
  }

  /** 커서가 있는 부분을 활성화 합니다. */
  displayFocus () {
    for (let i = 0; i < this.MAIN_ROUND_BOX_MAX; i++) {
      this.mainRoundBox[i].display()

      // 커서로 선택된 부분은 foucs로 활성화 됩니다.
      if (this.cursor.layerNumber === 0) {
        this.mainRoundBox[i].focusColor = BoxObject.DEFAULT_FOCUS_COLOR
        this.mainRoundBox[i].focus = this.cursor.mainRound === i ? true : false
      } else {
        this.mainRoundBox[i].focusColor = BoxObject.FOCUS_COLOR_WAIT_CURSOR
        this.mainRoundBox[i].focus = this.cursor.mainRound === i ? true : false
      }
    }

    for (let i = 0; i < this.SUB_ROUND_BOX_MAX; i++) {
      this.subRoundBox[i].display()

      // 커서로 선택된 부분은 foucs로 활성화 됩니다.
      if (this.cursor.layerNumber === 1) {
        this.subRoundBox[i].focus = this.cursor.subRound === i ? true : false
      } else {
        this.subRoundBox[i].focus = false
      }
    }
  }

  getRoundIdTable () {
    if (this.cursor.mainRound < this.roundSelectGridTable.length) {
      return this.roundSelectGridTable[this.cursor.mainRound]
    } else {
      return null
    }
  }

  /** 현재 커서에 맞는 id를 가져옵니다. 단 메인라운드가 선택중일 때는 가져오지 않음 */
  getCurrentCursorRoundId () {
    let idTable = this.getRoundIdTable()
    if (idTable == null) return 0
    if (this.cursor.layerNumber === this.LAYER_NUMBER_MAIN) return 0

    return idTable[this.cursor.subRound]
  }

  displayRoundIcon () {
    let roundIdTable = this.getRoundIdTable()
    if (roundIdTable == null) return

    const iconWidth = imageDataInfo.default.roundIcon.width
    const ICON_COLUMN_COUNT = 10
    for (let i = 0; i < roundIdTable.length; i++) {
      let roundData = dataExportStatRound.get(roundIdTable[i])
      if (roundData == null) continue

      const iconPositionX = roundData.iconNumber % ICON_COLUMN_COUNT
      const iconPositionY = Math.floor(roundData.iconNumber / ICON_COLUMN_COUNT)
      const outputX = this.subRoundBox[i].x + (this.subRoundBox[i].width - iconWidth) / 2
      const outputY = this.subRoundBox[i].y
      const outputDigitalY = this.subRoundBox[i].y + this.subRoundBox[i].height - 20

      game.graphic.imageDisplay(imageSrc.system.roundIcon, iconPositionX * iconWidth, iconPositionY * iconWidth, iconWidth, iconWidth, outputX, outputY, iconWidth, iconWidth)
      digitalDisplay(roundData.roundText, outputX, outputDigitalY)

      if (UserSystem.lv < roundData.requireLevel) {
        gameFunction.imageObjectDisplay(imageSrc.system.mainSystem, imageDataInfo.mainSystem.roundConditionLevelAttackReject, outputX, outputY)
      }
      
    }
  }

  displayRoundText () {
    let roundIdTable = this.getRoundIdTable()
    if (roundIdTable == null) return

    let roundData = dataExportStatRound.get(roundIdTable[this.cursor.subRound])
    if (roundData == null) return

    let text3 = '' + roundData.roundName
    let text1 = 'ROUND: ' + roundData.roundText + ', TIME: ' + roundData.finishTime
    let text2 = 'REQ LV: ' + roundData.requireLevel + ', ATTACK: ' + roundData.requireAttack
    const outputX = this.x + 20
    const outputY1 = this.y + this.height - 60
    const outputY2 = this.y + this.height - 40
    const outputY3 = this.y + this.height - 20
    game.graphic.fillText(text3, outputX, outputY1)
    digitalDisplay(text1, outputX, outputY2)
    digitalDisplay(text2, outputX, outputY3)
  }

  displayMainRoundIcon () {
    for (let i = 0; i < this.mainRoundBox.length; i++) {
      const iconNumber = StatRound.world.iconList[i + 1]
      const ICON_COLUMN_COUNT = 10
      const iconWidth = imageDataInfo.default.roundIcon.width
      if (iconNumber == null || iconNumber < 0) continue
      
      const iconPositionX = iconNumber % ICON_COLUMN_COUNT
      const iconPositionY = Math.floor(iconNumber / ICON_COLUMN_COUNT)
      const outputX = this.mainRoundBox[i].x + (this.mainRoundBox[i].width - iconWidth) / 2
      const outputY = this.mainRoundBox[i].y
      const outputDigitalY = this.mainRoundBox[i].y + this.mainRoundBox[i].height - 20

      const roundNumber = (i + 1)
      game.graphic.imageDisplay(imageSrc.system.roundIcon, iconPositionX * iconWidth, iconPositionY * iconWidth, iconWidth, iconWidth, outputX, outputY, iconWidth, iconWidth)
      digitalDisplay('R: ' + roundNumber, outputX, outputDigitalY)
    }
  }

  displayMainRoundInfo () {
    if (this.cursor.mainRound >= this.roundSelectGridTable.length) {
      return
    }

    const levelmin = StatRound.world.requireLevelMinList
    const levelmax = StatRound.world.requireLevelMaxList
    const number = this.cursor.mainRound + 1
    const attackMin = StatRound.world.requireAttackMinList
    const attackMax = StatRound.world.requireAttackMaxList

    const levelRangeText = levelmin[number] + ' ~ ' + levelmax[number]
    const attackRangeText = attackMin[number] + ' ~ ' + attackMax[number]
    let text1 = 'ROUND: ' + number
    let text2 = 'LV: ' + levelRangeText + ', ATTACK: ' + attackRangeText

    const outputX = this.x + 20
    const outputY1 = this.y + this.height - 60
    const outputY2 = this.y + this.height - 40
    digitalDisplay(text1, outputX, outputY1)
    digitalDisplay(text2, outputX, outputY2)
  }

  displayContent () {
    this.displayFocus()
    this.displayMainRoundIcon()
    this.displayRoundIcon()
    
    if (this.cursor.layerNumber === this.LAYER_NUMBER_MAIN) {
      this.displayMainRoundInfo()
    } else {
      this.displayRoundText()
    }
  }
}

/** 스킬과, 무기의 UI 알고리즘이 대부분 동일하기 때문에 만들어진 클래스 */
class UIComponentWeaponSkillGridObject extends UIComponentObject {
  constructor () {
    super()
    this.setPosition(UIComponentObject.BASE_X - 40, this.y - 70)
    this.setWidthHeight(UIComponentObject.BASE_WIDTH + 80, UIComponentObject.BASE_HEIGHT + 140)
    this.COLUMN_COUNT = 7

    /** 해당 목록에서 사용할 타겟(무기 또는 스킬)의 id List */
    this.weaponIdList = Array.from(dataExportStatPlayerWeapon.keys())

    /** 해당 목록에서 사용할 (무기 또는 스킬)의 id List */
    this.skillIdList = Array.from(dataExportStatPlayerSkill.keys())

    this.LAYER_WEAPON = 0
    this.LAYER_PRESET = 1
    this.LAYER_USER_SELECT = 2

    /** 커서 사운드가 켜져있는지 여부 */
    this.isCursorSound = true

    const MAX_PRESET = UserSystem.PRESET_MAX_COUNT
    this.presetBox = []
    let presetImageDataList = [
      imageDataInfo.mainSystem.uiWeaponSelectPreset1,
      imageDataInfo.mainSystem.uiWeaponSelectPreset2,
      imageDataInfo.mainSystem.uiWeaponSelectPreset3,
      imageDataInfo.mainSystem.uiWeaponSelectPreset4,
      imageDataInfo.mainSystem.uiWeaponSelectPreset5,
    ]

    for (let i = 0; i < MAX_PRESET; i++) {
      let presetSrc = imageSrc.system.mainSystem
      const presetWidth = imageDataInfo.mainSystem.uiWeaponSelectPreset1.width
      // 참고로 page 아이콘은 title 0번부터 배치되기 때문에, x의 위치는 page아이콘 다음 부분에 배치됩니다.
      // 그리고 page 아이콘은 preset 아이콘과 크기가 동일합니다.
      const positionX = this.x + this.titleImageObject.width + (presetWidth * i) + (presetWidth * 3)
      let box = new BoxImageObject(positionX, this.y, undefined, undefined, '', presetSrc, presetImageDataList[i])
      this.presetBox.push(box)
    }
  }

  displayContent () {
    for (let i = 0; i < this.presetBox.length; i++) {
      this.presetBox[i].display()
    }
  }

  /** 커서 사운드를 끕니다. 소리가 다른 효과음과 겹칠 경우 이 커서 사운드를 켜고 끄는 것으로 대응합니다. */
  cursorSoundMute () {
    this.isCursorSound = false
  }

  /** 커서 사운드를 켭니다. */
  cursorSoundUnMute () {
    this.isCursorSound = true
  }
}

class UIComponentWeaponSelect extends UIComponentWeaponSkillGridObject {
  constructor () {
    super()
    this.titleImageObject = imageDataInfo.menuList.weaponSelect
    this.backgroundColor = ['#B993D6', '#8CA6DB']

    /** 해당 목록에서 사용할 타겟(무기 또는 스킬)의 id List */
    this.weaponIdList = Array.from(dataExportStatPlayerWeapon.keys())
    
    const weaponWidth = imageDataInfo.default.weaponIcon.width
    const weaponHeight = imageDataInfo.default.weaponIcon.height

    const LAYER_Y_USER_WEAPON = this.y + 70
    const LAYER_Y_WEAPON_LIST = this.y + 140

    this.createGrid2DBox(
      this.COLUMN_COUNT,
      this.COLUMN_COUNT,
      this.x,
      LAYER_Y_WEAPON_LIST,
      weaponWidth,
      weaponHeight
    )

    const userWeaponWidth = weaponWidth + 20
    this.userSelectBox = []
    for (let i = 0; i < 4; i++) {
      let box = new BoxObject(this.x + (userWeaponWidth * i), LAYER_Y_USER_WEAPON, userWeaponWidth, weaponHeight, 'user' + i, BoxObject.DEFAULT_BOX_COLOR)
      this.userSelectBox.push(box)
    }

    this.createPage(1)
  }

  changeWeaponPreset () {
    // 유저가 이미 사용중인 무기 프리셋의 값이 다를 때만 프리셋을 변경함
    if (this.cursor.layerNumber === this.LAYER_PRESET && this.cursor.preset !== UserSystem.weaponPresetNumber) {
      UserSystem.changePresetWeapon(this.cursor.preset)
      game.sound.play(soundSrc.system.systemSelect)
      this.#changeFocus()
    }
  }

  changeWeapon () {
    const currentWeaponIndex = this.getCurrentIndex()

    // 참고: 무기 리스트 중 0 번은 비어있는 무기를 뜻하지만, 지금은 그 기능을 사용할 수 없도록 막았습니다.
    if (this.cursor.layerNumber === this.LAYER_WEAPON && currentWeaponIndex !== 0) {
      // 유효한 인덱스가 아니면 취소시킴 (무기 아이디 리스트 만큼이 유효한 인덱스임)
      if (currentWeaponIndex >= this.weaponIdList.length) {
        game.sound.play(soundSrc.system.systemBuzzer)
        return
      }

      let success = UserSystem.setWeapon(this.cursor.userSelect, this.weaponIdList[currentWeaponIndex])
      game.sound.play(success ? soundSrc.system.systemSkillSelect : soundSrc.system.systemBuzzer)

      if (success) {
        // 참고: 무기를 변경했다면 유저 선택 부분의 커서가 +1칸이 되고, 
        // +1칸이 되었을 때 정해진 칸수를 초과 (배열 length 이상) 다시 0칸으로 이동합니다.
        const nextNumber = this.cursor.userSelect + 1 < this.userSelectBox.length ? this.cursor.userSelect + 1 : 0

        // 그리고, 임시적으로 커서 사운드를 껐다가 켭니다.
        // 소리가 다른 효과음과 겹쳤기 때문입니다.
        this.cursorSoundMute()
        this.changeCursorCustom(this.LAYER_USER_SELECT, nextNumber)
        this.changeCursorCustom(this.LAYER_WEAPON, this.cursor.index)
        this.#changeFocus()
        this.cursorSoundUnMute()

        // 저장 요청
        SaveSystem.requestSave()
      }
    }
  }

  processButtonMoveCursor () {
    let button = this.getButtonObject()
    
    // 이동한 거리를 상대좌표로 표현
    let moveX = 0
    let moveY = 0
    
    // 이동 방향에 따라 좌표 변경
    if (button.buttonLeft) moveX = -1
    else if (button.buttonRight) moveX = 1
    else if (button.buttonUp) moveY = -1
    else if (button.buttonDown) moveY = 1

    // 이동하지 않은 경우 방향키 이동 취소
    if (moveX === 0 && moveY === 0) return

    if (this.cursor.layerNumber === this.LAYER_PRESET) {
      this.#movePresetCursor(moveX, moveY)
    } else if (this.cursor.layerNumber === this.LAYER_USER_SELECT) {
      this.#moveUserSelectCursor(moveX, moveY)
    } else if (this.cursor.layerNumber === this.LAYER_WEAPON) {
      this.#moveWeaponCursor(moveX, moveY)
    }
  }

  processButtonSelect () {
    if (this.cursor.layerNumber === this.LAYER_PRESET) {
      this.changeWeaponPreset()
    } else if (this.cursor.layerNumber === this.LAYER_WEAPON) {
      this.changeWeapon()
    }
  }

  #movePresetCursor (moveX = 0, moveY = 0) {
    if (moveX !== 0) {
      this.changeCursorCustom(this.LAYER_PRESET, this.cursor.preset + moveX)
    } else if (moveY > 0) {
      this.changeCursorCustom(this.LAYER_USER_SELECT, this.cursor.userSelect)
    }
  }

  #moveUserSelectCursor (moveX = 0, moveY = 0) {
    if (moveX !== 0) {
      this.changeCursorCustom(this.LAYER_USER_SELECT, this.cursor.userSelect + moveX)
    } else if (moveY < 0) {
      this.changeCursorCustom(this.LAYER_PRESET, this.cursor.preset)
    } else if (moveY > 0) {
      this.changeCursorCustom(this.LAYER_WEAPON, this.cursor.index)
    }
  }

  #moveWeaponCursor (moveX = 0, moveY = 0) {
    if (moveX === -1) { // 왼쪽 이동
      if (this.cursor.index % this.COLUMN_COUNT === 0 && this.page > 0) {
        // 페이지가 이전 구간으로 이동하고, X축은 끝으로 가야하는데, X축 끝이 COLUMN - 1 이므로 해당 위치로 이동
        this.page--
        this.changeCursorCustom(this.LAYER_WEAPON, this.cursor.index + this.COLUMN_COUNT - 1)
      } else if (this.cursor.index % this.COLUMN_COUNT !== 0) {
        this.changeCursorCustom(this.LAYER_WEAPON, this.cursor.index + moveX)
      }
    } else if (moveX === 1) { // 오른쪽 이동
      if (this.cursor.index % this.COLUMN_COUNT === this.COLUMN_COUNT - 1 && this.page < this.maxPage) {
        this.page++
        this.changeCursorCustom(this.LAYER_WEAPON, this.cursor.index - this.COLUMN_COUNT + 1)
      } else if (this.cursor.index % this.COLUMN_COUNT !== this.COLUMN_COUNT - 1) {
        this.changeCursorCustom(this.LAYER_WEAPON, this.cursor.index + moveX)
      }
    } else if (moveY < 0) {
      if (this.cursor.index < this.COLUMN_COUNT) {
        this.changeCursorCustom(this.LAYER_USER_SELECT, this.cursor.userSelect)
      } else {
        this.changeCursorCustom(this.LAYER_WEAPON, this.cursor.index - this.COLUMN_COUNT)
      }
    } else if (moveY > 0) {
      this.changeCursorCustom(this.LAYER_WEAPON, this.cursor.index + this.COLUMN_COUNT)
    }
  }

  processMouse () {
    super.processMouse()

    if (game.control.isMouseMove && this.throttleCheck()) {
      const mouseX = game.control.getMouseX() 
      const mouseY = game.control.getMouseY()

      for (let i = 0; i < this.presetBox.length; i++) {
        if (this.presetBox[i].collision(mouseX, mouseY)) {
          // change preset
          this.changeCursorCustom(this.LAYER_PRESET, i)
        }
      }

      for (let i = 0; i < this.boxList.length; i++) {
        if (this.boxList[i].collision(mouseX, mouseY)) {
          // change weapon cursor
          this.changeCursorCustom(this.LAYER_WEAPON, i)
        }
      }

      for (let i = 0; i < this.userSelectBox.length; i++) {
        if (this.userSelectBox[i].collision(mouseX, mouseY)) {
          // cursor move user weapon box
          this.changeCursorCustom(this.LAYER_USER_SELECT, i)
        }
      }
    }

    if (game.control.getMouseClick()) {
      const mouseX = game.control.getMouseX() 
      const mouseY = game.control.getMouseY()

      for (let i = 0; i < this.presetBox.length; i++) {
        if (this.presetBox[i].collision(mouseX, mouseY)) {
          this.changeWeaponPreset()
        }
      }
    }
  }

  open () {
    super.open()
    this.#changeFocus() // 포커스 재설정을 open할 때 시도해야 함
  }

  /**
   * 커서의 위치를 변경합니다.
   * @param {number} layerNumber 레이어 번호 (상수값으로 사용)
   * @param {number} movePosition 이동할 위치 (좌표를 입력하는것이 아니라 순서 번호입니다.)
   */
  changeCursorCustom (layerNumber, movePosition) {
    const CONL1 = layerNumber === this.LAYER_PRESET
    const CONL2 = layerNumber === this.LAYER_WEAPON
    const CONL3 = layerNumber === this.LAYER_USER_SELECT

    let con1 = layerNumber === this.cursor.layerNumber
    let con2 = CONL1 && this.cursor.preset === movePosition
    let con3 = CONL2 && this.cursor.index === movePosition
    let con4 = CONL3 && this.cursor.userSelect === movePosition

    // 조건: layerNumber가 같고, movePosition이 같은 경우 early return
    if (con1 && (con2 || con3 || con4)) return

    // 조건, layerNumber 가 userWeapon이고, 입력된 값 범위가 제한된 값인지 확인
    let con6 = CONL3 && (movePosition < 0 || movePosition >= this.userSelectBox.length)

    // 조건, preset 아까랑 마찬가지로 범위 조건 확인
    let con7 = CONL1 && (movePosition < 0 || movePosition >= this.presetBox.length)
    if (con6 || con7) return

    this.cursor.layerNumber = layerNumber
    if (layerNumber === this.LAYER_USER_SELECT) {
      this.cursor.userSelect = movePosition
    } else if (layerNumber === this.LAYER_WEAPON) {
      this.cursor.index = movePosition
    } else if (layerNumber === this.LAYER_PRESET) {
      this.cursor.preset = movePosition
    }

    this.#changeFocus()
    if (this.isCursorSound) {
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  /** 포커스 변경, changeCursor를 사용한 경우에만 동작함 */
  #changeFocus () {
    for (let i = 0; i < this.presetBox.length; i++) {
      this.presetBox[i].focus = false

      if (this.cursor.layerNumber === this.LAYER_PRESET) {
        if (i === this.cursor.preset) {
          this.presetBox[i].focus = true
          this.presetBox[i].focusColor = BoxObject.DEFAULT_FOCUS_COLOR
        } else if (i === UserSystem.weaponPresetNumber) {
          // 이미 선택되어 있는 프리셋은 다른 커서에 있어도 항상 포커스는 대기 색으로 부여합니다.
          this.presetBox[i].focus = true
          this.presetBox[i].focusColor = BoxObject.FOCUS_COLOR_WAIT_CURSOR
        }
      } else {
        // 이미 선택되어있는 프리셋은, 다른 레이어에 있을 때 항상 대기 색으로 부여합니다.
        if (i === UserSystem.weaponPresetNumber) {
          this.presetBox[i].focus = true
          this.presetBox[i].focusColor = BoxObject.FOCUS_COLOR_WAIT_CURSOR
        }
      }
    }

    for (let i = 0; i < this.userSelectBox.length; i++) {
      this.userSelectBox[i].focus = false

      if (this.cursor.userSelect === i) {
        this.userSelectBox[i].focus = true

        if (this.cursor.layerNumber === this.LAYER_USER_SELECT) {
          this.userSelectBox[i].focusColor = BoxObject.DEFAULT_FOCUS_COLOR
        } else {
          // 레이어가 다르면, 해당 커서가 선택 대기중으로 간주되고, 이에 따라 커서에 닿았을 때랑 다른 색을 적용함
          this.userSelectBox[i].focusColor = BoxObject.FOCUS_COLOR_WAIT_CURSOR
        }
      }
    }

    for (let i = 0; i < this.boxList.length; i++) {
      this.boxList[i].focus = false

      if (this.cursor.layerNumber === this.LAYER_WEAPON && this.cursor.index === i) {
        this.boxList[i].focus = true
      }
    }
  }

  getCurrentWeaponId () {
    
  }

  getPlayerWeaponIconNumber (weaponId = 0) {
    return StatPlayerWeapon.getWeaponIconNumber(weaponId)
  }

  displayWeaponIcon () {
    const startIndex = this.getStartIndex()
    for (let i = 0; i < this.boxList.length; i++) {
      const currentIndex = startIndex + i
      if (currentIndex >= this.weaponIdList.length) continue

      const iconNumber = this.getPlayerWeaponIconNumber(this.weaponIdList[currentIndex])
      UIIconDisplay.displayIconWeapon(
        iconNumber,
        this.boxList[i].x,
        this.boxList[i].y
      )
    }
  }

  displayUserWeaponIcon () {
    let iconList = UserSystem.getWeaponList()
    for (let i = 0; i < this.userSelectBox.length; i++) {
      const iconNumber = this.getPlayerWeaponIconNumber(iconList[i])

      UIIconDisplay.displayIconWeapon(
        iconNumber,
        this.userSelectBox[i].x,
        this.userSelectBox[i].y
      )
    }
  }

  displayContent () {
    super.displayContent()
    for (let i = 0; i < this.userSelectBox.length; i++) {
      this.userSelectBox[i].display()
    }

    // user weapon text 출력
    // 텍스트를 출력할 위치는 유저 무기 출력 위치 바로 위기 때문에, userWeaponBox 기준으로 해도 됨
    digitalDisplay('user weapon', this.userSelectBox[0].x, this.userSelectBox[0].y - 20)

    this.displayWeaponIcon()
    this.displayUserWeaponIcon()
    this.displayWeaponText()
  }

  displayWeaponText () {
    let weaponId = 0
    if (this.cursor.layerNumber === this.LAYER_USER_SELECT) {
      const weaponUserIdList = UserSystem.getWeaponList()
      weaponId = weaponUserIdList[this.cursor.userSelect]
    } else {
      const currentIndex = this.getCurrentIndex()
      if (currentIndex >= this.weaponIdList.length) return

      weaponId = this.weaponIdList[currentIndex]
    }

    let getWeapon = dataExportStatPlayerWeapon.get(weaponId)
    if (getWeapon == null) return

    let getPlayerWeapon = dataExportPlayerWeapon.get(weaponId)
    if (getPlayerWeapon == null) return
    if (getPlayerWeapon.weapon == null) return

    let weaponName = `${getWeapon.name} (${getWeapon.balance})`
    let text1 = weaponName
    let text2A = 'attack: ' + getPlayerWeapon.getShotAttack(UserSystem.getAttackWeaponValue())
    let text2B = ', shot: ' + getWeapon.delay + 'f'
    let text2C = ', ' + getPlayerWeapon.shotCount + 'x' + getPlayerWeapon.weapon.repeatCount

    digitalDisplay(text1, this.x, this.y + this.height - 40)
    digitalDisplay(text2A + text2B + text2C, this.x, this.y + this.height - 20)
  }
}

class UIComponentSkillSelect extends UIComponentWeaponSkillGridObject {
  constructor () {
    super()
    this.titleImageObject = imageDataInfo.menuList.skillSelect
    this.backgroundColor = ['#6190E8', '#A7BFE8']

    const skillWidth = imageDataInfo.default.weaponIcon.width
    const skillHeight = imageDataInfo.default.weaponIcon.height

    const LAYER_Y_USER_SKILL = this.y + 50
    const LAYER_Y_SKILL_LIST = this.y + 140
    
    this.createGrid2DBox(
      this.COLUMN_COUNT,
      this.COLUMN_COUNT,
      this.x,
      LAYER_Y_SKILL_LIST,
      skillWidth,
      skillHeight
    )
    
    this.userSelectBox = []
    const userSkillWidth = skillWidth + 40
    const LEFT_BORDER = 80
    for (let i = 0; i < UserSystem.SKILL_LIST_TOTAL_COUNT; i++) {
      let line = Math.floor(i / (8 / 2)) // 스킬 리스트의 절반
      let x = i % 4
      let box = new BoxObject(LEFT_BORDER + this.x + (userSkillWidth * x), LAYER_Y_USER_SKILL + (skillHeight * line), userSkillWidth, skillHeight, '', BoxObject.DEFAULT_BOX_COLOR)
      this.userSelectBox.push(box)
    }

    this.createPage(1)
  }

  /**
   * 커서의 위치를 변경합니다.
   * @param {number} layerNumber 레이어 번호 (상수값으로 사용)
   * @param {number} movePosition 이동할 위치 (좌표를 입력하는것이 아니라 순서 번호입니다.)
   */
  changeCursorCustom (layerNumber, movePosition) {
    const CONL1 = layerNumber === this.LAYER_PRESET
    const CONL2 = layerNumber === this.LAYER_WEAPON
    const CONL3 = layerNumber === this.LAYER_USER_SELECT

    let con1 = layerNumber === this.cursor.layerNumber
    let con2 = CONL1 && this.cursor.preset === movePosition
    let con3 = CONL2 && this.cursor.index === movePosition
    let con4 = CONL3 && this.cursor.userSelect === movePosition

    // 조건: layerNumber가 같고, movePosition이 같은 경우 early return
    if (con1 && (con2 || con3 || con4)) return

    // 조건, layerNumber 가 userWeapon이고, 입력된 값 범위가 제한된 값인지 확인
    let con6 = CONL3 && (movePosition < 0 || movePosition >= this.userSelectBox.length)

    // 조건, preset 아까랑 마찬가지로 범위 조건 확인
    let con7 = CONL1 && (movePosition < 0 || movePosition >= this.presetBox.length)
    if (con6 || con7) return

    this.cursor.layerNumber = layerNumber
    if (layerNumber === this.LAYER_USER_SELECT) {
      this.cursor.userSelect = movePosition
    } else if (layerNumber === this.LAYER_WEAPON) {
      this.cursor.index = movePosition
    } else if (layerNumber === this.LAYER_PRESET) {
      this.cursor.preset = movePosition
    }

    this.changeBoxFocus()
    if (this.isCursorSound) {
      game.sound.play(soundSrc.system.systemCursor)
    }
  }

  /** 포커스 변경, changeCursor를 사용한 경우에만 동작함 */
  changeBoxFocus () {
    
    for (let i = 0; i < this.presetBox.length; i++) {
      this.presetBox[i].focus = false

      if (this.cursor.layerNumber === this.LAYER_PRESET) {
        if (i === this.cursor.preset) {
          this.presetBox[i].focus = true
          this.presetBox[i].focusColor = BoxObject.DEFAULT_FOCUS_COLOR
        } else if (i === UserSystem.skillPresetNumber) {
          // 이미 선택되어 있는 프리셋은 다른 커서에 있어도 항상 포커스는 대기 색으로 부여합니다.
          this.presetBox[i].focus = true
          this.presetBox[i].focusColor = BoxObject.FOCUS_COLOR_WAIT_CURSOR
        }
      } else {
        // 이미 선택되어있는 프리셋은, 다른 레이어에 있을 때 항상 대기 색으로 부여합니다.
        if (i === UserSystem.skillPresetNumber) {
          this.presetBox[i].focus = true
          this.presetBox[i].focusColor = BoxObject.FOCUS_COLOR_WAIT_CURSOR
        }
      }
    }

    for (let i = 0; i < this.userSelectBox.length; i++) {
      this.userSelectBox[i].focus = false

      if (this.cursor.userSelect === i) {
        this.userSelectBox[i].focus = true

        if (this.cursor.layerNumber === this.LAYER_USER_SELECT) {
          this.userSelectBox[i].focusColor = BoxObject.DEFAULT_FOCUS_COLOR
        } else {
          // 레이어가 다르면, 해당 커서가 선택 대기중으로 간주되고, 이에 따라 커서에 닿았을 때랑 다른 색을 적용함
          this.userSelectBox[i].focusColor = BoxObject.FOCUS_COLOR_WAIT_CURSOR
        }
      }
    }

    for (let i = 0; i < this.boxList.length; i++) {
      this.boxList[i].focus = false

      if (this.cursor.layerNumber === this.LAYER_WEAPON && this.cursor.index === i) {
        this.boxList[i].focus = true
      }
    }
  }

  changeSkillPreset () {
    // 유저가 이미 사용중인 무기 프리셋의 값이 다를 때만 프리셋을 변경함
    if (this.cursor.layerNumber === this.LAYER_PRESET && this.cursor.preset !== UserSystem.skillPresetNumber) {
      UserSystem.changePresetSkill(this.cursor.preset)
      game.sound.play(soundSrc.system.systemSelect)
      this.changeBoxFocus()
    }
  }

  changeSkill () {
    const currentIndex = this.getCurrentIndex()

    // 참고: 무기 리스트 중 0 번은 비어있는 것를 뜻하지만, 지금은 그 기능을 사용할 수 없도록 막았습니다.
    if (this.cursor.layerNumber === this.LAYER_WEAPON && currentIndex !== 0) {
      if (currentIndex >= this.skillIdList.length) {
        game.sound.play(soundSrc.system.systemBuzzer)
        return
      }

      let success = UserSystem.setSkill(this.cursor.userSelect, this.skillIdList[currentIndex])
      game.sound.play(success ? soundSrc.system.systemSkillSelect : soundSrc.system.systemBuzzer)

      if (success) {
        // 참고: 스킬를 변경했다면 유저 선택 부분의 커서가 +1칸이 되고, 
        // +1칸이 되었을 때 정해진 칸수를 초과 (배열 length 이상) 다시 0칸으로 이동합니다.
        const nextNumber = this.cursor.userSelect + 1 < this.userSelectBox.length ? this.cursor.userSelect + 1 : 0

        // 그리고, 임시적으로 커서 사운드를 껐다가 켭니다.
        // 소리가 다른 효과음과 겹쳤기 때문입니다.
        this.cursorSoundMute()
        this.changeCursorCustom(this.LAYER_USER_SELECT, nextNumber)
        this.changeCursorCustom(this.LAYER_WEAPON, this.cursor.index)
        this.changeBoxFocus()
        this.cursorSoundUnMute()

        // 저장 요청
        SaveSystem.requestSave()
      }
    }
  }

  processButtonMoveCursor () {
    let button = this.getButtonObject()

    if (button.buttonLeft) {
      this.moveGrid(-1, 0)
    } else if (button.buttonRight) {
      this.moveGrid(1, 0)
    } else if (button.buttonDown) {
      this.moveGrid(0, 1)
    } else if (button.buttonUp) {
      this.moveGrid(0, -1)
    }
  }

  processButtonSelect () {
    if (this.cursor.layerNumber === this.LAYER_PRESET) {
      this.changeSkillPreset()
    } else if (this.cursor.layerNumber === this.LAYER_WEAPON) {
      this.changeSkill()
    }
  }

  /**
   * 그리드를 이동시킵니다.
   */
  moveGrid (moveX = 0, moveY = 0) {
    let position = this.getGridPosition()

    // 커서 레이어 변화가 일어나는지를 확인
    // Y가 0 ~ 2 사이일 때, relativeY가 변화하면 처리
    if (position.y === 0 && moveX === 0) {
      if (moveY > 0) {
        position.x = this.cursor.userSelect // 포지션X를 userSelect 커서로 재변경
      }
    } else if (position.y === 1 && moveX === 0) {
      if (moveY > 0) {
        position.x = this.cursor.index
      } else if (moveY < 0) {
        position.x = this.cursor.preset
      }
    } else if (position.y >= 2) {
      if (moveX === -1) {
        if (position.x === 0 && this.page > 0) {
          this.page--
          position.x = this.COLUMN_COUNT - 1
          moveX = 0 // 페이지를 이동했기 때문에 정확한 설정을 위해 이동 값은 0으로 처리
        } else if (position.x === 0) {
          moveX = 0 // X가 0이고 PAGE가 0이면 이동할 수 없으므로 이동 처리 취소시킴
        }
      } else if (moveX === 1) {
        if (position.x === this.COLUMN_COUNT - 1 && this.page < this.maxPage) {
          this.page++
          position.x = 0
          moveX = 0
        } else if (position.x === this.COLUMN_COUNT - 1) {
          moveX = 0
        }
      }

      if (moveY < 0) {
        position.x = this.cursor.userSelect
      }
    }

    this.setGridPosition(position.x + moveX, position.y + moveY)
  }

  getGridPosition () {
    let x = 0
    let y = 0

    if (this.cursor.layerNumber === this.LAYER_PRESET) {
      y = 0
    } else if (this.cursor.layerNumber === this.LAYER_USER_SELECT) {
      y = 1
    } else if (this.cursor.layerNumber === this.LAYER_WEAPON) {
      let line = Math.floor(this.cursor.index / this.COLUMN_COUNT)
      y = 2 + line
    }

    if (this.cursor.layerNumber === this.LAYER_PRESET) {
      x = this.cursor.preset
    } else if (this.cursor.layerNumber === this.LAYER_USER_SELECT) {
      x = this.cursor.userSelect
    } else if (this.cursor.layerNumber === this.LAYER_WEAPON) {
      x = this.cursor.index % this.COLUMN_COUNT
    }

    return {x, y}
  }

  setGridPosition (x = 0, y = 0) {
    // 그리드는 X축, Y축으로 나누어 집니다.
    // Y = 0일때 프리셋, Y = 1일때 유저 스킬, Y = 2일때부터는 무기 리스트
    // 그리드의 위치를 제공하면, 그에 맞게 재배치시킴 (get과 원리는 구조적으로 동일)

    if (y === 0) {
      this.changeCursorCustom(this.LAYER_PRESET, x)
    } else if (y === 1) {
      this.changeCursorCustom(this.LAYER_USER_SELECT, x)
    } else if (y >= 2) {
      const lineY = (y - 2) * this.COLUMN_COUNT
      this.changeCursorCustom(this.LAYER_WEAPON, lineY + x)
    }
  }

  processMouse () {
    super.processMouse()
    if (game.control.isMouseMove && this.throttleCheck()) {
      const mouseX = game.control.getMouseX() 
      const mouseY = game.control.getMouseY()

      for (let i = 0; i < this.presetBox.length; i++) {
        if (this.presetBox[i].collision(mouseX, mouseY)) {
          // change preset
          this.changeCursorCustom(this.LAYER_PRESET, i)
        }
      }

      for (let i = 0; i < this.boxList.length; i++) {
        if (this.boxList[i].collision(mouseX, mouseY)) {
          // change weapon cursor
          this.changeCursorCustom(this.LAYER_WEAPON, i)
        }
      }

      for (let i = 0; i < this.userSelectBox.length; i++) {
        if (this.userSelectBox[i].collision(mouseX, mouseY)) {
          // cursor move user weapon box
          this.changeCursorCustom(this.LAYER_USER_SELECT, i)
        }
      }
    }

    if (game.control.getMouseClick()) {
      const mouseX = game.control.getMouseX() 
      const mouseY = game.control.getMouseY()

      for (let i = 0; i < this.presetBox.length; i++) {
        if (this.presetBox[i].collision(mouseX, mouseY)) {
          this.changeSkillPreset()
        }
      }
    }

  }

  displaySkillIcon () {
    const startIndex = this.getStartIndex()

    for (let i = 0; i < this.boxList.length; i++) {
      if (startIndex + i >= this.skillIdList.length) continue

      const currentIndex = startIndex + i
      const skillId = this.skillIdList[currentIndex]
      const iconNumber = StatPlayerSkill.getSkillIconNumber(skillId)
      UIIconDisplay.displayIconSkill(iconNumber, this.boxList[i].x, this.boxList[i].y)
    }
  }

  displayUserSkillIcon () {
    let iconList = UserSystem.getSkillList()
    for (let i = 0; i < this.userSelectBox.length; i++) {
      const iconNumber = StatPlayerSkill.getSkillIconNumber(iconList[i])
      UIIconDisplay.displayIconSkill(iconNumber, this.userSelectBox[i].x, this.userSelectBox[i].y)

      let getSkill = dataExportStatPlayerSkill.get(iconList[i])
      if (getSkill != null) {
        let ax = this.userSelectBox[i].x + this.userSelectBox[i].width - 30
        digitalDisplay(getSkill.coolTime+'', ax, this.userSelectBox[i].y)
      }
    }

    // 스킬 4개씩 2슬롯 구조이므로, 0번과 4번이 1번 스킬의 기준점
    const textOuputX = this.userSelectBox[0].x - this.x

    digitalDisplay('SLOT-A', this.userSelectBox[0].x - textOuputX, this.userSelectBox[0].y)
    digitalDisplay('SLOT-B', this.userSelectBox[4].x - textOuputX, this.userSelectBox[4].y)
  }

  displaySkillText () {
    let skillId = 0
    
    if (this.cursor.layerNumber === this.LAYER_USER_SELECT) {
      const skillUserIdList = UserSystem.getSkillList()
      skillId = skillUserIdList[this.cursor.userSelect]
    } else {
      const currentIndex = this.getStartIndex() + this.cursor.index
      if (currentIndex >= this.skillIdList.length) return

      skillId = this.skillIdList[currentIndex]
    }

    let getSkill = dataExportStatPlayerSkill.get(skillId)
    if (getSkill == null) return
    if (getSkill.weapon == null) return

    let getPlayerSkill = dataExportPlayerSkill.get(skillId)
    if (getPlayerSkill == null) return

    const isSplash = getSkill.balance === StatPlayerSkill.balanceTypeList.SPLASH
      || getSkill.balance === StatPlayerSkill.balanceTypeList.AREA_SPLASH
      || getSkill.balance === StatPlayerSkill.balanceTypeList.AREA_ATTACK

    let splashText = isSplash ? 'max target: ' + getSkill.weapon.maxTarget + '' : ''
    let skillName = `${getSkill.name} (${getSkill.balance})`

    let text1A = skillName + ', ' + splashText
    let text2A = 'CoolTime: ' + getSkill.coolTime + ', attack: ' + getPlayerSkill.getShotAttack(UserSystem.getAttackSkillValue())
    let text2B = ', shot: (' + getSkill.shotCount + 'x' + getSkill.repeatCount + ')x' 
    let text2C = getSkill.weapon.subCount > 0 
      ? '(' + getSkill.weapon.repeatCount + 'x' + getSkill.weapon.subCount +')'
      : getSkill.weapon.repeatCount

    digitalDisplay(text1A, this.x, this.y + this.height - 40)
    digitalDisplay(text2A + text2B + text2C, this.x, this.y + this.height - 20)
  }

  displayContent () {
    super.displayContent()

    for (let i = 0; i < this.boxList.length; i++) {
      this.boxList[i].display()
    }
    
    for (let i = 0; i < this.userSelectBox.length; i++) {
      this.userSelectBox[i].display()
    }

    this.displaySkillText()
    this.displayUserSkillIcon()
    this.displaySkillIcon()
  }
}


class UIComponentStatUpgrade extends UIComponentObject {
  constructor () {
    super()
    this.titleImageObject = imageDataInfo.menuList.upgrade 
    this.backgroundColor = ['#b7ffad', '#d9ffd6']
    
  }

  displayBaseStat () {
    UserSystem.processStat() // 스탯을 보여주기 전 연산을 한 번 해야 함
    const v = UserSystem.getAttackValue()
    const text1 = 'LV: ' + UserSystem.lv + ', EXP: ' + UserSystem.exp + '/' + UserSystem.getExpMax()
    const text2 = 'HP: ' + UserSystem.hpMax + ', SHIELD: ' + UserSystem.shieldMax
    const text3 = 'SHIELD RECOVERY: ' + UserSystem.shieldRecovery + '/' + UserSystem.SHIELD_RECOVERY_USING
    const text4 = 'GOLD: ' + UserSystem.gold

    const textAA = 'ATTATK: ' + UserSystem.attack
    const attackValue = [v.level, v.equipment, v.slot, v.stat].filter(value => value !== 0).join('+')
    const textAC = ' (' + attackValue + ')'

    const x = this.x + 10
    const y = this.y + 50
    digitalDisplay(text1, x, y + 0)
    digitalDisplay(text2, x, y + 20)
    digitalDisplay(text3, x, y + 40)
    digitalDisplay(text4, x, y + 60)
    digitalDisplay(textAA + textAC, x, y + 80)
  }

  displayEquipment () {
    const text6 = 'EQUIPMENT'
    const equipmentData = UserSystem.getEquipmentItemData()
    const equipmentInventory = UserSystem.getInventoryEquipmentValues(UserSystem.equipmentIndex)
    const equipmentValues = UserSystem.getInventoryEquipmentValues()
    const x = this.x + 10
    const y = this.y + 180
    digitalDisplay(text6, x, y)

    if (equipmentData != null && equipmentInventory != null && equipmentValues != null) {
      const src = imageSrc.system.itemIcon
      const iconSectionWidth = imageDataInfo.system.itemIconSection.width
      const sliceX = (equipmentData.iconNumber % 10) * imageDataInfo.system.itemIconSection.width
      const sliceY = Math.floor(equipmentData.iconNumber / 10) * imageDataInfo.system.itemIconSection.height
      const iconWidth = imageDataInfo.system.itemIcon.width
      const iconHeight = imageDataInfo.system.itemIcon.height

      game.graphic.fillRect(x, y + 20, iconSectionWidth, iconSectionWidth, '#CCCCCC', 0.8)
      game.graphic.imageDisplay(src, sliceX, sliceY, iconWidth, iconHeight, x, y + 20, iconWidth, iconHeight)

      game.graphic.fillText('' + equipmentData.name + ' +' + equipmentValues.upgradeLevel, x + 120, y)
      digitalDisplay('ATTACK: ' + equipmentValues.attack, x + 80, y + 20)
      if (equipmentData.hp !== 0 || equipmentData.shield !== 0) {
        digitalDisplay('HP +' + equipmentData.hp + ', SHIELD +' + equipmentData.shield, x + 80, y + 40)
      }
      if (equipmentData.shieldRecovery !== 0) {
        digitalDisplay('SHIELD RECOVERY +' + equipmentData.shieldRecovery, x + 80, y + 60)
      }
    }
  }

  displayContent () {
    this.displayBaseStat()
    this.displayEquipment()
  }
}


class UIComponentInventory extends UIComponentObject {
  constructor () {
    super()
    // 임시 기능

    this.titleImageObject = imageDataInfo.menuList.inventory
    this.backgroundColor = ['#93b4b3', '#b6ece6']

    this.setWidthHeight(UIComponentObject.BASE_WIDTH + 60, UIComponentObject.BASE_HEIGHT + 40)
    this.setPosition(UIComponentObject.BASE_X - 30, UIComponentObject.BASE_Y - 20)

    // 힌트용 주석
    // const x = i % 10
    // const y = Math.floor(i / 10)
    // const w = 50
    // const h = 50
    this.createGrid2DBox(10, 3, this.x + 5, this.y + 50, 50, 50, 5, 40)

    this.createPage(1)
  }

  displayIcon () {
    const startIndex = this.getStartIndex()
    for (let i = 0; i < this.boxList.length; i++) {
      const currentIndex = i + startIndex
      let inven = UserSystem.inventory.get(currentIndex)
      if (inven == null) continue

      let itemData = dataExportStatItem.get(inven.id)
      if (itemData == null) continue
      if (itemData.iconNumber === -1) continue

      const src = imageSrc.system.itemIcon
      const iconSize = imageDataInfo.system.itemIcon.width
      const iconSectionSize = imageDataInfo.system.itemIconSection.width
      const sliceX = iconSectionSize * (itemData.iconNumber % 10)
      const sliceY = iconSectionSize * Math.floor(itemData.iconNumber / 10)
      game.graphic.imageDisplay(src, sliceX, sliceY, iconSize, iconSize, this.boxList[i].x, this.boxList[i].y, iconSize, iconSize)

      if (itemData.type === UserSystem.inventory.TYPES.ITEM) {
        let countText = 'X' + inven.countValue
        if (inven.countValue >= 1000 && inven.countValue <= 9999) countText = (inven.countValue / 1000).toFixed(1) + 'K'
        else if (inven.countValue >= 10000) countText = '9K+'
        digitalDisplay(countText, this.boxList[i].x, this.boxList[i].y + this.boxList[i].height)
      }
    }
  }

  displayInfo () {
    let index = this.getCurrentIndex()
    let item = UserSystem.inventory.get(index)
    if (item == null) return

    let data = dataExportStatItem.get(item.id)
    if (data == null) return

    // info display
    let typeText = data.typeString
    let firstLineText = data.type === UserSystem.inventory.TYPES.ITEM ? ', count:' + item.countValue : ', require Level: ' + data.requireLevel

    const x = this.x
    const y = this.y + this.height - 60

    digitalDisplay('INDEX: ' + this.cursor.index + ', type: ' + typeText + firstLineText, x, y)
    game.graphic.fillText(data.name, x, y + 20)
    game.graphic.fillText(data.info, x, y + 40)
  }

  displayContent () {
    super.displayContent()
    this.displayIcon()
    this.displayInfo()
  }
}

class UIComponentOption extends UIComponentObject {
  /** 옵션 목록의 리스트 */
  optionList = {
    MENU_SOUND_ON: 0,
    MENU_SOUND_VOLUME: 1,
    MENU_MUSIC_ON: 2,
    MENU_MUSIC_VOLUME: 3,
    MENU_RESULT_AUTO_SKIP: 4,
    MENU_SHOW_ENEMY_HP: 5,
    MENU_SHOW_DAMAGE: 6,
  }

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
    this.titleImageObject = imageDataInfo.menuList.option
    this.backgroundColor = ['#ffc494', '#ffd2a8']
    const startColor = '#ffcd75'
    const endColor = '#ffcd75'
    const focusColor = '#432e0a'

    const boxText = [
      'sound on',
      'sound volume',
      'music on',
      'music volume',
      'result auto skip',
      'show enemy hp',
      'show damage',
    ]

    this.createGridVerticalBox(boxText.length, this.x, this.y + 50, 300, 25)

    for (let i = 0; i < boxText.length; i++) {
      this.boxList[i].text = boxText[i]
    }

    this.setAllBoxColor(startColor, endColor, focusColor)
  }

  processButton () {
    super.processButton()
    let button = this.getButtonObject()

    if (button.buttonLeft) {
      if (this.cursor.index === this.optionList.MENU_SOUND_VOLUME) {
        this.optionChange(-2)
      } else if (this.cursor.index === this.optionList.MENU_MUSIC_VOLUME) {
        this.optionChange(-2)
      }
    } else if (button.buttonRight) {
      if (this.cursor.index === this.optionList.MENU_SOUND_VOLUME) {
        this.optionChange(2)
      } else if (this.cursor.index === this.optionList.MENU_MUSIC_VOLUME) {
        this.optionChange(2)
      }
    }
  }

  processButtonSelect () {
    this.optionChange()
  }

  /** 옵션의 값을 변화합니다. true/false의 경우 어떤 값을 넣어도 이전 값을 반전하기만 합니다. */
  optionChange (relativeValue = 0) {
    let volumeTable = [0, 20, 40, 60, 80, 100]

    if (this.cursor.index === this.optionList.MENU_SOUND_ON) {
      this.optionValue.soundOn = !this.optionValue.soundOn
    } else if (this.cursor.index === this.optionList.MENU_SOUND_VOLUME) {
      if (relativeValue === 0) {
        // 마우스 클릭 형태로 간주, 다음 배열 번호로 이동
        // 배열에 있는 다음 값보다 작으면 다음 값으로 이동하게 됩니다.
        let next = volumeTable.find(step => step > this.optionValue.soundVolume)
        this.optionValue.soundVolume = next === undefined ? volumeTable[0] : next
      } else {
        this.optionValue.soundVolume += relativeValue
      }
      game.sound.play(soundSrc.system.systemCursor)
    } else if (this.cursor.index === this.optionList.MENU_MUSIC_ON) {
      this.optionValue.musicOn = !this.optionValue.musicOn
    } else if (this.cursor.index === this.optionList.MENU_MUSIC_VOLUME) {
      if (relativeValue === 0) {
        // 마우스 클릭 형태로 간주, 다음 배열 번호로 이동
        // 배열에 있는 다음 값보다 작으면 다음 값으로 이동하게 됩니다.
        let next = volumeTable.find(step => step > this.optionValue.musicVolume)
        this.optionValue.musicVolume = next === undefined ? volumeTable[0] : next
      } else {
        this.optionValue.musicVolume += relativeValue
      }
    } else if (this.cursor.index === this.optionList.MENU_RESULT_AUTO_SKIP) {
      this.optionValue.resultAutoSkip = !this.optionValue.resultAutoSkip
    } else if (this.cursor.index === this.optionList.MENU_SHOW_ENEMY_HP) {
      this.optionValue.showEnemyHp = !this.optionValue.showEnemyHp
    } else if (this.cursor.index === this.optionList.MENU_SHOW_DAMAGE) {
      this.optionValue.showDamage = !this.optionValue.showDamage
    }

    this.optionEnable()
  }

  /** 옵션의 값을 실제 게임에 적용하는 함수 */
  optionEnable () {
    // 필드에게 옵션 값 전달
    FieldSystem.option.resultAutoSkip = this.optionValue.resultAutoSkip
    FieldSystem.option.showEnemyHp = this.optionValue.showEnemyHp
    FieldSystem.option.showDamage = this.optionValue.showDamage
    FieldSystem.option.musicOn = this.optionValue.musicOn
    FieldSystem.option.soundOn = this.optionValue.soundOn

    // 최대 최소 제한
    if (this.optionValue.soundVolume < 0) this.optionValue.soundVolume = 0
    if (this.optionValue.soundVolume > 100) this.optionValue.soundVolume = 100
    if (this.optionValue.musicVolume < 0) this.optionValue.musicVolume = 0
    if (this.optionValue.musicVolume > 100) this.optionValue.musicVolume = 100

    // 사운드가 켜져있으면, 현재 볼륨값으로 설정하고 아닐경우 0으로 설정
    // 주의: 사운드 게인은 0 ~ 1 사이의 범위입니다.
    let soundValue = this.optionValue.soundOn ? this.optionValue.soundVolume / 100 : 0
    game.sound.setGain(soundValue)
    game.sound.soundOn = this.optionValue.soundOn

    let musicValue = this.optionValue.musicOn ? this.optionValue.musicVolume / 100 : 0
    game.sound.setMusicGain(musicValue)
    game.sound.musicOn = this.optionValue.musicOn

    // 저장 요청
    // 다만 2초 단위로만 저장하고, 2초가 지나기 전 까지는 저장을 대기합니다.
    SaveSystem.requestSave()
  }

  displayContent () {
    super.displayContent()
    this.displayValue()
  }

  displayValue () {
    const value = [
      this.optionValue.soundOn,
      this.optionValue.soundVolume,
      this.optionValue.musicOn,
      this.optionValue.musicVolume,
      this.optionValue.resultAutoSkip,
      this.optionValue.showEnemyHp,
      this.optionValue.showDamage,
    ]

    let optionImageSrc = imageSrc.system.mainSystem
    let imageOptionCheckedData = imageDataInfo.mainSystem.optionChecked
    let imageOptionUnCheckedData = imageDataInfo.mainSystem.optionUnChecked

    for (let i = 0; i < this.boxList.length; i++) {
      const x = this.boxList[i].x + this.boxList[i].width
      if (typeof value[i] === 'boolean') {
        if (value[i]) {
          gameFunction.imageObjectDisplay(optionImageSrc, imageOptionCheckedData, this.boxList[i].x + this.boxList[i].width, this.boxList[i].y)
        } else {
          gameFunction.imageObjectDisplay(optionImageSrc, imageOptionUnCheckedData, this.boxList[i].x + this.boxList[i].width, this.boxList[i].y)
        }

      } else if (typeof value[i] === 'number') {
        const k = value[i]
        if (typeof k === "number") {
          digitalDisplay(value[i] + '', x + 5, this.boxList[i].y)
        }
      }
    }
  }
}

class UIComponentDataSetting extends UIComponentObject {
  constructor () {
    super()
    this.titleImageObject = imageDataInfo.menuList.data
    this.backgroundColor = ['#E0AC00', '#B2F641']
    const boxText = [
      'debug menu',
      'level change to 0',
      'level change to 10',
      'level change to 20',
      'level change to 26',
      // 'add 1000 gold',
      // 'ticker +100',
    ]

    this.createGridVerticalBox(boxText.length, this.x, this.y + 50, 300, 25)

    for (let i = 0; i < boxText.length; i++) {
      this.boxList[i].text = boxText[i]
    }

    this.setAllBoxColor('#E0AC00', '#B2F641', '#17251b')
  }

  processButtonSelect () {
    switch (this.cursor.index) {
      case 1: UserSystem.lv = 0; break
      case 2: UserSystem.lv = 10; break
      case 3: UserSystem.lv = 20; break
      case 4: UserSystem.lv = 26; break
      // case 5: userSystem.addGold(1000); break
      // case 6: userSystem.inventory.add(ID.item.donggramiTicket, 100); break
    }
  }

}

class UIComponentMisc extends UIComponentObject {
  constructor () {
    super()
    this.titleImageObject = imageDataInfo.menuList.etc
    this.backgroundColor = ['#bbb695', '#cbcd7a']

    const boxText = [
      'enemy test',
      'background test',
      'down tower test',
      'sound test',
      'statView.html file open',
      'bios menu',
    ]

    const startColor = '#e9d7be'
    const endColor = '#e9d7be'
    const focusColor = '#24211d'

    this.createGridVerticalBox(boxText.length, this.x, this.y + 50, 300, 25)

    for (let i = 0; i < boxText.length; i++) {
      this.boxList[i].text = boxText[i]
    }

    this.setAllBoxColor(startColor, endColor, focusColor)
  }

  /**
   * 라운드를 시작시킴
   * @param {number} roundId
   */
  roundStart (roundId) {
    FieldSystem.roundStart(roundId)

    if (FieldSystem.message === FieldSystem.messageList.STATE_FIELD) {
      GameSystem.stateId = GameSystem.STATE_FIELD
    }
  }

  processButtonSelect () {
    switch (this.cursor.index) {
      case 0: this.roundStart(ID.round.test1Enemy); break
      case 1: this.roundStart(ID.round.test2Background); break
      case 2: this.roundStart(ID.round.test3Round3DownTower); break
      case 3: this.roundStart(ID.round.test4Sound); break
    }

    if (this.cursor.index === 4) {
      let a = document.createElement('a')
      a.href = './statView.html'
      a.click() // 다른 html 파일로 이동
    } else if (this.cursor.index === 5) {
      game.runBiosMode()

      // 바이오스를 빠져나가면 메인화면으로 이동
      GameSystem.stateId = GameSystem.STATE_MAIN 
    }

    this.close()
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
    if (GameSystem.uiOpenCheck()) {
      return
    }

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

    // 유저 스탯 강제 재조정
    UserSystem.processStat()

    // 모든 UI창을 닫은 후, 실행한 창을 다시 염
    GameSystem.allUIClose()

    switch (this.cursorPosition) {
      case this.MENU_ROUND_SELECT: GameSystem.uiRoundSelect.open(); break
      case this.MENU_WEAPON_SELECT: GameSystem.uiWeaponSelect.open(); break
      case this.MENU_SKILL_SELECT: GameSystem.uiSkillSelect.open(); break
      case this.MENU_UPGRADE: GameSystem.uiStatUpgarde.open(); break
      case this.MENU_OPTION: GameSystem.uiOption.open(); break
      case this.MENU_DATA_SETTING: GameSystem.uiDataSetting.open(); break
      case this.MENU_ETC: GameSystem.uiMisc.open(); break
      case this.MENU_INVENTORY: GameSystem.uiInventroy.open(); break
      case this.MENU_STORY: break // 아직 아무것도 없음
    }

    // 사운드 출력
    game.sound.play(soundSrc.system.systemSelect)
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
    GameSystem.stateId = GameSystem.STATE_ERROR
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
      SaveSystem.dataReset()
      setTimeout(() => { location.reload() }, 1000)
    }
  }

  processFieldError () {
    if (game.control.getButtonInput(game.control.buttonIndex.START)) {
      GameSystem.stateId = GameSystem.STATE_MAIN
    }
  }

  processNormalError () {
    if (game.control.getButtonInput(game.control.buttonIndex.START)) {
      GameSystem.stateId = GameSystem.STATE_MAIN
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

/** 저장 데이터 관리용 클래스. 다만 이 클래스는 직접 참조할 수 없는 것이 많기 때문에,
 * 일부 함수만 패킹하는 용도 (암호화 해제, 데이터 배치 등) 만 처리합니다.
 */
class SaveSystem {
  /** 데이터 리셋 여부 */
  static isDataReset = false

  /** 저장 데이터를 관리하는 배열 */
  static array = new Int32Array(1600)

  /**
   * 모든 데이터를 삭제합니다.
   * 삭제 기능이 동작한 후, 2초 후 자동으로 새로고침 되기 때문에, 저장기능이 일시적으로 정지됩니다.
   */
  static dataReset () {
    // localStorage.clear() // 이제 tamshooter4와 관련한 데이터만 삭제됩니다.
    // 다른 데이터를 엉뚱하게 삭제할 가능성이 있으므로, localStorage.clear는 사용하지 않습니다.
    localStorage.removeItem(this.getCurrentSaveKey())
    localStorage.removeItem(this.getCurrentSaveKeyBackup())
    this.isDataReset = true
  }

  /** 저장 데이터 배열의 인덱스 이름. 이 위치들은 같은 그룹일 경우 절대위치, 다른 그룹일 경우 상대위치입니다. */
  static index = {
    /** 헤더 영역 */ header: {
      /** 세이브 플래그 */ SAVE_FLAG: 0,
      /** 할당된 그룹 개수 */ TOTAL_GROUP_COUNT: 1,
      /** 그룹 1의 인덱스 위치 */ GROUP1_INDEX_POSITION: 2,
      /** 그룹 1의 데이터 개수 */ GROUP1_COUNT_POSITION: 3,
      /** 그룹 2의 인덱스 위치 */ GROUP2_INDEX_POSITION: 4,
      /** 그룹 2의 데이터 개수 */ GROUP2_COUNT_POSITION: 5,
      /** 그룹 3의 인덱스 위치 */ GROUP3_INDEX_POSITION: 6,
      /** 그룹 3의 데이터 개수 */ GROUP3_COUNT_POSITION: 7,
      /** 그룹 4의 인덱스 위치 */ GROUP4_INDEX_POSITION: 8,
      /** 그룹 4의 데이터 개수 */ GROUP4_COUNT_POSITION: 9,
      /** 헤더의 마지막 인덱스 (임시용도) */ HEADER_LAST_INDEX: 10,
    },

    /** 그룹 1 옵션 데이터 영역 */ group1OptionData: {
      SAVE_DATE_YEAR: 0,
      SAVE_DATE_MONTH: 1,
      SAVE_DATE_DATE: 2,
      SAVE_DATE_HOUR: 3,
      SAVE_DATE_MINUTE: 4,
      SAVE_DATE_SECOND: 5,
      START_DATE_YEAR: 6,
      START_DATE_MONTH: 7,
      START_DATE_DATE: 8,
      START_DATE_HOUR: 9,
      START_DATE_MINUTE: 10,
      START_DATE_SECOND: 11,
      PLAY_TIME_HOUR: 12,
      PLAY_TIME_MINUTE: 13,
      PLAY_TIME_SECOND: 14,
      OPTION_SOUND_ON: 15,
      OPTION_MUSIC_ON: 16,
      OPTION_SOUND_VOLUME: 17,
      OPTION_MUSIC_VOLUME: 18,
      OPTION_RESULT_AUTO_SKIP: 19,
      OPTION_SHOW_ENEMY_HP: 20,
      OPTION_SHOW_DAMAGE: 21,
    },

    /** 그룹 2 암호화 데이터 (단순 조작 방지용) */ group2EncodeData: {
      LV: 0,
      EXP: 1,
      GOLD: 2
    },

    /** 그룹 3 유저 데이터 영역, 고정 길이 저장용 */
    group3UserData: {
      // fixed (0 ~ 99, 이 범위는 임시 범위에 가까움)
      /** 고정 범위 인덱스의 개수 */ FIXED_INDEX_COUNT: 0,
      WEAPON_LIST: 0, 
      SKILL_LIST: 4,
      WEAPON_PRESET: 12,
      WEAPON_PRESET_NUMBER: 32,
      SKILL_PRESET: 33,
      SKILL_PRESET_NUMBER: 73,
      EQUIPMENT_INVENTORY_INDEX: 74,
    },

    /** 그룹 4 유저 데이터, 가변 길이 저장용 */
    group4UserData: {
      // variable (~100 부터 시작, 짝수는 시작 인덱스 번호, 홀수는 배열의 개수)
      // 만약 데이터가 없다면, 아무 길이도 추가되지 않습니다.
      INVENTORY_IDLIST: 0,
      INVENTORY_IDLIST_COUNT: 1,
      INVENTORY_ITEM_COUNT: 2,
      INVENTORY_ITEM_COUNT_COUNT: 3,
      INVENTORY_UPGRADE_LEVEL: 4,
      INVENTORY_UPGRADE_LEVEL_COUNT: 5,
      UNLOCK_WEAPON: 6,
      UNLOCK_WEAPON_COUNT: 7,
      UNLOCK_SKILL: 8,
      UNLOCK_SKILL_COUNT: 9,
      ROUND_CLEAR: 10,
      ROUND_CLEAR_COUNT: 11,
      SPECIAL_FLAG: 12,
      SPECIAL_FLAG_COUNT: 13,
      /** variable의 첫 데이터가 진입하는 지점 */ VARIABLE_DATA_START: 14,
    }
  }

  /** 
   * 이 값 대신 getCurrentSaveKey를 사용해주세요. 왜냐하면 숫자키도 같이 사용해야합니다.
   * 
   * 다만 이 키 값은 내부 상수로 사용되야 하므로 이 코드를 삭제하지 마세요.
   * 
   * tamshooter4에서 사용하는 lcoalStoarge save key 
   * @private
   */
  static saveKeyTamshooter4Data = 'tamshooter4SaveData'

  /** 
   * 이 값 대신 getCurrentSaveKey를 사용해주세요. 왜냐하면 숫자키도 같이 사용해야합니다.
   * 
   * 다만 이 키 값은 내부 상수로 사용되야 하므로 이 코드를 삭제하지 마세요.
   * 
   * tamshooter4에서 사용하는 saveKey에 추가적으로 붙는 번호 (다만 이 게임에서 다중 세이브를 사용할 생각이 없음) 
   * @private
   */
  static saveKeyTamshooter4DataNumber = 0

  /**
   * 저장할 때, 기준 버전을 참고할 플래그 값입니다. 하위호환용으로만 제공
   * @deprecated
   */
  static saveFlagList = {
    /** 0.36버전 이후 만들어짐 */ v0a36: 'v0a36',
    /** 0.43버전 이후 만들어짐*/ level1V0a43: 'level1 v0a43',
  }

  /** 
   * 저장할 때, 헤더 플래그 값을 가져옵니다. 
   * 해더는 배열의 0번째 칸에 저장합니다.
  */
  static saveHeaderFlag = {
    /** 0.55버전의 특수 플래그 */ V055: 107780055
  }

  /** tamshooter4에서 사용하는 실제 세이브 키 (참고: 세이브 키 + 세이브 번호의 조합으로 키를 구성하기 때문에 이 함수를 사용해야 합니다.) */
  static getCurrentSaveKey () {
    return this.saveKeyTamshooter4Data + this.saveKeyTamshooter4DataNumber
  }

  /** tamshooter4에서 사용하는 백업용 세이브 키 (오류가 났을 때 복구하는 용도) */
  static getCurrentSaveKeyBackup () {
    return this.saveKeyTamshooter4Data + this.saveKeyTamshooter4DataNumber + 'backup'
  }

  static getCurrentSaveKeyField () {
    return 'tamshooter4FieldData'
  }

  /** 
   * 저장 지연 시간을 카운트 하는 변수 
   * 
   * 메인 화면은 최소 120프레임 간격으로 저장합니다.
   * requestSave가 호출된 순간 저장하지만, 120프레임 이내에 다시 저장하지 않습니다.
   */ 
  static saveDelayCount = 0

  /** 
   * 필드 자동 저장을 위한 지연 시간을 카운트 하는 함수
   * requestSave가 호출된 후, 저장이 완료된 경우 이 변수 또한 같이 0으로 초기화됩니다.
   */
  static saveDelayFieldCount = 0

  /**
   * 게임 실행시 불러오기는 단 한번만 합니다.
   * 기본값: false, 한번 로드했다면 true.
   * 참고로 새로고침을 한다면 게임을 재실행하기 때문에 불러오기도 합니다.
   */
  static initLoad = false

  /** 저장에 대한 최소 간격 (120프레임 = 2초)  */
  static SAVE_DELAY_MAIN = 120

  /** 
   * 필드 자동 저장에 대한 최소 간격 (300프레임 = 5초)
   * 
   * 단, requestSave가 호출된 경우, SAVE_DELAY_MAIN과 동일한 간격으로 저장합니다.
   * 자세한 내용은 saveDelayCount 변수를 참조하세요.
   */
  static SAVE_DELAY_FIELD = 300

  /** 세이브 이벤트가 발생되었는지 확인하는 변수 */
  static #isSaveEvent = false

  /** 저장을 수행하도록 요청합니다. */
  static requestSave () {
    this.#isSaveEvent = true
  }

  /**
   * 세이브가 진행되어야 하는지 확인합니다.
   * 
   * 주의: 이 함수를 연속 2번 호출하지 마세요. 이 함수는 저장 딜레이 카운트를 리셋하는 효과도 있습니다.
   * 
   * 더이상 강제 저장 요청은 수행되지 않습니다.
   * @returns {boolean}
   */
  static processSaveConditionCheck () {
    // 데이터 리셋이 되었다면, 게임을 자동 새로고침하므로 저장 함수를 실행하지 않음.
    if (this.isDataReset) return false

    // 이것은 이벤트 기반이 작동하는 즉시 저장을 유도하기 위해 카운트를 미리 증가시켜 놓습니다.
    this.saveDelayCount++

    // requestSave 요청이 들어왔는지 확인합니다. 아니라면 저장하지 않습니다.
    // 여전히 카운트는 증가되기 때문에, 이벤트가 들어오면 즉시 저장될 수 있습니다.
    if (!this.#isSaveEvent) return false
    
    // 이벤트가 들어와도, 지연된 시간을 초과하기 전까지 저장이 지연됩니다.
    if (this.saveDelayCount < this.SAVE_DELAY_MAIN) return false

    // 저장을 성공했다고 가정한다면
    // 세이브 딜레이 초기화
    this.saveDelayCount = 0
    this.saveDelayFieldCount = 0 // 필드 주기도 같이 초기화됨

    // 세이브 이벤트 제거
    this.#isSaveEvent = false

    return true
  }

  /** 특정 시점에서 강제 저장을 호출할 때 사용합니다. */
  static forceSave () {
    this.#isSaveEvent = true
    this.saveDelayCount = this.SAVE_DELAY_MAIN
  }

  /** 
   * 필드에서의 자동 저장 조건 확인, 이것은 이벤트 기반으로 동작하지 않습니다.
   * 
   * 참고로, 필드 자동 저장은 세이브 이벤트랑은 별도이지만,
   * 내부 카운터는 이벤트가 발생하고 메인 코드 저장이 완료되면 0으로 재설정됩니다.
   */
  static processfieldAutoSaveConditionCheck () {
    if (this.isDataReset) return false

    this.saveDelayFieldCount++

    if (this.saveDelayFieldCount < this.SAVE_DELAY_FIELD) return false
    this.saveDelayFieldCount = 0

    return true
  }

  
  /**
   * 숫자로 구성된 배열을 고속으로 난독화하고 무결성 체크섬을 부착합니다.
   * @param {number[]} dataArray - 암호화할 정수 배열 (예: [lv, exp, gold, hp])
   * @returns {number[]} - 난독화된 정수 배열
   */
  static numberArrayEncodeV055(dataArray) {
    const len = dataArray.length;
    // [0]: 시드키, [1~len]: 난독화된 데이터, [len+1]: 무결성 체크섬
    const result = new Int32Array(len + 2);
    
    // 1. 32비트 난수 키 생성 (0이 아닌 값)
    const maskKey = (Math.random() * 0x7FFFFFFF) | 1;
    result[0] = maskKey;

    let checksum = 2166136261; // FNV-1a Hash 초기값

    // 2. 고속 XOR 및 무결성 핑거프린트 연산
    for (let i = 0; i < len; i++) {
      const val = dataArray[i] | 0; // 강제 32bit 정수화
      
      // 위치 기반 Dynamic XOR (키가 매번 달라짐)
      const encryptedVal = val ^ (maskKey + i * 16807);
      result[i + 1] = encryptedVal;

      // FNV-1a 해시 갱신 (데이터 변조 감지용)
      checksum ^= val;
      checksum = Math.imul(checksum, 16777619);
    }

    // 3. 체크섬도 난독화하여 맨 뒤에 추가
    result[len + 1] = checksum ^ maskKey;

    // LocalStorage 저장 시 join(',')으로 1회 변환
    return Array.from(result);
  }

  /**
   * 난독화된 배열을 복호화하고 변조 여부를 검증합니다.
   * @param {ArrayLike<number>} encryptedArray 
   * @returns {number[] | null} - 변조되었거나 불법 데이터면 null 리턴
   */
  static numberArrayDecodeV055(encryptedArray) {
    if (!encryptedArray || encryptedArray.length < 3) return null;

    const maskKey = encryptedArray[0];
    const len = encryptedArray.length - 2;
    const decrypted = new Int32Array(len);
    
    let checksum = 2166136261;

    for (let i = 0; i < len; i++) {
      const encryptedVal = encryptedArray[i + 1];
      const originalVal = encryptedVal ^ (maskKey + i * 16807);
      
      decrypted[i] = originalVal;

      checksum ^= originalVal;
      checksum = Math.imul(checksum, 16777619);
    }

    const expectedChecksum = encryptedArray[encryptedArray.length - 1] ^ maskKey;

    // 체크섬이 일치하지 않으면 데이터가 조작된 것임!
    if (checksum !== expectedChecksum) {
      console.warn("세이브 데이터 변조가 감지되었습니다!");
      return null;
    }

    return Array.from(decrypted);
  }

  /**
   * encode로 변환하였던 문자열을 다시 원래의 숫자 배열로 변환시킵니다.
   * 
   * 0.55.7 버전 이후 사용되지 않습니다.
   * @deprecated
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
    /** @type {string[]} 키값의 암호화 해제한 디코드 배열 */ let decodeArray = []

    // 디코드 진행
    for (let i = 0; i < arrayNumber.length; i++) {
      // 첫번째와 마지막 키는 기준 키이므로 이를 디코드 하지 않습니다.
      if (i === 0 || i === arrayNumber.length - 1) continue
      let decode = String(arrayNumber[i] ^ getKeyTarget) // 숫자 디코드
      decode = decode.padStart(8, '0') // 그 다음 8글자 미만인경우 자리수를 채움
      decodeArray.push(decode)
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

      // 디지트가 0인경우, 0이 아닌숫자가 나올때까지 계속 다음글자로 넘어감
      if (digit === 0) {
        position++
        continue
      }

      divArray.push(text) // 결과를 새 배열에 추가
      position += DIGITLEN + digit + len // 다음 문자를 읽을 위치를 변경
    }

    return divArray
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
export class GameSystem {
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

  // 일부 시스템은 static을 사용하기 때문에 new를 이용해 인스턴스를 생성하지 않습니다.
  /** 유저 시스템 */ static userSystem = UserSystem
  /** 필드 시스템 */ static fieldSystem = FieldSystem
  /** 메인 시스템 */ static mainSystem = new MainSystem()
  /** 스텟(게임, 필드 스탯) 표시 시스템 */ static statSystem = new StatSystem()
  /** error 시스템 */ static errorSystem = new ErrorSystem()

  static uiRoundSelect = new UIComponentRoundSelect()
  static uiWeaponSelect = new UIComponentWeaponSelect()
  static uiSkillSelect = new UIComponentSkillSelect()
  static uiStatUpgarde = new UIComponentStatUpgrade()
  static uiInventroy = new UIComponentInventory()
  static uiOption = new UIComponentOption()
  static uiDataSetting = new UIComponentDataSetting()
  static uiMisc = new UIComponentMisc()
  static uiEquipmentUpgrade = new UIComponentEquipmentUpgrade()
  static uiItemCrafting = new UIComponentItemCrafting()
  static uiBoseokGrowth = new UIComponentBoseokGrowth()

  static {
    // debug 용도
    // this.uiItemCrafting.isOpen = true
    // this.uiInventroy.isOpen = true
    // this.uiStatUpgarde.isOpen = true
  }

  /** 모든 UI 창을 닫습니다. */
  static allUIClose () {
    this.uiRoundSelect.close()
    this.uiWeaponSelect.close()
    this.uiSkillSelect.close()
    this.uiStatUpgarde.close()
    this.uiInventroy.close()
    this.uiOption.close()
    this.uiDataSetting.close()
    this.uiMisc.close()

    //
    this.uiEquipmentUpgrade.close()
    this.uiItemCrafting.close()
    this.uiBoseokGrowth.close()
  }

  /** ui가 1개 이상 열려있는지를 확인함 */
  static uiOpenCheck () {
    const value = this.uiRoundSelect.isOpen
      || this.uiWeaponSelect.isOpen
      || this.uiSkillSelect.isOpen
      || this.uiStatUpgarde.isOpen
      || this.uiInventroy.isOpen
      || this.uiOption.isOpen
      || this.uiMisc.isOpen
      || this.uiDataSetting.isOpen
      || this.uiEquipmentUpgrade.isOpen
      || this.uiItemCrafting.isOpen
      || this.uiBoseokGrowth.isOpen

    return value
  }

  /** 현재 게임의 옵션 데이터를 가져옵니다. */
  static getGameOption () {
    return this.uiOption.optionValue
  }

  /** 저장 과정을 처리합니다. */
  static processSave () {
    // 조건이 많아진 이유는, 로드 직후의 상태에서 저장되지 못하는 문제가 있었기 때문
    // 그래서 확실히 필드가 끝났다는 보증이 있는 상황만 피해서 저장합니다.
    const isFieldSave = this.stateId === this.STATE_FIELD 
    && (FieldSystem.stateId === FieldSystem.STATE_NORMAL 
      || FieldSystem.stateId === FieldSystem.STATE_PAUSE
      || FieldSystem.stateId === FieldSystem.STATE_LOADING
      || FieldSystem.stateId === FieldSystem.STATE_LOADING_PAUSE)
    const isMainSave = SaveSystem.processSaveConditionCheck()
    const isFieldAutoSave = SaveSystem.processfieldAutoSaveConditionCheck()
    const willSaveField = isFieldSave && (isMainSave || isFieldAutoSave)

    if (isMainSave || willSaveField) {
      this.processSaveV055()
    }

    if (willSaveField) {
      this.processSaveField()
    } else if (!isFieldSave) {
      localStorage.removeItem(SaveSystem.getCurrentSaveKeyField())
    }
  }

  /** 필드 상황을 저장합니다. */
  static processSaveField () {
    FieldSystem.fieldSystemSaveData()
    const saveLength = FieldSystem.fieldSave.array[FieldSystem.fieldSave.index.header.TOTAL_LENGTH]

    let subArray = FieldSystem.fieldSave.array.subarray(0, saveLength)
    let resultText = subArray.join(',')
    localStorage.setItem(SaveSystem.getCurrentSaveKeyField(), resultText)
  }
  

  static processSaveV055 () {
    /** 현재 오프셋 위치 */ let offset = 0
    const buffer = SaveSystem.array

    // --- 1. HEADER 구역 예동 (위치 예약) ---
    const HEADER_SIZE = SaveSystem.index.header.HEADER_LAST_INDEX;
    const headerStart = offset;
    offset += HEADER_SIZE; // HeaderSize 확보 후, offset 이동

    // --- 2. GROUP 1: 날짜/시간/옵션 (고정 길이) ---
    const group1Index = offset;
    const saveDate = new Date();
    const startDate = this.userSystem.startDate;
    const playTime = this.userSystem.playTime;
    const opt = this.uiOption.optionValue;

    buffer[offset++] = saveDate.getFullYear();
    buffer[offset++] = saveDate.getMonth() + 1;
    buffer[offset++] = saveDate.getDate();
    buffer[offset++] = saveDate.getHours();
    buffer[offset++] = saveDate.getMinutes();
    buffer[offset++] = saveDate.getSeconds();
    buffer[offset++] = startDate.year;
    buffer[offset++] = startDate.month;
    buffer[offset++] = startDate.day;
    buffer[offset++] = startDate.hour;
    buffer[offset++] = startDate.minute;
    buffer[offset++] = startDate.second;
    buffer[offset++] = playTime.hour;
    buffer[offset++] = playTime.minute;
    buffer[offset++] = playTime.second;
    buffer[offset++] = opt.soundOn ? 1 : 0;
    buffer[offset++] = opt.musicOn ? 1 : 0;
    buffer[offset++] = opt.soundVolume;
    buffer[offset++] = opt.musicVolume;
    buffer[offset++] = opt.resultAutoSkip ? 1 : 0;
    buffer[offset++] = opt.showEnemyHp ? 1 : 0;
    buffer[offset++] = opt.showDamage ? 1 : 0;
    const group1Length = offset - group1Index;

    // --- 3. GROUP 2: 인코드 데이터 (고정 길이) ---
    const group2Index = offset;
    // 기존 인코드 함수를 buffer와 offset을 인자로 받아 직접 대입하도록 개선 권장
    // 예: offset = saveSystem.encodeToBuffer(buffer, offset, [userSystem.lv, userSystem.exp, userSystem.gold]);
    const encodedData = SaveSystem.numberArrayEncodeV055([UserSystem.lv, UserSystem.exp, UserSystem.gold]);
    for (let i = 0; i < encodedData.length; i++) {
      buffer[offset++] = encodedData[i];
    }
    const group2Length = offset - group2Index;

    // --- 4. GROUP 3: 고정 길이 유저 데이터 ---
    const group3Index = offset;
    const userData = UserSystem.getSaveData();

    // 전개 연산자(...) 대신 for 루프 직접 밀어넣기
    for (let i = 0; i < userData.weaponList.length; i++) buffer[offset++] = userData.weaponList[i];
    for (let i = 0; i < userData.skillList.length; i++) buffer[offset++] = userData.skillList[i];
    for (let i = 0; i < userData.weaponPreset.length; i++) buffer[offset++] = userData.weaponPreset[i];
    buffer[offset++] = userData.weaponPresetNumber;
    for (let i = 0; i < userData.skillPreset.length; i++) buffer[offset++] = userData.skillPreset[i];
    buffer[offset++] = userData.skillPresetNumber;
    buffer[offset++] = userData.equipmentIndex;
    const group3Length = offset - group3Index;

    // --- 5. GROUP 4: 가변 길이 유저 데이터 ---
    const group4Index = offset;

    // 가변 오프셋 헤더 (14개 슬롯) 작성 위치 예약
    const g4HeaderStart = offset;
    offset += 14;

    // 실제 가변 아이템들 쓰면서 오프셋 기록
    const invIdOffset = offset - group4Index;
    for (let i = 0; i < userData.inventoryItemIdList.length; i++) buffer[offset++] = userData.inventoryItemIdList[i];

    const invCountOffset = offset - group4Index;
    for (let i = 0; i < userData.inventoryItemCountList.length; i++) buffer[offset++] = userData.inventoryItemCountList[i];

    const invUpgOffset = offset - group4Index;
    for (let i = 0; i < userData.inventoryItemUpgardeLevel.length; i++) buffer[offset++] = userData.inventoryItemUpgardeLevel[i];

    const wpnUnkOffset = offset - group4Index;
    for (let i = 0; i < userData.weaponUnlockList.length; i++) buffer[offset++] = userData.weaponUnlockList[i];

    const sklUnkOffset = offset - group4Index;
    for (let i = 0; i < userData.skillUnlockList.length; i++) buffer[offset++] = userData.skillUnlockList[i];

    const rndClrOffset = offset - group4Index;
    for (let i = 0; i < userData.roundClearList.length; i++) buffer[offset++] = userData.roundClearList[i];

    const spcFlgOffset = offset - group4Index;
    for (let i = 0; i < userData.specialFlagList.length; i++) buffer[offset++] = userData.specialFlagList[i];

    // G4 내부 오프셋 헤더 기록
    let g4Ptr = g4HeaderStart;
    buffer[g4Ptr++] = invIdOffset;
    buffer[g4Ptr++] = userData.inventoryItemIdList.length;
    buffer[g4Ptr++] = invCountOffset;
    buffer[g4Ptr++] = userData.inventoryItemCountList.length;
    buffer[g4Ptr++] = invUpgOffset;
    buffer[g4Ptr++] = userData.inventoryItemUpgardeLevel.length;
    buffer[g4Ptr++] = wpnUnkOffset;
    buffer[g4Ptr++] = userData.weaponUnlockList.length;
    buffer[g4Ptr++] = sklUnkOffset;
    buffer[g4Ptr++] = userData.skillUnlockList.length;
    buffer[g4Ptr++] = rndClrOffset;
    buffer[g4Ptr++] = userData.roundClearList.length;
    buffer[g4Ptr++] = spcFlgOffset;
    buffer[g4Ptr++] = userData.specialFlagList.length;

    const group4Length = offset - group4Index;
    const endIndex = offset;

    // --- 6. HEADER 최종 백필(Back-fill) 채우기 ---
    let hPtr = headerStart;
    buffer[hPtr++] = SaveSystem.saveHeaderFlag.V055;
    buffer[hPtr++] = 4; // totalGroupCount
    buffer[hPtr++] = group1Index;
    buffer[hPtr++] = group1Length;
    buffer[hPtr++] = group2Index;
    buffer[hPtr++] = group2Length;
    buffer[hPtr++] = group3Index;
    buffer[hPtr++] = group3Length;
    buffer[hPtr++] = group4Index;
    buffer[hPtr++] = group4Length;
    buffer[hPtr++] = endIndex;

    // --- 7. 저장 (유효 데이터 길이만큼만 slice 없이 바로 문자열화) ---
    // subarray는 메모리를 생성하지 않고 0~offset까지의 뷰만 생성함 (Zero-Allocation)
    const validBufferView = buffer.subarray(0, offset);
    const saveString = validBufferView.join(',');

    localStorage.setItem(SaveSystem.getCurrentSaveKey(), saveString);
  }

  /**
   * 해당 키로 데이터 로드 작업을 진행합니다.
   * 
   * @param {string} key 불러올 데이터의 키 값
   * @returns {boolean} 성공 여부
   */
  static processLoadStorageKeyV043 (key) {
    let loadData
    let tamshooter4LoadData = localStorage.getItem(key)
    if (tamshooter4LoadData == null) {
      return false
    }

    try {
      loadData = JSON.parse(tamshooter4LoadData)
    } catch (e) {
      // @ts-ignore
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
      // 옵션을 불러온 다음에는 적용 함수를 실행시켜야 옵션이 적용됩니다.
      this.uiOption.optionValue = loadData.option
      this.uiOption.optionEnable()
    }

    if (loadData.userData) {
      // 데이터형 받아오기용도
      let insertUserData = UserSystem.getSaveData()
      for (let currentKey in insertUserData) {
        if (loadData.userData[currentKey] == null) continue

        //@ts-ignore
        insertUserData[currentKey] = loadData.userData[currentKey]
      }

      // sram으로 처리
      // sramList
      // sram0: lv, exp, gold
      // sram1: inventoryList
      // sram2: inventoryCount
      // sram3: inventoryUpgradeLevel
      // sram4: weaponUnlockList
      // sram5: skillUnlockList
      // sram6: roundClearList
      // sram7: specialFlagList
      let sram0, sram1, sram2, sram3, sram4, sram5, sram6, sram7
      let userLvExp
      if (loadData.sramData) {
        sram0 = loadData.sramData[0]
        userLvExp = SaveSystem.saveNumberDecode(sram0)
        sram1 = loadData.sramData[1]
        sram2 = loadData.sramData[2]
        sram3 = loadData.sramData[3]
        sram4 = loadData.sramData[4]
        sram5 = loadData.sramData[5]
        sram6 = loadData.sramData[6]
        sram7 = loadData.sramData[7]
      }

      // sram0이 없거나, userLvExp가 없으면 오류 발생
      if (sram0 == null || userLvExp == null) {
        this.errorSystem.setErrorCatch(null, this.errorSystem.errorTypeList.LOADERROR, systemText.gameError.USER_SRAM_ERROR)
        return false
      } else {
        insertUserData.lv = userLvExp[0]
        insertUserData.exp = userLvExp[1]
        insertUserData.gold = userLvExp[2]
      }

      if (sram1 != null || sram2 != null || sram3 != null) {
        let decode1 = SaveSystem.saveNumberDecode(sram1)
        let decode2 = SaveSystem.saveNumberDecode(sram2)
        let decode3 = SaveSystem.saveNumberDecode(sram3)
        if (decode1) insertUserData.inventoryItemIdList = decode1
        if (decode2) insertUserData.inventoryItemCountList = decode2
        if (decode3) insertUserData.inventoryItemUpgardeLevel = decode3
      }

      if (sram4 != null) {
        let decode4 = SaveSystem.saveNumberDecode(sram4)
        if (decode4) insertUserData.weaponUnlockList = decode4
      }

      if (sram5 != null) {
        let decode5 = SaveSystem.saveNumberDecode(sram5)
        if (decode5) insertUserData.skillUnlockList = decode5
      }

      if (sram6 != null) {
        let decode6 = SaveSystem.saveNumberDecode(sram6)
        if (decode6) insertUserData.roundClearList = decode6
      }

      if (sram7 != null) {
        let decode7 = SaveSystem.saveNumberDecode(sram7)
        if (decode7) insertUserData.specialFlagList = decode7
      }

      let isSuccessUserData = this.userSystem.setLoadData(insertUserData)
      if (!isSuccessUserData) {
        return false
      }
    }

    // 정상적으로 불러온경우 true 리턴
    return true
  }

  static processLoad () {
    // 이미 불러왔다면 함수는 실행되지 않습니다.
    if (SaveSystem.initLoad) return

    // 초기 불러오기 완료 설정
    SaveSystem.initLoad = true

    // 사용자가 다른 탭으로 이동하거나, 브라우저 창을 최소화하거나, 다른 앱/화면으로 전환할 때 즉시 발생합니다.
    // 그렇다고 해도 2초 제약은 여전히 존재합니다. 저장 간격이 2초보다 짧아질 수 없습니다.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        SaveSystem.requestSave()
      }
    });

    // 이제 버전에 따라 어느 로드 함수를 불러오는지를 결정해야 함
    // 아무 데이터가 없으면 불러오기 하지 않음
    let tamshooter4LoadData = localStorage.getItem(SaveSystem.getCurrentSaveKey())
    if (tamshooter4LoadData == null) return

    // V043은 saveFlag로 특수한 값을 가지고 있으며, 문자열에 이것이 감지되는지를 확인
    let str1 = SaveSystem.saveFlagList.level1V0a43
    let str1Include = tamshooter4LoadData.includes(str1)
    if (str1Include) {
      // V043 로드
      this.processLoadV043()
    } else {
      // V055 로드
      this.processLoadV055()
    }

    // 로드가 끝난 직후, 유저 데이터는 입력되었지만 화면에 갱신되지 않습니다.
    // 이 과정을 처리하기 위해 강제 실행 함수를 사용합니다.
    UserSystem.setSkillDisplayStatDefaultFunction() // 유저 스킬 강제 보여지기
    UserSystem.processStat() // 유저 스탯 강제 재설정

    // 필드 데이터 로드
    this.processFieldLoad()
  }

  /** 필드 데이터를 로드합니다. */
  static processFieldLoad () {
    try {
      let fieldData = localStorage.getItem(SaveSystem.getCurrentSaveKeyField())
      if (fieldData != null) {
        let numberArray = fieldData.split(',').map(Number)
        FieldSystem.fieldSave.array.set(numberArray)
        FieldSystem.fieldSystemLoadData() // 필드 시스템에서 데이터를 로드합니다.
        this.stateId = this.STATE_FIELD // 필드를 강제로 진행하도록 상태 변경
      }
    } catch (e) {
      alert(systemText.gameError.FILED_LOAD_ERROR)
      this.stateId = this.STATE_MAIN
    }
  }

  static processLoadV055 () {
    const tamshooter4LoadData = localStorage.getItem(SaveSystem.getCurrentSaveKey())
    if (tamshooter4LoadData == null) return

    // 로드된 데이터를 split(',') 하고 이걸 Int32Array에 넘깁니다.
    const loadData = Int32Array.from(tamshooter4LoadData.split(','))
    const indexName = SaveSystem.index

    // 헤더 검사는 건너 뜀 (추후 필요하면 작성함)
    if (loadData[indexName.header.SAVE_FLAG] !== SaveSystem.saveHeaderFlag.V055) {
      // 이것은 V055 세이브파일이 아닙니다.
    }

    // 각 그룹별 인덱스 시작 값을 가져옴
    const indexG1 = loadData[SaveSystem.index.header.GROUP1_INDEX_POSITION]
    const countG1 = loadData[SaveSystem.index.header.GROUP1_COUNT_POSITION]
    const indexG2 = loadData[SaveSystem.index.header.GROUP2_INDEX_POSITION]
    const countG2 = loadData[SaveSystem.index.header.GROUP2_COUNT_POSITION]
    const indexG3 = loadData[SaveSystem.index.header.GROUP3_INDEX_POSITION]
    const countG3 = loadData[SaveSystem.index.header.GROUP3_COUNT_POSITION]
    const indexG4 = loadData[SaveSystem.index.header.GROUP4_INDEX_POSITION]
    const countG4 = loadData[SaveSystem.index.header.GROUP4_COUNT_POSITION]

    let group1 = loadData.subarray(indexG1, indexG1 + countG1)
    let group2Decode = loadData.subarray(indexG2, indexG2 + countG2)
    let group2 = SaveSystem.numberArrayDecodeV055(group2Decode)
    let group3 = loadData.subarray(indexG3, indexG3 + countG3)
    let group4 = loadData.subarray(indexG4, indexG4 + countG4)

    // 이제 시작 인덱스 순서에 맞춰서 다시 배열 데이터를 집어넣음
    const I1 = SaveSystem.index.group1OptionData
    this.userSystem.setStartDate(
      group1[I1.SAVE_DATE_YEAR + 0], 
      group1[I1.SAVE_DATE_YEAR + 1], 
      group1[I1.SAVE_DATE_YEAR + 2], 
      group1[I1.SAVE_DATE_YEAR + 3], 
      group1[I1.SAVE_DATE_YEAR + 4], 
      group1[I1.SAVE_DATE_YEAR + 5])
    this.userSystem.setPlayTime(
      group1[I1.PLAY_TIME_HOUR + 0],
      group1[I1.PLAY_TIME_HOUR + 1],
      group1[I1.PLAY_TIME_HOUR + 2]
    )
    this.uiOption.optionValue.musicOn = group1[I1.OPTION_MUSIC_ON] === 1
    this.uiOption.optionValue.musicVolume = group1[I1.OPTION_MUSIC_VOLUME]
    this.uiOption.optionValue.soundOn = group1[I1.OPTION_SOUND_ON] === 1
    this.uiOption.optionValue.soundVolume = group1[I1.OPTION_SOUND_VOLUME]
    this.uiOption.optionValue.resultAutoSkip = group1[I1.OPTION_RESULT_AUTO_SKIP] === 1
    this.uiOption.optionValue.showEnemyHp = group1[I1.OPTION_SHOW_ENEMY_HP] === 1
    this.uiOption.optionValue.showDamage = group1[I1.OPTION_SHOW_DAMAGE] === 1
    this.uiOption.optionEnable() // 불러온 옵션을 적용해야 게임 옵션이 반영됩니다.

    const I2 = SaveSystem.index.group2EncodeData
    if (group2 != null) {
      this.userSystem.lv = group2[I2.LV]
      this.userSystem.exp = group2[I2.EXP]
      this.userSystem.gold = group2[I2.GOLD]
    }


    const I3 = SaveSystem.index.group3UserData
    this.userSystem.weaponList = Array.from(group3.subarray(I3.WEAPON_LIST, I3.WEAPON_LIST + 4))
    this.userSystem.skillList = Array.from(group3.subarray(I3.SKILL_LIST, I3.SKILL_LIST + 8))

    for (let i = 0; i < this.userSystem.weaponPresetList.length; i++) {
      this.userSystem.weaponPresetList[i] = group3[I3.WEAPON_PRESET + i]
    }
    this.userSystem.weaponPresetNumber = group3[I3.WEAPON_PRESET_NUMBER]

    for (let i = 0; i < this.userSystem.skillPresetList.length; i++) {
      this.userSystem.skillPresetList[i] = group3[I3.SKILL_PRESET + i]
    }
    this.userSystem.skillPresetNumber = group3[I3.SKILL_PRESET_NUMBER]

    // 인벤토리 인덱스를 불러온 후, 자기가 불러온 인덱스로 아이템을 강제 장착시킴
    this.userSystem.equipmentIndex = group3[I3.EQUIPMENT_INVENTORY_INDEX]
    this.userSystem.setEquipment(this.userSystem.equipmentIndex)


    // 그룹 4 데이터
    // 그룹 4는 가변데이터 기반이므로, 인덱스 값을 잘 추적해야 함
    const I4 = SaveSystem.index.group4UserData
    const invIdIndex = group4[I4.INVENTORY_IDLIST]
    const invIdCount = group4[I4.INVENTORY_IDLIST_COUNT]
    const invItemIndex = group4[I4.INVENTORY_ITEM_COUNT]
    const invItemCount = group4[I4.INVENTORY_ITEM_COUNT_COUNT]
    const invUpIndex = group4[I4.INVENTORY_UPGRADE_LEVEL]
    const invUpCount = group4[I4.INVENTORY_UPGRADE_LEVEL_COUNT]
    const unlockWeaponIndex = group4[I4.UNLOCK_WEAPON]
    const unlockWeaponCount = group4[I4.UNLOCK_WEAPON_COUNT]
    const unlockSkillIndex = group4[I4.UNLOCK_SKILL]
    const unlockSkillCount = group4[I4.UNLOCK_SKILL_COUNT]
    const roundClearIndex = group4[I4.ROUND_CLEAR]
    const roundClearCount = group4[I4.ROUND_CLEAR_COUNT]
    const specialFlagIndex = group4[I4.SPECIAL_FLAG]
    const specialFlagCount = group4[I4.SPECIAL_FLAG_COUNT]

    const invSubId = group4.subarray(invIdIndex, invIdIndex + invIdCount)
    const invSubItem = group4.subarray(invItemIndex, invItemIndex + invItemCount)
    const invSubUp = group4.subarray(invUpIndex, invUpIndex + invUpCount)

    if (invSubId != null && invSubItem != null && invSubUp != null) {
      for (let i = 0; i < invSubId.length; i++) {
        this.userSystem.inventory.addItem(invSubId[i], invSubItem[i], invSubUp[i])
      }
    }

    this.userSystem.weaponUnlockList = Array.from(group4.subarray(unlockWeaponIndex, unlockWeaponIndex + unlockWeaponCount))
    this.userSystem.skillUnlockList = Array.from(group4.subarray(unlockSkillIndex, unlockSkillIndex + unlockSkillCount))
    this.userSystem.roundClearList = Array.from(group4.subarray(roundClearIndex, roundClearIndex + roundClearCount))
    this.userSystem.specialFlagList = Array.from(group4.subarray(specialFlagIndex, specialFlagIndex + specialFlagCount))
  }

  /** 
   * 불러오기 기능: 게임을 실행할 때 한번만 실행. 만약, 또 불러오기를 하려면 게임을 재시작해주세요. 
   * 
   * 이 버전은 V043을 기준으로 만들어져있으므로, 하위 호환으로만 제공됩니다.
   * 
   * @deprecated
   */
  static processLoadV043 () {
    // 불러오기 작업 진행, 아무것도 없으면 로드 작업 취소
    let tamshooter4LoadData = localStorage.getItem(SaveSystem.getCurrentSaveKey())
    let tamshooter4BackupData = localStorage.getItem(SaveSystem.getCurrentSaveKeyBackup())
    if (tamshooter4LoadData == null && tamshooter4BackupData == null) {
      return
    }

    // 데이터를 불러오고 성공했는지 여부를 판단
    let isSuccess = this.processLoadStorageKeyV043(SaveSystem.getCurrentSaveKey())
    if (!isSuccess) {
      // 만약 실패했다면, 백업데이터를 통해 다시 시도
      let isBackupSuccess = this.processLoadStorageKeyV043(SaveSystem.getCurrentSaveKeyBackup())
      if (!isBackupSuccess) {
        // 이것도 실패했다면, 오류 발생시키고, 다른 메뉴로 이동시킴 (저장 기능은 사용 불가가됨)
        this.stateId = this.STATE_ERROR
        localStorage.removeItem(SaveSystem.getCurrentSaveKeyField())
        return
      }
    }
    
    // 필드가 존재한다면, 해당 규격으로 불러오지 못하고 오류를 발생시키도록 합니다.
    try {
      const fieldSaveData = localStorage.getItem(SaveSystem.getCurrentSaveKeyField())
      if (fieldSaveData) {
        throw new Error('!')
      }
    } catch (e) {
      //@ts-ignore
      this.errorSystem.setErrorCatch(e, this.errorSystem.errorTypeList.FIELDERROR, systemText.gameError.FIELD_NOT_SUPPORT_VERISON)
    }
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
    if (this.stateId === this.STATE_MAIN) {
      this.userSystem.showUserStat()
      this.processSyncUserStatUi()
    }

    this.processUI() // 처리 순서 문제 때문에 UI를 앞에 배치함
    // UI가 뒤에있으면 이중 선택 현상이 벌어짐

    switch (this.stateId) {
      case this.STATE_MAIN: this.mainSystem.process(); break
      case this.STATE_FIELD: this.fieldProcess(); break
    }

    this.processStatLine()
    this.processLoad()
    this.processSave()
    this.processDebug()
  }

  static processUI () {
    this.uiRoundSelect.process()
    this.uiInventroy.process()
    this.uiMisc.process()
    this.uiSkillSelect.process()
    this.uiStatUpgarde.process()
    this.uiWeaponSelect.process()
    this.uiOption.process()
    this.uiDataSetting.process()

    this.uiEquipmentUpgrade.process()
    this.uiItemCrafting.process()
    this.uiBoseokGrowth.process()
  }

  static fieldProcess () {
    try {
      this.fieldSystem.process()
    } catch (e) {
      // @ts-ignore
      this.errorSystem.setErrorCatch(e, this.errorSystem.errorTypeList.FIELDERROR, systemText.gameError.FIELD_ERROR1)
      console.error(e)
    }

    const messageList = this.fieldSystem.messageList
    switch (this.fieldSystem.message) {
      case messageList.CHANGE_MUSICON:
        this.uiOption.optionValue.musicOn = !this.uiOption.optionValue.musicOn
        this.uiOption.optionEnable()
        break
      case messageList.CHANGE_SOUNDON:
        this.uiOption.optionValue.soundOn = !this.uiOption.optionValue.soundOn
        this.uiOption.optionEnable()
        break
      case messageList.STATE_MAIN:
        this.stateId = this.STATE_MAIN
        break
      case messageList.STATE_FIELD:
        this.stateId = this.STATE_FIELD
        break
      case messageList.REQUEST_SAVE:
        SaveSystem.requestSave()
        this.processSave()
        break
    }

    // 메세지는 처리된 후 지워져야 합니다.
    this.fieldSystem.message = ''

    // 사운드 음악 옵션을 필드에게 전달
    FieldSystem.option.musicOn = this.uiOption.optionValue.musicOn
    FieldSystem.option.soundOn = this.uiOption.optionValue.soundOn
  }

  // 디버그 용도로 사용되는 함수
  static processDebug () {

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
   * 플레이어의 스탯을 화면 UI랑 동기화 시킵니다. (메인 화면 전용 함수)
   * 
   * 이 함수는 state = STATE_MAIN 상태에서만 호출해야 합니다.
   */
  static processSyncUserStatUi () {
    if (this.stateId !== this.STATE_MAIN) return
    UserSystem.setStatUiHpShield(UserSystem.hp, UserSystem.shield, UserSystem.shieldMax)
    UserSystem.setSkillDisplayStatDefaultFunction()
  }

  /**
   * 게임에 관한 모든 출력은 여기서 진행합니다.
   * [display 함수 내에세 게임에 관한 모든 처리 금지, 출력 함수만 사용하세요.]
   */
  static display () {
    game.graphic.clearCanvas() // 화면 지우기

    if (this.stateId === this.STATE_ERROR) {
      this.errorSystem.display()
      return
    }

    // 화면 출력
    switch (this.stateId) {
      case this.STATE_MAIN: this.mainSystem.display(); break
    }

    if (this.stateId === this.STATE_FIELD) {
      try {
        this.fieldSystem.display()
      } catch (e) {
        // @ts-ignore
        this.errorSystem.setErrorCatch(e, this.errorSystem.errorTypeList.FIELDERROR, e.message)
        console.error(e)
      }
    }

    if (this.stateId === this.STATE_MAIN || this.stateId === this.STATE_FIELD) {
      this.userSystem.display()
      this.displayStatLine()
    }
    
    this.displayUI()
  }

  static displayUI () {
    this.uiRoundSelect.display()
    this.uiInventroy.display()
    this.uiMisc.display()
    this.uiOption.display()
    this.uiSkillSelect.display()
    this.uiStatUpgarde.display()
    this.uiWeaponSelect.display()
    this.uiDataSetting.display()

    // layer 2
    this.uiEquipmentUpgrade.display()
    this.uiItemCrafting.display()
    this.uiBoseokGrowth.display()
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