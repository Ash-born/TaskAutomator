# COTPS-automata
COTPS Chrome Extension Automation Bot Powered by Selenium WebDriver &amp; Node.js

## Installation
- OS: Windows, Linux, and macOS
- Pre-requisites: Google Chrome, node.js v14.17.5 https://nodejs.org/dist/v14.17.5/node-v14.17.5-x64.msi

- Clone and checkout to `main` branch from https://github.com/ahsan-babar/cotps-automata
- Navigate to the folder and use the node package manager [npm](https://www.npmjs.com/) to install dependencies

```bash
npm install
```

## Environmental Configuration
Set your desired configurations in a `.env` and keep them at the root level of the project.
Sample `.env` file's contents should look like this:

```bash
#Browser Modes Toggles 1 to enable, 0 to disable
BROWSER_EVIDENCES_ENABLED=0
BROWSER_HEADLESS_MODE=0

#In ms
DEFAULT_TIMEOUT= 5000

#credentials
COTPS_REGION=Pakistan +92
COTPS_PHONE_NO=3249493082
COTPS_PASSWORD=Bazinga2020!

# 0 to disable, 1 to enable interval mode
INTERVAL_ENABLED=1
#In minutes
INTERVAL_TIME=133

```

## Usage
After setting the above configurations in `.env` file, run the following command to execute the scraping:
```bash
 npm start
```

## Debug
debug logs can be found in `debug.log` file being generated during the execution.

## Contact
Please feel free to reach out at https://www.fiverr.com/ahsanbabar147 in case of any concerns.