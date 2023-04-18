/**
 * 모바일을 위한 터치버튼 시스템 (레이아웃과 엘리먼트만 있습니다.)
 * 
 * 경고: 사용자가 직접 버튼의 역할을 지정해야 합니다.
 * 
 * 이것은 controlSystem에서 사용하기 위한 클래스이므로, export 하지 않습니다.
 */
class TouchButton {
  /** 
   * 터치버튼의 div의 style을 portrait 또는 landscape로 수정합니다.
   * @param {boolean} isPortrait portrait여부(세로모드)
   */
  setStyleDiv (isPortrait = true) {
    if (isPortrait) {
      this.elementCenter.style.position = 'absolute'
      this.elementCenter.style.top = '50%'

      this.divAreaFirst.style.width = '100vw'
      this.divAreaFirst.style.height = '20vw'

      this.setButtonStyle(this.buttonL1, '15vw', '10vw', {left: '1%'})
      this.setButtonStyle(this.buttonL2, '15vw', '10vw', {left: '20%'})
      this.setButtonStyle(this.buttonR1, '15vw', '10vw', {right: '1%'})
      this.setButtonStyle(this.buttonR2, '15vw', '10vw', {right: '20%'})
      this.setButtonStyle(this.buttonStart, '10vw', '6vw', {left: '38%', top: '5%'})
      this.setButtonStyle(this.buttonSelect, '10vw', '6vw', {left: '52%', top: '5%'})

      this.divAreaSecond.style.width = '40vw'
      this.divAreaSecond.style.height = '40vw'

      this.setButtonStyle(this.buttonArrow, '50%', '50%', {left: '25%', top: '25%'})
      
      this.divAreaThird.style.width = '20vw'
      this.divAreaThird.style.height = '40vw'

      this.divAreaForth.style.width = '40vw'
      this.divAreaForth.style.height = '40vw'
      this.divAreaForth.style.right = ''
      this.setButtonStyle(this.buttonA, '16vw', '16vw', {bottom: '0%', left: '30%'})
      this.setButtonStyle(this.buttonB, '16vw', '16vw', {top: '30%', right: '0%'})
      this.setButtonStyle(this.buttonX, '16vw', '16vw', {top: '30%', left: '0%'})
      this.setButtonStyle(this.buttonY, '16vw', '16vw', {top: '0%', left: '30%'})
    } else {
      this.elementCenter.style.position = 'absolute'
      this.elementCenter.style.top = '25%'

      this.divAreaFirst.style.width = '100vw'
      this.divAreaFirst.style.height = '20vh'

      this.setButtonStyle(this.buttonL1, '15vh', '10vh', {left: '1%'})
      this.setButtonStyle(this.buttonL2, '15vh', '10vh', {left: '12%'})
      this.setButtonStyle(this.buttonR1, '15vh', '10vh', {right: '1%'})
      this.setButtonStyle(this.buttonR2, '15vh', '10vh', {right: '12%'})
      this.setButtonStyle(this.buttonStart, '15vh', '10vh', {left: '1%', top: '-100%'})
      this.setButtonStyle(this.buttonSelect, '15vh', '10vh', {left: '12%', top: '-100%'})

      this.divAreaSecond.style.width = '20vw'
      this.divAreaSecond.style.height = '20vw'
      this.divAreaSecond.style.left = '0%'

      this.divAreaThird.style.width = '60vw'
      this.divAreaThird.style.height = '60vw'

      this.divAreaForth.style.width = '20vw'
      this.divAreaForth.style.height = '20vw'
      this.divAreaForth.style.right = '2%'
      this.setButtonStyle(this.buttonA, '16vh', '16vh', {bottom: '0%', left: '30%'})
      this.setButtonStyle(this.buttonB, '16vh', '16vh', {top: '30%', right: '0%'})
      this.setButtonStyle(this.buttonX, '16vh', '16vh', {top: '30%', left: '0%'})
      this.setButtonStyle(this.buttonY, '16vh', '16vh', {top: '0%', left: '30%'})

    }
  }

  /**
   * 버튼의 스타일을 설정합니다. (가로/세로 전환용)
   * @param {Element} buttonElement 
   * @param {string} width 
   * @param {string} height 
   * @param {{left: string, right: string, top: string, bottom: string}} coordination 
   */
  setButtonStyle (buttonElement, width, height, coordination) {
    buttonElement.style.width = width
    buttonElement.style.height = height

    if (coordination.left != null) buttonElement.style.left = coordination.left
    if (coordination.right != null) buttonElement.style.right = coordination.right
    if (coordination.top != null) buttonElement.style.top = coordination.top
    if (coordination.bottom != null) buttonElement.style.bottom = coordination.bottom
  }

  constructor (resourceSrc) {
    // 스타일 설정은 맨 마지막에 진행
    // 여기서는, 스타일이 변경될 가능성이 없는 css 속성만 추가

    /** 터치버튼의 이미지 경로 */
    this.imageSrc = {
      buttonArrow: resourceSrc + 'buttonArrow.png',
      buttonArrowBox: resourceSrc + 'buttonArrowBox.png',
      buttonA: resourceSrc + 'buttonA.png',
      buttonB: resourceSrc + 'buttonB.png',
      buttonX: resourceSrc + 'buttonX.png',
      buttonY: resourceSrc + 'buttonY.png',
      buttonL1: resourceSrc + 'buttonL1.png',
      buttonL2: resourceSrc + 'buttonL2.png',
      buttonR1: resourceSrc + 'buttonR1.png',
      buttonR2: resourceSrc + 'buttonR2.png',
      buttonStart: resourceSrc + 'buttonStart.png',
      buttonSelect: resourceSrc + 'buttonSelect.png',
    }

    /** 모든 패드 영역을 담고 있는 엘리먼트 */
    this.elementCenter = document.createElement('div')
    this.elementCenter.id = 'touchButtonElement'

    /** 터치패드에서 사용하는 첫번째 영역 */
    this.elementFirst = document.createElement('div')
    this.elementFirst.style.display = 'flex'
    this.elementFirst.style.opacity = '50%'
    this.elementFirst.id = 'elementFirst'
    this.elementCenter.appendChild(this.elementFirst)

    /** 첫번째 영역의 레이아웃 영역 */
    this.divAreaFirst = document.createElement('div')
    this.divAreaFirst.style.position = 'relative'
    this.elementFirst.appendChild(this.divAreaFirst)

    this.buttonL1 = this.createButton('15vw', '10vw', {left: '1%'}, this.imageSrc.buttonL1)
    this.buttonL2 = this.createButton('15vw', '10vw', {left: '20%'}, this.imageSrc.buttonL2)
    this.buttonR1 = this.createButton('15vw', '10vw', {right: '1%'}, this.imageSrc.buttonR1)
    this.buttonR2 = this.createButton('15vw', '10vw', {right: '20%'}, this.imageSrc.buttonR2)
    this.buttonStart = this.createButton('10vw', '6vw', {left: '38%', top: '5%'}, this.imageSrc.buttonStart)
    this.buttonSelect = this.createButton('10vw', '6vw', {left: '52%', top: '5%'}, this.imageSrc.buttonSelect)
    this.divAreaFirst.appendChild(this.buttonL1)
    this.divAreaFirst.appendChild(this.buttonL2)
    this.divAreaFirst.appendChild(this.buttonR1)
    this.divAreaFirst.appendChild(this.buttonR2)
    this.divAreaFirst.appendChild(this.buttonStart)
    this.divAreaFirst.appendChild(this.buttonSelect)

    /** 터치패드에서 사용하는 두번째 영역 */
    this.elementSecond = document.createElement('div')
    this.elementSecond.style.display = 'flex'
    this.elementSecond.style.opacity = '80%'
    this.elementSecond.id = 'elementSecond'
    this.elementCenter.appendChild(this.elementSecond)

    /** 터치패드에서 사용하는 div의 두번째 영역 */
    this.divAreaSecond = document.createElement('div')
    this.divAreaSecond.style.position = 'relative'
    this.imageArrow = document.createElement('img')
    this.imageArrow.style.pointerEvents = 'none'
    this.imageArrow.src = this.imageSrc.buttonArrowBox
    this.imageArrow.style.width = '100%'
    this.imageArrow.style.height = '100%'
    this.buttonArrow = this.createButton('50%', '50%', {left: '25%', top: '25%'}, this.imageSrc.buttonArrow)
    this.buttonArrow.style.pointerEvents = 'none'
    this.divAreaSecond.style.backgroundColor = '#323232'
    this.elementSecond.appendChild(this.divAreaSecond)
    this.divAreaSecond.appendChild(this.imageArrow)
    this.divAreaSecond.appendChild(this.buttonArrow)

    /** 터치패드에서 사용하는 div의 세번째 영역(그러나, 비어있는 공간입니다.) */
    this.divAreaThird = document.createElement('div')
    this.elementSecond.appendChild(this.divAreaThird)

    /** 터치패드에서 사용하는 div의 네번째 영역 */
    this.divAreaForth = document.createElement('div')
    this.divAreaForth.style.position = 'relative'
    this.elementSecond.appendChild(this.divAreaForth)

    this.buttonA = this.createButton('16vw', '16vw', {bottom: '0%', left: '30%'}, this.imageSrc.buttonA)
    this.buttonB = this.createButton('16vw', '16vw', {top: '30%', right: '0%'}, this.imageSrc.buttonB)
    this.buttonX = this.createButton('16vw', '16vw', {top: '30%', left: '0%'}, this.imageSrc.buttonX)
    this.buttonY = this.createButton('16vw', '16vw', {top: '0%', left: '30%'}, this.imageSrc.buttonY)
    this.divAreaForth.appendChild(this.buttonA)
    this.divAreaForth.appendChild(this.buttonB)
    this.divAreaForth.appendChild(this.buttonX)
    this.divAreaForth.appendChild(this.buttonY)

    // 마지막: 레이아웃 처리(가로/세로모드에 따른...)
    if (matchMedia('(orientation: portrait)').matches) {
      this.changeLayout(true)
    } else {
      this.changeLayout(false)
    }
  }

  /**
   * 터치패드에서 새 버튼을 만들 때 사용하는 함수
   * 
   * 이 함수를 사용하면 내부에 이미지 태그까지 포함된 채로 div 태그를 만들어줍니다.
   * @param {string} width 너비, 반드시 문자열로 입력해야 합니다. css값을 넣어야 합니다.
   * @param {string} height 높이, 반드시 문자열로 입력해야 합니다. css값을 넣어야 합니다.
   * @param {{left: string, right: string, top: string, bottom: string}} arrowObject 각 포지션에 따른, 위치값(css 값) 
   * @param {string} imageSrc 이미지의 경로
   */
  createButton (width, height, arrowObject, imageSrc) {
    let element = document.createElement('div')
    element.style.width = width
    element.style.height = height
    element.style.position = 'absolute'
    
    // 해당 값이 있을 때만 값을 적용
    if (arrowObject.left != null) element.style.left = arrowObject.left
    if (arrowObject.right != null) element.style.right = arrowObject.right
    if (arrowObject.top != null) element.style.top = arrowObject.top
    if (arrowObject.bottom != null) element.style.bottom = arrowObject.bottom

    let imageElement = document.createElement('img')
    imageElement.src = imageSrc
    imageElement.style.width = '100%'
    imageElement.style.height = '100%'
    imageElement.style.pointerEvents = 'none'

    element.appendChild(imageElement)

    return element
  }

  /**
   * document.body에 해당 가상 키패드를 추가합니다.
   * (키패드는 뷰포트 기준으로 표시되므로, 반응형입니다.)
   * 
   * responsive type
   * @param {boolean} autoResizeEvent 브라우저의 크기가 변경되면, 자동으로 가로/세로 모드로 전환합니다.
   */
  bodyInsert (autoResizeEvent = true) {
    if (document.getElementById('firstElement') == null) {
      document.body.appendChild(this.elementCenter)
      if (autoResizeEvent) {
        addEventListener('resize', () => {
          if (matchMedia('(orientation: portrait)').matches) {
            this.changeLayout(true)
          } else {
            this.changeLayout(false)
          }
        })
      }

    }
  }

  /** 
   * 이 컨트롤러의 레이아웃을 포트레이트(또는 랜드스케이프) 모드로 변경합니다.
   * 
   * 기본값은 세로이며, isPortrait값이 false일경우 가로입니다.
   * @param {boolean} isPortrait portrait: true(default), landscape: false
   */
  changeLayout (isPortrait = true) {
    this.setStyleDiv(isPortrait)
  }
}

/**
 * 컨트롤 시스템: 터치, 키보드, 마우스, 버튼 입력 처리
 * 
 * 가상 터치 버튼은 createTouchButton 함수를 사용해서 생성해주세요. 생성하지 않으면 사용할 수 없습니다.
 * 
 * 이 클래스를 생성하는 순간 키보드 이벤트가 자동으로 추가됩니다. (해당 페이지 전체에)
 * 
 * 마우스 이벤트와 터치 이벤트는 addEventMouseTouch 함수를 통해 수동으로 추가해주세요.
 */
export class ControlSystem {
  /**
   * 
   * @param {string} resourceSrc 이 컨트롤 시스템이 사용하는 외부 리소스의 경로
   */
  constructor (resourceSrc) {
    /** 
     * 컨트롤 시스템에서 사용하는 가상 터치버튼
     * 
     * 다만, 기본적으로 생성되지 않습니다. 대신 createTouchButton 함수를 호출해야 합니다.
     * 
     * 이 터치버튼은 모바일 용도로 사용해주세요.
     */
    this.touchButton = null

    // 키보드 이벤트 추가
    addEventListener('keydown', (e) => {
      this.setButtonKeyDown(e.key)
    })
    addEventListener('keyup', (e) => {
      this.setButtonKeyUp(e.key)
    })

    this.intervalId = setInterval(() => {
      this.processButton()
    }, 20)
    
    /** 이 컨트롤 시스템의 기본 파일이 사용하는 외부 리소스의 경로 */
    this.resourceSrc = resourceSrc
  }

  /**
   * 특정 엘리먼트(캔버스)에 마우스와 터치 이벤트를 추가합니다.
   * 
   * (참고: 가상 패드와 이벤트는 별도로 처리됩니다.)
   * @param {HTMLElement | HTMLCanvasElement} targetElement 캔버스 또는 그외 엘리먼트
   */
  addEventMouseTouch (targetElement) {
    targetElement.addEventListener('touchstart', (e) => {
      // 마우스의 offsetX, offsetY를 계산하기
      var rect = e.target.getBoundingClientRect();
      var offsetX = e.targetTouches[0].pageX - rect.left;
      var offsetY = e.targetTouches[0].pageY - rect.top;
    
      // 캔버스의 확대/축소를 고려하여 마우스의 좌표를 계산합니다.
      const canvasZoomWidth = targetElement.clientWidth / targetElement.width
      const canvasZoomHeight = targetElement.clientHeight / targetElement.height
    
      // 마우스를 눌렀다고 설정한 후 마우스를 누른 좌표를 입력합니다.
      // 캔버스 내에 터치를 시도할경우, 마우스를 클릭한 것과 같은 효과를 가집니다.
      this.setMouseDown()
      this.setMousePosition(offsetX / canvasZoomWidth, offsetY / canvasZoomHeight)
      e.preventDefault()
    })
    targetElement.addEventListener('touchmove', (e) => {
      // 마우스의 offsetX, offsetY를 계산하기
      var rect = e.target.getBoundingClientRect();
      var offsetX = e.targetTouches[0].pageX - rect.left;
      var offsetY = e.targetTouches[0].pageY - rect.top;
    
      // 캔버스의 확대/축소를 고려하여 마우스의 좌표를 계산합니다.
      const canvasZoomWidth = targetElement.clientWidth / targetElement.width
      const canvasZoomHeight = targetElement.clientHeight / targetElement.height
    
      // 마우스를 눌렀다고 설정한 후 마우스를 누른 좌표를 입력합니다.
      // 캔버스 내에 터치를 시도할경우, 마우스를 클릭한 것과 같은 효과를 가집니다.
      this.setMousePosition(offsetX / canvasZoomWidth, offsetY / canvasZoomHeight)
      e.preventDefault()
    })
    targetElement.addEventListener('touchend', () => {
      this.setMouseUp() // 터치에서 모든 손을 떼면 마우스를 뗀 것과 같음
    })
    targetElement.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return

      // 캔버스의 확대/축소를 고려하여 마우스의 좌표를 계산합니다.
      const canvasZoomWidth = targetElement.clientWidth / targetElement.width
      const canvasZoomHeight = targetElement.clientHeight / targetElement.height

      // 마우스를 눌렀다고 설정한 후 마우스를 누른 좌표를 입력합니다.
      this.setMouseDown()
      this.setMousePosition(e.offsetX / canvasZoomWidth, e.offsetY / canvasZoomHeight)
      e.preventDefault()
    })
    targetElement.addEventListener('mousemove', (e) => {
      // 캔버스의 확대/축소를 고려하여 마우스의 좌표를 계산합니다.
      const canvasZoomWidth = targetElement.clientWidth / targetElement.width
      const canvasZoomHeight = targetElement.clientHeight / targetElement.height

      // 마우스의 현재 좌표를 입력합니다.
      this.setMousePosition(e.offsetX / canvasZoomWidth, e.offsetY / canvasZoomHeight)
      e.preventDefault()
    })
    targetElement.addEventListener('mouseup', () => {
      this.setMouseUp()
    })
    targetElement.addEventListener('click', (e) => {
      // 0번(마우스 왼쪽) 클릭만 허용, 나머지 무효
      if (e.button !== 0) return

      // 캔버스의 확대/축소를 고려하여 마우스의 좌표를 계산합니다.
      const canvasZoomWidth = targetElement.clientWidth / targetElement.width
      const canvasZoomHeight = targetElement.clientHeight / targetElement.height

      // 마우스의 클릭한 현재 좌표를 입력합니다.
      this.setClick(e.offsetX / canvasZoomWidth, e.offsetY / canvasZoomHeight)

      e.preventDefault()
    })
  }

  /**
   * 터치버튼을 생성하고 이벤트를 등록합니다.
   * 
   * 터치버튼을 누르면 해당 버튼이 누른 것 처럼 동작합니다.
   */
  createTouchButton () {
    this.touchButton = new TouchButton(this.resourceSrc)
    this.touchButton.bodyInsert()
    this.addTouchButtonEvent(this.touchButton.buttonA, this.buttonIndex.A)
    this.addTouchButtonEvent(this.touchButton.buttonB, this.buttonIndex.B)
    this.addTouchButtonEvent(this.touchButton.buttonX, this.buttonIndex.X)
    this.addTouchButtonEvent(this.touchButton.buttonY, this.buttonIndex.Y)
    this.addTouchButtonEvent(this.touchButton.buttonL1, this.buttonIndex.L1)
    this.addTouchButtonEvent(this.touchButton.buttonL2, this.buttonIndex.L2)
    this.addTouchButtonEvent(this.touchButton.buttonR1, this.buttonIndex.R1)
    this.addTouchButtonEvent(this.touchButton.buttonR2, this.buttonIndex.R2)
    this.addTouchButtonEvent(this.touchButton.buttonStart, this.buttonIndex.START)
    this.addTouchButtonEvent(this.touchButton.buttonSelect, this.buttonIndex.SELECT)
    
    // arrow button event
    this.addTouchArrowButtonEvent()
  }

  /**
   * 터치 버튼 이벤트를 간편하게 추가하기 위한 목적으로 만들어진 함수,
   * 추가되는 이벤트는 touchstart, touchend, touchmove입니다.
   * (pc버전에서는 고려되지 않음.)
   * @param {HTMLElement} targetButton 
   * @param {number} buttonIndex 
   */
  addTouchButtonEvent (targetButton, buttonIndex) {
    targetButton.addEventListener('touchstart', (e) => {
      this.setButtonDown(buttonIndex)
      this.setButtonInput(buttonIndex)
      e.preventDefault()
    })
    targetButton.addEventListener('touchmove', (e) => {
      this.setButtonDown(buttonIndex)
      e.preventDefault()
    })
    targetButton.addEventListener('touchend', (e) => {
      this.setButtonUp(buttonIndex)
      e.preventDefault()
    })
  }

  /**
   * 이것은 arrow 버튼 이벤트를 간편하게 추가하기 위한 목적으로 만들어진 함수입니다.
   * 
   * arrowButton만 해당되며, 다른 버튼은 addTouchButtonEvent 함수를 사용해주세요.
   */
  addTouchArrowButtonEvent () {
    // arrow는 다른 함수를 사용해서 동작합니다.
    // 한 개의 버튼을 어떻게 사용하느냐에 따라 입력이 달라지기 때문입니다.

    // 각 위치에 따른 퍼센트값: 왼쪽/위, 가운데, 오른쪽/아래
    // css값 이므로 string으로 정의되었습니다.
    const minPercent = '0%'
    const centerPercent = '25%'
    const maxPercent = '50%'

    let arrowButtonFunction = (e, isInput = true) => {
      // offsetX, offsetY를 얻기 위한 과정
      var rect = e.target.getBoundingClientRect()
      var offsetX = e.targetTouches[0].pageX - rect.left
      var offsetY = e.targetTouches[0].pageY - rect.top
    
      let percentX = offsetX / rect.width
      let percentY = offsetY / rect.height
    
      // 퍼센트 구간에 따라 입력값을 설정합니다.
      // 그리고, buttonArrow의 표시 위치또한 변경합니다.
      // 만약 buttonArrow가 가운데에 있다면 어떤 입력도 하지 않습니다.
      if (percentX <= 0.33) {
        this.touchButton.buttonArrow.style.left = minPercent
        this.setButtonDown(this.buttonIndex.LEFT)
        this.setTouchButton(this.buttonIndex.LEFT)
        if (isInput) this.setButtonInput(this.buttonIndex.LEFT)
      } else if (percentX >= 0.34 && percentX <= 0.66) {
        this.touchButton.buttonArrow.style.left = centerPercent
        this.setButtonUp(this.buttonIndex.LEFT)
        this.setButtonUp(this.buttonIndex.RIGHT)
      } else if (percentX >= 0.67) {
        this.touchButton.buttonArrow.style.left = maxPercent
        this.setButtonDown(this.buttonIndex.RIGHT)
        this.setTouchButton(this.buttonIndex.RIGHT)
        if (isInput) this.setButtonInput(this.buttonIndex.RIGHT)
      }
    
      if (percentY <= 0.33) {
        this.touchButton.buttonArrow.style.top = minPercent
        this.setButtonDown(this.buttonIndex.UP)
        this.setTouchButton(this.buttonIndex.UP)
        if (isInput) this.setButtonInput(this.buttonIndex.UP)
      } else if (percentY >= 0.34 && percentY <= 0.66) {
        this.touchButton.buttonArrow.style.top = centerPercent
        this.setButtonUp(this.buttonIndex.UP)
        this.setButtonUp(this.buttonIndex.DOWN)
      } else if (percentY >= 0.67) {
        this.setButtonDown(this.buttonIndex.DOWN)
        this.setTouchButton(this.buttonIndex.DOWN)
        if (isInput) this.setButtonInput(this.buttonIndex.DOWN)
        this.touchButton.buttonArrow.style.top = maxPercent
      }  
    }

    // 참고: e.stopPropagation 을 하지 않으면 터치 입력이 이중으로 되어서
    // 잘못된 형태로 터치처리가 될 수 있음.
    this.touchButton.divAreaSecond.addEventListener('touchstart', (e) => {
      arrowButtonFunction(e, true)
      e.preventDefault()
    })
    this.touchButton.divAreaSecond.addEventListener('touchmove', (e) => {
      arrowButtonFunction(e, false)
      e.preventDefault()
    })

    // 터치에서 손을 떼었다면 이동버튼은 아무것도 누르지 않은것으로 처리합니다.
    this.touchButton.divAreaSecond.addEventListener('touchend', (e) => {
      this.setButtonUp(this.buttonIndex.LEFT)
      this.setButtonUp(this.buttonIndex.RIGHT)
      this.setButtonUp(this.buttonIndex.DOWN)
      this.setButtonUp(this.buttonIndex.UP)
      this.touchButton.buttonArrow.style.left = centerPercent
      this.touchButton.buttonArrow.style.top = centerPercent
      e.preventDefault()
    })
  }

  /** 버튼의 목록 (어떤 버튼인지를 찾을 때 이 상수를 사용해주세요.) */
  buttonIndex = {
    START: 0, SELECT: 1, SYSTEM: 2,
    LEFT: 3, RIGHT: 4, UP: 5, DOWN: 6,
    A: 7, B: 8, X: 9, Y: 10, L1: 11, L2: 12, R1: 13, R2: 14,
    ESC: 15, F2: 16,
  }

  /** 
   * 해당 버튼의 이름 값. 이 값은 일반적으로는 사용하지 않습니다. 
   * @deprecated
   */
  buttonText = {
    START: 'start', SELECT: 'select', SYSTEM: 'system',
    LEFT: 'left', RIGHT: 'right', UP: 'up', DOWN: 'down',
    A: 'A', B: 'B', X: 'X', Y: 'Y', L1: 'L1', L2: 'L2', R1: 'R1', R2: 'R2',
    DEL: 'DEL', F2: 'F2'
  }

  /** 키바인드맵(keybindmap) 의 기본값 */
  DEFAULT_KEYBINDMAP = [
    'Enter', 'Shift', 'unused', 
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'z', 'x', 'c', 'v', 'a', 's', 'd', 'f',
    'Escape', 'F2']

  ERROR_MESSAGE_BUTTON_OUT_OF_INDEX = 
    '잘못된 버튼의 인덱스가 입력되었습니다. 가능하면 buttonSystem 클래스 내부에 있는 상수 값을 인덱스로 사용하세요.'

  /** 현재 사용하고 있는 키 바인드 맵 */
  currentKeyBindMap = this.DEFAULT_KEYBINDMAP.slice()

  // 자바스크립트에서 새로운 배열을 for문 없이 초기화해서 생성하려면
  // new Array(배열 길이).fill(값) 의 형태를 사용해야 합니다.
  /** 버튼이 입력되었는지 확인하는 배열 (1회 누른것만 감지) */
  isButtonInput = new Array(this.DEFAULT_KEYBINDMAP.length).fill(false)

  /** 버튼이 눌려있는 상태인지 확인하는 배열 (누르는 동안만 true) */
  isButtonDown = new Array(this.DEFAULT_KEYBINDMAP.length).fill(false)

  /** 
   * 버튼이 눌려지기 시작한 후 얼마의 시간이 지났는지 확인하는 배열 
   * (경고: 단위가 초가 아닙니다. 게임 루프 속도에 따라 다를 수 있습니다.)
   */
  buttonPressTime = new Array(this.DEFAULT_KEYBINDMAP.length).fill(0)

  /**
   * 터치가 쭉 눌려져 있는 상태에서 일정시간마다 input가 눌려지도록 누른 시간을 계산하는 용도
   */
  touchPressTime = new Array(this.DEFAULT_KEYBINDMAP.length).fill(0)

  /**
   * 키 바인드 맵을 설정합니다.
   * 
   * 잘못된 버튼을 변경하려 시도한다면 해당 요청은 자동으로 무시됩니다.
   * 
   * 실수 방지를 위해 buttonList의 상수값을 사용해주세요.
   * @param {number | keyBindMap} buttonIndex 버튼의 인덱스 (buttonList의 상수 값 참고)
   * @param {Event.key} keyValue 키값, 자바스크립트 이벤트로 받을 때 e.key의 값, keyCode 사용금지
   */
  setKeyBindMap (buttonIndex, keyValue) {
    if (buttonIndex >= 0 && buttonIndex < this.DEFAULT_KEYBINDMAP.length) {
      this.currentKeyBindMap[buttonIndex] = keyValue
    }
  }

  /** 현재 사용하고 있는 키바인드맵을 가져옵니다. */
  getKeyBindMap () {
    return this.currentKeyBindMap
  }
  
  /**
   * 특정 버튼을 누른것으로 처리합니다.
   * 
   * 다시 인식시키려면 한번 더 버튼을 다시 눌러야 합니다.
   * @param {number} buttonIndex 버튼의 index (해당 클래스의 buttonIndex 참고)
   */
  setButtonInput (buttonIndex) {
    this.isButtonInput[buttonIndex] = true
  }

  /**
   * 특정 버튼을 누른 상태인것으로 처리합니다. (해당 버튼을 떼기 전까지 지속)
   * (참고: buttonDown과 buttonInput를 동시에 처리합니다.)
   * 
   * 버튼을 누르고 있는 동안 press 값이 지속적으로 증가합니다. (버튼을 떼면 press 값 초기화)
   * @param {number} buttonIndex 버튼의 index (해당 클래스의 buttonIndex 참고)
   * @param {boolean} isInputButtonCheck 버튼 input
   */
  setButtonDown (buttonIndex) {
    this.isButtonDown[buttonIndex] = true
  }

  /**
   * 특정 버튼을 뗀 것으로 처리합니다.
   * 
   * 따라서 버튼을 떼면 input, down상태가 무효가 되고, press값은 초기화됩니다.
   * @param {number} buttonIndex 버튼의 index (해당 클래스의 buttonIndex 참고)
   */
  setButtonUp (buttonIndex) {
    this.isButtonDown[buttonIndex] = false
    this.isButtonInput[buttonIndex] = false
    this.buttonPressTime[buttonIndex] = 0
    this.touchPressTime[buttonIndex] = 0
  }

  /**
   * 터치로 버튼을 눌렀을 때, input를 일정시간마다 입력하도록 조정합니다.
   * 
   * @deprecated
   * @param {number} buttonIndex 
   */
  setTouchButton (buttonIndex) {
    let pressTime = this.buttonPressTime[buttonIndex]
    if (pressTime >= 15 && pressTime % 4 === 1) {
      this.setButtonInput(buttonIndex)
    }
  }

  /**
   * 현재 버튼이 입력된 상태인지 확인합니다.
   * 한번 확인한 후에는 해당 버튼의 입력상태를 해제합니다. (1회성 입력)
   * @param {number} buttonIndex 
   */
  getButtonInput (buttonIndex) {
    // 버튼이 눌려져있는 상태라면, 이 상태를 제거한 후 ture를 리턴합니다.
    // 왜냐하면 1번만 눌린 상태를 체크해야 하기 때문입니다.
    if (this.isButtonInput[buttonIndex]) {
      this.isButtonInput[buttonIndex] = false
      return true
    } else {
      return false
    }
  }

  /**
   * 현재 버튼이 눌려져 있는 상태인지 확인합니다.
   * 
   * @param {number} buttonIndex 이 객체가 가지고 있는 buttonIndex의 상수값
   */
  getButtonDown (buttonIndex) {
    return this.isButtonDown[buttonIndex]
  }

  /**
   * 현재 버튼이 얼마나 오래 눌려져 있었는지 확인합니다.
   * (참고: 단위는 프레임입니다. 시간 단위가 아닙니다.)
   * @param {number} buttonIndex 
   */
  getButtonPress (buttonIndex) {
    return this.buttonPressTime[buttonIndex]
  }

  /**
   * 현재 입력한 키를 기준으로 특정 버튼이 눌렸다는 작업을 처리합니다.
   * @param {string} key 자바스크립트 이벤트 객체의 key값 (event.key 값)
   */
  setButtonKeyDown (key) {
    const keyBindIndex = this.currentKeyBindMap.indexOf(key)
    if (keyBindIndex !== -1) {
      this.setButtonDown(keyBindIndex)
      this.setButtonInput(keyBindIndex)
    }
  }

  

  /**
   * 현재 입력한 키를 기준으로 특정 버튼을 뗀 작업을 처리합니다.
   * @param {string} key 자바스크립트 이벤트 객체의 key값 (event.key 값)
   */
  setButtonKeyUp (key) {
    const keyBindIndex = this.currentKeyBindMap.indexOf(key)
    if (keyBindIndex !== -1) {
      this.setButtonUp(keyBindIndex)
    }
  }

  /** 
   * 버튼 처리에 관한 프로세스
   * 초당 입력횟수는 setInterval로 설정되며 약 50회입니다.
   */
  processButton () {
    for (let i = 0; i < this.buttonPressTime.length; i++) {
      if (this.getButtonDown(i)) {
        this.buttonPressTime[i]++
      } else {
        this.buttonPressTime[i] = 0
      }
    }
  }

  /** 아무 버튼 중 하나라도 눌려있는지를 확인합니다. */
  getButtonAnykey () {
    for (let i = 0; i < this.isButtonDown.length; i++) {
      if (this.isButtonDown[i]) {
        return true
      }
    }

    return false
  }


  /** 마우스 x좌표 */ mouseX = 0
  /** 마우스 y좌표 */ mouseY = 0
  /** 마우스 누른상태 확인 */ isMouseDown = false
  /** 마우스 이동 확인 이나 사용하지 않음 */ isMouseMove = false
  /** 마우스 클릭 확인 */ isClicked = false

  /**
   * 현재 마우스의 위치를 설정합니다.
   * 
   * (경고: 이것은 사용자의 마우스 커서 위치를 변경하지 않습니다.)
   * @param {number} offsetX 마우스의 X좌표 (event.offsetX)
   * @param {number} offsetY 마우스의 Y좌표 (event.offsetY)
   */
  setMousePosition (offsetX, offsetY) {
    this.mouseX = offsetX
    this.mouseY = offsetY
  }

  /**
   * 마우스를 누른 상태로 변경합니다.
   * 
   * 이 상태를 해제하려면 setMouseUp을 사용해주세요.
   */
  setMouseDown () {
    this.isMouseDown = true
  }

  /**
   * 마우스를 누른 상태를 해제합니다.
   * 
   * 마우스를 누른 상태로 만드려면 setMouseDown을 사용해주세요.
   */
  setMouseUp () {
    this.isMouseDown = false
  }

  /**
   * 마우스의 현재 좌표값을 가져옵니다.
   * @returns {{x: number, y: number}} x좌표와 y좌표의 값이 있는 객체
   */
  getMousePosition () {
    return {
      x: this.mouseX,
      y: this.mouseY
    }
  }

  /** 마우스의 x좌표를 가져옵니다. */
  getMouseX () {
    return Math.floor(this.mouseX)
  }

  /** 마우스의 y좌표를 가져옵니다. */
  getMouseY () {
    return Math.floor(this.mouseY)
  }

  /**
   * 마우스 클릭 여부
   * 
   * (마우스 down 여부는 검사하지 않습니다.)
   */
  getMouseClick () {
    if (this.isClicked) {
      this.isClicked = false
      return true
    } else {
      return false
    }
  }

  getMouseDown () {
    return this.isMouseDown
  }

  /**
   * x, y 위치에 클릭이 되었다고 설정합니다. (mouseDown과 별개)
   * @param {number} x x좌표
   * @param {number} y y좌표
   */
  setClick (x, y) {
    this.isClicked = true
    this.mouseX = x
    this.mouseY = y
  }
}