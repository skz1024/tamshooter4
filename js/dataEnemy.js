//@ts-check

import { DelayData, FieldData, EnimationData, collision, collisionClass } from "./dataField.js"
import { EffectData, CustomEffect, CustomEditEffect } from "./dataEffect.js"
import { ID } from "./dataId.js"
import { fieldState, fieldSystem } from "./field.js"
import { ImageDataObject, imageDataInfo, imageSrc } from "./imageSrc.js"
import { soundSrc } from "./soundSrc.js"
import { game, gameFunction } from "./game.js"

let graphicSystem = game.graphic
let soundSystem = game.sound

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
     * @type {DelayData | null}
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

    /** 이미지 */ this.imageSrc = null

    /** 
     * 적이 죽으면 나오는 사운드. (isDied가 true이면 dieCheck 함수에서 발동) 
     * 현재는 적만 이 사운드를 가지고 있음.
     * @type {string} soundSrc 객체 내에 있는 변수
     * */ 
    this.dieSound = ''

    /**
     * 적이 죽을경우 나오는 이펙트. 커스텀 이펙트 데이터를 사용하여 제작,
     * 이 클래스를 사용할 때, 해당 객체의 이미지 데이터가 아닌 죽는 이미지 데이터를 사용해주어야 합니다.
     * @type {CustomEffect | null}
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
   * 
   * 무기와 다르게 적의 충돌 영역은 여러개입니다. 물론 하나일 수도 있습니다.
   * 
   * 충돌 영역은 배열로 리턴되므로 참고해주세요. 충돌 영역은 이 함수를 재정의해서 설정해주세요.
   * 
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
   * @param {string} dieSoundSrc 
   * @param {CustomEffect | null} dieEffect 
   */
  setDieEffectOption (dieSoundSrc = '', dieEffect = null) {
    if (dieEffect != null && dieEffect.constructor != CustomEffect) {
      console.warn('경고: dieEffect는 CustomEffectData 클래스를 사용해 데이터를 생성해야 합니다. 다른 경우는 무시됩니다.')
      dieEffect = null
    }
  
    this.dieSound = dieSoundSrc
    this.dieEffect = dieEffect
  }

  process () {
    super.process()
    this.afterInitProcess()

    // 적이 죽지 않았을 때 적과 관련된 행동 처리
    if (!this.isDied) {
      this.isMoveEnable = true
      this.processPossibleExit()
      this.processExitToReset()
      this.processPlayerCollision()
      this.processAttack()
    } else {
      // 적이 죽었다면 이동할 수 없습니다.
      this.isMoveEnable = false
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

      if (this.moveSpeedX === 0) {
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

      if (this.moveSpeedX === 0) {
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

      if (this.moveSpeedY === 0) {
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

      if (this.moveSpeedY === 0) {
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

    if (this.moveDirectionX === FieldData.direction.LEFT) {
      // 왼쪽 방향 이동값이 양수일경우 오른쪽 끝부분(보정치 포함)으로 이동
      if (this.moveSpeedX > 0 && this.x + this.width < -scopeSize) {
        this.x = graphicSystem.CANVAS_WIDTH + this.width + moveAdjust
      } else if (this.moveSpeedX <= 0 && this.x > graphicSystem.CANVAS_WIDTH + scopeSize) {
        // 왼쪽 방향이 아닌 반대로 이동(방향은 왼쪽이나 이동은 오른쪽으로)할경우,
        // 오른쪽 영역을 넘어갈때, 왼쪽 방향에서 나옴
        this.x = 0 - this.width - moveAdjust
      }
    } else if (this.moveDirectionX === FieldData.direction.RIGHT || this.moveDirectionX === '') {
      // 오른쪽 방향 이동값이 양수일경우, 왼쪽 끝부분(보정치 포함)으로 이동
      if (this.moveSpeedX > 0 && this.x > graphicSystem.CANVAS_WIDTH + scopeSize) {
        this.x = 0 - this.width - moveAdjust
      } else if (this.moveSpeedX <= 0 && this.x + this.width < -scopeSize) {
        // 오른쪽 방향으로 되어있지만, 반대방향으로 이동하는경우,
        // 왼쪽 영역을 넘어갈 때, 오른쪽 방향에서 나옴
        this.x = graphicSystem.CANVAS_WIDTH + this.width + moveAdjust
      }
    }

    // y축도 x축과 원리는 동일
    if (this.moveDirectionY === FieldData.direction.UP) {
      if (this.moveSpeedY > 0 && this.y + this.height < -scopeSize) {
        this.y = graphicSystem.CANVAS_HEIGHT + this.height + moveAdjust
      } else if (this.moveSpeedY <= 0 && this.y > graphicSystem.CANVAS_HEIGHT + scopeSize) {
        this.y = 0 - this.height - moveAdjust
      }
    } else if (this.moveDirectionY === FieldData.direction.DOWN || this.moveDirectionY === '') {
      if (this.moveSpeedY > 0 && this.y > graphicSystem.CANVAS_HEIGHT + scopeSize) {
        this.y = 0 - this.height - moveAdjust
      } else if (this.moveSpeedY <= 0 && this.y + this.height < -scopeSize) {
        this.y = graphicSystem.CANVAS_HEIGHT + this.height + moveAdjust
      }
    }

    // if ((this.moveSpeedX < 0 || this.moveDirectionX === 'left') && (this.x + this.width < -scopeSize || this.x > graphicSystem.CANVAS_WIDTH + scopeSize)) {
    //   this.x = graphicSystem.CANVAS_WIDTH + this.width + moveAdjust
    // } else if ((this.moveSpeedX > 0 || this.moveDirectionX === 'right') && (this.x > graphicSystem.CANVAS_WIDTH + scopeSize || this.x + this.width < -scopeSize)) {
    //   this.x = 0 - this.width - moveAdjust
    // }

    // if ((this.moveSpeedY < 0 || this.moveDirectionY === 'up') && (this.y + this.height < -scopeSize || this.y > graphicSystem.CANVAS_HEIGHT + scopeSize)) {
    //   this.y = graphicSystem.CANVAS_HEIGHT + this.height + moveAdjust
    // } else if ((this.moveSpeedY > 0 || this.moveDirectionY === 'down') && (this.y > graphicSystem.CANVAS_HEIGHT + scopeSize || this.y + this.height < -scopeSize)) {
    //   this.y = 0 - this.height - moveAdjust
    // }
  }

  /**
   * 만약 적이 공격해야 할 일이 있다면 이 함수를 작성해주세요.
   * 다만 대부분의 적들은 공격을 하지 않고 충돌만 합니다. 
   * 
   * 참고로 충돌데미지는 공격력 값을 사용하지만 공격데미지는 사용자가 새로 변수를 만들어서 값을 설정해주어야 합니다.
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

  /** 적을 (자기 자신이 스스로) 죽이도록 요청 */
  requestDie () {
    this.isDied = true
    this.processDieDefault()
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
    super.process()
    this.processCollision()

    if (this.outAreaCheck()) {
      this.isDeleted = true
    }

    if (this.elapsedFrame >= 600) {
      this.isDeleted = true
    }
  }

  processCollision () {
    if (this.attack === 0) return

    let player = fieldState.getPlayerObject()
    let playerSendXY = { x: player.x, y: player.y, width: player.width, height: player.height}
    
    if (collision(playerSendXY, this)) {
      player.addDamage(this.attack)
      this.isDeleted = true
    }
  }

  outAreaCheck () {
    if (this.x + this.width < -graphicSystem.CANVAS_WIDTH / 2 ||
      this.x > graphicSystem.CANVAS_WIDTH + (graphicSystem.CANVAS_WIDTH / 2) ||
      this.y + this.height < -graphicSystem.CANVAS_HEIGHT / 2 ||
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
 * 참고: 클래스를 넘겨도 되고, 인스턴스(getCreateObject)를 통해 넘겨도 됩니다. 
 * 
 * 다만, 클래스 자체 수정(process, display함수를 수정한다던가) 이 필요하다면, 이 클래스를 상속받아야 합니다.
 */
export class CustomEnemyBullet extends EnemyBulletData {
  /**
   * @param {ImageDataObject | null} imageData 
   */
  constructor (imageSrc = '', imageData = null, attack = 0, moveSpeedX = 0, moveSpeedY = 0, moveDirectionX = '', moveDirectionY = '') {
    super()
    this.setAutoImageData(imageSrc, imageData)
    this.attack = attack
    this.setMoveDirection(moveDirectionX, moveDirectionY)
    this.setMoveSpeed(moveSpeedX, moveSpeedY)
  }

  /** 새 오브젝트 불릿 객체를 생성합니다. 이 객체를 필드 데이터에 넘겨주세요. */
  getCreateObject () {
    return new CustomEnemyBullet(this.imageSrc, this.imageData, this.attack, this.moveSpeedX, this.moveSpeedY, this.moveDirectionX, this.moveDirectionY)
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
    this.moveSpeedX = 0
  }

  display () {
    super.display()
    gameFunction.digitalDisplay('totaldamage: ' + (1000000 - this.hp), 0, 40)
  }
}

class TempleatEnemy extends EnemyData {

}



/**
 * 1-1 spaceEnemy: baseCp: 40000
 */
class SpaceEnemyData extends EnemyData {
  constructor () {
    super()
    this.imageSrc = imageSrc.enemy.spaceEnemy
    this.baseCp = 40000
  }
}

class SpaceEnemyLight extends SpaceEnemyData {
  constructor () {
    super()
    this.colorNumber = Math.floor(Math.random() * 8)
    this.setAutoImageData(this.imageSrc, imageDataInfo.spaceEnemy.spaceLight)
    this.setEnemyByCpStat(4, 1) // hp 1600 고정
    // this.setEnemyStat(2000 + (this.colorNumber * 100), 20 + (this.colorNumber + 1), 1)
    this.dieAfterDeleteDelay = new DelayData(20)
    this.moveSpeedX = Math.random() * 8 - 4
    this.moveSpeedY = Math.random() * 8 - 4
    this.isPossibleExit = true
    this.isExitToReset = true
    this.dieSound = soundSrc.enemyDie.enemyDieSpaceLight
  }

  display () {
    const alpha = (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count) / this.dieAfterDeleteDelay.delay
    graphicSystem.setAlpha(alpha)
    graphicSystem.imageDisplay(this.imageSrc, this.imageData.x + (this.colorNumber * this.imageData.width), this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
    graphicSystem.setAlpha(1)
  }
}

class SpaceEnemyRocket extends SpaceEnemyData {
  constructor () {
    super()
    this.setEnemyByCpStat(10, 10)

    // 로켓은 두종류의 이미지가 있고, 그 중 랜덤으로 선택
    this.imageData = Math.random() * 1 < 0.5 ? imageDataInfo.spaceEnemy.rocketBlue : imageDataInfo.spaceEnemy.rocketRed
    this.setAutoImageData(this.imageSrc, this.imageData, 4)
    this.setMoveSpeed(4 + Math.random() * 2, 0)
    this.isPossibleExit = true
    this.isExitToReset = true
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceRocket, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedWhite, this.height, this.height, 2))
  }
}

class SpaceEnemyCar extends SpaceEnemyData {
  constructor () {
    super()
    this.setEnemyByCpStat(12, 10)
    this.setAutoImageData(this.imageSrc, imageDataInfo.spaceEnemy.greenCar, 4)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceCar, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.car1, this.height, this.height, 2))
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
    this.setAutoImageData(this.imageSrc, imageDataInfo.spaceEnemy.blueSqaure, 4)
    this.setEnemyByCpStat(20, 16)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceSquare, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareGrey, this.width, this.height, 2))
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
    this.setAutoImageData(this.imageSrc, imageDataInfo.spaceEnemy.blueAttack, 4)
    this.setEnemyByCpStat(14, 12)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceSquare, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.diamondBlue, this.width, this.height, 2))
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
    this.setAutoImageData(this.imageSrc, imageDataInfo.spaceEnemy.purpleEnergy, 4)
    this.setEnemyByCpStat(20, 10)
    this.setMoveSpeed(4, 4)
    this.setMoveDirection()
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceEnergy, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareLinePurple, this.width, this.height, 2))
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
    this.setAutoImageData(this.imageSrc, imageDataInfo.spaceEnemy.susong, 3)
    this.setEnemyByCpStat(80, 20)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceSusong, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.smallCircleUp, this.width / 2, this.width / 2, 2, 2))
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
        graphicSystem.imageDisplay(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height, 1)
      } else {
        graphicSystem.imageDisplay(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
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
    this.setAutoImageData(imageSrc.enemy.spaceEnemy, imageDataInfo.spaceEnemy.gamjigi)
    this.setEnemyByCpStat(20, 12)
    this.setMoveDirection()
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceGamjigi, new CustomEffect(imageSrc.enemyDie.enemyDieSpaceGamjigi, imageDataInfo.enemyDieEffectEx.enemyDieSpaceGamjigi, this.width, this.height, 3))
    this.moveDelay = new DelayData(300)
    this.boostCount = 0
    this.degree = 0
    this.state = 'chase'
  }

  static gamjigiRotate

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
    if (this.imageSrc) {
      graphicSystem.imageDisplay(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height, 0, this.degree)
    }
  }
}

class SpaceEnemyComet extends SpaceEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.spaceEnemy, imageDataInfo.spaceEnemy.comet, 2)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceComet, new CustomEffect(imageSrc.enemyDie.enemyDieSpaceComet, imageDataInfo.enemyDieEffectEx.enemyDieSapceComet, this.width, this.height, 4))
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
      soundSrc.enemyDie.enemyDieMeteorite1,
      soundSrc.enemyDie.enemyDieMeteorite2,
      soundSrc.enemyDie.enemyDieMeteorite3,
      soundSrc.enemyDie.enemyDieMeteorite4,
      soundSrc.enemyDie.enemyDieMeteorite5,
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
    this.setAutoImageData(imageSrc.enemy.spaceEnemy, imageDataList[meteoriteNumber])
    this.setDieEffectOption(dieSoundList[meteoriteNumber], new CustomEffect(imageSrc.enemyDie.enemyDieMeteorite, dieEffectImageDataList[meteoriteNumber], this.width, this.height, 4))
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
    graphicSystem.imageDisplay(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height, 0, this.degree)
  }
}

class SpaceEnemyBoss extends SpaceEnemyData {
  constructor () {
    super()
    
    this.setAutoImageData(imageSrc.enemy.spaceEnemy, imageDataInfo.spaceEnemy.bossSqaure, 6)
    // 보스의 크기는 300x300, 이미지 자동설정 후에 크기를 설정하는 이유는, autoImageData함수가 크기를 자동으로 지정해두기 때문
    this.setWidthHeight(300, 300)
    this.setEnemyByCpStat(3000, 40, 200)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceCar, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.car1, this.width, this.height, 1, 2))

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
    let dieSoundTarget = Math.random() * 100 < 50 ? soundSrc.enemyDie.enemyDieDonggrami : soundSrc.enemyDie.enemyDieDonggrami
    this.setAutoImageData(this.imageSrc, imageDataTarget)
    this.setEnemyByCpStat(36, 15)
    this.setDieEffectOption(dieSoundTarget)
    this.dieAfterDeleteDelay = new DelayData(240)
    this.isPossibleExit = false
    this.setRandomMoveSpeed(3, 3)
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
    this.imageSrc = imageSrc.enemy.meteoriteEnemy
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
      soundSrc.enemyDie.enemyDieMeteorite1,
      soundSrc.enemyDie.enemyDieMeteorite2,
      soundSrc.enemyDie.enemyDieMeteorite3,
      soundSrc.enemyDie.enemyDieMeteorite4,
      soundSrc.enemyDie.enemyDieMeteorite5
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
    this.setAutoImageData(imageSrc.enemy.meteoriteEnemy, imageDataList[imageNumber])
    this.setDieEffectOption(dieSoundList[dieSoundNumber], new CustomEffect(imageSrc.enemyDie.enemyDieMeteorite, dieImageDataList[dieImageNumber], this.width, this.height, 1))
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
      soundSrc.enemyDie.enemyDieMeteorite1,
      soundSrc.enemyDie.enemyDieMeteorite2,
      soundSrc.enemyDie.enemyDieMeteorite3,
      soundSrc.enemyDie.enemyDieMeteorite4,
      soundSrc.enemyDie.enemyDieMeteorite5
    ]

    let imageNumber = Math.floor(Math.random() * MAX_NUM)
    let soundNumber = Math.floor(Math.random() * dieSoundTable.length)

    this.typeNumber = Math.floor(Math.random() * 5)
    this.setAutoImageData(imageSrc.enemy.meteoriteEnemy, imageDataTable[imageNumber])
    this.setEnemyByCpStat(15, 12)
    this.setMoveSpeed((Math.random() * 2) - 1, (Math.random() * 2) - 1)
    this.setDieEffectOption(dieSoundTable[soundNumber], new CustomEffect(imageSrc.enemyDie.enemyDieMeteorite, imageDataInfo.enemyDieMeteorite.enemyDieMeteoriteWhite, this.width, this.height, 1))
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
    this.setAutoImageData(imageSrc.enemy.meteoriteEnemy, imageDataTable[imageNumber])
    this.setEnemyByCpStat(18, 12)
    this.dieEffect = new CustomEffect(imageSrc.enemyDie.enemyDieMeteorite, imageDataInfo.enemyDieMeteorite.enemyDieMeteoriteBlack, this.width, this.height, 4)
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
    this.setAutoImageData(imageSrc.enemy.meteoriteEnemy, imageDataInfo.meteoriteEnemy.bomb)
    this.setMoveSpeed(Math.random() * 3, Math.random() * 3)
    this.isExitToReset = true
    this.dieSound = soundSrc.enemyDie.enemyDieMeteoriteBomb
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

    this.setAutoImageData(imageSrc.enemy.meteoriteEnemy, imageDataList[imageNumber])
    this.setEnemyByCpStat(50, 20)
    this.setRandomMoveSpeed(2, 2)
    this.width = 160
    this.height = 160
    this.isExitToReset = true
    this.dieSound = soundSrc.enemyDie.enemyDieSpaceRocket
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

    this.setAutoImageData(imageSrc.enemy.meteoriteEnemy, imageDataList[this.stoneType][this.pieceNumber])
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceSmall, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareGrey, this.width, this.height, 1))
    this.setEnemyByCpStat(10, 10)
    this.setRandomMoveSpeed(4, 4)
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
    this.setAutoImageData(this.imageSrc, imageDataList[imageDataNumber])
    this.setWidthHeight(this.width * 2, this.height * 2) // 크기 2배 증가
    this.setEnemyByCpStat(50, 40)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieMeteoriteRed, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.noiseRed, this.width, this.height, 4))
    this.setRandomMoveSpeed(3, 2)
  }
}


class JemulEnemyData extends EnemyData {
  constructor () {
    super()
    this.baseCp = 40000
    this.imageSrc = imageSrc.enemy.jemulEnemy
  }
}

class JemulEnemyRotateRocket extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.rotateRocket, 5)
    this.setEnemyByCpStat(10, 20)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulRocket, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedOrange, this.width, this.width, 2))

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
    this.setAutoImageData(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.energyBolt)
    this.setEnemyByCpStat(12, 12)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulEnergyBolt, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.pulseDiamondBlue, this.width, this.height, 2))
    this.setRandomMoveSpeed(2, 3)
    this.moveDelay = new DelayData(180)
    this.attackDelay = new DelayData(180)
    this.bulletDamage = 15
    this.bulletSize = 160
    this.isExitToReset = true

    this.bulletEffect = new CustomEffect(imageSrc.enemyBullet.energyBoltAttack, imageDataInfo.enemyBullet.jemulEnergyBoltAttack, 160, 160, 2)
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.setRandomMoveSpeed(2, 3)
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
      soundSystem.play(soundSrc.enemyAttack.jemulEnergyBoltAttack)
    }
  }
}

class JemulEnemyEnergyBoltAttackEffect extends EffectData {
  constructor () {
    super()
    this.autoSetEnimation(imageSrc.enemyBullet.energyBoltAttack, imageDataInfo.enemyBullet.jemulEnergyBoltAttack, 160, 160, 3)
  }
}

class JemulEnemyHellSpike extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.hellSpike)
    this.setEnemyByCpStat(10, 10)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulSpike, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.diamondMagenta, this.width, this.height, 2))
    this.setRandomMoveSpeed(3, 3)
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
        let enemyBullet = new CustomEnemyBullet(imageSrc.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyHellSpike, 10, 3, 3, moveDirectionX[i], moveDirectionY[i])
        enemyBullet.setAutoRotate()
        fieldState.createEnemyBulletObject(enemyBullet, centerX, centerY)
      }
    }
  }
}

class JemulEnemyHellDrill extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.hellDrill, 0)
    this.setEnemyByCpStat(15, 3)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulDrill, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.smallCircleUp, this.width, this.height, 3))
    
    // 드릴은 초당 10회 공격 가능 (일반적인 적들은 초당 1회 제한)
    this.collisionDelay.delay = 6

    this.moveDelay = new DelayData(240)
    this.setMoveDirection()
    this.setRandomMoveSpeed(4, 2)
    this.isExitToReset = true
    this.state = ''
  }

  processPlayerCollision () {
    if (this.collisionDelay.check(false)) {
      const player = fieldState.getPlayerObject()
      const enemy = this.getCollisionArea() // 적은 따로 충돌 영역을 얻습니다.

      for (let i = 0; i < enemy.length; i++) {
        if (collision(enemy[i], player)) {
          soundSystem.play(soundSrc.enemyAttack.jemulHellDrillAttack) // 공격 성공시 사운드 출력
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
    this.setAutoImageData(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.hellShipFront)
    this.setEnemyByCpStat(23, 20)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulHellShip, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireBlue, this.width, this.height, 2))
    let up = imageDataInfo.jemulEnemy.hellShipUp
    let down = imageDataInfo.jemulEnemy.hellShipDown
    this.enimationUp  = new EnimationData(this.imageSrc, up.x, up.y, up.width, up.height, up.frame, 1, -1, this.width, this.height)
    this.enimationDown  = new EnimationData(this.imageSrc, down.x, down.y, down.width, down.height, down.frame, 1, -1, this.width, this.height)
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
      let enemyBullet = new CustomEnemyBullet(imageSrc.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyShip, 15, 4, 0, FieldData.direction.LEFT)
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
    this.setAutoImageData(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.hellAirFront)
    this.setEnemyByCpStat(20, 20)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulHellAir, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireBlue, this.width, this.height, 2))
    let up = imageDataInfo.jemulEnemy.hellAirUp
    let down = imageDataInfo.jemulEnemy.hellAirDown
    this.enimationUp  = new EnimationData(this.imageSrc, up.x, up.y, up.width, up.height, up.frame, 1, -1, this.width, this.height)
    this.enimationDown  = new EnimationData(this.imageSrc, down.x, down.y, down.width, down.height, down.frame, 1, -1, this.width, this.height)
    this.state = 'front'
    this.isExitToReset = true
    this.setRandomMoveSpeed(4, 4)
    this.moveDelay = new DelayData(120)
    this.attackDelay = new DelayData(150)
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.setRandomMoveSpeed(4, 4)
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
        let enemyBullet = new CustomEnemyBullet(imageSrc.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyAir, 6, bulletSpeedX, speedYList[i])
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

    this.setAutoImageData(this.imageSrc, imageDataInfo.jemulEnemy.jemulBoss, 5)
    this.setWidthHeight(360, 300) // 크기 3배
    this.setEnemyByCpStat(2000, 50, 200)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulBoss, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.car1, this.width, this.height, 4))
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

    // 효과음 로드
    soundSystem.createAudio(soundSrc.enemyAttack.jemulBossAttack)
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

    let enemyBullet = new CustomEnemyBullet(imageSrc.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyShip, 20, bulletSpeedX, bulletSpeedY, '', '')
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
      soundSystem.play(soundSrc.enemyAttack.jemulBossAttack)
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
      soundSystem.play(soundSrc.enemyAttack.jemulBossAttack)
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
    this.setAutoImageData(this.imageSrc, imageDataInfo.jemulEnemy.jemulBossEye, 5)
    this.setWidthHeight(400, 240) // 크기 3배
    this.setEnemyStat(40000 * 60 * 4, 8000, 0)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulBossEye, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.noiseRed, this.width, this.height, 10))
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
    this.laserSound1 = soundSrc.enemyAttack.jemulBossAttack
    this.laserSound2 = soundSrc.enemyAttack.jemulBossAttack2
    this.laserSound3 = soundSrc.enemyAttack.jemulBossAttack3

    // 사운드 로드
    soundSystem.createAudio(this.laserSound1)
    soundSystem.createAudio(this.laserSound2)
    soundSystem.createAudio(this.laserSound3)
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
    // 이 보스는 반드시 중앙에 위치하며 서서히 등장합니다.
    if (this.state === this.STATE_START) {
      // 적이 센터로 이동했다면, 강제로 center로 이동
      this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
      this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
      this.setMoveSpeed(0, 0)
      
      // 생성된지 60프레임 이후에 상태를 laser로 변경
      if (this.elapsedFrame >= 60) {
        this.state = this.STATE_LASER
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

    // 일정시간 동안 투명 값 변경을 이용하여 서서히 등장(...)
    if (this.elapsedFrame <= 120) {
      let alpha = 1 / 120 * this.elapsedFrame
      graphicSystem.setAlpha(alpha)
      super.display()
      graphicSystem.setAlpha(1)
    } else {
      super.display()
    }
  }

}

class JemulEnemyRedMeteorite extends JemulEnemyData {
  constructor () {
    super()
    this.typeNumber = this.TYPE_NORMAL
    this.setEnemyByCpStat(50, 8, 100)
    this.setAutoImageData(this.imageSrc, imageDataInfo.jemulEnemy.redMeteorite)
    this.setMoveSpeed((Math.random() * 4) - 1, (Math.random() * 4) - 1)
    this.setWidthHeight(this.width, this.height)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieMeteoriteRed)
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
    this.setAutoImageData(this.imageSrc, imageDataInfo.jemulEnemy.redAir)
    this.setEnemyByCpStat(40, 23)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulRedAir, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireRed, this.width, this.height, 2))
    this.setRandomMoveSpeed(2, 2)
    this.moveDelay = new DelayData(300)
    this.attackDelay = new DelayData(240)
    this.isExitToReset = true
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.setRandomMoveSpeed(2, 2)
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

      let enemyBullet = new CustomEnemyBullet(imageSrc.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyAir, 6, bulletSpeedX, 0)
      fieldState.createEnemyBulletObject(enemyBullet, bulletX, this.y + (this.height / 4 * 1))
    }

    // attackDelay.check를 안하기 때문에 카운터를 수동으로 증가시켜야 합니다.
    this.attackDelay.check()
  }
}

class JemulEnemyRedShip extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.jemulEnemy.redShip)
    this.setEnemyByCpStat(41, 24)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulRedAir, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireRed, this.width, this.height, 2))
    this.setRandomMoveSpeed(2, 2)
    this.moveDelay = new DelayData(240)
    this.attackDelay = new DelayData(60)
    this.isExitToReset = true
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.setRandomMoveSpeed(2, 2)
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
      let enemyBullet1 = new CustomEnemyBullet(imageSrc.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyShip, 10, 9, 0, 'left')
      let enemyBullet2 = new CustomEnemyBullet(imageSrc.enemyBullet.attackList, imageDataInfo.enemyBullet.jemulEnemyShip, 10, 9, 0, 'right')
      fieldState.createEnemyBulletObject(enemyBullet1, this.x, this.y)
      fieldState.createEnemyBulletObject(enemyBullet2, this.x, this.y)
    }
  }
}

class JemulEnemyRedJewel extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.jemulEnemy.redJewel, 3)
    this.setWidthHeight(this.width * 2, this.height * 2)
    this.setEnemyByCpStat(11, 14)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulRedJewel, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareLineRed, this.width, this.height, 2))
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

/** 동그라미 적 (라운드 2, 3에서 출현) */
class DonggramiEnemy extends EnemyData {
  constructor () {
    super()
    this.baseCp = 50000
    this.imageSrc = imageSrc.enemy.donggramiEnemy
    this.color = ''
    this.colorNumber = 0
    this.dieAfterDeleteDelay = new DelayData(60) // 죽는데 걸리는 시간 추가
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieDonggrami)
    this.setDonggramiColor(DonggramiEnemy.colorGroup.ALL)
    this.setEnemyByCpStat(10, 10)
    this.isPossibleExit = true
    this.isExitToReset = true
    this.setRandomMoveSpeed(3, 3, true)
  }

  /** 
   * 동그라미적의 이미지 데이터 리스트 (이것을 이용하여 동그라미 이미지 데이터를 리턴) 
   */
  static imageDataList = [
    imageDataInfo.donggramiEnemy.lightBlue,
    imageDataInfo.donggramiEnemy.blue,
    imageDataInfo.donggramiEnemy.darkBlue,
    imageDataInfo.donggramiEnemy.lightGreen,
    imageDataInfo.donggramiEnemy.green,
    imageDataInfo.donggramiEnemy.darkGreen,
    imageDataInfo.donggramiEnemy.lightOrange,
    imageDataInfo.donggramiEnemy.orange,
    imageDataInfo.donggramiEnemy.darkOrange,
    imageDataInfo.donggramiEnemy.lightYellow,
    imageDataInfo.donggramiEnemy.yellow,
    imageDataInfo.donggramiEnemy.darkYellow,
    imageDataInfo.donggramiEnemy.lightRed,
    imageDataInfo.donggramiEnemy.red,
    imageDataInfo.donggramiEnemy.darkRed,
    imageDataInfo.donggramiEnemy.lightPurple,
    imageDataInfo.donggramiEnemy.purple,
    imageDataInfo.donggramiEnemy.darkPurple,
    imageDataInfo.donggramiEnemy.black,
    imageDataInfo.donggramiEnemy.darkGrey,
    imageDataInfo.donggramiEnemy.grey,
    imageDataInfo.donggramiEnemy.lightGrey,
    imageDataInfo.donggramiEnemy.whitesmoke,
    imageDataInfo.donggramiEnemy.white,
    imageDataInfo.donggramiEnemy.gold,
    imageDataInfo.donggramiEnemy.silver,
    imageDataInfo.donggramiEnemy.pink,
    imageDataInfo.donggramiEnemy.skyblue,
    imageDataInfo.donggramiEnemy.magenta,
    imageDataInfo.donggramiEnemy.cyan,
    imageDataInfo.donggramiEnemy.mix1,
    imageDataInfo.donggramiEnemy.mix2,
    imageDataInfo.donggramiEnemy.mix3,
    imageDataInfo.donggramiEnemy.mix4,
    imageDataInfo.donggramiEnemy.mix5,
    imageDataInfo.donggramiEnemy.mix6,
    imageDataInfo.donggramiEnemy.bigBlue,
    imageDataInfo.donggramiEnemy.bigRed,
  ]

  /** 색 이름의 텍스트 */
  static colorText = [
    'darkblue', 'blue', 'lightblue', 'darkgreen', 'green', 'lightgreen',
    'darkorange', 'orange', 'lightorange', 'darkyellow', 'yellow', 'lightyellow',
    'darkred', 'red', 'lightred', 'darkpurple', 'purple', 'lightpurple',
    'black', 'darkgrey', 'grey', 'lightgrey', 'whitesmoke', 'white',
    'gold', 'silver', 'pink', 'skyblue', 'magenta', 'cyan',
    'mix1', 'mix2', 'mix3', 'mix4', 'mix5', 'mix6',
    'big1', 'big2'
  ]

  /** 
   * 동그라미 색 그룹에 따른 컬러 번호를 얻어옵니다.
   * @param {string} colorOption 색깔의 종류: 주의: DonggramiEnemy 클래스가 가지고 있는 static 변수의 colorGroup 변수의 값을 사용해주세요.
   */
  static getColorGroupByColorNumber (colorOption = '') {
    let random = 0
    switch (colorOption) {
      case this.colorGroup.BLUE: random = Math.floor(Math.random() * 3) + 0; break // 0 ~ 2
      case this.colorGroup.GREEN: random = Math.floor(Math.random() * 3) + 3; break // 3 ~ 5
      case this.colorGroup.ORANGE: random = Math.floor(Math.random() * 3) + 6; break // 6 ~ 8
      case this.colorGroup.YELLOW: random = Math.floor(Math.random() * 3) + 9; break // 9 ~ 11
      case this.colorGroup.RED: random = Math.floor(Math.random() * 3) + 12; break // 12 ~ 14
      case this.colorGroup.PURPLE: random = Math.floor(Math.random() * 3) + 15; break // 15 ~ 17
      case this.colorGroup.NORMAL: random = Math.floor(Math.random() * 18) + 0; break // 0 ~ 17
      case this.colorGroup.ACHROMATIC: random = Math.floor(Math.random() * 6) + 18; break // 18 ~ 23
      case this.colorGroup.ANOTHER: random = Math.floor(Math.random() * 6) + 24; break // 24 ~ 29
      case this.colorGroup.MIX: random = Math.floor(Math.random() * 6) + 30; break // 30 ~ 35
      case this.colorGroup.BIG1: random = 36; break
      case this.colorGroup.BIG2: random = 37; break
      default: random = Math.floor(Math.random() * 36); break // 0 ~ 35 // all color
    }

    return random
  }

  /** 색깔의 그룹 (참고: light, normal, dark는 서로 구분되지 않음.) */
  static colorGroup = {
    /** 파랑 */ BLUE: 'blue',
    /** 초록 */ GREEN: 'green',
    /** 주황(오렌지) */ ORANGE: 'orange',
    /** 노랑 */ YELLOW: 'yellow',
    /** 빨강 */ RED: 'red',
    /** 보라(퍼플) */ PURPLE: 'purple',
    /** 일반색 계열(파랑, 초록, 주황, 노랑, 빨강, 보라) */ NORMAL: 'normal',
    /** 무채색 (하양, 회색, 검정) - 참고: 각 색을 분리할 수 없음 */ ACHROMATIC: 'archromatic',
    /** 특수색 (골드, 실버, 스카이블루, 핑크, 시안, 마젠타) - 참고: 각 색을 분리할 수 없음 */ ANOTHER: 'special',
    /** 혼합색 - 참고: 각 색을 분리할 수 없음 */ MIX: 'mix',
    /** 모든색 */ ALL: 'all',
    /** 빅1 - 어두운 파랑(보스전용) */ BIG1: 'big1',
    /** 빅2 - 어두운 빨강(보스전용) */ BIG2: 'big2'
  }

  /** 동그라미가 사용하는 이모지 리스트(단, 모든 동그라미 클래스가 사용하는것은 아닙니다.) */
  static EmojiList = {
    /** 웃음, 스마일 */ SMILE: 'smile',
    /** 행복, 해피 */ HAPPY: 'happy',
    /** 웃음과슬픔, 행폭 새드 */ HAPPYSAD: 'happySad',
    /** 찌푸림, 프로운 */ FROWN: 'frown',
    /** 슬픔, 새드 */ SAD: 'sad',
    /** 놀람, 어메이즈 */ AMAZE: 'amaze',
    /** 아무것도 아님, 낫씽 */ NOTHING: 'nothing',
    /** 생각중, 띵킹 */ THINKING: 'thinking',
  }

  /** 
   * 동그라미 객체의 서브타입이 이모지임을 가리키는 타입 상수
   * 
   * 이 변수는 이모지를 사용하는 동그라미 객체에서만 사용됩니다.
   */
  static SUBTYPE_EMOJI = 'subTypeEmoji'

  /** 
   * 각 이모지에 대한 이미지 데이터를 얻습니다.
   * @param {string} imogeType imogeList에 있는 이모지 이름
   */
  static getEmojiImageData (imogeType) {
    switch (imogeType) {
      case DonggramiEnemy.EmojiList.SMILE: return imageDataInfo.donggramiEnemyEffect.EmojiSmile
      case DonggramiEnemy.EmojiList.HAPPY: return imageDataInfo.donggramiEnemyEffect.EmojiHappy
      case DonggramiEnemy.EmojiList.HAPPYSAD: return imageDataInfo.donggramiEnemyEffect.EmojiHappySad
      case DonggramiEnemy.EmojiList.AMAZE: return imageDataInfo.donggramiEnemyEffect.EmojiAmaze
      case DonggramiEnemy.EmojiList.FROWN: return imageDataInfo.donggramiEnemyEffect.EmojiFrown
      case DonggramiEnemy.EmojiList.THINKING: return imageDataInfo.donggramiEnemyEffect.EmojiThinking
      case DonggramiEnemy.EmojiList.NOTHING: return null
      case DonggramiEnemy.EmojiList.SAD: return imageDataInfo.donggramiEnemyEffect.EmojiSad
      default: return null
    }
  }

  /** 랜덤한 이모지 타입을 얻습니다. */
  static getRandomEmojiType () {
    let array = [
      this.EmojiList.SMILE, 
      this.EmojiList.HAPPY, 
      this.EmojiList.HAPPYSAD, 
      this.EmojiList.AMAZE, 
      this.EmojiList.NOTHING,
      this.EmojiList.THINKING,
      this.EmojiList.FROWN,
      this.EmojiList.SAD]

    let random = Math.floor(Math.random() * array.length)
    return array[random]
  }

  /** 
   * 동그라미 색과 이미지 데이터를 지정합니다.
   * 이 함수는 setAutoImageData 도 같이 사용하므로, 동그라미를 만들 때에는 setDonggramiColor만 사용하시면 됩니다.
   * @param {string} colorOption 색깔의 종류: 주의: DonggramiEnemy 클래스가 가지고 있는 static 변수의 colorGroup 변수의 값을 사용해주세요.
   * 단 인수값이 없으면 모든 색을 대상으로 함.
   */
  setDonggramiColor (colorOption = '') {
    this.colorNumber = DonggramiEnemy.getColorGroupByColorNumber(colorOption)
    this.imageData = DonggramiEnemy.imageDataList[this.colorNumber]
    this.color = DonggramiEnemy.colorText[this.colorNumber]

    this.setAutoImageData(this.imageSrc, this.imageData)
  }

  /** 모든 동그라미는 dieEffect가 없는대신 밑으로 추락하는 형태로 사라집니다. */
  processDieAfter () {
    if (this.isDied) {
      this.y += 10

      // 적이 죽었을 때, 딜레이가 null 이거나, 딜레이가 있을 때 딜레이카운트를 다 채우면 그 때 삭제
      if (this.dieAfterDeleteDelay == null || this.dieAfterDeleteDelay.check()) {
        this.processDieAfterLogic()
      }
    }
  }

  /** 느낌표 이펙트 데이터 */
  static exclamationMarkEffect = new CustomEffect(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.exclamationMark, 40, 40, 5, 2)

  /** 느낌표 이펙트 짧게 표시용 */
  static exclamationMarkEffectShort = new CustomEffect(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.exclamationMark, 40, 40, 3, 1)

  /** 물음표 이펙트 데이터 */
  static questionMarkEffect = new CustomEffect(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.questionMark, 40, 40, 5, 12)

  /** 대화 리스트 */
  static talkList = [
    '안녕!',
    '무슨 일이야?',
    '넌 누구야?',
    '꺄핫!',
    '난 슬프다.',
    '흠...',
    '이상한 것이 있다.',
    '난 동그라미야.',
    '심심하다.',
    '이것좀 봐.',
    '오늘도 평범한 하루'
  ]

  /** 2-2 상점에 있는 동그라미가 하는 대화 리스트(talk하고 약간 다름) */
  static talkShoppingList = [
    '어떤걸 살까?',
    '물건이 별로네...',
    '이거 얼마에요?',
    '1+1 여기있다!',
    '어디로 갈까?',
    '오늘은 쇼핑하는 날',
    '동그라미도 쇼핑을 해요',
    '난 돈이 없어.',
    '오! 할인은 못참아!'
  ]

  /** 2-4 파티에 있는 동그라미가 하는 대화 리스트 */
  static talkPartyList = [
    '파티!',
    '파티는 즐거워!',
    '난장판이네.',
    '이게 뭐야',
    '정말 시끄럽다.',
    '아무거나 막 던지네?',
    '뭔가 이상해요.',
    '즐겁게 놀자',
    '바깥에 나가야겠다.'
  ]

  static talkRuinList = [
    '어쩌다가 이렇게 되었지?',
    '정말 슬픈일이야.',
    '집이 전부 부셔졌다.'
  ]
}

class DonggramiEnemyMiniBlue extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.BLUE)
  }
}

class DonggramiEnemyMiniGreen extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.GREEN)
  }
}

class DonggramiEnemyMiniRed extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.RED)
  }
}

class DonggramiEnemyMiniPurple extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.PURPLE)
  }
}

class DonggramiEnemyMini extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.ALL)
  }
}

class DonggramiEnemyMiniAchromatic extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.ACHROMATIC)
  }
}

class DonggramiEnemyNormal extends DonggramiEnemy {
  constructor () {
    super()
    this.setEnemyByCpStat(20, 10)
  }
}

class DonggramiEnemyStrong extends DonggramiEnemy {
  constructor () {
    super()
    this.setEnemyByCpStat(100, 10)
    this.setWidthHeight(this.width * 2, this.height * 2)
  }
}

class DonggramiEnemyExclamationMark extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.ALL)
    this.setEnemyByCpStat(20, 10)

    /** 느낌표 딜레이 체크 간격 */ this.exclamationMarkDelay = new DelayData(4)
    /** 느낌표 상태가 지속된 시간 */ this.exclamationMarkElaspedFrame = 0
    this.state = ''
    this.setRandomMoveSpeed(3, 3)

    soundSystem.createAudio(soundSrc.donggrami.exclamationMark)

    /** 일반 상태 */ this.STATE_NORMAL = ''
    /** 느낌표 상태 */ this.STATE_EXCLMATION = '!'
    /** 느낌표 이후의 상태 */ this.STATE_AFTER = '.'

    this.currentEffect = null
  }

  process () {
    super.process()
    this.processEffect()
  }

  processEffect () {
    if (this.currentEffect == null) return

    // 이 함수는 이펙트가 무조건 오브젝트를 따라다니게 하기 위해 만든 함수입니다.
    // 오브젝트가 죽은 경우, 오브젝트는 남아있지만, 이펙트가 오브젝트를 따라가지 않아서 해당 함수를 추가하였습니다.
    this.currentEffect.x = this.x
    this.currentEffect.y = this.y - 40

    // 메모리 누수를 방지하기 위해, 삭제 대기 상태에서는 해당 객체를 삭제해야합니다.
    if (this.currentEffect.isDeleted) {
      this.currentEffect = null
    }
  }

  processMove () {
    // 일반 상태 또는 after 상태에서는 평소대로 이동함.
    if (this.state === this.STATE_NORMAL || this.state === this.STATE_AFTER) {
      super.processMove()
    }
    
    // 느낌표 동그라미의 특징
    // 4프레임마다 주인공이 자기 기준(자기 중심이 기준이 아님, 좌표상 왼쪽 위 기준) 200x200 근처에 있는지 확인하고
    // 만약 있다면, 느낌표 상태가 됨
    if (this.state === this.STATE_NORMAL && this.exclamationMarkDelay.check()) {
      let playerObject = fieldState.getPlayerObject()
      let playerArea = {
        x: playerObject.x,
        y: playerObject.y,
        width: playerObject.width,
        height: playerObject.height,
      }
      let enemyArea = {
        x: this.x - 200,
        y: this.y - 200,
        width: this.width + 200,
        height: this.height + 200
      }

      // 플레이어랑 적의 감지 범위가 충돌되었는지 확인
      if (collision(enemyArea, playerArea)) {
        this.state = this.STATE_EXCLMATION
        // 느낌표 상태가 되는 즉시 이펙트 출력
        // 반대 방향으로 빠르게 이동시킴 (단, 속도만 변경되고 이동 명령은 적용되지 않음.)
        soundSystem.play(soundSrc.donggrami.exclamationMark)
        this.setMoveSpeed(-this.moveSpeedX * 4, -this.moveSpeedY * 4)

        // 메모리 누수 방지를 위해, 객체를 교체할때, null로 만든다음 새로 적용합니다.
        if (this.currentEffect != null) this.currentEffect = null
        this.currentEffect = fieldState.createEffectObject(DonggramiEnemy.exclamationMarkEffect, this.x, this.y - 40)
      }
    }

    if (this.state === this.STATE_EXCLMATION) {
      // 느낌표 상태에서는 120프레임동안 가만히 있다가, 한쪽 방향으로 도망감
      this.exclamationMarkElaspedFrame++
      this.isPossibleExit = true
      this.isExitToReset = false // 이 값을 false로 해서 바깥에 있도록 허용

      if (this.exclamationMarkElaspedFrame >= 120 && this.exclamationMarkElaspedFrame <= 360) {
        super.processMove() // 이동 시작...
      } else if (this.exclamationMarkElaspedFrame >= 360) {
        if (this.exitAreaCheck()) {
          this.state = this.STATE_NORMAL // 다시 원상태로...
          this.isPossibleExit = true
          this.isExitToReset = true // 다시 원래대로 복구
          // 이동속도 재설정(다만, 이전 이동속도를 기억하진 않으므로 랜덤으로 재설정됩니다.)
          this.setRandomMoveSpeed(3, 3)
        }
      }
    }
  }
}

class DonggramiEnemyQuestionMark extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.NORMAL)
    this.setEnemyByCpStat(20, 10)

    this.questionMarkDelay = new DelayData(4)
    this.questionMarkElaspedFrame = 0
    /** 현재 물음표 이펙트에 대한 오브젝트 */ this.currentEffect = null

    /** 일반 상태 */ this.STATE_NORMAL = ''
    /** 물음표 상태 */ this.STATE_QUESTION = '?'
    /** 이후 상태 */ this.STATE_AFTER = '.'

    game.sound.createAudio(soundSrc.donggrami.exclamationMark)
  }

  process () {
    super.process()
    this.processEffect()
  }

  processEffect () {
    if (this.currentEffect == null) return
    // 이 함수는 이펙트가 무조건 오브젝트를 따라다니게 하기 위해 만든 함수입니다.
    // 오브젝트가 죽은 경우, 오브젝트는 남아있지만, 이펙트가 오브젝트를 따라가지 않아서 해당 함수를 추가하였습니다.
    this.currentEffect.x = this.x
    this.currentEffect.y = this.y - 40

    if (this.currentEffect.isDeleted) {
      this.currentEffect = null
    }
  }

  processMove () {
    if (this.state === this.STATE_NORMAL || this.state === this.STATE_AFTER) {
      super.processMove()
    } else if (this.state === this.STATE_QUESTION) {
      // 물음표 상태에서는 일정시간동안 움직이지 않습니다. (120프레임동안)
      this.questionMarkElaspedFrame++
      if (this.questionMarkElaspedFrame >= 120 && this.questionMarkElaspedFrame <= 600) {
        // 그리고 약 8초간 플레이어를 쫓아다닙니다.
        let playerX = fieldState.getPlayerObject().x
        let playerY = fieldState.getPlayerObject().y
        let speedX = (playerX - this.x) / 80
        let speedY = (playerY - this.y) / 80

        // 속도 보정
        if (speedX <= 100 && speedX > 0) speedX = 1
        else if (speedX < 0 && speedX >= -100) speedX = -1
        if (speedY <= 100 && speedY > 0) speedY = 1
        else if (speedY < 0 && speedY >= -100) speedY -1
        this.setMoveDirection('', '')
        this.setMoveSpeed(speedX, speedY)
        super.processMove() // 객체 이동 함수
      } else if (this.questionMarkElaspedFrame >= 720) {
        // 이후 2초동안 추가로 멈춘 후, 더이상 아무 반응도 없는 상태로 변경
        this.state = this.STATE_AFTER
      }
    }

    // 물음표 동그라미의 특징
    // 4프레임마다 주인공이 자기 기준(자기 중심이 기준이 아님, 좌표상 왼쪽 위 기준) 200x200 근처에 있는지 확인하고
    // 만약 있다면, 물음표 상태가 됨.
    if (this.state === this.STATE_NORMAL && this.questionMarkDelay.check()) {
      let playerObject = fieldState.getPlayerObject()
      let playerArea = {
        x: playerObject.x,
        y: playerObject.y,
        width: playerObject.width,
        height: playerObject.height,
      }
      let enemyArea = {
        x: this.x - 100,
        y: this.y - 100,
        width: this.width + 100,
        height: this.height + 100
      }

      // 적의 감지 범위와 플레이어가 충돌한 경우
      if (collision(enemyArea, playerArea)) {
        this.state = '?'
        // 물음표 상태가 되는 즉시 이펙트 출력
        soundSystem.play(soundSrc.donggrami.questionMark)

        // 메모리 누수를 방지하기 위해, null을 대입한 후 객체를 새로 대입합니다.
        if (this.currentEffect != null) this.currentEffect = null

        // 움직이는 동그라미 위에 물음표 이펙트를 띄우기 위해서
        // 실시간으로 위치를 조정할 수 있도록 해당 이펙트를 출력하는 객체를 가져옵니다.
        this.currentEffect = fieldState.createEffectObject(DonggramiEnemy.questionMarkEffect, this.x, this.y - 40)
      }
    }
  }
}

class DonggramiEnemyEmojiMini extends DonggramiEnemy {
  constructor() {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.ALL)
    this.setEnemyByCpStat(20, 10)
    this.setRandomMoveSpeed(3, 3)
    this.emojiDelay = new DelayData(120)
    this.subType = DonggramiEnemy.SUBTYPE_EMOJI

    /** 이모지 오브젝트 (setImoge를 설정하면 해당 객체가 자동으로 생성되거나 변경됨) */
    this.emojiObject = this.createEmoji(DonggramiEnemy.getRandomEmojiType())

    /** 이동 여부 (이모지 상태에서, 이 동그라미를 이동시키는지에 대한 것) */
    this.isMove = true

    this.STATE_NORMAL = ''
    this.STATE_EMOJI = 'emoji'
    this.STATE_THROW = 'throw'
    this.STATE_CATCH = 'catch'

    // 전용 사운드 생성
    game.sound.createAudio(soundSrc.donggrami.throw)
    game.sound.createAudio(soundSrc.donggrami.emoji)
  }

  /** 
   * 이모지를 생성합니다.
   */
  createEmoji (imogeType, throwFrame = -1) {
    let newEmoji = {
      x: this.x,
      y: this.y,
      width: 40, 
      height: 40, 
      type: imogeType, 
      imageData: DonggramiEnemy.getEmojiImageData(imogeType), 
      throwFrame: throwFrame, 
      isThorw: throwFrame >= 1 ? true : false,
      enable: true
    }

    if (newEmoji.imageData == null) {
      newEmoji.enable = false
    }

    return newEmoji
  }

  process () {
    super.process()
    this.processNormal()
    this.processEmoji()
    this.processThrow()
  }

  processMove () {
    if (this.state === this.STATE_NORMAL) {
      super.processMove()
    } else if (this.state === this.STATE_EMOJI) {
      // 이모지 상태에서 isMove가 활성화되지 않으면 동그라미는 이동하지 않습니다.
      if (this.isMove) {
        super.processMove()
      }
    } else if (this.state === this.STATE_THROW) {
      if (this.isMove) {
        super.processMove()
      }

      // throw 상태에서는 120프레임 이후 이동할 수 있도록 처리
      if (this.emojiDelay.count >= 120) {
        this.isMove = true
      }
    }
  }

  processNormal () {
    if (this.state !== this.STATE_NORMAL) return
    if (this.emojiObject == null) return
    // 일반 상태

    // 이모지가 사용 가능한 상태일 때, 이모지를 50%확률료 표시함
    if (this.emojiObject.enable && this.emojiDelay.check()) {
      let random = Math.floor(Math.random() * 100)
      if (random <= 50) {
        // 상태를 이모지로 변경
        this.state = this.STATE_EMOJI
        soundSystem.play(soundSrc.donggrami.emoji)
        this.emojiDelay.delay = 240
        this.emojiDelay.count = 0
        if (random <= 25) {
          // 25%확률로 이모지 대기시간동안 움직이지 않음.
          this.isMove = false 
        } else {
          this.isMove = true
        }
      }
    }
  }

  processEmoji () {
    if (this.state !== this.STATE_EMOJI) return

    // 이모지가 존재하지 않을경우 이모지 프로세스는 처리하지 않음.
    if (this.emojiObject == null) return
    if (!this.emojiObject.enable) return // 이모지가 적용 상태가 아니면 무시

    // 상태 변경 조건 1
    // 120프레임이 지날 때, 이모지를 던질 수 있음. (확률 50%)
    if (this.emojiDelay.count === 120) {
      let random = Math.floor(Math.random() * 100)
      if (random <= 50) {
        // 던질 수 있는 모든 적을 가져옴
        let enemyObject = fieldState.getEnemyObject()

        // 대상에서 자기 자신을 제외하기 위해 필터처리
        // 생성 id가 다를경우 다른 객체입니다.
        enemyObject = enemyObject.filter((value) => value.createId !== this.createId)
  
        // 플레이어에게도 던질 수 있도록 목록에 추가
        enemyObject.push(fieldState.getPlayerObject())
        
        // 어떤 적에게 던질 것에 대한 무작위 인덱스 지정
        let randomIndex = Math.floor(Math.random() * enemyObject.length)

        // 메모리 누수 방지를 위한, targetObject null 처리 후 다시 객체를 대입
        if (this.targetObject != null) this.targetObject = null

        // 타겟 오브젝트 지정
        this.targetObject = enemyObject[randomIndex]
  
        // 상태 변경 및, 이모지를 던짐
        this.state = this.STATE_THROW
        soundSystem.play(soundSrc.donggrami.throw)

        // 딜레이값 재설정
        this.emojiDelay.delay = 180
        this.emojiDelay.count = 0

        // 특정 타겟 오브젝트는 이모지에 반응할 수 있습니다.
        if (this.targetObject instanceof DonggramiEnemyTalk) {
          this.targetObject.setCatchEmoji()
        }
      }
    }

    // 이모지가 자기 자신을 따라다니도록 설정
    this.emojiObject.x = this.x
    this.emojiObject.y = this.y - 40 // this.y 에서 40을 빼는것은, 아이콘이 해당 객체 위에 보여지게 하기 위해서

    // 일정 시간이 지난 이후 원래 상태로 되돌아옴
    if (this.emojiDelay.check()) {
      this.state = this.STATE_NORMAL
    }
  }
  
  processThrow () {
    if (this.state !== this.STATE_THROW) return

    if (this.targetObject != null) {
      // 이모지 오브젝트 이동 (throw상태가 되면 무조건 이동함)
      // 단, 타겟오브젝트가 null일경우, 이모지는 더이상 이동하지 않고 멈추게됨.
      if (this.emojiDelay.count <= 60) {
        this.emojiObject.x += (this.targetObject.x - this.emojiObject.x) / 10
        this.emojiObject.y += (this.targetObject.y - this.emojiObject.y - 40) / 10
      } else {
        this.emojiObject.x = this.targetObject.x
        this.emojiObject.y = this.targetObject.y - 40
      }

      // targetObject가 삭제되면, targetObject를 null로 하고, 상태를 변경합니다.
      if (this.targetObject.isDeleted) {
        this.targetObject = null
        this.state = this.STATE_NORMAL
        this.emojiDelay.count = 0 // 딜레이 카운트 값 초기화
      }
    }

    // 이모지를 던지고 나서 약 3초 후에 상태 초기화
    if (this.emojiDelay.check()) {
      this.state = this.STATE_NORMAL
    }
  }

  display () {
    this.displayEmoji() // 이모지 출력
    super.display()
  }

  displayEmoji () {
    if (this.state === this.STATE_EMOJI || this.state === this.STATE_THROW) {
      let emoji = this.emojiObject.imageData
      if (emoji == null) return

      graphicSystem.imageDisplay(
        imageSrc.enemyEffect.donggrami, 
        emoji.x, 
        emoji.y, 
        emoji.width, 
        emoji.height,
        this.emojiObject.x,
        this.emojiObject.y,
        this.emojiObject.width,
        this.emojiObject.height
      )
    }
  }
}

class DonggramiEnemyTalk extends DonggramiEnemy {
  constructor () {
    super()
    this.setEnemyByCpStat(20, 10)

    /** 현재 대화값 */ this.currentTalk = ''
    /** 이모지를 받은 상태와 관련한 딜레이 */ this.catchEmojiDelay = new DelayData(300)
    /** 이모지를 받았을 때 나오는 텍스트 */ this.catchEmojiText = '이모지를 던지지마!'
    
    /** 대화 기본 딜레이 값 */ this.BASE_DELAY = 300
    /** 대화 딜레이 */ this.talkDelay = new DelayData(this.BASE_DELAY)

    /** 일반 상태 */ this.STATE_NORMAL = ''
    /** 대화 상태 */ this.STATE_TALK = 't'
    /** 이모지를 잡은 상태 */ this.STATE_CATCH = 'c'

    /** 현재 대화 이펙트 */ this.talkEffect = null
  }

  /** 랜덤한 대화를 얻습니다. (무작위로 얻은 대사로 대화를 함.) */
  getRandomTalk () {
    let talk = DonggramiEnemy.talkList
    let index = Math.floor(Math.random() * talk.length)
    return talk[index]
  }

  process () {
    super.process()
    this.processNormal()
    this.processTalk()
    this.processEmojiCatch()
  }

  processNormal () {
    if (this.state !== this.STATE_NORMAL) return

    // 일반 상태에서, 5초가 지나면, 50% 확률로 자기만의 대화를 함.
    // 그러나, 50%확률로 대화를 실패하면, 랜덤하게 딜레이의 카운트값이 재설정
    if (this.talkDelay.check()) {
      let random = Math.floor(Math.random() * 100)
      if (random < 100) {
        // 상태 변경 및 대화 설정
        this.state = this.STATE_TALK
        this.currentTalk = this.getRandomTalk()
      }

      // talkDelay의 count를 음수값으로 하여, 더 많은 지연시간을 가지게끔 처리
      // count가 delay를 넘어야 트리거 작동(-count면 -부터 1씩 증가하기 때문에 더 많은 지연시간을 가짐)
      this.talkDelay.delay = this.BASE_DELAY + (Math.random() * 120)
    }
  }

  processTalk () {
    if (this.state !== this.STATE_TALK) return

    if (this.talkDelay.check()) {
      // 대화 상태 해제 및 딜레이 랜덤 추가
      // 다음 대화는 더 긴 딜레이 시간을 가짐
      this.state = this.STATE_NORMAL
      this.talkDelay.delay = this.BASE_DELAY + Math.floor(Math.random() * 240) + 120
    }
  }

  /** 이모지를 받는 설정을 합니다. 이모지에 반응할 확률은 50% */
  setCatchEmoji () {
    let random = Math.floor(Math.random() * 100)
    if (random < 25) {
      this.talkDelay.count = 0 // 카운트 리셋
      this.talkDelay.delay = 120 // 딜레이 재설정
      this.state = this.STATE_CATCH

      // 이모지를 던지지 말라고 텍스트를 변경합니다.
      // 다만 해당 이모지는 영향을 받지는 않음 (어떤 오브젝트가 던졌는지 모르기 때문에)
      this.currentTalk = this.catchEmojiText
    }
  }

  processEmojiCatch () {
    if (this.state !== this.STATE_CATCH) return

    if (this.talkDelay.check()) {
      // 대화 상태 해제 및 딜레이 랜덤 추가
      // 다음 대화는 더 긴 딜레이 시간을 가짐
      this.state = this.STATE_NORMAL
      this.talkDelay.delay = this.BASE_DELAY + Math.floor(Math.random() * 240) + 120
      this.currentTalk = ''
    }
  }

  display () {
    this.displayTalk()
    super.display()
  }

  displayTalk () {
    if (this.state !== this.STATE_TALK && this.state !== this.STATE_CATCH) return

    const fontSize = game.graphic.FONT_SIZE
    const padding = 10

    // 텍스트는 한 줄에 10글자까지 출력 가능합니다. 그래서 10글자가 넘는다면, 1줄씩 증가합니다.
    // 만약 글자가 2줄을 초과한다면, 스피치버블(말풍선)의 높이가 증가합니다.
    const textMaxLength = this.currentTalk.length
    const outputText = []
    const maxLoop = Math.floor(textMaxLength / 10) + 1
    for (let i = 0; i < maxLoop; i++) {
      outputText.push(this.currentTalk.slice(i * 10, (i + 1) * 10))
    }
    
    const imageData = imageDataInfo.donggramiEnemyEffect.speechBubble
    const imageDataTale = imageDataInfo.donggramiEnemyEffect.speechBubbleTale
    const bubbleSize = maxLoop < 2 ? imageData.height : (maxLoop * 20) + 20

    // 스피치버블의 출력 위치는, 위쪽에 출력하면서 동시에 오브젝트에 겹치지 않아야 합니다.
    // 그래서 예상 크기만큼을 y축에서 뺍니다.
    const speechBubbleY = this.y - imageDataTale.height - bubbleSize

    game.graphic.imageDisplay(imageSrc.enemyEffect.donggrami, imageDataTale.x, imageDataTale.y, imageDataTale.width, imageDataTale.height, this.x, this.y - imageDataTale.height, imageDataTale.width, imageDataTale.height)
    game.graphic.imageDisplay(imageSrc.enemyEffect.donggrami, imageData.x, imageData.y, imageData.width, imageData.height, this.x, speechBubbleY, imageData.width, bubbleSize)
    
    // 텍스트 출력값도 스피치 버블이랑 같은 원리지만, padding값이 추가되었습니다.
    const textY = this.y - imageDataTale.height - bubbleSize + padding
    for (let i = 0; i < maxLoop; i++) {
      game.graphic.fillText(outputText[i], this.x + padding, textY + (i * fontSize))
    }
  }
}

class DonggramiEnemyTalkShopping extends DonggramiEnemyTalk {
  constructor () {
    super() 
  }

  /** 랜덤한 대화를 얻습니다. (무작위로 얻은 대사로 대화를 함.) */
  getRandomTalk () {
    let talk = DonggramiEnemy.talkShoppingList
    let index = Math.floor(Math.random() * talk.length)
    return talk[index]
  }
}

class DonggramiEnemyBounce extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.ALL)
    this.setRandomMoveSpeed(4, 0, true)

    this.bounceSpeedY = Math.floor(Math.random() * 4) + 10
    this.bounceDelay = new DelayData(120)
  }

  processMove () {
    // 이 동그라미는 바운스 하듯이 움직입니다. (통 통 튀는 형태로)
    // 2-2 공원부터 출현
    // 참고: sin 값을 각도로 계산하려면 먼저 라디안을 각도로 변환해야 합니다.
    this.bounceDelay.check()
    let count = (this.bounceDelay.count / this.bounceDelay.delay) * 180
    let degree = Math.PI / 180 * count
    // sin 0은 0이고, sin 90도는 1이므로,
    // 속도 0에서 시작해 1로 점점 가속됩니다.
    let sinValue = Math.sin(degree)

    // 절반의 딜레이 시간동안 추락하고, 절반의 딜레이 시간동안 올라갑니다.
    // 이렇게 한 이유는, sin 값이 0 ~ 1 ~ 0 식으로 변화하기 때문
    if (this.bounceDelay.count < this.bounceDelay.delay / 2) {
      this.moveSpeedY = this.bounceSpeedY * sinValue

      if (this.y + this.height >= game.graphic.CANVAS_HEIGHT) {
        // 화면 밑으로 이미 내려갔다면, 딜레이값을 조정해 강제로 위로 올라가도록 처리
        this.bounceDelay.count = this.bounceDelay.delay / 2
      } else if (this.bounceDelay.count >= (this.bounceDelay.delay / 2) - 2 ) {
        // 다만, 내려갈 때에는 하면 맨 밑에 닿지 않으면 계속 내려가도록 딜레이를 직접적으로 조정
        this.bounceDelay.count--
      }
    } else {
      this.moveSpeedY = -this.bounceSpeedY * sinValue
    }

    super.processMove()
  }
}

class DonggramiEnemySpeed extends DonggramiEnemy {
  constructor () {
    super()
    this.boostDelay = new DelayData(60)
    this.waitDelay = new DelayData(180)
    this.setRandomMoveSpeed(12, 12)
    this.state = ''

    this.baseSpeedX = this.moveSpeedX
    this.baseSpeedY = this.moveSpeedY

    this.STATE_BOOST = 'boost'
    this.STATE_NORMAL = ''
  }

  processMove () {
    if (this.state === this.STATE_NORMAL) {
      this.moveSpeedX = 0
      this.moveSpeedY = 0

      if (this.waitDelay.check()) {
        this.state = this.STATE_BOOST
        this.setRandomMoveSpeed(12, 12, true)

        // 변경된 속도에 맞춰서 기준 속도 재설정
        this.baseSpeedX = this.moveSpeedX
        this.baseSpeedY = this.moveSpeedY
      }
    } else if (this.state === this.STATE_BOOST) {
      // 이 동그라미는 일정시간마다 급가속을 합니다. 일반적인 이동속도는 느립니다.
      // 부스트는 1초동안만 지속된다.
      // 부스트가 끝나면 움직이지 않음.
      let count = (this.boostDelay.count / this.boostDelay.delay) * 90
      let degree = Math.PI / 180 * count
      let sinValue = Math.cos(degree)

      this.moveSpeedX = this.baseSpeedX * sinValue 
      this.moveSpeedY = this.baseSpeedY * sinValue

      if (this.boostDelay.check()) {
        this.state = this.STATE_NORMAL
      }
    }

    super.processMove()
  }
}

class DonggramiEnemyBossBig1 extends DonggramiEnemy {
  constructor () {
    super()
    this.setEnemyByCpStat(1200, 10)
    this.setDonggramiColor(DonggramiEnemy.colorGroup.BIG1)

    // 이 보스는 많이 느림
    this.setRandomMoveSpeed(3, 3)
    this.isPossibleExit = false // 화면 바깥을 나갈 수 없음

    this.BASE_DELAY = 240
    this.ADVANCE_DELAY = 120
    this.moveDelay = new DelayData(this.BASE_DELAY)
    this.welcomeImageData = imageDataInfo.donggramiEnemyEffect.welcomeText

    this.welcomeDelay = new DelayData(this.BASE_DELAY)

    this.state = ''
    this.STATE_WELCOME = 'w'
    this.STATE_NORMAL = ''
  }

  getCollisionArea () {
    // 구체다 보니, 사각형으로 충돌판정 만들기가 어려움
    // 실제 사이즈도 192x192라 계산도 힘들어 어림짐작한 사이즈로 결정
    return [
      {x: this.x + 50, y: this.y + 0, width: 100, height: 25 },
      {x: this.x + 50, y: this.y + 192 - 25, width: 100, height: 25},
      {x: this.x, y: this.y + 25, width: 25, height: 100},
      {x: this.x + 192 - 25, y: this.y + 25, width: 25, height: 100},
      {x: this.x + 25, y: this.y + 25, width: 140, height: 145}
    ]
  }

  process () {
    super.process()
    this.processWelcome()
  }

  processWelcome () {
    if (this.welcomeDelay.check()) {
      if (this.state === this.STATE_NORMAL) {
        this.state = this.STATE_WELCOME
        this.welcomeDelay.delay = this.BASE_DELAY
      } else {
        this.state = this.STATE_NORMAL
        this.welcomeDelay.delay = Math.floor(Math.random() * this.ADVANCE_DELAY) + this.BASE_DELAY
      }
    }
  }

  processMove () {
    super.processMove()
    
    if (this.moveDelay.check()) {
      this.setRandomMoveSpeed(3, 3)
    }

    this.degree += this.moveSpeedX + this.moveSpeedY
  }

  display () {
    super.display()
    this.displayWelcome()
  }

  displayWelcome () {
    if (this.state !== this.STATE_WELCOME) return

    // 대화창 이미지 출력
    const imageData = this.welcomeImageData
    const image = imageSrc.enemyEffect.donggrami
    game.graphic.imageDisplay(image, imageData.x, imageData.y, imageData.width, imageData.height, this.x, this.y - imageData.height, imageData.width, imageData.height)
  }
}

class DonggramiEnemyBossBig2 extends DonggramiEnemyBossBig1 {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.BIG2)
    this.welcomeImageData = imageDataInfo.donggramiEnemyEffect.welcomeMaeulText
  }
}

class DonggramiEnemyA1Fighter extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.RED)
    this.setEnemyStat(20000000, 0, 0)
    this.setWidthHeight(96, 96)
    this.isPossibleExit = false // 바깥으로 나갈 수 없음
    this.setMoveDirection('', '') // 이동방향 제거 (플레이어를 추적하는 알고리즘 때문)

    // 상태 값 종류: 4개 (문자값은 구분용도로만 사용하고 큰 의미는 없음)
    this.STATE_NORMAL = 'normal'
    this.STATE_BOOST = 'boost'
    this.STATE_HAMMER = 'hammer'
    this.STATE_EARTHQUAKE = 'earthquake'
    this.STATE_EARTHQUAKE_WAIT = 'earthquakewait'
    this.STATE_END = 'end'
    this.state = this.STATE_NORMAL // 상태 기본값 지정
    this.stateDelay = new DelayData(120)

    /** 현재 상태를 계속 반복한 횟수 */
    this.stateRepeat = 0

    /** 망치 오브젝트 */ 
    this.hammerObject = { x: 0, y: 0, width: 180, height: 180, degree: 0, degreeChange: 15 }

    // 이펙트 이름 길이를 줄이기 위해 만든 변수
    let srcB = imageSrc.enemyEffect.donggrami
    let imageD = imageDataInfo.donggramiEnemyEffect

    this.hammerStarEffect = new CustomEffect(srcB, imageD.toyHammerStar, 180, 180, 1)
    this.boostEffect = new CustomEffect(srcB, imageD.booster, this.width, this.height, 1)
    this.earthquakeEnergyEffect = new CustomEffect(srcB, imageD.earthquakeEnergy, this.width, this.height, 1)

    /** 빠르게 이동해서 도착할 임시 좌표 */ this.boostPositionX = 0
    /** 빠르게 이동해서 도착할 임시 좌표 */ this.boostPositionY = 0

    this.hammerSound = soundSrc.round.r2_3_a1_toyHammer
    this.earthquakeSound = soundSrc.round.r2_3_a1_earthquake
    this.earthquakeSoundDamage = soundSrc.round.r2_3_a1_earthquakeDamage
    this.boostSound = soundSrc.round.r2_3_a1_boost

    soundSystem.createAudio(this.hammerSound)
    soundSystem.createAudio(this.earthquakeSound)
    soundSystem.createAudio(this.earthquakeSoundDamage)
    soundSystem.createAudio(this.boostSound)

    // 공 튕기게 하는 용도
    this.bounceSpeedY = Math.floor(Math.random() * 4) + 10
    this.bounceDelay = new DelayData(120)
    this.endDelay = 0 // 이것은 end상태가 되었을 때 일정시간이 지나면 자동으로 사라지게끔 처리할 목적으로 만듬
  }

  processDie () {
    // 체력이 0이되어도 죽지않고 무적으로 처리함.
    // 삭제하려면 수동으로 isDelted = true 하는 방식으로 삭제해야합니다.
    if (this.hp <= 0) {
      this.hp = this.hpMax
    }
  }

  /** 현재 상태를 자동으로 변경하는 함수 */
  stateChange () {
    let random = Math.random() * 100
    let arrayState = [this.STATE_NORMAL, this.STATE_BOOST, this.STATE_HAMMER, this.STATE_EARTHQUAKE_WAIT]
    let arrayPercent = [0, 0, 0, 0, 0]
    let currentState = this.state

    if (this.state === this.STATE_NORMAL) {
      // 다른 상태로 변환할 확률 처리 (n, n+1의 차이만큼이 확률값임)
      // 예를들어, normal 상태, stateRepeat 0라면 normal상태 61%, boost상태 13% 식으로 처리된다.
      switch (this.stateRepeat) {
        case 0: arrayPercent = [0, 61, 74, 87, 100]; break // 일반 상태 지속확률 61%, 나머지 상태는 서로 동일
        case 1: arrayPercent = [0, 25, 50, 75, 100]; break // 일반 상태 지속확률 25%, 나머지 상태는 서로 동일
        default: arrayPercent = [0, 0, 33, 66, 100]; break // 이후 일반상태 지속없이 임의로 상태 변환
      }
    } else if (this.state === this.STATE_BOOST) {
      switch (this.stateRepeat) {
        case 3: arrayPercent = [0, 5, 90, 95, 100]; break // 부스트 상태 지속확률 85%
        case 4: arrayPercent = [0, 10, 80, 90, 100]; break // 부스트 상태 지속확률 70%
        case 5: arrayPercent = [0, 20, 60, 80, 100]; break // 부스트 상태 지속확률 40%
        case 6: arrayPercent = [0, 25, 50, 75, 100]; break // 부스트 상태 지속확률 25%
        case 7: arrayPercent = [0, 25, 50, 75, 100]; break // 부스트 상태 지속확률 25%
        case 8: arrayPercent = [0, 33, 33, 66, 100]; break // 부스트 상태 지속 불가 
        default: arrayPercent = [0, 0, 100, 0, 0]; break // 0 ~ 5사이는 부스트 상태 반복됨
      }
    } else if (this.state === this.STATE_HAMMER) {
      // 해머 상태는 5회 연속 반복후 30%확률로 다시 반복함
      // 5회 미만: 해머 상태 지속
      // 5회 이상: 노말 10%, 부스트 30%, 해머 30%, 어스퀘이크 30%
      arrayPercent = this.stateRepeat < 5 ? [0, 0, 0, 100, 0] : [0, 10, 40, 70, 100]
    } else if (this.state === this.STATE_EARTHQUAKE) {
      // 지진 상태는 최소 1회만 가동하고, 그 다음엔 일반 또는 부스트 또는 해머 상태가 된다.
      // 일반 상태가 히트할 확률은 낮게 설정된다.
      // 중복 패턴 방지를 막기 위해 stateRepeat는 사용하지 않음 (지진은 2개의 상태를 가질 수 있기 때문에)
      arrayPercent = [0, 20, 60, 100, 100]
    }

    // 아까 지정된 arrayState값을 이용해 확률값에 의해 상태를 변경
    for (let i = 0; i < arrayState.length; i++) {
      if (random >= arrayPercent[i] && random < arrayPercent[i + 1]) {
        this.state = arrayState[i]
        break
      }
    }

    // 현재 상태와 변경된 상태가 동일하면, 현재 상태 반복횟수를 1올리고, 아닐경우 0으로 변경
    this.stateRepeat = this.state === currentState ? this.stateRepeat + 1 : 0
  }

  processMove () {
    switch (this.state) {
      case this.STATE_NORMAL: this.processMoveNormal(); break
      case this.STATE_BOOST: this.processMoveBoost(); break
      case this.STATE_HAMMER: this.processMoveHammer(); break

      // 지진은 같은 함수를 사용하지만 2개의 상태가 있습니다.
      case this.STATE_EARTHQUAKE: this.processMoveEarthQuake(); break
      case this.STATE_EARTHQUAKE_WAIT: this.processMoveEarthQuake(); break

      // 전투 종료 이후의 상태
      case this.STATE_END: this.processMoveEnd(); break
    }
  }

  processMoveEnd () {
    // 코드는 donggramiEnemyBounce의 코드를 복사하였음.
    this.endDelay++
    if (this.endDelay >= 600) {
      this.isDeleted = true
    }

    this.moveSpeedX = 0

    // 이 동그라미는 바운스 하듯이 움직입니다. (통 통 튀는 형태로)
    // 2-2 공원부터 출현
    // 참고: sin 값을 각도로 계산하려면 먼저 라디안을 각도로 변환해야 합니다.
    this.bounceDelay.check()
    let count = (this.bounceDelay.count / this.bounceDelay.delay) * 180
    let degree = Math.PI / 180 * count
    // sin 0은 0이고, sin 90도는 1이므로,
    // 속도 0에서 시작해 1로 점점 가속됩니다.
    let sinValue = Math.sin(degree)

    // 절반의 딜레이 시간동안 추락하고, 절반의 딜레이 시간동안 올라갑니다.
    // 이렇게 한 이유는, sin 값이 0 ~ 1 ~ 0 식으로 변화하기 때문
    if (this.bounceDelay.count < this.bounceDelay.delay / 2) {
      this.moveSpeedY = this.bounceSpeedY * sinValue

      if (this.y + this.height >= game.graphic.CANVAS_HEIGHT) {
        // 화면 밑으로 이미 내려갔다면, 딜레이값을 조정해 강제로 위로 올라가도록 처리
        this.bounceDelay.count = this.bounceDelay.delay / 2
      } else if (this.bounceDelay.count >= (this.bounceDelay.delay / 2) - 4) {
        // 다만, 내려갈 때에는 하면 맨 밑에 닿지 않으면 계속 내려가도록 딜레이를 직접적으로 조정
        this.bounceDelay.count--
      }
    } else {
      this.moveSpeedY = -this.bounceSpeedY * sinValue
    }

    super.processMove()
  }

  processMoveNormal () {
    // 기본 이동 방식: 2초 단위로 상태 변화, 1초 이동 후, 1초 정지
    // 매 이동마다 이동속도는 무작위
    if (this.stateDelay.count === 0) {
      // normal 상태가 반복되면, 자기 자신의 속도를 재조정
      this.setRandomMoveSpeedMinMax(2, 2, 6, 6)
      // 일정 확률로 방향 전환 (약 50%)
      this.moveSpeedX = Math.random() < 0.5 ? this.moveSpeedX : -this.moveSpeedX
      this.moveSpeedY = Math.random() < 0.5 ? this.moveSpeedY : -this.moveSpeedY
    }

    // 1초간 이동하고, 1초는 정지함.
    if (this.stateDelay.count <= 60) {
      super.processMove()
    }

    if (this.stateDelay.check()) {
      // 일정 시간이 될 때마다 상태 변경 시도
      this.stateChange()
    }
  }

  processMoveHammer () {
    // 이동 직전 프레임: 59
    if (this.stateDelay.count === 59) {
      // 플레이어가 있는 방향쪽으로 우선 이동하도록 이동 방향을 결정
      let playerP = fieldState.getPlayerObject()
      this.setRandomMoveSpeedMinMax(14, 1, 20, 3)

      if (playerP.x > this.x) {
        this.moveSpeedX = -this.moveSpeedX
      }
      if (playerP.y < this.y) {
        this.moveSpeedY = -this.moveSpeedY
      }
    }

    // 해머를 들고 이동
    if (this.stateDelay.count >= 60) {
      this.hammerObject.degree += this.hammerObject.degreeChange // 해머의 각도는 매 프레임마다 15씩 변화
      if (this.hammerObject.degree <= -90) { // -90도 (맨 왼쪽에 뿅망치 부분이 닿으면)
        this.hammerObject.degreeChange = Math.abs(this.hammerObject.degreeChange) // 변경해야 될 각도변화값을 양수로 변경
        fieldState.createEffectObject(this.hammerStarEffect, this.hammerObject.x, this.hammerObject.y)
        soundSystem.play(this.hammerSound)
      } else if (this.hammerObject.degree >= 90) { // 90도 (맨 오른쪽에 뿅망치 부분이 닿으면)
        this.hammerObject.degreeChange = -Math.abs(this.hammerObject.degreeChange) // 변경해야 될 각도변화값을 음수로 변경
        fieldState.createEffectObject(this.hammerStarEffect, this.hammerObject.x, this.hammerObject.y)
        soundSystem.play(this.hammerSound)
      }
      super.processMove()
    }

    // 해머의 위치 설정
    this.hammerObject.x = this.centerX - (this.hammerObject.width / 2)
    this.hammerObject.y = this.centerY - (this.hammerObject.height) + 48 // 중심값 48 추가

    if (this.stateDelay.check()) {
      this.stateChange()

      // 만약 같은 상태가 반복된다면, 패턴을 빠르게 사용하도록 delay의 count를 조정함
      if (this.state === this.STATE_HAMMER) {
        this.stateDelay.count = 48
      }
    }
  }

  processMoveBoost () {
    // 부스트 이펙트 출력
    if (this.stateDelay.count % 12 === 0) {
      fieldState.createEffectObject(this.boostEffect, this.x, this.y)
    }
    
    if (this.stateDelay.count >= 60) {
      // 플레이어 오브젝트를 기준으로, 도착 지점 결정 [60프레임단위로]
      if (this.stateDelay.count === 63) {
        let playerP = fieldState.getPlayerObject()
        this.boostPositionX = playerP.x
        this.boostPositionY = playerP.y
      }

      if (this.stateDelay.count === 61) {
        soundSystem.play(this.boostSound)
      }

      // 속도는 갈수록 감소 [나눗셈 값을 증가시키면 최종 값이 낮아짐]
      let divideCount = Math.floor((this.stateDelay.count - 60) / 5)
      let divide = [6, 11, 13, 15, 17, 21, 27, 31, 40, 40, 40, 40, 40, 40, 40]
      let distanceX = (this.boostPositionX - this.x) / divide[divideCount]
      let distanceY = (this.boostPositionY - this.y) / divide[divideCount]

      // 속도 최저치 보정
      if (distanceX > 0 && distanceX < 2) distanceX = 2
      else if (distanceX < 0 && distanceX > -2) distanceX = -2
      if (distanceY > 0 && distanceY < 2) distanceY = 2
      else if (distanceY < 0 && distanceY > -2) distanceY = -2

      // 이동속도 재설정
      this.setMoveSpeed(distanceX, distanceY)
      super.processMove()
    }

    if (this.stateDelay.check()) {
      this.stateChange()

      // 상태 변경을 해도 같은상태라면, 부스트 패턴 다시 바로 반복하도록 처리
      if (this.state === this.STATE_BOOST) {
        this.stateDelay.count = 48
      }
    }
  }

  processMoveEarthQuake () {
    // 지진 대기 이펙트
    if (this.stateDelay.count <= 60 && this.stateDelay.count % 10 === 0) {
      fieldState.createEffectObject(this.earthquakeEnergyEffect, this.x, this.y)
      soundSystem.play(this.earthquakeSound)
    }

    // 1초 이후는 상하로 매우 빠르게 이동
    if (this.stateDelay.count >= 60) {
      // 카운트가 60이 되는 시점에서 속도 변경 (버그 방지용도)
      if (this.stateDelay.count === 60) this.setMoveSpeed(0, -96)

      // 상태 변경 및 이동 처리
      this.state = this.STATE_EARTHQUAKE
      super.processMove()
    }

    // 일정시간마다 상태 변경
    if (this.stateDelay.check()) {
      this.stateChange()
    }

    // 지진효과로 인한 별모양 이펙트 출력
    if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
      soundSystem.play(this.earthquakeSoundDamage)
      for (let i = 0; i < 5; i++) {
        fieldState.createEffectObject(this.hammerStarEffect, (160 * i), graphicSystem.CANVAS_HEIGHT - 160)
        fieldState.createEffectObject(this.hammerStarEffect, (160 * i), graphicSystem.CANVAS_HEIGHT - 320)
      }
    }
  }

  display () {
    super.display()
    if (this.state === this.STATE_HAMMER) {
      this.displayHammer()
    }
  }

  displayHammer () {
    if (this.stateDelay.count > 0) {
      let hammer = imageDataInfo.donggramiEnemyEffect.toyHammerNoEnimation
      graphicSystem.imageDisplay(imageSrc.enemyEffect.donggrami, hammer.x, hammer.y, hammer.width, hammer.height, this.hammerObject.x, this.hammerObject.y, this.hammerObject.width, this.hammerObject.height, 0, this.hammerObject.degree)
    }
  }
}

class DonggramiEnemyB1Bounce extends DonggramiEnemyBounce {
  constructor () {
    super()
    this.setEnemyStat(20000000, 0, 0)

    // 충돌된경우, 서로 튕겨져 나갑니다.
    this.STATE_COLLISION = 'collision'
    this.STATE_COLLLISON_PROCESSING = 'collisionProcessing' // collision 중복 처리 방지용
    this.STATE_NORMAL = ''

    this.autoMovePositionX = 0
    this.autoMovePositionY = 0
    this.movePositionFrame = 0

    this.currentEffect = null
  }

  processMove () {
    if (this.state === this.STATE_COLLISION) {
      let outMove = (Math.random() * 80) + 60
      this.autoMovePositionX = Math.random() < 0.5 ? this.x + outMove : this.x - outMove
      this.autoMovePositionY = Math.random() < 0.5 ? this.y + outMove : this.y - outMove
      this.movePositionFrame = 60
      this.state = this.STATE_COLLLISON_PROCESSING
      this.currentEffect = fieldState.createEffectObject(DonggramiEnemy.exclamationMarkEffectShort, this.x, this.y - 40)
    }

    if (this.currentEffect != null) {
      this.currentEffect.x = this.x
      this.currentEffect.y = this.y - 40

      if (this.currentEffect.isDeleted) {
        this.currentEffect = null
      }
    }

    if (this.movePositionFrame > 0) {
      this.movePositionFrame--
    } else {
      this.state = this.STATE_NORMAL
    }

    if (this.movePositionFrame >= 1) {
      let distanceX = (this.autoMovePositionX - this.x) / 12
      let distanceY = (this.autoMovePositionY - this.y) / 12
      this.x += distanceX
      this.y += distanceY
    } else {
      super.processMove()
    }
  }
}

class DonggramiEnemyA2Brick extends EnemyData {
  constructor () {
    super()
    this.setEnemyStat(5000, 0, 0)
    let random = Math.floor(Math.random() * 4)
    let imageDataList = [
      imageDataInfo.donggramiEnemy.brick1,
      imageDataInfo.donggramiEnemy.brick2,
      imageDataInfo.donggramiEnemy.brick3,
      imageDataInfo.donggramiEnemy.brick4
    ]
    this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataList[random])
    this.setDieEffectOption(soundSrc.round.r2_3_a2_break, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareGrey, this.width, this.height, 2))

    this.STATE_STOP = 'stop'
    this.STATE_MOVE = 'move'
    this.moveDelay = new DelayData(120)
    this.state = this.STATE_MOVE
    this.setMoveSpeed(5, 0)

    soundSystem.createAudio(soundSrc.round.r2_3_a2_break)
  }

  processMove () {
    // 1. stop상태 (이동하지 않음)
    // 2. round에서 stop, move 상태를 자동으로 조정
    // 3. move가 되는 순간 벽돌은 계속 왼쪽으로 이동
    if (this.state === this.STATE_MOVE) {
      super.processMove()
    } else if (this.state === this.STATE_STOP) {
      this.hp = this.hpMax // 죽지 않게끔, 체력 무제한
    }

    if (this.x + this.width <= -graphicSystem.CANVAS_WIDTH) {
      this.isDeleted = true // 왼쪽 너무 바깥으로 가면 삭제함.
      // this.y = Math.floor(Math.random() * 8) * 100
      // this.x = graphicSystem.CANVAS_WIDTH + this.width
    }
  }
}

class DonggramiEnemyA2Bomb extends DonggramiEnemyA2Brick {
  constructor () {
    super()
    this.setEnemyStat(17000000, 0, 0)
    this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.bomb)
    this.setDieEffectOption(soundSrc.round.r2_3_a2_bomb)
    soundSystem.createAudio(soundSrc.round.r2_3_a2_bomb)
  }

  processAttack () {
    let player = fieldState.getPlayerObject()
    if (collision(player, this)) {
      fieldState.allEnemyDie() // 자기 자신 포함 모두 죽이기
    }
  }

  display () {
    super.display()
  }
}

class DonggramiEnemyB2Mini extends DonggramiEnemy {
  constructor () {
    super()
    this.setEnemyStat(20000000, 0, 0)

    // 충돌된경우, 서로 튕겨져 나갑니다.
    this.STATE_COLLISION = 'collision'
    this.STATE_COLLLISON_PROCESSING = 'collisionProcessing' // collision 중복 처리 방지용
    this.STATE_NORMAL = ''

    this.autoMovePositionX = 0
    this.autoMovePositionY = 0
    this.movePositionFrame = 0

    this.currentEffect = null
  }

  processMove () {
    if (this.state === this.STATE_COLLISION) {
      let outMove = (Math.random() * 80) + 60
      this.autoMovePositionX = Math.random() < 0.5 ? this.x + outMove : this.x - outMove
      this.autoMovePositionY = Math.random() < 0.5 ? this.y + outMove : this.y - outMove
      this.movePositionFrame = 40
      this.state = this.STATE_COLLLISON_PROCESSING
      this.currentEffect = fieldState.createEffectObject(DonggramiEnemy.exclamationMarkEffectShort, this.x, this.y - 40)
    }

    if (this.currentEffect != null) {
      this.currentEffect.x = this.x
      this.currentEffect.y = this.y - 40

      if (this.currentEffect.isDeleted) {
        this.currentEffect = null
      }
    }

    if (this.movePositionFrame > 0) {
      this.movePositionFrame--
    } else {
      this.state = this.STATE_NORMAL
    }

    if (this.movePositionFrame >= 1) {
      let distanceX = (this.autoMovePositionX - this.x) / 12
      let distanceY = (this.autoMovePositionY - this.y) / 12
      this.x += distanceX
      this.y += distanceY
    } else {
      super.processMove()
    }
  }
}
class DonggramiEnemyA3Collector extends DonggramiEnemy {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.ACHROMATIC)
    this.setWidthHeight(100, 100)
    this.setEnemyStat(20000000, 0, 0)
    this.setMoveDirection('', '') // 좌표값을 직접 조정해야 하므로, 이동 방향을 제거합니다.
    this.boostDelay = new DelayData(120)
    this.MAX_SPEED = 6
    
    this.STATE_NORMAL = 'normal'
    this.STATE_BOOST = 'boost'
    this.STATE_STUN = 'stun'
    this.state = this.STATE_NORMAL
    this.isPossibleExit = false
    this.stunFrame = 60 // 일시적인 기절 시간
  }

  process () {
    super.process()
    this.processCatch()

    if (this.hp <= this.hpMax - 1000000) {
      this.hp = this.hpMax
      this.stunFrame = 120
      this.state = this.STATE_STUN
      fieldState.createEffectObject(DonggramiEnemy.exclamationMarkEffect, this.x, this.y - 40, 4)
    }
  }

  processMove () {
    if (this.state === this.STATE_STUN) {
      // 아무것도 할 수 없음(이동불가, 다만 파워는 먹을 수도?)
      this.stunFrame--
      if (this.stunFrame <= 0) {
        this.state = this.STATE_NORMAL
      }
      return
    } else if (this.targetObject == null) {
      return
    }

    // 이 동그라미는 파워를 모으는 역할을 하지만, 플레이어를 공격하지 않습니다.
    if (this.state === this.STATE_NORMAL) {
      if (this.targetObject != null) {
        // 타겟 오브젝트가 있을 때, 해당 오브젝트를 추적합니다.
        let distanceX = this.targetObject.x - this.x
        let distanceY = this.targetObject.y - this.y
        let speedX = distanceX / 80
        let speedY = distanceY / 80
        if (speedX >= 0 && speedX < 5) speedX = 4
        else if (speedX < 0 && speedX >= -5) speedX = -4
        if (speedY >= 0 && speedY < 5) speedY = 4
        else if (speedY < 0 && speedY >= -5) speedY = -4

        this.setMoveSpeed(speedX, speedY)
        super.processMove()
      }
    } else if (this.state === this.STATE_BOOST) {
      if (this.targetObject != null) {
        // boost 상태에서는 더 빠른속도로 추적합니다.
        let distanceX = this.targetObject.x - this.x
        let distanceY = this.targetObject.y - this.y

        this.x += (distanceX < 0) ? (distanceX / 20) - (this.boostDelay.count * 0.2) : (distanceX / 20) + (this.boostDelay.count * 0.2)
        this.y += (distanceY < 0) ? (distanceY / 20) - (this.boostDelay.count * 0.2) : (distanceY / 20) + (this.boostDelay.count * 0.2)
      }

      if (this.boostDelay.count <= 30) {
        super.processMove()
      } else if (this.boostDelay.count >= 60) {
        this.state = this.STATE_NORMAL
        this.boostDelay.count = 0
      }
    }

    if (this.boostDelay.check()) {
      let random = Math.random() * 100
      if (this.state === this.STATE_NORMAL && random <= 33) {
        this.state = this.STATE_BOOST
        this.speedBoost = 0
      } else {
        this.state = this.STATE_NORMAL
      }
    }
  }

  processCatch () {
    if (this.targetObject == null) {
      let sprite = fieldState.getSpriteObject()
      let lowDistance = 99999 // 일부러 큰 숫자를 지정해서, 첫번째 스프라이트를 비교했을 때 작은 수를 찾을 수 있도록 유도
      let random = Math.floor(Math.random() * sprite.length)
      this.targetObject = sprite[random]

      // for (let i = 0; i < sprite.length; i++) {
      //   let currentSprite = sprite[i]
      //   // 적과 스프라이트의 x좌표 차이와 y좌표 차이의 합을 계산
      //   let totalDistance = (this.x - currentSprite.x) + (this.y - currentSprite.y)

      //   // 가장 가까운 거리 (단 떨어져있는 거리가 음수일수도 있으므로 절댓값을 사용해서 비교해야합니다.)
      //   if (lowDistance > Math.abs(totalDistance)) {
      //     lowDistance = Math.abs(totalDistance)
      //     this.targetObject = currentSprite
      //   }
      // }
    } else {
      // 타겟 오브젝트가 있는 경우
      if (this.targetObject.isDeleted) {
        this.targetObject = null // 오브젝트가 삭제되면 참조를 삭제함
      }
    }
  }
}

class DonggramiEnemyB3Mini extends DonggramiEnemy {
  constructor () {
    super()
    this.setEnemyStat(20000000, 0, 0)
    // 참고: b2와 b3는 알고리즘이 서로 다릅니다.
    this.STATE_NORMAL = ''
    this.STATE_AUTOMOVE = 'automove'
    this.autoMovePositionX = 0
    this.autoMovePositionY = 0
    this.autoMoveFrame = 0
    this.STATE_COLLISION = 'collision'
    this.STATE_COLLLISON_PROCESSING = 'collisionProcessing' // collision 중복 처리 방지용
    this.currentEffect = null
  }

  processMove () {
    if (this.state === this.STATE_NORMAL) {
      super.processMove()
    } else if (this.state === this.STATE_AUTOMOVE) { 
      let distanceX = (this.autoMovePositionX - this.x) / 12
      let distanceY = (this.autoMovePositionY - this.y) / 12
      this.x += distanceX
      this.y += distanceY
      if (this.autoMoveFrame <= 0) {
        this.state = this.STATE_NORMAL
      } else {
        this.autoMoveFrame--
      }
    } else {
      // 만약 다른 상태값이 들어왔다면, 아마도 공식은 이것일 것
      // automove positionX, positionY
      // 이것은 라운드 2-3 b3구역에 정의되어있습니다.
      // EnemyData에 내장된 함수를 사용해 간편하게 조정하는 방법이 없어 이렇게 구현되었습니다.

      let info = this.state.split(' ')
      this.autoMovePositionX = this.x + Number(info[1])
      this.autoMovePositionY = this.y + Number(info[2])
      this.autoMoveFrame = 30
      this.state = this.STATE_AUTOMOVE
      this.currentEffect = fieldState.createEffectObject(DonggramiEnemy.exclamationMarkEffectShort, this.x, this.y - 40)
    }

    if (this.currentEffect != null) {
      this.currentEffect.x = this.x
      this.currentEffect.y = this.y - 40

      if (this.currentEffect.isDeleted) {
        this.currentEffect = null
      }
    }
  }
}

/**
 * 이 클래스는 DonggramiEnemyFruit, DonggramiEnemyJuice의 기능을 포함하고 있습니다.
 * 
 * 해당 클래스의 기능이 중복되었고 이 적들은 DonggramiEnemyParty로 분류되기 때문에, 이 클래스를 상속받는 형태로 구현되었습니다.
 */
class DonggramiEnemyParty extends DonggramiEnemy {
  /** DonggramiParty 적이 사용하는 세부 타입 */
  static subTypeList = {
    JUICE_ORANGE: 'ornage',
    JUICE_COLA: 'cola',
    JUICE_WATER: 'water',
    FRUIT_RED: 'red',
    FRUIT_GREEN: 'green',
    FRUIT_ORANGE: 'orange',
    FRUIT_PURPLE: 'purple',
    PARTY_FIRECRACKER: 'firecracker',
    PARTY_CANDLE: 'candle',
    PARTY_PLATE: 'plate'
  }

  static stateList = {
    NORMAL: '',
    CREATE: 'create',
    THROW: 'throw',
    DROP: 'drop',
    EAT: 'eat'
  }

  /** DonggramiParty가 생성한 오브젝트를 표시하기 위해 만들어진 변수 (오브젝트 내에 있는 display 함수를 통해 표현)  */
  static iconList = {
    fruitRed: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.fruitRed),
    fruitGreen: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.fruitGreen),
    fruitOrange: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.fruitOrange),
    fruitPurple: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.fruitPurple),
    juiceCola: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.juiceCola),
    juiceOrange: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.juiceOrange),
    juiceWater: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.juiceWater),
    partyCandle: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.candle),
    partyFirecracker: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.firecracker),
    partyPlate: EnimationData.createEnimation(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.plate),
  }

  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.ALL)
    this.setEnemyByCpStat(20, 10)

    this.state = DonggramiEnemyParty.stateList.NORMAL
    this.stateList = DonggramiEnemyParty.stateList
    this.subTypeList = DonggramiEnemyParty.subTypeList
    this.stateDelay = new DelayData(60)
    this.delayChange()

    /** 동그라미가 가지고 있는 오브젝트의 표시 위치 */ this.objX = 0
    /** 동그라미가 가지고 있는 오브젝트의 표시 위치 */ this.objY = 0

    this.setRandomType()
  }

  /** 현재 클래스를 기준으로 임의의 타입 지정 (상속을 하면 이 함수를 재정의해야 합니다.) */
  setRandomType () {
    let random = Math.floor(Math.random() * 3)
    switch (random) {
      default: this.subType = DonggramiEnemyParty.subTypeList.PARTY_CANDLE; break
      case 1: this.subType = DonggramiEnemyParty.subTypeList.PARTY_FIRECRACKER; break
      case 2: this.subType = DonggramiEnemyParty.subTypeList.PARTY_PLATE; break
    }
  }

  processMove () {
    if (this.state !== this.stateList.DROP) {
      super.processMove()
    }

    // 오브젝트의 위치 설정 
    // (주의: 이 값은 오브젝트의 크기가 50x50을 기준으로 하므로 이보다 다른 값의 오브젝트를 사용한다면 그에 맞게 다시 변경해야 함)
    this.objX = this.x
    this.objY = this.y - 40

    if (this.subType === this.subTypeList.PARTY_CANDLE) {
      this.objX = this.x - 12
      this.objY = this.y - 128
    }

    // 오브젝트를 먹는 상태이면, 오브젝트가 동그라미쪽에 붙게끔 처리
    if (this.state === this.stateList.EAT) {
      this.objX = this.x - 20
      this.objY = this.y - 20
    }
  }

  processState () {
    switch (this.state) {
      case this.stateList.CREATE: this.processStateCreate(); break
      case this.stateList.DROP: this.processStateDrop(); break
      case this.stateList.EAT: this.processStateEat(); break
      case this.stateList.NORMAL: this.processStateNormal(); break
      case this.stateList.THROW: this.processStateThrow(); break
    }

  }

  /** normal 상태: 일정 시간 후, create 상태로 변환 
   * create 상태로 변환될 때 무작위의 아이템을 하나 생성합니다.
  */
  processStateNormal () {
    if (this.stateDelay.check()) {
      this.delayChange()
      this.state = this.stateList.CREATE
    }
  }

  /**
   * 물건을 생성한 상태입니다. 이 이후 물건을 던지거나 떨어트리거나 먹습니다.
   */
  processStateCreate () {
    if (this.stateDelay.check()) {
      this.delayChange()
      if (this.state === this.subTypeList.PARTY_CANDLE) {
        this.state = this.stateList.NORMAL
      } else {
        this.state = Math.random() < 0.75 ? this.stateList.THROW : this.stateList.DROP
      }
      return
    }
    
    switch (this.subType) {
      case this.subTypeList.PARTY_CANDLE:
        // 일정 시간 단위마다 촛불 생성
        if (this.stateDelay.divCheck(30)) {
          let candleBullet = new CustomEnemyBullet(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.candleFire, 12, 0, -4)
          fieldState.createEnemyBulletObject(candleBullet, this.objX + 32, this.objY)
        }
        break
    }
  }

  static PlateBullet = class extends CustomEnemyBullet {
    constructor (damage = 6, speedX = Math.random() * 2, speedY = 5) {
      super(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.plateThrow, damage, speedX, speedY)
      this.setWidthHeight(this.width * 2, this.height * 2)
    }

    process () {
      super.process()
      // 접시가 바닥에 닿으면 깨지는 이펙트가 생성되고, 이 오브젝트(접시)는 삭제됨
      // 플레이어랑 부딪힐경우에는 이 오브젝트가 삭제 예정이므로, 이를 이용해서 접시가 깨지는 이펙트를 출력
      if (this.y + this.height >= graphicSystem.CANVAS_HEIGHT || this.isDeleted) {
        let customEffect = new CustomEffect(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.plateBreak, this.width, this.height, 2)
        soundSystem.play(soundSrc.donggrami.plate)
        fieldState.createEffectObject(customEffect, this.x, this.y)
        this.isDeleted = true
      }
    }
  }

  static FirecrackerBullet = class extends CustomEnemyBullet {
    constructor (damage = 6, endPositionX = 0, endPositionY = 0) {
      super(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.firecrackerPrevEffect, damage, 0, 0)
      this.endPositionX = endPositionX
      this.endPositionY = endPositionY
      this.bombDamage = damage
      this.attack = 0
    }

    process () {
      super.process()
      this.moveSpeedX = (this.endPositionX - this.x) / 10
      this.moveSpeedY = (this.endPositionY - this.y) / 10

      if (this.elapsedFrame === 60) {
        let partyEffect = new CustomEffect(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.firecrackerEffect, 100, 100, 2)
        let partyObject = { x: this.x - 25, y: this.y - 25, width: 100, height: 100}
        let player = fieldState.getPlayerObject()
        if (collision(player, partyObject)) {
          player.addDamage(this.bombDamage)
        }

        fieldState.createEffectObject(partyEffect, partyObject.x, partyObject.y)
        soundSystem.play(soundSrc.donggrami.firecracker)
        this.isDeleted = true
      } else if (this.elapsedFrame >= 75) {
        this.isDeleted = true
      }
    }
  }

  /** 물건을 무작위의 속도로 던집니다. (단 일부 객체는 다른 패턴을 사용함) */
  processStateThrow () {
    if (this.stateDelay.check()) {
      this.delayChange()
      this.state = this.stateList.NORMAL
      return
    }

    if (this.subType === this.subTypeList.PARTY_PLATE) {
      if (this.stateDelay.count === 1) {
        let plateBullet = new DonggramiEnemyParty.PlateBullet()
        plateBullet.moveSpeedX = Math.random() < 0.5 ? Math.random() * 4 + 2 : Math.random() * -4 - 2
        plateBullet.moveSpeedY = Math.random() * 4 + 2
        fieldState.createEnemyBulletObject(plateBullet, this.objX, this.objY)
        soundSystem.play(soundSrc.donggrami.throw)
      }
    } else if (this.subType === this.subTypeList.PARTY_FIRECRACKER) {
      if (this.stateDelay.divCheck(20)) {
        fieldState.createEnemyBulletObject(new DonggramiEnemyParty.FirecrackerBullet(10, this.x + Math.random() * 200 - 100, this.y + Math.random() * 200 - 100), this.objX, this.objY)
      }
    }
  }

  /** 물건을 실수로 떨어트립니다. 물건을 떨어트린 동그라미는 일시적으로 느낌표 아이콘을 띄웁니다.
   * (DonggramiParty에서 사용하는 모든 오브젝트가 공통 코드가 적용됨)
   */
  processStateDrop () {
    if (this.stateDelay.check()) {
      this.delayChange()
      this.state = this.stateList.NORMAL
      return
    }

    // 떨어트리기 위한 총알 생성
    if (this.stateDelay.count === 1) {
      const imgSrc = imageSrc.enemyEffect.donggrami
      let imgD = imageDataInfo.donggramiEnemyEffect.fruitRed
      switch (this.subType) {
        case this.subTypeList.FRUIT_GREEN: imgD = imageDataInfo.donggramiEnemyEffect.fruitGreen; break
        case this.subTypeList.FRUIT_ORANGE: imgD = imageDataInfo.donggramiEnemyEffect.fruitOrange; break
        case this.subTypeList.FRUIT_PURPLE: imgD = imageDataInfo.donggramiEnemyEffect.fruitPurple; break
        case this.subTypeList.JUICE_COLA: imgD = imageDataInfo.donggramiEnemyEffect.juiceCola; break
        case this.subTypeList.JUICE_ORANGE: imgD = imageDataInfo.donggramiEnemyEffect.juiceOrange; break
        case this.subTypeList.JUICE_WATER: imgD = imageDataInfo.donggramiEnemyEffect.juiceWater; break
        case this.subTypeList.PARTY_CANDLE: imgD = imageDataInfo.donggramiEnemyEffect.candle; break
        case this.subTypeList.PARTY_FIRECRACKER: imgD = imageDataInfo.donggramiEnemyEffect.firecracker; break
        case this.subTypeList.PARTY_PLATE: imgD = imageDataInfo.donggramiEnemyEffect.plate; break
      }

      let customBullet = new CustomEnemyBullet(imgSrc, imgD, 5, 0, 5)
      if (this.subType === this.subTypeList.PARTY_PLATE) {
        // 접시만 다른 알고리즘을 가진 총알을 사용하기 때문에 따로 생성함
        customBullet = new DonggramiEnemyParty.PlateBullet()
      }

      fieldState.createEnemyBulletObject(customBullet, this.objX, this.objY)
      soundSystem.play(soundSrc.donggrami.exclamationMark)
      fieldState.createEffectObject(DonggramiEnemy.exclamationMarkEffectShort, this.x, this.y - 40)
    }

    if (this.stateDelay.count === 40 || this.stateDelay.count === 80) {
      fieldState.createEffectObject(DonggramiEnemy.exclamationMarkEffectShort, this.x, this.y - 40)
    }
  }

  /** 물건을 먹습니다. (주스, 과일 한정), 아무런 변화가 없습니다. (물건을 먹기 위해 물건이 90도 각도로 기울어지기만 합니다.) */
  processStateEat () {
    if (this.stateDelay.check()) {
      this.state = this.stateList.NORMAL
    }

    if (this.stateDelay.count === 1) {
      soundSystem.play(soundSrc.donggrami.juiceEat)
    }
  }
  
  /** 현재 상태에 따른 지연시간 재설정 (지연시간은 상태가 변경될 때 무작위로 지정됩니다.) */
  delayChange () {
    let min = 0
    let max = 0
    switch (this.state) {
      case this.stateList.NORMAL: min = 60; max = 60; break
      case this.stateList.CREATE: min = 120; max = 180; break
      case this.stateList.EAT: min = 120; max = 132; break
      case this.stateList.THROW: min = 180; max = 188; break
      case this.stateList.DROP: min = 180; max = 188; break
    }

    this.stateDelay.delay = Math.floor(Math.random() * (max - min) + min)
  }

  display () {
    super.display()
    
    if (this.state === this.stateList.CREATE || this.state === this.stateList.EAT) {
      this.displayObject()
    } else if (this.state === this.stateList.THROW && this.subType === this.subTypeList.PARTY_FIRECRACKER) {
      this.displayObject() // 폭죽 보여주기 위한 용도
    }
  }

  displayObject () {
    const icon = DonggramiEnemyParty.iconList
    let target = icon.fruitRed
    switch (this.subType) {
      case this.subTypeList.FRUIT_GREEN: target = icon.fruitGreen; break
      case this.subTypeList.FRUIT_ORANGE: target = icon.fruitOrange; break
      case this.subTypeList.FRUIT_PURPLE: target = icon.fruitPurple; break
      case this.subTypeList.JUICE_COLA: target = icon.juiceCola; break
      case this.subTypeList.JUICE_ORANGE: target = icon.juiceOrange; break
      case this.subTypeList.JUICE_WATER: target = icon.juiceWater; break
      case this.subTypeList.PARTY_CANDLE: target = icon.partyCandle; break
      case this.subTypeList.PARTY_FIRECRACKER: target = icon.partyFirecracker; break
      case this.subTypeList.PARTY_PLATE: target = icon.partyPlate; break
    }

    let degree = 0
    if (this.state === this.stateList.EAT) {
      degree = this.stateDelay.count < 30 ? this.stateDelay.count * 3 : 90
    }

    target.degree = degree
    target.display(this.objX, this.objY)
  }
}

class DonggramiEnemyFruit extends DonggramiEnemyParty {
  static bulletFruitRed = new CustomEnemyBullet(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.fruitRed, 10, 0, 0)
  static bulletFruitGreen = new CustomEnemyBullet(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.fruitGreen, 10, 0, 0)
  static bulletFruitOrange = new CustomEnemyBullet(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.fruitOrange, 10, 0, 0)
  static bulletFruitPurple = new CustomEnemyBullet(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.fruitPurple, 10, 0, 0)

  constructor () {
    super()
    this.fruitChange()

    this.stateList = DonggramiEnemyParty.stateList
    this.stateDelay = new DelayData(120)
    this.delayChange()
  }

  fruitChange () {
    let random = Math.floor(Math.random() * 4)
    switch (random) {
      case 0: this.subType = DonggramiEnemyParty.subTypeList.FRUIT_GREEN; break
      case 1: this.subType = DonggramiEnemyParty.subTypeList.FRUIT_RED; break
      case 2: this.subType = DonggramiEnemyParty.subTypeList.FRUIT_ORANGE; break
      default: this.subType = DonggramiEnemyParty.subTypeList.FRUIT_PURPLE; break
    }
  }

  processStateNormal () {
    super.processStateNormal()
    if (this.stateDelay.count === 1) {
      this.fruitChange()
    }
  }

  processStateCreate () {
    if (this.stateDelay.check()) {
      // 일정 확률에 따라 상태를 변경합니다.
      let random = Math.random()
      if (random < 0.15) {
        this.state = this.stateList.EAT
      } else if (random > 0.87) {
        this.state = this.stateList.DROP
      } else {
        this.state = this.stateList.THROW
      }

      this.delayChange()
    }
  }

  processStateThrow () {
    if (this.stateDelay.count === 1) {
      let bulletType
      switch (this.subType) {
        case this.subTypeList.FRUIT_GREEN:
          bulletType = DonggramiEnemyFruit.bulletFruitGreen
          break
        case this.subTypeList.FRUIT_ORANGE:
          bulletType = DonggramiEnemyFruit.bulletFruitOrange
          break
        case this.subTypeList.FRUIT_PURPLE:
          bulletType = DonggramiEnemyFruit.bulletFruitPurple
          break
        case this.subTypeList.FRUIT_RED:
          bulletType = DonggramiEnemyFruit.bulletFruitRed
          break
        default: return
      }

      const minSpeed = 5
      const plusSpeed = 2
      // 이 코드의 의미는 속도값을 랜덤으로 설정하지만 50%확률로 양수 또는 음수로 결정됩니다.
      let speedX = Math.random() < 0.5 ? Math.random() * plusSpeed + minSpeed : Math.random() * -plusSpeed - minSpeed
      let speedY = Math.random() < 0.5 ? Math.random() * plusSpeed + minSpeed : Math.random() * -plusSpeed - minSpeed
      let customBullet = bulletType.getCreateObject()
      customBullet.moveSpeedX = speedX
      customBullet.moveSpeedY = speedY

      fieldState.createEnemyBulletObject(customBullet, this.x, this.y)
      soundSystem.play(soundSrc.donggrami.throw)
    }

    if (this.stateDelay.check()) {
      this.state = this.stateList.NORMAL
    }
  }
}

class DonggramiEnemyJuice extends DonggramiEnemyParty {
  constructor () {
    super()
    this.stateDelay = new DelayData(120)
    this.fruitChange()
  }
  
  fruitChange () {
    let random = Math.floor(Math.random() * 3)
    switch (random) {
      case 0: this.subType = DonggramiEnemyParty.subTypeList.JUICE_COLA; break
      case 1: this.subType = DonggramiEnemyParty.subTypeList.JUICE_ORANGE; break
      default: this.subType = DonggramiEnemyParty.subTypeList.JUICE_WATER; break
    }
  }

  processStateCreate () {
    if (this.stateDelay.check()) {
      let random = Math.random()
      if (random < 0.33) {
        this.state = this.stateList.EAT
        soundSystem.play(soundSrc.donggrami.juiceEat)
      } else if (random > 0.66) {
        this.state = this.stateList.THROW
        if (this.subType === this.subTypeList.JUICE_COLA) {
          soundSystem.play(soundSrc.donggrami.juiceCola)
        }
      } else {
        this.state = this.stateList.DROP
      }
    }
  }

  processStateThrow () {
    let count = this.stateDelay.count
    if (this.subType === this.subTypeList.JUICE_ORANGE && count === 1) {
      let orangeBullet = new CustomEnemyBullet('', null, 5, 0, 9)
      orangeBullet.width = 50
      orangeBullet.height = 150
      orangeBullet.display = () => {
        graphicSystem.fillRect(orangeBullet.x, orangeBullet.y, orangeBullet.width, orangeBullet.height, 'orange')
      }
      fieldState.createEnemyBulletObject(orangeBullet, this.objX, this.objY)
      soundSystem.play(soundSrc.donggrami.juiceThrow)
    } else if (this.subType === this.subTypeList.JUICE_COLA && (count % 2 === 0 && count <= 60)) {
      let colaBullet = new CustomEnemyBullet('', null, 1)
      colaBullet.setMoveSpeed(Math.random() * 10 - 5, Math.random() * -6 - 6)
      colaBullet.display = function () {
        graphicSystem.fillEllipse(this.x, this.y, 10, 10, 0, '#995a32')
        graphicSystem.fillEllipse(this.x + 1, this.y + 1, 8, 8, 0, '#6e3a20') // 카라멜 색
        graphicSystem.fillEllipse(this.x + 2, this.y + 2, 6, 6, 0, '#85461e')
      }
      fieldState.createEnemyBulletObject(colaBullet, this.objX, this.objY)
    } else if (this.subType === this.subTypeList.JUICE_WATER && count === 1) {
      soundSystem.play(soundSrc.donggrami.throw)
      let juiceBullet = new CustomEnemyBullet(imageSrc.enemyEffect.donggrami, imageDataInfo.donggramiEnemyEffect.juiceWater, 17, Math.random() * 10 - 5, Math.random() * 10 - 5)
      fieldState.createEnemyBulletObject(juiceBullet, this.objX, this.objY)
    }

    if (this.stateDelay.check()) {
      this.delayChange()
      this.fruitChange()
      this.state = this.stateList.NORMAL
    }
  }

  display () {
    super.display()

    // 콜라만 예외적으로 던지기 상태일 때 오브젝트를 보여줌
    if (this.state === this.stateList.THROW && this.subType === this.subTypeList.JUICE_COLA) {
      this.displayObject()
    }
  }
}

class DonggramiEnemyTree extends DonggramiEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.tree)
    this.setWidthHeight(this.width * 2, this.height * 2)
    this.setEnemyByCpStat(80, 15)
    this.setMoveSpeed(1, 0)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieDonggramiLeaf)
    this.leafCount = 5
    this.moveDelay = new DelayData(180)
    this.isPossibleExit = false
  }

  processDieAfter () {
    // 동그라미와 죽는 방식이 다르므로 기본 함수를 가져와서 실행
    if (this.isDied) {
      // 적이 죽었을 때, 딜레이가 null 이거나, 딜레이가 있을 때 딜레이카운트를 다 채우면 그 때 삭제
      if (this.dieAfterDeleteDelay == null || this.dieAfterDeleteDelay.check()) {
        this.processDieAfterLogic()
      }
    }
  }

  processMove () {
    if (this.leafCount >= 1 && this.moveDelay.check()) {
      this.leafCount--
      fieldState.createEnemyObject(ID.enemy.donggramiEnemy.leaf, this.x + 50, this.y + 50)
    }

    super.processMove()
  }

  processDieDefault () {
    super.processDieDefault()
    for (let i = 0; i < this.leafCount + 5; i++) {
      let x = this.x + Math.random() * 100 - 50
      let y = this.y + Math.random() * 100 - 50
      fieldState.createEnemyObject(ID.enemy.donggramiEnemy.leaf, x, y)
    }
  }

  display () {
    let alpha = 1
    if (this.isDied) {
      alpha = (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count) * (1 / this.dieAfterDeleteDelay.delay)
    }

    graphicSystem.setAlpha(alpha)
    super.display()
    graphicSystem.setAlpha(1)
  }
}

class DonggramiEnemyLeaf extends DonggramiEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.leaf)
    this.setEnemyByCpStat(4, 4)
    this.setRandomMoveSpeed(1, 1, true)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieDonggramiLeaf)
    this.END_FRAME = 660

    this.dieAfterDeleteDelay.delay = 15 // 죽는 딜레이 변경
    this.isPossibleExit = false
  }

  processDieAfter () {
    // 동그라미와 죽는 방식이 다르므로 기본 함수를 가져와서 실행
    if (this.isDied) {
      // 적이 죽었을 때, 딜레이가 null 이거나, 딜레이가 있을 때 딜레이카운트를 다 채우면 그 때 삭제
      if (this.dieAfterDeleteDelay == null || this.dieAfterDeleteDelay.check()) {
        this.processDieAfterLogic()
      }
    }
  }

  processMove () {
    super.processMove()

    if (this.elapsedFrame >= this.END_FRAME) {
      this.isDeleted = true
    }
  }

  display () {
    let alpha = 1
    const waitFrame = 60
    if (this.elapsedFrame >= this.END_FRAME - waitFrame) {
      alpha = (this.END_FRAME - this.elapsedFrame) * (1 / waitFrame)
    } else if (this.isDied) {
      alpha = (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count) * (1 / this.dieAfterDeleteDelay.delay)
    }

    graphicSystem.setAlpha(alpha)
    super.display()
    graphicSystem.setAlpha(1)
  }
}

/** r2-4 에서 도망쳐! 를 외칩니다. 그 역할이 전부인 연출용 적이기 때문에 죽일 수는 없습니다. */
class DonggramiEnemyTalkRunAwayR2_4 extends DonggramiEnemyTalk {
  constructor () {
    super()
    this.BASE_DELAY = 120
    this.talkDelay.delay = this.BASE_DELAY // 더 짧은 주기로 대화함
    this.talkDelay.count = this.talkDelay.delay - 10 // 첫 대화를 더 빠르게 실행
    this.setMoveSpeed(7, Math.random() * 2 - 1)
    this.isPossibleExit = true // 이 동그라미는 바깥을 빠져나가야 합니다.
    this.isExitToReset = false // 따라서 바깥으로 나가면 리셋되는걸 막아야함

    // 이 동그라미는 죽일 수 없고, 연출용도로만 활용합니다.
    this.setEnemyStat(39990000, 0, 10)
  }

  processMove () {
    super.processMove()

    // 화면 바깥을 어느 정도 벗어나면 삭제함
    if (this.x + this.width < -240) {
      this.isDeleted = true
    } else if (this.x >= graphicSystem.CANVAS_WIDTH + 240) {
      this.isDeleted = true
    }
  }

  processTalk () {
    super.processTalk()

    // 60보다 더 큰 딜레이를 가질 경우, 이를 다시 재조정합니다.
    if (this.talkDelay.delay > this.BASE_DELAY) {
      soundSystem.play(soundSrc.donggrami.exclamationMark)
      this.talkDelay.delay = this.BASE_DELAY
    }
  }

  getRandomTalk () {
    // 이 동그라미는 오직 도망챠! 만 말합니다.
    return '도망쳐!'
  }
}

class DonggramiEnemyTalkParty extends DonggramiEnemyTalk {
  constructor () {
    super()
  }

  /** 랜덤한 대화를 얻습니다. (무작위로 얻은 대사로 대화를 함.) */
  getRandomTalk () {
    let talk = DonggramiEnemy.talkPartyList
    let index = Math.floor(Math.random() * talk.length)
    return talk[index]
  }
}

class DonggramiEnemyTalkRuinR2_6 extends DonggramiEnemyTalk {
  getRandomTalk () {
    let talk = DonggramiEnemy.talkRuinList
    let index = Math.floor(Math.random() * talk.length)
    return talk[index]
  }
}

class IntruderEnemy extends EnemyData {
  constructor () {
    super()
    this.baseCp = 50000
    this.imageSrc = imageSrc.enemy.intruderEnemy
    this.isExitToReset = true
    this.isPossibleExit = false
    this.moveDelay = new DelayData(120) // 기본 이동 주기 (120프레임, 2초 간격)
    this.moveDelay.setCountMax() // 이동방식을 변경하기 위한 지연시간은 생성하는 순간에는 적용되지 않습니다.
    this.attackDelay = new DelayData(180) // 기본 공격 주기 (180프레임, 3초 간격)
  }

  static DIV_SCORE = 200

  /** intruderEnemy 전용 함수: 딜레이 값을 재설정합니다. */
  setIntruderDelay (moveDelay = 0, attackDelay = 0) {
    this.moveDelay.delay = moveDelay
    this.attackDelay.delay = attackDelay
  }
}

class IntruderEnemyJemuBoss extends IntruderEnemy {
  constructor () {
    super()
    // 적 체력 6000% 적용 (dps의 60배)
    // 보스와 해당 구간(라운드 2-4)의 경험치를 조절하기 위해 얻는 경험치의 배율을 다르게 조정했습니다.
    this.setEnemyByCpStat(6000, 0, IntruderEnemy.DIV_SCORE) // 내부 공격력 없음 (따라서, 적과 충돌했을때에는 데미지 0)
    /** 번개 공격력 */ this.ATTACK_THUNDER = 4

    this.setAutoImageData(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.jemuWing, 4)
    this.setWidthHeight(this.width * 2, this.height * 2) // 기존 (이미지데이터)크기의 2배로 재설정
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderJemu)
    this.mainType = 'boss'

    this.eyeEffect = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.jemuEye, 4, -1)
    this.eyeEffect.setOutputSize(imageDataInfo.intruderEnemy.jemuEye.width * 2, imageDataInfo.intruderEnemy.jemuEye.height * 2)

    this.finishX = 0
    this.finishY = 0
    this.setIntruderDelay(120, 180)
    this.attackDelay.count = 50 // 이것은 첫번째 패턴 지연시간을 줄이기 위해 추가로 설정한 값입니다.
    this.ATTACK_PRE_DELAY = 20

    this.isPossibleExit = false
    this.dieAfterDeleteDelay = new DelayData(60)

    /** 에너지 24발 동시 발사 패턴 */ this.STATE_ENERGY12 = 'energy24'
    /** 에너지 3발을 플레이어 근처에 발사하는 패턴 */ this.STATE_ENERGYP3 = 'energyp3'
    /** 에너지를 발사하는데 그 에너지는 벽에 반사됨 */ this.STATE_ENERGYRE = 'energyre'
    /** 좌우 양옆으로 번개 발사 */ this.STATE_THUNDERLR = 'thunderlr'
    /** 번개를 생성시키고 크기를 커지게 함 */ this.STATE_THUNDERBIG = 'thunderbig'
    /** 번개를 4방향으로 생성시키고 회전시킴 */ this.STATE_THUNDERLINE = 'thunderline'
    this.STATE_NORMAL = 'normal'

    this.attackObjectThunder = {baseX: 0, baseY: 0, x: 0, y: 0, width: 0, height: 0}
    this.attackObject1 = {x: 0, y: 0, width: 1600, height: 60, degree: 0}
    this.attackObject2 = {x: 0, y: 0, width: 1600, height: 60, degree: 90}
    this.bigThunderEnimation = EnimationData.createEnimation(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.energyThunder, 2, -1)

    this.attackNumberIndex = 0
    this.attackNumberStack = [0, 1, 2, 3, 4, 5]
    // 공격 번호를 중복없이 랜덤배치
    for (let i = 0; i < this.attackNumberStack.length; i++) {
      let randomIndex = Math.floor(Math.random() * this.attackNumberStack.length)
      let tempNumber = this.attackNumberStack[i] 
      this.attackNumberStack[i] = this.attackNumberStack[randomIndex]
      this.attackNumberStack[randomIndex] = tempNumber
    }
  }

  static thunderEnimation = EnimationData.createEnimation(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.energyThunder, 4, -1)
  static energyBullet = new CustomEnemyBullet(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.energyBolt, 8, 1, 0)
  static EnergyReflectBullet = class extends CustomEnemyBullet {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.energyReflect)
      this.attack = 4
      this.reflectCount = 0
    }

    processMove () {
      super.processMove()
      if (this.elapsedFrame >= 300 || this.reflectCount >= 4) {
        this.isDeleted = true
      }

      const minSpeed = 7

      if (Math.abs(this.moveSpeedX) < minSpeed) {
        this.moveSpeedX = this.moveSpeedX > 0 ? minSpeed : -minSpeed
      }
      if (Math.abs(this.moveSpeedY) < minSpeed) {
        this.moveSpeedY = this.moveSpeedY > 0 ? minSpeed : -minSpeed
      }

      if (this.x < 0) {
        this.x = 0
        this.moveSpeedX = Math.abs(this.moveSpeedX)
        this.reflectCount++
      } else if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
        this.x = graphicSystem.CANVAS_WIDTH - this.width
        this.moveSpeedX = -Math.abs(this.moveSpeedX)
        this.reflectCount++
      }

      if (this.y < 0) {
        this.y = 0
        this.moveSpeedY = Math.abs(this.moveSpeedY)
        this.reflectCount++
      } else if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT - this.height
        this.moveSpeedY = -Math.abs(this.moveSpeedY)
        this.reflectCount++
      }
    }
  }
  static ThunderLRBullet = class extends CustomEnemyBullet {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.energyThunder, 4)
      this.STATE_NORMAL = 'normal'
      this.STATE_MOVE = 'move'
      this.state = 'normal'
      this.moveDelay = new DelayData(1)
      this.attack = 6
    }

    static lineNumber = 0
    static getLineNumber () {
      this.lineNumber++
      if (this.lineNumber >= 10) {
        this.lineNumber = 0
      }

      return this.lineNumber
    }

    afterInit () {
      const isLeft = Math.random() < 0.5 ? true : false
      if (isLeft) {
        this.x = -this.width
        this.y = (Math.random() * 60) + (IntruderEnemyJemuBoss.ThunderLRBullet.getLineNumber() * 60)
        this.moveSpeedX = 7
        this.moveSpeedY = 0
      } else {
        this.x = graphicSystem.CANVAS_WIDTH + this.width
        this.y = (Math.random() * 60) + (IntruderEnemyJemuBoss.ThunderLRBullet.getLineNumber() * 60)
        this.moveSpeedX = -7
        this.moveSpeedY = 0
      }
    }

    processMove () {
      if (this.state === this.STATE_NORMAL) {
        if (this.moveDelay.check()) {
          this.state = this.STATE_MOVE
        }
      } else {
        super.processMove()
      }

      if (this.elapsedFrame >= 240) {
        this.isDeleted = true
      }
    }
  }

  processMove () {
    super.processMove()

    if (this.moveDelay.check()) {
      this.setRandomMoveSpeed(Math.random() * 1, Math.random() * 1, true)
    }
  }

  soundEnergy () {
    let random = Math.floor(Math.random() * 3)
    switch (random) {
      case 0: soundSystem.play(soundSrc.enemyAttack.intruderJemuEnergy); break
      case 1: soundSystem.play(soundSrc.enemyAttack.intruderJemuEnergyHigh); break
      case 2: soundSystem.play(soundSrc.enemyAttack.intruderJemuEnergyLow); break
    }
  }

  processState () {
    if (this.attackDelay.check()) {
      let getNumber = this.attackNumberStack[this.attackNumberIndex]
      this.attackNumberIndex++
      if (this.attackNumberIndex >= this.attackNumberStack.length) {
        this.attackNumberIndex = 0
      }

      switch (getNumber) {
        case 0: this.state = this.STATE_ENERGY12; break
        case 1: this.state = this.STATE_ENERGYP3; break
        case 2: this.state = this.STATE_ENERGYRE; break
        case 3: this.state = this.STATE_THUNDERBIG; break
        case 4: this.state = this.STATE_THUNDERLINE; break
        case 5: this.state = this.STATE_THUNDERLR; break
        default: this.state = this.STATE_NORMAL
      }

      // 2초간의 대기시간을 가지게 하기 위한 추가적인 딜레이
      // 단, 공격 함수 내에서 이 count가 마이너스일때 공격 처리를 무시하도록 해야함
      this.attackDelay.count = -this.ATTACK_PRE_DELAY
    }
  }

  processAttack () {
    // 공격 지연시간 카운트가 음수이면 공격을 처리하지 않도록 함
    if (this.attackDelay.count < 0) return

    if (this.state === this.STATE_ENERGY12 && this.attackDelay.divCheck(20)) {
      // 원 위방향(0, 1) 부터 시계방향으로 360도 회전)
      for (let i = 0; i < 12; i++) {
        const x = 0
        const y = 4
        const degree = 30
        const radian = (Math.PI / 180) * degree * i
        let rx = (Math.cos(radian) * x) - (Math.sin(radian) * y)
        let ry = (Math.sin(radian) * x) + (Math.cos(radian) * y)
        let bullet = IntruderEnemyJemuBoss.energyBullet.getCreateObject()
        bullet.setMoveSpeed(rx, ry)
        fieldState.createEnemyBulletObject(bullet, this.centerX - (bullet.width / 2), this.centerY - (bullet.height / 2))
      }
      this.soundEnergy()
    } else if (this.state === this.STATE_ENERGYP3 && this.attackDelay.divCheck(15)) {
      let player = fieldState.getPlayerObject()
      let speedX = (player.centerX - this.centerX) / 120
      let speedY = (player.centerY - this.centerY) / 120
      const minSpeed = 8
      if (Math.abs(speedX) < minSpeed && Math.abs(speedY) < minSpeed) {
        // speedX와 speedY의 값을 비교하여 가장 높은 값을 최소 속도에 맞춰지도록 조정합니다.
        let mul = Math.abs(speedX) < Math.abs(speedY) ? minSpeed / Math.abs(speedY) : minSpeed / Math.abs(speedX)
        speedX *= mul
        speedY *= mul
      }

      for (let i = 0; i < 3; i++) {
        let bullet = IntruderEnemyJemuBoss.energyBullet.getCreateObject()
        bullet.setMoveSpeed(speedX + (Math.random() * 2 - 1), speedY + (Math.random() * 2 - 1))
        fieldState.createEnemyBulletObject(bullet, this.centerX - (bullet.width / 2), this.centerY - (bullet.height / 2))
      }

      this.soundEnergy()
    } else if (this.state === this.STATE_ENERGYRE && this.attackDelay.divCheck(15)) {
      let bullet = new IntruderEnemyJemuBoss.EnergyReflectBullet()
      bullet.setRandomMoveSpeed(8, 8, true)
      fieldState.createEnemyBulletObject(bullet, this.centerX - (bullet.width / 2), this.centerY - (bullet.height / 2))
      soundSystem.play(soundSrc.enemyAttack.intruderJemuEnergyPurple)
    } else if (this.state === this.STATE_THUNDERLR && this.attackDelay.divCheck(60)) {
      for (let i = 0; i < 6; i++) {
        let bullet = new IntruderEnemyJemuBoss.ThunderLRBullet()
        fieldState.createEnemyBulletObject(bullet)
      }
      soundSystem.play(soundSrc.enemyAttack.intruderJemuThunderNormal)
    } else if (this.state === this.STATE_THUNDERBIG) {
      let count = this.attackDelay.count
      if (this.attackDelay.count === 0) {
        this.attackObjectThunder.baseX = Math.random() * 400 + 200
        this.attackObjectThunder.baseY = Math.random() * 400 + 100
        this.attackObjectThunder.width = 1
        this.attackObjectThunder.height = 1
        soundSystem.play(soundSrc.enemyAttack.intruderJemuThunderBig)
      } else {
        this.attackObjectThunder.width = count * 4
        this.attackObjectThunder.height = Math.floor(count / 2)
      }

      this.attackObjectThunder.x = this.attackObjectThunder.baseX - (this.attackObjectThunder.width / 2)
      this.attackObjectThunder.y = this.attackObjectThunder.baseY - (this.attackObjectThunder.height / 2)

      // 플레이어 데미지 처리
      let player = fieldState.getPlayerObject()
      if (this.attackDelay.count >= 30 && this.attackDelay.divCheck(6) && collision(player, this.attackObjectThunder)) {
        player.addDamage(this.ATTACK_THUNDER)
      }

      this.bigThunderEnimation.process()
    } else if (this.state === this.STATE_THUNDERLINE) {
      if (this.attackDelay.count === 1) {
        soundSystem.play(soundSrc.enemyAttack.intruderJemuThunderBig)
      }

      this.attackObject1.degree += 1.2
      this.attackObject2.degree += 1.2
      this.attackObject1.x = this.centerX - (this.attackObject1.width / 2)
      this.attackObject1.y = this.centerY - (this.attackObject1.height / 2)
      this.attackObject2.x = this.centerX - (this.attackObject1.width / 2)
      this.attackObject2.y = this.centerY - (this.attackObject1.height / 2)

      this.bigThunderEnimation.process()

      // 플레이어 데미지 처리
      let player = fieldState.getPlayerObject()
      if (this.attackDelay.count >= 60 && this.attackDelay.divCheck(6)) {
        if (collisionClass.collisionOBB(player, this.attackObject1) || collisionClass.collisionOBB(player, this.attackObject2)) {
          player.addDamage(this.ATTACK_THUNDER)
        }
      }
    }
  }

  processEnimation () {
    super.processEnimation()
    this.eyeEffect.process()
  }

  display () {
    let alpha = 1
    if (this.dieAfterDeleteDelay.count >= 1) {
      let leftFrame = 50 - this.dieAfterDeleteDelay.count
      if (leftFrame <= 0) leftFrame = 0
      alpha = leftFrame * (1 / 50)
    }

    if (alpha !== 1) {
      graphicSystem.setAlpha(alpha)
    }

    super.display()
    this.eyeEffect.display(this.x + (30 * 2), this.y + (32 * 2))

    if (alpha !== 1) {
      graphicSystem.setAlpha(1)
    }

    if (this.isDied) return

    if (this.attackDelay.count >= 0 && this.state === this.STATE_THUNDERBIG) {
      this.bigThunderEnimation.outputWidth = this.attackObjectThunder.width
      this.bigThunderEnimation.outputHeight = this.attackObjectThunder.height
      this.bigThunderEnimation.degree = 0
      this.bigThunderEnimation.display(this.attackObjectThunder.x, this.attackObjectThunder.y)
    } else if (this.attackDelay.count >= 0 && this.state === this.STATE_THUNDERLINE) {
      if (this.attackDelay.count < 60) {
        alpha = this.attackDelay.count * (1 / 60)
      } else {
        alpha = 1
      }

      graphicSystem.setAlpha(alpha)
      this.bigThunderEnimation.outputWidth = this.attackObject1.width
      this.bigThunderEnimation.outputHeight = this.attackObject1.height
      this.bigThunderEnimation.degree = this.attackObject1.degree
      this.bigThunderEnimation.display(this.attackObject1.x, this.attackObject1.y)
      this.bigThunderEnimation.degree = this.attackObject2.degree
      this.bigThunderEnimation.display(this.attackObject2.x, this.attackObject2.y)
      graphicSystem.setAlpha(1)
    }
  }
}

class IntruderEnemySquare extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.square)
    this.setEnemyByCpStat(20, 9, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderSquare, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareBlueLine, this.width, this.height, 3))

    this.enimationMoveLeftRight = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.square3DLeft, 4, -1)
    this.enimationMoveUpDown = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.square3DUp, 4, -1)
    
    this.setMoveDirection('', '') // 이동 방향을 기본값으로 변경 (왜냐하면 좌표를 기준으로 이동 방향을 연산하기 때문)
    this.STATE_STOP = 'stop'
    this.STATE_MOVE_LEFT_RIGHT = 'leftright'
    this.STATE_MOVE_UP_DOWN = 'updown'
    this.state = this.STATE_STOP
    this.setIntruderDelay(30)
  }

  getCollisionArea () {
    // 충돌 영역 보정
    return [{
      x: this.x + 10,
      y: this.y + 10,
      width: this.width - 20,
      height: this.height - 20,
    }]
  }

  processMove () {
    super.processMove()

    if (this.moveDelay.check()) {
      // 이 사각형은 좌, 우, 상, 하 로만 이동하지만, 가능하다면 플레이어를 추적하기 쉬운 경로로 이동함
      // 그리고 이동되는 방향에 따라 에니메이션이 결정됨 
      let player = fieldState.getPlayerObject()
      let distanceX = player.x - this.x
      let distanceY = player.y - this.y
      const divide = 40
      const minSpeed = 2
      const maxSpeed = 3
      let speedX = distanceX / divide
      let speedY = distanceY / divide
      // 최대 속도 보정 및, 최소 속도 보정
      if (Math.abs(speedX) > maxSpeed) {
        speedX = speedX >= 0 ? maxSpeed : -maxSpeed
      } else if (Math.abs(speedX) < minSpeed) {
        speedX = speedX >= 0 ? minSpeed : -minSpeed
      }

      if (Math.abs(speedY) > maxSpeed) {
        speedY = speedY >= 0 ? maxSpeed : -maxSpeed
      } else if (Math.abs(speedY) < minSpeed) {
        speedY = speedY >= 0 ? minSpeed : -minSpeed
      }
      
      if (Math.abs(distanceX) >= Math.abs(distanceY)) {
        // x축 거리가 더 많이 남은경우
        this.setMoveSpeed(speedX, 0)
        this.state = this.STATE_MOVE_LEFT_RIGHT
      } else {
        // y축 거리가 더 많이 남은 경우
        this.setMoveSpeed(0, speedY)
        this.state = this.STATE_MOVE_UP_DOWN
      }
    }
  }

  processEnimation () {
    super.processEnimation()
    this.enimationMoveLeftRight.process()
    this.enimationMoveUpDown.process()
  }

  display () {
    if (this.state === this.STATE_STOP) {
      super.display()
    } else if (this.state === this.STATE_MOVE_LEFT_RIGHT) {
      this.enimationMoveLeftRight.display(this.x, this.y)
    } else if (this.state === this.STATE_MOVE_UP_DOWN) {
      this.enimationMoveUpDown.display(this.x, this.y)
    }
  }
}

class IntruderEnemyMetal extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.metal)
    this.setEnemyByCpStat(20, 12, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderMetal, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.metalSlash, this.width, this.height, 2))
    this.STATE_MOVE = 'move'
    this.STATE_AFTERIMAGE = 'afterimage'
    this.state = this.STATE_MOVE

    // 잔상 이미지 좌표의 기본값이 -9999인 이유는 화면 내에 표시하지 못하게 하기 위함
    /** 잔상 개수 */ this.afterimageCount = 0 
    /** 잔상 출력용 이미지 좌표 */ this.afterimageX = [-9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999]
    /** 잔상 출력용 이미지 좌표 */ this.afterimageY = [-9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999]
    /** 잔상 유지용 남은 프레임 값 */ this.afterimageFrame = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    /** 잔상 출력용 이미지 처리 */ this.afterimage = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.metal)
    /** 잔상 유지 프레임 */ this.AFTERIMAGE_DISPLAY_FRAME = 60

    /** 이펙트 출력용 에니메이션 */
    this.effectLightEnimation = EnimationData.createEnimation(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.lightMetal, 2)
    this.effectLightEnimationDelay = new DelayData(120)
  }

  processState () {
    if (this.moveDelay.check()) {
      // 75% 확률로 기본 이동 상태, 25%확률로 잔상 이동 상태
      this.state = Math.random() < 0.75 ? this.STATE_MOVE : this.STATE_AFTERIMAGE
      this.afterimageCount = 0

      if (this.state === this.STATE_MOVE) {
        this.setRandomMoveSpeed(2, 2, true)
      } else if (this.state === this.STATE_AFTERIMAGE) {
        let player = fieldState.getPlayerObject()
        let distanceX = player.x - this.x
        let distanceY = player.y - this.y
        const minSpeed = 4
        let speedX = distanceX > 0 ? minSpeed : -minSpeed
        let speedY = distanceY > 0 ? minSpeed : -minSpeed
        this.setMoveSpeed(speedX, speedY)
        this.setMoveDirection()
      }
    }

    // 잔상 이미지 출력 프레임 감소
    for (let i = 0; i < this.afterimageFrame.length; i++) {
      if (this.afterimageFrame[i] >= 0) {
        this.afterimageFrame[i]--
      }
    }

    if (this.effectLightEnimationDelay.check()) {
      this.effectLightEnimation.reset()
    }
  }

  processEnimation () {
    super.processEnimation()
    this.effectLightEnimation.process()

    // 참고: afterImage는 에니메이션이 1프레임이라, process를 사용하지 않아도 결과는 같습니다.
  }

  processMove () {
    if (this.state === this.STATE_MOVE) {
      super.processMove()
    } else if (this.state === this.STATE_AFTERIMAGE) {
      if (this.moveDelay.divCheck(4)) {
        // 이동할 때마다 잔상 추가 (일정 간격 단위)
        if (this.afterimageCount < this.afterimageX.length) {
          this.afterimageX[this.afterimageCount] = this.x
          this.afterimageY[this.afterimageCount] = this.y
          this.afterimageFrame[this.afterimageCount] = this.AFTERIMAGE_DISPLAY_FRAME
          this.afterimageCount++
        } else {
          // 잔상 배열이 꽉차면 나머지 원소를 앞으로 밀어내고 새 원소를 추가
          this.afterimageX.shift()
          this.afterimageY.shift()
          this.afterimageFrame.shift()
          this.afterimageX.push(this.x)
          this.afterimageY.push(this.y)
          this.afterimageFrame.push(this.AFTERIMAGE_DISPLAY_FRAME)
        }
      }

      super.processMove() // 그리고 이동
    }
  }

  display () {
    // 잔상 이미지
    for (let i = 0; i < this.afterimageX.length || i < this.afterimageCount - 1; i++) {
      if (this.afterimageFrame[i] >= 0) {
        this.afterimage.alpha = (1 / this.AFTERIMAGE_DISPLAY_FRAME * this.afterimageFrame[i])
        this.afterimage.display(this.afterimageX[i], this.afterimageY[i])
      }
    }

    super.display() // 기본 이미지 (이미지를 잔상 위에 출력하기 위해 잔상 이미지보다 더 늦게 그려짐)

    // 이펙트 이미지
    this.effectLightEnimation.display(this.x + 4, this.y + 4)
  }
}

class IntruderEnemyDiacore extends IntruderEnemyMetal {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.diacore)
    this.setEnemyByCpStat(20, 14, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderDiacore, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.diamondBlue, this.width, this.height, 2))

    // 적 총알
    this.energyBullet = new CustomEnemyBullet(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.energyBolt, 10, 4, 4)

    // 잔상 이미지 수정
    this.afterimage = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.diacore)

    // 빛 이미지 수정
    this.effectLightEnimation = EnimationData.createEnimation(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.lightDiacore, 2)
  }

  getCollisionArea () {
    return [
      {x: this.x, y: this.y + 35, width: this.width, height: 30},
      {x: this.x + 35, y: this.y, width: 30, height: this.height}
    ]
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let customBullet = this.energyBullet.getCreateObject()
      let directionLR = Math.random() < 0.5 ? FieldData.direction.LEFT : FieldData.direction.RIGHT
      let dircetionUD = Math.random() < 0.5 ? FieldData.direction.UP : FieldData.direction.DOWN
      customBullet.setMoveDirection(directionLR, dircetionUD)
      fieldState.createEnemyBulletObject(customBullet, this.centerX - (customBullet.width / 2), this.centerY - (customBullet.height / 2))
      soundSystem.play(soundSrc.enemyAttack.intruderJemuEnergy)
    }
  }
}

class IntruderEnemyRendown extends IntruderEnemy {
  constructor () {
    super()
    let targetImageData = Math.random() < 0.3 ? imageDataInfo.intruderEnemy.rendownBlue : imageDataInfo.intruderEnemy.rendownGreen
    this.setAutoImageData(this.imageSrc, targetImageData, 6)
    this.setEnemyByCpStat(100, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderRendown, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.pulseDiamondBlue, this.width, this.height, 3))
    this.dieAfterDeleteDelay = new DelayData(60)
  }

  processDieAfter () {
    super.processDieAfter()

    if (this.isDied) {
      if (this.y + this.height >= graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT - this.height
      } else {
        // 땅으로 떨어질때까지 넘어짐
        this.degree++
        this.x++
        this.y += this.dieAfterDeleteDelay.count
      }
    }
  }

  static EnergyBulletLeft = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.leverMissileLeft, 0, -2, 5)
    }

    processMove () {
      super.processMove()
      this.degree += 4

      if (this.y + this.height >= graphicSystem.CANVAS_HEIGHT) {
        if (this.elapsedFrame >= 60) {
          let enemyBullet = new IntruderEnemyRendown.EnergyBombBullet()
          enemyBullet.x = this.x
          enemyBullet.y = graphicSystem.CANVAS_HEIGHT - enemyBullet.height
          fieldState.createEnemyBulletObject(enemyBullet, enemyBullet.x, enemyBullet.y)
          soundSystem.play(soundSrc.enemyAttack.intruderRendownMissile)
          this.isDeleted = true
        } else {
          this.y = graphicSystem.CANVAS_HEIGHT - this.height
          this.moveSpeedX = 0
        }
      }
    }

    processCollision () {}
  }

  static EnergyBulletRight = class extends IntruderEnemyRendown.EnergyBulletLeft {
    constructor () {
      super()
      this.setMoveSpeed(Math.abs(this.moveSpeedX), this.moveSpeedY)
    }
  }

  static EnergyBombBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.leverMissileBomb, 5, 0, 0)
      this.setWidthHeight(this.width * 2, this.height * 2)
      this.attackDelay = new DelayData(4)
      this.customEffect = new CustomEffect(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.leverMissileBomb, this.width, this.height, 3)
      this.baseHeight = this.height

      this.totalFrame = 0
      if (this.customEffect.frameDelay != null && this.customEffect.enimation != null) {
        this.totalFrame = this.customEffect.frameDelay * this.customEffect.enimation?.frameCount
      }
    }

    afterInit () {
      this.y = graphicSystem.CANVAS_HEIGHT - this.height
      fieldState.createEffectObject(this.customEffect, this.x, this.y)
    }

    processCollision () {
      if (this.attackDelay.check()) {
        super.processCollision()
      }

      if (this.elapsedFrame >= this.totalFrame) {
        this.isDeleted = true
      } else {
        this.isDeleted = false
      }
    }

    // 아무것도 출력하지 않습니다.
    display () {}
  }

  processMove () {
    if (this.moveDelay.check()) {
      if (Math.random() < 0.5) {
        this.setRandomMoveSpeed(2, 0, true)
      } else {
        this.setRandomMoveSpeed(0, 2, true)
      }
    }

    super.processMove()
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let customBullet = Math.random() < 0.5 ? new IntruderEnemyRendown.EnergyBulletLeft() : new IntruderEnemyRendown.EnergyBulletRight()
      fieldState.createEnemyBulletObject(customBullet, this.x, this.y + this.height)
    }
  }

  display () {
    if (this.isDied) {
      let imgD = imageDataInfo.intruderEnemy.rendownDie
      let alpha = (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count) * (1 / this.dieAfterDeleteDelay.delay)
      graphicSystem.imageDisplay(this.imageSrc, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, this.width, this.height, 0, this.degree, alpha)
    } else {
      super.display()
    }
  }
}

class IntruderEnemyLever extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.leverImage)
    this.setEnemyByCpStat(50, 11, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderLever, new CustomEffect(imageSrc.enemyDie.enemyDieIntruder, imageDataInfo.enemyDieIntruder.enemyDieIntruderLever, this.width, this.height, 2))

    this.STATE_LEFT = 'left'
    this.STATE_RIGHT = 'right'
    this.STATE_NORMAL = ''
    this.state = this.STATE_NORMAL

    this.enimationLeft = EnimationData.createEnimation(this.imageSrc, imageDataInfo.intruderEnemy.leverLeft)
    this.enimationRight = EnimationData.createEnimation(this.imageSrc, imageDataInfo.intruderEnemy.leverRight)
  }

  static LaserBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.leverLaser, 3, 0, -20, '', '')
      this.setWidthHeight(imageDataInfo.intruderEnemy.leverImage.width, graphicSystem.CANVAS_HEIGHT)
      this.attackDelay = new DelayData(5)
    }

    processCollision () {
      if (this.attackDelay.check()) {
        super.processCollision()
      }
      
      if (this.elapsedFrame <= 120) {
        this.isDeleted = false 
      } else {
        this.isDeleted = true
      }
    }
  }

  processMove () {
    super.processMove()
    if (this.moveDelay.check()) {
      this.setRandomMoveSpeedMinMax(-2, -2, 2, 2)
    }
  }

  processEnimation () {
    super.processEnimation()
    this.enimationLeft.process()
    this.enimationRight.process()
  }

  processState () {
    if (this.attackDelay.check()) {
      this.state = Math.random() < 0.5 ? this.STATE_LEFT : this.STATE_RIGHT
      if (this.state === this.STATE_LEFT) {
        // create laser
        let bullet = new IntruderEnemyLever.LaserBullet()
        fieldState.createEnemyBulletObject(bullet, this.x, graphicSystem.CANVAS_HEIGHT)
        soundSystem.play(soundSrc.enemyAttack.intruderLeverLaser)
        this.enimationLeft.reset()
      } else if (this.state === this.STATE_RIGHT) {
        // create Bomb
        let bullet = new IntruderEnemyRendown.EnergyBulletLeft()
        fieldState.createEnemyBulletObject(bullet, this.x, this.y)
        this.enimationRight.reset()
      }
    }
  }

  display () {
    if (this.state === this.STATE_NORMAL) {
      super.display()
    } else if (this.state === this.STATE_LEFT) {
      if (this.enimationLeft.finished) {
        super.display()
      } else {
        this.enimationLeft.display(this.x, this.y)
      }
    } else if (this.state === this.STATE_RIGHT) {
      if (this.enimationRight.finished) {
        super.display()
      } else {
        this.enimationRight.display(this.x, this.y)
      }
    }
  }
}

class IntruderEnemyFlying1 extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.flying1, 4)
    this.setEnemyByCpStat(40, 6, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderFlying1, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleGreenStroke, this.width, this.height))
    this.moveDelay = new DelayData(120)
    this.moveDelay.count = this.moveDelay.delay

    this.attackDelay = new DelayData(120)
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.setRandomMoveSpeed(7, 1)
    }

    super.processMove()
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = new IntruderEnemyFlying1.LaserBullet()
      fieldState.createEnemyBulletObject(bullet, this.centerX, this.centerY)
      soundSystem.play(soundSrc.enemyAttack.intruderDaseokLaserGreen)
    }
  }

  static LaserBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.flyingGreenLaser, 6, 0, 0)
    }

    afterInit () {
      let player = fieldState.getPlayerObject()
      let speedX = (player.x - this.x) / 35
      let speedY = (player.y - this.y) / 35
      if (Math.abs(speedX) < 4) {
        speedX = speedX < 0 ? 4 : -4
      }
      
      if (Math.abs(speedY) < 4) {
        speedY = speedY < 0 ? 4 : -4
      }

      const atangent = Math.atan2(speedY, speedX)
      this.degree = atangent * (180 / Math.PI)

      this.moveSpeedX = speedX
      this.moveSpeedY = speedY
    }
  }
}

class IntruderEnemyFlying2 extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.flying2)
    this.setEnemyByCpStat(80, 6, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderFlying2, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleGreenStroke, this.width, this.height, 2))
  }

  processMove () {
    super.processMove()
    if (this.moveDelay.check()) {
      this.setRandomMoveSpeed(4, 2)
    }
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = new IntruderEnemyJemuBoss.EnergyReflectBullet()
      fieldState.createEnemyBulletObject(bullet, this.centerX, this.centerY)
      soundSystem.play(soundSrc.enemyAttack.intruderJemuEnergyHigh)
    }
  }
}

class IntruderEnemyFlyingRocket extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.flyingRocket)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderFlyingRocket, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleBlue, this.width, this.width, 2))
    this.setEnemyByCpStat(10, 4, IntruderEnemy.DIV_SCORE)
    this.setMoveDirection('', '')
  }

  processMove () {
    if (this.moveDelay.check()) {
      let player = fieldState.getPlayerObject()
      let speedX = (player.centerX - this.centerX) / 90
      let speedY = (player.centerY - this.centerY) / 90
      const minSpeed = 3
      if (Math.abs(speedX) < minSpeed && Math.abs(speedY) < minSpeed) {
        // speedX와 speedY의 값을 비교하여 가장 높은 값을 최소 속도에 맞춰지도록 조정합니다.
        let mul = Math.abs(speedX) < Math.abs(speedY) ? minSpeed / Math.abs(speedY) : minSpeed / Math.abs(speedX)
        speedX *= mul
        speedY *= mul
      }

      this.setMoveSpeed(speedX, speedY)
    }

    const atangent = Math.atan2(this.moveSpeedY, this.moveSpeedX)
    this.degree = atangent * (180 / Math.PI)

    super.processMove()
  }

}

class IntruderEnemyGami extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.gami)
    this.setEnemyByCpStat(100, 17, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderGami)
    this.setIntruderDelay(66, 0)

    this.STATE_NORMAL = ''
    this.STATE_STOP = 'stop'
    this.STATE_DIE = 'die'
    this.state = this.STATE_NORMAL
    this.dieAfterDeleteDelay = new DelayData(33)
  }

  processDieAfter () {
    super.processDieAfter()
    if (this.isDied) {
      if (this.x < graphicSystem.CANVAS_WIDTH_HALF) {
        this.x -= 5
      } else {
        this.x += 5
      }
  
      if (this.y < graphicSystem.CANVAS_HEIGHT_HALF) {
        this.y -= 5
      } else {
        this.y += 5
      }
    }
  }

  processMove () {
    if (this.moveDelay.check()) {
      this.state = Math.random() < 0.75 ? this.STATE_NORMAL : this.STATE_STOP
      if (this.state === this.STATE_NORMAL) {
        this.setRandomMoveSpeed(4, 4, true)
      } else {
        this.setMoveSpeed(0, 0)
      }

      if (this.enimation != null && this.enimation.frameDelay != null) {
        if (this.state === this.STATE_NORMAL) {
          this.enimation.frameDelay.delay = Math.floor(Math.random() * 3) + 1
          if (this.enimation.finished) {
            this.enimation.reset()
          }
        } else {
          this.enimation.finished = true // 강제로 에니메이션 완료처리
        }
      }
    }

    super.processMove()
  }

  display () {
    if (this.isDied) {
      let imgD = imageDataInfo.intruderEnemy.gamiDie
      let alpha = (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count) * (1 / this.dieAfterDeleteDelay.delay)
      graphicSystem.imageDisplay(this.imageSrc, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, this.width, this.height, 0, 0, alpha)
    } else {
      super.display()
    }
  }
}

class IntruderEnemyMomi extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.momi)
    this.setEnemyByCpStat(40, 10, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderMomi)
    this.baseSpeed = 6
    this.MAX_SPEED = 18
    this.setIntruderDelay(33, 10)
    this.dieAfterDeleteDelay = new DelayData(33)
    this.isPossibleExit = true
    this.isExitToReset = true
  }

  processDieAfter () {
    super.processDieAfter()
    if (this.isDied) {
      this.x += this.moveSpeedX
    }
  }

  processMove () {
    if (this.moveDelay.check()) {
      let speedX = this.baseSpeed + (Math.random() * 3) + (this.elapsedFrame * 0.02)
      let speedY = Math.random() * 1
      if (speedX > this.MAX_SPEED) speedX = this.MAX_SPEED
      this.setMoveSpeed(speedX, speedY)
    }

    super.processMove()
  }

  display () {
    if (this.isDied) {
      let imgD = imageDataInfo.intruderEnemy.momiDie
      let alpha = (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count) * (1 / this.dieAfterDeleteDelay.delay)
      graphicSystem.imageDisplay(this.imageSrc, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, this.width, this.height, 0, 0, alpha)
    } else {
      super.display()
    }
  }
}

class IntruderEnemyHanoi extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.hanoi)
    this.setEnemyByCpStat(200, 22, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderHanoi, new CustomEffect(imageSrc.enemyDie.enemyDieIntruder, imageDataInfo.enemyDieIntruder.enemyDieIntruderHanoi, this.width, this.height, 6))
    this.setRandomMoveSpeed(1, 0)
  }

  static HanoiBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.hanoiRing, 12)
      this.setAutoImageData(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.hanoiRing, 3)
      this.baseWidth = this.width
      this.baseHeight = this.height
      this.setRandomMoveSpeed(1, 0, true)
      this.setMoveSpeed(this.moveSpeedX, 5)
    }

    processMove () {
      super.processMove()
      if (this.y < 0) {
        this.y = 0
        this.moveSpeedY = Math.abs(this.moveSpeedY)
        if (this.elapsedFrame >= 180) {
          this.isDeleted = true
        } else {
          soundSystem.play(soundSrc.enemyAttack.intruderHanoiReflect)
        }
      } else if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT - this.height - 2
        this.moveSpeedY = -Math.abs(this.moveSpeedY)
        if (this.elapsedFrame >= 180) {
          this.isDeleted = true
        } else {
          soundSystem.play(soundSrc.enemyAttack.intruderHanoiReflect)
        }
      }

      let sizeMultiple = (this.elapsedFrame / 60)
      if (sizeMultiple > 2) sizeMultiple = 2
      this.setWidthHeight(this.baseWidth * sizeMultiple, this.baseHeight * sizeMultiple)
    }
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = new IntruderEnemyHanoi.HanoiBullet()
      fieldState.createEnemyBulletObject(bullet, this.x, this.y)
      soundSystem.play(soundSrc.enemyAttack.intruderHanoiAttack)
    }
  }

  processMove () {
    if (this.y + this.height >= graphicSystem.CANVAS_HEIGHT) {
      this.y = graphicSystem.CANVAS_HEIGHT - this.height
    } else {
      this.y += 10
    }

    super.processMove()
  }
}

class IntruderEnemyDaseok extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.daseok)
    this.setEnemyByCpStat(500, 33, IntruderEnemy.DIV_SCORE)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderDaseok, new CustomEffect(imageSrc.enemyDie.enemyDieIntruder, imageDataInfo.enemyDieIntruder.enemyDieIntruderDaseok, this.width, this.height, 3))
    this.setMoveSpeed(0, 0) // 이동하지 않음

    this.STATE_YELLOW = 'yellow'
    this.STATE_GREEN = 'green'
    this.STATE_ENERGY = 'energy'
    this.setIntruderDelay(40, 240)

    // 이것은 첫번째 공격을 더 빨리 시도하기 위해서입니다.
    this.attackDelay.count = this.attackDelay.delay - 120
  }

  static LaserYellowBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.leverLaser, 6, 0, -12)
    }
  }

  static LaserGreenBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.flyingGreenLaser, 4, 0, 0)
    }
    
    afterInit () {
      let player = fieldState.getPlayerObject()
      let speedX = (player.x - this.x) / 65
      let speedY = (player.y - this.y) / 65
      const minSpeed = 4
      if (Math.abs(speedX) < minSpeed && Math.abs(speedY) < minSpeed) {
        // speedX와 speedY의 값을 비교하여 가장 높은 값을 최소 속도에 맞춰지도록 조정합니다.
        let mul = Math.abs(speedX) < Math.abs(speedY) ? minSpeed / Math.abs(speedY) : minSpeed / Math.abs(speedX)
        speedX *= mul
        speedY *= mul
      }

      const atangent = Math.atan2(speedY, speedX)
      this.degree = atangent * (180 / Math.PI)

      this.moveSpeedX = speedX
      this.moveSpeedY = speedY
    }
  }

  static EnergyBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.energyBolt, 6, Math.random() * 6 - 3, Math.random() * -4)
    }
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let random = Math.floor(Math.random() * 3)
      switch (random) {
        case 0: this.state = this.STATE_YELLOW; break
        case 1: this.state = this.STATE_GREEN; break
        case 2: this.state = this.STATE_ENERGY; break
      }
    }

    if (this.state === this.STATE_YELLOW && this.attackDelay.divCheck(6) && this.attackDelay.count <= 60) {
      let bullet = new IntruderEnemyDaseok.LaserYellowBullet()
      fieldState.createEnemyBulletObject(bullet, this.x + (Math.random() * this.width), this.y)
      soundSystem.play(soundSrc.enemyAttack.intruderDaseokLaserYellow)
    } else if (this.state === this.STATE_GREEN && this.attackDelay.divCheck(6) && this.attackDelay.count <= 60) {
      let bullet = new IntruderEnemyDaseok.LaserGreenBullet()
      fieldState.createEnemyBulletObject(bullet, this.centerX, this.y)
      soundSystem.play(soundSrc.enemyAttack.intruderDaseokLaserGreen)
    } else if (this.state === this.STATE_ENERGY && this.attackDelay.divCheck(6) && this.attackDelay.count <= 60) {
      let bullet = new IntruderEnemyDaseok.EnergyBullet()
      fieldState.createEnemyBulletObject(bullet, this.centerX, this.y)
      soundSystem.play(soundSrc.enemyAttack.intruderJemuEnergyHigh)
    }
  }

  processMove () {
    if (this.y + this.height >= graphicSystem.CANVAS_HEIGHT) {
      this.y = graphicSystem.CANVAS_HEIGHT - this.height
    } else {
      this.y += 10
    }

    super.processMove()
  }
}

class IntruderEnemyNextEnemy extends IntruderEnemy {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.nextEnemy)
    this.setEnemyByCpStat(50, 20, IntruderEnemy.DIV_SCORE)
    this.isPossibleExit = false
    this.setMoveSpeed(0, 4)
    this.setMoveDirection()
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderFlyingRocket, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareRed, this.height, this.height, 2))
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = new IntruderEnemyNextEnemy.LaserBullet()
      fieldState.createEnemyBulletObject(bullet, this.x, this.y)
    }
  }

  static LaserBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemyEffect.intruder, imageDataInfo.intruderEnemyEffect.flyingGreenLaser, 3, -10, 0)
    }
  }
}


/**
 * 테스트용 적 (적의 형태를 만들기 전 테스트 용도로 사용하는 테스트용 적)
 */
class TestEnemy extends DonggramiEnemyA2Brick {
  constructor () {
    super()
    this.setEnemyStat(1000000, 10, 0)
  }
}


/** @type {Map<number, FieldData | EnemyData | any>} */
export const dataExportEnemy = new Map()

// testEnemy
dataExportEnemy.set(ID.enemy.test, TestEnemy)

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

// donggramiEnemy
dataExportEnemy.set(ID.enemy.donggramiEnemy.miniBlue, DonggramiEnemyMiniBlue)
dataExportEnemy.set(ID.enemy.donggramiEnemy.miniGreen, DonggramiEnemyMiniGreen)
dataExportEnemy.set(ID.enemy.donggramiEnemy.miniRed, DonggramiEnemyMiniRed)
dataExportEnemy.set(ID.enemy.donggramiEnemy.miniPurple, DonggramiEnemyMiniPurple)
dataExportEnemy.set(ID.enemy.donggramiEnemy.mini, DonggramiEnemyMini)
dataExportEnemy.set(ID.enemy.donggramiEnemy.miniArchomatic, DonggramiEnemyMiniAchromatic)
dataExportEnemy.set(ID.enemy.donggramiEnemy.exclamationMark, DonggramiEnemyExclamationMark)
dataExportEnemy.set(ID.enemy.donggramiEnemy.questionMark, DonggramiEnemyQuestionMark)
dataExportEnemy.set(ID.enemy.donggramiEnemy.emoji, DonggramiEnemyEmojiMini)
dataExportEnemy.set(ID.enemy.donggramiEnemy.normal, DonggramiEnemyNormal)
dataExportEnemy.set(ID.enemy.donggramiEnemy.strong, DonggramiEnemyStrong)
dataExportEnemy.set(ID.enemy.donggramiEnemy.talk, DonggramiEnemyTalk)
dataExportEnemy.set(ID.enemy.donggramiEnemy.talkShopping, DonggramiEnemyTalkShopping)
dataExportEnemy.set(ID.enemy.donggramiEnemy.bossBig1, DonggramiEnemyBossBig1)
dataExportEnemy.set(ID.enemy.donggramiEnemy.bossBig2, DonggramiEnemyBossBig2)
dataExportEnemy.set(ID.enemy.donggramiEnemy.bounce, DonggramiEnemyBounce)
dataExportEnemy.set(ID.enemy.donggramiEnemy.speed, DonggramiEnemySpeed)

// donggramiEnemy / round 2-3 only
dataExportEnemy.set(ID.enemy.donggramiEnemy.a1_fighter, DonggramiEnemyA1Fighter)
dataExportEnemy.set(ID.enemy.donggramiEnemy.b1_bounce, DonggramiEnemyB1Bounce)
dataExportEnemy.set(ID.enemy.donggramiEnemy.a2_brick, DonggramiEnemyA2Brick)
dataExportEnemy.set(ID.enemy.donggramiEnemy.a2_bomb, DonggramiEnemyA2Bomb)
dataExportEnemy.set(ID.enemy.donggramiEnemy.b2_mini, DonggramiEnemyB2Mini)
dataExportEnemy.set(ID.enemy.donggramiEnemy.a3_collector, DonggramiEnemyA3Collector)
dataExportEnemy.set(ID.enemy.donggramiEnemy.b3_mini, DonggramiEnemyB3Mini)

// donggramiEnemy / round 2-4 add
dataExportEnemy.set(ID.enemy.donggramiEnemy.fruit, DonggramiEnemyFruit)
dataExportEnemy.set(ID.enemy.donggramiEnemy.juice, DonggramiEnemyJuice)
dataExportEnemy.set(ID.enemy.donggramiEnemy.party, DonggramiEnemyParty)
dataExportEnemy.set(ID.enemy.donggramiEnemy.tree, DonggramiEnemyTree)
dataExportEnemy.set(ID.enemy.donggramiEnemy.leaf, DonggramiEnemyLeaf)
dataExportEnemy.set(ID.enemy.donggramiEnemy.talkRunawayR2_4, DonggramiEnemyTalkRunAwayR2_4)
dataExportEnemy.set(ID.enemy.donggramiEnemy.talkParty, DonggramiEnemyTalkParty)
dataExportEnemy.set(ID.enemy.donggramiEnemy.talkRuinR2_6, DonggramiEnemyTalkRuinR2_6)

// intruderEnemy / round 2-4 boss, round 2-5, round 2-6
dataExportEnemy.set(ID.enemy.intruder.jemuBoss, IntruderEnemyJemuBoss)
dataExportEnemy.set(ID.enemy.intruder.square, IntruderEnemySquare)
dataExportEnemy.set(ID.enemy.intruder.metal, IntruderEnemyMetal)
dataExportEnemy.set(ID.enemy.intruder.diacore, IntruderEnemyDiacore)
dataExportEnemy.set(ID.enemy.intruder.rendown, IntruderEnemyRendown)
dataExportEnemy.set(ID.enemy.intruder.lever, IntruderEnemyLever)
dataExportEnemy.set(ID.enemy.intruder.flying1, IntruderEnemyFlying1)
dataExportEnemy.set(ID.enemy.intruder.flying2, IntruderEnemyFlying2)
dataExportEnemy.set(ID.enemy.intruder.flyingRocket, IntruderEnemyFlyingRocket)
dataExportEnemy.set(ID.enemy.intruder.gami, IntruderEnemyGami)
dataExportEnemy.set(ID.enemy.intruder.momi, IntruderEnemyMomi)
dataExportEnemy.set(ID.enemy.intruder.hanoi, IntruderEnemyHanoi)
dataExportEnemy.set(ID.enemy.intruder.daseok, IntruderEnemyDaseok)
dataExportEnemy.set(ID.enemy.intruder.nextEnemy, IntruderEnemyNextEnemy)