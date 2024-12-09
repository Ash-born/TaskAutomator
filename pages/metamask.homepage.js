const urls = {
    main: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#initialize/welcome'
}

const redirectUrls = {
    loginCheckPointRedirect: 'https://www.linkedin.com/check/manage-account'
}

const locators = {
    getStartedBtn: { css: `#app-content > div > div.main-container-wrapper > div > div > div > button[role='button']` },
}

module.exports = Object.freeze({
    urls, redirectUrls, locators
})
