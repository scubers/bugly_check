import * as fs from 'fs'
import { BuglyLoginAction } from './BuglyLogin'
import { FeishuPoster } from './BuglyService'
import * as readline from 'readline'
import { Task } from './Task'

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

/**
 * 获取输入的帐号密码
 */
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

/**
 * 写入帐号密码
 */
async function persistentToken(): Promise<Token> {
  if (!fs.existsSync(authFile)) {
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

/**
 * 获取缓存的token
 */
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
  if (new Date().getTime() - token.time > 3600 * 3 * 1000) {
    return null
  }
  return token
}

var targets: Task[] = [
  new Task({
    appId: '15f7f4e8e5',
    title: 'allvalue',
    platform: 2
  }),
  new Task({
    appId: '6b04395266',
    title: 'allvalue',
    platform: 1
  })
]

async function loopInterval(interval: number, action: () => Promise<void>) {
  await action()
  setTimeout(async () => {
    await loopInterval(interval, action)
  }, interval)
}

async function start(interval: number) {
  loopInterval(interval, async () => {
    var token = await getCachedToken()
    if (token == null) {
      token = await persistentToken()
    }

    for (var v in targets) {
      var issues = await targets[v].run(token.token, token.session)
      await new FeishuPoster().postIssue(targets[v].target, issues)
    }
  })
}

start(5 * 1000)
