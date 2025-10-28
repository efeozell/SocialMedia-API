import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { ENV } from "../config/env.js";

const sesClient = new SESClient({
  apiVersion: "2010-12-01",
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY,
    secretAccessKey: ENV.AWS_SECRET_KEY,
  },
});

const sendEmail = async (option) => {
  if (!option?.email) {
    throw new Error("Email address is required");
  }

  if (!option?.subject) {
    throw new Error("Email address is required");
  }

  try {
    const emailBody = {};

    if (option.html) {
      emailBody.Html = {
        Charset: "UTF-8",
        Data: option.html,
      };
    }

    emailBody.Text = {
      Charset: "UTF-8",
      Data: option.message || option.subject || " ",
    };

    const params = {
      Destination: {
        ToAddresses: [option.email],
      },
      Message: {
        Body: emailBody,
        Subject: {
          Charset: "UTF-8",
          Data: option.subject,
        },
      },

      Source: ENV.EMAIL_FROM_NAME ? `"${ENV.EMAIL_FROM_NAME}" <${ENV.EMAIL_FROM}>` : ENV.EMAIL_FROM,
    };

    const command = new SendEmailCommand(params);
    const data = await sesClient.send(command);

    console.log("Email sent via  AWS SES. MessageId: %s", data.MessageId);

    return data;
  } catch (error) {
    console.error("Error sending email via AWS SES: ", error);

    if (error instanceof Error) {
      console.error("AWS Error Name: ", error.name);
    }

    throw new Error("Email could not be sent via AWS SES.");
  }
};

export default sendEmail;
