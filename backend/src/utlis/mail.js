import Mialgen from "mailgen"
import nodemailer from "nodemailer"

const sendEmail = async (options)=>{
    const mailGenerator = new Mialgen({
        theme:"default",
        product:{
            name:"Mailgen",
            link:process.env.FRONTEND_URL
        }
    })

    const emailTextual=mailGenerator.generatePlaintext(options.mailgenContent)

    const emailHTML=mailGenerator.generate(options.mailgenContent)  

    const transporter = nodemailer.createTransport({
        host:process.env.SMTP_HOST,
        port:process.env.SMTP_PORT,
        auth:{
            user:process.env.SMTP_USER,
            pass:process.env.SMTP_PASSWORD
        }
    })

    const mail={
        from: process.env.SMTP_FROM,
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

export {
    sendEmail,
    emailVerificationMailgenContent
}