var inputImage = $('#dp-input');
var resultNode = $('#crop-figure');
var cropNode = $('#save-crop');
var imageMode = 'dp';
$('.edit-btn').hide();
const loadImageOptions = {
    maxWidth: 500,
    maxHeight: 500,
    canvas: true,
    crop: true,
    orientation: true,
    contain: true,
};
  
  // Function to upload the image to the server
function uploadImage(file, imageType) {
    const formData = new FormData();
    formData.append('image', file);
  
    $.ajax({
      url: '/upload_image/',
      method: 'POST',
      data: formData,
      contentType: false,
      processData: false,
      success: function(data) {
        // Update the profile picture or cover picture on the page
        if (imageType === 'profile') {
          $('#profile-picture').attr('src', data.image_url);
        } else if (imageType === 'cover') {
          $('#cover-picture').attr('src', data.image_url);
        }
      },
      error: function(error) {
        console.log(error);
      }
    });
}
  
function updateResults(img, data, keepMetaData) {
    var isCanvas = window.HTMLCanvasElement && img instanceof HTMLCanvasElement
    if (!(isCanvas || img.src)) {
      resultNode
        .children()
        .replaceWith($('<span>Loading image file failed</span>'))
      return
    }
    var content = $('<a></a>').append(img)
    resultNode.children().replaceWith(content)
}
function displayImage(file) {
  console.log(parseInt($("#crop-picture").children().css('width').replace('px','')));
    var options = {
      canvas: true,
      pixelRatio: window.devicePixelRatio,
      maxWidth: parseInt($("#crop-picture").children().css('width').replace('px','')),
      meta: true
    }
    if (!loadImage(file, updateResults, options)) {
      resultNode
        .children()
        .replaceWith(
          $(
            '<span>' +
              'Your browser does not support the URL or FileReader API.' +
              '</span>'
          )
        )
    }
}

function initCrop(event, imageType) {
    var imgNode = resultNode.find('img, canvas');
    var img = imgNode[0];
    var pixelRatio = window.devicePixelRatio || 1;
    var margin = 0;
    var aspectRatio;
    if(imageType == 'dp'){
      aspectRatio = 1;
    } else if(imageType == 'cp'){
      aspectRatio = 4;
    }
    imgNode
      .Jcrop(
        {
          setSelect: [
            margin,
            margin,
            img.width / pixelRatio - margin,
            img.height / pixelRatio - margin
          ],
          aspectRatio: aspectRatio,
          onSelect: function (coords) {
            coordinates = coords
          },
          onRelease: function () {
            coordinates = null
          }
        },
        function () {
          jcropAPI = this
        }
      )
      .parent()
      .on('click', function (event) {
        event.preventDefault()
      });
}

$('#dp-input').on('change', function(event) {
    cropModal(event, 'dp');
});

$('#cp-input').on('change', function(event) {
    cropModal(event, 'cp');
});

function cropModal(event, mode){
  $("#crop-picture").modal("show");
  event.preventDefault()
  var originalEvent = event.originalEvent
  var target = originalEvent.dataTransfer || originalEvent.target
  var file = target && target.files && target.files[0]
  if (!file) {
    return
  }
  setTimeout(function(){
    displayImage(file);
    setTimeout(function(){
      initCrop(event, mode);
      imageMode = mode;
    },100);
  },500);
}

cropNode.on('click', function (event) {
  event.preventDefault();
  var img = resultNode.find('img, canvas')[0];
  var pixelRatio = window.devicePixelRatio || 1;
  var cropData;
  updateResults(
    loadImage.scale(img, {
      left: coordinates.x * pixelRatio,
      top: coordinates.y * pixelRatio,
      sourceWidth: coordinates.w * pixelRatio,
      sourceHeight: coordinates.h * pixelRatio,
      maxWidth: resultNode.width() * pixelRatio,
      contain: true,
    })
  );
  setTimeout(function(){
    img = resultNode.find('img, canvas')[0];
    img.toBlob(function(blob) {
      cropData = blob;
      const formData = new FormData();
      formData.append('image', cropData, 'image.jpg');
      const csrftoken = getCookie('csrftoken');
      formData.append('csrfmiddlewaretoken', csrftoken);
      formData.append('mode', imageMode);
      $.ajax({
        url: '/upload_image/',
        method: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: function(response) {
          if (response.image_url) {
            if (imageMode == 'dp') $(".dp-img").attr('src', response.image_url);
            else location.reload();
            $("#crop-picture").modal("hide");
          } else if (response.error) {
            alert(response.error);
          } else {
            alert('Unknown error');
          }
        },
        error: function(xhr, status, error) {
          alert('Failed to upload the image');
        }
      });
    }, 'image/png', 1);
  }, 100);
});

try {if (editProfile) $('.edit-btn').show();} catch (error) {}

function postThumbs(list){
  var colCount = 1;
  var template = '<div class="row g-2 mb-2">';
  list.forEach(p => {
    console.log(p['_source']['img']);
    var thumbDiv = '<div class="col"><img src="' + '/img/' + p['_source']['img'] + '" alt="post'+ colCount +'" class="w-100 rounded-3"></div>';
    template += thumbDiv;
    if(colCount % 3 == 0){
      template += '</div><div class="row g-2 mb-2">';// + template + '</div>';
    }
    // template += thumbDiv;
    colCount++;
  });
  if(colCount % 3 !== 0){
    console.log(colCount%3);
    for(let i = 0; i < colCount%3; i++){
      template += '<div class="col"></div>';
    }
  }
  // template += '</div>'
  $('#posts-div').append(template);
}

$(document).ready(function(){
  $.ajax({
    url: '/posts',
    method: 'GET',
    data: {'profileId': location.pathname.split('/').at(-1)},
    success: function(response) {
      console.log(response);
      if (response.error) {
        alert(response.error);
        return;
      }
      postThumbs(response.list);
    },
    error: function(xhr, status, error) {
      alert('Internal error please try again after sometime.');
    }
  });
});