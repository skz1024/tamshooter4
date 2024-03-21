//@ts-check

import { ID } from "./dataId.js"

/**
 * 무기의 기본 스탯 정보 (무기의 로직 구현은 weaponData에서 진행합니다.)
 */
export class StatWeapon {
  /**
   * 무기의 기본 스탯 정보 (무기의 로직 구현은 weaponData에서 진행합니다.)
   * 
   * @param {string} mainType 메인타입
   * @param {string} subType 서브타입
   * @param {number} repeatCount 해당 무기의 공격 반복 횟수, 이 값은 기본 1, 반복 횟수가 2 이상인 경우 그만큼 무기는 적을 반복 공격할 수 있음.
   * @param {number} repeatDelay 1번 반복시 걸리는 지연 대기 시간(단위: 프레임)
   * @param {boolean} isChase 추적 여부 (true일경우 적을 추적함.)
   * @param {boolean} isMultiTarget 다중 타켓 여부(이 값이 true면 스플래시 공격)
   * @param {number} maxTarget 
   * isMultiTarget이 true일경우, 한 번 공격당 한번에 적을 타격할 수 있는 개수 (스플래시 최대 마리 수 제한)
   * 
   * isMultiTarget이 false일경우, 한번 공격 로직을 수행했을 때, 타격할 수 있는 적의 개수 (한번 공격당 반복횟수 1을 소모하고, 스플래시 공격이 아님, 
   * 모든 반복 횟수 소모시에는 남은 타겟 수와 상관없이 해당 무기는 사라짐)
   */
  constructor (mainType, subType, repeatCount = 1, repeatDelay = 0, isChase = false, isMultiTarget = false, maxTarget = 20) {
    this.mainType = mainType
    this.subType = subType
    this.isChase = isChase
    this.repeatCount = repeatCount
    this.repeatDelay = repeatDelay
    this.isMultiTarget = isMultiTarget
    this.maxTarget = maxTarget
  }
}

/**
 * 플레이어가 사용하는 무기에 대한 스탯 정보
 */
export class StatPlayerWeapon {
  /**
   * 플레이어가 사용하는 무기에 대한 스탯 정보
   * @param {string} name 무기의 이름
   * @param {number} delay 무기가 각 발사되기 까지의 지연시간
   * @param {number} attackMultiple 공격 배율 (기본값 1, 1보다 높으면 )
   * @param {number} shotCount 무기가 발사될 때 동시에 발사되는 개수
   * @param {number} attackCount 해당 무기의 공격횟수(해당 무기의 repeatCount랑 동일)
   * @param {number[]} weaponIdList 플레이어무기에서 사용하는 실제 무기 idList (여러개가 있으면 여러개의 무기를 사용)
   */
  constructor (name, delay, attackMultiple, shotCount, attackCount = 1, weaponIdList = [ID.weapon.unused]) {
    this.name = name
    this.delay = delay
    this.attackMultiple = attackMultiple
    this.shotCount = shotCount
    this.attackCount = attackCount
    this.weaponIdList = weaponIdList
  
    /** 무기 공격력 (기준값 10000 기준으로 무기의 예상 공격력 계산) */
    this.weaponAttack = this.getCurrentAttack()
  }

  /** 자신의 현재 공격력과 관련된 무기 공격력을 얻습니다. */
  getCurrentAttack (attack = 10000) {
    let totalDamage = (attack * this.attackMultiple) // 참고: 스킬 상수는 0.8을 곱해야 합니다.
    let divide = this.shotCount * this.attackCount * (60 / this.delay)
    if (isNaN(divide)) divide = 0

    // 0으로 나누기될경우, 강제로 0을 리턴
    /** 무기 공격력 (기준값 10000 기준으로 무기의 예상 공격력 계산) */
    return divide !== 0 ? Math.floor(totalDamage / divide) : 0
  }
}

/**
 * 플레이어가 사용하는 스킬에 대한 스탯 정보
 */
export class StatPlayerSkill {
  /**
   * 플레이어가 사용하는 스킬에 대한 스탯 정보
   * @param {string} name 스킬의 이름
   * @param {number} coolTime 스킬의 쿨타임 (초)
   * @param {number} delay 스킬의 각 무기가 한번 반복할 때 발사 당 지연 시간
   * @param {number} attackMultiple 무기의 공격 배율(기본값 1) 이 숫자가 높으면 공격력 증가
   * @param {number} shotCount 한번 발사 시에 나오는 무기의 개수
   * @param {number} repeatCount 스킬의 각 무기가 반복 발사되는 횟수
   * @param {number} attackCount 무기가 가지고 있는 repeatCount
   * @param {number[]} weaponIdList 플레이어스킬에서 실제 사용하는 무기의 idList
   */
  constructor (name = 'nothing', coolTime = 20, delay = 0, attackMultiple = 1, shotCount = 1, repeatCount = 1, attackCount = 1, weaponIdList = [ID.weapon.unused]) {
    this.name = name
    this.coolTime = coolTime
    this.delay = delay
    this.multiple = attackMultiple
    this.shot = shotCount
    this.repeat = repeatCount
    this.hit = attackCount
    this.weaponIdList = weaponIdList

    // 0으로 나누기 금지
    /** 무기 공격력 (기준값 10000 기준으로 무기의 예상 공격력 계산) */
    this.weaponAttack = this.getCurrentAttack()
  }

  /** 자신의 현재 공격력과 관련된 무기 공격력을 얻습니다. */
  getCurrentAttack (attack = 10000) {
    let totalDamage = (attack * this.coolTime * this.multiple) * 0.8 // 참고: 스킬 상수는 0.8을 곱해야 합니다.
    let divide = this.shot * this.repeat * this.hit

    // 0으로 나누기될경우, 강제로 0을 리턴
    return divide !== 0 ? Math.floor(totalDamage / divide) : 0
  }
}

/**
 * 각 라운드에 대한 기본적인 정보
 * 
 * (라운드의 구현은 dataRound.js에서 처리합니다. 이 클래스는 스탯값만 정의하고 알고리즘 또는 라운드 구현을 하지 않습니다.)
 */
export class StatRound {
  /**
   * 각 라운드에 대한 기본적인 정보
   * 
   * 주의: 이 값들은 절대적인 기준을 표현하지만, 일부 라운드는 예외가 있을 수 있습니다. (그러나, 극히 일부 라운드만 이 기준과는 조금 다른 기준을 사용합니다.)
   * 
   * (라운드의 구현은 dataRound.js에서 처리합니다. 이 클래스는 스탯값만 정의하고 알고리즘 또는 라운드 구현을 하지 않습니다.)
   * 
   * (참고: 입력될 내용의 문자열이 길 수 있기 때문에 roundInfo는 맨 마지막 매개변수로 지정되었습니다.)
   * @param {string} roundText 라운드 값을 표시할 텍스트, 예시: 1-1, 한글 사용 금지, 일부 기호와 알파벳만 사용가능, 최대 5글자까지 지원(검사하진 않음...)
   * @param {string} roundName 라운드의 이름
   * @param {number} requireLevel 해당 라운드를 플레이하기 위한 최소 레벨 (해당 레벨 이상만 플레이 가능)
   * @param {number} standardPower 기준 파워(전투력) 해당 라운드에서 얼마만큼의 전투력을 기준으로 적을 배치했는지에 대한 값
   * @param {number} finishTime 종료 시간(단위: 초), 해당 라운드를 클리어 하기 위해 사용해야 하는 시간 (단, 이것은 기준 시간이며, 일부 라운드는 특정 상황이 되면 강제로 클리어 할 수 있음.)
   * @param {number} clearBonus 
   * @param {string} roundInfo 
   */
  constructor (roundText = 'NULL', roundName = 'NULL', requireLevel = 0, standardPower = 0, finishTime = 1, clearBonus = 0, roundInfo = '') {
    this.roundText = roundText
    this.roundName = roundName
    this.requireLevel = requireLevel
    this.standardPower = standardPower
    this.finishTime = finishTime
    this.clearBonus = clearBonus
    this.roundInfo = roundInfo

    // 추가적인 옵션 자동 설정
    this.minPower = Math.floor(standardPower * 0.8)
  }
}

/**
 * 외부에서 사용하기 위한 weapon 스탯 객체
 * @type {Map<number, StatWeapon>}
 */
export const dataExportStatWeapon = new Map()
dataExportStatWeapon.set(ID.weapon.multyshot, new StatWeapon('multyshot', 'multyshot'))
dataExportStatWeapon.set(ID.weapon.missile, new StatWeapon('missile', 'missileA', 5, 6, true, true, 40))
dataExportStatWeapon.set(ID.weapon.missileRocket, new StatWeapon('missile', 'missileB', 6, 6, false, true, 40))
dataExportStatWeapon.set(ID.weapon.arrow, new StatWeapon('arrow', 'arrow'))
dataExportStatWeapon.set(ID.weapon.laser, new StatWeapon('laser', 'laser', 5, 0, false, false, 16))
dataExportStatWeapon.set(ID.weapon.laserBlue, new StatWeapon('laser', 'laserBlue', 5, 16, true))
dataExportStatWeapon.set(ID.weapon.sapia, new StatWeapon('sapia', 'sapia', 4, 10, true))
dataExportStatWeapon.set(ID.weapon.sapiaShot, new StatWeapon('sapia', 'sapiaShot', 1, 10, true))
dataExportStatWeapon.set(ID.weapon.parapo, new StatWeapon('parapo', 'parapo', 1, 0, true))
dataExportStatWeapon.set(ID.weapon.parapoShockWave, new StatWeapon('parapo', 'shockWave', 1, 0, false, true, 16))
dataExportStatWeapon.set(ID.weapon.blaster, new StatWeapon('blaster', 'blaster', 1, 0, false))
dataExportStatWeapon.set(ID.weapon.blaster, new StatWeapon('blaster', 'blastermini', 1, 0, false))
dataExportStatWeapon.set(ID.weapon.sidewave, new StatWeapon('sidewave', 'sidewave'))
dataExportStatWeapon.set(ID.weapon.ring, new StatWeapon('ring', 'ring'))
dataExportStatWeapon.set(ID.weapon.seondanil, new StatWeapon('seondanil', 'seondanil'))
dataExportStatWeapon.set(ID.weapon.boomerang, new StatWeapon('boomerang', 'boomerang', 10, 0, false, false, 10))
dataExportStatWeapon.set(ID.weapon.subMultyshot, new StatWeapon('subweapon', 'subweapon'))
//
dataExportStatWeapon.set(ID.weapon.skillMultyshot, new StatWeapon('skill', 'multyshot', 1, 0, true))
dataExportStatWeapon.set(ID.weapon.skillMissile, new StatWeapon('skill', 'missile', 10, 4, true, true, 40))
dataExportStatWeapon.set(ID.weapon.skillArrow, new StatWeapon('skill', 'arrow', 4, 0, false, false, 4))
dataExportStatWeapon.set(ID.weapon.skillLaser, new StatWeapon('skill', 'laser', 60, 4, false, true, 20))
dataExportStatWeapon.set(ID.weapon.skillSapia, new StatWeapon('skill', 'sapia', 40, 6, true, true, 4))
dataExportStatWeapon.set(ID.weapon.skillParapo, new StatWeapon('skill', 'parapo', 1, 0, true, true, 16))
dataExportStatWeapon.set(ID.weapon.skillBlaster, new StatWeapon('skill', 'blaster'))
dataExportStatWeapon.set(ID.weapon.skillSidewave, new StatWeapon('skill', 'sidewave'))
dataExportStatWeapon.set(ID.weapon.skillSword, new StatWeapon('skill', 'sword', 80, 3, true))
dataExportStatWeapon.set(ID.weapon.skillHyperBall, new StatWeapon('skill', 'hyperball', 6, 0, false, false, 6))
dataExportStatWeapon.set(ID.weapon.skillCriticalChaser, new StatWeapon('skill', 'criticalchaser', 4, 6, false, true, 8))
dataExportStatWeapon.set(ID.weapon.skillPileBunker, new StatWeapon('skill', 'pilebunker', 16, 6, false, true, 4))
dataExportStatWeapon.set(ID.weapon.skillSantansu, new StatWeapon('skill', 'santansu', 6, 9, false, true, 8))
dataExportStatWeapon.set(ID.weapon.skillWhiteflash, new StatWeapon('skill', 'whiteflash', 40, 4, true, true, 12))
dataExportStatWeapon.set(ID.weapon.skillWhiteflashSmoke, new StatWeapon('skillsub', 'whiteflashsmoke', 1, 4, true, true, 12))
dataExportStatWeapon.set(ID.weapon.skillRing, new StatWeapon('skill', 'ring', 4, 0, false, false, 4))
dataExportStatWeapon.set(ID.weapon.skillRapid, new StatWeapon('skill', 'rapid'))
dataExportStatWeapon.set(ID.weapon.skillSeondanil, new StatWeapon('skill', 'seondanil', 50, 3))
dataExportStatWeapon.set(ID.weapon.skillSeondanilMini, new StatWeapon('skillsub', 'seondanilmini', 1, 3))
dataExportStatWeapon.set(ID.weapon.skillHanjumoek, new StatWeapon('skill', 'hanjumoek', 30, 5, false, true, 10))
dataExportStatWeapon.set(ID.weapon.skillBoomerang, new StatWeapon('skill', 'boomerang', 180, 0, false, false, 10))
dataExportStatWeapon.set(ID.weapon.skillMoon, new StatWeapon('skill', 'moon', 180, 1, false, true, 9999))

/**
 * 외부에서 사용하기 위한 플레이어 웨폰 스탯
 * @type {Map<number, StatPlayerWeapon>}
 */
export const dataExportStatPlayerWeapon = new Map()
dataExportStatPlayerWeapon.set(ID.playerWeapon.unused, new StatPlayerWeapon('unuesd', 0, 0, 0, 0, [ID.weapon.unused]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.multyshot, new StatPlayerWeapon('multyshot', 10, 1, 6, 1, [ID.weapon.multyshot]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.missile, new StatPlayerWeapon('missile', 30, 0.8, 4, dataExportStatWeapon.get(ID.weapon.missile)?.repeatCount, [ID.weapon.missile, ID.weapon.missileRocket]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.arrow, new StatPlayerWeapon('arrow', 10, 1.04, 2, 1, [ID.weapon.arrow]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.laser, new StatPlayerWeapon('laser', 12, 1.1, 4, dataExportStatWeapon.get(ID.weapon.laser)?.repeatCount, [ID.weapon.laser, ID.weapon.laserBlue]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.sapia, new StatPlayerWeapon('sapia', 40, 1, 3, dataExportStatWeapon.get(ID.weapon.sapia)?.repeatCount, [ID.weapon.sapia]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.parapo, new StatPlayerWeapon('parapo', 30, 0.9, 3, 4, [ID.weapon.parapo]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.blaster, new StatPlayerWeapon('blaster', 6, 1.2, 2, 1, [ID.weapon.blaster, ID.weapon.blasterMini]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.sidewave, new StatPlayerWeapon('sidewave', 15, 1.1, 8, 1, [ID.weapon.sidewave]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.ring, new StatPlayerWeapon('ring', 30, 1.4, 8, 1, [ID.weapon.ring]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.rapid, new StatPlayerWeapon('rapid', 4, 1.3, 3, 1, [ID.weapon.rapid]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.seondanil, new StatPlayerWeapon('seondanil', 60, 1.1, 5, 1, [ID.weapon.seondanil]))
dataExportStatPlayerWeapon.set(ID.playerWeapon.boomerang, new StatPlayerWeapon('boomerang', 20, 1.2, 3, dataExportStatWeapon.get(ID.weapon.boomerang)?.repeatCount, [ID.weapon.boomerang]))

dataExportStatPlayerWeapon.set(ID.playerWeapon.subMultyshot, new StatPlayerWeapon('subMultyshot', 12, 0.2, 2, 1, [ID.weapon.subMultyshot]))

/**
 * 외부에서 사용하기 위한 플레이어 스킬 스탯
 * @type {Map<number, StatPlayerSkill>}
 */
export const dataExportStatPlayerSkill = new Map()
dataExportStatPlayerSkill.set(ID.playerSkill.unused, new StatPlayerSkill('unused', 0, 0, 0, 0, 0, 0, [ID.weapon.unused]))
dataExportStatPlayerSkill.set(ID.playerSkill.multyshot, new StatPlayerSkill('multyshot', 20, 6, 1, 5, 30, 1, [ID.weapon.skillMultyshot]))
dataExportStatPlayerSkill.set(ID.playerSkill.missile, new StatPlayerSkill('missile', 24, 20, 1.2, 2, 4, dataExportStatWeapon.get(ID.weapon.skillMissile)?.repeatCount, [ID.weapon.skillMissile]))
dataExportStatPlayerSkill.set(ID.playerSkill.arrow, new StatPlayerSkill('arrow', 20, 9, 1.2, 2, 20, dataExportStatWeapon.get(ID.weapon.skillArrow)?.repeatCount, [ID.weapon.skillArrow]))
dataExportStatPlayerSkill.set(ID.playerSkill.laser, new StatPlayerSkill('laser', 24, 0, 0.8, 1, 1, dataExportStatWeapon.get(ID.weapon.skillLaser)?.repeatCount, [ID.weapon.skillLaser]))
dataExportStatPlayerSkill.set(ID.playerSkill.sapia, new StatPlayerSkill('sapia', 24, 0, 1.1, 6, 1, dataExportStatWeapon.get(ID.weapon.skillSapia)?.repeatCount, [ID.weapon.skillSapia]))
dataExportStatPlayerSkill.set(ID.playerSkill.parapo, new StatPlayerSkill('parapo', 24, 10, 0.9, 1, 24, 1, [ID.weapon.skillParapo]))
dataExportStatPlayerSkill.set(ID.playerSkill.blaster, new StatPlayerSkill('blaster', 28, 4, 1.6, 2, 40, 1, [ID.weapon.skillBlaster]))
dataExportStatPlayerSkill.set(ID.playerSkill.sidewave, new StatPlayerSkill('sidewave', 20, 7, 1.2, 3, 24, 1, [ID.weapon.skillSidewave]))
dataExportStatPlayerSkill.set(ID.playerSkill.sword, new StatPlayerSkill('sword', 24, 0, 1, 1, 1, dataExportStatWeapon.get(ID.weapon.skillSword)?.repeatCount, [ID.weapon.skillSword]))
dataExportStatPlayerSkill.set(ID.playerSkill.hyperBall, new StatPlayerSkill('hyperball', 20, 15, 1, 2, 12, dataExportStatWeapon.get(ID.weapon.skillHyperBall)?.repeatCount, [ID.weapon.skillHyperBall]))
dataExportStatPlayerSkill.set(ID.playerSkill.critcalChaser, new StatPlayerSkill('criticalchaser', 28, 10, 1.4, 2, 12, dataExportStatWeapon.get(ID.weapon.skillCriticalChaser)?.repeatCount, [ID.weapon.skillCriticalChaser]))
dataExportStatPlayerSkill.set(ID.playerSkill.pileBunker, new StatPlayerSkill('pilebunker', 28, 60, 2.1, 1, 1, dataExportStatWeapon.get(ID.weapon.skillPileBunker)?.repeatCount, [ID.weapon.skillPileBunker]))
dataExportStatPlayerSkill.set(ID.playerSkill.santansu, new StatPlayerSkill('santansu', 24, 30, 1.5, 5, 5, dataExportStatWeapon.get(ID.weapon.skillSantansu)?.repeatCount, [ID.weapon.skillSantansu]))
dataExportStatPlayerSkill.set(ID.playerSkill.whiteflash, new StatPlayerSkill('whiteflash', 24, 0, 1.2, 1, 1, dataExportStatWeapon.get(ID.weapon.skillWhiteflash)?.repeatCount, [ID.weapon.skillWhiteflash]))
dataExportStatPlayerSkill.set(ID.playerSkill.ring, new StatPlayerSkill('ring', 20, 6, 1.1, 8, 25, 1, [ID.weapon.skillRing]))
dataExportStatPlayerSkill.set(ID.playerSkill.rapid, new StatPlayerSkill('rapid', 20, 4, 1.3, 4, 40, 1, [ID.weapon.skillRapid]))
dataExportStatPlayerSkill.set(ID.playerSkill.seondanil, new StatPlayerSkill('seondanil', 28, 0, 1.3, 1, 1, dataExportStatWeapon.get(ID.weapon.skillSeondanil)?.repeatCount, [ID.weapon.skillSeondanil]))
dataExportStatPlayerSkill.set(ID.playerSkill.hanjumoek, new StatPlayerSkill('hanjumeok', 28, 0, 1.4, 1, 1, dataExportStatWeapon.get(ID.weapon.skillHanjumoek)?.repeatCount, [ID.weapon.skillHanjumoek]))
dataExportStatPlayerSkill.set(ID.playerSkill.boomerang, new StatPlayerSkill('boomerang', 20, 0, 1.2, 3, 1, dataExportStatWeapon.get(ID.weapon.skillBoomerang)?.repeatCount, [ID.weapon.skillBoomerang]))
dataExportStatPlayerSkill.set(ID.playerSkill.moon, new StatPlayerSkill('moon', 28, 1, 1, 1, 1, dataExportStatWeapon.get(ID.weapon.skillMoon)?.repeatCount, [ID.weapon.skillMoon]))


/**
 * 외부에서 사용하기 위한 라운드 스탯 값
 * @type {Map<number, StatRound>}
 */
export const dataExportStatRound = new Map()
dataExportStatRound.set(ID.round.UNUSED, new StatRound())
// round 1
dataExportStatRound.set(ID.round.round1_1, new StatRound('1-1', '우주 여행 - 공허', 0, 40000, 150, 30000, ''))
dataExportStatRound.set(ID.round.round1_2, new StatRound('1-2', '운석 지대', 1, 40000, 180, 36000, ''))
dataExportStatRound.set(ID.round.round1_3, new StatRound('1-3', '운석 지대 - 무인기 충돌', 1, 40000, 210, 39000, ''))
dataExportStatRound.set(ID.round.round1_4, new StatRound('1-4', '의식의 공간', 4, 40000, 152, 38000, ''))
dataExportStatRound.set(ID.round.round1_5, new StatRound('1-5', '운석 지대 - 레드 존', 4, 40000, 210, 41000, ''))
dataExportStatRound.set(ID.round.round1_6, new StatRound('1-6', '우주 여행 - 파란 행성 가는 길', 6, 40000, 152, 35000, ''))
dataExportStatRound.set(ID.round.round1_test, new StatRound('TEST1', 'TEST1', 0, 0, 600, 0, '테스트 라운드 (디버그 용도)'))
// round 2
dataExportStatRound.set(ID.round.round2_1, new StatRound('2-1', '파란 행성 - 하늘 300km ~ 250km', 8, 50000, 150, 40000, ''))
dataExportStatRound.set(ID.round.round2_2, new StatRound('2-2', '동그라미 마을', 8, 50000, 170, 44000, ''))
dataExportStatRound.set(ID.round.round2_3, new StatRound('2-3', '동그라미 스페이스', 12, 50000, 192, 48000, ''))
dataExportStatRound.set(ID.round.round2_4, new StatRound('2-4', '동그라미 마을 홀', 12, 60000, 207, 52000, ''))
dataExportStatRound.set(ID.round.round2_5, new StatRound('2-5', '지하실 전투', 14, 60000, 200, 32000, ''))
dataExportStatRound.set(ID.round.round2_6, new StatRound('2-6', '폐허가 된 동그라미 마을', 15, 60000, 150, 48000, ''))
dataExportStatRound.set(ID.round.round2_test, new StatRound('TEST2', 'TEST2', 0, 0, 600, 0))
// round 3
dataExportStatRound.set(ID.round.round3_1, new StatRound('3-1', '다운 타워 1', 20, 70000, 200, 71400, ''))
dataExportStatRound.set(ID.round.round3_2, new StatRound('3-2', '다운 타워 2', 20, 70000, 220, 72800, ''))
dataExportStatRound.set(ID.round.round3_3, new StatRound('3-3', '다운 타워 3', 20, 70000, 200, 74200, ''))
dataExportStatRound.set(ID.round.round3_4, new StatRound('3-4', '다운 타워 보이드', 22, 70000, 240, 78000, ''))
dataExportStatRound.set(ID.round.round3_5, new StatRound('3-5', '이름 미정', 25, 70000, 6000, 32000, ''))
dataExportStatRound.set(ID.round.round3_test, new StatRound('TEST3', 'round 3 test mode', 20, 0, 999, 0, 'round3을 제작하는 과정에서 만들어진 테스트 라운드'))

// 미정...
// 3-6 다운타워 - 기술실 이동 통로
// 3-7 다운타워 - 기술실 내부 코어
// 3-8 다운타워 - 빠른 이동 통로
// 3-A1 다운타워 코어 - 숨겨진 통로
// 3-A2 다운타워 코어 - 위험한 함정
// 3-A3 다운타워 코어 - 마을을 지배하는 자