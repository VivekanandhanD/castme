var inputImage = $('#dp-input');
var resultNode = $('#crop-figure');
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
    if (data.imageHead) {
      if (data.exif) {
        // Reset Exif Orientation data:
        loadImage.writeExifData(data.imageHead, data, 'Orientation', 1)
      }
      img.toBlob(function (blob) {
        if (!blob) return
        loadImage.replaceHead(blob, data.imageHead, function (newBlob) {
          content
            .attr('href', loadImage.createObjectURL(newBlob))
            .attr('download', 'image.jpg')
        })
      }, 'image/jpeg')
    }
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
      removeMetaData()
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
    console.log(event);
    var imgNode = resultNode.find('img, canvas');
    var img = imgNode[0];
    var pixelRatio = window.devicePixelRatio || 1;
    var margin = img.width / pixelRatio >= 140 ? 40 : 0;
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
    $("#crop-picture").modal("show");
    event.preventDefault()
    var originalEvent = event.originalEvent
    var target = originalEvent.dataTransfer || originalEvent.target
    var file = target && target.files && target.files[0]
    if (!file) {
      return
    }
    displayImage(file);
    initCrop(event, 'dp');
});

$('#cover-picture-input').on('change', function(event) {
    initCrop(event, 'cover');
});
