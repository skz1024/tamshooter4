//@ts-check

/**
 * tamsaEngine 에서 사용하는 사운드 시스템
 * 
 * web audio api 사용
 */
export class SoundSystem {
  /**
   * 오디오 객체 저장용도
   * @type {Map<string, HTMLAudioElement | any>}
   */
  cacheAudio = new Map()

  /**
   * 오디오 객체를 오디오 컨텍스트에 연결하기 위한 노드를 저장하기 위한 용도
   * @type {Map<string, MediaElementAudioSourceNode>}
   */
  cacheAudioNode = new Map()

  /**
   * 오디오 버퍼 저장용도
   * @type {Map<string, AudioBuffer | any>}
   */
  cacheBuffer = new Map()
  
  /**
   * 오디오 캐시 버퍼를 요청할 때 중복으로 요청하지 않도록 하기 위한 처리값 
   * 
   * 주소값을 기준으로 중복여부를 판단하기 때문에 버퍼와 오디오가 같은 경로일경우
   * 다른것은 사용할 수 없습니다.
   * @type {Map<string, boolean>}
   */
  cacheBufferRequest = new Map()

  /**
   * 사운드 시스템 생성 (웹 오디오 모드 기본설정)
   * 
   * 맨 처음 페이지를 로드할 때 사용자의 상호작용(터치, 클릭, 키입력등...) 없이 웹 오디오를 실행할 수 없습니다.
   * 따라서 사용자와의 상호작용을 받는 이벤트 부분에서 audioContextResume 함수를 사용해주세요.
   */
  constructor () {
    this.audioContext = new AudioContext()

    /** 이 시스템에서 사용하는 오디오 노드의 집합 */
    this.audioNode = {
      /** 이 노드는 오디오(효과음 전용)가 맨 처음 연결되는 노드입니다. */
      firstGain: this.audioContext.createGain(),
      echoGain: this.audioContext.createGain(),
      feedBackGain: this.audioContext.createGain(),
      echoDelay: this.audioContext.createDelay(),

      /** 이 노드는 오디오가 맨 마지막에 연결되는 노드입니다. 이 노드는 audioContext.destination에 연결됩니다. */
      masterGain: this.audioContext.createGain(),

      /** 이 노드는 음악을 재생하는 오디오가 맨 처음 연결되는 노드입니다. */
      musicFirstGain: this.audioContext.createGain(),
      musicEchoGain: this.audioContext.createGain(),
      musicFeedBackGain: this.audioContext.createGain(),
      musicEchoDelay: this.audioContext.createDelay(),
      musicFadeGain: this.audioContext.createGain(),
    }

    // 몇몇 게인 추가 및 연결
    this.connectGain()

    // 오디오 컨텍스트를 사용하도록, 이벤트를 추가 (해당 이벤트가 발생되기전까지 resume되지 않음)
    addEventListener('click', () => {
      if (this.audioContext.state !== 'running') {
        this.audioContext.resume()
      }

      this.audioElementCreate()
    })
    addEventListener('touchstart', () => {
      if (this.audioContext.state !== 'running') {
        this.audioContext.resume()
      }

      this.audioElementCreate()
    })
    addEventListener('keydown', () => {
      if (this.audioContext.state !== 'running') {
        this.audioContext.resume()
      }

      this.audioElementCreate()
    })

    /** 음악을 페이드 아웃할 때 사용하는 timeout에 대한 id */
    this.fadeOutIntervalId = 0
  }

  /** 
   * 오디오 컨텍스트의 상태가 suspend인지를 알아보는 함수
   * 
   * 참고: 사용자가 해당 페이지에 터치, 키입력, 클릭을 한다면 audioContext는 resume상태로 전환합니다.
   */
  getIsAudioSuspended () {
    if (this.audioContext.state === 'suspended') {
      return true
    } else {
      return false
    }
  }

  /**
   * 오디오 컨텍스트에 사용할 몇가지 추가 게인들을 로드합니다.
   * 참고: 연결 공식은 고정되어있으며, 에코 기능은 꺼져있어도 연결 상태가 해제되지 않습니다.
   */
  connectGain () {
    // 초기값 설정
    this.audioNode.echoGain.gain.value = 0
    this.audioNode.echoDelay.delayTime.value = 0
    this.audioNode.feedBackGain.gain.value = 0
    this.audioNode.musicEchoGain.gain.value = 0
    this.audioNode.musicFeedBackGain.gain.value = 0
    this.audioNode.musicEchoDelay.delayTime.value = 0
    this.audioNode.masterGain.gain.value = 1
    this.audioNode.firstGain.gain.value = 1
    this.audioNode.musicFirstGain.gain.value = 1
    this.audioNode.musicFadeGain.gain.value = 1

    // 연결 설정
    this.audioNode.firstGain.connect(this.audioNode.masterGain) // 원본 소리
    this.audioNode.firstGain.connect(this.audioNode.echoGain) // 에코 연결
    this.audioNode.echoGain.connect(this.audioNode.echoDelay).connect(this.audioNode.masterGain) // 에코 효과
    this.audioNode.echoDelay.connect(this.audioNode.feedBackGain).connect(this.audioNode.echoDelay) // 에코 피드백 전달
    this.audioNode.feedBackGain.connect(this.audioNode.masterGain) // 피드벡 게인
    this.audioNode.masterGain.connect(this.audioContext.destination) // 최종 지점

    // 음악 연결 설정
    this.audioNode.musicFirstGain.connect(this.audioNode.musicFadeGain).connect(this.audioNode.masterGain) // 원본 소리
    this.audioNode.musicFirstGain.connect(this.audioNode.musicFadeGain).connect(this.audioNode.musicEchoGain) // 음악 에코 연결
    this.audioNode.musicEchoGain.connect(this.audioNode.musicEchoDelay).connect(this.audioNode.masterGain) // 음악 에코 효과
    this.audioNode.musicEchoDelay.connect(this.audioNode.musicFeedBackGain).connect(this.audioNode.musicEchoDelay) // 음악 에코 피드백 전달
    this.audioNode.musicFeedBackGain.connect(this.audioNode.masterGain) // 음악 피드벡 게인
  }

  /** 
   * (사운드시스템의) 캐시 오디오 객체를 가져옵니다.
   * 
   * 만약 캐시에 오디오 객체가 없다면, 새로 오디오 객체를 생성합니다. 이 경우에는 undefined를 리턴합니다.
   * 
   * 그 후 다시 이 함수를 호출해야 캐시 오디오를 얻습니다.
   * 
   * 경고: 오디오 경로가 잘못되었는지는 사용자가 스스로 판단해야 합니다. 잘못된 경로를 사용하면 에러가 날 수 있습니다.
   * @param {string} audioSrc 오디오 파일의 경로 (이 값은 고유한 키로 사용됩니다.)
   * @returns {HTMLAudioElement | undefined}
   */
  getCacheAudio (audioSrc) {
    if (audioSrc == null) return

    if (this.cacheAudio.has(audioSrc)) {
      return this.cacheAudio.get(audioSrc)
    } else {
      this.createAudio(audioSrc)
      return undefined
    }
  }

  /** 
   * (사운드시스템의) 저장된 캐시 오디오 객체와 연관된 오디오 노드를 얻어옵니다.
   * @param {string} audioSrc 오디오의 경로
   */
  getCacheAudioNode (audioSrc) {
    return this.cacheAudioNode.get(audioSrc)
  }

  /**
   * (사운드시슽메의) 캐시 버퍼(AudioBuffer)를 가져옵니다.
   * 
   * 경고: createBuffer로 버퍼를 먼저 등록해주세요. 여기서도 등록이 진행되기는 하나, 값을 바로 리턴받을 수 없습니다.
   * 
   * 이 버퍼는 bufferPlay를 통해 바로 오디오를 재생할 수 있습니다.
   * 
   * 경고: 오디오 경로가 잘못되었는지는 사용자가 스스로 판단해야 합니다. 잘못된 경로를 사용하면 에러가 날 수 있습니다.
   * @param {string} audioSrc 오디오 파일의 경로 (이 값은 고유한 키로 사용됩니다.)
   * @returns {AudioBuffer | undefined}
   */
  getCacheBuffer (audioSrc) {
    if (this.cacheBuffer.has(audioSrc)) {
      return this.cacheBuffer.get(audioSrc)
    } else {
      this.createBuffer(audioSrc)
      return undefined
    }
  }

  /** 현재까지 등록된 모든 오디오를 가져옵니다. */
  getAllCacheAudio () {
    return this.cacheAudio.entries()
  }

  /** 현재까지 등록된 모든 오디오 버퍼를 가져옵니다. */
  getAllCacheBuffer () {
    return this.cacheBuffer.entries()
  }

  /**
   * 이 시스템에서 사용할 오디오 버퍼를 등록합니다.
   * 
   * 해당 오디오의 경로를 입력하면 그 오디오를 fetch함수를 사용하여 비동기적으로 로드한 후
   * audioContext의 디코딩 과정을 거쳐 완전히 버퍼의 등록됩니다.
   * 
   * 컴퓨터 성능에 따라 일부 시간이 소요될 수 있으므로, 가급적이면 게임을 시작할 때 미리 등록해주세요.
   * 
   * 등록되지 않은 버퍼를 재생하려고 하면 아무 일도 일어나지 않습니다.
   * @param {string} audioSrc 오디오 파일의 경로 (이 값은 고유한 키로 사용됩니다.)
   */
  async createBuffer (audioSrc) {
    // 중복 요청을 방지하기 위한 코드
    // 해당 버퍼를 이미 가지고 있다면 이 함수는 실행되지 않습니다.
    if (this.cacheBufferRequest.has(audioSrc)) return

    this.cacheBufferRequest.set(audioSrc, true) // 중복 방지용 데이터 등록

    // 오디오 디코드 과정 진행
    let getFile = await (await fetch(audioSrc)).arrayBuffer()
    let decodeFile = await this.audioContext.decodeAudioData(getFile).then((getValue) => getValue)
    this.cacheBuffer.set(audioSrc, decodeFile)
  }

  /** 오디오 생성 대기열 목록(오디오 경로) */
  /** @type {string[]} */ createAudioSrcWaitList = []

  /**
   * 오디오를 생성합니다. (오디오는 중복으로 생성되지 않습니다. 파일의 경로를 기준으로 중복 여부를 검사합니다.)
   * 
   * 주의: 모바일에 대한 지원을 위하여, 오디오는 반드시 터치, 클릭, 키보드 입력시에만 생성되도록 변경됩니다.
   * 이 함수는 해당 이벤트가 발생하기 전까지, 요청된 파일의 경로를 계속 누적합니다. (파일 등록은 안된 상태입니다.)
   * @param {string} audioSrc 
   */
  createAudio (audioSrc) {
    if (this.cacheAudio.has(audioSrc)) return

    this.createAudioSrcWaitList.push(audioSrc)
  }

  /**
   * 오디오가 얼마나 로드가 완료되었는지에 대한 개수를 표시합니다.
   * @param {string[]} src 오디오의 경로 (배열로 처리)
   */
  getAudioLoadCompleteCount (src) {
    if (src == null) return

    let count = 0
    for (let i = 0; i < src.length; i++) {
      let audio = this.getCacheAudio(src[i])
      if (audio != null && audio.networkState === audio.NETWORK_IDLE) {
        count++
      }
    }

    return count
  }

  /** 
   * 이 함수는 반드시 터치, 클릭, 키보드 입력시에만 발동하도록 해당 이벤트 내에서 사용해주세요.
   * 
   * 오디오 엘리먼트를 생성합니다.
   */
  audioElementCreate () {
    if (this.createAudioSrcWaitList.length === 0) return

    for (let i = 0; i < this.createAudioSrcWaitList.length; i++) {
      let audioSrc = this.createAudioSrcWaitList[i]
      if (this.cacheAudio.has(audioSrc)) continue

      let newAudio = new Audio(audioSrc)
      this.cacheAudio.set(audioSrc, newAudio)
      let newNode = this.audioContext.createMediaElementSource(newAudio)
      newAudio.addEventListener('pause', () => {
        newNode.disconnect(); // 정지상태가 되면 디스커넥트 // 이렇게 해야 렌더링 누수를 막을 수 있음.
        // 너무 많은 파일이 렌더링 되면 사운드에 문제가 발생합니다.
      })
      this.cacheAudioNode.set(audioSrc, newNode) // 컨텍스트에 연결할 오디오 노드
    }

    // 배열의 모든 내용을 삭제
    this.createAudioSrcWaitList.length = 0
  }

  /**
   * 해당 사운드를 재생합니다. 이것은 오디오 파일을 직접 재생하는것을 목표로 만들어졌습니다.
   * 따라서 오디오 파일을 중복해서 재생할 수 없습니다. (이렇게하려면 buffer를 사용하거나 다른 이름의 오디오 파일을 만드세요.)
   * 
   * 버퍼 재생은 이 함수에서 할 수 없습니다. 대신 playBuffer를 사용하세요.
   * 
   * 오디오 객체를 재생할 수도 있습니다. 이 경우 웹 오디오 효과를 받을 수 없습니다.
   * 
   * @param {HTMLMediaElement | string} audioSrc 오디오의 경로
   * string을 넣으면 해당 오디오 경로에 있는 파일을 직접 재생합니다.
   * 
   * AudioBuffer를 넣으면 playBuffer 함수를 대신 실행합니다.
   */
  play (audioSrc) {
    let getAudio = null
    let getNode = null
    if (typeof audioSrc === 'string') {
      getAudio = this.getCacheAudio(audioSrc)
      getNode = this.getCacheAudioNode(audioSrc)
    } else if (audioSrc instanceof HTMLAudioElement) {
      getAudio = audioSrc
    }
    
    if (getAudio == null || getNode == null) return // 노드 또는 오디오가 없다면 재생 불가능
    getNode.connect(this.audioNode.firstGain) // 재생을 위한 오디오 연결

    // 일시정지되면, 다시 재생시키고, 이미 재생중이라면 처음부터 다시 재생합니다.
    getAudio.loop = false // 효과음은 반복재생하지 않습니다.
    if (getAudio.paused) {
      // 오류 메세지 막기(예외처리...)
      getAudio.play().catch(() => {})
    } else {
      getAudio.currentTime = 0
    }
  }

  /**
   * 버퍼를 가진 사운드를 재생합니다. 중복 재생이 가능하기 때문에 한번에 여러 소리를 전부 출력하지 마세요.
   * 
   * 만약 버퍼가 등록되어있지 않다면, 자동으로 등록을 진행하긴 하나 해당 소리가 출력되지 않습니다.
   * 
   * 버퍼가 완전히 등록되어야만 해당 소리를 출력할 수 있습니다.
   * 
   * @param {string} audioSrc 오디오 파일의 경로 (이 값은 고유한 키로 사용됩니다.)
   * @param {number} start 오디오 재생의 시작지점
   * @param {number} duration 오디오 재생 길이 (오디오 버퍼의 최대 길이를 초과할 수 없음),
   * 설정하지 않을경우 해당 오디오을 전체길이로 재생
   */
  playBuffer (audioSrc, start = 0, duration = 0) {
    // 오디오버퍼가 있고, 오디오 버퍼의 형식이 맞을때만 이 함수가 실행됩니다.
    let getBuffer = this.getCacheBuffer(audioSrc)
    if (getBuffer == null) return // 버퍼가 없다면 실행 불가능

    if (start < 0) start = 0 // 시작시건 버그 금지
    if (duration <= 0) duration = getBuffer.duration // duration 기본값 설정

    // 버퍼 소스 생성
    let bufferSource = this.audioContext.createBufferSource()
    bufferSource.buffer = getBuffer

    // 해당 버퍼를 오디오컨텍스트에 연결해야 합니다.
    bufferSource.connect(this.audioNode.firstGain)
    bufferSource.start(this.audioContext.currentTime, start, duration)
  }

  /** 
   * 특정 효과음 파일을 강제로 정지합니다.
   * @param {string} audioSrc 
   */
  stop (audioSrc) {
    let getAudio = this.getCacheAudio(audioSrc)
    if (getAudio != null) {
      getAudio.pause()
      getAudio.currentTime = 0
    }
  }

  /**
   * 현재 재생중인 음악의 목록입니다. 
   * 
   * 추후 지원 예정...
   * @type {HTMLMediaElement[] | AudioBufferSourceNode[]} 
   */
  musicTrack = []

  /** 
   * 현재 재생중인 음악
   * @type {HTMLMediaElement | AudioBufferSourceNode | null} 
   */
  currentMusic = null

  /** 
   * 현재 재생중인 음악에 대한 노드
   * @type {MediaElementAudioSourceNode | null | undefined}
   */ 
  currentMusicNode = null

  /** 음악 버퍼가 재생을 시작한 시간 (audioContextTime 용도로 사용) */
  musicBufferStartTime = 0

  /** 현재 음악의 상태 (재생, 정지, 일시정지) */
  currentMusicState = ''
  musicStateList = {
    PAUSE: 'paused',
    STOP: 'stop',
    PLAYING: 'playing',
    NODATA: 'nodata'
  }

  /** 현재 재생중인 음악의 경로 */
  currentMusicSrc = ''
  
  /**
   * (해당 오디오 파일을 음악으로 처리함) 음악을 재생합니다. (버퍼는 사용할 수 없음)
   * 효과음을 재생하려면 play 함수를 사용해주세요.
   * 
   * 모든 음악은 자동으로 루프됩니다. 이 설정은 효과음을 재생할때는 사라집니다.
   * 
   * @param {string} audioSrc 오디오의 경로 (없을경우 musicResume과 동일)
   * @param {number} start 오디오 시작 지점
   * @param {number} fadeInSecond 페이드 인 시간
   */
  musicPlay (audioSrc = '', start = 0, fadeInSecond = 0) {
    if (audioSrc === '') return
    this.currentMusicSrc = audioSrc // 음악 경로 지정

    // 음악 불러오기
    let getMusic = this.getCacheAudio(audioSrc)
    if (getMusic == null) return

    // 음악을 노드에 연결 (정지되면 자동으로 연결 해제됩니다.)
    let getNode = this.getCacheAudioNode(audioSrc)
    if (getNode != null) getNode.connect(this.audioNode.musicFirstGain)

    // 현재 재생중인 음악과 다른지를 확인
    // 재생중인 음악이 다를경우 새로운 음악으로 교체
    if (this.currentMusic !== getMusic) {
      // 기존 음악 정지 (musicStop을 호출하면 음악 데이터가 사라지기때문에, 일부 코드만 복사함)
      if (this.currentMusic instanceof HTMLMediaElement) {
        this.currentMusic.currentTime = 0
        this.currentMusic.pause()
      } else if (this.currentMusic instanceof AudioBufferSourceNode) {
        this.currentMusic.stop()
      }

      this.currentMusic = getMusic
      this.currentMusicNode = getNode
      if (start >= 0 && start <= getMusic.duration) {
        getMusic.currentTime = start
      }
    }

    getMusic.loop = true // 음악 자동 루프 처리
    if (getMusic.paused) { // 음악이 일시정지 된 경우에 재생합니다.
      getMusic.play()
      this.setCurrentMusicCurrentTime(start)
      this.currentMusicState = this.musicStateList.PLAYING
    }

    if (fadeInSecond <= 0) {
      // 음악의 페이드를 취소하고, 페이드게인을 원래대로 되돌려놓습니다.
      this.audioNode.musicFadeGain.gain.cancelScheduledValues(this.audioContext.currentTime)
      this.audioNode.musicFadeGain.gain.setValueAtTime(1, this.audioContext.currentTime)
    } else {
      // 음악을 페이드 인 합니다.
      this.audioNode.musicFadeGain.gain.cancelScheduledValues(this.audioContext.currentTime)
      this.audioNode.musicFadeGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.audioNode.musicFadeGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + fadeInSecond)
    }

    clearTimeout(this.fadeOutIntervalId) // 음악 페이드 아웃에 대한 자동 정지 효과 삭제
  }

  /** 현재 음악의 재생 시간 강제 조정 */
  setCurrentMusicCurrentTime (start = -1) {
    if (this.currentMusic instanceof HTMLMediaElement && start >= 0) {
      this.currentMusic.currentTime = start
    } else {

    }
  }

  /**
   * 현재 재생중인 음악을 페이드 아웃하고 정지합니다.
   * @param {number} fadeSecond 페이드 시간 (단위: 초)
   */
  musicFadeOut (fadeSecond = 0) {
    if (fadeSecond <= 0) {
      this.musicStop()
      return
    }

    // 참고: setValueAtTime을 하지 않고 바로 페이드 아웃을 시도하면, 자연스러운 감소가 아닌 급격한 감소로 페이드 아웃됩니다.
    // firefox는 setValueAtTime을 하지 않으면 무언가 정상적으로 값을 대입하지 못하는 현상이 있음. firefox 버그로 추정
    this.audioNode.musicFadeGain.gain.cancelScheduledValues(this.audioContext.currentTime)
    this.audioNode.musicFadeGain.gain.setValueAtTime(1, this.audioContext.currentTime)
    this.audioNode.musicFadeGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeSecond)

    // 타임아웃이 미리 예약되어있다면 이를 취소하고 다시 페이드를 진행합니다.
    if (this.fadeOutIntervalId !== 0) clearTimeout(this.fadeOutIntervalId) 
    this.fadeOutIntervalId = setTimeout(this.musicStop.bind(this), fadeSecond * 1000) // fadeSconde는 초단위이고, setTimeout는 밀리세컨드단위
  }

  /** 현재 재생중인 모든 음악 정지, 재생중인 트랙의 모든 데이터는 지워집니다. */
  musicStop () {
    if (this.currentMusic instanceof HTMLMediaElement) {
      this.currentMusic.currentTime = 0
      this.currentMusic.pause()
    } else if (this.currentMusic instanceof AudioBufferSourceNode) {
      this.currentMusic.stop()
    }

    this.currentMusic = null
    this.currentMusicSrc = ''
    this.currentMusicState = this.musicStateList.STOP
  }

  /** 현재 재생중인 모든 음악 일시정지, 오디오만 일시정지 가능하고, 버퍼는 일시정지 할 수 없기 때문에 자동으로 정지됩니다. */
  musicPause () {
    if (this.currentMusic instanceof HTMLMediaElement) {
      this.currentMusic.pause()
      this.currentMusicState = this.musicStateList.PAUSE
    } else if (this.currentMusic instanceof AudioBuffer) {
      this.currentMusic.stop()
      this.currentMusic = null
      this.currentMusicState = this.musicStateList.PAUSE
    }
  }

  musicResume () {
    if (this.currentMusic instanceof HTMLMediaElement) {
      // 음악을 특정 지점부터 다시 재생
      // 이렇게 하는 이유는 audioContext를 연결하기 위해서입니다. (musicPlay에서 연결함)
      // 음악을 노드에 연결 (정지되면 자동으로 연결 해제됩니다.)
      let getNode = this.getCacheAudioNode(this.currentMusicSrc)
      if (getNode != null) getNode.connect(this.audioNode.musicFirstGain)
      this.currentMusic.play()
    } else if (this.currentMusic instanceof AudioBufferSourceNode) {
      //
    } else if (this.currentMusic == null && this.currentMusicSrc !== '') {
      this.musicPlay(this.currentMusicSrc)
    }
  }

  /** 
   * 음악이 일시정지 상태인지 확인 
   * @returns {boolean}
   */
  getMusicPaused () {
    // 플레이 중이 아니면 true
    return this.currentMusicState !== this.musicStateList.PLAYING
  }

  /** 
   * 현재 음악의 재생 시간 확인 
   * @returns {number}
  */
  getMusicCurrentTime () {
    if (this.currentMusic instanceof HTMLMediaElement) {
      return this.currentMusic.currentTime
    } else if (this.currentMusic instanceof AudioBufferSourceNode) {
      // return (this.audioContext.currentTime - this.musicBufferStartTime) % this.currentMusic.
      return 0
    } else {
      return 0
    }
  }

  /**
   * 에코를 설정합니다. (청각 테러 방지를 위해 설정값에 제한이 있습니다.)
   * 
   * 함수에 매개변수가 모두 없으면 에코 기능은 동작하지 않습니다. 
   * 
   * 특정한 변수 값만 넣고 싶다면, null을 넣거나 음수 갑을 입력하세요.
   * 
   * @param {number} echoGain 에코 게인 (0 ~ 1)
   * @param {number} feedBackGain 에코 피드백 게인 (0 ~ 1)
   * @param {number} delay 지연시간
   */
  setEcho (echoGain = -1, feedBackGain = -1, delay = -1) {
    if (echoGain >= 0 && echoGain <= 1) this.audioNode.echoGain.gain.value = echoGain
    if (feedBackGain >= 0 && feedBackGain <= 1) this.audioNode.feedBackGain.gain.value = feedBackGain
    if (delay >= 0) this.audioNode.echoDelay.delayTime.value = delay
  }

  /** 에코 기능을 끕니다. 에코 지연시간도 초기화됩니다. */
  setEchoDisable () {
    this.audioNode.echoGain.gain.value = 0
    this.audioNode.feedBackGain.gain.value = 0
    this.audioNode.echoDelay.delayTime.value = 0
  }

  /** 에코 값을 얻어옴. (주의: 노드를 리턴하지 않고 각 밸류값만 얻어옵니다.) */
  getEchoValue () {
    return {
      echo: this.audioNode.echoGain.gain.value,
      feedback: this.audioNode.feedBackGain.gain.value,
      delay: this.audioNode.echoDelay.delayTime.value
    }
  }

  /**
   * 음악의 에코를 설정합니다. (청각 테러 방지를 위해 설정값에 제한이 있습니다.)
   * 
   * 함수에 매개변수가 모두 없으면 에코 기능은 동작하지 않습니다.
   * 
   * 특정한 변수 값만 넣고 싶다면, null을 넣거나 잘못된 값을 입력하세요.
   * 
   * @param {number} echoGain 에코 게인 (0 ~ 1) 범위 외의 다른 값은 무시
   * @param {number} feedBackGain 에코 피드백 게인 (0 ~ 1) 범위 외의 다른 값은 무시
   * @param {number} delay 지연시간 (음수는 무시)
   */
  setMusicEcho (echoGain = 0, feedBackGain = 0, delay = 0) {
    if (echoGain >= 0 && echoGain <= 1) this.audioNode.musicEchoGain.gain.value = echoGain
    if (feedBackGain >= 0 && feedBackGain <= 1) this.audioNode.musicFeedBackGain.gain.value = feedBackGain
    if (delay >= 0) this.audioNode.musicEchoDelay.delayTime.value = delay
  }

  /** 음악의 에코를 끕니다. (음악 에코 지연시간도 초기화됩니다.) */
  setMusicEchoDisable () {
    this.audioNode.musicEchoGain.gain.value = 0
    this.audioNode.musicFeedBackGain.gain.value = 0
    this.audioNode.musicEchoDelay.delayTime.value = 0
  }

  /** 음악에서 사용하는 에코 값을 얻어옴. (주의: 노드를 리턴하지 않고 각 밸류값만 얻어옵니다.) */
  getMusicEchoValue () {
    return {
      echo: this.audioNode.musicEchoGain.gain.value,
      feedback: this.audioNode.musicFeedBackGain.gain.value,
      delay: this.audioNode.musicEchoDelay.delayTime.value
    }
  }

  /**
   * 사운드의 볼륨을 설정합니다.
   * @param {number} gainValue 게인값 (0 ~ 1)
   */
  setGain (gainValue) {
    if (gainValue >= 0 && gainValue <= 1) {
      this.audioNode.firstGain.gain.value = gainValue
    }
  }

  /**
   * 음악의 볼륨을 설정합니다.
   * @param {number} gainValue 게인값 (0 ~ 1)
   */
  setMusicGain (gainValue) {
    if (gainValue >= 0 && gainValue <= 1) {
      this.audioNode.musicFirstGain.gain.value = gainValue
    }
  }

  /**
   * (임시로 만들어진 함수 - 사용 비추천)
   * 마스터 게인의 볼륨을 설정합니다.
   * @param {number} gainValue 게인값 (0 ~ 1)
   * @deprecated
   */
  setMasterGain (gainValue) {
    if (gainValue >= 0 && gainValue <= 1) {
      this.audioNode.masterGain.gain.value = gainValue
    }
  }
}