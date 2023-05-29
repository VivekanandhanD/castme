$("#bottom-nav-icons a").css('color', '#999999');
try {
  $("#bottom-nav-" + location.pathname.split('/')[1]).css('color', 'white'); 
} catch (error) {
  
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Check if the cookie name matches the given name
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
}
$(function() {
  $.contextMenu({
      selector: '.post-thumb',
      trigger: 'left',
      callback: function(key, options, i, j) {
          var m = "clicked: " + key;
          console.log(m);
          console.log(options.$trigger[0].id);
          console.log(i);
          if (key === 'pin'){
            pinPost(options.$trigger[0].id);
          }
      },
      items: {
          "pin": {name: "Pin Post", icon: function(i,j,k,l){
            if(editProfile)
              j.html('<i class="fas fa-thumbtack"></i> Pin Post');
            else
              j.remove();
          }}
      }
  });

  $('.post-thumb').on('contextmenu', function(e){
      e.preventDefault();
      console.log('clicked', this);
  })
  $(document).bind("contextmenu",function(e){
    return false;
  });
});