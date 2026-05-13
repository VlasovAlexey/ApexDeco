const HOF_DATA = {
    founders: 'Thomas Holloway, Vladimir Polyakov, Franjo Sánchez Castejón, Nikita Azarenko, Hugo Ballester, 大漠骑兵Andy （谢鹏）, Lee Nam Gil, Marco P.',
    gold:     'Aleksandr Sestopalec, Aliaksander Lukyanchenka, Michail Balabanov, Fabrice Pierre Palacio',
    silver:   'Maxim Parinov, Anton Bedarev, Andrey Nikolskiy, Denis Bogatyrev, Alexander Svetovidov, Tomáš Tyšer, Pavel Lapshin',
    bronze:   'Evgenij Vlasov, Evgenij Pyanyh, Nikolaj Voronin, Valerij Vakshul'
};
const HOF_CONTACT_EMAIL = 'all3862000@mail.ru';
const HOF_CONTACT_PHONE = '+79204241850';
function renderHallOfFame() {
    const screen = document.getElementById('screen-halloffame');
    if (!screen || screen.dataset.rendered === '1') return;
    const cupStyle = 'max-width:96px; height:auto; display:block; margin:0 auto 8px;';
    const tierBody = 'text-align:center;';
    const nameStyle = 'font-size:14px; line-height:1.6; padding:6px 4px; word-wrap:break-word;';
    const mailHref = `mailto:${HOF_CONTACT_EMAIL}?subject=ApexDeco%20Donation`;
    const telHref  = `tel:${HOF_CONTACT_PHONE}`;
    screen.innerHTML = `
        <div class="card">
            <div class="card-header" data-i18n="HOF_TITLE">Donation Hall of Fame</div>
            <div class="card-body" style="text-align:center;">
                <div class="btn-group" style="justify-content:center;">
                    <a class="btn btn-primary" style="text-decoration:none;" href="${mailHref}" data-i18n="HOF_BTN_DONATE">How to make a Donation</a>
                    <a class="btn btn-primary" style="text-decoration:none;" href="${telHref}" data-i18n="HOF_BTN_CALL">Make Call to Developers</a>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header" data-i18n="HOF_FOUNDERS">Founders Donation Section</div>
            <div class="card-body" style="${tierBody}">
                <img src="images/cup_founder.png" alt="Founders" style="${cupStyle}">
                <div style="${nameStyle}">${HOF_DATA.founders}</div>
            </div>
        </div>
        <div class="card">
            <div class="card-header" data-i18n="HOF_GOLD">Gold Donation Section</div>
            <div class="card-body" style="${tierBody}">
                <img src="images/cup_gold.png" alt="Gold" style="${cupStyle}">
                <div style="${nameStyle}">${HOF_DATA.gold}</div>
            </div>
        </div>
        <div class="card">
            <div class="card-header" data-i18n="HOF_SILVER">Silver Donation Section</div>
            <div class="card-body" style="${tierBody}">
                <img src="images/cup_silver.png" alt="Silver" style="${cupStyle}">
                <div style="${nameStyle}">${HOF_DATA.silver}</div>
            </div>
        </div>
        <div class="card">
            <div class="card-header" data-i18n="HOF_BRONZE">Bronze Donation Section</div>
            <div class="card-body" style="${tierBody}">
                <img src="images/cup_bronze.png" alt="Bronze" style="${cupStyle}">
                <div style="${nameStyle}">${HOF_DATA.bronze}</div>
            </div>
        </div>
    `;
    screen.dataset.rendered = '1';
    if (window.languageManager && typeof window.languageManager.applyToDom === 'function') {
        window.languageManager.applyToDom(screen);
    }
}
document.addEventListener('DOMContentLoaded', function () {
    renderHallOfFame();
});
