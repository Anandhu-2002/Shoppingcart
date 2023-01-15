function addToCart(proid){
       
    $.ajax({
        url:'/add-to-cart/'+proid,
        method:'get',
        success:(response)=>{
            if(response.addPro){
                let count = $('#cart-count').html()
                        count = parseInt(count)+1
                        $('#cart-count').html(count)
                

            }
           
        }
    })
}
$('.toggle').click(function () {
    "use strict";
    $('nav ul').slideToggle();
});



$(window).resize(function () {
    "use strict";
    if ($(window).width() > 780) {
        $('nav ul').removeAttr('style');
    }
});

// function darkMode() {
//     var element = document.body;
//     var di=document.getElementById("divco");
//     var content = document.getElementById("DarkModetext");
//     element.className = "dark-mode";
//     di.className="divcol";
//     content.innerText = "Dark Mode is ON";
//   }
//   function lightMode() {
//     var element = document.body;
//     var di=document.getElementById("divco");
//     var content = document.getElementById("DarkModetext");
//     element.className = "light-mode";
//     di.className="divcoll";
//     content.innerText = "Dark Mode is OFF";
//   }