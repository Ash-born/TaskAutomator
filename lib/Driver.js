require('chromedriver');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path')
const moment = require('moment')
let {
    utilRetries,
    width,
    height,
    headlessMode,
    defaultTimeout,
    randomDelay = 0,
    evidencesEnabled,
    minimumRandomDelay = 0,
    maximumRandomDelay = 0
} = require('config').get('browser');

headlessMode = parseInt(headlessMode)
defaultTimeout = parseInt(defaultTimeout)
evidencesEnabled = parseInt(evidencesEnabled)

const { delay } = require('./utils');
const log = require('./logger')({ logger: 'file' })
class Driver {

    constructor({ extensions = [], profile = null } = {}) {
        this.extensions = extensions;
        this.profile = profile;
        this.browser = this.init();
    }

    init() {

        let driver = new Builder().forBrowser('chrome');
        let chromeOptions = new chrome.Options().addArguments(
            `--window-size=${width},${height}`,
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage"
        );

        if (headlessMode) {
            chromeOptions = chromeOptions.addArguments(
                "--headless",
                "--ignore-certificate-errors",
            )
        }

        if (this.profile) {
            chromeOptions = chromeOptions.addArguments(`user-data-dir=${this.profile}`)
        }

        if (this.extensions.length) {
            for (const ext of this.extensions) {
                chromeOptions = chromeOptions.addExtensions(ext)
            }
        }
        else {
            chromeOptions = chromeOptions.addArguments("--disable-extensions")
        }
        return driver.setChromeOptions(chromeOptions).build();
    }

    async sleep(ms = defaultTimeout) {
        await this.browser.sleep(ms)
    }

    async randomSleep() {
        if (randomDelay)
            await delay({ ms: this.getRandomMillisecondsTimeout() })
    }

    async click(element, retry = utilRetries) {
        try {
            await this.randomSleep()
            await element.click()
            await this.randomSleep()
            log.info(`util: click(selenium) attempt successful.\nRemaining Retries: ${retry - 1} `)
        } catch (err) {
            log.info(`util: click(Selenium) attempt failed for element: ${element}.\nError: ${err} `)
            await this.takeEvidence({ utility: 'click-se' })
            try {
                await this.browser.executeScript("arguments[0].click();", element)
                log.info(`util: click(Javascript) attempt successful.\nRemaining Retries: ${retry - 1} `)
            } catch (err) {
                log.info(`util: click(Javascript) attempt failed for element: ${element}.\nError: ${err} `)
                await this.takeEvidence({ utility: 'click-js' })

                if (retry > 0) await this.click(element, retry - 1)
                else throw (`util: 'click' failed after ${utilRetries} retries`)
            }
        }
    }

    async executeScript(script) {
        try {
            return await this.browser.executeScript(script)

        } catch (err) {
            console.log(err)
        }
    }


    async jsClick(element, retry = utilRetries) {
        try {
            await this.browser.executeScript("arguments[0].click();", element)
            log.info(`util: click(Javascript) attempt successful.\nRemaining Retries: ${retry - 1} `)
        } catch (err) {
            log.info(`util: click(Javascript) attempt failed for element: ${element}.\nError: ${err} `)
            await this.takeEvidence({ utility: 'click-js' })
            if (retry > 0) await this.jsClick(element, retry - 1)
            else throw (`util: 'jsClick' failed after ${utilRetries} retries`)
        }
    }

    getRandomMillisecondsTimeout(min = minimumRandomDelay, max = maximumRandomDelay) {
        min = Math.ceil(min);
        max = Math.floor(max);
        const timeout = Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
        log.info(`util: getRandomMillisecondsTimeout generated ${timeout} milliseconds of random timeout`)
        return timeout
    }

    async waitUntilUrlIs(url, retry = utilRetries, timer = defaultTimeout) {
        try {
            await this.browser.wait(until.urlIs(url), timer)
            console.log(`URL: ${url} loaded successfully. Remaining Retries: ${retry - 1}`)
        } catch (err) {
            console.log(`URL: ${url} not loaded.\n Error: ${err}\n Remaining Retries: ${retry - 1}`)
            await this.takeEvidence({ utility: 'waitUntilUrlIs' })
            if (retry > 0) await this.waitUntilUrlIs(url, retry - 1)
            else throw (`util: 'waitUntilUrlIs' failed after ${utilRetries} retries`)
        }
    }

    async waitUntilUrlContains(partialUrl, retry = utilRetries, timer = defaultTimeout) {
        try {
            await this.browser.wait(until.urlContains(partialUrl), timer)
            console.log(`Partial URL: ${partialUrl} loaded successfully. Remaining Retries: ${retry - 1}`)
        } catch (err) {
            console.log(`Partial URL: ${partialUrl} not loaded.\n Error: ${err}\n Remaining Retries: ${retry - 1}`)
            await this.takeEvidence({ utility: 'waitUntilUrlContains' })
            if (retry > 0) await this.waitUntilUrlContains(partialUrl, retry - 1)
            else throw (`util: 'waitUntilUrlContains' failed after ${utilRetries} retries`)
        }
    }

    async waitUntilTitleIs(title, retry = utilRetries, timer = defaultTimeout) {
        try {
            await this.browser.wait(until.titleIs(title), timer)
            console.log(`Title: ${title} located successfully. Remaining Retries: ${retry - 1}`)
        } catch (err) {
            console.log(`Title: ${title} not located.\n Error: ${err}\n Remaining Retries: ${retry - 1}`)
            await this.takeEvidence({ utility: 'waitUntilTitleIs' })
            if (retry > 0) await this.waitUntilTitleIs(title, retry - 1)
            else throw (`util: 'waitUntilTitleIs' failed after ${utilRetries} retries`)
        }
    }

    async waitUntilTitleContains(partialTitle, retry = utilRetries, timer = defaultTimeout) {
        try {
            await this.browser.wait(until.titleContains(partialTitle), timer)
            console.log(`Partial title: ${partialTitle} located successfully. Remaining Retries: ${retry - 1}`)
        } catch (err) {
            console.log(`Partial title: ${partialTitle} not located.\n Error: ${err}\n Remaining Retries: ${retry - 1}`)
            await this.takeEvidence({ utility: 'waitUntilTitleContains' })
            if (retry > 0) await this.waitUntilTitleContains(partialTitle, retry - 1)
            else throw (`util: 'waitUntilTitleContains' failed after ${utilRetries} retries`)
        }
    }

    async waitUntilElementHasText(locatorType, locator, retry = utilRetries) {
        try {
            let sentinal = false
            let count = 0
            do {
                const element = await this.findElement(locatorType, locator)
                const elementText = await element.getText()
                if (elementText.length)
                    sentinal = true
                else {
                    console.log(`util: 'waitUntilElementHasText' retrying. . .`)
                    count++
                    await delay(defaultTimeout * 0.1)
                }
            }
            while (!sentinal && count < 10)

            if (count === 10) {
                console.log(`util: 'waitUntilElementHasText' failed. ${count} text not loaded in element . . .`)
                throw (`util: 'waitUntilElementHasText' failed. ${count} text not loaded in element . . .`)
            }
            else
                return true

        } catch (err) {
            console.log(`util: 'waitUntilElementHasText' failed.\n Error: ${err}\n Remaining Retries: ${retry - 1}`)
            await this.takeEvidence({ utility: 'waitUntilElementHasText' })
            if (retry > 0) await this.waitUntilElementHasText(locatorType, locator, retry - 1)
            else throw (`util: 'waitUntilElementHasText' failed after ${utilRetries} retries`)
        }
    }

    async loadUrl(url) {
        try {
            await this.browser.get(url)
            await this.waitUntilPageIsLoaded()
            await this.randomSleep()
            log.info(`util: loadUrl attempt for ${url} successful.`)
        } catch (err) {
            log.info(`util: loadUrl attempt failed for ${url} successful.`)
            await this.takeEvidence({ utility: 'loadUrl' })
        }
    }

    async waitUntilPageIsLoaded(timer = defaultTimeout) {
        return this.browser.wait(() => {
            return this.browser.executeScript('return document.readyState').then(function (readyState) {
                return readyState === 'complete';
            });
        }, timer);
    }

    async getAllWindowHandles() {
        return await this.browser.getAllWindowHandles()
    }

    async waitUntilTabCountIs(retry = utilRetries, timer = defaultTimeout) {
        try {
            await this.browser.wait(until.urlIs(url), timer)
            console.log(`URL: ${url} loaded successfully. Remaining Retries: ${retry - 1}`)
        } catch (err) {
            console.log(`URL: ${url} not loaded.\n Error: ${err}\n Remaining Retries: ${retry - 1}`)
            await this.takeEvidence({ utility: 'waitUntilUrlIs' })
            if (retry > 0) await this.waitUntilUrlIs(url, retry - 1)
            else throw (`util: 'waitUntilUrlIs' failed after ${utilRetries} retries`)
        }
    }

    async waitUntilTabCountIs(windowsCount, retry = utilRetries) {
        try {
            let sentinal = false
            let count = 0
            do {
                const windows = await this.getAllWindowHandles()
                if (windows.length === windowsCount)
                    sentinal = true
                else {
                    console.log(`util: 'waitUntilTabCountIs' retrying. . .`)
                    count++
                    await delay(defaultTimeout * 0.1)
                }
            }
            while (!sentinal && count < 10)

            if (count === 10) {
                console.log(`util: 'waitUntilTabCountIs' failed. ${count} browser windows not loaded yet . . .`)
                throw (`util: 'waitUntilTabCountIs' failed. ${count} browser windows not loaded yet . . .`)
            }
            else
                return true

        } catch (err) {
            console.log(`util: 'waitUntilTabCountIs' failed.\n Error: ${err}\n Remaining Retries: ${retry - 1}`)
            await this.takeEvidence({ utility: 'waitUntilTabCountIs' })
            if (retry > 0) await this.waitUntilTabCountIs(windowsCount, retry - 1)
            else throw (`util: 'waitUntilTabCountIs' failed after ${utilRetries} retries`)
        }
    }
    async close() {
        await this.randomSleep()
        return await this.browser.close()
    }

    async switchContextToLatestTab() {
        const windows = await this.browser.getAllWindowHandles()
        await this.randomSleep()
        return await this.browser.switchTo().window(windows[windows.length - 1]);
    }

    async switchContextToNthTab(n) {
        const windows = await this.browser.getAllWindowHandles()
        if (n >= 1 && n <= windows.length) {
            await this.randomSleep()
            return await this.browser.switchTo().window(windows[n - 1]);
        }
        else
            throw (`util: 'switchContextToNthTab' Invalid window index ${n} provided. Windows are available upto ${windows.length}`)
    }

    async findElement(locatorType, locator, retry = utilRetries, timer = defaultTimeout) {
        try {
            const element = await this.browser.wait(until.elementLocated(By[locatorType](locator[locatorType])), timer)
            log.info(`WebElement: ${locator} loaded successfully. Remaining Retries: ${retry - 1}`)
            return element
        } catch (err) {
            log.info(`WebElement: ${locator} not loaded.\n Error: ${err}\n Remaining Retries: ${retry - 1}`)
            await this.takeEvidence({ utility: 'findElement' })
            if (retry > 0) return await this.findElement(locatorType, locator, retry - 1)
            else throw (`util: 'findElement' failed after ${utilRetries} retries`)
        }
    }

    async refresh() {
        return await this.browser.navigate().refresh();
    }

    async quit() {
        log.info('Closing all browser windows ...')
        return await this.browser.quit();
    }

    async elementExist(locatorType, locator, timer = defaultTimeout / 3) {
        try {
            const element = await this.browser.wait(until.elementLocated(By[locatorType](locator[locatorType])), timer)
            log.info(`WebElement: ${locator} exists.`)
            return element
        } catch (err) {
            log.info(`WebElement: ${locator} don't exist.\n`)
            return null;
        }
    }

    async input(element, value, retry = utilRetries) {
        try {
            await this.randomSleep()
            await element.sendKeys(value)
            log.info(`Input into element: ${element} done successfully. Remaining Retries: ${retry - 1}`)
        } catch (err) {
            log.info(`Failed to input into element: ${element} .\n Error: ${err}\n Remaining Retries: ${retry - 1}`)
            await this.takeEvidence({ utility: 'input' })
            if (retry > 0) return await this.input(element, value, retry - 1)
            else throw (`util: 'input' failed after ${utilRetries} retries`)
        }
    }

    async takeEvidence({ page = 'temp', routine = 'temp', utility = 'temp' }) {
        try {
            if (evidencesEnabled) {
                const date = moment().format("DD_MMM_YYYY_HH_MM")
                const dir = path.resolve(__dirname, `../evidence/${date}/${page}/${routine}/${utility}`)

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true })
                }

                const screenShot = await this.browser.takeScreenshot()
                fs.writeFileSync(`${dir}/${Date.now()}_${page}-${routine}-${utility}.png`, screenShot, 'base64');
            }
        } catch (err) {
            log.info(`Failed to collect evidence for page: ${page}, routine: ${routine}, utility: ${utility}.\n Error: ${err}\n`)
        }
    }
}


module.exports = Driver
