var ww;
var wh;
var mousex = 0;
var mousey = 0;
var homepagelist;
var mousein=0;
// var profileMenu=0;
var notificationPanel=0;

EIM.API.Info.clearFeeds();

$(document).ready(function() {
    ww = $(window).width();
    wh = $(window).height();

    EIM.Utils.Litebox.litebox();

    $("#notification-icon").mouseover(function(){
        $(".notification-menu-block").fadeIn();
        notificationPanel = 1;
    });
    
    $(".notification-menu-block").mouseleave(function(){
        $(this).stop(true,true).fadeOut();
        notificationPanel = 0;
    });

    $(".police .minus").click(function() {
        var size = parseInt($(".message").css("font-size")) - 2;
        var size2 = parseInt($("ul.answer > li .content").css("font-size")) - 2;
        $(".message").css("font-size", size + "px");
        $("ul.answer > li .content").css("font-size", size2 + "px");
    });
    $(".police .plus").click(function() {
        var size = parseInt($(".message").css("font-size")) + 2;
        var size2 = parseInt($("ul.answer > li .content").css("font-size")) + 2;
        $(".message").css("font-size", size + "px");
        $("ul.answer > li .content").css("font-size", size2 + "px");
    });
});


$(window).click(function(){
    if(notificationPanel ==1){
        $(".notification-menu-block").stop(true,true).fadeOut();
        notificationPanel = 0;
    }
});

$(window).resize(function() {
    ww = $(window).width();
    wh = $(window).height();

    EIM.Utils.Litebox.liteboxSize();
});

$(document).on("mousemove", function(event) {
    //$( "#log" ).text( "pageX: " + event.pageX + ", pageY: " + event.pageY );
    mousex = event.pageX;
    mousey = event.pageY;
});
