const mongoose = require('mongoose')
const Schema = mongoose.Schema

const logSchema = new Schema({
  kind:{
    type:String,
    require:true
  },
  method:{
    type:String,
    require:true,
    default:"GET"
  },
  url:{
    type:String,
    require:true
  },
  uniqid:{
    type:String,
    require:true
  },
  ipadresi:{
    type:String,
    require:true
  },
  tarayici:{
    type:Object,
    require:false
  },
  tarayiciMotor:{
    type:Object,
    require:false
  },
  isletimSistemi:{
    type:Object,
    require:false
  },
  cihaz:{
    type:Object,
    require:false
  },
  reqTs:{
    type:String,
    require:true,
  },
  localTime:{
    type:String,
    require:true
  },
  user:{
    type:String,
    require:false
  }
},{collection:'loglar',timestamps:true})

const Log = mongoose.model("Log",logSchema)
module.exports = Log;

