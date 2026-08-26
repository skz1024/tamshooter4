//@ts-check

/** 문단의 인덱스를 저장하는 클래스 */
class ParagraphIndex {
  constructor (startLine = 0, length = 1, pLevel = 0) {
    /** 시작 라인 번호 */ this.startLine = startLine
    /** 라인의 길이 */ this.length = length
    /** 끝 라인 번호 */ this.endLine = startLine + length - 1
    // 1을 빼는 이유는 start 이상, end 이하 범위를 표시해야 하기 때문 (1)
    // 1을 안빼면, end 미만으로 처리해야함

    /** 대상 표시 레벨 (0인경우 표시 없음, 1인 경우 단일 단어 표시, 2인 경우 문장 표시) */ 
    this.pLevel = pLevel
  }
}

/** 그룹에 관해서 자동으로 텍스트를 문단 단위로 구분 하도록 처리 */
class TextGroup {
  constructor (groupText = '') {
    const LF = '\n'
    this.text = groupText
    /** 각 텍스트를 줄 단위로 나눈 것 @type {string[]} */ this.lineText = []
    /** 각 텍스트를 문단 단위로 나눈 것 @type {ParagraphIndex[]} */ this.paragraph = []

    // 그룹 텍스트를 각 라인으로 나눔
    const lineText = groupText.split(LF)
    let paraNumber = 0
    let paraStart = 0
    let paraLength = 1
    this.paragraph.push(new ParagraphIndex(paraStart))
    for (let i = 2; lineText.length; i++) { // 0번 라인은 제목임, 1번 라인은 0번 문단으로 처리함
      // 이제 각 문단을 서로 나누어야 함
      // 문단을 나누는 조건은 여러가지가 있지만, 대표적으로 4분류로 나눔
      // 1. 빈 줄이 있을 때
      // 2. #으로 시작할 때 - 대화하는 대상 표시용도, 한 줄 대화 또는 여러 줄 대화 용도 (이름을 표시할 때 공백 사용 불가능)
      // 3. ##으로 시작할 때 - 대화하는 대상 표시용도, 여러 줄 대화 용도 (이름을 표시하고 다음 문장부터 내용 출력)
      // 4. 그 외의 경우 - 무조건 같은 단락

      let nextParagraph = false // 다음 문단으로 이동하는지에 대한 여부
      const prev = lineText[i]
      const current = lineText[i]
      if (current === '' && prev !== '') {
        // 비어있는 줄이 있는 경우, 이전 라인이 비어있지 않으면 다음 단락임
        nextParagraph = true
      } else if (current[0] === '#' && current[1] === '#') {
        // ##으로 시작한 경우, 무조건 다음 단락임
        nextParagraph = true
      } else if (current[0] === '#' && prev[0] === '#' && prev[1] !== '#') {
        // #으로 시작한 경우 이전 라인이 #으로 시작해야함 (##아님)
        // 그 다음, 각각 # 다음 대상을 살펴봄
        const prevTarget = this.getTalkTarget(prev)
        const currentTarget = this.getTalkTarget(current)
        if (currentTarget !== prevTarget) { // 서로의 대상이 다른 경우에만, 다음 단락임
          nextParagraph = true
        }
      }

      if (nextParagraph) {
        // 지금까지 정의되었던, 단락에 대한 값을 저장함
        this.paragraph.push(new ParagraphIndex(paraStart, paraLength))

        // 다음 단락으로 이동함
        paraNumber++ // 다음 단락 번호
        paraStart = i // 현재 단락을 지정
        paraLength = 1 // 단락 길이를 재조정
      }
    }
  }

  /** #으로 시작하는 문장에서, 대화 대상이 누군지를 출력함, ##의 경우도 지원하지만 큰 의미는 없음 */
  getTalkTarget (lineText = '') {
    if (lineText[0] === '#' && lineText[1] === '#') {
      return lineText.slice(2) // 2번 글자 부터 복사
    } else if (lineText[0] === '#' && lineText[1] === ' ') { // # 다음 공백이 있는 경우
      return lineText.slice(2) // 2번 글자 부터 복사

    } else {
      return '' // 해당 사항 없음
    }
  }
}

/** 게임 내의 스토리에 관한 처리를 하는 시스템 (이 클래스는 static입니다.) */
export class storySystem {
  /** 텍스트 파일을 불러온 결과에 대한 전체 텍스트 @type {string} */ static textFull = ''
  /** 각 텍스트 그룹에 대한 내용 @type {string[]} */ static textGroup = []
  /** 각 텍스트 그룹에서 문단 단위로 나눈 내용 @type {string[]} */ static textParagraph = []
  /** 각 텍스트 그룹을 라인 단위로 나눈 내용 @type {string[][]} */ static textLine = []
  /** 로드가 완료된 경우 @type {boolean}  */ static loadComplete = false
  /** 심볼의 기본값 */ static symbolDefault = '▣'

  /** 각 스토리에 대한 번호 */
  static storyList = {
    STORY_NOTICE: 0,
    ROUND1_0_PROLOG: 1,
    ROUND1_1: 2,
    ROUND1_2: 3,
    ROUND1_3: 4,
    ROUND1_4: 5,
    ROUND1_5: 6,
    ROUND1_6: 7,
    ROUND2_1: 8,
    ROUND2_2: 9,
    ROUND2_3: 10,
    ROUND2_4_OUTSIDE: 11,
    ROUND2_4_INSIDE: 12,
    ROUND2_5: 13,
    ROUND2_6: 14,
    ROUND3_1_TOWER: 15,
    ROUND3_4_VOID: 16,
    ROUND3_5_ANTIJEMUL_A: 17,
    ROUND3_5_ANTIJEMUL_B: 18,
    ROUND3_7_COMPUTER: 19,
    ROUND3_9_TOWEREND: 20,
    ROUND3_10_A: 21,
    ROUND3_10_ENDING: 22,
    ROUND4_0_PROLOG1: 23,
    ROUND4_0_PROLOG2: 24,
  }

  /** 스토리 텍스트 파일을 전부 로드합니다. */
  static async loadFile () {
    this.loadComplete = false
    const src = './image/story.txt'
    const file = await fetch(src) // 파일 불러오기
    const text = await file.text() // 불러온 파일의 대한 텍스트를 가져옴
    this.textFull = text // 전체 텍스트 입력

    // 텍스트의 분리
    const symbol = text[0] // 해당 텍스트의 맨 0번째 글자는 심볼로 활용됨
    const LF = '\n' // 줄 나누기 용도
    let group = text.split(symbol) // 각 텍스트를 그룹 단위로 나눔
    this.textGroup = text.split(symbol) // 그룹 텍스트 입력

    for (let i = 0; i < group.length; i++) {
      let currentGroup = group[i]
      let line = currentGroup.split('\n')
      for (let j = 0; j < )
    }
  }
}


// 스토리는 텍스트 파일로 제공 (암호회 되어있지는 않습니다.)
// 텍스트 파일을 전부 불러온 후에,
// 몇가지 규칙에 의하여 스토리를 구분함


let storyFileText = '' // 텍스트 파일 내용의 전부
let storyFileTextGroup = [''] // 각 텍스트 파일을 그룹으로 나눈 것


// 텍스트 정의
// 구분 기호는 스토리 텍스트의 0번째 글자를 기준으로 함
// 스토리 구조는
// 텍스트 파일 -> 그룹 (한개의 그룹은 한개의 스토리임) ->
// 스토리 파일이 여러개일 가능성은 있지만, 잘 모르겠음.
// 라운드 2-4에 나오는 텍스트들은, story.text에서 처리하지 않습니다.
// 대신, 다른 텍스트 파일에서 처리함.


// story
// story