//@ts-check

import { CustomEffect } from "./dataEffect.js"
import { DelayData, FieldData } from "./dataField.js"
import { fieldState } from "./field.js"
import { game, gameFunction } from "./game.js"
import { imageDataInfo, imageSrc } from "./imageSrc.js"
import { soundSrc } from "./soundSrc.js"

/**
 * 엔티티 데이터가 정의해야 하는 표준 함수들.
 * 
 * 만약 process, display 기능이 없다고 하더래도 반드시 함수는 구현되어야 합니다.
 * 
 * @typedef {Object} EntityData
 * @property {() => void} process
 * @property {(x: number, y: number) => void} display
 */

/**
 * @implements {EntityData}
 */
export class DonggramiEntity {
  static TALK_STATES = {
    NONE: 0,
    TALK: 73187,
    EMOJI: 74279,
    EMOJICATCH: 75328
  }

  static TALK_INDEXS = {
    /** talk index가 정의되어있지 않은 경우 */ NULL: -1,
    /** talk index가 사용되지 않는 경우 */ UNUSED: -2, 
  }

  /** 동그라미가 죽을 때 나오는 사운드 */
  static DONGGRAMI_DIE_SOUND = soundSrc.enemyDie.enemyDieDonggrami

  /** @deprecated 나중에 새로 변경됨 */
  static MESSAGE_EMOJICATCH = 'emojicatch'

  /** 동그라미가 죽으면 화면 밑으로 내려가는 속도 값 */
  static DIE_FALL_SPEED = 10

  static STATES = {
    NORMAL: FieldData.state.NORMAL,
    R2_3_PLAYER_COLLISION: 13742568,
    R2_3_PLAYER_COLLISION_PROCESSING: 13742593,
    R2_AUTOMOVE: 14750826,
    SPEED_BOOST: 15672762,
    /** 느낌표 진행 상태 */ EXCLMATION_PROCESS: 30174266,
    /** 느낌표를 띄운 이후 도망치는 상태 */ EXCLMATION_RUN: 30186729,
    /** 느낌표 이후의 상태 */ EXCLMATION_STATE_AFTER: 30195726,
    /** 물음표 상태 */ QUESTION_PROCESSING: 30204937,
    /** 추적 상태 */ QUESTION_CHASE: 30205769,
    /** 멈춤 상태 */ QUESTION_STOP: 30227562,
    /** 이후 상태 */ QUESTION_AFTER: 30244672,
  }
  
  /** 참고: 일부 적들은 이 타입을 사용하지 않고 함수를 상속받아서 임의로 구현함 */
  static TalkTypeList = {
    /** 아무것도 없음 */ NOTHING: 0,
    /** 이모지, 이모지를 출력하는 용도로만 사용 (대화 불가능) */ EMOJI: 1,
    /** 일반형 */ NORMAL: 2,
    /** 쇼핑형, 라운드 2-2 */ SHOPPING: 3,
    /** 파티형, 라운드 2-4, 2-6 */ PARTY: 4,
    /** 폐허, 라운드 2-6 */ RUIN: 5,
    /** 라운드 2-4에서 동그라미가 도망쳐라는것을 외칠 때 사용 */ R2_4RUN: 6,
    /** 라운드 3-9, 3-10에서 동그람가 길을 잃은 경우 */ R3_GETLOST: 7,
    /** 라운드 3-12 마지막에서 동그라미 마을에 돌아온 플레이어를 환영하는 경우 */ R3_RETURNTO: 8,
  }

  
  /** 색깔의 그룹 (참고: light, normal, dark는 서로 구분되지 않음.) */
  static colorGroup = {
    /** 파랑 */ BLUE: 1,
    /** 초록 */ GREEN: 2,
    /** 주황(오렌지) */ ORANGE: 3,
    /** 노랑 */ YELLOW: 4,
    /** 빨강 */ RED: 5,
    /** 보라(퍼플) */ PURPLE: 6,
    /** 일반색 계열(파랑, 초록, 주황, 노랑, 빨강, 보라) */ NORMAL: 7,
    /** 무채색 (하양, 회색, 검정) - 참고: 각 색을 분리할 수 없음 */ ACHROMATIC: 8,
    /** 특수색 (골드, 실버, 스카이블루, 핑크, 시안, 마젠타) - 참고: 각 색을 분리할 수 없음 */ ANOTHER: 9,
    /** 혼합색 - 참고: 각 색을 분리할 수 없음 */ MIX: 10,
    /** 모든색 */ ALL: 11,
    /** 빅1 - 어두운 파랑(보스전용) */ BIG1: 12,
    /** 빅2 - 어두운 빨강(보스전용) */ BIG2: 13
  }

  /** 동그라미가 사용하는 이모지 리스트(단, 모든 동그라미 클래스가 사용하는것은 아닙니다.) */
  static EmojiList = {
    /** 웃음, 스마일 */ SMILE: 0,
    /** 행복, 해피 */ HAPPY: 1,
    /** 분노, 화남 */ ANGRY: 2,
    /** 웃음과슬픔, 행폭 새드 */ HAPPYSAD: 3,
    /** 찌푸림, 프로운 */ FROWN: 4,
    /** 슬픔, 새드 */ SAD: 5,
    /** 놀람, 어메이즈 */ AMAZE: 6,
    /** 아무것도 아님, 낫씽 */ NOTHING: 7,
    /** 생각중, 띵킹 */ THINKING: 8,
  }

  static BUFFER_INDEXS = {
    STATE: 0,
    RESULT_MESSAGE: 1,
  }

  static BUFFER_R2_3_STATES = {
    NO_MESSAGE: 0,
    AREA_A_WIN: 15411,
    AREA_A_LOSE: 15412,
    AREA_A_DRAW: 15413,
    AREA_A_END: 15414,
    A1_NORMAL: 1,
    A1_BOOST: 2,
    A1_HAMMER: 3,
    A1_EARTHQUAKE: 4,
  }

  /** 
   * 동그라미 객체의 서브타입이 이모지임을 가리키는 타입 상수
   * 
   * 이 변수는 이모지를 사용하는 동그라미 객체에서만 사용됩니다.
   */
  static SUBTYPE_EMOJI = 232288

  static BASE_SPEED = 3

  /** 이것은 스프라이트에게 전달하기 위한 값입니다. */
  static BASE_HP = 50000

  constructor () {
    this.imageSrc = imageSrc.enemy.donggramiEnemy
    this.imageData = imageDataInfo.donggramiEnemy.blue

    this.outputWidth = this.imageData.width
    this.outputHeight = this.imageData.height

    this.color = ''
    this.colorNumber = 0
    this.setDonggramiColor(DonggramiEntity.colorGroup.ALL)

    /** 대화 상태, (이모지 표현 포함) */ this.talkState = DonggramiEntity.TALK_STATES.NONE
    /** 이모지 타입 */ this.emojiType = 0

    // 대화 딜레이는 기준값의 +-60 랜덤 지정
    const inputTalkDelay = Math.floor(Math.random() * 120) - 60
    /** 대화 기본 지연시간 */ this.TALK_DELAY = 180
    /** 대화 종료 기본시간 */ this.TALK_END_DELAY = 300
    this.talkDelay = new DelayData(this.TALK_DELAY + inputTalkDelay)
    this.TALK_TYPES = DonggramiEntity.TalkTypeList
    this.talkType = this.TALK_TYPES.NOTHING

    /** 
     * 현재 대화값의 인덱스 (이미지를 간접 참조하기 때문에 인덱스 번호로 지정됨),
     * -1인경우 초기화되지 않은 상태, 따라서 초기화를 해야함
     */ 
    this.talkIndex = {x: DonggramiEntity.TALK_INDEXS.NULL, y: DonggramiEntity.TALK_INDEXS.NULL}

    /** 이모지를 받은 상태와 관련한 딜레이 */ this.catchEmojiDelay = new DelayData(300)
  }

  /** 
   * 랜덤한 대화 인덱스를 지정합니다. this.talkType에 따라 결과가 달라짐
   * 
   * 일부 객체는 이 함수를 상속받고 다른 결과를 낼 수 있음.
   */
  setTalkIndex () {
    // x축 값만 따지는 이유는, 어차피 한쪽만 unused되어도 출력을 못하기 때문
    // unused 상태라면, 아예 대화하지 않는다는 뜻이므로 그대로 적용
    if (this.talkIndex.x === DonggramiEntity.TALK_INDEXS.UNUSED) return

    // 이 값은 이미지파일 ./image/enemy/donggramiEnemyTalkList.png 참고
    // 거기에 나와있는 텍스트 종류에 따라 적힌 값임
    const INDEX_NORMAL_X = 0
    const INDEX_SHOPPING_X = 1
    const INDEX_PARTY_X = 2
    const INDEX_RUIN_X = 3
    const INDEX_NORMAL_LENGTH = 19
    const INDEX_SHOPPING_LENGTH = 15
    const INDEX_PARTY_LENGTH = 14
    const INDEX_RUIN_LENGTH = 4
    const INDEX_R2_4RUN_X = 2
    const INDEX_R2_4RUN_Y = 15
    const INDEX_R3_GETLOST_X = 5
    const INDEX_R3_GETLOST_Y = 8
    const INDEX_R3_GETLOST_LENGTH = 5
    const INDEX_R3_RETURNTO_X = 5
    const INDEX_R3_RETURNTO_Y = 14
    const INDEX_R3_RETURNTO_LENGTH = 6

    if (this.talkType === DonggramiEntity.TalkTypeList.NORMAL) {
      this.talkIndex.x = INDEX_NORMAL_X
      this.talkIndex.y = Math.floor(Math.random() * INDEX_NORMAL_LENGTH)
    } else if (this.talkType === DonggramiEntity.TalkTypeList.SHOPPING) {
      this.talkIndex.x = INDEX_SHOPPING_X
      this.talkIndex.y = Math.floor(Math.random() * INDEX_SHOPPING_LENGTH)
    } else if (this.talkType === DonggramiEntity.TalkTypeList.PARTY) {
      this.talkIndex.x = INDEX_PARTY_X
      this.talkIndex.y = Math.floor(Math.random() * INDEX_PARTY_LENGTH)
    } else if (this.talkType === DonggramiEntity.TalkTypeList.R2_4RUN) {
      this.talkIndex.x = INDEX_R2_4RUN_X
      this.talkIndex.y = INDEX_R2_4RUN_Y
    } else if (this.talkType === DonggramiEntity.TalkTypeList.RUIN) {
      this.talkIndex.x = INDEX_RUIN_X
      this.talkIndex.y = Math.floor(Math.random() * INDEX_RUIN_LENGTH)
    } else if (this.talkType === DonggramiEntity.TalkTypeList.R3_GETLOST) {
      this.talkIndex.x = INDEX_R3_GETLOST_X
      this.talkIndex.y = INDEX_R3_GETLOST_Y + Math.floor(Math.random() * INDEX_R3_GETLOST_LENGTH)
    } else if (this.talkType === DonggramiEntity.TalkTypeList.R3_RETURNTO)  {
      this.talkIndex.x = INDEX_R3_RETURNTO_X
      this.talkIndex.y = INDEX_R3_RETURNTO_Y + Math.floor(Math.random() * INDEX_R3_RETURNTO_LENGTH)
    } else {
      this.talkIndex.x = DonggramiEntity.TALK_INDEXS.UNUSED
      this.talkIndex.y = DonggramiEntity.TALK_INDEXS.UNUSED
    }
  }

  getTalkRandomDelay () {
    return 180 + Math.floor(Math.random() * 120) - 60
  }

  /**  동그라미적의 이미지 데이터 리스트 (이것을 이용하여 동그라미 이미지 데이터를 리턴) */
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

  /** 컬러 인덱스, 이 값은 특수한 상황에서만 사용되어 기능이 적게 구현되어 있습니다.
   * 순서는 imageDataList를 참고해주세요.
   */
  static COLOR_INDEXS = {
    LIGHT_BLUE: 0,
    DARK_BLUE: 2
  }

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
   * @param {number} colorOption 색깔의 종류: 주의: DonggramiEnemy 클래스가 가지고 있는 static 변수의 colorGroup 변수의 값을 사용해주세요.
   */
  static getColorNumberByGroupColorNumber (colorOption = 20) {
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

  /** 
   * 각 이모지에 대한 이미지 데이터를 얻습니다.
   * @param {number} emojiNumber imogeList에 있는 이모지 이름
   */
  static getEmojiImageData (emojiNumber) {
    switch (emojiNumber) {
      case DonggramiEntity.EmojiList.SMILE: return imageDataInfo.donggramiEnemy.EmojiSmile
      case DonggramiEntity.EmojiList.HAPPY: return imageDataInfo.donggramiEnemy.EmojiHappy
      case DonggramiEntity.EmojiList.HAPPYSAD: return imageDataInfo.donggramiEnemy.EmojiHappySad
      case DonggramiEntity.EmojiList.AMAZE: return imageDataInfo.donggramiEnemy.EmojiAmaze
      case DonggramiEntity.EmojiList.FROWN: return imageDataInfo.donggramiEnemy.EmojiFrown
      case DonggramiEntity.EmojiList.THINKING: return imageDataInfo.donggramiEnemy.EmojiThinking
      case DonggramiEntity.EmojiList.NOTHING: return null
      case DonggramiEntity.EmojiList.SAD: return imageDataInfo.donggramiEnemy.EmojiSad
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
   * @param {number} groupNumber 색깔의 종류: 주의: DonggramiEnemy 클래스가 가지고 있는 static 변수의 colorGroup 변수의 값을 사용해주세요.
   * 단 인수값이 없으면 모든 색을 대상으로 함.
   */
  setDonggramiColor (groupNumber = 0) {
    this.colorNumber = DonggramiEntity.getColorNumberByGroupColorNumber(groupNumber)
    this.imageData = DonggramiEntity.imageDataList[this.colorNumber]
    this.color = DonggramiEntity.colorText[this.colorNumber]
  }

  /** 
   * 동그라미 색상을 특정 값으로 강제 설정합니다.
   * 다만, 이 함수는 문자열로 받는게 아니라 인덱스로 받는 구조임을 주의해주세요.  
   * 
   * 이 함수는 특수한 경우에만 쓰이므로, 기능이 완벽하게 구현되지 않았습니다.
   */
  setDonggramiColorIndex (colorNumber = 0) {
    this.colorNumber = colorNumber
    this.imageData = DonggramiEntity.imageDataList[this.colorNumber]
    this.color = DonggramiEntity.colorText[this.colorNumber]
  }

  /** 느낌표 이펙트 데이터 */
  static exclamationMarkEffect = new CustomEffect(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.exclamationMark, 40, 40, 4, 1)

  /** 느낌표 이펙트 짧게 표시용 */
  static exclamationMarkEffectShort = new CustomEffect(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.exclamationMark, 40, 40, 3, 1)

  /** 물음표 이펙트 데이터 */
  static questionMarkEffect = new CustomEffect(imageSrc.enemy.donggramiEnemy, imageDataInfo.donggramiEnemy.questionMark, 40, 40, 5, 2)

  /** 이모지를 받는 설정을 합니다. 이모지에 반응할 확률은 50% */
  setCatchEmoji () {
    // 대화타입이 일반, 파티, 쇼핑에만 영향을 끼침
    const condition = this.talkType === this.TALK_TYPES.NORMAL
      || this.talkType === this.TALK_TYPES.PARTY
      || this.talkType === this.TALK_TYPES.SHOPPING
    if (!condition) return // 그외는 해당사항 없음

    let random = Math.floor(Math.random() * 100)
    if (random < 50) {
      this.talkDelay.countReset() // 카운트 리셋
      this.talkState = DonggramiEntity.TALK_STATES.EMOJICATCH
    }
  }

  process () {
    this.processMessage()
    this.processTalk()
  }

  processMessage () {
    if (this.message === DonggramiEntity.MESSAGE_EMOJICATCH) {
      this.message = '' // 메세지 제거
      this.setCatchEmoji() // 그리고 강제로 이모지를 받는 설정
    }
  }

  processTalk () {
    // 대화가 없거나, 이모지를 사용하면 리턴
    if (this.talkType === this.TALK_TYPES.NOTHING) return
    if (this.talkType === this.TALK_TYPES.EMOJI) return
    
    // 딜레이 체크
    if (!this.talkDelay.check()) return

    // 상태 변경, 딜레이 재조정
    const inputTalkDelay = Math.floor(Math.random() * 120) - 60
    if (this.talkState === DonggramiEntity.TALK_STATES.NONE) {
      this.talkState = DonggramiEntity.TALK_STATES.TALK
      this.talkDelay.setDelay(this.TALK_END_DELAY + inputTalkDelay)
    } else {
      this.talkState = DonggramiEntity.TALK_STATES.NONE
      this.talkDelay.setDelay(this.TALK_DELAY + inputTalkDelay)
    }

    // 대화 초기화 (만약 없다면)
    if (this.talkIndex.x === -1) {
      this.setTalkIndex()
    }
  }

  /** @type {EntityData['display']} */
  display (x, y) {
    this.displayDonggrami(x, y)

    // 주의: state랑 변수명이 다름
    // 대화 상태가 대화일때는 대화 표시, 이모지 상태일때는 이모지 표시
    if (this.talkState === DonggramiEntity.TALK_STATES.TALK) this.displayTalk(x, y)
    if (this.talkState === DonggramiEntity.TALK_STATES.EMOJI) this.displayEmoji(x, y)
  }

  /** @type {EntityData['display']} */
  displayDonggrami (x, y) {
    gameFunction.imageObjectDisplay(this.imageSrc, this.imageData, x, y, this.outputWidth, this.outputHeight)
  }

  /** @type {EntityData['display']} */
  displayTalk (x, y) {
    // 대화가 초기화되지 않은 경우 강제 함수 종료
    if (this.talkIndex.x === DonggramiEntity.TALK_INDEXS.NULL) return
    if (this.talkIndex.x === DonggramiEntity.TALK_INDEXS.UNUSED) return
    if (this.talkIndex.y === DonggramiEntity.TALK_INDEXS.NULL) return
    if (this.talkIndex.y === DonggramiEntity.TALK_INDEXS.UNUSED) return

    const imgDspeech = imageDataInfo.donggramiEnemy.speechBubble
    const borderHeight = 60

    // 스피치버블의 출력 위치는, 위쪽에 출력하면서 동시에 오브젝트에 겹치지 않아야 합니다.
    // 그래서 예상 크기만큼을 y축에서 뺍니다.
    // x축의 경우, 여백 구간을 조금 더 추가합니다.
    const speechBubbleX = x
    const speechBubbleY = y - borderHeight

    // 스피치 버블, 테일 출력
    gameFunction.imageObjectDisplay(imageSrc.enemy.donggramiEnemy, imgDspeech, speechBubbleX, speechBubbleY)

    const TALKTEXTWIDTH = imageDataInfo.donggramiEnemy.textArea.width
    const TALKTEXTHEIGHT = imageDataInfo.donggramiEnemy.textArea.height
    const TEXTLAYERX = x + 5
    const TEXTLAYERY = speechBubbleY + 5
    game.graphic.imageDisplay(
      imageSrc.enemy.donggramiEnemyTalkList, 
      TALKTEXTWIDTH * this.talkIndex.x, 
      TALKTEXTHEIGHT * this.talkIndex.y, 
      TALKTEXTWIDTH,
      TALKTEXTHEIGHT,
      TEXTLAYERX,
      TEXTLAYERY,
      TALKTEXTWIDTH,
      TALKTEXTHEIGHT
    )
  }

  /** @type {EntityData['display']} */
  displayEmoji (x, y) {
    const src = imageSrc.enemy.donggramiEnemy
    const imgD = imageDataInfo.donggramiEnemy
    const typeList = DonggramiEntity.EmojiList
    const EMOJIHEIGHT = imgD.EmojiAmaze.height
    switch (this.emojiType) {
      case typeList.AMAZE: gameFunction.imageObjectDisplay(src, imgD.EmojiAmaze, x, y - EMOJIHEIGHT); break
      case typeList.ANGRY: gameFunction.imageObjectDisplay(src, imgD.EmojiAngry, x, y - EMOJIHEIGHT); break
      case typeList.FROWN: gameFunction.imageObjectDisplay(src, imgD.EmojiFrown, x, y - EMOJIHEIGHT); break
      case typeList.HAPPY: gameFunction.imageObjectDisplay(src, imgD.EmojiHappy, x, y - EMOJIHEIGHT); break
      case typeList.HAPPYSAD: gameFunction.imageObjectDisplay(src, imgD.EmojiHappySad, x, y - EMOJIHEIGHT); break
      case typeList.SAD: gameFunction.imageObjectDisplay(src, imgD.EmojiSad, x, y - EMOJIHEIGHT); break
      case typeList.SMILE: gameFunction.imageObjectDisplay(src, imgD.EmojiSmile, x, y - EMOJIHEIGHT); break
      case typeList.THINKING: gameFunction.imageObjectDisplay(src, imgD.EmojiThinking, x, y - EMOJIHEIGHT); break
    }
  }

  static EmojiThrowObject = class extends FieldData {
    constructor () {
      super()
      this.moveDelay = new DelayData(30)
      this.stateDelay = new DelayData(240)
      this.EMOJIHEIGHT = imageDataInfo.donggramiEnemy.EmojiAmaze.height
    }

    processState () {
      // 일정 시간 지나면 삭제함
      if (this.stateDelay.check()) {
        this.targetObject = null // 타겟오브젝트 제거
        this.isDeleted = true // 그리고 삭제
      }
    }

    setEmojiType (emojiType = 0) {
      const src = imageSrc.enemy.donggramiEnemy
      const imgD = imageDataInfo.donggramiEnemy
      const typeList = DonggramiEntity.EmojiList
      switch (emojiType) {
        case typeList.AMAZE: this.setAutoImageData(src, imgD.EmojiAmaze); break
        case typeList.ANGRY: this.setAutoImageData(src, imgD.EmojiAngry); break
        case typeList.FROWN: this.setAutoImageData(src, imgD.EmojiFrown); break
        case typeList.HAPPY: this.setAutoImageData(src, imgD.EmojiHappy); break
        case typeList.HAPPYSAD: this.setAutoImageData(src, imgD.EmojiHappySad); break
        case typeList.SAD: this.setAutoImageData(src, imgD.EmojiSad); break
        case typeList.SMILE: this.setAutoImageData(src, imgD.EmojiSmile); break
        case typeList.THINKING: this.setAutoImageData(src, imgD.EmojiThinking); break
      }
    }

    /** 
     * 임의의 타겟 오브젝트를 삽입합니다.
     * @param {FieldData | undefined} [sendObject=undefined] 이모지를 보낸 오브젝트
     */
    randomTargetObject (sendObject = undefined) {
      // 적 수를 먼저 가져오고, 여기서 마지막 번호에 당첨되면, 대상을 플레이어로 변경함
      let enemy = fieldState.getEnemyObject()
      let targetNumber = Math.floor(Math.random() * enemy.length)
      let createIdCode = -1
      if (sendObject != null) {
        createIdCode = sendObject.createId
      }

      // 무작위 적을 상대로, 이모지를 던짐, 단 그것이 DonggramiEnemy여야만 함
      if (enemy[targetNumber] instanceof DonggramiEntity) {
        // 만약 그 대상이 자기 자신인경우에는, 플레이어에게 던짐
        if (createIdCode === enemy[targetNumber].createId) {
          this.targetObject = fieldState.getPlayerObject()
        } else {
          enemy[targetNumber].message = DonggramiEntity.MESSAGE_EMOJICATCH // 메세지 강제 전송
          this.targetObject = enemy[targetNumber]
        }
      } else {
        // 그러나, 대상이 잘못 찾아진 경우, 이 이모지는 무효가 되어 삭제됨
        this.targetObject = null
        this.isDeleted = true
      }

      this.moveDelay.countReset()
    }

    processMove () {
      if (this.targetObject != null && this.targetObject instanceof FieldData) {
        if (this.moveDelay.check(false, true)) {
          // 강제 이동 (무조건 해당 타겟 좌표에 닿도록)
          this.x = this.targetObject.x
          this.y = this.targetObject.y - this.EMOJIHEIGHT
        } else {
          // 추적 이동
          let speedX = (this.targetObject.x - this.x) / (this.moveDelay.delay - this.moveDelay.count)
          let speedY = (this.targetObject.y - this.y - this.EMOJIHEIGHT) / (this.moveDelay.delay - this.moveDelay.count)
          this.setMoveSpeed(speedX, speedY)
          super.processMove()
        }

        // 만약 타겟오브젝트가 사라진 경우, 이 오브젝트는 삭제됨
        if (this.targetObject.isDeleted) this.isDeleted = true
      }

      if (this.targetObject == null) {
        this.isDeleted = true
      }
    }
  }
}


/** 라운드 내에서 적과의 통신을 위해 사용되는 메세지 목록 */
export class RoundCommonMessages {
  static COMMON_INDEXS = {
    STATE: 0,
  }

  static ROUND1_4_JEMUL_BOSS = {
    DIE: 17228,
    STOP: 17229,
  }
  static ROUND3_8_GABUDAN_BOSS = {
    MUSIC_START: 17228,
    MUSIC_STOP: 17229,
    NO_MESSAGE: 0,
  }
}