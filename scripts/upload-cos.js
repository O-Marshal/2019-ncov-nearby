
const fs = require('fs')
const path = require('path')
const COS = require('cos-nodejs-sdk-v5')

const store = new COS({
  SecretId: 'AKIDUlob9SSMwGjxvey8vTltnRq20mJaN71f',
  SecretKey: 'Zu2vZ3JJ3d2DAqNgjW4av4xgCTUI1Vjh'
})

const baseDir = path.resolve(__dirname, '../build')

let uploads = []

function checkUploaded() {
  return new Promise((resolve, reject) => {
    store.getBucket({Bucket: '2019-ncov-1300334035', Region: 'ap-chengdu'}, (err, data) => {
      if (err) return reject(err)
      uploads = data.Contents.map(item => item.Key)
      return resolve(uploads)
    });
  })
}

async function uploadDir (dir, prefix = "", skip = true) {
  const files = fs.readdirSync(path.resolve(baseDir, dir)).filter(x => !x.endsWith('map'))
  for (const file of files) {
    const fileName = prefix + path.join(dir, file)
    if (skip && uploads.indexOf(fileName) >= 0) continue
    const realFileName = path.resolve(baseDir, dir, file)
    const realFileStats = fs.statSync(realFileName)
    if (!realFileStats.isFile()) return

    console.log(fileName)

    await new Promise((resolve, reject) => {
      store.putObject({Key: fileName, Bucket: '2019-ncov-1300334035', Region: 'ap-chengdu', Body: fs.createReadStream(realFileName)}, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }
  return true
}

async function run() {
  try {
    await checkUploaded()
    console.log("开始上传：")
    await Promise.all([
      uploadDir('.', "nearby/", false),
      uploadDir('static/media'),
      uploadDir('static/js'),
      uploadDir('static/css')
    ])
    console.log('部署完成！')
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

run()
