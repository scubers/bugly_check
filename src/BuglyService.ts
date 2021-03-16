import { BuglyIssue } from './entity/BuglyIssue'
import * as axios from 'axios'
import { Logger } from './util/Logger'

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

    Logger.info(url)
    let data = await this.request(url)
    Logger.info(JSON.stringify(data))
    let list = data.issueList as any[]
    let issues = list as BuglyIssue[]
    return issues
  }

  // 检查过去一小时内的崩溃，并且发送报告
  async check(
    target: BuglyCheckTarget,
    dateType: BuglyIssueDateType
  ): Promise<BuglyIssue[]> {
    Logger.info(`开始检测Bugly ${target.title}, AppId: ${target.appId}`)
    let p = new BuglyIssueSearchParam()
    p.date = dateType
    p.appId = target.appId
    p.platformId = target.platform
    p.exceptionTypeList = ['Crash', 'AllCatched', 'Unity3D', 'Lua', 'JS']
    p.rows = 100
    let issues = await this.getIssueList(p)
    Logger.info(
      `Bugly ${target.title}, AppId: ${target.appId}, result: ${JSON.stringify(
        issues
      )}`
    )
    return issues
  }

  private async request(url: string, params: any = {}): Promise<any> {
    Logger.info(`token: ${this.token}`)
    Logger.info(`session: ${this.session}`)
    let data = await axios.default.request({
      url: url,
      method: 'get',
      headers: {
        // 'x-token': token.value,
        // 'cookie': `bugly_session=${session.value};`
        'x-token': this.token,
        cookie: `bugly_session=${this.session};`
      }
    })
    if (data.data.status == 200) {
      return data.data.ret
    }
    Logger.info(data.data)
    throw 'error'
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
    await axios.default
      .request({
        url:
          'https://open.feishu.cn/open-apis/bot/v2/hook/e1549b66-b1f9-40c9-89ea-f1283dd94389',
        method: 'get',
        headers: {},
        data: {
          msg_type: 'text',
          content: {
            text: issues.map((v) => getReadableIssue(v, target)).join('\n')
          }
        }
      })
      .catch((e) => {
        Logger.info(`发送飞书出错: ${e}`)
      })
  }
}
