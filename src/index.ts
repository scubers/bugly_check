import * as fs from 'fs'
import { BuglyLoginAction } from './BuglyLogin'
import {
  BuglyCheckTarget,
  BuglyService,
  ErrorType,
  FeishuPoster
} from './BuglyService'
import * as readline from 'readline'

const authFile = `${__dirname}/../.auth.json`
const tokenFile = `${__dirname}/../.token.json`

interface Token {
  token: string
  session: string
  time: number
}

interface Auth {
  pwd: string
  account: string
}

async function inputAuth(): Promise<Auth> {
  return new Promise((resolve, reject) => {
    var window = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    var auth: Auth = {
      account: '',
      pwd: ''
    }
    window.question('bugly account: ', (account) => {
      auth.account = account
      window.question('bugly pwd: ', (pwd) => {
        auth.pwd = pwd

        resolve(auth)
        window.close()
      })
    })
  })
}

async function persistentToken(): Promise<Token> {
  if (!fs.existsSync(authFile)) {
    // 写入
    console.log('---')
    var input = await inputAuth()
    fs.writeFileSync(authFile, JSON.stringify(input))
  }

  var content = fs.readFileSync(authFile, 'utf8')
  var auth: Auth = JSON.parse(content)
  var info = await new BuglyLoginAction().login(auth.account, auth.pwd)
  const token: Token = {
    token: info.token,
    session: info.session,
    time: new Date().getTime()
  }
  fs.writeFileSync(tokenFile, JSON.stringify(token))
  return token
}

async function getCachedToken(): Promise<Token> {
  if (!fs.existsSync(tokenFile)) {
    return null
  }
  var content = fs.readFileSync(tokenFile, 'utf8')
  var token: Token
  try {
    token = JSON.parse(content)
  } catch (e) {
    return null
  }

  // 2小时
  if (new Date().getTime() - token.time > 3600 * 2 * 1000) {
    return null
  }
  return token
}

var targets: BuglyCheckTarget[] = [
  {
    appId: '15f7f4e8e5',
    title: 'allvalue ios',
    platform: 2
  },
  {
    appId: '6b04395266',
    title: 'allvalue android',
    platform: 1
  }
]

async function start(interval: number) {
  setTimeout(async () => {
    var token = await getCachedToken()
    if (token == null) {
      token = await persistentToken()
    }

    await Promise.all(
      targets.map(async (t) => {
        var issues = await new BuglyService(token.token, token.session).check(
          t,
          ErrorType.error,
          'last_1_hour'
        )
        await new FeishuPoster().postIssue(t, issues, ErrorType.error)
      })
    )
    await Promise.all(
      targets.map(async (t) => {
        var issues = await new BuglyService(token.token, token.session).check(
          t,
          ErrorType.crash,
          'last_1_hour'
        )
        await new FeishuPoster().postIssue(t, issues, ErrorType.crash)
      })
    )

    start(interval)
  }, interval)
}

start(3600 * 1000)
// start(5 * 1000)
