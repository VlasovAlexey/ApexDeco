/**
 * ApexDeco - Help / FAQ translations.
 * Tab labels for the Help screen are taken from lng.js (HELP_TAB_*).
 * The "About" panel is HTML with data-i18n attributes — translated
 * automatically by the main i18n machinery, do not duplicate it here.
 */
const HelpDataI18n = {

// ===================================================================
// RUSSIAN
// ===================================================================
ru: {
  "Dive Planning": [
    {
      q: "Быстрый старт",
      a: "- Введите глубину, время и состав смеси как уровни (legs) в колонке Bottom Mix & Travel — кнопкой + Add Level.\n\n- Поставьте галочку у тех уровней, которые должны войти в план.\n\n- Введите декосмеси в колонке Deco Mixes кнопкой + Add Deco.\n\n- Поставьте галочку у тех декосмесей, которые должны войти в план.\n\n- При необходимости настройте модель, gradient factors, единицы, скорости и пороги предупреждений в Settings.\n\n- Нажмите Calculate внизу экрана Plan.\n\n- Для повторных погружений после первого плана нажмите Next Dive на экране результата, задайте поверхностный интервал в окне Surface Interval и снова нажмите Calculate — следующий план рассчитается с учётом остаточной газонагрузки тканей."
    },
    {
      q: "Важные моменты",
      a: "- Соблюдайте runtime. Указанное время остановки уже включает время перехода между стопами.\n\n- Не добавляйте лишних остановок на глубоких участках — это значительно увеличит обязательную декомпрессию. Удлинять можно только мелкие стопы — без побочных эффектов.\n\n- Поднимайтесь со скоростью, заложенной в плане. Слишком быстрый или слишком медленный подъём может потребовать дополнительной декомпрессии."
    },
    {
      q: "Особенности планирования в VPM",
      a: "ApexDeco поддерживает модели VPM-B и VPM-B/E. VPM-B/E — расширение для очень глубоких и длинных погружений: добавляет время на мелких остановках, имитируя комбинацию пузырьковой и Halden-моделей для максимальной безопасности. На большинстве погружений B и B/E дают одинаковый результат: B/E начинает отличаться только при больших газонагрузках (≥ 90-100 мин декомпрессии).\n\nVPM в ApexDeco — это тонко настроенный инструмент: следуйте плану строго. Большие отклонения по глубине и времени, особенно на глубоких участках всплытия, недопустимы. Существенные отклонения требуют дополнительного декостопа.\n\nК последним остановкам можно добавлять время без побочных эффектов.\n\nПри наличии декосмесей VPM немного укорачивает средние стопы — даже до фактической смены газа. Это нормально: VPM считает декомпрессию итеративно и заранее учитывает рост сброса газа на богатых смесях.\n\nЕсли в воде вынужденно меняете план из-за потери декогаза — выждите дополнительное время на текущей глубине между двумя планами и продолжайте по новому.\n\nБолее быстрая декомпрессия с глубоких погружений обычно достижима, когда первая смена декогаза происходит на уровне первой остановки или чуть глубже. Деко-смеси с высоким содержанием He после тримикса декомпрессию обычно не ускоряют."
    },
    {
      q: "Глубины переключения декосмесей",
      a: "Все глубины переключения на декосмеси контролируются настройками ppO2 в Settings. Программа выбирает газ из отмеченного списка деко-смесей, исходя из заданных предельных ppO2, для каждого требуемого стопа."
    },
    {
      q: "Travel-газ",
      a: "Смены смеси во время погружения задаются вставкой уровней с временем 0 (минус). Например.\n\nСмена в спуске с travel на bottom-смесь.\n\n25, - , 32 travel 32% до 25м.\n\n95, 30, 12/60 30 мин на 95м, на 12/60.\n\nМногоуровневый спуск со сменой\n\n22, 5, 32 5 мин на 22м, 32%\n\n22, - , 18/30 переход на bottom-смесь при уходе с 22м\n\n65, 20, 18/30 20 мин на 65м на смеси\n\nСмена газа на всплытии в многоуровневом плане.\n\n40, 30, 21 30 мин на 40м, воздух\n\n21, - , 50 переход на 50% при 21м\n\n10, 20, 50 20 мин на 10м\n\nПрограмма читает список уровней сверху вниз и строит план по порядку их следования."
    },
    {
      q: "Многоуровневые планы",
      a: "Программа читает список уровней сверху вниз и строит план в порядке встречи каждого уровня. Многоуровневые планы (и пещерные профили) задаются последовательным указанием каждого уровня (включая смену газа). Например.\n\nМногоуровневый спуск со сменой\n\n22, 5, 32 5 мин на 22м, 32%\n\n22, - , 18/30 переход на bottom-смесь при уходе с 22м\n\n65, 20, 18/30 20 мин на 65м на смеси\n\nМногоуровневое всплытие.\n\n40, 30, 21 30 мин на 40м, воздух\n\n10, 20, 21 20 мин на 10м, воздух\n\nМногоуровневое всплытие со сменами газа.\n\n55, 25, 18/25 25 мин на 55м, смесь 18/25\n\n21, - , 50 переход на 50% при 21м\n\n10, 20, 50 20 мин на 10м, 50%\n\nПилообразное многоуровневое погружение.\n\n60, 25, 18/30 25 мин на 60м, смесь 18/30\n\n10, 20, 21 20 мин на 10м, переход на воздух\n\n30, 15, 21 снова вниз на 30м на воздухе\n\n15, 25, 21 на 15м 25 мин на воздухе\n\nЛюбой газ из колонки Deco Mixes не используется до завершения последнего leg-а. Если нужно сменить газ в середине воды — вставьте уровень с временем 0.\n\nНа многоуровневых всплытиях со значительной разницей между уровнями ApexDeco автоматически вставляет промежуточные декостопы перед достижением следующего уровня."
    },
    {
      q: "Консерватизм",
      a: "Опыт пользователей сложился в такие рекомендации. Nominal — для военных дайверов и людей в идеальной форме. +2 или +3 — нормальная настройка для большинства. +3 или +4 — при тяжёлой работе, холоде, серии многодневных погружений, для дополнительной безопасности или при анамнезе ДКБ.\n\nВнутри программы консерватизм увеличивает критические радиусы микроядер N2/He в алгоритме VPM. Прибавки от базы: 1 = 5%, 2 = 12%, 3 = 22%, 4 = 35%, 5 = 50%. Critical Volume включён по умолчанию.\n\nПо сути, выбирается порог размера микроядер, ограничивающий профиль на всплытии и декомпрессии. Это работает в обратную сторону: больший радиус → более консервативный план.\n\nНа некоторых погружениях рост консерватизма даёт мало эффекта — это нормально: в какой-то момент декомпрессия уже завершена, и добавочный консерватизм ничего не меняет.\n\nНе фальсифицируйте консерватизм в VPM, искусственно завышая глубину или время при Nominal: это занижает повторный коэффициент, и последующие планы получат недостаточную декомпрессию."
    }
  ],
  "Settings": [
    {
      q: "Конфигурация",
      a: "Настройки в ApexDeco сгруппированы в карточки. Ниже — что делает каждый элемент.\n\n## Appearance\n\n- Language: язык интерфейса (English, Русский, Español, 中文, हिन्दी).\n\n- Interface Style: светлая или тёмная тема. Выбор сохраняется между сессиями.\n\n## Model Settings\n\n- Circuit: OC или CCR. При переключении меняется и список Bottom Mix & Travel — уровни OC и CCR хранятся раздельно.\n\n- Deco Model: ZH-L16C с Gradient Factors, VPM-B или VPM-B/E.\n\n- Conservatism: 0…4 — используется в VPM-B / VPM-B/E. Большее значение увеличивает критические радиусы пузырьков и удлиняет декомпрессию. На Bühlmann GF не влияет (там работают GF Lo / GF Hi).\n\n- GF Lo / GF Hi: gradient factors Bühlmann, контролируют глубокие стопы и насыщение на всплытии.\n\n- GFS Hi (Bailout): GF Hi, используемый при пересчёте плана бейлаута.\n\n- O2 Narcotic: учитывать парциальное давление O2 при вычислении END.\n\n## Unit Settings\n\n- Depth Units: метры или футы (для отображения и ввода).\n\n- Water Type: пресная или солёная (SG 1.026). Влияет на ambient pressure на метр глубины.\n\n- Altitude / Acclimatized: высота места погружения и высота, к которой акклиматизирован дайвер. Корректирует ambient pressure для горных погружений.\n\n- Gas Volume: литры или кубические футы для расчёта расхода газа.\n\n- Pressure Units: бар или psi для давлений в баллонах.\n\n- Gauge Type: тип манометра / нормировка, используется в газовых расчётах.\n\n- Temperature: окружающая температура, используется в Tools.\n\n## Descent / Ascent Rates\n\n- Descent Rate: скорость спуска.\n\n- Ascent Rate: скорость подъёма с дна до первого стопа.\n\n- Deco Ascent Rate: скорость подъёма между декостопами.\n\n- Surface Ascent Rate: скорость подъёма с последнего стопа на поверхность.\n\n## Deco Stop Settings\n\n- Step Size: шаг между декостопами.\n\n- Last Stop (OC) / Last Stop (CCR): глубина последнего стопа. Раздельно для OC и CCR.\n\n- Min Stop Time: минимальная длительность стопа, которую выдаёт планировщик.\n\n- ppO2 Deco Swap: ppO2, при котором планировщик переключается на декосмесь.\n\n- ppO2 28-45% mix / ppO2 45-99% mix / ppO2 Bottom Max: пределы ppO2 по диапазонам O2, ограничивающие выбор газа на каждой глубине.\n\n- O2 100% Max Depth: максимальная глубина использования чистого O2 как декосмеси.\n\n- First Stop 30sec / First Stop Double Step: настройки формы самого глубокого стопа.\n\n## CCR Settings\n\n- Default Setpoint: setpoint, действующий до первого setpoint, заданного на уровне.\n\n- SP Units: бар или ATA для setpoint.\n\n## RMV / Gas Planning\n\n- Bottom RMV: расход (поверхностный эквивалент) на спуске и дне.\n\n- Deco RMV: расход на декостопах.\n\n## Extended Stops\n\n- Extended Stops: главный переключатель.\n\n- Add time to stop: On — добавлять время к требуемому стопу; Off — брать максимум из требуемого и заданного.\n\n- All mix changes: On — расширять каждый стоп; Off — только стопы со сменой декосмеси.\n\n- O2 window effect: On — расширение применяется только когда новый газ имеет более высокий ppO2.\n\n- 7..30 m / 30 + m: добавочные минуты на мелких и глубоких стопах (граница — 30 м / 100 фт).\n\n## Warning Thresholds\n\n- Описание каждого порога — в разделе \"Уровни и цвета предупреждений\".\n\n## Bailout Settings\n\n- Bailout Plan: On — ApexDeco строит дополнительный план бейлаута рядом с основным, исходя из отказа на самой глубокой точке.\n\n- Bailout Model / Bailout GF Lo / Bailout GF Hi / Bailout GFS Hi: модель и gradient factors для пересчёта бейлаута, независимые от основных.\n\n- Bailout RMV: расход газа при расчёте объёмов бейлаута.\n\n- Extra Bottom Min / Extra Time: дополнительные минуты на дне до точки отказа и добавочное время на всплытие при бейлауте.\n\n- Bailout Dive # / Cave Type Bail / Return Portion: пещерный бейлаут — часть плана дублируется как возвратный участок.\n\n## Surface Interval / Multi-dive\n\n- Окно Surface Interval добавляет поверхностный интервал между погружениями, чтобы ткани успевали разгружаться перед следующим планом.\n\n- 2-Week OTU: накопленный OTU за прошлые две недели; используется в предупреждении о суммарном OTU.\n\n- Travel Gas O2% / He%: газ, которым дайвер дышит на поверхности (обычно воздух)."
    },
    {
      q: "Уровни и цвета предупреждений",
      a: "ApexDeco проверяет рассчитанный план на опасные условия и показывает их над таблицей Dive Plan Result. Каждый элемент карточки \"Warning Thresholds\" включает свою проверку и задаёт её предел; новый порог вступает в силу при следующем Calculate. Используются два стиля — красный (error) для жизненно важных пределов и оранжевый (warning) для предупреждений; пользовательского пикера цвета на каждое предупреждение нет.\n\nВыполняются следующие проверки.\n\n- ppO2 High: любой сегмент, где вдыхаемое ppO2 превышает порог (по умолчанию 1.6 бар), отмечается красным. Для OC значение fO2×pAmb; для CCR-разбавителя — активный setpoint, ограниченный ambient.\n\n- ppO2 Low: сегмент с ppO2 ниже порога (по умолчанию 0.16 бар) помечается красным как гипоксический. CCR использует ту же логику с setpoint, что и таблицы плана.\n\n- CNS % above: суммарная нагрузка CNS на конец погружения выше порога (по умолчанию 80%) — красное.\n\n- OTU above: суммарный OTU на конец погружения выше порога (по умолчанию 300) — оранжевое.\n\n- 2-Week OTU: при ненулевом значении \"2-Week OTU\" в карточке Surface Interval суммарная нагрузка (накопленный + текущий) сравнивается с 300 и помечается при превышении.\n\n- IBCD N2 / IBCD He: на каждой смене газа ApexDeco сравнивает вдыхаемые ppN2 и ppHe нового и предыдущего газа. Скачок выше порога (по умолчанию 0.5 ATA) помечается как риск Isobaric Counter Diffusion.\n\n- CCR diluent check: при включении планировщик проверяет, что ppO2 разбавителя остаётся в разумных пределах относительно активного setpoint на глубине сегмента, и помечает гипоксические или гипероксические условия в петле."
    }
  ],
  "VPM info": [
    {
      q: "О моделях VPM и VPM-B",
      a: "Varying Permeability Model (VPM) — пузырьковая модель декомпрессии, контролирующая рост пузырьков через критические радиусы микроядер в тканях. ApexDeco предлагает VPM-B для повседневной технической практики и VPM-B/E как расширение, добавляющее время на мелких стопах при больших декообязательствах (около 90-100 мин) — для самой безопасной формы профиля на очень глубоких и длинных погружениях. VPM-B/FBO — вариант для бейлаута, ускоряющий глубокую часть всплытия для уменьшения объёма OC-газа."
    },
    {
      q: "Данные модели VPM",
      a: "VPM остаётся экспериментальной: большой рецензируемой выборки нет, есть полевая практика на тысячах задокументированных погружений. Относитесь к ней как к точно настроенному инструменту: модель требует дисциплины по глубине и времени на декомпрессии. Если вы новичок в VPM — начните с консерватизма +4 и удлините последние два-три стопа; со временем, по мере доверия профилю, можно опуститься к +2 / +3."
    },
    {
      q: "История VPM",
      a: "VPM была разработана в 1970-е годы Yount, Hoffman и др., которые моделировали образование и рост пузырьков из растворённого газа в живой ткани. В последующие десятилетия её доработали в VPM-B (с поправкой Бойля) Bruce Wienke и Erik Baker — именно эту форму знают большинство технических дайверов сегодня. ApexDeco реализует VPM-B и VPM-B/E с настраиваемым консерватизмом, позволяя выбрать запас безопасности под конкретное погружение."
    }
  ]
},

// ===================================================================
// SPANISH
// ===================================================================
es: {
  "Dive Planning": [
    {
      q: "Inicio rápido",
      a: "- Introduzca profundidad, tiempo y mezcla como tramos (legs) en la columna Bottom Mix & Travel mediante el botón + Add Level.\n\n- Marque la casilla junto a los tramos que deben incluirse en el plan.\n\n- Introduzca las mezclas de descompresión en la columna Deco Mixes mediante + Add Deco.\n\n- Marque las mezclas deco que deban incluirse en el plan.\n\n- Si lo desea, ajuste el modelo, los gradient factors, las unidades, las velocidades y los umbrales de aviso en Settings.\n\n- Pulse el botón Calculate al pie de la pantalla Plan.\n\n- Para inmersiones sucesivas, tras el primer plan pulse Next Dive en la pantalla de resultados, fije el intervalo en superficie en el modal Surface Interval y vuelva a pulsar Calculate — el siguiente plan partirá de la carga de tejidos heredada de la inmersión anterior."
    },
    {
      q: "Puntos importantes",
      a: "- Respete los runtimes. El tiempo mostrado en cada parada ya incluye el tránsito entre paradas.\n\n- No añada paradas adicionales en la parte profunda — esto incrementa de forma significativa la obligación de descompresión. Las paradas someras pueden alargarse sin efectos secundarios.\n\n- Realice los ascensos a la velocidad del plan. Subir más rápido o más lento puede requerir descompresión adicional."
    },
    {
      q: "Consideraciones de planificación en VPM",
      a: "ApexDeco ofrece VPM-B y VPM-B/E. VPM-B/E es una extensión para inmersiones muy profundas y largas: añade tiempo en las paradas someras combinando un modelo de burbujas solapadas y uno tipo Haldane, para máxima seguridad. En la mayoría de inmersiones B y B/E coinciden; B/E sólo empieza a divergir con cargas grandes (≥ 90-100 minutos de deco).\n\nVPM en ApexDeco es una herramienta finamente afinada: siga el plan con disciplina. Las grandes desviaciones en profundidad y tiempo durante la descompresión deben evitarse, sobre todo en la parte profunda del ascenso. Las desviaciones grandes obligan a añadir tiempo extra.\n\nPuede añadir tiempo a las últimas paradas sin efectos adversos.\n\nLos planes con mezclas deco generan tiempos algo más cortos en las paradas medias — incluso antes de cambiar de gas. Es normal: VPM resuelve la deco de forma iterativa y prevé la mayor capacidad de off-gas en las mezclas ricas posteriores.\n\nSi en agua se ve obligado a un plan nuevo (gas perdido / dañado), espere en el nivel actual el tiempo extra entre los dos planes y luego siga el nuevo plan.\n\nUna deco más rápida desde inmersiones profundas suele lograrse cuando el primer cambio a gas deco está al nivel de la primera parada o algo más profundo. Las mezclas deco con He alto tras buceos en trimix normalmente no aceleran la deco."
    },
    {
      q: "Profundidades de cambio a gas deco",
      a: "Todas las profundidades de cambio a gas deco se controlan con los ajustes de ppO2 en Settings. El programa elige una mezcla de la lista de gases deco marcada, según los ppO2 máximos configurados, para cada parada requerida."
    },
    {
      q: "Gas de tránsito (travel)",
      a: "Los cambios de mezcla durante la inmersión se introducen como tramos con tiempo cero (-). Por ejemplo.\n\nCambio en descenso de travel a bottom mix.\n\n25, - , 32 travel 32% hasta 25m.\n\n95, 30, 12/60 30 min a 95m con 12/60.\n\nDescenso multinivel con cambio\n\n22, 5, 32 5 min a 22m con 32%\n\n22, - , 18/30 cambio a la bottom al salir de 22m\n\n65, 20, 18/30 20 min a 65m con la mezcla\n\nCambio de gas en ascenso, en plan multinivel.\n\n40, 30, 21 30 min a 40m, aire\n\n21, - , 50 cambio a 50% en ascenso a 21m\n\n10, 20, 50 20 min a 10m\n\nEl programa lee la lista de tramos de arriba a abajo y construye el plan en el orden en que aparecen."
    },
    {
      q: "Planes multinivel",
      a: "El programa lee la lista de tramos de arriba a abajo y arma el plan en orden. Los planes multinivel (o perfiles de cueva) se introducen especificando cada nivel (incluido el cambio de gas) en secuencia. Por ejemplo.\n\nDescenso multinivel con cambio\n\n22, 5, 32 5 min a 22m con 32%\n\n22, - , 18/30 cambio a la bottom al salir de 22m\n\n65, 20, 18/30 20 min a 65m con la mezcla\n\nAscenso multinivel.\n\n40, 30, 21 30 min a 40m, aire\n\n10, 20, 21 20 min a 10m, aire\n\nAscenso multinivel con cambios de gas.\n\n55, 25, 18/25 25 min a 55m, mezcla 18/25\n\n21, - , 50 cambio a 50% a 21m\n\n10, 20, 50 20 min a 10m, 50%\n\nInmersión multinivel en sierra.\n\n60, 25, 18/30 25 min a 60m, mezcla 18/30\n\n10, 20, 21 20 min a 10m, cambio a aire\n\n30, 15, 21 de vuelta abajo a 30m con aire\n\n15, 25, 21 a 15m durante 25 min con aire\n\nLos gases de la columna Deco Mixes no se utilizan hasta procesar el último tramo. Si necesita un cambio de gas en mitad del ascenso, inserte un tramo con tiempo cero.\n\nEn ascensos multinivel con saltos amplios entre niveles, ApexDeco insertará paradas de descompresión en mitad del agua antes de alcanzar el siguiente nivel."
    },
    {
      q: "Conservadurismo",
      a: "La experiencia recomienda lo siguiente. Nominal — para buzos militares o personas en forma excepcional. +2 o +3 — el ajuste habitual para la mayoría. +3 o +4 — con esfuerzo intenso, frío, varios días seguidos de inmersiones, seguridad extra o antecedentes de DCS.\n\nDentro del programa, el conservadurismo aumenta los radios críticos de los micronúcleos de N2/He en VPM. Aumentos: 1 = 5%, 2 = 12%, 3 = 22%, 4 = 35%, 5 = 50%. Critical Volume está activado por defecto.\n\nEsto elige el umbral del tamaño de los micronúcleos que limita el ascenso y la descompresión. Funciona en sentido inverso: un radio mayor significa un plan más conservador.\n\nEn algunas inmersiones, subir el conservadurismo apenas cambia nada — es normal: a partir de cierto punto la descompresión ya está completa.\n\nNo simule conservadurismo en VPM (p. ej. usando Nominal y exagerando profundidad o tiempo): eso reduce el factor repetitivo y los planes posteriores tendrán deco insuficiente."
    }
  ],
  "Settings": [
    {
      q: "Configuración",
      a: "Los ajustes en ApexDeco están agrupados en tarjetas. A continuación se describe cada control.\n\n## Appearance\n\n- Language: idioma del interfaz (English, Русский, Español, 中文, हिन्दी).\n\n- Interface Style: tema claro u oscuro. La elección se recuerda entre sesiones.\n\n## Model Settings\n\n- Circuit: OC o CCR. Cambiar de circuito intercambia también la lista Bottom Mix & Travel — los niveles OC y CCR se guardan por separado.\n\n- Deco Model: ZH-L16C con Gradient Factors, VPM-B o VPM-B/E.\n\n- Conservatism: 0…4 — utilizado en VPM-B / VPM-B/E. Valores mayores aumentan los radios críticos de las burbujas y prolongan la deco. No afecta a Bühlmann GF (que se controla con GF Lo / GF Hi).\n\n- GF Lo / GF Hi: factores de gradiente de Bühlmann, controlan paradas profundas y tensión en superficie.\n\n- GFS Hi (Bailout): GF Hi usado en el recálculo del plan de bailout.\n\n- O2 Narcotic: incluir la presión parcial del O2 al calcular END.\n\n## Unit Settings\n\n- Depth Units: metros o pies (visualización y entrada).\n\n- Water Type: agua dulce o salada (SG 1.026). Afecta a la presión ambiente por metro.\n\n- Altitude / Acclimatized: altitud del lugar de buceo y altitud a la que el buzo está aclimatado. Corrige la presión ambiente para buceo en altura.\n\n- Gas Volume: litros o pies cúbicos para los resultados de consumo.\n\n- Pressure Units: bar o psi para presiones de botella.\n\n- Gauge Type: convención del manómetro / cilindro usada en cálculos de gas.\n\n- Temperature: temperatura ambiente, usada por las herramientas de mezcla.\n\n## Descent / Ascent Rates\n\n- Descent Rate: velocidad de descenso.\n\n- Ascent Rate: velocidad de ascenso desde el fondo a la primera parada.\n\n- Deco Ascent Rate: velocidad entre paradas deco.\n\n- Surface Ascent Rate: velocidad desde la última parada a la superficie.\n\n## Deco Stop Settings\n\n- Step Size: separación entre paradas deco.\n\n- Last Stop (OC) / Last Stop (CCR): profundidad de la última parada. Valores separados para OC y CCR.\n\n- Min Stop Time: duración mínima de parada que el planificador emitirá.\n\n- ppO2 Deco Swap: ppO2 al que el planificador cambia a un gas deco.\n\n- ppO2 28-45% mix / ppO2 45-99% mix / ppO2 Bottom Max: límites de ppO2 por rango de O2 que regulan qué mezcla se elige a cada profundidad.\n\n- O2 100% Max Depth: profundidad máxima para usar O2 puro como deco.\n\n- First Stop 30sec / First Stop Double Step: opciones de forma de la parada más profunda.\n\n## CCR Settings\n\n- Default Setpoint: setpoint aplicado antes de que entre el primer setpoint definido en un nivel.\n\n- SP Units: bar o ATA para los setpoints.\n\n## RMV / Gas Planning\n\n- Bottom RMV: consumo (equivalente a superficie) en descenso y fondo.\n\n- Deco RMV: consumo en paradas deco.\n\n## Extended Stops\n\n- Extended Stops: interruptor maestro.\n\n- Add time to stop: On — el tiempo extra se añade al requerido; Off — se toma el máximo entre el requerido y la extensión.\n\n- All mix changes: On — todas las paradas se extienden; Off — sólo en cambios de mezcla deco.\n\n- O2 window effect: On — la extensión sólo se aplica si el nuevo gas tiene un ppO2 inspirado mayor que el anterior.\n\n- 7..30 m / 30 + m: minutos extra en paradas someras y profundas (frontera 30 m / 100 ft).\n\n## Warning Thresholds\n\n- Vea el tema \"Niveles y colores de aviso\" para qué hace cada umbral.\n\n## Bailout Settings\n\n- Bailout Plan: On — ApexDeco genera una tarjeta adicional Bailout Plan junto al plan principal, asumiendo el bailout en el nivel más profundo.\n\n- Bailout Model / Bailout GF Lo / Bailout GF Hi / Bailout GFS Hi: modelo y gradient factors usados en el recálculo del bailout, independientes del plan principal.\n\n- Bailout RMV: consumo de gas usado al calcular los volúmenes del bailout.\n\n- Extra Bottom Min / Extra Time: minutos extra de fondo antes del fallo y tiempo añadido al ascenso de bailout.\n\n- Bailout Dive # / Cave Type Bail / Return Portion: bailout estilo cueva, donde se duplica parte del plan como tramo de retorno.\n\n## Surface Interval / Multi-dive\n\n- El modal Surface Interval aplica tiempo de superficie entre inmersiones para que los tejidos descarguen antes del siguiente plan.\n\n- 2-Week OTU: carga de OTU acumulada de las dos semanas anteriores; usada por el aviso de OTU acumulada.\n\n- Travel Gas O2% / He%: gas respirado durante el intervalo en superficie (típicamente aire)."
    },
    {
      q: "Niveles y colores de aviso",
      a: "ApexDeco analiza el plan calculado en busca de condiciones inseguras y las muestra encima del Dive Plan Result. Cada control de la tarjeta \"Warning Thresholds\" activa un aviso y fija su límite; el umbral surte efecto en el siguiente Calculate. Se usan dos estilos automáticamente — rojo (error) para límites de seguridad vital y naranja (warning) para advertencias; no hay selector de color por aviso.\n\nSe realizan estas comprobaciones.\n\n- ppO2 High: cualquier segmento cuyo ppO2 inspirado supere el umbral (1.6 bar por defecto) se marca en rojo. En OC el valor es fO2×pAmb; en CCR sobre diluente, el setpoint activo limitado por ambiente.\n\n- ppO2 Low: segmento con ppO2 inferior al umbral (0.16 bar por defecto) se marca en rojo como hipóxico. CCR usa la misma lógica con setpoint que las tablas de plan.\n\n- CNS % above: carga de CNS al final de la inmersión por encima del umbral (80 % por defecto) — rojo.\n\n- OTU above: OTU al final de la inmersión por encima del umbral (300 por defecto) — naranja.\n\n- 2-Week OTU: si \"2-Week OTU\" en la tarjeta Surface Interval no es cero, la carga acumulada (acumulado + esta inmersión) se compara con 300 y se avisa al superarlo.\n\n- IBCD N2 / IBCD He: en cada cambio de gas, ApexDeco compara los ppN2 y ppHe inspirados de la mezcla nueva con la previa. Un salto que supere el umbral (0.5 ATA por defecto) se marca como riesgo de Isobaric Counter Diffusion.\n\n- CCR diluent check: cuando está activo, el planificador comprueba que el ppO2 del diluente se mantenga dentro de límites razonables respecto al setpoint activo a la profundidad del segmento, y avisa de condiciones de bucle hipóxicas o hiperóxicas."
    }
  ],
  "VPM info": [
    {
      q: "VPM y VPM-B",
      a: "El Varying Permeability Model (VPM) es un modelo de descompresión basado en burbujas, que controla su tamaño siguiendo los radios críticos de los micronúcleos en los tejidos. ApexDeco ofrece VPM-B para uso técnico habitual, y VPM-B/E como extensión que añade tiempo en paradas someras cuando la obligación de descompresión es grande (alrededor de 90-100 minutos), para el perfil más seguro posible en inmersiones muy profundas / largas. VPM-B/FBO es una variante de bailout que acelera el ascenso profundo para reducir el volumen de gas en circuito abierto."
    },
    {
      q: "Datos del modelo VPM",
      a: "VPM es experimental: no existe un dataset amplio con revisión por pares; sólo experiencia de campo de muchos miles de inmersiones registradas. Trátelo como un modelo afinado: requiere control disciplinado de profundidad y tiempo durante la descompresión. Si es nuevo en VPM, comience con conservadurismo +4 y añada tiempo a las dos o tres últimas paradas; con el tiempo, según gane confianza en el perfil, baje a +2 / +3."
    },
    {
      q: "Historia de VPM",
      a: "VPM fue desarrollado en los años 1970 por Yount, Hoffman y otros, que modelaron cómo los gases disueltos forman y hacen crecer burbujas en los tejidos vivos. En las décadas siguientes se refinó como VPM-B (con corrección de Boyle) por Bruce Wienke y Erik Baker — la forma que la mayoría de buzos técnicos conocen hoy. ApexDeco implementa VPM-B y VPM-B/E con conservadurismo ajustable, para que el buzo elija el margen de seguridad adecuado a la inmersión."
    }
  ]
},

// ===================================================================
// CHINESE (Simplified)
// ===================================================================
zh: {
  "Dive Planning": [
    {
      q: "快速开始",
      a: "- 在 Bottom Mix & Travel 列中通过 + Add Level 按钮输入深度、时间和气体作为段（leg）。\n\n- 勾选要纳入计划的段。\n\n- 在 Deco Mixes 列中通过 + Add Deco 按钮输入减压气。\n\n- 勾选要纳入计划的减压气。\n\n- 如有需要，在 Settings 中调整模型、梯度因子（GF）、单位、上升/下潜速度和警告阈值。\n\n- 点击 Plan 屏幕底部的 Calculate。\n\n- 重复潜水时，在结果屏幕按 Next Dive，在 Surface Interval 弹窗中设置水面间歇，再次按 Calculate — 下一次潜水将沿用上一次的组织残余载荷。"
    },
    {
      q: "重要事项",
      a: "- 严格按照 runtime 执行。停留时间已包含两段停留之间的过渡时间。\n\n- 不要在深部段额外加停 — 这会显著增加减压义务。浅停留可以在不影响安全的前提下延长。\n\n- 上升速率必须按计划执行。过快或过慢都可能需要额外减压。"
    },
    {
      q: "VPM 规划要点",
      a: "ApexDeco 提供 VPM-B 和 VPM-B/E 两种模型。VPM-B/E 是为非常深、非常长的潜水设计的扩展：在浅停加额外时间，结合气泡叠加模型与 Haldane 模型，达到最高安全余度。对大多数潜水，B 与 B/E 结果相同；只有当减压义务很大（约 90-100 分钟）时 B/E 才开始偏离。\n\nApexDeco 中的 VPM 经过精细调校，必须严格遵照计划。减压期间在深度和时间上的大幅偏离应避免，尤其在上升的深部段。明显偏差需要追加减压时间。\n\n最后几个停留可以在不产生副作用的情况下延长。\n\n带减压气的计划在中段停留会比预期略短 — 即使尚未切换气体。这是正常的：VPM 以迭代方式计算减压，并预先考虑后续高 O2 减压气的更强排气能力。\n\n如果在水中因丢失/损坏减压气被迫切换计划，应在当前深度补足两个计划之间的差额时间，再按新计划继续。\n\n深潜的更快减压通常发生在第一次切换减压气恰好处于第一停留的水平或略深时。富 He 减压气在 trimix 之后通常不会加速减压。"
    },
    {
      q: "减压气切换深度",
      a: "所有切换到减压气的深度均由 Settings 中的 ppO2 参数决定。程序会从勾选的减压气列表中，根据各停留所需的最大 ppO2 选择气体。"
    },
    {
      q: "过渡气（Travel gas）",
      a: "潜水中的气体切换通过插入时间为 0 (-) 的段来实现。例如。\n\n下降时从 travel 切到 bottom mix。\n\n25, - , 32 travel 32% 到 25m。\n\n95, 30, 12/60 在 95m 停留 30 分钟，使用 12/60。\n\n多级下降并切换气体\n\n22, 5, 32 在 22m 停 5 分钟，32%\n\n22, - , 18/30 离开 22m 时切到 bottom\n\n65, 20, 18/30 在 65m 停 20 分钟\n\n多级上升中切换气体。\n\n40, 30, 21 在 40m 停 30 分钟，空气\n\n21, - , 50 上升至 21m 切到 50%\n\n10, 20, 50 在 10m 停 20 分钟\n\n程序自上而下读取段列表，并按照遇到的顺序构建计划。"
    },
    {
      q: "多级计划",
      a: "程序自上而下读取段列表，按顺序构建计划。多级计划（或洞穴剖面）通过依次列出每一级（包括气体切换）实现。例如。\n\n多级下降并切换气体\n\n22, 5, 32 在 22m 停 5 分钟，32%\n\n22, - , 18/30 离开 22m 时切到 bottom\n\n65, 20, 18/30 在 65m 停 20 分钟\n\n多级上升。\n\n40, 30, 21 在 40m 停 30 分钟，空气\n\n10, 20, 21 在 10m 停 20 分钟，空气\n\n带气体切换的多级上升。\n\n55, 25, 18/25 在 55m 停 25 分钟，18/25\n\n21, - , 50 在 21m 切到 50%\n\n10, 20, 50 在 10m 停 20 分钟，50%\n\n锯齿型多级潜水。\n\n60, 25, 18/30 在 60m 停 25 分钟，18/30\n\n10, 20, 21 在 10m 停 20 分钟，切到空气\n\n30, 15, 21 再次下到 30m，空气\n\n15, 25, 21 上到 15m 停 25 分钟，空气\n\n以上情形中，Deco Mixes 列里的气体在最后一段处理完之前都不会被使用。如需中途切换气体，请插入时间为 0 的段。\n\n在层间差距较大的多级上升中，ApexDeco 会在到达下一级之前自动插入水中减压停留。"
    },
    {
      q: "保守度（Conservatism）",
      a: "实践经验给出如下建议。Nominal 适用于海军潜水员和身体极佳者。+2 或 +3 是绝大多数潜水员的常用设置。+3 或 +4 适用于体力消耗大、寒冷、连续多日潜水、需要额外安全或既往有 DCS 史的情况。\n\n在程序内部，保守度会增大 VPM 算法中 N2/He 微核的临界半径。增量：1 = 5%, 2 = 12%, 3 = 22%, 4 = 35%, 5 = 50%。Critical Volume 默认开启。\n\n本质上是选择限制上升和减压的微核半径阈值，作用方向相反：半径越大计划越保守。\n\n部分潜水即使提高保守度也几乎无变化 — 这是正常的：超过某个点，减压已经完成，再加保守度也无效。\n\n请勿在 VPM 中伪造保守度（例如使用 Nominal 同时虚增深度或时间）：这会降低重复因子，导致后续计划的减压不足。"
    }
  ],
  "Settings": [
    {
      q: "配置",
      a: "ApexDeco 的设置以卡片形式分组。下面解释每个控件。\n\n## Appearance\n\n- Language: 界面语言（English、Русский、Español、中文、हिन्दी）。\n\n- Interface Style: 浅色或深色主题。选择会在会话间保留。\n\n## Model Settings\n\n- Circuit: OC 或 CCR。切换电路时也会切换 Bottom Mix & Travel 列表 — OC 与 CCR 的级是分开存储的。\n\n- Deco Model: ZH-L16C with Gradient Factors、VPM-B 或 VPM-B/E。\n\n- Conservatism: 0…4 — 仅 VPM-B / VPM-B/E 使用。值越大，临界气泡半径越大，减压时间越长。对 Bühlmann GF 不起作用（由 GF Lo / GF Hi 控制）。\n\n- GF Lo / GF Hi: Bühlmann 梯度因子，控制深停和出水紧张度。\n\n- GFS Hi (Bailout): bailout 计划重算时使用的 GF Hi。\n\n- O2 Narcotic: 计算 END 时是否将 O2 视为有麻醉性。\n\n## Unit Settings\n\n- Depth Units: 米或英尺（显示和输入）。\n\n- Water Type: 淡水或盐水（SG 1.026）。影响每米对应的环境压力。\n\n- Altitude / Acclimatized: 潜点海拔与潜水员适应的海拔。用于高海拔潜水的环境压修正。\n\n- Gas Volume: 升或立方英尺，用于耗气量结果。\n\n- Pressure Units: bar 或 psi，用于气瓶压力。\n\n- Gauge Type: 气瓶/压力表规格规范，用于耗气计算。\n\n- Temperature: 环境温度，混气工具会使用。\n\n## Descent / Ascent Rates\n\n- Descent Rate: 下降速率。\n\n- Ascent Rate: 从底部到第一停的上升速率。\n\n- Deco Ascent Rate: 减压停留之间的上升速率。\n\n- Surface Ascent Rate: 从最后一停到水面的上升速率。\n\n## Deco Stop Settings\n\n- Step Size: 减压停留间距。\n\n- Last Stop (OC) / Last Stop (CCR): 最后一停的深度。OC 与 CCR 分别配置。\n\n- Min Stop Time: 程序输出的最小停留时长。\n\n- ppO2 Deco Swap: 决定切换到减压气的 ppO2 阈值。\n\n- ppO2 28-45% mix / ppO2 45-99% mix / ppO2 Bottom Max: 按 O2 范围划分的 ppO2 上限，约束各深度的可选混气。\n\n- O2 100% Max Depth: 使用纯 O2 作为减压气的最大深度。\n\n- First Stop 30sec / First Stop Double Step: 最深停留的形态选项。\n\n## CCR Settings\n\n- Default Setpoint: 在第一个由级定义的 setpoint 生效之前所采用的 setpoint。\n\n- SP Units: setpoint 的单位（bar 或 ATA）。\n\n## RMV / Gas Planning\n\n- Bottom RMV: 下潜与底段使用的水面等效耗气率。\n\n- Deco RMV: 减压停留使用的耗气率。\n\n## Extended Stops\n\n- Extended Stops: 总开关。\n\n- Add time to stop: On — 把延长时间叠加到所需停留时间上；Off — 取所需与延长两者中的较大值。\n\n- All mix changes: On — 所有停留都延长；Off — 仅在切换减压气的停留延长。\n\n- O2 window effect: On — 仅当新气的吸入 ppO2 高于前一气体时才延长。\n\n- 7..30 m / 30 + m: 浅停与深停的额外分钟数（边界为 30m / 100ft）。\n\n## Warning Thresholds\n\n- 关于每个阈值的作用，请参阅 \"警告级别与颜色\"。\n\n## Bailout Settings\n\n- Bailout Plan: 开启时，ApexDeco 在主计划旁生成 Bailout Plan 卡片，假设在最深处发生 bailout。\n\n- Bailout Model / Bailout GF Lo / Bailout GF Hi / Bailout GFS Hi: 用于 bailout 重算的减压模型和梯度因子，与主计划设置独立。\n\n- Bailout RMV: 计算 bailout 气量时使用的耗气率。\n\n- Extra Bottom Min / Extra Time: 故障点之前在底段加的额外分钟数，以及 bailout 上升中追加的时间。\n\n- Bailout Dive # / Cave Type Bail / Return Portion: 洞穴式 bailout，复制部分计划以模拟回程。\n\n## Surface Interval / Multi-dive\n\n- Surface Interval 弹窗设置潜水之间的水面时间，让组织在下一次计划前完成排气。\n\n- 2-Week OTU: 过去两周累计的 OTU 残余，用于累计 OTU 警告。\n\n- Travel Gas O2% / He%: 水面间歇期间呼吸的气体（通常为空气）。"
    },
    {
      q: "警告级别与颜色",
      a: "ApexDeco 会扫描计算出的计划是否存在不安全条件，并在 Dive Plan Result 之上列出。\"Warning Thresholds\" 卡片中的每个控件可单独开关并设置阈值；新阈值在下一次 Calculate 时生效。系统自动使用两种颜色 — 红色（error）用于关乎生命的极限，橙色（warning）用于建议性提醒；不提供逐项颜色选择。\n\n执行以下检查。\n\n- ppO2 High: 任何吸入 ppO2 超过阈值（默认 1.6 bar）的段标红。OC 时为 fO2×pAmb；CCR 稀释气段为受环境压限制后的当前 setpoint。\n\n- ppO2 Low: ppO2 低于阈值（默认 0.16 bar）的段标红，视为低氧。CCR 使用与计划表相同的 setpoint 感知逻辑。\n\n- CNS % above: 潜水末 CNS 累积超过阈值（默认 80%）标红。\n\n- OTU above: 潜水末 OTU 超过阈值（默认 300）标橙。\n\n- 2-Week OTU: 如果 Surface Interval 卡片中的 \"2-Week OTU\" 非零，则将累计载荷（残余+本次）与 300 比较，超过时报警。\n\n- IBCD N2 / IBCD He: 每次气体切换时，比较新旧气体的吸入 ppN2 与 ppHe。跳变超过阈值（默认 0.5 ATA）标记为同压逆向扩散（Isobaric Counter Diffusion）风险。\n\n- CCR diluent check: 启用时，验证稀释气在该段深度上相对当前 setpoint 是否在合理范围，并提示低氧或高氧的回路状态。"
    }
  ],
  "VPM info": [
    {
      q: "VPM 与 VPM-B 模型介绍",
      a: "Varying Permeability Model（VPM）是一种基于气泡的减压模型，通过追踪组织中临界微核的半径来控制气泡尺寸。ApexDeco 提供 VPM-B 用于日常技术潜水，并提供 VPM-B/E 作为扩展，在减压义务较大（约 90-100 分钟）时增加浅停时间，为非常深 / 非常长的潜水提供尽可能安全的剖面。VPM-B/FBO 是 bailout 变体，加快深部上升以减少开式电路的耗气量。"
    },
    {
      q: "VPM 模型数据",
      a: "VPM 仍属于实验性模型：缺乏大规模同行评议数据，仅有数千次记录潜水的实地经验。请把它当作高度调校过的工具：减压期间需要严格控制深度与时间。如果您对 VPM 不熟悉，建议从保守度 +4 开始，并把最后两到三个停留再加长；之后随着对剖面的信任，可逐步降到 +2 / +3。"
    },
    {
      q: "VPM 历史",
      a: "VPM 由 Yount、Hoffman 等人于 1970 年代提出，用以建模溶解气体如何在活体组织中形成并增长气泡。其后由 Bruce Wienke 和 Erik Baker 完善为带 Boyle 修正的 VPM-B — 这正是大多数技术潜水员今天熟悉的形式。ApexDeco 实现了带可调保守度的 VPM-B 与 VPM-B/E，让潜水员根据潜水具体情况选择合适的安全裕度。"
    }
  ]
},

// ===================================================================
// HINDI
// ===================================================================
hi: {
  "Dive Planning": [
    {
      q: "त्वरित आरंभ",
      a: "- + Add Level बटन का उपयोग करके Bottom Mix & Travel कॉलम में डेप्थ, समय और गैस को लेग के रूप में दर्ज करें।\n\n- योजना में शामिल करने वाले लेग के आगे चेकमार्क लगाएँ।\n\n- + Add Deco से Deco Mixes कॉलम में डीकंप्रेशन गैसें दर्ज करें।\n\n- योजना में शामिल करने वाली डीको गैसों के आगे चेकमार्क लगाएँ।\n\n- आवश्यकतानुसार Settings में मॉडल, gradient factors, इकाइयाँ, गति और चेतावनी सीमाएँ समायोजित करें।\n\n- Plan स्क्रीन के नीचे Calculate बटन दबाएँ।\n\n- दोहराई गई डाइव के लिए, पहले प्लान के बाद रिज़ल्ट स्क्रीन पर Next Dive दबाएँ, Surface Interval मोडल में सरफ़ेस इंटरवल तय करें, फिर पुनः Calculate चलाएँ — अगला प्लान पिछली डाइव से बची हुई ऊतक गैस-लोड को साथ लेकर शुरू होगा।"
    },
    {
      q: "महत्वपूर्ण बिंदु",
      a: "- Runtime का पालन करें। दिखाए गए स्टॉप समय में स्टॉप के बीच का ट्रांज़िट समय पहले से शामिल है।\n\n- डाइव के गहरे हिस्सों में अतिरिक्त स्टॉप न जोड़ें — यह डीकंप्रेशन दायित्व को बहुत बढ़ा देगा। उथले स्टॉप बिना दुष्प्रभाव के बढ़ाए जा सकते हैं।\n\n- योजना के अनुसार ही चढ़ाई की गति रखें। तेज़ या धीमी गति अतिरिक्त डीको की मांग कर सकती है।"
    },
    {
      q: "VPM योजना संबंधी विचार",
      a: "ApexDeco योजना के लिए VPM-B और VPM-B/E मॉडल देता है। VPM-B/E बहुत गहरी और लंबी डाइव के लिए विस्तार है: यह उथले स्टॉप पर अतिरिक्त समय जोड़ता है, बबल और Haldane मॉडलों का संयोजन सिमुलेट करते हुए, जब अधिकतम सुरक्षा अपेक्षित हो। अधिकांश डाइव में B और B/E समान योजनाएँ देते हैं; केवल बड़े गैस-लोड (≈ 90-100 मिनट डीको) पर B/E अलग होता है।\n\nApexDeco में VPM एक सूक्ष्मता से ट्यून किया हुआ टूल है: योजना का सख्ती से पालन करें। डीकंप्रेशन के दौरान डेप्थ और समय में बड़े विचलन से बचें, खासकर चढ़ाई के सबसे गहरे हिस्से में। महत्वपूर्ण विचलन के लिए अतिरिक्त डीको समय की भरपाई आवश्यक होगी।\n\nअंतिम स्टॉप पर बिना दुष्प्रभाव के समय जोड़ा जा सकता है।\n\nडीको मिक्स वाली योजनाओं में मध्य स्तर के स्टॉप थोड़े छोटे होते हैं — गैस बदलने से पहले भी। यह सामान्य है: VPM डीको को इटरेटिव तरीके से हल करता है और उच्च O2 डीको मिक्स की बढ़ती ऑफ़-गैसिंग क्षमता को पहले से ध्यान में रखता है।\n\nयदि पानी में आपको खोई/खराब डीको गैस के कारण नई योजना अपनानी पड़े — दो योजनाओं के बीच का अतिरिक्त समय वर्तमान स्तर पर पूरा करें, फिर नई योजना के अनुसार आगे बढ़ें।\n\nगहरी डाइव से तेज़ डीको आमतौर पर तभी संभव होती है जब डीको गैस का पहला स्विच पहले स्टॉप के स्तर पर या उससे थोड़ा गहरा हो। ट्राईमिक्स के बाद उच्च हीलियम वाली डीको मिक्स आमतौर पर डीको में तेजी नहीं लाती।"
    },
    {
      q: "डीको गैस स्विच डेप्थ",
      a: "डीको गैसों पर स्विच की सभी डेप्थ Settings में ppO2 मानों से नियंत्रित होती हैं। प्रोग्राम चेक की गई डीको गैस सूची से, आवश्यक स्टॉप के लिए अधिकतम ppO2 के आधार पर गैस चुनता है।"
    },
    {
      q: "Travel गैस",
      a: "डाइव के दौरान मिक्स बदलाव शून्य समय (-) वाले लेग जोड़ कर किए जाते हैं। उदा.\n\nनीचे जाते समय travel से bottom mix पर स्विच।\n\n25, - , 32 25m तक 32% travel।\n\n95, 30, 12/60 95m पर 30 मिनट, 12/60 पर।\n\nस्विच के साथ बहु-स्तरीय अवतरण\n\n22, 5, 32 22m पर 5 मिनट, 32%\n\n22, - , 18/30 22m छोड़ते समय bottom पर स्विच\n\n65, 20, 18/30 65m पर 20 मिनट\n\nबहु-स्तरीय चढ़ाई में गैस स्विच।\n\n40, 30, 21 40m पर 30 मिनट, हवा\n\n21, - , 50 21m पर 50% पर स्विच\n\n10, 20, 50 10m पर 20 मिनट\n\nप्रोग्राम लेग की सूची ऊपर से नीचे पढ़ता है और जिस क्रम में लेग आते हैं उसी क्रम में योजना बनाता है।"
    },
    {
      q: "बहु-स्तरीय योजनाएँ",
      a: "प्रोग्राम लेग सूची ऊपर से नीचे पढ़कर क्रम में योजना बनाता है। बहु-स्तरीय योजनाएँ (या केव प्रोफाइल) हर स्तर (और गैस परिवर्तन) को क्रम में निर्दिष्ट करके दर्ज की जाती हैं। उदा.\n\nस्विच के साथ बहु-स्तरीय अवतरण\n\n22, 5, 32 22m पर 5 मिनट, 32%\n\n22, - , 18/30 22m छोड़ते समय bottom पर स्विच\n\n65, 20, 18/30 65m पर 20 मिनट\n\nबहु-स्तरीय चढ़ाई।\n\n40, 30, 21 40m पर 30 मिनट, हवा\n\n10, 20, 21 10m पर 20 मिनट, हवा\n\nगैस स्विच के साथ बहु-स्तरीय चढ़ाई।\n\n55, 25, 18/25 55m पर 25 मिनट, 18/25\n\n21, - , 50 21m पर 50% पर स्विच\n\n10, 20, 50 10m पर 20 मिनट, 50%\n\nआरीदार बहु-स्तरीय डाइव।\n\n60, 25, 18/30 60m पर 25 मिनट, 18/30\n\n10, 20, 21 10m पर 20 मिनट, हवा पर स्विच\n\n30, 15, 21 हवा पर वापस 30m तक\n\n15, 25, 21 15m पर 25 मिनट, हवा\n\nऊपर सभी मामलों में, Deco Mixes कॉलम की कोई भी गैस तब तक उपयोग नहीं होगी जब तक अंतिम लेग प्रोसेस न हो जाए। यदि बीच पानी में दूसरी गैस पर स्विच चाहिए, तो शून्य समय वाला लेग डालें।\n\nस्तरों के बीच पर्याप्त अंतर वाली बहु-स्तरीय चढ़ाई पर ApexDeco अगले स्तर तक पहुँचने से पहले मध्य-पानी डीकंप्रेशन स्टॉप डाल देगा।"
    },
    {
      q: "रूढ़िवादिता (Conservatism)",
      a: "अनुभव के आधार पर निम्न सेटिंग्स की सिफारिश है। Nominal — नौसेना गोताखोरों और शीर्ष-फिटनेस वालों के लिए। +2 या +3 — अधिकांश गोताखोरों के लिए सामान्य। +3 या +4 — तीव्र, ठंडा, कई दिनों की लगातार डाइव, अतिरिक्त सुरक्षा या DCS के पूर्व इतिहास पर।\n\nप्रोग्राम के अंदर, conservatism VPM के N2/He माइक्रो-नाभिकों के क्रिटिकल रेडियाई बढ़ाता है। बेस से वृद्धि: 1 = 5%, 2 = 12%, 3 = 22%, 4 = 35%, 5 = 50%। Critical Volume डिफ़ॉल्ट रूप से चालू है।\n\nयह माइक्रो-न्यूक्लियस आकार की दहलीज चुनता है, जो चढ़ाई और डीकंप्रेशन को सीमित करती है। यह उल्टी दिशा में काम करती है: बड़ी रेडियाई = अधिक रूढ़िवादी योजना।\n\nकुछ डाइवों में conservatism बढ़ाने का प्रभाव कम होता है — यह सामान्य है: एक बिंदु पर डीकंप्रेशन पूर्ण हो जाती है, अतिरिक्त रूढ़िवादिता का असर नहीं रहता।\n\nVPM में नकली रूढ़िवादिता न जोड़ें (जैसे Nominal के साथ डेप्थ या समय बढ़ाना): इससे रिपीट फैक्टर समय दंड घटता है और बाद की योजनाओं में अपर्याप्त डीको लागू होगा।"
    }
  ],
  "Settings": [
    {
      q: "कॉन्फ़िगरेशन",
      a: "ApexDeco की सेटिंग्स कार्ड्स में समूहीकृत हैं। नीचे प्रत्येक नियंत्रण का विवरण है।\n\n## Appearance\n\n- Language: इंटरफ़ेस की भाषा (English, Русский, Español, 中文, हिन्दी)।\n\n- Interface Style: हल्की या गहरी थीम। चयन सत्रों के बीच याद रखा जाता है।\n\n## Model Settings\n\n- Circuit: OC या CCR। सर्किट बदलने पर Bottom Mix & Travel सूची भी बदलती है — OC और CCR के स्तर अलग-अलग संग्रहित होते हैं।\n\n- Deco Model: Gradient Factors के साथ ZH-L16C, VPM-B, या VPM-B/E।\n\n- Conservatism: 0…4 — VPM-B / VPM-B/E में उपयोग। बड़े मान क्रिटिकल बबल रेडियाई बढ़ाते हैं और डीको लंबी कर देते हैं। Bühlmann GF पर असर नहीं (वहाँ GF Lo / GF Hi नियंत्रण करते हैं)।\n\n- GF Lo / GF Hi: Bühlmann gradient factors — गहरे स्टॉप और सतह तनाव को नियंत्रित करते हैं।\n\n- GFS Hi (Bailout): bailout-योजना पुनर्गणना में उपयोग होने वाला GF Hi।\n\n- O2 Narcotic: END की गणना में ऑक्सीजन के आंशिक दबाव को शामिल करना है या नहीं।\n\n## Unit Settings\n\n- Depth Units: मीटर या फ़ीट (प्रदर्शन और इनपुट)।\n\n- Water Type: मीठा या नमकीन पानी (SG 1.026)। प्रति मीटर परिवेशी दबाव को प्रभावित करता है।\n\n- Altitude / Acclimatized: डाइव-स्थल की ऊँचाई और जिस ऊँचाई के अभ्यस्त हैं। ऊँचाई पर डाइविंग के लिए परिवेशी दबाव सुधार।\n\n- Gas Volume: गैस उपभोग के लिए लीटर या क्यूबिक फ़ीट।\n\n- Pressure Units: टैंक दबाव के लिए bar या psi।\n\n- Gauge Type: गैस गणनाओं में सिलेंडर मानक।\n\n- Temperature: परिवेशी तापमान, मिक्सिंग टूल्स द्वारा प्रयुक्त।\n\n## Descent / Ascent Rates\n\n- Descent Rate: अवतरण की गति।\n\n- Ascent Rate: तल से पहले स्टॉप तक की चढ़ाई गति।\n\n- Deco Ascent Rate: डीको स्टॉप के बीच की गति।\n\n- Surface Ascent Rate: अंतिम स्टॉप से सतह तक की गति।\n\n## Deco Stop Settings\n\n- Step Size: डीको स्टॉप के बीच का अंतर।\n\n- Last Stop (OC) / Last Stop (CCR): अंतिम स्टॉप की गहराई। OC और CCR के लिए अलग-अलग।\n\n- Min Stop Time: योजनाकार द्वारा दी जाने वाली न्यूनतम स्टॉप अवधि।\n\n- ppO2 Deco Swap: डीको गैस पर स्विच का निर्णायक ppO2।\n\n- ppO2 28-45% mix / ppO2 45-99% mix / ppO2 Bottom Max: O2 श्रेणियों के अनुसार ppO2 सीमाएँ।\n\n- O2 100% Max Depth: डीको गैस के रूप में शुद्ध O2 की अधिकतम गहराई।\n\n- First Stop 30sec / First Stop Double Step: सबसे गहरे स्टॉप के आकार विकल्प।\n\n## CCR Settings\n\n- Default Setpoint: स्तर-निर्दिष्ट setpoint सक्रिय होने से पहले लागू setpoint।\n\n- SP Units: setpoint के लिए bar या ATA।\n\n## RMV / Gas Planning\n\n- Bottom RMV: अवतरण और तल पर सतह-समतुल्य उपभोग।\n\n- Deco RMV: डीको स्टॉप पर उपभोग।\n\n## Extended Stops\n\n- Extended Stops: मुख्य स्विच।\n\n- Add time to stop: On — विस्तार आवश्यक स्टॉप समय में जोड़ा जाता है; Off — आवश्यक और विस्तार में से अधिकतम।\n\n- All mix changes: On — हर स्टॉप विस्तारित; Off — केवल डीको मिक्स बदलने वाले स्टॉप।\n\n- O2 window effect: On — विस्तार तभी जब नई गैस का इन्स्पायर्ड ppO2 पिछले से अधिक हो।\n\n- 7..30 m / 30 + m: उथले और गहरे स्टॉप पर अतिरिक्त मिनट (सीमा 30m / 100ft)।\n\n## Warning Thresholds\n\n- प्रत्येक थ्रेशोल्ड के बारे में \"चेतावनी स्तर और रंग\" विषय देखें।\n\n## Bailout Settings\n\n- Bailout Plan: On — ApexDeco मुख्य योजना के साथ Bailout Plan कार्ड भी जनरेट करता है, सबसे गहरे स्तर पर bail-out मानकर।\n\n- Bailout Model / Bailout GF Lo / Bailout GF Hi / Bailout GFS Hi: bail-out पुनर्गणना के लिए मॉडल और gradient factors, मुख्य योजना से स्वतंत्र।\n\n- Bailout RMV: bailout वॉल्यूम गणना का उपभोग।\n\n- Extra Bottom Min / Extra Time: विफलता बिंदु से पहले अतिरिक्त बॉटम मिनट और bailout चढ़ाई में अतिरिक्त समय।\n\n- Bailout Dive # / Cave Type Bail / Return Portion: केव-शैली bailout जिसमें योजना का हिस्सा वापसी सिमुलेट करने हेतु दोहराया जाता है।\n\n## Surface Interval / Multi-dive\n\n- Surface Interval मोडल अगली योजना से पहले ऊतकों को ऑफ़-गैस होने हेतु डाइवों के बीच सरफ़ेस समय लागू करता है।\n\n- 2-Week OTU: पिछले दो सप्ताह से लाई गई ओटीयू लोड; क्यूम्युलेटिव OTU चेतावनी में।\n\n- Travel Gas O2% / He%: सरफ़ेस अंतराल के दौरान साँस ली जाने वाली गैस (आमतौर पर हवा)।"
    },
    {
      q: "चेतावनी स्तर और रंग",
      a: "ApexDeco गणना की गई योजना को असुरक्षित स्थितियों के लिए स्कैन करता है और उन्हें Dive Plan Result के ऊपर सूचीबद्ध करता है। \"Warning Thresholds\" कार्ड का प्रत्येक नियंत्रण एक चेतावनी को चालू/बंद और उसकी सीमा सेट करता है; नया थ्रेशोल्ड अगले Calculate पर लागू होता है। दो दृश्य शैलियाँ स्वतः उपयोग होती हैं — लाल (error) जीवन-सुरक्षा सीमाओं के लिए, नारंगी (warning) सलाहकार सीमाओं के लिए — प्रत्येक चेतावनी हेतु रंग-पिकर नहीं है।\n\nनिम्नलिखित जाँचें होती हैं।\n\n- ppO2 High: कोई भी सेगमेंट जिसका साँस का ppO2 थ्रेशोल्ड (डिफ़ॉल्ट 1.6 bar) से अधिक है — लाल। OC के लिए मान fO2×pAmb; CCR डायल्यूएंट के लिए — परिवेश से सीमित सक्रिय setpoint।\n\n- ppO2 Low: सेगमेंट जिसका ppO2 थ्रेशोल्ड (डिफ़ॉल्ट 0.16 bar) से नीचे — हाइपोक्सिक के रूप में लाल। CCR योजना तालिका जैसी ही setpoint-संवेदी गणना उपयोग करता है।\n\n- CNS % above: डाइव-अंत में CNS भार थ्रेशोल्ड (डिफ़ॉल्ट 80%) से अधिक — लाल।\n\n- OTU above: डाइव-अंत में OTU थ्रेशोल्ड (डिफ़ॉल्ट 300) से अधिक — नारंगी।\n\n- 2-Week OTU: यदि Surface Interval कार्ड में \"2-Week OTU\" गैर-शून्य है, तो संचयी भार (पुराना + वर्तमान) 300 के विरुद्ध जाँचा जाता है।\n\n- IBCD N2 / IBCD He: हर गैस-स्विच पर ApexDeco नई और पिछली मिक्स के साँस-में-गए ppN2 और ppHe की तुलना करता है। थ्रेशोल्ड (डिफ़ॉल्ट 0.5 ATA) से अधिक उछाल को Isobaric Counter Diffusion जोखिम के रूप में चिह्नित किया जाता है।\n\n- CCR diluent check: चालू होने पर, योजनाकार जाँचता है कि सेगमेंट डेप्थ पर डायल्यूएंट का ppO2 सक्रिय setpoint के सापेक्ष उचित सीमा में है, और हाइपोक्सिक/हाइपरऑक्सिक लूप स्थिति को चिह्नित करता है।"
    }
  ],
  "VPM info": [
    {
      q: "VPM और VPM-B मॉडल जानकारी",
      a: "Varying Permeability Model (VPM) एक बबल-आधारित डीकंप्रेशन मॉडल है जो ऊतकों में क्रिटिकल माइक्रो-न्यूक्लियस रेडियाई के अनुसरण से बबल आकार नियंत्रित करता है। ApexDeco दैनिक तकनीकी उपयोग के लिए VPM-B और बहुत गहरी / लंबी डाइव हेतु अधिकतम सुरक्षित प्रोफ़ाइल हेतु VPM-B/E (बड़े डीको दायित्वों ≈ 90-100 मिनट पर अतिरिक्त उथला समय जोड़ता है) देता है। VPM-B/FBO एक bail-out वैरिएंट है जो ओपन-सर्किट गैस वॉल्यूम कम करने हेतु गहरी चढ़ाई को तेज़ करता है।"
    },
    {
      q: "VPM मॉडल डेटा",
      a: "VPM प्रायोगिक है: इसका कोई बड़ा सहकर्मी-समीक्षित डेटासेट नहीं है, केवल हजारों रिकॉर्ड डाइव से क्षेत्रीय अनुभव है। इसे एक सूक्ष्मता से ट्यून किए गए मॉडल के रूप में लें — डीकंप्रेशन के दौरान डेप्थ और समय का अनुशासित नियंत्रण आवश्यक है। यदि VPM के लिए नए हैं, तो conservatism +4 से शुरू करें और अंतिम दो-तीन स्टॉप थोड़े बढ़ाएँ; समय के साथ प्रोफ़ाइल पर भरोसा बनने पर +2 / +3 तक नीचे जाएँ।"
    },
    {
      q: "VPM का इतिहास",
      a: "VPM 1970 के दशक में Yount, Hoffman आदि द्वारा विकसित किया गया, जिन्होंने यह मॉडल बनाया कि घुली हुई गैसें जीवित ऊतक में बबल कैसे बनाती और बढ़ाती हैं। बाद के दशकों में Bruce Wienke और Erik Baker ने इसे VPM-B (Boyle-संशोधित) में परिष्कृत किया — आज अधिकांश तकनीकी गोताखोर इसी रूप को जानते हैं। ApexDeco समायोज्य conservatism के साथ VPM-B और VPM-B/E लागू करता है, जिससे गोताखोर डाइव के अनुरूप सुरक्षा-मार्जिन चुन सके।"
    }
  ]
}

};

function getHelpData() {
    const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    return HelpDataI18n[lang] || HelpData;
}

// Localized tab labels (for the 4 visible categories).
function getHelpTabLabel(category) {
    const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    const map = {
        en: { "Dive Planning": "Dive Planning", "Settings": "Settings", "VPM info": "VPM info", "About": "About" },
        ru: { "Dive Planning": "Планирование", "Settings": "Настройки", "VPM info": "О VPM", "About": "О программе" },
        es: { "Dive Planning": "Planificación", "Settings": "Ajustes", "VPM info": "Sobre VPM", "About": "Acerca de" },
        zh: { "Dive Planning": "潜水规划", "Settings": "设置", "VPM info": "关于 VPM", "About": "关于" },
        hi: { "Dive Planning": "योजना", "Settings": "सेटिंग्स", "VPM info": "VPM परिचय", "About": "परिचय" }
    };
    return (map[lang] && map[lang][category]) || category;
}
