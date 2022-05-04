import { collision, fieldState } from "./field.js"
import { graphicSystem } from "./graphic.js"
import { imageFile } from "./image.js"

/**
 * 공통적으로 사용하는 객체 ID [주의: ID 값들은 실수로! 중복될 수 있음.]  
 * 가능하면, ID 값은 서로 달라야 합니다. (실수가 아니라면...)
 */
export class ID {
  static playerWeapon = {
    unused:0,
    multyshot:10000,
    missile:10001
  }

  static weapon = {
    unused:0,
    multyshot:11010,
    multyshotHoming:11011,
    multyshotSideUp:11012,
    multyshotSideDown:11013,
    missile:11020,
    missileB:11021,
  }
  
  static enemy = {
    unused:0,
    test:20001,
  }

  static effect = {

  }

  static sprite = {

  }
}

/**
 * 게임 field.js에서 사용하는 오브젝트 타입  
 * 절대로 string 값을 직접 넣지 말고, 이 상수 값을 사용하세요.  
 */
export class objectType {
  static FIELD = 'field'
  static WEAPON = 'weapon'
  static PLAYER = 'player'
  static PLAYER_WEAPON = 'playerWeapon'
  static ENEMY = 'enemy'
}


/**
 * 충돌 감지 함수 (참고: 이 함수는 field.js에 있는 collision 함수랑 동일, 일단 만일을 위해 이 함수를 남겨두었습니다.)
 * @param {FieldObject} object1 
 * @param {FieldObject} object2 
 
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
*/

export class FieldData {
  constructor () {
    /**
     * 오브젝트 타입 
     * 사용자가 직접 수정할 필요는 없음
     * 필드 시스템에서 오브젝트 타입을 구분할 때 사용
     */ 
    this.objectType = objectType.FIELD
  
    /** 타입 세부 구분용 */ this.mainType = ''
    /** 타입 세부 구분용 */ this.subType = ''
    /** 타입 세부 구분용 Id (Id는 number 입니다.) */ this.id = ''
    /** x좌표 (소수점 허용, 그러나 계산과 출력은 정수) */ this.x = 0
    /** y좌표 (소수점 허용, 그러나 계산과 출력은 정수) */ this.y = 0
    /** 오브젝트의 가로 길이 */ this.width = 0
    /** 오브젝트의 세로 길이 */ this.height = 0
    /** 오브젝트의 현재 상태 (객체 형태, 외부에서 참조하지 마세요!), status랑 약간 다른 목적 */ this.state = {}
    /** state설정: 가급적이면 오브젝트 형태로 설정해주세요. */ this.setState = function (stateObject) { this.state = stateObject }
    /** state가져오기 */ this.getState = function () { return this.state }
    /** 이제 더이상 객체가 이미지를 소유하지 않고, 외부에서 참조만 합니다. */ //this.image = null

    /** 프레임당 x좌표 이동 속도 (소수점 허용) */ this.speedX = 1
    /** 프레임당 y좌표 이동 속도 (소수점 허용) */ this.speedY = 0
    /** 이동 방향에 따른 이동 속도 x좌표 (소수점 허용) */ this.moveX = 1
    /** 이동 방향에 따른 이동 속도 y좌표[speedY랑 동일] (소수점 허용) */ this.moveY = 0
    /** 
    * 이동 방향 설정(left, right만 사용 가능) y좌표는 방향에 따른 영향 없음.  
    * left: + 일경우 왼쪽으로 이동, - 일경우 오른쪽으로 이동.   
    * right: + 일경우 오른쪽으로 이동, - 일경우 왼쪽으로 이동.  
    */ 
    this.direction = 'left'

    /** 공격력 */ this.attack = 0
    /** 방어력 */ this.defense = 0
    /** 체력 */ this.hp = 0
    /** 체력 최대치
     * (필드에서만 사용
     * 데이터는 어차피 체력 자체가 최대체력이랑 일치하므로 hp변수에다가 최대 체력을 대입하고, 
     * hpMax변수를 사용하지 않음.) 
     */ 
    this.hpMax = this.hp
    
    /** (적을 죽였을 때 얻는)점수 */ this.score = 0

    /** 해당 오브젝트가 생성된 후 진행된 시간 */ this.elapsedFrame = 0


    /**
     * 만약, 이 값이 true라면, 해당 객체는 로직 처리가 끝난 후 필드에서 삭제됩니다.  
     * 데이터를 관리하는 곳에서, 필드 객체에 직접 개입 할 수 없기 때문에, 간접적으로 변수를 사용해
     * 필드에서의 삭제 여부를 판단합니다.
     */
    this.isDelete = false

    // 에니메이션 용도
    /** 현재까지 진행된 에니메이션 총 프레임 */ this.enimationFrame = 0
  }

  /** 로직 처리 함수 */ process () {}
  /** 출력 함수 */ display () {}
  /** 특정 오브젝트랑 충돌했을 때 처리하는 로직 */ collisionProcess () {}
}

class WeaponData extends FieldData {
  constructor () {
    super()
    /** 해당 객체의 기본 오브젝트 타입(임의 수정 불가능) */ this.objectType = objectType.WEAPON
    /** 지연시간(공격딜레이(단위: 프레임), 플레이어가 총알 한 발 발사하는 시간) */ this.delay = 0
    /** 플레이어 공격력에 따른 무기 공격력 배율, 100% = 플레이어 공격력과 동일 */ this.attackPercent = 100

    /** 적을 추적중인 여부(필드 객체에서 주로 사용), true일경우 죽을 추적함. */ this.isChase = false
    /** 적을 추적하는지의 여부(데이터 객체에서 주로 사용) true일경우 적을 추적하는 무기임. */ this.isChaseType = false
    /** 필드객체에서 사용하는 변수, 어떤 적을 추적하는지를 객체로 가져옴 */ this.targetObject = null
  }

  process () {
    this.x += this.speedX
    this.y += this.speedY

    this.processAttack()
  }

  /**
   * 무기가 적 또는 무언가에 충돌했을 때 처리하는 함수
   * @param {FieldData} target 총돌한 객체(어떤게 충돌했는지는 field에서 검사합니다.)
   */
  collisionProcess (target) {
    // 기본적으로 무기와 적의 충돌은 무기의 공격력 만큼 적의 체력을 감소합니다.
    const damage = this.attack
    target.hp -= damage

    // 그 후, 해당 무기 객체는 삭제처리 됩니다.
    // 자기 자신은 null을 해봤자 의미없으므로, isDelete변수값을 이용해 field에서 삭제되도록 합니다.
    this.isDelete = true
  }

  /**
   * 무기는 적 오브젝트를 공격합니다. 이것은 무기와 적과의 상호작용을 처리하는 함수입니다.  
   * 충돌 감지 함수는 field.js에서 사용하는것을 사용합니다.  
   * process는 무기의 로직 처리이고, attackProcess는 무기가 적을 공격하기 위한 로직을 작성합니다.
   */
  processAttack () {
    let enemyObject = fieldState.getEnemyObject()

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      // 각각의 적마다 충돌 검사
      if (collision(this, currentEnemy)) {
        // 충돌한 경우, 충돌한 상태에서의 로직을 처리
        this.collisionProcess(currentEnemy)
      }
    }
  }
}

class PlayerWeaponData {
  constructor () {
    /** 지연시간 */ this.delay = 60
    /** 공격력 반영 비율: 기본값 100%, 경고: 소수점은 버림 */ this.attackPercent = 100
  }

  /**
   * 무기 생성 함수: 이 로직에서만 무기를 생성해 주세요.
   */
  create () {}
}


class EnemyData extends FieldData {
  constructor () {
    super()
    this.hp = 10000
    
    /**
     * 점수 공식에 대해: 기본적으로 적의 체력의 1/100 = 1%  
     * 다만 일부 적들은 다를 수 있음. 그건 각 적의 설명을 참고하세요.
     */
    this.score = 100
  }
}

class PlayerMultyshot extends PlayerWeaponData {
  constructor () {
    super()
    this.delay = 60
    this.attackPercent = 100
  }

  create (attack, x, y) {
    super.create()
    fieldState.createWeaponObject(ID.weapon.multyshot, x, y, attack)
  }
}

class PlayerMissile extends PlayerWeaponData {

}





class MultyshotData extends WeaponData {
  constructor () {
    super()
    this.mainType = 'multyshot'
    this.subType = 'multyshot'
    this.id = ID.weapon.multyshot
    this.delay = 6 // 초당 10발
    this.attack = 100
    this.attackPercent = 100 // 캐릭터 공격력의 100% 배율 적용
    this.width = 20
    this.height = 8
    this.color = 'orange'

    this.moveX = 10
    this.moveY = 0
    this.speedX = 10
    this.speedY = 0
    this.direction = ''
  }

  process () {
    this.x += this.speedX
    this.y += this.speedY
  }

  display () {
    const IMAGE = imageFile.multyshot
    const SHOT_WIDTH = 40
    const SHOT_HEIGHT = 8
    const SHOT_LAYER_Y = 10

    switch (this.color) {
      case 'green':
        graphicSystem.imageDisplay(IMAGE, 0, SHOT_LAYER_Y * 1, SHOT_WIDTH, SHOT_HEIGHT, this.x, this.y, SHOT_WIDTH, SHOT_HEIGHT)
        break
      case 'blue':
        graphicSystem.imageDisplay(IMAGE, 0, SHOT_LAYER_Y * 2, SHOT_WIDTH, SHOT_HEIGHT, this.x, this.y, SHOT_WIDTH, SHOT_HEIGHT)
        break
      case 'orange':
      default:
        graphicSystem.imageDisplay(IMAGE, 0, 0, SHOT_WIDTH, SHOT_HEIGHT, this.x, this.y, SHOT_WIDTH, SHOT_HEIGHT)
        break
    }
  }
}

class MultyshotSideUp extends MultyshotData {
  constructor () {
    super()
    this.color = 'green'
    this.speedY = 2
  }
}

class MultyshotSideDown extends MultyshotData {
  constructor () {
    super()
    this.color = 'green'
    this.speedY = -2
  }
}

class MultyshotHoming extends MultyshotData {
  constructor () {
    super()
    this.color = 'blue'
    this.isChase = true
  }

  process () {
    if (this.targetObject == null) {
      // set retry target
      // if fail... no chase mode
      this.isChase = false
      super.process()
    } else {
      let distanceX = this.x - this.targetObject.x
      let distanceY = this.y - this.targetObject.y
    }
  }
}

class MissileData extends WeaponData {
  constructor () {
    super()
    this.mainType = 'missile'
    this.subType = 'missileA'
    this.attack = 100
    this.attackPercent = 100
    this.id = ID.weapon.missile
    this.isChase = true
    this.width = 40
    this.height = 20
  }

  display () {
    const IMAGE = imageFile.missile
    graphicSystem.imageDisplay(IMAGE, this.x, this.y)
  }

  process () {
    // if (this.stat)

    if (this.targetObject != null) {

    } else {
      super.process()
    }
  }

  /**
   * 무기 공격 방식: 적과의 충돌 여부를 확인한 후, 스플래시 모드로 변경합니다.
   * @param {FieldData[]} enemyObject 
   */
  processAttack (enemyObject) {

  }

  /**
   * 
   * @param {FieldData[]} enemyObject 
   */
  collisionProcess (enemyObject) {
    
  }
}

class MissileB extends MissileData {
  constructor () {
    super()
    this.subType = 'missileB'
    this.attack = 100
    this.attackPercent = 100
    this.id = ID.weapon.missileB
    this.isChase = false
    this.width = 40
    this.height = 20
  }

  process () {
    super.process()
    this.enimationFrame++
  }

  display () {
    const IMAGE = imageFile.missileB
    const WIDTH = 40
    const HEIGHT = 20
    const ENIMATIONFRAME = this.enimationFrame % 3
    graphicSystem.imageDisplay(IMAGE, 0, ENIMATIONFRAME * HEIGHT, WIDTH, HEIGHT, this.x, this.y, WIDTH, HEIGHT)
  }
}




/**
 * 테스트용 적
 */
class TestEnemy extends EnemyData {
  constructor () {
    super()
    this.hp = 2000
    this.score = 0
    this.width = 48
    this.height = 48
  }

  display () {
    const IMAGE = imageFile.enemyTemp
    graphicSystem.imageDisplay(IMAGE, this.x, this.y)
  }
}

class Donggeurami extends EnemyData {
  constructor () {
    super()
    this.hp = 10000
    this.score = 1000
    this.width = 48
    this.height = 48
  }

  display () {
    const IMAGE = imageFile.enemyTemp
    graphicSystem.imageDisplay(IMAGE, this.x, this.y)
  }
}


export class tamshooter4Data {
  static playerWeaponData = {
    multyshot: new PlayerMultyshot()
  }

  static weaponData = {
    multyshot: new MultyshotData(),
    multyshotHoming: new MultyshotHoming(),
    multyshotSideDown: new MultyshotSideDown(),
    multyshotSideUp: new MultyshotSideUp(),
    missile: new MissileData(),
    missileB: new MissileB(),
  }

  static enemyData = {
    test: new TestEnemy(),
  }

  /**
   * 플레이어 무기 데이터를 가져옵니다.
   * ID 클래스가 가지고 있는 상수 값을 넣어주세요.  
   * @param {ID} id 
   */
  static getPlayerWeaponData (id) {
    switch (id) {
      case ID.playerWeapon.multyshot: return this.playerWeaponData.multyshot
      default: return null
    }
  }

  /**
   * 무기 데이터를 가져옵니다.  
   * ID 클래스가 가지고 있는 상수 값을 넣어주세요.
   * @param {ID} weaponId 
   * @returns weaponData class, 만약 해당하는 값이 없다면 null
   */
  static getWeaponData (weaponId) {
    switch (weaponId) {
      case ID.weapon.multyshot: return this.weaponData.multyshot
      case ID.weapon.multyshotHoming: return this.weaponData.multyshotHoming
      case ID.weapon.multyshotSideDown: return this.weaponData.multyshotSideDown
      case ID.weapon.multyshotSideUp: return this.weaponData.multyshotSideUp
      case ID.weapon.missile: return this.weaponData.missile
      case ID.weapon.missileB: return this.weaponData.missileB
      default: return null
    }
  }

  static getEnemyData (enemyId) {
    switch (enemyId) {
      case ID.enemy.test: return this.enemyData.test
      default: return null
    }
  }
}

