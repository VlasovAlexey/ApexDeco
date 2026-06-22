window.registerHelpLocale("zh", {
    "Dive Planning": [
        {
            "q": "快速开始",
            "a": "- 在 Bottom Mix & Travel 列中通过 + Add Level 按钮输入深度、时间和气体作为段（leg）。\n\n- 勾选要纳入计划的段。\n\n- 在 Deco Mixes 列中通过 + Add Deco 按钮输入减压气。\n\n- 勾选要纳入计划的减压气。\n\n- 如有需要，在 Settings 中调整模型、梯度因子（GF）、单位、上升/下潜速度和警告阈值。\n\n- 点击 Plan 屏幕底部的 Calculate。\n\n- 重复潜水时，在结果屏幕按 Next Dive，在 Surface Interval 弹窗中设置水面间歇，再次按 Calculate — 下一次潜水将沿用上一次的组织残余载荷。"
        },
        {
            "q": "重要事项",
            "a": "- 严格按照 runtime 执行。停留时间已包含两段停留之间的过渡时间。\n\n- 不要在深部段额外加停 — 这会显著增加减压义务。浅停留可以在不影响安全的前提下延长。\n\n- 上升速率必须按计划执行。过快或过慢都可能需要额外减压。"
        },
        {
            "q": "VPM 规划要点",
            "a": "ApexDeco 提供 VPM-B 和 VPM-B/E 两种模型。VPM-B/E 是为非常深、非常长的潜水设计的扩展：在浅停加额外时间，结合气泡叠加模型与 Haldane 模型，达到最高安全余度。对大多数潜水，B 与 B/E 结果相同；只有当减压义务很大（约 90-100 分钟）时 B/E 才开始偏离。\n\nApexDeco 中的 VPM 经过精细调校，必须严格遵照计划。减压期间在深度和时间上的大幅偏离应避免，尤其在上升的深部段。明显偏差需要追加减压时间。\n\n最后几个停留可以在不产生副作用的情况下延长。\n\n带减压气的计划在中段停留会比预期略短 — 即使尚未切换气体。这是正常的：VPM 以迭代方式计算减压，并预先考虑后续高 O2 减压气的更强排气能力。\n\n如果在水中因丢失/损坏减压气被迫切换计划，应在当前深度补足两个计划之间的差额时间，再按新计划继续。\n\n深潜的更快减压通常发生在第一次切换减压气恰好处于第一停留的水平或略深时。富 He 减压气在 trimix 之后通常不会加速减压。"
        },
        {
            "q": "减压气切换深度",
            "a": "所有切换到减压气的深度均由 Settings 中的 ppO2 参数决定。程序会从勾选的减压气列表中，根据各停留所需的最大 ppO2 选择气体。"
        },
        {
            "q": "过渡气（Travel gas）",
            "a": "潜水中的气体切换通过插入时间为 0 (-) 的段来实现。例如。\n\n下降时从 travel 切到 bottom mix。\n\n25, - , 32 travel 32% 到 25m。\n\n95, 30, 12/60 在 95m 停留 30 分钟，使用 12/60。\n\n多级下降并切换气体\n\n22, 5, 32 在 22m 停 5 分钟，32%\n\n22, - , 18/30 离开 22m 时切到 bottom\n\n65, 20, 18/30 在 65m 停 20 分钟\n\n多级上升中切换气体。\n\n40, 30, 21 在 40m 停 30 分钟，空气\n\n21, - , 50 上升至 21m 切到 50%\n\n10, 20, 50 在 10m 停 20 分钟\n\n程序自上而下读取段列表，并按照遇到的顺序构建计划。"
        },
        {
            "q": "多级计划",
            "a": "程序自上而下读取段列表，按顺序构建计划。多级计划（或洞穴剖面）通过依次列出每一级（包括气体切换）实现。例如。\n\n多级下降并切换气体\n\n22, 5, 32 在 22m 停 5 分钟，32%\n\n22, - , 18/30 离开 22m 时切到 bottom\n\n65, 20, 18/30 在 65m 停 20 分钟\n\n多级上升。\n\n40, 30, 21 在 40m 停 30 分钟，空气\n\n10, 20, 21 在 10m 停 20 分钟，空气\n\n带气体切换的多级上升。\n\n55, 25, 18/25 在 55m 停 25 分钟，18/25\n\n21, - , 50 在 21m 切到 50%\n\n10, 20, 50 在 10m 停 20 分钟，50%\n\n锯齿型多级潜水。\n\n60, 25, 18/30 在 60m 停 25 分钟，18/30\n\n10, 20, 21 在 10m 停 20 分钟，切到空气\n\n30, 15, 21 再次下到 30m，空气\n\n15, 25, 21 上到 15m 停 25 分钟，空气\n\n以上情形中，Deco Mixes 列里的气体在最后一段处理完之前都不会被使用。如需中途切换气体，请插入时间为 0 的段。\n\n在层间差距较大的多级上升中，ApexDeco 会在到达下一级之前自动插入水中减压停留。"
        },
        {
            "q": "保守度（Conservatism）",
            "a": "实践经验给出如下建议。Nominal 适用于海军潜水员和身体极佳者。+2 或 +3 是绝大多数潜水员的常用设置。+3 或 +4 适用于体力消耗大、寒冷、连续多日潜水、需要额外安全或既往有 DCS 史的情况。\n\n在程序内部，保守度会增大 VPM 算法中 N2/He 微核的临界半径。增量：1 = 5%, 2 = 12%, 3 = 22%, 4 = 35%, 5 = 50%。Critical Volume 默认开启。\n\n本质上是选择限制上升和减压的微核半径阈值，作用方向相反：半径越大计划越保守。\n\n部分潜水即使提高保守度也几乎无变化 — 这是正常的：超过某个点，减压已经完成，再加保守度也无效。\n\n请勿在 VPM 中伪造保守度（例如使用 Nominal 同时虚增深度或时间）：这会降低重复因子，导致后续计划的减压不足。"
        }
    ],
    "Settings": [
        {
            "q": "配置",
            "a": "ApexDeco 的设置以卡片形式分组。下面解释每个控件。\n\n## Appearance\n\n- Language: 界面语言（English、Русский、Español、中文、हिन्दी）。\n\n- Interface Style: 浅色或深色主题。选择会在会话间保留。\n\n## Model Settings\n\n- Circuit: OC 或 CCR。切换电路时也会切换 Bottom Mix & Travel 列表 — OC 与 CCR 的级是分开存储的。\n\n- Deco Model: ZH-L16C with Gradient Factors、VPM-B 或 VPM-B/E。\n\n- Conservatism: 0…4 — 仅 VPM-B / VPM-B/E 使用。值越大，临界气泡半径越大，减压时间越长。对 Bühlmann GF 不起作用（由 GF Lo / GF Hi 控制）。\n\n- GF Lo / GF Hi: Bühlmann 梯度因子，控制深停和出水紧张度。\n\n- GFS Hi (Bailout): bailout 计划重算时使用的 GF Hi。\n\n- O2 Narcotic: 计算 END 时是否将 O2 视为有麻醉性。\n\n## Unit Settings\n\n- Depth Units: 米或英尺（显示和输入）。\n\n- Water Type: 淡水或盐水（SG 1.026）。影响每米对应的环境压力。\n\n- Altitude / Acclimatized: 潜点海拔与潜水员适应的海拔。用于高海拔潜水的环境压修正。\n\n- Gas Volume: 升或立方英尺，用于耗气量结果。\n\n- Pressure Units: bar 或 psi，用于气瓶压力。\n\n- Gauge Type: 气瓶/压力表规格规范，用于耗气计算。\n\n- Temperature: 环境温度，混气工具会使用。\n\n## Descent / Ascent Rates\n\n- Descent Rate: 下降速率。\n\n- Ascent Rate: 从底部到第一停的上升速率。\n\n- Deco Ascent Rate: 减压停留之间的上升速率。\n\n- Surface Ascent Rate: 从最后一停到水面的上升速率。\n\n## Deco Stop Settings\n\n- Step Size: 减压停留间距。\n\n- Last Stop (OC) / Last Stop (CCR): 最后一停的深度。OC 与 CCR 分别配置。\n\n- Min Stop Time: 程序输出的最小停留时长。\n\n- ppO2 Deco Swap: 决定切换到减压气的 ppO2 阈值。\n\n- ppO2 28-45% mix / ppO2 45-99% mix / ppO2 Bottom Max: 按 O2 范围划分的 ppO2 上限，约束各深度的可选混气。\n\n- O2 100% Max Depth: 使用纯 O2 作为减压气的最大深度。\n\n- First Stop 30sec / First Stop Double Step: 最深停留的形态选项。\n\n## CCR Settings\n\n- Default Setpoint: 在第一个由级定义的 setpoint 生效之前所采用的 setpoint。\n\n- SP Units: setpoint 的单位（bar 或 ATA）。\n\n## RMV / Gas Planning\n\n- Bottom RMV: 下潜与底段使用的水面等效耗气率。\n\n- Deco RMV: 减压停留使用的耗气率。\n\n## Extended Stops\n\n- Extended Stops: 总开关。\n\n- Add time to stop: On — 把延长时间叠加到所需停留时间上；Off — 取所需与延长两者中的较大值。\n\n- All mix changes: On — 所有停留都延长；Off — 仅在切换减压气的停留延长。\n\n- O2 window effect: On — 仅当新气的吸入 ppO2 高于前一气体时才延长。\n\n- 7..30 m / 30 + m: 浅停与深停的额外分钟数（边界为 30m / 100ft）。\n\n## Warning Thresholds\n\n- 关于每个阈值的作用，请参阅 \"警告级别与颜色\"。\n\n## Bailout Settings\n\n- Bailout Plan: 开启时，ApexDeco 在主计划旁生成 Bailout Plan 卡片，假设在最深处发生 bailout。\n\n- Bailout Model / Bailout GF Lo / Bailout GF Hi / Bailout GFS Hi: 用于 bailout 重算的减压模型和梯度因子，与主计划设置独立。\n\n- Bailout RMV: 计算 bailout 气量时使用的耗气率。\n\n- Extra Bottom Min / Extra Time: 故障点之前在底段加的额外分钟数，以及 bailout 上升中追加的时间。\n\n- Bailout Dive # / Cave Type Bail / Return Portion: 洞穴式 bailout，复制部分计划以模拟回程。\n\n## Surface Interval / Multi-dive\n\n- Surface Interval 弹窗设置潜水之间的水面时间，让组织在下一次计划前完成排气。\n\n- 2-Week OTU: 过去两周累计的 OTU 残余，用于累计 OTU 警告。\n\n- Travel Gas O2% / He%: 水面间歇期间呼吸的气体（通常为空气）。"
        },
        {
            "q": "警告级别与颜色",
            "a": "ApexDeco 会扫描计算出的计划是否存在不安全条件，并在 Dive Plan Result 之上列出。\"Warning Thresholds\" 卡片中的每个控件可单独开关并设置阈值；新阈值在下一次 Calculate 时生效。默认使用红色（error）表示关乎生命的极限，橙色（warning）表示建议性提醒；每个警告旁边的颜色选择器可覆盖该警告的高亮颜色。\n\n执行以下检查。\n\n- ppO2 High: 任何吸入 ppO2 超过阈值（默认 1.6 bar）的段标红。OC 时为 fO2×pAmb；CCR 稀释气段为受环境压限制后的当前 setpoint。\n\n- ppO2 Low: ppO2 低于阈值（默认 0.16 bar）的段标红，视为低氧。CCR 使用与计划表相同的 setpoint 感知逻辑。\n\n- CNS % above: 潜水末 CNS 累积超过阈值（默认 80%）标红。\n\n- OTU above: 潜水末 OTU 超过阈值（默认 300）标橙。\n\n- 2-Week OTU: 如果 Surface Interval 卡片中的 \"2-Week OTU\" 非零，则将累计载荷（残余+本次）与 300 比较，超过时报警。\n\n- IBCD N2 / IBCD He: 每次气体切换时，比较新旧气体的吸入 ppN2 与 ppHe。跳变超过阈值（默认 0.5 ATA）标记为同压逆向扩散（Isobaric Counter Diffusion）风险。\n\n- CCR diluent check: 启用时，验证稀释气在该段深度上相对当前 setpoint 是否在合理范围，并提示低氧或高氧的回路状态。"
        }
    ],
    "VPM info": [
        {
            "q": "VPM 与 VPM-B 模型介绍",
            "a": "Varying Permeability Model（VPM）是一种基于气泡的减压模型，通过追踪组织中临界微核的半径来控制气泡尺寸。ApexDeco 提供 VPM-B 用于日常技术潜水，并提供 VPM-B/E 作为扩展，在减压义务较大（约 90-100 分钟）时增加浅停时间，为非常深 / 非常长的潜水提供尽可能安全的剖面。VPM-B/FBO 是 bailout 变体，加快深部上升以减少开式电路的耗气量。"
        },
        {
            "q": "VPM 模型数据",
            "a": "VPM 仍属于实验性模型：缺乏大规模同行评议数据，仅有数千次记录潜水的实地经验。请把它当作高度调校过的工具：减压期间需要严格控制深度与时间。如果您对 VPM 不熟悉，建议从保守度 +4 开始，并把最后两到三个停留再加长；之后随着对剖面的信任，可逐步降到 +2 / +3。"
        },
        {
            "q": "VPM 历史",
            "a": "VPM 由 Yount、Hoffman 等人于 1970 年代提出，用以建模溶解气体如何在活体组织中形成并增长气泡。其后由 Bruce Wienke 和 Erik Baker 完善为带 Boyle 修正的 VPM-B — 这正是大多数技术潜水员今天熟悉的形式。ApexDeco 实现了带可调保守度的 VPM-B 与 VPM-B/E，让潜水员根据潜水具体情况选择合适的安全裕度。"
        }
    ]
}, {
    "Dive Planning": "潜水规划",
    "Settings": "设置",
    "VPM info": "关于 VPM",
    "About": "关于"
});
