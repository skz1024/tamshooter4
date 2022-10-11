import { buttonSystem } from "./js/control.js";
import { graphicSystem } from "./js/graphic.js";
import { imageDataInfo, imageFile } from "./js/image.js";

class collisionClass {
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


    // graphicSystem.fillLine(vertex[0].x, vertex[0].y, vertex[1].x, vertex[1].y, 'red')
    // graphicSystem.fillLine(vertex[1].x, vertex[1].y, vertex[2].x, vertex[2].y, 'red')
    // graphicSystem.fillLine(vertex[2].x, vertex[2].y, vertex[3].x, vertex[3].y, 'red')
    graphicSystem.fillLine(vertex[3].x, vertex[3].y, vertex[0].x, vertex[0].y, 'red')

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

    graphicSystem.fillLine(edge[0].x, edge[0].y, edge[1].x, edge[1].y, 'blue')
    graphicSystem.fillLine(edge[1].x, edge[1].y, edge[2].x, edge[2].y, 'blue')
    graphicSystem.fillLine(edge[2].x, edge[2].y, edge[3].x, edge[3].y, 'blue')
    graphicSystem.fillLine(edge[3].x, edge[3].y, edge[0].x, edge[0].y, 'blue')

    return edge
  }
}


let imageData = imageDataInfo.jemulEnemy.rotateRocket
imageData.degree = 10
let image = {x: 100, y: 100, width: 200, height: 100, degree: 0}
let player = {x: 0, y: 0, width: 40, height: 20, degree: 0}
setInterval(() => {
  graphicSystem.clearCanvas()

  if (buttonSystem.getButtonDown(buttonSystem.BUTTON_LEFT)) player.x -= 5
  if (buttonSystem.getButtonDown(buttonSystem.BUTTON_RIGHT)) player.x += 5
  if (buttonSystem.getButtonDown(buttonSystem.BUTTON_UP)) player.y -= 5
  if (buttonSystem.getButtonDown(buttonSystem.BUTTON_DOWN)) player.y += 5

  
  graphicSystem.imageDisplay(imageFile.enemy.jemulEnemy, imageData.x, imageData.y, imageData.width, imageData.height, image.x, image.y, image.width, image.height, 0, image.degree)
  graphicSystem.imageDisplay(imageFile.system.playerImage, 0, 0, 40, 20, player.x, player.y, 40, 20)
  if (collisionClass.collisionOBB(player, image)) {
    graphicSystem.fillText('?!', 0, 200)
  }

}, 60)

addEventListener('keydown', (e) => {
  buttonSystem.keyInput(e.key)
  buttonSystem.keyDown(e.key)

  // 새로고침 기능, 개발자 도구 이외의 다른 기능은 막습니다.
  if (e.key !== 'F5' && e.key !== 'F12') {
    e.preventDefault()
  }
})
addEventListener('keyup', (e) => {
  buttonSystem.keyUp(e.key)
})


