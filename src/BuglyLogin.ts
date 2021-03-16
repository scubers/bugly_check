import * as driver from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'
import { ArgsUtil } from './ArgsUtil'

export class BuglyLoginAction {
  delay(time: number): Promise<void> {
    return new Promise((r, j) => {
      setTimeout(() => {
        r()
      }, time)
    })
  }
  async login(
    account: string,
    pwd: string
  ): Promise<{ token: string; session: string }> {
    let buglyHost = 'https://bugly.qq.com/v2/workbench/apps'

    let headless = ArgsUtil.get('headless') != '1'

    var option = new Options()
    if (headless) {
      option = option.addArguments(
        '--no-sandbox',
        '--headless',
        '--disable-dev-shm-usage'
      )
    }

    let browser = new driver.Builder()
      .forBrowser('chrome')
      // let browser = new driver.Builder().forBrowser('safari')
      .setChromeOptions(option)
      .build()
    try {
      await browser.get(buglyHost)
      await this.delay(5000)
      // 切换到iframe
      let frame = await browser.findElements(driver.By.id('ptlogin_iframe'))
      await browser.switchTo().frame(frame[0])
      // 点击帐号密码登录
      let switcher = await browser.findElement(driver.By.id('switcher_plogin'))
      switcher.click()
      // 输入帐号密码
      let accountEle = await browser.findElement(driver.By.id('u'))
      await accountEle.sendKeys(account)
      let pwdEle = await browser.findElement(driver.By.id('p'))
      await pwdEle.sendKeys(pwd)
      // 点击登录
      let btn = await browser.findElement(driver.By.id('login_button'))
      btn.click()
      // 等3s，等待重定向
      await this.delay(10000)
      // 获取session
      let session = await browser.manage().getCookie('bugly_session')
      // this.cookie = `bugly_session=${session.value};`
      // 获取token
      let metas = await browser.findElements(driver.By.tagName('meta'))
      var token: string = ''
      for (var i = 0; i < metas.length; i++) {
        if ((await metas[i].getAttribute('name')) == 'token') {
          token = await metas[i].getAttribute('content')
          // this.token = token
        }
      }
      // let info = new BuglyLoginInfo(token, session.value)
      let info = {
        token: token,
        session: session.value
      }
      console.log(info)
      return info
    } catch (error) {
      console.log(error)
    } finally {
      // 退出
      browser.quit()
    }
  }
}

// async function start() {
//   console.log(ArgsUtil.list())
//   let action = new BuglyLoginAction()
//   var info = await action.login('jr-wong@qq.com', 'Whjyrf.707@qq')
//   console.log(info)
// }
