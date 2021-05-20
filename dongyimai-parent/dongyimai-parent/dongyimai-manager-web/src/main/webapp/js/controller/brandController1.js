app.controller('brandController', function($scope, $http,$controller,brandService) {

    // 继承base的域
    $controller('baseController',{$scope:$scope});

    // 读取列表数据绑定到表单中
    $scope.findAll=function () {
        brandService.findAll().success(
            function (response) {
                $scope.list = response;
            }
        )
    }

    $scope.save=function () {
        if ($scope.entity.id == null)  {
            // 当id为空则进行保存操作
            brandService.add($scope.entity).success(
                function (response) {
                    if (response.success) {
                        //重新查询
                        $scope.reloadList(); // 重新加载
                    } else {
                        alert(response.message);
                    }
                }
            );
        } else {
            brandService.update($scope.entity).success(
                function (response) {
                    if (response.success) {
                        //重新查询
                        $scope.reloadList(); // 重新加载
                    } else {
                        alert(response.message);
                    }
                }
            );
        }
    }

    // 修改回显数据, 让$scope.entity有了id
    $scope.findOne=function (id) {
        brandService.findOne(id).success(
            function (response) {
                $scope.entity = response;
            }
        );
    }

    // 批量删除
    $scope.dele=function () {
        brandService.dele($scope.selectIds).success(
            function (response) {
                if (response.success) {
                    //重新查询
                    $scope.reloadList(); // 重新加载
                } else {
                    alert(response.message);
                }
            }
        );
    }

    $scope.searchEntity={};
    $scope.search=function (page,rows) {
        brandService.search(page,rows,$scope.searchEntity).success(
            function (response) {
                $scope.list = response.rows;
                $scope.paginationConf.totalItems = response.total;
            }
        );
    }

});