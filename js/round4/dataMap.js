//@ts-check

import { TamsaEngine } from "../tamsaEngine/tamsaEngine.js"

const game = new TamsaEngine('Tamshooter4 R4 MapEditor', 800, 600, 60, true)

/**
 * 충돌 감지 함수 (x, y, w, h) x 2
 * @param {number} ax
 * @param {number} ay
 * @param {number} aw
 * @param {number} ah
 * @param {number} bx
 * @param {number} by
 * @param {number} bw
 * @param {number} bh
 * @returns {boolean}
 */
export function collisionObject(
  ax, ay, aw, ah,
  bx, by, bw, bh
) {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  )
}

class UIBox {
  /**
   * UI에 일부에 해당하는 박스를 생성합니다.  
   * 이것은 클릭 값을 인식할 수 있습니다. 단, 클릭의 기능을 구현하진 않습니다.
   * @param {number} x 
   * @param {number} y 
   * @param {number} width 
   * @param {number} height 
   * @returns 
   */
  constructor (x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.sliceX = 0
    this.sliceY = 0
    this.sliceWidth = 0
    this.sliceHeight = 0
    this.imageSrc = ''
    this.color = ''
    return this
  }

  /**
   * 마우스와 충돌되었는지 여부를 확인합니다.
   * @param {number} mouseX 
   * @param {number} mouseY 
   * @returns {boolean}
   */
  collision (mouseX, mouseY) {
    return mouseX >= this.x &&
      mouseX < this.x + this.width &&
      mouseY >= this.y &&
      mouseY < this.y + this.height
  }

  /**
   * 이미지를 설정합니다.
   * @param {string} imageSrc 
   * @param {number} sliceX 
   * @param {number} sliceY 
   * @param {number} sliceWidth 
   * @param {number} sliceHeight 
   */
  setImage (imageSrc, sliceX, sliceY, sliceWidth, sliceHeight) {
    this.imageSrc = imageSrc
    this.sliceX = sliceX
    this.sliceY = sliceY
    this.sliceWidth = sliceWidth
    this.sliceHeight = sliceHeight
  }

  setImageObject () {
    console.warn('함수는 구현되지 않았음.')
  }

  display () {
    if (this.imageSrc !== '') {
      // imageDisplay
    } else if (this.color !== '') {
      game.graphic.fillRect(this.x, this.y, this.width, this.height, this.color, 0.8)
    }
  }
}

class MapData {
  /** 각 타일의 실제 픽셀 크기 */ static TILE_SIZE = 40
  /** 오브젝트 하나를 구성하는 데이터 원소 개수 */ static OBJECT_DATA_STRIDE = 3

  /**
   * 맵 데이터를 생성합니다. 맵 크기는 인덱스 기반으로 맞추어 설정됩니다.
   * @param {number} indexWidth 맵 인덱스 개수의 너비
   * @param {number} indexHeight 맵 인덱스 개수의 높이
   */
  constructor (indexWidth, indexHeight) {
    /** 맵 인덱스 개수의 너비 @type {number} */ this.indexWidth = indexWidth
    /** 맵 인덱스 개수의 높이 @type {number} */ this.indexHeight = indexHeight
    /** 맵 오브젝트 개수 @type {number} */ this.objectCount = 0

    /** 맵의 전체 데이터 int32로만 관리 
     * 
     * 데이터 규칙: 가로 1줄을 indexWidth까지 채우고, 다음 데이터는 다음 줄로 넘어갑니다.  
     * 예를 들어, indexWidth가 10이면, 0 ~ 9: 0번째 줄, 10 ~ 19: 1번째 줄, 20 ~ 29: 2번째 줄  
     * @type {Int32Array} */ 
    this.tileData = new Int32Array(this.indexWidth * this.indexHeight)

    /** 오브젝트의 전체 데이터 int32로만 관리
     * 
     * 데이터 규칙: ID, X, Y 이렇게 3쌍을 연속적으로 배치합니다.  
     * 이 좌표는 인덱스 기반이 아닙니다!
     * 
     * objectData는 기본 오브젝트 할당 개수가 100개이지만, 만약 개수가 더 늘어나면 자동으로 이 길이를 확장합니다.
     * @type {Int32Array} */ this.mapObject = new Int32Array(100 * 3)
  }

  /**
   * 새로운 오브젝트를 맵 데이터에 생성합니다.
   * 
   * @param {number} objectId 
   * @param {number} x 월드 좌표 X (픽셀)
   * @param {number} y 월드 좌표 Y (픽셀)
   */
  createObject (objectId, x, y) {
    if (x < 0 || y < 0) {
      console.warn('마이너스 좌표를 허용하지 않습니다.')
      return
    }

    // 오브젝트 제한이 초과될 경우, 자동으로 배열 길이를 100칸씩 증가시킵니다.
    // 이후 이전 데이터는 새 데이터에 포함하여 배열이 새로 할당합니다.
    if (this.objectCount >= this.mapObject.length / 3) {
      const newData = new Int32Array(this.mapObject.length + 100 * 3)
      newData.set(this.mapObject)
      this.mapObject = newData
    }

    const INDEX = this.objectCount * MapData.OBJECT_DATA_STRIDE
    this.mapObject[INDEX + 0] = objectId
    this.mapObject[INDEX + 1] = x
    this.mapObject[INDEX + 2] = y

    // 오브젝트가 추가된 이후, 오브젝트의 개수를 증가시킵니다.
    // 이 작업은 다음 인덱스 지정에도 영향을 줍니다.
    this.objectCount++
  }

  /**
   * 타일 값을 설정합니다.
   * @param {number} indexX 
   * @param {number} indexY 
   * @param {number} number 
   */
  setTile (indexX, indexY, number) {
    if (indexX < 0 || indexY < 0 || number < 0) {
      console.warn('마이너스 좌표 또는 값을 허용하지 않습니다.')
      return
    }

    if (indexX >= this.indexWidth || indexY >= this.indexHeight) {
      console.warn('잘못된 좌표 인덱스 접근입니다. 크기를 확인해주세요.')
      console.warn(`X: ${indexX}, WIDTH: ${this.indexWidth}, Y: ${indexY}, HEIGHT: ${this.indexHeight}`)
      return
    }

    const INDEX = indexY * this.indexWidth + indexX
    this.tileData[INDEX] = number
  }

  /**
   * 타일 값을 가져옵니다.
   * @param {number} indexX 
   * @param {number} indexY 
   * @returns {number}
   */
  getTile (indexX, indexY) {
    const INDEX = indexY * this.indexWidth + indexX
    return this.tileData[INDEX]
  }
}

class MapEditor {
  /** 기본 (zoomLevel 1 기준) 화면에 표시되는 인덱스의 좌표 너비 */ static SCREEN_INDEX_WIDTH = 20
  /** 기본 (zoomLevel 1 기준) 화면에 표시되는 인덱스의 좌표 높이 */ static SCREEN_INDEX_HEIGHT = 15
  /** 에디터를 처음 열었을 때 기본으로 설정되는 인덱스의 좌표 너비 */ static DEFAULT_SETTING_WIDTH = 20 * 2
  /** 에디터를 처음 열었을 때 기본으로 설정되는 인덱스의 좌표 높이 */ static DEFAULT_SETTING_HEIGHT = 15 * 2
  
  static UI_AREA = (() => {
    const tile = MapData.TILE_SIZE
    const half = tile / 2
    const quarter = tile / 4
    const oneAndHalf = tile + half
    const canvasWidth = game.graphic.CANVAS_WIDTH
    const canvasHeight = game.graphic.CANVAS_HEIGHT

    // 하단 좌측 기준선(x: 1.5타일)과 하단 우측 화살표 패드 기준선
    const leftX = oneAndHalf
    const arrowX = canvasWidth - (tile * 3) + (tile / 4)
    const arrowY = canvasHeight - (tile * 3) + (tile / 4)
    const arrowSize = oneAndHalf

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {string} color 
     * @returns 
     */
    const makeBox = (x, y, width, height, color = '') => {
      const box = new UIBox(x, y, width, height)
      box.color = color
      return box
    }

    const arrow = makeBox(arrowX, arrowY, arrowSize, arrowSize, 'grey')
    const menu = makeBox(
      leftX,
      canvasHeight - (tile * 7) + half,
      tile * 6,
      tile * 4,
      'grey'
    )
    const menuIconY = menu.y + half + quarter

    return [
      makeBox(leftX, canvasHeight - (tile * 2) - half, tile * 2, tile, 'grey'), // menuIcon
      makeBox(arrow.x, arrow.y + half, half, half, 'orange'), // left
      makeBox(arrow.x + half, arrow.y, half, half, 'darkorange'), // up
      makeBox(arrow.x + half, arrow.y + tile, half, half, 'orange'), // down
      makeBox(arrow.x + tile, arrow.y + half, half, half, 'lightorange'), // right
      //---
      menu,
      makeBox(menu.x + quarter, menuIconY, tile, tile, 'pink'), // new
      makeBox(menu.x + tile + quarter, menuIconY, tile, tile, 'gold'), // save
      makeBox(menu.x + (tile * 2) + quarter, menuIconY, tile, tile, 'yellow'), // load
      makeBox(menu.x + quarter, menu.y + menu.height - tile - quarter, tile * 5, tile), // tile
      makeBox(menu.x + (tile * 4) + quarter, menuIconY, tile, tile, 'slateblue'), // zoom
    ]
  })()

  static UI_ID = (() => {
    let nextId = 0

    return {
      /** 참고: 기본값으로 사용합니다. NONE과 동일한 값입니다. */ GRID: -1,
      /** 참고: 기본값으로 사용합니다. */ NONE: -1,

      MENU_ICON: nextId++,
      ARROW_LEFT: nextId++,
      ARROW_UP: nextId++,
      ARROW_DOWN: nextId++,
      ARROW_RIGHT: nextId++,

      MENU: nextId++,
      MENU_NEW: nextId++,
      MENU_SAVE: nextId++,
      MENU_LOAD: nextId++,
      MENU_TILE: nextId++,
      MENU_ZOOM: nextId++
    }
  })()

  /** 에디트 모드 설정 값 */
  static EDIT_MODE = {
    /** 모드 없음 */ NONE: 0,
    /** 그리기 모드 */ DRAW: 1,
    /** 지우기 모드 */ ERASE: 2,
  };

  /** 카메라 이동 방향 값 */
  static CAMERA_MOVE = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
  }

  /** 마우스 전용 에디트 모드 값. 이 값에 따라 맵 타일을 그릴지 여부가 결정 */
  editModeMouse = MapEditor.EDIT_MODE.NONE

  /** 현재 누른 마우스 입력의 대상 ID. 선택되지 않은 상태는 NONE @type {number} */
  mouseCollisionId = MapEditor.UI_ID.NONE

  /** UI가 오픈되어 있는지에 대한 여부, 화살표키와 관계없음 */
  isMenuOpen = true

  /** 메뉴 오픈을 변경합니다. (열고 닫기) */
  changeMenuOpen () {
    this.isMenuOpen = !this.isMenuOpen
  }

  /** 맵 에디터 화면 배율 (1x, 2x) 설정값 */
  #zoomLevel = 2

  /** 맵 에디터 화면 배율 (1x, 2x) 설정값 */
  get zoomLevel () { return this.#zoomLevel }

  /** 맵 에디터 화면 배율 (1x, 2x) 설정값 */
  set zoomLevel (value) { 
    if (value !== 1 && value !== 2) {
      console.warn('잘못된 배율값은 허용하지 않습니다.')
      return
    }

    this.#zoomLevel = value

    // 줌 레벨이 증가한 경우, 카메라 위치는 최대 값에 맞도록 재조정됩니다.
    const maxCameraX = Math.max(0, this.map.indexWidth - this.screenWidth)
    const maxCameraY = Math.max(0, this.map.indexHeight - this.screenHeight)

    this.cameraX = Math.min(this.cameraX, maxCameraX)
    this.cameraY = Math.min(this.cameraY, maxCameraY)
  }

  /** 줌을 변경합니다. */
  changeZoom () {
    // 줌은 1 또는 2배로만 설정할 수 있습니다.
    this.zoomLevel = this.zoomLevel === 1 ? 2 : 1
  }

  /** 스크린에 표시될 수 있는 너비 개수를 가져옵니다. zoomLevel에 영향을 받습니다. */
  get screenWidth () { 
    return MapEditor.SCREEN_INDEX_WIDTH * this.#zoomLevel
  }

  /** 스크린에 표시될 수 있는 높이 개수를 가져옵니다. zoomLevel에 영향을 받습니다. */
  get screenHeight () {
    return MapEditor.SCREEN_INDEX_HEIGHT * this.#zoomLevel
  }

  /** 타일 출력 크기를 가져옵니다. (주의: 타일에게만 사용하세요. UI같은데에는 사용하면 안됩니다.) */
  get tileDisplaySize () {
    return MapData.TILE_SIZE / this.zoomLevel
  }

  // 참고: 코드 힌트를 위해 맵 데이터는 기본 값 형태로 할당합니다.
  /** 맵 데이터 @type {MapData} */ 
  map = new MapData(MapEditor.DEFAULT_SETTING_WIDTH, MapEditor.DEFAULT_SETTING_HEIGHT)

  constructor () {
    this.cursor = { 
      /** 인덱스 번호 @type {number} */ index: 0, 
      /** 타일 선택 번호 (커서 기준이며, 0부터 시작합니다.) 
       * (실제 타일 번호는 +1을 하거나 또는 currentTileNumber등의 변수를 사용하세요.) 
       * @type {number} */ tile: 0, 
      // 그 외 필요한 것 있으면 추가해
    }

    /** 보여지는 카메라의 기준점이 되는 좌표 X @type {number} */ this.cameraX = 0
    /** 보여지는 카메라의 기준점이 되는 좌표 Y @type {number} */ this.cameraY = 0
  }

  /**
   * 맵 데이터를 불러옵니다.  
   * 참고: 불러온 데이터는 복사되며, 원본 데이터를 변경하지 않습니다.
   * @param {MapData} map 맵 데이터
   */
  loadMap (map) {
    this.map = map
  }

  /**
   * 맵 데이터를 생성합니다. 맵 크기는 인덱스 기반으로 맞추어 설정됩니다.  
   * 기존 맵 데이터는 새로운 데이터로 덮어 씌웁니다.
   * @param {number} indexWidth 맵 인덱스 개수의 너비
   * @param {number} indexHeight 맵 인덱스 개수의 높이
   */
  createMap (indexWidth, indexHeight) {
    const map = new MapData(indexWidth, indexHeight)
    this.map = map
  }

  /** 화면 안에서 커서의 X 좌표를 얻어옵니다. */
  get cursorX () { return this.cursor.index % this.screenWidth }

  /** 화면 안에서 커서의 Y 좌표를 얻어옵니다. */
  get cursorY () { return Math.floor(this.cursor.index / this.screenWidth) }

  /** 현재 선택된 타일 번호를 얻어옵니다. 주의: 타일 커서 값이 아닙니다. 커서 타일은 this.cursor 변수 내부에 있습니다. */
  get currentTileNumber () { return this.cursor.tile + 1 }

  /** 맵을 기준으로 했을 때, 실제로 선택된 타일의 좌표 */
  get tileX () { return this.cameraX + this.cursorX }

  /** 맵을 기준으로 했을 때, 실제로 선택된 타일의 좌표 */
  get tileY () { return this.cameraY + this.cursorY }

  /** 화면에서 커서가 가질 수 있는 최대 인덱스 */
  get maxCursorIndex () { return this.screenWidth * this.screenHeight - 1 }

  insertTile () {
    const insertX = this.cameraX + this.cursorX
    const insertY = this.cameraY + this.cursorY

    // 그리기 모드일 때 타일을 입력하고, 지우기 모드일 때 타일을 지웁니다. 0 = 타일 없음.
    if (this.editModeMouse === MapEditor.EDIT_MODE.DRAW) {
      this.map.setTile(insertX, insertY, this.currentTileNumber)
    } else if (this.editModeMouse === MapEditor.EDIT_MODE.ERASE) {
      this.map.setTile(insertX, insertY, 0)
    }
  }

  /** 타일 번호를 변경합니다. */
  changeTileNumber () {
    this.cursor.tile++

    const TILE_MAX = 5
    if (this.cursor.tile >= TILE_MAX) {
      this.cursor.tile = 0
    }
  }

  /**
   * 에디트 모드를 변경합니다. 상수는 static 참조
   * @param {number} mapEditorEditModeNumber 
   */
  changeEditMode (mapEditorEditModeNumber) {
    this.editModeMouse = mapEditorEditModeNumber
  }

  /** 너가 선택한 타일에 따라 자동으로 모드를 변경한다. */
  autoChangeEditMode () {
    const number = this.map.getTile(this.tileX, this.tileY)
    if (number === 0) {
      this.editModeMouse = MapEditor.EDIT_MODE.DRAW
    } else {
      this.editModeMouse = MapEditor.EDIT_MODE.ERASE
    }
  }

  /** 너가 메뉴 내에서 선택한 타일 번호에 따라 자동으로 모드를 변경한다. */
  autoChangeTileSetting () {
    // 메뉴가 열리지 않은 상태에서는, 타일 선택을 할 수 없습니다.
    if (!this.isMenuOpen) return

    // 메뉴가 열렸다고 가정하고, 코드 작성: 왜냐하면 collisionID는 1개만 가져올 수 있기 때문
    // 일단, 타일이 선택되었는지를 먼저 확인, 타일 선택이 아니라면 취소
    if (this.uiCollision() !== MapEditor.UI_ID.MENU_TILE) return

    // 타일이 선택된 경우, 마우스 위치를 계산
    const mouseX = game.control.getMouseX()
    const mouseY = game.control.getMouseY()

    // 타일 위치 계산
    const area = MapEditor.UI_AREA[MapEditor.UI_ID.MENU_TILE]
    const tileIndex = Math.floor((mouseX - area.x) / MapData.TILE_SIZE)
    this.cursor.tile = tileIndex
  }

  /**
   * 마우스가 겹친 UI 영역의 ID를 반환합니다
   * @deprecated
   * @returns {number}
   */
  uiCollision () {
    const mouseX = game.control.getMouseX()
    const mouseY = game.control.getMouseY()

    // 열린 메뉴에서는 세 가지 고정 아이콘과 타일 선택 줄을 우선 검사합니다.
    if (this.isMenuOpen && MapEditor.UI_AREA[MapEditor.UI_ID.MENU].collision(mouseX, mouseY)) {
      if (MapEditor.UI_AREA[MapEditor.UI_ID.MENU_NEW].collision(mouseX, mouseY)) return MapEditor.UI_ID.MENU_NEW
      if (MapEditor.UI_AREA[MapEditor.UI_ID.MENU_SAVE].collision(mouseX, mouseY)) return MapEditor.UI_ID.MENU_SAVE
      if (MapEditor.UI_AREA[MapEditor.UI_ID.MENU_LOAD].collision(mouseX, mouseY)) return MapEditor.UI_ID.MENU_LOAD
      if (MapEditor.UI_AREA[MapEditor.UI_ID.MENU_ZOOM].collision(mouseX, mouseY)) return MapEditor.UI_ID.MENU_ZOOM

      // 타일 버튼은 일정한 크기로 가로 배치되어 있어 전체 줄의 영역으로 판정합니다.
      if (MapEditor.UI_AREA[MapEditor.UI_ID.MENU_TILE].collision(mouseX, mouseY)) return MapEditor.UI_ID.MENU_TILE

      // 메뉴 패널 안의 나머지 부분도 그리드 입력으로 전달하지 않습니다.
      return MapEditor.UI_ID.MENU
    }

    // 화살표 버튼별 영역을 먼저 판정해 입력 ID를 구분합니다.
    if (MapEditor.UI_AREA[MapEditor.UI_ID.ARROW_LEFT].collision(mouseX, mouseY)) return MapEditor.UI_ID.ARROW_LEFT
    if (MapEditor.UI_AREA[MapEditor.UI_ID.ARROW_UP].collision(mouseX, mouseY)) return MapEditor.UI_ID.ARROW_UP
    if (MapEditor.UI_AREA[MapEditor.UI_ID.ARROW_DOWN].collision(mouseX, mouseY)) return MapEditor.UI_ID.ARROW_DOWN
    if (MapEditor.UI_AREA[MapEditor.UI_ID.ARROW_RIGHT].collision(mouseX, mouseY)) return MapEditor.UI_ID.ARROW_RIGHT
    if (MapEditor.UI_AREA[MapEditor.UI_ID.MENU_ICON].collision(mouseX, mouseY)) return MapEditor.UI_ID.MENU_ICON

    return MapEditor.UI_ID.GRID
  }

  /**
   * 카메라를 이동시킵니다. 이동 방향에 따라 화면의 절반씩 이동합니다.
   * @param {number} moveDirection 
   */
  cameraMove (moveDirection) {
    const cameraPageWidth = Math.floor(this.screenWidth / 2)
    const cameraPageHeight = Math.floor(this.screenHeight / 2)
    const maxCameraX = Math.max(0, this.map.indexWidth - this.screenWidth)
    const maxCameraY = Math.max(0, this.map.indexHeight - this.screenHeight)

    // 카메라는, Math.max, Math.min으로 범위 안에 위치하도록 합니다.
    switch (moveDirection) {
      case MapEditor.CAMERA_MOVE.UP:
        this.cameraY = Math.max(
          this.cameraY - cameraPageHeight,
          0
        )
        break
      case MapEditor.CAMERA_MOVE.DOWN:
        this.cameraY = Math.min(
          this.cameraY + cameraPageHeight,
          maxCameraY
        )
        break
      case MapEditor.CAMERA_MOVE.LEFT:
        this.cameraX = Math.max(
          this.cameraX - cameraPageWidth,
          0
        )
        break
      case MapEditor.CAMERA_MOVE.RIGHT:
        this.cameraX = Math.min(
          this.cameraX + cameraPageWidth,
          maxCameraX
        )
        break
    }
  }

  process () {
    this.processMouse()
    this.processButton()
    this.processSelect()
  }

  processSelect () {
    
  }

  processMouse () {
    this.processMouseMoveCursor()
    this.processMouseClick()
    this.processMouseDown()
  }

  processMouseClick () {
    if (!game.control.getMouseClick()) return

    // 마우스를 클릭하면, 현재 선택된 타일에 따라 에디트 모드를 자동으로 변경합니다.
    // 주의: 여기에 타일을 삽입하면, 마우스를 뗄 때도 타일이 중복 입력되므로, 여기엔
    // 타일을 삽입하지 마세요.
    // this.autoChangeEditMode()

    // 여기서는 1회성으로만 동작해야 하는 기능을 입력합니다.
    // 드래그 기능같은게 필요하다면 click에 구현하지 마세요.
    
    // 충돌 처리한 개체가 없을 때는, 마우스 클릭 여부를 처리하지 않습니다.
    if (this.mouseCollisionId === MapEditor.UI_ID.NONE) {
      return
    }

    switch (this.mouseCollisionId) {
      case MapEditor.UI_ID.MENU_ICON:
        this.changeMenuOpen()
        break
      case MapEditor.UI_ID.MENU_NEW:
        // 메뉴 열기/닫기 아이콘 입력 처리
        break
      case MapEditor.UI_ID.MENU_SAVE:
        // 메뉴 열기/닫기 아이콘 입력 처리
        break
      case MapEditor.UI_ID.MENU_LOAD:
        // 메뉴 열기/닫기 아이콘 입력 처리
        break
      case MapEditor.UI_ID.MENU_ZOOM:
        this.changeZoom()
        break
      case MapEditor.UI_ID.ARROW_LEFT:
        this.cameraMove(MapEditor.CAMERA_MOVE.LEFT)
        break
      case MapEditor.UI_ID.ARROW_RIGHT:
        this.cameraMove(MapEditor.CAMERA_MOVE.RIGHT)
        break
      case MapEditor.UI_ID.ARROW_DOWN:
        this.cameraMove(MapEditor.CAMERA_MOVE.DOWN)
        break
      case MapEditor.UI_ID.ARROW_UP:
        this.cameraMove(MapEditor.CAMERA_MOVE.UP)
        break
      case MapEditor.UI_ID.MENU_TILE:
        // 타일
        this.autoChangeTileSetting()
        break
    }
  }

  processMouseDown () {
    // 마우스가 눌리지 않은 상태에서는 에디트 모드를 없음으로 정합니다. (아무것도 안하기 위해서)
    if (!game.control.getMouseDown()) {
      this.editModeMouse = MapEditor.EDIT_MODE.NONE
      this.mouseCollisionId = MapEditor.UI_ID.NONE
      return
    }

    const mouseX = game.control.getMouseX()
    const mouseY = game.control.getMouseY()

    /** UI 처리 순서 목록, 해당 영역이 먼저 충돌되면 다른 기능은 동작하지 않습니다. */
    const checkOrder = [
      MapEditor.UI_ID.MENU_NEW,
      MapEditor.UI_ID.MENU_SAVE,
      MapEditor.UI_ID.MENU_LOAD,
      MapEditor.UI_ID.MENU_ZOOM,
      MapEditor.UI_ID.MENU_TILE,
      MapEditor.UI_ID.MENU,
      MapEditor.UI_ID.ARROW_LEFT,
      MapEditor.UI_ID.ARROW_UP,
      MapEditor.UI_ID.ARROW_DOWN,
      MapEditor.UI_ID.ARROW_RIGHT,
      MapEditor.UI_ID.MENU_ICON
    ]

    this.mouseCollisionId = MapEditor.UI_ID.GRID

    for (let i = 0; i < checkOrder.length; i++) {
      const id = checkOrder[i]

      // 메뉴가 열려있지 않으면, 메뉴 관련 기능은 처리되지 않음. (마우스 클릭 기준)
      if (!this.isMenuOpen) {
        if (
          id === MapEditor.UI_ID.MENU_NEW ||
          id === MapEditor.UI_ID.MENU_SAVE ||
          id === MapEditor.UI_ID.MENU_LOAD ||
          id === MapEditor.UI_ID.MENU_TILE ||
          id === MapEditor.UI_ID.MENU_ZOOM
        ) continue
      }

      if (MapEditor.UI_AREA[id].collision(mouseX, mouseY)) {
        this.mouseCollisionId = id
        break
      }
    }

    // UI 영역과 그리드 영역 중 선택된 한 대상만 처리합니다.
    switch (this.mouseCollisionId) {
      case MapEditor.UI_ID.GRID:
        // 그리드에서 시작한 입력만 타일 편집으로 전달합니다.
        if (this.editModeMouse === MapEditor.EDIT_MODE.NONE) {
          this.autoChangeEditMode()
        }
        this.insertTile()
        break
    }
  }

  /** 마우스가 움직이면, 선택된 커서를 변경시킵니다. */
  processMouseMoveCursor () {
    if (!game.control.getMouseMove()) return

    const indexX = Math.floor(game.control.getMouseX() / this.tileDisplaySize)
    const indexY = Math.floor(game.control.getMouseY() / this.tileDisplaySize)
    if (indexX < 0 || indexY < 0 || indexX >= this.screenWidth || indexY >= this.screenHeight) return

    this.cursor.index = indexY * this.screenWidth + indexX
  }

  /** 버튼 입력에 따라 커서를 인접한 타일로 이동합니다. */
  processButton () {
    const control = game.control
    const button = control.buttonIndex

    if (control.getButtonInput(button.A)) {
      // 버튼 A를 입력하면 자동으로 모드를 변경하고, 타일을 삽입합니다.
      // 참고: 마우스 입력값으로 모드는 다시 자동 변경합니다.
      // 버튼과 마우스 동시 사용 시에는, 예상하기 어려운 동작을 발생할 수 있습니다.
      this.autoChangeEditMode()
      this.insertTile()
    } else if (control.getButtonInput(button.B)) {
      this.changeMenuOpen()
    } else if (control.getButtonInput(button.X)) {
      this.changeTileNumber()
    } else if (control.getButtonInput(button.Y)) {
      this.changeZoom()
    } else if (control.getButtonDown(button.L1)) {
      // L1키를 누른 상태에서는 카메라를 조작합니다.
      if (control.getButtonInput(button.LEFT)) {
        this.cameraMove(MapEditor.CAMERA_MOVE.LEFT)
      } else if (control.getButtonInput(button.RIGHT)) {
        this.cameraMove(MapEditor.CAMERA_MOVE.RIGHT)
      } else if (control.getButtonInput(button.UP)) {
        this.cameraMove(MapEditor.CAMERA_MOVE.UP)
      } else if (control.getButtonInput(button.DOWN)) {
        this.cameraMove(MapEditor.CAMERA_MOVE.DOWN)
      }
    } else {
      // 다른 키를 조합할 때 화살표키 이동 처리를 막기 위해, else로 따로 구분함.
      this.processButtonMoveCursor()
    }
  }

  processButtonMoveCursor () {
    const control = game.control
    const button = control.buttonIndex
    const maxIndex = this.maxCursorIndex
    if (this.map.indexWidth <= 0 || this.map.indexHeight <= 0) return

    this.cursor.index = Math.max(0, Math.min(this.cursor.index, maxIndex))

    let moveX = 0
    let moveY = 0
    let cameraDirection = MapEditor.CAMERA_MOVE.RIGHT

    if (control.getButtonInput(button.LEFT)) {
      moveX = -1
      cameraDirection = MapEditor.CAMERA_MOVE.LEFT
    } else if (control.getButtonInput(button.RIGHT)) {
      moveX = 1
      cameraDirection = MapEditor.CAMERA_MOVE.RIGHT
    } else if (control.getButtonInput(button.UP)) {
      moveY = -1
      cameraDirection = MapEditor.CAMERA_MOVE.UP
    } else if (control.getButtonInput(button.DOWN)) {
      moveY = 1
      cameraDirection = MapEditor.CAMERA_MOVE.DOWN
    }

    if (moveX !== 0 || moveY !== 0) {
      // 커서의 다음 위치를 맵 좌표로 구하고 맵 바깥으로 나가지 않게 제한합니다.
      const maxMapX = this.map.indexWidth - 1
      const maxMapY = this.map.indexHeight - 1
      const targetMapX = Math.max(0, Math.min(this.tileX + moveX, maxMapX))
      const targetMapY = Math.max(0, Math.min(this.tileY + moveY, maxMapY))

      // 다음 맵 타일이 현재 화면 밖이면 카메라를 이동한 뒤 화면 좌표로 다시 환산합니다.
      // 이로 인하여, 커서 위치는 중앙으로 자동 이동됩니다.
      const targetIsOutsideCamera =
        targetMapX < this.cameraX ||
        targetMapX >= this.cameraX + this.screenWidth ||
        targetMapY < this.cameraY ||
        targetMapY >= this.cameraY + this.screenHeight

      if (targetIsOutsideCamera) this.cameraMove(cameraDirection)

      const nextCursorX = targetMapX - this.cameraX
      const nextCursorY = targetMapY - this.cameraY
      this.cursor.index = nextCursorY * this.screenWidth + nextCursorX
    }
  }

  display () {
    this.displayMapTile()
    this.displayGrid()
    this.displayArrowButton()
    this.displayMenuIcon()
    this.displayMenu()
    this.displayDebug()
  }

  displayMenuIcon () {
    const BLOCK_SIZE = MapData.TILE_SIZE
    const area = MapEditor.UI_AREA[MapEditor.UI_ID.MENU_ICON]
    const iconX = area.x
    const iconY = area.y

    MapEditor.UI_AREA[MapEditor.UI_ID.MENU_ICON].display()
    this.displayTargetTile(this.currentTileNumber, iconX + BLOCK_SIZE, iconY)
  }

  displayMenu () {
    if (!this.isMenuOpen) return

    const BLOCK_SIZE = MapData.TILE_SIZE
    const BLOCK_QUARTER_SIZE = BLOCK_SIZE / 4
    const area = MapEditor.UI_AREA[MapEditor.UI_ID.MENU]
    const panelX = area.x
    const panelY = area.y
    const panelWidth = area.width
    const panelHeight = area.height

    // UI 패널
    game.graphic.fillRect(panelX, panelY, panelWidth, panelHeight, 'grey', 0.7)
    // game.graphic.strokeRect(panelX, panelY, panelWidth, panelHeight, 'white')

    // 현재 맵 정보와 선택된 타일을 표시합니다.
    const mapText = `MAP: ${this.map.indexWidth}x${this.map.indexHeight}`
    const cameraText = `CAMERA: ${this.cameraX}x${this.cameraY}`

    game.graphic.setFontSize(16)
    game.graphic.fillText(mapText + ', ' + cameraText, panelX + BLOCK_QUARTER_SIZE, panelY + BLOCK_QUARTER_SIZE, 'white')

    // 메뉴 아이콘 (새로 만들기, 저장, 불러오기)
    MapEditor.UI_AREA[MapEditor.UI_ID.MENU_NEW].display()
    MapEditor.UI_AREA[MapEditor.UI_ID.MENU_SAVE].display()
    MapEditor.UI_AREA[MapEditor.UI_ID.MENU_LOAD].display()
    MapEditor.UI_AREA[MapEditor.UI_ID.MENU_ZOOM].display()

    // 타일의 Y 좌표는 패널 밑부분을 기준으로 배치합니다.
    const tileList = [1, 2, 3, 4, 5]
    const tileY = panelY + panelHeight - BLOCK_SIZE - BLOCK_QUARTER_SIZE
    for (let i = 0; i < tileList.length; i++) {
      const tileX = panelX + BLOCK_QUARTER_SIZE + (i * BLOCK_SIZE)
      this.displayTargetTile(tileList[i], tileX, tileY)

      if (this.cursor.tile === i) {
        game.graphic.strokeRect(tileX, tileY, BLOCK_SIZE, BLOCK_SIZE, 'blue')
      }
    }
  }

  /**
   * 특정 타일을 출력합니다.
   * @param {number} tileNumber 
   * @param {number} x 
   * @param {number} y 
   * @param {number} displaySize 출력 크기, 기본값은 MapData.TILE_SIZE고 다른 사이즈로 출력해야 하면, 이 크기를 바꾸세요.
   */
  displayTargetTile (tileNumber, x, y, displaySize = MapData.TILE_SIZE) {
    const BLOCK_SIZE = MapData.TILE_SIZE
    switch (tileNumber) {
      case 0: break
      case 1: game.graphic.imageDisplay('block.png', (BLOCK_SIZE * 0), 0, BLOCK_SIZE, BLOCK_SIZE, x, y, displaySize, displaySize); break
      case 2: game.graphic.imageDisplay('block.png', (BLOCK_SIZE * 1), 0, BLOCK_SIZE, BLOCK_SIZE, x, y, displaySize, displaySize); break
      case 3: game.graphic.imageDisplay('block.png', (BLOCK_SIZE * 2), 0, BLOCK_SIZE, BLOCK_SIZE, x, y, displaySize, displaySize); break
      case 4: game.graphic.imageDisplay('block.png', (BLOCK_SIZE * 3), 0, BLOCK_SIZE, BLOCK_SIZE, x, y, displaySize, displaySize); break
      case 5: game.graphic.imageDisplay('block.png', (BLOCK_SIZE * 4), 0, BLOCK_SIZE, BLOCK_SIZE, x, y, displaySize, displaySize); break
    }
  }

  /** 맵에 있는 타일들을 출력합니다.  */
  displayMapTile () {
    const tileSize = this.tileDisplaySize

    for (let screenY = 0; screenY < this.screenHeight; screenY++) {
      const mapY = this.cameraY + screenY
      if (mapY >= this.map.indexHeight) continue

      for (let screenX = 0; screenX < this.screenWidth; screenX++) {
        const mapX = this.cameraX + screenX
        if (mapX >= this.map.indexWidth) continue

        const mapIndex = mapY * this.map.indexWidth + mapX
        const tileNumber = this.map.tileData[mapIndex]

        // 맵 좌표로 데이터를 찾고, 화면 좌표에 출력합니다. 줌 레벨을 기준으로 출력 크기를 정하므로, tileSize만큼 출력하도록 지정합니다.
        this.displayTargetTile(tileNumber, screenX * tileSize, screenY * tileSize, tileSize)

        // displayCursor
        if (screenX === this.cursorX && screenY === this.cursorY) {
          game.graphic.fillRect(screenX * tileSize, screenY * tileSize, tileSize, tileSize, 'green', 0.5)
        }
      }
    }
  }

  /** 맵의 그리드를 출력합니다. */
  displayGrid () {
    const TILE_DISPLAY_SIZE = this.tileDisplaySize

    const MAX_LINE_X = game.graphic.CANVAS_WIDTH / TILE_DISPLAY_SIZE
    for (let i = 0; i < MAX_LINE_X; i++) {
      const x = i * TILE_DISPLAY_SIZE
      const y = 0
      const w = 1
      const h = game.graphic.CANVAS_HEIGHT
      const c = 'black'
      game.graphic.setFontSize(14)
      game.graphic.fillRect(x, y, w, h, c)
      game.graphic.fillText(i + '', x, y)
    }

    const MAX_LINE_Y = game.graphic.CANVAS_HEIGHT / TILE_DISPLAY_SIZE
    for (let i = 0; i < MAX_LINE_Y; i++) {
      const x = 0
      const y = i * TILE_DISPLAY_SIZE
      const w = game.graphic.CANVAS_WIDTH
      const h = 1
      const c = 'black'
      game.graphic.setFontSize(14)
      game.graphic.fillRect(x, y, w, h, c)
      game.graphic.fillText(i + '', x, y)
    }
  }

  /** 타일 셋 UI 부분을 출력합니다. */
  displayTileSet () {
    // mapTileBackground
    const BLOCK_SIZE = MapData.TILE_SIZE
    const UIBASE_X = 20
    const UIBASE_Y = 480
    const UIBASE_WIDTH = 200
    const UIBASE_HEIGHT = 100
    const editModeString = ['NONE', 'DRAW', 'ERASE']
    const EDIT_MODE_TEXT = 'EDIT MODE: ' + editModeString[this.editModeMouse]
    const MAP_SIZE_TEXT = 'MAP SIZE: ' + this.map.indexWidth + 'X' + this.map.indexHeight
    game.graphic.fillRect(UIBASE_X, UIBASE_Y, UIBASE_WIDTH, UIBASE_HEIGHT, 'grey', 0.6)
    game.graphic.setFontSize(20)
    game.graphic.fillText(MAP_SIZE_TEXT, UIBASE_X, UIBASE_Y)
    game.graphic.setFontSize(16)
    game.graphic.fillText(EDIT_MODE_TEXT, UIBASE_X, UIBASE_Y + 20)

    // TileList
    const tileData = [1, 2, 3, 4, 5]
    const tileY = UIBASE_Y + 40
    for (let i = 0; i < 5; i++) {
      const x = UIBASE_X + (i * BLOCK_SIZE)
      this.displayTargetTile(tileData[i], x, tileY)
    }

    // tileCursor
    game.graphic.fillRect(UIBASE_X + (this.cursor.tile * BLOCK_SIZE), tileY, BLOCK_SIZE, BLOCK_SIZE, 'blue', 0.2)
  }

  /** 화살표 이동 버튼을 출력합니다. */
  displayArrowButton () {
    MapEditor.UI_AREA[MapEditor.UI_ID.ARROW_LEFT].display()
    MapEditor.UI_AREA[MapEditor.UI_ID.ARROW_RIGHT].display()
    MapEditor.UI_AREA[MapEditor.UI_ID.ARROW_UP].display()
    MapEditor.UI_AREA[MapEditor.UI_ID.ARROW_DOWN].display()
  }

  displayDebug () {
    game.graphic.fillRect(0, 0, 400, 60, 'white')
    game.graphic.fillText('CURSOR INDEX: ' + this.cursor.index + ', x: ' + this.cursorX + ', y: ' + this.cursorY, 0, 0)
    game.graphic.fillText('SCRREN: ' + this.screenWidth + 'x: ' + this.screenHeight + ', CAMERA: ' + this.cameraX + 'x: ' + this.cameraY, 0, 20)
    game.graphic.fillText('MOUSE: ' + game.control.getMouseX() + ', ' + game.control.getMouseY(), 0, 40)
  }
}

const mapEditor = new MapEditor()
game.process = () => {
  mapEditor.process()
}
game.display = () => {
  game.graphic.clearCanvas()
  mapEditor.display()
}