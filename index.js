require("dotenv").config()

const express = require("express")
const bodyParser = require("body-parser")
const Nexmo = require("nexmo")
const AWS = require("aws-sdk")
const shortid = require("shortid")
const fs = require("fs")

const nexmo = new Nexmo({
  apiKey: "not_used", // Voice applications don't use API key or secret
  apiSecret: "not_used",
  applicationId: process.env.NEXMO_APPLICATION_ID,
  privateKey: __dirname + "/" + process.env.NEXMO_PRIVATE_KEY_FILE
})

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET
})

const app = express()

app.use(bodyParser.json())
//app.use(bodyParser.urlencoded({ extended: false }))

const transcribeService = new AWS.TranscribeService()
const S3 = new AWS.S3()

app.get('/webhooks/answer', (req, res) => {
  return res.json([
    {
      action: 'talk',
      text: 'Thanks for calling, we will connect you now'
    },
    {
      action: 'connect',
      endpoint: [{
        type: 'phone',
        number: process.env.OTHER_PHONE_NUMBER
      }]
    },
    {
      action: 'record',
      eventUrl: [`${req.protocol}://${req.get('host')}/webhooks/recording`],
      split: 'conversation',
      channels: 2,
      format: 'mp3'
    }
  ])
})

app.post('/webhooks/events', (req, res) => {
  console.log(req.body)
  return res.status(204).send("")
})

app.post('/webhooks/recording', (req, res) => {
  let audioFileName = `nexmo-${shortid.generate()}.mp3`
  //let audioFileLocalPath = `./recordings/${audioFileName}`
  let audioFileLocalPath = `./recordings/${audioFileName}`

  console.log("recording...")
  console.log(req.body)

  nexmo.files.save(req.body.recording_url, audioFileLocalPath, (err, res) => {
    if (err) {
      console.log("Could not save audio file")
      console.error(err)
    }
    else {
      uploadFile(audioFileLocalPath, audioFileName)
    }
  })

  return res.status(204).send("")

})

// When transcribe job complete, lambda makes a POST request to this endpoint
app.post('/webhooks/transcription', (req, res) => {

  const jobname = req.body.detail.TranscriptionJobName
  const jobstatus = req.body.detail.TranscriptionJobStatus

  if (jobstatus === "FAILED") {
    console.log(`Error processing job ${jobname}`)
  } else {
    console.log(`${jobname} job successful`)

    const params = {
      TranscriptionJobName: jobname
    }
    console.log(`Getting transcription job: ${params.TranscriptionJobName}`)

    transcribeService.getTranscriptionJob(params, (err, data) => {
      if (err) {
        console.log(err, err.stack)
      }
      else {
        console.log("Retrieved transcript")
        downloadFile(data.TranscriptionJob.TranscriptionJobName + '.json')
      }
    })
  }
  return res.status(200).send("")
})

function displayResults(transcriptJson) {
  const channels = transcriptJson.results.channel_labels.channels

  channels.forEach((channel) => {
    console.log(`*** Channel: ${channel.channel_label}`)

    let words = ''

    channel.items.forEach((item) => {
      words += item.alternatives[0].content + ' '
    })
    console.log(words)
  })
}

function uploadFile(localPath, fileName) {

  fs.readFile(localPath, (err, data) => {
    if (err) { throw err }

    const uploadParams = {
      Bucket: process.env.S3_AUDIO_BUCKET_NAME,
      Key: fileName,
      Body: data
    }

    const putObjectPromise = S3.putObject(uploadParams).promise()
    putObjectPromise.then((data) => {
      console.log(`${fileName} uploaded to ${process.env.S3_AUDIO_BUCKET_NAME} bucket`)
      transcribeRecording({
        audioFileUri: process.env.S3_PATH + '/' + process.env.S3_AUDIO_BUCKET_NAME + '/' + fileName,
        transcriptFileName: `transcript-${fileName}`
      })
    })
  })
}

function transcribeRecording(params) {

  const jobParams = {
    LanguageCode: 'en-GB',
    Media: {
      MediaFileUri: params.audioFileUri
    },
    MediaFormat: 'mp3',
    OutputBucketName: process.env.S3_TRANSCRIPTS_BUCKET_NAME,
    Settings: {
      ChannelIdentification: true
    },
    TranscriptionJobName: params.transcriptFileName
  }

  console.log(`Submitting file ${jobParams.Media.MediaFileUri} for transcription...`)

  const startTranscriptionJobPromise = transcribeService.startTranscriptionJob(jobParams).promise()

  startTranscriptionJobPromise.then((data) => {
    console.log(`Started transcription job ${data.TranscriptionJob.TranscriptionJobName}...`)
  })
}

function downloadFile(key) {
  console.log(`downloading ${key}`)

  const filePath = `./transcripts/${key}`

  const params = {
    Bucket: process.env.S3_TRANSCRIPTS_BUCKET_NAME,
    Key: key
  }

  const getObjectPromise = S3.getObject(params).promise()
  getObjectPromise.then((data) => {
    fs.writeFileSync(filePath, data.Body.toString())
    console.log(`Transcript: ${filePath} has been created.`)
    let transcriptJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    displayResults(transcriptJson)
  })

}

app.listen(3000, () => console.log("Waiting for an inbound call..."))