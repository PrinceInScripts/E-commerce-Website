import multer from "multer"

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./public/temp')
    },
    filename:(req,file,cb)=>{
        let fileExtension="";
        if (file.originalname.split(".").length > 1) {
            fileExtension = file.originalname.substring(
              file.originalname.lastIndexOf(".")
            );
        }
        const filenameWithoutExtension = file.originalname
        .toLowerCase()
        .split(" ")
        .join("-")
        ?.split(".")[0];
      cb(
        null,
        filenameWithoutExtension +
          Date.now() +
          Math.ceil(Math.random() * 1e5) + 
          fileExtension
      );
    }
})

export const upload = multer({
    storage,
    limits: {
      fileSize: 100 * 1000 * 1000,
    },
  });