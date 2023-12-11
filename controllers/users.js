const User = require('../models/user')

module.exports.registerForm = (req,res) =>{
    res.render('Users/register')
}

module.exports.registerUser = async(req,res) =>{
    try{
        const {email,username,password} = req.body
        const user = new User({email, username});
       const registeredUser = await User.register(user,password);
       req.login(registeredUser, err =>{
         if (err) return next(err)
       
       console.log(registeredUser)
       req.flash("success", "Welcome to Yelp Camp")
       res.redirect('/campgrounds')
    })
    } catch(e){
        req.flash('error', e.message)
        res.redirect('register')
    }

}

module.exports.loginForm = (req,res)=>{
    res.render('users/login')
}

module.exports.loginUser = (req,res)=>{
    req.flash('success', 'welcome back')
   const redirectUrl =  res.locals.returnTo || '/campgrounds'
    res.redirect(redirectUrl);
  
    
}

module.exports.logoutUser = (req,res, next)=>{
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
}