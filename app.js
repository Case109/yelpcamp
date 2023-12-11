if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()

}




console.log(process.env.SECRET)

const express = require('express')
const path = require('path');
const mongoose = require('mongoose')
const ejsmMate = require('ejs-mate')
const Campground = require('./models/campground')
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError')
const {campgroundSchema, reviewSchema} = require('./schema.js');
const session = require('express-session')

const usersRoutes = require('./routes/users')
const campgroundsRoutes = require('./routes/campground')
const reviewsRoutes = require('./routes/reviews')
const flash = require('connect-flash');

const passport = require('passport')
const localStrategy = require('passport-local')
const User = require('./models/user')

const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet');
const MongoStore = require('connect-mongo');
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';

mongoose.connect(dbUrl, {useNewURLParser:true, useUnifiedTopology: true})
.then(() => {
    console.log("Mongo Connected")
})
.catch(err => {
    console.log("Mongo Connection Error")
    console.log(err)
})

const app = express();

app.engine('ejs', ejsmMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended:true}))
 app.use(methodOverride('_method'))
 app.use(express.static(path.join(__dirname, 'public')))
 app.use(mongoSanitize())

 const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
 
 const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60,
   
});

store.on('error', function(e){
    console.log("Session Store Error", e)
})

 const sessionConfig = {
    store,
    name: "session",
    secret,
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly:true,    //means that bad guys cant veiw sesion cookies using javascript
        //secure: true,   //means that session cookie can only be sent over https
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
 }
 app.use(session(sessionConfig))
 app.use(flash())
 app.use(helmet())
 const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
//This is the array that needs added to
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://stackpath.bootstrapcdn.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
    "https://stackpath.bootstrapcdn.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/douqbebwk/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);
 
 app.use(passport.initialize());
 app.use(passport.session());
 passport.use(new localStrategy(User.authenticate()));
 
 passport.serializeUser(User.serializeUser());
 passport.deserializeUser(User.deserializeUser());


 app.use((req, res, next) =>{
    console.log(req.query)
    res.locals.currentUser = req.user;
   res.locals.success = req.flash('success')
   res.locals.error = req.flash('error')
   next();
 })

app.get('/fakeUser', async(req,res)=>{
    const user = new User({email: 'case@gmail.com', username:'Drew'});
   const newUser = await User.register(user, 'chicken');
   res.send(newUser);
})
 
app.use('/', usersRoutes);
 app.use('/campgrounds',campgroundsRoutes);
 app.use('/campgrounds/:id/reviews', reviewsRoutes);

//add review
app.get('/', (req, res)=>{
    res.render('home')
})

app.all("*", (req,res,next) =>{
    next(new ExpressError("Page Not Found", 404))
})

app.use((err,req,res, next)=>{
    const {statusCode = 500} = err
    if(!err.message) {
        err.message = 'Oh no, Something went wrong'
    }
    res.status(statusCode).render('error',{err});
   
}) 

app.listen(3000, () =>{
    console.log('Serving on port 3000')
})
