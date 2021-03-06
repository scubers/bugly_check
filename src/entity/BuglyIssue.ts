import { BuglyIssueVersion } from './BuglyIssueVersion'
import { BuglyCrashInfo } from './BuglyCrashInfo'

export class BuglyIssue {
  issueId: number
  issueHash: string
  issueCount: number
  crashInfo: BuglyCrashInfo
  issueVersions: BuglyIssueVersion[]
  ftName: string
  issueDocMap: BuglyIssueDoc
  crossVersionIssueId: number
  esCount: number
  esDeviceCount: number
}

export class BuglyIssueDoc {
  id: string
  issueId: number
  status: number // 0 未处理，1 已处理，2 处理中
  count: number
  sysCount: number
  productVersion: string
  deviceCount: number
  sysDeviceCount: number
  lastUpdateTime: string
  firstUploadTime: string
  lastUploadTime: string
  expName: string
  expFingure: string
  isSystemStack: number
  keyStack: string
  type: string
  averageBattery: number
  averageMemory: number
  averageSD: number
  averageStorage: number
  crossVersionIssueId: number
  versionIssueIds: number[]
  subIssueVersions: string
  expMessage: string
  rootCount: number
  sysRootCount: number
  expAddr: string
  refSdkIssueId: string
  crossVersionIssueHash: string
  crashRecordCount: number
}
