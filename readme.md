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
2022/09/14 ver 0.17
한참만이네요. 정보처리기사 공부 도중 코로나에 걸린 이후 모든 의욕을 잃고 1달동안 하스스톤 전장만 했습니다. 그리고 전장 시즌도 끝나고, 아무 생각없이 있다가, 누군가가 웹 오디오 관련 코드 작성을 제안받고 개발 코드를 작성하는 도중에 의욕이 생겨 다시 도전하게 되었습니다. 원래대로라면 지금쯤 라운드 1이 완성되어있어야 할 시점인데 한참 늦어졌네요. 지금, 무슨 코드를 더 작성해야 하는지 기억이 나지 않습니다. 그래서 그냥 제 생각대로 업데이트 할 생각입니다.

지금 업데이트한 내용은 다음과 같습니다.
1. 사운드와 배경음악을 출력할 때 웹 오디오 API를 사용합니다. 배경음악은 약간의 에코 효과가 있습니다.
2. 볼륨을 설정하는 기능이 추가되었습니다. 마스터는 150%까지, 사운드와 배경음악은 100%까지 볼륨 조절이 10%단위로 가능합니다.
3. 옵션에서 설정한 값들이 저장되도록 했습니다. (그러나 아직 일부 옵션은 게임에 적용되지 않습니다.)
4. 임시 배경음악 (과거 optionbattle에서 사용했던것 중 하나) 재생, 그러나 음악이 재생되면 무한 반복되며 정지하지 않습니다.