var inputImage = $('#dp-input');
var resultNode = $('#crop-figure');
var cropNode = $('#save-crop');
var imageMode = 'dp';
// Set up the Load Image options
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
    // if (data.imageHead) {
    //   if (data.exif) {
    //     // Reset Exif Orientation data:
    //     loadImage.writeExifData(data.imageHead, data, 'Orientation', 1)
    //   }
    //   img.toBlob(function (blob) {
    //     if (!blob) return
    //     loadImage.replaceHead(blob, data.imageHead, function (newBlob) {
    //       content
    //         .attr('href', loadImage.createObjectURL(newBlob))
    //         .attr('download', 'image.jpg')
    //     })
    //   }, 'image/jpeg')
    // }
}
function displayImage(file) {
    var options = {
      maxWidth: resultNode.width(),
      canvas: true,
      pixelRatio: window.devicePixelRatio,
    //   downsamplingRatio: 0.5,
    //   orientation: Number(orientationNode.val()) || true,
    //   imageSmoothingEnabled: imageSmoothingNode.is(':checked'),
      meta: true
    }
    if (!loadImage(file, updateResults, options)) {
      // removeMetaData()
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
    // var margin = img.width / pixelRatio >= 140 ? 40 : 0;
    var margin = 0;
    var aspectRatio;
    if(imageType == 'dp'){
      aspectRatio = 1;
    } else{
      aspectRatio = 3;
    }
    console.log(aspectRatio);
    console.log(imageType);
    imgNode
      // eslint-disable-next-line new-cap
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
  
  // Attach the event handlers for the profile picture and cover picture input fields
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
  displayImage(file);
  setTimeout(function(){
    initCrop(event, mode);
    imageMode = mode;
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
      // pixelRatio: pixelRatio,
      // imageSmoothingEnabled: imageSmoothingNode.is(':checked')
    })
  );
  setTimeout(function(){
    // displayImage(img);
    img = resultNode.find('img, canvas')[0];
    img.toBlob(function(blob) {
      // Use the blob object
      cropData = blob;
      const formData = new FormData();
      formData.append('image', cropData, 'image.jpg');
      const csrftoken = getCookie('csrftoken');
      formData.append('csrfmiddlewaretoken', csrftoken);
      formData.append('mode', imageMode);
      // var cropData = img.toBlob('image/jpeg');
      $.ajax({
        url: '/upload_image/',
        method: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: function(response) {
          if (response.image_url) {
            // Redirect the user to the newly uploaded image
            console.log(response.image_url);
            if (imageMode == 'dp') $("#dp-img").attr('src', response.image_url);
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