"use strict"

import { fieldState } from "./field.js"
import { graphicSystem } from "./graphic.js"
import { imageDataInfo, imageFile } from "./image.js"
import { soundFile, soundSystem } from "./sound.js"

/**
 * 공통적으로 사용하는 객체 ID
 * ID 값은 서로 달라야 합니다. (사람이 실수한게 아니라면...)
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
    blaster:10007,
    sidewave:10008,
  }

  static playerSkill = {
    unused:0,
    skillNumberStart:15000,
    multyshot:15001,
    missile:15002,
    arrow:15003,
    laser:15004,
    sapia:15005,
    parapo:15006,
    blaster:15007,
    sidewave:15008,
  }

  static weapon = {
    unused:0,
    multyshot:11010,
    missile:11020,
    missileRocket:11021,
    arrow:11030,
    laser:11040,
    laserBlue:11041,
    sapia:11050,
    sapiaShot:11051,
    parapo:11060,
    parapoShockWave:11061,
    blaster:11070,
    blasterMini:11071,
    sidewave:11080,

    // skill
    skillMultyshot:16001,
    skillMissile:16002,
    skillArrow:16003,
    skillLaser:16004,
    skillSapia:16005,
    skillParapo:16006,
    skillBlaster:16007,
    skillSidewave:16008,
  }
  
  static enemy = {
    unused:0,
    test:20001,
    testAttack:20002,
    testShowDamageEnemy:20003,
    spaceEnemyLight: 20101,
    spaceEnemyRocket: 20102,
    spaceEnemyCar: 20103,
    spaceEnemySquare: 20104,
    spaceEnemyAttack: 20105,
    spaceEnemyEnergy: 20106,
    spaceEnemySusong: 20107,
    spaceEnemyGamjigi: 20108,
    spaceEnemyComet: 20109,
    spaceEnemyMeteorite: 20110,
  }

  static effect = {
    missile:40000,
    parapo:40001,
    skillMissile:40002,
    skillParapo:40003,
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
    image = null, silceStartX = 0, silceStartY = 0, frameWidth = 0, frameHeight = 0, 
    frameCount = 0, frameDelay = 1, frameRepeat = 1, 
    outputWidth = frameWidth, outputHeight = frameHeight) {
    /** 이미지 */ this.image = image
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

  /** 
   * 에니메이션 출력 함수 (반드시 출력할 좌표를 입력해 주세요!)  
   * 경고: 에니메이션 프레임은 고정된 크기를 사용합니다. 가변적인 크기를 사용하면 버그가 발생할 수 있음.
   * @param {number} x 출력할 에니메이션의 x좌표
   * @param {number} y 출력할 에니메이션의 y좌표
   */
  display (x, y) {
    // 이미지가 없는데 출력을 할 수 없잖아요!
    if (this.image == null) return

    if (x == null || y == null) {
      // 의도적인 버그 방지용 경고 문구
      console.warn('좌표가 입력되지 않았습니다. 에니메이션 출력은 무시됩니다.')
      return
    }

    // 자른 프레임 번호
    // 진행된 프레임이 최대 프레임 이상일 때(에니메이션이 무한 반복 한 경우), 나머지 계산을 해서 어느 프레임 번호를 출력해야 할지를 결정합니다.
    let sliceFrame = this.elapsedFrame % this.frameCount
    
    // 라인 최대 프레임 (한 줄에 몇개의 프레임이 있을 수 있는가?)
    // 참고: 조심해야 할 것은, 다음 줄로 넘어갈 때, 0좌표가 아닌 sliceStartX에서부터 시작합니다.
    // 즉 다음 줄로 넘어갈 때, 맨 왼쪽부터 프레임 위치를 계산하는게 아니고 시작지점부터 출력 위치를 계산합니다.
    let lineMaxFrame = Math.floor((this.image.width - this.sliceStartX) / this.frameWidth)

    // 자른 프레임 라인, 이미지의 Y좌표를 어디서부터 잘라야 할 지를 결정합니다.
    // 프레임이 여러 줄로 배치되어있을 때, 몇번째 줄의 프레임을 가져올 것인지 결정합니다.
    // 한 줄에 10개가 있고, 총 프레임이 20일때, 슬라이스 프레임이 13이면, 슬라이스 라인은 1이 됩니다.
    // 다만, 크기를 이용해서 예측하기 때문에 한줄로 나열하지 않거나 크기가 불규칙하면 버그가 생김.
    let sliceLine = Math.floor(sliceFrame / lineMaxFrame)

    // 이미지 파일 내부에서 가져올 프레임 위치 계산
    let sliceX = this.sliceStartX + (sliceFrame * this.frameWidth) % this.image.width
    let sliceY = this.sliceStartY + (sliceLine * this.frameHeight)

    // 이미지 출력
    graphicSystem.imageDisplay(this.image, sliceX, sliceY, this.frameWidth, this.frameHeight, x, y, this.outputWidth, this.outputHeight)
  }

  /**
   * 생각해보니, 프로세스(처리)와 디스플레이(출력)을 한꺼번에 하는게 더 좋겠네요.
   * 이 기능은 process 함수의 기능과 display 함수의 기능을 수행합니다.  
   * display 역할을 수행해야 하므로 반드시 출력할 x, y좌표를 입력해 주세요!  
   * 참고: 이 함수는 display 쪽에서 사용해야 합니다. (data 내부의 로직과 관계 없으므로.)
   * @param {number} x 출력할 에니메이션의 x좌표
   * @param {number} y 출력할 에니메이션의 y좌표
   */
  displayAndProcess (x, y) {
    // 참고: 함수 이름은 display쪽에서 사용하라고 의도적으로 displayAnd... 로 지었습니다.
    // 다만, 실제 처리는, process를 먼저 진행하고 출력합니다.
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
    /** 이동 방향에 따른 이동 속도 x좌표 (소수점 허용) 이 값이 있다면, 이 값을 speed값보다 우선 적용(정확하겐 speed에 덮어 씌워짐) */ this.moveSpeedX = 0
    /** 이동 방향에 따른 이동 속도 y좌표 (소수점 허용) 이 값이 있다면, 이 값을 speed값보다 우선 적용(정확하겐 speed에 덮어 씌워짐) */ this.moveSpeedY = 0
    /** 회전한 각도 (일부 객체에서만 사용) */ this.degree = 0
    /** 
     * 이동 방향 설정은 가급적, setMoveDirection 함수를 사용하는것을 권장합니다. (이 변수를 바꿔도 되지만, 안정성이 떨어짐)
     * 이동 방향 설정(left, right만 사용 가능) 이 값은 x축에만 영향을 줌, 기본값: left 
     * left: + 일경우 왼쪽으로 이동, - 일경우 오른쪽으로 이동.   
     * right: + 일경우 오른쪽으로 이동, - 일경우 왼쪽으로 이동.  
     * 아무 값도 없다면 이 값을 적용하지 않음.
     * @type {string}
     */
    this.moveDirectionX = 'right'
    
    /**
     * 이동 방향 설정은 가급적, setMoveDirection 함수를 사용하는것을 권장합니다. (이 변수를 바꿔도 되지만, 안정성이 떨어짐)
     * 이동 방향 설정(up. down만 사용 가능) 이 값은 y축에만 영향을 줌. 기본값: down  
     * up: + 일경우 위쪽으로 이동, - 일경우 아래쪽으로 이동  
     * down: + 일경우 아래쪽으로 이동, - 일경우 위쪽으로 이동  
     * @type {string}
     */
    this.moveDirectionY = 'down'

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

    /**
     * 필드 객체가 사망했을 때 사용하는 변수, 다만... 적 외에는 잘 안쓰임(특히 무기...)  
     * 이 변수는 코드 자동완성의 편의를 위해 추가했습니다.
     */
    this.isDied = false

    // 에니메이션 용도
    /** 현재까지 진행된 에니메이션의 총 프레임 */ this.enimationFrame = 0
    /** 
     * 에니메이션 객체: 이 객체는 EnimationData를 생성하여 이용합니다.
     * @type {EnimationData}
     */ 
    this.enimation = null

    /**
     * HTML 이미지  
     * 참고: 이미지는 보통 출력 용도로 사용
     * @type {Image | ImageBitmap}
     */
    this.image = null

    /**
     * 이미지 데이터, 이 값은 특수한 경우에 주로 사용[여러개의 오브젝트가 그려져있는 이미지를 자를 때 주로 사용]
     * @type {{x: number, y: number, width: number, height: number, frame: number}} ImageData의 변수값
     */
    this.imageData = null
  }

  /**
   * 이동 방향 설정, x축, y축 동시 설정 가능, 이동 방향을 없앨거면, 공백 '' 을 넣어주세요.
   * @param {string} xDirection x축 방향, 'left', 'right', ''(방향 없음) 사용 가능
   * @param {string} yDirection y축 방향, 'up', 'down', ''(방향 없음) 사용 가능
   */
  setMoveDirection (xDirection = '', yDirection = '') {
    if (xDirection === '' || xDirection === 'left' || xDirection === 'right') {
      this.moveDirectionX = xDirection
    }

    if (xDirection === '' || yDirection === 'up' || yDirection === 'down') {
      this.moveDirectionY = yDirection
    }
  }

  /** 
   * 오브젝트의 로직 처리 함수 (각 객체마다 다를 수 있고, 이것은 기본적인 기능만 있습니다.)
   */ 
  process () {
    this.processMove()

    // 캔버스의 영역을 크게 벗어나면 해당 객체는 자동으로 삭제요청을 합니다. 
    // isDeleted 가 true라면, fieldState에서 해당 객체를 삭제합니다.
    if (this.outAreaCheck()) {
      this.isDeleted = true
    }
  }

  /**
   * 객체를 이동시킵니다.
   */
  processMove () {
    // 이동 방향이 정해져 있는 경우, 방향에 따른 속도값을 speed에 대입합니다.
    // 이동 방향이 없다면, speed값을 그대로 이동속도에 사용합니다.
    if (this.moveDirectionX === 'left') {
      this.speedX = -Math.abs(this.moveSpeedX)
    } else if (this.moveDirectionX === 'right') {
      this.speedX = Math.abs(this.moveSpeedX)
    }

    if (this.moveDirectionY === 'up') {
      this.speedY = -Math.abs(this.moveSpeedY)
    } else if (this.moveDirectionY === 'down') {
      this.speedY = Math.abs(this.moveSpeedY)
    }

    // 이동 속도에 따른 좌표값 변경
    this.x += this.speedX
    this.y += this.speedY
  }


  /** 
   * 오브젝트의 이미지 출력 함수 (각 객체마다 다름, 직접 구현 필요)  
   * 이 함수는 기본값이 존재하지만, 만약 display() 재정의로 이 기본함수를 사용할 수 없게 된다면, 
   * display() 함수를 재작성 할 때 FildData 클래스의 함수인 defaultDisplay() 를 사용해주세요.
   */ 
  display () {
    if (this.enimation) { // 에니메이션이 있는 경우 (이 경우에는 이미지 출력이 무시됨.)
      this.enimation.displayAndProcess(this.x, this.y)
    } else if (this.image) { // 이미지가 있는 경우
      graphicSystem.imageDisplay(this.image, this.x, this.y)
    }
    // 두개 다 없으면 아무것도 안보임.
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
    if (this.x < -graphicSystem.CANVAS_WIDTH 
    || this.x > graphicSystem.CANVAS_WIDTH * 2 
    || this.y < -graphicSystem.CANVAS_HEIGHT
    || this.y > graphicSystem.CANVAS_HEIGHT * 2) {
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
  }

  /**
   * 만약 이런저런 상속으로 인해서, fieldData가 가지고 있는 display함수를 사용하고 싶다면, 이 static 함수를 사용하세요.  
   * display 함수를 재작성한 후, defaultDisplay() 함수를 실행하면 됩니다. (인수는 필요 없음.)
   */
  defaultDisplay () {
    if (this.enimation) {
      this.enimation.displayAndProcess(this.x, this.y)
    } else if (this.image) {
      if (this.imageData) {
        graphicSystem.imageDisplay(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
      } else {
        graphicSystem.imageDisplay(this.image, this.x, this.y)
      }
    }
  }
}

class WeaponData extends FieldData {
  constructor () {
    super()
    /** 공격력(해당 오브젝트의 공격력) */ this.attack = 1
    /** 해당 객체의 기본 오브젝트 타입(임의 수정 불가능) */ this.objectType = objectType.WEAPON
    /** 무기의 기본 이동 방향 x축 = 오른쪽 */ this.moveDirectionX = 'right'
    /** 무기의 기본 이동 방향 y축 = 아래쪽 */ this.moveDirectionY = 'down'
    
    // 추적 오브젝트 여부
    /** 적을 추적하는지의 여부(데이터 객체에서 주로 사용) true일경우 적을 추적하는 무기임. */ this.isChaseType = false
    /** 추적 실패 횟수: 이 숫자는 추적할 적이 없을 때 과도한 추적 알고리즘 사용을 막기 위해 실행됨. */ this.chaseMissCount = 0
    /** 
     * 필드객체에서 사용하는 변수, 어떤 적을 추적하는지를 객체로 가져옴  
     * @type {EnemyData} 
     */ 
    this.targetObject = null

    /** 
     * 공격 반복 횟수: 적을 여러번 때리거나, 또는 여러번 공격할 때 사용, 기본값: 1  
     * 경고: 기본값 0이라면, 공격횟수가 0인 것으로 취급해 무기가 즉시 사라질 수 있음.
     */ 
    this.repeatCount = 1
    
    /** 
     * 반복 딜레이 객체(딜레이가 없으면 null)  
     * @type {DelayData}
     */ 
    this.repeatDelay = null

    /**
     * 무기를 사용한 횟수: repeatCount랑 다른 점은, repeatCount는 적을 타격하면 남은 반복횟수가 감소하지만,  
     * 이것은 무기가 공격하면 사용카운트가 증가합니다.
     */
    this.useCount = 0

    /**
     * 무기 최대 사용 카운트, 일반적으로 사용하지 않는 변수라, 기본값은 0
     */
    this.useMaxCount = 0

    /** 
     * 한번 공격에 적을 여러개 때릴 수 있는지에 대한 여부  
     * 스플래시 형태의 공격이 아니라면 이 값은 false입니다.
     * 자세하게 말하면 스플래시, 충격파의 경우 동시에 여러 적을 때리므로 true입니다.  
     * 그러나 관통은 동시에 여러 적을 때리긴 하지만 스플래시 공격이 아니라, 
     * 무기가 한번 타격하면 공격횟수를 소모하므로 따라서 false입니다.  
     * @type {boolean}
     */ 
    this.isMultiTarget = false

    /** 
     * 멀티타겟인경우 한번 공격당 최대 타겟 제한 수: 기본값 20, -1일경우 무제한
     * 멀티타겟이 아닐경우, 공격 시도한 해당 프레임의 동시 공격 제한 수
     * @type {number}
     */ 
    this.maxTarget = 20
  }

  /**
   * 무기의 처리 프로세스  
   * 이 함수는 임의로 수정하지 마세요. Weapon 객체가 공통으로 사용해야 합니다.
   */
  process () {
    this.processMove()
    this.processChase()
    this.processAttack()
    this.processDeleteCheck()
  }

  /**
   * 정해진 조건이 되면 무기를 삭제합니다.
   */
  processDeleteCheck () {
    // 무기가 정상적으로 처리되지 않고 오랫동안 남아있을 때를 대비해 삭제하는 요소
    // 그리고 남은 반복 횟수가 0이하인 경우는 해당 무기를 사용할 수 없으므로 삭제됨
    if (this.repeatCount <= 0 || this.elapsedFrame >= 360) {
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
   * @param {FieldData} hitedTarget 총돌하여 데미지를 받을 객체(반드시 적일 필요는 없음.)
   */
  damageProcess (hitedTarget) {
    // 기본적으로 무기와 적의 충돌은 무기의 공격력 만큼 적의 체력을 감소합니다.
    let damage = this.attack
    if (damage < 1) {
      damage = 1
    }

    hitedTarget.hp -= damage
    fieldState.createDamageObject(hitedTarget.x, hitedTarget.y, damage)
  }

  /**
   * 무기는 적 오브젝트를 공격합니다. processAttack 함수는 무기가 적을 공격하기 위한 로직을 작성합니다.  
   * 이 함수에서 공격횟수를 소모하고, 적을 공격하기 위해서는 이 함수 내부에서 hitObjectProgress를 사용해야 합니다.
   */
  processAttack () {
    this.processHitObject()
  }

  /**
   * 해당 무기 판정에 따른, 정해진 공격 범위를 기준으로 공격된 적들을 확인하는 함수입니다.  
   * 기본적으로 무기는 충돌 처리 후 적을 때린 시점에서 반복횟수가 감소하여 나중에 자동으로 삭제됩니다.  
   * 다만 공격방식이 좀 다른 무기들은, 로직 처리가 약간 다릅니다. 스플래시는 공격 1회당 반복횟수가 1회 감소하고, 
   * 일반 무기는 타격 1회당 반복횟수가 1회 감소합니다. [예를 들어 미사일은 8번 공격하지만, 레이저는 20번 타격, 멀티샷은 1회 타격]  
   * 모든 반복횟수를 소모하였다면, 무기는 process함수에서 자동으로 삭제됩니다.
   * 참고로 공격범위가 지정되지 않으면, 현재 무기의 객체 범위를 그대로 사용합니다.
   * @param {{x: number, y: number, width: number, height: number}} attackArea 공격 범위
   */
  processHitObject (attackArea = {x: this.x, y: this.y, width: this.width, height: this.height}) {
    let enemyObject = fieldState.getEnemyObject() // 적 오브젝트
    let hitCount = 0 // 적을 총 때린 횟수

    if (this.isMultiTarget) {
      // 멀티타겟인 경우, 한번 공격당 무기의 repeatCount 1회 감소
      this.repeatCount--

      // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
      for (let i = 0; i < enemyObject.length; i++) {
        let currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
        if (currentEnemy.isDied) continue // 적이 죽은경우 무시

        // 각각의 적마다 충돌 검사
        if (collision(attackArea, currentEnemy)) {
          // 충돌한 경우, 충돌한 상태에서의 로직을 처리
          this.damageProcess(currentEnemy)
          hitCount++ // 적을 때린 횟수 1회 증가

          // 만약 적을 때린 횟수가 최대 제한을 초과하면 함수 종료
          if (hitCount >= this.maxTarget) {
            return
          }
        }
      }
    } else {
      // 멀티타겟이 아닌 경우, 기본적으로 무기는 1개체당 1대를 때릴 수 있음. (repeatCount가 있다면 그 횟수만큼 적을 때림)
      
      // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
      for (let i = 0; i < enemyObject.length; i++) {
        let currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
        if (currentEnemy.isDied) continue // 적이 죽은경우 무시

        // 각각의 적마다 충돌 검사
        if (collision(attackArea, currentEnemy)) {
          // 충돌한 경우, 충돌한 상태에서의 로직을 처리
          this.damageProcess(currentEnemy)
          hitCount++ // 적을 때린 횟수 1회 증가
          this.repeatCount-- // 만약 적을 때렸다면, 무기의 반복 횟수를 감소시킵니다.

          // 만약 적을 때린 횟수가 최대 제한을 초과하면 또는 repeatCount가 0이면 함수 종료
          if (hitCount >= this.maxTarget || this.repeatCount <= 0) {
            return
          }
        }
      }
    }
  }

  /**
   * 무기에 타겟이 존재할 때, 해당 타켓이랑 충돌했는지 확인합니다.
   * @param {{x: number, y: number, width: number, height: number}} attackArea 
   */
  targetEnemyHitedCheck (attackArea = {x: this.x, y: this.y, width: this.width, height: this.height}) {
    if (this.targetObject) {
      if (collision(attackArea, this.targetObject)) {
        return true
      }
    }

    return false
  }

  /**
   * 적이 무기와 충돌했는지 확인. 데미지 처리는 하지 않습니다.
   * @param {{x: number, y: number, width: number, height: number}} attackArea 공격 범위
   * @returns {boolean}
   */
  enemyHitedCheck (attackArea = {x: this.x, y: this.y, width: this.width, height: this.height}) {
    let enemyObject = fieldState.getEnemyObject() // 적 오브젝트 가져오기

    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
      if (currentEnemy.isDied) continue // 적이 죽은경우 무시

      // 각각의 적마다 충돌 검사
      // 적들 중 하나라도 충돌했다면, true
      if (collision(attackArea, currentEnemy)) {
        return true
      }
    }

    // 어떠한 적도 충돌하지 않았다면 false
    return false
  }

  /**
   * 무기랑 충돌한 모든 적 객체를 가져옵니다. (최대개수가 정해지지 않은경우 해댕하는 모든 객체를 가져옴)
   * @param {{x: number, y: number, width: number, height: number}} attackArea 공격 범위
   * @param {number} maxCount 최대 개수
   * @returns {EnemyData[]}
   */
  getEnemyHitObject (attackArea = {x: this.x, y: this.y, width: this.width, height: this.height}, maxCount = -1) {
    let hitEnemyList = []
    let enemyObject = fieldState.getEnemyObject() // 적 오브젝트 가져오기

    for (let i = 0; i < enemyObject.length; i++) {
      let currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
      if (currentEnemy.isDied) continue // 적이 죽은경우 무시

      // 각각의 적마다 충돌 검사
      // 적들 중 하나라도 충돌했다면, true
      if (collision(attackArea, currentEnemy)) {
        hitEnemyList.push(currentEnemy)
        if (maxCount >= 0 && hitEnemyList.length >= maxCount) {
          break // for문 종료
        }
      }
    }

    // 어떠한 적도 충돌하지 않았다면 false
    if (hitEnemyList.length >= 1) {
      return hitEnemyList
    } else {
      return null
    }
  }

  /**
   * 이 함수는, OBB 충돌 감지를 할 때 사용하는 함수입니다.  
   * hitObject가 두 종류로 나뉘어진건, OBB충돌범위에 몇가지 정보가 더 필요하기 때문입니다.
   * @param {{x: number, y: number, width: number, height: number, degree: number}} attackArea 공격 범위
   */
  processHitObjectOBBCollision (attackArea = null) {
    let enemyObject = fieldState.getEnemyObject() // 적 오브젝트
    let hitCount = 0 // 적을 총 때린 횟수
    if (attackArea == null) return

    if (this.isMultiTarget) {
      // 멀티타겟인 경우, 한번 공격당 무기의 repeatCount 1회 감소
      this.repeatCount--

      // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
      for (let i = 0; i < enemyObject.length; i++) {
        let currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
        if (currentEnemy.isDied) continue // 적이 죽은경우 무시

        // 각각의 적마다 충돌 검사
        if (collisionClass(attackArea, currentEnemy)) {
          // 충돌한 경우, 충돌한 상태에서의 로직을 처리
          this.damageProcess(currentEnemy)
          hitCount++ // 적을 때린 횟수 1회 증가

          // 만약 적을 때린 횟수가 최대 제한을 초과하면 함수 종료
          if (hitCount >= this.this.maxTarget) {
            return
          }
        }
      }
    } else {
      // 멀티타겟이 아닌 경우, 기본적으로 무기는 1개체당 1대를 때릴 수 있음. (repeatCount가 있다면 그 횟수만큼 적을 때림)
      
      // 무기 객체와 해당 적 객체가 충돌했는지를 확인합니다.
       for (let i = 0; i < enemyObject.length; i++) {
        let currentEnemy = enemyObject[i] // 현재 적의 데이터(배열 코드 실수를 방지하기 위해 이런식으로 처리함.)
        if (currentEnemy.isDied) continue // 적이 죽은경우 무시

        // 각각의 적마다 충돌 검사
        if (collisionClass.collision(attackArea, currentEnemy)) {
          // 충돌한 경우, 충돌한 상태에서의 로직을 처리
          this.damageProcess(currentEnemy)
          hitCount++ // 적을 때린 횟수 1회 증가
          this.repeatCount-- // 만약 적을 때렸다면, 무기의 반복 횟수를 감소시킵니다.

          // 만약 적을 때린 횟수가 최대 제한을 초과하면 또는 repeatCount가 0이면 함수 종료
          if (hitCount >= this.maxTarget || this.repeatCount <= 0) {
            return
          }
        }
      }
    }
  }

  /**
   * 현재 타겟이 죽어있거나 삭제되었는지를 확인합니다. 다만 타겟이 없으면 무조건 false 리턴
   */
  targetDeletedOrDiedCheck () {
    if (this.targetObject) {
      if (this.targetObject.isDeleted || this.targetObject.isDied) {
        return true
      }
    }

    return false
  }

  /**
   * 추적에 관한 로직
   */
  processChase () {
    // 추적 타입이 아닌 경우 함수 종료 (아무것도 하지 않음)
    if (!this.isChaseType) return

    // 추적은 속도값을 이용해서 적을 추적하므로, 이동 방향은 정하지 않음.
    this.setMoveDirection()

    // 추적하는 오브젝트가 있을 경우
    if (this.targetObject != null) {
      // 추적하는 오브젝트가 있지만, 삭제된경우에는 해당 오브젝트를 더이상 추적하지 않고 함수를 종료
      // 죽은 적도 더이상 추적하지 않음
      if (this.targetDeletedOrDiedCheck()) {
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

    // 각 타겟의 이동 속도값(절대값으로 얻음)
    let absTargetSpeedX = Math.abs(this.targetObject.speedX)
    let absTargetSpeedY = Math.abs(this.targetObject.speedY)

    // 속도 보정: 적 이동속도보다 빨리 무기가 움직여야함.
    if(this.speedX <= 0 && this.speedX > -absTargetSpeedX) {
      this.speedX = -absTargetSpeedX - 1
    } else if(this.speedX > 0 && this.speedX < absTargetSpeedX) {
      this.speedX = absTargetSpeedX + 1
    }

    if(this.speedY <= 0 && this.speedY > -absTargetSpeedY) {
      this.speedY = -absTargetSpeedY - 1
    } else if(this.speedY > 0 && this.speedY < absTargetSpeedY) {
      this.speedY = absTargetSpeedY + 1
    }

    // 적과의 거리가 짧을 경우, 강제로 해당 위치로 이동합니다.
    if(Math.abs(distanceX) <= 20) {
      this.x = targetCenterX
    }

    if(Math.abs(distanceY) <= 20) {
      this.y = targetCenterY
      this.speedY = 0
    }
  }
}

class MultyshotData extends WeaponData {
  /**
   * optionList
   * 0. speedY = 0, 1. chase(추적) = flase
   */
  constructor (option = [0, false]) {
    super()
    this.mainType = 'multyshot'
    this.subType = 'multyshot'
    this.id = ID.weapon.multyshot
    this.width = 40
    this.height = 8
    this.color = 'brown'

    this.moveSpeedX = 20
    this.moveSpeedY = 0
    this.image = imageFile.weapon.multyshot

    // 옵션에 따른 추가 설정
    if (option.length === 1) {
      this.moveSpeedY = option[0]
    } else if (option.length === 2) {
      this.moveSpeedY = option[0]
      this.isChaseType = option[1]
    }

    // 옵션에 따른 색깔 설정
    if (this.isChaseType) {
      this.color = 'blue' // 추적 타입은 무조건 파랑색
    } else if (this.moveSpeedY === 0) {
      this.color = 'brown' // y축 속도가 0이면 갈색
    } else {
      this.color = 'green' // y축 속도가 있으면 초록색
    }
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

class MissileData extends WeaponData {
  constructor () {
    super()
    this.mainType = 'missile'
    this.subType = 'missileA'
    this.id = ID.weapon.missile
    this.isChaseType = true
    this.width = 40
    this.height = 20
    this.movespeedX = 12
    this.repeatCount = 5
    this.repeatDelay = new DelayData(6)
    this.isMultiTarget = true
    this.maxTarget = 100
    this.state = 'normal'
    this.enimation = new EnimationData(imageFile.weapon.missile, 0, 0, 40, 20, 8, 2, -1)
    this.splashEffectId = ID.effect.missile
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
      this.enimation.displayAndProcess(this.x, this.y)
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
  }

  /**
   * 일반 공격에 대한 처리, 아무나 적을 타격하는 순간 스플래시 모드로 변경
   */
  processAttackNormal () {
    if (this.enemyHitedCheck()) {
      this.state = 'splash'
      this.speedX = 0
      this.speedY = 0
      this.isChaseType = false
    }
  }

  /**
   * 스플래시 공격에 대한 로직 처리
   */
  processAttackSplash () {
    let splashArea = this.getSplashArea()
    fieldState.createEffectObject(this.splashEffectId, splashArea.x, splashArea.y)
    this.processHitObject(splashArea)
  }
}

class MissileRocket extends MissileData {
  /**
   * option list
   * 0. speedY
   */
  constructor (option = [2]) {
    super()
    this.subType = 'missileRocket'
    this.id = ID.weapon.missileRocket
    this.isChaseType = false
    this.width = 40
    this.height = 20
    this.moveSpeedX = 12
    this.moveSpeedY = -2
    this.state = 'splashB'
    this.repeatCount = 6
    this.repeatDelay = new DelayData(8)
    this.enimation = new EnimationData(imageFile.weapon.missileB, 0, 0, 40, 20, 6, 2, -1)

    // 무기에 따른 옵션 설정
    if (option.length === 1) {
      this.moveSpeedY = option[0]
    }
  }

  processAttack () {
    if (this.repeatDelay.check()) {
      this.processAttackSplash()
    }
  }

  display () {
    if (this.enimation) {
      this.enimation.displayAndProcess(this.x, this.y)
    }
  }
}

class Arrow extends WeaponData {
  /**
   * option list  
   * 0. movespeedY (참고: 이 값이 음수면 갈색이고, 양수면 초록색입니다.)
   */
  constructor (option = [2]) {
    super()
    this.mainType = 'bounce'
    this.subType = 'arrow'
    this.id = ID.weapon.arrow
    this.movespeedY = 4
    this.movespeedX = 17
    this.width = 20
    this.height = 20
    this.bounceMaxCount = 6
    this.bounceCount = 0
    this.enimation = null
    this.color = 'brown'

    // 무기에 따른 옵션 설정
    if (option.length === 1) {
      if (option[0] < 0) {
        this.color = 'brown'
        this.enimation = new EnimationData(imageFile.weapon.arrow, 0, 0, 20, 20, 7, 4, -1)
        this.movespeedY = option[0]
      } else if (option[0] > 0) {
        this.color = 'green'
        this.enimation = new EnimationData(imageFile.weapon.arrow, 0, 20, 20, 20, 7, 4, -1)
        this.movespeedY = option[0]
      }
    }
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
      this.movespeedX = Math.abs(this.movespeedX)
      this.bounceCount++
    } else if (this.x > graphicSystem.CANVAS_WIDTH) {
      this.x = graphicSystem.CANVAS_WIDTH
      this.movespeedX = -Math.abs(this.movespeedX)
      this.bounceCount++
    }

    if (this.y < 0) {
      this.y = 0
      this.movespeedY = Math.abs(this.movespeedY)
      this.bounceCount++
    } else if (this.y > graphicSystem.CANVAS_HEIGHT) {
      this.y = graphicSystem.CANVAS_HEIGHT
      this.movespeedY = -Math.abs(this.movespeedY)
      this.bounceCount++
    }

    // 바운스 횟수가 바운스 최대 횟수 이상이라면 해당 무기는 삭제됩니다.
    // 다만, 로직 처리상 즉시 삭제는 안되고, 프로세스가 모두 끝나야 삭제할 수 있습니다.
    if (this.bounceCount > this.bounceMaxCount) {
      this.isDeleted = true
    }
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
    this.movespeedX = this.baseSpeed
    this.movespeedY = 0
    this.baseWidth = 160
    this.baseHeight = 80
    this.width = 160
    this.height = 20
    this.repeatCount = 5
    this.moveDirectionX = 'right'
    this.image = imageFile.weapon.laser
    this.repeatDelay = new DelayData(2)
  }

  processAttack () {
    // 2프레임당 한번만 공격함. 따라서 반복 대기시간이 넘어가지 않는다면, 함수 강제 종료.
    if (!this.repeatDelay.check()) return

    this.processHitObject()
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

    let laserAreaOBB

    // 레이저 공격에 따른 영역 설정
    if ( 
      (this.xDirection === 'right' && this.yDirection === 'up') ||
      (this.xDirection === 'left' && this.yDirection === 'down') ) {
      laserAreaOBB = {
        x: this.x,
        y: this.y,
        width: this.baseWidth,
        height: this.baseHeight,
        degree: 135
      }
    } else if (
      (this.xDirection === 'right' && this.yDirection === 'down') ||
      (this.xDirection === 'left' && this.yDirection === 'up')) {
      laserAreaOBB = {
        x: this.x,
        y: this.y,
        width: this.baseWidth,
        height: this.baseHeight,
        degree: 45
      }
    }

    this.processHitObjectOBBCollision(laserAreaOBB)
  }

  processMove () {
    // X축 방향을 살펴보면서, X축 방향에 따른 속도를 변경합니다.
    if (this.xDirection === 'left') {
      this.movespeedX = -this.baseSpeed
    } else if (this.xDirection === 'right') {
      this.movespeedX = this.baseSpeed
    } else {
      this.movespeedX = 0
    }

    // Y축도 마찬가지
    if (this.yDirection === 'up') {
      this.movespeedY = -this.baseSpeed
    } else if (this.yDirection === 'down') {
      this.movespeedY = this.baseSpeed
    } else {
      this.movespeedY = 0
    }

    // 단, X축과 Y축 모두 멈춰있을 경우, 레이저는 강제로 오른쪽 방향으로 이동합니다.
    // 여기서는 방향 변경 카운트를 세진 않음.
    if (this.movespeedX === 0 && this.movespeedY === 0) {
      this.xDirection = 'right'
      this.movespeedX = this.baseSpeed
    }

    // 레이저는 이동할 때, centerX, centerY(중심 위치)를 기준으로 이동합니다.
    // 따라서, 이 값을 기준으로 위치를 정한 다음, x, y의 위치를 재조정합니다.
    // 바꿔말하면, x, y좌표를 직접 이동시키는게 아니라 간접 이동시키는 원리입니다.
    if (this.laserCenterX === 0 && this.laserCenterY === 0) {
      this.laserCenterX = this.x + (this.width / 2)
      this.laserCenterY = this.y + (this.height / 2)
    }

    this.laserCenterX += this.movespeedX
    this.laserCenterY += this.movespeedY
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
    const scopeSize = 4 // 레이저의 대략적인 추적 범위
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
  /**
   * option list  
   * 0. sapiaShotAttack 사피아샷의 공격력
   */
  constructor (option = [352]) {
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
    this.sapiaShotAttack = option = [100]
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
   * 감지 범위 얻기
   */
  getDetectArea () {
    return {
      x: this.x - 300,
      y: this.y - 200,
      width: 600,
      height: 400
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
      if (this.targetObject.isDeleted || this.targetObject.isDied) {
        this.targetObject = null
        return
      }
    } else {
      // targetObject가 없다면, 새로운 적을 찾음
      let enemyObject = fieldState.getEnemyObject()

      // 감지 범위
      let detectArea = this.getDetectArea()

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
    this.movespeedX = 0
    this.movespeedY = 0
  }

  processMove () {
    // 이동 속도 강제 지정
    // 생성자에서 하지 않는 이유는, 현재 좌표값을 생성 당시에는 모르기 때문
    // 대신에, movespeedX와 movespeedY를 0으로 초기화한 것으로, 이동 속도가 없을 때,
    // 적과 사피아샷의 위치를 기준으로 이동속도 설정
    if (this.movespeedX === 0 && this.movespeedY === 0) {
      this.movespeedX = (this.targetX - this.x) / 20
      this.movespeedY = (this.targetY - this.y) / 20
      let minSpeed = 10 // 최소 이동속도(절댓값, 부호 무시)

      // 만약 한쪽 방향이라도 속도가 minSpeed이하라면 (절댓값으로 계산, 부호 무시)
      if (Math.abs(this.movespeedX) <= minSpeed || Math.abs(this.movespeedY) <= minSpeed) {
        // 두개 모두 속도가 3 이상이 될 때까지, 나누기 속도값을 1씩 내려서 반복하여 계산
        // 다만, diviedSpeed가 1 이하면, 그냥 대충 대입하고 끝냄 (? 1나누기면 어차피 직접 적에게 닿는거 아님?)
        for (let divideSpeed = 20; divideSpeed >= 2; divideSpeed--) {
          this.movespeedX = (this.targetX - this.x) / divideSpeed
          this.movespeedY = (this.targetY - this.y) / divideSpeed
          if(Math.abs(this.movespeedX) > minSpeed || Math.abs(this.movespeedY) > minSpeed) break
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
    this.image = imageFile.weapon.parapo
    this.id = ID.weapon.parapo
    this.width = 45
    this.height = 20
    this.isChaseType = true
    this.enimation = new EnimationData(this.image, 0, 0, this.width, this.height, 14, 2, -1)
  }
  
  processAttack () {
    let hitEnemyList = this.getEnemyHitObject(undefined, 1)
    if (hitEnemyList) {
      /*
      * 적이랑 충돌했을 때, 충격파 추가로 발사
      * 충격파는, 적의 중심 위치를 기준으로 4개의 방향으로 타격합니다.
      * 파라보 자체의 데미지는 없음. (공격력만 있고, 충격파로 데미지를 줌)
      * 좌표값 상세 [참고: c -> enemy center]
      * left: (cx - 100, cy - 50), right: (cx, cy - 50)
      * up: (cx - 50, cy - 100), down: (cx - 50, cy)
      */
      let hitEnemy = hitEnemyList[0]
      let enemyCenterX = hitEnemy.x + (hitEnemy.width / 2)
      let enemyCenterY = hitEnemy.y + (hitEnemy.height / 2)
      let shockWaveSize = 100
      let shockWaveSizeHalf = shockWaveSize / 2
      fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX - shockWaveSize, enemyCenterY - shockWaveSizeHalf, this.attack, 'left')
      fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX, enemyCenterY - shockWaveSizeHalf, this.attack, 'right')
      fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX - shockWaveSizeHalf, enemyCenterY - shockWaveSize, this.attack, 'up')
      fieldState.createWeaponObject(ID.weapon.parapoShockWave, enemyCenterX - shockWaveSizeHalf, enemyCenterY, this.attack, 'down')
      this.repeatCount--
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
    this.width = 100
    this.height = 100
    this.movespeedX = 0
    this.movespeedY = 0
    this.moveDirectionX = option[0]
    this.isChaseType = false // 이 무기는 움직이지 않기 때문에 적을 추적하지 않습니다.
    this.isMultiTarget = true // 스플래시처럼 다수 타격
    this.maxTarget = 4
  }

  processAttack () {
    this.repeatCount--
    fieldState.createEffectObject(ID.effect.parapo, this.x, this.y, 0, 0, this.moveDirectionX)
    this.processHitObject()
  }

  display () {
    // 아무것도 보여주지 않음.
  }
}

class Blaster extends WeaponData {
  constructor () {
    super()
    this.mainType = 'blaster'
    this.subType = 'blaster'
    this.width = 36
    this.height = 36
    this.image = imageFile.weapon.blaster
    this.movespeedX = 24
    this.movespeedY = 0
  }

  display () {
    graphicSystem.imageDisplay(this.image, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height)
  }
}

class BlasterMini extends Blaster {
  constructor () {
    super()
    this.subType = 'blastermini'
    this.width = 18
    this.height = 18
    this.isChaseType = true
  }

  display () {
    const BLASTER_WIDTH = 36
    graphicSystem.imageDisplay(this.image, BLASTER_WIDTH, 0, this.width, this.height, this.x, this.y, this.width, this.height)
  }
}

class Sidewave extends WeaponData {
  /**
   * 옵션 목록  
   * 0. movespeedY = 0, 1. direction = 'right'
   */
  constructor (option = [0, 'right']) {
    super()
    this.mainType = 'sidewave'
    this.subType = 'sidewave'
    this.width = 12
    this.height = 60
    this.movespeedY = option[0]
    this.movespeedX = 11

    if (option.length === 2 && option[1] === 'left') {
      this.enimation = new EnimationData(imageFile.weapon.sidewave, 0, 0, this.width, this.height, 8, 5, -1)
      this.movespeedX = -this.movespeedX
    } else {
      this.enimation = new EnimationData(imageFile.weapon.sidewave, 0, this.height, this.width, this.height, 8, 5, -1)
    }
  }
}

class SkillMultyshot extends WeaponData {
  constructor () {
    // 기본적으로 skillMultyshot은 적을 추적함.
    // 다만 그외의 다른 특징 없음
    super()
    this.mainType = 'skill'
    this.subType = 'multyshot'
    this.id = ID.weapon.skillMultyshot
    this.width = 60
    this.height = 12
    this.isChaseType = true
    this.image = imageFile.weapon.skillMultyshot
  }
}

class SkillMissile extends MissileData {
  constructor () {
    super()
    this.mainType = 'skill'
    this.subType = 'missile'
    this.id = ID.weapon.skillMissile
    this.width = 60
    this.height = 30
    this.enimation = new EnimationData(imageFile.weapon.skillMissile, 0, 0, this.width, this.height, 10, 3, -1)
    this.repeatCount = 10
    this.repeatDelay = new DelayData(6)
    this.splashEffectId = ID.effect.skillMissile
  }

  getSplashArea () {
    return {
      x: this.x - 100,
      y: this.y - 100,
      width: 200,
      height: 200
    }
  }

  processAttackNormal () {
    super.processAttackNormal()

    // 스킬 무기는 적을 타격한 순간 폭발음을 사용한다. 그렇다고, attackNormal을 재작성하는것은 귀찮으므로
    // 대신 여기서 스플래시로 스테이트가 변경된 경우 적을 타격하여 스테이트가 변경된 것이므로 스킬 사운드를 출력한다.
    if (this.state === 'splash') {
      soundSystem.play(soundFile.skill.skillMissileHit)
    }
  }
}

class SkillArrow extends Arrow {
  // Arrow를 상속받아서, 그대로 옵션으로 활용
  constructor (option = [2]) {
    super(option)
    this.mainType = 'skill'
    this.subType = 'arrow'
    this.color = 'purple'
    this.id = ID.weapon.skillArrow
    this.width = 70
    this.height = 70
    this.movespeedX = 16
    this.repeatCount = 4
    this.bounceMaxCount = 12
    this.enimation = new EnimationData(imageFile.weapon.skillArrow, 0, 0, this.width, this.height, 7, 5, -1)
    this.maxTarget = 2
  }
}

class SkillLaser extends WeaponData {
  constructor () {
    super()
    this.mainType = 'skill'
    this.subType = 'laser'
    this.id = ID.weapon.skillLaser
    this.width = 800
    this.height = 200
    this.image = imageFile.weapon.skillLaser
    this.movespeedX = 0
    this.movespeedY = 0
    this.repeatCount = 60
    this.repeatDelay = new DelayData(4)
    this.isMultiTarget = true
    this.maxTarget = 50
  }

  // 이 레이저는 왼쪽에서 나온다음, x축이 0위치로 고정되고, y축은 플레이어를 따라다닙니다.
  processMove () {
    if (this.elapsedFrame <= 10) {
      this.x = -this.width + (this.width / 10 * this.elapsedFrame)
    } else {
      this.x = 0
    }

    this.y = fieldState.getPlayerObject().centerY - (this.height / 2)
  }

  processAttack () {
    // 4프레임당 한번만 공격함. 따라서 반복 대기시간이 넘어가지 않는다면, 함수 강제 종료.
    // 참고로 레이저가 화면 안으로 이동되는 동안은 타격판정 없음.
    if (this.elapsedFrame <= 10) return
    if (!this.repeatDelay.check()) return

    this.processHitObject()
  }

  display () {
    // 레이저 사라지는 효과 구현을 위해서, 알파값 변경
    // 서서히 사라지게 하는 공식? 난 모르므로, 노가다로 작성한다. (... 이게 무슨)
    let alpha = [0, 0.1, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    if (this.repeatCount < alpha.length && this.repeatCount >= 0) {
      graphicSystem.setAlpha(alpha[this.repeatCount]) // 투명값 설정
    }
    super.display()
    graphicSystem.setAlpha(1) // 투명값 해제
  }
}

class SkillSapia extends Sapia {
  constructor () {
    super()
    this.mainType = 'skill'
    this.subType = 'sapia'
    this.id = ID.weapon.skillSapia
    this.width = 100
    this.height = 100
    this.enimationSapiaRect = new EnimationData(imageFile.weapon.skillSapia, 0, 0, this.width, this.height, 5, 4, -1)
    this.enimationSapiaCircle = new EnimationData(imageFile.weapon.skillSapia, 0, this.height, this.width, this.height, 5, 4, -1)
    this.isChaseType = true
    this.repeatCount = 40
    this.useMaxCount = this.repeatCount
    this.repeatDelay = new DelayData(6)
    this.maxTarget = 4
    this.callCount = 0
  }

  /**
   * 감지 범위 얻기
   */
   getDetectArea () {
    return {
      x: this.x - 600,
      y: this.y - 300,
      width: 1200,
      height: 600
    }
  }

  processAttack () {
    // 2프레임당 한번만 공격함. 따라서 반복 대기시간이 넘어가지 않는다면, 함수 강제 종료.
    if (!this.repeatDelay.check()) return

    this.processHitObject()
    this.useCount++
    this.repeatCount = this.useMaxCount - this.useCount // 반복횟수 강제 재조정
  }

  display () {
    // 사피아 스킬은, 2종류의 에니메이션을 동시에 출력합니다.
    // 그래봤자, 네모와 동그라미를 동시에 출력하는게 전부입니다.
    if (this.enimationSapiaRect && this.enimationSapiaCircle) {
      this.enimationSapiaRect.displayAndProcess(this.x, this.y)
      this.enimationSapiaCircle.displayAndProcess(this.x, this.y)
    }
  }
}

class SkillParapo extends Parapo {
  constructor () {
    super()
    this.mainType = 'skill'
    this.subType = 'parapo'
    this.id = ID.weapon.skillParapo
    this.width = 240
    this.height = 240
    this.isChaseType = true
    this.movespeedX = 4
    this.movespeedY = 0
    this.state = 'normal'
    this.repeatCount = 1 // 참고: 이 스킬은 파라포 무기와 다르게 반복횟수가 1입니다.
    this.maxTarget = 16
    this.isMultiTarget = true
  }

  processMove () {
    if (this.targetObject) {
      this.x = this.targetObject.x + (this.targetObject.width / 2)
      this.y = this.targetObject.y + (this.targetObject.height / 2)
    }
  }

  processAttack () {
    // 파라포스킬은 무기가 적에게 닿았다면 충격파 공격을 시도합니다.
    // 기존 파라포 무기는 이 역할이 나뉘어져있으나, 파라포 스킬은 미사일처럼 충격파와 일반 공격 기능이 합쳐져 있습니다.
    // 다만 추적중인 적이 있고, 그 추적중인 적이랑 충돌했다면 즉시 충격파를 발사합니다.
    
    if (this.state === 'normal') {
      this.processAttackNormal()
    } else if (this.state === 'shockwave') {
      this.processAttackShockwave()
    }
  }

  processAttackNormal () {
    if (this.enemyHitedCheck()) {
      this.state = 'shockwave'
    }
  }

  processAttackShockwave () {
    // 적 객체 얻어오기
    soundSystem.play(soundFile.skill.skillParapoHit) // 타격 사운드
    
    // 충격파 범위
    let shockwaveArea = { 
      x: this.x - (this.width / 2),
      y: this.y - (this.height / 2),
      width: this.width,
      height: this.height
    }
    if (!this.targetObject) {
      shockwaveArea.x = this.x
      shockwaveArea.y = this.y
      shockwaveArea.width = 120
      shockwaveArea.height = 120
    }

    // 충격파 이펙트
    fieldState.createEffectObject(ID.effect.skillParapo, shockwaveArea.x, shockwaveArea.y)
    this.processHitObject(shockwaveArea) // 적 충돌 처리
  }

  display () {
    // 아무것도 안보임
  }
}

class SkillBlaster extends Blaster {
  constructor () {
    super()
    this.mainType = 'skill'
    this.subType = 'blaster'
    this.id = ID.weapon.skillBlaster
    this.width = 36
    this.height = 36
    this.image = imageFile.weapon.skillBlaster
    this.movespeedX = 32

    // 희한하게도, 이 무기는 직선에서 약간 벗어나있음.
    this.movespeedY = -0.2 + Math.random () * 0.4
  }

  display () {
    this.defaultDisplay()
  }
}

class SkillSidewave extends Sidewave {
  constructor (option = [0, 'right']) {
    super()
    this.mainType = 'skill'
    this.subType = 'blaster'
    this.id = ID.weapon.skillSidewave
    this.movespeedX = 22
    this.movespeedY = option[0]
    this.width = 36
    this.height = 120
    this.enimation = new EnimationData(imageFile.weapon.skillSidewave, 0, 0, this.width, this.height, 5, 6, -1)
  }
}

/**
 * 플레이어 무기 데이터 
 * 참고: 기본 스펙은 다음과 같습니다.  
 * 1초당 100% 공격력이 기준값  
 * 나머지 무기는 이 공격력 %를 바꿈으로써 밸런스를 조절할 계획  
 * 경고: 저 수치는 명시적인 수치이지만, create함수에서 무조건 참고하지 않을 수도 있음.
 */
 class PlayerWeaponData {
  constructor () {
    /** 
     * 샷 한번 발사에 지연시간(프레임)  
     * 해당 프레임만큼 지연 후 다음 무기를 발사 할 수 있음.
     */
    this.delay = 60

    /** 
     * 한번 무기를 발사할 때 동시에 발사되는 개수  
     * 2 이상일 경우, 동시에 2발을 발사한다는 뜻
     */ 
    this.shotCount = 1

    /** 
     * 실제 공격력 반영 배율: 기본값 1  
     * 일부 무기는 밸런스 특성상 공격력 반영 비율이 높거나 낮을 수 있음.
     * 참고: 최종 공격력은 소수점 버림하여 계산합니다.
     */ 
    this.attackMultiple = 1

    /**
     * 무기에 따른 공격횟수 (발사 횟수랑 다르고, 무기 객체가 공격하는 횟수임.)  
     * (명시적인 수치이나, 제작자의 실수로 로직과 다른 값이 명시될 수 있음.)
     */
    this.attackCount = 1
  }

  /**
   * 무기 생성 함수: 이 로직에서만 무기를 생성해 주세요.  
   * 그리고 무기 생성은 fieldState.createWeapon 함수를 사용합니다.  
   * 경고: 이 함수를 한번 사용했을 때 attackMultiple만큼 공격력을 가진 무기 객체가 발사되어야 합니다.  
   * 즉 create함수가 무기를 1개 생성한다면, 생성한 무기의 공격력의 %는 100%가 되어야 합니다.
   * @param {number} attack 플레이어의 공격력
   */
  create (attack, x, y) {}

  /**
   * 플레이어의 공격력을 기준으로 각 샷 공격력을 계산하는 함수  
   * 일반적인 경우는, 모든 샷의 공격력이 동일하지만, 일부 무기는 아닐 수도 있으며,
   * 이 경우 다른 방식으로 밸런스에 맞춰 계산해야 합니다.
   * @param {number} baseAttack 기준 공격력
   * @param {number} multiple 배율 (최종 공격력의 배율)
   */
  getShotAttack (baseAttack, multiple = 1) {
    let secondPerCount = 60 / this.delay
    let totalDivied = this.shotCount * this.attackCount
    let totalMultiple = this.attackMultiple * multiple
    let resultAttack = (baseAttack * totalMultiple) / (secondPerCount * totalDivied)
    return Math.floor(resultAttack)
  }
}

/**
 * 멀티샷: 기본 스타일 복합 무기
 */
class PlayerMultyshot extends PlayerWeaponData {
  constructor () {
    super()

    // 단순한 무기라, 따로 추가로 계산할 요소는 거의 없음
    this.delay = 10
    this.attackMultiple = 1
    this.shotCount = 6
  }

  create (attack, x, y) {
    // 샷 카운트: 6, 초당 6회 = 총 발사 수 36
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.multyshot, x, y + 10, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshot, x, y - 10, shotAttack)
    fieldState.createWeaponObject(ID.weapon.multyshot, x, y - 5, shotAttack, -3)
    fieldState.createWeaponObject(ID.weapon.multyshot, x, y + 5, shotAttack, 3)
    fieldState.createWeaponObject(ID.weapon.multyshot, x - 15, y - 15, shotAttack, 0, true)
    fieldState.createWeaponObject(ID.weapon.multyshot, x - 15, y + 15, shotAttack, 0, true)
  }
}

/**
 * 미사일: 스플래시 연타 공격
 */
class PlayerMissile extends PlayerWeaponData {
  constructor () {
    super()

    // 참고, 복잡한 무기의 경우, 해당 무기의 정보를 가져와서 계산합니다.
    // 이렇게 안하면, 나중에 밸런스 수정할 때 여러개의 코드를 수정해야 할 수도 있습니다.
    this.missile = new MissileData()
    this.missileRocket = new MissileRocket()

    this.delay = 30
    this.attackMultiple = 0.8 // 스플래시 패널티(1.0보다 낮으면 딜 효율이 감소)
    this.shotCount = 4

    // 공격 카운트: (미사일 반복 수 + 미사일B 반복 수) / 2 (단, 소수점 버림...)
    // 실제로, 미사일 반복 수는 5이고, 미사일B는 6이라... 5.5가 되어야 하나, 소수점을 버림하므로 5임.
    // 이렇게되면, 로켓은 총 데미지%에 약간 보너스가 있는셈 (미사일 대비 이론상 총데미지 120%)
    this.attackCount = Math.floor((this.missile.repeatCount + this.missileRocket.repeatCount) / 2)
  }

  create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.missile, x, y - 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.missile, x, y + 5, shotAttack)
    fieldState.createWeaponObject(ID.weapon.missileRocket, x + 10, y - 5, shotAttack, -2)
    fieldState.createWeaponObject(ID.weapon.missileRocket, x + 10, y + 5, shotAttack, 2)
  }
}

/**
 * 애로우: 벽 튕기기(화면 크기 기준)
 */
class PlayerArrow extends PlayerWeaponData {
  constructor () {
    super()
    this.delay = 10
    this.shotCount = 2
    this.attackMultiple = 1.04 // 멀티샷보다 약간 높습니다. (멀티샷보다는 적을 잘 타격하지 못할 확률이 있기 때문)
  }

  create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.arrow, x, y - 10, shotAttack, 5)
    fieldState.createWeaponObject(ID.weapon.arrow, x, y - 10, shotAttack, -5)
  }
}

/**
 * 레이저: 관통(다만, 최대 횟수 이상은 공격 불가능)
 */
class PlayerLaser extends PlayerWeaponData {
  constructor () {
    super()
    this.laser = new Laser()
    this.delay = 20
    this.shotCount = 4
    this.attackMultiple = 1
    this.attackCount = this.laser.repeatCount
  }

  create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack)
    let randomY1 = -20 + (Math.random() * 40)
    let randomY2 = -20 + (Math.random() * 40)

    fieldState.createWeaponObject(ID.weapon.laser, x, y + randomY1 + 10, shotAttack)
    fieldState.createWeaponObject(ID.weapon.laser, x, y + randomY2 - 10, shotAttack)
    fieldState.createWeaponObject(ID.weapon.laserBlue, x, y + randomY1 + 10, shotAttack)
    fieldState.createWeaponObject(ID.weapon.laserBlue, x, y + randomY2 - 10, shotAttack)
  }
}

/**
 * 사피아: 추적
 */
class PlayerSapia extends PlayerWeaponData {
  constructor () {
    super()
    this.sapia = new Sapia()
    this.delay = 40
    this.shotCount = 3
    this.attackMultiple = 1
    this.attackCount = this.sapia.repeatCount
  }
  
  create (attack, x, y) {
    // 사피아(30%) + 시파이샷(70%) 의 조합
    const shotAttack = this.getShotAttack(attack, 0.3)
    const sapiaShotAttack = this.getShotAttack(attack, 0.7)

    fieldState.createWeaponObject(ID.weapon.sapia, x, y, shotAttack, sapiaShotAttack)
    fieldState.createWeaponObject(ID.weapon.sapia, x, y, shotAttack, sapiaShotAttack)
    fieldState.createWeaponObject(ID.weapon.sapia, x, y, shotAttack, sapiaShotAttack)
  }
}

/**
 * 파라포: 충격파(스플래시랑 거의 비슷)
 */
class PlayerParapo extends PlayerWeaponData {
  constructor () {
    super()
    this.parapo = new Parapo()
    this.shockWave = new ParapoShockwave()
    this.delay = 30
    this.shotCount = 4
    this.attackMultiple = 0.9 // 스플래시 패널티 (다만 미사일보다는 패널티가 약함)

    // 공격 개수 = 파라포 반복 * 4(왼쪽, 오른쪽, 위, 아래) * 쇼크웨이브 반복
    // 공격 개수가 4배인것을 이 정보에 저장했기 때문에, 무기 알고리즘 내에서 추가적인 공격력 정보를 넣을 필요는 없습니다.
    this.attackCount = 4
  }

  create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack)

    fieldState.createWeaponObject(ID.weapon.parapo, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.parapo, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.parapo, x, y, shotAttack)
  }
}

/**
 * 블래스터: 높은 공격력 그러나 좁은 범위
 */
class PlayerBlaster extends PlayerWeaponData {
  constructor () {
    super()
    this.shotCount = 1.2
    this.delay = 6
    this.attackMultiple = 1.2 // 직선공격 한정이라 높은 공격력을 가짐, 다만 유도부분이 존재해 아주 높진 않음. 유도가 없었으면 아마 1.6이상?
  }

  create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack, 1.2)
    const miniAttack = this.getShotAttack(attack, 0.8)

    fieldState.createWeaponObject(ID.weapon.blaster, x, y - 18, shotAttack)
    fieldState.createWeaponObject(ID.weapon.blasterMini, x, y, miniAttack)
  }
}

/**
 * 사이드웨이브: 퍼지는 형태(넓은 범위?)
 */
class PlayerSidewave extends PlayerWeaponData {
  constructor () {
    super()
    this.shotCount = 8
    this.delay = 15
    this.attackMultiple = 1.1 // 멀티샷보다는 적을 잘 못때리는 무기인듯?
  }

  create (attack, x, y) {
    const shotAttack = this.getShotAttack(attack)
    // 플레이어 중앙에서 발사하게 하고 싶어, 무기를 사용할 y좌표를 30(무기의 크기)만큼 마이너스 했습니다.
    fieldState.createWeaponObject(ID.weapon.sidewave, x, y + 12 - 30, shotAttack, 2, 'right')
    fieldState.createWeaponObject(ID.weapon.sidewave, x, y + 8 - 30, shotAttack, 1, 'right')
    fieldState.createWeaponObject(ID.weapon.sidewave, x, y + 4 - 30, shotAttack, 0.5, 'right')
    fieldState.createWeaponObject(ID.weapon.sidewave, x, y - 4 - 30, shotAttack,-0.5, 'right')
    fieldState.createWeaponObject(ID.weapon.sidewave, x, y - 8 - 30, shotAttack,-1, 'right')
    fieldState.createWeaponObject(ID.weapon.sidewave, x, y - 12 - 30, shotAttack,-2, 'right')

    fieldState.createWeaponObject(ID.weapon.sidewave, x, y + 4 - 30, shotAttack, 1, 'left')
    fieldState.createWeaponObject(ID.weapon.sidewave, x, y - 4 - 30, shotAttack,-1, 'left')
  }
}

/**
 * 플레이어 스킬 데이터
 */
class PlayerSKillData {
  constructor () {
    /**
     * 스킬의 공격력 배율 (기본값 1)  
     * 이 배율이 높을수록 해당 스킬은 더 높은 데미지를 줄 수 있음.
     */
    this.attackMultiple = 1

    /**
     * 스킬의 기준 공격력 배율 값 (값 변경 불가능)  
     * 이 게임에서는 shotDamage(1) + skillDamage(0.8 * 4) = Total(4.2)의 구성이 기본입니다.  
     * 대략적인 데미지 비율은, shot(약 23.2%) + skill(약 76.8%) 입니다.
     */
    this.BASE_MULTIPLE = 0.8

    /**
     * 스킬을 사용하고 스킬에 대한 무기 발사를 1회 반복할 때, 동시에 발사되는 개수
     */
    this.shotCount = 1

    /**
     * 스킬을 사용하고, 무기 발사를 반복하는 횟수
     */
    this.repeatCount = 1

    /**
     * 각 무기당 공격 횟수 (일부 무기는 적을 여러번 공격할 수 있음.)
     */
    this.attackCount = 1

    /**
     * 스킬의 쿨타임  
     * 참고: 스킬들은 쿨타임 시간만큼의 초당 데미지를 수 초내에 주는 방식입니다.  
     * 예를들어, 20초짜리 스킬은 20초분량의 데미지를 줍니다. 다만, 스킬 지속시간이 굉장히 짧으므로
     * 순간적으로 주는 데미지가 많습니다.  
     * 스킬 시간과 쿨타임의 관계의 기준은 이렇습니다. (일부 무기는 예외)  
     * 쿨타임: 20초, 24초, 25초, 28초, 30초
     * 유지시간: 2~3초, 3~4초, 3~4초, 4~5초, 4~5초 
     */
    this.coolTime = 20

    /**
     * 스킬을 사용하고, 무기가 반복적으로 작업하기까지의 지연프레임
     */
    this.delay = 60

    /**
     * 스킬이 바로 나가는게 아니라, 대기 시간 이후에 나간다면, 이 값을 설정해주세요. 단위는 프레임입니다.
     * 1초 = 60프레임
     */
    this.beforeDelay = 0

    /** 
     * 스킬 사용 사운드 
     * @type {Audio} 
     */ 
    this.useSound = null

    /** 
     * 스킬을 사용한 후 한번 반복할 때 나오는 샷 사운드 
     * @type {Audio} 
     */
    this.shotSound = null
  }

  /**
   * 스킬을 사용할 때 무기를 생성하는 함수
   * @param {number} attack 플레이어의 공격력
   * @param {number} x 스킬의 x좌표
   * @param {number} y 스킬의 y좌표
   */
  create (attack, x, y) {

  }

  /**
   * 한 발당 샷의 공격력을 얻습니다. 공격력 계산의 최종 결과값은 소수점 버림
   * 참고: 무기랑 공격 계산식이 약간 다릅니다.(자세한건 코드 주석 참고)  
   * @param {number} baseAttack 유저의 공격력
   * @param {number} multiple 무기 공격이 여러종류가 합쳐질때, 배율 비중을 나눠주기 위해 사용하는 변수
   * @returns 
   */
  getShotAttack (baseAttack, multiple = 1) {
    // 기본 공식 (최종 결과값은 소수점 버림)
    // 최종 공격력 = (유저 공격력 / (샷 횟수 * 반복 횟수)) * (공격력 배율 * 쿨타임 * 기본 배율 0.8)
    // totalDivied = 샷 횟수 * 반복횟수 // 유저 공격력을 나눠야 하는 값
    // totalMultiple = 공격배율 * 배율 * 기본배율 * 쿨타임 // 총 배율 값입니다.
    // resultAttack = (유저 공격력 * 총 배율) / 나누는 값
  
    let totalDivied = this.shotCount * this.repeatCount * this.attackCount
    let totalMultiple = this.attackMultiple * multiple * this.BASE_MULTIPLE * this.coolTime
    let resultAttack = (baseAttack * totalMultiple) / totalDivied
    return Math.floor(resultAttack)
  }

  /**
   * 스킬을 사용할 때 나오는 사운드
   */
  useSoundPlay () {
    if (this.useSound) {
      soundSystem.play(this.useSound)
    }
  }

  /**
   * 스킬의 무기를 발사할 때 나오는 사운드
   */
  shotSoundPlay () {
    if (this.shotSound) {
      soundSystem.play(this.shotSound)
    }
  }

  /**
   * 쿨타임을 프레임단위로 변환해 리턴(coolTime은 초 단위이므로, frame단위로 변환해줘야 할 때 이 함수슬 쓰세요.)
   */
  getCoolTimeFrame () {
    return this.coolTime * 60
  }
}

/**
 * 스킬 멀티샷: 다수 추적 샷 발사
 */
class PlayerSkillMultyshot extends PlayerSKillData {
  constructor () {
    super()
    this.attackMultiple = 1
    this.coolTime = 20
    this.repeatCount = 30
    this.delay = 6
    this.shotCount = 5
    this.useSound = soundFile.skill.skillMultyshotUse
    this.shotSound = soundFile.skill.skillMultyshotShot
    this.beforeDelay = 30
  }

  create (x, y, attack) {
    this.shotSoundPlay()
    const shotAttack = this.getShotAttack(attack)
    fieldState.createWeaponObject(ID.weapon.skillMultyshot, x, y + 60, shotAttack)
    fieldState.createWeaponObject(ID.weapon.skillMultyshot, x, y + 30, shotAttack)
    fieldState.createWeaponObject(ID.weapon.skillMultyshot, x, y, shotAttack)
    fieldState.createWeaponObject(ID.weapon.skillMultyshot, x, y - 30, shotAttack)
    fieldState.createWeaponObject(ID.weapon.skillMultyshot, x, y - 60, shotAttack)
  }
}

/**
 * 스킬 미사일: 추적 스플래시 연타 공격
 */
class PlayerSkillMissile extends PlayerSKillData {
  constructor () {
    super()
    this.missile = new SkillMissile()
    this.attackMultiple = 1.2 // 미사일은 단기적으로 높은 데미지를 주지만, 범위가 한정되어있고, 발사 개체 수가 적기 때문에 데미지 보너스가 있음.
    this.coolTime = 24
    this.repeatCount = 4
    this.delay = 20
    this.shotCount = 2
    this.shotSound = soundFile.skill.skillMissileShot
    this.attackCount = this.missile.repeatCount
  }

  create (x, y, attack) {
    this.shotSoundPlay()
    const shotAttack = this.getShotAttack(attack)
    fieldState.createWeaponObject(ID.weapon.skillMissile, x - 60, y - 60, shotAttack)
    fieldState.createWeaponObject(ID.weapon.skillMissile, x + 60, y - 60, shotAttack)
  }
}

/**
 * 스킬 애로우: 벽 튕기기 강화
 */
class PlayerSkillArrow extends PlayerSKillData {
  constructor () {
    super()
    this.arrow = new SkillArrow()
    this.attackMultiple = 1.2
    this.coolTime = 20
    this.repeatCount = 20
    this.delay = 9
    this.shotCount = 2
    this.shotSound = soundFile.skill.skillArrowShot
    this.attackCount = this.arrow.repeatCount
  }

  create (x, y, attack) {
    this.shotSoundPlay()
    const shotAttack = this.getShotAttack(attack)
    fieldState.createWeaponObject(ID.weapon.skillArrow, x, y - 35, shotAttack, 7)
    fieldState.createWeaponObject(ID.weapon.skillArrow, x, y - 35, shotAttack, -7)
  }
}

/**
 * 스킬 레이저: 넓은 범위의 지속적인 관통 공격
 */
class PlayerSkillLaser extends PlayerSKillData {
  constructor () {
    super()
    this.laser = new SkillLaser()
    this.attackMultiple = 0.8
    this.coolTime = 24
    this.shotSound = soundFile.skill.skillLaserShot
    this.attackCount = this.laser.repeatCount
  }

  create(x, y, attack) {
    this.shotSoundPlay()
    const shotAttack = this.getShotAttack(attack)
    fieldState.createWeaponObject(ID.weapon.skillLaser, x, y, shotAttack)
  }
}

/**
 * 스킬 사피아: 추적범위가 넓어지고 동시에 스플래시 공격(다만 타격 최대 수는 낮음)
 */
class PlayerSkillSapia extends PlayerSKillData {
  constructor () {
    super()
    this.sapia = new SkillSapia()
    this.attackMultiple = 1.1
    this.coolTime = 24
    this.useSound = soundFile.skill.skillSapiaWeapon
    this.attackCount = this.sapia.repeatCount
    this.shotCount = 6
    this.delay = 60
  }

  create(x, y, attack) {
    const shotAttack = this.getShotAttack(attack)
    for (let i = 0; i < 6; i++) {
      fieldState.createWeaponObject(ID.weapon.skillSapia, x, y, shotAttack)
    }
  }
}

/**
 * 스킬 파라포: 강력한 충격파
 */
class PlayerSkillParapo extends PlayerSKillData {
  constructor () {
    super()
    this.parapo = new SkillParapo()
    this.attackMultiple = 0.9
    this.coolTime = 24
    this.delay = 10
    this.repeatCount = 24
  }

  create(x, y, attack) {
    const shotAttack = this.getShotAttack(attack)
    fieldState.createWeaponObject(ID.weapon.skillParapo, x, y, shotAttack)
  }
}

/**
 * 스킬 블래스터: 순간적인 많은 데미지
 */
class PlayerSkillBlaster extends PlayerSKillData {
  constructor () {
    super()
    this.attackMultiple = 1.6
    this.coolTime = 28
    this.delay = 4
    this.repeatCount = 40
    this.shotCount = 2
    this.shotSound = soundFile.skill.skillBlasterShot
    this.blaster = new SkillBlaster()
  }

  create(x, y, attack) {
    this.shotSoundPlay()
    const shotAttack = this.getShotAttack(attack)
    const halfHeight = this.blaster.height / 2
    fieldState.createWeaponObject(ID.weapon.skillBlaster, x, y + 10 - halfHeight, shotAttack)
    fieldState.createWeaponObject(ID.weapon.skillBlaster, x, y - 10 - halfHeight, shotAttack)
  }
}

/**
 * 스킬 사이드웨이브: 사이드웨이브 무기의 강화
 */
class PlayerSkillSidewave extends PlayerSKillData {
  constructor () {
    super()
    this.sidewave = new SkillSidewave()
    this.attackMultiple = 1.2
    this.coolTime = 20
    this.delay = 7
    this.repeatCount = 24
    this.shotCount = 3
    this.shotSound = soundFile.skill.skillSidewaveShot
  }

  create(x, y, attack) {
    this.shotSoundPlay()
    const shotAttack = this.getShotAttack(attack)
    const halfHeight = this.sidewave.height / 2
    fieldState.createWeaponObject(ID.weapon.skillSidewave, x, y - halfHeight, shotAttack, -7)
    fieldState.createWeaponObject(ID.weapon.skillSidewave, x, y - halfHeight, shotAttack, 0)
    fieldState.createWeaponObject(ID.weapon.skillSidewave, x, y - halfHeight, shotAttack, 7)
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
      this.enimation.displayAndProcess(this.x, this.y)
    }
  }
}

class MissileEffect extends EffectData {
  constructor () {
    super()
    this.width = 100
    this.height = 100
    this.enimation = new EnimationData(imageFile.weapon.missileEffect, 0, 0, 100, 100, 10, 2)
  }
}

class SkillMissileEffect extends EffectData {
  constructor () {
    super()
    this.width = 200
    this.height = 200
    this.enimation = new EnimationData(imageFile.weapon.skillMissileEffect, 0, 0, this.width, this.height, 10, 2, 1)
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

    this.enimation = new EnimationData(imageFile.weapon.parapoEffect, 0, directionPosition, 100, 100, 10, 2)
  }
}

class SkillParapoEffect extends EffectData {
  constructor () {
    super()
    this.width = 240
    this.height = 240
    this.enimation = new EnimationData(imageFile.weapon.skillParapoEffect, 0, 0, this.width, this.height, 10, 2)
  }
}

class EnemyData extends FieldData {
  constructor () {
    super()
    /**
     * 점수 공식에 대해: 미정 (일단, 적 체력의 1% 인데 이게 확실한것이 아님)  
     * 다만 일부 적들은 다를 수 있음. 그건 각 적의 설명을 참고하세요.
     */
    this.score = 100
    this.isInited = false
    this.attack = 0

    /** 죽었는지 체크 */ this.isDied = false
    /** 
     * 죽은 후 삭제되기까지의 지연시간 
     * @type {DelayData}
     */ 
    this.dieAfterDeleteDelay = null

    /** 
     * 충돌 지연시간  
     * (참고: 적이 플레이어에 닿았다면 60프레임 이후 다시 플레이어를 타격할 수 있습니다.) 
     * @type {DelayData}
     */ 
    this.collisionDelay = new DelayData(60)
    this.collisionDelay.count = this.collisionDelay.delay / 2 // 생성하자마자 즉시 공격하게끔 만듬 그러나 약간의 지연시간은 존재

    /**
     * 적이 화면 바깥 일정 영역을 넘어간다면, 제거 대기시간이 추가되고,
     * 일정 시간을 넘어가면 해당 적은 조건에 상관없이 강제로 사라집니다.
     * 기준값은 5초(300 프레임)입니다.  
     * 참고로 이 변수의 check 함수를 사욯라 때 인수값으로 (reset: false, countUp: false) 를 넣어주세요.
     * @type {DelayData}
     */
    this.outAreaDeleteDelay = new DelayData(300)

    /** 적이 화면 바깥으로 나갈 수 있는지의 여부 */ this.isPossibleExit = true
    /** 적이 나간다면 위치가 리셋되는지의 여부 */ this.isExitToReset = false

    /** 이미지 */ this.image = null
  }

  /**
   * 충돌 영역 얻기.  
   * 무기와 다르게 적의 충돌 영역은 여러개입니다. 물론 하나일 수도 있습니다.  
   * 충돌 영역은 배열로 리턴되므로 참고해주세요.  
   * 충돌 영역은 이 함수를 재정의해서 설정해주세요.
   * 다만, 이 방식은 회전한 사각형을 판정할 순 없기 때문에, 회전한 사각형까지 판정하려면 다른 함수를 사용해야 합니다.
   * 그러나, 이것은 일부 적에 한정되는 상황이므로, 해당하는 일부 적의 알고리즘을 살펴봐주세요.
   * @returns {{x: number, y: number, width: number, height: number}[]} 객체의 영역
   */
  getCollisionArea () {
    return [{
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }]
  }

  /**
   * 이미지와 이미지 데이터를 설정하고, 자동으로 에니메이션 설정을 합니다.
   * @param {Image} image
   * @param {{x: number, y: number, width: number, height: number, frame: number}} imageData
   * @param {number} enimationDelay 에니메이션 딜레이(프레임 단위)
   */
  autoSetImageData (image, imageData, enimationDelay = 2) {
    this.image = image
    this.imageData = imageData
    if (this.image == null || this.imageData == null) return

    this.width = this.imageData.width
    this.height = this.imageData.height
    if (this.imageData.frame >= 2) {
      this.enimation = new EnimationData(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.imageData.frame, enimationDelay, -1)
    }
  }

  /** 
   * 적 오브젝트를 생성할 때 쓰이는 자동 초기화 함수  
   * 이 함수는 오브젝트를 생성한 직후 추가로 실행해 주세요. (생성자 안에다가 넣으면 제대로 초기화되지 않음.)
   * 사용용도: hpMax값 체크 (다만 이건 임시로 하는것.)
   */
  init () {
    if (this.isInited) return

    this.isInited = true
    this.hpMax = this.hp
  }

  process () {
    // 적이 죽지 않았을 때 적과 관련된 행동 처리
    if (!this.isDied) {
      this.processMove()
      this.processPossibleExit()
      this.processExitToReset()
      this.processPlayerCollision()
    }

    // 적 죽었는지 체크
    this.processOutAreaCheck()
    this.processDieCheck()
    this.processDieAfter()
  }

  /**
   * 적이 나갈 수 있는지에 대한 함수 로직
   */
  processPossibleExit () {
    if (this.isPossibleExit) return // 적이 화면 바깥으로 나갈 수 없는 경우만 처리합니다. 그래서 나갈 수 있으면 함수 종료
    
    // 방향이 있을 때는, 방향만 변경하지만, 방향이 없을때는, 속도값을 반전시킵니다.
    if (this.x < 0) {
      this.x = 0
      if (this.moveDirectionX === 'left') {
        this.moveDirectionX = 'right'
      } else if (this.moveDirectionX === 'right') {
        this.moveDirectionX = 'left'
      } else {
        this.speedX = Math.abs(this.speedX)
      }
    } else if (this.x > graphicSystem.CANVAS_WIDTH) {
      this.x = graphicSystem.CANVAS_WIDTH
      if (this.moveDirectionX === 'left') {
        this.moveDirectionX = 'right'
      } else if (this.moveDirectionX ===' right') {
        this.moveDirectionX = 'left'
      } else {
        this.speedX = -Math.abs(this.speedX)
      }
    }

    if (this.y < 0) {
      this.y = 0
      if (this.moveDirectionY === 'up') {
        this.moveDirectionY = 'down'
      } else if (this.moveDirectionY === 'down') {
        this.moveDirectionY = 'up'
      } else {
        this.speedY = Math.abs(this.speedY)
      }
    } else if (this.y > graphicSystem.CANVAS_HEIGHT) {
      this.y = graphicSystem.CANVAS_HEIGHT
      if (this.moveDirectionY === 'up') {
        this.moveDirectionY = 'down'
      } else if (this.moveDirectionY === 'down') {
        this.moveDirectionY = 'up'
      } else {
        this.speedY = -Math.abs(this.speedY)
      }
    }
  }

  /**
   * 나가면 적 위치를 다시 재조정
   */
  processExitToReset () {
    if (!this.isExitToReset) return // 적이 나가면 리셋되지 않는경우 함수 종료

    let scopeSize = 50

    // 이동 방향이 왼쪽이거나, speedX값이 음수이면, 왼쪽 영역 바깥으로 이동하는것입니다. 반대 방향도 마찬가지
    if ((this.speedX < 0 || this.moveDirectionX === 'left') && this.x - this.width < -scopeSize) {
      this.x = graphicSystem.CANVAS_WIDTH + this.width + scopeSize
    } else if ((this.speedX > 0 || this.moveDirectionX === 'right') && this.x + this.width > graphicSystem.CANVAS_WIDTH + scopeSize) {
      this.x = 0 - this.width - scopeSize
    }

    if ((this.speedY < 0 || this.moveDirectionY === 'up') && this.y - this.height < -scopeSize) {
      this.y = graphicSystem.CANVAS_HEIGHT + this.height + scopeSize
    } else if ((this.speedY > 0 || this.moveDirectionY === 'down') && this.y + this.height > graphicSystem.CANVAS_HEIGHT + scopeSize) {
      this.y = 0 - this.height - scopeSize
    }
  }

  /**
   * 적이 화면 바깥에 있는지 없는지 알려줍니다.
   */
  viewAreaExitCheck () {
    if (this.x - this.width < 0 || this.x + this.width > graphicSystem.CANVAS_WIDTH || this.y - this.height < 0 || this.y + this.height > graphicSystem.CANVAS_HEIGHT) {
      return true
    } else {
      return false
    }
  }

  /**
   * 플레이어와의 충돌 함수  
   * 참고: 적이 플레이어랑 부딪힌다면 1초 후에 다시 공격할 수 있습니다.
   */
  processPlayerCollision () {
    if (this.collisionDelay.check(false)) {
      let player = fieldState.getPlayerObject()
      let enemy = this.getCollisionArea() // 적은 따로 충돌 영역을 얻습니다.

      for (let i = 0; i < enemy.length; i++) {
        if (collision(enemy[i], player)) {
          player.addDamage(this.attack)
          this.collisionDelay.count = 0 // 플레이어랑 충돌하면 충돌 딜레이카운트를 0으로 만듬
          return
        }
      }
    }
  }

  /**
   * 적이 죽었는지를 확인하는 함수  
   * 일단 한번 죽었다면, 재생성이 아닌 이상 부활은 불가능합니다.
   */
  processDieCheck () {
    if (this.isDied) return
    if (this.hp <= 0) {
      this.isDied = true
      fieldState.playerObject.addExp(this.score)
    }
  }

  /**
   * 적이 죽은 후에, 어떻게 할 것인지를 결정하는 함수.  
   * 기본적으로는 적이 죽은 후 딜레이를 확인해서, 딜레이 시간동안은 적이 남아있습니다.  
   * 참고: 이 상태 그대로 적용했을 때, 무기가 죽은 적을 지속적으로 공격할 수도 있습니다. 이 문제는 추후 수정할 계획입니다.
   */
  processDieAfter () {
    if (this.isDied) {
      // 적이 죽었을 때, 딜레이가 null 이거나, 딜레이가 있을 때 딜레이카운트를 다 채우면 그 때 삭제
      if (this.dieAfterDeleteDelay == null || this.dieAfterDeleteDelay.check()) {
        this.isDeleted = true
      }
    }
  }

  /**
   * 적이 일정 영역으로 벗어났는지를 확인합니다.
   * 만약 그렇다면, 영역에 벗어나있는 시간을 추가하고, 이 시간이 10초(600프레임)이 되면 삭제합니다.
   */
  processOutAreaCheck () {
    let player = fieldState.getPlayerObject()
    if (this.x <= player.x - 1600 
     || this.x >= player.x + 1600
     || this.y <= player.y - 1200
     || this.y >= player.y + 1200 ) {
      this.outAreaDeleteDelay.count++
    } else {
      this.outAreaDeleteDelay.count--
    }

    if (this.outAreaDeleteDelay.check(false, false)) {
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
    this.hp = 80000
    this.score = 400
    this.width = 48
    this.height = 48
    this.attack = 10
    this.isPossibleExit = false
    this.image = imageFile.enemyTemp
    this.movespeedX = -1
  }
}

class TestShowDamageEnemy extends EnemyData {
  constructor () {
    super()
    this.hp = 1000000
    this.score = 1000
    this.width = 48
    this.height = 48
    this.attack = 0
    this.isPossibleExit = false
    this.image = imageFile.enemyTemp
    this.movespeedX = 0
  }

  display () {
    super.display()
    graphicSystem.digitalFontDisplay('totaldamage: ' + (1000000 - this.hp), 0, 40)
  }
}

// round 1-1 적(참고: 모든 적들은 다른 라운드에도 나올 수도 있음.)
class SpaceEnemy extends EnemyData {
  constructor () {
    super()
    this.image = imageFile.enemy.spaceEnemy
  }
}

class SpaceEnemyLight extends EnemyData {
  constructor () {
    super()
    this.colorNumber = Math.floor(Math.random() * 8)
    this.image = imageFile.enemy.spaceEnemy
    this.imageData = imageDataInfo.spaceEnemy.spaceLight
    this.width = this.imageData.width
    this.height = this.imageData.height
    this.hp = 1000 + (this.colorNumber * 100)
    this.score = 10 + this.colorNumber
    this.dieAfterDeleteDelay = new DelayData(20)
    this.moveSpeedX = Math.random() * 8 - 4
    this.moveSpeedY = Math.random() * 8 - 4
    this.isPossibleExit = true
    this.isExitToReset = true
    this.attack = 1
  }

  display () {
    let alpha = (this.dieAfterDeleteDelay.delay - this.dieAfterDeleteDelay.count) / this.dieAfterDeleteDelay.delay
    graphicSystem.setAlpha(alpha)
    graphicSystem.imageDisplay(this.image, this.imageData.x + (this.colorNumber * this.imageData.width), this.imageData.y, this.imageData.width, this.imageData.height, this.x, this.y, this.width, this.height)
    graphicSystem.setAlpha(1)
  }
}

class SpaceEnemyRocket extends EnemyData {
  /**
   * 옵션의 배열 첫번째 인수에 아무 값이나 넣으면, 로켓이 빨간색으로 변경,
   * 옵션의 배열 두번째 인수에 아무 값이나 넣으면, 로켓의 크기가 커짐,
   * 옵션에 따라 로켓의 체력과 점수가 변화 (공격력은 차이 없음)  
   * 경고: 한번 설정된 값은 바꿀 수 없음. 바꾸고싶다면 죽이고 다시 만들어야함.
   * @param {string[]} option 옵션(인수는 상관없고, 크기만 바꾸고 싶다면, 첫번째 인수에 undefined를 넣을것)
   */
  constructor (option = []) {
    super()
    // 이렇게 설정된 이유는, option 배열의 개수가 가변적이기 때문입니다. 따라서 각 원소가 있는지를 확인해야 합니다.
    // 원소가 존재하면 색깔은 빨간색, 크기는 커집니다. (인수의 값은 아무거나 상관없음)
    let isChangeColor = option.length >= 1 && option[0] != null ? true : false
    let isChangeSize = option.length >= 2 && option[1] != null ? true : false

    this.image = imageFile.enemy.spaceEnemy
    this.imageData = null
    if (!isChangeColor && !isChangeSize) { // 색깔변경없고, 크기 변경없을경우, 파란색 작은 로켓이 기본값
      this.imageData = imageDataInfo.spaceEnemy.rocketBlue
      this.hp = 1200
      this.score = 12
    } else if(!isChangeColor && isChangeSize) {
      this.imageData = imageDataInfo.spaceEnemy.rocketBlueBig
      this.hp = 2400
      this.score = 24
    } else if (isChangeColor && !isChangeSize) {
      this.imageData = imageDataInfo.spaceEnemy.rocketRed
      this.hp = 1600
      this.score = 16
    } else {
      this.imageData = imageDataInfo.spaceEnemy.rocketRedBig
      this.hp = 3200
      this.score = 32
    }
    
    if (isChangeColor) {
      this.color = 'blue'
    } else {
      this.color = 'red'
    }

    this.width = this.imageData.width
    this.height = this.imageData.height

    this.moveSpeedX = 4 + Math.random() * 2
    this.moveSpeedY = 0
    this.isPossibleExit = true
    this.isExitToReset = true
    this.attack = 17
    
    this.enimation = new EnimationData(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.imageData.frame, 4, -1)
  }

  display () {
    super.display()
  }
}

class spaceEnemyCar extends EnemyData {
  constructor () {
    super()
    this.image = imageFile.enemy.spaceEnemy
    this.imageData = imageDataInfo.spaceEnemy.greenCar
    this.width = this.imageData.width
    this.height = this.imageData.height

    this.enimation = new EnimationData(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.imageData.frame, 2, -1)
    this.state = 'normal'
    this.boostCount = 0 // 자동차의 속도를 올리기 위한 변수
    this.isPossibleExit = true
    this.isExitToReset = true
    this.hp = 2300
    this.score = 23
    this.attack = 9
  }

  processMove () {
    let playerObject = fieldState.getPlayerObject()
    let playerX = playerObject.x
    let playerY = playerObject.y
    let playerWidth = playerObject.width
    let playerHeight = playerObject.height

    // 차는 이동할때, 플레이어의 y축이 비슷한 위치에 있고, 플레이어 x축 보다 차 x축이 오른쪽에 있을 때, 플레이어가 있는 왼쪽으로 빠르게 이동합니다.
    // 차는 오른쪽으로는 이동하지 않습니다.
    if (playerY < this.y + this.height && playerY + playerHeight > this.y && playerX < this.x) {
      this.boostCount++
      this.state = 'boost'
    } else {
      this.state = 'normal'
      this.boostCount--
    }

    // 차의 속도를 제한하기 위해 부스트카운트 값을 일정 값 범위 내로 제한합니다.
    if (this.boostCount > 60) {
      this.boostCount = 60
    } else if (this.boostCount < 0) {
      this.boostCount = 0
    }

    this.moveSpeedX = 2 + (this.boostCount / 4)
    super.processMove()
  }

  display () {
    // 이 차는, 주인공을 추적할때만 에니메이션이 재생되고, 아니면 에니메이션이 0프레임으로 고정됩니다.
    if (this.enimation) {
      if (this.state === 'normal') {
        this.enimation.elapsedFrame = 0
        this.enimation.display(this.x, this.y) // 에니메이션은 출력되지만, 로직이 처리되지 않아 다음 에니메이션이 진행되지 않음.
      } else {
        this.enimation.displayAndProcess(this.x, this.y)
      }
    }
  }
}

class SpaceEnemySquare extends EnemyData {
  constructor () {
    super()
    this.image = imageFile.enemy.spaceEnemy
    this.imageData = imageDataInfo.spaceEnemy.blueSqaure
    this.width = this.imageData.width
    this.height = this.imageData.height
    this.isPossibleExit = false
    this.hp = 3000
    this.score = 30
    this.enimation = new EnimationData(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.imageData.frame, 6, -1)
    this.MOVE_STOP_FRAME = 180
    this.moveDelay = new DelayData(240)
    this.moveDelay.count = this.moveDelay.delay
    this.finishPosition = {x: 0, y: 0}
    this.setMoveDirection() // 이동 방향 설정 안함
  }

  resetFinishPosition () {
    this.finishPosition.x = Math.floor(Math.random() * graphicSystem.CANVAS_WIDTH)
    this.finishPosition.y = Math.floor(Math.random() * graphicSystem.CANVAS_HEIGHT)

    this.speedX = (this.finishPosition.x - this.x) / this.moveDelay.delay
    this.speedY = (this.finishPosition.y - this.y) / this.moveDelay.delay
  }

  processMove () {
    // 이동딜레이 초반 60프레임동안 이동하고, 61 ~ 119프레임은 이동하지 않습니다.
    // 120프레임이 되면 도착 지점이 재설정됩니다.
    // 참고: moveDelay.check()를 첫번째 조건으로 설정해야, moveDelay값에 따른 잘못된 이동 버그를 막을 수 있습니다.
    if (this.moveDelay.check()) {
      this.resetFinishPosition()
    } else if (this.moveDelay.count >= this.MOVE_STOP_FRAME) {
      this.speedX = 0
      this.speedY = 0
    } else {
      super.processMove()
    }
  }
}

class SpaceEnemyAttack extends EnemyData {
  constructor () {
    super()
    this.image = imageFile.enemy.spaceEnemy
    this.imageData = imageDataInfo.spaceEnemy.blueAttack
    this.width = this.imageData.width
    this.height = this.imageData.height

    this.hp = 1900
    this.score = 19
    this.attack = 11
    this.boostCount = 0
    this.moveSpeedY = 0

    this.enimation = new EnimationData(this.image, this.imageData.x, this.imageData.y, this.imageData.width, this.imageData.height, this.imageData.frame, 8, -1)
  }

  processMove () {
    this.boostCount++
    if (this.boostCount <= 60) {
      this.moveSpeedX = (this.boostCount / 20)
    } else if (this.boostCount <= 120) {
      this.moveSpeedX = (this.boostCount / 10) + 3
    } else {
      this.moveSpeedX = 15
    }

    if (this.x >= graphicSystem.CANVAS_WIDTH && this.boostCount >= 60) {
      this.boostCount = 0
    }

    super.processMove()
  }
}

class SpaceEnemyEnergy extends EnemyData {
  constructor () {
    super()
    this.autoSetImageData(imageFile.enemy.spaceEnemy, imageDataInfo.spaceEnemy.purpleEnergy)
    this.attack = 16
    this.hp = 4400
    this.score = 44
    this.boostCount = 0
    this.moveDelay = new DelayData(120)
    this.moveDelay.count = 120
    this.state = 'normal'
    this.moveDirectionX = 'left'
  }

  processMove () {
    if (this.moveDelay.check()) {
      if (this.state === 'normal') {
        this.state = 'boost'
        this.moveDirectionX = Math.floor(Math.random() * 2) === 1 ? 'left' : 'right'
      } else {
        this.state = 'normal'
      }
    }

    if (this.state === 'normal') {
      this.boostCount--
      if (this.boostCount < 0) this.boostCount = 0
    } else {
      this.boostCount++
      if (this.boostCount > 120) this.boostCount = 120
    }

    this.moveSpeedX = 1 + (this.boostCount / 10)
    super.processMove()
  }
}

class SpaceEnemySusong extends EnemyData {

}

class SpaceEnemyGamjigi extends EnemyData {

}

class SpaceEnemyComet extends EnemyData {

}

class SpaceEnemyMeteorite extends EnemyData {

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

  static pWeapon = {
    multyshot: new PlayerMultyshot(),
    missile: new PlayerMissile(),
    arrow: new PlayerArrow(),
    laser: new PlayerLaser(),
    sapia: new PlayerSapia(),
    parapo: new PlayerParapo(),
    blaster: new PlayerBlaster(),
    sidewave: new PlayerSidewave()
  }

  static pSkill = {
    multyshot: new PlayerSkillMultyshot(),
    missile: new PlayerSkillMissile(),
    arrow: new PlayerSkillArrow(),
    laser: new PlayerSkillLaser(),
    sapia: new PlayerSkillSapia(),
    parapo: new PlayerSkillParapo(),
    blaster: new PlayerSkillBlaster(),
    sidewave: new PlayerSkillSidewave()
  }

  /**
   * 플레이어 무기 데이터를 가져옵니다. 이미 만들어진 객체이므로, 따로 인스턴스를 생성하지 마세요.
   * @param {ID} id ID 클래스가 가지고 있는 상수 값을 넣어주세요.  
   * @returns {PlayerWeaponData} playerWeapon의 클래스, 값이 없다면 null
   */
  static getPlayerWeaponData (id) {
    switch (id) {
      case ID.playerWeapon.multyshot: return this.pWeapon.multyshot
      case ID.playerWeapon.missile: return this.pWeapon.missile
      case ID.playerWeapon.arrow: return this.pWeapon.arrow
      case ID.playerWeapon.laser: return this.pWeapon.laser
      case ID.playerWeapon.sapia: return this.pWeapon.sapia
      case ID.playerWeapon.parapo: return this.pWeapon.parapo
      case ID.playerWeapon.blaster: return this.pWeapon.blaster
      case ID.playerWeapon.sidewave: return this.pWeapon.sidewave
      default: return null
    }
  }

  /**
   * 플레이어 스킬 데이터를 가져옵니다. 이미 만들어진 객체이므로 따로 인스턴스를 생성하지 마세요.
   * @param {ID} id ID 클래스가 가지고 있는 상수 값을 넣어주세요.  
   * @returns {PlayerSKillData} playerWeapon의 클래스, 값이 없다면 null
   */
  static getPlayerSkillData (id) {
    switch(id) {
      case ID.playerSkill.multyshot: return this.pSkill.multyshot
      case ID.playerSkill.missile: return this.pSkill.missile
      case ID.playerSkill.arrow: return this.pSkill.arrow
      case ID.playerSkill.laser: return this.pSkill.laser
      case ID.playerSkill.sapia: return this.pSkill.sapia
      case ID.playerSkill.parapo: return this.pSkill.parapo
      case ID.playerSkill.blaster: return this.pSkill.blaster
      case ID.playerSkill.sidewave: return this.pSkill.sidewave
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
      case ID.weapon.missile: return MissileData
      case ID.weapon.missileRocket: return MissileRocket
      case ID.weapon.arrow: return Arrow
      case ID.weapon.laser: return Laser
      case ID.weapon.laserBlue: return LaserBlue
      case ID.weapon.sapia: return Sapia
      case ID.weapon.sapiaShot: return SapiaShot
      case ID.weapon.parapo: return Parapo
      case ID.weapon.parapoShockWave: return ParapoShockwave
      case ID.weapon.blaster: return Blaster
      case ID.weapon.blasterMini: return BlasterMini
      case ID.weapon.sidewave: return Sidewave

      // skill
      case ID.weapon.skillMultyshot: return SkillMultyshot
      case ID.weapon.skillMissile: return SkillMissile
      case ID.weapon.skillArrow: return SkillArrow
      case ID.weapon.skillLaser: return SkillLaser
      case ID.weapon.skillSapia: return SkillSapia
      case ID.weapon.skillParapo: return SkillParapo
      case ID.weapon.skillBlaster: return SkillBlaster
      case ID.weapon.skillSidewave: return SkillSidewave
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
      case ID.enemy.testShowDamageEnemy: return TestShowDamageEnemy
      
      // r1: space enemy
      case ID.enemy.spaceEnemyLight: return SpaceEnemyLight
      case ID.enemy.spaceEnemyRocket: return SpaceEnemyRocket
      case ID.enemy.spaceEnemyCar: return spaceEnemyCar
      case ID.enemy.spaceEnemySquare: return SpaceEnemySquare
      case ID.enemy.spaceEnemyAttack: return SpaceEnemyAttack
      case ID.enemy.spaceEnemyEnergy: return SpaceEnemyEnergy
      case ID.enemy.spaceEnemySusong: return SpaceEnemySusong
      case ID.enemy.spaceEnemyGamjigi: return SpaceEnemyGamjigi
      case ID.enemy.spaceEnemyComet: return SpaceEnemyComet
      case ID.enemy.spaceEnemyMeteorite: return SpaceEnemyMeteorite
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
      case ID.effect.skillMissile: return SkillMissileEffect
      case ID.effect.skillParapo: return SkillParapoEffect
    }
  }
}

