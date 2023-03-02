$(document).ready(function() {
    $.each(cities, function(index, val) {
        $('#location-input').append($('<option>', {
          value: val.id,
          text: val.name + ', ' + val.state
        }));
    });
    $('#location-input').select2({
        placeholder: 'Select a city'
    });
    // $('#location-input').on('select2:open', function(e) {
    //     // Wait for the Select2 dropdown to be shown
    //     setTimeout(function() {
    //       // Get the current search input element
    //       var $searchField = $($('.select2-search input')[1]);
    
    //       // Set the cursor to the end of the text
    //       var val = $searchField.val();
    //       $searchField.focus().val('').val(val);
    //     }, 100);
    // });
    $('#skills-input').html('');
    $.each(cineSkillsets, function(index, value) {
        $('#skills-input').append($('<option>', {
          value: index,
          text: value
        }));
    });
    $('#skills-input').select2({
        maximumSelectionLength: 4
    });
});