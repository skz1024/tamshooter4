//@ts-check

import { DelayData, FieldData, EnimationData, collision, collisionClass } from "./dataField.js"
import { EffectData, CustomEffect, CustomEditEffect } from "./dataEffect.js"
import { ID } from "./dataId.js"
import { stringText } from "./text.js"
import { imageDataInfo, imageSrc } from "./imageSrc.js"
import { fieldState, fieldSystem } from "./field.js"
import { soundSrc } from "./soundSrc.js"
import { game, gameFunction } from "./game.js"
import { dataExportStatRound } from "./dataStat.js"
import { CustomEnemyBullet, EnemyData, dataExportEnemy } from "./dataEnemy.js"

let graphicSystem = game.graphic
let soundSystem = game.sound
let controlSystem = game.control
let digitalDisplay = gameFunction.digitalDisplay

/** 
 * 라운드에서 사용하는 추가적인 로딩 (적과 관련해서 파일이 분산되어 이 클래스에서 대신 데이터를 불러오도록 처리함)
 * 
 * 배경은 용량이 크므로 제외, 배경음악도 제외 특정 라운드에 의존되어있는 파일도 제외 (대표적인 예: 2-3)
 * 다만, 그런 파일들은 파일 이름이 round로 시작함
 */
export class RoundPackLoad {
  /** 라운드 1에서 사용하는 적들의 공통 이미지 데이터 */
  static getRound1ShareImage () {
    return [
      // enemy
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemy.meteoriteEnemy,
      imageSrc.enemy.jemulEnemy,

      // enemyBullet
      imageSrc.enemyBullet.energyBoltAttack,
      imageSrc.enemyBullet.attackList,

      imageSrc.enemyDie.effectList,
      imageSrc.enemyDie.enemyDieMeteorite,
      imageSrc.enemyDie.enemyDieSpaceComet,
      imageSrc.enemyDie.enemyDieSpaceGamjigi
    ]
  }

  /** 라운드 1에서 사용하는 적들의 사운드 데이터 */
  static getRound1ShareSound () {
    return [
      soundSrc.enemyDie.enemyDieSpaceCar,
      soundSrc.enemyDie.enemyDieSpaceComet,
      soundSrc.enemyDie.enemyDieSpaceEnergy,
      soundSrc.enemyDie.enemyDieSpaceGamjigi,
      soundSrc.enemyDie.enemyDieSpaceLight,
      soundSrc.enemyDie.enemyDieSpaceRocket,
      soundSrc.enemyDie.enemyDieSpaceSmall,
      soundSrc.enemyDie.enemyDieSpaceSquare,
      soundSrc.enemyDie.enemyDieSpaceSusong,

      soundSrc.enemyDie.enemyDieMeteorite1,
      soundSrc.enemyDie.enemyDieMeteorite2,
      soundSrc.enemyDie.enemyDieMeteorite3,
      soundSrc.enemyDie.enemyDieMeteorite4,
      soundSrc.enemyDie.enemyDieMeteorite5,
      soundSrc.enemyDie.enemyDieMeteoriteBomb,
      soundSrc.enemyDie.enemyDieMeteoriteRed,
      
      soundSrc.enemyDie.enemyDieJemulBoss,
      soundSrc.enemyDie.enemyDieJemulBossEye,
      soundSrc.enemyDie.enemyDieJemulDrill,
      soundSrc.enemyDie.enemyDieJemulEnergyBolt,
      soundSrc.enemyDie.enemyDieJemulHellAir,
      soundSrc.enemyDie.enemyDieJemulHellShip,
      soundSrc.enemyDie.enemyDieJemulRedAir,
      soundSrc.enemyDie.enemyDieJemulRedJewel,
      soundSrc.enemyDie.enemyDieJemulRocket,
      soundSrc.enemyDie.enemyDieJemulSpike,

      soundSrc.enemyDie.enemyDieDonggrami,

      soundSrc.enemyAttack.jemulBossAttack,
      soundSrc.enemyAttack.jemulBossAttack2,
      soundSrc.enemyAttack.jemulBossAttack3,
      soundSrc.enemyAttack.jemulEnergyBoltAttack,
      soundSrc.enemyAttack.jemulHellDrillAttack,
    ]
  }

  /** 라운드 2에서 사용하는 이미지 공통 데이터
   */
  static getRound2ShareImage () {
    return [
      imageSrc.enemy.donggramiEnemy,
      imageSrc.enemyDie.effectList,
      imageSrc.enemy.intruderEnemy,
      imageSrc.enemyEffect.intruder,
      imageSrc.enemyDie.enemyDieIntruder,
    ]
  }

  static getRound2ShareSound () {
    return [
      soundSrc.donggrami.emoji,
      soundSrc.donggrami.throw,
      soundSrc.donggrami.exclamationMark,
      soundSrc.donggrami.questionMark,
      soundSrc.donggrami.juiceCola,
      soundSrc.donggrami.juiceThrow,
      soundSrc.donggrami.firecracker,
      soundSrc.donggrami.plate,
      
      soundSrc.enemyDie.enemyDieDonggrami,
      soundSrc.enemyDie.enemyDieDonggramiLeaf,
      soundSrc.enemyDie.enemyDieIntruderJemu,
      soundSrc.enemyDie.enemyDieIntruderSquare,
      soundSrc.enemyDie.enemyDieIntruderDaseok,
      soundSrc.enemyDie.enemyDieIntruderDiacore,
      soundSrc.enemyDie.enemyDieIntruderFlying1,
      soundSrc.enemyDie.enemyDieIntruderFlying2,
      soundSrc.enemyDie.enemyDieIntruderFlyingRocket,
      soundSrc.enemyDie.enemyDieIntruderGami,
      soundSrc.enemyDie.enemyDieIntruderHanoi,
      soundSrc.enemyDie.enemyDieIntruderLever,
      soundSrc.enemyDie.enemyDieIntruderMetal,
      soundSrc.enemyDie.enemyDieIntruderMomi,
      soundSrc.enemyDie.enemyDieIntruderRendown,

      soundSrc.enemyAttack.intruderJemuEnergy,
      soundSrc.enemyAttack.intruderJemuEnergyHigh,
      soundSrc.enemyAttack.intruderJemuEnergyLow,
      soundSrc.enemyAttack.intruderJemuEnergyPurple,
      soundSrc.enemyAttack.intruderJemuEnergyReflect,
      soundSrc.enemyAttack.intruderJemuThunderBig,
      soundSrc.enemyAttack.intruderJemuThunderNormal,
      soundSrc.enemyAttack.intruderDaseokLaserGreen,
      soundSrc.enemyAttack.intruderDaseokLaserYellow,
      soundSrc.enemyAttack.intruderHanoiAttack,
      soundSrc.enemyAttack.intruderHanoiReflect,
      soundSrc.enemyAttack.intruderLeverLaser,
      soundSrc.enemyAttack.intruderRendownMissile,
      soundSrc.enemyAttack.intruderRendownMissileCreate,
    ]
  }
}

export class RoundData {
  constructor () {
    /** 
     * 라운드 ID 이 값은 dataId를 참고해서 작성... 다만 RoundData에서 작성할 필요는 없음. 
     * 
     * 어차피 field를 생성할 때, roundId를 입력하므로, 그 값을 참고해 만듬. 여기서 사용되는 id는
     * 생성할때는 중요하지 않고 저장 및 불러오기 용도로 사용
     * 
     */ 
    this.id = 0

    /** 라운드의 상태 (저장용도) */ this.state = ''

    /** (해당 라운드를 플레이 하기 위한) 필요 레벨, 필요 레벨 미만은 입장 불가 */ this.requireLevel = 0
    /** (해당 라운드를 원할하게 플레이 할 수 있는) 권장 공격력, 입장은 상관 없음 */ this.standardPower = 0
    /** 라운드 값을 텍스트로 표시 (예: 1-1), 영어와 숫자만 사용 가능 */ this.roundText = 'TEST'
    /** 라운드 이름, text.js에서 값을 가져와서 입력하세요. */ this.roundName = stringText.dataRoundName.test
    /** 라운드 종료 시간(이 시간이 되면 클리어), 단위: 초 */ this.finishTime = 999
    /** 클리어 보너스 점수 */ this.clearBonus = 10000
    /** 음악 오디오 경로 */ this.musicSrc = ''
    /** 현재 음악 오디오 경로 */ this.currentMusicSrc = ''
    /** 불러오기 전용 변수 (음악 현재 시간) */ this.loadCurrentMusicTime = 0

    /**
     * 해당 라운드의 기본 배경 이미지 (배경은 언제든지 변경 가능)
     * @type {string}
     */
    this.backgroundImageSrc = ''
    /** 배경을 변경할 때, 화면을 부드럽게 전환하기 위한 변수(페이드 기준값) */ this.backgroundFadeFrameMax = 120
    /** 배경을 변경할 때, 화면을 부드럽게 전환하기 위한 변수 */ this.backgroundFadeFrame = 0
    this.backgroundX = 1
    this.backgroundY = 0
    this.backgroundSpeedX = 0.5
    this.backgroundSpeedY = 0
    this.prevBackgroundImageSrc = ''

    /** 현재 시간의 프레임 */ this.currentTimeFrame = 0
    /** 현재 시간, 기본값은 반드시 0이어야 합니다. */ this.currentTime = 0
    /** 총합 프레임 (적 출현을 일정시간으로 나눌 때 주로 사용) */ this.currentTimeTotalFrame = 0
    /** 현재 시간이 정지된 상태 (이 값은 set함수를 이용해 수정해주세요.) */ this.currentTimePaused = false
    /** 클리어 여부, 클리어가 되는 즉시 해당 라운드는 종료 */ this.isClear = false
    /** 추가 시간, 현재 시간이 일시 정지된 시점에서 사용됨 */ this.plusTime = 0
    /** 추가 시간 프레임 */ this.plusTimeFrame = 0
    /** 전체 시간 프레임 (pause 상관없이 시간 프레임 증가) */ this.totalFrame = 0

    /**
     * 시간이 정지된 경우 필드에 전송할 메세지, 값이 없으면 필드 시스템이 정한 기본값을 사용 
     * (이 값은 게임의 일관성을 위하여 아무렇게나 사용하면 안됩니다.)
     * 
     * 자세한것은 setCurrentTimePaused 함수 참고
     */ 
    this.currentTimePausedMessage = ''
    
    /** 
     * 현재 있는 보스 
     * @type {FieldData | null | any}
     */ 
    this.currentBoss = null

    /** 보스 모드(적용될 경우 적이 다 사라질때까지 시간이 멈춤) */ this.bossMode = false
    /** 보스전 음악, 설정되지 않을경우 필드음악이 계속 재생됨.(음악이 꺼지진 않음.) */ this.bossMusic = null

    /** 
     * 모든 페이즈가 끝나는 시간 (그리고 적 전부 죽었는지 확인) 
     * 참고로 이 시간은 addRoundPhase를 사용할 때마다 해당 라운드의 종료 시점으로 자동으로 맞춰집니다.
     * 
     * 페이즈 종료 시간은 마지막 페이즈 시간에서 1초를 추가
     */ 
    this.phaseAllEndTime = 0

    /** 
     * 각 페이즈의 시간 
     * @type {{startTime: number, endTime: number}[]}
     */ 
    this.phaseTime = []

    /**
     * 라운드 페이즈를 정의하는 함수를 여기에 추가하세요.
     * @type {Function[]}
     */
    this.phaseRound = []

    /** 저장 용도로 사용하는 문자열 (저장 형식이 무언지는 알 수 없음) */
    this.saveString = ''

    /** 
     * 이 라운드에서 사용해야 하는 이미지들의 리스트
     * 
     * 주의: 라운드에서는 round와 enemy도 같이 로드해야 합니다.
     * 
     * 이 변수를 직접 수정하기 보다는 addLoadingImageList 함수를 사용하는것을 권장합니다.
     * 
     * 반드시 클래스의 constructor(생성자)에서 작성해야 합니다.
     * 다른곳에서 작성할경우 해당 파일을 정상적으로 로드할 수 없습니다.
     * @type {string[]}
     */
    this.loadingImageList = []

    /** 
     * 이 라운드에서 로드해야 하는 사운드들의 리스트
     * 
     * 주의: 라운드에서는 round와 enemy도 같이 로드해야 합니다.
     * 
     * 이 변수를 직접 수정하기 보다는 addLoadingSoundList 함수를 사용하는것을 권장합니다.
     * 
     * 반드시 클래스의 constructor(생성자)에서 작성해야 합니다.
     * 다른곳에서 작성할경우 해당 파일을 정상적으로 로드할 수 없습니다.
     * @type {string[]}
     */
    this.loadingSoundList = []
  }

  /**
   * loading image list를 설정하는 함수
   * 
   * 주의: 라운드에서는 round와 enemy도 같이 로드해야 합니다. 
   * packRoundLoad 클래스를 참고해 라운드에 필요한 데이터를 추가로 지정해 주세요.
   * 
   * 이 함수는 반드시 각 라운드의 constructor에서 실행해야 합니다.
   * 다른곳에서는 정상적으로 불러올 수 없습니다.
   * @param {string[]} src 
   */
  addLoadingImageList (src = ['']) {
    this.loadingImageList = this.loadingImageList.concat(src)
  }

  /**
   * loading sound list를 설정하는 함수
   * 
   * 주의: 라운드에서는 round와 enemy도 같이 로드해야 합니다.
   * packRoundLoad 클래스를 참고해 라운드에 필요한 데이터를 추가로 지정해 주세요.
   * 
   * 이 함수는 반드시 각 라운드의 constructor에서 실행해야 합니다.
   * 다른곳에서는 정상적으로 불러올 수 없습니다.
   * @param {string[]} src 
   */
  addLoadingSoundList (src = ['']) {
    this.loadingSoundList = this.loadingSoundList.concat(src)
  }

  /** 
   * 이미지와 사운드를 로딩합니다. (중복 로딩되지 않음.)
   * 이 함수는 필드에서 라운드를 진행하기 전에 반드시 실행되어야 합니다.
   * 또는 불러오기를 했을 때에도 실행되어야 합니다.
   */
  loadingImageSound () {
    for (let i = 0; i < this.loadingImageList.length; i++) {
      graphicSystem.createImage(this.loadingImageList[i])
    }
    for (let i = 0; i < this.loadingSoundList.length; i++) {
      soundSystem.createAudio(this.loadingSoundList[i])
    }
  }

  /** 라운드와 관련된 이미지, 사운드 파일이 전부 로딩되었는지를 확인
   * 단, 유저가 제스쳐 행위를 하지 않는다면, 사운드가 로딩되지 않으므로 사운드 로드 여부는 판단하지 않습니다. [표시만 될 뿐...]
   */
  loadCheck () {
    let imageLoadCount = graphicSystem.getImageCompleteCount(this.loadingImageList)
    let soundLoadCount = soundSystem.getAudioLoadCompleteCount(this.loadingSoundList)

    if (imageLoadCount === this.loadingImageList.length) {
      return true
    } else {
      return false
    }
  }

  /** 현재 로드된 상태를 출력하는 스트링 값을 얻음 */
  getLoadStatus () {
    return [
      'image load: ' + graphicSystem.getImageCompleteCount(this.loadingImageList) + '/' + this.loadingImageList.length,
      'sound load: ' + soundSystem.getAudioLoadCompleteCount(this.loadingSoundList) + '/' + this.loadingSoundList.length,
      'Sounds are loaded when using user gestures.'
    ]
  }

  /**
   * 라운드 스탯을 설정합니다.
   * 
   * 해당 함수는 반드시 실행되어야 합니다.
   * @param {number} roundId 해당 라운드의 id
   */
  setAutoRoundStat (roundId) {
    let stat = dataExportStatRound.get(roundId)
    if (stat == null) return

    this.roundName = stat.roundName
    this.roundText = stat.roundText
    this.requireLevel = stat.requireLevel
    this.standardPower = stat.standardPower
    this.finishTime = stat.finishTime
    this.clearBonus = stat.clearBonus
  }

  /**
   * 라운드의 페이즈 추가.
   * 참고로 이 함수를 사용하면 마지막 라운드 페이즈가 마지막 페이즈가 종료되는 시점으로 자동으로 맞춰집니다.
   * @param {Function} inputFunction 라운드의 내용이 구현되어있는 함수
   * @param {number} startTime 페이즈의 시작 시간
   * @param {number} endTime 페이즈의 종료 시간
   */
  addRoundPhase (inputFunction, startTime, endTime = startTime) {
    if (inputFunction == null) {
      console.warn('라운드 페이즈가 구현된 함수를 입력해 주세요. 데이터가 없으면 추가되지 않습니다.')
      return
    }

    // 참고, 라운드를 건네주었을 때, this값이 사라지기 때문에 이 라운드 함수를 사용할 수 있게끔 this를 이 클래스에 바인드 해야함.
    this.phaseRound.push(inputFunction.bind(this))
    this.phaseTime.push({startTime: startTime, endTime: endTime})

    // 만약 페이즈 시간이랑 페이즈 종료 시간이 잘못 겹치면 해당 라운드에 영원히 갇힐 수 있음,
    // 페이즈 종료 시간은 마지막 페이즈 시간에서 1초를 추가
    this.phaseAllEndTime = endTime + 1
  }

  /**
   * 현재 페이즈 단계를 얻습니다.
   * 참고: 페이즈 계산은 페이즈 숫자를 바꾸는게 아니고, 
   * 모든 페이즈의 시간이 어떻게 되어있는지를 분석해서 현재 시간에 맞는 페이즈를 계산합니다.
   * 
   * 페이즈는 0부터 시작
   */
  getCurrentPhase () {
    for (let i = 0; i < this.phaseTime.length; i++) {
      if (this.timeCheckInterval(this.phaseTime[i].startTime, this.phaseTime[i].endTime)) {
        return i
      }
    }

    return 0
  }

  /** 현재 시간을 재설정 (소수점 단위 사용불가, 만약 사용한다면 소수점 버림) */
  setCurrentTime (setTime = this.currentTime) {
    // 해당 숫자가 정수인지 소수인지 판정
    if (!Number.isInteger(setTime)) {
      setTime = Math.floor(setTime)
    }

    // 남은 차이값만큼 plusTime 변환
    // 주의: 이 함수는 무조건 plusTime에 영향을 미치기 때문에
    // bossMode와 같은곳에는 이 함수가 사용되지 않습니다.
    let diffValue = this.currentTime - setTime
    this.currentTime = setTime
    this.plusTime += diffValue
  }

  /** 
   * 현재 시간을 일시정지하는지에 대한 여부
   * 
   * 참고: message에 대해서
   * 
   * 이 게임은 기본적으로 보스전 또는 적이 남아있는 상황에서 모든 적을 죽일 때까지 더이상 진행되지 않습니다.
   * 그러나, 특정 상황에서는 강제로 시간을 멈출 수 있으며 이것을 안내하기 위한 메세지를 작성할 수 있습니다.
   * 
   * 게임의 일관성을 위하여 메세지는 특정 상황에서만 작성되어야 합니다.
   * 
   * 주의: 잘못 사용하면 시간이 영원히 멈출 수도 있습니다. 그렇게 되면 게임 진행이 불가능집니다.
   * @param {boolean} [boolValue=false] 시간을 멈추는 여부
   * @param {string} [message=''] 시간이 멈춘 상태에서 필드 시스템에 보여줄 메세지
   * 
   */
  setCurrentTimePause (boolValue = false, message = '') {
    this.currentTimePaused = boolValue
    this.currentTimePausedMessage = message
  }


  /**
   * 해당 라운드가 클리어 되어있는지 확인.
   * (참고: 라운드를 클리어하는 기본적인 기준은, currentTime이 finishTime 이상이여야 합니다.)
   * 이것은, finishTime 시간만 넘어가면 적이 몇마리 있든 일단 클리어라는 뜻입니다.
   */
  clearCheck () {
    if (this.currentTime >= this.finishTime) {
      return true
    } else {
      return false
    }
  }

  requestClear () {

  }

  /**
   * 배경화면을 실시간으로 변경합니다. (주의: 페이드 시간이 겹쳐지면 이전 페이드 효과는 무시함.)
   * @param {string} changeBackgroundImageSrc 변경할 배경 이미지
   * @param {number} fadeTimeFrame 배경화면이 전환되는 시간(프레임)
   */
  changeBackgroundImage (changeBackgroundImageSrc, fadeTimeFrame = 1) {
    if (changeBackgroundImageSrc != null) {

      // 배경 전환및 상태 저장을 원할하게 하기 위해, 
      // 변경할 예정인 이미지가 현재 이미지로 변경되고, 페이드 되는 이미지는 nextImage로 변경
      this.prevBackgroundImageSrc = this.backgroundImageSrc
      this.backgroundImageSrc = changeBackgroundImageSrc
      this.backgroundFadeFrameMax = fadeTimeFrame
      this.backgroundFadeFrame = fadeTimeFrame
    }
  }

  /**
   * 보스 모드를 요청합니다. 이 함수를 사용하면, 보스 모드가 설정되며, 적을 전부 죽여야 다음 구간으로 진행할 수 있습니다.
   * 
   * 주의: 보스모드 설정 상태에서 중복으로 호출할 수 없음.
   * 
   * 보스모드가 종료될경우, 중복 설정 방지를 위해 진행시간이 1초가 추가됩니다.
   * 
   * (경고: 보스 모드의 체력 표시는 첫번째 적을 기준으로 하므로, 모든 적이 없는 상테에서 생성해야만 제대로 된 표시가 가능)
   * @param {number} enemyId 생성할 적 Id. 없을 경우 무시(적을 생성하지 않음.)
   * @param {string} setMusic 보스전으로 설정할 음악, 이 값이 없다면 bossMusic으로 설정하고, bossMusic도 없다면 음악 변화 없음.
   */
  requestBossMode (enemyId = 0, setMusic = this.bossMusic) {
    if (this.bossMode) return // 보스모드 설정 상태에서 중복으로 호출할 수 없음.

    this.bossMode = true
    this.createEnemy(enemyId)
    this.musicChange(setMusic)

    // 중복 또는 연속 호출을 방지하기 위해, 보스모드를 호출하면 시간이 1초 추가됩니다.
    this.currentTime++
  }

  /**
   * 배경 이미지를 출력합니다.
   * 
   * 참고: 이 함수는 원하는 위치에 배경에 출력되는게 아닌, background 변수값에 의해 배경이 처리되므로,
   * 다른 위치에 추가적인 배경을 출력하기 위해서는 garphicSystem의 imageDisplay 함수를 직접 사용해 이미지를 수동으로 출력해야 합니다.
   * 
   * @param {string} imageSrc 이미지 파일 (입력시 해당 배경 이미지를 사용, 이게 없으면 기본 이미지 배경 사용)
   */
  displayBackgroundImage (imageSrc = '') {
    // 배경화면 이미지 출력 및 스크롤 효과, 배경이 없으면 아무것도 출력 안함.
    let targetSrc = (imageSrc === '') ? this.backgroundImageSrc : imageSrc
    let image = graphicSystem.getCacheImage(targetSrc)
    if (image == null) return

    let imageWidth = image.width
    let imageHeight = image.height
    let canvasWidth = graphicSystem.CANVAS_WIDTH
    let canvasHeight = graphicSystem.CANVAS_HEIGHT
    let imageX = this.backgroundX
    let imageY = this.backgroundY

    // 이미지의 길이 초과시, 이미지 X 좌표 변경
    if (imageX > imageWidth) {
      imageX = imageX % imageWidth
    } else if (imageX < 0) { // 만약 이미지가 음수좌표면 자연스러운 스크롤이 되기 위해 이미지 X좌표 변경
      imageX = imageWidth - Math.abs(imageX % imageWidth)
    }

    // 이미지의 너비 초과시, 이미지 Y 좌표 변경
    if (imageY > imageHeight) {
      imageY = imageY % imageHeight
    } else if (imageY < 0) { // 만약 이미지가 음수좌표면 자연스러운 스크롤이 되기 위해 이미지 Y좌표 변경
      imageY = imageHeight - Math.abs(imageY % imageHeight)
    }


    if (imageX === 0 && imageY === 0) {
      // 백그라운드의 좌표가 (0, 0) 일 때
      // 참고: 이미지 크기를 전부 출력하는것이 아닌, 캔버스의 크기로만 출력됩니다.
      // 캔버스보다 이미지가 작다면 나머지 부분은 그려지지 않습니다.
      graphicSystem.imageDisplay(image, 0, 0, canvasWidth, canvasHeight, imageX, imageY, canvasWidth, canvasHeight)
    } else if (imageX !== 0 && imageY === 0) {
      // x축 좌표가 0이 아니고 y축 좌표가 0일 때 (수평 스크롤 포함)
      // 만약 x축과 출력길이가 이미지 길이를 초과하면 배경을 2번에 나누어 출력됩니다.
      if (imageX + canvasWidth >= imageWidth) {
        let screenAWidth = imageWidth - imageX
        let screenBWidth = canvasWidth - screenAWidth
        graphicSystem.imageDisplay(image, imageX, 0, screenAWidth, canvasHeight, 0, 0, screenAWidth, canvasHeight)
        graphicSystem.imageDisplay(image, 0, 0, screenBWidth, canvasHeight, screenAWidth, 0, screenBWidth, canvasHeight)
      } else {
        // 출력길이가 초과하지 않는다면, 좌표에 맞게 그대로 출력
        graphicSystem.imageDisplay(image, imageX, imageY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)
      }
    } else if (imageX === 0 && imageY !== 0) {
      // y축 좌표가 0이 아니고 x축 좌표는 0일 때 (수직 스크롤 포함)
      // 스크롤 원리는 x축과 동일하다.
      if (imageY + canvasHeight >= imageHeight) {
        let screenAHeight = imageHeight - imageY
        let screenBHeight = canvasHeight - screenAHeight
        graphicSystem.imageDisplay(image, 0, imageY, canvasWidth, screenAHeight, 0, 0, canvasWidth, screenAHeight)
        graphicSystem.imageDisplay(image, 0, 0, canvasWidth, screenBHeight, 0, screenAHeight, canvasWidth, screenBHeight)
      } else {
        // 출력길이가 초과하지 않는다면, 좌표에 맞게 그대로 출력
        graphicSystem.imageDisplay(image, imageX, imageY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)
      }
    } else {
      // x축과 y축이 모두 0이 아닌경우, (수직 + 수평 스크롤)
      // 만약 어느 축도 이미지의 길이를 초과하지 않았다면, 그대로 이미지를 출력합니다.
      if (imageX + canvasWidth <= imageWidth && imageY + canvasHeight <= imageHeight) {
        graphicSystem.imageDisplay(image, imageX, imageY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)
      } else {
        // 어느 쪽도 초과라면 4번에 나누어져 출력
        let screenBaseWidth = imageWidth - imageX
        let screenBaseHeight = imageHeight - imageY
        let screenExtendWidth = canvasWidth - screenBaseWidth
        let screenExtendHeight = canvasHeight - screenBaseHeight

        // 오류 방지를 위해 이미지를 자르는 사이즈가 0이 되지 않도록 조건을 정한 후 출력
        // 첫번째 기본 이미지
        if (screenBaseWidth !== 0 || screenBaseHeight !== 0) {
          graphicSystem.imageDisplay(image, imageX, imageY, screenBaseWidth, screenBaseHeight, 0, 0, screenBaseWidth, screenBaseHeight)
        }

        // 두번째 x축 이미지 (첫번째 이미지를 기준으로 X축의 다른 위치[이미지가 스크롤 하면서 잘린 지점])
        if (imageX + canvasWidth >= imageWidth && screenBaseWidth !== 0) {
          graphicSystem.imageDisplay(image, 0, imageY, screenExtendWidth, screenBaseHeight, screenBaseWidth, 0, screenExtendWidth, screenBaseHeight)
        } else if (screenBaseWidth === 0) {
          graphicSystem.imageDisplay(image, 0, imageY, screenExtendWidth, screenBaseHeight, 0, 0, screenExtendWidth, screenBaseHeight)
        }

        // 세번째 y축 이미지 (첫번째 이미지를 기준으로 Y축 다른 위치[이미지가 스크롤 하면서 잘린 지점])
        if (imageY + canvasHeight >= imageHeight && screenBaseHeight !== 0) {
          graphicSystem.imageDisplay(image, imageX, 0, screenBaseWidth, screenExtendHeight, 0, screenBaseHeight, screenBaseWidth, screenExtendHeight)
        } else if (screenBaseHeight === 0) { // 만약 baseHeight가 0이라면, x, 0 위치에 출력합니다.
          graphicSystem.imageDisplay(image, imageX, 0, screenBaseWidth, screenExtendHeight, 0, 0, screenBaseWidth, screenExtendHeight )
        }

        // 네번째 x, y축 이미지 (첫번째 이미지를 기준으로 대각선에 위치)
        if (screenBaseWidth !== 0 && screenBaseHeight !== 0) {
          graphicSystem.imageDisplay(image, 0, 0, screenExtendWidth, screenExtendHeight, screenBaseWidth, screenBaseHeight, screenExtendWidth, screenExtendHeight)
        } else if (screenBaseWidth === 0 && screenBaseHeight !== 0) { // width(가로축)만 0인 경우
          graphicSystem.imageDisplay(image, 0, 0, screenExtendWidth, screenExtendHeight, 0, screenBaseHeight, screenExtendWidth, screenExtendHeight)
        } else if (screenBaseWidth !== 0 && screenBaseHeight === 0) { // height(세로축)만 0인 경우
          graphicSystem.imageDisplay(image, 0, 0, screenExtendWidth, screenExtendHeight, screenBaseWidth, 0, screenExtendWidth, screenExtendHeight)
        } else if (screenBaseWidth === 0 && screenBaseHeight === 0) { // 둘 다 0인 경우
          graphicSystem.imageDisplay(image, 0, 0, screenExtendWidth, screenExtendHeight, 0, 0, screenExtendWidth, screenExtendHeight)
        }
      }
    }
  }

  displayBackground () {
    if (this.backgroundFadeFrame >= 1) {
      this.backgroundFadeFrame--
      let current = this.backgroundImageSrc
      let prev = this.prevBackgroundImageSrc
      let prevAlpha = (1 / this.backgroundFadeFrameMax) * this.backgroundFadeFrame
      let originalAlpha = 1 - prevAlpha
       
      // 투명도를 페이드 하는 방식이라, 검은색 배경을 먼저 출력하고, 배경을 출력하도록 하였다.
      // 이 기능은 오히려 일부 그라디언트 배경을 무효화했기 때문에 삭제되었습니다.
      // graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, 'black')
      graphicSystem.setAlpha(originalAlpha)
      this.displayBackgroundImage(current)
      graphicSystem.setAlpha(prevAlpha)
      this.displayBackgroundImage(prev)
      graphicSystem.setAlpha(1)

      if (this.backgroundFadeFrame === 0) {
        this.prevBackgroundImageSrc = ''
      }
    } else {
      this.displayBackgroundImage()
    }
  }

  display () {
    this.displayBackground()
    this.displayBossHp()
  }

  displayBossHp () {
    if (!this.bossMode) return

    let enemy = fieldState.getEnemyObject()
    let firstEnemy
    if (enemy[0] != null) {
      firstEnemy = enemy[0]
    } else {
      return
    }

    let percent = firstEnemy.hp / firstEnemy.hpMax
    graphicSystem.setAlpha(0.7)
    graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, 20, 'lightgrey')
    if (percent >= 0.2) {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'yellow', 'orange')
    } else {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'purple', 'red')
    }
    graphicSystem.setAlpha(1)
    digitalDisplay('boss hp: ' + firstEnemy.hp + '/' + firstEnemy.hpMax, 0, 0)
  }

  /** 보스의 체력을 표시 (보스모드와 상관없음) 주의: 첫번째의 적의 hp만 체크합니다. */
  defaultDisplayBossHp () {
    let enemy = fieldState.getEnemyObject()
    let firstEnemy
    if (enemy[0] != null) {
      firstEnemy = enemy[0]
    } else {
      return
    }

    let percent = firstEnemy.hp / firstEnemy.hpMax
    graphicSystem.setAlpha(0.7)
    graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, 20, 'lightgrey')
    if (percent >= 0.2) {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'yellow', 'orange')
    } else {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'purple', 'red')
    }
    graphicSystem.setAlpha(1)
    digitalDisplay('boss hp: ' + firstEnemy.hp + '/' + firstEnemy.hpMax, 0, 0)
  }

  process () {
    this.processDebug()
    this.processTime()
    this.processRound()
    this.processBackground()
    this.processBoss()
    this.processPhaseEndEnemyNothing()
    this.processFirstMusicPlay()
    this.processSaveString()
  }

  processBoss () {
    if (!this.bossMode) return

    // 보스모드인 상태에서는 자동으로 시간 멈춤
    // 보스모드 상태에서 모든 적이 죽을 경우, 다음 구간 진행 가능
    // 다만 재생중인 음악이 종료되므로 주의
    // 가능하다면, 보스모드는 마지막 페이즈에만 사용해주세요.
    if (this.enemyNothingCheck()) {
      this.bossMode = false
      this.currentTimePaused = false
      soundSystem.musicStop()
    } else {
      this.currentTimePaused = true
    }
  }

  processBackground () {
    if (this.backgroundImageSrc == null) return
    let image = graphicSystem.getCacheImage(this.backgroundImageSrc)
    
    
    this.backgroundX += this.backgroundSpeedX
    this.backgroundY += this.backgroundSpeedY
    // 화면 전환 프레임이 동작중이라면, 배경화면의 길이를 초과해도 좌표가 자동으로 조절되지 않습니다.
    // 이것은 배경 사이즈가 다른 화면 전환을 부드럽게 하기 위해서입니다.
    if (this.backgroundFadeFrame > 0) return
    if (image == null) return

    if (this.backgroundX > image.width) {
      this.backgroundX -= image.width
    } else if (this.backgroundX < 0) {
      this.backgroundX += image.width
    }

    if (this.backgroundY > image.height) {
      this.backgroundY -= image.height
    } else if (this.backgroundY < 0) {
      this.backgroundY += image.height
    }
  }

  /**
   * 라운드 진행에 관한 처리. 라운드 구성에 관해서는 roundPhase 부분을 참고
   */
  processRound () {
    for (let i = 0; i < this.phaseRound.length; i++) {
      let currentPhase = this.phaseRound[i]
      let startTime = this.phaseTime[i].startTime
      let endTime = this.phaseTime[i].endTime

      if (this.timeCheckInterval(startTime, endTime)) {
        currentPhase()
      }
    }
  }

  /**
   * 시간 증가 처리
   */
  processTime () {
    // 종합 프레임은 조건에 상관없이 증가
    this.totalFrame++

    // 현재시간이 정지된 상태라면 기본 시간은 멈추고 추가 시간이 계산됩니다.
    if (this.currentTimePaused) {
      this.plusTimeFrame++
      if (this.plusTimeFrame >= 60) {
        this.plusTimeFrame -= 60
        this.plusTime++
      }
    } else {
      this.currentTimeFrame++
      this.currentTimeTotalFrame++
      if (this.currentTimeFrame >= 60) {
        this.currentTimeFrame -= 60
        this.currentTime++
      }
    }
  }

  /** 디버그를 원한다면 이 함수에 내용을 넣어주세요. */
  processDebug () {

  }

  /**
   * 시간 간격 확인 함수 (적 생성 용도로 사용), 프레임 단위 계산을 totalFrame으로 하기 때문에 시간이 멈추어도 함수는 작동합니다.
   * 
   * start이상 end이하일경우 true, 아닐경우 false
   * 
   * 참고: 만약, 시간 범위를 무제한 범위로 하고, intervalFrame 간격만 확인하고 싶다면
   * start를 0, end는 매우 큰 수(9999같은...)를 사용해주세요.
   */
  timeCheckInterval (start = 0, end = start, intervalFrame = 1) {
    if (this.currentTime >= start && this.currentTime <= end && this.totalFrame % intervalFrame === 0) {
      return true
    } else {
      return false
    }
  }

  /**
   * 현재 시간이 지정된 시간인지 확인합니다.
   * 
   * 만약, time 60이고, frame 1이면, 60초 1프레임만 해당되고, 60초 2프레임같은건 해당되지 않습니다.
   * 
   * 경고: 시간 범위를 확인할거라면, timeInterval 사용을 추천합니다
   * @param {number} time 현재 시간(초)
   * @param {number} frame 해당 프레임(없을 경우 기본값 0)
   */
  timeCheckFrame (time, frame = 0) {
    if (this.currentTime === time) {
      if (frame === undefined) {
        return true
      } else if (this.currentTimeFrame === frame) {
        return true
      }
    }
    
    return false
  }

  

  /**
   * 모든 페이즈 종료 상태에서, 적이 전부 죽을 때까지 시간이 진행되지 않습니다.
   * 만약, 적이 없는 상태에서 다음 페이즈로 넘어가고 싶다면, 따로 enemyNothingCheck 함수를 사용해야 합니다.
   * 
   * 참고: 이 함수의 조건 자체를 무효화할거면, processPhaseEndEnemyNoting 함수를 상속받아 재정의해주세요.
   */
  processPhaseEndEnemyNothing () {
    if (this.phaseAllEndTime === 0) return

    if (this.currentTime === this.phaseAllEndTime) {
      if (this.enemyNothingCheck()) {
        this.currentTimePaused = false
      } else {
        this.currentTimePaused = true
      }
    }
  }

  /**
   * 적이 아무도 없는지 확인합니다.
   */
  enemyNothingCheck () {
    let enemy = fieldState.getEnemyObject()
    if (enemy.length <= 0) {
      return true
    } else {
      return false
    }
  }

  /**
   * 현재 적의 수를 확인합니다.
   */
  getEnemyCount () {
    return fieldState.getEnemyObject().length
  }

  /**
   * 남은 적의 수 조건에 따라 시간을 일시정지 시키고 싶을 때 사용하는 함수
   * 
   * 주의: 이 함수를 사용하고 나서 적을 지속적으로 생성하면 안됩니다. 그러면 게임을 영원히 진행할 수 없습니다.
   * @param time 시간을 멈추는 기준 시간
   * @param minEnemyCount 최소 적의 수 (해당 적 수 초과일경우 시간이 멈춤)
   */
  timePauseEnemyCount (time = 0, minEnemyCount = 0) {
    if (time == null) return // 시간설정안하면 무효(언제 멈춰야 하는지 알 수 없기 때문)

    if (this.timeCheckInterval(time)) {
      if (minEnemyCount < this.getEnemyCount()) {
        this.currentTimePaused = true
      } else {
        this.currentTimePaused = false
      }
    }
  }

  /**
   * 보스 체력 보여주기 용도, 다만 어떤 적의 체력을 보여주는지는 알 수 없음. (아직 미정, 특별한 경우에만 사용)
   */
  showBossHp () {
    // 첫번째 에너미 한정
    let enemy = fieldState.getEnemyObject()
    let firstEnemy = null
    if (enemy[0] != null) {
      firstEnemy = enemy[0]
    } else {
      return
    }

    let percent = firstEnemy.hp / firstEnemy.hpMax
    graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, 20, 'lightgrey')
    if (percent >= 0.2) {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'yellow', 'orange')
    } else {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'purple', 'red')
    }
    digitalDisplay('boss hp: ' + firstEnemy.hp + '/' + firstEnemy.hpMax, 0, 0)

  }

  /**
   * 적을 생성합니다.
   */
  createEnemy (enemyId = 0, x = graphicSystem.CANVAS_WIDTH + 50, y = Math.random() * graphicSystem.CANVAS_HEIGHT) {
    if (enemyId != 0) {
      fieldState.createEnemyObject(enemyId, x, y)
    }
  }

  /**
   * 보스를 생성합니다.
   */
  createBoss (enemyId, x = graphicSystem.CANVAS_WIDTH + 50, y = Math.random() * graphicSystem.CANVAS_HEIGHT) {
    this.currentBoss = fieldState.createEnemyBoss(enemyId, x, y)
  }

  getSaveData () {
    return {
      id: this.id,
      state: this.state,
      
      // 배경화면
      backgroundImageSrc: this.backgroundImageSrc,
      backgroundX: this.backgroundX,
      backgroundY: this.backgroundY,
      backgroundSpeedX: this.backgroundSpeedX,
      backgroundSpeedY: this.backgroundSpeedY,

      // 현재시간
      currentTime: this.currentTime,
      currentTimeFrame: this.currentTimeFrame,
      currentTimeTotalFrame: this.currentTimeTotalFrame,
      currentTimePaused: this.currentTimePaused,
      plusTime: this.plusTime,
      plusTimeFrame: this.plusTimeFrame,

      // 음악 시간
      loadCurrentMusicTime: game.sound.getMusicCurrentTime(),
      currentMusicSrc: this.currentMusicSrc,

      // 보스 모드
      bossMode: this.bossMode,

      // 특수한 경우
      saveString: this.saveString
    }
  }

  /** 
   * saveString 문자열을 어떻게 저장할 것인지에 대한 함수
   * 
   * (saveString을 조작하는 방식이 복잡할 수 있으므로, 함수로 따로 분리하였습니다.)
   */
  processSaveString () {
    
  }

  /**
   * 음악을 재생합니다.
   * 
   * 참고: 저장된 게임 불러오기를 했을 때 이 함수를 사용하면, currentTime을 설정해도 무시함.
   */
  musicPlay (start = -1) {
    // 음악이 없으면 재생하지 않음
    if (this.currentMusicSrc === '') {
      soundSystem.musicStop()
      return
    }

    if (this.loadCurrentMusicTime !== 0) {
      // 저장딘 게임 불러오기 전용 변수
      soundSystem.musicPlay(this.currentMusicSrc, this.loadCurrentMusicTime)
      
      // 현재 음악이 로딩되어있지 않아 현재 음악이 없다면, 로드된 시간 설정을 초기화하지 않습니다.
      if (soundSystem.currentMusic != null) {
        this.loadCurrentMusicTime = 0
      }
    } else if (soundSystem.getMusicPaused()) {
      if (start < 0) {
        soundSystem.musicPlay(this.currentMusicSrc)
      } else {
        soundSystem.musicPlay(this.currentMusicSrc)
      }
    }
  }

  /** 음악을 정지합니다. (재개 되기 전까지 재생 불가능) */
  musicStop () {
    soundSystem.musicStop()
    this.currentMusicSrc = ''
  }

  /**
   * 현재 재생중인 음악을 변경합니다.
   * 
   * (라운드가 끝나기 전까지 재생중인 음악은 초기화되지 않습니다.)
   * @param {string} soundSrc 오디오 파일의 경로, 없을경우 현재 음악을 페이드
   * @param {number} fadeTime 페이드 시간
   */
  musicChange (soundSrc = '', fadeTime = 0) {
    this.currentMusicSrc = soundSrc
    if (fadeTime === 0) {
      soundSystem.musicPlay(soundSrc)
    } else {
      soundSystem.musicFadeNextAudio(soundSrc, fadeTime)
    }
  }

  /** 사운드를 재생합니다. */
  soundPlay (soundSrc = '') {
    soundSystem.play(soundSrc)
  }

  /** 라운드 시작시에 대한 처리 */
  roundStart () {
    if (this.timeCheckFrame(0, 1)) { // 라운드 시작하자마자 음악 재생
      soundSystem.musicPlay(this.currentMusicSrc)
    }
  }

  /** 
   * musicPlay는 한정적인 상황에서 호출되므로, 라운드를 시작했을 때 음악이 재생되지 않습니다.  
   * 따라서, 현재 음악을 재생할 수 있도록, 이 함수를 프로세스 합니다.
   */
  processFirstMusicPlay () {
    if (this.timeCheckFrame(0, 10)) {
      // 게임 시작 즉시 음악을 호출하는 것이 불가능하므로, 약간의 지연을 넣어서 처리했습니다.
      // 0초 10프레임 시점에서 음악이 재생됩니다.
      this.currentMusicSrc = this.musicSrc
      this.musicPlay()
    }
  }

  /**
   * 불러온 데이터를 이용해 라운드 값을 설정합니다.
   * 
   * 경고: 이 함수를 상속받았다면, 반드시 saveData의 매개변수를 받아야 정상적으로 저장된걸 불러올 수 있습니다.
   */
  setLoadData (saveData) {
    for (let key in saveData) {
      this[key] = saveData[key]
    }

    this.loadDataProgressSaveString()
  }

  /** 
   * 불러온 saveString 값을 이용해 추가적인 설정을 합니다.
   * 이 함수의 내부 구현은 라운드마다 다를 수 있음.
   * 기본적으로 아무것도 수행하지 않습니다.
   * 
   * 주의: setLoadData 함수에서 이 함수를 호출하므로, 다른곳에서 이 함수를 호출하지 마세요.
   */
  loadDataProgressSaveString () {

  }

  getEnemyObject () {
    return fieldState.getEnemyObject()
  }

  getPlayerObject () {
    return fieldState.getPlayerObject()
  }

  getSpriteObject () {
    return fieldState.getSpriteObject()
  }

  addScore (score = 0) {
    fieldSystem.requestAddScore(score)
  }
}

class Round1_1 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round1_1)
    this.backgroundImageSrc = imageSrc.round.round1_1_space
    this.musicSrc = soundSrc.music.music01_space_void
    this.bossMusic = soundSrc.music.music06_round1_boss_thema

    this.addRoundPhase(this.roundPhase00, 1, 10)
    this.addRoundPhase(this.roundPhase01, 11, 30)
    this.addRoundPhase(this.roundPhase02, 31, 60)
    this.addRoundPhase(this.roundPhase03, 61, 90)
    this.addRoundPhase(this.roundPhase04, 91, 120)
    this.addRoundPhase(this.roundPhase05, 121, 148)

    // 로드해야 할 파일 리스트 작성
    this.addLoadingImageList([
      imageSrc.round.round1_1_space,
      imageSrc.round.round1_2_meteorite,
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemyDie.enemyDieSpaceComet,
      imageSrc.enemyDie.enemyDieSpaceGamjigi
    ])
    this.addLoadingSoundList([
      soundSrc.music.music01_space_void,
      soundSrc.music.music06_round1_boss_thema
    ])

    this.addLoadingImageList(RoundPackLoad.getRound1ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound1ShareSound())
  }

  roundPhase00 () {
    if (this.timeCheckInterval(2, 10, 10)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
    }
  }

  roundPhase01 () {
    if (this.timeCheckInterval(11, 30, 30)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
    }

    if (this.timeCheckInterval(11, 15, 30)) {
      this.createEnemy(ID.enemy.spaceEnemy.rocket)
    } else if (this.timeCheckInterval(16, 20, 30)) {
      this.createEnemy(ID.enemy.spaceEnemy.car)
    } else if (this.timeCheckInterval(21, 25, 30)) {
      this.createEnemy(ID.enemy.spaceEnemy.square)
    } else if (this.timeCheckInterval(26, 30, 30)) {
      this.createEnemy(ID.enemy.spaceEnemy.attack)
    }
  }

  roundPhase02 () {
    if (this.timeCheckInterval(31, 60, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
    }

    if (this.timeCheckInterval(31, 35, 30)) {
      this.createEnemy(ID.enemy.spaceEnemy.energy)
    }

    // 일정 시간 간격으로 적 번호를 정하여 적을 생성한다.
    if (this.timeCheckInterval(36, 50, 30) || this.timeCheckInterval(51, 60, 20)) {
      const ENEMY_TYPE = 5
      let targetNumber = Math.floor(Math.random() * ENEMY_TYPE)
      switch (targetNumber) {
        case 0: this.createEnemy(ID.enemy.spaceEnemy.rocket); break
        case 1: this.createEnemy(ID.enemy.spaceEnemy.car); break
        case 2: this.createEnemy(ID.enemy.spaceEnemy.square); break
        case 3: this.createEnemy(ID.enemy.spaceEnemy.attack); break
        case 4: this.createEnemy(ID.enemy.spaceEnemy.energy); break
      }
    }

  }

  roundPhase03 () {
    // 혜성도 대거 등장하고, 빛들이 많아짐
    if (this.timeCheckInterval(61, 74, 15) || this.timeCheckInterval(75, 90, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    // 그리고 곧이어 수송선도 등장
    if (this.timeCheckInterval(75, 90, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.susong)
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }
  }

  roundPhase04 () {
    // 수송선과 감지기가 메인이 되고, 빛과 운석 비중이 줄어둠.
    if (this.timeCheckInterval(91, 120, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    if (this.timeCheckInterval(91, 120, 180)) {
      this.createEnemy(ID.enemy.spaceEnemy.susong)
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(91, 120, 120)) {
      const ENEMY_TYPE = 5
      let targetNumber = Math.floor(Math.random() * ENEMY_TYPE)
      switch (targetNumber) {
        case 0: this.createEnemy(ID.enemy.spaceEnemy.rocket); break
        case 1: this.createEnemy(ID.enemy.spaceEnemy.car); break
        case 2: this.createEnemy(ID.enemy.spaceEnemy.square); break
        case 3: this.createEnemy(ID.enemy.spaceEnemy.attack); break
        case 4: this.createEnemy(ID.enemy.spaceEnemy.energy); break
      }
    }
  }

  roundPhase05 () {
    // 이제 수송선, 감지기, 운석만 등장...
    if (this.timeCheckInterval(121, 141, 240)) {
      this.createEnemy(ID.enemy.spaceEnemy.susong)
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(121, 141, 90)) {
      this.createEnemy(ID.enemy.spaceEnemy.meteorite)
    }

    this.timePauseEnemyCount(144)

    if (this.timeCheckFrame(147, 0)) {
      this.requestBossMode(ID.enemy.spaceEnemy.boss, soundSrc.music.music06_round1_boss_thema)
    }
  }

  processBackground () {
    if (this.timeCheckInterval(0, 10)) {
      this.backgroundSpeedX = 0.2
    } else if (this.timeCheckInterval(11, 30, 6)) {
      if (this.backgroundSpeedX < 2) this.backgroundSpeedX += 0.02
    } else if (this.timeCheckInterval(31, 60, 6)) {
      if (this.backgroundSpeedX < 10) this.backgroundSpeedX += 0.05
    } else if (this.timeCheckInterval(61, 136, 6)) {
      if (this.backgroundSpeedX < 20) this.backgroundSpeedX += 0.1
    } else if (this.timeCheckInterval(136, 150, 6)) {
      // 감속 구간
      if (this.backgroundSpeedX > 1) this.backgroundSpeedX -= 0.2
    }

    if (this.timeCheckInterval(0, 142, 180)) {
      let randomNumber = Math.random() * 99
      let moveSpeed = Math.random() * 0.3
      
      if (randomNumber <= 33) moveSpeed = -moveSpeed
      else if (randomNumber <= 66) moveSpeed = 0

      this.backgroundSpeedY = moveSpeed
    }

    if (this.timeCheckInterval(143, this.finishTime)) {
      this.backgroundSpeedY = 0
    }

    // 운석지대로 화면 전환
    if (this.timeCheckFrame(140, 0)) {
      this.changeBackgroundImage(imageSrc.round.round1_2_meteorite, 300)
    }

    // 운석지대로 진입한 이후 저장 후 불러왔을 때 운석 지대 이미지로 변경
    if (this.timeCheckInterval(140, 150)) {
      this.backgroundImageSrc = imageSrc.round.round1_2_meteorite
    }

    super.processBackground()
  }
}

class Round1_2 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round1_2)
    this.backgroundImageSrc = imageSrc.round.round1_2_meteorite
    this.musicSrc = soundSrc.music.music02_meteorite_zone_field
    this.meteoriteDeepImage = imageSrc.round.round1_3_meteoriteDeep

    this.addRoundPhase(this.roundPhase00, 0, 15)
    this.addRoundPhase(this.roundPhase01, 16, 30)
    this.addRoundPhase(this.roundPhase02, 31, 45)
    this.addRoundPhase(this.roundPhase03, 46, 60)
    this.addRoundPhase(this.roundPhase04, 61, 90)
    this.addRoundPhase(this.roundPhase05, 91, 120)
    this.addRoundPhase(this.roundPhase06, 121, 150)
    this.addRoundPhase(this.roundPhase07, 151, 176)

    // 로드해야 할 파일 리스트 작성
    this.addLoadingImageList([
      imageSrc.round.round1_2_meteorite,
      imageSrc.round.round1_3_meteoriteDeep,
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemyDie.enemyDieSpaceComet,
      imageSrc.enemyDie.enemyDieSpaceGamjigi
    ])

    this.addLoadingSoundList([
      soundSrc.music.music02_meteorite_zone_field,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound1ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound1ShareSound())
  }

  processBackground () {
    this.backgroundSpeedX = 0.4

    // 마지막 페이즈에서 배경화면 변경
    let lastPhaseTime = this.phaseTime[this.phaseTime.length - 1].startTime
    if (this.timeCheckFrame(lastPhaseTime, 0)) {
      this.changeBackgroundImage(this.meteoriteDeepImage, 300)
    }

    // 배경화면 변경 적용 (페이드 효과 이후 시간에)
    if (this.timeCheckInterval(lastPhaseTime, this.finishTime)) {
      this.backgroundImageSrc = this.meteoriteDeepImage
    }

    if (this.timeCheckInterval(31, 150, 180)) {
      this.backgroundSpeedY = 0.3
    } else if (this.timeCheckInterval(151, this.finishTime)) {
      this.backgroundSpeedY = 0
    }

    super.processBackground()
  }

  roundPhase00 () {
    // 운석의 등장
    if (this.timeCheckInterval(0, 15, 40)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.createEnemy(ID.enemy.meteoriteEnemy.class3)
    }
    if (this.timeCheckInterval(0, 15, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }
  
  roundPhase01 () {
    if (this.timeCheckInterval(16, 30, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
      this.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
    }
    if (this.timeCheckInterval(16, 30, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase02 () {
    if (this.timeCheckInterval(31, 45, 120)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.stone)
    }
    if (this.timeCheckInterval(16, 30, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase03 () {
    if (this.timeCheckInterval(46, 60, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.bomb)
    }
    if (this.timeCheckInterval(46, 60, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase04 () {
    // space enemy: total 25%
    if (this.timeCheckInterval(61, 90, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(61, 90, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    if (this.timeCheckInterval(61, 90, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.square)
      this.createEnemy(ID.enemy.spaceEnemy.energy)
    }

    // meteoriteEnemy: total 53?%
    if (this.timeCheckInterval(61, 90, 120)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
      this.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
    }

    if (this.timeCheckInterval(61, 90, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class1)
    }

    if (this.timeCheckInterval(61, 90, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class2)
    }

    if (this.timeCheckInterval(61, 90, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class3)
    }
  }

  roundPhase05 () {
    if (this.timeCheckInterval(91, 120, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(91, 120, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class4)
      this.createEnemy(ID.enemy.meteoriteEnemy.bombBig)
    }

    if (this.timeCheckInterval(91, 120, 240)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.stone)
    }
  }

  roundPhase06 () {
    if (this.timeCheckInterval(121, 150, 30)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.createEnemy(ID.enemy.meteoriteEnemy.class3)
    }

    if (this.timeCheckInterval(121, 150, 20)) {
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    if (this.timeCheckInterval(121, 150, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.stonePiece)
    }
  }

  roundPhase07 () {
    if (this.timeCheckInterval(151, 176, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
      this.createEnemy(ID.enemy.meteoriteEnemy.class4)
    }

    if (this.timeCheckInterval(151, 176, 120)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
      this.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
    }

    if (this.timeCheckInterval(151, 176, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.bomb)
    }
  }
}

class Round1_3 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round1_3)
    this.backgroundImageSrc = imageSrc.round.round1_3_meteoriteDeep
    this.musicSrc = soundSrc.music.music02_meteorite_zone_field

    // ---
    this.battleMusic = soundSrc.music.music03_meteorite_zone_battle
    this.redZone1 = imageSrc.round.round1_5_meteoriteRed
    this.redZone2 = imageSrc.round.round1_4_meteoriteDark

    this.addRoundPhase(this.roundPhase00, 1, 10)
    this.addRoundPhase(this.roundPhase01, 11, 30)
    this.addRoundPhase(this.roundPhase02, 31, 70)
    this.addRoundPhase(this.roundPhase03, 71, 90)
    this.addRoundPhase(this.roundPhase04, 91, 140)
    this.addRoundPhase(this.roundPhase05, 141, 160)
    this.addRoundPhase(this.roundPhase06, 161, 180)
    this.addRoundPhase(this.roundPhase07, 181, 200)
    this.addRoundPhase(this.roundPhase08, 201, 207)

    // 로드해야 할 파일 리스트 작성
    this.addLoadingImageList([
      imageSrc.round.round1_3_meteoriteDeep,
      imageSrc.round.round1_4_meteoriteDark,
      imageSrc.round.round1_5_meteoriteRed,
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemy.jemulEnemy,
      imageSrc.enemy.meteoriteEnemy,
      imageSrc.enemyDie.enemyDieSpaceComet,
      imageSrc.enemyDie.enemyDieSpaceGamjigi
    ])

    this.addLoadingSoundList([
      soundSrc.music.music02_meteorite_zone_field,
      soundSrc.music.music03_meteorite_zone_battle,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound1ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound1ShareSound())
  }

  processBackground () {
    this.backgroundSpeedX = 0.4

    let phase6Start = this.phaseTime[6].startTime
    let phase8Start = this.phaseTime[8].startTime
    if (this.timeCheckFrame(phase6Start, 0)) {
      this.changeBackgroundImage(this.redZone1, 1200)
    } else if (this.timeCheckFrame(phase8Start, 0)) {
      this.changeBackgroundImage(this.redZone2, 300)
    }

    if (this.timeCheckInterval(phase6Start, phase8Start)) {
      this.backgroundImageSrc = this.redZone1
    } else if (this.timeCheckInterval(phase8Start, this.finishTime)) {
      this.backgroundImageSrc = this.redZone2
    }

    if (this.timeCheckInterval(31, phase8Start, 180)) {
      this.backgroundSpeedY = 0.3
    } else if (this.timeCheckInterval(phase8Start, this.finishTime)) {
      this.backgroundSpeedY = 0
    }

    super.processBackground()
  }

  /**
   * 제물보스의 체력을 출력합니다.
   * 
   * 1-3 라운드에서만 사용하는 특별한 함수.
   */
  displayJemulBossMeter () {
    let enemyObject = fieldState.getEnemyObject()
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      if (currentEnemy.id === ID.enemy.jemulEnemy.boss) {
        graphicSystem.meterRect(0, 0, graphicSystem.CANVAS_WIDTH, 20, ['#DDA7A7', '#FF4545'], currentEnemy.hp, currentEnemy.hpMax, true)
        digitalDisplay(`boss hp: ${currentEnemy.hp}/${currentEnemy.hpMax}`, 10, 2)
      }
    }
  }

  roundPhase00 () {
    // 운석이 쏟아지는(?) 페이즈
    if (this.timeCheckInterval(0, 9, 90)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.createEnemy(ID.enemy.meteoriteEnemy.class3)
      this.createEnemy(ID.enemy.meteoriteEnemy.class4)
    }

    this.timePauseEnemyCount(10, 5)
  }

  roundPhase01 () {
    // 보스 첫번째 등장 (같은보스가 이 라운드 내에서 여러번 등장합니다.)
    // 보스가 한번만 등장하도록, currentTimeFrame을 사용하여 추가로 시간 조건을 넣었습니다.
    if (this.timeCheckFrame(11, 0)) {
      this.createEnemy(ID.enemy.jemulEnemy.boss, 900)
      this.musicChange(this.battleMusic, 2)
    }

    // 보스가 죽었다면, 스킵 (이 구간은 건너뜀)
    if (this.timeCheckInterval(18, 29, 4) && this.enemyNothingCheck()) {
      this.currentTime = 30
    }

    // 적이 있다면, 시간을 멈춥니다.
    if (this.timeCheckInterval(30)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }
  }

  roundPhase02 () {
    // 음악 변경
    if (this.timeCheckFrame(31, 1)) {
      this.musicChange(this.musicSrc, 2)
    }

    if (this.timeCheckInterval(31, 36, 20)) {
      this.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
    }
    if (this.timeCheckInterval(37, 42, 30)) {
      this.createEnemy(ID.enemy.jemulEnemy.energyBolt)
    }
    if (this.timeCheckInterval(43, 48, 30)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellDrill)
    }
    if (this.timeCheckInterval(49, 54, 30)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellSpike)
    }
    if (this.timeCheckInterval(55, 68, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }

    // 적의 수가 2 초과라면, 시간이 일시정지합니다.
    this.timePauseEnemyCount(69, 2)
  }

  roundPhase03 () {
    // 이 페이즈 이후 부터 해당 음악이 적용됩니다.
    if (this.timeCheckFrame(71, 1)) {
      this.createEnemy(ID.enemy.jemulEnemy.boss, 900)
      this.musicChange(this.battleMusic, 2)
    }
    
    if (this.timeCheckFrame(73, 33)) {
      // 라운드 내의 함수로 만들기에는 애매해서 부득이하게 직접 조정함.
      // 음악을 처음부터 재생하는것이 아닌 중간부터 재생함.
      soundSystem.setCurrentMusicCurrentTime(23)
    }

    // 보스가 죽었다면, 지속적으로 적이 등장
    if (this.timeCheckInterval(75, 88, 30) && this.enemyNothingCheck()) {
      this.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
    }

    // 적이 있다면, 시간을 멈춥니다.
    if (this.timeCheckInterval(90, 90)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }
  }

  roundPhase04_1 () {
    // 감지기 + 제물에어 + 제물쉽 = 초당 60% 딜 필요
    if (this.timeCheckInterval(91, 100, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
      this.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }
  }

  roundPhase04_2 () {
    if (this.timeCheckInterval(101, 110, 120)) {
      for (let i = 0; i < 6; i++) {
        this.createEnemy(ID.enemy.jemulEnemy.rotateRocket, graphicSystem.CANVAS_WIDTH, (i * 80))
      }
    }
  }

  roundPhase04_3 () {
    // 48%
    if (this.timeCheckInterval(111, 120, 60)) {
      for (let i = 0; i < 4; i++) {
        this.createEnemy(ID.enemy.jemulEnemy.energyBolt)
      }
    }

    // 60%
    if (this.timeCheckInterval(112, 113, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellDrill, graphicSystem.CANVAS_WIDTH_HALF + 40, 0)
      this.createEnemy(ID.enemy.jemulEnemy.hellDrill, graphicSystem.CANVAS_WIDTH_HALF - 40, 0)
      this.createEnemy(ID.enemy.jemulEnemy.hellDrill, graphicSystem.CANVAS_WIDTH_HALF + 40, graphicSystem.CANVAS_HEIGHT)
      this.createEnemy(ID.enemy.jemulEnemy.hellDrill, graphicSystem.CANVAS_WIDTH_HALF - 40, graphicSystem.CANVAS_HEIGHT)
    }

    // 40%
    if (this.timeCheckInterval(116, 117, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellSpike, 0, 0)
      this.createEnemy(ID.enemy.jemulEnemy.hellSpike, graphicSystem.CANVAS_WIDTH, 0)
      this.createEnemy(ID.enemy.jemulEnemy.hellSpike, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT)
      this.createEnemy(ID.enemy.jemulEnemy.hellSpike, 0, graphicSystem.CANVAS_HEIGHT)
    }
  }

  roundPhase04_4 () {
    if (this.timeCheckInterval(121, 122, 30)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.bomb)
      this.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
      this.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
    }

    if (this.timeCheckInterval(123, 127, 20)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(127, 130, 10)) {
      this.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
    }
  }

  roundPhase04_5 () {
    if (this.timeCheckInterval(131, 137, 30)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }
  }

  roundPhase04 () {
    this.roundPhase04_1()
    this.roundPhase04_2()
    this.roundPhase04_3()
    this.roundPhase04_4()
    this.roundPhase04_5()
    this.timePauseEnemyCount(139, 4)
  }

  roundPhase05 () {
    if (this.timeCheckInterval(141) && this.currentTimeFrame === 0) {
      this.createEnemy(ID.enemy.jemulEnemy.boss, 900)
    }

    // 보스가 죽었다면 지속적으로 적이 등장
    if (this.timeCheckInterval(145, 158, 60) && this.enemyNothingCheck()) {
      this.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }

    // 적이 있다면, 시간을 멈춥니다.
    this.timePauseEnemyCount(159, 0)
  }

  roundPhase06 () {
    if (this.timeCheckInterval(161) && this.currentTimeFrame === 0) {
      this.createEnemy(ID.enemy.jemulEnemy.boss, 900)
      for (let i = 0; i < 5; i++) {
        this.createEnemy(ID.enemy.jemulEnemy.hellShip)
      }
    }

    // 보스까지 있는데 로켓까지 나온다. 지옥이다.
    if (this.timeCheckInterval(166, 176, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.rotateRocket, graphicSystem.CANVAS_WIDTH, 0)
    }

    // 보스가 죽은경우 로켓이 쏟아짐
    if (this.timeCheckInterval(165, 178, 20) && this.enemyNothingCheck()) {
      this.createEnemy(ID.enemy.jemulEnemy.rotateRocket, graphicSystem.CANVAS_WIDTH, 0)
    }

    // 적이 있다면, 시간을 멈춥니다.
    this.timePauseEnemyCount(179, 0)
  }

  roundPhase07 () {
    if (this.timeCheckInterval(181) && this.currentTimeFrame === 0) {
      this.createEnemy(ID.enemy.jemulEnemy.boss, 900)
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(184, 191, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(185, 185, 30)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellShip, graphicSystem.CANVAS_WIDTH, 0)
      this.createEnemy(ID.enemy.jemulEnemy.hellShip, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT_HALF)
      this.createEnemy(ID.enemy.jemulEnemy.hellShip, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT)
    }

    if (this.timeCheckInterval(189, 189, 30)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellAir, graphicSystem.CANVAS_WIDTH, 0)
      this.createEnemy(ID.enemy.jemulEnemy.hellAir, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT_HALF)
      this.createEnemy(ID.enemy.jemulEnemy.hellAir, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT)
    }

    if (this.timeCheckInterval(195, 198, 20)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 적이 있다면, 시간을 멈춥니다.
    this.timePauseEnemyCount(199, 0)
  }

  roundPhase08 () {
    // 아직도 안끝났다! 마지막 페이즈
    if (this.timeCheckInterval(200, 206, 10)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellDrill)
    }
  }

  process () {
    super.process()

    if (this.getCurrentPhase() >= 4 && this.currentMusicSrc != this.battleMusic) {
      this.musicChange(this.battleMusic, 2)
    }
  }

  display () {
    super.display()

    // 중간보스가 등장하는 페이즈에서는 보스의 체력을 표시하도록 처리
    if ([1, 3, 5, 6, 7].includes(this.getCurrentPhase())) {
      this.displayJemulBossMeter()
    }
  }
}

class Round1_4 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round1_4)
    this.backgroundImageSrc = imageSrc.round.round1_4_meteoriteDark
    this.musicSrc = soundSrc.music.music03_meteorite_zone_battle
    this.waitTimeFrame = 0
    this.backgroundDegree = 0
    this.backgroundFilp = 0

    this.messageSound = {
      message1: soundSrc.round.r1_4_message1,
      message2: soundSrc.round.r1_4_message2,
      jemulstar: soundSrc.round.r1_4_jemulstar,
      jemulstart: soundSrc.round.r1_4_jemulstart,
      jemulrun: soundSrc.round.r1_4_jemulrun
    }

    this.specialImage = imageSrc.round.round1_4_redzone

    this.addRoundPhase(this.roundPhase00, 1, 20)
    this.addRoundPhase(this.roundPhase01, 21, 80)
    this.addRoundPhase(this.roundPhase02, 81, 110)
    this.addRoundPhase(this.roundPhase03, 111, 150)

    /** 제물스타 이펙트 */
    this.effectJemulstar = new CustomEffect(imageSrc.effect.jemulstar, imageDataInfo.effect.jemulstar, 500, 320, 3, 2)

    /** 제물 생성 이펙트 */
    this.EffectJemulCreate = class JemulCreateEffect extends CustomEditEffect {
      constructor () {
        super()
        this.autoSetEnimation(imageSrc.effect.jemulCreate, imageDataInfo.effect.jemulCreate, 200, 200, 4, 15)
      }
    
      process () {
        super.process()
    
        // 각도 회전
        if (this.enimation != null) {
          this.enimation.degree += 4
        }
      }
    }

    this.addLoadingImageList([
      imageSrc.round.round1_4_meteoriteDark,
      imageSrc.round.round1_4_redzone,
      imageSrc.enemy.jemulEnemy,
      imageSrc.effect.jemulstar,
      imageSrc.effect.jemulCreate,
    ])

    this.addLoadingSoundList([
      soundSrc.music.music03_meteorite_zone_battle,
      soundSrc.music.music06_round1_boss_thema,
      soundSrc.music.music08_round1_4_jemul,
      this.messageSound.message1,
      this.messageSound.message2,
      this.messageSound.jemulrun,
      this.messageSound.jemulstar,
      this.messageSound.jemulstart,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound1ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound1ShareSound())
  }

  processBackground () {
    // 참고: 1-4는 여기에 배경을 조정하는 기능이 없고 각 roundPhase마다 적혀져있습니다.
    if (this.getCurrentPhase() === 0 || this.getCurrentPhase() === 1) {
      this.backgroundSpeedX = 0.4
    } else if (this.getCurrentPhase() === 2 || this.getCurrentPhase() === 3) {
      // 자연스러운 배경 변화를 위해 x축 위치를 고정시킴
      // 다만, 다음 페이즈에서 배경을 흔드는 상황이 오기 때문에 이 처리는 페이즈 3에서만 적용
      // 주의: 초반에 시간을 너무 끌어버린 경우, 부자연스럽게 배경이 이동할 수 있음.
      // 이것은 버그로 취급하지 않음.
      this.backgroundSpeedX = 0

      // 만약 배경 X축이 앞으로 이동되었다면, 강제로 0으로 오도록 변경
      if (this.backgroundX > 4) {
        this.backgroundX -= 4
      } else {
        this.backgroundX = 0
      }
    }

    const phase3Time = this.phaseTime[3].startTime
    const phase3End = this.phaseTime[3].endTime

    if (this.timeCheckInterval(phase3Time, phase3Time + 10, 2)) {
      // 엄청나게 배경 흔들기
      this.backgroundX = Math.random() * (phase3End - this.currentTime) * 4
      this.backgroundY = Math.random() * (phase3End - this.currentTime) * 4
    } else if (this.timeCheckInterval(phase3Time + 10, phase3Time + 20, 3)) {
      // 위력 약화
      this.backgroundX = Math.random() * (phase3End - this.currentTime) * 3
      this.backgroundY = Math.random() * (phase3End - this.currentTime) * 3
    } else if (this.timeCheckInterval(phase3Time + 20, phase3End - 4, 4)) {
      this.backgroundX = Math.random() * (phase3End - this.currentTime) * 2
      this.backgroundY = Math.random() * (phase3End - this.currentTime) * 2
    }

    super.processBackground()
  }

  roundPhase00 () {
    // 시작하자마자 보스 등장 (0 ~ 10)
    if (this.timeCheckInterval(3) && this.currentTimeFrame === 0) {
      this.createEnemy(ID.enemy.jemulEnemy.boss)
      this.musicChange(soundSrc.music.music06_round1_boss_thema)
    }

    // 보스가 일찍 죽으면 해당 페이즈 스킵
    if (this.timeCheckInterval(7, 15) && this.enemyNothingCheck()) {
      this.currentTime = 15
    }

    if (this.timeCheckInterval(16)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }

    if (this.timeCheckInterval(17)) {
      soundSystem.musicStop()
    }
  }

  roundPhase01 () {
    // 진짜 보스 등장(...)
    if (this.timeCheckInterval(21) && this.currentTimeFrame === 0) {
      this.musicChange(this.musicSrc)
      this.createEnemy(ID.enemy.jemulEnemy.bossEye, graphicSystem.CANVAS_WIDTH_HALF - 100, graphicSystem.CANVAS_HEIGHT_HALF - 100)
    }
    
    if (this.timeCheckInterval(22, 79) && this.enemyNothingCheck()) {
      this.waitTimeFrame++

      if (this.waitTimeFrame >= 600) {
        this.currentTime = 80
      }
    }
  }

  roundPhase02 () {
    // 필드에 있는 보스 데이터 얻어오기
    let enemyObject = fieldState.getEnemyObject()

    // 특정 보스의 데이터 얻어오기 (뭔가 이상한 방식이긴 하지만...)
    /** 
     * @type {any} // JemulEnemyBossEye
     */
    let boss = null
    for (let i = 0; i < enemyObject.length; i++) {
      if (enemyObject[i].id === ID.enemy.jemulEnemy.bossEye) {
        boss = enemyObject[i]
        break
      }
    }

    let phase2Time = this.phaseTime[2].startTime

    if (this.timeCheckInterval(phase2Time)) {
      // 보스의 모든 행동을 강제로 멈춤
      boss.requestStateStop()
    }

    this.musicStop() // 음악 강제 정지

    if (this.timeCheckFrame(phase2Time + 5, 0)) {
      this.changeBackgroundImage(this.specialImage, 150)
    }
    if (this.timeCheckInterval(phase2Time + 5, phase2Time + 30)) {
      this.backgroundImageSrc = this.specialImage
      this.backgroundSpeedX = 0
      this.backgroundSpeedY = 0
    }

    // 사운드 출력
    if (this.timeCheckFrame(phase2Time + 10, 0)) soundSystem.play(this.messageSound.message1)
    if (this.timeCheckFrame(phase2Time + 15, 0)) soundSystem.play(this.messageSound.message2)
    if (this.timeCheckFrame(phase2Time + 20, 0)) soundSystem.play(this.messageSound.jemulstar)

    if (this.timeCheckInterval(phase2Time + 20, phase2Time + 23, 30)) {
      if (boss != null) {
        fieldState.createEffectObject(this.effectJemulstar, boss.x - 50, boss.y - 50, 20)
      } else {
        fieldState.createEffectObject(this.effectJemulstar, 250, 150, 20)
      }
    }

    if (this.timeCheckFrame(phase2Time + 25)) {
      // 보스 죽이기 (점수도 얻음.)
      if (boss != null) {
        boss.requestDie()
      }
    }
    
  }

  roundPhase03 () {
    const phase3Time = this.phaseTime[3].startTime
    const phase3End = this.phaseTime[3].endTime

    if (this.timeCheckFrame(phase3Time, 5)) {
      this.musicChange(soundSrc.music.music08_round1_4_jemul)
    }

    this.backgroundImageSrc = this.specialImage

    // 배경 흔들기는 processBackground에서 처리합니다.

    // 저주받은 운석들이 등장함. 파괴해도, 더 강한 운석이 등장할 뿐...
    if (this.timeCheckInterval(phase3Time, phase3Time + 30, 30)) {
      // 가운데에서 운석 소환 (정학한 가운데는 구현이 어려움)
      this.createEnemy(ID.enemy.jemulEnemy.redMeteorite, graphicSystem.CANVAS_WIDTH_HALF - 60, graphicSystem.CANVAS_HEIGHT_HALF - 20)
    }

    // 운석 최대 개수 = 1초에 1씩 증가하고 최대 25로 고정
    let meteoriteMaxCount = this.currentTime - phase3Time + 1
    if (meteoriteMaxCount > 25) meteoriteMaxCount = 25

    // 운석을 아무리 죽여봤자 의미 없을 뿐... 더 강한 운석이 나온다.
    if (this.timeCheckInterval(phase3Time, phase3End, 1) && this.getEnemyCount() < meteoriteMaxCount) {
      this.createEnemy(ID.enemy.jemulEnemy.redMeteoriteImmortal, graphicSystem.CANVAS_WIDTH_HALF - 60, graphicSystem.CANVAS_HEIGHT_HALF - 20)
    }

    // 이펙트 표시
    if (this.timeCheckInterval(phase3Time, phase3End - 5, 60)) {
      fieldState.createEffectObject(new this.EffectJemulCreate(), graphicSystem.CANVAS_WIDTH_HALF - 100, graphicSystem.CANVAS_HEIGHT_HALF - 100)
    }

    // 사운드 출력
    if (this.timeCheckFrame(phase3Time, 0)) {
      soundSystem.play(this.messageSound.jemulstart)
    } else if (this.timeCheckInterval(phase3Time + 4, phase3End - 4, 240)) {
      soundSystem.play(this.messageSound.jemulrun)
    }
  }

  processPhaseEndEnemyNothing () {
    // 페이즈 끝일 때, 적이 있어도 시간 진행됨
    // 즉, 적이 남아있어도 라운드 클리어 가능
  }

  processDebug () {

  }

  display () {
    super.display()
    if (this.getCurrentPhase() >= 0 && this.getCurrentPhase() <= 3 && this.currentTime <= 110) {
      this.showBossHp()
    }
  }
}

class Round1_5 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round1_5)
    this.backgroundImageSrc = imageSrc.round.round1_4_meteoriteDark
    this.redZoneImage = imageSrc.round.round1_5_meteoriteRed
    this.musicSrc = soundSrc.music.music04_meteorite_zone_red

    this.addRoundPhase(this.roundPhase00, 1, 30)
    this.addRoundPhase(this.roundPhase01, 31, 60)
    this.addRoundPhase(this.roundPhase02, 61, 90)
    this.addRoundPhase(this.roundPhase03, 91, 107)
    this.addRoundPhase(this.roundPhase04, 108, 120)
    this.addRoundPhase(this.roundPhase05, 121, 150)
    this.addRoundPhase(this.roundPhase06, 151, 180)
    this.addRoundPhase(this.roundPhase07, 181, 200)
    this.addRoundPhase(this.roundPhase08, 201, 207)

    this.addLoadingImageList([
      imageSrc.round.round1_4_meteoriteDark,
      imageSrc.round.round1_5_meteoriteRed,
      imageSrc.enemy.jemulEnemy,
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemy.meteoriteEnemy,
    ])

    this.addLoadingSoundList([
      soundSrc.music.music04_meteorite_zone_red,
      soundSrc.music.music02_meteorite_zone_field,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound1ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound1ShareSound())
  }

  processBackground () {
    const imageA = imageSrc.round.round1_3_meteoriteDeep
    let phase7Start = this.phaseTime[7].startTime
    let phase8Start = this.phaseTime[8].startTime
    if (this.timeCheckFrame(phase7Start, 0)) {
      this.changeBackgroundImage(imageA, 600)
    } else if (this.timeCheckFrame(30, 0)) {
      this.changeBackgroundImage(this.redZoneImage, 600)
    }

    if (this.timeCheckInterval(0, phase7Start - 1)) {
      this.backgroundSpeedX = 0.8
    } else if (this.timeCheckInterval(phase7Start, phase8Start)) {
      this.backgroundSpeedX = 1.2
    } else if (this.timeCheckInterval(phase8Start, 210)) {
      this.backgroundSpeedX = 1
    }

    if (this.timeCheckInterval(45, 150, 600)) {
      if (this.backgroundSpeedY === 0 || this.backgroundSpeedY === 0.1) {
        this.backgroundSpeedY = -0.1
      } else {
        this.backgroundSpeedY = 0.1
      }
    }

    super.processBackground()
  }

  roundPhase00 () {
    if (this.timeCheckInterval(1, 11, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.red)
    } else if (this.timeCheckInterval(12, 17, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.redAir)
    } else if (this.timeCheckInterval(18, 23, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.redShip)
    } else if (this.timeCheckInterval(24, 30, 20)) {
      this.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }
  }

  roundPhase01 () {
    // 요구되는 초당 dps 비중
    // 비행기: 70%, 쉽: 70%, 운석: 50%, 비행기 or 쉽 + 쥬얼 80%

    if (this.timeCheckInterval(31, 36, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.createEnemy(ID.enemy.jemulEnemy.hellAir)
    } else if (this.timeCheckInterval(37, 42, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.redShip)
      this.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }

    if (this.timeCheckInterval(43, 49, 120)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.red)
    }

    if (this.timeCheckInterval(50, 60, 60)) {
      let randomNumber = Math.random() * 100
      if (randomNumber < 50) {
        this.createEnemy(ID.enemy.jemulEnemy.redAir)
        this.createEnemy(ID.enemy.jemulEnemy.hellAir)
      } else {
        this.createEnemy(ID.enemy.jemulEnemy.redShip)
        this.createEnemy(ID.enemy.jemulEnemy.hellShip)
      }
    }

    if (this.timeCheckInterval(50, 60, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }
  }

  roundPhase02 () {
    // 운석: 초당 72%(70초까지) -> 초당 35%(90초까지)
    if (this.timeCheckInterval(61, 70, 15)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.createEnemy(ID.enemy.meteoriteEnemy.class3)
    } else if (this.timeCheckInterval(71, 90, 120)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.createEnemy(ID.enemy.meteoriteEnemy.class3)
      this.createEnemy(ID.enemy.meteoriteEnemy.red)
    }

    // 로켓 초당 20%(5초동안)
    if (this.timeCheckInterval(61, 65, 60)) {
      for (let i = 0; i < 2; i++) {
        this.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
      }
    }

    // 감지기 초당 20%(5초동안)
    if (this.timeCheckInterval(66, 70, 60)) {
      for (let i = 0; i < 2; i++) {
        this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
      }
    }

    // 비행기 깜짝 출현 -> 초당 140%(2회 등장)
    if (this.timeCheckFrame(73, 0) || this.timeCheckFrame(81, 0)) {
      this.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.createEnemy(ID.enemy.jemulEnemy.redShip)
      this.createEnemy(ID.enemy.jemulEnemy.hellShip)
    }
  }

  roundPhase03 () {
    // 20%
    if (this.timeCheckInterval(90, 105, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 30%
    if (this.timeCheckInterval(90, 105, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.createEnemy(ID.enemy.meteoriteEnemy.class3)
      this.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }

    // 25%
    if (this.timeCheckInterval(90, 105, 150)) {
      this.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.createEnemy(ID.enemy.jemulEnemy.redShip)
    }

    if (this.timeCheckInterval(107)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }
  }

  roundPhase04 () {
    // 보스전
    if (this.timeCheckFrame(108, 7)) {
      this.createEnemy(ID.enemy.jemulEnemy.boss)
    }

    if (this.timeCheckInterval(110, 118) && this.enemyNothingCheck()) {
      this.currentTime = 120
    }

    if (this.timeCheckInterval(119)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }
  }

  roundPhase05 () {
    // 50%
    if (this.timeCheckInterval(121, 135, 10)) {
      this.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }

    // 20%
    if (this.timeCheckInterval(124, 128, 30)) {
      this.createEnemy(ID.enemy.jemulEnemy.rotateRocket)
    }

    // 20%
    if (this.timeCheckInterval(129, 135, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 80%
    if (this.timeCheckInterval(136, 150, 60)) {
      this.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.createEnemy(ID.enemy.jemulEnemy.redShip)
    }
  }

  roundPhase06 () {
    // 80%
    if (this.timeCheckInterval(151, 171, 90)) {
      this.createEnemy(ID.enemy.jemulEnemy.redAir)
      this.createEnemy(ID.enemy.jemulEnemy.redShip)
    }

    // 75%
    if (this.timeCheckInterval(151, 171, 90)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.red)
      this.createEnemy(ID.enemy.meteoriteEnemy.bomb)
    }

    // 30% + 60%
    if (this.timeCheckInterval(174, 178, 20)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
      this.createEnemy(ID.enemy.jemulEnemy.redJewel)
    }

    // 적이 많다면, 시간 멈춤
    if (this.timeCheckInterval(179)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }
  }

  roundPhase07 () {
    // 운석지대
    if (this.timeCheckFrame(181, 11)) {
      this.musicChange(soundSrc.music.music02_meteorite_zone_field)
    }

    // 40%
    if (this.timeCheckInterval(181, 200, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class1)
      this.createEnemy(ID.enemy.meteoriteEnemy.class2)
      this.createEnemy(ID.enemy.meteoriteEnemy.class3)
      this.createEnemy(ID.enemy.meteoriteEnemy.class4)
    }

    // 53%
    if (this.timeCheckInterval(181, 200, 90)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.bomb)
      this.createEnemy(ID.enemy.meteoriteEnemy.whiteMeteo)
      this.createEnemy(ID.enemy.meteoriteEnemy.blackMeteo)
    }
  }

  roundPhase08 () {
    // 50%
    if (this.timeCheckInterval(201, 207, 60)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.stone)
    }
  }

  displayBossHp () {
    if (this.getCurrentPhase() === 4) {
      this.showBossHp()
    }
  }
}

class Round1_6 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round1_6)
    this.backgroundImageSrc = imageSrc.round.round1_2_meteorite
    this.spaceImage = imageSrc.round.round1_6_space
    this.musicSrc = soundSrc.music.music02_meteorite_zone_field
    this.musicTour = soundSrc.music.music05_space_tour
    this.musicPlanet = soundSrc.music.music07_paran_planet_entry
    this.bossMusic = soundSrc.music.music06_round1_boss_thema

    this.addRoundPhase(this.roundPhase00, 1, 30)
    this.addRoundPhase(this.roundPhase01, 31, 60)
    this.addRoundPhase(this.roundPhase02, 61, 90)
    this.addRoundPhase(this.roundPhase03, 91, 120)
    this.addRoundPhase(this.roundPhase04, 121, 148)

    /**
     * 이 라운드에서 행성을 보여주기 위한 오브젝트
     */
    this.planet = this.createPlanet()

    this.addLoadingImageList([
      imageSrc.round.round1_2_meteorite,
      imageSrc.round.round1_6_space,
      imageSrc.round.round1_6_paran_planet,
      imageSrc.enemy.jemulEnemy,
      imageSrc.enemy.spaceEnemy,
      imageSrc.enemy.meteoriteEnemy,
    ])

    this.addLoadingSoundList([
      soundSrc.music.music02_meteorite_zone_field,
      soundSrc.music.music05_space_tour,
      soundSrc.music.music06_round1_boss_thema,
      soundSrc.music.music07_paran_planet_entry,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound1ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound1ShareSound())
  }

  /**
   * 이 라운드에서 행성을 보여주기 위한 오브젝트를 만드는 함수
   */
   createPlanet () {
    return {
      image: imageSrc.round.round1_6_paran_planet,
      elapsedFrame: 0,
      baseSize: 60,
      size: 60,
      degree: 0,
      x: graphicSystem.CANVAS_WIDTH + 100,
      xBase: graphicSystem.CANVAS_WIDTH + 100,
      y: graphicSystem.CANVAS_HEIGHT_HALF,
      totalDisplayTime: 50,
      startTime: 100,
      process: function () {
        this.elapsedFrame++
        const sectionFrame = 300
        const moveSize = (this.xBase - graphicSystem.CANVAS_WIDTH_HALF) / 1200
        const upSize = [
          (100 - this.baseSize) / sectionFrame, // 40
          (180 - 100) / sectionFrame, // 80
          (300 - 180) / sectionFrame, // 120
          (600 - 300) / sectionFrame, // 300
          (1200 - 600) / sectionFrame, // 600
          (2000 - 1200) / sectionFrame // 800
        ]

        const sectionLevel = Math.floor(this.elapsedFrame / 300)
        if (sectionLevel <= 3) {
          this.x = (sectionFrame * 3) - (moveSize * this.elapsedFrame)
        } else if (sectionLevel <= 3 + upSize.length) {
          // sectionLevel 4부터 행성의 크기가 증가
          this.size += upSize[sectionLevel - 4]
          // this.x = 300 // 아마도 중간위치가 300인 것 같음.
        } else {
          this.size += 0
        }
      },
      display: function () {
        let outputX = this.x - (this.size / 2)
        let outputY = this.y - (this.size / 2)
        // 이미지를 가져옴, 없을경우 캐시시킴
        let getImage = graphicSystem.getCacheImage(this.image)
        if (getImage != null) {
          graphicSystem.imageDisplay(this.image, 0, 0, getImage.width,getImage.height, outputX, outputY, this.size, this.size, 0, this.degree)
        }
      }
    }
  }

  roundPhase00 () {
    // 20%
    if (this.timeCheckInterval(1, 24, 240)) {
      this.createEnemy(ID.enemy.spaceEnemy.susong)
    }

    // 35%
    if (this.timeCheckInterval(1, 24, 120)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellAir)
      this.createEnemy(ID.enemy.jemulEnemy.redAir)
    }

    // 20%
    if (this.timeCheckInterval(1, 24, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (this.timeCheckInterval(26)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }

    if (this.timeCheckFrame(27)) {
      this.requestBossMode(ID.enemy.spaceEnemy.boss)
    }
  }

  roundPhase01 () {
    // 빛 생성 여부 설정
    // 24%, 48%, 80%, 24%, 12%
    let isCreateLight = this.timeCheckInterval(31, 34, 10)
      || this.timeCheckInterval(35, 40, 5)
      || this.timeCheckInterval(41, 45, 3)
      || this.timeCheckInterval(46, 50, 10)
      || this.timeCheckInterval(51, 60, 20)
    
    if (isCreateLight) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
    }

    // 30%
    if (this.timeCheckInterval(46, 60, 10)) {
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase02 () {
    // 20%
    if (this.timeCheckInterval(61, 90, 30)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }

    // 20%
    if (this.timeCheckInterval(61, 90, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    // 50%
    if (this.timeCheckInterval(61, 90, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.car)
      this.createEnemy(ID.enemy.spaceEnemy.attack)
      this.createEnemy(ID.enemy.spaceEnemy.energy)
      this.createEnemy(ID.enemy.spaceEnemy.square)
    }

    // 33% ~ 10%
    if (this.timeCheckInterval(75, 76, 30)) {
      this.createEnemy(ID.enemy.spaceEnemy.donggrami)
    } else if (this.timeCheckInterval(77, 90, 150)) {
      this.createEnemy(ID.enemy.spaceEnemy.donggrami)
    }
  }

  roundPhase03 () {
    // 30%, 15%, 7%
    let isCreateEnemy = this.timeCheckInterval(91, 100, 60)
      || this.timeCheckInterval(101, 110, 120)
      || this.timeCheckInterval(111, 120, 240)

    // 20%, 10%, 5%
    let isCreateLight = this.timeCheckInterval(91, 100, 30)
      || this.timeCheckInterval(101, 110, 60)
      || this.timeCheckInterval(111, 120, 120)

    // 15%
    if (this.timeCheckInterval(91, 120, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.donggrami)
    }

    // 10%
    if (this.timeCheckInterval(91, 112, 120)) {
      this.createEnemy(ID.enemy.spaceEnemy.gamjigi)
    }

    if (isCreateEnemy) {
      this.createEnemy(ID.enemy.spaceEnemy.car)
      this.createEnemy(ID.enemy.spaceEnemy.attack)
      this.createEnemy(ID.enemy.spaceEnemy.rocket)
    }

    if (isCreateLight) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
      this.createEnemy(ID.enemy.spaceEnemy.comet)
    }
  }

  roundPhase04 () {
    if (this.timeCheckInterval(126, 133, 40)) {
      this.createEnemy(ID.enemy.spaceEnemy.donggrami, graphicSystem.CANVAS_WIDTH_HALF, graphicSystem.CANVAS_HEIGHT_HALF)
    } else if (this.timeCheckInterval(134, 148, 60)) {
      this.createEnemy(ID.enemy.spaceEnemy.donggrami, graphicSystem.CANVAS_WIDTH_HALF, graphicSystem.CANVAS_HEIGHT_HALF)
    }
  }

  processRound () {
    super.processRound()

    // 음악 재생 시간 관계상, 29초 지점부터 음악이 변경됨.
    if (this.timeCheckFrame(30, 4)) {
      this.musicChange(this.musicTour, 0)
      this.changeBackgroundImage(this.spaceImage, 360)
    }

    // 참고: space tour 음악은 약 97초
    // 음악이 30초 + 97초 = 127초 지점에 종료됨.
    // 파란 행성 진입 음악은 약 128초 붜터 약 24초간 재생됨 (페이드 시간을 고려해서)
    const fadeTime = 1
    const planetMusicPlayTime = 128 - fadeTime
    if (this.timeCheckFrame(planetMusicPlayTime, 0)) {
      this.musicChange(this.musicPlanet, fadeTime)
    }
  }

  processPhaseEndEnemyNothing () {
    // 적 남아있어도 클리어 가능
  }

  processSaveString () {
    // 행성을 배경에 표시하기 위해 데이터의 일부를 저장
    if (this.currentTime >= this.finishTime - this.planet.totalDisplayTime) {
      this.planet.process()
      this.saveString = this.planet.x + ',' + this.planet.size + ',' + this.planet.elapsedFrame
    }
  }

  processBackground () {
    super.processBackground()
    if (this.timeCheckInterval(31, this.finishTime)) {
      this.backgroundImageSrc = this.spaceImage
    }
  }

  displayBackground () {
    super.displayBackground()
    if (this.currentTime >= this.finishTime - this.planet.totalDisplayTime) {
      this.planet.display()
    }
  }

  loadDataProgressSaveString () {
    let str = this.saveString.split(',')
    this.planet.x = Number(str[0])
    this.planet.size = Number(str[1])
    this.planet.elapsedFrame = Number(str[2])
  }
}

class Round1_test extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round1_test)
    this.backgroundSpeedX = 0

    this.addLoadingImageList(RoundPackLoad.getRound1ShareImage())
    this.addLoadingImageList(RoundPackLoad.getRound2ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound1ShareSound())
    this.addLoadingSoundList(RoundPackLoad.getRound2ShareSound())

    this.addLoadingImageList([
      imageSrc.round.round2_4_elevator,
      imageSrc.round.round2_4_elevatorHall,
      imageSrc.round.round2_4_elevatorNumber,
      imageSrc.round.round2_4_floorB1,

      imageSrc.round.round2_6_original1,
      imageSrc.round.round2_6_original2,
      imageSrc.round.round2_6_ruin1,
      imageSrc.round.round2_6_ruin2,
      imageSrc.round.round2_6_quiteRoad,
      imageSrc.round.round2_6_downtowerEntrance,
    ])

    this.backgroundImageSrc = imageSrc.round.round2_6_ruin1

    this.backgroundAbsoluteX = 0
    this.backgroundAbsoluteY = 0

    this.addRoundPhase(() => {
      if (this.timeCheckInterval(0, 999, 60) && this.getEnemyCount() < 1) {
        this.createEnemy(ID.enemy.intruder.nextEnemy)
      }
    }, 0, 999)
  }

  display () {
    graphicSystem.setAlpha(0.01 * this.currentTimeTotalFrame)
    graphicSystem.gradientRect(0, 0, 800, 600, ['yellow'])
    super.display()
    graphicSystem.imageView(imageSrc.round.round2_6_ruin2, 1800 - this.backgroundAbsoluteX, 0)  
  }

  processBackground () {
    if (this.timeCheckInterval(0, 30)) {
      this.backgroundAbsoluteX++
    }

    this.backgroundX = this.backgroundAbsoluteX
  }
  
  displayBackground () {
    graphicSystem.fillRect(0, 0, 999, 999, 'skyblue')
    super.displayBackground()
    
    let time = this.currentTime
    if (this.timeCheckFrame(4) || this.timeCheckFrame(12) || this.timeCheckFrame(20) || this.timeCheckFrame(28) || this.timeCheckFrame(36)) {
      this.changeBackgroundImage(imageSrc.round.round2_6_original1, 120)
    } else if (this.timeCheckFrame(8) || this.timeCheckFrame(16) || this.timeCheckFrame(24) || this.timeCheckFrame(32) || this.timeCheckFrame(40)) {
      this.changeBackgroundImage(imageSrc.round.round2_6_ruin1, 120)
    }
  }
}


class Round2_1 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round2_1)
    this.backgroundImageSrc = imageSrc.round.round2_1_cloud
    this.musicSrc = soundSrc.music.music09_paran_planet
    this.backgroundSpeedX = 0
    this.backgroundSpeedY = 1
    this.backgroundX = 0
    this.maeulImage = imageSrc.round.round2_2_maeul_entrance
    this.bossMusic = '' // 보스전 음악 없음. 기존 음악이 그대로 재생됨.

    this.gradientBg = {
      y: 0,
      number: 0,
      maxLength: 9, 
      height: 1200, // 20 second * 60 frame
    }

    this.addRoundPhase(this.roundPhase01, 0, 30)
    this.addRoundPhase(this.roundPhase02, 31, 60)
    this.addRoundPhase(this.roundPhase03, 61, 90)
    this.addRoundPhase(this.roundPhase04, 91, 120)
    this.addRoundPhase(this.roundPhase05, 121, 148)

    this.addLoadingImageList([
      imageSrc.round.round2_1_cloud,
      imageSrc.round.round2_2_maeul_entrance,
    ])

    this.addLoadingSoundList([
      soundSrc.music.music09_paran_planet,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound2ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound2ShareSound())
  }

  displayBackground () {
    // 색은, 그라디언트 형태로 표현하고 그라디언트의 출력값을 변경하는 방식을 사용
    const darkSky = '#001A33'
    const darklight = '#002E5B'
    const sky = '#00478D'
    const skylight = '#1D6FC0'
    const light = '#4995E1'
    const maeulsky = '#67B2FF'

    const colorA = [darkSky, darklight, darkSky, sky, skylight, sky, light, maeulsky, light, light]
    const colorB = [darklight, darkSky, sky, skylight, sky, light, maeulsky, light, light, light]

    const gradientWidth = 800
    const gradientHeight = 1200 // 20 second * 60 frame
    game.graphic.gradientRect(this.backgroundX, this.gradientBg.y, gradientWidth, gradientHeight, [colorA[this.gradientBg.number], colorB[this.gradientBg.number]], false)
    game.graphic.gradientRect(this.backgroundX, this.gradientBg.y + gradientHeight, gradientWidth, gradientHeight, [colorA[this.gradientBg.number + 1], colorB[this.gradientBg.number + 1]], false)

    // digitalDisplay('b: ' + this.gradientBg.y + ', y: ' + this.backgroundY + ', ' + this.gradientBg.number, 0, 0)
    super.displayBackground()

    // 마을 보여주기
    if (this.currentTime >= 125) {
      // 마을은 125초부터 140초까지 서서히 등장합니다.
      const leftTime = 140 - this.currentTime
      const baseElapsed = 1200
      let elapsed = baseElapsed - (60 * leftTime) + this.currentTimeFrame
      if (elapsed > baseElapsed) elapsed = baseElapsed

      let maeulWidth = Math.floor(game.graphic.CANVAS_WIDTH / baseElapsed * elapsed)
      let maeulHeight = Math.floor(game.graphic.CANVAS_HEIGHT / baseElapsed * elapsed)
      let maeulX = (game.graphic.CANVAS_WIDTH) - maeulWidth
      let maeulY = (game.graphic.CANVAS_HEIGHT) - maeulHeight
      game.graphic.setAlpha(1 / baseElapsed * elapsed)
      game.graphic.imageView(this.maeulImage, maeulX, maeulY, maeulWidth, maeulHeight)
      game.graphic.setAlpha(1)
    }
  }

  processDebug () {
    if (this.timeCheckFrame(0, 5)) {
      // this.currentTime = 31
    }
  }

  processBackground () {
    super.processBackground()
    
    if (this.gradientBg.number < this.gradientBg.maxLength - 1) {
      this.gradientBg.y--
      if (Math.abs(this.gradientBg.y) >= this.gradientBg.height) {
        // 참고: y축의 절대값을 사용하여 비교하는 이유는, y축이 음수값이 증가하는 형태로 되어있기 때문
        this.gradientBg.y = 0
        this.gradientBg.number++
      }
    } else {
      this.gradientBg.y = 0
    }
  }

  loadDataProgressSaveString () {
    let getText = this.saveString.split(',')
    this.gradientBg.y = Number(getText[0])
    this.gradientBg.number = Number(getText[1])
  }
  
  processSaveString () {
    // 그라디언트 배경의 y축값과 number값만 저장
    // 마을 등장은 시간상으로 처리하므로 따로 저장할 필요 없음
    this.saveString = this.gradientBg.y + ',' + this.gradientBg.number
  }

  roundPhase01 () {
    // 참고: 일반 동그라미는 개체당 dps 10%
    // 특수 동그라미는 개체당 dps 20%

    // 파랑 동그라미가 먼저 등장 (dps 40%)
    if (this.timeCheckInterval(3, 9, 15)) {
      this.createEnemy(ID.enemy.donggramiEnemy.miniBlue)
    }
    
    // 초록 동그라미가 추가로 등장 (dps 60%)
    if (this.timeCheckInterval(10, 18, 60)) {
      this.createEnemy(ID.enemy.donggramiEnemy.miniGreen)
      this.createEnemy(ID.enemy.donggramiEnemy.miniGreen)
      this.createEnemy(ID.enemy.donggramiEnemy.miniBlue)
    }

    // 빨강, 보라가 추가로 등장 (dps 80%)
    if (this.timeCheckInterval(19, 27, 60)) {
      this.createEnemy(ID.enemy.donggramiEnemy.miniGreen)
      this.createEnemy(ID.enemy.donggramiEnemy.miniBlue)
      this.createEnemy(ID.enemy.donggramiEnemy.miniRed)
      this.createEnemy(ID.enemy.donggramiEnemy.miniPurple)
    }
  }

  roundPhase02 () {
    // 남은 적들을 전부 죽이지 않으면 시간 일시 정지
    // 이것은, 다음 적들의 특징을 효과적으로 보여주기 위해 추가한 것
    this.timePauseEnemyCount(33)

    // 느낌표 동그라미 dps 60%
    if (this.timeCheckInterval(35, 40, 20)) {
      this.createEnemy(ID.enemy.donggramiEnemy.exclamationMark)
    }

    // 물음표 동그라미 dps 60%
    if (this.timeCheckInterval(43, 48, 20)) {
      this.createEnemy(ID.enemy.donggramiEnemy.questionMark)
    }

    // 이모지 동그라미 dps 60%
    if (this.timeCheckInterval(50, 55, 20)) {
      this.createEnemy(ID.enemy.donggramiEnemy.emoji)
    }
  }

  roundPhase03 () {
    // 일반 동그라미: 초당 dps 40% (60s ~ 70s)
    // 초당 dps 60% (71s ~ 80s)
    // 초당 dps 20% (81s ~ 87s)
    if (this.timeCheckInterval(60, 70, 15) || this.timeCheckInterval(71, 80, 10) || this.timeCheckInterval(81, 87, 30)) {
      this.createEnemy(ID.enemy.donggramiEnemy.mini)
    }

    // 특수 동그라미: 초당 dps 40% (60s ~ 70s)
    // 초당 dps 60% (71s ~ 80s)
    // 초당 dps 40% (81s ~ 87s)
    if (this.timeCheckInterval(60, 70, 30) || this.timeCheckInterval(71, 80, 20) || this.timeCheckInterval(81, 87, 30)) {
      let random = Math.floor(Math.random() * 3)
      switch (random) {
        case 0: this.createEnemy(ID.enemy.donggramiEnemy.exclamationMark); break
        case 1: this.createEnemy(ID.enemy.donggramiEnemy.questionMark); break
        case 2: this.createEnemy(ID.enemy.donggramiEnemy.emoji); break
      }
    }
  }

  roundPhase04 () {
    this.timePauseEnemyCount(93)

    // talk 동그라미, 초당 dps 60%
    if (this.timeCheckInterval(95, 100, 20)) {
      this.createEnemy(ID.enemy.donggramiEnemy.talk)
    }

    // speed 동그라미, 초당 dps 60%
    if (this.timeCheckInterval(103, 108, 20)) {
      this.createEnemy(ID.enemy.donggramiEnemy.speed)
    }

    // 일반 동그라미 (모든 색) - 초당 dps 100%!
    // 스플래시 없거나 전투력이 낮으면 동그라미에게 죽을 수 있음
    if (this.timeCheckInterval(110, 117, 6)) {
      this.createEnemy(ID.enemy.donggramiEnemy.mini)
    }
  }

  roundPhase05 () {
    // 121 ~ 141초 적 추가로 등장 (모든 종류 동시에 등장)
    // 초당 dps 120% // 최대 제한 40개
    if (this.timeCheckInterval(121, 140, 30) && this.getEnemyCount() < 40) {
      this.createEnemy(ID.enemy.donggramiEnemy.mini)
    }

    if (this.timeCheckInterval(121, 140, 20) && this.getEnemyCount() < 40) {
      let random = Math.floor(Math.random() * 5)
      switch (random) {
        case 0: this.createEnemy(ID.enemy.donggramiEnemy.exclamationMark); break
        case 1: this.createEnemy(ID.enemy.donggramiEnemy.questionMark); break
        case 2: this.createEnemy(ID.enemy.donggramiEnemy.emoji); break
        case 3: this.createEnemy(ID.enemy.donggramiEnemy.talk); break
        case 4: this.createEnemy(ID.enemy.donggramiEnemy.speed); break
      }
    }

    this.timePauseEnemyCount(145)

    // 146초 보스전
    if (this.timeCheckFrame(146, 1) && !this.bossMode) {
      this.requestBossMode()
      this.createEnemy(ID.enemy.donggramiEnemy.bossBig1)
      this.createEnemy(ID.enemy.donggramiEnemy.bossBig2)
    }
  }

  displayBossHp () {
    if (!this.bossMode) return

    let enemy = this.getEnemyObject()
    let src = imageSrc.round.round2_donggramiHp
    let cacheImage = game.graphic.getCacheImage(src)

    if (cacheImage != null && enemy.length > 0) {
      let x = game.graphic.CANVAS_WIDTH - cacheImage.width
      game.graphic.imageView(src, x, 0)
    }

    const meterLength = 200
    const meterX = graphicSystem.CANVAS_WIDTH - meterLength
    const layer1Y = 40
    const layer2Y = 80
    for (let i = 0; i < enemy.length; i++) {
      let e = enemy[i]
      let y = i === 0 ? layer1Y : layer2Y // y축 위치 결정 (적 배열 번호에 따라서...)

      if (e.id === ID.enemy.donggramiEnemy.bossBig1) {
        game.graphic.meterRect(meterX, y, meterLength, layer1Y, ['#2C52B0', '#6486D9'], e.hp, e.hpMax)
      } else if (e.id === ID.enemy.donggramiEnemy.bossBig2) {
        game.graphic.meterRect(meterX, y, meterLength, layer1Y, ['#9B442F', '#B87C6D'], e.hp, e.hpMax)
      }

      digitalDisplay(e.hp + '/' + e.hpMax, meterX, y)
    }
  }
}

class Round2_2 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round2_2)
    this.musicSrc = soundSrc.music.music10_donggrami_maeul
    this.bgList = [
      imageSrc.round.round2_2_maeul_entrance,
      imageSrc.round.round2_2_tunnel,
      imageSrc.round.round2_2_tunnel_outload,
      imageSrc.round.round2_2_apartment1,
      imageSrc.round.round2_2_park,
      imageSrc.round.round2_2_apartment2,
      imageSrc.round.round2_2_shopping_mall,
      imageSrc.round.round2_2_placard
    ]
    this.bgWidth = [800, 800, 800, 1600, 1600, 1600, 1600, 800]
    this.bgNumber = 0
    this.bgBlackAlpha = 0

    // 시간이 배경에 맞추어서 진행되기 때문에, 배경이 변경되는 것을 기준으로 대략적인 시간 값이 설정되었습니다.
    // 1초에 60frame = 60px씩 이동
    // [실제 배경 기준 도착 시점]
    // [0 ~ 20, 21 ~ 60, 61 ~ 87, 88 ~ 114, 115 ~ 141, 142 ~ 169]
    // 168초 쯤에 배경 스크롤 중지됨
    // 실제 라운드 기준
    // [0 ~ 20, 21 ~ 60, 61 ~ 80, 81 ~ 110, 111 ~ 130, 131 ~ 160, 161 ~ 170]
    this.addRoundPhase(this.roundPhase00, 0, 20) // 입구
    this.addRoundPhase(this.roundPhase01, 21, 60) // 터널
    this.addRoundPhase(this.roundPhase02, 61, 80) // 아파트 1단지
    this.addRoundPhase(this.roundPhase03, 81, 110) // 공원
    this.addRoundPhase(this.roundPhase04, 111, 130) // 아파트 2단지
    this.addRoundPhase(this.roundPhase05, 131, 160) // 상가
    this.addRoundPhase(this.roundPhase06, 161, 167) // 플래카드

    this.addLoadingImageList([
      imageSrc.round.round2_2_maeul_entrance,
      imageSrc.round.round2_2_apartment1,
      imageSrc.round.round2_2_apartment2,
      imageSrc.round.round2_2_park,
      imageSrc.round.round2_2_placard,
      imageSrc.round.round2_2_shopping_mall,
      imageSrc.round.round2_2_tunnel,
      imageSrc.round.round2_2_tunnel_outload,
    ])

    this.addLoadingSoundList([
      soundSrc.music.music10_donggrami_maeul,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound2ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound2ShareSound())
  }

  displayBossHp () {
    if (this.currentTime > this.phaseTime[0].endTime) return

    let enemy = this.getEnemyObject()
    let src = imageSrc.round.round2_donggramiHp
    let cacheImage = game.graphic.getCacheImage(src)

    if (cacheImage != null && enemy.length > 0) {
      let x = game.graphic.CANVAS_WIDTH - cacheImage.width
      game.graphic.imageView(src, x, 0)
    }

    const meterLength = 200
    const meterX = graphicSystem.CANVAS_WIDTH - meterLength
    const layer1Y = 40
    const layer2Y = 80
    for (let i = 0; i < enemy.length; i++) {
      let e = enemy[i]
      let y = i === 0 ? layer1Y : layer2Y // y축 위치 결정 (적 배열 번호에 따라서...)

      if (e.id === ID.enemy.donggramiEnemy.bossBig1) {
        game.graphic.meterRect(meterX, y, meterLength, layer1Y, ['#2C52B0', '#6486D9'], e.hp, e.hpMax)
      } else if (e.id === ID.enemy.donggramiEnemy.bossBig2) {
        game.graphic.meterRect(meterX, y, meterLength, layer1Y, ['#9B442F', '#B87C6D'], e.hp, e.hpMax)
      }

      digitalDisplay(e.hp + '/' + e.hpMax, meterX, y)
    }
  }

  displayBackground () {
    // super.displayBackground()
    const lightsky = '#4995E1'
    const maeulsky = '#67B2FF'
    game.graphic.gradientRect(0, 0, game.graphic.CANVAS_WIDTH, game.graphic.CANVAS_HEIGHT, [lightsky, maeulsky])

    // 배경 출력 (좌우 스크롤에 대한 여러 이미지를 순차 출력하는 알고리즘은 아직 RoundData에 없습니다.)
    game.graphic.imageView(this.bgList[this.bgNumber], this.backgroundX, 0)
    if (this.bgNumber + 1 < this.bgWidth.length) {
      game.graphic.imageView(this.bgList[this.bgNumber + 1], this.backgroundX + this.bgWidth[this.bgNumber], 0)
    }

    // 검은색 배경 출력
    game.graphic.fillRect(0, 0, game.graphic.CANVAS_WIDTH, game.graphic.CANVAS_HEIGHT, 'black', this.bgBlackAlpha)
  }

  processSaveString () {
    // 배경 화면 저장: backgroundX, bgNumber, bgBlackAlpha
    this.saveString = this.backgroundX + ',' + this.bgNumber + ',' + this.bgBlackAlpha
  }

  loadDataProgressSaveString () {
    let split = this.saveString.split(',')
    this.backgroundX = Number(split[0])
    this.bgNumber = Number(split[1])
    this.bgBlackAlpha = Number(split[2])
  }

  processBackground () {
    // 배경 이동 및 다음 배경으로 이동
    if (this.bgNumber === this.bgWidth.length - 1) {
      this.backgroundSpeedX = 0
      this.backgroundX = 0
    } else if (this.currentTime >= 20) {
      this.backgroundSpeedX = -1
    } else {
      // 20초 이전일때는 배경이 이동하지 않음
      this.backgroundSpeedX = 0
    }

    if (this.backgroundX < -this.bgWidth[this.bgNumber] && this.bgNumber < this.bgWidth.length) {
      this.bgNumber++
      this.backgroundX = 0
    }

    // 검은 배경화면 출력 (터널)
    if (this.timeCheckInterval(25, 37, 10)) {
      // 일정시간 단위로 점점 어두워짐
      this.bgBlackAlpha += 0.004
    } else if (this.timeCheckInterval(38, 50, 10)) {
      // 일정시간 단위로 점점 밝아짐
      this.bgBlackAlpha -= 0.004
    } else if (this.timeCheckInterval(51, 55, 20)) {
      // (밝기가) 원래대로 되돌아옴
      this.bgBlackAlpha = 0
    }

    // blackAlpha가 잘못된 값이 되면, 오류가 발생할 수 있으므로, 0미만이 되지 않도록 처리
    if (this.bgBlackAlpha < 0) {
      this.bgBlackAlpha = 0
    }

    // 에코 효과 추가 (터널)
    // 각각 에코, 피드백, 딜레이, 시간 변경 기준임
    // 해당값은 더이상 적용되지 않습니다.
    // const echoValue = [0.1, 0.3, 0.5, 0.6, 0.7, 0.6, 0.5, 0.3, 0.1, 0]
    // const feedValue = [0.1, 0.3, 0.4, 0.5, 0.6, 0.5, 0.4, 0.3, 0.1, 0]
    // const delayValue = 0.3
    // const changeTime = [24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54]
    // for (let i = 0; i < changeTime.length - 1; i++) {
    //   if (this.currentTime >= changeTime[i] && this.currentTime < changeTime[i + 1]) {
    //     game.sound.setEcho(echoValue[i], feedValue[i], delayValue)
    //   }
    // }

    // 버그 방지용 에코 끄기 기능
    if (this.timeCheckInterval(55, 60)) {
      game.sound.setEchoDisable()
    }

    super.processBackground()
  }

  roundPhase00 () {
    // 보스전: (2-1 보스전과 동일) ?!
    // 2 ~ 19초간 진행
    // 보스가 죽는다면 진행구간이 스킵됨

    if (this.timeCheckFrame(2)) {
      this.createEnemy(ID.enemy.donggramiEnemy.bossBig1)
      this.createEnemy(ID.enemy.donggramiEnemy.bossBig2)
      // this.requestBossMode()
      this.currentTime++
    }

    if (this.timeCheckInterval(5, 18) && this.getEnemyCount() <= 0) {
      this.currentTime = 19
    }

    this.timePauseEnemyCount(19)
  }

  roundPhase01 () {
    // 일반 동그라미만 등장 (색깔은 자유)
    // 총 dps: 40%
    // 시간: 20 ~ 60
    // 최대 마리수 제한: 40
    if (this.timeCheckInterval(20, 60, 15) && this.getEnemyCount() < 40) {
      this.createEnemy(ID.enemy.donggramiEnemy.mini)
    }
  }

  roundPhase02 () {
    // 일반 동그라미만 등장 (색갈비중: 파란색 4, 초록색 4, 나머지 4)
    // 총 dps: 120%
    // 시간: 61 ~ 80
    // 최대 마리수 제한: 70 ~ 72(70마리 이하일때, 동시에 여러개 생성하기 때문에 이 수치를 초과할 수 있음)
    if (this.timeCheckInterval(62, 77, 15) && this.getEnemyCount() < 70) {
      this.createEnemy(ID.enemy.donggramiEnemy.miniBlue)
      this.createEnemy(ID.enemy.donggramiEnemy.miniGreen)
      this.createEnemy(ID.enemy.donggramiEnemy.mini)
    }
  }

  /**
   * 스페셜 동그라미를 만듭니다. (중복 코드 방지용 함수)
   * @param {number} rRange 코드 구분 기호용도(0: 전체, 1: talkShopping 제외)
   */
  createRandomSpecialDonggrami (rRange = 0) {
    let capR = 7
    if (rRange === 1) capR = 6 

    let random = Math.floor(Math.random() * capR)
    switch (random) {
      case 0: this.createEnemy(ID.enemy.donggramiEnemy.bounce); break
      case 1: this.createEnemy(ID.enemy.donggramiEnemy.speed); break
      case 2: this.createEnemy(ID.enemy.donggramiEnemy.exclamationMark); break
      case 3: this.createEnemy(ID.enemy.donggramiEnemy.questionMark); break
      case 4: this.createEnemy(ID.enemy.donggramiEnemy.emoji); break
      case 5: this.createEnemy(ID.enemy.donggramiEnemy.talk); break
      case 6: this.createEnemy(ID.enemy.donggramiEnemy.talkShopping); break
    }
  }

  roundPhase03 () {
    // 특수 동그라미만 등장 (초반엔 점프하는 동그라미만 등장)
    // 총 dps: 60%, 80%, 60%
    // 시간: 81 ~ 110

    if (this.timeCheckInterval(81, 85, 20)) {
      this.createEnemy(ID.enemy.donggramiEnemy.bounce)
    } else if (this.timeCheckInterval(86, 100, 15)) {
      this.createRandomSpecialDonggrami(1)
    } else if (this.timeCheckInterval(101, 107, 20)) {
      this.createRandomSpecialDonggrami(1)
    }
  }

  roundPhase04 () {
    // 일반 동그라미만 등장 (이 구간이 제일 적이 많음)
    // 총 dps: 120%, 150%, 120%
    // 시간: 110 ~ 130
    // 최대 마리수 제한: 100
    let isCreateEnemy = this.timeCheckInterval(112, 117, 10)
      || this.timeCheckInterval(118, 122, 8)
      || this.timeCheckInterval(123, 127, 10)

    if (isCreateEnemy && this.getEnemyCount() < 100) {
      this.createEnemy(ID.enemy.donggramiEnemy.miniRed)
      this.createEnemy(ID.enemy.donggramiEnemy.miniPurple)
      this.createEnemy(ID.enemy.donggramiEnemy.miniArchomatic)
      this.createEnemy(ID.enemy.donggramiEnemy.mini)
    }
  }

  roundPhase05 () {
    // 일반 + 특수 동그라미
    // 대화 동그라미의 비중 대폭 증가
    // 총 dps: 40%(131 ~ 140), 80%(141 ~ 150), 120%(150 ~ 160)
    // 시간: 130 ~ 160
    if (this.timeCheckInterval(131, 140, 60)) {
      this.createEnemy(ID.enemy.donggramiEnemy.talk)
      this.createEnemy(ID.enemy.donggramiEnemy.talkShopping)
    } else if (this.timeCheckInterval(141, 150, 15)) {
      this.createRandomSpecialDonggrami()
    } else if (this.timeCheckInterval(151, 160, 10)) {
      this.createRandomSpecialDonggrami()
    }
  }

  roundPhase06 () {
    // 점프하는 동그라미만 등장
    // 총 dps: 40%
    if (this.timeCheckInterval(161, 166, 30)) {
      this.createEnemy(ID.enemy.donggramiEnemy.bounce)
    }

    if (this.timeCheckFrame(166, 12)) {
      this.musicChange('', 3)
    }
  }
}

class Round2_3 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round2_3)
    this.backgroundSpeedX = 0 // 배경 이동 없음

    /** 음악의 리스트 (복도 구간은 음악 없음) */
    this.musicList = {
      normal_road: '',
      a1_battle_room: soundSrc.music.music11A1_battle_room,
      a2_break_room: soundSrc.music.music11A2_break_room,
      a3_power_room: soundSrc.music.music11A3_power_room,
      b1_jump_room: soundSrc.music.music11B1_jump_room,
      b2_warp_room: soundSrc.music.music11B2_warp_room,
      b3_move_room: soundSrc.music.music11B3_move_room,
      c1_bullet_room: soundSrc.music.music11C1_bullet_room,
      c2_square_room: soundSrc.music.music11C2_square_room,
      c3_trap_room: soundSrc.music.music11C3_trap_room,
    }

    /** 배경 그라디언트의 색 리스트 (배열) */
    this.bgGradientColor = {
      normal_road: ['#4995E1', '#67B2FF'],
      a1_battle_room: ['#9E5D3D', '#944C4A'],
      a2_break_room: ['#5D1C1C', '#644C29'],
      a3_power_room: ['#96705A', '#9A5C50'],
      b1_jump_room: ['#D7D068', '#DBE83B'],
      b2_warp_room: ['#D8E4AB', '#E2BC79'],
      b3_move_room: ['#D7C98F', '#9E8A67'],
      c1_bullet_room: ['#7EAC81', '#06921D'],
      c2_square_room: ['#3D5047', '#0B5531'],
      c3_trap_room: ['#218920', '#6DB9AB']
    }

    /** 결과값 목록 (areaStat.result 에 사용되는 상수값) */
    this.resultList = {
      WIN: 'win',
      LOSE: 'lose',
      START: 'start',
      READY: 'ready',
      FIGHT: 'fight',
      COMPLETE: 'complete',
      NOTHING: '',
      DRAW: 'draw'
    }

    /** 각 구역에 대한 현재 결과 (모든 구역에서 사용) */  
    this.result = ''

    /** 시간 기준 값 (60초구성의 구역만 적용) */
    this.checkTimeList = {
      /** 준비 출력 */ READY: 2,
      /** 시작 또는 파이트 출력 */ START: 4,
      /** 완료 */ COMPLETE: 50,
    }

    /** 모든 구역에 대한 종합 스탯 (다만 모든 스탯이 공통적으로 사용되는것은 아닙니다.) */
    this.areaStat = {
      // 공통 스탯
      /** 각 구역에 대한 남은시간 (모든 구역에서 사용) */ time: 45,
      /** 남은 플레이어의 체력(a1, a2 구역에서 사용) */ playerHp: 100,
      /** 남은 적의 체력 (a1, a2 구역에서 사용) */ enemyHp: 100,

      // 기준 스탯
      /** a2 구역에서 사용하는 HP의 기본 상수값 */ a2BaseHp: 800,

      // 플레이어 관련 이동 스탯
      /** 플레이어의 무적 프레임 */ playerInvincibleFrame: 0,
      /** 플레이어 체력에 대한 에니메이션 (현재값으로 서서히 감소하도록 에니메이션 처리) */ playerHpEnimation: 100,
      /** 플레이어 에니메이션 처리용 프레임 카운트 */ playerHpEnimationFrame: 0,
      /** b1 구역에서 플레이어가 점프하는 속도 */ playerBounceSpeed: 12,
      /** 플레이어가 튕겨지는 지연시간 */ playerBounceDelay: 120,
      /** 플레이어가 튕겨지는 지연시간을 계산하는 카운트 */ playerBounceDelayCount: 0,
      /** 플레이어가 위로 올라가는 상태인지에 대한 변수 */ isPlayerArrowUp: false,
      /** 플레이어 이동 불가 시간 */ playerMoveImpossibleFrameCount: 0,

      // 기타 스탯
      /** 적의 HP나 플레이어의 HP가 과도하게 빠르게 줄어들 수 없도록 지연시간이 추가됨 (a1 구역만 가능) */ hpLowMax: 100,
      /** 플레이어가 모은 파워 (a3 구역에서 사용) */ powerPlayer: 0,
      /** 적이 모은 파워 (a3 구역에서 사용) */ powerEnemy: 0,
      /** 총 워프 횟수 (b2 구역에서 사용) */ warpCount: 0,
      /** 총 받은 데미지 (c1 구역에서 사용) */ totalDamage: 0,
      /** 점수 (c2 구역에서 사용) */ score: 0,
      /** 사각형의 개수 (c2 구역에서 사용) */ squareBlack: 0,
      /** 한 화면에 나올 수 있는 사각형의 개수 (c2 구역에서 사용) */ squareBlackMax: 0,
      /** 시간 보너스 값 (c2 구역에서 사용) */ timeBonusValue: 0,
      /** 시간 보너스 가속 배율 (c2 구역에서 사용) */ timeBonusMultiple: 0,
      /** 골인 횟수 (c3 구역에서 사용) */ goal: 0,
      /** 현재 적의 수 (a2 구역에서 적을 죽인 수를 확인하기 위해 필요) */ createEnemyCount: 0,
      /** 데미지 사운드 딜레이 카운터용 */ damageSoundDelayCount: 0
    }

    /** 현재 적용된 그라디언트의 색상 */
    this.currentGradientColor = ['#4995E1', '#67B2FF']

    this.bgRoadSrc = imageSrc.round.round2_2_placard
    this.bgSpaceSrc = imageSrc.round.round2_3_maeul_space
    this.bgAfterSrc = imageSrc.round.round2_3_placard

    this.backgroundImageSrc = this.bgRoadSrc

    /**
     * 맵의 스트링 값
     * 
     * 맵의 종류 = a1 ~ a3, b1 ~ b3, c1 ~ c3, z1(1번째 공간)
     */
    this.courseName = 'z1'

    /** 코스 선택시 현재 선택된 번호 */
    this.courseCursorNumber = 0

    /** 코스 선택 시간 */
    this.courseSelectTime = 6

    this.addRoundPhase(this.roundPhase00, 0, 9)
    this.addRoundPhase(this.roundPhase01, 10, 69)
    this.addRoundPhase(this.roundPhase02, 70, 129)
    this.addRoundPhase(this.roundPhase03, 130, 188)
    
    /** 선택 창에 관한 오브젝트 */
    this.boxMap = {
      x: 100,
      y: -300,
      width: 600,
      height: 200,
      isShow: false,
      image: imageSrc.round.round2_3_course,
    }

    /** 현재 코스 선택 모드에 있는지에 대한 여부 */
    this.isCourseSelectMode = false

    /** 각 result에 따라 표시되는 보이스 목록 */
    this.voiceList = {
      complete: soundSrc.round.r2_3_voiceComplete,
      draw: soundSrc.round.r2_3_voiceDraw,
      win: soundSrc.round.r2_3_voiceWin,
      lose: soundSrc.round.r2_3_voiceLose,
      start: soundSrc.round.r2_3_voiceStart,
      fight: soundSrc.round.r2_3_voiceFight,
      ready: soundSrc.round.r2_3_voiceReady
    }

    /** 코스 선택시 표시되는 반짝이는 상자 */
    class LightBox {
      constructor (x = 0, y = 0, width = 10, height = 10, color = 'white') {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.color = color
        this.alphaPercent = 100
        this.isAlphaValueUp = false
      }

      process () {
        // 알파값이 증가상태면 5%씩 상승, 아닐경우 5%씩 감소
        this.alphaPercent += this.isAlphaValueUp ? 5 : -5

        if (this.alphaPercent <= 0) {
          this.isAlphaValueUp = true
          this.alphaPercent = 0
        }

        if (this.alphaPercent === 60) {
          this.isAlphaValueUp = false
          this.alphaPercent = 60
        }
      }

      display () {
        // 알파값은 100배의 정수로 기록되었으므로, 값을 맞추기 위해 100으로 나눕니다.
        graphicSystem.fillRect(this.x, this.y, this.width, this.height, this.color, this.alphaPercent / 100)
      }
    }

    const lightX = 100
    this.lightBoxList = {
      a1: new LightBox(lightX + 0, 100, 200, 100, 'red'),
      a2: new LightBox(lightX + 200, 100, 200, 100, 'red'),
      a3: new LightBox(lightX + 400, 100, 200, 100, 'red'),
      b1: new LightBox(lightX + 0, 200, 200, 100, 'yellow'),
      b2: new LightBox(lightX + 200, 200, 200, 100, 'yellow'),
      b3: new LightBox(lightX + 400, 200, 200, 100, 'yellow'),
      c1: new LightBox(lightX + 0, 300, 200, 100, 'green'),
      c2: new LightBox(lightX + 200, 300, 200, 100, 'green'),
      c3: new LightBox(lightX + 400, 300, 200, 100, 'green'),
    }

    this.scoreList = {
      COMPLETE1: 19200,
      COMPLETE2: 19400,
      COMPLETE3: 19800,
      LOSE1: 19100,
      LOSE2: 19200,
      LOSE3: 19700
    }

    this.addLoadingImageList([
      imageSrc.round.round2_3_course,
      imageSrc.round.round2_3_effect,
      imageSrc.round.round2_3_maeul_space,
      imageSrc.round.round2_3_result,
      imageSrc.round.round2_3_course,
      imageSrc.round.round2_3_status,
      this.boxMap.image
    ])

    this.addLoadingSoundList([
      soundSrc.music.music11A1_battle_room,
      soundSrc.music.music11A2_break_room,
      soundSrc.music.music11A3_power_room,
      soundSrc.music.music11B1_jump_room,
      soundSrc.music.music11B2_warp_room,
      soundSrc.music.music11B3_move_room,
      soundSrc.music.music11C1_bullet_room,
      soundSrc.music.music11C2_square_room,
      soundSrc.music.music11C3_trap_room,
      this.voiceList.complete,
      this.voiceList.win,
      this.voiceList.lose,
      this.voiceList.draw,
      this.voiceList.ready,
      this.voiceList.start,
      this.voiceList.fight,
      soundSrc.round.r2_3_a1_boost,
      soundSrc.round.r2_3_a1_damage,
      soundSrc.round.r2_3_a1_earthquake,
      soundSrc.round.r2_3_a1_earthquakeDamage,
      soundSrc.round.r2_3_a1_toyHammer,
      soundSrc.round.r2_3_a2_bomb,
      soundSrc.round.r2_3_a2_break,
      soundSrc.round.r2_3_a3_power1,
      soundSrc.round.r2_3_a3_power2,
      soundSrc.round.r2_3_b2_warp,
      soundSrc.round.r2_3_b3_move,
      soundSrc.round.r2_3_c2_squareBlack,
      soundSrc.round.r2_3_c2_squareCyan,
      soundSrc.round.r2_3_c2_squareLime,
      soundSrc.round.r2_3_c2_squarePink,
      soundSrc.round.r2_3_c2_squareRed,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound2ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound2ShareSound())
  }

  lightBoxProcess () {
    this.lightBoxList.a1.process()
    this.lightBoxList.a2.process()
    this.lightBoxList.a3.process()
    this.lightBoxList.b1.process()
    this.lightBoxList.b2.process()
    this.lightBoxList.b3.process()
    this.lightBoxList.c1.process()
    this.lightBoxList.c2.process()
    this.lightBoxList.c3.process()
  }

  setCourseGradientColor () {
    switch (this.courseName) {
      case 'z1': this.currentGradientColor = this.bgGradientColor.normal_road; break
      case 'a1': this.currentGradientColor = this.bgGradientColor.a1_battle_room; break
      case 'a2': this.currentGradientColor = this.bgGradientColor.a2_break_room; break
      case 'a3': this.currentGradientColor = this.bgGradientColor.a3_power_room; break
      case 'b1': this.currentGradientColor = this.bgGradientColor.b1_jump_room; break
      case 'b2': this.currentGradientColor = this.bgGradientColor.b2_warp_room; break
      case 'b3': this.currentGradientColor = this.bgGradientColor.b3_move_room; break
      case 'c1': this.currentGradientColor = this.bgGradientColor.c1_bullet_room; break
      case 'c2': this.currentGradientColor = this.bgGradientColor.c2_square_room; break
      case 'c3': this.currentGradientColor = this.bgGradientColor.c3_trap_room; break
      case 'z2': this.currentGradientColor = this.bgGradientColor.normal_road; break
    }
  }

  /** 
   * 코스 변경 (코스 공식과 사용자의 선택에 따라 자동으로 변경됨)
   * 
   * 코스를 선택한 순간 시간값도 동시에 변경됩니다.
   */
  changeCourse () {
    if (this.courseName === 'z1') {
      switch (this.courseCursorNumber) {
        case 0: this.courseName = 'a1'; break
        case 1: this.courseName = 'b1'; break
        case 2: this.courseName = 'c1'; break
      }
      // 다음 코스에 맞게 시간을 변경
      if (this.currentTime <= this.phaseTime[0].endTime) {
        this.setCurrentTime(this.phaseTime[1].startTime)
      }
    } else if (this.courseName === 'a1' || this.courseName === 'b1' || this.courseName === 'c1') {
      switch (this.courseCursorNumber) {
        case 0: this.courseName = 'a2'; break
        case 1: this.courseName = 'b2'; break
        case 2: this.courseName = 'c2'; break
      }
      if (this.currentTime <= this.phaseTime[1].endTime) {
        this.setCurrentTime(this.phaseTime[2].startTime)
      }
    } else if (this.courseName === 'a2' || this.courseName === 'b2' || this.courseName === 'c2') {
      switch (this.courseCursorNumber) {
        case 0: this.courseName = 'a3'; break
        case 1: this.courseName = 'b3'; break
        case 2: this.courseName = 'c3'; break
      }
      if (this.currentTime <= this.phaseTime[2].endTime) {
        this.setCurrentTime(this.phaseTime[3].startTime)
      }
    } else if (this.courseName === 'a3' || this.courseName === 'b3' || this.courseName === 'c3') {
      this.courseName = 'z2'
      this.setCurrentTime(this.phaseTime[3].endTime + 1)
    }

    // 시간 멈춤 해제
    this.setCurrentTimePause(false)

    // 코스가 변경되면 그라디언트 배경색도 변경됨
    this.setCourseGradientColor()

    // 배경 변경
    if (this.courseName === 'z1') {
      this.changeBackgroundImage(this.bgRoadSrc, 60)
    } else if (this.courseName === 'z2') {
      this.changeBackgroundImage(this.bgAfterSrc, 60)
    } else {
      this.changeBackgroundImage(this.bgSpaceSrc, 60)
    } 

    // 일반 모드로 전환
    this.setNormalMode()
    this.setResult(this.resultList.NOTHING) // 결과 화면 표시 제거
  }

  /** 코스 선택 모드로 변경 */
  setCourseSelectMode () {
    this.setResult(this.resultList.NOTHING) // 결과 화면 표시 제거
    this.isCourseSelectMode = true
    this.courseCursorNumber = 1 // 맨 위가 0번, 가운데가 1번, 맨 아래가 2번이고, 커서는 가운데에 놓여짐
    this.courseSelectTime = 7

    // 코스 오브젝트의 위치 기본값 설정
    this.boxMap.y = 0 - 200

    // 박스 보여지도록 허용
    this.boxMap.isShow = true

    // 플레이어 이동 막기
    this.playerMoveDisable()
  }

  /** 일반 모드로 변경 */
  setNormalMode () {
    this.isCourseSelectMode = false
    this.boxMap.isShow = false
    this.setCurrentTimePause(false)
    this.playerMoveEnable()

    fieldState.allEnemyDelete()
  }

  processCourse () {
    if (!this.isCourseSelectMode) return

    // 남은 코스 시간이 0일경우, 강제로 모드를 선택하고 일반모드로 재설정
    if (this.courseSelectTime <= 0) {
      this.changeCourse()
      return
    } else if (this.courseSelectTime >= 1 && this.totalFrame % 60 === 0) {
      this.courseSelectTime--
    }

    // 현재 페이즈 종료시까지 이 선택모드를 해제하지 않으면 시간은 진행되지 않습니다.
    if (this.currentTime >= this.phaseTime[this.getCurrentPhase()].endTime - 1 && this.isCourseSelectMode) {
      this.setCurrentTimePause(true)
    }

    // 아래, 위 버튼으로 코스 변경
    if (controlSystem.getButtonInput(controlSystem.buttonIndex.DOWN) && this.courseCursorNumber < 2) {
      this.courseCursorNumber++
    } else if (controlSystem.getButtonInput(controlSystem.buttonIndex.UP) && this.courseCursorNumber > 0) {
      this.courseCursorNumber--
    }
  
    // 박스 보여지도록 허용
    this.boxMap.isShow = true

    // 코스 선택 버튼을 누르면 코스 선택 종료 (해당 값을 선택한 것으로 처리)
    if (controlSystem.getButtonInput(controlSystem.buttonIndex.A)) {
      this.changeCourse()
    }

    // 박스 맵 좌표가 0이 아닐경우, 좌표값이 0이 되도록 조정
    this.boxMap.y += this.boxMap.y < 0 ? 20 : 0

    // 반짝이는 박스 처리
    this.lightBoxProcess()
  }

  /** 각 구역에 대한 시간 처리 */
  processAreaTime () {
    const startTime = this.phaseTime[this.getCurrentPhase()].startTime
    
    // 각 페이즈 시작 시간의 5초, 55초 동안만 areaStat의 시간 감소가 적용됩니다.
    if (!this.timeCheckInterval(startTime + 5, startTime + 55)) return
    if (this.areaStat.time >= 1 && this.currentTimeTotalFrame % 60 === 59) {
      this.areaStat.time--
    }
  }

  processDebug () {
    // 디버그 할 때 코스 이름을 생각해주세요.
    // if (this.timeCheckFrame(0, 12)) {
    //   this.currentTime = 124
    //   this.courseName = 'a2'
    // }
  }

  process () {
    super.process()
    this.processCourse()
    this.processAreaTime()
  }

  /** 
   * 현재 구역의 시간이 구역 진행 시간 범위 내에 있는지 확인합니다.
   * 
   * 기본적으로 모든 구역들은 start ~ complete 시점까지 진행됩니다.
   * 
   * reday (2 ~ 3), start(4 ~ 50), complete(51 ~ 54), next(55 ~ 60)
   */
  areaRunningTimeCheck () {
    let startTime = this.phaseTime[this.getCurrentPhase()].startTime + this.checkTimeList.START
    let completeTime = this.phaseTime[this.getCurrentPhase()].startTime + this.checkTimeList.COMPLETE

    if (this.timeCheckInterval(startTime, completeTime)) {
      return true
    } else {
      return false
    }
  }

  /** 현재 구역의 시간이 결과 화면 또는 스탯 화면을 표시하는 시간 범위 이내인지 확인합니다. */
  areaShowResultTimeCheck () {
    let readyTime = this.phaseTime[this.getCurrentPhase()].startTime + this.checkTimeList.READY
    let completeTime = this.phaseTime[this.getCurrentPhase()].startTime + this.checkTimeList.COMPLETE + 4
    
    if (this.timeCheckInterval(readyTime, completeTime)) {
      return true
    } else {
      return false
    }
  }

  processSaveString () {
    // 저장 방식
    // 현재 맵, 선택모드, 현재 커서 값, 에리어 스탯, 결과값
    // 참고: JSON 파싱 버그를 막기 위해 구분자는 |(막대기?) 로 사용합니다.
    this.saveString = this.courseName 
      + '|' + this.isCourseSelectMode 
      + '|' + this.courseCursorNumber 
      + '|' + JSON.stringify(this.areaStat) 
      + '|' + this.result
      + '|' + this.currentGradientColor[0]
      + '|' + this.currentGradientColor[1]
  }

  loadDataProgressSaveString () {
    let str = this.saveString.split('|')
    this.courseName = str[0]
    this.isCourseSelectMode = str[1] === 'true' ? true : false
    this.courseCursorNumber = Number(str[2])
    this.areaStat = JSON.parse(str[3])
    this.result = str[4]

    // 그라디언트 배경 불러오기 (b2 때문에 이렇게 변경함)
    this.currentGradientColor[0] = str[5]
    this.currentGradientColor[1] = str[6]
  }

  displayBackground () {
    // 그라디언트 출력
    if (this.currentGradientColor.length >= 2) {
      graphicSystem.gradientRect(
        0,
        0,
        graphicSystem.CANVAS_WIDTH, 
        graphicSystem.CANVAS_HEIGHT, 
        [this.currentGradientColor[0], this.currentGradientColor[1]]
      )
    }

    // 배경 출력
    super.displayBackground()

    // 선택 오브젝트 출력, 현재 선택할 예정인 코스 반짝이도록 처리
    if (this.boxMap.isShow) {
      graphicSystem.imageView(this.boxMap.image, this.boxMap.x, this.boxMap.y)
      this.donggramiNumberDisplay(this.courseSelectTime, 600, 40)

      switch (this.courseName) {
        case 'z1':
          if (this.courseCursorNumber === 0) this.lightBoxList.a1.display()
          if (this.courseCursorNumber === 1) this.lightBoxList.b1.display()
          if (this.courseCursorNumber === 2) this.lightBoxList.c1.display()
          break
        case 'a1':
        case 'b1':
        case 'c1':
          if (this.courseCursorNumber === 0) this.lightBoxList.a2.display()
          if (this.courseCursorNumber === 1) this.lightBoxList.b2.display()
          if (this.courseCursorNumber === 2) this.lightBoxList.c2.display()
          break
        case 'a2':
        case 'b2':
        case 'c2':
          if (this.courseCursorNumber === 0) this.lightBoxList.a3.display()
          if (this.courseCursorNumber === 1) this.lightBoxList.b3.display()
          if (this.courseCursorNumber === 2) this.lightBoxList.c3.display()
          break
      }
    }
  }

  roundPhase00 () {
    // 바탕화면이 나오고, 3초 후 코스 선택 화면이 등장
    // 적은 등장하지 않음
    if (this.timeCheckFrame(3)) {
      this.setCourseSelectMode()
    }

    if (this.timeCheckInterval(19, 21) && this.isCourseSelectMode) {
      this.setCurrentTimePause(true)
    } else {
      this.setCurrentTimePause(false)
      this.musicPlay()
    }
  }

  roundPhase01 () {
    switch (this.courseName) {
      case 'a1': this.coursePhaseA1(); break
      case 'b1': this.coursePhaseB1(); break
      case 'c1': this.coursePhaseC1(); break
    }

    if (this.timeCheckFrame(this.phaseTime[1].endTime - 4)) {
      this.setCourseSelectMode()
    }
  }

  roundPhase02 () {
    switch (this.courseName) {
      case 'a2': this.coursePhaseA2(); break
      case 'b2': this.coursePhaseB2(); break
      case 'c2': this.coursePhaseC2(); break
    }

    if (this.timeCheckFrame(this.phaseTime[2].endTime - 4)) {
      this.setCourseSelectMode()
    }
  }

  roundPhase03 () {
    switch (this.courseName) {
      case 'a3': this.coursePhaseA3(); break
      case 'b3': this.coursePhaseB3(); break
      case 'c3': this.coursePhaseC3(); break
    }

    // 결과값을 삭제한 뒤, 다시 원래 지역으로 되돌아갑니다.
    if (this.timeCheckFrame(this.phaseTime[3].endTime - 3)) {
      this.setResult(this.resultList.NOTHING)
    } else if (this.timeCheckFrame(this.phaseTime[3].endTime)) {
      this.changeCourse()
    }
  }

  display () {
    super.display()
    this.displayResult()
    this.displayStatus()
    
    // 일부 구역은 추가적인 출력 함수가 있을 수도 있음
    switch (this.courseName) {
      case 'a1': this.displayCoursePhaseA1(); break
      case 'a2': this.displayCoursePhaseA2(); break
      case 'a3': this.displayCoursePhaseA3(); break
    }
  }

  /** 결과 값에 따른 이미지 출력 */
  displayResult () {
    if (this.result === this.resultList.NOTHING) return

    const imgD = imageDataInfo.round2_3_result // result 이미지 데이터 타겟을 위한 정보
    const imgSize = imageDataInfo.round2_3_result.complete // 모든 결과 이미지가 동일한 사이즈이므로, 해당 값을 참고
    const centerX = graphicSystem.CANVAS_WIDTH_HALF - (imgSize.width / 2)
    let showD
    switch (this.result) {
      case this.resultList.WIN: showD = imgD.win; break
      case this.resultList.LOSE: showD = imgD.lose; break
      case this.resultList.DRAW: showD = imgD.draw; break
      case this.resultList.COMPLETE: showD = imgD.complete; break
      case this.resultList.FIGHT: showD = imgD.fight; break
      case this.resultList.START: showD = imgD.start; break
      case this.resultList.READY: showD = imgD.ready; break
    }

    // 결과 화면 출력
    if (showD == null) return
    graphicSystem.imageDisplay(imageSrc.round.round2_3_result, showD.x, showD.y, showD.width, showD.height, centerX, 200, showD.width, showD.height)
  }

  /** 각 구역에 대한 스탯을 보여줍니다. */
  displayStatus () {
    // 이 스탯 화면은 정해진 시간에만 보여집니다.
    const currentPhaseTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.getCurrentPhase() === 0) return
    if (!this.timeCheckInterval(currentPhaseTime + this.checkTimeList.READY, currentPhaseTime + this.checkTimeList.COMPLETE + 4)) return

    const img = imageSrc.round.round2_3_status
    const imgD = imageDataInfo.round2_3_status
    let showD
    const timeX = 350
    const numberY = 40
    const imgWidth = imageDataInfo.round2_3_status.time.width

    // 첫번째 공간
    switch (this.courseName) {
      case 'a1': showD = imgD.a1BattleRoom; break
      case 'a2': showD = imgD.a2BreakRoom; break
      case 'a3': showD = imgD.a3PowerRoom; break
      default: showD = imgD.time; break
    }

    if (showD === imgD.time) {
      // 총 영역 100x100 크기 (가운데에 표시)
      graphicSystem.imageDisplay(img, showD.x, showD.y, showD.width, showD.height, timeX, 0, showD.width, showD.height)
    } else {
      // 총 영역 800x100 크기
      graphicSystem.imageDisplay(img, showD.x, showD.y, showD.width, showD.height, 0, 0, showD.width, showD.height)
    }

    // 두번째 공간 (두가지 이상의 박스를 조합했을 때 사용합니다.)
    showD = null
    switch (this.courseName) {
      case 'b2': showD = imgD.b2Warp; break
      case 'c1': showD = imgD.c1TotalDamage; break
      case 'c2': showD = imgD.c2Score; break
      case 'c3': showD = imgD.c3Goal; break
    }
    if (showD != null) {
      graphicSystem.imageDisplay(img, showD.x, showD.y, showD.width, showD.height, timeX - showD.width, 0, showD.width, showD.height)
    }

    // 세번째 공간 (c2 구역만 사용)
    if (this.courseName === 'c2') {
      showD = imgD.c2Square
      graphicSystem.imageDisplay(img, showD.x, showD.y, showD.width, showD.height, timeX + showD.width, 0, showD.width, showD.height)
    }

    // 남은시간 표시
    this.donggramiNumberDisplay(this.areaStat.time, timeX + 25, numberY)

    // 그외 기타 스탯
    if (this.courseName === 'b2') {
      this.donggramiNumberDisplay(this.areaStat.warpCount, timeX - imgWidth + 10, numberY)
    } else if (this.courseName === 'c1') {
      this.donggramiNumberDisplay(this.areaStat.totalDamage, timeX - (imgWidth * 2) + 10, numberY)
    } else if (this.courseName === 'c2') {
      this.donggramiNumberDisplay(this.areaStat.score, timeX - (imgWidth * 2) + 10, numberY)
      this.donggramiNumberDisplay(this.areaStat.squareBlack, timeX + imgWidth + 10, numberY)
    } else if (this.courseName === 'c3') {
      this.donggramiNumberDisplay(this.areaStat.goal, timeX - imgWidth + 10, numberY)
    }
  }

  /**
   * 결과를 설정합니다. (해당 함수를 사용하면, 잠시동안 결과 화면이 출력되고, 보이스가 출력됩니다.)
   * 
   * 결과 목록은 여러개가 있으며, ready는 준비 상태, start 또는 fight는 시작 상태
   * win, lose, draw, complete는 결과 상태를 보여줍니다.
   * 
   * @param {string} resultValue resultList 값 중 하나
   */
  setResult (resultValue) {
    this.result = resultValue
    switch (resultValue) {
      case this.resultList.COMPLETE: this.soundPlay(this.voiceList.complete); break
      case this.resultList.START: this.soundPlay(this.voiceList.start); break
      case this.resultList.READY: this.soundPlay(this.voiceList.ready); break
      case this.resultList.WIN: this.soundPlay(this.voiceList.win); break
      case this.resultList.LOSE: this.soundPlay(this.voiceList.lose); break
      case this.resultList.DRAW: this.soundPlay(this.voiceList.draw); break
      case this.resultList.FIGHT: this.soundPlay(this.voiceList.fight); break
    }

    // 완료 상태일때는 음악이 멈춥니다. (승리, 패배, 무승부 포함)
    if ([this.resultList.COMPLETE, this.resultList.WIN, this.resultList.DRAW, this.resultList.LOSE].indexOf(resultValue) !== -1) {
      this.musicStop()
    }
  }

  /** 동그라미 숫자를 표현하는 함수 */
  donggramiNumberDisplay = game.graphic.createCustomNumberDisplay(imageSrc.number.round2_3_number, 30, 40)

  coursePhaseA1 () {
    const phase1Start = this.phaseTime[1].startTime
    const cTime = this.checkTimeList

    // 준비 시간 (3초 후) 음악 재생 및 레디 표시 (레디 상황에서 초기값 설정)
    if (this.timeCheckFrame(phase1Start + cTime.READY)) {
      this.musicChange(this.musicList.a1_battle_room)
      this.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.enemyHp = 100
      this.areaStat.time = 45
      this.areaStat.playerHp = 100
      this.areaStat.playerHpEnimation = this.areaStat.playerHp
    } else if (this.timeCheckFrame(phase1Start + cTime.START)) {
      // 준비 시간이 끝나고, 전투 시작 (이 때 적이 생성됩니다.)
      this.setResult(this.resultList.FIGHT)
      this.createEnemy(ID.enemy.donggramiEnemy.a1_fighter)
    } else if (this.timeCheckFrame(phase1Start + cTime.START + 2)) {
      // 결과 출력 삭제
      this.setResult(this.resultList.NOTHING)
    }

    // HP 에니메이션은 areaRunning 여부와 관계없이 실행됨
    this.coursePhaseA1PlayerHpEnimation()

    // 전투에 관한 처리
    if (!this.areaRunningTimeCheck()) return

    this.coursePhaseA1PlayerDamage()
    this.coursePhaseA1EnemyDamage()
    // 시간 감소
    if (this.currentTimeTotalFrame % 60 === 0) {
      this.areaStat.battleLeftTime--
    }

    const result = this.coursePhaseA1Result()
    if (result !== '') { // 결과값이 있을경우 그에 대한 처리
      this.setCurrentTime(phase1Start + cTime.COMPLETE + 1) // 중복 처리 방지를 위한 시간 이동
      this.setResult(result)
      this.musicStop()
      this.playerMoveEnable() // 플레이어 이동 가능하도록 강제로 처리
      if (this.result === this.resultList.LOSE) {
        this.addScore(this.scoreList.LOSE1)
      } else {
        this.addScore(this.scoreList.COMPLETE1)
      }

      // 적이 한마리 밖에 없으므로, 0번 적을 가져옴
      let enemy = this.getEnemyObject()[0]
      if (enemy != null) {
        enemy.state = 'end' // 적 상태 임의로 변경해서 전투 종료를 느껴지게끔 처리(적은 더이상 패턴을 사용하지 않음.)
      }
    }
  }

  coursePhaseA1Result () {
    if (this.areaStat.playerHp <= 0 && this.areaStat.enemyHp >= 1) {
      return this.resultList.LOSE
    } else if (this.areaStat.playerHp >= 1 && this.areaStat.enemyHp <= 0) {
      return this.resultList.WIN
    } else if (this.areaStat.playerHp === 0 && this.areaStat.enemyHp === 0) {
      return this.resultList.DRAW
    }

    if (this.areaStat.time === 0) {
      if (this.areaStat.playerHp > this.areaStat.enemyHp) {
        return this.resultList.WIN
      } else if (this.areaStat.playerHp < this.areaStat.enemyHp) {
        return this.resultList.LOSE
      } else if (this.areaStat.playerHp === this.areaStat.enemyHp) {
        return this.resultList.DRAW
      }
    }

    return ''
  }

  /** 플레이어를 이동 불가능하게 설정 */
  playerMoveDisable () {
    let playerP = fieldState.getPlayerObject()
    playerP.isMoveEnable = false
  }

  /** (만약) 플레이어를 이동 불가능하게 설정했다면 해당 함수로 되돌려주세요. */
  playerMoveEnable () {
    let playerP = fieldState.getPlayerObject()
    playerP.isMoveEnable = true
  }

  coursePhaseA1PlayerHpEnimation () {
    // 플레이어 데미지 요소를 부드럽게 그리고 반짝이게 하기 위한 에니메이션 처리
    if (this.areaStat.playerHp < this.areaStat.playerHpEnimation && this.currentTimeTotalFrame % 2 === 0) {
      this.areaStat.playerHpEnimation--
      this.areaStat.playerHpEnimationFrame += 3
    }

    if (this.areaStat.playerHpEnimationFrame > 0) {
      this.areaStat.playerHpEnimationFrame--
    }
  }

  /** 적 데미지를 처리하기 위한 함수 */
  coursePhaseA1EnemyDamage () {
    // 이 규칙에 따라, 41초가 지나야 적을 죽이는것이 가능
    // 플레이어는 무적시간이 긴 편이라서, 45초내에 죽는것은 어렵다.
    this.areaStat.hpLowMax = (this.areaStat.time * 2)

    let enemy = this.getEnemyObject()[0]

    // 적이 없거나 정해진 적이 아닐경우 함수 처리 무시
    if (enemy == null || enemy.id !== ID.enemy.donggramiEnemy.a1_fighter) return

    const baseValue = 300000 // 실제 체력: 3000000
    const someValue = baseValue / 10
    if (enemy.hpMax - enemy.hp >= someValue && this.areaStat.enemyHp >= this.areaStat.hpLowMax) {
      enemy.hp += someValue
      this.areaStat.enemyHp -= 1
    }
  }

  /**
   * 플레이어가 받는 데미지 판정방식
   * 
   * 적이 가지고 있는 좌표값에 임의의 값을 추가하여 비교한다. 그러나 적이 가진 상태에 따라, 판정을 다르게 해야 한다.
   */
  coursePhaseA1PlayerDamage () {
    let enemy = this.getEnemyObject()[0]
    let playerP = fieldState.getPlayerObject()

    // 적이 없거나 정해진 적이 아닐경우 함수 처리 무시
    if (enemy == null || enemy.id !== ID.enemy.donggramiEnemy.a1_fighter) return

    // 플레이어 무적 상태이면, 무시
    if (this.areaStat.invincibleFrame > 0) {
      this.areaStat.invincibleFrame--
      return
    }

    // 해당 적이 가지고 있는 4가지 상태
    const STATE_HAMMER = 'hammer'
    const STATE_EARTHQUAKE = 'earthquake'
    const STATE_NORMAL = 'normal'
    const STATE_BOOST = 'boost'

    // 각각의 판정범위를 가지는 오브젝트
    let enemyObject = {x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height}
    let earthQuakeObject = {x: 0, y: graphicSystem.CANVAS_HEIGHT - 320, width: graphicSystem.CANVAS_WIDTH, height: 320} // 밑 부분 영역
    let earthQuakeObject2 = {x: enemy.x, y: 0, width: enemy.width, height: graphicSystem.CANVAS_HEIGHT} // 상하 영역 전체
    let hammerObject = {x: enemy.centerX - (enemy.width / 2), y: enemy.y - (enemy.height) + 48, width: 180, height: 180}

    // 적의 상태에 따라 판정 범위가 달라지며, 충돌이 된경우 각 조건에 따라 데미지 추가
    let damage = 0
    if (enemy.state === STATE_NORMAL && collision(playerP, enemyObject)) {
      damage = 1
    } else if (enemy.state === STATE_BOOST && collision(playerP, enemyObject)) {
      damage = 2
    } else if (enemy.state === STATE_HAMMER && collision(playerP, hammerObject)) {
      damage = 4
    } else if (enemy.state === STATE_EARTHQUAKE) {
      if (collision(playerP, earthQuakeObject) || collision(playerP, earthQuakeObject2)) {
        damage = 10
      }
    }

    // 데미지를 받은 경우, 사운드 및 플레이어 강제 이동 처리
    if (damage >= 1) {
      soundSystem.play(soundSrc.round.r2_3_a1_damage)
      this.areaStat.playerHp -= damage
      this.areaStat.invincibleFrame = damage < 10 ? 60 : 180 // 무적프레임: 10데미지 미만 30, 이상 90
      const autoMoveX = (Math.random() * 120 - 60) + playerP.x
      const autoMoveY = this.state === STATE_EARTHQUAKE ? (Math.random() * 120 - 60) + 120 : (Math.random() * 240 - 120) + playerP.y
      playerP.setAutoMove(autoMoveX, autoMoveY, 30)
    }
  }

  displayCoursePhaseA1 () {
    if (!this.areaShowResultTimeCheck()) return

    // 플레이어의 체력값과 적의 체력값 표시
    digitalDisplay('PLAYER HP: ' + this.areaStat.playerHp + '%', 0, 70)
    digitalDisplay('ENEMY HP: ' + this.areaStat.enemyHp + '%', 450, 70)

    // 플레이어의 체력은 왼쪽부터 오른쪽으로 이동하는 구조... 그리고 에니메이션 형태로 조작됨
    const percent = this.areaStat.playerHpEnimation / 100
    const divValue = 350 * percent
    const playerHpColor = this.areaStat.playerHpEnimationFrame % 3 === 0 ? 'green' : 'yellow' 
    graphicSystem.meterRect(350 - divValue, 30, divValue, 40, playerHpColor, 100, 100) // 엄밀히 따지면 meterRect를 사용하나 fillRect를 사용하나 같음

    // 적 체력 표시
    graphicSystem.meterRect(450, 30, 350, 40, 'red', this.areaStat.enemyHp, 100)
  }

  coursePhaseB1 () {
    const phase1Start = this.phaseTime[1].startTime
    const cTime = this.checkTimeList
    if (this.timeCheckFrame(phase1Start + cTime.READY)) {
      this.musicChange(this.musicList.b1_jump_room)
      this.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.time = 45
    } else if (this.timeCheckFrame(phase1Start + cTime.START)) {
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase1Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 결과 처리
    if (this.areaStat.time === 0 && this.result !== this.resultList.COMPLETE && this.currentTime <= phase1Start + cTime.COMPLETE) {
      this.setResult(this.resultList.COMPLETE)
      this.playerMoveEnable()
      this.setCurrentTime(phase1Start + cTime.COMPLETE + 1)
      this.addScore(this.scoreList.COMPLETE1)
    }

    // 시간 범위에 해당하는 로직 처리 (아닐경우 리턴)
    if (!this.areaRunningTimeCheck()) return

    // 플레이어는 강제로 특정 형태로만 이동됨
    this.coursePhaseB1PlayerMove()

    // 적의 수가 10마리가 되도록 처리
    if (this.getEnemyCount() < 10) {
      this.createEnemy(ID.enemy.donggramiEnemy.b1_bounce)
    }

    // 충돌 처리
    let enemyArray = this.getEnemyObject()
    let playerP = this.getPlayerObject()
    for (let i = 0; i < enemyArray.length; i++) {
      let enemyC = enemyArray[i]
      if (enemyC.state === '' && collision(playerP, enemyC)) {
        enemyC.state = 'collision'
        soundSystem.play(soundSrc.round.r2_3_a1_damage)
        const autoMoveX = playerP.x + (Math.random() * 200) - 100
        const autoMoveY = playerP.y + (Math.random() * 200) - 100

        // 플레이어 강제 이동 처리
        playerP.setAutoMove(autoMoveX, autoMoveY, 60)
      }
    }
  }

  coursePhaseB1PlayerMove () {
    // 이 알고리즘은 donggramiBounce 알고리즘을 참조함
    let playerP = this.getPlayerObject()
    playerP.isMoveEnable = false // 플레이어 이동 불가상태 (다만, 좌우로 이동 가능한데, 이 코드는 밑에 적어두었음)

    // 플레이어가 강제 이동 상황인경우, 이 함수는 처리되지 않음.
    if (playerP.autoMoveFrame >= 1) {
      return
    }

    this.areaStat.playerBounceDelayCount++
    let count = (this.areaStat.playerBounceDelayCount / this.areaStat.playerBounceDelay) * 180
    let degree = Math.PI / 180 * count
    let sinValue = Math.sin(degree)

    // 절반의 딜레이 시간동안 추락하고, 절반의 딜레이 시간동안 올라갑니다.
    // 이렇게 한 이유는, sin 값이 0 ~ 1 ~ 0 식으로 변화하기 때문
    if (this.areaStat.playerBounceDelayCount < this.areaStat.playerBounceDelay / 2) {
      playerP.y += this.areaStat.playerBounceSpeed * sinValue

      if (playerP.y + playerP.height > game.graphic.CANVAS_HEIGHT) {
        // 화면 밑으로 이미 내려갔다면, 딜레이값을 조정해 강제로 위로 올라가도록 처리
        this.areaStat.playerBounceDelayCount = this.areaStat.playerBounceDelay / 2
      } else if (this.areaStat.playerBounceDelayCount >= (this.areaStat.playerBounceDelay / 2) - 2) {
        // 다만, 내려갈 때에는 하면 맨 밑에 닿지 않으면 계속 내려가도록 딜레이를 직접적으로 조정
        this.areaStat.playerBounceDelayCount--
      }
    } else {
      playerP.y -= this.areaStat.playerBounceSpeed * sinValue
    }

    // 카운트가 일정 값을 넘어가면 리셋 (이렇게 하지 않으면 잘못된 형태로 바운스됨)
    if (this.areaStat.playerBounceDelayCount >= this.areaStat.playerBounceDelay) {
      this.areaStat.playerBounceDelayCount -= this.areaStat.playerBounceDelay
    }

    // 좌우로만 이동 가능 (버튼 입력을 받아 간접적으로 처리합니다.)
    if (game.control.getButtonDown(game.control.buttonIndex.LEFT)) {
      playerP.x -= playerP.moveSpeedX
    }
    
    if (game.control.getButtonDown(game.control.buttonIndex.RIGHT)) {
      playerP.x += playerP.moveSpeedX
    }
  }

  coursePhaseC1 () {
    const phase1Start = this.phaseTime[1].startTime
    const cTime = this.checkTimeList

    // customBullet
    let BulletBase = class extends CustomEnemyBullet {
      constructor () {
        super()
        this.x = 0
        this.moveSpeedX = 0
        this.moveSpeedY = 0
        this.width = 10
        this.height = 10
        this.attack = 1 // 공격력이 1인 이유는, 판정을 간접적으로 해야 처리할 수 있기 때문
        // 0데미지는 간접적으로 판정을 처리할 방법이 없음
        this.color = 'red'
      }

      // 무작위 위치 설정 및 속도 설정
      setPosition () {
        // x축 or y축
        const isLayerX = Math.random() < 0.5 ? true : false
        if (isLayerX) {
          // x축 양 끝 (맨 왼쪽 또는 맨 오른쪽)
          const isLeft = Math.random() < 0.5 ? true : false
          if (isLeft) {
            this.x = 0 - this.width
            this.moveSpeedX = Math.random() * 5 + 2
          } else {
            this.x = game.graphic.CANVAS_WIDTH + this.width
            this.moveSpeedX = -Math.random() * 5 - 2
          }
          this.y = Math.random () * graphicSystem.CANVAS_HEIGHT
          this.moveSpeedY = Math.random() * 10 - 5
        } else {
          const isUp = Math.random() < 0.5 ? true : false
          if (isUp) {
            this.y = 0 - this.height
            this.moveSpeedY = Math.random() * 5 + 2
          } else {
            this.y = graphicSystem.CANVAS_HEIGHT + this.height
            this.moveSpeedY = -Math.random() * 5 - 2
          }
          this.x = Math.random() * graphicSystem.CANVAS_WIDTH
          this.moveSpeedX = Math.random() * 10 - 5
        }
      }

      display () {
        graphicSystem.fillEllipse(this.x, this.y, this.width, this.height, 0, this.color)
      }
    }

    let BulletPlayer = class extends BulletBase {
      constructor () {
        super()
        this.color = 'blue'
      }

      setPosition () {
        super.setPosition()

        let playerP = fieldState.getPlayerObject()
        let distanceX = playerP.x - this.x
        let distanceY = playerP.y - this.y
        this.moveSpeedX = distanceX / 200
        this.moveSpeedY = distanceY / 200
      }
    }

    let BulletRain = class extends BulletBase {
      constructor () {
        super()
        this.color = 'cyan'
      }

      setPosition () {
        this.x = Math.random() * graphicSystem.CANVAS_WIDTH
        this.y = 0
        this.moveSpeedX = Math.random() * 1 - 2
        this.moveSpeedY = Math.random() * 2 + 8
      }
    }

    let BulletLeft = class extends BulletBase {
      constructor () {
        super()
        this.color = 'yellow'
      }

      setPosition () {
        this.x = graphicSystem.CANVAS_WIDTH
        this.y = Math.random() * graphicSystem.CANVAS_HEIGHT
        this.moveSpeedX = -Math.random() * 6 - 6
        this.moveSpeedY = 0
      }
    }

    // 준비 및 시작
    if (this.timeCheckFrame(phase1Start + cTime.READY)) {
      this.musicChange(this.musicList.c1_bullet_room)
      this.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.totalDamage = 0
      this.areaStat.time = 45
    } else if (this.timeCheckFrame(phase1Start + cTime.START)) {
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase1Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 결과 판정
    if (this.areaStat.time === 0 && this.result === this.resultList.NOTHING && this.currentTime <= phase1Start + cTime.COMPLETE) {
      if (this.areaStat.totalDamage >= 100) {
        this.setResult(this.resultList.LOSE)
      } else {
        this.setResult(this.resultList.COMPLETE)
      }

      if (this.result === this.resultList.LOSE) {
        this.addScore(this.scoreList.LOSE1)
      } else {
        this.addScore(this.scoreList.COMPLETE1)
      }

      // 중복 처리 방지를 위한 시간 변경
      this.setCurrentTime(phase1Start + cTime.COMPLETE + 1)
    }

    // 구역 진행 (정해진 시간 외의 로직을 처리하지 않습니다.)
    if (!this.areaRunningTimeCheck()) return

    // 각 시간마다 다른 종류의 총알 등장
    if (this.timeCheckInterval(phase1Start + 5, phase1Start + 11, 6)) {
      fieldState.createEnemyBulletObject(BulletBase)
    } else if (this.timeCheckInterval(phase1Start + 12, phase1Start + 17, 6)) {
      fieldState.createEnemyBulletObject(BulletPlayer)
    } else if (this.timeCheckInterval(phase1Start + 18, phase1Start + 23, 4)) {
      fieldState.createEnemyBulletObject(BulletRain)
    } else if (this.timeCheckInterval(phase1Start + 24, phase1Start + 29, 4)) {
      fieldState.createEnemyBulletObject(BulletLeft)
    } else if (this.timeCheckInterval(phase1Start + 30, phase1Start + 50, 3)) {
      let random = Math.floor(Math.random() * 4)
      switch (random) {
        case 0: fieldState.createEnemyBulletObject(BulletBase); break
        case 1: fieldState.createEnemyBulletObject(BulletPlayer); break
        case 2: fieldState.createEnemyBulletObject(BulletRain); break
        case 3: fieldState.createEnemyBulletObject(BulletLeft); break
      }
    }

    let playerP = this.getPlayerObject()
    if (playerP.shield < playerP.shieldMax) {
      playerP.shield += 1
      this.areaStat.totalDamage += 1
      soundSystem.play(soundSrc.round.r2_3_a1_damage)
    }
  }

  coursePhaseA2 () {
    const phase2Time = this.phaseTime[2].startTime
    const cTime = this.checkTimeList
    if (this.timeCheckFrame(phase2Time + cTime.READY)) {
      this.musicChange(this.musicList.a2_break_room)
      this.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.time = 45
      this.areaStat.playerHp = this.areaStat.a2BaseHp
      this.areaStat.playerHpEnimation = this.areaStat.playerHp
      this.areaStat.enemyHp = this.areaStat.a2BaseHp
      this.areaStat.createEnemyCount = 0
    } else if (this.timeCheckFrame(phase2Time + cTime.START)) {
      this.setResult(this.resultList.FIGHT)
      // 시작 명령이 내려지는 순간, 벽돌은 곧바로 출발하게 됩니다.
      let enemyObject = this.getEnemyObject()
      for (let i = 0; i < enemyObject.length; i++) {
        let enemy = enemyObject[i]
        if (enemy.moveDelay != null) {
          enemy.state = 'move'
          enemy.moveDelay.count = (-20 * i) + enemy.moveDelay.delay
        }
      }
    } else if (this.timeCheckFrame(phase2Time + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 결과값이 ready일 때 미리 벽돌 생성
    if (this.timeCheckInterval(phase2Time + cTime.READY + 1, phase2Time + cTime.READY + 2, 10) && this.getEnemyCount() < 5) {
      const positionX = graphicSystem.CANVAS_WIDTH - 100
      const positionY = 100 * ((this.getEnemyCount() % 5) + 1)
      this.createEnemy(ID.enemy.donggramiEnemy.a2_brick, positionX, positionY)
      this.areaStat.createEnemyCount++
      console.log(this.areaStat.createEnemyCount, this.getEnemyCount())
    }

    // 해당 구역이 시작되기 전까지, 벽돌은 움직이지 않는 상태입니다.
    if (this.timeCheckInterval(phase2Time + cTime.READY, phase2Time + cTime.READY + 1)) {
      let enemyObject = this.getEnemyObject()
      for (let i = 0; i < enemyObject.length; i++) {
        let enemy = enemyObject[i]
        enemy.state = 'stop'
      }
    }

    // 진행 시간 범위 확인 (아닐경우 로직을 처리하지 않음)
    if (!this.areaRunningTimeCheck()) return

    // 지속적인 벽돌 생성
    if (this.currentTimeTotalFrame % 20 === 0) {
      for (let i = 1; i < 6; i++) { // 맨 위의 벽돌은 생성시키지 않음
        // 2% 확률로 폭탄 벽돌 생성
        let bombRandom = Math.random() * 100 < 2 ? true : false
        const positionX = graphicSystem.CANVAS_WIDTH
        const positionY = 100 * (i % 6)
        if (bombRandom) {
          this.createEnemy(ID.enemy.donggramiEnemy.a2_bomb, positionX, positionY)
        } else {
          this.createEnemy(ID.enemy.donggramiEnemy.a2_brick, positionX, positionY)
        }

        this.areaStat.createEnemyCount++
      }
    }

    // 현재 벽돌의 개수와, 죽은 벽돌의 개수를 살펴봅니다.
    // 생성된 개수가 적의 수보다 많으면 벽돌을 죽인것으로 생각하고 해당 카운트를 감소시킵니다.
    if (this.areaStat.createEnemyCount > this.getEnemyCount()) {
      this.areaStat.createEnemyCount--
      this.areaStat.enemyHp -= 1
    }

    // 플레이어와 벽돌의 충돌 판정
    let playerP = this.getPlayerObject()
    let enemy = this.getEnemyObject()
    for (let i = 0; i < enemy.length; i++) {
      if (this.areaStat.damageSoundDelayCount <= 0 && collision(playerP, enemy[i])) {
        playerP.shield += 10
        this.areaStat.playerHp -= 4
        if (this.areaStat.damageSoundDelayCount <= 0) {
          soundSystem.play(soundSrc.round.r2_3_a1_damage)
          this.areaStat.damageSoundDelayCount = 15
        }
        break
      }

      // 벽돌은 맨 왼쪽으로 이동하면 삭제됩니다.
      // 중복 처리 방지를 위하여, isDeleted 여부도 같이 살펴봅니다.
      if (enemy[i].x + enemy[i].width < 0 && !enemy[i].isDeleted) {
        enemy[i].isDeleted = true
        this.areaStat.createEnemyCount-- // 생성된 적 수도 제거
      }
    }

    // 사운드 출력용 딜레이
    if (this.areaStat.damageSoundDelayCount >= 1) {
      this.areaStat.damageSoundDelayCount--
    }

    // 플레이어는 맨 위로 이동할 수 없습니다.
    if (playerP.y < 100) {
      playerP.y = 100
    }

    // 플레이어 체력 에니메이션 처리 (a1이랑 다른점은 체력이 떨어지는속도가 더욱 빨라짐)
    this.coursePhaseA2PlayerHpEnimation()

    // 결과에 대한 처리
    const result = this.coursePhaseA1Result()
    if (result !== '') { // 결과값이 있을경우 그에 대한 처리
      this.setCurrentTime(phase2Time + cTime.COMPLETE + 1) // 중복 처리 방지를 위한 시간 이동
      this.setResult(result)
      this.musicStop()
      this.playerMoveEnable() // 플레이어 이동 가능하도록 강제로 처리
      fieldState.allEnemyDie() // 모든 적 제거
      if (this.result === this.resultList.LOSE) {
        this.addScore(this.scoreList.LOSE2)
      } else {
        this.addScore(this.scoreList.COMPLETE2)
      }
    }
  }

  coursePhaseA2PlayerHpEnimation () {
    // 플레이어 데미지 요소를 부드럽게 그리고 반짝이게 하기 위한 에니메이션 처리
    // a1 구역에서 사용하는 함수와 데미지 변화 값이 서로 다릅니다.
    if (this.areaStat.playerHp < this.areaStat.playerHpEnimation && this.currentTimeTotalFrame % 2 === 0) {
      this.areaStat.playerHpEnimation--
      this.areaStat.playerHpEnimationFrame += 2
    }

    if (this.areaStat.playerHp < this.areaStat.playerHpEnimation - 5 && this.currentTimeTotalFrame % 2 === 0) {
      this.areaStat.playerHpEnimation -= 5
      this.areaStat.playerHpEnimationFrame += 2
    }

    if (this.areaStat.playerHpEnimationFrame > 0) {
      this.areaStat.playerHpEnimationFrame--
    }

    if (this.areaStat.playerHp <= 0) {
      this.areaStat.playerHp = 0
    }
    if (this.areaStat.enemyHp <= 0) {
      this.areaStat.enemyHp = 0
    }
  }

  displayCoursePhaseA2 () {
    if (!this.areaShowResultTimeCheck()) return

    // 플레이어의 체력값과 적의 체력값 표시
    digitalDisplay('PLAYER HP: ' + this.areaStat.playerHp, 0, 70)
    digitalDisplay('ENEMY HP: ' + this.areaStat.enemyHp, 450, 70)

    // 플레이어의 체력은 왼쪽부터 오른쪽으로 이동하는 구조... 그리고 에니메이션 형태로 조작됨
    const percent = this.areaStat.playerHpEnimation / this.areaStat.a2BaseHp
    const divValue = 350 * percent
    const playerHpColor = this.areaStat.playerHpEnimationFrame % 3 === 0 ? 'green' : 'yellow' 
    graphicSystem.meterRect(350 - divValue, 30, divValue, 40, playerHpColor, 100, 100) // 엄밀히 따지면 meterRect를 사용하나 fillRect를 사용하나 같음

    // 적 체력 표시
    graphicSystem.meterRect(450, 30, 350, 40, 'red', this.areaStat.enemyHp, this.areaStat.a2BaseHp)
  }
  
  coursePhaseA3 () {
    const phase3Start = this.phaseTime[3].startTime
    const cTime = this.checkTimeList

    if (this.timeCheckFrame(phase3Start + cTime.READY)) {
      this.setResult(this.resultList.READY)
      this.areaStat.powerEnemy = 0
      this.areaStat.powerPlayer = 0
      this.areaStat.time = 45
      this.musicChange(this.musicList.a3_power_room)
      this.musicPlay()
    } else if (this.timeCheckFrame(phase3Start + cTime.START)) {
      this.setResult(this.resultList.START)
      this.createEnemy(ID.enemy.donggramiEnemy.a3_collector)
    } else if (this.timeCheckFrame(phase3Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    let PowerObject = class extends FieldData {
      constructor () {
        super()
        // 생성 확률
        // 50% 빨강 1점, 20% 파랑 2점, 20% 초록 2점, 10% 보라 3점
        let random = Math.random() * 100
        let colorNumber = 0
        this.message = 'red' // 메세지를 이용하여 외부에서 색깔을 구분하도록 함
        if (random >= 50 && random <= 70) {
          colorNumber = 1 // 20% 파랑
          this.message = 'blue'
        } else if (random >= 71 && random <= 90) {
          colorNumber = 2 // 20% 초록
          this.message = 'green'
        } else if (random >= 91) {
          colorNumber = 3 // 10% 보라
          this.message = 'purple'
        }
        
        let imageDataList = [
          imageDataInfo.round2_3_effect.powerRed,
          imageDataInfo.round2_3_effect.powerBlue,
          imageDataInfo.round2_3_effect.powerGreen,
          imageDataInfo.round2_3_effect.powerPurple,
        ]
        this.setAutoImageData(imageSrc.round.round2_3_effect, imageDataList[colorNumber], 3)
      }
    }

    // 정해진 시간 범위 내에서 구역 진행
    if (!this.areaRunningTimeCheck()) return
    
    let sprite = this.getSpriteObject()
    // 파워는 초당 10개씩 생성
    // 스프라이트가 24개 이하일때만 생성됨
    if (sprite.length < 24 && this.timeCheckInterval(0, 999, 6)) {
      let randomX = Math.random() * (graphicSystem.CANVAS_WIDTH - 50)
      let randomY = Math.random() * (graphicSystem.CANVAS_HEIGHT - 50)
      fieldState.createSpriteObject(PowerObject, randomX, randomY)
    }

    // 1 vs 1 승부이므로, 적은 한마리만 존재, 그래서 0번 배열에 있는 적 데이터를 직접 가져옴
    let enemy = this.getEnemyObject()[0]
    let player = this.getPlayerObject()

    // 스프라이트와 적과 플레이어의 충돌 판정
    // 적은 아직 만들어지지 않았음
    for (let i = 0; i < sprite.length; i++) {
      let currentSprite = sprite[i]

      // 색깔에 따른 파워 포인트 설정
      let powerPoint = 1
      if (currentSprite.message === 'blue' || currentSprite.message === 'green') {
        powerPoint = 2
      } else if (currentSprite.message === 'purple') {
        powerPoint = 3
      }

      // 파워 사운드 결정 ('red', 그리고 나머지는 획득했을 때 효과음이 서로 다릅니다.)
      // 사운드 번호는 powerPoint에 따라 지정됩니다.
      let soundNumber = 0

      if (collision(player, currentSprite)) {
        // 플레이어 파워 획득
        this.areaStat.powerPlayer += powerPoint
        currentSprite.isDeleted = true
        soundNumber = powerPoint === 1 ? 1 : 2
      } else if (enemy != null && collision(enemy, currentSprite)) {
        // 적 파워 획득
        this.areaStat.powerEnemy += powerPoint
        currentSprite.isDeleted = true
        soundNumber = powerPoint === 1 ? 1 : 2
      }

      if (soundNumber === 1) {
        this.soundPlay(soundSrc.round.r2_3_a3_power1)
      } else if (soundNumber === 2) {
        this.soundPlay(soundSrc.round.r2_3_a3_power2)
      }
    }

    if (this.areaStat.time === 0) {
      if (this.areaStat.powerPlayer > this.areaStat.powerEnemy) {
        this.setResult(this.resultList.WIN)
      } else if (this.areaStat.powerPlayer < this.areaStat.powerEnemy) {
        this.setResult(this.resultList.LOSE)
      } else {
        this.setResult(this.resultList.DRAW)
      }

      if (this.result === this.resultList.LOSE) {
        this.addScore(this.scoreList.LOSE3)
      } else {
        this.addScore(this.scoreList.COMPLETE3)
      }

      this.setCurrentTime(phase3Start + cTime.COMPLETE + 1)
      fieldState.allSpriteDelete()
    }
  }

  displayCoursePhaseA3 () {
    if (!this.areaShowResultTimeCheck()) return

    this.donggramiNumberDisplay(this.areaStat.powerPlayer, 210, 40)
    this.donggramiNumberDisplay(this.areaStat.powerEnemy, 460, 40)
  }

  coursePhaseB2 () {
    const phase2Start = this.phaseTime[2].startTime
    const cTime = this.checkTimeList

    // ready start
    if (this.timeCheckFrame(phase2Start + cTime.READY)) {
      this.musicChange(this.musicList.b2_warp_room)
      this.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.time = 45
      this.areaStat.warpCount = 0
    } else if (this.timeCheckFrame(phase2Start + cTime.START)) {
      this.coursePhaseB2ChangeWarp() // 워프 생성 및 처리
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase2Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 세부 로직 처리 (시간 조건 확인)
    if (!this.areaRunningTimeCheck()) return

    // 플레이어와 적과의 충돌
    let playerP = this.getPlayerObject()
    let enemyObject = this.getEnemyObject()
    for (let i = 0; i < enemyObject.length; i++) {
      if (enemyObject[i].state === '' && collision(playerP, enemyObject[i])) {
        enemyObject[i].state = 'collision'
        playerP.setAutoMove(playerP.x + Math.random() * 200 - 100, playerP.y + Math.random() * 200 - 100, 20)
        soundSystem.play(soundSrc.round.r2_3_a1_damage)
      }
    }

    // 무작위 적 생성 (1초마다, 적 수가 10마리가 될 때까지 생성)
    if (this.currentTimeTotalFrame % 60 === 0 && this.getEnemyCount() < 10) {
      this.createEnemy(ID.enemy.donggramiEnemy.b2_mini)
    }

    // 플레이어와 적과의 워프 처리
    let sprite = this.getSpriteObject()
    for (let i = 0; i < sprite.length; i++) {
      if (collision(playerP, sprite[i])) {
        // 플레이어가 워프에 충돌하면, 플레이어를 랜덤한 위치로 보내고 워프처리
        soundSystem.play(soundSrc.round.r2_3_b2_warp)
        playerP.x = graphicSystem.CANVAS_WIDTH_HALF
        playerP.y = graphicSystem.CANVAS_HEIGHT_HALF
        fieldState.allEnemyDelete()
        this.coursePhaseB2ChangeWarp()
        this.coursePhaseB2ChangeGradient()
        this.areaStat.warpCount++
      }

      for (let j = 0; j < enemyObject.length; j++) {
        if (collision(enemyObject[j], sprite[i])) {
          soundSystem.play(soundSrc.round.r2_3_b2_warp)
          enemyObject[j].isDeleted = true
        }
      }
    }

    // 참고: 만약 불러오기를 해서, 스프라이트가 존재하지 않는다면, 스프라이트를 재생성합니다.
    if (sprite.length === 0) {
      this.coursePhaseB2ChangeWarp()
    }

    // 제한시간이 다 된경우 컴플리트
    if (this.areaStat.time === 0 && this.result === this.resultList.NOTHING) {
      this.setResult(this.resultList.COMPLETE)
      this.setCurrentTime(phase2Start + cTime.COMPLETE + 1)

      this.addScore(this.scoreList.COMPLETE2)

      // 워프 삭제
      for (let i = 0; i < sprite.length; i++) {
        sprite[i].isDeleted = true
      }
    }
  }

  coursePhaseB2ChangeGradient () {
    // 랜덤 그라디언트 셋팅... (10 ~ 99) // 왜냐하면 숫자로 2자리여야 하므로...
    let a = Math.floor(Math.random() * 89) + 10
    let b = Math.floor(Math.random() * 89) + 10
    let c = Math.floor(Math.random() * 89) + 10
    let d = Math.floor(Math.random() * 89) + 10
    let e = Math.floor(Math.random() * 89) + 10
    let f = Math.floor(Math.random() * 89) + 10
    this.currentGradientColor = ['#' + a + b + c, '#' + d + e + f]
  }

  coursePhaseB2ChangeWarp () {
    // 워프 스프라이트
    let WarpObject = class extends FieldData {
      constructor () {
        super()
        let imageDataList = [
          imageDataInfo.round2_3_effect.warpArchomatic,
          imageDataInfo.round2_3_effect.warpCyan,
          imageDataInfo.round2_3_effect.warpYellow,
          imageDataInfo.round2_3_effect.warpMint,
        ]
        let random = Math.floor(Math.random() * imageDataList.length)
        this.setAutoImageData(imageSrc.round.round2_3_effect, imageDataList[random], 3)
      }

      afterInit () {
        let isLeft = Math.random() < 0.5 ? true : false
        // 왼쪽이냐 오른쪽이냐에 따라 x좌표 결정 // 오른쪽에 배치될때는 화면 바깥을 벗어나지 않게 한다.
        this.x = isLeft ? Math.random() * 100 : (Math.random() * 100) + graphicSystem.CANVAS_WIDTH - 100 - this.width
        this.y = Math.random() * (graphicSystem.CANVAS_HEIGHT - this.height)
      }
    }
    
    // 기존에 있는 스프라이트 전부 삭제
    // 아직 스프라이트를 제거하는 함수륾 만들지는 않아서, 간접적으로 제거합니다.
    let sprite = this.getSpriteObject()
    for (let i = 0; i < sprite.length; i++) {
      sprite[i].isDeleted = true // 스프라이트 삭ㅈ[]
    }

    // 오브젝트를 다시 생성합니다. // 좌표는 자동으로 설정되므로 지정할 필요가 없음
    for (let i = 0; i < 2; i++) {
      fieldState.createSpriteObject(WarpObject)
    }
  }

  coursePhaseB3 () {
    const phase3Start = this.phaseTime[3].startTime
    const cTime = this.checkTimeList

    let ArrowObject = class extends FieldData {
      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round2_3_effect, imageDataInfo.round2_3_effect.moveArrow)
        this.degree = Math.floor(Math.random() * 12) * 30

        // 에니메이션 개체는 enimation.degree를 사용해야 회전한 형태로 출력이 가능합니다.
        // 참고: 추후에 이와 관련한 로직을 수정할 예정
        if (this.enimation != null) {
          this.enimation.degree = this.degree
        }

        this.moveDelay = new DelayData(120)
      }

      process () {
        super.process()
        this.processCollision()

        if (this.moveDelay.check()) {
          this.x = Math.random() * (graphicSystem.CANVAS_WIDTH - this.width)
          this.y = Math.random() * (graphicSystem.CANVAS_HEIGHT - this.height)
        }

        if (this.exitAreaCheck()) {
          this.isDeleted = true
        }
      }

      display () {
        super.display()
      }

      processCollision () {
        let player = fieldState.getPlayerObject()
        let enemy = fieldState.getEnemyObject()
        let addPositionX = 0
        let addPositionY = 0

        // 각도에 따른 이동 값 결정...
        // 기준 최대치는 400픽셀, 참고: 어떻게 공식을 구상해야하는지 몰라서 일일히 수치를 지정해놓음
        switch (this.degree) {
          case 0: addPositionX = 0; addPositionY = -150; break
          case 30: addPositionX = 50; addPositionY = -100; break
          case 60: addPositionX = 100; addPositionY = -50; break
          case 90: addPositionX = 150; addPositionY = 0; break
          case 120: addPositionX = 100; addPositionY = 50; break
          case 150: addPositionX = 50; addPositionY = 100; break
          case 180: addPositionX = 0; addPositionY = 150; break
          case 210: addPositionX = -50; addPositionY = 100; break
          case 240: addPositionX = -100; addPositionY = 50; break
          case 270: addPositionX = -150; addPositionY = 0; break
          case 300: addPositionX = -100; addPositionY = -50; break
          case 330: addPositionX = -50; addPositionY = -100; break
        }

        if (collision(player, this)) {
          player.setAutoMove(player.x + addPositionX, player.y + addPositionY, 30)
          soundSystem.play(soundSrc.round.r2_3_b3_move)
        }

        // 참고사항: 이 state 변경 옵션은 특정 적에게만 적용됩니다. 다른 적에겐 아무 효과가 없습니다.
        // 그리고, 이동 변화값만 지정합니다. 적 내부에서 자기 자신을 기준으로 최종 위치가 결정되기 때문입니다.
        for (let i = 0; i < enemy.length; i++) {
          let currentEnemy = enemy[i]
          if (currentEnemy.state === '' && collision(currentEnemy, this)) {
            currentEnemy.state = 'automove' + ' ' + addPositionX + ' ' + addPositionY
            soundSystem.play(soundSrc.round.r2_3_b3_move)
          }
        }
      }
    }

    let CubeObject = class extends ArrowObject {
      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round2_3_effect, imageDataInfo.round2_3_effect.moveCube)
        if (this.enimation != null) {
          this.enimation.degree = 0
        }
      }

      processCollision () {
        let player = fieldState.getPlayerObject()
        let enemy = fieldState.getEnemyObject()
        let endPositionX = Math.random() * graphicSystem.CANVAS_WIDTH
        let endPositionY = Math.random() * graphicSystem.CANVAS_HEIGHT

        if (collision(player, this)) {
          player.setAutoMove(endPositionX, endPositionY)
          soundSystem.play(soundSrc.round.r2_3_b2_warp)
        }

        // 참고사항: 이 state 변경 옵션은 특정 적에게만 적용됩니다. 다른 적에겐 아무 효과가 없습니다.
        for (let i = 0; i < enemy.length; i++) {
          let currentEnemy = enemy[i]
          if (currentEnemy.state === '' && collision(currentEnemy, this)) {
            currentEnemy.state = 'automove' + ' ' + endPositionX + ' ' + endPositionY
            soundSystem.play(soundSrc.round.r2_3_b3_move)
          }
        }
      }
    }


    // 준비, 시작
    if (this.timeCheckFrame(phase3Start + cTime.READY)) {
      this.musicChange(this.musicList.b3_move_room)
      this.musicPlay()
      this.areaStat.time = 45
      this.setResult(this.resultList.READY)
    } else if (this.timeCheckFrame(phase3Start + cTime.START)) {
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase3Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 해당 구역 시간 범위 확인
    if (!this.areaRunningTimeCheck()) return

    let sprite = this.getSpriteObject()
    if (sprite.length === 0) {
      // 무작위 스프라이트 생성
      for (let i = 0; i < 16; i++) {
        fieldState.createSpriteObject(ArrowObject, Math.random() * graphicSystem.CANVAS_WIDTH, Math.random() * graphicSystem.CANVAS_HEIGHT)
      }
      for (let i = 0; i < 4; i++) {
        fieldState.createSpriteObject(CubeObject, Math.random() * graphicSystem.CANVAS_WIDTH, Math.random() * graphicSystem.CANVAS_HEIGHT)
      }
    }

    if (this.getEnemyCount() < 6) {
      this.createEnemy(ID.enemy.donggramiEnemy.b3_mini)
    }

    let player = this.getPlayerObject()
    let enemy = this.getEnemyObject()
    for (let i = 0; i < enemy.length; i++) {
      let currentEnemy = enemy[i]
      if (currentEnemy.state === '' && collision(player, currentEnemy)) {
        // 알고리즘은 그 위의 스프라이트랑 거의 동일
        player.setAutoMove(player.x + (Math.random() * 200 - 100), player.y + (Math.random() * 200 - 100), 60)
        currentEnemy.state = 'automove' + ' ' + (Math.random() * 200 - 100) + ' ' + (Math.random() * 200 - 100)
        this.soundPlay(soundSrc.round.r2_3_a1_damage)
      }
    }

    // 결과 처리
    if (this.areaStat.time === 0) {
      this.setResult(this.resultList.COMPLETE)
      this.setCurrentTime(phase3Start + cTime.COMPLETE + 1)
      fieldState.allSpriteDelete()
      this.addScore(this.scoreList.COMPLETE3)
    }
  }

  coursePhaseC2 () {
    // 스퀘어 모으기
    const phase2Start = this.phaseTime[2].startTime
    const cTime = this.checkTimeList

    if (this.timeCheckFrame(phase2Start + cTime.READY)) {
      this.musicChange(this.musicList.c2_square_room)
      this.musicPlay()
      this.setResult(this.resultList.READY)
      this.areaStat.score = 0
      this.areaStat.time = 45
      this.areaStat.timeBonusMultiple = 1
      this.areaStat.timeBonusValue = 0
      this.areaStat.squareBlack = 0
      this.areaStat.squareBlackMax = 16
    } else if (this.timeCheckFrame(phase2Start + cTime.START)) {
      this.setResult(this.resultList.START)
    } else if (this.timeCheckFrame(phase2Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    // 진행 상태가 아니면 처리 취소
    if (!this.areaRunningTimeCheck()) return

    // 결과 처리
    if (this.areaStat.time === 0 && this.result === this.resultList.NOTHING) {
      if (this.areaStat.score >= 5000) {
        this.setResult(this.resultList.COMPLETE)
      } else {
        this.setResult(this.resultList.LOSE)
      }

      if (this.result === this.resultList.COMPLETE) {
        this.addScore(this.scoreList.COMPLETE3)
      } else {
        this.addScore(this.scoreList.LOSE3)
      }

      this.setCurrentTime(phase2Start + cTime.COMPLETE + 1)
    }

    let tMultiple = Math.floor((this.areaStat.squareBlack / 10)) + this.areaStat.timeBonusMultiple
    let tBonus = (100 + (this.areaStat.squareBlack * 5)) * tMultiple
    this.areaStat.timeBonusValue += tBonus
    if (this.areaStat.timeBonusValue >= 6000) {
      this.areaStat.timeBonusValue -= 6000
      this.areaStat.score += 1
    }
    
    if (this.areaStat.timeBonusValue >= 12000) {
      this.areaStat.timeBonusValue -= 12000
      this.areaStat.score += 2
    }

    // 스퀘어 생성
    this.coursePhaseC2CreateSquare()

    // 스퀘어 충돌은 라운드에서 처리해야 합니다.
    // 색상 구분을 통하여 어떤것을 얻었는지 정의합니다.
    // 참고: fieldObject이기 때문에, 따로 sprite에 대해 process, display 함수를 사용할 필요는 없습니다.
    let square = this.getSpriteObject()
    let player = this.getPlayerObject()
    for (let i = 0; i < square.length; i++) {
      if (player.autoMoveFrame >= 1) {
        break // 플레이어가, 빨간 사각형을 먹어 자동 이동 상태가 될경우, 사각형을 얻을 수 없음
      }

      let currentSquare = square[i]
      let squareScore = 100 + this.areaStat.squareBlack
      let randomBonus = Math.floor((Math.random() * squareScore) + (squareScore * 10))
      if (collision(player, currentSquare)) {
        switch (currentSquare.message) {
          case 'black':
            soundSystem.play(soundSrc.round.r2_3_c2_squareBlack)
            this.areaStat.score += squareScore
            this.areaStat.squareBlack++
            break
          case 'red':
            // 사각형을 2초동안 먹을 수 없으며, 움직일 수 없음
            soundSystem.play(soundSrc.round.r2_3_c2_squareRed)
            player.setAutoMove(player.x + Math.random() * 200 - 100, player.y + Math.random() * 200 - 100, 120)
            break
          case 'cyan':
            // 보너스 점수
            soundSystem.play(soundSrc.round.r2_3_c2_squareCyan)
            this.areaStat.score += squareScore + randomBonus
            break
          case 'lime':
            // 시간 가속배율 증가
            soundSystem.play(soundSrc.round.r2_3_c2_squareLime)
            this.areaStat.timeBonusMultiple += 2
            break
          case 'pink':
            soundSystem.play(soundSrc.round.r2_3_c2_squarePink)
            // 검은 사각형이 더 많이 나옴
            this.areaStat.squareBlackMax += 4
            break
        }
        currentSquare.isDeleted = true
      }
    }
  }

  coursePhaseC2CreateSquare () {
    const squareSpeed = this.areaStat.squareBlack < 60 ? this.areaStat.squareBlack * 0.1 : 6
    let Square = class extends FieldData {
      constructor () {
        super()
        this.speedMultiple = 3
        this.width = 20
        this.height = 20
        this.color = 'black'
        this.outAreaCount = 0
      }

      afterInit () {
        // 메세지 값 설정 (외부에서 사용하기 위해서?)
        this.message = this.color
        this.resetPosition()
      }

      resetPosition () {
        // 무작위 속도 설정 및, 벽쪽에서 안쪽으로 이동
        // 모든 사각형은 왼쪽, 오른쪽, 아래, 위 에서 랜덤 출현
        const layerLine = Math.floor(Math.random() * 4)
        const targetSpeed = Math.floor(Math.random() * 2) + this.speedMultiple + squareSpeed
        switch (layerLine) {
          case 0: // 위 방향 (아래쪽으로 이동)
            this.x = Math.random() * graphicSystem.CANVAS_WIDTH
            this.y = 0 - this.height
            this.setMoveSpeed(0, targetSpeed)
            break
          case 1: // 오른쪽 방향 (왼쪽으로 이동)
            this.x = graphicSystem.CANVAS_WIDTH + this.width
            this.y = Math.random() * graphicSystem.CANVAS_HEIGHT
            this.setMoveSpeed(-targetSpeed, 0)
            break
          case 2: // 아래 방향 (위쪽으로 이동)
            this.x = Math.random() * graphicSystem.CANVAS_WIDTH
            this.y = graphicSystem.CANVAS_HEIGHT + this.height
            this.setMoveSpeed(0, -targetSpeed)
            break
          case 3: // 왼쪽 방향 (오른쪽으로 이동)
            this.x = 0 - this.width
            this.y = Math.random() * graphicSystem.CANVAS_HEIGHT
            this.setMoveSpeed(targetSpeed, 0)
        }
      }

      processMove () {
        super.processMove()
        if (this.outAreaCheck()) {
          this.isDeleted = true
        }
      }

      display () {
        graphicSystem.fillRect(this.x, this.y, this.width, this.height, this.color)
      }
    }

    let BlackSquare = class extends Square {
      constructor () {
        super()
        this.color = 'black'
      }
    }
    let RedSquare = class extends Square {
      constructor () {
        super()
        this.color = 'red'
      }
    }
    let CyanSquare = class extends Square {
      constructor () {
        super()
        this.color = 'cyan'
      }
    }
    let LimeSquare = class extends Square {
      constructor () {
        super()
        this.color = 'lime'
      }
    }
    let PinkSquare = class extends Square {
      constructor () {
        super()
        this.color = 'pink'
      }
    }

    // 사각형 생성
    if (this.currentTimeTotalFrame % 4 === 0) {
      let squareBlackCount = 0
      let squareRedCount = 0
      let square = this.getSpriteObject()
      for (let i = 0; i < square.length; i++) {
        let current = square[i]
        if (current.message === 'red') {
          squareRedCount++
        } else if (current.message === 'black') {
          squareBlackCount++
        }
      }
  
      if (squareBlackCount < this.areaStat.squareBlackMax) {
        fieldState.createSpriteObject(BlackSquare)
      }
      if (squareRedCount < 4) {
        fieldState.createSpriteObject(RedSquare)
      }
    }

    // 특수 사각형 생성
    if (this.currentTimeTotalFrame % 180 === 0) {
      let random = Math.floor(Math.random() * 2)
      switch (random) {
        case 0: fieldState.createSpriteObject(CyanSquare); break
        case 1: fieldState.createSpriteObject(LimeSquare); break
      }
    }

    // 특수 사각형 생성
    if (this.currentTimeTotalFrame % 359 === 0) {
      fieldState.createSpriteObject(PinkSquare)
    }
  }

  coursePhaseC3 () {
    let phase3Start = this.phaseTime[3].startTime
    let cTime = this.checkTimeList

    let player = this.getPlayerObject()
    if (this.timeCheckFrame(phase3Start + cTime.READY)) {
      this.areaStat.goal = 0
      this.areaStat.time = 45
      this.musicChange(this.musicList.c3_trap_room)
      this.musicPlay()
      this.setResult(this.resultList.READY)
      player.x = 0
      player.y = 0
      this.playerMoveDisable()
    } else if (this.timeCheckFrame(phase3Start + cTime.START)) {
      this.setResult(this.resultList.START)
      this.playerMoveEnable()
    } else if (this.timeCheckFrame(phase3Start + cTime.START + 2)) {
      this.setResult(this.resultList.NOTHING)
    }

    if (!this.areaRunningTimeCheck()) return

    // 스프라이트가 없을 때만 스프라이트 생성
    let sprite = this.getSpriteObject()
    if (sprite.length === 0) {
      this.coursePhaseC3TrapCreate()
    }
    
    // 플레이어가 goal 영역에 있는지를 확인합니다.
    for (let i = 0; i < sprite.length; i++) {
      if (sprite[i].message === 'green' && collision(player, sprite[i])) {
        this.soundPlay(soundSrc.round.r2_3_b2_warp)
        player.x = 0 // 플레이어 위치 강제 이동
        player.y = 100
        this.areaStat.goal++ // 골 수 증가
        fieldState.allSpriteDelete() // 모든 스프라이트 삭제
      }
    }

    // 시간이 다 되었을 때 1개 이상의 골인경우는 컴플리트 처리, 5개를 클리어해도 마찬가지
    if (this.areaStat.goal >= 5 || this.areaStat.time === 0) {
      if (this.areaStat.goal >= 1) {
        this.setResult(this.resultList.COMPLETE)
      } else {
        this.setResult(this.resultList.LOSE)
      }

      // 점수 추가
      fieldState.allSpriteDelete()
      this.setCurrentTime(phase3Start + cTime.COMPLETE + 1)
    }
  }

  coursePhaseC3TrapClass () {
    /** 함정 스프라이트 */
    let Trap = class extends FieldData {
      constructor () {
        super()
        this.color = 'black'
      }

      display () {
        graphicSystem.fillRect(this.x, this.y, this.width, this.height, this.color, 0.7)
      }
    }

    /** 위쪽 영역의 벽 */
    let TrapWallUp = class extends Trap {
      afterInit () {
        this.x = 0
        this.y = 90
        this.width = graphicSystem.CANVAS_WIDTH
        this.height = 10
      }

      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        if (player.y < this.y) {
          player.y = this.y + this.height + 1 // 사각형에 닿지 않게끔 y좌표 변경
        }
      }
    }

    /** 아래쪽 영역의 벽 */
    let TrapWallDown = class extends Trap {
      afterInit () {
        this.x = 0
        this.y = graphicSystem.CANVAS_HEIGHT - 100
        this.width = graphicSystem.CANVAS_WIDTH
        this.height = 10
      }

      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        if (collision(player, this)) {
          player.y = this.y - player.height - 1 // 사각형에 닿지 않게끔 y좌표 변경
        }
      }
    }

    /** 닿으면 안되는 함정 */
    let TrapRed = class extends Trap {
      afterInit () {
        this.color = 'red'
        this.width = 50
        this.height = 50
      }

      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        // 플레이어랑 충돌한경우, 플레이어의 위치가 리셋됩니다.
        if (collision(player, this)) {
          soundSystem.play(soundSrc.round.r2_3_a1_damage)
          player.x = 0
          player.y = 0
        }
      }
    }

    /** 왼쪽, 오른쪽으로 움직이는 빨간 사각형 */
    let TrapRedLeftRight = class extends TrapRed {
      constructor () {
        super()
        this.moveDelay = new DelayData(60)
      }

      afterInit () {
        super.afterInit()
        this.setMoveSpeed(4, 0)
        this.state = 'right'
      }
      
      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        if (collision(player, this)) {
          soundSystem.play(soundSrc.round.r2_3_a1_damage)
          player.x = 0
          player.y = 0
        }

        if (this.moveDelay.check()) {
          if (this.state === 'left') {
            this.state = 'right'
            this.setMoveSpeed(4, 0)
          } else {
            this.state = 'left'
            this.setMoveSpeed(-4, 0)
          }
        }
      }
    }

    /** 아래, 위로 움직이는 사각형 */
    let TrapRedUpDown = class extends TrapRed {
      constructor () {
        super()
        this.moveDelay = new DelayData(60)
      }

      afterInit () {
        super.afterInit()
        this.setMoveSpeed(0, 4)
        this.state = 'down'
      }
      
      process () {
        super.process()
        let player = fieldState.getPlayerObject()
        if (collision(player, this)) {
          soundSystem.play(soundSrc.round.r2_3_a1_damage)
          player.x = 0
          player.y = 0
        }

        if (this.moveDelay.check()) {
          if (this.state === 'down') {
            this.state = 'up'
            this.setMoveSpeed(0, -4)
          } else {
            this.state = 'down'
            this.setMoveSpeed(0, 4)
          }
        }
      }
    }

    /** 골인 지점 */
    let TrapGreen = class extends Trap {
      afterInit () {
        this.color = 'green'
        this.width = 100
        this.height = 100
        this.message = 'green'
      }
    }

    return {
      Trap,
      TrapWallDown,
      TrapWallUp,
      TrapRed,
      TrapRedLeftRight,
      TrapRedUpDown,
      TrapGreen
    }
  }

  coursePhaseC3TrapCreate () {
    let trap = this.coursePhaseC3TrapClass()
    let roomNumber = this.areaStat.goal % 4
    
    // 공통 길막용 벽
    fieldState.createSpriteObject(trap.TrapWallUp)
    fieldState.createSpriteObject(trap.TrapWallDown)
    switch (roomNumber) {
      case 0:
        // 참고사항: 좌표값이 뭔가 이상하지만 양해 부탁
        // 구성 (아마도 이런 형태입니다.)
        // P |     |     |G
        //   |  |  |  |  |
        //   |  |  |  |  |
        //      |     |
        fieldState.createSpriteObject(trap.TrapGreen, 700, 100)
        // 0번 룸, 빨간 색 사각형이 길을 막고만 있다.
        for (let i = 0; i < 7; i++) {
          for (let j = 0; j < 8; j++) {
            if (i % 2 === 1 && j >= 2) {
              fieldState.createSpriteObject(trap.TrapRed, (i * 140) + 100, 100 + j * 50)
            } else if (i % 2 === 0 && j <= 5) {
              fieldState.createSpriteObject(trap.TrapRed, (i * 140) + 100, 100 + j * 50)
            }
          }
        }
        break
      case 1:
        // 구성 (아마도 이런 형태)
        // P              |G
        // -------------- |
        //      R    R    |
        //  --------------|
        //
        fieldState.createSpriteObject(trap.TrapGreen, 700, 100)
        for (let i = 0; i < 11; i++) {
          fieldState.createSpriteObject(trap.TrapRed, (i * 50), 160)
          fieldState.createSpriteObject(trap.TrapRed, (i * 50) + 100, 280)
          fieldState.createSpriteObject(trap.TrapRed, (i * 50), 450)
        }
        for (let i = 0; i < 7; i++) {
          fieldState.createSpriteObject(trap.TrapRed, 650, i * 50 + 100)
        }
        for (let i = 0; i < 3; i++) {
          fieldState.createSpriteObject(trap.TrapRedUpDown, (i * 140) + 140, 100)
          fieldState.createSpriteObject(trap.TrapRedUpDown, (i * 140) + 140, 300)
        }
        break
      case 2:
        // 구성
        // P |            |G
        //   |  R  R  R   |
        //   |   
        //   |  R  R  R |
        //              |
        fieldState.createSpriteObject(trap.TrapGreen, 700, 100)
        for (let i = 0; i < 7; i++) {
          fieldState.createSpriteObject(trap.TrapRed, 150, i * 50 + 100)
          fieldState.createSpriteObject(trap.TrapRed, 650, i * 50 + 100)
        }
        for (let i = 0; i < 4; i++) {
          fieldState.createSpriteObject(trap.TrapRed, 450, i * 50 + 300)
        }
        for (let i = 0; i < 3; i++) {
          fieldState.createSpriteObject(trap.TrapRedUpDown, (i * 150) + 150, 100)
          fieldState.createSpriteObject(trap.TrapRedUpDown, (i * 150) + 150, 300)
          fieldState.createSpriteObject(trap.TrapRedLeftRight, (i * 150) + 150, 100)
          fieldState.createSpriteObject(trap.TrapRedLeftRight, (i * 150) + 150, 300)
        }
        break
      case 3:
        fieldState.createSpriteObject(trap.TrapGreen, 700, 100)
        // 구성 (아무렇게나 막 배치한것임. - 랜덤은 아님)
        // #1
        fieldState.createSpriteObject(trap.TrapRed, 100, 100)
        fieldState.createSpriteObject(trap.TrapRed, 20, 220)
        fieldState.createSpriteObject(trap.TrapRed, 80, 240)
        fieldState.createSpriteObject(trap.TrapRed, 140, 270)
        fieldState.createSpriteObject(trap.TrapRed, 160, 300)
        fieldState.createSpriteObject(trap.TrapRed, 160, 350)
        fieldState.createSpriteObject(trap.TrapRed, 210, 400)
        fieldState.createSpriteObject(trap.TrapRed, 220, 460)
        fieldState.createSpriteObject(trap.TrapRed, 280, 480)
        fieldState.createSpriteObject(trap.TrapRed, 330, 440)
        fieldState.createSpriteObject(trap.TrapRed, 390, 420)
        fieldState.createSpriteObject(trap.TrapRed, 450, 400)
        fieldState.createSpriteObject(trap.TrapRed, 500, 380)
        fieldState.createSpriteObject(trap.TrapRed, 550, 360)
        fieldState.createSpriteObject(trap.TrapRed, 600, 340)
        fieldState.createSpriteObject(trap.TrapRed, 620, 310)
        fieldState.createSpriteObject(trap.TrapRed, 690, 250)
        fieldState.createSpriteObject(trap.TrapRed, 720, 200)

        // #2
        fieldState.createSpriteObject(trap.TrapRed, 200, 130)
        fieldState.createSpriteObject(trap.TrapRed, 250, 150)
        fieldState.createSpriteObject(trap.TrapRed, 300, 190)
        fieldState.createSpriteObject(trap.TrapRed, 300, 260)
        fieldState.createSpriteObject(trap.TrapRed, 300, 260)
        fieldState.createSpriteObject(trap.TrapRed, 350, 290)
        fieldState.createSpriteObject(trap.TrapRed, 410, 270)
        fieldState.createSpriteObject(trap.TrapRed, 450, 230)
        fieldState.createSpriteObject(trap.TrapRed, 480, 210)
        fieldState.createSpriteObject(trap.TrapRed, 540, 160)
        fieldState.createSpriteObject(trap.TrapRed, 550, 110)
        break
    }
  }
}

class Round2_4 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round2_4)

    this.backgroundNumber = 0

    this.backgroundAbsoluteX = 0
    this.backgroundAbsoluteY = 0
    this.musicSrc = '' // 음악 없음 (초반 페이즈에는 음악이 재생되지 않습니다.)

    // 기본 배경 설정
    this.backgroundImageSrc = imageSrc.round.round2_4_corridor

    this.addRoundPhase(this.roundPhase00, 0, 1) // 초기
    this.addRoundPhase(this.roundPhase01, 2, 19) // 복도 + 엘리베이터
    this.addRoundPhase(this.roundPhase02, 20, 59) // 필드1
    this.addRoundPhase(this.roundPhase03, 60, 99) // 필드2
    this.addRoundPhase(this.roundPhase04, 100, 139) // 필드3
    this.addRoundPhase(this.roundPhase05, 140, 179) // 보스전/필드4
    this.addRoundPhase(this.roundPhase06, 180, 207) // 지하실 이동

    /** 각 코스의 이름 상수 */
    this.courseName = {
      INSIDE: 'inside',
      OUTSIDE: 'outside',
      /** 상점 내부 */ SHOP: 'shop',
      /** 1번째 구역에서만 사용함 */ FIRST: 'first'
    }

    /** 현재 코스의 이름: (총 3종류: inside, outside, shop, (first는 초기값용도로만 사용) ) */
    this.currentCourseName = this.courseName.FIRST

    this.addLoadingImageList([
      imageSrc.round.round2_4_corridor,
      imageSrc.round.round2_4_courseSelect,
      imageSrc.round.round2_4_elevator,
      imageSrc.round.round2_4_elevatorFloor1,
      imageSrc.round.round2_4_elevatorFloor3,
      imageSrc.round.round2_4_elevatorFloor4,
      imageSrc.round.round2_4_elevatorHall,
      imageSrc.round.round2_4_elevatorNumber,
      imageSrc.round.round2_4_elevatorOutside,
      imageSrc.round.round2_4_elevatorRooftop,
      imageSrc.round.round2_4_floorB1,
      imageSrc.round.round2_4_mountainDeep,
      imageSrc.round.round2_4_placard,
      imageSrc.round.round2_4_mountainPath,
      imageSrc.round.round2_4_mountainRooftop,
      imageSrc.round.round2_4_mountainWall,
      imageSrc.round.round2_4_rooftop,
      imageSrc.round.round2_4_rooftopWayout,
      imageSrc.round.round2_4_roomBlue,
      imageSrc.round.round2_4_roomParty,
      imageSrc.round.round2_4_roomSky,
      imageSrc.round.round2_4_roomYellow,
    ])
    
    this.addLoadingSoundList([
      soundSrc.round.r2_4_elevatorDoorClose,
      soundSrc.round.r2_4_elevatorDoorOpen,
      soundSrc.round.r2_4_elevatorFloor,
      soundSrc.round.r2_4_elevatorMove,
      soundSrc.round.r2_4_message1,
      soundSrc.music.music12_donggrami_hall_outside,
      soundSrc.music.music13_round2_4_jemu,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound2ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound2ShareSound())
    this.spriteElevator = Round2_4.createSpriteElevator()
  }

  processSaveString () {
    this.saveString = '' + this.backgroundAbsoluteX 
      + ',' + this.backgroundAbsoluteY
      + ',' + this.spriteElevator.state 
      + ',' + this.spriteElevator.stateDelay.count 
      + ',' + this.spriteElevator.floorDelay.count
      + ',' + this.spriteElevator.floor
      + ',' + this.spriteElevator.floorArrive
      + ',' + this.spriteElevator.isFloorMove
      + ',' + this.currentCourseName
  }

  loadDataProgressSaveString () {
    let str = this.saveString.split(',')
    this.backgroundAbsoluteX = Number(str[0])
    this.backgroundAbsoluteY = Number(str[1])
    this.spriteElevator.state = str[2]
    this.spriteElevator.stateDelay.count = Number(str[3])
    this.spriteElevator.floorDelay.count = Number(str[4])
    this.spriteElevator.floor = Number(str[5])
    this.spriteElevator.floorArrive = Number(str[6])
    this.spriteElevator.isFloorMove = str[7] === 'true' ? true : false
    this.currentCourseName = str[8]
  }

  roundPhase00 () {
    // 선택을 위해서 플레이어 강제 이동
    if (this.timeCheckFrame(0, 2)) {
      let player = this.getPlayerObject()
      player.x = 400
      player.y = 500
    }

    // 코스 선택
    if (this.timeCheckInterval(1, 2)) {
      this.roundPhase00CourseSelect()
    }
    
    // 추가 작업 필요 (다만 나중에 할 예정)
    this.roundPhase00Shop()
  }

  roundPhase00CourseSelect () {
    let areaInside = { x: 600, y: 300, width: 200, height: 300 }
    let areaOutside = { x: 0, y: 300, width: 200, height: 300 }
    let areaShop = { x: 260, y: 140, width: 280, height: 270 }

    this.setCurrentTimePause(true, 'please select course')
    let player = this.getPlayerObject()

    // 코스를 선택했으면 해당하는 코스를 진행하고 다음 페이즈로 이동합니다.
    if (collision(player, areaInside)) {
      this.currentCourseName = this.courseName.INSIDE
      this.setCurrentTime(this.phaseTime[1].startTime)
    } else if (collision(player, areaOutside)) {
      this.currentCourseName = this.courseName.OUTSIDE
      this.setCurrentTime(this.phaseTime[1].startTime)
    } else if (collision(player, areaShop)) {
      // 상점에서는 현재 시간이 변경되지 않습니다.
      this.currentCourseName = this.courseName.SHOP
    }
  }

  roundPhase00Shop () {
    // 미정...
  }

  roundPhase01 () {
    // 시간 정지 해제
    this.setCurrentTimePause(false)
    this.spriteElevator.process()

    // 엘리베이터에 도착하고 엘리베이터에 탑승하여 다른 층으로 이동하는 과정
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    const ElevatorTime = pTime + 7
    if (this.timeCheckFrame(ElevatorTime + 0)) {
      this.changeBackgroundImage(imageSrc.round.round2_4_elevatorFloor1)
      this.spriteElevator.setDoorOpen(true) // 엘리베이터 열림
    } else if (this.timeCheckFrame(ElevatorTime + 1)) {
      this.changeBackgroundImage(imageSrc.round.round2_4_elevatorHall, 60) // 배경 전환
    } else if (this.timeCheckFrame(ElevatorTime + 2)) {
      this.spriteElevator.setDoorOpen(false) // 엘리베이터 닫힘
    } else if (this.timeCheckFrame(ElevatorTime + 3)) {
      if (this.currentCourseName === this.courseName.INSIDE) {
        this.spriteElevator.setFloorMove(4) // 인사이드 코스에서는 4층으로 이동
      } else {
        this.spriteElevator.setFloorMove(5) // 아웃사이드 코스에서는 5층으로 이동
      }
    } else if (this.timeCheckFrame(ElevatorTime + 8)) {
      this.spriteElevator.setDoorOpen(true)
    } else if (this.timeCheckFrame(ElevatorTime + 9)) {
      if (this.currentCourseName === this.courseName.INSIDE) {
        this.changeBackgroundImage(imageSrc.round.round2_4_elevatorFloor4, 60)
      } else {
        this.changeBackgroundImage(imageSrc.round.round2_4_elevatorRooftop, 60)
      }
    } else if (this.timeCheckFrame(ElevatorTime + 10)) {
      this.spriteElevator.setDoorOpen(false)
    } else if (this.timeCheckFrame(ElevatorTime + 11)) {
      this.setCurrentTime(this.phaseTime[1].endTime)
    }
  }

  roundPhase02 () {
    // 인사이드, 아웃사이드 페이즈 동일
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.timeCheckFrame(pTime + 0)) {
      // 음악 변경 및 재생
      this.musicChange(soundSrc.music.music12_donggrami_hall_outside)
      this.musicPlay()
    }

    // 적들 등장 (dps 60% ~ 90%)
    if (this.timeCheckInterval(pTime + 0, pTime + 8, 20)) {
      this.createEnemy(ID.enemy.donggramiEnemy.fruit)
    } else if (this.timeCheckInterval(pTime + 10, pTime + 18, 20)) {
      this.createEnemy(ID.enemy.donggramiEnemy.juice)
    } else if (this.timeCheckInterval(pTime + 20, pTime + 28, 20)) {
      this.createEnemy(ID.enemy.donggramiEnemy.party)
    } else if (this.timeCheckInterval(pTime + 30, pTime + 40, 50)) {
      this.createEnemy(ID.enemy.donggramiEnemy.fruit)
      this.createEnemy(ID.enemy.donggramiEnemy.juice)
      this.createEnemy(ID.enemy.donggramiEnemy.party)
      this.createEnemy(ID.enemy.donggramiEnemy.talkParty)
    }
  }

  roundPhase03 () {
    if (this.currentCourseName === this.courseName.OUTSIDE) {
      this.roundPhase03Outside()
    } else {
      this.roundPhase03Inside()
    }
  }

  roundPhase03Outside () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    
    // 평균 dps: 90% ~ 110%
    if (this.timeCheckInterval(pTime + 1, pTime + 8, 50)) {
      // 일반 동그라미, 특수 동그라미, 파티 동그라미가 혼합하여 등장
      this.createEnemy(ID.enemy.donggramiEnemy.normal)
      this.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.createEnemyPartyDonggrami()
      this.createEnemyPartyDonggrami()
      this.createEnemySpecialDonggrami()
    } else if (this.timeCheckInterval(pTime + 10, pTime + 18, 25)) {
      this.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.createEnemyPartyDonggrami()
    } else if (this.timeCheckInterval(pTime + 20, pTime + 28, 60)) {
      this.createEnemy(ID.enemy.donggramiEnemy.normal)
      this.createEnemySpecialDonggrami()
      this.createEnemySpecialDonggrami()
      this.createEnemySpecialDonggrami()
      this.createEnemyPartyDonggrami()
    } else if (this.timeCheckInterval(pTime + 30, pTime + 38, 50)) {
      this.createEnemy(ID.enemy.donggramiEnemy.party)
      this.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.createEnemy(ID.enemy.donggramiEnemy.normal)
      this.createEnemy(ID.enemy.donggramiEnemy.normal)
    }

    this.timePauseEnemyCount(pTime + 39, 5)
  }

  roundPhase03Inside () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    // 평균 dps: 90% ~ 110%
    if (this.timeCheckInterval(pTime + 1, pTime + 8, 50)) {
      // 일반 동그라미, 특수 동그라미, 파티 동그라미가 혼합하여 등장
      this.createEnemy(ID.enemy.donggramiEnemy.normal)
      this.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.createEnemyPartyDonggrami()
      this.createEnemyPartyDonggrami()
      this.createEnemySpecialDonggrami()
    } else if (this.timeCheckInterval(pTime + 10, pTime + 24, 25)) {
      this.createEnemy(ID.enemy.donggramiEnemy.talkParty)
      this.createEnemyPartyDonggrami()
    }

    // 엘리베이터 탑승
    this.spriteElevator.process()
    this.timePauseEnemyCount(pTime + 32)
    if (this.timeCheckFrame(pTime + 33)) {
      this.spriteElevator.setDoorOpen(true)
    } else if (this.timeCheckFrame(pTime + 34)) {
      this.changeBackgroundImage(imageSrc.round.round2_4_elevatorHall, 60)
    } else if (this.timeCheckFrame(pTime + 35)) {
      this.spriteElevator.setDoorOpen(false)
    } else if (this.timeCheckFrame(pTime + 36)) {
      this.spriteElevator.setFloorMove(3)
    } else if (this.timeCheckFrame(pTime + 37)) {
      this.spriteElevator.setDoorOpen(true)
    } else if (this.timeCheckFrame(pTime + 38)) {
      this.changeBackgroundImage(imageSrc.round.round2_4_elevatorFloor3, 60)
    } else if (this.timeCheckFrame(pTime + 39)) {
      this.spriteElevator.setDoorOpen(false)
    }
  }

  /** 해당 라운드에서 파티 동그라미 생성 */
  createEnemyPartyDonggrami () {
    let random = Math.floor(Math.random() * 3)
    switch (random) {
      case 0: this.createEnemy(ID.enemy.donggramiEnemy.party); break
      case 1: this.createEnemy(ID.enemy.donggramiEnemy.juice); break
      case 2: this.createEnemy(ID.enemy.donggramiEnemy.fruit); break
    }
  }

  /** 해당 라운드에서 특수 동그라미 생성 */
  createEnemySpecialDonggrami () {
    // 특수 동그라미
    let random = Math.floor(Math.random() * 5)
    switch (random) {
      case 0: this.createEnemy(ID.enemy.donggramiEnemy.emoji); break
      case 1: this.createEnemy(ID.enemy.donggramiEnemy.bounce); break
      case 2: this.createEnemy(ID.enemy.donggramiEnemy.exclamationMark); break
      case 3: this.createEnemy(ID.enemy.donggramiEnemy.questionMark); break
      case 4: this.createEnemy(ID.enemy.donggramiEnemy.speed); break
      default: this.createEnemy(ID.enemy.donggramiEnemy.talk); break
    }
  }

  roundPhase04 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    
    if (this.currentCourseName === this.courseName.INSIDE) {
      if (this.timeCheckInterval(pTime + 1, pTime + 10, 50)) {
        this.createEnemy(ID.enemy.donggramiEnemy.party)
        this.createEnemy(ID.enemy.donggramiEnemy.normal)
        this.createEnemy(ID.enemy.donggramiEnemy.bounce)
        this.createEnemy(ID.enemy.donggramiEnemy.speed)
      } else if (this.timeCheckInterval(pTime + 11, pTime + 15, 25)) {
        this.createEnemy(ID.enemy.donggramiEnemy.exclamationMark)
        this.createEnemy(ID.enemy.donggramiEnemy.questionMark)
        this.createEnemy(ID.enemy.donggramiEnemy.emoji)
      } else if (this.timeCheckInterval(pTime + 16, pTime + 25, 9)) {
        this.createEnemy(ID.enemy.donggramiEnemy.normal)
      }
    } else {
      // 아웃사이드 구간에는 끝 부분에 나무 적이 나옴 (인사이드는 동그라미만 나옴)
      if (this.timeCheckInterval(pTime + 1, pTime + 10, 120)) {
        this.createEnemy(ID.enemy.donggramiEnemy.party)
        this.createEnemy(ID.enemy.donggramiEnemy.tree)
      } else if (this.timeCheckInterval(pTime + 11, pTime + 15, 120)) {
        this.createEnemy(ID.enemy.donggramiEnemy.normal)
        this.createEnemy(ID.enemy.donggramiEnemy.tree)
      } else if (this.timeCheckInterval(pTime + 16, pTime + 25, 90)) {
        this.createEnemy(ID.enemy.donggramiEnemy.tree)
      }
    }

    // 공통 패턴
    // 일시적으로 도망쳐를 외치는 동그라미가 등장함
    if (this.timeCheckInterval(pTime + 31, pTime + 36, 40)) {
      this.createEnemy(ID.enemy.donggramiEnemy.talkRunawayR2_4, 900)
    }

    // 적 제거가 2번 발동되는 이유는, 나무가 죽으면서 또다른 적들을 소환하기 때문
    if (this.timeCheckFrame(pTime + 37) || this.timeCheckFrame(pTime + 38)) {
      let enemy = this.getEnemyObject()
      for (let i = 0; i < enemy.length; i++) {
        let e = enemy[i]
        if (e.id !== ID.enemy.donggramiEnemy.leaf && e.id !== ID.enemy.donggramiEnemy.tree) {
          e.setMoveSpeed(9, 0)
          e.setMoveDirection(FieldData.direction.LEFT, '')
          e.isPossibleExit = true
          e.isExitToReset = false
        } else {
          e.requestDie()
        }
      }
    }

    // 만약 적이 남아있다면 모든 적을 삭제함
    if (this.timeCheckFrame(pTime + 39)) {
      fieldState.allEnemyDelete()
    }

    // 음악 페이드 아웃 및 정지
    if (this.timeCheckFrame(pTime + 37)) {
      this.musicChange('', 1)
    } else if (this.timeCheckFrame(pTime + 38)) {
      this.musicStop()
    }
  }

  roundPhase05 () {
    if (this.currentCourseName === this.courseName.INSIDE) {
      this.roundPhase05Inside()
    } else {
      this.roundPhase05Outside()
    }
  }

  roundPhase05Inside () {
    // 필드 물량전 (아웃사이드와는 조금 다름)
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.timeCheckFrame(pTime + 1)) {
      this.soundPlay(soundSrc.round.r2_4_message1)
      this.musicChange(soundSrc.music.music13_round2_4_jemu)
      this.musicPlay()
    } else if (this.timeCheckFrame(pTime + 38)) {
      this.musicStop()
    }

    // 획득 경험치 비율을 조정하기 위해 적 수를 증가시킴
    if (this.timeCheckInterval(pTime + 1, pTime + 10, 12)) {
      this.createEnemy(ID.enemy.intruder.square)
    } else if (this.timeCheckInterval(pTime + 11, pTime + 36, 10)) {
      this.createEnemy(ID.enemy.intruder.square)
    }
    
    this.timePauseEnemyCount(pTime + 38)

    // outside코스와의 점수를 보정하기 위해 일정 점수를 추가함
    if (this.timeCheckFrame(pTime + 39)) {
      fieldSystem.requestAddScore(4500)
    }
  }

  roundPhase05Outside () {
    // 보스전 진행
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.timeCheckFrame(pTime + 1)) {
      this.createEnemy(ID.enemy.intruder.jemuBoss)
      this.soundPlay(soundSrc.round.r2_4_message1)
      this.musicChange(soundSrc.music.music13_round2_4_jemu)
      this.musicPlay()
    } else if (this.timeCheckFrame(pTime + 38)) {
      this.musicStop()
    }

    this.timePauseEnemyCount(pTime + 39)

    if (this.timeCheckInterval(pTime + 30, pTime + 36) && this.getEnemyCount() <= 0) {
      this.setCurrentTime(pTime + 37)
    }
  }

  roundPhase06 () {
    this.spriteElevator.process()
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.currentCourseName === this.courseName.INSIDE) {
      if (this.timeCheckFrame(pTime + 5)) {
        this.spriteElevator.setFloorPosition(3)
      } else if (this.timeCheckFrame(pTime + 15)) {
        this.changeBackgroundImage(imageSrc.round.round2_4_elevatorFloor3)
        this.spriteElevator.setDoorOpen(true)
      } else if (this.timeCheckFrame(pTime + 16)) {
        this.changeBackgroundImage(imageSrc.round.round2_4_elevatorHall, 60)
      } else if (this.timeCheckFrame(pTime + 17)) {
        this.spriteElevator.setDoorOpen(false)
      } else if (this.timeCheckFrame(pTime + 18)) {
        this.spriteElevator.setFloorMove(-1)
      } else if (this.timeCheckFrame(pTime + 22)) {
        this.spriteElevator.setDoorOpen(true)
      } else if (this.timeCheckFrame(pTime + 23)) {
        this.changeBackgroundImage(imageSrc.round.round2_4_floorB1, 60)
      } else if (this.timeCheckFrame(pTime + 24)) {
        this.spriteElevator.setDoorOpen(false)
      }
    } else {
      if (this.timeCheckFrame(pTime + 10)) {
        this.spriteElevator.setFloorPosition(1)
      } else if (this.timeCheckFrame(pTime + 17)) {
        this.changeBackgroundImage(imageSrc.round.round2_4_elevatorOutside)
        this.spriteElevator.setDoorOpen(true)
      } else if (this.timeCheckFrame(pTime + 18)) {
        this.changeBackgroundImage(imageSrc.round.round2_4_elevatorHall, 60)
      } else if (this.timeCheckFrame(pTime + 19)) {
        this.spriteElevator.setDoorOpen(false)
      } else if (this.timeCheckFrame(pTime + 20)) {
        this.spriteElevator.setFloorMove(-1)
      } else if (this.timeCheckFrame(pTime + 22)) {
        this.spriteElevator.setDoorOpen(true)
      } else if (this.timeCheckFrame(pTime + 23)) {
        this.changeBackgroundImage(imageSrc.round.round2_4_floorB1, 60)
      } else if (this.timeCheckFrame(pTime + 24)) {
        this.spriteElevator.setDoorOpen(false)
      }
    }
  }

  processDebug () {
    // 디버그할 때 코스 선택을 고려해주세요
    // if (this.timeCheckFrame(0, 1)) {
    //   this.currentTime = this.phaseTime[5].startTime + 0
    //   this.currentCourseName = this.courseName.INSIDE
    // }
  }

  processBackground () {
    // 매 페이즈 시작마다 배경위치는 리셋됩니다.
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.timeCheckFrame(pTime + 0)) {
      this.backgroundAbsoluteX = 0
      this.backgroundAbsoluteY = 0
    }

    super.processBackground()
    let currentPhase = this.getCurrentPhase()
    switch (currentPhase) {
      case 0: this.processBackgroundPhase00NoMove(); break
      case 1: this.processBackgroundPhase01Corridor(); break
      case 2: this.processBackgroundPhase02Right(); break
      case 3: this.processBackgroundPhase03(); break
      case 4: this.processBackgroundPhase04(); break
      case 5: this.processBackgroundPhase00NoMove(); break
      case 6: this.processBackgroundPhase06(); break
    }

    // 배경 절대값 좌표를 실제 사용하는 좌표에 대입
    this.backgroundX = this.backgroundAbsoluteX
    this.backgroundY = this.backgroundAbsoluteY
  }

  processBackgroundPhase00NoMove () {
    this.backgroundSpeedX = 0
    this.backgroundSpeedY = 0
    this.backgroundAbsoluteX = 0
    this.backgroundAbsoluteY = 0
  }

  processBackgroundPhase01Corridor () {
    // 엘리베이터로 이동하는 과정
    // 참고: 배경은 루프되기 때문에, 도착 지점(800, 0)상 배경 자체는 자연스럽게 보입니다.
    // 따라서 페이즈에서 배경 전환만 하고, 여기서는 좌표만 이동하거나 고정합니다.
    // 페이즈 시간 +0 ~ +7 동안만 스크롤을 진행하고, 그 다음 좌표값이 기준을 넘어가면 배경을 다음 배경으로 교체해
    // 자연스럽게 엘리베이터 배경이 전환되도록 했습니다.
    let pTime = this.phaseTime[1].startTime
    if (this.timeCheckInterval(pTime + 0, pTime + 7)) {
      if (this.currentCourseName === this.courseName.OUTSIDE) {
        if (this.backgroundAbsoluteX > -graphicSystem.CANVAS_WIDTH) {
          this.backgroundAbsoluteX -= 2
  
          // 자연스러운 배경 전환을 위해 배경 그림을 자동으로 변경 (스크롤이 끝나면 배경 전환이 이루어져야 함)
          if (this.backgroundAbsoluteX <= graphicSystem.CANVAS_WIDTH) {
            this.changeBackgroundImage(imageSrc.round.round2_4_elevatorFloor1)
          }
        } else {
          this.backgroundAbsoluteX = -graphicSystem.CANVAS_WIDTH
        }
      } else if (this.currentCourseName === this.courseName.INSIDE) {
        if (this.backgroundAbsoluteX < graphicSystem.CANVAS_WIDTH) {
          this.backgroundAbsoluteX += 2
  
          // 자연스러운 배경 전환을 위해 배경 그림을 자동으로 변경 (스크롤이 끝나면 배경 전환이 이루어져야 함)
          if (this.backgroundAbsoluteX >= graphicSystem.CANVAS_WIDTH) {
            this.changeBackgroundImage(imageSrc.round.round2_4_elevatorFloor1)
          }
        } else {
          this.backgroundAbsoluteX = graphicSystem.CANVAS_WIDTH
        }
      }
    } else {
      this.processBackgroundPhase00NoMove()
    }

    // 엘리베이터 좌표 설정 (엘리베이터는 배경 0, 0 기준으로 200, 100에 위치함)
    if (this.backgroundAbsoluteX < 0) {
      this.spriteElevator.x = -graphicSystem.CANVAS_WIDTH + this.spriteElevator.BASE_X + -this.backgroundAbsoluteX
    } else if (this.backgroundAbsoluteX > 0) {
      this.spriteElevator.x = graphicSystem.CANVAS_WIDTH + this.spriteElevator.BASE_X + -this.backgroundAbsoluteX
    } else {
      this.spriteElevator.x = this.spriteElevator.BASE_X
    }

    this.spriteElevator.y = this.spriteElevator.BASE_Y
  }

  processBackgroundPhase02Right () {
    if (this.backgroundAbsoluteX < graphicSystem.CANVAS_WIDTH * 3) {
      this.backgroundAbsoluteX++
    } else {
      this.backgroundAbsoluteX = graphicSystem.CANVAS_WIDTH * 3
    }

    // 엘리베이터 좌표 설정
    this.spriteElevator.x = this.spriteElevator.BASE_X - this.backgroundAbsoluteX
    this.spriteElevator.y = this.spriteElevator.BASE_Y
  }

  processBackgroundPhase03 () {
    if (this.currentCourseName === this.courseName.INSIDE) {
      // 왼쪽 이동
      if (this.backgroundAbsoluteX < graphicSystem.CANVAS_WIDTH * 2) {
        this.backgroundAbsoluteX++
      } else {
        this.backgroundAbsoluteX = graphicSystem.CANVAS_WIDTH * 2
      }

      // 엘리베이터 좌표 설정 (이번엔 마지막 배경에서 엘리베이터가 등장합니다.)
      this.spriteElevator.x = this.spriteElevator.BASE_X - this.backgroundAbsoluteX + (graphicSystem.CANVAS_WIDTH * 2)
      this.spriteElevator.y = this.spriteElevator.BASE_Y
    } else {
      this.processBackgroundPhase02Right()
    }
  }

  processBackgroundPhase04 () {
    if (this.currentCourseName === this.courseName.INSIDE) {
      // 왼쪽 이동
      if (this.backgroundAbsoluteX > -graphicSystem.CANVAS_WIDTH * 3) {
        this.backgroundAbsoluteX--
      } else {
        this.backgroundAbsoluteX = -graphicSystem.CANVAS_WIDTH * 3
      }

      // 엘리베이터 좌표 설정
      this.spriteElevator.x = this.spriteElevator.BASE_X - this.backgroundAbsoluteX
      this.spriteElevator.y = this.spriteElevator.BASE_Y
    } else {
      this.processBackgroundPhase02Right()
    }
  }

  processBackgroundPhase06 () {
    if (this.currentCourseName === this.courseName.INSIDE) {
      const pTime = this.phaseTime[this.getCurrentPhase()].startTime
      if (this.timeCheckInterval(pTime + 0, pTime + 15)) {
        if (this.backgroundAbsoluteX < graphicSystem.CANVAS_WIDTH * 3) {
          this.backgroundAbsoluteX += 3
        } else {
          this.backgroundAbsoluteX = graphicSystem.CANVAS_WIDTH * 3
        }
      }

      // 엘리베이터 좌표 설정 (엘리베이터는 배경 0, 0 기준으로 200, 100에 위치함)
      // 이 시점에서의 배경 기준 위치는 1600, 0이므로 그에 맞춰서 +200, +100 해야함
      this.spriteElevator.x = (graphicSystem.CANVAS_WIDTH * 3) -this.backgroundAbsoluteX + this.spriteElevator.BASE_X
      this.spriteElevator.y = this.spriteElevator.BASE_Y
    } else {
      const gHeightx2 = graphicSystem.CANVAS_HEIGHT * 2
      if (this.backgroundAbsoluteY < gHeightx2) {
        this.backgroundAbsoluteY += 2
      } else if (this.backgroundAbsoluteY === gHeightx2 && this.backgroundAbsoluteX > -graphicSystem.CANVAS_WIDTH) {
        this.backgroundAbsoluteY = gHeightx2
        this.backgroundAbsoluteX -= 2
      } else if (this.backgroundAbsoluteY === gHeightx2 && this.backgroundAbsoluteX === -graphicSystem.CANVAS_WIDTH) {
        this.backgroundAbsoluteY = gHeightx2
        this.backgroundAbsoluteX = -graphicSystem.CANVAS_WIDTH
      }

      // 엘리베이터 좌표 설정 (엘리베이터는 배경 0, 0 기준으로 200, 100에 위치함)
      // 이 시점에서의 배경 기준 위치는 -800, 1200이므로 그에 맞춰서 +200, +100 해야함
      this.spriteElevator.x = (-this.backgroundAbsoluteX - graphicSystem.CANVAS_WIDTH) + this.spriteElevator.BASE_X
      this.spriteElevator.y = (graphicSystem.CANVAS_HEIGHT * 2) - this.backgroundAbsoluteY + this.spriteElevator.BASE_Y
    }
  }


  displayBackground () {
    // 기본 배경 출력 (모든 페이즈에서 이 함수를 사용하지 않기 때문에, 이 코드는 주석처리되었습니다.)
    // super.displayBackground()

    // 배경 지정 방식
    let currentPhase = this.getCurrentPhase()
    switch (currentPhase) {
      case 0: this.displayPhase00(); break
      case 1: this.displayPhase01(); break
      case 2: this.displayPhase02(); break
      case 3: this.displayPhase03(); break
      case 4: this.displayPhase04(); break
      case 5: this.displayPhase05(); break
      case 6: this.displayPhase06(); break
    }
  }

  displayPhase00 () {
    super.displayBackground()
    graphicSystem.imageView(imageSrc.round.round2_4_courseSelect, 0, 0)
  }

  displayPhase01 () {
    // graphicSystem.imageView(imageSrc.round.round2_4_firstArea, 0 - this.backgroundX, this.backgroundY)
    // 배경은 계속 무한루프되므로, 엘리베이터 구간만 따로 겹쳐쓰면 됩니다.
    // 첫번째 겹쳐쓰는 위치는 -800, 0 위치이고, 두번째는 +800, 0 위치입니다.
    // 이로써 실제 출력되는 형태는 [엘리베이터, 배경(기본 출력), 엘리베이터]
    // 실시간으로 배경 상태를 간접적으로 저장해야 하기 때문에, 임시 배경 저장 값을 추가로 사용합니다.
    const pTime = this.phaseTime[1].startTime
    if (this.timeCheckInterval(pTime + 0, pTime + 7)) {
      graphicSystem.imageView(imageSrc.round.round2_4_elevatorFloor1, -800 + (-this.backgroundAbsoluteX), 0)
      graphicSystem.imageView(imageSrc.round.round2_4_corridor, 0 - this.backgroundAbsoluteX, 0)
      graphicSystem.imageView(imageSrc.round.round2_4_elevatorFloor1, 800 + (-this.backgroundAbsoluteX), 0)
    } else {
      graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
      super.displayBackground()
    }

    this.spriteElevator.display()
  }

  displayPhase02 () {
    // 배경 이미지 구조 (총 40초 구간)
    // 인사이드: 엘리베이터4층 - 파티 - 파티 - 하늘
    // 아웃사이드: 엘리베이터옥상 - 옥상 - 옥상 - 옥상 
    let mapList = this.currentCourseName === this.courseName.INSIDE ? [
      imageSrc.round.round2_4_elevatorFloor4,
      imageSrc.round.round2_4_roomYellow,
      imageSrc.round.round2_4_roomParty,
      imageSrc.round.round2_4_roomParty,
    ] : [
      imageSrc.round.round2_4_elevatorRooftop,
      imageSrc.round.round2_4_rooftop,
      imageSrc.round.round2_4_rooftop,
      imageSrc.round.round2_4_rooftop
    ]

    const gWidth = graphicSystem.CANVAS_WIDTH
    let mapNumber = Math.round(this.backgroundAbsoluteX / 800)
    if (mapNumber >= mapList.length) mapNumber = mapList.length - 1

    // 배경은 총 3장이 출력됩니다. [왼쪽, 가운데, 오른쪽]
    graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
    if (mapNumber !== 0) graphicSystem.imageView(mapList[mapNumber - 1], (gWidth * (mapNumber - 1)) - this.backgroundAbsoluteX, 0)
    graphicSystem.imageView(mapList[mapNumber + 0], (gWidth * mapNumber) - this.backgroundAbsoluteX, 0)
    graphicSystem.imageView(mapList[mapNumber + 1], (gWidth * (mapNumber + 1)) - this.backgroundAbsoluteX, 0)

    if (this.backgroundAbsoluteX <= graphicSystem.CANVAS_WIDTH) {
      this.spriteElevator.display()
    }
  }

  displayPhase03 () {
    // 배경 이미지 구조 (총 40초 구간)
    // 인사이드: 하늘 - 하늘 - 엘리베이터 4층 - 엘리베이터 3층
    // 아웃사이드: 옥상 - 옥상 나가는 길 - 옥상 나가는 길 - 산길
    let mapList = this.currentCourseName === this.courseName.INSIDE ? [
      imageSrc.round.round2_4_roomParty,
      imageSrc.round.round2_4_roomYellow,
      imageSrc.round.round2_4_elevatorFloor4,
      imageSrc.round.round2_4_roomYellow,
    ] : [
      imageSrc.round.round2_4_rooftop,
      imageSrc.round.round2_4_rooftopWayout,
      imageSrc.round.round2_4_rooftopWayout,
      imageSrc.round.round2_4_mountainRooftop
    ]

    const gWidth = graphicSystem.CANVAS_WIDTH
    let mapNumber = Math.floor(this.backgroundAbsoluteX / 800)
    if (mapNumber >= mapList.length) mapNumber = mapList.length - 1

    if (this.currentCourseName === this.courseName.INSIDE && mapNumber === 2) {
      super.displayBackground()
    } else {
      // 배경은 총 3장이 출력됩니다. [왼쪽, 가운데, 오른쪽]
      graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
      if (mapNumber !== 0) graphicSystem.imageView(mapList[mapNumber - 1], (gWidth * (mapNumber - 1)) - this.backgroundAbsoluteX, 0)
      graphicSystem.imageView(mapList[mapNumber + 0], (gWidth * mapNumber) - this.backgroundAbsoluteX, 0)
      graphicSystem.imageView(mapList[mapNumber + 1], (gWidth * (mapNumber + 1)) - this.backgroundAbsoluteX, 0)
    }

    if (this.currentCourseName === this.courseName.INSIDE) {
      this.spriteElevator.display()
    }
  }

  displayPhase04 () {
    // 배경 이미지 구조 (총 40초 구간)
    // 인사이드: 엘리베이터 3층 - 노란색 - 노란색 - 하늘색 (단, 왼쪽으로 이동)
    // 아웃사이드: 산길 - 산길 - 깊은산길 - 산길 우회로
    let mapList = this.currentCourseName === this.courseName.INSIDE ? [
      imageSrc.round.round2_4_elevatorFloor3,
      imageSrc.round.round2_4_roomBlue,
      imageSrc.round.round2_4_roomBlue,
      imageSrc.round.round2_4_roomSky,
    ] : [
      imageSrc.round.round2_4_mountainRooftop,
      imageSrc.round.round2_4_mountainDeep,
      imageSrc.round.round2_4_mountainDeep,
      imageSrc.round.round2_4_mountainPath
    ]

    const gWidth = graphicSystem.CANVAS_WIDTH
    let mapNumber = Math.abs(Math.round(this.backgroundAbsoluteX / 800))
    if (mapNumber >= mapList.length) mapNumber = mapList.length - 1

    if (this.currentCourseName === this.courseName.INSIDE) {
      // 배경은 총 3장이 출력됩니다. [왼쪽, 가운데, 오른쪽]
      // 다만 방향이 아웃사이드와는 다르게 왼쪽으로 이동합니다.
      graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
      if (mapNumber !== 0) graphicSystem.imageView(mapList[mapNumber - 1], (-gWidth * (mapNumber - 1)) - this.backgroundAbsoluteX, 0)
      graphicSystem.imageView(mapList[mapNumber + 0], (-gWidth * mapNumber) - this.backgroundAbsoluteX, 0)
      graphicSystem.imageView(mapList[mapNumber + 1], (-gWidth * (mapNumber + 1)) - this.backgroundAbsoluteX, 0)

      // 배경 출력 후 엘리베이터 출력
      if (this.backgroundAbsoluteX >= -graphicSystem.CANVAS_WIDTH) {
        this.spriteElevator.display()
      }
    } else {
      // 배경은 총 3장이 출력됩니다. [왼쪽, 가운데, 오른쪽]
      graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
      if (mapNumber !== 0) graphicSystem.imageView(mapList[mapNumber - 1], (gWidth * (mapNumber - 1)) - this.backgroundAbsoluteX, 0)
      graphicSystem.imageView(mapList[mapNumber + 0], (gWidth * mapNumber) - this.backgroundAbsoluteX, 0)
      graphicSystem.imageView(mapList[mapNumber + 1], (gWidth * (mapNumber + 1)) - this.backgroundAbsoluteX, 0)
    }
  }

  displayPhase05 () {
    // 적이 존재하면 배경 그라디언트가 변경됨
    if (this.getEnemyCount() === 0) {
      graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
    } else {
      graphicSystem.gradientRect(0, 0, 800, 600, ['#1F1C2C', '#928DAB'])
    }
    
    if (this.currentCourseName === this.courseName.INSIDE) {
      graphicSystem.imageView(imageSrc.round.round2_4_roomSky, 0, 0)
    } else {
      this.showBossHp()
      graphicSystem.imageView(imageSrc.round.round2_4_mountainPath, 0, 0)
    }
  }

  displayPhase06 () {
    const gHeight = graphicSystem.CANVAS_HEIGHT
    const gWidth = graphicSystem.CANVAS_WIDTH
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.currentCourseName === this.courseName.INSIDE) {
      if (this.timeCheckInterval(pTime + 0, pTime + 14)) {
        graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
        graphicSystem.imageView(imageSrc.round.round2_4_roomSky, (gWidth * 0) - this.backgroundAbsoluteX, 0)
        graphicSystem.imageView(imageSrc.round.round2_4_roomBlue, (gWidth * 1) - this.backgroundAbsoluteX, 0)
        graphicSystem.imageView(imageSrc.round.round2_4_roomBlue, (gWidth * 2) - this.backgroundAbsoluteX, 0)
        graphicSystem.imageView(imageSrc.round.round2_4_elevatorFloor3, (gWidth * 3) - this.backgroundAbsoluteX, 0)
      } else {
        graphicSystem.gradientRect(0, 0, 800, 600, ['#141519', '#171d40'])
        super.displayBackground()
      }
    } else {
      if (this.timeCheckInterval(pTime + 0, pTime + 17)) {
        graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
        graphicSystem.imageView(imageSrc.round.round2_4_mountainPath, 0, (gHeight * 0) - this.backgroundAbsoluteY)
        graphicSystem.imageView(imageSrc.round.round2_4_mountainWall, 0, (gHeight * 1) - this.backgroundAbsoluteY)
        graphicSystem.imageView(imageSrc.round.round2_4_placard, (gWidth * 0) - this.backgroundAbsoluteX, (gHeight * 2) - this.backgroundAbsoluteY)
        graphicSystem.imageView(imageSrc.round.round2_4_elevatorOutside, -(gWidth * 1) - this.backgroundAbsoluteX, (gHeight * 2) - this.backgroundAbsoluteY)
      } else {
        graphicSystem.gradientRect(0, 0, 800, 600, ['#141519', '#171d40'])
        super.displayBackground()
      }
    }

    this.spriteElevator.display()
  }

  static createSpriteElevator () {
    class ElevatorSprite extends FieldData {
      constructor () {
        super()
        this.setAutoImageData(imageSrc.round.round2_4_elevator, imageDataInfo.round2_4_elevator.elevatorClose)
        this.setWidthHeight(400, 400)
        this.openEnimation = EnimationData.createEnimation(imageSrc.round.round2_4_elevator, imageDataInfo.round2_4_elevator.elevatorOpening, 4, 1)
        this.openEnimation.outputWidth = this.width
        this.openEnimation.outputHeight = this.height
        this.closeEnimation = EnimationData.createEnimation(imageSrc.round.round2_4_elevator, imageDataInfo.round2_4_elevator.elevatorClosing, 4, 1)
        this.closeEnimation.outputWidth = this.width
        this.closeEnimation.outputHeight = this.height

        this.floorArrive = 1
        this.isFloorMove = false
        this.floor = 1

        this.arrowUpEnimation = EnimationData.createEnimation(imageSrc.round.round2_4_elevatorNumber, imageDataInfo.round2_4_elevator.numberUpRun, 7, -1)
        this.arrowDownEnimation = EnimationData.createEnimation(imageSrc.round.round2_4_elevatorNumber, imageDataInfo.round2_4_elevator.numberDownRun, 7, -1)
        this.floorDelay = new DelayData(60)

        this.STATE_CLOSE = 'close'
        this.STATE_CLOSEING = 'closing'
        this.STATE_OPEN = 'open'
        this.STATE_OPENING = 'opening'
        this.stateDelay = new DelayData(36) // 4 * 9 frame enimation
        this.state = this.STATE_CLOSE

        /** 엘리베이터의 기본 출력 좌표값 */ this.BASE_X = 200
        /** 엘리베이터의 기본 출력 좌표값 */ this.BASE_Y = 100
      }

      process () {
        super.process()
        this.processFloor()
        this.processDoor()
      }

      processEnimation () {
        if (this.isFloorMove) {
          this.arrowUpEnimation.process()
          this.arrowDownEnimation.process()
        } else {
          this.arrowUpEnimation.reset()
          this.arrowDownEnimation.reset()
        }

        // 이미지 출력을 확실하게 하기 위하여 에니메이션 프로세스는 강제로 재생됩니다.
        // 해당 프로세스를 사용하지 않으면 이미지 로딩 문제로 이미지가 제대로 출력되지 않는 버그가 있습니다.
        this.closeEnimation.process()
        this.openEnimation.process()
      }

      processDoor () {
        // 닫혀있거나 열려있는 상태에서는, 깅제로 에니메이션 프레임을 조절해서 스프라이트를 출력하도록 처리
        if (this.state === this.STATE_OPEN) {
          this.openEnimation.elapsedFrame = 0
        } else if (this.state === this.STATE_CLOSE) {
          this.closeEnimation.elapsedFrame = 0
        }

        // 일정 시간이 지난 후에는 문이 열려있거나 닫혀있는것을 유지시킵니다.
        if (this.state === this.STATE_OPENING && this.stateDelay.check()) {
          this.state = this.STATE_OPEN
        } else if (this.state === this.STATE_CLOSEING && this.stateDelay.check()) {
          this.state = this.STATE_CLOSE
        }
      }

      processFloor () {
        if (!this.isFloorMove) return

        if (this.floorDelay.count === 0) {
          soundSystem.play(soundSrc.round.r2_4_elevatorMove)
        }

        if (this.floorDelay.check()) {
          if (this.floor < this.floorArrive) {
            this.floor++
            if (this.floor === 0) this.floor = 1
          } else if (this.floor > this.floorArrive) {
            this.floor--
            if (this.floor === 0) this.floor = -1
          }

          if (this.floor === this.floorArrive) {
            this.isFloorMove = false
            soundSystem.play(soundSrc.round.r2_4_elevatorFloor)
          }
        }
      }

      /** 이동할 층을 설정합니다. -1 부터 5까지 가능, 0층은 무시됨, 단 엘리베이터가 닫혀있어야만 사용 가능 */
      setFloorMove (floorArrive = 1) {
        if (this.state !== this.STATE_CLOSE) return

        if (floorArrive !== 0 && floorArrive >= -1 && floorArrive <= 5) {
          this.isFloorMove = true
          this.floorArrive = floorArrive
        }
      }

      /** 엘리베이터의 층의 기본 위치를 설정합니다. -1 부터 5까지 가능, 0층은 무시됨, */
      setFloorPosition (floor = 1) {
        this.floor = floor
      }

      display () {
        this.displayNumber()
        this.displayDoor()
      }

      displayNumber () {
        const displayAreaX = this.x + 100
        const displayAreaY = this.y - 50
        const numberPositionXMinusB = displayAreaX + 50
        const numberPositionX = displayAreaX + 100
        const numberPositionY = displayAreaY + 5
        const numberPositionArrowX = displayAreaX + 150

        let imgDbase = imageDataInfo.round2_4_elevator
        let imgD = imgDbase.number1
        let imgBg = imgDbase.numberScreen
        // 전체 층수는 B1 ~ 5층까지 있으므로, 2 ~ 5사이만 숫자를 변경하고 나머지는 그대로 둠
        // number가 0인경우는 1층으로 가정함.
        switch (this.floor) {
          case 2: imgD = imgDbase.number2; break
          case 3: imgD = imgDbase.number3; break
          case 4: imgD = imgDbase.number4; break
          case 5: imgD = imgDbase.number5; break
        }

        // 배경 및 숫자 표시
        if (imgD == null) return
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevatorNumber, imgBg.x, imgBg.y, imgBg.width, imgBg.height, displayAreaX, displayAreaY, imgBg.width, imgBg.height)
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevatorNumber, imgD.x, imgD.y, imgD.width, imgD.height, numberPositionX, numberPositionY, imgD.width, imgD.height)
        if (this.floor < 0) { // B 출력
          imgD = imgDbase.numberB
          graphicSystem.imageDisplay(imageSrc.round.round2_4_elevatorNumber, imgD.x, imgD.y, imgD.width, imgD.height, numberPositionXMinusB, numberPositionY, imgD.width, imgD.height)
        }

        // 화살표 표시
        if (this.floor < this.floorArrive) {
          this.arrowUpEnimation.display(numberPositionArrowX, numberPositionY)
        } else if (this.floor > this.floorArrive) {
          this.arrowDownEnimation.display(numberPositionArrowX, numberPositionY)
        }
      }

      displayDoor () {
        // hall image 덧씌우기 (엘리베이터 내부 배경 출력)
        let imgD = imageDataInfo.round2_4_elevator.elevatorHall
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevator, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, this.width, this.height)

        switch (this.state) {
          case this.STATE_OPEN: this.displayDoorOpen(); break
          case this.STATE_OPENING: this.openEnimation.display(this.x, this.y); break
          case this.STATE_CLOSE: this.displayDoorClose(); break
          case this.STATE_CLOSEING: this.closeEnimation.display(this.x, this.y); break
        }
      }

      displayDoorOpen () {
        let imgD = imageDataInfo.round2_4_elevator.elevatorOpen
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevator, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, this.width, this.height)
      }

      displayDoorClose () {
        let imgD = imageDataInfo.round2_4_elevator.elevatorClose
        graphicSystem.imageDisplay(imageSrc.round.round2_4_elevator, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, this.width, this.height)
      }

      /**
       * 엘리베이터를 열거나 닫습니다.
       * 
       * 주의: 열리는 중이거나, 닫히는 중인경우에는 이 함수를 사용해도 동작하지 않습니다. 기다렸다가 다시 설정해 주세요.
       * @param {boolean} isOpen 이 값이 true면 open, false면 close
       */
      setDoorOpen (isOpen = true) {
        if (isOpen && this.state === this.STATE_CLOSE) {
          this.state = this.STATE_OPENING
          soundSystem.play(soundSrc.round.r2_4_elevatorDoorOpen)
          this.openEnimation.reset()
        } else if (!isOpen && this.state === this.STATE_OPEN){
          this.state = this.STATE_CLOSEING
          soundSystem.play(soundSrc.round.r2_4_elevatorDoorClose)
          this.closeEnimation.reset()
        }
      }
    }

    return new ElevatorSprite()
  }
}

class Round2_5 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round2_5)
    this.backgroundImageSrc = imageSrc.round.round2_5_floorB1Light
    this.backgroundSpeedX = 0

    // 타입 지정용 임시 클래스 (자동완성 목적)
    class SpriteDonggrami extends this.SpriteDonggrami {}
    class SpriteIntruder extends this.SpriteIntruder {}
    /** @type {SpriteDonggrami[]} */ this.spriteDonggrami = []
    /** @type {SpriteIntruder[]} */ this.spriteIntruder = []

    this.addRoundPhase(this.roundPhase00, 0, 60)
    this.addRoundPhase(this.roundPhase01, 61, 90)
    this.addRoundPhase(this.roundPhase02, 91, 120)
    this.addRoundPhase(this.roundPhase03, 121, 150)
    this.addRoundPhase(this.roundPhase04, 151, 190)
    this.addRoundPhase(this.roundPhase05, 191, 197)

    this.addLoadingImageList([
      imageSrc.round.round2_5_floorB1Light,
      imageSrc.round.round2_5_floorB1Dark,
      imageSrc.round.round2_5_floorB1Break,
    ])

    this.addLoadingSoundList([
      soundSrc.round.r2_5_start,
      soundSrc.round.r2_5_breakRoom,
      soundSrc.music.music14_intruder_battle,
      soundSrc.round.r2_4_message1,
      soundSrc.round.r2_3_a1_toyHammer
    ])

    this.addLoadingImageList(RoundPackLoad.getRound2ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound2ShareSound())

    this.customRoomBreakEffect = new CustomEffect(imageSrc.enemyDie.effectList, imageDataInfo.enemyDieEffectList.squareRed, 400, 400, 2, 3)
  }

  SpriteDonggrami = class extends FieldData {
    constructor () {
      super()
      this.BASEDPS = 5000
      this.color = 'red'
      this.setRandomColor()
      this.setDonggramiColor()
      this.setRandomMoveSpeed(6, 6)
      this.moveDelay = new DelayData(60)
      this.attackDelay = new DelayData(30)
      this.hpMax = this.BASEDPS * 12
      this.hp = this.hpMax
      this.attack = this.BASEDPS
      this.dieAfterDelay = new DelayData(60)
      this.x = 0
      this.y = Math.random() * graphicSystem.CANVAS_HEIGHT

      this.getTargetAndSetSpeed()
    }

    getTargetAndSetSpeed () {
      let enemy = fieldState.getRandomEnemyObject()
      if (enemy != null) {
        let distanceX = enemy.x - this.x
        let distanceY = enemy.y - this.y

        this.setMoveSpeed(distanceX / 55, distanceY / 55)
      }
    }

    setRandomColor () {
      let random = Math.floor(Math.random() * 6)
      switch (random) {
        case 0: this.color = 'green'; break
        case 1: this.color = 'blue'; break
        case 2: this.color = 'orange'; break
        case 3: this.color = 'yellow'; break
        case 4: this.color = 'purple'; break
        default: this.color = 'red'; break
      }
    }

    /** 동그라미의 색에 따른 이미지 데이터 설정*/
    setDonggramiColor () {
      switch (this.color) {
        case 'red': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.red); break
        case 'blue': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.blue); break
        case 'green': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.green); break
        case 'orange': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.orange); break
        case 'purple': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.purple); break
        case 'yellow': this.setAutoImageData(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.yellow); break
      }
    }

    /** 동그라미의 스탯을 설정 (이것은 자동 저장된 데이터를 불러올때만 사용합니다.) */
    setLoadDonggramiStat (color = '', x = 0, y = 0, moveSpeedX = 0, moveSpeedY = 0, hp = 0) {
      this.color = color
      this.x = x
      this.y = y
      this.moveSpeedX = moveSpeedX
      this.moveSpeedY = moveSpeedY
      this.hp = hp
      this.setDonggramiColor()
    }

    /** 동그라미가 가지고 있는 스탯값을 저장 */
    getSaveDonggramiData () {
      return {x: this.x, y: this.y, color: this.color, hp: this.hp, moveSpeedX: this.moveSpeedX, moveSpeedY: this.moveSpeedY}
    }

    processState () {
      if (this.isDied) {
        this.y += 10
        if (this.dieAfterDelay.check()) {
          this.isDeleted = true
        }
      }
    }

    processMove () {
      if (this.isDied) return

      super.processMove()

      if (this.moveDelay.check()) {
        this.getTargetAndSetSpeed()
      }

      // 화면 바깥 이동 금지
      if (this.outAreaCheck(0)) {
        if (this.x + this.width <= 0) this.x = 1
        if (this.x >= graphicSystem.CANVAS_WIDTH) this.x = graphicSystem.CANVAS_WIDTH - 1
        if (this.y + this.height <= 0) this.y = 1
        if (this.y >= graphicSystem.CANVAS_HEIGHT) this.y = graphicSystem.CANVAS_HEIGHT - 1

        this.moveSpeedX *= -1
        this.moveSpeedY *= -1
      }

      // 충돌 처리 (딜레이카운트는 적에게 충돌했을때에만 0으로 리셋됩니다.)
      if (this.attackDelay.check(false, true)) {
        let enemyObject = fieldState.getEnemyObject()
        for (let i = 0; i < enemyObject.length; i++) {
          let enemy = enemyObject[i]
          if (!enemy.isDied && collision(this, enemy)) {
            enemy.hp -= this.attack
            this.hp -= this.attack
            this.attackDelay.count = 0
            this.moveSpeedX *= -1
            this.moveSpeedY *= -1
            this.moveDelay.count = this.moveDelay.delay / 2
            soundSystem.play(soundSrc.round.r2_3_a1_toyHammer)
            fieldState.createDamageObject(enemy.x, enemy.y, this.attack)
            break // 반복문 종료 (1회 공격에 1마리만 공격 가능)
          }
        }
      }

      // 적의 총알 대신 맞기 처리
      let enemyBulletObject = fieldState.getEnemyBulletObject()
      for (let i = 0; i < enemyBulletObject.length; i++) {
        let enemyBullet = enemyBulletObject[i]
        if (collision(this, enemyBullet)) {
          this.hp -= (this.attack / 10)
          enemyBullet.isDeleted = true
        }
      }

      // 죽음 처리
      if (this.hp <= 0) {
        soundSystem.play(soundSrc.enemyDie.enemyDieDonggrami)
        this.isDied = true
      }
    }

    display () {
      super.display()
      // 동그라미의 체력 표시
      graphicSystem.meterRect(this.x, this.y + this.height, this.width, 1, 'darkblue', this.hp, this.hpMax, true, 'skyblue')
    }
  }

  SpriteIntruder = class {
    constructor (id = 0, x = 200, y = 100, z = -120) {
      this.id = id
      this.x = x
      this.y = y
      this.z = z
      this.ZBASE = -120
      switch (this.id) {
        case ID.enemy.intruder.diacore: this.imageData = imageDataInfo.intruderEnemy.diacore; break
        case ID.enemy.intruder.rendown: this.imageData = imageDataInfo.intruderEnemy.rendownGreen; break
        case ID.enemy.intruder.lever: this.imageData = imageDataInfo.intruderEnemy.leverImage; break
        case ID.enemy.intruder.flying1: this.imageData = imageDataInfo.intruderEnemy.flying1; break
        case ID.enemy.intruder.flying2: this.imageData = imageDataInfo.intruderEnemy.flying2; break
        default: this.imageData = imageDataInfo.intruderEnemy.metal; break
      }
    }

    process () {
      if (this.z >= 0) return

      this.z++
      this.x -= (this.imageData.width / Math.abs(this.ZBASE) / 2)
      this.y -= (this.imageData.height / Math.abs(this.ZBASE) / 2)

      if (this.z === 0) {
        fieldState.createEnemyObject(this.id, this.x, this.y)
      }
    }

    getSaveIntruderData () {
      return {id: this.id, x: this.x, y: this.y, z: this.z}
    }
    
    display () {
      let imgSrc = imageSrc.enemy.intruderEnemy
      let imgD = this.imageData
      let outputMultiple = Math.abs((1 / this.ZBASE) * (this.z + Math.abs(this.ZBASE)))
      let outputWidth = imgD.width * outputMultiple
      let outputHeight= imgD.height * outputMultiple
      let alpha = outputMultiple
      graphicSystem.imageDisplay(imgSrc, imgD.x, imgD.y, imgD.width, imgD.height, this.x, this.y, outputWidth, outputHeight, 0, 0, alpha)
    }
  }

  process () {
    super.process()
    this.processSprite()
  }

  processSaveString () {
    let arrayDonggrami = []
    let arrayIntruder = []
    for (let i = 0; i < this.spriteDonggrami.length; i++) {
      arrayDonggrami.push(this.spriteDonggrami[i].getSaveDonggramiData())
    }
    for (let i = 0; i < this.spriteIntruder.length; i++) {
      arrayIntruder.push(this.spriteIntruder[i].getSaveIntruderData())
    }

    this.saveString = JSON.stringify(arrayDonggrami) + '|' + JSON.stringify(arrayIntruder)
  }

  loadDataProgressSaveString () {
    let str = this.saveString.split('|')
    /** @type {Array} */ let arrayDonggrami = JSON.parse(str[0])
    /** @type {Array} */ let arrayIntruder = JSON.parse(str[1])

    for (let i = 0; i < arrayDonggrami.length; i++) {
      let donggrami = new this.SpriteDonggrami()
      let current = arrayDonggrami[i]
      donggrami.setLoadDonggramiStat(current.color, current.x, current.y, current.moveSpeedX, current.moveSpeedY, current.hp)
      this.spriteDonggrami.push(donggrami)
    }

    for (let i = 0; i < arrayIntruder.length; i++) {
      let current = arrayIntruder[i]
      let intruder = new this.SpriteIntruder(current.id, current.x, current.y, current.z)
      this.spriteIntruder.push(intruder)
    }
  }

  processSprite () {
    for (let i = 0; i < this.spriteIntruder.length; i++) {
      let sprite = this.spriteIntruder[i]
      sprite.process()
    }

    for (let i = 0; i < this.spriteIntruder.length; i++) {
      let sprite = this.spriteIntruder[i]
      if (sprite.z >= 0) {
        this.spriteIntruder.splice(i, 1)
        continue
      }
    }

    for (let i = 0; i < this.spriteDonggrami.length; i++) {
      let sprite = this.spriteDonggrami[i]
      sprite.process()
    }

    for (let i = 0; i < this.spriteDonggrami.length; i++) {
      let sprite = this.spriteDonggrami[i]
      if (sprite.isDeleted) {
        this.spriteDonggrami.splice(i, 1)
      }
    }
  }

  processDebug () {
    if (this.timeCheckFrame(0, 7)) {
      // this.setCurrentTime(this.phaseTime[3].startTime)
    }
  }

  /** 
   * intruder 입장용 적을 생성합니다. (적을 들어오는 형태로 표현하려면 이 함수로 적을 생성해야 함) 
   * 
   * 각 값들은 정해진 기준값이 존재
   * @param {number} id 적의 id
   * @param {number} x 적의 x좌표 (범위: 200 ~ 600)
   * @param {number} y 적의 y좌표 (범위: 100 ~ 500)
   */
  createSpriteIntruder (id, x = 200, y = 100) {
    this.spriteIntruder.push(new this.SpriteIntruder(id, x, y))
  }

  /** 동그라미를 생성합니다. */
  createSpriteDonggrami () {
    this.spriteDonggrami.push(new this.SpriteDonggrami())
  }

  roundPhase00 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime

    // 초반 인트로
    if (this.timeCheckFrame(pTime + 1)) {
      this.soundPlay(soundSrc.round.r2_5_start)
      this.changeBackgroundImage(imageSrc.round.round2_5_floorB1Dark, 120)
    } else if (this.timeCheckFrame(pTime + 4)) {
      this.soundPlay(soundSrc.round.r2_5_breakRoom)
      fieldState.createEffectObject(this.customRoomBreakEffect.getObject(), 200, 100)
      this.changeBackgroundImage(imageSrc.round.round2_5_floorB1Break, 60)
    } else if (this.timeCheckFrame(pTime + 6)) {
      this.musicChange(soundSrc.music.music14_intruder_battle)
      this.musicPlay()
    }

    // 각각의 적들이 차례대로 출현 (해당 페이즈에서만 진입하는 형태로 출연합니다.)
    if (this.timeCheckFrame(pTime + 7)) {
      for (let i = 0; i < 9; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.metal, 300 + ((i % 3) * 100), 200 + (Math.floor(i / 3) * 100))
      }
    } else if (this.timeCheckFrame(pTime + 12)) {
      for (let i = 0; i < 9; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.diacore, 300 + ((i % 3) * 100), 200 + (Math.floor(i / 3) * 100))
      }
    } else if (this.timeCheckFrame(pTime + 18)) {
      for (let i = 0; i < 4; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.rendown, 300 + ((i % 2) * 200), 200 + (Math.floor(i / 2) * 200))
      }
    } else if (this.timeCheckFrame(pTime + 24)) {
      for (let i = 0; i < 6; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.lever, 200 + ((i % 3) * 200), 200 + (Math.floor(i / 3) * 150))
      }
    } else if (this.timeCheckFrame(pTime + 30)) {
      for (let i = 0; i < 4; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.flying1, 250 + ((i % 2) * 300), 200 + (Math.floor(i / 2) * 200))
      }
      for (let i = 0; i < 2; i++) {
        this.createSpriteIntruder(ID.enemy.intruder.flying2, 400, 200 + (Math.floor(i / 1) * 200))
      }
    } else if (this.timeCheckFrame(pTime + 38)) {
      for (let i = 0; i < 3; i++) {
        this.createEnemy(ID.enemy.intruder.gami, 700)
      }
      for (let i = 0; i < 3; i++) {
        this.createEnemy(ID.enemy.intruder.momi, 700)
      }
    }

    this.timePauseEnemyCount(pTime + 44)
    if (this.timeCheckInterval(pTime + 45, pTime + 57, 10)) {
      this.createEnemy(ID.enemy.intruder.flyingRocket)
    }
    this.timePauseEnemyCount(pTime + 59)
  }

  roundPhase01 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime

    // total phase dps: 240% (first 6 seconds 100%) (main dps 120%, donggrami dps: 120%)

    // group 1 (dps 60%), (first 6 seconds 100%)
    if (this.timeCheckInterval(pTime + 0, pTime + 6, 12) || this.timeCheckInterval(pTime + 7, pTime + 28, 20)) {
      let random = Math.floor(Math.random() * 3)
      switch (random) {
        case 0: this.createEnemy(ID.enemy.intruder.metal); break
        case 1: this.createEnemy(ID.enemy.intruder.diacore); break
        default: this.createEnemy(ID.enemy.intruder.square); break
      }
    }

    // group 2 (dps 100%)
    if (this.timeCheckInterval(pTime + 7, pTime + 28, 60)) {
      if (Math.floor(Math.random() * 2) === 0) {
        this.createEnemy(ID.enemy.intruder.rendown, 839, 100)
      } else {
        this.createEnemy(ID.enemy.intruder.lever, 839, 200)
        this.createEnemy(ID.enemy.intruder.lever, 839, 400)
      }
    }

    // group 3 (dps 80%)
    if (this.timeCheckInterval(pTime + 7, pTime + 28, 90)) {
      this.createEnemy(ID.enemy.intruder.flying1) // 40%
      this.createEnemy(ID.enemy.intruder.flying2) // 80%
    }

    if (this.timeCheckFrame(pTime + 7)) {
      for (let i = 0; i < 10; i++) {
        this.createSpriteDonggrami()
      }
    }

    if (this.timeCheckInterval(pTime + 10, pTime + 28, 60)) {
      this.createSpriteDonggrami()
    }

    this.timePauseEnemyCount(pTime + 29, 6)
  }

  roundPhase02 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime

    // tower
    if (this.timeCheckInterval(pTime + 0, pTime + 10, 180)) {
      this.createEnemy(ID.enemy.intruder.hanoi, Math.random() * 400, 400) 
      this.createEnemy(ID.enemy.intruder.hanoi, Math.random() * 400, 400) 
      this.createSpriteDonggrami()
    } else if (this.timeCheckFrame(pTime + 10)) {
      for (let i = 0; i < 5; i++) {
        this.createEnemy(ID.enemy.intruder.daseok, i * 160, 400)
      }
    }

    // donggrami
    if (this.timeCheckInterval(pTime + 12, pTime + 18, 120)) {
      for (let i = 0; i < 3; i++) {
        this.createSpriteDonggrami()
      }
    }

    this.timePauseEnemyCount(pTime + 19, 3)

    // monster + flying
    if (this.timeCheckInterval(pTime + 20, pTime + 28, 60)) {
      this.createEnemy(ID.enemy.intruder.flyingRocket)
      this.createEnemy(ID.enemy.intruder.flying1)
      this.createEnemy(ID.enemy.intruder.flying2)
      this.createEnemy(ID.enemy.intruder.gami)
      this.createEnemy(ID.enemy.intruder.momi)
    }

    // donggrami
    if (this.timeCheckInterval(pTime + 20, pTime + 28, 90)) {
      this.createSpriteDonggrami()
      this.createSpriteDonggrami()
    }

    this.timePauseEnemyCount(pTime + 29, 10)
  }

  roundPhase03 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    // phase dps: 360% (player 120%, donggrami 240%)
    // 참고: dps에 오차가 있을 수 있음

    // group 1 part 1 (dps ~150%) (+0 ~ +5)
    if (this.timeCheckInterval(pTime + 0, pTime + 15, 16)) {
      this.createEnemy(ID.enemy.intruder.metal)
      this.createEnemy(ID.enemy.intruder.diacore)
    }

    // group 2 part 1 (dps ~130% x 1.8)
    if (this.timeCheckInterval(pTime + 0, pTime + 15, 24)) {
      this.createEnemy(ID.enemy.intruder.flying1)
      this.createEnemy(ID.enemy.intruder.flying2)
      this.createEnemy(ID.enemy.intruder.flyingRocket)
    }

    // group 1 part 2 (dps ~240%)
    if (this.timeCheckInterval(pTime + 16, pTime + 28, 54)) {
      this.createEnemy(ID.enemy.intruder.lever)
      this.createEnemy(ID.enemy.intruder.lever)
      this.createEnemy(ID.enemy.intruder.rendown)
    }

    // group 2 part 2 (dps ~130%)
    if (this.timeCheckInterval(pTime + 16, pTime + 28, 60)) {
      this.createEnemy(ID.enemy.intruder.gami)
      this.createEnemy(ID.enemy.intruder.momi)
      this.createEnemy(ID.enemy.intruder.flyingRocket)
    }

    // group 3 (9 seconds 1 time // total 3)
    if (this.timeCheckFrame(pTime + 3) || this.timeCheckFrame(pTime + 13), this.timeCheckFrame(pTime + 23)) {
      this.createEnemy(ID.enemy.intruder.hanoi, Math.random() * 600)
      this.createEnemy(ID.enemy.intruder.daseok, Math.random() * 600)
    }

    // donggrami (1 second per 4)
    if (this.timeCheckInterval(pTime + 0, pTime + 28, 30)) {
      this.createSpriteDonggrami()
    } else if (this.timeCheckInterval(pTime + 29, pTime + 29, 60) && this.spriteDonggrami.length <= 2) {
      this.createSpriteDonggrami()
    }

    this.timePauseEnemyCount(pTime + 29, 10)
  }

  roundPhase04 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    // boss
    if (this.timeCheckFrame(pTime + 1)) {
      this.soundPlay(soundSrc.round.r2_4_message1)
      this.createEnemy(ID.enemy.intruder.jemuBoss)
    }

    // avg dps 100%
    if (this.timeCheckInterval(pTime + 4, pTime + 10, 12)) {
      this.createEnemy(ID.enemy.intruder.square)
    } else if (this.timeCheckInterval(pTime + 11, pTime + 20, 12)) {
      this.createEnemy(ID.enemy.intruder.metal)
    } else if (this.timeCheckInterval(pTime + 21, pTime + 28, 12)) {
      this.createEnemy(ID.enemy.intruder.diacore)
    }

    if (this.spriteDonggrami.length <= 10 && this.timeCheckInterval(pTime + 5, pTime + 39, 60) && this.getEnemyCount() >= 3) {
      this.createSpriteDonggrami()
    }

    if (this.timeCheckInterval(pTime + 29, pTime + 38) && this.enemyNothingCheck()) {
      this.setCurrentTime(pTime + 39)
    }

    this.timePauseEnemyCount(pTime + 39)
  }

  roundPhase05 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.timeCheckInterval(pTime + 0, pTime + 6, 10)) {
      this.createEnemy(ID.enemy.intruder.flyingRocket)
    }
    if (this.timeCheckInterval(pTime + 0, pTime + 6, 60)) {
      this.createEnemy(ID.enemy.intruder.momi)
    }

    if (this.timeCheckFrame(pTime + 4)) {
      this.createSpriteDonggrami()
      this.createSpriteDonggrami()
    }

    if (this.timeCheckFrame(pTime + 4)) {
      this.musicChange('', 3)
    } else if (this.timeCheckFrame(pTime + 7)) {
      this.musicStop()
    }
  }

  display () {
    super.display()
    this.displaySprite()

    if (this.getCurrentPhase() === 4) {
      let enemyObject = this.getEnemyObject()
      for (let i = 0; i < enemyObject.length; i++) {
        let enemy = enemyObject[i]
        if (enemy.id === ID.enemy.intruder.jemuBoss) {
          graphicSystem.meterRect(0, 0, graphicSystem.CANVAS_WIDTH, 25, ['#7D7D7D', '#7B84A4'], enemy.hp, enemy.hpMax, true, '#B9D7FF', 2)
          digitalDisplay('BOSS HP: ' + enemy.hp + '/' + enemy.hpMax, 10, 3)
          break
        }
      }
    }
  }

  displayBackground () {
    graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
    super.displayBackground()
  }

  displaySprite () {
    for (let i = 0; i < this.spriteIntruder.length; i++) {
      this.spriteIntruder[i].display()
    }

    for (let i = 0; i < this.spriteDonggrami.length; i++) {
      this.spriteDonggrami[i].display()
    }
  }
}


class Round2_6 extends RoundData {
  constructor () {
    super()
    this.setAutoRoundStat(ID.round.round2_6)
    this.backgroundAbsoluteX = 0
    this.backgroundAbsoluteY = 0
    
    /** 배경 전환을 위한 해당 라운드 전용 값 */ this.ruinValue = 120
    /** 배경 전환을 위한 해당 라운드의 전용값의 최대치 */ this.RUIN_VALUE_MAX = 120

    this.addRoundPhase(this.roundPhase00, 0, 29)
    this.addRoundPhase(this.roundPhase01, 30, 59)
    this.addRoundPhase(this.roundPhase02, 60, 89)
    this.addRoundPhase(this.roundPhase03, 90, 119)
    this.addRoundPhase(this.roundPhase04, 120, 151)

    this.addLoadingSoundList([
      soundSrc.round.r2_4_elevatorDoorClose,
      soundSrc.round.r2_4_elevatorDoorOpen,
      soundSrc.round.r2_4_elevatorFloor,
      soundSrc.round.r2_4_elevatorMove,
    ])

    this.addLoadingImageList([
      imageSrc.round.round2_4_elevator,
      imageSrc.round.round2_4_elevatorHall,
      imageSrc.round.round2_4_elevatorNumber,
      imageSrc.round.round2_4_floorB1,

      imageSrc.round.round2_6_original1,
      imageSrc.round.round2_6_original2,
      imageSrc.round.round2_6_ruin1,
      imageSrc.round.round2_6_ruin2,
      imageSrc.round.round2_6_quiteRoad,
      imageSrc.round.round2_6_downtowerEntrance,
    ])

    this.addLoadingImageList(RoundPackLoad.getRound2ShareImage())
    this.addLoadingSoundList(RoundPackLoad.getRound2ShareSound())

    this.spriteElevator = Round2_4.createSpriteElevator()
  }

  processSaveString () {
    // 2-4 코드와의 차이점은, course에 대한 정보가 없음
    this.saveString = '' + this.backgroundAbsoluteX 
      + ',' + this.backgroundAbsoluteY
      + ',' + this.spriteElevator.state 
      + ',' + this.spriteElevator.stateDelay.count 
      + ',' + this.spriteElevator.floorDelay.count
      + ',' + this.spriteElevator.floor
      + ',' + this.spriteElevator.floorArrive
      + ',' + this.spriteElevator.isFloorMove
  }

  loadDataProgressSaveString () {
    let str = this.saveString.split(',')
    this.backgroundAbsoluteX = Number(str[0])
    this.backgroundAbsoluteY = Number(str[1])
    this.spriteElevator.state = str[2]
    this.spriteElevator.stateDelay.count = Number(str[3])
    this.spriteElevator.floorDelay.count = Number(str[4])
    this.spriteElevator.floor = Number(str[5])
    this.spriteElevator.floorArrive = Number(str[6])
    this.spriteElevator.isFloorMove = str[7] === 'true' ? true : false
  }

  processDebug () {
    if (this.timeCheckFrame(0, 7)) {
      // this.setCurrentTime(29)
    }
  }

  roundPhase00 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.timeCheckInterval(pTime + 2, pTime + 6, 60)) {
      this.createEnemy(ID.enemy.intruder.gami)
      this.createEnemy(ID.enemy.intruder.momi)
    } else if (this.timeCheckInterval(pTime + 8, pTime + 12, 30)) {
      this.createEnemy(ID.enemy.intruder.diacore)
      this.createEnemy(ID.enemy.intruder.metal)
      this.createEnemy(ID.enemy.intruder.square)
    }

    if (this.timeCheckFrame(pTime + 11)) {
      this.createEnemy(ID.enemy.intruder.daseok, 0)
      this.createEnemy(ID.enemy.intruder.daseok, graphicSystem.CANVAS_WIDTH - imageDataInfo.intruderEnemy.daseok.width)
    }

    if (this.timeCheckFrame(1)) {
      this.spriteElevator.setFloorPosition(1)
      this.changeBackgroundImage(imageSrc.round.round2_4_floorB1)
    }
    this.timePauseEnemyCount(18)

    this.spriteElevator.process()
    if (this.timeCheckFrame(pTime + 20)) {
      this.spriteElevator.setFloorMove(-1)
      // 이동 시간 1초 후 1초 대기
    } else if (this.timeCheckFrame(pTime + 22)) {
      this.spriteElevator.setDoorOpen(true)
    } else if (this.timeCheckFrame(pTime + 23)) {
      this.changeBackgroundImage(imageSrc.round.round2_4_elevatorHall, 60)
    } else if (this.timeCheckFrame(pTime + 24)) {
      this.spriteElevator.setDoorOpen(false)
    } else if (this.timeCheckFrame(pTime + 25)) {
      this.spriteElevator.setFloorMove(1)
    } else if (this.timeCheckFrame(pTime + 27)) {
      this.spriteElevator.setDoorOpen(true)
    } else if (this.timeCheckFrame(pTime + 28)) {
      this.changeBackgroundImage(imageSrc.round.round2_4_elevatorOutside, 60)
    } else if (this.timeCheckFrame(pTime + 29)) {
      this.spriteElevator.setDoorOpen(false)
    }
  }

  roundPhase01 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime

    // music
    if (this.timeCheckFrame(pTime + 0)) {
      this.musicChange(soundSrc.music.music12_donggrami_hall_outside, 3)
      this.musicPlay()
    } else if (this.timeCheckFrame(pTime + 26)) {
      this.musicChange('', 3)
    } else if (this.timeCheckFrame(pTime + 29)) {
      this.musicStop()
    }

    // donggramiParty (dps 120%)
    if (this.timeCheckInterval(pTime + 1, pTime + 17, 30)) {
      this.createEnemy(ID.enemy.donggramiEnemy.party)
      this.createEnemy(ID.enemy.donggramiEnemy.exclamationMark)
      this.createEnemy(ID.enemy.donggramiEnemy.questionMark)
    } else if (this.timeCheckInterval(pTime + 18, pTime + 25, 60)) {
      // donggrami (dps 50%)
      this.createEnemy(ID.enemy.donggramiEnemy.mini)
      this.createEnemy(ID.enemy.donggramiEnemy.bounce)
      this.createEnemy(ID.enemy.donggramiEnemy.speed)
    }
  }

  roundPhase02 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime

    if (this.timeCheckFrame(pTime + 0)) {
      this.musicChange(soundSrc.music.music15_donggrami_ruin, 2)
      this.musicPlay()
    }

    // dps 100%
    if (this.timeCheckInterval(pTime + 1, pTime + 24, 12)) {
      this.createEnemy(ID.enemy.donggramiEnemy.talkRuinR2_6)
    }
  }

  roundPhase03 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime

    if (this.timeCheckFrame(pTime + 26)) {
      this.musicChange('', 3)
    } else if (this.timeCheckFrame(pTime + 29)) {
      this.musicStop()
    }

    // dps 120%
    if (this.timeCheckInterval(pTime + 1, pTime + 15, 60)) {
      this.createEnemy(ID.enemy.intruder.flying1)
      this.createEnemy(ID.enemy.intruder.flying2)
    } else if (this.timeCheckInterval(pTime + 16, pTime + 28, 72)) {
      this.createEnemy(ID.enemy.intruder.lever)
      this.createEnemy(ID.enemy.intruder.rendown)
    }

    if (this.timeCheckFrame(pTime + 5) || this.timeCheckFrame(pTime + 10) || this.timeCheckFrame(pTime + 15)) {
      this.createEnemy(ID.enemy.intruder.hanoi)
    }
  }

  roundPhase04 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    if (this.timeCheckFrame(pTime + 18)) {
      this.createEnemy(ID.enemy.intruder.daseok, 600, 300)
      this.createEnemy(ID.enemy.intruder.daseok, 400, 300)
    }

    if (this.timeCheckInterval(pTime + 2, pTime + 15, 60)) {
      this.createEnemy(ID.enemy.intruder.flyingRocket)
      this.createEnemy(ID.enemy.intruder.metal)
      this.createEnemy(ID.enemy.intruder.square)
      this.createEnemy(ID.enemy.intruder.diacore)
      this.createEnemy(ID.enemy.intruder.lever)
    } else if (this.timeCheckInterval(pTime + 18, pTime + 27, 20)) {
      this.createEnemy(ID.enemy.intruder.nextEnemy)
    }

    this.timePauseEnemyCount(pTime + 28)
  }

  displayBackground () {
    // 모든 페이즈에서 해당 함수를 사용하지 않아 주석처리
    // super.displayBackground()

    switch (this.getCurrentPhase()) {
      case 0: this.displayPhase00(); break
      case 1: this.displayPhase01(); break
      case 2: this.displayPhase02(); break
      case 3: this.displayPhase03(); break
      case 4: this.displayPhase04(); break
    }

    if (this.getCurrentPhase() === 0 || this.getCurrentPhase() === 1) {
      this.spriteElevator.display()
    }
  }

  processBackground () {
    /** 현재 페이즈 시작 시간 */ const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    /** 현재 페이즈 */ const cPhase = this.getCurrentPhase()
    /** 이 게임의 기준 FPS: 1프레임당 1px씩 이동하므로, 초당 60px씩 배경 이동 */ const FPS = 60
    /** 한 페이즈당의 시간: 1페이즈당 30초이고, 초당 60px씩 이동하므로 배경은 1800px 이동하게됨 */ const TIME = 30

    // phase Reset 할때마다 x좌표 리셋
    if (this.timeCheckFrame(pTime)) { 
      this.backgroundAbsoluteX = 0
      if (cPhase === 2 || cPhase === 3) {
        this.changeBackgroundImage(imageSrc.round.round2_6_quiteRoad)
      } else if (cPhase === 4) {
        this.changeBackgroundImage(imageSrc.round.round2_6_downtowerEntrance)
      }
    }

    if (cPhase === 0) {
      if (this.backgroundAbsoluteX < graphicSystem.CANVAS_WIDTH) {
        this.backgroundAbsoluteX++
      }

      // 엘리베이터 위치 설정
      this.spriteElevator.x = (graphicSystem.CANVAS_WIDTH) - this.backgroundAbsoluteX + this.spriteElevator.BASE_X
      this.spriteElevator.y = this.spriteElevator.BASE_Y
    } else if (cPhase === 1) {
      if (this.backgroundAbsoluteX < graphicSystem.CANVAS_WIDTH * 3) {
        this.backgroundAbsoluteX++
      }

      this.spriteElevator.x = -this.backgroundAbsoluteX + this.spriteElevator.BASE_X
      this.spriteElevator.y = this.spriteElevator.BASE_Y
    } else if (cPhase === 2 || cPhase === 3) {
      // 폐허와 오리지널 이미지를 페이드 형식으로 출력 하기 위해서 ruinValue의 값을 변경
      if (this.timeCheckInterval(pTime + 2, pTime + 4) || this.timeCheckInterval(pTime + 16, pTime + 18)) {
        if (this.ruinValue >= 1) this.ruinValue--
      } else if (this.timeCheckInterval(pTime + 8, pTime + 10) || this.timeCheckInterval(pTime + 24, pTime + 26)) {
        if (this.ruinValue < this.RUIN_VALUE_MAX) this.ruinValue++
      }

      if (this.backgroundAbsoluteX <= FPS * TIME) {
        this.backgroundAbsoluteX++
      } else {
        this.backgroundAbsoluteX = FPS * TIME
      }
    } else if (cPhase === 4) {
      if (this.backgroundAbsoluteX <= (FPS * TIME) - graphicSystem.CANVAS_WIDTH) {
        this.backgroundAbsoluteX++
      } else {
        this.backgroundAbsoluteX = (FPS * TIME) - graphicSystem.CANVAS_WIDTH
      }
    }

    this.backgroundX = this.backgroundAbsoluteX
    this.backgroundY = this.backgroundAbsoluteY
  }

  displayPhase00 () {
    const pTime = this.phaseTime[this.getCurrentPhase()].startTime
    const gWidth = graphicSystem.CANVAS_WIDTH
    if (this.timeCheckInterval(pTime + 0, pTime + 20)) {
      graphicSystem.imageView(imageSrc.round.round2_5_floorB1Light, (gWidth * 0) - this.backgroundAbsoluteX, 0)
      graphicSystem.imageView(imageSrc.round.round2_4_floorB1, (gWidth * 1) - this.backgroundAbsoluteX, 0)
    } else {
      graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
      super.displayBackground()
    }
  }

  displayPhase01 () {
    const gWidth = graphicSystem.CANVAS_WIDTH
    graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
    graphicSystem.imageView(imageSrc.round.round2_4_elevatorOutside, (gWidth * 0) - this.backgroundAbsoluteX, 0)
    graphicSystem.imageView(imageSrc.round.round2_4_placard, (gWidth * 1) - this.backgroundAbsoluteX, 0)
    graphicSystem.imageView(imageSrc.round.round2_6_quiteRoad, (gWidth * 2) - this.backgroundAbsoluteX, 0)
    graphicSystem.imageView(imageSrc.round.round2_6_ruin1, (gWidth * 2 + 200) - this.backgroundAbsoluteX, 0)
  }

  displayPhase02 () {
    graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
    super.displayBackground()

    let ruinAlpha = (1 / this.RUIN_VALUE_MAX) * this.ruinValue
    let originalAlpha = 1 - ruinAlpha
    const FPS = 60
    const TIME = 30
    graphicSystem.setAlpha(ruinAlpha)
    graphicSystem.imageView(imageSrc.round.round2_6_ruin1, 0 - this.backgroundAbsoluteX, 0)
    graphicSystem.imageView(imageSrc.round.round2_6_ruin2, (FPS * TIME) - this.backgroundAbsoluteX, 0)
    graphicSystem.setAlpha(originalAlpha)
    graphicSystem.imageView(imageSrc.round.round2_6_original1, 0 - this.backgroundAbsoluteX, 0)
    graphicSystem.imageView(imageSrc.round.round2_6_original2, (FPS * TIME) - this.backgroundAbsoluteX, 0)
    graphicSystem.setAlpha()
  }

  displayPhase03 () {
    graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
    super.displayBackground()

    let ruinAlpha = (1 / this.RUIN_VALUE_MAX) * this.ruinValue
    let originalAlpha = 1 - ruinAlpha
    const FPS = 60
    const TIME = 30
    graphicSystem.setAlpha(ruinAlpha)
    graphicSystem.imageView(imageSrc.round.round2_6_ruin2, 0 - this.backgroundAbsoluteX, 0)
    graphicSystem.setAlpha(originalAlpha)
    graphicSystem.imageView(imageSrc.round.round2_6_original2, 0 - this.backgroundAbsoluteX, 0)
    graphicSystem.setAlpha()
    
    graphicSystem.imageView(imageSrc.round.round2_6_downtowerEntrance, (FPS * TIME) - this.backgroundAbsoluteX, 0)
  }

  displayPhase04 () {
    graphicSystem.gradientRect(0, 0, 800, 600, ['#4995E1', '#67B2FF'])
    super.displayBackground()
  }
}

class Round2_OS95 extends RoundData {
  // ?!
  // windows 95??
}


/**
 * export 할 라운드 데이터의 변수, tam4변수에 대입하는 용도
 */
export const dataExportRound = new Map()
dataExportRound.set(ID.round.round1_1, Round1_1)
dataExportRound.set(ID.round.round1_2, Round1_2)
dataExportRound.set(ID.round.round1_3, Round1_3)
dataExportRound.set(ID.round.round1_4, Round1_4)
dataExportRound.set(ID.round.round1_5, Round1_5)
dataExportRound.set(ID.round.round1_6, Round1_6)
dataExportRound.set(ID.round.round1_test, Round1_test)
dataExportRound.set(ID.round.round2_1, Round2_1)
dataExportRound.set(ID.round.round2_2, Round2_2)
dataExportRound.set(ID.round.round2_3, Round2_3)
dataExportRound.set(ID.round.round2_4, Round2_4)
dataExportRound.set(ID.round.round2_5, Round2_5)
dataExportRound.set(ID.round.round2_6, Round2_6)
