'use strict'

import { buttonSystem } from './control.js'
import { EffectData, EnemyData, FieldData, ID, objectType, RoundData, tamshooter4Data, WeaponData } from './data.js'
import { graphicSystem } from './graphic.js'
import { imageDataInfo, imageFile } from './image.js'
import { soundFile, soundSystem } from './sound.js'
import { gameSystem, userSystem } from './tamshooter4.js'
// import { systemText } from './text.js'

/*
오브젝트 목록
1-1. FieldObject = 필드에서 사용하는 오브젝트
1-2. WeaponObject = 무기 오브젝트 [플레이어, 적, 아군이 사용]

[필드에 서로 개입하고 영향을 주는 오브젝트]
2-1. PlayerObject = 플레이어 오브젝트
2-2. playerWeaponObject = 플레이어 무기 오브젝트
2-3. FriendlyObject = 아군 오브젝트 [플레이어랑 별개이지만, 플레이어 아군]
2-4. FriendlyWeaponObject = 아군 무기 오브젝트 [아군 전용]
2-5. EnemyObject = 적 오브젝트 [플레이어가 죽여야 하는 적, 아군도 공격할 수 있다.]
2-6. EnemyWeaponObject = 적 무기 오브젝트 [적 전용]
2-7. NeutralObject = 중립 오브젝트 [적도, 아군도 전부 공격합니다.]
2-8. NeutralWeaponObject = 중립 무기 오브젝트

[필드에 개입하지 않고, 출력이나 이펙트 용도로 사용]
3=1. EffectObject = 이펙트 오브젝트 [서로 상호작용하지 않음. 이펙트 표시용]
3-2. SpriteObject = 스프라이트 오브젝트: 장식?
3-3. DamageObject = 데미지 출력

4-1. SystemObject = 시스템용도로 사용[FieldObject랑 차이 없음. 용도 구분을 위해 이름을 추가한 것]
 */

/**
 * field에서 데미지를 표시하는 오브젝트입니다.
 * 생성/삭제 방식이 아니라 Pool에서 자원을 가져와 사용하는 방식을 사용합니다.
 */
class DamageObject {
  constructor () {
    /** 표시할 x좌표 */ this.x = 0
    /** 표시할 y좌표 */ this.y = 0
    /** 데미지를 표시할 값 */ this.attack = 0
    /** 진행된 프레임 */ this.elapsedFrame = 0
    /** 사용 여부 */ this.isUsing = false
    /** 생성 Id */ this.createId = 0
  }

  setData (x, y, attack) {
    this.x = x
    this.y = y
    this.attack = attack
    this.elapsedFrame = 0
    this.isUsing = true
  }

  process () {
    if (!this.isUsing) return

    this.y -= 0.5
    this.elapsedFrame++

    if (this.elapsedFrame >= 60 || this.attack === 0) {
      this.isUsing = false
    }
  }

  display () {
    if (!this.isUsing) return

    const IMAGE = imageFile.system.damageFont
    const NUMBER_WIDTH = 12
    const NUMBER_HEIGHT = 12
    const WIDTH = 10
    const HEIGHT = 12
    const attackText = this.attack + ''
    for (let i = 0; i < attackText.length; i++) {
      const number = attackText.charAt(i)
      const outputX = this.x + (WIDTH * i)
      graphicSystem.imageDisplay(IMAGE, number * NUMBER_WIDTH, 0, NUMBER_WIDTH, NUMBER_HEIGHT, outputX, this.y, WIDTH, HEIGHT)
    }
  }
}

/**
 * 플레이어 오브젝트
 * 플레이어를 직접 조종합니다.
 * 이 객체는 필드 상태에서 직접 생성해 만드는 객체이기 때문에 data.js에서 플레이어 데이터를 받아오지 않습니다.
 */
class PlayerObject extends FieldData {
  /** 플레이어 이미지 */ playerImage = imageFile.system.playerImage

  constructor () {
    super(objectType.PLAYER, 0, 300, 200)
    this.width = this.playerImage.width // 40
    this.height = this.playerImage.height // 20
  }

  /**
   * 플레이어 정보 초기화 함수:
   * 주의! 이 함수는 constructor 내부에서 사용할 수 없습니다.
   * 왜냐하면 playerObject 데이터를 초기화 하지 않은 상태에서 불러오면 오류가 발생하기 때문입니다.
   * 따라서, 이 함수는 보통 roundStart에서 호출합니다.
   */
  init () {
    this.shield = 0
    this.shieldMax = 0
    this.shieldRecovery = 0
    this.attackDelay = 0
    this.attackDelayCount = 0
    this.debug = false

    this.x = 300
    this.y = 200
    this.centerX = this.x + (this.width / 2)
    this.centerY = this.y + (this.height / 2)

    const getData = userSystem.getPlayerObjectData()
    this.attack = getData.attack
    this.hp = getData.hp
    this.shield = getData.shield
    this.shieldMax = getData.shieldMax
    this.playerWeaponId = [ID.playerWeapon.multyshot,
      ID.playerWeapon.missile, ID.playerWeapon.arrow, ID.playerWeapon.laser, ID.playerWeapon.sapia,
      ID.playerWeapon.parapo, ID.playerWeapon.blaster, ID.playerWeapon.sidewave,
      ID.playerWeapon.unused
    ]
    this.playerWeaponPosition = this.playerWeaponId.length - 1
    this.playerWeaponDelayCount = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.skill = [
      { id: ID.playerSkill.sapia, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { id: ID.playerSkill.parapo, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { id: ID.playerSkill.blaster, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { id: ID.playerSkill.sidewave, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 }
    ]
  }

  addDamage (damage) {
    if (this.shield >= damage) {
      this.shield -= damage
    } else if (this.shield < damage) {
      damage -= this.shield
      this.shield = 0
      this.hp -= Math.floor(damage / 2)
    }
  }

  addExp (score) {
    userSystem.plusExp(score)
  }

  process () {
    this.processButton()
    this.processSendUserStat()

    if (this.debug) {
      // this.processDebug()
    } else {
      this.processAttack()
      this.processSkill()
    }
  }

  useSkill (skillPosition) {
    const getId = this.skill[skillPosition].id
    const getSkill = tamshooter4Data.getPlayerSkillData(getId)
    if (getSkill == null) return // 스킬이 없다면 무시

    // 쿨타임 계산해서, 쿨타임이 남아있으면, 무시
    const leftCoolTime = this.skill[skillPosition].coolTimeFrame
    if (leftCoolTime > 0) return

    // 스킬 사용
    this.skill[skillPosition].repeatCount += getSkill.repeatCount // 스킬 반복 횟수를 증가시켜 여러번 무기가 발사되게 처리
    this.skill[skillPosition].coolTimeFrame += getSkill.getCoolTimeFrame() // 쿨타임 추가 (단위가 프레임이므로, 쿨타임 시간에 60을 곱함)

    // 스킬에 사용된 무기가 즉시 발사되도록, 딜레이카운트를 채워줌(딜레이 이상이여야 무기 발사됨)
    // 다만 beforeDelay가 있을경우, 미리 delayCount에서 해당 수치만큼 감소
    this.skill[skillPosition].delayCount += getSkill.delay - getSkill.beforeDelay

    // 스킬 사운드 출력
    getSkill.useSoundPlay()
  }

  processSkill () {
    for (let i = 0; i < this.skill.length; i++) {
      const currentSkill = this.skill[i] // 루프 i값에 따른 현재 스킬

      if (currentSkill.coolTimeFrame > 0) { // 스킬 쿨타임이 0보다 클 때
        currentSkill.coolTimeFrame-- // 스킬 쿨타임프레임 감소
      }

      // 만약 스킬 반복횟수가 없다면, 스킬을 사용하지 않은것이므로 무시
      if (currentSkill.repeatCount <= 0) continue

      const getSkill = tamshooter4Data.getPlayerSkillData(currentSkill.id)
      if (getSkill == null) continue // 스킬이 없다면 무시

      currentSkill.delayCount++ // 스킬 딜레이카운트 증가
      if (currentSkill.delayCount >= getSkill.delay) { // 딜레이카운트카 스킬 딜레이를 넘어가면 무기 생성
        getSkill.create(this.centerX, this.centerY, this.attack)
        currentSkill.delayCount -= getSkill.delay // 스킬 딜레이카운트 감소
        currentSkill.repeatCount-- // 반복횟수 1회 감소
      }
    }
  }

  processDebug () {
    this.displayDebug()
  }

  displayDebug () {
    if (fieldState.weaponObject[fieldState.weaponObject.length - 1] == null) return
    graphicSystem.fillText(fieldState.weaponObject[fieldState.weaponObject.length - 1].x + ', ' + fieldState.weaponObject[fieldState.weaponObject.length - 1].y, 0, 100)

    if (fieldState.weaponObject[0].targetObject == null) return
    console.log(fieldState.weaponObject[0].x + ', ' + fieldState.weaponObject[0].y + ', ' + fieldState.weaponObject[0].targetObject.x + ', ' + fieldState.weaponObject[0].targetObject.y)
  }

  processSendUserStat () {
    userSystem.hp = this.hp
    userSystem.shield = this.shield
    for (let i = 0; i < 4; i++) {
      userSystem.skill[i].coolTime = Math.ceil(this.skill[i].coolTimeFrame / 60)
      userSystem.skill[i].id = this.skill[i].id
    }
  }

  processButton () {
    const buttonLeft = buttonSystem.getButtonDown(buttonSystem.BUTTON_LEFT)
    const buttonRight = buttonSystem.getButtonDown(buttonSystem.BUTTON_RIGHT)
    const buttonUp = buttonSystem.getButtonDown(buttonSystem.BUTTON_UP)
    const buttonDown = buttonSystem.getButtonDown(buttonSystem.BUTTON_DOWN)
    const buttonA = buttonSystem.getButtonInput(buttonSystem.BUTTON_A)
    const buttonB = buttonSystem.getButtonInput(buttonSystem.BUTTON_B)
    const buttonSkill0 = buttonSystem.getButtonInput(buttonSystem.BUTTON_SKILL0)
    const buttonSkill1 = buttonSystem.getButtonInput(buttonSystem.BUTTON_SKILL1)
    const buttonSkill2 = buttonSystem.getButtonInput(buttonSystem.BUTTON_SKILL2)
    const buttonSkill3 = buttonSystem.getButtonInput(buttonSystem.BUTTON_SKILL3)

    if (buttonLeft) this.x -= 8
    if (buttonRight) this.x += 8
    if (buttonDown) this.y += 8
    if (buttonUp) this.y -= 8

    this.centerX = this.x + (this.width / 2)
    this.centerY = this.y + (this.height / 2)

    if (buttonA) {
      this.playerWeaponPosition++
      if (this.playerWeaponPosition >= this.playerWeaponId.length) {
        this.playerWeaponPosition = 0
      }
    }

    if (buttonB) {
      if (this.skill[0].id === ID.playerSkill.multyshot) {
        this.skill = [
          { id: ID.playerSkill.sapia, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
          { id: ID.playerSkill.parapo, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
          { id: ID.playerSkill.blaster, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
          { id: ID.playerSkill.sidewave, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 }
        ]
      } else if (this.skill[0].id === ID.playerSkill.sapia) {
        this.skill = [
          { id: ID.playerSkill.multyshot, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
          { id: ID.playerSkill.missile, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
          { id: ID.playerSkill.arrow, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
          { id: ID.playerSkill.laser, coolTimeFrame: 0, repeatCount: 0, delayCount: 0 }
        ]
      }
    }

    if (buttonSkill0) this.useSkill(0)
    if (buttonSkill1) this.useSkill(1)
    if (buttonSkill2) this.useSkill(2)
    if (buttonSkill3) this.useSkill(3)
  }

  processAttack () {
    const getWeaponData = tamshooter4Data.getPlayerWeaponData(this.playerWeaponId[this.playerWeaponPosition])
    if (getWeaponData == null) return

    this.playerWeaponDelayCount[this.playerWeaponPosition]++
    if (this.playerWeaponDelayCount[this.playerWeaponPosition] >= getWeaponData.delay) {
      getWeaponData.create(this.attack, this.centerX, this.centerY)
      this.playerWeaponDelayCount[this.playerWeaponPosition] -= getWeaponData.delay
    }
  }

  display () {
    graphicSystem.imageDisplay(this.playerImage, this.x, this.y)
    graphicSystem.digitalFontDisplay('B BUTTON. X KEY TO CHANGE SKILL', 0, 80)
  }
}

/**
 * 필드 스테이트 (필드의 상태를 관리하는 static 클래스 - 공용, 인스턴스 없음)
 */
export class fieldState {
  /** @type {PlayerObject} */ static playerObject = new PlayerObject()
  /** @type {WeaponData[]} */ static weaponObject = []
  /** @type {EnemyData[]} */ static enemyObject = []
  /** @type {EffectData[]} */ static effectObject = []
  /** @type {DamageObject[]} */ static damageObject = []

  /**
   * 다음 생성할 오브젝트의 Id
   * 중복 구분 용도로 사용 (경고: 이 변수를 직접 대입하지 말고, getNextCreateId 함수를 사용하세요.)
   * @type {number}
   */
  static nextCreateId = 0

  /**
   * 다음 생성할 오브젝트의 Id를 얻습니다.
   * @returns {number} nextCreateId
   */
  static getNextCreateId () {
    this.nextCreateId += 1 // 한번 생성할 때마다 id 1씩 증가

    return this.nextCreateId
  }

  static getPlayerObject () { return this.playerObject }
  static getPlayerWeaponObject () { return this.weaponObject }
  static getEnemyObject () { return this.enemyObject }
  static getEffectObject () { return this.effectObject }
  static getDamageObject () { return this.damageObject }

  /**
   * fieldState에서 사용하는 모든 오브젝트를 리셋합니다.
   * player는 초기화되고, weapon, enemy, effect는 전부 삭제되며, damage는 사용안함 처리합니다.
   */
  static allObjectReset () {
    this.playerObject.init()
    this.weaponObject.length = 0
    this.enemyObject.length = 0
    this.effectObject.length = 0
    for (let i = 0; i < this.damageObject.length; i++) {
      this.damageObject[i].isUsing = false
    }
  }

  /**
   * 랜덤한 적 객체를 얻습니다. 다만, 이 객체가 삭제 예정이라면 함수의 리턴값은 null이 됩니다.
   * @returns 적 오브젝트
   */
  static getRandomEnemyObject () {
    if (this.enemyObject.length === 0) return null

    const randomNumber = Math.floor(Math.random() * this.enemyObject.length)
    const targetEnemy = this.enemyObject[randomNumber]

    if (targetEnemy.isDeleted || targetEnemy.isDied) {
      return null
    } else {
      return this.enemyObject[randomNumber]
    }
  }

  /**
   * @param {number} attack 공격력 (반드시 정수여야 함. Math.floor 연산 회피를 위해 여기서는 검사하지 않음.)
   */
  static createWeaponObject (typeId, x = 0, y = 0, attack = 1, ...addOption) {
    const GetClass = tamshooter4Data.getWeaponData(typeId)
    if (GetClass == null) return

    const inputData = new GetClass(addOption)
    inputData.createId = this.getNextCreateId()
    inputData.setPosition(x, y)
    inputData.setOption(attack)
    this.weaponObject.push(inputData)
  }

  static createEnemyObject (typeId, x = 0, y = 0, ...option) {
    const GetClass = tamshooter4Data.getEnemyData(typeId)
    if (GetClass == null) return

    const inputData = new GetClass(option)
    inputData.createId = this.getNextCreateId()
    inputData.setPosition(x, y)
    inputData.init()
    this.enemyObject.push(inputData)
  }

  static createEffectObject (typeId, x = 0, y = 0, repeatCount = 0, beforeDelay = 0, ...option) {
    const GetClass = tamshooter4Data.getEffectData(typeId)
    if (GetClass == null) return

    const inputData = new GetClass(option)
    inputData.createId = this.getNextCreateId()
    inputData.setPosition(x, y)
    // inputData.setOption(width, height)
    this.effectObject.push(inputData)
  }

  static damageObjectNumber = 0
  static createDamageObject (x = 0, y = 0, attack = 1) {
    if (this.damageObject.length < 100) {
      this.damageObject.push(new DamageObject())
    }

    this.damageObjectNumber++
    if (this.damageObjectNumber >= this.damageObject.length) {
      this.damageObjectNumber = 0
    }

    this.damageObject[this.damageObjectNumber].setData(x, y, attack)
    this.damageObject[this.damageObjectNumber].createId = this.getNextCreateId()
  }

  static process () {
    this.processPlayerObject()
    this.processWeaponObject()
    this.processEnemyObject()
    this.processDamageObject()
    this.processEffectObject()
  }

  static processPlayerObject () {
    this.playerObject.process()
  }

  static processWeaponObject () {
    for (let i = 0; i < this.weaponObject.length; i++) {
      const currentObject = this.weaponObject[i]
      currentObject.process()
      currentObject.fieldProcess()

      if (currentObject.isDeleted) {
        this.weaponObject.splice(i, 1)
      }
    }
  }

  static processEnemyObject () {
    for (let i = 0; i < this.enemyObject.length; i++) {
      const currentObject = this.enemyObject[i]
      currentObject.process(currentObject)
      currentObject.fieldProcess()

      if (currentObject.isDeleted) {
        this.enemyObject.splice(i, 1)
      }
    }
  }

  static processDamageObject () {
    for (let i = 0; i < this.damageObject.length; i++) {
      const currentDamage = this.damageObject[i]
      currentDamage.process()
    }
  }

  static processEffectObject () {
    for (let i = 0; i < this.effectObject.length; i++) {
      const currentEffect = this.effectObject[i]

      currentEffect.process()
      currentEffect.fieldProcess()

      if (currentEffect.isDeleted) {
        this.effectObject.splice(i, 1)
      }
    }
  }

  static display () {
    this.displayEffectObject()
    this.displayEnemyObject()
    this.displayWeaponObject()
    this.displayDamageObject()
    this.displayPlayerObject()
  }

  static displayPlayerObject () {
    this.playerObject.display()
  }

  static displayWeaponObject () {
    for (let i = 0; i < this.weaponObject.length; i++) {
      this.weaponObject[i].display()
    }
  }

  static displayEnemyObject () {
    for (let i = 0; i < this.enemyObject.length; i++) {
      const currentEnemy = this.enemyObject[i]

      currentEnemy.display()
      this.displayEnemyHpMeter(currentEnemy)
    }
  }

  static displayEnemyHpMeter (currentEnemy) {
    if (currentEnemy.isDied) return // 죽은 적은 체력 안보여줌

    let enemyHpPercent = currentEnemy.hp / currentEnemy.hpMax
    if (enemyHpPercent > 100) {
      enemyHpPercent = 100
    } else if (enemyHpPercent < 0) {
      enemyHpPercent = 0
    }

    const meterWidth = Math.floor(enemyHpPercent * currentEnemy.width)

    graphicSystem.fillRect(currentEnemy.x, currentEnemy.y + currentEnemy.height, currentEnemy.width, 2, 'red')
    graphicSystem.fillRect(currentEnemy.x, currentEnemy.y + currentEnemy.height, meterWidth, 2, 'green')
  }

  static displayDamageObject () {
    for (let i = 0; i < this.damageObject.length; i++) {
      const currentDamage = this.damageObject[i]

      currentDamage.display()
    }
  }

  static displayEffectObject () {
    // 참고: 이펙트는 투명도 70%가 적용됩니다. 100%은 눈아픔.
    graphicSystem.setAlpha(0.7)

    for (let i = 0; i < this.effectObject.length; i++) {
      const currentEffect = this.effectObject[i]

      currentEffect.display()
    }

    graphicSystem.setAlpha(1)
  }
}

export class fieldSystem {
  static fieldTime = {
    frame: 0,
    second: 0,
    process: function () {
      this.fieldTime.frame++
      if (this.fieldTime.frame >= 60) {
        this.fieldTime.frame -= 60
        this.fieldTime.second++
      }
    },
    reset: function () {
      this.frame = 0
      this.second = 0
    }
  }

  /**
   * 현재 진행되고 있는 라운드
   * @type {RoundData}
   */
  static round = null

  static stateId = 0
  static STATE_NORMAL = 0
  static STATE_PAUSE = 1
  static STATE_ROUND_CLEAR = 2
  static STATE_GAME_OVER = 3
  static STATE_EXIT = 4

  /** pause 상태일 때, 커서 번호 */ static cursor = 0
  static exitDelayCount = 0
  static EXIT_ROUND_CLEAR_DELAY = 360
  static EXIT_GAME_OVER_DELAY = 360
  static EXIT_FAST_DELAY = 180
  static SCORE_ENIMATION_MAX_FRAME = 60
  static SCORE_ENIMATION_INTERVAL = 4
  static enimationFrame = 0
  static score = 0

  static requestAddScore (score) {
    this.score += score
    fieldState.playerObject.addExp(score)
  }

  /**
   * 라운드를 시작합니다. 필드 초기화 작업 및 라운드 설정 작업을 진행합니다.
   * 다만, 라운드가 없을경우, 라운드는 시작하지 않습니다.
   */
  static roundStart (roundId) {
    const RoundClass = tamshooter4Data.getRoundData(roundId)
    if (RoundClass == null) return

    // 라운드 데이터
    this.round = new RoundClass()

    // 라운드가 시작되는 순간, 게임 상태가 필드로 변경되고, 게임이 시작됩니다.
    // 이 과정에서 필드 데이터에 대해 초기화가 진행됩니다.
    gameSystem.stateId = gameSystem.STATE_FIELD
    this.fieldTime.frame = 0
    this.fieldTime.second = 0
    fieldState.allObjectReset()
    this.stateId = this.STATE_NORMAL
    this.cursor = 0
    this.enimationFrame = 0
    this.exitDelayCount = 0
    this.score = 0
  }

  /**
   * 라운드를 나갑니다. (processExit와는 다름)
   * 플레이어가 게임을 일시정지 하고 메인 화면으로 나가가나, 라운드를 클리어 하거나, 게임오버 당했을 때
   * exitDelay가 추가되고, 이 값이 일정량을 초과하면 roundExit 함수를 사용합니다.
   * 필드 초기화는 하지 않습니다.
   * 라운드를 나가면, 메인 화면으로 돌아갑니다.
   * 다만 게임창을 닫을 경우에는 현재 상태가 임시 저장되기 때문에 라운드가 끝나지 않음.
   */
  static roundExit () {
    gameSystem.stateId = gameSystem.STATE_MAIN
  }

  /**
   * 점수 사운드 출력
   */
  static scoreSound () {
    if (this.exitDelayCount < this.SCORE_ENIMATION_MAX_FRAME 
      && this.exitDelayCount % this.SCORE_ENIMATION_INTERVAL === 0
      && this.score >= 1) {
      soundSystem.play(soundFile.system.systemScore)
    }
  }

  /**
   * 일시 정지 상태에서의 처리
   */
  static processPause () {
    const buttonDown = buttonSystem.getButtonInput(buttonSystem.BUTTON_DOWN)
    const buttonUp = buttonSystem.getButtonInput(buttonSystem.BUTTON_UP)
    const buttonA = buttonSystem.getButtonInput(buttonSystem.BUTTON_A)
    const maxMenuNumber = 3

    if (buttonUp && this.cursor > 0) {
      this.cursor--
      soundSystem.play(soundFile.system.systemCursor)
    } else if (buttonDown && this.cursor < maxMenuNumber) {
      this.cursor++
      soundSystem.play(soundFile.system.systemCursor)
    }

    if (buttonA) {
      switch (this.cursor) {
        case 0:
          this.stateId = this.STATE_NORMAL // pause 상태 해제
          break
        case 1:
          soundSystem.soundOn = !soundSystem.soundOn
          break
        case 2:
          soundSystem.musicOn = !soundSystem.musicOn
          break
        case 3:
          this.stateId = this.STATE_EXIT // 라운드를 나감
          break
      }
    }
  }

  static processExit () {
    // 사용자가 나가면 현재까지 얻은 점수를 보여줌, 따로 출력할 배경 사운드는 없음
    this.scoreSound()

    this.enimationFrame++
    this.exitDelayCount++

    if (this.exitDelayCount >= this.EXIT_FAST_DELAY) {
      this.roundExit()
    }
  }

  static processRoundClear () {
    // 라운드 클리어 사운드 재생 (딜레이카운트가 0일때만 재생해서 중복 재생 방지)
    if (this.exitDelayCount === 0) {
      soundSystem.play(soundFile.system.systemRoundClear)
    }

    this.scoreSound()

    this.enimationFrame++
    this.exitDelayCount++

    if (this.exitDelayCount >= this.EXIT_ROUND_CLEAR_DELAY) {
      this.roundExit()
    }
  }

  static processGameOver () {
    // 라운드 실패 사운드 재생 (딜레이카운트가 0일때만 재생해서 중복 재생 방지)
    if (this.exitDelayCount === 0) {
      soundSystem.play(soundFile.system.systemGameOver)
    }

    this.scoreSound()

    this.enimationFrame++
    this.exitDelayCount++

    if (this.exitDelayCount >= this.EXIT_GAME_OVER_DELAY) {
      this.roundExit()
    }
  }

  static processNormal () {
    const buttonPause = buttonSystem.getButtonInput(buttonSystem.BUTTON_ENTER)
    if (buttonPause) {
      soundSystem.play(soundFile.system.systemPause)
      this.stateId = this.STATE_PAUSE
    } else if (this.round.clearCheck()) {
      this.stateId = this.STATE_ROUND_CLEAR
    } else if (fieldState.playerObject.hp <= 0) {
      this.stateId = this.STATE_GAME_OVER
    }

    fieldState.process()
    this.round.process()
  }

  static process () {
    soundSystem.musicPlay(soundFile.music.test)

    switch (this.stateId) {
      case this.STATE_PAUSE:
        this.processPause()
        break
      case this.STATE_ROUND_CLEAR:
        this.processRoundClear()
        break
      case this.STATE_GAME_OVER:
        this.processGameOver()
        break
      case this.STATE_EXIT:
        this.processExit()
        break
      default:
        this.processNormal()
        break
    }
  }

  static display () {
    // 라운드, 필드스테이트, 필드데이터는 항상 출력됩니다.
    if (this.round) this.round.display()
    fieldState.display()
    this.displayFieldData()

    switch (this.stateId) {
      case this.STATE_PAUSE:
        this.displayPause()
        break
      case this.STATE_ROUND_CLEAR:
      case this.STATE_GAME_OVER:
      case this.STATE_EXIT:
        this.displayResult()
        break
    }
  }

  static displayPause () {
    const image = imageFile.system.fieldSystem
    const imageDataPause = imageDataInfo.fieldSystem.pause
    const imageDataMenu = imageDataInfo.fieldSystem.menu
    const imageDataArrow = imageDataInfo.fieldSystem.arrow
    const imageDataChecked = imageDataInfo.fieldSystem.checked
    const imageDataUnchecked = imageDataInfo.fieldSystem.unchecked
    const imageDataSelected = imageDataInfo.fieldSystem.selected
    const MID_X = (graphicSystem.CANVAS_WIDTH / 2) - (imageDataPause.width / 2)
    const MID_Y = 100
    const MENU_X = (graphicSystem.CANVAS_WIDTH / 2) - (imageDataMenu.width / 2)
    const MENU_Y = 100 + imageDataInfo.fieldSystem.pause.height
    const ARROW_X = MENU_X - imageDataArrow.width
    const ARROW_Y = MENU_Y + (this.cursor * imageDataArrow.height)
    const CHECK_X = MENU_X + imageDataMenu.width
    const CHECK_SOUND_Y = MENU_Y + imageDataChecked.height
    const CHECK_MUSIC_Y = MENU_Y + imageDataChecked.height * 2
    const SELECT_X = MENU_X
    const SELECT_Y = ARROW_Y
    const SCORE_X = (graphicSystem.CANVAS_WIDTH / 2) - 200
    const SCORE_Y = MENU_Y + imageDataMenu.height
    const imageDataSoundOn = soundSystem.soundOn ? imageDataChecked : imageDataUnchecked // 사운드의 이미지데이터는 코드 길이를 줄이기 위해 체크/언체크에 따른 이미지 데이터를 대신 입력함
    const imageDataMusicOn = soundSystem.musicOn ? imageDataChecked : imageDataUnchecked

    graphicSystem.imageDisplay(image, imageDataPause.x, imageDataPause.y, imageDataPause.width, imageDataPause.height, MID_X, MID_Y, imageDataPause.width, imageDataPause.height)
    graphicSystem.imageDisplay(image, imageDataMenu.x, imageDataMenu.y, imageDataMenu.width, imageDataMenu.height, MENU_X, MENU_Y, imageDataMenu.width, imageDataMenu.height)
    graphicSystem.imageDisplay(image, imageDataArrow.x, imageDataArrow.y, imageDataArrow.width, imageDataArrow.height, ARROW_X, ARROW_Y, imageDataArrow.width, imageDataArrow.height)
    graphicSystem.imageDisplay(image, imageDataSoundOn.x, imageDataSoundOn.y, imageDataSoundOn.width, imageDataSoundOn.height, CHECK_X, CHECK_SOUND_Y, imageDataSoundOn.width, imageDataSoundOn.height)
    graphicSystem.imageDisplay(image, imageDataMusicOn.x, imageDataMusicOn.y, imageDataMusicOn.width, imageDataMusicOn.height, CHECK_X, CHECK_MUSIC_Y, imageDataMusicOn.width, imageDataMusicOn.height)
    graphicSystem.imageDisplay(image, imageDataSelected.x, imageDataSelected.y, imageDataSelected.width, imageDataSelected.height, SELECT_X, SELECT_Y, imageDataSelected.width, imageDataSelected.height)
    graphicSystem.fillRect(SCORE_X, SCORE_Y, 400, 30)
    graphicSystem.digitalFontDisplay('score: ' + this.score, SCORE_X + 5, SCORE_Y + 5)
  }

  /**
   * 결과 화면을 출력합니다. roundClear, gameOver, processExit 상태 모두 동일한 display 함수 사용
   */
  static displayResult () {
    const image = imageFile.system.fieldSystem
    let imageData
    let titleX = 0
    const titleY = 100
    const TEXT_X = 200
    const TEXT_Y = 200
    const TEXT_HEIGHT = 22

    switch (this.stateId) {
      case this.STATE_ROUND_CLEAR:
        imageData = imageDataInfo.fieldSystem.roundClear
        break
      case this.STATE_GAME_OVER:
        imageData = imageDataInfo.fieldSystem.gameOver
        break
      default:
        imageData = imageDataInfo.fieldSystem.result
        break
    }

    titleX = (graphicSystem.CANVAS_WIDTH - imageData.width) / 2

    let viewScore = this.score * (this.exitDelayCount / this.SCORE_ENIMATION_MAX_FRAME)
    if (viewScore >= this.score) viewScore = this.score

    graphicSystem.imageDisplay(image, imageData.x, imageData.y, imageData.width, imageData.height, titleX, titleY, imageData.width, imageData.height)
    graphicSystem.fillRect(TEXT_X, TEXT_Y - 4, 400, TEXT_HEIGHT * 4, 'lime')
    graphicSystem.digitalFontDisplay('field score: ' + Math.floor(viewScore), TEXT_X, TEXT_Y)
    graphicSystem.digitalFontDisplay('clear bonus: ' + 0, TEXT_X, TEXT_Y + (TEXT_HEIGHT * 1))
    graphicSystem.digitalFontDisplay('-----------: ' + 0, TEXT_X, TEXT_Y + (TEXT_HEIGHT * 2))
    graphicSystem.digitalFontDisplay('total score: ', TEXT_X, TEXT_Y + (TEXT_HEIGHT * 3))
  }

  static displayFieldData () {
    const LAYER_X = graphicSystem.CANVAS_WIDTH_HALF
    const LAYER_Y = 570
    const LAYER_DIGITAL_Y = 570 + 5
    const HEIGHT = 30
    const currentTime = this.round != null ? this.round.currentTime : '999'
    const finishTime = this.round != null ? this.round.finishTime : '999'
    const meterMultiple = currentTime / finishTime
    graphicSystem.fillRect(LAYER_X, LAYER_Y, graphicSystem.CANVAS_WIDTH_HALF, HEIGHT, 'silver')
    graphicSystem.fillRect(LAYER_X, LAYER_Y, graphicSystem.CANVAS_WIDTH_HALF * meterMultiple, HEIGHT, '#D5F5E3')
    graphicSystem.digitalFontDisplay(`R:1-1, T:${currentTime}/${finishTime}`, LAYER_X + 5, LAYER_DIGITAL_Y)
  }
}
