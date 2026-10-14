//@ts-check

import { ID } from "./dataId.js"
import { dataExportStatPlayerSkill, dataExportStatPlayerWeapon } from "./dataStat.js"
import { dataExportWeapon, WeaponData } from "./dataWeapon.js"
import { soundSrc } from "./soundSrc.js"
import { game, userSystem } from "./game.js"
import { DelayData, EnimationData, FieldData } from "./dataField.js"
import { imageDataInfo, imageSrc } from "./imageSrc.js"
import { tamshooter4Data } from "./data.js"

let soundSystem = game.sound
let graphicSystem = game.graphic

/**
 * 필드 생성 객체 표준 함수  
 * 이 함수의 매개 변수 형태는 Field.js에서 사용합니다.
 * @callback CreateWeaponFieldObjectCallback
 * @param {number} selectId
 * @param {number} [x = 0]
 * @param {number} [y = 0]
 * @param {number} [shotAttack = 1]
 * @param {number} [option = 0] 옵션: 기본값 존재
 */

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
     * (모든 무기는 1회 발사한다고 가정됨)
     * 
     * 무기에 따른 공격횟수 (발사 횟수랑 다르고, 무기 객체가 공격하는 횟수임.)
     * (명시적인 수치이나, 제작자의 실수로 로직과 다른 값이 명시될 수 있음.)
     * 
     * 지금은 왠만하면 무기 객체를 직접 참고하기 때문에, 해당하는 실수는 가능성이 낮음.
     * 
     * @deprecated 
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
      this.createFieldObject(selectId, x + insertX, y + insertY, currentShotAttack, option)
    }
  }


  /** 무기를 필드에 생성시켜주는 역할을 하는 핸들러 함수입니다.
   * 생성 함수를 주입하기 전 까지 사용할 수 없습니다.
   * @type {CreateWeaponFieldObjectCallback} */
  createFieldObject() {
    throw new Error('이 함수는 필드 시스템에서 함수를 주입받기 전 까지 사용할 수 없습니다!');
  }

  /** 필드의 생성 함수를 이 핸들러에 주입시켜주세요
   *  @param {CreateWeaponFieldObjectCallback} fn */
  setCreateHandler(fn) {
    this.createFieldObject = fn;
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
    if (stat == null) return
    
    this.delay = stat.delay
    this.shotCount = stat.shotCount
    this.attackMultiple = stat.attackMultiple
    this.weaponIdList = stat.weaponIdList

    const wepaonData = dataExportWeapon.get(stat.weaponIdList[0])
    if (wepaonData == null) return

    /** 
     * 첫번째 무기는 무기의 기본 객체로 지정됩니다.
     * @type {WeaponData} 
     */
    this.weapon = new wepaonData()
    this.weapon.id = stat.weaponIdList[0] // 무기의 id 입력
    this.weapon.inputStat() // 무기에 해당하는 스탯 입력
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
    let repeatCount = this.weapon != null ? this.weapon.repeatCount : 1
    if (repeatCount <= 0) repeatCount = 1 // 0 나누기 금지 

    const secondPerCount = 60 / this.delay
    const totalDivied = this.shotCount * this.attackCount * repeatCount
    const totalMultiple = this.attackMultiple * multiple
    const resultAttack = (baseAttack * totalMultiple) / (secondPerCount * totalDivied)
    return Math.floor(resultAttack)
  }
}

/** 멀티샷: 기본 스타일 복합 무기 */
class PlayerMultyshot extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.multyshot)
    this.option = [0, 1, 2, 3, 4, 5]
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

    // -1은 다른 타입이 옵션을 사용하기 때문에 구분을 위해 넣은 값이며 숫자 자체에는 의미가 없습니다.
    this.option = [-1, -1, 0, 1]
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
    this.option = [0, 1]
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
    this.option = [0, 1, 2, 3, 4, 5, 6, 7]
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
    this.option = [0, 1, 2, 3, 4, 5, 6, 7]
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

class PlayerKalnal extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.kalnal)
  }
}

class PlayerCogwheel extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.cogwheel)
  }
}

class PlayerYeonsai extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.yeonsai)
    this.option = [0, 1, 2, 3, 4, 5]
    this.position = [{x: -40, y: -20}, {x: -40, y: 0}, {x: -40, y: 20}, {x: -20, y: -20}, {x: -20, y: 0}, {x: -20, y: 20}]
  }
}

class PlayerSabangtan extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.sabangtan)
    this.option = [0, 1, 2, 3]
    this.position = [{x: -10, y: -20}, {x: -10, y: -20}, {x: -10, y: -20}, {x: -10, y: -20}]
  }
}

class PlayerR3_towerPink extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.r3TowerPink)
  }
}

class PlayerR3_towerPurple extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.r3TowerPurple)
  }
}

class PlayerR3_towerHelljeon extends PlayerWeaponData {
  constructor () {
    super()
    this.setAutoPlayerWeapon(ID.playerWeapon.r3Helljeon)
    this.option = [1, 0, 0, 1] // 0번 노멀, 1번 유도
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
     * @type {string | null}
     */
    this.useSound = null

    /**
     * 스킬을 사용한 후 한번 반복할 때 나오는 샷 사운드 (null일경우 아무 사운드도 없음)
     * @type {string | null}
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
      this.createFieldObject(selectId, x + insertX, y + insertY, shotAttack, option)
    }
  }

  /** 무기를 필드에 생성시켜주는 역할을 하는 핸들러 함수입니다.
   * 생성 함수를 주입하기 전 까지 사용할 수 없습니다.
   * @type {CreateWeaponFieldObjectCallback} */
  createFieldObject() {
    throw new Error('이 함수는 필드 시스템에서 함수를 주입받기 전 까지 사용할 수 없습니다!');
  }

  /** 필드의 생성 함수를 이 핸들러에 주입시켜주세요
   *  @param {CreateWeaponFieldObjectCallback} fn */
  setCreateHandler(fn) {
    this.createFieldObject = fn;
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
   * @param {null | string} useSound 해당 스킬을 사용했을 때 나오는 사운드
   * @param {null | string} shotSound 해당 스킬을 사용한 후 무기가 발사될 때 나오는 사운드
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
    const totalMultiple = this.attackMultiple * multiple * this.coolTime
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
    this.option = [0, 1]
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
    this.option = [0, 1, 2]
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
    this.option = [0, 1, 2, 3, 4, 5, 6, 7]
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
    this.option = [{x: 0, y: -300}, {x: 0, y: -100}, {x: 0, y: 200}]
  }
}

class PlayerSkillMoon extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.moon)
    this.setSound(soundSrc.skill.skillMoon, null)
  }
}

class PlayerSkillKalnal extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.kalnal)
    this.setSound('', soundSrc.skill.skillKalnal)
  }
}

class PlayerSkillCogwheel extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.cogwheel)
    this.setSound(soundSrc.skill.skillCogwheel, '')
    this.position = [{x: 0, y: -200}]
  }
}

class PlayerSkillYeonsai extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.yeonsai)
    this.setSound('', soundSrc.skill.skillYeonsai)
    this.option = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    this.position = [{x: 20, y: -40}, {x: 20, y: -20}, {x: 20, y: 0}, {x: 20, y: 20}, {x: 20, y: 40}, 
      {x: -80, y: -40}, {x: -80, y: -20}, {x: -80, y: 0}, {x: -80, y: 20}, {x: -80, y: 40}]
  }
}

class PlayerSkillSabangtan extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.sabangtan)
    this.setSound('', soundSrc.skill.skillSabangtanShot)
    this.option = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]
  }
}

class PlayerSkillHabirant extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.habirant)
    this.setSound(soundSrc.skill.skillHabirant, '')
  }
}

class PlayerSkillIcechaser extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.icechaser)
    this.setSound('', soundSrc.skill.skillIceChaser)
  }
}

class PlayerSkillCalibur extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.calibur)
    this.setSound(soundSrc.skill.skillCalibur, '')
  }
}

class PlayerSkillSujikpa extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.sujikpa)
    this.setSound('', soundSrc.skill.skillSujikpa)
  }
}

class PlayerSkillSpeaker extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.speaker)
  }
}

class PlayerSkillEomukggochi extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.eomukggochi)
    this.position = [{x: 0, y: 15}]
  }
}

class PlayerSkillR2Firecracker extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.r2Firecracker)
  }
}

class PlayerSkillR2Toyhammer extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.r2Toyhammer)
  }
}

class PlayerSkillR3Xkill extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.r3Xkill)
  }
}

class PlayerSkillR3Xshot extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.r3Xshot)
  }
}

class PlayerSkillR3Xbeam extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.r3Xbeam)
  }
}

class PlayerSkillR3Xboom extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.r3Xboom)
  }
}

class PlayerSkillR3Helljeon extends PlayerSkillData {
  constructor () {
    super()
    this.setAutoPlayerSkill(ID.playerSkill.r3Helljeon)
    this.setSound('', soundSrc.skill.skillHelljeonShot)
    this.position = [{x: 0, y: -20}, {x: 0, y: 20}]
  }
}


/**
 * 플레이어 오브젝트
 * 플레이어를 직접 조종합니다.
 * 이 객체는 필드 상태에서 직접 생성해 만드는 객체이기 때문에 data.js에서 플레이어 데이터를 받아오지 않습니다.
 */
export class PlayerObject extends FieldData {
  /** 플레이어 이미지 (필드시스템에서 참조됨) */ playerImage = imageSrc.system.fieldSystem
  playerImageData = imageDataInfo.fieldSystem.player
  playerDamageEnimation = EnimationData.createEnimation(imageSrc.system.fieldSystem, imageDataInfo.fieldSystem.playerDamageEffect, 2, -1)
  playerLevelupEnimation = EnimationData.createEnimation(imageSrc.system.fieldSystem, imageDataInfo.fieldSystem.playerLevelupEffect, 3, -1)
  playerDieEnimation = EnimationData.createEnimation(imageSrc.system.fieldSystem, imageDataInfo.fieldSystem.playerDieEffect, 1, -1)

  /**
   * @typedef {{skill: PlayerSkillData | null, id: number, coolTimeFrame: number, repeatCount: number, delayCount: number}} SkillSlot 플레이어가 사용하는 스킬 슬롯의 오브젝트 구조
   * @typedef {{weapon: PlayerWeaponData | null, id: number, delayCount: number}} WeaponSlot 무기 슬롯 (총 5개가 있으며, 0 ~3번 슬롯은 유저가 정한 무기를 사용하고, 4번 슬롯은 무기를 사용하지 않는 슬롯입니다.)
   */

  constructor () {
    super() // 'player', 0, 300, 200
    this.objectType = FieldData.objectType.PLAYER
    this.width = this.playerImageData.width
    this.height = this.playerImageData.height
    this.playerDieEnimation.setOutputSize(this.width * 2, this.height * 2)

    // 플레이어 전용 변수
    // 일부 변수의 설명은 init 부분에 적혀있습니다. (참고: init함수는 다른 이름으로도 (initSkill, initWeapon등...) 여러개 있음.)
    this.shield = 0
    this.shieldMax = 0
    /** 쉴드 회복 기준값 */ this.shieldRecovery = 0
    /** 쉴드 회복값의 현재값 */ this.shieldRecoveryCurrentValue = 0
    this.attackDelay = new DelayData(0)
    this.attackDelayCount = 0
    this.debug = false
    this.dieAfterDelayCount = 0

    /** 플레이어가 해당 라운드를 플레이할 때 사용하는 기준 공격력 (이 값은 내부적인 연산이 포함되어 있으므로, set함수를 사용해서 수정해야함) */
    this.attack = 0

    /** 데미지 감소 비율 (아직은 사용하지 않음. ) */
    this.damageReduce = 0

    this.damageEnimationCount = 0
    this.levelupEnimationCount = 0
    this.currentLevel = 0

    this.weaponSlotNumber = 0

    this.autoMoveFrame = 0
    this.autoMoveX = 0
    this.autoMoveY = 0

    /** 무기의 기준 공격력 */ this.attackWaepon = 0
    /** 스킬의 기준 공격력 */ this.attackSkill = 0

    /** 기준 이동속도 값 */ this.BASE_SPEED = 8

    /** @type {SkillSlot[]} */ this.skillSlotA = []
    /** @type {SkillSlot[]} */ this.skillSlotB = []
    /** @type {WeaponSlot[]} */ this.weaponSlot = []
  }

  /**
   * 플레이어 정보 초기화 함수:
   * 주의! 이 함수는 constructor 내부에서 사용할 수 없습니다.
   * 왜냐하면 playerObject 데이터를 초기화 하지 않은 상태에서 불러오면 오류가 발생하기 때문입니다.
   * 따라서, 이 함수는 보통 roundStart에서 호출합니다.
   */
  init () {
    this.attackDelay.count = 0
    this.attackDelayCount = 0
    this.debug = false
    this.dieAfterDelayCount = 0
    this.isDied = false
    this.moveSpeedX = 0
    this.moveSpeedY = 0
    this.autoMoveFrame = 0
    this.autoMoveX = 0
    this.autoMoveY = 0

    this.x = 300
    this.y = 200
    this.centerX = this.x + (this.width / 2)
    this.centerY = this.y + (this.height / 2)

    this.damageEnimationCount = 0
    this.levelupEnimationCount = 0

    const getData = userSystem.getPlayerObjectStat()
    this.currentLevel = getData.lv
    this.attack = getData.attack
    this.attackWaepon = userSystem.getAttackWeaponValue()
    this.attackSkill = userSystem.getAttackSkillValue()
    this.hp = getData.hp
    this.hpMax = getData.hpMax
    this.shield = getData.shield
    this.shieldMax = getData.shieldMax
    this.shieldRecovery = getData.shieldRecovery
    
    this.initSkill()
    this.initWeapon()

    /** 이동 가능 여부 (false일경우 조작 불가 - 적이나 라운드에서 사용할 수도 있음) 
     * 하지만 해제하지 못하면 영원히 이동할 수 없으므로 주의 바람.*/ 
    this.isMoveEnable = true

    /** 
     * 플레이어 자체 기능을 사용 불가상태로 처리
     * 
     * 이 경우, display/process도 되지 않으며, 다른 종류의 개체에서 플레이어를 인식하여도
     * 플레이어 개체는 영향을 받지 않음.
     */
    this.disable = false
  }

  /**
   * 무기 객체 초기화 작업
   */
  initWeapon () {
    let userWapon = userSystem.getWeaponList()

    /**
     * @type {WeaponSlot[]}
     */
    this.weaponSlot = [
      {weapon: null, id: userWapon[0], delayCount: 0},
      {weapon: null, id: userWapon[1], delayCount: 0},
      {weapon: null, id: userWapon[2], delayCount: 0},
      {weapon: null, id: userWapon[3], delayCount: 0},
      {weapon: null, id: ID.playerWeapon.unused, delayCount: 0},
    ]

    /** 플레이어의 무기 슬롯 번호, 기본값은 0 */
    this.weaponSlotNumber = 0
    
    // 무기 슬롯 데이터 입력합니다.
    for (let i = 0; i < this.weaponSlot.length; i++) {
      this.weaponSlot[i].weapon = tamshooter4Data.getPlayerWeapon(this.weaponSlot[i].id)
    }
  }

  /**
   * 스킬 정보 초기화
   */
  initSkill () {
    /** 스킬 슬롯이 A인지 여부, 아닐경우 B로 처리 */ this.usingSkillSlotA = true
    let getUserSkill = userSystem.getSkillList()

    /**
     * 스킬의 대한 정보를 저장하는 데이터
     * 
     * 스킬은 A슬롯과 B슬롯이 있으며, 최대 한번에 4개까지만 사용 가능하고, 같은 슬롯에 있는 쿨타임은 공유 개념처럼 사용
     * @type {SkillSlot[]}
     */
    this.skillSlotA = [
      { skill: null, id: getUserSkill[0], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[1], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[2], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[3], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 }
    ]

    /**
     * @type {SkillSlot[]}
     */
    this.skillSlotB = [
      { skill: null, id: getUserSkill[4], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[5], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[6], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[7], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 }
    ]

    this.skillClassInput()
  }

  skillClassInput () {
    // 스킬 클래스 등록 (한번에 A, B 슬롯 두개를 등록하는건 귀찮아서...)
    // 여기서는 널 체크를 하지 않습니다. (process에서만 널 체크 진행)
    for (let i = 0; i < this.skillSlotA.length; i++) {
      const getIdA = this.skillSlotA[i].id
      const getIdB = this.skillSlotB[i].id
      this.skillSlotA[i].skill = tamshooter4Data.getPlayerSkill(getIdA)
      this.skillSlotB[i].skill = tamshooter4Data.getPlayerSkill(getIdB)
    }
  }

  /**
   * 플레이어가 데미지를 받으면 사운드를 출력합니다.
   * @param {number} shieldDamageClac 쉴드 데미지
   * @param {number} hpDamageCalc 체력 데미지
   * @param {string} damageSoundSrc 기본 사운드 사용? 값이 false면 데미지 받아도 소리가 안남
   */
  damageSoundPlay (shieldDamageClac = 0, hpDamageCalc = 0, damageSoundSrc = '') {
    // 임의 사운드가 지정된 경우, 다른 사운드가 출력됨
    if (damageSoundSrc !== '') {
      game.sound.play(damageSoundSrc)
      return
    }

    // 데미지는 현재의 쉴드 상태에 따라 소리가 조금 달라짐, 소리의 기준은 쉴드 최대치값임
    // 쉴드가 감소할때 쉴드량의 6% 이하(200기준 12데미지), 
    // 6% 이상 12% 이하(200기준 24데미지), 12% 초과(200기준 24데미지 초과) 때마다 소리가 다름
    // 체력이 같이 감소한경우,
    // 4% 이하, 8% 이하 (8 ~ 16데미지), 8% 초과(17데미지) 으로만 구분됨

    const LOW_DAMAGE = Math.floor(this.shieldMax * 0.06)
    const MIDDLE_DAMAGE = Math.floor(this.shieldMax * 0.12)
    const HP_LOW_DAMAGE = Math.floor(this.shieldMax * 0.04)
    const HP_MIDDLE_DAMAGE = Math.floor(this.shieldMax * 0.08)

    if (hpDamageCalc >= 1) {
      if (hpDamageCalc <= HP_LOW_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamage)
      } else if (hpDamageCalc <= HP_MIDDLE_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamageBig)
      } else {
        game.sound.play(soundSrc.system.systemPlayerDamageDanger)
      }
    } else {
      if (shieldDamageClac <= LOW_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamage)
      } else if (shieldDamageClac <= MIDDLE_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamageBig)
      } else {
        game.sound.play(soundSrc.system.systemPlayerDamageDanger)
      }
    }
  }

  /**
   * 플레이어가 데미지를 받았을 때, 에니메이션을 출력합니다.
   * @param {number} shieldDamage 쉴드 데미지
   * @param {number} hpDamage 체력 데미지
   */
  damageEnimationSet (shieldDamage = 0, hpDamage = 0) {
    let damagePercent = (shieldDamage + hpDamage) / (this.hpMax + this.shieldMax) * 100
    let damageFrame = Math.floor(damagePercent * 12)
    if (damageFrame > 180) {
      damageFrame = 180
    } else if (damageFrame < 10) {
      damageFrame = 10
    }

    this.damageEnimationCount = damageFrame
    userSystem.setDamageWarningFrame(damageFrame)
  }

  /**
   * 플레이어가 받은 데미지를 추가합니다. (플레이어가 죽거나 데미지가 없으면 무효)
   * @param {number} damage 
   */
  addDamage (damage = 0) {
    if (this.isDied || damage === 0 || this.disable) return
    let result = this.damageCalcuration(damage)

    this.damageSoundPlay(result.shield, result.hp)
    this.damageEnimationSet(result.shield, result.hp)
  }

  /**
   * 플레이어가 받은 데미지를 추가하고 임의의 사운드를 같이 재생합니다. (플레이어가 죽거나 데미지가 없으면 무효)
   * @param {number} damage 데미지 값 (정수)
   * @param {string} soundSrc 사운드 경로
   */
  addDamageWithSound (damage, soundSrc) {
    if (this.isDied || damage === 0 || this.disable) return
    let result = this.damageCalcuration(damage)

    this.damageSoundPlay(result.shield, result.hp, soundSrc)
    this.damageEnimationSet(result.shield, result.hp)
  }

  /**
   * 플레이어가 받은 데미지를 연산함 그리고 총 받은 데미지를 리턴 
   * 
   * (이 함수를 사용하면 유저의 실제 shield와 hp가 변경됩니다.)
   * 
   * (이 함수는 외부에서 사용할 수 없음)
   * @param {number} damage 
   */
  damageCalcuration (damage) {
    // Gemini의 도움을 받아 코드 수정
    // 1. 쉴드가 흡수할 수 있는 데미지 계산 (현재 쉴드량과 총 데미지 중 작은 값)
    const shieldDamage = Math.min(this.shield, damage)
    
    // 2. 흡수하고 남은 데미지가 HP로 들어감
    const hpDamage = damage - shieldDamage;

    // 3. 상태 업데이트
    this.shield -= shieldDamage;
    this.hp -= hpDamage;

    // 총 데미지값 리턴
    return {
      hp: hpDamage,
      shield: shieldDamage
    }
  }

  process () {
    if (this.disable) return 

    if (!this.isDied) {
      this.processButton()
      this.processAttack()
      this.processSkill()
      this.processHpShield()
      this.processDamage()
      this.processLevelupCheck()
      this.processMove()
      this.processAutoMove()
    }
    this.processDie()
  }

  /** 플레이어가 레벨업을 했는지 확인 */
  processLevelupCheck () {
    if (this.currentLevel !== userSystem.lv) {
      this.currentLevel = userSystem.lv
      this.levelupEnimationCount = 120
    }

    if (this.levelupEnimationCount > 0) {
      this.levelupEnimationCount--
      this.playerLevelupEnimation.process()
    }
  }

  /** 플레이어가 죽었는지 확인 */
  processDie () {
    if (this.hp <= 0 && !this.isDied) {
      this.isDied = true
      game.sound.play(soundSrc.system.systemPlayerDie)
    }

    if (this.isDied) {
      this.playerDieEnimation.process()
      this.dieAfterDelayCount++
    }
  }

  /**
   * 스킬을 사용합니다.
   * @param {number} skillPosition 스킬의 위치(번호 0 ~ 3)
   */
  useSkill (skillPosition = 0) {
    // 스킬 슬롯에 따라 해당 스킬을 찾기
    let targetSkill = this.usingSkillSlotA ? this.skillSlotA[skillPosition] : this.skillSlotB[skillPosition]

    // 스킬 클래스(데이터)가 없으면 함수를 실행하지 않음.
    if (targetSkill.skill == null) return

    // 쿨타임 계산해서, 쿨타임이 남아있으면, 무시
    if (targetSkill.coolTimeFrame > 0) return

    // 스킬 사용
    // 스킬을 사용했을 때, 해당 스킬 만큼의 스킬 쿨타임이 증가합니다.
    // 그리고 같은 번호의 다른 슬롯도 동시에 공유됩니다.
    targetSkill.repeatCount += targetSkill.skill.repeatCount // 스킬 반복 횟수를 증가시켜 여러번 무기가 발사되게 처리
    
    this.skillSlotA[skillPosition].coolTimeFrame += targetSkill.skill.getCoolTimeFrame() // 쿨타임 추가 (단위가 프레임이므로, 쿨타임 시간에 60을 곱함)
    this.skillSlotB[skillPosition].coolTimeFrame += targetSkill.skill.getCoolTimeFrame() // 슬롯 B에도 마찬가지로 쿨타임 추가

    // 스킬에 사용된 무기가 즉시 발사되도록, 딜레이카운트를 채워줌(딜레이 이상이여야 무기 발사됨)
    // 다만 beforeDelay가 있을경우, 미리 delayCount에서 해당 수치만큼 감소
    targetSkill.delayCount += targetSkill.skill.delay - targetSkill.skill.beforeDelay

    // 스킬 사운드 출력
    targetSkill.skill.useSoundPlay()
  }

  processAutoMove () {
    if (this.autoMoveFrame >= 1) {
      this.autoMoveFrame--
      // 참고: 플레이어는 autoMoveFrame이 있는 동안은 조작을 통해 이동할 수 없지만, 
      // 예상 가능한 버그를 막기 위해서 isMoveEnable 설정을 하지 않습니다.

      this.x += (this.autoMoveX - this.x) / 10
      this.y += (this.autoMoveY - this.y) / 10
    }
  }

  processDamage () {
    if (this.damageEnimationCount > 0) {
      this.damageEnimationCount--
      this.playerDamageEnimation.process()
    }
  }

  /** hp와 쉴드를 처리함 (쉴드 회복도 여기서 처리) */
  processHpShield () {
    const SHIELD_RECOVERY_BASE_VALUE = 6000
    this.shieldRecoveryCurrentValue += this.shieldRecovery

    // 쉴드 회복 처리
    if (this.shieldRecoveryCurrentValue >= SHIELD_RECOVERY_BASE_VALUE) {
      this.shield++
      this.shieldRecoveryCurrentValue -= SHIELD_RECOVERY_BASE_VALUE
    }

    // 쉴드 최대치 초과 금지
    if (this.shield > this.shieldMax) {
      this.shield = this.shieldMax
    }
  }

  processSkill () {
    // 참고: null 체크는 processSkillLogic에서 검사합니다.

    for (let i = 0; i < this.skillSlotA.length; i++) {
      // 루프 i값에 따른 현재 스킬. 
      // 스킬슬롯 A를 사용중이면, A슬롯의 스킬을 가져옵니다., B슬롯이라면, B슬롯에 있는 스킬을 가져옵니다.
      this.processSkillLogic(this.skillSlotA[i])
    }

    for (let i = 0; i < this.skillSlotB.length; i++) {
      this.processSkillLogic(this.skillSlotB[i])
    }
  }

  /**
   * 
   * @param {SkillSlot} currentSkill
   */
  processSkillLogic (currentSkill) {
    // 해당 스킬에 대한 데이터가 없으면 무시
    if (currentSkill.skill == null) return

    if (currentSkill.coolTimeFrame > 0) { // 스킬 쿨타임이 0보다 클 때
      currentSkill.coolTimeFrame-- // 스킬 쿨타임프레임 감소
    }

    // 만약 스킬 반복횟수가 없다면, 스킬을 사용하지 않은것이므로 무시
    if (currentSkill.repeatCount <= 0) return
    if (currentSkill.skill == null) return // 스킬이 없다면 무시

    currentSkill.delayCount++ // 스킬 딜레이카운트 증가
    if (currentSkill.delayCount >= currentSkill.skill.delay) { // 딜레이카운트카 스킬 딜레이를 넘어가면 무기 생성
      currentSkill.skill.create(this.attackSkill, this.centerX, this.centerY)
      currentSkill.delayCount -= currentSkill.skill.delay // 스킬 딜레이카운트 감소
      currentSkill.repeatCount-- // 반복횟수 1회 감소
    }
  }

  processMove () {
    // 화면 영역에서 벗어나는거 금지
    if (this.x < 0) this.x = 0
    if (this.x > game.graphic.CANVAS_WIDTH - this.width) this.x = game.graphic.CANVAS_WIDTH - this.width
    if (this.y < 0) this.y = 0
    if (this.y > game.graphic.CANVAS_HEIGHT - this.height) this.y = game.graphic.CANVAS_HEIGHT - this.height

    // 이동 가능하거나, autoMoveFrame이 없을 때만 이동 가능합니다.
    if (!this.isMoveEnable || this.autoMoveFrame > 0) return

    super.processMove()
  }

  processButton () {
    // 버튼의 목록
    const buttonLeft = game.control.getButtonDown(game.control.buttonIndex.LEFT)
    const buttonRight = game.control.getButtonDown(game.control.buttonIndex.RIGHT)
    const buttonUp = game.control.getButtonDown(game.control.buttonIndex.UP)
    const buttonDown = game.control.getButtonDown(game.control.buttonIndex.DOWN)
    const buttonA = game.control.getButtonInput(game.control.buttonIndex.A)
    const buttonB = game.control.getButtonInput(game.control.buttonIndex.B)
    const buttonSkill0 = game.control.getButtonInput(game.control.buttonIndex.L1)
    const buttonSkill1 = game.control.getButtonInput(game.control.buttonIndex.L2)
    const buttonSkill2 = game.control.getButtonInput(game.control.buttonIndex.R1)
    const buttonSkill3 = game.control.getButtonInput(game.control.buttonIndex.R2)

    // 이동 가능하거나, autoMoveFrame이 없을 때만 이동 가능합니다.
    if (this.isMoveEnable && this.autoMoveFrame <= 0) {
      // 버튼이 눌려있다면 이동속도 변경 
      // (버튼을 여러개 눌러 중복처리되는것을 막기 위해 한쪽 방향을 누르면 반대방향 버튼은 입력이 무시됨)
      if (buttonLeft && !buttonRight) this.moveSpeedX = -this.BASE_SPEED
      if (buttonRight && !buttonLeft) this.moveSpeedX = this.BASE_SPEED
      if (buttonDown && !buttonUp) this.moveSpeedY = this.BASE_SPEED
      if (buttonUp && !buttonDown) this.moveSpeedY = -this.BASE_SPEED

      // 버튼이 눌려져있지 않다면 속도를 원래대로 되돌림
      if (!buttonLeft && !buttonRight) this.moveSpeedX = 0
      if (!buttonDown && !buttonUp) this.moveSpeedY = 0
    }

    // 중앙 좌표값 설정
    this.centerX = this.x + (this.width / 2)
    this.centerY = this.y + (this.height / 2)

    // 무기 교체 버튼
    if (buttonA) {
      this.weaponSlotNumber++
      if (this.weaponSlotNumber >= this.weaponSlot.length) {
        this.weaponSlotNumber = 0
      }

      // 만약 다음 무기를 선택했을 때, 다음 무기의 id가 0(무기가 없는경우)이면 다음 무기로 자동으로 건너뜁니다. 
      // 이것을 반복하면 최종적으로 무기가 있는곳 또는 무기를 사용하지 않는 4번슬롯까지 자동으로 넘어갑니다.
      // 루프가 반드시 4번슬롯에서 종료되므로, 무한루프는 없습니다.
      const MAX_WEAPON = this.weaponSlot.length - 1
      while (this.weaponSlotNumber >= 0 && this.weaponSlotNumber < MAX_WEAPON) {
        if (this.weaponSlot[this.weaponSlotNumber].id !== 0) break
        this.weaponSlotNumber++
      }
    }

    // 스킬 슬롯 변경 버튼
    if (buttonB) this.usingSkillSlotA = !this.usingSkillSlotA

    // 스킬 사용 버튼
    if (buttonSkill0) this.useSkill(0)
    if (buttonSkill1) this.useSkill(1)
    if (buttonSkill2) this.useSkill(2)
    if (buttonSkill3) this.useSkill(3)
  }

  processAttack () {
    /**
     * @type {WeaponSlot}
     */
    const currentWeapon = this.weaponSlot[this.weaponSlotNumber]
    if (currentWeapon.weapon == null) return

    currentWeapon.delayCount++
    if (currentWeapon.delayCount >= currentWeapon.weapon.delay) {
      currentWeapon.weapon.create(this.attackWaepon, this.centerX, this.centerY)
      currentWeapon.delayCount -= currentWeapon.weapon.delay
    }
  }

  display () {
    if (this.disable) return

    // 죽은 경우에는, 60프레임을 넘기기 전까지 죽음 애니메이션 재생
    if (this.isDied && this.dieAfterDelayCount >= 61) return
    if (this.isDied) {
      this.playerDieEnimation.display(this.x, this.y)
      return
    }

    if (this.damageEnimationCount > 0) {
      this.playerDamageEnimation.display(this.x, this.y)
    } else {
      this.imageObjectDisplay(this.playerImage, this.playerImageData, this.x, this.y, this.width, this.height)
    }

    if (this.levelupEnimationCount > 0) {
      let targetX = this.x - 15
      let targetY = this.y + Math.floor(this.levelupEnimationCount / 4) - 10
      this.playerLevelupEnimation.display(targetX, targetY)
    }
  }

  /** 로드 한 이후, 스킬과 무기를 재등록합니다. */
  setLoadData () {
    // 무기 슬롯 데이터 입력합니다.
    for (let i = 0; i < this.weaponSlot.length; i++) {
      this.weaponSlot[i].weapon = tamshooter4Data.getPlayerWeapon(this.weaponSlot[i].id)
    }

    this.skillClassInput()
  }

  /**
   * 
   * @param {WeaponSlot[]} data 
   */
  setLoadWeaponData (data) {
    for (let i = 0; i < this.weaponSlot.length; i++) {
      this.weaponSlot[i].delayCount = data[i].delayCount
      this.weaponSlot[i].id = data[i].id
    }

    
  }

  /**
   * 
   * @param {SkillSlot[]} data 
   */
  setLoadSkillData (data) {
    // 스킬은 슬롯에 상관없이 한번에 8개를 저장하기 때문에
    // 슬롯B 값은 +4 인덱스를 해서 가져와야 합니다.
    // 인덱스 초과 방지를 위해 skillSlotA.length로 배열 최대 길이 제한을 넣었습니다.
    for (let i = 0; i < this.skillSlotA.length; i++) {
      let indexA = i
      let indexB = i + 4

      this.skillSlotA[i].coolTimeFrame = data[indexA].coolTimeFrame
      this.skillSlotA[i].delayCount = data[indexA].delayCount
      this.skillSlotA[i].id = data[indexA].id
      this.skillSlotA[i].repeatCount = data[indexA].repeatCount

      this.skillSlotB[i].coolTimeFrame = data[indexB].coolTimeFrame
      this.skillSlotB[i].delayCount = data[indexB].delayCount
      this.skillSlotB[i].id = data[indexB].id
      this.skillSlotB[i].repeatCount = data[indexB].repeatCount
    }

    // 스킬 불러온 후 스킬 다시 초기화
    // 스킬 클래스 등록 (한번에 A, B 슬롯 두개를 등록하는건 귀찮아서...)
    // 여기서는 널 체크를 하지 않습니다. (process에서만 널 체크 진행)
    this.skillClassInput()
  }

  /**
   * 플레이어를 특정 위치로 튕겨나가게 합니다.
   * 
   * autoMove가 적용되는 동안 플레이어는 이동 가능 여부와 상관없이 이동을 할 수 없습니다.
   * 
   * 주의: 플레이어의 좌표를 변경하고 싶다면, 이 함수를 사용하는것이 아니라 플레이어의 x 또는 y 좌표를 직접 수정해야 합니다.
   * @param {number} finishX 도착지점의 x좌표
   * @param {number} finishY 도착지점의 y좌표
   * @param {number} totalFrame 도착지점까지 이동하는데 걸리는 시간
   */
  setAutoMove (finishX = 0, finishY = 0, totalFrame = 60) {
    this.autoMoveX = finishX
    this.autoMoveY = finishY
    this.autoMoveFrame = totalFrame
  }
}

/**
 * 플레이어 무기 엑스포트 (data.js에서 사용)
 * @type {Map<number, PlayerWeaponData>}
 */
export const dataExportPlayerWeapon = new Map()
dataExportPlayerWeapon.set(ID.playerWeapon.multyshot, new PlayerMultyshot)
dataExportPlayerWeapon.set(ID.playerWeapon.missile, new PlayerMissile)
dataExportPlayerWeapon.set(ID.playerWeapon.arrow, new PlayerArrow)
dataExportPlayerWeapon.set(ID.playerWeapon.sapia, new PlayerSapia)
dataExportPlayerWeapon.set(ID.playerWeapon.laser, new PlayerLaser)
dataExportPlayerWeapon.set(ID.playerWeapon.blaster, new PlayerBlaster)
dataExportPlayerWeapon.set(ID.playerWeapon.parapo, new PlayerParapo)
dataExportPlayerWeapon.set(ID.playerWeapon.sidewave, new PlayerSidewave)
dataExportPlayerWeapon.set(ID.playerWeapon.rapid, new PlayerRapid)
dataExportPlayerWeapon.set(ID.playerWeapon.ring, new PlayerRing)
dataExportPlayerWeapon.set(ID.playerWeapon.seondanil, new PlayerSeondanil)
dataExportPlayerWeapon.set(ID.playerWeapon.boomerang, new PlayerBoomerang)
dataExportPlayerWeapon.set(ID.playerWeapon.kalnal, new PlayerKalnal)
dataExportPlayerWeapon.set(ID.playerWeapon.cogwheel, new PlayerCogwheel)
dataExportPlayerWeapon.set(ID.playerWeapon.yeonsai, new PlayerYeonsai)
dataExportPlayerWeapon.set(ID.playerWeapon.sabangtan, new PlayerSabangtan)
dataExportPlayerWeapon.set(ID.playerWeapon.r3TowerPink, new PlayerR3_towerPink)
dataExportPlayerWeapon.set(ID.playerWeapon.r3TowerPurple, new PlayerR3_towerPurple)
dataExportPlayerWeapon.set(ID.playerWeapon.r3Helljeon, new PlayerR3_towerHelljeon)

/**
 * 플레이어 스킬 엑스포트 (data.js에서 사용)
 * @type {Map<number, PlayerSkillData>}
 */
export const dataExportPlayerSkill = new Map()
dataExportPlayerSkill.set(ID.playerSkill.arrow, new PlayerSkillArrow)
dataExportPlayerSkill.set(ID.playerSkill.blaster, new PlayerSkillBlaster)
dataExportPlayerSkill.set(ID.playerSkill.laser, new PlayerSkillLaser)
dataExportPlayerSkill.set(ID.playerSkill.missile, new PlayerSkillMissile)
dataExportPlayerSkill.set(ID.playerSkill.multyshot, new PlayerSkillMultyshot)
dataExportPlayerSkill.set(ID.playerSkill.parapo, new PlayerSkillParapo)
dataExportPlayerSkill.set(ID.playerSkill.sapia, new PlayerSkillSapia)
dataExportPlayerSkill.set(ID.playerSkill.sidewave, new PlayerSkillSidewave)
dataExportPlayerSkill.set(ID.playerSkill.sword, new PlayerSkillSword)
dataExportPlayerSkill.set(ID.playerSkill.hyperBall, new PlayerSkillHyperBall)
dataExportPlayerSkill.set(ID.playerSkill.critcalChaser, new PlayerSkillCriticalChaser)
dataExportPlayerSkill.set(ID.playerSkill.pileBunker, new PlayerSkillPileBunker)
dataExportPlayerSkill.set(ID.playerSkill.santansu, new PlayerSkillSantansu)
dataExportPlayerSkill.set(ID.playerSkill.whiteflash, new PlayerSkillWhiteflash)
dataExportPlayerSkill.set(ID.playerSkill.rapid, new PlayerSkillRapid)
dataExportPlayerSkill.set(ID.playerSkill.ring, new PlayerSkillRing)
dataExportPlayerSkill.set(ID.playerSkill.seondanil, new PlayerSkillSeondanil)
dataExportPlayerSkill.set(ID.playerSkill.hanjumoek, new PlayerSkillHanjumeok)
dataExportPlayerSkill.set(ID.playerSkill.boomerang, new PlayerSkillBoomerang)
dataExportPlayerSkill.set(ID.playerSkill.moon, new PlayerSkillMoon)
dataExportPlayerSkill.set(ID.playerSkill.kalnal, new PlayerSkillKalnal)
dataExportPlayerSkill.set(ID.playerSkill.cogwheel, new PlayerSkillCogwheel)
dataExportPlayerSkill.set(ID.playerSkill.yeonsai, new PlayerSkillYeonsai)
dataExportPlayerSkill.set(ID.playerSkill.sabangtan, new PlayerSkillSabangtan)
dataExportPlayerSkill.set(ID.playerSkill.habirant, new PlayerSkillHabirant)
dataExportPlayerSkill.set(ID.playerSkill.icechaser, new PlayerSkillIcechaser)
dataExportPlayerSkill.set(ID.playerSkill.calibur, new PlayerSkillCalibur)
dataExportPlayerSkill.set(ID.playerSkill.sujikpa, new PlayerSkillSujikpa)
dataExportPlayerSkill.set(ID.playerSkill.speaker, new PlayerSkillSpeaker)
dataExportPlayerSkill.set(ID.playerSkill.eomukggochi, new PlayerSkillEomukggochi)
dataExportPlayerSkill.set(ID.playerSkill.r2Firecracker, new PlayerSkillR2Firecracker)
dataExportPlayerSkill.set(ID.playerSkill.r2Toyhammer, new PlayerSkillR2Toyhammer)
dataExportPlayerSkill.set(ID.playerSkill.r3Xkill, new PlayerSkillR3Xkill)
dataExportPlayerSkill.set(ID.playerSkill.r3Xshot, new PlayerSkillR3Xshot)
dataExportPlayerSkill.set(ID.playerSkill.r3Xbeam, new PlayerSkillR3Xbeam)
dataExportPlayerSkill.set(ID.playerSkill.r3Xboom, new PlayerSkillR3Xboom)
dataExportPlayerSkill.set(ID.playerSkill.r3Helljeon, new PlayerSkillR3Helljeon)
