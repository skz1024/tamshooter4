import { DelayData, FieldData, EnimationData, collision, collisionClass } from "./dataField.js"
import { graphicSystem } from "./graphic.js"
import { soundFile, soundSystem } from "./sound.js"
import { EffectData, CustomEffect, CustomEditEffect } from "./dataEffect.js"
import { ID } from "./dataId.js"
import { fieldState, fieldSystem } from "./field.js"
import { imageDataInfo, imageFile } from "./image.js"

export class EnemyData extends FieldData {
  constructor () {
    super()
    /**
     * 점수 공식에 대해: 미정 (일단, 적 체력의 1% 인데 이게 확실한것이 아님)
     * 다만 일부 적들은 다를 수 있음. 그건 각 적의 설명을 참고하세요.
     */
    this.score = 100
    this.isAfterInited = false
    this.attack = 0

    this.moveDirectionX = 'left'

    /** 죽었는지 체크 */ this.isDied = false
    /**
     * 죽은 후 삭제되기까지의 지연시간
     * @type {DelayData}
     */
    this.dieAfterDeleteDelay = null

    /**
     * 충돌 지연시간
     * (참고: 적이 플레이어에 닿았다면 60프레임 이후 다시 플레이어를 타격할 수 있습니다.)
     * @type {DelayData}
     */
    this.collisionDelay = new DelayData(60)
    this.collisionDelay.count = this.collisionDelay.delay / 2 // 생성하자마자 즉시 공격하게끔 만듬 그러나 약간의 지연시간은 존재

    /**
     * 적이 화면 바깥 일정 영역을 넘어간다면, 제거 대기시간이 추가되고,
     * 일정 시간을 넘어가면 해당 적은 조건에 상관없이 강제로 사라집니다.
     * 기준값은 5초(300 프레임)입니다.
     * 참고로 이 변수의 check 함수를 사욯라 때 인수값으로 (reset: false, countUp: false) 를 넣어주세요.
     * @type {DelayData}
     */
    this.outAreaDeleteDelay = new DelayData(300)

    /** 적이 화면 바깥으로 나갈 수 있는지의 여부 */ this.isPossibleExit = true
    /** 적이 나간다면 위치가 리셋되는지의 여부 */ this.isExitToReset = false

    /** 이미지 */ this.image = null

    /** 
     * 적이 죽으면 나오는 사운드. (isDied가 true이면 dieCheck 함수에서 발동) 
     * 현재는 적만 이 사운드를 가지고 있음.
     * @type {soundFile} soundFile 객체 내에 있는 변수
     * */ 
    this.dieSound = null

    /**
     * 적이 죽을경우 나오는 이펙트. 커스텀 이펙트 데이터를 사용하여 제작,
     * 이 클래스를 사용할 때, 해당 객체의 이미지 데이터가 아닌 죽는 이미지 데이터를 사용해주어야 합니다.
     * @type {CustomEffect}
     */
    this.dieEffect = null

    /**
     * 기준 전투력 (해당 적 계열에 대해서)
     * 
     * 이 값은, 적 개별로 설정하지 않고, 각 그룹별로 묶어서 처리합니다.
     * 
     * 그러니까, spaceEnemy 인경우 해당 그룹의 적은 baseCp 가 40000으로 지정되고, 
     * 이렇게 한 후 적 스탯을 hp 비율만큼 자동 설정해서 수동으로 설정하는 불편함을 제거할 목적으로 만든 스탯입니다.
     */
    this.baseCp = 10000
  }

  /**
   * 충돌 영역 얻기.
   * 무기와 다르게 적의 충돌 영역은 여러개입니다. 물론 하나일 수도 있습니다.
   * 충돌 영역은 배열로 리턴되므로 참고해주세요.
   * 충돌 영역은 이 함수를 재정의해서 설정해주세요.
   * 다만, 이 방식은 회전한 사각형을 판정할 순 없기 때문에, 회전한 사각형까지 판정하려면 다른 함수를 사용해야 합니다.
   * 그러나, 이것은 일부 적에 한정되는 상황이므로, 해당하는 일부 적의 알고리즘을 살펴봐주세요.
   * @returns {{x: number, y: number, width: number, height: number}[]} 객체의 영역
   */
  getCollisionArea () {
    return [{
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }]
  }

  /**
   * 적의 스탯을 설정합니다. (수동 방식)
   * 
   * 이 함수는, 가급적이라면, 적의 스탯을 수동으로 지정해야 할 때만 사용해주세요.
   * setEnemyByCpStat함수 사용을 권장합니다.
   * @param {number} hp 체력
   * @param {number} score 점수 (기본적으로 체력 100당 1점으로 생각합니다.)
   * @param {number} attack 공격력
   */
  setEnemyStat (hp = 1, score = 0, attack = 0) {
    this.hp = hp
    this.hpMax = hp
    this.score = score
    this.attack = attack
  }

  /**
   * 적의 스탯의 기준을 지정해 설정합니다. (자동 방식) - 소수점은 무시됩니다.
   * 
   * 적의 스탯을 baseCp 기준으로 퍼센테이지를 정해서 결정합니다. 이렇게 하는 이유는,
   * baseCp가 나누어 떨어지지 않는 수라면, 스탯을 수동으로 계산하기 너무 힘들기 때문에, 이 기능을 자동화 하였습니다.
   * 
   * 참고로 setEnemyStat과는 구조가 다르므로 주의해주세요.
   * 만약 당신이 적의 점수와 hp의 관계를 수동으로 설정해야 한다면 이 함수보다는 setEnemyStat 함수를 사용해야 합니다.
   * 
   * @param {number} hpPercent baseCp(기준 전투력)의 퍼센트, cp가 40000이면 hpPercent가 10일 때 체력은 4000으로 지정
   * @param {number} attack 공격력
   * @param {number} hpDivScore hp를 나누는 점수량의 기준, 기본값은 100 (즉, 100당 1점이란 뜻) 이 숫자가 커지면 점수량이 낮아집니다.
   */
  setEnemyByCpStat (hpPercent = 10, attack = 0, hpDivScore = 100) {
    let hpValue = Math.floor((this.baseCp * hpPercent) / 100)
    let scoreValue = Math.floor(hpValue / hpDivScore)

    this.hp = hpValue
    this.hpMax = hpValue
    this.score = scoreValue
    this.attack = attack
  }

  /**
   * 적 죽음 사운드와 적 죽음 이펙트를 설정합니다. 이펙트는 반드시 CustomEffectData 클래스로 생성해야 합니다.
   * @param {HTMLAudioElement} dieSound 
   * @param {CustomEffect} dieEffect 
   */
  setDieEffectOption (dieSound, dieEffect = null) {
    if (dieEffect != null && dieEffect.constructor != CustomEffect) {
      console.warn('경고: dieEffect는 CustomEffectData 클래스를 사용해 데이터를 생성해야 합니다.')
    }
  
    this.dieSound = dieSound
    this.dieEffect = dieEffect
  }

  process () {
    this.afterInitProcess()

    // 적이 죽지 않았을 때 적과 관련된 행동 처리
    if (!this.isDied) {
      this.processMove()
      this.processPossibleExit()
      this.processExitToReset()
      this.processPlayerCollision()
      this.processEnimation()
      this.processAttack()
    }

    // 적 죽었는지 체크
    this.processOutAreaCheck()
    this.processDie()
    this.processDieAfter()
  }

  /**
   * 적이 나갈 수 있는지에 대한 함수 로직
   */
  processPossibleExit () {
    if (this.isPossibleExit) return // 적이 화면 바깥으로 나갈 수 없는 경우만 처리합니다. 그래서 나갈 수 있으면 함수 종료

    // 방향이 있을 때는, 방향만 변경하지만, 방향이 없을때는, 속도값을 반전시킵니다.
    // 만약 정해진 범위가 이미 벗어나있는 상태라면, 범위 안으로 강제로 들어옵니다.
    // 이동속도가 0이라면, 방향 무시하고 강제로 좌표를 이동시킵니다.
    if (this.x < 0) {
      this.x = 0
      if (this.moveDirectionX === 'left') {
        this.moveDirectionX = 'right'

        // 만약, 속도값이 음수라면, 속도 방향에 맞게 움직이게끔, 속도를 양수로 변경
        // 이후 적용되는 코드들도 설명은 동일
        if (this.moveSpeedX < 0) this.moveSpeedX = Math.abs(this.moveSpeedX)
      } else if (this.moveDirectionX === 'right' && this.moveSpeedX > 0) {
        this.moveDirectionX = 'left'
        if (this.moveSpeedX < 0) this.moveSpeedX = Math.abs(this.moveSpeedX)
      } else {
        this.moveSpeedX = Math.abs(this.moveSpeedX)
      }

      if (this.moveSpeedX === 0 || this.moveSpeedX === 0) {
        this.x++
      }
    } else if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
      this.x = graphicSystem.CANVAS_WIDTH - this.width
      if (this.moveDirectionX === 'left') {
        this.moveDirectionX = 'right'
        if (this.moveSpeedX < 0) this.moveSpeedX = Math.abs(this.moveSpeedX)
      } else if (this.moveDirectionX === 'right') {
        this.moveDirectionX = 'left'
        if (this.moveSpeedX < 0) this.moveSpeedX = Math.abs(this.moveSpeedX)
      } else {
        this.moveSpeedX = -Math.abs(this.moveSpeedX)
      }

      if (this.moveSpeedX === 0 || this.moveSpeedX === 0) {
        this.x--
      }
    }

    if (this.y < 0) {
      this.y = 0
      if (this.moveDirectionY === 'up') {
        this.moveDirectionY = 'down'
        if (this.moveSpeedY < 0) this.moveSpeedX = Math.abs(this.moveSpeedY)
      } else if (this.moveDirectionY === 'down') {
        this.moveDirectionY = 'up'
        if (this.moveSpeedY < 0) this.moveSpeedX = Math.abs(this.moveSpeedY)
      } else {
        this.moveSpeedY = Math.abs(this.moveSpeedY)
      }

      if (this.moveSpeedY === 0 || this.moveSpeedY === 0) {
        this.y++
      }
    } else if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
      this.y = graphicSystem.CANVAS_HEIGHT - this.height
      if (this.moveDirectionY === 'up') {
        this.moveDirectionY = 'down'
        if (this.moveSpeedY < 0) this.moveSpeedX = Math.abs(this.moveSpeedY)
      } else if (this.moveDirectionY === 'down') {
        this.moveDirectionY = 'up'
        if (this.moveSpeedY < 0) this.moveSpeedX = Math.abs(this.moveSpeedY)
      } else {
        this.moveSpeedY = -Math.abs(this.moveSpeedY)
      }

      if (this.moveSpeedY === 0 || this.moveSpeedY === 0) {
        this.y--
      }
    }
  }

  /**
   * 나가면 적 위치를 다시 재조정
   */
  processExitToReset () {
    if (!this.isExitToReset) return // 적이 나가면 리셋되지 않는경우 함수 종료

    // 참고: 감지 영역과 이동 위치가 일치하면, 맨 위와 맨 아래를 왔다갔다 할 수 있으므로 주의해주세요.
    const scopeSize = 100 // 감지 영역
    const moveAdjust = scopeSize / 2 // 이동 위치 조정

    // 이동 방향이 왼쪽이거나, speedX값이 음수이면, 왼쪽 영역 바깥으로 이동하는것입니다. 반대 방향도 마찬가지
    if ((this.moveSpeedX < 0 || this.moveDirectionX === 'left') && this.x + this.width < -scopeSize) {
      this.x = graphicSystem.CANVAS_WIDTH + this.width + moveAdjust
    } else if ((this.moveSpeedX > 0 || this.moveDirectionX === 'right') && this.x > graphicSystem.CANVAS_WIDTH + scopeSize) {
      this.x = 0 - this.width - moveAdjust
    }

    if ((this.moveSpeedY < 0 || this.moveDirectionY === 'up') && this.y + this.height < -scopeSize) {
      this.y = graphicSystem.CANVAS_HEIGHT + this.height + moveAdjust
    } else if ((this.moveSpeedY > 0 || this.moveDirectionY === 'down') && this.y > graphicSystem.CANVAS_HEIGHT + scopeSize) {
      this.y = 0 - this.height - moveAdjust
    }
  }

  /**
   * 만약 적이 공격해야 할 일이 있다면 이 함수를 작성해주세요.
   * 다만 대부분의 적들은 공격을 하지 않고 충돌만 합니다. (참고로 충돌데미지와 공격데미지는 별개입니다.)
   */
  processAttack () {

  }

  /**
   * 플레이어와의 충돌 함수
   * 참고: 적이 플레이어랑 부딪힌다면 1초 후에 다시 공격할 수 있습니다.
   */
  processPlayerCollision () {
    if (this.collisionDelay.check(false)) {
      const player = fieldState.getPlayerObject()
      const enemy = this.getCollisionArea() // 적은 따로 충돌 영역을 얻습니다.

      for (let i = 0; i < enemy.length; i++) {
        if (collision(enemy[i], player)) {
          player.addDamage(this.attack)
          this.collisionDelay.count = 0 // 플레이어랑 충돌하면 충돌 딜레이카운트를 0으로 만듬
          return
        }
      }
    }
  }

  /**
   * 적이 죽었는지를 확인하는 함수. 적이 죽는 조건은 dieCheck 함수로 확인해주세요.
   * 일단 한번 죽었다면, 재생성이 아닌 이상 부활은 불가능합니다. 
   * 적을 죽이면 경험치를 얻습니다.
   */
  processDie () {
    if (this.dieCheck()) {
      this.processDieDefault()
    }
  }

  processDieDefault () {
    fieldSystem.requestAddScore(this.score) // 점수 추가

    // 사운드 플레이
    if (this.dieSound != null) {
      soundSystem.play(this.dieSound)
    }

    // 이펙트 출력
    if (this.dieEffect != null) {
      fieldState.createEffectObject(this.dieEffect.getObject(), this.x, this.y)
    }
  }

  /**
   * 살아있는 상태에서 죽음 판정을 받았는지 확인하는 함수
   * @param {boolean} isAlived 조건을 확인할 당시에 살아있는 상태인지를 확인, true일경우 살아있는 상태에서만 죽음 판정을, false일경우 죽어있어도 죽음 판정을 한다.
   */
  dieCheck (isAlived = true) {
    // 살아있는 상태가 true일 때 이미 죽은 상태인 경우 false리턴
    if (isAlived && this.isDied) return false

    // hp가 0보다 높은 경우 죽은 상태가 아님.
    if (this.hp > 0) return false

    // 그게 아닌경우 죽은 상태를 true로 만들고 true 리턴
    this.isDied = true
    return true
  }

  /**
   * 적이 죽은 후에, 어떻게 할 것인지를 결정하는 함수.
   * 기본적으로는 적이 죽은 후 딜레이를 확인해서, 딜레이 시간동안은 적이 남아있습니다.  
   * 경고: 이 함수를 재작성한다면, isDied로 죽었는지 확인 한후 isDeleted를 사용해서 해당 객체를 삭제해야 합니다.
   * 안그러면 적이 죽어도 죽지 않은 상태가 되고, 해당 함수가 무한 발동될 수 있습니다.
   */
  processDieAfter () {
    if (this.isDied) {
      // 적이 죽었을 때, 딜레이가 null 이거나, 딜레이가 있을 때 딜레이카운트를 다 채우면 그 때 삭제
      if (this.dieAfterDeleteDelay == null || this.dieAfterDeleteDelay.check()) {
        this.processDieAfterLogic()
      }
    }
  }

  /**
   * 적이 죽은 후에, 어떻게 할 것인지를 결정하는 함수
   */
  processDieAfterLogic () {
    this.isDeleted = true
  }

  /**
   * 적이 일정 영역으로 벗어났는지를 확인합니다.
   * 만약 그렇다면, 영역에 벗어나있는 시간을 추가하고, 이 시간이 10초(600프레임)이 되면 삭제합니다.
   */
  processOutAreaCheck () {
    const player = fieldState.getPlayerObject()
    if (this.x <= player.x - 1600 ||
     this.x >= player.x + 1600 ||
     this.y <= player.y - 1200 ||
     this.y >= player.y + 1200) {
      this.outAreaDeleteDelay.count++
    } else {
      this.outAreaDeleteDelay.count--
    }

    if (this.outAreaDeleteDelay.check(false, false)) {
      this.isDeleted = true
    }
  }

  getSaveData () {
    let saveData = super.getSaveData()
    let addData = {
      dieAfterDeleteDelay: this.dieAfterDeleteDelay,
      collisionDelay: this.collisionDelay,
      outAreaDeleteDelay: this.outAreaDeleteDelay,
      isPossibleExit: this.isPossibleExit,
      isExitToReset: this.isExitToReset
    }

    return Object.assign(saveData, addData)
  }
}

export class EnemyBulletData extends FieldData {
  constructor () {
    super()
    this.isNotMoveOption = false
  }

  process () {
    this.processMove()
    this.processCollision()

    if (this.outAreaCheck()) {
      this.isDeleted = true
    }

    if (this.elapsedFrame >= 600) {
      this.isDeleted = true
    }
  }

  processCollision () {
    let player = fieldState.getPlayerObject()
    let playerSendXY = { x: player.x, y: player.y, width: player.width, height: player.height}
    
    if (collision(playerSendXY, this)) {
      player.addDamage(this.attack)
      this.isDeleted = true
    }
  }

  outAreaCheck () {
    if (this.x < -graphicSystem.CANVAS_WIDTH / 2 ||
      this.x > graphicSystem.CANVAS_WIDTH + (graphicSystem.CANVAS_WIDTH / 2) ||
      this.y < -graphicSystem.CANVAS_HEIGHT / 2 ||
      this.y > graphicSystem.CANVAS_HEIGHT + (graphicSystem.CANVAS_HEIGHT / 2)) {
        return true
      } else {
        return false
      }
  }

  afterInitDefault (moveOption = {moveSpeedX: 1, moveSpeedY: 0, moveDirectionX: '', moveDirectionY: ''}) {
    if (this.isNotMoveOption) return

    this.moveSpeedX = moveOption.moveSpeedX
    this.moveSpeedY = moveOption.moveSpeedY
    this.moveDirectionX = moveOption.moveDirectionX
    this.moveDirectionY = moveOption.moveDirectionY

    if (this.moveDirectionX === '') {
      this.moveSpeedX = this.moveSpeedX
    }
    if (this.moveDirectionY === '') {
      this.moveSpeedY = this.moveSpeedY
    }
  }

  setAutoRotate () {
    let speedX = this.moveDirectionX == 'right' ? this.moveSpeedX : -this.moveSpeedX
    let speedY = this.moveDirectionY == 'down' ? this.moveSpeedY : -this.moveSpeedY
    let nextX = this.x + speedX
    let nextY = this.y + speedY
    let distanceX = nextX - this.x
    let distanceY = nextY - this.y
    const atangent = Math.atan2(distanceY, distanceX)
    this.degree = atangent * (180 / Math.PI)
  }
}

/** 
 * 커스텀 에너미 불릿. 이 클래스를 사용하여 적의 총알 객체를 구현합니다. 
 * 이것으로 데이터를 생성한 다음, getCreateObject 함수를 사용해 새 객체를 얻어서 필드에서 사용하세요.
 * 
 * 참고: 클래스를 넘겨도 되고, 인스턴스(getCreateObject)를 통해 넘겨도 됩니다. 다만, 클래스 자체 수정(process, display함수를 수정한다던가) 이 필요하다면, 클래스로 넘겨야합니다.
 */
export class CustomEnemyBullet extends EnemyBulletData {
  constructor (image, imageData, attack, moveSpeedX, moveSpeedY, moveDirectionX = '', moveDirectionY = '') {
    super()
    this.setAutoImageData(image, imageData)
    this.attack = attack
    this.setMoveDirection(moveDirectionX, moveDirectionY)
    this.setMoveSpeed(moveSpeedX, moveSpeedY)
  }

  /** 새 오브젝트 불릿 객체를 생성합니다. 이 객체를 필드 데이터에 넘겨주세요. */
  getCreateObject () {
    return new CustomEnemyBullet(this.image, this.imageData, this.attack, this.moveSpeedX, this.moveSpeedY, this.moveDirectionX, this.moveDirectionY)
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
    this.hp = 80000
    this.score = 400
    this.width = 48
    this.height = 48
    this.attack = 10
    this.isPossibleExit = false
    this.image = imageFile.enemyTemp
    this.moveSpeedX = -1
  }
}

class TestShowDamageEnemy extends EnemyData {
  constructor () {
    super()
    this.hp = 1000000
    this.score = 1000
    this.width = 48
    this.height = 48
    this.attack = 0
    this.isPossibleExit = false
    this.image = imageFile.enemyTemp
    this.moveSpeedX = 0
  }

  display () {
    super.display()
    graphicSystem.digitalFontDisplay('totaldamage: ' + (1000000 - this.hp), 0, 40)
  }
}

/**
 * 1-1 spaceEnemy: baseCp: 40000
 */
class SpaceEnemyData extends EnemyData {
  constructor () {
    super()
    this.image = imageFile.enemy.spaceEnemy
    this.baseCp = 40000
  }
}

class SpaceEnemyLight extends SpaceEnemyData {
  constructor () {
    super()
    this.colorNumber = Math.floor(Math.random() * 8)
    this.setAutoImageData(this.image, imageDataInfo.spaceEnemy.spaceLight)
    this.setEnemyByCpStat(4, 1) // hp 1600 고정
    // this.setEnemyStat(2000 + (this.colorNumber * 100), 20 + (this.colorNumber + 1), 1)
    this.dieAfterDeleteDelay = new DelayData(20)
    this.moveSpeedX = Math.random() * 8 - 4
    this.moveSpeedY = Math.random() * 8 - 4
    this.isPossibleExit = true
    this.isExitToReset = true
    this.dieSound = soundFile.enemyDie.enemyDieSpaceLight
  }

  display () {
    const alpha = (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count) / this.dieAfterDeleteDelay.delay
    graphicSystem.setAlpha(alpha)
    graphicSystem.imageDisplay(this.image, this.imageData.x + (this.colorNumber * this.imageData.width), this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
    graphicSystem.setAlpha(1)
  }
}

class SpaceEnemyRocket extends SpaceEnemyData {
  constructor () {
    super()
    this.setEnemyByCpStat(10, 10)

    // 로켓은 두종류의 이미지가 있고, 그 중 랜덤으로 선택
    this.imageData = Math.random() * 1 < 0.5 ? imageDataInfo.spaceEnemy.rocketBlue : imageDataInfo.spaceEnemy.rocketRed
    this.setAutoImageData(this.image, this.imageData, 4)
    this.setMoveSpeed(4 + Math.random() * 2, 0)
    this.isPossibleExit = true
    this.isExitToReset = true
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceRocket, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedWhite, this.height, this.height, 2))
  }
}

class SpaceEnemyCar extends SpaceEnemyData {
  constructor () {
    super()
    this.setEnemyByCpStat(12, 10)
    this.setAutoImageData(this.image, imageDataInfo.spaceEnemy.greenCar, 4)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceCar, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.car1, this.height, this.height, 2))
    this.state = 'normal'
    this.boostCount = 0 // 자동차의 속도를 올리기 위한 변수
    this.isPossibleExit = true
    this.isExitToReset = true
  }

  processMove () {
    const playerObject = fieldState.getPlayerObject()
    const playerX = playerObject.x
    const playerY = playerObject.y
    const playerHeight = playerObject.height

    // 차는 이동할때, 플레이어의 y축이 비슷한 위치에 있고, 플레이어 x축 보다 차 x축이 오른쪽에 있을 때, 플레이어가 있는 왼쪽으로 빠르게 이동합니다.
    // 차는 오른쪽으로는 이동하지 않습니다.
    if (playerY < this.y + this.height && playerY + playerHeight > this.y && playerX < this.x) {
      this.boostCount++
      this.state = 'boost'
    } else {
      this.state = 'normal'
      this.boostCount--
    }

    // 차의 속도를 제한하기 위해 부스트카운트 값을 일정 값 범위 내로 제한합니다.
    if (this.boostCount > 60) {
      this.boostCount = 60
    } else if (this.boostCount < 0) {
      this.boostCount = 0
    }

    this.moveSpeedX = 2 + (this.boostCount / 4)
    super.processMove()
  }

  display () {
    // 이 차는, 주인공을 추적할때만 에니메이션이 재생되고, 아니면 에니메이션이 0프레임으로 고정됩니다.
    if (this.enimation) {
      if (this.state === 'normal') {
        this.enimation.elapsedFrame = 0
        this.enimation.display(this.x, this.y) // 에니메이션은 출력되지만, 로직이 처리되지 않아 다음 에니메이션이 진행되지 않음.
      } else {
        this.enimation.display(this.x, this.y)
      }
    }
  }
}

class SpaceEnemySquare extends SpaceEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.image, imageDataInfo.spaceEnemy.blueSqaure, 4)
    this.setEnemyByCpStat(20, 16)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceSquare, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareGrey, this.width, this.height, 2))
    this.isPossibleExit = false
    this.MOVE_STOP_FRAME = 180
    this.moveDelay = new DelayData(240)
    this.moveDelay.count = this.moveDelay.delay
    this.finishPosition = { x: 0, y: 0 }
    this.setMoveDirection() // 이동 방향 설정 안함
  }

  resetFinishPosition () {
    this.finishPosition.x = Math.floor(Math.random() * graphicSystem.CANVAS_WIDTH)
    this.finishPosition.y = Math.floor(Math.random() * graphicSystem.CANVAS_HEIGHT)

    this.moveSpeedX = (this.finishPosition.x - this.x) / this.moveDelay.delay
    this.moveSpeedY = (this.finishPosition.y - this.y) / this.moveDelay.delay
  }

  processMove () {
    // 이동딜레이 초반 60프레임동안 이동하고, 61 ~ 119프레임은 이동하지 않습니다.
    // 120프레임이 되면 도착 지점이 재설정됩니다.
    // 참고: moveDelay.check()를 첫번째 조건으로 설정해야, moveDelay값에 따른 잘못된 이동 버그를 막을 수 있습니다.
    if (this.moveDelay.check()) {
      this.resetFinishPosition()
    } else if (this.moveDelay.count >= this.MOVE_STOP_FRAME) {
      this.moveSpeedX = 0
      this.moveSpeedY = 0
    } else {
      super.processMove()
    }
  }
}

class SpaceEnemyAttack extends SpaceEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.image, imageDataInfo.spaceEnemy.blueAttack, 4)
    this.setEnemyByCpStat(14, 12)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceSquare, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.diamondBlue, this.width, this.height, 2))
    this.boostCount = 0
    this.moveSpeedY = Math.random() * 2 - 1
  }

  processMove () {
    this.boostCount++
    if (this.boostCount <= 120) {
      this.moveSpeedX = (this.boostCount / 40)
    } else if (this.boostCount <= 240) {
      this.moveSpeedX = (this.boostCount / 20) + 2
    } else {
      this.moveSpeedX = 10
    }

    if (this.x + this.width < 0 && this.boostCount >= 120) {
      this.boostCount = 0
      this.x = graphicSystem.CANVAS_WIDTH + this.width
      this.moveSpeedY = Math.random() * 2 - 1
    }

    super.processMove()
  }
}

class SpaceEnemyEnergy extends SpaceEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.image, imageDataInfo.spaceEnemy.purpleEnergy, 4)
    this.setEnemyByCpStat(20, 10)
    this.setMoveSpeed(4, 4)
    this.setMoveDirection()
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceEnergy, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareLinePurple, this.width, this.height, 2))
    this.boostCount = 0
    this.moveDelay = new DelayData(180) // 이 값이 180이 아니면, 오류가 발생할 수 있음. 속도를 계산하는 데 알고리즘상의 문제가 있음.
    this.moveDelay.count = this.moveDelay.delay // 딜레이 즉시 발동을 위한 카운트 강제 증가
    this.state = 'normal'
    this.baseSpeedX = this.moveSpeedX
    this.baseSpeedY = this.moveSpeedY
    this.currentSpeedX = this.baseSpeedX
    this.currentSpeedY = this.baseSpeedY
  }

  processMove () {
    // 이동방식: 자유로운 이동, 그러나 속도가 서서히 증가하고 서서히 감소하는 방식
    // sin값을 사용하여 부드러운 움직임을 구현, 참고로 sin 0도 ~ 180도가 0 ~ 1 ~ 0 이므로, 180도만큼만 사용
    const sin = Math.sin(Math.PI / 180 * this.moveDelay.count)

    if (this.moveDelay.check()) {
      this.currentSpeedX = (Math.random() * this.baseSpeedX * 2) - (this.baseSpeedX)
      this.currentSpeedY = (Math.random() * this.baseSpeedY * 2) - (this.baseSpeedY)

      if (this.x < 40) {
        this.currentSpeedX = Math.abs(this.currentSpeedX)
      } else if (this.x > graphicSystem.CANVAS_WIDTH - 40) {
        this.currentSpeedX = -Math.abs(this.currentSpeedX)
      }

      if (this.y < 40) {
        this.currentSpeedY = Math.abs(this.currentSpeedX)
      } else if (this.y > graphicSystem.CANVAS_HEIGHT - 40) {
        this.currentSpeedY = -Math.abs(this.currentSpeedY)
      }
    }
    
    // 참고: 이동 방향이 없기 때문에, moveSpeed값은 실제 이동에 영향을 주지 못함.
    this.moveSpeedX = sin * this.currentSpeedX
    this.moveSpeedY = sin * this.currentSpeedY

    super.processMove()
  }
}

class SpaceEnemySusong extends SpaceEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.image, imageDataInfo.spaceEnemy.susong, 3)
    this.setEnemyByCpStat(80, 20)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceSusong, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.smallCircleUp, this.width / 2, this.width / 2, 2, 2))
    this.boostCount = 0
    this.moveDelay = new DelayData(240)
    this.state = 'move'
    this.moveDirectionX = 'left'
    this.isExitToReset = true
  }

  processMove () {
    if (this.moveDelay.check()) {
      if (this.state === 'stop') {
        // 멈춘 상태에서는 방향을 랜덤하게 설정
        this.moveDirectionX = Math.random() * 1 < 0.5 ? 'left' : 'right'
      }

      // 20% 확률로 멈춤
      this.state = Math.random() * 1 < 0.8 ? 'move' : 'stop'
    }

    if (this.state === 'move' && this.boostCount < 120) {
      this.boostCount++ // 이동 상태에서는 서서히 속도 증가
    } else if (this.state === 'stop' && this.boostCount > 0) {
      this.boostCount-- // 멈춤 상태에서는 서서히 속도 감소
    }

    this.moveSpeedX = (this.boostCount / 60)
    super.processMove()
  }

  display () {
    if (this.state === 'move' || this.boostCount >= 0) {
      if (this.moveDirectionX === 'right') {
        this.enimation.flip = 1
        this.enimation.display(this.x, this.y)
      } else {
        this.enimation.flip = 0
        this.enimation.display(this.x, this.y)
      }
    } else {
      if (this.moveDirectionX === 'right') {
        graphicSystem.imageDisplay(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height, 1)
      } else {
        graphicSystem.imageDisplay(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
      }
    }
  }

  processDie () {
    if (this.dieCheck()) {
      this.processDieDefault()
      fieldState.createEffectObject(this.dieEffect, this.x + 40, this.y)
      fieldState.createEffectObject(this.dieEffect, this.x + 80, this.y)
    }
  }
}

class SpaceEnemyGamjigi extends SpaceEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageFile.enemy.spaceEnemy, imageDataInfo.spaceEnemy.gamjigi)
    this.setEnemyByCpStat(20, 12)
    this.setMoveDirection()
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceGamjigi, new CustomEffect(imageFile.enemyDie.enemyDieSpaceGamjigi, imageDataInfo.enemyDieEffectEx.enemyDieSpaceGamjigi, this.width, this.height, 3))
    this.moveDelay = new DelayData(300)
    this.boostCount = 0
    this.degree = 0
    this.state = 'chase'
  }

  processMove () {
    // 이동 지연시간마다 추적할지 말지를 설정
    if (this.moveDelay.check()) {
      this.state = Math.random() * 1 < 0.5 ? 'normal' : 'chase'
    }

    // 추적 상태에서는 플레이어를 따라다님
    if (this.state === 'chase') {
      const playerX = fieldState.getPlayerObject().centerX
      const playerY = fieldState.getPlayerObject().centerY
      const distanceX = playerX - this.x
      const distanceY = playerY - this.y
      const atangent = Math.atan2(distanceY, distanceX)
      this.degree = atangent * (180 / Math.PI)

      this.moveSpeedX = distanceX / 200
      this.moveSpeedY = distanceY / 200
    } else {
      // 보통 상태에서는 카운트가 더 빨리 올라서, 상태 변환을 빨리 하도록 합니다.
      this.moveDelay.count += 2
    }

    if (this.moveSpeedX > 2) {
      this.moveSpeedX = 2
    } else if (this.moveSpeedX < -2) {
      this.moveSpeedX = -2
    }

    if (this.moveSpeedY > 2) {
      this.moveSpeedY = 2
    } else if (this.moveSpeedY < -2) {
      this.moveSpeedY = -2
    }

    super.processMove()
  }

  processPlayerCollision () {
    if (this.collisionDelay.check(false)) {
      const player = fieldState.getPlayerObject()
      if (collisionClass.collisionOBB(player, this)) {
        this.collisionDelay.count = 0
        player.addDamage(this.attack)
      }
    }
  }

  processDie () {
    if (this.dieCheck()) {
      // 죽음 이펙트를 생성 후, 이 값을 가져와, 각도 값을 변경합니다.
      let changeEffect = fieldState.createEffectObject(this.dieEffect, this.x, this.y)
      changeEffect.enimation.degree = this.degree

      // 죽음 이펙트 중복 출력을 막기 위해, 현재 죽음 이펙트를 삭제하고, 임시 변수에 이동시킵니다.
      this.dieEffect = null
      this.processDieDefault()
    }
  }

  display () {
    if (this.image) {
      graphicSystem.imageDisplay(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height, 0, this.degree)
    }
  }
}

class SpaceEnemyComet extends SpaceEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageFile.enemy.spaceEnemy, imageDataInfo.spaceEnemy.comet, 2)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceComet, new CustomEffect(imageFile.enemyDie.enemyDieSpaceComet, imageDataInfo.enemyDieEffectEx.enemyDieSapceComet, this.width, this.height, 4))
    this.setEnemyByCpStat(5, 4)
    this.setMoveSpeed(1, Math.random() * 4 + 2)
    this.boostCount = 0
    this.isExitToReset = true
    this.moveDirectionY = Math.random() * 1 < 0.5 ? 'up' : 'down'
  }

  processMove () {
    this.boostCount++
    if (this.boostCount > 120) {
      this.boostCount = 120
    }

    this.moveSpeedX = 1 + (this.boostCount / 20)
    super.processMove()
  }
}

class SpaceEnemyMeteorite extends SpaceEnemyData {
  constructor () {
    super()

    const hpList = [12000, 12400, 12800, 13200, 13600]
    const attackList = [16, 16, 16, 18, 18]
    const scoreList = [120, 124, 128, 132, 136]
    const imageDataList = [
      imageDataInfo.spaceEnemy.meteorite1,
      imageDataInfo.spaceEnemy.meteorite2,
      imageDataInfo.spaceEnemy.meteorite3,
      imageDataInfo.spaceEnemy.meteorite4,
      imageDataInfo.spaceEnemy.meteorite5
    ]
    const dieSoundList = [
      soundFile.enemyDie.enemyDieMeteorite1,
      soundFile.enemyDie.enemyDieMeteorite2,
      soundFile.enemyDie.enemyDieMeteorite3,
      soundFile.enemyDie.enemyDieMeteorite4,
      soundFile.enemyDie.enemyDieMeteorite5,
    ]
    const dieEffectImageDataList = [
      imageDataInfo.enemyDieMeteorite.enemyDieMeteorite1,
      imageDataInfo.enemyDieMeteorite.enemyDieMeteorite2,
      imageDataInfo.enemyDieMeteorite.enemyDieMeteorite3,
      imageDataInfo.enemyDieMeteorite.enemyDieMeteoriteWhite,
      imageDataInfo.enemyDieMeteorite.enemyDieMeteoriteBlack,
    ]

    // 운석 번호 설정(운석 번호에 따라 스탯과 이미지가 달라짐)
    let meteoriteNumber = Math.floor(Math.random() * 5)
    
    this.setEnemyStat(hpList[meteoriteNumber], scoreList[meteoriteNumber], attackList[meteoriteNumber])
    this.setAutoImageData(imageFile.enemy.spaceEnemy, imageDataList[meteoriteNumber])
    this.setDieEffectOption(dieSoundList[meteoriteNumber], new CustomEffect(imageFile.enemyDie.enemyDieMeteorite, dieEffectImageDataList[meteoriteNumber], this.width, this.height, 4))
    this.setMoveDirection()

    this.moveSpeedX = Math.random() * 4 - 2
    this.moveSpeedY = Math.random() * 4 - 2
    this.state = Math.random() * 1 < 0.5 ? 'rotate' : 'normal'

    this.isExitToReset = true
  }

  processMove () {
    if (this.state === 'rotate') {
      this.degree++
    }

    super.processMove()
  }

  display () {
    graphicSystem.imageDisplay(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height, 0, this.degree)
  }
}

class SpaceEnemyBoss extends SpaceEnemyData {
  constructor () {
    super()
    
    this.setAutoImageData(imageFile.enemy.spaceEnemy, imageDataInfo.spaceEnemy.bossSqaure, 6)
    // 보스의 크기는 300x300, 이미지 자동설정 후에 크기를 설정하는 이유는, autoImageData함수가 크기를 자동으로 지정해두기 때문
    this.setWidthHeight(300, 300)
    this.setEnemyByCpStat(3000, 40, 200)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceCar, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.car1, this.width, this.height, 1, 2))

    this.MOVE_STOP_FRAME = 90
    this.moveDelay = new DelayData(90)
    this.finishPositionType = 'rightup'
    this.state = 'normal'
    this.setMoveDirection() // 이동 방향 설정 안함
    this.shakeTime = 0
    this.dieAfterDeleteDelay = new DelayData(120)
  }

  processMove () {
    if (this.hp <= this.hpMax * 0.2) {
      this.moveDelay.delay = 50
    }

    if (this.moveDelay.check()) {
      // 이동 위치 변경
      let randomNumber = Math.random() * 100
      this.state = 'boost'

      // 보스는 양쪽 모서리 끝에 부딪힌 후, 그 방향을 기준으로 가로 세로 방향으로만 움직입니다.
      // 예를 들어, 왼쪽 위에 있다면, 왼쪽 위에서 오른쪽 위로 가거나 왼쪽 위에서 왼쪽 아래로 갑니다.
      // 대각선 이동은 하지 않습니다.
      if (this.finishPositionType === 'leftup') {
        if (randomNumber < 50) {
          this.finishPositionType = 'leftdown'
        } else {
          this.finishPositionType = 'rightup'
        }
      } else if (this.finishPositionType === 'leftdown') {
        if (randomNumber < 50) {
          this.finishPositionType = 'leftup'
        } else {
          this.finishPositionType = 'rightdown'
        }
      } else if (this.finishPositionType === 'rightup') {
        if (randomNumber < 50) {
          this.finishPositionType = 'leftup'
        } else {
          this.finishPositionType = 'rightdown'
        }
      } else if (this.finishPositionType === 'rightdown') {
        if (randomNumber < 50) {
          this.finishPositionType = 'leftdown'
        } else {
          this.finishPositionType = 'rightup'
        }
      }
    }

    // 보스를 화면 양 끝에 가속하면서 부딪히게 하기, 양 끝에 부딪히면 일정시간 흔들림
    if (this.finishPositionType === 'leftup') {
      if (this.x > 0) {
        this.moveSpeedX -= 1
      } else {
        if (this.x < 0) {
          this.x = 0
        }
        this.moveSpeedX = 0
      }

      if (this.y > 0) {
        this.moveSpeedY -= 1
      } else {
        if (this.y < 0) {
          this.y = 0
        }
        this.moveSpeedY = 0
      }
    } else if (this.finishPositionType === 'leftdown') {
      if (this.x > 0) {
        this.moveSpeedX -= 1
      } else {
        if (this.x < 0) {
          this.x = 0
        }
        this.moveSpeedX = 0
      }

      if (this.y + this.height < graphicSystem.CANVAS_HEIGHT) {
        this.moveSpeedY += 1
      } else {
        if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
          this.y = graphicSystem.CANVAS_HEIGHT - this.height
        }
        this.moveSpeedY = 0
      }
    } else if (this.finishPositionType === 'rightup') {
      if (this.x + this.width < graphicSystem.CANVAS_WIDTH) {
        this.moveSpeedX += 1
      } else {
        if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
          this.x = graphicSystem.CANVAS_WIDTH - this.width
        }
        this.moveSpeedX = 0
      }

      if (this.y > 0) {
        this.moveSpeedY -= 1
      } else {
        if (this.y < 0) {
          this.y = 0
        }
        this.moveSpeedY = 0
      }
    } else if (this.finishPositionType === 'rightdown') {
      if (this.x + this.width < graphicSystem.CANVAS_WIDTH) {
        this.moveSpeedX += 1
      } else {
        if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
          this.x = graphicSystem.CANVAS_WIDTH - this.width
        }
        this.moveSpeedX = 0
      }

      if (this.y + this.height < graphicSystem.CANVAS_HEIGHT) {
        this.moveSpeedY += 1
      } else {
        if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
          this.y = graphicSystem.CANVAS_HEIGHT - this.height
        }
        this.moveSpeedY = 0
      }
    }

    if (this.state === 'boost') {
      if (this.finishPositionType === 'leftup') {
        if (this.x === 0 && this.y === 0) {
          this.shakeTime += 20
          this.state = 'normal'
        }
      } else if (this.finishPositionType === 'leftdown') {
        if (this.x === 0 && this.y + this.height === graphicSystem.CANVAS_HEIGHT) {
          this.shakeTime += 20
          this.state = 'normal'
        }
      } else if (this.finishPositionType === 'rightup') {
        if (this.x + this.width === graphicSystem.CANVAS_WIDTH && this.y === 0) {
          this.shakeTime += 20
          this.state = 'normal'
        }
      } else if (this.finishPositionType === 'rightdown') {
        if (this.x + this.width === graphicSystem.CANVAS_WIDTH && this.y + this.height === graphicSystem.CANVAS_HEIGHT)  {
          this.shakeTime += 20
          this.state = 'normal'
        }
      }
    }

    if (this.shakeTime >= 1) {
      this.shakeTime--
      this.x += Math.floor(Math.random () * 36) - 18
      this.y += Math.floor(Math.random () * 36) - 18
    }

    super.processMove()
  }

  processDieAfter () {
    super.processDieAfter()
    if (this.isDied && this.dieAfterDeleteDelay.divCheck(10)) {
      soundSystem.play(this.dieSound)
      fieldState.createEffectObject(this.dieEffect, this.x + Math.random() * 40 - 80, this.y + Math.random() * 40 - 80)
    }
  }

  display () {
    if (!this.isDied) {
      super.display()
    }
  }
}

class SpaceEnemyDonggrami extends SpaceEnemyData {
  constructor () {
    super()
    // 50% 확률로 이미지 결정
    let imageDataTarget = Math.random() * 100 < 50 ? imageDataInfo.spaceEnemy.donggrami1 : imageDataInfo.spaceEnemy.donggrami2
    let dieSoundTarget = Math.random() * 100 < 50 ? soundFile.enemyDie.enemyDieDonggrami1 : soundFile.enemyDie.enemyDieDonggrami2
    this.setAutoImageData(this.image, imageDataTarget)
    this.setEnemyByCpStat(36, 15)
    this.setDieEffectOption(dieSoundTarget)
    this.dieAfterDeleteDelay = new DelayData(240)
    this.isPossibleExit = false
    this.setRandomSpeed(3, 3)
  }

  processDieAfter () {
    if (this.isDied) {
      this.y += 10

      // 적이 죽었을 때, 딜레이가 null 이거나, 딜레이가 있을 때 딜레이카운트를 다 채우면 그 때 삭제
      if (this.dieAfterDeleteDelay == null || this.dieAfterDeleteDelay.check()) {
        this.processDieAfterLogic()
      }
    }
  }
}

class MeteoriteEnemyData extends EnemyData {
  constructor () {
    super()
    this.baseCp = 40000
    this.image = imageFile.enemy.meteoriteEnemy
  }
}

class MeteoriteEnemyClass1 extends MeteoriteEnemyData {
  constructor () {
    super()
    const imageDataList = [
      imageDataInfo.meteoriteEnemy.class11,
      imageDataInfo.meteoriteEnemy.class12,
      imageDataInfo.meteoriteEnemy.class13,
      imageDataInfo.meteoriteEnemy.class14,
      imageDataInfo.meteoriteEnemy.class15,
      imageDataInfo.meteoriteEnemy.class21,
      imageDataInfo.meteoriteEnemy.class22,
      imageDataInfo.meteoriteEnemy.class23,
      imageDataInfo.meteoriteEnemy.class24,
      imageDataInfo.meteoriteEnemy.class25,
      imageDataInfo.meteoriteEnemy.class31,
      imageDataInfo.meteoriteEnemy.class32,
      imageDataInfo.meteoriteEnemy.class33,
      imageDataInfo.meteoriteEnemy.class34,
      imageDataInfo.meteoriteEnemy.class35,
    ]
    const dieSoundList = [
      soundFile.enemyDie.enemyDieMeteorite1,
      soundFile.enemyDie.enemyDieMeteorite2,
      soundFile.enemyDie.enemyDieMeteorite3,
      soundFile.enemyDie.enemyDieMeteorite4,
      soundFile.enemyDie.enemyDieMeteorite5
    ]
    const dieImageDataList = [
      imageDataInfo.enemyDieMeteorite.enemyDieMeteorite1,
      imageDataInfo.enemyDieMeteorite.enemyDieMeteorite2,
      imageDataInfo.enemyDieMeteorite.enemyDieMeteorite3
    ]
    
    let imageNumber = Math.floor(Math.random() * imageDataList.length)
    let dieSoundNumber = Math.floor(Math.random() * dieSoundList.length)
    let dieImageNumber = Math.floor(imageNumber / 5)
    
    this.setEnemyByCpStat(4, 5)
    this.setWidthHeight(25, 25)
    this.setAutoImageData(imageFile.enemy.meteoriteEnemy, imageDataList[imageNumber])
    this.setDieEffectOption(dieSoundList[dieSoundNumber], new CustomEffect(imageFile.enemyDie.enemyDieMeteorite, dieImageDataList[dieImageNumber], this.width, this.height, 1))
    this.setMoveSpeed((Math.random() * 8) - 4, (Math.random() * 8) - 4)
    this.isExitToReset = true
    this.degree = Math.floor(Math.random() * 360)

    // 약 50% 확률로 회전속도가 랜덤하게 결정
    this.rotateSpeed = 0
    if (Math.random() * 100 < 50) {
      this.rotateSpeed = Math.random() * 2
      this.degree = Math.random() * 360
    }
  }

  processMove () {
    super.processMove()
    if (this.rotateSpeed != 0) {
      this.degree += this.rotateSpeed
      if (this.degree >= 360) this.degree = 0
    }
  }

  /**
   * 메테오의 크기가 다를 때 죽음 이펙트도 해당 크기에 맞추기 위해서, dieEffect의 크기를 변경합니다.
   */
  setDieEffectMeteo () {
    this.dieEffect.width = this.width
    this.dieEffect.height = this.height
  }
}

class MeteoriteEnemyClass2 extends MeteoriteEnemyClass1 {
  constructor () {
    super()
    this.setEnemyByCpStat(6, 5)
    this.setWidthHeight(50, 50)
    this.setDieEffectMeteo()
  }
}

class MeteoriteEnemyClass3 extends MeteoriteEnemyClass1 {
  constructor () {
    super()
    this.setEnemyByCpStat(8, 5)
    this.setWidthHeight(100, 100)
    this.setMoveSpeed((Math.random() * 6) - 3, (Math.random() * 6) - 3)
    this.setDieEffectMeteo()
  }
}

class MeteoriteEnemyClass4 extends MeteoriteEnemyClass1 {
  constructor () {
    super()
    this.setEnemyByCpStat(20, 5)
    this.setWidthHeight(200, 200)
    this.setMoveSpeed((Math.random() * 6) - 3, (Math.random() * 6) - 3)
    this.setDieEffectMeteo()
  }
}

class MeteoriteEnemyWhiteMeteo extends MeteoriteEnemyData {
  TYPE_NORMAL = 0
  TYPE_ACCELERATION = 1
  TYPE_BOOST = 2
  TYPE_RANDOM = 3
  TYPE_SEIZURE = 4

  constructor () {
    super()
    const MAX_NUM = 5
    const imageDataTable = [
      imageDataInfo.meteoriteEnemy.whiteMeteo1,
      imageDataInfo.meteoriteEnemy.whiteMeteo2,
      imageDataInfo.meteoriteEnemy.whiteMeteo3,
      imageDataInfo.meteoriteEnemy.whiteMeteo4,
      imageDataInfo.meteoriteEnemy.whiteMeteo5
    ]
    const moveDelayTable = [300, 240, 120, 180, 24]
    const dieSoundTable = [
      soundFile.enemyDie.enemyDieMeteorite1,
      soundFile.enemyDie.enemyDieMeteorite2,
      soundFile.enemyDie.enemyDieMeteorite3,
      soundFile.enemyDie.enemyDieMeteorite4,
      soundFile.enemyDie.enemyDieMeteorite5
    ]

    let imageNumber = Math.floor(Math.random() * MAX_NUM)
    let soundNumber = Math.floor(Math.random() * dieSoundTable.length)

    this.typeNumber = Math.floor(Math.random() * 5)
    this.setAutoImageData(imageFile.enemy.meteoriteEnemy, imageDataTable[imageNumber])
    this.setEnemyByCpStat(15, 12)
    this.setMoveSpeed((Math.random() * 2) - 1, (Math.random() * 2) - 1)
    this.setDieEffectOption(dieSoundTable[soundNumber], new CustomEffect(imageFile.enemyDie.enemyDieMeteorite, imageDataInfo.enemyDieMeteorite.enemyDieMeteoriteWhite, this.width, this.height, 1))
    this.maxMoveSpeedX = Math.random() * 3 + 1
    this.maxMoveSpeedY = Math.random() * 3 + 1
    this.baseMoveSpeedX = this.moveSpeedX
    this.baseMoveSpeedY = this.moveSpeedY
    this.isExitToReset = true
    this.moveDelay = new DelayData(300)
    this.moveDelay.delay = moveDelayTable[this.typeNumber]
    this.state = ''
  }

  processMove () {
    switch (this.typeNumber) {
      case this.TYPE_NORMAL: break
      case this.TYPE_ACCELERATION: this.processMoveAccelration(); break
      case this.TYPE_BOOST: this.processMoveBoost(); break
      case this.TYPE_RANDOM: this.processMoveRandom(); break
      case this.TYPE_SEIZURE: this.processMoveSeizure(); break
    }

    super.processMove()
  }

  processMoveAccelration () {
    // 일정 시간마다 가속 상태를 변경합니다.
    // 가속 상태는 총 3종류 ('', boostup, boostdown) 이 있습니다.
    if (this.moveDelay.check()) {
      this.moveAccelrationChange()
    }

    // 상태가 boostup, boostdown일경우 일정시간마다 속도 조정
    if (this.moveDelay.divCheck(10)) {
      if (this.state === 'boostup') {
        this.moveAccelrationBoostUp()
      } else if (this.state === 'boostdown') {
        this.moveAccelrationBoostDown()
      }
    }
  }

  moveAccelrationChange () {
    // 일정 시간마다 상태를 변경, 부스트업일경우 속도가 매우 느리게 증가, 부스트다운일경우 속도가 느리게 감소,
    // 아무 상태도 아니면 속도 변화 없음
    let randomNumber = Math.floor(Math.random() * 2)
    if (this.state === '') {
      this.state = randomNumber < 1 ? 'boostup' : 'boostdown'
    } else if (this.state === 'boostdown') {
      this.state = randomNumber < 1 ? 'boostup' : ''
    } else if (this.state === 'boostup') {
      this.state = randomNumber < 1 ? 'boostdown': ''
    }
  }

  moveAccelrationBoostUp () {
    // 참고로 속도 계산식 특성상 최대속도를 초과하는것이 가능합니다. 이에 대한 보정은 없습니다.
    const speedChangeValueX = (this.maxMoveSpeedX - this.baseMoveSpeedX) / 20
    const speedChangeValueY = (this.maxMoveSpeedY - this.baseMoveSpeedY) / 20

    // 속도 증가 효과를 구현하기 위해
    // 먼저 절대값으로 최대속도와 현재속도를 비교한 후에
    // x축 속도가 양수일 때 현재속도가 x축의 최대 속도보다 낮다면 x축 속도를 더하고
    // x축 속도가 음수일 때 현재속도가 x축의 최대 속도보다 낮다면 x축 속도를 뺍니다.
    if (Math.abs(this.moveSpeedX) < Math.abs(this.maxMoveSpeedX)) {
      if (this.moveSpeedX > 0) {
        this.moveSpeedX += speedChangeValueX
      } else {
        this.moveSpeedX -= speedChangeValueX // 음수 값을 증가시켜야 하기 때문에 뺄셈을 사용합니다.
      }
    }

    if (Math.abs(this.moveSpeedY) < Math.abs(this.maxMoveSpeedY)) {
      if (this.moveSpeedY > 0) {
        this.moveSpeedY += speedChangeValueY
      } else {
        this.moveSpeedY -= speedChangeValueY
      }
    }
  }

  moveAccelrationBoostDown () {
    const speedChangeValueX = (this.maxMoveSpeedX - this.baseMoveSpeedX) / 20
    const speedChangeValueY = (this.maxMoveSpeedY - this.baseMoveSpeedY) / 20
    const MIN_SPEED = 0.01

    // 속도 감소 효과를 구현하기 위해
    // x축 속도가 양수일 때 현재속도가 x축의 최대 속도보다 낮다면 x축 속도를 더하고
    // x축 속도가 음수일 때 현재속도가 x축의 최대 속도보다 낮다면 x축 속도를 뺍니다.
    // 만약 이로 인해, 속도의 방향이 역전되는 경우(양수일때 0보다 작으면, 음수일때 0보다 크면), 
    // 속도는 최솟값인 0.01로 재조정됩니다.
    if (this.moveSpeedX > 0) {
      this.moveSpeedX -= speedChangeValueX
      if (this.moveSpeedX <= 0) {
        this.moveSpeedX = MIN_SPEED
      }
    } else {
      this.moveSpeedX += speedChangeValueX
      if (this.moveSpeedX >= 0) {
        this.moveSpeedX = -MIN_SPEED
      }
    }

    if (this.moveSpeedY > 0) {
      this.moveSpeedY -= speedChangeValueY
      if (this.moveSpeedY <= 0) {
        this.moveSpeedY = MIN_SPEED
      }
    } else {
      this.moveSpeedY += speedChangeValueY
      if (this.moveSpeedY >= 0) {
        this.moveSpeedY = -MIN_SPEED
      }
    }
  }

  processMoveBoost () {
    // 부스트 상태는 일정 시간마다 서로 번갈아가면서 변화합니다.
    if (this.moveDelay.check()) {
      if (this.state === '') {
        this.state = 'boost'
      } else {
        this.state = ''
      }
    }

    if (this.state === 'boost') {
      this.moveBoostBoost()
    } else {
      this.moveBoostNotBoost()
    }
  }

  moveBoostBoost () {
    // 부스트 상태일 때, 속도가 서서히 증가
    const UP_SPEED = 0.1

    if (Math.abs(this.moveSpeedX) < Math.abs(this.maxMoveSpeedX)) {
      if (this.moveSpeedX > 0) {
        this.moveSpeedX += UP_SPEED
      } else {
        this.moveSpeedX -= UP_SPEED
      }
    }

    if (Math.abs(this.moveSpeedY) < Math.abs(this.maxMoveSpeedY)) {
      if (this.moveSpeedY > 0) {
        this.moveSpeedY += UP_SPEED
      } else {
        this.moveSpeedY -= UP_SPEED
      }
    }
  }

  moveBoostNotBoost () {
    // 부스트 타입의 속도 감소는, 해당 객체의 기준 속도까지 빠르게 감소합니다.
    // 나머지는 악셀레이터 방식과 동일
    const MIN_SPEED = 0.1
    const DOWN_SPEED = 0.2

    if (Math.abs(this.moveSpeedX) > Math.abs(this.baseMoveSpeedX)) {
      if (this.moveSpeedX > 0) {
        this.moveSpeedX -= DOWN_SPEED
        if (this.moveSpeedX < this.baseMoveSpeedX) {
          this.moveSpeedX = MIN_SPEED
        }
      } else {
        this.moveSpeedX += DOWN_SPEED
        // 음수는 절대값으로 변환해서 계산합니다. (굳이 이렇게 하는건 코드 이해가 편하기 때문)
        if (Math.abs(this.moveSpeedX) < Math.abs(this.baseMoveSpeedX)) {
          this.moveSpeedX = MIN_SPEED
        }
      }
    }

    if (Math.abs(this.moveSpeedY) > Math.abs(this.baseMoveSpeedY)) {
      if (this.moveSpeedY > 0) {
        this.moveSpeedY -= DOWN_SPEED
        if (this.moveSpeedY < this.baseMoveSpeedY) {
          this.moveSpeedY = MIN_SPEED
        }
      } else {
        this.moveSpeedY += DOWN_SPEED
        if (Math.abs(this.moveSpeedY) < Math.abs(this.baseMoveSpeedY)) {
          this.moveSpeedY = MIN_SPEED
        }
      }
    }
  }

  processMoveRandom () {
    // 일정시간마다 일정 확률로 속도 최대치 랜덤 변환. 이후, 객체는 속도 최대치에 다가감
    // 속도 최대치보다 현재 속도가 낮다면 현재 속도가 증가하고, 아니면 감소한다.
    // 중요한건, 속도 최대치에 계속 맞춰진다는것
    if (this.moveDelay.check()) {
      let randomNumber = Math.floor(Math.random() * 100)
      const CHANGE_PERCENT = 50
      if (randomNumber > CHANGE_PERCENT) return

      this.maxMoveSpeedX = Math.random() * 5
      this.maxMoveSpeedY = Math.random() * 5
    }

    // x축의 최대속도와 현재 속도가 다를경우
    if (this.moveSpeedX != this.maxMoveSpeedX) {
      this.moveRandomChangeX()
    }

    if (this.moveSpeedY != this.maxMoveSpeedY) {
      this.moveRandomChangeY()
    }
  }

  moveRandomChangeX () {
    const CHANGE_SPEED = 0.1
    if (Math.abs(this.moveSpeedX) < Math.abs(this.maxMoveSpeedX)) {
      if (this.moveSpeedX > 0) {
        this.moveSpeedX += CHANGE_SPEED
        if (this.moveSpeedX > this.maxMoveSpeedX) {
          this.moveSpeedX = this.maxMoveSpeedX
        }
      } else {
        this.moveSpeedX -= CHANGE_SPEED
        // 음수 비교의 경우, 코드 가독성을 위해 절대값으로 비교하였습니다.
        if (Math.abs(this.moveSpeedX) > Math.abs(this.maxMoveSpeedX)) {
          this.moveSpeedX = this.maxMoveSpeedX
        }
      }
    } else {
      if (this.moveSpeedX > 0) {
        this.moveSpeedX -= CHANGE_SPEED
        if (this.moveSpeedX < this.maxMoveSpeedX) {
          this.moveSpeedX = this.maxMoveSpeedX
        }
      } else {
        this.moveSpeedX += CHANGE_SPEED
        // 음수 비교의 경우, 코드 가독성을 위해 절대값으로 비교하였습니다.
        if (Math.abs(this.moveSpeedX) < Math.abs(this.maxMoveSpeedX)) {
          this.moveSpeedX = this.maxMoveSpeedX
        }
      }
    }
  }

  moveRandomChangeY () {
    const CHANGE_SPEED = 0.1
    if (Math.abs(this.moveSpeedY) < Math.abs(this.maxMoveSpeedY)) {
      if (this.moveSpeedY > 0) {
        this.moveSpeedY += CHANGE_SPEED
        if (this.moveSpeedY > this.maxMoveSpeedY) {
          this.moveSpeedY = this.maxMoveSpeedY
        }
      } else {
        this.moveSpeedY -= CHANGE_SPEED
        // 음수 비교의 경우, 코드 가독성을 위해 절대값으로 비교하였습니다.
        if (Math.abs(this.moveSpeedY) > Math.abs(this.maxMoveSpeedY)) {
          this.moveSpeedY = this.maxMoveSpeedY
        }
      }
    } else {
      if (this.moveSpeedY > 0) {
        this.moveSpeedY -= CHANGE_SPEED
        if (this.moveSpeedY < this.maxMoveSpeedY) {
          this.moveSpeedX = this.maxMoveSpeedY
        }
      } else {
        this.moveSpeedY += CHANGE_SPEED
        // 음수 비교의 경우, 코드 가독성을 위해 절대값으로 비교하였습니다.
        if (Math.abs(this.moveSpeedY) < Math.abs(this.maxMoveSpeedY)) {
          this.moveSpeedY = this.maxMoveSpeedY
        }
      }
    }
  }

  processMoveSeizure () {
    // 이 운석의 회전값은 수시로 변환... 미친놈인듯...
    if (this.moveDelay.divCheck(3)) {
      this.degree = Math.floor(Math.random() * 360)
    }

    // 일정시간마다 속도가 변경됨. 방향은 일정 확률로 변경됨.
    if (this.moveDelay.check()) {
      this.moveSpeedX = Math.random() * 2
      this.moveSpeedY = Math.random() * 2

      let randomNumber1 = Math.floor(Math.random() * 100)
      let randomNumber2 = Math.floor(Math.random() * 100)
      if (randomNumber1 <= 4) {
        this.moveDirectionX = this.moveDirectionX === 'left' ? 'right' : 'left'
      }
      if (randomNumber2 <= 4) {
        this.moveDirectionY = this.moveDirectionY === 'up' ? 'down' : 'up'
      }
    }
  } 
}

class MeteoriteEnemyBlackMeteo extends MeteoriteEnemyWhiteMeteo {
  constructor () {
    // 운석 알고리즘이 whiteMeteo랑 동일하기 때문에, 해당 클래스를 상속받았습니다.
    // whiteMeteo랑 다른점은, 체력, 점수, 이미지 뿐입니다.
    super ()
    const MAX_NUM = 5
    const imageDataTable = [
      imageDataInfo.meteoriteEnemy.blackMeteo1,
      imageDataInfo.meteoriteEnemy.blackMeteo2,
      imageDataInfo.meteoriteEnemy.blackMeteo3,
      imageDataInfo.meteoriteEnemy.blackMeteo4,
      imageDataInfo.meteoriteEnemy.blackMeteo5
    ]
    const moveDelayTable = [300, 240, 120, 180, 24]

    let imageNumber = Math.floor(Math.random() * MAX_NUM)
    this.setAutoImageData(imageFile.enemy.meteoriteEnemy, imageDataTable[imageNumber])
    this.setEnemyByCpStat(18, 12)
    this.dieEffect = new CustomEffect(imageFile.enemyDie.enemyDieMeteorite, imageDataInfo.enemyDieMeteorite.enemyDieMeteoriteBlack, this.width, this.height, 4)
    this.moveDelay.delay = moveDelayTable[this.typeNumber]
  }
}

class MeteoriteBombEnemyBulletEffect extends CustomEditEffect {
  MAX_WIDTH = 160
  MAX_HEIGHT = 160
  START_WIDTH = 60
  START_HEIGHT = 60
  UP_WIDTH = 12
  UP_HEIGHT = 12

  constructor () {
    super()
    this.width = this.START_WIDTH
    this.height = this.START_HEIGHT

    // 이 이펙트는 에니메이션이 이미지파일을 사용하는 방식이 아니여서, 수동으로 지정해야 합니다.
    this.delay = new DelayData(10)
  }

  process () {
    this.width += this.UP_WIDTH
    this.height += this.UP_HEIGHT

    if (this.width > this.MAX_WIDTH) {
      this.width = this.MAX_WIDTH
    }
    if (this.height > this.MAX_HEIGHT) {
      this.height = this.MAX_HEIGHT
    }

    if (this.delay.check()) {
      this.isDeleted = true
    }
  }

  display () {
    let outputX = this.x - (this.width / 2)
    let outputY = this.y - (this.height / 2)

    // graphicSystem.fillRect(outputX, outputY, this.width, this.height, 'blue')
    graphicSystem.fillEllipse(outputX, outputY, this.width, this.height, 0, 'red')
    if (this.width >= 24) {
      graphicSystem.fillEllipse(outputX + 12, outputY + 12, this.width - 24, this.height - 24, 0, 'orange')
    }
    if (this.width >= 48) {
      graphicSystem.fillEllipse(outputX + 24, outputY + 24, this.width - 48, this.height - 48, 0, 'yellow')
    }
  }
}

class MeteoriteBombEnemyBullet extends EnemyBulletData {
  constructor () {
    super()
    this.attack = 20
    this.width = MeteoriteEnemyBomb.BOMB_SIZE
    this.height = MeteoriteEnemyBomb.BOMB_SIZE
    this.isNotMoveOption = true

    this.customEffect = new MeteoriteBombEnemyBulletEffect()
  }

  process () {
    super.process()
  }

  // 스플래시 데미지 (아군이든 적군이든(...))
  processCollision () {
    // 플레이어 충돌
    let player = fieldState.getPlayerObject()
    if (collision(player, this)) {
      player.addDamage(this.attack)
    }

    // 적도 충돌(?!)
    let enemy = fieldState.getEnemyObject()
    const MIN_DAMAGE = 2400
    const MAX_DAMAGE = 16000
    for (let i = 0; i < enemy.length; i++) {
      let currentEnemy = enemy[i]
      if (collision(enemy, this)) {
        let targetDamage = Math.floor(currentEnemy.hpMax * 0.2)
        if (targetDamage < MIN_DAMAGE) {
          targetDamage = MIN_DAMAGE
        } else if (targetDamage > MAX_DAMAGE) {
          targetDamage = MAX_DAMAGE
        }
        currentEnemy.hp -= targetDamage
      }
    }

    // 한번만 발동하고, 이펙트 생성한 후 삭제
    fieldState.createEffectObject(this.customEffect, this.x + (this.width / 2), this.y + (this.height / 2))
    this.isDeleted = true
  }

  display () {
    graphicSystem.strokeRect(this.x, this.y, this.width, this.height, 'white')
  }
}

class MeteoriteEnemyBomb extends MeteoriteEnemyData {
  static BOMB_SIZE = 160

  constructor () {
    super()
    this.setEnemyByCpStat(25, 20)
    this.setAutoImageData(imageFile.enemy.meteoriteEnemy, imageDataInfo.meteoriteEnemy.bomb)
    this.setMoveSpeed(Math.random() * 3, Math.random() * 3)
    this.isExitToReset = true
    this.dieSound = soundFile.enemyDie.enemyDieMeteoriteBomb
  }

  processDie () {
    if (this.dieCheck()) {
      this.processDieDefault()

      // create enemybullet
      let bombSize = MeteoriteEnemyBomb.BOMB_SIZE
      let setX = this.x + (this.width / 2) - (bombSize / 2)
      let setY = this.y + (this.height / 2) - (bombSize / 2)

      fieldState.createEnemyBulletObject(new MeteoriteBombEnemyBullet(), setX, setY)
    }
  }
}

class MeteoriteEnemyBombBig extends MeteoriteEnemyBomb {
  constructor () {
    super()
    this.setEnemyByCpStat(25, 20)
    this.width = 160
    this.height = 160

    // 크기 수정에 따른 에니메이션 크기 수정
    this.enimation.setOutputSize(this.width, this.height)
  }
}

class MeteoriteEnemyStone extends MeteoriteEnemyData {
  static TYPE_STONE_BLACK = 0
  static TYPE_STONE_BROWN = 1
  static TYPE_STONE_GREEN = 2
  static TYPE_STONE_MAX = 3

  constructor () {
    super()
    const imageDataList = [
      imageDataInfo.meteoriteEnemy.stoneBlack,
      imageDataInfo.meteoriteEnemy.stoneBrown,
      imageDataInfo.meteoriteEnemy.stoneGreen
    ]
    let imageNumber = Math.floor(Math.random() * imageDataList.length)
    this.stoneType = imageNumber // 돌 타입 설정(이미지 차이만 있음.)

    this.setAutoImageData(imageFile.enemy.meteoriteEnemy, imageDataList[imageNumber])
    this.setEnemyByCpStat(50, 20)
    this.setRandomSpeed(2, 2)
    this.width = 160
    this.height = 160
    this.isExitToReset = true
    this.dieSound = soundFile.enemyDie.enemyDieSpaceRocket
  }

  processDieAfter () {
    if (!this.isDied) return

    // 조각 4개를 추가한다.
    fieldState.createEnemyObject(ID.enemy.meteoriteEnemy.stonePiece, this.x, this.y, this.stoneType, 0)
    fieldState.createEnemyObject(ID.enemy.meteoriteEnemy.stonePiece, this.x + (this.width / 2), this.y, this.stoneType, 1)
    fieldState.createEnemyObject(ID.enemy.meteoriteEnemy.stonePiece, this.x + (this.width / 2), this.y + (this.height / 2), this.stoneType, 2)
    fieldState.createEnemyObject(ID.enemy.meteoriteEnemy.stonePiece, this.x, this.y + (this.height / 2), this.stoneType, 3)

    // 그리고 해당 객체는 삭제
    this.isDeleted = true
  }
}

class MeteoriteEnemyStonePiece extends MeteoriteEnemyData {
  constructor (option = []) {
    super()
    const imageDataList = [
      [
        imageDataInfo.meteoriteEnemy.stoneBlackPiece1,
        imageDataInfo.meteoriteEnemy.stoneBlackPiece2,
        imageDataInfo.meteoriteEnemy.stoneBlackPiece3,
        imageDataInfo.meteoriteEnemy.stoneBlackPiece4
      ],
      [
        imageDataInfo.meteoriteEnemy.stoneBrownPiece1,
        imageDataInfo.meteoriteEnemy.stoneBrownPiece2,
        imageDataInfo.meteoriteEnemy.stoneBrownPiece3,
        imageDataInfo.meteoriteEnemy.stoneBrownPiece4
      ],
      [
        imageDataInfo.meteoriteEnemy.stoneGreenPiece1,
        imageDataInfo.meteoriteEnemy.stoneGreenPiece2,
        imageDataInfo.meteoriteEnemy.stoneGreenPiece3,
        imageDataInfo.meteoriteEnemy.stoneGreenPiece4
      ]
    ]

    // 돌 타입 설정
    const pieceNumberMax = 4
    this.stoneType = option.length > 0 ? option[0] : Math.floor(Math.random() * MeteoriteEnemyStone.TYPE_STONE_MAX)
    this.pieceNumber = option.length > 1 ? option[1] : Math.floor(Math.random() * pieceNumberMax)

    this.setAutoImageData(imageFile.enemy.meteoriteEnemy, imageDataList[this.stoneType][this.pieceNumber])
    this.setDieEffectOption(soundFile.enemyDie.enemyDieSpaceSmall, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareGrey, this.width, this.height, 1))
    this.setEnemyByCpStat(10, 10)
    this.setRandomSpeed(4, 4)
    this.width = 80
    this.height = 80

    // pieceNumber에 따라 이동 방향이 다릅니다.
    // 0: 왼쪽 위, 1: 오른쪽 위, 2: 오른쪽 아래, 3: 왼쪽 아래
    switch (this.pieceNumber) {
      case 0:
        this.moveDirectionX = 'left'
        this.moveDirectionY = 'up'
        break
      case 1:
        this.moveDirectionX = 'right'
        this.moveDirectionY = 'up'
        break
      case 2:
        this.moveDirectionX = 'right'
        this.moveDirectionY = 'down'
        break
      case 3:
        this.moveDirectionX = 'left'
        this.moveDirectionY = 'down'
        break
    }
  }
}

class MeteoriteEnemyRed extends MeteoriteEnemyData {
  constructor () {
    super()
    const imageDataList = [
      imageDataInfo.meteoriteEnemy.red1,
      imageDataInfo.meteoriteEnemy.red2,
      imageDataInfo.meteoriteEnemy.red3,
      imageDataInfo.meteoriteEnemy.red4
    ]
    let imageDataNumber = Math.floor(Math.random() * imageDataList.length)
    this.isExitToReset = true

    // 빨간 운석의 특징은, 공격력이 비정상적으로 높고, 크기가 크다는 것입니다. 조심해야 합니다.
    this.setAutoImageData(this.image, imageDataList[imageDataNumber])
    this.setWidthHeight(this.width * 2, this.height * 2) // 크기 2배 증가
    this.setEnemyByCpStat(50, 40)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieMetoriteRed, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.noiseRed, this.width, this.height, 4))
    this.setRandomSpeed(3, 2)
  }
}


class JemulEnemyData extends EnemyData {
  constructor () {
    super()
    this.baseCp = 40000
    this.image = imageFile.enemy.jemulEnemy
  }
}

class JemulEnemyRotateRocket extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageFile.enemy.jemulEnemy, imageDataInfo.jemulEnemy.rotateRocket, 5)
    this.setEnemyByCpStat(10, 20)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulRocket, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedOrange, this.width, this.width, 2))

    // 이 로켓은 플레이어가 있는 위치에 발사되기 때문에, 이동 방향을 삭제하고 순수 속도값을 설정
    this.setMoveDirection()
    this.changeMoveSpeed()
  }

  changeMoveSpeed () {
    const playerX = fieldState.getPlayerObject().centerX
    const playerY = fieldState.getPlayerObject().centerY
    const distanceX = playerX - this.x
    const distanceY = playerY - this.y
    const atangent = Math.atan2(distanceY, distanceX)

    // 판정 문제 때문에 에니메이션 각도와 실제 각도를 동시에 변경
    this.degree = atangent * (180 / Math.PI)
    this.enimation.degree = this.degree 

    this.moveSpeedX = distanceX / 250
    this.moveSpeedY = distanceY / 250
  }

  processMove () {
    super.processMove()
    if (this.exitAreaCheck()) {
      this.changeMoveSpeed()
    }
  }

  processPlayerCollision () {
    if (this.collisionDelay.check(false)) {
      const player = fieldState.getPlayerObject()
      if (collisionClass.collisionOBB(player, this)) {
        this.collisionDelay.count = 0
        player.addDamage(this.attack)
      }
    }
  }
}

class JemulEnemyEnergyBolt extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageFile.enemy.jemulEnemy, imageDataInfo.jemulEnemy.energyBolt)
    this.setEnemyByCpStat(12, 12)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulEnergyBolt, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.pulseDiamondBlue, this.width, this.height, 2))
    this.setRandomSpeed(2, 3)
    this.moveDelay = new DelayData(180)
    this.attackDelay = new DelayData(180)
    this.bulletDamage = 15
    this.bulletSize = 160
    this.isExitToReset = true

    this.bulletEffect = new CustomEffect(imageFile.enemyBullet.energyBoltAttack, imageDataInfo.enemyBullet.jemulEnergyBoltAttack, 160, 160, 2)
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.setRandomSpeed(2, 3)
    }
    super.processMove()
  }

  processAttack () {
    if (this.attackDelay.check()) {
      // 에너지볼트는 일정시간마다 에너지를 자기 근처에 발사한다. (위치는 정해진 범위내 랜덤)
      const hitArea = {
        x: Math.floor(this.x + (this.width / 2) - (this.bulletSize / 2) + (Math.random() * 120) - 60), 
        y: Math.floor(this.y + (this.width / 2) - (this.bulletSize / 2) + (Math.random() * 120) - 60),
        width: this.bulletSize,
        height: this.bulletSize
      }
      const player = fieldState.getPlayerObject()
      const playerPosition = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
      }

      // 플레이어가 맞았다면 데미지를 추가
      if (collision(playerPosition, hitArea)) {
        player.addDamage(10)
      }
      
      // 사운드 및 이펙트 추가
      fieldState.createEffectObject(this.bulletEffect, hitArea.x, hitArea.y)
      soundSystem.play(soundFile.enemyAttack.jemulEnergyBoltAttack)
    }
  }
}

class JemulEnemyEnergyBoltAttackEffect extends EffectData {
  constructor () {
    super()
    this.autoSetEnimation(imageFile.enemyBullet.energyBoltAttack, imageDataInfo.enemyBullet.jemulEnergyBoltAttack, 160, 160, 3)
  }
}

class JemulEnemyHellSpike extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageFile.enemy.jemulEnemy, imageDataInfo.jemulEnemy.hellSpike)
    this.setEnemyByCpStat(10, 10)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulSpike, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.diamondMagenta, this.width, this.height, 2))
    this.setRandomSpeed(3, 3)
    this.attackDelay = new DelayData(120)
    this.isExitToReset = true
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let centerX = this.x + (this.width / 2)
      let centerY = this.y + (this.height / 2)
      let moveDirectionX = [FieldData.direction.LEFT, FieldData.direction.LEFT, FieldData.direction.RIGHT, FieldData.direction.RIGHT]
      let moveDirectionY = [FieldData.direction.UP, FieldData.direction.DOWN, FieldData.direction.UP, FieldData.direction.DOWN]
      for (let i = 0; i < 4; i++) {
        let enemyBullet = new CustomEnemyBullet(imageFile.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyHellSpike, 10, 3, 3, moveDirectionX[i], moveDirectionY[i])
        enemyBullet.setAutoRotate()
        fieldState.createEnemyBulletObject(enemyBullet, centerX, centerY)
      }
    }
  }
}

class JemulEnemyHellDrill extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageFile.enemy.jemulEnemy, imageDataInfo.jemulEnemy.hellDrill, 0)
    this.setEnemyByCpStat(15, 3)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulDrill, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.smallCircleUp, this.width, this.height, 3))
    
    // 드릴은 초당 10회 공격 가능 (일반적인 적들은 초당 1회 제한)
    this.collisionDelay.delay = 6

    this.moveDelay = new DelayData(240)
    this.setMoveDirection()
    this.setRandomSpeed(4, 2)
    this.isExitToReset = true
    this.state = ''
  }

  processPlayerCollision () {
    if (this.collisionDelay.check(false)) {
      const player = fieldState.getPlayerObject()
      const enemy = this.getCollisionArea() // 적은 따로 충돌 영역을 얻습니다.

      for (let i = 0; i < enemy.length; i++) {
        if (collision(enemy[i], player)) {
          soundSystem.play(soundFile.enemyAttack.jemulHellDrillAttack) // 공격 성공시 사운드 출력
          player.addDamage(this.attack)
          this.collisionDelay.count = 0 // 플레이어랑 충돌하면 충돌 딜레이카운트를 0으로 만듬
          return
        }
      }
    }
  }

  processMove () {
    if (this.moveDelay.check(false)) {
      let checkArea = {
        x: this.x - 150,
        y: this.y - 150,
        width: 300,
        height: 300
      }
      let player = fieldState.getPlayerObject()

      if (collision(checkArea, player)) {
        this.moveDelay.count = 0
        this.state = 'attack'
        this.setMoveDirection()
        this.moveSpeedX = (player.x - this.x) / 27
        this.moveSpeedY = (player.y - this.y) / 27
      }
    }
    
    if (this.state === 'attack' && this.moveDelay.count >= 30) {
      this.state = ''
      this.moveSpeedX /= 4
      this.moveSpeedY /= 4
    }

    super.processMove()
  }
}

class JemulEnemyHellShip extends JemulEnemyData {
  constructor () {
    super()
    // 이 객체는 에니메이션이 총 3종류라 따로 코드를 작성해야 합니다.
    this.setAutoImageData(imageFile.enemy.jemulEnemy, imageDataInfo.jemulEnemy.hellShipFront)
    this.setEnemyByCpStat(23, 20)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulHellShip, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireBlue, this.width, this.height, 2))
    let up = imageDataInfo.jemulEnemy.hellShipUp
    let down = imageDataInfo.jemulEnemy.hellShipDown
    this.enimationUp  = new EnimationData(this.image, up.x, up.y, up.width, up.height, up.frame, 1, -1, this.width, this.height)
    this.enimationDown  = new EnimationData(this.image, down.x, down.y, down.width, down.height, down.frame, 1, -1, this.width, this.height)
    this.state = 'front'
    this.isPossibleExit = false
    this.setMoveSpeed(4, 0)
    this.moveDelay = new DelayData(90)
    this.attackDelay = new DelayData(90)
    this.maxMoveSpeedY = 1
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.moveSpeedX = Math.random() * 4
      this.maxMoveSpeedY = Math.random() * 3
      
      let randomNumber = Math.random() * 100
      if (randomNumber <= 33) {
        this.state = 'up'
        this.moveDirectionY = 'up'
      } else if (randomNumber >= 34 && randomNumber <= 67) {
        this.state = 'down'
        this.moveDirectionY = 'down'
      } else {
        this.state = 'front'
      }
    }

    // 어느 정도 왼쪽으로 왔다면 강제로 오른쪽으로 이동
    if (this.x < 200) {
      this.moveDirectionX = 'right'
    }

    if (this.moveDirectionX === 'right') {
      this.enimation.flip = 1
      this.enimationUp.flip = 1
      this.enimationDown.flip = 1
    } else {
      this.enimation.flip = 0
      this.enimationUp.flip = 0
      this.enimationDown.flip = 0
    }

    if (this.state === 'up' || this.state === 'down') {
      if (this.moveSpeedY < this.maxMoveSpeedY) {
        this.moveSpeedY += 0.06
      }
    } else if (this.state === 'front') {
      if (this.moveSpeedY > 0) {
        this.moveSpeedY -= 0.11
      } else {
        this.moveSpeedY = 0
      }
    }

    super.processMove()
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let enemyBullet = new CustomEnemyBullet(imageFile.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyShip, 15, 4, 0, FieldData.direction.LEFT)
      fieldState.createEnemyBulletObject(enemyBullet, this.x, this.y)
    }
  }

  processEnimation () {
    if (this.enimation != null || this.enimationUp != null || this.enimationDown != null) {
      this.enimation.process()
      this.enimationUp.process()
      this.enimationDown.process()
    }
  }

  display () {
    // 이동 상태에 따라 출력 이미지 변경
    if (this.moveSpeedY === 0) {
      this.enimation.display(this.x, this.y)
    } else if (this.moveDirectionY === 'up' && this.moveSpeedY > 0) {
      this.enimationUp.display(this.x, this.y)
    } else if (this.moveDirectionY === 'down' && this.moveSpeedY > 0) {
      this.enimationDown.display(this.x, this.y)
    }
  }
}

class JemulEnemyHellAir extends JemulEnemyData {
  constructor () {
    super()
    // 이 객체는 에니메이션이 총 3종류라 따로 코드를 작성해야 합니다.
    this.setAutoImageData(imageFile.enemy.jemulEnemy, imageDataInfo.jemulEnemy.hellAirFront)
    this.setEnemyByCpStat(20, 20)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulHellAir, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireBlue, this.width, this.height, 2))
    let up = imageDataInfo.jemulEnemy.hellAirUp
    let down = imageDataInfo.jemulEnemy.hellAirDown
    this.enimationUp  = new EnimationData(this.image, up.x, up.y, up.width, up.height, up.frame, 1, -1, this.width, this.height)
    this.enimationDown  = new EnimationData(this.image, down.x, down.y, down.width, down.height, down.frame, 1, -1, this.width, this.height)
    this.state = 'front'
    this.isExitToReset = true
    this.setRandomSpeed(4, 4)
    this.moveDelay = new DelayData(120)
    this.attackDelay = new DelayData(150)
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.setRandomSpeed(4, 4)
      let randomNumberA = Math.random() * 100
      let randomNumberB = Math.random() * 100

      this.moveDirectionX = randomNumberA < 50 ? 'left' : 'right'
      this.moveDirectionY = randomNumberB < 50 ? 'up' : 'down'
    }

    if (this.moveDirectionX === 'right') {
      this.enimation.flip = 1
      this.enimationUp.flip = 1
      this.enimationDown.flip = 1
    } else {
      this.enimation.flip = 0
      this.enimationUp.flip = 0
      this.enimationDown.flip = 0
    }

    if (this.moveSpeedY > 1) {
      if (this.moveDirectionY === 'up') {
        this.state = 'up'
      } else {
        this.state = 'down'
      }
    } else {
      this.state = 'front'
    }

    super.processMove()
  }

  processEnimation () {
    this.enimation.process()
    this.enimationUp.process()
    this.enimationDown.process()
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bulletSpeedX = 8
      let bulletX = this.x + this.width
      if (this.moveDirectionX === 'left') {
        bulletSpeedX = -8
        bulletX = this.x
      }


      let speedYList = [-1, 0, 0, 1]
      let insertY = [this.y + (this.height / 4 * 0), this.y + (this.height / 4 * 2), this.y + (this.height / 4 * 3), this.y + (this.height / 4 * 4)]
      for (let i = 0; i < 4; i++) {
        let enemyBullet = new CustomEnemyBullet(imageFile.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyAir, 6, bulletSpeedX, speedYList[i])
        fieldState.createEnemyBulletObject(enemyBullet, this.x, insertY[i])
      }
    }
  }

  display () {
    // 이동 상태에 따라 출력 이미지 변경
    if (this.state === 'front') {
      this.enimation.display(this.x, this.y)
    } else if (this.state === 'up') {
      this.enimationUp.display(this.x, this.y)
    } else if (this.state === 'down') {
      this.enimationDown.display(this.x, this.y)
    }
  }
}

class JemulEnemyBoss extends JemulEnemyData {
  constructor () {
    super()

    /** 레이저A를 발사하는 상태 */ this.STATE_LASER = 'laserA'
    /** 레이저B(회전공격)을 발사하는 상태 */ this.STATE_ROTATE_LASER = 'laserB'
    /** 보통 상태(일반공격만 함) */ this.STATE_NORMAL = 'normal'
    /** 이동 상태(중앙으로 이동할 때 적용) */ this.STATE_MOVING = 'moving'
    /** 이동 완료 상태(중앙에 위치해 있을 때 이동 완료) */ this.STATE_MOVE_COMPLETE = 'moveComplete'
    /** 레이저 에니메이션용 딜레이 체크 */ this.laserDelay = new DelayData(999)

    this.STATE_DELAY = 300
    this.LASER_DELAY = 180
    this.ATTACK_DELAY = 60
    this.ATTACK_LASER_DELAY = 6

    this.MOVE_SPEED = 2
    this.RIGHT_MOVE_SPEED = 6
    this.UP_DOWN_SPEED = 1

    this.setAutoImageData(this.image, imageDataInfo.jemulEnemy.jemulBoss, 5)
    this.setWidthHeight(360, 300) // 크기 3배
    this.setEnemyByCpStat(2000, 50, 200)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulBoss, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.car1, this.width, this.height, 4))
    this.attackDelay = new DelayData(this.ATTACK_DELAY)
    this.isPossibleExit = false
    
    // 기본 상태: 보통으로 설정
    this.state = this.STATE_NORMAL
    this.stateDelay = new DelayData(this.STATE_DELAY)
    // this.stateDelay.count = 559

    /** 레이저 오브젝트[좌우 형태] */ this.laserObject1 = {x: 0, y: 0, width: 0, height: 0}
    /** 레이저 오브젝트[상하 형태] */ this.laserObject2 = {x: 0, y: 0, width: 0, height: 0}
    /** 레이저 오브젝트[회전 형태  */ this.laserObjectR = {x: 0, y: 0, width: 0, height: 0, degree: 0}
    this.laserReset()
  }

  getCollisionArea () {
    return [
      {x: this.x, y: this.y + 30, width: 60, height: 240},
      {x: this.x + 60, y: this.y, width: 240, height: 300},
      {x: this.x + 300, y: this.y + 30, width: 60, height: 240},
    ]
  }

  process () {
    super.process()
    this.processState()
  }

  processState () {
    // 상태에 따라 상태딜레이는 달라집니다.
    if (this.state === this.STATE_MOVE_COMPLETE) {
      this.stateDelay.delay = this.LASER_DELAY
    } else {
      this.stateDelay.delay = this.STATE_DELAY
    }

    if (this.state === this.STATE_LASER || this.state === this.STATE_ROTATE_LASER) {
      this.attackDelay.delay = this.ATTACK_LASER_DELAY
    } else {
      this.attackDelay.delay = this.ATTACK_DELAY
    }

    // 상태 딜레이 체크
    // 상태는 일정시간 동안 지속적으로 변경된다.
    if (!this.stateDelay.check()) return

    let randomNuber = Math.random() * 100
    if (this.state === this.STATE_NORMAL) {
      // normal 상태인경우, 총알을 1초에 1개씩 발사하고, 맨 오른쪽으로 이동한다.
      // normal 상태에서는 10초가 지날경우, moving 상태로 변경해 중심으로 이동한다.
      this.state = this.STATE_MOVING
      this.laserReset()
      this.laserDelay.count = 0
    } else if(this.state === this.STATE_MOVE_COMPLETE) {
      this.state = randomNuber < 50 ? this.STATE_LASER : this.STATE_ROTATE_LASER
    } else if (this.state === this.STATE_LASER || this.state === this.STATE_ROTATE_LASER) {
      this.state = this.STATE_NORMAL
      this.laserReset() // 레이저 삭제
      this.laserDelay.count = 0 // 레이저 딜레이 카운트 초기화
    }
  }

  processMove () {
    if (this.state === this.STATE_NORMAL) {
      // 보통상태에서는 화면 맨 오른쪽으로 계속 이동한다. (화면에 닿을 때까지)
      if (this.x + this.width < graphicSystem.CANVAS_WIDTH) {
        this.moveDirectionX = 'right'
        this.moveSpeedX = this.RIGHT_MOVE_SPEED
      } else {
        this.moveSpeedX = 0
        this.moveSpeedY = this.UP_DOWN_SPEED
      }
    } else if (this.state === this.STATE_MOVING) {
      // 이동 상태에서는 적 객체를 중심 위치로 이동시킵니다.
      let centerDistanceX = Math.abs(this.centerX - graphicSystem.CANVAS_WIDTH_HALF)
      let centerDistanceY = Math.abs(this.centerY - graphicSystem.CANVAS_HEIGHT_HALF)
      if (centerDistanceX <= 4 && centerDistanceY <= 4) {
        // 적이 센터로 이동했다면, 강제로 center로 이동하고 상태를 moveComplete로 변경
        this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
        this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
        this.state = this.STATE_MOVE_COMPLETE
      } else {
        if (this.centerX > graphicSystem.CANVAS_WIDTH_HALF) {
          this.moveDirectionX = 'left'
          this.moveSpeedX = this.MOVE_SPEED
        } else if (this.centerX < graphicSystem.CANVAS_HEIGHT_HALF) {
          this.moveDirectionX = 'right'
          this.moveSpeedX = this.MOVE_SPEED
        }

        if (this.centerY > graphicSystem.CANVAS_HEIGHT_HALF) {
          this.moveDirectionY = 'up'
          this.moveSpeedY = this.MOVE_SPEED
        } else if (this.centerY < graphicSystem.CANVAS_HEIGHT_HALF) {
          this.moveDirectionY = 'down'
          this.moveSpeedY = this.MOVE_SPEED
        }
      }
    } else {
      this.moveSpeedX = 0
      this.moveSpeedY = 0
    }

    super.processMove()
  }

  processAttack () {
    switch (this.state) {
      case this.STATE_NORMAL: this.processAttackShot(); break
      case this.STATE_LASER: this.processAttackLaser(); break
      case this.STATE_ROTATE_LASER: this.processAttackRotateLaser(); break
    }
  }

  processAttackShot () {
    if (!this.attackDelay.check()) return

    // 플레이어가 있는 중심쪽에서 총알 발사
    let playerObject = fieldState.getPlayerObject()
    let bulletSpeedX = 0
    let bulletSpeedY = 0
    const bulletMinSpeed = 6

    for (let divideSpeed = 60; divideSpeed > 2; divideSpeed--) {
      bulletSpeedX = (playerObject.centerX - this.centerX) / divideSpeed
      bulletSpeedY = (playerObject.centerY - this.centerY) / divideSpeed

      // 속도 절대값으로 비교해서 속도 값이 최소속도 이상인경우에 그 속도로 적용한다.
      // 절대값으로 비교하지 않으면 음수속도일 때 문제가 발생함.
      if (Math.abs(bulletSpeedX) >= bulletMinSpeed || Math.abs(bulletSpeedY) >= bulletMinSpeed) {
        break
      }
    }

    let enemyBullet = new CustomEnemyBullet(imageFile.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyShip, 20, bulletSpeedX, bulletSpeedY, '', '')
    fieldState.createEnemyBulletObject(enemyBullet, this.centerX, this.centerY)
  }

  /**
   * 레이저 오브젝트 재설정
   */
  laserReset () {
    const laserSize = 300
    this.laserObject1.x = graphicSystem.CANVAS_WIDTH_HALF
    this.laserObject1.width = 0
    this.laserObject1.y = graphicSystem.CANVAS_HEIGHT_HALF - (laserSize / 2)
    this.laserObject1.height = laserSize

    this.laserObject2.x = graphicSystem.CANVAS_WIDTH_HALF - (laserSize / 2)
    this.laserObject2.width = laserSize
    this.laserObject2.y = graphicSystem.CANVAS_HEIGHT_HALF
    this.laserObject2.height = 0

    const rSize = 80
    this.laserObjectR.x = graphicSystem.CANVAS_WIDTH_HALF
    this.laserObjectR.width = 0
    this.laserObjectR.y = graphicSystem.CANVAS_HEIGHT_HALF - (rSize / 2)
    this.laserObjectR.height = rSize
    this.laserObjectR.degree = 0
  }

  processAttackLaser () {
    // 레이저 사운드 출력(사운드 코드가 맨 위에 있는 이유는 laserDelay.check 함수에서 count를 1 증가시키기 때문)
    // 그래서 laserDelay.count % 120 === 1을 써야 하는데, 그게 싫음.
    if (this.laserDelay.count % 120 === 0) {
      soundSystem.play(soundFile.enemyAttack.jemulBossAttack)
    }

    // 레이저 카운터는 증가하지만, 지연시간을 확인하는 용도로 사용하지 않습니다.
    // 이것은 레이저의 에니메이션 형태를 처리하기 위한 변수로써 사용합니다.
    this.laserDelay.check(false, true)

    const moveSize = 10
    if (this.laserObject1.width < graphicSystem.CANVAS_WIDTH) {
      this.laserObject1.x -= moveSize
      this.laserObject1.width += moveSize * 2
    }

    if (this.laserObject2.height < graphicSystem.CANVAS_HEIGHT) {
      this.laserObject2.y -= moveSize / 2
      this.laserObject2.height += moveSize
    }

    // 플레이어 공격 판정 (딜레이마다 공격)
    let player = fieldState.getPlayerObject()
    if (this.attackDelay.check()) {
      if (collision(this.laserObject1, player) || collision(this.laserObject2, player)) {
        fieldState.playerObject.addDamage(4)
      }
    }
  }

  processAttackRotateLaser () {
    if (this.laserDelay.count % 120 === 0) {
      soundSystem.play(soundFile.enemyAttack.jemulBossAttack)
    }
  
    this.laserDelay.check(false, true)

    const moveSize = 40
    const laserMaxSize = graphicSystem.CANVAS_WIDTH * 2
    if (this.laserObjectR.width < laserMaxSize) {
      this.laserObjectR.width += moveSize
      this.laserObjectR.x -= (moveSize / 2)
    } else {
      this.laserObjectR.degree += 0.5
    }

    // 플레이어 공격 판정 (딜레이마다 공격)
    let player = fieldState.getPlayerObject()
    if (this.attackDelay.check()) {
      if (collisionClass.collisionOBB(player, this.laserObjectR)) {
        fieldState.playerObject.addDamage(4)
      }
    }
  }

  display () {
    if (this.state === this.STATE_LASER) {
      graphicSystem.setAlpha(0.6)
      graphicSystem.gradientDisplay(this.laserObject1.x, this.laserObject1.y, this.laserObject1.width, this.laserObject1.height, '#ff9090', '#ff9090', '#ff3030')
      graphicSystem.gradientDisplay(this.laserObject2.x, this.laserObject2.y, this.laserObject2.width, this.laserObject2.height, '#ff9090', '#ff9090', '#ff3030')
      graphicSystem.setAlpha(1)
    } else if (this.state === this.STATE_ROTATE_LASER) {
      graphicSystem.setAlpha(0.6)
      graphicSystem.setDegree(this.laserObjectR.degree)
      graphicSystem.gradientDisplay(this.laserObjectR.x, this.laserObjectR.y, this.laserObjectR.width, this.laserObjectR.height, '#d61d1d', '#d61d1d', '#5e0000')
      graphicSystem.restoreTransform()
      graphicSystem.setAlpha(1)
    }
    super.display()
  }
}

class JemulEnemyBossEye extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.image, imageDataInfo.jemulEnemy.jemulBossEye, 5)
    this.setWidthHeight(400, 240) // 크기 3배
    this.setEnemyStat(40000 * 60 * 4, 8000, 0)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulBossEye, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.noiseRed, this.width, this.height, 10))
    this.attackDelay = new DelayData(6)
    this.isPossibleExit = false

    // 추가 세부 설정 // 에니메이션은 기본 3프레임이고, 특수한경우 7프레임입니다.
    this.ENIMATION_NORMAL_FRAME = 5
    this.ENIMATION_MAX_FRAME = imageDataInfo.jemulEnemy.jemulBossEye.frame
    this.enimation.frameCount = this.ENIMATION_NORMAL_FRAME

    // 레이저 오브젝트 [여러개가 쓰일 수 있음.]
    this.laserObject = []
    for (let i = 0; i < 6; i++) {
      this.laserObject.push({x: 0, y: 0, width: 0, height: 0, degree: 0, timeFrame: 0, sideColor: 'black', middleColor: 'white'})
    }

    this.MOVE_SPEED = 4
    
    this.STATE_START = 'start'
    this.STATE_LASER = 'laser'
    this.LASER_4WAYLINE = 0
    this.LASER_LEFTMOVE = 1
    this.LASER_BOTTOMLINE = 2
    this.LASER_CENTERCHASE = 3
    this.LASER_6WAYROTATE = 4
    this.LASER_SQUARELINE = 5
    this.LASER_RANDOM4WAY = 6
    this.LASER_NOTHING = 7
    this.STATE_STOP = 'stop'
    this.STATE_DIE = 'die'
    this.LASER_DELAY = 6
    this.LASER_ATTACK = 4

    this.laserNumberStack = [0, 1, 2, 3, 4, 5, 6, 7]
    // 0 ~ 7 번호를 중복없이 랜덤배치
    for (let i = 0; i < this.laserNumberStack.length; i++) {
      let randomIndex = Math.floor(Math.random() * this.laserNumberStack.length)
      let tempNumber = this.laserNumberStack[i] 
      this.laserNumberStack[i] = this.laserNumberStack[randomIndex]
      this.laserNumberStack[randomIndex] = tempNumber
    }

    this.laserDelay = new DelayData(300)
    this.state = this.STATE_START
    this.laserNumber = this.laserNumberStack.shift()
    this.laserSound1 = soundFile.enemyAttack.jemulBossAttack
    this.laserSound2 = soundFile.enemyAttack.jemulBossAttack2
    this.laserSound3 = soundFile.enemyAttack.jemulBossAttack3
  }

  requestStateStop () {
    this.state = this.STATE_STOP
  }

  requestDie () {
    this.state = this.STATE_DIE
  }

  laserReset () {
    this.laserDelay.count = 0 // 레이저 딜레이카운트 리셋
    for (let i = 0; i < this.laserObject.length; i++) {
      this.laserObject[i].x = 0
      this.laserObject[i].y = 0
      this.laserObject[i].width = 0
      this.laserObject[i].height = 0
      this.laserObject[i].degree = 0
    }
  }

  setLaser (index, x, y, width, height, degree = 0, color1 = 'black', color2 = 'black') {
    if (typeof degree === 'string') {
      throw new Error('각도 값에 문자열을 사용할 수 없습니다. 인자의 순서를 착각한거 아닌가요?')
    }

    this.laserObject[index].x = x
    this.laserObject[index].y = y
    this.laserObject[index].width = width
    this.laserObject[index].height = height
    this.laserObject[index].degree = degree
    this.laserObject[index].sideColor = color1
    this.laserObject[index].middleColor = color2
  }

  processEnimation () {
    if (this.state === this.STATE_STOP) {
      // 에니메이션을 마지막프레임으로 고정
      this.enimation.frameCount = 7
      this.enimation.elapsedFrame = this.ENIMATION_MAX_FRAME - 1
      this.enimation.finished = true
    } else {
      super.processEnimation()
    }
  }

  process () {
    if (this.state === this.STATE_STOP && this.hp <= 0) {
      // 특정 상태에서는 더이상 죽지 않음. (죽음 상태 제외)
      this.hp = 100000
    }

    if (this.state === this.STATE_DIE) {
      this.hp = 0
    }

    super.process()
    this.processLaser()
  }

  processLaser () {
    if (this.state !== this.STATE_LASER) {
      this.laserReset()
      return
    }

    switch (this.laserNumber) {
      case this.LASER_4WAYLINE: this.processLaser4wayLine(); break
      case this.LASER_6WAYROTATE: this.processLaser6wayRotate(); break
      case this.LASER_BOTTOMLINE: this.processLaserBottomLine(); break
      case this.LASER_CENTERCHASE: this.processLaserCenterChase(); break
      case this.LASER_LEFTMOVE: this.processLaserLeftmove(); break
      case this.LASER_SQUARELINE: this.processLaserSquareLine(); break
      case this.LASER_RANDOM4WAY: this.processLaserRandom4way(); break
    }
    this.processLaserAttack()

    // (모든 처리가 끝난 후) 레이저 딜레이 카운트 증가. count 0부터 확인하기 위해 count증가를 맨 마지막에 처리
    if (this.laserDelay.check()) {
      // 레이저 패턴 변경
      this.laserNumber = this.laserNumberStack.shift()
      if (this.laserNumber === undefined) {
        this.laserNumber = Math.floor(Math.random() * 6)
      }

      this.laserReset()
    }
  }

  processLaserAttack () {
    if (this.laserDelay.divCheck(this.LASER_DELAY)) {
      const player = fieldState.getPlayerObject()

      for (let i = 0; i < this.laserObject.length; i++) {
        const laser = this.laserObject[i]

        // 레이저의 충돌조건 처리 (if 조건문 처럼 만듬)
        const isCollisionA = laser.degree === 0 && collision(player, laser)
        const isCollisionB = laser.degree !== 0 && collisionClass.collisionOBB(player, laser)

        // 여러개의 레이저 중 하나라도 타격당했다면, 중복 타격을 막기 위해 반복문 종료
        if (isCollisionA || isCollisionB) {
          player.addDamage(this.LASER_ATTACK)
          break
        }
      }
    }
  }

  processLaser4wayLine () {
    // 레이저 2줄 (상하, 좌우) 중심축으로부터 발사
    const VERTICAL = 0
    const HORIZONTAL = 1
    const LASER_SIZE = 200
    const UP_SIZE = 10
    const COLOR1 = '#FF512F'
    const COLOR2 = '#F09819'
    const W_HALF = graphicSystem.CANVAS_WIDTH_HALF
    const H_HALF = graphicSystem.CANVAS_HEIGHT_HALF

    if (this.laserDelay.count === 0 || this.laserDelay.count % 150 == 0) {
      this.setLaser(VERTICAL, W_HALF, H_HALF - (LASER_SIZE / 2), 0, LASER_SIZE, 0, COLOR1, COLOR2)
      this.setLaser(HORIZONTAL, W_HALF - (LASER_SIZE / 2), H_HALF, LASER_SIZE, 0, 0, COLOR1, COLOR2)
    } else if (this.laserDelay.count >= 1) {
      // 레이저 사이즈 지속적으로 증가
      if (this.laserObject[VERTICAL].width < 1600) {
        this.laserObject[VERTICAL].width += UP_SIZE
        this.laserObject[VERTICAL].x -= (UP_SIZE / 2)
      }

      if (this.laserObject[HORIZONTAL].height < 1600) {
        this.laserObject[HORIZONTAL].height += UP_SIZE
        this.laserObject[HORIZONTAL].y -= (UP_SIZE / 2)
      }
    }

    // 사운드 출력
    if (this.laserDelay.count % 150 === 0) soundSystem.play(this.laserSound1)
  }

  processLaserLeftmove () {
    const UPLASER = 0
    const DOWNLASER = 1
    const LASER_WIDTH = 1600
    const COLOR1 = '#FFE000'
    const COLOR2 = '#799F0C'
    const MOVE_X = 8
    const G_WIDTH = graphicSystem.CANVAS_WIDTH
    const G_HEIGHT = graphicSystem.CANVAS_HEIGHT

    if (this.laserDelay.count === 0 || this.laserDelay.count % 150 == 0) {
      let saveArea = Math.floor(Math.random() * ((G_HEIGHT - 12) / 10)) * 10
      let saveAreaY1 = saveArea - 60
      let saveAreaY2 = saveArea + 60
      this.setLaser(UPLASER, G_WIDTH + 200, saveAreaY1 - LASER_WIDTH, LASER_WIDTH, LASER_WIDTH, 0, COLOR1, COLOR2)
      this.setLaser(DOWNLASER, G_WIDTH + 200, saveAreaY2, LASER_WIDTH, LASER_WIDTH, 0, COLOR1, COLOR2)
    } else {
      for (let i = 0; i < 2; i++) {
        // 모든 레이저는 왼쪽으로 이동
        this.laserObject[i].x -= MOVE_X
        if (this.laserObject[i].x < 0 - G_WIDTH) {
          this.laserObject[i].x = 0
        }
      }
    }

    if (this.laserDelay.count % 150 === 0) soundSystem.play(this.laserSound2)
  }

  processLaserBottomLine () {
    // 대각선 도형 구현이 힘든 관계로, 수직형태의 레이저를 발사하는것으로 대신합니다.
    const LASER_WIDTH = 40
    const LASER_HEIGHT = 1600
    const COLOR1 = '#42275a'
    const COLOR2 = '#734b6d'
    const LASER_SPEED = 6
    const G_HEIGHT = graphicSystem.CANVAS_HEIGHT
    const SECTION = 160

    if (this.laserDelay.count === 0 || this.laserDelay.count % 150 == 0) {
      let randomX = Math.floor(Math.random() * SECTION)
      for (let i = 0; i < this.laserObject.length; i++) {
        this.setLaser(i, randomX + (i * 120), G_HEIGHT + 100, LASER_WIDTH, LASER_HEIGHT, 0, COLOR1, COLOR2)
      }
    } else {
      for (let i = 0; i < this.laserObject.length; i++) {
        this.laserObject[i].y -= LASER_SPEED

        if (this.laserObject[i].y + G_HEIGHT < 0) {
          this.laserObject[i].y = 0
        }
      }
    }

    if (this.laserDelay.count % 150 === 0) soundSystem.play(this.laserSound3)
  }

  processLaserCenterChase () {
    const LASER_WIDTH = 1600
    const LASER_HEIGHT = 100
    const MOVE_SIZE = 8
    const HEIGHT_SIZE = 1
    const COLOR1 = '#0B486B' 
    const COLOR2 = '#F56217'
    const GW_HALF = graphicSystem.CANVAS_WIDTH_HALF
    const GH_HALF = graphicSystem.CANVAS_HEIGHT_HALF


    if (this.laserDelay.count === 0 || this.laserDelay.count % 150 == 0) {
      for (let i = 0; i < this.laserObject.length; i++) {
        this.setLaser(i, GW_HALF, GH_HALF, 0, 0, Math.random() * 360, COLOR1, COLOR2)
      }

      // 0번 레이저는 주인공이 있는곳에 발사
      const playerX = fieldState.getPlayerObject().centerX
      const playerY = fieldState.getPlayerObject().centerY
      const distanceX = playerX - graphicSystem.CANVAS_WIDTH_HALF
      const distanceY = playerY - graphicSystem.CANVAS_HEIGHT_HALF
      const atangent = Math.atan2(distanceY, distanceX)
      this.laserObject[0].degree = atangent * (180 / Math.PI)
    } else {
      for (let i = 0; i < this.laserObject.length; i++) {
        if (this.laserObject[i].width < LASER_WIDTH) {
          this.laserObject[i].width += MOVE_SIZE
          this.laserObject[i].x -= (MOVE_SIZE / 2)
        }

        if (this.laserObject[i].height < LASER_HEIGHT) {
          this.laserObject[i].height += HEIGHT_SIZE
          this.laserObject[i].y -= (HEIGHT_SIZE / 2)
        }
      }
    }

    if (this.laserDelay.count % 150 === 0) soundSystem.play(this.laserSound3)
  }

  processLaserRandom4way () {
    const LASER_SIZE = 40
    const MOVE_SIZE = 10
    const COLOR1 = '#B2FEFA'
    const COLOR2 = '#0ED2F7'

    if (this.laserDelay.count === 0 || this.laserDelay.count % 150 == 0) {
      const POSITION_RANGE = 200
      const RANGEX = graphicSystem.CANVAS_WIDTH - POSITION_RANGE
      const RANGEY = graphicSystem.CANVAS_HEIGHT - POSITION_RANGE
      for (let i = 0; i < this.laserObject.length; i += 2) {
        // 렝리저 2개를 같이 사용하는데 홀수개수면 문제가 발생하므로 break 해서 레이저 처리를 무시
        if (i + 1 >= this.laserObject.length) break

        const randomX = Math.random() * RANGEX
        const randomY = Math.random() * RANGEY
        this.setLaser(i + 0, randomX + (POSITION_RANGE / 2), randomY + (POSITION_RANGE / 2), 0, LASER_SIZE, 0, COLOR1, COLOR2)
        this.setLaser(i + 1, randomX + (POSITION_RANGE / 2), randomY + (POSITION_RANGE / 2), LASER_SIZE, 0, 0, COLOR1, COLOR2)
      }
    } else {
      for (let i = 0; i < this.laserObject.length; i += 2) {
        if (i + 1 >= this.laserObject.length) break

        if (this.laserObject[i + 0].width <= 2400) {
          this.laserObject[i + 0].x -= (MOVE_SIZE / 2)
          this.laserObject[i + 0].width += MOVE_SIZE
        }
        if (this.laserObject[i + 1].height <= 2400) {
          this.laserObject[i + 1].y -= (MOVE_SIZE / 2)
          this.laserObject[i + 1].height += MOVE_SIZE
        }
      }
    }

    if (this.laserDelay.count % 150 === 0) soundSystem.play(this.laserSound1)
  }

  processLaser6wayRotate () {
    const LASER_SIZE = 40
    const UP_SIZE = 20
    const COLOR1 = '#52c234'
    const COLOR2 = '#061700'
    const GW_HALF = graphicSystem.CANVAS_WIDTH_HALF
    const GH_HALF = graphicSystem.CANVAS_HEIGHT_HALF

    if (this.laserDelay.count === 0 || this.laserDelay.count % 150 == 0) {
      for (let i = 0; i < this.laserObject.length; i++) {
        let degree = (360 / this.laserObject.length) * i
        this.setLaser(i, GW_HALF, GH_HALF - (LASER_SIZE / 2), 0, LASER_SIZE, degree, COLOR1, COLOR2)
      }
    } else if (this.laserDelay.count >= 1) {
      for (let i = 0; i < this.laserObject.length; i++) {
        if (this.laserObject[i].width < 1600) {
          this.laserObject[i].width += UP_SIZE
          this.laserObject[i].x -= (UP_SIZE / 2)
        }

        // 회전기능 추가
        this.laserObject[i].degree += 0.7
      }
    }

    if (this.laserDelay.count % 150 === 0) soundSystem.play(this.laserSound2)
  }

  processLaserSquareLine () {
    const V_TOP = 0
    const V_BOTTOM = 2
    const H_LEFT = 3
    const H_RIGHT = 5
    const LASER_SIZE = 30
    const UP_SIZE_A = 60
    const UP_SIZE_B = 2
    const MAX_SIZE_A = 800
    const MAX_SIZE_B = 800
    const COLOR1 = '#403B4A'
    const COLOR2 = '#E7E9BB'
    const GW_HALF = graphicSystem.CANVAS_WIDTH_HALF
    const GH_HALF = graphicSystem.CANVAS_HEIGHT_HALF
    const G_WIDTH = graphicSystem.CANVAS_WIDTH
    const G_HEIGHT = graphicSystem.CANVAS_HEIGHT

    if (this.laserDelay.count === 0 || this.laserDelay.count % 150 == 0) {
      // 위쪽 영역
      this.setLaser(V_TOP, GW_HALF, 0, 0, LASER_SIZE, 0, COLOR1, COLOR2)

      // 아래쪽 영역
      this.setLaser(V_BOTTOM, GW_HALF, G_HEIGHT - LASER_SIZE, 0, LASER_SIZE, 0, COLOR1, COLOR2)

      // 왼쪽 영역
      this.setLaser(H_LEFT, 0, GH_HALF, LASER_SIZE, 0, 0, COLOR1, COLOR2)

      // 오른쪽 영역
      this.setLaser(H_RIGHT, G_WIDTH - LASER_SIZE, GH_HALF, LASER_SIZE, 0, 0, COLOR1, COLOR2)

    } else if (this.laserDelay.count % 2 === 0) {
      // 먼저, 좌우(상하) 쪽으로 빠르게 화면을 덮은 후, 점점 영역이 커짐.
      if (this.laserObject[V_TOP].width < MAX_SIZE_A) {
        this.laserObject[V_TOP].width += UP_SIZE_A
        this.laserObject[V_TOP].x -= (UP_SIZE_A / 2)
        this.laserObject[V_BOTTOM].width += UP_SIZE_A
        this.laserObject[V_BOTTOM].x -= (UP_SIZE_A / 2)
      } else if (this.laserObject[V_TOP].height < MAX_SIZE_B) {
        this.laserObject[V_TOP].height += UP_SIZE_B
        this.laserObject[V_TOP].y -= (UP_SIZE_B / 2)
        this.laserObject[V_BOTTOM].height += UP_SIZE_B
        this.laserObject[V_BOTTOM].y -= (UP_SIZE_B / 2)
      }

      if (this.laserObject[H_LEFT].height < MAX_SIZE_A) {
        this.laserObject[H_LEFT].height += UP_SIZE_A
        this.laserObject[H_LEFT].y -= (UP_SIZE_A / 2)
        this.laserObject[H_RIGHT].height += UP_SIZE_A
        this.laserObject[H_RIGHT].y -= (UP_SIZE_A / 2)
      } else if (this.laserObject[H_LEFT].width < MAX_SIZE_B) {
        this.laserObject[H_LEFT].width += UP_SIZE_B
        this.laserObject[H_LEFT].x -= (UP_SIZE_B / 2)
        this.laserObject[H_RIGHT].width += UP_SIZE_B
        this.laserObject[H_RIGHT].x -= (UP_SIZE_B / 2)
      }
    }

    if (this.laserDelay.count % 150 === 0) soundSystem.play(this.laserSound2)
  }

  processMove () {
    // 이 보스는 화면 중심으로 이동한 다음, 더이상 움직이지 않습니다.
    if (this.state === this.STATE_START) {
      let centerDistanceX = Math.abs(this.centerX - graphicSystem.CANVAS_WIDTH_HALF)
      let centerDistanceY = Math.abs(this.centerY - graphicSystem.CANVAS_HEIGHT_HALF)
      if (centerDistanceX <= 4 && centerDistanceY <= 4) {
        // 적이 센터로 이동했다면, 강제로 center로 이동하고 상태를 moveComplete로 변경
        this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
        this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
        this.moveSpeedX = 0
        this.moveSpeedY = 0
        this.state = this.STATE_LASER
      } else {
        if (this.centerX > graphicSystem.CANVAS_WIDTH_HALF) {
          this.moveDirectionX = 'left'
          this.moveSpeedX = this.MOVE_SPEED
        } else if (this.centerX < graphicSystem.CANVAS_HEIGHT_HALF) {
          this.moveDirectionX = 'right'
          this.moveSpeedX = this.MOVE_SPEED
        }

        if (this.centerY > graphicSystem.CANVAS_HEIGHT_HALF) {
          this.moveDirectionY = 'up'
          this.moveSpeedY = this.MOVE_SPEED
        } else if (this.centerY < graphicSystem.CANVAS_HEIGHT_HALF) {
          this.moveDirectionY = 'down'
          this.moveSpeedY = this.MOVE_SPEED
        }
      }
    }

    super.processMove()
  }

  displayLaser () {
    for (let i = 0; i < this.laserObject.length; i++) {
      const laser = this.laserObject[i];
      if (laser.width === 0 || laser.height === 0) continue

      if (laser.degree != 0) {
        graphicSystem.setDegree(laser.degree)
      }
      graphicSystem.gradientDisplay(laser.x, laser.y, laser.width, laser.height, laser.sideColor, laser.sideColor, laser.middleColor)
      graphicSystem.restoreTransform()
    }
  }

  display () {
    this.displayLaser()
    super.display()
  }

}

class JemulEnemyRedMeteorite extends JemulEnemyData {
  constructor () {
    super()
    this.typeNumber = this.TYPE_NORMAL
    this.setEnemyByCpStat(50, 8, 100)
    this.setAutoImageData(this.image, imageDataInfo.jemulEnemy.redMeteorite)
    this.setMoveSpeed((Math.random() * 4) - 1, (Math.random() * 4) - 1)
    this.setWidthHeight(this.width, this.height)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieMetoriteRed)
    this.isPossibleExit = false
  }
}

class JemulEnemyRedMeteoriteImmortal extends JemulEnemyRedMeteorite {
  constructor () {
    super()
    // 또 죽이는건 의미없다. 단 10점
    this.setEnemyStat(100000, 10, 8)
  }
}

class JemulEnemyRedAir extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.image, imageDataInfo.jemulEnemy.redAir)
    this.setEnemyByCpStat(40, 23)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulRedAir, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireRed, this.width, this.height, 2))
    this.setRandomSpeed(2, 2)
    this.moveDelay = new DelayData(300)
    this.attackDelay = new DelayData(240)
    this.isExitToReset = true
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.setRandomSpeed(2, 2)
      let randomNumberA = Math.random() * 100
      let randomNumberB = Math.random() * 100

      this.moveDirectionX = randomNumberA < 50 ? 'left' : 'right'
      this.moveDirectionY = randomNumberB < 50 ? 'up' : 'down'
    }

    // 에니메이션 플립 설정
    this.enimation.flip = this.moveDirectionX === 'right' ? 1 : 0

    super.processMove()
  }

  processAttack () {
    if ((this.attackDelay.count >= 180 && this.attackDelay.divCheck(30))) {
      let bulletSpeedX = 6
      let bulletX = this.x + this.width
      if (this.moveDirectionX === 'left') {
        bulletSpeedX = -6
        bulletX = this.x
      }

      let enemyBullet = new CustomEnemyBullet(imageFile.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyAir, 6, bulletSpeedX, 0)
      fieldState.createEnemyBulletObject(enemyBullet, bulletX, this.y + (this.height / 4 * 1))
    }

    // attackDelay.check를 안하기 때문에 카운터를 수동으로 증가시켜야 합니다.
    this.attackDelay.check()
  }
}

class JemulEnemyRedShip extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.image, imageDataInfo.jemulEnemy.redShip)
    this.setEnemyByCpStat(41, 24)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulRedAir, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireRed, this.width, this.height, 2))
    this.setRandomSpeed(2, 2)
    this.moveDelay = new DelayData(240)
    this.attackDelay = new DelayData(60)
    this.isExitToReset = true
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.setRandomSpeed(2, 2)
      let randomNumberA = Math.random() * 100
      let randomNumberB = Math.random() * 100

      this.moveDirectionX = randomNumberA < 50 ? 'left' : 'right'
      this.moveDirectionY = randomNumberB < 50 ? 'up' : 'down'
    }

    // 에니메이션 플립 설정
    this.enimation.flip = this.moveDirectionX === 'right' ? 1 : 0

    super.processMove()
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let enemyBullet1 = new CustomEnemyBullet(imageFile.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyShip, 10, 9, 0, 'left')
      let enemyBullet2 = new CustomEnemyBullet(imageFile.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyShip, 10, 9, 0, 'right')
      fieldState.createEnemyBulletObject(enemyBullet1, this.x, this.y)
      fieldState.createEnemyBulletObject(enemyBullet2, this.x, this.y)
    }
  }
}

class JemulEnemyRedJewel extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.image, imageDataInfo.jemulEnemy.redJewel, 3)
    this.setWidthHeight(this.width * 2, this.height * 2)
    this.setEnemyByCpStat(11, 14)
    this.setDieEffectOption(soundFile.enemyDie.enemyDieJemulRedJewel, new CustomEffect(imageFile.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareLineRed, this.width, this.height, 2))
    this.setMoveSpeed(1, 0)
    this.moveDelay = new DelayData(120)
    this.isExitToReset = true
  }

  processMove () {
    if (this.moveDelay.check()) {
      if (this.moveSpeedX < 3) this.moveSpeedX += 6
    }

    if (this.moveSpeedX > 1) {
      this.moveSpeedX -= 0.1
    } 

    super.processMove()
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


//
export const dataExportEnemy = new Map()

// spaceEnemy
dataExportEnemy.set(ID.enemy.spaceEnemy.attack, SpaceEnemyAttack)
dataExportEnemy.set(ID.enemy.spaceEnemy.car, SpaceEnemyCar)
dataExportEnemy.set(ID.enemy.spaceEnemy.comet, SpaceEnemyComet)
dataExportEnemy.set(ID.enemy.spaceEnemy.donggrami, SpaceEnemyDonggrami)
dataExportEnemy.set(ID.enemy.spaceEnemy.energy, SpaceEnemyEnergy)
dataExportEnemy.set(ID.enemy.spaceEnemy.gamjigi, SpaceEnemyGamjigi)
dataExportEnemy.set(ID.enemy.spaceEnemy.light, SpaceEnemyLight)
dataExportEnemy.set(ID.enemy.spaceEnemy.meteorite, SpaceEnemyMeteorite)
dataExportEnemy.set(ID.enemy.spaceEnemy.rocket, SpaceEnemyRocket)
dataExportEnemy.set(ID.enemy.spaceEnemy.square, SpaceEnemySquare)
dataExportEnemy.set(ID.enemy.spaceEnemy.susong, SpaceEnemySusong)
dataExportEnemy.set(ID.enemy.spaceEnemy.boss, SpaceEnemyBoss)

// meteoriteEnemy
dataExportEnemy.set(ID.enemy.meteoriteEnemy.blackMeteo, MeteoriteEnemyBlackMeteo)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.bomb, MeteoriteEnemyBomb)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.bombBig, MeteoriteEnemyBombBig)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.class1, MeteoriteEnemyClass1)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.class2, MeteoriteEnemyClass2)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.class3, MeteoriteEnemyClass3)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.class4, MeteoriteEnemyClass4)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.red, MeteoriteEnemyRed)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.stone, MeteoriteEnemyStone)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.stonePiece, MeteoriteEnemyStonePiece)
dataExportEnemy.set(ID.enemy.meteoriteEnemy.whiteMeteo, MeteoriteEnemyWhiteMeteo)

// jemulEnemy
dataExportEnemy.set(ID.enemy.jemulEnemy.boss, JemulEnemyBoss)
dataExportEnemy.set(ID.enemy.jemulEnemy.bossEye, JemulEnemyBossEye)
dataExportEnemy.set(ID.enemy.jemulEnemy.energyBolt, JemulEnemyEnergyBolt)
dataExportEnemy.set(ID.enemy.jemulEnemy.hellAir, JemulEnemyHellAir)
dataExportEnemy.set(ID.enemy.jemulEnemy.hellDrill, JemulEnemyHellDrill)
dataExportEnemy.set(ID.enemy.jemulEnemy.hellShip, JemulEnemyHellShip)
dataExportEnemy.set(ID.enemy.jemulEnemy.hellSpike, JemulEnemyHellSpike)
dataExportEnemy.set(ID.enemy.jemulEnemy.redAir, JemulEnemyRedAir)
dataExportEnemy.set(ID.enemy.jemulEnemy.redJewel, JemulEnemyRedJewel)
dataExportEnemy.set(ID.enemy.jemulEnemy.redShip, JemulEnemyRedShip)
dataExportEnemy.set(ID.enemy.jemulEnemy.redMeteorite, JemulEnemyRedMeteorite)
dataExportEnemy.set(ID.enemy.jemulEnemy.redMeteoriteImmortal, JemulEnemyRedMeteoriteImmortal)
dataExportEnemy.set(ID.enemy.jemulEnemy.rotateRocket, JemulEnemyRotateRocket)
