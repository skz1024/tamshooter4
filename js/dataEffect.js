import { DelayData, FieldData, EnimationData } from "./dataField.js"
import { ImageDataObject } from "./imageSrc.js"

/**
 * 이펙트 데이터
 * 기본 규칙: 이펙트는 한번만 모든 에니메이션 프레임을 번갈아 출력하고 사라집니다.
 * 예를들어, missileEffect의 경우, 해당 이펙트는 총 10프레임이며, 이 10프레임이 전부 출력되면 그 다음 프레임에 사라집니다.
 */
 export class EffectData extends FieldData {
  constructor () {
    super()
    /**
     * 이전 딜레이, 이펙트가 생성된 후 에니메이션이 재생되기 위한 대기시간,
     * 만약 beforeAnimationDelay가 60이라면, 60frame(1초) 후에 이펙트의 에니메이션을 재생합니다.
     */
    this.beforeAnimationDelay = 0

    /**
     * 이후 딜레이, 이펙트의 에니메이션이 종료된 후 이 시간 후에 오브젝트가 삭제됩니다.
     * 해당 이펙트는 마지막 프레임 모습을 한 상태로 정해진 시간 동안 남겨집니다.
     */
    this.afterAnimationDelay = 0

    /**
     * 다음 에니메이션 프레임으로 넘어가기 위한 지연시간 객체(프레임), 기본값 0
     * 지연시간이 0일경우 null
     */
    this.frameDelay = null

    /**
     * 이미지 파일 내에 있는 각 애니메이션 프레임의 길이
     * 이 값이 0일경우, 이미지 전체 길이를 출력한다.
     */
    this.frameWidth = 0

    /**
     * 이미지 파일 내에 있는 각 애니메이션 프레임의 높이
     * 이 값이 0일경우, 이미지 전체 높이를 출력한다.
     */
    this.frameHeight = 0

    /**
     * 이미지 파일의 경로
     */
    this.imageSrc = ''

    /**
     * 해당 에니메이션의 총합 프레임. 에니메이션 객체가 있을때는 해당 요소를 사용하지 않음.
     */
    this.totalFrame = 0

    /**
     * 프레임 반복 수 (에니메이션 용도로 사용합니다.). 가본값 1
     */
    this.frameRepeat = 1
  }

  /**
   * 설정값을 넣어주면 자동으로 에니메이션 세팅을 합니다.
   * @param {string} imageSrc 
   * @param {ImageDataObject} imageData 
   * @param {number} width 
   * @param {number} height 
   * @param {number} frameDelay 
   * @param {number} frameRepeat 
   */
  autoSetEnimation (imageSrc, imageData, width, height, frameDelay = 1, frameRepeat = 1) {
    if (imageSrc != null && imageData != null) {
      this.imageSrc = imageSrc
      this.imageData = imageData
      this.width = width == null ? imageData.width : width
      this.height = height == null ? imageData.height : height
      this.frameDelay = frameDelay
      this.frameRepeat = frameRepeat
      this.enimation = new EnimationData(imageSrc, imageData.x, imageData.y, imageData.width, imageData.height, imageData.frame, frameDelay, frameRepeat, width, height)
    }
  }

  afterInitDefault (width, height) {
    this.width = width
    this.height = height
    if (this.enimation != null) {
      this.enimation.setOutputSize(width, height)
    }
  }

  process () {
    // beforeDelay가 남아있으면, 오브젝트는 표시되지만, 에니메이션은 재생되지 않습니다.
    // 그리고 로직 처리도 되지 않고 함수가 종료됩니다.
    if (this.beforeAnimationDelay >= 1) {
      this.beforeAnimationDelay--
      return
    }

    // 만약, 이펙트가 600프레임 이상 지속되면, 강제로 제거됨.
    // 이것은 이펙트가 잠깐동안 나오는 에니메이션이기 때문...
    if (this.elapsedFrame >= 600) {
      this.isDeleted = true
    }

    this.processEnimation()
  }

  processEnimation () {
    // 에니메이션이 없는경우 리턴
    if (this.enimation == null) return

    if (this.enimation.finished) {
      // 만약, 에니메이션 재생이 끝났다면, afterAnimationDelay가 있는지 확인하고,
      // 있다면 해당 변수값을 감소시킴(그만큼 다음 작업이 지연됨)
      if (this.afterAnimationDelay >= 1) {
        this.afterAnimationDelay--
      } else {
        // 에니메이션 작업이 끝났다면, 해당 객체는 삭제함.
        this.isDeleted = true
      }
    } else {
      // 에니메이션 로직 처리
      this.enimation.process()
    }
  }

  display () {
    if (this.enimation != null) {
      this.enimation.display(this.x, this.y)
    } else {
      super.display()
    }
  }

  /** 에니메이션 지정 시, 최대로 재생할 총 프레임 수 (이 값이 65라면, 애니메이션은 65프레임동안 지속) */
  setMaxFrame (maxFrame = 1) {
    if (this.enimation == null) return

    this.enimation.maxFrame = maxFrame
  }
}

/**
 * 특정 정보를 이용하여 이펙트 데이터를 생성할 때 사용합니다. 
 * 그런데, 이 클래스로 오브젝트를 생성한 후 다른 곳에다가 해당 데이터를 복사하려면(넘기려면) getObject 함수를 사용하세요.
 * 
 * 아니면, new를 이용해서 새로 인스턴스를 생성하세요. (new CustomEffect(...)과 같이)
 */
export class CustomEffect extends EffectData {
  constructor (image, imageData, width, height, frameDelay = 0, frameRepeat = 1) {
    super()
    this.autoSetEnimation(image, imageData, width, height, frameDelay, frameRepeat)
  }

  /**
   * 커스텀 이펙트 데이터로 만든 오브젝트를 새로 생성합니다. (깊은 복사)
   * 
   * 이렇게 복사해두지 않으면, 오브젝트의 값들이 (얕은 복사로 인해) 공유될 수 있습니다. 
   */
  getObject () {
    // frameRepeat는 EffectData 클래스 내에 존재하지 않고, 
    // enimation.frameRepeat용도로 사용하기 때문에 frameRepeat 변수가 선언되서 사용되야 합니다.
    const frameRepeat = this.enimation != null ? this.enimation.frameRepeat : 1
    return new CustomEffect(this.imageSrc, this.imageData, this.width, this.height, this.frameDelay, frameRepeat)
  }
}

/** 
 * 커스텀 에디트 이펙트 (클래스를 임의로 만든 후에, 특정한 로직을 넣고 싶을 때 사용) 
 * 
 * 이 객체는 필드에서 생성해주지 않으므로, 필드에 넘길 때 새 인스턴스를 생성해서 넘겨야 합니다.
 */
export class CustomEditEffect extends EffectData {
  
}

