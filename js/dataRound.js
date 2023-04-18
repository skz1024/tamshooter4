//@ts-check

import { DelayData, FieldData, EnimationData, collision, collisionClass } from "./dataField.js"
import { EffectData, CustomEffect, CustomEditEffect } from "./dataEffect.js"
import { ID } from "./dataId.js"
import { stringText } from "./text.js"
import { imageDataInfo, imageSrc } from "./imageSrc.js"
import { fieldState } from "./field.js"
import { soundSrc } from "./soundSrc.js"
import { game } from "./game.js"

let graphicSystem = game.graphic
let soundSystem = game.sound

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
    /** (해당 라운드를 원할하게 플레이 할 수 있는) 권장 공격력, 입장은 상관 없음 */ this.recommandPower = 0
    /** 라운드 값을 텍스트로 표시 (예: 1-1), 영어와 숫자만 사용 가능 */ this.roundText = 'TEST'
    /** 라운드 이름, text.js에서 값을 가져와서 입력하세요. */ this.roundName = stringText.dataRoundName.test
    /** 라운드 종료 시간(이 시간이 되면 클리어), 단위: 초 */ this.finishTime = 999
    /** 클리어 보너스 점수 */ this.clearBonus = 10000
    /** 음악(음악은 fieldState에서 재생합니다. 일반적으로는...) */ 
    this.music = null
    this.currentMusic = null
    /** 불러오기 전용 변수 (음악 현재 시간) */ this.loadCurrentMusicTime = 0

    /**
     * 해당 라운드의 기본 배경 이미지 (배경은 언제든지 변경 가능)
     * @type {Image}
     */
    this.backgroundImage = null
    /** 배경을 변경할 때, 화면을 부드럽게 전환하기 위한 변수(페이드 기준값) */ this.backgroundFadeFrameMax = 120
    /** 배경을 변경할 때, 화면을 부드럽게 전환하기 위한 변수 */ this.backgroundFadeFrame = 0
    this.backgroundX = 1
    this.backgroundY = 0
    this.backgroundSpeedX = 0.5
    this.backgroundSpeedY = 0
    this.prevBackgroundImage = null

    /** 현재 시간의 프레임 */ this.currentTimeFrame = 0
    /** 현재 시간, 기본값은 반드시 0이어야 합니다. */ this.currentTime = 0
    /** 총합 프레임 (적 출현을 일정시간으로 나눌 때 주로 사용) */ this.currentTimeTotalFrame = 0
    /** 현재 시간이 정지된 상태 */ this.currentTimePaused = false
    /** 클리어 여부, 클리어가 되는 즉시 해당 라운드는 종료 */ this.isClear = false
    /** 추가 시간, 현재 시간이 일시 정지된 시점에서 사용됨 */ this.plusTime = 0
    /** 추가 시간 프레임 */ this.plusTimeFrame = 0
    
    /** 
     * 현재 있는 보스 
     * @type {FieldData}
     */ 
    this.currentBoss = null

    /** 보스 모드(적용될 경우 적이 다 사라질때까지 시간이 멈춤) */ this.bossMode = false
    /** 보스전 음악, 설정되지 않을경우 필드음악이 계속 재생됨.(음악이 꺼지진 않음.) */ this.bossMusic = null

    /** 
     * 모든 페이즈가 끝나는 시간 (그리고 적 전부 죽었는지 확인) 
     * 참고로 이 시간은 addRoundPhase를 사용할 때마다 해당 라운드의 종료 시점으로 자동으로 맞춰집니다.
     */ 
    this.phaseEndTime = 0

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
    // 페이즈 종료 시간은 마지막 시간에서 1초를 추가
    this.phaseEndTime = endTime + 1
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
   * @param {HTMLImageElement} changeBackgroundImage 변경할 배경 이미지
   * @param {number} fadeTimeFrame 배경화면이 전환되는 시간(프레임)
   */
  changeBackgroundImage (changeBackgroundImage, fadeTimeFrame = 1) {
    if (changeBackgroundImage != null) {

      // 배경 전환및 상태 저장을 원할하게 하기 위해, 
      // 변경할 예정인 이미지가 현재 이미지로 변경되고, 페이드 되는 이미지는 nextImage로 변경
      this.prevBackgroundImage = this.backgroundImage
      this.backgroundImage = changeBackgroundImage
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
   * @param {HTMLMediaElement} setMusic 보스전으로 설정할 음악, 이 값이 없다면 bossMusic으로 설정하고, bossMusic도 없다면 음악 변화 없음.
   */
  requestBossMode (enemyId, setMusic = this.bossMusic) {
    if (this.bossMode) return // 보스모드 설정 상태에서 중복으로 호출할 수 없음.

    this.bossMode = true
    
    if (enemyId != null) {
      this.createEnemy(enemyId)
    }

    if (setMusic != null) {
      this.musicPlay(setMusic, 0)
    }
  }

  /**
   * 배경 이미지를 출력합니다. (경우에 따라, 다른 이미지를 출력하도록 할 수 있습니다.)
   * @param {HTMLImageElement} imageSrc 이미지 파일 (입력시 해당 배경 이미지를 사용, 이게 없으면 기본 이미지 배경 사용)
   */
  displayBackgroundImage (imageSrc) {
    // 배경화면 이미지 출력 및 스크롤 효과, 배경이 없으면 아무것도 출력 안함.
    let image = imageSrc == null ? this.backgroundImage : imageSrc
    if (image == null) return // 이미지 파일이 없으면 출력하지 않음.

    let imageWidth = image.width
    let imageHeight = image.height
    let canvasWidth = graphicSystem.CANVAS_WIDTH
    let canvasHeight = graphicSystem.CANVAS_HEIGHT
    let imageX = this.backgroundX
    let imageY = this.backgroundY

    // 이미지의 길이 초과시, 이미지 X 좌표 변경
    if (imageX > imageWidth || imageX < 0) {
      imageX = imageX % imageWidth
    }

    // 이미지의 너비 초과시, 이미지 Y 좌표 변경
    if (imageY > imageHeight || imageY < 0) {
      imageY = imageY % imageHeight
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
      let current = this.backgroundImage
      let prev = this.prevBackgroundImage
      let prevAlpha = (1 / this.backgroundFadeFrameMax) * this.backgroundFadeFrame
      let originalAlpha = 1 - prevAlpha
       
      // 투명도를 페이드 하는 방식이라, 검은색 배경을 먼저 출력하고, 배경을 출력하도록 하였다.
      graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, graphicSystem.CANVAS_HEIGHT, 'black')
      graphicSystem.setAlpha(originalAlpha)
      this.displayBackgroundImage(current)
      graphicSystem.setAlpha(prevAlpha)
      this.displayBackgroundImage(prev)
      graphicSystem.setAlpha(1)

      if (this.backgroundFadeFrame === 0) {
        this.prevBackgroundImage = null
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
    if (enemy[0] != null) {
      enemy = enemy[0]
    } else {
      return
    }

    let percent = enemy.hp / enemy.hpMax
    graphicSystem.setAlpha(0.7)
    graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, 20, 'lightgrey')
    if (percent >= 0.2) {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'yellow', 'orange')
    } else {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'purple', 'red')
    }
    graphicSystem.setAlpha(1)
    graphicSystem.digitalFontDisplay('boss hp: ' + enemy.hp + '/' + enemy.hpMax, 0, 0)
  }

  process () {
    this.processDebug()
    this.processTime()
    this.processRound()
    this.processBackground()
    this.processBoss()
    this.processPhaseEndEnemyNothing()
    this.firstTimeMusicPlay()
  }

  processBoss () {
    if (!this.bossMode) return

    if (this.bossMusic) {
      this.musicPlay(this.bossMusic)
    }

    // 보스모드인 상태에서는 자동으로 시간 멈춤
    // 보스모드 상태에서 모든 적이 죽을 경우, 다음 구간 진행 가능
    // 다만 재생중인 음악이 종료되므로 주의
    if (this.enemyNothingCheck()) {
      this.bossMode = false
      this.currentTimePaused = false
      this.currentTime += 1
      soundSystem.musicStop()
    } else {
      this.currentTimePaused = true
    }
  }

  processBackground () {
    if (this.backgroundImage == null) return
    
    this.backgroundX += this.backgroundSpeedX
    this.backgroundY += this.backgroundSpeedY
    // 화면 전환 프레임이 동작중이라면, 배경화면의 길이를 초과해도 좌표가 자동으로 조절되지 않습니다.
    // 이것은 배경 사이즈가 다른 화면 전환을 부드럽게 하기 위해서입니다.
    if (this.backgroundFadeFrame > 0) return

    if (this.backgroundX > this.backgroundImage.width) {
      this.backgroundX -= this.backgroundImage.width
    } else if (this.backgroundX < 0) {
      this.backgroundX += this.backgroundImage.width
    }

    if (this.backgroundY > this.backgroundImage.height) {
      this.backgroundY -= this.backgroundImage.height
    } else if (this.backgroundY < 0) {
      this.backgroundY += this.backgroundImage.height
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
   * 시간 간격 확인 함수 (적 생성 용도로 사용)
   * start이상 end이하일경우 true, 아닐경우 false
   */
  timeCheckInterval (start, end = start, intervalFrame = 1) {
    if (this.currentTime >= start && this.currentTime <= end && this.currentTimeTotalFrame % intervalFrame === 0) {
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
    if (this.phaseEndTime === 0) return

    if (this.currentTime === this.phaseEndTime) {
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
  timePauseEnemyCount (time, minEnemyCount = 0) {
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
  showEnemyHp () {
    // 첫번째 에너미 한정
    let enemy = fieldState.getEnemyObject()
    if (enemy[0] != null) {
      enemy = enemy[0]
    } else {
      return
    }

    let percent = enemy.hp / enemy.hpMax
    graphicSystem.fillRect(0, 0, graphicSystem.CANVAS_WIDTH, 20, 'lightgrey')
    if (percent >= 0.2) {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'yellow', 'orange')
    } else {
      graphicSystem.gradientDisplay(0, 0, graphicSystem.CANVAS_WIDTH * percent, 20, 'purple', 'red')
    }
    graphicSystem.digitalFontDisplay('boss hp: ' + enemy.hp + '/' + enemy.hpMax, 0, 0)

  }

  /**
   * 적을 생성합니다.
   */
  createEnemy (enemyId, x = graphicSystem.CANVAS_WIDTH + 50, y = Math.random() * graphicSystem.CANVAS_HEIGHT) {
    fieldState.createEnemyObject(enemyId, x, y)
  }

  /**
   * 보스를 생성합니다.
   */
  createBoss (enemyId, x = graphicSystem.CANVAS_WIDTH + 50, y = Math.random() * graphicSystem.CANVAS_HEIGHT) {
    this.currentBoss = fieldState.createEnemyBoss(enemyId, x, y)
  }

  /**
   * 
   */
  getSaveData () {
    return {
      id: this.id,
      state: this.state,
      
      // 배경화면
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
      loadCurrentMusicTime: soundSystem.getMusicCurrentTime(),

      // 보스 모드
      bossMode: this.bossMode,

      // 특수한 경우
      saveString: this.saveString
    }
  }

  /**
   * 음악을 재생합니다.
   * 
   * 참고: 불러오기를 했을 때 이 함수를 사용하면, currentTime을 설정해도 무시함.
   * @param {*} soundSrc 
   */
  musicPlay (soundSrc, currentTime) {
    if (this.loadCurrentMusicTime !== 0) {
      // 불러오기 전용 변수
      soundSystem.musicPlay(this.music, this.loadCurrentMusicTime)
      this.loadCurrentMusicTime = 0
    } else if (soundSrc != null) {
      soundSystem.musicPlay(soundSrc, currentTime)
    } else {
      soundSystem.musicPlay(this.music, currentTime)
    }
  }

  firstTimeMusicPlay () {
    if (this.timeCheckFrame(0, 1)) {
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

    this.musicPlay()
  }
}

class Round1_1 extends RoundData {
  constructor () {
    super()
    this.roundName = stringText.dataRoundName.round1_1
    this.roundText = '1-1'
    this.recommandPower = 40000
    this.requireLevel = 1
    this.finishTime = 150
    this.clearBonus = 30000
    this.backgroundImage = imageSrc.round.round1_1_space
    this.music = soundSrc.music.music01_space_void
    this.bossMusic = soundSrc.music.music06_round1_boss_thema

    this.addRoundPhase(this.roundPhase0, 2, 10)
    this.addRoundPhase(this.roundPhase1, 11, 30)
    this.addRoundPhase(this.roundPhase2, 31, 60)
    this.addRoundPhase(this.roundPhase3, 61, 90)
    this.addRoundPhase(this.roundPhase4, 91, 120)
    this.addRoundPhase(this.roundPhase5, 121, 148)
  }

  roundPhase0 () {
    if (this.timeCheckInterval(2, 10, 10)) {
      this.createEnemy(ID.enemy.spaceEnemy.light)
    }
  }

  roundPhase1 () {
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

  roundPhase2 () {
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

  roundPhase3 () {
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

  roundPhase4 () {
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

  roundPhase5 () {
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
      this.backgroundImage = imageSrc.round.round1_2_meteorite
    }

    super.processBackground()
  }
}

class Round1_2 extends RoundData {
  constructor () {
    super()
    this.roundName = stringText.dataRoundName.round1_2
    this.roundText = '1-2'
    this.recommandPower = 34000
    this.requireLevel = 2
    this.finishTime = 180
    this.clearBonus = 40000
    this.backgroundImage = imageSrc.round.round1_2_meteorite
    this.music = soundSrc.music.music02_meteorite_zone_field

    this.meteoriteDeepImage = imageSrc.round.round1_3_meteoriteDeep

    this.addRoundPhase(this.roundPhase00, 0, 15)
    this.addRoundPhase(this.roundPhase01, 16, 30)
    this.addRoundPhase(this.roundPhase02, 31, 45)
    this.addRoundPhase(this.roundPhase03, 46, 60)
    this.addRoundPhase(this.roundPhase04, 61, 90)
    this.addRoundPhase(this.roundPhase05, 91, 120)
    this.addRoundPhase(this.roundPhase06, 121, 150)
    this.addRoundPhase(this.roundPhase07, 151, 176)
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
      this.backgroundImage = this.meteoriteDeepImage
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
    }
    if (this.timeCheckInterval(0, 15, 40)) {
      this.createEnemy(ID.enemy.meteoriteEnemy.class2)
    }
    if (this.timeCheckInterval(0, 15, 40)) {
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
    this.roundName = stringText.dataRoundName.round1_3
    this.roundText = '1-3'
    this.recommandPower = 40000
    this.requireLevel = 3
    this.finishTime = 210
    this.clearBonus = 39000
    this.backgroundImage = imageSrc.round.round1_3_meteoriteDeep
    this.music = soundSrc.music.music02_meteorite_zone_field

    // ---
    this.battleMusic = soundSrc.music.music03_meteorite_zone_battle
    this.redZone1 = imageSrc.round.round1_5_meteoriteRed
    this.redZone2 = imageSrc.round.round1_4_meteoriteDark
    this.memoryMusicTime = 0

    this.addRoundPhase(this.roundPhase00, 1, 10)
    this.addRoundPhase(this.roundPhase01, 11, 30)
    this.addRoundPhase(this.roundPhase02, 31, 70)
    this.addRoundPhase(this.roundPhase03, 71, 90)
    this.addRoundPhase(this.roundPhase04, 91, 140)
    this.addRoundPhase(this.roundPhase05, 141, 160)
    this.addRoundPhase(this.roundPhase06, 161, 180)
    this.addRoundPhase(this.roundPhase07, 181, 200)
    this.addRoundPhase(this.roundPhase08, 201, 207)
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
      this.backgroundImage = this.redZone1
    } else if (this.timeCheckInterval(phase8Start, this.finishTime)) {
      this.backgroundImage = this.redZone2
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
        graphicSystem.meterGradient(0, 0, graphicSystem.CANVAS_WIDTH, 20, currentEnemy.hp, currentEnemy.hpMax, graphicSystem.METER_HORIZONTAL, '#DDA7A7', '#FF4545')
        graphicSystem.digitalFontDisplay(`boss hp: ${currentEnemy.hp}/${currentEnemy.hpMax}`, 10, 2)
      }
    }
  }

  roundPhase00 () {
    // 운석이 쏟아지는 페이즈
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
      // this.memoryMusicTime = this.battleMusic.duration // 현재 음악의 재생 시간 저장
      soundSystem.musicChangeFade(this.battleMusic, 2)
    }

    if (this.timeCheckInterval(13, 28)) {
      this.musicPlay(this.battleMusic)
    }

    // 보스가 죽었다면, 스킵 (이 구간은 건너뜀)
    if (this.timeCheckInterval(20, 29, 4) && this.enemyNothingCheck()) {
      this.currentTime = 30
    }

    // 적이 있다면, 시간을 멈춥니다.
    if (this.timeCheckInterval(30)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }
  }

  roundPhase02 () {
    // 음악 변경
    if (this.timeCheckInterval(31, 31) && this.currentTimeFrame === 0) {
      soundSystem.musicChangeFade(this.music, 2)
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

    if (this.timeCheckInterval(70)) {
      // 적의 수가 5 초과라면, 시간이 일시정지합니다.
      this.currentTimePaused = this.getEnemyCount() > 2 ? true : false
    }
  }

  roundPhase03 () {
    // 이 페이즈 이후 부터 해당 음악이 적용됩니다.
    if (this.timeCheckInterval(71) && this.currentTimeFrame === 0) {
      this.createEnemy(ID.enemy.jemulEnemy.boss, 900)
      soundSystem.musicChangeFade(this.battleMusic, 2)
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

    if (this.timeCheckInterval(139)) {
      this.currentTimePaused = this.getEnemyCount() >= 5 ? true : false
    }
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
    if (this.timeCheckInterval(159)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }
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
    if (this.timeCheckInterval(179)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }
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
    if (this.timeCheckInterval(199)) {
      this.currentTimePaused = this.enemyNothingCheck() ? false : true
    }
  }

  roundPhase08 () {
    // 아직도 안끝났다! 마지막 페이즈
    if (this.timeCheckInterval(200, 206, 10)) {
      this.createEnemy(ID.enemy.jemulEnemy.hellDrill)
    }
  }

  process () {
    super.process()

    if (this.getCurrentPhase() >= 4 && soundSystem.currentMusic != this.battleMusic) {
      soundSystem.musicChangeFade(this.battleMusic, 2)
    }
  }

  display () {
    super.display()
    if ([1, 3, 5, 6, 7].includes(this.getCurrentPhase()) >= 0) {
      this.displayJemulBossMeter()
    }
  }
}

class Round1_4 extends RoundData {
  constructor () {
    super()
    this.roundName = stringText.dataRoundName.round1_4
    this.roundText = '1-4'
    this.recommandPower = 40000
    this.requireLevel = 4
    this.finishTime = 151
    this.clearBonus = 38000
    this.backgroundImage = imageSrc.round.round1_4_meteoriteDark
    this.music = soundSrc.music.music03_meteorite_zone_battle
    this.waitTimeFrame = 0
    this.backgroundDegree = 0

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
        this.enimation.degree += 4
      }
    }
  }

  roundPhase00 () {
    // 시작하자마자 보스 등장 (0 ~ 10)
    if (this.timeCheckInterval(3) && this.currentTimeFrame === 0) {
      this.createEnemy(ID.enemy.jemulEnemy.boss)
      soundSystem.musicPlay(soundSrc.music.music06_round1_boss_thema)
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

    this.backgroundSpeedX = 0.4
  }

  roundPhase01 () {
    // 진짜 보스 등장(...)
    if (this.timeCheckInterval(21) && this.currentTimeFrame === 0) {
      soundSystem.musicPlay(this.music, 67.171)
      this.createEnemy(ID.enemy.jemulEnemy.bossEye, graphicSystem.CANVAS_WIDTH_HALF - 100, graphicSystem.CANVAS_HEIGHT_HALF - 100)
    }
    
    if (this.timeCheckInterval(22, 79) && this.enemyNothingCheck()) {
      this.waitTimeFrame++

      if (this.waitTimeFrame >= 600) {
        this.currentTime = 80
      }
    }

    if (this.backgroundX > 10) {
      this.backgroundSpeedX = -0.4
    } else {
      this.backgroundSpeedX = 0
      this.backgroundX = 0
    }
  }

  roundPhase02 () {
    // 필드에 있는 보스 데이터 얻어오기
    let enemyObject = fieldState.getEnemyObject()

    /** 
     * @type {JemulEnemyBossEye} 
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

    soundSystem.musicStop() // 음악 강제 정지

    if (this.timeCheckFrame(phase2Time + 5, 0)) {
      this.changeBackgroundImage(this.specialImage, 150)
    }
    if (this.timeCheckInterval(phase2Time + 5, phase2Time + 30)) {
      this.backgroundImage = this.specialImage
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

    if (this.timeCheckInterval(phase3Time, phase3End)) {
      soundSystem.musicPlay(soundSrc.music.music08_round1_4_jemul)
    }

    this.backgroundImage = this.specialImage

    // 배경 흔들기
    if (this.timeCheckInterval(phase3Time, phase3Time + 10, 3)) {
      this.backgroundX = Math.random() * (phase3End - this.currentTime) * 3
      this.backgroundY = Math.random() * (phase3End - this.currentTime) * 3
    } else if (this.timeCheckInterval(phase3Time + 10, phase3End, 3)) {
      this.backgroundX = Math.random() * (phase3End - this.currentTime) * 2
      this.backgroundY = Math.random() * (phase3End - this.currentTime) * 2
    }

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

  process () {
    super.process()

    // if (this.timeCheckFrame(0, 4)) {
    //   this.currentTime = 109
    //   this.createEnemy(ID.enemy.jemulEnemyBossEye)
    // }
  }

  processDebug () {
    // if (this.timeCheckFrame(0, 4)) {
    //   this.currentTime = 109
    //   this.createEnemy(ID.enemy.jemulEnemyBossEye)
    // }
  }

  display () {
    super.display()
    if (this.getCurrentPhase() >= 0 && this.getCurrentPhase() <= 3 && this.currentTime <= 110) {
      this.showEnemyHp()
    }
  }
}

class Round1_5 extends RoundData {
  constructor () {
    super()
    this.roundName = stringText.dataRoundName.round1_5
    this.roundText = '1-5'
    this.recommandPower = 44000
    this.requireLevel = 1
    this.finishTime = 210
    this.clearBonus = 41000
    this.backgroundImage = imageSrc.round.round1_5_meteoriteRed
    this.music = soundSrc.music.music04_meteorite_zone_red

    this.addRoundPhase(this.roundPhase00, 1, 30)
    this.addRoundPhase(this.roundPhase01, 31, 60)
    this.addRoundPhase(this.roundPhase02, 61, 90)
    this.addRoundPhase(this.roundPhase03, 91, 107)
    this.addRoundPhase(this.roundPhase04, 108, 120)
    this.addRoundPhase(this.roundPhase05, 121, 150)
    this.addRoundPhase(this.roundPhase06, 151, 180)
    this.addRoundPhase(this.roundPhase07, 181, 200)
    this.addRoundPhase(this.roundPhase08, 201, 207)
  }

  processRound () {
    super.processRound()

    // if (this.timeCheckFrame(0, 5)) {
    //   this.currentTime = 177
    // }
  }

  processBackground () {
    const imageA = imageSrc.round.round1_3_meteoriteDeep
    let phase7Start = this.phaseTime[7].startTime
    let phase8Start = this.phaseTime[8].startTime
    if (this.timeCheckFrame(phase7Start, 0)) {
      this.changeBackgroundImage(imageA, 1200)
    }

    if (this.timeCheckInterval(0, phase7Start - 1)) {
      this.backgroundSpeedX = 0.8
    } else if (this.timeCheckInterval(phase7Start, phase8Start)) {
      this.backgroundSpeedX = 1.2
    } else if (this.timeCheckInterval(phase8Start, 210)) {
      this.backgroundSpeedX = 1
    }

    if (this.timeCheckInterval(0, 999)) {
      if (this.backgroundSpeedY === 0 || this.backgroundSpeedY === 0.1) {
        this.backgroundSpeedY = -0.1

      } else {
        this.backgroundSpeedY = 0.1

      }
    }

    // if (this.timeCheckInterval(0, phase7Start, 300)) {
    //   let randomNumber = Math.random() * 100
    //   if (randomNumber <= 33) this.backgroundSpeedY = 0.1
    //   else if (randomNumber <= 66) this.backgroundSpeedY = 0
    //   else this.backgroundSpeedY = -0.1
    // }

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
      soundSystem.musicChangeFade(soundSrc.music.music02_meteorite_zone_field)
    }

    if (this.timeCheckInterval(181, 11)) {
      soundSystem.musicPlay(soundSrc.music.music02_meteorite_zone_field)
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
      this.showEnemyHp()
    }
  }
}

class Round1_6 extends RoundData {
  constructor () {
    super()
    this.roundName = stringText.dataRoundName.round1_6
    this.roundText = '1-6'
    this.recommandPower = 44000
    this.requireLevel = 6
    this.finishTime = 152
    this.clearBonus = 35000
    this.backgroundImage = imageSrc.round.round1_2_meteorite
    this.spaceImage = imageSrc.round.round1_6_space
    this.music = soundSrc.music.music02_meteorite_zone_field
    this.musicTour = soundSrc.music.music05_space_tour
    this.musicPlanet = soundSrc.music.music07_paran_planet_entry
    this.bossMusic = soundSrc.music.music06_round1_boss_thema

    this.addRoundPhase(this.roundPhase00, 1, 30)
    this.addRoundPhase(this.roundPhase01, 31, 60)
    this.addRoundPhase(this.roundPhase02, 61, 90)
    this.addRoundPhase(this.roundPhase03, 91, 120)
    this.addRoundPhase(this.roundPhase04, 121, 150)

    /**
     * 이 라운드에서 행성을 보여주기 위한 오브젝트
     */
    this.planet = this.createPlanet()
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
        graphicSystem.imageDisplay(this.image, 0, 0, this.image.width, this.image.height, outputX, outputY, this.size, this.size, 0, this.degree)
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
    if (this.timeCheckFrame(30, 0)) {
      soundSystem.musicChangeFade(this.musicTour, 1)
      this.changeBackgroundImage(this.spaceImage, 360)
    }

    if (this.timeCheckInterval(31, 127)) {
      soundSystem.musicPlay(this.musicTour)
    }

    // 참고: space tour 음악은 약 97초
    // 음악이 30초 + 97초 = 127초 지점에 종료됨.
    // 파란 행성 진입 음악은 약 128초 붜터 약 24초간 재생됨 (페이드 시간을 고려해서)
    const fadeTime = 1
    const planetMusicPlayTime = 128 - fadeTime
    if (this.timeCheckFrame(planetMusicPlayTime, 0)) {
      soundSystem.musicChangeFade(this.musicPlanet, fadeTime)
      // soundSystem.musicPlay(this.musicPlanet)
    }

    if (this.timeCheckInterval(129, 152)) {
      soundSystem.musicPlay(this.musicPlanet)
    }
  }

  processPhaseEndEnemyNothing () {
    // 적 남아있어도 클리어 가능
  }

  processBackground () {
    super.processBackground()
    if (this.currentTime >= this.finishTime - this.planet.totalDisplayTime) {
      this.planet.process()
      this.saveString = this.planet.x + ',' + this.planet.size + ',' + this.planet.elapsedFrame
    }

    if (this.timeCheckInterval(31, this.finishTime)) {
      this.backgroundImage = this.spaceImage
    }
  }

  displayBackground () {
    super.displayBackground()
    if (this.currentTime >= this.finishTime - this.planet.totalDisplayTime) {
      this.planet.display()
    }
  }

  setLoadData (saveData) {
    super.setLoadData(saveData)

    let str = this.saveString.split(',')
    this.planet.x = Number(str[0])
    this.planet.size = Number(str[1])
    this.planet.elapsedFrame = Number(str[2])
  }
}

class Round1_test extends RoundData {
  constructor () {
    super()
    this.roundName = 'test'
    this.roundText = 'test'
    this.recommandPower = 40000
    this.requireLevel = 3
    this.finishTime = 50
    this.clearBonus = 100
    this.backgroundImage = null
    this.music = null


    this.addRoundPhase(() => {
      if (this.timeCheckFrame(1, 1)) {
        this.createEnemy(ID.enemy.jemulEnemy.boss)
      }
    }, 0, 999)

  }
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
