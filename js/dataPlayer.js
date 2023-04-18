//@ts-check

import { tamshooter4Data } from "./data.js"
import { ID } from "./dataId.js"
import { dataExportStatPlayerSkill, dataExportStatPlayerWeapon, dataExportStatWeapon } from "./dataStat.js"
import { dataExportWeapon, WeaponData } from "./dataWeapon.js"
import { fieldState } from "./field.js"
import { soundSrc } from "./soundSrc.js"
import { game } from "./game.js"

let soundSystem = game.sound
let graphicSystem = game.graphic

/**
 * 플레이어 무기 데이터
 * 참고: 기본 스펙은 다음과 같습니다.
 * 1초당 100% 공격력이 기준값
 * 나머지 무기는 이 공격력 %를 바꿈으로써 밸런스를 조절할 계획
 * 경고: 저 수치는 명시적인 수치이지만, 기타 예외적인 요소로 인해 다른 값이 부여될 수도 있음.
 */
 export class PlayerWeaponData {
  constructor () {
    /** 사용하는 플레이어무기의 id */
    this.playerWeaponId = 0

    /**
     * 샷 한번 발사에 지연시간(프레임)
     * 해당 프레임만큼 지연 후 다음 무기를 발사 할 수 있음.
     * 
     * 참고사항 (딜레이 D - 초당 발사 횟수와의 관계 S) D3이하는 잘 사용하지 않음.
     * 
     * D60 - S1, D30 - S2, D20 - S3, D15 - S4, D12 - S5, D10 - S6, D6 - S10, D5 - S12, D4 - S15
     */
    this.delay = 60

    /**
     * 한번 무기를 발사할 때 동시에 발사되는 개수
     * 2 이상일 경우, 동시에 2발을 발사한다는 뜻
     * 
     * 주의: 샷 카운트가 아무리 높아도, 제대로 구현하지 않으면 의미가 없음(사용자가 직접 수를 늘려줘야 함.)
     * 무기마다 발사 형식이 달라 샷카운트만으로 자동 구현기능을 만들 수 없음.
     */
    this.shotCount = 1

    /**
     * 실제 공격력 반영 배율: 기본값 1
     * 일부 무기는 밸런스 특성상 공격력 반영 비율이 높거나 낮을 수 있음.
     * 
     * 참고: 최종 공격력은 소수점 버림하여 계산합니다.
     */
    this.attackMultiple = 1

    /**
     * 무기에 따른 공격횟수 (발사 횟수랑 다르고, 무기 객체가 공격하는 횟수임.)
     * (명시적인 수치이나, 제작자의 실수로 로직과 다른 값이 명시될 수 있음.)
     * 
     * 지금은 왠만하면 무기 객체를 직접 참고하기 때문에, 해당하는 실수는 가능성이 낮음.
     */
    this.attackCount = 1

    /** 
     * 추가로 입력할 옵션. 일부 무기는 옵션을 넣을 수 있기 때문에 이 값이 필요.  
     * 
     * 이 값은 배열 순회를 하며, 한개의 값을 입력하면 여러개의 샷이 그 한개의 옵션만 적용한 상태가 됩니다.
     * @type {any[]}
     */
    this.option = []

    /** 
     * 추가로 입력할 위치(상대값), 무기를 특정 위치에 발사하고 싶을 때 사용
     * 
     * 이 값은 배열 순회를 하며, 한개의 값을 입력하면 여러개의 샷이 한개의 위치로만 발사됩니다.
     * 
     * 아무것도 입력되지 않으면, 기본적으로 위에서 아래로 배치됩니다.
     * @type {{x: number, y: number}[]}
     */
    this.position = []

    /**
     * 해당하는 무기의 idList 각 idList마다 교차적으로 반복하면서 사용
     * @type {number[]}
     */
    this.weaponIdList = []

    /**
     * 각 샷별로, 공격력 배율을 다르게 하고 싶다면, 이 배열에 값을 입력하세요. 아무것도 없다면 1로 간주합니다.
     * 
     * 이 값은 각 배열마다 교차적으로 반복하면서 사용됨.
     * @type {number[]}
     */
    this.shotMultiple = []
  }

  /**
   * 무기 생성 함수: 이 로직에서만 무기를 생성해 주세요.
   * 그리고 무기 생성은 fieldState.createWeaponObject 함수를 사용합니다.
   * 경고: 이 함수를 한번 사용했을 때 attackMultiple만큼 공격력을 가진 무기 객체가 발사되어야 합니다.
   * 즉 create함수가 무기를 1개 생성한다면, 생성한 무기의 공격력의 %는 100%가 되어야 합니다.
   * 
   * 참고: 이 함수는 더이상 재구성할 필요가 없습니다. 무기 발사에 대한 변수를 넣고 싶다면
   * insertOption, position 변수를 변경해주세요.
   *
   * @param {number} attack 플레이어의 공격력
   * @param {number} x x좌표
   * @param {number} y y좌표
   */
  create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack)
    for (let i = 0; i < this.shotCount; i++) {
      let insertX = 0
      let insertY = 0
      const currentShotAttack = this.shotMultiple.length === 0 ? shotAttack : Math.floor(shotAttack * this.shotMultiple[i % this.shotMultiple.length])

      if (this.position.length >= 1) {
        insertX = this.position[i % this.position.length].x
        insertY = this.position[i % this.position.length].y
      } else {
        insertY = Math.floor((-100 / 2) + (100 / this.shotCount * i))
      }

      let option = null
      if (this.option.length >= 1) {
        option = this.option[i % this.option.length]
      }

      let selectId = this.weaponIdList[i % this.weaponIdList.length]
      fieldState.createWeaponObject(selectId, x + insertX, y + insertY, currentShotAttack, option)
    }
  }

  /** 
   * 해당 무기에서 사용하는 새로운 무기를 추가합니다. 
   * 
   * 해당 함수는 반드시 실행해야 합니다.
   * @param {number} playerWeaponId 무기의 ID (ID 클래스 참고)
   */
  setAutoPlayerWeapon (playerWeaponId) {
    this.playerWeaponId = playerWeaponId

    let stat = dataExportStatPlayerWeapon.get(playerWeaponId)

    
    if (stat != null) {
      this.delay = stat.delay
      this.shotCount = stat.shotCount
      this.attackCount = stat.attackCount
      this.attackMultiple = stat.attackMultiple
      this.weaponIdList = stat.weaponIdList

      /** 
       * 첫번째 무기는 무기의 기본 객체로 지정됩니다.
       * @type {WeaponData} 
       */
      this.weapon = dataExportWeapon.get(stat.weaponIdList[0])
    }
  }

  /**
   * 무기가 발사될 새 위치 삽입 - 자세한건 position 변수 설명 참고
   * @param {number} x x좌표
   * @param {number} y 좌표
   */
  insertPosition (x, y) {
    this.position.push({x, y})
  }

  /**
   * 플레이어의 공격력을 기준으로 각 샷 공격력을 계산하는 함수
   * 일반적인 경우는, 모든 샷의 공격력이 동일하지만, 일부 무기는 아닐 수도 있으며,
   * 이 경우 다른 방식으로 밸런스에 맞춰 계산해야 합니다.
   * @param {number} baseAttack 기준 공격력
   * @param {number} multiple 배율 (최종 공격력의 배율)
   */
  getShotAttack (baseAttack, multiple = 1) {
    const secondPerCount = 60 / this.delay
    const totalDivied = this.shotCount * this.attackCount
    const totalMultiple = this.attackMultiple * multiple
    const resultAttack = (baseAttack * totalMultiple) / (secondPerCount * totalDivied)
    return Math.floor(resultAttack)
  }

  /**
   * 무기 데이터를 얻습니다. export된 데이터는 기본적으로 클래스형이기 때문에, 
   * 인스턴스를 생성시키기 위해서 이런 함수를 사용했습니다.
   * @param {number} id ID 클래스가 가진 상수 번호 
   * @returns {WeaponData}
   */
  static getWeaponData (id) {
    let getClass = dataExportWeapon.get(id)
    return new getClass()
  }
}

/** 멀티샷: 기본 스타일 복합 무기 */
class PlayerMultyshot extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.multyshot)
    this.option = [null, null, -3, 3, 'chase', 'chase']
    this.position = [{x: 0, y: 10}, {x: 0, y: -10}, {x: 0, y: -5}, {x: 0, y: 5}, {x: -15, y: -15}, {x: -15, y: 15}]
  }
}

/** 미사일: 스플래시 연타 공격 */
class PlayerMissile extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.missile)
    // 편의상 weaponListID를 다시 이렇게 변경했습니다.
    let setIdList = [
      this.weaponIdList[0],
      this.weaponIdList[0],
      this.weaponIdList[1],
      this.weaponIdList[1]
    ]
    this.weaponIdList = setIdList

    this.option = [null, null, -2, 2]
    this.position = [{x: 0, y: -5}, {x: 0, y: 5}, {x: 10, y: -5}, {x: 10, y: 5}]
  }
}

/**
 * 애로우: 벽 튕기기(화면 크기 기준)
 */
class PlayerArrow extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.arrow)
    this.position = [{x: 0, y: -10}, {x: 0, y: -10}]
    this.option = [5, -5]
  }
}

/**
 * 레이저: 관통(다만, 최대 횟수 이상은 공격 불가능)
 */
class PlayerLaser extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.laser)
    
    // 편의상 id 구조를 변경
    let setId = [
      this.weaponIdList[0],
      this.weaponIdList[0],
      this.weaponIdList[1],
      this.weaponIdList[1]
    ]
    this.weaponIdList = setId
  }

  create (attack = 0, x = 0, y = 0) {
    // 레이저는 매 공격마다 위치가 변경되기 때문에, 어쩔 수 없이 create 함수를 재정의 하였습니다.
    const randomY1 = -20 + (Math.random() * 40)
    const randomY2 = -20 + (Math.random() * 40)
    this.position = [{x: 0, y: randomY1 + 10}, {x: 0, y: randomY2 - 10}, {x: 0, y: randomY1 + 10}, {x: 0, y: randomY2 - 10}]
    super.create(attack, x, y)
  }
}

/** 사피아: 추적 */
class PlayerSapia extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.sapia)
  }

  create (attack = 0, x = 0, y = 0) {
    // 사피아(30%) + 시파이샷(70%) 의 조합이기 때문에 이 함수에서 공격력을 다시 계산합니다.
    let mainAttack = Math.floor(attack * 0.7)

    // 사피아샷은 0.3배율을 가지는데, 이 값이 shotAttack값의 영향을 받음
    let sapiaShotAttack = this.getShotAttack(attack, 0.3) 
    this.option = [sapiaShotAttack]
    super.create(mainAttack, x, y)
  }
}

/** 파라포: 충격파(스플래시랑 거의 비슷) */
class PlayerParapo extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.parapo)
  }
}

/** 블래스터: 높은 공격계수를 가진 복합 무기 */
class PlayerBlaster extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.blaster)
    this.position = [{x: 0, y: -18}, {x: 0, y: 0}]
    this.shotMultiple = [1.2, 0.8]
  }
}

/** 사이드웨이브: 퍼지는 형태(넓은 범위?) */
class PlayerSidewave extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.sidewave)
    this.option = ['right 4', 'right 3', 'right 2', 'right -2', 'right -3', 'right -4', 'left 3', 'left -3']
    this.position = [{x: 0, y: 12 - 30}, {x: 0, y: 8 - 30}, {x: 0, y: 4 - 30}, {x: 0, y: -4 - 30},
     {x: 0, y: -8 - 30}, {x: 0, y: -12 - 30}, {x: 0, y: + 4}, {x: 0, y: -4 - 30}]
  }
}

class PlayerRapid extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.rapid)
    this.position = [{x: 0, y: -11}, {x: 0, y: 0}, {x: 0, y: + 11}]
  }
}

class PlayerRing extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.ring)
    this.option = ['up', 'down', 'left', 'leftdown', 'leftup', 'right', 'rightdown', 'rightup']
  }
}

class PlayerSeondanil extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.seondanil)
  }
}

class PlayerBoomerang extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.boomerang)
  }
}

class PlayerSubMultyshot extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.subMultyshot)
    this.position = [{x: 0, y: 10}, {x: 0, y: -10}]
  }
}

/**
 * 플레이어 스킬 데이터
 */
export class PlayerSkillData {
  constructor () {
    /**
     * 스킬의 공격력 배율 (기본값 1)
     * 이 배율이 높을수록 해당 스킬은 더 높은 데미지를 줄 수 있음.
     */
    this.attackMultiple = 1

    /**
     * 스킬의 기준 공격력 배율 값 (값 변경 불가능)
     * 이 게임에서는 shotDamage(1) + subShotDamage(0.2) + skillDamage(0.8 * 4) = Total(4.4)의 구성이 기본입니다.
     * 대략적인 데미지 비율은, shot(약 23%) + skill(약 76%) 입니다.
     */
    this.BASE_MULTIPLE = 0.8

    /**
     * 스킬을 사용하고 스킬에 대한 무기 발사를 1회 반복할 때, 동시에 발사되는 개수
     */
    this.shotCount = 1

    /**
     * 스킬을 사용하고, 무기 발사를 반복하는 횟수
     */
    this.repeatCount = 1

    /**
     * 각 무기당 공격 횟수 (일부 무기는 적을 여러번 공격할 수 있음.)
     */
    this.attackCount = 1

    /**
     * 스킬의 쿨타임
     * 참고: 스킬들은 쿨타임 시간만큼의 초당 데미지를 수 초내에 주는 방식입니다.
     * 예를들어, 20초짜리 스킬은 20초분량의 데미지를 줍니다. 다만, 스킬 지속시간이 굉장히 짧으므로
     * 순간적으로 주는 데미지가 많습니다.
     * 스킬 시간과 쿨타임의 관계의 기준은 이렇습니다. (일부 무기는 예외)
     * 쿨타임: 20초, 24초, 25초, 28초, 30초
     * 유지시간: 2~3초, 3~4초, 3~4초, 4~5초, 4~5초
     */
    this.coolTime = 20

    /**
     * 스킬을 사용하고, 무기가 반복적으로 작업하기까지의 지연프레임
     */
    this.delay = 60

    /**
     * 스킬이 바로 나가는게 아니라, 대기 시간 이후에 나간다면, 이 값을 설정해주세요. 단위는 프레임입니다.
     * 1초 = 60프레임
     */
    this.beforeDelay = 0

    /**
     * 스킬 사용 사운드 (null일경우 아무 사운드도 없음)
     * @type {HTMLMediaElement | null}
     */
    this.useSound = null

    /**
     * 스킬을 사용한 후 한번 반복할 때 나오는 샷 사운드 (null일경우 아무 사운드도 없음)
     * @type {HTMLMediaElement | null}
     */
    this.shotSound = null

    /**
     * 해당 스킬에서 사용하는 무기의 idList 이 값이 없으면 무기는 발사되지 않습니다.
     * 
     * 배열 순회방식으로 교차하여 반복 (배열 개수가 2개라면, 2개를 번갈아가면서 발사한다는 뜻)
     * @type {number[]}
     */
    this.weaponIdList = []

    /** 
     * 추가로 입력할 옵션. 일부 무기는 옵션을 넣을 수 있기 때문에 이 값이 필요.  
     * 
     * 이 값은 배열 순회를 하며, 한개의 값을 입력하면 여러개의 샷이 그 한개의 옵션만 적용한 상태가 됩니다.
     * @type {any[]}
     */
     this.option = []

     /** 
      * 추가로 입력할 위치(상대값), 무기를 특정 위치에 발사하고 싶을 때 사용
      * 
      * 이 값은 배열 순회를 하며, 한개의 값을 입력하면 여러개의 샷이 한개의 위치로만 발사됩니다.
      * 
      * 아무것도 입력되지 않으면, 기본적으로 위에서 아래로 배치됩니다.
      * @type {{x: number, y: number}[]}
      */
     this.position = []

  }

  /**
   * 스킬을 사용할 때 무기를 생성하는 함수
   * @param {number} attack 플레이어의 공격력
   * @param {number} x 스킬의 x좌표
   * @param {number} y 스킬의 y좌표
   */
  create (attack, x, y) {
    this.shotSoundPlay()
    const shotAttack = this.getShotAttack(attack)
    for (let i = 0; i < this.shotCount; i++) {
      let insertX = 0
      let insertY = 0

      if (this.position.length >= 1) {
        insertX = this.position[i % this.position.length].x
        insertY = this.position[i % this.position.length].y
      } else {
        insertY = Math.floor((-100 / 2) + (100 / this.shotCount * i))
      }

      let option = null
      if (this.option.length >= 1) {
        option = this.option[i % this.option.length]
      }

      let selectId = this.weaponIdList[i % this.weaponIdList.length]
      fieldState.createWeaponObject(selectId, x + insertX, y + insertY, shotAttack, option)
    }
  }

  /**
   * 플레이어 스킬을 자동 설정합니다. (이 함수는 반드시 실행해야 합니다.)
   * @param {number} playerSkillId 플레이어스킬의 id
   */
  setAutoPlayerSkill(playerSkillId) {
    let stat = dataExportStatPlayerSkill.get(playerSkillId)

    if (stat != null) {
      this.coolTime = stat.coolTime
      this.attackCount = stat.hit
      this.attackMultiple = stat.multiple
      this.delay = stat.delay
      this.repeatCount = stat.repeat
      this.shotCount = stat.shot
      this.weaponIdList = stat.weaponIdList
    }
  }

  /**
   * 사운드 설정
   * @param {HTMLMediaElement | null} useSound 해당 스킬을 사용했을 때 나오는 사운드
   * @param {HTMLMediaElement | null} shotSound 해당 스킬을 사용한 후 무기가 발사될 때 나오는 사운드
   */
  setSound (useSound = null, shotSound = null) {
    this.useSound = useSound
    this.shotSound = shotSound
  }

  /**
   * 한 발당 샷의 공격력을 얻습니다. 공격력 계산의 최종 결과값은 소수점 버림
   * 참고: 무기랑 공격 계산식이 약간 다릅니다.(자세한건 코드 주석 참고)
   * @param {number} baseAttack 유저의 공격력
   * @param {number} multiple 무기 공격이 여러종류가 합쳐질때, 배율 비중을 나눠주기 위해 사용하는 변수
   * @returns
   */
  getShotAttack (baseAttack, multiple = 1) {
    // 기본 공식 (최종 결과값은 소수점 버림)
    // 최종 공격력 = (유저 공격력 / (샷 횟수 * 반복 횟수)) * (공격력 배율 * 쿨타임 * 기본 배율 0.8)
    // totalDivied = 샷 횟수 * 반복횟수 // 유저 공격력을 나눠야 하는 값
    // totalMultiple = 공격배율 * 배율 * 기본배율 * 쿨타임 // 총 배율 값입니다.
    // resultAttack = (유저 공격력 * 총 배율) / 나누는 값

    const totalDivied = this.shotCount * this.repeatCount * this.attackCount
    const totalMultiple = this.attackMultiple * multiple * this.BASE_MULTIPLE * this.coolTime
    const resultAttack = (baseAttack * totalMultiple) / totalDivied
    return Math.floor(resultAttack)
  }

  /**
   * 스킬을 사용할 때 나오는 사운드
   */
  useSoundPlay () {
    if (this.useSound) {
      soundSystem.play(this.useSound)
    }
  }

  /**
   * 스킬의 무기를 발사할 때 나오는 사운드
   */
  shotSoundPlay () {
    if (this.shotSound) {
      soundSystem.play(this.shotSound)
    }
  }

  /**
   * 쿨타임을 프레임단위로 변환해 리턴(coolTime은 초 단위이므로, frame단위로 변환해줘야 할 때 이 함수슬 쓰세요.)
   */
  getCoolTimeFrame () {
    return this.coolTime * 60
  }

  /**
   * 무기 데이터를 가져옵니다. 
   * 이것은 export된 스킬 데이터가 클래스형이기 때문에, 인스턴스를 간편하게 만들기 위해 사용하는 함수입니다.
   * @param {number} id ID 클래스가 가지고 있는 상수
   * @returns {WeaponData}
   */
  static getWeaponData (id) {
    let getClass = dataExportWeapon.get(id)
    return new getClass()
  }
}

/** 스킬 멀티샷: 다수 추적 샷 발사 */
class PlayerSkillMultyshot extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.multyshot)
    this.setSound(soundSrc.skill.skillMultyshotUse, soundSrc.skill.skillMultyshotShot)
    this.beforeDelay = 30
  }
}

/** 스킬 미사일: 추적 스플래시 연타 공격 */
class PlayerSkillMissile extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.missile)
    this.setSound(null, soundSrc.skill.skillMissileShot)
  }
}

/** 스킬 애로우: 벽 튕기기 강화 */
class PlayerSkillArrow extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.arrow)
    this.option = [7, -7]
    this.setSound(null, soundSrc.skill.skillArrowShot)
  }
}

/** 스킬 레이저: 넓은 범위의 지속적인 관통 공격 */
class PlayerSkillLaser extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.laser)
    this.setSound(null, soundSrc.skill.skillLaserShot)
  }
}

/** 스킬 사피아: 추적범위가 넓어지고 동시에 스플래시 공격(다만 타격 최대 수는 낮음) */
class PlayerSkillSapia extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.sapia)
    this.setSound(soundSrc.skill.skillSapiaWeapon, null)
  }
}

/**
 * 스킬 파라포: 강력한 충격파
 */
class PlayerSkillParapo extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.parapo)
  }
}

/**
 * 스킬 블래스터: 순간적인 많은 데미지
 */
class PlayerSkillBlaster extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.blaster)
    this.setSound(null, soundSrc.skill.skillBlasterShot)
  }
}

/**
 * 스킬 사이드웨이브: 사이드웨이브 무기의 강화
 */
class PlayerSkillSidewave extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.sidewave)
    this.option = [-7, 0, 7]
    this.position = [{x: 0, y: -70}]
    this.setSound(null, soundSrc.skill.skillSidewaveShot)
  }
}

class PlayerSkillSword extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.sword)
    this.setSound(null, soundSrc.skill.skillSword)
  }
}

class PlayerSkillHyperBall extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.hyperBall)
    this.setSound(null, soundSrc.skill.skillHyperBall)
    this.position = [{x: 0, y: -50}, {x: 0, y: 50}]
  }
}

class PlayerSkillCriticalChaser extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.critcalChaser)
    this.setSound(null, soundSrc.skill.skillCriticalChaser)
    this.position = [{x: -30, y: -30}, {x: 30, y: 30}]
  }
}

class PlayerSkillPileBunker extends PlayerSkillData { 
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.pileBunker)
    this.setSound(null, soundSrc.skill.skillPileBunker)
  }
}

class PlayerSkillSantansu extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.santansu)
    this.option = [0, 1, 2, 3, 4]
  }
}

class PlayerSkillWhiteflash extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.whiteflash)
    this.setSound(soundSrc.skill.skillWhiteflash, null)
  }
}

class PlayerSkillRapid extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.rapid)
    this.setSound(null, soundSrc.skill.skillRapid)
    this.position = [{x: 0, y: -15}, {x: 0, y: -5}, {x: 0, y: 5}, {x: 0, y: 15}]
  }
}

class PlayerSkillRing extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.ring)
    this.setSound(null, soundSrc.skill.skillRing)
    this.option = ['left', 'leftdown', 'leftup', 'right', 'rightdown', 'rightup', 'up', 'down']
  }
}

class PlayerSkillSeondanil extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.seondanil)
    this.setSound(soundSrc.skill.skillSeondanil, null)
  }
}

class PlayerSkillHanjumeok extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.hanjumoek)
    this.setSound(soundSrc.skill.skillHanjumeok, null)
  }
}

class PlayerSkillBoomerang extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.boomerang)
    this.setSound(soundSrc.skill.skillBoomerang, null)
    this.option = [{x: 0, y: -240}, {x: 0, y: -60}, {x: 0, y: 180}]
  }
}

class PlayerSkillMoon extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.moon)
    this.setSound(soundSrc.skill.skillMoon, null)
  }
}



/**
 * 플레이어 무기 엑스포트 (data.js에서 사용)
 */
export const dataExportPlayerWeapon = new Map()
dataExportPlayerWeapon.set(ID.playerWeapon.multyshot, PlayerMultyshot)
dataExportPlayerWeapon.set(ID.playerWeapon.missile, PlayerMissile)
dataExportPlayerWeapon.set(ID.playerWeapon.arrow, PlayerArrow)
dataExportPlayerWeapon.set(ID.playerWeapon.sapia, PlayerSapia)
dataExportPlayerWeapon.set(ID.playerWeapon.laser, PlayerLaser)
dataExportPlayerWeapon.set(ID.playerWeapon.blaster, PlayerBlaster)
dataExportPlayerWeapon.set(ID.playerWeapon.parapo, PlayerParapo)
dataExportPlayerWeapon.set(ID.playerWeapon.sidewave, PlayerSidewave)
dataExportPlayerWeapon.set(ID.playerWeapon.subMultyshot, PlayerSubMultyshot)
dataExportPlayerWeapon.set(ID.playerWeapon.rapid, PlayerRapid)
dataExportPlayerWeapon.set(ID.playerWeapon.ring, PlayerRing)
dataExportPlayerWeapon.set(ID.playerWeapon.seondanil, PlayerSeondanil)
dataExportPlayerWeapon.set(ID.playerWeapon.boomerang, PlayerBoomerang)


/**
 * 플레이어 스킬 엑스포트 (data.js에서 사용)
 */
export const dataExportPlayerSkill = new Map()
dataExportPlayerSkill.set(ID.playerSkill.arrow, PlayerSkillArrow)
dataExportPlayerSkill.set(ID.playerSkill.blaster, PlayerSkillBlaster)
dataExportPlayerSkill.set(ID.playerSkill.laser, PlayerSkillLaser)
dataExportPlayerSkill.set(ID.playerSkill.missile, PlayerSkillMissile)
dataExportPlayerSkill.set(ID.playerSkill.multyshot, PlayerSkillMultyshot)
dataExportPlayerSkill.set(ID.playerSkill.parapo, PlayerSkillParapo)
dataExportPlayerSkill.set(ID.playerSkill.sapia, PlayerSkillSapia)
dataExportPlayerSkill.set(ID.playerSkill.sidewave, PlayerSkillSidewave)
dataExportPlayerSkill.set(ID.playerSkill.sword, PlayerSkillSword)
dataExportPlayerSkill.set(ID.playerSkill.hyperBall, PlayerSkillHyperBall)
dataExportPlayerSkill.set(ID.playerSkill.critcalChaser, PlayerSkillCriticalChaser)
dataExportPlayerSkill.set(ID.playerSkill.pileBunker, PlayerSkillPileBunker)
dataExportPlayerSkill.set(ID.playerSkill.santansu, PlayerSkillSantansu)
dataExportPlayerSkill.set(ID.playerSkill.whiteflash, PlayerSkillWhiteflash)
dataExportPlayerSkill.set(ID.playerSkill.rapid, PlayerSkillRapid)
dataExportPlayerSkill.set(ID.playerSkill.ring, PlayerSkillRing)
dataExportPlayerSkill.set(ID.playerSkill.seondanil, PlayerSkillSeondanil)
dataExportPlayerSkill.set(ID.playerSkill.hanjumoek, PlayerSkillHanjumeok)
dataExportPlayerSkill.set(ID.playerSkill.boomerang, PlayerSkillBoomerang)
dataExportPlayerSkill.set(ID.playerSkill.moon, PlayerSkillMoon)