const nodemailer = require('nodemailer');

const sendMail = async (mailOptions) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT, 
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
      });
   
    transporter.sendMail(mailOptions, (error,info) => {
        if(error) {
            console.error("Error occurred while sending email:", error);
        }
        console.log("info :",info);
        return true
    })

  };

  module.exports = sendMail