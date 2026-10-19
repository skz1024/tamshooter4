//@ts-check

import { ID } from "./dataId.js"

/** 유저의 스탯을 StatView.html에서 볼 수 있도록 만든것... */
export class StatUser {
  /** 최대 레벨 */
  static MAX_LEVEL = 31

  /** 경험치 테이블 */
  static expTable = [
    0, 20000, 22000, 24000, 26000, 28000, 30000, 32000, 34000, 36000, // lv 0 ~ 9
    50000, 51000, 52000, 53000, 54000, 55000, 56000, 57000, 58000, 59000, // lv 10 ~ 19
    255500, 256000, 256500, 257000, 257500, 258000, 258500, 259000, 259500, 260000, // lv 20 ~ 29
    606600, 607200, 608400, 609000, 609600, 636600, 637200, 638400, 639000, 639600, // lv 30 ~ 39
    916000, 919000, 922000, 925000, 928000, 944000, 947000, 951000, 954000, 957000, // lv 40 ~ 49
    1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, // lv 50 ~ 59
  ]

  /** 공격력 보너스 테이블 */
  static attackLevelTable = [40000, // lv 0
    40000, 41000, 42000, 43000, 44000, 45000, 46000, 47000, 48000, 50000, // lv 1 ~ 10 (40000 ~ 50000)
    51000, 52000, 53000, 54000, 55000, 56000, 57000, 58000, 59000, 60000, // lv 11 ~ 20 (50000 ~ 60000)
    61000, 62000, 63000, 64000, 65000, 66000, 67000, 68000, 69000, 70000, // lv 21 ~ 30 (60000 ~ 70000)
    80400, 80800, 81200, 81600, 82000, 82400, 82800, 83200, 83600, 84000, // lv 31 ~ 40 (70000 ~ 78000)
    84400, 84800, 85200, 85600, 86000, 86400, 86800, 87200, 87600, 88000, // lv 41 ~ 50 (78000 ~ 86000)
    88400, 88800, 89200, 89600, 90000, 90200, 90400, 90600, 90800, 91000, // lv 51 ~ 55, 56 ~ 60 (?)
  ]
}

/** 무기의 스탯 정보 (알고리즘 구현은 weaponData에서 진행) */
export class StatWeapon {
  /**
   * 무기의 기본 스탯 정보 입력
   * @param {number} repeatCount 
   * @param {number} repeatDelay 
   * @param {boolean} [isChase=false] 
   */
  constructor (repeatCount, repeatDelay, isChase = false) {
    this.repeatCount = repeatCount
    this.repeatDelay = repeatDelay
    this.isChase = isChase
    this.isSplash = false
    this.maxTarget = 1
    this.subCount = 0
    this.subId = ID.weapon.unused
    return this
  }

  /** 스플래시 타입으로 설정합니다. @param {number} [maxTarget=20] 동시 공격 최대 수 */
  setSplash (maxTarget = 20) {
    this.isSplash = true
    this.maxTarget = maxTarget > 2 ? maxTarget : 2 // 참고: 스플래시는 최소는 2개체를 타격합니다.
    return this
  }

  /** 서브 무기 생성 규칙을 설정합니다.  
   * 메인 무기는 서브 무기를 생성할 수 있습니다. 서브 무기는 서브 무기가 재생성 할 수 없습니다.  
   * @param {number} id 서브무기의 ID, 참고: 서브무기는 뒤에 Sub 단어가 있어야 합니다.
   * @param {number} subCount 1회 공격 시 마다 서브무기가 생성되는 개수 */
  setSub (id, subCount = 1) {
    this.subId = id
    this.subCount = subCount
    return this
  }
}

/**
 * 플레이어가 사용하는 무기에 대한 스탯 정보
 */
export class StatPlayerWeapon {
  /**
   * 플레이어 무기 데이터를 생성합니다.  
   * 생성자로만 완성할 수 없으니, setConfig 함수를 통해 스탯을 추가로 설정해주세요.
   * @param {string} group 그룹 이름 (해당 무기의 그룹명이 무엇인가?)
   * @param {string} name 이름 (해당 무기의 이름)
   * @param {string} balance 밸런스 타입 (표준 밸런스 규칙을 참고하세요.)
   * @param {number} [multiple = 1] 배율 (표준 밸런스 규칙에 맞춰 지정하세요. 배율은 1이 기본값이고, 1.2가 되면 1.2배를 뜻함)
   * @param {number} [coolTime = 0] 쿨타임 (스킬에서만 사용, 20, 24, 28 3종류만 허용됨. 스킬이 아닌 경우 쿨타임은 무시)
   */
  constructor (group, name, balance, multiple = 1, coolTime = 0) {
    this.group = group
    this.name = name
    /** 밸런스 타입 (표준 밸런스 값에서 설정) @type {string} */ this.balance = balance
    /** 배율, 기본값은 1(100%) 이며, 배율이 높으면 해당 개체의 공격력도 증가합니다. @type {number} */ this.multiple = multiple
    /** 스킬의 쿨타임 (단위: 초), 무기는 쿨타임을 무시합니다. @type {number} */ this.coolTime = coolTime
    this.shotCount = 1
    this.repeatCount = 1
    /** @type {number} */ this.weaponId = 0
    this.isLocked = false
    this.isSkill = false

    /** 무기: 다음 무기를 발사하는 간격 (단위: 프레임)  
     * 스킬: 반복 횟수에 대한 간격 (단위: 프레임) @type {number} */ 
    this.delay = 60

    /** @type {StatWeapon | undefined} */
    this.weapon = undefined

    return this
  }

  /**
   * 무기가 어떻게 발사되어야 하는지를 설정합니다.  
   * shotCount, repeatCount, 그리고 무기의 기타 횟수 등으로 전부 나누어서 공격력을 설정합니다.
   * @param {number} shotCount 1회 발사 시 동시에 발사하는 개수
   * @param {number} repeatCount 발사 시작 시 shotCount에 따른 발사를 반복하는 횟수
   * @param {number} delay 발사 반복 간격을 나타내는 프레임 수 (1초 = 60프레임)
   */
  setConfig (shotCount, repeatCount, delay) {
    // 모든 변수는 값의 범위가 조건에 해당되는 지를 검사합니다.
    this.shotCount = shotCount > 1 ? shotCount : 1
    this.repeatCount = repeatCount > 1 ? repeatCount : 1
    this.delay = delay > 0 ? delay : 60
    return this
  }

  /**
   * 발사에 사용할 무기 ID 목록을 설정합니다.
   * 여러 ID를 입력하면 입력 순서대로 배열에 저장합니다.
   * 배열을 인자로 전달해도 처리할 수 있습니다.
   *
   * 무기 객체는 shotCount에 따라 ID 목록을 순서대로 사용합니다.
   * 목록을 모두 사용하면 처음부터 다시 순회합니다.
   *
   * 예시: ID 목록이 [0, 1, 2]이고 shotCount가 6이면
   * 사용 순서는 0, 1, 2, 0, 1, 2입니다.
   *
   * @param {number} id 사용할 무기 ID 목록
   */
  setIdList (id) {
    this.weaponId = id
    this.weapon = dataExportStatWeapon.get(id)
    return this
  }

  /** 자신의 현재 공격력을 기준으로 한 무기 공격력을 얻습니다.  
   * userSystem에서는, attack을 그대로 대입하지 않고, 대신 무기와 스킬의 각 비중으로 나누어서 공격력을 대입해야 합니다!
   * 
   * @param {number} [attack=10000]
   * @returns {number}
   */
  getCurrentAttack (attack = 10000) {
    if (!this.weapon) return 0
    const totalDamage = this.isSkill
      ? (attack * this.coolTime * this.multiple)
      : (attack * (this.delay / 60) * this.multiple)
    const shot = this.shotCount > 0 ? this.shotCount : 1
    const repeat = this.repeatCount > 0 ? this.repeatCount : 1
    const weaponRepeat = this.weapon.repeatCount > 0 ? this.weapon.repeatCount : 1
    const weaponSubCount = this.weapon.subCount > 0 ? this.weapon.subCount : 1
    const divide = shot * repeat * weaponRepeat * weaponSubCount

    return Math.floor(totalDamage / divide)
  }

  /** 아이콘 번호를 가져옵니다.
   * 참고: weaponId는 10001부터 시작합니다. 이걸 1번으로 가정하고 순차적으로 1씩 올라갑니다.
   * 
   * 잘못된 숫자인경우, 0으로 리턴합니다.
   */
  static getWeaponIconNumber (weaponId = 10001) {
    const startNum = ID.playerWeapon.weaponNumberStart
    if (weaponId >= startNum && weaponId < startNum + dataExportStatPlayerWeapon.size) {
      return weaponId - startNum
    } else {
      return 0
    }
  }

  static getSkillIconNumber (weaponId = 12001) {
    const startNum = ID.playerSkill.skillNumberStart
    if (weaponId >= startNum && weaponId < startNum + dataExportStatPlayerSkill.size) {
      return weaponId - startNum
    } else {
      return 0
    }
  }

  /** 해당 타입이 표준을 위반하는 밸런스를 가지고 있는지 판단합니다. 주 기준은 배율입니다. */
  checkBalance () {
    const B = StatPlayerWeapon.balanceTypeList
    const M = this.multiple
    const C = this.coolTime >= 28 ? 0.1 : 0
    if (this.isSkill) {
      switch (this.balance) {
        case B.SPLASH: return M >= 0.4 + C && M <= 0.5 + C
        case B.AREA_SPLASH: return M >= 0.3 + C && M <= 0.6 + C
        case B.AREA_ATTACK: return M >= 0.7 + C && M <= 1.2 + C
        case B.CHASE: return M === 1 + C
        case B.SHOT_FRONT: return M === 1.2 + C
        case B.SHOT_XWAY: return M >= 1.02 + C && M <= 1.2 + C
        case B.SHOT_ANOTHER: return M >= 1.04 + C && M <= 1.08 + C
        case B.FORMULA: return M >= 1 + C && M <= 1.2 + C
        default: return false
      }
    } else {
      const WIDE = 0.4 // back에 해당하는 보너스 배율이 있을 수 있기 때문에 추가 배율도 고려해야 함
      switch (this.balance) {
        case B.SPLASH: return M >= 0.4 && M <= 0.5
        case B.CHASE: return M === 1
        case B.SHOT_FRONT: return M >= 1.6 && M <= 1.6 + WIDE
        case B.SHOT_XWAY: return M >= 1.2 && M <= 1.2 + WIDE
        case B.SHOT_ANOTHER: return M >= 1.05 && M <= 1.15
        case B.MIXED: return M >= 0.5 && M <= 2 // 믹스드는 어떤 조합이 나올 지 알 수 없어서 그냥 최대범위로 지정
        default: return false
      }
    }
  }

  /** 
   * 밸런스 타입 리스트
   * 밸런스 규칙에 대한 내용은 standard.html 참고
   */
  static balanceTypeList = {
    /** 스플래시 (무기 1회 공격시에, 동시에 여러 적을 공격할 수 있는 경우, 다른 그룹보다 우선순위 높음) */ SPLASH: 'splash',
    /** 에리어 스플래시, 특정 영역 범위에 다수 타격, 스플래시랑은 다름 */ AREA_SPLASH: 'area-splash',
    /** 에리어 공격, 특정 영역 범위에 다수 타격, 다만 최대 개체 제한이 엄격함 */ AREA_ATTACK: 'area-attack',
    /** 체이스/추적 (무기가 적을 무조건 추적만 하는 경우, 단 스플래시는 해당하지 않음.) */ CHASE: 'chase',
    /** 샷계열 - Xways, 밸런스 배율 상으로 전후방을 구분하지만, 같은 타입으로 관리됨 */ SHOT_XWAY: 'shot-xway',
    /** 샷계열 - front/back, 샷이 직선 방향으로만 나아가는 경우, 반대 방향 또한 포함 */ SHOT_FRONT: 'shot-front',
    /** 추적하지 않지만, 방향이 다소 독자적인 패턴인 경우 */ SHOT_ANOTHER: 'shot-another',
    /** 믹스드 (스플래시가 아닌 것들이 혼합된 경우) */ MIXED: 'mixed',
    /** 공식 자체가 해당 무기 또는 스킬의 자체 공식인 경우 */ FORMULA: 'formula',
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

/** 플레이어가 사용하는 스킬에 대한 스탯 정보 */
export class StatPlayerSkill extends StatPlayerWeapon {
  /**
   * 플레이어 무기 데이터를 생성합니다.  
   * 생성자로만 완성할 수 없으니, setConfig 함수를 통해 스탯을 추가로 설정해주세요.
   * @param {string} group 그룹 이름 (해당 무기의 그룹명이 무엇인가?)
   * @param {string} name 이름 (해당 무기의 이름)
   * @param {string} balance 밸런스 타입 (표준 밸런스 규칙을 참고하세요.)
   * @param {number} [multiple = 1] 배율 (표준 밸런스 규칙에 맞춰 지정하세요. 배율은 1이 기본값이고, 1.2가 되면 1.2배를 뜻함)
   * @param {number} [cooltime = 0] 쿨타임 (스킬에서만 사용, 20, 24, 28 3종류만 허용됨. 스킬이 아닌 경우 쿨타임은 무시)
   */
  constructor (group, name, balance, multiple = 1, cooltime = 0) {
    super(group, name, balance, multiple, cooltime)
    this.isSkill = true // 겨우 이거 하나 다른거다.
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
   * (라운드의 구현은 dataRound.js에서 처리합니다. 이 클래스는 스탯값만 정의하고 알고리즘 또는 라운드 구현을 하지 않습니다.)
   * 
   * 생성자만으로 입력 정보가 부족하면, 내부 체이닝 set 메서드를 통해 추가로 데이터를 입력해주세요.
   * 
   * @param {number} [iconNumber=-1] 라운드 아이콘의 번호 (roundIcon.png에 있는 여러 아이콘들중에 어떤것을 선택할건지에 대한 값), -1은 아이콘 없음
   * @param {string} roundText 라운드 값을 표시할 텍스트, 예시: 1-1, 한글 사용 금지, 일부 기호와 알파벳만 사용가능, 최대 5글자까지 지원(검사하진 않음...)
   * @param {number} requireLevel 해당 라운드를 플레이하기 위한 최소 레벨 (해당 레벨 이상만 플레이 가능)
   * @param {number} requireAttack 기준 파워(전투력) 해당 라운드에서 얼마만큼의 전투력을 기준으로 적을 배치했는지에 대한 값
   * @param {number} finishTime 종료 시간(단위: 초), 해당 라운드를 클리어 하기 위해 사용해야 하는 시간 (단, 이것은 기준 시간이며, 일부 라운드는 특정 상황이 되면 강제로 클리어 할 수 있음.)
   * @param {number} clearBonusScore 클리어 보너스 (이 라운드를 클리어 했을 때 얻는 추가 점수)
   * @param {number} gold10SecRate 10초 단위를 기준으로 한 골드 값
   */
  constructor (iconNumber = -1, roundText = 'NULL', requireLevel = 1, requireAttack = 40000, finishTime = 180, clearBonusScore = 30000, gold10SecRate = 0) {
    /** 아이콘의 번호 (-1인경우 없음) */ this.iconNumber = iconNumber
    /** 스탯라인에 표시될 라운드 텍스트값 (예를들어 1-1 같은거) */ this.roundText = roundText
    /** 해당 라운드를 플레이하기 위한 최소 레벨 */ this.requireLevel = requireLevel
    /** 해당 라운드를 진행하기 위해 필요한 공격력값 (이 값의 90% 미만 플레이 불가능) */ this.requireAttack = requireAttack
    /** 라운드가 클리어되는 기준이 되는 시간 */ this.finishTime = finishTime
    /** 라운드를 플레이하면서 얻는 골드의 기준값, 10초단위로 계산됨 */ this.gold10SecRate = gold10SecRate
    /** 총합 골드량 */ this.goldTotal = this.gold10SecRate * Math.floor(finishTime / 10)
    
    /** 이전 라운드의 id (이 값이 0이 아니면 해당 라운드를 클리어 해야 오픈됨) @deprecated */ this.prevRoundId = 0
    
    /** 라운드의 이름 @deprecated */ this.roundName = ''
    /** 라운드 설명 또는 정보 @deprecated */ this.roundInfo = ''
    /** 라운드를 클리어했을 때 얻는 보너스 점수 */ this.clearBonusScore = clearBonusScore

    /** 라운드 플레이에 기준이 되는 시간 값 */ this.baseTime = 0
    /** 초 당 기준이 되는 점수 */ this.scorePerSecond = 0

    // 추가적인 옵션 자동 설정
    /** 해당 라운드를 진행하기 위해 필요한 최소 공격력값 (이 값 미만은 플레이 불가능, 이 값은 필요값의 90%로 정의)
     * 
     * 아직 이 부분은 불확실하게 결정하였음.
     * @deprecated */ 
    this.minAttack = Math.floor(requireAttack * 0.9)
  }

  /**
   * 밸런스의 기준이 되는 값을 입력합니다. 이 값이 입력되지 않은 경우, 밸런스 정보는 누락된 것으로 간주합니다.
   * 
   * 주의: 기준이 되는건 사실이지만, 정확한 값을 보증하는 것이 아닙니다! 실제 점수는 오차가 크게 발생할 수도 있습니다.
   * 
   * @param {number} baseTime 기준 시간 (실제 개발자가 의도한 플레이 시간 값)
   * @param {number} scorePerSecond 초당 점수값 (baseTime * scorePerSecond가 밸런스 점수의 기준값이 됩니다.)
   */
  setBalance (baseTime = 180, scorePerSecond = 400) {
    this.baseTime = baseTime
    this.scorePerSecond = scorePerSecond
    return this
  }

  /**
   * 라운드 정보를 설정합니다.
   * @param {string} roundName 라운드 이름
   * @param {string} roundInfo 라운드에 대한 정보 (가능하다면 1줄로 출력해주세요.)
   */
  setRoundInfo (roundName = '', roundInfo = '') {
    this.roundName = roundName
    this.roundInfo = roundInfo
    return this
  }

  /** 라운드 월드에 대한 정보 (전부 static) */
  static world = class {
    /** 라운드 아이콘 리스트 (0번 라운드는 없기 때문에 -1임) */
    static iconList = [-1, 1, 10, 20]

    /** 라운드 선택 화면에서 배열 인덱스에 따른 기본 라운드 표시 값입니다.
     * 이 값은 상수라기 보다는, 보여지기 위한 값이므로 string으로 처리합니다.
     * @type {string[]}
     */
    static baseRoundTextList = ['R: 1', 'R: 2', 'R: 3']

    /** 라운드 선택 화면에서 활용되는 그리드 테이블입니다. 이 테이블을 참조하여 라운드 목록을 표시합니다. */
    static roundSelectGridTable = [
      // round 1, 2 (1-1 ~ 1-6, 2-1 ~ 2-6)
      [ID.round.round1_1, ID.round.round1_2, ID.round.round1_3, ID.round.round1_4, ID.round.round1_5, ID.round.round1_6],
      [ID.round.round2_1, ID.round.round2_2, ID.round.round2_3, ID.round.round2_4, ID.round.round2_5, ID.round.round2_6],

      // round 3 (3-1 ~ 3-12)
      [ID.round.round3_1, ID.round.round3_2, ID.round.round3_3, ID.round.round3_4, ID.round.round3_5, ID.round.round3_6, 
       ID.round.round3_7, ID.round.round3_8, ID.round.round3_9, ID.round.round3_10, ID.round.round3_11, ID.round.round3_12],
    ]

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
   * 아이템의 정보를 생성 (아이템 기능의 구현은 다른곳에서 처리해야함)
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

    /** 장비 정보 (참고: plus접두어가 붙은것은 강화 효과를 무시함) */ 
    this.equipment = {
      /** 장비 아이템 착용 제한 레벨 */ requireLevel: 0,
      /** 장비의 공격력 */ attack: 0,
      /** 장비의 업그레이드 비용 */ upgradeCost: 0,
      /** 업그레이드 가능 여부 (단, 골드로 강화가 안되는것이지 코드에 따른 임의레벨조정은 가능함) */ isUpgardeBlock: false,
      /** 장비의 추가 공격력 (강화 효과 무시) */ plusAttack: 0,
      /** 장비의 추가쉴드 (강화 효과 무시) */ plusShield: 0,
      /** 장비의 추가체력 (강화 효과 무시) */ plusHp: 0,
      /** 서브웨폰의 id (이 값이 유효하면, 보조무기를 생성함) */ subWeaponId: 0,
      /** 장비의 쉴드회복 (강화 효과 무시), (쉴드 회복값은 매 프레임 당 value/6000 으로 증가함, 주의: 나눗셈연산이 아니고 정수연산임) 
       * 
       * 이 말을 해석하면 쉴드회복이 200/6000이면, 대략 30프레임당 1회복임 */ plusShieldRecovery: 0,
    }
  }

  /**
   * 장비에 대한 기본적인 정보 (장비 아이템이 아니면 접근 불가)
   * 
   * @param {number} requireLevel 장비를 장착하기 위해 필요한 레벨
   * @param {number} attack 장비의 공격력
   * @param {number} upgradeCost 장비의 업그레이드 기본 비용 (음수값이면 강화불가로 처리함)
   * @param {number} plusAttack 추가 공격력 (강화 효과 무시)
   * @param {number} plusHp 추가 체력 (강화 효과 무시)
   * @param {number} plusShield 추가 쉴드 (강화 효과 무시)
   * @param {number} plusShieldRecovery 추가 회복(프레임 당 기준) (강화 효과 무시), 주의: 이 값은 x/6000으로 회복함. 그리고 나눗셈연산하지 않음 (정수단위임)

   */
  setEquipmentInfo (requireLevel, attack, upgradeCost, plusAttack = 0, plusHp = 0, plusShield = 0, plusShieldRecovery = 0) {
    this.equipment.requireLevel = requireLevel
    this.equipment.attack = attack
    this.equipment.upgradeCost = upgradeCost
    this.equipment.plusAttack = plusAttack
    this.equipment.plusHp = plusHp
    this.equipment.plusShield = plusShield
    this.equipment.plusShieldRecovery = plusShieldRecovery
  }

  /**
   * 서브웨폰 id 설정 (참고: dps의 10%로 자동적으로 공격력이 결정됨)
   * @param {number} subWeaponId 서브웨폰의 id (무기의 id를 입력해야 합니다.)
   */
  setSubweaponId (subWeaponId) {
    this.equipment.subWeaponId = subWeaponId
  }

  static TYPE_ITEM = 'item'
  static TYPE_EQUIPMENT = 'equipment'

  /** 장비에 대한 업그레이드 최대레벨 */
  static UPGRADE_LEVEL_MAX = 13

  /** 장비에 대한 업그레이드 시 공격력의 기준 퍼센트 */
  static upgradeAttackPercentTable = [
    100, 140, 180, 220, 280, 340, 400, 480, 560, 640,
    720, 800, 900, 1000
  ]

  /** 장비에 대한 업그레이드 시 비용의 기준 퍼센트 */
  static upgradeCostPercentTable = [
    0, 100, 120, 140, 180, 220, 280, 340, 420, 500,
    560, 640, 700, 800
  ]

  /** 장비를 판매할 때 환수되는 비용의 비율 */
  static upgradeRefundPercentTable = [
    20, 20, 20, 20, 20, 22, 24, 26, 28, 30,
    30, 30, 30, 30,
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
dataExportStatWeapon.set(ID.weapon.multyshot, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.missile, new StatWeapon(2, 6, true).setSplash(10))
dataExportStatWeapon.set(ID.weapon.arrow, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.laser, new StatWeapon(5, 0, false))
dataExportStatWeapon.set(ID.weapon.sapia, new StatWeapon(10, 6, true))
dataExportStatWeapon.set(ID.weapon.parapo, new StatWeapon(1, 0, true).setSub(ID.weapon.parapoSub, 4))
dataExportStatWeapon.set(ID.weapon.parapoSub, new StatWeapon(1, 0, false).setSplash(12))
dataExportStatWeapon.set(ID.weapon.rapid, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.blaster, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.sidewave, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.ring, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.seondanil, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.boomerang, new StatWeapon(4, 0, false))
dataExportStatWeapon.set(ID.weapon.kalnal, new StatWeapon(8, 2, false))
dataExportStatWeapon.set(ID.weapon.cogwheel, new StatWeapon(30, 2, false))
dataExportStatWeapon.set(ID.weapon.yeonsai, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.sabangtan, new StatWeapon(2, 6, false).setSplash(10))
dataExportStatWeapon.set(ID.weapon.r3TowerPink, new StatWeapon(5, 0, false))
dataExportStatWeapon.set(ID.weapon.r3TowerPurple, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.r3Helljeon, new StatWeapon(1, 0, false))

dataExportStatWeapon.set(ID.weapon.skillMultyshot, new StatWeapon(1, 0, true))
dataExportStatWeapon.set(ID.weapon.skillMissile, new StatWeapon(10, 4, true).setSplash(20))
dataExportStatWeapon.set(ID.weapon.skillArrow, new StatWeapon(4, 0, false))
dataExportStatWeapon.set(ID.weapon.skillLaser, new StatWeapon(60, 4, false).setSplash(14))
dataExportStatWeapon.set(ID.weapon.skillSapia, new StatWeapon(10, 6, true).setSplash(4))
dataExportStatWeapon.set(ID.weapon.skillParapo, new StatWeapon(1, 0, true).setSplash(24))
dataExportStatWeapon.set(ID.weapon.skillBlaster, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.skillSidewave, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.skillSword, new StatWeapon(80, 3, true))
dataExportStatWeapon.set(ID.weapon.skillHyperBall, new StatWeapon(6, 0, false))
dataExportStatWeapon.set(ID.weapon.skillCriticalChaser, new StatWeapon(4, 6, false).setSplash(35))
dataExportStatWeapon.set(ID.weapon.skillPileBunker, new StatWeapon(16, 6, false).setSplash(4))
dataExportStatWeapon.set(ID.weapon.skillSantansu, new StatWeapon(6, 9, false).setSplash(50))
dataExportStatWeapon.set(ID.weapon.skillWhiteflash, new StatWeapon(40, 4, true).setSplash(22).setSub(ID.weapon.skillWhiteflashSub, 1))
dataExportStatWeapon.set(ID.weapon.skillWhiteflashSub, new StatWeapon(1, 4, true).setSplash(22))
dataExportStatWeapon.set(ID.weapon.skillRing, new StatWeapon(1, 1, false))
dataExportStatWeapon.set(ID.weapon.skillRapid, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.skillSeondanil, new StatWeapon(50, 3, false).setSub(ID.weapon.skillSeondanilSub, 1))
dataExportStatWeapon.set(ID.weapon.skillSeondanilSub, new StatWeapon(1, 3, false))
dataExportStatWeapon.set(ID.weapon.skillHanjumeok, new StatWeapon(30, 5, false).setSplash(40))
dataExportStatWeapon.set(ID.weapon.skillBoomerang, new StatWeapon(30, 8, false).setSplash(4))
dataExportStatWeapon.set(ID.weapon.skillMoon, new StatWeapon(30, 3, false).setSplash(100))
dataExportStatWeapon.set(ID.weapon.skillKalnal, new StatWeapon(6, 8, false))
dataExportStatWeapon.set(ID.weapon.skillCogwheel, new StatWeapon(30, 6, false).setSplash(6))
dataExportStatWeapon.set(ID.weapon.skillYeonsai, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.skillSabangtan, new StatWeapon(4, 4, false).setSplash(20))
dataExportStatWeapon.set(ID.weapon.skillHabirant, new StatWeapon(40, 6, true).setSub(ID.weapon.skillHabirantSub, 4))
dataExportStatWeapon.set(ID.weapon.skillHabirantSub, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.skillIcechaser, new StatWeapon(4, 6, true).setSplash(34))
dataExportStatWeapon.set(ID.weapon.skillCalibur, new StatWeapon(16, 8, false).setSub(ID.weapon.skillCaliburSub, 5))
dataExportStatWeapon.set(ID.weapon.skillCaliburSub, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.skillSujikpa, new StatWeapon(4, 10, false).setSplash(22))
dataExportStatWeapon.set(ID.weapon.skillSpeaker, new StatWeapon(6, 30, false).setSplash(5))
dataExportStatWeapon.set(ID.weapon.skillEomukggochi, new StatWeapon(6, 30, false).setSub(ID.weapon.skillEomukggochiSub, 10))
dataExportStatWeapon.set(ID.weapon.skillEomukggochiSub, new StatWeapon(1, 0, false))
dataExportStatWeapon.set(ID.weapon.skillR2Firecraker, new StatWeapon(1, 0, false).setSplash(20))
dataExportStatWeapon.set(ID.weapon.skillR2Toyhammer, new StatWeapon(45, 6, true))
dataExportStatWeapon.set(ID.weapon.skillR3Xkill, new StatWeapon(150, 10, false))
dataExportStatWeapon.set(ID.weapon.skillR3Xshot, new StatWeapon(15, 10, false).setSub(ID.weapon.skillR3XshotSub, 10))
dataExportStatWeapon.set(ID.weapon.skillR3XshotSub, new StatWeapon(1, 1, false))
dataExportStatWeapon.set(ID.weapon.skillR3Xbeam, new StatWeapon(8, 20, false).setSplash(4).setSub(ID.weapon.skillR3XbeamSub, 4))
dataExportStatWeapon.set(ID.weapon.skillR3XbeamSub, new StatWeapon(1, 1, false).setSplash(4))
dataExportStatWeapon.set(ID.weapon.skillR3Xboom, new StatWeapon(18, 8, false).setSplash(28).setSub(ID.weapon.skillR3XboomSub, 1))
dataExportStatWeapon.set(ID.weapon.skillR3XboomSub, new StatWeapon(1, 1, false).setSplash(28))
dataExportStatWeapon.set(ID.weapon.skillR3Helljeon, new StatWeapon(1, 1, true))



// 파라포 알고리즘 수정 필요 (4개 개체가 공격하는 형태인지 볼 필요가 있음)
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
DXweapon.set(IDweapon.unused, new pWeapon(wGroup.GROUP1, 'unused', wBalance.CHASE, 1).setConfig(0, 0, 0).setIdList(ID.weapon.multyshot))
DXweapon.set(IDweapon.multyshot, new pWeapon(wGroup.GROUP1, 'multyshot', wBalance.MIXED, 1.33).setConfig(6, 1, 10).setIdList(ID.weapon.multyshot))
DXweapon.set(IDweapon.missile, new pWeapon(wGroup.GROUP1, 'missile', wBalance.SPLASH, 0.5).setConfig(4, 2, 30).setIdList(ID.weapon.missile))
DXweapon.set(IDweapon.arrow, new pWeapon(wGroup.GROUP1, 'arrow', wBalance.SHOT_ANOTHER, 1.04).setConfig(2, 1, 10).setIdList(ID.weapon.arrow))
DXweapon.set(IDweapon.laser, new pWeapon(wGroup.GROUP1, 'laser', wBalance.MIXED, 1.2).setConfig(4, 1, 12).setIdList(ID.weapon.laser))
DXweapon.set(IDweapon.sapia, new pWeapon(wGroup.GROUP1, 'sapia', wBalance.CHASE, 1).setConfig(3, 1, 60).setIdList(ID.weapon.sapia))
DXweapon.set(IDweapon.parapo, new pWeapon(wGroup.GROUP1, 'parapo', wBalance.SPLASH, 0.48).setConfig(3, 1, 30).setIdList(ID.weapon.parapo))
DXweapon.set(IDweapon.blaster, new pWeapon(wGroup.GROUP1, 'blaster', wBalance.SHOT_XWAY, 1.52).setConfig(2, 1, 6).setIdList(ID.weapon.blaster))
DXweapon.set(IDweapon.sidewave, new pWeapon(wGroup.GROUP1, 'sidewave', wBalance.SHOT_XWAY, 1.46).setConfig(8, 1, 15).setIdList(ID.weapon.sidewave))
DXweapon.set(IDweapon.ring, new pWeapon(wGroup.GROUP1, 'ring', wBalance.SHOT_XWAY, 1.8).setConfig(8, 1, 30).setIdList(ID.weapon.ring))
DXweapon.set(IDweapon.rapid, new pWeapon(wGroup.GROUP1, 'rapid', wBalance.SHOT_FRONT, 1.6).setConfig(3, 1, 4).setIdList(ID.weapon.rapid))
DXweapon.set(IDweapon.seondanil, new pWeapon(wGroup.GROUP1, 'seondanil', wBalance.CHASE, 1.0).setConfig(5, 1, 30).setIdList(ID.weapon.seondanil))
DXweapon.set(IDweapon.boomerang, new pWeapon(wGroup.GROUP1, 'boomerang', wBalance.SHOT_ANOTHER, 1.22).setConfig(3, 1, 20).setIdList(ID.weapon.boomerang))
DXweapon.set(IDweapon.kalnal, new pWeapon(wGroup.GROUP2, 'kalnal', wBalance.CHASE, 1).setConfig(2, 1, 20).setIdList(ID.weapon.kalnal))
DXweapon.set(IDweapon.cogwheel, new pWeapon(wGroup.GROUP2, 'cogwheel', wBalance.SHOT_ANOTHER, 1.35).setConfig(1, 1,  40).setIdList(ID.weapon.cogwheel))
DXweapon.set(IDweapon.yeonsai, new pWeapon(wGroup.GROUP2, 'yeonsai', wBalance.SHOT_XWAY, 1.8).setConfig(6, 1, 6).setIdList(ID.weapon.yeonsai))
DXweapon.set(IDweapon.sabangtan, new pWeapon(wGroup.GROUP2, 'sabangtan', wBalance.SPLASH, 0.5).setConfig(4, 1, 30).setIdList(ID.weapon.sabangtan))
DXweapon.set(IDweapon.r3TowerPink, new pWeapon(wGroup.R3_TOWER, 'towerpink', wBalance.CHASE, 1).setConfig(1, 5, 15).setIdList(ID.weapon.r3TowerPink))
DXweapon.set(IDweapon.r3TowerPurple, new pWeapon(wGroup.R3_TOWER, 'towerpurple', wBalance.SHOT_ANOTHER, 1.04).setConfig(2, 1, 10).setIdList(ID.weapon.r3TowerPurple))
DXweapon.set(IDweapon.r3Helljeon, new pWeapon(wGroup.R3_TOWER, 'helljeon', wBalance.MIXED, 1.3).setConfig(4, 1, 10).setIdList(ID.weapon.r3Helljeon))

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
DXskill.set(IDskill.unused, new pSkill(sGroup.GROUP1, 'unused', sBalance.FORMULA, 1, 20).setConfig(1, 1, 0).setIdList(IDweapon.unused))
DXskill.set(IDskill.multyshot, new pSkill(sGroup.GROUP1, 'multyshot', sBalance.CHASE, 1, 20).setConfig(5, 30, 6).setIdList(ID.weapon.skillMultyshot))
DXskill.set(IDskill.missile, new pSkill(sGroup.GROUP1, 'missile', sBalance.SPLASH, 0.5, 24).setConfig(2, 4, 20).setIdList(ID.weapon.skillMissile))
DXskill.set(IDskill.arrow, new pSkill(sGroup.GROUP1, 'arrow', sBalance.SHOT_ANOTHER, 1.04, 20).setConfig(2, 20, 9).setIdList(ID.weapon.skillArrow))
DXskill.set(IDskill.laser, new pSkill(sGroup.GROUP1, 'laser', sBalance.AREA_SPLASH, 0.5, 20).setConfig(1, 1, 0).setIdList(ID.weapon.skillLaser))
DXskill.set(IDskill.sapia, new pSkill(sGroup.GROUP1, 'sapia', sBalance.AREA_ATTACK, 1, 24).setConfig(4, 4, 60).setIdList(ID.weapon.skillSapia))
DXskill.set(IDskill.parapo, new pSkill(sGroup.GROUP1, 'parapo', sBalance.SPLASH, 0.44, 24).setConfig(1, 24, 10).setIdList(ID.weapon.skillParapo))
DXskill.set(IDskill.blaster, new pSkill(sGroup.GROUP1, 'blaster', sBalance.SHOT_FRONT, 1.2, 24).setConfig(2, 40, 4).setIdList(ID.weapon.skillBlaster))
DXskill.set(IDskill.sidewave, new pSkill(sGroup.GROUP1, 'sidewave', sBalance.SHOT_XWAY, 1.08, 20).setConfig(3, 24, 7).setIdList(ID.weapon.skillSidewave))
DXskill.set(IDskill.sword, new pSkill(sGroup.GROUP1, 'sword', sBalance.CHASE, 1, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillSword))
DXskill.set(IDskill.hyperBall, new pSkill(sGroup.GROUP1, 'hyperball', sBalance.CHASE, 1, 20).setConfig(2, 12, 15).setIdList(ID.weapon.skillHyperBall))
DXskill.set(IDskill.critcalChaser, new pSkill(sGroup.GROUP1, 'criticalchaser', sBalance.SPLASH, 0.6, 28).setConfig(2, 12, 10).setIdList(ID.weapon.skillCriticalChaser))
DXskill.set(IDskill.pileBunker, new pSkill(sGroup.GROUP1, 'pilebunker', sBalance.AREA_ATTACK, 1.3, 28).setConfig(1, 1, 60).setIdList(ID.weapon.skillPileBunker))
DXskill.set(IDskill.santansu, new pSkill(sGroup.GROUP1, 'santansu', sBalance.AREA_SPLASH, 0.3, 24).setConfig(5, 5, 30).setIdList(ID.weapon.skillSantansu))
DXskill.set(IDskill.whiteflash, new pSkill(sGroup.GROUP1, 'whiteflash', sBalance.AREA_SPLASH, 0.6, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillWhiteflash))
DXskill.set(IDskill.ring, new pSkill(sGroup.GROUP1, 'ring', sBalance.SHOT_XWAY, 1.04, 20).setConfig(8, 12, 12).setIdList(ID.weapon.skillRing))
DXskill.set(IDskill.rapid, new pSkill(sGroup.GROUP1, 'rapid', sBalance.SHOT_FRONT, 1.2, 20).setConfig(4, 40, 4).setIdList(ID.weapon.skillRapid))
DXskill.set(IDskill.seondanil, new pSkill(sGroup.GROUP1, 'seondanil', sBalance.CHASE, 1.1, 28).setConfig(1, 1, 0).setIdList(ID.weapon.skillSeondanil))
DXskill.set(IDskill.hanjumoek, new pSkill(sGroup.GROUP1, 'hanjumeok', sBalance.SPLASH, 0.57, 28).setConfig(1, 1, 0).setIdList(ID.weapon.skillHanjumeok))
DXskill.set(IDskill.boomerang, new pSkill(sGroup.GROUP1, 'boomerang', sBalance.AREA_ATTACK, 0.93, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillBoomerang))
DXskill.set(IDskill.moon, new pSkill(sGroup.GROUP1, 'moon', sBalance.FORMULA, 1.1, 28).setConfig(1, 1, 0).setIdList(ID.weapon.skillMoon))
DXskill.set(IDskill.kalnal, new pSkill(sGroup.GROUP2, 'kalnal', sBalance.SHOT_ANOTHER, 1.08, 20).setConfig(2, 6, 20).setIdList(ID.weapon.skillKalnal))
DXskill.set(IDskill.cogwheel, new pSkill(sGroup.GROUP2, 'cogwheel', sBalance.AREA_ATTACK, 1.11, 20).setConfig(1, 1, 0).setIdList(ID.weapon.skillCogwheel))
DXskill.set(IDskill.yeonsai, new pSkill(sGroup.GROUP2, 'yeonsai', sBalance.SHOT_XWAY, 1.07, 20).setConfig(10, 30, 5).setIdList(ID.weapon.skillYeonsai))
DXskill.set(IDskill.sabangtan, new pSkill(sGroup.GROUP2, 'sabangtan', sBalance.SPLASH, 0.48, 24).setConfig(6, 5, 15).setIdList(ID.weapon.skillSabangtan))
DXskill.set(IDskill.habirant, new pSkill(sGroup.GROUP2, 'habirant', sBalance.CHASE, 1, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillHabirant))
DXskill.set(IDskill.icechaser, new pSkill(sGroup.GROUP2, 'icechaser', sBalance.SPLASH, 0.6, 28).setConfig(2, 12, 10).setIdList(ID.weapon.skillIcechaser))
DXskill.set(IDskill.calibur, new pSkill(sGroup.GROUP2, 'calibur', sBalance.CHASE, 1, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillCalibur))
DXskill.set(IDskill.sujikpa, new pSkill(sGroup.GROUP2, 'sujikpa', sBalance.AREA_SPLASH, 0.55, 24).setConfig(1, 8, 20).setIdList(ID.weapon.skillSujikpa))
DXskill.set(IDskill.speaker, new pSkill(sGroup.GROUP2, 'speaker', sBalance.AREA_ATTACK, 0.9, 24).setConfig(1, 1, 1).setIdList(ID.weapon.skillSpeaker))
DXskill.set(IDskill.eomukggochi, new pSkill(sGroup.GROUP2, 'eomukggochi', sBalance.CHASE, 1, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillEomukggochi))
DXskill.set(IDskill.r2Firecracker, new pSkill(sGroup.DONGGRAMI, 'firecracker', sBalance.SPLASH, 0.5, 24).setConfig(1, 15, 12).setIdList(ID.weapon.skillR2Firecraker))
DXskill.set(IDskill.r2Toyhammer, new pSkill(sGroup.DONGGRAMI, 'toyhammer', sBalance.CHASE, 1, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillR2Toyhammer))
DXskill.set(IDskill.r3Xkill, new pSkill(sGroup.R3_TOWER, 'Xkill', sBalance.CHASE, 1, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillR3Xkill))
DXskill.set(IDskill.r3Xshot, new pSkill(sGroup.R3_TOWER, 'Xshot', sBalance.SHOT_ANOTHER, 1.05, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillR3Xshot))
DXskill.set(IDskill.r3Xbeam, new pSkill(sGroup.R3_TOWER, 'Xbeam', sBalance.AREA_ATTACK, 0.94, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillR3Xbeam))
DXskill.set(IDskill.r3Xboom, new pSkill(sGroup.R3_TOWER, 'Xboom', sBalance.SPLASH, 0.5, 24).setConfig(1, 1, 0).setIdList(ID.weapon.skillR3Xboom))
DXskill.set(IDskill.r3Helljeon, new pSkill(sGroup.R3_TOWER, 'helljeon', sBalance.CHASE, 1, 20).setConfig(2, 30, 5).setIdList(ID.weapon.skillR3Helljeon))


/**
 * 외부에서 사용하기 위한 라운드 스탯 값
 * @type {Map<number, StatRound>}
 */
export const dataExportStatRound = new Map()
dataExportStatRound.set(ID.round.UNUSED, new StatRound())
// test
dataExportStatRound.set(ID.round.test1Enemy, new StatRound(8, 'TEST1', 0, 0, 9900, 0, 0))
dataExportStatRound.set(ID.round.test2Background, new StatRound(8, 'TEST2', 0, 0, 9900, 0, 0))
dataExportStatRound.set(ID.round.test3Round3DownTower, new StatRound(8, 'R3-TEST', 20, 0, 9900, 0, 0))
dataExportStatRound.set(ID.round.test4Sound, new StatRound(-1, 'TEST4', 0, 0, 9999, 0, 0))
// round 1
dataExportStatRound.set(ID.round.round1_1, new StatRound(2, '1-1', 0, 40000, 150, 30000, 10).setBalance(170, 400).setRoundInfo('우주 여행 - 공허'))
dataExportStatRound.set(ID.round.round1_2, new StatRound(3, '1-2', 0, 40000, 180, 32000, 10).setBalance(180, 400).setRoundInfo('운석 지대'))
dataExportStatRound.set(ID.round.round1_3, new StatRound(4, '1-3', 2, 44000, 180, 32000, 10).setBalance(180, 440).setRoundInfo('운석 지대 - 무인기 충돌'))
dataExportStatRound.set(ID.round.round1_4, new StatRound(5, '1-4', 2, 44000, 155, 38000, 10).setBalance(150, 440).setRoundInfo('의식의 공간'))
dataExportStatRound.set(ID.round.round1_5, new StatRound(6, '1-5', 4, 44000, 180, 34000, 10).setBalance(180, 440).setRoundInfo('운석 지대 - 레드 존'))
dataExportStatRound.set(ID.round.round1_6, new StatRound(7, '1-6', 4, 44000, 152, 32000, 10).setBalance(170, 440).setRoundInfo('우주 여행 - 파란 행성 가는 길'))
// round 2
dataExportStatRound.set(ID.round.round2_1, new StatRound(11, '2-1', 10, 50000, 150, 40000, 10).setBalance(170, 500).setRoundInfo('파란 행성 - 하늘 300km ~ 250km'))
dataExportStatRound.set(ID.round.round2_2, new StatRound(12, '2-2', 10, 50000, 170, 36000, 10).setBalance(170, 530).setRoundInfo('동그라미 마을'))
dataExportStatRound.set(ID.round.round2_3, new StatRound(13, '2-3', 12, 50000, 182, 40000, 10).setBalance(175, 540).setRoundInfo('동그라미 스페이스'))
dataExportStatRound.set(ID.round.round2_4, new StatRound(14, '2-4', 12, 55000, 190, 52000, 10).setBalance(190, 550).setRoundInfo('동그라미 마을 홀'))
dataExportStatRound.set(ID.round.round2_5, new StatRound(15, '2-5', 14, 55000, 190, 15000, 10).setBalance(190, 550).setRoundInfo('지하실 전투'))
dataExportStatRound.set(ID.round.round2_6, new StatRound(16, '2-6', 14, 55000, 150, 42000, 10).setBalance(150, 550).setRoundInfo('폐허가 된 동그라미 마을'))
// round 3
dataExportStatRound.set(ID.round.round3_1, new StatRound(21, '3-1', 20, 60000, 200, 45000, 10).setBalance(220, 700).setRoundInfo('다운 타워 1'))
dataExportStatRound.set(ID.round.round3_2, new StatRound(22, '3-2', 20, 60000, 220, 45000, 10).setBalance(220, 700).setRoundInfo('다운 타워 2'))
dataExportStatRound.set(ID.round.round3_3, new StatRound(23, '3-3', 20, 60000, 200, 45000, 10).setBalance(220, 700).setRoundInfo('다운 타워 3'))
dataExportStatRound.set(ID.round.round3_4, new StatRound(24, '3-4', 22, 63000, 220, 32000, 10).setBalance(220, 740).setRoundInfo('다운 타워 보이드'))
dataExportStatRound.set(ID.round.round3_5, new StatRound(25, '3-5', 22, 63000, 220, 32000, 10).setBalance(220, 740).setRoundInfo('다운 타워 중심부'))
dataExportStatRound.set(ID.round.round3_6, new StatRound(26, '3-6', 23, 63000, 360, 64000, 10).setBalance(360, 800).setRoundInfo('안티 제물'))
dataExportStatRound.set(ID.round.round3_7, new StatRound(27, '3-7', 24, 66000, 220, 45000, 10).setBalance(220, 780).setRoundInfo('다운 타워 코어 1'))
dataExportStatRound.set(ID.round.round3_8, new StatRound(28, '3-8', 24, 66000, 220, 36000, 10).setBalance(220, 780).setRoundInfo('다운 타워 코어 2'))
dataExportStatRound.set(ID.round.round3_9, new StatRound(29, '3-9', 24, 66000, 220, 36000, 10).setBalance(220, 780).setRoundInfo('다운 타워 통로 1'))
dataExportStatRound.set(ID.round.round3_10, new StatRound(30, '3-10', 24, 66000, 220, 36000, 10).setBalance(220, 780).setRoundInfo('다운 타워 통로 2'))
dataExportStatRound.set(ID.round.round3_11, new StatRound(31, '3-11', 26, 69000, 220, 34000, 10).setBalance(220, 800).setRoundInfo('다운 타워 외벽'))
dataExportStatRound.set(ID.round.round3_12, new StatRound(32, '3-12', 26, 69000, 220, 34000, 10).setBalance(220, 800).setRoundInfo('동그라미 마을로 돌아가는 길'))

/**
 * 외부에서 사용하기 위한 아이템 스탯 값
 * @type {Map<number, StatItem>}
 */
export const dataExportStatItem = new Map()
const inputExportStatItemEquipment = () => {
  const EQUIP001 = new StatItem(0, StatItem.TYPE_EQUIPMENT, '스탠다드 플러스 C1 블루', 1000, '표준적인 장비. \n 공격력을 증가시킨다.')
  EQUIP001.setEquipmentInfo(0, 3000, 1000)
  dataExportStatItem.set(ID.item.standardPlusC1Blue, EQUIP001)
  
  const EQUIP002 = new StatItem(1, StatItem.TYPE_EQUIPMENT, '동그라미 장난감', 1500, '동그라미 마을에서 만든 장난감이에요.\n성능이 약하지만 어쩔 수 없어요 흑흑 ㅠㅠ\n대신 쉴드 회복과 쉴드량을 늘려준답니다. 히힛~')
  EQUIP002.setEquipmentInfo(0, 2400, 1120, 600, 0, 50, 50)
  dataExportStatItem.set(ID.item.donggramiMugi, EQUIP002)
  
  const EQUIP003 = new StatItem(2, StatItem.TYPE_EQUIPMENT, '헬기(hellgi) 장비(jangbi)', 1300, '다운타워에서 돌아다니는 헬기들의 부품을 모아 만든 특수장비.\n 서브웨폰 헬전을 사용할 수 있다.')
  EQUIP003.setEquipmentInfo(0, 2100, 1040, 1100)
}
inputExportStatItemEquipment() // 아이템 정보를 등록한 함수 실행

dataExportStatItem.set(ID.item.donggramiTicket, new StatItem(3, StatItem.TYPE_ITEM, '동그라미 마을 티켓', 100, '동그라미 마을에서 여러가지 용도로 사용하는 티켓'))
dataExportStatItem.set(ID.item.donggramiUSB, new StatItem(4, StatItem.TYPE_ITEM, '동그라미 운영체제 USB', 2000, '동그라미 마을에서 만들어진 재미난 운영체제 파일이 담겨있는 부팅 USB'))
dataExportStatItem.set(ID.item.hellgiComponent, new StatItem(5, StatItem.TYPE_ITEM, '헬기(hellgi) 부품(component)', 60, '다운타워에서 등장하는 헬기들이 부서지고 남은 부품들'))
dataExportStatItem.set(ID.item.upgradeStone, new StatItem(6, StatItem.TYPE_ITEM, '강화석', 100, '강화할 때 필요한 아이템'))
dataExportStatItem.set(ID.item.boseokTest, new StatItem(7, StatItem.TYPE_ITEM, '보석 테스트', 0, '보석 테스트 용도 아이템'))

