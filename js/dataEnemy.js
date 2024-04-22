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
  /**
   * 적의 충돌 영역 (이 값이 없다면 내부적으로 기본값으로 처리합니다.)
   * @typedef CollisionAreaData
   * @property {number} x x좌표
   * @property {number} y y좌표
   * @property {number} width 너비
   * @property {number} height 높이
   * @property {number} degree 각도 (0 ~ 360)
   */

  constructor () {
    super()
    /**
     * 점수 공식에 대해: 미정 (일단, 적 체력의 1% 인데 이게 확실한것이 아님)
     * 다만 일부 적들은 다를 수 있음. 그건 각 적의 설명을 참고하세요.
     */
    this.score = 100
    this.isAfterInited = false

    this.moveDirectionX = 'left'

    /** 죽었는지 체크 */ this.isDied = false
    /**
     * 죽은 후 삭제되기까지의 지연시간
     * @type {DelayData | null}
     */
    this.dieAfterDeleteDelay = null

    /**
     * 충돌 지연시간
     * (참고: 기본적으로는 적이 플레이어에 닿았다면 60프레임 이후 다시 플레이어를 타격할 수 있습니다.)
     * 
     * 그러나 이 값이 적마다 다를 수 있습니다.
     * 
     * 참고로, 이 딜레이를 채우기 전까지 적은 플레이어랑 충돌하지 않습니다. 그래서 적이 등장하자마자 공격당하는것은 불가능합니다.
     * @type {DelayData}
     */
    this.collisionDelay = new DelayData(60)
    this.collisionDelay.count = 0 // 생성되자마자 충돌을 막기 위해서 지연시간 카운트를 0부터 계산합니다.

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
    this._baseCp = 40000

    /**
     * 적을 죽였을 때 얻는 점수의 비중을 조절하는 변수 (단 setEnemyByCpStat을 사용한 경우에만 이 값에 영향을 받음)
     * 
     * 점수 공식: hp / baseDivScore
     * 
     * 예시: hp 10000 / baseDivScore 100 -> 해당 적을 죽이면 10000 / 100 = 100점의 점수를 얻음 
     */
    this.baseDivScore = 100
  }

  /**
   * 적의 충돌 영역을 얻습니다. (충돌 영역은 여러개일 수도 있습니다.)
   * 
   * 만약 상속받아야 하는 경우, getCollisionAreaCalcurationObject 함수를 사용해서 충돌 영역을 계산해주세요.
   * 임의로 설정하는 경우, 확대/축소 했을 때 충돌영역이 잘못된 계산을 할 수 있습니다.
   * 
   * @returns {CollisionAreaData[]}
   */
  getCollisionArea () {
    return [{
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      degree: this.degree
    }]

    // 이 함수는 아래 코드랑 동일
    // return [this.getCollisionAreaCalcurationObject()]
  }

  /**
   * 충돌 영역 추가 계산 함수 (확대/축소에 대한 대응을 하기 위해 만들어졌습니다.)
   * 
   * 이미지 데이터를 기준으로 크기를 계산합니다. 절대로 imageDataClipWidth 같은 부분에 this.width, this.height값을 적용하지 마세요.
   * 이 경우, 잘못된 데이터 출력이 될 수 있습니다.
   * 
   * @param {number} [plusX=0] 이미지를 기준으로 벗어난 x좌표 (원본 크기 기준, 확대 축소를 무시하고 값을 입력해야 합니다. 기본값 0)
   * @param {number} [plusY=0] 이미지를 기준으로 벗어난 y좌표 (원본 크기 기준, 확대 축소를 무시하고 값을 입력해야 합니다. 기본값 0)
   * @param {number} [imageDataClipWidth] 이미지 데이터에 있는 크기 중 일부에 대한 너비
   * @param {number} [imageDataClipHeight] 이미지 데이터에 있는 크기 중 일부에 대한 높이
   * 
   * @returns {CollisionAreaData}
   */
  getCollisionAreaCalcurationObject (plusX = 0, plusY = 0, imageDataClipWidth = this.imageData.width, imageDataClipHeight = this.imageData.height) {
    let mulX = this.width / this.imageData.width
    let mulY = this.height / this.imageData.height
    let plusXFinal = mulX === 0 ? plusX : Math.floor(plusX * mulX)
    let plusYFinal = mulY === 0 ? plusY : Math.floor(plusY * mulY)
    let currentX = this.x + plusXFinal
    let currentY = this.y + plusYFinal
    let currentWidth = mulX === 0 ? imageDataClipWidth : Math.floor(imageDataClipWidth * mulX)
    let currentHeight = mulY === 0 ? imageDataClipHeight : Math.floor(imageDataClipHeight * mulY)

    if (this.flip === 1) {
      currentX = this.x + this.width - plusXFinal - currentWidth
    } else if (this.flip === 2) {
      currentY = this.y + this.height - plusYFinal - currentHeight
    } else if (this.flip === 3) {
      currentX = this.x + this.width - plusXFinal - currentWidth
      currentY = this.y + this.height - plusYFinal - currentHeight
    }

    return {
      x: currentX,
      y: currentY,
      width: currentWidth,
      height: currentHeight,
      degree: this.degree
    }
  }

  /**
   * 적의 스탯을 설정합니다. (수동 방식)
   * 
   * 이 함수는, 가급적이라면, 적의 스탯을 수동으로 지정해야 할 때만 사용해주세요.
   * setEnemyByCpStat함수 사용을 권장합니다.
   * @param {number} hp 체력
   * @param {number} score 점수 (기본적으로 체력 100당 1점입니다.)
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
  setEnemyByCpStat (hpPercent = 10, attack = 0, hpDivScore = this.baseDivScore) {
    let hpValue = Math.floor((this._baseCp * hpPercent) / 100)
    let scoreValue = Math.floor(hpValue / hpDivScore)

    this.hp = hpValue
    this.hpMax = hpValue
    this.score = scoreValue
    this.attack = attack
  }

  /**
   * 적 죽음 사운드와 적 죽음 이펙트를 설정합니다. 이펙트는 반드시 CustomEffectData 클래스로 생성해야 합니다.
   * 
   * 이 함수가 쓰여야 할지 말지 아직 모르겠습니다. 현재는 레거시 용도로 남겨두었습니다. (round 2이전의 적들이 이 함수를 사용함)
   * 
   * @deprecated
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

  /** 
   * 죽음의 이펙트를 더 간편하게 설정하기 위해 만든 함수
   * 
   * 이펙트 이미지와 이미지데이터를 넣으면 (이 함수를 사용한)현재 오브젝트 크기에 맞게 dieEffect를 추가적으로 수정합니다.
   * 
   * @param {string} [dieSoundSrc=''] 사운드 경로
   * @param {string} [targetImageSrc=''] 죽음 이펙트가 있는 이미지 파일의 경로
   * @param {ImageDataObject | null} [targetImageData=null] 죽음 이펙트가 있는 이미지데이터
   * @param {number} [dieEnimatinoDelay=2] 죽음 이펙트가 다음 프레임을 재생하기까지의 딜레이
  */
  setDieEffectTemplet (dieSoundSrc = '', targetImageSrc = '', targetImageData = null, dieEnimatinoDelay = 2) {
    this.dieSound = dieSoundSrc
    
    if (targetImageSrc !== '' && targetImageData != null) {
      this.dieEffect = new CustomEffect(targetImageSrc, targetImageData, this.width, this.height, dieEnimatinoDelay)
    }
  }

  process () {
    super.process()
    this.afterInitProcess()

    // 적이 죽지 않았을 때 적과 관련된 행동 처리
    if (!this.isDied) {
      this.isMoveEnable = true
      this.isAttackEnable = true
      this.processPossibleExit()
      this.processExitToReset()
      this.processPlayerCollision()
    } else {
      // 적이 죽었다면 이동할 수 없습니다. 공격할 수도 없습니다.
      this.isMoveEnable = false
      this.isAttackEnable = false
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
   * 이 함수의 내용은 비어있습니다. super.processAttack의 호출은 필수가 아니지만, 관습적으로 호출해도 상관없습니다.
   * 
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
   * 
   * 이 함수의 상속을 권장하진 않습니다. (충돌 규칙이 변화할 가능성이 없기 때문)
   */
  processPlayerCollision () {
    if (this.attack === 0) return // 공격력이 0인경우 충돌검사를 할 필요가 없음

    if (this.collisionDelay.check(false)) {
      const player = fieldState.getPlayerObject()
      const enemyArea = this.getCollisionArea() // 적은 따로 충돌 영역을 얻습니다.

      for (let i = 0; i < enemyArea.length; i++) {
        if (this.degree === 0 && collision(enemyArea[i], player)
         || this.degree !== 0 && collisionClass.collisionOBB(enemyArea[i], player)) {
          player.addDamage(this.attack)
          this.collisionDelay.count = 0 // 플레이어랑 충돌하면 충돌 딜레이카운트를 0으로 만듬
          this.processPlayerCollisionSuccessAfter() // 충돌 성공 이후 로직 처리
          break // 루프 종료 (여러 충돌객체중 하나만 충돌해야함, 중복 데미지 없음)
        }
      }

    }
  }

  /** 
   * 플레이어와의 충돌이 성공한 이후에 로직 진행 
   * 
   * 만약 충돌했을 때 효과음을 출력하거나 다른걸 해야한다면, 이 함수를 이용하여 추가적인 작업을 할 수 있습니다.
   */
  processPlayerCollisionSuccessAfter () {}

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
   * 경고: 이 함수를 재작성하면, isDied로 죽었는지 확인해야합니다.
   * 그리고, super.processDieAfter를 사용하지 않는다면 해당 적 객체가 영원히 삭제되지 못할 수 있습니다.
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

  fieldBaseSaveData () {
    let saveData = super.fieldBaseSaveData()
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
    /** 
     * 총알 타격 반복 횟수, 이 값이 0이되면 해당 총알은 삭제
     * 무한대로 타격을 원한다면 임의의 높은 숫자값을 넣어주세요.
     */ 
    this.repeatCount = 1

    // 충돌 딜레이
    this.collisionDelay = new DelayData(60)
    this.collisionDelay.setCountMax()

    /** 
     * 현재 충돌된 여부 
     * 
     * processCollision 함수를 사용한 후에, 이 변수를 확인하면, 충돌되었는지를 확인하여
     * 다른 작업을 처리할 수 있습니다.
     */ 
    this.isCurrentCollision = false

    /** 최대 가동하는 프레임 수 (이 프레임을 초과하면 해당 객체는 자동으로 삭제됩니다.) */
    this.maxRunningFrame = 600
  }

  process () {
    super.process()
    this.processCollision()

    if (this.outAreaCheck()) {
      this.isDeleted = true
    }

    if (this.elapsedFrame >= this.maxRunningFrame) {
      this.isDeleted = true
    }
  }

  /** 이 함수의 내용은 EnemyData랑 거의 동일함 */
  processCollision () {
    this.isCurrentCollision = false
    if (this.attack === 0) return

    if (this.collisionDelay.check(false)) {
      const player = fieldState.getPlayerObject()
      const enemyArea = this.getCollisionArea()

      for (let i = 0; i < enemyArea.length; i++) {
        if (this.degree === 0 && collision(enemyArea[i], player)
         || this.degree !== 0 && collisionClass.collisionOBB(enemyArea[i], player)) {
          this.repeatCount--
          player.addDamage(this.attack)
          this.collisionDelay.countReset()
          this.isCurrentCollision = true
          break // 루프 종료 (여러 충돌객체중 하나만 충돌해야함, 중복 데미지 없음)
        }
      }

    }

    if (this.repeatCount <= 0) {
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

  /** 이동속도를 기준으로 자동으로 회전각도를 조정합니다. */
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

  /**
   * 이 함수는 EnemyData에서 복사됨
   * 
   * 적의 충돌 영역을 얻습니다. (충돌 영역은 여러개일 수도 있습니다.)
   * 
   * 만약 상속받아야 하는 경우, getCollisionAreaCalcurationObject 함수를 사용해서 충돌 영역을 계산해주세요.
   * 임의로 설정하는 경우, 확대/축소 했을 때 충돌영역이 잘못된 계산을 할 수 있습니다.
   * 
   * @returns {CollisionAreaData[]}
   */
  getCollisionArea () {
    return [{
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      degree: this.degree
    }]

    // 이 함수는 아래 코드랑 동일
    // return [this.getCollisionAreaCalcurationObject()]
  }

  /**
   * 이 함수는 EnemyData에서 복사됨
   * 
   * 충돌 영역 추가 계산 함수 (확대/축소에 대한 대응을 하기 위해 만들어졌습니다.)
   * 
   * 이미지 데이터를 기준으로 크기를 계산합니다. 절대로 imageDataClipWidth 같은 부분에 this.width, this.height값을 적용하지 마세요.
   * 이 경우, 잘못된 데이터 출력이 될 수 있습니다.
   * 
   * @param {number} [plusX=0] 이미지를 기준으로 벗어난 x좌표 (원본 크기 기준, 확대 축소를 무시하고 값을 입력해야 합니다. 기본값 0)
   * @param {number} [plusY=0] 이미지를 기준으로 벗어난 y좌표 (원본 크기 기준, 확대 축소를 무시하고 값을 입력해야 합니다. 기본값 0)
   * @param {number} [imageDataClipWidth] 이미지 데이터에 있는 크기 중 일부에 대한 너비
   * @param {number} [imageDataClipHeight] 이미지 데이터에 있는 크기 중 일부에 대한 높이
   * 
   * @returns {CollisionAreaData}
   */
  getCollisionAreaCalcurationObject (plusX = 0, plusY = 0, imageDataClipWidth = this.imageData.width, imageDataClipHeight = this.imageData.height) {
    let mulX = this.width / this.imageData.width
    let mulY = this.height / this.imageData.height
    let plusXFinal = mulX === 0 ? plusX : Math.floor(plusX * mulX)
    let plusYFinal = mulY === 0 ? plusY : Math.floor(plusY * mulY)
    let currentX = this.x + plusXFinal
    let currentY = this.y + plusYFinal
    let currentWidth = mulX === 0 ? imageDataClipWidth : Math.floor(imageDataClipWidth * mulX)
    let currentHeight = mulY === 0 ? imageDataClipHeight : Math.floor(imageDataClipHeight * mulY)

    if (this.flip === 1) {
      currentX = this.x + this.width - plusXFinal - currentWidth
    } else if (this.flip === 2) {
      currentY = this.y + this.height - plusYFinal - currentHeight
    } else if (this.flip === 3) {
      currentX = this.x + this.width - plusXFinal - currentWidth
      currentY = this.y + this.height - plusYFinal - currentHeight
    }

    return {
      x: currentX,
      y: currentY,
      width: currentWidth,
      height: currentHeight,
      degree: this.degree
    }
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
   * @param {ImageDataObject} imageData 
   */
  constructor (imageSrc = '', imageData = imageDataInfo.default.unused, attack = 0, moveSpeedX = 0, moveSpeedY = 0, moveDirectionX = '', moveDirectionY = '') {
    super()
    this.setAutoImageData(imageSrc, imageData)
    this.attack = attack
    this.setMoveDirection(moveDirectionX, moveDirectionY)
    this.setMoveSpeed(moveSpeedX, moveSpeedY)
  }

  /**
   * 해당 함수는 현재 데이터를 바탕으로 CustomEnemyBullet을 생성하지만
   * 상속이 되지 않은 채로 불릿이 생성되므로, 불릿 자체의 특수기능같은것이 있다면
   * 이 함수를 사용하지 말고, 대신 new 를 이용해 객체를 생성해야 합니다.
   * 
   * 그러나 아직 일부 적들은 이 함수를 사용하기 때문에 완전한 deprecated는 아닙니다.
   * @deprecated
  */
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
    this._baseCp = 40000
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
      if (this.enimation == null) return

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
      if (this.dieEffect) {
        fieldState.createEffectObject(this.dieEffect, this.x + 40, this.y)
        fieldState.createEffectObject(this.dieEffect, this.x + 80, this.y)
      }
    }
  }
}

class SpaceEnemyGamjigi extends SpaceEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.spaceEnemy, imageDataInfo.spaceEnemy.gamjigi)
    this.setEnemyByCpStat(20, 12)
    this.setMoveDirection()
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceGamjigi, new CustomEffect(imageSrc.enemy.spaceEnemy, imageDataInfo.spaceEnemy.enemyDieGamjigi, this.width, this.height, 3))
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
      if (this.dieEffect != null) {
        let changeEffect = fieldState.createEffectObject(this.dieEffect, this.x, this.y)
        if (changeEffect && changeEffect.enimation) changeEffect.enimation.degree = this.degree
        this.dieEffect = null
      }

      // 죽음 이펙트 중복 출력을 막기 위해, 현재 죽음 이펙트를 삭제하고, 임시 변수에 이동시킵니다.
      this.processDieDefault()
    }
  }

  display () {
    if (this.imageSrc && this.imageData) {
      graphicSystem.imageDisplay(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height, 0, this.degree)
    }
  }
}

class SpaceEnemyComet extends SpaceEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.spaceEnemy, imageDataInfo.spaceEnemy.comet, 2)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieSpaceComet, new CustomEffect(imageSrc.enemy.spaceEnemy, imageDataInfo.spaceEnemy.enemyDieComet, this.width, this.height, 4))
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
      imageDataInfo.meteoriteEnemy.enemyDieMeteorite1,
      imageDataInfo.meteoriteEnemy.enemyDieMeteorite2,
      imageDataInfo.meteoriteEnemy.enemyDieMeteorite3,
      imageDataInfo.meteoriteEnemy.enemyDieMeteoriteWhite,
      imageDataInfo.meteoriteEnemy.enemyDieMeteoriteBlack,
    ]

    // 운석 번호 설정(운석 번호에 따라 스탯과 이미지가 달라짐)
    let meteoriteNumber = Math.floor(Math.random() * 5)
    
    this.setEnemyStat(hpList[meteoriteNumber], scoreList[meteoriteNumber], attackList[meteoriteNumber])
    this.setAutoImageData(imageSrc.enemy.spaceEnemy, imageDataList[meteoriteNumber])
    this.setDieEffectOption(dieSoundList[meteoriteNumber], new CustomEffect(imageSrc.enemy.meteoriteEnemy, dieEffectImageDataList[meteoriteNumber], this.width, this.height, 4))
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
    this.setEnemyByCpStat(3000, 15)
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

      if (this.dieEffect == null) return
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
    this._baseCp = 40000
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
      imageDataInfo.meteoriteEnemy.enemyDieMeteorite1,
      imageDataInfo.meteoriteEnemy.enemyDieMeteorite2,
      imageDataInfo.meteoriteEnemy.enemyDieMeteorite3
    ]
    
    let imageNumber = Math.floor(Math.random() * imageDataList.length)
    let dieSoundNumber = Math.floor(Math.random() * dieSoundList.length)
    let dieImageNumber = Math.floor(imageNumber / 5)
    
    this.setEnemyByCpStat(4, 5)
    this.setWidthHeight(25, 25)
    this.setAutoImageData(imageSrc.enemy.meteoriteEnemy, imageDataList[imageNumber])
    this.setDieEffectOption(dieSoundList[dieSoundNumber], new CustomEffect(imageSrc.enemy.meteoriteEnemy, dieImageDataList[dieImageNumber], this.width, this.height, 1))
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
    if (this.dieEffect) {
      this.dieEffect.width = this.width
      this.dieEffect.height = this.height
    }
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
    this.setDieEffectOption(dieSoundTable[soundNumber], new CustomEffect(imageSrc.enemy.meteoriteEnemy, imageDataInfo.meteoriteEnemy.enemyDieMeteoriteWhite, this.width, this.height, 1))
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
    this.dieEffect = new CustomEffect(imageSrc.enemy.meteoriteEnemy, imageDataInfo.meteoriteEnemy.enemyDieMeteoriteBlack, this.width, this.height, 4)
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
    if (this.enimation) this.enimation.setOutputSize(this.width, this.height)
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
    this._baseCp = 40000
    this.imageSrc = imageSrc.enemy.jemulEnemy
  }
}

class JemulEnemyRotateRocket extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.rotateRocket, 5)
    this.setEnemyByCpStat(10, 14)
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
    if (this.enimation) this.enimation.degree = this.degree 

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

    this.bulletEffect = new CustomEffect(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.energyBoltAttack, 160, 160, 2)
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
      fieldState.createEffectObject(this.bulletEffect.getObject(), hitArea.x, hitArea.y)
      soundSystem.play(soundSrc.enemyAttack.jemulEnergyBoltAttack)
    }
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

  getCollisionArea () {
    return [this.getCollisionAreaCalcurationObject(0, 40, undefined, 20)]
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let centerX = this.x + (this.width / 2)
      let centerY = this.y + (this.height / 2)
      let moveDirectionX = [FieldData.direction.LEFT, FieldData.direction.LEFT, FieldData.direction.RIGHT, FieldData.direction.RIGHT]
      let moveDirectionY = [FieldData.direction.UP, FieldData.direction.DOWN, FieldData.direction.UP, FieldData.direction.DOWN]
      for (let i = 0; i < 4; i++) {
        let enemyBullet = new CustomEnemyBullet(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.jemulEnemyHellSpike, 10, 3, 3, moveDirectionX[i], moveDirectionY[i])
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

  getCollisionArea () {
    if (this.state === 'front') {
      return [
        this.getCollisionAreaCalcurationObject(0, 17, 110, 28),
        this.getCollisionAreaCalcurationObject(71, 0, 39, 17)
      ]
    } else if (this.state === 'up') {
      return [
        this.getCollisionAreaCalcurationObject(0, 6, 110, 28),
      ]
    } else {
      return [
        this.getCollisionAreaCalcurationObject(0, 33, 53, 12),
        this.getCollisionAreaCalcurationObject(17, 19, 93, 18),
        this.getCollisionAreaCalcurationObject(79, 0, 25, 18),
      ]
    }
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
      if (this.enimation) this.enimation.flip = 1
      this.enimationUp.flip = 1
      this.enimationDown.flip = 1
    } else {
      if (this.enimation) this.enimation.flip = 0
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
      let enemyBullet = new CustomEnemyBullet(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.jemulEnemyShip, 15, 4, 0, FieldData.direction.LEFT)
      fieldState.createEnemyBulletObject(enemyBullet, this.x, this.y)
    }
  }

  processEnimation () {
    if (this.enimation != null || this.enimationUp != null || this.enimationDown != null) {
      if (this.enimation) this.enimation.process()
      this.enimationUp.process()
      this.enimationDown.process()
    }
  }

  display () {
    // 이동 상태에 따라 출력 이미지 변경
    if (this.moveSpeedY === 0) {
      if (this.enimation) this.enimation.display(this.x, this.y)
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

  getCollisionArea () {
    if (this.state === 'front') {
      return [
        this.getCollisionAreaCalcurationObject(0, 40, undefined, 20),
        this.getCollisionAreaCalcurationObject(40, 0, 32, 100)
      ]
    } else if (this.state === 'up') {
      return [
        this.getCollisionAreaCalcurationObject(0, 15, 66, 31),
        this.getCollisionAreaCalcurationObject(34, 46, 18, 48),
        this.getCollisionAreaCalcurationObject(42, 0, 43, 80),
        this.getCollisionAreaCalcurationObject(78, 35, 37, 47),
      ]
    } else {
      return [
        this.getCollisionAreaCalcurationObject(34, 0, 17, 50),
        this.getCollisionAreaCalcurationObject(0, 46, 57, 40),
        this.getCollisionAreaCalcurationObject(41, 61, 41, 33),
        this.getCollisionAreaCalcurationObject(78, 13, 47, 36),
      ]
    }
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
      if (this.enimation) this.enimation.flip = 1
      this.enimationUp.flip = 1
      this.enimationDown.flip = 1
    } else {
      if (this.enimation) this.enimation.flip = 0
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
    if (this.enimation) this.enimation.process()
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
        let enemyBullet = new CustomEnemyBullet(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.jemulEnemyAir, 6, bulletSpeedX, speedYList[i])
        fieldState.createEnemyBulletObject(enemyBullet, this.x, insertY[i])
      }
    }
  }

  display () {
    // 이동 상태에 따라 출력 이미지 변경
    if (this.state === 'front') {
      if (this.enimation) this.enimation.display(this.x, this.y)
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
    this.setEnemyByCpStat(2000, 15)
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
      this.getCollisionAreaCalcurationObject(0, 10, undefined, 80),
      this.getCollisionAreaCalcurationObject(20, 5, 80, 90),
      this.getCollisionAreaCalcurationObject(34, 0, 47, 100),
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

    let enemyBullet = new CustomEnemyBullet(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.jemulEnemyShip, 20, bulletSpeedX, bulletSpeedY, '', '')
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
      graphicSystem.gradientRect(this.laserObject1.x, this.laserObject1.y, this.laserObject1.width, this.laserObject1.height, ['#ff9090', '#ff9090', '#ff3030'])
      graphicSystem.gradientRect(this.laserObject2.x, this.laserObject2.y, this.laserObject2.width, this.laserObject2.height, ['#ff9090', '#ff9090', '#ff3030'])
      graphicSystem.setAlpha(1)
    } else if (this.state === this.STATE_ROTATE_LASER) {
      graphicSystem.setAlpha(0.6)
      graphicSystem.setDegree(this.laserObjectR.degree)
      graphicSystem.gradientRect(this.laserObjectR.x, this.laserObjectR.y, this.laserObjectR.width, this.laserObjectR.height, ['#d61d1d', '#d61d1d', '#5e0000'])
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
    if (this.enimation) this.enimation.frameCount = this.ENIMATION_NORMAL_FRAME

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

  requestDie () {
    // this.state = this.STATE_DIE
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
      if (this.enimation != null) {
        // 에니메이션을 마지막프레임으로 고정
        this.enimation.frameCount = 7
        this.enimation.elapsedFrame = this.ENIMATION_MAX_FRAME - 1
        this.enimation.finished = true
      }
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

    // 간접적인 전달을 위한 메세지 처리
    if (this.message === this.STATE_STOP) {
      this.state = this.STATE_STOP
    } else if (this.message === this.STATE_DIE) {
      this.state = this.STATE_DIE
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

      graphicSystem.gradientRect(laser.x, laser.y, laser.width, laser.height, [laser.sideColor, laser.sideColor, laser.middleColor])
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
    this.setEnemyByCpStat(40, 18)
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
    if (this.enimation) this.enimation.flip = this.moveDirectionX === 'right' ? 1 : 0

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

      let enemyBullet = new CustomEnemyBullet(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.jemulEnemyAir, 6, bulletSpeedX, 0)
      fieldState.createEnemyBulletObject(enemyBullet, bulletX, this.y + (this.height / 4 * 1))
    }

    // attackDelay.check를 안하기 때문에 카운터를 수동으로 증가시켜야 합니다.
    this.attackDelay.check()
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 31, undefined, 20),
      this.getCollisionAreaCalcurationObject(40, 0, 20, 91),
      this.getCollisionAreaCalcurationObject(58, 0, 23, 22),
      this.getCollisionAreaCalcurationObject(86, 18, 26, 36),
    ]
  }
}

class JemulEnemyRedShip extends JemulEnemyData {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.jemulEnemy.redShip)
    this.setEnemyByCpStat(41, 19)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieJemulRedAir, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireRed, this.width, this.height, 2))
    this.setRandomMoveSpeed(2, 2)
    this.moveDelay = new DelayData(240)
    this.attackDelay = new DelayData(60)
    this.isExitToReset = true
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 22, 110, 22),
      this.getCollisionAreaCalcurationObject(43, 14, 67, 8),
      this.getCollisionAreaCalcurationObject(78, 2, 30, 13),
    ]
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
    if (this.enimation) this.enimation.flip = this.moveDirectionX === 'right' ? 1 : 0

    super.processMove()
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let enemyBullet1 = new CustomEnemyBullet(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.jemulEnemyShip, 10, 9, 0, 'left')
      let enemyBullet2 = new CustomEnemyBullet(imageSrc.enemy.jemulEnemy, imageDataInfo.jemulEnemy.jemulEnemyShip, 10, 9, 0, 'right')
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
    this._baseCp = 50000
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
      case DonggramiEnemy.EmojiList.SMILE: return imageDataInfo.donggramiEnemy.EmojiSmile
      case DonggramiEnemy.EmojiList.HAPPY: return imageDataInfo.donggramiEnemy.EmojiHappy
      case DonggramiEnemy.EmojiList.HAPPYSAD: return imageDataInfo.donggramiEnemy.EmojiHappySad
      case DonggramiEnemy.EmojiList.AMAZE: return imageDataInfo.donggramiEnemy.EmojiAmaze
      case DonggramiEnemy.EmojiList.FROWN: return imageDataInfo.donggramiEnemy.EmojiFrown
      case DonggramiEnemy.EmojiList.THINKING: return imageDataInfo.donggramiEnemy.EmojiThinking
      case DonggramiEnemy.EmojiList.NOTHING: return null
      case DonggramiEnemy.EmojiList.SAD: return imageDataInfo.donggramiEnemy.EmojiSad
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
  static exclamationMarkEffect = new CustomEffect(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.exclamationMark, 40, 40, 5, 2)

  /** 느낌표 이펙트 짧게 표시용 */
  static exclamationMarkEffectShort = new CustomEffect(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.exclamationMark, 40, 40, 3, 1)

  /** 물음표 이펙트 데이터 */
  static questionMarkEffect = new CustomEffect(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.questionMark, 40, 40, 5, 12)

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
  
        // 어떤 적에게 던질 것에 대한 무작위 인덱스 지정 
        // 인덱스 범위에 1을 추가하는것은 플레이어도 대상에 포함되기 때문, 맨 마지막보다 1이 높으면 그것은 플레이어가 대상임
        let randomIndex = Math.floor(Math.random() * (enemyObject.length + 1))

        // 메모리 누수 방지를 위한, targetObject null 처리 후 다시 객체를 대입
        if (this.targetObject != null) this.targetObject = null

        // 타겟 오브젝트 지정
        this.targetObject = randomIndex < enemyObject.length ? enemyObject[randomIndex] : fieldState.getPlayerObject()
  
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
        imageSrc.enemy.donggramiEnemy, 
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

    const fontSize = graphicSystem.getCanvasFontSize()
    const padding = 10

    // 텍스트는 한 줄에 10글자까지 출력 가능합니다. 그래서 10글자가 넘는다면, 1줄씩 증가합니다.
    // 만약 글자가 2줄을 초과한다면, 스피치버블(말풍선)의 높이가 증가합니다.
    const textMaxLength = this.currentTalk.length
    const outputText = []
    const maxLoop = Math.floor(textMaxLength / 10) + 1
    for (let i = 0; i < maxLoop; i++) {
      outputText.push(this.currentTalk.slice(i * 10, (i + 1) * 10))
    }
    
    const imageData = imageDataInfo.donggramiEnemy.speechBubble
    const imageDataTale = imageDataInfo.donggramiEnemy.speechBubbleTale
    const bubbleSize = maxLoop < 2 ? imageData.height : (maxLoop * 20) + 20

    // 스피치버블의 출력 위치는, 위쪽에 출력하면서 동시에 오브젝트에 겹치지 않아야 합니다.
    // 그래서 예상 크기만큼을 y축에서 뺍니다.
    const speechBubbleY = this.y - imageDataTale.height - bubbleSize

    game.graphic.imageDisplay(imageSrc.enemy.donggramiEnemy, imageDataTale.x, imageDataTale.y, imageDataTale.width, imageDataTale.height, this.x, this.y - imageDataTale.height, imageDataTale.width, imageDataTale.height)
    game.graphic.imageDisplay(imageSrc.enemy.donggramiEnemy, imageData.x, imageData.y, imageData.width, imageData.height, this.x, speechBubbleY, imageData.width, bubbleSize)
    
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
    this.welcomeImageData = imageDataInfo.donggramiEnemy.welcomeText

    this.welcomeDelay = new DelayData(this.BASE_DELAY)

    this.state = ''
    this.STATE_WELCOME = 'w'
    this.STATE_NORMAL = ''
  }

  getCollisionArea () {
    // 구체다 보니, 사각형으로 충돌판정 만들기가 어려움
    // 실제 사이즈도 192x192라 계산도 힘들어 어림짐작한 사이즈로 결정
    return [
      this.getCollisionAreaCalcurationObject(50, 0, 100, 25),
      this.getCollisionAreaCalcurationObject(50, 192 - 25, 100, 25),
      this.getCollisionAreaCalcurationObject(0, 25, 25, 100),
      this.getCollisionAreaCalcurationObject(192 - 25, 25, 25, 100),
      this.getCollisionAreaCalcurationObject(25, 25, 140, 145),
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
    const image = imageSrc.enemy.donggramiEnemy
    game.graphic.imageDisplay(image, imageData.x, imageData.y, imageData.width, imageData.height, this.x, this.y - imageData.height, imageData.width, imageData.height)
  }
}

class DonggramiEnemyBossBig2 extends DonggramiEnemyBossBig1 {
  constructor () {
    super()
    this.setDonggramiColor(DonggramiEnemy.colorGroup.BIG2)
    this.welcomeImageData = imageDataInfo.donggramiEnemy.welcomeMaeulText
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
    let srcB = imageSrc.enemy.donggramiEnemy
    let imageD = imageDataInfo.donggramiEnemy

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
      let hammer = imageDataInfo.donggramiEnemy.toyHammerNoEnimation
      graphicSystem.imageDisplay(imageSrc.enemy.donggramiEnemy, hammer.x, hammer.y, hammer.width, hammer.height, this.hammerObject.x, this.hammerObject.y, this.hammerObject.width, this.hammerObject.height, 0, this.hammerObject.degree)
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
    fruitRed: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.fruitRed),
    fruitGreen: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.fruitGreen),
    fruitOrange: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.fruitOrange),
    fruitPurple: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.fruitPurple),
    juiceCola: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.juiceCola),
    juiceOrange: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.juiceOrange),
    juiceWater: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.juiceWater),
    partyCandle: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.candle),
    partyFirecracker: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.firecracker),
    partyPlate: EnimationData.createEnimation(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.plate),
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
          let candleBullet = new CustomEnemyBullet(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.candleFire, 12, 0, -4)
          fieldState.createEnemyBulletObject(candleBullet, this.objX + 32, this.objY)
        }
        break
    }
  }

  static PlateBullet = class extends CustomEnemyBullet {
    constructor (damage = 6, speedX = Math.random() * 2, speedY = 5) {
      super(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.plateThrow, damage, speedX, speedY)
      this.setWidthHeight(this.width * 2, this.height * 2)
    }

    process () {
      super.process()
      // 접시가 바닥에 닿으면 깨지는 이펙트가 생성되고, 이 오브젝트(접시)는 삭제됨
      // 플레이어랑 부딪힐경우에는 이 오브젝트가 삭제 예정이므로, 이를 이용해서 접시가 깨지는 이펙트를 출력
      if (this.y + this.height >= graphicSystem.CANVAS_HEIGHT || this.isDeleted) {
        let customEffect = new CustomEffect(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.plateBreak, this.width, this.height, 2)
        soundSystem.play(soundSrc.donggrami.plate)
        fieldState.createEffectObject(customEffect, this.x, this.y)
        this.isDeleted = true
      }
    }
  }

  static FirecrackerBullet = class extends CustomEnemyBullet {
    constructor (damage = 6, endPositionX = 0, endPositionY = 0) {
      super(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.firecrackerPrevEffect, damage, 0, 0)
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
        let partyEffect = new CustomEffect(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.firecrackerEffect, 100, 100, 2)
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
      const imgSrc = imageSrc.enemy.donggramiEnemy
      let imgD = imageDataInfo.donggramiEnemy.fruitRed
      switch (this.subType) {
        case this.subTypeList.FRUIT_GREEN: imgD = imageDataInfo.donggramiEnemy.fruitGreen; break
        case this.subTypeList.FRUIT_ORANGE: imgD = imageDataInfo.donggramiEnemy.fruitOrange; break
        case this.subTypeList.FRUIT_PURPLE: imgD = imageDataInfo.donggramiEnemy.fruitPurple; break
        case this.subTypeList.JUICE_COLA: imgD = imageDataInfo.donggramiEnemy.juiceCola; break
        case this.subTypeList.JUICE_ORANGE: imgD = imageDataInfo.donggramiEnemy.juiceOrange; break
        case this.subTypeList.JUICE_WATER: imgD = imageDataInfo.donggramiEnemy.juiceWater; break
        case this.subTypeList.PARTY_CANDLE: imgD = imageDataInfo.donggramiEnemy.candle; break
        case this.subTypeList.PARTY_FIRECRACKER: imgD = imageDataInfo.donggramiEnemy.firecracker; break
        case this.subTypeList.PARTY_PLATE: imgD = imageDataInfo.donggramiEnemy.plate; break
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
  static bulletFruitRed = new CustomEnemyBullet(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.fruitRed, 10, 0, 0)
  static bulletFruitGreen = new CustomEnemyBullet(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.fruitGreen, 10, 0, 0)
  static bulletFruitOrange = new CustomEnemyBullet(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.fruitOrange, 10, 0, 0)
  static bulletFruitPurple = new CustomEnemyBullet(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.fruitPurple, 10, 0, 0)

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
      let orangeBullet = new CustomEnemyBullet('', undefined, 5, 0, 9)
      orangeBullet.width = 50
      orangeBullet.height = 150
      orangeBullet.display = () => {
        graphicSystem.fillRect(orangeBullet.x, orangeBullet.y, orangeBullet.width, orangeBullet.height, 'orange')
      }
      fieldState.createEnemyBulletObject(orangeBullet, this.objX, this.objY)
      soundSystem.play(soundSrc.donggrami.juiceThrow)
    } else if (this.subType === this.subTypeList.JUICE_COLA && (count % 2 === 0 && count <= 60)) {
      let colaBullet = new CustomEnemyBullet('', undefined, 1)
      colaBullet.setMoveSpeed(Math.random() * 10 - 5, Math.random() * -6 - 6)
      colaBullet.display = function () {
        graphicSystem.fillEllipse(this.x, this.y, 10, 10, 0, '#995a32')
        graphicSystem.fillEllipse(this.x + 1, this.y + 1, 8, 8, 0, '#6e3a20') // 카라멜 색
        graphicSystem.fillEllipse(this.x + 2, this.y + 2, 6, 6, 0, '#85461e')
      }
      fieldState.createEnemyBulletObject(colaBullet, this.objX, this.objY)
    } else if (this.subType === this.subTypeList.JUICE_WATER && count === 1) {
      soundSystem.play(soundSrc.donggrami.throw)
      let juiceBullet = new CustomEnemyBullet(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.juiceWater, 17, Math.random() * 10 - 5, Math.random() * 10 - 5)
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

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 0, undefined, 65),
      this.getCollisionAreaCalcurationObject(23, 45, 13, 75),
    ]
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
    this._baseCp = 50000
    this.baseDivScore = 200
    this.imageSrc = imageSrc.enemy.intruderEnemy
    this.isExitToReset = true
    this.isPossibleExit = false
    this.moveDelay = new DelayData(120) // 기본 이동 주기 (120프레임, 2초 간격)
    this.moveDelay.setCountMax() // 이동방식을 변경하기 위한 지연시간은 생성하는 순간에는 적용되지 않습니다.
    this.attackDelay = new DelayData(180) // 기본 공격 주기 (180프레임, 3초 간격)
  }

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
    this.setEnemyByCpStat(6000, 0) // 내부 공격력 없음 (따라서, 적과 충돌했을때에는 데미지 0)
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
    this.bigThunderEnimation = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.energyThunder, 2, -1)

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

  static thunderEnimation = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.energyThunder, 4, -1)
  static energyBullet = new CustomEnemyBullet(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.energyBolt, 8, 1, 0)
  static EnergyReflectBullet = class extends CustomEnemyBullet {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.energyReflect)
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
      this.setAutoImageData(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.energyThunder, 4)
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
    this.setEnemyByCpStat(20, 9)
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
      degree: this.degree
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
    this.setEnemyByCpStat(20, 12)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderMetal, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.metalSlashGrey, this.width, this.height, 2))
    this.STATE_MOVE = 'move'
    this.STATE_AFTERIMAGE = 'afterimage'
    this.state = this.STATE_MOVE

    // 잔상 이미지 좌표의 기본값이 -9999인 이유는 화면 내에 표시하지 못하게 하기 위함
    /** 잔상 개수 */ this.afterimageCount = 0 
    /** 잔상 출력용 이미지 좌표 */ this.afterimageX = [-9999, -9999, -9999, -9999, -9999]
    /** 잔상 출력용 이미지 좌표 */ this.afterimageY = [-9999, -9999, -9999, -9999, -9999]
    /** 잔상 유지용 남은 프레임 값 */ this.afterimageFrame = [0, 0, 0, 0, 0]
    /** 잔상 출력용 이미지 처리 */ this.afterimage = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.metal)
    /** 잔상 유지 프레임 */ this.AFTERIMAGE_DISPLAY_FRAME = 30

    /** 이펙트 출력용 에니메이션 */
    this.effectLightEnimation = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.lightMetal, 2)
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
      if (this.moveDelay.divCheck(6)) {
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
    // 잔상 이미지 (이미지 출력수를 줄이기 위해 너프)
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
    this.setEnemyByCpStat(20, 14)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderDiacore, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.diamondBlue, this.width, this.height, 2))

    // 적 총알
    this.energyBullet = new CustomEnemyBullet(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.energyBolt, 10, 4, 4)

    // 잔상 이미지 수정
    this.afterimage = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.diacore)

    // 빛 이미지 수정
    this.effectLightEnimation = EnimationData.createEnimation(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.lightDiacore, 2)
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 35, undefined, 30),
      this.getCollisionAreaCalcurationObject(35, 0, 30, undefined)
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
    this.setEnemyByCpStat(100)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderRendown, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.pulseDiamondBlue, this.width, this.height, 3))
    this.dieAfterDeleteDelay = new DelayData(60)
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 0, 20, 120),
      this.getCollisionAreaCalcurationObject(120, 0, 20, 120),
      this.getCollisionAreaCalcurationObject(20, 20, 100, 80),
    ]
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
      super(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.leverMissileLeft, 0, -2, 5)
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
      super(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.leverMissileBomb, 5, 0, 0)
      this.setWidthHeight(this.width * 2, this.height * 2)
      this.attackDelay = new DelayData(4)
      this.customEffect = new CustomEffect(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.leverMissileBomb, this.width, this.height, 3)
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
    this.setEnemyByCpStat(50, 11)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderLever, new CustomEffect(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.enemyDieIntruderLever, this.width, this.height, 2))

    this.STATE_LEFT = 'left'
    this.STATE_RIGHT = 'right'
    this.STATE_NORMAL = ''
    this.state = this.STATE_NORMAL

    this.enimationLeft = EnimationData.createEnimation(this.imageSrc, imageDataInfo.intruderEnemy.leverLeft)
    this.enimationRight = EnimationData.createEnimation(this.imageSrc, imageDataInfo.intruderEnemy.leverRight)
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(35, 10, 0, undefined),
      this.getCollisionAreaCalcurationObject(0, 69, undefined, 10),
    ]
  }

  static LaserBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.leverLaser, 3, 0, -20, '', '')
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
    this.setEnemyByCpStat(40, 6)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderFlying1, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleGreenStroke, this.width, this.height))
    this.moveDelay = new DelayData(120)
    this.moveDelay.count = this.moveDelay.delay

    this.attackDelay = new DelayData(120)
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(12, 0, 76, undefined),
      this.getCollisionAreaCalcurationObject(0, 20, undefined, 19),
    ]
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
      super(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.flyingGreenLaser, 6, 0, 0)
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
    this.setEnemyByCpStat(80, 6)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderFlying2, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleGreenStroke, this.width, this.height, 2))
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(14, 0, 70, undefined),
      this.getCollisionAreaCalcurationObject(0, 27, undefined, 33),
    ]
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
    this.setEnemyByCpStat(10, 4)
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
    this.setEnemyByCpStat(100, 17)
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
    this.setEnemyByCpStat(40, 10)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderMomi)
    this.baseSpeed = 6
    this.MAX_SPEED = 18
    this.setIntruderDelay(33, 10)
    this.dieAfterDeleteDelay = new DelayData(33)
    this.isPossibleExit = true
    this.isExitToReset = true
  }

  getCollisionArea () {
    return [this.getCollisionAreaCalcurationObject(0, 12, 117, 36)]
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
    this.setEnemyByCpStat(200, 22)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderHanoi, new CustomEffect(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.enemyDieIntruderHanoi, this.width, this.height, 6))
    this.setRandomMoveSpeed(1, 0)
  }

  static HanoiBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.hanoiRing, 12)
      this.setAutoImageData(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.hanoiRing, 3)
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

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(91, 0, 19, 15),
      this.getCollisionAreaCalcurationObject(61, 15, 80, 37),
      this.getCollisionAreaCalcurationObject(41, 54, 120, 116),
      this.getCollisionAreaCalcurationObject(0, 120, 200, 50),
    ]
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
    this.setEnemyByCpStat(500, 33)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieIntruderDaseok, new CustomEffect(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.enemyDieIntruderDaseok, this.width, this.height, 3))
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
      super(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.leverLaser, 6, 0, -12)
    }
  }

  static LaserGreenBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.flyingGreenLaser, 4, 0, 0)
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
      super(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.energyBolt, 6, Math.random() * 6 - 3, Math.random() * -4)
    }
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(64, 0, 32, 60),
      this.getCollisionAreaCalcurationObject(45, 56, 70, 64),
      this.getCollisionAreaCalcurationObject(30, 116, 100, 84),
      this.getCollisionAreaCalcurationObject(0, 200, undefined, 40),
    ]
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

class IntruderEnemyTowerLaserMini extends IntruderEnemy {
  static laserBullet = new CustomEnemyBullet(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.towerlaserMiniAttack, 10, -10)

  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.intruderEnemy.towerLaserMini)
    this.setEnemyByCpStat(40, 20)
    this.isPossibleExit = false
    this.setMoveSpeed(0, 4)
    this.setMoveDirection()
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieTowerLaserMini, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareGrey, this.width, this.height, 2))
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = IntruderEnemyTowerLaserMini.laserBullet.getCreateObject()
      fieldState.createEnemyBulletObject(bullet, this.x, this.y)
    }
  }
}

class TowerEnemy extends EnemyData {
  constructor () {
    super()
    this._baseCp = 70000
    this.isExitToReset = true
    this.baseDivScore = 150
  }

  static bulletRed = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletRed, 10)
  static bulletBlue = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletBlue, 10)
  static bulletYellow = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.bulletYellow, 10)
  static bulletLaser = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletRedLaser, 10, -4, 0)
  static bulletLaserMini = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletOrangeLaser, 5, -6, 0)
}

class TowerEnemyGroup1MoveBlue extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.moveBlue, 4)
    this.setEnemyByCpStat(4, 6)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerMoveBlue, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareDarkCyan)
    this.setMoveDirection()
    this.moveDelay = new DelayData(60)
    /** 이동 부스터가 시작되는 x좌표 */ this.startX = 0
    /** 이동 부스터가 시작되는 y좌표 */ this.startY = 0
    /** 이동 부스터가 끝나는 도착지점 x좌표 */ this.finishX = 0
    /** 이동 부스터가 끝나는 도착지점 y좌표 */ this.finishY = 0
    /** 기본 이동 속도값 */ this.baseSpeedX = 6
    /** 기본 이동 속도값 */ this.baseSpeedY = 6
  }

  processMoveSpeed () {
    // 참고: 저장 후 불러왔을 때, 아무 문제도 발생하지 않는 이유는, startX와 finishX가 같이 더이상 이동하지 않기 때문
    let speedX, speedY
    const DIV_VALUE = 20
    if (this.moveDelay.count <= this.moveDelay.delay / 2) {
      // 이동해야 하는 거리의 일정 비율로 이동속도 설정
      speedX = (this.finishX - this.startX) / this.moveDelay.delay * this.moveDelay.count / DIV_VALUE
      speedY = (this.finishY - this.startY) / this.moveDelay.delay * this.moveDelay.count / DIV_VALUE
    } else {
      // 시간이 갈수록 속도를 감소하기 위해서 최대딜레이 - 현재카운트의 차이 값만큼 속도가 조정되도록 변경
      speedX = (this.finishX - this.startX) / this.moveDelay.delay * (this.moveDelay.delay - this.moveDelay.count) / DIV_VALUE
      speedY = (this.finishY - this.startY) / this.moveDelay.delay * (this.moveDelay.delay - this.moveDelay.count) / DIV_VALUE
    }

    // 최대, 최소 속도 제한
    const MAX_SPEED = 10
    const MIN_SPEED = 1
    if (speedX > MAX_SPEED) speedX = MAX_SPEED
    else if (speedX < -MAX_SPEED) speedX = -MAX_SPEED
    else if (speedX > 0 && speedX < MIN_SPEED) speedX = MIN_SPEED
    else if (speedX < 0 && speedX > -MIN_SPEED) speedX = -MIN_SPEED

    if (speedY > MAX_SPEED) speedY = MAX_SPEED
    else if (speedY < -MAX_SPEED) speedY = -MAX_SPEED
    else if (speedY > 0 && speedY < MIN_SPEED) speedY = MIN_SPEED
    else if (speedY < 0 && speedY > -MIN_SPEED) speedY = -MIN_SPEED

    // 이동속도 설정
    this.setMoveSpeed(speedX, speedY)
  }

  processMoveFinishPosition () {
    // 정해진 시간 마다 도착 위치를 지정, 플레이어의 위치에 따라 이동 위치가 달라짐
    if (this.moveDelay.check()) {
      let player = fieldState.getPlayerObject()
      let distanceX = this.x - player.x
      let distanceY = this.y - player.y
      const MIN_MOVEMENT = this.width / 2
      this.startX = this.x // 시작 위치 지정
      this.startY = this.y
      this.finishX = this.x // x축과 y축 도착 지점에 기본값을 우선 넣은 후 나중에 변경
      this.finishY = this.y 

      // x축과 y축을 비교해 더 멀리 떨어져 있는 (x 또는 y)축 방향으로 이동합니다. 다른 축 방향의 도착 위치는 변경하지 않음
      // 얼마나 떨어져 있는지를 알아야 하기 때문에 절대값으로 계산해야합니다.
      if (Math.abs(distanceX) > Math.abs(distanceY)) { // x축 방향이 더 클 경우
        if (Math.abs(distanceX) > MIN_MOVEMENT) { // MIN_MOVEMENT보다 거리가 더 크면 해당 위치로 이동합니다.
          this.finishX = this.x - distanceX
        } else { // 아니라면, MIN_MOVEMENT값만큼 더해서 이동합니다. (최소 거리값)
          this.finishX = distanceX > 0 ? this.x + MIN_MOVEMENT : this.x - MIN_MOVEMENT
        }
      } else { // y축은 x축과 설명 동일
        if (Math.abs(distanceY) > MIN_MOVEMENT) {
          this.finishY = this.y - distanceY
        } else {
          this.finishY = distanceY > 0 ? this.y + MIN_MOVEMENT : this.y - MIN_MOVEMENT
        }
      } 
    }
  }

  processMove () {
    super.processMove()
    this.processMoveSpeed()
    this.processMoveFinishPosition()
  }
}

class TowerEnemyGroup1MoveViolet extends TowerEnemyGroup1MoveBlue {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.moveViolet, 4)
    this.setEnemyByCpStat(4, 6)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerMoveViolet, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareDarkViolet)
    this.moveDelay.delay = 30
  }

  processMoveFinishPosition () {
    // 정해진 시간 마다 도착 위치를 지정, 플레이어의 위치에 따라 이동 위치가 달라짐
    if (this.moveDelay.check()) {
      let player = fieldState.getPlayerObject()
      this.startX = this.x // 시작 위치 지정
      this.startY = this.y
      const RANDOM_VALUE = 50
      
      // 플레이어가 있는 위치를 향해서 이동
      this.finishX = player.x + Math.random() * RANDOM_VALUE // x축과 y축 도착 지점에 기본값을 우선 넣은 후 나중에 변경
      this.finishY = player.y + Math.random() * RANDOM_VALUE
    }
  }
}

class TowerEnemyGroup1MoveDarkViolet extends TowerEnemyGroup1MoveBlue {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.moveDarkViolet, 4)
    this.setEnemyByCpStat(4, 6)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerMoveDarkViolet, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareDarkViolet)
    this.moveDelay.delay = 120
    this.AXIS_X = 'x'
    this.AXIS_Y = 'y'
    this.axis = this.AXIS_X
    this.isExitToReset = true
    this.setMoveDirection(FieldData.direction.LEFT, '')
  }

  processMoveSpeed () {
    let speedX, speedY
    const DIV_VALUE = 50
    const POSITION_VALUE = 800 // 이동 기준이 되는 값
    if (this.moveDelay.count <= this.moveDelay.delay / 2) {
      // 이동해야 하는 거리의 일정 비율로 이동속도 설정
      speedX = POSITION_VALUE / this.moveDelay.delay * this.moveDelay.count / DIV_VALUE
      speedY = POSITION_VALUE / this.moveDelay.delay * this.moveDelay.count / DIV_VALUE
    } else {
      // 시간이 갈수록 속도를 감소하기 위해서 최대딜레이 - 현재카운트의 차이 값만큼 속도가 조정되도록 변경
      speedX = POSITION_VALUE / this.moveDelay.delay * (this.moveDelay.delay - this.moveDelay.count) / DIV_VALUE
      speedY = POSITION_VALUE / this.moveDelay.delay * (this.moveDelay.delay - this.moveDelay.count) / DIV_VALUE
    }

    // 최대, 최소 속도 제한 
    const MAX_SPEED = 4
    const MIN_SPEED = 0
    if (speedX > MAX_SPEED) speedX = MAX_SPEED
    else if (speedX < -MAX_SPEED) speedX = -MAX_SPEED
    else if (speedX > 0 && speedX < MIN_SPEED) speedX = MIN_SPEED
    else if (speedX < 0 && speedX > -MIN_SPEED) speedX = -MIN_SPEED

    if (speedY > MAX_SPEED) speedY = MAX_SPEED
    else if (speedY < -MAX_SPEED) speedY = -MAX_SPEED
    else if (speedY > 0 && speedY < MIN_SPEED) speedY = MIN_SPEED
    else if (speedY < 0 && speedY > -MIN_SPEED) speedY = -MIN_SPEED

    // 이동속도 설정 (x축 또는 y축 방향에 맞게)
    this.axis === this.AXIS_X ? this.setMoveSpeed(speedX, 0) : this.setMoveSpeed(0, speedY)
  }

  processMoveFinishPosition () {
    if (this.moveDelay.check()) {
      // 매번 체크할 때마다 X축 Y축 번갈아가면서 변경
      this.axis = this.axis === this.AXIS_X ? this.AXIS_Y : this.AXIS_X
    }
  }
}

class TowerEnemyGroup1MoveYellowEnergy extends TowerEnemyGroup1MoveBlue {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.moveYellowEnergy, 4)
    this.setEnemyByCpStat(10, 12)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerMoveYellowEnergy, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.fireBlue)
    this.moveDelay.delay = 10
  }

  processMoveSpeed () {
    let speedX, speedY
    const DIV_VALUE = 100
    // 플레이어를 추적하면서 이동하지만, 속도 전환에 한계가 있음 (프레임당 SPEED_CHANGE_VALUE씩 변화)

    speedX = (this.finishX - this.x) / DIV_VALUE
    speedY = (this.finishY - this.y) / DIV_VALUE

    let targetSpeedXChange = 0.0
    let targetSpeedYChange = 0.0
    const SPEED_CHANGE_VALUE = 0.05
    const MIN_SPEED = 1
    // 최소 속도 이상일때만 속도 변화
    if (speedX > MIN_SPEED) targetSpeedXChange = SPEED_CHANGE_VALUE
    if (speedX < -MIN_SPEED) targetSpeedXChange = -SPEED_CHANGE_VALUE
    if (speedY > MIN_SPEED) targetSpeedYChange = SPEED_CHANGE_VALUE
    if (speedY < -MIN_SPEED) targetSpeedYChange = -SPEED_CHANGE_VALUE
    
    // 최대 속도 제한 (현재 개체의 속도를 기준으로 함)
    const MAX_SPEED = 4
    if (this.moveSpeedX >= MAX_SPEED) this.moveSpeedX = MAX_SPEED
    if (this.moveSpeedX <= -MAX_SPEED) this.moveSpeedX = -MAX_SPEED
    if (this.moveSpeedY >= MAX_SPEED) this.moveSpeedY = MAX_SPEED
    if (this.moveSpeedY <= -MAX_SPEED) this.moveSpeedY = -MAX_SPEED

    this.setMoveSpeed(this.moveSpeedX + targetSpeedXChange, this.moveSpeedY + targetSpeedYChange)

    const atangent = Math.atan2(this.moveSpeedY, this.moveSpeedX)
    this.degree = atangent * (180 / Math.PI)
  }

  processMoveFinishPosition () {
    if (this.moveDelay.check()) {
      let player = fieldState.getPlayerObject()
      this.startX = this.x
      this.startY = this.y
      this.finishX = player.x
      this.finishY = player.y
    }
  }

}

class TowerEnemyGroup1Sandglass extends TowerEnemy {
  constructor () {
    super()
    // 모래시계가 모래가 전부 흐른 상태를 유지하기 위해서 모래시계의 이미지는 맨 마지막 프레임만 출력합니다.
    // 그 외의 경우 애니메이션을 출력합니다.
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.sandglassSandDown)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerSandglass, imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDieSandglass, 4)
    this.setEnemyByCpStat(50, 20)
    this.moveDelay = new DelayData(120)
    this.STATE_MOVE = 'move'
    this.STATE_WAIT = 'wait'
    this.STATE_ROTATE = 'rotate'
    this.state = this.STATE_MOVE
    this.isPossibleExit = false
    this.setMoveSpeed(1, 0)
    this.sandEnimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.sandglassEnimation, 6, 1)
  }

  processEnimation () {
    super.processEnimation()
    this.sandEnimation.degree = this.degree
    this.sandEnimation.process()
  }

  display () {
    if (this.sandEnimation.finished) {
      super.display()
    } else {
      this.sandEnimation.display(this.x, this.y)
    }
  }

  processMove () {
    if (this.state === this.STATE_MOVE) {
      super.processMove()
    }

    // 일정시간마다 회전을 시키기 위해 각도가 특정 값 이내일때만 회전을 진행 (특정값이 아니면 회전상태가 아님)
    const DEGREE_STATE = 1
    const DEGREE_END = 180
    const DEGREE_PLUS = 3
    if (this.degree >= DEGREE_STATE && this.degree < DEGREE_END) {
      this.degree += DEGREE_PLUS
      
      // 정해진 기준각도인 180도가 된 경우, 각도를 리셋시키고 모래가 흐르는 애니메이션을 다시 재생시킵니다.
      if (this.degree >= DEGREE_END) {
        this.sandEnimation.reset()
        this.degree = 0
      }
    }

    if (this.moveDelay.check()) {
      // 일정시간마다 상태 번갈아가면서 변경
      this.state = this.state === this.STATE_MOVE ? this.STATE_WAIT : this.STATE_MOVE
      
      if (this.state === this.STATE_MOVE) {
        this.setMoveSpeed(1, 0)
      }

      this.degree = DEGREE_PLUS // 회전을 위해 각도를 특정 값으로 설정
    }

  }
}

class TowerEnemyGroup1Tapo extends TowerEnemy {
  static RocketBullet = class extends CustomEnemyBullet {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletTapo)
      this.setMoveSpeed(Math.random() * 2 - 1, -4)
      this.attack = 10
    }

    processMove () {
      super.processMove()
      const atangent = Math.atan2(this.moveSpeedY, this.moveSpeedX)
      this.degree = atangent * (180 / Math.PI)
    }

    // 회전을 사용하기 때문에 충돌 방식이 다릅니다.
    processCollision () {
      if (this.attack === 0) return

      let player = fieldState.getPlayerObject()
      let playerSendXY = { x: player.x, y: player.y, width: player.width, height: player.height, degree: 0}
      
      if (collisionClass.collisionOBB(playerSendXY, this)) {
        player.addDamage(this.attack)
        this.isDeleted = true
      }
    }
  }

  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.tapo)
    this.setEnemyByCpStat(50, 16)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerTapo, imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDieTapo, 6)
    this.tapoEnimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.tapoEnimation, 2)
    this.attackDelay = new DelayData(180 + Math.floor(Math.random() * 6))
    this.setMoveSpeed(1, 0)
    this.isExitToReset = true
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 0, 71, 27),
      this.getCollisionAreaCalcurationObject(0, 70, undefined, 30),
      this.getCollisionAreaCalcurationObject(25, 27, 66, 20),
      this.getCollisionAreaCalcurationObject(41, 47, 89, 23),
    ]
  }

  processEnimation () {
    super.processEnimation()
    this.tapoEnimation.process()
  }

  processAttack () {
    if (this.attackDelay.check()) {
      soundSystem.play(soundSrc.enemyAttack.towerAttackDaepo)
      let bullet = new TowerEnemyGroup1Tapo.RocketBullet()
      fieldState.createEnemyBulletObject(bullet, this.x - bullet.centerX - 40, this.y - bullet.height)

      let bullet2 = new TowerEnemyGroup1Tapo.RocketBullet()
      fieldState.createEnemyBulletObject(bullet2, this.x - bullet2.centerX, this.y - bullet2.height)
      this.tapoEnimation.reset()
    }
  }

  display () {
    if (this.tapoEnimation.finished) {
      super.display()
    } else {
      this.tapoEnimation.display(this.x, this.y)
    }
  }
}

class TowerEnemyGroup1Punch extends TowerEnemy {
  static imageDataPunchBall = imageDataInfo.towerEnemyGroup1.punchBall
  static imageDataPunchSpring = imageDataInfo.towerEnemyGroup1.punchSpring
  static imageDataPunchModule = imageDataInfo.towerEnemyGroup1.punchModule

  // 죽음 이펙트는 processMove를 사용할 수 없으므로 대신 sprite로 처리함
  static EffectEnemyDiePunchBall = class extends FieldData {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDiePunchBall)
      this.setMoveSpeed(Math.random() * 4 - 1, 0)
      this.gravity = -10
    }

    processMove () {
      super.processMove()
      this.degree += 4
      this.gravity++

      this.y += Math.floor(this.gravity / 1)
      if (this.gravity >= 60) this.isDeleted = true
    }
  }
  static EffectEnemyDiePunchSpring = class extends TowerEnemyGroup1Punch.EffectEnemyDiePunchBall {
    constructor () { super(); this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDiePunchSpring); }
  }
  static EffectEnemyDiePunchModule = class extends TowerEnemyGroup1Punch.EffectEnemyDiePunchBall {
    constructor () { super(); this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDiePunchModule); }
  }

  constructor () {
    super()
    // 참고: setAutoImageData는 설정하지 않습니다. 출력 방식이 독자적이기 때문
    this.setEnemyByCpStat(20, 11)
    this.attackDelay = new DelayData(20)
    this.moveDelay = new DelayData(120)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerPunch)

    // 길이: 세개의 이미지를 더한 길이, 높이: 아무거나 하나의 높이 (3개가 높이가 전부 동일)
    let totalWidth = TowerEnemyGroup1Punch.imageDataPunchBall.width 
      + TowerEnemyGroup1Punch.imageDataPunchSpring.width 
      + TowerEnemyGroup1Punch.imageDataPunchModule.width
    this.setWidthHeight(totalWidth, TowerEnemyGroup1Punch.imageDataPunchBall.height)

    /** 스프링 길이: 공격하면 늘어났다가 줄어듬 (단, 왼쪽만 공격 가능) */
    this.springWidth = TowerEnemyGroup1Punch.imageDataPunchSpring.width
    /** 스프링 최대 길이 */ this.SPRING_MAX_WIDTH = 300
    /** 스프링 기본 길이 */ this.BASE_SPRING_WIDTH = TowerEnemyGroup1Punch.imageDataPunchSpring.width

    this.STATE_MOVE = 'move'
    this.STATE_ATTACK = 'attack'
    this.state = this.STATE_MOVE
    this.setMoveDirection()
  }

  processMove () {
    if (this.state !== this.STATE_MOVE) return

    // 플레이어 추적 (일정시간마다)
    if (this.moveDelay.divCheck(20)) {
      let player = fieldState.getPlayerObject()
      const MAX_SPEED = 3
      const MIN_SPEED = 0.5
      let speedX = (player.x - this.x) / 40
      let speedY = (player.y - this.y) / 40
      if (speedX > MAX_SPEED) speedX = MAX_SPEED
      if (speedX < -MAX_SPEED) speedX = -MAX_SPEED
      if (speedY > MAX_SPEED) speedY = MAX_SPEED
      if (speedY < -MAX_SPEED) speedY = -MAX_SPEED
      if (speedX <= MIN_SPEED && speedX >= -MIN_SPEED) speedX = 0
      if (speedY <= MIN_SPEED && speedY >= -MIN_SPEED) speedY = 0
      this.setMoveSpeed(speedX, speedY)
    }

    if (this.moveDelay.check()) {
      this.state = this.STATE_ATTACK
      this.setMoveSpeed(0, 0)
    }

    super.processMove()
  }

  processAttack () {
    if (this.state !== this.STATE_ATTACK) return

    if (this.attackDelay.count === 0) {
      soundSystem.play(soundSrc.enemyAttack.towerPunchAttack)
    }

    // 딜레이의 1/2 이하일경우 스프링은 늘어나고, 아닐경우 스프링은 줄어둠 (즉, 스프링은 늘었다 줄어듭니다.)
    const SECTION_SIZE = 10
    if (this.attackDelay.count <= this.attackDelay.delay / 2) {
      this.springWidth = this.BASE_SPRING_WIDTH + (this.attackDelay.count * SECTION_SIZE)
      this.x -= SECTION_SIZE
    } else {
      this.springWidth = this.BASE_SPRING_WIDTH + ((this.attackDelay.delay - this.attackDelay.count) * SECTION_SIZE)
      this.x += SECTION_SIZE
    }

    // 길이: 세개의 이미지를 더한 길이, 높이: 아무거나 하나의 높이 (3개가 높이가 전부 동일)
    let totalWidth = TowerEnemyGroup1Punch.imageDataPunchBall.width 
      + this.springWidth
      + TowerEnemyGroup1Punch.imageDataPunchModule.width
    this.setWidthHeight(totalWidth, TowerEnemyGroup1Punch.imageDataPunchBall.height)

    // 스프링 길이 최대 최소 제한
    if (this.springWidth < this.BASE_SPRING_WIDTH) this.springWidth = this.BASE_SPRING_WIDTH
    if (this.springWidth > this.SPRING_MAX_WIDTH) this.springWidth = this.SPRING_MAX_WIDTH

    if (this.attackDelay.check()) {
      this.state = this.STATE_MOVE
    }
  }

  processDieAfterLogic () {
    super.processDieAfterLogic()

    // 펀치 조각들이 분해되면서 자동으로 날라감
    const T = TowerEnemyGroup1Punch
    fieldState.createSpriteObject(new T.EffectEnemyDiePunchBall(), this.x, this.y)
    fieldState.createSpriteObject(new T.EffectEnemyDiePunchSpring(), this.x + T.imageDataPunchBall.width, this.y)
    fieldState.createSpriteObject(new T.EffectEnemyDiePunchModule(), this.x + T.imageDataPunchBall.width + T.imageDataPunchSpring.width, this.y)
  }

  display () {
    // 3개의 이미지를 동시 출력해야함
    const targetImage = imageSrc.enemy.towerEnemyGroup1
    const punchBall = TowerEnemyGroup1Punch.imageDataPunchBall
    const punchSpring = TowerEnemyGroup1Punch.imageDataPunchSpring
    const punchModule = TowerEnemyGroup1Punch.imageDataPunchModule
    this.imageObjectDisplay(targetImage, punchBall, this.x, this.y)
    this.imageObjectDisplay(targetImage, punchSpring, this.x + punchBall.width, this.y, this.springWidth)
    this.imageObjectDisplay(targetImage, punchModule, this.x + punchBall.width + this.springWidth, this.y)
  }
}

class TowerEnemyGroup1Daepo extends TowerEnemy {
  static BASE_ATTACK = 12
  static Daepo = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletDaepo, TowerEnemyGroup1Daepo.BASE_ATTACK)
  static EffectDieDaepoFront = class extends FieldData {
    // 원리는 TowerEnemyGroup1Punch랑 동일
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDieDaepoFront)
      this.setRandomMoveSpeedMinMax(8, -8, 12, 8)
    }

    processMove () {
      super.processMove()
      this.degree += 12
      if (this.elapsedFrame >= 120) this.isDeleted = true
    }
  }
  static EffectDieDaepoBack = class extends TowerEnemyGroup1Daepo.EffectDieDaepoFront {
    constructor () { super(); this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDieDaepoBack) }
  }

  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.deapo)
    this.setEnemyByCpStat(18, TowerEnemyGroup1Daepo.BASE_ATTACK)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerDaepo)
    this.STATE_NORMAL = 'normal'
    this.STATE_STOP = 'stop'
    this.state = this.STATE_NORMAL
    this.moveDelay = new DelayData(60 + Math.floor(Math.random() * 12))
    this.attackDelay = new DelayData(180)
    this.isPossibleExit = false
    this.degreeSpeed = Math.floor(Math.random() * 4) + 6
    this.setRandomMoveSpeed(5, 3)
  }

  processAttack () {
    if (this.state !== this.STATE_STOP) return

    if (this.attackDelay.check()) {
      let bullet = TowerEnemyGroup1Daepo.Daepo.getCreateObject()
      soundSystem.play(soundSrc.enemyAttack.towerAttackDaepo)
      bullet.moveSpeedX = Math.cos((Math.PI / 180) * this.degree) * 4
      bullet.moveSpeedY = Math.sin((Math.PI / 180) * this.degree) * 4
      fieldState.createEnemyBulletObject(bullet, this.x, this.y)
    }
  }

  processMove () {
    if (this.state !== this.STATE_NORMAL) return

    super.processMove()
    this.degree += this.degreeSpeed
    if (this.degree >= 360) this.degree -= 360

    if (this.moveDelay.check(false)) {
      // 현재 좌표값에 따라 각도 범위가 해당 값 안일때맏 (중심을 향해 발사하도록) 상태 변경
      // 4분면 기준으로 각도를 90도씩 분리해서 처리함
      // 오른쪽 방향을 보고있는것이 0도이므로, 이것을 기준으로 360방향을 처리
      // 기준각도: 오른쪽 아래: 0 ~ 90, 왼쪽 아래: 90 ~ 180, 왼쪽 위: 180 ~ 270, 오른쪽 위: 270 ~ 360,
      // 만약 대포가 오른쪽 아래에 있다면, 0 ~ 90도 방향을 바라보므로, 위쪽을 바라보는 값인 120 ~ 330도 내에서만 공격 가능하게 변경
      // 참고: 실제 각도 계산은 어림짐작으로 했기 때문에 부정확 할 수도 있음
      const HALF_WIDTH = graphicSystem.CANVAS_WIDTH_HALF
      const HALF_HEIGHT = graphicSystem.CANVAS_HEIGHT_HALF
      if ( (this.x >= HALF_WIDTH && this.y <= HALF_HEIGHT && this.degree >= 30 && this.degree <= 150) // 오른쪽 위
        || (this.x >= HALF_WIDTH && this.y >= HALF_HEIGHT && this.degree >= 210 && this.degree <= 330) // 오른쪽 아래
        || (this.x <= HALF_WIDTH && this.y >= HALF_HEIGHT && this.degree >= 270 && this.degree <= 30) // 왼쪽 아래
        || (this.x <= HALF_WIDTH && this.y <= HALF_HEIGHT && this.degree >= 210 && this.degree <= 120) ) { // 왼쪽 위
        this.state = this.STATE_STOP
      }
    }
  }

  processDieAfterLogic () {
    super.processDieAfterLogic()

    const T = TowerEnemyGroup1Daepo
    fieldState.createSpriteObject(new T.EffectDieDaepoFront(), this.x, this.y)
    fieldState.createSpriteObject(new T.EffectDieDaepoBack(), this.x + this.width - 80, this.y)
  }
}

/** 헬(날아다니는 전투기 -> 헬기 -> 헬) 시리즈 템플릿 */
class TowerEnemyHellTemplet extends TowerEnemy {
  static DieEffectRed = new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedWhite, 40, 40, 1)
  static DieEffectViolet = new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleViolet, 40, 40, 1)
  static DieEffectBlue = new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleBlue, 40, 40, 1)
  static dieColorList = { red: 'red', violet: 'violet', blue: 'blue' }

  static HelljeonBullet = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletHelljeonRocket, 4)

  constructor () {
    super()
    this.attackDelay = new DelayData(180)
    this.moveDelay = new DelayData(180)
    this.moveDelay.setCountMax()
    this.isExitToReset = true
    this.dieAfterDeleteDelay = new DelayData(60)

    /** 죽었을 때 어떤 색의 폭발 이펙트를 사용할지 결정함 (값은 dieColorList(static class)에 있음) */ 
    this.dieColor = TowerEnemyHellTemplet.dieColorList.red
    this.dieColorList = TowerEnemyHellTemplet.dieColorList

    /** 목표 지정된 속도과 관련된 값의 집합 */
    this.targetSpeed = {
      /** 이동속도의 특정 목표 값의 내부 처리 변수 (이 값을 변경하지 마세요) */ _x: 0,
      /** 이동속도의 특정 목표 값의 내부 처리 변수 (이 값을 변경하지 마세요) */ _y: 0,
      /** 이동속도의 기준 값 */ xBase: 2,
      /** 이동속도의 기준 값 */ yBase: 2,
      /** 이동속도 변화 가중치 */ xChange: 0.02,
      /** 이동속도 변화 가중치 */ yChange: 0.02,
      /** 최대 제한 속도 */ xMax: 5,
      /** 최대 제한 속도 */ yMax: 5,
    }

    /** 회전 각도 허용? */ this.isAngleChange = true

    this.setMoveDirection() // 이동방향 삭제
  }

  /** 헬시리즈 개체의 각도를 변경합니다. */
  processChangeAngle () {
    if (!this.isAngleChange) return // 회전각도가 허용되지 않으면 각도는 재설정 되지 않습니다.

    // 회전각도 설정
    const atangent = Math.atan2(this.moveSpeedY, this.moveSpeedX)
    this.degree = atangent * (180 / Math.PI)
  }

  /** 헬시리즈 개체의 속도를 변경합니다. */
  processSpeedChange () {
    // 속도 x축 지속적인 변경
    if (this.moveSpeedX + this.targetSpeed.xChange < this.targetSpeed._x) {
      this.moveSpeedX += this.targetSpeed.xChange
    } else if (this.moveSpeedX - this.targetSpeed.xChange > this.targetSpeed._x) {
      this.moveSpeedX -= this.targetSpeed.xChange
    }

    // 속도 x축 최대 제한 설정
    if (this.moveSpeedX > 0 && this.moveSpeedX > this.targetSpeed.xMax) {
      this.moveSpeedX = this.targetSpeed.xMax
    } else if (this.moveSpeedX < 0 && this.moveSpeedX < -this.targetSpeed.xMax) {
      this.moveSpeedX = -this.targetSpeed.xMax
    }

    // 속도 y축 지속적인 변경
    if (this.moveSpeedY + this.targetSpeed.yChange < this.targetSpeed._y) {
      this.moveSpeedY += this.targetSpeed.yChange
    } else if (this.moveSpeedY - this.targetSpeed.yChange > this.targetSpeed._y) {
      this.moveSpeedY -= this.targetSpeed.yChange
    }

    // 속도 y축 최대 제한 설정
    if (this.moveSpeedY > 0 && this.moveSpeedY > this.targetSpeed.yMax) {
      this.moveSpeedY = this.targetSpeed.yMax
    } else if (this.moveSpeedY < 0 && this.moveSpeedY < -this.targetSpeed.yMax) {
      this.moveSpeedY = -this.targetSpeed.yMax
    }
  }

  processRandomSpeed () {
    this.targetSpeed._x = (Math.random() * this.targetSpeed.xBase * 2) - this.targetSpeed.xBase - 0.2
    if (this.x > graphicSystem.CANVAS_WIDTH - 200) { // 너무 오른쪽에 있으면, 왼쪽으로 이동하도록 유도
      this.targetSpeed._x = -Math.abs(this.targetSpeed._x)
    } else if (this.x < 200) { // 너무 왼쪽에 있으면, 오른쪽에 이동하도록 유도
      this.targetSpeed._x = Math.abs(this.targetSpeed._x)
    }

    // y축도 마찬가지 적용
    this.targetSpeed._y = (Math.random() * this.targetSpeed.yBase * 2) - this.targetSpeed.yBase
    if (this.y > graphicSystem.CANVAS_HEIGHT - 100) {
      this.targetSpeed._y = -Math.abs(this.targetSpeed._y)
    } else if (this.y < 100) {
      this.targetSpeed._y = Math.abs(this.targetSpeed._y)
    }

  }

  processMove () {
    if (this.isDied) return // 죽은경우, 이동 로직을 전부 사용하지 않음

    super.processMove()
    if (this.moveDelay.check()) {
      this.processRandomSpeed()
    }

    this.processChangeAngle()
    this.processSpeedChange()
  }

  /** 헬시리즈 개체는 회전하면서 추락하고, 지속적인 폭발 이펙트가 발생하는 구조로 죽습니다. */
  processDieAfter () {
    super.processDieAfter()

    // 폭발 이펙트, 사운드 생성
    if (this.isDied && this.dieAfterDeleteDelay.divCheck(10)) {
      const T = TowerEnemyHellTemplet
      let targetX = this.x + (Math.random() * this.width)
      let targetY = this.y + (Math.random() * this.height)

      switch (this.dieColor) {
        case T.dieColorList.blue: fieldState.createEffectObject(T.DieEffectBlue.getObject(), targetX, targetY); break
        case T.dieColorList.red: fieldState.createEffectObject(T.DieEffectRed.getObject(), targetX, targetY); break
        case T.dieColorList.violet: fieldState.createEffectObject(T.DieEffectViolet.getObject(), targetX, targetY); break
      }
    }

    if (this.isDied && this.dieAfterDeleteDelay.divCheck(12)) {
      soundSystem.play(this.dieSound)
    }

    // 죽은 경우 회전하면서 추락
    if (this.isDied) {
      this.degree += 2
      this.y += 4
    }
  }
}

class TowerEnemyGroup1Hellgi extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.hellgiEnimation, 2)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHellgi)
    this.setMoveSpeed(1, 0)
    this.setEnemyByCpStat(40, 12)

    // 좌우 반전 (헬기는 이동방향이 없기 때문에 오른쪽을 바라보는 방향으로 기본 설정되어 왼쪽을 바라보는 형태로 하려면 flip해야함)
    this.flip = 1 

    this.targetSpeed.xBase = 1
    this.targetSpeed.yBase = 2
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 21, 170, 24),
      this.getCollisionAreaCalcurationObject(60, 3, 100, 7),
      this.getCollisionAreaCalcurationObject(63, 19, 107, 51),
    ]
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = TowerEnemy.bulletBlue.getCreateObject()
      bullet.moveSpeedX = this.moveSpeedX < 0 ? -6 : 6
      bullet.moveSpeedY = this.moveSpeedY
      fieldState.createEnemyBulletObject(bullet, this.x, this.y)
    }
  }

  processChangeAngle () {
    // 각도 계산이 헬시리즈랑 다르게 진행되므로, super.processChangeAngle을 사용하지 않습니다.
    // y축의 속도에 따라 각도 조절 (단 일정 각도를 벗어나지 못함)
    if (this.moveSpeedY <= 0.5 && this.moveSpeedY >= -0.5) {
      this.degree = 0
    } else if (this.moveSpeedY >= 0.5) {
      this.degree = (this.moveSpeedY - 0.5) * -6
      if (this.degree > 30 && this.degree < 180) this.degree = 30
    } else if (this.moveSpeedY <= -0.5) {
      this.degree = (this.moveSpeedY + 0.5) * -6
      if (this.degree > 180 && this.degree < 330) this.degree = 330
    }

    // 이동 속도에 따라서, 좌우 반전 결정 (왼쪽이 마이너스입니다. 그래서 왼쪽방향일때만 반전 적용)
    if (this.moveSpeedX < 0) this.flip = 1
    else this.flip = 0
  }
}

class TowerEnemyGroup1Helljeon extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.helljeon)
    this.setEnemyByCpStat(22, 12)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHelljeon)
    this.helljeonEnimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.helljeonEnimation, 2)
    this.setMoveDirection()
    this.dieColor = TowerEnemyHellTemplet.dieColorList.blue
    this.targetSpeed.xChange = 0.14
    this.targetSpeed.yChange = 0.14
    this.targetSpeed.xBase = 2
    this.targetSpeed.yBase = 2
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 21, 120, 28),
      this.getCollisionAreaCalcurationObject(9, 0, 26, 7),
      this.getCollisionAreaCalcurationObject(29, 6, 73, 13),
      this.getCollisionAreaCalcurationObject(9, 63, 30, 7),
      this.getCollisionAreaCalcurationObject(29, 51, 73, 13),
    ]
  }

  processEnimation () {
    super.processEnimation()
    this.helljeonEnimation.degree = this.degree
    this.helljeonEnimation.process()
  }

  processMove () {
    super.processMove()

    // 위에서(super.process()) check함수를 사용했기 때문에, 여기서도 check를 하면
    // 카운트 관련 문제가 발생할 수 있습니다. 그래서 다른 형태로 조건을 처리합니다.
    if (this.moveDelay.count === 0) {
      // 플레이어를 추적하도록 속도 변경
      let player = fieldState.getPlayerObject()
      this.targetSpeed._x = (player.centerX - this.centerX) / 150
      this.targetSpeed._y = (player.centerY - this.centerY) / 150
    }
  }

  processAttack () {
    if (this.attackDelay.check()) {
      for (let i = 0; i < 2; i++) {
        let bullet = TowerEnemyGroup1Helljeon.HelljeonBullet.getCreateObject()
        bullet.degree = this.degree
        bullet.setMoveSpeed(this.moveSpeedX * 4, this.moveSpeedY * 4)
        const minSpeed = 6
        if (Math.abs(bullet.moveSpeedX) < minSpeed && Math.abs(bullet.moveSpeedY) < minSpeed) {
          // speedX와 speedY의 값을 비교하여 가장 높은 값을 최소 속도에 맞춰지도록 조정합니다.
          let mul = Math.abs(bullet.moveSpeedX) < Math.abs(bullet.moveSpeedY) ? minSpeed / Math.abs(bullet.moveSpeedY) : minSpeed / Math.abs(bullet.moveSpeedX)
          bullet.moveSpeedX *= mul
          bullet.moveSpeedY *= mul
        }

        fieldState.createEnemyBulletObject(bullet, this.x + 25, this.y + (i * 25))
      }
      this.helljeonEnimation.reset()
    }
  }

  display () {
    if (this.helljeonEnimation.finished) {
      super.display()
    } else {
      this.helljeonEnimation.display(this.x, this.y)
    }
  }
}

class TowerEnemyGroup1Hellcho extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.hellcho)
    this.setEnemyByCpStat(22, 12)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHellcho)
    this.moveDelay.delay = 60
    this.moveDelay.setCountMax()
    this.setMoveDirection()
    this.targetSpeed.xBase = 3
    this.targetSpeed.yBase = 3
    this.targetSpeed.xChange = 0.22
    this.targetSpeed.yChange = 0.22
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 0, 24, 13),
      this.getCollisionAreaCalcurationObject(0, 46, 24, 14),
      this.getCollisionAreaCalcurationObject(11, 5, 48, 50),
      this.getCollisionAreaCalcurationObject(60, 20, 60, 20),
      this.getCollisionAreaCalcurationObject(70, 5, 30, 50),
    ]
  }

  processMove () {
    super.processMove()

    // 위에서(super.process()) check함수를 사용했기 때문에, 여기서도 check를 하면
    // 카운트 관련 문제가 발생할 수 있습니다. 그래서 다른 형태로 조건을 처리합니다.
    if (this.moveDelay.count === 0) {
      // 플레이어를 추적하도록 속도 변경
      let player = fieldState.getPlayerObject()
      this.targetSpeed._x = (player.centerX - this.centerX) / 90
      this.targetSpeed._y = (player.centerY - this.centerY) / 90
    }
  }
}

class TowerEnemyGroup1Hellba extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.hellba, 6)
    this.setEnemyByCpStat(22, 12)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHellba)
    /** 에너지소환체 1 */ this.energyObject = {x: 0, y: 0, width: 100, height: 100, leftFrame: 0}
    /** 에너지소환체 2 */ this.energyObject2 = {x: 0, y: 0, width: 100, height: 100, leftFrame: 0}
    /** 에너지 소환체의 남은 프레임 기준값 */ this.ENERGY_OBJECT_LEFT_FRAME_VALUE = 120
    this.attackDelay.delay = 300
    this.attackDelay.count = 120
    this.dieColor = TowerEnemyHellTemplet.dieColorList.violet
    this.ENERGY_ATTACK = 4
    this.isAngleChange = false

    this.targetSpeed.xBase = 2
    this.targetSpeed.yBase = 2
  }

  processAttack () {
    if (this.attackDelay.check()) {
      this.energyObject.leftFrame = this.ENERGY_OBJECT_LEFT_FRAME_VALUE
      soundSystem.play(soundSrc.enemyAttack.towerHellbaAttack)
    }

    // 에너지오브젝트가 남아있을 때 6프레임마다 충돌 판정
    this.energyObject.leftFrame--
    if (this.energyObject.leftFrame >= 1 && this.energyObject.leftFrame % 6 === 0) {
      let player = fieldState.getPlayerObject()
      if (collision(this.energyObject, player)) {
        player.addDamage(this.ENERGY_ATTACK)
      } else if (collision(this.energyObject2, player)) {
        player.addDamage(this.ENERGY_ATTACK)
      }
    }
  }

  processMove () {
    super.processMove()

    // 에너지 오브젝트 위치 설정
    this.energyObject.x = this.x - this.energyObject.width
    this.energyObject.y = this.y - 25
    this.energyObject2.x = this.x + this.width
    this.energyObject2.y = this.y - 25
  }

  display () {
    super.display()
    if (!this.isDied && this.energyObject.leftFrame >= 1) {
      this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletPurpleEnergy, this.energyObject.x, this.energyObject.y, this.energyObject.width, this.energyObject.height)
      this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletPurpleEnergy, this.energyObject2.x, this.energyObject2.y, this.energyObject2.width, this.energyObject2.height)
    }
  }
}

class TowerEnemyGroup1Hellgal extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.hellgal)
    this.setEnemyByCpStat(22, 12)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHellgal)
    this.moveDelay.delay = 180
    this.dieColor = TowerEnemyHellTemplet.dieColorList.violet
    this.targetSpeed.xBase = 2
    this.targetSpeed.yBase = 4
    this.targetSpeed.xChange = 0.07
    this.targetSpeed.yChange = 0.07
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let player = fieldState.getPlayerObject()
      let chaseSpeed = this.getMoveSpeedChaseLineValue(player.x, player.y, this.centerX, this.centerY, 96, 4)
      for (let i = 0; i < 3; i++) {
        let bullet = TowerEnemy.bulletBlue.getCreateObject()
        bullet.moveSpeedX = chaseSpeed.speedX + (Math.random() * 2) - 1
        bullet.moveSpeedY = chaseSpeed.speedY + (Math.random() * 2) - 1
        fieldState.createEnemyBulletObject(bullet, this.centerX, this.centerY)
      }
    }
  }
}

class TowerEnemyGroup1LaserAlpha extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.laserAlpha)
    this.setEnemyByCpStat(100, 18)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerLaserAlpha, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareRed)
    this.isPossibleExit = false
    this.setMoveSpeed(0, 1)
    this.attackDelay = new DelayData(300)
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = TowerEnemy.bulletLaser.getCreateObject()
      fieldState.createEnemyBulletObject(bullet, this.x, this.centerY)
    }
  }

  processMove () {
    super.processMove()

    // 화면 오른쪽에 붙게끔 강제 이동
    if (this.x + this.width < graphicSystem.CANVAS_WIDTH) {
      this.x++
    }
  }
}

class TowerEnemyGroup1LaserMini extends TowerEnemyGroup1LaserAlpha {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.laserMini)
    this.setEnemyByCpStat(22, 12)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerLaserMini, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareGrey)
    this.attackDelay.delay = 60
    this.BASE_DELAY = 150
    this.RANDOM_DELAY = 16
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = TowerEnemy.bulletLaserMini.getCreateObject()
      fieldState.createEnemyBulletObject(bullet, this.x, this.centerY)
      this.attackDelay.delay = Math.floor(Math.random() * this.RANDOM_DELAY) + this.BASE_DELAY
    }
  }
}

class TowerEnemyGroup1LaserMini2 extends TowerEnemyGroup1LaserMini {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.laserMiniGrey)
    this.setEnemyByCpStat(24, 12)
    this.BASE_DELAY = 135
    this.RANDOM_DELAY = 22
  }
}

class TowerEnemyGroup1I extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.I)
    this.setEnemyByCpStat(50, 8)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerI, imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDieI, 3)
    this.setRandomMoveSpeed(4, 4, true)
    this.BASE_WIDTH = this.imageData.width
    this.BASE_HEIGHT = this.imageData.height
    this.isExitToReset = true
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 0, 85, 15),
      this.getCollisionAreaCalcurationObject(0, 65, 85, 15),
      this.getCollisionAreaCalcurationObject(35, 9, 15, 62),
    ]
  }

  processState () {
    // hp가 줄어들수록 크기 증가, 대략적인 비율로 계산
    // 100% = 기본 크기, 20%이하 = 최대 크기
    const MIN_SIZE = 1
    const MAX_SIZE = 3
    const START_PERCENT = 0.8
    const MULTIPLE_BASE = 0.5
    let percent = (this.hp / this.hpMax) // hp 비율 계산
    let multiple = ((START_PERCENT - percent) * MULTIPLE_BASE) + 1 // hp 비율이 줄어들수록 크기가 증가해야 하기 때문에 시작퍼센트 - 현재퍼센트를 기준으로 크기 정의
    if (multiple < MIN_SIZE) multiple = MIN_SIZE
    if (multiple > MAX_SIZE) multiple = MAX_SIZE
    this.setWidthHeight(Math.floor(this.BASE_WIDTH * multiple), Math.floor(this.BASE_HEIGHT * multiple))

    // 크기에 따라서 죽음 이펙트 크기도 조정
    if (this.dieEffect) {
      this.dieEffect.setWidthHeight(this.width, this.height)
    }
  }
}

class TowerEnemyGroup1X extends TowerEnemy {
  static bullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDieX, 16, 0, 0)
      const imgD = imageDataInfo.towerEnemyGroup1.enemyDieX
      this.setWidthHeight(imgD.width * 2, imgD.height * 2)
    }

    process () {
      super.process()
      this.degree += 30
      if (this.elapsedFrame >= 60) {
        this.isDeleted = true
      }
    }
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 0, 65, 9),
      this.getCollisionAreaCalcurationObject(10, 8, 43, 23),
      this.getCollisionAreaCalcurationObject(17, 31, 33, 16),
      this.getCollisionAreaCalcurationObject(8, 47, 41, 21),
      this.getCollisionAreaCalcurationObject(0, 68, 65, 10),
    ]
  }

  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.X)
    this.setEnemyByCpStat(50, 11)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerX)
    this.setRandomMoveSpeed(3, 3)
    this.isExitToReset = true
  }

  processDieAfterLogic () {
    super.processDieAfterLogic()
    fieldState.createEnemyBulletObject(TowerEnemyGroup1X.bullet, this.x, this.y)
  }
}

class TowerEnemyGroup1gasiUp extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.gasiUp)
    this.setEnemyByCpStat(2, 5)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerGasi, imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.enemyDieGasiUp)
    this.setMoveSpeed(Math.random() * 2 - 1, -8)
  }

  afterInit () {
    this.x = Math.random() * graphicSystem.CANVAS_WIDTH
    this.y = graphicSystem.CANVAS_HEIGHT + this.height + 20
  }

  processPlayerCollision () {
    if (this.collisionDelay.check(false)) {
      const player = fieldState.getPlayerObject()
      const enemy = this.getCollisionArea()[0]

      if (collision(player, enemy)) {
        // 플레이어에 닿았다면 해당 가시는 hp가 0이되어 파괴됨
        player.addDamage(this.attack)
        this.hp = 0
      }
    }
  }

  processMove () {
    const SECTION_SIZE = 240
    const MARGIN = 10
    if (this.y + this.height + SECTION_SIZE < 0) {
      this.y = graphicSystem.CANVAS_HEIGHT + SECTION_SIZE - MARGIN
    } else if (this.y > graphicSystem.CANVAS_HEIGHT + SECTION_SIZE) {
      this.y = -SECTION_SIZE + MARGIN
    }

    super.processMove()
  }
}

class TowerEnemyGroup1gasiDown extends TowerEnemyGroup1gasiUp {
  constructor () {
    super()
    // 상속받은 개체를 기준으로 이미지와 이동 속도만 다름
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.gasiDown)
    this.setMoveSpeed(Math.random() * 2 - 1, 8)
    this.setDieEffectTemplet(this.dieSound, this.imageSrc, imageDataInfo.towerEnemyGroup1.enemyDieGasiDown)
  }

  afterInit () {
    super.afterInit()
    this.y = 0 - 20
  }
}

/**
 * 도형별 관계 (기본 dps: 104%, 108%, 다이아 150%)
 * 
 * 4각형 -> 8각형 -> 6각형 -> 5각형 -> 4각형, 다이아 -> 다이아
 * 
 * 메인 체력 -> 4각형, 5각형: hp 40%, 6각형, 8각형: hp 48%, 다이아: 75%
 * 
 * 미니 체력 -> 4각형, 8각형: hp 64%, 5각형, 6각형: hp: 60%, 다이아: 75%
 */
class TowerEnemyPentaTemplete extends TowerEnemy {
  static subTypeList = {
    SQUARE: 'square',
    SQUARE_MINI: 'squareMini',
    DIAMOND: 'diamond',
    DIAMOND_MINI: 'diamondMini',
    PENTAGON: 'pentagon',
    PENTAGON_MINI: 'pentagonMini',
    HEXAGON: 'hexagon',
    HEXAGON_MINI: 'hexagonMini',
    OCTAGON: 'octagon',
    OCTAGON_MINI: 'octagonMini',
    PENTA_SHADOW: 'pentaShadow',
    PENTA_LIGHT: 'pentaLight',
    HEXA_SHADOW: 'hexaShadow',
    HEXA_LIGHT: 'hexaLight',
    OCTA_SHADOW: 'octaShadow',
    OCTA_LIGHT: 'octaLight',
  }

  constructor () {
    super()
    this.subTypeList = TowerEnemyPentaShadowTemplete.subTypeList
    this.moveDelay = new DelayData(120)
    this.moveDelay.setCountMax()
  }

  /** 
   * 도형 자동 설정 장치 (체력 및 이미지 데이터 자동 설정) 
   * @param {string} subType TowerEnemyGroup1SquareTemplete 에 있는 subTypeList중 하나
   */
  setAutoFigure (subType) {
    let typeList = TowerEnemyPentaTemplete.subTypeList

    /** @type {[number, number, boolean, ImageDataObject]} cpBaseHp, attack, miniOption, imageData,  */ 
    let arrayData = [0, 0, false, imageDataInfo.towerEnemyGroup1.square]

    /** @type {[string, ImageDataObject]} dieSound, dieEffectImageData */ 
    let effectData = ['', imageDataInfo.enemyDieEffectList.squareGrey]

    // 데이터 설정
    switch (subType) {
      case typeList.DIAMOND: arrayData = [25, 15, false, imageDataInfo.towerEnemyGroup1.diamond]; break
      case typeList.SQUARE: arrayData = [10, 12, false, imageDataInfo.towerEnemyGroup1.square]; break
      case typeList.PENTAGON: arrayData = [10, 12, false, imageDataInfo.towerEnemyGroup1.pentagon]; break
      case typeList.HEXAGON: arrayData = [11, 12, false, imageDataInfo.towerEnemyGroup1.hexagon]; break
      case typeList.OCTAGON: arrayData = [12, 12, false, imageDataInfo.towerEnemyGroup1.octagon]; break
      case typeList.DIAMOND_MINI: arrayData = [25, 15, true, imageDataInfo.towerEnemyGroup1.diamond]; break
      case typeList.SQUARE_MINI: arrayData = [10, 12, true, imageDataInfo.towerEnemyGroup1.square]; break
      case typeList.PENTAGON_MINI: arrayData = [10, 12, true, imageDataInfo.towerEnemyGroup1.pentagon]; break
      case typeList.HEXAGON_MINI: arrayData = [11, 12, true, imageDataInfo.towerEnemyGroup1.hexagon]; break
      case typeList.OCTAGON_MINI: arrayData = [12, 12, true, imageDataInfo.towerEnemyGroup1.octagon]; break
    }

    let soundDie = soundSrc.enemyDie
    let effectDie = imageDataInfo.enemyDieEffectList

    // 사운드 설정
    switch (subType) {
      case typeList.DIAMOND: case typeList.DIAMOND_MINI: effectData = [soundDie.enemyDieTowerDiamond, effectDie.diamondBlue]; break
      case typeList.SQUARE: case typeList.SQUARE_MINI: effectData = [soundDie.enemyDieTowerSquare, effectDie.metalSlashGrey]; break
      case typeList.PENTAGON: case typeList.PENTAGON_MINI: effectData = [soundDie.enemyDieTowerPentagon, effectDie.metalSlashGreen]; break
      case typeList.HEXAGON: case typeList.HEXAGON_MINI: effectData = [soundDie.enemyDieTowerHexagon, effectDie.metalSlashGreen]; break
      case typeList.OCTAGON: case typeList.OCTAGON_MINI: effectData = [soundDie.enemyDieTowerOctagon, effectDie.metalSlashGreen]; break
    }

    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, arrayData[3]) // 이미지 자동 설정
    this.setEnemyByCpStat(arrayData[0], arrayData[1]) // 체력, 공격력 설정
    this.subType = subType // 서브타입 지정

    // 미니타입인 경우 크기 작아짐
    if (arrayData[2]) this.setWidthHeight(Math.floor(this.width / 1.5), Math.floor(this.height / 1.5))
    
    // 참고: 죽음 이펙트의 템플릿은 기본 템플릿을 사용합니다. 해당 적 전용 죽음 이펙트는 없습니다.
    this.setDieEffectTemplet(effectData[0], imageSrc.enemyDie.effectList, effectData[1]) // 죽음 사운드, 이펙트 설정
  }

  /** 해당 객체가 죽었을 때 새로운 적을 다시 생성합니다. (단 미니타입은 해당하지 않음) */
  createNewEnemy () {
    let typeList = TowerEnemyPentaTemplete.subTypeList
    switch (this.subType) {
      case typeList.DIAMOND: fieldState.createEnemyObject(ID.enemy.towerEnemyGroup1.diamondMini, this.centerX, this.centerY); break
      case typeList.SQUARE: fieldState.createEnemyObject(ID.enemy.towerEnemyGroup1.octagonMini, this.centerX, this.centerY); break
      case typeList.PENTAGON: fieldState.createEnemyObject(ID.enemy.towerEnemyGroup1.squareMini, this.centerX, this.centerY); break
      case typeList.HEXAGON: fieldState.createEnemyObject(ID.enemy.towerEnemyGroup1.pentagonMini, this.centerX, this.centerY); break
      case typeList.OCTAGON: fieldState.createEnemyObject(ID.enemy.towerEnemyGroup1.hexagonMini, this.centerX, this.centerY); break
    }
  }

  processDieAfterLogic () {
    super.processDieAfterLogic()
    this.createNewEnemy()
  }

  processMove () {
    super.processMove()
    if (this.moveDelay.check()) {
      this.setMoveSpeed(this.moveSpeedX + Math.random() * 4 - 2, this.moveSpeedY + Math.random() * 4 - 2)

      // 최소 속도 조정
      if (this.moveSpeedX > 0 && this.moveSpeedX < 1) this.moveSpeedX = 1
      if (this.moveSpeedX < 0 && this.moveSpeedX > -1) this.moveSpeedX = -1
      if (this.moveSpeedY > 0 && this.moveSpeedY < 1) this.moveSpeedY = 1
      if (this.moveSpeedY < 0 && this.moveSpeedY > -1) this.moveSpeedY = -1
    }
  }
}

// 도형 계열
class TowerEnemyGroup1Square extends TowerEnemyPentaTemplete {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.SQUARE) }
}
class TowerEnemyGroup1SquareMini extends TowerEnemyPentaTemplete {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.SQUARE_MINI) }
}
class TowerEnemyGroup1Pentagon extends TowerEnemyPentaTemplete {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.PENTAGON) }
  getCollisionArea () { 
    return [this.getCollisionAreaCalcurationObject(17, 25, 67, 75),
      this.getCollisionAreaCalcurationObject(0, 30, 100, 28),
      this.getCollisionAreaCalcurationObject(41, 0, 18, 25),
      this.getCollisionAreaCalcurationObject(20, 18, 58, 17)]
  }
}
class TowerEnemyGroup1PentagonMini extends TowerEnemyGroup1Pentagon {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.PENTAGON_MINI) }
}
class TowerEnemyGroup1Hexagon extends TowerEnemyPentaTemplete {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.HEXAGON) }
  getCollisionArea () {
    return [this.getCollisionAreaCalcurationObject(30, 0, 50, 100),
      this.getCollisionAreaCalcurationObject(0, 38, 110, 22),
      this.getCollisionAreaCalcurationObject(18, 19, 74, 65),]
  }
}
class TowerEnemyGroup1HexagonMini extends TowerEnemyGroup1Hexagon {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.HEXAGON_MINI) }
}
class TowerEnemyGroup1Octagon extends TowerEnemyPentaTemplete {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.OCTAGON) }
  getCollisionArea () {
    return [   this.getCollisionAreaCalcurationObject(39, 0, 52, 130),
      this.getCollisionAreaCalcurationObject(0, 39, 130, 52),
      this.getCollisionAreaCalcurationObject(19, 18, 92, 93)]
  }
}
class TowerEnemyGroup1OctagonMini extends TowerEnemyGroup1Octagon {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.OCTAGON_MINI) }
}
class TowerEnemyGroup1Diamond extends TowerEnemyPentaTemplete {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.DIAMOND) }
  getCollisionArea () {
    return [ this.getCollisionAreaCalcurationObject(0, 35, undefined, 30),
      this.getCollisionAreaCalcurationObject(35, 0, 30, undefined)]
  }
}
class TowerEnemyGroup1DiamondMini extends TowerEnemyPentaTemplete {
  constructor () { super(); this.setAutoFigure(TowerEnemyPentaTemplete.subTypeList.DIAMOND_MINI) }
}


class TowerEnemyGroup1CrazyRobot extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.crazyRobot)
    this.setEnemyByCpStat(10000, 12)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerBossRobot1, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedOrange)
    this.dieAfterDeleteDelay = new DelayData(180)

    this.STATE_ROCKET_CHASE = 'rocketChase'
    this.STATE_ROCKET_LEFT = 'rocketLeft'
    this.STATE_ROBOT_MOVE = 'robotMove'
    this.STATE_ROCKET_LINE = 'rocketLine'
    this.STATE_BEGIN_HYPER = 'beginHyper'
    this.STATE_HYPER_MODE = 'hyperMode'
    this.STATE_WAIT = 'wait'
    this.state = this.STATE_WAIT
    this.prevState = this.STATE_WAIT
    this.stateDelay = new DelayData(120)
    this.moveDelay = new DelayData(60)
    this.attackDelay = new DelayData(120)
    this.isPossibleExit = false

    this.speedValueX = 0
    this.speedValueY = 0

    /** 하이퍼 모드가 되는 체력의 기준점 (배율형태로 표시 = 0.2 = 20%) */
    this.HYPER_MODE_HP_MULTIPLE = 0.2
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(50, 0, 150, undefined),
      this.getCollisionAreaCalcurationObject(0, 50, undefined, 190)
    ]
  }

  processState () {
    this.processStateRandomPattern() // 1페이즈 (hp 20% 이상)
    this.processStateHyperPattern() // 2페이즈 (hp 20% 미만)
  }

  /**
   * 1페이즈 (hp 20% 이상)
   * 
   * 해당 패턴이 수행된 후 2초의 대기시간을 가짐. 패턴은 무작위로 지정되며, 다만 같은 패턴을 2번 연속으로 하지 않습니다.
   * 
   * 패턴에 대한 조건 및 내용은 함수 내부 참고
   */
  processStateRandomPattern () {
    // 상태 딜레이를 채울때마다만 상태가 변화합니다. 그 외의 경우 무시
    if (!this.stateDelay.check()) return

    // hp가 HYPER 모드 발동 기준보다 낮다면 이 함수를 처리하지 않음
    if (this.hp < this.hpMax * this.HYPER_MODE_HP_MULTIPLE) return
    if (this.state !== this.STATE_WAIT) { // 대기 상태가 아니면 강제로 대기 상태로 지정
      this.state = this.STATE_WAIT
      this.stateDelay.delay = 120 // 딜레이 2초
      return
    }

    this.stateDelay.delay = 480 // 각 패턴은 8초(60프레임 x 8)의 진행 시간을 가짐
    let random = Math.floor(Math.random() * 4)
    let targetState
    switch (random) {
      case 0: targetState = this.STATE_ROCKET_CHASE; break
      case 1: targetState = this.STATE_ROCKET_LEFT; break
      case 2: targetState = this.STATE_ROCKET_CHASE; break
      default: targetState = this.STATE_ROCKET_LINE; break
    }

    // 이전 상태와 현재 지정된 상태가 같다면 해당 상태로 변경
    if (targetState !== this.prevState) {
      this.state = targetState
      this.prevState = targetState
    } else {
      // 만약 이전값과는 다르게 중복된 경우에는, 다른 구조를 사용하여 강제 대입
      switch (targetState) {
        case this.STATE_ROCKET_CHASE: this.state = this.STATE_ROCKET_LEFT; break
        case this.STATE_ROCKET_LEFT: this.state = this.STATE_ROCKET_CHASE; break
        case this.STATE_ROBOT_MOVE: this.state = this.STATE_ROCKET_LINE; break
        case this.STATE_ROCKET_LINE: this.state = this.STATE_ROCKET_CHASE; break
        default: this.state = this.STATE_ROCKET_CHASE; break
      }

      this.prevState = this.state // 이전 상태 저장
    }
  }

  /**
   * 2페이즈 (hp 20% 미만)
   * 
   * 이 패턴은 진입 상태가 존재하며, 진입 이후 하이퍼 모드가 발동됨
   */
  processStateHyperPattern () {
    // 상태 대기시간과 관계없이 해당 패턴이 진행됨
    // hp가 HYPER 모드 발동 기준보다 높다면(1페이즈에 해당되므로) 무효
    if (this.hp >= this.hpMax * this.HYPER_MODE_HP_MULTIPLE) return
    const isHyperBegin = this.state === this.STATE_ROCKET_LEFT
      || this.state === this.STATE_ROCKET_LINE
      || this.state === this.STATE_WAIT
      || this.state === this.STATE_ROBOT_MOVE
      || this.state === this.STATE_ROCKET_CHASE

    if (isHyperBegin) {
      this.state = this.STATE_BEGIN_HYPER // 체력이 처음으로 20% 미만일경우 하이퍼 모드로 진입함
      this.stateDelay.count = 0 // 카운트 리셋
      this.stateDelay.delay = 180
    } else if (this.state === this.STATE_BEGIN_HYPER && this.stateDelay.check()) {
      this.stateDelay.delay = 120
      this.state = this.STATE_HYPER_MODE // 하이퍼 모드로 변경, 이 이후에는 상태변화 없음
    }
  }

  processMove () {
    super.processMove()
    if (this.state === this.STATE_ROCKET_CHASE || this.state === this.STATE_ROCKET_LEFT || this.state === this.STATE_ROCKET_LINE) {
      // x축이 오른쪽 끝에 붙지 않는다면 가능한 오른쪽으로 이동
      // y축으로는 랜덤한 속도로 이동
      if (this.moveDelay.check()) {
        this.setMoveSpeed(0, Math.random() * 3 + 1)
      }
      
      if (this.x + this.width < graphicSystem.CANVAS_WIDTH) {
        this.x += 16
      }
    } else if (this.state === this.STATE_ROBOT_MOVE) {
      if (this.stateDelay.count <= 60) {
        this.speedValueX += 0.18
        this.speedValueY += 0.18
        if (this.speedValueX > 10) this.speedValueX = 10
        if (this.speedValueY > 10) this.speedValueY = 10
      } else if (this.stateDelay.count >= this.stateDelay.delay - 60) {
        this.speedValueX -= 0.18
        this.speedValueY -= 0.18
        if (this.speedValueX < 0) this.speedValueX = 0
        if (this.speedValueY < 0) this.speedValueY = 0
      }

      this.setMoveSpeed(this.speedValueX, this.speedValueY)
    } else if (this.state == this.STATE_HYPER_MODE) {
      this.moveDelay.delay = 6
      if (this.moveDelay.check()) {
        this.setRandomMoveSpeed(8, 8, true)
      }
    } else if (this.state === this.STATE_BEGIN_HYPER) {
      this.setMoveSpeed(0, 0)
      if (this.centerX > graphicSystem.CANVAS_WIDTH_HALF + 10) {
        this.x -= 4
      } else if (this.centerX < graphicSystem.CANVAS_WIDTH_HALF - 10) {
        this.x += 4
      }

      if (this.centerY > graphicSystem.CANVAS_HEIGHT_HALF + 10) {
        this.y -= 4
      } else if (this.centerY < graphicSystem.CANVAS_HEIGHT_HALF - 10) {
        this.y += 4
      }
    } else if (this.state === this.STATE_WAIT) {
      this.speedValueX = 0
      this.speedValueY = 0
      this.setMoveSpeed(0, 0)
    }
  }

  processAttack () {
    const T = TowerEnemyGroup1CrazyRobot
    if (this.state === this.STATE_ROCKET_CHASE) {
      this.attackDelay.delay = 30
      if (this.attackDelay.check()) {
        soundSystem.play(soundSrc.enemyAttack.towerAttackRocket)
        const bullet = new T.RobotRocketChaseBullet()
        fieldState.createEnemyBulletObject(bullet, this.centerX, this.centerY)
      }
    } else if (this.state === this.STATE_ROCKET_LEFT) {
      this.attackDelay.delay = 12
      if (this.attackDelay.check()) {
        soundSystem.play(soundSrc.enemyAttack.towerAttackRocket)
        const bullet = new T.RobotRocketBullet()
        bullet.setMoveSpeed(-6, 0)
        fieldState.createEnemyBulletObject(bullet, this.centerX, Math.random() * (graphicSystem.CANVAS_HEIGHT - 40))
      }
    } else if (this.state === this.STATE_ROBOT_MOVE) {
      // this.attackDelay.delay = 60
      // if (this.attackDelay.check()) {
      //   soundSystem.play(soundSrc.enemyAttack.towerAttackRocket)
      //   for (let i = 0; i < 4; i++) {
      //     let subBullet = new T.RobotRocketBullet()
      //     subBullet.setRandomMoveSpeed(3, 3, true)
      //     fieldState.createEnemyBulletObject(subBullet, this.centerX, this.centerY)
      //   }
      // }
    } else if (this.state === this.STATE_ROCKET_LINE) {
      this.attackDelay.delay = 40
      if (this.attackDelay.check()) {
        soundSystem.play(soundSrc.enemyAttack.towerAttackRocket)
        let subBullet1 = new T.RobotRocketBullet()
        let subBullet2 = new T.RobotRocketBullet()
        let subBullet3 = new T.RobotRocketBullet()
        // 한쪽은 x축방향의 속도를 1 올리고 (양수인지 음수인지 판단함)
        // 다른 한쪽은 y축방향의 속도를 1 올림
        subBullet1.setMoveSpeed(-4, -2)
        subBullet2.setMoveSpeed(-4, 0)
        subBullet3.setMoveSpeed(-4, 2)
        const targetY = this.y + Math.floor(Math.random() * this.height)
        fieldState.createEnemyBulletObject(subBullet1, this.centerX, targetY)
        fieldState.createEnemyBulletObject(subBullet2, this.centerX, targetY)
        fieldState.createEnemyBulletObject(subBullet3, this.centerX, targetY)
      }
    } else if (this.state === this.STATE_HYPER_MODE) {
      this.attackDelay.delay = 20
      if (this.attackDelay.check()) {
        soundSystem.play(soundSrc.enemyAttack.towerAttackRocket)
        for (let i = 0; i < 2; i++) {
          let subBullet = new T.RobotRocketBullet()
          subBullet.setRandomMoveSpeed(6, 6, true)
          fieldState.createEnemyBulletObject(subBullet, this.centerX, this.centerY)
        }
      }
    }
  }

  processDieAfter () {
    super.processDieAfter()
    if (this.isDied) {
      if (this.dieAfterDeleteDelay.count <= this.dieAfterDeleteDelay.delay - 30 && this.dieAfterDeleteDelay.divCheck(6)) {
        soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossRobot1)
        if (this.dieEffect != null) {
          this.dieEffect.setWidthHeight(40, 40)
          fieldState.createEffectObject(this.dieEffect.getObject(), this.x + (Math.random() * this.width), this.y + (Math.random() * this.height))
        }
      }

      if (this.dieAfterDeleteDelay.count == this.dieAfterDeleteDelay.delay - 1) {
        soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossCommon)
        if (this.dieEffect != null) {
          this.dieEffect.setWidthHeight(this.width, this.height)
          fieldState.createEffectObject(this.dieEffect.getObject(), this.x, this.y)
        }
      }
    }
  }

  static RobotRocketBullet = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.towerEnemyGroup1, imageDataInfo.towerEnemyGroup1.bulletBossRocket, 0)
    }

    processMove () {
      super.processMove()
      const atangent = Math.atan2(this.moveSpeedY, this.moveSpeedX)
      this.degree = atangent * (180 / Math.PI)

      let player = fieldState.getPlayerObject()
      if (this.y < 0 || this.y + this.height > graphicSystem.CANVAS_HEIGHT 
        || this.x < 0 || this.x + this.width > graphicSystem.CANVAS_WIDTH + 20
        || collisionClass.collisionOBB(this, player)) {
        const bullet = new TowerEnemyGroup1CrazyRobot.RobotRocketBomb()
        fieldState.createEnemyBulletObject(bullet, this.x - 10, this.y - 10)
        soundSystem.play(soundSrc.enemyAttack.towerAttackRocketBomb)
        this.isDeleted = true
      }
    }
  }

  static RobotRocketChaseBullet = class extends TowerEnemyGroup1CrazyRobot.RobotRocketBullet {
    constructor () {
      super()
    }

    processMove () {
      super.processMove()
      if (this.elapsedFrame >= 20 && this.elapsedFrame <= 80) {
        // 플레이어 추적
        let player = fieldState.getPlayerObject()
        let speedX = (player.x - this.x) / 100
        let speedY = (player.y - this.y) / 100

        if (this.moveSpeedX >= speedX + 0.3) this.moveSpeedX -= 0.11
        if (this.moveSpeedX <= speedX - 0.3) this.moveSpeedX += 0.11
        if (this.moveSpeedY >= speedY + 0.3) this.moveSpeedY -= 0.11
        if (this.moveSpeedY <= speedY - 0.3) this.moveSpeedY += 0.11
      }
    }
  }

  static RobotRocketBomb = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.intruderEnemy, imageDataInfo.intruderEnemy.leverMissileBomb, 4)
      this.setAutoImageData(this.imageSrc, this.imageData, 4)
      this.attackDelay = new DelayData(10)
      this.setWidthHeight(this.width * 2, this.height * 2)
    }

    processCollision () {
      if (this.attack === 0) return
      if (!this.attackDelay.check()) return

      let player = fieldState.getPlayerObject()
      let playerSendXY = { x: player.x, y: player.y, width: player.width, height: player.height}
      
      if (collision(playerSendXY, this)) {
        player.addDamage(this.attack)
      }
    }

    processState () {
      if (this.elapsedFrame >= 4 * imageDataInfo.intruderEnemy.leverMissileBomb.frame) {
        this.isDeleted = true
      }
    }
  }
}

class TowerEnemyBarTemplete extends TowerEnemy {
  static dieSoundList = [
    soundSrc.enemyDie.enemyDieTowerBar1,
    soundSrc.enemyDie.enemyDieTowerBar2,
    soundSrc.enemyDie.enemyDieTowerBar3,
  ]
  static collisionSoundList = [
    soundSrc.enemyAttack.towerBarAttack1,
    soundSrc.enemyAttack.towerBarAttack2,
    soundSrc.enemyAttack.towerBarAttack3,
  ]

  constructor () {
    super()
    this.imageSrc = imageSrc.enemy.towerEnemyGroup2 // 이미지 경로 직접 지정
    this.setEnemyByCpStat(10, 8)
    this.isExitToReset = true
    this.collisionDelay.delay = 30 // 초당 2회 타격 (12프레임마다 반복)
    this.collisionDelay.count = -30 // 30프레임 이후부터 플레이어랑 충돌할 수 있음
    this.moveDelay = new DelayData(60)
    this.moveDelay.setCountMax()
    this.color = ''
    this.colorList = {
      CYAN: 'cyan',
      LIME: 'lime',
      ORANGE: 'ornage',
      VIOLET: 'violet',
      YELLOW: 'yellow',
      GREY: 'grey'
    }

    this.setColor() // 자동 색 설정
    this.collisionSoundSrc = ''

    // 랜덤한 죽음 사운드 결정
    const dieSoundList = TowerEnemyBarTemplete.dieSoundList
    const dieSoundNumber = Math.floor(Math.random() * dieSoundList.length)
    this.setDieEffectTemplet(dieSoundList[dieSoundNumber], imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.enemyDieBar, 30)

    const collisionSoundList = TowerEnemyBarTemplete.collisionSoundList
    const collisionSoundNumber = Math.floor(Math.random() * collisionSoundList.length)
    this.collisionSoundSrc = collisionSoundList[collisionSoundNumber]
  }

  afterInit () {
    // 밑에서 등장할 수 있도록 좌표 조정
    this.x = Math.random() * (graphicSystem.CANVAS_WIDTH - this.width)
    this.y = graphicSystem.CANVAS_HEIGHT
  }

  processPlayerCollisionSuccessAfter () {
    // 충돌 사운드 재생
    soundSystem.play(this.collisionSoundSrc)
  }

  /**
   * 해당 bar의 색을 지정합니다.
   * 
   * 잘못된 색이 지정되면 기본값으로 설정하고, 값이 비어있다면 랜덤한 색이 결정됩니다.
   * @param {string} color 
   */
  setColor (color = '') {
    this.color = color
    if (color === '') {
      let random = Math.floor(Math.random() * 6)
      switch (random) {
        case 0: this.color = this.colorList.CYAN; break
        case 1: this.color = this.colorList.GREY; break
        case 2: this.color = this.colorList.LIME; break
        case 3: this.color = this.colorList.ORANGE; break
        case 4: this.color = this.colorList.VIOLET; break
        default: this.color = this.colorList.YELLOW; break
      }
    }

    let imgD = imageDataInfo.towerEnemyGroup2
    switch (this.color) {
      case this.colorList.CYAN: this.setAutoImageData(this.imageSrc, imgD.barCyan); break
      case this.colorList.GREY: this.setAutoImageData(this.imageSrc, imgD.barGrey); break
      case this.colorList.LIME: this.setAutoImageData(this.imageSrc, imgD.barLime); break
      case this.colorList.ORANGE: this.setAutoImageData(this.imageSrc, imgD.barOrange); break
      case this.colorList.VIOLET: this.setAutoImageData(this.imageSrc, imgD.barViolet); break
      case this.colorList.YELLOW: this.setAutoImageData(this.imageSrc, imgD.barYellow); break
      default: this.setAutoImageData(this.imageSrc, imgD.barYellow, 2); break // 기본값
    }
  }

  processMove () {
    super.processMove()
    if (!this.moveDelay.check()) return

    let random = Math.random() * 100
    if (random < 90) {
      if (Math.abs(this.moveSpeedY) > 3) this.moveSpeedY = -1 // 급발진 다시 복구하기

      // 이동속도 변경 (+- 0.2정도 랜덤하게)
      let speedChangeX = Math.random() * 0.4 - 0.2
      let speedChangeY = Math.random() * 0.4 - 0.2
      this.setMoveSpeed(this.moveSpeedX + speedChangeX, this.moveSpeedY + speedChangeY)
    } else {
      this.setMoveSpeed(this.moveSpeedX, -5) // ?! 갑자기 자기 혼자 급발진?
      this.moveDelay.count = this.moveDelay.delay - 60 // 1초동안... (급발진...)
    }

    // 최소 속도 제한 (최대 속도는 제한이 없음... 확률상 무한속도는 어려움)
    if (this.moveSpeedY > -1) {
      this.moveSpeedY = -1
    }
  }
}

class TowerEnemyGroup2BarYellow extends TowerEnemyBarTemplete {
  constructor () { super(); this.setColor(this.colorList.YELLOW) }
}
class TowerEnemyGroup2BarLime extends TowerEnemyBarTemplete {
  constructor () { super(); this.setColor(this.colorList.LIME) }
}
class TowerEnemyGroup2BarViolet extends TowerEnemyBarTemplete {
  constructor () { super(); this.setColor(this.colorList.VIOLET) }
}
class TowerEnemyGroup2BarOrnage extends TowerEnemyBarTemplete {
  constructor () { super(); this.setColor(this.colorList.ORANGE) }
}
class TowerEnemyGroup2BarCyan extends TowerEnemyBarTemplete {
  constructor () { super(); this.setColor(this.colorList.CYAN) }
}
class TowerEnemyGroup2BarGrey extends TowerEnemyBarTemplete {
  constructor () { super(); this.setColor(this.colorList.Grey) }
}

class TowerEnemyGroup2Jagijang extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.jagijang, 4)
    this.setEnemyByCpStat(44, 10)
    this.dieAfterDeleteDelay = new DelayData(60)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerJagijang)
    this.setMoveSpeed(1, 0)

    this.bullet = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.bulletJagijang, 10)
    this.attackDelay = new DelayData(180)
    this.moveDelay = new DelayData(30)
    this.isExitToReset = true

    this.lightningEnimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.jagijangLightning, 3, -1)
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(6, 0, 8, 140),
      this.getCollisionAreaCalcurationObject(126, 0, 8, 140),
      this.getCollisionAreaCalcurationObject(30, 30, 80, 80)
    ]
  }

  processEnimation () {
    super.processEnimation()
    this.lightningEnimation.process()
  }

  processAttack () {
    if (this.attackDelay.check()) {
      soundSystem.play(soundSrc.enemyAttack.towerJagijangAttack)
      let bullet = this.bullet.getCreateObject()
      let player = fieldState.getPlayerObject()
      bullet.x = this.centerX - 25
      bullet.y = this.centerY - 25
      bullet.setMoveSpeedChaseLine(player.x, player.y, 120, 2)
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }
  }

  processMove () {
    super.processMove()
    if (this.moveDelay.check()) {
      // 이동속도 변경 (+- 0.2정도 랜덤하게)
      let speedChangeX = Math.random() * 0.8 - 0.4
      let speedChangeY = Math.random() * 0.8 - 0.4
      this.setMoveSpeed(this.moveSpeedX + speedChangeX, this.moveSpeedY + speedChangeY)
    }
  }

  display () {
    if (this.isDied) {
      let alpha = 1 / this.dieAfterDeleteDelay.delay * (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count)
      this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.enemyDieJagijang, this.x + 20, this.y + 20, undefined, undefined, 0, 0, alpha)
    } else  {
      super.display()
      this.lightningEnimation.display(this.x + 15, this.centerY - 30)
    }
  }
}

class TowerEnemyGroup2Lightning extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.lightning)
    this.setEnemyByCpStat(40, 2)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerLightning, imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.enemyDieLightning, 4)
    this.moveDelay = new DelayData(240)
    this.moveDelay.setCountMax()
    this.attackDelay = new DelayData(60)
    this.finishX = 0
    this.finishY = 0
    this.finishMoveSpeedX = 0
    this.finishMoveSpeedY = 0

    this.STATE_NORMAL = ''
    this.STATE_LIGHTNING_WAIT = 'lightningWait'
    this.STATE_LIGHTNING = 'lightning'
    this.STATE_MAGNET = 'magnet'
    this.state = this.STATE_NORMAL

    this.lightObject = {x: this.x - 20, y: this.y - 20, width: 180, height: 180}
    this.lightEffect = new CustomEffect(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.lightningAttack, this.lightObject.width, this.lightObject.height, 2)
    this.lightningEnimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.lightningEnimation, 3, -1)
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(27, 0, 24, 60),
      this.getCollisionAreaCalcurationObject(0, 32, 90, 28),
      this.getCollisionAreaCalcurationObject(26, 53, 50, 14),
      this.getCollisionAreaCalcurationObject(28, 67, 31, 12),
      this.getCollisionAreaCalcurationObject(0, 73, 32, 27)
    ]
  }

  processEnimation () {
    super.processEnimation()
    if (this.state === this.STATE_LIGHTNING_WAIT) {
      this.lightningEnimation.process()
    }
  }

  processAttack () {
    if (this.state === this.STATE_NORMAL) return

    this.lightObject.x = this.x - 50
    this.lightObject.y = this.y - 50
    if (this.attackDelay.check()) {
      if (this.state === this.STATE_LIGHTNING_WAIT) {
        this.state = this.STATE_LIGHTNING
        soundSystem.play(soundSrc.enemyAttack.towerLightningAttack)
      } else if (this.state === this.STATE_LIGHTNING) {
        this.state = this.STATE_NORMAL
      }
    }

    if (this.state === this.STATE_LIGHTNING && this.attackDelay.divCheck(6)) {
      let player = fieldState.getPlayerObject()
      if (collision(player, this.lightObject)) {
        player.addDamage(4)
      }
    }

    if (this.state === this.STATE_LIGHTNING && this.attackDelay.divCheck(12)) {
      fieldState.createEffectObject(this.lightEffect.getObject(), this.lightObject.x, this.lightObject.y)
    }
  }

  processMove () {
    super.processMove()
    if (this.state !== this.STATE_NORMAL) return

    if (this.moveDelay.count === 1) {
      // 일정시간 간격으로 플레이어가 있는 위치로 이동
      let player = fieldState.getPlayerObject()
      this.finishX = player.centerX
      this.finishY = player.centerY
      this.finishMoveSpeedX = (this.centerX - player.centerX) / this.moveDelay.delay
      this.finishMoveSpeedY = (this.centerY - player.centerY) / this.moveDelay.delay
      this.setMoveSpeed(this.finishMoveSpeedX, this.finishMoveSpeedY)
    }

    if (this.moveDelay.check()) {
      this.state = this.STATE_LIGHTNING_WAIT
      this.setMoveSpeed(0, 0)
    }
  }

  display () {
    super.display()
    if (this.state === this.STATE_LIGHTNING_WAIT) {
      this.lightningEnimation.display(this.x, this.y)
    }
  }
}

class TowerEnemyGroup2Magnet extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.magnet)
    this.setEnemyByCpStat(50, 10)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerMagnet, imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.enemyDieMagnet, 30)
    this.moveDelay = new DelayData(60)
    this.effectDelay = new DelayData(12)
    this.attackDelay = new DelayData(60)
    this.setMoveSpeed(2, 0)

    this.STATE_MAGNET = 'magnet'
    this.magnetEffectBlue = new CustomEffect(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.magnetMagneticBlue, undefined, undefined, 2)
    this.magnetEffectRed = new CustomEffect(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.magnetMagneticRed, undefined, undefined, 2)
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 0, 115, 25),
      this.getCollisionAreaCalcurationObject(0, 75, 115, 25),
      this.getCollisionAreaCalcurationObject(115, 5, 15, 92),
      this.getCollisionAreaCalcurationObject(130, 20, 20, 60),
    ]
  }

  processMove () {
    super.processMove()

    // 타겟오브젝트가 널일때만 이 작업을 실행합니다.
    if (this.targetObject == null && this.moveDelay.check()) {
      let target = fieldState.getRandomEnemyObject()

      // 타겟이 널이 아니고, 아이디가 다르고(같은 자석은 안됨), 생성id가 다르면(자기 자신 제외), 타겟된 적이 마그넷 상태가 아니면
      if (target != null && target.id !== this.id && target.createId !== this.createId && target.state !== this.STATE_MAGNET) {
        // 해당 적을 타겟적으로 지정
        this.targetObject = target
      }
    }
    
    if (this.targetObject != null) {
      if (this.attackDelay.check(false)) {
        this.setMoveSpeed(1, 0)
        this.targetObject.x = this.x - this.targetObject.width
        this.targetObject.y = this.y
      } else {
        this.setMoveSpeed(0, 0)
        this.targetObject.x += (this.x - this.targetObject.x - this.targetObject.width) / 10
        this.targetObject.y += (this.y - this.targetObject.y) / 10
      }

      if (this.attackDelay.divCheck(10)) {
        fieldState.createEffectObject(this.magnetEffectBlue, this.x - 20, this.y)
        fieldState.createEffectObject(this.magnetEffectRed, this.x - 20, this.y + 75)
      }

      // 타겟 오브젝트가 삭제 대기 상태라면 이 오브젝트를 삭제함
      if (this.targetObject.isDeleted) {
        this.targetObject = null
      }
    }
  }

  processDieAfter () {
    super.processDieAfter()
    if ((this.isDied || this.isDeleted) && this.targetObject != null) {
      // 자석이 죽을경우, 적 상태를 초기화 하고, 타겟 오브젝트는 삭제
      // 삭제 대기 상태에서도 타겟 오브젝트를 삭제함
      this.targetObject.state = ''
      this.targetObject = null
    }
  }
}

class TowerEnemyGroup2Hellla extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.setEnemyByCpStat(40, 12)
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.hellla, 2)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHellla)
    this.setMoveDirection()
    this.attackDelay.delay = 180

    this.lightObject = {x: this.x - 20, y: this.y - 20, width: 140, height: 140, speedX: 0, speedY: 0, elapsedFrame: 0}
    this.lightEnimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.lightningAttack, 2, -1)
    this.lightEnimation.setOutputSize(this.lightObject.width, this.lightObject.height)

    this.targetSpeed.xBase = 1
    this.targetSpeed.yBase = 2
    this.targetSpeed.xChange = 0.06
    this.targetSpeed.yChange = 0.06
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(63, 2, 119, 7), // 날개
      this.getCollisionAreaCalcurationObject(62, 16, 79, 71), // 몸체1
      this.getCollisionAreaCalcurationObject(132, 38, 55, 49), // 몸체유리1
      this.getCollisionAreaCalcurationObject(141, 23, 38, 11), // 몸체유리2
      this.getCollisionAreaCalcurationObject(2, 20, 60, 12), // 꼬리1
      this.getCollisionAreaCalcurationObject(2, 59, 60, 12), // 꼬리2
      this.getCollisionAreaCalcurationObject(23, 28, 39, 35), // 꼬리에너지
    ]
  }

  processEnimation () {
    super.processEnimation()
    this.lightEnimation.process()
  }

  processChangeAngle () {
    // y축의 속도에 따라 각도 조절 (단 일정 각도를 벗어나지 못함) - hellgi랑 같음
    if (this.moveSpeedY <= 0.5 && this.moveSpeedY >= -0.5) {
      this.degree = 0
    } else if (this.moveSpeedY >= 0.5) {
      this.degree = (this.moveSpeedY - 0.5) * -6
      if (this.degree > 30 && this.degree < 180) this.degree = 30
    } else if (this.moveSpeedY <= -0.5) {
      this.degree = (this.moveSpeedY + 0.5) * -6
      if (this.degree > 180 && this.degree < 330) this.degree = 330
    }

    // 이동 속도에 따라서, 좌우 반전 결정 (왼쪽이 마이너스입니다. 그래서 왼쪽방향일때만 반전 적용)
    if (this.moveSpeedX < 0) this.flip = 1
    else this.flip = 0
  }

  processAttack () {
    if (this.lightObject.elapsedFrame >= 1) {
      this.lightObject.elapsedFrame--
      this.lightObject.x += this.lightObject.speedX
      this.lightObject.y += this.lightObject.speedY

      if (this.lightObject.elapsedFrame % 6 === 0) {
        let player = fieldState.getPlayerObject()
        if (collision(player, this.lightObject)) {
          player.addDamage(4)
        }
      }
    }

    // 공격 주기가 되면 공격 개체가 사용되도록 변경
    if (this.attackDelay.check()) {
      soundSystem.play(soundSrc.enemyAttack.towerLightningAttack)
      let player = fieldState.getPlayerObject()
      this.lightObject.elapsedFrame = 60
      this.lightObject.x = this.x - 20
      this.lightObject.y = this.y - 20
      this.lightObject.speedX = (player.x - this.x) / 90
      this.lightObject.speedY = (player.y - this.y) / 90
    }
  }

  display () {
    super.display()
    if (!this.isDied && this.lightObject.elapsedFrame >= 1) {
      this.lightEnimation.display(this.lightObject.x, this.lightObject.y)
    }
  }
}
class TowerEnemyGroup2Hellpo extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.dieColor = TowerEnemyHellTemplet.dieColorList.blue
    this.setEnemyByCpStat(19, 12)
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.hellpo, 2)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHellpo)
    this.setMoveDirection()
    this.attackDelay.delay = 120
    this.daepoBullet = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.bulletHellpo, 10)
    this.targetSpeed.xBase = 2
    this.targetSpeed.yBase = 2
    this.targetSpeed.xChange = 0.2
    this.targetSpeed.yChange = 0.2
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 19, 160, 40),
      this.getCollisionAreaCalcurationObject(61, 4, 80, 5),
      this.getCollisionAreaCalcurationObject(51, 59, 109, 11),
    ]
  }

  processAttack () {
    if (this.attackDelay.check()) {
      soundSystem.play(soundSrc.enemyAttack.towerAttackDaepo)
      let bullet = this.daepoBullet.getCreateObject()
      bullet.moveSpeedX = Math.cos((Math.PI / 180) * this.degree) * 6
      bullet.moveSpeedY = Math.sin((Math.PI / 180) * this.degree) * 6
      fieldState.createEnemyBulletObject(bullet, this.centerX, this.centerY)
    }
  }

  processChangeAngle () {
    super.processChangeAngle()

    // 정해진 각도범위만 사용할 수 있음 (왼쪽방향이 0도, 시계방향으로 회전, 45도 부터 135도사이에 있으면 강제로 각도 조절)
    if (this.degree > 270 && this.degree < 315) this.degree = 315
    if (this.degree > 45 && this.degree <= 90) this.degree = 45
    if (this.degree > 90 && this.degree < 135) this.degree = 135
    if (this.degree > 225 && this.degree <= 270) this.degree = 225

    // 참고: 상하반전이 되어버려서 날개가 위가 아닌 아래에 갈 수도 있지만, 그걸 해결하긴 어려움
    // 이유는 대포가 각도를 기준으로 발사하는데 그것까지 고려해서 코드를 짜기 어렵다.
  }
}
class TowerEnemyGroup2Hellpa extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.setEnemyByCpStat(42, 12)
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.hellpa, 2)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHellpa)
    this.setMoveDirection()
    this.dieColor = TowerEnemyHellTemplet.dieColorList.blue
    this.isAngleChange = false

    this.attackWaitEffect = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.hellpaAttackWait, 3, -1)

    this.flip = 1
    this.attackDelay.delay = 180
    this.attackDelay.count = 0
    this.paAttackObject = {x: 0, y: 0, width: 1, height: 120}

    this.targetSpeed.xBase = 1
    this.targetSpeed.yBase = 1
    this.targetSpeed.xChange = 0.4
    this.targetSpeed.yChange = 0.4


    this.STATE_NORMAL = ''
    this.STATE_ATTACK_WAIT = 'attackWait'
    this.STATE_ATTACK = 'attack'
    this.state = ''
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(20, 0, 100, undefined),
      this.getCollisionAreaCalcurationObject(0, 20, undefined, 80)
    ]
  }

  processMove () {
    if (this.state === this.STATE_NORMAL) {
      super.processMove()
    }
  }

  processEnimation () {
    super.processEnimation()
    this.attackWaitEffect.process()

    // 각도와 반전이 이펙트에도 영향을 받게 변경
    this.attackWaitEffect.flip = this.flip
    this.attackWaitEffect.degree = this.degree
  }

  processAttack () {
    if (this.attackDelay.check()) {
      if (this.state === this.STATE_NORMAL) {
        this.state = this.STATE_ATTACK_WAIT
        this.attackDelay.count = this.attackDelay.delay - 120 // 다른 딜레이와 다르게 2초동안만 대기함

        // 공격 대기 상태로 변환한 후 방향 설정
        if (this.moveSpeedX > 0) {
          this.moveDirectionX = FieldData.direction.RIGHT
          this.paAttackObject.x = this.x + this.width
          this.flip = 0
        } else {
          this.moveDirectionX = FieldData.direction.LEFT
          this.paAttackObject.x = this.x
          this.flip = 1
        }
        this.setMoveSpeed(0, 0)
      } else if (this.state === this.STATE_ATTACK_WAIT) {
        this.state = this.STATE_ATTACK
        this.attackDelay.count = this.attackDelay.delay / 2 // 지연시간의 절반만큼만 공격 상태가 됨
        this.paAttackObject.elapsedFrame = 120
        this.paAttackObject.width = 10
        this.paAttackObject.y = this.y
        soundSystem.play(soundSrc.enemyAttack.towerHellpaAttack)
      } else if (this.state === this.STATE_ATTACK) {
        this.state = this.STATE_NORMAL
      }
    }

    if (this.state === this.STATE_ATTACK) {
      this.setMoveSpeed(0, 0)
      if (this.moveDirectionX === FieldData.direction.RIGHT) {
        this.paAttackObject.width += 6
      } else if (this.moveDirectionX === FieldData.direction.LEFT) {
        this.paAttackObject.x -= 6
        this.paAttackObject.width += 6
      }

      if (this.attackDelay.divCheck(6)) {
        let player = fieldState.getPlayerObject()
        if (collision(player, this.paAttackObject)) {
          player.addDamage(6)
        }
      }
    }
  }

  display () {
    if (this.state === this.STATE_ATTACK_WAIT) {
      this.attackWaitEffect.display(this.x, this.y)      
    } else {
      super.display()
    }

    if (!this.isDied && this.state === this.STATE_ATTACK) {
      this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.hellpaAttack, this.paAttackObject.x, this.paAttackObject.y, this.paAttackObject.width, this.paAttackObject.height)
    }
  }
}
class TowerEnemyGroup2Hellna extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.dieColor = TowerEnemyHellTemplet.dieColorList.violet
    this.setEnemyByCpStat(21, 12)
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.hellna)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHellna)
    this.setMoveDirection()
    this.targetSpeed.xBase = 3
    this.targetSpeed.yBase = 3
    this.targetSpeed.xChange = 0.02
    this.targetSpeed.yChange = 0.02
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = TowerEnemy.bulletYellow.getCreateObject()
      bullet.moveSpeedX = Math.cos((Math.PI / 180) * this.degree) * 10
      bullet.moveSpeedY = Math.sin((Math.PI / 180) * this.degree) * 10
      fieldState.createEnemyBulletObject(bullet, this.x, this.centerY)
    }
  }

  processChangeAngle () {
    super.processChangeAngle()

    // 45도 단위로 각도 조정 (나눗셈 계산 방식)
    let count = Math.floor((this.degree + 15) / 30)
    this.degree = count * 30
  }
}

class TowerEnemyPentaShadowTemplete extends TowerEnemyPentaTemplete {
  /** 
   * 도형 자동 설정 장치 (체력 및 이미지 데이터 자동 설정) - 이것은 pentaShadow타입 전용입니다.
   * @param {string} subType TowerEnemyPentaTemplete 에 있는 subTypeList중 하나 (단 (penta, octa...)이름 뒤에 shadow, light가 있어야 함)
   */
  setAutoFigure (subType) {
    /** @type {[number, number, boolean, ImageDataObject]} cpBaseHp, attack, isRight imageData, */ 
    let arrayData = [0, 0, false, imageDataInfo.towerEnemyGroup1.square]

    // 데이터 설정
    switch (subType) {
      case this.subTypeList.PENTA_SHADOW: arrayData = [7, 12, false, imageDataInfo.towerEnemyGroup2.pentaShadow]; break
      case this.subTypeList.PENTA_LIGHT: arrayData = [14, 12, true, imageDataInfo.towerEnemyGroup2.pentaLight]; break
      case this.subTypeList.HEXA_SHADOW: arrayData = [7, 13, false, imageDataInfo.towerEnemyGroup2.hexaShadow]; break
      case this.subTypeList.HEXA_LIGHT: arrayData = [14, 13, true, imageDataInfo.towerEnemyGroup2.hexaLight]; break
      case this.subTypeList.OCTA_SHADOW: arrayData = [8, 14, false, imageDataInfo.towerEnemyGroup2.octaShadow]; break
      case this.subTypeList.OCTA_LIGHT: arrayData = [16, 14, true, imageDataInfo.towerEnemyGroup2.octaLight]; break
    }

    let targetDieSound = arrayData[2] ? soundSrc.enemyDie.enemyDieTowerPentaLight : soundSrc.enemyDie.enemyDieTowerPentaShadow
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup2, arrayData[3]) // 이미지 자동 설정
    this.setDieEffectTemplet(targetDieSound, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.metalSlashMagenta)
    this.setEnemyByCpStat(arrayData[0], arrayData[1]) // 체력, 공격력 설정
    this.subType = subType // 서브타입 지정
  }

  /** 해당 객체가 죽었을 때 새로운 적을 다시 생성합니다. (단 라이트타입은 해당하지 않음) */
  createNewEnemy () {
    switch (this.subType) {
      case this.subTypeList.PENTA_SHADOW: fieldState.createEnemyObject(ID.enemy.towerEnemyGroup2.pentaLight, this.x, this.y); break
      case this.subTypeList.HEXA_SHADOW: fieldState.createEnemyObject(ID.enemy.towerEnemyGroup2.hexaLight, this.x, this.y); break
      case this.subTypeList.OCTA_SHADOW: fieldState.createEnemyObject(ID.enemy.towerEnemyGroup2.octaLight, this.x, this.y); break
    }
  }
}

class TowerEnemyGroup2PentaShadow extends TowerEnemyPentaShadowTemplete {
  constructor () { super(); this.setAutoFigure(this.subTypeList.PENTA_SHADOW) }
  getCollisionArea () {
    return [ this.getCollisionAreaCalcurationObject(0, 36, 119, 21),
      this.getCollisionAreaCalcurationObject(19, 17, 87, 88),
      this.getCollisionAreaCalcurationObject(34, 2, 49, 15)]
  }
}
class TowerEnemyGroup2PentaLight extends TowerEnemyGroup2PentaShadow {
  constructor () { super(); this.setAutoFigure(this.subTypeList.PENTA_LIGHT) }
}
class TowerEnemyGroup2HexaShadow extends TowerEnemyPentaShadowTemplete {
  constructor () { super(); this.setAutoFigure(this.subTypeList.HEXA_SHADOW) }
  getCollisionArea () {
    return [ this.getCollisionAreaCalcurationObject(29, 2, 71, 105),
      this.getCollisionAreaCalcurationObject(18, 14, 97, 74),
      this.getCollisionAreaCalcurationObject(0, 42, 129, 24)]
  }
}
class TowerEnemyGroup2HexaLight extends TowerEnemyGroup2HexaShadow {
  constructor () { super(); this.setAutoFigure(this.subTypeList.HEXA_LIGHT) }
}
class TowerEnemyGroup2OctaShadow extends TowerEnemyPentaShadowTemplete {
  constructor () { super(); this.setAutoFigure(this.subTypeList.OCTA_SHADOW) }
  getCollisionArea () {
    return [ this.getCollisionAreaCalcurationObject(0, 39, 148, 60),
      this.getCollisionAreaCalcurationObject(28, 0, 86, 39),
      this.getCollisionAreaCalcurationObject(28, 99, 97, 36)]
  }
}
class TowerEnemyGroup2OctaLight extends TowerEnemyGroup2OctaShadow {
  constructor () { super(); this.setAutoFigure(this.subTypeList.OCTA_LIGHT) }
}

class TowerEnemyGroup2BigBar extends TowerEnemy {
  constructor () {
    super()
    /** 최대 top 위치 px */ this.MAX_TOP = 0
    this.setEnemyByCpStat(4000, 10)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerBossBar, imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.enemyDieBossBar, 180)
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.bossBar, 2)
    this.setWidthHeight(800, 160)
    this.attackDelay = new DelayData(30)
    this.collisionDelay.delay = 30
    this.dieAfterDeleteDelay = new DelayData(180)

    this.customBullet = new CustomEnemyBullet(imageSrc.enemy.towerEnemyGroup2, imageDataInfo.towerEnemyGroup2.hellpaAttack, 10, 0, 2)
    this.customDieEffect = new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.diamondBlue, 40, 40, 2)

    if (this.dieEffect) {
      this.dieEffect.setWidthHeight(this.width, this.height)
    }
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(2, 8, 36, 24), // left ball1
      this.getCollisionAreaCalcurationObject(6, 2, 28, 36), // left ball2
      this.getCollisionAreaCalcurationObject(162, 8, 36, 24), // right ball1
      this.getCollisionAreaCalcurationObject(166, 2, 28, 36), // right ball2
      this.getCollisionAreaCalcurationObject(40, 15, 120, 11) // line
    ]
  }

  processPlayerCollisionSuccessAfter () {
    soundSystem.play(soundSrc.enemyAttack.towerBossBarCollision)
    let player = fieldState.getPlayerObject()
    player.setAutoMove(Math.random() * graphicSystem.CANVAS_WIDTH, 0, 15)
  }

  processDieAfter () {
    super.processDieAfter()
    if (!this.isDied) return

    if (this.dieAfterDeleteDelay.count % 5 === 0) {
      soundSystem.play(this.dieSound)
      fieldState.createEffectObject(this.customDieEffect.getObject(), this.x + (Math.random() * (this.width - 40)), this.y + (Math.random() * (this.height - 40)))
    }

    if (this.dieAfterDeleteDelay.count == this.dieAfterDeleteDelay.delay - 1) {
      soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossCommon)
      let effect = this.customDieEffect.getObject()
      effect.setWidthHeight(this.width, this.height)
      fieldState.createEffectObject(effect, this.x, this.y)
    }
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = this.customBullet.getCreateObject()
      bullet.setWidthHeight(1200, 30)
      fieldState.createEnemyBulletObject(bullet, this.x, this.centerY)
    }
  }

  processMove () {
    // 이게 끝... (느린 속도로 올라오는게 전부) 
    if (this.y >= this.MAX_TOP) {
      super.processMove()

      // 체력이 적으면 이동속도가 3배 빨라짐 (그래도 느리지만...)
      if (this.hp >= this.hpMax * 0.2) this.setMoveSpeed(0, -0.2)
      else this.setMoveSpeed(0, -0.6)

    } else {
      this.setMoveSpeed(0, 0)
    }
  }
}

class TowerEnemyCoreTemplete extends TowerEnemy {
  constructor () {
    super()
    this.setEnemyByCpStat(20, 10)
    this.setRandomMoveSpeed(2, 2)
    this.setCore('') // 임의의 코어값 설정 (세부 클래스에서 이 함수를 사용해서 어느 코어를 만들것인지를 결정해야함)

    /** static 클래스명 일일히 지정하기 귀찮아서 this로도 접근 가능하게 만들었음. */
    this.coreType = TowerEnemyCoreTemplete.coreType

    this.attackDelay = new DelayData(360)

    // 코어의 죽음 사운드와 이펙트는 동일
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerCore, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.metalSlashGrey)
  }

  static coreType = {
    core8: 'towerCoreCore8',
    potion: 'towerCorePotion',
    metal: 'towerCoreMetal',
    shot: 'towerCoreShot',
    rainbow: 'towerCoreRainbow',
    brown: 'towerCoreBrown',
    fake: 'towerCoreFake'
  }

  /**
   * 코어의 타입 설정 (자세한것은 TowerEnemyCoreTemplete 클래스 참고)
   * @param {string} coreType 
   */
  setCore (coreType) {
    // 긴 코드를 강제로 축약하였으므로 참고 (형식은 기존 적들과 완전히 같음)
    let T = TowerEnemyCoreTemplete.coreType
    let I = imageSrc.enemy.towerEnemyGroup3
    let D = imageDataInfo.towerEnemyGroup3
    switch (coreType) {
      case T.core8: this.setAutoImageData(I, D.core8); break
      case T.potion: this.setAutoImageData(I, D.corePotion); break
      case T.metal: this.setAutoImageData(I, D.coreMetal); break
      case T.shot: this.setAutoImageData(I, D.coreShot); break
      case T.rainbow: this.setAutoImageData(I, D.coreRainbow); break
      case T.brown: this.setAutoImageData(I, D.coreBrown); break
      case T.fake: this.setAutoImageData(I, D.fakeCore); break
      default: this.setAutoImageData(I, D.core8); break // 잘못된 값이 있다면 강제로 기본값 처리
    }

    this.subType = coreType // 서브타입 변경 (이것을 이용하여 코어 타입 구분)
  }
}

class TowerEnemyGroup3Core8 extends TowerEnemyCoreTemplete {
  constructor () {
    super()
    this.setCore(this.coreType.core8)
    this.attackDelay.delay = 360 // 6초 딜레이
  }

  processAttack () {
    // 총알은 기존에 있는 총알을 사용함 (코어는 노란색 총알 발사함)
    if (this.attackDelay.check()) {
      // 각 총알은 시계방향의 형태로 발사됨
      const speedTableX = [0, 4, 4, 4, 0, -4, -4, -4]
      const speedTableY = [-4, -2, 0, 2, 4, 2, 0, -2]
      for (let i = 0; i < 8; i++) {
        let bullet = TowerEnemy.bulletYellow.getCreateObject()
        bullet.setMoveSpeed(speedTableX[i], speedTableY[i])
        fieldState.createEnemyBulletObject(bullet, this.centerX, this.centerY)
      }
    }
  }
}

class TowerEnemyGroup3CorePotion extends TowerEnemyCoreTemplete {
  constructor () {
    super()
    this.setCore(this.coreType.potion)
    // (주의: 아직 저장기능이 완전한 데이터를 저장하진 못하기 때문에, 저장후 불러오기를 하면 포션이 무한회복을 할 수도 있습니다.)
    this.life = 1 // 라이프 개수 (이 값이 0이되면 회복 불가능)
  }

  processState () {
    // 최대 체력의 50%보다 현재 체력이 낮아지면, 50%의 체력을 즉시 추가하고, 라이프를 1 감소
    if (this.life >= 1 && this.hp <= this.hpMax * 0.5) {
      this.hp += Math.floor(this.hpMax * 0.5)
      this.life--
    }
  }

  display () {
    if (this.life >= 1) {
      // 라이프가 1이상이면 기본값 출력
      super.display()
    } else {
      // 포션이 사용된 이미지를 출력함
      this.imageObjectDisplay(this.imageSrc, imageDataInfo.towerEnemyGroup3.corePotionUsing, this.x, this.y)
    }
  }
}

class TowerEnemyGroup3CoreMetal extends TowerEnemyCoreTemplete {
  constructor () {
    super()
    this.setCore(this.coreType.metal)

    this.hpMax += this.hp // 자신의 hp만큼을 최대 체력에 추가
    this.hp += this.hp // 자신의 hp만큼을 현재 체력의 추가
    // 결론: 체력 2배...
  }
}

class TowerEnemyGroup3CoreShot extends TowerEnemyCoreTemplete {
  constructor () {
    super()
    this.setCore(this.coreType.shot)
    this.attackDelay.delay = 240 // 4초 간격
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = TowerEnemy.bulletYellow.getCreateObject()
      bullet.setRandomMoveSpeedMinMax(-3, -3, 3, 3)
      fieldState.createEnemyBulletObject(bullet, this.x, this.y)
    }
  }
}

class TowerEnemyGroup3CoreRainbow extends TowerEnemyCoreTemplete {
  constructor () {
    super()
    this.setCore(this.coreType.rainbow)
    this.attackDelay.delay = 180
    this.isSpeedBoost = false
  }

  processAttack () {
    if (this.attackDelay.check() && !this.isSpeedBoost && this.moveSpeedX <= 4) {
      soundSystem.play(soundSrc.enemyAttack.towerCoreSummonRainbow)
      this.setMoveSpeed(this.moveSpeedX * 4, this.moveSpeedY * 4) // 이동 속도 증가
      this.isSpeedBoost = true
    }
  }
}

class TowerEnemyGroup3CoreBrown extends TowerEnemyCoreTemplete {
  constructor () {
    super()
    this.shield = 0
    this.summonCount = 1
    this.setCore(this.coreType.brown)
  }

  processState () {
    // 소환 카운트가 있다면, 쉴드를 소환함(쉴드는 자기 최대 체력의 50%)
    if (this.summonCount >= 1 && this.hp <= this.hpMax * 0.5) {
      this.summonCount--
      this.shield += Math.floor(this.hpMax * 0.5)
      soundSystem.play(soundSrc.enemyAttack.towerCoreSummonBrown)
    }

    // 참고: 아직 쉴드는 구현되어있지 않아서, 체력이 무조건 감소함으로, 쉴드가 감소되도록 체력을 조정
    if (this.shield >= 1 && this.hp <= this.hpMax * 0.5) {
      let shieldMinus = (this.hpMax * 0.5) - this.hp
      this.hp = Math.floor(this.hpMax * 0.5) // hp 재조정

      // 쉴드 감소
      if (this.shield >= shieldMinus) {
        this.shield -= shieldMinus
      } else {
        let hpDamage = shieldMinus - this.shield
        this.shield = 0
        this.hp -= hpDamage
      }
    }
  }

  display () {
    super.display()
    if (this.shield >= 1) {
      this.imageObjectDisplay(this.imageSrc, imageDataInfo.towerEnemyGroup3.coreBrownShield, this.x - 20, this.y - 20)
    }
  }
}

class TowerEnemyGroup3ShipSmall extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.shipSmall, 6)
    this.setEnemyByCpStat(160, 14)
    this.setDieEffectOption(soundSrc.enemyDie.enemyDieTowerShipSmall, new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.smallCircleUp, this.width / 2, this.width / 2, 2, 2))
    this.setRandomMoveSpeedMinMax(0.8, 0, 1.4, 0)
   
    this.coreDelay = new DelayData(180)
    this.attackDelay = new DelayData(10000)

    /** 포션 사용 횟수 */ this.potionUsingCount = 0
    /** 포션 회복 상수값 */ this.potionRecoveryValue = Math.floor(this.hpMax * 0.2)
    /** 쉴드 사용 횟수 */ this.shieldUsingCount = 0
    /** 쉴드 값 */ this.shield = 0

    /** 코어 최대 장착 횟수 */ this.coreEquipMaxCount = 2
    /** 현재 상태에 코어 개수를 지정 (저장용도, 추후엔 교체될 가능성이 높음) */ this.state = '0'

    /** 현재까지 장착된 코어에 대한 정보 (저장되지 않으므로 수정 필요) */ this.coreEquipList = []
    /** 코어 타입에 관한 정보 */ this.coreType = TowerEnemyCoreTemplete.coreType
  }

  /** 무작위의 코어를 장착합니다. */
  equipCore () {
    if (this.coreEquipList.length >= this.coreEquipMaxCount) return

    let enemyList = fieldState.getEnemyObject()
    let coreList = []
    let subTypeList = [this.coreType.shot, this.coreType.brown, this.coreType.core8, this.coreType.metal, this.coreType.potion, this.coreType.rainbow, this.coreType.fake]
    for (let i = 0; i < enemyList.length; i++) {
      // 적이 가지고 있는 서브타입이 서브타입 리스트에 포함되면 해당 하는 적은 코어로 간주됨
      if (subTypeList.includes(enemyList[i].subType)) {
        coreList.push(enemyList[i])
      }
    }

    if (coreList.length <= 0) return // 코어가 없으면 장착하지 않음
    let random = Math.floor(Math.random() * coreList.length) // 무작위 코어 지정
    let targetCoreEnemy = coreList[random]
    if (targetCoreEnemy.isDeleted || targetCoreEnemy.isDied) return // 타겟된 코어가 죽거나 삭제 예정이면 무시 (역시 장착하지 않음)

    // 코어 장착
    this.coreEquipList.push(targetCoreEnemy.subType)
    soundSystem.play(soundSrc.enemyAttack.towerShipEquipCore)
    
    // 코어가 가진 체력과 최대체력과 점수를 흡수함
    this.hp += targetCoreEnemy.hp
    this.hpMax += targetCoreEnemy.hpMax
    this.score += targetCoreEnemy.score

    // 만약 장착된 코어가 메탈이라면, 그 즉시 최대 체력과 현재 체력이 증가됨
    if (targetCoreEnemy.subType === this.coreType.metal) {
      let value = Math.floor(this.hpMax * 0.2)
      this.hp += value
      this.hpMax += value
    } else if (targetCoreEnemy.subType === this.coreType.rainbow) {
      // 만약 장착된 코어가 레인보우라면, 그 즉시 속도가 상승함 (단 이것은 최대 2회까지만 상승)
      if (this.getCoreCount().rainbow < 2) {
        // 즉시 이동속도 3 추가
        this.setMoveSpeed(this.moveSpeedX + 3, this.moveSpeedY * 1)
      }
    }

    // 타겟 코어는 삭제됨
    targetCoreEnemy.isDeleted = true

    
  }

  processState () {
    this.processCorePotion()
    this.processCoreBrown()

    if (this.coreDelay.check()) {
      this.equipCore()
    }
  }

  getCoreCount () {
    let count = { fake: 0, brown: 0, shot: 0, metal: 0, rainbow: 0, potion: 0, core8: 0 }
    for (let i = 0; i < this.coreEquipList.length; i++) {
      switch (this.coreEquipList[i]) {
        case this.coreType.brown: count.brown++; break
        case this.coreType.potion: count.potion++; break
        case this.coreType.shot: count.shot++; break
        case this.coreType.rainbow: count.rainbow++; break
        case this.coreType.metal: count.metal++; break
        case this.coreType.core8: count.core8++; break
        case this.coreType.fake: count.fake++; break
      }
    }

    return count
  }

  processCorePotion () {
    let corePotionCount = this.getCoreCount().potion
    if (corePotionCount > 2) corePotionCount = 2 // 포션 개수 2개 제한

    // 체력의 50% 미만이면, 포션 효과로 체력을 현재 체력의 20%회복(이 값은 초기값 상수로 강제로 지정되어있음)함
    if (this.potionUsingCount < corePotionCount && this.hp <= this.hpMax * 0.5) {
      this.potionUsingCount++
      this.hp += this.potionRecoveryValue
    }
  }

  processCoreBrown () {
    let coreBrownCount = this.getCoreCount().brown
    if (coreBrownCount > 2) coreBrownCount = 2 // 쉴드 개수 2개 제한

    if (this.shieldUsingCount < coreBrownCount && this.hp <= this.hpMax * 0.5) {
      this.shieldUsingCount++
      this.shield += this.potionRecoveryValue
      soundSystem.play(soundSrc.enemyAttack.towerCoreSummonBrown)
    }

    // 쉴드 데미지 계산
    if (this.shield >= 1 && this.hp <= this.hpMax * 0.5) {
      let shieldMinus = (this.hpMax * 0.5) - this.hp
      this.hp = Math.floor(this.hpMax * 0.5) // hp 재조정

      // 쉴드 감소
      if (this.shield >= shieldMinus) {
        this.shield -= shieldMinus
      } else {
        let hpDamage = shieldMinus - this.shield
        this.shield = 0
        this.hp -= hpDamage
      }
    }
  }

  processAttack () {
    // 공격 가능한 코어의 개수를 살펴봄 (공격 코어는 최대 2개까지 효과를 볼 수 있음)
    let core8Count = this.getCoreCount().core8
    let coreShotCount = this.getCoreCount().shot
    this.attackDelay.check() // 공격 딜레이 강제 카운트 실행

    // core8의 공격방식
    if ((core8Count === 1 && this.attackDelay.divCheck(360)) 
     || (core8Count >= 2 && this.attackDelay.divCheck(240)) ) {
      // 각 총알은 시계방향의 형태로 발사됨
      const speedTableX = [0, 4, 4, 4, 0, -4, -4, -4]
      const speedTableY = [-4, -3, 0, 3, 4, 3, 0, -3]
      for (let i = 0; i < 8; i++) {
        let bullet = TowerEnemy.bulletYellow.getCreateObject()
        bullet.setMoveSpeed(speedTableX[i], speedTableY[i])
        fieldState.createEnemyBulletObject(bullet, this.centerX, this.centerY)
      }
    }

    // coreShot의 공격방식
    if ((coreShotCount === 1 && this.attackDelay.divCheck(240))
     || (coreShotCount >=  2 && this.attackDelay.divCheck(180))) {
      let bulletA = TowerEnemy.bulletRed.getCreateObject()
      let bulletB = TowerEnemy.bulletBlue.getCreateObject()
      bulletA.setRandomMoveSpeedMinMax(-3, -3, 3, 3)

      let player = fieldState.getPlayerObject()
      bulletB.x = this.centerX // 플레이어 추적을 위한 bulletB의 좌표값 지정
      bulletB.y = this.centerY // 플레이어 추적을 위한 bulletB의 좌표값 지정
      bulletB.setMoveSpeedChaseLine(player.x, player.y, 60, 2)

      fieldState.createEnemyBulletObject(bulletA, this.centerX, this.centerY)
      fieldState.createEnemyBulletObject(bulletB, this.centerX, this.centerY)
    }
  }

  processMove () {
    super.processMove()
    
    // y축 위치 강제 조정 (화면 안에 들어오도록)
    if (this.y < 0) this.y = 0
    else if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) this.y = graphicSystem.CANVAS_HEIGHT - this.height
  }

  processDie () {
    if (this.dieCheck()) {
      this.processDieDefault()
      if (this.dieEffect) {
        fieldState.createEffectObject(this.dieEffect, this.x + 40, this.y)
        fieldState.createEffectObject(this.dieEffect, this.x + 80, this.y)
      }
    }
  }

  display () {
    super.display()
    this.displayCore()
    this.displayBrownShield()
  }

  /** 코어의 출력 위치값을 가져옴 (함선마다 코어 출력 위치는 다를 수 있기 때문) */
  getCoreDisplayPosition () {
    return {
      coreX: [40, 140],
      coreY: [30, 30]
    }
  }

  displayBrownShield () {
    if (this.shield >= 1) {
      this.imageObjectDisplay(this.imageSrc, imageDataInfo.towerEnemyGroup3.coreBrownShield, this.x - 20, this.y - 20, this.width + 40, this.height + 40)
    }
  }

  displayCore () {
    let coreX = this.getCoreDisplayPosition().coreX
    let coreY = this.getCoreDisplayPosition().coreY
    let imgD = imageDataInfo.towerEnemyGroup3
    let potionPositionCount = this.potionUsingCount
    for (let i = 0; i < this.coreEquipList.length; i++) {
      switch (this.coreEquipList[i]) {
        case this.coreType.brown: this.imageObjectDisplay(this.imageSrc, imgD.coreBrown, this.x + coreX[i], this.y + coreY[i]); break
        case this.coreType.core8: this.imageObjectDisplay(this.imageSrc, imgD.core8, this.x + coreX[i], this.y + coreY[i]); break
        case this.coreType.fake: this.imageObjectDisplay(this.imageSrc, imgD.fakeCore, this.x + coreX[i], this.y + coreY[i]); break
        case this.coreType.metal: this.imageObjectDisplay(this.imageSrc, imgD.coreMetal, this.x + coreX[i], this.y + coreY[i]); break
        case this.coreType.rainbow: this.imageObjectDisplay(this.imageSrc, imgD.coreRainbow, this.x + coreX[i], this.y + coreY[i]); break
        case this.coreType.shot: this.imageObjectDisplay(this.imageSrc, imgD.coreShot, this.x + coreX[i], this.y + coreY[i]); break
        case this.coreType.potion:
          // 포션은 소모 상태를 보여줘야함.
          if (potionPositionCount >= 1) {
            this.imageObjectDisplay(this.imageSrc, imgD.corePotionUsing, this.x + coreX[i], this.y + coreY[i]);
            potionPositionCount--
          } else {
            this.imageObjectDisplay(this.imageSrc, imgD.corePotion, this.x + coreX[i], this.y + coreY[i]);
          }
          break
      }
    }
  }
}

class TowerEnemyGroup3ShipBig extends TowerEnemyGroup3ShipSmall {
  constructor () {
    super()
    this.setAutoImageData(this.imageSrc, imageDataInfo.towerEnemyGroup3.shipBig, 6)
    this.setEnemyByCpStat(220, 14)
    this.coreEquipMaxCount = 4 // 최대 코어 4개 장착
    this.dieSound = soundSrc.enemyDie.enemyDieTowerShipBig
    this.coreDelay.delay = 181 // 3.03(3초가 기준이긴 하지만, 3초보다 약간 더 높게 설정한것 뿐) 초 간격 코어 흡수
  }

  getCoreDisplayPosition () {
    return {
      coreX: [40, 140, 40, 140],
      coreY: [40, 40, 140, 140],
    }
  }
}

class TowerEnemyGroup3FakeMove extends TowerEnemyGroup1MoveViolet {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.fakeMove, 3)
    this.moveStopFrame = Math.floor(Math.random() * 300) + 300
  }

  processMove () {
    // 일정 시간 동안만 이동하고 갑자기 이동이 멈춤
    if (this.elapsedFrame <= this.moveStopFrame) {
      super.processMove()
    }
  }
}

class TowerEnemyGroup3FakeBar extends TowerEnemyBarTemplete {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.fakeBar, 5)
    this.collisionSoundSrc = soundSrc.enemyAttack.towerFakeBarAttack
  }
}

class TowerEnemyGroup3FakeHell extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.targetSpeed.xChange = 0.2
    this.targetSpeed.yChange = 0.2
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.fakeHell)
    this.setEnemyByCpStat(40, 16)
    this.moveDelay.delay = 30
    this.dieSound = soundSrc.enemyDie.enemyDieTowerFakeHell
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 12, 14, 6),
      this.getCollisionAreaCalcurationObject(13, 20, 17, 11),
      this.getCollisionAreaCalcurationObject(38, 20, 119, 40),
      this.getCollisionAreaCalcurationObject(67, 10, 78, 9),
      this.getCollisionAreaCalcurationObject(70, 1, 59, 4),
    ]
  }
}

class TowerEnemyGroup3FakeCore extends TowerEnemyCoreTemplete {
  constructor () {
    super()
    this.setCore(this.coreType.fake)
  }
}

class TowerEnemyGroup3FakeShip extends TowerEnemyGroup3ShipSmall {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.fakeShip, 3)
    this.setEnemyByCpStat(100, 14)
    this.dieSound = soundSrc.enemyDie.enemyDieTowerFakeShip
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 37, 240, 46),
      this.getCollisionAreaCalcurationObject(15, 0, 212, 120),
    ]
  }

  /** 이 함선은 아무것도 장착할 수 없습니다. */
  equipCore () {

  }
}

class TowerEnemyGroup3Star extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.star)
    this.setEnemyByCpStat(12, 12)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerStar, imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.enemyDieStar, 3)
    this.setRandomMoveSpeed(4, 4, true)
    this.degree = Math.random() * 360
    this.randomDegreeSpeed = Math.floor(Math.random() * 3) + 1
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(1, 27, 76, 13),
      this.getCollisionAreaCalcurationObject(33, 2, 14, 25),
      this.getCollisionAreaCalcurationObject(17, 40, 44, 21),
      this.getCollisionAreaCalcurationObject(15, 60, 17, 11),
      this.getCollisionAreaCalcurationObject(43, 59, 17, 11),
    ]
  }

  processMove () {
    super.processMove()
    this.degree += this.randomDegreeSpeed
  }
}

class TowerEnemyGroup3BossDasu extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.bossDasu)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerBossDasu, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedOrange)
    this.setEnemyByCpStat(10000, 20)
    this.setMoveSpeed(0, 0)
    this.setMoveDirection()
    this.isPossibleExit = false
    this.dieAfterDeleteDelay = new DelayData(240)
    this.coreCollisionDelay = new DelayData(30)

    // 위치 기준점
    let startX = graphicSystem.CANVAS_WIDTH - this.width
    let startY = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)

    /** 다수 시스템이 사용하는 코어들 */ this.core = []
    let xTable = [-100, -100, -200, -200, -300, -300]
    let yTable = [-75, 150, -75, 150, -75, 150]
    let X_ARRANGE_MENT = graphicSystem.CANVAS_WIDTH - 100 // 100은 코어의 너비
    let yArrangement = [0, 100, 200, 300, 400, 500]
    for (let i = 0; i < 6; i++) {
      this.core.push(new TowerEnemyGroup3BossDasu.DasuCore(startX + xTable[i], startY + yTable[i]))
      this.core[i].arrangementX = X_ARRANGE_MENT
      this.core[i].arrangementY = yArrangement[i]
    }

    /** 각 코어들의 기본 위치 */
    this.coreBasePotition = [
      {x: -100, y: -75}, {x: -100, y: 150}, {x: -200, y: -75}, {x: -200, y: 150}, {x: -300, y: -75}, {x: -300, y: 150}
    ]

    this.STATE_CORE_REFLECT = 'coreReflect'
    this.STATE_CORE_PUNCH = 'corePunch'
    this.STATE_CORE_ARRAGEMENT = 'coreArrageMent'
    this.STATE_CORE_NORMAL = 'coreNormal'
    this.STATE_HYPER_WAIT = 'hyperWait'
    this.STATE_HYPER_MODE = 'hyperMode'
    this.STATE_DIE = 'die'
    this.state = this.STATE_CORE_NORMAL
    this.stateDelay = new DelayData(480)
    this.moveDelay = new DelayData(60)
    this.hyperDelay = new DelayData(120)

    /** 하이퍼 모드가 되는 체력의 기준점 (배율형태로 표시 = 0.2 = 20%) */
    this.HYPER_MODE_HP_MULTIPLE = 0.2
  }
  
  afterInit () {
    this.x = graphicSystem.CANVAS_WIDTH - this.width
    this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 10, 20, 30),
      this.getCollisionAreaCalcurationObject(0, 160, 20, 30),
      this.getCollisionAreaCalcurationObject(20, 0, 65, 200),
      this.getCollisionAreaCalcurationObject(85, 10, 31, 180),
      this.getCollisionAreaCalcurationObject(116, 28, 19, 144),
      this.getCollisionAreaCalcurationObject(135, 45, 15, 109),
    ]
  }

  processMove () {
    super.processMove()

    let player = fieldState.getPlayerObject()
    for (let i = 0; i < this.core.length; i++) {
      this.core[i].dasuX = this.centerX - (this.core[i].width / 2)
      this.core[i].dasuY = this.centerY - (this.core[i].width / 2)
      this.core[i].baseX = this.x + this.coreBasePotition[i].x
      this.core[i].baseY = this.y + this.coreBasePotition[i].y 
      this.core[i].playerX = player.x
      this.core[i].playerY = player.y
    }

    if (this.state === this.STATE_HYPER_MODE) {
      if (this.moveDelay.check()) {
        this.setRandomMoveSpeed(8, 8, true)
      }
    } else {
      // 위치 고정
      // if (this.x + this.width <= ) {
      //   this.x = graphicSystem.CANVAS_WIDTH - this.width
      //   this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
      // }

      if (this.moveDelay.check()) {
        this.setRandomMoveSpeed(0.4, 0.4, true)
      }

      if (this.x + this.width <= graphicSystem.CANVAS_WIDTH - 100) {
        this.moveSpeedX = Math.abs(this.moveSpeedX)
      }

      if (this.centerY <= graphicSystem.CANVAS_HEIGHT_HALF - 100) {
        this.moveSpeedY = Math.abs(this.moveSpeedY)
      } else if (this.centerY >= graphicSystem.CANVAS_HEIGHT_HALF + 100) {
        this.moveSpeedY = -Math.abs(this.moveSpeedY)
      }
    }

    if (this.state === this.STATE_CORE_NORMAL) this.processMoveCoreNormal()
    if (this.state === this.STATE_CORE_REFLECT) this.processMoveCoreReflect()
    if (this.state === this.STATE_CORE_PUNCH) this.processMoveCorePunch()
    if (this.state === this.STATE_CORE_ARRAGEMENT) this.processMoveCoreArragement()
    if (this.state === this.STATE_HYPER_MODE) this.processMoveCoreHyper()
    // else if (this.state === this.STATE_CORE_ARRAGEMENT) this.processAttackArrageMent()
    // else if (this.state === this.STATE_CORE_PUNCH) this.processAttackPunch()
    // else if (this.state === this.STATE_CORE_REFLECT) this.processAttackReflect()
  }

  processMoveCoreNormal () {
    // 각 코어는 기준점에서 +-10 정도의 범위로 무작위 속도로 이동함
    for (let i = 0; i < this.core.length; i++) {
      if (this.stateDelay.count === 1) {
        // 1회성 상태 변경
        this.core[i].state = this.core[i].STATE_NORMAL
      }
      this.core[i].processMove()
    }
  }

  processMoveCoreReflect () {
    // 각 코어는 땅에 떨어진 직후, 벽에 부딪힐 때마다 무작위의 방향으로 이동함
    for (let i = 0; i < this.core.length; i++) {
      if (this.stateDelay.count === 1) {
        // 1회성 상태 변경
        this.core[i].state = this.core[i].STATE_REFLECT
      }
      this.core[i].processMove()
    }
  }

  processMoveCorePunch () {
    for (let i = 0; i < this.core.length; i++) {
      if (this.stateDelay.count === 1) {
        // 1회성 상태 변경
        this.core[i].state = this.core[i].STATE_PUNCH
      }
      this.core[i].processMove()
    }
  }

  processMoveCoreArragement () {
    for (let i = 0; i < this.core.length; i++) {
      if (this.stateDelay.count === 1) {
        // 1회성 상태 변경
        this.core[i].state = this.core[i].STATE_ARRANGEMENT
      }
      this.core[i].processMove()
    }
  }

  processMoveCoreHyper () {
    for (let i = 0; i < this.core.length; i++) {
      if (this.stateDelay.count === 1) {
        // 1회성 상태 변경
        this.core[i].state = this.core[i].STATE_HYPER
      }
      this.core[i].processMove()
    }
  }

  processMoveCoreDie () {
    for (let i = 0; i < this.core.length; i++) {
      this.core[i].setMoveSpeed(0, 0)
    }
  }

  processState () {
    // 체력값이 하이퍼 모드 이하라면, 무조건 하이퍼모드만 실행되며 다른 패턴이 없음
    if (this.hp <= this.hpMax * this.HYPER_MODE_HP_MULTIPLE) {
      if (this.state !== this.STATE_HYPER_WAIT && this.state !== this.STATE_HYPER_MODE) {
        this.state = this.STATE_HYPER_WAIT
      }
    }

    if (this.state === this.STATE_HYPER_WAIT) {
      // 하이퍼 대기 상태에서는, 상태가 더 빨리 변경됨
      if (this.stateDelay.count <= this.stateDelay.delay - 120) {
        this.stateDelay.count = this.stateDelay.delay - 119
      }
    }

    if (this.stateDelay.check()) {
      this.processStateChange()
    }
  }

  processStateChange () {
    // 하이퍼상태인경우, 하이퍼상태로 고정되고 다른 상태로 변경되지 않음.
    if (this.state === this.STATE_HYPER_WAIT) {
      this.state = this.STATE_HYPER_MODE
      return
    } else if (this.state === this.STATE_HYPER_MODE) {
      return
    }

    let random = Math.floor(Math.random() * 100)
    let targetState = ''

    // 각 상태가 될 확률은 동일 (그러나 중복문제 때문에 normal이 체감상 더 높을 수 있음.)
    if (random <= 25) {
      targetState = this.STATE_CORE_NORMAL
    } else if (random <= 50) {
      targetState = this.STATE_CORE_REFLECT
    } else if (random <= 75) {
      targetState = this.STATE_CORE_PUNCH
    } else if (random <= 100) {
      targetState = this.STATE_CORE_ARRAGEMENT
    }

    // 같은 패턴을 연속해서 사용 불가, 이 경우 타겟 상태를 임의로 변경함
    if (targetState === this.state) {
      switch (this.state) {
        case this.STATE_CORE_NORMAL: targetState = this.STATE_CORE_REFLECT; break
        case this.STATE_CORE_ARRAGEMENT: targetState = this.STATE_CORE_NORMAL; break
        case this.STATE_CORE_REFLECT: targetState = this.STATE_CORE_NORMAL; break
        case this.STATE_CORE_PUNCH: targetState = this.STATE_CORE_NORMAL; break
      }
    }

    // 상태 변경
    this.state = targetState
  }

  processAttack () {
    if (this.state === this.STATE_CORE_NORMAL) this.processAttackNormal()
    else if (this.state === this.STATE_CORE_ARRAGEMENT) this.processAttackArrageMent()
    else if (this.state === this.STATE_CORE_PUNCH) this.processAttackPunch()
    else if (this.state === this.STATE_CORE_REFLECT) this.processAttackReflect()
    else if (this.state === this.STATE_HYPER_MODE) this.processAttackHyper()

    this.processAttackCore()
  }

  processAttackCore () {
    // 패턴 변경 억까 방지를 위하여 패턴 변경 즉시는 공격하지 못함
    if (this.stateDelay.count < 120) return

    // 코어 충돌 딜레이값이 특정 값 미만이면 코어랑 플레이어랑 충돌하지 않음
    if (!this.coreCollisionDelay.check(false)) return

    let player = fieldState.getPlayerObject()
    for (let i = 0; i < this.core.length; i++) {
      let currentCore = this.core[i]
      if (collision(currentCore, player)) {
        player.addDamage(currentCore.attack)
        this.coreCollisionDelay.check() // 코어 충돌 카운터 리셋
        break // 여러 코어에 닿아도 1번만 데미지를 받음
      }
    }
  }

  processAttackNormal () {
    // 상태 지연시간이 2초보다 낮거나, 패턴종료 1초보다 높으면 패턴 실행하지 않음(일종의 대기시간)
    if (this.stateDelay.count < 120 || this.stateDelay.count > this.stateDelay.delay - 60) return

    if (this.stateDelay.divCheck(60)) {
      for (let i = 0; i < this.core.length; i++) {
        let bullet = TowerEnemy.bulletRed.getCreateObject()
        bullet.setRandomMoveSpeed(6, 6, true)

        fieldState.createEnemyBulletObject(bullet, this.core[i].x, this.core[i].y)
      }
    }
  }

  processAttackReflect () {
    // 추가적인 공격 없음
  }

  processAttackPunch () {

  }

  processAttackHyper () {
    if (this.stateDelay.divCheck(120)) {
      soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreAttack)
      for (let i = 0; i < this.core.length; i++) {
        let bullet1 = TowerEnemy.bulletRed.getCreateObject()
        let bullet2 = TowerEnemy.bulletBlue.getCreateObject()
        let bullet3 = TowerEnemy.bulletYellow.getCreateObject()
        bullet1.setRandomMoveSpeed(4, 4, true)
        bullet2.setRandomMoveSpeed(4, 4, true)
        bullet3.setRandomMoveSpeed(4, 4, true)

        fieldState.createEnemyBulletObject(bullet1, this.core[i].x, this.core[i].y)
        fieldState.createEnemyBulletObject(bullet2, this.core[i].x, this.core[i].y)
        fieldState.createEnemyBulletObject(bullet3, this.core[i].x, this.core[i].y)
      }
    }
  }

  processAttackArrageMent () {
    // 상태 지연시간이 2초보다 낮거나, 패턴종료 1초보다 높으면 패턴 실행하지 않음(일종의 대기시간)
    if (this.stateDelay.count < 120 || this.stateDelay.count > this.stateDelay.delay - 60) return

    if (this.stateDelay.divCheck(90)) {
      soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreArrangeMent)
      for (let i = 0; i < this.core.length; i++) {
        let bullet1 = TowerEnemy.bulletRed.getCreateObject()
        let bullet2 = TowerEnemy.bulletBlue.getCreateObject()
        let bullet3 = TowerEnemy.bulletYellow.getCreateObject()
        bullet1.setMoveSpeed(-7, 0)
        bullet2.setMoveSpeed(-8, 0)
        bullet3.setMoveSpeed(-7, 0)

        fieldState.createEnemyBulletObject(bullet1, this.core[i].x, this.core[i].y - 20)
        fieldState.createEnemyBulletObject(bullet2, this.core[i].x, this.core[i].y)
        fieldState.createEnemyBulletObject(bullet3, this.core[i].x, this.core[i].y + 20)
      }
    }
  }

  display () {
    super.display()
    for (let i = 0; i < this.core.length; i++) {
      this.core[i].display()
    }
  }

  processDieAfter () {
    super.processDieAfter()
    if (this.isDied) {
      if (this.dieAfterDeleteDelay.count <= this.dieAfterDeleteDelay.delay - 30 && this.dieAfterDeleteDelay.divCheck(6)) {
        soundSystem.play(this.dieSound)
        if (this.dieEffect != null) {
          this.dieEffect.setWidthHeight(40, 40)
          fieldState.createEffectObject(this.dieEffect.getObject(), this.x + (Math.random() * this.width), this.y + (Math.random() * this.height))
        }
      }

      if (this.dieAfterDeleteDelay.divCheck(30)) {
        if (this.dieEffect != null && this.core.length >= 1 && this.core[0] != null) {
          soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossCommon)
          this.dieEffect.setWidthHeight(this.core[0].width, this.core[0].height)
          fieldState.createEffectObject(this.dieEffect.getObject(), this.core[0].x, this.core[0].y)
          this.core.shift()
        }
      }

      if (this.dieAfterDeleteDelay.count == this.dieAfterDeleteDelay.delay - 1) {
        soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossCommon)
        if (this.dieEffect != null) {
          this.dieEffect.setWidthHeight(this.width, this.height)
          fieldState.createEffectObject(this.dieEffect.getObject(), this.x, this.y)
        }
      }
    }
  }

  static DasuCore = class extends FieldData {
    /**
     * 다수 보스의 전용 코어를 생성
     * @param {number} baseX 기준점이 되는 x좌표
     * @param {number} baseY 기준점이 되는 y좌표
     */
    constructor (baseX = 0, baseY = 0) {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.bossDasuCore)
      this.attack = 9
      this.baseX = baseX
      this.baseY = baseY
      this.dasuX = 0
      this.dasuY = 0
      this.playerX = 0
      this.playerY = 0
      this.arrangementX = 0
      this.arrangementY = 0
      this.x = baseX
      this.y = baseY
      this.state = ''
      this.STATE_NORMAL = 'normal'
      this.STATE_NORMALRUNNING = 'normalRunning'
      this.STATE_REFLECT = 'reflect'
      this.STATE_REFLECTRUNNING = 'reflectRunning'
      this.STATE_PUNCH = 'punch'
      this.STATE_PUNCHRUNNING = 'punchRunning'
      this.STATE_ARRANGEMENT = 'arrangement'
      this.STATE_ARRANGEMENTRUNNING = 'arrangementRunning'
      this.STATE_HYPER = 'hyper'
      this.STATE_HYPERRUNNING = 'hyperRunning'
      this.STATE_DIE = 'die'
      this.moveDelay = new DelayData(60)
      this.punchDelay = new DelayData(40)

      /** 코어가 이동하는값의 최대 속도 제한값 */
      this.moveMaxSpeed = 4
    }

    /**
     * 현재 코어의 상태를 변경 (상태값은 코어가 가지고 있는 상수 이름 참고)
     * @param {string} state 
     */
    changeState (state) {
      this.state = state
    }

    processMove () {
      super.processMove()
      if (this.state === this.STATE_NORMAL) this.processMoveNormal()
      else if (this.state === this.STATE_NORMALRUNNING) this.processMoveNormalRunning()
      else if (this.state === this.STATE_REFLECT) this.processMoveReflect()
      else if (this.state === this.STATE_REFLECTRUNNING) this.processMoveReflectRunning()
      else if (this.state === this.STATE_PUNCH) this.processMovePunch()
      else if (this.state === this.STATE_PUNCHRUNNING) this.processMovePunchRunning()
      else if (this.state === this.STATE_ARRANGEMENT) this.processMoveArrangeMent()
      else if (this.state === this.STATE_ARRANGEMENTRUNNING) this.processMoveArrangeMentRunning()
      else if (this.state === this.STATE_HYPER) this.processMoveHyper()
      else if (this.state === this.STATE_HYPERRUNNING) this.processMoveHyperRunning()
    }

    processMoveNormal () {
      let xComplete = false
      let yComplete = false
      this.setMoveSpeed(0, 0)

      if (this.x < this.baseX - 10) {
        this.x += 10
      } else if (this.x > this.baseX + 10) {
        this.x -= 10
      } else {
        xComplete = true
      }

      if (this.y < this.baseY - 10) {
        this.y += 10
      } else if (this.y > this.baseY + 10) {
        this.y -= 10
      } else {
        yComplete = true
      }

      if (xComplete && yComplete) {
        this.state = this.STATE_NORMALRUNNING
        this.x = this.baseX
        this.y = this.baseY
      }
    }

    processMoveNormalRunning () {
      this.moveMaxSpeed = 0.2
      if (this.moveDelay.check()) {
        this.setRandomMoveSpeed(this.moveMaxSpeed, this.moveMaxSpeed, true)
      }

      if (this.x < this.baseX - 10) {
        this.x = this.baseX - 10
        this.moveSpeedX = Math.abs(this.moveSpeedX)
      } else if (this.x > this.baseX + 10) {
        this.x = this.baseX + 10
        this.moveSpeedX = -Math.abs(this.moveSpeedX)
      }

      if (this.y < this.baseY - 10) {
        this.y = this.baseY - 10
        this.moveSpeedY = Math.abs(this.moveSpeedY)
      } else if (this.y > this.baseY + 10) {
        this.y = this.baseY + 10
        this.moveSpeedY = -Math.abs(this.moveSpeedY)
      }
    }

    processMoveReflectRunning () {
      this.moveMaxSpeed -= 0.016
      if (this.moveMaxSpeed <= 0) {
        this.setMoveSpeed(0, 0)
      }

      if (this.x < 0) {
        this.x = 0
        this.moveSpeedX = Math.random() * this.moveMaxSpeed
        this.moveSpeedY = Math.random() * this.moveMaxSpeed * 2 - this.moveMaxSpeed
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreReflect)
      } else if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
        this.x = graphicSystem.CANVAS_WIDTH - this.width
        this.moveSpeedX = Math.random() * -this.moveMaxSpeed
        this.moveSpeedY = Math.random() * this.moveMaxSpeed * 2 - this.moveMaxSpeed
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreReflect)
      }
      
      if (this.y < 0) {
        this.y = 0
        this.moveSpeedX = Math.random() * this.moveMaxSpeed * 2 - this.moveMaxSpeed
        this.moveSpeedY = Math.random() * this.moveMaxSpeed
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreReflect)
      } else if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT - this.height
        this.moveSpeedX = Math.random() * this.moveMaxSpeed * 2 - this.moveMaxSpeed
        this.moveSpeedY = Math.random() * -this.moveMaxSpeed
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreReflect)
      }
    }

    processMoveReflect () {
      this.moveMaxSpeed = 8
      this.setMoveSpeed(this.moveMaxSpeed, 0)
      this.state = this.STATE_REFLECTRUNNING
    }

    processMovePunch () {
      if (this.punchDelay.count === 1) {
        this.setMoveSpeedChaseLine(this.dasuX, this.dasuY, 30, 24)
      }

      if (this.x >= this.dasuX) {
        this.setMoveSpeed(0, 0)
      }

      if (this.punchDelay.check()) {
        this.state = this.STATE_PUNCHRUNNING
        this.setMoveSpeedChaseLine(this.playerX, this.playerY + Math.random() * 160 - 80, 40, 16)
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreAttack)
      }
    }

    processMovePunchRunning () {
      if (this.punchDelay.check()) {
        this.state = this.STATE_PUNCH
      }
    }

    processMoveArrangeMent () {
      this.setMoveSpeedChaseLine(this.arrangementX, this.arrangementY, 60, 12)
      if (this.x + this.width >= this.arrangementX) {
        this.x = this.arrangementX - this.width
        this.state = this.STATE_ARRANGEMENTRUNNING
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreArrangeMent)
      }
    }

    processMoveArrangeMentRunning () {
      this.x = this.arrangementX
      this.y = this.arrangementY
    }

    processMoveHyper () {
      this.setRandomMoveSpeed(4, 4, true)
      if (this.moveDelay.check()) {
        this.state = this.STATE_HYPERRUNNING
      }
    }

    processMoveHyperRunning () {
      if (this.x < 0) {
        this.x = 0
        this.moveSpeedX = Math.random() * this.moveMaxSpeed
        this.moveSpeedY = Math.random() * this.moveMaxSpeed * 2 - this.moveMaxSpeed
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreReflect)
      } else if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
        this.x = graphicSystem.CANVAS_WIDTH - this.width
        this.moveSpeedX = Math.random() * -this.moveMaxSpeed
        this.moveSpeedY = Math.random() * this.moveMaxSpeed * 2 - this.moveMaxSpeed
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreReflect)
      }
      
      if (this.y < 0) {
        this.y = 0
        this.moveSpeedX = Math.random() * this.moveMaxSpeed * 2 - this.moveMaxSpeed
        this.moveSpeedY = Math.random() * this.moveMaxSpeed
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreReflect)
      } else if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT - this.height
        this.moveSpeedX = Math.random() * this.moveMaxSpeed * 2 - this.moveMaxSpeed
        this.moveSpeedY = Math.random() * -this.moveMaxSpeed
        soundSystem.play(soundSrc.enemyAttack.towerBossDasuCoreReflect)
      }
    }
  }
}

class TowerEnemyGroup3ClockAnalog extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.clockAnalog)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerClockAnalog, imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.enemyDieClockAnalog, 2)
    this.setEnemyByCpStat(100, 10) // 시계는 공격력 없음
    this.setRandomMoveSpeed(2, 0)
    this.isPossibleExit = false

    /** 시계바늘 오브젝트 */ this.analogHand = new TowerEnemyGroup3ClockAnalog.AnalogHand()
    /** 시계 표시 방식 설정: 아날로그, 디지털, 종(종은 위치좌표값이 달라서 따로 구분함) */
    this.subTypeList = {
      analog: 'analog',
      digital: 'digital',
      jong: 'jong'
    }

    /** 아날로그 시계가 스킬을 사용하는 시점 */ this.ANALOG_SKILL_TIME = 44
    /** 디지털 시계가 스킬을 사용하는 시점 */ this.DIGITAL_SKILL_TIME = 55
    /** 종 시계가 스킬을 사용하는 시점 */ this.JONG_SKILL_TIME = 66
    /** 아날로그 시계 기준으로 스킬이 사용되는 바늘의 상수 값 */ this.ANALOG_HAND_SKILL_TICK = 11
    /** 아날로그 시계 기준으로 시계가 빨간색이 되는 바늘의 상수 값 */ this.ANALOG_HAND_RED_TICK = 8
    /** 아날로그 시계 기준으로 시계가 흔들리기 시작하는 바늘의 상수 값 */ this.ANALOG_HAND_VIBRATION_TICK = 9

    /** 일반 상태 (상태값이 따로 지정되어있는건, 아무것도 아닌 상태를 막기 위함) */ this.STATE_NORMAL = 'clock'
    /** 시계가 빨간색이 된 상태 */ this.STATE_RED = 'red'
    /** 시계가 진동하는 상태 */ this.STATE_VIBRATION = 'vibration'
    /** 스킬을 사용하는 상태 */ this.STATE_SKILL = 'skill'
    /** 스킬을 사용하고 정지한 상태 */ this.STATE_STOP = 'stop'
    this.state = 'clock'


    this.subType = this.subTypeList.analog
    this.vibrationBaseX = 0
    this.vibrationBaseY = 0

    /** 스킬 공격력: 무려 120데미지! */ this.SKILL_ANALOG_ATTACK = 120
    this.SKILL_DIGITAL_ATTACK = 150
    this.SKILL_JONG_ATTACK = 180

    /** 플래시 시간 (시계가 공격하면 화면 전체가 영향을 받음) */ this.flashFrame = 0
    
    /** 현재 시간값 */ this.currentTime = 0
    /** 1틱에 해당하는 시간 */ this.tickTime = this.ANALOG_SKILL_TIME / this.ANALOG_HAND_SKILL_TICK
  }

  getCollisionArea () {
    super.getCollisionArea()
    return [
      this.getCollisionAreaCalcurationObject(48, 0, 64, 160),
      this.getCollisionAreaCalcurationObject(0, 51, 160, 55),
      this.getCollisionAreaCalcurationObject(35, 12, 90, 136),
      this.getCollisionAreaCalcurationObject(16, 21, 128, 118),
    ]
  }

  processState () {
    super.processState()
    this.processClock()
    this.processStateChange()
  }

  processClock () {
    if (this.subType === this.subTypeList.analog || this.subType === this.subTypeList.jong) {
      this.processAnalogClock()
    } else if (this.subType === this.subTypeList.digital) {
      this.processDigitalClock()
    }
  }

  processAnalogClock () {
    // 시계 진행 각도 설정 (시계바늘이 12에 위치할 때가 360도입니다.)
    let currentSecond = Math.floor(this.elapsedFrame / 60)
    let currentFrame = (this.elapsedFrame % 60)
    this.currentTime = currentSecond + (currentFrame / 60) // 총합 시간
    this.analogHand.degree = (this.currentTime / this.tickTime) * 30 // 각도 계산 1틱당 30도씩 이동

    // 각도 제한 (330도, 이것은 시계바늘이 11이상을 넘어가지 못하게 하기 위함)
    if (this.analogHand.degree > 330) {
      this.analogHand.degree = 330
    }
  }

  processDigitalClock () {
    this.currentTime = Math.floor(this.elapsedFrame / 60)

    // 시간 값 제한
    if (this.currentTime > this.DIGITAL_SKILL_TIME) this.currentTime = this.DIGITAL_SKILL_TIME
  }

  processStateChange () {
    let radTime = this.tickTime * this.ANALOG_HAND_RED_TICK
    let vibrationTime = this.tickTime * this.ANALOG_HAND_VIBRATION_TICK
    let skillTime = this.tickTime * this.ANALOG_HAND_SKILL_TICK

    if (this.currentTime >= radTime && this.currentTime < vibrationTime && this.state === this.STATE_NORMAL) {
      this.state = this.STATE_RED
      this.setMoveSpeed(0, 0) // 이동 정지
      this.vibrationBaseX = this.x // 진동 기준점 좌표 설정
      this.vibrationBaseY = this.y
    } else if (this.currentTime >= vibrationTime && this.currentTime < skillTime && this.state === this.STATE_RED) {
      this.state = this.STATE_VIBRATION
    } else if (this.currentTime >= skillTime && this.state === this.STATE_VIBRATION) {
      // 스킬 상태는 진동 상태일때만 변경됩니다.
      this.state = this.STATE_SKILL
    }
  }

  processMove () {
    super.processMove()
    if (this.state === this.STATE_VIBRATION) {
      this.x = this.vibrationBaseX + Math.random() * 20 - 10
      this.y = this.vibrationBaseY + Math.random() * 20 - 10

      if (this.elapsedFrame % 45 === 0) {
        soundSystem.play(soundSrc.enemyAttack.towerClockVibration)
      }
    }

    // 아날로그 핸드의 시계 위치를 정해진 곳에 위치하게 함.
    if (this.subType === this.subTypeList.analog) {
      this.analogHand.x = this.x
      this.analogHand.y = this.y
    } else if (this.subType === this.subTypeList.jong) {
      this.analogHand.x = this.x + 20
      this.analogHand.y = this.y + 40
    }
  }

  processAttack () {
    if (this.state === this.STATE_SKILL) {
      soundSystem.play(soundSrc.enemyAttack.towerClockAttack)
      let player = fieldState.getPlayerObject()
      player.addDamage(this.SKILL_ANALOG_ATTACK) // 플레이어는 회피 불가능 무조건 데미지를 받아야 함
      this.flashFrame = 45
      this.state = this.STATE_STOP // 공격후 상태 변경
    }

    // 플래시 프레임 감소
    if (this.flashFrame >= 1) this.flashFrame--
  }

  display () {
    if (this.state === this.STATE_RED || this.state === this.STATE_VIBRATION) {
      if (this.subType === this.subTypeList.analog) {
        this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.clockAnalogRed, this.x, this.y)
      } else if (this.subType === this.subTypeList.digital) {
        this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.clockDigitalRed, this.x, this.y)
      } else if (this.subType === this.subTypeList.jong) {
        super.display() // 종에 빨간색 시계를 덮어씌우는 구조라, 원본을 출력해야 함
        this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.clockAnalogRed, this.x + 20, this.y + 40)
      }
    } else {
      super.display()
    }
    
    if (this.subType === this.subTypeList.analog || this.subType === this.subTypeList.jong) {
      this.analogHand.display() // 아날로그 바늘 표시
    } else if (this.subType === this.subTypeList.digital) {
      this.displayDigital() // 디지털 시계 표시
    }

    // 화면 전체 영역의 플래시 표시
    if (this.flashFrame >= 1) {
      let flashColor = '#F9E79F' // 노란색 비슷
      if (this.subType === this.subTypeList.digital) flashColor = '#A3E4D7' // 연두색 비슷
      else if (this.subType === this.subTypeList.jong) flashColor = '#F1948A' // 빨간색 비슷

      graphicSystem.fillRect(0, 0, 999, 999, flashColor, this.flashFrame * 0.01)
    }
  }

  displayDigital () {
    // 이 디지털은 00:00 ~ 00:59까지만 표현됩니다. (10의 자리가 0일때는 0도 표시해야 합니다.)
    let outputText = '00 ' + (this.currentTime <= 9 ? '0' + this.currentTime : this.currentTime)
    let imgSrc = imageSrc.enemy.towerEnemyGroup3
    let imgD = imageDataInfo.towerEnemyGroup3
    for (let i = 0; i < outputText.length; i++) {
      let currentWord = outputText.charAt(i)
      switch (currentWord) {
        case '0': this.imageObjectDisplay(imgSrc, imgD.number0, this.x + 10 + (i * 32), this.y + 30); break
        case '1': this.imageObjectDisplay(imgSrc, imgD.number1, this.x + 10 + (i * 32), this.y + 30); break
        case '2': this.imageObjectDisplay(imgSrc, imgD.number2, this.x + 10 + (i * 32), this.y + 30); break
        case '3': this.imageObjectDisplay(imgSrc, imgD.number3, this.x + 10 + (i * 32), this.y + 30); break
        case '4': this.imageObjectDisplay(imgSrc, imgD.number4, this.x + 10 + (i * 32), this.y + 30); break
        case '5': this.imageObjectDisplay(imgSrc, imgD.number5, this.x + 10 + (i * 32), this.y + 30); break
        case '6': this.imageObjectDisplay(imgSrc, imgD.number6, this.x + 10 + (i * 32), this.y + 30); break
        case '7': this.imageObjectDisplay(imgSrc, imgD.number7, this.x + 10 + (i * 32), this.y + 30); break
        case '8': this.imageObjectDisplay(imgSrc, imgD.number8, this.x + 10 + (i * 32), this.y + 30); break
        case '9': this.imageObjectDisplay(imgSrc, imgD.number9, this.x + 10 + (i * 32), this.y + 30); break
      }
    }
  }

  static AnalogHand = class extends FieldData {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.clockAnalogHand)
    }
  }
}

class TowerEnemyGroup3ClockDigital extends TowerEnemyGroup3ClockAnalog {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.clockDigital)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerClockDigital, imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.enemyDieClockDigital, 2)
    this.subType = this.subTypeList.digital
    this.tickTime = this.DIGITAL_SKILL_TIME / this.ANALOG_HAND_SKILL_TICK
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject()
    ]
  }
}

class TowerEnemyGroup3ClockJong extends TowerEnemyGroup3ClockAnalog {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.clockJong)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerClockJong, imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.enemyDieClockJong, 3)
    this.setEnemyByCpStat(500, 15)
    this.subType = this.subTypeList.jong
    this.tickTime = this.JONG_SKILL_TIME / this.ANALOG_HAND_SKILL_TICK
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 40, 200, 160),
      this.getCollisionAreaCalcurationObject(75, 0, 50, 240),
      this.getCollisionAreaCalcurationObject(38, 19, 126, 200),
    ]
  }
}

class TowerEnemyGroup3EnergyBlue extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.energyBlue, 2)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerEnergy1)
    this.setEnemyByCpStat(100, 12)
    this.setRandomMoveSpeed(1, 1)
    this.BASE_SPEED = 0.6
    this.isPossibleExit = false
    if (Math.random() < 0.5) this.moveSpeedY *= -1 // (y축 속도 반전용)

    this.moveDelay = new DelayData(240)
    this.dieAfterDeleteDelay = new DelayData(60)
  }

  processMove () {
    super.processMove()
    if (this.moveDelay.check()) {
      this.setRandomMoveSpeed(this.BASE_SPEED, this.BASE_SPEED)
      if (Math.random() < 0.5) this.moveSpeedY *= -1 // (y축 속도 반전용)
    }

    if (this.x <= 0) {
      this.x = graphicSystem.CANVAS_WIDTH + this.width
      if (this.moveSpeedX < 0) this.moveSpeedX = 1
    }
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(50, 16, 100, 168),
      this.getCollisionAreaCalcurationObject(16, 47, 168, 110),
    ]
  }

  processDieAfter () {
    super.processDieAfter()
    if (this.isDied) {
      this.dieAfterDeleteDelay.check(false)
      let changeSize = (this.imageData.width / this.dieAfterDeleteDelay.delay) * 2
      this.setWidthHeight(this.width - changeSize, this.height - changeSize)
      this.x += changeSize / 2
      this.y += changeSize / 2

      if (this.width < 1) this.width = 1
      if (this.height < 1) this.height = 1
    }
  }
}

class TowerEnemyGroup3EnergyOrange extends TowerEnemyGroup3EnergyBlue {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataInfo.towerEnemyGroup3.energyOrange, 2)
    this.setEnemyByCpStat(100, 12)
    this.setRandomMoveSpeedMinMax(0.6, 0.6, 1.2, 1.2)
  }
}

class TowerEnemyGroup3EnergyA extends TowerEnemyGroup3EnergyBlue {
  constructor () {
    super()
    let randomColorNumber = Math.floor(Math.random() * 2)
    let imageDataList = [
      imageDataInfo.towerEnemyGroup3.energyA1,
      imageDataInfo.towerEnemyGroup3.energyA2,
      imageDataInfo.towerEnemyGroup3.energyA3,
    ]

    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup3, imageDataList[randomColorNumber], 2)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerEnergy2)
    this.setEnemyByCpStat(20, 12)
    this.dieAfterDeleteDelay = new DelayData(30)
    this.BASE_SPEED = 0.7
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(46, 41, 69, 75)
    ]
  }
}

class TowerEnemyGroup4Nokgasi1 extends TowerEnemy {
  constructor () {
    super()
    this.setEnemyByCpStat(11200, 10)
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.nokgasi1, 4)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerNokgasi, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedOrange)
    this.setMoveSpeed(0, 0) // 이동속도 없음 (처음엔 위치 고정)

    /** 녹가시2 이미지데이터 
     *  이것은 녹가시1 + 녹가시2 이미지를 동시 표현하기 위해 참조하는 데이터임 */ 
    this.nokgasi2ImageData = imageDataInfo.towerEnemyGroup4.nokgasi2
    this.nokgasi2Enimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.nokgasi2, 4, -1)
    this.collisionDelay.delay = 20 // 초당 3회 공격
    
    /** 가시 발사체에 대한 클래스 */ this.GasiShotClass = TowerEnemyGroup4Nokgasi1.Gasishot
    /** 가시 발사체에 대한 색 리스트 */ this.gasiColorList = TowerEnemyGroup4Nokgasi1.Gasishot.colorList
    /** 가시 발사체에 대한 파란색 클래스 (다른 가시와 다름) */ this.GasiShotBlueClass = TowerEnemyGroup4Nokgasi1.GasiShotBlue
    /** 자기 클래스에 대한 static 접근 */ this.myStatic = TowerEnemyGroup4Nokgasi1
    /** 가시에 관한 정보에 대한 상수 객체 */ this.gasi = this.myStatic.gasi

    this.moveDelay = new DelayData(300)
    this.attackDelay = new DelayData(300)

    /** 가시 패턴 배열 */ this.gasiPatternTable = []
    /** 가시 패턴의 번호값 */ this.currentGasiPatternTableNumber = 0
    /** 가시 퍼플 6 공격 방향 설정용 */ this.gasiPurple6ArrowCount = 0
    this.createRandomGasiPattern() // 가시 패턴 생성

    /** 가시 효과음 재생 리스트 */ this.gasiSoundWaitList = []
    /** 가시 효과음 재생에 대한 지연값 */ this.gasiSoundWaitDelay = []

    this.dieAfterDeleteDelay = new DelayData(120)
  }

  /**
   * 가시 사운드를 생성, 이 사운드는 일정 딜레이 후 재생됨
   * @param {string} soundSrc 사운드의 경로
   * @param {number} waitDelay 지연 대기 시간
   */
  createGasiSound (soundSrc, waitDelay) {
    this.gasiSoundWaitList.push(soundSrc)
    this.gasiSoundWaitDelay.push(waitDelay)
  }

  /** 랜덤한 가시 패턴 생성 */
  createRandomGasiPattern () {
    this.gasiPatternTable.length = 0 // 기존 배열 삭제
    let numberTable = [1, 2, 3, 4, 5, 6, 7, 8, 9] // 기존 숫자의 대한 배열

    // 루프를 돌아서 중복되지 않는 배열을 계속 생성
    for (let i = 0; i < 10; i++) {
      let tempArray = [1, 2, 3, 4, 5, 6, 7, 8, 9] // 임시 배열
      for (let j = 0; j < numberTable.length; j++) {
        let random = Math.floor(Math.random() * tempArray.length)
        let numberArray = tempArray.splice(random, 1) // 임시 배열에서 원소 제거 (제거된 값은 배열로 리턴됨)
        let number = numberArray[0] // 배열에 있는 원소를 숫자로 변경
        this.gasiPatternTable.push(number) // 해당 숫자를 가시 패턴 테이블에 추가
      }
    }
  }

  processState () {
    super.processState()
    this.processGasiSound()
  }

  processAttack () {
    super.processAttack()

    // 등장한지 5초 이내에는 공격하지 않음
    if (this.elapsedFrame <= 300) return
    
    // 일정 공격주기마다 패턴 변경
    // 각 공격마다 내부 딜레이는 다를 수 있습니다. (자세한 것은 내부 함수들 참조)
    if (this.attackDelay.check()) {
      this.currentGasiPatternTableNumber++
    }

    // hp가 20% 이하이면 하이퍼모드
    if (this.hp <= this.hpMax * 0.2) {
      this.processAttackTypeHyper()
      return
    }

    // 일반 모드 상태에서의 공격
    let currentGasiPatternNumber = this.gasiPatternTable[this.currentGasiPatternTableNumber % this.gasiPatternTable.length]
    switch (currentGasiPatternNumber) {
      case 1: this.processAttackTypeOrange1(); break
      case 2: this.processAttackTypeOrange2(); break
      case 3: this.processAttackTypeGreen3(); break
      case 4: this.processAttackTypeGreen4(); break
      case 5: this.processAttackTypePurple5(); break
      case 6: this.processAttackTypePurple6(); break
      case 7: this.processAttackTypeBlue7(); break
      case 8: this.processAttackTypePink8(); break
      case 9: this.processAttackTypeGrey9(); break
    }
  }

  processGasiSound () {
    for (let i = 0; i < this.gasiSoundWaitList.length; i++) {
      if (this.gasiSoundWaitDelay[i] === 0) {
        soundSystem.play(this.gasiSoundWaitList[i]) // 사운드 재생
        this.gasiSoundWaitDelay[i] = -999 // 지연시간 마이너스로 변경
      } else if (this.gasiSoundWaitDelay[i] >= 1) {
        this.gasiSoundWaitDelay[i]--
      }
    }

    // 배열 내부에서 사용되지 않는 데이터를 제거하기 위한 작업 
    // (배열을 제거하는데 splice를 사용하고 이렇게되면 배열 중간이 잘리므로, 역순으로 처리함)
    if (this.gasiSoundWaitDelay.length === 0) return
    for (let i = this.gasiSoundWaitDelay.length; i >= 0; i--) {
      if (this.gasiSoundWaitDelay[i] <= -1) {
        this.gasiSoundWaitDelay.splice(i, 1)
        this.gasiSoundWaitList.splice(i, 1)
      }
    }
  }

  /** 
   * 패턴: 오렌지 1
   * 
   * 가시가 특정 영역을 제외하고, 모든 범위에 퍼진 후 발사됩니다.
   */
  processAttackTypeOrange1 () {
    if (!this.attackDelay.divCheck(60)) return

    // 총알이 이동하지 않는 y좌표 테이블 (해당 y좌표에서 총알이 발사되지 않음) 
    let notMoveBulletYLineTable = []

    // 총알은 20px 단위로 발사됨. 라인 번호는 800x600px 기준 최대 10번까지 있음.
    // 0 ~ 5, 6 ~ 10 각각의 범위마다 1씩 비어있는 공간을 결정함
    for (let i = 0; i < 2; i++) {
      let random = (i * 5) + Math.floor(Math.random() * 5)
      notMoveBulletYLineTable.push(random)
    }

    // 라인 최대 카운트 = 발사 횟수
    const BULLET_Y_LINE = this.gasi.GASI_LINE_HEIGHT
    const BULLET_SHOT = 3
    const LINE_MAX_COUNT = graphicSystem.CANVAS_HEIGHT / (BULLET_Y_LINE * BULLET_SHOT)
    for (let i = 0; i < LINE_MAX_COUNT; i++) {
      // 이동할 수 없는 YLine 테이블을 조회하여, i값이 이 배열 안에 없을경우에 총알 생성
      if (!notMoveBulletYLineTable.includes(i)) {
        for (let j = 0; j < BULLET_SHOT; j++) { // 총알 3발 발사
          let bullet = new this.GasiShotClass()
          bullet.setColor(this.gasiColorList.orange)
          bullet.setMoveSpeed(this.gasi.speedList.MID, 0)
          bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width, this.centerY)
          bullet.setAutoMovePosition(graphicSystem.CANVAS_WIDTH - bullet.width, ((BULLET_Y_LINE * BULLET_SHOT) * i) + (BULLET_Y_LINE * j), 60)
          bullet.setNextMoveDelay(this.gasi.delayList.LOW)
          bullet.attack = this.gasi.ATTACK
          fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
        }
      }
    }

    soundSystem.play(this.gasi.soundList.orange_purple)
  }

  /**
   * 패턴 오렌지 2
   * 
   * 가시가 특정 영역에 소환된 후, 일정한 속도로 대각선(y축 속도가 있음) 이동. 
   * 이동 방향은 랜덤
   */
  processAttackTypeOrange2 () {
    if (!this.attackDelay.divCheck(60)) return

    const centerHeight = (graphicSystem.CANVAS_HEIGHT / 2)
    const bulletHeight = this.gasi.GASI_LINE_HEIGHT * 2
    const bulletCount = centerHeight / bulletHeight
    let startY = Math.random() * centerHeight
    let targetSpeedY = Math.random() < 0.5 ? -2 : 2

    for (let i = 0; i < bulletCount; i++) {
      let bullet = new this.GasiShotClass()
      bullet.setColor(this.gasiColorList.orange)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width, startY + (i * bulletHeight))
      bullet.setMoveSpeed(this.gasi.speedList.MID, targetSpeedY)
      bullet.setNextMoveDelay(this.gasi.delayList.LOW)
      bullet.attack = this.gasi.ATTACK
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(this.gasi.soundList.orange_purple)
  }

  /**
   * 패턴 그린 3
   * 
   * 무작위 위치에 총알을 생성하고, 엄청난 속도로 연사함
   */
  processAttackTypeGreen3 () {
    if (!this.attackDelay.divCheck(75)) return

    const LINE_HEIGHT = this.gasi.GASI_LINE_HEIGHT
    let randomY = Math.random() * graphicSystem.CANVAS_HEIGHT - LINE_HEIGHT

    for (let i = 0; i < 40; i++) {
      let bullet = new this.GasiShotClass()
      bullet.setColor(this.gasiColorList.green)

      let targetX = graphicSystem.CANVAS_WIDTH - bullet.width - (Math.random() * LINE_HEIGHT)
      let targetY = randomY + (Math.random() * (LINE_HEIGHT * 2)) - LINE_HEIGHT
      bullet.setPosition(targetX, targetY)
      bullet.setMoveSpeed(this.gasi.speedList.TURBO, 0)
      bullet.setNextMoveDelay(this.gasi.delayList.NORMAL + (i * 1))
      bullet.attack = this.gasi.ATTACK_WEAK
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)

      // 가시 발사 사운드 재생 (사운드 너무 많이 출력을 막기위해 1/4 만큼 출력함)
      if (i % 4 === 0) {
        this.createGasiSound(this.gasi.soundList.green_grey, this.gasi.delayList.NORMAL + (i * 1))
      }
    }
  }

  /** 
   * 그린 4 패턴
   * 
   * 무작위 영역에 가시를 소환하고 연사합니다. (3과는 약간 다름)
   */
  processAttackTypeGreen4 () {
    if (!this.attackDelay.divCheck(75)) return

    const LINE_HEIGHT = this.gasi.GASI_LINE_HEIGHT
    const divNumber = 6
    let randomY = Math.random() * (graphicSystem.CANVAS_HEIGHT - (LINE_HEIGHT * 6))
    
    for (let i = 0; i < 30; i++) {
      let delayNumber = Math.floor(i / divNumber)
      let currentY = randomY + ((i % divNumber) * LINE_HEIGHT)
      let bullet = new this.GasiShotClass()
      bullet.setColor(this.gasiColorList.green)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width, currentY)
      bullet.setNextMoveDelay(30 + (delayNumber * 6))
      bullet.setMoveSpeed(-24, 0)
      bullet.attack = this.gasi.ATTACK_WEAK
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)

      // 가시 발사 사운드 재생 (사운드 너무 많이 출력을 막기위해 1/4 만큼 출력함)
      if (i % 6 === 0) {
        this.createGasiSound(this.gasi.soundList.green_grey, 30 + (delayNumber * 6))
      }
    }

    soundSystem.play(this.gasi.soundList.green_grey)
  }

  /**
   * 퍼플 5 패턴
   * 
   * 특정 영역에 가시를 소환하고 그 가시는 일정시간 후 플레이어가 있는 방향으로 이동됩니다.
   */
  processAttackTypePurple5 () {
    if (!this.attackDelay.divCheck(100)) return

    const LINE_HEIGHT = this.gasi.GASI_LINE_HEIGHT
    const RANGE = LINE_HEIGHT * 3
    let startY1 = RANGE + Math.random() * RANGE
    let startY2 = graphicSystem.CANVAS_HEIGHT - (RANGE * 2) + Math.random() * RANGE
    let player = fieldState.getPlayerObject()

    for (let i = 0; i < 20; i++) {
      let currentY = i % 2 === 0 ? startY1 : startY2 // 홀짝에 따라 위치 구분
      let bullet = new this.GasiShotClass()
      bullet.setColor(this.gasiColorList.purple)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width - (4 * i), currentY)
      bullet.setMoveSpeedChaseLine(player.x, player.y, 60, 6)
      bullet.setNextMoveDelay(this.gasi.delayList.NORMAL + (Math.floor(i / 2) * 2))
      bullet.attack = this.gasi.ATTACK_WEAK
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(this.gasi.soundList.orange_purple)
    this.createGasiSound(this.gasi.soundList.green_grey, this.gasi.delayList.NORMAL)
  }

  /**
   * 퍼플 6 패턴
   * 
   * 가시가 전 영역에 걸쳐서 생성되고, 
   * 그 가시는 위에서 아래로 또는 아래서 위로 순서대로 플레이어를 추적합니다.
   */
  processAttackTypePurple6 () {
    if (!this.attackDelay.divCheck(100)) return

    let player = fieldState.getPlayerObject()
    const canvasHeight = graphicSystem.CANVAS_HEIGHT
    const bulletHeight = (this.gasi.GASI_LINE_HEIGHT * 2)
    const bulletCount = canvasHeight / bulletHeight

    this.gasiPurple6ArrowCount++
    for (let i = 0; i < bulletCount; i++) {
      let bullet = new this.GasiShotClass()
      let currentY = this.gasiPurple6ArrowCount % 2 == 0 ? i * bulletHeight : canvasHeight - (i * bulletHeight)
      bullet.setColor(this.gasiColorList.purple)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width, currentY)
      bullet.setMoveSpeedChaseLine(player.x, player.y, 60, 6)
      bullet.setNextMoveDelay(this.gasi.delayList.NORMAL + (i * 2))
      bullet.attack = this.gasi.ATTACK_WEAK
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }
    
    soundSystem.play(this.gasi.soundList.orange_purple)
    this.createGasiSound(this.gasi.soundList.green_grey, this.gasi.delayList.NORMAL)
  }

  /**
   * 블루 7 패턴
   * 
   * 가시는 왼쪽으로 이동하면서 위, 아래로 이동하는 가시를 추가 생성
   * 
   * 다른 가시와 패턴이 완전히 다른 구조라서, 이 가시는 다른 가시 클래스로 생성해야 합니다.
   */
  processAttackTypeBlue7 () {
    if (!this.attackDelay.divCheck(100)) return

    // 테스트 5 패턴 - 파란색 (가로세로)
    const LINE = this.gasi.GASI_LINE_HEIGHT * 6
    
    for (let i = 0; i < 2; i++) {
      let startY1 = graphicSystem.CANVAS_HEIGHT_HALF - LINE + (Math.random() * (LINE * 2))
      let currentY = startY1
      let bullet = new this.GasiShotBlueClass()
      bullet.setColor(this.gasiColorList.blue)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width, currentY)
      bullet.setMoveSpeed(this.gasi.speedList.LOW, 0)
      bullet.setNextMoveDelay(this.gasi.delayList.LOW)
      bullet.attack = this.gasi.ATTACK
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(this.gasi.soundList.blue)
  }

  /**
   * 핑크 8 패턴
   * 
   * 왼쪽으로 이동하던 가시가 왼쪽(화면 맨 끝)에 부딪히면 오른쪽으로 이동합니다.
   */
  processAttackTypePink8 () {
    if (!this.attackDelay.divCheck(60)) return

    for (let i = 0; i < 3; i++) {
      let bullet = new this.myStatic.GasiShotPink()
      bullet.setColor(this.gasiColorList.pink)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width, Math.random() * (graphicSystem.CANVAS_HEIGHT - bullet.height))
      bullet.setMoveSpeed(-6, 0)
      bullet.setNextMoveDelay(30)
      bullet.attack = this.gasi.ATTACK
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(this.gasi.soundList.pink)
  }

  /** 
   * 그레이 9 패턴 
   * 
   * 무작위 방향, 무작위 속도
   */
  processAttackTypeGrey9 () {
    if (!this.attackDelay.divCheck(60)) return

    for (let i = 0; i < 6; i++) {
      let bullet = new this.myStatic.Gasishot()
      bullet.setColor(this.gasiColorList.grey)
      bullet.setMoveSpeed(Math.random() * -4 - 6, Math.random() * 4 - 2)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width, Math.random() * (graphicSystem.CANVAS_HEIGHT - bullet.height))
      bullet.setNextMoveDelay(12)
      bullet.attack = this.gasi.ATTACK
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(this.gasi.soundList.green_grey)
  }

  /**
   * 하이퍼 패턴 (무작위로 난사함)
   */
  processAttackTypeHyper () {
    if (!this.attackDelay.divCheck(10)) return

    let randomColor = Math.floor(Math.random() * 5)
    let targetColor = ''
    switch (randomColor) {
      case 0: targetColor = this.gasiColorList.orange; break
      case 1: targetColor = this.gasiColorList.blue; break
      case 2: targetColor = this.gasiColorList.pink; break
      case 3: targetColor = this.gasiColorList.purple; break
      case 4: targetColor = this.gasiColorList.green; break
      case 5: targetColor = this.gasiColorList.grey; break
    }

    for (let i = 0; i < 1; i++) {
      let bullet = new this.myStatic.Gasishot()
      bullet.setColor(targetColor)
      bullet.setMoveSpeed(Math.random() * -6 - 6, Math.random() * 6 - 3)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width, Math.random() * (graphicSystem.CANVAS_HEIGHT - bullet.height))
      bullet.setNextMoveDelay(12)
      bullet.attack = this.gasi.ATTACK
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(this.gasi.soundList.green_grey)
  
  }

  processMove () {
    super.processMove()
    if (this.moveSpeedY === 0 && this.moveDelay.check()) {
      this.setMoveSpeed(0, 0.2)
    }

    // 이 오브젝트는 자체적으로 녹가시1의 정보만 가지고 있습니다.
    // 그래서 보스 본체가 완전하게 보여지려면, 녹가시2부분의 크기도 같이 고려해야 합니다.
    if (this.x + this.width + (this.nokgasi2ImageData.width) > graphicSystem.CANVAS_WIDTH) {
      this.x-- // 화면 안에 오도록 변경함

      // 화면 안에 들어온경우, 이제 보스는 화면 바깥으로 나갈 수 없음.
      if (this.x + this.width + (this.nokgasi2ImageData.width) <= graphicSystem.CANVAS_WIDTH) {
        this.isPossibleExit = false
      }

      // x축이 화면 안으로 들어오는동안 y축도 보정됨
      if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
        this.y -= 10
      } else if (this.y < 0) {
        this.y += 10
      }
    }
  }

  processEnimation () {
    super.processEnimation()
    this.nokgasi2Enimation.process()
  }

  getCollisionArea () {
    // 가시 1 부분의 길이
    let gasi1Width = this.imageData.width

    // 가시 2는 가시 1과 크기가 달라 중앙 정렬을 위해서 따로 계산해야함
    let gasi2HeightBaseY = -(this.nokgasi2ImageData.height - this.imageData.height) / 2
    return [
      // nokgasi1
      this.getCollisionAreaCalcurationObject(0, 10, 90, 10),
      this.getCollisionAreaCalcurationObject(30, 10, 70, 10),
      this.getCollisionAreaCalcurationObject(50, 20, 50, 260),
      this.getCollisionAreaCalcurationObject(30, 280, 70, 10),
      this.getCollisionAreaCalcurationObject(10, 290, 90, 10),

      // nokgasi2
      this.getCollisionAreaCalcurationObject(gasi1Width + 0, gasi2HeightBaseY + 50, 100, 260),
      this.getCollisionAreaCalcurationObject(gasi1Width + 5, gasi2HeightBaseY + 20, 90, 30),
      this.getCollisionAreaCalcurationObject(gasi1Width + 5, gasi2HeightBaseY + 350, 90, 30),
    ]
  }

  processDieAfter () {
    super.processDieAfter()

    if (this.isDied && this.dieAfterDeleteDelay.divCheck(12) && this.dieEffect != null) {
      fieldState.createEffectObject(this.dieEffect.getObject(), this.x, this.y)
      soundSystem.play(this.dieSound)
    }
    
    if (this.isDeleted) {
      fieldState.createEnemyObject(ID.enemy.towerEnemyGroup4.nokgasi2, this.x + this.width, this.y)
      soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossCommon)
    }
  }

  display () {
    super.display()

    // 2번째 이미지 출력
    this.nokgasi2Enimation.display(this.x + this.imageData.width, this.y - 50)
  }

  static gasi = class {
    /** 가시의 속도 리스트 (방향이 왼쪽으로 발사되므로, 마이너스 값입니다.) */ 
    static speedList = {
      TURBO: -24,
      HIGH: -12,
      MID: -6,
      LOW: -4,
    }

    /** 가시가 발사되기까지의 대기시간 */
    static delayList = {
      NORMAL: 60,
      LOW: 30,
    }

    /** 가시의 공격력 */ static ATTACK = 5
    /** 가시의 공격력 (약화버전) */ static ATTACK_WEAK = 2
    /** 가시가 표현되는 각 라인의 대한 길이 (참고: 가시의 height와는 다릅니다.) */ static GASI_LINE_HEIGHT = 20

    static soundList = {
      orange_purple: soundSrc.enemyAttack.towerNokgasiAttackOrangePurple,
      green_grey: soundSrc.enemyAttack.towerNokgasiAttackGreenGrey,
      pink: soundSrc.enemyAttack.towerNokgasiAttackPink,
      blue: soundSrc.enemyAttack.towerNokgasiAttackBlue,
    }
  }

  static Gasishot = class extends CustomEnemyBullet {
    constructor () {
      super()
      
      // 총알을 강제 이동시키기 위한 좌표 객체 값
      this.autoMove = {
        x: 0,
        y: 0,
        delay: 0,
        delayCount: 0,
        speedX: 0,
        speedY: 0,
      }

      /** 다음 이동 딜레이 지연값. 이 값이 양수이면은 해당 시간동안 움직이지 않습니다.
       * 만약 autoMove상태라면 이 지연값은 감소하지 않습니다.
      */
      this.nextMoveDelayCount = 0
    }

    processMove () {
      if (this.autoMove.delay !== 0) {
        // 해당 좌표값을 강제 이동시키기 위하여, 자동 이동되도록 처리함
        // 이동 범위에 도착했는지는 검사하지 않습니다. (어차피 반드시 해당 좌표에 도착하므로)
        this.x += this.autoMove.speedX
        this.y += this.autoMove.speedY
        this.autoMove.delayCount++

        // autoMove 딜레이 삭제해서 정상 모드로 되돌림
        if (this.autoMove.delayCount >= this.autoMove.delay) {
          this.autoMove.delay = 0
        }
      } else if (this.nextMoveDelayCount <= 0) {
        // 다음 이동 지연 카운트가 0이하이면 정상적으로 해당 객체는 이동함
        super.processMove()
      } else {
        // 다음 이동 지연 카운트 감소용
        this.nextMoveDelayCount--
      }
    }
  
    static colorList = {
      blue: 'blue',
      green: 'green',
      orange: 'orange',
      purple: 'purple',
      grey: 'grey',
      default: '',
      pink: 'pink'
    }

    colorList = TowerEnemyGroup4Nokgasi1.Gasishot.colorList

    /**
     * 타입 생성: 해당 행위를 하지 않으면 해당 무기는 자동 삭제됨.
     */
    setColor (colorType = '') {
      this.state = colorType
      let currentImageSrc = imageSrc.enemy.towerEnemyGroup4
      switch (colorType) {
        case this.colorList.blue: this.setAutoImageData(currentImageSrc, imageDataInfo.towerEnemyGroup4.nokgasiShotBlue); break
        case this.colorList.green: this.setAutoImageData(currentImageSrc, imageDataInfo.towerEnemyGroup4.nokgasiShotGreen); break
        case this.colorList.grey: this.setAutoImageData(currentImageSrc, imageDataInfo.towerEnemyGroup4.nokgasiShotGrey); break
        case this.colorList.orange: this.setAutoImageData(currentImageSrc, imageDataInfo.towerEnemyGroup4.nokgasiShotOrange); break
        case this.colorList.purple: this.setAutoImageData(currentImageSrc, imageDataInfo.towerEnemyGroup4.nokgasiShotPurple); break
        case this.colorList.pink: this.setAutoImageData(currentImageSrc, imageDataInfo.towerEnemyGroup4.nokgasiShotPink); break
        default: this.setAutoImageData(currentImageSrc, imageDataInfo.towerEnemyGroup4.nokgasiShotGreen); break
      }
    }

    /**
     * 총알이 강제로 위치해야 되는 방향
     * @param {number} targetX 목표지점 x좌표
     * @param {number} targetY 목표지점 y좌표
     * @param {number} finishMoveDelay 도착지점까지 이동하는데 걸리는 딜레이값
     */
    setAutoMovePosition (targetX, targetY, finishMoveDelay) {
      this.autoMove.x = targetX
      this.autoMove.y = targetY
      this.autoMove.delay = finishMoveDelay
      this.autoMove.delayCount = 0
      this.autoMove.speedX = (targetX - this.x) / finishMoveDelay
      this.autoMove.speedY = (targetY - this.y) / finishMoveDelay
    }

    /**
     * 총알의 자동 이동을 막기 위한 딜레이값 지정 함수
     * @param {number} delay 
     */
    setNextMoveDelay (delay) {
      this.nextMoveDelayCount = delay
    }
  }

  static GasiShotBlue = class extends TowerEnemyGroup4Nokgasi1.Gasishot {
    constructor () {
      super()
      this.subType = this.subTypeList.gasishotMain
      this.stateDelay = new DelayData(60)
    }

    processState () {
      super.processState()
      if (this.subType !== this.subTypeList.gasishotMain) return

      if (this.stateDelay.check()) {
        // 새로운 총알을 또 생성 (다만 타입이 좀 다름)
        for (let i = 0; i < 2; i++) {
          let speedY = i % 2 === 0 ? 4 : -4
          let bullet = new TowerEnemyGroup4Nokgasi1.GasiShotBlue()
          bullet.setColor(this.colorList.blue)
          bullet.setMoveSpeed(0, speedY)
          bullet.setPosition(this.x, this.y)
          bullet.attack = this.attack
          bullet.subType = this.subTypeList.gasishotSub // 가시의 타입을 다른것으로 변경 (중복 생성 방지)
          fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
        }
      }
    }
    
    static subTypeList = {
      gasishotMain: 'gasishotMain',
      gasishotSub: 'gasishotSub'
    }

    subTypeList = TowerEnemyGroup4Nokgasi1.GasiShotBlue.subTypeList
  }

  static GasiShotPink = class extends TowerEnemyGroup4Nokgasi1.Gasishot {
    constructor () {
      super()
      this.state = 'left'
    }

    processMove () {
      super.processMove()
      if (this.x <= 0) {
        this.setMoveSpeed(Math.abs(this.moveSpeedX), this.moveSpeedY + Math.random() * 0.4 - 0.2)
        this.x = 1
        this.state = 'right'
      }
    }
  }
}

/** 이 클래스는 nokgasi1과 유사하지만, 서로 다른기능을 사용하기 때문에 상속하지 않았습니다. */
class TowerEnemyGroup4Nokgasi2 extends TowerEnemy {
  constructor () {
    super()
    this.setEnemyByCpStat(14000, 2)
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.nokgasi2, 4)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerNokgasi, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedWhite)
    this.setMoveSpeed(0, 0) // 이동속도 없음 (위치 고정)
    this.myStatic = TowerEnemyGroup4Nokgasi2
    this.GasiShot = this.myStatic.GasiGasi
    this.gasi = this.myStatic.gasi
    this.attackDelay = new DelayData(300)
    this.moveDelay = new DelayData(60)
    this.collisionDelay.delay = 6
    /** 하이퍼 모드 전용 속도 가속 값 */ this.speedAcc = 0
    this.dieAfterDeleteDelay = new DelayData(300)
    this.isPossibleExit = false

    this.customEffect = new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleBlue, 40, 40, 2)

    /** 가시 패턴 배열 */ this.gasiPatternTable = []
    /** 가시 패턴의 번호값 */ this.currentGasiPatternTableNumber = 0
    this.createRandomGasiPattern()

    /** 가시 효과음 재생 리스트 */ this.gasiSoundWaitList = []
    /** 가시 효과음 재생에 대한 지연값 */ this.gasiSoundWaitDelay = []
  }

  /**
   * 가시 사운드를 생성, 이 사운드는 일정 딜레이 후 재생됨
   * @param {string} soundSrc 사운드의 경로
   * @param {number} waitDelay 지연 대기 시간
   */
  createGasiSound (soundSrc, waitDelay) {
    this.gasiSoundWaitList.push(soundSrc)
    this.gasiSoundWaitDelay.push(waitDelay)
  }

  /** 랜덤한 가시 패턴 생성 */
  createRandomGasiPattern () {
    this.gasiPatternTable.length = 0 // 기존 배열 삭제
    let numberTable = [1, 2, 3, 4, 5] // 기존 숫자의 대한 배열

    // 루프를 돌아서 중복되지 않는 배열을 계속 생성
    for (let i = 0; i < 10; i++) {
      let tempArray = [1, 2, 3, 4, 5] // 임시 배열
      for (let j = 0; j < numberTable.length; j++) {
        let random = Math.floor(Math.random() * tempArray.length)
        let numberArray = tempArray.splice(random, 1) // 임시 배열에서 원소 제거 (제거된 값은 배열로 리턴됨)
        let number = numberArray[0] // 배열에 있는 원소를 숫자로 변경
        this.gasiPatternTable.push(number) // 해당 숫자를 가시 패턴 테이블에 추가
      }
    }
  }

  getCollisionArea () {
    return [
      this.getCollisionAreaCalcurationObject(0, 50, 100, 260),
      this.getCollisionAreaCalcurationObject(5, 20, 90, 30),
      this.getCollisionAreaCalcurationObject(5, 350, 90, 30),
    ]
  }

  processState () {
    super.processState()
    this.processGasiSound()
  }

  processGasiSound () {
    for (let i = 0; i < this.gasiSoundWaitList.length; i++) {
      if (this.gasiSoundWaitDelay[i] === 0) {
        soundSystem.play(this.gasiSoundWaitList[i]) // 사운드 재생
        this.gasiSoundWaitDelay[i] = -999 // 지연시간 마이너스로 변경
      } else if (this.gasiSoundWaitDelay[i] >= 1) {
        this.gasiSoundWaitDelay[i]--
      }
    }

    // 배열 내부에서 사용되지 않는 데이터를 제거하기 위한 작업 
    // (배열을 제거하는데 splice를 사용하고 이렇게되면 배열 중간이 잘리므로, 역순으로 처리함)
    if (this.gasiSoundWaitDelay.length === 0) return
    for (let i = this.gasiSoundWaitDelay.length; i >= 0; i--) {
      if (this.gasiSoundWaitDelay[i] <= -1) {
        this.gasiSoundWaitDelay.splice(i, 1)
        this.gasiSoundWaitList.splice(i, 1)
      }
    }
  }

  processAttack () {
    super.processAttack()
    if (this.attackDelay.check()) {
      this.currentGasiPatternTableNumber++
    } 

    if (this.hp <= this.hpMax * 0.2) {
      this.processAttackHyper()
    } else {
      let currentGasiPatternNumber = this.gasiPatternTable[this.currentGasiPatternTableNumber % this.gasiPatternTable.length]
      switch (currentGasiPatternNumber) {
        case 1: this.processAttackBottom1(); break
        case 2: this.processAttackThrow2(); break
        case 3: this.processAttackSpear3(); break
        case 4: this.processAttackSting4(); break
        case 5: this.processAttackPattern5(); break
      }
    }
  }

  /** 
   * 바텀 1 패턴
   * 
   * 가시가 밑에서 생성된 후 정해진 위치로 이동 후 일정시간이 지나면 위로 위동
   */
  processAttackBottom1 () {
    if (!this.attackDelay.divCheck(60)) return

    for (let i = 0; i < 6; i++) {
      let bullet = new this.GasiShot()
      bullet.setColorDirection(this.gasi.colorList.BLUE, this.gasi.directionList.UP)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - bullet.width, graphicSystem.CANVAS_HEIGHT - bullet.height)
      bullet.setPatternType(this.gasi.patternList.BOTTOM)
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(soundSrc.enemyAttack.towerNokgasiGasiBottom)
    this.createGasiSound(soundSrc.enemyAttack.towerNokgasiGasiShot, 120)
  }

  /**
   * 뜨로우(던지기) 2 패턴
   * 
   * 아래 가속도가 있는 가시를 위로 던짐, 가시는 서서히 아래로 가속하면서 내려감
   */
  processAttackThrow2 () {
    if (!this.attackDelay.divCheck(12)) return

    for (let i = 0; i < 1; i++) {
      let bullet = new this.GasiShot()
      bullet.setColorDirection(this.gasi.colorList.GREEN, this.gasi.directionList.UP)
      bullet.setPosition(this.centerX, this.y + this.width)
      bullet.setPatternType(this.gasi.patternList.THROW)
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(soundSrc.enemyAttack.towerNokgasiGasiThrow)
  }

  /**
   * 스피어(창) 패턴 3
   * 
   * 위, 아래로 가시를 소환하고 그 가시는 여러번 화면 가운데를 공격
   */
  processAttackSpear3 () {
    if (!this.attackDelay.divCheck(150)) return

    const targetXLine = graphicSystem.CANVAS_HEIGHT / 4

    for (let i = 0; i < 4; i++) {
      // 멘 위와 맨 아래를 형태에 맞춰 동시 생성 및 기준 좌표 설정
      let targetX = (targetXLine * i) + (Math.random() * targetXLine)

      let bullet1 = new this.GasiShot()
      bullet1.setColorDirection(this.gasi.colorList.PINK, this.gasi.directionList.DOWN)
      bullet1.setPosition(targetX, 0 - (bullet1.height / 2))
      bullet1.setPatternType(this.gasi.patternList.SPEAR)
      fieldState.createEnemyBulletObject(bullet1, bullet1.x, bullet1.y)

      let bullet2 = new this.GasiShot()
      bullet2.setColorDirection(this.gasi.colorList.PINK, this.gasi.directionList.UP)
      bullet2.setPosition(targetX, graphicSystem.CANVAS_HEIGHT - (bullet2.height / 2))
      bullet2.setPatternType(this.gasi.patternList.SPEAR)
      fieldState.createEnemyBulletObject(bullet2, bullet2.x, bullet2.y)
    }

    soundSystem.play(soundSrc.enemyAttack.towerNokgasiGasiSpear)
    this.createGasiSound(soundSrc.enemyAttack.towerNokgasiGasiShot, 60)
    this.createGasiSound(soundSrc.enemyAttack.towerNokgasiGasiShot, 88)
    this.createGasiSound(soundSrc.enemyAttack.towerNokgasiGasiShot, 116)
    this.createGasiSound(soundSrc.enemyAttack.towerNokgasiGasiShot, 144)
  }

  /**
   * 스팅(찌르기) 패턴 4
   * 
   * 화면 오른쪽에 가시가 소환되고 잠시 후 화면 왼쪽으로 이동함
   */
  processAttackSting4 () {
    if (!this.attackDelay.divCheck(100)) return

    let targetY = Math.random() * (graphicSystem.CANVAS_HEIGHT - 100)
    for (let i = 0; i < 2; i++) {
      let bullet = new this.GasiShot()
      bullet.setColorDirection(this.gasi.colorList.TEAL, this.gasi.directionList.LEFT)
      bullet.setPosition(graphicSystem.CANVAS_WIDTH - 200, targetY + (i * 40))
      bullet.setPatternType(this.gasi.patternList.STING)
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(soundSrc.enemyAttack.towerNokgasiGasiShot)
    this.createGasiSound(soundSrc.enemyAttack.towerNokgasiGasiSting, 60)
  }

  /** 
   * 패턴 5 (이름 없음)
   * 
   * 위로 올라가는 가시와 아래로 내려가는 가시를 소환
   */
  processAttackPattern5 () {
    if (!this.attackDelay.divCheck(100)) return

    for (let i = 0; i < 4; i++) {
      let bullet = new this.GasiShot()
      let targetY = i % 2 === 0 ? 0 : graphicSystem.CANVAS_HEIGHT
      let speedY = i % 2 === 0 ? 4 : -4
      bullet.setColorDirection(this.gasi.colorList.YELLOW, this.gasi.directionList.LEFT)
      bullet.setPosition((200 * i), targetY)
      bullet.setMoveSpeed(0, speedY)
      bullet.setPatternType(this.gasi.patternList.PATTERN5)
      fieldState.createEnemyBulletObject(bullet, bullet.x, bullet.y)
    }

    soundSystem.play(soundSrc.enemyAttack.towerNokgasiGasiPattern5)
  }

  /**
   * 하이퍼 모드
   * 
   * 스스로 미친듯이 회전하면서 점점 이동속도가 빨라짐
   */
  processAttackHyper () {
    this.speedAcc += 0.02
    if (this.speedAcc > 24) {
      this.speedAcc = 24
    }
    this.degree += this.speedAcc * 4

    if (this.moveDelay.check()) {
      let speedX = this.moveSpeedX >= 0 ? 1 + this.speedAcc : -1 - this.speedAcc
      let speedY = this.moveSpeedY >= 0 ? 1 + this.speedAcc : -1 - this.speedAcc
      this.setMoveSpeed(speedX, speedY)
      soundSystem.play(soundSrc.enemyAttack.towerNokgasiGasiHyper)
    }
  }

  processMove () {
    super.processMove()
    if (this.moveSpeedY === 0 && this.moveDelay.check()) {
      this.setMoveSpeed(0, 0.2)
    }

    // 녹가시 1이 녹가시 2를 생성하는 구조상, 녹가시2는 화면 안에 무조건 생성되기 때문에
    // 이 코드는 중요하진 않지만 일단은 추가했습니다.
    if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
      this.x-- // 화면 안에 오도록 변경함

      // 화면 안에 들어온경우, 이제 보스는 화면 바깥으로 나갈 수 없음.
      if (this.x + this.width <= graphicSystem.CANVAS_WIDTH) {
        this.isPossibleExit = false
      }

      // x축이 화면 안으로 들어오는동안 y축도 보정됨
      if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
        this.y -= 10
      } else if (this.y < 0) {
        this.y += 10
      }
    }
  }

  processDieAfter () {
    super.processDieAfter()
    if (!this.isDied) return

    this.degree = 0 // 죽었을 때 각도는 0으로 고정됨
    if (this.dieAfterDeleteDelay.count % 6 === 0 && this.dieEffect != null) {
      soundSystem.play(this.dieSound)
      fieldState.createEffectObject(this.customEffect.getObject(), this.x + (Math.random() * (this.width - 40)), this.y + (Math.random() * (this.height - 40)))
    }

    if (this.dieAfterDeleteDelay.count == this.dieAfterDeleteDelay.delay - 1 && this.dieEffect != null) {
      soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossCommon)
      let effect = this.dieEffect.getObject()
      effect.setWidthHeight(this.width, this.height)
      fieldState.createEffectObject(effect, this.x, this.y)
    }
  }

  static GasiGasi = class extends CustomEnemyBullet {
    constructor () {
      super()
      this.collisionDelay = new DelayData(6)
      this.attack = 2
      this.direction = ''
      this.color = ''
      this.spearCount = 6

      this.endPosition = {
        x: 0,
        speedX: 0,
        y: 0,
        speedY: 0,
        delay: 0,
        delayCount: 0,
      }

      /** 다음 동작까지의 딜레이카운터 (패턴마다 이 변수의 사용방법이 다를 수 있음) */ this.delayCount = 120
      this.gasi = TowerEnemyGroup4Nokgasi2.gasi
    }
 
    processCollision () {
      if (this.attack === 0) return
      // 플레이어랑 닿았을 때 연속 충돌을 하기 위한 함수
  
      let player = fieldState.getPlayerObject()
      let playerSendXY = { x: player.x, y: player.y, width: player.width, height: player.height}
      
      if (this.collisionDelay.check(false) && collision(playerSendXY, this)) {
        player.addDamage(this.attack)
        this.collisionDelay.count = 0 // 충돌 지연 카운터 리셋
      }
    }

    processMove () {
      super.processMove()
      this.delayCount-- // 딜레이 카운트는 실시간으로 감소

      switch (this.subType) {
        case this.gasi.patternList.BOTTOM: this.processMoveBottom(); break
        case this.gasi.patternList.THROW: this.setMoveSpeed(this.moveSpeedX, this.moveSpeedY + 0.2); break
        case this.gasi.patternList.SPEAR: this.processMoveSpear(); break
        case this.gasi.patternList.STING: this.processMoveSting(); break
        case this.gasi.patternList.PATTERN5: break // 이 패턴은 추가적으로 해야할 작업이 없음
      }
    }

    processMoveBottom () {
      // 맨 밑에서 정해진 x좌표까지 강제로 이동됨
      if (this.endPosition.delayCount >= 1) {
        this.setMoveSpeed(this.endPosition.speedX, 0)
        this.endPosition.delayCount--
        return
      }
      
      // 그 다음, delayCount가 0이 될 때까지 대기
      if (this.delayCount >= 1) {
        this.setMoveSpeed(0, 0)
      } else {
        // delaycount가 0 이하가 되면은 위로 이동
        this.setMoveSpeed(0, -10)
      }
    }

    processMoveSpear () {
      // delayCount가 1 이상이면 대기
      if (this.delayCount >= 1) {
        this.setMoveSpeed(0, 0)
        return
      } else if (this.delayCount === 0) {
        // 이동 방향에 따라 속도 조정
        if (this.direction === this.gasi.directionList.UP) {
          this.setMoveSpeed(0, -40)
        } else {
          this.setMoveSpeed(0, 40)
        }
        return
      }

      // 창이 아래로 나왔다가 위로 왔다갔다를 반복합니다. (일정시간동안)
      if (this.direction === this.gasi.directionList.UP) {
        if (this.y + this.height <= graphicSystem.CANVAS_HEIGHT_HALF) {
          this.setMoveSpeed(0, 40)
          this.spearCount--
        } else if (this.y + this.height >= graphicSystem.CANVAS_HEIGHT + (this.height / 2)) {
          this.setMoveSpeed(0, -40)
        }
      } else if (this.direction === this.gasi.directionList.DOWN) {
        if (this.y >= graphicSystem.CANVAS_HEIGHT_HALF) {
          this.setMoveSpeed(0, -40)
          this.spearCount--
        } else if (this.y + this.height <= this.height / 2) {
          this.setMoveSpeed(0, 40)
        }
      }

      // 일정 횟수 이상 공격하거나 일정 시간이 지나면 자동 삭제
      if (this.elapsedFrame >= 300 || this.spearCount <= 0) {
        this.isDeleted = true
      }
    }

    processMoveSting () {
      if (this.delayCount > 0) return
      
      // 창을 왼쪽 끝까지 이동시킴 (왼쪽 끝을 넘어가면 강제로 위치 조정)
      if (this.x > 0) {
        this.setMoveSpeed(-40, 0)
      } else {
        this.x = 0
      }

      // 창 찌르기는 일정시간 후 자동 삭제
      if (this.delayCount <= -60) {
        this.isDeleted = true
      }
    }


    /**
     * 가시의 방향과 색을 설정합니다. (패턴과는 별개입니다.)
     * @param {string} color 
     * @param {string} direction 
     */
    setColorDirection (color = '', direction) {
      const directionList = TowerEnemyGroup4Nokgasi2.gasi.directionList
      const colorList = TowerEnemyGroup4Nokgasi2.gasi.colorList
      const imgDataList = imageDataInfo.towerEnemyGroup4
      const targetImageSrc = imageSrc.enemy.towerEnemyGroup4
      this.direction = direction

      if (direction === directionList.LEFT) {
        switch (color) {
          case colorList.BLUE: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiBlueLeft); break
          case colorList.GREEN: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiGreenLeft); break
          case colorList.PINK: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiPinkLeft); break
          case colorList.TEAL: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiTealLeft); break
          case colorList.YELLOW: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiYellowLeft); break
        }
      } else if (direction === directionList.UP) {
        switch (color) {
          case colorList.BLUE: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiBlueUp); break
          case colorList.GREEN: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiGreenUp); break
          case colorList.PINK: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiPinkUp); break
          case colorList.TEAL: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiTealUp); break
          case colorList.YELLOW: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiYellowUp); break
        }
      } else if (direction === directionList.DOWN) {
        switch (color) {
          case colorList.BLUE: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiBlueDown); break
          case colorList.GREEN: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiGreenDown); break
          case colorList.PINK: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiPinkDown); break
          case colorList.TEAL: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiTealDown); break
          case colorList.YELLOW: this.setAutoImageData(targetImageSrc, imgDataList.nokgasiGasiYellowDown); break
        }
      }
    }

    /**
     * 가시가 공격할 형태의 패턴을 결정함 (참고: 내부적으로는 subType으로 가시의 패턴을 판단합니다.)
     * 
     * 참고: setColorDirection을 사용하고 setPosition으로 좌표를 설정 후 이 함수를 사용해주세요.
     * 
     * @param {string} subType 
     */
    setPatternType (subType) {
      this.subType = subType
      const patternTypeList = this.gasi.patternList
      const bottomDivCount = 60

      switch (subType) {
        case patternTypeList.BOTTOM:
          // 가시가 현재 있는 위치를 기준으로 정해진 X축 좌표까지 이동함
          this.endPosition.x = Math.random() * graphicSystem.CANVAS_WIDTH
          this.endPosition.y = graphicSystem.CANVAS_HEIGHT - this.height
          this.endPosition.speedX = (this.endPosition.x - this.x) / bottomDivCount
          this.endPosition.delay = bottomDivCount
          this.endPosition.delayCount = bottomDivCount
          this.delayCount = bottomDivCount * 2
          break
        case patternTypeList.THROW:
          this.setMoveSpeed(Math.random() * -8 - 2, Math.random() * -4 - 8)
          break
        case patternTypeList.SPEAR:
          this.setWidthHeight(40, this.height)
          this.delayCount = 60
          break
        case patternTypeList.STING:
          this.endPosition.x = 0
          this.delayCount = 60
          this.setMoveSpeed(0, 0)
          this.setWidthHeight(graphicSystem.CANVAS_WIDTH, 40)
          break
        case patternTypeList.PATTERN5:
          // 아무것도 없음
          break
      }
    }
  }

  static gasi = {
    colorList: {
      TEAL: 'teal',
      GREEN: 'green',
      BLUE: 'blue',
      YELLOW: 'yellow',
      PINK: 'pink',
    },
    directionList: {
      LEFT: 'left',
      UP: 'up',
      DOWN: 'down'
    },
    patternList: {
      BOTTOM: 'bottom',
      THROW: 'throw',
      SPEAR: 'spear',
      STING: 'sting',
      PATTERN5: 'pattern5'
    }
  }
}

class TowerEnemyGroup4BlackSpaceAnti extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.anti, 2)
    this.setEnemyByCpStat(2400, 0)
    this.setMoveSpeed(0, 0)
    this.setDieEffectTemplet(soundSrc.round.r3_5_blackSpaceCatch)
    this.dieAfterDeleteDelay = new DelayData(60)
    this.isPossibleExit = false
  }

  display () {
    // 죽었을 때 투명하게 사라지도록 처리
    if (this.dieAfterDeleteDelay.count === 0) {
      super.display()
    } else if (this.dieAfterDeleteDelay.count <= this.dieAfterDeleteDelay.delay) {
      let alpha = (1 / this.dieAfterDeleteDelay.delay) * (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count)
      this.alpha = alpha
      super.display()
    }
  }
}

class TowerEnemyGroup4BlackSpaceRed extends TowerEnemyGroup4BlackSpaceAnti {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.blackSpaceBulletRed)
    this.setWidthHeight(this.width, this.height)
    this.setEnemyByCpStat(3000, 15)
    this.setMoveSpeed(0, 0)
  }
}

class TowerEnemyGroup4BlackSpaceGreen extends TowerEnemyGroup4BlackSpaceAnti {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.blackSpaceBulletGreenUp)
    this.setWidthHeight(this.width, this.height)
    this.setEnemyByCpStat(3000, 15)
    this.setMoveSpeed(0, 0)
  }

  processMove () {
    super.processMove()
    this.degree++
  }
}

class TowerEnemyGroup4BlackSpaceTornado extends TowerEnemyGroup4BlackSpaceAnti {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.blackSpaceTornado)
    this.setWidthHeight(this.width * 4, this.height * 4)
    this.setEnemyByCpStat(6000, 4)
    this.setMoveSpeed(0, 0)
    this.collisionDelay.delay = 10
  }

  afterInit () {
    this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
    this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
  }

  processPlayerCollisionSuccessAfter () {
    soundSystem.play(soundSrc.round.r3_5_blackSpaceTornado)
  }
}

class TowerEnemyGroup4BlackSpaceArea extends TowerEnemyGroup4BlackSpaceAnti {
  constructor () {
    super()
    this.setWidthHeight(400, 400)
    this.setEnemyByCpStat(4000, 0)
    this.setDieEffectTemplet()
    this.dieAfterDeleteDelay.delay = 300
    this.setDieEffectTemplet(soundSrc.round.r3_5_blackSpaceAreaDie, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedWhite)

    this.dieCommonEffect = new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedOrange, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, 2, 2)
  }

  afterInit () {
    this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
    this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
  }

  processDieAfter () {
    super.processDieAfter()
    
    if (this.isDied && this.dieAfterDeleteDelay.divCheck(6) && this.dieAfterDeleteDelay.count <= 287) {
      soundSystem.play(soundSrc.round.r3_5_blackSpaceAreaDie)
      if (this.dieEffect != null) {
        this.dieEffect.setWidthHeight(40, 40)
        fieldState.createEffectObject(this.dieEffect.getObject(), Math.random() * graphicSystem.CANVAS_WIDTH, Math.random() * graphicSystem.CANVAS_HEIGHT)
      }
    }

    if (this.isDeleted) {
      soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossCommon)
      let effect = this.dieCommonEffect.getObject()
      fieldState.createEffectObject(effect, 0, 0)
    }
  }

  // 출력 없음
  display () {}
}

class TowerEnemyGroup4AntijemulP3_1 extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.anti, 3)
    this.setWidthHeight(this.width * 2, this.height * 2)
    this.setEnemyByCpStat(20000, 0)
    this.setDieEffectTemplet(soundSrc.round.r3_5_blackSpaceCatch)
    this.isPossibleExit = false

    this.shieldInsideEnimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antishieldInside, 5, -1)
    this.shieldOutsideEnimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antishieldOutside, 6, -1)
    this.shieldInsideEnimation.setOutputSize(this.shieldInsideEnimation.frameWidth * 2, this.shieldInsideEnimation.frameHeight * 2)
    this.shieldOutsideEnimation.setOutputSize(this.shieldOutsideEnimation.frameWidth * 2, this.shieldOutsideEnimation.frameHeight * 2)
    this.shieldOutsideEnimation.alpha = 0.8

    /** 안티 보스의 쉴드(인사이드 부분)를 보여주는지에 대한 여부 */ this.isViewShieldInside = true
    /** 안티 보스의 쉴드(아웃사이드 부분)를 보여주는지에 대한 여부 */ this.isViewShieldOutside = true

    this.STATE_RINGNORMAL = 'ringnormal'
    this.STATE_RINGLINE = 'ringline'
    this.STATE_RINGBOOM = 'ringboom'
    this.STATE_RINGROLLING = 'ringrolling'
    this.STATE_GRAVITYBALL = 'gravityball'
    this.STATE_BACKSHOT = 'backshot'
    this.state = this.STATE_RINGNORMAL

    this.RING_DELAY = 180
    this.RING_PREDELAY = 30
    this.GRAVITYBALL_DELAY = 420
    this.GRAVITYBALL_PREDELAY = 60
    this.BACKSHOT_DELAY = 300
    this.RINGROLLING_DELAY = 360
    this.RINGROLLING_PREDELAY = 30
    this.attackDelay = new DelayData(300)
    this.moveDelay = new DelayData(120)
    this.stateDelay = new DelayData(300)

    /** 총합 패턴 번호 (지금까지 사용했던 패턴의 개수) */ this.patternCount = 0
    /** 패턴의 레벨 (0, 1, 2가 있음.) 숫자가 높을수록 적의 공격빈도와 개수가 상승 */ this.patternLevel = 0
    this.myStatic = TowerEnemyGroup4AntijemulP3_1

    this.saveList = {
      patternCount: this.patternCount
    }
  }

  saveProcess () {
    this.saveList.patternCount = this.patternCount
  }

  loadProcess () {
    this.patternCount = this.saveList.patternCount
  }

  processAttack () {
    if (this.attackDelay.check()) {
      this.changeAttack()
      this.patternCount++
    }

    // patternLevel check
    // hp 100% ~ 50% = pattern 1
    // hp 50% ~ 20% = pattern 2
    // hp 20% ~ 0% = pattern 3
    if (this.hp > this.hpMax * 0.5) {
      this.patternLevel = 0
    } else if (this.hp > this.hpMax * 0.2 && this.hp <= this.hpMax * 0.5) {
      this.patternLevel = 1
    } else if (this.hp <= this.hpMax * 0.2) {
      this.patternLevel = 2
    }

    // this.patternLevel = 2

    // this.processAttackDebug()

    switch (this.state) {
      case this.STATE_RINGNORMAL: this.processAttackRingNormal(); break
      case this.STATE_RINGBOOM: this.processAttackRingBomb(); break
      case this.STATE_RINGLINE: this.processAttackRingLine(); break
      case this.STATE_BACKSHOT: this.processAttackBackshot(); break
      case this.STATE_GRAVITYBALL: this.processAttackGravityBall(); break
      case this.STATE_RINGROLLING: this.processAttackRingRolling(); break
    }
  }

  processAttackDebug () {
    // this.processAttackGravityBall()
    // this.processAttackBackshot()
    // this.state = this.STATE_RINGROLLING
    // this.processAttackRingRolling()
    return
  }

  changeAttack () {
    let isRingPattern = (this.patternCount >= 0 && this.patternCount <= 4)
      || (this.patternCount >= 8 && this.patternCount <= 10)
      || (this.patternCount >= 11 && this.patternCount % 2 === 1)

    if (isRingPattern) {
      // 0 ~ 4번, 8 ~ 10번, 11번 이후 홀수간격
      let random = Math.floor(Math.random() * 3)
      switch (random) {
        case 0: this.state = this.STATE_RINGNORMAL; break
        case 1: this.state = this.STATE_RINGBOOM; break
        case 2: this.state = this.STATE_RINGLINE; break
      }
    } else if (this.patternCount >= 5 && this.patternCount <= 7) {
      // 5 ~ 7번 특수 패턴 (순서대로 진행)
      switch (this.patternCount) {
        case 5: this.state = this.STATE_GRAVITYBALL; break
        case 6: this.state = this.STATE_BACKSHOT; break
        case 7: this.state = this.STATE_RINGROLLING; break
      }
    } else if (this.patternCount >= 11 && this.patternCount % 2 === 0) {
      // 11번 이후 짝수간격 (랜덤)
      let random = Math.floor(Math.random() * 3)
      switch (random) {
        case 0: this.state = this.STATE_GRAVITYBALL; break
        case 1: this.state = this.STATE_BACKSHOT; break
        case 2: this.state = this.STATE_RINGROLLING; break
      }
    }
  }

  processAttackRingNormal () {
    if (this.attackDelay.count < this.RING_PREDELAY) return
    this.attackDelay.setDelay(this.RING_DELAY)

    const levelDelayTable = [40, 30, 25]
    const chaseShotCount = [0, 0, 0]
    const normalShotCount = [3, 3, 4]

    if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
      // 일반 총알
      for (let i = 0; i < normalShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3Ring()
        bullet.x = this.centerX - (bullet.width / 2)
        bullet.y = this.centerY - (bullet.height / 2)
        fieldState.createEnemyBulletObject(bullet)
      }

      // 유도 총알
      let player = fieldState.getPlayerObject()
      for (let i = 0; i < chaseShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3Ring()
        bullet.x = this.centerX - (bullet.width / 2)
        bullet.y = this.centerY - (bullet.height / 2)
         // 플레이어를 추적
        bullet.setMoveSpeedChaseLine(player.x, player.y, 120, 4)
        // 하지만 약간의 오차가 있음.
        bullet.setMoveSpeed(bullet.moveSpeedX + (Math.random() * 1) - 0.5, bullet.moveSpeedY + (Math.random() * 1) - 0.5)
        fieldState.createEnemyBulletObject(bullet)
      }

      soundSystem.play(soundSrc.enemyAttack.towerAntijemulRing)
    }
  }

  processAttackRingBomb () {
    if (this.attackDelay.count < this.RING_PREDELAY) return
    this.attackDelay.setDelay(this.RING_DELAY)
    
    const levelDelayTable = [30, 25, 20]
    const normalShotCount = [3, 4, 4]

    if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
      for (let i = 0; i < normalShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3RingBomb()
        bullet.x = this.centerX - (bullet.width / 2)
        bullet.y = this.centerY - (bullet.height / 2)
        fieldState.createEnemyBulletObject(bullet)
      }

      soundSystem.play(soundSrc.enemyAttack.towerAntijemulRingBomb)
    }
  }

  processAttackRingLine () {
    if (this.attackDelay.count < this.RING_PREDELAY) return
    this.attackDelay.setDelay(this.RING_DELAY)

    const levelDelayTable = [50, 40, 35]
    const normalShotCount = [6, 8, 8]
    const speedTable = [6, 8, 10]

    if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
      for (let i = 0; i < normalShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3Ring()
        // 왼쪽 그리고 오른쪽
        let speedX = i % 2 === 0 ? -speedTable[this.patternLevel] : speedTable[this.patternLevel]
        bullet.x = this.centerX - (bullet.width / 2)
        bullet.y = this.centerY - ((bullet.height / 2) * (-2 + Math.floor(i / 2)))
        bullet.setMoveSpeed(speedX, Math.random() * 2 - 1) // y축은 약간 어긋나있음
        fieldState.createEnemyBulletObject(bullet)
      }

      for (let i = 0; i < normalShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3Ring()
        // 위쪽 그리고 아래쪽
        let speedY = i % 2 === 0 ? -speedTable[this.patternLevel] : speedTable[this.patternLevel]
        bullet.x = this.centerX - (bullet.width / 2) * (-2 + Math.floor(i / 2))
        bullet.y = this.centerY - (bullet.height / 2)
        bullet.setMoveSpeed(Math.random() * 2 - 1, speedY) // y축은 약간 어긋나있음
        fieldState.createEnemyBulletObject(bullet)
      }

      soundSystem.play(soundSrc.enemyAttack.towerAntijemulRing)
    }
  }

  processAttackGravityBall () {
    if (this.attackDelay.count < this.GRAVITYBALL_PREDELAY) return
    this.attackDelay.setDelay(this.GRAVITYBALL_DELAY)

    const levelDelayTable = [20, 15, 12]
    const levelDelayMaxTable = [140, 165, 180]

    if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel]) 
      && this.attackDelay.count <= levelDelayMaxTable[this.patternLevel]) {
      let bullet = new this.myStatic.AntiPhase3GravityBall()
      bullet.x = this.centerX - (bullet.width / 2)
      bullet.y = this.centerY - (bullet.height / 2)
      fieldState.createEnemyBulletObject(bullet)
      soundSystem.play(soundSrc.enemyAttack.towerAntijemulGravityBall)
    }
  }

  processAttackBackshot () {
    this.attackDelay.setDelay(this.BACKSHOT_DELAY)
    const levelDelayTable = [11, 9, 7]
    const normalShotCount = [3, 3, 3]
    const BACK_FRAME = 60
    const SHOT_FRAME = 240
    const ROLLBACK_FRAME = 300

    if (this.attackDelay.count === 1) {
      this.isPossibleExit = true // 임시로 나갈 수 있게 허용
      this.isExitToReset = false
      // 적은 기본값이 왼쪽 방향이동이기에, 오른쪽으로 이동시키려면 방향을 변경해야함
      this.setMoveSpeed(0, 0)
      this.setMoveDirection(FieldData.direction.RIGHT)
    } else if (this.attackDelay.count >= 2 && this.attackDelay.count <= BACK_FRAME) {
      // 2초간 오른쪽으로 가속하고, 일정 범위를 벗어나면 위치 고정 (화면 바깥에 있음)
      this.setMoveSpeed(this.moveSpeedX + 0.42, 0)
      if (this.x > graphicSystem.CANVAS_WIDTH + 50) {
        this.x = graphicSystem.CANVAS_WIDTH + 45
      }
    } else if (this.attackDelay.count > BACK_FRAME && this.attackDelay.count <= SHOT_FRAME) {
      // 61프레임 ~ 240프레임동안 총알 발사
      this.setMoveSpeed(0, 0)
      this.x = graphicSystem.CANVAS_WIDTH + 45
      
      if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
        soundSystem.play(soundSrc.enemyAttack.towerAntijemulBackshot)
        for (let i = 0; i < normalShotCount[this.patternLevel]; i++) {
          let bullet = new this.myStatic.AntiPhase3BackShot()
          bullet.x = graphicSystem.CANVAS_WIDTH + 1
          bullet.y = Math.random() * graphicSystem.CANVAS_HEIGHT
          fieldState.createEnemyBulletObject(bullet)
        }
      }
    } else if (this.attackDelay.count >= SHOT_FRAME && this.attackDelay.count <= ROLLBACK_FRAME) {
      // 이후 다시 화면 오른쪽으로 이동
      let runningFrame = this.attackDelay.count - SHOT_FRAME
      const leftHalfFrame = (ROLLBACK_FRAME - SHOT_FRAME) / 2
      this.setMoveSpeed(runningFrame <= leftHalfFrame ? this.moveSpeedX - 0.7 : this.moveSpeedX + 0.7)
      if (this.attackDelay.count === this.attackDelay.delay - 5) {
        // 아까의 상태를 원래대로 복구
        this.setMoveDirection(FieldData.direction.LEFT)
        this.isPossibleExit = false
        this.isExitToReset = true
      }
    }
  }

  processAttackRingRolling () {
    if (this.attackDelay.count < this.RINGROLLING_PREDELAY) return
    this.attackDelay.setDelay(this.RINGROLLING_DELAY)
    const levelDelayTable = [60, 45, 30]
    const normalShotCount = [5, 5, 5]
    const ringSpeedTable = [360 / 60, 360 / 45, 360 / 30]

    if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
      soundSystem.play(soundSrc.enemyAttack.towerAntijemulRingRolling)
      for (let i = 0; i < normalShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3RingOrange()
        bullet.setRadius(i * 50, 270, ringSpeedTable[this.patternLevel])
        bullet.setBaseXY(this.centerX, this.centerY)
        fieldState.createEnemyBulletObject(bullet)
      }
    }
  }

  processMove () {
    super.processMove()
    if (this.state === this.STATE_BACKSHOT) return
    if (this.state === this.STATE_RINGROLLING) {
      let player = fieldState.getPlayerObject()
      // ringRolling 패턴은, 플레이어를 추적하면서 이동하며, 패턴 레벨이 상승하면 더욱 빠르게 이동합니다.
      const speedDivTable = [200, 170, 140]

      this.x += (player.x - this.x) / speedDivTable[this.patternLevel]
      this.y += (player.y - this.y) / speedDivTable[this.patternLevel]
      return
    }

    if (this.moveDelay.check()) {
      this.setRandomMoveSpeedMinMax(0.6, 0.6, 1.2, 1.2, true)
    }
  }

  /** 
   * 안티 제물 보스의 쉴드를 보여주는 여부를 설정합니다.
   * @param {boolean} inside 
   * @param {boolean} outside 
   */
  setShieldView (inside = true, outside = true) {
    this.isViewShieldInside = inside
    this.isViewShieldOutside = outside
  }

  processEnimation () {
    super.processEnimation()
    this.shieldInsideEnimation.process()
    this.shieldOutsideEnimation.process()
  }

  display () {
    // 이 보스는 현재 좌표를 기준으로, 쉴드와의 크기를 비교하여, 쉴드가 표시될 자리를 정합니다.
    // 쉴드의 자리는 크기의 상관없이 보스가 있는곳의 중앙이 되게끔 배치해야합니다.
    // 그래서, 각 원본 너비와 높이의 차이를 2로 나누고, 
    // 실제 적의 크기는 2배이므로 2로 나눈 값을 다시 2로 곱해줍니다.
    if (this.isViewShieldInside) this.displayShieldInside()
    if (this.isViewShieldOutside) this.displayShieldOutside()

    // 안티 보스는 페이즈 3-1의 경우 2종류의 쉴드가 표시되며,
    // 페이즈 3-2의 경우 1종류의 쉴드가 표시됩니다.
    // 쉴드 표시 종류를 나눠야 하기 때문에, 서로의 기능을 분리하였습니다.
    // 또한 이 클래스를 상속해 다음 페이즈의 보스를 만들 때
    // display의 기능을 재정의 하지 않도록 대신 shield를 보여주는지 선택하는 변수를 추가했습니다.
    super.display()

    // graphicSystem.fillText(this.state, 0, 80, 'blue')
  }

  displayShieldInside () {
    const imgDbase = imageDataInfo.towerEnemyGroup4.anti
    const imgDshield1 = imageDataInfo.towerEnemyGroup4.antishieldInside
    const imgMulSize = 2

    let shield1X = this.x - ((imgDshield1.width - imgDbase.width) / 2 * imgMulSize)
    let shield1Y = this.y - ((imgDshield1.height - imgDbase.height) / 2 * imgMulSize)

    this.shieldInsideEnimation.display(shield1X, shield1Y)
  }

  displayShieldOutside () {
    const imgDbase = imageDataInfo.towerEnemyGroup4.anti
    const imgDshield2 = imageDataInfo.towerEnemyGroup4.antishieldOutside
    const imgMulSize = 2
    let shield2X = this.x - ((imgDshield2.width - imgDbase.width) / 2 * imgMulSize)
    let shield2Y = this.y - ((imgDshield2.height - imgDbase.height) / 2 * imgMulSize)
    this.shieldOutsideEnimation.display(shield2X, shield2Y)
  }

  static AntiPhase3Ring = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antiRing, 5)
      this.setRandomMoveSpeedMinMax(2, 2, 6, 6, true)
      this.maxRunningFrame = 180
    }
  }

  static AntiPhase3RingBlue = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antiRingBlue, 2)
      this.setRandomMoveSpeedMinMax(1, 1, 5, 5, true)
      this.maxRunningFrame = 150
    }
  }

  static AntiPhase3RingOrange = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antiRingOrange, 4)
      this.maxRunningFrame = 120
      this.repeatCount = 10
      this.collisionDelay.delay = 20
      this.saveList = {
        baseRadius: 0,
        baseRadiusDegree: 0,
        baseX: 0,
        baseY: 0,
        degreeSpeed: 0,
      }
    }

    setBaseXY (baseX = 0, baseY = 0) {
      this.saveList.baseX = baseX
      this.saveList.baseY = baseY
    }

    /**
     * 회전 반경의 반지름 값 (참고: 한 바퀴를 돌면 이 개체는 사라집니다.)
     * 
     * 참고: 0도는 왼쪽입니다. 위에서 시작하려면, 270도를 입력해주세요.
     * @param {number} radius 반지름
     * @param {number} [degree=0] 각도
     * @param {number} [degreeSpeed=5] 각도 변경 속도
     */
    setRadius (radius = 1, degree = 0, degreeSpeed = 5) {
      this.saveList.baseRadius = radius
      this.saveList.baseRadiusDegree = degree
      this.saveList.degreeSpeed = 5
      this.maxRunningFrame = Math.floor(360 / degreeSpeed)
    }

    processMove () {
      this.saveList.baseRadiusDegree += (360 / this.maxRunningFrame)
      let radian = this.saveList.baseRadiusDegree * Math.PI / 180
      this.x = this.saveList.baseX + (this.saveList.baseRadius) * Math.cos(radian)
      this.y = this.saveList.baseY + (this.saveList.baseRadius) * Math.sin(radian)
    }
  }

  static AntiPhase3RingOrangeVer2 = class extends TowerEnemyGroup4AntijemulP3_1.AntiPhase3RingOrange {
    processMove () {
      this.maxRunningFrame = 300
      this.saveList.baseRadiusDegree += this.saveList.degreeSpeed
      let radian = this.saveList.baseRadiusDegree * Math.PI / 180
      this.x = this.saveList.baseX + (this.saveList.baseRadius) * Math.cos(radian)
      this.y = this.saveList.baseY + (this.saveList.baseRadius) * Math.sin(radian)
      this.saveList.baseX += this.moveSpeedX
      this.saveList.baseY += this.moveSpeedY
    }
  }

  static AntiPhase3BackShot = class extends CustomEnemyBullet {
    constructor () {
      super(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antiBackshot, 3)
      this.setRandomMoveSpeedMinMax(-9, -3, -6, 3)
      this.maxRunningFrame = 300
    }
  }

  static AntiPhase3RingBomb = class extends CustomEnemyBullet {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antiRingBombRing, 5)
      this.attack = 13
      this.setRandomMoveSpeed(3, 3, true)
      this.waveEnimation = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antiRingBombWave, 3, -1)
    }

    processEnimation () {
      super.processEnimation()
      this.waveEnimation.process()
    }

    processCollision () {
      super.processCollision()

      if (this.elapsedFrame >= 120) {
        this.isDeleted = true
      }

      // 만약 충돌 후의 상태또는 삭제 대기 상태라면 폭발하는 총알을 생성
      if (this.isDeleted) {
        let bullet = new TowerEnemyGroup4AntijemulP3_1.AntiPhase3RingBombEffect()
        fieldState.createEnemyBulletObject(bullet, this.x - 10, this.y - 10)
        soundSystem.play(soundSrc.enemyAttack.towerAntijemulRingBombEffect)
      }
    }

    processMove () {
      super.processMove()

      // 벽 튕기기
      if (this.x < 0) {
        this.x = 0
        this.moveSpeedX = Math.abs(this.moveSpeedX)
      } else if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
        this.x = graphicSystem.CANVAS_WIDTH - this.width
        this.moveSpeedX = -Math.abs(this.moveSpeedX)
      }
      
      if (this.y < 0) {
        this.y = 0
        this.moveSpeedY = Math.abs(this.moveSpeedY)
      } else if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT - this.height
        this.moveSpeedY = -Math.abs(this.moveSpeedY)
      }
    }

    display () {
      super.display()
      this.waveEnimation.display(this.x - 10, this.y - 10)
    }
  }

  static AntiPhase3RingBombEffect = class extends CustomEnemyBullet {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antiRingBombEffect, 3)
      this.attack = 2
      this.collisionDelay.delay = 6
      this.repeatCount = 60
      this.setMoveSpeed(0, 0)
    }

    processState () {
      super.processState()
      if (this.elapsedFrame >= 48) {
        this.isDeleted = true
      }

      // 투명도 시간에 따라서 변경
      if (this.elapsedFrame >= 24) {
        this.alpha = (48 - this.elapsedFrame) / 24
      }
    }

    display () {
      super.display()
    }
  }

  static AntiPhase3GravityBall = class extends CustomEnemyBullet {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antiGravityBall)
      this.fallPositionX = 0
      this.fallPositionY = 0
      this.startX = 0
      this.startY = 0
      this.shadowObject = {x: 0, y: 0, width: 0, height: 0, alpha: 0}
      this.setMoveSpeed(0, 0)
      this.maxRunningFrame = 900
      this.repeatCount = 44
      this.attack = 5
      this.collisionDelay.delay = 10

      this.stateDelay = new DelayData(600)
      this.STATE_UP = 'up'
      this.STATE_WAIT = 'wait'
      this.STATE_DOWN = 'down'
      this.STATE_ATTACK = 'attack'
      this.DELAY_UP = 120
      this.DELAY_WAIT = 30
      this.DELAY_DOWN = 180
      this.FALL_START_FRAME = 120
      this.DELAY_ATTACK = 60
      this.MAX_SIZE = 360
    }

    /**
     * 크기를 조정하고 중앙좌표로 다시 배치합니다.
     * @param {number} changeWidth 
     * @param {number} changeHeight 
     */
    changeWidthHeightCenter (changeWidth, changeHeight) {
      this.setWidthHeight(this.width + changeWidth, this.height + changeHeight)
      this.x -= (changeWidth / 2)
      this.y -= (changeHeight / 2)
    }

    saveProcess () {
      this.saveString = '' + this.fallPositionX + '|' + this.fallPositionY
      this.saveList.shadowObject = this.shadowObject
    }

    loadProcess () {
      let str = this.saveString.split('|')
      this.fallPositionX = Number(str[0])
      this.fallPositionY = Number(str[1])

      this.shadowObject = this.saveList.shadowObject
    }

    afterInit () {
      this.fallPositionX = Math.random() * (graphicSystem.CANVAS_WIDTH - this.width)
      this.fallPositionY = Math.random() * (graphicSystem.CANVAS_HEIGHT - this.height)
      this.startX = this.x
      this.startY = this.y
      this.setWidthHeight(2, 2)
      this.x = this.startX + 48
      this.y = this.startY + 48
      this.state = this.STATE_UP
    }

    processMove () {
      super.processMove()
      this.stateDelay.check()
      if (this.state === this.STATE_UP) {
        this.changeWidthHeightCenter(3, 3)
        this.alpha = (this.DELAY_UP - this.elapsedFrame) / this.DELAY_UP

        if (this.stateDelay.count >= this.DELAY_UP) {
          this.state = this.STATE_WAIT
          this.stateDelay.count = 0
          // baseSize = 100, 확장크기가 360임, 이걸 260만큼 낮춰서 내려오는 이미지를 구현해야 하므로
          // 중앙 배치를 위해 260 / 2만큼 x축, y축을 마이너스함.
          this.x = this.fallPositionX - (260 / 2)
          this.y = this.fallPositionY - (260 / 2)
          this.setWidthHeight(360, 360)

          // 그림자 오브젝트도 처리 (그림자가 중앙에 배치되게끔, 떨어지는 최종 위치의 좌표를 96 / 2 만큼 더합니다.)
          this.shadowObject.width = 2
          this.shadowObject.height = 2
          this.shadowObject.x = this.fallPositionX + 48
          this.shadowObject.y = this.fallPositionY + 48
        }
      } else if (this.state === this.STATE_WAIT) {
        // 대기상태
        if (this.stateDelay.count >= 30) {
          this.state = this.STATE_DOWN
          this.stateDelay.count = 0
        }
      } else if (this.state === this.STATE_DOWN) {
        // 행성이 떨어지는것이 보여진 후 프레임
        const fallTotalFrame = this.DELAY_DOWN - this.FALL_START_FRAME
        const runningFrame = this.stateDelay.count - this.FALL_START_FRAME
        const runningShadowFrame = this.stateDelay.count // 그림자 진행 프레임
        if (this.shadowObject.width < 100 && this.shadowObject.height < 100) {
          // 그림자가 일정 크기 미만이면 계속 확대합니다.
          this.shadowObject.x -= 0.3
          this.shadowObject.y -= 0.3
          this.shadowObject.width += 0.6
          this.shadowObject.height += 0.6
        }

        if (runningShadowFrame < this.DELAY_DOWN - 30) {
          this.shadowObject.alpha = 0.7 / this.DELAY_DOWN * runningShadowFrame
        } else {
          // 그라비티볼이 바닥에 닿을 때 쯤, 투명도로 그림자가 사라지게끔 변경
          this.shadowObject.alpha = 0.7 / 30 * (this.DELAY_DOWN - runningShadowFrame)
          if (this.shadowObject.alpha < 0) this.shadowObject.alpha = 0
        }

        if (this.stateDelay.count >= this.FALL_START_FRAME) {
          if (this.width > this.imageData.width && this.height > this.imageData.height) {
            // fallTimeFrame에 조금 더 높은 수치로 나누는것은, 조금 더 자연스럽게 바닥에 닿는걸 보여주기 위한것
            this.changeWidthHeightCenter(this.MAX_SIZE / (-fallTotalFrame - 10), this.MAX_SIZE / (-fallTotalFrame - 10))            
          }
        }
        this.alpha = 1 / (this.DELAY_DOWN - this.FALL_START_FRAME) * runningFrame
        if (this.stateDelay.count === this.FALL_START_FRAME) {
          soundSystem.play(soundSrc.enemyAttack.towerAntijemulGravityBallFall)
        }

        // 떨어지는게 완료된경우
        if (this.stateDelay.count >= this.DELAY_DOWN) {
          this.state = this.STATE_ATTACK
          this.x = this.fallPositionX
          this.y = this.fallPositionY
          this.setWidthHeight(this.imageData.width, this.imageData.height)
          soundSystem.play(soundSrc.enemyAttack.towerAntijemulGravityBallEffect)
          this.stateDelay.count = 0
          this.alpha = 1
          this.shadowObject.alpha = 0
        }
      } else if (this.state === this.STATE_ATTACK) {
        // 잠시동안 개체가 흔들림
        this.x = this.fallPositionX + Math.random() * 4
        this.y = this.fallPositionY + Math.random() * 4

        // 모든 패턴 완료
        if (this.stateDelay.count >= this.DELAY_ATTACK) {
          this.isDeleted = true
        }
      }
    }

    processCollision () {
      if (this.state === this.STATE_ATTACK) {
        // 공격 상태일때만 정상적으로 충돌 로직 적용 (그 이외는 무시)
        super.processCollision()
      }
    }

    display () {
      // 그라비티 볼 그림자
      // 떨어지는 상태에서 동그라미가 완전히 닿기 전에 그림자가 사라질 수 있도록 출력하는 구간이 조정되었음
      if (this.state === this.STATE_WAIT 
        || (this.state === this.STATE_DOWN && this.stateDelay.count <= this.DELAY_DOWN - 5)) {
        this.imageObjectDisplay(
          imageSrc.enemy.towerEnemyGroup4, 
          imageDataInfo.towerEnemyGroup4.antiGravityBallShadow,
          this.shadowObject.x,
          this.shadowObject.y,
          this.shadowObject.width,
          this.shadowObject.height,
          this.flip,
          this.degree,
          this.shadowObject.alpha
        )
      }

      // 그라비티 볼
      if (this.state === this.STATE_UP 
        || (this.state === this.STATE_DOWN && this.stateDelay.count >= this.FALL_START_FRAME) 
        || this.state === this.STATE_ATTACK) {
        super.display()
      }

      // 디버그 텍스트
      // graphicSystem.fillText(this.x + ', ' + this.y + ', ' + this.width + ', ' + this.height + ', A: ' + this.alpha, 20, 40, 'lime')
      // graphicSystem.fillText(Math.floor(this.shadowObject.x) + ', ' + Math.floor(this.shadowObject.y) + ', ' + this.shadowObject.width + ', ' + this.shadowObject.height + ', A: ' + this.shadowObject.alpha, 20, 60, 'blue')
      // graphicSystem.fillText(this.fallPositionX + ', ' + this.fallPositionY + ', 100, 100', 20, 80, 'red')

      // 떨어지는 영역 표시 (디버그)
      // graphicSystem.strokeRect(this.fallPositionX, this.fallPositionY, 100, 100, 'red')
    }
  }

  static AntiPhase3GravityRect = class extends CustomEnemyBullet {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.antiGravityRect)
      this.shadowObject = {x: 0, y: 0, width: 0, height: 0, alpha: 0}
      this.STATE_WAIT = 'wait'
      this.STATE_DOWN = 'down'
      this.STATE_ATTACK = 'attack'
      this.state = this.STATE_WAIT
      this.stateDelay = new DelayData(300)
      this.setWidthHeight(600, 600)
      this.collisionDelay.setDelay(12)
      this.attack = 8
      this.repeatCount = 25
      this.fallPositionX = 0
      this.fallPositionY = 0

      this.DELAY_DOWN = 240
      this.DELAY_WAIT = 60
      this.DELAY_ATTACK = 120
    }

    afterInit () {
      this.fallPositionX = Math.random() * (graphicSystem.CANVAS_WIDTH - this.width)
      this.fallPositionY = Math.random() * (graphicSystem.CANVAS_HEIGHT - this.height)
      this.setWidthHeight(600, 600)
      this.x = this.fallPositionX - 100
      this.y = this.fallPositionY - 100
      this.shadowObject.x = this.fallPositionX + 195
      this.shadowObject.y = this.fallPositionY + 195
      this.shadowObject.width = 10
      this.shadowObject.height = 10
    }

    processMove () {
      super.processMove()
      this.stateDelay.check()
      if (this.state === this.STATE_WAIT) {
        if (this.stateDelay.count >= this.DELAY_WAIT) {
          this.stateDelay.count = 0
          this.state = this.STATE_DOWN
        }
      } else if (this.state === this.STATE_DOWN) {
        if (this.width > 400 && this.height > 400) {
          this.changeWidthHeightCenter(-0.92, -0.92)
        }
        this.alpha = 1 / this.DELAY_DOWN * this.stateDelay.count
        this.shadowObject.alpha = 1 / this.DELAY_DOWN * this.stateDelay.count * 2
        
        if (this.shadowObject.width < 400 && this.shadowObject.height < 400) {
          this.shadowObject.x -= 0.96
          this.shadowObject.y -= 0.96
          this.shadowObject.width += 1.92
          this.shadowObject.height += 1.92
        }

        if (this.stateDelay.count === 1) {
          soundSystem.play(soundSrc.enemyAttack.towerAntijemulGravityRectFall)
        }

        if (this.stateDelay.count >= this.DELAY_DOWN) {
          this.stateDelay.count = 0
          this.state = this.STATE_ATTACK
          soundSystem.play(soundSrc.enemyAttack.towerAntijemulGravityRectEffect)
        }
        
      } else if (this.state === this.STATE_ATTACK) {
        this.x = this.fallPositionX + Math.random() * 16 - 8
        this.y = this.fallPositionY + Math.random() * 16 - 8
        this.setWidthHeight(400, 400)

        if (this.stateDelay.count >= this.DELAY_ATTACK) {
          this.isDeleted = true
        }
      }
    }

    /**
     * 크기를 조정하고 중앙좌표로 다시 배치합니다.
     * @param {number} changeWidth 
     * @param {number} changeHeight 
     */
    changeWidthHeightCenter (changeWidth, changeHeight) {
      this.setWidthHeight(this.width + changeWidth, this.height + changeHeight)
      this.x -= (changeWidth / 2)
      this.y -= (changeHeight / 2)
    }

    processCollision () {
      if (this.state === this.STATE_ATTACK) {
        super.processCollision()
      }
    }

    display () {
      if (this.state === this.STATE_WAIT 
        || (this.state === this.STATE_DOWN && this.stateDelay.count <= this.DELAY_DOWN - 5)) {
        this.imageObjectDisplay(
          imageSrc.enemy.towerEnemyGroup4, 
          imageDataInfo.towerEnemyGroup4.antiGravityRectShadow,
          this.shadowObject.x,
          this.shadowObject.y,
          this.shadowObject.width,
          this.shadowObject.height,
          this.flip,
          this.degree,
          this.shadowObject.alpha
        )
      }

      // 그라비티 볼
      // 참고: state가 STATE_DOWN이고 stateDelay가 0인상태에서는 일시적으로 큰 화면이 보여지기 때문에
      // 떨어지는 사각형의 출력 시점을 뒤로 늦췄음.
      if ((this.state === this.STATE_DOWN && this.stateDelay.count >= 5) 
        || this.state === this.STATE_ATTACK) {
        super.display()
      }

      // 디버그 텍스트
      // graphicSystem.fillText(this.x + ', ' + this.y + ', ' + this.width + ', ' + this.height + ', A: ' + this.alpha, 20, 40, 'lime')
      // graphicSystem.fillText(Math.floor(this.shadowObject.x) + ', ' + Math.floor(this.shadowObject.y) + ', ' + this.shadowObject.width + ', ' + this.shadowObject.height + ', A: ' + this.shadowObject.alpha, 20, 60, 'blue')
      // graphicSystem.fillText(this.fallPositionX + ', ' + this.fallPositionY + ', 100, 100', 20, 80, 'red')

      // 떨어지는 영역 표시 (디버그)
      // graphicSystem.strokeRect(this.fallPositionX, this.fallPositionY, 400, 400, 'red')
   
    }
  }

  static anotherAnti = class extends FieldData {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.anti, 3)
      this.attack = 0
      this.setMoveSpeed(0, 0)
    }
  }
}

class TowerEnemyGroup4AntijemulP3_2 extends TowerEnemyGroup4AntijemulP3_1 {
  constructor () {
    super()
    this.setEnemyByCpStat(20000, 0)
    this.BACKSHOT_DELAY = 600
    this.GRAVITYBALL_DELAY = 540
    this.RINGROLLING_DELAY = 300
    this.RING_DELAY = 240

    this.setShieldView(true, false) // 쉴드 1칸 벗겨짐
    this.STATE_ANTI_CREATE = 'anticreate'

    // 이 값이 다른 이유는, 상위 클래스에서 processMove에 ringrolling부분이 처리되어있어서, 그것을 무시하기 위한것
    this.STATE_RINGROLLING = 'ringrollingx2' 
    this.state = this.STATE_ANTI_CREATE
    
    // 또다른 안티 (분열?)
    this.anotherAnti = [new this.myStatic.anotherAnti(), new this.myStatic.anotherAnti(), new this.myStatic.anotherAnti()]

    /** 백샷 속도 결정값 (참고: 0 ~ 2번 안티 분열된거, 3번은 원본) */ this.backshotSpeedX = [0, 0, 0, 0, 0]
    /** 백샷 속도 결정값 (참고: 0 ~ 2번 안티 분열된거, 3번은 원본) */ this.backshotSpeedY = [0, 0, 0, 0, 0]
    
    /** 다른 안티 배열의 최대 길이 (즉 3마리 다른 안티가 생성될 수 있음.) */ this.ANOTHER_ANTI_MAX_LENGTH = 3
  }

  afterInit () {
    // 0번째: 왼쪽 위, 1번째: 왼쪽 아래, 2번째: 오른쪽 아래
    const speedXTable = [-3, -3, 3]
    const speedYTable = [-2, 2, 2]
    this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
    this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
    this.setMoveDirection()
    this.setMoveSpeed(3, -2) // 오른쪽 위

    for (let i = 0; i < this.anotherAnti.length; i++) {
      let current = this.anotherAnti[i]
      current.x = this.x
      current.y = this.y
      current.moveSpeedX = speedXTable[i]
      current.moveSpeedY = speedYTable[i]
      current.setWidthHeight(this.width, this.height) // 크기 재조정
    }
  }

  processAttack () {
    super.processAttack()
    // this.state = this.STATE_BACKSHOT
    // if (this.state === this.STATE_RINGLINE) {
    //   this.state = this.STATE_RINGNORMAL
    // }

    // if (this.state !== this.STATE_ANTI_CREATE) {
    //   super.processAttack()
    // }
  }

  processAttackRingNormal () {
    if (this.attackDelay.count < this.RING_PREDELAY) return
    this.attackDelay.setDelay(this.RING_DELAY)

    const levelDelayTable = [40, 35, 30]
    const normalShotCount = [3, 3, 4]

    if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
      // 일반 총알 (원본)
      for (let i = 0; i < normalShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3RingBlue()
        bullet.x = this.centerX - (bullet.width / 2)
        bullet.y = this.centerY - (bullet.height / 2)
        fieldState.createEnemyBulletObject(bullet)
      }

      // 일반 총알 (분열)
      for (let i = 0; i < this.anotherAnti.length; i++) {
        let current = this.anotherAnti[i]
        for (let j = 0; j < normalShotCount[this.patternLevel]; j++) {
          let bullet = new this.myStatic.AntiPhase3RingBlue()
          bullet.x = current.centerX - (bullet.width / 2)
          bullet.y = current.centerY - (bullet.height / 2)
          fieldState.createEnemyBulletObject(bullet)
        } 
      }

      soundSystem.play(soundSrc.enemyAttack.towerAntijemulRing)
    }
  }
  
  processAttackRingLine () {
    if (this.attackDelay.count < this.RING_PREDELAY) return
    this.attackDelay.setDelay(this.RING_DELAY)

    const levelDelayTable = [40, 35, 30]
    const chaseShotCount = [3, 4, 4]

    if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
      // 유도 총알
      let player = fieldState.getPlayerObject()
      for (let i = 0; i < chaseShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3RingBlue()
        bullet.x = this.centerX - (bullet.width / 2)
        bullet.y = this.centerY - (bullet.height / 2)
         // 플레이어를 추적
        bullet.setMoveSpeedChaseLine(player.x, player.y, 120, 4)
        // 하지만 약간의 오차가 있음.
        bullet.setMoveSpeed(bullet.moveSpeedX + (Math.random() * 1) - 0.5, bullet.moveSpeedY + (Math.random() * 1) - 0.5)
        fieldState.createEnemyBulletObject(bullet)
      }

      // 유도 총알 (뿐열)
      for (let i = 0; i < this.anotherAnti.length; i++) {
        let current = this.anotherAnti[i]
        for (let j = 0; j < chaseShotCount[this.patternLevel]; j++) {
          let bullet = new this.myStatic.AntiPhase3RingBlue()
          bullet.x = current.centerX - (bullet.width / 2)
          bullet.y = current.centerY - (bullet.height / 2)
           // 플레이어를 추적
          bullet.setMoveSpeedChaseLine(player.x, player.y, 120, 4)
          // 하지만 약간의 오차가 있음.
          bullet.setMoveSpeed(bullet.moveSpeedX + (Math.random() * 1) - 0.5, bullet.moveSpeedY + (Math.random() * 1) - 0.5)
          fieldState.createEnemyBulletObject(bullet)
        }
      }

      soundSystem.play(soundSrc.enemyAttack.towerAntijemulRing)
    }
  }

  processAttackRingBomb () {
    if (this.attackDelay.count < this.RING_PREDELAY) return
    this.attackDelay.setDelay(this.RING_DELAY)
    
    const levelDelayTable = [40, 35, 30]
    const normalShotCount = [1, 1, 1]

    if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
      for (let i = 0; i < normalShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3RingBomb()
        bullet.x = this.centerX - (bullet.width / 2)
        bullet.y = this.centerY - (bullet.height / 2)
        fieldState.createEnemyBulletObject(bullet)
      }

      for (let i = 0; i < this.anotherAnti.length; i++) {
        let current = this.anotherAnti[i]
        for (let j = 0; j < normalShotCount[this.patternLevel]; j++) {
          let bullet = new this.myStatic.AntiPhase3RingBomb()
          bullet.x = current.centerX - (bullet.width / 2)
          bullet.y = current.centerY - (bullet.height / 2)
          fieldState.createEnemyBulletObject(bullet)
        }
      }

      soundSystem.play(soundSrc.enemyAttack.towerAntijemulRingBomb)
    }
  }

  processAttackBackshot () {
    this.attackDelay.setDelay(this.BACKSHOT_DELAY)
    const levelDelayTable = [10, 8, 6]
    const BACK_FRAME = 60
    const SHOT_FRAME1 = 180
    const WAIT_FRAME = 240
    const SHOT_FRAME2 = 420
    const ROLLBACK_FRAME = 480

    if (this.attackDelay.count === 1) {
      this.isPossibleExit = true // 임시로 나갈 수 있게 허용
      this.isExitToReset = false
      // 적은 기본값이 왼쪽 방향이동이기에, 오른쪽으로 이동시키려면 방향을 변경해야함
      this.setMoveSpeed(0, 0)
    } else if (this.attackDelay.count >= 2 && this.attackDelay.count <= BACK_FRAME) {
      // 2초간 오른쪽으로 가속하고, 일정 범위를 벗어나면 위치 고정 (화면 바깥에 있음)
      this.setMoveSpeed(this.moveSpeedX + 0.42, 0)
      if (this.x > graphicSystem.CANVAS_WIDTH + 50) {
        this.x = graphicSystem.CANVAS_WIDTH + 45
      }

      for (let i = 0; i < this.anotherAnti.length; i++) {
        let current = this.anotherAnti[i]
        // 0 ~ 1: 왼쪽, 2: 오른쪽
        if (i === 0 || i === 1) current.setMoveSpeed(current.moveSpeedX - 0.42, 0)
        if (i === 2) current.setMoveSpeed(current.moveSpeedX + 0.42, 0)

        if (current.x > graphicSystem.CANVAS_WIDTH + 50) {
          current.x = graphicSystem.CANVAS_WIDTH + 45
        } else if (current.x + current.width < 0) {
          current.x = 0 - current.width
        }
      }
    } else if (this.attackDelay.count > BACK_FRAME && this.attackDelay.count <= SHOT_FRAME1) {
      // 총알 발사
      this.setMoveSpeed(0, 0)
      this.x = graphicSystem.CANVAS_WIDTH + 45
      for (let i = 0; i < this.anotherAnti.length; i++) {
        this.setMoveSpeed(0, 0)
        let current = this.anotherAnti[i]
        if (current.x > graphicSystem.CANVAS_WIDTH + 50) {
          current.x = graphicSystem.CANVAS_WIDTH + 45
        } else if (current.x + current.width < 0) {
          current.x = 0 - current.width
        }
      }

      if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
        let player = fieldState.getPlayerObject()
        let bullet = new this.myStatic.AntiPhase3BackShot()
        bullet.x = this.centerX
        bullet.y = this.centerY
        bullet.setMoveSpeedChaseLine(player.x, player.y, 90, 5)
        fieldState.createEnemyBulletObject(bullet)

        for (let i = 0; i < this.anotherAnti.length; i++) {
          let current = this.anotherAnti[i]
          let bullet = new this.myStatic.AntiPhase3BackShot()
          bullet.x = current.centerX
          bullet.y = current.centerY
          bullet.setMoveSpeedChaseLine(player.x, player.y, 90, 5)
          fieldState.createEnemyBulletObject(bullet)
        }
        soundSystem.play(soundSrc.enemyAttack.towerAntijemulBackshot)
      }
    } else if (this.attackDelay.count > SHOT_FRAME1 && this.attackDelay.count <= WAIT_FRAME) {
      // 대기 시간 및 백샷 위치 변경
      for (let i = 0; i < this.backshotSpeedX.length; i++) {
        if (i === 0 || i === 1) {
          // 0 ~ 1:은 왼쪽에서 발사됨
          this.backshotSpeedX[i] = 7
        } else {
          this.backshotSpeedX[i] = -7
        }

        this.backshotSpeedY[i] = Math.random() * 4 - 2
      }

      for (let i = 0; i < this.anotherAnti.length; i++) {
        this.anotherAnti[i].setMoveSpeed(0, 0)
      }
    } else if (this.attackDelay.count > WAIT_FRAME && this.attackDelay.count <= SHOT_FRAME2) {
      // 또다른 방식의 공격
      
      if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
        let bullet = new this.myStatic.AntiPhase3BackShot()
        bullet.x = this.centerX
        bullet.y = this.centerY
        // 원본은 3번 위치(오른쪽 위)에 있습니다.
        bullet.setMoveSpeed(this.backshotSpeedX[3], this.backshotSpeedY[3])
        fieldState.createEnemyBulletObject(bullet)

        for (let i = 0; i < this.anotherAnti.length; i++) {
          let current = this.anotherAnti[i]
          let bullet = new this.myStatic.AntiPhase3BackShot()
          bullet.x = current.centerX
          bullet.y = current.centerY
          bullet.setMoveSpeed(this.backshotSpeedX[i], this.backshotSpeedY[i])
          fieldState.createEnemyBulletObject(bullet)
        }
        soundSystem.play(soundSrc.enemyAttack.towerAntijemulBackshot)
      }
    } else if (this.attackDelay.count >= SHOT_FRAME2 && this.attackDelay.count <= ROLLBACK_FRAME) {
      // 이후 다시 화면 오른쪽으로 이동
      let runningFrame = this.attackDelay.count - SHOT_FRAME2
      const leftHalfFrame = (ROLLBACK_FRAME - SHOT_FRAME2) / 2
      this.setMoveSpeed(runningFrame <= leftHalfFrame ? this.moveSpeedX - 0.7 : this.moveSpeedX + 0.7)

      for (let i = 0; i < this.anotherAnti.length; i++) {
        let current = this.anotherAnti[i]
        if (i === 0 || i === 1) {
          // 오른쪽 이동
          current.setMoveSpeed(runningFrame <= leftHalfFrame ? current.moveSpeedX + 0.7 : current.moveSpeedX - 0.7)
        } else {
          // 왼쪽 이동
          current.setMoveSpeed(runningFrame <= leftHalfFrame ? current.moveSpeedX - 0.7 : current.moveSpeedX + 0.7)
        }
      }

      if (this.attackDelay.count === this.attackDelay.delay - 5) {
        // 아까의 상태를 원래대로 복구
        this.isPossibleExit = false
        this.isExitToReset = true
      }
    }
  }

  processAttackGravityBall () {
    this.attackDelay.setDelay(this.GRAVITYBALL_DELAY)
    if (this.attackDelay.count === 1) {
      let bullet = new this.myStatic.AntiPhase3GravityRect()
      fieldState.createEnemyBulletObject(bullet)
      soundSystem.play(soundSrc.enemyAttack.towerAntijemulGravityBall)
    }
  }

  processAttackRingRolling () {
    if (this.attackDelay.count < this.RINGROLLING_PREDELAY) return
    this.attackDelay.setDelay(this.RINGROLLING_DELAY)
    const levelDelayTable = [90, 75, 60]
    const normalShotCount = [4, 4, 4]
    const ringSpeedTable = [360 / 270, 360 / 240, 360 / 210]

    if (this.attackDelay.divCheck(levelDelayTable[this.patternLevel])) {
      soundSystem.play(soundSrc.enemyAttack.towerAntijemulRingRolling)
      for (let i = 0; i < normalShotCount[this.patternLevel]; i++) {
        let bullet = new this.myStatic.AntiPhase3RingOrange()
        bullet.setRadius(100, 270 + (90 * i), ringSpeedTable[this.patternLevel])
        bullet.setBaseXY(this.centerX, this.centerY)
        fieldState.createEnemyBulletObject(bullet)
      }

      for (let i = 0; i < this.anotherAnti.length; i++) {
        let current = this.anotherAnti[i]
        for (let j = 0; j < normalShotCount[this.patternLevel]; j++) {
          let bullet = new this.myStatic.AntiPhase3RingOrange()
          bullet.setRadius(100, 270 + (90 * j), ringSpeedTable[this.patternLevel])
          bullet.setBaseXY(current.centerX, current.centerY)
          fieldState.createEnemyBulletObject(bullet)
        }
      }
    }
  }

  processMove () {
    this.processMoveAdjust()
    if (this.state === this.STATE_ANTI_CREATE) {
      this.stateDelay.setDelay(60)
      if (this.stateDelay.check()) {
        this.state = this.STATE_RINGNORMAL
      }
      // 다른 안티 프로세스 처리
      for (let i = 0; i < this.anotherAnti.length; i++) {
        this.anotherAnti[i].process()
      }
      super.processMove()
      return
    }

    super.processMove()

    // 참고: 위에서 check()함수를 사용했기 때문에, 여기서는 다른 방식을 사용해 구분해야합니다.
    // check()함수는 카운트를 증가시키므로, 여기서도 check()를 사용하면 중복카운트 문제가 발생합니다.
    // 백샷 관련 문제때문에, 백샷 상태에서는 이동 로직을 동작시키지 않음.
    if (this.moveDelay.count === 0 && this.state !== this.STATE_BACKSHOT) {
      this.setRandomMoveSpeedMinMax(0.6, 0.6, 1.2, 1.2, true) // 원본
      for (let i = 0; i < this.anotherAnti.length; i++) {
        this.anotherAnti[i].setRandomMoveSpeedMinMax(0.6, 0.6, 1.2, 1.2, true) // 분열
      }
    }

    // 다른 안티 프로세스 처리
    for (let i = 0; i < this.anotherAnti.length; i++) {
      this.anotherAnti[i].process()
    }
  }

  /** 위치 보정 */
  processMoveAdjust () {
    // 백샷하는동안에는 좌표를 해당 패턴 내에서 강제 지정해야하므로, 좌표를 조정하지 않음.
    // 다른 anti가 생성되는 동안에도 마찬가지
    if (this.state === this.STATE_BACKSHOT || this.state === this.STATE_ANTI_CREATE) return 

    // 위치 보정 (오른쪽 위)
    if (this.x < graphicSystem.CANVAS_WIDTH_HALF) this.x = graphicSystem.CANVAS_WIDTH_HALF
    if (this.y < 0) this.y = 0
    if (this.x + this.width > graphicSystem.CANVAS_WIDTH) this.x = graphicSystem.CANVAS_WIDTH - this.width
    if (this.y + this.height > graphicSystem.CANVAS_HEIGHT_HALF) this.y = graphicSystem.CANVAS_HEIGHT_HALF - this.height

    for (let i = 0; i < this.anotherAnti.length; i++) {
      let current = this.anotherAnti[i]

      // 위치 보정 (특정 영역을 벗어날 수 없음)
      if (i === 0) { // 왼쪽 위
        if (current.x < 0) current.x = 0
        if (current.y < 0) current.y = 0
        if (current.x + current.width > graphicSystem.CANVAS_WIDTH_HALF) current.x = graphicSystem.CANVAS_WIDTH_HALF - current.width
        if (current.y + current.height > graphicSystem.CANVAS_HEIGHT_HALF) current.y = graphicSystem.CANVAS_HEIGHT_HALF - current.height
      } else if (i === 1) { // 왼쪽 아래
        if (current.x < 0) current.x = 0
        if (current.y < graphicSystem.CANVAS_HEIGHT_HALF) current.y = graphicSystem.CANVAS_HEIGHT_HALF
        if (current.x + current.width > graphicSystem.CANVAS_WIDTH_HALF) current.x = graphicSystem.CANVAS_WIDTH_HALF - current.width
        if (current.y + current.height > graphicSystem.CANVAS_HEIGHT) current.y = graphicSystem.CANVAS_HEIGHT - current.height
      } else if (i === 2) { // 오른쪽 아래
        if (current.x < graphicSystem.CANVAS_WIDTH_HALF) current.x = graphicSystem.CANVAS_WIDTH_HALF
        if (current.y < graphicSystem.CANVAS_HEIGHT_HALF) current.y = graphicSystem.CANVAS_HEIGHT_HALF
        if (current.x + current.width > graphicSystem.CANVAS_WIDTH) current.x = graphicSystem.CANVAS_WIDTH - current.width
        if (current.y + current.height > graphicSystem.CANVAS_HEIGHT) current.y = graphicSystem.CANVAS_HEIGHT - current.height
      }
    }
  }

  /** 또다른 안티 오브젝트를 생성합니다. 참고: 이것은 적 내부에서 처리하는 객체이지만 적으로 취급되지 않습니다. */
  createAnotherAntiObject () {
    return { x: this.x, y: this.y, width: this.width, height: this.height, 
      moveSpeedX: 0, moveSpeedY: 0, moveDelayCount: 60, preDelay: 60}
  }

  display () {
    super.display()
    if (!this.isDied) {
      for (let i = 0; i < this.anotherAnti.length; i++) {
        this.anotherAnti[i].display()
      }
    }
  }
}

class TowerEnemyGroup4AntijemulP4_1 extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup4, imageDataInfo.towerEnemyGroup4.anti, 3)
    this.setWidthHeight(this.width * 2, this.height * 2)
    this.setEnemyByCpStat(4000, 0)
    this.setMoveSpeed(0, 0)
    this.setDieEffectTemplet(soundSrc.round.r3_5_blackSpaceCatch)
    this.attackDelay = new DelayData(15)

    /** 다음에 나올 적의 id */
    this.nextEnemyId = ID.enemy.towerEnemyGroup4.antijemulP4_2
  }

  processAttack () {
    if (this.attackDelay.check()) {
      this.processAttackBullet()
    }
  }

  processAttackBullet () {
    const bulletSpeed = 3
    const randomSpeedRange = 2
    let xSpeed = 0
    let ySpeed = 0

    for (let i = 0; i < 4; i++) {
      let bullet
      switch (Math.floor(Math.random() * 3)) {
        case 0: bullet = TowerEnemy.bulletRed.getCreateObject(); break
        case 1: bullet = TowerEnemy.bulletBlue.getCreateObject(); break
        default: bullet = TowerEnemy.bulletYellow.getCreateObject(); break
      }

      // 0, 1: X축 양쪽 끝, 왼쪽, 오른쪽
      // 2, 3: Y축 양쪽 끝, 위, 아래
      if (i === 0 || i === 1) {
        bullet.x = i === 0 ? 0 : graphicSystem.CANVAS_WIDTH
        bullet.y = Math.random() * (graphicSystem.CANVAS_HEIGHT - bullet.height)
        xSpeed = i === 0 ? bulletSpeed : -bulletSpeed
        if (bullet.y < graphicSystem.CANVAS_HEIGHT_HALF) {
          bullet.setRandomMoveSpeedMinMax(xSpeed, randomSpeedRange, xSpeed, randomSpeedRange + 2)
        } else {
          bullet.setRandomMoveSpeedMinMax(xSpeed, -randomSpeedRange - 2, xSpeed, randomSpeedRange)
        }
      } else if (i === 2 || i === 3) {
        bullet.x = Math.random() * (graphicSystem.CANVAS_WIDTH - bullet.width)
        bullet.y = i === 2 ? 0 : graphicSystem.CANVAS_HEIGHT
        ySpeed = i === 2 ? bulletSpeed : -bulletSpeed
        if (bullet.y < graphicSystem.CANVAS_HEIGHT_HALF) {
          bullet.setRandomMoveSpeedMinMax(randomSpeedRange, ySpeed, randomSpeedRange + 2, ySpeed)
        } else {
          bullet.setRandomMoveSpeedMinMax(-randomSpeedRange - 2, ySpeed, randomSpeedRange, ySpeed)
        }      
      }

      bullet.attack = 2 // 총알이 너무 많기 때문에 공격력이 낮음
      bullet.setWidthHeight(10, 10) // 총알의 크기도 작아짐
      fieldState.createEnemyBulletObject(bullet)
    }
  }

  processDieAfterLogic () {
    super.processDieAfterLogic()
    if (this.nextEnemyId !== 0) {
      fieldState.createEnemyObject(this.nextEnemyId, this.x, this.y)
    }
  }
}

class TowerEnemyGroup4AntijemulP4_2 extends TowerEnemyGroup4AntijemulP4_1 {
  constructor () {
    super()
    this.setEnemyByCpStat(3000, 0)
    this.attackDelay.setDelay(60)
    this.bulletYLineTable = [-100, 0, 100, 200, 300, 400, 500, 600]
    this.bulletYLine = 0
    this.bulletYLineSpeed = 0
    this.nextEnemyId = ID.enemy.towerEnemyGroup4.antijemulP4_3
  }

  processAttack () {
    if (this.attackDelay.check()) {
      if (this.bulletYLineSpeed === 0) {
        this.bulletYLineSpeed = Math.random() < 0.5 ? 2 : -2
      } else {
        this.bulletYLineSpeed = 0
      }
    }

    this.bulletYLine += this.bulletYLineSpeed
    if (this.bulletYLine < 0) this.bulletYLine = 100
    else if (this.bulletYLine > 200) this.bulletYLine = 100

    if (this.attackDelay.divCheck(6)) {
      for (let i = 0; i < this.bulletYLineTable.length; i++) {
        let bullet = new TowerEnemyGroup4AntijemulP3_1.AntiPhase3BackShot()
        bullet.x = graphicSystem.CANVAS_WIDTH + 60
        bullet.y = this.bulletYLineTable[i] + this.bulletYLine
        bullet.setWidthHeight(20, 8)
        bullet.setMoveSpeed(-12, 0)
        fieldState.createEnemyBulletObject(bullet)
      }
    }
  }
}

class TowerEnemyGroup4AntijemulP4_3 extends TowerEnemyGroup4AntijemulP4_1 {
  constructor () {
    super()
    this.setEnemyByCpStat(3000, 0)
    this.attackDelay.setDelay(10)
    this.nextEnemyId = 0 // 다음 적은 없음
  }

  processMove () {
    super.processMove()

    let player = fieldState.getPlayerObject()
    this.setMoveSpeedChaseLine(player.x, player.y, 100, 4)
  }

  processAttack () {
    if (this.attackDelay.check()) {
      soundSystem.play(soundSrc.enemyAttack.towerAntijemulRingRolling)
      for (let i = 0; i < 6; i++) {
        let bullet = new TowerEnemyGroup4AntijemulP3_1.AntiPhase3RingOrange()
        bullet.setRadius(i * 40, 270, 20)
        bullet.setBaseXY(this.centerX, this.centerY)
        fieldState.createEnemyBulletObject(bullet)
      }
    }
  }
}

class TowerEnemyGroup5Camera extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.camera)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerCamera, imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.enemyDieCamera, 60)
    this.setEnemyByCpStat(20, 13)
    this.moveDelay = new DelayData(480)
    this.moveDelay.setCountMax()
    this.setMoveDirection()

    this.DIV_DELAY = 240 // 목표지점까지 이동하는데 4초
    this.saveList = {
      /** 도착할 목표지점 X */ finishX: 0,
      /** 도착할 목표지점 Y */ finishY: 0,
      /** 목표지점까지의 이동속도X */ finishXSpeed: 0,
      /** 목표지점까지의 이동속도Y */ finishYSpeed: 0,
    }
  }

  processMove () {
    // 공격주기의 절반을 넘어갈때만 이동합니다. (공격 직후 이동하면 안됨)
    if (this.moveDelay.count < this.DIV_DELAY) {
      this.setMoveSpeed(this.saveList.finishXSpeed, this.saveList.finishYSpeed)
      super.processMove()
    } else if (this.moveDelay.count === this.DIV_DELAY) {
      // enemyBullet
      let bullet = new TowerEnemyGroup5Camera.CameraBullet()
      bullet.setPosition(this.x + Math.random() * 300 - 150, this.y + Math.random() * 200 - 100)
      fieldState.createEnemyBulletObject(bullet)
      soundSystem.play(soundSrc.enemyAttack.towerCameraAttackWait)
    }

    if (this.moveDelay.check()) {
      this.saveList.finishX = this.width + Math.random() * (graphicSystem.CANVAS_WIDTH - this.width * 2)
      this.saveList.finishY = this.height + Math.random() * (graphicSystem.CANVAS_HEIGHT - this.height * 2)
      this.saveList.finishXSpeed = (this.saveList.finishX - this.x) / this.DIV_DELAY
      this.saveList.finishYSpeed = (this.saveList.finishY - this.y) / this.DIV_DELAY
    }
  }

  static CameraBullet = class extends EnemyBulletData {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.cameraAttackArea)
      this.attackDelay = new DelayData(120)
      this.maxRunningFrame = 180
      this.collisionDelay.setDelay(10)
      this.attack = 4
      this.setMoveSpeed(0, 0)
      this.state = 'normal'
      this.STATE_NORMAL = 'normal'
      this.STATE_ATTACK = 'attack'
      this.repeatCount = 15
    }

    processState () {
      if (this.state === this.STATE_NORMAL) {
        this.alpha = 1 // 보여지지 않음
      } else if (this.state === this.STATE_ATTACK) {
        if (this.attackDelay.count <= 10) {
          this.alpha = 1 / 10 * this.attackDelay.count
        } else if (this.attackDelay.count <= 50) {
          this.alpha = 1
        } else if (this.attackDelay.count <= 60) {
          this.alpha = 1 / 10 * (60 - this.attackDelay.count)
        }
        console.log(this.alpha)
      }
    }

    processCollision () {
      if (this.state === this.STATE_ATTACK) {
        super.processCollision()
      }
    }

    processAttack () {
      if (this.attackDelay.check()) {
        this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.cameraAttackAreaShot)
        soundSystem.play(soundSrc.enemyAttack.towerCameraAttackShot)
        this.state = this.STATE_ATTACK
      }
    }
  }
}

class TowerEnemyGroup5Cctv extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.cctv)
    this.setEnemyByCpStat(18, 8)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerCctv, imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.enemyDieCctv, 60)
    this.isPossibleExit = false
    this.setRandomMoveSpeed(2, 0)
    this.attackDelay = new DelayData(120)
  }

  afterInit () {
    this.y = 0 // 위로 보내버리기 (그리고 내려오지 않음)
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = TowerEnemy.bulletYellow.getCreateObject()
      bullet.setMoveSpeed(Math.random() * 4 - 2, 6)
      bullet.setPosition(this.x, this.y + 30)
      fieldState.createEnemyBulletObject(bullet)
    }
  }
}

class TowerEnemyGroup5Radio extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.radioSend, 4)
    this.setEnemyByCpStat(50, 10)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerRadio, imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.enemyDieRadio, 60)
    this.setMoveSpeed(1, 0)
    this.isPossibleExit = false
    this.attackDelay = new DelayData(240)
    this.STATE_NORMAL = 'normal'
    this.STATE_SEND = 'send'
    this.state = 'normal'
  }

  processEnimation () {
    // 전송 중일때만 에니메이션 재생
    if (this.state === this.STATE_SEND) {
      super.processEnimation()
    } else {
      if (this.enimation != null) {
        // 그게 아니라면, 에니메이션을 정지하고, 0프레임으로 되돌림
        this.enimation.reset()
      }
    }
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = new TowerEnemyGroup5Radio.NoiseBullet()
      bullet.x = this.x
      bullet.y = this.centerY
      // target 찾기 (같은 종류의 적이 있는지를 확인, 자기 자신은 제외됩니다.)
      let list = fieldState.getEnemyObjectById(this.id)
      if (list.length <= 1) {
        // 같은 종류의 다른 적이 없다면, 임의의 4방향중 하나에 총알 발사
        let random = Math.floor(Math.random() * 4)
        switch (random) {
          case 0: bullet.setMoveSpeed(0, -10); break
          case 1: bullet.setMoveSpeed(0, 10); break
          case 2: bullet.setMoveSpeed(10, 0); break
          default: bullet.setMoveSpeed(-10, 0);  break
        }

        this.setMoveSpeed(1, 0) // 무전기 다시 이동 (자기 자신만 있는경우)
        this.state = this.STATE_NORMAL
      } else {
        // 자기 자신 제외, 자기 자신이 대상이 된 경우, 그 다음 배열 번호를 지정
        // 배열 번호가 잘못된 인덱스를 가리키지 않도록, 배열의 길이만큼 나머지 계산
        let targetNumber = Math.floor(Math.random() * list.length)
        let target = this.createId === list[targetNumber].createId ? list[(targetNumber + 1) % list.length] : list[targetNumber]
        bullet.setMoveSpeedChaseLine(target.centerX, target.centerY, 120, 3)

        this.setMoveSpeed(0, 0) // 무전기 이동 정지 (다른 무전기가 있는 경우)
        this.state = this.STATE_SEND
      }

      soundSystem.play(soundSrc.enemyAttack.towerRadioAttack)
      fieldState.createEnemyBulletObject(bullet)
    }
  }

  static NoiseBullet = class extends EnemyBulletData {
    constructor () {
      super()
      this.maxRunningFrame = 480
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.radioAttack, 2)
      this.attack = 3
      this.repeatCount = 6
      this.collisionDelay.setDelay(12)
      this.isCollision = false
    }

    processState () {
      if (this.elapsedFrame <= 60 || this.isCollision) return

      let list = fieldState.getEnemyObjectById(ID.enemy.towerEnemyGroup5.radio)
      if (list.length === 0) return

      for (let i = 0; i < list.length; i++) {
        if (collision(this, list[i])) {
          this.setMoveSpeed(this.moveSpeedX * -1, this.moveSpeedY * -1) // 반대방향으로 변경
          this.isCollision = true // 이후 다시 방향이 변경되지 않음
          break
        }
      }
    }
  }
}

class TowerEnemyGroup5SirenRed extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.sirenRed, 3)
    this.setEnemyByCpStat(22, 10)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerSiren)
    this.setRandomMoveSpeed(3.4, 0)
    this.dieAfterDeleteDelay = new DelayData(60)
    this.isPossibleExit = false
    this.attackDelay = new DelayData(30)
    this.STATE_DETECT = 'detect'
    this.STATE_NORMAL = ''
    this.state = this.STATE_NORMAL
    this.gravity = 0
    /** 사이렌 사운드 */ this.sirenSound = soundSrc.enemyAttack.towerSirenRedMove

    this.dieImageObject = imageDataInfo.towerEnemyGroup5.enemyDieSirenRed
  }

  processEnimation () {
    if (this.state === this.STATE_NORMAL) {
      if (this.enimation != null) {
        this.enimation.reset()
      }
    } else if (this.state === this.STATE_DETECT) {
      super.processEnimation()
    }
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let prevDetect = this.state === this.STATE_DETECT ? true : false
      this.state = this.detectCheck() ? this.STATE_DETECT : this.STATE_NORMAL
      if (prevDetect && this.state === this.STATE_NORMAL) {
        this.setRandomMoveSpeed(3.4, 0)
      }
    }

    if (this.state === this.STATE_DETECT && this.attackDelay.divCheck(30)) {
      soundSystem.play(this.sirenSound)
    }
  }

  detectCheck () {
    let player = fieldState.getPlayerObject()
    let detectArea = {x: this.x - 200, y: this.y - 200, width: 400, height: 400}
    if (collision(player, detectArea)) {
      return true
    } else {
      return false
    }
  }

  processMove () {
    super.processMove()
    if (this.state === this.STATE_NORMAL) {
      this.processMoveNormal()
    } else if (this.state === this.STATE_DETECT) {
      this.processMoveDetect()
    }
  }

  processMoveNormal () {
    
  }

  processMoveDetect () {
    let player = fieldState.getPlayerObject()
    this.setMoveSpeedChaseLine(player.x, player.y, 240, 2)
  }

  processDieAfter () {
    super.processDieAfter()
    if (!this.isDied) return

    this.y += this.gravity
    if (this.y + this.height < graphicSystem.CANVAS_HEIGHT) {
      this.gravity += 1
    } else {
      if (this.gravity >= 4) {
        this.gravity /= 2
        this.gravity *= -1
        this.y = graphicSystem.CANVAS_HEIGHT - this.height - 2
      } else {
        this.gravity = 0
        this.y = graphicSystem.CANVAS_HEIGHT - this.height
      }
    }
  }

  display () {
    if (this.isDied) {
      this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup5, this.dieImageObject, this.x, this.y)
    } else {
      super.display()
    }
  }
}

class TowerEnemyGroup5SirenGreen extends TowerEnemyGroup5SirenRed {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.sirenGreen, 3)
    this.setEnemyByCpStat(23, 10)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerSiren)
    this.sirenSound = soundSrc.enemyAttack.towerSirenGreenMove
    this.dieImageObject = imageDataInfo.towerEnemyGroup5.enemyDieSirenGreen
  }

  detectCheck () {
    let area1 = {x: 0, y: this.y, width: 1200, height: this.height}
    let area2 = {x: this.x, y: 0, width: this.width, height: 1200}
    let player = fieldState.getPlayerObject()
    if (collision(area1, player) || collision(area2, player)) {
      return true
    } else {
      return false
    }
  }
}

class TowerEnemyGroup5SirenBlue extends TowerEnemyGroup5SirenRed {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.sirenBlue, 3)
    this.setEnemyByCpStat(24, 10)
    this.attackDelay.setDelay(240)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerSiren)
    this.sirenSound = soundSrc.enemyAttack.towerSirenBlueMove
    this.dieImageObject = imageDataInfo.towerEnemyGroup5.enemyDieSirenBlue
  }

  detectCheck () {
    if (Math.random() < 0.5) {
      return true
    } else {
      return false
    }
  }
}

class TowerEnemyGroup5Blub extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.bulb, 6)
    this.setEnemyByCpStat(10, 7)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerBlub, imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.enemyDieBulb)
    this.setRandomMoveSpeed(2, 2, true)
  }
}

class TowerEnemyGroup5Hellnet extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.hellnet, 3)
    this.setEnemyByCpStat(40, 11)
    this.dieColor = this.dieColorList.violet
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHellnet)
    this.attackDelay.setDelay(180)
  }

  processAttack () {
    if (this.attackDelay.check()) {
      const targetSpeedX = this.flip === 0 ? Math.random() * 2 + 1 : Math.random() * -2 - 1
      const targetSpeedY = Math.random() * -2 - 1
      let bullet = new TowerEnemyGroup5Radio.NoiseBullet()
      bullet.x = this.centerX
      bullet.y = this.centerY
      bullet.setMoveSpeed(targetSpeedX, targetSpeedY)

      fieldState.createEnemyBulletObject(bullet)
      soundSystem.play(soundSrc.enemyAttack.towerRadioAttack)
    }
  }

  processChangeAngle () {
    // y축의 속도에 따라 각도 조절 (단 일정 각도를 벗어나지 못함) - hellgi랑 같음
    if (this.moveSpeedY <= 0.5 && this.moveSpeedY >= -0.5) {
      this.degree = 0
    } else if (this.moveSpeedY >= 0.5) {
      this.degree = (this.moveSpeedY - 0.5) * -6
      if (this.degree > 30 && this.degree < 180) this.degree = 30
    } else if (this.moveSpeedY <= -0.5) {
      this.degree = (this.moveSpeedY + 0.5) * -6
      if (this.degree > 180 && this.degree < 330) this.degree = 330
    }

    // 이동 속도에 따라서, 좌우 반전 결정 (왼쪽이 마이너스입니다. 그래서 왼쪽방향일때만 반전 적용)
    if (this.moveSpeedX < 0) this.flip = 1
    else this.flip = 0
  }
}

class TowerEnemyGroup5Helltell extends TowerEnemyHellTemplet {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.helltell, 2)
    this.setEnemyByCpStat(16, 12)
    this.dieColor = this.dieColorList.blue
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerHelltell)
    this.attackDelay.setDelay(150)
    this.targetSpeed.xBase = 2
    this.targetSpeed.yBase = 2
    this.targetSpeed.xChange = 0.05
    this.targetSpeed.yChange = 0.05
  }

  processAttack () {
    if (this.attackDelay.check()) {
      let bullet = new TowerEnemyGroup5Helltell.tellBullet()
      bullet.setPosition(this.centerX, this.y)
      bullet.setMoveSpeed(this.moveSpeedX * 3, this.moveSpeedY * 3)
      bullet.degree = this.degree
      fieldState.createEnemyBulletObject(bullet)
    }
  }

  static tellBullet = class extends EnemyBulletData {
    constructor () {
      super()
      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.helltellAttack)
      this.repeatCount = 10
      this.attack = 4
      this.collisionDelay.setDelay(8)
      this.moveDelay = new DelayData(4)
      this.maxRunningFrame = 180
    }

    processMove () {
      super.processMove()
      if (this.moveDelay.check()) {
        this.setWidthHeight(this.width + 1, this.height + 3)
      }
    }
  }
}

class TowerEnemyGroup5Gabudan extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.gabudanComputer)
    this.setEnemyByCpStat(14000, 0)
    this.setDieEffectTemplet('', imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedOrange)
    this.dieAfterDeleteDelay = new DelayData(240)
    this.attackDelay = new DelayData(20)

    this.STATE_BLACK = 'black'
    this.STATE_BOOTING1 = 'booting1'
    this.STATE_BOOTING2 = 'booting2'
    this.STATE_BOOTING3 = 'booting3'
    this.STATE_BOOTING4 = 'booting4'
    this.STATE_OSLOADING = 'osloading'
    this.STATE_BACKGROUND1 = 'background1'
    this.STATE_BACKGROUND2 = 'background2'
    this.STATE_BACKGROUND3 = 'background3'
    this.STATE_PROGRAM = 'program'
    this.STATE_PROGRAM_RUN1 = 'programrun1'
    this.STATE_PROGRAM_RUN2 = 'programrun2'
    this.STATE_ERROR1 = 'panic1'
    this.STATE_ERROR2 = 'panic2'
    this.STATE_KERNEL_PANIC = 'kernelpanic'
    /** 이것은, 보스가 제한된 시간보다 빨리 죽었을 때만 적용된다. */ this.STATE_KERNEL_DEAD = 'kerneldead'
    this.state = this.STATE_BLACK

    // 이 메세지들은, 보스의 패턴 시작과 끝을 알립니다. (라운드에서 보스 배경음을 재생해야 하므로...)
    this.MESSAGE_START = 'start'
    this.MESSAGE_END = 'end'

    /** 배경 이미지 경로 */ this.bgSrc = imageSrc.enemy.towerEnemyGroup5Gabudan
    /** 배경 이미지 데이터의 객체 리스트 */ this.bgData = imageDataInfo.towerEnemyGroup5Gabudan
  }

  processAttack () {
    if (this.state === this.STATE_PROGRAM_RUN1 && this.attackDelay.check()) {
      // 원형 탄막 생성
      const baseSpeed = 3
      for (let i = 0; i < 16; i++) {
        let bullet = TowerEnemy.bulletRed.getCreateObject()
        bullet.setPosition(graphicSystem.CANVAS_WIDTH_HALF, graphicSystem.CANVAS_HEIGHT_HALF)
        
        let degree = (i * 360 / 16) + (this.elapsedFrame % (360 / 16))
        let radian = Math.PI / 180 * degree
        let speedX = Math.cos(radian) * baseSpeed
        let speedY = Math.sin(radian) * baseSpeed
        bullet.setMoveSpeed(speedX, speedY)
        fieldState.createEnemyBulletObject(bullet)
      }
    } else if (this.state === this.STATE_PROGRAM_RUN2 && this.attackDelay.check()) {
      // 확산 탄막 생성 (위, 아래 방향)
      const baseSpeed = 3
      for (let i = 0; i < 8; i++) {
        let bullet = TowerEnemy.bulletBlue.getCreateObject()
        bullet.setPosition(graphicSystem.CANVAS_WIDTH_HALF, graphicSystem.CANVAS_HEIGHT_HALF)

        let speedX = -1 + (i % 4)
        let speedY = Math.floor(i / 4) === 0 ? -baseSpeed : baseSpeed
        bullet.setMoveSpeed(speedX, speedY)
        fieldState.createEnemyBulletObject(bullet)
      }

      // 왼쪽, 오른쪽 방향
      for (let i = 0; i < 14; i++) {
        let bullet = TowerEnemy.bulletBlue.getCreateObject()
        bullet.setPosition(graphicSystem.CANVAS_WIDTH_HALF, graphicSystem.CANVAS_HEIGHT_HALF)

        let speedX = Math.floor(i / 7) === 0 ? -baseSpeed : baseSpeed
        let speedY = -3 + (i % 7)
        bullet.setMoveSpeed(speedX, speedY)
        fieldState.createEnemyBulletObject(bullet)
      }
    }
  }

  processState () {
    // 생성된지 60초가 지날경우, 빠른 클리어를 위해 hp를 강제 감소시킴 (초당 10% 감소)
    if (this.elapsedFrame >= 60 * 60 && this.hp > 0) {
      this.hp -= Math.floor(this.hpMax / 600)
    }

    // 만약, 커널 패닉이 아니거나, 커널 데드가 아닌 상황에서
    // 죽은 상태 (hp가 0이하)가 된 경우, 커널 데드 화면이 표시되고 상태 변경은 되지 않습니다.
    if (this.state !== this.STATE_KERNEL_DEAD && this.state !== this.STATE_KERNEL_PANIC) {
      if (this.isDied) {
        this.state = this.STATE_KERNEL_DEAD
        this.message = this.MESSAGE_END
      }
    }

    // 커널이 죽은 상황에서 더이상 상태변경은 없음
    if (this.state === this.STATE_KERNEL_DEAD) return
    this.processStateChange()
  }

  processStateChange () {
    const FPS = 60

    // 보스 배경음을 재생시키기 위한 메세지 설정
    if (this.elapsedFrame === FPS * 20) this.message = this.MESSAGE_START
    else if (this.elapsedFrame === FPS * 44) this.message = this.MESSAGE_END

    // 사운드 재생
    if (this.elapsedFrame === FPS * 1) soundSystem.play(soundSrc.enemyAttack.towerGabudanBooting)
    else if (this.elapsedFrame === FPS * 11) soundSystem.play(soundSrc.enemyAttack.towerGabudanStartup)
    else if (this.elapsedFrame === FPS * 44) soundSystem.play(soundSrc.enemyAttack.towerGabudanKernelPanic)

    // 화면을 표시하기 위한 상태 변경
    switch (this.elapsedFrame) {
      case FPS * 1: this.state = this.STATE_BOOTING1; break
      case FPS * 4: this.state = this.STATE_BOOTING2; break
      case FPS * 5: this.state = this.STATE_BOOTING3; break // ㅂ팅 스크린
      case FPS * 6: this.state = this.STATE_OSLOADING; break // os loading 화면
      case FPS * 10: this.state = this.STATE_BACKGROUND1; break // 배경만 표시
      case FPS * 12: this.state = this.STATE_BACKGROUND2; break // 배경 + 아이콘 표시
      case FPS * 14: this.state = this.STATE_BACKGROUND3; break // 배경 + 아이콘 + 프로그램 표시
      case FPS * 18: this.state = this.STATE_PROGRAM; break // 프로그램 표시
      case FPS * 20: this.state = this.STATE_PROGRAM_RUN1; break // 총알 패턴 1
      case FPS * 32: this.state = this.STATE_PROGRAM_RUN2; break // 총알 패턴 2
      case FPS * 44: this.state = this.STATE_ERROR1; break
      case FPS * 46: this.state = this.STATE_ERROR2; break
      case FPS * 48: this.state = this.STATE_KERNEL_PANIC; break
    }
  }

  /**
   * 지정된 화면을 보여줌 (가부단은 모니터에 화면을 표시해야하는데, 어떤것을 표시하는지에 대한 값임)
   * 
   * 경고: 무조건 gabudan 전용 데이터를 사용해야 합니다.
   * @param {ImageDataObject} imageData 
   */
  displayTargetWindow (imageData, alpha = 1) {
    this.imageObjectDisplay(this.bgSrc, imageData, this.x + 5, this.y + 5, undefined, undefined, undefined, undefined, alpha)
  }

  display () {
    super.display()

    // display background
    switch (this.state) {
      case this.STATE_BOOTING1: this.displayTargetWindow(this.bgData.biosCheck1); break
      case this.STATE_BOOTING2: this.displayTargetWindow(this.bgData.biosCheck2); break
      case this.STATE_BOOTING3: this.displayTargetWindow(this.bgData.biosCheck3); break
      case this.STATE_BOOTING4: this.displayTargetWindow(this.bgData.biosCheck4); break
      case this.STATE_OSLOADING: this.displayOsLoading(); break
      case this.STATE_BACKGROUND1: this.displayTargetWindow(this.bgData.background); break
      case this.STATE_BACKGROUND2:
        this.displayTargetWindow(this.bgData.background)
        this.displayTargetWindow(this.bgData.backgroundIcon)
        break
      case this.STATE_BACKGROUND3:
        this.displayTargetWindow(this.bgData.background)
        this.displayTargetWindow(this.bgData.backgroundIcon)
        this.displayTargetWindow(this.bgData.programLoading)
        break
      case this.STATE_PROGRAM: // PROGRAM ~ PROGRAM_RUN까지 같은 화면을 공유함
      case this.STATE_PROGRAM_RUN1:
      case this.STATE_PROGRAM_RUN2:
        this.dipslayProgram()
        break
      case this.STATE_ERROR1: this.displayTargetWindow(this.bgData.programError1); break
      case this.STATE_ERROR2: this.displayTargetWindow(this.bgData.programError2); break
      case this.STATE_KERNEL_PANIC: this.displayTargetWindow(this.bgData.kernelPanicOutofMemory); break
      case this.STATE_KERNEL_DEAD: this.displayTargetWindow(this.bgData.kernelPanicDeviceBroken); break
    }
  }

  displayOsLoading () {
    let currentFrame = Math.floor(this.elapsedFrame / 8) % 4
    switch (currentFrame) {
      case 0: this.displayTargetWindow(this.bgData.osLoading1); break
      case 1: this.displayTargetWindow(this.bgData.osLoading2); break
      case 2: this.displayTargetWindow(this.bgData.osLoading3); break
      case 3: this.displayTargetWindow(this.bgData.osLoading4); break
    }
  }

  dipslayProgram () {
    const FIRST = 90
    const SECOND = 180
    const THRID = 270
    let frame = this.elapsedFrame % THRID
    let alphaTable = [1, 0, 0]

    // 0 ~ 90까지 알파값 상승, 91 ~ 180까지 알파값 감소
    if (frame <= FIRST) alphaTable[1] = 1 / FIRST * frame
    else if (frame > FIRST && frame <= SECOND) alphaTable[1] = 1 / FIRST * (SECOND - frame)

    // 90 ~ 180까지 알파값 상승, 181 ~ 270까지 알파값 감소
    if (frame > FIRST && frame <= SECOND) alphaTable[2] = 1 / FIRST * (frame - FIRST)
    else if (frame > SECOND && frame <= THRID) alphaTable[2] = 1 / FIRST * (THRID - frame)

    this.displayTargetWindow(this.bgData.programBackground1, alphaTable[0])
    this.displayTargetWindow(this.bgData.programBackground2, alphaTable[1])
    this.displayTargetWindow(this.bgData.programBackground3, alphaTable[2])
    this.displayTargetWindow(this.bgData.programRunning)
  }

  processDieAfter () {
    super.processDieAfter()

    if (this.isDied && this.dieAfterDeleteDelay.divCheck(20)) {
      if (this.dieEffect != null) {
        let effect = this.dieEffect.getObject()
        effect.setPosition(this.x, this.y)
        fieldState.createEffectObject(effect)
      }

      soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossCommon)
    }
  }
}

class TowerEnemyTrashTemplete extends TowerEnemy {
  /** 이 템플릿을 사용하는 메인타입은 towerTrash로 지정됩니다. */
  static MAINTYPE_TOWERTRASH = 'towerTrash'

  /** 이 템플릿에서 사용하는 모든 객체들은, 수집기(sujipgi) 적한테 흡수당할 수 있습니다.
   * 흡수 대상이 되면 내부 상태값이 이 값으로 변경됩니다. (참고로 쓰레기 내부의 상태는 쓰레기 스스로 결정하지 않습니다.) */
  static STATE_TRASH_RUNNING_INHALER = 'trashRunningInhaler'

  constructor () {
    super()
    this.subTypeList = TowerEnemyTrashTemplete.subTypeList
    this.imageSrc = imageSrc.enemy.towerEnemyGroup5

    this.mainType = TowerEnemyTrashTemplete.MAINTYPE_TOWERTRASH
    this.degreeSpeed = 4
    this.setRandomMoveSpeed(6, 6, true)
    this.state = '' // 기본 상태값 없음 (sujipgi와의 연계 때문에 이 상태값은 명시적으로 ''(공백) 값이 부여됩니다.)
  }

  static subTypeList = {
    trashGroup1: 'trash1',
    trashGroup2: 'trash2',
    trashWing: 'trashWing',
    trashLotter: 'trashLotter',    
  }

  /**
   * 쓰레기 타입 설정 (subTypeList 참고)
   * 
   * 참고: 여기서, 스탯, 이미지, 죽음이펙트가 설정되므로, 다른곳에서 (스탯, 이밎, 죽음이펙트)변경하지 마세요.
   * @param {string} subType 
   */
  setTrashType (subType) {
    this.subType = subType
    if (subType === this.subTypeList.trashGroup1) {
      let random = Math.floor(Math.random() * 3)
      let targetImageDataList = [
        imageDataInfo.towerEnemyGroup5.trash1,
        imageDataInfo.towerEnemyGroup5.trash2,
        imageDataInfo.towerEnemyGroup5.trash3,
      ]
      let targetDieImageDataList = [
        imageDataInfo.towerEnemyGroup5.enemyDieTrash1,
        imageDataInfo.towerEnemyGroup5.enemyDieTrash2,
        imageDataInfo.towerEnemyGroup5.enemyDieTrash3,
      ]
      this.setAutoImageData(this.imageSrc, targetImageDataList[random])
      this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerTrash1, this.imageSrc, targetDieImageDataList[random])
      this.setEnemyByCpStat(4, 4)
      this.degreeSpeed = Math.floor(Math.random() * 4) + 1
    } else if (subType === this.subTypeList.trashGroup2) {
      this.setAutoImageData(this.imageSrc, imageDataInfo.towerEnemyGroup5.trash4)
      this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerTrash2, this.imageSrc, imageDataInfo.towerEnemyGroup5.enemyDieTrash4)
      this.setEnemyByCpStat(12, 4)
      this.degreeSpeed = 1
    } else if (subType === this.subTypeList.trashWing) {
      let random = Math.floor(Math.random() * 4)
      let targetImageDataList = [
        imageDataInfo.towerEnemyGroup5.trashWing1,
        imageDataInfo.towerEnemyGroup5.trashWing2,
        imageDataInfo.towerEnemyGroup5.trashWing3,
        imageDataInfo.towerEnemyGroup5.trashWing4,
      ]
      this.setAutoImageData(this.imageSrc, targetImageDataList[random])
      this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerTrashWing, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedOrange)
      this.setEnemyByCpStat(5, 4)
      this.degreeSpeed = 12
    } else if (subType === this.subTypeList.trashLotter) {
      let random = Math.floor(Math.random() * 4)
      let targetImageDataList = [
        imageDataInfo.towerEnemyGroup5.trashLotor1,
        imageDataInfo.towerEnemyGroup5.trashLotor2,
        imageDataInfo.towerEnemyGroup5.trashLotor3,
        imageDataInfo.towerEnemyGroup5.trashLotor4,
      ]
      this.setAutoImageData(this.imageSrc, targetImageDataList[random])
      this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerTrashLotter, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleRedWhite)
      this.setEnemyByCpStat(6, 4)
      this.degreeSpeed = 0

      let changeDegree = Math.floor(Math.random() * 30)
      this.degree = Math.random() < 0.5 ? changeDegree : changeDegree
    } else {
      // 만약 아무 타입도 해당 사항이 없다면, 강제로 임의 타입 지정 후 해당 함수 다시 호출
      // 이 함수는 무한루프되지 않음
      this.setTrashType(this.subTypeList.trashGroup1)
    }
  }

  processMove () {
    super.processMove()
    this.degree += this.degreeSpeed
  }
}

class TowerEnemyGroup5Trash1 extends TowerEnemyTrashTemplete {
  constructor () { super(); this.setTrashType(this.subTypeList.trashGroup1) }
}
class TowerEnemyGroup5Trash2 extends TowerEnemyTrashTemplete {
  constructor () { super(); this.setTrashType(this.subTypeList.trashGroup2) }
}
class TowerEnemyGroup5TrashWing extends TowerEnemyTrashTemplete {
  constructor () { super(); this.setTrashType(this.subTypeList.trashWing) }
}
class TowerEnemyGroup5TrashLotter extends TowerEnemyTrashTemplete {
  constructor () { super(); this.setTrashType(this.subTypeList.trashLotter) }
}

class TowerEnemyGroup5Sujipgi extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.sujipgi, 4)
    this.setEnemyByCpStat(22, 11)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerSujipgi, imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.enemyDieSujipgi, 45)
    this.setMoveDirection()

    this.STATE_STARTUP = 'startup'
    this.STATE_NODETECT = 'nodetect'
    this.STATE_RUNNING = 'running'
    this.STATE_WAIT = 'wait'
    this.state = this.STATE_STARTUP
    this.DIV_VALUE = 180
    this.TRASH_DIV_VALUE = 96
    this.TRASH_STATE_TEXT = 'trashTextEnableMode'
    this.TRASH_MAIN_TYPE = TowerEnemyTrashTemplete.MAINTYPE_TOWERTRASH

    this.enimationRunning = EnimationData.createEnimation(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.sujipgiRunning, 2, -1)

    this.stateDelay = new DelayData(180)
    this.moveDelay = new DelayData(180)
    this.attackDelay = new DelayData(120)

    this.saveList = {
      finishX: 0,
      finishY: 0
    }
  }

  processEnimation () {
    super.processEnimation()
    this.enimationRunning.process()
  }

  afterInit () {
    this.setRadnomFinishPosition()
  }

  setRadnomFinishPosition () {
    this.saveList.finishX = Math.floor(Math.random() * graphicSystem.CANVAS_WIDTH)
    this.saveList.finishY = Math.floor(Math.random() * graphicSystem.CANVAS_HEIGHT)
    this.setMoveSpeedChaseLine(this.saveList.finishX, this.saveList.finishY, this.DIV_VALUE, 0)
  }

  processState () {
    if (!this.stateDelay.check()) return
    
    if (this.state === this.STATE_STARTUP) {
      this.processStateChangeStartUp()
    } else if (this.state === this.STATE_NODETECT) {
      this.setRadnomFinishPosition() // 다른 곳으로 이동
      this.state = this.STATE_STARTUP
    } else if (this.state === this.STATE_RUNNING) {
      this.state = this.STATE_WAIT
      this.stateDelay.count = this.stateDelay.delay - 120
    } else if (this.state === this.STATE_WAIT) {
      // 쓰레기를 찾은 상태에서는 다른곳으로 이동하지 않습니다.
      this.state = this.STATE_STARTUP 
      this.stateDelay.count = this.stateDelay.delay - 5 // 대기상태가 끝난 이후, 곧바로 스타트업상태를 완료시킴
    }
  }

  processStateChangeStartUp () {
    // startup 상태에서 다른 상태로 변경할 때 주위에 쓰레기(적)가 있는지 살펴봅니다.
    // 만약 해당 쓰레기(적)가 있다면, 다음 상태는 running이고
    // 아니라면, 다음 상태는 nodetect입니다.
    let detectArea = {x: this.x - 250, y: this.y - 250, width: 500, height: 500}
    let enemyList = fieldState.getEnemyObject()
    let isTargeted = false
    for (let i = 0; i < enemyList.length; i++) {
      let enemy = enemyList[i]

      // 해당값이 아닐경우, 충돌계산을 하지 않음
      if (enemy.mainType !== this.TRASH_MAIN_TYPE) continue
      if (enemy.state === this.TRASH_STATE_TEXT) continue

      // 충돌이 된 경우에는 적 상태와 속도를 변경함
      if (collision(enemy, detectArea)) {
        enemy.state = this.TRASH_STATE_TEXT
        enemy.setMoveSpeedChaseLine(this.x, this.y, this.TRASH_DIV_VALUE, 0) // 해당 적은 수집기 쪽으로 이동함
        isTargeted = true
        break // 루프 종료
      }
    }

    // 쓰레기를 detect했는지에 따라 상태 변경 
    this.state = isTargeted ? this.STATE_RUNNING : this.STATE_NODETECT

    // 그리고 타겟되지 않았다면, 상태 변경 간격을 임시로 줄임
    if (!isTargeted) this.stateDelay.count = this.stateDelay.delay - 120
  }

  processMove () {
    // startup 상태 이외는 이동하지 않습니다.
    if (this.state === this.STATE_STARTUP) {
      super.processMove()
    }

    this.processMoveTrashCollision()
  }

  processMoveTrashCollision () {
    if (this.state !== this.STATE_RUNNING) return
    // 만약, running상태일경우, 특정 적이랑 이 오브젝트랑 닿았는지 확인하여, 
    // 서로 닿았다면 적은 제거됩니다.

    let enemyList = fieldState.getEnemyObject()
    for (let i = 0; i < enemyList.length; i++) {
      let enemy = enemyList[i]
      if (enemy.mainType !== this.TRASH_MAIN_TYPE) continue

      if (collision(enemy, this)) {
        enemy.hp = 0 // 닿은 적은 즉시 hp가 0이됨
      }
    }
  }

  display () {
    if (this.state === this.STATE_RUNNING) {
      this.enimationRunning.display(this.x, this.y)
    } else {
      super.display()
    }
  }
}

class TowerEnemyGroup5Roller extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.roller, 3)
    this.setEnemyByCpStat(21, 8)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerRoller, imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.enemyDieRoller, 45)

    this.STATE_NORMAL = 'normal'
    this.STATE_COLLISION = 'collision'
    this.state = this.STATE_NORMAL
    this.collisionDelay.delay = 120

    this.saveList = {
      accSpeed: 0,
    }

    this.moveDelay = new DelayData(120)
  }

  processPlayerCollisionSuccessAfter () {
    this.state = this.STATE_COLLISION
    this.saveList.accSpeed = -Math.abs(this.saveList.accSpeed + 1)
    this.moveDelay.count = 0
    soundSystem.play(soundSrc.enemyAttack.towerRollerCollision)
  }

  processMove () {
    super.processMove()

    if (this.state === this.STATE_NORMAL) this.processMoveNormal()
    else if (this.state === this.STATE_COLLISION) this.processMoveCollision()
  }

  processMoveNormal () {
    this.moveDelay.check()
    if (!this.moveDelay.divCheck(4)) return

    this.saveList.accSpeed += 0.1
    if (this.saveList.accSpeed > 7) this.saveList.accSpeed = 7
    this.setMoveSpeed(this.saveList.accSpeed, this.moveSpeedY)
  }

  processMoveCollision () {
    this.saveList.accSpeed += 0.1
    if (this.saveList.accSpeed > 0) this.saveList.accSpeed = 0
    this.setMoveSpeed(this.saveList.accSpeed, this.moveSpeedY)

    if (this.moveDelay.check()) {
      this.state = this.STATE_NORMAL
    }
  }

  display () {
    if (this.state === this.STATE_NORMAL) {
      super.display()
    } else {
      this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.rollerCollision, this.x, this.y)
    }
  }
}

class TowerEnemyGroup5Cutter extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.cutter, 1)
    this.setEnemyByCpStat(10, 6)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerCutter, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.metalSlashGrey, 2)

    this.STATE_UP = 'up'
    this.STATE_SIDE = 'side'
    this.state = this.STATE_UP

    this.saveList = {
      finishY: 0
    }
  }

  afterInit () {
    this.x = Math.random() * 100 + graphicSystem.CANVAS_WIDTH - 200
    this.y = graphicSystem.CANVAS_HEIGHT + 100
    this.saveList.finishY = Math.random() * 200
    this.setMoveSpeed(0, -Math.random() * 3 - 4)
  }

  processMove () {
    super.processMove()
    if (this.state === this.STATE_UP) {
      if (this.y <= this.saveList.finishY) {
        this.state = this.STATE_SIDE
        this.setRandomMoveSpeedMinMax(6, -2, 11, 2)
      }
    }
  }
}

class TowerEnemyGroup5VaccumCleaner extends TowerEnemy {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataInfo.towerEnemyGroup5.vacuumCleaner)
    this.setEnemyByCpStat(12000, 15)
    this.setDieEffectTemplet(soundSrc.enemyDie.enemyDieTowerVacuumCleaner, imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.circleBlue)
    this.isPossibleExit = false
    this.setMoveSpeed(0, 0)

    const horizontalSize = imageDataInfo.towerEnemyGroup5.vacuumCleanerHoseHorizontal.height
    const verticalSize = imageDataInfo.towerEnemyGroup5.vacuumCleanerHoseVertical.width
    this.objectList = {
      hoseVertical: {x: 0, y: 0, width: 0, height: 0, degree: 0},
      hoseHorizontal: {x: 0, y: 0, width: 0, height: 0, distance: 0, degree: 0},
      hoseConnect1: {x: 0, y: 0, width: 0, height: 0, degree: 0},
      hoseConnect2: {x: 0, y: 0, width: 0, height: 0, degree: 0},
      hoseRect: {x: 0, y: 0, width: 0, height: 0, degree: 0},
      inhaler: {x: 0, y: 0, width: 0, height: 0, degree: 0},
      distance: {h: horizontalSize, v: verticalSize, hDirection: 0, vDirection: 0},
      gravity: 0,
      hyperPosition: {x: 0, y: 0, time: 0}
    }

    this.hoseTypeList = {
      UPLEFT: 'upleft',
      LEFTDOWN: 'leftdown',
      DOWNRIGHT: 'downright',
      RIGHTUP: 'rightup'
    }

    this.boostSpeed = 0

    this.stateDelay = new DelayData(600)
    this.attackDelay = new DelayData(60)
    this.dieAfterDeleteDelay = new DelayData(240)

    this.STATE_HYPER = 'hyper'
    this.STATE_FIRST = 'first'
    this.STATE_HOSE_VERTICAL = 'hoseVertical'
    this.STATE_HOSE_HORIZONTAL = 'hoseHorizontal'
    this.STATE_RUSH = 'rush'
    this.STATE_TRASH_THROW = 'trashTrhow'
    this.STATE_HOSE_RANDOM = 'hoseRandom'
    this.state = this.STATE_FIRST
  }

  getCollisionArea () {
    if (this.state === this.STATE_HYPER) {
      return [
        this.getCollisionAreaCalcurationObject()
      ]
    } else {
      return [
        this.getCollisionAreaCalcurationObject(),
        this.objectList.hoseVertical,
        this.objectList.hoseHorizontal,
        this.objectList.hoseConnect1,
        this.objectList.hoseConnect2,
        this.objectList.hoseRect,
        this.objectList.inhaler
      ]
    }
  }

  afterInit () {
    // 각 연결된 호스의 크기 기본값들...
    const RECT_SIZE = imageDataInfo.towerEnemyGroup5.vacuumCleanerHoseRect.width
    const VERTICAL_SIZE = imageDataInfo.towerEnemyGroup5.vacuumCleanerHoseVertical.width
    const HORIZONTAL_SIZE = imageDataInfo.towerEnemyGroup5.vacuumCleanerHoseVertical.height
    this.objectList.hoseVertical.width = VERTICAL_SIZE
    this.objectList.hoseVertical.height = RECT_SIZE
    this.objectList.hoseConnect1.width = RECT_SIZE
    this.objectList.hoseConnect1.height = RECT_SIZE
    this.objectList.hoseHorizontal.width = RECT_SIZE
    this.objectList.hoseHorizontal.height = HORIZONTAL_SIZE
    this.objectList.hoseConnect2.width = RECT_SIZE
    this.objectList.hoseConnect2.height = RECT_SIZE
    this.objectList.hoseRect.width = RECT_SIZE
    this.objectList.hoseRect.height = RECT_SIZE
    this.objectList.inhaler.width = imageDataInfo.towerEnemyGroup5.vacuumCleanerInhaler.width
    this.objectList.inhaler.height = imageDataInfo.towerEnemyGroup5.vacuumCleanerInhaler.height

    // 호스 길이 설정
    this.objectList.distance.v = 120
    this.objectList.distance.h = 60
  }

  saveProcess () {
    this.saveList = this.objectList
  }

  loadProcess () {
    this.objectList = this.saveList
  }

  processState () {
    this.processObjectCalcuration()

    if (this.hp <= this.hpMax * 0.2 && this.state !== this.STATE_HYPER) {
      this.state = this.STATE_HYPER
      this.objectList.gravity++
      this.setMoveSpeed(0, 0)
      soundSystem.play(soundSrc.enemyDie.enemyDieTowerVacuumCleaner)
      this.objectList.hyperPosition.x = this.x
      this.objectList.hyperPosition.y = this.y
    }

    if (this.state === this.STATE_RUSH) {
      this.isPossibleExit = true
    } else {
      this.isPossibleExit = false
    }

    if (this.stateDelay.check() && this.state !== this.STATE_HYPER) {
      // stateChange
      switch (this.state) {
        case this.STATE_FIRST: this.state = this.STATE_HOSE_VERTICAL; break
        case this.STATE_HOSE_VERTICAL: this.state = this.STATE_HOSE_HORIZONTAL; break
        case this.STATE_HOSE_HORIZONTAL: this.state = this.STATE_RUSH; break
        // 이후 3개의 패턴만 반복됨
        case this.STATE_RUSH: this.state = this.STATE_TRASH_THROW; break
        case this.STATE_TRASH_THROW: this.state = this.STATE_HOSE_RANDOM; break
        case this.STATE_HOSE_RANDOM: this.state = this.STATE_RUSH; break
      }
    }
  }

  processAttack () {
    switch (this.state) {
      case this.STATE_FIRST: this.processAttackFirst(); break
      case this.STATE_HOSE_VERTICAL: this.processAttackHoseVertical(); break
      case this.STATE_HOSE_HORIZONTAL: this.processAttackHoseHorizontal(); break
      case this.STATE_RUSH: this.processAttackHoseRush(); break
      case this.STATE_TRASH_THROW: this.processAttackHoseTrashThrow(); break
      case this.STATE_HOSE_RANDOM: this.processAttackHoseRandom(); break
      case this.STATE_HYPER: this.processAttackHyper(); break
    }
  }

  processAttackFirst () {
    this.stateDelay.setDelay(600)

    // 적 총알과의 충돌 체크 (inhaler object에 닿으면 적 총알은 사라져야 함)
    this.processAttackFirstInhalerCollision()

    // 사운드 재생 (stateDelayCount가 0인상태에서 사운드가 재생되지 않으므로, 첫번째 사운드가 출력되도록 조건을 추가함)
    if (this.stateDelay.count === 1 || this.stateDelay.divCheck(120)) {
      soundSystem.play(soundSrc.enemyAttack.towerVacuumCleanerFirst)
    }

    // 공격 주기 확인
    this.attackDelay.setDelay(15)
    if (this.stateDelay.count <= this.stateDelay.delay - 120 && this.attackDelay.check()) {
      this.processAttackFirstCreate()
    } 
  }

  processAttackFirstCreate () {
    // 4방에서 쓰레기가 흡입기에 들어가도록 생성 (시계 방향 순서)
    const trashSize = 40
    let arrayX = [Math.random() * graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_WIDTH + trashSize, Math.random() * graphicSystem.CANVAS_WIDTH, 0 - trashSize]
    let arrayY = [0 - trashSize, Math.random() * graphicSystem.CANVAS_HEIGHT, graphicSystem.CANVAS_HEIGHT + trashSize, Math.random() * graphicSystem.CANVAS_HEIGHT]
    let inhalerCenterX = this.objectList.inhaler.x + (this.objectList.inhaler.width / 2)
    let inhalerCenterY = this.objectList.inhaler.y + (this.objectList.inhaler.height / 2)

    for (let i = 0; i < 4; i++) {
      let bullet = new TowerEnemyGroup5VaccumCleaner.TrashBullet()
      bullet.setPosition(arrayX[i], arrayY[i])
      bullet.setMoveSpeedChaseLine(inhalerCenterX, inhalerCenterY, 120, 2)
      fieldState.createEnemyBulletObject(bullet)
    }
  }

  processAttackFirstInhalerCollision () {
    // 적 총알이 흡입기에 닿는지를 판정함
    let enemyBulletList = fieldState.getEnemyBulletObject()
    for (let i = 0; i < enemyBulletList.length; i++) {
      let enemybullet = enemyBulletList[i]
      if (collision(enemybullet, this.objectList.inhaler)) {
        enemybullet.isDeleted = true
      }
    }
  }

  processAttackHoseVertical () {
    this.stateDelay.setDelay(240)
    let randomSpeed = Math.floor(Math.random() * 6) + 6
    this.processAttackHoseMoveVertical(randomSpeed)
  }

  processAttackHoseHorizontal () {
    this.stateDelay.setDelay(240)
    let randomSpeed = Math.floor(Math.random() * 12) + 12
    this.processAttackHoseMoveHorizontal(randomSpeed)
  }

  processAttackHoseRush () {
    this.stateDelay.setDelay(300)
    if (this.stateDelay.count === 1) {
      this.boostSpeed = 0.1
    }

    if (this.stateDelay.divCheck(120)) {
      soundSystem.play(soundSrc.enemyAttack.towerVacuumCleanerRush)
    }

    if (this.stateDelay.count < this.stateDelay.delay - 60) {
      this.boostSpeed += 0.1
      if (this.boostSpeed > 10) this.boostSpeed = 10  
    } else {
      this.boostSpeed -= 0.4
      if (this.boostSpeed < 0) this.boostSpeed = 0
    }

    this.setMoveSpeed(this.boostSpeed, 0)
  }

  processAttackHoseTrashThrow () {
    this.stateDelay.setDelay(360)

    // 청소기 강제 이동
    if (this.x + this.width < graphicSystem.CANVAS_WIDTH) {
      this.x += 10
      if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
        this.x = graphicSystem.CANVAS_WIDTH - this.width
      }
    }

    this.attackDelay.setDelay(60)
    if (!this.attackDelay.check()) return
    let player = fieldState.getPlayerObject()
    soundSystem.play(soundSrc.enemyAttack.towerVacuumCleanerTrash)

    for (let i = 0; i < 4; i++) {
      let bullet = new TowerEnemyGroup5VaccumCleaner.TrashBullet()
      bullet.setPosition(this.objectList.inhaler.x, this.objectList.inhaler.y + (40 * i))
      if (Math.random() < 0.25) {
        bullet.setMoveSpeedChaseLine(player.x, player.y, 150, 3)
      } else {
        bullet.setRandomMoveSpeedMinMax(2, 0, 4, 3, true)
      }
      fieldState.createEnemyBulletObject(bullet)
    }
  }

  processAttackHoseRandom () {
    this.stateDelay.setDelay(480)

    let randomSpeedV = Math.floor(Math.random() * 12) + 4
    let randomSpeedH = Math.floor(Math.random() * 6) + 4
    this.processAttackHoseMoveVertical(randomSpeedV)
    this.processAttackHoseMoveHorizontal(randomSpeedH)

    if (this.stateDelay.divCheck(120)) {
      this.setRandomMoveSpeed(2, 2, true)
    }
  }

  /**
   * 호스 수평 방향의 이동속도 결정
   * @param {number} speed 속도
   */
  processAttackHoseMoveVertical (speed = 5) {
    const MAX_SIZE = 300
    const MIN_SIZE = 12
    if (this.objectList.distance.vDirection === 0) {
      this.objectList.distance.vDirection = -1
    }

    // vDirection (방향, 1: 오른쪽, -1: 왼쪽, 0: 없음 -> 기본값으로 변환)
    // 특정 길이를 벗어나면은 방향을 변경합니다.
    if (this.objectList.distance.vDirection === -1) {
      this.objectList.distance.v -= speed
      if (this.objectList.distance.v < MIN_SIZE) {
        this.objectList.distance.v = MIN_SIZE
        this.objectList.distance.vDirection = 1
        soundSystem.play(soundSrc.enemyAttack.towerVacuumCleanerHose)
      }
    } else if (this.objectList.distance.vDirection === 1) {
      this.objectList.distance.v += speed
      if (this.objectList.distance.v > MAX_SIZE) {
        this.objectList.distance.v = MAX_SIZE
        this.objectList.distance.vDirection = -1
        soundSystem.play(soundSrc.enemyAttack.towerVacuumCleanerHose)
      }
    }
  }

  /**
   * 호스 수직 방향의 이동속도 결정
   * @param {number} speed 속도
   */
  processAttackHoseMoveHorizontal (speed = 5) {
    const MAX_SIZE = 300

    if (this.objectList.distance.hDirection === 0) {
      this.objectList.distance.hDirection = -1
    }

    // hDirection도 규칙은 vDirection과 동일 (위, 아래 방향)
    if (this.objectList.distance.hDirection === -1) {
      this.objectList.distance.h -= speed
      if (this.objectList.distance.h < -MAX_SIZE) {
        this.objectList.distance.h = -MAX_SIZE
        this.objectList.distance.hDirection = 1
        soundSystem.play(soundSrc.enemyAttack.towerVacuumCleanerHose)
      }
    } else if (this.objectList.distance.hDirection === 1) {
      this.objectList.distance.h += speed
      if (this.objectList.distance.h > MAX_SIZE) {
        this.objectList.distance.h = MAX_SIZE
        this.objectList.distance.hDirection = -1
        soundSystem.play(soundSrc.enemyAttack.towerVacuumCleanerHose)
      }
    }
  }

  processAttackHyper () {
    this.objectList.gravity++ // 나머지 개체들의 중력 증가 (바깥으로 사라짐)
    this.objectList.hyperPosition.time++ // 하이퍼 진행시간 증가

    // 개체 흔들기
    if (this.objectList.hyperPosition.time >= 120) {
      this.x = this.objectList.hyperPosition.x + Math.floor(Math.random() * 40) - 20
      this.y = this.objectList.hyperPosition.y + Math.floor(Math.random() * 40) - 20
    }

    if (this.stateDelay.divCheck(120)) {
      soundSystem.play(soundSrc.enemyAttack.towerVacuumCleanerHyper)
    }

    this.attackDelay.setDelay(45)
    if (!this.attackDelay.check()) return

    for (let i = 0; i < 8; i++) {
      let bullet = new TowerEnemyGroup5VaccumCleaner.TrashBullet()
      bullet.setPosition(this.centerX, this.centerY)
      bullet.setRandomMoveSpeedMinMax(1, 1, 3, 3, true)
      fieldState.createEnemyBulletObject(bullet)
    }
  }

  processObjectCalcuration () {
    // 크기 변경
    this.objectList.hoseVertical.width = this.objectList.distance.v
    this.objectList.hoseHorizontal.height = Math.abs(this.objectList.distance.h) // 이 값은 마이너스도 가능하므로, 플러스값으로 변경해야함
  
    // 위치 계산
    this.objectList.hoseVertical.x = this.x + 70 - this.objectList.hoseVertical.width + this.objectList.hoseRect.width
    this.objectList.hoseVertical.y = this.y + 140
    this.objectList.hoseConnect1.x = this.objectList.hoseVertical.x - this.objectList.hoseRect.width
    this.objectList.hoseConnect1.y = this.objectList.hoseVertical.y
    this.objectList.hoseHorizontal.x = this.objectList.hoseConnect1.x
    this.objectList.hoseHorizontal.y = this.objectList.distance.h >= 0 ? this.objectList.hoseConnect1.y + this.objectList.hoseConnect1.height : this.objectList.hoseConnect1.y - this.objectList.hoseHorizontal.height
    this.objectList.hoseConnect2.x = this.objectList.hoseHorizontal.x
    this.objectList.hoseConnect2.y = this.objectList.distance.h > 0 ? this.objectList.hoseHorizontal.y + this.objectList.hoseHorizontal.height : this.objectList.hoseHorizontal.y - this.objectList.hoseConnect2.height
    this.objectList.hoseRect.x = this.objectList.hoseConnect2.x - this.objectList.hoseConnect2.width
    this.objectList.hoseRect.y = this.objectList.hoseConnect2.y
    this.objectList.inhaler.x = this.objectList.hoseRect.x - this.objectList.inhaler.width 
    this.objectList.inhaler.y = this.objectList.hoseRect.y - (this.objectList.inhaler.height / 8 * 3)
  }

  processDieAfter () {
    super.processDieAfter()

    if (this.isDied && this.dieAfterDeleteDelay.divCheck(9)) {
      soundSystem.play(this.dieSound)

      if (this.dieEffect != null) {
        this.dieEffect.setWidthHeight(40, 40)
        fieldState.createEffectObject(this.dieEffect.getObject(), this.x + Math.random() * this.width, this.y + Math.random() * this.height)
      }
    }

    if (this.dieAfterDeleteDelay.count == this.dieAfterDeleteDelay.delay - 1) {
      soundSystem.play(soundSrc.enemyDie.enemyDieTowerBossCommon)
      if (this.dieEffect != null) {
        this.dieEffect.setWidthHeight(this.width, this.height)
        fieldState.createEffectObject(this.dieEffect.getObject(), this.x, this.y)
      }
    }
  }

  display () {
    const imgD = imageDataInfo.towerEnemyGroup5
    const objD = this.objectList

    super.display() // 원본 출력
    if (this.state === this.STATE_HYPER) { // 부서진 청소기 가운데 부품 출력
      this.imageObjectDisplay(imageSrc.enemy.towerEnemyGroup5, imgD.vacuumCleanerBrokenMiddle, this.x + 60, this.y + 130)
    }
    if (objD.gravity >= 240) return // 중력 120이상은 나머지 오브젝트 출력 무시

    // hoseVertical, hoseHorizontal은, 크기가 변경되어도 확대/축소 효과를 사용하지 않습니다.
    // 그래서 직접 이미지를 slice하기 위해, graphicSystem함수를 호출했습니다.
    // 다만, 이로 인하여, 정해진 범위를 초과하게되면, 이상한 그림이 출력될 수 있습니다. (이것을 검사하지는 않습니다.)
    // 참고: 그라비티가 0보다 높은경우는 하이퍼모드이고, 나머지 부품을 화면 바깥으로 내보내야 하므로, 회전 + 떨어지는 효과를 적용하도록 함
    graphicSystem.imageDisplay(
      this.imageSrc, 
      imgD.vacuumCleanerHoseVertical.x, 
      imgD.vacuumCleanerHoseVertical.y,
      objD.hoseVertical.width,
      objD.hoseVertical.height,
      objD.hoseVertical.x,
      objD.hoseVertical.y + (objD.gravity * 5),
      objD.hoseVertical.width,
      objD.hoseVertical.height,
      0,
      objD.gravity * 4
    )

    graphicSystem.imageDisplay(
      this.imageSrc,
      imgD.vacuumCleanerHoseHorizontal.x,
      imgD.vacuumCleanerHoseHorizontal.y,
      objD.hoseHorizontal.width,
      objD.hoseHorizontal.height,
      objD.hoseHorizontal.x,
      objD.hoseHorizontal.y + (objD.gravity * 5),
      objD.hoseHorizontal.width,
      objD.hoseHorizontal.height,
      0,
      objD.gravity * 4
    )

    let connectImgD1 = objD.distance.h >= 0 ? imgD.vacuumCleanerHoseClockwise1 : imgD.vacuumCleanerHoseClockwise4
    let connectImgD2 = objD.distance.h >= 0 ? imgD.vacuumCleanerHoseClockwise3 : imgD.vacuumCleanerHoseClockwise2

    this.imageObjectDisplay(this.imageSrc, connectImgD1, objD.hoseConnect1.x, objD.hoseConnect1.y + (objD.gravity * 5), objD.hoseConnect1.width, objD.hoseConnect1.height, 0, objD.gravity * 12)
    this.imageObjectDisplay(this.imageSrc, connectImgD2, objD.hoseConnect2.x, objD.hoseConnect2.y + (objD.gravity * 5), objD.hoseConnect2.width, objD.hoseConnect2.height, 0, objD.gravity * 12)
    this.imageObjectDisplay(this.imageSrc, imgD.vacuumCleanerHoseRect, objD.hoseRect.x, objD.hoseRect.y + (objD.gravity * 5), objD.hoseRect.width, objD.hoseRect.height, 0, objD.gravity * 12)
    this.imageObjectDisplay(this.imageSrc, imgD.vacuumCleanerInhaler, objD.inhaler.x, objD.inhaler.y + (objD.gravity * 5), objD.inhaler.width, objD.inhaler.height, 0, objD.gravity * 12)
  }

  static TrashBullet = class extends CustomEnemyBullet {
    constructor () {
      super()
      let imageDataList = [
        imageDataInfo.towerEnemyGroup5.trash1,
        imageDataInfo.towerEnemyGroup5.trash2,
        imageDataInfo.towerEnemyGroup5.trash3,
      ]
      let random = Math.floor(Math.random() * imageDataList.length)

      this.setAutoImageData(imageSrc.enemy.towerEnemyGroup5, imageDataList[random])
      this.attack = 4
      this.setRandomMoveSpeed(4, 4, true)
    }
  }
}

/**
 * 테스트용 적 (적의 형태를 만들기 전 테스트 용도로 사용하는 테스트용 적)
 */
class TestEnemy extends DonggramiEnemyA2Brick {
  constructor () {
    super()
    this.attackDelay = new DelayData(600)
    this.moveDelay = new DelayData(600)
    this.setEnemyStat(999999999, 0)
  }

  processMove () {
    this.moveDelay.check()
  }

  processAttack () {
    this.attackDelay.check()
  }
}


/** @type {Map<number, FieldData | EnemyData | any>} */
export const dataExportEnemy = new Map()

// testEnemy
dataExportEnemy.set(ID.enemy.test, TestEnemy)

// spaceEnemy / round 1-1 ~ 1-6
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

// meteoriteEnemy / round 1-2 ~ 1-6
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

// jemulEnemy / round 1-3 ~ 1-6
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

// donggramiEnemy / round 2-1 ~ 2-6
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

// donggramiEnemy / round 2-4 ~ 2-6
dataExportEnemy.set(ID.enemy.donggramiEnemy.fruit, DonggramiEnemyFruit)
dataExportEnemy.set(ID.enemy.donggramiEnemy.juice, DonggramiEnemyJuice)
dataExportEnemy.set(ID.enemy.donggramiEnemy.party, DonggramiEnemyParty)
dataExportEnemy.set(ID.enemy.donggramiEnemy.tree, DonggramiEnemyTree)
dataExportEnemy.set(ID.enemy.donggramiEnemy.leaf, DonggramiEnemyLeaf)
dataExportEnemy.set(ID.enemy.donggramiEnemy.talkRunawayR2_4, DonggramiEnemyTalkRunAwayR2_4)
dataExportEnemy.set(ID.enemy.donggramiEnemy.talkParty, DonggramiEnemyTalkParty)
dataExportEnemy.set(ID.enemy.donggramiEnemy.talkRuinR2_6, DonggramiEnemyTalkRuinR2_6)

// intruderEnemy / round 2-5 ~ 2-6, boss 2-4 ~ 2-5
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
dataExportEnemy.set(ID.enemy.intruder.towerLaserMini, IntruderEnemyTowerLaserMini)

// towerEnemyGroup1 / round 3-1 plus
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.moveBlue, TowerEnemyGroup1MoveBlue)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.moveViolet, TowerEnemyGroup1MoveViolet)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.moveDarkViolet, TowerEnemyGroup1MoveDarkViolet)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.moveYellowEnergy, TowerEnemyGroup1MoveYellowEnergy)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.sandglass, TowerEnemyGroup1Sandglass)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.tapo, TowerEnemyGroup1Tapo)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.punch, TowerEnemyGroup1Punch)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.daepo, TowerEnemyGroup1Daepo)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.hellgi, TowerEnemyGroup1Hellgi)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.helljeon, TowerEnemyGroup1Helljeon)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.hellcho, TowerEnemyGroup1Hellcho)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.hellba, TowerEnemyGroup1Hellba)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.hellgal, TowerEnemyGroup1Hellgal)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.laserAlpha, TowerEnemyGroup1LaserAlpha)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.laserMini, TowerEnemyGroup1LaserMini)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.laserMini2, TowerEnemyGroup1LaserMini2)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.I, TowerEnemyGroup1I)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.X, TowerEnemyGroup1X)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.gasiUp, TowerEnemyGroup1gasiUp)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.gasiDown, TowerEnemyGroup1gasiDown)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.square, TowerEnemyGroup1Square)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.squareMini, TowerEnemyGroup1SquareMini)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.diamond, TowerEnemyGroup1Diamond)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.diamondMini, TowerEnemyGroup1DiamondMini)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.pentagon, TowerEnemyGroup1Pentagon)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.pentagonMini, TowerEnemyGroup1PentagonMini)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.hexagon, TowerEnemyGroup1Hexagon)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.hexagonMini, TowerEnemyGroup1HexagonMini)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.octagon, TowerEnemyGroup1Octagon)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.octagonMini, TowerEnemyGroup1OctagonMini)
dataExportEnemy.set(ID.enemy.towerEnemyGroup1.crazyRobot, TowerEnemyGroup1CrazyRobot)

// towerEnemyGroup2 / round 3-2 plus
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.barRandom, TowerEnemyBarTemplete)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.barCyan, TowerEnemyGroup2BarCyan)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.barOrange, TowerEnemyGroup2BarOrnage)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.barGrey, TowerEnemyGroup2BarGrey)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.barLime, TowerEnemyGroup2BarLime)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.barYellow, TowerEnemyGroup2BarYellow)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.barViolet, TowerEnemyGroup2BarViolet)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.jagijang, TowerEnemyGroup2Jagijang)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.lightning, TowerEnemyGroup2Lightning)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.magnet, TowerEnemyGroup2Magnet)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.hellla, TowerEnemyGroup2Hellla)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.hellpa, TowerEnemyGroup2Hellpa)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.hellpo, TowerEnemyGroup2Hellpo)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.hellna, TowerEnemyGroup2Hellna)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.pentaLight, TowerEnemyGroup2PentaLight)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.pentaShadow, TowerEnemyGroup2PentaShadow)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.octaShadow, TowerEnemyGroup2OctaShadow)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.octaLight, TowerEnemyGroup2OctaLight)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.hexaShadow, TowerEnemyGroup2HexaShadow)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.hexaLight, TowerEnemyGroup2HexaLight)
dataExportEnemy.set(ID.enemy.towerEnemyGroup2.bigBar, TowerEnemyGroup2BigBar)

// towerEnemyGroup3 / round 3-3 plus
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.core8, TowerEnemyGroup3Core8)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.coreBrown, TowerEnemyGroup3CoreBrown)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.coreMetal, TowerEnemyGroup3CoreMetal)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.corePotion, TowerEnemyGroup3CorePotion)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.coreRainbow, TowerEnemyGroup3CoreRainbow)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.coreShot, TowerEnemyGroup3CoreShot)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.shipSmall, TowerEnemyGroup3ShipSmall)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.shipBig, TowerEnemyGroup3ShipBig)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.fakeBar, TowerEnemyGroup3FakeBar)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.fakeCore, TowerEnemyGroup3FakeCore)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.fakeHell, TowerEnemyGroup3FakeHell)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.fakeMove, TowerEnemyGroup3FakeMove)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.fakeShip, TowerEnemyGroup3FakeShip)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.star, TowerEnemyGroup3Star)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.bossDasu, TowerEnemyGroup3BossDasu)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.clockAnalog, TowerEnemyGroup3ClockAnalog)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.clockDigital, TowerEnemyGroup3ClockDigital)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.clockJong, TowerEnemyGroup3ClockJong)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.energyA, TowerEnemyGroup3EnergyA)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.energyBlue, TowerEnemyGroup3EnergyBlue)
dataExportEnemy.set(ID.enemy.towerEnemyGroup3.energyOrange, TowerEnemyGroup3EnergyOrange)

// towerEnemyGroup4 / round 3-5 only
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.nokgasi1, TowerEnemyGroup4Nokgasi1)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.nokgasi2, TowerEnemyGroup4Nokgasi2)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.blackSpaceAnti, TowerEnemyGroup4BlackSpaceAnti)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.blackSpaceArea, TowerEnemyGroup4BlackSpaceArea)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.blackSpaceGreen, TowerEnemyGroup4BlackSpaceGreen)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.blackSpaceRed, TowerEnemyGroup4BlackSpaceRed)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.blackSpaceTornado, TowerEnemyGroup4BlackSpaceTornado)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.antijemulP3_1, TowerEnemyGroup4AntijemulP3_1)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.antijemulP3_2, TowerEnemyGroup4AntijemulP3_2)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.antijemulP4_1, TowerEnemyGroup4AntijemulP4_1)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.antijemulP4_2, TowerEnemyGroup4AntijemulP4_2)
dataExportEnemy.set(ID.enemy.towerEnemyGroup4.antijemulP4_3, TowerEnemyGroup4AntijemulP4_3)

// towerEnemyGroup5 / round 3-6 plus
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.blub, TowerEnemyGroup5Blub)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.camera, TowerEnemyGroup5Camera)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.cctv, TowerEnemyGroup5Cctv)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.gabudan, TowerEnemyGroup5Gabudan)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.hellnet, TowerEnemyGroup5Hellnet)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.helltell, TowerEnemyGroup5Helltell)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.radio, TowerEnemyGroup5Radio)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.sirenBlue, TowerEnemyGroup5SirenBlue)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.sirenGreen, TowerEnemyGroup5SirenGreen)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.sirenRed, TowerEnemyGroup5SirenRed)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.trash1, TowerEnemyGroup5Trash1)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.trash2, TowerEnemyGroup5Trash2)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.trashWing, TowerEnemyGroup5TrashWing)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.trashLotter, TowerEnemyGroup5TrashLotter)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.sujipgi, TowerEnemyGroup5Sujipgi)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.roller, TowerEnemyGroup5Roller)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.cutter, TowerEnemyGroup5Cutter)
dataExportEnemy.set(ID.enemy.towerEnemyGroup5.vacuumCleaner, TowerEnemyGroup5VaccumCleaner)
