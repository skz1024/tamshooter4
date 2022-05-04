import { buttonSystem } from "./control.js"
import { FieldData, ID, objectType, tamshooter4Data } from "./data.js"
import { graphicSystem } from "./graphic.js"
import { imageFile } from "./image.js"
import { userSystem } from "./tamshooter4.js"
import { systemText } from "./text.js"


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
 * 충돌 감지 함수
 * @param {FieldObject} object1 
 * @param {FieldObject} object2 
 */
export function collision (object1, object2) {
  if(object1.x < object2.x + object2.width
    && object1.x + object1.width > object2.x
    && object1.y < object2.y + object2.height
    && object1.y + object1.height > object2.y) {
    return true
  } else {
    return false
  }
}



/**
 * 필드 오브젝트 (인터페이스 클래스)
 * 참고: data.js의 FieldData랑 구조가 완전히 동일합니다.
 */
class FieldObject extends FieldData {
  constructor (constObjectType, typeId, x, y) {
    super()

    // 오브젝트 타입과 타입ID에 따라서, 거기에 맞는 객체를 생성합니다.
    /** 
     * @type {FieldData}
     */ 
    let getClass = null
    
    switch (constObjectType) {
      case objectType.WEAPON: 
        getClass = tamshooter4Data.getWeaponData(typeId)
        break
      case objectType.ENEMY: 
        getClass = tamshooter4Data.getEnemyData(typeId)
        break
      case objectType.PLAYER:
        // PLAYER는 따로 객체 설정을 하지 않습니다.
        return
      default: 
        console.warn(systemText.fieldError.DIFFERENT_OBJECT_TYPE) 
        return
    }

    if (getClass == null) return

    // 좌표 설정 및 속도 설정
    // 오브젝트에 있는 값들을 전부 복사하지는 않습니다. 필요한 것만 값 복사를 합니다.
    this.x = x
    this.y = y
    this.speedX = getClass.speedX
    this.speedY = getClass.speedY
    this.moveX = getClass.moveX
    this.moveY = getClass.moveY

    // 메인 타입 및 스탯 정보
    this.objectType = getClass.objectType
    this.mainType = getClass.mainType
    this.subType = getClass.subType
    this.color = getClass.color
    this.width = getClass.width
    this.height = getClass.height
    this.attack = getClass.attack
    this.hp = getClass.hp
    this.hpMax = getClass.hp


    // 처리 함수 대입 (data.js에 있는 알고리즘을 직접 사용합니다.)
    // (다만, call을 사용하지 않으면 현재 객체가 아닌, data의 객체 값을 변경하기 때문에, 
    // 이와 같은 함수를 불러올 때는 process.call(this) 와 같이 사용해주어야 합니다.)
    this.process = getClass.process
    this.display = getClass.display
    this.collisionProcess = getClass.collisionProcess
    this.processAttack = getClass.processAttack
    
  }

  /** 
   * 외부[data.js]에서 가져오는 함수가 아닌, field에서 자체적으로 처리하는 함수입니다.  
   * field에서만 처리해야 하는 로직이 있을 때 사용합니다. (예를 들어 특정 조건에서 오브젝트 삭제하기 등..., 적 체력 0 이하일때 적 죽이기등....)
   */
  fieldProcess () {
    this.elapsedFrame++
  }
}

/**
 * 플레이어의 무기 오브젝트 (참고: 무기 = 총알, 다만 이 게임에서는 무기로 취급)
 */
class WeaponObject extends FieldObject {
  constructor (typeId, x, y, attack) {
    super(objectType.WEAPON, typeId, x, y)
    this.attack = attack
  }
}

/**
 * 적 오브젝트, 플레이어는 적을 죽일 수 있습니다.
 */
class EnemyObject extends FieldObject {
  constructor (typeId, x, y) {
    super(objectType.ENEMY, typeId, x, y)
  }

  fieldProcess () {
    super.fieldProcess()

    if (this.hp <= 0) {
      this.isDelete = true
    }
  }
}

/**
 * 이펙트 오브젝트: 이펙트를 표시할 때 사용, 다른 오브젝트랑 상호작용하지 않음.
 */
class EffectObject extends FieldObject {
  
}

class DamageObject extends FieldObject {

}


/**
 * 플레이어 오브젝트  
 * 플레이어를 직접 조종합니다.
 */
class PlayerObject extends FieldObject {
  /** 플레이어 이미지 */ playerImage = imageFile.playerImage

  constructor () {
    super(objectType.PLAYER, 0, 300, 200)
    this.width = this.playerImage.width // 40
    this.height = this.playerImage.height // 20

    this.shield = 0
    this.shieldMax = 0
  }

  init () {
    this.x = 300
    this.y = 200
    
    const getData = userSystem.getPlayerObjectData()
    this.attack = getData.attack
    this.hp = getData.hp
    this.shield = getData.shield
    this.shieldMax = getData.shieldMax
  }

  process () {
    let buttonLeft = buttonSystem.getButtonDown(buttonSystem.BUTTON_LEFT)
    let buttonRight = buttonSystem.getButtonDown(buttonSystem.BUTTON_RIGHT)
    let buttonUp = buttonSystem.getButtonDown(buttonSystem.BUTTON_UP)
    let buttonDown = buttonSystem.getButtonDown(buttonSystem.BUTTON_DOWN)

    if (buttonLeft) this.x -= 8
    if (buttonRight) this.x += 8
    if (buttonDown) this.y += 8
    if (buttonUp) this.y -= 8
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
  /** @type {WeaponObject[]} */ static weaponObject = []
  /** @type {EnemyObject[]} */ static enemyObject = []
  /** @type {EffectObject[]} */ static effectObject = []
  /** @type {DamageObject[]} */ static damageObject = []

  static getPlayerObject () { return this.playerObject }
  static getPlayerWeaponObject () { return this.weaponObject }
  static getEnemyObject () { return this.enemyObject }
  static getEffectObject () { return this.effectObject }
  static getDamageObject () { return this.damageObject }

  /**
   * 필드상태에 새로운 객체를 생성합니다.  
   * [playerObject는 생성 불가]
   * @param {string} constObjectType data.js 파일에 있는 objectType 클래스의 상수. string 값을 직접 넣지 마세요. 무조건, objecrType.FIELD 와 같은 형태로 값을 넣어야 합니다.
   * @param {number} typeId data.js 파일에 있는 ID 클래스 내에 있는 상수 값을 넣어주세요.
   * @param {number} x 생성할 x좌표
   * @param {number} y 생성할 y좌표
   * @param {etc}
   */
  static create (constObjectType, typeId, x, y, ...etc) {
    switch (constObjectType) {
      case objectType.WEAPON:
        this.weaponObject.push(new WeaponObject(typeId, x, y, ...etc))
        break
      case objectType.ENEMY:
        this.enemyObject.push(new EnemyObject(typeId, x, y))
        break
    }
  }

  static createWeaponObject (typeId, x, y, attack) {
    this.create(objectType.WEAPON, typeId, x, y, attack)
  }
  
  static createEnemyObject (typeId, x, y) {
    this.create(objectType.ENEMY, typeId, x, y)
  }

  static process () {
    this.processPlayerObject()
    this.processWeaponObject()
    this.processEnemyObject()
  }

  static processPlayerObject () {
    this.playerObject.process()
  }

  static processWeaponObject () {
    for (let i = 0; i < this.weaponObject.length; i++) {
      let currentObject = this.weaponObject[i]
      currentObject.process.call(currentObject)
      currentObject.fieldProcess()
      currentObject.processAttack.call(currentObject)

      if (currentObject.isDelete) {
        this.weaponObject.splice(i, 1)
      }
    }
  }

  static processEnemyObject () {
    for (let i = 0; i < this.enemyObject.length; i++) {
      let currentObject = this.enemyObject[i]
      currentObject.process.call(currentObject)
      currentObject.fieldProcess()
      
      if (currentObject.isDelete) {
        this.enemyObject.splice(i, 1)
      }
    }
  }

  static display () {
    this.displayPlayerObject()
    this.displayWeaponObject()
    this.displayEnemyObject()
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

      currentEnemy.display.call(currentEnemy)
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

    if (this.fieldTime.frame === 1 && fieldState.weaponObject.length < 100) {
      tamshooter4Data.getPlayerWeaponData(ID.playerWeapon.multyshot).create(fieldState.playerObject.attack, fieldState.playerObject.x, fieldState.playerObject.y)
    }

    if (this.fieldTime.frame === 1 && fieldState.enemyObject.length < 10) {
      let enemyX = Math.random() * 300 + 200
      let enemyY = Math.random() * 200 + 100
      fieldState.createEnemyObject(ID.enemy.test, enemyX, enemyY)
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