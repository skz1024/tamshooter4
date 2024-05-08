//@ts-check

import { dataExportStatPlayerSkill, dataExportStatPlayerWeapon, dataExportStatRound, dataExportStatRoundBalance, dataExportStatWeapon, StatEquipMent } from "./js/dataStat.js"

let pre = document.getElementById('pre')
let element = document.createElement('pre')
element.textContent = '-player skillList-\n' 
+ 'name      |cool|delay|attack  |shot |repeat|attack|weapon\n' 
+ '          |Time|     |Multiple|Count|Count |Count |Attack\n'
pre?.appendChild(element)

dataExportStatPlayerSkill.forEach((value) => {
  let name = '' + value.name.padEnd(10, ' ').slice(0, 10) + '|'
  let coolTime = ('' + value.coolTime).padEnd(4, ' ') + '|'
  let delay = ('' + value.delay).padEnd(5, ' ') + '|'
  let attackMultiple = ('' + value.multiple).padEnd(8, ' ') + '|'
  let shotCount = ('' + value.shot).padEnd(5, ' ') + '|'
  let repeatCount = ('' + value.repeat).padEnd(6, ' ') + '|'
  let attackCount = ('' + value.hit).padEnd(6, ' ') + '|'
  let weaponAttack = ('' + value.weaponAttack).padEnd(6, ' ') + '|'

  let color = 'black'
  switch (value.coolTime) {
    case 20: color = 'greenyellow'; break
    case 24: color = 'lime'; break
    case 28: color = 'lightgreen'; break
  }


  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = name + coolTime + delay + attackMultiple + shotCount + repeatCount + attackCount + weaponAttack
  pre?.appendChild(element)
})

let element2 = document.createElement('pre')
element2.textContent = '-player weaponList- (60frame = 1second), (delay = frame)\n'
+ 'name      |delay|shot |repeat|attack  |weapon|\n'
+ '          |     |Count|count |Multiple|Attack|'
pre?.appendChild(element2)

dataExportStatPlayerWeapon.forEach((value) => {
  let name = '' + value.name.padEnd(10, ' ').slice(0, 10) + '|'
  let delay = ('' + value.delay).padEnd(5, ' ') + '|'
  let shotCount = ('' + value.shotCount).padEnd(5, ' ') + '|'
  let attackMultiple = ('' + value.attackMultiple).padEnd(8, ' ') + '|'
  
  let weaponData = dataExportStatWeapon.get(value.weaponIdList[0])
  if (weaponData == null) return
  let repeatCount = weaponData.repeatCount
  let weaponAttack = ('' + value.getCurrentAttack(10000, repeatCount)).padEnd(6, ' ') + '|'

  let color = 'pink'

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = name + delay + shotCount + attackMultiple + weaponAttack
  pre?.appendChild(element)
})

let element3 = document.createElement('pre')
element3.textContent = '-roundList-\n'
+ 'round|require|standard|finish|clear  |gold |gold |balance|play|timediv|round name|round info |\n'
+ 'text |level  |power   |time  |bonus  |value|total|score  |time|score  |          |           |\n'
pre?.appendChild(element3)

dataExportStatRound.forEach((value, keyId) => {
  let roundText = '' + value.roundText.padEnd(5, ' ').slice(0, 5) + '|'
  let requireLevel = ('' + value.requireLevel).padEnd(7, ' ') + '|'
  let requireAttack = ('' + value.requireAttack).padEnd(8, ' ') + '|'
  let finishTime = ('' + value.finishTime).padEnd(6, ' ') + '|'
  let clearBonus = ('' + value.clearBonus).padEnd(7, ' ') + '|'
  let goldValue = ('' + value.gold).padEnd(5, ' ') + '|'
  let goldTotal = ('' + value.goldTotal).padEnd(5, ' ') + '|'

  let balanceData = dataExportStatRoundBalance.get(keyId)
  let balanceScore = ('' + (balanceData != null ? balanceData.balanceScore : 0)).padEnd(7, ' ') + '|'
  let playTime = ('' + (balanceData != null ? balanceData.playTime : 0)).padEnd(4, ' ') + '|'
  let timeDivScore = ('' + (balanceData != null ? balanceData.timeDivScore : 0)).padEnd(7, ' ') + '|'
  let roundName = '' + value.roundName.padEnd(15, ' ')
  let roundInfo = '' // value.roundInfo + '|'

  let textA = roundText + requireLevel + requireAttack + finishTime + clearBonus + goldValue + goldTotal
  let textB = balanceScore + playTime + timeDivScore + roundName + roundInfo

  let color = 'darkbrown'

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = textA + textB
  pre?.appendChild(element)
})

let element4 = document.createElement('pre')
element4.textContent = '-upgradeCost-\n'
+ 'level|attack      |cost   |totalcost|refund |totalcost            |\n'
+ '     |percent|plus|percent|percent  |percent|refund   |diff |prev |\n'
pre?.appendChild(element4)

for (let i = 0; i <= StatEquipMent.UPGRADE_LEVEL_MAX; i++) {
  let level = ('' + i).padEnd(5, ' ') + '|'
  let attackPercent = ('' + StatEquipMent.upgradeAttackPercentTable[i]).padEnd(7, ' ') + '|'
  let attackDiffValue = i === 0 ? 0 : StatEquipMent.upgradeAttackPercentTable[i] - StatEquipMent.upgradeAttackPercentTable[i - 1]
  let attackDifferent = ('' + attackDiffValue).padEnd(4, ' ') + '|'
  let costPercent = ('' + StatEquipMent.upgradeCostPercentTable[i]).padEnd(7, ' ') + '|'
  let totalCostPercentString = ('' + StatEquipMent.upgradeCostTotalPercentTable[i]).padEnd(9, ' ') + '|'
  let refundPercent = ('' + StatEquipMent.upgradeRefundPercentTable[i]).padEnd(7, ' ') + '|'
  let totalCostRefund = ('' + StatEquipMent.upgradeCostTotalRefundTable[i]).padEnd(9, ' ') + '|'

  let totalCostDiffValue = i === 0 ? 0 : StatEquipMent.upgradeCostTotalPercentTable[i] - StatEquipMent.upgradeCostTotalRefundTable[i]
  let totalCostPrevValue = i === 0 ? 0 : StatEquipMent.upgradeCostTotalPercentTable[i - 1] - StatEquipMent.upgradeCostTotalRefundTable[i - 1]
  let totalCostDifferent = ('' + (totalCostDiffValue)).padEnd(5, ' ') + '|'
  let totalCostPrevDiff = ('' + (totalCostDiffValue - totalCostPrevValue)).padEnd(5, ' ') + '|'

  let color = 'white'
  if (i === 14) color = 'GreenYellow'
  else if (i === 23) color = 'LimeGreen'
  else if (i === 30) color = 'YellowGreen'


  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = level + attackPercent + attackDifferent + costPercent + totalCostPercentString + refundPercent + totalCostRefund + totalCostDifferent + totalCostPrevDiff
  pre?.appendChild(element)
}
