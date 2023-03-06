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

    $('#save-btn').on('click', function(){
        var firstname = $('#firstname-input').val();
        var lastname = $('#lastname-input').val();
        var location = $('#location-input').select2('data')[0].text;
        var skillsArr = $('#skills-input').select2('data');
        var skills = [];
        $.each(skillsArr, function(i, val){
            skills.push(val.text);
        });
        console.log(skills);
        $.ajax({
            url: location.pathname,
            method: 'POST',
            data: JSON.stringify({firstname:firstname, lastname:lastname, location:location, skills:skills}),
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(xhr, status, response) {
                if(status == 'success') window.location.reload();
                else alert(status)
            },
            error: function(xhr, status, error) {
                alert(error);
            }
        });
    });

    initInputs()
});

function initInputs(){
    var locationVal = $('#location-input').find("option:contains('" + userLocation + "')").val();
    $('#location-input').val(locationVal).trigger('change.select2');
    var skillsArr = [];
    $.each(userSkills, function (i, val) {
        skillsArr.push($('#skills-input').find("option:contains('" + val + "')").val());
    });
    $('#skills-input').val(skillsArr).trigger('change.select2');
}