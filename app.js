//jshint esversion:6
// requring the the right packages
const https = require("node:https");
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const request = require("request");
const mongoose = require("mongoose");
const router = express.Router();
const session = require("express-session");
const passport = require("passport");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const expressHandlebars = require('express-handlebars');
const Ably = require("ably");
const flash = require("connect-flash");
const { MongoClient, GridFSBucket } = require('mongodb');
// Import the admin dashboard EJS view
const adminDashboard = require('./views/admin/dashboard');

require('dotenv').config();

const { createAgent } = require('@forestadmin/agent');
const { createMongooseDataSource } = require('@forestadmin/datasource-mongoose');
// Retrieve your mongoose connection
const connection = mongoose.connect("mongodb://127.0.0.1:27017/todayDB")

// Create your Forest Admin agent
// This must be called BEFORE all other middleware on the app
createAgent({
  authSecret: process.env.FOREST_AUTH_SECRET,
  envSecret: process.env.FOREST_ENV_SECRET,
  isProduction: process.env.NODE_ENV === 'production',
  
})
  // Create your Mongoose datasource
//   .addDataSource(createMongooseDataSource(connection))
//   // Replace "myNestJsApp" by your NestJs application
//   .mountOnNestJs(myNestJsApp)
//   .start();
// image uploaded by the user 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage
});
//  passport is an authentication package 
const passportLocalMongoose = require("passport-local-mongoose");
const { use } = require("passport");
const { title } = require("node:process");
const { cookie } = require("request");
const cookieParser = require("cookie-parser");
const userinputs = require("./dfarms/models/userinputs");
const app = express();
app.use(express.static(__dirname + "/public"));
app.set('views',path.join(__dirname,'views'))
app.engine('handlebars',expressHandlebars.engine({
    extname:'.handlebars',
    defaultLayout:'layout',
    layoutsDir:"views/layouts/"
}));




app.set("view engine", "ejs");
app.use(
  bodyparser.urlencoded({
    extended: true
  })
);
app.use('/admin', adminDashboard);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// creating a upload folder 
app.use("/upload", express.static("upload"));
// cookies for sessions that a user  has login which is destroyed onces the the local server is closed
app.use(
  session({
    secret: "iam The greatest. ",
    cookie: {
      maxAge: 60000
    },
    saveUninitialized: false,
    resave: true
  })
);

// inintializing the passport npm package 
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req,res,next)=>{
    res.locals.success_messages=req.flash('success')
    res.locals.error_messages=req.flash('error')
    next()
})
// app.use((req,res,next)=>{
//     res.render('notfound')
// });
// app.use('/', require('./routes/index'))
// app.use('/users', require('./routes/users'))
// using moongoose a dom to connect to local database of mongoDB which once it has connected it returns a successfull conected on the 
// command line 
mongoose
  .connect("mongodb://127.0.0.1:27017/todayDB")
  .then(() => console.log("Successfully Connected"))
  .catch((err) => console.error(err));
  const client = new MongoClient("mongodb://127.0.0.1:27017/todayDB", { useNewUrlParser: true, useUnifiedTopology: true });
  let gridFSBucket;

  client.connect((err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  
    console.log('Connected to MongoDB');
  
    let gridFSBucket = new GridFSBucket(client.db(), {
      bucketName: 'uploads',
    });
  });
  console.log('Connected to MongoDB');

  gridFSBucket = new GridFSBucket(client.db(), {
    bucketName: 'uploads',
  });
//   this is a database schema which is  used to store password ,username[email] ,description, description,resources ,technolgy,farmsze
// investmtnent amount and investment duration 
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      lowercase: true
    },
    password: String,
   
    name: String,
    desc: String,
    updatedAt: {
      immutable: true,
      type: Date,
      default: () => Date.now()
    },
    createdAt: {
      type: Date,
      default: () => Date.now()
    },
    img: {
      data: Buffer,
      contentType: String
    }
  },
  {
    collection: "registration"
  }
);
const farmerSchema=new mongoose.Schema(
    {
        description: String,
        resources: [String],
        technology: String,
        farmsize: Number,
        
        updatedAt: {
            immutable: true,
            type: Date,
            default: () => Date.now()
          },
          createdAt: {
            immutable: true,

            type: Date,
            default: () => Date.now()
          },

    },
    {
        collection: "farmerinputs"
      }

);
const investorSchema=new mongoose.Schema({
    investment: Number,
    investmentduration: Number,
    machinery:String,
    machineryprice:Number,
        
    updatedAt: {
        immutable: true,
        type: Date,
        default: () => Date.now()
      },
      createdAt: {
        type: Date,
        default: () => Date.now()
      },

},
{
    collection: "investorinputs"
  }

);

// connecting with the cookies session to the schema created 
userSchema.plugin(passportLocalMongoose);
farmerSchema.plugin(passportLocalMongoose);
investorSchema.plugin(passportLocalMongoose);


// creating a  user schema instance to create an object
const User = new mongoose.model("User", userSchema);
const Farmer = new mongoose.model("Farmer", farmerSchema);
const Investor=new mongoose.model("Investor",investorSchema);


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// converting the image uploaded by the user to a time title format which is stored in an upload folder which can later be used to 
const imageData = (bodyData) => {
  Image({
    data: bodyData
  }).save((err) => {
    if (err) {
      throw err;
    }
  });
};
// this is where the home route information is  uploaded to the  local server 
app.get("/", function (req, res) {
  res.render("home", {
    title: "Homepage"
  });
});

app.get('/admin', (req, res) => {
    // Render the admin dashboard view
    res.render(path.join(__dirname, 'views/admin/dashboard.ejs'));
  });

  
  app.get('/farmerusers', async (req, res) => {
    try {
      // Connect to the MongoDB database
      const client = await MongoClient.connect('mongodb://127.0.0.1:27017', { useUnifiedTopology: true });
      const db = client.db('todayDB');
  
      // Retrieve the user data from the "farminputs" collection
      const info = await db.collection('registration').find().toArray();
      const inputs = await db.collection('farmerinputs').find().toArray();
  
      

  
      // Render the admin UI page with the user data
      res.render(path.join(__dirname, "views/admin/farmerusers.ejs"), { inputs,info });

  
      // Close the MongoDB connection
      client.close();
        
    } catch (error) {
      console.error(error);
    }
  });
  app.get('/investorusers', async (req, res) => {
    try {
      // Connect to the MongoDB database
      const client = await MongoClient.connect('mongodb://127.0.0.1:27017', { useUnifiedTopology: true });
      const db = client.db('todayDB');
  
      // Retrieve the user data from the "farminputs" collection
      const info = await db.collection('registration').find().toArray();
      const inputs = await db.collection('investorinputs').find().toArray();
  
      

  
      // Render the admin UI page with the user data
      res.render(path.join(__dirname, "views/admin/investorusers.ejs"), { inputs,info });

  
      // Close the MongoDB connection
      client.close();
        
    } catch (error) {
      console.error(error);
    }
  });
  
  
  
// this is the login upload to the local server 
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/subscribe", function (req, res) {
  res.render('signup');
});
app.get("/farmplatform", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("farmplatform",{ fileId: null });
  } else {
    res.redirect("/login");
  }
});
app.get("/land", function (req, res) {
    res.render("land");
  });
app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("createprofile", {
      title: "Profile",
      message: req.flash("success")
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/farmer", function (req, res) {
    if (req.isAuthenticated()) {
      res.render("farmerprofile", {
        title: "Profile",
        message: req.flash("success")
      });
    } else {
      res.redirect("/login");
    }
  });
  app.get("/investor", async (req, res)=> {
    if (req.isAuthenticated()) {
        try {
            await client.connect();
            const db = client.db();
            const collection = db.collection('investorinputs');
            const data = await collection.find().toArray();
            res.render('investorprofile', { data });
           
          }
          catch (err) {
            console.log(err);
            res.status(500).json({ message: 'Error retrieving data' });
          } finally {
            await client.close();
          }
        
      
    } else {
      res.redirect("/login");
    }});
app.get('/form', (req, res) => {
    res.render('farmer', { fileId: null });
  });
  
  app.post('/form', (req, res) => {
    const fileId = req.body.fileId;
    res.render('farmer', { fileId });
  });

app.get("/logout", function (req, res) {
  res.redirect("/");
});
app.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
app.post("/register", function (req, res) {
  User.register(
    {
      username: req.body.username
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err.message);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/farmplatform");
        });
      }
    }
  );
});
app.post("/land",function(req,res){
    res.render("farmland")
    
})
app.post("/login", async function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  if(user.username=="admin"&user.password=="1234"){
    res.redirect("/admin")
  }else{
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/farmplatform");
      });
    }
  });
}});

app.post("/hire", upload.single("file"), async  (req, res, next)=> {
    try {
      const farmer = await Farmer.create({
        description: req.body.description,
        resources: req.body.resources,
        technology: req.body.technology,
        farmsize: req.body.farmsize,
      });
      const file = req.file;
      const { originalname, mimetype } = file;
  
      const uploadStream = gridFSBucket.openUploadStream(originalname, { contentType: mimetype });
      uploadStream.end(file.buffer);
  
      res.render('farmerUi',{fileId:req.params.id})
    } catch (e) {
      console.log(e.message);
    }
  
   
  });
  app.post("/investorprofile", upload.single("file"),async  (req, res, next)=> {
      try {
        const investor = await Investor.create({
          
          investment: req.body.investment,
          investmentduration:req.body.investmentduration,
          machinery:req.body.machinery,
          machineryprice:req.body.machineryprice
  
        });
        const file = req.file;
        const { originalname, mimetype } = file;
    
        const uploadStream = gridFSBucket.openUploadStream(originalname, { contentType: mimetype });
        uploadStream.end(file.buffer);
      
        res.render('investorUi',{fileId:req.params.id})
        console.log(investorSchema);
      } catch (e) {
        console.log(e.message);
      }
    
     
    });
app.post("/partner", function (req, res) {
  const firstname = req.body.fName;
  const lastName = req.body.lName;
  const email = req.body.email;
  const data = {
    members: [
      {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: firstname,
          LNAME: lastName
        }
      }
    ]
  };
  var jsonData = JSON.stringify(data);
  const url = "https://us10.api.mailchimp.com/3.0/lists/8b32a51a69";
  const options = {
    method: "POST",
    auth: "ian:394368bf1f561e3419552a2b703c5d9c-us10"
  };
  const request = https.request(url, options, function (response) {
    // console.log(statusCode);
    if (response.statusCode === 200) {
        res.render("success");

    } else {
        res.render('failure');
    }
    response.on("data", function (data) {
      console.log(JSON.parse(data));
    });
  });
  request.write(jsonData);
  request.end();
});

app.post('/hire', upload.single('file'), (req, res) => {
    // Extract the fields from the request body
    const { resource, description } = req.body;
    const imageFile = req.file;
  
    // Connect to MongoDB and create a new GridFSBucket object
    MongoClient.connect("mongodb://127.0.0.1:27017/todayDB", { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error connecting to MongoDB');
        return;
      }
  
      const db = client.db('todayDB');
      const bucket = new GridFSBucket(db);
  
      // Create a stream to write the image file to GridFS
      const uploadStream = bucket.openUploadStream(imageFile.originalname);
  
      // Pipe the image file data to the upload stream
      const readStream = Readable.from(imageFile.buffer);
      readStream.pipe(uploadStream);
  
      // Once the upload is complete, create a new document in the resources collection
      uploadStream.on('finish', () => {
        const resource = {
          resource,
          description,
          fileId: uploadStream.id
        };
  
        db.collection('resources').insertOne(resource, (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).send('Error uploading resource information');
            return;
          }
  
          // Redirect the user to a success page or send a success response
          res.status(200).send('Resource information uploaded successfully');
        });
      });
    });
  });

    
  app.get("/machinery",function(req,res){
    res.render('machinery')
  });
  app.get("/greenhouses",function(req,res){
    res.render('greenhouse')
  });
  app.get("/land",function(req,res){
    res.render('land')
  });
  app.get("/agreement",function(req,res){
    res.render('profitPartner')
  });

  


  
app.listen(3000, function () {
  console.log("server is running on port 3000.");
});
