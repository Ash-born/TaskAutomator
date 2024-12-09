require('dotenv').config()
const Driver = require('./lib/Driver')
const fs = require('fs')
const path = require('path')
let { defaultTimeout, routineRetries } = require('config').get('browser')
defaultTimeout = parseInt(defaultTimeout)
routineRetries = parseInt(routineRetries)
const { region, phoneNo, password } = require('config').get('cotps')
let { enabled: intervalEnabled, time: intervalTime } = require('config').get('interval')
intervalEnabled = parseInt(intervalEnabled)
intervalTime = parseFloat(intervalTime)

const moment = require('moment')

const log = require('./lib/logger')({ logger: 'console' })

const { delay } = require('./lib/utils');

const main = async _ => {
    const browser = new Driver();

    const confirmNotificationDialog = async browser => {
        const confirmNotification = await browser.elementExist('css', {
            css: 'body > uni-app > uni-modal > div.uni-modal > div.uni-modal__ft'
        }, defaultTimeout)
        confirmNotification && await browser.click(confirmNotification)
    }

    const checkInsufficientBalanceAlert = async browser => {
        const alertDialog = await browser.elementExist('css', {
            css: 'body > uni-app > uni-toast > div.uni-toast > i.uni-icon-error + p.uni-toast__content'
        }, defaultTimeout)

        if (alertDialog) {
            // let text = await alertDialog.getText() || ''
            // text = text.trim()
            // if (text.includes('The balance is lower than')) {
            //     return true
            // }
            return true
        }
        return false

    }

    const login = async (browser, { routine = 'login', page = 'login', retry = routineRetries } = {}) => {
        try {
            await browser.loadUrl('https://www.cotps.com/#/pages/login/login?originSource=userCenter')
            const regionsDropdown = await browser.findElement('css', {
                css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(5) > uni-text'
            })
            await browser.click(regionsDropdown)

            const regionsDropdownOptions = await browser.findElement('xpath', {
                xpath: `/html/body/uni-app/uni-page/uni-page-wrapper/uni-page-body/uni-view/uni-view/uni-view[text()='${region}']`
            })
            await browser.click(regionsDropdownOptions)

            const phoneNoInput = await browser.findElement('css', {
                css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(5) > uni-input > div > input'
            })
            await browser.click(phoneNoInput)
            await browser.input(phoneNoInput, phoneNo)

            const passwordInput = await browser.findElement('css', {
                css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(7) > uni-input > div > input'
            })
            await browser.click(passwordInput)
            await browser.input(passwordInput, password)

            const loginBtn = await browser.findElement('css', {
                css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-button'
            })
            await delay({ ms: defaultTimeout / 2 })
            await browser.click(loginBtn)
            await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/userCenter/userCenter')
            await browser.waitUntilPageIsLoaded()

        } catch (err) {
            log.debug(`routine: ${routine} failed. Error: ${err}\n`)
            await browser.takeEvidence({ routine, page })
            if (retry > 0) await login(browser, { retry: retry - 1 })
            else throw (`routine: '${routine}' failed after ${routineRetries} retries`)
        }
    }

    const loadTransactionHall = async (browser, { routine = 'loadTransactionHall', page = 'loadTransactionHall', retry = routineRetries } = {}) => {
        try {
            await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/userCenter/userCenter')
            await browser.waitUntilPageIsLoaded()

            await confirmNotificationDialog(browser)

            const transactionHallBtn = await browser.findElement('css', {
                css: 'body > uni-app > uni-tabbar > div.uni-tabbar > div:nth-child(3) > div'
            })
            await browser.click(transactionHallBtn)

            await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/transaction/transaction')
            await browser.waitUntilPageIsLoaded()

            await confirmNotificationDialog(browser)
        }
        catch (err) {
            log.debug(`routine: ${routine} failed. Error: ${err}\n`)
            await browser.takeEvidence({ routine, page })
            if (retry > 0) {
                await browser.refresh()
                await transactionHall(browser, { retry: retry - 1 })
            }
            else throw (`routine: '${routine}' failed after ${routineRetries} retries`)
        }
    }

    const makeTransactions = async (browser, { routine = 'makeTransactions', page = 'loadTransactionHall', retry = routineRetries } = {}) => {
        try {

            await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/transaction/transaction')
            await browser.waitUntilPageIsLoaded()
            await delay({ ms: defaultTimeout * 0.5 })

            // Waiting for loading wallet balance
            await browser.waitUntilElementHasText('css', {
                css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.money-num`
            })
            await browser.waitUntilElementHasText('css', {
                css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.division-wrap > uni-view.division-right > uni-view.division-num`
            })


            let insufficientBalance = false
            do {
                const findOrdersBtn = await browser.findElement('css', {
                    css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.grab-orders-wrap.grab-orders-wrap1 > uni-button'
                })
                await browser.click(findOrdersBtn)

                insufficientBalance = await checkInsufficientBalanceAlert(browser)
                if (insufficientBalance) {
                    log.debug(`routine: ${routine} Transaction not possible.\n`)
                    break;
                }

                // wait for order dialog to display
                await browser.findElement('css', {
                    css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.fui-dialog__wrap.fui-wrap__show > uni-view`
                })

                // const cancelBtn = await browser.findElement('css', {
                //     css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.fui-dialog__wrap.fui-wrap__show > uni-view > uni-view > uni-view.buttons > uni-button[type="default"]`
                // })
                // await browser.click(cancelBtn)

                const primaryBtn = await browser.findElement('css', {
                    css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.fui-dialog__wrap.fui-wrap__show > uni-view > uni-view > uni-view.buttons > uni-button[type="primary"]`
                })
                await browser.click(primaryBtn)

                const confirmBtn = await browser.findElement('css', {
                    css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.fui-dialog__wrap.fui-wrap__show > uni-view > uni-view > uni-button`
                })
                await browser.click(confirmBtn)
                log.debug(`routine: ${routine} Transaction successful.\n`)

                // wait for order dialog to display to disappear
                await browser.findElement('css', {
                    css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(7) > uni-view`
                })

            } while (!insufficientBalance)

        }
        catch (err) {
            log.debug(`routine: ${routine} failed. Error: ${err}\n`)
            await browser.takeEvidence({ routine, page })
            if (retry > 0) {
                await browser.refresh()
                await makeTransactions(browser, { retry: retry - 1 })
            }
            else throw (`routine: '${routine}' failed after ${routineRetries} retries`)
        }
    }

    const logout = async (browser, { routine = 'logout', page = 'mine', retry = routineRetries } = {}) => {
        try {
            await browser.refresh()
            const mineBtn = await browser.findElement('css', {
                css: 'body > uni-app > uni-tabbar > div.uni-tabbar > div:nth-child(5) > div'
            })
            await browser.click(mineBtn)
            await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/userCenter/userCenter')
            await browser.waitUntilPageIsLoaded()

            await confirmNotificationDialog(browser)

            const logoutBtn = await browser.findElement('css', {
                css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.box-wrap > uni-button'
            })
            await browser.click(logoutBtn)
            await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/login/login?originSource=userCenter')
            await browser.waitUntilPageIsLoaded()
        }
        catch (err) {
            log.debug(`routine: ${routine} failed. Error: ${err}\n`)
            await browser.takeEvidence({ routine, page })
            if (retry > 0) {
                await browser.refresh()
                await logout(browser, { retry: retry - 1 })
            }
            else throw (`routine: '${routine}' failed after ${routineRetries} retries`)
        }
    }

    try {
        console.log('-------------Execution Started-------------', moment());
        fs.rmSync(path.resolve(__dirname, './evidence'), { recursive: true, force: true });
        await login(browser)
        await loadTransactionHall(browser)
        await makeTransactions(browser)
        await logout(browser)
        console.log('-------------Execution Completed-------------', moment());
    } catch (err) {
        console.error(err)
        await browser.quit()
    }
    finally {
        await browser.quit()
    }
}

(async function invoker() {

    if (intervalEnabled) {

        while (true) {
            await main()
            await delay({ ms: intervalTime * 60000 })
        }
    }
    else {
        await main()
            .then(console.log)
            .catch(console.error)
    }
})()
