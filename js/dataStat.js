//@ts-check

import { ID } from "./dataId.js"

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
   * @param {number} maxTarget 
   * isMultiTarget이 true일경우, 한 번 공격당 한번에 적을 타격할 수 있는 개수 (스플래시 최대 마리 수 제한)
   * 
   * isMultiTarget이 false일경우, 한번 공격 로직을 수행했을 때, 타격할 수 있는 적의 개수 (한번 공격당 반복횟수 1을 소모하고, 스플래시 공격이 아님, 
   * 모든 반복 횟수 소모시에는 남은 타겟 수와 상관없이 해당 무기는 사라짐)
   */
  constructor (mainType, subType, repeatCount = 1, repeatDelay = 0, isChase = false, isMultiTarget = false, maxTarget = 20) {
    this.mainType = mainType
    this.subType = subType
    this.isChaseType = isChase
    this.repeatCount = repeatCount
    this.repeatDelay = repeatDelay
    this.isMultiTarget = isMultiTarget
    this.maxTarget = maxTarget
  }
}

/**
 * 플레이어가 사용하는 무기에 대한 스탯 정보
 */
export class StatPlayerWeapon {
  /**
   * 플레이어가 사용하는 무기에 대한 스탯 정보
   * @param {string} name 무기의 이름
   * @param {number} delay 무기가 각 발사되기 까지의 지연시간
   * @param {number} attackMultiple 공격 배율 (기본값 1, 1보다 높으면 )
   * @param {number} shotCount 무기가 발사될 때 동시에 발사되는 개수
   * @param {number[]} weaponIdList 플레이어무기에서 사용하는 실제 무기 idList (여러개가 있으면 여러개의 무기를 사용)
   */
  constructor (name, delay, attackMultiple, shotCount, weaponIdList = [ID.weapon.unused]) {
    this.name = name
    this.delay = delay
    this.attackMultiple = attackMultiple
    this.shotCount = shotCount
    this.weaponIdList = weaponIdList
  
    /** 무기 공격력 (기준값 10000 기준으로 무기의 예상 공격력 계산, 단 정확하지 않음. 왜냐하면 아직 무기의 repeatCount를 모름) */
    this.weaponAttack = this.getCurrentAttack()
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
}

/**
 * 플레이어가 사용하는 스킬에 대한 스탯 정보
 */
export class StatPlayerSkill {
  /**
   * 플레이어가 사용하는 스킬에 대한 스탯 정보
   * @param {string} name 스킬의 이름
   * @param {number} coolTime 스킬의 쿨타임 (초)
   * @param {number} delay 스킬의 각 무기가 한번 반복할 때 발사 당 지연 시간
   * @param {number} attackMultiple 무기의 공격 배율(기본값 1) 이 숫자가 높으면 공격력 증가
   * @param {number} shotCount 한번 발사 시에 나오는 무기의 개수
   * @param {number} repeatCount 스킬의 각 무기가 반복 발사되는 횟수
   * @param {number} attackCount 무기가 가지고 있는 repeatCount
   * @param {number[]} weaponIdList 플레이어스킬에서 실제 사용하는 무기의 idList
   */
  constructor (name = 'nothing', coolTime = 20, delay = 0, attackMultiple = 1, shotCount = 1, repeatCount = 1, attackCount = 1, weaponIdList = [ID.weapon.unused]) {
    this.name = name
    this.coolTime = coolTime
    this.delay = delay
    this.multiple = attackMultiple
    this.shot = shotCount
    this.repeat = repeatCount
    this.hit = attackCount
    this.weaponIdList = weaponIdList

    // 0으로 나누기 금지
    /** 무기 공격력 (기준값 10000 기준으로 무기의 예상 공격력 계산) */
    this.weaponAttack = this.getCurrentAttack()
  }

  /** 자신의 현재 공격력과 관련된 무기 공격력을 얻습니다. */
  getCurrentAttack (attack = 10000) {
    let totalDamage = (attack * this.coolTime * this.multiple)
    let divide = this.shot * this.repeat * this.hit

    // 0으로 나누기될경우, 강제로 0을 리턴
    return divide !== 0 ? Math.floor(totalDamage / divide) : 0
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
   * @param {string} roundText 라운드 값을 표시할 텍스트, 예시: 1-1, 한글 사용 금지, 일부 기호와 알파벳만 사용가능, 최대 5글자까지 지원(검사하진 않음...)
   * @param {string} roundName 라운드의 이름
   * @param {number} requireLevel 해당 라운드를 플레이하기 위한 최소 레벨 (해당 레벨 이상만 플레이 가능)
   * @param {number} requireAttack 기준 파워(전투력) 해당 라운드에서 얼마만큼의 전투력을 기준으로 적을 배치했는지에 대한 값
   * @param {number} finishTime 종료 시간(단위: 초), 해당 라운드를 클리어 하기 위해 사용해야 하는 시간 (단, 이것은 기준 시간이며, 일부 라운드는 특정 상황이 되면 강제로 클리어 할 수 있음.)
   * @param {number} clearBonus 라운드를 클리어했을 때 얻는 점수
   * @param {number} gold 라운드에 대한 골드의 값 (이 값은 10초당 획득하는 단위로 구성되어있습니다.)
   * @param {string} roundInfo 
   */
  constructor (iconNumber = -1, roundText = 'NULL', roundName = 'NULL', requireLevel = 0, requireAttack = 0, finishTime = 1, clearBonus = 0, gold = 0, roundInfo = '') {
    /** 아이콘의 번호 (-1인경우 없음) */ this.iconNumber = iconNumber
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
    /** 해당 라운드를 진행하기 위해 필요한 최소 공격력값 (이 값 미만은 플레이 불가능) */ this.minAttack = Math.floor(requireAttack * 0.9)
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

export class StatEquipMent {
  /**
   * 장비에 대한 기본적인 정보
   * 
   * (참고: 만약 특수 스탯을 구현하고 싶다면, 내장 함수에서 다른 함수를 추가로 호출해 스탯을 직접 지정해야함)
   * 
   * @param {number} itemIconNumber 아이템에 해당하는 아이콘 번호 -1인경우 아이콘 없음
   * @param {string} name 이름
   * @param {number} baseCost 장비의 기본 가격
   * @param {number} requireLevel 장비를 장착하기 위해 필요한 레벨
   * @param {number} attack 장비의 공격력
   * @param {number} upgradeCost 장비의 업그레이드 기본 비용
   * @param {string} info 장비의 정보
   */
  constructor (itemIconNumber = -1, name, baseCost, requireLevel, attack, upgradeCost, info) {
    this.name = name
    this.itemIconNumber = itemIconNumber
    this.baseCost = baseCost
    this.requireLevel = requireLevel
    this.attack = attack
    this.upgradeCost = upgradeCost
    this.info = info

    /** 공격속도 증가 퍼센트 (단, 무기에만 적용됨) */ this.weaponSpeedPlusPercent = 0
    /** 스킬 쿨다운 퍼센트 (단, 스킬에만 적용됨) */ this.skillCoolDownPercent = 0
  }

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

export class StatItem {
  /**
   * 아이템의 정보를 생성 (아이템의 구현은 다른곳에서 처리해야함)
   * @param {number} iconNumber 아이콘 번호 (-1인경우, 없음)
   * @param {string} name 이름
   * @param {number} price 가격 (참고: 판매가격은 비용의 1/10임)
   * @param {string} info 정보
   */
  constructor (iconNumber = -1, name, price, info) {
    this.iconNumber = iconNumber
    this.name = name
    this.price = price
    this.info = info
  }
}

/**
 * 외부에서 사용하기 위한 weapon 스탯 객체
 * @type {Map<number, StatWeapon>}
 */
export const dataExportStatWeapon = new Map()
dataExportStatWeapon.set(ID.weapon.multyshot, new StatWeapon('multyshot', 'multyshot'))
dataExportStatWeapon.set(ID.weapon.missile, new StatWeapon('missile', 'missileA', 2, 6, true, true, 20))
dataExportStatWeapon.set(ID.weapon.missileRocket, new StatWeapon('missile', 'missileB', 2, 6, false, true, 20))
dataExportStatWeapon.set(ID.weapon.arrow, new StatWeapon('arrow', 'arrow'))
dataExportStatWeapon.set(ID.weapon.laser, new StatWeapon('laser', 'laser', 5, 0, false, false, 16))
dataExportStatWeapon.set(ID.weapon.laserBlue, new StatWeapon('laser', 'laserBlue', 5, 0, true, false, 16))
dataExportStatWeapon.set(ID.weapon.sapia, new StatWeapon('sapia', 'sapia', 2, 5, true))
dataExportStatWeapon.set(ID.weapon.sapiaShot, new StatWeapon('sapia', 'sapiaShot', 1, 10, true))
dataExportStatWeapon.set(ID.weapon.parapo, new StatWeapon('parapo', 'parapo', 1, 0, true))
dataExportStatWeapon.set(ID.weapon.parapoShockWave, new StatWeapon('parapo', 'shockWave', 1, 0, false, true, 16))
dataExportStatWeapon.set(ID.weapon.blaster, new StatWeapon('blaster', 'blaster', 1, 0, false))
dataExportStatWeapon.set(ID.weapon.blaster, new StatWeapon('blaster', 'blastermini', 1, 0, false))
dataExportStatWeapon.set(ID.weapon.sidewave, new StatWeapon('sidewave', 'sidewave'))
dataExportStatWeapon.set(ID.weapon.ring, new StatWeapon('ring', 'ring'))
dataExportStatWeapon.set(ID.weapon.seondanil, new StatWeapon('seondanil', 'seondanil'))
dataExportStatWeapon.set(ID.weapon.boomerang, new StatWeapon('boomerang', 'boomerang', 4, 0, false, false, 10))
dataExportStatWeapon.set(ID.weapon.subMultyshot, new StatWeapon('subweapon', 'subweapon'))
//
dataExportStatWeapon.set(ID.weapon.skillMultyshot, new StatWeapon('skill', 'multyshot', 1, 0, true))
dataExportStatWeapon.set(ID.weapon.skillMissile, new StatWeapon('skill', 'missile', 10, 4, true, true, 40))
dataExportStatWeapon.set(ID.weapon.skillArrow, new StatWeapon('skill', 'arrow', 4, 0, false, false, 4))
dataExportStatWeapon.set(ID.weapon.skillLaser, new StatWeapon('skill', 'laser', 60, 4, false, true, 20))
dataExportStatWeapon.set(ID.weapon.skillSapia, new StatWeapon('skill', 'sapia', 40, 6, true, true, 4))
dataExportStatWeapon.set(ID.weapon.skillParapo, new StatWeapon('skill', 'parapo', 1, 0, true, true, 16))
dataExportStatWeapon.set(ID.weapon.skillBlaster, new StatWeapon('skill', 'blaster'))
dataExportStatWeapon.set(ID.weapon.skillSidewave, new StatWeapon('skill', 'sidewave'))
dataExportStatWeapon.set(ID.weapon.skillSword, new StatWeapon('skill', 'sword', 80, 3, true))
dataExportStatWeapon.set(ID.weapon.skillHyperBall, new StatWeapon('skill', 'hyperball', 6, 0, false, false, 6))
dataExportStatWeapon.set(ID.weapon.skillCriticalChaser, new StatWeapon('skill', 'criticalchaser', 4, 6, false, true, 8))
dataExportStatWeapon.set(ID.weapon.skillPileBunker, new StatWeapon('skill', 'pilebunker', 16, 6, false, true, 4))
dataExportStatWeapon.set(ID.weapon.skillSantansu, new StatWeapon('skill', 'santansu', 6, 9, false, true, 8))
dataExportStatWeapon.set(ID.weapon.skillWhiteflash, new StatWeapon('skill', 'whiteflash', 40, 4, true, true, 12))
dataExportStatWeapon.set(ID.weapon.skillWhiteflashSmoke, new StatWeapon('skillsub', 'whiteflashsmoke', 1, 4, true, true, 12))
dataExportStatWeapon.set(ID.weapon.skillRing, new StatWeapon('skill', 'ring', 4, 0, false, false, 4))
dataExportStatWeapon.set(ID.weapon.skillRapid, new StatWeapon('skill', 'rapid'))
dataExportStatWeapon.set(ID.weapon.skillSeondanil, new StatWeapon('skill', 'seondanil', 50, 3))
dataExportStatWeapon.set(ID.weapon.skillSeondanilMini, new StatWeapon('skillsub', 'seondanilmini', 1, 3))
dataExportStatWeapon.set(ID.weapon.skillHanjumoek, new StatWeapon('skill', 'hanjumoek', 30, 5, false, true, 10))
dataExportStatWeapon.set(ID.weapon.skillBoomerang, new StatWeapon('skill', 'boomerang', 180, 0, false, false, 10))
dataExportStatWeapon.set(ID.weapon.skillMoon, new StatWeapon('skill', 'moon', 180, 1, false, true, 9999))

/**
 * 외부에서 사용하기 위한 플레이어 웨폰 스탯
 * @type {Map<number, StatPlayerWeapon>}
 */
export const dataExportStatPlayerWeapon = new Map()
dataExportStatPlayerWeapon.set(ID.playerWeapon.unused, new StatPlayerWeapon('unuesd', 0, 0, 0, [ID.weapon.unused]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.multyshot, new StatPlayerWeapon('multyshot', 10, 1, 6, [ID.weapon.multyshot]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.missile, new StatPlayerWeapon('missile', 30, 0.8, 4, [ID.weapon.missile, ID.weapon.missileRocket]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.arrow, new StatPlayerWeapon('arrow', 10, 1.04, 2, [ID.weapon.arrow]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.laser, new StatPlayerWeapon('laser', 12, 1, 4, [ID.weapon.laser, ID.weapon.laserBlue]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.sapia, new StatPlayerWeapon('sapia', 10, 1, 1, [ID.weapon.sapia]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.parapo, new StatPlayerWeapon('parapo', 30, 0.75, 3, [ID.weapon.parapo]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.blaster, new StatPlayerWeapon('blaster', 6, 1.15, 2, [ID.weapon.blaster, ID.weapon.blasterMini]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.sidewave, new StatPlayerWeapon('sidewave', 15, 1.1, 8, [ID.weapon.sidewave]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.ring, new StatPlayerWeapon('ring', 30, 1.12, 8, [ID.weapon.ring]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.rapid, new StatPlayerWeapon('rapid', 4, 1.2, 3, [ID.weapon.rapid]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.seondanil, new StatPlayerWeapon('seondanil', 60, 1.1, 5, [ID.weapon.seondanil]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.boomerang, new StatPlayerWeapon('boomerang', 20, 1.06, 3, [ID.weapon.boomerang]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.subMultyshot, new StatPlayerWeapon('subMultyshot', 12, 0.2, 2, [ID.weapon.subMultyshot]))

/**
 * 외부에서 사용하기 위한 플레이어 스킬 스탯
 * @type {Map<number, StatPlayerSkill>}
 */
export const dataExportStatPlayerSkill = new Map()
dataExportStatPlayerSkill.set(ID.playerSkill.unused, new StatPlayerSkill('unused', 0, 0, 0, 0, 0, 0, [ID.weapon.unused]))
dataExportStatPlayerSkill.set(ID.playerSkill.multyshot, new StatPlayerSkill('multyshot', 20, 6, 1, 5, 30, 1, [ID.weapon.skillMultyshot]))
dataExportStatPlayerSkill.set(ID.playerSkill.missile, new StatPlayerSkill('missile', 20, 20, 0.7, 2, 4, dataExportStatWeapon.get(ID.weapon.skillMissile)?.repeatCount, [ID.weapon.skillMissile]))
dataExportStatPlayerSkill.set(ID.playerSkill.arrow, new StatPlayerSkill('arrow', 20, 9, 1, 2, 20, dataExportStatWeapon.get(ID.weapon.skillArrow)?.repeatCount, [ID.weapon.skillArrow]))
dataExportStatPlayerSkill.set(ID.playerSkill.laser, new StatPlayerSkill('laser', 20, 0, 0.64, 1, 1, dataExportStatWeapon.get(ID.weapon.skillLaser)?.repeatCount, [ID.weapon.skillLaser]))
dataExportStatPlayerSkill.set(ID.playerSkill.sapia, new StatPlayerSkill('sapia', 24, 0, 1, 6, 1, dataExportStatWeapon.get(ID.weapon.skillSapia)?.repeatCount, [ID.weapon.skillSapia]))
dataExportStatPlayerSkill.set(ID.playerSkill.parapo, new StatPlayerSkill('parapo', 24, 10, 0.55, 1, 24, 1, [ID.weapon.skillParapo]))
dataExportStatPlayerSkill.set(ID.playerSkill.blaster, new StatPlayerSkill('blaster', 24, 4, 1.24, 2, 40, 1, [ID.weapon.skillBlaster]))
dataExportStatPlayerSkill.set(ID.playerSkill.sidewave, new StatPlayerSkill('sidewave', 20, 7, 1.08, 3, 24, 1, [ID.weapon.skillSidewave]))
dataExportStatPlayerSkill.set(ID.playerSkill.sword, new StatPlayerSkill('sword', 24, 0, 1, 1, 1, dataExportStatWeapon.get(ID.weapon.skillSword)?.repeatCount, [ID.weapon.skillSword]))
dataExportStatPlayerSkill.set(ID.playerSkill.hyperBall, new StatPlayerSkill('hyperball', 20, 15, 1, 2, 12, dataExportStatWeapon.get(ID.weapon.skillHyperBall)?.repeatCount, [ID.weapon.skillHyperBall]))
dataExportStatPlayerSkill.set(ID.playerSkill.critcalChaser, new StatPlayerSkill('criticalchaser', 28, 10, 0.96, 2, 12, dataExportStatWeapon.get(ID.weapon.skillCriticalChaser)?.repeatCount, [ID.weapon.skillCriticalChaser]))
dataExportStatPlayerSkill.set(ID.playerSkill.pileBunker, new StatPlayerSkill('pilebunker', 28, 60, 1.5, 1, 1, dataExportStatWeapon.get(ID.weapon.skillPileBunker)?.repeatCount, [ID.weapon.skillPileBunker]))
dataExportStatPlayerSkill.set(ID.playerSkill.santansu, new StatPlayerSkill('santansu', 24, 30, 0.95, 5, 5, dataExportStatWeapon.get(ID.weapon.skillSantansu)?.repeatCount, [ID.weapon.skillSantansu]))
dataExportStatPlayerSkill.set(ID.playerSkill.whiteflash, new StatPlayerSkill('whiteflash', 24, 0, 0.9, 1, 1, dataExportStatWeapon.get(ID.weapon.skillWhiteflash)?.repeatCount, [ID.weapon.skillWhiteflash]))
dataExportStatPlayerSkill.set(ID.playerSkill.ring, new StatPlayerSkill('ring', 20, 6, 1.04, 8, 25, 1, [ID.weapon.skillRing]))
dataExportStatPlayerSkill.set(ID.playerSkill.rapid, new StatPlayerSkill('rapid', 20, 4, 1.15, 4, 40, 1, [ID.weapon.skillRapid]))
dataExportStatPlayerSkill.set(ID.playerSkill.seondanil, new StatPlayerSkill('seondanil', 28, 0, 1.2, 1, 1, dataExportStatWeapon.get(ID.weapon.skillSeondanil)?.repeatCount, [ID.weapon.skillSeondanil]))
dataExportStatPlayerSkill.set(ID.playerSkill.hanjumoek, new StatPlayerSkill('hanjumeok', 28, 0, 1.2, 1, 1, dataExportStatWeapon.get(ID.weapon.skillHanjumoek)?.repeatCount, [ID.weapon.skillHanjumoek]))
dataExportStatPlayerSkill.set(ID.playerSkill.boomerang, new StatPlayerSkill('boomerang', 20, 0, 1.0, 3, 1, dataExportStatWeapon.get(ID.weapon.skillBoomerang)?.repeatCount, [ID.weapon.skillBoomerang]))
dataExportStatPlayerSkill.set(ID.playerSkill.moon, new StatPlayerSkill('moon', 28, 1, 0.5, 1, 1, dataExportStatWeapon.get(ID.weapon.skillMoon)?.repeatCount, [ID.weapon.skillMoon]))


/**
 * 외부에서 사용하기 위한 라운드 스탯 값
 * @type {Map<number, StatRound>}
 */
export const dataExportStatRound = new Map()
dataExportStatRound.set(ID.round.UNUSED, new StatRound())
// round 1
dataExportStatRound.set(ID.round.round1_1, new StatRound(2, '1-1', '우주 여행 - 공허', 1, 40000, 150, 30000, 10, ''))
dataExportStatRound.set(ID.round.round1_2, new StatRound(3, '1-2', '운석 지대', 2, 40000, 180, 36000, 11, ''))
dataExportStatRound.set(ID.round.round1_3, new StatRound(4, '1-3', '운석 지대 - 무인기 충돌', 4, 40000, 210, 39000, 11, ''))
dataExportStatRound.set(ID.round.round1_4, new StatRound(5, '1-4', '의식의 공간', 5, 40000, 156, 38000, 10, ''))
dataExportStatRound.set(ID.round.round1_5, new StatRound(6, '1-5', '운석 지대 - 레드 존', 6, 40000, 210, 41000, 11, ''))
dataExportStatRound.set(ID.round.round1_6, new StatRound(7, '1-6', '우주 여행 - 파란 행성 가는 길', 8, 40000, 154, 35000, 11, ''))
dataExportStatRound.set(ID.round.round1_test, new StatRound(8, 'TEST1', 'TEST1', 0, 0, 9900, 0, 0, '테스트 라운드 (디버그 용도)'))
// round 2
dataExportStatRound.set(ID.round.round2_1, new StatRound(11, '2-1', '파란 행성 - 하늘 300km ~ 250km', 10, 50000, 150, 40000, 12, ''))
dataExportStatRound.set(ID.round.round2_2, new StatRound(12, '2-2', '동그라미 마을', 12, 50000, 170, 44000, 12, ''))
dataExportStatRound.set(ID.round.round2_3, new StatRound(13, '2-3', '동그라미 스페이스', 13, 50000, 192, 48000, 12, ''))
dataExportStatRound.set(ID.round.round2_4, new StatRound(14, '2-4', '동그라미 마을 홀', 14, 60000, 207, 52000, 14, ''))
dataExportStatRound.set(ID.round.round2_5, new StatRound(15, '2-5', '지하실 전투', 15, 60000, 200, 32000, 14, ''))
dataExportStatRound.set(ID.round.round2_6, new StatRound(16, '2-6', '폐허가 된 동그라미 마을', 18, 60000, 150, 48000, 13, ''))
dataExportStatRound.set(ID.round.round2_test, new StatRound(8, 'TEST2', 'TEST2', 0, 0, 9900, 0, 0))
// round 3
dataExportStatRound.set(ID.round.round3_1, new StatRound(21, '3-1', '다운 타워 1', 20, 70000, 200, 71400, 16, ''))
dataExportStatRound.set(ID.round.round3_2, new StatRound(22, '3-2', '다운 타워 2', 21, 70000, 220, 72800, 15, ''))
dataExportStatRound.set(ID.round.round3_3, new StatRound(23, '3-3', '다운 타워 3', 21, 70000, 200, 74200, 16, ''))
dataExportStatRound.set(ID.round.round3_4, new StatRound(24, '3-4', '다운 타워 보이드', 22, 70000, 240, 78000, 16, ''))
dataExportStatRound.set(ID.round.round3_5, new StatRound(25, '3-5', '안티 제물', 24, 70000, 610, 130000, 18, ''))
dataExportStatRound.set(ID.round.round3_6, new StatRound(26, '3-6', '다운 타워 코어 1', 25, 77000, 220, 83800, 17, ''))
dataExportStatRound.set(ID.round.round3_7, new StatRound(27, '3-7', '다운 타워 코어 2', 25, 77000, 220, 84600, 17, ''))
dataExportStatRound.set(ID.round.round3_8, new StatRound(28, '3-8', '다운 타워 통로 1', 26, 77000, 220, 86600, 17, ''))
dataExportStatRound.set(ID.round.round3_9, new StatRound(29, '3-9', '다운 타워 통로 2', 26, 77000, 220, 87800, 17, ''))
dataExportStatRound.set(ID.round.round3_10, new StatRound(19, '3-10', '동그라미 마을로 돌아가는 길', 28, 77000, 447, 160000, 18, ''))
dataExportStatRound.set(ID.round.round3_test, new StatRound(8, 'TEST3', 'round 3 test mode', 20, 0, 9900, 0, 0, 'round3을 제작하는 과정에서 만들어진 테스트 라운드'))


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
 * 외부에서 사용하기 위한 장비 스탯 값
 * @type {Map<number, StatEquipMent>}
 */
export const dataExportStatEquipment = new Map()
dataExportStatEquipment.set(ID.equipment.standardPlusC1Blue, new StatEquipMent(0, '스탠다드 플러스 C1 블루', 1000, 20, 3000, 130, '표준적인 장비. C1모델이며, 파란색이다. \n 공격력을 증가시킨다.'))
dataExportStatEquipment.set(ID.equipment.donggramiMugi, new StatEquipMent(1, '동그라미 무기(mugi)', 400, 0, 2700, 99999999, '동그라미 마을에서 만든 무기에요.\n이 장비는 동그라미 티켓을 이용해 강화할 수 있습니다.\n동그라미 티켓을 모아보세요! 히힛~\n성능이 약하지만 어쩔 수 없어요 흑흑 ㅠㅠ'))
dataExportStatEquipment.set(ID.equipment.hellgiJangbi, new StatEquipMent(2, '헬기(hellgi) 장비(jangbi)' , 1300, 21, 3600, 4100, '다운타워에서 돌아다니는 헬기들의 부품을 모아 만든 특수장비. 공격속도가 10% 증가한다.'))

/**
 * 외부에서 사용하기 위한 아이템 스탯 값
 * @type {Map<number, StatItem>}
 */
export const dataExportStatItem = new Map()
dataExportStatItem.set(ID.item.donggramiTicket, new StatItem(3, '동그라미 마을 티켓', 100, '동그라미 마을에서 여러가지 용도로 사용하는 티켓'))
dataExportStatItem.set(ID.item.donggramiUSB, new StatItem(4, '동그라미 운영체제 USB', 1024, '동그라미 마을에서 만들어진 재미난 운영체제 파일이 담겨있는 부팅 USB'))
dataExportStatItem.set(ID.item.hellgiComponent, new StatItem(5, '헬기(hellgi) 부품(component)', 60, '다운타워에서 등장하는 헬기들이 부서지고 남은 부품들'))
dataExportStatItem.set(ID.item.upgradeStone, new StatItem(6, '강화석', 100, '강화할 때 필요한 아이템'))