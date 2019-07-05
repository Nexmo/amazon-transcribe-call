# Nexmo Voice API Call Transcription with Amazon Transcribe

This is example code for an upcoming blog post that shows how to transcribe a 
phone call automatically using the Amazon Transcribe API.

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

Use the CLI to create a Voice API application with the webhooks that will be responsible for answering a call on your Nexmo number (`/webhooks/answer`) and logging call events (`/webhooks/event`), respectively. Replace `example.com` in the following command with your own public-facing URL host name (consider using [ngrok](https://ngrok.io) for testing purposes, and if you do use it, run it now to get the temporary URLs that `ngrok` provides).

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

Change into the `transcribeReadyService` directory and install `serverless`:

```
cd transcribeReadyService
npm install serverless
```

### Configure the environment

Copy `example.env` to `.env` and configure the following settings:

* `NEXMO_APPLICATION_ID`: The Nexmo Voice Application ID you created earlier
* `NEXMO_PRIVATE_KEY_PATH`="./private.key"
* `OTHER_PHONE_NUMBER=`: Another phone number you can call to create a conversation
* `AWS_KEY`: Your Amazon Web Services key
* `AWS_SECRET`: Your Amazon Web Services secret
* `AWS_REGION`: Your Amazon Web Services region, e.g. `us-east-1`. Not all regions support the Transcribe API
* `S3_PATH`: Your path to S3 bucket storage, which should include the region, e.g. `https://s3-us-east-1.amazonaws.com`
* `S3_AUDIO_BUCKET_NAME`: A uniquely-named S3 bucket which will contain call audio mp3 files
* `S3_TRANSCRIPTS_BUCKET_NAME`=: A uniquely-named S3 bucket which will contain transcripts of the call audio


## Running the code

See [this post](#) for more information (post is not yet published).

You'll need to create a Nexmo application, obtain Google Cloud credentials, edit
the `.env` file and run `npm install` to make this project runnable.

For step by step instructions, see the linked blog post
