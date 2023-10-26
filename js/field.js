//@ts-check
'use strict'

import { tamshooter4Data } from './data.js'
import { CustomEditEffect, CustomEffect, EffectData } from './dataEffect.js'
import { EnemyBulletData, EnemyData } from './dataEnemy.js'
import { DelayData, FieldData } from './dataField.js'
import { ID } from './dataId.js'
import { PlayerSkillData, PlayerWeaponData } from './dataPlayer.js'
import { RoundData } from './dataRound.js'
import { WeaponData } from './dataWeapon.js'
import { imageDataInfo, imageSrc } from './imageSrc.js'
import { soundSrc } from './soundSrc.js'
import { gameVar, userSystem, game, gameFunction } from './game.js'

let digitalDisplay = gameFunction.digitalDisplay

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

    DamageObject.displayNumber(this.attack + '', this.x, this.y, 10, 10)
  }

  static displayNumber = game.graphic.createCustomNumberDisplay(imageSrc.system.damageFont, 12, 10)
}

/**
 * 플레이어 오브젝트
 * 플레이어를 직접 조종합니다.
 * 이 객체는 필드 상태에서 직접 생성해 만드는 객체이기 때문에 data.js에서 플레이어 데이터를 받아오지 않습니다.
 */
class PlayerObject extends FieldData {
  /** 플레이어 이미지 */ playerImage = imageSrc.system.playerImage
  playerImageData = {
    x: 0, y: 0, width: 40, height: 20, frame: 3
  }

  /**
   * @typedef {{skill: PlayerSkillData | null, id: number, coolTimeFrame: number, repeatCount: number, delayCount: number}} SkillSlot 플레이어가 사용하는 스킬 슬롯의 오브젝트 구조
   * @typedef {{weapon: PlayerWeaponData | null, id: number, delayCount: number}} WeaponSlot 무기 슬롯 (총 5개가 있으며, 0 ~3번 슬롯은 유저가 정한 무기를 사용하고, 4번 슬롯은 무기를 사용하지 않는 슬롯입니다.)
   */

  constructor () {
    super() // 'player', 0, 300, 200
    this.objectType = 'player'
    this.width = this.playerImageData.width
    this.height = this.playerImageData.height

    // 플레이어 전용 변수
    // 일부 변수의 설명은 init 부분에 적혀있습니다. (참고: init함수는 다른 이름으로도 (initSkill, initWeapon등...) 여러개 있음.)
    this.shield = 0
    this.shieldMax = 0
    this.shieldRecovery = 0
    this.attackDelay = new DelayData(0)
    this.attackDelayCount = 0
    this.debug = false
    this.dieAfterDelayCount = 0

    this.damageEnimationCount = 0
    this.levelupEnimationCount = 0
    this.currentLevel = 0

    this.weaponSlotNumber = 0
    this.playerSubWeaponDelayCount = 0

    this.autoMoveFrame = 0
    this.autoMoveX = 0
    this.autoMoveY = 0

    /** @type {SkillSlot[]} */ this.skillSlotA = []
    /** @type {SkillSlot[]} */ this.skillSlotB = []
    /** @type {WeaponSlot[]} */ this.weaponSlot = []
    /** @type {WeaponSlot} */ this.subWeaponSlot = {weapon: null, id: 0, delayCount: 0}
  }

  /**
   * 플레이어 정보 초기화 함수:
   * 주의! 이 함수는 constructor 내부에서 사용할 수 없습니다.
   * 왜냐하면 playerObject 데이터를 초기화 하지 않은 상태에서 불러오면 오류가 발생하기 때문입니다.
   * 따라서, 이 함수는 보통 roundStart에서 호출합니다.
   */
  init () {
    this.shieldRecovery = 0
    this.attackDelay.count = 0
    this.attackDelayCount = 0
    this.debug = false
    this.dieAfterDelayCount = 0
    this.isDied = false
    this.moveSpeedX = 8
    this.moveSpeedY = 8
    this.autoMoveFrame = 0
    this.autoMoveX = 0
    this.autoMoveY = 0

    this.x = 300
    this.y = 200
    this.centerX = this.x + (this.width / 2)
    this.centerY = this.y + (this.height / 2)

    this.damageEnimationCount = 0
    this.levelupEnimationCount = 0

    const getData = userSystem.getPlayerObjectData()
    this.currentLevel = getData.lv
    this.attack = getData.attack
    this.hp = getData.hp
    this.hpMax = getData.hpMax
    this.shield = getData.shield
    this.shieldMax = getData.shieldMax
    
    this.initSkill()
    this.initWeapon()

    /** 이동 가능 여부 (false일경우 조작 불가 - 적이나 라운드에서 사용할 수도 있음) 
     * 하지만 해제하지 못하면 영원히 이동할 수 없으므로 주의 바람.*/ 
    this.isMoveEnable = true
  }

  /**
   * 무기 객체 초기화 작업
   */
  initWeapon () {
    let userWapon = userSystem.getWeaponList()

    /**
     * @type {WeaponSlot[]}
     */
    this.weaponSlot = [
      {weapon: null, id: userWapon[0], delayCount: 0},
      {weapon: null, id: userWapon[1], delayCount: 0},
      {weapon: null, id: userWapon[2], delayCount: 0},
      {weapon: null, id: userWapon[3], delayCount: 0},
      {weapon: null, id: ID.playerWeapon.unused, delayCount: 0},
    ]

    /**
     * 서브 무기 슬롯
     * 
     * 게임 규칙 상, 이 무기는 성능과 효과가 고정되어있습니다.
     * 무조건 유도성능을 가진 무기이며, 이 무기는 화면 바깥에 있는 적을 죽일 수 있게 하기 위한 무기입니다.
     * (사용자가 적이 남아있는것을 눈치채게 하기 위해서 일부러 이렇게 만들었습니다.)
     * @type {WeaponSlot}
     */
    this.subWeaponSlot = {
      weapon: null, id: ID.playerWeapon.subMultyshot, delayCount: 0
    }

    /**
     * 플레이어의 무기 슬롯 번호, 기본값은 0
     */
    this.weaponSlotNumber = 0
    
    // 무기 슬롯 데이터 입력합니다.
    for (let i = 0; i < this.weaponSlot.length; i++) {
      let getClass = tamshooter4Data.getPlayerWeapon(this.weaponSlot[i].id)
      //@ts-expect-error
      this.weaponSlot[i].weapon = getClass != null ? new getClass() : null
    }

    // 서브 웨폰
    let subWeaponClass = tamshooter4Data.getPlayerWeapon(this.subWeaponSlot.id)
    //@ts-expect-error
    this.subWeaponSlot.weapon = subWeaponClass != null ? new subWeaponClass() : null

    /** 서브 웨폰 딜레이 */
    this.playerSubWeaponDelayCount = 0
  }

  /**
   * 스킬 정보 초기화
   */
  initSkill () {
    /** 스킬 슬롯이 A인지 여부, 아닐경우 B로 처리 */ this.usingSkillSlotA = true
    let getUserSkill = userSystem.getSkillList()

    /**
     * 스킬의 대한 정보를 저장하는 데이터
     * 
     * 스킬은 A슬롯과 B슬롯이 있으며, 최대 한번에 4개까지만 사용 가능하고, 같은 슬롯에 있는 쿨타임은 공유 개념처럼 사용
     * @type {SkillSlot[]}
     */
    this.skillSlotA = [
      { skill: null, id: getUserSkill[0], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[1], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[2], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[3], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 }
    ]

    /**
     * @type {SkillSlot[]}
     */
    this.skillSlotB = [
      { skill: null, id: getUserSkill[4], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[5], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[6], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 },
      { skill: null, id: getUserSkill[7], coolTimeFrame: 0, repeatCount: 0, delayCount: 0 }
    ]

    // 스킬 클래스 등록 (한번에 A, B 슬롯 두개를 등록하는건 귀찮아서...)
    // 여기서는 널 체크를 하지 않습니다. (process에서만 널 체크 진행)
    for (let i = 0; i < this.skillSlotA.length; i++) {
      const getIdA = this.skillSlotA[i].id
      const getIdB = this.skillSlotB[i].id
      const getSkillA = tamshooter4Data.getPlayerSkill(getIdA)
      const getSkillB = tamshooter4Data.getPlayerSkill(getIdB)

      // 널체크와 동시에 클래스 인스턴스 생성 (null일경우 생성하지 않음.)
      //@ts-expect-error 
      this.skillSlotA[i].skill = getSkillA != null ? new getSkillA() : null
      //@ts-expect-error
      this.skillSlotB[i].skill = getSkillB != null ? new getSkillB() : null
    }
  }

  /**
   * 플레이어가 데미지를 받으면 사운드를 출력합니다.
   * @param {number} shieldDamage 쉴드 데미지
   * @param {number} hpDamage 체력 데미지
   */
  damageSoundPlay (shieldDamage = 0, hpDamage = 0) {
    const LOW_DAMAGE = 2
    const MIDDLE_DAMAGE = 15
    const HIGH_DAMAGE = 30
    const HP_LOW_DAMAGE = 1
    const HP_MIDDLE_DAMAGE = 7
    const HP_HIGH_DAMAGE = 15

    if (hpDamage >= 1) {
      if (hpDamage >= HP_LOW_DAMAGE && hpDamage < HP_MIDDLE_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamage)
      } else if (hpDamage >= HP_MIDDLE_DAMAGE && hpDamage < HP_HIGH_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamageBig)
      } else if (hpDamage >= HP_HIGH_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamageDanger)
      }
    } else {
      if (shieldDamage >= LOW_DAMAGE && shieldDamage < MIDDLE_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamage)
      } else if (shieldDamage >= MIDDLE_DAMAGE && shieldDamage < HIGH_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamageBig)
      } else if (shieldDamage >= HIGH_DAMAGE) {
        game.sound.play(soundSrc.system.systemPlayerDamageDanger)
      }
    }
  }

  /**
   * 플레이어가 데미지를 받았을 때, 에니메이션을 출력합니다.
   * @param {number} shieldDamage 쉴드 데미지
   * @param {number} hpDamage 체력 데미지
   */
  damageEnimationSet (shieldDamage = 0, hpDamage = 0) {
    let damageFrame = (shieldDamage * 2) + (hpDamage * 4)
    if (damageFrame > 180) {
      damageFrame = 180
    } else if (damageFrame < 10) {
      damageFrame = 10
    }

    this.damageEnimationCount = damageFrame
    userSystem.setDamageWarningFrame(damageFrame)
  }

  /**
   * 플레이어가 받은 데미지를 추가합니다. (플레이어가 죽거나 데미지가 없으면 무효)
   * @param {number} damage 
   */
  addDamage (damage = 0) {
    if (this.isDied || damage === 0) return

    let hpDamage = 0
    let shieldDamage = 0

    if (this.shield >= damage) {
      shieldDamage = damage
      this.shield -= damage
    } else if (this.shield < damage) {
      if (this.shield >= 0) {
        shieldDamage = this.shield
        hpDamage = damage - shieldDamage
        this.shield = 0
        this.hp -= Math.floor(hpDamage / 2)
      } else {
        hpDamage = damage

        // 만약 쉴드가 없는 상태에서 데미지를 받았다면 최소 1체력이 감소합니다.
        // 이것은 1데미지로는 체력이 감소하지 않기 때문에 보정치를 넣은것입니다.
        if (hpDamage < 0) hpDamage = 2
        this.hp -= Math.floor(hpDamage / 2)
      }
    }

    this.damageSoundPlay(shieldDamage, hpDamage)
    this.damageEnimationSet(shieldDamage, hpDamage)
  }

  /** 플레이어에게 경험치를 추가합니다. */
  addExp (score = 0) {
    userSystem.plusExp(score)
  }

  process () {
    this.processSendUserStat()

    if (!this.isDied) {
      this.processButton()
      this.processAttack()
      this.processSubAttack()
      this.processSkill()
      this.processShield()
      this.processDamage()
      this.processLevelupCheck()
      this.processAutoMove()
    }
    this.processDie()
  }

  /** 플레이어가 레벨업을 했는지 확인 */
  processLevelupCheck () {
    if (this.currentLevel != userSystem.getPlayerObjectData().lv) {
      this.currentLevel = userSystem.getPlayerObjectData().lv
      this.levelupEnimationCount = 120
    }

    if (this.levelupEnimationCount > 0) {
      this.levelupEnimationCount--
    }
  }

  /** 플레이어가 죽었는지 확인 */
  processDie () {
    if (this.hp <= 0 && !this.isDied) {
      this.isDied = true
      game.sound.play(soundSrc.system.systemPlayerDie)
    }

    if (this.isDied) {
      this.dieAfterDelayCount++
    }
  }

  /**
   * 스킬을 사용합니다.
   * @param {number} skillPosition 스킬의 위치(번호 0 ~ 3)
   * @returns 
   */
  useSkill (skillPosition = 0) {
    // 스킬 슬롯에 따라 해당 스킬을 찾기
    let targetSkill = this.usingSkillSlotA ? this.skillSlotA[skillPosition] : this.skillSlotB[skillPosition]

    // 스킬 클래스(데이터)가 없으면 함수를 실행하지 않음.
    if (targetSkill.skill == null) return

    // 쿨타임 계산해서, 쿨타임이 남아있으면, 무시
    if (targetSkill.coolTimeFrame > 0) return

    // 스킬 사용
    // 스킬을 사용했을 때, 해당 스킬 만큼의 스킬 쿨타임이 증가합니다.
    // 그리고 같은 번호의 다른 슬롯도 동시에 공유됩니다.
    targetSkill.repeatCount += targetSkill.skill.repeatCount // 스킬 반복 횟수를 증가시켜 여러번 무기가 발사되게 처리
    
    this.skillSlotA[skillPosition].coolTimeFrame += targetSkill.skill.getCoolTimeFrame() // 쿨타임 추가 (단위가 프레임이므로, 쿨타임 시간에 60을 곱함)
    this.skillSlotB[skillPosition].coolTimeFrame += targetSkill.skill.getCoolTimeFrame() // 슬롯 B에도 마찬가지로 쿨타임 추가

    // 스킬에 사용된 무기가 즉시 발사되도록, 딜레이카운트를 채워줌(딜레이 이상이여야 무기 발사됨)
    // 다만 beforeDelay가 있을경우, 미리 delayCount에서 해당 수치만큼 감소
    targetSkill.delayCount += targetSkill.skill.delay - targetSkill.skill.beforeDelay

    // 스킬 사운드 출력
    targetSkill.skill.useSoundPlay()
  }

  processAutoMove () {
    if (this.autoMoveFrame >= 1) {
      this.autoMoveFrame--
      // 참고: 플레이어는 autoMoveFrame이 있는 동안은 조작을 통해 이동할 수 없지만, 
      // 예상 가능한 버그를 막기 위해서 isMoveEnable 설정을 하지 않습니다.

      this.x += (this.autoMoveX - this.x) / 10
      this.y += (this.autoMoveY - this.y) / 10
    }
  }

  processDamage () {
    if (this.damageEnimationCount > 0) {
      this.damageEnimationCount--
    }
  }

  processShield () {
    const SHIELD_RECOVERY_POINT = 6000
    this.shieldRecovery += 100

    // 쉴드 회복 처리
    if (this.shieldRecovery >= SHIELD_RECOVERY_POINT) {
      this.shield++
      this.shieldRecovery -= SHIELD_RECOVERY_POINT
    }

    // 쉴드 최대치 초과 금지
    if (this.shield > this.shieldMax) {
      this.shield = this.shieldMax
    }
  }

  processSkill () {
    // 참고: null 체크는 processSkillLogic에서 검사합니다.

    for (let i = 0; i < this.skillSlotA.length; i++) {
      // 루프 i값에 따른 현재 스킬. 
      // 스킬슬롯 A를 사용중이면, A슬롯의 스킬을 가져옵니다., B슬롯이라면, B슬롯에 있는 스킬을 가져옵니다.
      this.processSkillLogic(this.skillSlotA[i])
    }

    for (let i = 0; i < this.skillSlotB.length; i++) {
      this.processSkillLogic(this.skillSlotB[i])
    }

    if (this.usingSkillSlotA) {
      for (let i = 0; i < this.skillSlotA.length; i++) {
        userSystem.setSkillDisplayStat(i, Math.round(this.skillSlotA[i].coolTimeFrame / 60), this.skillSlotA[i].id)
      }
    } else {
      for (let i = 0; i < this.skillSlotB.length; i++) {
        userSystem.setSkillDisplayStat(i, Math.round(this.skillSlotB[i].coolTimeFrame / 60), this.skillSlotB[i].id)
      }
    }
  }

  /**
   * 
   * @param {SkillSlot} currentSkill
   */
  processSkillLogic (currentSkill) {
    // 해당 스킬에 대한 데이터가 없으면 무시
    if (currentSkill.skill == null) return

    if (currentSkill.coolTimeFrame > 0) { // 스킬 쿨타임이 0보다 클 때
      currentSkill.coolTimeFrame-- // 스킬 쿨타임프레임 감소
    }

    // 만약 스킬 반복횟수가 없다면, 스킬을 사용하지 않은것이므로 무시
    if (currentSkill.repeatCount <= 0) return
    if (currentSkill.skill == null) return // 스킬이 없다면 무시

    currentSkill.delayCount++ // 스킬 딜레이카운트 증가
    if (currentSkill.delayCount >= currentSkill.skill.delay) { // 딜레이카운트카 스킬 딜레이를 넘어가면 무기 생성
      currentSkill.skill.create(this.attack, this.centerX, this.centerY)
      currentSkill.delayCount -= currentSkill.skill.delay // 스킬 딜레이카운트 감소
      currentSkill.repeatCount-- // 반복횟수 1회 감소
    }
  }

  processDebug () {
    this.displayDebug()
  }

  displayDebug () {
    if (fieldState.weaponObject[fieldState.weaponObject.length - 1] == null) return
    game.graphic.fillText(fieldState.weaponObject[fieldState.weaponObject.length - 1].x + ', ' + fieldState.weaponObject[fieldState.weaponObject.length - 1].y, 0, 100)

    if (fieldState.weaponObject[0].targetObject == null) return
    console.log(fieldState.weaponObject[0].x + ', ' + fieldState.weaponObject[0].y + ', ' + fieldState.weaponObject[0].targetObject.x + ', ' + fieldState.weaponObject[0].targetObject.y)
  }

  processSendUserStat () {
    userSystem.hp = this.hp
    userSystem.shield = this.shield
    for (let i = 0; i < 4; i++) {
      userSystem.skillDisplayStat[i].coolTime = Math.ceil(this.skillSlotA[i].coolTimeFrame / 60)
      userSystem.skillDisplayStat[i].id = this.skillSlotA[i].id
    }
  }

  processButton () {
    // 버튼의 목록
    const buttonLeft = game.control.getButtonDown(game.control.buttonIndex.LEFT)
    const buttonRight = game.control.getButtonDown(game.control.buttonIndex.RIGHT)
    const buttonUp = game.control.getButtonDown(game.control.buttonIndex.UP)
    const buttonDown = game.control.getButtonDown(game.control.buttonIndex.DOWN)
    const buttonA = game.control.getButtonInput(game.control.buttonIndex.A)
    const buttonB = game.control.getButtonInput(game.control.buttonIndex.B)
    const buttonSkill0 = game.control.getButtonInput(game.control.buttonIndex.L1)
    const buttonSkill1 = game.control.getButtonInput(game.control.buttonIndex.L2)
    const buttonSkill2 = game.control.getButtonInput(game.control.buttonIndex.R1)
    const buttonSkill3 = game.control.getButtonInput(game.control.buttonIndex.R2)

    // 이동 가능하거나, autoMoveFrame이 없을 때만 이동 가능합니다.
    if (this.isMoveEnable && this.autoMoveFrame <= 0) {
      if (buttonLeft) this.x -= this.moveSpeedX
      if (buttonRight) this.x += this.moveSpeedX
      if (buttonDown) this.y += this.moveSpeedY
      if (buttonUp) this.y -= this.moveSpeedY
    }

    // 화면 영역에서 벗어나는거 금지
    if (this.x < 0) this.x = 0
    if (this.x > game.graphic.CANVAS_WIDTH - this.width) this.x = game.graphic.CANVAS_WIDTH - this.width
    if (this.y < 0) this.y = 0
    if (this.y > game.graphic.CANVAS_HEIGHT - this.height) this.y = game.graphic.CANVAS_HEIGHT - this.height

    // 중앙 좌표값 설정
    this.centerX = this.x + (this.width / 2)
    this.centerY = this.y + (this.height / 2)

    // 무기 교체 버튼
    if (buttonA) {
      this.weaponSlotNumber++
      if (this.weaponSlotNumber >= this.weaponSlot.length) {
        this.weaponSlotNumber = 0
      }
    }

    // 스킬 슬롯 변경 버튼
    if (buttonB) this.usingSkillSlotA = !this.usingSkillSlotA

    // 스킬 사용 버튼
    if (buttonSkill0) this.useSkill(0)
    if (buttonSkill1) this.useSkill(1)
    if (buttonSkill2) this.useSkill(2)
    if (buttonSkill3) this.useSkill(3)
  }

  processAttack () {
    /**
     * @type {WeaponSlot}
     */
    const currentWeapon = this.weaponSlot[this.weaponSlotNumber]
    if (currentWeapon.weapon == null) return

    currentWeapon.delayCount++
    if (currentWeapon.delayCount >= currentWeapon.weapon.delay) {
      currentWeapon.weapon.create(this.attack, this.centerX, this.centerY)
      currentWeapon.delayCount -= currentWeapon.weapon.delay
    }
  }

  processSubAttack () {
    // 무기를 사용하지 않는 상태일경우, 서브웨폰도 사용하지 않습니다.
    if (this.weaponSlot[this.weaponSlotNumber].id === ID.playerWeapon.unused) return
    if (this.subWeaponSlot.weapon == null) return

    this.subWeaponSlot.delayCount++
    if (this.subWeaponSlot.delayCount >= this.subWeaponSlot.weapon.delay) {
      this.subWeaponSlot.weapon.create(this.attack, this.centerX, this.centerY)
      this.subWeaponSlot.delayCount -= this.subWeaponSlot.weapon.delay
    }
  }

  display () {
    if (this.isDied) {
      if (this.dieAfterDelayCount <= 60) {
        const dieImage = imageSrc.system.playerDie
        game.graphic.imageDisplay(dieImage, (this.dieAfterDelayCount % 10) * 20, 0, 20, 20, this.x - 20, this.y - 20, this.width * 2, this.height * 2)
      }
    } else {
      if (this.damageEnimationCount > 0) {
        let targetFrame = this.damageEnimationCount % this.playerImageData.frame
        let frameSliceX = targetFrame * this.playerImageData.width
        game.graphic.imageDisplay(this.playerImage, frameSliceX, this.playerImageData.y, this.playerImageData.width, this.playerImageData.height, this.x, this.y, this.width, this.height)
      } else {
        game.graphic.imageDisplay(this.playerImage, this.playerImageData.x, this.playerImageData.y, this.playerImageData.width, this.playerImageData.height, this.x, this.y, this.width, this.height)
      }

      if (this.levelupEnimationCount > 0) {
        let levelUpImage = imageSrc.system.playerLevelup
        let targetFrame = Math.floor((this.levelupEnimationCount % 16) / 4)
        let targetX = this.x - 15
        let targetY = this.y + Math.floor(this.levelupEnimationCount / 4) - 10
        game.graphic.imageDisplay(levelUpImage, (this.levelupEnimationCount % targetFrame) * 70, 0, 70, 15, targetX, targetY, 70, 15)
      }
    }
  }

  /**
   * player 데이터, 이 저장 데이터는 fieldData와 공식이 다릅니다.
   */
  //@ts-expect-error
  getSaveData () {
    return {
      // 좌표 값
      x: this.x,
      y: this.y,
      
      // 체력 및 쉴드
      hp: this.hp,
      shield: this.shield,
      shieldMax: this.shieldMax,

      // 딜레이
      attackDelayCount: this.attackDelayCount,
      dieAfterDelayCount: this.dieAfterDelayCount,

      // 무기
      weapon: this.getSaveWeaponData(),
      weaponSlotNumber: this.weaponSlotNumber,

      // 스킬
      skill: this.getSaveSkillData(),
      usingSkillSlotA: this.usingSkillSlotA,
    }
  }

  getSaveWeaponData () {
    // id, id, id, id, id
    // delayCount, delayCount, delayCount, delayCount
    let data = []
    for (let i = 0; i < this.weaponSlot.length; i++) {
      data.push({id: this.weaponSlot[i].id, delayCount: this.weaponSlot[i].delayCount})
    }

    return data
  }

  getSaveSkillData () {
    // 배열로 이루어진 오브젝트로 저장
    // 슬롯A, 슬롯B 한번에 저장됨.
    let data = []

    for (let i = 0; i < this.skillSlotA.length; i++) {
      data.push({
        id: this.skillSlotA[i].id,
        delayCount: this.skillSlotA[i].delayCount,
        coolTimeFrame: this.skillSlotA[i].coolTimeFrame,
        repeatCount: this.skillSlotA[i].repeatCount
      })
    }

    for (let i = 0; i < this.skillSlotB.length; i++) {
      data.push({
        id: this.skillSlotB[i].id,
        delayCount: this.skillSlotB[i].delayCount,
        coolTimeFrame: this.skillSlotB[i].coolTimeFrame,
        repeatCount: this.skillSlotB[i].repeatCount
      })
    }

    return data
  }

  /**
   * 저장되었던 플레이어 오브젝트를 불러옵니다.
   * 
   * 무기와 스킬도 같이 초기화되면서 불러와집니다.
   * @param {Object} saveData 
   */
  setLoadData (saveData) {
    for (let key in saveData) {
      if (typeof saveData[key] === 'object') {
        if (key === 'weapon') {
          this.setLoadWeaponData(saveData[key])
        } else if (key === 'skill') {
          this.setLoadSkillData(saveData[key])
        } else {
          this[key] = saveData[key]
        }
      } else {
        this[key] = saveData[key]
      }
    }
  }

  /**
   * 
   * @param {WeaponSlot[]} data 
   */
  setLoadWeaponData (data) {
    for (let i = 0; i < this.weaponSlot.length; i++) {
      this.weaponSlot[i].delayCount = data[i].delayCount
      this.weaponSlot[i].id = data[i].id
    }

    // 무기 슬롯 데이터 입력합니다.
    for (let i = 0; i < this.weaponSlot.length; i++) {
      let getClass = tamshooter4Data.getPlayerWeapon(this.weaponSlot[i].id)
      //@ts-expect-error
      this.weaponSlot[i].weapon = getClass != null ? new getClass() : null
    }
  }

  /**
   * 
   * @param {SkillSlot[]} data 
   */
  setLoadSkillData (data) {
    // 스킬은 슬롯에 상관없이 한번에 8개를 저장하기 때문에
    // 슬롯B 값은 +4 인덱스를 해서 가져와야 합니다.
    // 인덱스 초과 방지를 위해 skillSlotA.length로 배열 최대 길이 제한을 넣었습니다.
    for (let i = 0; i < this.skillSlotA.length; i++) {
      let indexA = i
      let indexB = i + 4

      this.skillSlotA[i].coolTimeFrame = data[indexA].coolTimeFrame
      this.skillSlotA[i].delayCount = data[indexA].delayCount
      this.skillSlotA[i].id = data[indexA].id
      this.skillSlotA[i].repeatCount = data[indexA].repeatCount

      this.skillSlotB[i].coolTimeFrame = data[indexB].coolTimeFrame
      this.skillSlotB[i].delayCount = data[indexB].delayCount
      this.skillSlotB[i].id = data[indexB].id
      this.skillSlotB[i].repeatCount = data[indexB].repeatCount
    }

    // 스킬 불러온 후 스킬 다시 초기화
    // 스킬 클래스 등록 (한번에 A, B 슬롯 두개를 등록하는건 귀찮아서...)
    // 여기서는 널 체크를 하지 않습니다. (process에서만 널 체크 진행)
    for (let i = 0; i < this.skillSlotA.length; i++) {
      const getIdA = this.skillSlotA[i].id
      const getIdB = this.skillSlotB[i].id
      const getSkillA = tamshooter4Data.getPlayerSkill(getIdA)
      const getSkillB = tamshooter4Data.getPlayerSkill(getIdB)

      // 널체크와 동시에 클래스 인스턴스 생성 (null일경우 생성하지 않음.)
      // @ts-expect-error
      this.skillSlotA[i].skill = getSkillA != null ? new getSkillA() : null

      // @ts-expect-error
      this.skillSlotB[i].skill = getSkillB != null ? new getSkillB() : null
    }
  }

  /**
   * 플레이어를 특정 위치로 튕겨나가게 합니다.
   * 
   * autoMove가 적용되는 동안 플레이어는 이동 가능 여부와 상관없이 이동을 할 수 없습니다.
   * 
   * 주의: 플레이어의 좌표를 변경하고 싶다면, 이 함수를 사용하는것이 아니라 플레이어의 x 또는 y 좌표를 직접 수정해야 합니다.
   * @param {number} finishX 도착지점의 x좌표
   * @param {number} finishY 도착지점의 y좌표
   * @param {number} totalFrame 도착지점까지 이동하는데 걸리는 시간
   */
  setAutoMove (finishX = 0, finishY = 0, totalFrame = 60) {
    this.autoMoveX = finishX
    this.autoMoveY = finishY
    this.autoMoveFrame = totalFrame
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
  /** @type {EnemyBulletData[]} */ static enemyBulletObject = []
  /** @type {FieldData[]} */ static spriteObject = []

  static getPlayerObject () { return this.playerObject }
  static getWeaponObject () { return this.weaponObject }
  static getEnemyObject () { return this.enemyObject }
  static getEffectObject () { return this.effectObject }
  static getDamageObject () { return this.damageObject }
  static getEnemyBulletObject () { return this.enemyBulletObject }
  static getSpriteObject () { return this.spriteObject }

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

  /**
   * fieldState에서 사용하는 모든 오브젝트를 리셋합니다.
   * player는 초기화되고, weapon, enemy, effect, sprite는 전부 삭제되며, damage는 사용안함 처리합니다.
   */
  static allObjectReset () {
    this.playerObject.init()
    this.weaponObject.length = 0
    this.enemyObject.length = 0
    this.effectObject.length = 0
    this.enemyBulletObject.length = 0
    this.spriteObject.length = 0
    for (let i = 0; i < this.damageObject.length; i++) {
      this.damageObject[i].isUsing = false
    }
  }

  /** 모든 적을 삭제합니다. */
  static allEnemyDelete () {
    for (let i = 0; i < this.enemyObject.length; i++) {
      this.enemyObject[i].isDeleted = true
    }
  }

  /** 현재 화면의 모든 스프라이트를 삭제합니다. */
  static allSpriteDelete () {
    for (let i = 0; i < this.spriteObject.length; i++) {
      this.spriteObject[i].isDeleted = true
    }
  }

  /** 모든 적을 죽입니다. 주의: 일부 적은 안통할 수도 있음... */
  static allEnemyDie () {
    for (let i = 0; i < this.enemyObject.length; i++) {
      this.enemyObject[i].requestDie()
    }
  }

  /**
   * 랜덤한 적 객체를 얻습니다. 다만, 이 객체가 삭제 예정이라면 함수의 리턴값은 null이 됩니다.
   * @returns {EnemyData | null} 적 오브젝트, 없으면 null
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
   * @param {number} typeId 타입의 id
   * @param {number} x
   * @param {number} y
   * @param {number} attack 공격력 (반드시 정수여야 함. Math.floor 연산 회피를 위해 여기서는 검사하지 않음.)
   * @param {any[]} addOption 추가옵션 (무기 클래스에 추가로 입력할 ...매개변수)
   */
  static createWeaponObject (typeId, x = 0, y = 0, attack = 1, ...addOption) {
    const GetClass = tamshooter4Data.getWeapon(typeId)
    if (GetClass == null) return
    
    /** @type {WeaponData} */
    //@ts-expect-error
    const inputData = new GetClass(addOption)
    inputData.createId = this.getNextCreateId()
    inputData.id = typeId
    inputData.setPosition(x, y)
    inputData.afterInitDefault(attack)
    this.weaponObject.push(inputData)
    return inputData
  }

  static createEnemyObject (typeId, x = 0, y = 0, ...option) {
    const GetClass = tamshooter4Data.getEnemy(typeId)
    if (GetClass == null) return

    /** @type {EnemyData} */
    //@ts-expect-error
    const inputData = new GetClass(option)
    inputData.createId = this.getNextCreateId()
    inputData.id = typeId
    inputData.setPosition(x, y)
    inputData.afterInitDefault()
    this.enemyObject.push(inputData)
    return inputData
  }

  /**
   * 해당 함수는 createEnemyObject랑 똑같은 기능을 수행하기 때문에 제외되었습니다.
   * 
   * 더이상 사용하지 마세요.
   * 
   * 보스를 생성하는데, 해당 보스 적 객체의 데이터랑 연결할 수 있도록 return이 추가되었습니다.
   * @deprecated
   */
  static createEnemyBoss (typeId, x = 0, y = 0, ...option) {
    const GetClass = tamshooter4Data.getEnemy(typeId)
    if (GetClass == null) return

    /** @type {EnemyData} */
    //@ts-expect-error
    const inputData = new GetClass(option)
    inputData.createId = this.getNextCreateId()
    inputData.id = typeId
    inputData.setPosition(x, y)
    inputData.afterInitDefault()
    this.enemyObject.push(inputData)
    return inputData // 보스로 생성된 적 객체는 리턴해서 객체를 가져올 수 있음.
  }

  /**
   * 이펙트를 생성합니다.
   * @param {number | CustomEffect | CustomEditEffect} typeId 
   * CustomEffect 인스턴스(CustomEffect.getObject() 를 사용해주세요.)
   * 
   * 또는 CustomEditEffect 클래스 또는 생성된 인스턴스
   * 
   * number는 더이상 사용하지 않습니다.
   *  
   * @param {any[]} option
   * @returns {EffectData | null | undefined} 리턴된 이펙트를 이용해서 일시적으로 객체를 조작할 수 있음.
   */
  static createEffectObject (typeId, x = 0, y = 0, repeatCount = 0, beforeDelay = 0, ...option) {
    if (typeof typeId === 'number') {
      const GetClass = tamshooter4Data.getEffect(typeId)
      if (GetClass == null) return
  
      /** @type {EffectData} */
      //@ts-expect-error
      const inputData = new GetClass(option)
      inputData.createId = this.getNextCreateId()
      inputData.id = typeId
      inputData.setPosition(x, y)
      // inputData.setOption(width, height)
      this.effectObject.push(inputData)
      return inputData
    } else {
      if (typeId == null) return null

      // 만약 생성자(클래스)가 들어왔다면, 해당 클래스의 인스턴스를 생성합니다.
      // 클래스가 들어올경우 함수 타입으로 들어옵니다. 그래서 타입이 함수인지를 구분합니다.
      if (typeof typeId === 'function') {
        //@ts-expect-error
        typeId = new typeId()
      }

      let customEffectObject
      if (typeId instanceof CustomEffect) {
        // 변수 이름 변경... 및 타입Id에 입력된 CustomEffectData에서 새 오브젝트를 얻어옴.
        /** @type {EffectData} */
        customEffectObject = typeId.getObject()
      } else if (typeId instanceof CustomEditEffect) {
        /** @type {EffectData} */
        customEffectObject = typeId // 새로 생성된 인스턴스
      } else {
        customEffectObject = null
      }

      // 커스텀 이펙트가 없으면 아무것도 하지 않습니다.
      if (customEffectObject == null) return null
      
      // 커스텀 이펙트의 객체가 들어올경우, 해당 객체를 곧바로 새로운 데이터에 넣습니다.
      // (구조 상 인스턴스만 변수로 넣을 수 있어서, 클래스 할당 과정을 거치지 않습니다.)
      customEffectObject.createId = this.getNextCreateId()
      customEffectObject.setPosition(x, y)
      this.effectObject.push(customEffectObject)
      return customEffectObject
    }
  }

  static damageObjectNumber = 0
  static createDamageObject (x = 0, y = 0, attack = 1) {
    // 데미지 보여주기 없으면 데미지와 관련된 객체 작업은 동작하지 않음.
    if (!fieldSystem.option.showDamage) return

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

  static createEnemyBulletObject (typeData, x = 0, y = 0, ...option) {
    // 함수(클래스)가 들어온경우, 클래스의 인스턴스를 생성함.
    if (typeof typeData === 'function') {
      typeData = new typeData()
    } else if (typeof typeData === 'object') {
      // 오브젝트 타입은 변수를 그대로 씀
    } else {
      // 그 외 타입은 무시
      return
    }

    /** @type {EnemyBulletData} */
    const inputData = typeData
    inputData.createId = this.getNextCreateId()
    inputData.setPosition(x, y)
    this.enemyBulletObject.push(inputData)

    return inputData
  }

  /**
   * 스프라이트 오브젝트를 생성합니다. (다만, 스프라이트는 FieldData와 동일한)
   * @param {FieldData | any} targetClass FieldData를 상속받아 만든 클래스
   * @param {number} x x좌표
   * @param {number} y y좌표
   */
  static createSpriteObject (targetClass, x = 0, y = 0)  {
    // 함수(클래스)가 들어온경우, 클래스의 인스턴스를 생성함.
    if (typeof targetClass === 'function') {
      targetClass = new targetClass()
    } else if (typeof targetClass === 'object') {
      // 오브젝트 타입은 변수를 그대로 씀
    } else {
      // 그 외 타입은 무시
      return
    }

    /** @type {FieldData} */
    const inputData = targetClass
    inputData.createId = this.getNextCreateId()
    inputData.setPosition(x, y)
    this.spriteObject.push(inputData)

    return inputData
  }

  static process () {
    this.processPlayerObject()
    this.processWeaponObject()
    this.processEnemyObject()
    this.processDamageObject()
    this.processEffectObject()
    this.processEnemyBulletObject()
    this.processSpriteObject()
  }

  static processPlayerObject () {
    this.playerObject.process()

    if (this.playerObject.y > game.graphic.CANVAS_HEIGHT - 80) {
      userSystem.hideUserStat()
    } else {
      userSystem.showUserStat()
    }
  }

  static processWeaponObject () {
    for (let i = 0; i < this.weaponObject.length; i++) {
      const currentObject = this.weaponObject[i]
      currentObject.process()
    }
    
    for (let i = 0; i < this.weaponObject.length; i++) {
      const currentObject = this.weaponObject[i]
      if (currentObject.isDeleted) {
        this.weaponObject.splice(i, 1)
      }
    }
  }

  static processEnemyObject () {
    for (let i = 0; i < this.enemyObject.length; i++) {
      const currentObject = this.enemyObject[i]
      currentObject.process()
    }
    
    // 버그 없는 삭제를 위해 제거 과정은 따로 진행되었습니다.
    // 해당 잠재적 설계 결함은, 무기, 적에게만 적용됩니다.
    for (let i = 0; i < this.enemyObject.length; i++) {
      const currentObject = this.enemyObject[i]
      if (currentObject.isDeleted) {
        this.enemyObject.splice(i, 1)
      }
    }
  }

  static processDamageObject () {
    if (!fieldSystem.option.showDamage) return

    for (let i = 0; i < this.damageObject.length; i++) {
      const currentDamage = this.damageObject[i]
      currentDamage.process()
    }
  }

  static processEffectObject () {
    for (let i = 0; i < this.effectObject.length; i++) {
      const currentEffect = this.effectObject[i]
      currentEffect.process()

      if (currentEffect.isDeleted) {
        this.effectObject.splice(i, 1)
      }
    }
  }

  static processEnemyBulletObject () {
    for (let i = 0; i < this.enemyBulletObject.length; i++) {
      const currentEnemyBullet = this.enemyBulletObject[i]
      currentEnemyBullet.process()

      if (currentEnemyBullet.isDeleted) {
        this.enemyBulletObject.splice(i, 1)
      }
    }
  }

  static processSpriteObject () {
    for (let i = 0; i < this.spriteObject.length; i++) {
      const currentSprite = this.spriteObject[i]
      currentSprite.process()

      if (currentSprite.isDeleted) {
        this.spriteObject.splice(i, 1)
      }
    }
  }

  static display () {
    this.displayEnemyObject()
    this.displayEffectObject()
    this.displayWeaponObject()
    this.displayEnemyBulletObject()
    this.displayDamageObject()
    this.displayPlayerObject()
    this.displaySpriteObject()
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
      if (fieldSystem.option.showEnemyHp) {
        this.displayEnemyHpMeter(currentEnemy)
      }
    }
  }

  /**
   * 적의 체력을 막대바로 표시합니다.
   * @param {EnemyData} currentEnemy 
   */
  static displayEnemyHpMeter (currentEnemy) {
    if (currentEnemy.isDied) return // 죽은 적은 체력 안보여줌

    let enemyHpPercent = currentEnemy.hp / currentEnemy.hpMax
    if (enemyHpPercent > 100) {
      enemyHpPercent = 100
    } else if (enemyHpPercent < 0) {
      enemyHpPercent = 0
    }

    const meterWidth = Math.floor(enemyHpPercent * currentEnemy.width)
    game.graphic.fillRect(currentEnemy.x, currentEnemy.y + currentEnemy.height - 1, currentEnemy.width, 2, 'red')
    game.graphic.fillRect(currentEnemy.x, currentEnemy.y + currentEnemy.height - 1, meterWidth, 2, 'green')
  }

  static displayDamageObject () {
    if (!fieldSystem.option.showDamage) return

    for (let i = 0; i < this.damageObject.length; i++) {
      const currentDamage = this.damageObject[i]
      currentDamage.display()
    }
  }

  static displayEffectObject () {
    // 참고: 이펙트는 투명도 70%가 적용됩니다. 100%은 눈아픔.
    game.graphic.setAlpha(0.7)

    for (let i = 0; i < this.effectObject.length; i++) {
      const currentEffect = this.effectObject[i]
      currentEffect.display()
    }

    game.graphic.setAlpha(1)
  }

  static displayEnemyBulletObject () {
    for (let i = 0; i < this.enemyBulletObject.length; i++) {
      const currentEnemyBullet = this.enemyBulletObject[i]
      currentEnemyBullet.display()
    }
  }

  static displaySpriteObject () {
    for (let i = 0; i < this.spriteObject.length; i++) {
      const currentSprite = this.spriteObject[i]
      currentSprite.display()
    }
  }
}

export class fieldSystem {
  /**
   * 현재 진행되고 있는 라운드
   * @type {RoundData | null}
   */
  static round = null

  /** 현재 상태값을 표시하는 ID */ static stateId = 0
  /** 일반적인 게임 진행 상태 */ static STATE_NORMAL = 0
  /** 게임 중 일시정지 */ static STATE_PAUSE = 1
  /** 라운드를 클리어 한 경우 */ static STATE_ROUND_CLEAR = 2
  /** 게임 오버가 된 경우 */ static STATE_GAME_OVER = 3
  /** 사용자가 라운드 진행을 중단하고 나간 경우 */ static STATE_EXIT = 4
  /** 로딩 중인 경우 */ static STATE_LOADING = 5
  /** 불러오기를 한 직후의 로딩 상태: 이것은 PAUSE를 유도하기 위해 만들어졌습니다. */ static STATE_LOADING_PAUSE = 6

  /** pause 상태일 때, 커서 번호 */ static cursor = 0
  /** 라운드 결과에 따른 지연시간이 진행된 정도 */ static exitDelayCount = 0
  /** 라운드를 클리어 했을 때, 지정된 프레임 만큼 시간이 지나면 자동으로 나갑니다. */ static EXIT_ROUND_CLEAR_DELAY = 360
  /** 게임 오버가 되었을 때, 지정된 프레임 만큼 시간이 지나면 자동으로 나갑니다. */ static EXIT_GAME_OVER_DELAY = 360
  /** 사용자가 나갔을 때, 지정된 프레임 만큼 시간이 지나면 자동으로 나갑니다. */ static EXIT_FAST_DELAY = 180
  /** 에니메이션의 최대 프레임 */ static SCORE_ENIMATION_MAX_FRAME = 60
  /** 점수 에니메이션이 표시되는 간격 */ static SCORE_ENIMATION_INTERVAL = 4
  /** 현재까지 진행된 에니메이션의 총 프레임 */ static scoreEnimationFrame = 0
  /** 총 점수 */ static totalScore = 0
  /** 필드 점수 (필드 내에서 획득한 모든 점수) */ static fieldScore = 0

  /** 옵션 설정 값 */
  static option = {
    soundOn: true,
    musicOn: true,
    resultAutoSkip: true,
    showEnemyHp: true,
    showDamage: true,
  }

  /** 
   * 다른 객체에서 이 객체를 참조하는 도중에 전달되는 메세지 값  
   * 
   * 현재는 쉼표를 기준으로 split함.
   * 
   * (다만 규칙은 정해진게 없음.)
   */
  static message = ''
  
  /** field에서 사용하는 메세지의 리스트 */
  static messageList = {
    /** gameSystem의 stateId를 STATE_FILED로 변경 요청합니다. */ STATE_FIELD: 'state:field',
    /** gameSystem의 stateId를 STATE_MAIN로 변경 요청합니다. */ STATE_MAIN: 'state:main',
    /** gameSystem의 option중 musicOn의 옵션을 변경 요청합니다. */ CHANGE_MUSICON: 'change:musicOn',
    /** gameSystem의 option중 soundOn의 옵션을 변경 요청합니다. */ CHANGE_SOUNDON: 'change:soundOn',
    /** gameSystem의 text1 라인에 출력할 텍스트 값을 입력합니다. */ INPUT_TEXT_LINE1: 'input1, ',
    /** 
     * gameSystem이 저장 기능을 강제로 호출하게 함(원래는 1초에 1번씩 자동 저장이지만, 이 경우에는 강제로 저장됨) 
     * 
     * 이 메세지는, 필드 시스템에서 결과 창이 출력한 직후 새로고침하거나 불러오기를 할 때 결과창이 다시 출력되지 않도록 하고
     * 메인 화면으로 이동시키는것이 목적입니다.
     */
    REQUEST_SAVE: 'request:save'
  }

  /** 
   * 필드에서 점수를 강제로 추가하도록 요청합니다. (단 점수를 감소할 수 없음)
   * 
   * 라운드 진행 상황에 따라 점수를 추가하고 싶다면, 다음 함수를 사용해주세요.
   * 
   * 주의: 필드 스코어 변수를 직접 수정하면 안됩니다. 점수가 추가되는 과정에서 플레이어의 경험치를 추가해야 하기 때문입니다.
   */
  static requestAddScore (score = 0) {
    if (score < 0) return

    this.fieldScore += score
    this.totalScore += score
    fieldState.playerObject.addExp(score)
  }

  /**
   * 라운드 오브젝트를 생성하고 이 객체을 리턴합니다.
   */
  static createRound (roundId = 0) {
    const RoundClass = tamshooter4Data.getRound(roundId)
    if (RoundClass == null) return

    //@ts-expect-error
    // 라운드 데이터
    let getObject = new RoundClass()
    getObject.id = roundId // 라운드의 id를 입력해야 합니다. (다른곳에서는 입력하지 않음.)

    return getObject
  }

  /**
   * 라운드를 시작합니다. 필드 초기화 작업 및 라운드 설정 작업을 진행합니다.
   * 다만, 라운드가 없을경우, 라운드는 시작하지 않습니다.
   */
  static roundStart (roundId = 0) {
    this.round = this.createRound(roundId)
    if (this.round == null) {
      this.message = this.messageList.STATE_MAIN
      return
    }

    // 라운드가 시작되는 순간, 게임 상태가 필드로 변경되고, 게임이 시작됩니다.
    // 이 과정에서 필드 데이터에 대해 초기화가 진행됩니다.
    this.roundImageSoundLoad() // 라운드 데이터 로드

    this.message = this.messageList.STATE_FIELD
    fieldState.allObjectReset()
    this.stateId = this.STATE_LOADING // 로딩 먼저 시작하고, 이것이 완료되면 로딩 과정을 생략
    this.cursor = 0
    this.enimationFrame = 0
    this.exitDelayCount = 0
    this.totalScore = 0
    this.fieldScore = 0

    // 참고: 배경음악 재생 및 처리는 라운드 내부에서 처리합니다. 필드에서 처리하지 않습니다.
    if (this.getRoundImageSoundLoadComplete()) {
      this.stateId = this.STATE_NORMAL // 로드 완료시 자동으로 일반상태로 변경
      // 아닌경우에는, 다시 로딩체크를 합니다. (process에서 추가로 진행)
    }
  }

  /** 라운드에서 사용할 이미지와 사운드 파일을 로드합니다. */
  static roundImageSoundLoad () {
    if (this.round == null) return
    this.round.load.loadStart()
  }

  static getRoundImageSoundLoadComplete () {
    if (this.round != null && this.round.load.check()) {
      return true
    } else {
      return false
    }
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
    if (this.option.resultAutoSkip) {
      this.message = this.messageList.STATE_MAIN
    } else {
      gameVar.statLineText1.text = 'ANY BUTTON TO CONTINUE...'
      if (game.control.getButtonAnykey()) {
        this.message = this.messageList.STATE_MAIN 
      }
    }
  }

  /**
   * 점수 사운드 출력
   */
  static scoreSound () {
    if (this.exitDelayCount < this.SCORE_ENIMATION_MAX_FRAME 
      && this.exitDelayCount % this.SCORE_ENIMATION_INTERVAL === 0
      && this.totalScore >= 1) {
      game.sound.play(soundSrc.system.systemScore)
    }
  }

  /**
   * 일시 정지 상태에서의 처리
   */
  static processPause () {
    const buttonDown = game.control.getButtonInput(game.control.buttonIndex.DOWN)
    const buttonUp = game.control.getButtonInput(game.control.buttonIndex.UP)
    const buttonSelect = game.control.getButtonInput(game.control.buttonIndex.START)
    const maxMenuNumber = 3
    game.sound.musicPause() // 일시정지 상태에서는 음악이 재생되지 않음.
    game.sound.setEchoDisable() // 에코 기능 정지
    // game.sound.setMusicEcho() // 에코 기능 정지 [음악은 정지해야할지 잘 모르겠음]

    if (buttonUp && this.cursor > 0) {
      this.cursor--
      game.sound.play(soundSrc.system.systemCursor)
    } else if (buttonDown && this.cursor < maxMenuNumber) {
      this.cursor++
      game.sound.play(soundSrc.system.systemCursor)
    }

    if (buttonSelect) {
      switch (this.cursor) {
        case 0:
          this.stateId = this.STATE_NORMAL // pause 상태 해제
          if (this.round != null) { // round 음악 다시 재생
            this.round.sound.musicPlay()
          }
          break
        case 1:
          this.message = this.messageList.CHANGE_SOUNDON
          break
        case 2:
          this.message = this.messageList.CHANGE_MUSICON
          break
        case 3:
          this.stateId = this.STATE_EXIT // 라운드를 나감
          break
      }
    }
  }

  static processLoad () {
    if (this.getRoundImageSoundLoadComplete()) {
      if (this.stateId === this.STATE_LOADING) {
        this.stateId = this.STATE_NORMAL
      } else {
        this.stateId = this.STATE_PAUSE
      }
    }
  }

  static processExit () {
    // 사용자가 나가면 현재까지 얻은 점수를 보여줌, 따로 출력할 배경 사운드는 없음
    this.scoreSound()
    if (this.exitDelayCount === 0) {
      this.message = this.messageList.REQUEST_SAVE // 강제 저장을 통해 필드 저장 데이터를 삭제하고, 메인화면으로 돌아가게끔 유도
    }

    this.scoreEnimationFrame++
    this.exitDelayCount++

    if (this.exitDelayCount >= this.EXIT_FAST_DELAY) {
      this.roundExit()
    }
  }

  static processRoundClear () {
    // 라운드 클리어 사운드 재생 (딜레이카운트가 0일때만 재생해서 중복 재생 방지)
    if (this.exitDelayCount === 0 && this.round != null) {
      game.sound.play(soundSrc.system.systemRoundClear)
      userSystem.plusExp(this.round.stat.clearBonus)
      this.totalScore = this.fieldScore + this.round.stat.clearBonus
      this.message = this.messageList.REQUEST_SAVE // 강제 저장을 통해 필드 저장 데이터를 삭제하고, 메인화면으로 돌아가게끔 유도
    }

    this.scoreSound()

    this.scoreEnimationFrame++
    this.exitDelayCount++

    if (this.exitDelayCount >= this.EXIT_ROUND_CLEAR_DELAY) {
      this.roundExit()
    }
  }

  static processGameOver () {
    // 라운드 실패 사운드 재생 (딜레이카운트가 0일때만 재생해서 중복 재생 방지)
    if (this.exitDelayCount === 0) {
      game.sound.play(soundSrc.system.systemGameOver)
      this.message = this.messageList.REQUEST_SAVE // 강제 저장을 통해 필드 저장 데이터를 삭제하고, 메인화면으로 돌아가게끔 유도
    }

    this.scoreSound()

    this.scoreEnimationFrame++
    this.exitDelayCount++

    if (this.exitDelayCount >= this.EXIT_GAME_OVER_DELAY) {
      this.roundExit()
    }
  }

  static processNormal () {
    const buttonPause = game.control.getButtonInput(game.control.buttonIndex.START)
    if (this.round == null) return

    if (buttonPause) {
      game.sound.play(soundSrc.system.systemPause)
      this.stateId = this.STATE_PAUSE
    } else if (this.round.clearCheck()) {
      this.stateId = this.STATE_ROUND_CLEAR
    } else if (fieldState.playerObject.isDied && fieldState.playerObject.dieAfterDelayCount >= 120) {
      this.stateId = this.STATE_GAME_OVER
    }

    this.round.process()
    fieldState.process()

    gameVar.statLineText2.setStatLineText(this.getFieldDataString(), this.round.time._currentTime, this.round.stat.finishTime, '#D5F5E3' ,'#33ff8c')
  }

  /**
   * 라운드 시간이 일시정지 되었을 때에 대한 메세지 출력 함수
   */
  static processRoundTimePaused () {
    if (this.round == null) return

    // 게임이 일시정지 되지 않는다면 해당 메세지는 표시되지 않습니다.
    if (!this.round.time.currentTimePaused) {
      gameVar.statLineText1.text = ''
      return
    }

    if (this.round.time.currentTimePausedMessage === '') {
      gameVar.statLineText1.text = 'enemy count left: ' + fieldState.enemyObject.length
    } else {
      gameVar.statLineText1.text = this.round.time.currentTimePausedMessage
    }
  }

  static process () {
    // game.sound.musicProcess()
    this.processRoundTimePaused()

    switch (this.stateId) {
      case this.STATE_PAUSE:
        game.sound.musicPause()
        this.processPause()
        break
      case this.STATE_ROUND_CLEAR:
        game.sound.musicStop()
        this.processRoundClear()
        break
      case this.STATE_GAME_OVER:
        game.sound.musicStop()
        this.processGameOver()
        break
      case this.STATE_EXIT:
        game.sound.musicStop()
        this.processExit()
        game.control.getButtonInput(game.control.buttonIndex.START) // 버튼 중복 누르기 방지용
        break
      case this.STATE_LOADING:
      case this.STATE_LOADING_PAUSE:
        this.processLoad()
        break
      default:
        this.processNormal()
        break
    }
  }

  static display () {
    if (this.stateId === this.STATE_LOADING || this.stateId === this.STATE_LOADING_PAUSE) {
      this.displayLoading()
      return
    }

    // 라운드, 필드스테이트, 필드데이터는 항상 출력됩니다.
    if (this.round) this.round.display()
    fieldState.display()
    // this.displayFieldData()

    switch (this.stateId) {
      case this.STATE_PAUSE:
        this.displayPause()
        break
      case this.STATE_ROUND_CLEAR:
      case this.STATE_GAME_OVER:
      case this.STATE_EXIT:
        this.displayResult()
        break
      case this.STATE_LOADING:
        break
    }
  }

  /** 로딩 중인 하면을 출력합니다. */
  static displayLoading () {
    game.graphic.fillRect(0, 0, game.graphic.CANVAS_WIDTH, 100, 'grey')
    digitalDisplay('tamshooter4 loading system', 0, 0)
    if (this.round != null) {
      let loadStatus = this.round.load.getStatus()
      digitalDisplay(loadStatus[0], 0, 20)
      digitalDisplay(loadStatus[1], 0, 40)
      digitalDisplay(loadStatus[2], 0, 60)
    }
  }

  static displayPause () {
    const image = imageSrc.system.fieldSystem
    const imageDataPause = imageDataInfo.fieldSystem.pause
    const imageDataMenu = imageDataInfo.fieldSystem.menu
    const imageDataArrow = imageDataInfo.fieldSystem.arrow
    const imageDataChecked = imageDataInfo.fieldSystem.checked
    const imageDataUnchecked = imageDataInfo.fieldSystem.unchecked
    const imageDataSelected = imageDataInfo.fieldSystem.selected
    const MID_X = (game.graphic.CANVAS_WIDTH / 2) - (imageDataPause.width / 2)
    const MID_Y = 100
    const MENU_X = (game.graphic.CANVAS_WIDTH / 2) - (imageDataMenu.width / 2)
    const MENU_Y = 100 + imageDataInfo.fieldSystem.pause.height
    const ARROW_X = MENU_X - imageDataArrow.width
    const ARROW_Y = MENU_Y + (this.cursor * imageDataArrow.height)
    const CHECK_X = MENU_X + imageDataMenu.width
    const CHECK_SOUND_Y = MENU_Y + imageDataChecked.height
    const CHECK_MUSIC_Y = MENU_Y + imageDataChecked.height * 2
    const SELECT_X = MENU_X
    const SELECT_Y = ARROW_Y
    const SCORE_X = (game.graphic.CANVAS_WIDTH / 2) - 200
    const SCORE_Y = MENU_Y + imageDataMenu.height
    const imageDataSoundOn = this.option.soundOn ? imageDataChecked : imageDataUnchecked // 사운드의 이미지데이터는 코드 길이를 줄이기 위해 체크/언체크에 따른 이미지 데이터를 대신 입력함
    const imageDataMusicOn = this.option.musicOn ? imageDataChecked : imageDataUnchecked

    game.graphic.imageDisplay(image, imageDataPause.x, imageDataPause.y, imageDataPause.width, imageDataPause.height, MID_X, MID_Y, imageDataPause.width, imageDataPause.height)
    game.graphic.imageDisplay(image, imageDataMenu.x, imageDataMenu.y, imageDataMenu.width, imageDataMenu.height, MENU_X, MENU_Y, imageDataMenu.width, imageDataMenu.height)
    game.graphic.imageDisplay(image, imageDataArrow.x, imageDataArrow.y, imageDataArrow.width, imageDataArrow.height, ARROW_X, ARROW_Y, imageDataArrow.width, imageDataArrow.height)
    game.graphic.imageDisplay(image, imageDataSoundOn.x, imageDataSoundOn.y, imageDataSoundOn.width, imageDataSoundOn.height, CHECK_X, CHECK_SOUND_Y, imageDataSoundOn.width, imageDataSoundOn.height)
    game.graphic.imageDisplay(image, imageDataMusicOn.x, imageDataMusicOn.y, imageDataMusicOn.width, imageDataMusicOn.height, CHECK_X, CHECK_MUSIC_Y, imageDataMusicOn.width, imageDataMusicOn.height)
    game.graphic.imageDisplay(image, imageDataSelected.x, imageDataSelected.y, imageDataSelected.width, imageDataSelected.height, SELECT_X, SELECT_Y, imageDataSelected.width, imageDataSelected.height)
    game.graphic.fillRect(SCORE_X, SCORE_Y, 400, 30, '#AEB68F')
    digitalDisplay('score: ' + this.totalScore, SCORE_X + 5, SCORE_Y + 5)
  }

  /**
   * 결과 화면을 출력합니다. roundClear, gameOver, processExit 상태 모두 동일한 display 함수 사용
   */
  static displayResult () {
    const image = imageSrc.system.fieldSystem
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

    titleX = (game.graphic.CANVAS_WIDTH - imageData.width) / 2

    let viewScore = this.totalScore * (this.exitDelayCount / this.SCORE_ENIMATION_MAX_FRAME)
    if (viewScore >= this.totalScore) viewScore = this.totalScore

    let clearBonus = 0
    if (this.stateId === this.STATE_ROUND_CLEAR && this.round != null) {
      clearBonus = this.round.stat.clearBonus
    }

    game.graphic.imageDisplay(image, imageData.x, imageData.y, imageData.width, imageData.height, titleX, titleY, imageData.width, imageData.height)
    game.graphic.fillRect(TEXT_X, TEXT_Y - 4, 400, TEXT_HEIGHT * 4, 'lime')
    digitalDisplay('field score: ' + this.fieldScore, TEXT_X, TEXT_Y)
    digitalDisplay('clear bonus: ' + clearBonus, TEXT_X, TEXT_Y + (TEXT_HEIGHT * 1))
    digitalDisplay('-----------: ' + 0, TEXT_X, TEXT_Y + (TEXT_HEIGHT * 2))
    digitalDisplay('total score: ' + Math.floor(viewScore), TEXT_X, TEXT_Y + (TEXT_HEIGHT * 3))
  }

  /**
   * 이 함수는 더이상 사용되지 않습니다.
   * processNormal에서 필드 스탯이 출력되도록 변경되었습니다.
   * @deprecated
   */
  static displayFieldData () {
    const LAYER_X = game.graphic.CANVAS_WIDTH_HALF
    const LAYER_Y = 570
    const LAYER_DIGITAL_Y = 570 + 5
    const HEIGHT = 30
    const roundText = this.round != null ? this.round.stat.roundText : 'NULL'
    const currentTime = this.round != null ? this.round.time._currentTime : '999'
    const finishTime = this.round != null ? this.round.stat.finishTime : '999'
    const plusTime = this.round != null ? this.round.time.plusTime : '0'
    const meterMultiple = Number(currentTime) / Number(finishTime)
    game.graphic.fillRect(LAYER_X, LAYER_Y, game.graphic.CANVAS_WIDTH_HALF, HEIGHT, 'silver')
    game.graphic.fillRect(LAYER_X, LAYER_Y, game.graphic.CANVAS_WIDTH_HALF * meterMultiple, HEIGHT, '#D5F5E3')
    digitalDisplay(`R:${roundText}, T:${currentTime}/${finishTime} + ${plusTime}`, LAYER_X + 5, LAYER_DIGITAL_Y)

  }

  static getFieldDataString () {
    if (this.round != null) {
      const roundText = this.round.stat.roundText
      const currentTime = this.round.time._currentTime
      const finishTime = this.round.stat.finishTime
      const plusTime = this.round.time.plusTime
      const sign = plusTime >= 0 ? '+' : '' // 플러스 마이너스 구분 // 의외로 마이너스부분도 같이 출력됨

      return `R:${roundText}, T:${currentTime}/${finishTime} ${sign}${plusTime}`
    } else {
      return `NO DATA`
    }
  }


  /**
   * 저장할 데이터를 얻습니다.
   */
  static getSaveData () {
    let weapon = fieldState.weaponObject.map((data) => {
      return data.getSaveData()
    })
    let enemy = fieldState.enemyObject.map((data) => {
      return data.getSaveData()
    })
    // let sprite = fieldState.spriteObject.map((data) => {
    //   return data.getSaveData()
    // })
    let player = fieldState.playerObject.getSaveData()
    let round = this.getRoundSaveData()
    let field = {
      stateId: this.stateId,
      fieldScore: this.fieldScore,
      totalScore: this.totalScore,
      enimationFrame: this.scoreEnimationFrame,
      exitDelayCount: this.exitDelayCount,
    }
    
    return {
      weapon,
      enemy,
      player,
      round,
      field,
    }
  }

  /**
   * 널 체크 문제 때문에 이 함수를 만듬...
   */
  static getRoundSaveData () {
    if (this.round != null) {
      return this.round.getSaveData()
    } else {
      return null
    }
  }

  /**
   * 필드 상태를 불러옵니다. (반드시 JSON데이터를 parse해서 입력해야 합니다. string을 그냥 입력할 수 없습니다.)
   * @param {any} loadData parse된 JSON 데이터 (localStoarge에서 얻어온 값을 그대로 이 함수에 사용하지 마세요.)
   */
  static setLoadData (loadData) {
    if (typeof loadData === 'string') {
      throw new Error('save data field is string, this data need using JSON.parse.')
    }

    // JSON으로 얻은 오브젝트는 함수가 없기 때문에, 클래스로 데이터를 생성한 후에
    // 세이브 데이터를 이용해 for in을 사용하여 각 객체들의 속성값을 넣어줍니다.

    for (let current of loadData.weapon) {
      let newData = fieldState.createWeaponObject(current.id, current.x, current.y, current.attack)
      if (newData != null) {
        newData.setLoadData(current)
      }
    }

    for (let current of loadData.enemy) {
      let newData = fieldState.createEnemyObject(current.id, current.x, current.y)
      if (newData != null) {
        newData.setLoadData(current)
      }
    }

    // for (let current of loadData.sprite) {
    //   let newData = fieldState.createSpriteObject(FieldData, current.x, current.y)
    //   if (newData != null) {
    //     newData.setLoadData(current)
    //   }
    // }

    // for (let current of loadData.enemyBullet) {
    //   let newData = fieldState.createEnemyBulletObject(current.id, current.x, current.y, current.attack)
    //   for (let key in newData) {
    //     newData[key] = current[key]
    //   }
    // }

    // 플레이어는 배열이 아닌 단일 객체
    // 플레이어 객체는 fieldState에서 이미 생성되어 있으므로, 새로 생성할 필요는 없습니다.
    fieldState.playerObject.init() // 플레이어 데이터 초기화
    fieldState.playerObject.setLoadData(loadData.player) // 저장된 데이터 입력

    // 라운드는 단일 객체, 다만 라운드 데이터 입력 전에 라운드 객체를 생성해야 합니다.
    this.round = this.createRound(loadData.round.id)
    if (this.round == null) {
      throw new Error('round id error. game load fail')
    }

    this.round.setLoadData(loadData.round) // 저장된 데이터 불러오기
    this.roundImageSoundLoad() // 라운드 이미지 사운드 로드
    
    // 필드 불러오기
    this.stateId = loadData.field.stateId
    this.fieldScore = loadData.field.fieldScore
    this.totalScore = loadData.field.totalScore
    this.enimationFrame = loadData.field.enimationFrame
    this.exitDelayCount = loadData.field.exitDelayCount
    
    // 데이터 표시를 위한 1프레임 진행
    this.processNormal()

    // 게임을 불러오기 했다면, 일시정지 상태가 됩니다.
    this.stateId = this.STATE_LOADING_PAUSE
  }
}
