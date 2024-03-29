# Vonage Voice API Call Transcription with Amazon Transcribe

This is example code for a [tutorial](https://developer.nexmo.com/use-cases/trancribe-amazon-api) that shows you how to transcribe a phone call automatically using the Amazon Transcribe API. You'll need two handsets with two different phone numbers to test this.

It uses the Vonage Voice API to initiate and record the call. The call audio is created in your local `recordings` folder and uploaded to an S3 bucket.

Amazon Cloudwatch triggers a serverless Lambda function when the transcription job has completed. Transcripts are created in S3 and downloaded to your application's `transcripts` folder.

## Welcome to Vonage

If you're new to Vonage, you can [sign up for a Vonage account](https://dashboard.nexmo.com/sign-up?utm_source=DEV_REL&amp;utm_medium=github&amp;utm_campaign=amazon-transcribe-call) and get some free credit to get you started.

## Setup

### Install the Vonage CLI

Run the following at a terminal prompt to install the CLI and configure it with your `api_key` and `api_secret`, which you will find in the [Developer Dashboard](https://dashboard.nexmo.com):

```
npm install -g nexmo-cli
vonage config:set --apiKey=<API_KEY> --apiSecret=<API_SECRET>
```

### Purchase a Vonage number

If you don't already have one, buy a Vonage virtual number to receive inbound calls.

List available numbers (replace `GB` with your [two-character country code](https://www.iban.com/country-codes)):

```
vonage numbers:search GB
```

Purchase one of the numbers:

```
vonage numbers:buy 447700900001
```

### Create a Voice API application

Use the CLI to create a Voice API application with the webhooks that will be responsible for answering a call on your Vonage number (`/webhooks/answer`) and logging call events (`/webhooks/event`), respectively. Replace `example.com` in the following command with your own public-facing URL host name (consider using [ngrok](https://ngrok.io) for testing purposes, and if you do use it, run it now to get the temporary URLs that `ngrok` provides and leave it running to prevent the URLs changing).

Run the command in the application's root directory:

```
 vonage apps:create "My Echo Server"  --voice_answer_url=https://example.com/webhooks/answer --voice_event_url=https://example.com/webhooks/event
```

Make a note of the Application ID returned by this command. It will also download your `private.key` file which the Voice API uses to authenticate your application.

### Link the Voice API application to your Vonage number

Use the application ID to link your virtual number:

```
vonage apps:link --number=<NUMBER>
```

### Install dependencies

In the application's parent directory and run `npm install`:

```
npm install
```

### AWS setup

Complete the following steps:

1. [Create an AWS account and create an Adminstrator user](https://docs.aws.amazon.com/transcribe/latest/dg/setting-up-asc.html). Make a note of your AWS key and secret, because you cannot retrieve the secret later on.
2. [Install and configure the AWS CLI](https://docs.aws.amazon.com/transcribe/latest/dg/setup-asc-awscli.html)
3. Use the following AWS CLI command to create two new S3 buckets, one for the call audio and the other for the generated transcripts. These must be unique across S3. Ensure that the `region` supports the [Amazon Transcribe API](https://docs.aws.amazon.com/general/latest/gr/rande.html#transcribe_region) and [Cloudwatch Events](https://docs.aws.amazon.com/general/latest/gr/rande.html#cwe_region):

```
aws s3 mb s3://your-audio-bucket-name --region us-east-1
aws s3 mb s3://your-transcription-bucket-name --region us-east-1
```

### Configure the environment

Copy `example.env` to `.env` and configure the following settings:

* `VONAGE_APPLICATION_ID`: The Vonage Voice Application ID you created earlier
* `VONAGE_PRIVATE_KEY_FILE`: The name of your private key file, which should be in the root of your application directory. E.g. `private.key`
* `OTHER_PHONE_NUMBER`: Another phone number you can call to create a conversation
* `AWS_KEY`: Your Amazon Web Services key
* `AWS_SECRET`: Your Amazon Web Services secret
* `AWS_REGION`: Your Amazon Web Services region, e.g. `us-east-1`
* `S3_PATH`: Your path to S3 bucket storage, which should include the `AWS_REGION`, e.g. `https://s3-us-east-1.amazonaws.com`
* `S3_AUDIO_BUCKET_NAME`: A uniquely-named S3 bucket which will contain call audio mp3 files
* `S3_TRANSCRIPTS_BUCKET_NAME`=: A uniquely-named S3 bucket which will contain transcripts of the call audio

### Deploy your serverless function

The serverless function is a Lambda that executes when a transcription job completes. It makes a `POST` request to your application's `/webhooks/transcription` endpoint.

Deploy this function:

```
cd transcribeReadyService
serverless deploy
```

## Running the code

### Local Install

1. In the root directory of your application, execute:

```
node index.js
```

2. Call your Vonage virtual number from one of your personal numbers. The other number you specified in the `OTHER_PHONE_NUMBER` setting should ring - answer it when it does.

3. Speak a few words into each handset. When you're finished, disconnect both.

4. Watch the console as the transcription job is being processed. If everything works properly, you should receive a notification that your job is complete and you should find the call audio file in your `recordings` directory and the corresponding transcript (in JSON format) in `transcripts`. Note how the transcript is split into channels, one for each device you used. The application parses the completed transcription and displays the result for each channel in the console.

### Docker Compose

You can also run the code using Docker Compose using the following command.

```
docker-compose up
```

## Adding more callers

If you have more than two numbers, you can add more callers to the conversation. Simply create a `connect` action for each in the `/webhooks/answer` NCCO and increase the number of channels in the `record` action accordingly.

## Getting Help

We love to hear from you so if you have questions, comments or find a bug in the project, let us know! You can either:

* Open an issue on this repository
* Tweet at us! We're [@VonageDev on Twitter](https://twitter.com/VonageDev)
* Or [join the Vonage Community Slack](https://developer.vonage.com/community/slack)

## Further Reading

* Read the [tutorial](https://developer.nexmo.com/use-cases/trancribe-amazon-api) that accompanies this demo application to learn how it was put together.
* Vonage Voice API
  * [Voice API call recording guide](/voice/voice-api/guides/recording)
  * ["Record a call" code snippet](/voice/voice-api/code-snippets/record-a-call)
  * [Voice API reference](/api/voice)
  * [NCCO reference](/voice/voice-api/ncco-reference)
* AWS
  * [AWS node.js SDK reference](https://aws.amazon.com/sdk-for-node-js/)
  * [Amazon Transcribe API features](https://aws.amazon.com/transcribe/)
  * [Amazon Transcribe API reference](https://docs.aws.amazon.com/transcribe/latest/dg/API_Reference.html)
  * [Amazon S3 documentation](https://docs.aws.amazon.com/s3/)
  * [Amazon CloudWatch documentation](https://docs.aws.amazon.com/cloudwatch/)
  * [Amazon Lambda](https://docs.aws.amazon.com/lambda/)
