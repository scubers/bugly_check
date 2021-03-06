import { BuglyCheckTarget, BuglyService } from './BuglyService'
import { BuglyIssue } from './entity/BuglyIssue'
import { Logger } from './util/Logger'

export class Task {
  private lastIssueDate: number = new Date().getTime()

  constructor(public target: BuglyCheckTarget) {
    this.lastIssueDate = new Date().getTime() - 1000 * 60
  }

  async run(token: string, session: string): Promise<BuglyIssue[]> {
    var issues = await this.hourIssues(token, session)
    if (issues.length == 0) {
      Logger.info(`一小时内没有错误`)
      return
    }

    var newIssues = issues.filter(
      (v) =>
        this.getTimestamp(v) > this.lastIssueDate && v.issueDocMap.status != 1
    )

    if (newIssues.length > 0) {
      this.lastIssueDate = this.getTimestamp(newIssues[0])
    }

    Logger.info(`新问题: ${newIssues.length}`)
    Logger.info(`最新更新时间: ${new Date(this.lastIssueDate)}`)

    Logger.info(JSON.stringify(newIssues))
    return newIssues
  }

  private hourIssues(token: string, session: string): Promise<BuglyIssue[]> {
    return new BuglyService(token, session).check(this.target, 'last_1_hour')
  }

  private getTimestamp(issue: BuglyIssue): number {
    var date = issue.issueDocMap.lastUploadTime
    return Date.parse(date)
  }
}
