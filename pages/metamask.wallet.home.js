const urls = {
    main: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#'
}

const redirectUrls = {
    sendView: `chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#send`,
    restoreWallet: `chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#restore-vault`,
}

const locators = {
    allDoneBtn: { css: `button.button` },
    popOverContent: { css: 'div#popover-content > div > div.popover-container > div.popover-bg  + section' },
    popOverContentCloseeBtn: { css: `div#popover-content button[data-testid='popover-close']` },
    etheriumBalance: { css: 'div[data-testid="eth-overview__primary-currency"] > span:nth-child(1)' },
    copyAccountAddressToClipBoardBtn: { css: `button.selected-account__clickable` },
    sendBtn: { css: `button[data-testid="eth-overview-send"]` },
    ensInputField: { css: `input[data-testid="ens-input"]` },
    ensInputTitle: { css: `div.ens-input__selected-input__subtitle` },
    closeSendForm: { css: 'div.ens-input__wrapper__action-icon--erase' },
    myAccountBtn: { css: 'div.identicon' },
    lockAccountBtn: { css: 'button.account-menu__lock-button' },
    unlockAccountPageToImportWalletLink: { css: 'button.unlock-page__link--import' }
}

module.exports = Object.freeze({
    urls, redirectUrls, locators
})
