const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');
var nodemailer= require('nodemailer')
var otp=require('otp-generator')
var router = express.Router();
var product = require('../manage-products/products');
const useracc = require('../manage-user/user-acc');
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  }
  else {
    res.redirect('/login')
  }
};

/* GET home page. */
router.get('/',async function (req, res, next) {
  let user = req.session.user
  let cartCount=null
  if(user){
  cartCount=await useracc.getCartCount(req.session.user._id)
  }
  product.viewProducts().then((products) => {
    res.render('user/view-products', { products, user,cartCount });

  })

});
router.get('/login', (req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false
  }
});
router.get('/signup', (req, res) => {
  res.render('user/signup')
});
router.post('/signup', (req, res) => {

  useracc.Signup(req.body).then((response) => {
    req.session.user=response
    req.session.userLoggedIn=true

    res.render('user/login')
  })

});
router.post('/login', (req, res) => {
  useracc.Login(req.body).then((response) => {
    if (response.status) {
      
      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/')
    } else {
      eror=req.session.userLoginErr =true
      res.render('user/login',{eror})
    }
  })
});
router.get('/logout', (req, res) => {
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
});
router.get('/cart', verifyLogin,async(req, res) => {
  let products=await useracc.getCart(req.session.user._id)
  let total=await useracc.getTotalAmount(req.session.user._id)
  
  res.render('user/cart',{products,user:req.session.user,total})
});
router.get('/add-to-cart/:id',(req, res) => {
  useracc.addToCart(req.params.id,req.session.user._id).then(() => {
    res.json(response)
    
  })
});
router.post('/change-quantity',(req,res,next)=>{
  useracc.changeQuantity(req.body).then(async(response)=>{
    response.total=await useracc.getTotalAmount(req.body.userID)
    res.json(response)    
  })
});
router.get('/remove-item/:id',(req,res)=>{
  
  useracc.removeItem(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/cart')
  })
});
router.get('/place-order',verifyLogin,async(req,res)=>{
  let total=await useracc.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
});
router.post('/place-order',async(req,res)=>{
  let products=await useracc.getCartProductList(req.body.userId)
  let totalPrice=await useracc.getTotalAmount(req.body.userId)
  useracc.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
      res.json({status:true})
    }else{  
          
            
      useracc.onlinePayment(orderId).then((response)=>{
        res.redirect(response)

      })
    }
    
    
  })
  
});
router.get('/order',verifyLogin,async(req,res)=>{
  let order=await useracc.getOrder(req.session.user._id)
   
  res.render('user/order',{order,user:req.session.user})
});
router.get('/remove-order-products/:id',async(req,res)=>{
  useracc.removeOrderedProduct(req.params.id).then(()=>{
    res.redirect('/order')
  })
});
router.get('/view-order-products/:id',verifyLogin,async(req,res)=>{
  let orderItem=await useracc.getOrderedProduct(req.params.id)
   console.log(orderItem);
  res.render('user/view-orderd-product',{orderItem,user:req.session.user})
});



module.exports = router;
