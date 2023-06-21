//@ts-check

import { DelayData, FieldData, EnimationData, collision, collisionClass } from "./dataField.js"
import { EffectData, CustomEffect, CustomEditEffect } from "./dataEffect.js"
import { ID } from "./dataId.js"
import { stringText } from "./text.js"
import { imageDataInfo, imageSrc } from "./imageSrc.js"
import { fieldState } from "./field.js"
import { soundSrc } from "./soundSrc.js"
import { game, gameFunction } from "./game.js"
import { dataExportStatRound } from "./dataStat.js"
import { CustomEnemyBullet } from "./dataEnemy.js"

let graphicSystem = game.graphic
let soundSystem = game.sound
let controlSystem = game.control
let digitalDisplay = gameFunction.digitalDisplay

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
    /** 현재 시간이 정지된 상태 */ this.currentTimePaused = false
    /** 클리어 여부, 클리어가 되는 즉시 해당 라운드는 종료 */ this.isClear = false
    /** 추가 시간, 현재 시간이 일시 정지된 시점에서 사용됨 */ this.plusTime = 0
    /** 추가 시간 프레임 */ this.plusTimeFrame = 0
    
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
   * 주의: 잘못 사용하면 시간이 영원히 멈출 수도 있습니다.
   */
  setCurrentTimePause (boolValue = false) {
    this.currentTimePaused = boolValue
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
   * 배경 이미지를 출력합니다. (경우에 따라, 다른 이미지를 출력하도록 할 수 있습니다.)
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
      let current = this.backgroundImageSrc
      let prev = this.prevBackgroundImageSrc
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
  timeCheckInterval (start = 0, end = start, intervalFrame = 1) {
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
   * @param {number} frame 해당 프레임(없을 경우 기본값 1)
   */
  timeCheckFrame (time, frame = 1) {
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

    // 이미지, 효과음 로드
    soundSystem.createAudio(this.messageSound.message1)
    soundSystem.createAudio(this.messageSound.message2)
    soundSystem.createAudio(this.messageSound.jemulstar)
    soundSystem.createAudio(this.messageSound.jemulstart)
    soundSystem.createAudio(this.messageSound.jemulrun)

    graphicSystem.createImage(imageSrc.effect.jemulstar)
    graphicSystem.createImage(imageSrc.effect.jemulCreate)

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
  }

  processBackground () {
    // 참고: 1-4는 여기에 배경을 조정하는 기능이 없고 각 roundPhase마다 적혀져있습니다.
    this.backgroundSpeedX = 0.4

    // 자연스러운 배경 변화를 위해 x축 위치를 고정시킴
    // 다만, 다음 페이즈에서 배경을 흔드는 상황이 오기 때문에 이 처리는 페이즈 3에서만 적용
    // 주의: 초반에 시간을 너무 끌어버린 경우, 부자연스럽게 배경이 이동할 수 있음.
    // 이것은 버그로 취급하지 않음.
    if (this.currentTime >= 80 && this.currentTime <= 110) {
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
      this.showEnemyHp()
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
      this.showEnemyHp()
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

    // 이 라운드에서만 사용하는 행성 이미지 추가
    graphicSystem.createImage(imageSrc.round.round1_6_paran_planet)

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
    this.roundName = 'test'
    this.roundText = 'test'
    this.standardPower = 40000
    this.requireLevel = 3
    this.finishTime = 200
    this.clearBonus = 0

    this.backgroundImageSrc = imageSrc.round.round2_3_maeul_space

    this.addRoundPhase(() => {
      if (this.getEnemyCount() === 0) {
        this.createEnemy(ID.enemy.donggramiSpace.b1_bounce)
      }
    }, 0, 999)

    this.countA = 1
    this.countAD = 120
  }


  displayBackground () {
    graphicSystem.gradientRect(0, 0, 1200, 600, ['#218920', '#6DB9AB'])
    super.displayBackground()

    let enemy = this.getEnemyObject()[0]
    if (enemy != null) {
      digitalDisplay(enemy.x, 0, 0)
      digitalDisplay(enemy.state, 0, 40)
      digitalDisplay('x: ' + enemy.autoMovePositionX + ',y: ' + enemy.autoMovePositionY, 0, 70)

      if (enemy.state === '' && collision(this.getPlayerObject(), enemy)) {
        soundSystem.play(soundSrc.round.r2_3_a1_damage)
        enemy.state = 'collision'
      }
    }

    let player = this.getPlayerObject()
    this.countA++
    let count = (this.countA / this.countAD) * 180
    let degree = Math.PI / 180 * count
    let sinValue = Math.sin(degree)

    // 절반의 딜레이 시간동안 추락하고, 절반의 딜레이 시간동안 올라갑니다.
    // 이렇게 한 이유는, sin 값이 0 ~ 1 ~ 0 식으로 변화하기 때문
    if (this.countA < this.countAD / 2) {
      // this.moveSpeedY = this.bounceSpeedY * sinValue
      player.y += 12 * sinValue

      if (player.y > game.graphic.CANVAS_HEIGHT) {
        // 화면 밑으로 이미 내려갔다면, 딜레이값을 조정해 강제로 위로 올라가도록 처리
        this.countA = this.countAD / 2
      } else if (this.countA >= this.countAD - 4) {
        // 다만, 내려갈 때에는 하면 맨 밑에 닿지 않으면 계속 내려가도록 딜레이를 직접적으로 조정
        this.countA--
      }
    } else {
      player.y -= 12 * sinValue
    }

    if (this.countA > this.countAD) {
      this.countA -= this.countAD
    }

    digitalDisplay(this.countA + ', ' + this.countAD + ', count: ' + count, 0, 230)
  }

  display () {
    super.display()
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
    if (this.timeCheckInterval(13, 27, 60)) {
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
    const echoValue = [0.1, 0.3, 0.5, 0.6, 0.7, 0.6, 0.5, 0.3, 0.1, 0]
    const feedValue = [0.1, 0.3, 0.4, 0.5, 0.6, 0.5, 0.4, 0.3, 0.1, 0]
    const delayValue = 0.3
    const changeTime = [24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54]
    for (let i = 0; i < changeTime.length - 1; i++) {
      if (this.currentTime >= changeTime[i] && this.currentTime < changeTime[i + 1]) {
        game.sound.setEcho(echoValue[i], feedValue[i], delayValue)
      }
    }

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

    /** 현재 적용된 그라디언트의 색상 */
    this.currentGradientColor = ['#4995E1', '#67B2FF']

    this.bgRoadSrc = imageSrc.round.round2_3_road
    this.bgSpaceSrc = imageSrc.round.round2_3_maeul_space

    this.backgroundImageSrc = this.bgRoadSrc

    /**
     * 맵의 스트링 값
     * 
     * 맵의 종류 = a1 ~ a3, b1 ~ b3, c1 ~ c3, z1 ~ z2(복도)
     */
    this.courseName = 'z1'

    /** 코스 선택시 현재 선택된 번호 */
    this.courseCursorNumber = 0

    /** 코스 선택 시간 */
    this.courseSelectTime = 6

    this.addRoundPhase(this.roundPhase00, 0, 19)
    this.addRoundPhase(this.roundPhase01, 20, 79)
    this.addRoundPhase(this.roundPhase02, 80, 139)
    this.addRoundPhase(this.roundPhase03, 140, 199)
    this.addRoundPhase(this.roundPhase04, 200, 214)

    
    // 선택 창에 관한 오브젝트
    this.boxMap = {
      x: 100,
      y: -300,
      width: 600,
      height: 200,
      isShow: false,
      image: imageSrc.round.round2_3_map,
    }
    
    this.boxCourse = {
      x: 100,
      y: 800,
      width: 600,
      height: 200,
      isShow: false,
      image: imageSrc.round.round2_3_course_select,
    }

    game.graphic.createImage(this.boxMap.image)
    game.graphic.createImage(this.boxCourse.image)

    /** 현재 코스 선택 모드에 있는지에 대한 여부 */
    this.isCourseSelectMode = false


    // 음악 추가
    game.sound.createAudio(this.musicList.a1_battle_room)
    game.sound.createAudio(this.musicList.a2_break_room)
    game.sound.createAudio(this.musicList.a3_power_room)
    game.sound.createAudio(this.musicList.b1_jump_room)
    game.sound.createAudio(this.musicList.b2_warp_room)
    game.sound.createAudio(this.musicList.b3_move_room)
    game.sound.createAudio(this.musicList.c1_bullet_room)
    game.sound.createAudio(this.musicList.c2_square_room)
    game.sound.createAudio(this.musicList.c3_trap_room)

    // 각 구역에 따른 변수 지정
    this.a1 = {
      /** 적의 체력 */ enemyHp: 100,
      /** 플레이어의 체력 */ playerHp: 100,
      /** 무적 시간(플레이어만 해당) */ invincibleFrame: 60,
      /** 배틀의 남은 시간 */ battleLeftTime: 45,
      /** 배틀의 결과 */ result: '',
      /** 플레이어 강제 이동 (랜덤한 위치로, 타격당할 때마다 변경) */ playerAutoMoveFrame: 0,
      /** 플레이어 이동 고정 위치 x좌표 */ playerAutoMoveX: 0,
      /** 플레이어 이동 고정 위치 y좌표 */ playerAutoMoveY: 0,
      /** 에니메이션용(부드럽게 감소시키기위한) 체력 */ playerHpEnimation: 100,
      /** 에니메이션용(반짝이는 효과를 위한) 체력 */ playerHpEnimationFrame: 0,
    }

    // 보이스 추가(...)
    this.voiceList = {
      complete: soundSrc.round.r2_3_voiceComplete,
      draw: soundSrc.round.r2_3_voiceDraw,
      win: soundSrc.round.r2_3_voiceWin,
      lose: soundSrc.round.r2_3_voiceLose,
      start: soundSrc.round.r2_3_voiceStart,
      fight: soundSrc.round.r2_3_voiceFight,
      ready: soundSrc.round.r2_3_voiceReady
    }

    game.sound.createAudio(this.voiceList.complete)
    game.sound.createAudio(this.voiceList.draw)
    game.sound.createAudio(this.voiceList.win)
    game.sound.createAudio(this.voiceList.lose)
    game.sound.createAudio(this.voiceList.start)
    game.sound.createAudio(this.voiceList.fight)
    game.sound.createAudio(this.voiceList.ready)
    game.sound.createAudio(soundSrc.round.r2_3_a1_damage) // 플레이어 데미지 용도

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
        // 알파값이 증가상태면 10%씩 상승, 아닐경우 10%씩 감소
        this.alphaPercent += this.isAlphaValueUp ? 5 : -5

        if (this.alphaPercent <= 0) {
          this.isAlphaValueUp = true
          this.alphaPercent = 0
        }

        if (this.alphaPercent === 100) {
          this.isAlphaValueUp = false
          this.alphaPercent = 100
        }
      }

      display () {
        // 알파값은 100배의 정수로 기록되었으므로, 값을 맞추기 위해 100으로 나눕니다.
        graphicSystem.fillRect(this.x, this.y, this.width, this.height, this.color, this.alphaPercent / 100)
      }
    }

    const lightX = 100
    this.lightBoxList = {
      z1: new LightBox(lightX + 0, 50, 100, 150, 'white'),
      a1: new LightBox(lightX + 100, 50, 100, 50, 'red'),
      a2: new LightBox(lightX + 200, 50, 100, 50, 'red'),
      a3: new LightBox(lightX + 300, 50, 100, 50, 'red'),
      b1: new LightBox(lightX + 100, 100, 100, 50, 'yellow'),
      b2: new LightBox(lightX + 200, 100, 100, 50, 'yellow'),
      b3: new LightBox(lightX + 300, 100, 100, 50, 'yellow'),
      c1: new LightBox(lightX + 100, 150, 100, 50, 'green'),
      c2: new LightBox(lightX + 200, 150, 100, 50, 'green'),
      c3: new LightBox(lightX + 300, 150, 100, 50, 'green'),
      z2: new LightBox(lightX + 400, 50, 100, 150, 'white'),
      s1: new LightBox(lightX + 100, 300, 500, 50, 'grey'),
      s2: new LightBox(lightX + 100, 350, 500, 50, 'grey'),
      s3: new LightBox(lightX + 100, 400, 500, 50, 'grey'),
    }

    this.b1 = {
      pBounceSpeed: 12,
      pBounceDelay: 120,
      pBounceDelayCount: 0,
      pCollisionCount: 0,
      isPlayerArrowUp: false,
      /** 플레이어 강제 이동 (랜덤한 위치로, 타격당할 때마다 변경) */ playerAutoMoveFrame: 0,
      /** 플레이어 이동 고정 위치 x좌표 */ playerAutoMoveX: 0,
      /** 플레이어 이동 고정 위치 y좌표 */ playerAutoMoveY: 0,
    }

    this.c1 = {
      pHp: 100,
      totalDamage: 0
    }
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
    this.lightBoxList.s1.process()
    this.lightBoxList.s2.process()
    this.lightBoxList.s3.process()
    this.lightBoxList.z1.process()
    this.lightBoxList.z2.process()
  }

  setCourseGradientColor () {
    switch (this.courseName) {
      case 'z1': this.currentGradientColor = this.bgGradientColor.normal_road; break
      case 'z2': this.currentGradientColor = this.bgGradientColor.normal_road; break
      case 'a1': this.currentGradientColor = this.bgGradientColor.a1_battle_room; break
      case 'a2': this.currentGradientColor = this.bgGradientColor.a2_break_room; break
      case 'a3': this.currentGradientColor = this.bgGradientColor.a3_power_room; break
      case 'b1': this.currentGradientColor = this.bgGradientColor.b1_jump_room; break
      case 'b2': this.currentGradientColor = this.bgGradientColor.b2_warp_room; break
      case 'b3': this.currentGradientColor = this.bgGradientColor.b3_move_room; break
      case 'c1': this.currentGradientColor = this.bgGradientColor.c1_bullet_room; break
      case 'c2': this.currentGradientColor = this.bgGradientColor.c2_square_room; break
      case 'c3': this.currentGradientColor = this.bgGradientColor.c3_trap_room; break
    }
  }

  /** 코스 변경 (코스 공식과 사용자의 선택에 따라 자동으로 변경됨) */
  changeCourse () {
    // 코스 변경 공식 // 코스를 선택한 순간에만 실행됨
    if (this.courseName === 'z1') {
      switch (this.courseCursorNumber) {
        case 0: this.courseName = 'a1'; break
        case 1: this.courseName = 'b1'; break
        case 2: this.courseName = 'c1'; break
      }
      if (this.currentTime <= 20) {
        this.setCurrentTime(20)
      }
    } else if (this.courseName === 'a1' || this.courseName === 'b1' || this.courseName === 'c1') {
      switch (this.courseCursorNumber) {
        case 0: this.courseName = 'a2'; break
        case 1: this.courseName = 'b2'; break
        case 2: this.courseName = 'c2'; break
      }
      if (this.currentTime <= 80) {
        this.setCurrentTime(80)
      }
    } else if (this.courseName === 'a2' || this.courseName === 'b2' || this.courseName === 'c2') {
      switch (this.courseCursorNumber) {
        case 0: this.courseName = 'a3'; break
        case 1: this.courseName = 'b3'; break
        case 2: this.courseName = 'c3'; break
      }
      if (this.currentTime <= 140) {
        this.setCurrentTime(140)
      }
    } else if (this.courseName === 'a3' || this.courseName === 'b3' || this.courseName === 'c3') {
      this.courseName = 'z2'
    }

    // 시간 멈춤 해제
    this.setCurrentTimePause(false)
    
    // z2는 해당 사항 없음 (더이상 변경 불가능)

    // 코스가 변경되면 그라디언트 배경색도 변경됨
    this.setCourseGradientColor()

    // 배경 변경
    if (this.courseName !== 'z1' && this.courseName !== 'z2') {
      this.changeBackgroundImage(this.bgSpaceSrc, 60)
    } else {
      this.changeBackgroundImage(this.bgRoadSrc, 60)
    }
  }

  setCourseSelectMode () {
    this.isCourseSelectMode = true
    this.courseCursorNumber = 1 // 맨 위가 0번, 가운데가 1번, 맨 아래가 2번이고, 커서는 가운데에 놓여짐
    this.courseSelectTime = 6

    // 코스 오브젝트의 위치 기본값 설정
    this.boxMap.y = 0 - 200
    this.boxCourse.y = graphicSystem.CANVAS_HEIGHT + 200

    // 박스 보여지도록 허용
    this.boxMap.isShow = true
    this.boxCourse.isShow = true

    // 플레이어 강제 이동
    let playerP = fieldState.getPlayerObject()
    playerP.x = 100
    playerP.y = 400
  }

  setNormalMode () {
    this.isCourseSelectMode = false
    this.boxMap.isShow = false
    this.boxCourse.isShow = false

    fieldState.allEnemyDelete()
  }

  processCourse () {
    if (!this.isCourseSelectMode) return

    if (controlSystem.getButtonInput(controlSystem.buttonIndex.DOWN) && this.courseCursorNumber < 2) {
      this.courseCursorNumber++
    } else if (controlSystem.getButtonInput(controlSystem.buttonIndex.UP) && this.courseCursorNumber > 0) {
      this.courseCursorNumber--
    }
    
    let playerP = fieldState.getPlayerObject()
    if (this.courseCursorNumber === 0) {
      playerP.y = 300
    } else if (this.courseCursorNumber === 1) {
      playerP.y = 350
    } else if (this.courseCursorNumber === 2) { 
      playerP.y = 400
    }

    // 박스 보여지도록 허용
    this.boxMap.isShow = true
    this.boxCourse.isShow = true

    // 코스 선택 버튼을 누르거나, 또는 플레이어를 앞으로 이동시킨 경우
    if (controlSystem.getButtonInput(controlSystem.buttonIndex.A) || playerP.x >= 250) {
      // 코스 선택 종료 (해당 값을 선택한 것으로 처리)
      this.setNormalMode()
      this.changeCourse()
    }

    // 플레이어는 일정 구간 뒤로 갈 수 없음
    if (playerP.x <= 99) {
      playerP.x = 100
    }

    this.processMapBox()
  }

  processDebug () {
    if (this.timeCheckFrame(0, 12)) {
      this.currentTime = 14
    }
  }

  process () {
    super.process()
    this.processCourse()
  }

  processSaveString () {
    // 저장 방식
    // 현재 맵, 선택모드, 현재 커서 값, 
    // 그리고, 각 모드에 대한 추가적인 정보
    let modInfo = ''
    switch (this.courseName) {
      case 'a1': modInfo = JSON.stringify(this.a1); break
    }

    // 참고: JSON 파싱 버그를 막기 위해 구분자는 |(막대기?) 로 사용합니다.
    this.saveString = this.courseName + '|' + this.isCourseSelectMode + '|' + this.courseCursorNumber + '|' + modInfo
  }

  loadDataProgressSaveString () {
    let str = this.saveString.split('|')
    this.courseName = str[0]
    this.isCourseSelectMode = str[1] === 'true' ? true : false
    this.courseCursorNumber = Number(str[2])

    let modInfo = str[3]
    switch (this.courseName) {
      case 'a1': this.a1 = JSON.parse(modInfo); break
    }

    // 불러올 때 그라디언트 배경도 변경함
    this.setCourseGradientColor()
  }

  processMapBox () {
    if (this.boxMap.y < 0) {
      this.boxMap.y += 10
    } else {
      this.boxMap.y = 0
    }
    if (this.boxCourse.y > 250) {
      this.boxCourse.y -= 20
    } else {
      this,this.boxCourse.y = 250
    }

    this.lightBoxProcess()
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

    // 선택 오브젝트 출력
    if (this.boxMap.isShow) {
      graphicSystem.imageView(this.boxMap.image, this.boxMap.x, this.boxMap.y)

      switch (this.courseName) {
        case 'z1':
          if (this.courseCursorNumber === 0) this.lightBoxList.a1.display()
          if (this.courseCursorNumber === 1) this.lightBoxList.b1.display()
          if (this.courseCursorNumber === 2) this.lightBoxList.c1.display()
          this.lightBoxList.z1.display()
          break
        case 'a1':
        case 'b1':
        case 'c1':
          if (this.courseCursorNumber === 0) this.lightBoxList.a2.display()
          if (this.courseCursorNumber === 1) this.lightBoxList.b2.display()
          if (this.courseCursorNumber === 2) this.lightBoxList.c2.display()
          if (this.courseName === 'a1') this.lightBoxList.a1.display()
          if (this.courseName === 'b1') this.lightBoxList.b1.display()
          if (this.courseName === 'c1') this.lightBoxList.c1.display()
          break
      }
    }

    if (this.boxCourse.isShow) {
      graphicSystem.imageView(this.boxCourse.image, this.boxCourse.x, this.boxCourse.y)

      switch (this.courseCursorNumber) {
        case 0: this.lightBoxList.s1.display(); break
        case 1: this.lightBoxList.s2.display(); break
        case 2: this.lightBoxList.s3.display(); break
      }
    }
  }

  roundPhase00 () {
    // 2 ~ 10초
    // 동그라미들 등장, dps: 40% (dps는 낮게 측정됨)
    // timestop = 14초

    if (this.timeCheckInterval(2, 10, 15)) {
      this.createEnemy(ID.enemy.donggramiEnemy.mini)
    }

    this.timePauseEnemyCount(14)

    if (this.timeCheckFrame(15)) {
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
  }

  roundPhase02 () {}
  roundPhase03 () {}
  roundPhase04 () {}

  display () {
    super.display()
    
    switch (this.courseName) {
      case 'a1': this.displayCoursePhaseA1(); break
      case 'b1': this.displayCoursePhaseB1(); break
      case 'c1': this.displayCoursePhaseC1(); break
    }
  }

  displayCoursePhaseA1 () {
    let phase1Start = this.phaseTime[1].startTime
    const imgD = imageDataInfo.round2_3_result // result 이미지 데이터 타겟을 위한 정보
    const imgSize = imageDataInfo.round2_3_result.complete // 모든 결과 이미지는 동일한 사이즈
    let showD = imgD.complete
    const centerX = graphicSystem.CANVAS_WIDTH_HALF - (imgSize.width / 2)

    // 2초간 준비 화면 보여짐
    if (this.timeCheckInterval(phase1Start + 3, phase1Start + 4)) {
      showD = imgD.ready
    } else if (this.timeCheckInterval(phase1Start + 5, phase1Start + 6)) { // 2초간 파이트 화면 보여짐
      showD = imgD.fight
    }

    // 전투 도중의 스탯 표시
    if (this.timeCheckInterval(phase1Start + 3, phase1Start + 50)) {
      // 플레이어의 체력값과 적의 체력값 표시
      digitalDisplay('PLAYER HP: ' + this.a1.playerHp + '%', 0, 70)
      digitalDisplay('ENEMY HP: ' + this.a1.enemyHp + '%', 450, 70)

      graphicSystem.imageView(imageSrc.round.round2_3_battle_status, 0, 0)
      this.donggramiNumberDisplay(this.a1.battleLeftTime, 375, 30) // 동그라미 숫자로 남은시간 표시

      // 플레이어의 체력은 왼쪽부터 오른쪽으로 이동하는 구조... 그리고 에니메이션 형태로 조작됨
      let percent = this.a1.playerHpEnimation / 100
      let divValue = 350 * percent
      let playerHpColor = this.a1.playerHpEnimationFrame % 3 === 0 ? 'green' : 'yellow' 
      graphicSystem.meterRect(350 - divValue, 30, divValue, 40, playerHpColor, 100, 100) // 엄밀히 따지면 meterRect를 사용하나 fillRect를 사용하나 같음

      // 적 체력 표시
      graphicSystem.meterRect(450, 30, 350, 40, 'red', this.a1.enemyHp, 100)
    }

    if (this.timeCheckInterval(phase1Start + 50, phase1Start + 54)) {
      if (this.a1.result === 'win') {
        showD = imgD.win
      } else if (this.a1.result === 'lose') {
        showD = imgD.lose
      } else if (this.a1.result === 'draw') {
        showD = imgD.draw
      }
    }
    
    // 이 결과를 보여주는 시간은 페이즈 시작하고 3 ~ 6초(준비, 시작) 그리고 51 ~ 54초(결과 화면)
    if (this.timeCheckInterval(phase1Start + 3, phase1Start + 6) || this.timeCheckInterval(phase1Start + 50, phase1Start + 54)) {
      graphicSystem.imageDisplay(imageSrc.round.round2_3_result, showD.x, showD.y, showD.width, showD.height, centerX, 200, showD.width, showD.height)
    }
  }

  donggramiNumberDisplay = game.graphic.createCustomNumberDisplay(imageSrc.number.round2_3_number, 30, 40)

  coursePhaseA1 () {
    const phase1Start = this.phaseTime[1].startTime

    // 준비 시간 (3초 후) 음악 재생 및 레디 표시
    if (this.timeCheckFrame(phase1Start + 3)) {
      this.musicChange(this.musicList.a1_battle_room)
      this.musicPlay() // change만으로는 음악 재생을 할 수 없기 때문에 play를 해야합니다.
      soundSystem.play(this.voiceList.ready)
    }

    // 준비 시간이 끝나고, 전투 시작 (이 때 적이 생성됩니다.)
    if (this.timeCheckFrame(phase1Start + 5)) {
      soundSystem.play(this.voiceList.fight)
      this.createEnemy(ID.enemy.donggramiSpace.a1_fighter)
    }

    // 전투에 관한 처리
    if (this.timeCheckInterval(phase1Start + 5, phase1Start + 49)) {
      this.coursePhaseA1PlayerDamage()
      this.coursePhaseA1EnemyDamage()
      this.coursePhaseA1PlayerAutoMove()
      this.coursePhaseA1PlayerHpEnimation()

      // 시간 감소
      if (this.currentTimeTotalFrame % 60 === 0) {
        this.a1.battleLeftTime--
      }

      const result = this.coursePhaseA1Result()
      if (result !== '') { // 결과값이 있을경우 그에 대한 처리
        this.setCurrentTime(phase1Start + 50) // 중복 처리 방지를 위한 시간 이동
        this.a1.result = result // 결과값 처리
        this.musicStop()
        this.playerMoveEnable() // 플레이어 이동 가능하도록 강제로 처리
        switch (result) {
          case 'win': soundSystem.play(this.voiceList.win); break
          case 'lose': soundSystem.play(this.voiceList.lose); break
          case 'draw': soundSystem.play(this.voiceList.draw); break
        }

        let enemy = this.getEnemyObject()[0]
        if (enemy != null) {
          enemy.state = 'end' // 적 상태 임의로 변경해서 전투 종료를 느껴지게끔 처리(적은 더이상 패턴을 사용하지 않음.)
        }
      }
    }

    // 다음 코스 선택 모드
    if (this.timeCheckFrame(phase1Start + 55)) {
      this.setCourseSelectMode()
    }
  }

  coursePhaseA1Result () {
    if (this.a1.playerHp <= 0 && this.a1.enemyHp >= 1) {
      return 'lose'
    } else if (this.a1.playerHp >= 1 && this.a1.enemyHp <= 0) {
      return 'win'
    } else if (this.a1.playerHp === 0 && this.a1.enemyHp === 0) {
      return 'draw'
    }

    if (this.a1.battleLeftTime === 0) {
      if (this.a1.playerHp > this.a1.enemyHp) {
        return 'win'
      } else if (this.a1.playerHp < this.a1.enemyHp) {
        return 'lose'
      } else if (this.a1.playerHp === this.a1.enemyHp) {
        return 'draw'
      }
    }

    return ''
  }

  /** (만약) 플레이어를 이동 불가능하게 설정했다면 해당 함수로 되돌려주세요. */
  playerMoveEnable () {
    let playerP = fieldState.getPlayerObject()
    playerP.isMoveEnable = true
  }

  /** 플레이어를 강제 이동시키기 위한 함수 */
  coursePhaseA1PlayerAutoMove () {
    let playerP = fieldState.getPlayerObject()
    if (this.a1.playerAutoMoveFrame >= 1) {
      this.a1.playerAutoMoveFrame--
      playerP.isMoveEnable = false
      let distanceX = this.a1.playerAutoMoveX - playerP.x
      let distanceY = this.a1.playerAutoMoveY - playerP.y
      playerP.x += distanceX / 10
      playerP.y += distanceY / 10
    } else {
      playerP.isMoveEnable = true
    }
  }

  coursePhaseA1PlayerHpEnimation () {
    // 플레이어 데미지 요소를 부드럽게 그리고 반짝이게 하기 위한 에니메이션 처리
    if (this.a1.playerHp < this.a1.playerHpEnimation && this.currentTimeTotalFrame % 2 === 0) {
      this.a1.playerHpEnimation--
      this.a1.playerHpEnimationFrame += 3
    }

    if (this.a1.playerHpEnimationFrame > 0) {
      this.a1.playerHpEnimationFrame--
    }
  }

  /** 적 데미지를 처리하기 위한 함수 */
  coursePhaseA1EnemyDamage () {
    let enemy = this.getEnemyObject()[0]

    // 적이 없거나 정해진 적이 아닐경우 함수 처리 무시
    if (enemy == null || enemy.id !== ID.enemy.donggramiSpace.a1_fighter) return

    const baseValue = 250000 // 실제 체력: 2000000
    if (enemy.hpMax - enemy.hp >= baseValue) {
      enemy.hp += baseValue
      this.a1.enemyHp -= 10
    }

    const someValue = baseValue / 10
    if (enemy.hpMax - enemy.hp >= someValue) {
      enemy.hp += someValue
      this.a1.enemyHp -= 1
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
    if (enemy == null || enemy.id !== ID.enemy.donggramiSpace.a1_fighter) return

    // 플레이어 무적 상태이면, 무시
    if (this.a1.invincibleFrame > 0) {
      this.a1.invincibleFrame--
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

    let damage = 0
    let isDamaged = false
    if (enemy.state === STATE_NORMAL && collision(playerP, enemyObject)) {
      isDamaged = true
      damage = 4
    } else if (enemy.state === STATE_BOOST && collision(playerP, enemyObject)) {
      isDamaged = true
      damage = 5
    } else if (enemy.state === STATE_HAMMER && collision(playerP, hammerObject)) {
      isDamaged = true
      damage = 12
    } else if (enemy.state === STATE_EARTHQUAKE) {
      if (collision(playerP, earthQuakeObject) || collision(playerP, earthQuakeObject2)) {
        isDamaged = true
        damage = 15
      }
    }

    // 데미지를 받은 경우, 사운드 및 플레이어 강제 이동 처리
    if (isDamaged) {
      soundSystem.play(soundSrc.round.r2_3_a1_damage)
      this.a1.playerHp -= damage
      this.a1.invincibleFrame = damage < 10 ? 30 : 90 // 무적프레임: 10데미지 미만 30, 이상 90
      this.a1.playerAutoMoveFrame = 30
      this.a1.playerAutoMoveX = (Math.random() * 120 - 60) + playerP.x

      // 지진상태에서는 연속적으로 맞지 않도록 위로 보내지고, 나머지는 상하 왔다갔다
      this.a1.playerAutoMoveY = this.state === STATE_EARTHQUAKE ? (Math.random() * 120 - 60) + 120 : (Math.random() * 240 - 120) + playerP.y
    }
  }

  
  displayCoursePhaseB1 () {
    const phase1Start = this.phaseTime[1].startTime
    const imgD = imageDataInfo.round2_3_result // result 이미지 데이터 타겟을 위한 정보
    const imgSize = imageDataInfo.round2_3_result.complete // 모든 결과 이미지는 동일한 사이즈
    let showD = imgD.complete
    const centerX = graphicSystem.CANVAS_WIDTH_HALF - (imgSize.width / 2)

    // 2초간 준비 화면 보여짐
    if (this.timeCheckInterval(phase1Start + 3, phase1Start + 4)) {
      showD = imgD.ready
    } else if (this.timeCheckInterval(phase1Start + 5, phase1Start + 6)) { // 2초간 파이트 화면 보여짐
      showD = imgD.start
    }

    if (this.timeCheckInterval(phase1Start + 51, phase1Start + 54)) {
      showD = imgD.complete
    }

    // 이 결과를 보여주는 시간은 페이즈 시작하고 3 ~ 6초(준비, 시작) 그리고 51 ~ 54초(결과 화면)
    if (this.timeCheckInterval(phase1Start + 3, phase1Start + 6) || this.timeCheckInterval(phase1Start + 51, phase1Start + 54)) {
      graphicSystem.imageDisplay(imageSrc.round.round2_3_result, showD.x, showD.y, showD.width, showD.height, centerX, 200, showD.width, showD.height)
    }
  }

  coursePhaseB1 () {
    const phase1Start = this.phaseTime[1].startTime
    if (this.timeCheckFrame(phase1Start + 3)) {
      this.musicChange(this.musicList.b1_jump_room)
      this.musicPlay()
      soundSystem.play(this.voiceList.ready)
    } else if (this.timeCheckFrame(phase1Start + 5)) {
      soundSystem.play(this.voiceList.start)
    }

    if (this.timeCheckInterval(phase1Start + 5, phase1Start + 50)) {
      if (this.getEnemyCount() < 10) {
        this.createEnemy(ID.enemy.donggramiSpace.b1_bounce)
      }

      // 충돌 처리
      let enemyArray = this.getEnemyObject()
      let playerP = this.getPlayerObject()
      for (let i = 0; i < enemyArray.length; i++) {
        let enemyC = enemyArray[i]
        if (enemyC.state === '' && collision(playerP, enemyC)) {
          enemyC.state = 'collision'
          soundSystem.play(soundSrc.round.r2_3_a1_damage)
          this.b1.playerAutoMoveFrame = 60
          this.b1.playerAutoMoveX = playerP.x + (Math.random() * 200) - 100
          this.b1.playerAutoMoveY = playerP.y + (Math.random() * 200) - 100
        }
      }
  
      // 플레이어 강제 이동 처리
      this.coursePhaseB1PlayerMove()
    }

    if (this.timeCheckFrame(phase1Start + 51)) {
      soundSystem.play(this.voiceList.complete)
      this.musicStop()
      this.playerMoveEnable()
    }

    if (this.timeCheckFrame(phase1Start + 55)) {
      this.setCourseSelectMode()
    }
  }

  coursePhaseB1PlayerMove () {
    // 이 알고리즘은 donggramiBounce 알고리즘을 참조함
    let playerP = this.getPlayerObject()
    playerP.isMoveEnable = false // 플레이어 이동 불가상태 (다만, 좌우로 이동 가능한데, 이 코드는 밑에 적어두었음)

    if (this.b1.playerAutoMoveFrame >= 1) {
      this.b1.playerAutoMoveFrame--
      let distanceX = (this.b1.playerAutoMoveX - playerP.x) / 10
      let distanceY = (this.b1.playerAutoMoveY - playerP.y) / 10
      playerP.x += distanceX
      playerP.y += distanceY
      return
    }

    this.b1.pBounceDelayCount++
    let count = (this.b1.pBounceDelayCount / this.b1.pBounceDelay) * 180
    let degree = Math.PI / 180 * count
    let sinValue = Math.sin(degree)

    // 절반의 딜레이 시간동안 추락하고, 절반의 딜레이 시간동안 올라갑니다.
    // 이렇게 한 이유는, sin 값이 0 ~ 1 ~ 0 식으로 변화하기 때문
    if (this.b1.pBounceDelayCount < this.b1.pBounceDelay / 2) {
      playerP.y += this.b1.pBounceSpeed * sinValue

      if (playerP.y + playerP.height > game.graphic.CANVAS_HEIGHT) {
        // 화면 밑으로 이미 내려갔다면, 딜레이값을 조정해 강제로 위로 올라가도록 처리
        this.b1.pBounceDelayCount = this.b1.pBounceDelay / 2
      } else if (this.b1.pBounceDelayCount >= (this.b1.pBounceDelay / 2) - 2) {
        // 다만, 내려갈 때에는 하면 맨 밑에 닿지 않으면 계속 내려가도록 딜레이를 직접적으로 조정
        this.b1.pBounceDelayCount--
      }
    } else {
      playerP.y -= this.b1.pBounceSpeed * sinValue
    }

    // 카운트가 일정 값을 넘어가면 리셋 (이렇게 하지 않으면 잘못된 형태로 바운스됨)
    if (this.b1.pBounceDelayCount >= this.b1.pBounceDelay) {
      this.b1.pBounceDelayCount -= this.b1.pBounceDelay
    }

    // 좌우로만 이동 가능
    if (game.control.getButtonDown(game.control.buttonIndex.LEFT)) {
      playerP.x -= playerP.moveSpeedX
    }
    
    if (game.control.getButtonDown(game.control.buttonIndex.RIGHT)) {
      playerP.x += playerP.moveSpeedX
    }
  }

  displayCoursePhaseC1 () {
    const phase1Start = this.phaseTime[1].startTime
    const imgD = imageDataInfo.round2_3_result // result 이미지 데이터 타겟을 위한 정보
    const imgSize = imageDataInfo.round2_3_result.complete // 모든 결과 이미지는 동일한 사이즈
    let showD = imgD.complete
    const centerX = graphicSystem.CANVAS_WIDTH_HALF - (imgSize.width / 2)

    // 2초간 준비 화면 보여짐
    if (this.timeCheckInterval(phase1Start + 3, phase1Start + 4)) {
      showD = imgD.ready
    } else if (this.timeCheckInterval(phase1Start + 5, phase1Start + 6)) { // 2초간 파이트 화면 보여짐
      showD = imgD.start
    }

    if (this.timeCheckInterval(phase1Start + 5, phase1Start + 50)) {
      digitalDisplay('TIME LEFT: ', 10, 10)
      this.donggramiNumberDisplay(phase1Start + 50 - this.currentTime, 120, 10)

      digitalDisplay('TOTAL DAMAGED: ', 10, 50)
      this.donggramiNumberDisplay(this.c1.totalDamage, 180, 50)
    }

    if (this.timeCheckInterval(phase1Start + 51, phase1Start + 54)) {
      showD = imgD.complete
    }

    // 이 결과를 보여주는 시간은 페이즈 시작하고 3 ~ 6초(준비, 시작) 그리고 51 ~ 54초(결과 화면)
    if (this.timeCheckInterval(phase1Start + 3, phase1Start + 6) || this.timeCheckInterval(phase1Start + 51, phase1Start + 54)) {
      graphicSystem.imageDisplay(imageSrc.round.round2_3_result, showD.x, showD.y, showD.width, showD.height, centerX, 200, showD.width, showD.height)
    }
  }

  coursePhaseC1 () {
    const phase1Start = this.phaseTime[1].startTime

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

    if (this.timeCheckFrame(phase1Start + 3)) {
      this.musicChange(this.musicList.c1_bullet_room)
      this.musicPlay()
      soundSystem.play(this.voiceList.ready)
    } else if (this.timeCheckFrame(phase1Start + 5)) {
      soundSystem.play(this.voiceList.start)
    }

    if (this.timeCheckInterval(phase1Start + 5, phase1Start + 50)) {
      if (this.timeCheckInterval(phase1Start + 5, phase1Start + 12, 6)) {
        fieldState.createEnemyBulletObject(BulletBase)
      } else if (this.timeCheckInterval(phase1Start + 13, phase1Start + 19, 6)) {
        fieldState.createEnemyBulletObject(BulletPlayer)
      } else if (this.timeCheckInterval(phase1Start + 20, phase1Start + 27, 4)) {
        fieldState.createEnemyBulletObject(BulletRain)
      } else if (this.timeCheckInterval(phase1Start + 28, phase1Start + 34, 4)) {
        fieldState.createEnemyBulletObject(BulletLeft)
      } else if (this.timeCheckInterval(phase1Start + 35, phase1Start + 50, 4)) {
        let random = Math.floor(Math.random() * 4)
        switch (random) {
          case 0: fieldState.createEnemyBulletObject(BulletBase); break
          case 1: fieldState.createEnemyBulletObject(BulletPlayer); break
          case 2: fieldState.createEnemyBulletObject(BulletRain); break
          case 3: fieldState.createEnemyBulletObject(BulletLeft); break
        }
      }
    }

    let playerP = this.getPlayerObject()
    if (this.timeCheckInterval(phase1Start + 5, phase1Start + 50) && playerP.shield < playerP.shieldMax) {
      playerP.shield += 1
      this.c1.pHp -= 1
      this.c1.totalDamage += 1
      soundSystem.play(soundSrc.round.r2_3_a1_damage)
    }

    if (this.timeCheckFrame(phase1Start + 51)) {
      this.musicStop()
      soundSystem.play(this.voiceList.complete)
    }

    if (this.timeCheckFrame(phase1Start + 55)) {
      this.setCourseSelectMode()
    }
  }

  coursePhaseA2 () {
    
  }

  displayCoursePhaseA2 () {

  }

  coursePhaseA3 () {

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
dataExportRound.set(ID.round.round2_1, Round2_1)
dataExportRound.set(ID.round.round2_2, Round2_2)
dataExportRound.set(ID.round.round2_3, Round2_3)
