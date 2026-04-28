/**
 * ApexDeco - Help / FAQ screen
 * Self-contained: embeds FAQ data and renders into #screen-help.
 */
const HelpData = {
  "Dive Planning": [
    {
      "q": "Quick Start",
      "a": "- Enter depth, time and gas details as legs into the Bottom Mix & Travel column, using the + Add Level button.\n\n- Place a check mark next to the legs to be included in the plan.\n\n- Enter deco gases into the Deco Mixes column, using the + Add Deco button.\n\n- Place a check mark next to the deco gases to be included in the plan.\n\n- Adjust models, gradient factors, units, rates and warning thresholds in Settings as needed.\n\n- Press the Calculate button at the bottom of the Plan screen.\n\n- For repetitive dives, after the first plan press the Next Dive button on the result screen, set the surface interval in the Surface Interval modal, then run Calculate again — the planner will start the next dive with tissue loading carried over from the previous one."
    },
    {
      "q": "Important Points",
      "a": "- Follow the run times. The displayed stop times include the time required for transit between stops\n\n- Do not add any extra stops in the deep sections of the dive. This will add significantly to the decompression obligations. You may extend the shallow stops without side affects.\n\n- Carry out the ascents at the rates used in the plan. Ascending at a rate faster or slower than specified may require additional decompression."
    },
    {
      "q": "Planning considerations in VPM",
      "a": "ApexDeco offers the VPM-B and VPM-B/E models for planning dives. VPM-B/E is an extension made for divers undertaking very deep and long dives. It generates plans with additional shallow time that simulate an overlapped bubble model and a Haldane plan, for time times when maximum safety is required. For most divers, the B and B/E plans are the same, because B/E only begins to deviate after large gas loads (90-100 mins deco required).\n\nThe VPM in ApexDeco is a highly tuned deco tool and you must follow the plans closely. Any large deviations from planned ascent in depth & time during decompression, must be avoided. Significant changes will require additional deco time to compensate. This is most relevant with slowed or delayed ascents in the deepest parts of the ascent.\n\nYou may add extra time, if required to the last deco stops without side effects.\n\nPlans with deco mixes will generate slightly faster run times for the mid level stops - even before any gas change has occurred. VPM calculates decos in an iterative process, and adjusts for additional off gassing capability later in the deco from the high O2 mixes to come.\n\nIf you are forced to adopt a new plan in water from lost / broken deco gas - wait out the additional time between the two plans, at the current level, and then commence timings per the new plan. (see also question 1 in top ten)\n\nA faster deco from deep dives is usually possible when the first deco gas switch is at, or just above, the same level as the first deco stop. High helium deco mixes after trimix dives, usually do not accelerate deco."
    },
    {
      "q": "Deco gas switch depths",
      "a": "All switch depths onto deco gases / mixes, are controlled by the ppO2 settings in configuration. The program will select a gas from the checked items in the deco gas list, based on the max ppO2 settings, for each of the required stops."
    },
    {
      "q": "Travel gas",
      "a": "Switches in mixes during the dive are controlled by inserting legs into the plan, with a time of zero(-). e.g.\n\nSwitch in descent from travel to bottom mix.\n\n25, - , 32 travel gas 32% to 25m.\n\n95, 30, 12/60 30 mins at 95m, on 12/60 mix\n\nMulti level descent with switch\n\n22, 5, 32 5 mins at 22m, 32%\n\n22, - , 18/30 swap to bottom mix when leaving 22m\n\n65, 20, 18/30 20 mins at 65m on mix\n\nSwitch in ascent, on a multi level plan.\n\n40, 30, 21 30 mins at 40m, air\n\n21, - , 50 swap to 50% in ascent at 21m\n\n10, 20, 50 20 mins at 10m\n\nThe program reads down the list of legs, and creates plans based on the order each leg is encountered."
    },
    {
      "q": "Multi level plans",
      "a": "The program reads down the list, and creates plans based on the order each leg is encountered. Multi level plans (or cave profiles) are entered by specifying each level (and gas change) in sequence. e.g.\n\nMulti level descent with switch\n\n22, 5, 32 5 mins at 22m, 32%\n\n22, - , 18/30 swap to bottom mix when leaving 22m\n\n65, 20, 18/30 20 mins at 65m on mix\n\nMulti level ascent.\n\n40, 30, 21 30 mins at 40m, air\n\n10, 20, 21 20 mins at 10m, air\n\nMulti level ascent, with gas switches.\n\n55, 25, 18/25 25 mins at 55m, 18/25 mix\n\n21, - , 50 swap to 50% at 21m\n\n10, 20, 50 20 mins at 10m, 50%\n\nMulti level saw tooth dive.\n\n60, 25, 18/30 25 mins at 60m, 18/30 mix\n\n10, 20, 21 20 mins at 10m, swap to air\n\n30, 15, 21 back down to 30m on air\n\n15, 25, 21 up to 15m for 25 mins on air\n\nIn all cases above, any gas in the deco column is not utilized until the last dive plan leg has been processed. If a switch to another gas is required in mid water, then insert a leg with a time of zero.\n\nOn multi level ascent plans with sufficient change between levels, ApexDeco will insert decompression stops mid water prior to reaching the next level."
    },
    {
      "q": "Conservatism",
      "a": "Feedback from divers has suggested the following settings should be applied. Nominal is for navy divers and the super fit. Plus 2 or 3 is the normal setting for most divers. Set a plus 3 or 4 with strenuous, cold, a series of multi day dives, extra safety, or a prior history of DCS or symptoms.\n\nInside the program, the conservatism setting increases the Critical Radii of N2/He in the VPM algorithms. From these base values, by this increase: 1 = 5%, 2 = 12%, 3 = 22%, 4 = 35%, 5 = 50%. The Critical Volume setting is on by default.\n\nThis adjustment chooses the threshold of micro-nuclei radius size, that becomes the limiting dimension through the ascent and decompression. This adjustment operates at the core of the VPM algorithm. This setting operates in reverse: a larger radii is a more conservative plan.\n\nYou may notice on some dives in VPM, setting the conservatism higher has little apparent effect. This will happen because at some point, decompression is complete no matter how much extra conservatism is added.\n\nDo not fake conservatism in VPM e.g. using Nominal and inflating the depth or time. Doing so will cause the repetitive factor time penalty to be reduced, and subsequent dives plans will have insufficient deco time applied."
    }
  ],
  "Settings": [
    {
      "q": "Configuration",
      "a": "Settings in ApexDeco are grouped into cards. Below is what each control does.\n\nAppearance\n\n- Language: UI language (English, Russian, Spanish, Chinese, Hindi).\n\n- Interface Style: Light or Dark theme. The choice is remembered between sessions.\n\nModel Settings\n\n- Circuit: OC or CCR. Switching circuit also swaps the Bottom Mix & Travel list — OC and CCR levels are stored separately.\n\n- Deco Model: ZH-L16C with Gradient Factors, VPM-B, or VPM-B/E.\n\n- Conservatism: 0 to 4 — used by VPM-B / VPM-B/E. Larger values inflate the critical bubble radii and yield longer decompression. Has no effect on Bühlmann GF (which is controlled by GF Lo / GF Hi).\n\n- GF Lo / GF Hi: Bühlmann gradient factors that control deep stops and surfacing tension.\n\n- GFS Hi (Bailout): GF Hi used during the bailout-plan re-calculation.\n\n- O2 Narcotic: include oxygen partial pressure when calculating END.\n\nUnit Settings\n\n- Depth Units: meters or feet (for both display and input).\n\n- Water Type: fresh or salt (SG 1.026). Affects ambient pressure per metre.\n\n- Altitude / Acclimatized: dive elevation and the elevation the diver is acclimatized to. Used to correct ambient pressure for altitude diving.\n\n- Gas Volume: litres or cubic feet for gas consumption results.\n\n- Pressure Units: bar or psi for tank pressures.\n\n- Gauge Type: cylinder rating / measurement convention used in gas calculations.\n\n- Temperature: ambient temperature, used by the gas-mixing tools.\n\nDescent / Ascent Rates\n\n- Descent Rate: rate during descent segments.\n\n- Ascent Rate: rate from bottom to the first stop.\n\n- Deco Ascent Rate: rate between deco stops.\n\n- Surface Ascent Rate: rate from the last stop to the surface.\n\nDeco Stop Settings\n\n- Step Size: spacing between deco stops.\n\n- Last Stop (OC) / Last Stop (CCR): depth of the final stop. Separate values for open- and closed-circuit dives.\n\n- Min Stop Time: smallest stop duration the planner will issue.\n\n- ppO2 Deco Swap: ppO2 used to decide when the planner switches to a deco gas.\n\n- ppO2 28-45% mix / ppO2 45-99% mix / ppO2 Bottom Max: per-range ppO2 caps that gate which mixes can be selected at each depth.\n\n- O2 100% Max Depth: maximum depth where pure O2 may be used as a deco gas.\n\n- First Stop 30sec / First Stop Double Step: shaping options for the deepest stop.\n\nCCR Settings\n\n- Default Setpoint: setpoint applied before the first level-defined setpoint becomes active.\n\n- SP Units: bar or atm for setpoint values.\n\nRMV / Gas Planning\n\n- Bottom RMV: surface-equivalent consumption used during descent and bottom segments.\n\n- Deco RMV: consumption used during deco stops.\n\nExtended Stops\n\n- Extended Stops: master switch.\n\n- Add time to stop: when On, the extension is added to the required stop time. When Off, the extension is taken as Math.max(required, extension).\n\n- All mix changes: when On, every stop is extended; when Off, only stops where the deco mix changes.\n\n- O2 window effect: when On, extension is applied only when the new gas has a higher inspired ppO2 than the previous one.\n\n- 7..30 m / 30 + m: the extra minutes added at shallow and deep stops (the boundary is 30 m / 100 ft).\n\nWarning Thresholds\n\n- See the \"Warning levels & colors\" topic for what each threshold does.\n\nBailout Settings\n\n- Bailout Plan: when On, ApexDeco generates an additional Bailout Plan card alongside the main plan, assuming bail-out at the deepest level.\n\n- Bailout Model / Bailout GF Lo / Bailout GF Hi / Bailout GFS Hi: deco model and gradient factors used for the bail-out re-calculation, independent of the main-plan settings.\n\n- Bailout RMV: gas consumption used while computing the bail-out volumes.\n\n- Extra Bottom Min / Extra Time: extra bottom minutes added before the failure point and additional time padded into the bail-out ascent.\n\n- Bailout Dive # / Cave Type Bail / Return Portion: cave-style bail-out where part of the plan is duplicated to model the return.\n\nSurface Interval / Multi-dive\n\n- The Surface Interval modal applies surface time between dives so tissues off-gas before the next plan.\n\n- 2-Week OTU: rolling OTU load carried over from the past two weeks; used for the cumulative OTU warning.\n\n- Travel Gas O2% / He%: gas breathed during the surface interval (typically air)."
    },
    {
      "q": "Warning levels & colors",
      "a": "ApexDeco scans the calculated plan for unsafe conditions and lists them above the Dive Plan Result. Each control on the \"Warning Thresholds\" card switches one warning on or off and sets its limit; the threshold takes effect on the next Calculate. Two visual styles are used automatically — red (error) for life-safety limits and orange (warning) for advisory limits — there is no per-warning colour picker.\n\nThe following checks are performed.\n\n- ppO2 High: any segment whose breathed ppO2 exceeds the threshold (default 1.6 bar) is flagged red. For OC the value is fO2×pAmb; for CCR diluent legs it is the active setpoint capped by ambient.\n\n- ppO2 Low: any segment with breathed ppO2 below the threshold (default 0.16 bar) is flagged red as hypoxic. CCR uses the same setpoint-aware calculation as the plan tables.\n\n- CNS % above: end-of-dive CNS oxygen toxicity load above the threshold (default 80 %) is flagged red.\n\n- OTU above: end-of-dive OTU above the threshold (default 300) is flagged orange.\n\n- 2-Week OTU: if a non-zero \"2-Week OTU\" is set on the Surface Interval card, the cumulative load (rolling + this dive) is checked against 300 and flagged when exceeded.\n\n- IBCD N2 / IBCD He: at every gas switch, ApexDeco compares the inspired ppN2 and ppHe of the new mix against the previous one. A jump that exceeds the configured threshold (default 0.5 ATA) is flagged as Isobaric Counter Diffusion risk.\n\n- CCR diluent check: when on, the planner verifies that the diluent ppO2 stays within sensible bounds versus the active setpoint at the segment depth, and flags a hypoxic or hyperoxic loop condition."
    }
  ],
  "CCR & SCR": [
    {
      "q": "CCR - Levels, diluent, setpoint",
      "a": "CCR planning is much like OC planning, with the addition of a Setpoint. The program calculates the inspired mix from the diluent and current depth. The program assumes instant loop changes with new levels or settings - no slides, no time delays.\n\nWhen setpoint exceeds natural pp of 100% O2 for given depth, the program assumes an O2 flush. When setpoint is lower than natural pp of diluent, the program assumes that the loop has been breathed down. Legs and changes are entered like so:\n\nDive with changes in diluent and setpoint\n\n50, 30, 10/40, 1.30 30 mins at 50m, 1.3 setpoint\n\n20, - , 21, 1.40 change to air diluent, and 1.4 at 20m\n\n6, - , 21, 1.60 O2 flush at 6m, 1.6 decreasing to sfc.\n\nGas or setpoint changes in mid dive\n\n50, 30, 12/40, 1.30 30 mins at 50m, 1.3\n\n50, 10, 12/40, 1.20 change to 1.2 with another 10 mins\n\n40, 10, 16/30, 1.20 10 mins on new diluent at 40m\n\n20, - , 16/30, 1.40 switch to 1.4 in ascent at 20m, continue to sfc.\n\nMulti level ascent dive\n\n60, 30, 12/40, 1.30 30 mins at 60m, 1.3\n\n20, 10, 12/40, 1.20 ascend to 20m, program will insert mid stops\n\n6, - , 21, 1.60 O2 flush at 6m, 1.6 decreasing to sfc.\n\nBail out SCR for 5 mins, then ascend\n\n60, 30, 12/40, 1.30 30 mins at 60m, 1.3\n\n60, 5, 12/40, SCR 5 mins on diluent only SCR, followed by SCR ascent\n\nThe Start Setpoint value is used from surface to the first level or leg encountered in the Diluent & Setpoint list."
    },
    {
      "q": "SCR fiO2 Adjustments",
      "a": "For SCR, KISS, RB80, and CCR in SCR mode. Several planning methods offered: Volume Ratio Gas Addition method, adjustment of base inspired mix by factor or literal values.\n\nFor VRGA: Enter extraction ratio Ke (RMV / uptake of O2). Enter dump ratio r% - the fresh gas addition component. Sample values can be seen in the panel below.\n\nFor factor and literal: Enter values that represent sample points in the depth range of the dive. The fixed setting will keep the adjustment fixed beyond the deep value specified. Separate set of values for Descent, Bottom, and Ascent (all deco is ascent). Adjustment can be applied as a literal adjustment to the mix, or as a factor reduction to the mix. O2 content.\n\nThe program will alter the inspired values across the dive."
    },
    {
      "q": "CCR - SCR & OC bail out",
      "a": "Switching to OC for bail out can be done two ways. One is to manually enter the mixes as OC deco mixes and construct a plan in this combined CCR / OC manner. The CCR planning also allows for OC legs to be inserted into a CCR plan. Once the program switches to OC mode, it stays this way for the remainder of the dive.\n\nThe other bail out method is to use the Bail out planning button. This will allow different deco models and other settings to be changed for the bailout situation.\n\nWhen planning with a complex multiple segment bottom, or stepped levels, the bail out planning assumes and makes a bail out for the \"last\" segment only. To plan complex bailout situations, enter new segments manually as OC segments into the left column, and construct failure point this way.\n\nBailout or regular planning may be performed in SCR mode. Enter dive legs with the SCR option instead of a setpoint. The SCR fiO2 adjustments control the inspired mix for these legs."
    }
  ],
  "Registration": [
    {
      "q": "Trial period",
      "a": "The programs have a 30 day trial for Air and EAN dive planning. Trimix dives require a registration.\n\nIf you wish to see a sample of a trimix plan, please email support and ask for a sample."
    },
    {
      "q": "Install codes and keys",
      "a": "On the PC / Mac: A registration allows for the issue of 4 keys a year.\n\nOn an Android: A registration allows for the issue of 2 keys a year.\n\nThis should allow for extra computers and replacement computers in the future.\n\nEvery device has a unique install code and requires a key. Install codes cannot be transferred or changed. Instead, you create a new key for each new code at:\n\nnew keys\n\nEach computer and each logged on user, will need a unique key."
    },
    {
      "q": "Extra platforms",
      "a": "Registration groups:\n\nThe registration is divided into groups, and each group shown below requires its own registration purchase and fee.\n\n- Desktop - PC, Mac, Linux, (4 keys per year)\n\n- Mobiles - Android, MS Mobile, (2 keys per year)\n\n- iPhone, iPod, iPad (via Appstore only)\n\n- X1 programs (obsolete).\n\n- DR5 programs (obsolete).\n\nAll registrations are valid for life."
    },
    {
      "q": "Lost keys",
      "a": "Existing customers can reissue / resend keys from:\n\nLost keys"
    },
    {
      "q": "email change",
      "a": "Email address can be changed online at:\n\nChange email\n\nNote that you will need to be able to respond to a confirmation on the old address to activate the new address. If the old address is now dead, then contact support and request the change."
    }
  ],
  "Files": [
    {
      "q": "Saved plans and logs",
      "a": "Saving a plan updates your tissue loading data. This is where ApexDeco keeps track of tissue gas loadings for repetitive dives. Note that the repeat factor in VPM can be as long as two weeks.\n\nYou may plan and re-plan a dive as often as you like, but once the Save button is pressed, the data is committed. There is no Undo function. Please ensure that the saved information is an accurate record of the dive.\n\nThe Dive log lists all the saved dives to date. The items are\n\nSI: = surface interval in minutes\n\nProfile: (depth,time,mix),(...)\n\nDeco: mix,mix,...\n\nEach diver has a separate tissue data record and log."
    },
    {
      "q": "Output files",
      "a": "Each time a calculation is performed, that data is saved to file automatically. It overwrites the previously saved one. All data is saved into a set of folders, located in the \"My Documents\" location. This location depends entirely on your computer and choices and is typically:\n\n(XP) \"C\\Documents and Settings\\\\My Documents\\ApexDeco\\\", and (Vista, 7, 8, 10) \"C\\Users\\\\Documents\\ApexDeco\\\"\n\nCalc generates\n\nvpln-out.txt same as displayed plan\n\nvpln-sht.txt depth, time, runtime - aligned\n\nvp-short.csv depth, time, runtime - aligned in csv format\n\nLost Deco generates\n\nvp-lost.csv depth, time, runtime - aligned in csv format\n\nLess or More generates\n\nvp-mrlss.csv depth, time, runtime - aligned in csv format\n\nEach of the csv files can be imported into Excel, and manipulated or formatted further.\n\nFiles can be numbered sequentially. Right click the mouse on the main screen, and select Sequential Files. All files will be name separately from AA through to ZZ."
    },
    {
      "q": "Excel graphs",
      "a": "For the PC only, ApexDeco can link dive data directly into the Microsoft Excel program. The data link is via COM and should work with Excel version 97 and onwards. ApexDeco is supplied with a graph template (located in \"My Documents\\ApexDeco\\template\" folder).\n\nNote that this is a \"live\" connection - we compute a plan in ApexDeco, and its data is sent to Excel at the same time.\n\nTo start the link into Excel\n:\n\nPress the green Excel button in the menu bar. Excel should load and be visible next to ApexDeco. Then plan and calculate a dive as normal in ApexDeco. Each time a dive is computed, the data and a graph will be drawn into Excel. This also applies to Lost gas and Alternate (-/+) plans.\n\nIf Excel stops responding, then an error has probably occurred. The only sure way to recover from an OLE/COM error is to restart the whole computer. If excel fails always fails to start, try the re-register procedure. In the Run box, type excel /register. Excel relies on several services to be running on the computer - DCOM, RPC.\n\nOptions\n: Located on a context menu in the top menu bar (right click the top menu bar area).\n\nStart up full screen\n: controls how Excel and ApexDeco are positioned on screen on starting Excel Full screen will place V-Planner to the left, and Excel will occupy the remaining 60% of the screen.\n\nLink to graph sheets: controls the link between V-Planner and control of the visual graph sheets. Pressing the various dive tabs in V-Planner, will cause the focused sheet in Excel to follow, and displays / hides graph sheets to match the dives calculated. With this option off, data and graphs are still drawn in excel, but the focused (active) sheet is not changed.\n\nAdd template: adds a template to the list.\n\nCustom templates\n: You may build your own custom templates for use in this COM link. V-Planner always writes to first WorkSheet in the book (the \"Data\" sheet in the sample book). That sheet may have any name you choose. The graph sheets are optional. You create links between the data cells and your graph design. See the Excel help and samples for details on this.\n\nIn the worksheet\n:\n\nColumns 1 through 8 - all drawn as general formatting and floating point numbers, except the mix column which is text. This repeats again for each dive, at a column spacing of ten columns.\n\nColumns 9 and 10, (\"spare1\" and \"spare2\") and never touched (read, write or cleared). These columns are for your own custom formula.\n\nIf the Link to Graphs option is selected, then V-Planner will:\n\nAdjust Y axis Major, Minor, and Title values per metric/imperial systems.\n\nAdjust X axis Major, Minor, Maximum values to bring time scale into line.\n\nShift Active sheet to match current tab selection in V-Planner.\n\nIf Link to Graphs is not selected, then V-Planner will just fill the \"Data\" page. This allows you to create your own graph design using Excel cell links.\n\nIf Excel stops responding, then an error has probably occurred. The only sure way to recover from an OLE/COM error is to restart the whole computer. If excel fails always fails to start, try the re-register procedure. In the Run box, type \"excel /register\""
    }
  ],
  "VPM info": [
    {
      "q": "VPM & VPM-B model information",
      "a": "The Varying Permeability Model (VPM) is a bubble-based decompression model that controls bubble size by tracking critical micro-nucleus radii in the tissues. ApexDeco offers VPM-B for everyday technical use, and VPM-B/E as an extension that adds extra shallow time once deco obligations grow large (roughly 90-100 minutes), for the safest possible profile on very deep / long dives. VPM-B/FBO is a bail-out variant that speeds up the deep ascent to reduce open-circuit gas volume."
    },
    {
      "q": "VPM model data",
      "a": "VPM is experimental: there is no large peer-reviewed dataset proving it, only field experience from many thousands of recorded dives. Treat it as a tightly tuned model — it expects disciplined control of depth and time during decompression. If you are new to VPM, start with conservatism +4 and pad the last two or three stops; over time, work down toward +2 or +3 once you trust your profile."
    },
    {
      "q": "VPM history",
      "a": "VPM was developed in the 1970s by Yount, Hoffman and others, who modelled how dissolved gas forms and grows bubbles in living tissue. Over the following decades it was refined into VPM-B (Boyle-corrected) by Bruce Wienke and Erik Baker, which is the form most technical divers know today. ApexDeco implements VPM-B and VPM-B/E with adjustable conservatism so divers can choose the safety margin that fits the dive."
    }
  ]
};

const HELP_CATEGORY_ORDER = ["Dive Planning","Settings","VPM info","About"];

// "About" tab — rendered as plain HTML, not Q/A items.
const HELP_ABOUT_HTML = `
    <div class="help-about">
        <h2 data-i18n="ABOUT_TITLE">ApexDeco</h2>
        <p data-i18n="ABOUT_SUBTITLE">Dive Decompression Planner</p>
        <p>
            <span data-i18n="ABOUT_MATH_TESTS_FULL">Math verification tests. The engine is validated against the original Android MultiDeco binary (libmultideco.so). Each gas-mixing tool (Best Mix, EAD/MOD, Nitrox, Trimix, Top-up, Capacity, Density) and every decompression primitive (ZH-L16C Schreiner loading, Gradient Factor ceiling, VPM-B boundary/critical volume, CCR setpoint, extended stops, OTU/CNS, fresh/salt water SLP behavior) is covered by an automated test with tolerance checks against Android-reference values. You can run the full test suite in your browser:</span>
            <a href="https://vlasovalexey.github.io/ApexDeco/html-src/tests.html" target="_blank" rel="noopener" data-i18n="ABOUT_TESTS_LINK">open tests.html</a>.
        </p>
        <p>
            <span data-i18n="ABOUT_ALGORITHMS_FULL">Based on the Bühlmann ZH-L16C algorithm with Gradient Factors. Implements decompression planning for OC diving. Includes gas mixing tools: Best Mix, EAD/MOD, Nitrox, Trimix, Top-up, Capacity, Density.</span>
        </p>
        <p>
            <span data-i18n="ABOUT_COPYRIGHT">Copyright &copy; Alexey Vlasov. Licensed under the</span>
            <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener" data-i18n="ABOUT_LICENSE_LINK">GNU Affero General Public License v3.0 (AGPLv3)</a>.
        </p>
        <div class="warning" style="margin-top:16px; text-align:left;">
            <strong data-i18n="ABOUT_WARNING_TITLE">WARNING!</strong> <span data-i18n="ABOUT_WARNING_TEXT_FULL">THERE IS ALWAYS A RISK OF DECOMPRESSION SICKNESS (DCS) FOR ANY DIVE PROFILE EVEN IF YOU FOLLOW THE DIVE PLAN PRESCRIBED BY DIVE TABLES. NO PROCEDURE OR DIVE TABLE WILL PREVENT THE POSSIBILITY OF DCS OR OXYGEN TOXICITY! An individual's physiological make up can vary from day to day. You are strongly advised to remain well within the exposure limits provided by the planner to minimize the risk of DCS.</span>
        </div>
    </div>
`;

function renderHelp() {
    const root = document.getElementById('screen-help');
    if (!root) return;
    if (root.dataset.rendered === '1') return;

    const tabs = HELP_CATEGORY_ORDER.map((c, i) => `
        <button class="help-tab${i === 0 ? ' active' : ''}" data-help-tab="${c}" onclick="selectHelpTab('${c.replace(/'/g, "\'")}', this)">${c}</button>
    `).join('');

    const panels = HELP_CATEGORY_ORDER.map((c, i) => {
        let body;
        if (c === 'About') {
            body = HELP_ABOUT_HTML;
        } else {
            body = (HelpData[c] || []).map(it => `
                <details class="help-item">
                    <summary>${escapeHelpHtml(it.q)}</summary>
                    <div class="help-answer">${formatHelpAnswer(it.a)}</div>
                </details>
            `).join('');
        }
        return `<div class="help-panel${i === 0 ? ' active' : ''}" data-help-panel="${c}">${body}</div>`;
    }).join('');

    root.innerHTML = `
        <div class="card help-card">
            <div class="card-body" style="padding:0;">
                <div class="help-tabs">${tabs}</div>
                <div class="help-content">${panels}</div>
            </div>
        </div>
    `;
    root.dataset.rendered = '1';
}

function selectHelpTab(name, btn) {
    document.querySelectorAll('.help-tab').forEach(t => t.classList.toggle('active', t === btn));
    document.querySelectorAll('.help-panel').forEach(p => {
        p.classList.toggle('active', p.dataset.helpPanel === name);
    });
}

function escapeHelpHtml(s) {
    return String(s).replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
}

// Plan-leg pattern: "<depth>, <time>, <mix>[, <setpoint>] <comment>"
// e.g. "22, 5, 32 5 mins at 22m, 32%"
//      "22, - , 18/30 swap to bottom mix when leaving 22m"
//      "50, 30, 10/40, 1.30 30 mins at 50m, 1.3 setpoint"
const PLAN_LEG_RE = /^(\d+)\s*,\s*(-|\d+)\s*,\s*([0-9A-Za-z/]+)(?:\s*,\s*([0-9.]+|SCR))?\s+(.+)$/;

function parsePlanLeg(line) {
    const m = line.match(PLAN_LEG_RE);
    if (!m) return null;
    return { depth: m[1], time: m[2], mix: m[3], sp: m[4] || '', note: m[5] };
}

function renderPlanTable(rows) {
    const hasSP = rows.some(r => r.sp);
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Depth</th><th>Time</th><th>Mix</th>';
    if (hasSP) html += '<th>SP</th>';
    html += '<th>Note</th></tr></thead><tbody>';
    for (const r of rows) {
        html += '<tr>';
        html += `<td>${escapeHelpHtml(r.depth)}</td>`;
        html += `<td>${escapeHelpHtml(r.time === '-' ? '—' : r.time)}</td>`;
        html += `<td>${escapeHelpHtml(r.mix)}</td>`;
        if (hasSP) html += `<td>${escapeHelpHtml(r.sp)}</td>`;
        html += `<td style="text-align:left;">${escapeHelpHtml(r.note)}</td>`;
        html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
}

function formatHelpAnswer(s) {
    // Split by blank lines into blocks; within each block, group consecutive
    // lines by mode: 'ul' (bullet), 'plan' (dive plan leg), or 'p' (paragraph).
    const blocks = String(s).split(/\n\s*\n/);
    return blocks.map(block => {
        const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
        // Section heading: single short line with no sentence punctuation.
        if (lines.length === 1 && lines[0].length <= 60 && !/[.,:?!]$/.test(lines[0]) && !lines[0].startsWith('- ') && !parsePlanLeg(lines[0])) {
            return `<h4 class="help-section">${escapeHelpHtml(lines[0])}</h4>`;
        }
        let html = '';
        let buf = [];
        let mode = null;
        const flush = () => {
            if (!buf.length) return;
            if (mode === 'ul') {
                html += '<ul>' + buf.map(l => `<li>${escapeHelpHtml(l.slice(2))}</li>`).join('') + '</ul>';
            } else if (mode === 'plan') {
                html += renderPlanTable(buf);
            } else {
                html += `<p>${escapeHelpHtml(buf.join(' '))}</p>`;
            }
            buf = [];
        };
        for (const l of lines) {
            let m, item;
            if (l.startsWith('- ')) { m = 'ul'; item = l; }
            else if ((item = parsePlanLeg(l))) { m = 'plan'; }
            else { m = 'p'; item = l; }
            if (m !== mode) { flush(); mode = m; }
            buf.push(item);
        }
        flush();
        return html;
    }).join('');
}
