//@ts-check

import { ID } from "./dataId.js"

/** 유저의 스탯을 StatView.html에서 볼 수 있도록 만든것... */
export class StatUser {
  /** 최대 레벨 */
  static MAX_LEVEL = 31

  /** 경험치 테이블 */
  static expTable = [
    0, 30000, 33000, 36000, 39000, 42000, 45000, 48000, 51000, 54000, // lv 0 ~ 9
    60000, 62000, 64000, 66000, 68000, 70000, 72000, 74000, 76000, 78000, // lv 10 ~ 19
    255500, 256000, 256500, 257000, 257500, 258000, 258500, 259000, 259500, 260000, // lv 20 ~ 29
    606600, 607200, 608400, 609000, 609600, 636600, 637200, 638400, 639000, 639600, // lv 30 ~ 39
    916000, 919000, 922000, 925000, 928000, 944000, 947000, 951000, 954000, 957000, // lv 40 ~ 49
    1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, // lv 50 ~ 59
  ]

  /** 공격력 보너스 테이블 */
  static attackLevelTable = [40000, // lv 0
    40000, 41000, 42000, 43000, 44000, 45000, 46200, 47400, 48600, 50000, // lv 1 ~ 10 (40000 ~ 50000)
    52500, 55000, 57500, 60000, 62000, 64000, 66000, 68000, 69000, 70000, // lv 11 ~ 20 (50000 ~ 70000)
    71500, 73000, 74500, 77000, 77500, 78000, 78500, 79000, 79500, 80000, // lv 21 ~ 30 (70000 ~ 80000)
    80400, 80800, 81200, 81600, 82000, 82400, 82800, 83200, 83600, 84000, // lv 31 ~ 40 (80000 ~ 84000)
    84400, 84800, 85200, 85600, 86000, 86400, 86800, 87200, 87600, 88000, // lv 41 ~ 50 (84000 ~ 88000)
    88400, 88800, 89200, 89600, 90000, 90200, 90400, 90600, 90800, 91000, // lv 51 ~ 55, 56 ~ 60 (88000 ~ 90000, 90000 ~ 92000)
  ]
}

/**
 * 무기의 기본 스탯 정보 (무기의 로직 구현은 weaponData에서 진행합니다.)
 */
export class StatWeapon {
  /**
   * 무기의 기본 스탯 정보 (무기의 로직 구현은 weaponData에서 진행합니다.)
   * 
   * @param {string} mainType 메인타입
   * @param {string} subType 서브타입
   * @param {number} repeatCount 해당 무기의 공격 반복 횟수, 이 값은 기본 1, 반복 횟수가 2 이상인 경우 그만큼 무기는 적을 반복 공격할 수 있음.
   * @param {number} repeatDelay 1번 반복시 걸리는 지연 대기 시간(단위: 프레임)
   * @param {boolean} isChase 추적 여부 (true일경우 적을 추적함.)
   * @param {boolean} isMultiTarget 다중 타켓 여부(이 값이 true면 스플래시 공격)
   * @param {number} maxTarget 최대타겟수 
   * isMultiTarget이 true일경우, 한 번 공격당 한번에 적을 타격할 수 있는 개수 (스플래시 최대 마리 수 제한)
   * 
   * isMultiTarget이 false일경우, 한번 공격 로직을 수행했을 때, 타격할 수 있는 적의 개수 (한번 공격당 반복횟수 1을 소모하고, 스플래시 공격이 아님, 
   * 모든 반복 횟수 소모시에는 남은 타겟 수와 상관없이 해당 무기는 사라짐)
   */
  constructor (mainType, subType, repeatCount = 1, repeatDelay = 0, isChase = false, isMultiTarget = false, maxTarget = 0) {
    this.mainType = mainType
    this.subType = subType
    this.isChaseType = isChase
    this.repeatCount = repeatCount
    this.repeatDelay = repeatDelay
    this.isMultiTarget = isMultiTarget
    this.maxTarget = maxTarget
    if (maxTarget === 0) maxTarget = isMultiTarget ? 20 : 1
  }
}

/**
 * 플레이어가 사용하는 무기에 대한 스탯 정보
 */
export class StatPlayerWeapon {
  /**
   * 플레이어가 사용하는 무기에 대한 스탯 정보
   * @param {string} group 그룹 타입
   * @param {string} name 무기의 이름
   * @param {string} balance 밸런스 타입
   * @param {number} delay 무기가 각 발사되기 까지의 지연시간
   * @param {number} attackMultiple 공격 배율 (기본값 1, 1보다 높으면 해당 무기의 공격력이 더 높아짐)
   * @param {number} shotCount 무기가 발사될 때 동시에 발사되는 개수
   * @param {number[]} weaponIdList 플레이어무기에서 사용하는 실제 무기 idList (여러개가 있으면 여러개의 무기를 사용)
   */
  constructor (group, name, balance, delay, attackMultiple, shotCount, weaponIdList = [ID.weapon.unused]) {
    this.group = group
    this.name = name
    this.balance = balance
    this.delay = delay
    this.attackMultiple = attackMultiple
    this.shotCount = shotCount
    this.weaponIdList = weaponIdList
    /** 잠금상태: 이 값이 있다면, 해당 무기는 특정 조건을 맞아야만 사용할 수 있음. @type {boolean} */ this.lock = true
  
    /** 무기 공격력 (기준값 10000 기준으로 무기의 예상 공격력 계산, 단 정확하지 않음. 왜냐하면 아직 무기의 repeatCount를 모름) */
    this.weaponAttack = this.getCurrentAttack()

    // 무기 그룹의 지정에 따라 조건 잠금 설정
    const PGroup = StatPlayerWeapon.groupTypeList
    if (this.group === PGroup.GROUP1 || this.group === PGroup.GROUP2 || this.group === '') {
      this.lock = false // 기본 무기는 자동 잠금 해제 (해당 요소를 조사할 필요가 없음)
    }
  }

  /** 
   * 자신의 현재 공격력과 관련된 무기 공격력을 얻습니다.
   * @param {number} [attack=10000] 공격력의 기준치
   * @param {number} weaponRepeatCount 해당하는 무기의 반복 횟수: 이 값은 무기의 데이터를 직접 얻어서 수동으로 입력해주세요.
   * 
   * 게임 구현상, repeatCount를 알려면, weapon의 데이터를 가져와야 합니다.
   */
  getCurrentAttack (attack = 10000, weaponRepeatCount = 1) {
    let totalDamage = (attack * this.attackMultiple)
    let divide = this.shotCount * (60 / this.delay) * weaponRepeatCount
    if (isNaN(divide)) divide = 0

    // 0으로 나누기될경우, 강제로 0을 리턴
    /** 무기 공격력 (기준값 10000 기준으로 무기의 예상 공격력 계산) */
    return divide !== 0 ? Math.floor(totalDamage / divide) : 0
  }

  static balanceTypeList = {
    /** 유니크/고유 (다른 무기와 달리 고유한 특징을 가지고 있음) */ UNIQUE: 'unique',
    /** 멀티샷 (무기 발사 개체가 혼합형태, 단 스플래시는 아님) */ MULTYSHOT: 'multyshot',
    /** 스플래시 (무기 1회 공격시에, 동시에 여러 적을 공격할 수 있는 경우, 다른 그룹보다 우선순위 높음) */ SPLASH: 'splash',
    /** 리플렉트/반사 (무기가 벽에게 튕겨나갈 수 있는 경우, 적도 튕길 수 있으나 해당하는 무기는 거의 없음) */ REFLECT: 'reflect',
    /** 페네트레이션/관통 (무기가 공격횟수가 남았을 때, 지속적으로 남은 적을 추가 공격할 수 있음.) */ PENETRATION: 'penetration',
    /** 체이스/추적 (무기가 적을 무조건 추적만 하는 경우, 단 스플래시는 해당하지 않음.) */ CHASE: 'chase',
    /** 프론트/전방 (무기는 반드시 플레이어의 기준 방향 으로만 발사됨, 따라서 위,아래만 발사하면 front가 아님) */ FRONT: 'front',
    /** 사이드웨이브 (무기 발사체는 여러방향을 띔, 멀티샷과는 다르게 성향은 1개, 방향은 여러개임) */ SIDEWAVE: 'sidewave',
  }

  /** 무기의 그룹 타입, 이 타입들은 해당 무기 잠금에 영향을 줄 수 있음. (스킬하고도 그룹 타입은 공유) */
  static groupTypeList = {
    /** 그룹 1, 기본으로 열림, 라운드 1 신규 무기 */ GROUP1: 'group1',
    /** 그룹 2, 기본으로 열림, 라운드 3 완성 이후 만들어진 신규 무기 */ GROUP2: 'group2',
    /** 동그라미 그룹, 라운드 2와 연관이 있음. 라운드 2-4에서 구매 가능 */ DONGGRAMI: 'donggrami',
    /** 타워 그룹, 라운드 3과 연관이 있음. 라운드 2-4에서 구매 가능 하지만, 라운드 3-7을 클리어해야함 */ R3_TOWER: 'r3_tower',
  }

  /** (아직 이 함수는 임시 함수임) 언락 조건을 얻어옵니다. (string으로 리턴됨) */
  static getUnlockCondition (groupType = '') {
    let G = StatPlayerWeapon.groupTypeList
    if (groupType === G.DONGGRAMI) {
      return '동그라미 마을 상점(라운드 2-4) 에서 구매 가능'
    } else if (groupType === G.R3_TOWER) {
      return '동그라미 마을 상점(라운드 2-4) 에서 구매 가능 (단, 3-7을 클리어해야함)'
    }
  }
}

/**
 * 플레이어가 사용하는 스킬에 대한 스탯 정보
 */
export class StatPlayerSkill {
  /**
   * 플레이어가 사용하는 스킬에 대한 스탯 정보
   * @param {string} group 그룹 타입
   * @param {string} name 스킬의 이름
   * @param {string} balance 밸런스 타입
   * @param {number} coolTime 스킬의 쿨타임 (초)
   * @param {number} delay 스킬의 각 무기가 한번 반복할 때 발사 당 지연 시간
   * @param {number} attackMultiple 무기의 공격 배율(기본값 1) 이 숫자가 높으면 공격력 증가
   * @param {number} shotCount 한번 발사 시에 나오는 무기의 개수
   * @param {number} repeatCount 스킬의 각 무기가 반복 발사되는 횟수
   * @param {number[]} weaponIdList 플레이어스킬에서 실제 사용하는 무기의 idList
   */
  constructor (group = '', name = 'unused', balance = '', coolTime = 20, delay = 0, attackMultiple = 1, shotCount = 1, repeatCount = 1, weaponIdList = [ID.weapon.unused]) {
    this.group = group
    this.balance = balance
    this.name = name
    this.coolTime = coolTime
    this.delay = delay
    this.multiple = attackMultiple
    this.shot = shotCount
    this.repeat = repeatCount
    this.weaponIdList = weaponIdList
    this.lock = true

    this.currentWeapon = dataExportStatWeapon.get(weaponIdList[0])
    this.hit = this.currentWeapon?.repeatCount || 1

    // 0으로 나누기 금지
    /** 무기 공격력 (기준값 10000 기준으로 무기의 예상 공격력 계산) */
    this.weaponAttack = this.getCurrentAttack()

    // 스킬 그룹의 지정에 따라 조건 잠금 설정
    const PGroup = StatPlayerSkill.groupTypeList
    if (this.group === PGroup.GROUP1 || this.group === PGroup.GROUP2 || this.group === '') {
      this.lock = false // 기본 무기는 자동 잠금 해제 (해당 요소를 조사할 필요가 없음)
    }
  }

  /** 자신의 현재 공격력과 관련된 무기 공격력을 얻습니다. */
  getCurrentAttack (attack = 10000) {
    let totalDamage = (attack * this.coolTime * this.multiple)
    let divide = this.shot * this.repeat * this.hit

    // 0으로 나누기될경우, 강제로 0을 리턴
    return divide !== 0 ? Math.floor(totalDamage / divide) : 0
  }

  static groupTypeList = StatPlayerWeapon.groupTypeList
  static getUnlockCondition = StatPlayerWeapon.getUnlockCondition

  static balanceTypeList = {
    SPLASH: 'splash',
    AREA: 'area',
    CHASE: 'chase',
    SHOT: 'shot'
  }
}

/**
 * 각 라운드에 대한 기본적인 정보
 * 
 * (라운드의 구현은 dataRound.js에서 처리합니다. 이 클래스는 스탯값만 정의하고 알고리즘 또는 라운드 구현을 하지 않습니다.)
 */
export class StatRound {
  /**
   * 각 라운드에 대한 기본적인 정보
   * 
   * 주의: 이 값들은 절대적인 기준을 표현하지만, 일부 라운드는 예외가 있을 수 있습니다. (그러나, 극히 일부 라운드만 이 기준과는 조금 다른 기준을 사용합니다.)
   * 
   * (라운드의 구현은 dataRound.js에서 처리합니다. 이 클래스는 스탯값만 정의하고 알고리즘 또는 라운드 구현을 하지 않습니다.)
   * 
   * (참고: 입력될 내용의 문자열이 길 수 있기 때문에 roundInfo는 맨 마지막 매개변수로 지정되었습니다.)
   * @param {number} [iconNumber=-1] 라운드 아이콘의 번호 (roundIcon.png에 있는 여러 아이콘들중에 어떤것을 선택할건지에 대한 값), -1은 아이콘 없음
   * @param {number} [prevRoundId=0] 이전 라운드의 id, 이 값이 0이 아닌경우 해당 라운드를 클리어 해야 오픈됨
   * @param {string} roundText 라운드 값을 표시할 텍스트, 예시: 1-1, 한글 사용 금지, 일부 기호와 알파벳만 사용가능, 최대 5글자까지 지원(검사하진 않음...)
   * @param {string} roundName 라운드의 이름
   * @param {number} requireLevel 해당 라운드를 플레이하기 위한 최소 레벨 (해당 레벨 이상만 플레이 가능)
   * @param {number} requireAttack 기준 파워(전투력) 해당 라운드에서 얼마만큼의 전투력을 기준으로 적을 배치했는지에 대한 값
   * @param {number} finishTime 종료 시간(단위: 초), 해당 라운드를 클리어 하기 위해 사용해야 하는 시간 (단, 이것은 기준 시간이며, 일부 라운드는 특정 상황이 되면 강제로 클리어 할 수 있음.)
   * @param {number} clearBonus 라운드를 클리어했을 때 얻는 점수
   * @param {number} gold 라운드에 대한 골드의 값 (이 값은 10초당 획득하는 단위로 구성되어있습니다.)
   * @param {string} roundInfo 
   */
  constructor (iconNumber = -1, prevRoundId = 0, roundText = 'NULL', roundName = 'NULL', requireLevel = 0, requireAttack = 0, finishTime = 1, clearBonus = 0, gold = 0, roundInfo = '') {
    /** 아이콘의 번호 (-1인경우 없음) */ this.iconNumber = iconNumber
    /** 이전 라운드의 id (이 값이 0이 아니면 해당 라운드를 클리어 해야 오픈됨) */ this.prevRoundId = prevRoundId
    /** 스탯라인에 표시될 라운드 텍스트값 (예를들어 1-1 같은거) */ this.roundText = roundText
    /** 라운드의 이름 */ this.roundName = roundName
    /** 해당 라운드를 플레이하기 위한 최소 레벨 */ this.requireLevel = requireLevel
    /** 해당 라운드를 진행하기 위해 필요한 공격력값 (이 값의 90% 미만 플레이 불가능) */ this.requireAttack = requireAttack
    /** 라운드가 클리어되는 기준이 되는 시간 */ this.finishTime = finishTime
    /** 라운드를 클리어했을 때 얻는 보너스 점수 */ this.clearBonus = clearBonus
    /** 라운드를 플레이하면서 얻는 골드의 기준값, 10초단위로 계산됨 */ this.gold = gold
    /** 라운드 설명 또는 정보 */ this.roundInfo = roundInfo
    /** 총합 골드량 */ this.goldTotal = this.gold * Math.floor(finishTime / 10)

    // 추가적인 옵션 자동 설정
    /** 해당 라운드를 진행하기 위해 필요한 최소 공격력값 (이 값 미만은 플레이 불가능) */ this.minAttack = Math.floor(requireAttack * 1)
  }

  /**
   * 라운드의 밸런스 측정을 위해 만들어둔 요소
   * @param {number} playTime 
   * @param {number} balanceScore 
   */
  setBalancePosition (playTime, balanceScore) {
    this.playTime = playTime
    this.balanceScore = balanceScore
    this.scoreTimeDiv = Math.floor(balanceScore / playTime)
  }

  /** 라운드 월드에 대한 정보 (전부 static) */
  static world = class {
    /** 라운드 아이콘 리스트 (0번 라운드는 없기 때문에 -1임) */
    static iconList = [-1, 1, 10, 20]

    /** 각 라운드를 대표하는 제목 */
    static TitleList = [
      '',
      '우주 여행 ~ 운석 지대',
      '동그라미 마을',
      '다운 타워'
    ]

    static roundWorldInfoText1List = [
      '',
      '파란 행성으로 빠르게 이동하기 위해 운석지대를 지나가는 중',
      '동그라미 마을을 둘러보면서 무슨 일이 벌어졌는지를 찾아본다.',
      '다운 타워 내부에 있는 수많은 적들을 처치해야 한다.'
    ]

    static roundWorldInfoText2List = [
      '',
      '이상한 일들이 벌어졌다.',
      '',
      '',
    ]

    static requireLevelMinList = [0, 1, 10, 20]
    static requireLevelMaxList = [0, 9, 19, 29]
    static requireAttackMinList = [0, 40000, 50000, 70000]
    static requireAttackMaxList = [0, 45000, 60000, 77000]
  }
}

export class StatRoundBalance {
  /**
   * 라운드의 밸런스 측정을 위해 만들어둔 요소
   * @param {number} playTime 
   * @param {number} balanceScore 
   */
  constructor (playTime = 180, balanceScore = 90000) {
    /** 제작자가 정한 해당 라운드에서 얻어야하는 기준에 대한 점수 (밸런스 측정 용도) */ this.playTime = playTime
    /** 라운드를 클리어하기 위해 사용해야 하는 대략적인 시간 (밸런스 측정 용도) */ this.balanceScore = balanceScore
    this.timeDivScore = Math.floor(balanceScore / playTime)
  }
}

export class StatItem {
  /**
   * 아이템의 정보를 생성 (아이템의 구현은 다른곳에서 처리해야함)
   * @param {number} iconNumber 아이콘 번호 (-1인경우, 없음)
   * @param {string} type 아이템 타입 (equipment, item)
   * @param {string} name 이름
   * @param {number} price 가격 (참고: 판매가격은 비용의 1/10임)
   * @param {string} info 정보
   */
  constructor (iconNumber = -1, type, name = '', price = 1000, info = '') {
    /** 아이콘 번호 */ this.iconNumber = iconNumber
    /** 아이템 타입 */ this.type = type
    /** 아이템의 이름 */ this.name = name
    /** 아이템의 기본 가격 */ this.price = price
    /** 아이템의 정보 */ this.info = info

    /** 장비 아이템 착용 제한 레벨 */ this.equipmentRequireLevel = 0
    /** 공격력 */ this.equipmentAttack = 0
    /** 장비 아이템의 업그레이드 비용 */ this.equipmentUpgradeCost = 0
  }

  /**
   * 장비에 대한 기본적인 정보 (장비 아이템이 아니면 접근 불가)
   * 
   * @param {number} requireLevel 장비를 장착하기 위해 필요한 레벨
   * @param {number} attack 장비의 공격력
   * @param {number} upgradeCost 장비의 업그레이드 기본 비용
   */
  setEquipmentInfo (requireLevel, attack, upgradeCost) {
    this.equipmentRequireLevel = requireLevel,
    this.equipmentAttack = attack,
    this.equipmentUpgradeCost = upgradeCost
  }

  static TYPE_ITEM = 'item'
  static TYPE_EQUIPMENT = 'equipment'

  /** 장비에 대한 업그레이드 최대레벨 */
  static UPGRADE_LEVEL_MAX = 30

  /** 장비에 대한 업그레이드 시 공격력의 기준 퍼센트 */
  static upgradeAttackPercentTable = [
    100, 104, 108, 112, 118,  124, 130, 138, 146, 154,  162, 170, 178, 186, // 0 ~ 13
    200, 210, 220, 230, 241,  252, 263, 275, 287, // 14 ~ 22
    300, 314, 328, 342, 356,  370, 384, 400 // 23 ~ 30
  ]

  /** 장비에 대한 업그레이드 시 비용의 기준 퍼센트 */
  static upgradeCostPercentTable = [
    0, 100, 100, 110, 110,  120, 120, 140, 140, 160,  160, 170, 180, 190, // 0 ~ 13
    200, 200, 250, 250, 300,  300, 350, 400, 450, // 14 ~ 22
    500, 550, 600, 650, 700,  700, 800, 1000 // 23 ~ 30
  ]

  /** 장비를 판매할 때 환수되는 비용의 비율 */
  static upgradeRefundPercentTable = [
    20, 20, 20, 20, 20,  20, 20, 20, 20, 20,  20, 20, 20, 20, // 0 ~ 13
    21, 21, 22, 22, 23,  23, 24, 24, 25, // 14 ~ 22
    25, 26, 26, 27, 27,  28, 29, 30 // 23 ~ 30
  ]

  static #getUpgradeCostTotalPercentTable () {
    let table = []
    let total = 0
    for (let i = 0; i < this.upgradeCostPercentTable.length; i++) {
      total += this.upgradeCostPercentTable[i]
      table.push(total)
    }
    
    return table
  }

  static upgradeCostTotalPercentTable = this.#getUpgradeCostTotalPercentTable()

  static #getUpgradeCostTotalRefundTable () {
    let table = []
    for (let i = 0; i < this.upgradeCostTotalPercentTable.length; i++) {
      let result = this.upgradeCostTotalPercentTable[i] / 100 * this.upgradeRefundPercentTable[i]
      table.push(Math.floor(result))
    }
    
    return table
  }

  static upgradeCostTotalRefundTable = this.#getUpgradeCostTotalRefundTable()
}

/**
 * 외부에서 사용하기 위한 weapon 스탯 객체
 * @type {Map<number, StatWeapon>}
 */
export const dataExportStatWeapon = new Map()
dataExportStatWeapon.set(ID.weapon.multyshot, new StatWeapon('multyshot', 'multyshot'))
dataExportStatWeapon.set(ID.weapon.missile, new StatWeapon('missile', 'missileA', 2, 6, true, true, 10))
dataExportStatWeapon.set(ID.weapon.missileRocket, new StatWeapon('missile', 'missileB', 2, 6, false, true, 10))
dataExportStatWeapon.set(ID.weapon.arrow, new StatWeapon('arrow', 'arrow'))
dataExportStatWeapon.set(ID.weapon.laser, new StatWeapon('laser', 'laser', 5, 0, false, false, 14))
dataExportStatWeapon.set(ID.weapon.laserBlue, new StatWeapon('laser', 'laserBlue', 5, 0, true, false, 14))
dataExportStatWeapon.set(ID.weapon.sapia, new StatWeapon('sapia', 'sapia', 2, 5, true))
dataExportStatWeapon.set(ID.weapon.sapiaShot, new StatWeapon('sapia', 'sapiaShot', 1, 10, true))
dataExportStatWeapon.set(ID.weapon.parapo, new StatWeapon('parapo', 'parapo', 1, 0, true))
dataExportStatWeapon.set(ID.weapon.parapoShockWave, new StatWeapon('parapo', 'shockWave', 1, 0, false, true, 12))
dataExportStatWeapon.set(ID.weapon.rapid, new StatWeapon('rapid', 'rapid', 1, 0, false))
dataExportStatWeapon.set(ID.weapon.blaster, new StatWeapon('blaster', 'blaster', 1, 0, false))
dataExportStatWeapon.set(ID.weapon.blaster, new StatWeapon('blaster', 'blastermini', 1, 0, false))
dataExportStatWeapon.set(ID.weapon.sidewave, new StatWeapon('sidewave', 'sidewave'))
dataExportStatWeapon.set(ID.weapon.ring, new StatWeapon('ring', 'ring'))
dataExportStatWeapon.set(ID.weapon.seondanil, new StatWeapon('seondanil', 'seondanil'))
dataExportStatWeapon.set(ID.weapon.boomerang, new StatWeapon('boomerang', 'boomerang', 4, 0, false, false, 10))
dataExportStatWeapon.set(ID.weapon.kalnal, new StatWeapon('kalnal', 'kalnal', 8, 1, false, false, 4))
dataExportStatWeapon.set(ID.weapon.cogwheel, new StatWeapon('cogwheel', 'cogwheel', 30, 2, false, false, 10))
dataExportStatWeapon.set(ID.weapon.yeonsai, new StatWeapon('yeonsai', 'yeonsai'))
dataExportStatWeapon.set(ID.weapon.sabangtan, new StatWeapon('sabangtan', 'sabangtan', 2, 6, false, true, 10))
dataExportStatWeapon.set(ID.weapon.subMultyshot, new StatWeapon('subweapon', 'subweapon'))
dataExportStatWeapon.set(ID.weapon.r3TowerPink, new StatWeapon('towerpink', 'towerpink', 5, 0, false, false, 5))
dataExportStatWeapon.set(ID.weapon.r3TowerPurple, new StatWeapon('towerpurple', 'towerpurple'))
dataExportStatWeapon.set(ID.weapon.r3Helljeon, new StatWeapon('towerhelljeon', 'towerhelljeon'))

const Tskill = 'skill' // 스킬 타입
const TskillSub = 'skillSub' // 스킬 서브 타입
dataExportStatWeapon.set(ID.weapon.skillMultyshot, new StatWeapon(Tskill, 'multyshot', 1, 0, true))
dataExportStatWeapon.set(ID.weapon.skillMissile, new StatWeapon(Tskill, 'missile', 10, 4, true, true, 20))
dataExportStatWeapon.set(ID.weapon.skillArrow, new StatWeapon(Tskill, 'arrow', 4, 0, false, false, 4))
dataExportStatWeapon.set(ID.weapon.skillLaser, new StatWeapon(Tskill, 'laser', 60, 4, false, true, 14))
dataExportStatWeapon.set(ID.weapon.skillSapia, new StatWeapon(Tskill, 'sapia', 10, 6, true, true, 4))
dataExportStatWeapon.set(ID.weapon.skillParapo, new StatWeapon(Tskill, 'parapo', 1, 0, true, true, 24))
dataExportStatWeapon.set(ID.weapon.skillBlaster, new StatWeapon(Tskill, 'blaster'))
dataExportStatWeapon.set(ID.weapon.skillSidewave, new StatWeapon(Tskill, 'sidewave'))
dataExportStatWeapon.set(ID.weapon.skillSword, new StatWeapon(Tskill, 'sword', 80, 3, true))
dataExportStatWeapon.set(ID.weapon.skillHyperBall, new StatWeapon(Tskill, 'hyperball', 6, 0, false, false, 6))
dataExportStatWeapon.set(ID.weapon.skillCriticalChaser, new StatWeapon(Tskill, 'criticalchaser', 4, 6, false, true, 35))
dataExportStatWeapon.set(ID.weapon.skillPileBunker, new StatWeapon(Tskill, 'pilebunker', 16, 6, false, true, 4))
dataExportStatWeapon.set(ID.weapon.skillSantansu, new StatWeapon(Tskill, 'santansu', 6, 9, false, true, 14))
dataExportStatWeapon.set(ID.weapon.skillWhiteflash, new StatWeapon(Tskill, 'whiteflash', 40, 4, true, true, 22))
dataExportStatWeapon.set(ID.weapon.skillWhiteflashSmoke, new StatWeapon(TskillSub, 'whiteflashsmoke', 1, 4, true, true, 22))
dataExportStatWeapon.set(ID.weapon.skillRing, new StatWeapon(Tskill, 'ring', 1, 1, false, false, 1))
dataExportStatWeapon.set(ID.weapon.skillRapid, new StatWeapon(Tskill, 'rapid'))
dataExportStatWeapon.set(ID.weapon.skillSeondanil, new StatWeapon(Tskill, 'seondanil', 50, 3))
dataExportStatWeapon.set(ID.weapon.skillSeondanilMini, new StatWeapon(TskillSub, 'seondanilmini', 1, 3))
dataExportStatWeapon.set(ID.weapon.skillHanjumoek, new StatWeapon(Tskill, 'hanjumoek', 30, 5, false, true, 26))
dataExportStatWeapon.set(ID.weapon.skillBoomerang, new StatWeapon(Tskill, 'boomerang', 30, 3, false, false, 1))
dataExportStatWeapon.set(ID.weapon.skillMoon, new StatWeapon(Tskill, 'moon', 90, 2, false, true, 9999))
dataExportStatWeapon.set(ID.weapon.skillKalnal, new StatWeapon(Tskill, 'kalnal', 6, 8, false, false, 2))
dataExportStatWeapon.set(ID.weapon.skillCogwheel, new StatWeapon(Tskill, 'cogwheel', 30, 6, false, true, 6))
dataExportStatWeapon.set(ID.weapon.skillYeonsai, new StatWeapon(Tskill, 'yeonsai'))
dataExportStatWeapon.set(ID.weapon.skillSabangtan, new StatWeapon(Tskill, 'sabangtan', 4, 4, false, true, 20))
dataExportStatWeapon.set(ID.weapon.skillHabirant, new StatWeapon(Tskill, 'habirant', 150, 6, true, false, 1))
dataExportStatWeapon.set(ID.weapon.skillHabirantSub, new StatWeapon(TskillSub, 'habirantSub'))
dataExportStatWeapon.set(ID.weapon.skillIcechaser, new StatWeapon(Tskill, 'iceChaser', 4, 6, true, true, 34))
dataExportStatWeapon.set(ID.weapon.skillCalibur, new StatWeapon(Tskill, 'calibur', 16, 8))
dataExportStatWeapon.set(ID.weapon.skillCaliburSub, new StatWeapon(TskillSub, 'caliburSub'))
dataExportStatWeapon.set(ID.weapon.skillSujikpa, new StatWeapon(Tskill, 'sujikpa', 4, 10, false, true, 22))
dataExportStatWeapon.set(ID.weapon.skillSpeaker, new StatWeapon(Tskill, 'speaker', 6, 30, false, true, 5))
dataExportStatWeapon.set(ID.weapon.skillEomukggochi, new StatWeapon(Tskill, 'eomukggochi', 60, 30))
dataExportStatWeapon.set(ID.weapon.skillEomukggochiSub, new StatWeapon(TskillSub, 'emoukggochi'))
dataExportStatWeapon.set(ID.weapon.skillR2Firecraker, new StatWeapon(Tskill, 'firecracker', 1, 0, false, true, 20))
dataExportStatWeapon.set(ID.weapon.skillR2Toyhammer, new StatWeapon(Tskill, 'toyhammer', 45, 6, true, false, 1))
dataExportStatWeapon.set(ID.weapon.skillR3Xkill, new StatWeapon(Tskill, 'Xkill', 150, 10, false, false, 1))
dataExportStatWeapon.set(ID.weapon.skillR3Xshot, new StatWeapon(Tskill, 'Xshot', 150, 10, false, false, 1))
dataExportStatWeapon.set(ID.weapon.skillR3XshotSub, new StatWeapon(TskillSub, 'XshotSub', 1, 1, false, false, 1))
dataExportStatWeapon.set(ID.weapon.skillR3Xbeam, new StatWeapon(Tskill, 'Xbeam', 80, 20, false, true, 1))
dataExportStatWeapon.set(ID.weapon.skillR3XbeamSub, new StatWeapon(TskillSub, 'XbeamSub', 5, 4, false, true, 33))
dataExportStatWeapon.set(ID.weapon.skillR3Xboom, new StatWeapon(Tskill, 'Xboom', 18, 9, false, true, 28))
dataExportStatWeapon.set(ID.weapon.skillR3XboomSub, new StatWeapon(TskillSub, 'XboomSub', 1, 1, false, true, 28))
dataExportStatWeapon.set(ID.weapon.skillR3Helljeon, new StatWeapon(Tskill, 'helljeon', 1, 1, false, false, 1))

/**
 * 외부에서 사용하기 위한 플레이어 웨폰 스탯
 * @type {Map<number, StatPlayerWeapon>}
 */
export const dataExportStatPlayerWeapon = new Map()
const DXweapon = dataExportStatPlayerWeapon
const IDweapon = ID.playerWeapon
const wGroup = StatPlayerWeapon.groupTypeList
const wBalance = StatPlayerWeapon.balanceTypeList
const pWeapon = StatPlayerWeapon
DXweapon.set(IDweapon.unused, new pWeapon(wGroup.GROUP1, 'unused', wBalance.UNIQUE, 0, 0, 0, [ID.weapon.unused]))
DXweapon.set(IDweapon.multyshot, new pWeapon(wGroup.GROUP1, 'multyshot', wBalance.MULTYSHOT, 10, 1, 6, [ID.weapon.multyshot]))
DXweapon.set(IDweapon.missile, new pWeapon(wGroup.GROUP1, 'missile', wBalance.SPLASH, 30, 0.8, 4, [ID.weapon.missile, ID.weapon.missileRocket]))
DXweapon.set(IDweapon.arrow, new pWeapon(wGroup.GROUP1, 'arrow', wBalance.REFLECT, 10, 1.04, 2, [ID.weapon.arrow]))
DXweapon.set(IDweapon.laser, new pWeapon(wGroup.GROUP1, 'laser', wBalance.PENETRATION, 12, 1, 4, [ID.weapon.laser, ID.weapon.laserBlue]))
DXweapon.set(IDweapon.sapia, new pWeapon(wGroup.GROUP1, 'sapia', wBalance.CHASE, 10, 1, 1, [ID.weapon.sapia]))
DXweapon.set(IDweapon.parapo, new pWeapon(wGroup.GROUP1, 'parapo', wBalance.SPLASH, 30, 0.81, 3, [ID.weapon.parapo]))
DXweapon.set(IDweapon.blaster, new pWeapon(wGroup.GROUP1, 'blaster', wBalance.MULTYSHOT, 6, 1.07, 2, [ID.weapon.blaster, ID.weapon.blasterMini]))
DXweapon.set(IDweapon.sidewave, new pWeapon(wGroup.GROUP1, 'sidewave', wBalance.SIDEWAVE, 15, 1.1, 8, [ID.weapon.sidewave]))
DXweapon.set(IDweapon.ring, new pWeapon(wGroup.GROUP1, 'ring', wBalance.SIDEWAVE, 30, 1.12, 8, [ID.weapon.ring]))
DXweapon.set(IDweapon.rapid, new pWeapon(wGroup.GROUP1, 'rapid', wBalance.FRONT, 4, 1.2, 3, [ID.weapon.rapid]))
DXweapon.set(IDweapon.seondanil, new pWeapon(wGroup.GROUP1, 'seondanil', wBalance.UNIQUE, 60, 1.1, 5, [ID.weapon.seondanil]))
DXweapon.set(IDweapon.boomerang, new pWeapon(wGroup.GROUP1, 'boomerang', wBalance.UNIQUE, 20, 1.06, 3, [ID.weapon.boomerang]))
DXweapon.set(IDweapon.kalnal, new pWeapon(wGroup.GROUP2, 'kalnal', wBalance.REFLECT, 30, 1.04, 2, [ID.weapon.kalnal]))
DXweapon.set(IDweapon.cogwheel, new pWeapon(wGroup.GROUP2, 'cogwheel', wBalance.PENETRATION, 40, 1.15, 1, [ID.weapon.cogwheel]))
DXweapon.set(IDweapon.yeonsai, new pWeapon(wGroup.GROUP2, 'yeonsai', wBalance.SIDEWAVE, 6, 1.09, 6, [ID.weapon.yeonsai]))
DXweapon.set(IDweapon.sabangtan, new pWeapon(wGroup.GROUP2, 'sabangtan', wBalance.SPLASH, 30, 0.88, 4, [ID.weapon.sabangtan]))
DXweapon.set(IDweapon.r3TowerPink, new pWeapon(wGroup.R3_TOWER, 'towerpink', wBalance.CHASE, 15, 1, 1, [ID.weapon.r3TowerPink]))
DXweapon.set(IDweapon.r3TowerPurple, new pWeapon(wGroup.R3_TOWER, 'towerpurple', wBalance.REFLECT, 10, 1.04, 2, [ID.weapon.r3TowerPurple]))
DXweapon.set(IDweapon.r3Helljeon, new pWeapon(wGroup.R3_TOWER, 'helljeon', wBalance.MULTYSHOT, 10, 1.04, 4, [ID.weapon.r3Helljeon]))

/**
 * 외부에서 사용하기 위한 플레이어 스킬 스탯
 * @type {Map<number, StatPlayerSkill>}
 */
export const dataExportStatPlayerSkill = new Map()
const DXskill = dataExportStatPlayerSkill
const IDskill = ID.playerSkill
const sGroup = StatPlayerSkill.groupTypeList
const sBalance = StatPlayerSkill.balanceTypeList
const pSkill = StatPlayerSkill
DXskill.set(IDskill.unused, new pSkill(sGroup.GROUP1, 'unused', sBalance.SHOT, 0, 0, 0, 0, 0, [ID.weapon.unused]))
DXskill.set(IDskill.multyshot, new pSkill(sGroup.GROUP1, 'multyshot', sBalance.CHASE, 20, 6, 1, 5, 30, [ID.weapon.skillMultyshot]))
DXskill.set(IDskill.missile, new pSkill(sGroup.GROUP1, 'missile', sBalance.SPLASH, 20, 20, 0.8, 2, 4, [ID.weapon.skillMissile]))
DXskill.set(IDskill.arrow, new pSkill(sGroup.GROUP1, 'arrow', sBalance.SHOT, 20, 9, 1, 2, 20, [ID.weapon.skillArrow]))
DXskill.set(IDskill.laser, new pSkill(sGroup.GROUP1, 'laser', sBalance.AREA, 20, 0, 0.78, 1, 1, [ID.weapon.skillLaser]))
DXskill.set(IDskill.sapia, new pSkill(sGroup.GROUP1, 'sapia', sBalance.AREA, 24, 60, 1, 4, 4, [ID.weapon.skillSapia]))
DXskill.set(IDskill.parapo, new pSkill(sGroup.GROUP1, 'parapo', sBalance.SPLASH, 24, 10, 0.81, 1, 24, [ID.weapon.skillParapo]))
DXskill.set(IDskill.blaster, new pSkill(sGroup.GROUP1, 'blaster', sBalance.SHOT, 24, 4, 1.25, 2, 40, [ID.weapon.skillBlaster]))
DXskill.set(IDskill.sidewave, new pSkill(sGroup.GROUP1, 'sidewave', sBalance.SHOT, 20, 7, 1.08, 3, 24, [ID.weapon.skillSidewave]))
DXskill.set(IDskill.sword, new pSkill(sGroup.GROUP1, 'sword', sBalance.CHASE, 24, 0, 1, 1, 1, [ID.weapon.skillSword]))
DXskill.set(IDskill.hyperBall, new pSkill(sGroup.GROUP1, 'hyperball', sBalance.CHASE, 20, 15, 1, 2, 12, [ID.weapon.skillHyperBall]))
DXskill.set(IDskill.critcalChaser, new pSkill(sGroup.GROUP1, 'criticalchaser', sBalance.SPLASH, 28, 10, 0.96, 2, 12, [ID.weapon.skillCriticalChaser]))
DXskill.set(IDskill.pileBunker, new pSkill(sGroup.GROUP1, 'pilebunker', sBalance.AREA, 28, 60, 1.32, 1, 1, [ID.weapon.skillPileBunker]))
DXskill.set(IDskill.santansu, new pSkill(sGroup.GROUP1, 'santansu', sBalance.AREA, 24, 30, 0.95, 5, 5, [ID.weapon.skillSantansu]))
DXskill.set(IDskill.whiteflash, new pSkill(sGroup.GROUP1, 'whiteflash', sBalance.AREA, 24, 0, 0.9, 1, 1, [ID.weapon.skillWhiteflash]))
DXskill.set(IDskill.ring, new pSkill(sGroup.GROUP1, 'ring', sBalance.SHOT, 20, 12, 1.04, 8, 12, [ID.weapon.skillRing]))
DXskill.set(IDskill.rapid, new pSkill(sGroup.GROUP1, 'rapid', sBalance.SHOT, 20, 4, 1.15, 4, 40, [ID.weapon.skillRapid]))
DXskill.set(IDskill.seondanil, new pSkill(sGroup.GROUP1, 'seondanil', sBalance.SHOT, 28, 0, 1.2, 1, 1, [ID.weapon.skillSeondanil]))
DXskill.set(IDskill.hanjumoek, new pSkill(sGroup.GROUP1, 'hanjumeok', sBalance.SPLASH, 28, 0, 1.1, 1, 1, [ID.weapon.skillHanjumoek]))
DXskill.set(IDskill.boomerang, new pSkill(sGroup.GROUP1, 'boomerang', sBalance.AREA, 20, 0, 1.14, 3, 1, [ID.weapon.skillBoomerang]))
DXskill.set(IDskill.moon, new pSkill(sGroup.GROUP1, 'moon', sBalance.AREA, 28, 1, 0.72, 1, 1, [ID.weapon.skillMoon]))
DXskill.set(IDskill.kalnal, new pSkill(sGroup.GROUP2, 'kalnal', sBalance.SHOT, 20, 20, 1.08, 2, 6, [ID.weapon.skillKalnal]))
DXskill.set(IDskill.cogwheel, new pSkill(sGroup.GROUP2, 'cogwheel', sBalance.AREA, 20, 0, 1.25, 1, 1, [ID.weapon.skillCogwheel]))
DXskill.set(IDskill.yeonsai, new pSkill(sGroup.GROUP2, 'yeonsai', sBalance.SHOT, 20, 5, 1.07, 10, 30, [ID.weapon.skillYeonsai]))
DXskill.set(IDskill.sabangtan, new pSkill(sGroup.GROUP2, 'sabangtan', sBalance.SPLASH, 20, 15, 0.88, 6, 5, [ID.weapon.skillSabangtan]))
DXskill.set(IDskill.habirant, new pSkill(sGroup.GROUP2, 'habirant', sBalance.SHOT, 24, 0, 1, 1, 1, [ID.weapon.skillHabirant, ID.weapon.skillHabirantSub]))
DXskill.set(IDskill.icechaser, new pSkill(sGroup.GROUP2, 'icechaser', sBalance.SPLASH, 28, 10, 1.02, 2, 12, [ID.weapon.skillIcechaser]))
DXskill.set(IDskill.calibur, new pSkill(sGroup.GROUP2, 'calibur', sBalance.SHOT, 24, 1, 1.07, 1, 1, [ID.weapon.skillCalibur]))
DXskill.set(IDskill.sujikpa, new pSkill(sGroup.GROUP2, 'sujikpa', sBalance.AREA, 20, 20, 0.82, 1, 8, [ID.weapon.skillSujikpa]))
DXskill.set(IDskill.speaker, new pSkill(sGroup.GROUP2, 'speaker', sBalance.AREA, 24, 1, 0.85, 1, 1, [ID.weapon.skillSpeaker]))
DXskill.set(IDskill.eomukggochi, new pSkill(sGroup.GROUP2, 'eomukggochi', sBalance.SHOT, 24, 0, 1.05, 1, 1, [ID.weapon.skillEomukggochi]))
DXskill.set(IDskill.r2Firecracker, new pSkill(sGroup.DONGGRAMI, 'firecracker', sBalance.SPLASH, 24, 12, 0.86, 1, 15, [ID.weapon.skillR2Firecraker]))
DXskill.set(IDskill.r2Toyhammer, new pSkill(sGroup.DONGGRAMI, 'toyhammer', sBalance.CHASE, 24, 1, 1, 1, 1, [ID.weapon.skillR2Toyhammer]))
DXskill.set(IDskill.r3Xkill, new pSkill(sGroup.R3_TOWER, 'Xkill', sBalance.CHASE, 24, 0, 1, 1, 1, [ID.weapon.skillR3Xkill]))
DXskill.set(IDskill.r3Xshot, new pSkill(sGroup.R3_TOWER, 'Xshot', sBalance.SHOT, 24, 0, 1.05, 1, 1, [ID.weapon.skillR3Xshot]))
DXskill.set(IDskill.r3Xbeam, new pSkill(sGroup.R3_TOWER, 'Xbeam', sBalance.AREA, 24, 0, 0.91, 1, 1, [ID.weapon.skillR3Xbeam]))
DXskill.set(IDskill.r3Xboom, new pSkill(sGroup.R3_TOWER, 'Xboom', sBalance.SPLASH, 24, 0, 0.86, 1, 1, [ID.weapon.skillR3Xboom]))
DXskill.set(IDskill.r3Helljeon, new pSkill(sGroup.R3_TOWER, 'helljeon', sBalance.CHASE, 20, 5, 1, 2, 30, [ID.weapon.skillR3Helljeon]))

/**
 * 외부에서 사용하기 위한 라운드 스탯 값
 * @type {Map<number, StatRound>}
 */
export const dataExportStatRound = new Map()
dataExportStatRound.set(ID.round.UNUSED, new StatRound())
// test
dataExportStatRound.set(ID.round.test1Enemy, new StatRound(8, ID.round.PREVNULL, 'TEST1', 'enemy test', 0, 0, 9900, 0, 0, '테스트 라운드 (디버그 용도)'))
dataExportStatRound.set(ID.round.test2Background, new StatRound(8, ID.round.PREVNULL, 'TEST2', 'background test', 0, 0, 9900, 0, 0))
dataExportStatRound.set(ID.round.test3Round3DownTower, new StatRound(8, ID.round.PREVNULL, 'R3-TEST', 'downtower test', 20, 0, 9900, 0, 0, 'round3을 제작하는 과정에서 만들어진 테스트 라운드'))
dataExportStatRound.set(ID.round.test4Sound, new StatRound(-1, ID.round.PREVNULL, 'TEST4', '사운드 테스트', 0, 0, 9999, 0, 0, '사운드 테스트'))
// round 1
dataExportStatRound.set(ID.round.round1_1, new StatRound(2, ID.round.PREVNULL, '1-1', '우주 여행 - 공허', 1, 40000, 150, 30000, 10, ''))
dataExportStatRound.set(ID.round.round1_2, new StatRound(3, ID.round.PREVNULL, '1-2', '운석 지대', 2, 40000, 180, 36000, 11, ''))
dataExportStatRound.set(ID.round.round1_3, new StatRound(4, ID.round.PREVNULL, '1-3', '운석 지대 - 무인기 충돌', 3, 40000, 210, 39000, 11, ''))
dataExportStatRound.set(ID.round.round1_4, new StatRound(5, ID.round.PREVNULL, '1-4', '의식의 공간', 5, 40000, 156, 38000, 10, ''))
dataExportStatRound.set(ID.round.round1_5, new StatRound(6, ID.round.PREVNULL, '1-5', '운석 지대 - 레드 존', 6, 40000, 210, 41000, 11, ''))
dataExportStatRound.set(ID.round.round1_6, new StatRound(7, ID.round.PREVNULL, '1-6', '우주 여행 - 파란 행성 가는 길', 7, 40000, 154, 35000, 11, ''))
// round 2
dataExportStatRound.set(ID.round.round2_1, new StatRound(11, ID.round.PREVNULL, '2-1', '파란 행성 - 하늘 300km ~ 250km', 10, 50000, 150, 40000, 12, ''))
dataExportStatRound.set(ID.round.round2_2, new StatRound(12, ID.round.round2_1, '2-2', '동그라미 마을', 11, 50000, 170, 44000, 12, ''))
dataExportStatRound.set(ID.round.round2_3, new StatRound(13, ID.round.round2_1, '2-3', '동그라미 스페이스', 12, 50000, 192, 48000, 12, ''))
dataExportStatRound.set(ID.round.round2_4, new StatRound(14, ID.round.round2_1, '2-4', '동그라미 마을 홀', 14, 60000, 207, 52000, 14, ''))
dataExportStatRound.set(ID.round.round2_5, new StatRound(15, ID.round.round2_4, '2-5', '지하실 전투', 15, 60000, 200, 32000, 14, ''))
dataExportStatRound.set(ID.round.round2_6, new StatRound(16, ID.round.round2_4, '2-6', '폐허가 된 동그라미 마을', 16, 60000, 150, 48000, 13, ''))
// round 3
dataExportStatRound.set(ID.round.round3_1, new StatRound(21, ID.round.PREVNULL, '3-1', '다운 타워 1', 20, 70000, 200, 71400, 16, ''))
dataExportStatRound.set(ID.round.round3_2, new StatRound(22, ID.round.PREVNULL, '3-2', '다운 타워 2', 21, 70000, 220, 72800, 15, ''))
dataExportStatRound.set(ID.round.round3_3, new StatRound(23, ID.round.PREVNULL, '3-3', '다운 타워 3', 21, 70000, 200, 74200, 16, ''))
dataExportStatRound.set(ID.round.round3_4, new StatRound(24, ID.round.PREVNULL, '3-4', '다운 타워 보이드', 22, 70000, 240, 78000, 16, ''))
dataExportStatRound.set(ID.round.round3_5, new StatRound(25, ID.round.PREVNULL, '3-5', '안티 제물', 23, 70000, 610, 130000, 18, ''))
dataExportStatRound.set(ID.round.round3_6, new StatRound(26, ID.round.round3_5, '3-6', '다운 타워 코어 1', 25, 77000, 220, 83800, 17, ''))
dataExportStatRound.set(ID.round.round3_7, new StatRound(27, ID.round.round3_5, '3-7', '다운 타워 코어 2', 25, 77000, 220, 84600, 17, ''))
dataExportStatRound.set(ID.round.round3_8, new StatRound(28, ID.round.round3_5, '3-8', '다운 타워 통로 1', 26, 77000, 220, 86600, 17, ''))
dataExportStatRound.set(ID.round.round3_9, new StatRound(29, ID.round.round3_5, '3-9', '다운 타워 통로 2', 26, 77000, 220, 87800, 17, ''))
dataExportStatRound.set(ID.round.round3_10, new StatRound(19, ID.round.round3_5, '3-10', '동그라미 마을로 돌아가는 길', 28, 77000, 447, 160000, 18, ''))


/**
 * 외부에서 사용하기 위한 라운드 스탯 값
 * @type {Map<number, StatRoundBalance>}
 */
export const dataExportStatRoundBalance = new Map()
dataExportStatRoundBalance.set(ID.round.round1_1, new StatRoundBalance(150 + 30, 65000))
dataExportStatRoundBalance.set(ID.round.round1_2, new StatRoundBalance(180 +  0, 80000))
dataExportStatRoundBalance.set(ID.round.round1_3, new StatRoundBalance(210 +  0, 98000))
dataExportStatRoundBalance.set(ID.round.round1_4, new StatRoundBalance(156 +  0, 72000))
dataExportStatRoundBalance.set(ID.round.round1_5, new StatRoundBalance(210 +  0, 98000))
dataExportStatRoundBalance.set(ID.round.round1_6, new StatRoundBalance(152 +  0, 78000))

dataExportStatRoundBalance.set(ID.round.round2_1, new StatRoundBalance(150 + 20, 90000))
dataExportStatRoundBalance.set(ID.round.round2_2, new StatRoundBalance(170 +  0, 90000))
dataExportStatRoundBalance.set(ID.round.round2_3, new StatRoundBalance(192 -  8, 96000))
dataExportStatRoundBalance.set(ID.round.round2_4, new StatRoundBalance(207 +  0, 110000))
dataExportStatRoundBalance.set(ID.round.round2_5, new StatRoundBalance(200 +  0, 130000))
dataExportStatRoundBalance.set(ID.round.round2_6, new StatRoundBalance(150 + 10, 94000))

dataExportStatRoundBalance.set(ID.round.round3_1, new StatRoundBalance(200 + 40, 210000))
dataExportStatRoundBalance.set(ID.round.round3_2, new StatRoundBalance(220 + 20, 210000))
dataExportStatRoundBalance.set(ID.round.round3_3, new StatRoundBalance(200 + 40, 210000))
dataExportStatRoundBalance.set(ID.round.round3_4, new StatRoundBalance(240 +  0, 230000))
dataExportStatRoundBalance.set(ID.round.round3_5, new StatRoundBalance(610 +  0, 610000))
dataExportStatRoundBalance.set(ID.round.round3_6, new StatRoundBalance(220 +  0, 220000))
dataExportStatRoundBalance.set(ID.round.round3_7, new StatRoundBalance(220 +  0, 220000))
dataExportStatRoundBalance.set(ID.round.round3_8, new StatRoundBalance(220 +  0, 220000))
dataExportStatRoundBalance.set(ID.round.round3_9, new StatRoundBalance(220 + 30, 240000))
dataExportStatRoundBalance.set(ID.round.round3_10, new StatRoundBalance(447 +  0, 460000))

/**
 * 외부에서 사용하기 위한 아이템 스탯 값
 * @type {Map<number, StatItem>}
 */
export const dataExportStatItem = new Map()
const EQUIP001 = new StatItem(0, StatItem.TYPE_EQUIPMENT, '스탠다드 플러스 C1 블루', 1000, '표준적인 장비. C1모델이며, 파란색이다. \n 공격력을 증가시킨다.')
EQUIP001.setEquipmentInfo(20, 3000, 130)
dataExportStatItem.set(ID.item.standardPlusC1Blue, EQUIP001)

const EQUIP002 = new StatItem(1, StatItem.TYPE_EQUIPMENT, '동그라미 무기(mugi)', 400,  '동그라미 마을에서 만든 무기에요.\n이 장비는 동그라미 티켓을 이용해 강화할 수 있습니다.\n동그라미 티켓을 모아보세요! 히힛~\n성능이 약하지만 어쩔 수 없어요 흑흑 ㅠㅠ')
EQUIP002.setEquipmentInfo(20, 2700, 99999999)
dataExportStatItem.set(ID.item.donggramiMugi, EQUIP002)

const EQUIP003 = new StatItem(2, StatItem.TYPE_EQUIPMENT, '헬기(hellgi) 장비(jangbi)', 1300, '다운타워에서 돌아다니는 헬기들의 부품을 모아 만든 특수장비. 공격속도가 10% 증가한다.(미구현됨)')
EQUIP003.setEquipmentInfo(21, 3600, 4100)

dataExportStatItem.set(ID.item.donggramiTicket, new StatItem(3, StatItem.TYPE_ITEM, '동그라미 마을 티켓', 100, '동그라미 마을에서 여러가지 용도로 사용하는 티켓'))
dataExportStatItem.set(ID.item.donggramiUSB, new StatItem(4, StatItem.TYPE_ITEM, '동그라미 운영체제 USB', 1024, '동그라미 마을에서 만들어진 재미난 운영체제 파일이 담겨있는 부팅 USB'))
dataExportStatItem.set(ID.item.hellgiComponent, new StatItem(5, StatItem.TYPE_ITEM, '헬기(hellgi) 부품(component)', 60, '다운타워에서 등장하는 헬기들이 부서지고 남은 부품들'))
dataExportStatItem.set(ID.item.upgradeStone, new StatItem(6, StatItem.TYPE_ITEM, '강화석', 100, '강화할 때 필요한 아이템'))
dataExportStatItem.set(ID.item.boseokTest, new StatItem(7, StatItem.TYPE_ITEM, '보석 테스트', 0, '보석 테스트 용도 아이템'))