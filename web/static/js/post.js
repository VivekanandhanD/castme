var inputImage = $('#p-input');
var resultNode = $('#crop-figure');
var dispNode = $('#disp-figure');
var cropNode = $('#save-crop');
var imageMode = 'dp';
var currentNode = resultNode;
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
      currentNode
        .children()
        .replaceWith($('<span>Loading image file failed</span>'))
      return
    }
    var content = $('<a></a>').append(img)
    currentNode.children().replaceWith(content)
}
function displayImage(file, disp=false) {
  console.log(currentNode.prop('id'));
  var width = parseInt(currentNode.parent().children().css('width').replace('px',''));
  width = width ? width : parseInt(currentNode.parent().css('width').replace('px',''))
  console.log(width);
    var options = {
      canvas: true,
      pixelRatio: 1,
      maxWidth: width,
      meta: true
    }
    // var node = disp ? dispNode : resultNode;
    if (!loadImage(file, updateResults, options)) {
      currentNode
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
    var imgNode = currentNode.find('img, canvas');
    var img = imgNode[0];
    var pixelRatio = window.devicePixelRatio || 1;
    var margin = 1;
    var aspectRatio = 1;
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
            img.width,
            img.height
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

$('#p-input').on('change', function(event) {
    cropModal(event, 'dp');
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
    currentNode = resultNode;
    displayImage(file);
    setTimeout(function(){
      initCrop(event, mode);
      imageMode = mode;
    },100);
  },500);
}

cropNode.on('click', function (event) {
  // event.preventDefault();
  var file = inputImage.prop('files')[0];
  var img = resultNode.find('img, canvas')[0];
  var pixelRatio = 1;
  var cropData;
  currentNode = dispNode;
  updateResults(
    loadImage.scale(img, {
      left: coordinates.x * pixelRatio,
      top: coordinates.y * pixelRatio,
      // sourceWidth: coordinates.w * pixelRatio,
      // sourceHeight: coordinates.h * pixelRatio,
      maxWidth: currentNode.width() * pixelRatio,
      contain: true,
    })
  );
  return;
});

$('#post-btn').on('click', function(){
  const formData = new FormData();
  img = dispNode.find('img, canvas')[0];
  if(img){
    img.toBlob(function(blob) {
      cropData = blob;
      formData.append('image', cropData, 'image.jpg');
    }, 'image/png', 1);
  }
  setTimeout(function(){
    const csrftoken = getCookie('csrftoken');
    formData.append('csrfmiddlewaretoken', csrftoken);
    formData.append('content', $('#post-content').val());
    $.ajax({
      url: '/upload_post/',
      method: 'POST',
      data: formData,
      contentType: false,
      processData: false,
      success: function(response) {
        console.log(response);
        if (response.error) {
          alert(response.error);
        }
      },
      error: function(xhr, status, error) {
        alert('Failed to upload the image');
      }
    });
  }, 1000);
});

function getYTVideo(url){
  var u = new URL(url);
  var vId = new URLSearchParams(u.search).get('v');
  console.log(vId);
}