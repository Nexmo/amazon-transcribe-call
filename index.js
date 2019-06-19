require("dotenv").config()

const express = require("express")
const bodyParser = require("body-parser")
const Nexmo = require("nexmo")
const AWS = require("aws-sdk")
const download = require("download-file")
const shortid = require("shortid")
const fs = require("fs")
const open = require("open")

const nexmo = new Nexmo({
  apiKey: "not_used", // Voice applications don't use the API key or secret
  apiSecret: "not_used",
  applicationId: process.env.NEXMO_APPLICATION_ID,
  privateKey: process.env.NEXMO_PRIVATE_KEY_PATH
})

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET
})

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

//testing


app.get('/webhooks/answer', (req, res) => {
  return res.json([
    {
      action: 'connect',
      endpoint: [{
        type: 'phone',
        number: process.env.BOB_PHONE_NUMBER
      }]
    }/*,
    {
      action: 'connect',
      endpoint: [{
        type: 'phone',
        number: process.env.CHARLIE_PHONE_NUMBER
      }]
    }*/,
    {
      "action": "record",
      "eventUrl": [`${req.protocol}://${req.get('host')}/webhooks/recording`],
      "split": "conversation",
      "channels": 2,
      "format": "mp3"
    }
  ])
})

app.post('/webhooks/events', (req, res) => {
  console.log(req.body)
  return res.status(204).send("")
})

app.post('/webhooks/recording', (req, res) => {

  let audioFileName = `nexmo-${shortid.generate()}.mp3`
  let audioFileLocalPath = `./recordings/${audioFileName}`

  nexmo.files.save(req.body.recording_url, audioFileLocalPath, (err, res) => {
    if (err) {
      console.error(err)
    }
    else {
      uploadFile(audioFileLocalPath, audioFileName)
    }
  })

  return res.status(204).send("")

})

function uploadFile(localPath, fileName) {
  const S3 = new AWS.S3()
  fs.readFile(localPath, (err, data) => {
    if (err) { throw err }

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: data
    }

    const putObjectPromise = S3.putObject(uploadParams).promise()
    putObjectPromise.then((data) => {
      console.log("saved file")
      transcribeRecording({
        audioFileUri: process.env.S3_BUCKET_PATH + fileName,
        transcriptFileName: `transcript-${fileName}`
      })
    })
  })
}



function transcribeRecording(params) {

  const transcribeService = new AWS.TranscribeService()

  const jobParams = {
    LanguageCode: 'en-GB', 
    Media: { 
      MediaFileUri: params.audioFileUri
    },
    MediaFormat: 'mp3', 
    TranscriptionJobName: params.transcriptFileName
  }

  const startTranscriptionJobPromise = transcribeService.startTranscriptionJob(jobParams).promise()

  startTranscriptionJobPromise.then((data) => {
    console.log(data)
    const jobUrl = `https://${process.env.AWS_REGION}.console.aws.amazon.com/transcribe/`
    open(jobUrl)
  })
}

app.listen(3000, () => console.log(`Listening`))