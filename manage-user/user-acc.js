var db=require('../dbconnection/connection')
var collection=require('../dbconnection/collections')
const bcrypt=require('bcrypt')
const { response } = require('express')
const async = require('hbs/lib/async')
var objectId=require('mongodb').ObjectId

module.exports={
    Signup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data)
                
            })
            
        })
        
    },
    Login:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({ Email:userData.Email })
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        response.user=user;
                        response.status=true;
                        resolve(response)
                    }
                    else{
                        resolve({status:false})
                    }

                })
            }else{
                resolve({status:false})
            }

        })
    },
    addToCart:(proId,userId)=>{
        
        let proObj={
            Item:objectId(proId),
            Quantity:1
            
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})

            if(userCart){
                let proExits=userCart.product.findIndex(products=>products.Item==proId)
                if(proExits!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'product.Item':objectId(proId)},{
                        $inc:{'product.$.Quantity':1}
                    

                    }).then((response)=>{
                    resolve({addPro:false})
                })
                }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},{
                   
                        $push:{product:proObj}
                    
                }).then((response)=>{
                    resolve({addPro:true})
                })
            }
            }else{
                let cartObj={
                    user:objectId(userId),
                    product:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve({addPro:true})
                })
            }
        })
    },
    getCart:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },
                {
                    $project:{
                        Item:'$product.Item',
                        Quantity:'$product.Quantity'
                        
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'Item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        Item:1,
                        Quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{items:'$product'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id',"$$items"]
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.product.length
            }
            resolve(count)
        })
    },
    changeQuantity:(product)=>{
        product.count=parseInt(product.count)
        product.qnty=parseInt(product.qnty)
        
        return new Promise(async(resolve,reject)=>{
            if(product.count==-1 && product.qnty==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(product.cart)},{
                    $pull:{product:{Item:objectId(product.product)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                    
            })
            }else{

            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(product.cart),'product.Item':objectId(product.product)},{
                $inc:{'product.$.Quantity':product.count},
                
                
            }).then((response)=>{
                resolve({status:true})
                
        })
          }
        })
    
    },
    removeItem:(proId,uId)=>{
    
        
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(uId)},{
                
                $pull:{product:{Item:objectId(proId)}}
            }).then((response)=>{
                resolve()
                
        })

        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})

       
            let Total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },
                {
                    $project:{
                        Item:'$product.Item',
                        Quantity:'$product.Quantity'
                        
                       
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'Item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        Item:1,
                        Quantity:1,
                        
                        product:{$arrayElemAt:['$product',0]}
                    }
                },
                { $addFields: {
                    Price: {$toInt:"$product.Price" }   
                 }
                    
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:["$Quantity","$Price"]}}
                    }
                }
            ]).toArray()
            
            if(Total[0]){
                resolve(Total[0].total)
            }
            else{
                resolve()
            }
            

        })
    },
    placeOrder:(order,products,total)=>{
    


        return new Promise(async(resolve,reject)=>{
            let status=order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    address:order.address,
                    mobile:order.mobile,
                    pincode:order.pincode
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                total:total,
                status:status,
                date:new Date().toJSON().slice(0,10)
            

            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                resolve(response.insertedId)
                
            })
        })
    },
    getCartProductList:(userID)=>{


        return new Promise(async(resolve,reject)=>{
            let cartProducts=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userID)})
            resolve(cartProducts.product)

        })
    },
    getOrder:(userID)=>{


        return new Promise(async(resolve,reject)=>{
            
           
            
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userID)}).toArray()
            
            resolve(orders)


        })
    },
    removeOrderedProduct:(Id)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({_id:objectId(Id)}).then((response)=>{
                resolve()
                
        })


        })
    },
    getOrderedProduct:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        Item:'$products.Item',
                        Quantity:'$products.Quantity'
                        
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'Item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        Item:1,
                        Quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }

            ]).toArray()
           
            resolve(orderItems)


        })
    },
    onlinePayment:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            
                // Set the UPI payment address for the transaction
                const upiAddress = "abhirajtr007-1@okhdfcbank";
            
                // Set the amount for the transaction
                const amount = "2.00";
            
                // Set the transaction reference ID
                const trxnRefId = orderId;
            
                // Create the UPI deep link
                const upiLink = `upi://pay?pa=${upiAddress}&am=${amount}&tn=${trxnRefId}`;
            
                // Redirect the user to the UPI app
                resolve(upiLink)
           
        })

    }
    
}