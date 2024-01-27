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


export {
    sendEmail,
}