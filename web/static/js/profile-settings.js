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
        maximumSelectionLength: 10
    });

    // $('#services-input').html('');
    // $.each(cineServices, function(index, value) {
    //     $('#services-input').append($('<option>', {
    //       value: index,
    //       text: value
    //     }));
    // });
    // $('#services-input').select2({
    //     maximumSelectionLength: 10
    // });

    $('#save-btn').on('click', function(){
        var firstname = $('#firstname-input').val();
        var lastname = $('#lastname-input').val();
        var location = $('#location-input').select2('data')[0].text;
        var skillsArr = $('#skills-input').select2('data');
        var skills = [];
        var type = $('input[name="account-type"]:checked').attr('id');
        $.each(skillsArr, function(i, val){
            skills.push(val.text);
        });
        $.ajax({
            url: location.pathname,
            method: 'POST',
            data: JSON.stringify({firstname:firstname, lastname:lastname, location:location, skills:skills, accounttype:type}),
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(xhr, status, response) {
                if(status == 'success') {
                    let searchParams = new URLSearchParams(window.location.search);
                    var next = searchParams.get('next');
                    if (next){
                        window.location.href = next;
                    } else{
                        window.location.reload();
                    }
                }
                else alert(status)
            },
            error: function(xhr, status, error) {
                alert(error);
            }
        });
    });
    // $('input[name="account-type"]').on('change', function(i){
    //     var type = i.target.id;
    //     if(type == 'Business'){
    //         $('#skills-div').addClass('d-none');
    //         $('#services-div').removeClass('d-none');
    //     } else {
    //         $('#services-div').addClass('d-none');
    //         $('#skills-div').removeClass('d-none');
    //     }
    // });
    initInputs();
});

function initInputs(){
    $('#' + accountType).click();
    var locationVal = $('#location-input').find("option:contains('" + userLocation + "')").val();
    $('#location-input').val(locationVal).trigger('change.select2');
    var skillsArr = [];
    $.each(userSkills, function (i, val) {
        skillsArr.push($('#skills-input').find("option:contains('" + val + "')").val());
    });
    $('#skills-input').val(skillsArr).trigger('change.select2');
    // var servicesArr = [];
    // $.each(userServices, function (i, val) {
    //     servicesArr.push($('#services-input').find("option:contains('" + val + "')").val());
    // });
    // $('#services-input').val(servicesArr).trigger('change.select2');
}