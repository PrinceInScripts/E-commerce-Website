import Mailgen from "mailgen"
import nodemailer from "nodemailer"

const sendEmail = async (options)=>{
    const mailGenerator = new Mailgen({
        theme:"default",
        product:{
            name:"E-commerce",
            link:process.env.FRONTEND_URL
        }
    })

    const emailTextual=mailGenerator.generatePlaintext(options.mailgenContent)

    const emailHTML=mailGenerator.generate(options.mailgenContent)  
    const transporter = nodemailer.createTransport({
        host:process.env.SMTP_HOST,
        port:process.env.SMTP_PORT,
        auth:{
            user:process.env.SMTP_USERNAME,
            pass:process.env.SMTP_PASSWORD
        }
    })

    const mail={
        from: process.env.SMTP_FROM_EMAIL,
        to:options.email,
        subject:options.subject,
        text:emailTextual,
        html:emailHTML
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.log("Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file");
        console.log("Error: ", error);
    }
}

const emailVerificationMailgenContent = (username,verificationUrl)=>{
    return {
        body:{
            name:username,
            intro:"Welcome to our app!, We're very excited to have you on board.",
            action:{
                instruction:"To verify your email please click on the following button : ",
                button:{
                    color:"#22BC66",
                    text:"Verify Your Email",
                    link:verificationUrl
                },
            },
            outro:"Need help, or have questions? Just reply to this email, we'd love to help."
        }
        }
       
}

const forgotPasswordMailgenContent = (username,passwordResetUrl)=>{
    return {
        body: {
            name: username,
            intro: "We got a request to reset the password of our account",
            action: {
              instructions:
                "To reset your password click on the following button or link:",
              button: {
                color: "#22BC66", // Optional action button color
                text: "Reset password",
                link: passwordResetUrl,
              },
            },
            outro:
              "Need help, or have questions? Just reply to this email, we'd love to help.",
          },
    }
}

export {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent
}