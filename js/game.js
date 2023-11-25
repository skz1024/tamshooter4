//@ts-check

import { ID } from "./dataId.js"
import { imageSrc } from "./imageSrc.js"
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
  /** 숫자를 디지털 이미지의 형태로 출력해주는 함수 */
  static digitalDisplay = game.graphic.createCustomBitmapDisplay(imageSrc.system.digitalFontSmall, 12, 18)
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
for (let key in soundSrc.system) {
  game.sound.createAudio(soundSrc.system[key])
}
for (let key in soundSrc.music) {
  game.sound.createAudio(soundSrc.music[key])
}
for (let key in soundSrc.skill) {
  game.sound.createAudio(soundSrc.skill[key])
}
for (let key in soundSrc.enemyDie) {
  game.sound.createAudio(soundSrc.enemyDie[key])
}

/** 유저 정보 (static 클래스) */
export class userSystem {
  /** 레벨, 직접적인 변경 금지 */ static lv = 1
  /** 경험치: 경험치 값은 addExp, setExp등을 통해 수정해주세요. */ static exp = 0
  /** 쉴드 */ static shield = 200
  /** 쉴드 최대치 */ static shieldMax = 200
  /** 체력 (100% 값처럼 취급됨.) */ static hp = 100
  /** 체력 최대치 */ static hpMax = 100
  /** 데미지 경고 프레임 */ static damageWarningFrame = 0
  /** 레벨업 이펙트 프레임 */ static levelUpEffectFrame = 0
  
  /** 스킬 리스트(기본값) (총 8개, 이중 0 ~ 3번은 A슬롯, 4 ~ 7번은 B슬롯) */ 
  static skillList = [
    ID.playerSkill.multyshot, ID.playerSkill.missile, ID.playerSkill.sidewave, ID.playerSkill.critcalChaser,
    ID.playerSkill.hyperBall, ID.playerSkill.sword, ID.playerSkill.santansu, ID.playerSkill.hanjumoek
  ]

  /** 무기 리스트(기본값), 0 ~ 3번까지만 있음. 4번은 무기를 사용하기 싫을 때 사용 따라서 무기가 지정되지 않음. */
  static weaponList = [
    ID.playerWeapon.multyshot, ID.playerWeapon.missile, ID.playerWeapon.laser, ID.playerWeapon.sidewave
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
    0, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, // lv 1 ~ 10
    2400, 2800, 3200, 3600, 4000, 4300, 4500, 4700, 6000, 6000, // lv 11 ~ 20
    5130, 5240, 5330, 5410, 5500, 5600, 5700, 5800, 6000, 6000, // lv 21 ~ 30
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

  /** 현재 스킬 상태를 그대로 보여지게 하는 함수 */
  static setSkillDisplayStatDefaultFunction () {
    for (let i = 0; i < this.skillDisplayStat.length; i++) {
      this.skillDisplayStat[i].id = this.skillList[i]
    }
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
        game.sound.play(soundSrc.system.systemLevelUp)
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
    const statImage = imageSrc.system.playerStat
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
    game.graphic.imageView(statImage, statImageX, statImageY)


    // skill display
    for (let i = 0; i < this.skillDisplayStat.length; i++) {
      const skillNumberImage = imageSrc.system.skillNumber
      const skillIconImage = imageSrc.system.skillIcon
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
      const OUTPUT_TIME_Y = LAYERY1 + 1

      game.graphic.imageDisplay(skillNumberImage, NUMBER_SLICEX, NUMBER_SLICEY, NUMBER_SLICE_WIDTH, NUMBER_SLICE_HEIGHT, OUTPUT_NUMBER_X, LAYERY1, NUMBER_SLICE_WIDTH, NUMBER_SLICE_HEIGHT)
      
      // 스킬 쿨타임이 남아있다면, 남은 시간이 숫자로 표시됩니다.
      // 스킬 쿨타임이 없다면, 스킬을 사용할 수 있으며, 스킬 아이콘이 표시됩니다.
      // 해당하는 스킬이 없다면, 스킬은 표시되지 않습니다.
      if (this.skillDisplayStat[i].coolTime >= 1) {
        if (this.skillDisplayStat[i].id !== 0) {
          const skillNumber = this.skillDisplayStat[i].id - ID.playerSkill.skillNumberStart // 스킬의 ID는 15001부터 시작이라, 15000을 빼면, 스킬 번호값을 얻을 수 있음.
          const skillXLine = skillNumber % 10
          const skillYLine = Math.floor(skillNumber / 10)
          game.graphic.imageDisplay(skillIconImage, skillXLine * SKILL_WIDTH, skillYLine * SKILL_HEIGHT, SKILL_WIDTH, SKILL_HEIGHT, OUTPUT_SKILL_X, LAYERY1, SKILL_WIDTH, SKILL_HEIGHT, 0, 0, 0.5)
        }
        digitalDisplay(this.skillDisplayStat[i].coolTime, OUTPUT_TIME_X, OUTPUT_TIME_Y) // 스킬 쿨타임 시간
      } else {
        if (this.skillDisplayStat[i].id !== 0) {
          const skillNumber = this.skillDisplayStat[i].id - ID.playerSkill.skillNumberStart // 스킬의 ID는 15001부터 시작이라, 15000을 빼면, 스킬 번호값을 얻을 수 있음.
          const skillXLine = skillNumber % 10
          const skillYLine = Math.floor(skillNumber / 10)
          game.graphic.imageDisplay(skillIconImage, skillXLine * SKILL_WIDTH, skillYLine * SKILL_HEIGHT, SKILL_WIDTH, SKILL_HEIGHT, OUTPUT_SKILL_X, LAYERY1, SKILL_WIDTH, SKILL_HEIGHT)
        }
      }
    }

    // hp + shield display
    const hpPercent = this.hp / this.hpMax
    const HP_WIDTH = Math.floor(LAYER_WIDTH / 2) * hpPercent

    // 참고로 체력게이지 바로 뒤에 쉴드 게이지를 표시하기 때문에, 좌표값 계산을 위하여 hp는 따로 퍼센트와 길이를 계산했습니다.
    if (this.damageWarningFrame > 0) {
      let targetFrame = this.damageWarningFrame % H_COLORA.length

      // 체력 게이지 그라디언트
      game.graphic.meterRect(LAYERX, LAYERY2, LAYER_WIDTH / 2, LAYER_HEIGHT, [H_COLORA[targetFrame], H_COLORB[targetFrame]], this.hp, this.hpMax)

      // 쉴드 게이지 그라디언트
      game.graphic.meterRect(LAYERX + HP_WIDTH, LAYERY2, LAYER_WIDTH / 2, LAYER_HEIGHT, [S_COLORA[targetFrame], S_COLORB[targetFrame]], this.shield, this.shieldMax)
    } else {
      // 체력 게이지 그라디언트 [파란색]
      game.graphic.meterRect(LAYERX, LAYERY2, LAYER_WIDTH / 2, LAYER_HEIGHT, [H_COLORA[0], H_COLORB[0]], this.hp, this.hpMax)

      // 쉴드 게이지 그라디언트 [하늘색]
      game.graphic.meterRect(LAYERX + HP_WIDTH, LAYERY2, LAYER_WIDTH / 2, LAYER_HEIGHT, [S_COLORA[0], S_COLORB[0]], this.shield, this.shieldMax)
    }

    const hpText = this.hp + ' + ' + this.shield + '/' + this.shieldMax
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
   * @retruns 세이브데이터의 문자열
   */
  static getSaveData () {
    let inputData = {
      lv: this.lv,
      exp: this.exp,
      weapon: this.weaponList,
      skill: this.skillList
    }

    return inputData
  }

  static getSaveData0a36 () {
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
   * 현재 버전에 대한 유저 데이터 로드
   * @param {any} saveData 저장 성공 여부
   * @returns {boolean}
   */
  static setLoadData (saveData) {
    if (saveData == null) return false

    // 해당 속성이 있을때에만 값을 추가합니다. (없으면 추가 안함)
    if (saveData.lv) this.lv = saveData.lv
    if (saveData.exp) this.exp = saveData.exp
    if (saveData.weapon) this.weaponList = saveData.weapon
    if (saveData.skill) this.skillList = saveData.skill

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

    return true
  }

  /**
   * 0.36 버전에 대한 유저 데이터 로드
   * @param {string} saveData 
   */
  static setLoadData0a36 (saveData) {
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
