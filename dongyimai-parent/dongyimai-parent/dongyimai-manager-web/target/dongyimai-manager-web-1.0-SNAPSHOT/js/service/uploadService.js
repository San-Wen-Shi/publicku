app.service('uploadService',function ($http) {

    this.uploadFile=function () {

        var formdata = new FormData();//jsp <form>input type=file</form>
        formdata.append("file",file.files[0]);
        return $http({
            method:'POST',
            url:'../upload.do',
            data:formdata,
            headers:{'Content-Type':undefined},//默认json
            transformRequest:angular.identity
        });
    }
})