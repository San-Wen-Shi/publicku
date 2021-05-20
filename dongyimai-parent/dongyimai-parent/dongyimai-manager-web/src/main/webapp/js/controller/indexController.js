app.controller('indexController',function ($scope,loginService) {

    // 读取当前登录人
    $scope.name=function () {
        loginService.name().success(
            function (response) {
                $scope.loginName=response.loginName;
            }
        );
    }
})