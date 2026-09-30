//@ts-check
/**
 * 방향벡터를 기반으로 각도를 얻어옵니다.
 * 내 위치를 기준으로 방향 벡터가 얼마인지를 넣으면, 그 값을 기반으로 각도를 얻어옵니다.
 * 
 * 이를 이용하여 내 이동속도만큼 바라보는 방향의 각도를 가져올 수도 있고,
 * 특정 개체가 특정 적을 따라다닐 때도 서로의 거리 차이를 이용해서 바라보는 방향이 될 수 있게끔
 * 각도를 계산해 줍니다.
 * @param {number} x 방향 벡터 값
 * @param {number} y 방향 벡터 값
 * @returns
 */
export const getDegreeByVector = (x, y) =>  Math.atan2(y, x) * (180 / Math.PI)