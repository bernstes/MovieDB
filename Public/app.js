$('.ui.selection.dropdown')
    .dropdown();

//$('.ui.rating')
    //.rating();

$('#searchItem').click(function() {
    var title = $('.prompt').val();
    $.ajax({
        type: 'GET',
        url: '/search?title=' + title,
    });
});