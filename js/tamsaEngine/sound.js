/**
 * tamsaEngine 에서 사용하는 사운드 시스템
 * 
 * web audio api 지원
 */
export class SoundSystem {
  /**
   * 오디오 객체 저장용도
   * @type {Map<string, HTMLAudioElement | any>}
   */
  cacheAudio = new Map()

  /**
   * 오디오 객체를 오디오 컨텍스트에 연결하기 위한 노드를 저장하기 위한 용도
   * @type {Map<string, MediaElementAudioSourceNode}
   */
  cacheAudioNode = new Map()

  /**
   * 오디오 버퍼 저장용도 (참고: 버퍼는 실행이 될 때 오디오 컨텍스트에 연결됩니다.)
   * @type {Map<string, AudioBuffer | any>}
   */
  cacheBuffer = new Map()
  
  /**
   * 오디오 버퍼를 요청할 때 중복으로 요청하지 않도록 하기 위한 처리값
   * @type {Map<string, boolean>}
   */
  cacheRequest = new Map()

  /**
   * 사운드 시스템 생성 (웹 오디오 모드 기본설정)
   * 
   * 만약, 웹 오디오를 사용하지 않는다면 일부 기능을 사용할 수 없습니다.
   * 
   * 맨 처음 페이지를 로드할 때 사용자의 상호작용(터치, 클릭, 키입력등...) 없이 웹 오디오를 실행할 수 없습니다.
   * 따라서 사용자와의 상호작용을 받는 이벤트 부분에서 audioContextResume 함수를 사용해주세요.
   * 
   * 경고: 웹 오디오를 중간에 끌 수 없습니다. 그렇게 하려면 페이지를 새로고침하고 사운드 객체를 다시 만드세요.
   * @param {boolean} isWebAudioMode 웹 오디오 사용 여부. 기본값은 true. 이 값을 false로 할 경우, 웹 오디오를 사용하지 않습니다.
   * @param {string} resourceSrc 기준 외부 리소스의 경로 (이 값이 지정되지 않으면 내장된 파일을 재생할 수 없음.)
   */
  constructor (isWebAudioMode = true, resourceSrc) {
    // 웹 오디오 모드가 아니라면 생성자의 코드는 진행되지 않고 무시됩니다.
    // 물론 나머지 기능은 사용할 수 있습니다.
    if (!isWebAudioMode) return

    this.audioContext = new AudioContext()
    this.isWebAudioMode = isWebAudioMode

    // 몇몇 게인 추가 및 연결
    this.connectGain()

    // 오디오 컨텍스트를 사용하도록, 이벤트를 추가
    addEventListener('click', () => {
      if (this.audioContext.state !== 'running') {
        this.audioContext.resume()
      }

      this.audioObjectCreate()
    })
    addEventListener('touchstart', () => {
      if (this.audioContext.state !== 'running') {
        this.audioContext.resume()
      }

      this.audioObjectCreate()
    })
    addEventListener('keydown', () => {
      if (this.audioContext.state !== 'running') {
        this.audioContext.resume()
      }

      this.audioObjectCreate()
    })


    /** 
     * 엔진에서 테스트 용도로 사용하는 파일의 경로: 단, 바이오스 기능을 실행하기 전까지 해당 파일은 다운로드 하지 않습니다. 
     * @type {Object}
     * */
    this.testFileSrc = {
      soundtest: resourceSrc + 'soundeffect.wav',
      testMusicMp3: resourceSrc + '1141sub2[new] - track2 - 2011.12.21.mp3',
      testMusicOgg: resourceSrc + '1141sub2[new] - track2 - 2011.12.21.ogg'
    }

    this.fade = {
      /** 페이드 진행중인경우 */ isFading: false,
      /** 페이드 인 상태인경우 */ isFadeIn: false,
      /** 페이드 아웃 상태인경우 */ isFadeOut: false,
      /** 페이드의 기준 진행시간 */ fadeTime: 0,
      /** 다음에 재생할 페이드 오디오의 경로 */ nextAudioSrc: '',
      /** 다음에 재생할 페이드 버퍼의 경로 */ nextBufferSrc: '',
      /** 다음에 재생할 오디오가 버퍼인지 확인 */ isNextBuffer: false
    }

    /** 반복적인 음악 처리 함수 호출 setInterval id */
    this.intervalId = setInterval(this.musicProcess.bind(this), 100)
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

  /** 웹 오디오를 사용중인지에 대한 여부 */
  getWebAudioMode () {
    return this.isWebAudioMode
  }

  /** 
   * (사운드시스템의) 캐시 오디오 객체를 가져옵니다.
   * 
   * 만약 캐시에 오디오 객체가 없다면, 새로 오디오 객체를 생성합니다. (해당 기능은 취소됨)
   * 
   * 경고: 오디오 경로가 잘못되었는지는 사용자가 스스로 판단해야 합니다. 잘못된 경로를 사용하면 에러가 날 수 있습니다.
   * @param {string} audioSrc 오디오 파일의 경로 (이 값은 고유한 키로 사용됩니다.)
   * @returns {HTMLAudioElement}
   */
  getCacheAudio (audioSrc) {
    if (this.cacheAudio.has(audioSrc)) {
      return this.cacheAudio.get(audioSrc)
    } else {
      this.createAudio(audioSrc)
    }
  }

  /** (사운드시스템의) 저장된 캐시 오디오 객체와 연관된 오디오 노드를 얻어옵니다. */
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
   * @returns {AudioBuffer}
   */
  getCacheBuffer (audioSrc) {
    if (this.cacheBuffer.has(audioSrc)) {
      return this.cacheBuffer.get(audioSrc)
    } else {
      this.createBuffer(audioSrc)
      return null
    }
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
    if (this.cacheRequest.has(audioSrc)) return

    this.cacheRequest.set(audioSrc, true) // 중복 방지용 데이터 등록

    // 오디오 디코드 과정 진행
    let getFile = await (await fetch(audioSrc)).arrayBuffer()
    let decodeFile = await this.audioContext.decodeAudioData(getFile).then((getValue) => getValue)
    this.cacheBuffer.set(audioSrc, decodeFile)
  }


  /** 오디오 생성 대기열 목록(오디오 경로) */
  createAudioSrcWaitList = []

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
   * @param {string[]} src 
   */
  getAudioLoadCompleteCount (src = []) {
    let count = 0
    for (let i = 0; i < src.length; i++) {
      let audio = this.getCacheAudio(src[i])
      if (audio != null && audio.networkState === audio.NETWORK_IDLE) {
        count++
      }
    }

    return count
  }

  /** 이 함수는 반드시 터치, 클릭, 키보드 입력시에만 발동하도록 해당 이벤트 내에서 사용해주세요. */
  audioObjectCreate () {
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
   * 현재 재생중인 음악의 목록입니다. 
   * 
   * 추후 지원 예정...
   * @type {HTMLMediaElement | AudioBufferSourceNode} 
   */
  musicTrack = []

  /** 
   * 현재 재생중인 음악
   * @type {HTMLMediaElement | AudioBufferSourceNode} 
   */
  currentMusic = null
  currentMusicNode = null

  /** 음악 버퍼가 재생을 시작한 시간 */
  musicBufferStartTime = 0

  /** 현재 음악의 상태 (재생, 정지, 일시정지) */
  currentMusicState = ''
  musicStateList = {
    PAUSE: 'paused',
    STOP: 'stop',
    PLAYING: 'playing',
    NODATA: 'nodata'
  }

  /**
   * 해당 사운드를 음악처럼 취급해서 재생합니다. (효과음은 play 함수를 사용해주세요.)
   * 이 함수를 사용할경우, 해당 음악 파일들은 모두 loop속성을 가지게됩니다.
   * 따라서 절대로 효과음을 이 함수로 재생하지 마세요. (한번 loop속성이 추가되면 해제할 수 없습니다.)
   * 
   * 여러개의 곡을 동시 재생할 수는 없습니다.
   * 
   * 경고: 오디오 객체를 넣을 경우, 해당 오디오는 에코 효과를 적용하지 않고 음악을 재생합니다.
   * 
   * 일시정지된 음악도 같이 재생합니다. (이 경우 audioSrc를 넣지 마세요.)
   * @param {string | HTMLMediaElement} audioSrc 오디오의 경로 또는 오디오 객체 (버퍼는 사용불가, 대신 musicBuffer를 사용해주세요.)
   * @param {number} start 오디오의 시작 지점 (음수로 설정될경우 해당 값을 무시합니다.)
   */
  musicPlay (audioSrc = '', start = -1) {
    let getMusic = null
    let getNode = null
    
    // 오디오의 경로가 지정되지 않으면 현재 음악을 다시 재생합니다.
    if (audioSrc === '') {
      if (this.currentMusic && this.currentMusic.paused) {
        if (this.currentMusicNode != null) {
          this.currentMusicNode.connect(this.audioNode.musicFirstGain)
        }
        this.setCurrentMusicCurrentTime(start)
        this.currentMusic.play()
        this.currentMusicState = this.musicStateList.PLAYING
      }
      return
    }

    // 음악 불러오기
    if (typeof audioSrc === 'number' || typeof audioSrc === 'string') {
      getMusic = this.getCacheAudio(audioSrc)
      getNode = this.getCacheAudioNode(audioSrc)
      if (getNode != null) {
        getNode.connect(this.audioNode.musicFirstGain)
      }
    } else if (audioSrc instanceof HTMLAudioElement) {
      getMusic = audioSrc
    }

    // 현재 재생중인 음악과 다른지를 확인
    // 재생중인 음악이 다를경우 새로운 음악으로 교체
    if (getMusic != null && this.currentMusic !== getMusic) {
      this.musicStop() // 기존의 음악을 먼저 정지시킴
      this.currentMusic = getMusic
      this.currentMusicNode = getNode
      if (start >= 0 && start <= getMusic.duration) {
        getMusic.currentTime = start
      }
    }

    if (getMusic != null) {
      getMusic.loop = true
      if (getMusic.paused) {
        getMusic.play()
        this.setCurrentMusicCurrentTime(start)
        this.currentMusicState = this.musicStateList.PLAYING
      }
    }
  }

  /** 현재 음악의 재생 시간 강제 조정 */
  setCurrentMusicCurrentTime (start = -1) {
    if (this.currentMusic != null && start >= 0) {
      this.currentMusic.currentTime = start
    }
  }

  /** 
   * 오디오 버퍼를 음악으로 재생합니다. (루프는 강제 적용)  
   * 
   * 참고: 음악 버퍼는 같은 음악을 재생하여도, 새로운 음악으로 계속 교체됩니다.
   * @param {string | AudioBuffer} audioSrc 오디오의 경로 또는 오디오 버퍼 (음악 객체는 사용불가, 대신 musicPlay를 사용해주세요.)
   * @param {number} start 음악의 시작지점
   * @param {number} end 음악의 끝지점
   */
  musicBuffer (audioSrc, start = 0, end = 0) {
    let getBuffer = null
    if (typeof audioSrc === 'number' || typeof audioSrc === 'string') {
      getBuffer = this.getCacheBuffer(audioSrc)
    } else if (audioSrc instanceof AudioBuffer) {
      getBuffer = audioSrc
    }

    if (getBuffer == null) return

    let newBuffer = this.audioContext.createBufferSource()
    newBuffer.buffer = getBuffer
    newBuffer.connect(this.audioNode.musicFirstGain)
    
    // start와 end 값 범위 조절
    if (start < 0 || start > newBuffer.buffer.duration) start = 0
    if (end <= 0 || end > newBuffer.buffer.duration) end = newBuffer.buffer.duration
    newBuffer.loop = true
    newBuffer.loopStart = start
    newBuffer.loopEnd = end

    this.musicStop() // 현재 재생중인 음악 정지
    newBuffer.start(this.audioContext.currentTime, start)
    this.currentMusic = newBuffer
    this.musicBufferStartTime = this.audioContext.currentTime
  }

  /** 
   * 음악을 페이드 아웃합니다. (next를 지정하지 않으면 페이드 인 하지 않습니다.)
   * 
   * 주의: 동시에 여러번 페이드아웃하면 가장 마지막의 페이드 아웃이 끝날때까지 음악을 재생하지 못할 수 있습니다.
   * 
   * 페이드 시간이 0이라면, 페이드 아웃을 취소합니다.
   */
  musicFade (fadeTime = 0) {
    if (fadeTime === 0) {
      this.musicStop() // 음악 정지
      this.musicFadeCancle()
    } else {
      if (this.fade.isFading) {
        this.musicFadeCancle()
      }

      this.fade.isFading = true
      this.fade.isFadeIn = false
      this.fade.isFadeOut = true
      this.fade.fadeTime = fadeTime
  
      // 참고: setValueAtTime을 하지 않고 바로 페이드 아웃을 시도하면, 자연스러운 감소가 아닌 급격한 감소로 페이드 아웃됩니다.
      this.audioNode.musicFadeGain.gain.value = 1
      this.audioNode.musicFadeGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime)
    }
  }

  /** 현재 진행중인 페이드를 취소합니다. */
  musicFadeCancle () {
    // 지금까지 적용된 게인 값 변경 요청을 번부 취소하고, 해당 게인을 1로 조정합니다.
    this.audioNode.musicFadeGain.gain.cancelScheduledValues(this.audioContext.currentTime)
    this.audioNode.musicFadeGain.gain.value = 1

    // 페이드 해제
    this.fade.isFading = false
    this.fade.isFadeIn = false
    this.fade.isFadeOut = false
    this.fade.fadeTime = 0
    this.fade.nextAudioSrc = ''
    this.fade.nextBufferSrc = ''
  }

  /** 
   * 다음 음악을 페이드 효과를 이용해 변경합니다.
   * 
   * 경고: 이 함수를 사용하는 즉시 재생중인 모든 음악은 페이드 아웃됩니다.
   * 그리고 새로운 음악으로 교체됩니다.
   */
  musicFadeNextAudio (audioSrc, fadeTime = 0) {
    if (fadeTime === 0) {
      // 페이드 시간이 0인경우, 즉시 다음음악으로 교체됩니다.
      this.musicStop()
      this.musicFadeCancle()
      this.musicPlay(audioSrc)
    } else {
      this.musicFade(fadeTime)
      this.fade.nextAudioSrc = audioSrc
      this.fade.isNextBuffer = false
    }
  }

  /** 다음 음악을 페이드 효과를 이용해 변경합니다. (버퍼로 재생함.) */
  musicFadeNextBuffer (audioSrc, fadeTime) {
    if (fadeTime === 0) {
      this.musicStop()
      this.musicFadeCancle()
      this.musicBuffer(audioSrc)
    } else {
      this.musicFade(fadeTime)
      this.fade.nextAudioSrc = audioSrc
      this.fade.isNextBuffer = true
    }
  }

  /** 
   * 참고: 이 함수는 자동으로 반복되어 실행됩니다. (0.1초 단위)  
   * 주로, 페이드 인 효과를 정의할 때 사용합니다.
   */
  musicProcess () {
    // 페이드 과정 진행
    if (this.fade.isFading) {
      if (this.fade.isFadeOut) {
        if (this.audioNode.musicFadeGain.gain.value <= 0) {
          // this.musicStop() // musicPlay 에서 음악이 변경되면 기존 음악을 정지시키므로 여기서 정지하지 않습니다.
          // 중복으로 정지할경우, 페이드 효과가 잘못 적용되는 현상이 생깁니다.
          // 이것은 음악을 정지할 때 오디오랑 disconnect 하고 그 시점부터 fadeGain이 동작하지 않습니다.
          if (this.fade.nextAudioSrc != '') {
            if (this.fade.isNextBuffer) {
              this.musicBuffer(this.fade.nextAudioSrc)
            } else {
              this.musicPlay(this.fade.nextAudioSrc)
            }
            // 페이드 인 상태로 변경
            this.audioNode.musicFadeGain.gain.setValueAtTime(0, this.audioContext.currentTime)
            this.audioNode.musicFadeGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.fade.fadeTime)
            this.fade.isFadeOut = false
            this.fade.isFadeOut = true
          } else {
            // 페이드 아웃 종료 및 음악 정지
            this.musicFadeCancle()
            this.musicStop()
          }
        }
      } else if (this.fade.isFadeIn) {
        if (this.audioNode.musicFadeGain.gain.value >= 1) {
          // 페이드 상태 초기화
          this.musicFadeCancle()
        }
      }
    }
  }

  /** 현재 재생중인 모든 음악 정지, 그래도 재생중인 트랙의 모든 데이터는 지워집니다. */
  musicStop () {
    if (this.currentMusic instanceof HTMLMediaElement) {
      this.currentMusic.currentTime = 0
      this.currentMusic.pause()
    } else if (this.currentMusic instanceof AudioBufferSourceNode) {
      this.currentMusic.stop()
    }

    this.currentMusic = null
    this.currentMusicState = this.musicStateList.STOP

    // this.musicFadeCancle()

    // for (let i = 0; i < this.musicTrack.length; i++) {
    //   let currentMusic = this.musicTrack[i]
    //   if (currentMusic instanceof HTMLAudioElement) {
    //     currentMusic.pause()
    //     currentMusic.currentTime = 0
    //   }
    // }

    // this.musicTrack.length = 0
  }

  /** 현재 재생중인 모든 음악 일시정지, 오디오만 일시정지 가능하고, 버퍼는 일시정지 할 수 없기 때문에 자동으로 정지됩니다. */
  musicPause () {
    if (this.currentMusic instanceof HTMLMediaElement) {
      this.currentMusic.pause()
      this.currentMusicState = this.musicStateList.PAUSE
    } else if (this.currentMusic instanceof AudioBuffer) {
      this.currentMusic.stop()
      this.currentMusic = null
      this.currentMusicState = this.musicStateList.NODATA
    }
    this.musicFadeCancle()
  }

  /** 
   * 음악이 일시정지 상태인지 확인
   * 
   * 음악이 없는 경우도 일시정지 상태로 처리
   */
  getMusicPaused () {
    if (this.currentMusic == null) {
      return true
    } else if (this.currentMusic instanceof HTMLMediaElement) {
      if (this.currentMusic.paused) {
        return true
      } else {
        return false
      }
    } else if (this.currentMusic instanceof AudioBufferSourceNode) {
      if (this.currentMusicState === this.musicStateList.NODATA) {
        return true
      } else {
        return false
      }
    }
  }

  getMusicCurrentTime () {
    if (this.currentMusic instanceof HTMLMediaElement) {
      return this.currentMusic.currentTime
    } else if (this.currentMusic instanceof AudioBufferSourceNode) {
      return this.musicBufferStartTime
    }
  }

  /**
   * 에코를 설정합니다. (청각 테러 방지를 위해 설정값에 제한이 있습니다.)
   * 
   * 함수에 매개변수가 모두 없으면 에코 기능은 동작하지 않습니다. 
   * 
   * 특정한 변수 값만 넣고 싶다면, null을 넣거나 잘못된 값을 입력하세요.
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