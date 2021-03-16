import * as formatter from 'dateformat'

export class Logger {
  static info(content: any): void {
    var date = formatter(new Date(), 'yyyy-MM-dd HH:mm:ss')
    console.log(`[${date}]: ${content}`)
  }
}
