const { resolve } = require('path');
const { readdirSync } = require('fs');
const deasync = require('deasync')

class Meta {
    constructor() {
        this.createdAt = new Date()
        this.updatedAt = null
        this.deletedAt = null
        this.version = 0
    }

    update = () => {
        this.version = this.version++
        this.updatedAt = new Date()
    }
}

class Pageble {
    constructor(pageSize, pageNum) {
        this.size = pageSize
        this.number = pageNum
    }
}


// deep Number: count of recursion, -1 means never end.
// type String: "1" only file, "2" only dir, "0" both
const getDirs = (dir, type, deep) => {
    if (deep === 0) return []
    const dirents = readdirSync(dir, { withFileTypes: true })
    const files = dirents.map((dirent) => {
        const res = resolve(dir, dirent.name)
        switch (type) {
            case '1': return dirent.isDirectory() ? getDirs(res, type, --deep) : res
            default:
                if (dirent.isDirectory()) {
                    let inlayer = getDirs(res, type, --deep)
                    return Array.prototype.concat(...inlayer, res)
                }
                return type === '2' ? [] : res
        }
    })
    return Array.prototype.concat(...files)
}

const authCode = (length = 8) => {
    return Math.random().toString(36).substring(2, length + 2);
}

const toSyncFn = (asyncFn) => {
    let done = false
    let res = undefined
    asyncFn()
        .then((v) => {
            res = v
            done = true
        })
        .catch((e) => {
            done = true
            throw e
        })
    deasync.loopWhile(() => !done)
    return res
}

const sleep = (ms) => deasync.sleep(ms)

module.exports = {
    Meta,
    Pageble,
    getDirs,
    authCode,
    toSyncFn,
    sleep
}