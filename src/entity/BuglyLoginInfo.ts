export class BuglyLoginInfo {
  token: string
  session: string
  constructor(token: string, session: string) {
    this.token = token
    this.session = session
  }
}
