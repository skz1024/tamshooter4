import { fieldState } from "./field.js"
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
    missileUp:11021,
    missileDown:11022,
  }
  
  static enemy = {
    unused:0,
    test:20001,
    testAttack:20002,
  }

  static effect = {
    missile:40000
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
  static EFFECT = 'effect'
}

/**
 * 충돌 감지 함수
 * @param {FieldData} object1 
 * @param {FieldData} object2 
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
 * 참고: 일부 오브젝트는 특이한 변수를 독자적으로 사용할 수 있습니다.  
 * 그러나 그것이 다른 오브젝트에게 영향을 주지 않고, 자바스크립트는 객체 속성 추가가 자유로우니 상관없습니다.  
 * 그리고, FieldState에서 사용하는 FieldObject는 FieldData에서 사용하는 변수와 완전히 일치합니다.
 * 따라서, data에서 사용하지 않는 변수들도 동시에 같이 사용함을 주의해주세요.
 */
export class FieldData {
  constructor () {
    /**
     * 오브젝트 타입 
     * 사용자가 중간에 수정하는 것은 불가능 (무조건 생성할 때 값이 정해짐)
     * 필드 상태에서 오브젝트 타입을 구분할 때 사용
     */ 
    this.objectType = objectType.FIELD
  
    /** 타입 세부 구분용 */ this.mainType = ''
    /** 타입 세부 구분용 */ this.subType = ''
    /** 타입 세부 구분용 Id (Id는 number 입니다.) */ this.id = ''

    /** x좌표 (소수점 허용, 그러나 계산과 출력은 정수) */ this.x = 0
    /** y좌표 (소수점 허용, 그러나 계산과 출력은 정수) */ this.y = 0
    /** z좌표 (이 게임은 z축 개념은 존재하나 일반적으로 사용하지 않음. 아직 사용 용도는 정하지 않음) */ this.z = 0

    /** 오브젝트의 가로 길이 */ this.width = 0
    /** 오브젝트의 세로 길이 */ this.height = 0
    /** 오브젝트의 현재 상태 (객체 형태, 외부에서 참조하지 마세요!), status랑 약간 다른 목적 */ this.state = ''

    /** 프레임당 x좌표 이동 속도 (소수점 허용) */ this.speedX = 0
    /** 프레임당 y좌표 이동 속도 (소수점 허용) */ this.speedY = 0
    /** 프레임당 z좌표 이동 속도 (소수점 허용), (z좌표는 일반적으로 사용하지 않습니다.) */ this.speedZ = 0
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
    /** 체력 최대치 (아직 사용용도 미정) */ this.hpMax = this.hp

    /** 지연시간 */ this.delay = 0
    /** 지연시간카운트(지연시간을 체크하는 용도로 사용) */ this.delayCount = 0
    
    /** (적을 죽였을 때 얻는)점수 */ this.score = 0

    /** 해당 오브젝트가 생성된 후 진행된 시간(단위: 프레임) */ this.elapsedFrame = 0

    /**
     * 만약 해당 오브젝트가 다른 오브젝트를 참고할 일이 있다면, 이 오브젝트에 다른 오브젝트의 정보를 저장합니다.  
     * 만약 그 다른 오브젝트의 isDelete 값이 true
     */
    this.targetObject = null

    /**
     * 만약, 이 값이 true라면, 해당 객체는 로직 처리가 끝난 후 필드에서 삭제됩니다.  
     * 데이터를 관리하는 곳에서, 필드 객체에 직접 개입 할 수 없기 때문에, 간접적으로 변수를 사용해
     * 필드에서의 삭제 여부를 판단합니다.
     */
    this.isDeleted = false

    // 에니메이션 용도
    /** 현재까지 진행된 에니메이션 총 프레임 */ this.enimationFrame = 0
  }

  /** 오브젝트의 로직 처리 함수 (각 객체마다 다름, 직접 구현 필요) */ process () {}
  /** 오브젝트의 이미지 출력 함수 (각 객체마다 다름, 직접 구현 필요) */ display () {}

  /** 
   * delayCount를 이용해 delay가 정해진 값을 초과했는지 확인합니다.
   * 이 함수를 사용한 시점에서,
   * delay가 정해진 값을 초과하면 true를 리턴하고 현재 delayCount를 0으로 만듭니다.
   */
  delayCheck () {
    if (this.delayCount >= this.delay) {
      this.delay = 0
      return true
    } else {
      return false
    }
  }

  /**
   * fieldState에서 사용하는 모든 오브젝트에 대한 공통 로직  
   * 이 함수를 재작성이 필요하다면, 이 함수(super.fieldProcess())를 반드시 호출해야합니다.
   */
  fieldProcess () {
    this.elapsedFrame++
    this.delayCount++
  }

  /**
   * fieldState에서 오브젝트를 클래스를 이용해 생성하면 좌표값은 0, 0이되기 때문에,
   * 원하는 좌표에 설정하기 위한 함수를 사용해 좌표를 정해주어야 합니다.
   * @param {number} x x좌표
   * @param {number} y y좌표
   * @param {number} z z좌표 (이 좌표는 일반적으로 사용하지 않습니다.)
   */
  setPosition (x, y, z = 0) {
    this.x = x
    this.y = y
    this.z = z
  }
}

class WeaponData extends FieldData {
  constructor () {
    super()
    /** 공격력(해당 오브젝트의 공격력) */ this.attack = 1
    /** 해당 객체의 기본 오브젝트 타입(임의 수정 불가능) */ this.objectType = objectType.WEAPON
    /** 지연시간(공격딜레이(단위: 프레임), 플레이어가 총알 한 발 발사하는 시간) */ this.delay = 0
    /** 플레이어 공격력에 따른 무기 공격력 배율, 100(%) = 플레이어 공격력과 동일 */ this.attackPercent = 100

    // 추적 오브젝트 여부
    /** 적을 추적하는지의 여부(데이터 객체에서 주로 사용) true일경우 적을 추적하는 무기임. */ this.isChaseType = false
    /** 추적 실패 횟수: 이 숫자는 추적할 적이 없을 때 과도한 추적 알고리즘 사용을 막기 위해 실행됨. */ this.chaseMissCount = 0
    /** 
     * 필드객체에서 사용하는 변수, 어떤 적을 추적하는지를 객체로 가져옴  
     * @type {FieldData} 
     */ 
    this.targetObject = null

    /** 공격 반복 횟수: 적을 여러번 때리거나, 또는 여러번 공격할 때 사용 */ this.repeatCount = 0
    /** 반복 딜레이 */ this.repeatDelay = 0
    /** 반복 딜레이를 세는 카운트 */ this.repeatDelayCount = 0
  }

  process () {
    this.x += this.speedX
    this.y += this.speedY

    this.repeatDelayCount++

    this.processChase()
    this.processAttack()

    if (this.repeatCount < 0 || this.elapsedFrame >= 300) {
      this.isDeleted = true
    }
  }

  /**
   * 무기 옵션을 설정합니다. (현재는 공격력만 수정할 수 있음.)
   * (플레이어의 공격력에 영향을 받기 때문에, 따로 설정해 주어야 합니다.)
   * @param {number} attack 무기 공격력 (플레이어의 공격력이 아닙니다!)
   */
  setOption (attack) {
    this.attack = attack
  }

  /**
   * 반복 딜레이 확인 함수
   */
  repeatDelayCheck () {
    if (this.repeatDelayCount >= this.repeatDelay) {
      this.repeatDelayCount = 0
      return true
    } else {
      return false
    }
  }

  /**
   * 무기가 적을 타격하여 데미지를 주는 함수입니다.  
   * 아직까지는, 무기의 공격력 만큼만 적의 체력을 감소시키는 역할만 합니다.  
   * 절대로, 다른 곳에서 적의 체력을 직접 감소시키지 마세요!
   * @param {FieldData} target 총돌한 객체(어떤게 충돌했는지는 field에서 검사합니다.)
   */
  damageProcess (target) {
    // 기본적으로 무기와 적의 충돌은 무기의 공격력 만큼 적의 체력을 감소합니다.
    let damage = this.attack
    if (damage < 1) {
      damage = 1
    }

    target.hp -= damage
    fieldState.createDamageObject(target.x, target.y, damage)
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
        this.damageProcess(currentEnemy)

        // 적을 공격 성공한 시점에서 충돌 처리 후 함수는 종료되고, 해당 객체는 즉시 삭제됩니다.
        // 자기 자신은 null을 해봤자 의미없으므로, isDelete변수값을 이용해 field에서 삭제되도록 합니다.
        this.isDeleted = true
        return 
      }
    }
  }

  /**
   * 추적에 관한 로직
   */
  processChase () {
    // 추적 타입이 아닌 경우 함수 종료 (아무것도 하지 않음)
    if (!this.isChaseType) return

    // 추적하는 오브젝트가 있을 경우
    if (this.targetObject != null) {
      // 추적하는 오브젝트가 있지만, 삭제된경우에는 해당 오브젝트를 더이상 추적하지 않고 함수를 종료
      if (this.targetObject.isDeleted) {
        this.targetObject = null
        return
      } else {
        // 그 외의 경우는 적을 정상적으로 추적
        this.processChaseEnemy()
      }
    } else {
      // 추적하는 오브젝트가 없을 경우 추적하는 오브젝트를 설정합니다.
      this.targetObject = fieldState.getRandomEnemyObject()
      this.isChasing = true
      this.chaseMissCount++ // 추적 미스카운트를 1추가

      // 참고로, chaseMissCount 숫자가 10이상일경우 해당 객체는 적을 더이상 추적하지 않습니다.
      if (this.chaseMissCount >= 10) {
        this.isChaseType = false
        this.isChasing = false
        this.speedX = 20
        this.speedY = 0
        return
      }
    }
  }

  /**
   * 적을 추적하는 함수를 상세 구현한 것
   */
  processChaseEnemy () {
    // 이 함수를 사용하기 전에 targetObject가 null이아님을 확인했으므로 여기서는 따로 null 검사를 하진 않습니다.
    // 현재 오브젝트와 타겟 오브젝트의 center(중심 좌표)를 계산하여 거리 차이를 알아냅니다.
    let targetCenterX = this.targetObject.x + Math.floor(this.targetObject.width / 2)
    let targetCenterY = this.targetObject.y + Math.floor(this.targetObject.height / 2)
    let centerX = this.x + Math.floor(this.width / 2)
    let centerY = this.y + Math.floor(this.height / 2)

    let distanceX = targetCenterX - centerX
    let distanceY = targetCenterY - centerY

    // 남은 거리의 1/10 만큼, 해당 오브젝트를 이동시킵니다.
    this.speedX = Math.floor(distanceX / 10)
    this.speedY = Math.floor(distanceY / 10)

    // 속도 보정
    if(this.speedX <= 0 && this.speedX > -4) {
      this.speedX = -4
    } else if(this.speedX > 0 && this.speedX < 4) {
      this.speedX = 4
    }

    if(this.speedY <= 0 && this.speedY > -4) {
      this.speedY = -4
    } else if(this.speedY > 0 && this.speedY < 4) {
      this.speedY = 4
    }

    // 적과의 거리가 짧을 경우, 강제로 해당 위치로 이동합니다.
    if(Math.abs(distanceX) <= 4) {
      this.x = targetCenterX
    }

    if(Math.abs(distanceY) <= 4) {
      this.y = targetCenterY
      this.speedY = 0
    }
  }

}

class MultyshotData extends WeaponData {
  constructor () {
    super()
    this.mainType = 'multyshot'
    this.subType = 'multyshot'
    this.id = ID.weapon.multyshot
    this.width = 10
    this.height = 4
    this.color = 'orange'

    this.moveX = 20
    this.moveY = 0
    this.speedX = 20
    this.speedY = 0
    this.direction = ''
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
    this.isChaseType = true
  }
}

class MissileData extends WeaponData {
  constructor () {
    super()
    this.mainType = 'missile'
    this.subType = 'missileA'
    this.id = ID.weapon.missile
    this.isChaseType = true
    this.width = 40
    this.height = 20
    this.speedX = 12
    this.repeatCount = 5
    this.repeatDelay = 5
    this.state = 'normal'
  }

  getSplashArea () {
    return {
      x: this.x - 50,
      y: this.y - 50,
      width: 100,
      height: 100
    }
  }

  display () {
    if (this.state === 'normal') {
      const IMAGE = imageFile.missile
      graphicSystem.imageDisplay(IMAGE, this.x, this.y)
    }
  }

  /**
   * 무기 공격 방식: 적과의 충돌 여부를 확인한 후, 스플래시 모드로 변경합니다.
   */
  processAttack () {
    if (this.state === 'normal') {
      this.processAttackNormal()
    } else if (this.state === 'splash' && this.repeatDelayCheck()) {
      this.processAttackSplash()
    }

    // 이 함수에서 무기가 삭제됨.
    this.repeatCountCheck()
  }

  /**
   * 반복카운트가 0이되면 모든 공격을 끝냈으므로, 더이상 무기의 효과를 발동시키지 않습니다.
   * 이것은, 반복카운트가 0이 됨을 체크하는 것입니다.
   */
  repeatCountCheck () {
    if (this.repeatCount <= 0) {
      this.isDeleted = true
    }
  }

  /**
   * 일반 공격에 대한 처리, 적을 타격하는 순간 스플래시 모드로 변경
   */
  processAttackNormal () {
    let enemyObject = fieldState.getEnemyObject()

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      // 각각의 적마다 충돌 검사
      if (collision(this, currentEnemy)) {
        // 하나라도 충돌했다면, 이 함수를 종료하고, 다음 프레임에서 스플래시공격을 함.
        // 그리고, 그 즉시 미사일은 움직이지 않습니다.
        this.state = 'splash'
        this.speedX = 0
        this.speedY = 0
        this.isChaseType = false
        return
      }
    }
  }

  /**
   * 스플래시 공격에 대한 로직 처리
   */
  processAttackSplash () {
    let enemyObject = fieldState.getEnemyObject()
    this.repeatCount--
    let splashArea = this.getSplashArea()
    fieldState.createEffectObject(ID.effect.missile, splashArea.x, splashArea.y)

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      // 각각의 적마다 충돌 검사
      if (collision(splashArea, currentEnemy)) {
        this.damageProcess(currentEnemy)
      }
    }
  }
}

class MissileUp extends MissileData {
  constructor () {
    super()
    this.subType = 'missileB'
    this.id = ID.weapon.missileUp
    this.isChaseType = false
    this.width = 40
    this.height = 20
    this.speedX = 10
    this.speedY = -2
    this.state = 'splashB'
    this.repeatDelay = 10
  }

  processAttack () {
    if (this.repeatDelayCheck()) {
      this.processAttackSplash()
    }

    this.repeatCountCheck()
  }

  display () {
    const IMAGE = imageFile.missileB
    const WIDTH = 40
    const HEIGHT = 20
    const ENIMATIONFRAME = this.enimationFrame % 3
    graphicSystem.imageDisplay(IMAGE, 0, ENIMATIONFRAME * HEIGHT, WIDTH, HEIGHT, this.x, this.y, WIDTH, HEIGHT)
  }
}

class MissileDown extends MissileUp {
  constructor () {
    super()
    this.speedY = 2
  }
}


/**
 * 플레이어 무기 데이터 (이 클래스는 static 클래스입니다.)  
 * 참고: 기본 스펙은 다음과 같습니다.  
 * 1초당 100% 공격력이 기준값  
 * 나머지 무기는 이 공격력 %를 바꿈으로써 밸런스를 조절할 계획  
 * 경고: 저 수치는 명시적인 수치이지만, create함수에서 무조건 참고하지 않을 수도 있음.
 */
 class PlayerWeaponData {
  /** 
   * 샷 한번 발사에 지연시간(프레임)  
   * 해당 프레임만큼 지연 후 다음 무기를 발사 할 수 있음.
   */
  static delay = 60

  /** 
   * 한번 무기를 발사할 때 동시에 발사되는 개수  
   * 2 이상일 경우, 동시에 2발을 발사한다는 뜻
   */ 
  static shotCount = 1

  /** 
   * 초당 공격력 반영 비율: 기본값 100%  
   * 참고: 최종 공격력은 소수점 버림하여 계산합니다.
   */ 
  static attackPercent = 100

  /**
   * 무기에 따른 공격횟수 (발사 횟수랑 다르고, 무기 객체가 공격하는 횟수임.)  
   * (명시적인 수치이나, 제작자의 실수로 로직과 다른 값이 명시될 수 있음.)
   */
  static attackCount = 1

  
  /**
   * 무기 생성 함수: 이 로직에서만 무기를 생성해 주세요.  
   * 그리고 무기 생성은 fieldState.createWeapon 함수를 사용합니다.  
   * 경고: 이 함수를 한번 사용했을 때 attackPercent만큼 공격력을 가진 무기 객체가 발사되어야 합니다.  
   * 즉 create함수가 무기를 1개 생성한다면, 생성한 무기의 공격력의 %는 100%가 되어야 합니다.
   */
  static create (attack, x, y) {}

  /**
   * 명시적인 수치를 기준으로 각 샷 공격력을 계산하는 함수  
   * 일반적인 경우는, 모든 샷의 공격력이 동일하지만, 일부 무기는 아닐 수도 있으며,
   * 이 경우 다른 방식으로 밸런스에 맞춰 계산해야 합니다.
   */
  static getShotAttack (baseAttack) {
    let secondPerCount = 60 / this.delay
    let totalMultiple = this.shotCount * this.attackCount
    let resultAttack = baseAttack / (secondPerCount * totalMultiple)
    return Math.floor(resultAttack)
  }

  static getShotMultipleAttack () {
    let secondPerCount = 60 / this.delay
    let totalMultiple = this.shotCount * this.attackCount
    return secondPerCount / totalMultiple
  }
}


class PlayerMultyshot extends PlayerWeaponData {
  static delay = 6
  static attackPercent = 100
  static shotCount = 5

  static create (attack, x, y) {
    // 샷 카운트: 5, 초당 10회 = 총 발사 수 50
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.multyshot, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshot, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshotSideUp, x, y - 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshotSideDown, x, y + 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshotHoming, x - 5, y, shotAttack)
  }
}

class PlayerMissile extends PlayerWeaponData {
  static delay = 30
  static attackPercent = 80
  static shotCount = 4
  static attackCount = 5

  static create (attack, x, y) {
    // 샷 카운트: 4, 초당 2회 = 총 발사 수 8
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.missile, x, y - 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.missile, x, y + 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.missileUp, x + 10, y - 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.missileDown, x + 10, y + 5, shotAttack)
  }
}



/**
 * 이펙트 데이터  
 * 기본 규칙: 이펙트는 한번만 모든 에니메이션 프레임을 번갈아 출력하고 사라집니다.  
 * 예를들어, missileEffect의 경우, 해당 이펙트는 총 10프레임이며, 이 10프레임이 전부 출력되면 그 다음 프레임에 사라집니다.
 */
class EffectData extends FieldData {
  constructor () {
    super()
    /** 에니메이션의 최대 프레임 */ this.maxFrame = 0
    /** 에니메이션의 반복 횟수 */ this.repeatCount = 0
    /** 현재 에니메이션의 프레임 번호 */ this.currentFrame = 0
    /** 
     * 이전 딜레이, 이펙트가 생성된 후 에니메이션이 재생되기 위한 대기시간,  
     * 만약 beforeAnimationDelay가 60이라면, 60frame(1초) 후에 이펙트의 에니메이션을 재생합니다.
     */ 
    this.beforeAnimationDelay = 0

    /**
     * 이후 딜레이, 이펙트의 에니메이션이 종료된 후 이 시간 후에 오브젝트가 삭제됩니다.  
     * 해당 이펙트는 마지막 프레임 모습을 한 상태로 정해진 시간 동안 남겨집니다.
     */
    this.afterAnimationDelay = 0

    /**
     * 다음 에니메이션 프레임으로 넘어가기 위한 지연시간(프레임), 기본값 0  
     * 간격이 0일경우 초당 60프레임, 1일경우 초당 30프레임, 2일경우 초당 20프레임
     */
    this.frameDelay = 0

    /**
     * 이미지 파일 내에 있는 각 애니메이션 프레임의 길이  
     * 이 값이 0일경우, 이미지 전체 길이를 출력한다.
     */
    this.frameWidth = 0

    /**
     * 이미지 파일 내에 있는 각 애니메이션 프레임의 높이
     * 이 값이 0일경우, 이미지 전체 높이를 출력한다.
     */
    this.frameHeight = 0

    /**
     * 이미지
     */
    this.image = null
  }

  setOption (width, height) {
    this.width = width
    this.height = height
  }

  process () {
    // beforeDelay가 남아있으면, 오브젝트는 표시되지만, 에니메이션은 재생되지 않습니다.
    // 그리고 로직 처리도 되지 않고 함수가 종료됩니다.
    if (this.beforeAnimationDelay >= 1) {
      this.beforeAnimationDelay--
      return
    }

    
    const MAX_FRAME = (this.maxFrame * (this.frameDelay + 1))
    const LAST_FRAME = MAX_FRAME - 1
    if (this.enimationFrame < LAST_FRAME) {
      // 에니메이션이 최대 프레임을 넘기지 않을경우, 에니메이션 프레임 증가
      this.enimationFrame++
    } else if (this.enimationFrame >= LAST_FRAME && this.afterAnimationDelay >= 1) {
      // 만약, 에니메이션 재생이 끝났다면, afterAnimationDelay가 있는지 확인하고, 
      // 있다면 해당 변수값을 감소시킴(그만큼 다음 작업이 지연됨)
      this.afterAnimationDelay--
    } else {
      // 에니메이션 작업이 끝났다면, 해당 객체는 삭제함.
      this.isDeleted = true
    }
  }

  display () {
    // 현재 프레임 값을 조사
    if (this.frameDelay == 0) {
      this.currentFrame = this.enimationFrame % this.maxFrame
    } else {
      this.currentFrame = Math.floor(this.enimationFrame / this.frameDelay) % this.maxFrame
    }

    // 그 다음에 이 함수를 사용해서 이미지를 출력해주세요.
    this.displayImage(null)
  }

  /**
   * 이미지를 출력하는 함수이고, display() 함수 내에서 추가로 호출됩니다.  
   * 참고: 각 프레임 이미지가 가변적일 경우, 이 함수를 사용하지 말고 커스텀 함수를 만들어 출력해야 합니다.  
   * 각 프레임 이미지가 고정적일때만 이 함수를 사용해주세요.
   * @param {Image} image 출력할 이미지
   * @param {number} currentFrame 출력할 현재 이미지의 프레임 번호
   */
  displayImage (image) {
    if (image == null) return

    let lineFrameCount = Math.floor(image.width / this.frameWidth)
    let positionNumberX = this.currentFrame % lineFrameCount
    let positionNumberY = Math.floor(this.currentFrame / lineFrameCount)

    graphicSystem.imageDisplay(image, positionNumberX * this.frameWidth, positionNumberY * this.frameHeight, this.frameWidth, this.frameHeight, this.x, this.y, this.width, this.height)
  }
}

class MissileEffect extends EffectData {
  constructor () {
    super()
    this.maxFrame = 10
    this.repeatCount = 0
    this.width = 100
    this.height = 100
    this.frameWidth = 20
    this.frameHeight = 20
  }

  display () {
    super.display()
    this.displayImage(imageFile.missileEffect)
  }
}

class EnemyData extends FieldData {
  constructor () {
    super()
    /**
     * 점수 공식에 대해: 기본적으로 적의 체력의 1/100 = 1%  
     * 다만 일부 적들은 다를 수 있음. 그건 각 적의 설명을 참고하세요.
     */
    this.score = 100
    this.isInited = false
    this.attack = 0

    /** 죽었는지 체크 */ this.isDied = false
    /** 죽은 후 삭제되기까지의 지연시간 */ this.dieAfterDeleteDelay = 0
    /** 죽은 후 삭제되기까지의 지연시간 카운트 */ this.dieAfterDeleteDelayCount = 0

    /** 
     * 충돌 지연시간  
     * (참고: 적이 플레이어에 닿았다면 60프레임 이후 다시 플레이어를 타격할 수 있습니다.) 
     */ 
    this.collisionDelay = 60
    /** 충돌 지연시간 카운트 */ this.collisionDelayCount = 60

    /**
     * 적이 화면 바깥 일정 영역을 넘어간다면, 제거 대기시간이 추가되고,
     * 일정 시간을 넘어가면 해당 적은 조건에 상관없이 강제로 사라집니다.
     * 기준값은 10초(600 프레임)입니다.
     */
    this.outAreaDeleteDelay = 600
    /** 적 영역 바깥으로 갈 때 제거 대기시간 카운트 */ this.outAreaDeleteDelayCount = 0

    /** 적이 화면 바깥으로 나갈 수 있는지의 여부 */ this.isPossibleExit = true

    /** 이미지 */ this.image = null
  }

  /** 
   * 적 오브젝트를 생성할 때 쓰이는 자동 초기화 함수  
   * 이 함수는 오브젝트를 생성한 직후 추가로 실행해 주세요. (생성자 안에다가 넣으면 제대로 초기화되지 않음.)
   * 사용용도: hpMax값 체크 (다만 이건 임시로 하는것.)
   */
  init () {
    // 초기화가 되었는데 또 초기화를 할 필요는 없잖아요? 무조건 함수 처리 취소
    if (this.isInited) return

    this.isInited = true
    this.hpMax = this.hp
  }

  process () {
    this.x += this.speedX
    this.y += this.speedY
    this.processPossibleExit()

    this.processPlayerCollision()

    // 적 죽었는지 체크
    this.processOutAreaCheck()
    this.processDieCheck()
    this.processDieAfter()
  }

  display () {
    if (this.image != null) {
      graphicSystem.imageDisplay(this.image, this.x, this.y)
    }
  }

  processPossibleExit () {
    // 적이 화면 바깥으로 나갈 수 없는 경우만 처리합니다.
    if (!this.isPossibleExit) {
      if (this.x < 0) {
        this.x = 0
        this.speedX = Math.abs(this.speedX)
      } else if (this.x > graphicSystem.CANVAS_WIDTH) {
        this.x = graphicSystem.CANVAS_WIDTH
        this.speedX = -Math.abs(this.speedX)
      }

      if (this.y < 0) {
        this.y = 0
        this.speedY = Math.abs(this.speedY)
      } else if (this.y > graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT
        this.speedY = -Math.abs(this.speedY)
      }
    }
  }

  processPlayerCollision () {
    this.collisionDelayCount++
    if (this.collisionDelayCount >= this.collisionDelay) {
      let player = fieldState.getPlayerObject()

      if (collision(this, player)) {
        player.addDamage(this.attack)
        this.collisionDelayCount = 0
      }
    }
  }

  processDieCheck () {
    if (this.isDied) return
    if (this.hp <= 0) {
      this.isDied = true
      fieldState.playerObject.addExp(this.score)
    }
  }

  processDieAfter () {
    if (this.isDied) {
      this.dieAfterDeleteDelayCount++
      if (this.dieAfterDeleteDelayCount >= this.dieAfterDeleteDelay) {
        this.isDeleted = true
      }
    }
  }

  processOutAreaCheck () {
    let player = fieldState.getPlayerObject()
    if (this.x <= player.x - 1600 
     || this.x >= player.x + 1600
     || this.y <= player.y - 1200
     || this.y >= player.y + 1200 ) {
      this.outAreaDeleteDelayCount++
    } else {
      this.outAreaDeleteDelayCount--
    }

    if (this.outAreaDeleteDelayCount >= this.outAreaDeleteDelay) {
      this.isDeleted = true
    }
  }
}


/**
 * 테스트용 적
 */
class TestEnemy extends EnemyData {
  constructor () {
    super()
    this.hp = 10000
    this.score = 100
    this.width = 48
    this.height = 48
    this.image = imageFile.enemyTemp
  }
}

class TestAttackEnemy extends EnemyData {
  constructor () {
    super()
    this.hp = 20000
    this.score = 400
    this.width = 48
    this.height = 48
    this.attack = 10
    this.isPossibleExit = false
    this.image = imageFile.enemyTemp
    this.speedX = -1
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

/**
 * tamshooter4의 데이터 모음  
 */
export class tamshooter4Data {

  /**
   * 플레이어 무기 데이터를 가져옵니다. 리턴되는 클래스는 static 클래스이므로, 따로 인스턴스를 생성하지 마세요.
   * @param {ID} id ID 클래스가 가지고 있는 상수 값을 넣어주세요.  
   * @returns {PlayerWeaponData} playerWeapon의 클래스, 값이 없다면 null
   */
  static getPlayerWeaponData (id) {
    switch (id) {
      case ID.playerWeapon.multyshot: return PlayerMultyshot
      case ID.playerWeapon.missile: return PlayerMissile
      default: return null
    }
  }

  /**
   * 무기 데이터 클래스를 가져옵니다. fieldState에서 사용하려면 따로 인스턴스를 생성해주세요.
   * @param {ID} weaponId ID 클래스가 가지고 있는 상수 값을 넣어주세요.
   * @returns {WeaponData}  weaponData 클래스, 만약 해당하는 값이 없다면 null
   */
  static getWeaponData (weaponId) {
    switch (weaponId) {
      case ID.weapon.multyshot: return MultyshotData
      case ID.weapon.multyshotHoming: return MultyshotHoming
      case ID.weapon.multyshotSideDown: return MultyshotSideDown
      case ID.weapon.multyshotSideUp: return MultyshotSideUp
      case ID.weapon.missile: return MissileData
      case ID.weapon.missileUp: return MissileUp
      case ID.weapon.missileDown: return MissileDown
      default: return null
    }
  }

  /**
   * 적 데이터를 가져옵니다.  
   * @param {ID} enemyId  ID 클래스가 가지고 있는 상수 값을 넣어주세요.
   * @returns {EnemyData} enemyData 클래스, 값이 없다면 null
   */
  static getEnemyData (enemyId) {
    switch (enemyId) {
      case ID.enemy.test: return TestEnemy
      case ID.enemy.testAttack: return TestAttackEnemy
      default: return null
    }
  }

  /**
   * 이펙트 데이터를 가져옵니다.  
   * ID 클래스가 가지고 있는 상수 값을 넣어주세요.
   * @param {ID} effectId 
   */
  static getEffectData (effectId) {
    switch (effectId) {
      case ID.effect.missile: return MissileEffect
    }
  }
}

