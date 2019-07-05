# Nexmo Voice API Call Transcription with Amazon Transcribe

This is example code for an upcoming blog post that shows how to transcribe a 
phone call automatically using the Amazon Transcribe API. You'll need two handsets with two different phone numbers to test this.

It uses the Nexmo Voice API to initiate and record the call. The call audio is created in your local `recordings` folder and uploaded to an S3 bucket.

Amazon Cloudwatch triggers a serverless Lambda function when the transcription job has completed.  Transcripts are created in S3 and downloaded to your application's `transcripts` folder.

## Setup

### Install the Nexmo CLI

Run the following at a terminal prompt to install the CLI and configure it with your `api_key` and `api_secret`, which you will find in the [Developer Dashboard](https://dashboard.nexmo.com):

```
npm install -g nexmo-cli
nexmo setup <API_KEY> <API_SECRET>
```

### Purchase a Nexmo number

If you don't already have one, buy a Nexmo virtual number to receive inbound calls.

List available numbers (replace `GB` with your [two-character country code](https://www.iban.com/country-codes)):

```
nexmo number:search GB
```

Purchase one of the numbers:

```
nexmo number:buy 447700900001
```

### Create a Voice API application

Use the CLI to create a Voice API application with the webhooks that will be responsible for answering a call on your Nexmo number (`/webhooks/answer`) and logging call events (`/webhooks/event`), respectively. Replace `example.com` in the following command with your own public-facing URL host name (consider using [ngrok](https://ngrok.io) for testing purposes, and if you do use it, run it now to get the temporary URLs that `ngrok` provides and leave it running to prevent the URLs changing).

Run the command in the application's root directory:

```
nexmo app:create "My Echo Server" https://example.com/webhooks/answer https://example.com/webhooks/event --keyfile private.key
```

Make a note of the Application ID returned by this command. It will also download your `private.key` file which the Voice API uses to authenticate your application.

### Link the Voice API application to your Nexmo number

Use the application ID to link your virtual number:

```
nexmo link:app <NUMBER> <APPLICATION_ID>
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

* `NEXMO_APPLICATION_ID`: The Nexmo Voice Application ID you created earlier
* `NEXMO_PRIVATE_KEY_PATH`="./private.key"
* `OTHER_PHONE_NUMBER=`: Another phone number you can call to create a conversation
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

1. In the root directory of your application, execute:

```
node index.js
```

2. Call your Nexmo virtual number from one of your personal numbers. The other number you specified in the `OTHER_PHONE_NUMBER` setting should ring - answer it when it does.

3. Speak a few words into each handset. When you're finished, disconnect both.

4. Watch the console as the transcription job is being processed. If everything works properly, you should receive a notification that your job is complete and you should find the call audio file in your `recordings` directory and the corresponding transcript (in JSON format) in `transcripts`. Note how the transcript is split into channels, one for each device you used.

## Adding more callers

If you have more than two numbers, you can add more callers to the conversation. Simply create a `connect` action for each in the `/webhooks/answer` NCCO and increase the number of channels in the `record` action accordingly.


