$( ".passwordVisibilityToggle" ).change(function() {
    if ($( "#showPassword:checked" ).length===1){
        $('#password').get(0).type = 'text';
    } else {
        $('#password').get(0).type = 'password';
    }
});
