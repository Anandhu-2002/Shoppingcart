const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var product=require('../manage-products/products');
const adminacc = require('../manage-user/admin-acc');
const verifyLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  }
  else {
    res.redirect('/admin/adminlogin')
  }
};

/* GET users listing. */
router.get('/',(req,res)=>{
  res.render('admin/view-products',{admin:true});
});

router.get('/adminlogin',(req,res)=>{
  res.render('admin/adminlogin',{admin:true})
})
router.post('/adminlogin',(req,res)=>{
  adminacc.adminLogin(req.body.uname,req.body.pass).then((response) => {
    console.log(response);
    if (response) {
        req.session.admin=response
        
        product.viewProducts().then((products)=>{
        let i=0
        res.render('admin/view-products',{admin:true,products,i});
    
      })
    } else {
       
      res.redirect('/admin/adminlogin')
    }
  })
})


router.get('/add-products',verifyLogin,function(req,res){
  res.render('admin/add-products',{admin:true});
});
router.post('/add-products',(req,res)=>{

  
  product.addProducts(req.body,(id)=>{
    
    let image=req.files.Image
    image.mv('./public/product-img/'+id+'.jpg',(err)=>{
     if(!err){
        res.render('admin/add-products',{admin:true});
     }else{
       console.log('error')
     }
    })
    
  });
  
});
router.get('/delete-product/:id',verifyLogin,(req,res)=>{
  let productId=req.params.id
  product.deleteProducts(productId).then((response)=>{
    res.redirect('/admin')
  })
});
router.get('/edit-product/:id',async(req,res)=>{
  let prodetails=await product.getproductDetails(req.params.id)
  
  res.render('admin/edit-product',{prodetails,admin:true})
});
router.post('/edit-product/:id',verifyLogin,(req,res)=>{
  product.updateProducts(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
     let image=req.files.Image
    image.mv('./public/product-img/'+req.params.id+'.jpg')
    }
  })
});

module.exports = router;
