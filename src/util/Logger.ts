import * as formatter from 'dateformat'

export class Logger {
  static info(content: any): void {
    var date = formatter(new Date(), 'yyyy-mm-dd HH:MM:ss')
    console.log(`[${date}]: ${content}`)
  }
}
