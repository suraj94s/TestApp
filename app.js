const express = require('express');
const app = express();
const cookieParser=require('cookie-parser');

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path=require('path');
const multer=require('multer');
const usermodel=require('./models/user');
const adminmodel=require('./models/admins')



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// const postmodel=require('./models/post');
const jwt=require("jsonwebtoken");

const bcrypt=require('bcrypt');
app.use(cookieParser());

const PORT = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost/studentResults', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define a schema and model
// models/Result.js
// const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    name: String,
    rollNumber: String,
    subject1: { name: String, marks: Number },
    subject2: { name: String, marks: Number },
    subject3: { name: String, marks: Number },
    subject4: { name: String, marks: Number },
    subject5: { name: String, marks: Number },
    totalMarks: Number,
    percentage: Number
});

const Result = mongoose.model('Result', resultSchema);

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload


app.get('/', (req, res) => {
    res.render('home');
});


app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('home');
});


app.get('/admin',isLoggedIn,function(req,res){

    res.render('index');
})
app.get('/login',function(req,res){

    res.render('login');
}
)
app.post('/log',async function(req,res){

    // app.post('/login',async function(req,res){
        let {email,password}=req.body;
      let user= await  adminmodel.findOne({email})
      if(!user) return res.status(500).send("Something Went Wrong !!");
                 
      bcrypt.compare(password,user.password,function(err,result){
        if(result){ 
            let token= jwt.sign({email:email,userid:user._id},'secret');
            res.cookie('token',token);
            res.status(200).redirect("/admin");
            
    
    
    
    
    
            
        }
    
        else  res.redirect('/login');
    
    
        
    })
    
      
    })
    


app.get('/register',function(req,res){

    res.render('register');
})


    app.post('/signup',async function(req,res){
        let {email,password,name,dob}=req.body;
      let user= await  usermodel.findOne({email})
      if(user) return res.status(500).send("User allready Exits!!");
            
      bcrypt.genSalt(10,function(err,salt){
          
        bcrypt.hash(password,salt,async function(err,hash){
              
            
      let createduser=  await adminmodel.create({
            name,
            password:hash,
            // age,
            email,
            // name,
            dob
            
    
        })
      let token=  jwt.sign({email:email,userid:createduser._id},'secret');
         res.cookie('token',token);
             res.redirect('/admin');
    
    
           
    
    
    
    
        })
        
    
      })
    }
    )
    app.get('/logout',function(req,res){

       
            res.cookie("token","");
            res.redirect("/");
              
          })
          app.get('/uploaded',function(req,res){

            res.render('uploaded');
          })
         
    
    
    


app.post('/upload',isLoggedIn, async (req, res) => {
    const { name, rollNumber, subject1, marks1, subject2, marks2, subject3, marks3, subject4, marks4, subject5, marks5 } = req.body;

    const totalMarks = Number(marks1) + Number(marks2) + Number(marks3) + Number(marks4) + Number(marks5);
    const percentage = (totalMarks / 500) * 100; // Assuming each subject is out of 100

    const newResult = new Result({
        name,
        rollNumber,
        subject1: { name: subject1, marks: Number(marks1) },
        subject2: { name: subject2, marks: Number(marks2) },
        subject3: { name: subject3, marks: Number(marks3) },
        subject4: { name: subject4, marks: Number(marks4) },
        subject5: { name: subject5, marks: Number(marks5) },
        totalMarks,
        percentage
    });

    try {
        await newResult.save();
        res.redirect('/uploaded');
    } catch (err) {
        console.error('Error saving data:', err);
        res.status(500).send('Error saving data');
    }
});

app.get('/results', async (req, res) => {
    try {
        const results = await Result.find({rollNumber:req.body.rollNumber,name:req.body.name});
        console.log('Fetched results:', results); // Add this line
        res.render('results', { results });
    } catch (err) {
        console.error('Error retrieving results:', err);
        res.status(500).send('Error retrieving results');
    }
});


// app.get('/results', async (req, res) => {
//     try {
//         const results = await Result.find({});
//         res.render('results', { results });
//     } catch (err) {
//         console.error('Error retrieving results:', err);
//         res.status(500).send('Error retrieving results');
//     }
// });
app.get('/check-result', (req, res) => {
    res.render('check-result');
});

app.post('/check-result', async (req, res) => {
    let { rollNumber ,name} = req.body;
    // name = name.toLowerCase();

    try {
       
        const results = await Result.find({
            name: new RegExp('^' + name + '$', 'i'),
            rollNumber: rollNumber
        });
        if (results.length > 0) {
            res.render('results', { results });
        } else {
            res.send('No Result Found!!!.');
        }
    } catch (err) {
        console.error('Error retrieving results:', err);
        res.status(500).send('Error retrieving results');
    }
});

function isLoggedIn(req,res,next){
    if(req.cookies.token==="")  res.redirect("/login"); 
       
              

    else{

          let data= jwt.verify(req.cookies.token,"secret");
     
          req.user=data;
    next();
     
          
    

    }

}


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
