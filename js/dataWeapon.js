//@ts-check

import { DelayData, FieldData, EnimationData, collision, collisionClass } from "./dataField.js"
import { EffectData, CustomEffect } from "./dataEffect.js"
import { ID } from "./dataId.js"
import { fieldState } from "./field.js"
import { imageDataInfo, imageSrc } from "./imageSrc.js"
import { EnemyData } from "./dataEnemy.js"
import { soundSrc } from "./soundSrc.js"
import { game } from "./game.js"
import { dataExportStatWeapon } from "./dataStat.js"

let graphicSystem = game.graphic
let soundSystem = game.sound

/**
 * 이 게임에서 사용하는 무기 객체, 참고로 스킬도 이 객체를 사용하여 구현합니다.
 */
export class WeaponData extends FieldData {
  constructor () {
    super()
    /** 공격력(해당 오브젝트의 공격력) */ this.attack = 0
    /** 해당 객체의 기본 오브젝트 타입(임의 수정 불가능) */ this.objectType = 'weapon'
    /** 무기의 기본 이동 방향 x축 = 오른쪽 */ this.moveDirectionX = FieldData.direction.RIGHT
    /** 무기의 기본 이동 방향 y축 = 아래쪽 */ this.moveDirectionY = FieldData.direction.DOWN

    // 추적 오브젝트 여부
    /** 적을 추적하는지의 여부(데이터 객체에서 주로 사용) true일경우 적을 추적하는 무기임. */ this.isChaseType = false
    /** 
     * 추적 실패 횟수: 이 숫자는 추적할 적이 없을 때 과도한 추적 알고리즘 사용을 막기 위해 실행됨.  
     * 
     * 추적할 적이 없거나, 추적한 적이 죽거나 사라질경우 이 카운트가 1씩 증가합니다.
     */ 
    this.chaseMissCount = 0

    /**
     * 최대 추적 변경 횟수
     * 
     * 새로운 적을 추적할때마다 1씩 증가하며, 이 숫자를 넘어가면, 추적이 가능한 무기는 더이상 추적을 하지 않습니다.
     * 
     * 추적하지 않는 무기는 오른쪽으로만 이동합니다.
     * 
     * 이 변수는 렉 방지용(과도학 추적 로직 사용)도로 만들어졌습니다.
     */
    this.chaseLimit = 20

    /** 선 형태로 이동하는 것처럼 움직이게 하기. 
     * 
     * 경고, 이것은 위치가 정해질 때 기준으로 추적하고, isChaseType이랑 같이 사용할 수는 없음. 
     * */ 
    this.isLineChase = false

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

    /**
     * 한번 공격 반복 시 최대 공격횟수, 기본값 1 (이 값이 0이여도 최소 한번은 공격 가능)
     * 
     * 다만, 한번 공격할 때마다 repeatCount를 1씩 소모하기 때문에, repeatCount가 얼마 없다면, 이 값을 크게 설정해도 의미가 없습니다.
     */
    this.maxHitCount = 1

    /**
     * 반복 딜레이 객체(딜레이가 없어도 생성됨, 다만 사용되지 않을뿐)
     * @type {DelayData}
     */
    this.repeatDelay = new DelayData(1)

    /**
     * 무기를 사용한 횟수: repeatCount랑 다른 점은, repeatCount는 적을 타격하면 남은 반복횟수가 감소하지만,
     * 이것은 무기가 공격하면 사용카운트가 증가합니다.
     */
    this.useCount = 0

    /**
     * 무기 최대 사용 카운트, 일반적으로 사용하지 않는 변수라, 기본값은 0
     */
    this.useMaxCount = 0

    /**
     * 한번 공격에 적을 여러개 때릴 수 있는지에 대한 여부
     * 스플래시 형태의 공격이 아니라면 이 값은 false입니다.
     * 자세하게 말하면 스플래시, 충격파의 경우 동시에 여러 적을 때리므로 true입니다.
     * 그러나 관통은 동시에 여러 적을 때리긴 하지만 스플래시 공격이 아니라,
     * 무기가 한번 타격하면 공격횟수를 소모하므로 따라서 false입니다.
     * @type {boolean}
     */
    this.isMultiTarget = false

    /**
     * 멀티타겟인경우 한번 공격당 최대 타겟 제한 수: 기본값 20, -1일경우 무제한
     * 멀티타겟이 아닐경우, 공격 시도한 해당 프레임의 동시 공격 제한 수
     * @type {number}
     */
    this.maxTarget = 20
  }

  afterInitDefault () {
    super.afterInitDefault()
    this.inputStat()
  }

  /** 무기 id에 맞는 해당 스탯을 얻어옵니다. 이 함수는 afterinit에서 자동 실행되므로, 이 함수를 재정의할 필요는 없음 */
  inputStat () {
    let stat = dataExportStatWeapon.get(this.id)
    if (stat == null) return

    this.isChaseType = stat.isChaseType
    this.mainType = stat.mainType
    this.subType = stat.subType
    this.repeatCount = stat.repeatCount
    this.setMultiTarget(stat.isMultiTarget ? stat.maxTarget : 0) // 멀티타겟인경우 최대타겟, 아닌경우 0
    this.maxHitCount = stat.maxTarget
    this.repeatDelay.setDelay(stat.repeatDelay)
  }

  /**
   * 무기의 처리 프로세스
   * 이 함수는 임의로 수정하지 마세요. Weapon 객체가 공통으로 사용해야 합니다.
   */
  process () {
    super.process()
    this.processChase()
    this.processDeleteCheck()
    this.processLineChase()
  }

  /**
   * 라인 단위 추적(1회성)
   * isChaseType이랑 같이 사용하는건 의미가 없음. 이 경우 lineChase가 처리되어도 다시 재추적하게됨.
   */
  processLineChase () {
    if (!this.isLineChase) return

    this.lineChase()
    this.isLineChase = false
  }

  /**
   * 정해진 조건이 되면 무기를 삭제합니다.
   */
  processDeleteCheck () {
    // 무기가 정상적으로 처리되지 않고 오랫동안 남아있을 때를 대비해 삭제하는 요소
    // 그리고 남은 반복 횟수가 0이하인 경우는 해당 무기를 사용할 수 없으므로 삭제됨
    if (this.repeatCount <= 0 || this.elapsedFrame >= 360) {
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
   * 멀티타겟 옵션 설정 및, 최대 타겟수를 설정합니다.
   * 
   * 이 함수를 사용하면, 스플래시(동시에 적 여러개 타격) 데미지를 사용할 수 있습니다.
   * 
   * @param {number} maxTarget 한번 공격 반복 시에 최대로 적을 타격할 수 있는 횟수 (스플래시로 치면 동시 공격 가능 최대 개수) 이 값이 0일경우, 멀티타겟 옵션 제거
   */
  setMultiTarget (maxTarget) {
    if (maxTarget >= 1) {
      this.isMultiTarget = true
      this.maxTarget = maxTarget
    } else {
      this.isMultiTarget = false
      this.maxTarget = 0
    }
  }

  /**
   * 무기가 적을 타격하여 데미지를 주는 함수입니다.
   * 아직까지는, 무기의 공격력 만큼만 적의 체력을 감소시키는 역할만 합니다.
   * 절대로, 다른 곳에서 적의 체력을 직접 감소시키지 마세요!
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
  }

  /**
   * 무기는 적 오브젝트를 공격합니다. processAttack 함수는 무기가 적을 공격하기 위한 로직을 작성합니다.
   * 이 함수에서 공격횟수를 소모하고, 적을 공격하기 위해서는 이 함수 내부에서 hitObjectProgress를 사용해야 합니다.
   */
  processAttack () {
    // 공격 딜레이가 있으며, 공격딜레이 값을 채우지 못했다면 공격을 시도하지 않습니다.
    // 공격 딜레이는 적을 공격했을시에만 리셋됩니다.
    if (this.attackDelay != null && !this.attackDelay.check(false)) return

    this.processHitObject()
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
   * @param {{x: number, y: number, width: number, height: number}} attackArea 공격 범위
   */
  processHitObject (attackArea = { x: this.x, y: this.y, width: this.width, height: this.height }) {
    const enemyObject = fieldState.getEnemyObject() // 적 오브젝트
    let hitCount = 0 // 적을 총 때린 횟수

    if (this.isMultiTarget) {
      // 멀티타겟인 경우, 한번 공격당 무기의 repeatCount 1회 감소
      this.repeatCount--

      // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
      for (let i = 0; i < enemyObject.length; i++) {
        const currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
        if (currentEnemy.isDied) continue // 적이 죽은경우 무시

        // 각각의 적마다 충돌 검사
        if (collision(attackArea, currentEnemy)) {
          // 충돌한 경우, 충돌한 상태에서의 로직을 처리
          this.damageProcess(currentEnemy)
          hitCount++ // 적을 때린 횟수 1회 증가

          // 만약 적을 때린 횟수가 최대 제한을 초과하면 함수 종료
          if (hitCount >= this.maxTarget) {
            return
          }
        }
      }
    } else {
      // 멀티타겟이 아닌 경우, 기본적으로 무기는 1개체당 1대를 때릴 수 있음. (repeatCount가 있다면 그 횟수만큼 적을 때림)
      // 만약 무기의 maxHitCount가 1이라면, 적을 한대 때리고 즉시 루프를 탈출함. 그게 아닐경우 루프를 돌 때까지 나머지 적을 추가로 공격
      // maxHitCount와 상관없이 한번 적을 때릴때마다 repeatCount 1 감소, repeatCount가 0이면 무기 즉시 제거

      // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
      for (let i = 0; i < enemyObject.length; i++) {
        const currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
        if (currentEnemy.isDied) continue // 적이 죽은경우 무시

        // 각각의 적마다 충돌 검사
        if (collision(attackArea, currentEnemy)) {
          // 충돌한 경우, 충돌한 상태에서의 로직을 처리
          this.damageProcess(currentEnemy)
          hitCount++ // 적을 때린 횟수 1회 증가
          this.repeatCount-- // 만약 적을 때렸다면, 무기의 반복 횟수를 감소시킵니다.

          // 만약 적을 때린 횟수가 최대 제한을 초과하면 또는 repeatCount가 0이면 함수 종료
          if (hitCount >= this.maxHitCount || this.repeatCount <= 0) {
            return
          }
        }
      }
    }

    // 공격딜레이가 있는경우, 카운터를 리셋시킵니다.
    if (this.attackDelay != null) {
      this.attackDelay.countReset()
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
   * 적이 무기와 충돌했는지 확인. 
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

    // 어떠한 적도 충돌하지 않았다면 false
    if (hitEnemyList.length >= 1) {
      return hitEnemyList
    } else {
      return null
    }
  }

  /**
   * 이 함수는, OBB 충돌 감지를 할 때 사용하는 함수입니다.
   * hitObject가 두 종류로 나뉘어진건, OBB충돌범위에 몇가지 정보가 더 필요하기 때문입니다.
   * @param {{x: number, y: number, width: number, height: number, degree: number}} attackArea 공격 범위
   */
  processHitObjectOBBCollision (attackArea) {
    const enemyObject = fieldState.getEnemyObject() // 적 오브젝트
    let hitCount = 0 // 적을 총 때린 횟수
    if (attackArea == null) return

    if (this.isMultiTarget) {
      // 멀티타겟인 경우, 한번 공격당 무기의 repeatCount 1회 감소
      this.repeatCount--

      // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
      for (let i = 0; i < enemyObject.length; i++) {
        const currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
        if (currentEnemy.isDied) continue // 적이 죽은경우 무시

        // 각각의 적마다 충돌 검사
        if (collisionClass.collisionOBB(attackArea, currentEnemy)) {
          // 충돌한 경우, 충돌한 상태에서의 로직을 처리
          this.damageProcess(currentEnemy)
          hitCount++ // 적을 때린 횟수 1회 증가

          // 만약 적을 때린 횟수가 최대 제한을 초과하면 함수 종료
          if (hitCount >= this.maxTarget) {
            return
          }
        }
      }
    } else {
      // 멀티타겟이 아닌 경우, 기본적으로 무기는 1개체당 1대를 때릴 수 있음. (repeatCount가 있다면 그 횟수만큼 적을 때림)

      // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
      for (let i = 0; i < enemyObject.length; i++) {
        const currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
        if (currentEnemy.isDied) continue // 적이 죽은경우 무시

        // 각각의 적마다 충돌 검사
        if (collisionClass.collisionOBB(attackArea, currentEnemy)) {
          // 충돌한 경우, 충돌한 상태에서의 로직을 처리
          this.damageProcess(currentEnemy)
          hitCount++ // 적을 때린 횟수 1회 증가
          this.repeatCount-- // 만약 적을 때렸다면, 무기의 반복 횟수를 감소시킵니다.

          // 만약 적을 때린 횟수가 최대 제한을 초과하면 또는 repeatCount가 0이면 함수 종료
          if (hitCount >= this.maxHitCount || this.repeatCount <= 0) {
            return
          }
        }
      }
    }
  }

  /**
   * 현재 타겟이 죽어있거나 삭제되었는지를 확인합니다. 다만 타겟이 없으면 무조건 false 리턴
   */
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
    if (!this.isChaseType) return

    // 추적은 속도값을 이용해서 적을 추적하므로, 이동 방향은 정하지 않음.
    this.setMoveDirection()

    // 추적하는 오브젝트가 있을 경우
    if (this.targetObject != null) {
      // 추적하는 오브젝트가 있지만, 삭제된경우에는 해당 오브젝트를 더이상 추적하지 않고 함수를 종료
      // 죽은 적도 더이상 추적하지 않음
      if (this.targetDeletedOrDiedCheck()) {
        this.targetObject = null
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
        this.moveSpeedX = 20
        this.moveSpeedY = 0
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
    // 이 함수를 사용하기 전에 targetObject가 null이아님을 확인했으므로 여기서는 따로 null 검사를 하진 않습니다.
    // 현재 오브젝트와 타겟 오브젝트의 center(중심 좌표)를 계산하여 거리 차이를 알아냅니다.
    const targetCenterX = this.targetObject.x + Math.floor(this.targetObject.width / 2)
    const targetCenterY = this.targetObject.y + Math.floor(this.targetObject.height / 2)
    const centerX = this.x + Math.floor(this.width / 2)
    const centerY = this.y + Math.floor(this.height / 2)

    const distanceX = targetCenterX - centerX
    const distanceY = targetCenterY - centerY

    // 남은 거리의 1/10 만큼, 해당 오브젝트를 이동시킵니다.
    this.moveSpeedX = Math.floor(distanceX / 10)
    this.moveSpeedY = Math.floor(distanceY / 10)

    // 각 타겟의 이동 속도값(절대값으로 얻음)
    const absTargetSpeedX = Math.abs(this.targetObject._speedX)
    const absTargetSpeedY = Math.abs(this.targetObject._speedY)
    let minSpeedX = (this.elapsedFrame / 20) + absTargetSpeedX
    let minSpeedY = (this.elapsedFrame / 20) + absTargetSpeedY

    // 속도 보정: 적 이동속도보다 빨리 무기가 움직여야함.
    if (this.moveSpeedX <= 0 && this.moveSpeedX > -minSpeedX) {
      this.moveSpeedX = -minSpeedX - 1
    } else if (this.moveSpeedX > 0 && this.moveSpeedX < minSpeedX) {
      this.moveSpeedX = minSpeedX + 1
    }

    if (this.moveSpeedY <= 0 && this.moveSpeedY > -minSpeedY) {
      this.moveSpeedY = -minSpeedY - 1
    } else if (this.moveSpeedY > 0 && this.moveSpeedY < minSpeedY) {
      this.moveSpeedY = minSpeedY + 1
    }

    // 적과의 거리가 짧을 경우, 강제로 해당 위치로 이동합니다.
    // 진행시간이 빠르
    if (Math.abs(distanceX) <= 20 + (this.elapsedFrame / 10)) {
      this.x = targetCenterX
    }

    if (Math.abs(distanceY) <= 20 + (this.elapsedFrame / 10)) {
      this.y = targetCenterY
    }
  }

  /**
   * 적을 추적하긴 하지만, 지속적으로 추적하는게 아닌 생성 할 때만 추적하고, 무기는 직선을 그리듯이 이동함.
   * 
   * 참고: 이 함수를 사용해도 되지만, isLineChase의 값을 true로 바꿔도 이 함수가 실행됩니다.
   * 
   * 원칙은, isLineChase의 값을 true로 바꾸는것이지만, 즉시 이동위치를 바꾸고 싶다면 이 함수를 사용하세요.
   * (isLineChase는 함수 후반에 평가하기 때문에 거의 모든 로직 처리가 끝난 후 실행됩니다.)
   */
  lineChase (minSpeed = 10) {
    let targetEnemy = fieldState.getRandomEnemyObject()
    if (targetEnemy != null) {
      this.setMoveDirection() // 이동 방향 삭제
      
      let speedX = (targetEnemy.centerX - this.centerX) / 30
      let speedY = (targetEnemy.centerY - this.centerY) / 30
      if (Math.abs(speedX) < minSpeed && Math.abs(speedY) < minSpeed) {
        // speedX와 speedY의 값을 비교하여 가장 높은 값을 최소 속도에 맞춰지도록 조정합니다.
        let mul = Math.abs(speedX) < Math.abs(speedY) ? minSpeed / Math.abs(speedY) : minSpeed / Math.abs(speedX)
        speedX *= mul
        speedY *= mul
      }

      this.setMoveSpeed(speedX, speedY)
    } else {
      this.setMoveDirection('right')
      this.moveSpeedX = 20
      this.moveSpeedY = 0
    }
  }

  /**
   * 무기 객체의 저장할 데이터를 가져옵니다.
   * 
   * 필드 객체보다 더 많은 데이터를 저장합니다.
   */
  fieldBaseSaveData () {
    let saveData = super.fieldBaseSaveData()
    let addData = {
      // 추적 여부
      chaseMissCount: this.chaseMissCount,
      chaseLimit: this.chaseLimit,
      isChaseType: this.isChaseType,
      isLineChase: this.isLineChase,

      // 반복
      repeatCount: this.repeatCount,
      repeatDelay: this.repeatDelay,

      // 사용 횟수
      useCount: this.useCount,
      useMaxCount: this.useMaxCount,

      // 멀티 타겟
      isMultiTarget: this.isMultiTarget,
      maxTarget: this.maxTarget
    }

    return Object.assign(saveData, addData)
  }
}

class MultyshotData extends WeaponData {
  /**
   * optionList
   * 0. speedY = 0, 1. chase(추적) = false
   * @param {number[] | string[]} option 개체의 옵션
   */
  constructor (option = [0]) {
    super()
    // 옵션에 따른 값 설정
    this.moveSpeedX = 20
    if (typeof option[0] === 'number') {
      this.moveSpeedY = option[0]
    } else if (typeof option[0] === 'string') {
      this.isLineChase = true
    } else {
      this.moveSpeedY = 0
      this.isLineChase = false
    }

    // 컬러 번호에 따른 무기 이미지 변경
    let colorNumber = 0
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

class MissileData extends WeaponData {
  static STATE_NORMAL = 'normal'
  static STATE_SPLASH = 'splash'
  static STATE_ROCKET = 'rocket'

  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.missile, 5)
    this.moveSpeedX = 12
    this.state = MissileData.STATE_NORMAL
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.missile, this.getSplashArea().width, this.getSplashArea().height)
  }

  /**
   * 스플래시 영역을 얻습니다.
   * 오브젝트의 속성을 추가하지 않고, 굳이 이런 함수를 만든 이유는,
   * 현재 위치에 따라 스플래시 영역이 변경되기 때문입니다.
   * @returns
   */
  getSplashArea () {
    return {
      x: this.x - 50,
      y: this.y - 50,
      width: 100,
      height: 100
    }
  }

  display () {
    // 스플래시 상태에서는 무기의 이미지가 출력되지 않습니다.
    if (this.state === MissileData.STATE_NORMAL && this.enimation != null) {
      this.enimation.display(this.x, this.y)
    }
  }

  /**
   * 무기 공격 방식: 적과의 충돌 여부를 확인한 후, 스플래시 모드로 변경합니다.
   */
  processAttack () {
    if (this.state === MissileData.STATE_NORMAL) {
      this.processAttackNormal()
    } else if (this.state === MissileData.STATE_SPLASH && this.repeatDelay.check()) {
      this.processAttackSplash()
    }
  }

  /**
   * 일반 공격에 대한 처리, 아무나 적을 타격하는 순간 스플래시 모드로 변경
   */
  processAttackNormal () {
    if (this.enemyHitedCheck()) {
      this.state = 'splash'
      this.moveSpeedX = 0
      this.moveSpeedY = 0
      this.isChaseType = false
    }
  }

  /**
   * 스플래시 공격에 대한 로직 처리
   */
  processAttackSplash () {
    const splashArea = this.getSplashArea()
    this.processHitObject(splashArea)

    this.splashEffect.setWidthHeight(splashArea.width, splashArea.height)
    fieldState.createEffectObject(this.splashEffect, splashArea.x, splashArea.y)
  }
}

class MissileRocket extends MissileData {
  /**
   * option list
   * 0. speedY
   */
  constructor (option = [2]) {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.missileRocket)
    this.subType = 'missileRocket'
    this.id = ID.weapon.missileRocket
    this.moveSpeedX = 24
    this.moveSpeedY = option.length >= 1 ? option[0] : -2
    this.state = MissileData.STATE_NORMAL
  }

  getSplashArea () {
    return {
      x: this.x - 70,
      y: this.y - 70,
      width: 140,
      height: 140
    }
  }

  processMove () {
    super.processMove()
    if (this.state === MissileData.STATE_SPLASH) {
      this.moveSpeedX = 4
    }
  }

  display () {
    if (this.enimation) {
      this.enimation.display(this.x, this.y)
    }
  }
}

class Arrow extends WeaponData {
  /**
   * option list
   * 0. moveSpeedY (참고: 이 값이 음수면 갈색이고, 양수면 초록색입니다.)
   */
  constructor (option = [2]) {
    super()
    this.moveSpeedY = option.length >= 1 ? option[0] : 2
    let imageDataList = [
      imageDataInfo.weapon.arrowGreen,
      imageDataInfo.weapon.arrowBrown
    ]
    let imageDataNumber = this.moveSpeedY >= 0 ? 0 : 1
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataList[imageDataNumber])
    this.moveSpeedX = 17
    this.bounceMaxCount = 6
    this.bounceCount = 0
    this.color = 'brown'
  }

  processMove () {
    // 이동 방식만 다르므로, processMove 함수만 수정합니다. (나머지 부분은 multyshot과 동일)
    // 화살표는 벽에 6번 정도 튕깁니다.
    // 총 4번이상 튕기면 더이상 튕기지 않고, 해당 무기는 사라집니다.

    // 이동 처리
    super.processMove()

    // 왼쪽 또는 오른쪽 벽에 튕긴다면, x축의 속도가 반전됩니다.
    // 좀 더 정확한 방향값(-는 왼쪽, +는 오른쪽)을 설장하기 위해 Math.abs 함수를 사용했습니다.
    // 벽에 튕길경우, bounceCount가 1증가합니다.
    if (this.x < 0) {
      this.x = 0
      this.moveSpeedX = Math.abs(this.moveSpeedX)
      this.bounceCount++
    } else if (this.x > graphicSystem.CANVAS_WIDTH) {
      this.x = graphicSystem.CANVAS_WIDTH
      this.moveSpeedX = -Math.abs(this.moveSpeedX)
      this.bounceCount++
    }

    if (this.y < 0) {
      this.y = 0
      this.moveSpeedY = Math.abs(this.moveSpeedY)
      this.bounceCount++
    } else if (this.y > graphicSystem.CANVAS_HEIGHT) {
      this.y = graphicSystem.CANVAS_HEIGHT
      this.moveSpeedY = -Math.abs(this.moveSpeedY)
      this.bounceCount++
    }

    // 바운스 횟수가 바운스 최대 횟수 이상이라면 해당 무기는 삭제됩니다.
    // 다만, 로직 처리상 즉시 삭제는 안되고, 프로세스가 모두 끝나야 삭제할 수 있습니다.
    if (this.bounceCount > this.bounceMaxCount) {
      this.isDeleted = true
    }
  }
}

class Laser extends WeaponData {
  /**
   * 레이저는 적을 관통하는 특징이 있습니다. (반복횟수가 적어서 의미가 있나?)
   */
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.laser)
    this.moveDirectionX = FieldData.direction.RIGHT
    this.setMoveSpeed(20, 0)
  }
}

class LaserBlue extends Laser {
  constructor () {
    super()
    this.subType = 'laserBlue'
    this.id = ID.weapon.laserBlue
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.laserBlue)
    this.chaseLimit = 1 // 적 1번만 추적 가능
    this.moveSpeedX = 0
    this.targetY = 0
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
      this.isChaseType = false
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
  /**
   * option list
   * 0. sapiaShotAttack 사피아샷의 공격력
   */
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.sapia)
  }

  processMove () {
    // subType이 sapia일경우만 다른 로직을 쓰므로, 이를 구분합니다.
    // sapiaShot은 일반 로직 사용
    if (this.subType === 'sapia') {
      if (this.targetObject) {
        this.x = this.targetObject.centerX
        this.y = this.targetObject.centerY
      } else {
        this.x = fieldState.getPlayerObject().x + 200
        this.y = fieldState.getPlayerObject().y
      }
    } else {
      super.processMove()
    }
  }

  /**
   * 사피아는, chase방식이 다른 무기와는 완전히 다릅니다.
   * 먼저, 영역을 설정하고, 영역 내에 적이 있는지 살펴봅니다.
   */
  processChase () {
    // chaseType이 아닐경우, 함수 강제 종료
    if (!this.isChaseType) return

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
      
      const MIN_DISTANCE = 600
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

  /**
   * 사피아의 개편으로 사피아는 더이상 추가 샷을 발사하지 않습니다.
   * 
   * (이 문장은 이전 버전에 해당하는 문장입니다.)
   * 사피아샷이 계속 늘어나는걸 막기 위해, 공격 로직을 subType별로 분리하였습니다.
   * 사피아샷은 일반 오브젝트랑 공격방식이 똑같습니다.
   * 그러나, 사피아는 사피아샷을 추가 생성하기 때문에, 사피아샷의 공격방식을 분리하지 않으면
   * 엄청난 수의 사피아샷이 증가합니다. (공포의 렉)
   */
  processAttack () {
    if (this.subType === 'sapia') {
      this.processAttackSapia()
    } else {
      super.processAttack()
    }
  }

  processAttackSapia () {
    // 반복딜레이가 넘지 않았다면 함수 강제 종료
    if (!this.repeatDelay.check()) return

    // 타겟팅 된 오브젝트가 있을 경우 적을 타격 하고 남은 공격 횟수 감소
    if (this.targetObject) {
      this.damageProcess(this.targetObject)
      this.repeatCount--
    }

    // 해당 무기는 1초가 지나면 삭제됨
    if (this.elapsedFrame >= 60) {
      this.isDeleted = true
    }
  }

  display () {
    if (this.subType === 'sapia') {
      graphicSystem.fillLine(fieldState.getPlayerObject().x, fieldState.getPlayerObject().y, this.x, this.y, 'blue')
    }
    super.display()
  }
}

class SapiaShot extends Sapia {
  /**
   * 옵션: 배열의 순서대로
   * 1. targetX(타겟의 X좌표), 2. targetY(타겟의 Y좌표)
   */
  constructor (option = [0, 0]) {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.sapiaShot)
    this.id = ID.weapon.sapiaShot
    this.subType = 'sapiaShot'
    this.targetX = option.length >= 1 ? option[0] : 0
    this.targetY = option.length >= 2 ? option[1] : 0
    
    this.tempInit = false // 임시 초기화 변수 (사피아샷에서만 사용)
    this.repeatCount = 1 // 사피아샷은 반복 공격할 수 없음.
  }

  processMove () {
    // 이동 속도 강제 지정
    // 생성자에서 하지 않는 이유는, 현재 좌표값을 생성 당시에는 모르기 때문
    // 대신에, moveSpeedX와 moveSpeedY를 0으로 초기화한 것으로, 이동 속도가 없을 때,
    // 적과 사피아샷의 위치를 기준으로 이동속도 설정
    if (!this.tempInit) { // 초기화 진행
      this.tempInit = true
      this.moveSpeedX = (this.targetX - this.x) / 20
      this.moveSpeedY = (this.targetY - this.y) / 20
      const minSpeed = 10 // 최소 이동속도(절댓값, 부호 무시)

      // 만약 한쪽 방향이라도 속도가 minSpeed이하라면 (절댓값으로 계산, 부호 무시)
      if (Math.abs(this.moveSpeedX) <= minSpeed || Math.abs(this.moveSpeedY) <= minSpeed) {
        // 두개 모두 속도가 3 이상이 될 때까지, 나누기 속도값을 1씩 내려서 반복하여 계산
        // 다만, diviedSpeed가 1 이하면, 그냥 대충 대입하고 끝냄 (? 1나누기면 어차피 직접 적에게 닿는거 아님?)
        for (let divideSpeed = 20; divideSpeed >= 2; divideSpeed--) {
          this.moveSpeedX = (this.targetX - this.x) / divideSpeed
          this.moveSpeedY = (this.targetY - this.y) / divideSpeed
          if (Math.abs(this.moveSpeedX) > minSpeed || Math.abs(this.moveSpeedY) > minSpeed) break
        }
      }
    }

    // 실제 이동 처리
    super.processMove()
  }
}

class Parapo extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.parapo)
  }

  processAttack () {
    const hitEnemyList = this.getEnemyHitObject(undefined, 1)
    if (hitEnemyList) {
      /*
      * 적이랑 충돌했을 때, 충격파 추가로 발사
      * 충격파는, 적의 중심 위치를 기준으로 4개의 방향으로 타격합니다.
      * 파라보 자체의 데미지는 없음. (공격력만 있고, 충격파로 데미지를 줌)
      * 좌표값 상세 [참고: c -> enemy center]
      * left: (cx - 100, cy - 50), right: (cx, cy - 50)
      * up: (cx - 50, cy - 100), down: (cx - 50, cy)
      */
      const hitEnemy = hitEnemyList[0]
      const enemyCenterX = hitEnemy.x + (hitEnemy.width / 2)
      const enemyCenterY = hitEnemy.y + (hitEnemy.height / 2)
      const shockWaveSize = 100
      const shockWaveSizeHalf = shockWaveSize / 2
      const divideAttack = Math.floor(this.attack / 4)
      fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX - shockWaveSize, enemyCenterY - shockWaveSizeHalf, divideAttack, 'left')
      fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX, enemyCenterY - shockWaveSizeHalf, divideAttack, 'right')
      fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX - shockWaveSizeHalf, enemyCenterY - shockWaveSize, divideAttack, 'up')
      fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX - shockWaveSizeHalf, enemyCenterY, divideAttack, 'down')
      this.repeatCount--
    }
  }
}

class ParapoShockwave extends Parapo {
  /**
   * 옵션:
   * 0. direction(방향)
   */
  constructor (option = ['']) {
    super()
    this.subType = 'shockwave'
    this.width = 100
    this.height = 100
    this.moveSpeedX = 0
    this.moveSpeedY = 0

    this.parapoEffect = null
    let direction = option.length >= 1 ? option[0] : 'left'
    switch (direction) {
      default:
      case ParapoShockwave.direction.LEFT:
        this.parapoEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.parapoLeft, 100, 100, 1)
        break
      case ParapoShockwave.direction.RIGHT:
        this.parapoEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.parapoRight, 100, 100, 1)
        break
      case ParapoShockwave.direction.UP:
        this.parapoEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.parapoUp, 100, 100, 1)
        break
      case ParapoShockwave.direction.DOWN:
        this.parapoEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.parapoDown, 100, 100, 1)
        break
    }
  }

  processAttack () {
    this.repeatCount--
    this.processHitObject()
    fieldState.createEffectObject(this.parapoEffect, this.x, this.y, 0, 0)
  }

  display () {
    // 아무것도 보여주지 않음.
  }
}

class Blaster extends WeaponData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.blaster)
    this.moveSpeedX = 24
    this.moveSpeedY = 0
  }
}

class BlasterMini extends Blaster {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.blasterMini)
    this.subType = 'blastermini'
    this.isLineChase = true
  }
}

class Sidewave extends WeaponData {
  /**
   * 옵션 목록
   * 0. moveSpeedY = 0, 1. direction = 'right'
   */
  constructor (option = ['']) {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.sidewave)
    this.moveSpeedX = 11
    
    let optionResult = option[0] != null ? option[0].split(' ') : [0, 'right']

    this.moveSpeedY = Number(optionResult[1])

    if (optionResult[0] === Sidewave.direction.LEFT) {
      if (this.enimation) this.enimation.flip = 1 // 좌우 반전 (왼쪽으로 무기가 이동하므로)
      this.moveDirectionX = Sidewave.direction.LEFT
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
  /**
   * @param {string[]} option moveDirection max 8way 이동 방향 최대 8방향
   */
  constructor (option = ['right']) {
    super()
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.ring)

    let ringDirection = option[0]
    this.setRingDirection(ringDirection, 16)

    // 링도 arrow랑 비슷하게 벽튕기기 효과가 있지만 1번만 튕겨집니다. (차별화를 위해서...)
    this.bounceCount = 0
    this.bounceMaxCount = 1
  }

  /** 링의 이동방향 및 속도 설정 */
  setRingDirection (ringDirection, baseSpeed) {
    switch (ringDirection) {
      case 'left':
        this.setMoveSpeed(baseSpeed, 0)
        this.setMoveDirection(FieldData.direction.LEFT, '!')
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
        this.setMoveDirection('!', FieldData.direction.UP)
        break
      case 'down':
        this.setMoveSpeed(0, baseSpeed)
        this.setMoveDirection('!', FieldData.direction.DOWN)
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
        this.setMoveDirection(FieldData.direction.RIGHT, '!')
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
    this.moveDelay = new DelayData(60) // 발사 대기 시간
    this.setMoveSpeed(0, 0)
  }

  processMove () {
    // 60프레임 이후에 이 무기는 이동합니다.
    if (this.moveDelay.check(false, true)) {
      if (this.moveSpeedX === 0 && this.moveSpeedY === 0) {
        this.lineChase(25)
      }

      // 이동 함수가 여기서 실행되므로, moveDelay가 어느정도 넘어가야만 이동이 가능합니다.
      super.processMove()
    }
  }

  processAttack () {
    // 60프레임 이후에 적을 추적하여 바로 공격합니다.
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

class SubMultyshot extends WeaponData {
  constructor () {
    super()
    // 멀티샷 grey를 서브웨폰으로 취급하기로 변경되었습니다. (2022/12/05)
    // 이유는 서브웨폰 모양이 마음에 안들었고, 새로 무기를 만드는것은 귀찮기 때문입니다.
    this.setAutoImageData(imageSrc.weapon.weapon, imageDataInfo.weapon.multyshotGrey)
  }
}

class SkillMultyshot extends WeaponData {
  constructor () {
    // 기본적으로 skillMultyshot은 적을 추적함.
    // 다만 그외의 다른 특징 없음
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.multyshot)
  }
}

class SkillMissile extends MissileData {
  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.missile, 1)
    this.repeatCount = 10
    this.repeatDelay = new DelayData(4)
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillMissile)
    this.splashEffect.setWidthHeight(this.getSplashArea().width, this.getSplashArea().height)
  }

  getSplashArea () {
    return {
      x: this.x - 100,
      y: this.y - 100,
      width: 200,
      height: 200
    }
  }

  processAttackNormal () {
    super.processAttackNormal()

    // 스킬 무기는 적을 타격한 순간 폭발음을 사용한다. 그렇다고, attackNormal을 재작성하는것은 귀찮으므로
    // 대신 여기서 스플래시로 스테이트가 변경된 경우 적을 타격하여 스테이트가 변경된 것이므로 스킬 사운드를 출력한다.
    if (this.state === MissileData.STATE_SPLASH) {
      soundSystem.play(soundSrc.skill.skillMissileHit)
    }
  }
}

class SkillArrow extends Arrow {
  // Arrow를 상속받아서, 그대로 옵션으로 활용
  constructor (option = [2]) {
    super(option)
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.arrow, 3)
    this.color = 'purple'
    this.moveSpeedX = 16
    this.bounceMaxCount = 12
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
    this.useMaxCount = this.repeatCount
    this.callCount = 0

    let rect = imageDataInfo.skill.sapiaRect
    let circle = imageDataInfo.skill.sapiaCircle
    this.enimationSapiaRect = new EnimationData(imageSrc.weapon.skill, rect.x, rect.y, rect.width, rect.height, rect.frame, 4, -1)
    this.enimationSapiaCircle = new EnimationData(imageSrc.weapon.skill, circle.x, circle.y, circle.width, circle.height, circle.frame, 4, -1)
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

  processAttack () {
    // 6프레임당 한번만 공격함. 따라서 반복 대기시간이 넘어가지 않는다면, 함수 강제 종료.
    if (!this.repeatDelay.check()) return

    this.processHitObject()
    this.useCount++
    this.repeatCount = this.useMaxCount - this.useCount // 반복횟수 강제 재조정
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
  static STATE_NORMAL = 'normal'
  static STATE_SHOCKWAVE = 'shockwave'

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
    if (fieldState.getEnemyObjectCount() <= 1) {
      this.processHitObject(shockwaveArea) // 더블어택
    }
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
  constructor (option = [0, 'right']) {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.sidewave)
    this.moveSpeedX = 22
    this.moveSpeedY = Number(option[0])
  }
}

class SkillSword extends WeaponData {
  static STATE_MOVE = 'move'
  static STATE_ATTACK = 'attack'

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
    // 생략 (추적 방식이 조금 다름)
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
      this.isLineChase = true

      super.lineChase()
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
  static STATE_CHASE = 'chase'
  static STATE_NORMAL = 'normal'
  static STATE_SPLASH = 'splash'

  constructor () {
    super()
    this.mainType = 'skill'
    this.subType = 'criticalchaser'
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.criticalChase)
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillCriticalChaser)
    this.repeatCount = 4
    this.repeatDelay = new DelayData(6)
    this.attackDelay = new DelayData(2)
    this.moveDelay = new DelayData(60)
    this.soundDelay = new DelayData(60)
    this.soundDelay.count = this.soundDelay.delay
    this.state = SkillCriticalChaser.STATE_NORMAL
    this.setMultiTarget(8)
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
      if (this.soundDelay.check()) {
        
      }

      // 공격딜레이가 채워지지 않았다면 함수 종료
      if (!this.attackDelay.check()) return
  
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
    this.mainType = 'skill'
    this.subType = 'pilebunker'
    // no image and no enimation

    this.areaEffect = [
      new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillPileBunker1, 120, 80),
      new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillPileBunker2, 120, 80),
      new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillPileBunker3, 120, 80)
    ]

    this.repeatCount = 16
    this.repeatDelay = new DelayData(6)
    this.effectDelay = new DelayData(6)

    this.setMultiTarget(4) // 스플래시 공격, 최대 동시 공격 수 4

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
  static STATE_SANTANSU = 'santansu'
  static STATE_MOVE_UP = 'moveup'
  static STATE_ATTACK = 'attack'

  /**
   * 옵션: 최종 도착 지점 X위치 범위 설정
   * option = randomPositionNumber (0 ~ 4)
   */
  constructor (option = [Math.floor(Math.random() * 5)]) {
    super()
    this.mainType = 'skill'
    this.subType = 'santansu'
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.santansu)
    this.repeatCount = 6
    this.repeatDelay = new DelayData(9)
    this.state = SkillSantansu.STATE_SANTANSU

    let randomPositionNumber = option[0]
    let finishXMin = 0 + (randomPositionNumber * 80)
    let finishXRange = 480
    this.finishX = Math.floor(Math.random() * finishXRange) + finishXMin

    this.setMultiTarget(8)

    this.santansuEffectUp = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSantansuUp, 160, 160)
    this.santansuEffectDown = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSantansuDown, 160, 160)
    this.santansuEffectWater = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSantansuWater, 160, 160)
  }

  afterInit () {
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
    if (this.state === SkillSantansu.STATE_SANTANSU) {
      // 산탄수 상태에서 적이랑 충돌했는지 확인
      // if (this.getEnemyHitObject(this, 1)) {
      //   // 위쪽으로만 이동하도록 변경
      //   // 이동 X값은 0으로 지정
      //   this.state = SkillSantansu.STATE_MOVE_UP
      //   this.moveSpeedX = 0 
      // }
    }

    if (this.state === SkillSantansu.STATE_MOVE_UP || this.state === SkillSantansu.STATE_SANTANSU) {
      // 화면 위까지 닿았을 때 공격 상태로 전환
      if (this.y <= 0) {
        soundSystem.play(soundSrc.skill.skillSantansu)
        fieldState.createEffectObject(this.santansuEffectUp, this.x, 0)
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
        fieldState.createEffectObject(this.santansuEffectUp, this.x, 0)
        fieldState.createEffectObject(this.santansuEffectDown, this.x, 0)
        fieldState.createEffectObject(this.santansuEffectDown, this.x, 160)
        fieldState.createEffectObject(this.santansuEffectDown, this.x, 320)
        fieldState.createEffectObject(this.santansuEffectDown, this.x, 480)
        fieldState.createEffectObject(this.santansuEffectDown, this.x, 640)
        fieldState.createEffectObject(this.santansuEffectWater, this.x, 0)
        fieldState.createEffectObject(this.santansuEffectWater, this.x, 160)
        fieldState.createEffectObject(this.santansuEffectWater, this.x, 320)
        fieldState.createEffectObject(this.santansuEffectWater, this.x, 480)
        fieldState.createEffectObject(this.santansuEffectWater, this.x, 640)
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
    this.mainType = 'skill'
    this.subType = 'whiteflash'
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.whiteflash, 6)
    this.setWidthHeight(120, 120)
    this.moveSpeedX = 30
    this.chaseLimit = 360
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
    // 일정시간마다 안개 소환
    if (this.repeatDelay.check()) {
      if (this.elapsedFrame <= 180) {
        let enemyObject = this.getEnemyHitObject()
        if (enemyObject != null) {
          // 3초 이내에는, 적을 타격할 때에만 공격 성공 처리
          this.repeatCount-- // 공격시마다 반복횟수 감소해야함.
          fieldState.createWeaponObject(ID.weapon.skillWhiteflashSmoke, this.x, this.y, this.attack)
        }
      } else if (this.elapsedFrame >= 181 && this.elapsedFrame <= 360) {
        this.repeatCount-- // 공격시마다 반복횟수 감소해야함.
        fieldState.createWeaponObject(ID.weapon.skillWhiteflashSmoke, this.x, this.y, this.attack)
      } else if (this.elapsedFrame >= 361) {
        // 6초 이후에는 남은 무기 반복 횟수와 관계없이 해당 무기의 모든 반복횟수를 1프레임마다 소모함.
        this.repeatDelay.delay = 1
        this.repeatCount--
        fieldState.createWeaponObject(ID.weapon.skillWhiteflashSmoke, this.x, this.y, this.attack)
      }

    }
  }
}

class SkillWhiteFlashSmoke extends SkillWhiteflash {
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
  /**
   * @param {string[]} option moveDirection max 8way 이동 방향 최대 8방향
   */
  constructor (option = ['right']) {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.ring)
    this.repeatCount = 1
    this.maxHitCount = 4

    let moveDirection = option[0]
    this.setRingDirection(moveDirection, 36)

    this.bounceCount = 0
    this.bounceMaxCount = 4
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
  static STATE_STOP = 'stop'
  static STATE_ATTACK = 'attack'
  static STATE_MINI = 'mini'

  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.seondanil)
    this.setMoveSpeed(0, 0)
    this.repeatCount = 50
    this.repeatDelay = new DelayData(3)
    this.state = SkillSeondanil.STATE_STOP
    this.moveDelay = new DelayData(60)
    this.hitEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillSeondanilHit)
  }

  processMove () {
    if (this.moveDelay.check()) {
      if (this.state === SkillSeondanil.STATE_STOP) {
        this.state = SkillSeondanil.STATE_ATTACK
      }
    }

    super.processMove()
  }

  processAttack () {
    if (this.state === SkillSeondanil.STATE_MINI) {
      // mini상태인경우, 중복적인 공격 객체 생성을 막기 위해 여기서는 일반 공격 로직을 사용합니다.
      super.processAttack()
    } else if (this.state === SkillSeondanil.STATE_ATTACK) {
      // 공격 상태인경우, seondanilMini를 1개 생성합니다.
      // 1개를 생성할 때마다 반복횟수 1 감소
      if (this.repeatDelay.check()) {
        fieldState.createWeaponObject(ID.weapon.skillSeondanilMini, this.x, this.y, this.attack)
        this.repeatCount--
      }
    }
  }

  display () {
    // (공격 상태에서는 보여지지 않음.) 그 외는 번부 출력
    if (this.state !== SkillSeondanil.STATE_ATTACK) {
      super.display()
    }
  }
}

class SkillSeondanilMini extends SkillSeondanil {
  constructor () {
    super()
    this.state = SkillSeondanil.STATE_MINI
  }

  afterInit () {
    this.lineChase(20)
  }

  processAttack () {
    super.processAttack()

    if (this.repeatCount === 0) {
      fieldState.createEffectObject(this.hitEffect, this.x, this.y)
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
    this.setMultiTarget(10)

    this.hitEffect = new CustomEffect(imageSrc.weapon.skill, imageDataInfo.skill.hanjumoek)

    let splashArea = this.getSplashArea()
    this.splashEffect = new CustomEffect(imageSrc.weapon.weaponEffect, imageDataInfo.weaponEffect.skillHanjumeokSplash, splashArea.width, splashArea.height, 2)

    this.STATE_JUMEOK = 'jumeok'
    this.STATE_SPLASH = 'splash'
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

    let hitObject = this.getEnemyHitObject(splashArea, 50)
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
    let hitObject = this.getEnemyHitObject(this, this.maxTarget)

    if (hitObject == null) return

    // 타격당한 객체가 있다면 그 적에게 데미지 처리를 한 후에, 해당 적의 좌표에 이펙트 생성
    for (let current of hitObject) {
      this.damageProcess(current)

      let effectX = current.x + Math.floor(Math.random() * 80) - 40
      let effectY = current.y + Math.floor(Math.random() * 80) - 40

      // 이펙트의 각도를 수정하기 위해, 필드에서 생성된 이펙트를 가져옵니다.
      let returnEffect = fieldState.createEffectObject(this.hitEffect, effectX, effectY)

      // 에니메이션 각도 수정 (객체의 각도를 수정하는것은 의미가 없음.)
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
    this.setWidthHeight(this.width * 3, this.height * 3)
  }

  processMove () {
    if (this.elapsedFrame <= 30) {
      this.moveSpeedX += 0.12
    } else if (this.elapsedFrame <= 60) {
      this.moveSpeedX += 0.07
    } else if (this.elapsedFrame <= 90) {
      this.moveSpeedX -= 0
    } else if (this.elapsedFrame <= 120) {
      this.moveSpeedX -= 0.07
    } else if (this.elapsedFrame >= 150) {
      this.moveSpeedX -= 0.21
    }

    this.degree += 10
    super.processMove()
  }
}

class SkillMoon extends WeaponData {
  static STATE_WAIT = 'wait'
  static STATE_ATTACK = 'attack'

  constructor () {
    super()
    this.setAutoImageData(imageSrc.weapon.skill, imageDataInfo.skill.moon)
    this.setMoveSpeed(0, 0)
    this.attackDelay = new DelayData(60)
    this.state = SkillMoon.STATE_WAIT

    /** 
     * 이 스킬이 공격 상태일 때, 배경색을 바꾸는 기준의 알파값
     * 
     * 이 값은, 일시 정지 상태일 때, 화면이 깜빡거리는걸 막기 위해 추가된 값입니다.
     */
    this.ALPHA_BASE = 0.5

    /** 이 스킬이 공격 상태일 때, 배경색을 바꾸는 실제 알파 값(기준값을 기준으로 이 값이 변화) */
    this.alpha = 0.5
  }

  getSplashArea () {
    // 개막장 스플래시 범위 (화면 전체를 넘어감, 기본사이즈 800x600)
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
      this.processHitObject(this.getSplashArea())
      if (fieldState.getEnemyObjectCount() <= 1) {
        this.processHitObject() // 더블 어택...
      }

      this.degree = Math.floor(Math.random() * 360)
      let size = Math.floor(Math.random() * 40) + 180
      this.setWidthHeight(size, size)
      this.alpha = Math.random() * this.ALPHA_BASE
    }
  }

  display () {
    super.display()

    // 검은색 배경 화면 추가 출력
    if (this.state === SkillMoon.STATE_ATTACK) {
      graphicSystem.setAlpha(this.alpha)
      graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, 'black')
      graphicSystem.setAlpha(1)
    }
  }
}

/**
 * @type {Map<number, WeaponData | any>}
 */
export const dataExportWeapon = new Map()
dataExportWeapon.set(ID.weapon.arrow, Arrow)
dataExportWeapon.set(ID.weapon.blaster, Blaster)
dataExportWeapon.set(ID.weapon.blasterMini, BlasterMini)
dataExportWeapon.set(ID.weapon.laser, Laser)
dataExportWeapon.set(ID.weapon.laserBlue, LaserBlue)
dataExportWeapon.set(ID.weapon.missile, MissileData)
dataExportWeapon.set(ID.weapon.missileRocket, MissileRocket)
dataExportWeapon.set(ID.weapon.multyshot, MultyshotData)
dataExportWeapon.set(ID.weapon.parapo, Parapo)
dataExportWeapon.set(ID.weapon.parapoShockWave, ParapoShockwave)
dataExportWeapon.set(ID.weapon.sapia, Sapia)
dataExportWeapon.set(ID.weapon.sapiaShot, SapiaShot)
dataExportWeapon.set(ID.weapon.sidewave, Sidewave)
dataExportWeapon.set(ID.weapon.subMultyshot, SubMultyshot)
dataExportWeapon.set(ID.weapon.rapid, Rapid)
dataExportWeapon.set(ID.weapon.ring, Ring)
dataExportWeapon.set(ID.weapon.seondanil, Seondanil)
dataExportWeapon.set(ID.weapon.boomerang, Boomerang)

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
dataExportWeapon.set(ID.weapon.skillWhiteflashSmoke, SkillWhiteFlashSmoke)
dataExportWeapon.set(ID.weapon.skillRapid, SkillRapid)
dataExportWeapon.set(ID.weapon.skillRing, SkillRing)
dataExportWeapon.set(ID.weapon.skillSeondanil, SkillSeondanil)
dataExportWeapon.set(ID.weapon.skillSeondanilMini, SkillSeondanilMini)
dataExportWeapon.set(ID.weapon.skillHanjumoek, SkillHanjumeok)
dataExportWeapon.set(ID.weapon.skillBoomerang, SkillBoomerang)
dataExportWeapon.set(ID.weapon.skillMoon, SkillMoon)