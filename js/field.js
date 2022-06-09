"use strict"

import { buttonSystem } from "./control.js"
import { FieldData, ID, objectType, tamshooter4Data } from "./data.js"
import { graphicSystem } from "./graphic.js"
import { imageFile } from "./image.js"
import { gameSystem, userSystem } from "./tamshooter4.js"
import { systemText } from "./text.js"
import { collision } from "./data.js"


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

class DamageObject extends FieldData {
  constructor (x, y, attack = 0) {
    super()
    this.x = x
    this.y = y
    /** 데미지를 표시할 값 */ this.attack = attack
  }

  process () {
    this.y -= 0.5

    if (this.elapsedFrame >= 60 || this.attack === 0) {
      this.isDeleted = true
    }
  }

  display () {
    const IMAGE = imageFile.damageFont
    const NUMBER_WIDTH = 12
    const NUMBER_HEIGHT = 12
    const WIDTH = 10
    const HEIGHT = 12
    const attackText = this.attack + ''
    for (let i = 0; i < attackText.length; i++) {
      let number = attackText.charAt(i)
      let outputX = this.x + (WIDTH * i)
      graphicSystem.imageDisplay(IMAGE, number * NUMBER_WIDTH, 0, WIDTH, HEIGHT, outputX, this.y, WIDTH, HEIGHT)
    }
  }
}


/**
 * 플레이어 오브젝트  
 * 플레이어를 직접 조종합니다.
 * 이 객체는 필드 상태에서 직접 생성해 만드는 객체이기 때문에 data.js에서 플레이어 데이터를 받아오지 않습니다.
 */
class PlayerObject extends FieldData {
  /** 플레이어 이미지 */ playerImage = imageFile.playerImage

  constructor () {
    super(objectType.PLAYER, 0, 300, 200)
    this.width = this.playerImage.width // 40
    this.height = this.playerImage.height // 20

    this.shield = 0
    this.shieldMax = 0
    this.shieldRecovery = 0
    this.attackDelay = 0
    this.attackDelayCount = 0
    this.debug = false
  }

  init () {
    this.x = 300
    this.y = 200
    
    const getData = userSystem.getPlayerObjectData()
    this.attack = getData.attack
    this.hp = getData.hp
    this.shield = getData.shield
    this.shieldMax = getData.shieldMax
    this.playerWeaponId = [ID.playerWeapon.multyshot, 
      ID.playerWeapon.missile, ID.playerWeapon.arrow, ID.playerWeapon.laser, ID.playerWeapon.sapia,
      ID.playerWeapon.parapo
    ]
    this.playerWeaponPosition = this.playerWeaponId.length - 1
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
      this.processDebug()
    } else {
      this.processAttack()
    }
  }

  processDebug () {
    if (fieldState.weaponObject.length <= 1) {
      fieldState.createWeaponObject(ID.weapon.laserBlue, this.x, this.y)
    }

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
  }

  processButton () {
    let buttonLeft = buttonSystem.getButtonDown(buttonSystem.BUTTON_LEFT)
    let buttonRight = buttonSystem.getButtonDown(buttonSystem.BUTTON_RIGHT)
    let buttonUp = buttonSystem.getButtonDown(buttonSystem.BUTTON_UP)
    let buttonDown = buttonSystem.getButtonDown(buttonSystem.BUTTON_DOWN)
    let buttonA = buttonSystem.getButtonInput(buttonSystem.BUTTON_A)
    let buttonB = buttonSystem.getButtonInput(buttonSystem.BUTTON_B)

    if (buttonLeft) this.x -= 8
    if (buttonRight) this.x += 8
    if (buttonDown) this.y += 8
    if (buttonUp) this.y -= 8

    if (buttonA) {
      this.playerWeaponPosition++
      if (this.playerWeaponPosition >= this.playerWeaponId.length) {
        this.playerWeaponPosition = 0
      }
    }

    if (buttonB) {
      this.debug = true
    }
  }

  processAttack () {
    const centerX = this.x + Math.floor(this.width / 2)
    const centerY = this.y + Math.floor(this.height / 2)

    const getWeaponData = tamshooter4Data.getPlayerWeaponData(this.playerWeaponId[this.playerWeaponPosition])
    if (getWeaponData == null) return
    
    this.attackDelayCount++
    if (this.attackDelayCount >= getWeaponData.delay) {
      getWeaponData.create(this.attack, centerX, centerY)
      this.attackDelayCount -= getWeaponData.delay
    }
  }

  display () {
    graphicSystem.imageDisplay(this.playerImage, this.x, this.y)
  }

  
}

/**
 * 필드 스테이트 (필드의 상태를 관리하는 static 클래스 - 공용, 인스턴스 없음)
 */
export class fieldState {
  /** @type {PlayerObject} */ static playerObject = new PlayerObject()
  /** @type {FieldData[]} */ static weaponObject = []
  /** @type {FieldData[]} */ static enemyObject = []
  /** @type {FieldData[]} */ static effectObject = []
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
   * 랜덤한 적 객체를 얻습니다. 다만, 이 객체가 삭제 예정이라면 함수의 리턴값은 null이 됩니다.
   * @returns 적 오브젝트
   */
  static getRandomEnemyObject () {
    if (this.enemyObject.length === 0) return null

    let randomNumber = Math.floor(Math.random() * this.enemyObject.length)
    let targetEnemy = this.enemyObject[randomNumber]

    if (targetEnemy.isDeleted) {
      return null
    } else {
      return this.enemyObject[randomNumber]
    }
  }

  /**
   * @param {number} attack 공격력 (반드시 정수여야 함. Math.floor 연산 회피를 위해 여기서는 검사하지 않음.)
   */
  static createWeaponObject (typeId, x = 0, y = 0, attack = 1, ...addOption) {
    let getClass = tamshooter4Data.getWeaponData(typeId)
    if (getClass == null) return

    let inputData = new getClass(addOption)
    inputData.createId = this.getNextCreateId()
    inputData.setPosition(x, y)
    inputData.setOption(attack)
    this.weaponObject.push(inputData)
  }
  
  static createEnemyObject (typeId, x = 0, y = 0) {
    let getClass = tamshooter4Data.getEnemyData(typeId)
    if (getClass == null) return

    let inputData = new getClass()
    inputData.createId = this.getNextCreateId()
    inputData.setPosition(x, y)
    inputData.init()
    this.enemyObject.push(inputData)
  }

  static createEffectObject (typeId, x = 0, y = 0, repeatCount = 0, beforeDelay = 0, ...option) {
    let getClass = tamshooter4Data.getEffectData(typeId)
    if (getClass == null) return

    let inputData = new getClass(option)
    inputData.createId = this.getNextCreateId()
    inputData.setPosition(x, y)
    // inputData.setOption(width, height)
    this.effectObject.push(inputData)
  }

  static createDamageObject (x = 0, y = 0, attack = 1) {
    let inputData = new DamageObject(x, y, attack)
    inputData.createId = this.getNextCreateId()
    this.damageObject.push(inputData)
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
      let currentObject = this.weaponObject[i]
      currentObject.process()
      currentObject.fieldProcess()

      if (currentObject.isDeleted) {
        this.weaponObject.splice(i, 1)
      }
    }
  }

  static processEnemyObject () {
    for (let i = 0; i < this.enemyObject.length; i++) {
      let currentObject = this.enemyObject[i]
      currentObject.process(currentObject)
      currentObject.fieldProcess()
      
      if (currentObject.isDeleted) {
        this.enemyObject.splice(i, 1)
      }
    }
  }

  static processDamageObject () {
    for (let i = 0; i < this.damageObject.length; i++) {
      let currentDamage = this.damageObject[i]

      currentDamage.process()
      currentDamage.fieldProcess()

      if (currentDamage.isDeleted) {
        this.damageObject.splice(i, 1)
      }
    }
  }

  
  static processEffectObject () {
    for (let i = 0; i < this.effectObject.length; i++) {
      let currentEffect = this.effectObject[i]

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
      this.weaponObject[i].display.call(this.weaponObject[i])
    }
  }

  static displayEnemyObject () {
    for (let i = 0; i < this.enemyObject.length; i++) {
      let currentEnemy = this.enemyObject[i]

      currentEnemy.display()
      this.displayEnemyHpMeter(currentEnemy)
    }
  }

  static displayEnemyHpMeter (currentEnemy) {
    let enemyHpPercent = currentEnemy.hp / currentEnemy.hpMax
    if (enemyHpPercent > 100) {
      enemyHpPercent = 100
    } else if (enemyHpPercent < 0) {
      enemyHpPercent = 0
    }

    let meterWidth = Math.floor(enemyHpPercent * currentEnemy.width)

    graphicSystem.fillRect(currentEnemy.x, currentEnemy.y + currentEnemy.height, currentEnemy.width, 2, 'red')
    graphicSystem.fillRect(currentEnemy.x, currentEnemy.y + currentEnemy.height, meterWidth, 2, 'green')
  }

  static displayDamageObject () {
    for (let i = 0; i < this.damageObject.length; i++) {
      let currentDamage = this.damageObject[i]

      currentDamage.display()
    }
  }

  static displayEffectObject () {
    // 참고: 이펙트는 투명도 70%가 적용됩니다. 100%은 눈아픔.
    graphicSystem.setAlpha(0.7)
    
    for (let i = 0; i < this.effectObject.length; i++) {
      let currentEffect = this.effectObject[i]

      currentEffect.display()
    }

    graphicSystem.setAlpha(1)
  }
}

export class fieldSystem {
  static fieldTime = {
    frame: 0,
    second: 0,
  }
  
  static isFieldStart = false
  static fieldStart () {
    if (!this.isFieldStart) {
      fieldState.playerObject.init()
      this.isFieldStart = true
    }
  }

  static processFieldTime () {
    this.fieldTime.frame++
    if (this.fieldTime.frame >= 60) {
      this.fieldTime.frame -= 60
      this.fieldTime.second++
    }
  }

  static process () {
    this.fieldStart()
    fieldState.process()
    this.processFieldTime()

    if (this.fieldTime.frame === 1 && fieldState.enemyObject.length < 10) {
      let enemyX = Math.random() * 300 + 200
      let enemyY = Math.random() * 200 + 100
      fieldState.createEnemyObject(ID.enemy.testAttack, enemyX, enemyY)
    }

  }

  static display () {
    fieldState.display()
    this.displayFieldData()
    graphicSystem.digitalFontDisplay('weapon count: ' + fieldState.weaponObject.length, 0, 0)
  }

  static displayFieldData () {
    const LAYER_Y = 570 + 5
    graphicSystem.digitalFontDisplay(`R:1-1, T:${this.fieldTime.second}/${132}`, graphicSystem.CANVAS_WIDTH_HALF + 5, LAYER_Y, 12, 20)
  }
}