const urls = {
    main: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#initialize/end-of-flow'
}

const redirectUrls = {
    loginCheckPointRedirect: 'https://www.linkedin.com/check/manage-account'
}

const locators = {
    allDoneBtn: { css: `button.button` },
}

module.exports = Object.freeze({
    urls, redirectUrls, locators
})
