const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt');
const app = express()
const dotenv = require('dotenv');
const bodyParser = require('body-parser'); 
dotenv.config()
const PORT = process.env.PORT || 3652; 
const userRouter = require('./routes/userRoute')
const mongoose = require('mongoose');  

app.use(cors({
  origin:"http://localhost:3000"
}))
app.use(express.json())
 
 
app.use('/user',userRouter)

 
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to database');
}).catch((error) => {
    console.log(error);
});
 
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
  