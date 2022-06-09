"use strict"

import { fieldState } from "./field.js"
import { graphicSystem } from "./graphic.js"
import { imageFile } from "./image.js"

/**
 * 공통적으로 사용하는 객체 ID [주의: ID 값들은 실수로! 중복될 수 있음.]  
 * 가능하면, ID 값은 서로 달라야 합니다. (실수가 아니라면...)
 */
export class ID {
  static playerWeapon = {
    unused:0,
    multyshot:10001,
    missile:10002,
    arrow:10003,
    laser:10004,
    sapia:10005,
    parapo:10006,
  }

  static weapon = {
    unused:0,
    multyshot:11010,
    multyshotHoming:11011,
    multyshotSideUp:11012,
    multyshotSideDown:11013,
    missile:11020,
    missileUp:11021,
    missileDown:11022,
    arrow:11030,
    arrowDown:11031,
    laser:11040,
    laserBlue:11041,
    sapia:11050,
    sapiaShot:11051,
    parapo:11060,
    parapoShockWave:11061,
  }
  
  static enemy = {
    unused:0,
    test:20001,
    testAttack:20002,
  }

  static effect = {
    missile:40000,
    parapo:40004,
  }

  static sprite = {

  }
}


/**
 * 게임 field.js에서 사용하는 오브젝트 타입  
 * 절대로 string 값을 직접 넣지 말고, 이 상수 값을 사용하세요.  
 */
export class objectType {
  static FIELD = 'field'
  static WEAPON = 'weapon'
  static PLAYER = 'player'
  static PLAYER_WEAPON = 'playerWeapon'
  static ENEMY = 'enemy'
  static EFFECT = 'effect'
}

/**
 * 충돌 감지 함수
 * @param {FieldData} objectA 
 * @param {FieldData} objectB 
 */
 export function collision (objectA, objectB) {
  if(objectA.x < objectB.x + objectB.width
    && objectA.x + objectA.width > objectB.x
    && objectA.y < objectB.y + objectB.height
    && objectA.y + objectA.height > objectB.y) {
    return true
  } else {
    return false
  }
}


/**
 * 충돌 감지 함수(OBB 한정)를 클래스로 변경했습니다. 이유는, 내부적으로만 사용하는 함수가 너무 많습니다.  
 * 사각형 충돌 함수는 기존의 collision 함수를 그냥 사용합니다.
 */
export class collisionOBB {
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
  static collision (objectA, objectB) {
    // 각 오브젝트의 꼭짓점과 모서리를 계산합니다.
    // 자세한건, 각 함수의 내부 구현 참고... (내용이 너무 길어서 분리됨)
    let vertexA = this.getVertex(objectA)
    let vertexB = this.getVertex(objectB)
    let edgeA = this.getEdge(vertexA)
    let edgeB = this.getEdge(vertexB)

    /* 
     * 법선 벡터를 계산합니다. 해당 벡터(여기서는 모서리)의 수직인 방향의 벡터를 법선 벡터라 합니다.
     * 법선 벡터는, 현재 벡터의 좌표(x, y) 를 (-y, x)로 변환해 만듭니다.
     * 계산한 모든 법선 벡터를 prependicularStack에 추가합니다.
     * 도형이 사각형이라면, 사실 법선 벡터는 각 rect당 2개면 충분합니다. (0번 모서리, 1번 모서리)
     * 그래서 사각형의 변 개수의 절반 만큼 루프를 돌게 했습니다. (4번이 아닌 2번 루프)
     */
    let perpendicularList = []; // 수직 벡터를 저장할 배열
  
    for(var i = 0; i < edgeA.length / 2; i++) {
      perpendicularList.push({x: -edgeA[i].y, y: edgeA[i].x});
    }

    // vertexB도 마찬가지로 법선 벡터를 계산하고 prependicularStack에 추가합니다.
    for(var i = 0; i < edgeB.length / 2; i++) {
      perpendicularList.push({x: -edgeB[i].y, y: edgeB[i].x});
    }

    // 이제 prependicularStack(법선 벡터 목록)에 있는 모든 법선벡터와 objectA, objectB에 있는 모든 변들을 조사합니다.
    for(var i = 0; i < perpendicularList.length; i++) {
      let distanceDot = 0; // 점과 점사이의 거리
      let vertexAdistanceDot = [] // vertexA의 각 변과 법선에 따른 점과 점사이의 거리
      let vertexBdistanceDot = [] // vertexB의 각 변과 법선에 따른 점과 점사이의 거리

      // vertexA의 각 꼭짓점에 대해 법선 벡터의 점과 점사이의 거리를 구합니다.
      for (var j = 0; j < vertexA.length; j++) {
        // 점과 점사이의 거리 = (vertexA의 j번째 꼭짓점 x * 법선벡터 i번째 x) + (vertexA의 j번째 꼭짓점 y * 법선벡터 i번째 y)
        distanceDot = vertexA[j].x * perpendicularList[i].x + vertexA[j].y * perpendicularList[i].y;
        vertexAdistanceDot.push(distanceDot) // 점과 점사이의 거리값을 vertexAdistanceDot 배열에 추가
      }

      // vertexB도 vertexA랑 동일한 과정을 거칩니다.
      for (var j = 0; j < vertexB.length; j++) {
        distanceDot = vertexB[j].x * perpendicularList[i].x + vertexB[j].y * perpendicularList[i].y;
        vertexBdistanceDot.push(distanceDot) // 점과 점사이의 거리값을 vertexBdistanceDot 배열에 추가
      }

      // 아까 distanceDot에 추가한 값들을 이용하여, 각 선의 최대 최소 값을 알아냅니다.
      // 참고: Math.min, Math.max 같은 함수는 배열값을 받진 못하지만, apply나 ...(spread 얀신지)를 사용해 배열 원소의 값을 전부 넣어 비교할 수 있습니다.
      let lineAmin = Math.min(...vertexAdistanceDot); // vertexA를 투영한 선의 최소 지점
      let lineAmax = Math.max(...vertexAdistanceDot); // vertexA를 투영한 선의 최대 지점
      let lineBmin = Math.min(...vertexBdistanceDot); // vertexB를 투영한 선의 최소 지점
      let lineBmax = Math.max(...vertexBdistanceDot); // vertexB를 투영한 선의 최대 지점

      /*
      위에서 꼭짓점을 투영시키는 과정이 끝난다면, 이제 투영된 선들이 서로 겹치는지 분리되는지 확인합니다.
      lineA 최소 지점이 lineB 최대 지점보다 작고 lineA 최소 지점이 lineB 최소 지점보다 큰 경우 또는 // 왼쪽 충돌
      lineB 최소 지점이 lineA 최대 지점보다 작고 lineB 최소 지점이 lineA 최소 지점보다 큰 경우 또는 // 오른쪽 충돌
      lineA 최소 지점과 lineB 최소 지점보다 같거나 lineA 최대 지점과 lineB 최대 지점이 같은 경우 // 서로 완전히 만남
      둘 중 한개의 조건이 맞으면, 서로의 선은 겹친것이므로, 다음 루프를 처리합니다.
      */
      if( (lineAmin < lineBmax && lineAmin > lineBmin) || 
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
    let vertex = [] // 꼭짓점

    if (objectA.degree !== 0) {
      // 사각형이 회전한 경우
      let radian = Math.PI / 180 * objectA.degree // 라디안 계산
      let sin = Math.sin(radian) // 사인값
      let cos = Math.cos(radian) // 코사인값
      let halfWidth = objectA.width / 2 // 사각형의 절반 너비
      let halfHeight = objectA.height / 2 // 사각형의 절반 높이
  
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
        x: ( halfWidth * cos) - ( halfHeight * sin) + objectA.x + halfWidth,
        y: ( halfWidth * sin) + ( halfHeight * cos) + objectA.y + halfHeight
      })
      vertex.push({
        x: ( halfWidth * cos) - (-halfHeight * sin) + objectA.x + halfWidth,
        y: ( halfWidth * sin) + (-halfHeight * cos) + objectA.y + halfHeight
      })
      vertex.push({
        x: (-halfWidth * cos) - ( halfHeight * sin) + objectA.x + halfWidth,
        y: (-halfWidth * sin) + ( halfHeight * cos) + objectA.y + halfHeight
      })
    } else {
      vertex.push({x: objectA.x, y: objectA.y})
      vertex.push({x: objectA.x + objectA.width, y: objectA.y})
      vertex.push({x: objectA.x + objectA.width, y: objectA.y + objectA.height})
      vertex.push({x: objectA.x, y: objectA.y + objectA.height})
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
    let edge = []
    for (let i = 0; i < vertexList.length; i++) {
      // 다음 번호 = (i + 1) % vertex의 개수
      // 이렇게 하는 이유는, 나머지 계산을 통해 0, 1, 2, 3, 0, 1 ... 순서로 번호를 정할 수 있기 때문입니다.
      let nextNumber = (i + 1) % vertexList.length

      // 모서리 계산
      let setEdgeX = vertexList[nextNumber].x - vertexList[i].x
      let setEdgeY = vertexList[nextNumber].y - vertexList[i].y

      // 새로운 모서리를 추가
      edge.push({x: setEdgeX, y: setEdgeY})
    }

    return edge
  }
}

/**
 * 딜레이 데이터, 지연시간 관련 클래스.
 */
class DelayData {
  constructor (delay) {
    /** 지연시간 */ this.value = delay
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

    if (this.count >= this.value) {
      if (reset) {
        this.count = 0
      }
      return true
    } else {
      return false
    }
  }
}

/**
 * 해당 데이터의 에니메이션 처리 객체  
 * 이 객체는 FieldData 내부에서 enimation 인스턴스를 생성하여 사용합니다.  
 * 그래서, 이 객체의 기능 확장을 하는것이 아니라면, 이 클래스를 상속하지 마세요.
 */
class EnimationData {
  /**
   * 에니메이션 데이터를 생성합니다.  
   * 경고: 불규칙 크기의 에니메이션을 사용하진 마세요. 이 경우, 예상하지 못한 버그가 발생합니다.
   * @param {Image} image HTML 이미지
   * @param {number} silceStartX 이미지의 시작지점 X좌표
   * @param {number} silceStartY 이미지의 시작지점 Y좌표
   * @param {number} frameWidth 프레임 너비
   * @param {number} frameHeight 프레임 높이
   * @param {number} frameCount 프레임 개수
   * @param {number} frameDelay 프레임 지연시간
   * @param {number} frameRepeat 프레임 반복횟수, -1로 설정하면 무한반복, 0일경우 반복 없음
   * @param {number} outputWidth 출력 너비 >> 기본값: 프레임 너비 (이 숫자는 canvas 성능 문제때문에, 가급적 변경하지 않는게 좋습니다.)
   * @param {number} outputHeight 출력 높이 >> 기본값: 프레임 높이 (이 숫자는 canvas 성능 문제때문에, 가급적 변경하지 않는게 좋습니다.)
   */
  constructor (
    image = null, silceStartX = 0, silceStartY = 0, frameWidth = 0, frameHeight = 0, 
    frameCount = 0, frameDelay = 0, frameRepeat = 0, 
    outputWidth = frameWidth, outputHeight = frameHeight) {
    /** 이미지 */ this.image = image
    /** 이미지의 에니메이션 프레임 시작지점 X위치, 기본값 = 0 */ this.sliceStartX = silceStartX
    /** 이미지의 에니메이션 프레임 시작지점 Y위치, 기본값 = 0 */ this.sliceStartY = silceStartY
    /** 에니메이션 프레임의 너비 */ this.frameWidth = frameWidth
    /** 에니메이션 프레임의 높이 */ this.frameHeight = frameHeight
    /** 에니메이션 프레임의 총 카운트 수 */ this.frameCount = frameCount
    /** 에니메이션 현재 프레임 */ this.currentFrame = 0
    /** 에니메이션 반복 횟수 (-1: 무제한) */ this.frameRepeat = frameRepeat
    /** 에니메이션 반복 횟수 카운트 */ this.frameRepeatCount = 0
    /** 에니메이션의 총 최대 프레임 수(프레임 개수 * 프레임 반복 수) */ this.maxFrame = this.frameCount * this.frameRepeat
    /** 에니메이션의 출력할 너비 */ this.outputWidth = outputWidth
    /** 에니메이션의 출력할 높이 */ this.outputHeight = outputHeight

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
  }

  /** 
   * 에니메이션 처리 로직 
   */
  process () {
    // 에니메이션 지연시간이 넘어가지 않았다면(null 체크 필수), 또는 에니메이션이 종료된경우 처리 로직 종료
    if (this.frameDelay !== null && !this.frameDelay.check()) return
    if (this.finished) return
    
    this.currentFrame++ // 현재 프레임 증가

    // frameRepeat가 0보다 클 때(-1이하는 무한반복)
    // 현재 프레임이 최대 프레임 이상이면, 에니메이션은 전부 출력된 것이므로 종료됩니다.
    if (this.frameRepeat >= 0 && this.currentFrame >= this.maxFrame) {
      if (this.frameRepeatCount < this.frameRepeat) {
        this.frameRepeatCount++
      } else {
        this.finished = true
      }
    }
  }

  /** 에니메이션 다시 시작 */
  reset () {
    this.currentFrame = 0 // 현재 에니메이션 프레임은 0으로 리셋
    this.finished = false // 에니메이션이 재시작되어 종료된 것이 아니므로 finished가 false입니다.
  }

  /** 
   * 에니메이션 출력 함수 (반드시 출력할 좌표를 입력해 주세요!)  
   * 경고: 프레임은 고정된 크기를 사용합니다. 가변적인 크기를 사용하면 버그가 발생할 수 있음.
   * @param {number} x 출력할 에니메이션의 x좌표
   * @param {number} y 출력할 에니메이션의 y좌표
   */
  display (x, y) {
    // 이미지가 없는데 출력을 할 수 없잖아요!
    if (this.image == null) return

    if (x == null || y == null) {
      console.warn('좌표가 입력되지 않았습니다. 에니메이션 출력은 무시됩니다.')
      return
    }

    // 자른 프레임 번호, 이미지를 어디서부터 잘라야 할 지를 결정합니다.
    let sliceFrame = this.currentFrame % this.frameCount

    // 자른 프레임 라인, 이미지를 어디서부터 잘라야 할 지를 결정하지만, 이것은 Y좌표를 정하는데 쓰입니다.
    // 한 줄에 10개가 있고, 총 프레임이 20일때, 슬라이스 라인은 2가 됩니다.
    // 다만, 크기를 이용해서 예측하기 때문에 한줄로 나열하지 않거나 크기가 불규칙하면 버그가 생김.
    let sliceLine = Math.round(this.frameCount / this.frameWidth)

    // 이미지 파일 내부에서 가져올 프레임 위치 계산
    let sliceX = this.sliceStartX + (sliceFrame * this.frameWidth) % this.image.width
    let sliceY = this.sliceStartY + (sliceLine* this.frameHeight)

    // 이미지 출력
    graphicSystem.imageDisplay(this.image, sliceX, sliceY, this.frameWidth, this.frameHeight, x, y, this.outputWidth, this.outputHeight)
  }

  /**
   * 생각해보니, 프로세스(처리)와 디스플레이(출력)을 한꺼번에 하는게 더 좋겠네요.
   * 이 기능은 process 함수의 기능과 display 함수의 기능을 수행합니다.  
   * display 역할을 수행해야 하므로 반드시 출력할 x, y좌표를 입력해 주세요!
   * @param {number} x 출력할 에니메이션의 x좌표
   * @param {number} y 출력할 에니메이션의 y좌표
   */
  processAndDisplay (x, y) {
    this.process()
    this.display(x, y)
  }
}



/**
 * 참고: 일부 오브젝트는 특이한 변수를 독자적으로 사용할 수 있습니다.  
 * 그러나 그것이 다른 오브젝트에게 영향을 주지 않고, 자바스크립트는 객체 속성 추가가 자유로우니 상관없습니다.  
 * 그리고, FieldState에서 사용하는 FieldObject는 FieldData에서 사용하는 변수와 완전히 일치합니다.
 * 따라서, data에서 사용하지 않는 변수들도 동시에 같이 사용함을 주의해주세요.
 */
export class FieldData {
  constructor () {
    /**
     * 오브젝트 타입 
     * 사용자가 중간에 수정하는 것은 불가능 (무조건 생성할 때 값이 정해짐)
     * 필드 상태에서 오브젝트 타입을 구분할 때 사용
     */ 
    this.objectType = objectType.FIELD
  
    /** 타입 세부 구분용 */ this.mainType = ''
    /** 타입 세부 구분용 */ this.subType = ''
    /** 타입 세부 구분용 Id (Id는 number 입니다.) */ this.id = ''
    /** 생성 ID, 일부 객체에서 중복 확인용도로 사용 */ this.createId = 0
    /** 초기화 판정 여부 (일부 오브젝트에 사용) */ this.isInited = false

    /** x좌표 (소수점 허용, 그러나 계산과 출력은 정수) */ this.x = 0
    /** y좌표 (소수점 허용, 그러나 계산과 출력은 정수) */ this.y = 0
    /** z좌표 (이 게임은 z축 개념은 존재하나 일반적으로 사용하지 않음. 아직 사용 용도는 정하지 않음) */ this.z = 0

    /** 오브젝트의 가로 길이 */ this.width = 0
    /** 오브젝트의 세로 길이 */ this.height = 0
    /** 오브젝트의 현재 상태 (객체 형태, 외부에서 참조하지 마세요!), status랑 약간 다른 목적 */ this.state = ''

    /** 프레임당 x좌표 이동 속도 (소수점 허용) */ this.speedX = 0
    /** 프레임당 y좌표 이동 속도 (소수점 허용) */ this.speedY = 0
    /** 프레임당 z좌표 이동 속도 (소수점 허용), (z좌표는 일반적으로 사용하지 않습니다.) */ this.speedZ = 0
    /** 이동 방향에 따른 이동 속도 x좌표 (소수점 허용) */ this.moveX = 1
    /** 이동 방향에 따른 이동 속도 y좌표[speedY랑 동일] (소수점 허용) */ this.moveY = 0
    /** 회전한 각도 (일부 객체에서만 사용) */ this.degree = 0
    /** 
    * 이동 방향 설정(left, right만 사용 가능) y좌표는 방향에 따른 영향 없음.  
    * left: + 일경우 왼쪽으로 이동, - 일경우 오른쪽으로 이동.   
    * right: + 일경우 오른쪽으로 이동, - 일경우 왼쪽으로 이동.  
    */ 
    this.direction = 'left'

    /** 공격력 */ this.attack = 0
    /** 방어력 */ this.defense = 0
    /** 체력 */ this.hp = 0
    /** 체력 최대치 (아직 사용용도 미정) */ this.hpMax = this.hp

    /** 
     * 지연시간 객체(지연시간이 없으면 null)
     * @type {DelayData} 
     */ 
    this.delay = null
    
    /** (적을 죽였을 때 얻는)점수 */ this.score = 0

    /** 해당 오브젝트가 생성된 후 진행된 시간(단위: 프레임) */ this.elapsedFrame = 0

    /**
     * 만약 해당 오브젝트가 다른 오브젝트를 참고할 일이 있다면, 이 오브젝트에 다른 오브젝트의 정보를 저장합니다.  
     * 만약 그 다른 오브젝트의 isDelete 값이 true
     */
    this.targetObject = null

    /**
     * 만약, 이 값이 true라면, 해당 객체는 로직 처리가 끝난 후 필드에서 삭제됩니다.  
     * 데이터를 관리하는 곳에서, 필드 객체에 직접 개입 할 수 없기 때문에, 간접적으로 변수를 사용해
     * 필드에서의 삭제 여부를 판단합니다.
     */
    this.isDeleted = false

    // 에니메이션 용도
    /** 현재까지 진행된 에니메이션 총 프레임 */ this.enimationFrame = 0
    /** 
     * 에니메이션 객체: 이 객체는 EnimationData를 생성하여 이용합니다.
     * @type {EnimationData}
     */ 
    this.enimation = null

    /**
     * HTML 이미지  
     * 참고: 이미지는 보통 출력 용도로 사용
     * @type {Image}
     */
    this.image = null
  }

  /** 오브젝트의 로직 처리 함수 (각 객체마다 다름, 직접 구현 필요) */ process () {}
  /** 오브젝트의 이미지 출력 함수 (각 객체마다 다름, 직접 구현 필요) */ display () {}


  /**
   * fieldState에서 사용하는 모든 오브젝트에 대한 공통 로직  
   * 이 함수를 재작성이 필요하다면, 이 함수(super.fieldProcess())를 반드시 호출해야합니다.
   */
  fieldProcess () {
    this.elapsedFrame++
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
  }
}

class WeaponData extends FieldData {
  constructor () {
    super()
    /** 공격력(해당 오브젝트의 공격력) */ this.attack = 1
    /** 해당 객체의 기본 오브젝트 타입(임의 수정 불가능) */ this.objectType = objectType.WEAPON

    // 추적 오브젝트 여부
    /** 적을 추적하는지의 여부(데이터 객체에서 주로 사용) true일경우 적을 추적하는 무기임. */ this.isChaseType = false
    /** 추적 실패 횟수: 이 숫자는 추적할 적이 없을 때 과도한 추적 알고리즘 사용을 막기 위해 실행됨. */ this.chaseMissCount = 0
    /** 
     * 필드객체에서 사용하는 변수, 어떤 적을 추적하는지를 객체로 가져옴  
     * @type {FieldData} 
     */ 
    this.targetObject = null

    /** 
     * 공격 반복 횟수: 적을 여러번 때리거나, 또는 여러번 공격할 때 사용, 기본값: 1  
     * 경고: 기본값 0이라면, 무기가 즉시 사라질 수 있음.
     */ 
    this.repeatCount = 1
    /** 
     * 반복 딜레이 객체(딜레이가 없으면 null)  
     * @type {DelayData}
     */ 
    this.repeatDelay = null
  }

  process () {
    this.processMove()
    this.processChase()
    this.processAttack()

    // 무기가 정상적으로 처리되지 않고 오랫동안 남아있을 때를 대비해 삭제하는 요소
    // 그리고 남은 반복 횟수가 0이하인 경우는 해당 무기를 사용할 수 없으므로 삭제됨
    if (this.repeatCount <= 0 || this.elapsedFrame >= 420) {
      this.isDeleted = true
    }
  }

  /**
   * 무기 옵션을 설정합니다. (현재는 공격력만 수정할 수 있음.)
   * (플레이어의 공격력에 영향을 받기 때문에, 따로 설정해 주어야 합니다.)
   * @param {number} attack 무기 공격력 (플레이어의 공격력이 아닙니다!)
   */
  setOption (attack) {
    this.attack = attack
  }

  /**
   * 무기가 적을 타격하여 데미지를 주는 함수입니다.  
   * 아직까지는, 무기의 공격력 만큼만 적의 체력을 감소시키는 역할만 합니다.  
   * 절대로, 다른 곳에서 적의 체력을 직접 감소시키지 마세요!
   * @param {FieldData} target 총돌한 객체(어떤게 충돌했는지는 field에서 검사합니다.)
   */
  damageProcess (target) {
    // 기본적으로 무기와 적의 충돌은 무기의 공격력 만큼 적의 체력을 감소합니다.
    let damage = this.attack
    if (damage < 1) {
      damage = 1
    }

    target.hp -= damage
    fieldState.createDamageObject(target.x, target.y, damage)
  }

  /**
   * 이동에 관한 로직(process에서 사용)
   */
  processMove () {
    this.x += this.speedX
    this.y += this.speedY
  }

  /**
   * 무기는 적 오브젝트를 공격합니다. 이것은 무기와 적과의 상호작용을 처리하는 함수입니다.  
   * process는 무기의 로직 처리이고, processAttack는 무기가 적을 공격하기 위한 로직을 작성합니다.
   */
  processAttack () {
    let enemyObject = fieldState.getEnemyObject()

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      // 각각의 적마다 충돌 검사
      if (collision(this, currentEnemy)) {
        // 충돌한 경우, 충돌한 상태에서의 로직을 처리
        this.damageProcess(currentEnemy)

        // 적을 공격 성공한 시점에서 충돌 처리 후 함수는 종료되고, 해당 객체는 즉시 삭제됩니다.
        // 자기 자신은 null을 해봤자 의미없으므로, isDelete변수값을 이용해 field에서 삭제되도록 합니다.
        this.isDeleted = true
        return 
      }
    }
  }

  /**
   * 추적에 관한 로직
   */
  processChase () {
    // 추적 타입이 아닌 경우 함수 종료 (아무것도 하지 않음)
    if (!this.isChaseType) return

    // 추적하는 오브젝트가 있을 경우
    if (this.targetObject != null) {
      // 추적하는 오브젝트가 있지만, 삭제된경우에는 해당 오브젝트를 더이상 추적하지 않고 함수를 종료
      if (this.targetObject.isDeleted) {
        this.targetObject = null
        return
      } else {
        // 그 외의 경우는 적을 정상적으로 추적
        this.processChaseEnemy()
      }
    } else {
      // 추적하는 오브젝트가 없을 경우 추적하는 오브젝트를 설정합니다.
      this.targetObject = fieldState.getRandomEnemyObject()
      this.isChasing = true
      this.chaseMissCount++ // 추적 미스카운트를 1추가

      // 참고로, chaseMissCount 숫자가 10이상일경우 해당 객체는 적을 더이상 추적하지 않습니다.
      if (this.chaseMissCount >= 10) {
        this.isChaseType = false
        this.isChasing = false
        this.speedX = 20
        this.speedY = 0
        return
      }
    }
  }

  /**
   * 적을 추적하는 함수를 상세 구현한 것
   */
  processChaseEnemy () {
    // 이 함수를 사용하기 전에 targetObject가 null이아님을 확인했으므로 여기서는 따로 null 검사를 하진 않습니다.
    // 현재 오브젝트와 타겟 오브젝트의 center(중심 좌표)를 계산하여 거리 차이를 알아냅니다.
    let targetCenterX = this.targetObject.x + Math.floor(this.targetObject.width / 2)
    let targetCenterY = this.targetObject.y + Math.floor(this.targetObject.height / 2)
    let centerX = this.x + Math.floor(this.width / 2)
    let centerY = this.y + Math.floor(this.height / 2)

    let distanceX = targetCenterX - centerX
    let distanceY = targetCenterY - centerY

    // 남은 거리의 1/10 만큼, 해당 오브젝트를 이동시킵니다.
    this.speedX = Math.floor(distanceX / 10)
    this.speedY = Math.floor(distanceY / 10)

    // 속도 보정
    if(this.speedX <= 0 && this.speedX > -4) {
      this.speedX = -4
    } else if(this.speedX > 0 && this.speedX < 4) {
      this.speedX = 4
    }

    if(this.speedY <= 0 && this.speedY > -4) {
      this.speedY = -4
    } else if(this.speedY > 0 && this.speedY < 4) {
      this.speedY = 4
    }

    // 적과의 거리가 짧을 경우, 강제로 해당 위치로 이동합니다.
    if(Math.abs(distanceX) <= 4) {
      this.x = targetCenterX
    }

    if(Math.abs(distanceY) <= 4) {
      this.y = targetCenterY
      this.speedY = 0
    }
  }

  display () {
    if (this.enimation) {
      this.enimation.processAndDisplay(this.x, this.y)
    } else if (this.image) {
      graphicSystem.imageDisplay(this.image, this.x, this.y)
    }
  }
}

class MultyshotData extends WeaponData {
  constructor () {
    super()
    this.mainType = 'multyshot'
    this.subType = 'multyshot'
    this.id = ID.weapon.multyshot
    this.width = 10
    this.height = 4
    this.color = 'orange'

    this.moveX = 20
    this.moveY = 0
    this.speedX = 20
    this.speedY = 0
    this.direction = ''
    this.image = imageFile.weapon.multyshot
  }

  display () {
    const SHOT_WIDTH = 40
    const SHOT_HEIGHT = 8
    const SHOT_LAYER_Y = 10
    let outputLine = 0 // 레이저를 출력할 이미지 내부에서 몇 번째 줄에 있냐를 표시

    switch (this.color) {
      case 'green': 
        outputLine = 1; 
        break
      case 'blue': 
        outputLine = 2;
        break
      case 'orange':
      default:
        outputLine = 0
        break
    }

    graphicSystem.imageDisplay(this.image, 0, SHOT_LAYER_Y * outputLine, SHOT_WIDTH, SHOT_HEIGHT, this.x, this.y, SHOT_WIDTH, SHOT_HEIGHT)
  }
}

class MultyshotSideUp extends MultyshotData {
  constructor () {
    super()
    this.color = 'green'
    this.speedY = 2
  }
}

class MultyshotSideDown extends MultyshotData {
  constructor () {
    super()
    this.color = 'green'
    this.speedY = -2
  }
}

class MultyshotHoming extends MultyshotData {
  constructor () {
    super()
    this.color = 'blue'
    this.isChaseType = true
  }
}

class MissileData extends WeaponData {
  constructor () {
    super()
    this.mainType = 'missile'
    this.subType = 'missileA'
    this.id = ID.weapon.missile
    this.isChaseType = true
    this.width = 40
    this.height = 20
    this.speedX = 12
    this.repeatCount = 5
    this.repeatDelay = new DelayData(6)
    this.state = 'normal'
    this.enimation = new EnimationData(imageFile.weapon.missile, 0, 0, 40, 20, 8, 0, -1)
  }

  /**
   * 스플래시 영역을 얻습니다.  
   * 오브젝트의 속성을 추가하지 않고, 굳이 이런 함수를 만든 이유는, 
   * 현재 위치에 따라 스플래시 영역이 변경되기 때문입니다.
   * @returns 
   */
  getSplashArea () {
    return {
      x: this.x - 50,
      y: this.y - 50,
      width: 100,
      height: 100
    }
  }

  display () {
    if (this.state === 'normal' && this.enimation != null) {
      this.enimation.processAndDisplay(this.x, this.y)
    }
  }

  /**
   * 무기 공격 방식: 적과의 충돌 여부를 확인한 후, 스플래시 모드로 변경합니다.
   */
  processAttack () {
    if (this.state === 'normal') {
      this.processAttackNormal()
    } else if (this.state === 'splash' && this.repeatDelay.check()) {
      this.processAttackSplash()
    }

    // 이 함수에서 무기가 삭제됨.
    this.repeatCountCheck()
  }

  /**
   * 반복카운트가 0이되면 모든 공격을 끝냈으므로, 더이상 무기의 효과를 발동시키지 않습니다.
   * 이것은, 반복카운트가 0이 됨을 체크하는 것입니다.
   */
  repeatCountCheck () {
    if (this.repeatCount <= 0) {
      this.isDeleted = true
    }
  }

  /**
   * 일반 공격에 대한 처리, 적을 타격하는 순간 스플래시 모드로 변경
   */
  processAttackNormal () {
    let enemyObject = fieldState.getEnemyObject()

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      // 각각의 적마다 충돌 검사
      if (collision(this, currentEnemy)) {
        // 하나라도 충돌했다면, 이 함수를 종료하고, 다음 프레임에서 스플래시공격을 함.
        // 그리고, 그 즉시 미사일은 움직이지 않습니다.
        this.state = 'splash'
        this.speedX = 0
        this.speedY = 0
        this.isChaseType = false
        return
      }
    }
  }

  /**
   * 스플래시 공격에 대한 로직 처리
   */
  processAttackSplash () {
    let enemyObject = fieldState.getEnemyObject()
    this.repeatCount--
    let splashArea = this.getSplashArea()
    fieldState.createEffectObject(ID.effect.missile, splashArea.x, splashArea.y)

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      // 각각의 적마다 충돌 검사
      if (collision(splashArea, currentEnemy)) {
        this.damageProcess(currentEnemy)
      }
    }
  }
}

class MissileUp extends MissileData {
  constructor () {
    super()
    this.subType = 'missileB'
    this.id = ID.weapon.missileUp
    this.isChaseType = false
    this.width = 40
    this.height = 20
    this.speedX = 12
    this.speedY = -2
    this.state = 'splashB'
    this.repeatCount = 6
    this.repeatDelay = new DelayData(8)
    this.enimation = new EnimationData(imageFile.weapon.missileB, 0, 0, 40, 20, 6, 0, -1)
  }

  processAttack () {
    if (this.repeatDelay.check()) {
      this.processAttackSplash()
    }

    this.repeatCountCheck()
  }

  display () {
    if (this.enimation != null) {
      this.enimation.processAndDisplay(this.x, this.y)
    }
  }
}

class MissileDown extends MissileUp {
  constructor () {
    super()
    this.speedY = 2
  }
}

class Arrow extends WeaponData {
  constructor () {
    super()
    this.mainType = 'bounce'
    this.subType = 'arrow'
    this.id = ID.weapon.arrow
    this.speedY = 4
    this.speedX = 17
    this.width = 20
    this.height = 20
    this.bounceMaxCount = 6
    this.bounceCount = 0
    this.color = 'brown'
    this.enimation = new EnimationData(imageFile.weapon.arrow, 0, 0, 20, 20, 7, 0, -1)
  }

  processMove () {
    // 이동 방식만 다르므로, processMove 함수만 수정합니다. (나머지 부분은 multyshot과 동일)
    // 화살표는 벽에 6번 정도 튕깁니다.
    // 총 4번이상 튕기면 더이상 튕기지 않고, 해당 무기는 사라집니다.

    // 이동 처리
    super.processMove()

    // 왼쪽 또는 오른쪽 벽에 튕긴다면, x축의 속도가 반전됩니다.
    // 좀 더 정확한 방향값(-는 왼쪽, +는 오른쪽)을 설장하기 위해 Math.abs 함수를 사용했습니다.
    // 벽에 튕길경우, bounceCount가 1증가합니다.
    if (this.x < 0) {
      this.x = 0
      this.speedX = Math.abs(this.speedX)
      this.bounceCount++
    } else if (this.x > graphicSystem.CANVAS_WIDTH) {
      this.x = graphicSystem.CANVAS_WIDTH
      this.speedX = -Math.abs(this.speedX)
      this.bounceCount++
    }

    if (this.y < 0) {
      this.y = 0
      this.speedY = Math.abs(this.speedY)
      this.bounceCount++
    } else if (this.y > graphicSystem.CANVAS_HEIGHT) {
      this.y = graphicSystem.CANVAS_HEIGHT
      this.speedY = -Math.abs(this.speedY)
      this.bounceCount++
    }

    // 바운스 횟수가 바운스 최대 횟수 이상이라면 해당 무기는 삭제됩니다.
    // 다만, 로직 처리상 즉시 삭제는 안되고, 프로세스가 모두 끝나야 삭제할 수 있습니다.
    if (this.bounceCount > this.bounceMaxCount) {
      this.isDeleted = true
    }
  }
}

class ArrowDown extends Arrow {
  constructor () {
    super()
    this.speedY = -4
    this.color = 'green'
    this.enimation = new EnimationData(imageFile.weapon.arrow, 0, 20, 20, 20, 7, 0, -1)
  }
}

class Laser extends WeaponData {
  /**
   * 레이저는 적을 관통하는 특징이 있습니다.
   */
  constructor () {
    super()
    this.mainType = 'laser'
    this.subType = 'laser'
    this.id = ID.weapon.laser
    this.baseSpeed = 11
    this.speedX = this.baseSpeed
    this.speedY = 0
    this.baseWidth = 160
    this.baseHeight = 80
    this.width = 160
    this.height = 20
    this.repeatCount = 10
    this.direction = 'right'
    this.image = imageFile.weapon.laser
    this.repeatDelay = new DelayData(2)
  }

  processAttack () {
    // 2프레임당 한번만 공격함. 따라서 반복 대기시간이 넘어가지 않는다면, 함수 강제 종료.
    if (!this.repeatDelay.check()) return

    // 레이저는 기준 로직과 약간 다름
    let enemyObject = fieldState.getEnemyObject()

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      // 각각의 적마다 충돌 검사
      if (collision(this, currentEnemy)) {
        // 충돌한 경우, 충돌한 상태에서의 로직을 처리
        // 한번 적을 공격할 때마다 반복 카운트 1 감소
        this.damageProcess(currentEnemy)
        this.repeatCount--

        // 반복 카운트가 0이되면, 더이상 공격은 진행되지 않고, 레이저는 삭제됩니다.
        if (this.repeatCount < 0) {
          this.isDeleted = true
          return 
        }
      }
    }
  }

  display () {
    const SLICE_X = 0
    const SLICE_Y = 0
    const WIDTH = 160
    const HEIGHT = 20
    graphicSystem.imageDisplay(this.image, SLICE_X, SLICE_Y, WIDTH, HEIGHT, this.x, this.y, WIDTH, HEIGHT)
  }
}

class LaserBlue extends Laser {
  constructor () {
    super()
    this.subType = 'laserBlue'
    this.id = ID.weapon.laserBlue

    // 참고: 이 레이저는 곧바로 추적하진 않습니다.
    // 그렇다고 isChaseType을 바꾸는것은 직관적이지 않으므로, 임시로 true로 지정 후,
    // processChase 함수를 다시 작성해 로직을 처리합니다.
    this.isChaseType = true 
    
    // 방향 관련 변수들, 레이저는 8번 이상 방향을 바꿀 수 없습니다.
    // X축 따로, Y축 따로 판단해서 방향 변수가 변경되는지 확인합니다.
    this.directionChangeCount = 0
    this.directionChangeMaxCount = 8
    this.xDirection = ''
    this.yDirection = ''

    this.baseDiagonalWidth = 128
    this.baseDiagonalHeight = 128

    this.laserCenterX = 0
    this.laserCenterY = 0
    this.directionChangeDelay = new DelayData(12)
  }

  /**
   * 레이저는 다른 무기들과 추적 방식이 약간 다릅니다.  
   * 적어도 일정 시간이 지나야 추적을 시작합니다.
   */
  processChase () {
    // 추적 타입이 아닌 경우, 함수 종료(...)
    if (!this.isChaseType) return

    // 레이저의 추적 지연시간 확인 (지연시간보다 작으면 추적하지 않음.)
    if (!this.directionChangeDelay.check(false)) return

    // 추적 함수 실행
    super.processChase()
  }

  process () {
    this.processChangeSizeWithPosition() // 이 함수가 필요해서...
    super.process() // 부모 process 함수를 사용해서 간편하게 process 기능 확장...
  }

  /**
   * 레이저 사이즈 변경용 (이동 방향에 따라 판정이 변경되어야 하므로)
   */
  processChangeSizeWithPosition () {
    if (this.xDirection === '') {
      // x축 방향이 없을 때는, 세로 방향이므로, width와 height 길이가 서로 반전됩니다. (가로 세로 길이 반전)
      this.width = this.baseHeight
      this.height = this.baseWidth
    } else if (this.yDirection === '') {
      // y축 방향이 없을 때는, 가로 방향입니다.
      this.width = this.baseWidth
      this.height = this.baseHeight
    } else {
      // x축 또는 y축 방향이 존재하면, 대각선 이동입니다.
      this.width = this.baseDiagonalWidth
      this.height = this.baseDiagonalHeight
    }
  }

  processAttack () {
    // 2프레임당 한번만 공격함. 따라서 반복 대기시간이 넘어가지 않는다면, 함수 강제 종료.
    if (!this.repeatDelay.check()) return

    let enemyObject = fieldState.getEnemyObject()

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      if ( 
        (this.xDirection === 'right' && this.yDirection === 'up') ||
        (this.xDirection === 'left' && this.yDirection === 'down') ) {
        let laserAreaOBB = {
          x: this.x,
          y: this.y,
          width: this.baseWidth,
          height: this.baseHeight,
          degree: 135
        }
        if (collisionOBB.collision(laserAreaOBB, currentEnemy)) {
          this.damageProcess(currentEnemy)
          this.repeatCount--
        }
      } else if (
        (this.xDirection === 'right' && this.yDirection === 'down') ||
        (this.xDirection === 'left' && this.yDirection === 'up')) {
        let laserAreaOBB = {
          x: this.x,
          y: this.y,
          width: this.baseWidth,
          height: this.baseHeight,
          degree: 45
        }
        if (collisionOBB.collision(laserAreaOBB, currentEnemy)) {
          this.damageProcess(currentEnemy)
          this.repeatCount--
        }
      } else {
        // 각각의 적마다 충돌 검사
        if (collision(this, currentEnemy)) {
          this.damageProcess(currentEnemy)
          this.repeatCount--
        }
      }

      // 반복 카운트가 0이되면, 더이상 공격은 진행되지 않고, 레이저는 삭제됩니다.
      if (this.repeatCount < 0) {
        this.isDeleted = true
        return 
      } 
    }
  }

  processMove () {
    // X축 방향을 살펴보면서, X축 방향에 따른 속도를 변경합니다.
    if (this.xDirection === 'left') {
      this.speedX = -this.baseSpeed
    } else if (this.xDirection === 'right') {
      this.speedX = this.baseSpeed
    } else {
      this.speedX = 0
    }

    // Y축도 마찬가지
    if (this.yDirection === 'up') {
      this.speedY = -this.baseSpeed
    } else if (this.yDirection === 'down') {
      this.speedY = this.baseSpeed
    } else {
      this.speedY = 0
    }

    // 단, X축과 Y축 모두 멈춰있을 경우, 레이저는 강제로 오른쪽 방향으로 이동합니다.
    // 여기서는 방향 변경 카운트를 세진 않음.
    if (this.speedX === 0 && this.speedY === 0) {
      this.xDirection = 'right'
      this.speedX = this.baseSpeed
    }

    // 레이저는 이동할 때, centerX, centerY(중심 위치)를 기준으로 이동합니다.
    // 따라서, 이 값을 기준으로 위치를 정한 다음, x, y의 위치를 재조정합니다.
    // 바꿔말하면, x, y좌표를 직접 이동시키는게 아니라 간접 이동시키는 원리입니다.
    if (this.laserCenterX === 0 && this.laserCenterY === 0) {
      this.laserCenterX = this.x + (this.width / 2)
      this.laserCenterY = this.y + (this.height / 2)
    }

    this.laserCenterX += this.speedX
    this.laserCenterY += this.speedY
    if (this.xDirection !== '' && this.yDirection === '') {
      // x축은 방향이 있고, y축은 방향이 없다면 가로 방향입니다.
      this.x = this.laserCenterX - (this.width / 2)
      this.y = this.laserCenterY - (this.height / 2)
    } else if (this.xDirection === '' && this.yDirection !== '') {
      // y축은 방향이 있고, x축은 방향이 없다면 세로 방향입니다.
      this.x = this.laserCenterX - (this.width / 2)
      this.y = this.laserCenterY - (this.height / 2)
    } else {
      // 레이저가 대각선 방향인 경우
      this.x = this.laserCenterX - (128 / 2)
      this.y = this.laserCenterY - (128 / 2)
    }
  }

  processChaseEnemy () {
    const scopeSize = 20 // 레이저의 대략적인 추적 범위
    let isXDirectionChanged = false // X축의 방향은 변경되었습니까?
    let isYDirectionChanged = false // y축의 방향은 변경되었습니까?
    let halfWidth = this.width / 2
    let halfHeight = this.height / 2
    let centerX = this.x + halfWidth // 레이저의 중심 x좌표
    let centerY = this.y + halfHeight // 레이저의 중심 y좌표

    // 적과의 X축 비교
    if (centerX + scopeSize < this.targetObject.x) {
      // 적이 레이저보다 오른쪽에 있을 때
      // xDirection이 오른쪽 방향일 경우 변동 없음.
      if (this.xDirection !== 'right') {
        // 만약, xDirection이 오른쪽 방향이 아니라면, 레이저를 오른쪽 방향으로 변경하고
        // 방향 변경을 true로 지정
        this.xDirection = 'right'
        isXDirectionChanged = true
      }
    } else if (centerX - scopeSize > this.targetObject.x) {
      // 적이 레이저보다 왼쪽에 있을 경우
      // xDirection이 왼쪽 방향일 경우 변동 없음
      if (this.xDirection !== 'left') {
        // 만약, xDirection이 왼쪽 방향이 아니라면, 레이저를 왼쪽 방향으로 변경하고
        // 방향 변경을 true로 지정
        this.xDirection = 'left'
        isXDirectionChanged = true
      }
    } else {
      // 그러나, 적의 X축 위치를 비교했을 때 서로 차이가 없다면, X축 이동 방향은 없습니다. (제자리 고정)
      // 따라서 이동 방향이 있는지를 검사해서, 이동 방향을 제거합니다. (이것도 방향 변경 처리)
      if (this.xDirection !== '') {
        this.xDirection = ''
        isXDirectionChanged = true
      }
    }

    // 적과의 Y축 비교 (X축이랑 거의 비슷한 방식입니다.)
    if (centerY + scopeSize < this.targetObject.y) {
      // 적이 레이저보다 위쪽에 있을 때
      // yDirection 방향을 비교하고, 아래쪽이 아닐 경우, 레이저를 아래쪽 방향으로 변경합니다.
      if (this.yDirection !== 'down') {
        this.yDirection = 'down'
        isYDirectionChanged = true
      }
    } else if (centerY - scopeSize > this.targetObject.y) {
      // 적이 레이저보다 아래쪼겡 있을 때
      // yDirection 방향을 비교하고 위쪽이 아닐 경우, 레이저를 위쪽 방향으로 변경합니다.
      if (this.yDirection !== 'up') {
        this.yDirection = 'up'
        isYDirectionChanged = true
      }
    } else {
      // 그러나, 적의 Y축 위치를 비교했을 때 서로 차이가 없다면, Y축 이동방향은 없습니다.
      // 이하, X축 비교 설명과 동일
      if (this.yDirection !== '') {
        this.yDirection = ''
        isYDirectionChanged = true
      }
    }

    // 방향 변경 여부를 살펴봅니다. 
    // X축 또는 Y축 중 한개라도 방향이 변경되었다면, 방향 변경 카운트 1 증가합니다.
    if (isXDirectionChanged || isYDirectionChanged) {
      this.directionChangeCount++
    }

    // 방향을 여러번 변경했다면, chaseType이 false로 변경되어 더이상 적을 추적하지 않습니다.
    if (this.directionChangeCount >= this.directionChangeMaxCount) {
      this.isChaseType = false
    }
  }

  display () {
    const SLICE_FRONT_X = 0
    const SLICE_UPDOWN_X = 180
    const SLICE_DIAGONAL_RIGHT_X = 200
    const SLICE_DIAGONAL_LEFT_X = 350
    const SLICE_Y = 0 // 나미저 전부
    const SLICE_FRONT_Y = 20 // front 한정
    const WIDTH = 160
    const HEIGHT = 20
    const WIDTH_DIAGONAL = 128
    const HEIGHT_DIAGONAL = 128

    // 이동 클락 포지션 (위쪽부터 시계방향순서로 번호를 매김)
    // 0: up, 1: up + right, 2: right ... 6: left, 7: up + left 이런 형태
    // 아무 방향도 없다면 억지로 오른쪽 방향으로 이동하기에 멈춰있는건 생각할 필요가 없음.
    let moveClockPosition = 0 // 기본값: 위쪽 방향

    // 이제, x방향과 y방향을 알아보면서 어느쪽 시계 방향 번호인지를 확인합니다.
    // 참고: 0번은 기본값이라 따로 검사할 필요 없을듯...
    if (this.xDirection === '' && this.yDirection === 'up') {
      moveClockPosition = 0
    } else if (this.xDirection === 'right' && this.yDirection === 'up') {
      moveClockPosition = 1
    } else if (this.xDirection === 'right' && this.yDirection === '') {
      moveClockPosition = 2
    } else if (this.xDirection === 'right' && this.yDirection === 'down') {
      moveClockPosition = 3
    } else if (this.xDirection === '' && this.yDirection === 'down') {
      moveClockPosition = 4
    } else if (this.xDirection === 'left' && this.yDirection === 'down') {
      moveClockPosition = 5
    } else if (this.xDirection === 'left' && this.yDirection === '') {
      moveClockPosition = 6
    } else if (this.xDirection === 'left' && this.yDirection === 'up') {
      moveClockPosition = 7
    }

    switch (moveClockPosition) {
      // 참고: 레이저 위쪽 방향은 너비와 높이가 서로 반대된 상태로 출력되면 됩니다.
      case 0: case 4: // up, down
        graphicSystem.imageDisplay(this.image, SLICE_UPDOWN_X, SLICE_Y, HEIGHT, WIDTH, this.x, this.y, HEIGHT, WIDTH)
        break
      case 1: case 5: 
        graphicSystem.imageDisplay(this.image, SLICE_DIAGONAL_RIGHT_X, SLICE_Y, WIDTH_DIAGONAL, HEIGHT_DIAGONAL, this.x, this.y, WIDTH_DIAGONAL, HEIGHT_DIAGONAL)
        break
      case 2: case 6: // left, right
        graphicSystem.imageDisplay(this.image, SLICE_FRONT_X, SLICE_FRONT_Y, WIDTH, HEIGHT, this.x, this.y, WIDTH, HEIGHT)
        break
      case 3: case 7:
        graphicSystem.imageDisplay(this.image, SLICE_DIAGONAL_LEFT_X, SLICE_Y, WIDTH_DIAGONAL, HEIGHT_DIAGONAL, this.x, this.y, WIDTH_DIAGONAL, HEIGHT_DIAGONAL)
        break
    }
  }
}

class Sapia extends WeaponData {
  constructor (sapiaShotAttack) {
    super()
    this.mainType = 'sapia'
    this.subType = 'sapia'
    this.id = ID.weapon.sapia
    this.width = 48
    this.height = 48
    this.image = imageFile.weapon.sapia
    this.repeatCount = 4
    this.repeatDelay = new DelayData(10)
    this.isChaseType = true
    this.sapiaShotAttack = sapiaShotAttack
  }

  processMove () {
    // subType이 sapia일경우만 다른 로직을 쓰므로, 이를 구분합니다.
    // sapiaShot은 일반 로직 사용
    if (this.subType === 'sapia') {
      if (this.targetObject) {
        this.x = this.targetObject.x
        this.y = this.targetObject.y
      } else {
        this.x = fieldState.getPlayerObject().x + 200
        this.y = fieldState.getPlayerObject().y
      }
    } else {
      super.processMove()
    }
  }

  /**
   * 사피아는, chase방식이 다른 무기와는 완전히 다릅니다.
   * 먼저, 영역을 설정하고, 영역 내에 적이 있는지 살펴봅니다.
   */
  processChase () {
    // chaseType이 아닐경우, 함수 강제 종료
    if (!this.isChaseType) return

    // targetObject가 null이 아닐 경우, 정상적으로 적을 추적
    if (this.targetObject != null) {
      if (this.targetObject.isDeleted) {
        this.targetObject = null
        return
      }
    } else {
      // targetObject가 없다면, 새로운 적을 찾음
      let enemyObject = fieldState.getEnemyObject()

      // 감지 범위
      let detectArea = {
        x: this.x - 300,
        y: this.y - 200,
        width: 600,
        height: 400
      }

      // 랜덤한 적을 타격하기 위해...
      // 밑에 for문이 두개 있는 까닭은 randomIndex 적이 영역 내에 없을 때 다른 모든 적을 검색하기 위해서입니다.
      let randomIndex = Math.floor(Math.random() * enemyObject.length)
  
      // randomIndex부터 맨 끝번호까지 적이 영역 내에 있는지 검사
      for (let i = randomIndex; i < enemyObject.length; i++) {
        let currentEnemy = enemyObject[i]
        if (collision(detectArea, currentEnemy)) {
          this.targetObject = currentEnemy
          return
        }
      }

      // 그리고, 0번부터 randomIndex까지 적이 영역 내에 있는지 검사
      for (let i = 0; i <randomIndex; i++) {
        let currentEnemy = enemyObject[i]
        if (collision(detectArea, currentEnemy)) {
          this.targetObject = currentEnemy
          return
        }
      }
    }
  }
  
  /**
   * 사피아샷이 계속 늘어나는걸 막기 위해, 공격 로직을 subType별로 분리하였습니다.
   * 사피아샷은 일반 오브젝트랑 공격방식이 똑같습니다.  
   * 그러나, 사피아는 사피아샷을 추가 생성하기 때문에, 사피아샷의 공격방식을 분리하지 않으면 
   * 엄청난 수의 사피아샷이 증가합니다. (공포의 렉)
   */
  processAttack () {
    if (this.subType === 'sapia') {
      this.processAttackSapia()
    } else {
      super.processAttack()
    }
  }

  processAttackSapia () {
    // 반복딜레이가 넘지 않았다면 함수 강제 종료
    if (!this.repeatDelay.check()) return

    // 공격 반복 쇳수 감소
    this.repeatCount--

    // 플레이어의 위치 (사피아샷은 플레이어 위치에서 발사됩니다.)
    let playerX = fieldState.getPlayerObject().x
    let playerY = fieldState.getPlayerObject().y

    // 타겟팅 된 오브젝트가 있을 경우 적을 타격
    if (this.targetObject) {
      this.damageProcess(this.targetObject)
    }

    // 추가 샷 발사 (무기가 무기를 생성...)
    fieldState.createWeaponObject(ID.weapon.sapiaShot, playerX, playerY, this.sapiaShotAttack, this.x, this.y)
  }

  display () {
    const SLICE_X = 0
    const SLICE_Y = 0
    graphicSystem.imageDisplay(this.image, SLICE_X, SLICE_Y, this.width, this.height, this.x, this.y, this.width, this.height)
    graphicSystem.fillLine(fieldState.getPlayerObject().x, fieldState.getPlayerObject().y, this.x, this.y, 'blue')
  }
}

class SapiaShot extends Sapia {
  /**
   * 옵션: 배열의 순서대로
   * 1. targetX(타겟의 X좌표), 2. targetY(타겟의 Y좌표)
   */
  constructor (option) {
    super()
    this.id = ID.weapon.sapiaShot
    this.subType = 'sapiaShot'
    this.width = 26
    this.height = 26
    this.targetX = option[0]
    this.targetY = option[1]
    this.speedX = 0
    this.speedY = 0
  }

  processMove () {
    // 이동 속도 강제 지정
    // 생성자에서 하지 않는 이유는, 현재 좌표값을 생성 당시에는 모르기 때문
    // 대신에, speedX와 speedY를 0으로 초기화한 것으로, 이동 속도가 없을 때,
    // 적과 사피아샷의 위치를 기준으로 이동속도 설정
    if (this.speedX === 0 && this.speedY === 0) {
      this.speedX = (this.targetX - this.x) / 20
      this.speedY = (this.targetY - this.y) / 20
      let minSpeed = 4 // 최소 이동속도(절댓값, 부호 무시)

      // 만약 한쪽 방향이라도 속도가 minSpeed이하라면 (절댓값으로 계산, 부호 무시)
      if (Math.abs(this.speedX) <= minSpeed || Math.abs(this.speedY) <= minSpeed) {
        // 두개 모두 속도가 3 이상이 될 때까지, 나누기 속도값을 1씩 내려서 반복하여 계산
        // 다만, diviedSpeed가 1 이하면, 그냥 대충 대입하고 끝냄 (? 1나누기면 어차피 직접 적에게 닿는거 아님?)
        for (let divideSpeed = 20; divideSpeed >= 2; divideSpeed--) {
          this.speedX = (this.targetX - this.x) / divideSpeed
          this.speedY = (this.targetY - this.y) / divideSpeed
          if(Math.abs(this.speedX) > minSpeed || Math.abs(this.speedY) > minSpeed) break
        }
      }
    }

    // 실제 이동 처리
    super.processMove()
  }

  display () {
    const SLICE_X = 50
    const SLICE_Y = 0
    graphicSystem.imageDisplay(this.image, SLICE_X, SLICE_Y, this.width, this.height, this.x, this.y, this.width, this.height)
  }
}

class Parapo extends WeaponData {
  constructor () {
    super()
    this.mainType = 'parapo'
    this.subType = 'parapo'
    this.repeatCount = 2
    this.repeatDelay = new DelayData(4)
    this.image = imageFile.weapon.parapo
    this.width = 45
    this.height = 20
    this.isChaseType = true
    this.enimation = new EnimationData(this.image, 0, 0, this.width, this.height, 14, 0, -1)
  }
  
  processAttack () {
    // 공격 지연시간 확인하고 지연시간 미만이면 함수 강제종료
    if (!this.repeatDelay.check()) return

    let enemyObject = fieldState.getEnemyObject()

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      // 각각의 적마다 충돌 검사
      if (collision(this, currentEnemy)) {
        /*
         * 적이랑 충돌했을 때, 충격파 추가로 발사(실제 타격데미지도 있긴 하지만...)
         * 충격파는, 적의 중심 위치를 기준으로 4개의 방향으로 타격합니다.
         * 파라보 자체의 데미지는 없음. (공격력만 있고, 충격파로 데미지를 줌)
         * 좌표값 상세 [참고: c -> enemy center]
         * left: (cx - 100, cy - 50), right: (cx, cy - 50)
         * up: (cx - 50, cy - 100), down: (cx - 50, cy)
         */
        let enemyCenterX = currentEnemy.x + (currentEnemy.width / 2)
        let enemyCenterY = currentEnemy.y + (currentEnemy.height / 2)
        let shockWaveSize = 100
        let shockWaveSizeHalf = shockWaveSize / 2
        fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX - shockWaveSize, enemyCenterY - shockWaveSizeHalf, this.attack, 'left')
        fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX, enemyCenterY - shockWaveSizeHalf, this.attack, 'right')
        fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX - shockWaveSizeHalf, enemyCenterY - shockWaveSize, this.attack, 'up')
        fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX - shockWaveSizeHalf, enemyCenterY, this.attack, 'down')
        this.repeatCount--
        return
      }
    }
  }
}

class ParapoShockwave extends Parapo {
  /**
   * 옵션:  
   * 0. direction(방향)
   */
  constructor (option = ['']) {
    super()
    this.subType = 'shockwave'
    this.repeatCount = 2
    this.repeatDelay = new DelayData(12)
    this.repeatDelay.count = this.repeatDelay.value // 즉시 카운트 채우기
    this.width = 100
    this.height = 100
    this.speedX = 0
    this.speedY = 0
    this.direction = option[0]
    this.isChaseType = false // 이 무기는 움직이지 않기 때문에 적을 추적하지 않습니다.
  }

  processAttack () {
    if (!this.repeatDelay.check()) return

    this.repeatCount--
    fieldState.createEffectObject(ID.effect.parapo, this.x, this.y, 0, 0, this.direction)

    let enemyObject = fieldState.getEnemyObject()
    let maxCombo = 4 // 한번 공격에 적을 때릴 수 있는 수 제한

    // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i]

      // 각각의 적마다 충돌 검사
      if (collision(this, currentEnemy)) {
        this.damageProcess(currentEnemy)
        maxCombo-- // 적 공격 가능횟수 1회 감소

        // 한번 공격에 적을 너무 많이 때리면 리턴
        if (maxCombo <= 0) {
          return
        }
      }
    }
  }

  display () {
    // 아무것도 보여주지 않음.
  }
}

/**
 * 플레이어 무기 데이터 (이 클래스는 static 클래스입니다.)  
 * 참고: 기본 스펙은 다음과 같습니다.  
 * 1초당 100% 공격력이 기준값  
 * 나머지 무기는 이 공격력 %를 바꿈으로써 밸런스를 조절할 계획  
 * 경고: 저 수치는 명시적인 수치이지만, create함수에서 무조건 참고하지 않을 수도 있음.
 */
 class PlayerWeaponData {
  /** 
   * 샷 한번 발사에 지연시간(프레임)  
   * 해당 프레임만큼 지연 후 다음 무기를 발사 할 수 있음.
   */
  static delay = 60

  /** 
   * 한번 무기를 발사할 때 동시에 발사되는 개수  
   * 2 이상일 경우, 동시에 2발을 발사한다는 뜻
   */ 
  static shotCount = 1

  /** 
   * 초당 공격력 반영 비율: 기본값 100%  
   * 참고: 최종 공격력은 소수점 버림하여 계산합니다.
   */ 
  static attackPercent = 100

  /**
   * 무기에 따른 공격횟수 (발사 횟수랑 다르고, 무기 객체가 공격하는 횟수임.)  
   * (명시적인 수치이나, 제작자의 실수로 로직과 다른 값이 명시될 수 있음.)
   */
  static attackCount = 1

  
  /**
   * 무기 생성 함수: 이 로직에서만 무기를 생성해 주세요.  
   * 그리고 무기 생성은 fieldState.createWeapon 함수를 사용합니다.  
   * 경고: 이 함수를 한번 사용했을 때 attackPercent만큼 공격력을 가진 무기 객체가 발사되어야 합니다.  
   * 즉 create함수가 무기를 1개 생성한다면, 생성한 무기의 공격력의 %는 100%가 되어야 합니다.
   */
  static create (attack, x, y) {}

  /**
   * 명시적인 수치를 기준으로 각 샷 공격력을 계산하는 함수  
   * 일반적인 경우는, 모든 샷의 공격력이 동일하지만, 일부 무기는 아닐 수도 있으며,
   * 이 경우 다른 방식으로 밸런스에 맞춰 계산해야 합니다.
   * @param {number} baseAttack 기준 공격력
   * @param {number} multiple 배율 (최종 공격력의 배율)
   */
  static getShotAttack (baseAttack, multiple = 1) {
    let secondPerCount = 60 / this.delay
    let totalMultiple = this.shotCount * this.attackCount
    let resultAttack = baseAttack / (secondPerCount * totalMultiple)
    return Math.floor(resultAttack * multiple)
  }

  static getShotMultipleAttack () {
    let secondPerCount = 60 / this.delay
    let totalMultiple = this.shotCount * this.attackCount
    return secondPerCount / totalMultiple
  }
}


class PlayerMultyshot extends PlayerWeaponData {
  // 단순한 무기라, 따로 추가로 계산할 요소는 거의 없음
  static delay = 6
  static attackPercent = 100
  static shotCount = 5

  static create (attack, x, y) {
    // 샷 카운트: 5, 초당 10회 = 총 발사 수 50
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.multyshot, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshot, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshotSideUp, x, y - 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshotSideDown, x, y + 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshotHoming, x - 5, y, shotAttack)
  }
}

class PlayerMissile extends PlayerWeaponData {
  static missile = new MissileData()
  static missileB = new MissileUp()

  // 참고, 복잡한 무기의 경우, 해당 무기의 정보를 가져와서 계산합니다.
  // 이렇게 안하면, 나중에 밸런스 수정할 때 여러개의 코드를 수정해야 할 수도 있습니다.
  static delay = 30
  static attackPercent = 80
  static shotCount = 4
  // 공격 카운트: (미사일 반복 수 + 미사일B 반복 수) / 2 (단, 소수점 버림...)
  // 실제로, 미사일 반복 수는 5이고, 미사일B는 6이라... 5.5가 되어야 하나, 소수점을 버림하므로 5임.
  // 사실, 로켓은 총 데미지%에 약간 보너스가 있는셈 (미사일 대비 이론상 총데미지 120%)
  static attackCount = Math.floor((this.missile.repeatCount + this.missileB.repeatCount) / 2)

  static create (attack, x, y) {
    // 샷 카운트: 4, 초당 2회 = 총 발사 수 8
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.missile, x, y - 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.missile, x, y + 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.missileUp, x + 10, y - 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.missileDown, x + 10, y + 5, shotAttack)
  }
}

class PlayerArrow extends PlayerWeaponData {
  static delay = 10
  static shotCount = 2
  static attackPercent = 100
  static create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.arrow, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.arrowDown, x, y, shotAttack)
  }
}

class PlayerLaser extends PlayerWeaponData {
  static laser = new Laser()
  static delay = 20
  static shotCount = 4
  static attackPercent = 100
  static attackCount = this.laser.repeatCount

  static create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack)
    let randomY1 = -20 + (Math.random() * 40)
    let randomY2 = -20 + (Math.random() * 40)

    fieldState.createWeaponObject(ID.weapon.laser, x, y + randomY1 + 10, shotAttack)
    fieldState.createWeaponObject(ID.weapon.laser, x, y + randomY2 - 10, shotAttack)
    fieldState.createWeaponObject(ID.weapon.laserBlue, x, y + randomY1 + 10, shotAttack)
    fieldState.createWeaponObject(ID.weapon.laserBlue, x, y + randomY2 - 10, shotAttack)
  }
}

class PlayerSapia extends PlayerWeaponData {
  static sapia = new Sapia()
  static delay = 40
  static shotCount = 3
  static attackPercent = 100
  static attackCount = this.sapia.repeatCount // 사피아(30%) + 시파이샷(70%)
  
  static create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack, 0.3)
    const sapiaShotAttack = this.getShotAttack(attack, 0.7)

    fieldState.createWeaponObject(ID.weapon.sapia, x, y, shotAttack, sapiaShotAttack)
    fieldState.createWeaponObject(ID.weapon.sapia, x, y, shotAttack, sapiaShotAttack)
    fieldState.createWeaponObject(ID.weapon.sapia, x, y, shotAttack, sapiaShotAttack)
  }
}

class PlayerParapo extends PlayerWeaponData {
  static parapo = new Parapo()
  static shockWave = new ParapoShockwave()
  static shotCount = 4
  static delay = 60

  // 공격 개수 = 파라포 반복 * 4(왼쪽, 오른쪽, 위, 아래) * 쇼크웨이브 반복
  // 공격 개수가 4배인것을 이 정보에 저장했기 때문에, 무기 알고리즘 내에서 추가적인 공격력 정보를 넣을 필요는 없습니다.
  static attackCount = this.parapo.repeatCount * 4 * this.shockWave.repeatCount

  static create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.parapo, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.parapo, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.parapo, x, y, shotAttack)
  }
}


/**
 * 이펙트 데이터  
 * 기본 규칙: 이펙트는 한번만 모든 에니메이션 프레임을 번갈아 출력하고 사라집니다.  
 * 예를들어, missileEffect의 경우, 해당 이펙트는 총 10프레임이며, 이 10프레임이 전부 출력되면 그 다음 프레임에 사라집니다.
 */
class EffectData extends FieldData {
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
     * 이미지
     */
    this.image = null
  }

  setOption (width, height) {
    this.width = width
    this.height = height
  }

  process () {
    // beforeDelay가 남아있으면, 오브젝트는 표시되지만, 에니메이션은 재생되지 않습니다.
    // 그리고 로직 처리도 되지 않고 함수가 종료됩니다.
    if (this.beforeAnimationDelay >= 1) {
      this.beforeAnimationDelay--
      return
    }

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

    // 만약, 이펙트가 600프레임 이상 지속되면, 강제로 제거됨.
    // 이것은 이펙트가 잠깐동안 나오는 에니메이션이기 때문...
    if (this.elapsedFrame >= 600) {
      this.isDeleted = true
    }
  }

  display () {
    if (this.enimation != null) {
      this.enimation.processAndDisplay(this.x, this.y)
    }
  }
}

class MissileEffect extends EffectData {
  constructor () {
    super()
    this.width = 100
    this.height = 100
    this.enimation = new EnimationData(imageFile.weapon.missileEffect, 0, 0, 100, 100, 10, 2, 1)
  }
}

class ParapoEffect extends EffectData {
  /**
   * 옵션:  
   * 0. direction
   */
  constructor (option = ['']) {
    super()
    this.width = 100
    this.height = 100

    let directionPosition = 0
    switch (option[0]) {
      case 'right': directionPosition = 100; break
      case 'up': directionPosition = 200; break
      case 'down': directionPosition = 300; break
    }

    this.enimation = new EnimationData(imageFile.weapon.parapoEffect, 0, directionPosition, 100, 100, 10, 2, 1)
  }
}

class EnemyData extends FieldData {
  constructor () {
    super()
    /**
     * 점수 공식에 대해: 기본적으로 적의 체력의 1/100 = 1%  
     * 다만 일부 적들은 다를 수 있음. 그건 각 적의 설명을 참고하세요.
     */
    this.score = 100
    this.isInited = false
    this.attack = 0

    /** 죽었는지 체크 */ this.isDied = false
    /** 죽은 후 삭제되기까지의 지연시간 */ this.dieAfterDeleteDelay = 0
    /** 죽은 후 삭제되기까지의 지연시간 카운트 */ this.dieAfterDeleteDelayCount = 0

    /** 
     * 충돌 지연시간  
     * (참고: 적이 플레이어에 닿았다면 60프레임 이후 다시 플레이어를 타격할 수 있습니다.) 
     */ 
    this.collisionDelay = 60
    /** 충돌 지연시간 카운트 */ this.collisionDelayCount = 60

    /**
     * 적이 화면 바깥 일정 영역을 넘어간다면, 제거 대기시간이 추가되고,
     * 일정 시간을 넘어가면 해당 적은 조건에 상관없이 강제로 사라집니다.
     * 기준값은 10초(600 프레임)입니다.
     */
    this.outAreaDeleteDelay = 600
    /** 적 영역 바깥으로 갈 때 제거 대기시간 카운트 */ this.outAreaDeleteDelayCount = 0

    /** 적이 화면 바깥으로 나갈 수 있는지의 여부 */ this.isPossibleExit = true

    /** 이미지 */ this.image = null
  }

  /** 
   * 적 오브젝트를 생성할 때 쓰이는 자동 초기화 함수  
   * 이 함수는 오브젝트를 생성한 직후 추가로 실행해 주세요. (생성자 안에다가 넣으면 제대로 초기화되지 않음.)
   * 사용용도: hpMax값 체크 (다만 이건 임시로 하는것.)
   */
  init () {
    // 초기화가 되었는데 또 초기화를 할 필요는 없잖아요? 무조건 함수 처리 취소
    if (this.isInited) return

    this.isInited = true
    this.hpMax = this.hp
  }

  process () {
    this.x += this.speedX
    this.y += this.speedY
    this.processPossibleExit()

    this.processPlayerCollision()

    // 적 죽었는지 체크
    this.processOutAreaCheck()
    this.processDieCheck()
    this.processDieAfter()
  }

  display () {
    if (this.image != null) {
      graphicSystem.imageDisplay(this.image, this.x, this.y)
    }
  }

  processPossibleExit () {
    // 적이 화면 바깥으로 나갈 수 없는 경우만 처리합니다.
    if (!this.isPossibleExit) {
      if (this.x < 0) {
        this.x = 0
        this.speedX = Math.abs(this.speedX)
      } else if (this.x > graphicSystem.CANVAS_WIDTH) {
        this.x = graphicSystem.CANVAS_WIDTH
        this.speedX = -Math.abs(this.speedX)
      }

      if (this.y < 0) {
        this.y = 0
        this.speedY = Math.abs(this.speedY)
      } else if (this.y > graphicSystem.CANVAS_HEIGHT) {
        this.y = graphicSystem.CANVAS_HEIGHT
        this.speedY = -Math.abs(this.speedY)
      }
    }
  }

  processPlayerCollision () {
    this.collisionDelayCount++
    if (this.collisionDelayCount >= this.collisionDelay) {
      let player = fieldState.getPlayerObject()

      if (collision(this, player)) {
        player.addDamage(this.attack)
        this.collisionDelayCount = 0
      }
    }
  }

  processDieCheck () {
    if (this.isDied) return
    if (this.hp <= 0) {
      this.isDied = true
      fieldState.playerObject.addExp(this.score)
    }
  }

  processDieAfter () {
    if (this.isDied) {
      this.dieAfterDeleteDelayCount++
      if (this.dieAfterDeleteDelayCount >= this.dieAfterDeleteDelay) {
        this.isDeleted = true
      }
    }
  }

  processOutAreaCheck () {
    let player = fieldState.getPlayerObject()
    if (this.x <= player.x - 1600 
     || this.x >= player.x + 1600
     || this.y <= player.y - 1200
     || this.y >= player.y + 1200 ) {
      this.outAreaDeleteDelayCount++
    } else {
      this.outAreaDeleteDelayCount--
    }

    if (this.outAreaDeleteDelayCount >= this.outAreaDeleteDelay) {
      this.isDeleted = true
    }
  }
}


/**
 * 테스트용 적
 */
class TestEnemy extends EnemyData {
  constructor () {
    super()
    this.hp = 10000
    this.score = 100
    this.width = 48
    this.height = 48
    this.image = imageFile.enemyTemp
  }
}

class TestAttackEnemy extends EnemyData {
  constructor () {
    super()
    this.hp = 20000
    this.score = 400
    this.width = 48
    this.height = 48
    this.attack = 10
    this.isPossibleExit = false
    this.image = imageFile.enemyTemp
    this.speedX = -1
  }

}

class Donggeurami extends EnemyData {
  constructor () {
    super()
    this.hp = 10000
    this.score = 1000
    this.width = 48
    this.height = 48
  }

  display () {
    const IMAGE = imageFile.enemyTemp
    graphicSystem.imageDisplay(IMAGE, this.x, this.y)
  }
}

/**
 * tamshooter4의 데이터 모음  
 */
export class tamshooter4Data {

  /**
   * 플레이어 무기 데이터를 가져옵니다. 리턴되는 클래스는 static 클래스이므로, 따로 인스턴스를 생성하지 마세요.
   * @param {ID} id ID 클래스가 가지고 있는 상수 값을 넣어주세요.  
   * @returns {PlayerWeaponData} playerWeapon의 클래스, 값이 없다면 null
   */
  static getPlayerWeaponData (id) {
    switch (id) {
      case ID.playerWeapon.multyshot: return PlayerMultyshot
      case ID.playerWeapon.missile: return PlayerMissile
      case ID.playerWeapon.arrow: return PlayerArrow
      case ID.playerWeapon.laser: return PlayerLaser
      case ID.playerWeapon.sapia: return PlayerSapia
      case ID.playerWeapon.parapo: return PlayerParapo
      default: return null
    }
  }

  /**
   * 무기 데이터 클래스를 가져옵니다. fieldState에서 사용하려면 따로 인스턴스를 생성해주세요.
   * @param {ID} weaponId ID 클래스가 가지고 있는 상수 값을 넣어주세요.
   * @returns {WeaponData}  weaponData 클래스, 만약 해당하는 값이 없다면 null
   */
  static getWeaponData (weaponId) {
    switch (weaponId) {
      case ID.weapon.multyshot: return MultyshotData
      case ID.weapon.multyshotHoming: return MultyshotHoming
      case ID.weapon.multyshotSideDown: return MultyshotSideDown
      case ID.weapon.multyshotSideUp: return MultyshotSideUp
      case ID.weapon.missile: return MissileData
      case ID.weapon.missileUp: return MissileUp
      case ID.weapon.missileDown: return MissileDown
      case ID.weapon.arrow: return Arrow
      case ID.weapon.arrowDown: return ArrowDown
      case ID.weapon.laser: return Laser
      case ID.weapon.laserBlue: return LaserBlue
      case ID.weapon.sapia: return Sapia
      case ID.weapon.sapiaShot: return SapiaShot
      case ID.weapon.parapo: return Parapo
      case ID.weapon.parapoShockWave: return ParapoShockwave
      default: return null
    }
  }

  /**
   * 적 데이터를 가져옵니다.  
   * @param {ID} enemyId  ID 클래스가 가지고 있는 상수 값을 넣어주세요.
   * @returns {EnemyData} enemyData 클래스, 값이 없다면 null
   */
  static getEnemyData (enemyId) {
    switch (enemyId) {
      case ID.enemy.test: return TestEnemy
      case ID.enemy.testAttack: return TestAttackEnemy
      default: return null
    }
  }

  /**
   * 이펙트 데이터를 가져옵니다.  
   * ID 클래스가 가지고 있는 상수 값을 넣어주세요.
   * @param {ID} effectId 
   */
  static getEffectData (effectId) {
    switch (effectId) {
      case ID.effect.missile: return MissileEffect
      case ID.effect.parapo: return ParapoEffect
    }
  }
}

