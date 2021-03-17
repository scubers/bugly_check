import { BuglyIssue } from './entity/BuglyIssue'
import * as axios from 'axios'
import { Logger } from './util/Logger'
import * as fs from 'fs'
import * as agent from 'superagent'

export type BuglyIssueDateType =
  | 'custom'
  | 'last_1_hour'
  | 'last_1_day'
  | 'last_2_day'
  | 'last_7_day'
  | 'last_15_day'
  | 'last_30_day'

export type BuglyIssuePlatformType = 1 | 2 // 1, android, 2, ios

export class BuglyIssueSearchParam {
  appId: string
  bundleId: string = ''
  startDateStr: string = ''
  endDateStr: string = ''
  date: BuglyIssueDateType = 'custom'
  searchType: string = 'detail'
  exceptionTypeList: string[] = ['Crash']
  sortOrder: string = 'desc'
  version: string = ''
  rows: number = 50
  sortField: string = 'imeiCount' // imeiCount,matchCount
  platformId: BuglyIssuePlatformType = 2
}

export interface BuglyCheckTarget {
  title: string
  appId: string
  platform: BuglyIssuePlatformType
}

function targetToString(target: BuglyCheckTarget): string {
  return `${target.title}, 【${
    target.platform == 1 ? 'android' : 'ios'
  }】, id: ${target.appId}`
}

function getLink(target: BuglyCheckTarget, issue: BuglyIssue): string {
  return `https://bugly.qq.com/v2/crash-reporting/crashes/${target.appId}/${issue.issueId}?pid=${target.platform}`
}

function getReadableIssue(issue: BuglyIssue, target: BuglyCheckTarget): string {
  var msg = '====================================\n'
  msg += `平台：${targetToString(target)}\n`
  msg += `发生时间：${issue.issueDocMap.lastUploadTime}\n`
  msg += `链接：${getLink(target, issue)}\n`
  msg += `${issue.issueDocMap.expName}\n`
  msg += `${issue.issueDocMap.expName}\n`
  msg += `${issue.issueDocMap.expMessage}\n`
  msg += `发生版本：${issue.issueVersions
    .map((v, i, a) => {
      return `【${v.version}】`
    })
    .join('\n')}\n`
  return msg
}

export class BuglyService {
  constructor(private token: string, private session: string) {}

  private async getIssueList(
    param: BuglyIssueSearchParam
  ): Promise<BuglyIssue[]> {
    var url = 'https://bugly.qq.com/v2/search?x=x'
    url += `&date=${param.date}`
    if (param.date == 'custom') {
      url += `&startDateStr=${param.startDateStr}`
      url += `&endDateStr=${param.endDateStr}`
    }
    url += `&searchType=${param.searchType}`
    url += `&exceptionTypeList=${param.exceptionTypeList}`
    url += `&sortOrder=${param.sortOrder}`
    url += `&version=${param.version}`
    url += `&rows=${param.rows}`
    url += `&sortField=${param.sortField}`
    url += `&appId=${param.appId}`
    url += `&bundleId=${param.bundleId}`
    url += `&platformId=${param.platformId}`
    url += `&start=0`
    url += `&pid=2`
    url += `&fsn=bdd32f36-da28-4c15-a68e-e07552df4b28`

    let data = await this.request(url)

    let list = data.issueList as any[]
    let issues = list as BuglyIssue[]
    return issues
  }

  // 检查过去一小时内的崩溃，并且发送报告
  async check(
    target: BuglyCheckTarget,
    dateType: BuglyIssueDateType
  ): Promise<BuglyIssue[]> {
    Logger.info(`开始检测 ${targetToString(target)}`)
    let p = new BuglyIssueSearchParam()
    p.date = dateType
    p.appId = target.appId
    p.platformId = target.platform
    p.exceptionTypeList = ['Crash', 'AllCatched', 'Unity3D', 'Lua', 'JS']
    p.rows = 100
    let issues = await this.getIssueList(p)
    return issues
  }

  private async request(url: string, params: any = {}): Promise<any> {
    let data = await axios.default.request({
      url: url,
      method: 'get',
      headers: {
        'x-token': this.token,
        cookie: `bugly_session=${this.session};`
      }
    })
    if (data.data.status == 200) {
      return data.data.ret
    }
    throw data.data
  }
}

export interface IssuePoster {
  postIssue(target: BuglyCheckTarget, issues: BuglyIssue[]): Promise<void>
}

export class FeishuPoster implements IssuePoster {
  async postIssue(
    target: BuglyCheckTarget,
    issues: BuglyIssue[]
  ): Promise<void> {
    if (issues == undefined || issues == null || issues.length == 0) return
    Logger.info(`发送到飞书，有 ${issues.length}个问题`)
    await FeishuBot.send(
      issues.map((v) => getReadableIssue(v, target)).join('\n')
    ).catch((e) => {
      Logger.info(`发送飞书出错: ${e}`)
    })
  }
}

export class FeishuBot {
  constructor(private appId: string, private appSecret: string) {}
  static botUrl =
    'https://open.feishu.cn/open-apis/bot/v2/hook/d568e91f-0ce7-4249-a343-0deb0146c799'

  static async send(text: string): Promise<void> {
    await axios.default.request({
      url: this.botUrl,
      method: 'get',
      headers: {},
      data: {
        msg_type: 'text',
        content: {
          text: text
        }
      }
    })
  }

  async sendImage(path: string): Promise<void> {
    var imageKey = await this.uploadImage(path)
    console.log(imageKey)
    await new Promise((resolve, rej) => {
      agent
        .get(FeishuBot.botUrl)
        .send({
          msg_type: 'image',
          content: {
            image_key: imageKey
          }
        })
        .end((err, resp) => {
          console.log(resp.body)
          if (err) {
            rej(err)
          } else if (resp.body.StatusCode == 0) {
            resolve(null)
          } else {
            rej(JSON.stringify(resp.body))
          }
        })
    })
  }

  private async uploadImage(path: string): Promise<string> {
    var token = await this.getTenatToken()

    return new Promise((resolve, rej) => {
      agent
        .post('https://open.feishu.cn/open-apis/image/v4/put/')
        .attach('image', path)
        .set('Authorization', `Bearer ${token}`)
        .field('image_type', 'message')
        .end((err, resp) => {
          if (err) {
            rej(err)
          } else if (resp.body.code == 0) {
            resolve(resp.body.data.image_key)
          } else {
            rej(JSON.stringify(resp.body))
          }
        })
    })
  }

  async getTenatToken(): Promise<string> {
    var info = await axios.default.request({
      url:
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/',
      method: 'post',
      headers: {
        'content-type': 'multipart/form-data'
      },
      data: {
        app_id: this.appId,
        app_secret: this.appSecret
      }
    })
    return info.data.tenant_access_token
  }
}
