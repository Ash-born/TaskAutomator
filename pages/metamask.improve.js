const urls = {
    main: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#initialize/metametrics-opt-in'
}

const locators = {
    noThanksBtn: { css: `#app-content > div > div.main-container-wrapper > div > div > div > div.metametrics-opt-in__footer > div.page-container__footer > footer > button.button.btn--rounded.btn-secondary.page-container__footer-button` },
}

module.exports = Object.freeze({
    urls, locators
})
