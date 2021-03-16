
export class BuglyCrashInfo {
    crashId: string
    crashHash: string
    tagId: number
    crashDocMap: BuglyCrashDoc
}

export class BuglyCrashDoc {
    id: string
    issueId: number
    productVersion: string
    model: string
    userId: string
    expName: string
    expMessage: string
    deviceId: string
    crashCount: number
    type: string
    appUUID: string
    processName: string
    isRooted: string
    retraceStatus: number
    uploadTime: string
    crashTime: string
    mergeVersion: string
    messageVersion: string
    isSystemStack: number
    rqdUuid: string
    sysRetracStatus: number
    retraceResult: string
    appInBack: string
    cpuType: string
    isRestore: boolean
    subVersionIssueId: number
    crashId: number
    bundleId: string
    sdkVersion: string
    osVer: string
    sessionId: string
    archVersion: string
    appBaseAddr: string
    appInfo: string
    threadName: string
    detailDir: string
    memSize: string
    diskSize: string
    freeMem: string
    freeStorage: string
    country: string
    channelId: string
    startTime: string
    isReRetrace: number
    isReClassify: number
    retraceCount: number
    callStack?: string
    retraceCrashDetail: string
    apn: string
    appInAppstore: true
}