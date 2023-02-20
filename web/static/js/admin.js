$(document).ready(function(){
    $('#user-list').DataTable({
        ajax: {
            url: '/sunday/',
            dataSrc: 'data'
        },
        serverSide: true,
//        processing: true,
        searching: false,
//        columns: ['id', 'email', 'date_joined', 'count'],
        columns: [
          { "data": "id" },
          { "data":"email" },
          { "data":"date_joined" },
          {
            "data":"jobs",
            "render": function(data, type, row){
                var status = '<div class="row">';
                data = data.split(",");
                var pending = parseInt(data[0]);
                var inprogress = parseInt(data[1]);
                var completed = parseInt(data[2]);
                var failed = parseInt(data[3]);
                if (pending > 0){
                    value = (pending/5) * 100;
                    status += '<div class="table-light cl-sm px-0" style="width:' + value + '%;">' + data[0] + '</div>'
                }
                if (inprogress > 0){
                    value = (inprogress/5) * 100;
                    status += '<div class="table-warning cl-sm px-0" style="width:' + value + '%;">' + data[1] + '</div>'
                }
                if (completed > 0){
                    value = (completed/5) * 100;
                    status += '<div class="table-success cl-sm px-0" style="width:' + value + '%;">' + data[2] + '</div>'
                }
                if (failed > 0){
                    value = (failed/5) * 100;
                    status += '<div class="table-danger cl-sm px-0" style="width:' + value + '%;">' + data[3] + '</div>'
                }
                status += '</div>'
                return status;
            }
          }
        ],
//        dataSrc: 'data'
    });
});