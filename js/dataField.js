//@ts-check

import { ImageDataObject } from "./imageSrc.js"
import { game } from "./game.js"

let graphicSystem = game.graphic

/**
 * 충돌 감지 함수
 * @param {FieldData} objectA
 * @param {FieldData} objectB
 */
 export function collision (objectA, objectB) {
  if (objectA.x < objectB.x + objectB.width &&
    objectA.x + objectA.width > objectB.x &&
    objectA.y < objectB.y + objectB.height &&
    objectA.y + objectA.height > objectB.y) {
    return true
  } else {
    return false
  }
}

/**
 * 충돌 감지 함수(OBB 한정)를 클래스로 변경했습니다. 이유는, 내부적으로만 사용하는 함수가 너무 많습니다.
 * 사각형 충돌 함수는 기존의 collision 함수를 그냥 사용합니다.
 */
export class collisionClass {
  /**
   * 충돌 감지 함수 그러나 회전한 사각형까지 제대로 충돌 감지 가능 (일부 객체에서 사용)
   * 다각형 충돌은 고려하지 않습니다. (모든 오브젝트는 사각형 판정)
   * 참고: 이 게임에서는 내부적으로 사각형 충돌 판정을 사용합니다.
   * 따라서, 회전한 사각형을 판정하려면 이 함수를 사용해야 합니다. (회전은 사각형의 중심을 기준으로 회전)
   * 그러나, 이 함수는 꼭짓점, 모서리에 대한 추가 연산을 사용하기 때문에
   * 복잡하고 더 많은 자원이 필요합니다. 따라서 필요한 경우에만 사용해주세요.
   *
   * 이 코드는 이 사이트를 참고해 재구성한 후 리메이크 했습니다.
   * http://programmerart.weebly.com/separating-axis-theorem.html
   * @param {FieldData} objectA
   * @param {FieldData} objectB
   */
  static collisionOBB (objectA, objectB) {
    // 각 오브젝트의 꼭짓점과 모서리를 계산합니다.
    // 자세한건, 각 함수의 내부 구현 참고... (내용이 너무 길어서 분리됨)
    const vertexA = this.getVertex(objectA)
    const vertexB = this.getVertex(objectB)
    const edgeA = this.getEdge(vertexA)
    const edgeB = this.getEdge(vertexB)

    /*
     * 법선 벡터를 계산합니다. 해당 벡터(여기서는 모서리)의 수직인 방향의 벡터를 법선 벡터라 합니다.
     * 법선 벡터는, 현재 벡터의 좌표(x, y) 를 (-y, x)로 변환해 만듭니다.
     * 계산한 모든 법선 벡터를 prependicularStack에 추가합니다.
     * 도형이 사각형이라면, 사실 법선 벡터는 각 rect당 2개면 충분합니다. (0번 모서리, 1번 모서리)
     * 그래서 사각형의 변 개수의 절반 만큼 루프를 돌게 했습니다. (4번이 아닌 2번 루프)
     */
    const perpendicularList = [] // 수직 벡터를 저장할 배열

    for (let i = 0; i < edgeA.length / 2; i++) {
      perpendicularList.push({ x: -edgeA[i].y, y: edgeA[i].x })
    }

    // vertexB도 마찬가지로 법선 벡터를 계산하고 prependicularStack에 추가합니다.
    for (let i = 0; i < edgeB.length / 2; i++) {
      perpendicularList.push({ x: -edgeB[i].y, y: edgeB[i].x })
    }

    // 이제 prependicularStack(법선 벡터 목록)에 있는 모든 법선벡터와 objectA, objectB에 있는 모든 변들을 조사합니다.
    for (let i = 0; i < perpendicularList.length; i++) {
      let distanceDot = 0 // 점과 점사이의 거리
      const vertexAdistanceDot = [] // vertexA의 각 변과 법선에 따른 점과 점사이의 거리
      const vertexBdistanceDot = [] // vertexB의 각 변과 법선에 따른 점과 점사이의 거리

      // vertexA의 각 꼭짓점에 대해 법선 벡터의 점과 점사이의 거리를 구합니다.
      for (let j = 0; j < vertexA.length; j++) {
        // 점과 점사이의 거리 = (vertexA의 j번째 꼭짓점 x * 법선벡터 i번째 x) + (vertexA의 j번째 꼭짓점 y * 법선벡터 i번째 y)
        distanceDot = vertexA[j].x * perpendicularList[i].x + vertexA[j].y * perpendicularList[i].y
        vertexAdistanceDot.push(distanceDot) // 점과 점사이의 거리값을 vertexAdistanceDot 배열에 추가
      }

      // vertexB도 vertexA랑 동일한 과정을 거칩니다.
      for (let j = 0; j < vertexB.length; j++) {
        distanceDot = vertexB[j].x * perpendicularList[i].x + vertexB[j].y * perpendicularList[i].y
        vertexBdistanceDot.push(distanceDot) // 점과 점사이의 거리값을 vertexBdistanceDot 배열에 추가
      }

      // 아까 distanceDot에 추가한 값들을 이용하여, 각 선의 최대 최소 값을 알아냅니다.
      // 참고: Math.min, Math.max 같은 함수는 배열값을 받진 못하지만, apply나 ...(spread 얀신지)를 사용해 배열 원소의 값을 전부 넣어 비교할 수 있습니다.
      const lineAmin = Math.min(...vertexAdistanceDot) // vertexA를 투영한 선의 최소 지점
      const lineAmax = Math.max(...vertexAdistanceDot) // vertexA를 투영한 선의 최대 지점
      const lineBmin = Math.min(...vertexBdistanceDot) // vertexB를 투영한 선의 최소 지점
      const lineBmax = Math.max(...vertexBdistanceDot) // vertexB를 투영한 선의 최대 지점

      /*
      위에서 꼭짓점을 투영시키는 과정이 끝난다면, 이제 투영된 선들이 서로 겹치는지 분리되는지 확인합니다.
      lineA 최소 지점이 lineB 최대 지점보다 작고 lineA 최소 지점이 lineB 최소 지점보다 큰 경우 또는 // 왼쪽 충돌
      lineB 최소 지점이 lineA 최대 지점보다 작고 lineB 최소 지점이 lineA 최소 지점보다 큰 경우 또는 // 오른쪽 충돌
      lineA 최소 지점과 lineB 최소 지점보다 같거나 lineA 최대 지점과 lineB 최대 지점이 같은 경우 // 서로 완전히 만남
      둘 중 한개의 조건이 맞으면, 서로의 선은 겹친것이므로, 다음 루프를 처리합니다.
      */
      if ((lineAmin < lineBmax && lineAmin > lineBmin) ||
          (lineBmin < lineAmax && lineBmin > lineAmin) ||
          (lineAmin === lineBmin && lineAmax === lineBmax)
      ) {
        continue // 다음 루프로...
      } else {
        // 선이 겹치치 않았다면, 두 도형은 분리되어 있기 때문에 충돌하지 않습니다.
        // 따라서 false 리턴
        return false
      }
    }

    // 모든 투영된 선에 대하여 서로가 겹쳤으므로, 분리된 선이 없기 때문에 두 도형은 충돌했습니다.
    // 따라서 true 리턴
    return true
  }

  /**
   * 꼭짓점을 얻습니다.
   * @param {FieldData} objectA
   * @returns 꼭짓점 배열
   */
  static getVertex (objectA) {
    const vertex = [] // 꼭짓점

    if (objectA.degree !== 0) {
      // 사각형이 회전한 경우
      const radian = Math.PI / 180 * objectA.degree // 라디안 계산
      const sin = Math.sin(radian) // 사인값
      const cos = Math.cos(radian) // 코사인값
      const halfWidth = objectA.width / 2 // 사각형의 절반 너비
      const halfHeight = objectA.height / 2 // 사각형의 절반 높이

      /*
       * 각 꼭짓점을 계산합니다.
       * 사각형을 캔버스에 그릴 때 사각형을 중심에서 회전시키기 위해서
       * translate를 한만큼 캔버스의 원점을 이동시킨 후,
       * 캔버스의 rotate 함수를 사용한 후 (-halfWidth, -halfHeight) 위치에 출력했었는데,
       * 이 때 계산했었던 과정을 역이용해서, 회전한 사각형의 꼭짓점을 계산한 것입니다.
       * 너무 자세한걸 주석에 적기는 어려우므로... 이점은 이해해 주세요.
       */
      vertex.push({
        x: (-halfWidth * cos) - (-halfHeight * sin) + objectA.x + halfWidth,
        y: (-halfWidth * sin) + (-halfHeight * cos) + objectA.y + halfHeight
      })
      vertex.push({
        x: (halfWidth * cos) - (-halfHeight * sin) + objectA.x + halfWidth,
        y: (halfWidth * sin) + (-halfHeight * cos) + objectA.y + halfHeight
      })
      vertex.push({
        x: (halfWidth * cos) - (halfHeight * sin) + objectA.x + halfWidth,
        y: (halfWidth * sin) + (halfHeight * cos) + objectA.y + halfHeight
      })
      vertex.push({
        x: (-halfWidth * cos) - (halfHeight * sin) + objectA.x + halfWidth,
        y: (-halfWidth * sin) + (halfHeight * cos) + objectA.y + halfHeight
      })
    } else {
      vertex.push({ x: objectA.x, y: objectA.y })
      vertex.push({ x: objectA.x + objectA.width, y: objectA.y })
      vertex.push({ x: objectA.x + objectA.width, y: objectA.y + objectA.height })
      vertex.push({ x: objectA.x, y: objectA.y + objectA.height })
    }

    return vertex
  }

  /**
   * 모서리를 얻습니다. (꼭짓점 배열 필요)
   * @param {{x: number, y: number}[]} vertexList x, y좌표가 있는 꼭짓점의 배열
   * @returns
   */
  static getEdge (vertexList) {
    // 모서리 계산: 현재 모서리 = (다음 꼭짓점 - 현재 꼭짓점)
    // 참고: 모든 오브젝트는 사각형으로 가정하므로, 이 반복문에서는 각 꼭짓점이 4개라고 가정합니다.
    const edge = []
    for (let i = 0; i < vertexList.length; i++) {
      // 다음 번호 = (i + 1) % vertex의 개수
      // 이렇게 하는 이유는, 나머지 계산을 통해 0, 1, 2, 3, 0, 1 ... 순서로 번호를 정할 수 있기 때문입니다.
      const nextNumber = (i + 1) % vertexList.length

      // 모서리 계산
      const setEdgeX = vertexList[nextNumber].x - vertexList[i].x
      const setEdgeY = vertexList[nextNumber].y - vertexList[i].y

      // 새로운 모서리를 추가
      edge.push({ x: setEdgeX, y: setEdgeY })
    }

    return edge
  }
}

/**
 * 딜레이 데이터, 지연시간 관련 클래스.
 */
export class DelayData {
  constructor (delay = 0) {
    /** 지연시간 */ this.delay = delay
    /** 지연시간을 계산하는 카운터 */ this.count = 0
  }

  /**
   * 지연시간 확인 함수, 이 함수가 실행될 때마다 delayCount가 1씩 증가하고,
   * 지연시간 카운트가 지연시간 이상인지 확인해 그 결과를 리턴합니다.
   * 참고로, 카운트가 다 차면 카운트는 0으로 리셋됩니다.
   * 만약 카운터를 리셋시키기 싫다면, reset 변수에 false 값을 넣어주세요.
   * 만약 카운터를 증가시키기 싫다면, countUp 변수에 false 값을 넣어주세요.
   * @param {boolean} reset 카운터 리셋?, 기본값 true
   * @param {boolean} countUp 카운터 증가?, 기본값 true
   */
  check (reset = true, countUp = true) {
    if (countUp) {
      this.count++
    }

    if (this.count >= this.delay) {
      if (reset) {
        this.count = 0
      }
      return true
    } else {
      return false
    }
  }

  /**
   * 현재 지연시간을 임의의 숫자로 나누었을 때 나머지가 0인지를 확인합니다.
   * delay값과 count값을 직접 수정하지 않아도, 
   * 이 함수를 사용하면 중간 타이머 용도로 사용할 수 있습니다. (딜레이 최대치 중간마다 일정시간 간격으로 효과 발동 등...) 
   * 참고로 이 함수에서는 delay와 count가 변화되지 않습니다. 따라서 이것만으로 카운트 처리를 하지 마세요.
   * @param {number} value 나머지를 구할 나눗셈의 값
   */
  divCheck (value = 0) {
    if (this.count % value === 0) {
      return true
    } else {
      return false
    }
  }

  /**
   * 데이터를 불러오기 했을 때 딜레이를 수정하는 용도
   * 넓값인 경우 설정할 수 없음.
   * @param {DelayData} delayObjectString
   */
  setDelay (delayObjectString) {
    if (delayObjectString == null) return

    this.delay = delayObjectString.delay
    this.count = delayObjectString.count
  }
}

/**
 * 해당 데이터의 에니메이션 처리 객체
 * 이 객체는 FieldData 내부에서 enimation 인스턴스를 생성하여 사용합니다.
 * 그래서, 이 객체의 기능 확장을 하는것이 아니라면, 이 클래스를 상속하지 마세요.
 */
export class EnimationData {
  /**
   * 에니메이션 데이터를 생성합니다.
   * 경고: 불규칙 크기의 에니메이션을 사용하진 마세요. 이 경우, 예상하지 못한 버그가 발생합니다.
   * @param {string} imageSrc 이미지의 경로
   * @param {number} silceStartX 이미지의 시작지점 X좌표 (경고: sliceStartX는 0을 권장, 아니라면, 1줄에 모든 에니메이션 프레임을 배치할 것, 이렇게 안하면, 출력 순서가 꼬일 수 있음.)
   * @param {number} silceStartY 이미지의 시작지점 Y좌표
   * @param {number} frameWidth 프레임 너비
   * @param {number} frameHeight 프레임 높이
   * @param {number} frameCount 프레임 개수
   * @param {number} frameDelay 다음 프레임 재생까지의 지연시간, 기본값 1 (즉, 초당 30프레임, 0일경우 60프레임, 정수만 사용 가능)
   * @param {number} frameRepeat 프레임 반복횟수, -1로 설정하면 무한반복, 기본값 1(1번 반복), 0으로 설정할경우 버그 및 에니메이션이 잘릴 수 있음.
   * @param {number} outputWidth 출력 너비 >> 기본값: 프레임 너비 (이 숫자는 canvas 성능 문제때문에, 가급적 변경하지 않는게 좋습니다.)
   * @param {number} outputHeight 출력 높이 >> 기본값: 프레임 높이 (이 숫자는 canvas 성능 문제때문에, 가급적 변경하지 않는게 좋습니다.)
   */
  constructor (
    imageSrc = '', silceStartX = 0, silceStartY = 0, frameWidth = 0, frameHeight = 0,
    frameCount = 0, frameDelay = 1, frameRepeat = 1,
    outputWidth = frameWidth, outputHeight = frameHeight) {
    /** 이미지의 경로 */ this.imageSrc = imageSrc
    /** 이미지의 에니메이션 프레임 시작지점 X위치, 기본값 = 0 */ this.sliceStartX = silceStartX
    /** 이미지의 에니메이션 프레임 시작지점 Y위치, 기본값 = 0 */ this.sliceStartY = silceStartY
    /** 에니메이션 프레임의 너비 */ this.frameWidth = frameWidth
    /** 에니메이션 프레임의 높이 */ this.frameHeight = frameHeight
    /** 에니메이션 프레임의 총 카운트 수 */ this.frameCount = frameCount
    /** 에니메이션이 총 진행된 프레임 수(지연시간과 관계없음) */ this.elapsedFrame = 0
    /** 에니메이션 반복 횟수 (-1: 무제한) */ this.frameRepeat = frameRepeat
    /** 에니메이션 반복 횟수 카운트 */ this.frameRepeatCount = 0
    /** 에니메이션의 총 최대 프레임 수(프레임 개수 * 프레임 반복 횟수) */ this.maxFrame = this.frameCount * this.frameRepeat
    /** 에니메이션의 출력할 너비 */ this.outputWidth = outputWidth
    /** 에니메이션의 출력할 높이 */ this.outputHeight = outputHeight

    let image = graphicSystem.getCacheImage(imageSrc)
    /** 이미지의 너비 */ this.imageWidth = image == null ? 0 : image.width
    /** 이미지의 높이 */ this.imageHeight = image == null ? 0 : image.height

    /**
     * 에니메이션 프레임의 지연시간
     * 0이하인 경우 null, 1이상인 경우 지연시간 객체 추가
     */
    this.frameDelay = null
    if (frameDelay >= 1) this.frameDelay = new DelayData(frameDelay)

    /**
     * 에니메이션이 끝났는지의 여부
     * 이 값이 true라면, 무슨 짓을 해도 에니메이션은 출력되지 않습니다.
     */
    this.finished = false

    /** 이미지 뒤집기 */ this.flip = 0
    /** 이미지 회전값 */ this.degree = 0
  }

  /**
   * 에니메이션 처리 로직
   */
  process () {
    // 에니메이션 지연시간이 넘어가지 않았다면(null 체크 필수), 또는 에니메이션이 종료된경우 처리 로직 종료
    if (this.frameDelay !== null && !this.frameDelay.check()) return
    if (this.finished) return

    this.elapsedFrame++ // 진행된 프레임 증가

    // frameRepeat가 0이상일 때 (-1이하는 무한반복)
    // 현재 프레임이 최대 프레임 이상이면, 에니메이션은 전부 출력된 것이므로 종료됩니다.
    if (this.frameRepeat >= 0 && this.elapsedFrame >= this.maxFrame) {
      if (this.frameRepeatCount < this.frameRepeat) {
        this.frameRepeatCount++
      } else {
        this.finished = true
      }
    }
  }

  /** 에니메이션 다시 시작 */
  reset () {
    this.elapsedFrame = 0 // 현재 에니메이션 프레임은 0으로 리셋
    this.finished = false // 에니메이션이 재시작되어 종료된 것이 아니므로 finished가 false입니다.
    this.frameRepeatCount = 0 // 프레임 반복한 횟수 카운트 0으로 재설정
  }

  /** 이 객체를 생성한 이후의 출력 사이즈 설정 */
  setOutputSize (width, height) {
    this.outputWidth = width
    this.outputHeight = height
  }

  /**
   * 에니메이션 출력 함수 (반드시 출력할 좌표를 입력해 주세요!)
   * 경고: 에니메이션 프레임은 고정된 크기를 사용합니다. 가변적인 크기를 사용하면 버그가 발생할 수 있음.
   * @param {number} x 출력할 에니메이션의 x좌표
   * @param {number} y 출력할 에니메이션의 y좌표
   */
  display (x, y) {
    if (this.imageSrc == null) return

    // 무한반복 상태가 아니면서 진행된 프레임이 최대 프레임보다 높으면 에니메이션 없음
    if (this.frameRepeat != -1 && this.elapsedFrame >= this.maxFrame) return

    if (x == null || y == null) {
      // 의도적인 버그 방지용 경고 문구
      console.warn('좌표가 입력되지 않았습니다. 에니메이션 출력은 무시됩니다.')
      return
    }

    // 자른 프레임 번호
    // 진행된 프레임이 최대 프레임 이상일 때(에니메이션이 무한 반복 한 경우), 나머지 계산을 해서 어느 프레임 번호를 출력해야 할지를 결정합니다.
    const sliceFrame = this.elapsedFrame % this.frameCount

    // 라인 최대 프레임 (한 줄에 몇개의 프레임이 있을 수 있는가?)
    // 참고: 조심해야 할 것은, 다음 줄로 넘어갈 때, 0좌표가 아닌 sliceStartX에서부터 시작합니다.
    // 즉 다음 줄로 넘어갈 때, 맨 왼쪽부터 프레임 위치를 계산하는게 아니고 시작지점부터 출력 위치를 계산합니다.
    const lineMaxFrame = Math.floor((this.imageWidth - this.sliceStartX) / this.frameWidth)

    // 자른 프레임 라인, 이미지의 Y좌표를 어디서부터 잘라야 할 지를 결정합니다.
    // 프레임이 여러 줄로 배치되어있을 때, 몇번째 줄의 프레임을 가져올 것인지 결정합니다.
    // 한 줄에 10개가 있고, 총 프레임이 20일때, 슬라이스 프레임이 13이면, 슬라이스 라인은 1이 됩니다.
    // 다만, 크기를 이용해서 예측하기 때문에 한줄로 나열하지 않거나 크기가 불규칙하면 버그가 생김.
    const sliceLine = Math.floor(sliceFrame / lineMaxFrame)

    // 이미지 파일 내부에서 가져올 프레임 위치 계산
    const sliceX = this.sliceStartX + (sliceFrame * this.frameWidth) % this.imageWidth
    const sliceY = this.sliceStartY + (sliceLine * this.frameHeight)

    // 이미지 출력
    if (this.flip || this.degree) {
      graphicSystem.imageDisplay(this.imageSrc, sliceX, sliceY, this.frameWidth, this.frameHeight, x, y, this.outputWidth, this.outputHeight, this.flip, this.degree)
    } else {
      graphicSystem.imageDisplay(this.imageSrc, sliceX, sliceY, this.frameWidth, this.frameHeight, x, y, this.outputWidth, this.outputHeight)
    }
  }
}

/**
 * 참고: 일부 오브젝트는 특이한 변수를 독자적으로 사용할 수 있습니다.
 * 그러나 그것이 다른 오브젝트에게 영향을 주지 않고, 자바스크립트는 객체 속성 추가가 자유로우니 상관없습니다.
 * 그리고, FieldState에서 사용하는 FieldObject는 FieldData에서 사용하는 변수와 완전히 일치합니다.
 * 따라서, data에서 사용하지 않는 변수들도 동시에 같이 사용함을 주의해주세요.
 */
export class FieldData {
  static direction = {
    LEFT: 'left',
    RIGHT: 'right',
    DOWN: 'down',
    UP: 'up'
  }

  constructor () {
    /**
     * 오브젝트 타입
     * 사용자가 중간에 수정하는 것은 불가능 (무조건 생성할 때 값이 정해짐)
     * 필드 상태에서 오브젝트 타입을 구분할 때 사용
     */
    this.objectType = 'field'

    /** 타입 세부 구분용 */ this.mainType = ''
    /** 타입 세부 구분용 */ this.subType = ''
    /** 타입 세부 구분용 Id (Id는 number 입니다.) */ this.id = 0
    /** 생성 ID, 일부 객체에서 중복 확인용도로 사용 */ this.createId = 0
    
    /** 
     * 초기화 판정 여부 (일부 오브젝트에 사용)  
     * 
     * 필드 객체는 생성자에서 좌표 입력을 받지 못하기 때문에,
     * 현재 좌표값이 있는 상태로 추가적인 초기화작업을 하려면 afterInit함수를 사용해야 합니다.
     * 
     * 이 변수는 한번 추가로 초기화 되었는지 확인합니다.
     * 
     * 생성자에서는 이 변수를 활용하면 안됩니다.
     */ 
    this.isAfterInited = false

    /** x좌표 (소수점 허용, 그러나 이미지 출력은 정수) */ this.x = 0
    /** y좌표 (소수점 허용, 그러나 이미지 출력은 정수) */ this.y = 0
    /** 중심 x좌표 (읽기 전용, 이 값을 바꾸는것은 의미가 없음) */ this.centerX = 0
    /** 중심 y좌표 (읽기 전용, 이 값을 바꾸는것은 의미가 없음) */ this.centerY = 0
    /** z좌표 (이 게임은 z축 개념은 존재하나 일반적으로 사용하지 않음. 아직 사용 용도는 정하지 않음) */ this.z = 0

    /** 오브젝트의 가로 길이 */ this.width = 0
    /** 오브젝트의 세로 길이 */ this.height = 0
    /** 오브젝트의 현재 상태 (문자열) */ this.state = ''

    /** 
     * 프레임당 x좌표 이동 속도 (소수점 허용), moveSpeedX로 대체됨 
     * @deprecated 
     */ 
    this.speedX = 0
    /** 프레임당 y좌표 이동 속도 (소수점 허용), moveSpeedY로 대체됨 
     * @deprecated */ this.speedY = 0
    /** 프레임당 z좌표 이동 속도 (소수점 허용), 현재 사용하지 않음. 
     * (z좌표는 일반적으로 사용하지 않습니다.) 
     * @deprecated 
     * */ this.speedZ = 0
    
    /** 이동 방향에 따른 이동 속도 x좌표 (소수점 허용) 이 값이 있다면, 이 값을 speed값보다 우선 적용(정확하겐 speed에 덮어 씌워짐) */ this.moveSpeedX = 0
    /** 이동 방향에 따른 이동 속도 y좌표 (소수점 허용) 이 값이 있다면, 이 값을 speed값보다 우선 적용(정확하겐 speed에 덮어 씌워짐) */ this.moveSpeedY = 0
    /** 회전한 각도 (일부 객체에서만 사용) */ this.degree = 0
    /** 뒤집기 0: 없음, 1: 수직, 2: 수평, 3: 수직 + 수평, 나머지 무시(0으로 처리) */ this.flip = 0

    /**
     * 방향 설정을 위해서, 반드시 FieldData.direction 객체가 가지고 있는 상수 값을 사용해주세요.
     * 
     * 이동 방향 설정(left, right만 사용 가능) 이 값은 x축에만 영향을 줌, 기본값: right (일반적인 좌표 방향)
     * 
     * left: + 일경우 왼쪽으로 이동, - 일경우 오른쪽으로 이동.
     * right: + 일경우 오른쪽으로 이동, - 일경우 왼쪽으로 이동.
     * 아무 값도 없다면 이 값을 적용하지 않음.
     * @type {string}
     */
    this.moveDirectionX = FieldData.direction.RIGHT

    /**
     * 이동 방향 설정은 가급적, setMoveDirection 함수를 사용하는것을 권장합니다. (이 변수를 바꿔도 되지만, 안정성이 떨어짐)
     * 
     * 방향 설정을 위해서, 반드시 FieldData.direction 객체가 가지고 있는 상수 값을 사용해주세요.
     * 
     * 이동 방향 설정(up. down만 사용 가능) 이 값은 y축에만 영향을 줌. 기본값: down
     * up: + 일경우 위쪽으로 이동, - 일경우 아래쪽으로 이동
     * down: + 일경우 아래쪽으로 이동, - 일경우 위쪽으로 이동
     * @type {string}
     */
    this.moveDirectionY = FieldData.direction.DOWN

    /** 공격력 */ this.attack = 0
    /** 
     * 방어력 (현재는 안쓰임)
     * @deprecated
     * */ 
    this.defense = 0
    /** 체력 */ this.hp = 0
    /** 체력 최대치 */ this.hpMax = this.hp

    /**
     * 지연시간 객체(지연시간이 없으면 null)
     * @type {DelayData | null}
     */
    this.delay = null

    /**
     * 이동 형태를 결정하는데 사용하는 지연시간.
     * 
     * 보통은, 이동할 때 사용하는것보다는, 이동 형태를 바꿀 때 주로 사용합니다.
     * 
     * 일반적으로는 잘 사용하지 않습니다. (이동 용도로는 거의 안씀...)
     * @type {DelayData | null}
     */
    this.moveDelay = null

    /**
     * 객체가 공격이 가능할 때, 공격을 대기시키기 위한 딜레이 (만약 이 값이 없다면 매 프레임마다 공격할지도 모름.)
     * 
     * 무기 객체, 적 객체만 주로 사용하고 나머지는 거의 사용하지 않음.
     * @type {DelayData | null}
     */
    this.attackDelay = null

    /** (적을 죽였을 때 얻는)점수 */ this.score = 0

    /** 해당 오브젝트가 생성된 후 진행된 시간(단위: 프레임) */ this.elapsedFrame = 0

    /**
     * 만약 해당 오브젝트가 다른 오브젝트를 참고할 일이 있다면, 이 오브젝트에 다른 오브젝트의 정보를 저장합니다.
     * 만약 그 다른 오브젝트의 isDelete 값이 true 라면 이 값을 수동으로 null로 지정해주세요.
     * @type {FieldData | null}
     */
    this.targetObject = null

    /**
     * 만약, 이 값이 true라면, 해당 객체는 로직 처리가 끝난 후 필드에서 삭제됩니다.
     * 데이터를 관리하는 곳에서, 필드 객체에 직접 개입 할 수 없기 때문에, 간접적으로 변수를 사용해
     * 필드에서의 삭제 여부를 판단합니다.
     */
    this.isDeleted = false

    /**
     * 필드 객체가 사망했을 때 사용하는 변수, 다만... 적 외에는 잘 안쓰임(특히 무기...)
     * 이 변수는 코드 자동완성의 편의를 위해 추가했습니다.
     */
    this.isDied = false

    // 에니메이션 용도
    /** 현재까지 진행된 에니메이션의 총 프레임 */ this.enimationFrame = 0

    /**
     * 에니메이션 객체: 이 객체는 EnimationData를 생성하여 이용합니다.
     * @type {EnimationData | null}
     */
    this.enimation = null

    /**
     * HTML 이미지의 경로
     * 참고: 이미지는 보통 출력 용도로 사용
     * @type {string}
     */
    this.imageSrc = ''

    /**
     * 이미지 데이터, 이 값은 특수한 경우에 주로 사용[여러개의 오브젝트가 그려져있는 이미지를 자를 때 주로 사용]
     * @type {ImageDataObject | null} ImageData의 변수값
     */
    this.imageData = null
  }

  /**
   * 이 함수는 대표 객체들의 일부 정보를 생성자에서 받을 수 없어, 데이터를 따로 입력하기 위해 만든 함수입니다.
   * 
   * 오직 대표클래스 (예: weaponData, enemyData 등등...) 만 이 함수 변경 가능.
   * 
   * (이 함수는 기본적으로 비어있으므로, super.afterInit()를 호출할 필요가 없습니다.
   */
  afterInitDefault () {

  }

  /**
   * 각 필드 객체별로 생성할 때, 옵션을 이용해 일부 스탯을 설정하는 경우, 이 함수를 재정의 해서 사용
   * 
   * 또한 이 함수는 생성자에서 좌표를 받을 수 없어,
   * 좌표값을 기준으로 데이터를 작성해야 할 때 사용하는 함수입니다.
   * 
   * 이 함수에는 인수를 추가할 수 없습니다.
   */
  afterInit () {

  }

  /**
   * afterInit의 조건 체크 및 실행 처리용 함수.
   * 
   * 이 함수는 절대 재사용하거나 교체하지 마세요.
   */
  afterInitProcess () {
    // 이미 초기화 된 상태에서는 다시 초기화되지 않습니다. (1회용)
    if (this.isAfterInited) return

    this.isAfterInited = true

    // 초기화 작업 수행
    this.afterInit()
  }

  /**
   * 이동 방향 설정, x축, y축 동시 설정 가능, 이동 방향을 없앨거면, 공백 '' 을 넣어주세요.
   * 
   * 주의: FieldData.direction에 방향과 관련된 상수가 있으므로 해당 값을 사용해야 합니다.
   * 
   * 잘못된 값을 넣을경우, 해당 설정은 무시(취소됨)
   * @param {string} directionX x축 방향, 'left', 'right', ''(이 경우 right가 기본값) 사용 가능
   * @param {string} directionY y축 방향, 'up', 'down', ''(이 경우 down이 기본값) 사용 가능
   */
  setMoveDirection (directionX = '', directionY = '') {
    const LEFT = FieldData.direction.LEFT
    const RIGHT = FieldData.direction.RIGHT
    const UP = FieldData.direction.UP
    const DOWN = FieldData.direction.DOWN
    const SPACE = ''

    if (directionX === LEFT || directionX === RIGHT) {
      this.moveDirectionX = directionX
    } else if (directionX === SPACE) {
      this.moveDirectionX = RIGHT
    }

    if (directionY === UP || directionY === DOWN) {
      this.moveDirectionY = directionY
    } else if (directionY === SPACE) {
      this.moveDirectionY = DOWN
    }
  }

  /**
   * 랜덤하게 적 속도 결정
   * @param {number} maxX 최대 속도 X
   * @param {number} maxY 최대 속도 Y
   * @param {boolean} isMinusRangeInclued 마이너스 범위 포함
   */
  setRandomSpeed (maxX = 2, maxY = 2, isMinusRangeInclued = false) {
    if (isMinusRangeInclued) {
      // 부호 결정용 랜덤 마이너스 처리
      // 50% 확률로 양수 또는 음수 결정
      let randomMinusX = Math.random() * 100 < 50 ? 1 : -1
      let randomMinusY = Math.random() * 100 < 50 ? 1 : -1
      
      // 그 후, 곱셉을 이용하여 음수와 양수를 결정시킴 (마이너스를 곱하면 음수)
      this.moveSpeedX = Math.random() * maxX * randomMinusX
      this.moveSpeedY = Math.random() * maxY * randomMinusY
    } else {
      this.moveSpeedX = Math.random() * maxX
      this.moveSpeedY = Math.random() * maxY
    }
  }

  /** 적 이동속도 결정 */
  setMoveSpeed (moveSpeedX = 1, moveSpeedY = 1) {
    this.moveSpeedX = moveSpeedX
    this.moveSpeedY = moveSpeedY
    this.speedX = moveSpeedX
    this.speedY = moveSpeedY
  }

  /**
   * 오브젝트의 로직 처리 함수 (각 객체마다 다를 수 있고, 이것은 기본적인 기능만 있습니다.)
   */
  process () {
    this.afterInitProcess()

    this.processMove()
    this.processEnimation()

    // 캔버스의 영역을 크게 벗어나면 해당 객체는 자동으로 삭제요청을 합니다.
    // isDeleted 가 true라면, fieldState에서 해당 객체를 삭제합니다.
    if (this.outAreaCheck()) {
      this.isDeleted = true
    }
  }


  processEnimation () {
    if (this.enimation == null) return
    
    this.enimation.process()
  }

  /**
   * 객체를 이동시킵니다.
   * 
   * 하위 호환성 문제 때문에 아직까지는 speedX, speedY를 사용하지만, 곧 해당 변수는 사라질 예정입니다.
   * 
   * 이동 방향이 정해져 있는 경우, 방향에 따른 속도값을 speed에 대입합니다.
   * 이동 방향이 없다면, 기본값으로 처리합니다. (x축 right, y축 down)
   */
  processMove () {
    if (this.moveDirectionX === FieldData.direction.LEFT) {
      this.speedX = -this.moveSpeedX
    } else {
      this.speedX = this.moveSpeedX
    }

    if (this.moveDirectionY === FieldData.direction.UP) {
      this.speedY = -this.moveSpeedY
    } else {
      this.speedY = this.moveSpeedY
    }

    // 이동 속도에 따른 좌표값 변경
    this.x += this.speedX
    this.y += this.speedY

    this.centerX = this.x + Math.floor(this.width / 2)
    this.centerY = this.y + Math.floor(this.height / 2)
  }

  /**
   * 오브젝트의 이미지 출력 함수 (각 객체마다 다름, 직접 구현 필요)
   * 이 함수는 기본값이 존재하지만, 만약 display() 재정의로 이 기본함수를 사용할 수 없게 된다면,
   * display() 함수를 재작성 할 때 FildData 클래스의 함수인 defaultDisplay() 를 사용해주세요.
   */
  display () {
    this.defaultDisplay()
  }

  /**
   * fieldState에서 사용하는 모든 오브젝트에 대한 공통 로직
   * 이 함수를 재작성이 필요하다면, 이 함수(super.fieldProcess())를 반드시 호출해야합니다.
   */
  fieldProcess () {
    this.elapsedFrame++
  }

  /**
   * 필드 객체가 캔버스의 영역을 크게 벗어났는지 확인합니다.
   */
  outAreaCheck () {
    if (this.x < -graphicSystem.CANVAS_WIDTH ||
    this.x > graphicSystem.CANVAS_WIDTH * 2 ||
    this.y < -graphicSystem.CANVAS_HEIGHT ||
    this.y > graphicSystem.CANVAS_HEIGHT * 2) {
      return true
    } else {
      return false
    }
  }

  /**
   * 필드 객체가 화면 영역을 완전히 벗어났는지 확인합니다. outAreaCheck와는 감지 범위가 다릅니다.
   */
  exitAreaCheck () {
    if (this.x + this.width < 0 || this.x > graphicSystem.CANVAS_WIDTH ||
      this.y + this.height < 0 || this.y > graphicSystem.CANVAS_HEIGHT) {
      return true
    } else {
      return false
    }
  }


  /**
   * fieldState에서 오브젝트를 클래스를 이용해 생성하면 좌표값은 0, 0이되기 때문에,
   * 원하는 좌표에 설정하기 위한 함수를 사용해 좌표를 정해주어야 합니다.
   * @param {number} x x좌표
   * @param {number} y y좌표
   * @param {number} z z좌표 (이 좌표는 일반적으로 사용하지 않습니다.)
   */
  setPosition (x, y, z = 0) {
    this.x = x
    this.y = y
    this.z = z

    this.centerX = this.x + Math.floor(this.width / 2)
    this.centerY = this.y + Math.floor(this.height / 2)
  }

  /**
   * 만약 이런저런 상속으로 인해서, fieldData가 가지고 있는 display함수를 사용하고 싶다면, 이 static 함수를 사용하세요.
   * display 함수를 재작성한 후, defaultDisplay() 함수를 실행하면 됩니다. (인수는 필요 없음.)
   */
  defaultDisplay () {
    if (this.enimation) {
      this.enimation.display(this.x, this.y)
    } else if (this.imageSrc) {
      if (this.imageData) {
        if (this.degree !== 0 || this.flip !== 0) {
          graphicSystem.imageDisplay(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height, this.flip, this.degree)
        } else {
          graphicSystem.imageDisplay(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
        }
      } else {
        if (this.degree !== 0 || this.flip !== 0) {
          graphicSystem.imageDisplay(this.imageSrc, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height, this.flip, this.degree)
        } else {
          graphicSystem.imageView(this.imageSrc, this.x, this.y)
        }
      }
    }
  }

  /**
   * (EnemyData 전용에서 FieldData 전용으로 변경됨.)
   * 
   * 이미지와 이미지 데이터를 설정하고, 자동으로 에니메이션 설정을 합니다.
   * 참고로 이 설정은 크기(너비, 높이)까지 자동으로 변경합니다.
   * 
   * 옵션을 통해 출력 사이즈를 조정할 수 있으며, 또는  setWidthHeight 함수를 사용해서 에니메이션의 크기를 변경할 수 있습니다.
   * @param {string} imageSrc
   * @param {ImageDataObject} imageData
   * @param {number} enimationDelay 에니메이션 딜레이(프레임 단위)
   */
  setAutoImageData (imageSrc, imageData, enimationDelay = 1, {width = null, height = null} = {}) {
    this.imageSrc = imageSrc
    this.imageData = imageData
    if (this.imageSrc == null || this.imageData == null) return

    this.width = width == null ? this.imageData.width : width
    this.height = height == null ? this.imageData.height : height
    
    if (this.imageData.frame >= 2) {
      this.enimation = new EnimationData(this.imageSrc, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.imageData.frame, enimationDelay, -1)
    }
  }

  /**
   * EnemyData 에서 FieldData로 이동됨.
   * 
   * 너비와 높이를 동시에 수정하고, 에니메이션 출력 사이즈도 같이 변경합니다.
   * 
   * 이 함수는 setAutoEnimation 함수를 사용한 이후 사용해주세요. 그래야 정상적으로 값이 반영됩니다.
   * 
   * 이 함수는, width, height값이 이미지 사이즈랑 다를 때, 이를 편하게 수정하기 위해 만들어진 함수입니다.
   * 단순히 width, height를 직접 수정하게 되면 에니메이션 크기에는 이게 반영되지 않습니다.
   * 따라서 에니메이션이 있는 객체들은 이 함수로 간접적으로 수정해줘야 합니다.
   * @param {number} width 
   * @param {number} height 
   */
  setWidthHeight (width = 1, height = 1) {
    this.width = width
    this.height = height

    if (this.enimation) {
      this.enimation.setOutputSize(width, height)
    }
  }

  /**
   * 필드 데이터를 저장하기 위해 얻어올 필드 객체
   * 객체 데이터로 얻어옵니다. (나중에 JSON으로 변경해 저장해야 함)
   */
  getSaveData () {
    return {
      // id 및 타입값
      id: this.id,
      objectType: this.objectType,
      mainType: this.mainType,
      subType: this.subType,
      createId: this.createId,

      // 크기 및 좌표 및 이동 값
      x: this.x,
      y: this.y,
      z: this.z,
      moveSpeedX: this.moveSpeedX,
      moveSpeedY: this.moveSpeedY,
      moveDirectionX: this.moveDirectionX,
      moveDirectionY: this.moveDirectionY,
      flip: this.flip,
      degree: this.degree,
      width: this.width,
      hegith: this.height,

      // 스탯 값
      attack: this.attack,
      defense: this.defense,
      hp: this.hp,
      hpMax: this.hpMax,
      score: this.score,

      // 상태 값 (나중에 확장할 수 있음.)
      state: this.state,

      // 지연 값
      delay: this.delay,
      moveDelay: this.moveDelay,
      attackDelay: this.attackDelay,

      // 시스템 값
      elapsedFrame: this.elapsedFrame
    }
  }

  /**
   * 불러온 필드 객체를 만들기 위한 함수
   * 
   * 불러오기를 사용했을 때 이 함수로 객체들의 스탯을 저장합니다.
   * @param {Object} saveData 세이브 된 데이터 (경고: 필드 객체가 아님)
   */
  setLoadData (saveData) {
    // 로드는 구성상 코드가 단순할 수밖에 없음.
    for (let key in saveData) {
      if (typeof saveData[key] === 'object') {
        if (saveData[key] == null) continue
        
        // 지연시간은 클래스로 생성되기 때문에, 값을 수동으로 입력해야 합니다.
        if (saveData[key].hasOwnProperty('delay')) {
          this[key].setDelay(saveData[key])
        }
      } else {
        this[key] = saveData[key]
      }
    }
  }
}

