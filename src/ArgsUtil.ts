
export class ArgsUtil {
    static list(): string[] {
        return process.argv;
    }
    static get(key: string): string | null {
        var value: string = null
        process.argv.forEach((v, i, a) => {
            let keyword = `--${key}=`
            let index = v.indexOf(keyword)
            if (index >= 0) {
                value = v.replace(keyword, '')
            }
        })
        return value
    }
}