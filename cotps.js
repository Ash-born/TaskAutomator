// Can we change the configuration file name from .env to config.env ???
require('dotenv').config()
const Driver = require('./lib/Driver')
const fs = require('fs')
const path = require('path')
let { defaultTimeout, routineRetries } = require('config').get('browser')
defaultTimeout = parseInt(defaultTimeout)
routineRetries = parseInt(routineRetries)
const { region, phoneNo, password } = require('config').get('cotps')
let { enabled: intervalEnabled, time: checkInterval } = require('config').get('interval')
intervalEnabled = parseInt(intervalEnabled)
checkInterval = parseFloat(checkInterval)

const moment = require('moment')

const log = require('./lib/logger')({ logger: 'console' })

const { delay } = require('./lib/utils');

const browser = new Driver();

const login = async (browser, { routine = 'login', page = 'login', retry = routineRetries } = {}) => 
{
	try 
	{
		// Load main web page
		await browser.loadUrl('https://www.cotps.com/#/pages/login/login?originSource=userCenter')
		const regionsDropdown = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(5) > uni-text'
		})
		await browser.click(regionsDropdown)

		// "Language" section
		const regionsDropdownOptions = await browser.findElement('xpath', 
		{
			xpath: `/html/body/uni-app/uni-page/uni-page-wrapper/uni-page-body/uni-view/uni-view/uni-view[text()='${region}']`
		})
		await browser.click(regionsDropdownOptions)

		// "Mobile phone number" / user name section
		const phoneNoInput = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(5) > uni-input > div > input'
		})
		await browser.click(phoneNoInput)
		await browser.input(phoneNoInput, phoneNo)

		// "Password" section
		const passwordInput = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(7) > uni-input > div > input'
		})
		await browser.click(passwordInput)
		await browser.input(passwordInput, password)

		// "Log in" button
		const loginBtn = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-button'
		})
		await delay({ ms: defaultTimeout / 2 })
		await browser.click(loginBtn)
		await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/userCenter/userCenter')
		await browser.waitUntilPageIsLoaded()

	} 
	catch (err) 
	{
		log.debug(`routine: ${routine} failed. Error: ${err}\n`)
		await browser.takeEvidence({ routine, page })
		if (retry > 0) await login(browser, { retry: retry - 1 })
		else throw (`routine: '${routine}' failed after ${routineRetries} retries`)
	}
}

const confirmNotificationDialog = async browser => 
{
	const confirmNotification = await browser.elementExist('css', 
	{
		css: 'body > uni-app > uni-modal > div.uni-modal > div.uni-modal__ft'
	}, defaultTimeout)
	confirmNotification && await browser.click(confirmNotification)
}

const checkInsufficientBalanceAlert = async browser => 
{
	const alertDialog = await browser.elementExist('css', 
	{
		css: 'body > uni-app > uni-toast > div.uni-toast > i.uni-icon-error + p.uni-toast__content'
	}, defaultTimeout)

	if (alertDialog) 
	{
		//let text = await alertDialog.getText() || ''
		//text = text.trim()
		//if (text.includes('The balance is lower than')) {
		//	return true
		//}
		return true
	}
	return false

}

// Derk May22 - Created this function
const receiveCommissions = async (browser, { routine = 'receiveCommissions', page = 'receiveCommissions', retry = routineRetries } = {}) => 
{
	try 
	{
		// Get / press the "Mine" button
		const userCenterBtn = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-tabbar > div.uni-tabbar > div:nth-child(5) > div'
		})
		await browser.click(userCenterBtn)

		await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/userCenter/userCenter')
		await browser.waitUntilPageIsLoaded()

		// Get / press the "My team" button
		const myTeamBtn = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.box-wrap > uni-view > uni-view.menu-wrap > div:nth-child(6) > div'
		})
		await browser.click(myTeamBtn)
		await confirmNotificationDialog(browser)

		// Derk - May22 - 
		// HERE I WANT TO CHECK THE AMOUNT IN "Residual incomes" (ri), AND SKIP/RETURN IF ZERO.
		// IF > ZERO, LOG TO CONSOLE THIS FIGURE AS WELL AS THE AMOUNT FROM "Total incomes" (ti):
		// console.log('> > > > > Received $ri, Total: $ti < < < < <', moment());
		// 
		// IMPORTANT NOTE: On this page (https://www.cotps.com/#/pages/userCenter/myTeam)...
		// At the top there are 3 buttons, LV1, LV2, LV3; it defaults to LV1.  The code I tried to write 
		// here only clicks "Receive" for Level 1 (LV1), but I also need it to do the same for LV2 & LV3
		//
		// Get / press the "Receive" button
		const receiveBtn = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.card-wrap > uni-view.card-wrap-content > uni-button'
		})
		await browser.click(receiveBtn)
		await confirmNotificationDialog(browser)

		// Get / press the back button to return to userCenter
		const backBtn = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-page > uni-page-head > uni-page-head.uni-page-head.uni-page-head-hd.uni-page-head-btn'
		})
		await browser.click(backBtn)
		await confirmNotificationDialog(browser)
	}
	catch (err) 
	{
		log.debug(`routine: ${routine} failed. Error: ${err}\n`)
		await browser.takeEvidence({ routine, page })
		if (retry > 0) {
			await browser.refresh()
			await receiveCommissions(browser, { retry: retry - 1 })
		}
		else throw (`routine: '${routine}' failed after ${routineRetries} retries`)
	}
}

const loadTransactionHall = async (browser, { routine = 'loadTransactionHall', page = 'loadTransactionHall', retry = routineRetries } = {}) => 
{
	try 
	{
		// Wait until on main user center page
		await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/userCenter/userCenter')
		await browser.waitUntilPageIsLoaded()
		await confirmNotificationDialog(browser)

		// Get / press the Transaction Hall button on bottom
		const transactionHallBtn = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-tabbar > div.uni-tabbar > div:nth-child(3) > div'
		})
		await browser.click(transactionHallBtn)

		// Wait until Transaction page is loaded
		await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/transaction/transaction')
		await browser.waitUntilPageIsLoaded()

		await confirmNotificationDialog(browser)
	}
	catch (err) 
	{
		log.debug(`routine: ${routine} failed. Error: ${err}\n`)
		await browser.takeEvidence({ routine, page })
		if (retry > 0) 
		{
			await browser.refresh()
			await transactionHall(browser, { retry: retry - 1 })
		}
		else throw (`routine: '${routine}' failed after ${routineRetries} retries`)
	}
}

const makeTransactions = async (browser, { routine = 'makeTransactions', page = 'loadTransactionHall', retry = routineRetries } = {}) => 
{
	try 
	{
		// Wait until Transaction page is loaded
		await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/transaction/transaction')
		await browser.waitUntilPageIsLoaded()
		await delay({ ms: defaultTimeout * 0.5 })

		// Waiting for loading wallet balance
		await browser.waitUntilElementHasText('css', 
		{
			css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.money-num`
		})
		await browser.waitUntilElementHasText('css', 
		{
			css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.division-wrap > uni-view.division-right > uni-view.division-num`
		})

		// Derk - May22:
		// Here it is programmed to press the "Immediate competition for orders" button (and complete transaction) until the 
		// "Insufficient Funds" popup appears, which happens when wallet balance < $5.  
		//
		// I'll call this NTO ("normal transaction operation") below.
		//
		// What I would like it to do instead:
		//
		// Check if Wallet balance is above THRESHHOLD_BALANCE from config file, and if so, run NTO.  But if it is less 
		// than THRESHHOLD_BALANCE, start a counter which is incremented every time it runs and still has less than 
		// THRESHHOLD_BALANCE in wallet.  If counter reaches 3, then (on 4th run) check if Wallet balance is over $5 and if so, run NTO.
		
		let insufficientBalance = false
		do 
		{
			const findOrdersBtn = await browser.findElement('css', 
			{
				css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.grab-orders-wrap.grab-orders-wrap1 > uni-button'
			})
			await browser.click(findOrdersBtn)

			insufficientBalance = await checkInsufficientBalanceAlert(browser)
			if (insufficientBalance) 
			{
				log.debug(`routine: ${routine} Transaction not possible.\n`)
				break;
			}
			console.log('* * * * * * * Executing Transaction * * * * * * *', moment());

			// wait for order dialog to display
			await browser.findElement('css', 
			{
				css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.fui-dialog__wrap.fui-wrap__show > uni-view`
			})

			//const cancelBtn = await browser.findElement('css', 
			//{
			//	css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.fui-dialog__wrap.fui-wrap__show > uni-view > uni-view > uni-view.buttons > uni-button[type="default"]`
			//})
			//await browser.click(cancelBtn)

			// Get / press the "Sell" button
			const primaryBtn = await browser.findElement('css', 
			{
				css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.fui-dialog__wrap.fui-wrap__show > uni-view > uni-view > uni-view.buttons > uni-button[type="primary"]`
			})
			await browser.click(primaryBtn)

			// Get / press the "Confirm" button
			const confirmBtn = await browser.findElement('css', 
			{
				css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.fui-dialog__wrap.fui-wrap__show > uni-view > uni-view > uni-button`
			})
			await browser.click(confirmBtn)
			log.debug(`routine: ${routine} Transaction successful.\n`)

			// wait for order dialog to display to disappear
			await browser.findElement('css', 
			{
				css: `body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(7) > uni-view`
			})

		} while (!insufficientBalance)

	}
	catch (err) 
	{
		log.debug(`routine: ${routine} failed. Error: ${err}\n`)
		await browser.takeEvidence({ routine, page })
		if (retry > 0) {
			await browser.refresh()
			await makeTransactions(browser, { retry: retry - 1 })
		}
		else throw (`routine: '${routine}' failed after ${routineRetries} retries`)
	}
}

// Derk - May22 - This function works, but is no longer called because it runs continuously
const logout = async (browser, { routine = 'logout', page = 'mine', retry = routineRetries } = {}) => 
{
	try 
	{
		await browser.refresh()
		const mineBtn = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-tabbar > div.uni-tabbar > div:nth-child(5) > div'
		})
		await browser.click(mineBtn)
		await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/userCenter/userCenter')
		await browser.waitUntilPageIsLoaded()

		await confirmNotificationDialog(browser)

		const logoutBtn = await browser.findElement('css', 
		{
			css: 'body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view.box-wrap > uni-button'
		})
		await browser.click(logoutBtn)
		await browser.waitUntilUrlIs('https://www.cotps.com/#/pages/login/login?originSource=userCenter')
		await browser.waitUntilPageIsLoaded()
	}
	catch (err) 
	{
		log.debug(`routine: ${routine} failed. Error: ${err}\n`)
		await browser.takeEvidence({ routine, page })
		if (retry > 0) 
		{
			await browser.refresh()
			await logout(browser, { retry: retry - 1 })
		}
		else throw (`routine: '${routine}' failed after ${routineRetries} retries`)
	}
}

const main = async _ => 
{
	try 
	{
		console.log('------------- Execution Started -------------', moment());
		fs.rmSync(path.resolve(__dirname, './evidence'), { recursive: true, force: true });
		//await login(browser)
		//await loadTransactionHall(browser)
		await makeTransactions(browser)
		//await logout(browser)
		console.log('------------- Execution Completed -------------', moment());
	} 
	catch (err) 
	{
		console.error(err)
		//await browser.quit()
	}
	finally 
	{
		//await browser.quit()
	}
}

(async function invoker() 
{
	await login(browser)
	await loadTransactionHall(browser)
	if (intervalEnabled) 
	{
		let counter = 1
		while (true) 
		{
			await main()
			await delay({ ms: checkInterval * 60000 })
			
			// Approx every 'receiveInterval' minutes, receive any commissions due
			// (add one to receiveInterval to estimate ave time to transact)
			if (counter % (receiveInterval / (checkInterval+1)) == 0)
			{
				await receiveCommissions(browser)
				await loadTransactionHall(browser)
				counter = 1
			}
			else
			{
				await browser.refresh();
			}
			counter++;
		}
	}
	else 
	{
		await main()
			.then(console.log)
			.catch(console.error)
	}
	await logout(browser)
	await browser.quit()
})()
