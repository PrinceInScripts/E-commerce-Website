import dotenv from 'dotenv'
import connectDB from './db/index.js'
import {app} from './app.js'

dotenv.config({
    path: '.env'
})

const PORT=process.env.PORT || 5000

connectDB()
          .then(()=>{
              app.listen(PORT,()=>{
                console.log(` Server is running at port : http://localhost:${PORT}`);
              })
          })
          .catch((error)=>{
              console.log(error);
              process.exit(1)
          })
         