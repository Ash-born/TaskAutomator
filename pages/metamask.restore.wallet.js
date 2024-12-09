
const urls = {
    main: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#initialize/create-password/import-with-seed-phrase'
}

const redirectUrls = {
    endOfFlow: `chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#initialize/end-of-flow`
}

const locators = {
    // recoveryPhraseInput: { css: `textarea#create-new-vault__srp` },
    recoveryPhraseInput: { css: `input#create-new-vault__srp` },
    recoveryPhraseValidationResultSpan: { css: `textarea#create-new-vault__srp + span` },
    showRecoveryPhraseCheckBox: { css: `input#create-new-vault__show-srp-checkbox` },
    newPasswordInput: { css: `input#password` },
    confirmPasswordInput: { css: `input#confirm-password` },
    termsCheckBox: { css: `input#create-new-vault__terms-checkbox` },
    importWalletDisabledBtn: { css: `button[type='submit'][class*='create-new-vault__submit-button'][disabled]` },
    importWalletBtn: { css: `button[type='submit'][class*='create-new-vault__submit-button']` },
}


module.exports = Object.freeze({
    urls, redirectUrls, locators
})
