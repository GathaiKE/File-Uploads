const express = require('express');
const dotenv = require('dotenv');
const path = require('path')
dotenv.config({path:path.resolve(__dirname,'./.env')})
const port = process.env.PORT || 2000
const bodyparser = require('body-parser')
const override = require('method-override')
const dbConnection = require('./dbconfig')
const {GridFsStorage} = require('multer-gridfs-storage');
const gridStream = require('gridfs-stream')
const Crypto = require('crypto')
const mongoose = require('mongoose');
const multer = require('multer');

// Mongo DB connection
const URI = process.env.mongoURI
const conn = mongoose.createConnection(URI)

// Initialize stream variable
let gfs;
conn.once('open',()=>{
    gfs=gridStream(conn.db,mongoose.mongo);
    gfs.collection('uploads')
})

// Storage Engine
const storage = new GridFsStorage({
    url: URI,
    file: async (req,res)=>{
        return new Promise ((resolve,reject)=>{
            Crypto.randomBytes(16,(err,buf)=>{
                if(err){
                    return reject(err)
                }

                const filename = buf.toString('hex') + path.extname(req.file.originalname)

                const fileData = {
                    filename:filename,
                    bucketname:'uploads'
                }
                resolve(fileData)
            })
        })
    }
})

const uploads = multer({storage})

const app = express();

app.use(bodyparser.json())
app.use(override('_method'))
app.set('view engine','ejs')

// route to get all
app.get('/', (req,res)=>{
    res.render('index')
})

// route to upload
app.post('/upload',uploads.single('image'),(req,res)=>{
    if(!file){
        return res.status(404).json({message:"No file selected"})
    }
    return res.status(201).json({file:req.file})
})

app.listen(port,()=> console.log(`Server running at port : ${port}`))

