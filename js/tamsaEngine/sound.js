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


    this.testFileSrc = {
      soundtest0: resourceSrc + 'soundeffect.wav',
      soundtest1: resourceSrc + 'soundtest1.ogg',
      soundtest2: resourceSrc + 'soundtest2.ogg',
      soundtest3: resourceSrc + 'soundtest3.ogg',
    }

    this.fade = {
      /** 페이드 진행중인경우 */ isFading: false,
      /** 페이드의 기준 진행시간 */ fadeTime: 0,
      /** 다음에 재생할 페이드 오디오의 경로 */ nextAudioSrc: '',
      /** 다음에 재생할 페이드 버퍼의 경로 */ nextBufferSrc: '',
      /** 다음에 재생할 오디오가 버퍼인지 확인 */ isNextBuffer: false
    }
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
  

  /** 웹 오디오를 사용중인지에 대한 여부 (해당 엔진 한정) */
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
   * 오디오를 생성합니다.
   * 
   * 주의: 모바일에 대한 지원을 위하여, 오디오는 반드시 터치, 클릭, 키보드 입력시에만 생성되도록 변경됩니다.
   * 이 함수는 해당 이벤트가 발생하기 전까지, 요청된 파일의 경로를 계속 누적합니다. (파일 등록은 안된 상태입니다.)
   * @param {string} audioSrc 
   */
  createAudio (audioSrc) {
    if (this.cacheAudio.has(audioSrc)) return

    this.createAudioSrcWaitList.push(audioSrc)
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
      newNode.connect(this.audioNode.firstGain)
      this.cacheAudioNode.set(audioSrc, newNode) // 컨텍스트에 연결할 오디오 노드
      return this.cacheAudio.get(audioSrc)
    }

    // 배열의 모든 내용을 삭제
    this.createAudioSrcWaitList.length = 0
  }

  /**
   * 해당 사운드를 재생합니다. 이것은 오디오 파일을 직접 재생하는것을 목표로 만들어졌습니다.
   * 따라서 오디오 파일을 중복해서 재생할 수 없습니다. (이렇게하려면 buffer를 사용하거나 다른 이름의 오디오 파일을 만드세요.)
   * 
   * 오디오가 중간에 재생중인경우, 해당 오디오를 처음부터 다시 재생합니다.
   * 
   * 주의: targetAudio가 오디오객체일경우 이 오디오객체는 웹 오디오 효과가 적용되지 않습니다.
   * 
   * @param {HTMLMediaElement | string | AudioBuffer} audioSrc 오디오의 경로 또는 오디오버퍼
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
    } else if (audioSrc instanceof AudioBuffer) {
      // 버퍼 재생은 다른 함수에서 실행
      this.playBuffer(audioSrc, effect)
      return
    }

    if (getAudio == null || getNode == null) return

    // 일시정지되면, 다시 재생시키고, 이미 재생중이라면 처음부터 다시 재생합니다.
    if (getAudio.paused) {
      getAudio.play().catch(() => {
        alert('sound play denied. 사운드 플레이 거부. 이것은 모바일에서의 제약으로 인한 오류입니다. 개발자는 해당 오류를 수정할 수 있으므로 문의주세요.')
      })
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
   * @type {any[]} 
   */
  musicTrack = []

  /**
   * 해당 사운드를 음악처럼 취급해서 재생합니다. (효과음은 play 함수를 사용해주세요.)
   * 이 함수를 사용할경우, 루프를 사용하는것으로 간주 (반복재생)
   * 
   * 배경음은 audio 객체를 직접 사용하여 출력할 수 없습니다.
   * 
   * 여러개의 곡을 동시 재생할 수는 있지만, 로딩 능력에 따라 싱크 오류가 발생 할 수 있습니다. (싱크 오류는 막을 수 없음.)
   * 따라서, 확실하게 동시에 재생되어야 한다면 musicBuffer 함수를 이용해 버퍼를 만든 후에 재생하세요.
   * 
   * 경고: 오디오 객체를 넣을 경우, 해당 오디오는 에코 효과를 적용하지 않고 음악을 재생합니다.
   * 
   * 효과음을 이것으로 출력하지 마세요. 왜냐하면, 한번 음악을 출력하면 그것으로는 효과음을 출력할 수 없도록 재연결 작업이 진행됩니다.
   * 
   * @param {string | HTMLMediaElement | AudioBuffer} audioSrc 오디오의 경로 또는 오디오 객체 (버퍼는 사용불가, 대신 musicBuffer를 사용해주세요.)
   */
  musicPlay (audioSrc) {
    if (typeof audioSrc === 'number' || typeof audioSrc === 'string') {
      let getMusic = this.getCacheAudio(audioSrc)
      let getNode = this.getCacheAudioNode(audioSrc)
      if (getMusic && getNode != null) {
        getNode.disconnect()
        getNode.connect(this.audioNode.musicFirstGain)
        getMusic.play()
        getMusic.loop = true
        this.musicTrack.push(getMusic)
      }
    } else if (audioSrc instanceof HTMLAudioElement) {
      audioSrc.loop = true
      audioSrc.play()
      this.musicTrack.push(audioSrc)
    }
  }

  /** 오디오 버퍼를 음악으로 재생합니다. (루프는 강제 적용) */
  musicBuffer (audioSrc, start, end) {

  }

  /** 
   * 다음 음악을 페이드 효과를 이용해 변경합니다.
   * 
   * 경고: 이 함수를 사용하는 즉시 재생중인 모든 음악은 페이드 아웃됩니다.
   * 그리고 새로운 음악으로 교체됩니다.
   */
  musicFadeNextAudio (audioSrc, fadeTime = 2) {
    this.fade.isNextBuffer = false
    this.fade.isFading = true
    this.fade.nextAudioSrc = audioSrc
    this.fade.fadeTime = fadeTime
  }

  /** 다음 음악을 페이드 효과를 이용해 변경합니다. (버퍼로 재생함.) */
  musicFadeNextBuffer (audioSrc, fadeTime) {

  }

  /** 
   * 참고: 이 함수는 자동으로 반복되어 실행됩니다. (0.1초 단위)  
   * 주로, 페이드 인 효과를 정의할 때 사용합니다.
   */
  musicProcess () {

    // 페이드 과정 진행
    if (this.fade.isFading) {
      
    }
  }

  /** 현재 재생중인 모든 음악 정지, 그래도 재생중인 트랙의 모든 데이터는 지워집니다. */
  musicStop () {
    for (let i = 0; i < this.musicTrack.length; i++) {
      let currentMusic = this.musicTrack[i]
      if (currentMusic instanceof HTMLAudioElement) {
        currentMusic.currentTime = 0
        currentMusic.pause()
      }
    }

    this.musicTrack.length = 0
  }

  /** 현재 재생중인 모든 음악 일시정지, 단 이 경우, 재생중인 트랙에서 삭제되지 않습니다. */
  musicPause () {
    for (let i = 0; i <this.musicTrack.length; i++) {
      let currentMusic = this.musicTrack[i]
      if (currentMusic instanceof HTMLAudioElement) {
        currentMusic.pause()
      }
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
    this.audioNode.echoDelay.delayTime = 0
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