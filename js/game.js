//@ts-check

import { ID } from "./dataId.js"
import { StatItem, StatUser, dataExportStatItem } from "./dataStat.js"
import { ImageDataObject, imageDataInfo, imageSrc } from "./imageSrc.js"
import { soundSrc } from "./soundSrc.js"
import { TamsaEngine } from "./tamsaEngine/tamsaEngine.js"
import { systemText } from "./text.js"

// 이 파일은 함수 및 변수를 export할 목적으로 만들어졌으며
// 순환 참조를 구조적으로 불가능하게 하기 위해 만들어졌습니다.

/** tamshooter4 게임 변수입니다. */
export let game = new TamsaEngine('tamshooter4', 800, 600, 60)

// body 태그 색 변경 및 자동 크기 조절
game.graphic.setBodyColor('#181818')
if (game.currentDevice === game.device.MOBILE) {
  game.graphic.setAutoResize(true)
} else {
  game.graphic.setAutoResize(true)
}

// 디버그용 전역변수로 만들기...
// window.debugGame = game

class StatLineText {
  /** 새로운 스탯라인 텍스트 생성 */
  constructor () {
    /** 텍스트 */ this.text = ''
    /** 그라디언트 진행도를 표시할 기준값. 없으면 0 */ this.value = 0
    /** 그라디언트 진행도를 표시할 최대값, 없으면 0 */ this.valueMax = 0
    /** 색깔 A */ this.colorA = ''
    /** 색깔 B(이것을 넣으면 그라디언트 효과 적용) */ this.colorB = ''
  }

  /**
   * stat 시스템에 출력할 정보를 입력합니다. (이 함수는 tamshooter4의 statLineText랑 동일합니다. 
   * 다만 전역적으로 사용하기 위해 이 함수를 새로 만들었습니다.)
   * 
   * 그리고 tamshooter의 gameSystem은 gameVar에 있는 값을 간접 참조해 stat 시스템의 정보를 출력합니다.
   * @param {string} text 표시할 텍스트
   * @param {number} value 그라디언트 진행도를 표시할 기준값. 없으면 0
   * @param {number} valueMax 그라디언트 진행도를 표시할 최대값, 없으면 0
   * @param {string} colorA 색깔 A
   * @param {string} colorB 색깔 B(이것을 넣으면 그라디언트 효과 적용)
   */
  setStatLineText(text = '', value = 0, valueMax = 0, colorA = '', colorB = '') {
    this.text = text
    this.value = value

    this.valueMax = valueMax < value ? value : valueMax // valueMax가 value 보다 작으면 안됩니다.
    this.colorA = colorA
    this.colorB = colorB
  }
}

/** tamshooter4 게임에서 사용하는 공통 함수 */
export class gameFunction {
  /**
   * digitalFont로 글자를 출력합니다. 너비 높이 비율은 2:3
   * @param {string | number} inputText 입력할 텍스트
   * @param {number} x 출력할 x좌표
   * @param {number} y 출력할 y좌표
   * @param {number} wordwidth 글자너비 2px 단위 권장
   * @param {number} wordheight 글자높이 3px 단위 권장
   */
  static digitalDisplay = (inputText, x = 0, y = 0, wordwidth = 12, wordheight = 18) => {
    if (wordwidth <= 18 && wordheight <= 24) {
      this._digitalDisplaySmall(inputText, x, y, wordwidth, wordheight)
    } else if (wordwidth <= 30 && wordheight <= 40) {
      this._digitalDisplayMedium(inputText, x, y, wordwidth, wordheight)
    } else {
      this._digitalDisplayBig(inputText, x, y, wordwidth, wordheight)
    }
  }

  static _digitalDisplaySmall = game.graphic.createCustomBitmapDisplay(imageSrc.system.digitalFontSmall, 12, 18)
  static _digitalDisplayMedium = game.graphic.createCustomBitmapDisplay(imageSrc.system.digitalFont, 20, 30)
  static _digitalDisplayBig = game.graphic.createCustomBitmapDisplay(imageSrc.system.digitalFontBig, 40, 60)

  /**
   * (fieldSystem에서 사용하는 imageObjectDisplay랑 동일)
   * 
   * 특정 이미지 데이터를 포함한 이미지를 출력합니다.
   * 
   * 자기 자신의 객체를 출력하려면 defaultDisplay 함수를 사용해주세요.
   * 
   * @param {string} imageSrc 
   * @param {ImageDataObject} imageData 이미지 데이터
   * @param {number} x 출력할 x좌표
   * @param {number} y 출력할 y좌표
   * @param {number} width 출력할 너비
   * @param {number} height 출력할 높이
   * @param {number} flip 뒤집기 (자세한것은 graphicSystem.setFilp(또는 game.grapic.setFlip) 참고)
   * @param {number} degree 회전각도 (자세한것은 graphicSystem.setDegree(또는 game.grapic.setDegree) 참고) 
   * @param {number} alpha 알파값 (자세한것은 graphicSystem.setAlpha(또는 game.grapic.setAlpha) 참고)
   */
  static imageObjectDisplay (imageSrc, imageData, x, y, width = imageData.width, height = imageData.height, flip = 0, degree = 0, alpha = 1) {
    if (flip !== 0 || degree !== 0 || alpha !== 1) {
      game.graphic.imageDisplay(imageSrc, imageData.x, imageData.y, imageData.width, imageData.height, x, y, width, height, flip, degree, alpha)
    } else {
      game.graphic.imageDisplay(imageSrc, imageData.x, imageData.y, imageData.width, imageData.height, x, y, width, height)
    }
  }
}

/** tamshooter4 게임에서 사용하는 공통 변수 */
export class gameVar {
  /** 스탯 텍스트 0번째 라인에 작성되는 문자 (영어, 숫자, 일부 기호만 가능) */
  static statLineText1 = new StatLineText()
  static statLineText2 = new StatLineText()
}

let digitalDisplay = gameFunction.digitalDisplay

// 사운드 선 로딩
// 나중에 후로딩 방식으로 변경할지 잘 모르겠음.

for (const src of Object.values(soundSrc.system)) {
  game.sound.createAudio(src);
}

for (const src of Object.values(soundSrc.music)) {
  game.sound.createAudio(src);
}

for (const src of Object.values(soundSrc.skill)) {
  game.sound.createAudio(src);
}

class InventoryItem {
  /**
   * 인벤토리에 저장되는 정보 (아이템 타입은 캐시데이터이며, 게임 저장 용도로는 활용하지 않습니다.)
   * @param {number} id 아이디
   * @param {number} itemType 아이템 타입 (참고: 잘못된 값을 입력하면 해석하지 않습니다.)
   * @param {number} countValue 개수 카운터: 아이템이 NORMAL 타입이 아니라면, 이 값의 의미는 타입에 따라 달라집니다.
   * @param {number} customValue 커스텀 카운터: 이 값의 의미는 타입에 따라 달라집니다. NORMAL 타입은 이 값을 사용하지 않습니다.
   */
  constructor (id = 0, itemType = InventorySystem.TYPES.ITEM, countValue = 1, customValue = 0) {
    this.id = id
    this.itemType = itemType
    this.countValue = countValue
    this.customValue = customValue
  }
}

class InventorySystem {
  static TYPES = StatItem.TYPES

  /** @type {InventoryItem[]} */
  static itemList = []

  /** 아이템을 추가합니다. 이 함수는 스택 가능 아닌 것은 중복하여 추가하지 않습니다. 
   * @param {number} [countValue=1] 카운트 값, 아이템의 특성에 따라 설정해주세요.
   * @param {number} customValue 커스텀 값, 아이템의 특성에 따라 설정해주세요.
  */
  static addItem (id = 0, countValue = 1, customValue = 0) {
    const data = dataExportStatItem.get(id)
    if (data == null) return

    const index = this.getIndexById(id)
    // 아이템이 스택 가능할 때는, 해당 ID가 인벤토리에 있다면 개수를 더합니다.
    if (data.isStackable) {
      if (countValue <= 0) return

      if (index !== -1) {
        this.itemList[index].countValue += countValue
        return
      }
    } else if (index !== -1) {
      // 아니라면, 개수 기반으로 작동하지 않으므로, 아이템을 추가하지 않습니다.
      // 중복된 아이템은 추가할 수 없습니다.
      return
    }
    
    // 아이템이 존재하지 않은 경우, 해당 아이템을 정상적으로 추가합니다.
    this.itemList.push(new InventoryItem(id, data.type, countValue, customValue))
  }

  /** 아이템 타입이 아닌 아이템도 중복으로 강제로 추가합니다! 특수한 용도로 사용되는 함수!  
   * 이 함수를 임의로 호출하지 마세요.  */
  static addForceItem (id = 0, countValue = 0, customValue = 0) {
    const data = dataExportStatItem.get(id)
    if (data == null) return

    const index = this.getIndexById(id)
    // 아이템 타입인 경우, 기존과 역할은 동일합니다.
    if (data.isStackable && index !== -1) {
      if (countValue < 1) return

      this.itemList[index].countValue += countValue
      return
    }

    // 만약 아이템이 존재하지 않는데 아이템 타입을 강제로 추가해야 한다면
    // countValue가 1이 되도록 조정합니다.
    if (data.type === StatItem.TYPES.ITEM && countValue <= 0) {
      countValue = 1
    }

    // 아이템을 강제로 추가합니다. 강제 추가이므로 추가 조사를 하지 않습니다.
    this.itemList.push(new InventoryItem(id, data.type, countValue, customValue))
  }


  static checkDuplicate (id = 0) {
    for (let i = 0; i < this.itemList.length; i++) {
      if (this.itemList[i].id === id) {
        return true
      }
    }

    return false
  }

  /**
   * 해당 ID를 가진 아이템이 있다면, 개수를 리턴받음
   * 
   * 아이템 타입이 아닌 경우, 1 또는 0만 리턴됨  
   * 주의: 아이템 타입이 아닌 중복된 아이템의 개수를 조사하지 않습니다.
   * @param {number} id 
   */
  static getItemCountById (id) {
    for (let i = 0; i < this.itemList.length; i++) {
      if (this.itemList[i].id === id) {
        if (this.itemList[i].itemType === StatItem.TYPES.ITEM) {
          return this.itemList[i].countValue
        } else {
          return 1
        }
      }
    }

    return 0
  }

  /** 인벤토리의 아이템에 해당하는 id를 기반으로 아이템이 있는 인덱스 값을 가져옵니다. */
  static getIndexById (id = 0) {
    for (let i = 0; i < this.itemList.length; i++) {
      if (this.itemList[i].id === id) {
        return i
      }
    }

    return -1
  }


  /**
   * 해당하는 ID의 아이템을 삭제합니다.
   * 
   * 아이템 타입인 경우, 해당 개수만큼 줄어들며, 개수가 0 이하인 경우 제거합니다.  
   * 아이템 타입이 아닌 경우, 해당 아이템은 무조건 제거됩니다.
   * @param {number} countValue 개수
   */
  static removeItem (id = 0, countValue = 1) {
    const index = this.getIndexById(id)
    if (index === -1) return false

    const data = dataExportStatItem.get(this.itemList[index].id)
    if (data == null) return false

    // 아이템 타입인 경우 남은 개수를 조사해서, 
    // 해당 개수 초과면 아이템을 유지하고 개수만 변동합니다.
    if (data.isStackable) {
      // 카운트 개수가 1이상으로 정의되지 않으면 이 함수의 처리는 무효입니다.
      if (countValue <= 0) return false

      if (this.itemList[index].countValue > countValue) {
        this.itemList[index].countValue -= countValue
        return false
      }
    }

    this.itemList.splice(index, 1)
    return true
  }

  /** 해당 인덱스의 아이템을 삭제합니다. 남은 개수에 상관없이 제거합니다. */
  static removeItemByIndex (index = -1) {
    if (index < 0) return false

    this.itemList.splice(index, 1) 
    return true
  }

  /** 인벤토리 공간을 변경합니다. */
  static swap (index1 = 0, index2 = 1) {
    // 배열 공간을 초과하거나 두개의 인덱스가 같으면 무시
    if (index1 < 0 || index1 >= this.itemList.length) return
    if (index2 < 0 || index2 >= this.itemList.length) return
    if (index1 === index2) return

    const prev = this.itemList[index1]
    this.itemList[index1] = this.itemList[index2]
    this.itemList[index2] = prev
  }

  /**
   * 아이템을 얻어옵니다.
   * @param {number} index 배열의 인덱스
   * @returns {InventoryItem | undefined}
   */
  static get (index) {
    return this.itemList[index]
  }

  static getSaveData () {
    let idList = []
    let countList = []
    let upgradeLevel = []

    for (let i = 0; i < this.itemList.length; i++) {
      let current = this.itemList[i]
      idList.push(current.id)
      countList.push(current.countValue)
      upgradeLevel.push(current.customValue)
    }

    return {
      idList,
      countList,
      upgradeLevel
    }
  }
}

/**
 * 유저 세이브 데이터 타입
 * @typedef UserSaveData
 * @property {number} lv
 * @property {number} exp
 * @property {number} gold
 * @property {number} equipmentIndex
 * @property {number[]} weaponList
 * @property {number[]} skillList
 * @property {number[]} weaponPreset
 * @property {number[]} skillPreset
 * @property {number} weaponPresetNumber
 * @property {number} skillPresetNumber
 * @property {number[]} inventoryItemIdList
 * @property {number[]} inventoryItemCountList
 * @property {number[]} inventoryItemUpgardeLevel
 * @property {number[]} weaponUnlockList
 * @property {number[]} skillUnlockList
 * @property {number[]} roundClearList
 * @property {number[]} specialFlagList
 */


/**
 * StatUIBuffer
 */
class StatUIBuffer {
  static INDEXS = {
    HP: 0,
    SHIELD: 1,
    SHIELD_MAX: 2,
    SKILL1_ID: 3,
    SKILL1_COOLTIME: 4,
    SKILL2_ID: 5,
    SKILL2_COOLTIME: 6,
    SKILL3_ID: 7,
    SKILL3_COOLTIME: 8,
    SKILL4_ID: 9,
    SKILL4_COOLTIME: 10,
  }

  #buffer = new Int32Array(11)

  setHp (value = 0) { this.#buffer[StatUIBuffer.INDEXS.HP] = value }
  setShield (value = 0) { this.#buffer[StatUIBuffer.INDEXS.SHIELD] = value }
  setShieldMax (value = 0) { this.#buffer[StatUIBuffer.INDEXS.SHIELD_MAX] = value }
  setSkillId (slotNumber = 0, value = 0) { this.#buffer[StatUIBuffer.INDEXS.SKILL1_ID + (slotNumber * 2)] = value }
  setSkillCoolTime (slotNumber = 0, value = 0) { this.#buffer[StatUIBuffer.INDEXS.SKILL1_COOLTIME + (slotNumber * 2)] = value }

  getHp () { return this.#buffer[StatUIBuffer.INDEXS.HP] }
  getShield () { return this.#buffer[StatUIBuffer.INDEXS.SHIELD] }
  getShieldMax () { return this.#buffer[StatUIBuffer.INDEXS.SHIELD_MAX] }
  getSkillId (slotNumber = 0) { return this.#buffer[StatUIBuffer.INDEXS.SKILL1_ID + (slotNumber * 2)] }
  getSkillCoolTime (slotNumber = 0) { return this.#buffer[StatUIBuffer.INDEXS.SKILL1_COOLTIME + (slotNumber * 2)] }
}


/** 유저 정보 (static 클래스) */
export class userSystem {
  /** 최대 레벨 */ static MAX_LEVEL = StatUser.MAX_LEVEL
  /** 아이템의 강화 최대 레벨 */ static UPGRADE_LEVEL_MAX = StatItem.EQUIPMENT_UPGRADE_MAX_LEVEL
  /** 유저 체력 기본값 */ static HP_DEFAULT = 300
  /** 유저 쉴드 기본값 */ static SHIELD_DEFAULT = 200
  /** 쉴드 회복 기본값 */ static SHIELD_RECOVERY_DEFAULT = 100
  /** 쉴드 회복의 기준값, 매 프레임마다 쉴드 회복량이 증가하고, 쉴드 회복값이 이 기준값을 넘어가면 쉴드 1회복
   * 예를들어, 쉴드 회복이 6000까지 오르면, 유저의 쉴드가 1 회복됩니다. 쉴드 회복은 매 프레임마다 추가됩니다.
   * 
   * 그래서, 프레임당 기본값은 100/6000 회복입니다. (주의: 소수점 계산이 아닌 정수계산입니다.) */ 
  static SHIELD_RECOVERY_USING = 6000

  static ATTACK_MULTIPLE_WEAPON = 0.16
  static ATTACK_MULTIPLE_SKILL = 0.21

  /** 레벨, 직접적인 변경 금지 */ static lv = 1
  /** 경험치: 경험치 값은 addExp, setExp등을 통해 수정해주세요. */ static exp = 0
  /** 쉴드 */ static shield = this.SHIELD_DEFAULT
  /** 쉴드 최대치 */ static shieldMax = this.SHIELD_DEFAULT
  /** 쉴드 회복량 (매 프레임마다), 참고: 이 값을 60번 적용해야 실제 쉴드가 1 회복됩니다. */ static shieldRecovery = this.SHIELD_RECOVERY_DEFAULT
  /** 체력 (100% 값처럼 취급됨.) */ static hp = this.HP_DEFAULT
  /** 체력 최대치 */ static hpMax = this.HP_DEFAULT
  /** 데미지 경고 프레임 */ static damageWarningFrame = 0
  /** 레벨업 이펙트 프레임 */ static levelUpEffectFrame = 0
  /** 골드 (플레이어의 자원) */ static gold = 0

  /** 스페셜 플래그 (특수한 용도로 사용됨) @type {number[]} */ static specialFlagList = []

  /** 라운드 클리어 id 리스트 @type {number[]} */
  static roundClearList = []

  /** 스탯 창에 표시할 버퍼 */
  static statUiBuffer = new StatUIBuffer()

  /** 해당 라운드가 클리어되어있는지 살펴봅니다. */
  static getRoundClear (roundId = 0) {
    return this.roundClearList.includes(roundId)
  }

  /** 클리어한 라운드의 id 추가 (중복으로 처리되지 않음) */
  static addRoundClear (roundId = 0) {
    if (!this.roundClearList.includes(roundId)) {
      this.roundClearList.push(roundId)

      // 라운드 id를 오름차순 정렬
      this.roundClearList.sort((a, b) => a - b)
    }
  }
  
  /** 스킬 리스트(기본값) (총 8개, 이중 0 ~ 3번은 A슬롯, 4 ~ 7번은 B슬롯) */ 
  static skillList = [
    ID.playerSkill.multyshot, ID.playerSkill.missile, ID.playerSkill.arrow, ID.playerSkill.critcalChaser,
    ID.playerSkill.laser, ID.playerSkill.sapia, ID.playerSkill.parapo, ID.playerSkill.seondanil,
  ]

  /** 현재 스킬의 프리셋 번호 */
  static skillPresetNumber = 0

  /** 스킬 1세트의 개수 (4 * 2 = 8개) */
  static SKILL_LIST_TOTAL_COUNT = 8

  /** 스킬 1슬롯의 개수 (4개) */
  static SKILL_LIST_SLOT_COUNT = 4

  /** 프리셋의 최대 개수 */
  static PRESET_MAX_COUNT = 5

  /** 스킬 리스트의 프리셋 (모든 스킬번호는 연결되어있음. 각각 4개는 A/B슬롯을 나타냄. 8개가 1세트) */
  static skillPresetList = [
    ID.playerSkill.multyshot, ID.playerSkill.missile, ID.playerSkill.arrow, ID.playerSkill.critcalChaser, // preset 1A
    ID.playerSkill.laser, ID.playerSkill.sapia, ID.playerSkill.parapo, ID.playerSkill.seondanil, // preset 1B
    ID.playerSkill.hyperBall, ID.playerSkill.whiteflash, ID.playerSkill.sword, ID.playerSkill.hanjumoek, // preset 2A
    ID.playerSkill.rapid, ID.playerSkill.santansu, ID.playerSkill.ring, ID.playerSkill.pileBunker, // preset 2B
    ID.playerSkill.multyshot, ID.playerSkill.missile, ID.playerSkill.arrow, ID.playerSkill.critcalChaser, // preset 3A
    ID.playerSkill.unused, ID.playerSkill.unused, ID.playerSkill.unused,ID.playerSkill.unused, // preset 3B
    ID.playerSkill.multyshot, ID.playerSkill.missile, ID.playerSkill.arrow, ID.playerSkill.critcalChaser, // preset 4A
    ID.playerSkill.unused, ID.playerSkill.unused, ID.playerSkill.unused, ID.playerSkill.unused, // preset 4B
    ID.playerSkill.multyshot, ID.playerSkill.missile, ID.playerSkill.arrow, ID.playerSkill.critcalChaser, // preset 5A
    ID.playerSkill.unused, ID.playerSkill.unused, ID.playerSkill.unused, ID.playerSkill.unused, // preset 5B
  ]

  /** 스킬의 언락된 리스트 @type {number[]} */
  static skillUnlockList = []

  /** 해당 스킬이 언락되어있는지를 살펴봄 */
  static getSkillUnlock (skillId = 0) {
    return this.skillUnlockList.includes(skillId)
  }

  /** 특정 skill의 unlock 추가 (중복으로 처리되지 않음) */
  static addSkillUnlock (skillId = 0) {
    if (!this.skillUnlockList.includes(skillId)) {
      this.skillUnlockList.push(skillId)

      // 스킬 id를 오름차순 정렬
      this.skillUnlockList.sort((a, b) => a - b)
    }
  }

  static inventory = InventorySystem

  static SlotData = class SlotData {
    constructor () {
      /** 슬롯에 장착된 보석의 id */ this.id = 0
      /** 슬롯의 클래스 번호 */ this.classNumber = 0
      /** 슬롯의 레벨 값 */ this.slotLevel = 0
      /** 슬롯의 공격력 값 */ this.slotAttack = 0
    }
  }
  static slot = [new userSystem.SlotData(), new userSystem.SlotData(), new userSystem.SlotData(), new userSystem.SlotData()]

  static equipmentIndex = -1

  static getEquipmentItemData () {
    let item = this.inventory.get(this.equipmentIndex)
    if (item == null) return

    let data = dataExportStatItem.get(item.id)
    return data
  }

  /**
   * 장비를 설정합니다.
   * @param {number} itemIndex 
   * @returns {boolean}
   */
  static setEquipment (itemIndex) {
    // 같은 인덱스의 장비라면 장착하지 않고 리턴
    if (this.equipmentIndex === itemIndex) return false

    // 인벤토리에서 장비를 가져옴, 장비 타입이 아니면 리턴
    let currentItem = this.inventory.get(itemIndex)
    if (currentItem == null) return false
    if (currentItem.itemType !== this.inventory.TYPES.EQUIPMENT) return false

    // 인벤토리에 있는 아이템의 데이터를 가져옴
    let itemData = dataExportStatItem.get(currentItem.id)
    if (itemData == null) return false

    // 레벨이 낮으면 장착 불가
    if (this.lv < itemData.requireLevel) return false

    // 장비 교체 (이전 장비는 인벤토리에 남아있음.) 및 데이터 등록
    this.equipmentIndex = itemIndex
    return true
  }

  /** 현재 장비를 업그레이드 합니다. */
  static upgradeEquipment () {
    return this.inventoryItemEquipmentUpgrade(this.equipmentIndex)
  }

  /** 인벤토리에 있는 아이템을 업그레이드 합니다. (장비아이템 한정) 
   * @param {number} itemIndex 아이템의 인덱스 */
  static inventoryItemEquipmentUpgrade (itemIndex) {
    if (itemIndex < 0 || itemIndex >= this.inventory.itemList.length) return false

    const currentItem = this.inventory.itemList[itemIndex]
    const itemData = dataExportStatItem.get(currentItem.id)
    if (itemData == null) return false
    if (itemData.type !== this.inventory.TYPES.EQUIPMENT) return false
    if (currentItem.customValue >= StatItem.EQUIPMENT_UPGRADE_MAX_LEVEL) return false

    const cost = StatItem.getEquipmentUpgradeCost(itemData.upgradeCost, currentItem.customValue)
    if (this.gold < cost) return false

    // 장비 업그레이드
    currentItem.customValue++
    this.gold -= cost
    return true
  }

  /** 현재 아이템의 강화 비용
   * @param {number} itemIndex 아이템의 인덱스 */
  static getUpgradeCost (itemIndex) {
    if (itemIndex < 0 || itemIndex >= this.inventory.itemList.length) return 0

    const currentItem = this.inventory.itemList[itemIndex]
    const itemData = dataExportStatItem.get(currentItem.id)
    if (itemData == null) return 0
    if (itemData.type !== this.inventory.TYPES.EQUIPMENT) return 0
    if (currentItem.customValue >= StatItem.EQUIPMENT_UPGRADE_MAX_LEVEL) return 0

    return StatItem.getEquipmentUpgradeCost(itemData.upgradeCost, currentItem.customValue)
  }

  /** 인벤토리에 있는 아이템의 값들 (공격력, 강화 비용 등)을 얻어옵니다. */
  static getInventoryEquipmentValues (itemIndex = 0) {
    const currentItem = this.inventory.get(itemIndex)
    if (currentItem == null) return

    const itemData = dataExportStatItem.get(currentItem.id)
    if (itemData == null) return
    if (itemData.type !== this.inventory.TYPES.EQUIPMENT) return

    const attack = StatItem.getEquipmentAttack(itemData.attack, currentItem.customValue)
    const cost = StatItem.getEquipmentUpgradeCost(itemData.upgradeCost, currentItem.customValue)
    const nextLevelCost = StatItem.getEquipmentUpgradeCost(itemData.upgradeCost, currentItem.customValue + 1)
    const upgradeLevel = currentItem.customValue

    return {
      attack,
      cost,
      nextLevelCost,
      upgradeLevel
    }
  }

  /**
   * 인벤토리 데이터 아이템을 삭제합니다. 이것은 itemId를 기반으로 합니다.  
   * (장비아이템과의 연동을 위해, 이 함수를 사용해서 아이템을 제거하세요.)
   * @param {number} itemId 아이템의 id
   */
  static inventoryItemDeleteById (itemId, count = 0) {
    const index = this.inventory.getIndexById(itemId)
    if (index < 0) return
    
    const isSuccess = this.inventory.removeItem(itemId, count)

    // 아이템 삭제가 성공하면, 인벤토리 내부 인덱스가 변화하므로, 장비 인덱스를 다시 보정합니다.
    // splice로 뒤쪽 배열이 삭제되므로 인덱스는 1 감소합니다.
    if (isSuccess && this.equipmentIndex > index) {
      this.equipmentIndex--
    } else if (index === this.equipmentIndex) {
      this.equipmentIndex = -1
    }
  }

  /**
   * 인벤토리 데이터 아이템을 삭제합니다. 이것은 인덱스 기반입니다.  
   * (장비아이템과의 연동을 위해, 이 함수를 사용해서 아이템을 제거하세요.)
   * @param {number} itemIndex 아이템의 인덱스
   */
  static inventoryItemDeleteByIndex (itemIndex) {
    let current = this.inventory.get(itemIndex)
    if (current == null) return

    const isSuccess = this.inventory.removeItemByIndex(itemIndex)
    if (!isSuccess) return

    if (this.equipmentIndex > itemIndex) {
      this.equipmentIndex--
    } else if (itemIndex === this.equipmentIndex) {
      this.equipmentIndex = -1
    }
  }

  /** 무기 리스트(기본값), 0 ~ 3번까지만 있음. 4번은 무기를 사용하기 싫을 때 사용 따라서 무기가 지정되지 않음. */
  static weaponList = [
    ID.playerWeapon.multyshot, ID.playerWeapon.missile, ID.playerWeapon.arrow, ID.playerWeapon.laser
  ]

  /** 현재 무기의 프리셋 번호 */
  static weaponPresetNumber = 0

  /** 무기의 리스트 개수 */
  static WEAPON_LIST_COUNT = 4

  /** 무기가 가진 프리셋 리스트, 5개가 연속적으로 연결되어있음. */
  static weaponPresetList = [
    ID.playerWeapon.multyshot, ID.playerWeapon.missile, ID.playerWeapon.arrow, ID.playerWeapon.laser,
    ID.playerWeapon.blaster, ID.playerWeapon.parapo, ID.playerWeapon.sapia, ID.playerWeapon.ring,
    ID.playerWeapon.multyshot, ID.playerWeapon.rapid, ID.playerWeapon.parapo, ID.playerWeapon.unused,
    ID.playerWeapon.multyshot, ID.playerWeapon.unused, ID.playerWeapon.unused, ID.playerWeapon.unused,
    ID.playerWeapon.multyshot, ID.playerWeapon.unused, ID.playerWeapon.unused, ID.playerWeapon.unused,
  ]

  /** 무기의 언락된 리스트 @type {number[]} */
  static weaponUnlockList = []

  /** 해당 무기가 언락되어있는지를 살펴봄 */
  static getWeaponUnlock (weaponId = 0) {
    return this.weaponUnlockList.includes(weaponId)
  }

  /** 특정 weapon의 unlock 추가 (중복으로 처리되지 않음) */
  static addWeaponUnlock (weaponId = 0) {
    if (!this.weaponUnlockList.includes(weaponId)) {
      this.weaponUnlockList.push(weaponId)

      // 무기 id를 오름차순 정렬
      this.weaponUnlockList.sort((a, b) => a - b)
    }
  }

  /** 공격력(초당), 참고: 이 값은 processStat함수를 실행하지 않으면 값이 갱신되지 않습니다. */ 
  static attack = 0

  /** 유저 스탯 숨기기 */ static isHideUserStat = false
  /** 숨기기를 사용할 때, 적용되는 알파값, 완전히 숨겨지면 0.2로 취급 */ static hideUserStatAlpha = 1

  /**
   * 경험치 테이블
   */
  static expTable = StatUser.expTable

  /**
   * 공격력 보너스 테이블
   */
  static attackLevelTable = StatUser.attackLevelTable

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
    setData: function (hour = 0, minute = 0, second = 0) {
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
    setData: function (year = 2000, month = 1, day = 1, hour = 1, minute = 1, second = 1) {
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
   * 
   * 참고: string 값을 넣어도 상관이 없지만. 이 경우 Number로 변환됩니다. (localStoarge 저장용도라 형변환하기 귀찮음.)
   * @param {number | string} hour 시간
   * @param {number | string} minute 분
   * @param {number | string} second 초
   */
  static setPlayTime (hour, minute, second) {
    if (typeof hour === 'string') hour = Number(hour)
    if (typeof minute === 'string') minute = Number(minute)
    if (typeof second === 'string') second = Number(second)

    this.playTime.setData(hour, minute, second)
  }

  /**
   * 유저의 startDate를 수정하는 함수
   * @param {number | string} year 해당 년도
   * @param {number | string} month 월
   * @param {number | string} day 일
   * @param {number | string} hour 시
   * @param {number | string} minute 분
   * @param {number | string} second 초
   */
  static setStartDate (year, month, day, hour, minute, second) {
    if (typeof year === 'string') year = Number(year)
    if (typeof month  === 'string') month  = Number(month)
    if (typeof day === 'string') day = Number(day)
    if (typeof hour === 'string') hour = Number(hour)
    if (typeof minute === 'string') minute = Number(minute)
    if (typeof second === 'string') second = Number(second)

    if (isNaN(second) || isNaN(minute) || isNaN(second)) {
      console.error(systemText.gameError.LOAD_PLAYTIME_ERROR)
      return
    }

    this.startDate.setData(year, month, day, hour, minute, second)
  }

  /** 유저의 시작 일을 재설정합니다. */
  static setStartDateReset () {
    this.startDate.setCurrentDate()
  }

  /**
   * 현재 레벨에 모아야 하는 경험치를 리턴합니다.
   */
  static getExpMax () {
    return this.expTable[this.lv]
  }

  /** 유저에게 보여지는 스탯을 설정하는 함수 */
  static setStatUiHpShield (hp = 0, shield = 0, shieldMax = 0) {
    this.statUiBuffer.setHp(hp)
    this.statUiBuffer.setShield(shield)
    this.statUiBuffer.setShieldMax(shieldMax)
  }

  /** 유저에게 보여지는 스킬을 설정하는 함수 */
  static setStatUiSkill (slotNumber = 0, id = 0, coolTime = 0) {
    this.statUiBuffer.setSkillId(slotNumber, id)
    this.statUiBuffer.setSkillCoolTime(slotNumber, coolTime)
  }

  /** 현재 스킬 상태를 그대로 보여지게 하는 함수 */
  static setSkillDisplayStatDefaultFunction () {
    for (let i = 0; i < this.SKILL_LIST_SLOT_COUNT; i++) {
      this.statUiBuffer.setSkillId(i, this.skillList[i])
    }
  }

  static setSkillDisplayCooltimeZero () {
    for (let i = 0; i < this.SKILL_LIST_SLOT_COUNT; i++) {
      this.statUiBuffer.setSkillCoolTime(i, 0)
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
        this.setStatUiSkill(i, skillListId[i], 0)
      }
    }
  }
  
  /**
   * 스킬을 설정합니다. 중복은 허용되지 않습니다. unused값을 넣으면 해당 스킬을 삭제합니다.
   * A슬롯에 있는 스킬은 제거할 수 없습니다. (왜냐하면, 스킬을 사용하지 않으면 게임 진행이 매우 어렵습니다.)
   * @param {number} skillSlotNumber (0 ~ 7 번 선택 가능), 0 ~ 3: A슬롯, 4 ~ 7: B슬롯
   * @param {number} skillId 스킬의 아이디
   * @returns {boolean}
   */
  static setSkill (skillSlotNumber = 0, skillId = 0) {
    if (skillSlotNumber < 0 && skillSlotNumber > this.SKILL_LIST_TOTAL_COUNT) return false
    if (skillId === 0) {
      // A슬롯(0 ~ 3번) 은 스킬을 제거할 수 없음
      if (skillSlotNumber <= 3) return false

      this.skillList[skillSlotNumber] = skillId
      return true
    }

    // 스킬이 중복되어있으면 그 스킬이 같은 슬롯에 있는지를 먼저 조사함
    // 같은 슬롯에 있다면 교체되지 않고 취소
    let swapNumber = this.skillList.indexOf(skillId)

    // 변경할 번호와 지정된 슬롯번호가 같다면 취소됨
    if (swapNumber === skillSlotNumber) {
      return false
    } else if (swapNumber !== -1) {
      // 이 경우는 서로의 위치가 교체됨 (여기서는 위치가 변경될 무기만 저장해둠)
      let prevId = this.skillList[skillSlotNumber]
      this.skillList[swapNumber] = prevId
    }

    // 스킬 교체
    this.skillList[skillSlotNumber] = skillId

    // 스킬 교체 이후 화면에 다시 갱신
    this.setSkillDisplayStatDefaultFunction()
    return true
  }

  /**
   * 스킬의 프리셋을 변경합니다. (무기랑 원리가 동일)
   * @param {number} presetNumber 프리셋 번호 (0 ~ 4)
   */
  static changePresetSkill (presetNumber = 0) {
    if (presetNumber < 0 && presetNumber >= this.PRESET_MAX_COUNT) return
    if (presetNumber === this.skillPresetNumber) return

    // 현재 값을 이전 프리셋에 저장합니다.
    let prevArrayNumber = this.skillPresetNumber * this.SKILL_LIST_TOTAL_COUNT
    for (let i = 0; i < this.SKILL_LIST_TOTAL_COUNT; i++) {
      let index = prevArrayNumber + i
      this.skillPresetList[index] = this.skillList[i]
    }

    // 그리고 다른 프리셋의 무기를 현재 무기로 재설정합니다.
    let nextArrayNumber = presetNumber * this.SKILL_LIST_TOTAL_COUNT
    for (let i = 0; i < this.SKILL_LIST_TOTAL_COUNT; i++) {
      // 참고: 프리셋을 변경하는 과정에서 중복되는 무기는 삭제되거나 변형될 수 있음.
      let index = nextArrayNumber + i
      this.skillList[i] = this.skillPresetList[index]
    }

    // 프리셋 번호 변경
    this.skillPresetNumber = presetNumber
  }

  static getSkillList () {
    return this.skillList
  }

  static getWeaponList () {
    return this.weaponList
  }

  /**
   * 현재 무기를 얻어옵니다.
   * @param {number} weaponSlotNumber 무기 슬롯 번호: 0 ~ 3까지
   */
  static getCurrentWeapon (weaponSlotNumber = 0) {
    return this.weaponList[weaponSlotNumber]
  }

  /**
   * 무기를 변경합니다. (중복할 수 없음, 무기 삭제도 가능)
   * @param {number} slotNumber 무기 슬롯의 번호
   * @param {number} weaponId 무기의 아이디 (unused일경우, 해당 무기 삭제(남은 무기가 2개 이상이여야함))
   * @returns {boolean} 무기 변경 성공 여부 (무기 선택 시스템에서 이 정보가 필요함)
   */
  static setWeapon (slotNumber = 0, weaponId = 0) {
    if (slotNumber < 0 || slotNumber > this.WEAPON_LIST_COUNT) return false
    if (weaponId !== 0 && weaponId < ID.playerWeapon.weaponNumberStart) return false
    if (weaponId === 0) {
      let valid = 0
      for (let i = 0; i < this.weaponList.length; i++) {
        if (this.weaponList[i] !== 0) valid++
      }

      // 무기가 한개를 초과하면 해당 무기를 삭제할 수 있음.
      // 적어도 무기가 하나 이상은 있어야 함.
      if (valid > 1) {
        this.weaponList[slotNumber] = weaponId
        return true
      } else {
        return false
      }
    }

    // 무기가 중복되어있으면 그 무기가 같은 슬롯에 있는지를 먼저 조사함
    // 같은 슬롯에 있다면 교체되지 않고 취소
    let swapNumber = this.weaponList.indexOf(weaponId)

    // 변경할 번호와 지정된 슬롯번호가 같다면 취소됨
    if (swapNumber === slotNumber) {
      return false
    } else if (swapNumber !== -1) {
      // 이 경우는 서로의 위치가 교체됨 (여기서는 위치가 변경될 무기만 저장해둠)
      let prevId = this.weaponList[slotNumber]
      this.weaponList[swapNumber] = prevId
    }

    this.weaponList[slotNumber] = weaponId
    return true // 무기 변경 성공
  }

  /**
   * 무기의 리스트를 설정합니다.
   * @param {number[]} weaponList 무기의 id 4개
   * @deprecated setWeapon을 대신 사용해주세요. 이 무기 리스트는 무기의 중복을 검사하지 않습니다.
   */
  static setWeaponList (weaponList = []) {
    this.weaponList = weaponList
  }

  /**
   * 무기 프리셋 설정 (1 ~ 5번까지 있음.)
   * 잘못된 숫자를 입력하면 일단 1번이 리턴됨
   * @param {number} presetNumber 프리셋번호 (0 ~ 4)
   * @param {number[]} weaponList 무기의 리스트
   */
  static setPresetWeaponList (presetNumber = 0, weaponList) {
    if (presetNumber < 0 && presetNumber > this.WEAPON_LIST_COUNT) presetNumber = 0
    let arrayNumber = presetNumber * this.WEAPON_LIST_COUNT
    if (weaponList.length !== 4) {
      throw new Error('잘못된 무기의 개수')
    }

    this.weaponPresetList[arrayNumber + 0] = weaponList[0]
    this.weaponPresetList[arrayNumber + 1] = weaponList[1]
    this.weaponPresetList[arrayNumber + 2] = weaponList[2]
    this.weaponPresetList[arrayNumber + 3] = weaponList[3]
  }

  /**
   * 해당하는 무기 프리셋을 가져옵니다. (0 ~ 4번까지 있음.)
   * @param {number} presetNumber 
   */
  static getPresetWeaponList (presetNumber = 0) {
    if (presetNumber < 0 && presetNumber > this.WEAPON_LIST_COUNT) presetNumber = 0
    let arrayNumber = presetNumber * this.WEAPON_LIST_COUNT
    return [
      this.weaponPresetList[arrayNumber + 0],
      this.weaponPresetList[arrayNumber + 1],
      this.weaponPresetList[arrayNumber + 2],
      this.weaponPresetList[arrayNumber + 3]
    ]
  }

  /**
   * 현재 무기의 프리셋을 변경합니다. (무기는 자동으로 교체됩니다.)
   * @param {number} presetNumber 
   */
  static changePresetWeapon (presetNumber = 0) {
    if (presetNumber < 0 && presetNumber > this.WEAPON_LIST_COUNT) return
    if (presetNumber === this.weaponPresetNumber) return

    // 현재 무기를 이전 프리셋에 저장합니다.
    let prevArrayNumber = this.weaponPresetNumber * this.WEAPON_LIST_COUNT
    for (let i = 0; i < this.WEAPON_LIST_COUNT; i++) {
      let index = prevArrayNumber + i
      this.weaponPresetList[index] = this.weaponList[i]
    }

    // 그리고 다른 프리셋의 무기를 현재 무기로 재설정합니다.
    let nextArrayNumber = presetNumber * this.WEAPON_LIST_COUNT
    for (let i = 0; i < this.WEAPON_LIST_COUNT; i++) {
      let index = nextArrayNumber + i
      this.weaponList[i] = this.weaponPresetList[index]
    }

    // 프리셋 번호 변경
    this.weaponPresetNumber = presetNumber
  }

  /**
   * 경험치 추가 함수
   * exp 값을 직접 조정하지 마세요.
   * @param {number} value 경험치 값
   */
  static addExp (value) {
    this.exp += value
    const maxLevel = StatUser.MAX_LEVEL

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
        game.sound.play(soundSrc.system.systemLevelUp)
      }
    }
  }

  /** 현재 값만큼 유저의 골드를 더합니다. */
  static addGold (gold = 0) {
    if (gold < 0) return

    this.gold += gold
  }

  /** 현재 값만큼 유저의 골드를 뺍니다. */
  static subtractGold (gold = 0) {
    if (gold < 0) return

    this.gold -= gold
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
      game.graphic.setAlpha(this.hideUserStatAlpha)
      this.displayUserStatVer2()
      game.graphic.setAlpha(1)
    } else {
      this.displayUserStatVer2()
    }
  }

  static getPlayTimeText () {
    return 'PLAY TIME: ' + this.playTime.getTimeString() 
  }

  static displayUserStatVer2 () {
    const statImageSrc = imageSrc.system.mainSystem
    const statImageData = imageDataInfo.mainSystem.playerStat
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
    gameFunction.imageObjectDisplay(statImageSrc, statImageData, statImageX, statImageY)

    // skill display
    for (let i = 0; i < this.SKILL_LIST_SLOT_COUNT; i++) {
      const skillIconImage = imageSrc.system.skillIcon
      const AREA_WIDTH = 75 // 300 / 4 = 75
      const NUMBER_X = LAYERX
      const SKILL_X = LAYERX + imageDataInfo.mainSystem.skillSlot1Available.width
      const SKILL_WIDTH = imageDataInfo.system.weaponSkillIcon.width
      const SKILL_HEIGHT = imageDataInfo.system.weaponSkillIcon.height
      
      const OUTPUT_NUMBER_X = NUMBER_X + (i * AREA_WIDTH)
      const OUTPUT_SKILL_X = SKILL_X + (i * AREA_WIDTH)
      const OUTPUT_TIME_X = OUTPUT_SKILL_X
      const OUTPUT_TIME_Y = LAYERY1 + 1
      const OUTPUT_SKILL_WIDTH = 40
      const OUTPUT_SKILL_HEIGHT = 20

      const SKILL_ID = this.statUiBuffer.getSkillId(i)
      const COOL_TIME = this.statUiBuffer.getSkillCoolTime(i)

      // skill number display
      const imgD = imageDataInfo.mainSystem
      let targetImgD = imageDataInfo.mainSystem.skillSlot1Available
      let isAvailable = COOL_TIME <= 0
      switch (i) {
        case 0: targetImgD = isAvailable ? imgD.skillSlot1Available : imgD.skillSlot1Disable; break
        case 1: targetImgD = isAvailable ? imgD.skillSlot2Available : imgD.skillSlot2Disable; break
        case 2: targetImgD = isAvailable ? imgD.skillSlot3Available : imgD.skillSlot3Disable; break
        case 3: targetImgD = isAvailable ? imgD.skillSlot4Available : imgD.skillSlot4Disable; break
      }
      gameFunction.imageObjectDisplay(imageSrc.system.mainSystem, targetImgD, OUTPUT_NUMBER_X, OUTPUT_TIME_Y)

      // 스킬 쿨타임이 남아있다면, 남은 시간이 숫자로 표시됩니다.
      // 스킬 쿨타임이 없다면, 스킬을 사용할 수 있으며, 스킬 아이콘이 표시됩니다.
      // 해당하는 스킬이 없다면, 스킬은 표시되지 않습니다.
      if (COOL_TIME >= 1) {
        if (SKILL_ID !== 0) {
          const skillNumber = SKILL_ID - ID.playerSkill.skillNumberStart // 스킬의 ID 시작값을 구해서 ID 순서 추론
          const skillXLine = skillNumber % 10
          const skillYLine = Math.floor(skillNumber / 10)
          game.graphic.imageDisplay(skillIconImage, skillXLine * SKILL_WIDTH, skillYLine * SKILL_HEIGHT, SKILL_WIDTH, SKILL_HEIGHT, OUTPUT_SKILL_X, LAYERY1, OUTPUT_SKILL_WIDTH, OUTPUT_SKILL_HEIGHT, 0, 0, 0.5)
        }
        digitalDisplay(COOL_TIME + '', OUTPUT_TIME_X, OUTPUT_TIME_Y) // 스킬 쿨타임 시간
      } else {
        if (SKILL_ID !== 0) {
          const skillNumber = SKILL_ID - ID.playerSkill.skillNumberStart // 스킬의 ID 시작값을 구해서 ID 순서 추론
          const skillXLine = skillNumber % 10
          const skillYLine = Math.floor(skillNumber / 10)
          game.graphic.imageDisplay(skillIconImage, skillXLine * SKILL_WIDTH, skillYLine * SKILL_HEIGHT, SKILL_WIDTH, SKILL_HEIGHT, OUTPUT_SKILL_X, LAYERY1, OUTPUT_SKILL_WIDTH, OUTPUT_SKILL_HEIGHT)
        }
      }
    }

    // hp + shield display
    const HP = this.statUiBuffer.getHp()
    const HP_MAX = this.hpMax // 이것은 버퍼에 저장된 값이 없습니다. 그래서 직접 가져옵니다.
    const SHIELD = this.statUiBuffer.getShield()
    const SHIELD_MAX = this.statUiBuffer.getShieldMax()

    const hpPercent = HP / this.hpMax
    const HP_WIDTH = Math.floor(LAYER_WIDTH / 2) * hpPercent

    // 참고로 체력게이지 바로 뒤에 쉴드 게이지를 표시하기 때문에, 좌표값 계산을 위하여 hp는 따로 퍼센트와 길이를 계산했습니다.
    if (this.damageWarningFrame > 0) {
      let targetFrame = this.damageWarningFrame % H_COLORA.length

      // 체력 게이지 그라디언트
      game.graphic.meterRect(LAYERX, LAYERY2, LAYER_WIDTH / 2, LAYER_HEIGHT, [H_COLORA[targetFrame], H_COLORB[targetFrame]], HP, HP_MAX)

      // 쉴드 게이지 그라디언트
      game.graphic.meterRect(LAYERX + HP_WIDTH, LAYERY2, LAYER_WIDTH / 2, LAYER_HEIGHT, [S_COLORA[targetFrame], S_COLORB[targetFrame]], SHIELD, SHIELD_MAX)
    } else {
      // 체력 게이지 그라디언트 [파란색]
      game.graphic.meterRect(LAYERX, LAYERY2, LAYER_WIDTH / 2, LAYER_HEIGHT, [H_COLORA[0], H_COLORB[0]], HP, HP_MAX)

      // 쉴드 게이지 그라디언트 [하늘색]
      game.graphic.meterRect(LAYERX + HP_WIDTH, LAYERY2, LAYER_WIDTH / 2, LAYER_HEIGHT, [S_COLORA[0], S_COLORB[0]], SHIELD, SHIELD_MAX)
    }

    const hpText = HP + ' + ' + SHIELD + '/' + SHIELD_MAX
    digitalDisplay(hpText, LAYERX + 1, LAYERY2 + 1)


    // lv + exp display
    if (this.levelUpEffectFrame > 0) {
      let targetFrame = this.levelUpEffectFrame % EXP_COLORA.length
      game.graphic.meterRect(LAYERX, LAYERY3, LAYER_WIDTH, LAYER_HEIGHT, [EXP_COLORA[targetFrame], EXP_COLORB[targetFrame]], this.exp, this.getExpMax())
    } else {
      game.graphic.meterRect(LAYERX, LAYERY3, LAYER_WIDTH, LAYER_HEIGHT, [EXP_COLORA[0], EXP_COLORB[0]], this.exp, this.getExpMax())
    }

    const lvText = 'Lv.' + this.lv + ' ' + this.exp + '/' + this.expTable[this.lv]
    digitalDisplay(lvText, LAYERX + 1, LAYERY3 + 1)
  }

  /**
   * 플레이어의 스탯 재측정 (현재는 공격력만 변함)
   * 
   * 해당 함수를 사용하지 않으면, 공격력이 변경되어도 해당 공격력이 적용되지 않습니다.
   */
  static processStat () {
    const attackValue = this.getAttackValue()

    // 공격력 결정
    this.attack = this.attackLevelTable[this.lv] + attackValue.equipment + attackValue.slot + attackValue.stat

    const equipmentData = this.getEquipmentItemData()

    if (equipmentData != null) {
      // 장비가 있다면, 체력 쉴드를 그만큼 추가 (단, 장비에 해당 스탯값이 없으면, 기본값 0으로 처리됨)
      this.hp = this.HP_DEFAULT + equipmentData.hp
      this.hpMax = this.HP_DEFAULT + equipmentData.hp
      this.shield = this.SHIELD_DEFAULT + equipmentData.shield
      this.shieldMax = this.SHIELD_DEFAULT + equipmentData.shield
      this.shieldRecovery = this.SHIELD_RECOVERY_DEFAULT + equipmentData.shieldRecovery
    } else {
      // 체력과 쉴드에 초기값 부여
      this.hp = this.HP_DEFAULT
      this.hpMax = this.HP_DEFAULT
      this.shield = this.SHIELD_DEFAULT
      this.shieldMax = this.SHIELD_DEFAULT
      this.shieldRecovery = this.SHIELD_RECOVERY_DEFAULT
    }
  }

  /** 공격력 조합 값들을 가져옵니다. */
  static getAttackValue () {
    const equipment = this.getInventoryEquipmentValues(this.equipmentIndex)
    return {
      level: this.attackLevelTable[this.lv],
      equipment: equipment != null ? equipment.attack : 0,
      slot: 0,
      stat: 0,
    }
  }

  /** 플레이어의 스탯을 재측정하고, 해당 플레이어 정보를 리턴합니다. */
  static getPlayerObjectStat () {
    this.processStat()
    return {
      attack: this.attack,
      hp: this.hpMax,
      hpMax: this.hpMax,
      shield: this.shieldMax,
      shieldMax: this.shieldMax,
      shieldRecovery: this.shieldRecovery,
      lv: this.lv,
      skillList: this.skillList,
    }
  }

  static getAttackWeaponValue () {
    this.processStat()
    return Math.floor(this.attack * this.ATTACK_MULTIPLE_WEAPON)
  }
  
  static getAttackSkillValue () {
    this.processStat()
    return Math.floor(this.attack * this.ATTACK_MULTIPLE_SKILL)
  }

  /**
   * 저장 형식 (버전에 따라 변경될 수 있음.)
   * 하위 호환 함수로만 제공
   * v0.55 에서도 이 함수를 호출하는 것으로 확인되므로 이 함수는 유지됩니다.  
   * 단, 추후에 이 함수는 변경될 수 있습니다.
   save 권한이 gameSystem으로 이동했기 때문입니다.
   * @returns {UserSaveData} 세이브데이터의 문자열
   */
  static getSaveData () {
    const inventory = this.inventory.getSaveData()

    return {
      lv: this.lv,
      exp: this.exp,
      gold: this.gold,
      equipmentIndex: this.equipmentIndex,
      weaponList: this.weaponList,
      skillList: this.skillList,
      weaponPreset: this.weaponPresetList,
      weaponPresetNumber: this.weaponPresetNumber,
      skillPreset: this.skillPresetList,
      skillPresetNumber: this.skillPresetNumber,
      inventoryItemIdList: inventory.idList,
      inventoryItemCountList: inventory.countList,
      inventoryItemUpgardeLevel: inventory.upgradeLevel,
      weaponUnlockList: this.weaponUnlockList,
      skillUnlockList: this.skillUnlockList,
      roundClearList: this.roundClearList,
      specialFlagList: this.specialFlagList,
    }
  }

  /**
   * 현재 버전에 대한 유저 데이터 로드
   * 
   * 하위호환 함수
   * 
   * @param {UserSaveData} saveData 저장 성공 여부
   * @returns {boolean}
   */
  static setLoadData (saveData) {
    if (saveData == null) return false

    // 해당 속성이 있을때에만 값을 추가합니다. (없으면 추가 안함)
    if (saveData.lv) this.lv = saveData.lv
    if (saveData.exp) this.exp = saveData.exp
    if (saveData.gold) this.gold = saveData.gold

    //@ts-ignore
    if (saveData.equipment) this.equipmentIndex = saveData.equipment

    // 무기 설정
    if (saveData.weaponList) {
      for (let i = 0; i < saveData.weaponList.length; i++) {
        this.setWeapon(i, saveData.weaponList[i])
      }
    }

    // 스킬 설정
    if (saveData.skillList) {
      for (let i = 0; i < saveData.skillList.length; i++) {
        this.setSkill(i, saveData.skillList[i])
      }
    }

    // 인벤토리 확인 (3개의 데이터 전부 존재해야함)
    if (saveData.inventoryItemIdList && saveData.inventoryItemCountList && saveData.inventoryItemUpgardeLevel) {
      let itemList = saveData.inventoryItemIdList
      let countList = saveData.inventoryItemCountList
      let upgardeLevelList = saveData.inventoryItemUpgardeLevel

      // 아이템 추가 (만약 문제가 발생하면, 해당 아이템은 소멸될 수 있음.)
      for (let i = 0; i < itemList.length; i++) {
        this.inventory.addItem(itemList[i], countList[i], upgardeLevelList[i])
      }
    }

    /** @type {number[]} */ let weaponPreset = []
    /** @type {number[]} */ let skillPreset = []
    if (saveData.weaponPresetNumber) this.weaponPresetNumber = saveData.weaponPresetNumber
    if (saveData.skillPresetNumber) this.skillPresetNumber = saveData.skillPresetNumber
    if (saveData.weaponPreset) weaponPreset = saveData.weaponPreset
    if (saveData.skillPreset) skillPreset = saveData.skillPreset

    // 데이터 유효성 체크
    if (typeof this.lv !== 'number') {
      this.lv = Number(this.lv)
      if (isNaN(this.lv)) {
        console.error(systemText.gameError.LOAD_USERLEVEL_ERROR)
        return false // 데이터를 불러오지 않음
      }
    }

    // 레벨 범위 체크
    if (this.lv < 0 || this.lv > this.expTable.length) {
      console.error(systemText.gameError.LOAD_USERLEVEL_ERROR, this.lv)
      return false // 데이터를 불러오지 않음
    }

    if (typeof this.exp !== 'number') {
      this.exp = Number(this.exp)
      if (isNaN(this.exp)) {
        console.error(systemText.gameError.LOAD_USERLEVEL_ERROR)
        return false // 데이터를 불러오지 않음
      }
    }

    // 보여지는 부분 설정을 하기 위해 현재 스킬값을 다시 재설정
    this.setSkillList(this.getSkillList())

    // 무기와 스킬 프리셋 불러오기
    const presetCount = 5
    if (weaponPreset != null && weaponPreset.length === presetCount * this.WEAPON_LIST_COUNT) {
      this.weaponPresetList = weaponPreset
    }
    if (skillPreset != null && skillPreset.length === presetCount * this.SKILL_LIST_TOTAL_COUNT) {
      this.skillPresetList = skillPreset
    }

    if (saveData.roundClearList) this.roundClearList = saveData.roundClearList
    if (saveData.weaponUnlockList) this.weaponUnlockList = saveData.weaponUnlockList
    if (saveData.skillUnlockList) this.skillUnlockList = saveData.skillUnlockList

    return true
  }
}
