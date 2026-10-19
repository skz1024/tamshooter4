//@ts-check

import { DelayData, FieldData, EnimationData, collision, collisionClass } from "./dataField.js"
import { EffectData, CustomEffect } from "./dataEffect.js"
import { ID } from "./dataId.js"
import { fieldState } from "./field.js"
import { imageDataInfo, imageSrc } from "./imageSrc.js"
import { EnemyData } from "./dataEnemy.js"
import { soundSrc } from "./soundSrc.js"
import { game } from "./game.js"
import { dataExportStatPlayerSkill, dataExportStatWeapon } from "./dataStat.js"

let graphicSystem = game.graphic
let soundSystem = game.sound

/**
 * 이 게임에서 사용하는 무기 객체, 참고로 스킬도 이 객체를 사용하여 구현합니다.
 */
export class WeaponData extends FieldData {
  /** 추적 실패 제한: 새로운 적을 추적할 때마다 1씩 증가하고, 이 제한을 초과하면 무기는 더이상 추적을 하지 않습니다.  
   * 매 프레임마다 추적을 시도합니다. 추적하지 않는 무기는 오른쪽으로만 이동합니다.  
   * 이 변수는 과도한 추적 로직 사용을 금지하기 위해 만들어졌습니다. */ 
  static CHASE_MISS_LIMIT = 15

  static STATE_NORMAL = FieldData.state.NORMAL
  static STATE_SPLASH = 102
  static STATE_ATTACK = FieldData.state.ATTACK

  constructor () {
    super()
    /** 무기의 기본 이동 방향 x축 = 오른쪽 */ this.moveDirectionX = FieldData.direction.RIGHT
    /** 무기의 기본 이동 방향 y축 = 아래쪽 */ this.moveDirectionY = FieldData.direction.DOWN

    // 추적 오브젝트 여부
    /** 적을 추적하는지의 여부 */ this.isChase = false
    /** 선이 이동하는 것 처럼 추적하는 여부 (isChase여야만 적용됨) 
     * 주의: 만약 isChase가 false라면, isLineChase는 한 프레임만 추적하고 곧바로 false가 됩니다.
     * 따라서, 지속 추적을 위해서는 isChase 변수 또한 true로 만들어야 합니다. */ 
    this.isLineChase = false
    /** 라인 체이스에서 시작할 최소 속도 */ this.lineChaseMinSpeed = 20

    /** 추적 실패 횟수: 추적할 적이 없거나, 추적한 적이 죽거나 사라질경우 이 카운트가 1씩 증가합니다.  
     * 이 숫자는 추적할 적이 없을 때 과도한 추적 알고리즘 사용을 막기 위해 실행됨. */ this.chaseMissCount = 0
    /** 추적 실패를 제한시키는 횟수  */ this.chaseMissLimit = WeaponData.CHASE_MISS_LIMIT
    /** 추적 시작 후 경과된 프레임. 추적 상태일 때 값을 누적한다. */ this.chaseFrame = 0

    /**
     * 필드객체에서 사용하는 변수, 어떤 적을 추적하는지를 객체로 가져옴
     * @type {EnemyData | null}
     */
    this.targetObject = null

    /**
     * 공격 반복 횟수: 적을 여러번 때리거나, 또는 여러번 공격할 때 사용, 기본값: 1
     * 경고: 기본값 0이라면, 공격횟수가 0인 것으로 취급해 무기가 즉시 사라질 수 있음.
     * 
     * attackCount는 이 값이랑 거의 동일한 의미이므로 attackCount 옵션은 사용하면 안됩니다.
     */
    this.repeatCount = 1

    /** 반복 딜레이 객체(딜레이가 없어도 생성됨, 다만 사용되지 않을뿐) */
    this.repeatDelay = new DelayData(1)

    /** 무기 1개체가 적을 동시에 타격 가능한 경우 @type {boolean} */
    this.isSplash = false

    /** 스플래시 공격일 때, 무기 1개체가 동시 타격할 수 있는 개수 @type {number} */
    this.maxTarget = 20

    /** 타격 사운드의 경로 (참고: 이것은 여러명을 때려도 1번만 사운드가 출력됨) */
    this.hitSoundSrc = ''

    /** 서브 무기를 생성하는 경우, 그 서브 무기의 ID
     * 경고: 서브 무기는 반드시 이름 뒤에 Sub 단어가 붙어야만 합니다. @type {number} */
    this.subId = 0

    /** 1회 반복(repeatCount) 당 서브 무기를 생성하는 개수 @type {number} */
    this.subCount = 0

    /*** 적을 타격 성공했을 때, 나오는 이펙트 (여러개의 적을 때리면, 여러개의 이펙트가 생성될 수 있음.)
     * @type {CustomEffect | null} */
    this.hitEffect = null

    /** 스플래시 공격이 실행되었을 때, 나오는 이펙트
     * @type {CustomEffect | null} */
    this.splashEffect = null
  }

  /** 스플래시 영역을 얻습니다. 스플래시 무기는 이 함수를 상속받아서 스플래시 영역을 설정해주세요.   
   * 이런 함수를 만든 이유는, 현재 위치에 따라 스플래시 영역이 변경되기 때문입니다.  
   * 속성으로는 현재 위치에 따른 결과를 얻을 수 없습니다.
   * @returns {import("./dataField.js").CollisionTarget} */
  getSplashArea () {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    }
  }

  /** 스플래시 공격 모드로 설정, state를 STATE_SPLASH로 바꾸는 방법도 가능하지만
   * 명시적으로 하려면 이 함수를 사용해주세요.  
   * 주의: 생성자에서는 호출하지 마세요. 시작하자마자 적용하려면 afterInit함수에서 호출하세요. */
  setSplashAttack () {
    if (this.isSplash) {
      this.state = WeaponData.STATE_SPLASH
      this.repeatDelay.setCountMax()
    } else {
      console.warn('스플래시가 아닌데 이 무기를 소환했다고요? 그것은 실수일 지도 모릅니다.')
    }
  }

  afterInitDefault () {
    super.afterInitDefault()
    this.inputStat()
  }

  /** 무기 id에 맞는 해당 스탯을 얻어옵니다. 이 함수는 afterinit에서 자동 실행되므로, 이 함수를 재정의할 필요는 없음 */
  inputStat () {
    let stat = dataExportStatWeapon.get(this.id)
    if (stat == null) return

    this.isChase = stat.isChase
    this.isSplash = stat.isSplash
    this.subCount = stat.subCount
    this.subId = stat.subId
    this.repeatCount = stat.repeatCount
    this.maxTarget = stat.maxTarget
    this.repeatDelay.setDelay(stat.repeatDelay)
    this.repeatDelay.setCountMax()
  }

  /** 서브 웨폰을 생성합니다.서브 웨폰이 있는 경우에만 생성이 가능하며, 
   * 서브 웨폰 생성 이후, repeatCount가 1 감소합니다. */
  createSubWeapon () {
    if (this.subCount <= 0 || this.subId === ID.weapon.unused) return

    this.repeatCount--
    for (let i = 0; i < this.subCount; i++) {
      fieldState.createWeaponObject(this.subId, this.x, this.y, this.attack, i)
    }
  }

  /**
   * 무기의 처리 프로세스
   * 이 함수는 임의로 수정하지 마세요. Weapon 객체가 공통으로 사용해야 합니다.
   */
  process () {
    super.process()
    this.processChase()
    this.processDeleteCheck()
  }

  /** 정해진 조건이 되면 무기를 삭제합니다. */
  processDeleteCheck () {
    // 삭제 조건은 다음과 같습니다.
    // 1. repeatCount가 0 이하인 경우, 무기는 더이상 공격을 수행할 수 없으므로 삭제합니다.
    // 2. elapsedFrame이 일정 값 이상인 경우, 오랫동안 무기가 남아있는 걸 방지하기 위해 삭제합니다.
    // 3. 화면 경계에서 일정 범위를 벗어나는 경우 무기를 삭제합니다. 
    if (this.repeatCount <= 0 || this.elapsedFrame >= 420 || this.outAreaCheck(800)) {
      this.isDeleted = true
    }
  }

  /**
   * 무기 옵션을 설정합니다. (현재는 공격력만 수정할 수 있음.)
   * (플레이어의 공격력에 영향을 받기 때문에, 따로 설정해 주어야 합니다.)
   * @param {number} attack 무기 공격력 (플레이어의 공격력이 아닙니다!)
   */
  setAttack (attack) {
    this.attack = attack
  }

  /**
   * 옵션의 번호를 설정합니다. 번호가 설정된 무기는 자체적인 알고리즘을 통하여 무기의 발사 스타일을 변경합니다.
   * 
   * 이 함수는 단독으로는 아무 역할도 하지 않으며, 따라서 오버라이딩을 해야 합니다.
   * 
   * 각 무기마다 세부 구현 공식은 다를 수 있습니다.
   * 
   * 주의: 이 함수를 오버라이딩 할 때, option 매개변수를 까먹지 마세요.
   * @param {number} option
   */
  setOption (option) {
    // 코드의 예시는 다음과 같습니다.
    if (option === 0) {
      // 0번이 입력된 무기를 설정해주세요.
    }
  }

  /**
   * 무기가 대상을 타격한 경우 피격 대상에게 데미지를 줍니다.  
   * 이 함수는 표준 데미지 함수아고, 피해 처리는 이 함수에서만 해야 합니다.  
   * 다른 곳에서 피격 대상의 체력을 직접 감소시키지 마세요!
   * 
   * 최소 데미지는 1입니다. 피해를 적용하면 피격 데미지와 타격 이펙트를 출력합니다.
   * @param {FieldData} hitedTarget 총돌하여 데미지를 받을 객체(반드시 적일 필요는 없음.)
   */
  damageProcess (hitedTarget) {
    // 기본적으로 무기와 적의 충돌은 무기의 공격력 만큼 적의 체력을 감소합니다.
    let damage = this.attack
    if (damage < 1) {
      damage = 1
    }

    hitedTarget.hp -= damage
    fieldState.createDamageObject(hitedTarget.x, hitedTarget.y, damage)

    if (this.hitEffect) {
      let hitEffect = this.hitEffect.getObject()
      hitEffect.setWidthHeight(hitedTarget.width, hitedTarget.height)
      fieldState.createEffectObject(hitEffect, hitedTarget.x, hitedTarget.y)
    }
  }

  /** 무기는 적 오브젝트를 공격합니다. processAttack 함수는 무기가 적을 공격하기 위한 로직을 작성합니다.
   * 이 함수에서 공격횟수를 소모하고, 적을 공격하기 위해서는 이 함수 내부에서 hitObjectProgress를 사용해야 합니다. */
  processAttack () {
    if (this.isSplash) {
      // 스플래시 타입 무기의 경우, 상태가 스플래시여야만 공격이 가능하고,
      // 반복 딜레이 카운트를 채워야만 공격할 수 있습니다.
      if (this.state !== WeaponData.STATE_SPLASH) return
      if (!this.repeatDelay.check()) return
      
      const splashArea = this.getSplashArea()
      this.processHitObject(splashArea)

      // 스플래시 공격이 끝난 후, 스플래시 영역에 따른 이펙트를 생성시킵니다.
      if (this.splashEffect) {
        this.splashEffect.setWidthHeight(splashArea.width, splashArea.height)
        fieldState.createEffectObject(this.splashEffect, splashArea.x, splashArea.y)
      }
    } else {
      // 반복딜레이거 처리되지 않으면 공격처리를 하지 않음
      // 공격에 성공했을 때에만, 반복딜레이 카운트가 리셋됨
      if (!this.repeatDelay.checkWithoutReset()) return
  
      this.processHitObject()
    }
  }

  /**
   * 해당 무기 판정에 따른, 정해진 공격 범위를 기준으로 공격된 적들을 확인하는 함수입니다.
   * 
   * 기본적으로 무기는 충돌 처리 후 적을 때린 시점에서 반복횟수가 감소하여 나중에 자동으로 삭제됩니다.
   * 다만 공격방식이 좀 다른 무기들은, 로직 처리가 약간 다릅니다.
   * 
   * 스플래시는 공격 1회당 반복횟수가 1회 감소하고,일반 무기는 타격 1회당 반복횟수가 1회 감소합니다. 
   * [예를 들어 미사일은 8번 공격하지만, 레이저는 20번 타격, 멀티샷은 1회 타격]
   * 
   * 모든 반복횟수를 소모하였다면, 무기는 process함수에서 자동으로 삭제됩니다.
   * 참고로 공격범위가 지정되지 않으면, 현재 무기의 객체 범위를 그대로 사용합니다.
   * @param {import("./dataField.js").CollisionTarget} attackArea 공격 범위
   */
  processHitObject (attackArea = { x: this.x, y: this.y, width: this.width, height: this.height }) {
    if (this.isSplash) {
      this.#processHitObjectSplash(attackArea)
    } else {
      this.#processHitObjectNormalTarget(attackArea)
    }
  }

  /**
   * 적 공격에 성공했을 때 사용하는 추가적인 함수
   * 
   * 지금은, 타격 사운드 출력, 반복 카운트 리셋을 적용
   */
  #processHitObjectHitAfter () {
    this.repeatDelay.countReset()

    if (this.hitSoundSrc !== '') {
      soundSystem.play(this.hitSoundSrc)
    }
  }


  /**
   * 멀티 타겟 기능을 가진 무기에 대한 공격 처리
   * @param {import("./dataField.js").CollisionTarget} attackArea
   */
  #processHitObjectSplash (attackArea) {
    let targetCount = 0
    const enemyObject = fieldState.getEnemyObject() // 적 오브젝트
    this.repeatCount--

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      const currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
      if (currentEnemy.isDied) continue // 적이 죽은경우 무시

      // 충돌한 경우, 충돌한 상태에서의 로직을 처리
      if (collision(attackArea, currentEnemy)) {
        this.damageProcess(currentEnemy)
        targetCount++ // 적을 때린 횟수 1회 증가

        // 만약 적을 때린 횟수가 최대 제한 이상이면 루프 종료
        if (targetCount >= this.maxTarget) {
          break
        }
      }
    }

    if (targetCount > 0) {
      this.#processHitObjectHitAfter()
    }
  }

  /**
   * 일반 타겟 기능을 가진 무기에 대한 공격 처리
   * @param {import("./dataField.js").CollisionTarget} attackArea 
   */
  #processHitObjectNormalTarget (attackArea) {
    const enemyObject = fieldState.getEnemyObject() // 적 오브젝트

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      const currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
      if (currentEnemy.isDied) continue // 적이 죽은경우 무시

      if (collision(attackArea, currentEnemy)) {
        // 충돌한 경우, 충돌한 상태에서의 로직을 처리
        this.damageProcess(currentEnemy)
        this.repeatCount-- // 만약 적을 때렸다면, 무기의 반복 횟수를 감소시킵니다.
        this.#processHitObjectHitAfter()
        break
      }
    }
  }

  /**
   * 무기에 타겟이 존재할 때, 해당 타켓이랑 충돌했는지 확인합니다.
   * @param {{x: number, y: number, width: number, height: number}} attackArea
   */
  targetEnemyHitedCheck (attackArea = { x: this.x, y: this.y, width: this.width, height: this.height }) {
    if (this.targetObject) {
      if (collision(attackArea, this.targetObject)) {
        return true
      }
    }

    return false
  }

  /**
   * 적이 무기와 1개체 이상 충돌했는지 확인. 
   * 
   * (로직 처리가 아닌 충돌 여부 확인 함수입니다.) 데미지 처리는 하지 않습니다.
   * @param {{x: number, y: number, width: number, height: number}} attackArea 공격 범위
   * @returns {boolean}
   */
  enemyHitedCheck (attackArea = { x: this.x, y: this.y, width: this.width, height: this.height }) {
    const enemyObject = fieldState.getEnemyObject() // 적 오브젝트 가져오기

    for (let i = 0; i < enemyObject.length; i++) {
      const currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
      if (currentEnemy.isDied) continue // 적이 죽은경우 무시

      // 각각의 적마다 충돌 검사
      // 적들 중 하나라도 충돌했다면, true
      if (collision(attackArea, currentEnemy)) {
        return true
      }
    }

    // 어떠한 적도 충돌하지 않았다면 false
    return false
  }

  /**
   * 무기랑 충돌한 모든 적 객체를 가져옵니다. (최대개수가 정해지지 않은경우 해당하는 모든 객체를 가져옴)
   * @param {{x: number, y: number, width: number, height: number}} attackArea 공격 범위
   * @param {number} maxCount 최대 개수
   * @returns {EnemyData[] | null}
   */
  getEnemyHitObject (attackArea = { x: this.x, y: this.y, width: this.width, height: this.height }, maxCount = -1) {
    const hitEnemyList = []
    const enemyObject = fieldState.getEnemyObject() // 적 오브젝트 가져오기

    for (let i = 0; i < enemyObject.length; i++) {
      const currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
      if (currentEnemy.isDied) continue // 적이 죽은경우 무시

      // 각각의 적마다 충돌 검사
      // 적들 중 하나라도 충돌했다면, true
      if (collision(attackArea, currentEnemy)) {
        hitEnemyList.push(currentEnemy)
        if (maxCount >= 0 && hitEnemyList.length >= maxCount) {
          break // for문 종료
        }
      }
    }

    if (hitEnemyList.length >= 1) {
      return hitEnemyList
    } else {
      return null
    }
  }

  /** 현재 타겟이 죽어있거나 삭제되었는지를 확인합니다. 다만 타겟이 없으면 무조건 false 리턴 */
  targetDeletedOrDiedCheck () {
    if (this.targetObject) {
      if (this.targetObject.isDeleted || this.targetObject.isDied) {
        return true
      }
    }

    return false
  }

  /**
   * 추적에 관한 전체 로직
   * 
   * 이 함수는 복합적으로 구성되어 있어서, 상속받지 않고, 세부 구현 함수를 따로 상속받는것을 추천합니다.
   * 
   * processChase... 로 시작하는 함수들을 참고해주세요.
   */
  processChase () {
    // 추적 타입이 아닌 경우 함수 종료 (아무것도 하지 않음)
    if (!this.isChase && !this.isLineChase) return

    // 추적은 속도값을 이용해서 적을 추적하므로, 이동 방향은 정하지 않음.
    this.setMoveDirection()

    // 추적하는 오브젝트가 있을 경우
    if (this.targetObject) {
      // 추적하는 오브젝트가 있지만, 삭제된경우에는 해당 오브젝트를 더이상 추적하지 않고 함수를 종료
      // 죽은 적도 더이상 추적하지 않음
      if (this.targetDeletedOrDiedCheck()) {
        this.targetObject = null
      } else {
        // 그 외의 경우는 적을 정상적으로 추적
        if (this.isLineChase) {
          this.processChaseLine()
        } else {
          this.processChaseEnemy()
        }
      }
    } else {
      this.chaseMissCount++ // 추적 미스카운트를 1추가

      // 참고로, chaseMissCount 숫자가 일정 값 이상일경우 해당 객체는 적을 더이상 추적하지 않습니다.
      // 무기의 이동속도 변화는 없음
      if (this.chaseMissCount > this.chaseMissLimit) {
        this.isChase = false

        // 만약, 이동속도가 0이라면, 임의로 속도 재조정함
        if (this.moveSpeedX === 0 && this.moveSpeedY === 0) {
          this.setMoveSpeed(20, 0)
        }
      } else {
        // 추적하는 오브젝트가 없을 경우 추적하는 오브젝트를 설정합니다.
        this.targetObject = fieldState.getRandomEnemyObject()
      }
    }
  }

  /**
   * 이 함수는 targetObject로 지정된 적을 추적하는 역할입니다.
   * 
   * 추적 이동 방식을 변경하고 싶다면, 이 함수를 상속받아서 구현해주세요.
   * 
   * 이 함수에서는 해당 객체가 isChaseType이 맞는지를 확인할 필요는 없습니다.
   * (이미 processChase 함수에서 판정했으므로 상관없음.)
   * 
   * 또한 targetObject가 null인지 확인할 필요는 없습니다. (이 함수를 호출하는곳에서 전부 확인하기 때문에)
   */
  processChaseEnemy () {
    // 추적 상태가 아니면 지속 추적을 하지 않고, isLineChase 는 false가 됩니다.
    if (!this.isChase) {
      this.isLineChase = false
    }

    // 이 함수를 사용하기 전에 targetObject가 null이아님을 확인했으므로 여기서는 따로 null 검사를 하진 않습니다.
    // 현재 오브젝트와 타겟 오브젝트의 center(중심 좌표)를 계산하여 거리 차이를 알아냅니다.
    const targetCenterX = this.targetObject.x + (this.targetObject.width / 2)
    const targetCenterY = this.targetObject.y + (this.targetObject.height / 2)
    const centerX = this.x + (this.width / 2)
    const centerY = this.y + (this.height / 2)

    const distanceX = targetCenterX - centerX
    const distanceY = targetCenterY - centerY

    // 남은 거리의 1/10 만큼, 해당 오브젝트를 이동시킵니다.
    this.moveSpeedX = distanceX / 10
    this.moveSpeedY = distanceY / 10

    // 각 타겟의 이동 속도값(절대값으로 얻음)
    const absTargetSpeedX = Math.abs(this.targetObject._speedX)
    const absTargetSpeedY = Math.abs(this.targetObject._speedY)
    let minSpeedX = (this.elapsedFrame / 20) + absTargetSpeedX
    let minSpeedY = (this.elapsedFrame / 20) + absTargetSpeedY

    // 속도 보정: 적 이동속도보다 빨리 무기가 움직여야함.
    if (this.moveSpeedX < 0 && this.moveSpeedX > -minSpeedX) {
      this.moveSpeedX = -minSpeedX - 2
    } else if (this.moveSpeedX > 0 && this.moveSpeedX < minSpeedX) {
      this.moveSpeedX = minSpeedX + 2
    }

    if (this.moveSpeedY < 0 && this.moveSpeedY > -minSpeedY) {
      this.moveSpeedY = -minSpeedY - 1
    } else if (this.moveSpeedY > 0 && this.moveSpeedY < minSpeedY) {
      this.moveSpeedY = minSpeedY + 1
    }

    // 적과의 좌표 차이가 X축, Y축으로 일정 값 이하 또는 생성된 지 240프레임이 지난 경우
    // 무기를 적 좌표에 바로 대입시켜버립니다. 이 경우, 다음 충돌검사에서 true가 되어 곧바로 적을 공격하게 됩니다.
    if ((Math.abs(distanceX) <= 10 && Math.abs(distanceY) <= 10) || this.elapsedFrame >= 240) {
      this.x = targetCenterX - Math.floor(this.width / 2)
      this.y = targetCenterY - Math.floor(this.height / 2)
    }
  }

  /** 라인 추적 방식: 이 방식은 추적 방식이지만, 이동 방식이 특정 방향을 빠르게 가는 식으로 진행합니다.
   * 시간이 지나면 더 빠른 속도로 방향 전환을 하며, 나중엔 반드시 적에게 강제 타격됩니다. */
  processChaseLine () {
    if (!this.isLineChase) return
    if (this.targetObject == null) return
    const frame = this.chaseFrame
    const condition = (frame >= 0 && frame < 60 && frame % 60 === 0)
      || (frame >= 60 && frame < 120 && frame % 30 === 0)
      || (frame >= 120 && frame < 180 && frame % 15 === 0)
      || (frame >= 180 && frame < 240 && frame % 10 === 0)

    this.chaseFrame++ // 조건을 먼저 계산한 다음, 프레임을 증가시켜야 계산 오차가 방지될 수 있음. (0부터 처리해야 하므로)
    if (!condition) return

    const target = this.targetObject
    const directionX = target.moveDirectionX === FieldData.direction.RIGHT ? 1 : -1
    const directionY = target.moveDirectionY === FieldData.direction.DOWN ? 1 : -1
    const predictedX = (target.centerX - this.centerX) + (target.moveSpeedX * directionX * 10)
    const predictedY = (target.centerY - this.centerY) + (target.moveSpeedY * directionY * 10)
    const minSpeed = this.lineChaseMinSpeed * (1 + Math.round(frame / 60))
    let speedX = (predictedX) / 40
    let speedY = (predictedY) / 40

    /** 두 축의 속도가 모두 최소 속도 미만이면 이동 속도를 보정합니다.  
     * 두 축 중 절댓값이 큰 속도를 최소 속도에 맞추고, 동일한 배율을 두 축에 적용하여 이동 방향의 비율을 유지합니다.
     *
     * 각 축을 개별적으로 보정하면 이동 방향이 달라질 수 있으므로, 두 축을 함께 보정합니다.
     * 이를 통해 추적 속도가 지나치게 느려지는 현상을 방지하며,
     * 두 축의 속도 차이가 클 때 작은 쪽까지 무리하게 최소 속도로 올리는 현상을 방지합니다. */
    if (Math.abs(speedX) < minSpeed && Math.abs(speedY) < minSpeed) {
      let mul = Math.abs(speedX) < Math.abs(speedY) ? minSpeed / Math.abs(speedY) : minSpeed / Math.abs(speedX)
      speedX *= mul
      speedY *= mul
    }

    this.setMoveSpeed(speedX, speedY)
  }
}

class Multyshot extends WeaponData {
  constructor () {
    super()
    this.moveSpeedX = 20
    // imageData 설정은 setOption에서 진행합니다!
  }

  setOption (number = 0) {
    switch (number) {
      // front
      case 0: this.moveSpeedY = 0;  this.isLineChase = false; break
      case 1: this.moveSpeedY = 0;  this.isLineChase = false; break

      // sidewave
      case 2: this.moveSpeedY = -3; this.isLineChase = false; break
      case 3: this.moveSpeedY = 3;  this.isLineChase = false; break

      // chase
      case 4: this.moveSpeedY = 0;  this.isLineChase = true;  break
      case 5: this.moveSpeedY = 0;  this.isLineChase = true;  break
    }

    // 컬러 번호에 따른 무기 이미지 변경
    let colorNumber = 0
    if (number >= 2 && number <= 3) colorNumber = 1
    else if (number >= 4 && number <= 5) colorNumber = 2

    if (this.isLineChase) colorNumber = 2
    else if (this.moveSpeedY != 0) colorNumber = 1

    const imageDataList = [
      imageDataInfo.weapon.multyshotNormal,
      imageDataInfo.weapon.multyshotGreen,
      imageDataInfo.weapon.multyshotBlue
    ]

    this.setAutoImageData(imageSrc.weapon.weapon, imageDataList[colorNumber])
  }
}

class MissleData extends WeaponData {
  static STATE_ROCKET = 3
  static TYPE_MISSILE = 44
  static TYPE_ROCKET = 45

  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.missile, 5)
    this.moveSpeedX = 12
    this.state = WeaponData.STATE_NORMAL
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.missile, this.getSplashArea().width, this.getSplashArea().height)
  }

  setOption (number = 0) {
    if (number === -1) {
      this.subType = MissleData.TYPE_MISSILE
    } else {
      this.subType = MissleData.TYPE_ROCKET
      this.moveSpeedY = number === 0 ? 2 : -2
      this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.missileRocket)
      this.moveSpeedX = 24
    }
  }

  afterInit () {
    // 참고: 미사일의 추적 여부는 생성 직후, afterInitDefault에 의해 다시 덮어씌워지므로
    // 초기화 함수에서 할당 해야 값이 반영됩니다.
    if (this.subType === MissleData.TYPE_ROCKET) {
      this.isChase = false // 추적 없음
      this.isSplash = true // 스플래시 공격 상태로 바로 설정
    }
  }

  processMove () {
    super.processMove()
    if (this.subType === MissleData.TYPE_ROCKET && this.state === WeaponData.STATE_SPLASH) {
      this.moveSpeedX = 4
      this.isChase = false
    }

    if (this.subType === MissleData.TYPE_ROCKET) {
      this.isChase = false
    }

    if (this.state === WeaponData.STATE_NORMAL) {
      if (this.enemyHitedCheck()) {
        this.setSplashAttack()
        this.moveSpeedX = 0
        this.moveSpeedY = 0
        this.isChase = false
      }
    }
  }

  getSplashArea () {
    if (this.subType === MissleData.TYPE_MISSILE) {
      return {
        x: this.x - 50,
        y: this.y - 50,
        width: 100,
        height: 100
      } 
    } else {
      return {
        x: this.x - 70,
        y: this.y - 70,
        width: 140,
        height: 140
      }
    }
  }

  display () {
    super.display()
    if (this.subType === MissleData.TYPE_MISSILE) {
      this.displayMissile()
    } else {
      this.displayRocket()
    }
  }

  displayMissile () {
    if (this.state === WeaponData.STATE_NORMAL) {
      if (this.enimation != null) {
        this.enimation.display(this.x, this.y)
      } else {
        super.display()
      }
    } else if (this.state === WeaponData.STATE_SPLASH) {
      // 스플래시 상태에서는 무기의 이미지가 출력되지 않습니다. 
    }
  }

  displayRocket () {
    if (this.enimation) {
      this.enimation.display(this.x, this.y)
    }
  }
}

/** 벽에 반사되는 무기에 대한 함수 정보 */
class ReflectWeaponData extends WeaponData {
  constructor () {
    super()
    this.reflectCount = 1
  }

  processMove () {
    super.processMove()
    this.processReflect()
  }

  processReflect () {
    if (this.reflectCount <= 0) return

    if (this.x < 0) {
      this.x = 1
      this.setMoveSpeed(Math.abs(this.moveSpeedX), this.moveSpeedY)
      this.reflectCount--
    } else if (this.x + this.width > graphicSystem.CANVAS_WIDTH) {
      this.x = graphicSystem.CANVAS_WIDTH - this.width - 1
      this.setMoveSpeed(-Math.abs(this.moveSpeedX), this.moveSpeedY)
      this.reflectCount--
    }

    if (this.y < 0) {
      this.y = 1
      this.setMoveSpeed(this.moveSpeedX, Math.abs(this.moveSpeedY))
      this.reflectCount--
    } else if (this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
      this.y = graphicSystem.CANVAS_HEIGHT - this.height - 1
      this.setMoveSpeed(this.moveSpeedX, -Math.abs(this.moveSpeedY))
      this.reflectCount--
    }
  }
}

class Arrow extends ReflectWeaponData {
  constructor () {
    super()
    this.moveSpeedX = 17
    this.reflectCount = 6
    this.color = 'brown'
  }

  setOption (number = 0) {
    this.moveSpeedY = number === 0 ? -5 : 5

    let imageDataList = [
      imageDataInfo.weapon.arrowGreen,
      imageDataInfo.weapon.arrowBrown
    ]
    let imageDataNumber = this.moveSpeedY >= 0 ? 0 : 1
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataList[imageDataNumber])
  }
}

class Laser extends WeaponData {
  static YELLOW = 445
  static BLUE = 446

  /** 레이저는 적을 관통하는 특징이 있습니다. */
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.laser)
    this.moveDirectionX = FieldData.direction.RIGHT
    this.setMoveSpeed(20, 0)
  }

  setOption (number = 0) {
    number = 1
    if (number === 1) {
      this.subType = Laser.BLUE
    }
  }

  afterInit () {
    if (this.subType === Laser.BLUE) {
      this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.laserBlue)
      this.moveSpeedX = 0
      this.targetY = 0
      this.isChase = true
      this.chaseMissLimit = 1
    }
  }

  processMove () {
    super.processMove()
    if (this.subType === Laser.BLUE) {
      this.processMoveBlue()
    }
  }

  processMoveBlue () {
    if (!this.isChase && this.moveSpeedX === 0 && this.moveSpeedY === 0) {
      this.setMoveSpeed(20, 0)
    }
  }

  processChaseEnemy () {
    const laserHalfSize = this.height / 2

    if (this.centerY + laserHalfSize < this.targetObject.centerY) {
      this.moveDirectionY = FieldData.direction.DOWN
      this.moveSpeedY = 32
    } else if (this.centerY - laserHalfSize > this.targetObject.centerY) {
      this.moveDirectionY = FieldData.direction.UP
      this.moveSpeedY = 32
    } else {
      // 적이 있는 위치에 이동했다면 추적 종료
      // 그 후, 적의 x축 위치에 따라 어느 방향으로 이동할건지 결정
      this.isChase = false
      this.setMoveSpeed(20, 0)

      if (this.centerX < this.targetObject.centerX) {
        this.moveDirectionX = FieldData.direction.RIGHT
      } else {
        this.moveDirectionX = FieldData.direction.LEFT
      }
    }
  }
}

class Sapia extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.sapia)
  }

  processMove () {
    if (this.targetObject) {
      this.x = this.targetObject.centerX
      this.y = this.targetObject.centerY
    } else {
      this.x = fieldState.getPlayerObject().x + 200
      this.y = fieldState.getPlayerObject().y
    }
  }

  /**
   * 사피아는, chase방식이 다른 무기와는 완전히 다릅니다.
   * 먼저, 영역을 설정하고, 영역 내에 적이 있는지 살펴봅니다.
   */
  processChase () {

    // chaseType이 아닐경우, 함수 강제 종료
    if (!this.isChase) return

    // targetObject가 null이 아닐 경우, 정상적으로 적을 추적
    if (this.targetObject != null) {
      // 중간에 적이 죽었거나 삭제되었는지를 확인
      if (this.targetObject.isDeleted || this.targetObject.isDied) {
        this.targetObject = null
      }
    } else {
      // targetObject가 없다면, 새로운 적을 찾음
      const enemyObject = fieldState.getEnemyObject()
      if (enemyObject.length <= 0) return
      
      // 멘헤튼 거리 방식이므로, 생각보다 세로 방향, 대각선 방향의 적을 잘 못찾을 수도 있습니다.
      // 그러나 유클리드 공식을 사용할 생각은 없습니다.
      const MIN_DISTANCE = 400
      let minDistance = MIN_DISTANCE // 최소거리 기본값 (이 값이 없으면 다른값과 비교할 수 없어 대상을 추적할 수 없음)
      let targetNumber = -1
      for (let i = 0; i < enemyObject.length; i++) {
        let enemy = enemyObject[i]
        let distance = Math.abs(this.x - enemy.x) + Math.abs(this.y - enemy.y)

        if (distance < minDistance && distance <= MIN_DISTANCE) {
          minDistance = distance
          targetNumber = i
        }
      }

      // 타겟번호를 못찾으면 무효
      if (targetNumber < 0) return

      this.targetObject = enemyObject[targetNumber]
    }
  }

  display () {
    graphicSystem.fillLine(fieldState.getPlayerObject().x, fieldState.getPlayerObject().y, this.x, this.y, 'blue')
    super.display()
  }
}

class Parapo extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.parapo)
    this.setMoveSpeed(8, 0)
    this.hitEnemyCenterPosition = {x: 0, y: 0}
  }

  createSubWeapon () {
    /*
    * 적이랑 충돌했을 때, 충격파 추가로 발사
    * 충격파는, 적의 중심 위치를 기준으로 4개의 방향으로 타격합니다.
    * 파라보 자체의 데미지는 없음. (공격력만 있고, 충격파로 데미지를 줌)
    * 좌표값 상세 [참고: c -> enemy center]
    * left: (cx - 100, cy - 50), right: (cx, cy - 50)
    * up: (cx - 50, cy - 100), down: (cx - 50, cy)
    */
    const enemyCenterX = this.hitEnemyCenterPosition.x
    const enemyCenterY = this.hitEnemyCenterPosition.y
    const shockWaveSize = 100
    const shockWaveSizeHalf = shockWaveSize / 2
    fieldState.createWeaponObject(ID.weapon.parapoSub, enemyCenterX - shockWaveSize, enemyCenterY - shockWaveSizeHalf, this.attack, 0)
    fieldState.createWeaponObject(ID.weapon.parapoSub, enemyCenterX, enemyCenterY - shockWaveSizeHalf, this.attack, 1)
    fieldState.createWeaponObject(ID.weapon.parapoSub, enemyCenterX - shockWaveSizeHalf, enemyCenterY - shockWaveSize, this.attack, 2)
    fieldState.createWeaponObject(ID.weapon.parapoSub, enemyCenterX - shockWaveSizeHalf, enemyCenterY, this.attack, 3)
    this.repeatCount--
  }

  processAttack () {
    // 타격당한 적 1개체를 가져온 후, 값이 있다면 서브 무기 생성 로직을 실행시킵니다.
    const hitEnemyList = this.getEnemyHitObject(undefined, 1)
    if (hitEnemyList) {
      this.hitEnemyCenterPosition.x = hitEnemyList[0].centerX
      this.hitEnemyCenterPosition.y = hitEnemyList[0].centerY
      this.createSubWeapon()
    }
  }
}

class ParapoSub extends Parapo {
  constructor () {
    super()
    this.subType = 0
    this.width = 100
    this.height = 100
    this.moveSpeedX = 0
    this.moveSpeedY = 0
    this.parapoEffect = null
  }

  setOption (number = 0) {
    const src = imageSrc.weapon.weaponEffect
    const imgD = imageDataInfo.weaponEffect

    switch (number) {
      case 0: // left
        this.parapoEffect = new CustomEffect(src, imgD.parapoLeft, 100, 100, 1)
        break
      case 1: 
        this.parapoEffect = new CustomEffect(src, imgD.parapoRight, 100, 100, 1)
        break
      case 2:
        this.parapoEffect = new CustomEffect(src, imgD.parapoUp, 100, 100, 1)
        break
      case 3:
        this.parapoEffect = new CustomEffect(src, imgD.parapoDown, 100, 100, 1)
        break
    }
  }

  processAttack () {
    this.repeatCount--
    this.processHitObject()
    if (this.parapoEffect) {
      fieldState.createEffectObject(this.parapoEffect, this.x, this.y)
    }
  }

  display () {
    // 아무것도 보여주지 않음.
  }
}

class Blaster extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.blaster)
    this.setMoveSpeed(24, 0)
  }

  setOption (number = 0) {
    if (number === 1) {
      this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.blasterMini)
      this.subType = 1
      this.isLineChase = true
      this.isChase = true
    }
  }
}

class Sidewave extends WeaponData {
  /**
   * 옵션은 다음과 같이 전달받습니다. ('right 4')
   * 0. direction = 'right', moveSpeedY = 0, 
   */
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.sidewave)
    this.moveSpeedX = 11
  }

  setOption (number = 0) {
    this.option = ['right 4', 'right 3', 'right 2', 'right -2', 'right -3', 'right -4', 'left 3', 'left -3']

    switch (number) {
      case 0: this.moveSpeedY = 4;  /* right, flip 없음 */ break
      case 1: this.moveSpeedY = 3;  /* right */ break
      case 2: this.moveSpeedY = 2;  /* right */ break
      case 3: this.moveSpeedY = -2; /* right */ break
      case 4: this.moveSpeedY = -3; /* right */ break
      case 5: this.moveSpeedY = -4; /* right */ break
      case 6: this.moveSpeedY = 3;  break // left
      case 7: this.moveSpeedY = -3; break // left
    }

    if (number >= 6 && number <= 7 && this.enimation) {
      // 좌우 반전 (왼쪽으로 무기가 이동하므로)
      this.enimation.flip = 1; this.moveDirectionX = Sidewave.direction.LEFT
    }
  }
}

class Rapid extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.rapid)
    this.setMoveSpeed(40, 0)
  }
}

class Ring extends WeaponData {
  static ringDirectionList = ['up', 'down', 'left', 'leftdown', 'leftup', 'right', 'rightdown', 'rightup']

  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.ring)

    // 링도 arrow랑 비슷하게 벽튕기기 효과가 있지만 1번만 튕겨집니다. (차별화를 위해서...)
    this.bounceCount = 0
    this.bounceMaxCount = 1
  }

  setOption (number = 0) {
    if (number >= 0 && number < Ring.ringDirectionList.length) {
      this.setRingDirection(Ring.ringDirectionList[number], 16)
    }
  }

  /** 링의 이동방향 및 속도 설정 */
  setRingDirection (ringDirection = '', baseSpeed = 0) {
    switch (ringDirection) {
      case 'left':
        this.setMoveSpeed(baseSpeed, 0)
        this.setMoveDirection(FieldData.direction.LEFT, FieldData.direction.NODATA)
        break
      case 'leftup':
        this.setMoveSpeed(baseSpeed, baseSpeed)
        this.setMoveDirection(FieldData.direction.LEFT, FieldData.direction.UP)
        break
      case 'leftdown':
        this.setMoveSpeed(baseSpeed, baseSpeed)
        this.setMoveDirection(FieldData.direction.LEFT, FieldData.direction.DOWN)
        break
      case 'up':
        this.setMoveSpeed(0, baseSpeed)
        this.setMoveDirection(FieldData.direction.NODATA, FieldData.direction.UP)
        break
      case 'down':
        this.setMoveSpeed(0, baseSpeed)
        this.setMoveDirection(FieldData.direction.NODATA, FieldData.direction.DOWN)
        break
      case 'rightup':
        this.setMoveSpeed(baseSpeed, baseSpeed)
        this.setMoveDirection(FieldData.direction.RIGHT, FieldData.direction.UP)
        break
      case 'rightdown':
        this.setMoveSpeed(baseSpeed, baseSpeed)
        this.setMoveDirection(FieldData.direction.RIGHT, FieldData.direction.DOWN)
        break
      case 'right':
      default:
        this.setMoveSpeed(baseSpeed, 0)
        this.setMoveDirection(FieldData.direction.RIGHT, FieldData.direction.NODATA)
    }
  }

  processMove () {
    // 링은 arrow처럼 벽튕기기 기능이 있지만, 이것은 딜 누수 방지용일뿐임.
    // 그래서 arrow랑 다르게 튕겨지는 횟수가 적고, 다 튕겨져도 사라지지 않고 이동만 함.
    // 참고로 arrow는 speed를 조절했지만, 
    // ring은 방향 버그 때문에 일부 무기가 튕겨지지 않아, direction으로 방향 변경을 합니다.
    if (this.bounceCount < this.bounceMaxCount) {
      if (this.x < 0) {
        this.x = 0
        this.moveDirectionX = FieldData.direction.RIGHT
        this.bounceCount++
      } else if (this.x > graphicSystem.CANVAS_WIDTH) {
        this.x = graphicSystem.CANVAS_WIDTH
        this.moveDirectionX = FieldData.direction.LEFT
        this.bounceCount++
      }
  
      if (this.y < 0) {
        this.y = 0
        this.moveDirectionY = FieldData.direction.DOWN
        this.bounceCount++
      } else if (this.y > graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT
        this.moveDirectionY = FieldData.direction.UP
        this.bounceCount++
      }
    }

    super.processMove()
  }
}

class Seondanil extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.seondanil)
    this.moveDelay = new DelayData(20) // 발사 대기 시간
    this.setMoveSpeed(0, 0)
  }

  processMove () {
    // moveDelay의 count를 채우면 이 무기는 이동합니다.
    if (this.moveDelay.check(false, true)) {
      if (this.moveSpeedX === 0 && this.moveSpeedY === 0) {
        this.isLineChase = true
        this.lineChaseMinSpeed = 25
      }

      // 이동 함수가 여기서 실행되므로, moveDelay가 어느정도 넘어가야만 이동이 가능합니다.
      super.processMove()
    }
  }

  processAttack () {
    // 생성되고 일정 프레임 이후에 적을 추적하여 바로 공격합니다.
    if (this.moveDelay.check(false, true)) {
      super.processAttack()
    }
  }
}

class Boomerang extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.boomerang)
    this.moveSpeedY = 2 - (Math.random() * 4)
    this.BASE_SPEED = 0.1
    this.moveLength = 0
  }

  processMove () {
    // 부메랑은 천천히 가속하면서 앞으로 가다가, 뒤로 급격히 후진합니다.
    if (this.elapsedFrame <= 30) {
      this.moveSpeedX += this.BASE_SPEED
    } else if (this.elapsedFrame <= 60) {
      this.moveSpeedX += this.BASE_SPEED * 3
    }

    this.degree += 6
    this.moveLength += this.moveSpeedX
    super.processMove()

    if (this.moveLength >= 600) {
      this.moveSpeedX -= this.BASE_SPEED * 4
    }
  }
}

class Kalnal extends ReflectWeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.kalnal)
    this.reflectCount = 2
    this.isLineChase = true
  }

  processMove () {
    super.processMove()
    this.degree += 45
  }
}

class Cogwheel extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.cogwheel)
    this.setMoveSpeed(9, 0)
  }

  processMove () {
    super.processMove()

    let hit = this.getEnemyHitObject()
    if (hit != null && hit.length >= 1) {
      this.setMoveSpeed(2, 0)
      this.degree += 10
    } else {
      this.setMoveSpeed(9, 0)
      this.degree += 2
    }
  }
}

class Yeonsai extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.yeonsai)
  }

  setOption (number = 0) {
    let speedX = number < 3 ? -20 : 20
    let speedY = Math.floor(Math.random() * 4) - 2
    this.setMoveSpeed(speedX, speedY)
  }
}

class Sabangtan extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.sabangtan)
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.sabangtan, this.getSplashArea().width, this.getSplashArea().height)
  }

  setOption (number = 0) {
    const speedX = 2
    const speedY = 6

    switch (number) {
      case 0: this.setMoveSpeed(-speedX, -speedY); break
      case 1: this.setMoveSpeed(-speedX, speedY); break
      case 2: this.setMoveSpeed(speedX, -speedY); break
      case 3: this.setMoveSpeed(speedX, speedY); break
    }
  }

  processMove () {
    super.processMove()
    this.degree += 3

    if (this.enemyHitedCheck() || this.outAreaCheck(0)) {
      this.state = WeaponData.STATE_SPLASH
    }
  }

  getSplashArea () {
    return {
      x: this.x - 90,
      y: this.y - 90,
      width: 180,
      height: 180
    }
  }
}

class R3TowerPink extends WeaponData {
  // 이 무기는 Round3 에서 사용하는 무기와 거의 동일함 (이미지만 약간 다름)
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.r3TowerPink, 4)
    this.setMoveSpeed(10, 0)
  }

  afterInit () {
    /** 적 추적 시작을 위한 함수 (참고: 생성자에서는 현재 좌표값이 0이라 현재위치에서 시작하지 않을 수 있음) */
    let enemy = fieldState.getRandomEnemyObject()
    if (enemy != null) {
      this.setMoveSpeedChaseLine(enemy.centerX, enemy.centerY, 50, 6)
    }
  }
}

class R3TowerPurple extends WeaponData {
  static STATE_FRONT = 2
  static STATE_CHASE = 3

  // 이 무기는 Round3 에서 사용하는 무기와 거의 동일함 (이미지만 약간 다름)
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.r3TowerPurple, 4)
    this.state = R3TowerPurple.STATE_FRONT
    this.setMoveSpeed(10, 0)
  }

  processMove () {
    super.processMove()
    if (this.state === R3TowerPurple.STATE_FRONT && this.x > graphicSystem.CANVAS_WIDTH) {
      this.state = R3TowerPurple.STATE_CHASE
      let randomEnemy = fieldState.getRandomEnemyObject()
      if (randomEnemy != null) {
        this.setMoveSpeedChaseLine(randomEnemy.centerX, randomEnemy.centerY, 20, 10)
      }
    }
  }
}

class R3Helljeon extends WeaponData {
  constructor () {
    super()
    this.TYPE_CHASE = 44
    this.TYPE_NORMAL = 45
    this.ANGLE_SPEED = 10
    this.BASE_SPEED = 11
    this.setMoveSpeed(this.BASE_SPEED, 0)
    this.saveList = {
      type: this.TYPE_NORMAL,
      angleDegree: 0,
      isAngleMove: false,
      targetSpeedX: this.moveSpeedX,
      targetSpeedY: this.moveSpeedY,
    }
  }

  setOption (number = 0) {
    // 옵션: 0번을 선택하면 노멀타입, 1번을 선택하면 체이스 타입
    // 지정된 옵션에 따라 무기 타입 결정
    const currentType = number === 0 ? this.TYPE_NORMAL : this.TYPE_CHASE
    
    // 하위 호환 코드
    this.saveList.type = currentType

    // 이미지 설정
    if (currentType === this.TYPE_NORMAL) {
      this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.r3TowerHelljeonNormal)
    } else {
      this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.r3TowerHelljeonChase)
    }
  }

  processState () {
    this.processHelljeonTypeChase()
  }

  processHelljeonTypeChase () {
    if (this.saveList.type !== this.TYPE_CHASE) return

    // 15프레임부터 적을 추적 시작함
    if (this.elapsedFrame === 15) this.isChase = true

    // 실시간 각도 변경
    this.processChangeAngle()

    // 목표하는 오브젝트가 없다면, 속도와 각도를 특정값으로 되돌림 (서서히)
    if (this.targetObject == null) this.processMoveNonTarget()
  }

  processChaseEnemy () {
    // 이 함수를 상속받아서 구현하는 이유는, 추적 무기의 기본 이동방식과 다른 방식으로 이동시키기 위해서
    // 아니면, 이 함수의 코드를 공백으로 만들고, 다른 함수로 추가하는 방법도 있지만, 그건 사용하지 않음
    if (this.targetObject instanceof FieldData) {
      this.saveList.isAngleMove = true
      const distanceSpeedX = (this.targetObject.x - this.x)
      const distanceSpeedY = (this.targetObject.y - this.y)
      if (this.saveList.targetSpeedX < distanceSpeedX) {
        this.saveList.targetSpeedX++
      } else {
        this.saveList.targetSpeedX--
      }

      if (this.saveList.targetSpeedY < distanceSpeedY) {
        this.saveList.targetSpeedY++
      } else {
        this.saveList.targetSpeedY--
      }

      this.setMoveSpeed(this.saveList.targetSpeedX, this.saveList.targetSpeedY)
    }
  }

  processMoveNonTarget () {
    // 목표하는 오브젝트가 없다면, 속도와 각도를 특정값으로 되돌림
    // X축 강제 보정
    if (this.saveList.targetSpeedX < this.BASE_SPEED - 1) {
      this.saveList.targetSpeedX++
    } else if (this.saveList.targetSpeedX > this.BASE_SPEED + 1) {
      this.saveList.targetSpeedX--
    } else {
      this.saveList.targetSpeedX = this.BASE_SPEED
    }

    // Y축 강제 보정
    if (this.saveList.targetSpeedY < -1) {
      this.saveList.targetSpeedY++
    } else if (this.saveList.targetSpeedY > 1) {
      this.saveList.targetSpeedY--
    } else {
      this.saveList.targetSpeedY = 0
    }

    this.setMoveSpeed(this.saveList.targetSpeedX, this.saveList.targetSpeedY)
  }

  processChangeAngle () {
    let targetAngle = 0

    // 추적하는 적이 존재할 때 무기의 이동하는 각도 조정
    if (this.targetObject instanceof FieldData) {
      const atangent = Math.atan2(this.moveSpeedY, this.moveSpeedX)
      targetAngle = atangent * (180 / Math.PI) // 각도 변경
    }

    // 각도를 한 방향으로 이동했을 때, 이동하는 각의 양만큼을 변수로 저장함
    const ALLANGLE = 360
    const distanceA = Math.abs(targetAngle - this.degree) // 목표값 - 현재값
    const distanceB = ALLANGLE - distanceA // 360도에선 distanceA를 남은 만큼 뺌 (A 아니면 B이므로)

    // 만약, 거리의 차이가 10보다 작으면, 강제로 해당 각도로 지정하고, 각도를 변화시키지 않음
    if (Math.min(distanceA, distanceB) < 10) {
      this.degree = targetAngle
    } else if (distanceA <= distanceB) {
      // distanceA가 최단거리일경우, 
      // 목표각도 - 현재각도가 양수인지 음수인지 살펴봄
      if (targetAngle - this.degree >= 0) {
        // 이 값이 양수라면, 각도는 증가하는 방향이 됨
        this.degree += this.ANGLE_SPEED
      } else {
        // 이 값이 음수라면, 각도는 감소하는 방향이 됨
        this.degree -= this.ANGLE_SPEED
      }
    } else if (distanceA > distanceB) {
      // distanceB가 최단거리일경우,
      // 목표각도 - 현재각도가 양수라면, 각도는 감소하는 방향이 됨
      if (targetAngle - this.degree >= 0) {
        this.degree -= this.ANGLE_SPEED
      } else {
        // 이 값이 음수라면, 각도는 증가하는 방향이 됨
        this.degree += this.ANGLE_SPEED
      }
    }

    // 만약 각도가 기준값을 초과하거나 음수일경우, 이 값을 보정함
    if (this.degree < 0) this.degree += ALLANGLE
    if (this.degree > ALLANGLE) this.degree -= ALLANGLE
  }
}

class SkillMultyshot extends WeaponData {
  constructor () {
    // 기본적으로 skillMultyshot은 적을 추적함. 다만 그외의 다른 특징 없음
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.multyshot)
  }
}

class SkillMissile extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.missile, 1)
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillMissile)
    this.splashEffect.setWidthHeight(this.getSplashArea().width, this.getSplashArea().height)
    this.isSplashSoundPlayed = false
  }

  getSplashArea () {
    return {
      x: this.x - 100,
      y: this.y - 100,
      width: 200,
      height: 200
    }
  }

  processMove () {
    super.processMove()
    if (this.enemyHitedCheck()) {
      this.setSplashAttack()
      this.moveSpeedX = 0
      this.moveSpeedY = 0
      this.isChase = false
    }
  }

  processAttack () {
    super.processAttack()

    // 스킬 미사일은 적을 타격한 순간 단 1번 폭발음을 재생한다.
    if (this.state === WeaponData.STATE_SPLASH && !this.isSplashSoundPlayed) {
      soundSystem.play(soundSrc.skill.skillMissileHit)
      this.isSplashSoundPlayed = true
    }
  }
}

class SkillArrow extends Arrow {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.arrow, 3)
    this.color = 'purple'
    this.moveSpeedX = 16
    this.reflectCount = 12
  }

  setOption (number = 0) {
    this.moveSpeedY = number === 0 ? 7 : -7
  }
}

class SkillLaser extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.laser)
    this.moveSpeedX = 0
    this.moveSpeedY = 0
  }

  // 이 레이저는 왼쪽에서 나온다음, x축이 0위치로 고정되고, y축은 플레이어를 따라다닙니다.
  processMove () {
    if (this.elapsedFrame <= 10) {
      this.x = -this.width + (this.width / 10 * this.elapsedFrame)
    } else {
      this.x = 0
    }

    this.y = fieldState.getPlayerObject().centerY - (this.height / 2)
  }

  processAttack () {
    // 4프레임당 한번만 공격함. 따라서 반복 대기시간이 넘어가지 않는다면, 함수 강제 종료.
    // 참고로 레이저가 화면 안으로 이동되는 동안은 타격판정 없음.
    if (this.elapsedFrame <= 10) return
    if (!this.repeatDelay.check()) return

    this.processHitObject()
  }

  display () {
    // 레이저 사라지는 효과 구현을 위해서, 알파값 변경
    // 서서히 사라지게 하는 공식? 난 모르므로, 노가다로 작성한다. (... 이게 무슨)
    const alpha = [0, 0.1, 0.11, 0.14, 0.17, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.5, 0.5]
    if (this.repeatCount < alpha.length && this.repeatCount >= 0) {
      graphicSystem.setAlpha(alpha[this.repeatCount]) // 투명값 설정
    } else {
      graphicSystem.setAlpha(0.5)
    }
    super.display()
    graphicSystem.setAlpha(1) // 투명값 해제
  }
}

class SkillSapia extends Sapia {
  constructor () {
    super()
    this.callCount = 0

    let rect = imageDataInfo.skill.sapiaRect
    let circle = imageDataInfo.skill.sapiaCircle
    this.enimationSapiaRect = new EnimationData(imageSrc.weapon.skill, rect.x, rect.y, rect.width, rect.height, rect.frame, 4, -1)
    this.enimationSapiaCircle = new EnimationData(imageSrc.weapon.skill, circle.x, circle.y, circle.width, circle.height, circle.frame, 4, -1)
  }
  
  afterInit () {
    this.setSplashAttack()
  }

  /**
   * 사피아와 스킬사피아는 추적 방식이 다름
   */
  processChase () {
    // chaseType이 아닐경우, 함수 강제 종료
    if (!this.isChase) return

    // targetObject가 null이 아닐 경우, 정상적으로 적을 추적
    if (this.targetObject != null) {
      // 중간에 적이 죽었거나 삭제되었는지를 확인
      if (this.targetObject.isDeleted || this.targetObject.isDied) {
        this.targetObject = null
      }
    } else {
      // targetObject가 없다면, 새로운 적을 찾음
      const enemyObject = fieldState.getRandomEnemyObject()
      if (enemyObject == null) return
      
      this.targetObject = enemyObject
    }
  }

  /**
   * 감지 범위 얻기
   */
  getDetectArea () {
    return {
      x: this.x - 600,
      y: this.y - 300,
      width: 1200,
      height: 600
    }
  }

  processEnimation () {
    if (this.enimationSapiaRect && this.enimationSapiaCircle) {
      this.enimationSapiaRect.process()
      this.enimationSapiaCircle.process()
    }
  }

  display () {
    // 사피아 스킬은, 2종류의 에니메이션을 동시에 출력합니다.
    // 그래봤자, 네모와 동그라미를 동시에 출력하는게 전부입니다.
    if (this.enimationSapiaRect && this.enimationSapiaCircle) {
      this.enimationSapiaRect.display(this.x, this.y)
      this.enimationSapiaCircle.display(this.x, this.y)
    }
  }
}

class SkillParapo extends Parapo {
  static STATE_NORMAL = 1
  static STATE_SHOCKWAVE = 2

  constructor () {
    super()
    // 참고: 파라포는 스킬 이미지가 없고, 이펙트만 있습니다.
    // 따라서 객체의 크기를 이펙트 크기로 얻어옵니다.
    this.width = imageDataInfo.weaponEffect.skillParapo.width
    this.height = imageDataInfo.weaponEffect.skillParapo.height
    this.moveSpeedX = 4
    this.moveSpeedY = 0
    this.state = SkillParapo.STATE_NORMAL

    this.parapoEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillParapo, this.width, this.height, 1)
  }

  processMove () {
    if (this.targetObject) {
      this.x = this.targetObject.x + (this.targetObject.width / 2)
      this.y = this.targetObject.y + (this.targetObject.height / 2)
    }
  }

  processAttack () {
    // 파라포스킬은 무기가 적에게 닿았다면 충격파 공격을 시도합니다.
    // 기존 파라포 무기는 이 역할이 나뉘어져있으나, 파라포 스킬은 미사일처럼 충격파와 일반 공격 기능이 합쳐져 있습니다.
    // 다만 추적중인 적이 있고, 그 추적중인 적이랑 충돌했다면 즉시 충격파를 발사합니다.

    if (this.state === SkillParapo.STATE_NORMAL) {
      this.processAttackNormal()
    } else if (this.state === SkillParapo.STATE_SHOCKWAVE) {
      this.processAttackShockwave()
    }
  }

  processAttackNormal () {
    if (this.enemyHitedCheck()) {
      this.state = SkillParapo.STATE_SHOCKWAVE
    }
  }

  processAttackShockwave () {
    // 적 객체 얻어오기
    soundSystem.play(soundSrc.skill.skillParapoHit) // 타격 사운드

    // 충격파 범위
    const shockwaveArea = {
      x: this.x - (this.width / 2),
      y: this.y - (this.height / 2),
      width: this.width,
      height: this.height
    }

    if (!this.targetObject) {
      shockwaveArea.x = this.x
      shockwaveArea.y = this.y
      shockwaveArea.width = 120
      shockwaveArea.height = 120
    }

    // 충격파 이펙트
    fieldState.createEffectObject(this.parapoEffect, shockwaveArea.x, shockwaveArea.y)
    this.processHitObject(shockwaveArea) // 적 충돌 처리
  }

  display () {
    // 아무것도 안보임
  }
}

class SkillBlaster extends Blaster {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.blaster)
    this.moveSpeedX = 32

    // 희한하게도, 이 무기는 직선에서 약간 벗어나있음.
    this.moveSpeedY = -0.2 + Math.random() * 0.4
  }

  display () {
    this.defaultDisplay()
  }
}

class SkillSidewave extends Sidewave {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.sidewave)
    this.moveSpeedX = 22
    this.moveSpeedY = 7
  }

  setOption (number = 0) {
    switch (number) {
      case 0: this.moveSpeedY = -7; break
      case 1: this.moveSpeedY = 0; break
      case 2: this.moveSpeedY = 7; break
    }
  }
}

class SkillSword extends WeaponData {
  static STATE_MOVE = 2
  static STATE_ATTACK = 3

  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.sword)
    this.state = SkillSword.STATE_MOVE
    this.moveDelay = new DelayData(60)
    this.soundDelay = new DelayData(6)
    this.moveSpeedX = 2

    let moveSword = imageDataInfo.skill.swordMove
    this.moveEnimation = new EnimationData(imageSrc.weapon.skill, moveSword.x, moveSword.y, moveSword.width, moveSword.height, moveSword.frame, 1, -1)
  }

  processChase () {
    // 생략 (추적 방식이 표준 추적 무기와 조금 다름)
    // 타입은 추적이 맞지만, 이 함수는 사용하지 않습니다.
  }

  processAttack () {
    if (this.state === SkillSword.STATE_ATTACK) {
      this.soundDelay.check(false) // 사운드 딜레이 카운트 증가
      if (this.targetObject != null) { // 타격할 수 있는 오브젝트가 있을 때만 에니메이션 재생
        this.moveEnimation.process()
      } else {
        this.moveEnimation.reset() // 에니메이션 재설정
        this.moveEnimation.elapsedFrame = 3 // 현재 프레임을 3으로 고정시킴(가운데에 있는 상태 그대로)
      }

      if (this.repeatDelay.check()) {
        this.targetObject = fieldState.getRandomEnemyObject()
        if (this.targetObject == null) return

        this.x = this.targetObject.centerX
        this.y = this.targetObject.centerY

        // 타겟이 잡힌 적은 일단 데미지를 무조건 받음
        this.processHitObject()
        if (this.soundDelay.check()) { // 사운드의 원할한 출력을 위해, 사운드 딜레이를 따로 계산
          soundSystem.play(soundSrc.skill.skillSwordHit)
        }        

        // 타겟당한 적을 기준으로 이펙트 생성
        let hitEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSwordHit, this.targetObject.width, this.targetObject.height)
        fieldState.createEffectObject(hitEffect, this.targetObject.x, this.targetObject.y)
      }
    }
  }

  processMove () {
    if (this.state === SkillSword.STATE_MOVE) {
      if (this.moveDelay.check()) {
        this.state = SkillSword.STATE_ATTACK
      }
    }

    super.processMove()
  }

  display () {
    if (this.state === SkillSword.STATE_MOVE) {
      super.display()
    } else {
      this.moveEnimation.display(this.x, this.y)
    }
  }
}

class SkillHyperBall extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.hyperBall)
    this.maxHitCount = 6
    this.isLineChase = true
    this.bounceCount = 0
    this.bounceMaxCount = 6
  }

  processMove () {
    // 이동 방식만 다르므로, processMove 함수만 수정합니다. (나머지 부분은 multyshot과 동일)
    // 한번 튕길 때마다 새로운 적을 다시 추적합니다.
    if (this.exitAreaCheck()) {
      this.bounceCount++
      this.targetObject = null // 새 적을 추적하려면, 타겟 오브젝트를 제거해야 합니다.
      this.isLineChase = true
    }

    // 이동 처리
    super.processMove()

    // 바운스 횟수가 바운스 최대 횟수 초과이라면 해당 무기는 삭제됩니다.
    // 다만, 로직 처리상 즉시 삭제는 안되고, 프로세스가 모두 끝나야 삭제할 수 있습니다.
    if (this.bounceCount > this.bounceMaxCount) {
      this.isDeleted = true
    }
  }
}

class SkillCriticalChaser extends WeaponData {
  static STATE_CHASE = 2
  static STATE_NORMAL = 1
  static STATE_SPLASH = 4

  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.criticalChaser)
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillCriticalChaser)
    this.moveDelay = new DelayData(60)
    this.state = SkillCriticalChaser.STATE_NORMAL
  }

  processMove () {
    if (this.state === SkillCriticalChaser.STATE_NORMAL && this.moveDelay.check()) {
      this.state = SkillCriticalChaser.STATE_CHASE
      this.isLineChase = true
    }

    super.processMove()
  }

  getSplashArea () {
    return {
      x: this.x - 75,
      y: this.y - 75,
      width: 150,
      height: 150
    }
  }

  processAttack () {
    if (this.state === SkillCriticalChaser.STATE_CHASE) {
      if (this.enemyHitedCheck()) {
        this.state = SkillCriticalChaser.STATE_SPLASH
        soundSystem.play(soundSrc.skill.skillCriticalChaserHit)
        this.moveSpeedX = this.moveSpeedX / 20
        this.moveSpeedY = this.moveSpeedY / 20
      }
    }

    if (this.state === SkillCriticalChaser.STATE_SPLASH) {
      // 공격딜레이가 채워지지 않았다면 함수 종료
      if (!this.repeatDelay.check()) return
  
      const splashArea = this.getSplashArea()
      this.processHitObject(splashArea)
      this.splashEffect.width = splashArea.width
      this.splashEffect.height = splashArea.height
      fieldState.createEffectObject(this.splashEffect, splashArea.x, splashArea.y)
    }
  }

  display () {
    if (this.state === SkillCriticalChaser.STATE_NORMAL || this.state === SkillCriticalChaser.STATE_CHASE) {
      super.display()
    }
  }
}

class SkillPileBunker extends WeaponData {
  constructor () {
    super()
    this.mainType = 14
    this.subType = 24
    // no image and no enimation

    this.areaEffect = [
      new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillPileBunker1, 120, 80),
      new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillPileBunker2, 120, 80),
      new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillPileBunker3, 120, 80)
    ]

    this.effectDelay = new DelayData(6)

    this.isAttackDivision = false // 공격력이 제대로 나누어지기 위한 일종의 초기화 변수
  }

  processAttack () {
    if (!this.isAttackDivision) {
      // 각 영역당 공격력은 1/3 (33%)가 됩니다. (소수점 버림)
      this.attack = Math.floor(this.attack / 3)
      this.isAttackDivision = true
    }

    if (this.repeatDelay.check()) {
      this.repeatCount-- // repeatCount는 수동으로 감소시켜야 함.

      // 타격 범위
      this.area = [
        {x: this.x + 0  , y: this.y - 150, width: 300, height: 300}, // 0번째 구역
        {x: this.x + 150, y: this.y - 150, width: 300, height: 300}, // 1번째 구역
        {x: this.x + 300, y: this.y - 150, width: 300, height: 300}, // 2번째 구역
      ]

      let randomNumber = Math.random() * 100
      if (randomNumber < 50) {
        soundSystem.play(soundSrc.skill.skillPileBunkerHit2)
      } else {
        soundSystem.play(soundSrc.skill.skillPileBunkerHit3)
      }

      // 각 영역별로 데미지 처리
      for (let i = 0; i < this.area.length; i++) {        
        let hitObject = this.getEnemyHitObject(this.area[i], 4)

        if (hitObject == null) continue

        for (let j = 0; j < hitObject.length; j++) {
          this.damageProcess(hitObject[j])
        }
      }
      
      // 이펙트 출력
      for (let i = 0; i < this.area.length; i++) {
        let effectWidth = this.areaEffect[0].width
        let effectHeight = this.areaEffect[0].height
        for (let j = 0; j < 2; j++) {
          let randomX = this.area[i].x + Math.floor(Math.random() * (this.area[i].width - effectWidth))
          let randomY = this.area[i].y + Math.floor(Math.random() * (this.area[i].height - effectHeight))
          fieldState.createEffectObject(this.areaEffect[i], randomX, randomY)
        }
      }
    }
  }

}

class SkillSantansu extends WeaponData {
  static STATE_SANTANSU = 1
  static STATE_MOVE_UP = 2
  static STATE_ATTACK = 3

  static santansuEffectUp = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSantansuUp, 160, 160)
  static santansuEffectDown = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSantansuDown, 160, 160)
  static santansuEffectWater = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSantansuWater, 160, 160)

  constructor () {
    super()
    this.mainType = 1
    this.subType = 2
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.santansu)
    
    this.state = SkillSantansu.STATE_SANTANSU
  }

  setOption (number = 0) {
    let randomPositionNumber = number
    let finishXMin = 0 + (randomPositionNumber * 80)
    let finishXRange = 480
    this.finishX = Math.floor(Math.random() * finishXRange) + finishXMin

    // 산탄수는 무기 특성상 각 개체가 서로 스플래시 영역을 가지므로,
    // maxTarget을 지정된 개수보다 5배 낮춰야 합니다.
    // 그리고, 이 산탄수 무기는 maxTarget을 5배수로 설정해주세요.
    let stat = dataExportStatPlayerSkill.get(this.id)
    if (stat != null) {
      this.maxTarget = Math.floor(this.maxTarget / stat.shotCount)
    }

    // 최종지점 X축으로 10프레임동안 이동하도록 이동속도 조정
    this.moveSpeedX = (this.finishX - this.x) / 10
    this.moveSpeedY = (0 - this.y) / 10
  }

  processMove () {
    if (this.state === SkillSantansu.STATE_SANTANSU) {
      
    } else if (this.state === SkillSantansu.STATE_ATTACK) {
      // 공격 상태에서는 이동하지 않음.
      this.moveSpeedX = 0
      this.moveSpeedY = 0
    } else if (this.state === SkillSantansu.STATE_MOVE_UP) {
      // santansu 상태에서 적이랑 충돌하면 그 즉시 위로 이동
      this.moveSpeedX = 0
    }

    super.processMove()
  }

  processAttack () {
    if (this.state === SkillSantansu.STATE_MOVE_UP || this.state === SkillSantansu.STATE_SANTANSU) {
      // 화면 위까지 닿았을 때 공격 상태로 전환
      if (this.y <= 0) {
        soundSystem.play(soundSrc.skill.skillSantansuHit)
        fieldState.createEffectObject(SkillSantansu.santansuEffectUp, this.x, 0)
        this.y = 0
        this.state = SkillSantansu.STATE_ATTACK
        this.moveSpeedX = 0
        this.moveSpeedY = 0
      }
    }

    if (this.state === SkillSantansu.STATE_ATTACK) {
      // 공격 상태일 때 일정범위만큼 공격
      if (this.repeatDelay.check()) {
        let attackArea = {
          x: this.x,
          y: -100,
          width: 160,
          height: 800
        }

        this.processHitObject(attackArea)
        fieldState.createEffectObject(SkillSantansu.santansuEffectUp, this.x, 0)
        fieldState.createEffectObject(SkillSantansu.santansuEffectDown, this.x, 0)
        fieldState.createEffectObject(SkillSantansu.santansuEffectDown, this.x, 160)
        fieldState.createEffectObject(SkillSantansu.santansuEffectDown, this.x, 320)
        fieldState.createEffectObject(SkillSantansu.santansuEffectDown, this.x, 480)
        fieldState.createEffectObject(SkillSantansu.santansuEffectDown, this.x, 640)
        fieldState.createEffectObject(SkillSantansu.santansuEffectWater, this.x, 0)
        fieldState.createEffectObject(SkillSantansu.santansuEffectWater, this.x, 160)
        fieldState.createEffectObject(SkillSantansu.santansuEffectWater, this.x, 320)
        fieldState.createEffectObject(SkillSantansu.santansuEffectWater, this.x, 480)
        fieldState.createEffectObject(SkillSantansu.santansuEffectWater, this.x, 640)
      }
    }
  }

  display () {
    if (this.state === SkillSantansu.STATE_MOVE_UP || this.state === SkillSantansu.STATE_SANTANSU) {
      super.display()
    }
  }
}

class SkillWhiteflash extends WeaponData {
  constructor () {
    super()
    this.mainType = 1
    this.subType = 2
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.whiteflash, 6)
    this.setWidthHeight(120, 120)
    this.moveSpeedX = 30
    
    /** 화이트 플래시는 다른 무기보다 더 많이 추적해야 하므로, 추적 시도 횟수를 대폭 늘렸습니다. */
    this.chaseMissLimit = 360
  }

  readExtendedMemory () {
    // 참고: 만약 불러오기를 했을 때는, 남은 추적 횟수를 진행 프레임만큼 뺍니다.
    // 이론적으로 불러오기는 상황을 완벽하게 복원하지 않는다는 전제로 작성하기 때문에
    // 굳이 세이브 코드를 사용할 필요가 없습니다. 이 경우 유저한테 불리해지는데 알 게 뭐야.
    this.chaseMissCount = this.chaseMissLimit - this.elapsedFrame
  }

  processMove () {
    super.processMove()

    let sectionWidth = 150

    // 화면 바깥으로 이동할경우, 다시 왼쪽에서 나옵니다.
    if (this.x >= graphicSystem.CANVAS_WIDTH + sectionWidth) {
      this.x = -sectionWidth
    }
  }

  processChaseEnemy () {
    let enemyY = this.targetObject.y

    if (Math.abs(enemyY - this.y) <= 20) {
      this.moveSpeedY = 0
    } else {
      this.moveSpeedY = (enemyY - this.y) / 6
    }
  }

  processAttack () {
    // 6초가 지나기 이전에만, 반복 딜레이를 체크합니다.
    if (this.elapsedFrame < 360 && !this.repeatDelay.check()) return

    // 공격 조건: 3초 이내일 때 적을 타격할때만 공격
    if (this.elapsedFrame <= 180) {
      let enemyObject = this.getEnemyHitObject()
      if (enemyObject != null) {
        this.createSubWeapon()
      }
    } else {
      // 3초 ~ 6초 일 때, 일정 시간마다 반복
      // 6초 이후에는 매 프레임 공격
      this.createSubWeapon()
    }
  }
}

class SkillWhiteFlashSub extends SkillWhiteflash {
  constructor () {
    super()
    this.setMoveSpeed(0, 0)
    this.setWidthHeight(240, 240)
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillWhiteflash, this.width, this.height)
    this.repeatCount = 1 // 1번만 공격 가능(연타 아님)
  }

  processAttack () {
    this.processHitObject()
    fieldState.createEffectObject(this.splashEffect, this.x, this.y)
  }
}

class SkillRing extends Ring {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.ring)
    this.bounceCount = 0
    this.bounceMaxCount = 4
  }

  setOption (number = 0) {
    this.setRingDirection(Ring.ringDirectionList[number], 36)
  }

  display () {
    super.display()
  }
}

class SkillRapid extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.rapid)
    this.setMoveSpeed(40, 0)
  }
}

class SkillSeondanil extends WeaponData {
  static STATE_STOP = 11
  static STATE_ATTACK = 12
  static TYPE_MINI = 19
  static TYPE_MAIN = 25

  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.seondanil)
    this.setMoveSpeed(0, 0)
    this.state = SkillSeondanil.STATE_STOP
    this.moveDelay = new DelayData(60)
    this.hitEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSeondanilHit)
  }

  processMove () {
    if (this.subType === SkillSeondanil.TYPE_MAIN) {
      if (this.moveDelay.check()) {
        if (this.state === SkillSeondanil.STATE_STOP) {
          this.state = SkillSeondanil.STATE_ATTACK
        }
      }
    } else if (this.subType === SkillSeondanil.TYPE_MINI) {
      super.processMove()
    }
  }

  processAttack () {
    if (this.subType === SkillSeondanil.TYPE_MAIN) {
      if (this.state === SkillSeondanil.STATE_ATTACK) {
        if (this.repeatDelay.check()) {
          this.createSubWeapon()
        }
      }
    } else if (this.subType === SkillSeondanil.TYPE_MINI) {
      super.processAttack()
    }
  }

  display () {
    // (공격 상태에서는 보여지지 않음.) 그 외는 전부 출력
    if (this.state !== SkillSeondanil.STATE_ATTACK) {
      super.display()
    }
  }
}

class SkillSeondanilSub extends SkillSeondanil {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.seondanil)
    this.hitEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSeondanilHit)
    this.isLineChase = true
    this.subType = SkillSeondanil.TYPE_MINI
  }

  processAttack () {
    super.processAttack()

    if (this.repeatCount === 0) {
      soundSystem.play(soundSrc.skill.skillSeondanilHit)
    }
  }
}

class SkillHanjumeok extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.hanjumoek, 4)
    this.setWidthHeight(300, 210)
    this.moveSpeedX = 1

    this.jumeokEffect = new CustomEffect(imageSrc.weapon.skill, imageDataInfo.skill.hanjumoek)

    // 스플래시 영역을 가져오는 이유는, 스플래시 크기를 얻기 위해서입니다. 좌표는 초기화되지 않아서 사용하지 않습니다.
    let splashArea = this.getSplashArea()
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillHanjumeokSplash, splashArea.width, splashArea.height, 2)

    this.STATE_JUMEOK = 1
    this.STATE_SPLASH = 2
    this.state = this.STATE_JUMEOK
  }

  getSplashArea () {
    return {
      x: this.centerX - 300,
      y: this.centerY - 300,
      width: 600,
      height: 600,
    }
  }

  processAttack () {
    if (this.repeatCount >= 10) {
      this.processAttackNormal()
    } else if (this.repeatCount >= 1 && this.repeatCount <= 9) {
      this.state = this.STATE_SPLASH
      this.processAttackSplash()
    }
  }

  processAttackSplash () {
    if (!this.repeatDelay.check()) return

    // 중복 공격하지 못하도록 반복 카운트 추가 감소
    this.repeatCount--

    let splashArea = this.getSplashArea()

    // 사운드와 이펙트 출력 (null 체크 하기 전에 미리 해두기)
    // 사운드와 이펙트는 타격수와 관계없이 1번만 출력
    if (this.repeatCount === 8) {
      soundSystem.play(soundSrc.skill.skillHanjumeokSplash)
      fieldState.createEffectObject(this.splashEffect, splashArea.x, splashArea.y)
    }

    let hitObject = this.getEnemyHitObject(splashArea, this.maxTarget)
    if (hitObject == null) return

    for (let current of hitObject) {
      this.damageProcess(current)
    }
  }

  processAttackNormal () {
    if (!this.repeatDelay.check()) return

    // 공격 방식이 임의적이라, repeatCount를 수동으로 감소시켜야 합니다.
    this.repeatCount--
    
    // 타격당한 모든 오브젝트를 가져옴
    let hitObject = this.getEnemyHitObject(this, Math.floor(this.maxTarget / 4))

    if (hitObject == null) return

    // 타격당한 객체가 있다면 그 적에게 데미지 처리를 한 후에, 해당 적의 좌표에 이펙트 생성
    for (let current of hitObject) {
      this.damageProcess(current)

      let effectX = current.x + Math.floor(Math.random() * 80) - 40
      let effectY = current.y + Math.floor(Math.random() * 80) - 40

      // 이펙트의 각도를 수정하기 위해, 필드에서 생성된 이펙트를 가져옵니다.
      let returnEffect = fieldState.createEffectObject(this.jumeokEffect, effectX, effectY)

      // 에니메이션 각도 수정 (애니메이션 형태기 때문에 에니메이션 각도를 수정해야 합니다.)
      if (returnEffect != null && returnEffect.enimation != null) {
        returnEffect.enimation.degree = Math.random() * 360
      }
    }

    // 사운드 출력 (여러 객체가 충돌하여도 1번만 출력해야 합니다.)
    soundSystem.play(soundSrc.skill.skillHanjumeokHit)
  }

  display () {
    if (this.state === this.STATE_JUMEOK) {
      super.display()
    }
  }
}

class SkillBoomerang extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.boomerang)
    this.setWidthHeight(this.width * 4, this.height * 4)
  }

  processAttack () {
    if (this.repeatDelay.check()) {
      this.processHitObject()
    }
  }

  processMove () {
    if (this.elapsedFrame <= 30) {
      this.moveSpeedX += 0.12
    } else if (this.elapsedFrame <= 60) {
      this.moveSpeedX += 0.07
    } else if (this.elapsedFrame <= 90) {
      this.moveSpeedX -= 0
    } else if (this.elapsedFrame <= 120) {
      this.moveSpeedX -= 0.14
    } else if (this.elapsedFrame >= 150) {
      this.moveSpeedX -= 0.28
    }



    this.degree += 10
    super.processMove()
  }
}

class SkillMoon extends WeaponData {
  static STATE_WAIT = 1
  static STATE_ATTACK = 2

  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.moon)
    this.setMoveSpeed(0, 0)
    this.attackDelay = new DelayData(60)
    this.state = SkillMoon.STATE_WAIT
    this.attackElapsedFrame = 0
    this.baseWidth = this.width
    this.baseHeight = this.height

    // 기본 공격력을 알고 있어야, 적 수에 따른 데미지를 재조정 할 수 있음.
    this.baseAttack = 0 // 참고로 이것은 afterInit에서 대입해야 정상적으로 공격력을 받아옵니다.

    this.attackMultipleTable = [1.1, 1.1, 0.9, 0.84, 0.76]
    this.attackMultipleMin = 0.07
    for (let i = 5; i <= 100; i++) {
      // 데미지 공식: Math.floor(((300 * 1.1) + (enemyCount * 5))) / enemyCount
      let multiple = Math.floor(300 * 1.1 + (i * 5)) / i / 100

      this.attackMultipleTable.push(multiple)
    }

    /** 
     * 달 표시용 기준 알파값
     */
    this.ALPHA_BASE = 0.8
  }

  afterInit () {
    // 실제 무기에 입력된 공격력 대입
    this.baseAttack = this.attack
  }

  getSplashArea () {
    // 개막장 스플래시 범위 (화면 전체를 넘어감, 게임 기본사이즈 800x600)
    return {
      x: -1000,
      y: -1000,
      width: 2000,
      height: 2000
    }
  }

  processMove () {
    // 이동하진 않고, 서서히 내려오다가 화면 중앙에 멈춤
    this.y = this.elapsedFrame * 4
    if (this.y >= graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)) {
      this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
    }

    this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
  }

  processAttack () {
    if (this.state === SkillMoon.STATE_WAIT && this.attackDelay.check()) {
      this.state = SkillMoon.STATE_ATTACK
      soundSystem.play(soundSrc.skill.skillMoonAttack)
    } else if (this.state === SkillMoon.STATE_ATTACK && this.repeatDelay.check()) {

      // 적 수에 따라 공격력 배율 재설정
      let enemyCount = fieldState.getEnemyObjectCount()
      if (enemyCount >= this.attackMultipleTable.length) {
        this.attack = Math.floor(this.baseAttack * this.attackMultipleMin)
      } else {
        this.attack = Math.floor(this.baseAttack * this.attackMultipleTable[enemyCount])
      }

      this.processHitObject(this.getSplashArea())
      this.attackElapsedFrame++

      this.degree += 30
      let size = this.baseWidth + (this.attackElapsedFrame * 30)
      this.setWidthHeight(size, size)

      let alpha = this.ALPHA_BASE - (this.attackElapsedFrame / 40)
      this.alpha = alpha > 0.1 ? alpha : 0.1
    }
  }

  display () {
    let tempAlpha = this.alpha
    super.display()

    this.alpha = tempAlpha
  }
}

class SkillKalnal extends ReflectWeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.kalnal)
    this.isLineChase = true
    this.reflectCount = 8
    this.hitEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.kalnal)
    this.hitSoundSrc = soundSrc.skill.skillKalnalHit
  }

  processMove () {
    super.processMove()
    this.degree += 15
  }
}

class SkillCogwheel extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.cogwheel)
    this.setMoveSpeed(0, 0)

    this.hitEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.kalnal)

    this.maxElapsedFrame = 1
    let weapon = dataExportStatWeapon.get(ID.weapon.skillCogwheel)
    if (weapon) {
      this.maxElapsedFrame = weapon.repeatDelay * weapon.repeatCount
    }
  }

  processMove () {
    super.processMove()
    
    const leftElapsedFrame = this.maxElapsedFrame - this.elapsedFrame - 36
    if (leftElapsedFrame >= 48) {
      this.degree += 24
    } else if (leftElapsedFrame >= 1) {
      this.degree += Math.floor(leftElapsedFrame / 2)
    }
  }

  processAttack () {
    // 일정시간 단위로 판단해, 적을 타격할 수 있는 오브젝트가 있으면, 히트사운드 출력
    if (this.repeatDelay.check()) {
      this.processHitObject()
      if (this.enemyHitedCheck()) {
        soundSystem.play(soundSrc.skill.skillCogwheelHit)
      }
    }
  }
}

class SkillYeonsai extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.yeonsai)
  }

  setOption (number = 0) {
    const speedX = 20
    switch (number) {
      case 0: this.setMoveSpeed(speedX, -8); break
      case 1: this.setMoveSpeed(speedX, -4); break
      case 2: this.setMoveSpeed(speedX, -0); break
      case 3: this.setMoveSpeed(speedX, 4); break
      case 4: this.setMoveSpeed(speedX, 8); break
    }

    if (number >= 5 && number <= 10) {
      this.isLineChase = true
    }
  }
}

class SkillSabangtan extends Sabangtan {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.sabangtan)
    this.numberSabangtan = 0
  }

  setOption (number = 0) {
    this.numberSabangtan = number
  }

  getSplashArea () {
    return {
      x: this.x - 240,
      y: this.y - 240,
      width: 480,
      height: 480,
    }
  }

  afterInit () {
    // 강제 중앙 배치
    this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
    this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)

    // 기본 위치에 따른 속도 재조정
    const PDIV8 = Math.floor(graphicSystem.CANVAS_WIDTH / 8)
    const P0 = PDIV8 * 2
    const P1 = PDIV8 * 6
    const YF = graphicSystem.CANVAS_HEIGHT
    let moveX = 0
    let moveY = 0
    switch(this.numberSabangtan) {
      case 0: moveX = P0 - this.x; moveY = 0 - this.y; break
      case 1: moveX = P1 - this.x; moveY = 0 - this.y; break
      case 2: moveX = P0 - this.x; moveY = YF - this.y; break
      case 3: moveX = P1 - this.x; moveY = YF - this.y; break
    }

    let divide = 22
    this.setMoveSpeed(moveX / divide, moveY / divide)
  }

  processMove () {
    super.processMove()

    // Y축 벽에 닿으면 무조건 터지도록 처리함.
    if (this.y <= 0 || this.y + this.height >= graphicSystem.CANVAS_HEIGHT) {
      this.state = WeaponData.STATE_SPLASH
    }

    // 강제 위치 조정
    if (this.y <= 0) {
      this.y = 0
    } else if (this.y >= graphicSystem.CANVAS_HEIGHT) {
      this.y = graphicSystem.CANVAS_HEIGHT - this.height 
    }
  }
}

class SkillHabirant extends WeaponData {
  constructor () {
    super()
    this.STATE_NORMAL = 1
    this.STATE_HABIRANT = 2
    this.state = this.STATE_NORMAL
    this.chaseMissLimit = 480
    this.hitSoundSrc = soundSrc.skill.skillHabirantHit
    this.hitEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.kalnal)
  }

  processState () {
    if (this.state === this.STATE_NORMAL && this.elapsedFrame >= 30) {
      this.state = this.STATE_HABIRANT
    }

    // 5초동안만 지속됨 (적을 오래 못찾는다면, sword랑 다르게 손해임)
    if (this.elapsedFrame >= 330) {
      this.isDeleted = true
    }
  }

  processAttack () {
    if (this.state !== this.STATE_HABIRANT) return


    if (this.repeatDelay.check(false, true)) {
      this.targetObject = fieldState.getRandomEnemyObject()
      if (this.targetObject == null) return

      this.repeatDelay.countReset() // 카운트 리셋 (적이 있는경우 한정)
      this.x = this.targetObject.centerX
      this.y = this.targetObject.centerY

      // 타겟이 잡힌 적은 일단 데미지를 무조건 받음
      this.processHitObject() // 이로 인해 repeatCount가 1 감소됨

      // 그 후 서브 웨폰 생성
      this.createSubWeapon() // 이로 인해 repeatCount가 10 감소됨
    }
  }
}

class SkillHabirantSub extends WeaponData {
  constructor () {
    super()
    this.STATE_NORMAL = 1
    this.STATE_HABIRANT = 2
    this.state = this.STATE_NORMAL
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.habirant)
  }

  processState () {
    if (this.state === this.STATE_NORMAL && this.elapsedFrame >= 5) {
      this.state = this.STATE_HABIRANT
      this.isChase = true
    }
  }

  processMove () {
    if (this.state !== this.STATE_HABIRANT) return

    super.processMove()
    this.degree += 10
  }

  processAttack () {
    if (this.state !== this.STATE_HABIRANT || this.elapsedFrame <= 18) return

    super.processAttack()
  }
}

class SkillIceChaser extends SkillCriticalChaser {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.iceChaser)
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.iceChaser)
    this.state = SkillCriticalChaser.STATE_NORMAL
  }

  processMove () {
    if (this.state === SkillCriticalChaser.STATE_NORMAL && this.moveDelay.check()) {
      this.state = SkillCriticalChaser.STATE_CHASE
      this.isLineChase = true // 라인체이스 강제실행
      this.isChase = false // 연속 추적 금지
    }

    if (this.state === SkillCriticalChaser.STATE_CHASE) {
      // Y축으로만 이동하도록 Y축 속도 조정
      this.setMoveSpeed(this.moveSpeedX, (graphicSystem.CANVAS_HEIGHT - this.y) / 12)
      if (this.moveSpeedY < 3) this.moveSpeedY = 3

      super.processMove()
    }

    // 추적 상태에서 Y축이 맨 밑에 닿으면, 스플래시 공격 (그 외는 스플래시 공격처리되지 않음.)
    if (this.state === SkillCriticalChaser.STATE_CHASE && this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
      this.setMoveSpeed(0, 0)
      this.state = SkillCriticalChaser.STATE_SPLASH
      soundSystem.play(soundSrc.skill.skillIceChaserHit)
    }  
  }

  processAttack () {
    if (this.state === SkillCriticalChaser.STATE_SPLASH) {
      // 공격딜레이가 채워지지 않았다면 함수 종료
      if (!this.repeatDelay.check()) return
  
      const splashArea = this.getSplashArea()
      this.processHitObject(splashArea)
      this.splashEffect.width = splashArea.width
      this.splashEffect.height = splashArea.height
      fieldState.createEffectObject(this.splashEffect, splashArea.x, splashArea.y)
    }
  }

  getSplashArea () {
    return {
      x: this.x - 50,
      y: this.y - 700,
      width: 100,
      height: 800
    }
  }
}

class SkillCalibur extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.calibur)
    this.setWidthHeight(this.width * 2, this.height * 2)

    this.STATE_UP = 1
    this.STATE_DOWN = 2
    this.STATE_CALIBUR = 3
    this.state = this.STATE_UP

    this.stateDelay = new DelayData(75)
  }

  afterInit () {
    // x축은 가운데, y축인 맨 밑에 배치
    this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
    this.y = graphicSystem.CANVAS_HEIGHT
    this.setMoveSpeed(0, -(this.y / this.stateDelay.delay))
  }

  processMove () {
    if (this.state === this.STATE_UP) {
      // 검이 회전하면서 위로 올라옴
      // 검은 밑을 바라보는 방향이여야 하므로, 최종적으로 90도가 되어야 함
      // y축이 일정값 이하일 때, 90도가 되도록 변경
      this.degree += 18
      if (this.y <= 120 && this.degree % 360 >= 90 && this.degree % 360 <= 108) {
        this.degree = 90
      }

      if (this.stateDelay.check()) {
        this.state = this.STATE_DOWN
        this.degree = 90
        this.setMoveSpeed(0, 1)
      }
    } else if (this.state === this.STATE_DOWN) {
      this.stateDelay.check(false, true)
      this.setMoveSpeed(0, 1 + this.stateDelay.count)

      // 검의 높이 중 절반이 화면 바깥으로 나간 경우 상태를 변경
      if (this.y + (this.height / 2) >= graphicSystem.CANVAS_HEIGHT) {
        this.state = this.STATE_CALIBUR
        soundSystem.play(soundSrc.skill.skillCaliburDown)
      }
    } else if (this.state === this.STATE_CALIBUR) {
      this.setMoveSpeed(0, 12)
      if (this.y + (this.height / 4) >= graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT - (this.height / 5 * 4)
      }
    }

    super.processMove()
  }

  processAttack () {
    if (this.state !== this.STATE_CALIBUR) return
    
    // 칼리버 상태인경우, 서브검을 계속 소환함
    if (this.repeatDelay.check()) {
      this.createSubWeapon()
      soundSystem.play(soundSrc.skill.skillCaliburHit)
    }
  }
}

class SkillCaliburSub extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.calibur)
    this.setWidthHeight(Math.floor(this.width / 2), Math.floor(this.height / 2))
    this.hitEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.kalnal)
  }

  afterInit () {
    // 참고: x축의 크기와 y축의 크기는 반전되어있음.
    // 이것은 검은 위로 솟아있는 형태로 나와야 하지만, 실제 이미지는 가로형이기 때문
    this.x = Math.random() * (graphicSystem.CANVAS_WIDTH - this.height)
    this.y = graphicSystem.CANVAS_HEIGHT + this.width
    this.degree = 270 // 위를 바라보는 방향으로 설정
    this.isLineChase = true // 라인 체이스 설정
  }
}

class SkillSujikpa extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.sujikpa)
    this.setWidthHeight(this.width, 800)
  }

  afterInit () {
    let randomEnemy = fieldState.getRandomEnemyObject()
    if (randomEnemy != null) {
      this.x = randomEnemy.x
    }

    this.y = 0 - this.height
    this.setMoveSpeed(0, 40)
  }

  processAttack () {
    if (this.repeatDelay.check()) {
      let splashArea = {x: this.x - 50, y: -100, width: this.width, height: 800}
      this.processHitObject(splashArea)
    }
  }
}

class SkillSpeaker extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.speaker, 2)
    this.effectWave = EnimationData.createEnimation(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.speaker, 0, 3)
    this.effectWave.setOutputSize(this.width * 3, this.height * 3)
    this.STATE_DOWN = 1
    this.STATE_ATTACK = 2
    this.STATE_EXIT = 3
    this.state = this.STATE_DOWN
    this.exitSpeed = 0
    this.exitDelay = 0
  }

  afterInit () {
    this.x = 200
    this.y = 0 - this.height
  }

  processMove () {
    if (this.state === this.STATE_DOWN) {
      this.setMoveSpeed(0, 10)
      if (this.y + this.height >= 500) {
        this.y = 500 - this.height
        this.state = this.STATE_ATTACK
        soundSystem.play(soundSrc.skill.skillSpeakerDown)
        this.effectWave.finished = true // 에니메이션 강제 정지
      }
    } else if (this.state === this.STATE_ATTACK) {
      this.setMoveSpeed(0, 0)
    } else if (this.state === this.STATE_EXIT) {
      this.exitSpeed++
      this.setMoveSpeed(0, -this.exitSpeed)
    }

    super.processMove()
  }

  processAttack () {
    if (this.state !== this.STATE_ATTACK) return

    if (this.repeatDelay.check()) {
      this.processHitObject({x: -100, y: -100, width: 1200, height: 1200})
      soundSystem.play(soundSrc.skill.skillSpeakerAttack)
      this.effectWave.reset()
    }

    // 공격 횟수를 전부 소모시, 바깥으로 나감
    if (this.repeatCount <= 0) {
      this.state = this.STATE_EXIT
    }
  }

  processEnimation () {
    // 공격 시에만 에니메이션 재생
    if (this.state === this.STATE_ATTACK || this.state === this.STATE_EXIT) {
      super.processEnimation()
      this.effectWave.process()
    }
  }

  // 삭제 기준이 다름. (무기는 반복횟수가 0이면 삭제되는데, 이 함수를 상속받아서 기존 조건을 무효화함)
  // 대신, exit상태에서 화면 바깥으로 나간다면 삭제처리
  processDeleteCheck () {
    if (this.state === this.STATE_EXIT && this.y + this.height < 0) {
      this.isDeleted = true
    }
  }

  display () {
    super.display()
    if ((this.state === this.STATE_ATTACK || this.state === this.STATE_EXIT) && !this.effectWave.finished) {
      this.effectWave.display(this.x - (this.effectWave.outputWidth / 4), this.centerY - (this.effectWave.outputHeight / 2))
    }
  }
}

class SkillEomukggochi extends WeaponData {
  constructor () {
    super()
    this.setWidthHeight(imageDataInfo.skill.eomukggochiStick.width, 50)
    // 이미지는 여러 조합에 따른 수동 출력임, 따라서 setAutoImageData를 하지 않음.

    // 이 좌표는 어묵의 위치를 뜻함 (0번은 어묵꼬치)
    this.plusXPoisiton = [0, 20, 60, 100, 160, 200, 240]
    this.plusYDistance = -20

    this.EXIT_DELAY = 40
    this.exitDelay = 0
  }

  createSubWeapon (positionX = 0, positionY = 0, eomukNumber = 0) {
    if (this.subCount <= 0 || this.subId === ID.weapon.unused) return

    this.repeatCount--
    for (let i = 0; i < this.subCount; i++) {
      fieldState.createWeaponObject(this.subId, positionX, positionY, this.attack, eomukNumber)
    }
  }

  processAttack () {
    if (this.elapsedFrame >= 18 && this.repeatCount >= 1 && this.repeatDelay.check()) {
      const leftShot = this.repeatCount
      const positionX = this.x + this.plusXPoisiton[leftShot]
      const positionY = this.y + this.plusYDistance

      // 2를 더하고 3의 나머지를 계산하는 이유는 어묵을 반복횟수 1부터 [0, 1, 2, 0, 1, 2] 순서를 유지하기 위해서
      const eomukNumber = (leftShot + 2) % 3

      soundSystem.play(soundSrc.skill.skillEomukggochiShot)
      this.createSubWeapon(positionX, positionY, eomukNumber)
    }

    if (this.repeatCount <= 0) {
      this.exitDelay++
    }
  }

  processDeleteCheck () {
    if (this.exitDelay >= this.EXIT_DELAY) {
      this.isDeleted = true
    }
  }

  display () {
    // 1번 이미지 (스틱 부분)
    this.imageObjectDisplay(imageSrc.weapon.skill, imageDataInfo.skill.eomukggochiStick, this.x, this.y)

    // 어묵의 추가적인 x좌표 (y축은 동일)
    const plusX = this.plusXPoisiton
    const targetY = this.y - 20

    const imgSrc = imageSrc.weapon.skill
    const imgD1F = imageDataInfo.skill.eomukggochi1
    const imgD2F = imageDataInfo.skill.eomukggochi2
    const imgD3F = imageDataInfo.skill.eomukggochi3
    const number = this.repeatCount

    // 어묵 부분, 남은 반복 횟수에 맞춰 표시됨
    if (number >= 1) this.imageObjectDisplay(imgSrc, imgD1F, this.x + plusX[1], targetY)
    if (number >= 2) this.imageObjectDisplay(imgSrc, imgD2F, this.x + plusX[2], targetY)
    if (number >= 3) this.imageObjectDisplay(imgSrc, imgD3F, this.x + plusX[3], targetY)
    if (number >= 4) this.imageObjectDisplay(imgSrc, imgD1F, this.x + plusX[4], targetY)
    if (number >= 5) this.imageObjectDisplay(imgSrc, imgD2F, this.x + plusX[5], targetY)
    if (number >= 6) this.imageObjectDisplay(imgSrc, imgD3F, this.x + plusX[6], targetY)
  }
}

class SkillEomukggochiSub extends WeaponData {
  constructor () {
    super()
    this.isLineChase = true
  }

  setOption (number = 0) {
    switch (number) {
      case 0: this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.eomukggochi1); break
      case 1: this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.eomukggochi2); break
      case 2: this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.eomukggochi3); break
    }
  }
}

class SkillR2Firecracker extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.r2Firecracker, 2)
    this.state = WeaponData.STATE_NORMAL
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r2Firecraker)

    this.saveList = {
      /** 무기가 도착하는 위치 */ finishX: 0,
      /** 무기가 도착하는 위치 */ finishY: 0,
    }
  }
  
  getSplashArea () {
    return {
      x: this.centerX - 200,
      y: this.centerY - 200,
      width: 400,
      height: 400,
    }
  }

  afterInit () {
    // 무기 도착지점 설정
    this.saveList.finishX = this.x + (Math.random() * 600) - 300
    this.saveList.finishY = this.y + (Math.random() * 600) - 300
  }

  processMove () {
    const speedX = (this.saveList.finishX - this.x) / 3
    const speedY = (this.saveList.finishY - this.y) / 3
    this.setMoveSpeed(speedX, speedY)

    // 일정 속도 이상인 경우만 움직일 수 있음.
    if (Math.abs(speedX) > 1 && Math.abs(speedY) > 1) {
      super.processMove()
    }
  }

  processAttack () {
    // 일정시간 후 스플래시 공격
    if (this.elapsedFrame === 60) {
      this.state = WeaponData.STATE_SPLASH

      // 참고: 이 무기는 동그라미 마을에서 사용하는 폭죽을 가져와 만든거라서,
      // 사운드도 동그라미의 폭죽 사운드를 사용합니다. (파일 이름만 다를뿐...)
      soundSystem.play(soundSrc.skill.skillFirecrackerHit)
    }

    if (this.state === WeaponData.STATE_SPLASH) {
      super.processAttack()
    }
  }
}

class SkillR2Toyhammer extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.r2Toyhammer)
    this.setWidthHeight(this.width, this.height)
    this.hammerDelay = new DelayData(12) // 해머딜레이는, 각도 조절 용도로 사용됨
    this.hammerDelay.setCountMax() // 카운트를 최대로 채워서, 처리하지 못하게함
    this.MAXANGLE = 90
  }

  processState () {
    if (this.hammerDelay.checkCurrentFrame()) {
      this.degree = 0
    } else {
      this.hammerDelay.count++
      // 해머 딜레이 카운트 값이 0 ~ 10범위에서는 0 ~ 90도
      // 11 ~ 20범위에서는 90 ~ 0도로 변경됨
      if (this.hammerDelay.count <= this.hammerDelay.delay / 2) { // 정방향
        const lineDelay = this.hammerDelay.delay / 2
        const currentCount = this.hammerDelay.count
        this.degree = this.MAXANGLE / lineDelay * currentCount
      } else { // 역방향
        const lineDelay = this.hammerDelay.delay / 2
        const currentCount = this.hammerDelay.count - lineDelay
        this.degree = this.MAXANGLE / lineDelay * (lineDelay - currentCount)
      }
    }
  }

  processAttack () {
    if (!this.repeatDelay.check(false, true)) return

    if (this.enemyHitedCheck()) {
      // 반복 딜레이가 위에서 리셋되지 않으므로, 공격에 성공했을 때, 반복 딜레이를 리셋시켜야함
      this.repeatDelay.countReset()
      this.processHitObject()
      
      // 해머 딜레이 카운트가 딜레이값을 넘어가면, 망치 애니메이션을 리셋시킴
      // 공격 딜레이와 해머 딜레이가 서로 다른값을 가지고 있기 때문에 따로 처리해야함
      if (this.hammerDelay.checkCurrentFrame()) {
        this.hammerDelay.countReset()
        soundSystem.play(soundSrc.skill.skillToyhammerHit) // 동그라미 마을에서 사용하는것과 동일... (파일 이름만 다를뿐...)
      }
    }
  }
}

class SkillR3XSeries extends WeaponData {
  constructor () {
    super()
    this.changeFrame = 48
    this.voiceSrc = ''
    this.STATE_WAIT = 1
    this.STATE_ATTACK = 2
    this.state = this.STATE_WAIT
    this.WAIT_FRAME_1 = 42
    this.WAIT_FRAME_2 = 30
  }

  processState () {
    if (this.elapsedFrame === this.changeFrame) {
      this.state = this.STATE_ATTACK
      if (this.voiceSrc) {
        soundSystem.play(this.voiceSrc)
      }
    }
  }

  /** 
   * 스킬 생성시 사운드 재생용도
   * @param {string} [soundSrcA=''] 사운드 경로
   * @param {string} [soundSrcB=''] 사운드 경로
   */
  startSoundPlay (soundSrcA = '', soundSrcB = '') {
    if (soundSrcA) soundSystem.play(soundSrcA)
    if (soundSrcB) soundSystem.play(soundSrcB)
  }

  /** 
   * 상태를 변경하는 시점의 진행 프레임 값 
   * 
   * Xseries 스킬들은, 일정 시간이 지난 후에 공격을 합니다.
  */
  setChangeFrame (changeFrame = 48, voiceSrc = '') {
    this.changeFrame = changeFrame
    this.voiceSrc = voiceSrc
  }

  /** 
   * 중앙에 이펙트를 출력하기 위한 용도 (스킬 사용 하자마자 출력해야함)  
   * 이 함수는 이펙트의 크기를 자동으로 3배 증가시키고 생성합니다. (X시리즈 스킬 공통 특징)
   * 
   * 생성자에서 이 함수를 호출하면 초기화 에러가 발생합니다. 대신 afterInit 함수에 실행해주세요.
   * @param {CustomEffect} customEffect 
   */
  createCenterEffect (customEffect) {
    customEffect.setWidthHeight(customEffect.width * 3, customEffect.height * 3)
    const canvasCenterX = graphicSystem.CANVAS_WIDTH_HALF - (customEffect.width / 2)
    const canvasCenterY = graphicSystem.CANVAS_HEIGHT_HALF - (customEffect.height / 2)
    fieldState.createEffectObject(customEffect.getObject(), canvasCenterX, canvasCenterY)
  }
}

class SkillR3Xkill extends SkillR3XSeries {
  constructor () {
    super()
    this.startSoundPlay(soundSrc.skill.skillXSound1, soundSrc.skill.skillXVoice1)
    this.setChangeFrame(this.WAIT_FRAME_1, soundSrc.skill.skillXkillVoice)
    this.hitEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r3Xkill)
  }

  afterInit () {
    const centerEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r3Xkill, undefined, undefined, 2)
    this.createCenterEffect(centerEffect)
  }

  processAttack () {
    if (this.state !== this.STATE_ATTACK) return
    if (!this.repeatDelay.check()) return

    // 공격 방식은 임의 적을 여러개 지정하고 (같은 적을 여러번 선택할 수도 있음.)
    // 타겟된 적에게 전부 데미지
    let isSuccess = false
    for (let i = 0; i < 10; i++) {
      let randomEnemy = fieldState.getRandomEnemyObject()
      if (randomEnemy == null) { // 만약 랜덤한 적이 null이면, 임의의 무작위 적을 다시 공격함
        // 여기서는 processHitObject가 반복횟수 1 소모하므로, 추가로 소모하지 않음
        this.processHitObject({x: this.x - 10000, y: this.y - 10000, width: 20000, height: 20000})
        isSuccess = this.enemyHitedCheck({x: this.x - 10000, y: this.y - 10000, width: 20000, height: 20000})

        // 적을 타격하지 못했다면, 반복횟수를 감소시킴 (왜냐하면 적을 타격하지 못하면, 반복횟수가 유지됨)
        if (!isSuccess) this.repeatCount--
      } else {
        isSuccess = true
        this.repeatCount-- // 반복횟수 1 소모 (수동으로 감소시켜야함)
        this.damageProcess(randomEnemy)
      }

      // 한번 공격할 때 결과적으로 10번의 반복횟수가 감소함
    }

    // 사운드는 한번만 출력 (적을 타격하는데 성공했다면)
    if (isSuccess) soundSystem.play(soundSrc.skill.skillXkillHit)
  }
}

class SkillR3Xshot extends SkillR3XSeries {
  constructor () {
    super()
    this.startSoundPlay(soundSrc.skill.skillXSound2, soundSrc.skill.skillXVoice2)
    this.setChangeFrame(this.WAIT_FRAME_2, soundSrc.skill.skillXshotVoice)
  }

  afterInit () {
    const centerEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r3Xshot, undefined, undefined, 3)
    this.createCenterEffect(centerEffect)
  }

  processAttack () {
    if (this.state !== this.STATE_ATTACK) return
    if (!this.repeatDelay.check()) return

    soundSystem.play(soundSrc.skill.skillXshotShot)
    this.createSubWeapon()
  }
}

class SkillR3XshotSub extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r3Xshot)
    this.isLineChase = true
  }

  afterInit () {
    const Arandom = Math.random() < 0.5
    const Brandom = Math.random() < 0.5

    // a랜덤은 한개의 축 방향을 랜덤 지정하고, - 완전 랜덤
    // b랜덤은 남은 한개의 축 위치(양 끝 지점)을 랜덤 지정함 - 둘 중 하나의 위치
    if (Arandom) {
      this.x = Math.random() * graphicSystem.CANVAS_WIDTH
      this.y = Brandom ? 0 - this.width : graphicSystem.CANVAS_HEIGHT
    } else {
      this.x = Brandom ? 0 - this.width : graphicSystem.CANVAS_WIDTH
      this.y = Math.random() * graphicSystem.CANVAS_HEIGHT
    }
  }
}

class SkillR3Xbeam extends SkillR3XSeries {
  constructor () {
    super()
    this.startSoundPlay(soundSrc.skill.skillXSound1, soundSrc.skill.skillXVoice1)
    this.setChangeFrame(this.WAIT_FRAME_1, soundSrc.skill.skillXbeamVoice)
  }

  afterInit () {
    const centerEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r3Xbeam, undefined, undefined, 3)
    this.createCenterEffect(centerEffect)
    this.setSplashAttack()
  }

  processAttack () {
    if (this.state !== this.STATE_ATTACK) return
    if (!this.repeatDelay.check()) return

    this.createSubWeapon()
    soundSystem.play(soundSrc.skill.skillXbeamShot)
  }
}

class SkillR3XbeamSub extends WeaponData {
  constructor () {
    super()
    // 공격 범위 2배
    this.setAutoImageData(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r3Xbeam)
    this.setWidthHeight(this.width * 2, this.height * 2)
    this.effect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r3Xbeam)
    this.effect.setWidthHeight(this.effect.width * 2, this.effect.height * 2)
    this.effectDelay = new DelayData(imageDataInfo.weaponEffect.r3Xbeam.frame)
  }

  afterInit () {
    // 스플래시 공격을 시도하도록 설정, 서브웨폰도 무기 객체이기 때문에 이 값을 서브웨폰에 설정해야 함
    this.setSplashAttack()

    const Arandom = Math.random() < 0.5
    const Brandom = Math.random() < 0.5

    // a랜덤은 한개의 축 방향을 랜덤 지정하고, - 완전 랜덤
    // b랜덤은 남은 한개의 축 위치(양 끝 지점)을 랜덤 지정함 - 둘 중 하나의 위치
    if (Arandom) {
      this.x = Math.random() * graphicSystem.CANVAS_WIDTH
      this.y = Brandom ? 0 - this.width : graphicSystem.CANVAS_HEIGHT
    } else {
      this.x = Brandom ? 0 - this.width : graphicSystem.CANVAS_WIDTH
      this.y = Math.random() * graphicSystem.CANVAS_HEIGHT
    }

    let randomEnemy = fieldState.getRandomEnemyObject()
    if (randomEnemy == null) {
      let randomX = Math.random() * graphicSystem.CANVAS_WIDTH
      let randomY = Math.random() * graphicSystem.CANVAS_HEIGHT
      this.setMoveSpeedChaseLine(randomX, randomY, 30, 20)
    } else {
      this.setMoveSpeedChaseLine(randomEnemy.x, randomEnemy.y, 30, 20)
    }
  }

  processMove () {
    super.processMove()
    if (this.effectDelay.check()) {
      fieldState.createEffectObject(this.effect.getObject(), this.x, this.y)
    }
  }

  processAttack () {
    // 적에 닿았을 때만, 공격횟수 소모
    if (this.repeatDelay.checkWithoutReset() && this.enemyHitedCheck()) {
      this.processHitObject()
      this.repeatDelay.countReset()
    }
  }
}

class SkillR3Xboom extends SkillR3XSeries {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.r3Xboom)
    this.startSoundPlay(soundSrc.skill.skillXSound2, soundSrc.skill.skillXVoice2) // 보이스 1만 재생됨
    this.setChangeFrame(this.WAIT_FRAME_2, soundSrc.skill.skillXboomVoice)
  }

  afterInit () {
    const centerEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r3Xboom, undefined, undefined, 2)
    this.createCenterEffect(centerEffect)
  }

  processMove () {
    this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
    this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
  }

  processAttack () {
    if (this.state !== this.STATE_ATTACK) return
    if (!this.repeatDelay.check()) return

    this.createSubWeapon()
  }

  display () {
    // 공격상태일때만 폭탄이 출력됨
    if (this.state === this.STATE_ATTACK) {
      super.display()
    }
  }
}

class SkillR3XboomSub extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.r3Xboom) // 출력 이미지는 에니메이션 없음
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.r3Xboom)
    this.isLineChase = true
    this.state = WeaponData.STATE_NORMAL
  }

  getSplashArea () {
    return {
      x: this.centerX - 100,
      y: this.centerY - 100,
      width: 200,
      height: 200,
    }
  }

  processAttack () {
    super.processAttack()

    if (this.state === WeaponData.STATE_NORMAL) {
      if (this.enemyHitedCheck()) {
        this.setSplashAttack()
      }
    }

    if (this.state === WeaponData.STATE_SPLASH) {
      soundSystem.play(soundSrc.skill.skillXboomHit)
    }
  }

  afterInit () {
    this.x = graphicSystem.CANVAS_WIDTH_HALF - (this.width / 2)
    this.y = graphicSystem.CANVAS_HEIGHT_HALF - (this.height / 2)
  }
}

class SkillR3Helljeon extends R3Helljeon {
  constructor () {
    super() 
    this.setOption(1)
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.r3Helljeon)
    // 추적 옵션을 부여하도록 처리 이 이외에 차이는 없음
  }

  afterInit () {
    // 이유는 모르겠지만, afterInit 시점에서 설정해야 타입이 적용되는 것으로 보임
    this.saveList.type = this.TYPE_CHASE
  }
}

/**
 * @type {Map<number, typeof WeaponData>}
 */
export const dataExportWeapon = new Map()
dataExportWeapon.set(ID.weapon.arrow, Arrow)
dataExportWeapon.set(ID.weapon.blaster, Blaster)
dataExportWeapon.set(ID.weapon.laser, Laser)
dataExportWeapon.set(ID.weapon.missile, MissleData)
dataExportWeapon.set(ID.weapon.multyshot, Multyshot)
dataExportWeapon.set(ID.weapon.parapo, Parapo)
dataExportWeapon.set(ID.weapon.parapoSub, ParapoSub)
dataExportWeapon.set(ID.weapon.sapia, Sapia)
dataExportWeapon.set(ID.weapon.sidewave, Sidewave)
dataExportWeapon.set(ID.weapon.rapid, Rapid)
dataExportWeapon.set(ID.weapon.ring, Ring)
dataExportWeapon.set(ID.weapon.seondanil, Seondanil)
dataExportWeapon.set(ID.weapon.boomerang, Boomerang)
dataExportWeapon.set(ID.weapon.kalnal, Kalnal)
dataExportWeapon.set(ID.weapon.cogwheel, Cogwheel)
dataExportWeapon.set(ID.weapon.yeonsai, Yeonsai)
dataExportWeapon.set(ID.weapon.sabangtan, Sabangtan)
dataExportWeapon.set(ID.weapon.r3TowerPink, R3TowerPink)
dataExportWeapon.set(ID.weapon.r3TowerPurple, R3TowerPurple)
dataExportWeapon.set(ID.weapon.r3Helljeon, R3Helljeon)

// skill
dataExportWeapon.set(ID.weapon.skillArrow, SkillArrow)
dataExportWeapon.set(ID.weapon.skillBlaster, SkillBlaster)
dataExportWeapon.set(ID.weapon.skillLaser, SkillLaser)
dataExportWeapon.set(ID.weapon.skillMissile, SkillMissile)
dataExportWeapon.set(ID.weapon.skillMultyshot, SkillMultyshot)
dataExportWeapon.set(ID.weapon.skillParapo, SkillParapo)
dataExportWeapon.set(ID.weapon.skillSapia, SkillSapia)
dataExportWeapon.set(ID.weapon.skillSidewave, SkillSidewave)
dataExportWeapon.set(ID.weapon.skillSword, SkillSword)
dataExportWeapon.set(ID.weapon.skillHyperBall, SkillHyperBall)
dataExportWeapon.set(ID.weapon.skillCriticalChaser, SkillCriticalChaser)
dataExportWeapon.set(ID.weapon.skillPileBunker, SkillPileBunker)
dataExportWeapon.set(ID.weapon.skillSantansu, SkillSantansu)
dataExportWeapon.set(ID.weapon.skillWhiteflash, SkillWhiteflash)
dataExportWeapon.set(ID.weapon.skillWhiteflashSub, SkillWhiteFlashSub)
dataExportWeapon.set(ID.weapon.skillRapid, SkillRapid)
dataExportWeapon.set(ID.weapon.skillRing, SkillRing)
dataExportWeapon.set(ID.weapon.skillSeondanil, SkillSeondanil)
dataExportWeapon.set(ID.weapon.skillSeondanilSub, SkillSeondanilSub)
dataExportWeapon.set(ID.weapon.skillHanjumeok, SkillHanjumeok)
dataExportWeapon.set(ID.weapon.skillBoomerang, SkillBoomerang)
dataExportWeapon.set(ID.weapon.skillMoon, SkillMoon)
dataExportWeapon.set(ID.weapon.skillKalnal, SkillKalnal)
dataExportWeapon.set(ID.weapon.skillCogwheel, SkillCogwheel)
dataExportWeapon.set(ID.weapon.skillYeonsai, SkillYeonsai)
dataExportWeapon.set(ID.weapon.skillSabangtan, SkillSabangtan)
dataExportWeapon.set(ID.weapon.skillHabirant, SkillHabirant)
dataExportWeapon.set(ID.weapon.skillHabirantSub, SkillHabirantSub)
dataExportWeapon.set(ID.weapon.skillIcechaser, SkillIceChaser)
dataExportWeapon.set(ID.weapon.skillCalibur, SkillCalibur)
dataExportWeapon.set(ID.weapon.skillCaliburSub, SkillCaliburSub)
dataExportWeapon.set(ID.weapon.skillSujikpa, SkillSujikpa)
dataExportWeapon.set(ID.weapon.skillSpeaker, SkillSpeaker)
dataExportWeapon.set(ID.weapon.skillEomukggochi, SkillEomukggochi)
dataExportWeapon.set(ID.weapon.skillEomukggochiSub, SkillEomukggochiSub)
dataExportWeapon.set(ID.weapon.skillR2Firecraker, SkillR2Firecracker)
dataExportWeapon.set(ID.weapon.skillR2Toyhammer, SkillR2Toyhammer)
dataExportWeapon.set(ID.weapon.skillR3Xkill, SkillR3Xkill)
dataExportWeapon.set(ID.weapon.skillR3Xshot, SkillR3Xshot)
dataExportWeapon.set(ID.weapon.skillR3XshotSub, SkillR3XshotSub)
dataExportWeapon.set(ID.weapon.skillR3Xbeam, SkillR3Xbeam)
dataExportWeapon.set(ID.weapon.skillR3XbeamSub, SkillR3XbeamSub)
dataExportWeapon.set(ID.weapon.skillR3Xboom, SkillR3Xboom)
dataExportWeapon.set(ID.weapon.skillR3XboomSub, SkillR3XboomSub)
dataExportWeapon.set(ID.weapon.skillR3Helljeon, SkillR3Helljeon)