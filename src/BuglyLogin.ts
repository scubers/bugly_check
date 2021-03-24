import * as driver from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'
import { ArgsUtil } from './ArgsUtil'
import * as fs from 'fs'
import { Logger } from './util/Logger'
import { FeishuBot } from './BuglyService'

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

    let headless = ArgsUtil.get('silent') == '1'

    Logger.info(`开始登录: ${buglyHost}`)

    var option = new Options()
    if (headless) {
      Logger.info(`开启headless`)
      option = option.addArguments(
        '--no-sandbox',
        '--headless',
        '--disable-dev-shm-usage'
      )
    } else {
      Logger.info(`关闭headless，如果需要加上参数 --headless=1`)
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
      Logger.info(`输入完帐号密码，等待跳转。。`)
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
      Logger.info(JSON.stringify(info))
      return info
    } catch (error) {
      Logger.info(error)
    } finally {
      // 退出
      browser.quit()
    }
  }

  async loginByQR(options: {
    appId: string
    appSecret: string
  }): Promise<{ token: string; session: string }> {
    let buglyHost = 'https://bugly.qq.com/v2/workbench/apps'

    let headless = ArgsUtil.get('silent') == '1'

    Logger.info(`开始登录: ${buglyHost}`)

    var option = new Options()
    if (headless) {
      Logger.info(`开启headless`)
      option = option.addArguments(
        '--no-sandbox',
        '--headless',
        '--disable-dev-shm-usage'
      )
    } else {
      Logger.info(`关闭headless，如果需要加上参数 --headless=1`)
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

      var session: string = null

      while (session == null || session.length == 0) {
        let qrelement = await browser.findElement(driver.By.id('qrlogin_img'))

        let shot = await qrelement.takeScreenshot()

        var content = Buffer.from(shot, 'base64')

        var qrcodePath = `${__dirname}/qr.png`

        fs.writeFileSync(qrcodePath, content)

        Logger.info(`登录二维码路径: ${qrcodePath}`)

        if (options.appId != null && options.appSecret != null) {
          await new FeishuBot(options.appId, options.appSecret).sendImage(
            qrcodePath
          )
          Logger.info('发送飞书完成')
        }

        while (session == null) {
          try {
            await this.delay(1000)
            session = (await browser.manage().getCookie('bugly_session')).value
            console.log(`get session: ${session}`)
          } catch (error) {
            console.log('no session')
          }
        }
      }

      Logger.info('获取session成功，等待页面跳转')
      await this.delay(5000)

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
        session: session
      }
      Logger.info(info)
      return info
    } catch (error) {
      Logger.info(error)
    } finally {
      // 退出
      browser.quit()
    }
  }
}
