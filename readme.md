# 그다지 저는 빡세게 작업하기 싫은가봅니다. 모든게 귀찮나보네요. 할때는 엄청 오래하지만 안하면 오래 안합니다.

# tamshooter4
2022/03/01 start
2022/05/05 ver 0.1
2022/06/27 ver 0.16 이후 약 2개월간 장기 휴식...
2022/09/14 ver 0.17

지금까지 만들었었던 tamshooter시리즈의 4번째 작품을 만들고 있습니다.
과거 만들었었던 optionbattle의 리메이크작입니다.

이 작품까지는 가능하면, javascript만 사용하여 만들 생각이고, 어느 정도 까지 완성한 뒤에 다른 웹 기술도 하나씩 적용해 볼 예정입니다.

곧있으면, 라운드 1-1을 만들 수 있겠네요. 이 게임은 계속 제작할 예정입니다. 포기하긴 싫어요. optionbattle을 만들었을 때와는 다릅니다.

### last update
2022/10/02 ver 0.21-3
이것저것 수정한것이 많은데도 아직 1-1까지만 완성되었습니다.

1. 적들의 스탯을 일부 수정하고 더 편하게 작성할 수 있도록 함수를 추가
2. enimation 부분은 다시 process와 display가 분리되었습니다. 코드 작성이 귀찮아서 합쳐놓았는데, 별로인것 같습니다.
3. round 1-1의 구조를 약간 변경하고, 라운드 관련 몇가지 함수들을 추가했습니다.
4. 일부 적 버그 수정
5. 보조 무기 추가(보조무기는 적을 자동으로 추적합니다.), 이것이 추가된 이유는 일부 무기는 유도성이 없어 화면 바깥에 있는 적을 못찾기 때문입니다.
6. 보조 무기 추가로 무기 밸런스 구조가 변경되었습니다.
6-1. 기존 (일반 1.0 + (스킬 0.8 * 4)) = 총합 4.2
6-2. 현재 (일반 1.0 + 보조 0.2 (스킬 0.8 * 4)) = 총합 4.4
7. multyshot, blasterMini의 추적 방식이 lineChase 방식으로 변경됩니다.
8. 플레이어 죽는 이펙트 추가